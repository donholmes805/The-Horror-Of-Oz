export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8">
      <div className="relative">
        <div className="w-24 h-24 border-2 border-amber-500/10 border-t-amber-500 rounded-full animate-spin shadow-[0_0_40px_rgba(245,158,11,0.2)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-amber-500/5 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="space-y-2 text-center">
        <p className="font-serif italic text-amber-500/60 animate-pulse text-2xl tracking-widest">
          Consulting the Oracle...
        </p>
        <p className="text-[9px] text-zinc-800 uppercase tracking-[0.5em] font-black">
          The Yellow Path Awaits
        </p>
      </div>
    </div>
  )
}
