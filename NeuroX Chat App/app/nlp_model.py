import asyncio
import httpx
import re
import time
import json
import ast
from collections import OrderedDict
from typing import Dict, Optional, List

OLLAMA_URL = "http://localhost:11434/api/generate"


CALC_PATTERN = re.compile(r'(\d+(?:\s*[\+\-\*xX/÷]\s*\d+)+)')

GREETINGS = {"ciao", "hello", "salve", "buongiorno", "buonasera"}

def fast_intent(msg: str) -> str:
    msg = msg.lower()
    if any(op in msg for op in "+-*/x÷"):
        return "calcolo"
    words = set(msg.split())
    if words & GREETINGS:
        return "saluto"
    if "come" in words and ("stai" in words or "va" in words):
        return "domanda"
    if any(w in words for w in ["presidente", "presidenza", "usa", "stati uniti"]):
        return "presidenza"
    return "unknown"

def predict_intent(message: str):
    return fast_intent(message)


class SmartCache:
    def __init__(self, maxsize=500):
        self.cache: Dict[str,str] = OrderedDict()
        self.maxsize = maxsize

    def get(self,key):
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]

    def set(self,key,value):
        self.cache[key] = value
        self.cache.move_to_end(key)
        if len(self.cache) > self.maxsize:
            self.cache.popitem(last=False)

RESPONSE_CACHE = SmartCache()


PROMPT_CACHE = {}


client = httpx.AsyncClient(
    timeout=httpx.Timeout(
        connect=5.0,
        read=60.0,
        write=10.0,
        pool=5.0
    ),
    limits=httpx.Limits(
        max_connections=100,
        max_keepalive_connections=20
    ),
)


async def async_retry(coro_fn, *args, retries: int = 2, base_delay: float = 0.5, **kwargs):
    last_exc = None
    for attempt in range(retries + 1):
        try:
            return await coro_fn(*args, **kwargs)
        except (httpx.ReadTimeout, httpx.ConnectError, httpx.RemoteProtocolError, httpx.NetworkError) as e:
            last_exc = e
            await asyncio.sleep(base_delay * (2 ** attempt))
    raise last_exc


