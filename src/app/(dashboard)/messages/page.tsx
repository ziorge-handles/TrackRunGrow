'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Send, MessageSquare, Hash, Plus, Users, RefreshCw, Mail } from 'lucide-react'

type Tab = 'direct' | 'chat'

interface DirectMessage {
  id: string
  subject: string | null
  body: string
  sentAt: string
  isRead: boolean
  sender: { id: string; name: string | null; image: string | null } | null
}

interface ChatChannel {
  id: string
  name: string
  isGeneral: boolean
  _count: { messages: number }
}

interface ChatMessage {
  id: string
  body: string
  createdAt: string
  sender: { id: string; name: string | null; image: string | null } | null
}

function Avatar({ name, size = 'sm' }: { name?: string | null; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export default function MessagesPage() {
  const [tab, setTab] = useState<Tab>('direct')
  const [teamId, setTeamId] = useState('')
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [composeRecipients, setComposeRecipients] = useState('')
  const [composeSendEmail, setComposeSendEmail] = useState(false)
  const [composeSending, setComposeSending] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Direct messages
  const { data: directMessages = [], refetch: refetchDMs } = useQuery<DirectMessage[]>({
    queryKey: ['messages'],
    queryFn: () => fetch('/api/messages').then((r) => r.json()),
    enabled: tab === 'direct',
    refetchInterval: 15000,
  })

  // Chat channels
  const { data: channels = [] } = useQuery<ChatChannel[]>({
    queryKey: ['channels', teamId],
    queryFn: () => fetch(`/api/chat/channels?teamId=${teamId}`).then((r) => r.json()),
    enabled: tab === 'chat' && Boolean(teamId),
  })

  // Chat messages
  const { data: chatData, refetch: refetchMessages } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ['chatMessages', selectedChannelId],
    queryFn: () => fetch(`/api/chat/channels/${selectedChannelId}/messages`).then((r) => r.json()),
    enabled: Boolean(selectedChannelId),
    refetchInterval: 5000,
  })
  const chatMessages = chatData?.messages ?? []

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages.length])

  async function sendChatMessage() {
    if (!selectedChannelId || !chatInput.trim()) return
    setSending(true)
    try {
      await fetch(`/api/chat/channels/${selectedChannelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: chatInput }),
      })
      setChatInput('')
      refetchMessages()
    } finally {
      setSending(false)
    }
  }

  async function sendDirectMessage() {
    const recipientIds = composeRecipients.split(',').map((s) => s.trim()).filter(Boolean)
    setComposeSending(true)
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: composeSubject,
          body: composeBody,
          recipientIds,
          sendEmail: composeSendEmail,
        }),
      })
      setComposeOpen(false)
      setComposeSubject('')
      setComposeBody('')
      setComposeRecipients('')
      refetchDMs()
    } finally {
      setComposeSending(false)
    }
  }

  const selectedChannel = channels.find((c) => c.id === selectedChannelId)

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Messaging</h1>
          {tab === 'direct' && (
            <button
              onClick={() => setComposeOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Compose</span>
            </button>
          )}
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {([['direct', MessageSquare, 'Direct Messages'], ['chat', Hash, 'Team Chat']] as const).map(([value, Icon, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === value ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Direct Messages Tab */}
      {tab === 'direct' && (
        <div className="flex-1 overflow-y-auto">
          {/* Compose Modal */}
          {composeOpen && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
                <input
                  type="text"
                  value={composeRecipients}
                  onChange={(e) => setComposeRecipients(e.target.value)}
                  placeholder="Recipient User IDs (comma separated)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subject (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Message body…"
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={composeSendEmail}
                    onChange={(e) => setComposeSendEmail(e.target.checked)}
                    className="rounded"
                  />
                  <Mail className="w-4 h-4" />
                  Also send email notification
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setComposeOpen(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendDirectMessage}
                    disabled={composeSending || !composeBody || !composeRecipients}
                    className="flex-1 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {composeSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message List */}
          <div className="divide-y divide-gray-100">
            {directMessages.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              directMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!msg.isRead ? 'bg-emerald-50/40' : ''}`}
                >
                  <Avatar name={msg.sender?.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm ${!msg.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {msg.sender?.name ?? 'Unknown'}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(msg.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                    {msg.subject && <p className="text-sm text-gray-700 truncate">{msg.subject}</p>}
                    <p className="text-xs text-gray-400 truncate">{msg.body}</p>
                  </div>
                  {!msg.isRead && <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {tab === 'chat' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Channel Sidebar */}
          <div className="w-full sm:w-56 border-r border-gray-200 bg-gray-50 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="Team ID"
                className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 py-1">Channels</p>
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannelId(ch.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${selectedChannelId === ch.id ? 'bg-emerald-100 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
              {channels.length === 0 && teamId && (
                <p className="text-xs text-gray-400 px-2 py-1">No channels yet</p>
              )}
            </div>
          </div>

          {/* Chat Area */}
          {!selectedChannelId ? (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center">
                <Hash className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Select a channel to start chatting</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col bg-white">
              {/* Channel Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-900">{selectedChannel?.name}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <Avatar name={msg.sender?.name} size="md" />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-gray-900">{msg.sender?.name ?? 'Unknown'}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{msg.body}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-200">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage() } }}
                    placeholder={`Message #${selectedChannel?.name ?? '…'}`}
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={sending || !chatInput.trim()}
                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
