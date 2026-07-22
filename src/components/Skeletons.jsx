// Composed skeleton states for the three contexts the spec calls out:
// student list, attendance list, QR generation. No spinners — pulse only.
import { Skeleton, SkeletonText } from './Skeleton';

export function StudentListSkeleton({ rows = 5 }) {
  return (
    <div className="w-full rounded-container border border-primary-100 overflow-hidden">
      <div className="bg-primary h-11" aria-hidden="true" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-t border-primary-100">
          <Skeleton className="h-9 w-9 rounded-pill" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-pill" />
        </div>
      ))}
    </div>
  );
}

export function StudentFormSkeleton() {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="rounded-container border border-primary-100 bg-white shadow-card">
        <div className="border-b border-primary-100 px-5 py-4">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-container border border-primary-100 bg-white shadow-card">
        <div className="border-b border-primary-100 px-5 py-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="px-5 py-4">
          <Skeleton className="aspect-[4/3] w-full rounded-container" />
        </div>
      </div>
    </div>
  );
}

export function AttendanceListSkeleton({ rows = 5 }) {
  return (
    <div className="w-full rounded-container border border-primary-100 overflow-hidden">
      <div className="bg-primary h-11" aria-hidden="true" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-t border-primary-100">
          <Skeleton className="h-9 w-9 rounded-pill" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-16 rounded-pill" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function QrGenerationSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <Skeleton className="h-40 w-40 rounded-container" />
      <Skeleton className="h-4 w-40" />
      <SkeletonText lines={1} className="w-32" />
    </div>
  );
}
