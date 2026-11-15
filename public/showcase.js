(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const reveal=[...document.querySelectorAll('.reveal')];
 if(!reduced.matches&&'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.06,rootMargin:'0px 0px 30px 0px'});
  reveal.forEach(e=>observer.observe(e));document.documentElement.classList.add('motion-ready');
 }
 const $=s=>document.querySelector(s),area=$('#hand-area'),hand=$('#demo-hand'),pointer=$('#demo-pointer'),x=$('#hand-x'),y=$('#hand-y'),button=$('#demo-play');
 let raf=0,running=false,visible=false,last=0,clock=0,dragging=false;
 // The mount is fixed. Only the stick projects around its fixed pivot.
 function draw(){
  const px=Number(x.value)/100,py=Number(y.value)/100;
  hand.setAttribute('transform',`translate(${150+300*px} ${142+125*py}) scale(.78)`);
  const pan=((px-.5)*110+15)*Math.PI/180,elevation=(.5-py)*.65;
  const tipX=315+155*Math.sin(pan)*Math.cos(elevation);
  const tipY=161-155*(Math.sin(elevation)+.4*Math.cos(pan)*Math.cos(elevation));
  const [rod,highlight,tip]=pointer.children;
  rod.setAttribute('d',`M315 161L${tipX.toFixed(2)} ${tipY.toFixed(2)}`);
  highlight.setAttribute('d',`M315 158L${tipX.toFixed(2)} ${(tipY-3).toFixed(2)}`);
  tip.setAttribute('cx',tipX.toFixed(2));tip.setAttribute('cy',tipY.toFixed(2));
 }
 function tick(t){raf=0;if(!running||!visible||document.hidden){last=0;return}clock+=last?Math.min(80,t-last):0;last=t;x.value=50+38*Math.sin(clock/1650);y.value=50+34*Math.sin(clock/2200+.5);draw();raf=requestAnimationFrame(tick)}
 function schedule(){if(!raf&&running&&visible&&!document.hidden){last=0;raf=requestAnimationFrame(tick)}}
 function stop(){running=false;cancelAnimationFrame(raf);raf=0;button.textContent='Показать движение ▷';button.setAttribute('aria-pressed','false')}
 button.addEventListener('click',()=>{if(running)stop();else{running=true;button.textContent='Пауза Ⅱ';button.setAttribute('aria-pressed','true');schedule()}});
 for(const el of [x,y])el.addEventListener('input',()=>{stop();draw()});
 function move(e){const r=area.getBoundingClientRect();x.value=Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*200-50));y.value=Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*250-75));draw()}
 area.addEventListener('pointerdown',e=>{stop();dragging=true;area.setPointerCapture(e.pointerId);move(e)});area.addEventListener('pointermove',e=>{if(dragging)move(e)});area.addEventListener('pointerup',()=>dragging=false);area.addEventListener('pointercancel',()=>dragging=false);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else{cancelAnimationFrame(raf);raf=0;last=0}},{threshold:.15}).observe($('#tracking-demo'));
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else schedule()});
 reduced.addEventListener('change',()=>{if(reduced.matches)stop()});draw();
 document.querySelectorAll('video').forEach(video=>new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)video.pause()}).observe(video));
})();
