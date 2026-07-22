// Single button component with variants. Actionable labels are the caller's
// responsibility (spec: no generic "Submit"); we enforce it via prop type only.
const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-700 hover:shadow-elevated hover:scale-[1.02] active:bg-primary-800 active:scale-[0.98] focus-visible:outline-secondary shadow-md',
  secondary: 'bg-secondary text-primary-900 hover:bg-secondary-400 hover:shadow-elevated hover:scale-[1.02] active:bg-secondary-600 active:scale-[0.98] focus-visible:outline-primary shadow-md',
  tertiary: 'bg-transparent text-primary border border-primary-300 hover:bg-primary-50 active:bg-primary-100 focus-visible:outline-primary',
  danger: 'bg-error text-white hover:opacity-90 hover:shadow-elevated hover:scale-[1.02] active:opacity-100 active:scale-[0.98] focus-visible:outline-error shadow-md',
  ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus-visible:outline-primary',
};

const SIZES = {
  sm: 'text-sm px-3 py-1.5 rounded-nested gap-1.5',
  md: 'text-base px-4 py-2 rounded-nested gap-2',
  lg: 'text-base px-6 py-3 rounded-nested gap-2',
};

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'tertiary'|'danger'|'ghost'} [props.variant]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {boolean} [props.loading]
 * @param {boolean} [props.fullWidth]   // mobile-first full-width, optional md:w-auto
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...rest
}) {
  const width = fullWidth ? 'w-full md:w-auto' : '';
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={[
        'inline-flex min-h-10 items-center justify-center font-medium',
        'transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-200 ease-out',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
        'disabled:active:translate-y-0',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        width,
        className,
      ].join(' ')}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      )}
      {children}
    </button>
  );
}
