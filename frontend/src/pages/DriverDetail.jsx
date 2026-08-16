import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import NotesTab from "../components/detail/NotesTab";
import LogTab from "../components/detail/LogTab";
import DocumentsTab from "../components/detail/DocumentsTab";
import FinancialTab from "../components/detail/FinancialTab";
import StatusCalendarTab from "../components/detail/StatusCalendarTab";
import StatusChangeModal from "../components/StatusChangeModal";
import { DRIVER_STATUSES } from "../constants";

const DOC_LABELS = ["CDL", "Med card", "Agreement"];

const TABS = [
  { key: "documents", label: "Documents" },
  { key: "loads", label: "Loads" },
  { key: "expense", label: "Expenses" },
  { key: "deduction", label: "Deductions" },
  { key: "debt", label: "Debt" },
  { key: "additional_pay", label: "Additional Pay" },
  { key: "statement", label: "Statements" },
  { key: "notes", label: "Notes" },
  { key: "status", label: "Status" },
  { key: "log", label: "Log" },
];

export default function DriverDetail() {
  const { id } = useParams();
  const driverId = Number(id);
  const [driver, setDriver] = useState(null);
  const [loads, setLoads] = useState([]);
  const [createdInfo, setCreatedInfo] = useState(null);
  const [tab, setTab] = useState("documents");
  const [showStatusModal, setShowStatusModal] = useState(false);

  function loadDriver() {
    api.get(`/drivers/${driverId}`).then((res) => setDriver(res.data));
  }

  useEffect(() => {
    loadDriver();
    api.get("/loads").then((res) => setLoads(res.data.filter((l) => l.driver_id === driverId)));
    api.get("/audit-log", { params: { entity_type: "driver", entity_id: driverId } }).then((res) => {
      const created = res.data.find((e) => e.action === "created");
      if (created) setCreatedInfo(created);
    });
  }, [driverId]);

  if (!driver) return <div className="center-loading">Loading...</div>;

  return (
    <div className="detail-page">
      <aside className="detail-sidebar">
        <Link to="/drivers" className="btn-ghost back-link">
          ← Back to Drivers
        </Link>

        <div className="side-card">
          <h3>{driver.name}</h3>
          {driver.phone && <div className="side-line">{driver.phone}</div>}
          {driver.email && <div className="side-line">{driver.email}</div>}
          {createdInfo && (
            <div className="side-meta">
              Created by {createdInfo.staff} · {new Date(createdInfo.created_at + "Z").toLocaleString()}
            </div>
          )}
        </div>

        <div className="side-card">
          <button className="status-pill status-clickable" onClick={() => setShowStatusModal(true)}>
            {driver.status}
          </button>
        </div>

        {showStatusModal && (
          <StatusChangeModal
            title={`Change Driver Status for ${driver.name}`}
            current={driver.status}
            options={DRIVER_STATUSES}
            onClose={() => setShowStatusModal(false)}
            onSave={async (newStatus) => {
              await api.patch(`/drivers/${driverId}/status`, { status: newStatus });
              loadDriver();
            }}
          />
        )}

        <div className="side-card">
          <div className="side-row">
            <span className="muted">Truck</span>
            <span>{driver.truck?.truck_number || "No Truck"}</span>
          </div>
          {driver.current_location && (
            <div className="side-row">
              <span className="muted">Location</span>
              <span>{driver.current_location}</span>
            </div>
          )}
          {driver.truck?.fuel_percent != null && (
            <div className="side-row">
              <span className="muted">Fuel</span>
              <span>{driver.truck.fuel_percent}%</span>
            </div>
          )}
        </div>

        <div className="side-card">
          <div className="side-row">
            <span className="muted">Company</span>
            <span>{driver.company || "-"}</span>
          </div>
          <div className="side-row">
            <span className="muted">CDL Exp</span>
            <span>{driver.cdl_exp || "-"}</span>
          </div>
          <div className="side-row">
            <span className="muted">MC Exp</span>
            <span>{driver.mc_exp || "-"}</span>
          </div>
        </div>
      </aside>

      <div className="detail-main">
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={"tab" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "documents" && <DocumentsTab entityType="driver" entityId={driverId} labelOptions={DOC_LABELS} />}
        {tab === "notes" && <NotesTab entityType="driver" entityId={driverId} />}
        {tab === "log" && <LogTab entityType="driver" entityId={driverId} />}
        {tab === "status" && <StatusCalendarTab driverId={driverId} />}
        {["expense", "deduction", "debt", "additional_pay", "statement"].includes(tab) && (
          <FinancialTab driverId={driverId} kind={tab} label={TABS.find((t) => t.key === tab).label} />
        )}
        {tab === "loads" && (
          <div className="detail-tab">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Load #</th>
                    <th>Status</th>
                    <th>Pickup</th>
                    <th>Delivery</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {loads.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <Link to={`/loads/${l.id}`}>{l.load_number}</Link>
                      </td>
                      <td>
                        <span className="status-pill">{l.status}</span>
                      </td>
                      <td>{l.pickup_location || "-"}</td>
                      <td>{l.delivery_location || "-"}</td>
                      <td>{l.rate != null ? `$${l.rate.toLocaleString()}` : "-"}</td>
                    </tr>
                  ))}
                  {loads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty-row">
                        No loads for this driver yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
