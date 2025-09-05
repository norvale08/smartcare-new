import type { Metadata } from 'next'
import { ReactNode } from 'react'
import './globals.css'
import {AuthProvider} from "./Providers"
import Header from './components/ui/header'
import Footer from './components/ui/footer'

export const metadata: Metadata = {
  title: 'Your App Title',
  description: 'Your app description',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          
        {children}
<Footer></Footer>
        </AuthProvider>

      </body>
    </html>
  )
}
