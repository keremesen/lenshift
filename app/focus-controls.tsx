"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { clamp, dialPoint, snap } from "./optical-math";

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

let detentContext: AudioContext | null = null;
let lastDetentAt = 0;

function getDetentContext() {
  if (detentContext) return detentContext;
  const AudioConstructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!AudioConstructor) return null;
  detentContext = new AudioConstructor();
  return detentContext;
}

function primeDetentAudio(enabled: boolean) {
  if (!enabled) return;
  const context = getDetentContext();
  if (context?.state === "suspended") void context.resume();
}

function playDetent(enabled: boolean, progress: number, accent = false) {
  if (!enabled) return;
  const now = performance.now();
  if (!accent && now - lastDetentAt < 18) return;
  lastDetentAt = now;
  const context = getDetentContext();
  if (!context || context.state !== "running") return;

  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const overtone = context.createOscillator();
  const gain = context.createGain();
  const overtoneGain = context.createGain();
  const filter = context.createBiquadFilter();
  const pitch = 1120 + clamp(progress, 0, 1) * 260;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(pitch, start);
  oscillator.frequency.exponentialRampToValueAtTime(pitch * .62, start + .022);
  overtone.type = "sine";
  overtone.frequency.setValueAtTime(pitch * 2.16, start);
  filter.type = "highpass";
  filter.frequency.value = 420;
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(accent ? .055 : .032, start + .0015);
  gain.gain.exponentialRampToValueAtTime(.0001, start + .026);
  overtoneGain.gain.setValueAtTime(.0001, start);
  overtoneGain.gain.exponentialRampToValueAtTime(accent ? .016 : .009, start + .001);
  overtoneGain.gain.exponentialRampToValueAtTime(.0001, start + .012);

  oscillator.connect(gain).connect(filter).connect(context.destination);
  overtone.connect(overtoneGain).connect(context.destination);
  oscillator.start(start);
  overtone.start(start);
  oscillator.stop(start + .03);
  overtone.stop(start + .016);
}

type DialProps = {
  value: number;
  max: number;
  step: number;
  label: string;
  negative?: boolean;
  axis?: boolean;
  soundEnabled?: boolean;
  onChange: (value: number) => void;
  onEngage: (active: boolean) => void;
};

function RollingNumber({ value }: { value: string }) {
  return <span className="rolling-number" aria-hidden="true">{value.split("").map((character, i) => (
    /\d/.test(character) ? <span className="number-window" key={`digit-${value.length - i}`}><span className="number-reel" style={{ transform: `translateY(-${Number(character) * 10}%)` }}>{Array.from({ length: 10 }, (_, n) => <span key={n}>{n}</span>)}</span></span> : <span className={`number-symbol ${character === "." ? "decimal" : ""}`} key={`symbol-${value.length - i}`}>{character}</span>
  ))}</span>;
}

