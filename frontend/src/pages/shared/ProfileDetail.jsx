export function ProfileDetail({ label, value }) {
  return (
    <div className="compact-row">
      <span>{label}</span>
      <strong>{value || "Not set"}</strong>
    </div>
  );
}
