import { useState, useEffect } from 'react';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Select from '../../components/Select.jsx';
import { fetchApi } from '../../api/client.js';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('class'); // 'class' or 'student'
  
  // Data for dropdowns
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  // Form states
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedStudent, setSelectedStudent] = useState('');

  // Results
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load dropdowns on mount
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchApi('/api/admin/classes'),
      fetchApi('/api/admin/students')
    ]).then(([clsData, stdData]) => {
      if (alive) {
        if (clsData?.classes) setClasses(clsData.classes);
        if (stdData?.students) setStudents(stdData.students);
      }
    }).catch(console.error);
    return () => { alive = false; };
  }, []);

  const handleGenerateClassReport = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      setError('Please select a class.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await fetchApi(`/api/admin/reports/class?classId=${selectedClass}&startDate=${startDate}&endDate=${endDate}`);
      setReportData(data || []);
    } catch (err) {
      setError(err.message);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStudentReport = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      setError('Please select a student.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await fetchApi(`/api/admin/reports/student?studentId=${selectedStudent}`);
      setReportData(data || []);
    } catch (err) {
      setError(err.message);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    
    // Determine headers based on active tab
    const headers = activeTab === 'class' 
      ? ['Date', 'Student Name', 'Status', 'Method', 'Note']
      : ['Date', 'Class Code', 'Status', 'Method', 'Note'];
    
    const rows = reportData.map(row => {
      if (activeTab === 'class') {
        return [row.sessionDate, row.studentName, row.status, row.method, row.note];
      }
      return [row.sessionDate, row.classCode, row.status, row.method, row.note];
    });

    // Escape CSV values
    const escape = (str) => {
      if (str == null) return '';
      const s = String(str);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escape).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = activeTab === 'class' 
      ? `Class_Report_${selectedClass}_${startDate}_to_${endDate}.csv`
      : `Student_Report_${selectedStudent}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Attendance Reports</h1>
          <p className="text-sm text-primary-400 mt-1">Generate and export attendance analytics.</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {/* Tab Header */}
        <div className="flex border-b border-primary-100 bg-primary-50/50">
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'class'
                ? 'text-primary border-b-2 border-secondary bg-white'
                : 'text-primary-500 hover:text-primary hover:bg-primary-50'
            }`}
            onClick={() => { setActiveTab('class'); setReportData([]); setError(null); }}
          >
            Class Report
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'student'
                ? 'text-primary border-b-2 border-secondary bg-white'
                : 'text-primary-500 hover:text-primary hover:bg-primary-50'
            }`}
            onClick={() => { setActiveTab('student'); setReportData([]); setError(null); }}
          >
            Student Report
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-3 bg-error-light text-error text-sm rounded border border-error/20">
              {error}
            </div>
          )}

          {activeTab === 'class' && (
            <form onSubmit={handleGenerateClassReport} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <Select
                label="Class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={[
                  { value: '', label: 'Select a class...' },
                  ...classes.map(c => ({ value: c.id, label: `${c.code} - ${c.title}` }))
                ]}
              />
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Button type="submit" loading={loading} disabled={loading}>
                Generate
              </Button>
            </form>
          )}

          {activeTab === 'student' && (
            <form onSubmit={handleGenerateStudentReport} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-3">
                <Select
                  label="Student"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  options={[
                    { value: '', label: 'Select a student...' },
                    ...students.map(s => ({ value: s.id, label: `${s.lastName}, ${s.firstName} (${s.studentId})` }))
                  ]}
                />
              </div>
              <Button type="submit" loading={loading} disabled={loading}>
                Generate
              </Button>
            </form>
          )}
        </div>
      </Card>

      {/* Results Table */}
      {reportData.length > 0 && (
        <Card className="p-0 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-primary-100 flex justify-between items-center bg-primary-50/30">
            <h3 className="font-semibold text-primary">Report Results ({reportData.length} records)</h3>
            <Button type="button" variant="secondary" size="sm" onClick={handleExportCSV}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-primary-500 uppercase bg-primary-50 border-b border-primary-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">
                    {activeTab === 'class' ? 'Student Name' : 'Class Code'}
                  </th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Method</th>
                  <th className="px-6 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100 bg-white text-primary">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-primary-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(row.sessionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {activeTab === 'class' ? row.studentName : row.classCode}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-nested inline-block ${
                        row.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                        row.status === 'late' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-primary-500 capitalize">{row.method || '-'}</td>
                    <td className="px-6 py-4 text-primary-500 max-w-[200px] truncate" title={row.note}>
                      {row.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && reportData.length === 0 && !error && selectedClass && activeTab === 'class' && (
         <div className="text-center py-12 text-primary-400 border border-dashed border-primary-200 rounded-container">
           No attendance records found for this criteria.
         </div>
      )}
    </div>
  );
}
