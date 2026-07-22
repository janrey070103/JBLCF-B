// Boxed input with persistent label. Per spec: NO placeholder-as-label —
// labels are always rendered above the field; placeholder is allowed only
// for optional hint text or for the dedicated SearchInput component.
// Supports masks via the `mask` prop ('phone' | 'schoolId').

const MASKS = {
  phone: (raw) => {
    const clean = raw.replace(/^\+63\s*/, '').replace(/^63/, '').replace(/^0/, '');
    const d = clean.replace(/\D/g, '').slice(0, 10);
    if (d.length === 0) return '';
    const p1 = d.slice(0, 4);
    const p2 = d.slice(4, 7);
    const p3 = d.slice(7, 10);
    let out = '+63 ' + p1;
    if (p2) out += ' ' + p2;
    if (p3) out += ' ' + p3;
    return out;
  },
  // School ID: "JBLCF-YYYY-NNNN"
  schoolId: (raw) => {
    const up = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // strip a leading JBLCF if user re-types
    const body = up.replace(/^JBLCF/, '');
    const year = body.slice(0, 4).replace(/[^0-9]/g, '');
    const num = body.slice(4).replace(/[^0-9]/g, '').slice(0, 4);
    let out = 'JBLCF';
    if (year) out += '-' + year;
    if (num) out += '-' + num;
    return out;
  },
};

/**
 * @param {object} props
 * @param {string} props.label          // required, persistent
 * @param {'phone'|'schoolId'} [props.mask]
 * @param {string} [props.hint]         // helper text under the field
 * @param {string} [props.error]        // error message; switches border red
 * @param {string} [props.id]           // optional; derived from label otherwise
 */
export default function Input({
  label,
  mask,
  hint,
  error,
  id,
  className = '',
  value,
  onChange,
  ...rest
}) {
  const fieldId = id || `in-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const describedBy = error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined;

  const handleChange = (e) => {
    if (!onChange) return;
    const next = mask ? MASKS[mask](e.target.value) : e.target.value;
    onChange({ ...e, target: { ...e.target, value: next } });
  };

  return (
    <div className={['w-full', className].join(' ')}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-primary-700 mb-1"
      >
        {label}
        {rest.required && <span className="text-error ml-1">*</span>}
      </label>
      <input
        {...rest}
        id={fieldId}
        value={value ?? ''}
        onChange={handleChange}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={[
          'block w-full rounded-nested border bg-white px-3 py-2 text-base text-primary-900',
          'placeholder:text-primary-300 transition-all duration-200 ease-out-soft shadow-sm hover:border-primary-300',
          'focus:outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary focus:shadow-md',
          error ? 'border-error' : 'border-primary-200',
        ].join(' ')}
      />
      {error ? (
        <p id={`${fieldId}-err`} className="mt-1 text-sm text-error">{error}</p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1 text-sm text-primary-400">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Search field — the ONLY input where placeholder text is acceptable per spec.
 * No persistent label needed (there is an aria-label for a11y).
 */
export function SearchInput({ placeholder = 'Search…', className = '', ...rest }) {
  return (
    <div className={['relative w-full', className].join(' ')}>
      <span
        className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-400 pointer-events-none"
        aria-hidden="true"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <input
        type="search"
        placeholder={placeholder}
        aria-label="Search"
        {...rest}
        className={[
          'block w-full rounded-nested border border-primary-200 bg-white py-2 pl-10 pr-3 text-sm text-primary-900',
          'placeholder:text-primary-300 transition-all duration-200 ease-out-soft shadow-sm hover:border-primary-300',
          'focus:outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary focus:shadow-md',
        ].join(' ')}
      />
    </div>
  );
}
