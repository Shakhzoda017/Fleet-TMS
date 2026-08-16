import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Modal from "../components/Modal";

const STATUSES = ["Upcoming", "En route", "On hold", "Delivered", "Closed", "Rejected", "Cancelled"];

const EMPTY = {
  load_number: "",
  status: "Upcoming",
  rate: "",
  pickup_location: "",
  pickup_date: "",
  delivery_location: "",
  delivery_date: "",
  notes: "",
  driver_id: "",
  dispatcher_id: "",
};

export default function LoadBoard() {
  const [loads, setLoads] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [dispatchers, setDispatchers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function load() {
    api.get("/loads").then((res) => setLoads(res.data));
    api.get("/drivers").then((res) => setDrivers(res.data));
    api.get("/dispatchers").then((res) => setDispatchers(res.data));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        rate: form.rate ? Number(form.rate) : null,
        driver_id: form.driver_id ? Number(form.driver_id) : null,
        dispatcher_id: form.dispatcher_id ? Number(form.dispatcher_id) : null,
      };
      await api.post("/loads", payload);
      setShowAdd(false);
      setForm(EMPTY);
      load();
    } catch {
      setError("Could not add load — check the fields and try again (load # must be unique).");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Move this load to the archive?")) return;
    await api.delete(`/loads/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h2>Load Board</h2>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + Add load
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Load #</th>
              <th>Status</th>
              <th>Rate</th>
              <th>Driver</th>
              <th>Pickup</th>
              <th>Delivery</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loads.map((l) => (
              <tr key={l.id} className="clickable-row" onClick={() => navigate(`/loads/${l.id}`)}>
                <td>{l.load_number}</td>
                <td>
                  <span className={"status-pill status-" + l.status.toLowerCase().replace(/\s/g, "-")}>{l.status}</span>
                </td>
                <td>{l.rate != null ? `$${l.rate.toLocaleString()}` : "-"}</td>
                <td>{l.driver?.name || "Unassigned"}</td>
                <td>
                  {l.pickup_location || "-"}
                  {l.pickup_date && <div className="sub-date">{l.pickup_date}</div>}
                </td>
                <td>
                  {l.delivery_location || "-"}
                  {l.delivery_date && <div className="sub-date">{l.delivery_date}</div>}
                </td>
                <td className="notes-cell">{l.notes || "-"}</td>
                <td>
                  <button
                    className="btn-icon"
                    title="Archive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(l.id);
                    }}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {loads.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-row">
                  No loads yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Add load" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="form-grid">
            <label>
              Load #
              <input required value={form.load_number} onChange={(e) => setForm({ ...form, load_number: e.target.value })} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Rate ($)
              <input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
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
              Pickup location
              <input value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} />
            </label>
            <label>
              Pickup date
              <input placeholder="MM.DD.YYYY HH:MM" value={form.pickup_date} onChange={(e) => setForm({ ...form, pickup_date: e.target.value })} />
            </label>
            <label>
              Delivery location
              <input value={form.delivery_location} onChange={(e) => setForm({ ...form, delivery_location: e.target.value })} />
            </label>
            <label>
              Delivery date
              <input placeholder="MM.DD.YYYY HH:MM" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} />
            </label>
            <label className="span-2">
              Notes
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
            {error && <div className="form-error span-2">{error}</div>}
            <button className="btn-primary span-2" type="submit">
              Add load
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
