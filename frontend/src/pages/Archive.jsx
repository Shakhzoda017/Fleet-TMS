import { useEffect, useState } from "react";
import api from "../api";

const TABS = [
  { key: "loads", label: "Loads", labelField: "load_number" },
  { key: "drivers", label: "Drivers", labelField: "name" },
  { key: "trucks", label: "Trucks", labelField: "truck_number" },
  { key: "dispatchers", label: "Dispatchers", labelField: "name" },
];

export default function Archive() {
  const [tab, setTab] = useState("loads");
  const [rows, setRows] = useState([]);

  const activeTab = TABS.find((t) => t.key === tab);

  function load() {
    api.get(`/${tab}/archive`).then((res) => setRows(res.data));
  }

  useEffect(load, [tab]);

  async function handleRestore(id) {
    await api.post(`/${tab}/archive/${id}/restore`);
    load();
  }

  async function handlePermanentDelete(id) {
    if (!confirm("Permanently delete this record? This cannot be undone.")) return;
    await api.delete(`/${tab}/archive/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h2>Archive</h2>
        <span className="muted">Deleted records are kept here, not permanently removed</span>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={"tab" + (tab === t.key ? " active" : "")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{activeTab.label.slice(0, -1)}</th>
              <th>Deleted by</th>
              <th>Deleted at</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r[activeTab.labelField]}</td>
                <td>{r.deleted_by || "-"}</td>
                <td>{r.deleted_at ? new Date(r.deleted_at + "Z").toLocaleString() : "-"}</td>
                <td>
                  <button className="btn-icon" title="Restore" onClick={() => handleRestore(r.id)}>
                    ↺
                  </button>
                  <button className="btn-icon" title="Delete permanently" onClick={() => handlePermanentDelete(r.id)}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-row">
                  Archive is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
