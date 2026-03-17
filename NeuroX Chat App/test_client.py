import requests
import json
import time

API_URL = "http://127.0.0.1:7000/chat/"
API_KEY = "chat_bot_api_key_new_user_n_1"

def chat(message: str):
    payload = {"message": message}
    headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
    }
    
    for attempt in range(3):
        try:
            print(f"🔄 Tentativo {attempt+1}/3...")
            response = requests.post(
                API_URL, 
                json=payload, 
                headers=headers, 
                timeout=30
            )
            print(f"✅ STATUS: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Bot: {data['reply']}")
                print(f"Intent: {data['intent']}")
                return
            else:
                print(f"❌ {response.status_code}: {response.text}")
                
        except requests.exceptions.ReadTimeout:
            print("⏳ Timeout - ritento...")
            time.sleep(2)
        except Exception as e:
            print(f"❌ Errore: {e}")
            break
    
    print("❌ Fallito dopo 3 tentativi")

if __name__ == "__main__":
    print("🚀 AI CHATBOT PRO - Scrivi 'quit' per uscire")
    while True:
        msg = input("\nYou: ").strip()
        if msg.lower() in ['quit', 'exit', 'q']:
            print("👋 Ciao!")
            break
        chat(msg)
