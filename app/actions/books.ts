'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { addBorrowedBook, updateBorrowStatus, findUserById, togglePinBook, updateBookProgress, getAllUsers, type BorrowedBook } from '@/lib/db'
import { sampleBooks } from '@/constants'

export type BookActionState =
  | { success: true; message: string; error?: never }
  | { success: false; error: string; message?: never }

// Pricing (in ₹)
const BORROW_PRICE = 49
const BUY_PRICE = 299

// ── Borrow a book ─────────────────────────────────────────────────────────────

export async function borrowBook(
  bookId: number,
  bookTitle: string,
  bookCover: string,
  bookAuthor: string,
  bookGenre: string
): Promise<BookActionState> {
  const session = await getSession()
  if (!session) return { success: false, error: 'You must be logged in to borrow a book.' }

  const user = findUserById(session.userId)
  if (!user) return { success: false, error: 'User not found.' }

  // Check Borrow Limit (max 3 active books)
  const activeBorrows = user.borrowedBooks.filter(
    (b) => ['requested', 'approved', 'issued', 'late', 'reserved'].includes(b.status)
  )
  if (activeBorrows.length >= 3) {
    return { success: false, error: 'You have reached the maximum borrow limit of 3 books.' }
  }

  // Check if already actively borrowed or reserved
  const alreadyBorrowed = user.borrowedBooks.some(
    (b) => b.bookId === bookId && ['requested', 'approved', 'issued', 'late', 'reserved'].includes(b.status)
  )
  if (alreadyBorrowed) {
    return { success: false, error: 'You already have an active request or borrow for this book.' }
  }

  // Check if already purchased
  const alreadyPurchased = user.borrowedBooks.some(
    (b) => b.bookId === bookId && b.status === 'purchased'
  )
  if (alreadyPurchased) {
    return { success: false, error: 'You have already purchased this book permanently.' }
  }

  const borrowedAt = new Date()
  const dueDate = new Date(borrowedAt)
  dueDate.setDate(dueDate.getDate() + 7) // 7-day loan period starts when issued, but setting it here for schema

  // Calculate dynamic availability
  const users = getAllUsers()
  let globalActiveBorrows = 0
  for (const u of users) {
    for (const b of u.borrowedBooks) {
      if (b.bookId === bookId && ['requested', 'approved', 'issued', 'late'].includes(b.status)) {
        globalActiveBorrows++
      }
    }
  }

  const bookData = sampleBooks.find(b => b.id === bookId)
  const totalCopies = bookData ? bookData.total_copies : 0
  const isAvailable = (totalCopies - globalActiveBorrows) > 0

  const status = isAvailable ? 'requested' : 'reserved'

  const record: BorrowedBook = {
    bookId,
    bookTitle,
    bookCover,
    bookAuthor,
    bookGenre,
    borrowedAt: borrowedAt.toISOString(),
    dueDate: dueDate.toISOString(),
    status,
    amountPaid: BORROW_PRICE,
    transactionId: crypto.randomUUID(),
    progress: 0,
  }

  addBorrowedBook(session.userId, record)
  revalidatePath('/my-profile')
  revalidatePath('/')

  if (status === 'reserved') {
    return { success: true, message: `"${bookTitle}" is currently out of stock. You have been added to the waiting queue.` }
  }

  return { success: true, message: `"${bookTitle}" requested for ₹${BORROW_PRICE}. Waiting for librarian approval.` }
}

// ── Buy a book ────────────────────────────────────────────────────────────────

export async function buyBook(
  bookId: number,
  bookTitle: string,
  bookCover: string,
  bookAuthor: string,
  bookGenre: string
): Promise<BookActionState> {
  const session = await getSession()
  if (!session) return { success: false, error: 'You must be logged in to buy a book.' }

  const user = findUserById(session.userId)
  if (!user) return { success: false, error: 'User not found.' }

  // Check if already purchased
  const alreadyBought = user.borrowedBooks.some(
    (b) => b.bookId === bookId && b.status === 'purchased'
  )
  if (alreadyBought) {
    return { success: false, error: 'You have already purchased this book.' }
  }

  const record: BorrowedBook = {
    bookId,
    bookTitle,
    bookCover,
    bookAuthor,
    bookGenre,
    borrowedAt: new Date().toISOString(),
    dueDate: new Date().toISOString(), // no due date for purchased books
    status: 'purchased',
    amountPaid: BUY_PRICE,
    transactionId: crypto.randomUUID(),
    progress: 0,
  }

  addBorrowedBook(session.userId, record)
  revalidatePath('/my-profile')
  revalidatePath('/')

  return { success: true, message: `"${bookTitle}" purchased for ₹${BUY_PRICE}. It's yours forever!` }
}

