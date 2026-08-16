import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import NotesTab from "../components/detail/NotesTab";
import LogTab from "../components/detail/LogTab";
import DocumentsTab from "../components/detail/DocumentsTab";
import StatusChangeModal from "../components/StatusChangeModal";
import Modal from "../components/Modal";
import { LOAD_STATUSES, PAYMENT_STATUSES } from "../constants";

const DOC_LABELS = ["RC", "BOL", "POD", "Invoice"];

function toFormValues(l) {
  return {
    load_number: l.load_number,
    status: l.status,
    payment_status: l.payment_status,
    rate: l.rate ?? "",
    broker: l.broker ?? "",
    dh_miles: l.dh_miles ?? "",
    trip_miles: l.trip_miles ?? "",
    pickup_location: l.pickup_location ?? "",
    pickup_date: l.pickup_date ?? "",
    delivery_location: l.delivery_location ?? "",
    delivery_date: l.delivery_date ?? "",
    notes: l.notes ?? "",
    driver_id: l.driver_id ?? "",
    dispatcher_id: l.dispatcher_id ?? "",
  };
}

const TABS = [
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
  { key: "log", label: "Log" },
];

export default function LoadDetail() {
  const { id } = useParams();
  const loadId = Number(id);
  const [load, setLoad] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [dispatchers, setDispatchers] = useState([]);
  const [createdInfo, setCreatedInfo] = useState(null);
  const [tab, setTab] = useState("documents");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState(null);
  const [editError, setEditError] = useState("");

  function loadLoad() {
    api.get(`/loads/${loadId}`).then((res) => setLoad(res.data));
  }

  useEffect(() => {
    loadLoad();
    api.get("/drivers").then((res) => setDrivers(res.data));
    api.get("/dispatchers").then((res) => setDispatchers(res.data));
    api.get("/audit-log", { params: { entity_type: "load", entity_id: loadId } }).then((res) => {
      const created = res.data.find((e) => e.action === "created");
      if (created) setCreatedInfo(created);
    });
  }, [loadId]);

  function openEdit() {
    setForm(toFormValues(load));
    setEditError("");
    setShowEditModal(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError("");
    try {
      const payload = {
        ...form,
        rate: form.rate ? Number(form.rate) : null,
        dh_miles: form.dh_miles ? Number(form.dh_miles) : null,
        trip_miles: form.trip_miles ? Number(form.trip_miles) : null,
        driver_id: form.driver_id ? Number(form.driver_id) : null,
        dispatcher_id: form.dispatcher_id ? Number(form.dispatcher_id) : null,
      };
      await api.put(`/loads/${loadId}`, payload);
      setShowEditModal(false);
      loadLoad();
    } catch {
      setEditError("Could not save changes — check the fields and try again.");
    }
  }

  if (!load) return <div className="center-loading">Loading...</div>;

  return (
    <div className="detail-page">
      <aside className="detail-sidebar">
        <Link to="/loads" className="btn-ghost back-link">
          ← Back to Load Board
        </Link>

        <div className="side-card">
          <div className="side-card-head">
            <h3>#{load.load_number}</h3>
            <button className="btn-icon" title="Edit load" onClick={openEdit}>
              ✎
            </button>
          </div>
          {createdInfo && (
            <div className="side-meta">
              Created by {createdInfo.staff} · {new Date(createdInfo.created_at + "Z").toLocaleString()}
            </div>
          )}
        </div>

        {showEditModal && form && (
          <Modal title={`Edit load #${load.load_number}`} onClose={() => setShowEditModal(false)}>
            <form onSubmit={handleEditSubmit} className="form-grid">
              <label>
                Load #
                <input required value={form.load_number} onChange={(e) => setForm({ ...form, load_number: e.target.value })} />
              </label>
              <label>
                Status
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {LOAD_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Payment status
                <select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Rate ($)
                <input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
              </label>
              <label>
                Broker
                <input value={form.broker} onChange={(e) => setForm({ ...form, broker: e.target.value })} />
              </label>
              <label>
                Driver
                <select value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })}>
                  <option value="">Unassigned</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Dispatcher
                <select value={form.dispatcher_id} onChange={(e) => setForm({ ...form, dispatcher_id: e.target.value })}>
                  <option value="">Unassigned</option>
                  {dispatchers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                DH Miles
                <input type="number" value={form.dh_miles} onChange={(e) => setForm({ ...form, dh_miles: e.target.value })} />
              </label>
              <label>
                Trip Miles
                <input type="number" value={form.trip_miles} onChange={(e) => setForm({ ...form, trip_miles: e.target.value })} />
              </label>
              <label>
                Origin
                <input value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} />
              </label>
              <label>
                Start date
                <input placeholder="MM.DD.YYYY HH:MM" value={form.pickup_date} onChange={(e) => setForm({ ...form, pickup_date: e.target.value })} />
              </label>
              <label>
                Destination
                <input value={form.delivery_location} onChange={(e) => setForm({ ...form, delivery_location: e.target.value })} />
              </label>
              <label>
                End date
                <input placeholder="MM.DD.YYYY HH:MM" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} />
              </label>
              <label className="span-2">
                Notes
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
              {editError && <div className="form-error span-2">{editError}</div>}
              <button className="btn-primary span-2" type="submit">
                Save changes
              </button>
            </form>
          </Modal>
        )}

        <div className="side-card">
          <button
            className={"status-pill status-clickable status-" + load.status.toLowerCase().replace(/\s/g, "-")}
            onClick={() => setShowStatusModal(true)}
          >
            {load.status}
          </button>
        </div>

        {showStatusModal && (
          <StatusChangeModal
            title="Change Load Status"
            current={load.status}
            options={LOAD_STATUSES}
            onClose={() => setShowStatusModal(false)}
            onSave={async (newStatus) => {
              await api.patch(`/loads/${loadId}/status`, { status: newStatus });
              loadLoad();
            }}
          />
        )}

        <div className="side-card">
          <div className="side-row">
            <span className="muted">Driver</span>
            <span>{load.driver ? <Link to={`/drivers/${load.driver.id}`}>{load.driver.name}</Link> : "Unassigned"}</span>
          </div>
          <div className="side-row">
            <span className="muted">Truck</span>
            <span>{load.driver?.truck?.truck_number || "-"}</span>
          </div>
          <div className="side-row">
            <span className="muted">Dispatcher</span>
            <span>{load.dispatcher?.name || "-"}</span>
          </div>
        </div>

        <div className="side-card">
          <div className="side-row">
            <span className="muted">Rate</span>
            <span>{load.rate != null ? `$${load.rate.toLocaleString()}` : "-"}</span>
          </div>
        </div>

        <div className="side-card">
          <div className="muted" style={{ marginBottom: 6 }}>
            Pickup
          </div>
          <div>{load.pickup_location || "-"}</div>
          {load.pickup_date && <div className="side-meta">{load.pickup_date}</div>}
          <div className="muted" style={{ margin: "12px 0 6px" }}>
            Delivery
          </div>
          <div>{load.delivery_location || "-"}</div>
          {load.delivery_date && <div className="side-meta">{load.delivery_date}</div>}
        </div>

        {load.notes && (
          <div className="side-card">
            <div className="muted" style={{ marginBottom: 6 }}>
              Notes
            </div>
            <div>{load.notes}</div>
          </div>
        )}
      </aside>

      <div className="detail-main">
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={"tab" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "documents" && <DocumentsTab entityType="load" entityId={loadId} labelOptions={DOC_LABELS} />}
        {tab === "notes" && <NotesTab entityType="load" entityId={loadId} />}
        {tab === "log" && <LogTab entityType="load" entityId={loadId} />}
      </div>
    </div>
  );
}
