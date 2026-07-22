// Student List view — superadmin. Searchable + paginated table with
// skeleton loading, staggered row entrance, and "Add Student" CTA.
// Search filters in-place and does NOT replace scroll position (spec).
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentController } from '../../controllers/useStudentController';
import { SearchInput } from '../../components/Input.jsx';
import { StudentListSkeleton } from '../../components/Skeletons.jsx';
import Table from '../../components/Table.jsx';
import Button from '../../components/Button.jsx';

// Pagination controls rendered below the table.
function Pagination({ page, pageSize, total, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
      <p className="text-sm text-primary-400">
        Showing {start}–{end} of {total} students
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          ← Prev
        </Button>
        <span className="px-3 py-1 text-sm font-medium text-primary">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

export default function StudentList() {
  const navigate = useNavigate();
  const {
    students: filtered,
    loading,
    search,
    setSearch,
    courseList,
    page,
    pageSize,
    total,
    setPage,
  } = useStudentController();

  const columns = useMemo(
    () => [
      {
        key: 'schoolId',
        header: 'School ID',
        className: 'whitespace-nowrap',
      },
      {
        key: 'fullName',
        header: 'Full Name',
        render: (row) => (
          <div>
            <p className="font-medium text-primary">{row.fullName}</p>
            <p className="text-xs text-primary-400">{row.email}</p>
          </div>
        ),
      },
      {
        key: 'courseId',
        header: 'Course',
        render: (row) => {
          const course = courseList.find((c) => c.id === row.courseId);
          return course ? (
            <span className="inline-flex px-2 py-0.5 rounded-pill text-xs font-medium bg-primary-50 text-primary-600 border border-primary-100">
              {course.code}
            </span>
          ) : '—';
        },
      },
      {
        key: 'yearLevel',
        header: 'Year',
      },
      {
        key: 'actions',
        header: '',
        className: 'text-right',
        render: (row) => (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              onClick={() => navigate(`/admin/students/${row.id}/qr`)}
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <rect width="3" height="3" x="7" y="7" />
                <rect width="3" height="3" x="14" y="7" />
                <rect width="3" height="3" x="7" y="14" />
                <rect width="3" height="3" x="14" y="14" />
              </svg>
              View QR
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/admin/students/${row.id}/edit`)}>
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [courseList, navigate],
  );

  const rowKey = (row) => row.id;

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Students</h1>
          <p className="text-sm text-primary-400 mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'student' : 'students'} found
          </p>
        </div>
        <Button onClick={() => navigate('/admin/students/new')} fullWidth>
          Add Student
        </Button>
      </div>

      {/* Search bar — the ONLY place using placeholder text per spec */}
      <SearchInput
        placeholder="Search by name, ID, or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="sm:max-w-md"
      />

      {/* Table or skeleton */}
      {loading ? (
        <StudentListSkeleton rows={6} />
      ) : (
        <div className="space-y-3">
          <div className="max-h-[58svh] overflow-y-auto rounded-container">
            <Table
              columns={columns}
              rows={filtered}
              rowKey={rowKey}
              emptyText={
                search
                  ? 'No students match your search.'
                  : 'No students yet. Add your first student to get started.'
              }
            />
            {/* Staggered entrance is applied to rows via the .student-table CSS class in index.css. */}
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPage={setPage}
          />
        </div>
      )}
    </div>
  );
}
