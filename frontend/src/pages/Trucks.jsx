import { useEffect, useState } from "react";
import api from "../api";
import Modal from "../components/Modal";

const STATUSES = ["Rolling", "Shop", "Vacant", "Attention"];

const EMPTY = {
  truck_number: "",
  status: "Vacant",
  dot_exp_date: "",
  cc_exp_date: "",
  current_location: "",
  fuel_percent: "",
  year: "",
  make: "",
  notes: "",
};

function toFormValues(t) {
  return {
    truck_number: t.truck_number,
    status: t.status,
    dot_exp_date: t.dot_exp_date ?? "",
    cc_exp_date: t.cc_exp_date ?? "",
    current_location: t.current_location ?? "",
    fuel_percent: t.fuel_percent ?? "",
    year: t.year ?? "",
    make: t.make ?? "",
    notes: t.notes ?? "",
  };
}

export default function Trucks() {
  const [trucks, setTrucks] = useState([]);
  const [driverByTruckId, setDriverByTruckId] = useState({});
  const [editingTruck, setEditingTruck] = useState(null); // null | "new" | truck object
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  function load() {
    api.get("/trucks").then((res) => setTrucks(res.data));
    api.get("/drivers").then((res) => {
      const map = {};
      for (const d of res.data) {
        if (d.truck_id) map[d.truck_id] = d.name;
      }
      setDriverByTruckId(map);
    });
  }

  useEffect(load, []);

  function openAdd() {
    setForm(EMPTY);
    setError("");
    setEditingTruck("new");
  }

  function openEdit(t) {
    setForm(toFormValues(t));
    setError("");
    setEditingTruck(t);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : null,
        fuel_percent: form.fuel_percent ? Number(form.fuel_percent) : null,
      };
      if (editingTruck === "new") {
        await api.post("/trucks", payload);
      } else {
        await api.put(`/trucks/${editingTruck.id}`, payload);
      }
      setEditingTruck(null);
      load();
    } catch {
      setError("Could not save truck — check the fields and try again.");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Move this truck to the archive?")) return;
    await api.delete(`/trucks/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h2>Trucks</h2>
        <button className="btn-primary" onClick={openAdd}>
          + Add truck
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Truck #</th>
              <th>Status</th>
              <th>DOT Exp</th>
              <th>CC Exp</th>
              <th>Current driver</th>
              <th>Location</th>
              <th>Fuel</th>
              <th>Year</th>
              <th>Make</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {trucks.map((t) => (
              <tr key={t.id}>
                <td>{t.truck_number}</td>
                <td>
                  <span className={"status-pill status-" + t.status.toLowerCase()}>{t.status}</span>
                </td>
                <td>{t.dot_exp_date || "-"}</td>
                <td>{t.cc_exp_date || "-"}</td>
                <td>{driverByTruckId[t.id] || "No Driver"}</td>
                <td>{t.current_location || "-"}</td>
                <td>{t.fuel_percent != null ? `${t.fuel_percent}%` : "-"}</td>
                <td>{t.year || "-"}</td>
                <td>{t.make || "-"}</td>
                <td className="notes-cell">{t.notes || "-"}</td>
                <td className="row-actions">
                  <button className="btn-icon" title="Edit" onClick={() => openEdit(t)}>
                    ✎
                  </button>
                  <button className="btn-icon" title="Archive" onClick={() => handleDelete(t.id)}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {trucks.length === 0 && (
              <tr>
                <td colSpan={11} className="empty-row">
                  No trucks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingTruck && (
        <Modal title={editingTruck === "new" ? "Add truck" : `Edit truck #${editingTruck.truck_number}`} onClose={() => setEditingTruck(null)}>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Truck #
              <input required value={form.truck_number} onChange={(e) => setForm({ ...form, truck_number: e.target.value })} />
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
              DOT Exp Date
              <input placeholder="MM.DD.YYYY" value={form.dot_exp_date} onChange={(e) => setForm({ ...form, dot_exp_date: e.target.value })} />
            </label>
            <label>
              CC Exp Date
              <input placeholder="MM.DD.YYYY" value={form.cc_exp_date} onChange={(e) => setForm({ ...form, cc_exp_date: e.target.value })} />
            </label>
            <label>
              Current location
              <input value={form.current_location} onChange={(e) => setForm({ ...form, current_location: e.target.value })} />
            </label>
            <label>
              Fuel %
              <input type="number" min="0" max="100" value={form.fuel_percent} onChange={(e) => setForm({ ...form, fuel_percent: e.target.value })} />
            </label>
            <label>
              Year
              <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </label>
            <label>
              Make
              <input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
            </label>
            <label className="span-2">
              Notes
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
            {error && <div className="form-error span-2">{error}</div>}
            <button className="btn-primary span-2" type="submit">
              {editingTruck === "new" ? "Add truck" : "Save changes"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
