from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import MessageIn, MessageOut
from app.nlp_model import predict_intent, generate_response
from app.auth import get_current_user
from app.database import get_db
from app.database import SessionLocal
from app.database import Conversation
import time
import asyncio
import threading
from collections import OrderedDict
from datetime import datetime, timedelta
import inspect
import traceback

router = APIRouter()

QUICK_INTENTS = {"calcolo", "saluto", "aiuto", "domanda"}

class ThreadSafeTTLCache:
    def __init__(self, maxsize: int = 500, ttl_seconds: int = 300):
        self.maxsize = maxsize
        self.ttl = timedelta(seconds=ttl_seconds)
        self.lock = threading.Lock()
        self._d = OrderedDict()

    def _evict_if_needed(self):
        while len(self._d) > self.maxsize:
            self._d.popitem(last=False)

    def get(self, key: str) -> Optional[str]:
        now = datetime.utcnow()
        with self.lock:
            item = self._d.get(key)
            if not item:
                return None
            value, expiry = item
            if expiry < now:
                del self._d[key]
                return None
            self._d.move_to_end(key)
            return value

    def set(self, key: str, value: str):
        expiry = datetime.utcnow() + self.ttl
        with self.lock:
            self._d[key] = (value, expiry)
            self._d.move_to_end(key)
            self._evict_if_needed()

RESPONSE_CACHE = ThreadSafeTTLCache(maxsize=1000, ttl_seconds=600)

PROMPT_CACHE = {}

def _save_conversation_bg(user_id: int, message: str, reply: str, intent: str):
    """
    Funzione eseguita in BackgroundTasks.
    Usa SessionLocal per creare una sessione separata (evita di riutilizzare
    la sessione request-bound che potrebbe essere chiusa).
    """
    try:
        db: Session = SessionLocal()
        conv = Conversation(user_id=user_id, message=message, reply=reply, intent=intent)
        db.add(conv)
        db.commit()
        db.close()
    except Exception:
        traceback.print_exc()

async def _maybe_await(func, /, *provided_args, **kwargs):
    """
    Chiama func adattando il numero di argomenti in base alla sua signature.
    - Se func è coroutine -> await func(...)
    - Altrimenti -> esegui in executor per non bloccare il loop.
    """

    sig = inspect.signature(func)
    params = [
        p for p in sig.parameters.values()
        if p.kind in (inspect.Parameter.POSITIONAL_ONLY, inspect.Parameter.POSITIONAL_OR_KEYWORD)
    ]
    n_required = len(params)


    n_to_pass = min(n_required, len(provided_args))
    args_to_pass = tuple(provided_args[:n_to_pass])

    accepts_var_pos = any(p.kind == inspect.Parameter.VAR_POSITIONAL for p in sig.parameters.values())
    if accepts_var_pos:
        args_to_pass = provided_args

    if inspect.iscoroutinefunction(func):
        return await func(*args_to_pass, **kwargs)
    else:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: func(*args_to_pass, **kwargs))

@router.post("/chat/", response_model=MessageOut)
async def chat(
    msg: MessageIn,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = user.id
    start_time = time.time()
    print(f"🚀 BACKEND RICEVE: '{msg.message}' da user {user_id}")

    try:
        intent = predict_intent(msg.message)
        intent_time = time.time() - start_time
        print(f"🎯 Intent: {intent} (t: {intent_time:.3f}s)")

        cache_key = f"{intent}:{msg.message.strip().lower()}"

        if intent in QUICK_INTENTS:
            print("⚡ QUICK MODE - Skip DB")
            cached = RESPONSE_CACHE.get(cache_key)
            if cached:
                print("⚡ CACHE HIT (quick)")
                reply = cached
            else:
                reply = await _maybe_await(generate_response, msg.message, intent, [])
                if isinstance(reply, str):
                    RESPONSE_CACHE.set(cache_key, reply)
        else:
            print("📚 Caricamento history DB...")
            history_rows = (
                db.query(Conversation)
                .filter(Conversation.user_id == user_id)
                .order_by(Conversation.created_at.desc())
                .limit(5)
                .all()[::-1]
            )
            chat_history = [{"user": r.message, "bot": r.reply} for r in history_rows]
            cached = RESPONSE_CACHE.get(cache_key)
            if cached:
                print("⚡ CACHE HIT (with history fallback)")
                reply = cached
            else:
                reply = await _maybe_await(generate_response, msg.message, intent, chat_history)
                if isinstance(reply, str):
                    RESPONSE_CACHE.set(cache_key, reply)

            print(f"📜 History: {len(history_rows)} msg")

        try:
            background_tasks.add_task(_save_conversation_bg, user_id, msg.message, reply, intent)
        except Exception:
            traceback.print_exc()

        total_time = time.time() - start_time
        print(f"✅ RISPOSTA: {str(reply)[:80]}... (TOTAL: {total_time:.3f}s)")

        return MessageOut(reply=reply, intent=intent, context=[])
    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        print(f"❌ ERRORE: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Errore interno server")