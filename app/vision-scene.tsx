"use client";

import { useEffect, useRef, useState } from "react";

export type VisionSettings = { sph: number; cyl: number; axis: number; glasses: boolean; compare: boolean; night: boolean; intro: boolean; adjusting: boolean; mode: "Myopia" | "Hyperopia" | "Astigmatism"; modeChanging: boolean; recalibrating: boolean };
const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision highp float;
varying vec2 uv;
uniform sampler2D scene;
uniform vec2 resolution, pointer, pointerLag, pointerVelocity, lensPosition, orbPosition, revealPosition;
uniform float sph, cyl, axis, glasses, correction, night, intro, time, orbRadius, adjusting, mode, modeTransition, shock, recalibrate, quality, boot;
float roundedBox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 rawSource(vec2 p){
 vec3 col=texture2D(scene,clamp(p,0.,1.)).rgb;
 vec3 nocturnal=col*vec3(.37,.46,.65)+pow(max(col.r-col.b*.55,0.),3.)*vec3(.30,.12,.024);
 float nightFront=smoothstep(-.18,1.1,night*1.38+p.x*.48+p.y*.18-.36);
 return mix(col,nocturnal,nightFront*.83);
}
vec3 source(vec2 p){
 float depth=smoothstep(.22,.85,1.-p.y)*.5+(1.-smoothstep(.08,.5,abs(p.x-.53)))*.5;
 vec2 pointerUv=pointer*.5+.5;
 vec2 delta=(p-pointerUv)*vec2(resolution.x/resolution.y,1.);
 float pressure=exp(-dot(delta,delta)*32.)*(.35+min(length(pointerVelocity)*5.,1.));
 vec2 normal=normalize(delta+vec2(.0001));
 vec2 depthShift=pointer*mix(.0013,.0055,1.-depth)+pointerLag*.0018*depth;
 vec2 warped=p+depthShift-normal*pressure*.0065;
 return rawSource(warped);
}
void main(){
 vec2 px=1./resolution;
 vec2 sceneUv=uv;
 float transitionWave=sin((uv.y*1.7+uv.x*.32)*9.-time*5.)*.5+.5;
 if(mode<.55) sceneUv=mix(sceneUv,vec2(.5)+(sceneUv-.5)*vec2(1.-modeTransition*.045,1.+modeTransition*.018),modeTransition);
 else if(mode<1.55) sceneUv=mix(sceneUv,vec2(.5)+(sceneUv-.5)*vec2(1.+modeTransition*.055,1.-modeTransition*.012),modeTransition);
 else {float a=(transitionWave-.5)*modeTransition*.045;mat2 r=mat2(cos(a),-sin(a),sin(a),cos(a));sceneUv=.5+r*(sceneUv-.5);}
 float revealDistance=length(uv*resolution-revealPosition);
 float liquid=sin(atan((uv.y*resolution.y-revealPosition.y),(uv.x*resolution.x-revealPosition.x))*7.+time*1.7)*9.+sin(time*2.2+revealDistance*.018)*5.;
 float revealRadius=correction*length(resolution)*1.06+liquid*sin(correction*3.14159);
 float clarity=(1.-smoothstep(revealRadius-45.,revealRadius+3.,revealDistance))*smoothstep(0.,.015,correction);
 float farZone=(1.-smoothstep(.12,.52,abs(sceneUv.x-.53)))*smoothstep(.12,.50,sceneUv.y);
 float nearZone=1.-smoothstep(.05,.34,sceneUv.y);
 float distanceWeight=mix(.36,1.,farZone)*(1.-nearZone*.85);
 float radius=(max(-sph,0.)*1.65*distanceWeight+max(sph,0.)*2.1*(.12+nearZone))*(1.-clarity);
 vec3 sharp=source(sceneUv);vec3 blurred=sharp;float weight=1.;
 if(radius>.015){for(int i=0;i<28;i++){float fi=float(i)+.5;if(fi>12.+quality*16.)continue;float angle=fi*2.399963;float rr=sqrt(fi/28.)*radius;float w=1.-fi/38.;blurred+=source(sceneUv+vec2(cos(angle),sin(angle))*rr*px)*w;weight+=w;}}
 blurred/=weight;
 vec2 direction=vec2(cos(axis),-sin(axis));
 float cylinder=abs(cyl)*(1.-clarity);vec3 smear=vec3(0.);float sum=0.;
 if(cylinder>.005){for(int j=-8;j<=8;j++){float f=float(j)/8.;float w=exp(-f*f*2.8);vec3 sampleColor=source(sceneUv+direction*f*cylinder*15.*px);float highlight=smoothstep(.42,.9,max(sampleColor.r,max(sampleColor.g,sampleColor.b)));smear+=sampleColor*w*(1.+highlight*cylinder*.19);sum+=w;}blurred=mix(blurred,smear/sum,min(cylinder*.28,.8));}
 vec2 p=uv*resolution-lensPosition;
 float lensTilt=pointerVelocity.x*12.;p.x+=p.y*lensTilt*.018;
 float totalWidth=min(resolution.x*.76,610.)*glasses;
 vec2 lensSize=vec2(totalWidth*.215,totalWidth*.16);float gap=totalWidth*.04;
 float left=roundedBox(p+vec2(lensSize.x+gap,0.),lensSize,totalWidth*.105);float right=roundedBox(p-vec2(lensSize.x+gap,0.),lensSize,totalWidth*.105);float lens=min(left,right);
 float inside=(1.-smoothstep(-2.,1.5,lens))*smoothstep(.02,.12,glasses);
 vec2 lensNormal=normalize(p+vec2(.001));vec2 lensChroma=lensNormal*.0018*inside;
 vec3 corrected=vec3(rawSource(sceneUv+lensChroma).r,rawSource(sceneUv).g,rawSource(sceneUv-lensChroma).b)*vec3(.995,1.,1.018);
 vec3 color=mix(blurred,corrected,inside);
 vec2 pointerUv=pointer*.5+.5;vec2 pointerDelta=(sceneUv-pointerUv)*vec2(resolution.x/resolution.y,1.);float pointerPressure=exp(-dot(pointerDelta,pointerDelta)*32.);vec2 pointerNormal=normalize(pointerDelta+vec2(.0001));vec2 pointerChroma=pointerNormal*pointerPressure*(.0007+length(pointerVelocity)*.004);
 vec3 pressurePrism=vec3(rawSource(sceneUv+pointerChroma).r,color.g,rawSource(sceneUv-pointerChroma).b);color=mix(color,pressurePrism,pointerPressure*.28*(1.-inside));
 float outerFrame=(1.-smoothstep(1.5,6.,abs(lens)))*smoothstep(.1,.3,glasses);float innerFrame=(1.-smoothstep(7.,11.,abs(lens)))*smoothstep(3.,5.,abs(lens))*glasses;
 float bridge=(1.-smoothstep(2.,3.5,abs(length(p-vec2(0.,-gap*.9))-gap*1.55)))*(1.-step(gap*1.35,abs(p.x)))*step(0.,p.y)*glasses;
 vec3 metal=mix(vec3(.11,.12,.115),vec3(.83,.76,.53),smoothstep(-lensSize.y,lensSize.y,p.y));
 color=mix(color,metal,max(max(outerFrame,innerFrame*.34),bridge));
 color+=inside*(.018+.05*pow(max(0.,1.-abs(p.y)/max(lensSize.y,1.)),10.));
 float revealRim=exp(-abs(revealDistance-revealRadius)*.065)*sin(correction*3.14159);vec3 rimSpectrum=.55+.45*cos(time+revealDistance*.02+vec3(0.,2.,4.));color+=revealRim*rimSpectrum*.17;
 float shockRadius=(1.-shock)*length(resolution)*.78;float shockWave=exp(-abs(length(p)-shockRadius)*.045)*shock;color+=shockWave*vec3(.18,.22,.13);
 float perimeter=smoothstep(.22,.78,length((uv-.5)*vec2(1.,.9)));color=mix(color,color*vec3(.87,.94,.88),perimeter*adjusting*.45);
 float calibration=exp(-abs(length((uv-.5)*resolution)-recalibrate*length(resolution)*.58)*.028)*sin(recalibrate*3.14159);color+=calibration*(.5+.5*cos(time+vec3(0.,2.,4.)))*.18;
 if(intro>.001){
  vec2 delta=uv*resolution-orbPosition;float angle=atan(delta.y,delta.x);float organic=1.+sin(angle*5.+time*.21)*.036+sin(angle*3.-time*.17)*.024+sin(angle*9.+1.7)*.012;
  float irisEase=1.-pow(1.-clamp(boot,0.,1.),3.);float portalRadius=(orbRadius*irisEase+(1.-intro)*max(resolution.x,resolution.y)*1.4)*organic;
  float d=length(delta)/max(portalRadius,1.);float mask=1.-smoothstep(.975,1.012,d);float bend=sqrt(max(0.,1.-min(d*d,1.)));
  float hunt=sin(time*7.)*exp(-time*1.25)*.045;vec2 refracted=sceneUv-delta/resolution*((.19+hunt)*bend+.035*sin(d*13.-time*.65))*intro;
  vec2 dispersion=delta/resolution*(.018+.01*(1.-boot))*pow(min(d,1.),5.)*intro;
  vec3 glassColor=vec3(source(refracted+dispersion).r,source(refracted).g,source(refracted-dispersion).b);
  float rim=exp(-abs(d-.968)*105.);float halo=exp(-abs(d-1.018)*22.);vec3 spectrum=.55+.45*cos(angle*2.+time*.22+vec3(0.,2.,4.));
  vec3 backdrop=sharp*.12*vec3(.58,.78,.64)*boot;backdrop+=vec3(.012,.025,.016)*(1.-uv.y)*boot;
  vec3 optical=mix(backdrop,glassColor*.94,mask);optical+=rim*(spectrum*.72+vec3(.22,.28,.16))+halo*spectrum*.075;optical+=pow(max(0.,1.-length((delta/max(portalRadius,1.)-vec2(-.34,.48))*vec2(1.,2.5))),5.)*.18*mask;
  color=mix(color,optical,intro);
 }
 color*=smoothstep(0.,.11,boot+.001);
 gl_FragColor=vec4(color,1.);
}`;

export default function VisionScene({ settings }: { settings: VisionSettings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef(settings);
  const [failed, setFailed] = useState(false);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "high-performance" });
    if (!gl) { setFailed(true); return; }
    let stopped=false, frame=0, ready=false;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    const compile=(type:number,code:string)=>{
      const shader=gl.createShader(type)!;gl.shaderSource(shader,code);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw new Error("Shader compilation failed");}return shader;
    };
    let program:WebGLProgram;
    try { program=gl.createProgram()!;const v=compile(gl.VERTEX_SHADER,vertex),f=compile(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error("Shader linking failed"); }
    catch {setFailed(true);return;}
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,"position");gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const uniforms=Object.fromEntries(["resolution","pointer","pointerLag","pointerVelocity","revealPosition","adjusting","lensPosition","orbPosition","orbRadius","sph","cyl","axis","glasses","correction","night","intro","time","scene","mode","modeTransition","shock","recalibrate","quality","boot"].map(n=>[n,gl.getUniformLocation(program,n)]));
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const photo=new Image();photo.src="/copenhagen-scene.jpg";
    let width=1,height=1;
    const drawTexture=()=>{
      if(!ready||stopped)return;
      const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;
      const memory=(navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
      const lowPower=navigator.hardwareConcurrency<=4||memory<=4||width<=620;
      const ratio=Math.min(window.devicePixelRatio,lowPower?1.05:1.35);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);gl.viewport(0,0,canvas.width,canvas.height);
      const composite=document.createElement("canvas");composite.width=Math.round(width*1.5);composite.height=Math.round(height*1.5);const ctx=composite.getContext("2d")!;
      ctx.scale(1.5,1.5);const cover=Math.max(width/photo.width,height/photo.height);ctx.drawImage(photo,(width-photo.width*cover)/2,(height-photo.height*cover)/2,photo.width*cover,photo.height*cover);
      gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,composite);
    };
    photo.onload=()=>{ready=true;drawTexture();canvas.style.opacity="1";};photo.onerror=()=>setFailed(true);
    const observer=new ResizeObserver(drawTexture);observer.observe(canvas);
    const target={x:.5,y:.52,px:0,py:0,vx:0,vy:0,lastX:.5,lastY:.52,lastAt:performance.now()};
    const move=(event:PointerEvent)=>{if(event.target instanceof Element&&event.target.closest(".focus-lab,.site-header,.info-dialog"))return;const rect=canvas.getBoundingClientRect();if(event.clientY<rect.top||event.clientY>rect.bottom)return;const now=performance.now();const elapsed=Math.max(8,now-target.lastAt);const nextX=(event.clientX-rect.left)/rect.width;const nextY=1-(event.clientY-rect.top)/rect.height;target.vx=(nextX-target.lastX)/elapsed*16;target.vy=(nextY-target.lastY)/elapsed*16;target.x=nextX;target.y=nextY;target.px=(target.x-.5)*2;target.py=(target.y-.5)*2;target.lastX=nextX;target.lastY=nextY;target.lastAt=now;};
    window.addEventListener("pointermove",move,{passive:true});
    window.addEventListener("pointerdown",move,{passive:true});
    const initialMode=settingsRef.current.mode==="Myopia"?0:settingsRef.current.mode==="Hyperopia"?1:2;
    const current={sph:0,cyl:0,axis:90,glasses:0,correction:0,night:0,adjusting:0,intro:settingsRef.current.intro?1:0,x:.5,y:.52,px:0,py:0,lagX:0,lagY:0,vx:0,vy:0,mode:initialMode,modeTransition:0,recalibrate:0,boot:reduced.matches?1:0};
    const velocity:Record<string,number>={};let last=0;
    let wasComparing=false,wasGlasses=settingsRef.current.glasses,shock=0;const revealOrigin={x:.5,y:.5};
    const tick=(time:number)=>{
      if(stopped)return;frame=requestAnimationFrame(tick);if(!ready||document.hidden)return;
      const dt=Math.min((time-last)/1000||.016,.033);last=time;const s=settingsRef.current;
      if(s.compare&&!wasComparing){revealOrigin.x=target.x;revealOrigin.y=target.y;}
      wasComparing=s.compare;
      if(s.glasses!==wasGlasses){shock=1;wasGlasses=s.glasses;}
      shock*=Math.exp(-2.8*dt);
      target.vx*=Math.exp(-9*dt);target.vy*=Math.exp(-9*dt);
      const goals={sph:s.sph,cyl:s.cyl,axis:s.axis,glasses:s.glasses?1:0,correction:s.compare?1:0,night:s.night?1:0,adjusting:s.adjusting?1:0,intro:s.intro?1:0,x:target.x,y:target.y,px:reduced.matches?0:target.px,py:reduced.matches?0:target.py,lagX:reduced.matches?0:target.px,lagY:reduced.matches?0:target.py,vx:reduced.matches?0:target.vx,vy:reduced.matches?0:target.vy,mode:s.mode==="Myopia"?0:s.mode==="Hyperopia"?1:2,modeTransition:s.modeChanging?1:0,recalibrate:s.recalibrating?1:0,boot:1};
      for(const key of Object.keys(current) as (keyof typeof current)[]){if(reduced.matches){current[key]=goals[key];continue;}const slow=key==="lagX"||key==="lagY";const stiffness=slow?38:key==="correction"?95:key==="glasses"?125:180;const damping=slow?9:key==="correction"?15:key==="glasses"?17:23;velocity[key]=(velocity[key]||0)+(goals[key]-current[key])*stiffness*dt;velocity[key]*=Math.exp(-damping*dt);current[key]+=velocity[key]*dt;}
      gl.uniform2f(uniforms.revealPosition,revealOrigin.x*width,revealOrigin.y*height);gl.uniform1f(uniforms.adjusting,current.adjusting);
      gl.uniform2f(uniforms.resolution,width,height);gl.uniform2f(uniforms.pointer,current.px,current.py);gl.uniform2f(uniforms.pointerLag,current.lagX,current.lagY);gl.uniform2f(uniforms.pointerVelocity,current.vx,current.vy);gl.uniform2f(uniforms.lensPosition,current.x*width,current.y*height);
      const mobile=width<=620;
      const ambient=reduced.matches?0:Math.sin(time*.00045)*7;
      const orbX=width*(mobile?.72:.705)+current.px*(mobile?12:35);
      const orbY=height*(mobile?.65:.52)+current.py*22+ambient;
      const orbR=mobile?Math.min(width*.56,height*.28):Math.min(width*.245,height*.345);
      gl.uniform2f(uniforms.orbPosition,orbX,orbY);gl.uniform1f(uniforms.orbRadius,orbR);
      gl.uniform1f(uniforms.intro,Math.max(0,Math.min(1,current.intro)));gl.uniform1f(uniforms.time,reduced.matches?0:time*.001);gl.uniform1f(uniforms.mode,current.mode);gl.uniform1f(uniforms.modeTransition,Math.max(0,Math.min(1,current.modeTransition)));gl.uniform1f(uniforms.shock,shock);gl.uniform1f(uniforms.recalibrate,Math.max(0,Math.min(1,current.recalibrate)));gl.uniform1f(uniforms.boot,Math.max(0,Math.min(1,current.boot)));
      const memory=(navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;gl.uniform1f(uniforms.quality,navigator.hardwareConcurrency<=4||memory<=4||width<=620?0:1);
      if(orbRef.current&&s.intro){orbRef.current.style.transform=`translate3d(${orbX}px,${height-orbY}px,0)`;orbRef.current.style.setProperty("--orb-size",`${orbR*2}px`);}
      gl.uniform1f(uniforms.sph,current.sph);gl.uniform1f(uniforms.cyl,current.cyl);gl.uniform1f(uniforms.axis,current.axis*Math.PI/180);gl.uniform1f(uniforms.glasses,current.glasses);gl.uniform1f(uniforms.correction,Math.max(0,Math.min(1,current.correction)));gl.uniform1f(uniforms.night,current.night);gl.drawArrays(gl.TRIANGLES,0,6);
    };
    frame=requestAnimationFrame(tick);
    const contextLost=(event:Event)=>{event.preventDefault();setFailed(true);};canvas.addEventListener("webglcontextlost",contextLost);
    return()=>{stopped=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("pointermove",move);window.removeEventListener("pointerdown",move);canvas.removeEventListener("webglcontextlost",contextLost);gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);};
  },[]);

  return <><div className="scene-fallback" /><canvas ref={canvasRef} className="vision-canvas" aria-label="A cafe terrace overlooking a Copenhagen street, with focus changing according to your selected prescription" role="img" /><div ref={orbRef} className="optical-object" aria-hidden="true"><div className="orb-orbit orbit-one" /><div className="orb-orbit orbit-two" /><div className="orb-orbit orbit-three" /><div className="orb-calibration" /><span className="orb-north">+</span><span className="orb-south">+</span><span className="orb-coordinate">ø — PERCEPTION</span></div>{failed&&<p className="graphics-note">Your browser couldn’t start the optical effects. Try a browser with WebGL enabled.</p>}</>;
}
