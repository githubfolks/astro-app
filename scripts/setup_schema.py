import sys
import os

# Create the schema 'astroapp'
from sqlalchemy import create_engine, text

# Use the base URL without search path to create schema
# We need to parse the URL from database.py manually or just hardcode for this fix script
# since we can't import database.py if it has the schema in the URL and that schema doesn't exist yet (maybe)
# logical flow: just connect to postgres database directly.

DATABASE_URL = "postgresql://admin:password123@localhost:5432/postgres"

def create_schema():
    engine = create_engine(DATABASE_URL, isolation_level="AUTOCOMMIT")
    with engine.connect() as connection:
        try:
            connection.execute(text("CREATE SCHEMA IF NOT EXISTS astroapp"))
            print("Schema 'astroapp' created or already exists.")
        except Exception as e:
            print(f"Error creating schema: {e}")

if __name__ == "__main__":
    create_schema()
