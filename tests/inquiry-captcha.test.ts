import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'

import {
  issueCaptchaChallenge,
  verifyCaptchaSubmission,
  type CaptchaChallengeConsumeRecord,
  type CaptchaChallengeIssueRecord,
  type CaptchaChallengeStore,
} from '../lib/inquiry-captcha'

Reflect.set(process.env, 'NODE_ENV', 'test')

const secret = 'wanfan-test-secret-with-at-least-32-characters'
const tenantId = '11111111-1111-4111-8111-111111111111'
const siteScope = 'wanfancabletray.com'
const scope = 'captcha_form_scope_1234567890'

class MemoryChallengeStore implements CaptchaChallengeStore {
  private rows = new Map<string, CaptchaChallengeIssueRecord & { consumed: boolean }>()

  private key(record: Pick<CaptchaChallengeIssueRecord, 'tenantId' | 'siteScopeHash' | 'formScopeHash'>) {
    return [record.tenantId, record.siteScopeHash, record.formScopeHash].join(':')
  }

  async issue(record: CaptchaChallengeIssueRecord) {
    this.rows.set(this.key(record), { ...record, consumed: false })
  }

  async consume(record: CaptchaChallengeConsumeRecord) {
    const current = this.rows.get(this.key(record))
    const now = record.now ?? Date.now()
    if (
      !current || current.consumed || current.challengeHash !== record.challengeHash ||
      record.tokenHash !== current.tokenHash || now > current.expiresAt
    ) return false
    current.consumed = true
    return true
  }
}

describe('Wanfan inquiry CAPTCHA', () => {
  it('atomically consumes a scoped challenge only once', async () => {
    Reflect.set(process.env, 'NODE_ENV', 'test')
    const store = new MemoryChallengeStore()
    const challenge = await issueCaptchaChallenge({ secret, tenantId, siteScope, scope, store, now: 1_000 })
    assert.ok(challenge.testAnswer)
    const request = {
      secret, tenantId, siteScope, scope, store,
      token: challenge.token,
      answer: challenge.testAnswer,
      now: 1_001,
    }
    const results = await Promise.all([
      verifyCaptchaSubmission(request),
      verifyCaptchaSubmission(request),
    ])
    assert.equal(results.filter((result) => result.ok).length, 1)
  })

  it('protects the inquiry insert on the server before persistence and notification', async () => {
    const source = await readFile(new URL('../lib/inquiry.ts', import.meta.url), 'utf8')
    assert.ok(source.includes('verifyCaptchaSubmission'))
    assert.ok(source.lastIndexOf('verifyCaptchaSubmission') < source.indexOf('.from("inquiries").insert'))
    assert.ok(source.includes('captchaValue("captchaScope")'))
    assert.ok(source.includes('captchaValue("captchaToken")'))
    assert.ok(source.includes('captchaValue("captchaAnswer")'))
  })
})
