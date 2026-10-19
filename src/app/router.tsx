import { createBrowserRouter } from 'react-router'
import SiteLayout from '../components/layout/SiteLayout.tsx'
import HomePage from '../pages/Home/HomePage.tsx'
import ProductsPage from '../pages/Products/ProductsPage.tsx'
import ProductDetailPage from '../pages/ProductDetail/ProductDetailPage.tsx'
import NotFoundPage from '../pages/NotFound/NotFoundPage.tsx'
import RouteErrorPage from '../pages/Error/RouteErrorPage.tsx'

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    errorElement: <RouteErrorPage />,
    // Shown while a lazily loaded page is fetched on first load.
    hydrateFallbackElement: <div aria-busy="true" aria-label="Loading" className="min-h-dvh bg-canvas" />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      // Form/validation code is split into its own chunks.
      { path: 'quote', lazy: async () => ({ Component: (await import('../pages/Quote/QuotePage.tsx')).default }) },
      { path: 'quote/confirmation', lazy: async () => ({ Component: (await import('../pages/Quote/QuoteConfirmationPage.tsx')).default }) },
      { path: 'cart', lazy: async () => ({ Component: (await import('../pages/Cart/CartPage.tsx')).default }) },
      { path: 'wishlist', lazy: async () => ({ Component: (await import('../pages/Wishlist/WishlistPage.tsx')).default }) },
      { path: 'checkout', lazy: async () => ({ Component: (await import('../pages/Checkout/CheckoutPage.tsx')).default }) },
      { path: 'track', lazy: async () => ({ Component: (await import('../pages/Track/TrackPage.tsx')).default }) },
      { path: 'sign-in/*', lazy: async () => ({ Component: (await import('../pages/Auth/SignInRoute.tsx')).default }) },
      { path: 'sign-up/*', lazy: async () => ({ Component: (await import('../pages/Auth/SignUpRoute.tsx')).default }) },
      {
        path: 'account',
        lazy: async () => ({ Component: (await import('../pages/Account/AccountLayout.tsx')).default }),
        children: [
          { index: true, lazy: async () => ({ Component: (await import('../pages/Account/DashboardPage.tsx')).default }) },
          { path: 'quotes', lazy: async () => ({ Component: (await import('../pages/Account/AccountQuotesPage.tsx')).default }) },
          { path: 'quotes/:reference', lazy: async () => ({ Component: (await import('../pages/Account/QuoteDetailPage.tsx')).default }) },
          { path: 'orders/:orderId', lazy: async () => ({ Component: (await import('../pages/Account/OrderDetailPage.tsx')).default }) },
          { path: 'orders', lazy: async () => ({ Component: (await import('../pages/Account/OrdersPage.tsx')).default }) },
          { path: 'profile/*', lazy: async () => ({ Component: (await import('../pages/Account/ProfilePage.tsx')).default }) },
        ],
      },
      { path: 'solutions', lazy: async () => ({ Component: (await import('../pages/Solutions/SolutionsPage.tsx')).default }) },
      { path: 'applications', lazy: async () => ({ Component: (await import('../pages/Applications/ApplicationsPage.tsx')).default }) },
      { path: 'applications/:slug', lazy: async () => ({ Component: (await import('../pages/Applications/ApplicationDetailPage.tsx')).default }) },
      { path: 'about', lazy: async () => ({ Component: (await import('../pages/About/AboutPage.tsx')).default }) },
      { path: 'contact', lazy: async () => ({ Component: (await import('../pages/Contact/ContactPage.tsx')).default }) },
      { path: 'resources', lazy: async () => ({ Component: (await import('../pages/Resources/ResourcesPage.tsx')).default }) },
      { path: 'resources/documents', lazy: async () => ({ Component: (await import('../pages/Resources/DocumentsPage.tsx')).default }) },
      { path: 'resources/coverage-calculator', lazy: async () => ({ Component: (await import('../pages/Resources/CalculatorPage.tsx')).default }) },
      { path: 'faq', lazy: async () => ({ Component: (await import('../pages/Resources/FaqPage.tsx')).default }) },
      { path: 'privacy', lazy: async () => ({ Component: (await import('../pages/Legal/PrivacyPage.tsx')).default }) },
      { path: 'terms', lazy: async () => ({ Component: (await import('../pages/Legal/TermsPage.tsx')).default }) },
      {
        path: 'admin',
        lazy: async () => ({ Component: (await import('../pages/Admin/AdminLayout.tsx')).default }),
        children: [
          { index: true, lazy: async () => ({ Component: (await import('../pages/Admin/AdminDashboardPage.tsx')).default }) },
          { path: 'website', lazy: async () => ({ Component: (await import('../pages/Admin/AdminWebsitePage.tsx')).default }) },
          { path: 'pages', lazy: async () => ({ Component: (await import('../pages/Admin/AdminPagesPage.tsx')).default }) },
          { path: 'media', lazy: async () => ({ Component: (await import('../pages/Admin/AdminMediaPage.tsx')).default }) },
          { path: 'categories', lazy: async () => ({ Component: (await import('../pages/Admin/AdminWebsitePage.tsx')).default }) },
          { path: 'pipeline', lazy: async () => ({ Component: (await import('../pages/Admin/AdminPipelinePage.tsx')).default }) },
          { path: 'settings', lazy: async () => ({ Component: (await import('../pages/Admin/AdminSettingsPage.tsx')).default }) },
          { path: 'orders/:orderId', lazy: async () => ({ Component: (await import('../pages/Admin/AdminOrderDetailPage.tsx')).default }) },
          { path: 'orders', lazy: async () => ({ Component: (await import('../pages/Admin/AdminOrdersPage.tsx')).default }) },
          { path: 'analytics', lazy: async () => ({ Component: (await import('../pages/Admin/AdminAnalyticsPage.tsx')).default }) },
          { path: 'quotes', lazy: async () => ({ Component: (await import('../pages/Admin/AdminQuotesPage.tsx')).default }) },
          { path: 'quotes/:reference', lazy: async () => ({ Component: (await import('../pages/Admin/AdminQuoteDetailPage.tsx')).default }) },
          { path: 'products', lazy: async () => ({ Component: (await import('../pages/Admin/AdminProductsPage.tsx')).default }) },
          { path: 'products/:slug', lazy: async () => ({ Component: (await import('../pages/Admin/AdminProductEditPage.tsx')).default }) },
          { path: 'customers', lazy: async () => ({ Component: (await import('../pages/Admin/AdminCustomersPage.tsx')).default }) },
          { path: 'messages', lazy: async () => ({ Component: (await import('../pages/Admin/AdminMessagesPage.tsx')).default }) },
          { path: 'resources', lazy: async () => ({ Component: (await import('../pages/Admin/AdminResourcesPage.tsx')).default }) },
          { path: 'team', lazy: async () => ({ Component: (await import('../pages/Admin/AdminTeamPage.tsx')).default }) },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
