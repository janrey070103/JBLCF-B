import { useMemo, useState } from 'react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Modal from '../../components/Modal.jsx';
import { SearchInput } from '../../components/Input.jsx';
import { AttendanceListSkeleton } from '../../components/Skeletons.jsx';
import Table from '../../components/Table.jsx';
import { useAttendanceController } from '../../controllers/useAttendanceController.jsx';

const today = () => new Date().toISOString().slice(0, 10);

const formatTime = (value) => {
  if (!value) return 'Pending sync';
  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

export default function ClassAttendance() {
  const {
    classes,
    selectedClass,
    selectedClassId,
    setSelectedClassId,
    sessionDate,
    setSessionDate,
    sessions,
    approvedStudents,
    roster,
    loading,
    search,
    setSearch,
    refreshAttendance,
    deleteAttendance,
  } = useAttendanceController();

  const [recordToRemove, setRecordToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const confirmRemove = async () => {
    if (!recordToRemove) return;
    setRemoving(true);
    try {
      await deleteAttendance({
        attendanceId: recordToRemove.attendanceId,
        studentId: recordToRemove.studentId,
        classId: selectedClassId,
        date: sessionDate,
      });
    } catch (e) {
      console.error('Failed to remove attendance record:', e);
    } finally {
      setRemoving(false);
      setRecordToRemove(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'student',
        header: 'Student',
        render: (row) => (
          <div>
            <p className="font-semibold text-primary">{row.student?.fullName || row.fullName}</p>
            <p className="text-xs text-primary-400">{row.student?.schoolId || row.schoolId}</p>
          </div>
        ),
      },
      {
        key: 'course',
        header: 'Course',
        render: (row) => (
          <span className="inline-flex rounded-pill border border-primary-100 bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
            {row.course?.code ?? 'N/A'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <span className="inline-flex rounded-pill border border-success/30 bg-success-light px-2 py-0.5 text-xs font-semibold capitalize text-success">
            {row.status}
          </span>
        ),
      },
      {
        key: 'scannedAt',
        header: 'Time',
        render: (row) => formatTime(row.scannedAt),
      },
      {
        key: 'actions',
        header: '',
        className: 'text-right',
        render: (row) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRecordToRemove({
              attendanceId: row.id,
              studentId: row.studentId || row.student?.id,
              name: row.student?.fullName || 'Student',
            })}
            className="text-error hover:bg-error-light hover:text-error text-xs"
          >
            Remove
          </Button>
        ),
      },
    ],
    [],
  );

  const rosterColumns = useMemo(
    () => [
      {
        key: 'student',
        header: 'Student',
        render: (row) => (
          <div>
            <p className="font-semibold text-primary">{row.fullName}</p>
            <p className="text-xs text-primary-400">{row.schoolId}</p>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => {
          const status = (row.attendanceStatus ?? 'absent').toLowerCase();
          const tone =
            status === 'present'
              ? 'border-success/30 bg-success-light text-success'
              : status === 'late'
              ? 'border-secondary-500/30 bg-secondary-50 text-secondary-700'
              : status === 'excused'
              ? 'border-primary-200 bg-primary-50 text-primary-700'
              : 'border-error/30 bg-error-light text-error';

          return (
            <span className={["inline-flex rounded-pill border px-2 py-0.5 text-xs font-semibold capitalize", tone].join(' ')}>
              {status}
            </span>
          );
        },
      },
      {
        key: 'scannedAt',
        header: 'Time',
        render: (row) => formatTime(row.scannedAt),
      },
      {
        key: 'actions',
        header: '',
        className: 'text-right',
        render: (row) => {
          if (row.attendanceStatus !== 'present' && row.attendanceStatus !== 'late') return null;
          return (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRecordToRemove({
                attendanceId: row.attendanceRecordId,
                studentId: row.id,
                name: row.fullName,
              })}
              className="text-error hover:bg-error-light hover:text-error text-xs"
            >
              Remove
            </Button>
          );
        },
      },
    ],
    [],
  );

  const summary = useMemo(() => {
    const base = { present: 0, late: 0, absent: 0, excused: 0 };
    for (const row of roster) {
      const status = (row.attendanceStatus ?? 'absent').toLowerCase();
      if (status in base) base[status] += 1;
      else base.absent += 1;
    }
    return base;
  }, [roster]);

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Class Attendance</h1>
          <p className="mt-0.5 text-sm text-primary-400">
            {selectedClass ? `${selectedClass.code} - ${selectedClass.title}` : 'Approved students for the selected session'}
          </p>
        </div>
        <Button type="button" variant="tertiary" onClick={refreshAttendance}>
          Refresh List
        </Button>
      </div>

      <Card title="Session Filters">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="attendance-class" className="mb-1 block text-sm font-medium text-primary-700">
              Class
            </label>
            <select
              id="attendance-class"
              value={selectedClassId ?? ''}
              onChange={(event) => setSelectedClassId(Number(event.target.value))}
              className="block w-full rounded-nested border border-primary-200 bg-white px-3 py-2 text-base text-primary-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="attendance-date" className="mb-1 block text-sm font-medium text-primary-700">
              Attendance Date
            </label>
            <input
              id="attendance-date"
              type="date"
              value={sessionDate}
              onChange={(event) => setSessionDate(event.target.value)}
              max={today()}
              className="block w-full rounded-nested border border-primary-200 bg-white px-3 py-2 text-base text-primary-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="attendance-session" className="mb-1 block text-sm font-medium text-primary-700">
              Quick Select Recorded Dates
            </label>
            <select
              id="attendance-session"
              value={sessionDate}
              onChange={(event) => setSessionDate(event.target.value)}
              className="block w-full rounded-nested border border-primary-200 bg-white px-3 py-2 text-base text-primary-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {sessions.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SearchInput
          placeholder="Search approved students..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-md"
        />
        <p className="text-sm font-medium text-primary-500">
          {approvedStudents.length} approved
        </p>
      </div>

      {loading ? (
        <AttendanceListSkeleton rows={6} />
      ) : (
        <div className="max-h-[62svh] overflow-y-auto rounded-container">
          <Table
            columns={columns}
            rows={approvedStudents}
            rowKey={(row) => row.id}
            emptyText={
              search
                ? 'No approved students match your search.'
                : 'No approved attendance records for this session yet.'
            }
          />
        </div>
      )}

      <Card title="Daily Class Roster (Calendar View)">
        <div className="mb-4 flex flex-wrap gap-3">
          <span className="inline-flex items-center rounded-pill border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            Total: {roster.length}
          </span>
          <span className="inline-flex items-center rounded-pill border border-success/30 bg-success-light px-3 py-1 text-xs font-semibold text-success">
            Present: {summary.present}
          </span>
          <span className="inline-flex items-center rounded-pill border border-secondary-500/30 bg-secondary-50 px-3 py-1 text-xs font-semibold text-secondary-700">
            Late: {summary.late}
          </span>
          <span className="inline-flex items-center rounded-pill border border-error/30 bg-error-light px-3 py-1 text-xs font-semibold text-error">
            Absent: {summary.absent}
          </span>
          <span className="inline-flex items-center rounded-pill border border-primary-200 bg-white px-3 py-1 text-xs font-semibold text-primary-600">
            Excused: {summary.excused}
          </span>
        </div>

        <Table
          columns={rosterColumns}
          rows={roster}
          rowKey={(row) => row.id}
          emptyText="No enrolled students found for this class."
        />
      </Card>

      {/* Confirmation modal for removing attendance */}
      {recordToRemove && (
        <Modal
          open={!!recordToRemove}
          onClose={() => setRecordToRemove(null)}
          title="Remove Attendance Record"
          size="sm"
          footer={
            <>
              <Button
                variant="tertiary"
                onClick={() => setRecordToRemove(null)}
                disabled={removing}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmRemove}
                loading={removing}
              >
                Yes, Remove Record
              </Button>
            </>
          }
        >
          <div className="space-y-2">
            <p className="text-sm text-primary-700">
              Are you sure you want to remove the attendance record for{' '}
              <span className="font-semibold text-primary">{recordToRemove.name}</span>?
            </p>
            <p className="text-xs text-primary-400">
              This will remove their present/late mark and revert their status for this session.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
