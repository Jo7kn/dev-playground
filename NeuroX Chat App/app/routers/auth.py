import os
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional

import jwt
import secrets
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import (
    Token,
    TokenData,
    create_access_token,
    create_refresh_token,
    authenticate_user,
    get_password_hash,
    verify_api_key,
    get_current_user,
)
from app.database import User, get_db


# Simple in-memory rate limiter for auth endpoints.
# Not suitable for multi-process deployment, but OK for local / small deployments.
LOGIN_ATTEMPTS: dict[str, dict[str, object]] = defaultdict(lambda: {"count": 0, "until": datetime.utcnow()})
RATE_LIMIT_LOCK = None

try:
    import threading

    RATE_LIMIT_LOCK = threading.Lock()
except ImportError:
    RATE_LIMIT_LOCK = None

MAX_LOGIN_ATTEMPTS = int(os.getenv("MAX_LOGIN_ATTEMPTS", "10"))
LOCKOUT_SECONDS = int(os.getenv("LOGIN_LOCKOUT_SECONDS", "60"))


def _get_client_ip(request: Request) -> str:
    # X-Forwarded-For support if behind reverse proxy
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _check_rate_limit(request: Request):
    ip = _get_client_ip(request)
    now = datetime.utcnow()

    if RATE_LIMIT_LOCK:
        RATE_LIMIT_LOCK.acquire()
    try:
        entry = LOGIN_ATTEMPTS[ip]
        if entry["until"] > now:
            if entry["count"] >= MAX_LOGIN_ATTEMPTS:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Troppi tentativi, riprova tra {int((entry['until'] - now).total_seconds())}s",
                )
        else:
            entry["count"] = 0
            entry["until"] = now
        entry["count"] += 1
        if entry["count"] >= MAX_LOGIN_ATTEMPTS:
            entry["until"] = now + timedelta(seconds=LOCKOUT_SECONDS)
    finally:
        if RATE_LIMIT_LOCK:
            RATE_LIMIT_LOCK.release()

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    password: Optional[str] = Field(None, min_length=6, max_length=72)


class LoginRequest(BaseModel):
    user_id: int
    api_key: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6, max_length=72)


class RefreshRequest(BaseModel):
    refresh_token: str


class LoginResponse(Token):
    user_id: int
    api_key: Optional[str] = None


@router.post("/register", response_model=LoginResponse)
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    """Registra un nuovo utente e rilascia un'API key."""

    _check_rate_limit(request)

    api_key = secrets.token_urlsafe(24)
    password_hash = get_password_hash(req.password) if req.password else None

    user = User(name=req.name, api_key=api_key, password_hash=password_hash)
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Impossibile registrare l'utente (chiave duplicata)")

    access_token = create_access_token(data={"user_id": user.id})
    refresh_token = create_refresh_token(user_id=user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "user_id": user.id,
        "api_key": api_key,
    }


@router.post("/token", response_model=LoginResponse)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Login usando user_id + api_key o password."""

    _check_rate_limit(request)

    if not req.api_key and not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Devi fornire api_key o password",
        )

    user = authenticate_user(req.user_id, api_key=req.api_key, password=req.password, db=db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenziali non valide")

    access_token = create_access_token(data={"user_id": user.id})
    refresh_token = create_refresh_token(user_id=user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "user_id": user.id,
        "api_key": user.api_key,
    }


@router.post("/refresh", response_model=Token)
def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    """Rinnova l'access token usando il refresh token."""

    try:
        payload = TokenData(**jwt.decode(req.refresh_token, os.getenv("JWT_SECRET_KEY", "change-me-immediately"), algorithms=[os.getenv("JWT_ALGORITHM", "HS256")]))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token non valido")

    if payload.user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token non valido")

    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utente non trovato")

    access_token = create_access_token(data={"user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
def get_me(user=Depends(get_current_user)):
    """Ritorna i dati dell'utente autenticato."""
    return {"user_id": user.id, "name": user.name, "api_key": user.api_key}


@router.post("/rotate-key")
def rotate_key(user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Rigenera l'API key dell'utente autenticato."""
    new_key = secrets.token_urlsafe(24)
    user.api_key = new_key
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"api_key": new_key}


@router.get("/users")
def list_users(
    x_admin_key: Optional[str] = Header(None, alias="x-admin-key"),
    db: Session = Depends(get_db),
):
    """Lista utenti (richiede ADMIN_API_KEY)."""
    required = os.getenv("ADMIN_API_KEY")
    if not required or x_admin_key != required:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accesso negato")

    users = db.query(User).all()
    return [
        {"id": u.id, "name": u.name, "api_key": u.api_key}
        for u in users
    ]
