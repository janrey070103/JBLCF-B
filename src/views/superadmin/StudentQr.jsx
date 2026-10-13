import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import logo from '../../assets/logo.jpg';
import Card from '../../components/Card.jsx';
import { QrGenerationSkeleton } from '../../components/Skeletons.jsx';
import { useStudentController } from '../../controllers/useStudentController.jsx';

import { resolveApiUrl } from '../../api/client.js';

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
        <section className="w-[3.375in] h-[2.125in] bg-white border-2 border-primary rounded-xl shadow-card overflow-hidden flex flex-col justify-between transition-transform duration-200 ease-out-soft hover:-translate-y-0.5">
          {/* Card Top Header */}
          <div className="bg-primary text-white px-3.5 py-2 flex items-center justify-between border-b-2 border-secondary shrink-0">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold tracking-wide uppercase leading-tight text-white">JBLCF - Bacolod</p>
              <p className="text-[9px] text-secondary font-medium tracking-wide">Student Attendance Pass</p>
            </div>
            <img src={logo} alt="JBLCF-B Logo" className="h-7 w-7 rounded-full object-cover bg-white shrink-0 p-0.5 shadow-sm" />
          </div>

          {/* Card Body */}
          <div className="flex-1 flex items-center gap-3 px-3.5 py-2 min-h-0 bg-white">
            {student.photo ? (
              <img
                src={resolveApiUrl(student.photo)}
                alt={student.fullName}
                className="w-14 h-18 rounded-lg object-cover border-2 border-primary/20 shrink-0 bg-primary-50 shadow-sm"
              />
            ) : (
              <div className="w-14 h-18 rounded-lg border-2 border-dashed border-primary/30 shrink-0 bg-primary-50/50 flex flex-col items-center justify-center text-primary font-bold text-sm">
                <span>{student.fullName ? student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST'}</span>
                <span className="text-[8px] font-normal text-primary-400 mt-0.5">NO PHOTO</span>
              </div>
            )}
            <div className="min-w-0 flex-1 py-0.5">
              <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-secondary/20 text-primary-900 border border-secondary/40">
                Student
              </span>
              <h2 className="text-sm font-bold text-primary leading-tight break-words mt-1 line-clamp-2">
                {student.fullName}
              </h2>
              <p className="text-xs font-bold text-primary-800 mt-1 tracking-tight">
                {student.schoolId}
              </p>
              <p className="text-[9px] text-primary-500 truncate mt-0.5">
                {student.email}
              </p>
            </div>
            <div className="bg-white border-2 border-primary/15 p-1.5 rounded-lg shrink-0 shadow-sm">
              <QRCodeSVG value={qrValue} size={72} level="M" includeMargin={false} />
            </div>
          </div>

          {/* Card Bottom Footer Accent */}
          <div className="bg-primary text-white text-[8px] font-semibold tracking-wider uppercase px-3 py-1 flex items-center justify-between border-t border-primary-800 shrink-0">
            <span className="text-white/80">Scan for Attendance</span>
            <span className="text-secondary font-bold">Official ID Pass</span>
          </div>
        </section>
      </div>
    </div>
  );
}
