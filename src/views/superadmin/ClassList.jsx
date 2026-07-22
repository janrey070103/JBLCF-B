import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import Select from '../../components/Select.jsx';
import Table from '../../components/Table.jsx';
import { fetchApi } from '../../api/client.js';

// ── Class create/edit modal ─────────────────────────────────────────────────
function ClassModal({ classItem, courses, professors, onClose, onSaved }) {
  const isEdit = !!classItem?.id;
  const [values, setValues] = useState({
    code: classItem?.code ?? '',
    title: classItem?.title ?? '',
    professorId: classItem?.professorId ?? '',
    courseId: classItem?.courseId ?? '',
    schedule: classItem?.schedule ?? '',
    room: classItem?.room ?? '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!values.code.trim()) errs.code = 'Class code is required.';
    if (!values.title.trim()) errs.title = 'Title is required.';
    if (!values.professorId) errs.professorId = 'Professor is required.';
    if (!values.courseId) errs.courseId = 'Course is required.';
    if (!values.schedule.trim()) errs.schedule = 'Schedule is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setApiError('');
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        ...values,
        professorId: Number(values.professorId),
        courseId: Number(values.courseId),
      };

      if (isEdit) {
        await fetchApi(`/api/admin/classes/${classItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/api/admin/classes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      onSaved();
    } catch (err) {
      setApiError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete class ${values.code}?`)) return;
    setSaving(true);
    try {
      await fetchApi(`/api/admin/classes/${classItem.id}`, { method: 'DELETE' });
      onSaved();
    } catch (err) {
      setApiError(err.message || 'Cannot delete class, it may have attendance records attached.');
      setSaving(false);
    }
  };

  const courseOptions = useMemo(() => [
    { value: '', label: 'Select course...' },
    ...courses.map(c => ({ value: String(c.id), label: `${c.code} - ${c.name}` })),
  ], [courses]);

  const professorOptions = useMemo(() => [
    { value: '', label: 'Select professor...' },
    ...professors.map(p => ({ value: String(p.id), label: p.fullName })),
  ], [professors]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-primary-900/40 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-lg rounded-container border border-primary-100 bg-white shadow-elevated animate-fade-up">
        <div className="flex items-center justify-between border-b border-primary-100 px-5 py-4">
          <h2 id="class-modal-title" className="text-base font-semibold text-primary">
            {isEdit ? 'Edit Class' : 'Add Class'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-nested p-1 text-primary-400 hover:text-primary hover:bg-primary-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-5 py-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input required label="Class Code" value={values.code} onChange={setField('code')} error={errors.code} hint="e.g. NAV-101" />
              <Input required label="Title" value={values.title} onChange={setField('title')} error={errors.title} />
            </div>
            <Select required label="Course" value={values.courseId} onChange={setField('courseId')} options={courseOptions} error={errors.courseId} />
            <Select required label="Professor" value={values.professorId} onChange={setField('professorId')} options={professorOptions} error={errors.professorId} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input required label="Schedule" value={values.schedule} onChange={setField('schedule')} error={errors.schedule} hint="e.g. MWF 08:00–09:00" />
              <Input label="Room" value={values.room} onChange={setField('room')} />
            </div>

            {apiError && (
              <div className="rounded-nested border border-error/40 bg-error-light px-4 py-3 text-sm text-error">
                <span className="font-semibold">Error: </span>{apiError}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-primary-100 px-5 py-4 sm:flex-row sm:justify-end sm:items-center">
            {isEdit && (
              <Button type="button" variant="danger" size="sm" onClick={handleDelete} className="sm:mr-auto" disabled={saving}>
                Delete
              </Button>
            )}
            <Button type="button" variant="tertiary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? 'Saving...' : 'Save Class'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Enrollment modal ─────────────────────────────────────────────────────────
function EnrollmentModal({ classItem, onClose }) {
  const [enrolled, setEnrolled] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // studentId being acted on

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [enrolledList, studentsEnvelope] = await Promise.all([
        fetchApi(`/api/admin/classes/${classItem.id}/enrollments`, { method: 'GET' }),
        fetchApi('/api/admin/students?pageSize=200', { method: 'GET' }),
      ]);
      setEnrolled(enrolledList || []);
      setAllStudents(studentsEnvelope?.students || []);
    } catch (e) {
      console.error('Failed to load enrollment data', e);
    } finally {
      setLoading(false);
    }
  }, [classItem.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const enrolledIds = useMemo(() => new Set(enrolled.map(s => s.id)), [enrolled]);

  // Students not yet enrolled, filtered by search
  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allStudents.filter(s => {
      if (enrolledIds.has(s.id)) return false;
      if (!q) return true;
      return s.fullName?.toLowerCase().includes(q) || s.schoolId?.toLowerCase().includes(q);
    });
  }, [allStudents, enrolledIds, search]);

  const handleEnroll = async (studentId) => {
    setSaving(studentId);
    try {
      await fetchApi(`/api/admin/classes/${classItem.id}/enrollments`, {
        method: 'POST',
        body: JSON.stringify({ studentId }),
      });
      await loadData();
    } catch (e) {
      alert(e.message || 'Failed to enroll student');
    } finally {
      setSaving(null);
    }
  };

  const handleRemove = async (studentId) => {
    setSaving(studentId);
    try {
      await fetchApi(`/api/admin/classes/${classItem.id}/enrollments/${studentId}`, { method: 'DELETE' });
      await loadData();
    } catch (e) {
      alert(e.message || 'Failed to remove student');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enrollment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-primary-900/40 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-2xl rounded-container border border-primary-100 bg-white shadow-elevated animate-fade-up flex flex-col max-h-[90svh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary-100 px-5 py-4 shrink-0">
          <div>
            <h2 id="enrollment-modal-title" className="text-base font-semibold text-primary">
              Manage Enrollments
            </h2>
            <p className="text-xs text-primary-400 mt-0.5">{classItem.code} — {classItem.title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-nested p-1 text-primary-400 hover:text-primary hover:bg-primary-50 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-primary-100 overflow-hidden flex-1 min-h-0">
          {/* Enrolled students */}
          <div className="flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-primary-100 shrink-0">
              <p className="text-sm font-semibold text-primary">
                Enrolled <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-pill bg-primary text-white text-xs">{enrolled.length}</span>
              </p>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-2 space-y-1">
              {loading ? (
                <div className="space-y-2 py-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-nested bg-primary-50 animate-pulse" />)}</div>
              ) : enrolled.length === 0 ? (
                <p className="py-6 text-center text-sm text-primary-400">No students enrolled yet.</p>
              ) : enrolled.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-2 rounded-nested px-3 py-2 hover:bg-primary-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{s.fullName}</p>
                    <p className="text-xs text-primary-400">{s.schoolId}</p>
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={saving === s.id}
                    onClick={() => handleRemove(s.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Available students */}
          <div className="flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-primary-100 shrink-0">
              <p className="text-sm font-semibold text-primary mb-2">Add Students</p>
              <input
                type="search"
                placeholder="Search by name or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="block w-full rounded-nested border border-primary-200 bg-white px-3 py-1.5 text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-2 space-y-1">
              {loading ? (
                <div className="space-y-2 py-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-nested bg-primary-50 animate-pulse" />)}</div>
              ) : available.length === 0 ? (
                <p className="py-6 text-center text-sm text-primary-400">
                  {search ? 'No students match your search.' : 'All students have been enrolled.'}
                </p>
              ) : available.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-2 rounded-nested px-3 py-2 hover:bg-primary-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{s.fullName}</p>
                    <p className="text-xs text-primary-400">{s.schoolId}</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={saving === s.id}
                    onClick={() => handleEnroll(s.id)}
                  >
                    Enroll
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-100 px-5 py-3 shrink-0 flex justify-end">
          <Button type="button" variant="tertiary" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main ClassList page ───────────────────────────────────────────────────────
export default function ClassList() {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalClass, setModalClass] = useState(undefined);
  const [enrollmentClass, setEnrollmentClass] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [classList, courseList, userList] = await Promise.all([
        fetchApi('/api/admin/classes', { method: 'GET' }),
        fetchApi('/api/admin/courses', { method: 'GET' }),
        fetchApi('/api/admin/users', { method: 'GET' }),
      ]);
      setClasses(classList || []);
      setCourses(courseList || []);
      setProfessors((userList || []).filter(u => u.role === 'professor' && u.isActive));
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return classes;
    const q = search.toLowerCase();
    return classes.filter(
      (c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.professorName.toLowerCase().includes(q)
    );
  }, [classes, search]);

  const handleSaved = () => {
    setModalClass(undefined);
    load();
  };

  const columns = useMemo(
    () => [
      {
        key: 'code',
        header: 'Class',
        render: (row) => (
          <div>
            <span className="inline-flex rounded-pill border border-primary-100 bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
              {row.code}
            </span>
            <p className="font-medium text-primary mt-1">{row.title}</p>
          </div>
        ),
      },
      { key: 'courseCode', header: 'Course' },
      { key: 'professorName', header: 'Professor' },
      {
        key: 'schedule',
        header: 'Schedule',
        render: (row) => (
          <div>
            <p className="text-sm text-primary">{row.schedule}</p>
            {row.room && <p className="text-xs text-primary-400">Room {row.room}</p>}
          </div>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'text-right',
        render: (row) => (
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setEnrollmentClass(row)}>
              Enroll Students
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalClass(row)}>
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      {modalClass !== undefined && (
        <ClassModal
          classItem={modalClass}
          courses={courses}
          professors={professors}
          onClose={() => setModalClass(undefined)}
          onSaved={handleSaved}
        />
      )}

      {enrollmentClass && (
        <EnrollmentModal
          classItem={enrollmentClass}
          onClose={() => setEnrollmentClass(null)}
        />
      )}

      <div className="space-y-4 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">Classes</h1>
            <p className="text-sm text-primary-400 mt-0.5">Manage class schedules, assignments, and student enrollments</p>
          </div>
          <Button type="button" onClick={() => setModalClass(null)}>Add Class</Button>
        </div>

        <div className="relative w-full sm:max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-nested border border-primary-200 bg-white pl-9 pr-3 py-2 text-base text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {loading ? (
          <Card>
            <div className="space-y-3 py-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-nested bg-primary-50 animate-pulse" />
              ))}
            </div>
          </Card>
        ) : (
          <div className="max-h-[65svh] overflow-y-auto rounded-container">
            <Table columns={columns} rows={filtered} rowKey={(row) => row.id} emptyText="No classes found." />
          </div>
        )}
      </div>
    </>
  );
}
