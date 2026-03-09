export default function Loading() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="h-8 w-48 bg-secondary rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
