import '@testing-library/jest-dom'
import { vi } from 'vitest'

if (typeof globalThis.matchMedia !== 'function') {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  )
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  class IntersectionObserverStub {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this)
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
}

/** jsdom ships `<dialog>` without `showModal`/`close`; AdminModal relies on them. */
if (typeof HTMLDialogElement !== 'undefined') {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModalPolyfill(this: HTMLDialogElement) {
      this.setAttribute('open', '')
    }
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function closePolyfill(this: HTMLDialogElement) {
      this.removeAttribute('open')
    }
  }
}
