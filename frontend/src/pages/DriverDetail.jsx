import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import NotesTab from "../components/detail/NotesTab";
import LogTab from "../components/detail/LogTab";
import DocumentsTab from "../components/detail/DocumentsTab";
import FinancialTab from "../components/detail/FinancialTab";
import StatusCalendarTab from "../components/detail/StatusCalendarTab";
import StatusChangeModal from "../components/StatusChangeModal";
import Modal from "../components/Modal";
import { DRIVER_STATUSES } from "../constants";

function toFormValues(d) {
  return {
    name: d.name,
    company: d.company ?? "",
    phone: d.phone ?? "",
    email: d.email ?? "",
    status: d.status,
    cdl_exp: d.cdl_exp ?? "",
    mc_exp: d.mc_exp ?? "",
    current_location: d.current_location ?? "",
    notes: d.notes ?? "",
    truck_id: d.truck_id ?? "",
  };
}

const DOC_LABELS = ["CDL", "Med card", "Agreement"];

const TABS = [
  { key: "documents", label: "Documents" },
  { key: "loads", label: "Loads" },
  { key: "expense", label: "Expenses" },
  { key: "deduction", label: "Deductions" },
  { key: "debt", label: "Debt" },
  { key: "additional_pay", label: "Additional Pay" },
  { key: "statement", label: "Statements" },
  { key: "notes", label: "Notes" },
  { key: "status", label: "Status" },
  { key: "log", label: "Log" },
];

export default function DriverDetail() {
  const { id } = useParams();
  const driverId = Number(id);
  const [driver, setDriver] = useState(null);
  const [loads, setLoads] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [createdInfo, setCreatedInfo] = useState(null);
  const [tab, setTab] = useState("documents");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState(null);
  const [editError, setEditError] = useState("");

  function loadDriver() {
    api.get(`/drivers/${driverId}`).then((res) => setDriver(res.data));
  }

  useEffect(() => {
    loadDriver();
    api.get("/loads").then((res) => setLoads(res.data.filter((l) => l.driver_id === driverId)));
    api.get("/trucks").then((res) => setTrucks(res.data));
    api.get("/audit-log", { params: { entity_type: "driver", entity_id: driverId } }).then((res) => {
      const created = res.data.find((e) => e.action === "created");
      if (created) setCreatedInfo(created);
    });
  }, [driverId]);

  function openEdit() {
    setForm(toFormValues(driver));
    setEditError("");
    setShowEditModal(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError("");
    try {
      const payload = { ...form, truck_id: form.truck_id ? Number(form.truck_id) : null };
      await api.put(`/drivers/${driverId}`, payload);
      setShowEditModal(false);
      loadDriver();
    } catch {
      setEditError("Could not save changes — check the fields and try again.");
    }
  }

  if (!driver) return <div className="center-loading">Loading...</div>;

  return (
    <div className="detail-page">
      <aside className="detail-sidebar">
        <Link to="/drivers" className="btn-ghost back-link">
          ← Back to Drivers
        </Link>

        <div className="side-card">
          <div className="side-card-head">
            <h3>{driver.name}</h3>
            <button className="btn-icon" title="Edit driver" onClick={openEdit}>
              ✎
            </button>
          </div>
          {driver.phone && <div className="side-line">{driver.phone}</div>}
          {driver.email && <div className="side-line">{driver.email}</div>}
          {createdInfo && (
            <div className="side-meta">
              Created by {createdInfo.staff} · {new Date(createdInfo.created_at + "Z").toLocaleString()}
            </div>
          )}
        </div>

        {showEditModal && form && (
          <Modal title={`Edit driver: ${driver.name}`} onClose={() => setShowEditModal(false)}>
            <form onSubmit={handleEditSubmit} className="form-grid">
              <label>
                Name
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                Company
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </label>
              <label>
                Phone
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label>
                Email
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label>
                Status
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {DRIVER_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Truck
                <select value={form.truck_id} onChange={(e) => setForm({ ...form, truck_id: e.target.value })}>
                  <option value="">No Truck</option>
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.truck_number}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                CDL Exp
                <input placeholder="MM.DD.YYYY" value={form.cdl_exp} onChange={(e) => setForm({ ...form, cdl_exp: e.target.value })} />
              </label>
              <label>
                MC Exp
                <input placeholder="MM.DD.YYYY" value={form.mc_exp} onChange={(e) => setForm({ ...form, mc_exp: e.target.value })} />
              </label>
              <label className="span-2">
                Current location
                <input value={form.current_location} onChange={(e) => setForm({ ...form, current_location: e.target.value })} />
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
          <button className="status-pill status-clickable" onClick={() => setShowStatusModal(true)}>
            {driver.status}
          </button>
        </div>

        {showStatusModal && (
          <StatusChangeModal
            title={`Change Driver Status for ${driver.name}`}
            current={driver.status}
            options={DRIVER_STATUSES}
            onClose={() => setShowStatusModal(false)}
            onSave={async (newStatus) => {
              await api.patch(`/drivers/${driverId}/status`, { status: newStatus });
              loadDriver();
            }}
          />
        )}

        <div className="side-card">
          <div className="side-row">
            <span className="muted">Truck</span>
            <span>{driver.truck?.truck_number || "No Truck"}</span>
          </div>
          {driver.current_location && (
            <div className="side-row">
              <span className="muted">Location</span>
              <span>{driver.current_location}</span>
            </div>
          )}
          {driver.truck?.fuel_percent != null && (
            <div className="side-row">
              <span className="muted">Fuel</span>
              <span>{driver.truck.fuel_percent}%</span>
            </div>
          )}
        </div>

        <div className="side-card">
          <div className="side-row">
            <span className="muted">Company</span>
            <span>{driver.company || "-"}</span>
          </div>
          <div className="side-row">
            <span className="muted">CDL Exp</span>
            <span>{driver.cdl_exp || "-"}</span>
          </div>
          <div className="side-row">
            <span className="muted">MC Exp</span>
            <span>{driver.mc_exp || "-"}</span>
          </div>
        </div>
      </aside>

      <div className="detail-main">
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={"tab" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "documents" && <DocumentsTab entityType="driver" entityId={driverId} labelOptions={DOC_LABELS} />}
        {tab === "notes" && <NotesTab entityType="driver" entityId={driverId} />}
        {tab === "log" && <LogTab entityType="driver" entityId={driverId} />}
        {tab === "status" && <StatusCalendarTab driverId={driverId} />}
        {["expense", "deduction", "debt", "additional_pay", "statement"].includes(tab) && (
          <FinancialTab driverId={driverId} kind={tab} label={TABS.find((t) => t.key === tab).label} />
        )}
        {tab === "loads" && (
          <div className="detail-tab">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Load #</th>
                    <th>Status</th>
                    <th>Pickup</th>
                    <th>Delivery</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {loads.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <Link to={`/loads/${l.id}`}>{l.load_number}</Link>
                      </td>
                      <td>
                        <span className="status-pill">{l.status}</span>
                      </td>
                      <td>{l.pickup_location || "-"}</td>
                      <td>{l.delivery_location || "-"}</td>
                      <td>{l.rate != null ? `$${l.rate.toLocaleString()}` : "-"}</td>
                    </tr>
                  ))}
                  {loads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty-row">
                        No loads for this driver yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
