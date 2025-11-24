# AI-Assisted Document Authoring & Generation Platform

A full-stack web application that uses Artificial Intelligence to generate, refine, and export professional business documents. Users can create Word documents (.docx) and PowerPoint presentations (.pptx) by simply providing a topic and an outline.

---

## 🚀 Features

- **User Authentication**: Secure login and registration using JWT.
- **Project Management**: View and manage document projects.
- **AI Content Generation**: Generates detailed content using Groq (Llama-3).
- **Interactive Editor**:  
  - Manual editing  
  - AI refinement: *Shorten, Expand, Make Formal*  
  - Notes and feedback system
- **Export**: Download formatted `.docx` or `.pptx` files.
- **Responsive UI**: Clean, modern design for all devices.

---

## 🛠️ Tech Stack

### Backend
- Python  
- FastAPI  
- PostgreSQL  
- SQLAlchemy  

### AI Engine
- LangChain  
- Groq API (Llama-3)

### Frontend
- HTML5  
- CSS3  
- JavaScript (Vanilla)

### Document Processing
- python-docx  
- python-pptx  

### Authentication
- python-jose  
- passlib  
- bcrypt  

---

## 📋 Prerequisites

Make sure you have:

- Python **3.8+**
- PostgreSQL (service running)
- Groq API Key (create one at: https://console.groq.com)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
Download or clone the repo to your system.

### 2. Create a Virtual Environment

**Windows**
```bash
python -m venv venv
.\venv\Scripts\activate
```

**Mac/Linux**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Database Configuration

Open PostgreSQL (via terminal, pgAdmin, DBeaver, etc)

```sql
CREATE DATABASE ai_docs_db;
```


---

## 🚀 Running the Application

Activate your virtual environment and start FastAPI:

```bash
python -m uvicorn main:app --reload
```

The backend runs at:

```
http://127.0.0.1:8000
```

Frontend:

```
http://127.0.0.1:8000/static/index.html
```

---

## 📖 How to Use

1. Open the web app in your browser.
2. Register → Login.
3. Create a new project:
   - Enter topic (example: *AI in Healthcare*)
   - Select format (*Word* / *PowerPoint*)
   - Enter section headers (comma-separated)
4. Generate AI content.
5. Edit, refine, add notes.
6. Export the final document.

---

## 📂 Project Structure

```
├── main.py              # FastAPI main application
├── database.py          # DB models and connection
├── auth.py              # Authentication (JWT, hashing)
├── ai_engine.py         # Groq LLM content generation
├── doc_engine.py        # DOCX/PPTX file generation
├── requirements.txt     # Dependencies
├── .env                 # Environment variables (private)
├── generated_docs/      # Temporary exported documents
└── static/              # Frontend files
    ├── index.html
    ├── style.css
    └── script.js
```
