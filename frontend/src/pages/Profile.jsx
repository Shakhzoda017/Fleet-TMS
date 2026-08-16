import { useState } from "react";
import api from "../api";
import { useAuth } from "../AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setSubmitting(true);
    try {
      await api.put("/auth/me/password", { current_password: currentPassword, new_password: newPassword });
      setMessage({ type: "success", text: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Could not change password." });
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div>
      <div className="page-head">
        <h2>Profile</h2>
      </div>

      <div className="side-card" style={{ maxWidth: 420, marginBottom: 20 }}>
        <div className="side-row">
          <span className="muted">Username</span>
          <span>{user.username}</span>
        </div>
        <div className="side-row">
          <span className="muted">Full name</span>
          <span>{user.full_name || "-"}</span>
        </div>
        <div className="side-row">
          <span className="muted">Role</span>
          <span className="role-badge">{user.role}</span>
        </div>
      </div>

      <div className="side-card" style={{ maxWidth: 420 }}>
        <h3 style={{ marginTop: 0 }}>Change password</h3>
        <form onSubmit={handleChangePassword} className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <label>
            Current password
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </label>
          <label>
            New password
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </label>
          <label>
            Confirm new password
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </label>
          {message && <div className={message.type === "error" ? "form-error" : "form-success"}>{message.text}</div>}
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
