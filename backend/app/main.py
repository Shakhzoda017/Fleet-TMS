from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, SessionLocal, engine
from .routers import auth, dispatchers, drivers, loads, trucks
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


@app.get("/health")
def health():
    return {"status": "ok"}
