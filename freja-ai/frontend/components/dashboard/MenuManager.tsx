"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Beef, CakeSlice, CupSoda, Drumstick, Pencil, Pizza, Plus, Salad, Sandwich, Save, Soup, Trash2, Utensils, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { money } from "@/lib/utils";
import type { MenuItem } from "@/types";

interface MenuResponse {
  restaurant_name: string;
  menu: MenuItem[];
}

interface MenuFormState {
  name: string;
  category: string;
  standardPrice: string;
  familyPrice: string;
  ingredients: string;
  allergens: string;
  isAvailable: boolean;
  toppings: string;
  sauces: string;
  removableOptions: string;
  halfAndHalf: boolean;
}

const defaultCategories = [
  "Standardpizzor",
  "Specialpizzor",
  "Kebabpizzor",
  "Premium pizzor",
  "Kebab och grill",
  "Tillbehör",
  "Dryck",
  "Dessert",
  "Sallad",
  "Barnmeny",
];

const initialForm: MenuFormState = {
  name: "",
  category: "Standardpizzor",
  standardPrice: "",
  familyPrice: "",
  ingredients: "",
  allergens: "",
  isAvailable: true,
  toppings: "extra cheese",
  sauces: "",
  removableOptions: "no onion",
  halfAndHalf: true,
};

function toOre(value: string) {
  const normalized = Number(value.replace(",", "."));
  return Number.isFinite(normalized) ? Math.round(normalized * 100) : 0;
}

