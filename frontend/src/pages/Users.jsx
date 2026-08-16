import { useEffect, useState } from "react";
import api from "../api";
import Modal from "../components/Modal";

const ROLES = ["admin", "dispatcher", "updater"];

const EMPTY = { username: "", full_name: "", role: "dispatcher", password: "" };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  function load() {
    api.get("/users").then((res) => setUsers(res.data));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/users", form);
      setShowAdd(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not add user.");
    }
  }

  async function handleDeactivate(id) {
    if (!confirm("Deactivate this user? They will no longer be able to log in.")) return;
    await api.delete(`/users/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h2>Users</h2>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + Add user
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Full name</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.full_name || "-"}</td>
                <td>
                  <span className="role-badge">{u.role}</span>
                </td>
                <td>{u.is_active === false ? <span className="status-pill status-shop">Inactive</span> : <span className="status-pill status-rolling">Active</span>}</td>
                <td>
                  <button className="btn-icon" title="Deactivate" onClick={() => handleDeactivate(u.id)}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-row">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Add user" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="form-grid">
            <label>
              Username
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </label>
            <label>
              Full name
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </label>
            <label>
              Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              Password
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </label>
            {error && <div className="form-error span-2">{error}</div>}
            <button className="btn-primary span-2" type="submit">
              Add user
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
