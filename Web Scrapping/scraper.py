import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import os
import time
import re

url = "https://www.ebay.it/itm/366283481741"

file = "data.csv"

def scrape_price():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    try:
        res = requests.get(url, headers=headers, timeout=10)
        html = res.text
    except:
        print("Errore richiesta HTTP")
        return

    if "Service Unavailable" in html:
        print("Bloccato da eBay, riprovo dopo...")
        return

    soup = BeautifulSoup(html, "html.parser")

    try:
        title = soup.find("h1").text.strip()
    except:
        title = "Titolo non trovato"

    text_all = soup.get_text()
    prices = re.findall(r"EUR\s*[\d\.,]+", text_all)

    price_clean = None

    if prices:
        values = []

        for p in prices:
            try:
                val = p.replace("EUR", "").replace(".", "").replace(",", ".").strip()
                values.append(float(val))
            except:
                pass

        if values:
            price_clean = max(values)  

    if price_clean is None:
        print("Prezzo non trovato")
        return

    now = datetime.now()
    data = {"date": [now], "price": [price_clean]}
    df = pd.DataFrame(data)

    if os.path.exists(file) and os.path.getsize(file) > 0:
        old = pd.read_csv(file)
        df = pd.concat([old, df])

    df.to_csv(file, index=False)

    print(f"[{now}] {title} -> €{price_clean}")


interval_seconds = 60  # ogni minuto

while True:
    scrape_price()
    print(f"Prossimo scrape tra {interval_seconds/60} minuti...\n") 
    time.sleep(interval_seconds)