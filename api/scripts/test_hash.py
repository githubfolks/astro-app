from passlib.context import CryptContext

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    print("Context created")
    
    password = "adminpassword"
    print(f"Hashing password: {password} (type: {type(password)})")
    
    try:
        hashed = pwd_context.hash(password)
        print(f"Hashed (str): {hashed}")
    except Exception as e1:
        print(f"Failed with str: {e1}")

    try:
        hashed_bytes = pwd_context.hash(password.encode('utf-8'))
        print(f"Hashed (bytes): {hashed_bytes}")
    except Exception as e2:
        print(f"Failed with bytes: {e2}")
    
    print("Testing bcrypt directly...")
    import bcrypt
    try:
        salt = bcrypt.gensalt()
        hashed_direct = bcrypt.hashpw(password.encode('utf-8'), salt)
        print(f"Bcrypt direct success: {hashed_direct}")
    except Exception as e3:
        print(f"Bcrypt direct failed: {e3}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
