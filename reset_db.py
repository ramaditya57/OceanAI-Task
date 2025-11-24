from database import engine, Base
from sqlalchemy import text

# This script will drop existing tables and recreate them with the new schema
def reset_database():
    print("Resetting database...")
    try:
        # 1. Drop all tables defined in your Base models
        # We assume the user is okay deleting dev data
        Base.metadata.drop_all(bind=engine)
        print("Tables dropped.")

        # 2. Recreate tables with new columns (notes, feedback)
        Base.metadata.create_all(bind=engine)
        print("Tables recreated successfully with new schema!")
        
    except Exception as e:
        print(f"Error resetting database: {e}")

if __name__ == "__main__":
    reset_database()