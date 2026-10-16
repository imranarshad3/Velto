import { useParams } from 'react-router'
import OrderList from '../../features/orders/OrderList.tsx'
import AdminHeading from './AdminHeading.tsx'
export default function AdminOrderDetailPage() {
 const { orderId } = useParams()
 return <><title>Order details — VELTO Admin</title><AdminHeading title="Order details" crumbs={[{label:'Orders',to:'/admin/orders'},{label:'Details'}]}>Review purchased items, delivery information and order status.</AdminHeading><OrderList admin orderId={orderId}/></>
}
