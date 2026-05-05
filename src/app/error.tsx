'use client'

import { useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ShieldAlert, RefreshCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <MainLayout>
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="glass-panel p-12 text-center max-w-md rounded-[2.5rem] border-red-900/20 bg-zinc-950/40 backdrop-blur-3xl">
          <div className="w-20 h-20 bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-900/20">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          
          <h2 className="text-4xl font-serif italic text-white mb-4">A Glitch in the Fog</h2>
          <p className="text-zinc-500 mb-10 italic leading-relaxed">
            The chronicles have encountered an unexpected rift. The Oracle is attempting to stabilize the path.
          </p>
          
          <button
            onClick={() => reset()}
            className="w-full premium-button py-5 flex items-center justify-center gap-3 group"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
            <span>Mend the Rift</span>
          </button>
          
          <p className="mt-8 text-[10px] text-zinc-800 uppercase tracking-widest font-black">
            Error Digest: {error.digest || 'Internal Chronology Error'}
          </p>
        </div>
      </div>
    </MainLayout>
  )
}
