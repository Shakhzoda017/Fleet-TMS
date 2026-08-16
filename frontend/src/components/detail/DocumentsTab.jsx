import { useEffect, useRef, useState } from "react";
import api from "../../api";

const API_ORIGIN = "http://127.0.0.1:8000";

function isImage(filename) {
  return /\.(png|jpe?g|webp|heic)$/i.test(filename || "");
}

export default function DocumentsTab({ entityType, entityId, labelOptions }) {
  const [docs, setDocs] = useState([]);
  const fileInputs = useRef({});
  const [uploadingLabel, setUploadingLabel] = useState(null);

  function load() {
    api.get("/documents", { params: { entity_type: entityType, entity_id: entityId } }).then((res) => setDocs(res.data));
  }

  useEffect(load, [entityType, entityId]);

  function latestFor(label) {
    return docs.find((d) => d.label === label);
  }

  async function handleUpload(label, file) {
    if (!file) return;
    setUploadingLabel(label);
    const form = new FormData();
    form.append("entity_type", entityType);
    form.append("entity_id", entityId);
    form.append("label", label);
    form.append("file", file);
    try {
      await api.post("/documents", form, { headers: { "Content-Type": "multipart/form-data" } });
      load();
    } finally {
      setUploadingLabel(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this document?")) return;
    await api.delete(`/documents/${id}`);
    load();
  }

  const extraDocs = docs.filter((d) => !labelOptions.includes(d.label));

  return (
    <div className="detail-tab">
      <div className="doc-grid">
        {labelOptions.map((label) => {
          const doc = latestFor(label);
          return (
            <div className="doc-card" key={label}>
              <div className="doc-card-head">
                <span>{label}</span>
                <button
                  className="btn-icon"
                  title="Upload"
                  onClick={() => fileInputs.current[label]?.click()}
                  disabled={uploadingLabel === label}
                >
                  ✎
                </button>
                <input
                  ref={(el) => (fileInputs.current[label] = el)}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"
                  style={{ display: "none" }}
                  onChange={(e) => handleUpload(label, e.target.files[0])}
                />
              </div>
              <div className="doc-card-body">
                {uploadingLabel === label ? (
                  <span className="muted">Uploading...</span>
                ) : doc ? (
                  isImage(doc.original_filename) ? (
                    <a href={API_ORIGIN + doc.file_path} target="_blank" rel="noreferrer">
                      <img src={API_ORIGIN + doc.file_path} alt={label} />
                    </a>
                  ) : (
                    <a href={API_ORIGIN + doc.file_path} target="_blank" rel="noreferrer">
                      {doc.original_filename}
                    </a>
                  )
                ) : (
                  <span className="muted">No document</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="more-docs">
        <h4>More documents</h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Label</th>
                <th>Uploaded</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {extraDocs.map((d) => (
                <tr key={d.id}>
                  <td>
                    <a href={API_ORIGIN + d.file_path} target="_blank" rel="noreferrer">
                      {d.original_filename}
                    </a>
                  </td>
                  <td>{d.label}</td>
                  <td>{new Date(d.uploaded_at + "Z").toLocaleString()}</td>
                  <td>
                    <button className="btn-icon" onClick={() => handleDelete(d.id)}>
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
              {extraDocs.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-row">
                    No additional documents.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
