import { useState, useRef, useEffect } from "react";
import apiClient from "../services/apiClient.js";

// ─────────────────────────────────────────────────────────────────────────────
// TODO Task 1: Drag-and-drop
//   - add onDragOver / onDragLeave / onDrop handlers to the drop zone
//   - call e.preventDefault() in onDragOver AND onDrop
//   - read the dropped file from e.dataTransfer.files[0]
//   - toggle an `isDragging` state to apply the "dragging" class
//
// TODO Task 2: Client-side validation
//   - before uploading, check file.type is an allowed image type
//   - and file.size <= 5 * 1024 * 1024 (5MB)
//   - show an error and stop if invalid
//
// TODO Task 3: Local preview
//   - const url = URL.createObjectURL(file); use it as <img src>
//   - revoke it with URL.revokeObjectURL in a useEffect cleanup
//
// TODO Task 4: Axios upload with progress
//   - build FormData, append the file under the name "avatar"
//   - apiClient.post("/api/upload", formData, { onUploadProgress: ... })
//   - percent = Math.round((event.loaded * 100) / event.total)
//   - DO NOT set a Content-Type header
// ─────────────────────────────────────────────────────────────────────────────

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validate(file) {
  if (!ALLOWED.includes(file.type)) {
    return "Only image files are allowed (JPEG, PNG, WebP, GIF)";
  }
  if (file.size > MAX_SIZE) {
    return "File is too large (max 5MB)";
  }
  return null;
}

export default function AvatarUploader() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    const validationError = validate(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      setPreview(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      handleFile(dropped);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      handleFile(selected);
    }
  };

  async function upload() {
    if (!file) return;

    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await apiClient.post("/api/upload", formData, {
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        },
      });
      return res.data.url;
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Upload failed");
    }
  }

  return (
    <div>
      <div
        className={isDragging ? "drop-zone dragging" : "drop-zone"}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        {preview && <img src={preview} alt="preview" className="preview" />}
        <p>Drag an image here, or click to choose</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
      </div>

      {error && <p className="error">{error}</p>}

      {progress > 0 && (
        <div className="bar">
          <div className="fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      <button onClick={upload} disabled={!file}>
        Upload
      </button>
    </div>
  );
}
