import '@testing-library/jest-dom'

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
	globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}
