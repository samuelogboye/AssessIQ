import { Link } from 'react-router-dom'
import { Github, Twitter, Linkedin } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

const footerLinks = {
  product: [
    { href: '#features', label: 'Features' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' },
  ],
  company: [
    { href: ROUTES.ABOUT, label: 'About' },
    { href: ROUTES.CONTACT, label: 'Contact' },
    { href: '#careers', label: 'Careers' },
  ],
  legal: [
    { href: '#privacy', label: 'Privacy Policy' },
    { href: '#terms', label: 'Terms of Service' },
  ],
}

const socialLinks = [
  { href: 'https://github.com', icon: Github, label: 'GitHub' },
  { href: 'https://twitter.com', icon: Twitter, label: 'Twitter' },
  { href: 'https://linkedin.com', icon: Linkedin, label: 'LinkedIn' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary-900 border-t border-primary-700">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-primary-900 font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-neutral-100">AssessIQ</span>
            </Link>
            <p className="text-sm text-neutral-400 mb-4">
              Modern assessment platform with AI-powered grading for educators and institutions.
            </p>
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-accent transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-100 mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-100 mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-neutral-400 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-100 mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-700">
          <p className="text-sm text-neutral-400 text-center">
            &copy; {currentYear} AssessIQ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
