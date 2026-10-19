/** URL guards for CMS links/images. Kept free of zod so the storefront bundle does not pull in validation code. */
export const safeLink = (value: string) => value === '' || (/^\/(?!\/)/.test(value) && !/[\\\s\u0000-\u001f]/.test(value)) || /^#[a-zA-Z][\w-]*$/.test(value) || /^https:\/\/[^\s\\]+$/.test(value) || /^(mailto:[^\s@]+@[^\s@]+|tel:\+?[0-9 ()-]+)$/.test(value)
export const safeImage = (value: string) => value === '' || (/^\/(?!\/)/.test(value) && !/[\\\s\u0000-\u001f]/.test(value)) || /^https:\/\/[^\s\\]+$/.test(value)
