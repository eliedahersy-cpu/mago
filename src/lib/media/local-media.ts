'use client';

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'mago-staging-media-v1';
const CHANGE_EVENT = 'mago:media-change';
const EMPTY = '{}';

function currentSnapshot() {
  try { return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY; }
  catch { return EMPTY; }
}

function subscribe(listener:()=>void) {
  window.addEventListener(CHANGE_EVENT,listener);
  window.addEventListener('storage',listener);
  return ()=>{window.removeEventListener(CHANGE_EVENT,listener);window.removeEventListener('storage',listener);};
}

export function useLocalMediaMap():Record<string,string> {
  const raw=useSyncExternalStore(subscribe,currentSnapshot,()=>EMPTY);
  try{return JSON.parse(raw) as Record<string,string>}catch{return {}}
}

export function useLocalMediaSrc(slotKey:string,fallback:string) {
  const media=useLocalMediaMap();
  return media[slotKey] || fallback;
}

export function writeLocalMedia(slotKey:string,dataUrl:string):void {
  const data=JSON.parse(currentSnapshot()) as Record<string,string>;
  data[slotKey]=dataUrl;
  window.localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function removeLocalMedia(slotKey:string):void {
  const data=JSON.parse(currentSnapshot()) as Record<string,string>;
  delete data[slotKey];
  window.localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Downsize chosen images so typical browser-local storage limits are respected. */
export function prepareLocalImage(file:File):Promise<string> {
  return new Promise((resolve,reject)=>{
    if(!file.type.startsWith('image/')) {reject(new Error('Select an image file.'));return;}
    const source=URL.createObjectURL(file);
    const img=document.createElement('img');
    img.onload=()=>{
      try {
        const max=1200;
        const ratio=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
        const canvas=document.createElement('canvas');
        canvas.width=Math.round(img.naturalWidth*ratio);
        canvas.height=Math.round(img.naturalHeight*ratio);
        const context=canvas.getContext('2d');
        if(!context) throw new Error('Cannot process this image in your browser.');
        context.drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/webp',.76));
      }catch(error){reject(error);}finally{URL.revokeObjectURL(source);}
    };
    img.onerror=()=>{URL.revokeObjectURL(source);reject(new Error('Could not load this image.'))};
    img.src=source;
  });
}
