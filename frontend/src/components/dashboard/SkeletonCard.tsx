interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`glass rounded-xl p-4 ${className}`}>
      <div className="space-y-3 animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-muted rounded-full" />
            <div className="h-4 w-12 bg-muted rounded" />
          </div>
          <div className="h-4 w-4 bg-muted rounded" />
        </div>

        {/* Title */}
        <div className="h-5 w-3/4 bg-muted rounded" />

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-12 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>

        {/* Quote */}
        <div className="space-y-2 pl-3 border-l-2 border-muted">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-4/5 bg-muted rounded" />
        </div>

        {/* Stakes */}
        <div className="h-8 w-full bg-muted/50 rounded-lg" />

        {/* Tags */}
        <div className="flex gap-1.5">
          <div className="h-5 w-16 bg-muted rounded" />
          <div className="h-5 w-20 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Badge */}
      <div className="flex items-center gap-3">
        <div className="h-5 w-20 bg-muted rounded-full" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>

      {/* Headline */}
      <div className="space-y-2">
        <div className="h-10 w-3/4 bg-muted rounded" />
        <div className="h-6 w-1/2 bg-muted rounded" />
      </div>

      {/* Narrative */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-5/6 bg-muted rounded" />
        <div className="h-4 w-4/5 bg-muted rounded" />
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass rounded-xl p-4 text-center">
          <div className="h-8 w-16 bg-muted rounded mx-auto mb-2" />
          <div className="h-3 w-20 bg-muted rounded mx-auto" />
        </div>
      ))}
    </div>
  );
}
