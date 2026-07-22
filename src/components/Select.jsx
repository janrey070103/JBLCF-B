export default function Select({
  label,
  options = [],
  error,
  hint,
  id,
  className = '',
  value,
  onChange,
  ...rest
}) {
  const fieldId = id || `sel-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const describedBy = error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={['w-full', className].join(' ')}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-primary-700 mb-1"
      >
        {label}
        {rest.required && <span className="text-error ml-1">*</span>}
      </label>
      <select
        {...rest}
        id={fieldId}
        value={value ?? ''}
        onChange={onChange}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={[
          'block w-full rounded-nested border bg-white px-3 py-2 text-base text-primary-900',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          error ? 'border-error' : 'border-primary-200',
        ].join(' ')}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${fieldId}-err`} className="mt-1 text-sm text-error">{error}</p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1 text-sm text-primary-400">{hint}</p>
      ) : null}
    </div>
  );
}
