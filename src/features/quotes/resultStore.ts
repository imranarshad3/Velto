import { create } from 'zustand'
import type { SubmitQuoteResponse } from './schema.ts'

/**
 * Last submission, kept in memory only so the confirmation page can show it.
 * Deliberately NOT persisted: the guest tracking code must not linger in storage, history or URLs.
 */
export const useQuoteResult = create<{ result: SubmitQuoteResponse | null; set: (r: SubmitQuoteResponse | null) => void }>()((set) => ({
  result: null,
  set: (result) => set({ result }),
}))
