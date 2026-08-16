import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import NotesTab from "../components/detail/NotesTab";
import LogTab from "../components/detail/LogTab";
import DocumentsTab from "../components/detail/DocumentsTab";

const DOC_LABELS = ["RC", "BOL", "POD", "Invoice"];

const TABS = [
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
  { key: "log", label: "Log" },
];

export default function LoadDetail() {
  const { id } = useParams();
  const loadId = Number(id);
  const [load, setLoad] = useState(null);
  const [createdInfo, setCreatedInfo] = useState(null);
  const [tab, setTab] = useState("documents");

  useEffect(() => {
    api.get(`/loads/${loadId}`).then((res) => setLoad(res.data));
    api.get("/audit-log", { params: { entity_type: "load", entity_id: loadId } }).then((res) => {
      const created = res.data.find((e) => e.action === "created");
      if (created) setCreatedInfo(created);
    });
  }, [loadId]);

  if (!load) return <div className="center-loading">Loading...</div>;

  return (
    <div className="detail-page">
      <aside className="detail-sidebar">
        <Link to="/loads" className="btn-ghost back-link">
          ← Back to Load Board
        </Link>

        <div className="side-card">
          <h3>#{load.load_number}</h3>
          {createdInfo && (
            <div className="side-meta">
              Created by {createdInfo.staff} · {new Date(createdInfo.created_at + "Z").toLocaleString()}
            </div>
          )}
        </div>

        <div className="side-card">
          <span className={"status-pill status-" + load.status.toLowerCase().replace(/\s/g, "-")}>{load.status}</span>
        </div>

        <div className="side-card">
          <div className="side-row">
            <span className="muted">Driver</span>
            <span>{load.driver ? <Link to={`/drivers/${load.driver.id}`}>{load.driver.name}</Link> : "Unassigned"}</span>
          </div>
          <div className="side-row">
            <span className="muted">Truck</span>
            <span>{load.driver?.truck?.truck_number || "-"}</span>
          </div>
          <div className="side-row">
            <span className="muted">Dispatcher</span>
            <span>{load.dispatcher?.name || "-"}</span>
          </div>
        </div>

        <div className="side-card">
          <div className="side-row">
            <span className="muted">Rate</span>
            <span>{load.rate != null ? `$${load.rate.toLocaleString()}` : "-"}</span>
          </div>
        </div>

        <div className="side-card">
          <div className="muted" style={{ marginBottom: 6 }}>
            Pickup
          </div>
          <div>{load.pickup_location || "-"}</div>
          {load.pickup_date && <div className="side-meta">{load.pickup_date}</div>}
          <div className="muted" style={{ margin: "12px 0 6px" }}>
            Delivery
          </div>
          <div>{load.delivery_location || "-"}</div>
          {load.delivery_date && <div className="side-meta">{load.delivery_date}</div>}
        </div>

        {load.notes && (
          <div className="side-card">
            <div className="muted" style={{ marginBottom: 6 }}>
              Notes
            </div>
            <div>{load.notes}</div>
          </div>
        )}
      </aside>

      <div className="detail-main">
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={"tab" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "documents" && <DocumentsTab entityType="load" entityId={loadId} labelOptions={DOC_LABELS} />}
        {tab === "notes" && <NotesTab entityType="load" entityId={loadId} />}
        {tab === "log" && <LogTab entityType="load" entityId={loadId} />}
      </div>
    </div>
  );
}
