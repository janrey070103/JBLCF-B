// Single source of truth for nav items, keyed by role. Each item lists its
// path + a short label + an inline SVG path (kept tiny, no icon lib needed).
// Phase 1 only includes placeholder routes; Phase 2+ fills in the views.
import { USER_ROLES } from '../models';

const icon = (d) => d;

export const NAV_BY_ROLE = {
  [USER_ROLES.SUPERADMIN]: [
    { to: '/admin', label: 'Dashboard', icon: icon('M3 12 12 3l9 9M5 10v10h14V10') },
    { to: '/admin/students', label: 'Students', icon: icon('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm10 14v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11') },
    { to: '/admin/users', label: 'Users', icon: icon('M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m6-1.13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z') },
    { to: '/admin/courses', label: 'Courses', icon: icon('M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z') },
    { to: '/admin/classes', label: 'Classes', icon: icon('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z') },
    { to: '/admin/reports', label: 'Reports', icon: icon('M3 3v18h18M7 14l3-3 3 3 5-6') },
  ],
  [USER_ROLES.PROFESSOR]: [
    { to: '/professor/scan', label: 'Scan QR', icon: icon('M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10') },
    { to: '/professor/attendance', label: 'Attendance', icon: icon('M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11') },
  ],
};
