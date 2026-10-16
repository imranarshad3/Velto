import type { WorkspaceRole } from './types.js'
export const canAccess = (role: WorkspaceRole, resource: string) => role === 'admin' || (role === 'editor' ? ['cms','media','products','product-status','resources','coverage','workspace-access'].includes(resource) : ['leads','customers','quotes','messages','workspace-access','assignees','orders'].includes(resource))
