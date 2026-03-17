import pandas as pd
import matplotlib.pyplot as plt

file = "data.csv"
df = pd.read_csv(file)
df["date"] = pd.to_datetime(df["date"])

plt.figure(figsize=(10,5))
plt.plot(df["date"], df["price"], marker='o', linestyle='-')
plt.xlabel("Data")
plt.ylabel("Prezzo (€)")
plt.title("Andamento prezzo prodotto eBay")
plt.xticks(rotation=45)
plt.grid(True)
plt.tight_layout()
plt.show()