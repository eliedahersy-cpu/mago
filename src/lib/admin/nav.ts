export interface AdminNavItem {
  href: string;
  label: string;
  icon:
    | 'home'
    | 'orders'
    | 'products'
    | 'collections'
    | 'inventory'
    | 'customers'
    | 'discounts'
    | 'subscriptions'
    | 'recipes'
    | 'stores'
    | 'reviews'
    | 'analytics'
    | 'settings';
  /** Starts a new group in the sidebar. */
  group?: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Home', icon: 'home' },
  { href: '/admin/orders', label: 'Orders', icon: 'orders' },
  { href: '/admin/products', label: 'Products', icon: 'products' },
  { href: '/admin/collections', label: 'Collections', icon: 'collections' },
  { href: '/admin/inventory', label: 'Inventory', icon: 'inventory' },
  { href: '/admin/customers', label: 'Customers', icon: 'customers' },
  { href: '/admin/discounts', label: 'Discounts', icon: 'discounts' },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: 'subscriptions' },
  { href: '/admin/recipes', label: 'Recipes', icon: 'recipes', group: 'Content' },
  { href: '/admin/stores', label: 'Stores', icon: 'stores' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'reviews' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'analytics', group: 'Insights' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
];

/** Whether a nav link should look current: the dashboard only on /admin itself, sections on their sub-pages too. */
export function isActiveNav(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}
