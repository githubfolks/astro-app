import asyncio
import json
import requests
import websockets
from datetime import datetime

# Configuration
API_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/chat/ws"

async def astrologer_flow():
    print("--- ASTROLOGER BOT STARTED ---")

    # 1. Login
    print("1. Logging in as Astrologer...")
    response = requests.post(f"{API_URL}/login", data={
        "username": "astro@test.com",
        "password": "password"
    })
    
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return

    token = response.json()["access_token"]
    print("   Login Successful!")

    # 2. Get Consultations (to find the active/requested one)
    # For this test, we might need a consultation ID. 
    # Let's assume we can get the latest one or create one via API if needed.
    # But usually, the seeker creates it. 
    # WE WILL WAIT FOR SEEKER TO CREATE IT.
    # Or, we can just poll for pending consultations.
    
    print("2. Waiting for a consultation...")
    consultation_id = None
    
    while not consultation_id:
        # Fetch consultations assigned to me (or all for test)
        # We need an endpoint for this. Let's try /astrologers/consultations if it exists, 
        # or just assume ID 1 for simplicity if we are the only users.
        # Let's try to fetch user details to get ID first? No, we have token.
        
        # Let's assume the SEED created users, but maybe not a consultation.
        # The SEEKER (Browser) will likely create one.
        # So we need to know WHICH ID to connect to.
        # Hack: Try connecting to ID 1, 2, 3... or just ask the user (me) to input it?
        # Better: Polling an endpoint.
        # Let's look at `consultations.py` router or just Hardcode ID 1 for the first test run.
        consultation_id = 1
        print(f"   Targeting Consultation ID: {consultation_id}")
        break

    # 3. Connect WebSocket
    print(f"3. Connecting to WebSocket for Consultation {consultation_id}...")
    uri = f"{WS_URL}/{consultation_id}?token={token}"
    
    async with websockets.connect(uri) as websocket:
        print("   WebSocket Connected!")
        
        try:
            while True:
                message = await websocket.recv()
                data = json.loads(message)
                # print(f"   Received: {data}")

                if data.get("type") == "NEW_MESSAGE":
                    sender_id = data.get("sender_id")
                    content = data.get("content")
                    print(f"   [CHAT] User {sender_id}: {content}")
                    
                    # If message is from Seeker, REPLY to start timer
                    # We need to know our own ID? Not really, just reply if it's not us.
                    # Or just reply to everything that isn't our own echo (if server echoes).
                    # The server echoes with sender_id.
                    
                    # Verify it's not us (we need to know our ID).
                    # For now, let's just reply if the content is "Hello Astrologer"
                    
                    if "Hello Astrologer" in content:
                        print("   -> Sending Reply to start timer...")
                        reply = {
                            "type": "MESSAGE",
                            "content": "Hello Seeker! I am ready."
                        }
                        await websocket.send(json.dumps(reply))
                        print("   -> Reply Sent!")

                elif data.get("type") == "TIMER_STARTED":
                    print("   *** TIMER STARTED ***")
                
                elif data.get("type") == "CHAT_ENDED":
                    print(f"   *** CHAT ENDED: {data.get('reason')} ***")
                    break
                    
        except websockets.exceptions.ConnectionClosed:
            print("   WebSocket Closed")

if __name__ == "__main__":
    asyncio.run(astrologer_flow())
