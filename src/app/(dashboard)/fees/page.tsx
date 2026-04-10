'use client'

import { useState } from 'react'
import { DollarSign, Plus, Mail, ChevronRight, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'

interface Fee {
  id: string
  name: string
  amount: number
  dueDate: string | null
  description: string | null
  createdAt: string
  totalAthletes: number
  paidCount: number
  pendingCount: number
  overdueCount: number
  waivedCount: number
}

interface FeePayment {
  id: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED'
  amountPaid: number
  paidAt: string | null
  athlete: { user: { name: string | null; email: string } }
}

interface FeeDetail extends Fee {
  payments: FeePayment[]
}

const STATUS_ICONS = {
  PAID: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  PENDING: <Clock className="w-4 h-4 text-amber-500" />,
  OVERDUE: <AlertCircle className="w-4 h-4 text-red-500" />,
  WAIVED: <XCircle className="w-4 h-4 text-gray-400" />,
}

const STATUS_COLORS = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  OVERDUE: 'bg-red-100 text-red-700',
  WAIVED: 'bg-gray-100 text-gray-500',
}

export default function FeesPage() {
  const [teamId, setTeamId] = useState('')
  const [fees, setFees] = useState<Fee[]>([])
  const [selectedFee, setSelectedFee] = useState<FeeDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [newFee, setNewFee] = useState({ name: '', amount: '', dueDate: '', description: '' })

  async function fetchFees() {
    if (!teamId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/fees?teamId=${teamId}`)
      if (res.ok) setFees(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function fetchFeeDetail(feeId: string) {
    const res = await fetch(`/api/fees/${feeId}`)
    if (res.ok) setSelectedFee(await res.json())
  }

  async function createFee() {
    if (!newFee.name || !newFee.amount || !teamId) return
    setCreating(true)
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          name: newFee.name,
          amount: Math.round(Number(newFee.amount) * 100), // convert to cents
          dueDate: newFee.dueDate || undefined,
          description: newFee.description || undefined,
        }),
      })
      if (res.ok) {
        setShowCreate(false)
        setNewFee({ name: '', amount: '', dueDate: '', description: '' })
        fetchFees()
      }
    } finally {
      setCreating(false)
    }
  }

  async function sendReminders() {
    if (!selectedFee) return
    setSendingReminders(true)
    try {
      const unpaid = selectedFee.payments.filter((p) => p.status !== 'PAID' && p.status !== 'WAIVED')
      await Promise.allSettled(
        unpaid.map((p) =>
          fetch('/api/email/fee-reminder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: p.athlete.user.email,
              athleteName: p.athlete.user.name ?? p.athlete.user.email,
              feeName: selectedFee.name,
              amount: selectedFee.amount,
              dueDate: selectedFee.dueDate ? new Date(selectedFee.dueDate).toLocaleDateString() : 'TBD',
            }),
          }),
        ),
      )
      alert(`Reminders sent to ${unpaid.length} athlete(s)`)
    } finally {
      setSendingReminders(false)
    }
  }

  const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <div className="space-y-6 px-4 py-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Fees</h1>
          <p className="text-gray-500 mt-1">Collect and track athlete fee payments</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          Add Fee
        </button>
      </div>

      {/* Team Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder="Enter Team ID"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={fetchFees}
          disabled={!teamId || loading}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? '…' : 'Load'}
        </button>
      </div>

      {/* Create Fee Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Create New Fee</h2>
            <input
              type="text"
              value={newFee.name}
              onChange={(e) => setNewFee((f) => ({ ...f, name: e.target.value }))}
              placeholder="Fee name (e.g., Uniform Deposit)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={newFee.amount}
                onChange={(e) => setNewFee((f) => ({ ...f, amount: e.target.value }))}
                placeholder="Amount"
                step="0.01"
                min="0"
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <input
              type="date"
              value={newFee.dueDate}
              onChange={(e) => setNewFee((f) => ({ ...f, dueDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <textarea
              value={newFee.description}
              onChange={(e) => setNewFee((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createFee}
                disabled={creating || !newFee.name || !newFee.amount}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
              >
                {creating ? 'Creating…' : 'Create Fee'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fee List */}
        <div className="lg:col-span-1 space-y-3">
          {fees.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No fees yet</p>
            </div>
          ) : (
            fees.map((fee) => {
              const pctPaid = fee.totalAthletes > 0 ? (fee.paidCount / fee.totalAthletes) * 100 : 0
              return (
                <div
                  key={fee.id}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-colors ${selectedFee?.id === fee.id ? 'border-emerald-400' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => fetchFeeDetail(fee.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{fee.name}</p>
                      <p className="text-sm text-emerald-600 font-medium">{dollars(fee.amount)}</p>
                      {fee.dueDate && (
                        <p className="text-xs text-gray-400 mt-0.5">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{fee.paidCount} of {fee.totalAthletes} paid</span>
                      <span>{Math.round(pctPaid)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pctPaid}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Fee Detail */}
        <div className="lg:col-span-2">
          {!selectedFee ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center h-64">
              <div className="text-center">
                <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Select a fee to view details</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedFee.name}</h2>
                  <p className="text-emerald-600 font-semibold">{dollars(selectedFee.amount)} per athlete</p>
                  {selectedFee.dueDate && (
                    <p className="text-sm text-gray-400">Due: {new Date(selectedFee.dueDate).toLocaleDateString()}</p>
                  )}
                </div>
                <button
                  onClick={sendReminders}
                  disabled={sendingReminders}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  {sendingReminders ? 'Sending…' : 'Send Reminders'}
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-4 gap-2">
                {(['paidCount', 'pendingCount', 'overdueCount', 'waivedCount'] as const).map((key) => {
                  const labels = { paidCount: 'Paid', pendingCount: 'Pending', overdueCount: 'Overdue', waivedCount: 'Waived' }
                  const colors = { paidCount: 'emerald', pendingCount: 'amber', overdueCount: 'red', waivedCount: 'gray' }
                  const color = colors[key]
                  return (
                    <div key={key} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-3 text-center`}>
                      <p className={`text-xl font-bold text-${color}-700`}>{selectedFee[key]}</p>
                      <p className={`text-xs text-${color}-600`}>{labels[key]}</p>
                    </div>
                  )
                })}
              </div>

              {/* Payments Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                      <th className="text-left py-2 pr-4 font-medium">Athlete</th>
                      <th className="text-left py-2 pr-4 font-medium">Status</th>
                      <th className="text-left py-2 pr-4 font-medium">Paid</th>
                      <th className="text-left py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedFee.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 pr-4">
                          <p className="font-medium text-gray-900">{p.athlete.user.name ?? p.athlete.user.email}</p>
                          {p.athlete.user.name && <p className="text-xs text-gray-400">{p.athlete.user.email}</p>}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                            {STATUS_ICONS[p.status]}
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-gray-600">
                          {p.amountPaid > 0 ? dollars(p.amountPaid) : '—'}
                        </td>
                        <td className="py-2.5 text-gray-400 text-xs">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
