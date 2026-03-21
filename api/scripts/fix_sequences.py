import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the parent directory to sys.path to import app modules
api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_dir)

from app.database import SQLALCHEMY_DATABASE_URL

def fix_sequences():
    print(f"Connecting to database to sync sequences...")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    # List of tables to sync
    tables = [
        "users",
        "chat_messages",
        "consultations",
        "wallet_transactions",
        "reviews",
        "verification_tokens",
        "posts",
        "pages",
        "horoscopes",
        "payouts",
        "device_tokens",
        "contact_inquiries",
        "kundli_reports"
    ]

    for table in tables:
        try:
            # PostgreSQL command to sync the sequence with the max ID
            # Sequence name is typically {table_name}_{column_name}_seq
            seq_name = f"{table}_id_seq"
            
            # Check if table has any data
            res = session.execute(text(f"SELECT MAX(id) FROM {table}")).fetchone()
            max_id = res[0]
            
            if max_id is not None:
                query = f"SELECT setval('{seq_name}', {max_id})"
                session.execute(text(query))
                print(f"Synced sequence for '{table}' to {max_id}")
            else:
                print(f"Table '{table}' is empty, skipping sequence update.")
                
        except Exception as e:
            print(f"Warning: Could not sync sequence for table '{table}': {str(e).splitlines()[0]}")
    
    session.commit()
    session.close()
    print("\nDatabase sequences are now synchronized.")

if __name__ == "__main__":
    fix_sequences()
