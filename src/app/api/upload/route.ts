import { randomBytes } from 'crypto'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

const MAX_PHOTO_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB

const PHOTO_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/** Keep document uploads to a small allowlist; extend only after reviewing Supabase bucket policies. */
const DOCUMENT_MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
}

function safeExtension(mime: string, kind: 'photo' | 'document'): string | null {
  const map = kind === 'photo' ? PHOTO_MIME_TO_EXT : DOCUMENT_MIME_TO_EXT
  return map[mime] ?? null
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const athleteId = formData.get('athleteId') as string | null
    const type = (formData.get('type') as string) || 'photo'

    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

    const uploadKind: 'photo' | 'document' = type === 'photo' ? 'photo' : 'document'
    const maxSize = uploadKind === 'photo' ? MAX_PHOTO_SIZE : MAX_DOCUMENT_SIZE
    if (file.size > maxSize) {
      return Response.json(
        {
          error:
            uploadKind === 'photo'
              ? 'File too large (max 5MB)'
              : 'File too large (max 10MB for documents)',
        },
        { status: 400 },
      )
    }

    const ext = safeExtension(file.type, uploadKind)
    if (!ext) {
      return Response.json(
        {
          error:
            uploadKind === 'photo'
              ? 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF'
              : 'Invalid file type. Allowed: PDF',
        },
        { status: 400 },
      )
    }

    const supabase = getSupabaseClient()
    const unique = randomBytes(8).toString('hex')
    const fileName = `${session.user.id}/${Date.now()}-${unique}.${ext}`
    const bucket = uploadKind === 'photo' ? 'athlete-photos' : 'documents'

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

    if (athleteId && uploadKind === 'photo') {
      const athleteTeam = await prisma.athleteTeam.findFirst({
        where: {
          athleteId,
          team: {
            OR: [
              { ownerId: session.user.id },
              { coaches: { some: { coach: { userId: session.user.id } } } },
            ],
          },
        },
      })
      if (!athleteTeam) {
        return Response.json({ error: 'Access denied' }, { status: 403 })
      }
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
