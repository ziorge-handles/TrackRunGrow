'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, X } from 'lucide-react'

interface PhotoUploadProps {
  athleteId: string
  currentUrl?: string | null
  onUpload?: (url: string) => void
}

export default function PhotoUpload({ athleteId, currentUrl, onUpload }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (max 5MB)')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Only JPEG, PNG, WebP, and GIF allowed')
      return
    }

    setError(null)
    setUploading(true)

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('athleteId', athleteId)
      formData.append('type', 'photo')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed')
        setPreview(currentUrl || null)
        return
      }

      setPreview(data.url)
      onUpload?.(data.url)
    } catch {
      setError('Upload failed')
      setPreview(currentUrl || null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative">
      <div
        className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Athlete photo" className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-8 h-8 text-gray-400" />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleUpload}
        className="hidden"
      />
      {preview && !uploading && (
        <button
          onClick={(e) => { e.stopPropagation(); setPreview(null) }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <p className="text-xs text-gray-400 mt-1">Click to upload (max 5MB)</p>
    </div>
  )
}
