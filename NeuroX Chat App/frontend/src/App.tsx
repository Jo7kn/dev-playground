import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

// Base backend URL (can be overridden in dev):
// REACT_APP_API_URL=http://localhost:5000 npm start
const API_BASE = process.env.REACT_APP_API_URL ?? 'http://127.0.0.1:5000';
const CHAT_URL = `${API_BASE}/chat/`;

// Legacy API key (fallback). Prefer login + JWT.
const DEFAULT_API_KEY = 'chat_bot_api_key_new_user_n_1';


interface Message {
  id: string;
  text: string;
  isBot: boolean;
  intent?: string;
  timestamp: Date;
}


interface Session {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
}

const themeStyles = {
  dark: {
    background: 'bg-gradient-to-br from-slate-950 via-zinc-950 to-slate-900',
    card: 'bg-white/5 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.45)]',
    accent: 'text-cyan-200',
  },
  ocean: {
    background: 'bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900',
    card: 'bg-white/6 border border-sky-200/10 shadow-[0_20px_60px_rgba(14,165,233,0.25)]',
    accent: 'text-sky-200',
  },
  aurora: {
    background: 'bg-gradient-to-br from-zinc-950 via-purple-950 to-rose-950',
    card: 'bg-white/5 border border-pink-300/15 shadow-[0_20px_60px_rgba(236,72,153,0.25)]',
    accent: 'text-rose-200',
  },
};

type ThemeKey = keyof typeof themeStyles;

const STORAGE_KEYS = {
  userId: 'neuralChatUserId',
  sessions: 'neuralChatSessions',
  theme: 'neuralChatTheme',
  activeSession: 'neuralChatActiveSession',
  accessToken: 'neuralChatAccessToken',
  refreshToken: 'neuralChatRefreshToken',
  apiKey: 'neuralChatApiKey',
};

const getSessionsStorageKey = (userId: string) => `${STORAGE_KEYS.sessions}_${userId}`;
const getActiveSessionStorageKey = (userId: string) => `${STORAGE_KEYS.activeSession}_${userId}`;

const makeId = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const DEFAULT_SESSION_TITLE = 'Inizio conversazione';
const makeSessionTitle = (sessionIndex: number) => `Sessione ${sessionIndex}`;


