"use client";

import { useEffect, useRef, useState } from "react";
import VisionScene from "./vision-scene";
import { OpticalDial, PerceptionStory } from "./focus-controls";

type Mode="Myopia"|"Hyperopia"|"Astigmatism";
function Icon({name,className=""}:{name:string;className?:string}){
 const paths:Record<string,React.ReactNode>={
 glasses:<><rect x="2" y="8" width="8" height="7" rx="3"/><rect x="14" y="8" width="8" height="7" rx="3"/><path d="M10 10q2-2 4 0M2 10V7l2-3m18 6V7l-2-3"/></>,
 arrow:<path d="M5 19 19 5M5 5h14v14"/>,eye:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,moon:<path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z"/>,sound:<><path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7.5 7.5 0 0 1 0 10"/></>,mute:<><path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="m16 10 5 5m0-5-5 5"/></>,down:<path d="M12 4v16m-5-5 5 5 5-5"/>,reset:<><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></>,check:<path d="m5 12 4 4L19 6"/>,close:<path d="m6 6 12 12M6 18 18 6"/>,info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v2"/></>};
 return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
const format=(n:number)=>`${n<0?"−":n>0?"+":""}${Math.abs(n).toFixed(2)}`;
const bounded=(raw:string|null,min:number,max:number,fallback:number)=>{if(raw===null||raw.trim()==="")return fallback;const n=Number(raw);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.round(n*4)/4)):fallback;};

