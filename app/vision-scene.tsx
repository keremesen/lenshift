"use client";

import { useEffect, useRef, useState } from "react";

export type VisionSettings = { sph: number; cyl: number; axis: number; glasses: boolean; compare: boolean; night: boolean; intro: boolean; adjusting: boolean };
const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision highp float;
varying vec2 uv;
uniform sampler2D scene;
uniform vec2 resolution, pointer, lensPosition, orbPosition, revealPosition;
uniform float sph, cyl, axis, glasses, correction, night, intro, time, orbRadius, adjusting;
vec3 source(vec2 p){
 float depth = smoothstep(.22,.85,1.-p.y)*.5 + (1.-smoothstep(.08,.5,abs(p.x-.53)))*.5;
 vec2 shift = pointer * mix(.0015,.005,1.-depth);
 vec3 col = texture2D(scene,clamp(p+shift,0.,1.)).rgb;
 vec3 nocturnal=col*vec3(.37,.46,.65)+pow(max(col.r-col.b*.55,0.),3.)*vec3(.28,.12,.025);
 return mix(col,nocturnal,night*.78);
}
float roundedBox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
void main(){
 vec2 px=1./resolution;
 float revealDistance=length(uv*resolution-revealPosition);
 float revealRadius=correction*length(resolution)*1.1;
 float clarity=(1.-smoothstep(revealRadius-55.,revealRadius,revealDistance))*smoothstep(0.,.015,correction);
 // Three smoothly joined distance regions: street foreground, side buildings, distant vanishing point.
 float farZone=(1.-smoothstep(.12,.52,abs(uv.x-.53)))*smoothstep(.12,.50,uv.y);
 float nearZone=1.-smoothstep(.05,.34,uv.y);
 float distanceWeight=mix(.36,1.,farZone)*(1.-nearZone*.85);
 float radius=(max(-sph,0.)*1.65*distanceWeight+max(sph,0.)*2.1*(.12+nearZone))*(1.-clarity);
 vec3 sharp=source(uv); vec3 blurred=sharp; float weight=1.;
 if(radius>.015){for(int i=0;i<28;i++){
  float fi=float(i)+.5; float angle=fi*2.399963; float r=sqrt(fi/28.)*radius;
  float w=1.-fi/38.; blurred+=source(uv+vec2(cos(angle),sin(angle))*r*px)*w;weight+=w;
 }
 } blurred/=weight;
 vec2 direction=vec2(cos(axis),-sin(axis));
 float cylinder=abs(cyl)*(1.-clarity);
 vec3 smear=vec3(0.); float sum=0.;
 if(cylinder>.005){for(int j=-8;j<=8;j++){
  float f=float(j)/8.;float w=exp(-f*f*2.8);
  vec3 sampleColor=source(uv+direction*f*cylinder*15.*px);
  float highlight=smoothstep(.42,.9,max(sampleColor.r,max(sampleColor.g,sampleColor.b)));
  smear+=sampleColor*w*(1.+highlight*cylinder*.19);sum+=w;
 }
 blurred=mix(blurred,smear/sum,min(cylinder*.28,.8));}
 vec2 p=uv*resolution-lensPosition;
 float totalWidth=min(resolution.x*.76,610.)*glasses;
 vec2 lensSize=vec2(totalWidth*.215,totalWidth*.16);
 float gap=totalWidth*.04;
 float left=roundedBox(p+vec2(lensSize.x+gap,0.),lensSize,totalWidth*.105);
 float right=roundedBox(p-vec2(lensSize.x+gap,0.),lensSize,totalWidth*.105);
 float lens=min(left,right);
 float inside=(1.-smoothstep(-1.,1.,lens))*smoothstep(.02,.12,glasses);
 vec3 color=mix(blurred,sharp*vec3(.99,1.,1.015),inside);
 float frame=(1.-smoothstep(2.0,4.0,abs(lens)))*smoothstep(.1,.3,glasses);
 float bridge=(1.-smoothstep(2.,3.5,abs(length(p-vec2(0.,-gap*.9))-gap*1.55)))*(1.-step(gap*1.35,abs(p.x)))*step(0.,p.y)*glasses;
 vec3 metal=mix(vec3(.10,.105,.105),vec3(.77,.69,.48),smoothstep(-lensSize.y,lensSize.y,p.y));
 color=mix(color,metal,max(frame,bridge));
 color+=inside*.025*smoothstep(.1,.8,uv.y);
 // A travelling optical boundary makes press-and-hold comparison spatial.
 float revealRim=exp(-abs(revealDistance-revealRadius)*.08)*sin(correction*3.14159);
 color+=revealRim*vec3(.13,.17,.10);
 // A subtle breathing perimeter connects the instrument to the photograph.
 float perimeter=smoothstep(.22,.78,length((uv-.5)*vec2(1.,.9)));
 color=mix(color,color*vec3(.88,.94,.87),perimeter*adjusting*.45);
 // A refractive portal: the same photograph becomes a moving optical sculpture.
 if(intro>.001){
  vec2 delta=uv*resolution-orbPosition;
  float portalRadius=orbRadius+(1.-intro)*max(resolution.x,resolution.y)*1.4;
  float d=length(delta)/portalRadius;
  float mask=1.-smoothstep(.985,1.005,d);
  float bend=sqrt(max(0.,1.-min(d*d,1.)));
  vec2 refracted=uv-delta/resolution*(.19*bend+.035*sin(d*13.-time*.65))*intro;
  vec2 dispersion=delta/resolution*.018*pow(min(d,1.),5.)*intro;
  vec3 glassColor=vec3(source(refracted+dispersion).r,source(refracted).g,source(refracted-dispersion).b);
  float rim=exp(-abs(d-.974)*120.);
  float halo=exp(-abs(d-1.015)*24.);
  float angle=atan(delta.y,delta.x);
  vec3 spectrum=.55+.45*cos(angle*2.+time*.22+vec3(0.,2.,4.));
  vec3 backdrop=sharp*.21*vec3(.68,.85,.72);
  backdrop+=vec3(.025,.042,.025)*(1.-uv.y);
  vec3 optical=mix(backdrop,glassColor*.93,mask);
  optical+=rim*(spectrum*.75+vec3(.25,.3,.18))+halo*spectrum*.065;
  optical+=pow(max(0.,1.-length((delta/portalRadius-vec2(-.34,.48))*vec2(1.,2.5))),5.)*.15*mask;
  color=mix(color,optical,intro);
 }
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
    const uniforms=Object.fromEntries(["resolution","pointer","revealPosition","adjusting","lensPosition","orbPosition","orbRadius","sph","cyl","axis","glasses","correction","night","intro","time","scene"].map(n=>[n,gl.getUniformLocation(program,n)]));
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const photo=new Image();photo.src="/copenhagen-scene.jpg";
    let width=1,height=1;
    const drawTexture=()=>{
      if(!ready||stopped)return;
      const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;
      const ratio=Math.min(window.devicePixelRatio,1.35);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);gl.viewport(0,0,canvas.width,canvas.height);
      const composite=document.createElement("canvas");composite.width=Math.round(width*1.5);composite.height=Math.round(height*1.5);const ctx=composite.getContext("2d")!;
      ctx.scale(1.5,1.5);const cover=Math.max(width/photo.width,height/photo.height);ctx.drawImage(photo,(width-photo.width*cover)/2,(height-photo.height*cover)/2,photo.width*cover,photo.height*cover);
      gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,composite);
    };
    photo.onload=()=>{ready=true;drawTexture();canvas.style.opacity="1";};photo.onerror=()=>setFailed(true);
    const observer=new ResizeObserver(drawTexture);observer.observe(canvas);
    const target={x:.5,y:.52,px:0,py:0};
    const move=(event:PointerEvent)=>{const rect=canvas.getBoundingClientRect();if(event.clientY<rect.top||event.clientY>rect.bottom)return;target.x=(event.clientX-rect.left)/rect.width;target.y=1-(event.clientY-rect.top)/rect.height;target.px=(target.x-.5)*2;target.py=(target.y-.5)*2;};
    window.addEventListener("pointermove",move,{passive:true});
    window.addEventListener("pointerdown",move,{passive:true});
    const current={sph:0,cyl:0,axis:90,glasses:0,correction:0,night:0,adjusting:0,intro:settingsRef.current.intro?1:0,x:.5,y:.52,px:0,py:0};
    const velocity:Record<string,number>={};let last=0;
    let wasComparing=false;const revealOrigin={x:.5,y:.5};
    const tick=(time:number)=>{
      if(stopped)return;frame=requestAnimationFrame(tick);if(!ready||document.hidden)return;
      const dt=Math.min((time-last)/1000||.016,.033);last=time;const s=settingsRef.current;
      if(s.compare&&!wasComparing){revealOrigin.x=target.x;revealOrigin.y=target.y;}
      wasComparing=s.compare;
      const goals={sph:s.sph,cyl:s.cyl,axis:s.axis,glasses:s.glasses?1:0,correction:s.compare?1:0,night:s.night?1:0,adjusting:s.adjusting?1:0,intro:s.intro?1:0,x:target.x,y:target.y,px:reduced.matches?0:target.px,py:reduced.matches?0:target.py};
      for(const key of Object.keys(current) as (keyof typeof current)[]){if(reduced.matches){current[key]=goals[key];continue;}velocity[key]=(velocity[key]||0)+(goals[key]-current[key])*180*dt;velocity[key]*=Math.exp(-23*dt);current[key]+=velocity[key]*dt;}
      gl.uniform2f(uniforms.revealPosition,revealOrigin.x*width,revealOrigin.y*height);gl.uniform1f(uniforms.adjusting,current.adjusting);
      gl.uniform2f(uniforms.resolution,width,height);gl.uniform2f(uniforms.pointer,current.px,current.py);gl.uniform2f(uniforms.lensPosition,current.x*width,current.y*height);
      const mobile=width<=620;
      const ambient=reduced.matches?0:Math.sin(time*.00045)*7;
      const orbX=width*(mobile?.72:.705)+current.px*(mobile?12:35);
      const orbY=height*(mobile?.65:.52)+current.py*22+ambient;
      const orbR=mobile?Math.min(width*.56,height*.28):Math.min(width*.245,height*.345);
      gl.uniform2f(uniforms.orbPosition,orbX,orbY);gl.uniform1f(uniforms.orbRadius,orbR);
      gl.uniform1f(uniforms.intro,Math.max(0,Math.min(1,current.intro)));gl.uniform1f(uniforms.time,reduced.matches?0:time*.001);
      if(orbRef.current&&s.intro){orbRef.current.style.transform=`translate3d(${orbX}px,${height-orbY}px,0)`;orbRef.current.style.setProperty("--orb-size",`${orbR*2}px`);}
      gl.uniform1f(uniforms.sph,current.sph);gl.uniform1f(uniforms.cyl,current.cyl);gl.uniform1f(uniforms.axis,current.axis*Math.PI/180);gl.uniform1f(uniforms.glasses,current.glasses);gl.uniform1f(uniforms.correction,Math.max(0,Math.min(1,current.correction)));gl.uniform1f(uniforms.night,current.night);gl.drawArrays(gl.TRIANGLES,0,6);
    };
    frame=requestAnimationFrame(tick);
    const contextLost=(event:Event)=>{event.preventDefault();setFailed(true);};canvas.addEventListener("webglcontextlost",contextLost);
    return()=>{stopped=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("pointermove",move);window.removeEventListener("pointerdown",move);canvas.removeEventListener("webglcontextlost",contextLost);gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);};
  },[]);

  return <><div className="scene-fallback" /><canvas ref={canvasRef} className="vision-canvas" aria-label="A cafe terrace overlooking a Copenhagen street, with focus changing according to your selected prescription" role="img" /><div ref={orbRef} className="optical-object" aria-hidden="true"><div className="orb-orbit orbit-one" /><div className="orb-orbit orbit-two" /><div className="orb-orbit orbit-three" /><div className="orb-calibration" /><span className="orb-north">+</span><span className="orb-south">+</span><span className="orb-coordinate">ø — PERCEPTION</span></div>{failed&&<p className="graphics-note">Your browser couldn’t start the optical effects. Try a browser with WebGL enabled.</p>}</>;
}
