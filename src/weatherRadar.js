import * as Cesium from 'cesium';

// One requested frame at a time keeps public tile usage bounded.
export function createWeatherRadar(viewer) {
  const element=document.createElement('fieldset');
  const heading=document.createElement('legend');heading.textContent='Precipitation radar';
  const label=document.createElement('label'),toggle=document.createElement('input');
  toggle.type='checkbox';toggle.checked=true;label.append(toggle,' Show radar');
  const frames=document.createElement('select');frames.setAttribute('aria-label','Radar frame');
  const opacity=document.createElement('input');opacity.type='range';opacity.min='0.2';opacity.max='1';opacity.step='.1';opacity.value='.7';opacity.setAttribute('aria-label','Radar opacity');
  const status=document.createElement('p');
  const info=document.createElement('p');info.textContent='Recent radar mosaic, not wind velocity. Coverage varies; blank areas may have no radar. Frame time can differ from observation time.';
  const credit=document.createElement('a');credit.href='https://www.rainviewer.com';credit.target='_blank';credit.rel='noopener noreferrer';credit.textContent='Radar by RainViewer';
  element.append(heading,label,frames,opacity,status,info,credit);
  let active=false,layer=null,report=null,timer=null,controller=null,version=0;
  function remove(){if(layer){viewer.imageryLayers.remove(layer,true);layer=null;}viewer.scene.requestRender();}
  function show(){
    remove();if(!active||!toggle.checked||!report)return;
    const frame=report.frames[Number(frames.value)];if(!frame)return;
    const age=Date.now()-frame.time*1000;
    status.textContent=`${report.stale||age>1800000?'STALE · ':''}Frame ${new Date(frame.time*1000).toLocaleString()} · loading tiles`;
    const provider=new Cesium.UrlTemplateImageryProvider({url:`${report.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`,maximumLevel:7,tilingScheme:new Cesium.WebMercatorTilingScheme(),credit:'RainViewer'});
    provider.errorEvent.addEventListener(()=>{if(layer?.imageryProvider===provider)status.textContent='Some radar tiles failed to load. Change frame or toggle radar to retry.';});
    layer=viewer.imageryLayers.addImageryProvider(provider);layer.alpha=Number(opacity.value);
    status.textContent=`${report.stale||age>1800000?'STALE · ':''}Frame ${new Date(frame.time*1000).toLocaleString()} · tiles requested`;
    viewer.scene.requestRender();
  }
  async function refresh(){
    controller?.abort();const token=++version;controller=new AbortController();
    const timeout=setTimeout(()=>controller?.abort(),20000);
    try{
      status.textContent='Loading radar timeline…';
      const response=await fetch('/api/live-views/radar',{signal:controller.signal});
      if(!response.ok)throw new Error('Unavailable');
      const next=await response.json();if(token!==version||!active)return;
      report=next;frames.replaceChildren();
      report.frames.forEach((f,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=new Date(f.time*1000).toLocaleTimeString()+(i===report.frames.length-1?' · latest':'');frames.append(o);});
      frames.value=String(report.frames.length-1);show();
    }catch{if(token===version&&active){remove();status.textContent='Radar unavailable · retries in five minutes. Weather conditions remain independent.';}}
    finally{clearTimeout(timeout);if(token===version&&active&&toggle.checked)timer=setTimeout(refresh,300000);}
  }
  toggle.onchange=()=>{clearTimeout(timer);controller?.abort();version++;if(toggle.checked)refresh();else{remove();status.textContent='Radar off';}};
  frames.onchange=show;opacity.oninput=()=>{if(layer)layer.alpha=Number(opacity.value);viewer.scene.requestRender();};
  return {element,setActive(value){active=value;element.hidden=!value;clearTimeout(timer);controller?.abort();version++;remove();if(value&&toggle.checked)refresh();}};
}
