import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, SessionLocal, engine
from .routers import audit_log, auth, dispatchers, documents, drivers, financials, loads, notes, trucks, users
from .security import hash_password

Base.metadata.create_all(bind=engine)


def seed_admin():
    db = SessionLocal()
    try:
        if not db.query(models.User).first():
            admin = models.User(
                username=os.environ.get("TMS_ADMIN_USERNAME", "admin"),
                full_name="Admin",
                role="admin",
                hashed_password=hash_password(os.environ.get("TMS_ADMIN_PASSWORD", "admin123")),
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


seed_admin()

app = FastAPI(title="TMS API")

# Comma-separated list of extra allowed origins (e.g. your deployed frontend
# URL) via env var; local dev origins are always included.
_extra_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", *_extra_origins],
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
app.include_router(users.router)


@app.get("/health")
def health():
    return {"status": "ok"}
