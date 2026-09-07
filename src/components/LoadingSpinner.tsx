export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center py-16">
      <div className={`${sizeClasses[size]} border-2 border-vault-border border-t-vault-accent rounded-full animate-spin`} />
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`vault-card overflow-hidden ${className}`}>
      <div className="aspect-[2/3] skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-3 skeleton rounded-md w-3/4" />
        <div className="h-2.5 skeleton rounded-md w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex gap-4 p-3.5 rounded-xl bg-vault-surface/50 ${className}`}>
      <div className="w-14 h-20 rounded-lg skeleton flex-shrink-0" />
      <div className="flex-1 space-y-2.5 py-0.5">
        <div className="h-3.5 skeleton rounded-md w-3/4" />
        <div className="h-3 skeleton rounded-md w-1/2" />
        <div className="h-2.5 skeleton rounded-md w-1/3" />
      </div>
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="vault-card p-4">
            <div className="h-2.5 skeleton rounded-md w-16 mb-2" />
            <div className="h-7 skeleton rounded-md w-20" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-5 skeleton rounded-md w-32" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TitleDetailSkeleton() {
  return (
    <div>
      <div className="h-48 md:h-[26rem] skeleton rounded-2xl mb-6" />
      <div className="flex gap-6 -mt-24 relative z-10 mb-6">
        <div className="w-24 md:w-44 skeleton rounded-xl aspect-[2/3]" />
        <div className="flex-1 pt-10 space-y-3">
          <div className="h-8 skeleton rounded-md w-3/4" />
          <div className="h-4 skeleton rounded-md w-1/2" />
          <div className="h-4 skeleton rounded-md w-1/3" />
        </div>
      </div>
    </div>
  );
}
