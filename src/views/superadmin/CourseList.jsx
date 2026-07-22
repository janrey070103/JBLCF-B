// Courses management view — Superadmin only.
// Supports listing, adding, and editing courses.
// Wired to GET /api/admin/courses (list), POST (create), PUT /:id (update).
import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import Table from '../../components/Table.jsx';
import { fetchApi } from '../../api/client.js';

function CourseModal({ course, onClose, onSaved }) {
  const isEdit = !!course?.id;
  const [values, setValues] = useState({
    code: course?.code ?? '',
    name: course?.name ?? '',
    description: course?.description ?? '',
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
    if (!values.code.trim()) errs.code = 'Course code is required.';
    if (!values.name.trim()) errs.name = 'Course name is required.';
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
      if (isEdit) {
        await fetchApi(`/api/admin/courses/${course.id}`, {
          method: 'PUT',
          body: JSON.stringify(values),
        });
      } else {
        await fetchApi('/api/admin/courses', {
          method: 'POST',
          body: JSON.stringify(values),
        });
      }
      onSaved();
    } catch (err) {
      setApiError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-primary-900/40 backdrop-blur-sm"
      />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-container border border-primary-100 bg-white shadow-elevated animate-fade-up">
        <div className="flex items-center justify-between border-b border-primary-100 px-5 py-4">
          <h2 id="course-modal-title" className="text-base font-semibold text-primary">
            {isEdit ? 'Edit Course' : 'Add Course'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-nested p-1 text-primary-400 hover:text-primary hover:bg-primary-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-5 py-4 space-y-4">
            <Input
              label="Course Code"
              id="course-code"
              value={values.code}
              onChange={setField('code')}
              error={errors.code}
              hint="e.g. BSMT, BSCS"
            />
            <Input
              label="Course Name"
              id="course-name"
              value={values.name}
              onChange={setField('name')}
              error={errors.name}
              hint="e.g. BS Marine Transportation"
            />
            <Input
              label="Description"
              id="course-desc"
              value={values.description}
              onChange={setField('description')}
              hint="Optional"
            />
            {apiError && (
              <div role="alert" className="rounded-nested border border-error/40 bg-error-light px-4 py-3 text-sm text-error">
                <span className="font-semibold">Error: </span>{apiError}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-primary-100 px-5 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="tertiary" onClick={onClose} disabled={saving} fullWidth>
              Cancel
            </Button>
            <Button type="submit" loading={saving} fullWidth>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Course'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalCourse, setModalCourse] = useState(undefined); // undefined=closed, null=add, object=edit

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchApi('/api/admin/courses', { method: 'GET' });
      setCourses(list || []);
    } catch (e) {
      console.error('Failed to load courses:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)),
    );
  }, [courses, search]);

  const handleSaved = () => {
    setModalCourse(undefined);
    load();
  };

  const columns = useMemo(
    () => [
      {
        key: 'code',
        header: 'Code',
        className: 'whitespace-nowrap font-mono',
        render: (row) => (
          <span className="inline-flex rounded-pill border border-primary-100 bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
            {row.code}
          </span>
        ),
      },
      {
        key: 'name',
        header: 'Course Name',
        render: (row) => (
          <div>
            <p className="font-medium text-primary">{row.name}</p>
            {row.description && (
              <p className="text-xs text-primary-400 mt-0.5">{row.description}</p>
            )}
          </div>
        ),
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
            onClick={() => setModalCourse(row)}
          >
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      {modalCourse !== undefined && (
        <CourseModal
          course={modalCourse}
          onClose={() => setModalCourse(undefined)}
          onSaved={handleSaved}
        />
      )}

      <div className="space-y-4 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">Courses</h1>
            <p className="text-sm text-primary-400 mt-0.5">
              {filtered.length} {filtered.length === 1 ? 'course' : 'courses'} found
            </p>
          </div>
          <Button onClick={() => setModalCourse(null)}>
            Add Course
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="search"
            aria-label="Search courses"
            placeholder="Search by code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-nested border border-primary-200 bg-white pl-9 pr-3 py-2 text-base text-primary-900 placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Table */}
        {loading ? (
          <Card>
            <div className="space-y-3 py-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-nested bg-primary-50 animate-pulse" />
              ))}
            </div>
          </Card>
        ) : (
          <div className="max-h-[65svh] overflow-y-auto rounded-container">
            <Table
              columns={columns}
              rows={filtered}
              rowKey={(row) => row.id}
              emptyText={
                search
                  ? 'No courses match your search.'
                  : 'No courses yet. Add your first course to get started.'
              }
            />
          </div>
        )}
      </div>
    </>
  );
}
