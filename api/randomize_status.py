from sqlalchemy import create_engine, text
import random

# Use the same URL as identifying in docker-compose but formatted for python on host if possible
# If running inside container, use host.docker.internal. 
# But I am running this script FROM THE HOST with venv.
DATABASE_URL = "postgresql://admin:password123@localhost:5432/postgres?options=-csearch_path%3Dastroapp"

def randomize():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Connected to DB.")
        try:
            # 1. Get all astrologer user_ids
            result = conn.execute(text("SELECT user_id FROM astrologer_profiles")).fetchall()
            ids = [row[0] for row in result]
            print(f"Found {len(ids)} astrologers.")
            
            # 2. Randomly update them
            for uid in ids:
                is_online = random.choice([True, False])
                # Also add some random availability hours if offline?
                hours = "Mon-Fri 9AM-5PM" if not is_online else None
                
                # Raw update
                sql = text("UPDATE astrologer_profiles SET is_online = :status WHERE user_id = :uid")
                conn.execute(sql, {"status": is_online, "uid": uid})
                print(f"Updated User {uid}: Online={is_online}")
                
            conn.commit()
            print("Randomization Complete.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    randomize()
