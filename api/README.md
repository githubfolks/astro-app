python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt

Run command
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

uvicorn app.main:app --reload
