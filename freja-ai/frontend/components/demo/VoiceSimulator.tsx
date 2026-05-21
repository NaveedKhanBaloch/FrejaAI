"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useVoiceStore, type DemoOrderTicket } from "@/lib/voice-simulator";

const ELEVENLABS_AGENT_ID = "agent_4201krxdkbgvf8vamjt6gkwbe5fe";

interface ToolResult {
  ticket?: DemoOrderTicket;
  [key: string]: unknown;
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-16 items-end justify-center gap-1" aria-hidden>
      {Array.from({ length: 24 }, (_, index) => (
        <span
          key={index}
          className={`wave-bar w-2 bg-accent ${active ? "" : "[animation-play-state:paused] opacity-30"}`}
          style={{ height: `${14 + ((index * 13) % 44)}px`, animationDelay: `${index * 30}ms` }}
        />
      ))}
    </div>
  );
}

function stringifyToolResult(result: unknown) {
  return JSON.stringify(result, null, 0);
}

function isLocalBrowserOrigin() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

export function VoiceSimulator() {
  const { lines, reset, addLine, completeOrder } = useVoiceStore();
  const ticketReady = useVoiceStore((state) => state.ticketReady);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Ready");
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const connectTimerRef = useRef<number | null>(null);
  const clientOrderIdRef = useRef<string | null>(null);
  const lastMessageRef = useRef<{ role: "user" | "agent"; text: string; at: number } | null>(null);

  const getMenu = useCallback(async () => {
    const result = await api<ToolResult>("/elevenlabs/tools/menu");
    return stringifyToolResult(result);
  }, []);

  const validateItem = useCallback(async (parameters: Record<string, unknown>) => {
    const modifiers: Record<string, unknown> = typeof parameters.modifiers === "object" && parameters.modifiers !== null ? { ...parameters.modifiers } : {};
    const size = parameters.size ?? parameters.Size ?? parameters.item_size ?? parameters.itemSize;
    if (typeof size === "string" && size.trim()) modifiers.size = size;
    const result = await api<ToolResult>("/elevenlabs/tools/validate-item", {
      method: "POST",
      body: JSON.stringify({
        item_name: String(parameters.item_name ?? parameters.itemName ?? parameters.name ?? ""),
        quantity: Number(parameters.quantity ?? 1),
        size: typeof size === "string" ? size : undefined,
        modifiers,
      }),
    });
    return stringifyToolResult(result);
  }, []);

  const confirmOrder = useCallback(
    async (parameters: Record<string, unknown>) => {
      const order = typeof parameters.order === "object" && parameters.order !== null ? { ...parameters.order } as Record<string, unknown> : { ...parameters };
      order.clientOrderId = clientOrderIdRef.current ?? `freja-demo-${Date.now()}`;
      order.customerName = order.customerName ?? order.customer_name ?? parameters.customerName ?? parameters.customer_name;
      order.customerPhone = order.customerPhone ?? order.customer_phone ?? order.customerPhoneNumber ?? parameters.customerPhone ?? parameters.customer_phone;
      const result = await api<ToolResult>("/elevenlabs/tools/confirm-order", {
        method: "POST",
        body: JSON.stringify({ order }),
      });
      if (result.ticket) completeOrder(result.ticket);
      return stringifyToolResult(result);
    },
    [completeOrder],
  );

  const handoffToHuman = useCallback(async () => {
    const result = await api<ToolResult>("/elevenlabs/tools/handoff", { method: "POST", body: JSON.stringify({}) });
    return stringifyToolResult(result);
  }, []);

  const conversation = useConversation({
    clientTools: {
      get_menu: getMenu,
      validate_item: validateItem,
      confirm_order: confirmOrder,
      handoff_to_human: handoffToHuman,
    },
    onConnect: ({ conversationId: id }) => {
      if (connectTimerRef.current !== null) {
        window.clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
      setConversationId(id);
      setConnecting(false);
      setStatusMessage("Connected. Freja is listening.");
    },
    onDisconnect: () => {
      if (connectTimerRef.current !== null) {
        window.clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
      setConversationId(null);
      setConnecting(false);
      setStatusMessage("Disconnected");
    },
    onError: (message) => {
      if (connectTimerRef.current !== null) {
        window.clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
      setError(typeof message === "string" ? message : "ElevenLabs voice agent failed.");
      setConnecting(false);
      setStatusMessage("Connection failed");
    },
    onMessage: ({ message, role }) => {
      const text = message.trim();
      if (!text) return;
      const now = window.performance.now();
      const last = lastMessageRef.current;
      if (last?.role === role && last.text === text && now - last.at < 2500) return;
      lastMessageRef.current = { role, text, at: now };
      addLine({ speaker: role === "agent" ? "Freja" : "Customer", text });
    },
  });

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [lines.length, error]);

  useEffect(() => {
    return () => {
      if (connectTimerRef.current !== null) window.clearTimeout(connectTimerRef.current);
    };
  }, []);

  function startCall() {
    setError(null);
    setConnecting(true);
    setConversationId(null);
    setStatusMessage("Starting ElevenLabs session...");
    reset();
    try {
      clientOrderIdRef.current = `voice-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      if (!window.isSecureContext && !isLocalBrowserOrigin()) {
        throw new Error(`Microphone access requires HTTPS. Current origin is ${window.location.origin}. Open http://localhost:3000 or https://freja.plenware.cloud.`);
      }
      conversation.startSession({
        agentId: ELEVENLABS_AGENT_ID,
        connectionType: "websocket",
        userId: `freja-demo-${Date.now()}`,
        dynamicVariables: {
          restaurant_name: "Pizza Palazzo",
          backend_tools: "get_menu, validate_item, confirm_order, handoff_to_human",
        },
      });
      connectTimerRef.current = window.setTimeout(() => {
        if (conversation.status !== "connected") {
          setConnecting(false);
          setError("ElevenLabs did not connect within 15 seconds. Check that the agent is public/authentication disabled and localhost is allowed.");
          setStatusMessage("Connection timed out");
          conversation.endSession();
        }
      }, 15000);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Voice session failed.");
      setConnecting(false);
      setStatusMessage("Connection failed");
      conversation.endSession();
    }
  }

  function stopCall() {
    if (connectTimerRef.current !== null) {
      window.clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    }
    conversation.endSession();
    setConnecting(false);
    setStatusMessage("Disconnected");
  }

  const connected = conversation.status === "connected";
  const active = connecting || connected || conversation.isSpeaking || conversation.isListening;

  useEffect(() => {
    if (!ticketReady || conversation.status !== "connected") return;
    const timer = window.setTimeout(() => {
      conversation.endSession();
      setStatusMessage("Order confirmed. Call ended.");
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [conversation, ticketReady]);

  return (
    <div className="mx-auto w-full max-w-[375px] border border-border bg-surface p-4">
      <div className="mb-4 h-2 bg-bg">
        <div className="h-full bg-accent transition-all" style={{ width: connected ? "72%" : lines.length > 0 ? "100%" : "0%" }} />
      </div>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="font-mono text-xs text-text-2">ElevenLabs agent: Pizza Palazzo</span>
        <span className={`h-2 w-2 rounded-full ${connected ? "bg-accent pulse-dot" : "bg-text-3"}`} />
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[11px] uppercase text-text-3">
        <span>{statusMessage}</span>
        <span>{conversation.status}</span>
      </div>
      <div className={active ? "py-8" : "py-8 [animation:ring_180ms_ease-in-out_infinite]"}>
        <Waveform active={active} />
      </div>
      <div ref={transcriptRef} className="scrollbar-hidden h-[330px] overflow-y-auto border border-border bg-bg p-3" aria-live="polite">
        {lines.length === 0 && (
          <div className="mt-12 text-center">
            <p className="mb-5 text-sm leading-6 text-text-2">
              This uses ElevenLabs for the live voice call while Freja displays the transcript and sends confirmed orders into the kitchen display.
            </p>
            <button className="w-full bg-accent px-4 py-4 font-bold text-bg disabled:opacity-60" onClick={startCall} disabled={connecting || connected}>
              {connecting ? "Connecting..." : "Tap to place a call"}
            </button>
          </div>
        )}
        {lines.map((line, index) => (
          <div key={index} className={`mb-3 flex ${line.speaker === "Freja" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[86%] rounded-card p-3 text-sm leading-6 ${line.speaker === "Freja" ? "bg-accent/15 text-text-1" : "bg-surface text-text-2"}`}>{line.text}</div>
          </div>
        ))}
        {error && <div className="mt-4 border border-danger bg-danger/10 p-3 text-sm text-danger">{error}</div>}
        {conversation.message && !error && <div className="mt-4 border border-border bg-surface p-3 text-sm text-text-2">{conversation.message}</div>}
      </div>
      <div className="mt-4 grid gap-2">
        {connected || connecting ? (
          <button onClick={stopCall} className="border border-danger px-3 py-3 text-sm text-danger">
            End call
          </button>
        ) : (
          lines.length > 0 && (
            <button onClick={startCall} className="border border-accent px-3 py-3 text-sm text-accent">
              Start a new ElevenLabs call
            </button>
          )
        )}
        {conversationId && <p className="truncate font-mono text-[11px] text-text-3">Conversation {conversationId}</p>}
      </div>
    </div>
  );
}
