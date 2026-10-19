import { lazy, Suspense } from 'react'
import ContentProvider from '../../features/cms/ContentProvider.tsx'
import { useContentState } from '../../features/cms/context.ts'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import CatalogProvider from '../../features/catalog/CatalogProvider.tsx'
import AuthProvider from '../../lib/auth/AuthProvider.tsx'
import AdminTopBar from './AdminTopBar.tsx'
import AnnouncementBar from './AnnouncementBar.tsx'
import Footer from './Footer.tsx'
import Header from './Header.tsx'
import Toaster from './Toaster.tsx'
import WishlistSync from '../../features/wishlist/WishlistSync.tsx'

// The page registry is admin-sized; load it only when published content actually has editor-added sections.
const AddedSections = lazy(() => import('../../features/cms/AddedSections.tsx'))

function CustomSections() {
  const { pages } = useContentState()
  if (!Object.values(pages).some((page) => page.sections?.length)) return null
  return (
    <Suspense fallback={null}>
      <AddedSections />
    </Suspense>
  )
}

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
        {!admin && <CustomSections />}
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
