
import { Order, OrderStatus, Source, MenuItem } from './types';
import { Globe, MessageCircle, Send, Store } from 'lucide-react';

export const SOURCE_ICONS: Record<Source, any> = {
  [Source.WEB]: Globe,
  [Source.WHATSAPP]: MessageCircle,
  [Source.TELEGRAM]: Send,
  [Source.DINE_IN]: Store,
};

export const SOURCE_COLORS: Record<Source, string> = {
  [Source.WEB]: 'text-blue-500 bg-blue-50',
  [Source.WHATSAPP]: 'text-green-600 bg-green-50',
  [Source.TELEGRAM]: 'text-sky-500 bg-sky-50',
  [Source.DINE_IN]: 'text-amber-600 bg-amber-50',
};

export const MOCK_CUSTOMER_NAMES = [
  'Omar Khalid', 'Fatima Al-Sayed', 'Yousef Ahmed', 'Noura Salem', 
  'Abdullah Rashid', 'Huda Ali', 'Zainab Mahmoud', 'Khalid Waleed'
];

export const MOCK_ADDRESSES = [
  'Olaya Street, Building 4', 'King Fahd Rd, Tower 2', 
  'Al Malqa Dist, Villa 12', 'Hittin, Compound 5', 'Al Nakheel, St 10'
];

export const MOCK_MENU_ITEMS_POOL = [
  { name_ar: 'عسل سدر فاخر (1 كجم)', price: 350.0 },
  { name_ar: 'عسل موالح (1 كجم)', price: 120.0 },
  { name_ar: 'عسل حبة البركة (500 جم)', price: 85.0 },
  { name_ar: 'شمع عسل طبيعي', price: 60.0 },
  { name_ar: 'حبوب لقاح', price: 45.0 },
  { name_ar: 'غذاء ملكات', price: 200.0 },
  { name_ar: 'عسل جبلي', price: 400.0 }
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  { 
    item_id: 1, 
    item_name_ar: 'عسل سدر فاخر', 
    category_ar: 'عسل طبيعي', 
    price: 350.00, 
    is_available: true,
    description_ar: 'عسل سدر طبيعي 100% من المناحل الجبلية، مفيد للمناعة والطاقة.'
  },
  { 
    item_id: 2, 
    item_name_ar: 'عسل موالح', 
    category_ar: 'عسل طبيعي', 
    price: 120.00, 
    is_available: true,
    description_ar: 'عسل زهور الموالح، غني بفيتامين سي وطعمه خفيف ومحبب للأطفال.'
  },
  { 
    item_id: 3, 
    item_name_ar: 'شمع عسل (قطعة)', 
    category_ar: 'منتجات الخلية', 
    price: 60.00, 
    is_available: true,
    description_ar: 'شمع عسل طبيعي طازج من الخلية مباشرة.'
  },
  { 
    item_id: 4, 
    item_name_ar: 'عسل حبة البركة', 
    category_ar: 'عسل طبيعي', 
    price: 85.00, 
    is_available: false,
    description_ar: 'عسل نحل مضاف إليه خلاصة حبة البركة لتعزيز الصحة العامة.'
  },
  { 
    item_id: 5, 
    item_name_ar: 'مكسرات بالعسل', 
    category_ar: 'خلطات خاصة', 
    price: 150.00, 
    is_available: true,
    description_ar: 'برطمان مكسرات فاخرة (لوز، كاجو، بندق) مغمورة في عسل السدر.'
  },
  { 
    item_id: 6, 
    item_name_ar: 'غذاء ملكات النحل', 
    category_ar: 'منتجات الخلية', 
    price: 200.00, 
    is_available: true,
    description_ar: 'غذاء ملكات النحل الصافي، مكمل غذائي قوي.'
  }
];

// Fallback/Mock Data (Using new status strings)
export const MOCK_ORDERS: Order[] = [
  {
    order_id: '1001',
    restaurant_id: 3,
    created_at: new Date(),
    status: OrderStatus.PENDING_CONFIRMATION,
    notes: 'تغليف هدية لو سمحت',
    address: '124 Schaefer Estates Apt. 583',
    total_amount: 470.00,
    time_elapsed: '00:02:15',
    is_paid: true,
    customer: {
      customer_id: 'c_01',
      full_name: 'Ahmed Hassan',
      phone_number: '+966 55 123 4567',
      source: Source.WHATSAPP,
      full_address: 'Riyadh, Olaya Dist.'
    },
    items: [
      { item_id: '1', item_name_ar: 'عسل سدر فاخر', quantity: 1, unit_price_at_order: 350.00 },
      { item_id: '2', item_name_ar: 'عسل موالح', quantity: 1, unit_price_at_order: 120.00 }
    ]
  }
];