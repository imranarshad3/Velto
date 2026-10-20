import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clearLocalDraft, readLocalDraft, writeLocalDraft } from '../src/features/cms/draftRecovery.js'
import { defaultContent } from '../src/features/cms/registry.js'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

describe('CMS local draft recovery', () => {
  it('recovers unsaved content even when the server revision changed', () => {
    const store = memoryStorage()
    const draft = defaultContent('home')
    draft.fields['Hero.field-2'] = 'Recovered headline'
    writeLocalDraft('admin-A:home', 4, draft, store)

    assert.equal(readLocalDraft('admin-A:home', store)?.content.fields['Hero.field-2'], 'Recovered headline')
    assert.equal(readLocalDraft('admin-A:home', store)?.version, 4)
    assert.equal(readLocalDraft('admin-B:home', store), null)
  })

  it('clears saved drafts and ignores corrupt storage entries', () => {
    const store = memoryStorage()
    const draft = defaultContent('home')
    writeLocalDraft('admin-A:home', 0, draft, store)
    clearLocalDraft('admin-A:home', store)
    assert.equal(readLocalDraft('admin-A:home', store), null)
    store.setItem('velto-cms-unsaved:admin-A:home', '{bad json')
    assert.equal(readLocalDraft('admin-A:home', store), null)
  })
})
