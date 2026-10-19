import { sampleHallChoreography } from './hall-choreography.js';

const POSES = ['greeting','dispatch','completed'];
const clamp = value => Math.max(0,Math.min(1,value));
const ease = value => { const t=clamp(value); return t*t*(3-2*t); };
const pulse = (p,a,b) => Math.sin(Math.PI*clamp((p-a)/(b-a)))**2;

/** The brand character, product modules and parcels share one scroll clock. */
export function createHallPerformance({ THREE, scene, camera, worlds, onInvalidate } = {}) {
  let disposed=false;
  const root=new THREE.Group();root.name='hall-scroll-performance';scene.add(root);
  const ground=new THREE.Plane(new THREE.Vector3(0,1,0),695);
  const raycaster=new THREE.Raycaster();
  const anchor=new THREE.Vector2();
  const feet=new THREE.Vector3();
  const pocket=new THREE.Vector3();
  const scratch=new THREE.Vector3();
  const start=new THREE.Vector3(),control=new THREE.Vector3(),end=new THREE.Vector3();
  const textures=[];
  const sprites=[];
  const loader=new THREE.TextureLoader();
  const loaded=new Set();

  for(const pose of POSES){
    const map=loader.load(new URL(`./assets/ip-${pose}.png`,import.meta.url).href,()=>{
      if(disposed){map.dispose();return;}
      loaded.add(pose);
      onInvalidate?.();
    });
    map.colorSpace=THREE.SRGBColorSpace;textures.push(map);
    const material=new THREE.SpriteMaterial({map,transparent:true,opacity:0,depthTest:true,depthWrite:false,alphaTest:.018,toneMapped:false,fog:false});
    const sprite=new THREE.Sprite(material);sprite.name=`hall-ip-${pose}`;
    sprite.center.set(.5,.055);sprite.renderOrder=3;root.add(sprite);
    sprites.push({pose,sprite,map});
  }

  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
  const ctx=shadowCanvas.getContext('2d');
  const gradient=ctx.createRadialGradient(64,64,4,64,64,64);
  gradient.addColorStop(0,'rgba(32,68,127,.28)');gradient.addColorStop(.5,'rgba(52,100,157,.13)');gradient.addColorStop(1,'rgba(52,100,157,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const shadowMap=new THREE.CanvasTexture(shadowCanvas);textures.push(shadowMap);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(290,180),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthTest:true,depthWrite:false,toneMapped:false,opacity:1}));
  shadow.rotation.x=-Math.PI/2;shadow.renderOrder=1;root.add(shadow);

  const parcels=Array.from({length:3},(_,n)=>{
    const parcel=new THREE.Mesh(new THREE.BoxGeometry(52,57,45),new THREE.MeshStandardMaterial({color:[0x245bff,0x4bd6e5,0xf5c844][n],roughness:.32,metalness:.12,transparent:true,opacity:0,depthWrite:false}));
    parcel.name=`ip-capability-parcel-${n}`;parcel.renderOrder=2;root.add(parcel);return parcel;
  });
  const tracePositions=new Float32Array(48*3);
  const traceGeometry=new THREE.BufferGeometry();traceGeometry.setAttribute('position',new THREE.BufferAttribute(tracePositions,3));
  const trace=new THREE.Line(traceGeometry,new THREE.LineBasicMaterial({color:0x87b2ff,transparent:true,opacity:0,depthWrite:false}));
  trace.frustumCulled=false;root.add(trace);

  const responsive=worlds.map(world=>{
    const objects=['hero-workbench','capability-solid-0','capability-solid-1','capability-solid-2','deeper-product-outcome','outcome-pedestal','outcome-stem'].map(name=>world.getObjectByName(name)).filter(Boolean);
    world.traverse(object=>{if(/^(collaboration-branch-|reusable-asset-volume-|professional-capability-pin-|persistent-memory-layer-)/.test(object.name))objects.push(object);});
    const nodes=objects.map(object=>({object,position:object.position.clone(),rotation:object.rotation.clone(),scale:object.scale.clone()}));
    const glows=['hero-table-edge','capability-bottom-0','capability-bottom-1','capability-bottom-2','outcome-ground-step'].map(name=>world.getObjectByName(name)).filter(object=>object?.material?.emissive).map(object=>{
      const original=object.material;object.material=original.clone();object.material.emissive.set(0x245bff);object.material.emissiveIntensity=0;
      return {object,original,material:object.material};
    });
    return {nodes,glows};
  });

  function resetScene(){
    for(const room of responsive){
      for(const node of room.nodes){node.object.position.copy(node.position);node.object.rotation.copy(node.rotation);node.object.scale.copy(node.scale);}
      for(const glow of room.glows)glow.material.emissiveIntensity=0;
    }
  }

  function curve(t,out){
    return out.copy(start).multiplyScalar((1-t)*(1-t)).addScaledVector(control,2*(1-t)*t).addScaledVector(end,t*t);
  }

  function update({index=0,progress=0,opacity=1,reduced=false,mobile=false}={}){
    if(disposed)return;
    resetScene();
    root.visible=opacity>.01&&!reduced;
    if(!root.visible)return;
    const p=clamp(progress),i=Math.max(0,Math.min(3,index));
    const state=sampleHallChoreography(i,p,{mobile,reduced});
    camera.updateMatrixWorld();
    anchor.set(...state.anchor);raycaster.setFromCamera(anchor,camera);
    if(!raycaster.ray.intersectPlane(ground,feet)){root.visible=false;return;}
    // Give the character's full billboard silhouette clearance from the
    // workbench's angled edge, rather than only clearing its central ray.
    // This is a real movement along the floor; depth testing stays enabled.
    scratch.copy(camera.position).sub(feet);scratch.y=0;
    const floorDistance=scratch.length();
    const foreground=mobile?clamp((-state.anchor[1]-.94)/.41):0;
    const forwardBias=Math.min(mobile?150*(1-.9*foreground):450,floorDistance*.2);
    if(floorDistance>1)feet.addScaledVector(scratch,forwardBias/floorDistance);
    // During handoff, stand beside the board's left edge rather than behind
    // its angled surface. The wider SkillHub passage already goes farther
    // left, so it needs no additional displacement. Phone staging is retained.
    const handoffClearance=mobile?0:ease((p-.12)/.08)*(1-ease((p-.38)/.06));
    feet.x-=160*handoffClearance*clamp((state.anchor[0]+.86)/.26);
    const height=state.height;
    const weights=state.poseWeights;
    const availableWeight=POSES.reduce((sum,pose)=>sum+(loaded.has(pose)?weights[pose]:0),0);
    const fallbackPose=availableWeight>.001?null:POSES.find(pose=>loaded.has(pose));
    for(const item of sprites){
      const image=item.map.image;
      const aspect=image?.width&&image?.height?image.width/image.height:item.pose==='greeting'?2/3:1;
      item.sprite.position.copy(feet);item.sprite.position.y+=state.stepLift;
      item.sprite.scale.set(height*aspect,height,1);
      item.sprite.material.rotation=state.lean;
      const weight=availableWeight>.001?(loaded.has(item.pose)?weights[item.pose]/availableWeight:0):(item.pose===fallbackPose?1:0);
      item.sprite.material.opacity=weight;
      item.sprite.visible=weight>.002;
    }
    shadow.position.copy(feet);shadow.position.y=-694.5;
    shadow.material.opacity=1-state.stepLift/50;
    const room=responsive[i];
    for(const node of room.nodes){
      const name=node.object.name;
      if(name==='hero-workbench'){
        node.object.position.y+=state.handoff*7;
        node.object.rotation.y+=state.handoff*.012;
      }else if(['deeper-product-outcome','outcome-pedestal','outcome-stem'].includes(name)){
        node.object.position.y+=state.arrival*10;
      }else if(name.startsWith('capability-solid-')){
        const n=Number(node.object.name.at(-1));
        const reaction=pulse(p,.18+n*.035,.35+n*.035);
        node.object.position.y+=reaction*18;
        node.object.position.z+=reaction*65;
        node.object.rotation.y+=reaction*(n%2?.025:-.025);
      }else if(name.startsWith('collaboration-branch-'))node.object.position.y+=state.handoff*8;
      else if(name.startsWith('reusable-asset-volume-'))node.object.position.z+=state.handoff*14;
      else if(name.startsWith('professional-capability-pin-'))node.object.position.z-=state.handoff*22;
      else if(name.startsWith('persistent-memory-layer-'))node.object.position.y+=state.arrival*8*(Number(name.at(-1))-1);
    }
    room.glows.forEach((glow,n)=>{glow.material.emissiveIntensity=n===4?state.arrival*.45:state.handoff*(n===0?.32:.48);});

    pocket.copy(feet).add(scratch.set(0,height*.42,5));
    const arriving=state.arrival>state.handoff;
    const activation=Math.max(state.handoff,state.arrival);
    const worldZ=worlds[i].position.z;
    if(arriving){start.set(800,45,worldZ-3380);end.copy(pocket);}else{start.copy(pocket);end.set(mobile?380:-140,mobile?60:-170,worldZ-(mobile?830:680));}
    control.copy(start).add(end).multiplyScalar(.5);control.y+=240;
    if(!arriving&&!mobile){control.x=Math.min(start.x,-610);control.z=worldZ-600;control.y+=80;}
    parcels.forEach((parcel,n)=>{
      const a=arriving ? .67+n*.025 : .18+n*.025;
      const b=arriving ? .84+n*.025 : .34+n*.025;
      const t=clamp((p-a)/(b-a));
      const visible=activation>.02&&t>0&&t<1;
      parcel.visible=visible;parcel.material.opacity=visible?Math.sin(t*Math.PI)*.95:0;
      if(visible){curve(ease(t),parcel.position);parcel.position.x+=(n-1)*33*Math.sin(t*Math.PI);parcel.rotation.set(t*1.3,n*.4+t*1.8,t*.8);}
    });
    trace.visible=activation>.02;trace.material.opacity=activation*.24;
    if(trace.visible){
      for(let n=0;n<48;n++){curve(n/47,scratch);tracePositions[n*3]=scratch.x;tracePositions[n*3+1]=scratch.y;tracePositions[n*3+2]=scratch.z;}
      traceGeometry.attributes.position.needsUpdate=true;
    }
    root.userData.state={index:i,progress:p,anchor:state.anchor,position:feet.toArray(),pose:POSES.reduce((a,b)=>weights[a]>weights[b]?a:b),handoff:state.handoff,arrival:state.arrival};
    return root.userData.state;
  }

  function dispose(){
    if(disposed)return;disposed=true;resetScene();
    for(const room of responsive)for(const glow of room.glows){glow.object.material=glow.original;glow.material.dispose();}
    root.traverse(object=>{object.geometry?.dispose();if(object.material)object.material.dispose();});
    textures.forEach(texture=>texture.dispose());root.removeFromParent();
  }
  return {update,dispose};
}
