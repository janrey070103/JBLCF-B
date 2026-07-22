// Generic surface container. Container radius (16px) — anything nested inside
// should use rounded-nested (8px) to respect the radius hierarchy.
// If interactive is true, adds Uiverse premium hover/active states (lift and shadow expansion).
export default function Card({ as: Tag = 'div', title, actions, children, className = '', bodyClassName = '', interactive = false, ...rest }) {
  const interactiveClasses = interactive 
    ? 'transition-all duration-300 ease-out-soft hover:-translate-y-1 hover:shadow-elevated hover:border-primary-200 active:scale-[0.99] cursor-pointer' 
    : '';

  return (
    <Tag {...rest} className={['bg-white border border-primary-100 rounded-container shadow-card', interactiveClasses, className].filter(Boolean).join(' ')}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 px-5 py-4 border-b border-primary-100">
          {title && <h3 className="text-base font-semibold text-primary">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={['px-5 py-4', bodyClassName].filter(Boolean).join(' ')}>{children}</div>
    </Tag>
  );
}
