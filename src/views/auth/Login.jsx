import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthController } from '../../controllers/useAuthController.jsx';
import { animate, stagger } from 'animejs';
import { USER_ROLES } from '../../models';
import logo from '../../assets/logo.jpg';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    email,
    password,
    submitting,
    formError,
    fieldErrors,
    setEmail,
    setPassword,
    submit,
  } = useAuthController();

  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);

  const homeFor = (role) =>
    role === USER_ROLES.SUPERADMIN ? '/admin' : '/professor';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const res = await submit((user) => {
      navigate(homeFor(user.role), { replace: true, state: { from: location } });
    });
    void res;
  };

  // Anime.js effects
  const qrGridRef = useRef(null);
  const chipContainerRef = useRef(null);
  const qrWrapRef = useRef(null);
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    // Reveal sequence
    animate('.reveal', {
      opacity: [0, 1],
      translateY: [20, 0],
      delay: stagger(90, { start: 250 }),
      duration: 800,
      ease: 'outCubic'
    });

    // QR Grid Generation
    if (qrGridRef.current && qrGridRef.current.children.length === 0) {
      const gridSize = 21;
      const cells = [];
      const isInFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= gridSize - 7) || (r >= gridSize - 7 && c < 7);
      const finderActive = (r, c) => (r === 0 || r === 6 || c === 0 || c === 6) || (r >= 2 && r <= 4 && c >= 2 && c <= 4);

      for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'qr-cell';
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        let active = false;

        if (isInFinder(row, col)) {
          let lr = row, lc = col;
          if (row >= gridSize - 7) lr = row - (gridSize - 7);
          if (col >= gridSize - 7) lc = col - (gridSize - 7);
          active = finderActive(lr, lc);
        } else {
          if (row === 6 || col === 6) {
            active = (row + col) % 2 === 0;
          } else {
            active = Math.random() > 0.55;
          }
        }
        if (active) cell.classList.add('active');
        qrGridRef.current.appendChild(cell);
        cells.push({ el: cell, row, col, isFinder: isInFinder(row, col) });
      }

      animate('.qr-cell.active', {
        opacity: [0, 1],
        scale: [0.4, 1],
        delay: stagger(15, { grid: [gridSize, gridSize], from: 'center' }),
        duration: 500,
        ease: 'outQuad'
      });

      setInterval(() => {
        const dataCells = cells.filter(c => !c.isFinder && !(c.row === 6 || c.col === 6));
        for (let k = 0; k < 18; k++) {
          const c = dataCells[Math.floor(Math.random() * dataCells.length)];
          if (!c) continue;
          if (Math.random() > 0.5) c.el.classList.add('active');
          else c.el.classList.remove('active');
        }
      }, 1400);

      // Floating chips
      const chipIcons = ['fa-qrcode', 'fa-fingerprint', 'fa-shield-halved', 'fa-bolt', 'fa-wifi'];
      for (let i = 0; i < 6; i++) {
        const chip = document.createElement('div');
        chip.className = 'absolute flex items-center justify-center rounded-xl';
        const size = 36 + Math.random() * 32;
        chip.style.cssText = `
          width:${size}px;height:${size}px;
          left:${10 + Math.random() * 80}%;
          top:${10 + Math.random() * 80}%;
          background:rgba(255,193,7,.08);
          border:1px solid rgba(255,193,7,.18);
          color:#FFC107;
          font-size:${size * 0.4}px;
          backdrop-filter:blur(8px);
        `;
        chip.innerHTML = `<i class="fas ${chipIcons[i % chipIcons.length]}"></i>`;
        chipContainerRef.current.appendChild(chip);

        animate(chip, {
          translateY: [0, -25, 0],
          translateX: [0, 15, 0],
          rotate: [0, 180, 360],
          opacity: [0.3, 0.7, 0.3],
          duration: 8000 + Math.random() * 5000,
          ease: 'inOutSine',
          loop: true,
          delay: Math.random() * 3000
        });
      }
    }
  }, []);

  const handleMouseMove = (e) => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    
    // QR Parallax
    if (qrWrapRef.current) {
      const rect = qrWrapRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / 40;
      const dy = (e.clientY - cy) / 40;
      qrWrapRef.current.style.transform = `perspective(800px) rotateY(${dx}deg) rotateX(${-dy}deg) translateZ(0)`;
    }

    // Orb Parallax
    const orbs = document.querySelectorAll('.brand-panel .orb');
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;
    orbs.forEach((orb, i) => {
      const factor = (i + 1) * 0.3;
      orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
    });
  };

  const handleMouseLeave = () => {
    if (qrWrapRef.current) {
      qrWrapRef.current.style.transform = 'perspective(800px) rotateY(0) rotateX(0)';
    }
  };

  const handleInputFocus = (e) => {
    animate(e.target, { scale: [1, 1.005], duration: 300, ease: 'outCubic' });
  };
  
  const handleInputBlur = (e) => {
    animate(e.target, { scale: [1.005, 1], duration: 300, ease: 'outCubic' });
    const name = e.target.name;
    if (name) setTouched(t => ({ ...t, [name]: true }));
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-primary-900 overflow-hidden w-full">
      {/* ============ LEFT: BRAND PANEL ============ */}
      <aside 
        className="brand-panel relative hidden lg:block w-1/2 min-h-screen bg-primary-800 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute inset-0 bg-grid"></div>
        <div className="orb w-[500px] h-[500px] bg-primary-600 -top-32 -left-32 opacity-50"></div>
        <div className="orb w-[400px] h-[400px] bg-secondary-500 bottom-0 right-0 opacity-20"></div>
        <div className="orb w-[300px] h-[300px] bg-primary-500 top-1/3 right-10 opacity-30"></div>
        <div className="noise"></div>

        <div id="floatingChips" ref={chipContainerRef} className="absolute inset-0 pointer-events-none"></div>

        <div className="relative h-full flex flex-col p-4 lg:p-6 xl:p-8 z-10">
          <header className="flex items-center justify-between reveal">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-secondary/30 bg-white">
                <img src={logo} alt="JBLCF-B Logo" className="w-12 h-12 rounded-full object-cover p-1" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-success ring-2 ring-primary-800"></div>
              </div>
              <div>
                <div className="text-white font-bold text-base leading-tight font-display">JBLCF—Bacolod</div>
                <div className="text-secondary-400 text-[10px] mt-0.5 tracking-[0.25em] uppercase">QR Attendance System</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-white/70 text-[10px] tracking-widest uppercase">Online</span>
            </div>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <div className="text-center reveal mb-6 lg:mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-500/10 border border-secondary-500/20 mb-4">
                <i className="fas fa-qrcode text-secondary-400 text-[10px]"></i>
                <span className="text-secondary-400 text-[10px] tracking-[0.2em] uppercase font-semibold">System Portal</span>
              </div>
              <h1 className="text-white text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight font-display">
                Student<br/>
                <span className="bg-gradient-to-r from-secondary-300 via-secondary-500 to-secondary-600 bg-clip-text text-transparent">Attendance.</span>
              </h1>
              <p className="text-white/55 text-sm mt-3 lg:mt-4 max-w-md mx-auto leading-relaxed">
                Efficiently record, track, and manage student attendance in real-time for John B. Lacson Colleges Foundation — Bacolod.
              </p>
            </div>

            <div className="reveal relative" id="qrWrap" ref={qrWrapRef}>
              <div className="relative w-48 h-48 lg:w-56 lg:h-56 p-4 rounded-3xl glass">
                <div className="qr-grid" ref={qrGridRef}></div>
                <div className="scan-line"></div>
                <div className="corner-bracket" style={{top:'-10px',left:'-10px',borderRight:0,borderBottom:0,borderTopLeftRadius:'8px'}}></div>
                <div className="corner-bracket" style={{top:'-10px',right:'-10px',borderLeft:0,borderBottom:0,borderTopRightRadius:'8px'}}></div>
                <div className="corner-bracket" style={{bottom:'-10px',left:'-10px',borderRight:0,borderTop:0,borderBottomLeftRadius:'8px'}}></div>
                <div className="corner-bracket" style={{bottom:'-10px',right:'-10px',borderLeft:0,borderTop:0,borderBottomRightRadius:'8px'}}></div>
              </div>

              <div className="absolute -right-6 top-6 px-3 py-1.5 rounded-lg bg-secondary-500 text-primary-800 text-[10px] font-bold tracking-wider shadow-xl shadow-secondary/30 rotate-6">
                <i className="fas fa-qrcode mr-1"></i>FAST SCAN
              </div>
              <div className="absolute -left-8 bottom-8 px-3 py-1.5 rounded-lg bg-primary-900 border border-white/10 text-white text-[10px] font-bold tracking-wider shadow-xl -rotate-6">
                <i className="fas fa-users mr-1 text-secondary-400"></i>CENTRALIZED
              </div>
            </div>
          </div>

          <div className="reveal grid grid-cols-3 gap-3">
            <div className="feat-card glass rounded-xl p-4 cursor-default">
              <i className="feat-icon fas fa-qrcode text-secondary-400 text-lg mb-2 block"></i>
              <div className="text-white text-xs font-semibold">Quick Check-in</div>
              <div className="text-white/40 text-[10px] mt-0.5">Scan student QR instantly</div>
            </div>
            <div className="feat-card glass rounded-xl p-4 cursor-default">
              <i className="feat-icon fas fa-shield-halved text-secondary-400 text-lg mb-2 block"></i>
              <div className="text-white text-xs font-semibold">Role-based Access</div>
              <div className="text-white/40 text-[10px] mt-0.5">Secure admin & professor login</div>
            </div>
            <div className="feat-card glass rounded-xl p-4 cursor-default">
              <i className="feat-icon fas fa-clipboard-list text-secondary-400 text-lg mb-2 block"></i>
              <div className="text-white text-xs font-semibold">Attendance Records</div>
              <div className="text-white/40 text-[10px] mt-0.5">Real-time class rosters</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ============ RIGHT: LOGIN FORM ============ */}
      <main className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-secondary-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-primary-700/5 rounded-full blur-3xl"></div>
        <div className="absolute top-10 right-10 w-2 h-2 rounded-full bg-secondary-500 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" style={{animationDelay:'.5s'}}></div>

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex items-center gap-3 mb-8 reveal">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg bg-white">
              <img src={logo} alt="JBLCF-B Logo" className="w-11 h-11 rounded-full object-cover p-1" />
            </div>
            <div>
              <div className="font-bold text-primary-800 leading-tight font-display">JBLCF—Bacolod</div>
              <div className="text-[10px] text-secondary-600 tracking-[0.2em] uppercase font-semibold">QR Attendance</div>
            </div>
          </div>

          <div className="mb-4 reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-800/5 border border-primary-800/10 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-500"></span>
              <span className="text-[10px] font-semibold text-primary-700 tracking-[0.2em] uppercase">Professor & Admin</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-800 leading-[1.05] tracking-tight">
              System<br/>
              <span className="text-primary-600">Login.</span>
            </h2>
            <p className="text-primary-400 text-sm mt-1.5 leading-relaxed">
              Sign in to manage attendance, scan QR codes, and view class records.
            </p>
          </div>

          {formError && (
            <div className="reveal mb-6 flex items-start gap-2 px-4 py-3 rounded-nested bg-error-light border border-error/30">
              <i className="fas fa-circle-exclamation text-error mt-0.5 shrink-0"></i>
              <p className="text-sm text-error">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="reveal">
              <label className="text-[10px] font-bold text-primary-400 uppercase tracking-[0.18em] mb-1.5 block">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  name="email"
                  className={`input-field ${touched.email && fieldErrors.email ? 'border-error ring-2 ring-error/20' : 'border-primary-200'}`}
                  placeholder="juan.delacruz@jblcf.edu.ph" 
                  required 
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                <i className="fas fa-envelope input-icon"></i>
              </div>
              {touched.email && fieldErrors.email && <p className="mt-1 text-xs text-error">{fieldErrors.email}</p>}
            </div>

            <div className="reveal">
              <label className="text-[10px] font-bold text-primary-400 uppercase tracking-[0.18em] mb-1.5 block">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={`input-field pr-12 ${touched.password && fieldErrors.password ? 'border-error ring-2 ring-error/20' : 'border-primary-200'}`}
                  placeholder="••••••••••" 
                  required 
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                <i className="fas fa-lock input-icon"></i>
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-300 hover:text-primary-700 transition w-8 h-8 flex items-center justify-center"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
              {touched.password && fieldErrors.password && <p className="mt-1 text-xs text-error">{fieldErrors.password}</p>}
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="login-btn-premium w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 reveal mt-2 disabled:opacity-80"
            >
              {submitting ? (
                <><i className="fas fa-spinner fa-spin btn-text"></i><span className="btn-text">Authenticating…</span></>
              ) : (
                <><span className="btn-text">Sign In to Dashboard</span><i className="fas fa-arrow-right btn-icon text-sm"></i></>
              )}
            </button>
          </form>

          <div className="reveal mt-6 pt-4 border-t border-primary-100 flex items-center justify-between text-[11px] text-primary-300">
            <span>© 2026 JBLCF—Bacolod. All rights reserved.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
