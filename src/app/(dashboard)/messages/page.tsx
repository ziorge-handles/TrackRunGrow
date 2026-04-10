'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Hash, Users, Loader2 } from 'lucide-react'

interface Channel {
  id: string
  name: string
  teamId: string
  isGeneral: boolean
}

interface ChatMsg {
  id: string
  body: string
  senderId: string
  senderName: string
  createdAt: string
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch channels
  useEffect(() => {
    let cancelled = false
    fetch('/api/chat/channels')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setChannels(data.channels || [])
        if (data.channels?.length > 0) {
          setActiveChannel((prev) => prev ?? data.channels[0].id)
        }
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Fetch messages + polling
  useEffect(() => {
    if (!activeChannel) return
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(`/api/chat/channels/${activeChannel}/messages`)
        const data = await res.json()
        if (!cancelled) setMessages(data.messages || [])
      } catch { /* silent */ }
    }

    load()
    pollRef.current = setInterval(load, 3000)
    return () => {
      cancelled = true
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [activeChannel])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChannel || sending) return
    setSending(true)
    try {
      await fetch(`/api/chat/channels/${activeChannel}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newMessage.trim() }),
      })
      setNewMessage('')
      const res = await fetch(`/api/chat/channels/${activeChannel}/messages`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch { /* */ }
    setSending(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Channel sidebar */}
      <div className="w-56 border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Channels
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {channels.length === 0 && (
            <p className="text-xs text-gray-400 p-2">No channels yet. Create a team to get started.</p>
          )}
          {channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                activeChannel === ch.id
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Hash className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{ch.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 flex flex-col">
        {!activeChannel ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a channel to start chatting
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-8">No messages yet. Start the conversation!</p>
              )}
              {messages.map(msg => {
                const isMe = msg.senderId === session?.user?.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-2`}>
                      {!isMe && <p className="text-xs font-medium mb-0.5 opacity-70">{msg.senderName}</p>}
                      <p className="text-sm">{msg.body}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-3">
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
