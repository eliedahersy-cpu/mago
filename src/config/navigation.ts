export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: 'Our Cups', href: '/shop' },
  { label: 'Mix & Match', href: '/mix-box' },
  { label: 'Find Your Match', href: '/find-your-match' },
  { label: 'Recipes', href: '/recipes' },
  { label: 'Our Story', href: '/our-story' },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: 'Shop',
    items: [
      { label: 'All Cups', href: '/shop' },
      { label: 'Mix & Match', href: '/mix-box' },
      { label: 'Gifts', href: '/mix-box' },
      { label: 'Subscriptions', href: '/subscribe' },
      { label: 'Find a store', href: '/stores' },
      { label: 'My shopping list', href: '/shopping-list' },
    ],
  },
  {
    title: 'About',
    items: [
      { label: 'Our Story', href: '/our-story' },
      { label: 'Our Ingredients', href: '/ingredients' },
      { label: 'Sustainability', href: '/sustainability' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    title: 'Help',
    items: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Shipping & Delivery', href: '/shipping' },
      { label: 'Returns', href: '/returns' },
      { label: 'Terms & Conditions', href: '/terms' },
    ],
  },
];
