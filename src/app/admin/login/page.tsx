'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Mot de passe incorrect')
      }
      const data = await response.json()
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('authUser', JSON.stringify(data.user))
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-white px-6">
      <div className="w-full max-w-[340px]">
        <h1 className="mb-1 font-display text-[26px] font-semibold tracking-tight text-zinc-900">
          Propositor
        </h1>
        <p className="mb-8 text-sm text-zinc-500">
          Entre ton mot de passe pour continuer.
        </p>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            autoComplete="current-password"
            placeholder="Mot de passe"
            className="h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-[15px] text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-900"
          />

          {error ? (
            <p className="px-1 text-[13px] text-rose-600">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading || !password}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-[14px] font-semibold text-white transition-colors hover:bg-zinc-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Vérification…</span>
              </>
            ) : (
              <span>Entrer</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
