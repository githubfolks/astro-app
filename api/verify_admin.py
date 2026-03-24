import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load production env
load_dotenv(".env.production")

DATABASE_URL = os.getenv("SQLALCHEMY_DATABASE_URL")

if not DATABASE_URL:
    print("Error: SQLALCHEMY_DATABASE_URL not found in .env.production")
    exit(1)

# Supabase URL usually needs a slight adjustment for SQLAlchemy if it uses certain pooling, 
# but we'll try it as is first.
engine = create_engine(DATABASE_URL)

with engine.connect() as connection:
    result = connection.execute(
        text("UPDATE users SET is_verified = TRUE WHERE email = 'admin@test.com'")
    )
    connection.commit()
    print(f"Update successful. Rows affected: {result.rowcount}")

    # Verify
    verify_result = connection.execute(
        text("SELECT email, is_verified FROM users WHERE email = 'admin@test.com'")
    ).fetchone()
    if verify_result:
        print(f"Verified user: {verify_result[0]}, is_verified: {verify_result[1]}")
    else:
        print("User admin@test.com not found in database.")
