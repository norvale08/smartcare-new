import React from 'react'
import Link from 'next/link'

const Header = () => {
  return (
    <div className='flex flex-row justify-evenly gap-4 shadow-md bg-blue-200 text-black h-12 items-center'>
<Link href="/diabetes">Home</Link>
<Link href='/features'>Features</Link>
<Link href='/resources'>Resources</Link>
<Link href='/aboutUs'>About Us</Link>
<Link href='/contact'>Contact</Link>
    </div>
  )
}

export default Header