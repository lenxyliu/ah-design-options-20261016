import {createProductSurfaces} from './product-surfaces.js';
import {products} from './content.js';

const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
const intents=['云端运行','企业管控','专业技能','自托管空间'];
const rules=['CLOUD RUNTIME','ENTERPRISE CONTROL','SKILL ECOSYSTEM','SELF-HOSTED SPACE'];

// One soft studio key stays fixed in world space as each physical face turns.
const unit=v=>{const length=Math.hypot(...v);return v.map(n=>n/length);};
const keyLight=unit([-.45,-.72,.65]),halfLight=unit([keyLight[0],keyLight[1],keyLight[2]+1]);
function faceNormal(angle,axis,rx,ry,rz){
  const rad=Math.PI/180,a=angle*rad,x=rx*rad,y=ry*rad,z=rz*rad;
  let v=axis==='x'?[0,-Math.sin(a),Math.cos(a)]:[Math.sin(a),0,Math.cos(a)];
  v=[v[0]*Math.cos(z)-v[1]*Math.sin(z),v[0]*Math.sin(z)+v[1]*Math.cos(z),v[2]];
  v=[v[0]*Math.cos(y)+v[2]*Math.sin(y),v[1],-v[0]*Math.sin(y)+v[2]*Math.cos(y)];
  return[v[0],v[1]*Math.cos(x)-v[2]*Math.sin(x),v[1]*Math.sin(x)+v[2]*Math.cos(x)];
}
const dot=(a,b)=>a.reduce((sum,value,index)=>sum+value*b[index],0);

