// Student controller — the "C" in MVC for the superadmin student module.
// Owns all CRUD state + search + loading. Views consume this; they never
// touch mocks/api.js directly.
import { useCallback, useEffect, useState } from 'react';
import { fetchApi } from '../api/client.js';

const PAGE_SIZE = 20;

export function useStudentController() {
  // ── List state ──────────────────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Client-side filter applied on top of the already-paginated server result.
  // Searching resets to page 1 so the user doesn't land on an empty page.
  const handleSetSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.fullName && s.fullName.toLowerCase().includes(q)) ||
      (s.schoolId && s.schoolId.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  const refresh = useCallback(async (targetPage = page) => {
    setLoading(true);
    try {
      // Fetch students (paginated) and courses in parallel
      const [envelope, courseList] = await Promise.all([
        fetchApi(`/api/admin/students?page=${targetPage}&pageSize=${PAGE_SIZE}`, { method: 'GET' }),
        fetchApi('/api/admin/courses', { method: 'GET' })
      ]);
      setStudents(envelope?.students || []);
      setTotal(envelope?.total || 0);
      setCourses(courseList || []);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { refresh(); }, [refresh]);


  // ── Single student (for edit) ──────────────────────────────────────
  const [current, setCurrent] = useState(null);

  const fetchById = useCallback(async (id) => {
    const s = await fetchApi(`/api/admin/students/${id}`, { method: 'GET' });
    setCurrent(s);
    return s;
  }, []);

  /**
   * Converts a base64 data URL to a File object suitable for multipart upload.
   * FacialCapture returns a data URL; the upload endpoint expects a File/Blob.
   */
  function dataUrlToFile(dataUrl, filename = 'photo.jpg') {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  }

  // ── Create / Update ───────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  /**
   * Save (create or update) a student record.
   * Accepts `data.photo` as either a File object or a base64 DataURL string.
   */
  const save = useCallback(async (data) => {
    setSaving(true);
    try {
      const { id, ...payload } = data;

      // If photo is a File, convert to base64 DataURL
      if (payload.photo instanceof File) {
        payload.photo = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(payload.photo);
        });
      }

      // 1. Create or Update the JSON record (including photo base64)
      let record;
      if (id) {
        await fetchApi(`/api/admin/students/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        record = { id, ...payload };
      } else {
        const res = await fetchApi('/api/admin/students', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        record = { id: res.id, qrToken: res.qrToken, ...payload };
      }

      await refresh(); // re-fetch so list reflects the change
      return record;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  // ── Delete ────────────────────────────────────────────────────────
  const removeStudent = useCallback(async (id) => {
    await fetchApi(`/api/admin/students/${id}`, { method: 'DELETE' });
    await refresh();
  }, [refresh]);

  // ── Courses dropdown ────────────────────────────────────────────────
  const courseList = courses;

  // ── QR generation result (set after save → navigated to QR view) ────
  const [qrStudent, setQrStudent] = useState(null);

  const markForQr = useCallback((student) => {
    setQrStudent(student);
  }, []);

  return {
    // List
    students: filtered,
    allStudents: students,
    loading,
    search,
    setSearch: handleSetSearch,
    // Pagination
    page,
    pageSize: PAGE_SIZE,
    total,
    setPage,
    refresh,
    // Single
    current,
    fetchById,
    setCurrent,
    // Save
    saving,
    save,
    removeStudent,
    // Courses
    courseList,
    // QR
    qrStudent,
    markForQr,
  };
}
