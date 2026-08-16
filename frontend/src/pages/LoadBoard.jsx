import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import Modal from "../components/Modal";
import StatusChangeModal from "../components/StatusChangeModal";
import { LOAD_STATUSES, PAYMENT_STATUSES } from "../constants";

const EMPTY = {
  load_number: "",
  status: "Upcoming",
  payment_status: "Unpaid",
  rate: "",
  broker: "",
  dh_miles: "",
  trip_miles: "",
  pickup_location: "",
  pickup_date: "",
  delivery_location: "",
  delivery_date: "",
  notes: "",
  driver_id: "",
  dispatcher_id: "",
};

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

export default function LoadBoard() {
  const [loads, setLoads] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [dispatchers, setDispatchers] = useState([]);
  const [docSummary, setDocSummary] = useState([]);
  const [editingLoad, setEditingLoad] = useState(null); // null | "new" | load object
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [statusModalLoad, setStatusModalLoad] = useState(null);
  const navigate = useNavigate();

  function load() {
    api.get("/loads").then((res) => setLoads(res.data));
    api.get("/drivers").then((res) => setDrivers(res.data));
    api.get("/dispatchers").then((res) => setDispatchers(res.data));
    api.get("/documents/summary", { params: { entity_type: "load" } }).then((res) => setDocSummary(res.data));
  }

  useEffect(load, []);

  function openAdd() {
    setForm(EMPTY);
    setError("");
    setEditingLoad("new");
  }

  function openEdit(l) {
    setForm(toFormValues(l));
    setError("");
    setEditingLoad(l);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        rate: form.rate ? Number(form.rate) : null,
        dh_miles: form.dh_miles ? Number(form.dh_miles) : null,
        trip_miles: form.trip_miles ? Number(form.trip_miles) : null,
        driver_id: form.driver_id ? Number(form.driver_id) : null,
        dispatcher_id: form.dispatcher_id ? Number(form.dispatcher_id) : null,
      };
      if (editingLoad === "new") {
        await api.post("/loads", payload);
      } else {
        await api.put(`/loads/${editingLoad.id}`, payload);
      }
      setEditingLoad(null);
      load();
    } catch {
      setError("Could not save load — check the fields and try again (load # must be unique).");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Move this load to the archive?")) return;
    await api.delete(`/loads/${id}`);
    load();
  }

  function hasDoc(loadId, label) {
    return docSummary.some((d) => d.entity_id === loadId && d.label === label);
  }

  return (
    <div>
      <div className="page-head">
        <h2>Load Board</h2>
        <button className="btn-primary" onClick={openAdd}>
          + Add load
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Truck</th>
              <th>Load ID</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Route</th>
              <th>DH Miles</th>
              <th>Trip Miles</th>
              <th>Rpm</th>
              <th>Final Rate</th>
              <th>Broker</th>
              <th>Load Status</th>
              <th>Payment Status</th>
              <th>Rate Con</th>
              <th>BOL</th>
              <th>Dispatcher</th>
              <th>Origin</th>
              <th>Destination</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loads.map((l) => {
              const rpm = l.rate && l.trip_miles ? l.rate / l.trip_miles : null;
              return (
                <tr key={l.id}>
                  <td>
                    {l.driver ? <Link to={`/drivers/${l.driver.id}`}>{l.driver.name}</Link> : <span className="muted">Unassigned</span>}
                  </td>
                  <td>{l.driver?.truck?.truck_number || "-"}</td>
                  <td>
                    <Link to={`/loads/${l.id}`}>{l.load_number}</Link>
                  </td>
                  <td>{l.pickup_date || "-"}</td>
                  <td>{l.delivery_date || "-"}</td>
                  <td className="notes-cell">
                    {l.pickup_location || "?"} → {l.delivery_location || "?"}
                  </td>
                  <td>{l.dh_miles ?? "-"}</td>
                  <td>{l.trip_miles ?? "-"}</td>
                  <td>{rpm != null ? `$${rpm.toFixed(2)}` : "-"}</td>
                  <td>{l.rate != null ? `$${l.rate.toLocaleString()}` : "-"}</td>
                  <td>{l.broker || "-"}</td>
                  <td>
                    <button
                      className={"status-pill status-clickable status-" + l.status.toLowerCase().replace(/\s/g, "-")}
                      onClick={() => setStatusModalLoad(l)}
                    >
                      {l.status}
                    </button>
                  </td>
                  <td>{l.payment_status}</td>
                  <td className="doc-check">{hasDoc(l.id, "RC") ? "✓" : "-"}</td>
                  <td className="doc-check">{hasDoc(l.id, "BOL") ? "✓" : "-"}</td>
                  <td>{l.dispatcher?.name || "-"}</td>
                  <td>{l.pickup_location || "-"}</td>
                  <td>{l.delivery_location || "-"}</td>
                  <td className="row-actions">
                    <button className="btn-icon" title="Edit" onClick={() => openEdit(l)}>
                      ✎
                    </button>
                    <button className="btn-icon" title="Archive" onClick={() => handleDelete(l.id)}>
                      🗑
                    </button>
                  </td>
                </tr>
              );
            })}
            {loads.length === 0 && (
              <tr>
                <td colSpan={19} className="empty-row">
                  No loads yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {statusModalLoad && (
        <StatusChangeModal
          title={`Change Load Status`}
          current={statusModalLoad.status}
          options={LOAD_STATUSES}
          onClose={() => setStatusModalLoad(null)}
          onSave={async (newStatus) => {
            await api.patch(`/loads/${statusModalLoad.id}/status`, { status: newStatus });
            load();
          }}
        />
      )}

      {editingLoad && (
        <Modal title={editingLoad === "new" ? "Add load" : `Edit load #${editingLoad.load_number}`} onClose={() => setEditingLoad(null)}>
          <form onSubmit={handleSubmit} className="form-grid">
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
            {error && <div className="form-error span-2">{error}</div>}
            <button className="btn-primary span-2" type="submit">
              {editingLoad === "new" ? "Add load" : "Save changes"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
