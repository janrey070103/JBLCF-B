import { useEffect, useState } from 'react';
import Card from '../../components/Card.jsx';
import { fetchApi } from '../../api/client.js';

function StatCard({ title, value, icon, subtitle }) {
  return (
    <Card className="flex items-center gap-4 py-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-nested bg-primary-50 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-primary-500">{title}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">{value}</span>
          {subtitle && <span className="text-xs font-medium text-primary-400">{subtitle}</span>}
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function loadStats() {
      try {
        const data = await fetchApi('/api/admin/stats');
        if (alive) setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadStats();
    return () => { alive = false; };
  }, []);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-primary">Superadmin Dashboard</h1>
        <p className="text-sm text-primary-400 mt-1">Overview of the system metrics and recent activities.</p>
      </div>
      
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
            subtitle="Active enrollments"
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
            subtitle="Active accounts"
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
            subtitle="Scheduled"
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
            title="Recent Scans"
            value={stats.recentScans || 0}
            subtitle="Today"
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

      {/* Placeholder for future activity feed */}
      <Card title="Recent Activity" className="min-h-[300px]">
        <div className="flex items-center justify-center h-[200px] text-sm text-primary-400">
          Activity feed will appear here when students begin scanning attendance.
        </div>
      </Card>
    </div>
  );
}
