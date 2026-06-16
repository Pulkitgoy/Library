'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTransition } from 'react'
import { signOut } from '@/app/actions/auth'

interface Props {
  userName: string
}

const HeaderClient = ({ userName }: Props) => {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <div className="flex items-center gap-3">
      {/* Profile link with avatar */}
      <Link
        href="/my-profile"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
          pathname === '/my-profile'
            ? 'bg-primary/20 text-primary'
            : 'text-light-100 hover:bg-dark-300 hover:text-white'
        }`}
        title={`Profile: ${userName}`}
      >
        {/* Avatar circle with initials */}
        <span className="size-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
          {initials}
        </span>
        <span className="text-sm font-medium hidden md:block truncate max-w-[100px]">
          {userName || 'Profile'}
        </span>
      </Link>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={isPending}
        title="Sign out"
        className="flex items-center gap-1.5 text-light-100 hover:text-white transition-colors disabled:opacity-40 px-2 py-1.5 rounded-lg hover:bg-dark-300"
      >
        <Image src="/icons/logout.svg" alt="logout" width={18} height={18} style={{ width: 18, height: 18 }} />
        <span className="text-sm hidden md:block">
          {isPending ? 'Signing out…' : 'Sign out'}
        </span>
      </button>
    </div>
  )
}

export default HeaderClient
