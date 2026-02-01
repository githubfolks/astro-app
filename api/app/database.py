from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Determine environment: 'development' (default) or 'production'
app_env = os.getenv("APP_ENV", "development")
env_file = f".env.{app_env}"

# Load the specific env file
# override=False (default) ensures that system environment variables (like from Docker) 
# take precedence over values in the .env file.
load_dotenv(env_file)

# Configured for PostgreSQL
# Use environment variable for Docker/Production, fallback to localhost for local dev
SQLALCHEMY_DATABASE_URL = os.getenv(
    "SQLALCHEMY_DATABASE_URL", 
    "postgresql://admin:password123@localhost:5432/postgres?options=-csearch_path%3Dpublic"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
