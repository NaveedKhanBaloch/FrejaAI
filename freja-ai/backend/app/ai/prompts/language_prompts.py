LANGUAGE_NAMES: dict[str, str] = {
    "sv": "Swedish",
    "en": "English",
    "ar": "Arabic",
    "tr": "Turkish",
    "ur": "Urdu",
    "ku": "Kurdish",
    "so": "Somali",
}

LANGUAGE_GREETING: dict[str, str] = {
    "sv": "Hej, välkommen. Vill du beställa för avhämtning eller leverans?",
    "en": "Hello, welcome. Is your order for pickup or delivery?",
    "ar": "مرحبا، أهلا بك. هل طلبك للاستلام أم للتوصيل؟",
    "tr": "Merhaba, hoş geldiniz. Siparişiniz paket mi teslimat mı?",
    "ur": "سلام، خوش آمدید۔ آپ کا آرڈر پک اپ ہے یا ڈیلیوری؟",
    "ku": "Silav, hûn bi xêr hatin. Fermana we ji bo girtinê ye an gihandinê?",
    "so": "Salaan, soo dhawoow. Dalabkaagu ma qaadasho baa mise geyn?",
}


def greeting_for(language: str) -> str:
    return LANGUAGE_GREETING.get(language, LANGUAGE_GREETING["en"])
