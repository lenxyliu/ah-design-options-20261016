import {createProductSurfaces} from './product-surfaces.js';
import {products} from './content.js';

const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
const intents=['云端运行','企业管控','专业技能','自托管空间'];
const rules=['CLOUD RUNTIME','ENTERPRISE CONTROL','SKILL ECOSYSTEM','SELF-HOSTED SPACE'];

export function createCubeUnfoldStage({container,onSelect=()=>{},onReady=()=>{}}){
  const lens=document.createElement('div');lens.className='cube-lens';
  const rig=document.createElement('div');rig.className='cube-rig';lens.append(rig);container.append(lens);
  const nodes=products.map((product,index)=>{
    const object=document.createElement('div');object.className='unfold-object';object.dataset.cube=product.id;object.tabIndex=0;object.setAttribute('role','button');object.setAttribute('aria-label',`展开 ${product.name}，${product.category}`);
    const code=String(index+1).padStart(2,'0');
    object.innerHTML=`<div class="hinge hinge-left"><div class="unfold-sheet sheet-left"><div class="surface-crop"></div><div class="surface-coat coat-side"><span>${intents[index]}</span><small>${rules[index]}</small></div><div class="surface-seam"></div></div></div><div class="unfold-sheet sheet-center"><div class="surface-crop"></div><div class="surface-coat coat-center"><span class="cube-face-code">${code}</span><strong>${product.name}</strong><small>${rules[index]}</small><i class="cube-face-band" aria-hidden="true"></i></div><div class="surface-seam"></div></div><div class="hinge hinge-right"><div class="unfold-sheet sheet-right"><div class="surface-crop"></div><div class="surface-coat coat-side"><span>${intents[index]}</span><small>${rules[index]}</small></div><div class="surface-seam"></div></div></div><div class="hinge hinge-top"><div class="unfold-cap cap-top"><span class="cap-monogram">AH<span>AGENT HOSTING</span></span><div class="cap-rule"></div></div></div><div class="hinge hinge-bottom"><div class="unfold-cap cap-bottom"><div class="cap-rule"></div></div></div><div class="unfold-rear"></div><div class="face-pin"><span>${code}</span><i></i><strong>${product.name}</strong></div>`;
    const surfaces=[...object.querySelectorAll('.surface-crop')].map((crop,part)=>{
      const surface=createProductSurfaces({products});surface.setProduct(product.id);surface.element.setAttribute('aria-hidden','true');crop.append(surface.element);return{surface,crop,sourceX:part*240};
    });
    object.addEventListener('click',()=>onSelect(product.id));object.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(product.id);}});
    rig.append(object);
    return{object,surfaces,id:product.id,center:object.querySelector('.sheet-center'),left:object.querySelector('.hinge-left'),right:object.querySelector('.hinge-right'),top:object.querySelector('.hinge-top'),bottom:object.querySelector('.hinge-bottom'),caps:[...object.querySelectorAll('.unfold-cap')],rear:object.querySelector('.unfold-rear'),pin:object.querySelector('.face-pin'),lastStage:-1};
  });
  let width=innerWidth,height=innerHeight,mobile=width<800,scale=1,progress=0,target=0,raf=0,last=0,ready=false,disposed=false,draws=0;
  let reduced=Boolean(window.__AH_REDUCED_MOTION||matchMedia('(prefers-reduced-motion: reduce)').matches);
  const pose=(x,y,z,s=1,shade=0,rx=-18,ry=-30,rz=-3)=>({x,y,z,s,shade,rx,ry,rz});
  function intro(){return{cx:mobile?.5:.54,cy:mobile?(width/height>.75?.45:.45):.55,poses:[pose(-65,50,115,1.22,0),pose(-300,-105,-80,.83,.12,-17,-32,-6),pose(215,-140,-170,.82,.2,-22,-25,2),pose(220,165,-90,.79,.12,-14,-33,3)]};}
  function family(){return{cx:mobile?.5:.34,cy:mobile?.345:.49,poses:[pose(-185,120,75,.87,0),pose(-175,-135,-40,.77,.18),pose(125,-135,-100,.77,.24),pose(150,120,-60,.81,.16)]};}
  function focus(index){return{cx:mobile?.5:.34,cy:mobile?.35:.49,poses:nodes.map((_,i)=>i===index?pose(0,0,30,.98,0):pose(-320-(Math.abs(i-index)*35),-50-Math.abs(i-index)*40,-400-Math.abs(i-index)*160,.72,.94))};}
  function closing(){const s=intro();s.cx=mobile?.5:.33;s.cy=mobile?.35:.50;s.poses.forEach(p=>{p.s*=.86;p.x*=.86;p.y*=.86;});return s;}
  function interp(a,b,t){return{cx:mix(a.cx,b.cx,t),cy:mix(a.cy,b.cy,t),poses:a.poses.map((pose,i)=>Object.fromEntries(Object.entries(pose).map(([key,value])=>[key,mix(value,b.poses[i][key],t)])))};}
  function sample(p){
    const keys=[{p:0,s:intro()},{p:.055,s:intro()},{p:.14,s:family()},{p:.19,s:family()}];
    for(let i=0;i<4;i++){const start=.2+i*.16;keys.push({p:start+.025,s:focus(i)},{p:start+.145,s:focus(i)},{p:start+.16,s:focus(i)});}
    keys.push({p:.95,s:closing()},{p:1,s:closing()});
    let a=keys[0],b=keys.at(-1);for(let i=1;i<keys.length;i++){if(p<=keys[i].p){a=keys[i-1];b=keys[i];break;}}
    const t=clamp((p-a.p)/(b.p-a.p||1));return interp(a.s,b.s,reduced?(t<.5?0:1):ease(t));
  }
  function opening(p,index){const local=(p-(.2+index*.16))/.16;if(local<0||local>1)return 0;return ease((local-.19)/.31)*(1-ease((local-.81)/.19));}
  function surfaceGeometry(node,amount,index){
    const fold=reduced?(amount>.5?1:0):amount;
    const wing=fold*90;
    const grow=ease((fold-.18)/.82);
    const H=mix(240,450,grow),D=mix(240,12,ease((fold-.22)/.78));
    const capDepth=mix(240,5,ease((fold-.38)/.62));
    const capWidth=mix(240,720,ease((fold-.52)/.48));
    const reveal=ease((fold-.15)/.72);
    node.object.style.setProperty('--surface-reveal',String(reveal));
    node.object.style.setProperty('--fold-seam',String((1-ease((fold-.8)/.2))*.38));
    node.object.style.setProperty('--cap-label',String(1-ease(fold/.42)));
    const centerZ=D/2;
    node.center.style.height=H+'px';node.center.style.transform=`translate3d(-120px,${-H/2}px,${centerZ}px)`;
    node.left.style.transform=`translate3d(-120px,0,${centerZ}px) rotateY(${-90+wing}deg)`;
    node.right.style.transform=`translate3d(120px,0,${centerZ}px) rotateY(${90-wing}deg)`;
    node.left.firstElementChild.style.height=H+'px';node.left.firstElementChild.style.top=-H/2+'px';
    node.right.firstElementChild.style.height=H+'px';node.right.firstElementChild.style.top=-H/2+'px';
    node.top.style.transform=`translate3d(0,${-H/2}px,${centerZ}px) rotateX(${90-wing}deg)`;
    node.bottom.style.transform=`translate3d(0,${H/2}px,${centerZ}px) rotateX(${-90+wing}deg)`;
    node.caps.forEach((cap,i)=>{cap.style.width=capWidth+'px';cap.style.height=capDepth+'px';cap.style.left=-capWidth/2+'px';cap.style.top=i===0?-capDepth+'px':'0';});
    node.rear.style.width=capWidth+'px';node.rear.style.height=H+'px';node.rear.style.transform=`translate3d(${-capWidth/2}px,${-H/2}px,${-D/2}px) rotateY(180deg)`;
    node.pin.style.transform=`translate3d(-112px,${H/2+15}px,${centerZ+1}px)`;
    node.surfaces.forEach(({crop,sourceX})=>{crop.style.top=-(450-H)/2+'px';crop.style.left=-sourceX+'px';});
    const step=Math.min(2,Math.floor(reveal*3));if(step!==node.lastStage){node.surfaces.forEach(({surface})=>surface.setStage(reveal));node.lastStage=step;}
    return{fold,H,D,capDepth,capWidth,reveal,leftAngle:-90+wing,rightAngle:90-wing};
  }
  let shown=[];
  function apply(){
    const state=sample(progress),productIndex=progress>=.2&&progress<.84?Math.min(3,Math.floor((progress-.2)/.16)):-1;
    lens.style.perspective=`${mobile?1500:2200}px`;
    rig.style.transform=`translate3d(${(state.cx-.5)*width}px,${(state.cy-.5)*height}px,0)`;
    shown=nodes.map((node,i)=>{
      const pose=state.poses[i],amount=opening(progress,i),morph=surfaceGeometry(node,amount,i);
      const rx=mix(pose.rx,1,morph.fold),ry=mix(pose.ry,-4,morph.fold),rz=mix(pose.rz,0,morph.fold);
      let size=pose.s,x=pose.x,y=pose.y;
      if(mobile){const hero=1-ease((progress-.055)/.085);size*=1+.14*hero;x*=1-.25*hero;y*=1-.2*hero;if(width/height>.75)size*=1-.10*hero;}
      node.object.style.transform=`translate3d(${x*scale}px,${y*scale}px,${pose.z*scale}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${size*scale})`;
      node.object.style.setProperty('--object-shade',String(pose.shade));
      const interact=productIndex<0||productIndex===i;node.object.style.pointerEvents=interact?'auto':'none';node.object.tabIndex=interact?0:-1;node.object.inert=!interact;node.object.setAttribute('aria-hidden',String(!interact));
      return{id:node.id,...morph,transform:node.object.style.transform,frontNode:node.center.dataset.identity};
    });
    draws++;if(!ready){ready=true;onReady();}
  }
  function frame(time){raf=0;if(disposed||document.hidden)return;const dt=Math.min(.05,(time-(last||time))/1000);last=time;reduced=Boolean(window.__AH_REDUCED_MOTION||matchMedia('(prefers-reduced-motion: reduce)').matches);progress=mix(progress,target,reduced?1:1-Math.exp(-dt*16));if(Math.abs(progress-target)<.000015)progress=target;apply();if(progress!==target)request();}
  function request(){if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(frame);}
  function setProgress(p){target=clamp(Number(p)||0);request();}
  function resize(){width=innerWidth;height=innerHeight;mobile=width<800;scale=mobile?Math.min(width*.92/720,height*.38/450):Math.min(width/1440,height/930,1.18);request();}
  function visibility(){if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}else request();}
  nodes.forEach((n,i)=>n.center.dataset.identity='cube-front-'+products[i].id);
  window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);resize();
  Object.defineProperty(window,'__AH_SCENE_DEBUG',{configurable:true,get:()=>({progress,targetProgress:target,view:'cube-surface-unfold',renderer:'CSS3D hinges',mobile,animating:!!raf,draws,surfaces:shown,camera:{position:[sample(progress).cx,sample(progress).cy,2200]}})});
  return{setProgress,setView(id){setProgress(id==='overview'?0:.20+products.findIndex(p=>p.id===id)*.16+.1);},setTheme(){},dispose(){disposed=true;if(raf)cancelAnimationFrame(raf);nodes.forEach(n=>n.surfaces.forEach(s=>s.surface.dispose()));window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);lens.remove();delete window.__AH_SCENE_DEBUG;}};
}
