import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'

const navLinks = [
  { href: ROUTES.HOME, label: 'Home' },
  { href: ROUTES.ABOUT, label: 'About' },
  { href: ROUTES.CONTACT, label: 'Contact' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary-900/80 backdrop-blur-md border-b border-primary-700">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-primary-900 font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-neutral-100">AssessIQ</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-accent',
                  location.pathname === link.href
                    ? 'text-accent'
                    : 'text-neutral-300'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to={ROUTES.LOGIN}>Sign In</Link>
            </Button>
            <Button asChild>
              <Link to={ROUTES.REGISTER}>Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-neutral-300 hover:text-neutral-100"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-primary-700 animate-slide-down">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-accent px-2 py-1',
                    location.pathname === link.href
                      ? 'text-accent'
                      : 'text-neutral-300'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-primary-700">
                <Button variant="ghost" asChild className="w-full justify-center">
                  <Link to={ROUTES.LOGIN}>Sign In</Link>
                </Button>
                <Button asChild className="w-full justify-center">
                  <Link to={ROUTES.REGISTER}>Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
