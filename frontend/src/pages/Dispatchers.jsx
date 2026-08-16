import { useEffect, useState } from "react";
import api from "../api";
import Modal from "../components/Modal";

const EMPTY = { name: "", phone: "", email: "", notes: "" };

export default function Dispatchers() {
  const [dispatchers, setDispatchers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  function load() {
    api.get("/dispatchers").then((res) => setDispatchers(res.data));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/dispatchers", form);
      setShowAdd(false);
      setForm(EMPTY);
      load();
    } catch {
      setError("Could not add dispatcher — check the fields and try again.");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Move this dispatcher to the archive?")) return;
    await api.delete(`/dispatchers/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h2>Dispatchers</h2>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + Add dispatcher
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {dispatchers.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.phone || "-"}</td>
                <td>{d.email || "-"}</td>
                <td className="notes-cell">{d.notes || "-"}</td>
                <td>
                  <button className="btn-icon" title="Archive" onClick={() => handleDelete(d.id)}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {dispatchers.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-row">
                  No dispatchers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Add dispatcher" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="form-grid">
            <label className="span-2">
              Name
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              Email
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="span-2">
              Notes
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
            {error && <div className="form-error span-2">{error}</div>}
            <button className="btn-primary span-2" type="submit">
              Add dispatcher
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
