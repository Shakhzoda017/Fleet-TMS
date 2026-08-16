import { useEffect, useState } from "react";
import api from "../../api";

export default function FinancialTab({ driverId, kind, label }) {
  const [entries, setEntries] = useState([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.get("/financials", { params: { driver_id: driverId, kind } }).then((res) => setEntries(res.data));
  }

  useEffect(load, [driverId, kind]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!amount) return;
    setSubmitting(true);
    try {
      await api.post("/financials", {
        driver_id: driverId,
        kind,
        amount: Number(amount),
        description: description || null,
        entry_date: entryDate || null,
      });
      setAmount("");
      setDescription("");
      setEntryDate("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm(`Delete this ${label.toLowerCase()} entry?`)) return;
    await api.delete(`/financials/${id}`);
    load();
  }

  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="detail-tab">
      <form className="financial-form" onSubmit={handleAdd}>
        <input placeholder="Amount ($)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input placeholder="Date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
        <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="btn-primary" type="submit" disabled={submitting}>
          Add {label.toLowerCase()}
        </button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Added by</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{e.entry_date || "-"}</td>
                <td>${e.amount.toLocaleString()}</td>
                <td>{e.description || "-"}</td>
                <td>{e.created_by}</td>
                <td>
                  <button className="btn-icon" onClick={() => handleDelete(e.id)}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-row">
                  No {label.toLowerCase()} entries yet.
                </td>
              </tr>
            )}
          </tbody>
          {entries.length > 0 && (
            <tfoot>
              <tr>
                <td>
                  <b>Total</b>
                </td>
                <td>
                  <b>${total.toLocaleString()}</b>
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
