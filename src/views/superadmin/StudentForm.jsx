import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import FacialCapture from '../../components/FacialCapture.jsx';
import Input from '../../components/Input.jsx';
import Select from '../../components/Select.jsx';
import { StudentFormSkeleton } from '../../components/Skeletons.jsx';
import { useStudentController } from '../../controllers/useStudentController.jsx';

const blankForm = {
  lastName: '',
  firstName: '',
  middleName: '',
  suffix: '',
  schoolId: '',
  courseId: '',
  email: '',
  phone: '',
  photo: null,
};

function validateStudentForm(values) {
  const errors = {};
  if (!values.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!values.firstName.trim()) errors.firstName = 'First name is required.';
  if (!values.schoolId.trim()) errors.schoolId = 'School ID is required.';
  if (!values.courseId) errors.courseId = 'Course is required.';
  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!values.phone.trim()) errors.phone = 'Contact number is required.';
  return errors;
}

// ── Confirmation modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ studentName, onConfirm, onCancel, loading }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 bg-primary-900/40 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-container border border-primary-100 bg-white shadow-elevated p-6 space-y-4 animate-fade-up">
        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-container bg-error-light">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-error" aria-hidden="true">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01" />
          </svg>
        </div>

        <div>
          <h2 id="delete-modal-title" className="text-lg font-bold text-primary">Delete Student</h2>
          <p className="mt-1 text-sm text-primary-500">
            Are you sure you want to delete <span className="font-semibold text-primary">{studentName}</span>?
            This will deactivate the student record and their QR code will no longer be scannable.
            This action cannot be undone.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="tertiary" onClick={onCancel} disabled={loading} fullWidth>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={loading} fullWidth>
            {loading ? 'Deleting...' : 'Yes, Delete Student'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function StudentForm() {
  const { id } = useParams();
  const studentId = id ? Number(id) : null;
  const isEdit = Number.isFinite(studentId);
  const navigate = useNavigate();
  const { courseList, current, fetchById, save, saving, removeStudent } = useStudentController();
  const [values, setValues] = useState(blankForm);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    async function loadStudent() {
      if (!isEdit) return;
      setLoading(true);
      const student = await fetchById(studentId);
      if (!alive) return;
      if (!student) {
        setLoading(false);
        return;
      }
      setValues({
        lastName: student.lastName ?? '',
        firstName: student.firstName ?? '',
        middleName: student.middleName ?? '',
        suffix: student.suffix ?? '',
        schoolId: student.schoolId ?? '',
        courseId: String(student.courseId ?? ''),
        email: student.email ?? '',
        phone: student.phone ?? '',
        photo: student.photo ?? null,
      });
      setLoading(false);
    }
    loadStudent();
    return () => {
      alive = false;
    };
  }, [fetchById, isEdit, studentId]);

  const title = isEdit ? 'Edit Student' : 'Add Student';

  const selectedCourse = useMemo(
    () => courseList.find((course) => String(course.id) === values.courseId),
    [courseList, values.courseId],
  );

  const courseOptions = useMemo(() => [
    { value: '', label: 'Select course' },
    ...courseList.map(course => ({
      value: String(course.id),
      label: `${course.code} - ${course.name}`
    }))
  ], [courseList]);

  const setField = (field) => (event) => {
    const next = event.target.value;
    setValues((prev) => ({ ...prev, [field]: next }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // UX-only validation. Backend validation remains the source of truth.
    const nextErrors = validateStudentForm(values);
    setErrors(nextErrors);
    setApiError('');
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const saved = await save({
        ...(current?.id ? { id: current.id } : {}),
        ...values,
        courseId: Number(values.courseId),
        email: values.email.trim(),
      });
      navigate(`/admin/students/${saved.id}/qr`, { replace: true });
    } catch (err) {
      setApiError(err.message || 'An error occurred. Please try again.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removeStudent(studentId);
      navigate('/admin/students', { replace: true });
    } catch (err) {
      setShowDeleteModal(false);
      setApiError(err.message || 'Failed to delete student. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <StudentFormSkeleton />;
  }

  return (
    <>
      {/* Delete confirmation modal — rendered outside the form so it doesn't submit */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          studentName={current?.fullName ?? values.firstName}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleting}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4 animate-fade-up" noValidate>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">{isEdit ? 'Edit Student' : 'Add Student'}</h1>
            <p className="text-sm text-primary-400 mt-0.5">
              {isEdit ? 'Update student record and details.' : 'Enroll a new student and generate their QR pass.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isEdit && (
              <Button
                type="button"
                variant="tertiary"
                onClick={() => navigate(`/admin/students/${id}/qr`)}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <rect width="3" height="3" x="7" y="7" />
                  <rect width="3" height="3" x="14" y="7" />
                  <rect width="3" height="3" x="7" y="14" />
                  <rect width="3" height="3" x="14" y="14" />
                </svg>
                View/Print QR
              </Button>
            )}
            {isEdit && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Student
              </Button>
            )}
            <Button type="button" variant="tertiary" onClick={() => navigate('/admin/students')}>
              Back to Students
            </Button>
          </div>
        </div>

        <Card title="Student Information">
          <div className="grid gap-4 md:grid-cols-2">
            <Input required label="Last Name" value={values.lastName} onChange={setField('lastName')} error={errors.lastName} />
            <Input required label="First Name" value={values.firstName} onChange={setField('firstName')} error={errors.firstName} />
            <Input label="Middle Name" value={values.middleName} onChange={setField('middleName')} />
            <Input label="Suffix" value={values.suffix} onChange={setField('suffix')} />
            <Input
              required
              label="School ID"
              mask="schoolId"
              value={values.schoolId}
              onChange={setField('schoolId')}
              error={errors.schoolId}
            />
            <Select
              required
              label="Course"
              id="student-course"
              value={values.courseId}
              onChange={setField('courseId')}
              options={courseOptions}
              error={errors.courseId}
            />
            <Input
              required
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={values.email}
              onChange={setField('email')}
              error={errors.email}
            />
            <Input
              required
              label="Contact Number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              mask="phone"
              value={values.phone}
              onChange={setField('phone')}
              error={errors.phone}
            />
          </div>
        </Card>

        <Card title="Facial Capture">
          <FacialCapture
            initialPhoto={values.photo}
            onCapture={(photo) => setValues((prev) => ({ ...prev, photo }))}
          />
        </Card>

        {apiError && (
          <div role="alert" className="rounded-nested border border-error/40 bg-error-light px-4 py-3 text-sm text-error">
            <span className="font-semibold">Error: </span>{apiError}
          </div>
        )}

        <div className="sticky bottom-0 -mx-4 border-t border-primary-100 bg-base/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="tertiary" onClick={() => navigate('/admin/students')} fullWidth>
              Cancel
            </Button>
            <Button type="submit" loading={saving} fullWidth>
              {saving ? 'Saving...' : isEdit ? 'Save' : 'Save and Generate QR'}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
