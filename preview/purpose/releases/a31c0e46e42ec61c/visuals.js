let sequence = 0;
const canonical = id => /claw/i.test(id) ? 'clawpro' : /skill/i.test(id) ? 'skillhub' : /octop/i.test(id) ? 'octop' : 'lighthouse';

function definitions(id) {
  return `<defs>
    <linearGradient id="${id}-silver" x1=".12" y1="0" x2=".85" y2="1"><stop stop-color="#ffffff"/><stop offset=".28" stop-color="#dce8f9"/><stop offset=".47" stop-color="#96b5dd"/><stop offset=".68" stop-color="#426ca6"/><stop offset=".86" stop-color="#b5cdf0"/><stop offset="1" stop-color="#f6fbff"/></linearGradient>
    <linearGradient id="${id}-blue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e5f1ff"/><stop offset=".19" stop-color="#80acf5"/><stop offset=".42" stop-color="#367be8"/><stop offset=".72" stop-color="#2056b4"/><stop offset="1" stop-color="#9cc8ff"/></linearGradient>
    <linearGradient id="${id}-edge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".95"/><stop offset=".45" stop-color="#e5f2ff" stop-opacity=".16"/><stop offset="1" stop-color="#244c80" stop-opacity=".48"/></linearGradient>
    <linearGradient id="${id}-light" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".55" stop-color="#eff6ff"/><stop offset="1" stop-color="#94b1d9"/></linearGradient>
    <radialGradient id="${id}-sphere" cx=".28" cy=".2" r=".9"><stop stop-color="#fff"/><stop offset=".22" stop-color="#c5e0ff"/><stop offset=".6" stop-color="#508be0"/><stop offset=".9" stop-color="#2356a5"/><stop offset="1" stop-color="#153f82"/></radialGradient>
    <filter id="${id}-shadow" x="-60%" y="-60%" width="220%" height="240%"><feGaussianBlur stdDeviation="4.5"/></filter>
  </defs>`;
}

function object(id, p) {
  const silver=`url(#${p}-silver)`, blue=`url(#${p}-blue)`, edge=`url(#${p}-edge)`, light=`url(#${p}-light)`;
  if (id === 'lighthouse') return `<g transform="translate(5 0) rotate(-21 95 87)"><ellipse cx="94" cy="142" rx="48" ry="7" fill="#406394" opacity=".10" filter="url(#${p}-shadow)"/><path d="M55 102c-18-15-11-45 13-58 26-15 57-10 70 9 13 20 3 43-18 55" fill="none" stroke="#436ca5" stroke-width="19"/><path d="M55 96c-18-15-11-45 13-58 26-15 57-10 70 9 13 20 3 43-18 55" fill="none" stroke="${silver}" stroke-width="20"/><path d="M53 82c-5-15 7-32 24-40 22-11 45-8 56 5" fill="none" stroke="#fff" stroke-width="1.2" opacity=".85"/><circle cx="92" cy="87" r="24" fill="url(#${p}-sphere)"/><path d="M66 110c14 15 40 19 62 4" fill="none" stroke="${blue}" stroke-width="18"/><path d="M66 103c14 15 40 19 62 4" fill="none" stroke="${edge}" stroke-width="1.2"/></g>`;
  if(id === 'clawpro') return `<g transform="translate(2 -2)"><ellipse cx="98" cy="145" rx="48" ry="8" fill="#406394" opacity=".1" filter="url(#${p}-shadow)"/><path d="m98 111 49 22-49 24-49-24Z" fill="#7496c5" opacity=".24"/><path d="m98 86 49 23v19l-49 24-49-24v-19Z" fill="${blue}"/><path d="m98 85 49 24-49 24-49-24Z" fill="${light}"/><path d="m49 109 49 24v19" fill="none" stroke="#fff" stroke-opacity=".5"/><path d="m98 43 49 24v24l-49 24-49-24V67Z" fill="${silver}"/><path d="m98 43 49 24-49 24-49-24Z" fill="${light}"/><path d="m98 43 49 24-49 24-49-24Z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="m98 91 0 24" stroke="#dcecff"/><path d="m73 68 25-12 25 12-25 12Z" fill="none" stroke="#a7bfdd" stroke-width="1"/><path d="m98 25 20 10-20 10-20-10Z" fill="${blue}"/></g>`;
  if(id === 'skillhub') return `<g transform="rotate(-16 100 90)"><ellipse cx="96" cy="144" rx="52" ry="7" fill="#406394" opacity=".1" filter="url(#${p}-shadow)"/><g transform="translate(15 5)"><rect x="29" y="44" width="61" height="61" rx="18" fill="#376ab3"/><rect x="29" y="38" width="61" height="61" rx="18" fill="${silver}" stroke="${edge}"/><rect x="37" y="45" width="45" height="45" rx="12" fill="none" stroke="#fff" stroke-opacity=".58"/></g><g transform="translate(52 39)"><rect x="29" y="44" width="61" height="61" rx="18" fill="#255aab"/><rect x="29" y="38" width="61" height="61" rx="18" fill="${blue}" stroke="${edge}"/><path d="M45 68h28m-14-14v28" stroke="#e5f1ff" stroke-width="3" stroke-linecap="round" opacity=".9"/></g><path d="M78 91c-1-11 5-17 16-17" fill="none" stroke="#295b9e" stroke-width="11"/><path d="M78 87c-1-11 5-17 16-17" fill="none" stroke="${silver}" stroke-width="10"/><path d="M78 86c1-9 6-14 14-14" fill="none" stroke="#fff" stroke-width="1.2"/></g>`;
  return `<g transform="translate(0 -2)"><ellipse cx="100" cy="145" rx="53" ry="8" fill="#406394" opacity=".1" filter="url(#${p}-shadow)"/><g stroke-linecap="round" stroke-linejoin="round"><path d="M81 85 54 58 34 67M83 96 49 97 36 119M100 103l-9 29-21 10M116 96l26 17 16-5M118 81l24-22 18 6M99 68l1-27 17-12" fill="none" stroke="#355e95" stroke-width="14"/><path d="M81 81 54 54 34 63M83 92 49 93 36 115M100 99l-9 29-21 10M116 92l26 17 16-5M118 77l24-22 18 6M99 64l1-27 17-12" fill="none" stroke="${silver}" stroke-width="14"/><path d="m78 65 22-12 24 12v28l-24 14-22-14Z" fill="${blue}" stroke="${edge}" stroke-width="1"/><path d="m78 65 22 14 24-14M100 79v28" fill="none" stroke="#c2dcff" stroke-width="1.1"/><path d="m90 64 10-5 11 6-11 6Z" fill="${light}"/></g></g>`;
}

