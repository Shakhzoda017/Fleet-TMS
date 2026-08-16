import os

from fastapi import APIRouter, FastAPI
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

# Every route lives under /api - the deployed frontend and backend share one
# Vercel domain, and its rewrite rule sends /api/* to this service while
# everything else goes to the frontend. Locally this just means the frontend
# dev config also points at http://127.0.0.1:8000/api.
api = APIRouter(prefix="/api")
api.include_router(auth.router)
api.include_router(trucks.router)
api.include_router(drivers.router)
api.include_router(dispatchers.router)
api.include_router(loads.router)
api.include_router(notes.router)
api.include_router(documents.router)
api.include_router(audit_log.router)
api.include_router(financials.router)
api.include_router(users.router)


@api.get("/health")
def health():
    return {"status": "ok"}


app.include_router(api)
