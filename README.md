AI-Assisted Document Authoring & Generation Platform

A full-stack web application that uses Artificial Intelligence to generate, refine, and export professional business documents. Users can create Word Documents (.docx) and PowerPoint Presentations (.pptx) by simply providing a topic and an outline.

🚀 Features

User Authentication: Secure Login and Registration using JWT (JSON Web Tokens).

Project Management: Dashboard to view and manage existing document projects.

AI Content Generation: Generates detailed content for each section/slide using Groq (Llama-3).

Interactive Editor:

Manual Editing: Edit generated text directly.

AI Refinement: Ask AI to "Shorten", "Make Formal", or "Expand" specific sections.

Feedback System: Like/Dislike generations.

Notes: Add private notes to sections.

Export: Download the final result as a formatted .docx or .pptx file.

Responsive UI: Modern, clean interface that works on desktop and mobile.

🛠️ Tech Stack

Backend: Python, FastAPI

Database: PostgreSQL, SQLAlchemy

AI Engine: LangChain, Groq API (Llama-3 model)

Frontend: HTML5, CSS3, JavaScript (Vanilla)

Document Processing: python-docx, python-pptx

Authentication: python-jose, passlib, bcrypt

📋 Prerequisites

Before running the project, ensure you have the following installed:

Python 3.8+

PostgreSQL (Make sure the service is running)

Groq API Key (Get one for free at console.groq.com)

⚙️ Installation & Setup

1. Clone the Repository

Download the project files to your local machine.

2. Create a Virtual Environment

It is recommended to use a virtual environment to manage dependencies.

# Windows
python -m venv venv
.\venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate


3. Install Dependencies

Install all required Python packages from the requirements.txt file.

pip install -r requirements.txt


4. Database Configuration

You need to create a database in PostgreSQL for the application.

Open your terminal or a tool like pgAdmin / DBeaver.

Log in to PostgreSQL: psql -U postgres

Run the following SQL command:

CREATE DATABASE ai_docs_db;


5. Configure Environment Variables

Create a file named .env in the root directory and add the following configuration.

Note: Update the DATABASE_URL with your specific PostgreSQL password.


🚀 Running the Application

Ensure your virtual environment is activated.

Start the FastAPI server using uvicorn.

python -m uvicorn main:app --reload


The application will start at: http://127.0.0.1:8000

The backend will automatically create the necessary database tables (users, projects, sections) on the first run.

📖 How to Use

Access the App: Open your browser and go to http://127.0.0.1:8000/static/index.html.

Register: Click "Need an account? Register" to create a new user.

Login: Use your new credentials to log in.

Create Project:

Enter a Topic (e.g., "AI in Healthcare").

Select Format (Word or PowerPoint).

Enter Section Headers separated by commas (e.g., "Intro, Benefits, Challenges, Conclusion").

Click Generate AI Content.

Edit & Refine:

Click on a section to view the content.

Use the "AI Refine" button to ask the AI to change the text.

Switch to the "Notes" tab to save private notes.

Export: Click the Download File button at the top right to get your .docx or .pptx file.

📂 Project Structure

├── main.py              # Main FastAPI application & API endpoints
├── database.py          # Database connection & SQLAlchemy Models
├── auth.py              # Authentication logic (Password hashing, JWT)
├── ai_engine.py         # Logic for interacting with Groq LLM
├── doc_engine.py        # Logic for creating Word/PPT files
├── requirements.txt     # List of dependencies
├── .env                 # Environment variables (Sensitive data)
├── generated_docs/      # Folder where exported files are saved temp
└── static/              # Frontend Files
    ├── index.html       # Main User Interface
    ├── style.css        # Styling
    └── script.js        # Frontend Logic & API calls