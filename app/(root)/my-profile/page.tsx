import { redirect } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getSession } from '@/lib/session'
import { findUserById, type BorrowedBook } from '@/lib/db'
import { returnBook, buyBorrowedBook, simulateLifecycleAction } from '@/app/actions/books'

export const metadata: Metadata = {
  title: 'My Profile | BookWise',
  description: 'Your BookWise library profile and borrowed books.',
}

// ── helpers ───────────────────────────────────────────────────────────────────

function daysLeft(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date()
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── sub-components ────────────────────────────────────────────────────────────

function BookBadge({ status }: { status: BorrowedBook['status'] }) {
  const map: Record<BorrowedBook['status'], string> = {
    requested: 'bg-orange-100/20 text-orange-400 border-orange-400/30',
    approved: 'bg-purple-100/20 text-purple-400 border-purple-400/30',
    issued: 'bg-blue-100/20 text-blue-400 border-blue-400/30',
    late: 'bg-red-500/20 text-red-500 border-red-500/30',
    reserved: 'bg-yellow-100/20 text-yellow-400 border-yellow-400/30',
    cancelled: 'bg-gray-100/20 text-gray-400 border-gray-400/30',
    returned: 'bg-green-100/20 text-green-500 border-green-500/30',
    purchased: 'bg-primary/20 text-primary border-primary/30',
  }
  const label: Record<BorrowedBook['status'], string> = { 
    requested: 'Requested', approved: 'Approved', 
    issued: 'Issued', late: 'Late', reserved: 'Reserved', 
    cancelled: 'Cancelled', returned: 'Returned', purchased: 'Purchased' 
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[status] || map.issued}`}>
      {label[status] || status}
    </span>
  )
}

function DueDatePill({ dueDate, status }: { dueDate: string; status: BorrowedBook['status'] }) {
  if (!['issued', 'late', 'approved'].includes(status)) return null
  const days = daysLeft(dueDate)
  const overdue = days < 0
  const urgent = days >= 0 && days <= 3
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
      overdue ? 'bg-red-500/20 text-red-400' :
      urgent ? 'bg-yellow-500/20 text-yellow-400' :
      'bg-dark-600 text-light-100'
    }`}>
      {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
    </span>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function MyProfilePage() {
  const session = await getSession()
  if (!session) redirect('/sign-in')

  const user = findUserById(session.userId)
  if (!user) redirect('/sign-in')

  const activeStatuses = ['requested', 'approved', 'issued', 'late', 'reserved']
  const borrowed = user.borrowedBooks.filter((b) => activeStatuses.includes(b.status))
  const purchased = user.borrowedBooks.filter((b) => b.status === 'purchased')
  const returned = user.borrowedBooks.filter((b) => b.status === 'returned' || b.status === 'cancelled')

  return (
    <div className="space-y-10">

      {/* ── Profile Card ── */}
      <section className="relative overflow-hidden rounded-2xl border border-light-100/10 p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #1a1d2e 0%, #12141d 60%, #0f1119 100%)' }}>

        {/* Background glow */}
        <div className="absolute -top-12 -right-12 size-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row gap-6 items-start sm:items-center">

          {/* University card thumbnail */}
          <div className="shrink-0 rounded-xl overflow-hidden border border-light-100/10 shadow-lg"
            style={{ width: 120, height: 76 }}>
            {user.universityCard ? (
              <img
                src={user.universityCard.startsWith('data:') ? user.universityCard : user.universityCard}
                alt="University ID"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-dark-600 flex items-center justify-center">
                <Image src="/icons/user.svg" alt="no card" width={32} height={32} className="opacity-40" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">{user.fullName}</h1>
            <p className="mt-1 text-light-100 text-sm">{user.email}</p>

            <div className="mt-3 flex flex-wrap gap-3">
              <div className="bg-dark-300 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-light-100/60">University ID</span>
                <p className="font-bold text-white mt-0.5">{user.universityId}</p>
              </div>
              <div className="bg-dark-300 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-light-100/60">Member since</span>
                <p className="font-bold text-white mt-0.5">{formatDate(user.createdAt)}</p>
              </div>
              <div className="bg-dark-300 rounded-lg px-3 py-1.5 text-xs flex gap-4">
                <div>
                  <span className="text-light-100/60">Total books</span>
                  <p className="font-bold text-primary mt-0.5">{user.borrowedBooks.length}</p>
                </div>
                <div>
                  <span className="text-light-100/60">Penalties</span>
                  <p className="font-bold text-red-500 mt-0.5">₹{user.penalties || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats summary */}
          <div className="flex gap-4 sm:flex-col sm:items-end shrink-0">
            {[
              { label: 'Borrowed', value: borrowed.length, color: 'text-blue-400' },
              { label: 'Purchased', value: purchased.length, color: 'text-primary' },
              { label: 'Returned', value: returned.length, color: 'text-green-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-light-100/60 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Currently Borrowed ── */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="size-2 rounded-full bg-blue-400 inline-block" />
          Currently Borrowed
          <span className="text-sm font-normal text-light-100/60 ml-1">({borrowed.length})</span>
        </h2>

        {borrowed.length === 0 ? (
          <EmptyState icon="📚" text="No books currently borrowed." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {borrowed.map((book) => (
              <BookCard key={book.transactionId} book={book}>
                <div className="mt-3 flex gap-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <form action={returnBook.bind(null, book.transactionId) as any} className="flex-1">
                    <button
                      type="submit"
                      className="w-full text-xs font-semibold py-2 rounded-lg border border-light-100/20 text-light-100 hover:bg-dark-600 transition-colors"
                    >
                      Return book
                    </button>
                  </form>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <form action={buyBorrowedBook.bind(null, book.transactionId) as any} className="flex-1">
                    <button
                      type="submit"
                      className="w-full text-xs font-semibold py-2 rounded-lg border border-primary/50 text-primary hover:bg-primary/10 transition-colors"
                    >
                      Buy for ₹250
                    </button>
                  </form>

                  {/* Simulate Dropdown for testing lifecycle */}
                  <div className="flex-1">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <form action={async (formData: FormData) => {
                      'use server'
                      const newStatus = formData.get('status') as BorrowedBook['status']
                      if (newStatus) {
                        await simulateLifecycleAction(book.transactionId, newStatus)
                      }
                    }}>
                      <select 
                        name="status"
                        onChange={(e) => e.target.form?.requestSubmit()}
                        className="w-full text-xs font-semibold py-2 px-1 rounded-lg border border-purple-500/50 text-purple-400 bg-transparent hover:bg-purple-500/10 transition-colors appearance-none text-center cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>Simulate...</option>
                        <option value="approved">Approve</option>
                        <option value="issued">Issue</option>
                        <option value="late">Make Late</option>
                      </select>
                    </form>
                  </div>
                </div>
              </BookCard>
            ))}
          </div>
        )}
      </section>

      {/* ── Purchased ── */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary inline-block" />
          Purchased Books
          <span className="text-sm font-normal text-light-100/60 ml-1">({purchased.length})</span>
        </h2>

        {purchased.length === 0 ? (
          <EmptyState icon="🛒" text="No books purchased yet." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {purchased.map((book) => (
              <BookCard key={book.transactionId} book={book} />
            ))}
          </div>
        )}
      </section>

      {/* ── Returned ── */}
      {returned.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-500 inline-block" />
            Returned Books
            <span className="text-sm font-normal text-light-100/60 ml-1">({returned.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 opacity-70">
            {returned.map((book) => (
              <BookCard key={book.transactionId} book={book}>
                <div className="mt-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <form action={buyBorrowedBook.bind(null, book.transactionId) as any}>
                    <button
                      type="submit"
                      className="w-full text-xs font-semibold py-2 rounded-lg border border-primary/50 text-primary hover:bg-primary/10 transition-colors"
                    >
                      Buy for ₹250
                    </button>
                  </form>
                </div>
              </BookCard>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}

// ── Reusable card ─────────────────────────────────────────────────────────────

function BookCard({ book, children }: { book: BorrowedBook; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-light-100/10 p-4 flex gap-4"
      style={{ background: 'linear-gradient(145deg, #1a1d2e 0%, #12141d 100%)' }}>

      {/* Cover */}
      <div className="shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-dark-600">
        {book.bookCover ? (
          <img src={book.bookCover} alt={book.bookTitle} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">{book.bookTitle}</h3>
          <BookBadge status={book.status} />
        </div>
        <p className="mt-1 text-xs text-light-100/60 truncate">{book.bookAuthor}</p>
        <p className="text-xs text-light-100/50 italic">{book.bookGenre}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <DueDatePill dueDate={book.dueDate} status={book.status} />
          <span className="text-xs text-primary font-semibold">₹{book.amountPaid}</span>
        </div>

        <p className="mt-1 text-[10px] text-light-100/40">
          {book.status === 'purchased' ? 'Purchased' : 'Requested'} {formatDate(book.borrowedAt)}
          {['issued', 'late'].includes(book.status) && ` • Due ${formatDate(book.dueDate)}`}
          {book.status === 'returned' && book.returnedAt && ` • Returned ${formatDate(book.returnedAt)}`}
        </p>

        {children}
      </div>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="rounded-xl border border-light-100/5 p-8 text-center bg-dark-300/30">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="text-light-100/60 text-sm">{text}</p>
    </div>
  )
}
