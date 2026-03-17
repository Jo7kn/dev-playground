# 📊 eBay Price Tracker + Mini App AI

Un progetto completo di **tracking prezzi** per prodotti eBay con **storico prezzi**, **dashboard web interattiva** e **mini app AI** per predizione e consigli di acquisto.

---

## Caratteristiche principali

- Scraping automatico dei prezzi da eBay
- Salvataggio storico dei prezzi in `data.csv`
- Dashboard web interattiva con grafico dei prezzi
- Analisi dati automatica (prezzo medio, minimo, massimo, trend)
- Mini App AI per predizione dei prezzi futuri e consigli intelligenti
- Ciclo automatico per aggiornamento prezzi ogni ora
- Possibilità di multi prodotto (espandibile)

---

## Tecnologie utilizzate

- Python 3.10+
- `requests` & `BeautifulSoup` → scraping
- `pandas` → gestione dati
- `streamlit` → dashboard web
- `scikit-learn` → predizione prezzo
- `matplotlib` → grafici
- `re` → parsing prezzi

---

## Installazione

1. Clona il repository:

```bash
git clone https://github.com/tuo-username/ebay-price-tracker.git
cd ebay-price-tracker
