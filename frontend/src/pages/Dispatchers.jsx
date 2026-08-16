import { useEffect, useState } from "react";
import api from "../api";
import Modal from "../components/Modal";

const EMPTY = { name: "", phone: "", email: "", notes: "" };

function toFormValues(d) {
  return {
    name: d.name,
    phone: d.phone ?? "",
    email: d.email ?? "",
    notes: d.notes ?? "",
  };
}

export default function Dispatchers() {
  const [dispatchers, setDispatchers] = useState([]);
  const [editingDispatcher, setEditingDispatcher] = useState(null); // null | "new" | dispatcher object
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  function load() {
    api.get("/dispatchers").then((res) => setDispatchers(res.data));
  }

  useEffect(load, []);

  function openAdd() {
    setForm(EMPTY);
    setError("");
    setEditingDispatcher("new");
  }

  function openEdit(d) {
    setForm(toFormValues(d));
    setError("");
    setEditingDispatcher(d);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingDispatcher === "new") {
        await api.post("/dispatchers", form);
      } else {
        await api.put(`/dispatchers/${editingDispatcher.id}`, form);
      }
      setEditingDispatcher(null);
      load();
    } catch {
      setError("Could not save dispatcher — check the fields and try again.");
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
        <button className="btn-primary" onClick={openAdd}>
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
                <td className="row-actions">
                  <button className="btn-icon" title="Edit" onClick={() => openEdit(d)}>
                    ✎
                  </button>
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

      {editingDispatcher && (
        <Modal title={editingDispatcher === "new" ? "Add dispatcher" : `Edit dispatcher: ${editingDispatcher.name}`} onClose={() => setEditingDispatcher(null)}>
          <form onSubmit={handleSubmit} className="form-grid">
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
              {editingDispatcher === "new" ? "Add dispatcher" : "Save changes"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