const App: React.FC = () => {
  const [userId, setUserId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const storedToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!storedToken) return '';
    return window.localStorage.getItem(STORAGE_KEYS.userId) ?? '';
  });

  const [accessToken, setAccessToken] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(STORAGE_KEYS.accessToken) ?? '';
  });

  const [refreshToken, setRefreshToken] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(STORAGE_KEYS.refreshToken) ?? '';
  });

  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_API_KEY;
    return window.localStorage.getItem(STORAGE_KEYS.apiKey) ?? DEFAULT_API_KEY;
  });

  const [theme, setTheme] = useState<ThemeKey>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem(STORAGE_KEYS.theme) as ThemeKey | null;
    return stored && themeStyles[stored] ? stored : 'dark';
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    if (typeof window === 'undefined') return [];
    const storedToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    const storedUserId = window.localStorage.getItem(STORAGE_KEYS.userId);
    if (!storedToken || !storedUserId) return [];

    const stored = window.localStorage.getItem(getSessionsStorageKey(storedUserId));
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored) as Session[];
      return parsed.map((session) => ({
        ...session,
        messages: session.messages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const storedToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    const storedUserId = window.localStorage.getItem(STORAGE_KEYS.userId);
    if (!storedToken || !storedUserId) return '';

    const stored = window.localStorage.getItem(getActiveSessionStorageKey(storedUserId));
    return stored ?? '';
  });

  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [renameModal, setRenameModal] = useState<{ open: boolean; sessionId: string | null; value: string }>({
    open: false,
    sessionId: null,
    value: '',
  });

  const [showLogin, setShowLogin] = useState(false);
  const [loginUserId, setLoginUserId] = useState('');
  const [loginApiKey, setLoginApiKey] = useState(apiKey);
  const [loginPassword, setLoginPassword] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    // When logged in, keep login form in sync with the authenticated user id.
    if (accessToken) {
      setLoginUserId(userId);
    } else {
      setLoginUserId('');
    }
  }, [accessToken, userId]);

  useEffect(() => {
    // Load sessions only after login. Sessions are scoped to each user.
    if (!accessToken || !userId) return;

    const stored = window.localStorage.getItem(getSessionsStorageKey(userId));
    if (!stored) {
      // Initialize with a fresh session if none exist yet.
      const firstSession: Session = {
        id: makeId('session'),
        title: DEFAULT_SESSION_TITLE,
        createdAt: new Date().toISOString(),
        messages: [],
      };
      setSessions([firstSession]);
      setActiveSessionId(firstSession.id);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Session[];
      setSessions(
        parsed.map((session) => ({
          ...session,
          messages: session.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }))
      );
      const active = window.localStorage.getItem(getActiveSessionStorageKey(userId));
      if (active) {
        setActiveSessionId(active);
      }
    } catch {
      setSessions([]);
      setActiveSessionId('');
    }
  }, [accessToken, userId]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = React.useMemo(
    () => activeSession?.messages ?? [],
    [activeSessionId, sessions]
  );

  const filteredMessages = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return messages;
    return messages.filter((m) => m.text.toLowerCase().includes(query));
  }, [messages, searchQuery]);

  const scrollToBottom = (smooth = true) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setIsAtBottom(distanceFromBottom < 48);
  };

  const toggleAutoScroll = () => {
    setAutoScroll((prev) => !prev);
  };

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    if (accessToken && userId) {
      window.localStorage.setItem(STORAGE_KEYS.userId, userId);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.userId);
    }
  }, [accessToken, userId]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  }, [accessToken]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  }, [refreshToken]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
  }, [apiKey]);

  const openRenameModal = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    setRenameModal({ open: true, sessionId, value: session.title });
  };

  const closeRenameModal = () => {
    setRenameModal({ open: false, sessionId: null, value: '' });
  };

  const renameSession = (sessionId: string, newTitle: string) => {
    const normalized = newTitle.trim();
    if (!normalized) return;

    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: normalized } : s))
    );
    closeRenameModal();
  };

  const deleteSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const confirmed = window.confirm(
      `Eliminare la sessione "${session.title}"? Questa azione è irreversibile.`
    );
    if (!confirmed) return;

    const nextSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(nextSessions);

    if (activeSessionId === sessionId) {
      if (nextSessions.length) {
        setActiveSessionId(nextSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  useEffect(() => {
    // Sessions are only persisted for logged-in users. For anonymous users we keep an in-memory session.
    if (!accessToken || !userId) {
      const anonSession: Session = {
        id: 'anon',
        title: 'Sessione anonima',
        createdAt: new Date().toISOString(),
        messages: [],
      };
      setSessions([anonSession]);
      setActiveSessionId(anonSession.id);
      return;
    }

    if (sessions.length === 0) {
      const firstSession: Session = {
        id: makeId('session'),
        title: DEFAULT_SESSION_TITLE,
        createdAt: new Date().toISOString(),
        messages: [],
      };
      setSessions([firstSession]);
      setActiveSessionId(firstSession.id);
      return;
    }

    if (!activeSessionId || !sessions.some((s) => s.id === activeSessionId)) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId, accessToken, userId]);

  useEffect(() => {
    if (!accessToken || !userId || !activeSessionId) return;
    window.localStorage.setItem(getActiveSessionStorageKey(userId), activeSessionId);
  }, [activeSessionId, accessToken, userId]);

  useEffect(() => {
    if (!accessToken || !userId) return;
    window.localStorage.setItem(getSessionsStorageKey(userId), JSON.stringify(sessions));
  }, [sessions, accessToken, userId]);

  useEffect(() => {
    if (autoScroll && isAtBottom) scrollToBottom();
  }, [messages, isAtBottom, autoScroll]);

  useEffect(() => {
    scrollToBottom(false);
    setIsAtBottom(true);
    setSearchQuery('');
  }, [activeSessionId]);

 
  const addMessage = (text: string, isBot: boolean, intent?: string) => {
    const msg: Message = {
      id: Math.random().toString(36),
      text,
      isBot,
      intent,
      timestamp: new Date(),
    };

    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== activeSessionId) return session;

        const updated = {
          ...session,
          messages: [...session.messages, msg],
        };

        if (
          session.title === DEFAULT_SESSION_TITLE &&
          isBot &&
          msg.text.trim().length > 0
        ) {
          const snippet = msg.text.trim().slice(0, 30);
          updated.title = `AI: ${snippet}${snippet.length === 30 ? '…' : ''}`;
        }

        return updated;
      })
    );
  };


  const createNewSession = () => {
    const newSession: Session = {
      id: makeId('session'),
      title: DEFAULT_SESSION_TITLE,
      createdAt: new Date().toISOString(),
      messages: [],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const clearChat = () => {
    createNewSession();
  };

 
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    } else {
      headers['x-api-key'] = apiKey || DEFAULT_API_KEY;
    }

    return headers;
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) return false;

    try {
      const res = await axios.post(
        `${API_BASE}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      setAccessToken(res.data.access_token);
      return true;
    } catch (err) {
      console.warn('Refresh token failed', err);
      return false;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    addMessage(input, false);
    const userInput = input;
    setInput('');
    setLoading(true);

    const doSend = async () => {
      const response = await axios.post(
        CHAT_URL,
        { message: userInput },
        {
          headers: getAuthHeaders(),
          timeout: 30000,
        }
      );
      addMessage(response.data.reply, true, response.data.intent);
    };

    try {
      await doSend();
    } catch (error: any) {
      // If token expired, try refresh once
      if (error?.response?.status === 401 && refreshToken) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          try {
            await doSend();
            return;
          } catch {
            // fall through to show error
          }
        }
      }

      console.error('Chat request failed', error);
      addMessage('🔌 Connessione fallita. Riprova! (vedi console)', true);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // silently ignore
    }
  };

  const handleLogout = () => {
    const previousUserId = userId;
    setAccessToken('');
    setRefreshToken('');
    setApiKey(DEFAULT_API_KEY);
    setUserId('');
    setSessions([]);
    setActiveSessionId('');
    setLoginError(null);

    if (previousUserId) {
      window.localStorage.removeItem(getSessionsStorageKey(previousUserId));
      window.localStorage.removeItem(getActiveSessionStorageKey(previousUserId));
    }
  };

  const rotateApiKey = async () => {
    try {
      const res = await axios.post(
        `${API_BASE}/auth/rotate-key`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 10000,
        }
      );
      setApiKey(res.data.api_key);
      setShowApiKey(true);
    } catch (err: any) {
      console.warn('Unable to rotate key', err);
      setLoginError('Impossibile rigenerare la API key.');
    }
  };

  const getErrorMessage = (err: any): string => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d) => (typeof d === 'string' ? d : d?.msg ?? JSON.stringify(d)))
        .join('; ');
    }
    if (typeof detail === 'object' && detail !== null) {
      return JSON.stringify(detail);
    }
    return err?.message ?? 'Errore sconosciuto';
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      const payload: any = { user_id: Number(loginUserId) };
      if (loginApiKey) payload.api_key = loginApiKey;
      if (loginPassword) payload.password = loginPassword;

      const res = await axios.post(
        `${API_BASE}/auth/token`,
        payload,
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      setAccessToken(res.data.access_token);
      setRefreshToken(res.data.refresh_token);
      setApiKey(res.data.api_key);
      setUserId(String(res.data.user_id));
      setShowLogin(false);
    } catch (err: any) {
      setLoginError(getErrorMessage(err));
    }
  };

  const handleRegister = async (name: string) => {
    setLoginError(null);
    try {
      const payload: any = { name };
      if (loginPassword) payload.password = loginPassword;
      const res = await axios.post(
        `${API_BASE}/auth/register`,
        payload,
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      setAccessToken(res.data.access_token);
      setRefreshToken(res.data.refresh_token);
      setApiKey(res.data.api_key);
      setUserId(String(res.data.user_id));
      setShowLogin(false);
    } catch (err: any) {
      setLoginError(getErrorMessage(err));
    }
  };

  const exportChat = () => {
    const chatLog = messages
      .map((msg) =>
        `${msg.isBot ? '🤖' : '👤'} [${msg.timestamp.toLocaleTimeString()}] ${
          msg.intent ? `[${msg.intent}] ` : ''
        }${msg.text}`
      )
      .join('\n\n');

    const blob = new Blob([chatLog], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuralchat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen ${themeStyles[theme].background} text-white overflow-hidden`}>      
      <div className="relative z-20">
        <div className="max-w-5xl mx-auto px-4 pb-16">
          <header className="flex flex-col gap-4 pt-10 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
              {accessToken && (
                <div className="rounded-full bg-white/10 px-3 py-2 text-xs font-mono text-white/70">
                  ID: {userId}
                </div>
              )}
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                  <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                    NeuroX
                  </span>
                </h1>
                <p className="mt-2 max-w-xl text-sm text-white/70 md:text-base">
                  Chat con un modello LLM locale in tempo reale. Aggiornabile, privato e moderno.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-white/10 px-1 py-1 shadow-xl shadow-black/20 backdrop-blur">
              <button
                onClick={() => setShowLogin(true)}
                className="rounded-full px-4 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10"
              >
                {accessToken ? 'Account' : 'Login'}
              </button>
              {accessToken && (
                <button
                  onClick={handleLogout}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10"
                >
                  Esci
                </button>
              )}

              {(['dark', 'ocean', 'aurora'] as ThemeKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    theme === key
                      ? 'bg-white/20 text-white shadow-md shadow-black/25'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {key === 'dark' ? 'Night' : key === 'ocean' ? 'Ocean' : 'Aurora'}
                </button>
              ))}
            </div>
          </header>

          <main className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
            <aside className={`relative rounded-3xl p-6 ${themeStyles[theme].card} backdrop-blur-md`}
              aria-label="Sidebar cronologia">
              <div className="absolute inset-0 rounded-3xl border border-white/10" />
              <div className="relative z-10 flex h-full flex-col gap-4">
