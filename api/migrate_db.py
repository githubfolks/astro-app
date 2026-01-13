import sqlalchemy
from sqlalchemy import create_engine, text
import os

# Use the same connection string as docker-compose but ensure it works
# If running inside docker container, host.docker.internal is correct.
DATABASE_URL = "postgresql://admin:password123@host.docker.internal:5432/postgres?options=-csearch_path%3Dastroapp"

def migrate():
    print(f"Connecting to database...")
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as connection:
            print("Adding is_active column to users table...")
            # Check if column exists first to avoid error? Or just try add
            try:
                connection.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;"))
                connection.commit()
                print("Successfully added is_active column.")
            except Exception as e:
                print(f"Error executing ALTER TABLE (might already exist): {e}")
                
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    migrate()
