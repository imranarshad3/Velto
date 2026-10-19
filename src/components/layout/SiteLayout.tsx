import AddedSections from '../../features/cms/AddedSections.tsx'
import ContentProvider from '../../features/cms/ContentProvider.tsx'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import CatalogProvider from '../../features/catalog/CatalogProvider.tsx'
import AuthProvider from '../../lib/auth/AuthProvider.tsx'
import AdminTopBar from './AdminTopBar.tsx'
import AnnouncementBar from './AnnouncementBar.tsx'
import Footer from './Footer.tsx'
import Header from './Header.tsx'
import Toaster from './Toaster.tsx'
import WishlistSync from '../../features/wishlist/WishlistSync.tsx'

export default function SiteLayout() {
  // The admin console is an app, not a marketing page: it renders its own top bar, no storefront chrome.
  const admin = useLocation().pathname.startsWith('/admin')

  return (
    <AuthProvider>
      <CatalogProvider>
      <ContentProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-forest focus:px-4 focus:py-3 focus:text-white"
      >
        Skip to content
      </a>
      {!admin && <AnnouncementBar />}
      {admin ? <AdminTopBar /> : <Header />}
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Outlet />
        {!admin && <AddedSections />}
      </main>
      {!admin && <Footer />}
      <WishlistSync />
      <Toaster />
      <ScrollRestoration />
      </ContentProvider>
      </CatalogProvider>
    </AuthProvider>
  )
}
