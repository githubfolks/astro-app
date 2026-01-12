
from sqlalchemy import create_engine, inspect, text
import os


# Valid credentials from docker-compose.yml (mapped to localhost since we run this script on host)
DATABASE_URL = "postgresql://admin:password123@localhost:5432/postgres"

def inspect_schema():
    try:
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        
        # We need to check the 'astroapp' schema specifically
        schema = 'astroapp'
        
        print(f"--- Tables in Schema '{schema}' ---")
        try:
            tables = inspector.get_table_names(schema=schema)
        except Exception:
            print(f"Schema '{schema}' may not exist. Falling back to default.")
            schema = None # Fallback to default
            tables = inspector.get_table_names()

        for table_name in tables:
            print(f"- {table_name}")

        print(f"\n--- Columns in 'users' table (Schema: {schema}) ---")
        if 'users' in tables:
            columns = inspector.get_columns('users', schema=schema)
            for column in columns:
                print(f"- {column['name']}: {column['type']} (nullable: {column['nullable']})")
                
            print("\n--- Sample Data from 'users' ---")
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT id, phone_number, email, role FROM {schema}.users LIMIT 5"))
                for row in result:
                    print(row)
        else:
            print("Table 'users' not found.")
            
    except Exception as e:
        print(f"Error inspecting DB: {e}")

if __name__ == "__main__":
    inspect_schema()
