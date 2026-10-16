import assert from 'node:assert/strict'
import { test } from 'node:test'
import { visibleOrders } from '../src/features/orders/orderView.js'
import type { Order } from '../src/features/orders/schema.js'
const base: Order = { id:'a', reference:'VEL-AAA', customer:{name:'Test Customer',email:'buyer@example.test',phone:'+923000000000',address:'Test delivery address',city:'Lahore',country:'Pakistan'},items:[{slug:'grout',name:'Joint Finish',quantity:1,unitPrice:100}],subtotal:100,delivery:300,total:400,currency:'PKR',status:'placed',created_at:'2026-10-15T10:00:00Z' }
const orders = [base,{...base,id:'b',reference:'VEL-BBB',status:'shipped',total:800,created_at:'2026-10-16T10:00:00Z'}]
test('order search matches reference, customer and product; combines with status',()=>{
 assert.deepEqual(visibleOrders(orders,'vel-bbb','all','newest').map(o=>o.id),['b'])
 assert.equal(visibleOrders(orders,'lahore joint','placed','newest').length,1)
 assert.equal(visibleOrders(orders,'missing','all','newest').length,0)
 assert.equal(visibleOrders(orders,'buyer@example.test','all','newest').length,2)
})
test('order sorting keeps original data intact and sorts numeric totals and dates',()=>{
 assert.deepEqual(visibleOrders(orders,'','all','newest').map(o=>o.id),['b','a'])
 assert.deepEqual(visibleOrders(orders,'','all','oldest').map(o=>o.id),['a','b'])
 assert.deepEqual(visibleOrders(orders,'','all','value').map(o=>o.id),['b','a'])
 assert.deepEqual(orders.map(o=>o.id),['a','b'])
})
