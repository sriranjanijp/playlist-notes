import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="fullpage-state">
      <div className="notfound-code">404</div>
      <p className="state-message">
        This page doesn't exist — or the session link has expired.
      </p>
      <Link to="/" className="btn-primary notfound-btn">
        ← Back to Home
      </Link>
    </div>
  );
}
