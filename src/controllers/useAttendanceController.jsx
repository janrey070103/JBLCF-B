import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './authHooks.js';
import { fetchApi } from '../api/client.js';
import { ATTENDANCE_STATUS } from '../models';

const today = () => new Date().toISOString().slice(0, 10);
const ATTENDANCE_EVENT = 'jblcf-attendance-updated';

const emitAttendanceUpdate = (record) => {
  window.dispatchEvent(new CustomEvent(ATTENDANCE_EVENT, { detail: record }));
};

export function useAttendanceController() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [sessionDate, setSessionDate] = useState(today());
  const [sessions, setSessions] = useState([]);
  const [records, setRecords] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');



  useEffect(() => {
    let alive = true;
    async function loadBaseData() {
      setLoading(true);
      try {
        const [classList] = await Promise.all([
          user?.id ? fetchApi('/api/prof/classes') : Promise.resolve([]),
        ]);
        if (!alive) return;
        setClasses(classList || []);
        setSelectedClassId((current) => current ?? (classList?.[0]?.id) ?? null);
      } catch (e) {
        console.error('Failed to load base data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadBaseData();
    return () => {
      alive = false;
    };
  }, [user?.id]);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === Number(selectedClassId)) ?? null,
    [classes, selectedClassId],
  );

  const refreshAttendance = useCallback(async () => {
    if (!selectedClassId) {
      setRecords([]);
      setSessions([]);
      setRoster([]);
      return;
    }

    try {
      const [allAttendance, rosterData] = await Promise.all([
        fetchApi(`/api/prof/attendance/class/${selectedClassId}`),
        fetchApi(`/api/prof/classes/${selectedClassId}/roster?date=${sessionDate}`),
      ]);
      const list = allAttendance || [];

      // Extract unique session dates
      const uniqueSessions = [...new Set(list.map((r) => r.date))].sort().reverse();
      if (!uniqueSessions.includes(sessionDate)) {
        uniqueSessions.unshift(sessionDate);
      }

      setRecords(list.filter((r) => r.date === sessionDate));
      setSessions(uniqueSessions);
      setRoster(rosterData || []);
    } catch (e) {
      console.error('Failed to refresh attendance:', e);
    }
  }, [selectedClassId, sessionDate]);

  useEffect(() => {
    let alive = true;
    async function loadAttendance() {
      setLoading(true);
      await refreshAttendance();
      if (alive) setLoading(false);
    }
    loadAttendance();
    return () => {
      alive = false;
    };
  }, [refreshAttendance]);

  useEffect(() => {
    const onAttendanceUpdate = (event) => {
      const record = event.detail;
      if (
        record?.classId === Number(selectedClassId) &&
        record?.date === sessionDate
      ) {
        setRecords((current) => {
          const exists = current.some((item) => item.id === record.id);
          return exists ? current : [record, ...current];
        });
      }
      if (record?.classId === Number(selectedClassId)) {
        setSessions((current) => (
          current.includes(record.date) ? current : [record.date, ...current].sort((a, b) => b.localeCompare(a))
        ));
      }
    };
    window.addEventListener(ATTENDANCE_EVENT, onAttendanceUpdate);
    return () => window.removeEventListener(ATTENDANCE_EVENT, onAttendanceUpdate);
  }, [selectedClassId, sessionDate]);

  const approvedStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records
      .filter((item) => item.student)
      .filter((item) => {
        if (!q) return true;
        return (
          item.student.fullName.toLowerCase().includes(q) ||
          item.student.schoolId.toLowerCase().includes(q) ||
          (item.course?.code && item.course.code.toLowerCase().includes(q))
        );
      });
  }, [records, search]);

  const lookupStudentByQr = useCallback(async (qrToken) => {
    try {
      const response = await fetchApi('/api/prof/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({ qrToken })
      });
      // response is StudentScanResponse (embeds Student and Course)
      return response;
    } catch (e) {
      const err = new Error(e.message || 'Student not found');
      err.code = 'NOT_FOUND';
      throw err;
    }
  }, []);

  const isAlreadyPresent = useCallback(
    (studentId) => records.some((record) => record.studentId === studentId),
    [records],
  );

  const approveAttendance = useCallback(async (student) => {
    if (!selectedClass) {
      const err = new Error('Select a class before approving attendance.');
      err.code = 'NO_CLASS';
      throw err;
    }

    if (isAlreadyPresent(student.id)) {
      const err = new Error('This student is already marked present for this session.');
      err.code = 'DUPLICATE_ATTENDANCE';
      throw err;
    }

    setSaving(true);
    const optimistic = {
      id: `optimistic-${student.id}-${Date.now()}`,
      classId: selectedClass.id,
      studentId: student.id,
      date: sessionDate,
      status: ATTENDANCE_STATUS.PRESENT,
      method: 'qr_scan',
      scannedAt: new Date().toISOString(),
      student: student,
      course: student.course,
    };
    setRecords((current) => [optimistic, ...current]);

    try {
      const saved = await fetchApi('/api/prof/attendance/approve', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClass.id,
          studentId: student.id,
          // date is intentionally omitted — determined server-side to prevent backdating
        })
      });
      const completeRecord = { ...optimistic, id: saved.id, approvalStatus: true };
      
      setRecords((current) => current.map((record) => (
        record.id === optimistic.id ? completeRecord : record
      )));
      emitAttendanceUpdate(completeRecord);
      return completeRecord;
    } catch (error) {
      setRecords((current) => current.filter((record) => record.id !== optimistic.id));
      throw error;
    } finally {
      setSaving(false);
    }
  }, [isAlreadyPresent, selectedClass, sessionDate]);

  return {
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
    saving,
    search,
    setSearch,
    lookupStudentByQr,
    approveAttendance,
    isAlreadyPresent,
    // A student is enrolled if they appear in the class roster fetched from the backend.
    isEnrolledInSelectedClass: (student) => {
      if (!selectedClass || !student) return false;
      return roster.some(r => r.id === student.id);
    },
    refreshAttendance,
  };
}
