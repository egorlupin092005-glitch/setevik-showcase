(() => {
  const $=s=>document.querySelector(s),ns='http://www.w3.org/2000/svg';
  const story=$('.story'),camera=$('#camera'),drone=$('#drone'),net=$('#net'),back=$('#net-back');
  const frame=$('#tracking-frame'),scan=$('#scan'),arc=$('#flight-path'),trail=$('#flight-trail');
  const seek=$('#seek'),motion=$('#motion'),steps=[...document.querySelectorAll('[data-step]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),phone=matchMedia('(max-width:700px)');
  let autoPlayed=false;
  function sizeScene(){ $('#scene').setAttribute('viewBox',phone.matches?'100 10 800 560':'0 0 1000 600'); }
  sizeScene();phone.addEventListener('change',sizeScene);
  const DURATION=21000,CHAPTER=7000,clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v)},mix=(a,b,t)=>a+(b-a)*t;
  const paths=[],backs=[];
  for(let axis=0;axis<2;axis++)for(let i=0;i<=18;i++){
    for(const [parent,list] of [[net,paths],[back,backs]]){const path=document.createElementNS(ns,'path');path.setAttribute('stroke-width',i===0||i===18?'2.7':'1.3');parent.append(path);list.push({path,axis,value:i/9-1})}
  }
  let position=0,target=0,mode='scroll',paused=false,enabled=!reduced.matches,speed=1,endAt=DURATION;
  let raf=0,last=0,inView=true,lastPhase=-1;
  function point(u,v,w,flutter){
    const flatX=u*250,flatY=v*170;
    const foldedX=Math.sin(u*1.48)*235;
    const foldedY=v*(98+42*Math.cos(u*1.48))+Math.pow(Math.abs(u),3)*32+v*v*17;
    const z=w*Math.cos(u*1.48)*85;
    return [mix(flatX,foldedX,w)+Math.sin(v*4+flutter)*8*(1-w),mix(flatY,foldedY,w)+Math.sin(u*4+flutter)*10*(1-w)-z*.23];
  }
  function mesh(w,flutter){
    paths.forEach(({path,axis,value},index)=>{let d='';for(let j=0;j<=22;j++){const q=j/11-1;const [x,y]=point(axis?value:q,axis?q:value,w,flutter);d+=(j?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)}path.setAttribute('d',d);backs[index].path.setAttribute('d',d)});
  }
  function draw(ms){
    position=Math.max(0,Math.min(DURATION,ms));const phase=Math.min(2,Math.floor(position/CHAPTER)),t=clamp((position-phase*CHAPTER)/CHAPTER);
    let dx=680,dy=275,nx=100,ny=400,nscale=.04,wrap=0,tilt=0,zoom=1,focusX=500,focusY=300;
    if(phase===0){const journey=smooth((t-.08)/.78);dx=mix(430,680,journey);dy=275-42*Math.sin(journey*Math.PI*2);tilt=Math.sin(journey*Math.PI*2)*-7;zoom=mix(1.23,1,smooth((t-.75)/.25));focusX=mix(dx,500,smooth((t-.75)/.25));}
    if(phase===1){const travel=smooth((t-.1)/.8);nx=mix(100,680,travel);ny=(1-travel)*(1-travel)*400+2*(1-travel)*travel*20+travel*travel*275;nscale=.04+.96*smooth((t-.18)/.56);tilt=-18*Math.sin(travel*Math.PI);}
    if(phase===2){wrap=smooth((t-.15)/.6);dx=680;dy=275+20*wrap;nx=dx;ny=dy;nscale=1;tilt=wrap*6;zoom=1+.52*smooth(t/.7);focusX=mix(500,680,smooth(t/.7));focusY=mix(300,275,smooth(t/.7));}
    camera.setAttribute('transform',`translate(500 300) scale(${zoom}) translate(${-focusX} ${-focusY})`);
    drone.setAttribute('transform',`translate(${dx} ${dy}) rotate(${phase===0?tilt:phase===2?tilt*.5:0})`);
    frame.setAttribute('transform',`translate(${dx} ${dy}) scale(${1+.12*(1-smooth(t/.18))})`);
    frame.setAttribute('opacity',phase===0?String(smooth(t/.13)*(1-smooth((t-.87)/.13))):'0');
    scan.setAttribute('transform',`translate(0 ${280*((t*2.6)%1)})`);
    arc.setAttribute('opacity',phase===1?String(.22*smooth(t/.12)*(1-smooth((t-.9)/.1))):'0');
    trail.setAttribute('opacity',phase===1?'.65':'0');trail.setAttribute('stroke-dashoffset',String(1-smooth((t-.1)/.8)));
    net.setAttribute('opacity',phase===0?'0':'1');back.setAttribute('opacity',phase===2?String(.45*wrap):'0');
    const transform=`translate(${nx} ${ny}) rotate(${phase===1?tilt:tilt*.5}) scale(${nscale})`;
    net.setAttribute('transform',transform);back.setAttribute('transform',transform+' scale(1 .92)');
    if(phase>0)mesh(wrap,t*5);
    seek.value=String(Math.round(position));seek.setAttribute('aria-valuetext',`${Math.floor(position/1000)} секунд из 21`);
    $('#timecode').textContent=`00:${String(Math.floor(position/1000)).padStart(2,'0')} / 00:21`;
    seek.style.setProperty('--fill',`${position/DURATION*100}%`);
    if(lastPhase!==phase){steps.forEach((el,i)=>{el.classList.toggle('active',i===phase);el.setAttribute('aria-pressed',String(i===phase))});lastPhase=phase;}
  }
  function labels(){motion.textContent=!enabled?'Пуск ▷':paused||mode==='hold'?'Продолжить ▷':'Пауза Ⅱ';motion.setAttribute('aria-pressed',String(paused));document.body.classList.toggle('paused',paused);}
  function tick(time){raf=0;if(document.hidden||!inView){last=0;return}const dt=last?Math.min(100,time-last):0;last=time;
    if(mode==='play'&&!paused){draw(Math.min(endAt,position+dt*speed));if(position>=endAt){mode='hold';labels()}else raf=requestAnimationFrame(tick);}
    else if(mode==='scroll'&&!paused&&enabled){const next=mix(position,target,.16);draw(Math.abs(target-next)<4?target:next);if(Math.abs(target-position)>=4)raf=requestAnimationFrame(tick);}
  }
  function schedule(){if(!raf){last=0;raf=requestAnimationFrame(tick)}}
  function enable(){enabled=true;document.body.classList.add('motion-on');}
  function play(start,end){autoPlayed=true;enable();paused=false;mode='play';endAt=end;draw(start);labels();schedule();}
  $('#play-all').addEventListener('click',()=>play(0,DURATION));
  steps.forEach((el,i)=>el.addEventListener('click',()=>play(i*CHAPTER,Math.min(DURATION,(i+1)*CHAPTER-.1))));
  motion.addEventListener('click',()=>{if(!enabled){play(0,DURATION);return}if(mode==='hold'){play(position>=DURATION-.2?0:position,DURATION);return}paused=!paused;labels();schedule()});
  $('#speed').addEventListener('click',e=>{speed=speed===1?.5:1;e.currentTarget.textContent=speed===1?'1×':'0,5×';e.currentTarget.setAttribute('aria-pressed',String(speed!==1))});
  seek.addEventListener('input',()=>{mode='hold';paused=true;draw(Number(seek.value));labels()});
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting&&entries[0].intersectionRatio>=.35;if(inView){if(enabled&&!autoPlayed){autoPlayed=true;play(0,DURATION)}else schedule()}else{cancelAnimationFrame(raf);raf=0;last=0}},{threshold:.35}).observe($('.story-sticky'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0}else schedule()});
  reduced.addEventListener('change',()=>{enabled=!reduced.matches;document.body.classList.remove('motion-on');mode='hold';paused=true;draw(enabled?position:19500);labels()});
  $('#copy').addEventListener('click',async()=>{const status=$('#copy-status');try{await navigator.clipboard.writeText('whismym@vk.com');status.textContent='Почта скопирована'}catch{status.textContent='Скопируйте адрес вручную: whismym@vk.com'}});
  if(!enabled){mode='hold';draw(19500)}else{mode='hold';draw(0)}labels();
})();
