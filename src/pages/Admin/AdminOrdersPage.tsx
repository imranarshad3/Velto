import OrderList from '../../features/orders/OrderList.tsx'
import AdminHeading from './AdminHeading.tsx'
export default function AdminOrdersPage(){return <><title>Orders — Admin — VELTO</title><AdminHeading title="Orders" crumbs={[{label:'Orders'}]}>Review new purchases, find delivery details and keep every order moving.</AdminHeading><OrderList admin/></>}
