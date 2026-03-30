export default function PageSkeleton({ rows = 4, card = true }) {
  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-border-card" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-40 bg-border-card rounded-lg" />
          <div className="h-3 w-64 bg-border-card/60 rounded-lg" />
        </div>
      </div>

      {/* Big card placeholder */}
      {card && <div className="h-40 w-full bg-border-card rounded-2xl" />}

      {/* Row skeletons */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-bg-card border border-border-card rounded-xl px-4 py-3.5"
            style={{ opacity: 1 - i * 0.12 }}
          >
            <div className="w-10 h-10 rounded-xl bg-bg-page flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-border-card rounded-lg w-[55%]" />
              <div className="h-2.5 bg-border-card/60 rounded-lg w-[35%]" />
            </div>
            <div className="h-4 w-20 bg-border-card rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
