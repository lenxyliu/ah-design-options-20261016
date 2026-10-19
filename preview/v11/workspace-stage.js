import {createProductSurfaces} from './product-surfaces.js';
import {products} from './content.js';

const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
const ids=products.map(p=>p.id);
const rules=['CLOUD RUNTIME','ENTERPRISE CONTROL','SKILL ECOSYSTEM','SELF-HOSTED SPACE'];
const values=['云端运行','企业管控','专业技能','自托管空间'];

export function createWorkspaceStage({container,onSelect=()=>{},onReady=()=>{}}){
  const lens=document.createElement('div');lens.className='workspace-lens';
  const rig=document.createElement('div');rig.className='workspace-rig';lens.append(rig);container.append(lens);
  const nodes=products.map((p,i)=>{
    const object=document.createElement('div');object.className='workspace-object';object.dataset.workspace=p.id;object.tabIndex=0;object.setAttribute('role','button');object.setAttribute('aria-label',`探索 ${p.name}，${p.category}`);
    object.innerHTML=`<div class="workspace-back" aria-hidden="true"><span class="workspace-back-symbol">${['↗','⊞','⌘','✳'][i]}</span><span class="workspace-back-name">${p.name}</span><span class="workspace-back-rule">${rules[i]}</span><span class="workspace-back-footer">AGENT HOSTING / ${String(i+1).padStart(2,'0')}</span></div><div class="workspace-edge edge-top" aria-hidden="true"></div><div class="workspace-edge edge-bottom" aria-hidden="true"></div><div class="workspace-edge edge-left" aria-hidden="true"></div><div class="workspace-edge edge-right" aria-hidden="true"></div><div class="workspace-face"></div><div class="workspace-caption" aria-hidden="true"><span class="workspace-caption-number">0${i+1}</span><strong>${p.name}</strong><span class="workspace-caption-purpose">${values[i]}</span></div>`;
    const surface=createProductSurfaces({products});surface.setProduct(p.id);object.querySelector('.workspace-face').append(surface.element);rig.append(object);
    object.addEventListener('click',()=>onSelect(p.id));object.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(p.id);}});
    return{object,surface,id:p.id};
  });
  let width=innerWidth,height=innerHeight,mobile=width<800,scale=1,progress=0,target=0,raf=0,last=0,disposed=false,draws=0;
  let reduced=Boolean(window.__AH_REDUCED_MOTION||matchMedia('(prefers-reduced-motion: reduce)').matches);
  const pose=(x,y,z,rx,ry,rz,s=1,opacity=1,caption=0,shade=0)=>({x,y,z,rx,ry,rz,s,opacity,caption,shade});
  function intro(){return{cx:mobile?.5:.55,cy:mobile?(width/height>.75?.47:.475):.60,rx:5,ry:-11,rz:-3,poses:[pose(0,30,95,5,-10,0,1,1,0),pose(-32,-17,10,7,-13,-1,.98,1,0,.35),pose(-55,-61,-80,10,-16,-2,.95,1,0,.52),pose(-72,-105,-170,13,-19,-3,.92,1,0,.67)]};}
  function family(){return{cx:mobile?.5:.345,cy:mobile?.355:.50,rx:6,ry:-5,rz:0,poses:[pose(-225,45,40,3,-19,-7,.54,1,1,.02),pose(-84,-30,0,7,-11,-3,.55,1,1,.42),pose(84,-30,-30,7,11,3,.55,1,1,.49),pose(220,45,-70,4,20,7,.54,1,1,.56)]};}
  function focus(index,phase=.5){
    const poses=nodes.map((_,i)=>{
      if(i===index)return pose(0,0,70,1.7,-5.5,-.5,.98,1,0);
      const d=i-index;
      // A shared deck retains the same surfaces as each product comes forward.
      return pose(-95-Math.abs(d)*48,-33-Math.abs(d)*22,-250-Math.abs(d)*125,7,-14,-5,.96,1,0,.97);
    });
    return{cx:mobile?.5:.34,cy:mobile?.35:.49,rx:0,ry:0,rz:0,poses};
  }
  function closing(){const s=intro();s.cx=mobile?.5:.33;s.cy=mobile?.35:.51;s.poses.forEach((p,i)=>{p.s*=.83;p.x-=i*3;p.caption=0;});return s;}
  function interp(a,b,t){return{cx:mix(a.cx,b.cx,t),cy:mix(a.cy,b.cy,t),rx:mix(a.rx,b.rx,t),ry:mix(a.ry,b.ry,t),rz:mix(a.rz,b.rz,t),poses:a.poses.map((p,i)=>Object.fromEntries(Object.entries(p).map(([k,n])=>[k,mix(n,b.poses[i][k],t)])))};}
  function sample(p){
    const keys=[{p:0,s:intro()},{p:.035,s:intro()},{p:.145,s:family()},{p:.19,s:family()}];
    for(let i=0;i<4;i++){const start=.20+i*.16;keys.push({p:start+.035,s:focus(i)},{p:start+.123,s:focus(i)},{p:start+.16,s:focus(i)});}
    keys.push({p:.95,s:closing()},{p:1,s:closing()});
    let a=keys[0],b=keys.at(-1);for(let i=1;i<keys.length;i++){if(p<=keys[i].p){a=keys[i-1];b=keys[i];break;}}
    const t=clamp((p-a.p)/(b.p-a.p||1));return interp(a.s,b.s,reduced?(t<.5?0:1):ease(t));
  }
  function apply(){
    const s=sample(progress);
    let cx=s.cx,cy=s.cy;
    lens.style.perspective=`${mobile?1500:2200}px`;
    rig.style.transform=`translate3d(${(cx-.5)*width}px,${(cy-.5)*height}px,0) rotateX(${s.rx}deg) rotateY(${s.ry}deg) rotateZ(${s.rz}deg)`;
    const productIndex=progress>=.2&&progress<.84?Math.min(3,Math.floor((progress-.2)/.16)):-1;
    nodes.forEach((node,i)=>{
      const p=s.poses[i];let x=p.x,y=p.y,z=p.z,rx=p.rx,ry=p.ry,rz=p.rz,size=p.s;
      if(mobile){const introBlend=1-ease((progress-.035)/.07);if(width/height>.75){size*=1-.28*introBlend;x*=1-.20*introBlend;y*=1-.20*introBlend;}
        const familyBlend=ease((progress-.07)/.065)*(1-ease((progress-.19)/.045));x*=1-.34*familyBlend;y*=1-.2*familyBlend;size*=1-.23*familyBlend;}
      // CSS keeps one fixed-size DOM face throughout. No reflow, crossfade swap or cloned front.
      node.object.style.transform=`translate3d(${x*scale}px,${y*scale}px,${z*scale}px) rotateX(${reduced?0:rx}deg) rotateY(${reduced?0:ry}deg) rotateZ(${reduced?0:rz}deg) scale(${size*scale})`;
      node.object.style.opacity=String(p.opacity);node.object.style.visibility=p.opacity>.008?'visible':'hidden';
      node.object.style.setProperty('--caption-opacity',String(p.caption));
      node.object.style.setProperty('--surface-brightness','1');node.object.style.setProperty('--surface-shade',String(p.shade));
      const interact=productIndex<0||productIndex===i;
      node.object.style.pointerEvents=interact&&p.opacity>.25?'auto':'none';node.object.tabIndex=interact&&p.opacity>.25?0:-1;
      node.object.setAttribute('aria-hidden',String(!interact||p.opacity<.1));node.object.inert=!interact;
      if(productIndex===i)node.surface.setStage(clamp((progress-(.2+i*.16)-.035)/.085));
    });
    draws++;if(!ready){ready=true;onReady();}
  }
  let ready=false;
  function frame(time){raf=0;if(disposed||document.hidden)return;const dt=Math.min(.05,(time-(last||time))/1000);last=time;reduced=Boolean(window.__AH_REDUCED_MOTION||matchMedia('(prefers-reduced-motion: reduce)').matches);progress=mix(progress,target,reduced?1:1-Math.exp(-dt*15));if(Math.abs(progress-target)<.000015)progress=target;apply();if(progress!==target)request();}
  function request(){if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(frame);}
  function setProgress(p){target=clamp(Number(p)||0);request();}
  function resize(){width=innerWidth;height=innerHeight;mobile=width<800;scale=mobile?Math.min(width*.94/720,height*.39/450):Math.min(width/1440,height/900,1.18);request();}
  function visibility(){if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}else request();}
  window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);resize();
  Object.defineProperty(window,'__AH_SCENE_DEBUG',{configurable:true,get:()=>({progress,targetProgress:target,view:'same-surface',mobile,animating:!!raf,renderer:'CSS3D',draws,surfaces:nodes.map(n=>({id:n.id,transform:n.object.style.transform,opacity:n.object.style.opacity})),camera:{position:[sample(progress).cx,sample(progress).cy,2200]}})});
  return{setProgress,setView(id){setProgress(id==='overview'?0:.20+ids.indexOf(id)*.16+.10);},setTheme(){},dispose(){disposed=true;if(raf)cancelAnimationFrame(raf);nodes.forEach(n=>n.surface.dispose());window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);lens.remove();delete window.__AH_SCENE_DEBUG;}};
}
