'use client'

import { useRouter } from 'next/navigation'
import { PlayCircle } from 'lucide-react'

export default function DemoButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/demo')}
      className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl text-base font-semibold hover:bg-white/20 transition-colors backdrop-blur cursor-pointer"
    >
      <PlayCircle className="w-4 h-4" />
      Try Interactive Demo
    </button>
  )
}
