export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="h-1 w-full bg-gradient-to-r from-[#00d4aa] to-[#6366f1] rounded-t-xl" />
        <div className="bg-card border border-border rounded-b-xl p-8">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#6366f1] flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="text-foreground text-xl font-medium tracking-tight">PolyPlot</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
