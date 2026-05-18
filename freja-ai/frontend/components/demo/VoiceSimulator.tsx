"use client";

import { useEffect, useRef, useState } from "react";
import { useVoiceStore, type DemoOrderTicket } from "@/lib/voice-simulator";

type DemoEvent =
  | { type: "assistant"; assistant_text: string; audio_base64?: string; audio_mime?: string; call_ended?: boolean }
  | { type: "transcript"; text: string; is_final: boolean; speech_final?: boolean; confidence: number; language?: string | null }
  | { type: "order"; order: DemoOrderTicket }
  | { type: "error"; message: string };

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-16 items-end justify-center gap-1" aria-hidden>
      {Array.from({ length: 24 }, (_, index) => (
        <span key={index} className={`wave-bar w-2 bg-accent ${active ? "" : "[animation-play-state:paused] opacity-30"}`} style={{ height: `${14 + ((index * 13) % 44)}px`, animationDelay: `${index * 30}ms` }} />
      ))}
    </div>
  );
}

function base64ToBlob(base64: string, mimeType: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

export function VoiceSimulator() {
  const { lines, reset, addLine, completeOrder } = useVoiceStore();
  const [recording, setRecording] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const assistantSpeakingRef = useRef(false);
  const lastAssistantRef = useRef<{ text: string; at: number } | null>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [lines.length, error]);

  async function startCall() {
    setError(null);
    setConnecting(true);
    reset();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const wsBase = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";
      const socket = new WebSocket(`${wsBase}/demo/voice/ws`);
      socket.binaryType = "arraybuffer";
      socketRef.current = socket;
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: "start" }));
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
        const recorder = new MediaRecorder(stream, { mimeType });
        recorderRef.current = recorder;
        recorder.ondataavailable = async (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN && !assistantSpeakingRef.current) {
            socket.send(await event.data.arrayBuffer());
          }
        };
        recorder.start(250);
        setRecording(true);
        setConnecting(false);
      };
      socket.onmessage = (event) => handleServerEvent(JSON.parse(String(event.data)) as DemoEvent);
      socket.onerror = () => setError("Voice demo connection failed. Check backend and API keys.");
      socket.onclose = () => setRecording(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Microphone permission failed.");
      setConnecting(false);
      stopCall();
    }
  }

  function handleServerEvent(event: DemoEvent) {
    if (event.type === "transcript" && event.is_final) {
      addLine({ speaker: "Customer", text: event.text });
      return;
    }
    if (event.type === "assistant") {
      const normalizedText = event.assistant_text.trim().toLowerCase();
      const now = window.performance.now();
      const lastAssistant = lastAssistantRef.current;
      if (lastAssistant?.text === normalizedText && now - lastAssistant.at < 4000) return;
      lastAssistantRef.current = { text: normalizedText, at: now };
      addLine({ speaker: "Freja", text: event.assistant_text });
      void playAssistantAudio(event.audio_base64, event.audio_mime, Boolean(event.call_ended));
      return;
    }
    if (event.type === "order") {
      completeOrder(event.order);
      return;
    }
    if (event.type === "error") {
      setError(event.message);
    }
  }

  function stopCall() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    assistantSpeakingRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: "stop" }));
    socketRef.current?.close();
    socketRef.current = null;
    setRecording(false);
    setConnecting(false);
  }

  async function playAssistantAudio(audioBase64: string | undefined, audioMime: string | undefined, endAfterPlayback: boolean) {
    if (!audioBase64) {
      if (endAfterPlayback) stopCall();
      return;
    }
    const blob = base64ToBlob(audioBase64, audioMime ?? "audio/mpeg");
    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);
    audioRef.current?.pause();
    audioRef.current = audio;
    assistantSpeakingRef.current = true;
    try {
      await audio.play();
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
      if (audioRef.current === audio) audioRef.current = null;
      assistantSpeakingRef.current = false;
      if (endAfterPlayback) stopCall();
    }
  }

  return (
    <div className="mx-auto w-full max-w-[375px] border border-border bg-surface p-4">
      <div className="mb-4 h-2 bg-bg"><div className="h-full bg-accent transition-all" style={{ width: recording ? "62%" : lines.length > 0 ? "100%" : "0%" }} /></div>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="font-mono text-xs text-text-2">Real AI call: Pizza Palazzo</span>
        <span className={`h-2 w-2 rounded-full ${recording ? "bg-accent pulse-dot" : "bg-text-3"}`} />
      </div>
      <div className={recording ? "py-8" : "py-8 [animation:ring_180ms_ease-in-out_infinite]"}>
        <Waveform active={recording || connecting} />
      </div>
      <div ref={transcriptRef} className="scrollbar-hidden h-[330px] overflow-y-auto border border-border bg-bg p-3" aria-live="polite">
        {lines.length === 0 && (
          <div className="mt-16 text-center">
            <p className="mb-5 text-sm leading-6 text-text-2">This uses your microphone, Deepgram STT, OpenAI with your system prompt, and ElevenLabs voice output.</p>
            <button className="w-full bg-accent px-4 py-4 font-bold text-bg disabled:opacity-60" onClick={startCall} disabled={connecting}>
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
      </div>
      <div className="mt-4 grid gap-2">
        {recording ? (
          <button onClick={stopCall} className="border border-danger px-3 py-3 text-sm text-danger">End call</button>
        ) : (
          lines.length > 0 && <button onClick={startCall} className="border border-accent px-3 py-3 text-sm text-accent">Start a new real call</button>
        )}
      </div>
    </div>
  );
}
