import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card.jsx';
import { fetchApi } from '../../api/client.js';

function StatCard({ title, value, icon, subtitle }) {
  return (
    <Card className="flex items-center gap-4 py-5 hover:shadow-elevated transition-shadow duration-200">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-nested bg-primary-50 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-xs font-medium uppercase tracking-wider text-primary-400">{title}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary tracking-tight">{value}</span>
        </div>
        {subtitle && <p className="text-xs font-medium text-primary-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </Card>
  );
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  let badgeStyle = 'bg-primary-50 text-primary-700 border-primary-200';
  let icon = 'fa-check';

  if (s === 'present') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = 'fa-check-circle';
  } else if (s === 'late') {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    icon = 'fa-clock';
  } else if (s === 'absent') {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    icon = 'fa-times-circle';
  } else if (s === 'excused') {
    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
    icon = 'fa-info-circle';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>
      <i className={`fa-solid ${icon} text-[10px]`}></i>
      <span className="capitalize">{status || 'Unknown'}</span>
    </span>
  );
}

function formatActivityTime(timestamp, sessionDate) {
  const raw = timestamp || sessionDate;
  if (!raw) return 'N/A';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;

    if (raw.length === 10 && !raw.includes('T') && !raw.includes(':')) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return raw;
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchApi('/api/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const recentActivity = stats?.recentActivity || [];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header with Title and Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Superadmin Dashboard</h1>
          <p className="text-sm text-primary-400 mt-1">Overview of system metrics, attendance scans, and recent activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadStats(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-nested border border-primary-200 bg-white text-primary-700 hover:bg-primary-50 transition-colors disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <i className={`fa-solid fa-arrows-rotate ${refreshing ? 'animate-spin' : ''}`}></i>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="py-6 h-[104px] animate-pulse">
              <div className="flex gap-4 items-center h-full">
                <div className="w-12 h-12 rounded-nested bg-primary-50 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-20 bg-primary-50 rounded" />
                  <div className="h-6 w-12 bg-primary-50 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={stats.totalStudents || 0}
            subtitle={stats.totalEnrollments ? `${stats.totalEnrollments} active enrollments` : `${stats.totalStudents || 0} registered`}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <StatCard
            title="Total Professors"
            value={stats.totalProfessors || 0}
            subtitle="Active faculty accounts"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
          <StatCard
            title="Total Classes"
            value={stats.totalClasses || 0}
            subtitle="Scheduled class sections"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            }
          />
          <StatCard
            title="Attendance Scans"
            value={stats.todayScans ?? stats.recentScans ?? 0}
            subtitle={`${stats.todayScans || 0} today · ${stats.totalScans || 0} all-time records`}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" />
                <path d="M7 12h10M12 7v10" />
              </svg>
            }
          />
        </div>
      ) : (
        <Card className="py-8 text-center text-primary-500">
          Failed to load dashboard metrics.
        </Card>
      )}

      {/* Recent Activity Section */}
      <Card
        title="Recent Activity"
        actions={
          <Link
            to="/admin/reports"
            className="text-xs font-semibold text-primary hover:text-primary-700 inline-flex items-center gap-1 transition-colors"
          >
            <span>View Full Reports</span>
            <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </Link>
        }
        className="min-h-[300px]"
      >
        {loading ? (
          <div className="space-y-3 py-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-nested bg-primary-50 animate-pulse" />
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-primary-400">
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-300 mb-3">
              <i className="fa-solid fa-clipboard-list text-xl"></i>
            </div>
            <p className="font-semibold text-primary-700 text-sm">No attendance activity recorded yet</p>
            <p className="text-xs text-primary-400 mt-1 max-w-sm">
              Activity entries will automatically populate here as professors scan student QR passes in classes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-primary-100 -mx-5 -my-4">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 hover:bg-primary-50/50 transition-colors"
              >
                {/* Student Avatar + Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {item.photo ? (
                    <img
                      src={item.photo}
                      alt={item.studentName}
                      className="w-10 h-10 rounded-full object-cover border border-primary-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {item.studentName ? item.studentName.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary truncate leading-snug">
                      {item.studentName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-primary-400 mt-0.5">
                      <span className="font-mono text-[11px] text-primary-500">{item.schoolId}</span>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1 font-medium text-primary-600">
                        <i className="fa-solid fa-chalkboard-user text-[10px] text-primary-400"></i>
                        {item.classCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status + Method + Time */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pl-13 sm:pl-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-primary-400 bg-primary-50/70 px-2 py-0.5 rounded-full border border-primary-100">
                      <i className="fa-solid fa-qrcode text-[10px]"></i>
                      {item.method === 'qr_scan' ? 'QR Scan' : item.method || 'Scan'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-primary-600">
                      {formatActivityTime(item.scannedAt, item.sessionDate)}
                    </p>
                    {item.note && (
                      <p className="text-[11px] text-amber-600 max-w-[200px] truncate mt-0.5" title={item.note}>
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Navigation Shortcuts */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
        <Link
          to="/admin/students"
          className="p-4 rounded-container border border-primary-100 bg-white hover:border-primary-300 hover:shadow-card transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider">Students</p>
            <p className="text-sm font-bold text-primary mt-0.5 group-hover:text-primary-700">Manage Students</p>
          </div>
          <i className="fa-solid fa-arrow-right text-primary-300 group-hover:text-primary transition-colors text-xs"></i>
        </Link>
        <Link
          to="/admin/classes"
          className="p-4 rounded-container border border-primary-100 bg-white hover:border-primary-300 hover:shadow-card transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider">Classes</p>
            <p className="text-sm font-bold text-primary mt-0.5 group-hover:text-primary-700">Schedules & Rosters</p>
          </div>
          <i className="fa-solid fa-arrow-right text-primary-300 group-hover:text-primary transition-colors text-xs"></i>
        </Link>
        <Link
          to="/admin/users"
          className="p-4 rounded-container border border-primary-100 bg-white hover:border-primary-300 hover:shadow-card transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider">Faculty</p>
            <p className="text-sm font-bold text-primary mt-0.5 group-hover:text-primary-700">Professors & Admins</p>
          </div>
          <i className="fa-solid fa-arrow-right text-primary-300 group-hover:text-primary transition-colors text-xs"></i>
        </Link>
        <Link
          to="/admin/reports"
          className="p-4 rounded-container border border-primary-100 bg-white hover:border-primary-300 hover:shadow-card transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider">Reports</p>
            <p className="text-sm font-bold text-primary mt-0.5 group-hover:text-primary-700">Attendance Analytics</p>
          </div>
          <i className="fa-solid fa-arrow-right text-primary-300 group-hover:text-primary transition-colors text-xs"></i>
        </Link>
      </div>
    </div>
  );
}
