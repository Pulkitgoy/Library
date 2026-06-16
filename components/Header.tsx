import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '@/lib/session'
import { navigationLinks } from '@/constants'
import HeaderClient from './HeaderClient'

const Header = async () => {
  const session = await getSession()

  return (
    <header className='my-10 flex justify-between items-center gap-5'>
      <Link href="/" className='text-white flex items-center gap-3'>
        <Image src="/icons/logo.svg" alt="logo" width={40} height={40} style={{ width: 40, height: 40 }} />
        <span className='text-xl font-semibold text-white hidden sm:block'>BookWise</span>
      </Link>

      <nav className="flex items-center gap-6">
        {navigationLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-base text-light-100 hover:text-white transition-colors hidden sm:block"
          >
            {label}
          </Link>
        ))}

        {/* Avatar + sign-out — client-side for active highlighting + transitions */}
        <HeaderClient userName={session?.name ?? ''} />
      </nav>
    </header>
  )
}

export default Header