'use client'

import React, { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { togglePinAction, updateProgressAction } from '@/app/actions/books'
import { User } from '@/lib/db'

type LibraryViewProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  books: any[]
  user: User
}

export default function LibraryView({ books, user }: LibraryViewProps) {
  const [activeFilter, setActiveFilter] = useState('All')
  
  const pinnedSet = new Set(user.pinnedBooks || [])
  const userBooksMap = new Map()
  user.borrowedBooks.forEach(b => userBooksMap.set(b.bookId, b))

  const filters = ['All', 'Completed Books', 'Purchased Books', 'Borrowed Books', 'Pinned Books']

  const filteredBooks = books.filter((book) => {
    const isPinned = pinnedSet.has(book.id)
    const userBook = userBooksMap.get(book.id)
    
    if (activeFilter === 'All') return true
    if (activeFilter === 'Pinned Books') return isPinned
    if (activeFilter === 'Completed Books') return userBook && userBook.progress === 100
    if (activeFilter === 'Purchased Books') return userBook && userBook.status === 'purchased'
    if (activeFilter === 'Borrowed Books') return userBook && ['requested', 'approved', 'issued', 'late', 'reserved'].includes(userBook.status)
    return true
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${activeFilter === f ? 'bg-primary text-dark-100' : 'bg-dark-300 text-light-100 hover:bg-dark-600'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredBooks.length === 0 ? (
        <div className="py-10 text-center text-light-100/60">No books found in this category.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <LibraryBookCard 
              key={book.id} 
              book={book} 
              isPinned={pinnedSet.has(book.id)}
              userBook={userBooksMap.get(book.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LibraryBookCard({ book, isPinned, userBook }: { book: any, isPinned: boolean, userBook: any }) {
  const [isPending, startTransition] = useTransition()
  const [progress, setProgress] = useState(userBook?.progress || 0)

  const handleTogglePin = () => {
    startTransition(() => {
      togglePinAction(book.id)
    })
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    setProgress(val)
  }

  const handleProgressSave = () => {
    if (!userBook) return
    startTransition(() => {
      updateProgressAction(userBook.transactionId, progress)
    })
  }

  return (
    <div className="relative rounded-xl border border-light-100/10 p-4 flex gap-4"
      style={{ background: 'linear-gradient(145deg, #1a1d2e 0%, #12141d 100%)' }}>
      
      {/* Pin button */}
      <button 
        onClick={handleTogglePin}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-dark-600 z-10 transition-colors"
        disabled={isPending}
      >
        <Image src="/icons/heart.svg" alt="pin" width={20} height={20} className={isPinned ? 'opacity-100 brightness-150 filter sepia hue-rotate-180 saturate-200' : 'opacity-40'} />
      </button>

      {/* Cover */}
      <div className="shrink-0 w-20 h-28 rounded-lg overflow-hidden bg-dark-600">
        <Link href={`/books/${book.id}`}>
          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
        </Link>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Link href={`/books/${book.id}`} className="hover:underline">
          <h3 className="text-sm font-semibold text-white line-clamp-2 pr-6">{book.title}</h3>
        </Link>
        <p className="text-xs text-light-100/60 mt-1 truncate">{book.author}</p>
        
        {userBook ? (
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between text-[10px] mb-1.5 uppercase tracking-wider font-semibold">
              <span className={userBook.status === 'purchased' ? 'text-primary' : 'text-blue-400'}>
                {userBook.status === 'purchased' ? 'Purchased' : userBook.status}
              </span>
              <span className="text-white">{progress}%</span>
            </div>
            
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress}
              onChange={handleProgressChange}
              onMouseUp={handleProgressSave}
              onTouchEnd={handleProgressSave}
              className="w-full h-1.5 bg-dark-600 rounded-lg appearance-none cursor-pointer overflow-hidden accent-primary"
            />
          </div>
        ) : (
          <div className="mt-auto pt-3">
             <Link href={`/books/${book.id}`}>
               <span className="text-xs text-primary hover:underline">View details →</span>
             </Link>
          </div>
        )}
      </div>
    </div>
  )
}
