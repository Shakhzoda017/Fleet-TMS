import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Modal from "../components/Modal";

const STATUSES = [
  "No Status",
  "Ready",
  "PU",
  "PU checked in",
  "En Route",
  "Unloading",
  "Home",
  "Hold",
  "Sleeping",
  "OOS",
];

const EMPTY = {
  name: "",
  company: "",
  phone: "",
  email: "",
  status: "No Status",
  cdl_exp: "",
  mc_exp: "",
  current_location: "",
  notes: "",
  truck_id: "",
};

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function load() {
    api.get("/drivers").then((res) => setDrivers(res.data));
    api.get("/trucks").then((res) => setTrucks(res.data));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, truck_id: form.truck_id ? Number(form.truck_id) : null };
      await api.post("/drivers", payload);
      setShowAdd(false);
      setForm(EMPTY);
      load();
    } catch {
      setError("Could not add driver — check the fields and try again.");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Move this driver to the archive?")) return;
    await api.delete(`/drivers/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h2>Drivers</h2>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + Add driver
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Truck</th>
              <th>Status</th>
              <th>Company</th>
              <th>CDL Exp</th>
              <th>MC Exp</th>
              <th>Current location</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="clickable-row" onClick={() => navigate(`/drivers/${d.id}`)}>
                <td>{d.name}</td>
                <td>{d.truck?.truck_number || "No Truck"}</td>
                <td>
                  <span className="status-pill">{d.status}</span>
                </td>
                <td>{d.company || "-"}</td>
                <td>{d.cdl_exp || "-"}</td>
                <td>{d.mc_exp || "-"}</td>
                <td>{d.current_location || "-"}</td>
                <td className="notes-cell">{d.notes || "-"}</td>
                <td>
                  <button
                    className="btn-icon"
                    title="Archive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(d.id);
                    }}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-row">
                  No drivers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Add driver" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="form-grid">
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
                {STATUSES.map((s) => (
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
            {error && <div className="form-error span-2">{error}</div>}
            <button className="btn-primary span-2" type="submit">
              Add driver
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
