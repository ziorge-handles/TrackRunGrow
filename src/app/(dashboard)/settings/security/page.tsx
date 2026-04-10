'use client'

import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldOff, Key, RefreshCw, Copy, Check } from 'lucide-react'
import Image from 'next/image'

interface MfaStatus {
  mfaEnabled: boolean
  backupCodeCount: number
}

interface SetupData {
  secret: string
  qrCodeDataUrl: string
  uri: string
}

export default function SecurityPage() {
  const [status, setStatus] = useState<MfaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'backup-codes' | 'disable'>('idle')
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [verifyToken, setVerifyToken] = useState('')
  const [disableToken, setDisableToken] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  async function fetchStatus() {
    try {
      const res = await fetch('/api/auth/mfa/status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  async function startSetup() {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/auth/mfa/setup')
      if (!res.ok) throw new Error('Failed to start setup')
      const data = await res.json()
      setSetupData(data)
      setStep('setup')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start setup')
    } finally {
      setWorking(false)
    }
  }

  async function verifySetup() {
    if (!setupData || !verifyToken) return
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken, secret: setupData.secret }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Verification failed')
      setBackupCodes(data.backupCodes)
      setStep('backup-codes')
      fetchStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setWorking(false)
    }
  }

  async function disableMfa() {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: disableToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to disable MFA')
      setStep('idle')
      setDisableToken('')
      fetchStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disable MFA')
    } finally {
      setWorking(false)
    }
  }

  void setupData

  function copyCode(code: string, index: number) {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  function copyAllCodes() {
    navigator.clipboard.writeText(backupCodes.join('\n'))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-500 mt-1">Manage two-factor authentication and account security</p>
      </div>

      {/* MFA Status Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${status?.mfaEnabled ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            {status?.mfaEnabled ? (
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            ) : (
              <Shield className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
            <p className={`text-sm mt-0.5 ${status?.mfaEnabled ? 'text-emerald-600 font-medium' : 'text-gray-500'}`}>
              {status?.mfaEnabled ? 'Enabled — your account is protected' : 'Disabled — add extra security to your account'}
            </p>
            {status?.mfaEnabled && (
              <p className="text-xs text-gray-400 mt-1">
                {status.backupCodeCount} backup code{status.backupCodeCount !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
          {status?.mfaEnabled ? (
            <button
              onClick={() => { setStep('disable'); setError('') }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <ShieldOff className="w-4 h-4" />
              Disable MFA
            </button>
          ) : (
            <button
              onClick={startSetup}
              disabled={working}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              Enable 2FA
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Setup Step: Show QR Code */}
      {step === 'setup' && setupData && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" />
            Scan with Authenticator App
          </h3>
          <p className="text-sm text-gray-500">
            Scan this QR code with an authenticator app like Google Authenticator, Authy, or 1Password.
          </p>
          <div className="flex justify-center">
            <div className="p-3 bg-white border-2 border-gray-200 rounded-xl inline-block">
              <Image src={setupData.qrCodeDataUrl} alt="MFA QR Code" width={200} height={200} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Or enter this key manually:</p>
            <code className="block bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 break-all">
              {setupData.secret}
            </code>
          </div>
          <button
            onClick={() => setStep('verify')}
            className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            I&apos;ve scanned the code &rarr;
          </button>
        </div>
      )}

      {/* Verify Step */}
      {step === 'verify' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h3 className="text-base font-semibold text-gray-900">Verify Your Code</h3>
          <p className="text-sm text-gray-500">
            Enter the 6-digit code from your authenticator app to confirm setup.
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verifyToken}
            onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setStep('setup')}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={verifySetup}
              disabled={working || verifyToken.length !== 6}
              className="flex-1 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {working ? 'Verifying…' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}

      {/* Backup Codes */}
      {step === 'backup-codes' && backupCodes.length > 0 && (
        <div className="bg-white border border-emerald-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-emerald-700">MFA Enabled!</h3>
          </div>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg">
            <strong>Save these backup codes now.</strong> They are shown only once and can be used if you lose access to your authenticator app.
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
              >
                <code className="font-mono text-sm font-semibold text-gray-700">{code}</code>
                <button
                  onClick={() => copyCode(code, i)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyAllCodes}
              className="flex items-center gap-2 flex-1 justify-center py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Copy className="w-4 h-4" />
              Copy All
            </button>
            <button
              onClick={() => setStep('idle')}
              className="flex-1 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Disable Step */}
      {step === 'disable' && (
        <div className="bg-white border border-red-200 rounded-xl p-6 space-y-5">
          <h3 className="text-base font-semibold text-red-700 flex items-center gap-2">
            <ShieldOff className="w-4 h-4" />
            Disable Two-Factor Authentication
          </h3>
          <p className="text-sm text-gray-500">
            Enter a code from your authenticator app or a backup code to confirm disabling MFA.
          </p>
          <input
            type="text"
            maxLength={8}
            value={disableToken}
            onChange={(e) => setDisableToken(e.target.value)}
            placeholder="Code or backup code"
            className="w-full text-center font-mono tracking-widest border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <div className="flex gap-3">
            <button
              onClick={() => { setStep('idle'); setDisableToken(''); setError('') }}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={disableMfa}
              disabled={working || !disableToken}
              className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {working ? 'Disabling…' : 'Disable MFA'}
            </button>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes (when MFA is enabled and not in another step) */}
      {status?.mfaEnabled && step === 'idle' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-gray-400" />
                Backup Codes
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {status.backupCodeCount} code{status.backupCodeCount !== 1 ? 's' : ''} remaining. Regenerating invalidates existing codes.
              </p>
            </div>
            <button
              onClick={startSetup}
              disabled={working}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
