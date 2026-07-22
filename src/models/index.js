// Model shapes — single source of truth for entity contracts across the app.
// JS (not TS) per Phase 1 decision; shapes are documented as factory functions
// + constants so consumers get predictable, self-describing objects.
// These will map 1:1 to Go structs / MySQL rows in Phase 6+.

/** @typedef {'superadmin' | 'professor'} Role */

/** Canonical user shape. */
export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  PROFESSOR: 'professor',
};

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} fullName
 * @property {string} email
 * @property {Role} role
 * @property {string} [phone]          // E.164-ish, masked in UI
 * @property {boolean} isActive
 * @property {string} createdAt        // ISO date
 */
export function createUser(partial = {}) {
  return {
    id: null,
    fullName: '',
    email: '',
    role: USER_ROLES.PROFESSOR,
    phone: '',
    isActive: true,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

/**
 * @typedef {Object} Student
 * @property {number} id
 * @property {string} schoolId         // e.g. "JBLCF-2024-0001" — masked format
 * @property {string} lastName
 * @property {string} firstName
 * @property {string} middleName       // optional
 * @property {string} suffix           // optional (Jr., Sr., etc.)
 * @property {string} fullName        // computed: "lastName, firstName M. suffix"
 * @property {string} email
 * @property {string} [phone]
 * @property {number} courseId
 * @property {number} [yearLevel]      // 1..5
 * @property {string} qrToken          // unique, used to encode the QR
 * @property {string|null} photo       // base-64 data URL from facial capture (null until captured)
 * @property {boolean} isActive
 * @property {string} createdAt
 */

/** Build a display full name from the split fields. */
export function buildFullName({ lastName = '', firstName = '', middleName = '', suffix = '' } = {}) {
  const parts = [lastName, firstName].filter(Boolean);
  if (middleName) parts.push(middleName.charAt(0) + '.');
  if (suffix) parts.push(suffix);
  return parts.join(', ').trim() || '';
}

export function createStudent(partial = {}) {
  const { lastName, firstName, middleName, suffix } = partial;
  return {
    id: null,
    schoolId: '',
    lastName: '',
    firstName: '',
    middleName: '',
    suffix: '',
    email: '',
    phone: '',
    courseId: null,
    yearLevel: 1,
    qrToken: '',
    photo: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    // Derive fullName if split fields are provided and fullName isn't.
    fullName: partial.fullName ?? buildFullName({ lastName, firstName, middleName, suffix }),
    ...partial,
  };
}

/**
 * @typedef {Object} Course
 * @property {number} id
 * @property {string} code             // e.g. "BSMT"
 * @property {string} name             // e.g. "BS Marine Transportation"
 * @property {string} [description]
 */
export function createCourse(partial = {}) {
  return {
    id: null,
    code: '',
    name: '',
    description: '',
    ...partial,
  };
}

/**
 * @typedef {Object} ClassEntity
 * @property {number} id
 * @property {string} code             // e.g. "NAV-101"
 * @property {string} title
 * @property {number} professorId      // User.id (role=professor)
 * @property {number} courseId
 * @property {string} schedule         // human-readable, e.g. "MWF 08:00–09:00"
 * @property {string} [room]
 * @property {number[]} studentIds     // enrolled Student.id list
 */
export function createClass(partial = {}) {
  return {
    id: null,
    code: '',
    title: '',
    professorId: null,
    courseId: null,
    schedule: '',
    room: '',
    studentIds: [],
    ...partial,
  };
}

/** @typedef {'present' | 'late' | 'absent' | 'excused'} AttendanceStatus */
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent',
  EXCUSED: 'excused',
};

/**
 * @typedef {Object} AttendanceRecord
 * @property {number} id
 * @property {number} classId
 * @property {number} studentId
 * @property {string} date             // YYYY-MM-DD (the class session date)
 * @property {AttendanceStatus} status
 * @property {string} [method]         // 'qr' | 'manual'
 * @property {string} [scannedAt]      // ISO timestamp of scan
 * @property {string} [note]
 */
export function createAttendanceRecord(partial = {}) {
  return {
    id: null,
    classId: null,
    studentId: null,
    date: new Date().toISOString().slice(0, 10),
    status: ATTENDANCE_STATUS.PRESENT,
    method: 'qr',
    scannedAt: null,
    note: '',
    ...partial,
  };
}
