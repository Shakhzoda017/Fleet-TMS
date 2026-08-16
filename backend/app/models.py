import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class SoftDeleteMixin:
    deleted_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True, default=None)
    deleted_by: Mapped[str | None] = mapped_column(String, nullable=True, default=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String, default="")
    role: Mapped[str] = mapped_column(String, default="dispatcher")  # admin | dispatcher | updater
    hashed_password: Mapped[str] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(default=True)


class Truck(Base, SoftDeleteMixin):
    __tablename__ = "trucks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    truck_number: Mapped[str] = mapped_column(String, unique=True, index=True)
    status: Mapped[str] = mapped_column(String, default="Vacant")  # Rolling | Shop | Vacant | Attention
    dot_exp_date: Mapped[str | None] = mapped_column(String, nullable=True)
    cc_exp_date: Mapped[str | None] = mapped_column(String, nullable=True)
    current_location: Mapped[str | None] = mapped_column(String, nullable=True)
    fuel_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    make: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    drivers: Mapped[list["Driver"]] = relationship(back_populates="truck")


class Driver(Base, SoftDeleteMixin):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, index=True)
    company: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="No Status")
    cdl_exp: Mapped[str | None] = mapped_column(String, nullable=True)
    mc_exp: Mapped[str | None] = mapped_column(String, nullable=True)
    current_location: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    truck_id: Mapped[int | None] = mapped_column(ForeignKey("trucks.id"), nullable=True)

    truck: Mapped["Truck | None"] = relationship(back_populates="drivers")
    loads: Mapped[list["Load"]] = relationship(back_populates="driver")


class Dispatcher(Base, SoftDeleteMixin):
    __tablename__ = "dispatchers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, index=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Load(Base, SoftDeleteMixin):
    __tablename__ = "loads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    load_number: Mapped[str] = mapped_column(String, unique=True, index=True)
    status: Mapped[str] = mapped_column(String, default="Upcoming")
    rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    pickup_location: Mapped[str | None] = mapped_column(String, nullable=True)
    pickup_date: Mapped[str | None] = mapped_column(String, nullable=True)
    delivery_location: Mapped[str | None] = mapped_column(String, nullable=True)
    delivery_date: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    driver_id: Mapped[int | None] = mapped_column(ForeignKey("drivers.id"), nullable=True)

    driver: Mapped["Driver | None"] = relationship(back_populates="loads")
