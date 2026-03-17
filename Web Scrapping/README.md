# 📊 eBay Price Tracker

Un sistema completo di tracking prezzi per prodotti eBay con **dashboard web interattiva**, storico dei prezzi e aggiornamento automatico.

---

## Caratteristiche

- Estrazione automatica del prezzo da eBay
- Salvataggio storico dei prezzi in `data.csv`
- Dashboard web interattiva con grafico dell’andamento prezzi
- Visualizzazione prezzo attuale, minimo e massimo
- Ciclo automatico per aggiornamento prezzi ogni ora

---

## Tecnologie utilizzate

- Python 3.10+
- `requests` & `BeautifulSoup` per scraping
- `pandas` per gestione dati
- `streamlit` per la dashboard web
- `re` per parsing prezzi

---

## Installazione

1. Clona il repository

```bash
git clone https://github.com/tuo-username/ebay-price-tracker.git
cd ebay-price-tracker