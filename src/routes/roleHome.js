import { USER_ROLES } from '../models';

export const HOME_BY_ROLE = {
  [USER_ROLES.SUPERADMIN]: '/admin',
  [USER_ROLES.PROFESSOR]: '/professor',
};

export function homeForRole(role) {
  return HOME_BY_ROLE[role] ?? '/login';
}
