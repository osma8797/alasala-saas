import { MenuItem } from '@/types';

// Define category order for display (Appetizers FIRST)
export const CATEGORY_ORDER = [
  'appetizers',
  'main',
  'grills',
  'drinks',
] as const;

// Category labels for display
export const CATEGORY_LABELS: Record<string, string> = {
  'appetizers': 'Appetizers',
  'main': 'Main Dishes',
  'grills': 'Grills',
  'drinks': 'Beverages',
};

export const MENU_ITEMS: MenuItem[] = [
  // ============================================
  // APPETIZERS (المقبلات)
  // ============================================
  {
    category: 'appetizers',
    img: '/image/4.JPG',
    title: 'Garden Salad',
    description: 'Fresh seasonal vegetables with zesty lemon dressing',
    price: 15,
    slug: 'salad',
  },
  {
    category: 'appetizers',
    img: '/image/5.JPG',
    title: 'Hummus',
    description: 'Creamy chickpea dip with tahini, olive oil, and warm spices',
    price: 12,
    slug: 'hummus',
  },
  {
    category: 'appetizers',
    img: '/image/7.JPG',
    title: 'Tabbouleh',
    description: 'Fresh parsley salad with bulgur, tomatoes, and mint',
    price: 15,
    slug: 'tabouleh',
  },
  {
    category: 'appetizers',
    img: '/image/8.JPG',
    title: 'Baba Ghanoush',
    description: 'Smoky roasted eggplant blended with tahini and lemon',
    price: 12,
    slug: 'babaghanoush',
  },
  {
    category: 'appetizers',
    img: '/image/9.JPG',
    title: 'Kibbeh',
    description: 'Crispy bulgur shells stuffed with seasoned meat and herbs',
    price: 25,
    slug: 'kibbeh',
  },

  // ============================================
  // MAIN DISHES (الأطباق الرئيسية)
  // ============================================
  {
    category: 'main',
    img: '/image/1.JPG',
    title: 'Fish Rice',
    description: 'Flavorful fish and rice with aromatic spices',
    price: 30,
    slug: 'kabsa',
  },
  {
    category: 'main',
    img: '/image/10.JPG',
    title: 'Lamb Biryani',
    description: 'Fragrant basmati rice layered with spiced lamb',
    price: 35,
    slug: 'biryani',
  },

  // ============================================
  // GRILLS (المشويات)
  // ============================================
  {
    category: 'grills',
    img: '/image/14.JPG',
    title: 'Seafood Mixed Grill',
    description: 'Premium grilled shrimp and calamari with soy dipping sauce',
    price: 45,
    slug: 'grills',
  },
  {
    category: 'grills',
    img: '/image/3.JPG',
    title: 'Lamb Kebab',
    description: 'Succulent lamb skewers with Middle Eastern spices',
    price: 50,
    slug: 'kebab',
  },

  // ============================================
  // BEVERAGES (المشروبات)
  // ============================================
  {
    category: 'drinks',
    img: '/image/11.JPG',
    title: 'Pomegranate Juice',
    description: 'Freshly squeezed, rich in antioxidants',
    price: 10,
    slug: 'pomegranate',
  },
  {
    category: 'drinks',
    img: '/image/12.JPG',
    title: 'Fresh Orange Juice',
    description: '100% natural, squeezed to order',
    price: 10,
    slug: 'orange',
  },
];

// Helper: Get unique categories in correct order
export const getCategories = (): string[] => {
  const uniqueCategories = [...new Set(MENU_ITEMS.map((item) => item.category))];
  return uniqueCategories.sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a as typeof CATEGORY_ORDER[number]);
    const indexB = CATEGORY_ORDER.indexOf(b as typeof CATEGORY_ORDER[number]);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
};

// Helper: Get category label
export const getCategoryLabel = (category: string): string => {
  return CATEGORY_LABELS[category] || category;
};

// Helper: Get items by category
export const getItemsByCategory = (category: string): MenuItem[] => {
  return MENU_ITEMS.filter((item) => item.category === category);
};

export const MENU_CATEGORIES = [
  { id: 'appetizers', label: 'Appetizers' },
  { id: 'main', label: 'Main Dishes' },
  { id: 'grills', label: 'Grills' },
  { id: 'drinks', label: 'Beverages' },
] as const;
