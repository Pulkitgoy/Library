'use client'

import React, { useActionState } from 'react'
import Image from "next/image"
import { Button } from './ui/button'
import { borrowBook, buyBook, BookActionState } from '@/app/actions/books'

const initialState: BookActionState = { success: false, error: '' }

export default function BookActions({ book }: { book: Book }) {
  const [borrowState, borrowAction, isBorrowPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return borrowBook(book.id, book.title, book.cover, book.author, book.genre)
    },
    initialState
  )



  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4 items-center">
        <form action={borrowAction}>
          <Button type="submit" disabled={isBorrowPending} className='book-overview_btn'>
            <Image src="/icons/book.svg" alt="book" width={20} height={20}/>
            <p className='font-bebas-neue text-xl text-dark-100'>Borrow Book</p>
          </Button>
        </form>
      </div>

      {borrowState.message && <p className="text-green-500 font-semibold text-sm">{borrowState.message}</p>}
      {borrowState.error && <p className="text-red-500 font-semibold text-sm">{borrowState.error}</p>}

    </div>
  )
}
