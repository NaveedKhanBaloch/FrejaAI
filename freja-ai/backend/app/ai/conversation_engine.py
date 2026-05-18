from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum

from app.ai.intent_classifier import wants_human_handoff
from app.ai.prompts.language_prompts import greeting_for


class ConversationStateName(str, Enum):
    GREETING = "GREETING"
    LANGUAGE_DETECT = "LANGUAGE_DETECT"
    ORDER_TYPE = "ORDER_TYPE"
    MENU_SELECTION = "MENU_SELECTION"
    ITEM_CUSTOMIZATION = "ITEM_CUSTOMIZATION"
    DELIVERY_INFO = "DELIVERY_INFO"
    ORDER_SUMMARY = "ORDER_SUMMARY"
    CONFIRMATION = "CONFIRMATION"
    COMPLETED = "COMPLETED"
    HUMAN_HANDOFF = "HUMAN_HANDOFF"
    ESCALATION = "ESCALATION"


@dataclass(slots=True)
class ConversationContext:
    language: str = "en"
    order_type: str | None = None
    delivery_address: str | None = None
    failed_attempts: dict[ConversationStateName, int] = field(default_factory=dict)


@dataclass(slots=True)
class StateResult:
    response: str
    next_state: ConversationStateName
    action: str | None = None


class State(ABC):
    name: ConversationStateName

    async def enter(self, context: ConversationContext) -> str:
        return ""

    @abstractmethod
    async def handle_input(self, text: str, context: ConversationContext) -> StateResult:
        raise NotImplementedError

    async def exit(self, context: ConversationContext) -> None:
        return None

    def misunderstood(self, context: ConversationContext) -> StateResult:
        attempts = context.failed_attempts.get(self.name, 0) + 1
        context.failed_attempts[self.name] = attempts
        if attempts >= 3:
            return StateResult("Let me connect you to our staff.", ConversationStateName.HUMAN_HANDOFF, "transfer_to_human")
        return StateResult("Could you repeat that more clearly?", self.name)


class GreetingState(State):
    name = ConversationStateName.GREETING

    async def enter(self, context: ConversationContext) -> str:
        return greeting_for(context.language)

    async def handle_input(self, text: str, context: ConversationContext) -> StateResult:
        return StateResult("", ConversationStateName.LANGUAGE_DETECT)


class LanguageDetectState(State):
    name = ConversationStateName.LANGUAGE_DETECT

    async def handle_input(self, text: str, context: ConversationContext) -> StateResult:
        return StateResult("Is this for pickup or delivery?", ConversationStateName.ORDER_TYPE)


class OrderTypeState(State):
    name = ConversationStateName.ORDER_TYPE

    async def handle_input(self, text: str, context: ConversationContext) -> StateResult:
        normalized = text.lower()
        if any(word in normalized for word in ("delivery", "deliver", "hemleverans", "leverans")):
            context.order_type = "delivery"
            return StateResult("Great. What would you like to order?", ConversationStateName.MENU_SELECTION)
        if any(word in normalized for word in ("pickup", "collect", "takeaway", "avhämtning")):
            context.order_type = "pickup"
            return StateResult("Great. What would you like to order?", ConversationStateName.MENU_SELECTION)
        return self.misunderstood(context)


class MenuSelectionState(State):
    name = ConversationStateName.MENU_SELECTION

    async def handle_input(self, text: str, context: ConversationContext) -> StateResult:
        if len(text.strip()) < 3:
            return self.misunderstood(context)
        return StateResult("Which size, crust, or toppings would you like?", ConversationStateName.ITEM_CUSTOMIZATION)


class ItemCustomizationState(State):
    name = ConversationStateName.ITEM_CUSTOMIZATION

    async def handle_input(self, text: str, context: ConversationContext) -> StateResult:
        normalized = text.lower()
        if "done" in normalized or "that's all" in normalized or "klart" in normalized:
            if context.order_type == "delivery":
                return StateResult("What delivery address should we use?", ConversationStateName.DELIVERY_INFO)
            return StateResult("I will read back your order now.", ConversationStateName.ORDER_SUMMARY)
        if len(text.strip()) < 2:
            return self.misunderstood(context)
        return StateResult("Got it. Anything else?", ConversationStateName.MENU_SELECTION)


class DeliveryInfoState(State):
    name = ConversationStateName.DELIVERY_INFO

    async def handle_input(self, text: str, context: ConversationContext) -> StateResult:
        if len(text.strip()) < 8:
            return self.misunderstood(context)
        context.delivery_address = text.strip()
        return StateResult("Thank you. I will read back your order now.", ConversationStateName.ORDER_SUMMARY)


class OrderSummaryState(State):
    name = ConversationStateName.ORDER_SUMMARY

    async def handle_input(self, text: str, context: ConversationContext) -> StateResult:
        return StateResult("Do you confirm this order?", ConversationStateName.CONFIRMATION)


class ConfirmationState(State):
    name = ConversationStateName.CONFIRMATION

    async def handle_input(self, text: str, context: ConversationContext) -> StateResult:
        normalized = text.lower()
        if any(word in normalized for word in ("yes", "confirm", "correct", "ja")):
            return StateResult("Your order is confirmed. Thank you.", ConversationStateName.COMPLETED, "confirm_order")
        if any(word in normalized for word in ("no", "change", "nej")):
            return StateResult("What would you like to change?", ConversationStateName.MENU_SELECTION)
        return self.misunderstood(context)


class TerminalState(State):
    def __init__(self, name: ConversationStateName) -> None:
        self.name = name

    async def handle_input(self, text: str, context: ConversationContext) -> StateResult:
        return StateResult("", self.name)


class ConversationEngine:
    def __init__(self, context: ConversationContext | None = None) -> None:
        self.context = context or ConversationContext()
        self.current_state = ConversationStateName.GREETING
        self._states: dict[ConversationStateName, State] = {
            ConversationStateName.GREETING: GreetingState(),
            ConversationStateName.LANGUAGE_DETECT: LanguageDetectState(),
            ConversationStateName.ORDER_TYPE: OrderTypeState(),
            ConversationStateName.MENU_SELECTION: MenuSelectionState(),
            ConversationStateName.ITEM_CUSTOMIZATION: ItemCustomizationState(),
            ConversationStateName.DELIVERY_INFO: DeliveryInfoState(),
            ConversationStateName.ORDER_SUMMARY: OrderSummaryState(),
            ConversationStateName.CONFIRMATION: ConfirmationState(),
            ConversationStateName.COMPLETED: TerminalState(ConversationStateName.COMPLETED),
            ConversationStateName.HUMAN_HANDOFF: TerminalState(ConversationStateName.HUMAN_HANDOFF),
            ConversationStateName.ESCALATION: TerminalState(ConversationStateName.ESCALATION),
        }

    async def start(self) -> str:
        return await self._states[self.current_state].enter(self.context)

    async def handle_input(self, text: str) -> StateResult:
        if wants_human_handoff(text):
            self.current_state = ConversationStateName.HUMAN_HANDOFF
            return StateResult("Let me connect you to our staff.", self.current_state, "transfer_to_human")
        state = self._states[self.current_state]
        result = await state.handle_input(text, self.context)
        await state.exit(self.context)
        self.current_state = result.next_state
        return result
