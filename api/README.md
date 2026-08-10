python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt

Run command
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

uvicorn app.main:app --reload

## One-time setup: keep api/openapi.json in sync automatically

Run once per clone:

    git config core.hooksPath scripts/git-hooks

This installs a pre-commit hook that regenerates `api/openapi.json` whenever
a commit touches `api/app/**`, so `test_openapi_matches_committed_snapshot`
never goes stale. Without it, you'd need to run
`python scripts/dump_openapi.py` and commit the result by hand after any
route/schema change.
