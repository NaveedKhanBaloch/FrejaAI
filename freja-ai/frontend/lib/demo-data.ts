export type OrderStatus = "PREPARING" | "READY" | "DELIVERED" | "COMPLETED";
export type OrderType = "Delivery" | "Pickup";
export type MenuCategory = "Pizzas" | "Drinks" | "Sides" | "Desserts";

export interface DemoOrder {
  id: string;
  time: string;
  items: string;
  type: OrderType;
  total: string;
  status: OrderStatus;
  detail: string;
  address: string;
  transcript: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: MenuCategory;
  prices: { s: number; m: number; l: number };
  allergens: string[];
  modifiers: string[];
  available: boolean;
}

export const painCards = [
  ["67%", "of customers who can't reach a restaurant on the first try never call back. They order from whoever picks up.", "→ Every unanswered call is a lost customer forever."],
  ["23 times", "The average pizza kitchen phone rings 23 times during a Friday dinner rush. Each call pulls a chef from the oven for 4–6 minutes. Burnt crusts. Late orders. Angry tables.", "→ Your best cook is an accidental call centre agent."],
  ["30%", "Foodora and Wolt take up to 30% commission on every order. You cannot offer half-and-half pizzas, custom crusts, or allergy notes. The customer is theirs — not yours.", "→ You work harder and earn less on every delivery."],
  ["7 languages", "Stockholm alone has customers who speak Swedish, Arabic, Somali, Kurdish, Urdu, Turkish, and English. If your staff can't take that order accurately, you lose the sale — or worse, get it wrong.", "→ A language barrier is a revenue barrier."],
  ["€38,000", "A full-time phone operator costs €38,000 per year in Sweden. They work 8 hours. Your customers call for 14. Evenings, weekends, and public holidays are unguarded.", "→ You're paying for coverage you're not getting."],
  ["1 in 8", "One in eight phone orders contains an error — wrong size, missing modifier, wrong address. Each mistake costs a remake, a refund, or a one-star review.", "→ Errors compound. Reviews are permanent."],
] as const;

export const orders: DemoOrder[] = [
  { id: "#0041", time: "14:28", items: "Kebabpizza ×2", type: "Delivery", total: "kr 298", status: "PREPARING", detail: "Two large Kebabpizza, garlic sauce, no onion.", address: "Sankt Eriksgatan 18, Stockholm", transcript: "Customer requested delivery, two Kebabpizza, garlic sauce, no onion." },
  { id: "#0040", time: "14:19", items: "Margherita L", type: "Pickup", total: "kr 139", status: "READY", detail: "Large Margherita, extra basil.", address: "Pickup counter", transcript: "Customer confirmed pickup in 20 minutes." },
  { id: "#0039", time: "14:07", items: "Half-Half + Cola", type: "Delivery", total: "kr 178", status: "DELIVERED", detail: "Large half Margherita, half Vesuvio, extra cheese, one cola.", address: "Drottninggatan 42, Stockholm", transcript: "Freja confirmed address and total before placing order." },
  { id: "#0038", time: "13:52", items: "Quattro Stagioni", type: "Pickup", total: "kr 149", status: "COMPLETED", detail: "Medium Quattro Stagioni, gluten-free crust.", address: "Pickup counter", transcript: "Customer asked about gluten-free crust and confirmed." },
  { id: "#0037", time: "13:31", items: "Vesuvio ×3", type: "Delivery", total: "kr 417", status: "COMPLETED", detail: "Three medium Vesuvio, sliced.", address: "Möllevångstorget 9, Malmö", transcript: "Customer switched to delivery after hearing ETA." },
  { id: "#0036", time: "13:14", items: "Margherita M", type: "Pickup", total: "kr 109", status: "COMPLETED", detail: "Medium Margherita.", address: "Pickup counter", transcript: "Simple pickup order completed in Swedish." },
];

export const menuItems: MenuItem[] = [
  { id: "m1", name: "Margherita", description: "Tomato, mozzarella, fresh basil", category: "Pizzas", prices: { s: 89, m: 109, l: 139 }, allergens: ["gluten", "dairy"], modifiers: ["extra cheese", "gluten-free crust", "fresh basil"], available: true },
  { id: "m2", name: "Vesuvio", description: "Tomato, mozzarella, smoked ham", category: "Pizzas", prices: { s: 99, m: 119, l: 149 }, allergens: ["gluten", "dairy"], modifiers: ["extra ham", "no onion", "thin crust"], available: true },
  { id: "m3", name: "Kebabpizza", description: "Kebab, onion, tomato, garlic sauce", category: "Pizzas", prices: { s: 119, m: 149, l: 179 }, allergens: ["gluten", "dairy"], modifiers: ["mild sauce", "hot sauce", "no onion"], available: true },
  { id: "m4", name: "Quattro Stagioni", description: "Ham, mushrooms, olives, artichoke", category: "Pizzas", prices: { s: 109, m: 129, l: 159 }, allergens: ["gluten", "dairy"], modifiers: ["extra olives", "no mushrooms"], available: true },
  { id: "m5", name: "Cola", description: "33cl can", category: "Drinks", prices: { s: 25, m: 25, l: 25 }, allergens: [], modifiers: ["ice cold"], available: true },
  { id: "m6", name: "Garlic Bread", description: "Oven baked with parsley", category: "Sides", prices: { s: 45, m: 59, l: 75 }, allergens: ["gluten", "dairy"], modifiers: ["extra garlic"], available: true },
  { id: "m7", name: "Tiramisu", description: "House dessert", category: "Desserts", prices: { s: 69, m: 69, l: 69 }, allergens: ["dairy", "egg"], modifiers: ["cocoa"], available: true },
];

export const hourlyData = [
  { hour: "11:00", calls: 12, orders: 7 },
  { hour: "12:00", calls: 31, orders: 22 },
  { hour: "13:00", calls: 28, orders: 19 },
  { hour: "14:00", calls: 18, orders: 12 },
  { hour: "15:00", calls: 14, orders: 9 },
  { hour: "16:00", calls: 19, orders: 13 },
  { hour: "17:00", calls: 27, orders: 18 },
  { hour: "18:00", calls: 43, orders: 31 },
  { hour: "19:00", calls: 51, orders: 38 },
  { hour: "20:00", calls: 39, orders: 28 },
  { hour: "21:00", calls: 22, orders: 15 },
  { hour: "22:00", calls: 11, orders: 7 },
];

export const languageData = [
  { name: "Swedish", value: 58 },
  { name: "Arabic", value: 19 },
  { name: "Somali", value: 11 },
  { name: "English", value: 8 },
  { name: "Other", value: 4 },
];

export const orderTypeData = [
  { name: "Delivery", value: 64 },
  { name: "Pickup", value: 36 },
];

export const topItems = [
  ["1.", "Kebabpizza L", "38", "kr 5,282", "1.4"],
  ["2.", "Margherita L", "31", "kr 4,309", "0.8"],
  ["3.", "Vesuvio M", "24", "kr 2,616", "1.1"],
  ["4.", "Half-Half L", "22", "kr 3,058", "2.7"],
] as const;
