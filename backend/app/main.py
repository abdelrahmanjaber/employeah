from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import Depends
from app.db import get_db

app = FastAPI(title="Employeah API")

@app.get("/health")
def health(db: Session = Depends(get_db)):
    # simple DB check
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
