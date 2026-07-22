import { useCallback, useMemo, useState } from 'react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import QrCameraScanner from '../../components/QrCameraScanner.jsx';
import { useToast } from '../../components/useToast.js';
import { useAttendanceController } from '../../controllers/useAttendanceController.jsx';
import { useRef, useEffect } from 'react';
import { createTimeline, createScope, svg } from 'animejs';

function StudentPhoto({ student }) {
  if (student.photo) {
    return (
      <img
        src={student.photo}
        alt={student.fullName}
        className="h-24 w-24 rounded-container object-cover"
      />
    );
  }

  const initials = student.fullName
    .split(/[,\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="grid h-24 w-24 place-items-center rounded-container bg-primary-50 text-2xl font-bold text-primary">
      {initials || 'ST'}
    </div>
  );
}

function Message({ tone = 'info', title, children }) {
  const styles = {
    info: 'border-primary-100 bg-primary-50 text-primary-700',
    success: 'border-success/30 bg-success-light text-success',
    error: 'border-error/30 bg-error-light text-error',
    alert: 'border-secondary-700 bg-secondary-50 text-primary-800',
  };

  return (
    <div role="status" className={['rounded-container border px-4 py-3', styles[tone]].join(' ')}>
      <p className="text-sm font-semibold">{title}</p>
      {children && <p className="mt-1 text-sm">{children}</p>}
    </div>
  );
}

// Status badge for roster entries
function StatusBadge({ status }) {
  if (status === 'present') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-success-light px-2 py-0.5 text-xs font-semibold text-success">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
        Present
      </span>
    );
  }
  if (status === 'late') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-secondary-50 px-2 py-0.5 text-xs font-semibold text-secondary-700">
        Late
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-error-light px-2 py-0.5 text-xs font-semibold text-error">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
      Absent
    </span>
  );
}

