import streamlit as st
import pandas as pd

st.set_page_config(page_title="Price Tracker", layout="wide")
st.title("📊 eBay Price Tracker")

file = "data.csv"

try:
    df = pd.read_csv(file)
    df["date"] = pd.to_datetime(df["date"])
except:
    st.error("Nessun dato trovato. Avvia prima lo scraper.")
    st.stop()

latest_price = df["price"].iloc[-1]
min_price = df["price"].min()
max_price = df["price"].max()

col1, col2, col3 = st.columns(3)
col1.metric("💰 Prezzo attuale", f"{latest_price} €")
col2.metric("📉 Prezzo minimo", f"{min_price} €")
col3.metric("📈 Prezzo massimo", f"{max_price} €")

st.subheader("📈 Andamento prezzo")
st.line_chart(df.set_index("date")["price"])

st.subheader("📋 Storico dati")
st.dataframe(df)

st.caption("Aggiorna la pagina per vedere nuovi dati")