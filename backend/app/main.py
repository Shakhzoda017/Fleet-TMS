from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models
from .database import Base, SessionLocal, engine
from .routers import audit_log, auth, dispatchers, documents, drivers, financials, loads, notes, trucks
from .security import hash_password

Base.metadata.create_all(bind=engine)


def seed_admin():
    db = SessionLocal()
    try:
        if not db.query(models.User).first():
            admin = models.User(
                username="admin",
                full_name="Admin",
                role="admin",
                hashed_password=hash_password("admin123"),
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


seed_admin()

app = FastAPI(title="TMS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(trucks.router)
app.include_router(drivers.router)
app.include_router(dispatchers.router)
app.include_router(loads.router)
app.include_router(notes.router)
app.include_router(documents.router)
app.include_router(audit_log.router)
app.include_router(financials.router)

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok"}
