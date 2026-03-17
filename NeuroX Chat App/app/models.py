from pydantic import BaseModel
from typing import List

class MessageIn(BaseModel):
    message: str

class MessageOut(BaseModel):
    reply: str
    intent: str
    context: List[str]

    class Config:
        from_attributes = True
