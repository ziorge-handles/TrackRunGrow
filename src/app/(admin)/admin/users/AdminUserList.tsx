'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: Date
}

export default function AdminUserList({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'COACH',
    password: '',
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required')
      return
    }
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create user')
      }
      const newUser = await res.json()
      setUsers((prev) => [newUser, ...prev])
      setShowForm(false)
      setFormData({ name: '', email: '', role: 'COACH', password: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{users.length} users total</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
          <h3 className="font-bold text-gray-900">Create New User</h3>
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2 rounded-lg">{error}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="user@school.edu"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData((f) => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
              >
                <option value="COACH">Coach</option>
                <option value="ATHLETE">Athlete</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="Temporary password"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create User'}
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">{user.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-red-100 text-red-700'
                        : user.role === 'COACH'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
