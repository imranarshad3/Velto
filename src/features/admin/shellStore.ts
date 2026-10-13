import { create } from 'zustand'

const KEY = 'novaro:admin-sidebar-collapsed'
const read = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }

/** Admin chrome shared between the layout and full-screen tools such as the Website Editor. */
interface AdminShell {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useAdminShell = create<AdminShell>((set) => ({
  sidebarCollapsed: read(),
  toggleSidebar: () => set((s) => {
    try { localStorage.setItem(KEY, s.sidebarCollapsed ? '0' : '1') } catch { /* per-viewer convenience only */ }
    return { sidebarCollapsed: !s.sidebarCollapsed }
  }),
}))
