import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  // 365 jours : pour que la session tienne longtemps en cache (mobile + desktop)
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '365d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null

  return parts[1]
}

export async function verifyAuth(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return { authenticated: false, user: null }
  }

  const payload = verifyToken(token)
  if (!payload) {
    return { authenticated: false, user: null }
  }

  return { authenticated: true, user: payload }
}
