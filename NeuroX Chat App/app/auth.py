import os
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal, User, get_db


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-immediately")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)


class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None


class TokenData(BaseModel):
    user_id: Optional[int] = None


def create_access_token(*, data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    # bcrypt has a 72-byte maximum password length.
    # Passlib will raise a ValueError if the password is longer, so we guard against that
    # and return a clear HTTP error instead of an internal exception.
    pw_bytes = password.encode("utf-8")
    if len(pw_bytes) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password troppo lunga (max 72 bytes). Usa una password più corta.",
        )

    try:
        return pwd_context.hash(password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


def create_refresh_token(*, user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"user_id": user_id, "exp": expire, "type": "refresh"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_api_key(x_api_key: str = Header(..., alias="x-api-key"), db: Session = Depends(get_db)) -> User:
    """Verifica API key dal DB"""
    user = db.query(User).filter(User.api_key == x_api_key).first()
    if not user:
        raise HTTPException(status_code=401, detail="🔑 API Key non valida")
    return user


def authenticate_user(user_id: int, api_key: Optional[str] = None, password: Optional[str] = None, db: Session = Depends(get_db)) -> Optional[User]:
    """Autentica usando api_key o password (se presente)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    if api_key and user.api_key == api_key:
        return user

    if password and user.password_hash:
        if verify_password(password, user.password_hash):
            return user

    return None


def _get_user_from_token(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token non valido")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token non valido")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utente non trovato")
    return user


def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Ritorna l'utente autenticato.

    Supporta sia Bearer JWT Token sia x-api-key (retrocompatibilità).
    """
    # Se è presente l'header Authorization e abbiamo un token, usiamo JWT
    auth_header = request.headers.get("authorization")
    if auth_header and token:
        return _get_user_from_token(token, db)

    # Altrimenti si prova con x-api-key
    return verify_api_key(x_api_key=request.headers.get("x-api-key", ""), db=db)
