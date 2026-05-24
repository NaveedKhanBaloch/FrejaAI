export type LandingLanguage = "sv" | "en";
type TextPair = readonly [string, string];
type TextTriple = readonly [string, string, string];
type FeatureItem = readonly [string, string, string];

export interface LandingCopy {
  nav: { links: readonly TextPair[]; menu: string; close: string };
  hero: { label: string; title: string; subtitle: string; primary: string; secondary: string; stats: readonly TextPair[] };
  phone: { status: string; live: string; transcript: string; words: string[]; language: string; order: string };
  pain: { label: string; title: string; cards: readonly TextTriple[] };
  how: { label: string; title: string; steps: readonly TextPair[]; callout: string };
  features: { label: string; title: string; items: readonly FeatureItem[] };
  comparison: { label: string; title: string; headings: readonly string[]; rows: readonly (readonly string[])[]; callout: string };
  demo: {
    label: string;
    title: string;
    agent: string;
    ready: string;
    connecting: string;
    start: string;
    end: string;
    restart: string;
    description: string;
    connected: string;
    disconnected: string;
    failed: string;
    starting: string;
    timedOut: string;
    confirmedEnded: string;
    conversation: string;
  };
  testimonials: { label: string; title: string; items: readonly TextPair[] };
  pricing: { label: string; title: string; subtitle: string; month: string; popular: string; tiers: readonly (readonly [string, string, string, readonly string[], string])[]; signals: readonly string[] };
  cta: { title: string; subtitle: string; restaurant: string; phone: string; city: string; button: string; direct: string };
  footer: { tagline: string; links: readonly string[]; made: string; rights: string; note: string };
}

