/** Release the startup cover even when a provider never settles. Does not cancel restoration. */
export async function waitForStartup(restore,{timeoutMs=8000,minMs=1000}={}) {
 let timer;
 const settled=Promise.all([Promise.resolve(restore).then(()=>true,()=>false),new Promise(r=>setTimeout(r,minMs))]).then(([ok])=>({settled:true,ok}));
 try{return await Promise.race([settled,new Promise(r=>{timer=setTimeout(()=>r({settled:false,ok:false}),timeoutMs);})]);}
 finally{clearTimeout(timer);}
}
