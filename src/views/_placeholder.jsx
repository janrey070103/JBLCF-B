import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { StudentListSkeleton, AttendanceListSkeleton, QrGenerationSkeleton } from '../components/Skeletons';
import { useAuth } from '../controllers/authHooks';

// Phase 1 placeholder. Real screens arrive in Phase 2+.
// This view exists so the NavShell + role-based routes have a target and
// so all skeleton states are demonstrably rendered for verification.
export default function PlaceholderDashboard({ title }) {
  const { role } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary">{title}</h1>
        <p className="text-primary-400 mt-1">
          Phase 1 scaffold — real screens arrive in Phase 2.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Students">
          <StudentListSkeleton rows={3} />
        </Card>
        <Card title="Attendance">
          <AttendanceListSkeleton rows={3} />
        </Card>
        <Card title="QR generation">
          <QrGenerationSkeleton />
        </Card>
      </div>

      <Card title="Active role">
        <p className="text-sm text-primary-700">
          Current role: <span className="font-semibold capitalize">{role ?? 'none'}</span>
        </p>
        <p className="text-sm text-primary-400 mt-2">
          Sign out and back in with a different account to change role.
        </p>
      </Card>
    </div>
  );
}

export function LoginPlaceholder() {
  return (
    <div className="min-h-svh flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-nested bg-secondary text-primary-900 font-bold">
            JB
          </span>
          <div>
            <p className="font-semibold text-primary">JBLCF-B Attendance</p>
            <p className="text-xs text-primary-400">Sign in</p>
          </div>
        </div>
        <p className="text-sm text-primary-600 mb-4">
          Phase 1 — auth UI lands in Phase 2. Pick a role to preview the dashboard:
        </p>
        <div className="flex flex-col gap-2">
          <Link
            to="/admin"
            className="text-center px-4 py-2 rounded-nested bg-primary text-white hover:bg-primary-600"
          >
            Continue as Admin
          </Link>
          <Link
            to="/professor"
            className="text-center px-4 py-2 rounded-nested bg-secondary text-primary-900 hover:bg-secondary-400"
          >
            Continue as Professor
          </Link>
        </div>
      </Card>
    </div>
  );
}
