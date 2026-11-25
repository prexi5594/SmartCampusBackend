/* Pure manual-checkpoint state. No GPS, implicit arrival or persisted position. */
(function(root){
'use strict';
function create(total,indoorStart){
 if(!Number.isInteger(total)||!Number.isInteger(indoorStart)||total<=indoorStart||indoorStart<1)throw new Error('Invalid route stages');
 let index=0,active=false,completed=false;
 const state=()=>({index,active,completed});
 return {state,start(atEntrance=false){index=atEntrance?indoorStart:0;active=true;completed=false;return state();},next(){if(active){if(index===total-1){active=false;completed=true;}else index++;}return state();},back(){if(active&&index>0)index--;return state();},stop(){active=false;completed=false;return state();}};
}
const api={create};if(typeof module==='object'&&module.exports)module.exports=api;else root.PilotGuide=api;
})(typeof window==='undefined'?globalThis:window);
