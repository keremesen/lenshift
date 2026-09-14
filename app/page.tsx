"use client";

import { useEffect, useRef, useState } from "react";
import VisionScene from "./vision-scene";

type Mode="Myopia"|"Hyperopia"|"Astigmatism";
function Icon({name,className=""}:{name:string;className?:string}){
 const paths:Record<string,React.ReactNode>={
 glasses:<><rect x="2" y="8" width="8" height="7" rx="3"/><rect x="14" y="8" width="8" height="7" rx="3"/><path d="M10 10q2-2 4 0M2 10V7l2-3m18 6V7l-2-3"/></>,
 arrow:<path d="M5 19 19 5M5 5h14v14"/>,eye:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,moon:<path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z"/>,down:<path d="M12 4v16m-5-5 5 5 5-5"/>,reset:<><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></>,check:<path d="m5 12 4 4L19 6"/>,close:<path d="m6 6 12 12M6 18 18 6"/>,info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v2"/></>};
 return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
const format=(n:number)=>`${n<0?"−":n>0?"+":""}${Math.abs(n).toFixed(2)}`;
const bounded=(raw:string|null,min:number,max:number,fallback:number)=>{if(raw===null||raw.trim()==="")return fallback;const n=Number(raw);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.round(n*4)/4)):fallback;};