export function productGlyph(product, className='') {
  const id=`ahp-glyph-${++sequence}`;
  return `<svg class="${String(className).replace(/["<>]/g,'')}" viewBox="0 0 200 180" fill="none" aria-hidden="true">${definitions(id)}${object(canonical(product),id)}</svg>`;
}

const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
function material(nx,ny,nz,theta){
  const diffuse = Math.max(0,-nx*.42-ny*.60+nz*.68);
  const metal = .5+.5*Math.sin(theta+1.1);
  const silver = [.78,.86,.96], cobalt=[.20,.43,.80];
  const env=clamp(.30+.72*Math.pow(Math.abs(ny),.55)+.18*Math.sin(theta*2+.5));
  const tint=.22+.48*metal;
  const highlight=Math.pow(Math.max(0,-nx*.25-ny*.55+nz*.8),24)*.68;
  const rim=Math.pow(1-Math.abs(nz),3)*.18;
  const base=cobalt.map((c,i)=>c*(1-tint)+silver[i]*tint);
  return '#'+base.map(c=>Math.round(clamp(c*(.40+.65*env+.22*diffuse)+highlight+rim)*255).toString(16).padStart(2,'0')).join('');
}

function torusMesh(){
  const cZ=Math.cos(-.40), sZ=Math.sin(-.40), cX=Math.cos(.91), sX=Math.sin(.91);
  const rot=(x,y,z)=>[x*cZ-(y*cX-z*sX)*sZ,x*sZ+(y*cX-z*sX)*cZ,y*sX+z*cX];
  const project=(t,f)=>{ const u=25*Math.cos(f), z=18*Math.sin(f), r=166+u;return rot(r*Math.cos(t),r*Math.sin(t),z); };
  const segments=168,cross=28,start=-.36,end=Math.PI*2-.66,faces=[];
  for(let a=0;a<segments;a++)for(let b=0;b<cross;b++){
    const t0=start+(end-start)*a/segments,t1=start+(end-start)*(a+1)/segments,f0=b/cross*Math.PI*2,f1=(b+1)/cross*Math.PI*2;
    const points=[project(t0,f0),project(t1,f0),project(t1,f1),project(t0,f1)];
    const t=(t0+t1)/2,f=(f0+f1)/2;
    let n=rot(Math.cos(f)*Math.cos(t)/25,Math.cos(f)*Math.sin(t)/25,Math.sin(f)/18),length=Math.hypot(...n);n=n.map(v=>v/length);
    if(n[2]<-.10)continue;
    const d=points.reduce((s,p)=>s+p[2],0)/4;
    const fill=material(...n,t);
    faces.push({d,svg:`<path d="M${points.map(p=>`${(p[0]+350).toFixed(2)} ${(p[1]+270).toFixed(2)}`).join('L')}Z" fill="${fill}" stroke="${fill}" stroke-width=".65" stroke-linejoin="round"/>`});
  }
  for(const t of [start,end]){
    const pts=Array.from({length:cross},(_,i)=>project(t,i/cross*Math.PI*2));
    faces.push({d:pts.reduce((s,p)=>s+p[2],0)/cross+.2,svg:`<path d="M${pts.map(p=>`${(p[0]+350).toFixed(2)} ${(p[1]+270).toFixed(2)}`).join('L')}Z" fill="#a8c5eb" stroke="#dbeaff" stroke-width=".8"/>`});
  }
  return faces.sort((a,b)=>a.d-b.d).map(f=>f.svg).join('');
}

