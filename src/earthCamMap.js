import * as Cesium from 'cesium';
import {EARTHCAM_LOCATIONS} from './earthCamDirectory.js';
export function createEarthCamMap(viewer,onSelect) {
 let source=null,handler=null;
 function show(enabled){
  if(!viewer)return;
  if(enabled&&!source){
   source=new Cesium.CustomDataSource('EarthCam viewing locations');
   for(const entry of EARTHCAM_LOCATIONS) source.entities.add({id:`earthcam:${entry.id}`,position:Cesium.Cartesian3.fromDegrees(entry.lon,entry.lat,35),properties:{earthCamId:entry.id},point:{pixelSize:11,color:Cesium.Color.fromCssColorString('#ffce86'),outlineColor:Cesium.Color.fromCssColorString('#283444'),outlineWidth:2},label:{text:`${entry.city} · EarthCam ↗`,font:'12px sans-serif',fillColor:Cesium.Color.WHITE,showBackground:true,backgroundColor:Cesium.Color.fromCssColorString('#102633'),pixelOffset:new Cesium.Cartesian2(0,-24),distanceDisplayCondition:new Cesium.DistanceDisplayCondition(0,2500000)}});
   viewer.dataSources.add(source);
   handler=new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
   handler.setInputAction(event=>{const id=viewer.scene.pick(event.position)?.id?.properties?.earthCamId?.getValue();const entry=EARTHCAM_LOCATIONS.find(e=>e.id===id);if(source?.show&&entry)onSelect(entry)},Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }
  if(source)source.show=enabled;
  viewer.scene.requestRender();
 }
 return {show,focus(entry){if(!viewer)return;show(true);viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(entry.lon,entry.lat,18000),orientation:{heading:0,pitch:-Math.PI/2,roll:0},duration:1.2});},destroy(){handler?.destroy();if(source)viewer?.dataSources.remove(source,true)}};
}
