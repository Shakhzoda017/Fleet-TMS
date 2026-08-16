import { useEffect, useRef, useState } from "react";
import api from "../../api";

function isImageType(contentType) {
  return (contentType || "").startsWith("image/");
}

function useDocBlobUrl(docId) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    let url;
    let cancelled = false;
    setBlobUrl(null);
    api.get(`/documents/${docId}/file`, { responseType: "blob" }).then((res) => {
      if (cancelled) return;
      url = URL.createObjectURL(res.data);
      setBlobUrl(url);
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [docId]);

  return blobUrl;
}

function DocPreview({ doc, label }) {
  const blobUrl = useDocBlobUrl(doc.id);
  if (!blobUrl) return <span className="muted">Loading...</span>;
  if (isImageType(doc.content_type)) {
    return (
      <a href={blobUrl} target="_blank" rel="noreferrer">
        <img src={blobUrl} alt={label} />
      </a>
    );
  }
  return (
    <a href={blobUrl} target="_blank" rel="noreferrer">
      {doc.original_filename}
    </a>
  );
}

function DocRowLink({ doc }) {
  const blobUrl = useDocBlobUrl(doc.id);
  if (!blobUrl) return <span className="muted">{doc.original_filename}</span>;
  return (
    <a href={blobUrl} target="_blank" rel="noreferrer">
      {doc.original_filename}
    </a>
  );
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
                  <DocPreview doc={doc} label={label} />
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
                    <DocRowLink doc={d} />
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
