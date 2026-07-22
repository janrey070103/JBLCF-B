import { useMemo } from 'react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import { SearchInput } from '../../components/Input.jsx';
import { AttendanceListSkeleton } from '../../components/Skeletons.jsx';
import Table from '../../components/Table.jsx';
import { useAttendanceController } from '../../controllers/useAttendanceController.jsx';

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
    loading,
    search,
    setSearch,
    refreshAttendance,
  } = useAttendanceController();

  const columns = useMemo(
    () => [
      {
        key: 'student',
        header: 'Student',
        render: (row) => (
          <div>
            <p className="font-semibold text-primary">{row.student.fullName}</p>
            <p className="text-xs text-primary-400">{row.student.schoolId}</p>
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
    ],
    [],
  );

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
        <div className="grid gap-4 md:grid-cols-2">
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
            <label htmlFor="attendance-session" className="mb-1 block text-sm font-medium text-primary-700">
              Session
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
    </div>
  );
}
