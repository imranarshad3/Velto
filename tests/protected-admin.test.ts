import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createMemoryStore } from '../server/quotes/memoryStore.ts'
import { quoteStatusUpdateSchema } from '../src/features/catalog/productSchema.ts'
test('protected admins cannot be removed by another admin or themselves', async () => {
 const store=createMemoryStore({admins:['owner','partner','staff'],superAdmins:['owner','partner']})
 assert.equal(await store.removeAdmin('staff','owner'),'protected')
 assert.equal(await store.removeAdmin('owner','partner'),'protected')
 assert.equal(await store.removeAdmin('owner','owner'),'protected')
 assert.equal(await store.removeAdmin('owner','staff'),'ok')
 assert.equal((await store.listAdminTeam()).members.length,2)
})
test('project cancellation is an accepted status', () => {
 assert.equal(quoteStatusUpdateSchema.safeParse({status:'cancelled'}).success,true)
})
