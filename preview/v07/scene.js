import * as THREE from './vendor/three.module.min.js';

const C={azure:0x245BFF,sky:0x3895FF,navy:0x102A50,ice:0xEAF4FF,white:0xFFFFFF};
const IDS=['lighthouse','clawpro','skillhub','octop'];
const mix=THREE.MathUtils.lerp,clamp=THREE.MathUtils.clamp;
const smooth=t=>t*t*(3-2*t);
const v=a=>new THREE.Vector3(...a);

export function createScene({canvas,onSelect=()=>{},onHover=()=>{},onLabels=()=>{},onReady=()=>{}}){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setClearColor(C.navy,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=.92;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(38,1,.1,120);
  const resources=new Set();const modules=[];const hits=[];const container=new THREE.Group();scene.add(container);
  let width=1,height=1,mobile=false,aspect=1,disposed=false,raf=0,lastTime=0,ready=false;
  let progress=0,targetProgress=0,manual=null,expanded=false,hovered=null,theme='dark';
  let pointerTarget=new THREE.Vector2(),pointerCurrent=new THREE.Vector2();
  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
  const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');let reduced=motionQuery.matches;
  const geometries=new Map();
  function keep(x){resources.add(x);return x;}
  function rounded(w,h,d,r=.035){
    const key=[w,h,d,r].join(',');if(geometries.has(key))return geometries.get(key);
    r=Math.min(r,w*.24,h*.24,d*.24);const W=w-2*r,H=h-2*r,cr=Math.min(.012,r*.35);
    const x=-W/2,y=-H/2,s=new THREE.Shape();s.moveTo(x+cr,y);s.lineTo(x+W-cr,y);s.quadraticCurveTo(x+W,y,x+W,y+cr);s.lineTo(x+W,y+H-cr);s.quadraticCurveTo(x+W,y+H,x+W-cr,y+H);s.lineTo(x+cr,y+H);s.quadraticCurveTo(x,y+H,x,y+H-cr);s.lineTo(x,y+cr);s.quadraticCurveTo(x,y,x+cr,y);
    const g=keep(new THREE.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:r,bevelThickness:r,curveSegments:5}));g.translate(0,0,-d/2+r);g.computeVertexNormals();
    const positions=g.getAttribute('position'),normals=g.getAttribute('normal');
    for(let i=0;i<positions.count;i++){const px=positions.getX(i),py=positions.getY(i),pz=positions.getZ(i);let nx=px-clamp(px,-w/2+r,w/2-r),ny=py-clamp(py,-h/2+r,h/2-r),nz=pz-clamp(pz,-d/2+r,d/2-r);const length=Math.hypot(nx,ny,nz);if(length>.0000001)normals.setXYZ(i,nx/length,ny/length,nz/length);}normals.needsUpdate=true;
    geometries.set(key,g);return g;
  }
  function physical(color,options={}){
    const opacity=options.opacity??1;
    const m=keep(new THREE.MeshPhysicalMaterial({color,metalness:.18,roughness:.32,clearcoat:.45,clearcoatRoughness:.22,envMapIntensity:.85,...options,transparent:opacity<1,opacity,depthWrite:opacity>=1}));m.userData.baseOpacity=opacity;return m;
  }
  const blue=()=>physical(C.azure,{metalness:.035,roughness:.57,clearcoat:.055,clearcoatRoughness:.5,envMapIntensity:.32});
  const navy=()=>physical(C.navy,{metalness:.52,roughness:.34,clearcoat:.35,envMapIntensity:1.1});
  const glass=()=>physical(C.ice,{metalness:.05,roughness:.26,clearcoat:.2,opacity:.023,envMapIntensity:.55,side:THREE.DoubleSide});
  function body(group,size,pos,mat,r=.035){const o=new THREE.Mesh(rounded(...size,r),mat);o.position.set(...pos);group.add(o);return o;}
  function line(group,points,opacity=.2,color=C.ice){
    const g=keep(new THREE.BufferGeometry().setFromPoints(points.map(v)));const m=keep(new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false}));m.userData.baseOpacity=opacity;m.userData.isLine=true;
    const o=new THREE.LineSegments(g,m);group.add(o);return o;
  }
  function outline(group,size,pos,opacity=.18){
    const g=keep(new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)));const m=keep(new THREE.LineBasicMaterial({color:C.ice,transparent:true,opacity,depthWrite:false}));m.userData.baseOpacity=opacity;m.userData.isLine=true;
    const o=new THREE.LineSegments(g,m);o.position.set(...pos);group.add(o);return o;
  }
  function part(record,obj,offset=[0,0,0],rotation=[0,0,0]){record.parts.push({obj,p:obj.position.clone(),r:obj.rotation.clone(),offset:v(offset),rotation:v(rotation)});return obj;}
  function materialsOf(group){const set=new Set();group.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>set.add(m));});return [...set];}

  // A studio environment: large soft light cards, reflected in rounded edges.
  const studio=new THREE.Scene();studio.background=new THREE.Color(C.navy);
  function card(size,pos,color,strength){const m=keep(new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(strength),side:THREE.DoubleSide}));const g=keep(new THREE.BoxGeometry(...size));const o=new THREE.Mesh(g,m);o.position.set(...pos);studio.add(o);}
  card([8,.03,4],[0,5,0],C.white,1.8);card([.03,4,7],[-5,1,0],C.ice,1.2);card([6,2,.03],[0,1,6],C.white,.8);card([2,5,.03],[3,0,-5],C.sky,.7);
  const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(studio,.045,.1,60);scene.environment=environment.texture;resources.add(environment);pmrem.dispose();
  scene.add(new THREE.AmbientLight(C.ice,.3));
  const key=new THREE.DirectionalLight(C.white,.75);key.position.set(-3,7,6);scene.add(key);
  const edge=new THREE.DirectionalLight(C.sky,.95);edge.position.set(6,3,-5);scene.add(edge);
  const fill=new THREE.DirectionalLight(C.ice,.35);fill.position.set(0,-2,4);scene.add(fill);

  // One continuous carrier, rather than four isolated product symbols.
  const carrier={parts:[],materials:[]};
  const carrierBase=body(container,[6.05,.038,3.85],[0,-1.1,0],physical(C.navy,{metalness:.08,roughness:.7,clearcoat:0,envMapIntensity:.16}),.009);carrierBase.visible=false;
  
  const rear=part(carrier,body(container,[6.12,2.72,.023],[0,.25,-1.96],glass(),.005),[0,.12,-.7]);
  const rightWall=part(carrier,body(container,[.023,2.72,3.92],[3.06,.25,0],glass(),.005),[.7,0,.12],[0,.06,0]);
  const front=part(carrier,body(container,[6.12,2.72,.018],[0,.25,1.96],glass(),.004),[-.35,-.1,1.4],[-.04,-.15,0]);
  const lid=part(carrier,body(container,[6.12,.018,3.92],[0,1.62,0],glass(),.004),[0,1.2,-.2],[.08,0,-.025]);
  [rear,rightWall,front,lid].forEach(o=>{o.visible=false;});
  const cornerPoints=[];for(const x of [-3.06,3.06])for(const y of [-1.1,1.62])for(const z of [-1.96,1.96]){cornerPoints.push([x,y,z],[x-Math.sign(x)*.4,y,z],[x,y,z],[x,y+(y<0?.4:-.4),z],[x,y,z],[x,y,z-Math.sign(z)*.4]);}
  const rearLine=part(carrier,line(container,cornerPoints,.14),[0,.1,0]);
  [[-3.06,.25,-1.96],[3.06,.25,-1.96]].forEach(pos=>body(container,[.025,2.72,.025],pos,physical(C.ice,{metalness:.7,roughness:.25,opacity:.24}),.005));
  body(container,[6.12,.024,.024],[0,1.62,-1.96],physical(C.ice,{metalness:.65,roughness:.25,opacity:.3}),.005);
  carrier.materials=materialsOf(container);
  // Soft contact reflection on the carrier's bottom, fading toward its edges.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=256;
  const ctx=shadowCanvas.getContext('2d');const gradient=ctx.createRadialGradient(128,128,8,128,128,125);gradient.addColorStop(0,'rgba(16,42,80,.68)');gradient.addColorStop(.42,'rgba(16,42,80,.34)');gradient.addColorStop(1,'rgba(16,42,80,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
  const shadowTex=keep(new THREE.CanvasTexture(shadowCanvas));const shadowMat=keep(new THREE.MeshBasicMaterial({color:C.navy,map:shadowTex,transparent:true,opacity:.7,depthWrite:false,blending:THREE.MultiplyBlending,premultipliedAlpha:true}));shadowMat.userData.baseOpacity=.7;
  const shadow=new THREE.Mesh(keep(new THREE.PlaneGeometry(5.7,3.65)),shadowMat);shadow.rotation.x=-Math.PI/2;shadow.position.y=-1.078;shadow.visible=false;container.add(shadow);carrier.materials.push(shadowMat);

  IDS.forEach((id,i)=>{
    const group=new THREE.Group();scene.add(group);const record={id,group,parts:[],materials:[],baseOpacity:1};modules.push(record);
    if(id==='lighthouse'){
      const shell=outline(group,[1.65,1.65,1.65],[0,0,0],.3);part(record,shell,[0,.03,0]);
      const core=body(group,[1.02,1.02,1.02],[0,-.1,.03],blue(),.045);part(record,core,[0,.43,.08],[0,.12,0]);
      const bottom=body(group,[1.68,.055,1.68],[0,-.84,0],navy(),.015);part(record,bottom,[0,-.2,0]);
      const lid=body(group,[1.68,.032,1.68],[0,.84,0],glass(),.008);part(record,lid,[0,.66,0],[0,.05,.015]);
      const rail=line(group,[[-.825,-.825,.825],[-.825,.825,.825],[.825,-.825,-.825],[.825,.825,-.825]],.4,C.sky);part(record,rail,[0,0,0]);
      body(core,[.52,.008,.008],[0,.508,.31],physical(C.ice,{metalness:.7,roughness:.2,opacity:.48}),.001);
    }
    if(id==='clawpro'){
      [-.47,0,.47].forEach((y,j)=>{
        const board=body(group,[2.04,.092,1.5],[0,y,0],j===1?blue():navy(),.022);part(record,board,[(j-1)*.14,(j-1)*.4,(j-1)*-.1],[0,(j-1)*.035,0]);
        const rim=outline(board,[1.99,.065,1.45],[0,0,0],j===1?.28:.14);
        if(j!==1)body(board,[1.65,.008,1.14],[0,.05,0],physical(C.ice,{metalness:.3,roughness:.4,opacity:.045}),.001);
      });
      const cage=outline(group,[2.12,1.5,1.58],[0,.08,0],.12);part(record,cage,[0,.12,0]);
      const pinMat=physical(C.sky,{metalness:.7,roughness:.2});[-.87,.87].forEach(x=>body(group,[.018,1.12,.018],[x,0,-.6],pinMat,.004));
    }
    if(id==='skillhub'){
      for(let j=0;j<4;j++){
        const blade=body(group,[.075,1.46,1.3],[(j-1.5)*.32,0,0],j===2?blue():navy(),.018);part(record,blade,[(j-1.5)*.16,j===2?.32:0,j===2?.36:0],[0,j===2?-.045:0,0]);
        const outlineBlade=outline(blade,[.077,1.44,1.28],[0,0,0],j===2?.28:.18);
        const connector=body(group,[.084,.12,.26],[(j-1.5)*.32,-.82,-.14],physical(C.ice,{metalness:.72,roughness:.28}),.009);part(record,connector,[(j-1.5)*.16,0,0]);
      }
      body(group,[1.65,.075,1.48],[0,-.9,0],navy(),.02);
    }
    if(id==='octop'){
      const f1=new THREE.Group();group.add(f1);body(f1,[1.62,.055,.055],[0,.79,-.76],navy(),.012);body(f1,[.055,1.6,.055],[-.79,0,-.76],navy(),.012);body(f1,[.055,.055,1.54],[-.79,.79,0],navy(),.012);part(record,f1,[-.2,.2,-.15],[0,-.1,.025]);
      const f2=new THREE.Group();group.add(f2);body(f2,[1.62,.055,.055],[0,-.79,.76],navy(),.012);body(f2,[.055,1.6,.055],[.79,0,.76],navy(),.012);body(f2,[.055,.055,1.54],[.79,-.79,0],navy(),.012);part(record,f2,[.2,-.12,.2],[0,.1,0]);
      const path=line(group,[[-.8,-.8,-.8],[-.8,.8,-.8],[-.8,.8,-.8],[.8,.8,-.8],[.8,.8,.8],[.8,-.8,.8],[.8,-.8,.8],[-.8,-.8,.8]],.28);part(record,path,[0,0,0]);
      const block=body(group,[.84,.84,.84],[.22,-.28,.22],blue(),.035);part(record,block,[.28,-.16,.25],[0,.1,0]);
      const satellite=body(group,[.48,.48,.48],[-.36,.43,-.29],physical(C.ice,{metalness:.32,roughness:.25,opacity:.18}),.033);part(record,satellite,[-.33,.32,-.17],[.1,-.2,0]);
      const tile=body(group,[.48,.04,.48],[.5,.55,-.22],navy(),.01);part(record,tile,[.32,.25,-.1],[0,.12,.04]);
    }
    record.materials=materialsOf(group);
    const geo=keep(new THREE.BoxGeometry(2.4,2.5,2.3)),mat=keep(new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));const hit=new THREE.Mesh(geo,mat);hit.userData.id=id;group.add(hit);hits.push(hit);
  });

  const home=[[-1.72,-.15,.42],[.3,-.32,-.63],[1.85,-.04,.8],[-.76,.52,-1.2]];
  const split=[[-2.65,-.15,1.52],[.9,.2,-2.35],[2.9,.03,1.1],[-1.05,1.8,-1.8]];
  function overview(final=false){return{distance:final?18.6:19,screen:final?[.34,.54]:[.5,.59],look:[0,0,0],angle:[.59,.43,.72],carrierOpen:final?.22:0,carrierOpacity:1,carrierScale:1,mods:home.map((p,i)=>({p:[...p],r:[0,i===2?-.08:0,0],s:1,opacity:1,open:0}))};}
  function decomposed(){return{distance:20,screen:[.35,.54],look:[0,.15,0],angle:[.62,.4,.69],carrierOpen:1,carrierOpacity:.25,carrierScale:1,mods:split.map((p,i)=>({p:[...p],r:[0,(i-1.5)*.06,0],s:1,opacity:1,open:.24}))};}
  function focused(index,open=1){
    const background=[[-3.7,.4,-3.6],[2.8,.6,-4.3],[3.7,-.5,-.3],[-1.1,2,-4.8]];
    return{distance:mobile?11.4:8.3,screen:mobile?[.5,.365]:[.365,.48],look:[0,0,0],angle:[.59+(index-1.5)*.035,.36,.76],carrierOpen:1.4,carrierOpacity:0,carrierScale:1.15,mods:background.map((p,i)=>({p:i===index?[0,0,0]:p,r:[0,i===index?[.06,-.12,-.16,.17][index]:0,0],s:i===index?1.2:.92,opacity:i===index?1:.025,open:i===index?open:.12}))};
  }
  function keyframes(){const k=[{p:0,s:overview()},{p:.10,s:overview()},{p:.20,s:decomposed()}];for(let i=0;i<4;i++){const start=.2+i*.16;k.push({p:start+.04,s:focused(i)},{p:start+.12,s:focused(i)},{p:start+.16,s:focused(i,.9)});}k.push({p:.94,s:overview(true)},{p:1,s:overview(true)});return k;}
  let frames=keyframes();
  function interpolate(a,b,t){return{
    distance:mix(a.distance,b.distance,t),screen:a.screen.map((n,i)=>mix(n,b.screen[i],t)),look:a.look.map((n,i)=>mix(n,b.look[i],t)),angle:a.angle.map((n,i)=>mix(n,b.angle[i],t)),carrierOpen:mix(a.carrierOpen,b.carrierOpen,t),carrierOpacity:mix(a.carrierOpacity,b.carrierOpacity,t),carrierScale:mix(a.carrierScale,b.carrierScale,t),mods:a.mods.map((m,i)=>({p:m.p.map((n,j)=>mix(n,b.mods[i].p[j],t)),r:m.r.map((n,j)=>mix(n,b.mods[i].r[j],t)),s:mix(m.s,b.mods[i].s,t),opacity:mix(m.opacity,b.mods[i].opacity,t),open:mix(m.open,b.mods[i].open,t)}))};}
  function sample(p){if(manual&&manual!=='overview')return focused(IDS.indexOf(manual),expanded?1:.3);if(manual==='overview')return overview();let a=frames[0],b=frames[frames.length-1];for(let i=1;i<frames.length;i++){if(p<=frames[i].p){a=frames[i-1];b=frames[i];break;}}const t=clamp((p-a.p)/Math.max(.00001,b.p-a.p),0,1);return interpolate(a.s,b.s,reduced?(t<.5?0:1):smooth(t));}
  let shown=null;
  function applyMaterials(materials,opacity,hover=false){materials.forEach(m=>{const base=m.userData.baseOpacity??1;m.opacity=base*opacity*(m.userData.isLine?(hover?1.25:1):1);const transparent=m.opacity<.995;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}m.visible=m.opacity>.001;m.depthWrite=!transparent;});}
  function applyParts(record,amount){record.parts.forEach(p=>{p.obj.position.copy(p.p).addScaledVector(p.offset,amount);p.obj.rotation.set(p.r.x+p.rotation.x*amount,p.r.y+p.rotation.y*amount,p.r.z+p.rotation.z*amount);});}
  function apply(state){
    shown=state;const sceneScale=mobile?.73:1;
    let mediaIndex=-1,mediaBlend=0;if(!manual&&progress>=.20&&progress<=.84){mediaIndex=Math.min(3,Math.floor((progress-.20)/.16));const k=(progress-(.20+mediaIndex*.16))/.16;mediaBlend=smooth(clamp((k-.4)/.22,0,1))*(1-smooth(clamp((k-.90)/.10,0,1)));}
    modules.forEach((r,i)=>{const m=state.mods[i];r.group.position.set(...m.p).multiplyScalar(sceneScale);r.group.rotation.set(...m.r);r.group.scale.setScalar(m.s*sceneScale);applyParts(r,m.open);applyMaterials(r.materials,m.opacity*(i===mediaIndex?1-.97*mediaBlend:1),hovered===r.id);});
    container.scale.setScalar(state.carrierScale*sceneScale);container.position.set(0,0,0);applyParts(carrier,state.carrierOpen);applyMaterials(carrier.materials,state.carrierOpacity);
    let distance=state.distance;if(mobile&&progress<.22&&(!manual||manual==='overview'))distance=mix(24,16,smooth(clamp(progress/.22,0,1)));
    if(mobile&&progress>.84&&!manual)distance=24;
    const look=v(state.look).multiplyScalar(sceneScale),dir=v(state.angle).normalize();
    dir.x+=pointerCurrent.x*.018;dir.y+=pointerCurrent.y*.01;dir.normalize();
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),dir).normalize();const up=new THREE.Vector3().crossVectors(dir,right).normalize();
    const fh=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),fw=fh*aspect;
    const sx=mobile?(progress>.84?.5:.5):state.screen[0],sy=mobile?(progress<.2&&(!manual||manual==='overview')?.47:state.screen[1]):state.screen[1];
    const target=look.clone().addScaledVector(right,-(sx-.5)*fw).addScaledVector(up,-(.5-sy)*fh);
    camera.position.copy(target).addScaledVector(dir,distance);camera.lookAt(target);camera.updateMatrixWorld();
    renderer.render(scene,camera);
    onLabels(modules.map(r=>{const p=r.group.position.clone().add(new THREE.Vector3(0,-1.37*r.group.scale.y,0)).project(camera);return{id:r.id,x:(p.x+1)*width/2,y:(1-p.y)*height/2,visible:p.z>-1&&p.z<1&&p.x>-1.05&&p.x<1.05&&p.y>-1.05&&p.y<1.05};}));
  }
  function draw(now){reduced=Boolean(window.__AH_REDUCED_MOTION||motionQuery.matches);raf=0;if(disposed||document.hidden)return;const dt=Math.min(.05,(now-(lastTime||now))/1000);lastTime=now;const damping=reduced?1:1-Math.exp(-dt*11);progress=mix(progress,targetProgress,damping);if(Math.abs(progress-targetProgress)<.00004)progress=targetProgress;pointerCurrent.lerp(pointerTarget,reduced?1:1-Math.exp(-dt*7));
    const desired=sample(progress);if(!shown||reduced)shown=desired;else shown=interpolate(shown,desired,1-Math.exp(-dt*13));apply(shown);
    if(!ready){ready=true;onReady();}
    const cameraSettling=shown&&Math.abs(shown.distance-desired.distance)>.0001;const modulesSettling=shown&&shown.mods.some((m,i)=>Math.abs(m.s-desired.mods[i].s)>.0001||Math.abs(m.p[0]-desired.mods[i].p[0])>.0001||Math.abs(m.open-desired.mods[i].open)>.0001);
    if(progress!==targetProgress||pointerCurrent.distanceTo(pointerTarget)>.0001||cameraSettling||modulesSettling)requestDraw();
  }
  function requestDraw(){if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(draw);}
  function setProgress(p){targetProgress=clamp(Number(p)||0,0,1);manual=null;requestDraw();}
  function setView(id='overview',open=false){if(!IDS.includes(id)&&id!=='overview')return;manual=id;expanded=open;targetProgress=id==='overview'?0:.28+IDS.indexOf(id)*.16;requestDraw();}
  function resize(){const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);aspect=width/height;mobile=width<760;camera.aspect=aspect;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(width,height,false);frames=keyframes();shown=null;requestDraw();}
  function pick(e){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/width*2-1,-(e.clientY-rect.top)/height*2+1);raycaster.setFromCamera(pointer,camera);const found=raycaster.intersectObjects(hits,false)[0];return found?found.object.userData.id:null;}
  let down=null;
  function pointerMove(e){const rect=canvas.getBoundingClientRect();pointerTarget.set(((e.clientX-rect.left)/width-.5)*2,-((e.clientY-rect.top)/height-.5)*2);const id=pick(e);if(id!==hovered){hovered=id;onHover(id);canvas.style.cursor=id?'pointer':'';}requestDraw();}
  function leave(){pointerTarget.set(0,0);hovered=null;onHover(null);canvas.style.cursor='';requestDraw();}
  function pointerDown(e){down=[e.clientX,e.clientY];}
  function pointerUp(e){if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<7){const id=pick(e);if(id)onSelect(id);}down=null;}
  function setTheme(next){theme=next==='light'?'light':'dark';scene.background=null;requestDraw();}
  function visibility(){if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;lastTime=0;}else requestDraw();}
  canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);document.addEventListener('visibilitychange',visibility);
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  Object.defineProperty(window,'__AH_SCENE_DEBUG',{configurable:true,get:()=>({progress,targetProgress,view:manual,expanded,mobile,theme,animating:!!raf,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov},drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles})});
  return{setView,setProgress,setTheme,dispose(){disposed=true;observer.disconnect();if(raf)cancelAnimationFrame(raf);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);document.removeEventListener('visibilitychange',visibility);resources.forEach(r=>r.dispose());renderer.dispose();try{delete window.__AH_SCENE_DEBUG;}catch{}}};
}
