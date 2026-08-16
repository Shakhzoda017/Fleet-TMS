import datetime

from pydantic import BaseModel, ConfigDict


# ---------- Auth ----------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    full_name: str
    role: str


class UserCreate(BaseModel):
    username: str
    full_name: str = ""
    role: str = "dispatcher"
    password: str


# ---------- Truck ----------
class TruckBase(BaseModel):
    truck_number: str
    status: str = "Vacant"
    dot_exp_date: str | None = None
    cc_exp_date: str | None = None
    current_location: str | None = None
    fuel_percent: float | None = None
    year: int | None = None
    make: str | None = None
    notes: str | None = None


class TruckCreate(TruckBase):
    pass


class TruckOut(TruckBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Driver ----------
class DriverBase(BaseModel):
    name: str
    company: str | None = None
    phone: str | None = None
    email: str | None = None
    status: str = "No Status"
    cdl_exp: str | None = None
    mc_exp: str | None = None
    current_location: str | None = None
    notes: str | None = None
    truck_id: int | None = None


class DriverCreate(DriverBase):
    pass


class DriverOut(DriverBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    truck: TruckOut | None = None


# ---------- Dispatcher ----------
class DispatcherBase(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    notes: str | None = None


class DispatcherCreate(DispatcherBase):
    pass


class DispatcherOut(DispatcherBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Load ----------
class LoadBase(BaseModel):
    load_number: str
    status: str = "Upcoming"
    rate: float | None = None
    pickup_location: str | None = None
    pickup_date: str | None = None
    delivery_location: str | None = None
    delivery_date: str | None = None
    notes: str | None = None
    driver_id: int | None = None
    dispatcher_id: int | None = None


class LoadCreate(LoadBase):
    pass


class LoadOut(LoadBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime.datetime
    driver: DriverOut | None = None
    dispatcher: DispatcherOut | None = None


# ---------- Archive ----------
class ArchiveEntryOut(BaseModel):
    id: int
    label: str
    deleted_by: str | None
    deleted_at: datetime.datetime | None


# ---------- Notes ----------
class NoteCreate(BaseModel):
    entity_type: str
    entity_id: int
    text: str


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entity_type: str
    entity_id: int
    author: str
    text: str
    created_at: datetime.datetime


# ---------- Documents ----------
class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entity_type: str
    entity_id: int
    label: str
    file_path: str
    original_filename: str
    number: str | None
    state: str | None
    issue_date: str | None
    exp_date: str | None
    uploaded_by: str
    uploaded_at: datetime.datetime


# ---------- Audit log ----------
class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entity_type: str
    entity_id: int
    staff: str
    action: str
    differences: str | None
    created_at: datetime.datetime


# ---------- Driver status history ----------
class DriverStatusPeriodOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    driver_id: int
    status: str
    started_at: datetime.datetime
    ended_at: datetime.datetime | None


# ---------- Financial entries ----------
class FinancialEntryCreate(BaseModel):
    driver_id: int
    kind: str
    amount: float
    description: str | None = None
    entry_date: str | None = None


class FinancialEntryOut(FinancialEntryCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_by: str
    created_at: datetime.datetime
