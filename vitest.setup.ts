import '@testing-library/jest-dom'

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