export default function Home() {
  const [intro, setIntro] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [sph, setSph] = useState(0);
  const [cyl, setCyl] = useState(0);
  const [axis, setAxis] = useState(90);
  const [mode, setMode] = useState<Mode>("Myopia");
  const [night, setNight] = useState(false);
  const [glasses, setGlasses] = useState(false);
  const [compare, setCompare] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [controlRevision, setControlRevision] = useState(0);
  const [shared, setShared] = useState(false);
  const [shareFallback, setShareFallback] = useState("");
  const initialized = useRef(false);
  const infoDialog = useRef<HTMLDialogElement>(null);
  const shareDialog = useRef<HTMLDialogElement>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterButton = useRef<HTMLButtonElement>(null);
  const firstModeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const initialSph = bounded(p.get("sph"), -10, 6, 0);
    const initialCyl = bounded(p.get("cyl"), -4, 0, 0);
    const hydration = requestAnimationFrame(() => {
      setSph(initialSph);
      setCyl(initialCyl);
      setAxis(Math.round(bounded(p.get("axis"), 0, 180, 90)));
      setNight(p.get("night") === "1");
      setSoundEnabled(window.localStorage.getItem("lenshift-sound") !== "off");
      if (["sph", "cyl", "axis", "mode", "night"].some(key => p.has(key))) setIntro(false);
      setMode(p.get("mode") === "Astigmatism" || initialCyl !== 0 ? "Astigmatism" : initialSph > 0 || (initialSph === 0 && p.get("mode") === "Hyperopia") ? "Hyperopia" : "Myopia");
      initialized.current = true;
    });
    const release = () => setCompare(false);
    window.addEventListener("blur", release);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      cancelAnimationFrame(hydration);
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      window.removeEventListener("blur", release);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  useEffect(() => {
    if (!initialized.current || intro) return;
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("sph", sph.toFixed(2));
      url.searchParams.set("cyl", cyl.toFixed(2));
      url.searchParams.set("axis", String(axis));
      url.searchParams.set("mode", mode);
      if (night) url.searchParams.set("night", "1");
      else url.searchParams.delete("night");
      window.history.replaceState(null, "", url);
    }, 180);
    return () => clearTimeout(timer);
  }, [sph, cyl, axis, mode, night, intro]);

  useEffect(() => {
    if (shareFallback) shareDialog.current?.showModal();
  }, [shareFallback]);

  const chooseMode = (next: Mode) => {
    setMode(next);
    if (next === "Myopia") { setSph(-2); setCyl(0); }
    else if (next === "Hyperopia") { setSph(2); setCyl(0); }
    else { setSph(0); setCyl(-1.5); setNight(true); }
  };
  const enterExperience = () => {
    if (transitioning) return;
    setTransitioning(true);
    setIntro(false);
    if (sph === 0 && cyl === 0) setSph(-3);
    transitionTimer.current = setTimeout(() => setTransitioning(false), 1400);
    requestAnimationFrame(() => firstModeButton.current?.focus({ preventScroll: true }));
  };
  const replayIntro = () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setTransitioning(false);
    setIntro(true);
    setGlasses(false);
    setCompare(false);
    requestAnimationFrame(() => enterButton.current?.focus({ preventScroll: true }));
  };
  const changeSphere = (value: number) => {
    setSph(value);
  };
  const reset = () => {
    setControlRevision(value => value + 1);
    setSph(0); setCyl(0); setAxis(90); setGlasses(false); setCompare(false); setAdjusting(false);
  };
  const toggleSound = () => {
    setSoundEnabled(current => {
      const next = !current;
      window.localStorage.setItem("lenshift-sound", next ? "on" : "off");
      return next;
    });
  };
  const share = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("sph", sph.toFixed(2));
    url.searchParams.set("cyl", cyl.toFixed(2));
    url.searchParams.set("axis", String(axis));
    url.searchParams.set("mode", mode);
    if (night) url.searchParams.set("night", "1");
    else url.searchParams.delete("night");
    const text = `This is what ${format(mode === "Astigmatism" ? cyl : sph)} D looks like. A visual approximation with Lenshift.`;
    try {
      if (navigator.share) await navigator.share({ title: "Lenshift", text, url: url.toString() });
      else await navigator.clipboard.writeText(url.toString());
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setShareFallback(url.toString());
    }
  };

  const lensPower = mode === "Astigmatism" ? -cyl : Math.abs(sph);
  const lensMax = mode === "Astigmatism" ? 4 : mode === "Myopia" ? 10 : 6;
  const setLensPower = (value: number) => {
    if (mode === "Astigmatism") setCyl(-value);
    else changeSphere(mode === "Myopia" ? -value : value);
  };

  return (
    <main className={`experience ${intro ? "intro-active" : "simulator-active"} ${transitioning ? "transitioning" : ""} ${glasses ? "wearing-glasses" : ""} ${adjusting ? "adjusting-focus" : ""} ${compare ? "revealing-clarity" : ""}`} id="simulator">
      <div className="scene-area">
        <VisionScene settings={{ sph, cyl, axis, glasses, compare, night, intro, adjusting }} />
      </div>
      <div className="edge-shade" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />
      <div className="refraction-transition" aria-hidden="true"><span /><span /><span /></div>

      <div className="scene-touch" aria-hidden="true" inert={intro}
        onPointerDown={e => { if (e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); if (!glasses) setCompare(true); }}
        onPointerUp={() => setCompare(false)} onPointerCancel={() => setCompare(false)} onLostPointerCapture={() => setCompare(false)} />

      <header className="site-header">
        <a className="wordmark" href="#simulator" aria-label="Lenshift — replay the introduction" onClick={e => { e.preventDefault(); replayIntro(); }}>
          <span className="brand-symbol" aria-hidden="true"><i /><i /></span>lenshift<span className="brand-period">®</span>
        </a>
        <span className="header-edition">A different way to see.</span>
        <div className="header-actions">
          <div className="scene-toggle" role="group" aria-label="Scene lighting">
            <button aria-pressed={!night} aria-label="Evening" onClick={() => setNight(false)} className={!night ? "active" : ""}><Icon name="sun" /></button>
            <button aria-pressed={night} aria-label="Night" onClick={() => setNight(true)} className={night ? "active" : ""}><Icon name="moon" /></button>
          </div>
          <button className="icon-button" aria-label="About this simulation" title="About this simulation" onClick={() => infoDialog.current?.showModal()}><Icon name="info" /></button>
          <button className="share-button" aria-label={shared ? "Link copied" : "Share my vision"} onClick={share}><span>{shared ? "Copied" : "Share"}</span><Icon name={shared ? "check" : "arrow"} /></button>
        </div>
      </header>

      <section className="opening" aria-label="An experiment in perception" inert={!intro} aria-hidden={!intro}>
        <div className="opening-copy">
          <div className="eyebrow"><span className="live-dot" /> VISION, SHIFTED.</div>
          <h1><span className="title-line"><span>Same world.</span></span><span className="title-line focus-line"><span>Different reality.</span></span></h1>
          <p className="opening-description">Borrow another pair of eyes for a moment.</p>
          <button ref={enterButton} className="enter-experience" onClick={enterExperience}>
            <span className="enter-ripple" aria-hidden="true"><i /><i /></span>
            <span className="enter-label"><strong>See it differently</strong><small>Enter the simulator</small></span>
            <span className="enter-arrow"><Icon name="arrow" /></span>
          </button>
        </div>
      </section>

      <div className="scene-caption" aria-hidden={intro}><span className="live-dot" /> THROUGH ANOTHER PAIR OF EYES <span>01 — COPENHAGEN</span></div>

      <div className="scene-invitation" aria-hidden={intro}>
        <span className="scene-crosshair" aria-hidden="true"><i /><i /></span>
        <span>{compare ? "A moment of clarity." : glasses ? "Your own little window of clarity." : "How does your world feel?"}</span>
        <small>{compare ? "RELEASE TO RETURN TO YOUR VISION" : glasses ? "MOVE ACROSS THE SCENE TO LOOK THROUGH THE LENSES" : "PRESS & HOLD THE SCENE TO SEE CLEARLY"}</small>
      </div>
      <div className="focus-feedback" aria-hidden="true"><span>{mode === "Astigmatism" ? "REFRACTING" : "REFOCUSING"}</span><i /><span>{format(mode === "Astigmatism" ? cyl : sph)} D</span></div>
      <div className="clarity-status" role="status">{compare ? "Clear view · release to return" : glasses ? "Glasses on · move across the scene" : ""}</div>

      <section className="focus-lab" aria-label="Prescription controls" inert={intro} aria-hidden={intro}>
        <div className="lab-topline">
          <div className="mode-tabs" role="group" aria-label="Vision condition" style={{ "--mode-index": (["Myopia", "Hyperopia", "Astigmatism"] as Mode[]).indexOf(mode) } as React.CSSProperties}>
            <span className="mode-indicator" aria-hidden="true" />
            {(["Myopia", "Hyperopia", "Astigmatism"] as Mode[]).map((m, i) => <button key={m} ref={i === 0 ? firstModeButton : undefined} onClick={() => chooseMode(m)} aria-pressed={mode === m} className={mode === m ? "active" : ""}><span className="mode-number">0{i + 1}</span>{m}</button>)}
          </div>
          <div className="lab-tools"><span className="lab-edition">THE PERCEPTION LAB</span><button className={`sound-button ${soundEnabled ? "active" : ""}`} onClick={toggleSound} aria-label={soundEnabled ? "Mute adjustment sounds" : "Enable adjustment sounds"} aria-pressed={soundEnabled} title={soundEnabled ? "Sound on" : "Sound off"}><Icon name={soundEnabled ? "sound" : "mute"} /><span>{soundEnabled ? "Sound on" : "Sound off"}</span></button><button className="reset-button" onClick={reset}><Icon name="reset" /><span>Reset</span></button></div>
        </div>
        <div className={`lab-workspace ${mode === "Astigmatism" ? "has-axis" : ""}`} style={{ "--trace-position": `${7 + lensPower / lensMax * 86}%`, "--trace-tilt": `${(lensPower / lensMax - .5) * 7}deg` } as React.CSSProperties}>
          <div className="refractive-trace" aria-hidden="true"><i /><span /></div>
          <PerceptionStory mode={mode} value={lensPower} soundEnabled={soundEnabled} onChange={value => { setControlRevision(revision => revision + 1); setLensPower(value); }} />
          <OpticalDial key={`${mode}-${controlRevision}`} label={mode === "Astigmatism" ? "Cylinder power" : "Sphere power"} value={lensPower} max={lensMax} step={.25} negative={mode !== "Hyperopia"} soundEnabled={soundEnabled} onChange={setLensPower} onEngage={setAdjusting} />
          <div className="correction-station">
            {mode === "Astigmatism" ? <OpticalDial key={`axis-${controlRevision}`} label="Astigmatism axis" value={axis} max={180} step={1} axis soundEnabled={soundEnabled} onChange={setAxis} onEngage={setAdjusting} /> : <div className={`correction-art ${glasses || compare ? "is-corrected" : ""}`} aria-hidden="true"><div className="correction-orbit" /><svg viewBox="0 0 200 100" fill="none"><path className="optical-ray ray-one" d="M2 20 72 50 198 35" /><path className="optical-ray ray-two" d="M2 50h196" /><path className="optical-ray ray-three" d="M2 80 72 50 198 65" /><ellipse cx="72" cy="50" rx="13" ry="39" /><ellipse cx="129" cy="50" rx="13" ry="39" /><path className="optical-target" d="M185 30v40m-7-20h14" /></svg><span>A SMALL SHIFT. A WHOLE NEW WORLD.</span></div>}
            <div className="vision-actions">
              <button className={`glasses-button ${glasses ? "selected" : ""}`} aria-pressed={glasses} onClick={() => setGlasses(!glasses)}><Icon name="glasses" /><span>{glasses ? "Take off glasses" : "Try the correction"}</span><span className="action-indicator" /></button>
              <button className={`compare-button ${compare ? "held" : ""}`} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setCompare(true); }} onPointerUp={() => setCompare(false)} onPointerCancel={() => setCompare(false)} onLostPointerCapture={() => setCompare(false)} onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setCompare(true); } }} onKeyUp={e => { if (e.key === " " || e.key === "Enter") setCompare(false); }} onBlur={() => setCompare(false)} aria-pressed={compare}><Icon name="eye" /><span>{compare ? "A moment of clarity" : "Hold for a clear view"}</span><span className="hold-progress" /></button>
            </div>
          </div>
        </div>
        <div className="lab-footer"><span><span className="gesture-symbol" aria-hidden="true">↔</span><span>{adjusting ? "Keep sliding. Feel every step." : "Slide left or right to refocus."}</span></span><span className="precision-hint"><kbd>shift</kbd> + drag for fine control</span><button onClick={() => infoDialog.current?.showModal()}>Visual approximation <Icon name="info" /></button></div>
      </section>

      <dialog ref={infoDialog} className="info-dialog" aria-labelledby="info-title" onClick={e => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
        <div className="dialog-content">
          <button className="dialog-close" aria-label="Close" onClick={() => infoDialog.current?.close()}><Icon name="close" /></button>
          <h2 id="info-title">About the simulation</h2>
          <p>Slide the glass dial left or right to change focus. Every step has a quiet mechanical click; you can mute it from the control panel. Hold Shift while dragging for finer control. You can also use the arrow keys, the + and − buttons, or click the step label to enter an exact value. Try glasses for a corrected view through each lens. Press and hold the scene or the clear-view button to compare.</p>
          <p>This is a visual approximation, not a diagnostic tool. Real vision varies with your eyes, lighting, viewing distance, and how you focus.</p>
          <button className="dialog-done" onClick={() => infoDialog.current?.close()}>Back to simulation</button>
        </div>
      </dialog>
      <dialog ref={shareDialog} className="info-dialog" aria-labelledby="share-title" onClose={() => setShareFallback("")}>
        <div className="dialog-content">
          <button className="dialog-close" aria-label="Close" onClick={() => shareDialog.current?.close()}><Icon name="close" /></button>
          <h2 id="share-title">Share your vision</h2>
          <p>Copy this link to share your settings.</p>
          <input readOnly value={shareFallback} aria-label="Shareable vision link" onFocus={e => e.target.select()} />
          <button className="dialog-done" onClick={() => shareDialog.current?.close()}>Done</button>
        </div>
      </dialog>
      <div className="sr-only" role="status">{shared ? "Your vision link is ready to share." : ""}</div>
    </main>
  );
}
