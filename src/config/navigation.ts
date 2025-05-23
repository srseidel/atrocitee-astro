export interface NavLink {
  href: string;
  label: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}

export const mainNavLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/about#impact', label: 'Impact' },
];

export const authNavLinks: NavLink[] = [
  { href: '/account', label: 'My Account', requiresAuth: true },
  { href: '/account/orders', label: 'My Orders', requiresAuth: true },
  { href: '/admin/dashboard', label: 'Admin', requiresAuth: true, requiresAdmin: true },
];

export const footerNavLinks = {
  shop: [
    { href: '/shop', label: 'All Products' },
    { href: '/shop/new', label: 'New Arrivals' },
    { href: '/shop/bestsellers', label: 'Bestsellers' },
  ],
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/about#impact', label: 'Our Impact' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms-of-service', label: 'Terms of Service' },
  ],
}; 