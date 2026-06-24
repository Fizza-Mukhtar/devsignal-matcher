import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DevSignal Matcher',
  description: 'Candidate-to-role matching engine',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}