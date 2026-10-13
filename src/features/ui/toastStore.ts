import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  action?: { label: string; to: string }
}

interface ToastStore {
  toasts: Toast[]
  show: (message: string, action?: Toast['action']) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToasts = create<ToastStore>()((set, get) => ({
  toasts: [],
  show: (message, action) => {
    const id = nextId++
    set({ toasts: [...get().toasts.slice(-2), { id, message, action }] })
    setTimeout(() => get().dismiss(id), 5000)
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))