export default function ScanAttendance() {
  const toast = useToast();
  const {
    classes,
    selectedClass,
    selectedClassId,
    setSelectedClassId,
    roster,
    lookupStudentByQr,
    approveAttendance,
    isAlreadyPresent,
    isEnrolledInSelectedClass,
    saving,
  } = useAttendanceController();

  const [verification, setVerification] = useState(null);
  const [edgeState, setEdgeState] = useState(null);
  const [approved, setApproved] = useState(false);
  const [manualQr, setManualQr] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');
  
  const verificationRootRef = useRef(null);
  const verificationScopeRef = useRef(null);

  useEffect(() => {
    if (verification) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      verificationScopeRef.current = createScope({ root: verificationRootRef.current }).add(() => {
        const tl = createTimeline();
        tl.add('.verification-card', { 
            scale: prefersReducedMotion ? [1, 1] : [0.95, 1], 
            opacity: [0, 1], 
            duration: prefersReducedMotion ? 1 : 400, 
            ease: 'outExpo' 
          })
          .add('.verification-photo', { opacity: [0, 1], duration: prefersReducedMotion ? 1 : 300 }, prefersReducedMotion ? 0 : '-=200')
          .add('.verification-details', { opacity: [0, 1], translateY: prefersReducedMotion ? [0,0] : [10, 0], duration: prefersReducedMotion ? 1 : 300 }, prefersReducedMotion ? 0 : '-=150')
          .add('.approve-button', { opacity: [0, 1], translateY: prefersReducedMotion ? [0,0] : [8, 0], duration: prefersReducedMotion ? 1 : 250 }, prefersReducedMotion ? 0 : '-=100');
      });
      return () => {
         if (verificationScopeRef.current) verificationScopeRef.current.revert();
      };
    }
  }, [verification]);

  useEffect(() => {
    if (approved && verificationScopeRef.current) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      verificationScopeRef.current.add(() => {
         const drawable = svg.createDrawable('.checkmark-path');
         createTimeline().add(drawable, { draw: ['0 0', '0 1'], duration: prefersReducedMotion ? 1 : 450, ease: 'outQuad' });
      });
    }
  }, [approved]);

  const classOptions = useMemo(() => classes, [classes]);

  const handleScan = useCallback(async (qrToken) => {
    setApproved(false);
    setEdgeState(null);
    try {
      const student = await lookupStudentByQr(qrToken);
      if (!isEnrolledInSelectedClass(student)) {
        setVerification(null);
        setEdgeState({
          tone: 'alert',
          title: 'Student not enrolled',
          message: 'This QR belongs to a student who is not enrolled in this class. Ask the admin to add them first.',
        });
        return;
      }
      if (isAlreadyPresent(student.id)) {
        setVerification(student);
        setEdgeState({
          tone: 'alert',
          title: 'Already marked present',
          message: 'This student already has an attendance record for the current session.',
        });
        return;
      }
      setVerification(student);
    } catch (error) {
      setVerification(null);
      setEdgeState({
        tone: 'error',
        title: error.code === 'NOT_FOUND' ? 'QR not recognized' : 'Scan failed',
        message: error.code === 'NOT_FOUND'
          ? 'No student matches this QR code. Make sure the QR code is valid and the student is registered.'
          : 'The QR could not be verified. Try scanning again with the code centered in the frame.',
      });
    }
  }, [isAlreadyPresent, isEnrolledInSelectedClass, lookupStudentByQr]);

  const handleScannerError = useCallback((error) => {
    setEdgeState({
      tone: 'error',
      title: error.code === 'PERMISSION_DENIED' ? 'Camera permission denied' : 'Camera unavailable',
      message: error.message,
    });
  }, []);

  const handleApprove = async () => {
    if (!verification) return;
    setEdgeState(null);
    try {
      await approveAttendance(verification);
      setApproved(true);
      toast.success(`${verification.fullName} marked present.`);
    } catch (error) {
      setApproved(false);
      setEdgeState({
        tone: error.code === 'DUPLICATE_ATTENDANCE' ? 'alert' : 'error',
        title: error.code === 'DUPLICATE_ATTENDANCE' ? 'Already marked present' : 'Could not approve attendance',
        message: error.message || 'Try again after checking the selected class.',
      });
    }
  };

  const runManualScan = () => {
    if (!manualQr.trim()) return;
    handleScan(manualQr.trim());
  };

  // Roster filtered by search, merged with real-time present records from records
  const filteredRoster = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    return roster.filter(s =>
      !q || s.fullName?.toLowerCase().includes(q) || s.schoolId?.toLowerCase().includes(q)
    );
  }, [roster, rosterSearch]);

  const presentCount = useMemo(() => roster.filter(s => s.attendanceStatus === 'present' || s.attendanceStatus === 'late').length, [roster]);
  const absentCount = useMemo(() => roster.filter(s => s.attendanceStatus === 'absent').length, [roster]);

  return (
    <div className="space-y-4 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-primary">Scan Attendance</h1>
        <p className="mt-0.5 text-sm text-primary-400">
          {selectedClass ? `${selectedClass.code} - ${selectedClass.title}` : 'Select a class to begin scanning'}
        </p>
      </div>

      <Card title="Class Session">
        <label htmlFor="scan-class" className="mb-1 block text-sm font-medium text-primary-700">
          Class
        </label>
        <select
          id="scan-class"
          value={selectedClassId ?? ''}
          onChange={(event) => {
            setSelectedClassId(Number(event.target.value));
            setVerification(null);
            setEdgeState(null);
            setApproved(false);
          }}
          className="block w-full rounded-nested border border-primary-200 bg-white px-3 py-2 text-base text-primary-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {classOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} - {item.title}
            </option>
          ))}
        </select>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Card title="Camera Scanner">
          <QrCameraScanner onScan={handleScan} onError={handleScannerError} disabled={!selectedClass} />
          <div className="mt-4 border-t border-primary-100 pt-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <Input
                label="Manual QR Token"
                value={manualQr}
                onChange={(event) => setManualQr(event.target.value)}
                hint="Enter the QR token manually to test."
              />
              <Button type="button" variant="tertiary" onClick={runManualScan}>
                Verify Token
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {edgeState && (
            <Message tone={edgeState.tone} title={edgeState.title}>
              {edgeState.message}
            </Message>
          )}

          {verification ? (
            <div ref={verificationRootRef}>
              <Card className="verification-card border-secondary shadow-elevated opacity-0" bodyClassName="p-0">
                <div className="space-y-5 p-5">
                  <div className="flex items-start gap-4">
                    <div className="verification-photo opacity-0">
                      <StudentPhoto student={verification} />
                    </div>
                    <div className="verification-details min-w-0 flex-1 opacity-0">
                      <p className="text-xs font-semibold uppercase text-primary-400">Verified Student</p>
                      <h2 className="mt-1 text-2xl font-bold leading-tight text-primary">
                        {verification.fullName}
                      </h2>
                      <p className="mt-2 text-sm font-medium text-primary-600">
                        {verification.course?.code} - {verification.course?.name}
                      </p>
                      <p className="mt-1 text-sm text-primary-400">{verification.schoolId}</p>
                    </div>
                  </div>

                  {approved && (
                    <div className="flex items-center gap-3 rounded-container border border-success/30 bg-success-light px-4 py-3 text-success">
                      <span className="grid h-8 w-8 place-items-center rounded-pill bg-success text-white shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path className="checkmark-path" d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                      <p className="text-sm font-semibold">Attendance approved</p>
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 border-t border-primary-100 bg-white/95 p-4 backdrop-blur sm:static sm:backdrop-blur-0">
                  <Button
                    type="button"
                    fullWidth
                    size="lg"
                    loading={saving}
                    disabled={approved || isAlreadyPresent(verification.id)}
                    onClick={handleApprove}
                    className="approve-button opacity-0"
                  >
                    {approved ? 'Attendance Approved' : 'Approve Attendance'}
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <Card>
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-container bg-primary-50 text-primary-300">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-primary-600">Scan a student QR to verify attendance.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Class Roster Panel ───────────────────────────────────────────── */}
      {selectedClass && (
        <Card title="Class Roster">
          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 rounded-nested border border-primary-100 bg-primary-50 px-3 py-2">
              <span className="text-sm font-medium text-primary-600">Total Enrolled:</span>
              <span className="font-bold text-primary">{roster.length}</span>
            </div>
            <div className="flex items-center gap-2 rounded-nested border border-success/30 bg-success-light px-3 py-2">
              <span className="text-sm font-medium text-success">Present:</span>
              <span className="font-bold text-success">{presentCount}</span>
            </div>
            <div className="flex items-center gap-2 rounded-nested border border-error/30 bg-error-light px-3 py-2">
              <span className="text-sm font-medium text-error">Absent:</span>
              <span className="font-bold text-error">{absentCount}</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search roster..."
              value={rosterSearch}
              onChange={e => setRosterSearch(e.target.value)}
              className="block w-full rounded-nested border border-primary-200 bg-white pl-9 pr-3 py-2 text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Roster list */}
          {roster.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-primary-400">No students enrolled in this class yet.</p>
              <p className="text-xs text-primary-300 mt-1">Ask the admin to enroll students via the Classes page.</p>
            </div>
          ) : (
            <div className="divide-y divide-primary-100 rounded-container border border-primary-100 overflow-hidden">
              {filteredRoster.map((student) => (
                <div
                  key={student.id}
                  className={[
                    'flex items-center justify-between gap-4 px-4 py-3 transition-colors',
                    student.attendanceStatus === 'present' || student.attendanceStatus === 'late'
                      ? 'bg-success-light/40'
                      : 'bg-white hover:bg-primary-50',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-primary-100 text-sm font-bold text-primary-600">
                      {student.fullName?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary truncate">{student.fullName}</p>
                      <p className="text-xs text-primary-400">{student.schoolId}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-0.5">
                    <StatusBadge status={student.attendanceStatus} />
                    {student.scannedAt && (
                      <span className="text-xs text-primary-400">
                        {new Date(student.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
