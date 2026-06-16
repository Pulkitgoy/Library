'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { SignUpSchema, SignInSchema } from '@/lib/validations'
import { createSession, deleteSession } from '@/lib/session'
import { findUserByEmail, createUser } from '@/lib/db'

export type AuthState =
  | { success: true; error?: never }
  | { success: false; error: string }

// ── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  try {
    const raw = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      universityId: Number(formData.get('universityId')),
      universityCard: formData.get('universityCard') as string,
      password: formData.get('password') as string,
    }

    const parsed = SignUpSchema.safeParse(raw)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid form data'
      return { success: false, error: firstError }
    }

    const { fullName, email, universityId, universityCard, password } = parsed.data

    // Check for duplicate
    if (findUserByEmail(email)) {
      return { success: false, error: 'An account with this email already exists. Please sign in instead.' }
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = createUser({ fullName, email, passwordHash, universityId, universityCard })

    await createSession(user.id, user.email, user.fullName)
  } catch (error) {
    // redirect() throws internally in Next.js — let it propagate
    const err = error as { digest?: string }
    if (err?.digest?.startsWith('NEXT_REDIRECT')) throw error
    console.error('[signUp error]', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  redirect('/')
}

// ── Sign In ──────────────────────────────────────────────────────────────────

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  try {
    const raw = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    if (!raw.email || !raw.password) {
      return { success: false, error: 'Please enter your email and password.' }
    }

    const parsed = SignInSchema.safeParse(raw)
    if (!parsed.success) {
      return { success: false, error: 'Please enter a valid email address and a password of at least 8 characters.' }
    }

    const { email, password } = parsed.data

    const user = findUserByEmail(email)
    if (!user) {
      return { success: false, error: 'No account found with that email address. Please sign up first.' }
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return { success: false, error: 'Incorrect password. Please try again.' }
    }

    await createSession(user.id, user.email, user.fullName)
  } catch (error) {
    const err = error as { digest?: string }
    if (err?.digest?.startsWith('NEXT_REDIRECT')) throw error
    console.error('[signIn error]', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  redirect('/')
}

// ── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut() {
  await deleteSession()
  redirect('/sign-in')
}