export async function returnBook(transactionId: string): Promise<BookActionState> {
  const session = await getSession()
  if (!session) return { success: false, error: 'You must be logged in.' }

  const user = findUserById(session.userId)
  if (!user) return { success: false, error: 'User not found.' }

  const book = user.borrowedBooks.find(b => b.transactionId === transactionId)
  if (!book) return { success: false, error: 'Could not find that borrow record.' }

  // Check late fees if issued or late
  let latePenalty = 0
  if (['issued', 'late'].includes(book.status)) {
    const due = new Date(book.dueDate).getTime()
    const now = Date.now()
    if (now > due) {
      const daysLate = Math.ceil((now - due) / (1000 * 60 * 60 * 24))
      latePenalty = daysLate * 10 // ₹10 per day
    }
  }

  // updateBorrowStatus allows us to pass a penalty/amount
  const updated = updateBorrowStatus(session.userId, transactionId, 'returned', new Date().toISOString(), latePenalty)
  if (!updated) return { success: false, error: 'Could not update borrow record.' }

  revalidatePath('/my-profile')
  revalidatePath('/library')
  
  if (latePenalty > 0) {
    return { success: true, message: `Book returned. A late penalty of ₹${latePenalty} was added to your account.` }
  }
  return { success: true, message: 'Book returned successfully.' }
}

// ── Admin Simulation Action ─────────────────────────────────────────────────────

export async function simulateLifecycleAction(transactionId: string, newStatus: BorrowedBook['status']): Promise<BookActionState> {
  const session = await getSession()
  if (!session) return { success: false, error: 'You must be logged in.' }

  // updateBorrowStatus
  const updated = updateBorrowStatus(session.userId, transactionId, newStatus)
  if (!updated) return { success: false, error: 'Could not update status.' }

  revalidatePath('/my-profile')
  revalidatePath('/library')
  return { success: true, message: `Status updated to ${newStatus}.` }
}

// ── Buy a previously borrowed book ──────────────────────────────────────────────

export async function buyBorrowedBook(transactionId: string): Promise<BookActionState> {
  const session = await getSession()
  if (!session) return { success: false, error: 'You must be logged in.' }

  const user = findUserById(session.userId)
  if (!user) return { success: false, error: 'User not found.' }

  const record = user.borrowedBooks.find(b => b.transactionId === transactionId)
  if (!record) return { success: false, error: 'Could not find that borrow record.' }
  if (record.status === 'purchased') return { success: false, error: 'Book is already purchased.' }

  const upgradePrice = BUY_PRICE - BORROW_PRICE
  const updated = updateBorrowStatus(session.userId, transactionId, 'purchased', undefined, upgradePrice)
  if (!updated) return { success: false, error: 'Could not upgrade book status.' }

  revalidatePath('/my-profile')
  revalidatePath('/')
  return { success: true, message: `Book purchased for ₹${upgradePrice}.` }
}

// ── Pin a book ────────────────────────────────────────────────────────────────

export async function togglePinAction(bookId: number): Promise<BookActionState> {
  const session = await getSession()
  if (!session) return { success: false, error: 'You must be logged in.' }

  const updated = togglePinBook(session.userId, bookId)
  if (!updated) return { success: false, error: 'User not found.' }

  revalidatePath('/library')
  return { success: true, message: 'Pin toggled.' }
}

// ── Update progress ───────────────────────────────────────────────────────────

export async function updateProgressAction(transactionId: string, progress: number): Promise<BookActionState> {
  const session = await getSession()
  if (!session) return { success: false, error: 'You must be logged in.' }

  const updated = updateBookProgress(session.userId, transactionId, progress)
  if (!updated) return { success: false, error: 'Could not update progress.' }

  revalidatePath('/library')
  revalidatePath('/my-profile')
  return { success: true, message: 'Progress updated.' }
}
