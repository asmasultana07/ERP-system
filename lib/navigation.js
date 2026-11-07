export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/customers", label: "Customers" },
  { href: "/purchases", label: "Purchases" },
  { href: "/sales", label: "Sales" },
  { href: "/expenses", label: "Expenses" },
];

export function getPageTitle(pathname) {
  const match = NAV_ITEMS.find((item) => item.href === pathname);
  return match ? match.label : "VENDORA";
}
