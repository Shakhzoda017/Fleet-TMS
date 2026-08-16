import { useEffect, useState } from "react";
import api from "../../api";

export default function LogTab({ entityType, entityId }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    api
      .get("/audit-log", { params: { entity_type: entityType, entity_id: entityId } })
      .then((res) => setEntries(res.data));
  }, [entityType, entityId]);

  return (
    <div className="detail-tab">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Staff</th>
              <th>Action</th>
              <th>Differences</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.created_at + "Z").toLocaleString()}</td>
                <td>{e.staff}</td>
                <td>
                  <span className="status-pill">{e.action}</span>
                </td>
                <td>{e.differences || "-"}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-row">
                  No log entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
