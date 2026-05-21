"use client";

import { create } from "zustand";

export type VoiceStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type Speaker = "Freja" | "Customer";

export interface ConversationLine {
  speaker: Speaker;
  text: string;
}

export interface DemoOrderItem {
  id?: string;
  name?: string;
  quantity?: number;
  size?: string;
  toppings?: string[];
  modifiers?: string[] | Record<string, unknown>;
  notes?: string;
  total_price?: number;
}

export interface DemoOrderTicket {
  id: string;
  type: string;
  items: Array<string | DemoOrderItem>;
  address: string | null;
  eta: string;
  total: string;
}

export interface VoiceScriptStep {
  step: VoiceStep;
  freja?: string;
  customer?: string;
  buttons?: string[];
}

export const swedishScript: VoiceScriptStep[] = [
  { step: 0 },
  { step: 1, freja: "Hej! Välkommen till Pizza Palazzo. Vill du beställa för avhämtning eller leverans?" },
  { step: 2, customer: "Leverans tack.", buttons: ["Leverans 🛵", "Avhämtning 🏃", "Delivery (EN)"] },
  { step: 3, freja: "Perfekt! Vad får det lov att vara? Vi har Margherita, Vesuvio, Quattro Stagioni, och vår Kebabpizza." },
  { step: 4, customer: "En stor half-and-half — Margherita på ena halvan, Vesuvio på andra. Extra ost.", buttons: ["Margherita", "Vesuvio", "Half & Half", "Kebabpizza"] },
  { step: 5, freja: "En stor pizza, hälften Margherita, hälften Vesuvio, med extra ost på hela pizzan. Stämmer det?" },
  { step: 6, customer: "Ja, perfekt.", buttons: ["Ja, perfekt ✓", "Ändra något"] },
  { step: 7, freja: "Toppen! Vad är leveransadressen?" },
  { step: 8 },
  { step: 9, freja: "Jättebra. Din beställning: En stor half-and-half — Margherita och Vesuvio — med extra ost. Leverans till Drottninggatan 42. Totalt 159 kronor. Beräknad leveranstid: 25–35 minuter. Tack!" },
  { step: 10 },
];

export const englishScript: VoiceScriptStep[] = [
  { step: 0 },
  { step: 1, freja: "Hi! Welcome to Pizza Palazzo. Is your order for pickup or delivery?" },
  { step: 2, customer: "Delivery please.", buttons: ["Delivery", "Pickup", "Svenska"] },
  { step: 3, freja: "Perfect. What would you like? We have Margherita, Vesuvio, Quattro Stagioni, and Kebabpizza." },
  { step: 4, customer: "One large half-and-half — Margherita on one half, Vesuvio on the other. Extra cheese.", buttons: ["Margherita", "Vesuvio", "Half & Half", "Kebabpizza"] },
  { step: 5, freja: "One large pizza, half Margherita, half Vesuvio, with extra cheese on the whole pizza. Is that correct?" },
  { step: 6, customer: "Yes, perfect.", buttons: ["Yes, perfect ✓", "Change something"] },
  { step: 7, freja: "Great. What is the delivery address?" },
  { step: 8 },
  { step: 9, freja: "Great. Your order: One large half-and-half — Margherita and Vesuvio — with extra cheese. Delivery to Drottninggatan 42. Total 159 kronor. Estimated delivery: 25–35 minutes. Thank you!" },
  { step: 10 },
];

interface VoiceStore {
  step: VoiceStep;
  language: "sv" | "en";
  lines: ConversationLine[];
  address: string;
  ticketReady: boolean;
  orderTicket: DemoOrderTicket | null;
  callStartedAt: number | null;
  begin: () => void;
  choose: (text: string) => void;
  advanceAfterFreja: () => void;
  submitAddress: (address: string) => void;
  addLine: (line: ConversationLine) => void;
  markCallStarted: () => void;
  completeOrder: (order: DemoOrderTicket) => void;
  replayEnglish: () => void;
  reset: () => void;
}

function scriptFor(language: "sv" | "en") {
  return language === "sv" ? swedishScript : englishScript;
}

export const useVoiceStore = create<VoiceStore>((set, get) => ({
  step: 0,
  language: "sv",
  lines: [],
  address: "Drottninggatan 42, Stockholm",
  ticketReady: false,
  orderTicket: null,
  callStartedAt: null,
  begin: () => {
    const step = scriptFor(get().language)[1];
    set({ step: 1, lines: [{ speaker: "Freja", text: step.freja ?? "" }], ticketReady: false, orderTicket: null, callStartedAt: Date.now() });
  },
  choose: (text) => {
    const current = get();
    if (text === "Delivery (EN)") {
      const script = scriptFor("en");
      set({
        language: "en",
        step: 3,
        lines: [
          ...current.lines,
          { speaker: "Customer", text: "Delivery please." },
          { speaker: "Freja", text: script.find((item) => item.step === 3)?.freja ?? "" },
        ],
      });
      return;
    }
    const script = scriptFor(current.language);
    const active = script.find((item) => item.step === current.step);
    const customer = active?.customer ?? text;
    const nextStep = (current.step + 1) as VoiceStep;
    const next = script.find((item) => item.step === nextStep);
    const additions: ConversationLine[] = [{ speaker: "Customer", text: customer }];
    if (next?.freja) additions.push({ speaker: "Freja", text: next.freja });
    set({ step: nextStep, lines: [...current.lines, ...additions] });
  },
  advanceAfterFreja: () => {
    const current = get();
    const nextStepByFrejaStep: Partial<Record<VoiceStep, VoiceStep>> = {
      1: 2,
      3: 4,
      5: 6,
      7: 8,
    };
    const nextStep = nextStepByFrejaStep[current.step];
    if (!nextStep) return;
    set({ step: nextStep });
  },
  submitAddress: (address) => {
    const current = get();
    const summary = scriptFor(current.language).find((item) => item.step === 9);
    set({
      address,
      step: 10,
      ticketReady: true,
      orderTicket: {
        id: "#0042",
        type: "DELIVERY",
        items: ["1× LARGE HALF-AND-HALF", "½ Margherita / ½ Vesuvio", "+ Extra cheese (whole)"],
        address,
        eta: "25–35 min",
        total: "kr 159",
      },
      lines: [
        ...current.lines,
        { speaker: "Customer", text: address },
        { speaker: "Freja", text: summary?.freja?.replace("Drottninggatan 42", address.split(",")[0]) ?? "" },
      ],
    });
  },
  addLine: (line) => set((state) => ({ lines: [...state.lines, line] })),
  markCallStarted: () => set({ callStartedAt: Date.now(), ticketReady: false, orderTicket: null }),
  completeOrder: (order) =>
    set({
      step: 10,
      ticketReady: true,
      orderTicket: order,
      address: order.address ?? "Pickup counter",
    }),
  replayEnglish: () => set({ step: 0, language: "en", lines: [], ticketReady: false, orderTicket: null, callStartedAt: null, address: "Drottninggatan 42, Stockholm" }),
  reset: () => set({ step: 0, language: "sv", lines: [], ticketReady: false, orderTicket: null, callStartedAt: null, address: "Drottninggatan 42, Stockholm" }),
}));
