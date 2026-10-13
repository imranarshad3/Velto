import { Link } from 'react-router'
import AdminHeading from './AdminHeading.tsx'
import PermissionsPanel from './PermissionsPanel.tsx'
export default function AdminSettingsPage(){return <><title>Settings — VELTO</title><AdminHeading title="Settings" crumbs={[{label:'Settings'}]}>Manage team access and shared storefront content.</AdminHeading><Link to="/admin/website?page=site" className="surface-card block p-6 font-semibold text-forest">Edit navigation, announcements and footer →</Link><PermissionsPanel/></>}
