import { PublicNavbar } from '../public/PublicNavbar'
import { PublicFooter } from '../public/PublicFooter'

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({
  children,
}: PublicLayoutProps) {
  return (
    <>
      <PublicNavbar />
      <main>{children}</main>
      <PublicFooter />
    </>
  )
}