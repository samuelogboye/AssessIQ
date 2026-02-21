import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useOnlineStatus } from '../useOnlineStatus'

function StatusIndicator() {
  const isOnline = useOnlineStatus()
  return <div>{isOnline ? 'online' : 'offline'}</div>
}

describe('useOnlineStatus', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('shows online by default', () => {
    render(<StatusIndicator />)
    expect(screen.getByText('online')).toBeInTheDocument()
  })
})