export function mountVisual(el,{lang='zh',reducedMotion=false}={}) {
  const p=`ahp-scene-${++sequence}`;
  const labels=lang==='en'?['PERSONAL','ENTERPRISE','SKILLS','OPEN SOURCE']:['个人助理','企业应用','专业技能','开放构建'];
  const nodes=[['lighthouse',124,77,-5],['clawpro',489,118,8],['skillhub',466,332,-6],['octop',89,320,6]];
  const reduce = reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.classList.add('ahp-visual');
  el.classList.toggle('ahp-visual--reduced',reduce);
  el.innerHTML=`<div class="ahp-visual__parallax"><svg class="ahp-visual__scene" viewBox="0 0 700 530" fill="none" aria-hidden="true">${definitions(p)}
  <defs><radialGradient id="${p}-ground"><stop stop-color="#406eae" stop-opacity=".16"/><stop offset=".55" stop-color="#7597c7" stop-opacity=".065"/><stop offset="1" stop-color="#8da6cc" stop-opacity="0"/></radialGradient><linearGradient id="${p}-orbit" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#aac1e3" stop-opacity="0"/><stop offset=".35" stop-color="#b5cbe9" stop-opacity=".7"/><stop offset=".8" stop-color="#aac1e3" stop-opacity=".2"/><stop offset="1" stop-color="#aac1e3" stop-opacity="0"/></linearGradient></defs>
  <ellipse cx="352" cy="422" rx="242" ry="49" fill="url(#${p}-ground)"/>
  <g class="ahp-visual__orbit"><ellipse cx="350" cy="268" rx="288" ry="156" transform="rotate(-20 350 268)" stroke="url(#${p}-orbit)" stroke-width=".8"/><path d="M187 145C254 68 452 69 547 179M533 359C474 428 302 442 194 370" stroke="#bdcfe7" stroke-width=".65" stroke-dasharray="2 7" opacity=".55"/><circle cx="225" cy="101" r="2.2" fill="#83a8dc"/><circle cx="568" cy="302" r="2" fill="#8fb0df"/><circle cx="295" cy="416" r="2" fill="#a7bfdf"/></g>
  <g class="ahp-visual__ring">${torusMesh()}<path class="ahp-visual__current" d="M179 267C145 184 208 137 306 157C405 177 510 243 521 295" stroke="#e3f2ff" stroke-opacity=".75" stroke-width="1.1" stroke-linecap="round" stroke-dasharray="1 29 18 960"/><path d="M247 325C289 352 342 370 387 365" stroke="#edf6ff" stroke-opacity=".70" stroke-width=".7" stroke-linecap="round"/></g>
  ${nodes.map(([id,x,y,r],i)=>`<g class="ahp-visual__node ahp-visual__node--${id}" data-product="${id}" style="--node-delay:${i*-.8}s;transform-origin:${x+70}px ${y+63}px"><g transform="translate(${x} ${y}) rotate(${r} 70 63)"><g transform="scale(.70)">${object(id,p)}</g></g><text x="${x+70}" y="${y+137}" text-anchor="middle" class="ahp-visual__label">${labels[i]}</text></g>`).join('')}
  </svg></div>`;
  const container=el.querySelector('.ahp-visual__parallax');
  let active=true,frame=0,px=0,py=0,tx=0,ty=0;
  function render(){frame=0;px+=(tx-px)*.075;py+=(ty-py)*.075;container.style.transform=`translate3d(${px.toFixed(2)}px,${py.toFixed(2)}px,0) rotateX(${(-py*.10).toFixed(2)}deg) rotateY(${(px*.10).toFixed(2)}deg)`;if(active&&(Math.abs(tx-px)+Math.abs(ty-py)>.03))frame=requestAnimationFrame(render);}
  function move(event){if(reduce||!active)return;const b=el.getBoundingClientRect();tx=((event.clientX-b.left)/b.width-.5)*15;ty=((event.clientY-b.top)/b.height-.5)*12;if(!frame)frame=requestAnimationFrame(render);}
  function leave(){tx=ty=0;if(!reduce&&!frame)frame=requestAnimationFrame(render);}
  el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);
  return {
    setProduct(product){const target=product?canonical(product):null;el.classList.toggle('ahp-visual--focused',!!target);el.querySelectorAll('[data-product]').forEach(node=>node.classList.toggle('is-active',node.dataset.product===target));},
    pause(value){active=!value;el.classList.toggle('ahp-visual--paused',!!value);if(value&&frame){cancelAnimationFrame(frame);frame=0;}},
    destroy(){if(frame)cancelAnimationFrame(frame);el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);el.innerHTML='';el.classList.remove('ahp-visual','ahp-visual--focused','ahp-visual--reduced','ahp-visual--paused');}
  };
}
