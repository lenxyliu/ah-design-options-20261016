import * as THREE from './vendor/three.module.min.js';

// Reference-matched glass renders preserve the optical finish in three separate
// 3D planes. The light/refraction is baked; position, parallax and drag are live.
export function mountGlassScene(container) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'}); }
  catch {container.dataset.webgl='unavailable';return {setMode(){},setProgress(){},setPointer(){},destroy(){}};}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
  const canvas=renderer.domElement;
  canvas.setAttribute('aria-label','可拖动的蓝色、青色和金色玻璃拼图');
  Object.assign(canvas.style,{display:'block',width:'100%',height:'100%',touchAction:'pan-y',cursor:'grab'});
  container.append(canvas);container.dataset.webgl='ready';
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,50);
  camera.position.set(0,.65,9.4);camera.lookAt(0,.65,0);
  const sculpture=new THREE.Group();scene.add(sculpture);
  const geometry=new THREE.PlaneGeometry(2.06,2.06);
  const definitions=[
    {scale:.78,position:[-1.15,2.45,.1],rotation:[.03,-.04,-.08]},
    {scale:.75,position:[1.2,1.9,-.25],rotation:[-.02,.05,.11]},
    {scale:.70,position:[.1,1.0,-.15],rotation:[.03,-.06,.10]}
  ];
  const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let alive=true,visible=true,frame=0,last=0,time=0,spin=0,progress=0,mode=0,drag=null;
  let baseTexture=null,alphaPixels=null,spriteWidth=0,spriteHeight=0;
  const pieces=[];
  function tick(now){
    frame=0;if(!alive||!visible||document.hidden)return;
    const dt=Math.min((now-(last||now))/1000,.05);last=now;time+=dt;
    const blend=reduced.matches?1:1-Math.exp(-dt*4.4),motion=reduced.matches?0:1;
    sculpture.rotation.y+=(spin+pointer.x*.045-sculpture.rotation.y)*blend;
    sculpture.rotation.x+=(-pointer.y*.025+progress*.025-sculpture.rotation.x)*blend;
    pieces.forEach((piece,i)=>{
      piece.group.position.lerp(piece.target,blend);
      piece.group.position.y+=Math.sin(time*.48+i*2.1)*.00055*motion;
      piece.group.rotation.set(piece.rotation.x+Math.sin(time*.35+i)*.012*motion,
        piece.rotation.y+Math.cos(time*.32+i)*.018*motion,piece.rotation.z+Math.sin(time*.4+i)*.012*motion);
    });
    renderer.render(scene,camera);if(!reduced.matches)frame=requestAnimationFrame(tick);
  }
  const resume=()=>{if(alive&&visible&&!document.hidden&&!frame){last=0;frame=requestAnimationFrame(tick);}};
  function resize(){
    const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=camera.aspect<.9?10.6:9.4;camera.updateProjectionMatrix();resume();
  }
  function applyMode(){
    pieces.forEach((piece,i)=>{
      const a=mode*.07,x=piece.base.x,y=piece.base.y-1.9;
      piece.target.set(x*Math.cos(a)-y*Math.sin(a),1.9+x*Math.sin(a)+y*Math.cos(a),piece.base.z+(i===mode%3?.08:0));
    });resume();
  }
  new THREE.TextureLoader().load('./assets/glass-puzzles.png',texture=>{
    if(!alive){texture.dispose();return;}
    baseTexture=texture;texture.colorSpace=THREE.SRGBColorSpace;
    spriteWidth=texture.image.width;spriteHeight=texture.image.height;
    const mask=document.createElement('canvas');mask.width=spriteWidth;mask.height=spriteHeight;
    const ctx=mask.getContext('2d',{willReadFrequently:true});ctx.drawImage(texture.image,0,0);alphaPixels=ctx.getImageData(0,0,spriteWidth,spriteHeight).data;
    definitions.forEach((d,i)=>{
      const map=texture.clone();map.repeat.set(1/3,1);map.offset.set(i/3,0);map.needsUpdate=true;
      const material=new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.015,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
      const mesh=new THREE.Mesh(geometry,material),group=new THREE.Group();
      mesh.userData.index=i;group.add(mesh);group.scale.set(d.scale*(spriteWidth/3/spriteHeight),d.scale,d.scale);
      group.position.fromArray(d.position);group.rotation.fromArray(d.rotation);sculpture.add(group);
      pieces.push({group,mesh,map,base:new THREE.Vector3(...d.position),rotation:new THREE.Vector3(...d.rotation),target:new THREE.Vector3(...d.position)});
    });
    container.dataset.material='reference-glass';applyMode();
  },undefined,()=>{container.dataset.material='unavailable';});
  function onMove(event){
    const b=canvas.getBoundingClientRect();pointer.set((event.clientX-b.left)/b.width*2-1,-(event.clientY-b.top)/b.height*2+1);resume();
    if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.active&&Math.abs(dx)>6&&Math.abs(dx)>Math.abs(dy)*1.2){drag.active=true;canvas.setPointerCapture(event.pointerId);canvas.style.cursor='grabbing';}
    if(drag.active)spin=THREE.MathUtils.clamp(drag.spin+dx*.0015,-.20,.20);
  }
  const onDown=e=>{if(e.isPrimary!==false&&e.button===0)drag={x:e.clientX,y:e.clientY,spin,active:false};};
  function onUp(event){
    if(drag&&!drag.active&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<8){
      onMove(event);raycaster.setFromCamera(pointer,camera);
      const hit=raycaster.intersectObjects(pieces.map(p=>p.mesh)).find(h=>{
        if(!alphaPixels||!h.uv)return false;
        const x=Math.min(spriteWidth-1,Math.max(0,Math.floor((h.object.userData.index+h.uv.x)/3*spriteWidth)));
        const y=Math.min(spriteHeight-1,Math.max(0,Math.floor((1-h.uv.y)*spriteHeight)));
        return alphaPixels[(y*spriteWidth+x)*4+3]>40;
      });
      if(hit)container.dispatchEvent(new CustomEvent('puzzle-select',{detail:{index:hit.object.userData.index},bubbles:true}));
    }
    drag=null;canvas.style.cursor='grab';if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  }
  const onCancel=()=>{drag=null;canvas.style.cursor='grab';};
  const onLeave=()=>{if(!drag?.active){pointer.set(0,0);drag=null;resume();}};
  const listeners=[['pointermove',onMove],['pointerdown',onDown],['pointerup',onUp],['pointercancel',onCancel],['pointerleave',onLeave]];
  listeners.forEach(([name,fn])=>canvas.addEventListener(name,fn));
  const observer=new ResizeObserver(resize);observer.observe(container);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'});intersection.observe(container);
  document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);resize();resume();
  return {
    setPointer(x,y){pointer.set(THREE.MathUtils.clamp(x,-1,1),THREE.MathUtils.clamp(y,-1,1));resume();},
    setProgress(value){progress=THREE.MathUtils.clamp(value,0,1);resume();},
    setMode(index){mode=((Math.round(index)%4)+4)%4;applyMode();},
    destroy(){
      alive=false;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);
      listeners.forEach(([name,fn])=>canvas.removeEventListener(name,fn));
      pieces.forEach(p=>{p.map.dispose();p.mesh.material.dispose();});baseTexture?.dispose();geometry.dispose();renderer.dispose();canvas.remove();delete container.dataset.webgl;
    }
  };
}
