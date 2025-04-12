from typing import Optional
from pydantic import BaseModel


class Transaction(BaseModel):
    item_id: Optional[int]
    item_name: str
    quantity: int