<div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm font-semibold text-white/80">Cronologia</p>
                  <p className="text-xs text-white/50">Sessioni salvate</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca nei messaggi..."
                    className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <button
                    onClick={() => setSearchQuery('')}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-white/60">
                  <span>
                    {filteredMessages.length} di {messages.length} messaggi
                  </span>
                  <button
                    onClick={toggleAutoScroll}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                      autoScroll
                        ? 'bg-cyan-500/20 text-cyan-100'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
                  </button>
                </div>
              </div>

              {accessToken ? (
                <>
                  <div className="flex-1 space-y-2 overflow-y-auto pr-2">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setActiveSessionId(session.id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          session.id === activeSessionId
                            ? 'border-cyan-400/50 bg-cyan-400/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white/90">{session.title}</span>
                              {session.id === activeSessionId && (
                                <span className="text-[11px] text-cyan-200">Attiva</span>
                              )}
                            </div>
                            <div className="mt-1 text-[11px] text-white/40">
                              {new Date(session.createdAt).toLocaleString()}
                            </div>
                            <div className="mt-2 text-[11px] text-white/40">
                              {session.messages.length} messaggi
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRenameModal(session.id);
                              }}
                              className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/70 hover:bg-white/20"
                              title="Rinomina sessione"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id);
                              }}
                              className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/70 hover:bg-white/20"
                              title="Elimina sessione"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={createNewSession}
                      className="w-full rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gradient-to-r hover:from-cyan-500/30 hover:to-purple-500/30"
                    >
                      ➕ Nuova Sessione
                    </button>

                    <div className="text-xs text-white/40">
                      <span className="font-semibold text-white/70">Totale messaggi:</span>{' '}
                      {sessions.reduce((acc, s) => acc + s.messages.length, 0)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-white/50">
                  Accedi per salvare e vedere le tue sessioni.
                </div>
              )}
              </div>
            </aside>

            <section className={`relative rounded-3xl px-6 py-7 ${themeStyles[theme].card} backdrop-blur-md`}>
              <div className="absolute inset-0 rounded-3xl border border-white/10" />
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white/80">Chat</p>
                    <p className="text-xs text-white/50">Conversazioni salvate in memoria locale</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span>
                      Messaggi: {filteredMessages.length} / {messages.length}
                    </span>
                    <span>•</span>
                    <span>Latency: {loading ? 'processing…' : '0.8s avg'}</span>
                  </div>
                </div>

                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="relative h-[56vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 shadow-inner shadow-black/20 scrollbar-thin scrollbar-thumb-white/20 scrollbar-thumb-rounded-lg scrollbar-track-black/20"
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                      <div className="text-7xl">🤖</div>
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-white/80">Benvenuto!</p>
                        <p className="text-sm text-white/60">Digita qualcosa per iniziare. Prova: "ciao", "2+2" o "spiegami la relatività".</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl border p-4 shadow-sm transition-all ${
                              msg.isBot
                                ? 'border-white/10 bg-white/10 text-white/90'
                                : 'border-white/15 bg-white/5 text-white'
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                            <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-white/50">
                              <span>{msg.isBot ? 'Bot' : 'Tu'}</span>
                              <span>{msg.timestamp.toLocaleTimeString()}</span>
                            </div>
                            {msg.intent && (
                              <div className="mt-2 flex items-center gap-2 text-[11px] text-white/40">
                                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                                <span>{msg.intent}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-sm">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 animate-spin" />
                            <div className="space-y-2">
                              <div className="h-3 w-40 rounded-full bg-white/20 animate-pulse" />
                              <div className="h-2 w-28 rounded-full bg-white/15 animate-pulse" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}

                  {!isAtBottom && (
                    <button
                      onClick={() => scrollToBottom()}
                      className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
                    >
                      <span className="text-lg">⬇</span>
                      Scorri in basso
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                    placeholder="Scrivi qui..."
                    className="flex-1 rounded-full border border-white/10 bg-black/20 px-5 py-3 text-sm text-white placeholder:text-white/40 shadow-inner shadow-black/40 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Invio...' : 'Invia'}
                  </button>
                </div>

                <div className="flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={clearChat}
                      disabled={loading}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancella chat
                    </button>
                    <button
                      onClick={exportChat}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 transition hover:bg-white/10"
                    >
                      Esporta log
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span>Cache hit: 87%</span>
                    <span>•</span>
                    <span>DB sync: live</span>
                  </div>
                </div>
              </div>
            </section>
          </main>

          {showLogin && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 animate-fade-in"
              onClick={() => setShowLogin(false)}
            >
              <div
                className="w-full max-w-md rounded-3xl bg-slate-950/95 p-6 shadow-2xl backdrop-blur animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold text-white">Login / Registrazione</h2>
                <p className="mt-2 text-xs text-white/60">
                  Inserisci il tuo ID e la chiave API (o registra un nuovo utente).
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-white/70">User ID</label>
                    <input
                      value={loginUserId}
                      onChange={(e) => setLoginUserId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      placeholder="Es. 1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70">API Key</label>
                    <input
                      value={loginApiKey}
                      onChange={(e) => setLoginApiKey(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      placeholder="Inserisci la tua API key"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70">Password (opzionale)</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      maxLength={72}
                      className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      placeholder="Password (se impostata)"
                    />
                    <p className="mt-1 text-xs text-white/50">
                      Se l'account ha una password puoi usarla invece della API key.
                    </p>
                  </div>

                  {accessToken && (
                    <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-white/70">API Key attuale</div>
                          <div className="mt-1 flex items-center gap-2">
                            <code className="truncate text-xs text-white/80">
                              {showApiKey ? apiKey : '•'.repeat(24)}
                            </code>
                            <button
                              onClick={() => setShowApiKey((prev) => !prev)}
                              className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/70 hover:bg-white/20"
                            >
                              {showApiKey ? 'Nascondi' : 'Mostra'}
                            </button>
                            <button
                              onClick={() => copyToClipboard(apiKey)}
                              className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/70 hover:bg-white/20"
                            >
                              Copia
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={rotateApiKey}
                          className="rounded-full bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                          Rigenera
                        </button>
                      </div>
                    </div>
                  )}

                  {loginError && (
                    <div className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-100">
                      {loginError}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <button
                    onClick={handleLogin}
                    className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 sm:w-auto"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleRegister(`User ${Math.floor(Math.random() * 1000)}`)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10 sm:w-auto"
                  >
                    Crea nuovo utente
                  </button>
                  <button
                    onClick={() => setShowLogin(false)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10 sm:w-auto"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </div>
          )}

          {renameModal.open && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 animate-fade-in"
              onClick={closeRenameModal}
            >
              <div
                className="w-full max-w-md rounded-3xl bg-slate-950/95 p-6 shadow-2xl backdrop-blur animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold text-white">Rinomina sessione</h2>
                <p className="mt-2 text-xs text-white/60">Modifica il nome della sessione selezionata.</p>

                <input
                  value={renameModal.value}
                  onChange={(e) => setRenameModal((prev) => ({ ...prev, value: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && renameModal.sessionId) {
                      renameSession(renameModal.sessionId, renameModal.value);
                    }
                    if (e.key === 'Escape') {
                      closeRenameModal();
                    }
                  }}
                  className="mt-4 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  placeholder="Nuovo nome sessione"
                  autoFocus
                />

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={closeRenameModal}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={() => renameModal.sessionId && renameSession(renameModal.sessionId, renameModal.value)}
                    className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    Salva
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
