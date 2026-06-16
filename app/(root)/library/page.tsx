import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSession } from '@/lib/session'
import { findUserById } from '@/lib/db'
import { sampleBooks } from '@/constants'
import LibraryView from './LibraryView'

export const metadata: Metadata = {
  title: 'Library | BookWise',
  description: 'Browse, filter, and track all your books in the BookWise library.',
}

export default async function LibraryPage() {
  const session = await getSession()
  if (!session) redirect('/sign-in')

  const user = findUserById(session.userId)
  if (!user) redirect('/sign-in')

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Library</h1>
      <LibraryView books={sampleBooks} user={user} />
    </div>
  )
}
