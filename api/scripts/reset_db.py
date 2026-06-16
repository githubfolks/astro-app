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
        
        # Reflect all tables to ensure we catch everything or just drop widely
        print("Dropping all tables with CASCADE...")
        # Hard nuke approach for Postgres specific
        connection.execute(text("DROP SCHEMA public CASCADE;"))
        connection.execute(text("CREATE SCHEMA public;"))
        connection.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
        connection.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        
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
