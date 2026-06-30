import { Link } from "react-router-dom";

export function SplashPage() {
  return (
    <main className="splash-screen">
      <div className="molecule" aria-hidden="true">
        <span className="node node-a" />
        <span className="node node-b" />
        <span className="node node-c" />
        <span className="node node-d" />
        <span className="bond bond-a" />
        <span className="bond bond-b" />
        <span className="bond bond-c" />
      </div>
      <p className="eyebrow">Dopamine - The chemical of reward</p>
      <h1>Dopamine</h1>
      <p className="splash-copy">
        Reward is useful only when it obeys direction. Lock the impulse. Finish
        the mission. Build the identity.
      </p>
      <div className="splash-actions">
        <Link className="button button-primary" to="/dashboard">
          Enter Dopamine Lock
        </Link>
        <Link className="button button-secondary" to="/login">
          Login
        </Link>
      </div>
    </main>
  );
}
