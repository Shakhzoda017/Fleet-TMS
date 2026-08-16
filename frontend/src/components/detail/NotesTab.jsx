import { useEffect, useState } from "react";
import api from "../../api";

export default function NotesTab({ entityType, entityId }) {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.get("/notes", { params: { entity_type: entityType, entity_id: entityId } }).then((res) => setNotes(res.data));
  }

  useEffect(load, [entityType, entityId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/notes", { entity_type: entityType, entity_id: entityId, text });
      setText("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="detail-tab">
      <form className="note-form" onSubmit={handleAdd}>
        <textarea
          placeholder="Add a note..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={submitting}>
          Add note
        </button>
      </form>
      <div className="note-list">
        {notes.map((n) => (
          <div className="note-item" key={n.id}>
            <div className="note-meta">
              <b>{n.author}</b>
              <span>{new Date(n.created_at + "Z").toLocaleString()}</span>
            </div>
            <div className="note-text">{n.text}</div>
          </div>
        ))}
        {notes.length === 0 && <div className="empty-row">No notes yet.</div>}
      </div>
    </div>
  );
}
