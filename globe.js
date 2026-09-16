import {geoOrthographic, geoPath, geoGraticule10} from './vendor/geo.js';

const host = document.querySelector('.presence-globe');
if (host) initGlobe(host).catch(() => { /* Keep the static map if Web APIs or data are unavailable. */ });

async function initGlobe(host) {
  const response = await fetch(new URL('./globe-countries.json', import.meta.url));
  if (!response.ok) throw new Error('Globe data unavailable');
  const countries = await response.json();
  const canvas = host.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  const button = host.querySelector('.globe-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const projection = geoOrthographic().clipAngle(90).precision(0.4);
  const path = geoPath(projection, context);
  const graticule = geoGraticule10();
  let width, height, radius, rotation = [28, -14, 0];
  let paused = reduced.matches, visible = false, dragging = false, pointer = null;
  let previous = 0, frame = null, idleUntil = 0;
  const english = () => document.documentElement.lang.startsWith('en');

  function labels() {
    canvas.setAttribute('aria-label', english()
      ? 'Interactive globe. Drag or use arrow keys to rotate. Highlighted countries are listed below.'
      : 'Globo interativo. Arraste ou use as setas para girar. Os países destacados estão listados abaixo.');
    button.textContent = paused ? (english() ? 'Resume rotation' : 'Retomar rotação') : (english() ? 'Pause rotation' : 'Pausar rotação');
    button.setAttribute('aria-pressed', String(paused));
    host.dataset.rotation = paused ? 'paused' : 'running';
  }

  function draw() {
    if (!width) return;
    context.clearRect(0, 0, width, height);
    projection.rotate(rotation);
    const cx=width/2, cy=height/2;
    const atmosphere=context.createRadialGradient(cx,cy,radius*.92,cx,cy,radius*1.12);
    atmosphere.addColorStop(0,'rgba(0,178,255,0.18)'); atmosphere.addColorStop(1,'rgba(0,178,255,0)');
    context.fillStyle=atmosphere; context.fillRect(0,0,width,height);
    const ocean=context.createRadialGradient(cx-radius*.4,cy-radius*.45,0,cx,cy,radius);
    ocean.addColorStop(0,'#184d6c'); ocean.addColorStop(.72,'#0c2d49'); ocean.addColorStop(1,'#041526');
    context.beginPath(); path({type:'Sphere'}); context.fillStyle=ocean; context.fill();
    context.beginPath(); path(graticule); context.strokeStyle='rgba(114,190,221,.12)'; context.lineWidth=.6; context.stroke();
    for (const country of countries.features) {
      context.beginPath(); path(country);
      context.fillStyle=country.properties.served?'#00b2ff':'#31546a'; context.fill();
      context.strokeStyle=country.properties.served?'#96e6ff':'#15344c';
      context.lineWidth=country.properties.served?.7:.45; context.stroke();
    }
    const shading=context.createRadialGradient(cx-radius*.3,cy-radius*.35,radius*.2,cx,cy,radius);
    shading.addColorStop(0,'rgba(0,0,0,0)'); shading.addColorStop(.72,'rgba(0,0,0,.04)'); shading.addColorStop(1,'rgba(0,8,20,.6)');
    context.beginPath(); path({type:'Sphere'}); context.fillStyle=shading; context.fill();
    context.strokeStyle='rgba(89,205,255,.5)'; context.lineWidth=1; context.stroke();
  }
  function resize() {
    const rect=canvas.getBoundingClientRect(); width=rect.width; height=rect.height;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    radius=Math.min(width,height)*.415;
    projection.scale(radius).translate([width/2,height/2]); draw();
  }
  function tick(now) {
    frame=null;
    if (!visible || document.hidden || paused || dragging) { previous=0; return; }
    if (previous && now>idleUntil) { rotation[0]+=(Math.min(now-previous,60)/1000)*3; draw(); }
    previous=now; frame=requestAnimationFrame(tick);
  }
  function start() { if(frame===null && visible && !document.hidden && !paused && !dragging) frame=requestAnimationFrame(tick); }
  function stop() { if(frame!==null) cancelAnimationFrame(frame); frame=null; previous=0; }
  button.addEventListener('click',()=>{paused=!paused;labels();if(paused)stop();else start();});
  canvas.addEventListener('pointerdown',event=>{
    if (!event.isPrimary || event.button!==0) return;
    dragging=true; pointer={id:event.pointerId,x:event.clientX,y:event.clientY};
    canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');stop();
  });
  canvas.addEventListener('pointermove',event=>{
    if(!pointer || pointer.id!==event.pointerId) return;
    rotation[0]+=(event.clientX-pointer.x)*100/radius;
    rotation[1]=Math.max(-80,Math.min(80,rotation[1]-(event.clientY-pointer.y)*100/radius));
    pointer.x=event.clientX;pointer.y=event.clientY;draw();
  });
  const release=()=>{if(!dragging)return;dragging=false;pointer=null;canvas.classList.remove('is-dragging');idleUntil=performance.now()+3000;start();};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault(); paused=true;stop();labels();
    rotation[0]+=event.key==='ArrowRight'?10:event.key==='ArrowLeft'?-10:0;
    rotation[1]=Math.max(-80,Math.min(80,rotation[1]+(event.key==='ArrowUp'?10:event.key==='ArrowDown'?-10:0)));draw();
  });
  reduced.addEventListener('change',()=>{if(reduced.matches){paused=true;stop();labels();}});
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  host.classList.add('globe-ready'); labels();resize();
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else stop();},{threshold:.05}).observe(canvas);
}
