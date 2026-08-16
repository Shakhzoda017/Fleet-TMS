import { useEffect, useState } from "react";
import api from "../../api";

const WEEKS_PER_PAGE = 6;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

const STATUS_COLORS = {
  Ready: "#1fa971",
  "PU": "#c99a1a",
  "PU checked in": "#c99a1a",
  "En Route": "#3b6fd6",
  Unloading: "#0fa3a3",
  Home: "#8892a6",
  Hold: "#8b5cf6",
  Sleeping: "#8892a6",
  OOS: "#d32f2f",
  "No Status": "#c7cbd6",
};

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function fmt(d) {
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function StatusCalendarTab({ driverId }) {
  const [periods, setPeriods] = useState([]);
  const [pageOffset, setPageOffset] = useState(0); // 0 = most recent weeks

  useEffect(() => {
    api.get(`/drivers/${driverId}/status-history`).then((res) => setPeriods(res.data));
  }, [driverId]);

  const thisWeekStart = startOfWeek(new Date());
  const pageEndWeekStart = new Date(thisWeekStart.getTime() - pageOffset * WEEKS_PER_PAGE * WEEK_MS);

  const weeks = [];
  for (let i = 0; i < WEEKS_PER_PAGE; i++) {
    const start = new Date(pageEndWeekStart.getTime() - i * WEEK_MS);
    weeks.push(start);
  }

  function segmentsForWeek(weekStart) {
    const weekEnd = new Date(weekStart.getTime() + WEEK_MS);
    const segments = [];
    for (const p of periods) {
      const start = new Date(p.started_at + "Z");
      const end = p.ended_at ? new Date(p.ended_at + "Z") : new Date();
      const clippedStart = start < weekStart ? weekStart : start;
      const clippedEnd = end > weekEnd ? weekEnd : end;
      if (clippedEnd <= clippedStart) continue;
      const offsetPct = ((clippedStart - weekStart) / WEEK_MS) * 100;
      const widthPct = ((clippedEnd - clippedStart) / WEEK_MS) * 100;
      segments.push({ status: p.status, offsetPct, widthPct });
    }
    return segments;
  }

  return (
    <div className="detail-tab">
      <div className="calendar-nav">
        <button className="btn-ghost" onClick={() => setPageOffset((o) => o + 1)}>
          ‹ Earlier
        </button>
        <span className="muted">
          {fmt(weeks[weeks.length - 1])} – {fmt(new Date(weeks[0].getTime() + WEEK_MS - DAY_MS))}
        </span>
        <button className="btn-ghost" onClick={() => setPageOffset((o) => Math.max(0, o - 1))} disabled={pageOffset === 0}>
          Later ›
        </button>
      </div>

      <div className="status-calendar">
        {weeks.map((weekStart) => {
          const segments = segmentsForWeek(weekStart);
          return (
            <div className="cal-row" key={weekStart.toISOString()}>
              <div className="cal-row-label">
                {fmt(weekStart)} – {fmt(new Date(weekStart.getTime() + WEEK_MS - DAY_MS))}
              </div>
              <div className="cal-row-bar">
                {segments.length === 0 && <div className="cal-empty" />}
                {segments.map((s, i) => (
                  <div
                    key={i}
                    className="cal-segment"
                    style={{
                      left: `${s.offsetPct}%`,
                      width: `${s.widthPct}%`,
                      background: STATUS_COLORS[s.status] || "#c7cbd6",
                    }}
                    title={s.status}
                  >
                    {s.widthPct > 8 ? s.status : ""}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="cal-legend">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="cal-legend-item">
            <span className="cal-dot" style={{ background: color }} />
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}
