import type { Metadata } from 'next'
import { ReactNode } from 'react'
import './globals.css'
import {AuthProvider} from "./Providers"

export const metadata: Metadata = {
  title: 'SmartCare',
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

        </AuthProvider>

      </body>
    </html>
  )
}
