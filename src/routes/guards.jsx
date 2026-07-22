import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../controllers/authHooks.js';
import { homeForRole } from './roleHome.js';

// If already authenticated, bounce away from /login to the role's home.
// Avoids the "I logged in but I'm back at login" trap when navigating back.
export function RedirectIfAuthed({ children }) {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated) return <Navigate to={homeForRole(role)} replace />;
  return children;
}

// Require authentication. Unauthenticated → /login, preserving where they
// were heading so we can return them there after sign-in.
export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const loc = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return children;
}

// Require a specific role. Role mismatch → the user's own home (avoids exposing
// nav they can't use; never reveals existence of the other role's URLs).
export function RequireRole({ role, children }) {
  const { role: current } = useAuth();
  if (current !== role) return <Navigate to={homeForRole(current)} replace />;
  return children;
}
