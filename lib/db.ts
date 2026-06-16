/**
 * File-based JSON user store.
 * Persists to data/users.json — survives HMR reloads and server restarts.
 * Swap with a real DB (Prisma, Drizzle, etc.) when ready.
 */

import fs from 'fs'
import path from 'path'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BorrowedBook = {
  bookId: number
  bookTitle: string
  bookCover: string
  bookAuthor: string
  bookGenre: string
  borrowedAt: string       // ISO date string
  dueDate: string          // ISO date string (14 days after borrow)
  returnedAt?: string      // ISO date string if returned
  status: 'reserved' | 'requested' | 'approved' | 'issued' | 'late' | 'returned' | 'purchased' | 'cancelled'
  amountPaid: number       // in ₹
  transactionId: string
  progress?: number        // 0 to 100
}

export type User = {
  id: string
  fullName: string
  email: string
  passwordHash: string
  universityId: number
  universityCard: string
  createdAt: string        // ISO date string
  borrowedBooks: BorrowedBook[]
  pinnedBooks?: number[]   // array of bookIds
  role?: 'user' | 'librarian' | 'admin'
  walletBalance?: number
  penalties?: number
}

// ── File paths ─────────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, '[]', 'utf8')
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function readUsers(): User[] {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8')
    return JSON.parse(raw) as User[]
  } catch {
    return []
  }
}

function writeUsers(users: User[]): void {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')
}

// ── Public API ────────────────────────────────────────────────────────────────

export function findUserByEmail(email: string): User | undefined {
  const users = readUsers()
  return users.find((u) => u.email === email.toLowerCase())
}

export function findUserById(id: string): User | undefined {
  const users = readUsers()
  return users.find((u) => u.id === id)
}

export function createUser(
  data: Omit<User, 'id' | 'createdAt' | 'borrowedBooks'>
): User {
  const users = readUsers()

  const newUser: User = {
    ...data,
    email: data.email.toLowerCase(),
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    borrowedBooks: [],
    pinnedBooks: [],
    role: 'user',
    walletBalance: 0,
    penalties: 0,
  }

  users.push(newUser)
  writeUsers(users)
  return newUser
}

export function addBorrowedBook(userId: string, book: BorrowedBook): User | null {
  const users = readUsers()
  const idx = users.findIndex((u) => u.id === userId)
  if (idx === -1) return null

  users[idx].borrowedBooks.push(book)
  writeUsers(users)
  return users[idx]
}

export function updateBorrowStatus(
  userId: string,
  transactionId: string,
  status: BorrowedBook['status'],
  returnedAt?: string,
  amountToAdd?: number
): User | null {
  const users = readUsers()
  const idx = users.findIndex((u) => u.id === userId)
  if (idx === -1) return null

  const bookIdx = users[idx].borrowedBooks.findIndex(
    (b) => b.transactionId === transactionId
  )
  if (bookIdx === -1) return null

  users[idx].borrowedBooks[bookIdx].status = status
  if (returnedAt) users[idx].borrowedBooks[bookIdx].returnedAt = returnedAt
  
  if (amountToAdd) {
    users[idx].borrowedBooks[bookIdx].amountPaid += amountToAdd
    // If returning and paying an amount, it's a late fee penalty
    if (status === 'returned') {
      users[idx].penalties = (users[idx].penalties || 0) + amountToAdd
    }
  }

  writeUsers(users)
  return users[idx]
}

export function getAllUsers(): User[] {
  return readUsers()
}

export function togglePinBook(userId: string, bookId: number): User | null {
  const users = readUsers()
  const idx = users.findIndex((u) => u.id === userId)
  if (idx === -1) return null

  const user = users[idx]
  user.pinnedBooks = user.pinnedBooks || []
  
  if (user.pinnedBooks.includes(bookId)) {
    user.pinnedBooks = user.pinnedBooks.filter((id) => id !== bookId)
  } else {
    user.pinnedBooks.push(bookId)
  }

  writeUsers(users)
  return user
}

export function updateBookProgress(userId: string, transactionId: string, progress: number): User | null {
  const users = readUsers()
  const idx = users.findIndex((u) => u.id === userId)
  if (idx === -1) return null

  const bookIdx = users[idx].borrowedBooks.findIndex(
    (b) => b.transactionId === transactionId
  )
  if (bookIdx === -1) return null

  users[idx].borrowedBooks[bookIdx].progress = progress
  writeUsers(users)
  return users[idx]
}
