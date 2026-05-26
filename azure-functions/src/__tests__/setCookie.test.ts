import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { buildSetCookieHeader, useCrossSiteAdminCookie } from '../auth/setCookie'

describe('useCrossSiteAdminCookie', () => {
  const prev = {
    NODE_ENV: process.env.NODE_ENV,
    WEBSITE_SITE_NAME: process.env.WEBSITE_SITE_NAME,
    ADMIN_COOKIE_CROSS_SITE: process.env.ADMIN_COOKIE_CROSS_SITE,
  }

  afterEach(() => {
    process.env.NODE_ENV = prev.NODE_ENV
    process.env.WEBSITE_SITE_NAME = prev.WEBSITE_SITE_NAME
    process.env.ADMIN_COOKIE_CROSS_SITE = prev.ADMIN_COOKIE_CROSS_SITE
  })

  it('returns true when WEBSITE_SITE_NAME is set (Azure hosted)', () => {
    delete process.env.NODE_ENV
    delete process.env.ADMIN_COOKIE_CROSS_SITE
    process.env.WEBSITE_SITE_NAME = 'my-function-app'
    assert.equal(useCrossSiteAdminCookie(), true)
  })

  it('returns false in plain local dev without overrides', () => {
    delete process.env.NODE_ENV
    delete process.env.WEBSITE_SITE_NAME
    delete process.env.ADMIN_COOKIE_CROSS_SITE
    assert.equal(useCrossSiteAdminCookie(), false)
  })
})

describe('buildSetCookieHeader', () => {
  const prev = {
    NODE_ENV: process.env.NODE_ENV,
    WEBSITE_SITE_NAME: process.env.WEBSITE_SITE_NAME,
    ADMIN_COOKIE_CROSS_SITE: process.env.ADMIN_COOKIE_CROSS_SITE,
  }

  afterEach(() => {
    process.env.NODE_ENV = prev.NODE_ENV
    process.env.WEBSITE_SITE_NAME = prev.WEBSITE_SITE_NAME
    process.env.ADMIN_COOKIE_CROSS_SITE = prev.ADMIN_COOKIE_CROSS_SITE
  })

  it('uses SameSite=Lax without Secure in non-production', () => {
    delete process.env.NODE_ENV
    delete process.env.WEBSITE_SITE_NAME
    delete process.env.ADMIN_COOKIE_CROSS_SITE
    const header = buildSetCookieHeader('jwt-token')
    assert.match(header, /admin-session=jwt-token/)
    assert.match(header, /SameSite=Lax/)
    assert.doesNotMatch(header, /SameSite=None/)
    assert.doesNotMatch(header, /;\s*Secure/)
  })

  it('uses SameSite=None and Secure when WEBSITE_SITE_NAME is set', () => {
    delete process.env.NODE_ENV
    process.env.WEBSITE_SITE_NAME = 'my-function-app'
    const header = buildSetCookieHeader('jwt-token')
    assert.match(header, /admin-session=jwt-token/)
    assert.match(header, /SameSite=None/)
    assert.match(header, /;\s*Secure/)
  })

  it('uses SameSite=None and Secure in production via NODE_ENV', () => {
    delete process.env.WEBSITE_SITE_NAME
    process.env.NODE_ENV = 'production'
    const header = buildSetCookieHeader('jwt-token')
    assert.match(header, /SameSite=None/)
    assert.match(header, /;\s*Secure/)
  })

  it('clears the cookie with matching flags when cross-site', () => {
    process.env.WEBSITE_SITE_NAME = 'my-function-app'
    const header = buildSetCookieHeader('', true)
    assert.match(header, /admin-session=;/)
    assert.match(header, /Max-Age=0/)
    assert.match(header, /SameSite=None/)
    assert.match(header, /;\s*Secure/)
  })
})
