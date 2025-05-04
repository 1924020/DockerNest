export default function Notification({ message, type, onClose }) {
  if (!message) return null;

  return (
    <div
      className={`notification ${type}`}
      onClick={onClose}
      style={{
        padding: "10px 20px",
        borderRadius: "8px",
        marginBottom: "1rem",
        color: "#fff",
        cursor: "pointer",
        backgroundColor:
          type === "success" ? "#28a745" :
          type === "error" ? "#dc3545" : "#007bff",
      }}
    >
      {message}
    </div>
  );
}
