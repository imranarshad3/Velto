import OrderList from '../../features/orders/OrderList.tsx'
import AccountHeading from './AccountHeading.tsx'
export default function OrdersPage(){return <><title>Orders — VELTO</title><AccountHeading title="Orders" crumbs={[{label:'Orders'}]}/><OrderList/></>}
