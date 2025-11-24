from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")

llm = ChatGroq(
    temperature=0.7, 
    model_name="llama-3.3-70b-versatile", 
    groq_api_key=groq_api_key
)

def generate_section_text(doc_title: str, section_header: str):
    """Generates initial content for a section."""
    prompt = f"""
    You are writing a professional business document about '{doc_title}'.
    Write a detailed section (approx 200 words) for the header: '{section_header}'.
    Return ONLY the content, no introductory text.
    """
    response = llm.invoke(prompt)
    return response.content

def refine_section_text(current_text: str, instruction: str):
    """Refines existing text based on user instruction."""
    prompt = f"""
    Refine the following text based on this instruction: "{instruction}".
    
    Current Text:
    {current_text}
    
    Return ONLY the refined text.
    """
    response = llm.invoke(prompt)
    return response.content