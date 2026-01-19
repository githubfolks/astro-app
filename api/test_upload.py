import requests
import os

# Config
API_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "adminpassword"

def test_upload():
    # 1. Login
    print(f"Logging in as {ADMIN_EMAIL}...")
    login_payload = {
        "username": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    response = requests.post(f"{API_URL}/login", data=login_payload)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    print("Login successful.")

    # 2. Upload
    print("Uploading file to Cloudinary via Admin API...")
    headers = {"Authorization": f"Bearer {token}"}
    files = {'file': ('test_image.png', b'fake image content', 'image/png')}
    
    upload_res = requests.post(f"{API_URL}/admin/upload", headers=headers, files=files)
    
    if upload_res.status_code == 200:
        print("Upload successful!")
        print(f"Response: {upload_res.json()}")
    else:
        print(f"Upload failed: {upload_res.status_code} - {upload_res.text}")

if __name__ == "__main__":
    test_upload()
