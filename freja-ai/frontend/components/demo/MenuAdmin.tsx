"use client";

import { useState } from "react";
import { create } from "zustand";
import { MenuCategory, MenuItem, menuItems } from "@/lib/demo-data";

interface MenuStore {
  items: MenuItem[];
  update: (item: MenuItem) => void;
  toggle: (id: string) => void;
  add: (item: MenuItem) => void;
}

export const useMenuStore = create<MenuStore>((set) => ({
  items: menuItems,
  update: (item) => set((state) => ({ items: state.items.map((entry) => (entry.id === item.id ? item : entry)) })),
  toggle: (id) => set((state) => ({ items: state.items.map((item) => (item.id === id ? { ...item, available: !item.available } : item)) })),
  add: (item) => set((state) => ({ items: [item, ...state.items] })),
}));

const categories: MenuCategory[] = ["Pizzas", "Drinks", "Sides", "Desserts"];

export function MenuAdmin() {
  const { items, toggle, update, add } = useMenuStore();
  const [category, setCategory] = useState<MenuCategory>("Pizzas");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const visible = items.filter((item) => item.category === category);

  function emptyItem(): MenuItem {
    return { id: `new-${Date.now()}`, name: "", description: "", category, prices: { s: 89, m: 109, l: 139 }, allergens: [], modifiers: [], available: true };
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      <aside className="border border-border bg-bg p-4">
        <div className="mb-4 font-mono text-xs uppercase text-text-3">Categories</div>
        {categories.map((entry) => (
          <button key={entry} onClick={() => setCategory(entry)} className={`mb-2 block w-full border px-3 py-3 text-left ${category === entry ? "border-accent text-accent" : "border-border text-text-2"}`}>
            {entry} <span className="font-mono text-xs">({items.filter((item) => item.category === entry).length})</span>
          </button>
        ))}
      </aside>
      <div className="relative min-h-[560px]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold">{category}</h3>
          <button onClick={() => setEditing(emptyItem())} className="bg-accent px-4 py-3 font-bold text-bg">+ Add Item</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <article key={item.id} className="border border-border bg-surface p-5">
              <h4 className="text-xl font-bold">{item.name}</h4>
              <p className="mt-2 min-h-12 text-sm leading-6 text-text-2">{item.description}</p>
              <p className="mt-5 font-mono text-sm">S: kr {item.prices.s} | M: {item.prices.m} | L: {item.prices.l}</p>
              <div className="mt-5 flex gap-2">
                <button onClick={() => toggle(item.id)} className={`flex-1 border px-3 py-2 text-sm ${item.available ? "border-accent text-accent" : "border-danger text-danger"}`}>● {item.available ? "Available" : "Unavailable"}</button>
                <button onClick={() => setEditing(item)} className="border border-border px-3 py-2 text-sm">Edit</button>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-6 border border-accent bg-accent/10 p-5 text-text-1">
          Freja learns your menu instantly. Change a price at 6pm — she quotes the new price by 6:01pm.
        </div>
        {editing && <EditPanel item={editing} onCancel={() => setEditing(null)} onSave={(item) => { items.some((entry) => entry.id === item.id) ? update(item) : add(item); setEditing(null); }} />}
      </div>
    </div>
  );
}

function EditPanel({ item, onSave, onCancel }: { item: MenuItem; onSave: (item: MenuItem) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<MenuItem>(item);
  const allergens = ["gluten", "dairy", "nuts", "egg"];

  return (
    <div className="absolute inset-y-0 right-0 w-full max-w-md border border-accent bg-bg p-5 shadow-2xl md:w-[420px]">
      <h3 className="text-2xl font-bold">Edit menu item</h3>
      <div className="mt-5 grid gap-3">
        <input className="border border-border bg-surface p-3" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Item name" />
        <textarea className="min-h-24 border border-border bg-surface p-3" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Description" />
        <select className="border border-border bg-surface p-3" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as MenuCategory })}>{categories.map((entry) => <option key={entry}>{entry}</option>)}</select>
        <div className="grid grid-cols-3 gap-2">
          {(["s", "m", "l"] as const).map((size) => <input key={size} className="border border-border bg-surface p-3" type="number" value={draft.prices[size]} onChange={(event) => setDraft({ ...draft, prices: { ...draft.prices, [size]: Number(event.target.value) } })} aria-label={`${size} price`} />)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {allergens.map((allergen) => (
            <label key={allergen} className="border border-border p-3 text-sm">
              <input className="mr-2" type="checkbox" checked={draft.allergens.includes(allergen)} onChange={(event) => setDraft({ ...draft, allergens: event.target.checked ? [...draft.allergens, allergen] : draft.allergens.filter((entry) => entry !== allergen) })} />
              {allergen}
            </label>
          ))}
        </div>
        <input className="border border-border bg-surface p-3" value={draft.modifiers.join(", ")} onChange={(event) => setDraft({ ...draft, modifiers: event.target.value.split(",").map((entry) => entry.trim()).filter(Boolean) })} placeholder="Toppings/modifiers" />
        <label className="border border-border p-3"><input className="mr-2" type="checkbox" checked={draft.available} onChange={(event) => setDraft({ ...draft, available: event.target.checked })} />Available</label>
        <button className="bg-accent p-3 font-bold text-bg" onClick={() => onSave(draft)}>Save Changes</button>
        <button className="border border-border p-3 text-text-2" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
