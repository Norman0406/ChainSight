import asyncio
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    await asyncio.sleep(1)
    return {"message": "Hello World"}
