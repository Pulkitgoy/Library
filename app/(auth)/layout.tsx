import Image from 'next/image'
import Link from 'next/link'
import React, { ReactNode } from 'react'


const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className='auth-container'>
      {/* Left: Form Panel */}
      <section className='auth-form'>
        <div className='auth-box'>
          {/* Logo */}
          <Link href="/" className='flex flex-row items-center gap-3 mb-2 group'>
            <div className="relative size-[42px]">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:bg-primary/30 transition-colors" />
              <Image src="/icons/logo.svg" alt="BookWise logo" width={42} height={42} className="relative z-10" style={{ width: 42, height: 42 }} />
            </div>
            <h1 className='text-2xl font-bold text-white tracking-tight'>BookWise</h1>
          </Link>

          <div className='w-full h-px bg-gradient-to-r from-transparent via-light-100/20 to-transparent my-1' />

          <div>{children}</div>
        </div>
      </section>

      {/* Right: Illustration Panel */}
      <section className='auth-illustration'>
        <div className="relative w-full h-full">
          <Image
            src="/images/auth-illustration.png"
            alt="Library illustration"
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className='object-cover'
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-dark-100/60 via-transparent to-transparent sm:from-transparent" />

          {/* Bottom badge */}
          <div className="absolute bottom-8 left-0 right-0 px-8 hidden sm:flex flex-col items-center gap-2">
            <div className="backdrop-blur-sm bg-dark-100/50 border border-light-100/10 rounded-2xl px-6 py-4 max-w-sm text-center">
              <p className="text-white font-semibold text-lg">📚 Your University Library</p>
              <p className="text-light-100 text-sm mt-1">
                Borrow, buy, and discover thousands of books — all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Layout