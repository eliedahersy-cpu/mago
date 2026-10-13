export interface AdminNavItem {
  href: string;
  label: string;
  icon: 'home' | 'orders' | 'products' | 'collections' | 'inventory' | 'customers' | 'discounts' | 'analytics' | 'settings';
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Home', icon: 'home' },
  { href: '/admin/orders', label: 'Orders', icon: 'orders' },
  { href: '/admin/products', label: 'Products', icon: 'products' },
  { href: '/admin/collections', label: 'Collections', icon: 'collections' },
  { href: '/admin/inventory', label: 'Inventory', icon: 'inventory' },
  { href: '/admin/customers', label: 'Customers', icon: 'customers' },
  { href: '/admin/discounts', label: 'Discounts', icon: 'discounts' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
];

/** Whether a nav link should look current: the dashboard only on /admin itself, sections on their sub-pages too. */
export function isActiveNav(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}