export function createCubeUnfoldStage({container,onSelect=()=>{},onReady=()=>{}}){
  const lens=document.createElement('div');lens.className='cube-lens';
  const rig=document.createElement('div');rig.className='cube-rig';lens.append(rig);container.append(lens);
  const nodes=products.map((product,index)=>{
    const object=document.createElement('div');object.className='unfold-object';object.dataset.cube=product.id;object.tabIndex=0;object.setAttribute('role','button');object.setAttribute('aria-label',`展开 ${product.name}，${product.category}`);
    const code=String(index+1).padStart(2,'0');
    object.innerHTML=`<div class="hinge hinge-left"><div class="unfold-sheet sheet-left"><div class="surface-crop"></div><div class="surface-coat coat-side"><span>${intents[index]}</span><small>${rules[index]}</small></div><div class="surface-seam"></div></div></div><div class="unfold-sheet sheet-center"><div class="surface-crop"></div><div class="surface-coat coat-center"><span class="cube-face-code">${code}</span><strong>${product.name}</strong><small>${rules[index]}</small><i class="cube-face-band" aria-hidden="true"></i></div><div class="surface-seam"></div></div><div class="hinge hinge-right"><div class="unfold-sheet sheet-right"><div class="surface-crop"></div><div class="surface-coat coat-side"><span>${intents[index]}</span><small>${rules[index]}</small></div><div class="surface-seam"></div></div></div><div class="hinge hinge-top"><div class="unfold-cap cap-top"><span class="cap-monogram">AH<span>AGENT HOSTING</span></span><div class="cap-rule"></div></div></div><div class="hinge hinge-bottom"><div class="unfold-cap cap-bottom"><div class="cap-rule"></div></div></div><div class="unfold-rear"></div><div class="face-pin"><span>${code}</span><i></i><strong>${product.name}</strong></div>`;
    const caps=[object.querySelector('.cap-top'),object.querySelector('.cap-bottom')];
    const returns=caps.map((cap,i)=>{
      const hinge=document.createElement('div');hinge.className='paper-return-hinge';
      const flap=document.createElement('div');flap.className='unfold-cap paper-return '+(i?'return-bottom':'return-top');flap.setAttribute('aria-hidden','true');hinge.append(flap);cap.parentNode.append(hinge);
      const score=document.createElement('div');score.className='paper-cross-score';score.setAttribute('aria-hidden','true');cap.append(score);
      return{hinge,flap};
    });
    // A paper hinge is a connected ribbon, not two separately offset plates.
    // The ribbons own their endpoints; adjoining panels use those same points.
    const makeJoint=parent=>Array.from({length:10},()=>{
      const face=document.createElement('div');face.className='paper-joint';face.setAttribute('aria-hidden','true');
      face.style.cssText='position:absolute;left:0;top:0;width:240px;transform-origin:0 0;backface-visibility:visible;pointer-events:none';parent.append(face);
      return{face,angle:0};
    });
    const lidJoints=caps.map(()=>makeJoint(object));
    const returnJoints=caps.map(cap=>makeJoint(cap.parentNode));
    const creases=['left','right'].map(side=>{
      const strip=document.createElement('div');strip.className='paper-crease crease-'+side;strip.setAttribute('aria-hidden','true');object.querySelector('.hinge-'+side).append(strip);return strip;
    });
    const sheets=[...object.querySelectorAll('.unfold-sheet')];
    const stockThickness=52/64;
    const sheetBacks=sheets.map((sheet,part)=>{
      const center=part===1,parent=center?object:sheet.parentNode;
      const backing=document.createElement('div');backing.className='stock-backing backing-'+['left','center','right'][part];backing.setAttribute('aria-hidden','true');parent.append(backing);return backing;
    });
    const capLeaves=[...caps,...returns.map(item=>item.flap)];
    const capBacks=capLeaves.map((cap,part)=>{
      const backing=document.createElement('div');backing.className='cap-backing '+(part%2?'backing-bottom':'backing-top');backing.setAttribute('aria-hidden','true');cap.parentNode.append(backing);
      const edges=(part<2?['left','right']:['outer','left','right']).map(edge=>{const wall=document.createElement('div');wall.className='cap-edge edge-'+edge+(edge==='outer'?' edge-top':'');wall.setAttribute('aria-hidden','true');cap.parentNode.append(wall);return wall;});
      return{backing,edges};
    });
    sheets.forEach((sheet,part)=>{
      const laminate=document.createElement('div');laminate.className='sheet-laminate';laminate.setAttribute('aria-hidden','true');sheet.append(laminate);
      const center=part===1,parent=center?object:sheet.parentNode;
      for(const edge of center?['top','bottom','left','right']:['top','bottom','outer']){const wall=document.createElement('div');wall.className='sheet-wall wall-'+edge+(center?' center-wall':'');wall.setAttribute('aria-hidden','true');parent.append(wall);}
    });
    const shadow=document.createElement('div');shadow.className='studio-shadow';shadow.setAttribute('aria-hidden','true');rig.append(shadow);
    const surfaces=[...object.querySelectorAll('.surface-crop')].map((crop,part)=>{
      const surface=createProductSurfaces({products});surface.setProduct(product.id);surface.element.setAttribute('aria-hidden','true');crop.append(surface.element);return{surface,crop,sourceX:part*240};
    });
    object.addEventListener('click',()=>onSelect(product.id));object.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(product.id);}});
    rig.append(object);
    return{object,surfaces,sheets,sheetBacks,capBacks,stockThickness,lidJoints,returnJoints,shadow,caps,returns,creases,id:product.id,center:object.querySelector('.sheet-center'),left:object.querySelector('.hinge-left'),right:object.querySelector('.hinge-right'),top:object.querySelector('.hinge-top'),bottom:object.querySelector('.hinge-bottom'),rear:object.querySelector('.unfold-rear'),pin:object.querySelector('.face-pin'),lastStage:-1};
  });
  let width=innerWidth,height=innerHeight,mobile=width<800,scale=1,progress=0,target=0,raf=0,last=0,ready=false,disposed=false,draws=0;
  let reduced=Boolean(window.__AH_REDUCED_MOTION||matchMedia('(prefers-reduced-motion: reduce)').matches);
  const pose=(x,y,z,s=1,shade=0,rx=-18,ry=-30,rz=-3)=>({x,y,z,s,shade,rx,ry,rz});
  function intro(){return{cx:mobile?.5:.54,cy:mobile?(width/height>.75?.45:.45):.55,poses:[pose(-65,50,115,1.22,0),pose(-300,-105,-80,.83,.12,-17,-32,-6),pose(215,-140,-170,.82,.2,-22,-25,2),pose(220,165,-90,.79,.12,-14,-33,3)]};}
  function family(){return{cx:mobile?.5:.34,cy:mobile?.345:.49,poses:[pose(-185,120,75,.87,0),pose(-175,-135,-40,.77,.18),pose(125,-135,-100,.77,.24),pose(150,120,-60,.81,.16)]};}
  // Each inactive product has its own depth lane. A product clears the group
  // before crossing laterally, so no two closed volumes travel through one another.
  const parkedPose=i=>pose(-420-i*50,-100-i*40,-760-i*320,.60,.96);
  function parked(){return{cx:mobile?.5:.34,cy:mobile?.35:.49,poses:nodes.map((_,i)=>parkedPose(i))};}
  function focus(index){const state=parked();state.poses[index]=pose(0,0,30,.98,0);return state;}
  function approach(index){const state=parked();state.poses[index]=pose(0,0,state.poses[index].z,.98,.36);return state;}
  function depart(index){const state=approach(index);state.poses[index].shade=.96;return state;}
  function lifted(useFamily=false){const state=useFamily?family():intro();state.poses[0].z=330;return state;}
  function clearedFamily(){const state=family();state.poses.forEach((p,i)=>{if(i){p.z=parkedPose(i).z;p.shade=.96;}});return state;}
  function closing(){const s=intro();s.cx=mobile?.5:.33;s.cy=mobile?.35:.50;s.poses.forEach(p=>{p.s*=.86;p.x*=.86;p.y*=.86;});return s;}
  function interp(a,b,t){return{cx:mix(a.cx,b.cx,t),cy:mix(a.cy,b.cy,t),poses:a.poses.map((pose,i)=>Object.fromEntries(Object.entries(pose).map(([key,value])=>[key,mix(value,b.poses[i][key],t)])))};}
  function sample(p){
    const keys=[{p:0,s:intro()},{p:.055,s:intro()},{p:.075,s:lifted()},{p:.125,s:lifted(true)},{p:.14,s:family()},{p:.19,s:family()},{p:.20,s:clearedFamily()}];
    for(let i=0;i<4;i++){
      const start=.2+i*.16;
      if(i)keys.push({p:start+.004,s:depart(i-1)},{p:start+.008,s:parked()},{p:start+.016,s:approach(i)});
      keys.push({p:start+.025,s:focus(i)},{p:start+.145,s:focus(i)},{p:start+.16,s:focus(i)});
    }
    const closingApproach=closing();closingApproach.poses.forEach((p,i)=>{p.z=parkedPose(i).z;p.shade=.85;});
    keys.push({p:.848,s:depart(3)},{p:.86,s:parked()},{p:.90,s:closingApproach});
    keys.push({p:.95,s:closing()},{p:1,s:closing()});
    let a=keys[0],b=keys.at(-1);for(let i=1;i<keys.length;i++){if(p<=keys[i].p){a=keys[i-1];b=keys[i];break;}}
    const t=clamp((p-a.p)/(b.p-a.p||1));return interp(a.s,b.s,reduced?(t<.5?0:1):ease(t));
  }
  // Allocate scroll distance to visible hinge stages, with observation holds.
  const unfoldStops=[[0,0],[.16,0],[.30,.50],[.42,.50],[.56,.82],[.64,.82],[.71,1],[.90,1],[1,0]];
  function opening(p,index){
    const local=(p-(.2+index*.16))/.16;if(local<0||local>1)return 0;
    for(let i=1;i<unfoldStops.length;i++){const a=unfoldStops[i-1],b=unfoldStops[i];if(local<=b[0])return mix(a[1],b[1],ease((local-a[0])/(b[0]-a[0])));}
    return 0;
  }
  function jointRibbon(parts,points,direction,parentAngle=0){
    parts.forEach((part,i)=>{
      const a=points[i],b=points[i+1],dy=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dy,dz);
      part.face.style.display=length<.00001?'none':'block';if(length<.00001)return;
      const ty=dy/length,tz=dz/length,ny=-direction*tz,nz=direction*ty;
      // Keep the CSS box one exact pixel tall; the transform owns its length.
      // This avoids a separate layout rounding at every ribbon segment.
      part.face.style.height='1px';
      part.face.style.transform=`matrix3d(${direction},0,0,0,0,${dy},${dz},0,0,${ny},${nz},0,${direction<0?120:-120},${a[0]},${a[1]},1)`;
      part.angle=Math.atan2(-ny,nz)*180/Math.PI+parentAngle;
    });
  }
  function surfaceGeometry(node,amount,index){
    const fold=reduced?(amount>.5?1:0):amount;
    const wing=fold*90;
    const grow=ease((fold-.18)/.82);
    const H=Math.round(mix(240,450,grow)*32)/32,D=mix(240,12,ease((fold-.22)/.78));
    // Each lid is two real 120px paper leaves. Its outer leaf folds back,
    // then both leaves tuck behind the interface without telescoping away.
    const capDepth=120,capWidth=240;
    const returnAngle=180*ease((fold-.45)/.33);
    const backT=clamp((fold-.60)/.40);
    // Fold outward first, then around the back of the same edge. Front-load
    // the return so the final reading approach does not hide a fast flip.
    const capAngle=fold<=.50?90-wing:fold<=.60?mix(45,0,ease((fold-.50)/.10)):180*ease(1-(1-backT)*(1-backT));
    // The stock brightens first, then its existing interface ink develops on
    // that very same surface. All three crops share one reveal and source.
    const reveal=ease((fold-.34)/.60);
    node.object.style.setProperty('--surface-reveal',String(reveal));
    node.object.style.setProperty('--print-reveal',String(reveal));
    node.object.style.setProperty('--fold-seam',String((1-ease((fold-.8)/.2))*.38));
    node.object.style.setProperty('--cap-label',String(1-ease(fold/.42)));
    node.object.style.setProperty('--shell-label',String(1-ease((fold-.08)/.26)));
    node.object.style.setProperty('--hinge-ao',String(.16*Math.pow(1-fold,1.5)));
    node.object.style.setProperty('--shell-open',String(fold));
    node.object.style.setProperty('--cap-rim',String(ease((fold-.82)/.18)));
    node.object.style.setProperty('--paper-presence',String(ease((fold-.10)/.75)));
    node.object.style.setProperty('--crease-active',String(Math.sin(fold*Math.PI)));
    node.object.style.setProperty('--crease-depth',String(Math.sin(fold*Math.PI)*(1-ease((fold-.88)/.12))));
    node.object.style.setProperty('--return-fold',String(ease((fold-.45)/.33)));
    node.object.style.setProperty('--edge-exposure',String(ease((fold-.06)/.18)));
    const centerZ=D/2;
    node.center.style.height=H+'px';node.center.style.transform=`translate3d(-120px,${-H/2}px,${centerZ}px)`;
    node.left.style.transform=`translate3d(-120px,0,${centerZ}px) rotateY(${-90+wing}deg)`;
    node.right.style.transform=`translate3d(120px,0,${centerZ}px) rotateY(${90-wing}deg)`;
    node.left.firstElementChild.style.height=H+'px';node.left.firstElementChild.style.top=-H/2+'px';
    node.right.firstElementChild.style.height=H+'px';node.right.firstElementChild.style.top=-H/2+'px';
    // Allow the actual stock and its return leaf to clear the front canvas.
    // The old sub-pixel gap let the return tip cross its own interface.
    const tuck=ease((fold-.55)/.25)*8;
    node.top.style.transform=`translate3d(0,${-H/2}px,${centerZ-tuck}px) rotateX(${capAngle}deg)`;
    node.bottom.style.transform=`translate3d(0,${H/2}px,${centerZ-tuck}px) rotateX(${-capAngle}deg)`;
    node.caps.forEach((cap,i)=>{cap.style.width=capWidth+'px';cap.style.height=capDepth+'px';cap.style.left=-capWidth/2+'px';cap.style.top=i===0?-capDepth+'px':'0';});
    node.returns.forEach(({hinge,flap},i)=>{
      // Rotate around the paper's back, so a closed lid is exactly coplanar.
      // The tiny bend radius also keeps the folded stocks from interpenetrating.
      const bendRadius=node.stockThickness+.1;
      hinge.style.transform=`translate3d(0,${i?capDepth:-capDepth}px,${-bendRadius}px) rotateX(${i?-returnAngle:returnAngle}deg) translateZ(${bendRadius}px)`;
      flap.style.width=capWidth+'px';flap.style.height=capDepth+'px';flap.style.left=-capWidth/2+'px';flap.style.top=(i?0:-capDepth)+'px';
      const direction=i?1:-1,points=node.returnJoints[i].map((_,j)=>j/node.returnJoints[i].length);points.push(1);
      const arc=points.map(t=>{const angle=returnAngle*t*Math.PI/180;return[direction*capDepth+direction*bendRadius*Math.sin(angle),-bendRadius+bendRadius*Math.cos(angle)];});
      jointRibbon(node.returnJoints[i],arc,direction,i?-capAngle:capAngle);
    });
    node.lidJoints.forEach((parts,i)=>{
      const direction=i?1:-1,angle=capAngle*Math.PI/180,handle=tuck*.5*(.12+.88*Math.sin(angle)),edge=direction*H/2;
      const p0=[0,centerZ],p1=[direction*handle,centerZ],p2=[-direction*Math.cos(angle)*handle,centerZ-tuck+Math.sin(angle)*handle],p3=[0,centerZ-tuck];
      const points=Array.from({length:parts.length+1},(_,j)=>{const t=j/parts.length,u=1-t;return[edge+u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]];});
      jointRibbon(parts,points,direction);
    });
    const thickness=node.stockThickness;
    node.capBacks.forEach(({backing,edges},part)=>{
      const top=part%2===0,leafTop=top?-capDepth:0;
      backing.style.cssText=`left:-120px;top:${leafTop}px;width:240px;height:${capDepth}px;transform:translateZ(${-thickness}px) rotateY(180deg)`;
      for(const wall of edges){
        const outer=wall.classList.contains('edge-outer'),left=wall.classList.contains('edge-left');
        wall.style.left=(outer||left?-120:120)+'px';wall.style.top=(outer?(top?-capDepth:capDepth):leafTop)+'px';
        wall.style.width=(outer?240:thickness)+'px';wall.style.height=(outer?thickness:capDepth)+'px';
        wall.style.transform=`rotate${outer?'X(-90':'Y(90'}deg)`;
      }
    });
    node.creases.forEach((strip,i)=>{
      const angle=i?90-wing:-90+wing;strip.style.height=H+'px';strip.style.top=-H/2+'px';strip.style.transform=`translateZ(.55px) rotateY(${-angle/2}deg)`;
    });
    node.rear.style.width=capWidth+'px';node.rear.style.height=H+'px';node.rear.style.transform=`translate3d(${-capWidth/2}px,${-H/2}px,${-D/2}px) rotateY(180deg)`;
    node.pin.style.transform=`translate3d(-112px,${H/2+15}px,${centerZ+1}px)`;
    node.surfaces.forEach(({crop,sourceX})=>{crop.style.top=-(450-H)/2+'px';crop.style.left=-sourceX+'px';});
    node.sheets.forEach((sheet,part)=>{
      // All paper panels retain their physical width throughout the fold.
      sheet.style.width='240px';
      const x=part===0?-240:0,center=part===1;
      const backing=node.sheetBacks[part];backing.style.left=(center?-120:x)+'px';backing.style.top=-H/2+'px';backing.style.width=sheet.style.width;backing.style.height=H+'px';backing.style.transform=`translateZ(${center?centerZ-thickness:-thickness}px) rotateY(180deg)`;
      // The thin wing walls inherit exactly the same hinge as their front.
      const parent=center?node.object:sheet.parentNode;
      for(const wall of parent.querySelectorAll(center?':scope > .center-wall':':scope > .sheet-wall')){
        wall.style.left=(center?-120:x)+'px';wall.style.width='240px';
        const vertical=wall.classList.contains('wall-outer')||wall.classList.contains('wall-left')||wall.classList.contains('wall-right');
        if(vertical){
          wall.style.width=thickness+'px';wall.style.height=H+'px';wall.style.top=-H/2+'px';wall.style.left=(center?(wall.classList.contains('wall-left')?-120:120):(part===0?-240:240))+'px';wall.style.transform=`translateZ(${center?centerZ:0}px) rotateY(90deg)`;
        }else{wall.style.height=thickness+'px';wall.style.top=(wall.classList.contains('wall-top')?-H/2:H/2)+'px';wall.style.transform=`translateZ(${center?centerZ:0}px) rotateX(-90deg)`;}
      }
    });
    const step=Math.min(2,Math.floor(reveal*3));if(step!==node.lastStage){node.surfaces.forEach(({surface})=>surface.setStage(reveal));node.lastStage=step;}
    return{fold,H,D,capDepth,capWidth,capAngle,returnAngle,reveal,leftAngle:-90+wing,rightAngle:90-wing};
  }
  let shown=[];
  function apply(){
    const state=sample(progress),productIndex=progress>=.2&&progress<.84?Math.min(3,Math.floor((progress-.2)/.16)):-1;
    lens.style.perspective=`${mobile?1500:2200}px`;
    rig.style.transform=`translate3d(${(state.cx-.5)*width}px,${(state.cy-.5)*height}px,0)`;
    shown=nodes.map((node,i)=>{
      const pose=state.poses[i],amount=opening(progress,i),morph=surfaceGeometry(node,amount,i);
      const rx=mix(pose.rx,1,morph.fold),ry=mix(pose.ry,-4,morph.fold),rz=mix(pose.rz,0,morph.fold);
      const faces=[node.center,node.sheets[0],node.sheets[2],...node.caps,...node.returns.map(r=>r.flap)];
      const angles=[0,morph.leftAngle,morph.rightAngle,morph.capAngle,-morph.capAngle,morph.capAngle+morph.returnAngle,-morph.capAngle-morph.returnAngle];
      const lighting=faces.map((face,j)=>{
        const n=faceNormal(angles[j],j>2?'x':'y',rx,ry,rz),diffuse=Math.max(0,dot(n,keyLight)),specular=Math.pow(Math.max(0,dot(n,halfLight)),18);
        const read=j<3?1-morph.reveal:1;
        face.style.setProperty('--face-dark',String((.13*(1-diffuse))*read));
        face.style.setProperty('--face-spec',String((.008+.025*specular)*read));
        face.style.setProperty('--spec-x',(48+n[0]*95)+'%');face.style.setProperty('--spec-y',(10+n[1]*65)+'%');
        const backing=j<3?node.sheetBacks[[1,0,2][j]]:node.capBacks[j-3].backing;
        const backDiffuse=Math.max(0,-dot(n,keyLight));backing.style.setProperty('--face-dark',String(.10*(1-backDiffuse)));backing.style.setProperty('--face-spec','.008');
        return{diffuse,specular};
      });
      for(const part of [...node.lidJoints.flat(),...node.returnJoints.flat()]){
        const normal=faceNormal(part.angle,'x',rx,ry,rz);
        part.face.style.setProperty('--face-dark',String(.08*(1-Math.abs(dot(normal,keyLight)))));
      }
      let size=pose.s,x=pose.x,y=pose.y;
      if(mobile&&width/height>.75){const hero=1-ease((progress-.055)/.085);size*=1-.10*hero;}
      const objectScale=size*scale;
      node.object.style.transform=`translate3d(${x*scale}px,${y*scale}px,${pose.z*scale}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale3d(${objectScale},${objectScale},${objectScale})`;
      node.object.style.setProperty('--object-shade',String(pose.shade));
      node.shadow.style.width=mix(350,850,morph.fold)*objectScale+'px';node.shadow.style.height=mix(95,110,morph.fold)*objectScale+'px';
      node.shadow.style.transform=`translate3d(${x*scale+35*objectScale}px,${y*scale+mix(192,270,morph.fold)*objectScale}px,${Math.min(0,pose.z*scale-140)}px) translate(-50%,-50%)`;
      node.shadow.style.opacity=String((1-pose.shade)*.7);
      node.shadow.style.setProperty('--paper-shadow',String((1-pose.shade)*.44));
      const interact=productIndex<0||productIndex===i;node.object.style.pointerEvents=interact?'auto':'none';node.object.tabIndex=interact?0:-1;node.object.inert=!interact;node.object.setAttribute('aria-hidden',String(!interact));
      return{id:node.id,...morph,lighting,transform:node.object.style.transform,frontNode:node.center.dataset.identity};
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
  return{setProgress,setView(id){setProgress(id==='overview'?0:.20+products.findIndex(p=>p.id===id)*.16+.16*.76);},setTheme(){},dispose(){disposed=true;if(raf)cancelAnimationFrame(raf);nodes.forEach(n=>n.surfaces.forEach(s=>s.surface.dispose()));window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);lens.remove();delete window.__AH_SCENE_DEBUG;}};
}