export default function Home() {
  const [sph, setSph] = useState(0);
  const [cyl, setCyl] = useState(0);
  const [axis, setAxis] = useState(90);
  const [mode, setMode] = useState<Mode>("Myopia");
  const [night, setNight] = useState(false);
  const [glasses, setGlasses] = useState(false);
  const [compare, setCompare] = useState(false);
  const [shared, setShared] = useState(false);
  const [shareFallback, setShareFallback] = useState("");
  const initialized = useRef(false);
  const infoDialog = useRef<HTMLDialogElement>(null);
  const shareDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const initialSph = bounded(p.get("sph"), -10, 6, 0);
    const initialCyl = bounded(p.get("cyl"), -4, 0, 0);
    const hydration = requestAnimationFrame(() => {
      setSph(initialSph);
      setCyl(initialCyl);
      setAxis(Math.round(bounded(p.get("axis"), 0, 180, 90)));
      setNight(p.get("night") === "1");
      setMode(p.get("mode") === "Astigmatism" || initialCyl !== 0 ? "Astigmatism" : initialSph > 0 ? "Hyperopia" : "Myopia");
      initialized.current = true;
    });
    const release = () => setCompare(false);
    window.addEventListener("blur", release);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      cancelAnimationFrame(hydration);
      window.removeEventListener("blur", release);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
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
  }, [sph, cyl, axis, mode, night]);

  useEffect(() => {
    if (shareFallback) shareDialog.current?.showModal();
  }, [shareFallback]);

  const chooseMode = (next: Mode) => {
    setMode(next);
    if (next === "Myopia") { setSph(-2); setCyl(0); }
    else if (next === "Hyperopia") { setSph(2); setCyl(0); }
    else { setSph(0); setCyl(-1.5); setNight(true); }
  };
  const changeSphere = (value: number) => {
    setSph(value);
    setMode(value > 0 ? "Hyperopia" : "Myopia");
  };
  const reset = () => {
    setSph(0); setCyl(0); setAxis(90); setGlasses(false); setCompare(false);
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

  return (
    <main className={`experience ${glasses ? "wearing-glasses" : ""}`} id="simulator">
      <h1 className="sr-only">Lenshift vision simulator</h1>
      <div className="scene-area">
        <VisionScene settings={{ sph, cyl, axis, glasses, compare, night }} />
      </div>
      <div className="edge-shade" aria-hidden="true" />

      <header className="site-header">
        <a className="wordmark" href="#simulator" aria-label="Lenshift">
          <span className="brand-symbol" aria-hidden="true"><i /><i /></span>lenshift<span className="brand-period">®</span>
        </a>
        <div className="header-actions">
          <div className="scene-toggle" role="group" aria-label="Scene lighting">
            <button aria-pressed={!night} aria-label="Evening" onClick={() => setNight(false)} className={!night ? "active" : ""}><Icon name="sun" /></button>
            <button aria-pressed={night} aria-label="Night" onClick={() => setNight(true)} className={night ? "active" : ""}><Icon name="moon" /></button>
          </div>
          <button className="icon-button" aria-label="About this simulation" title="About this simulation" onClick={() => infoDialog.current?.showModal()}><Icon name="info" /></button>
          <button className="share-button" aria-label={shared ? "Link copied" : "Share my vision"} onClick={share}><span>{shared ? "Copied" : "Share"}</span><Icon name={shared ? "check" : "arrow"} /></button>
        </div>
      </header>

      {(compare || glasses) && <div className="vision-status" role="status">{compare ? "20/20 · Clear vision" : "Move the glasses to look around"}</div>}

      <section className="instrument" aria-label="Prescription controls">
        <div className="instrument-top">
          <div className="mode-tabs" role="group" aria-label="Vision condition">
            {(["Myopia", "Hyperopia", "Astigmatism"] as Mode[]).map(m => <button key={m} onClick={() => chooseMode(m)} aria-pressed={mode === m} className={mode === m ? "active" : ""}>{m}</button>)}
          </div>
          <button className="reset-button" onClick={reset}><Icon name="reset" /><span>Reset</span></button>
        </div>
        <div className={`instrument-main ${mode === "Astigmatism" ? "astigmatism-controls" : ""}`}>
          <div className="prescription-readout">
            <span className="readout-label">{mode === "Astigmatism" ? "CYL" : "SPH"}</span>
            <output className="diopter-value">{format(mode === "Astigmatism" ? cyl : sph)}<span>D</span></output>
          </div>
          <div className="range-section">
            {mode === "Astigmatism" ? (
              <div className="cylinder-controls">
                <div><label className="axis-label" htmlFor="cylinder">Cylinder <span>{format(cyl)} D</span></label><input id="cylinder" type="range" min="0" max="4" step=".25" value={-cyl} onChange={e => setCyl(-Number(e.target.value))} aria-valuetext={`${format(cyl)} diopters`} /><div className="axis-endpoints"><span>0.00</span><span>−4.00</span></div></div>
                <div><label className="axis-label" htmlFor="axis">Axis <span>{axis}°</span></label><input id="axis" type="range" min="0" max="180" step="1" value={axis} onChange={e => setAxis(Number(e.target.value))} /><div className="axis-endpoints"><span>0°</span><span>180°</span></div></div>
              </div>
            ) : (
              <>
                <div className="ruler" aria-hidden="true">{Array.from({ length: 65 }, (_, i) => <i key={i} className={i === 24 ? "zero-tick" : i % 8 === 0 ? "major-tick" : ""} />)}</div>
                <div className="sphere-slider"><span className="zero-marker" /><input aria-label="Sphere prescription" aria-valuetext={`${format(sph)} diopters`} type="range" min="-6" max="10" step=".25" value={-sph} onChange={e => changeSphere(-Number(e.target.value))} /></div>
                <div className="range-labels"><span>+6.00</span><span className="neutral">0.00</span><span>−10.00</span></div>
              </>
            )}
          </div>
          <div className="vision-actions">
            <button className={`glasses-button ${glasses ? "selected" : ""}`} aria-pressed={glasses} onClick={() => setGlasses(!glasses)}><Icon name="glasses" />{glasses ? "Take off glasses" : "Put on glasses"}</button>
            <button className={`compare-button ${compare ? "held" : ""}`} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setCompare(true); }} onPointerUp={() => setCompare(false)} onPointerCancel={() => setCompare(false)} onLostPointerCapture={() => setCompare(false)} onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setCompare(true); } }} onKeyUp={e => { if (e.key === " " || e.key === "Enter") setCompare(false); }} onBlur={() => setCompare(false)} aria-pressed={compare}><Icon name="eye" />{compare ? "Seeing 20/20" : "Hold to see 20/20"}</button>
          </div>
        </div>
        <div className="instrument-footer"><span>{mode === "Astigmatism" ? "Rotate the axis to shift the lights" : "Drag the slider to change your vision"}</span><button onClick={() => infoDialog.current?.showModal()}>Visual approximation <Icon name="info" /></button></div>
      </section>

      <dialog ref={infoDialog} className="info-dialog" aria-labelledby="info-title" onClick={e => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
        <div className="dialog-content">
          <button className="dialog-close" aria-label="Close" onClick={() => infoDialog.current?.close()}><Icon name="close" /></button>
          <h2 id="info-title">About the simulation</h2>
          <p>Drag the prescription slider to change focus. Try glasses to see a corrected view through each lens, or hold the comparison button for a clear view.</p>
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
