import type { Metadata } from 'next'
import { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Your App Title',
  description: 'Your app description',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
