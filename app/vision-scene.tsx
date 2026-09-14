"use client";

import { useEffect, useRef, useState } from "react";

export type VisionSettings = { sph: number; cyl: number; axis: number; glasses: boolean; compare: boolean; night: boolean; intro: boolean };
const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision highp float;
varying vec2 uv;
uniform sampler2D scene;
uniform vec2 resolution, pointer, lensPosition;
uniform float sph, cyl, axis, glasses, correction, night;
vec3 source(vec2 p){
 float depth = smoothstep(.22,.85,1.-p.y)*.5 + (1.-smoothstep(.08,.5,abs(p.x-.53)))*.5;
 vec2 shift = pointer * mix(.0015,.005,1.-depth);
 vec3 col = texture2D(scene,clamp(p+shift,0.,1.)).rgb;
 float luminance=dot(col,vec3(.299,.587,.114));
 vec3 nocturnal=col*vec3(.37,.46,.65)+pow(max(col.r-col.b*.55,0.),3.)*vec3(.28,.12,.025);
 return mix(col,nocturnal,night*.78);
}
float roundedBox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
void main(){
 vec2 px=1./resolution;
 // Three smoothly joined distance regions: street foreground, side buildings, distant vanishing point.
 float farZone=(1.-smoothstep(.12,.52,abs(uv.x-.53)))*smoothstep(.12,.50,uv.y);
 float nearZone=1.-smoothstep(.05,.34,uv.y);
 float distanceWeight=mix(.36,1.,farZone)*(1.-nearZone*.85);
 float radius=(max(-sph,0.)*1.65*distanceWeight+max(sph,0.)*2.1*(.12+nearZone))*(1.-correction);
 vec3 sharp=source(uv); vec3 blurred=sharp; float weight=1.;
 if(radius>.015){for(int i=0;i<28;i++){
  float fi=float(i)+.5; float angle=fi*2.399963; float r=sqrt(fi/28.)*radius;
  float w=1.-fi/38.; blurred+=source(uv+vec2(cos(angle),sin(angle))*r*px)*w;weight+=w;
 }
 } blurred/=weight;
 vec2 direction=vec2(cos(axis),sin(axis));
 float cylinder=abs(cyl)*(1.-correction);
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
 gl_FragColor=vec4(color,1.);
}`;

export default function VisionScene({ settings }: { settings: VisionSettings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    const uniforms=Object.fromEntries(["resolution","pointer","lensPosition","sph","cyl","axis","glasses","correction","night","scene"].map(n=>[n,gl.getUniformLocation(program,n)]));
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const photo=new Image();photo.src="/paris-scene.jpg";
    let width=1,height=1;
    const drawTexture=()=>{
      if(!ready||stopped)return;
      const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;
      const ratio=Math.min(window.devicePixelRatio,1.35);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);gl.viewport(0,0,canvas.width,canvas.height);
      const composite=document.createElement("canvas");composite.width=Math.round(width*1.5);composite.height=Math.round(height*1.5);const ctx=composite.getContext("2d")!;
      ctx.scale(1.5,1.5);const cover=Math.max(width/photo.width,height/photo.height);ctx.drawImage(photo,(width-photo.width*cover)/2,(height-photo.height*cover)/2,photo.width*cover,photo.height*cover);
      // A close, readable cafe menu shares the optical texture, including correction through lenses.
      {ctx.save();ctx.translate(width*(width>650?.84:.80),height*.79);if(width<=650)ctx.scale(.73,.73);ctx.rotate(-.075);ctx.shadowColor="#0005";ctx.shadowBlur=18;ctx.fillStyle="#ede8d9";ctx.fillRect(-80,-58,160,112);ctx.shadowBlur=0;ctx.textAlign="center";ctx.fillStyle="#313c35";ctx.font="10px Georgia";ctx.fillText("LE PETIT CAFÉ",0,-32);ctx.fillRect(-57,-20,114,.5);ctx.font="italic 21px Georgia";ctx.fillText("La vie est belle.",0,7);ctx.font="9px Arial";ctx.fillText("UN CAFÉ. UN INSTANT.",0,30);ctx.restore();}
      gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,composite);
    };
    photo.onload=()=>{ready=true;drawTexture();canvas.style.opacity="1";};photo.onerror=()=>setFailed(true);
    const observer=new ResizeObserver(drawTexture);observer.observe(canvas);
    const target={x:.5,y:.46,px:0,py:0};
    const move=(event:PointerEvent)=>{const rect=canvas.getBoundingClientRect();if(event.clientY<rect.top||event.clientY>rect.bottom)return;target.x=(event.clientX-rect.left)/rect.width;target.y=1-(event.clientY-rect.top)/rect.height;target.px=(target.x-.5)*2;target.py=(target.y-.5)*2;};
    window.addEventListener("pointermove",move,{passive:true});
    const current={sph:0,cyl:0,axis:90,glasses:0,correction:0,night:0,x:.5,y:.46,px:0,py:0};
    const velocity:Record<string,number>={};let last=0;
    const tick=(time:number)=>{
      if(stopped)return;frame=requestAnimationFrame(tick);if(!ready||document.hidden)return;
      const dt=Math.min((time-last)/1000||.016,.033);last=time;const s=settingsRef.current;
      const goals={sph:s.intro?0:s.sph,cyl:s.intro?0:s.cyl,axis:s.axis,glasses:s.glasses?1:0,correction:s.compare?1:0,night:s.night?1:0,x:target.x,y:target.y,px:reduced.matches?0:target.px,py:reduced.matches?0:target.py};
      for(const key of Object.keys(current) as (keyof typeof current)[]){if(reduced.matches){current[key]=goals[key];continue;}velocity[key]=(velocity[key]||0)+(goals[key]-current[key])*180*dt;velocity[key]*=Math.exp(-23*dt);current[key]+=velocity[key]*dt;}
      gl.uniform2f(uniforms.resolution,width,height);gl.uniform2f(uniforms.pointer,current.px,current.py);gl.uniform2f(uniforms.lensPosition,current.x*width,current.y*height);
      gl.uniform1f(uniforms.sph,current.sph);gl.uniform1f(uniforms.cyl,current.cyl);gl.uniform1f(uniforms.axis,current.axis*Math.PI/180);gl.uniform1f(uniforms.glasses,current.glasses);gl.uniform1f(uniforms.correction,current.correction);gl.uniform1f(uniforms.night,current.night);gl.drawArrays(gl.TRIANGLES,0,6);
    };
    frame=requestAnimationFrame(tick);
    const contextLost=(event:Event)=>{event.preventDefault();setFailed(true);};canvas.addEventListener("webglcontextlost",contextLost);
    return()=>{stopped=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("pointermove",move);canvas.removeEventListener("webglcontextlost",contextLost);gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);};
  },[]);

  return <><div className="scene-fallback" /><canvas ref={canvasRef} className="vision-canvas" aria-label="An evening on a Parisian street, with focus changing according to your selected prescription" role="img" />{failed&&<p className="graphics-note">Your browser couldn’t start the optical effects. Try a browser with WebGL enabled.</p>}</>;
}
