/* Function-space variant: the camera travels inside disassembled product UI.
   All surfaces are capability illustrations; no values describe a live service. */
const C = { ink: '#102A50', blue: '#245BFF', ice: '#EAF4FF', white: '#FFFFFF', cloud: '#F8FBFF', muted: '#56749A', cyan: '#35B4D8' };
const FONT = '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
function text(ctx, value, x, y, size = 38, color = C.ink, weight = 500) {
  ctx.font = `${weight} ${size}px ${FONT}`; ctx.fillStyle = color; ctx.fillText(value, x, y);
}
function path(ctx, points, color = C.blue, width = 5) {
  ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
function round(ctx,x,y,w,h,r,fill) { ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill(); }
function glyph(ctx, name, x, y, scale = 1, color = C.blue) {
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle=color;ctx.lineWidth=5;ctx.lineJoin='round';ctx.lineCap='round';
  if(name==='spark')path(ctx,[[0,-35],[10,-10],[35,0],[10,10],[0,35],[-10,10],[-35,0],[-10,-10],[0,-35]],color,5);
  else if(name==='code'){path(ctx,[[-18,-25],[-42,0],[-18,25]],color,5);path(ctx,[[18,-25],[42,0],[18,25]],color,5);path(ctx,[[8,-34],[-8,34]],color,5);}
  else if(name==='plug'){path(ctx,[[-23,-35],[-23,-13],[23,-13],[23,-35]],color,5);path(ctx,[[-33,-13],[-33,6],[-18,27],[0,31],[18,27],[33,6],[33,-13]],color,5);path(ctx,[[0,31],[0,45]],color,5);}
  else if(name==='search'){ctx.beginPath();ctx.arc(-6,-6,25,0,Math.PI*2);ctx.stroke();path(ctx,[[13,13],[36,36]],color,6);}
  else if(name==='clock'){ctx.beginPath();ctx.arc(0,0,35,0,Math.PI*2);ctx.stroke();path(ctx,[[0,-22],[0,0],[17,11]],color,5);}
  else if(name==='memory'){ctx.strokeRect(-25,-25,50,50);for(const p of[-13,13]){path(ctx,[[p,-40],[p,-25]],color,5);path(ctx,[[p,25],[p,40]],color,5);path(ctx,[[-40,p],[-25,p]],color,5);path(ctx,[[25,p],[40,p]],color,5);}ctx.strokeRect(-9,-9,18,18);}
  else if(name==='book'){path(ctx,[[-34,-29],[-8,-25],[0,-18],[8,-25],[34,-29],[34,28],[8,32],[0,38],[-8,32],[-34,28],[-34,-29]],color,5);path(ctx,[[0,-18],[0,38]],color,5);}
  else{ctx.strokeRect(-28,-34,56,68);path(ctx,[[-14,-12],[14,-12]],color,5);path(ctx,[[-14,4],[14,4]],color,5);path(ctx,[[-14,20],[5,20]],color,5);}
  ctx.restore();
}

export function buildFunctionWorld(THREE, index = 0) {
  index = Math.max(0,Math.min(3,Math.floor(index)));
  const world = new THREE.Group();world.name=`function-world-${index}`;
  const mat = {
    white: new THREE.MeshStandardMaterial({color:C.white,roughness:.5,metalness:.05}),
    ice: new THREE.MeshStandardMaterial({color:'#CFE2FC',roughness:.42,metalness:.12}),
    blue: new THREE.MeshStandardMaterial({color:C.blue,roughness:.34,metalness:.18}),
    ink: new THREE.MeshStandardMaterial({color:C.ink,roughness:.5,metalness:.15}),
    cyan: new THREE.MeshStandardMaterial({color:C.cyan,roughness:.4,metalness:.1}),
    trace: new THREE.MeshBasicMaterial({color:C.blue,transparent:true,opacity:.2,depthWrite:false}),
  };
  const stageTargets=[];
  function mesh(geometry,material,name,x,y,z,parent=world) {
    const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function box(w,h,d,material,name,x,y,z,parent) {return mesh(new THREE.BoxGeometry(w,h,d),material,name,x,y,z,parent);}
  function map(w,h,draw,alpha=false) {
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{alpha});
    if(!alpha){ctx.fillStyle=C.white;ctx.fillRect(0,0,w,h);}else ctx.clearRect(0,0,w,h);
    draw(ctx,w,h);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
  }
  function surface(name,x,y,z,w,h,draw,{yaw=0,depth=70,blue=false,res=768}={}) {
    const texture=map(res,Math.round(res*h/w),draw);
    const face=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});
    const m=box(w,h,depth,[mat.ice,mat.ice,blue?mat.blue:mat.white,mat.ice,face,mat.ice],name,x,y,z);m.rotation.y=yaw;return m;
  }
  function heading(name,x,y,z,title,sub,w=680,{blue=false}={}) {
    const height=sub?160:105;
    const texture=map(1024,Math.round(1024*height/w),(ctx,W,H)=>{
      text(ctx,title,8,H*(sub?.48:.7),sub?72:88,blue?C.blue:C.ink,650);
      if(sub)text(ctx,sub,10,H*.88,33,C.muted,400);
    },true);
    const m=mesh(new THREE.PlaneGeometry(w,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}),name,x,y,z);
    m.userData.type='function-label';return m;
  }
  function route(name,points,{color=C.blue,opacity=.2,radius=6}={}) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const m=mesh(new THREE.TubeGeometry(curve,54,radius,6,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false}),name,0,0,0);
    m.castShadow=false;m.receiveShadow=false;m.userData.passageRibbon=true;return m;
  }
  function pane(name,x,y,z,title,sub,kind='document',{w=710,h=410,yaw=0,blue=false}={}) {
    return surface(name,x,y,z,w,h,(ctx,W,H)=>{
      const bg=blue?C.blue:C.white,ink=blue?C.white:C.ink,muted=blue?'#D8E4FF':C.muted;
      ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
      glyph(ctx,kind,65,67,.58,blue?C.white:C.blue);
      text(ctx,title,37,H*.43,52,ink,650);
      if(sub)text(ctx,sub,39,H*.63,25,muted,400);
      path(ctx,[[40,H*.77],[W-40,H*.77]],blue?'#688AFF':'#D4E3F7',2);
      text(ctx,'能力示意',40,H*.90,20,muted,400);
    },{yaw,blue,depth:100});
  }
  function composer(name,x,y,z,title,value,{kind='任务目标',w=900}={}) {
    return surface(name,x,y,z,w,310,(ctx,W,H)=>{
      text(ctx,kind,36,52,24,C.muted,500);text(ctx,title,36,113,48,C.ink,650);
      round(ctx,34,146,W-68,H-176,7,C.ice);text(ctx,value,53,H-55,27,C.muted,400);
      path(ctx,[[W-80,H-70],[W-65,H-55],[W-80,H-40]],C.blue,4);
    },{depth:68,yaw:.055,res:1024});
  }
  function button(name,x,y,z,title,icon='spark',w=310) {
    return surface(name,x,y,z,w,155,(ctx,W,H)=>{
      ctx.fillStyle=C.blue;ctx.fillRect(0,0,W,H);glyph(ctx,icon,71,H/2,.72,C.white);text(ctx,title,134,H/2+17,42,C.white,600);
    },{depth:130,blue:true,res:512,yaw:-.07});
  }
  function row(name,x,y,z,title,{blue=false,w=680}={}) {
    return surface(name,x,y,z,w,118,(ctx,W,H)=>{
      ctx.fillStyle=blue?C.blue:C.white;ctx.fillRect(0,0,W,H);
      ctx.beginPath();ctx.arc(43,H/2,10,0,Math.PI*2);ctx.fillStyle=blue?C.white:C.blue;ctx.fill();text(ctx,title,81,H/2+16,42,blue?C.white:C.ink,550);
      path(ctx,[[W-67,H/2-11],[W-55,H/2],[W-67,H/2+11]],blue?C.white:C.blue,4);
    },{depth:60,blue,res:768});
  }
  function core(name,_x,_y,_z,title,{skill=false}={}) {
    // This is the product's open processor/window, not a display placed beside
    // the camera. Its front and exposed interior remain physically traversable.
    const rig=new THREE.Group();rig.name=name;rig.position.set(0,40,-1300);world.add(rig);
    const details=[
      {title:'主 Agent / 协作编排',left:['任务目标','任务拆解','角色分工'],right:['研究','内容','开发']},
      {title:'企业 Agent / 经验复用',left:['行业知识','专业技能','成熟方法'],right:['组织复用','业务应用','产品孵化']},
      {title:'你的 Agent / 能力接入',left:['SKILL','PLUGIN','MCP'],right:['发现能力','选择接入','任务调用']},
      {title:'自有工作空间 / 上下文协作',left:['知识','长期记忆','专属专家'],right:['自主部署','上下文','持续协作']},
    ][index];
    function localBox(w,h,d,material,suffix,x,y,z){return box(w,h,d,material,`${name}-${suffix}`,x,y,z,rig);}
    // The window's corners and side rails have real z extent. No front face
    // occupies x[-220,220], y[-220,260], including the socket geometry.
    for(const side of[-1,1]){
      localBox(22,690,30,mat.blue,`front-side-${side}`,side*520,0,350);
      localBox(18,690,24,mat.ice,`back-side-${side}`,side*520,0,-350);
      for(const vertical of[-1,1])localBox(22,22,724,vertical>0?mat.ice:mat.blue,`depth-edge-${side}-${vertical}`,side*520,vertical*335,0);
      for(let n=0;n<3;n++){
        localBox(34,86,180,skill?mat.cyan:mat.blue,`exposed-socket-${side}-${n}`,side*485,140-n*155,-50-n*55);
        localBox(102,18,175,mat.ice,`functional-tab-${side}-${n}`,side*425,160-n*155,-110-n*55);
      }
    }
    localBox(1060,22,30,mat.blue,'front-top',0,345,350);
    localBox(1060,22,30,mat.blue,'front-bottom',0,-345,350);
    localBox(1050,18,24,mat.ice,'back-top',0,345,-350);
    localBox(1050,18,24,mat.ice,'back-bottom',0,-345,-350);
    // A true UI title bar and split control strips make the volume recognizable
    // as an Agent workspace as its front expands around the viewer.
    const head=surface(`${name}-workspace-header`,0,425,-950,1040,95,(ctx,W,H)=>{
      ctx.fillStyle=C.blue;ctx.fillRect(0,0,W,H);glyph(ctx,'spark',47,H/2,.52,C.white);
      text(ctx,details.title,88,H/2+14,38,C.white,600);
    },{depth:50,blue:true,res:1024});
    for(const side of[-1,1]){
      const words=side<0?details.left:details.right;
      surface(`${name}-front-controls-${side}`,side*385,40,-936,240,430,(ctx,W,H)=>{
        ctx.fillStyle=C.white;ctx.fillRect(0,0,W,H);
        text(ctx,side<0?'输入与上下文':'执行与协作',27,70,34,C.muted,500);
        words.forEach((word,n)=>{
          const y=153+n*135;
          round(ctx,22,y-43,W-44,88,9,n===0?C.ice:C.cloud);
          text(ctx,word,44,y+12,43,n===0?C.blue:C.ink,600);
        });
      },{depth:46,res:384});
      // Interior side shelves become visible after crossing the front controls.
      const inside=surface(`${name}-inside-controls-${side}`,side*350,40,-1565,190,285,(ctx,W,H)=>{
        ctx.fillStyle=C.ice;ctx.fillRect(0,0,W,H);
        words.forEach((word,n)=>text(ctx,word,24,98+n*125,39,C.ink,550));
      },{depth:34,res:384,yaw:side>0?-.25:.25});
      inside.userData.functionalInterior=true;
    }
    const hologramMaterial=new THREE.MeshBasicMaterial({color:skill?C.cyan:C.blue,transparent:true,opacity:.25,wireframe:true,depthWrite:false});
    const hologram=mesh(new THREE.OctahedronGeometry(74,0),hologramMaterial,`${name}-transparent-task-processor`,0,45,-30,rig);
    hologram.castShadow=false;hologram.receiveShadow=false;hologram.userData.passageRibbon=true;
    route(`${name}-internal-input-flow`,[[-335,40,-955],[-150,95,-1180],[0,85,-1330]],{radius:7,opacity:.25});
    route(`${name}-internal-output-flow`,[[0,85,-1330],[140,70,-1490],[335,40,-1660]],{radius:7,opacity:.25});
    return {rig,m:hologram,header:head};
  }
  function documentOutput(name,x,y,z,title,subtitle,{blue=false}={}) {
    // Individual document pages, separated in z: no shared outer browser or frame.
    box(710,510,18,mat.ice,`${name}-back-page`,x+32,y-24,z-105);
    box(710,510,18,mat.white,`${name}-middle-page`,x+14,y-12,z-52);
    return pane(name,x,y,z,title,subtitle,'document',{w:710,h:510,blue,yaw:x>0?-.08:.08});
  }
  function book(name,x,y,z,title,kind='book',{blue=false,w=560}={}) {
    const body=pane(name,x,y,z,title,'可复用的企业积累',kind,{w,h:320,yaw:.06,blue});
    box(30,320,145,blue?mat.ice:mat.blue,`${name}-spine`,x-w/2-18,y,z-15);
    return body;
  }
  function skillModule(name,x,y,z,title,kind,subtitle,cyan=false) {
    const rig=new THREE.Group();rig.name=name;rig.position.set(x,y,z);rig.rotation.y=x>0?-.15:.15;world.add(rig);
    const texture=map(768,640,(ctx,W,H)=>{
      ctx.fillStyle=cyan?'#E9F9FC':C.ice;ctx.fillRect(0,0,W,H);glyph(ctx,kind,92,105,1.0,cyan?C.cyan:C.blue);
      text(ctx,title,52,285,70,C.ink,650);text(ctx,subtitle,55,368,32,C.muted,400);text(ctx,'按任务接入',55,533,29,cyan?C.cyan:C.blue,600);
    });
    box(420,350,265,[mat.ice,mat.ice,mat.white,mat.blue,new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),mat.blue],`${name}-body`,0,0,0,rig);
    for(let n=0;n<3;n++)box(54,54,175,cyan?mat.cyan:mat.blue,`${name}-plug-pin-${n}`,-120+n*120,-205,-35,rig);
    const collar=mesh(new THREE.TorusGeometry(62,20,10,28),cyan?mat.cyan:mat.blue,`${name}-socket`,x>0?-240:240,0,-50,rig);
    collar.rotation.y=Math.PI/2;
    return rig;
  }

  if(index===0) {
    // Task input becomes the entrance; camera passes between input and submit controls.
    composer('task-composer',-710,-30,160,'完成一份产品研究','输入目标，开始多角色协作');
    button('start-collaboration',610,70,45,'开始协作');
    row('schedule-control',665,-180,-360,'按计划继续推进',{w:690});
    core('main-agent-core',-635,35,-1020,'主 Agent');
    heading('task-queue-label',660,380,-1060,'任务队列','把一个目标，拆成协作步骤',680);
    ['拆解任务','分配角色','汇总结果'].forEach((v,n)=>row(`task-step-${n}`,660,175-n*148,-1080-n*42,v,{w:680,blue:n===0}));
    pane('research-function',-655,45,-2070,'研究 Agent','检索信息 · 整理依据','search',{yaw:.08});
    pane('content-function',665,85,-2370,'内容 Agent','整理观点 · 完成表达','document',{yaw:-.08});
    pane('development-function',-655,0,-2790,'开发 Agent','编写代码 · 调用工具','code',{yaw:.08});
    heading('tools-label',655,250,-2830,'工具工作区','模型 / 工具 / 消息通道',680);
    ['模型','工具','通道'].forEach((v,n)=>button(`tool-${n}`,500+n*167,-10,-2850-n*105,v,n===1?'code':'plug',145));
    documentOutput('research-output',-655,35,-3650,'研究成果','分工协作，形成可用结果');
    pane('scheduled-output',665,70,-3890,'定时任务','收集信息 · 生成摘要 · 分发结果','clock',{w:700,h:390,yaw:-.08,blue:true});
    route('task-to-core',[[-650,100,140],[-520,50,-400],[-335,40,-1160]]);
    route('submit-to-agent',[[610,70,45],[470,-30,-470],[-335,40,-1160]]);
    route('agent-to-research',[[-335,40,-1160],[-570,140,-1560],[-655,45,-2070]]);
    route('agent-to-content',[[-335,40,-1160],[-320,340,-1630],[665,85,-2370]]);
    route('research-to-output',[[-655,45,-2070],[-560,-40,-3000],[-655,35,-3650]]);
    route('tools-to-schedule',[[665,0,-2850],[570,60,-3330],[665,70,-3890]]);
    stageTargets.push(['任务输入',-710,-30,160],['进入主 Agent',0,40,-1300],['多角色工作区',-100,60,-2370],['成果与定时任务',0,60,-3650]);
  } else if(index===1) {
    composer('business-agent-composer',-710,-30,160,'构建你的业务 Agent','选择企业积累，复用成熟经验',{kind:'企业 Agent'});
    button('asset-reuse-command',650,80,45,'复用经验','book',350);
    heading('enterprise-assets-label',-670,460,-1000,'企业积累','把知识、技能、方法变成资产',710);
    book('knowledge-asset',-670,160,-930,'行业知识','book',{w:620});
    book('skill-asset',-670,-200,-1160,'专业技能','plug',{w:620,blue:true});
    book('method-asset',670,155,-1100,'成熟方法','document',{w:620});
    row('asset-role-control',670,-105,-1350,'按组织与角色复用',{w:660});
    core('enterprise-agent',-635,25,-2110,'业务 Agent');
    pane('business-interface',670,65,-2280,'业务接口','模型、工具与业务系统结合','code',{w:700,h:420,yaw:-.08});
    row('organization-governance',-655,40,-2780,'组织治理',{w:700});
    row('operations-evaluation',665,40,-2900,'评测与持续运营',{w:700});
    documentOutput('business-application-output',-655,35,-3630,'业务应用','让企业能力进入实际工作');
    documentOutput('ai-product-incubation',665,65,-3850,'AI 产品孵化','将行业积累融入产品与服务',{blue:true});
    route('assets-into-agent',[[-670,160,-930],[-540,70,-1490],[-335,40,-1590]],{radius:9,opacity:.24});
    route('methods-into-agent',[[670,155,-1100],[400,350,-1640],[-335,40,-1590]]);
    route('agent-into-business',[[-335,40,-1590],[-540,50,-2850],[-655,35,-3630]],{radius:9,opacity:.24});
    route('agent-into-product',[[-335,40,-1590],[-180,350,-2950],[665,65,-3850]],{radius:9,opacity:.24});
    stageTargets.push(['企业 Agent 输入',-710,-30,160],['知识、技能与方法',0,130,-1100],['进入企业 Agent',0,40,-1300],['应用与产品孵化',0,65,-3740]);
  } else if(index===2) {
    composer('skill-search-input',-710,-30,160,'为 Agent 接入能力','搜索研究、内容与开发技能',{kind:'发现技能'});
    button('select-skill-command',650,80,45,'选择接入','plug',350);
    core('your-agent-socket',-635,35,-1040,'你的 Agent',{skill:true});
    heading('connection-ports-label',670,365,-1080,'接入端口','从专业方法，到工作工具',670);
    ['SKILL','PLUGIN','MCP'].forEach((v,n)=>row(`capability-port-${n}`,670,160-n*148,-1110-n*45,v,{w:650,blue:n===0}));
    skillModule('skill-method-module',-650,50,-2110,'SKILL','search','专业方法与任务流程',true);
    heading('skill-module-label',-650,390,-2120,'深度研究','搜索信息，交叉整理依据',650,{blue:true});
    skillModule('plugin-tool-module',660,45,-2470,'PLUGIN','code','把工具带进任务');
    heading('plugin-module-label',660,385,-2470,'开发工具','连接开发环境与工作工具',650);
    skillModule('mcp-connector-module',-650,35,-2820,'MCP','plug','连接数据与业务工具',true);
    heading('mcp-module-label',-650,375,-2820,'业务连接','让 Agent 调用专业服务',650);
    documentOutput('extended-agent-output',-655,35,-3650,'更多专业能力','按任务组合，扩展 Agent 边界');
    pane('creator-publish-output',665,70,-3850,'发布你的专业','让更多 Agent 接入你的能力','plug',{w:700,h:410,yaw:-.08,blue:true});
    route('search-to-socket',[[-710,-30,160],[-530,90,-420],[-335,40,-1160]],{color:C.cyan});
    route('socket-to-skill',[[-335,40,-1160],[-540,30,-1650],[-650,50,-2110]],{color:C.cyan,radius:8});
    route('socket-to-plugin',[[-335,40,-1160],[-200,350,-1820],[660,45,-2470]]);
    route('plugin-to-mcp',[[660,45,-2470],[0,350,-2690],[-650,35,-2820]],{color:C.cyan});
    route('capabilities-to-agent',[[-650,35,-2820],[-540,50,-3290],[-655,35,-3650]],{radius:8,color:C.cyan});
    stageTargets.push(['发现与选择',-710,-30,160],['进入能力接入核心',0,40,-1300],['技能、工具与连接',0,60,-2470],['扩展与发布能力',0,60,-3750]);
  } else {
    composer('own-workspace-input',-710,-30,160,'围绕你的资料开始工作','带上知识与上下文，继续推进',{kind:'自己的 AI 空间'});
    button('self-hosted-setting',650,80,45,'自有环境','memory',350);
    heading('own-knowledge-label',-670,415,-990,'自己的知识','围绕已有资料开展工作',700);
    ['产品与业务资料','方法与实践记录','团队共享知识'].forEach((v,n)=>{
      row(`knowledge-file-${n}`,-670,180-n*150,-1010-n*80,v,{w:700,blue:n===0});
      box(28,115,190,mat.ice,`knowledge-file-depth-${n}`,-1042,180-n*150,-1060-n*80);
    });
    core('self-hosted-workspace',650,50,-1150,'自托管空间');
    heading('memory-function-label',-650,350,-2190,'长期记忆','为下一次任务保留有用上下文',700);
    ['任务背景','使用偏好','长期目标'].forEach((v,n)=>row(`memory-context-${n}`,-650,125-n*70,-2110-n*270,v,{w:680,blue:n===1}));
    // Memory remains a real deep ribbon entirely to the camera's left.
    route('memory-depth-ribbon',[[-940,-110,-1800],[-390,130,-2080],[-910,-150,-2370],[-390,80,-2700],[-800,-100,-2980]],{opacity:.4,radius:18});
    pane('domain-expert',665,110,-2220,'业务专家','结合领域知识回答与协作','spark',{w:700,h:380,yaw:-.08});
    pane('project-expert',665,-25,-2790,'项目助手','围绕项目上下文继续推进','document',{w:700,h:380,yaw:-.08});
    documentOutput('own-workspace-output',-655,35,-3660,'自己的工作空间','知识 × 记忆 × 专家');
    pane('ownership-boundary-output',665,70,-3870,'自主部署与管理','自有服务器 / 内网 / 多用户协作','memory',{w:700,h:410,yaw:-.08,blue:true});
    // Boundary is a property of this workspace, expressed as separate brackets,
    // never as architecture or a room enclosing the visitor.
    for(const side of[-1,1]){
      box(20,210,90,mat.ice,`ownership-bracket-${side}`,side*1080,45,-3860);
      box(90,20,90,mat.ice,`ownership-bracket-top-${side}`,side*1045,145,-3860);
      box(90,20,90,mat.ice,`ownership-bracket-bottom-${side}`,side*1045,-55,-3860);
    }
    route('knowledge-to-memory',[[-670,180,-1010],[-540,90,-1600],[-650,125,-2110]]);
    route('workspace-to-experts',[[335,40,-1160],[540,90,-1750],[665,110,-2220]]);
    route('context-to-own-space',[[-650,-15,-2650],[-540,40,-3160],[-655,35,-3660]],{radius:8});
    route('experts-to-own-space',[[665,-25,-2790],[150,350,-3330],[-655,35,-3660]]);
    stageTargets.push(['自有工作空间输入',-710,-30,160],['进入自有工作空间',0,40,-1300],['记忆与专家',0,80,-2400],['持续积累与自主掌握',0,65,-3760]);
  }
  // A small, explicit illustration label is part of the entry UI, not a live badge.
  heading('capability-illustration-label',650,-345,-390,'能力示意','',340);
  world.userData={
    productIndex:index,capabilityIllustration:true,variant:'inside-functions',
    clearPassage:{x:[-220,220],y:[-220,260],z:[1300,-4800]},
    stageTargets:stageTargets.map(([label,x,y,z])=>({label,x,y,z})),
    depthRange:[600,-4300],
    functionalCore:{center:[0,40,-1300],frontZ:-950,backZ:-1650,opening:{x:[-250,250],y:[-250,350]}},
  };
  return world;
}
