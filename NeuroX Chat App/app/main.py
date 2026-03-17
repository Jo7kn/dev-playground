import os
import sys
import threading
import time
from pathlib import Path
from typing import List, Optional

# When running this file directly (e.g. `python app/main.py`), Python's import
# system sets sys.path[0] to the app/ directory, which prevents `import app` from
# resolving. Ensure the project root is on sys.path so relative imports work.
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.routers import auth, chat, history
import uvicorn


def _get_allowed_origins() -> List[str]:
    raw = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    return [o.strip() for o in raw.split(",") if o.strip()]


def _security_headers(response: Response) -> None:
    # https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("X-XSS-Protection", "1; mode=block")
    response.headers.setdefault(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload",
    )
    response.headers.setdefault("Permissions-Policy", "interest-cohort=()")
    response.headers.setdefault(
        "Content-Security-Policy",
        "default-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; connect-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;",
    )


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        _security_headers(response)
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.lock = threading.Lock()
        self.cache = {}  # ip -> (count, window_start)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        with self.lock:
            count, start = self.cache.get(client_ip, (0, now))
            if now - start > self.window_seconds:
                count = 0
                start = now
            count += 1
            self.cache[client_ip] = (count, start)

            if count > self.max_requests:
                return Response(
                    content="Too many requests", status_code=429, media_type="text/plain"
                )

        return await call_next(request)


app = FastAPI(
    title="🚀 AI Chatbot Pro",
    version="2.0",
    docs_url=None if os.getenv("DISABLE_DOCS") else "/docs",
    redoc_url=None if os.getenv("DISABLE_DOCS") else "/redoc",
    openapi_url=None if os.getenv("DISABLE_OPENAPI") else "/openapi.json",
)

app.add_middleware(SecurityHeadersMiddleware)

# Rate limiting per IP (default: 60 req / 60s)
app.add_middleware(
    RateLimitMiddleware,
    max_requests=int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "60")),
    window_seconds=int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60")),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

if os.getenv("FORCE_HTTPS", "0") in ("1", "true", "True"):
    app.add_middleware(HTTPSRedirectMiddleware)

app.include_router(auth.router, tags=["auth"])
app.include_router(chat.router, tags=["chat"])
app.include_router(history.router, tags=["history"])


@app.get("/health")
async def health():
    return {"status": "healthy", "version": "2.0"}


@app.get("/docs")
async def docs():
    host = os.getenv("APP_HOST", "127.0.0.1")
    port = os.getenv("APP_PORT", "5000")
    base = f"http://{host}:{port}"
    return {"docs": f"{base}/docs", "health": f"{base}/health"}


if __name__ == "__main__":
    uvicorn.run(
        app,
        host=os.getenv("APP_HOST", "127.0.0.1"),
        port=int(os.getenv("APP_PORT", "5000")),
        log_level=os.getenv("LOG_LEVEL", "info"),
    )
