import React from 'react'
import Link from 'next/link'
import { HeartPulse, } from "lucide-react"

const Header = () => {
  return (
    <div className='flex flex-row justify-evenly gap-4 shadow-md bg-slate-400 text-black h-12 items-center'>
        <div>
           <h1 className="text-lg  font-bold flex flex-row items-center gap-2 text-white">
                       <HeartPulse color="darkblue"  size={30} />
                       SmartCare
                     </h1> 
        </div>
<Link href="/diabetes">Home</Link>
<Link href='/features'>Features</Link>
<Link href='/resources'>Resources</Link>
<Link href='/aboutUs'>About Us</Link>
<Link href='/contact'>Contact</Link>
    </div>
  )
}

export default Header