export const landingCopy: Record<LandingLanguage, LandingCopy> = {
  en: {
    nav: {
      links: [
        ["Features", "#features"],
        ["Demo", "#demo"],
        ["Dashboard", "/dashboard"],
        ["Pricing", "#pricing"],
        ["Contact", "#contact"],
      ] as const,
      menu: "MENU",
      close: "CLOSE",
    },
    hero: {
      label: "// AI VOICE ORDERING",
      title: "Last Friday you missed 14 calls. That's 14 pizzas you never made.",
      subtitle: "Freja answers every call. Takes the order. Speaks their language. You just cook.",
      primary: "Try the voice demo",
      secondary: "See the dashboard ->",
      stats: [["0", "Missed calls"], ["3", "Languages spoken"], ["31", "Avg order value"]] as const,
    },
    phone: {
      status: "FREJA CALL",
      live: "LIVE",
      transcript: "Live transcript",
      words: "Jag vill ha en stor Margherita med extra ost".split(" "),
      language: "Language: SV",
      order: "Order: parsed",
    },
    pain: {
      label: "// THE PROBLEM",
      title: "Your phone is costing you money every day",
      cards: [
        ["67%", "of customers who can't reach a restaurant on the first try never call back. They order from whoever picks up.", "-> Every unanswered call is a lost customer forever."],
        ["23 times", "The average pizza kitchen phone rings 23 times during a Friday dinner rush. Each call pulls a chef from the oven for 4-6 minutes. Burnt crusts. Late orders. Angry tables.", "-> Your best cook is an accidental call centre agent."],
        ["30%", "Foodora and Wolt take up to 30% commission on every order. You cannot offer half-and-half pizzas, custom crusts, or allergy notes. The customer is theirs, not yours.", "-> You work harder and earn less on every delivery."],
        ["7 languages", "Stockholm alone has customers who speak Swedish, Arabic, Somali, Kurdish, Urdu, Turkish, and English. If your staff can't take that order accurately, you lose the sale, or worse, get it wrong.", "-> A language barrier is a revenue barrier."],
        ["€38,000", "A full-time phone operator costs €38,000 per year in Sweden. They work 8 hours. Your customers call for 14. Evenings, weekends, and public holidays are unguarded.", "-> You're paying for coverage you're not getting."],
        ["1 in 8", "One in eight phone orders contains an error: wrong size, missing modifier, wrong address. Each mistake costs a remake, a refund, or a one-star review.", "-> Errors compound. Reviews are permanent."],
      ] as const,
    },
    how: {
      label: "// HOW IT WORKS",
      title: "A phone call. Handled perfectly. Every time.",
      steps: [
        ["Customer calls", "Vonage receives the call instantly"],
        ["Freja answers", "Greets in the customer's language within 1s"],
        ["Order is taken", "Customisations, modifiers, allergies, all captured"],
        ["Order confirmed", "Freja reads back the order, confirms total"],
        ["Kitchen notified", "Ticket appears on kitchen display in real time"],
        ["You cook", "No interruptions. No mistakes. No missed calls."],
      ] as const,
      callout: "\"If Freja can't handle it, she transfers to your staff instantly. You're always in control.\"",
    },
    features: {
      label: "// FEATURES",
      title: "Built for the chaos of a real pizza kitchen",
      items: [
        ["◎", "Multilingual by default", "Swedish. Arabic. Somali. Turkish. Urdu. Kurdish. English. Freja auto-detects the language and responds natively. No configuration needed."],
        ["≡", "Unlimited customisation", "Half-and-half pizzas. Extra cheese on one half. No onion. Gluten-free crust. Freja handles modifier trees that no delivery platform supports."],
        ["✓", "Zero missed calls", "Freja handles concurrent calls simultaneously. Rush hour on a Friday night? Every caller gets answered. Every order gets taken."],
        ["▦", "Kitchen display", "Orders appear on the kitchen screen the moment they're confirmed: structured, clean, prioritised by time. No paper, no shouting."],
        ["↗", "Human handoff", "If a customer is frustrated or the request is complex, Freja transfers the call to your staff instantly with a full transcript so nothing is repeated."],
        ["⌁", "Call recordings + transcripts", "Every call recorded and transcribed. Review disputes, train staff, and audit orders at any time from your dashboard."],
        ["↟", "Analytics dashboard", "See your busiest hours, most ordered items, missed call recovery rate, and AI confidence scores. Make better decisions with real data."],
        ["▣", "Peace of mind", "Freja never has a bad day. Never forgets an order. Never puts a customer on hold for 8 minutes. She's there before your first chef arrives."],
      ] as const,
    },
    comparison: {
      label: "// VS. THE ALTERNATIVES",
      title: "Why not just use Foodora or hire another person?",
      headings: ["Feature", "Manual Staff", "Foodora/Wolt", "Other AI", "FREJA AI"] as const,
      rows: [
        ["Available 24/7", "✗", "✓", "✓", "✓"],
        ["Zero commission", "✓", "✗", "✓", "✓"],
        ["Half-and-half pizza", "✓", "✗", "✗", "✓"],
        ["Allergy customisation", "✓", "✗", "✗", "✓"],
        ["7 languages", "✗", "✗", "✗", "✓"],
        ["Concurrent calls", "✗", "✓", "✓", "✓"],
        ["Your customer data", "✓", "✗", "✓", "✓"],
        ["Instant kitchen display", "✗", "✓", "✓", "✓"],
        ["Call recordings", "✗", "✗", "✗", "✓"],
        ["Cost per month", "€3,200+", "30% fee", "€199+", "€89/mo"],
      ] as const,
      callout: "\"Foodora keeps your customer's data. You keep the food and the bill.\"",
    },
    demo: {
      label: "// LIVE DEMO",
      title: "Hear Freja take a real order",
      agent: "ElevenLabs agent: Pizza Palazzo",
      ready: "Ready",
      connecting: "Connecting...",
      start: "Tap to place a call",
      end: "End call",
      restart: "Start a new ElevenLabs call",
      description: "This uses ElevenLabs for the live voice call while Freja displays the transcript and sends confirmed orders into the dashboard.",
      connected: "Connected. Freja is listening.",
      disconnected: "Disconnected",
      failed: "Connection failed",
      starting: "Starting ElevenLabs session...",
      timedOut: "Connection timed out",
      confirmedEnded: "Order confirmed. Call ended.",
      conversation: "Conversation",
    },
    testimonials: {
      label: "// TRUSTED BY",
      title: "Pizza shops across Stockholm and Malmö already switched",
      items: [
        ["We were missing 20-30 calls every weekend. Freja handles them all. We've added one full pizza shift worth of revenue every Saturday.", "Ahmad K., owner, Pizza Sultanen, Malmö"],
        ["My chef was answering phones during the dinner rush. Now he cooks. Simple as that. The Arabic support alone is worth everything.", "Lars-Erik S., owner, Medelhavs Pizza, Göteborg"],
        ["Foodora was taking 28% of every delivery. We switched to Freja and our own delivery driver. We kept 100% and the customer data.", "Fatima O., owner, Palazzo 54, Stockholm"],
      ] as const,
    },
    pricing: {
      label: "// PRICING",
      title: "One flat fee. No commission. No surprises.",
      subtitle: "Compare that to what Foodora charged you last month.",
      month: "/ month",
      popular: "MOST POPULAR",
      tiers: [
        ["STARTER", "kr 890", "For single-location pizza shops", ["1 phone line", "Up to 500 calls/month", "Swedish + English", "Dashboard access", "Email support"], "Get started ->"],
        ["PRO", "kr 1,490", "For busy restaurants and chains", ["3 phone lines (concurrent calls)", "Unlimited calls", "All 7 languages", "Full dashboard + analytics", "Menu admin panel", "Call recordings + transcripts", "Priority support"], "Get started ->"],
        ["ENTERPRISE", "Custom pricing", "For restaurant groups + franchises", ["Unlimited lines", "Multi-location dashboard", "White-label voice (your brand voice)", "POS integration", "Dedicated onboarding", "SLA guarantee"], "Contact sales ->"],
      ] as const,
      signals: ["✓ No setup fee", "✓ Cancel anytime", "✓ GDPR compliant", "✓ 14-day free trial", "✓ No Foodora. No commission."] as const,
    },
    cta: {
      title: "\"Stop losing customers to a ringing phone.\"",
      subtitle: "Book a 20-minute demo. We'll show you Freja live on your own menu, in your language, on your number.",
      restaurant: "Restaurant name",
      phone: "Your phone number",
      city: "City",
      button: "Book free demo ->",
      direct: "or call us directly: +46 10 123 45 67",
    },
    footer: {
      tagline: "AI Voice Ordering for Nordic Restaurants",
      links: ["Features", "Demo", "Pricing", "Privacy Policy", "GDPR", "Contact"] as const,
      made: "Made in Stockholm",
      rights: "© 2025 Freja AI AB. All rights reserved.",
      note: "Freja AI is GDPR-compliant. All call recordings are encrypted. Customer data is never shared with third parties.",
    },
  },
  sv: {
    nav: {
      links: [
        ["Funktioner", "#features"],
        ["Demo", "#demo"],
        ["Dashboard", "/dashboard"],
        ["Priser", "#pricing"],
        ["Kontakt", "#contact"],
      ] as const,
      menu: "MENY",
      close: "STÄNG",
    },
    hero: {
      label: "// AI-RÖSTBESTÄLLNING",
      title: "Förra fredagen missade du 14 samtal. Det är 14 pizzor du aldrig bakade.",
      subtitle: "Freja svarar på varje samtal. Tar beställningen. Talar kundens språk. Du lagar maten.",
      primary: "Testa röstdemon",
      secondary: "Se dashboarden ->",
      stats: [["0", "Missade samtal"], ["3", "Talade språk"], ["31", "Genomsnittligt ordervärde"]] as const,
    },
    phone: {
      status: "FREJA-SAMTAL",
      live: "LIVE",
      transcript: "Live-transkript",
      words: "Jag vill ha en stor Margherita med extra ost".split(" "),
      language: "Språk: SV",
      order: "Order: tolkad",
    },
    pain: {
      label: "// PROBLEMET",
      title: "Din telefon kostar dig pengar varje dag",
      cards: [
        ["67%", "av kunder som inte når en restaurang på första försöket ringer aldrig tillbaka. De beställer från den som svarar.", "-> Varje obesvarat samtal kan vara en förlorad kund."],
        ["23 gånger", "Under en fredagsrush ringer telefonen i ett genomsnittligt pizzakök 23 gånger. Varje samtal drar bort en kock från ugnen i 4-6 minuter. Brända kanter. Sena beställningar. Arga gäster.", "-> Din bästa kock blir ofrivillig telefonist."],
        ["30%", "Foodora och Wolt tar upp till 30% provision på varje order. Du kan inte erbjuda halv-halv-pizzor, egna kanter eller tydliga allerginoter. Kunden är deras, inte din.", "-> Du jobbar hårdare och tjänar mindre på varje leverans."],
        ["7 språk", "Bara Stockholm har kunder som talar svenska, arabiska, somaliska, kurdiska, urdu, turkiska och engelska. Om personalen inte kan ta ordern rätt tappar du försäljningen, eller får den fel.", "-> En språkbarriär är en intäktsbarriär."],
        ["€38 000", "En heltidsanställd telefonist kostar cirka €38 000 per år i Sverige. Personen arbetar 8 timmar. Dina kunder ringer i 14. Kvällar, helger och röda dagar blir oskyddade.", "-> Du betalar för täckning du inte får."],
        ["1 av 8", "En av åtta telefonbeställningar innehåller ett fel: fel storlek, missad ändring eller fel adress. Varje misstag kostar en ny pizza, återbetalning eller dåligt omdöme.", "-> Fel växer. Omdömen stannar kvar."],
      ] as const,
    },
    how: {
      label: "// SÅ FUNGERAR DET",
      title: "Ett telefonsamtal. Perfekt hanterat. Varje gång.",
      steps: [
        ["Kunden ringer", "Vonage tar emot samtalet direkt"],
        ["Freja svarar", "Hälsar på kundens språk inom 1 sekund"],
        ["Ordern tas", "Anpassningar, ändringar och allergier fångas upp"],
        ["Ordern bekräftas", "Freja läser upp ordern och bekräftar totalen"],
        ["Köket meddelas", "Ordern visas på köksskärmen i realtid"],
        ["Du lagar maten", "Inga avbrott. Inga misstag. Inga missade samtal."],
      ] as const,
      callout: "\"Om Freja inte kan hantera ärendet kopplar hon direkt till personalen. Du har alltid kontroll.\"",
    },
    features: {
      label: "// FUNKTIONER",
      title: "Byggd för kaoset i ett riktigt pizzakök",
      items: [
        ["◎", "Flerspråkig från start", "Svenska. Arabiska. Somaliska. Turkiska. Urdu. Kurdiska. Engelska. Freja känner automatiskt av språket och svarar naturligt."],
        ["≡", "Obegränsad anpassning", "Halv-halv-pizzor. Extra ost på ena halvan. Ingen lök. Glutenfri botten. Freja hanterar val som vanliga leveransplattformar inte klarar."],
        ["✓", "Noll missade samtal", "Freja hanterar flera samtal samtidigt. Fredagsrush? Varje kund får svar. Varje order tas emot."],
        ["▦", "Köksskärm", "Beställningar visas i köket direkt när de bekräftas: strukturerat, tydligt och prioriterat efter tid."],
        ["↗", "Mänsklig överlämning", "Om kunden är frustrerad eller ärendet är komplext kopplar Freja till personalen med full transkript så inget behöver upprepas."],
        ["⌁", "Inspelningar och transkript", "Varje samtal spelas in och transkriberas. Granska tvister, utbilda personal och kontrollera beställningar från dashboarden."],
        ["↟", "Analysdashboard", "Se rusningstider, mest beställda varor, räddade samtal och AI-säkerhet. Ta bättre beslut med riktig data."],
        ["▣", "Trygghet", "Freja har aldrig en dålig dag. Glömmer aldrig en order. Låter aldrig kunden vänta i 8 minuter."],
      ] as const,
    },
    comparison: {
      label: "// JÄMFÖRT MED ALTERNATIVEN",
      title: "Varför inte bara använda Foodora eller anställa en person?",
      headings: ["Funktion", "Personal", "Foodora/Wolt", "Annan AI", "FREJA AI"] as const,
      rows: [
        ["Tillgänglig 24/7", "✗", "✓", "✓", "✓"],
        ["Ingen provision", "✓", "✗", "✓", "✓"],
        ["Halv-halv-pizza", "✓", "✗", "✗", "✓"],
        ["Allergianpassning", "✓", "✗", "✗", "✓"],
        ["7 språk", "✗", "✗", "✗", "✓"],
        ["Flera samtal samtidigt", "✗", "✓", "✓", "✓"],
        ["Din kunddata", "✓", "✗", "✓", "✓"],
        ["Direkt köksskärm", "✗", "✓", "✓", "✓"],
        ["Samtalsinspelningar", "✗", "✗", "✗", "✓"],
        ["Kostnad per månad", "€3 200+", "30% avgift", "€199+", "€89/mån"],
      ] as const,
      callout: "\"Foodora behåller kunddatan. Du behåller maten och intäkten.\"",
    },
    demo: {
      label: "// LIVEDEMO",
      title: "Hör Freja ta en riktig beställning",
      agent: "ElevenLabs-agent: Pizza Palazzo",
      ready: "Redo",
      connecting: "Ansluter...",
      start: "Tryck för att ringa",
      end: "Avsluta samtal",
      restart: "Starta ett nytt ElevenLabs-samtal",
      description: "Detta använder ElevenLabs för live-samtalet medan Freja visar transkriptet och skickar bekräftade beställningar till dashboarden.",
      connected: "Ansluten. Freja lyssnar.",
      disconnected: "Frånkopplad",
      failed: "Anslutningen misslyckades",
      starting: "Startar ElevenLabs-session...",
      timedOut: "Anslutningen tog för lång tid",
      confirmedEnded: "Order bekräftad. Samtalet avslutat.",
      conversation: "Konversation",
    },
    testimonials: {
      label: "// BETRODD AV",
      title: "Pizzerior i Stockholm och Malmö har redan bytt",
      items: [
        ["Vi missade 20-30 samtal varje helg. Freja tar dem alla. Vi har lagt till nästan ett helt pizzapass i intäkter varje lördag.", "Ahmad K., ägare, Pizza Sultanen, Malmö"],
        ["Min kock svarade i telefon under middagsrusningen. Nu lagar han mat. Så enkelt är det. Arabiskan är värd allt.", "Lars-Erik S., ägare, Medelhavs Pizza, Göteborg"],
        ["Foodora tog 28% av varje leverans. Vi bytte till Freja och egen förare. Vi behöll 100% och kunddatan.", "Fatima O., ägare, Palazzo 54, Stockholm"],
      ] as const,
    },
    pricing: {
      label: "// PRISER",
      title: "En fast avgift. Ingen provision. Inga överraskningar.",
      subtitle: "Jämför det med vad Foodora tog av dig förra månaden.",
      month: "/ månad",
      popular: "MEST POPULÄR",
      tiers: [
        ["STARTER", "kr 890", "För enskilda pizzerior", ["1 telefonlinje", "Upp till 500 samtal/månad", "Svenska + engelska", "Dashboard", "E-postsupport"], "Kom igång ->"],
        ["PRO", "kr 1 490", "För trafikerade restauranger och kedjor", ["3 telefonlinjer samtidigt", "Obegränsade samtal", "Alla 7 språk", "Dashboard + analys", "Menyadmin", "Inspelningar + transkript", "Prioriterad support"], "Kom igång ->"],
        ["ENTERPRISE", "Anpassat pris", "För restauranggrupper och franchiser", ["Obegränsade linjer", "Dashboard för flera platser", "Varumärkesröst", "POS-integration", "Dedikerad onboarding", "SLA-garanti"], "Kontakta sälj ->"],
      ] as const,
      signals: ["✓ Ingen startavgift", "✓ Avsluta när som helst", "✓ GDPR-kompatibel", "✓ 14 dagars gratis test", "✓ Ingen Foodora. Ingen provision."] as const,
    },
    cta: {
      title: "\"Sluta tappa kunder till en ringande telefon.\"",
      subtitle: "Boka en 20-minutersdemo. Vi visar Freja live med din meny, på ditt språk och på ditt nummer.",
      restaurant: "Restaurangens namn",
      phone: "Ditt telefonnummer",
      city: "Stad",
      button: "Boka gratis demo ->",
      direct: "eller ring oss direkt: +46 10 123 45 67",
    },
    footer: {
      tagline: "AI-röstbeställning för nordiska restauranger",
      links: ["Funktioner", "Demo", "Priser", "Integritetspolicy", "GDPR", "Kontakt"] as const,
      made: "Byggt i Stockholm",
      rights: "© 2025 Freja AI AB. Alla rättigheter förbehållna.",
      note: "Freja AI är GDPR-kompatibel. Alla samtalsinspelningar är krypterade. Kunddata delas aldrig med tredje part.",
    },
  },
};
