import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import logo from '../../assets/logo.jpg';
import Card from '../../components/Card.jsx';
import { QrGenerationSkeleton } from '../../components/Skeletons.jsx';
import { useStudentController } from '../../controllers/useStudentController.jsx';

export default function StudentQr() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchById } = useStudentController();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function loadStudent() {
      setLoading(true);
      const record = await fetchById(Number(id));
      if (!alive) return;
      setStudent(record);
      setLoading(false);
    }
    loadStudent();
    return () => {
      alive = false;
    };
  }, [fetchById, id]);

  if (loading) {
    return (
      <Card title="Generating QR">
        <QrGenerationSkeleton />
      </Card>
    );
  }

  if (!student) {
    return (
      <Card title="Student Not Found">
        <div className="space-y-4">
          <p className="text-sm text-primary-500">No student record matched this QR request.</p>
          <Button onClick={() => navigate('/admin/students')}>Back to Students</Button>
        </div>
      </Card>
    );
  }

  const qrValue = student.qrToken || `JBLCF-STUDENT-${student.id}`;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-primary">Printable QR Output</h1>
          <p className="text-sm text-primary-400 mt-0.5">{student.fullName}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="tertiary" onClick={() => navigate('/admin/students')} fullWidth>
            Back to Students
          </Button>
          <Button onClick={() => window.print()} fullWidth>Print ID Card</Button>
        </div>
      </div>

      <div id="qr-print-area" className="flex justify-center">
        <section className="w-[3.375in] min-h-[2.125in] bg-white border border-primary-200 rounded-nested shadow-card overflow-hidden transition-transform duration-200 ease-out-soft hover:-translate-y-0.5">
          <header className="bg-primary text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold leading-none">JBLCF-B</p>
              <p className="text-[10px] text-white/70 mt-1">Student Attendance ID</p>
            </div>
            <img src={logo} alt="JBLCF-B Logo" className="h-8 w-8 rounded-full object-cover bg-white shrink-0" />
          </header>
          <div className="grid grid-cols-[1fr_auto] gap-3 p-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-primary-400">Student</p>
              <h2 className="text-base font-bold text-primary leading-tight break-words">{student.fullName}</h2>
              <p className="text-xs text-primary-500 mt-2">{student.schoolId}</p>
              <p className="text-xs text-primary-400">{student.email}</p>
            </div>
            <div className="bg-white border border-primary-100 p-2 rounded-nested">
              <QRCodeSVG value={qrValue} size={92} level="M" includeMargin={false} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
