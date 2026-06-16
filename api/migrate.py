import os
import sys
import subprocess
import argparse

def run_command(command):
    print(f"Running: {command}")
    try:
        subprocess.check_call(command, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Database Migration Helper")
    subparsers = parser.add_subparsers(dest="action", help="Action to perform")

    # Create Migration
    create_parser = subparsers.add_parser("create", help="Create a new migration revision")
    create_parser.add_argument("message", help="Migration message")

    # Upgrade
    up_parser = subparsers.add_parser("up", help="Upgrade database")
    up_parser.add_argument("revision", nargs="?", default="head", help="Revision to upgrade to (default: head)")

    # Downgrade
    down_parser = subparsers.add_parser("down", help="Downgrade database")
    down_parser.add_argument("revision", nargs="?", default="-1", help="Revision to downgrade to (default: -1)")

    # Run specific
    run_parser = subparsers.add_parser("run", help="Run dictionary/upgrade to specific revision")
    run_parser.add_argument("revision", help="Revision ID")

    args = parser.parse_args()
    
    # Use venv alembic if available (assuming generic 'alembic' might not be in path or wrong one)
    # But since we are likely running this WITH python, we can just call alembic module or executable.
    # We will assume 'alembic' is in path if this script is run from the same venv.
    # To be safe, let's try to use the same python interpreter's module
    
    base_cmd = f"{sys.executable} -m alembic"

    if args.action == "create":
        # alembic revision --autogenerate -m "message"
        run_command(f'{base_cmd} revision --autogenerate -m "{args.message}"')
    
    elif args.action == "up":
        run_command(f'{base_cmd} upgrade {args.revision}')

    elif args.action == "down":
        run_command(f'{base_cmd} downgrade {args.revision}')
        
    elif args.action == "run":
        run_command(f'{base_cmd} upgrade {args.revision}')

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
