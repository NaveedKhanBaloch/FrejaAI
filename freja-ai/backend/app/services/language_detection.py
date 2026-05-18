from langdetect import DetectorFactory, detect_langs

from app.config import get_settings
from app.services.call_session import CallSessionStore

DetectorFactory.seed = 42
SUPPORTED_LANGUAGES = {"sv", "en", "ar", "tr", "ur", "ku", "so"}
LANGUAGE_LOCK_TURNS = 2

URDU_CHARS = set("ٹڈڑگپچژںیئےہھ")
ARABIC_HINTS = {"مرحبا", "أريد", "اريد", "طلب", "توصيل", "استلام", "شكرا"}
URDU_HINTS = {"سلام", "مجھے", "چاہیے", "آرڈر", "ڈیلیوری", "پک", "اپ", "شکریہ", "ہے", "کیا"}
ROMAN_URDU_HINTS = {"mujhe", "chahiye", "chaiye", "aap", "mera", "meri", "dena", "dijiye", "shukriya", "krna", "karna"}
TURKISH_HINTS = {"merhaba", "sipariş", "teslimat", "paket", "istiyorum", "teşekkür", "lutfen", "lütfen"}
KURDISH_HINTS = {"silav", "spas", "dixwazim", "fermane", "gihandin", "wergirtin"}
SOMALI_HINTS = {"salaan", "mahadsanid", "dalab", "geyn", "qaadasho", "rabaa", "pizza ayaan"}
SWEDISH_HINTS = {"hej", "tack", "jag vill", "leverans", "avhämtning", "beställa", "stor", "ost"}
ENGLISH_HINTS = {"hello", "thanks", "delivery", "pickup", "i want", "i would like", "order"}


def normalize_language(language: str | None) -> str | None:
    if not language:
        return None
    code = language.replace("_", "-").split("-")[0].lower()
    return code if code in SUPPORTED_LANGUAGES else None


def detect_supported_language(utterance: str, stt_language: str | None, stt_confidence: float, threshold: float) -> str:
    language = normalize_language(stt_language) if stt_language and stt_confidence >= threshold else None
    if language is not None:
        return language
    return fallback_language(utterance)


def fallback_language(utterance: str) -> str:
    heuristic = _heuristic_language(utterance)
    if heuristic is not None:
        return heuristic
    try:
        candidates = detect_langs(utterance)
    except Exception:
        return "en"
    for candidate in candidates:
        language = normalize_language(candidate.lang)
        if language:
            return language
    return "en"


def _heuristic_language(utterance: str) -> str | None:
    normalized = utterance.casefold()
    words = set(normalized.replace("?", " ").replace(".", " ").replace(",", " ").split())
    if any(char in URDU_CHARS for char in utterance) or any(hint in utterance for hint in URDU_HINTS):
        return "ur"
    if any(hint in normalized for hint in ROMAN_URDU_HINTS):
        return "ur"
    if any(hint in utterance for hint in ARABIC_HINTS):
        return "ar"
    if any(hint in normalized for hint in TURKISH_HINTS):
        return "tr"
    if any(hint in normalized for hint in KURDISH_HINTS):
        return "ku"
    if any(hint in normalized for hint in SOMALI_HINTS):
        return "so"
    if any(hint in normalized for hint in SWEDISH_HINTS):
        return "sv"
    if words & ENGLISH_HINTS or any(hint in normalized for hint in ENGLISH_HINTS):
        return "en"
    return None


class LanguageDetectionService:
    def __init__(self, session_store: CallSessionStore | None = None) -> None:
        self._settings = get_settings()
        self._sessions = session_store or CallSessionStore()

    async def detect(self, call_uuid: str, utterance: str, stt_language: str | None, stt_confidence: float) -> str:
        session = await self._sessions.get(call_uuid)
        locked_language = normalize_language(session.get("language_locked"))
        if locked_language is not None:
            return locked_language

        language = detect_supported_language(
            utterance,
            stt_language,
            stt_confidence,
            self._settings.language_confidence_threshold,
        )
        turns = int(session.get("language_detection_turns", "0")) + 1
        candidates = [candidate for candidate in str(session.get("language_candidates", "")).split(",") if candidate]
        candidates.append(language)
        updates: dict[str, str] = {
            "detected_language": language,
            "language_detection_turns": str(turns),
            "language_candidates": ",".join(candidates[-LANGUAGE_LOCK_TURNS:]),
        }
        if turns >= LANGUAGE_LOCK_TURNS:
            updates["language_locked"] = self._majority_language(candidates[-LANGUAGE_LOCK_TURNS:])
            updates["detected_language"] = updates["language_locked"]
        await self._sessions.update(call_uuid, **updates)
        return updates["detected_language"]

    def _majority_language(self, candidates: list[str]) -> str:
        counts = {language: candidates.count(language) for language in set(candidates)}
        return max(counts, key=lambda language: (counts[language], candidates.index(language)))
