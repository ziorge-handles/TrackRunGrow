import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const athleteId = formData.get('athleteId') as string | null
    const type = formData.get('type') as string || 'photo' // photo, document

    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) return Response.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    if (type === 'photo' && !ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const bucket = type === 'photo' ? 'athlete-photos' : 'documents'

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return Response.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl

    // Update athlete photo if athleteId provided
    if (athleteId && type === 'photo') {
      await prisma.athlete.update({
        where: { id: athleteId },
        data: { photoUrl: publicUrl },
      })
    }

    return Response.json({ url: publicUrl, fileName })
  } catch (err) {
    console.error('Upload error:', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
