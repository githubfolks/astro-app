import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, inspect
from app.database import SQLALCHEMY_DATABASE_URL, Base
from app import models

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    connection = engine.connect()
    print("Successfully connected to the database.")
    
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Existing tables: {tables}")
    
    if "users" in tables:
        print("Table 'users' exists.")
        columns = [c['name'] for c in inspector.get_columns("users")]
        print(f"Columns in 'users': {columns}")
        if "hashed_password" not in columns:
            print("CRITICAL: 'hashed_password' column is MISSING!")
    else:
        print("Table 'users' NOT found. Attempting to create all tables...")

    connection.close()

except Exception as e:
    print(f"An error occurred: {e}")
    import traceback
    traceback.print_exc()
