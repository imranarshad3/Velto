import OrderList from '../../features/orders/OrderList.tsx'
import AdminHeading from './AdminHeading.tsx'
export default function AdminOrdersPage(){return <><title>Orders — Admin — VELTO</title><AdminHeading title="Orders" crumbs={[{label:'Orders'}]}>Manage purchases separately from project consultations.</AdminHeading><OrderList admin/></>}
