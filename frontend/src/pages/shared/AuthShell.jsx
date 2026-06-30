import { Link } from "react-router-dom";

export function AuthShell({ title, subtitle, children, onSubmit }) {
  return (
    <main className="auth-screen">
      <Link className="brand-lock auth-brand" to="/">
        Dopamine Lock
      </Link>
      <form className="auth-card" onSubmit={onSubmit}>
        <p className="eyebrow">Access</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="form-stack">{children}</div>
      </form>
    </main>
  );
}
