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

export default function Home(){
 const [sph,setSph]=useState(0),[cyl,setCyl]=useState(0),[axis,setAxis]=useState(90);
 const [mode,setMode]=useState<Mode>("Myopia"),[night,setNight]=useState(false),[glasses,setGlasses]=useState(false),[compare,setCompare]=useState(false),[intro,setIntro]=useState(true),[shared,setShared]=useState(false),[shareFallback,setShareFallback]=useState("");
 const initialized=useRef(false);
 useEffect(()=>{
  const p=new URLSearchParams(window.location.search);const initialSph=bounded(p.get("sph"),-10,6,0),initialCyl=bounded(p.get("cyl"),-4,0,0);
  const hydration=requestAnimationFrame(()=>{setSph(initialSph);setCyl(initialCyl);setAxis(bounded(p.get("axis"),0,180,90));setNight(p.get("night")==="1");setMode(p.get("mode")==="Astigmatism"||initialCyl!==0?"Astigmatism":initialSph>0?"Hyperopia":"Myopia");
  if(p.has("sph")||p.has("cyl"))setIntro(false);
  initialized.current=true;});
  const timer=setTimeout(()=>setIntro(false),3200);
  const release=()=>setCompare(false);window.addEventListener("blur",release);window.addEventListener("pointerup",release);window.addEventListener("pointercancel",release);
  return()=>{cancelAnimationFrame(hydration);clearTimeout(timer);window.removeEventListener("blur",release);window.removeEventListener("pointerup",release);window.removeEventListener("pointercancel",release);};
 },[]);
 useEffect(()=>{if(!initialized.current)return;const timer=setTimeout(()=>{const url=new URL(window.location.href);url.searchParams.set("sph",sph.toFixed(2));url.searchParams.set("cyl",cyl.toFixed(2));url.searchParams.set("axis",String(axis));url.searchParams.set("mode",mode);if(night)url.searchParams.set("night","1");else url.searchParams.delete("night");window.history.replaceState(null,"",url);},180);return()=>clearTimeout(timer);},[sph,cyl,axis,mode,night]);
 const engage=()=>setIntro(false);
 const chooseMode=(next:Mode)=>{engage();setMode(next);if(next==="Myopia"){setSph(-2);setCyl(0);}else if(next==="Hyperopia"){setSph(2);setCyl(0);}else{setSph(0);setCyl(-1.5);setNight(true);}};
 const changeSphere=(value:number)=>{engage();setSph(value);if(mode!=="Astigmatism")setMode(value>0?"Hyperopia":"Myopia");};
 const reset=()=>{setSph(0);setCyl(0);setAxis(90);setGlasses(false);setCompare(false);engage();};
 const share=async()=>{engage();const url=new URL(window.location.href);url.searchParams.set("sph",sph.toFixed(2));url.searchParams.set("cyl",cyl.toFixed(2));url.searchParams.set("axis",String(axis));url.searchParams.set("mode",mode);if(night)url.searchParams.set("night","1");else url.searchParams.delete("night");const text=`This is what ${format(mode==="Astigmatism"?cyl:sph)} D looks like. Explore a visual approximation with Lenshift.`;
  try{if(navigator.share){await navigator.share({title:"Lenshift — See differently",text,url:url.toString()});}else{await navigator.clipboard.writeText(url.toString());}setShared(true);setTimeout(()=>setShared(false),2500);}catch(error){if(!(error instanceof DOMException&&error.name==="AbortError"))setShareFallback(url.toString());}
 };
 const description=mode==="Astigmatism"?"Lights take on a different shape.":sph===0?"A little perspective changes everything.":sph<0?"The distance softens. The world shifts.":"The closer you look, the softer it gets.";
 return <main>
  <section className={`experience ${night?"is-night":""} ${glasses?"wearing-glasses":""}`} id="simulator" aria-label="Interactive vision simulator">
   <div className="scene-area"><VisionScene settings={{sph,cyl,axis,glasses,compare,night,intro}}/><div className="scene-wash"/>
    <header className="site-header"><a className="wordmark" href="#simulator" aria-label="Lenshift home"><span className="brand-symbol"><i/><i/></span>lenshift<span className="brand-period">®</span></a><span className="header-caption">A SMALL SHIFT. A DIFFERENT WORLD.</span><a className="about-link" href="#about">About the experiment <Icon name="arrow"/></a></header>
    <div className={`hero-copy ${intro?"intro-copy":""}`}><div className="eyebrow"><span/> AN EXPERIMENT IN SEEING</div><h1>{intro?<>How does the world look<br/>without your glasses?</>:<>See the world.<br/><span>A little differently.</span></>}</h1><p>{intro?"Experience different prescriptions.":description}</p></div>
    <div className="scene-meta"><div className="scene-location"><span className="location-cross">⌖</span><div>A moment in Paris<span>{night?"AFTER DARK":"THE BLUE HOUR"} · SCENE 01</span></div></div><div className="scene-center-hint">{compare?"A moment of clarity. 20/20.":glasses?"Move your cursor. Look through the lenses.":"Same world. A different perspective."}</div><div className="scene-toggle" role="group" aria-label="Scene lighting"><button aria-pressed={!night} aria-label="Evening scene" onClick={()=>setNight(false)} className={!night?"active":""}><Icon name="sun"/></button><button aria-pressed={night} aria-label="Night scene" onClick={()=>setNight(true)} className={night?"active":""}><Icon name="moon"/></button></div></div>
   </div>
   <div className="instrument">
    <div className="instrument-top"><div className="instrument-label"><span className="small-cross">+</span> YOUR PERSPECTIVE</div><div className="mode-tabs" role="group" aria-label="Vision condition">{(["Myopia","Hyperopia","Astigmatism"] as Mode[]).map(m=><button key={m} onClick={()=>chooseMode(m)} aria-pressed={mode===m} className={mode===m?"active":""}>{m}</button>)}</div><button className="reset-button" onClick={reset}><Icon name="reset"/>Reset<span className="reset-extra"> vision</span></button></div>
    <div className={`instrument-main ${mode==="Astigmatism"?"astigmatism-controls":""}`}>
     <div className="prescription-readout"><span className="readout-label">{mode==="Astigmatism"?"CYLINDER":"SPHERE"}</span><div className="diopter-value" aria-live="polite">{format(mode==="Astigmatism"?cyl:sph)}<span>D</span></div><span className="readout-description">{mode==="Astigmatism"?"Directional distortion":sph===0?"Clear, uncorrected vision":sph<0?"Nearsightedness":"Farsightedness"}</span></div>
     <div className="range-section">{mode==="Astigmatism"?<><div className="axis-label"><label htmlFor="cylinder">CYLINDER</label><span>0.00 to −4.00 D</span></div><input id="cylinder" type="range" min="0" max="4" step=".25" value={-cyl} onChange={e=>{engage();setCyl(-Number(e.target.value));}} aria-valuetext={`${format(cyl)} diopters`}/><div className="axis-label"><label htmlFor="axis">AXIS</label><span>{axis}°</span></div><input id="axis" type="range" min="0" max="180" step="1" value={axis} onChange={e=>setAxis(Number(e.target.value))}/><div className="axis-endpoints"><span>0°</span><span>90°</span><span>180°</span></div></>:<><div className="ruler" aria-hidden="true">{Array.from({length:65},(_,i)=><i key={i} className={i===24?"zero-tick":i%8===0?"major-tick":""}/>)}</div><div className="sphere-slider"><span className="zero-marker"/><input aria-label="Sphere prescription" aria-valuetext={`${format(sph)} diopters`} type="range" min="-6" max="10" step=".25" value={-sph} onChange={e=>changeSphere(-Number(e.target.value))}/></div><div className="range-labels"><span>+6.00</span><span>+4.00</span><span>+2.00</span><span className="neutral">0.00</span><span>−2.00</span><span>−4.00</span><span>−6.00</span><span>−8.00</span><span>−10.00</span></div><div className="range-hint"><span>FARSIGHTED</span><span>Drag to shift your focus</span><span>NEARSIGHTED</span></div></>}</div>
     <div className="vision-actions"><button className={`glasses-button ${glasses?"selected":""}`} aria-pressed={glasses} onClick={()=>{engage();setGlasses(!glasses);}}><Icon name="glasses"/>{glasses?"Take off glasses":"Put on glasses"}<span>{glasses?"−":"+"}</span></button><button className={`compare-button ${compare?"held":""}`} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);engage();setCompare(true);}} onPointerUp={()=>setCompare(false)} onPointerCancel={()=>setCompare(false)} onLostPointerCapture={()=>setCompare(false)} onKeyDown={e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();engage();setCompare(true);}}} onKeyUp={e=>{if(e.key===" "||e.key==="Enter")setCompare(false);}} onBlur={()=>setCompare(false)} aria-pressed={compare}><Icon name="eye"/>{compare?"You’re seeing 20/20":"Hold to see 20/20"}</button></div>
    </div>
    <div className="instrument-footer"><span><Icon name="info"/> A visual approximation. Every pair of eyes is different.</span><a href="#about">A little more perspective <Icon name="down"/></a><button onClick={share}>{shared?"Link copied":"Share my vision"}<Icon name={shared?"check":"arrow"}/></button></div>
   </div>
  </section>
  <section className="about-section" id="about"><div className="about-number">01 / A LITTLE CONTEXT</div><div className="about-content"><h2>Your eyes aren’t<br/>a camera.</h2><div><p>And vision is more than a number. Lenshift is a playful approximation of how different prescriptions can change the way we see.</p><p>Real vision varies with your eyes, the light, viewing distance, and how you focus. This is an experiment in perspective, not a diagnostic tool or an exact representation of anyone’s sight.</p><a className="return-link" href="#simulator">Try another prescription <Icon name="arrow"/></a></div></div><footer className="about-footer"><span>lenshift</span><span>Made for a little more understanding.</span><button onClick={share}>{shared?"Link copied":"Share my vision"}<Icon name="arrow"/></button></footer></section>
  {shareFallback&&<div className="share-overlay"><div role="dialog" aria-modal="true" aria-labelledby="share-title" className="share-dialog"><button className="dialog-close" aria-label="Close share dialog" onClick={()=>setShareFallback("")}><Icon name="close"/></button><h2 id="share-title">Share your perspective.</h2><p>Copy this link to share your exact settings.</p><input autoFocus readOnly value={shareFallback} aria-label="Shareable vision link" onFocus={e=>e.target.select()} onKeyDown={e=>{if(e.key==="Escape")setShareFallback("");}}/><button className="return-link" onClick={()=>setShareFallback("")}>Done <Icon name="check"/></button></div></div>}
  <div className="sr-only" role="status">{shared?"Your vision link is ready to share.":""}</div>
 </main>;
}
