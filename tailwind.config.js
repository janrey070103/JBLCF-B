/** @type {import('tailwindcss').Config} */
// Design tokens — single source of truth for the JBLCF-B brand system.
// Palette is strict: Navy primary, Yellow secondary, White base.
// Semantic states (success/error) are intentionally desaturated.
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Navy Blue — primary brand color (headers, primary buttons, nav).
        primary: {
          50: '#E6EAF3',
          100: '#C2CBE2',
          200: '#95A4C9',
          300: '#677DB0',
          400: '#445F97',
          500: '#0A2472', // base navy
          600: '#08205F',
          700: '#06194B',
          800: '#041234',
          900: '#020B1F',
          DEFAULT: '#0A2472',
        },
        // Yellow — secondary brand color (accents, highlights, alerts).
        secondary: {
          50: '#FFFBEB',
          100: '#FFF3C7',
          200: '#FFE79A',
          300: '#FFDB6D',
          400: '#FFD040',
          500: '#FFC107', // base yellow
          600: '#E6A800',
          700: '#B38200',
          800: '#806000',
          900: '#4D3800',
          DEFAULT: '#FFC107',
        },
        // White base — explicitly named for clarity in templates.
        base: '#FFFFFF',
        // Desaturated semantic states.
        success: { DEFAULT: '#15803D', light: '#DCFCE7' },
        error: { DEFAULT: '#B91C1C', light: '#FEE2E2' },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      // Spacing scale locked to 4/8/16/24/32 (and their multiples).
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },
      // Corner-radius system: container radius > nested element radius.
      borderRadius: {
        container: '16px', // cards, modals, panels
        nested: '8px', // inputs, buttons, tags inside containers
        pill: '9999px',
      },
      fontFamily: {
        sans: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(2, 11, 31, 0.08), 0 1px 2px rgba(2, 11, 31, 0.04)',
        elevated: '0 10px 15px -3px rgba(2, 11, 31, 0.10), 0 4px 6px -2px rgba(2, 11, 31, 0.05)',
      },
      // Eased, non-linear timing — no `linear` allowed anywhere in the app.
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',    // ease-out-quint (default feel)
        'in-out-soft': 'cubic-bezier(0.65, 0, 0.35, 1)', // ease-in-out-cubic
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',  // subtle overshoot
      },
      // Entrance animations. fade-up = login card / modal slide-in per spec.
      // stagger-fade-up = table rows with per-row offset (set via --delay CSS var).
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'stagger-fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'success-pop': {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(4px)' },
          '70%': { opacity: '1', transform: 'scale(1.02) translateY(0)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'stagger-fade-up': 'stagger-fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) calc(var(--delay, 0) * 1ms) both',
        'success-pop': 'success-pop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
    },
  },
  plugins: [],
};
