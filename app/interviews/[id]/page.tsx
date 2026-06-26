"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Mic, Type as TypeIcon, Video } from "lucide-react";
import {
  answerInterview,
  finishInterview,
  getInterview,
  type InterviewDetail,
} from "@/lib/api/client";
import { cn } from "@/lib/cn";

// Minimal typing for the browser Web Speech API (not in standard DOM lib types).
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type Msg = { role: string; content: string };
type Mode = "text" | "voice" | "video";

const MODES: { key: Mode; label: string; icon: typeof Mic }[] = [
  { key: "text", label: "Text", icon: TypeIcon },
  { key: "voice", label: "Voice", icon: Mic },
  { key: "video", label: "Video", icon: Video },
];

export default function InterviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState<string>("in_progress");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("text");
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const baseRef = useRef("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const load = useCallback(async () => {
    try {
      const d: InterviewDetail = await getInterview(id);
      setMessages((d.messages ?? []).map((m) => ({ role: m.role, content: m.content })));
      setStatus(d.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Webcam: start when in video mode, stop otherwise (and on unmount).
  useEffect(() => {
    if (mode !== "video") return;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() =>
        setError("Camera unavailable — check permissions. You can still answer by voice or text."),
      );
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [mode]);

  // Stop everything on unmount.
  useEffect(
    () => () => {
      recRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  function startMic() {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setError("Voice input needs a Chromium browser (Web Speech API). You can still type.");
      return;
    }
    if (recRef.current) return;
    const r = new SR();
    recRef.current = r;
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = true;
    baseRef.current = input ? input + " " : "";
    r.onresult = (e) => {
      let s = "";
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
      setInput(baseRef.current + s);
    };
    r.onend = () => {
      setRecording(false);
      recRef.current = null;
    };
    r.onerror = () => {
      setRecording(false);
      recRef.current = null;
    };
    r.start();
    setRecording(true);
  }

  function stopMic() {
    recRef.current?.stop();
    recRef.current = null;
    setRecording(false);
  }

  function selectMode(m: Mode) {
    setMode(m);
    setError(null);
    if (m === "text") stopMic();
    else startMic(); // voice + video are hands-free: dictate the answer
  }

  async function onSend() {
    const answer = input.trim();
    if (!answer || busy) return;
    if (recording) stopMic();
    setBusy(true);
    setMessages((m) => [...m, { role: "human", content: answer }]);
    setInput("");
    try {
      const { question } = await answerInterview(id, answer);
      setMessages((m) => [...m, { role: "ai", content: question }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onFinish() {
    setBusy(true);
    stopMic();
    try {
      const r = await finishInterview(id);
      setStatus("done");
      setDoneMsg(`Saved & indexed ${r.indexed_answers} answer(s) (${r.chunks} chunks).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const finished = status === "done";

  return (
    <main className="mx-auto flex w-full max-w-[920px] flex-1 flex-col gap-4 px-6 py-10 md:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-fg">Knowledge interview</h1>
        <Link href="/employees" className="text-[13px] text-fg-muted hover:text-fg">
          ← Employees
        </Link>
      </div>
      <p className="text-[13px] text-fg-muted">
        The AI asks grounded questions about this person&apos;s work. Answer in your own words —
        by text, voice, or on camera. Answers are saved and become searchable knowledge.
      </p>

      {/* Mode selector */}
      {!finished && (
        <div className="inline-flex w-fit rounded-ctl border border-border bg-bg-subtle p-1">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                onClick={() => selectMode(m.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                  mode === m.key ? "bg-panel text-fg shadow-sm" : "text-fg-muted hover:text-fg",
                )}
              >
                <Icon size={14} /> {m.label}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-[13px] text-danger-text">{error}</p>}

      {/* Webcam preview (video mode) */}
      {!finished && mode === "video" && (
        <div className="relative overflow-hidden rounded-card border border-border bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-[300px] w-full object-cover"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> You&apos;re on camera
          </span>
        </div>
      )}

      {/* Conversation */}
      <div className="flex flex-col gap-3 rounded-card border border-border bg-panel p-4">
        {messages.length === 0 ? (
          <p className="text-[13px] text-fg-muted">Loading the first question…</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "ai" ? "" : "flex justify-end"}>
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-[13.5px]",
                  m.role === "ai"
                    ? "bg-bg-muted text-fg-body"
                    : "bg-accent text-accent-fg",
                )}
              >
                {m.role === "ai" && (
                  <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide opacity-60">
                    Interviewer
                  </span>
                )}
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      {finished ? (
        <div className="rounded-card border border-success-b bg-success-tint p-3 text-[13px] text-success-text">
          {doneMsg ?? "Interview finished."} You can now ask the oracle about it.
        </div>
      ) : (
        <>
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void onSend();
              }}
              rows={3}
              placeholder={
                mode === "text"
                  ? "Type your answer… (Ctrl/Cmd+Enter to send)"
                  : "Speak your answer — the transcript appears here. Edit if needed, then send."
              }
              className="flex-1 rounded-ctl border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-accent placeholder:text-fg-faint"
            />
            {mode !== "text" && (
              <button
                onClick={() => (recording ? stopMic() : startMic())}
                title="Dictate with your microphone"
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-ctl border transition-colors",
                  recording
                    ? "border-danger bg-danger-tint text-danger-text"
                    : "border-border-strong bg-panel text-fg-muted hover:bg-bg-muted",
                )}
              >
                <Mic size={16} className={recording ? "animate-pulse" : ""} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void onSend()}
              disabled={busy || !input.trim()}
              className="inline-flex h-9 items-center rounded-ctl bg-accent px-4 text-[13px] font-semibold text-accent-fg hover:bg-accent-hover disabled:opacity-50"
            >
              {busy ? "…" : "Send answer"}
            </button>
            <button
              onClick={() => void onFinish()}
              disabled={busy}
              className="inline-flex h-9 items-center rounded-ctl border border-border-strong bg-panel px-4 text-[13px] font-semibold text-fg hover:bg-bg-muted disabled:opacity-50"
            >
              Finish &amp; save
            </button>
            {recording && (
              <span className="flex items-center gap-1.5 text-[12px] text-danger-text">
                <span className="h-2 w-2 animate-pulse rounded-full bg-danger" /> Listening…
              </span>
            )}
          </div>
        </>
      )}
    </main>
  );
}
