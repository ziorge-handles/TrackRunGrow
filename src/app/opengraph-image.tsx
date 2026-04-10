import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'TrackRunGrow - Coaching Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #312e81 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>T</span>
          </div>
          <span style={{ color: 'white', fontSize: '48px', fontWeight: 'bold' }}>TrackRunGrow</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '28px', textAlign: 'center', maxWidth: '700px', lineHeight: 1.4 }}>
          The Complete Coaching Platform for Cross Country & Track and Field
        </p>
        <div style={{ display: 'flex', gap: '32px', marginTop: '40px' }}>
          <div style={{ color: '#60a5fa', fontSize: '18px' }}>Performance Tracking</div>
          <div style={{ color: '#60a5fa', fontSize: '18px' }}>AI Coaching</div>
          <div style={{ color: '#60a5fa', fontSize: '18px' }}>Team Management</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
