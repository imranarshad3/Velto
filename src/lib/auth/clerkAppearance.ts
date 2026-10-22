import type { ComponentProps } from 'react'
import type { ClerkProvider } from '@clerk/react'

type Appearance = NonNullable<ComponentProps<typeof ClerkProvider>['appearance']>

/** Shared by every Clerk surface, including verification and security dialogs. */
export const clerkAppearance = {
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'none',
    helpPageUrl: '/contact',
    termsPageUrl: '/terms',
    privacyPageUrl: '/privacy',
    socialButtonsVariant: 'blockButton',
  },
  variables: {
    colorPrimary: 'var(--color-forest)',
    colorPrimaryForeground: '#ffffff',
    colorForeground: 'var(--color-ink)',
    colorMutedForeground: 'var(--color-muted)',
    colorBackground: 'var(--color-surface)',
    colorMuted: 'var(--color-cream)',
    colorInput: 'var(--color-surface)',
    colorInputForeground: 'var(--color-ink)',
    colorBorder: 'var(--color-border)',
    colorNeutral: 'var(--color-ink)',
    colorDanger: 'var(--color-danger)',
    colorSuccess: 'var(--color-success)',
    colorWarning: 'var(--color-copper)',
    colorRing: 'var(--color-forest)',
    colorShadow: 'var(--color-forest-deep)',
    colorModalBackdrop: 'var(--color-forest-deep)',
    fontFamily: 'var(--font-sans)',
    fontFamilyButtons: 'var(--font-sans)',
    fontSize: '0.9375rem',
    borderRadius: '0.75rem',
    spacing: '1rem',
  },
  elements: {
    rootBox: 'velto-clerk-root',
    cardBox: 'velto-clerk-card-box',
    card: 'velto-clerk-card',
    headerTitle: 'velto-clerk-title',
    headerSubtitle: 'velto-clerk-muted',
    formHeaderTitle: 'velto-clerk-title',
    formFieldLabel: 'velto-clerk-label',
    formFieldInput: 'velto-clerk-input',
    formButtonPrimary: 'velto-clerk-primary',
    formButtonReset: 'velto-clerk-secondary',
    socialButtonsBlockButton: 'velto-clerk-secondary',
    alternativeMethodsBlockButton: 'velto-clerk-secondary',
    formFieldInputShowPasswordButton: 'velto-clerk-icon-button',
    otpCodeFieldInput: 'velto-clerk-code',
    otpCodeFieldInputs: 'velto-clerk-code-row',
    footer: 'velto-clerk-footer',
    footerAction: 'velto-clerk-footer-action',
    footerActionLink: 'velto-clerk-link',
    footerPagesLink: 'velto-clerk-link',
    formResendCodeLink: 'velto-clerk-link',
    backLink: 'velto-clerk-link',
    profileSectionPrimaryButton: 'velto-clerk-secondary',
    profileSectionTitleText: 'velto-clerk-section-title',
    profileSection: 'velto-clerk-section',
    navbar: 'velto-clerk-navbar',
    navbarButton: 'velto-clerk-nav-button',
    navbarMobileMenuButton: 'velto-clerk-secondary',
    pageScrollBox: 'velto-clerk-page',
    scrollBox: 'velto-clerk-scroll',
    userButtonTrigger: 'velto-clerk-avatar-trigger',
    userButtonAvatarBox: 'velto-clerk-avatar',
    userButtonPopoverCard: 'velto-clerk-popover',
    userButtonPopoverActionButton: 'velto-clerk-menu-action',
    userButtonPopoverFooter: 'velto-clerk-footer',
    modalContent: 'velto-clerk-modal',
  },
} satisfies Appearance

/** Authentication is embedded in the VELTO split-panel page; nested steps inherit this theme. */
export const authAppearance = {
  options: { elevation: 'flush' },
  elements: {
    rootBox: 'velto-clerk-root velto-clerk-auth',
    cardBox: 'velto-clerk-card-box velto-clerk-auth-card',
    card: 'velto-clerk-card velto-clerk-auth-card',
  },
} satisfies Appearance

export const profileAppearance = {
  elements: {
    rootBox: 'velto-clerk-root velto-clerk-profile',
    cardBox: 'velto-clerk-card-box velto-clerk-profile-card',
  },
} satisfies Appearance
