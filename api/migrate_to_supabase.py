
import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.database import Base, SQLALCHEMY_DATABASE_URL
from app.models import User, SeekerProfile, AstrologerProfile, UserWallet, WalletTransaction, Consultation, Review, ChatMessage

# Load env vars
load_dotenv()

# LOCAL Postgres connection
LOCAL_DB_URL = "postgresql://admin:password123@localhost:5432/postgres?options=-csearch_path%3Dastroapp"
local_engine = create_engine(LOCAL_DB_URL)

# Supabase PostgreSQL connection
postgres_engine = create_engine(SQLALCHEMY_DATABASE_URL)

def migrate():
    print("--- Starting Migration from Local Postgres to Supabase ---")
    
    # 1. Create tables in Supabase
    print("Creating tables in Supabase...")
    Base.metadata.create_all(bind=postgres_engine)
    print("Tables created successfully.")

    # 2. Get all tables from models
    tables = [
        User, SeekerProfile, AstrologerProfile, UserWallet, 
        WalletTransaction, Consultation, Review, ChatMessage
    ]

    # 3. Copy data for each table
    for model in tables:
        table_name = model.__tablename__
        print(f"Migrating table: {table_name}...")
        
        # Fetch all from Local Postgres
        try:
            with local_engine.connect() as local_conn:
                result = local_conn.execute(text(f"SELECT * FROM {table_name}"))
                rows = [dict(row._mapping) for row in result]
        except Exception as e:
            print(f"Error reading {table_name} from local: {e}")
            continue
        
        if not rows:
            print(f"No data found in {table_name}.")
            continue

        # Insert into Supabase
        with postgres_engine.begin() as pg_conn:
            # Truncate table first to avoid conflicts
            pg_conn.execute(text(f"TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE"))
            
            # Insert rows
            for row in rows:
                # Convert Enum fields to strings if they are objects
                for key, value in row.items():
                    if hasattr(value, 'value'): # for enum objects
                        row[key] = value.value
                
                cols = ", ".join(row.keys())
                vals = ", ".join([f":{k}" for k in row.keys()])
                insert_stmt = text(f"INSERT INTO {table_name} ({cols}) VALUES ({vals})")
                pg_conn.execute(insert_stmt, row)
        
        print(f"Successfully migrated {len(rows)} rows to {table_name}.")

    print("--- Migration Completed Successfully ---")

if __name__ == "__main__":
    migrate()
