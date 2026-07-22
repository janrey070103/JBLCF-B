// Skeleton primitive — pulse animation only, no spinners (spec requirement).
// Compose into higher-level skeletons in views/skeletons/.
export function Skeleton({ className = '', rounded = 'rounded-nested' }) {
  return <div aria-hidden="true" className={['animate-pulse bg-primary-100', rounded, className].join(' ')} />;
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={['space-y-2', className].join(' ')}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3" />
      ))}
    </div>
  );
}
