import requests
import json

# Use the token for admin@test.com if possible, or just mock it if we can bypass auth for local test
# But auth is required. We can use the login endpoint first.

BASE_URL = "http://localhost:8000"

def test_admin_users():
    # 1. Login as Admin
    print("Logging in as Admin...")
    try:
        resp = requests.post(f"{BASE_URL}/login", data={"username": "admin@test.com", "password": "adminpassword"})
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")
    except Exception as e:
        print(f"Error during login: {e}")
        return

    # 2. Test Fetch Users with Pagination
    print("\nFetching users (page 0, limit 2)...")
    try:
        resp = requests.get(f"{BASE_URL}/admin/users?skip=0&limit=2", headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            print(f"Success! Total users: {data.get('total')}")
            print(f"Returned users count: {len(data.get('users'))}")
            print("Response structure keys:", data.keys())
        else:
            print(f"Failed to fetch users: {resp.text}")
            
    except Exception as e:
        print(f"Error fetching users: {e}")

    # 3. Test Search
    print("\nTesting Search for 'seeker'...")
    try:
        resp = requests.get(f"{BASE_URL}/admin/users?search=seeker", headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            print(f"Search results total: {data.get('total')}")
            users = data.get('users')
            if users:
                print(f"First user email: {users[0]['email']}")
        else:
            print(f"Search failed: {resp.text}")
    except Exception as e:
        print(f"Error during search: {e}")

if __name__ == "__main__":
    test_admin_users()