export function OpticalDial({ value, max, step, label, negative = false, axis = false, soundEnabled = true, onChange, onEngage }: DialProps) {
  const [active, setActive] = useState(false);
  const [settling, setSettling] = useState(false);
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const id = useId();
  const slider = useRef<HTMLDivElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const pulse = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const motion = useRef({ frame: 0, value, velocity: 0, lastTime: 0, x: 0, distance: 0, dragging: false, pointerId: -1 });
  const callbacks = useRef({ onChange, onEngage });
  useEffect(() => { callbacks.current = { onChange, onEngage }; }, [onChange, onEngage]);
  useEffect(() => {
    const state = motion.current;
    if (snap(state.value, 0, max, step) !== value) {
      cancelAnimationFrame(state.frame);
      state.value = value;
      if (!state.dragging) {
        callbacks.current.onEngage(false);
        const frame = requestAnimationFrame(() => setActive(false));
        return () => cancelAnimationFrame(frame);
      }
    }
  }, [value, max, step]);
  useEffect(() => {
    const state = motion.current;
    const cancel = () => {
      cancelAnimationFrame(state.frame);
      state.dragging = false;
      setActive(false);
      setDirection(0);
      callbacks.current.onEngage(false);
    };
    window.addEventListener("blur", cancel);
    return () => { cancelAnimationFrame(state.frame); if (settleTimer.current) clearTimeout(settleTimer.current); window.removeEventListener("blur", cancel); callbacks.current.onEngage(false); };
  }, []);
  useEffect(() => { if (editing) { input.current?.focus(); input.current?.select(); } }, [editing]);

  const emit = (raw: number, feedback = true) => {
    const state = motion.current;
    const previous = snap(state.value, 0, max, step);
    state.value = clamp(raw, 0, max);
    const next = snap(state.value, 0, max, step);
    if (next !== previous) {
      callbacks.current.onChange(next);
      if (feedback) {
        playDetent(soundEnabled, next / max, next === 0 || next === max);
        if ("vibrate" in navigator && next % (step * 4) === 0) navigator.vibrate(4);
        pulse.current?.animate([
          { opacity: .9, transform: "scale(.96) rotate(-8deg)", filter: "hue-rotate(0deg)" },
          { opacity: 0, transform: "scale(1.18) rotate(14deg)", filter: "hue-rotate(48deg)" },
        ], { duration: next % (step * 4) === 0 ? 520 : 330, easing: "cubic-bezier(.16,1,.3,1)" });
      }
    }
  };
  const settle = () => {
    cancelAnimationFrame(motion.current.frame);
    motion.current.velocity = 0;
    motion.current.value = snap(motion.current.value, 0, max, step);
    setActive(false);
    setSettling(true);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setSettling(false), 420);
    setDirection(0);
    callbacks.current.onEngage(false);
  };
  const setDirect = (next: number) => {
    primeDetentAudio(soundEnabled);
    const previous = snap(motion.current.value, 0, max, step);
    settle();
    motion.current.value = snap(next, 0, max, step);
    callbacks.current.onChange(motion.current.value);
    if (motion.current.value !== previous) playDetent(soundEnabled, motion.current.value / max, true);
  };
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || motion.current.dragging) return;
    event.preventDefault();
    primeDetentAudio(soundEnabled);
    cancelAnimationFrame(motion.current.frame);
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    Object.assign(motion.current, { value, velocity: 0, lastTime: performance.now(), x: event.clientX, distance: 0, dragging: true, pointerId: event.pointerId });
    setActive(true);
    setSettling(false);
    callbacks.current.onEngage(true);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const state = motion.current;
    if (!state.dragging || state.pointerId !== event.pointerId) return;
    const now = performance.now(), dt = Math.max(8, now - state.lastTime);
    const deltaX = event.clientX - state.x;
    const pixelsPerStep = (event.pointerType === "touch" ? 7 : 5.5) * (event.shiftKey ? 4 : 1);
    const delta = deltaX / pixelsPerStep * step;
    state.velocity = clamp(state.velocity * .35 + delta / dt * .65, -max / 650, max / 650);
    state.distance += Math.abs(deltaX);
    state.x = event.clientX; state.lastTime = now;
    if (Math.abs(deltaX) > .25) setDirection(deltaX > 0 ? 1 : -1);
    emit(state.value + delta);
  };
  const release = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const state = motion.current;
    if (!state.dragging || state.pointerId !== event.pointerId) return;
    state.dragging = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (cancelled || state.distance < 4 || performance.now() - state.lastTime > 100 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { settle(); return; }
    let last = performance.now();
    const glide = (now: number) => {
      const dt = Math.min(now - last, 32); last = now;
      state.velocity *= Math.exp(-dt / 95);
      emit(state.value + state.velocity * dt);
      if (Math.abs(state.velocity) < step / 100 || state.value <= 0 || state.value >= max) { settle(); return; }
      state.frame = requestAnimationFrame(glide);
    };
    state.frame = requestAnimationFrame(glide);
  };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = event.shiftKey ? step * 4 : step;
    const commands: Record<string, number> = { ArrowRight: value + delta, ArrowUp: value + delta, ArrowLeft: value - delta, ArrowDown: value - delta, PageUp: value + step * 4, PageDown: value - step * 4, Home: 0, End: max };
    if (event.key in commands) { event.preventDefault(); setDirect(commands[event.key]); }
    if (event.key === "Enter") { event.preventDefault(); setDraft(String(negative ? -value : value)); setEditing(true); }
  };
  const display = axis ? String(Math.round(value)).padStart(3, "0") : `${value === 0 ? "" : negative ? "−" : "+"}${value.toFixed(2)}`;
  const angle = axis ? value : -144 + value / max * 288;
  const dot = dialPoint(angle, 122);
  const tickCount = axis ? 72 : 64;

  return <div className={`optical-dial ${axis ? "axis-dial" : "power-dial"} ${active ? "is-turning" : ""} ${settling ? "is-settling" : ""} ${direction < 0 ? "turning-left" : direction > 0 ? "turning-right" : ""}`} style={{ "--dial-angle": `${angle}deg`, "--power": value / max } as CSSProperties}>
    <div ref={slider} className="dial-surface" role="slider" tabIndex={0} aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${axis ? value : display} ${axis ? "degrees" : "diopters"}`} aria-describedby={`${id}-hint`} onKeyDown={keyboard} onPointerDown={start} onPointerMove={move} onPointerUp={e => release(e)} onPointerCancel={e => release(e, true)} onLostPointerCapture={e => { if (motion.current.dragging) release(e, true); }}>
      <div className="dial-halo" />
      <div ref={pulse} className="dial-detent-pulse" />
      <div className="dial-caustic" />
      <div className="dial-machining" />
      <svg className="dial-scale" viewBox="0 0 280 280" fill="none" aria-hidden="true">
        <circle cx="140" cy="140" r="107" className="dial-inner-border" />
        {Array.from({ length: tickCount + (axis ? 0 : 1) }, (_, i) => {
          const a = axis ? i * 5 : -144 + i / tickCount * 288;
          const major = i % (axis ? 6 : 8) === 0;
          const p1 = dialPoint(a, major ? 112 : 117), p2 = dialPoint(a, 123);
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className={`${major ? "major" : ""} ${!axis && i / tickCount <= value / max ? "passed" : ""}`} />;
        })}
        {!axis && <><circle cx={dot.x} cy={dot.y} r="5" className="dial-position-glow" /><circle cx={dot.x} cy={dot.y} r="2.5" className="dial-position" /><text x="59" y="260">0.00</text><text x="215" y="260">{negative ? "−" : "+"}{max.toFixed(2)}</text></>}
        {axis && <g className="axis-needle" style={{ transform: `rotate(${value}deg)` }}><path d="M44 140h192" /><path d="m44 140 8-4v8Zm192 0-8-4v8Z" /><ellipse cx="140" cy="140" rx="84" ry="19" /><ellipse cx="140" cy="140" rx="65" ry="10" /></g>}
      </svg>
      <div className="dial-face" aria-hidden="true">
        <span className="dial-caption">{axis ? "LIGHT DIRECTION" : "LENS POWER"}</span>
        <div className="dial-reading"><RollingNumber value={display} /><span className="dial-unit">{axis ? "°" : "D"}</span></div>
        <span className="dial-subtitle">{active ? "FIND YOUR FOCUS" : axis ? "ROTATE THE LIGHT" : "TURN TO FEEL THE DIFFERENCE"}</span>
        <span className="scrub-cue"><i>←</i><span>{active ? direction < 0 ? "LESS" : direction > 0 ? "MORE" : "SLIDE" : "SLIDE TO ADJUST"}</span><i>→</i></span>
      </div>
    </div>
    <div className="dial-precision">
      <button aria-label={`Decrease ${label.toLowerCase()}`} disabled={value <= 0} onClick={() => setDirect(value - step)}>−</button>
      <button ref={editButton} className="exact-value" onClick={() => { settle(); setDraft(String(negative ? -value : value)); setEditing(!editing); }} aria-label={`Enter exact ${label.toLowerCase()}`} aria-expanded={editing} aria-controls={`${id}-exact`}>{axis ? "1°" : "0.25 D"}<span> / step</span><svg width="10" height="10" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 11 1-3 7-7 3 3-7 7-4 1Zm6-8 3 3" fill="none" stroke="currentColor" /></svg></button>
      <button aria-label={`Increase ${label.toLowerCase()}`} disabled={value >= max} onClick={() => setDirect(value + step)}>+</button>
    </div>
    <span className="sr-only" id={`${id}-hint`}>Drag around the ring or drag across the number. Use arrow keys to adjust, Shift for fine dragging, Home or End for limits. Press Enter to type a value.</span>
    {editing && <form id={`${id}-exact`} className="exact-entry" onSubmit={event => { event.preventDefault(); if (draft.trim() && Number.isFinite(Number(draft))) { setDirect(Math.abs(Number(draft))); setEditing(false); editButton.current?.focus(); } }}>
      <label htmlFor={`${id}-input`}>Exact {axis ? "axis" : "power"} · {axis ? "degrees" : "diopters"}</label>
      <div><input ref={input} id={`${id}-input`} type="number" inputMode="decimal" step={step} min={negative ? -max : 0} max={negative ? 0 : max} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); setEditing(false); editButton.current?.focus(); } }} required /><button type="submit">Set</button><button type="button" aria-label="Cancel exact value" onClick={() => { setEditing(false); editButton.current?.focus(); }}>×</button></div>
    </form>}
  </div>;
}

export type VisionMode = "Myopia" | "Hyperopia" | "Astigmatism";
const journeys: Record<VisionMode, { title: string; description: string; values: number[]; labels: string[] }> = {
  Myopia: { title: "Let the distance\ndisappear.", description: "Turn the lens. Watch the far end of the street dissolve into colour.", values: [0, 1.5, 3, 6], labels: ["Clear", "A little", "A world away", "Abstract"] },
  Hyperopia: { title: "So close.\nSo different.", description: "Bring your attention to the café menu. Let the little details slip away.", values: [0, 1, 2.5, 5], labels: ["Clear", "A little", "Soft edges", "Abstract"] },
  Astigmatism: { title: "Give light\na new direction.", description: "Stretch the highlights. Rotate the axis and watch their direction change.", values: [0, .75, 1.5, 3.5], labels: ["Clear", "A little", "Light trails", "Afterglow"] },
};

export function PerceptionStory({ mode, value, soundEnabled = true, onChange }: { mode: VisionMode; value: number; soundEnabled?: boolean; onChange: (value: number) => void }) {
  const story = journeys[mode];
  return <div className="perception-story" key={mode}>
    <span className="lab-kicker">{mode === "Myopia" ? "01 / DISTANCE" : mode === "Hyperopia" ? "02 / PROXIMITY" : "03 / DIRECTION"}</span>
    <h2>{story.title.split("\n").map((line, i) => <span key={line} style={{ "--line-index": i } as CSSProperties}>{line}</span>)}</h2>
    <p>{story.description}</p>
    <div className="perception-stops" role="group" aria-label="Try a lens power">
      {story.values.map((stop, i) => <button key={stop} className={value === stop ? "selected" : ""} onClick={() => { primeDetentAudio(soundEnabled); playDetent(soundEnabled, i / (story.values.length - 1), true); onChange(stop); }} aria-pressed={value === stop} aria-label={`${story.labels[i]}, ${stop} diopters`}><span className="stop-dot" /><span>{story.labels[i]}</span></button>)}
    </div>
  </div>;
}
