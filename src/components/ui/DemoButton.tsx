'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { PlayCircle } from 'lucide-react'

export default function DemoButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDemo() {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: 'coach@demo.com',
        password: 'password123',
        redirect: false,
      })
      if (result?.error) {
        // Demo account may not exist yet, redirect to login with demo flag
        router.push('/login?demo=true')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      router.push('/login?demo=true')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDemo}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl text-base font-semibold hover:bg-white/20 transition-colors backdrop-blur disabled:opacity-50"
    >
      <PlayCircle className="w-4 h-4" />
      {loading ? 'Loading Demo...' : 'Try Demo'}
    </button>
  )
}
