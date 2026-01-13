from app.database import engine
from sqlalchemy import text

def add_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE astrologer_profiles ADD COLUMN short_bio VARCHAR"))
            conn.commit()
            print("Successfully added short_bio column.")
        except Exception as e:
            print(f"Error (might already exist): {e}")

if __name__ == "__main__":
    add_column()
