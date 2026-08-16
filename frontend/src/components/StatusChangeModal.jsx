import { useState } from "react";
import Modal from "./Modal";

export default function StatusChangeModal({ title, current, options, onSave, onClose }) {
  const [selected, setSelected] = useState(current);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(selected);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <input
        className="status-search"
        placeholder="Search status"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />
      <div className="status-option-list">
        {filtered.map((o) => (
          <button
            key={o}
            className={"status-option" + (o === selected ? " selected" : "")}
            onClick={() => setSelected(o)}
            type="button"
          >
            {o}
            {o === selected && <span className="status-option-check">✓</span>}
          </button>
        ))}
      </div>
      <div className="status-modal-actions">
        <button className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
