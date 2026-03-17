# NeuroX Chat App

Una moderna applicazione di chat AI con interfaccia web elegante e backend Python locale. Progettata per offrire conversazioni private e sicure con modelli di linguaggio locali.

## 🚀 Caratteristiche

- **Interfaccia Moderna**: Design glassmorphism con temi dinamici (Dark, Ocean, Aurora)
- **Gestione Sessioni**: Crea, rinomina ed elimina sessioni di chat multiple
- **Ricerca Avanzata**: Cerca nei messaggi all'interno delle sessioni
- **Auto-scroll Intelligente**: Controllo automatico dello scorrimento con toggle manuale
- **Persistenza Locale**: Salvataggio automatico delle sessioni nel browser
- **Titolazione Automatica**: Generazione automatica dei titoli delle sessioni basata sulle risposte AI
- **Esportazione Chat**: Esporta conversazioni in formato testo
- **Backend Locale**: Modello LLM ospitato localmente per privacy massima

## 🛠️ Tecnologie Utilizzate

### Frontend
- **React 18** con TypeScript
- **Tailwind CSS** per lo styling
- **Axios** per le richieste HTTP
- **Vite** come bundler di sviluppo

### Backend
- **Python** con FastAPI
- **Modelli LLM** locali (integrazione con API locali)

## 📁 Struttura del Progetto

```
neurox-chat/
├── frontend/          # Applicazione React
│   ├── src/
│   │   ├── App.tsx    # Componente principale
│   │   ├── index.tsx  # Punto di ingresso
│   │   └── ...
│   ├── package.json
│   └── tailwind.config.js
├── app/               # Backend Python
│   ├── main.py        # Server FastAPI
│   ├── database.py    # Gestione database
│   ├── models.py      # Modelli dati
│   └── ...
├── requirements.txt   # Dipendenze Python
└── test_client.py     # Script di test
```

## 🏃‍♂️ Installazione e Avvio

### Prerequisiti
- Node.js (v16+)
- Python (v3.8+)
- npm o yarn

### Backend (Python)

1. Installa le dipendenze:
```bash
pip install -r requirements.txt
```

2. Avvia il server:
```bash
python app/main.py
```

Il backend sarà disponibile su `http://127.0.0.1:7000`

### Frontend (React)

1. Installa le dipendenze:
```bash
cd frontend
npm install
```

2. Avvia l'applicazione in modalità sviluppo:
```bash
npm start
```

L'app sarà disponibile su `http://localhost:3000`

### Build di Produzione

```bash
cd frontend
npm run build
```

## 🎨 Design e UX

L'interfaccia è stata progettata con un approccio moderno:
- **Glassmorphism**: Effetto vetro con sfondi trasparenti e bordi sfumati
- **Temi Dinamici**: Tre temi predefiniti con transizioni fluide
- **Responsive Design**: Layout adattivo per desktop e mobile
- **Animazioni**: Transizioni smooth per modali e interazioni
- **Accessibilità**: Supporto per navigazione da tastiera e screen reader

## 🔧 Funzionalità Principali

### Gestione Sessioni
- Creazione di nuove sessioni con un click
- Rinominazione tramite modale animata
- Eliminazione con conferma
- Auto-titolazione basata sulla prima risposta AI

### Ricerca e Navigazione
- Ricerca in tempo reale nei messaggi
- Filtro messaggi per sessione attiva
- Scroll automatico con controllo manuale

### Persistenza
- Salvataggio automatico in localStorage
- Ripristino dello stato al riavvio
- Gestione sicura dei dati locali

## 📊 Architettura

### Frontend Architecture
- **Componente Singolo**: App.tsx gestisce tutto lo stato e la logica
- **Hooks Personalizzati**: Utilizzo di useState, useEffect, useRef
- **State Management**: Stato centralizzato con React hooks
- **Styling**: Utility-first con Tailwind CSS

### Backend Architecture
- **FastAPI**: Framework moderno per API REST
- **Modulare**: Separazione tra routing, modelli e logica di business
- **Database**: Integrazione con sistema di persistenza (se presente)

## 🚀 Deployment

### Frontend
L'app può essere deployata su qualsiasi hosting statico:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Backend
Per deployment del backend:
- Railway
- Render
- Heroku
- Server dedicato con Docker

## 🤝 Contributi

Questo progetto è stato sviluppato come dimostrazione di competenze in:
- Sviluppo frontend moderno con React/TypeScript
- Design di interfacce utente eleganti
- Integrazione frontend-backend
- Gestione dello stato e persistenza
- Ottimizzazione delle performance

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT.

## 📞 Contatti

Per domande o collaborazioni, sentiti libero di contattare.

---

*Progetto realizzato da jxhn per dimostrare competenze in sviluppo web moderno*