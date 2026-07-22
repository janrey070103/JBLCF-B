// Segmented control for 2–3 mutually-exclusive options (role switch, status
// filter, scan-mode toggle). Mobile-first: fills container width by default,
// caps at md:max-w-xs when inline.
//
// @param options: Array<{ value: string, label: string }>
// @param value: string
// @param onChange: (value) => void
export default function SegmentedControl({ options = [], value, onChange, ariaLabel, className = '' }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={['inline-flex w-full md:w-auto p-1 rounded-container bg-primary-50 border border-primary-100', className].join(' ')}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange?.(opt.value)}
            className={[
              'flex-1 md:flex-none px-3 py-1.5 text-sm font-medium rounded-nested transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
              active ? 'bg-secondary text-primary-900 shadow-card' : 'text-primary-500 hover:text-primary',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
