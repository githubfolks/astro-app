import sys
import os

# Ensure we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, SQLALCHEMY_DATABASE_URL
from app import models
from scripts.create_first_admin_user import create_admin

def reset_database():
    print("Resetting database...")
    try:
        connection = engine.connect()
        from sqlalchemy import text
        # Disable auto-commit for transaction? No, just run.
        transaction = connection.begin()
        
        print("Dropping aadikarta_db schema with CASCADE...")
        connection.execute(text("DROP SCHEMA IF EXISTS aadikarta_db CASCADE;"))
        connection.execute(text("CREATE SCHEMA aadikarta_db;"))
        connection.execute(text("GRANT ALL ON SCHEMA aadikarta_db TO postgres;"))
        
        transaction.commit()
        connection.close()
        
        print("All tables dropped via Schema reset.")

        # Re-bind engine because schema changed? Should be fine.
        
        # Create all tables
        print("Creating all tables...")
        Base.metadata.create_all(bind=engine)
        print("All tables created.")

        # Seed admin
        print("Seeding admin user...")
        create_admin()
        print("Database reset and seeded successfully.")
        
    except Exception as e:
        print(f"Error resetting database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    reset_database()
