'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'

export default function DeleteAccountButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (res.ok) {
        await signOut({ callbackUrl: '/' })
      }
    } catch {
      setDeleting(false)
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:text-red-700 text-sm font-medium px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
      >
        Delete My Account
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-red-600">
        This will permanently delete your account and all data. Type <strong>DELETE</strong> to confirm.
      </p>
      <input
        value={confirmText}
        onChange={e => setConfirmText(e.target.value)}
        placeholder="Type DELETE"
        className="w-48 px-3 py-2 border border-red-300 rounded-lg text-sm text-gray-900"
      />
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={confirmText !== 'DELETE' || deleting}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? 'Deleting...' : 'Permanently Delete'}
        </button>
        <button
          onClick={() => { setShowConfirm(false); setConfirmText('') }}
          className="text-gray-500 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
