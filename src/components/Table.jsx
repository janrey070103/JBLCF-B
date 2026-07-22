import { useRef, useEffect } from 'react';
import { animate, createScope, stagger } from 'animejs';

// Lightweight table wrapper. Mobile-first: on small screens the table scrolls
// horizontally rather than collapsing into card stacks (keeps column meaning
// clear for data-heavy admin views). Views pass columns + rows; this component
// only owns presentation + empty state.
//
// @param columns: Array<{ key: string, header: string, render?: (row) => ReactNode, className?: string }>
// @param rows: Array<object>
// @param rowKey: (row, idx) => string | number
// @param emptyText: string
export default function Table({ columns = [], rows = [], rowKey, emptyText = 'No records found.' }) {
  const rootRef = useRef(null);
  const scopeRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rows.length > 0) {
      scopeRef.current = createScope({ root: rootRef.current }).add(() => {
        animate('.anime-row', {
          opacity: [0, 1],
          translateY: prefersReducedMotion ? [0, 0] : [15, 0],
          delay: prefersReducedMotion ? 0 : stagger(50),
          ease: 'outExpo',
          duration: prefersReducedMotion ? 1 : 400
        });
      });
    }
    return () => {
      if (scopeRef.current) scopeRef.current.revert();
    };
  }, [rows]);

  return (
    <div ref={rootRef} className="w-full overflow-x-auto rounded-container border border-primary-100 bg-white shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-primary text-white">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={['px-4 py-3 font-medium whitespace-nowrap', c.className].join(' ')}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-primary-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-primary-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr
                key={rowKey ? rowKey(row, idx) : idx}
                className="anime-row opacity-0 transition-colors duration-200 ease-out-soft hover:bg-primary-50/60"
              >
                {columns.map((c) => (
                  <td key={c.key} className={['px-4 py-3 align-top text-primary-800', c.className].join(' ')}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
