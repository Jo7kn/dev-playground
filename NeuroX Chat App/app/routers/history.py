from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import MessageOut
from app.auth import get_current_user
from app.database import get_db, Conversation
from datetime import datetime, timedelta
from collections import OrderedDict
import threading

router = APIRouter()

DEFAULT_LIMIT = 50
MAX_LIMIT = 200
DEFAULT_OFFSET = 0

class ThreadSafeTTLCache:
    def __init__(self, maxsize: int = 1024, ttl_seconds: int = 60):
        self.maxsize = maxsize
        self.ttl_seconds = ttl_seconds
        self.lock = threading.Lock()
        self._d = OrderedDict()

    def _evict_if_needed(self):
        while len(self._d) > self.maxsize:
            self._d.popitem(last=False)

    def get(self, key):
        now = datetime.utcnow().timestamp()
        with self.lock:
            item = self._d.get(key)
            if not item:
                return None
            value, expiry = item
            if expiry < now:
                try:
                    del self._d[key]
                except KeyError:
                    pass
                return None
            self._d.move_to_end(key)
            return value

    def set(self, key, value):
        expiry = datetime.utcnow().timestamp() + self.ttl_seconds
        with self.lock:
            self._d[key] = (value, expiry)
            self._d.move_to_end(key)
            self._evict_if_needed()

HISTORY_CACHE = ThreadSafeTTLCache(maxsize=2048, ttl_seconds=60)

@router.get("/", response_model=List[MessageOut])
def get_history(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    offset: int = Query(DEFAULT_OFFSET, ge=0),
    use_cache: bool = Query(True, description="Usa cache per richieste recenti (default True)")
):
    user_id = user.id
    """
    Restituisce la cronologia delle conversazioni per l'utente autenticato.

    - `limit`: numero massimo di messaggi da restituire (default 50, max 200)
    - `offset`: offset per paginazione (default 0)
    - `use_cache`: se True prova a leggere dalla cache (TTL 60s)
    """

    try:
        cache_key = f"history:{user_id}:{limit}:{offset}"
        if use_cache:
            cached = HISTORY_CACHE.get(cache_key)
            if cached is not None:
                return cached

        rows = (
            db.query(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        rows_chron = list(reversed(rows))

        out = [
            MessageOut(
                reply=r.reply,
                intent=r.intent,
                context=[f"User: {r.message}\nBot: {r.reply}"]
            )
            for r in rows_chron
        ]
        if use_cache:
            HISTORY_CACHE.set(cache_key, out)

        return out

    except Exception as exc:
        print("Errore get_history:", exc)
        raise HTTPException(status_code=500, detail="Errore nella lettura della history")