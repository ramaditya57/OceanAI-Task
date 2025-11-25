from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse # Added RedirectResponse
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional
import os
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt

from database import get_db, Project, Section, User
import ai_engine
import doc_engine
import auth

app = FastAPI()

# Mount the static folder to serve HTML/JS directly
app.mount("/static", StaticFiles(directory="static", html=True), name="static")

# --- FIX: Redirect Root URL to Index HTML ---
@app.get("/")
def read_root():
    return RedirectResponse(url="/static/index.html")
# --------------------------------------------

# Security Scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Pydantic Models for Inputs ---
class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ProjectCreate(BaseModel):
    title: str
    doc_type: str # 'docx' or 'pptx'
    sections: List[str] # List of section titles

class RefineRequest(BaseModel):
    section_id: int
    instruction: str

class SectionUpdate(BaseModel):
    content: Optional[str] = None
    notes: Optional[str] = None
    feedback: Optional[str] = None

# --- Auth Dependencies ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# --- Auth Endpoints ---

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pw = auth.get_password_hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# --- API Endpoints ---

@app.post("/projects/")
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    # 1. Create Project
    db_project = Project(title=project.title, doc_type=project.doc_type, user_id=1) # Mocking user_id 1
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # 2. Create Sections & Trigger AI for each
    for index, title in enumerate(project.sections):
        # Generate initial AI content
        ai_content = ai_engine.generate_section_text(project.title, title)
        
        db_section = Section(
            title=title, 
            content=ai_content, 
            order_index=index, 
            project_id=db_project.id
        )
        db.add(db_section)
    
    db.commit()
    return {"message": "Project created and content generating", "project_id": db_project.id}

@app.get("/projects/my")
def get_my_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Only get projects for the logged in user
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    return projects

@app.get("/projects/{project_id}")
def get_project(project_id: int, 
                db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    
    # FIX: Use joinedload to force loading sections
    project = db.query(Project).options(joinedload(Project.sections)).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this project")
        
    return project

# --- Refinement & Updates ---

@app.post("/refine/")
def refine_content_preview(request: RefineRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Generates the refined text but DOES NOT save it. 
    Returns it for the user to Approve/Decline.
    """
    section = db.query(Section).filter(Section.id == request.section_id).first()
    if not section or section.project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Generate preview only
    new_content = ai_engine.refine_section_text(section.content, request.instruction)
    return {"section_id": section.id, "preview_content": new_content}

@app.put("/sections/{section_id}")
def update_section(section_id: int, update_data: SectionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    General purpose endpoint to update Content (Manual or AI applied), Notes, or Feedback.
    """
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section or section.project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if update_data.content is not None:
        section.content = update_data.content
    
    if update_data.notes is not None:
        section.notes = update_data.notes
        
    if update_data.feedback is not None:
        section.feedback = update_data.feedback

    db.commit()
    return {"message": "Section updated", "section": section}

@app.get("/export/{project_id}")
def export_document(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Sort sections by order
    project.sections.sort(key=lambda x: x.order_index)

    if project.doc_type == "docx":
        filepath = doc_engine.generate_word_doc(project.title, project.sections)
    else:
        filepath = doc_engine.generate_ppt_doc(project.title, project.sections)
        
    return FileResponse(filepath, filename=os.path.basename(filepath), media_type='application/octet-stream')

# Run this if debugging directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)