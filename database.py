from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Automatic configuration for SQLite vs PostgreSQL
if "sqlite" in DATABASE_URL:
    # SQLite needs this specific argument to work with FastAPI
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL configuration
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    doc_type = Column(String) # 'docx' or 'pptx'
    user_id = Column(Integer, ForeignKey("users.id"))
    sections = relationship("Section", back_populates="project")

class Section(Base):
    __tablename__ = "sections"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text, default="") # The AI generated text
    order_index = Column(Integer)

    notes = Column(Text, default="")
    feedback = Column(String, default="")

    project_id = Column(Integer, ForeignKey("projects.id"))
    project = relationship("Project", back_populates="sections")

# Create tables automatically when app starts
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()