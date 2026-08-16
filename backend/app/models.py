import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, LargeBinary, String, Text
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
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
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
    payment_status: Mapped[str] = mapped_column(String, default="Unpaid")
    rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    broker: Mapped[str | None] = mapped_column(String, nullable=True)
    dh_miles: Mapped[float | None] = mapped_column(Float, nullable=True)
    trip_miles: Mapped[float | None] = mapped_column(Float, nullable=True)
    pickup_location: Mapped[str | None] = mapped_column(String, nullable=True)
    pickup_date: Mapped[str | None] = mapped_column(String, nullable=True)
    delivery_location: Mapped[str | None] = mapped_column(String, nullable=True)
    delivery_date: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    driver_id: Mapped[int | None] = mapped_column(ForeignKey("drivers.id"), nullable=True)
    dispatcher_id: Mapped[int | None] = mapped_column(ForeignKey("dispatchers.id"), nullable=True)

    driver: Mapped["Driver | None"] = relationship(back_populates="loads")
    dispatcher: Mapped["Dispatcher | None"] = relationship()


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String, index=True)  # driver | load | truck
    entity_id: Mapped[int] = mapped_column(Integer, index=True)
    author: Mapped[str] = mapped_column(String)
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String, index=True)  # driver | load
    entity_id: Mapped[int] = mapped_column(Integer, index=True)
    label: Mapped[str] = mapped_column(String)  # CDL, Med card, RC, BOL, Pods, Invoice, ...
    content: Mapped[bytes] = mapped_column(LargeBinary)
    content_type: Mapped[str] = mapped_column(String)
    original_filename: Mapped[str] = mapped_column(String)
    number: Mapped[str | None] = mapped_column(String, nullable=True)
    state: Mapped[str | None] = mapped_column(String, nullable=True)
    issue_date: Mapped[str | None] = mapped_column(String, nullable=True)
    exp_date: Mapped[str | None] = mapped_column(String, nullable=True)
    uploaded_by: Mapped[str] = mapped_column(String)
    uploaded_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)


class AuditLogEntry(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, index=True)
    staff: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)  # created | updated | deleted | restored
    differences: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)


class DriverStatusPeriod(Base):
    __tablename__ = "driver_status_periods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), index=True)
    status: Mapped[str] = mapped_column(String)
    started_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    ended_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)


FINANCIAL_KINDS = ("expense", "deduction", "debt", "additional_pay", "statement")


class FinancialEntry(Base):
    __tablename__ = "financial_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), index=True)
    kind: Mapped[str] = mapped_column(String, index=True)  # one of FINANCIAL_KINDS
    amount: Mapped[float] = mapped_column(Float)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    entry_date: Mapped[str | None] = mapped_column(String, nullable=True)
    created_by: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