async def ollama_stream(prompt: str) -> str:
    payload = {
        "model": "gemma2:2b",
        "prompt": prompt,
        "stream": True,
        "options": {
            "temperature": 0.2,
            "num_predict": 40
        }
    }

    response_text = ""

    async def _do_stream():
        nonlocal response_text
        async with client.stream("POST", OLLAMA_URL, json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line:
                    continue
                try:
                    part = json.loads(line)
                    token = part.get("response") or part.get("text") or ""
                    response_text += str(token)
                except json.JSONDecodeError:
                    response_text += line
        return response_text

    try:
        return await async_retry(_do_stream, retries=2, base_delay=0.5)
    except httpx.ReadTimeout:
        try:
            fallback_payload = payload.copy()
            fallback_payload["stream"] = False
            r = await client.post(OLLAMA_URL, json=fallback_payload, timeout=httpx.Timeout(30.0))
            r.raise_for_status()
            data = r.json()
            res = data.get("response") or data.get("text") or ""
            return str(res).strip()
        except Exception as e:
            print("ollama_stream fallback failed:", repr(e))
            return ""
    except Exception as e:
        print("ollama_stream error:", repr(e))
        return ""


def _safe_eval_arith(expr: str) -> Optional[float]:
    """
    Valuta in sicurezza espressioni aritmetiche semplici usando AST.
    Supporta numeri interi e float, + - * / **, parentesi e unary +/-.
    """
    expr = expr.replace(",", ".")
    expr = expr.replace("x", "*").replace("X", "*").replace("÷", "/")
    try:
        node = ast.parse(expr, mode="eval")
    except SyntaxError:
        return None

    allowed_nodes = (
        ast.Expression, ast.BinOp, ast.UnaryOp, ast.Num, ast.Constant,
        ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow, ast.Mod, ast.FloorDiv,
        ast.UAdd, ast.USub, ast.Load, ast.Tuple, ast.Call, ast.Name, ast.Subscript
    )

    def _eval(n):
        if isinstance(n, ast.Expression):
            return _eval(n.body)
        if isinstance(n, ast.Constant):
            if isinstance(n.value, (int, float)):
                return n.value
            raise ValueError("Invalid constant")
        if isinstance(n, ast.Num):
            return n.n
        if isinstance(n, ast.BinOp):
            left = _eval(n.left)
            right = _eval(n.right)
            op = n.op
            if isinstance(op, ast.Add):
                return left + right
            if isinstance(op, ast.Sub):
                return left - right
            if isinstance(op, ast.Mult):
                return left * right
            if isinstance(op, ast.Div):
                return left / right
            if isinstance(op, ast.Pow):
                return left ** right
            if isinstance(op, ast.Mod):
                return left % right
            if isinstance(op, ast.FloorDiv):
                return left // right
            raise ValueError("Unsupported operation")
        if isinstance(n, ast.UnaryOp):
            val = _eval(n.operand)
            if isinstance(n.op, ast.UAdd):
                return +val
            if isinstance(n.op, ast.USub):
                return -val
        raise ValueError("Unsupported expression")

    for sub in ast.walk(node):
        if not isinstance(sub, allowed_nodes):
            raise ValueError("Disallowed expression")
    try:
        return _eval(node)
    except Exception:
        return None

def calculate(msg: str) -> Optional[str]:
    match = CALC_PATTERN.search(msg)
    if not match:
        return None
    calc = match.group(1)
    val = _safe_eval_arith(calc)
    if val is None:
        return None
    if isinstance(val, float) and val.is_integer():
        val = int(val)
    return str(val)


async def generate_response(message: str, intent: Optional[str] = None, chat_history: Optional[List[dict]] = None) -> str:
    """
    Compatibile con chiamate sia minimal (message) sia (message, intent, chat_history).
    Se intent è None, lo calcola internamente.
    """
    start_time = time.time()
    
    if intent is None:
        intent = fast_intent(message)

    if intent == "calcolo":
        result = calculate(message)
        if result:
            return f"**{result}** 🎯"

    cache_key = f"{intent}:{message.strip().lower()}"
    cached = RESPONSE_CACHE.get(cache_key)
    if cached:
        print(f"⚡ CACHE HIT!")
        return cached

    if chat_history:
        history_text = "\n".join([f"User: {h.get('user')}\nBot: {h.get('bot')}" for h in chat_history[-5:]])
        prompt = f"{history_text}\nUser: {message}\nRispondi in italiano:"
    else:
        prompt = f"{message}\nRispondi in italiano:"

    print("🤖 Gemma2...")
    response = await ollama_stream(prompt)
    
    if not response.strip():
        fallbacks = {
            "presidenza": "**Donald Trump** (rieletto 2024, in carica dal 2025)",
            "saluto": "Ciao! 👋 Come posso aiutarti oggi?",
            "domanda": "Sto bene, grazie! Sono il tuo AI italiano. 😊",
            "unknown": "Interessante! Dimmi di più...",
            "calcolo": "Prova: **2 + 2** 🎯"
        }
        response = fallbacks.get(intent, "Puoi riformulare?")
        print(f"📜 FALLBACK: {intent}")

  
    print(f"✅ RISPOSTA: {response[:50]}... (TOTAL: {time.time() - start_time:.2f}s)")
    return response

class RequestBatcher:
    def __init__(self):
        self.queue = asyncio.Queue()

    async def worker(self):
        while True:
            message, future = await self.queue.get()
            try:
                result = await generate_response(message)
                future.set_result(result)
            except Exception as e:
                future.set_result("Errore AI")

    async def ask(self, message: str):
        loop = asyncio.get_event_loop()
        future = loop.create_future()
        await self.queue.put((message, future))
        return await future

batcher = RequestBatcher()

async def start():
    for _ in range(5):
        asyncio.create_task(batcher.worker())
    while True:
        msg = input("Tu: ")
        start_time = time.time()
        response = await batcher.ask(msg)
        print("AI:", response)
        print("tempo:", round(time.time() - start_time, 3), "s")

if __name__ == "__main__":
    asyncio.run(start())