HUMAN_HANDOFF_PHRASES = {"agent", "person", "human", "operator", "staff", "människa", "personal"}


def wants_human_handoff(text: str) -> bool:
    normalized = text.lower()
    return any(phrase in normalized for phrase in HUMAN_HANDOFF_PHRASES)
