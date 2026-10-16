import * as THREE from './vendor/three.module.min.js';

const C={azure:0x245BFF,sky:0x3895FF,navy:0x102A50,ice:0xEAF4FF,white:0xFFFFFF};
const IDS=['lighthouse','clawpro','skillhub','octop'];
const ease=t=>1-Math.pow(1-t,4);

export function createScene({canvas,onSelect=()=>{},onHover=()=>{},onLabels=()=>{},onReady=()=>{}}){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setClearColor(C.navy,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NoToneMapping;
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-8,8,4.5,-4.5,.1,150);
  const direction=new THREE.Vector3(8,6,10).normalize();
  const right=new THREE.Vector3(direction.z,0,-direction.x).normalize();
  const up=new THREE.Vector3().crossVectors(direction,right).normalize();
  const groups=[];const hitTargets=[];const resources=new Set();
  let width=1,height=1,aspect=1,mobile=false,theme='dark',view='overview',expanded=false;
  let frame=0,disposed=false,animation=null,hovered=null,ready=false;
  let frameHeight=9.4;const pointer=new THREE.Vector2(-10,-10);const raycaster=new THREE.Raycaster();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dummy=new THREE.OrthographicCamera();
  function material(color,opacity=1,extra={}){
    const m=new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity>=1,side:THREE.DoubleSide,...extra});
    m.userData.baseOpacity=opacity;m.userData.themeRole=color===C.ice?'line':null;resources.add(m);return m;
  }
  function wire(group,geometry,opacity=.5,color=C.ice){
    const e=new THREE.EdgesGeometry(geometry,30);resources.add(e);
    const m=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});
    m.userData.baseOpacity=opacity;m.userData.isLine=true;m.userData.themeRole=color===C.ice?'line':null;resources.add(m);
    const o=new THREE.LineSegments(e,m);group.add(o);return o;
  }
  function box(group,size,pos,color,opacity=1,edgeOpacity=.4){
    const geo=new THREE.BoxGeometry(...size);resources.add(geo);
    const cube=color===C.azure&&Math.abs(size[0]-size[1])<.01&&Math.abs(size[1]-size[2])<.01;
    const mats=cube?[material(C.navy,opacity),material(C.azure,opacity),material(C.sky,opacity),material(C.navy,opacity),material(C.azure,opacity),material(C.azure,opacity)]:material(color,opacity);
    const mesh=new THREE.Mesh(geo,mats);mesh.position.set(...pos);group.add(mesh);
    if(edgeOpacity){const outline=wire(mesh,geo,color===C.azure?edgeOpacity*.7:edgeOpacity,color===C.azure?C.sky:C.ice);outline.renderOrder=2;}
    return mesh;
  }
  function cage(group,size,pos,opacity=.5){
    const geo=new THREE.BoxGeometry(...size);resources.add(geo);const o=wire(group,geo,opacity);o.position.set(...pos);return o;
  }
  function lines(group,points,opacity=.5,color=C.ice){
    const geo=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));resources.add(geo);
    const m=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});m.userData.baseOpacity=opacity;m.userData.isLine=true;m.userData.themeRole=color===C.ice?'line':null;resources.add(m);
    const o=new THREE.LineSegments(geo,m);group.add(o);return o;
  }
  function animatePart(record,obj,offset,rotation=[0,0,0]){
    record.parts.push({obj,closed:obj.position.clone(),open:obj.position.clone().add(new THREE.Vector3(...offset)),closedRot:obj.rotation.clone(),openRot:new THREE.Euler(obj.rotation.x+rotation[0],obj.rotation.y+rotation[1],obj.rotation.z+rotation[2])});
  }
  IDS.forEach((id,i)=>{
    const group=new THREE.Group();scene.add(group);
    const r={id,group,parts:[],opacity:1,expand:0,materials:[],bounds:null};groups.push(r);
    if(id==='lighthouse'){
      cage(group,[2.05,2.05,2.05],[0,0,0],.54);
      const core=box(group,[1.05,1.05,1.05],[-.14,-.12,.12],C.azure,1,.9);animatePart(r,core,[0,.4,0],[0,.12,0]);
      const top=box(group,[2.05,.035,2.05],[0,1.025,0],C.ice,.045,0);animatePart(r,top,[0,.55,0]);
      const base=box(group,[2.05,.035,2.05],[0,-1.025,0],C.ice,.07,0);animatePart(r,base,[0,-.16,0]);
      lines(group,[[-1.025,0,1.025],[-.78,0,1.025],[-1.025,.24,1.025],[-1.025,0,1.025],[1.025,0,-1.025],[.78,0,-1.025]],.6,C.sky);
    }
    if(id==='clawpro'){
      [-.62,0,.62].forEach((y,j)=>{
        const layer=box(group,[2.1,.065,1.75],[0,y,0],j===1?C.azure:C.ice,j===1?1:.055,j===1?.8:.48);
        animatePart(r,layer,[j===0?-.12:j===2?.12:0,(j-1)*.35,0]);
      });
      const bounds=cage(group,[2.1,1.85,1.75],[0,.11,0],.3);animatePart(r,bounds,[0,.15,0]);
      const rail=lines(group,[[-1.05,-.65,.875],[-1.05,.98,.875],[1.05,-.65,-.875],[1.05,.98,-.875]],.65);
      animatePart(r,rail,[0,0,0]);
    }
    if(id==='skillhub'){
      for(let j=0;j<4;j++){
        const plate=box(group,[.065,1.65,1.45],[(j-1.5)*.49,0,(j-1.5)*.035],j===2?C.azure:C.ice,j===2?1:.028,j===2?.85:.38);
        animatePart(r,plate,[(j-1.5)*.16,j===2?.38:0,j===2?.2:0]);
        const plug=cage(group,[.1,.18,.3],[(j-1.5)*.49,-.94,(j-1.5)*.035],.3);animatePart(r,plug,[(j-1.5)*.16,0,0]);
      }
    }
    if(id==='octop'){
      const back=lines(group,[[-1,-1,-.85],[-1,1,-.85],[-1,1,-.85],[1,1,-.85],[1,1,-.85],[1,.3,-.85],[-1,-1,-.85],[-.25,-1,-.85],[-1,1,-.85],[-1,1,.8]],.52);
      animatePart(r,back,[-.12,.13,-.15]);
      const front=lines(group,[[1,1,.85],[1,-1,.85],[1,-1,.85],[-1,-1,.85],[-1,-1,.85],[-1,-.45,.85],[1,-1,.85],[1,-1,-.85]],.6);animatePart(r,front,[.15,-.1,.18]);
      const core=box(group,[.95,.95,.95],[.34,-.35,.25],C.azure,1,.85);animatePart(r,core,[.28,-.12,.2]);
      const node=cage(group,[.61,.61,.61],[-.5,.52,-.22],.6);animatePart(r,node,[-.3,.28,-.15]);
      const small=box(group,[.52,.07,.57],[.65,.65,-.32],C.ice,.1,.55);animatePart(r,small,[.25,.27,-.1]);
    }
    group.traverse(o=>{if(o.material)r.materials.push(...(Array.isArray(o.material)?o.material:[o.material]));});
    const hitGeo=new THREE.BoxGeometry(2.55,2.5,2.4);resources.add(hitGeo);
    const hit=new THREE.Mesh(hitGeo,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));resources.add(hit.material);hit.userData.id=id;group.add(hit);hitTargets.push(hit);r.hit=hit;
  });
  function cameraState(id,open){
    let fh=mobile?12.3:9.4;let target=new THREE.Vector3();let dir=direction.clone();
    if(id!=='overview'){
      const r=groups.find(g=>g.id===id);fh=mobile?(open?7.6:8.2):(open?5.35:5.95);
      dir=new THREE.Vector3(8+(IDS.indexOf(id)-1.5)*.45,6.3,10).normalize();
      const rt=new THREE.Vector3(dir.z,0,-dir.x).normalize();const ut=new THREE.Vector3().crossVectors(dir,rt).normalize();
      const sx=mobile?.5:.355,sy=mobile?.375:.48;
      target.copy(r.group.position).addScaledVector(rt,-(sx-.5)*fh*aspect).addScaledVector(ut,-(.5-sy)*fh);
    }
    const pos=target.clone().addScaledVector(dir,30);dummy.position.copy(pos);dummy.lookAt(target);
    return {pos,quat:dummy.quaternion.clone(),height:fh};
  }
  function applyProjection(){camera.left=-frameHeight*aspect/2;camera.right=frameHeight*aspect/2;camera.top=frameHeight/2;camera.bottom=-frameHeight/2;camera.updateProjectionMatrix();}
  function layout(){
    const fh=mobile?12.3:9.4,fw=fh*aspect;
    const points=mobile?[[.29,.37],[.72,.36],[.3,.58],[.73,.59]]:[[.50,.43],[.80,.38],[.56,.68],[.82,.67]];
    groups.forEach((r,i)=>{
      const [x,y]=points[i];r.group.position.copy(right).multiplyScalar((x-.5)*fw).addScaledVector(up,(.5-y)*fh).addScaledVector(direction,[.05,-.3,.15,-.1][i]);
      r.group.scale.setScalar(mobile?.64:.83);
    });
  }
  function labelPositions(){
    const result=groups.map(r=>{
      const p=r.group.position.clone().add(new THREE.Vector3(0,-1.58*(mobile?.64:.83),0)).project(camera);
      return{id:r.id,x:(p.x+1)*width/2,y:(1-p.y)*height/2,visible:p.z>-1&&p.z<1&&p.x>-1.15&&p.x<1.15&&p.y>-1.15&&p.y<1.15};
    });onLabels(result);
  }
  function updatePose(r){
    r.parts.forEach(p=>{p.obj.position.lerpVectors(p.closed,p.open,r.expand);p.obj.rotation.set(THREE.MathUtils.lerp(p.closedRot.x,p.openRot.x,r.expand),THREE.MathUtils.lerp(p.closedRot.y,p.openRot.y,r.expand),THREE.MathUtils.lerp(p.closedRot.z,p.openRot.z,r.expand));});
    r.materials.forEach(m=>{let boost=hovered===r.id&&view==='overview'?1.18:1;const lineQuiet=m.userData.isLine&&(view==='overview'||r.id!==view)?.75:1;m.opacity=Math.min(1,m.userData.baseOpacity*r.opacity*boost*lineQuiet);m.transparent=m.opacity<.999;m.depthWrite=m.opacity>=.999;});
  }
  function draw(now=performance.now()){
    frame=0;if(disposed||document.hidden)return;
    if(animation){
      const t=(reduced||window.__AH_REDUCED_MOTION)?1:Math.min(1,(now-animation.start)/1100),k=ease(t);
      camera.position.lerpVectors(animation.from.pos,animation.to.pos,k);camera.quaternion.slerpQuaternions(animation.from.quat,animation.to.quat,k);frameHeight=THREE.MathUtils.lerp(animation.from.height,animation.to.height,k);applyProjection();
      groups.forEach((r,i)=>{r.opacity=THREE.MathUtils.lerp(animation.fromGroups[i].opacity,animation.toGroups[i].opacity,k);r.expand=THREE.MathUtils.lerp(animation.fromGroups[i].expand,animation.toGroups[i].expand,k);updatePose(r);});
      if(t>=1)animation=null;
    }else groups.forEach(updatePose);
    renderer.render(scene,camera);labelPositions();
    if(!ready){ready=true;onReady();}
    if(animation)requestDraw();
  }
  function requestDraw(){if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(draw);}
  function setView(id='overview',open=false,immediate=false){
    if(!IDS.includes(id)&&id!=='overview')id='overview';view=id;expanded=open;
    const to=cameraState(id,open);
    animation={start:performance.now()-(immediate?1100:0),from:{pos:camera.position.clone(),quat:camera.quaternion.clone(),height:frameHeight},to,fromGroups:groups.map(r=>({opacity:r.opacity,expand:r.expand})),toGroups:groups.map(r=>({opacity:id==='overview'||r.id===id?1:.35,expand:r.id===id?(open?1:.15):0}))};requestDraw();
  }
  function resize(){
    const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);aspect=width/height;mobile=width<760;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(width,height,false);layout();setView(view,expanded,true);
  }
  function pick(event){
    const rect=canvas.getBoundingClientRect();const py=(event.clientY-rect.top)/height;if(py<.14||py>.86)return null;pointer.set(((event.clientX-rect.left)/width)*2-1,-((event.clientY-rect.top)/height)*2+1);raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(hitTargets,false)[0];return hit?hit.object.userData.id:null;
  }
  let down=null;
  function move(e){const id=pick(e);if(id!==hovered){hovered=id;canvas.style.cursor=id?'pointer':'';onHover(id);requestDraw();}}
  function leave(){hovered=null;onHover(null);canvas.style.cursor='';requestDraw();}
  function pointerDown(e){down={x:e.clientX,y:e.clientY};}
  function pointerUp(e){if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){const id=pick(e);if(id)onSelect(id);}down=null;}
  function setTheme(next){theme=next==='light'?'light':'dark';groups.forEach(r=>r.materials.forEach(m=>{if(m.userData.themeRole==='line')m.color.setHex(theme==='light'?C.navy:C.ice);}));requestDraw();}
  function visibility(){if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else{if(animation)animation.start=performance.now()-1100;requestDraw();}}
  canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);document.addEventListener('visibilitychange',visibility);
  const observer=new ResizeObserver(resize);observer.observe(canvas);camera.position.copy(direction).multiplyScalar(30);camera.lookAt(0,0,0);resize();
  return{setView,setTheme,dispose(){disposed=true;observer.disconnect();if(frame)cancelAnimationFrame(frame);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);document.removeEventListener('visibilitychange',visibility);resources.forEach(r=>r.dispose());renderer.dispose();}};
}