function splitList(value: string) {
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function menuIconFor(item: MenuItem): LucideIcon {
  const text = `${item.name} ${item.category} ${item.description ?? ""}`.toLowerCase();
  if (text.includes("pizza") || text.includes("pizzor") || text.includes("calzone") || text.includes("margherita") || text.includes("vesuvio") || text.includes("capricciosa")) return Pizza;
  if (text.includes("läsk") || text.includes("cola") || text.includes("fanta") || text.includes("sprite") || text.includes("mineralvatten") || text.includes("dryck")) return CupSoda;
  if (text.includes("sallad") || text.includes("vegetaria") || text.includes("vegetarian") || text.includes("vegan")) return Salad;
  if (text.includes("kebab") || text.includes("kött") || text.includes("salami") || text.includes("bacon")) return Beef;
  if (text.includes("kyckling") || text.includes("chicken")) return Drumstick;
  if (text.includes("rulle") || text.includes("bröd") || text.includes("sandwich")) return Sandwich;
  if (text.includes("dessert") || text.includes("tiramisu") || text.includes("kaka")) return CakeSlice;
  if (text.includes("soppa") || text.includes("soup")) return Soup;
  return Utensils;
}

function krFromOre(value: number) {
  return value % 100 === 0 ? String(value / 100) : (value / 100).toFixed(2);
}

function formFromItem(item: MenuItem): MenuFormState {
  const modifiers = item.modifiers ?? {};
  const sizes = modifiers.sizes && typeof modifiers.sizes === "object" && !Array.isArray(modifiers.sizes) ? modifiers.sizes as Record<string, unknown> : {};
  const toppings = modifiers.toppings && typeof modifiers.toppings === "object" && !Array.isArray(modifiers.toppings) ? Object.keys(modifiers.toppings) : [];
  const sauces = modifiers.sauces && typeof modifiers.sauces === "object" && !Array.isArray(modifiers.sauces) ? Object.keys(modifiers.sauces) : [];
  const extras = toppings.filter((option) => !option.toLowerCase().startsWith("no "));
  const removableOptions = toppings.filter((option) => option.toLowerCase().startsWith("no "));
  const familyDelta = Number(sizes.familj ?? 0);
  return {
    name: item.name,
    category: item.category,
    standardPrice: krFromOre(item.base_price),
    familyPrice: familyDelta > 0 ? krFromOre(item.base_price + familyDelta) : "",
    ingredients: item.description ?? "",
    allergens: item.allergens.join(", "),
    isAvailable: item.is_available,
    toppings: extras.join(", "),
    sauces: sauces.join(", "),
    removableOptions: removableOptions.join(", "),
    halfAndHalf: Boolean(modifiers.half_and_half),
  };
}

function payloadFromForm(form: MenuFormState, sortOrder: number) {
  const basePrice = toOre(form.standardPrice);
  const familyPrice = toOre(form.familyPrice);
  const sizes: Record<string, number> = { standard: 0 };
  if (familyPrice > 0 && familyPrice !== basePrice) {
    sizes.familj = Math.max(familyPrice - basePrice, 0);
  }
  const toppings = Object.fromEntries(splitList(form.toppings).map((topping) => [topping, 0]));
  const sauces = Object.fromEntries(splitList(form.sauces).map((sauce) => [sauce, 0]));
  const removableOptions = Object.fromEntries(splitList(form.removableOptions).map((option) => [option, 0]));
  const modifiers: Record<string, unknown> = {
    sizes,
    toppings: { ...toppings, ...removableOptions },
    sauces,
    half_and_half: form.halfAndHalf,
  };
  const description = splitList(form.ingredients).join(", ");
  return {
    name: form.name.trim(),
    category: form.category.trim(),
    base_price: basePrice,
    description,
    is_available: form.isAvailable,
    allergens: splitList(form.allergens),
    modifiers,
    sort_order: sortOrder,
  };
}

export function MenuManager() {
  const client = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MenuFormState>(initialForm);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["dashboard-menu"],
    queryFn: () => api<MenuResponse>("/dashboard/menu"),
    retry: 1,
  });
  const items = useMemo(() => data?.menu ?? [], [data?.menu]);
  const categories = useMemo(() => [...new Set([...defaultCategories, ...items.map((item) => item.category)])].sort(), [items]);

  const toggle = useMutation({
    mutationFn: (item: MenuItem) =>
      api<MenuItem>(`/dashboard/menu/item/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_available: !item.is_available }),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["dashboard-menu"] });
      void client.invalidateQueries({ queryKey: ["agent-menu"] });
    },
  });

  const create = useMutation({
    mutationFn: () => api<MenuItem>("/dashboard/menu/item", { method: "POST", body: JSON.stringify(payloadFromForm(form, items.length + 1)) }),
    onSuccess: () => {
      setForm(initialForm);
      setShowForm(false);
      void client.invalidateQueries({ queryKey: ["dashboard-menu"] });
      void client.invalidateQueries({ queryKey: ["agent-menu"] });
    },
  });

  const update = useMutation({
    mutationFn: (item: MenuItem) =>
      api<MenuItem>(`/dashboard/menu/item/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify(payloadFromForm(form, item.sort_order)),
      }),
    onSuccess: () => {
      setForm(initialForm);
      setEditingItem(null);
      setShowForm(false);
      void client.invalidateQueries({ queryKey: ["dashboard-menu"] });
      void client.invalidateQueries({ queryKey: ["agent-menu"] });
    },
  });

  const remove = useMutation({
    mutationFn: (item: MenuItem) => api<void>(`/dashboard/menu/item/${item.id}`, { method: "DELETE" }),
    onSuccess: () => {
      setForm(initialForm);
      setEditingItem(null);
      setShowForm(false);
      void client.invalidateQueries({ queryKey: ["dashboard-menu"] });
      void client.invalidateQueries({ queryKey: ["agent-menu"] });
    },
  });

  function openCreateForm() {
    setForm(initialForm);
    setEditingItem(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(item: MenuItem) {
    setForm(formFromItem(item));
    setEditingItem(item);
    setFormError(null);
    setShowForm(false);
  }

  function closeForm() {
    setForm(initialForm);
    setEditingItem(null);
    setFormError(null);
    setShowForm(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!form.name.trim() || !form.category.trim() || toOre(form.standardPrice) <= 0) {
      setFormError("Name, category, and standard price are required.");
      return;
    }
    try {
      if (editingItem) {
        payloadFromForm(form, editingItem.sort_order);
        update.mutate(editingItem);
        return;
      }
      payloadFromForm(form, items.length + 1);
      create.mutate();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Invalid menu item form");
    }
  }

  function renderMenuForm(mode: "create" | "edit", density: "wide" | "drawer" = "wide") {
    const isEditing = mode === "edit" && editingItem;
    const gridClass = density === "drawer" ? "grid gap-4" : "grid gap-4 lg:grid-cols-6";
    const twoColClass = density === "drawer" ? "grid gap-1" : "grid gap-1 lg:col-span-2";
    const fourColClass = density === "drawer" ? "grid gap-1" : "grid gap-1 lg:col-span-4";
    const fullColClass = density === "drawer" ? "grid gap-1" : "grid gap-1 lg:col-span-6";
    const checkboxClass = density === "drawer" ? "flex items-center gap-3" : "flex items-center gap-3 lg:col-span-6";
    const actionClass = density === "drawer" ? "flex flex-wrap gap-3" : "flex flex-wrap gap-3 lg:col-span-6";
    const errorClass = density === "drawer" ? "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 lg:col-span-6";
    return (
      <form onSubmit={submit} className={gridClass}>
        <label className={twoColClass}>
          <span className="text-xs font-semibold uppercase text-gray-500">Name</span>
          <input className="rounded-md border border-border bg-white p-2 text-sm text-gray-950" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Pizza name" />
        </label>
        <label className={twoColClass}>
          <span className="text-xs font-semibold uppercase text-gray-500">Category</span>
          <select className="rounded-md border border-border bg-white p-2 text-sm text-gray-950" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase text-gray-500">Price kr</span>
          <input className="rounded-md border border-border bg-white p-2 text-sm text-gray-950" inputMode="decimal" value={form.standardPrice} onChange={(event) => setForm({ ...form, standardPrice: event.target.value })} placeholder="120" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase text-gray-500">Family kr</span>
          <input className="rounded-md border border-border bg-white p-2 text-sm text-gray-950" inputMode="decimal" value={form.familyPrice} onChange={(event) => setForm({ ...form, familyPrice: event.target.value })} placeholder="360" />
        </label>
        <label className={fullColClass}>
          <span className="text-xs font-semibold uppercase text-gray-500">Availability</span>
          <select className="rounded-md border border-border bg-white p-2 text-sm text-gray-950" value={form.isAvailable ? "true" : "false"} onChange={(event) => setForm({ ...form, isAvailable: event.target.value === "true" })}>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </label>
        <label className={fourColClass}>
          <span className="text-xs font-semibold uppercase text-gray-500">Food details / ingredients</span>
          <textarea className="min-h-20 rounded-md border border-border bg-white p-2 text-sm text-gray-950" value={form.ingredients} onChange={(event) => setForm({ ...form, ingredients: event.target.value })} placeholder="Tomatsås, ost, skinka" />
        </label>
        <label className={twoColClass}>
          <span className="text-xs font-semibold uppercase text-gray-500">Allergens</span>
          <input className="rounded-md border border-border bg-white p-2 text-sm text-gray-950" value={form.allergens} onChange={(event) => setForm({ ...form, allergens: event.target.value })} placeholder="gluten, milk" />
        </label>
        <label className={twoColClass}>
          <span className="text-xs font-semibold uppercase text-gray-500">Allowed extras</span>
          <input className="rounded-md border border-border bg-white p-2 text-sm text-gray-950" value={form.toppings} onChange={(event) => setForm({ ...form, toppings: event.target.value })} placeholder="extra cheese, jalapeno" />
        </label>
        <label className={twoColClass}>
          <span className="text-xs font-semibold uppercase text-gray-500">Sauces</span>
          <input className="rounded-md border border-border bg-white p-2 text-sm text-gray-950" value={form.sauces} onChange={(event) => setForm({ ...form, sauces: event.target.value })} placeholder="kebabsås, vitlökssås" />
        </label>
        <label className={twoColClass}>
          <span className="text-xs font-semibold uppercase text-gray-500">Can remove</span>
          <input className="rounded-md border border-border bg-white p-2 text-sm text-gray-950" value={form.removableOptions} onChange={(event) => setForm({ ...form, removableOptions: event.target.value })} placeholder="no onion, no mushrooms" />
        </label>
        <label className={checkboxClass}>
          <input type="checkbox" checked={form.halfAndHalf} onChange={(event) => setForm({ ...form, halfAndHalf: event.target.checked })} />
          <span className="text-sm font-semibold text-gray-700">Allow half-and-half orders for this item</span>
        </label>
        {formError && <div className={errorClass}>{formError}</div>}
        <div className={actionClass}>
          <Button type="submit" disabled={create.isPending || update.isPending}>
            <Save size={16} /> {isEditing ? "Save changes" : "Save item"}
          </Button>
          {isEditing && editingItem && (
            <Button
              type="button"
              className="bg-red-700 text-white hover:bg-red-600"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Remove ${editingItem.name} from the menu? This deletes the item from the database.`)) {
                  remove.mutate(editingItem);
                }
              }}
            >
              <Trash2 size={16} /> Remove item
            </Button>
          )}
          <Button type="button" className="bg-gray-700 text-white hover:bg-gray-600" onClick={closeForm}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Restaurant menu</h2>
          <p className="mt-1 text-sm text-gray-500">Use the availability button on each item to mark it unavailable or available. The voice agent uses the same database.</p>
        </div>
        <Button onClick={() => showForm ? setShowForm(false) : openCreateForm()}>
          <Plus size={16} /> Add menu item
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Add menu item</h3>
            <p className="mt-1 text-sm text-gray-500">Add the food details in plain language. Freja converts these options into the database format used by the voice agent.</p>
          </div>
          {renderMenuForm("create")}
        </Card>
      )}

      {isLoading && <Card className="text-sm text-gray-600">Loading menu...</Card>}
      {isError && (
        <Card className="border-amber-200 bg-amber-50 text-sm text-amber-900">
          Menu data is unavailable. Start the backend on port 8000 to load restaurant menu items from the database.
          <div className="mt-2 text-xs text-amber-800">{error instanceof Error ? error.message : "Unknown request error"}</div>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = menuIconFor(item);
          const isEditing = editingItem?.id === item.id;
          return (
          <Card key={item.id} className={`flex min-h-[320px] flex-col transition ${isEditing ? "border-accent shadow-lg" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-bg text-accent" aria-hidden="true">
                  <Icon size={24} />
                </div>
                <div>
                  <div className="text-lg font-semibold">{item.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-text-2">{item.category}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggle.mutate(item)}
                className={`rounded px-2 py-1 text-xs font-bold transition hover:ring-2 hover:ring-border focus:outline-none focus:ring-2 focus:ring-accent ${item.is_available ? "bg-lime-100 text-lime-900" : "bg-red-100 text-red-800"}`}
                disabled={toggle.isPending}
                aria-label={`Mark ${item.name} as ${item.is_available ? "unavailable" : "available"}`}
              >
                {item.is_available ? "Available" : "Unavailable"}
              </button>
            </div>
            <p className="mt-3 min-h-12 text-sm leading-6 text-text-2">{item.description}</p>
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase text-text-2">Prices / sizes</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(item.size_prices ?? { standard: money(item.base_price) }).map(([size, price]) => (
                  <span key={size} className="rounded border border-border px-2 py-1 font-mono text-xs">
                    {size}: {price}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase text-text-2">Ingredients</div>
              <p className="mt-2 text-sm text-text-2">{(item.ingredients && item.ingredients.length > 0 ? item.ingredients : [item.description ?? "No ingredients listed"]).join(", ")}</p>
            </div>
            <div className="mt-4 text-xs text-text-2">Allergens: {item.allergens.length > 0 ? item.allergens.join(", ") : "none listed"}</div>
            <div className="mt-auto flex items-center justify-end gap-3 pt-4">
              {toggle.isPending && <span className="text-xs font-semibold text-text-2">Updating...</span>}
              <button type="button" onClick={() => openEditForm(item)} className={`inline-flex items-center gap-2 rounded border border-accent px-3 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-accent ${isEditing ? "bg-bg text-accent" : "bg-accent text-bg hover:bg-lime-300"}`}>
                <Pencil size={14} /> {isEditing ? "Editing" : "Update"}
              </button>
            </div>
          </Card>
          );
        })}
      </div>
      {editingItem && (
        <aside
          className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto border-t border-border bg-white p-5 shadow-2xl md:inset-x-auto md:inset-y-0 md:right-0 md:h-dvh md:w-[460px] md:max-h-none md:border-l md:border-t-0"
          aria-label={`Update ${editingItem.name}`}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-text-2">Menu item settings</div>
              <h3 className="mt-1 text-xl font-semibold text-gray-950">Update {editingItem.name}</h3>
              <p className="mt-1 text-sm text-gray-500">Changes save to the database and update what the voice agent can offer.</p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="rounded border border-border p-2 text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Close menu item settings"
            >
              <X size={18} />
            </button>
          </div>
          {renderMenuForm("edit", "drawer")}
        </aside>
      )}
    </div>
  );
}
