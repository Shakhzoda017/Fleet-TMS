import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const ACTIVE_LOAD_STATUSES = ["Upcoming", "En route", "On hold"];

export default function MainBoard() {
  const [drivers, setDrivers] = useState([]);
  const [loads, setLoads] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/drivers").then((res) => setDrivers(res.data));
    api.get("/loads").then((res) => setLoads(res.data));
  }, []);

  function activeLoadFor(driverId) {
    return loads.find((l) => l.driver_id === driverId && ACTIVE_LOAD_STATUSES.includes(l.status));
  }

  return (
    <div>
      <div className="page-head">
        <h2>Main Board</h2>
        <span className="muted">Live status for every driver</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Truck</th>
              <th>Status</th>
              <th>Current location</th>
              <th>Active load</th>
              <th>Pickup</th>
              <th>Delivery</th>
              <th>Driver notes</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => {
              const activeLoad = activeLoadFor(d.id);
              return (
                <tr key={d.id} className="clickable-row" onClick={() => navigate(`/drivers/${d.id}`)}>
                  <td>{d.name}</td>
                  <td>{d.truck?.truck_number || "-"}</td>
                  <td>
                    <span className="status-pill">{d.status}</span>
                  </td>
                  <td>{d.current_location || "-"}</td>
                  <td>{activeLoad ? activeLoad.load_number : "-"}</td>
                  <td>{activeLoad?.pickup_location || "-"}</td>
                  <td>{activeLoad?.delivery_location || "-"}</td>
                  <td className="notes-cell">{d.notes || "-"}</td>
                </tr>
              );
            })}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-row">
                  No drivers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
