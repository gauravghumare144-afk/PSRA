const KEY="pria_goals_v6";
const MORNING_KEY="pria_6am_last_v1";
let goals=JSON.parse(localStorage.getItem(KEY)||"[]");
let audioCtx=null,alarmTimer=null,alarmActive=false,currentAlarmGoals=[];
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
$("goalDate").value=today();

function save(){localStorage.setItem(KEY,JSON.stringify(goals));render()}
function fmt(t){if(!t)return"";let[h,m]=t.split(":").map(Number),d=new Date();d.setHours(h,m);return d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}

function render(){
 const items=goals.filter(g=>g.date===today()).sort((a,b)=>a.time.localeCompare(b.time));
 $("goalList").innerHTML="";$("empty").style.display=items.length?"none":"block";
 items.forEach(g=>{
  const row=document.createElement("div");row.className="goal"+(g.done?" done":"");
  row.innerHTML=`<input class="check" type="checkbox" ${g.done?"checked":""}><div class="goalMain"><div class="goalText"></div><div class="goalTime"></div></div><button class="delete">🗑️</button>`;
  row.querySelector(".goalText").textContent=g.text;row.querySelector(".goalTime").textContent=fmt(g.time);
  row.querySelector(".check").onchange=e=>{g.done=e.target.checked;save();};
  row.querySelector(".delete").onclick=()=>{goals=goals.filter(x=>x.id!==g.id);save();};
  $("goalList").appendChild(row);
 });
 let total=items.length,done=items.filter(g=>g.done).length,p=total?Math.round(done/total*100):0;
 $("progressBar").style.width=p+"%";$("progressText").textContent=p+"%";$("progressSub").textContent=`${done} of ${total} goals completed`;
 $("perfectDay").textContent=total&&done===total?"🏆 PERFECT DAY! Every goal is complete. Excellent work, Sir!":"Complete every goal to unlock today's Perfect Day.";
 $("perfectDay").className="perfect"+(total&&done===total?" good":"");
}

$("goalForm").onsubmit=e=>{
 e.preventDefault();
 let text=$("goalText").value.trim(),date=$("goalDate").value,time=$("goalTime").value;
 if(!text||!date||!time)return;
 goals.push({id:Date.now()+Math.random(),text,date,time,done:false,notified:false});
 $("goalText").value="";save();
};

function unlockAudio(){
 try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume();}catch(e){}
}
function beep(ms=360,f=880){
 if(!audioCtx)return;
 let o=audioCtx.createOscillator(),g=audioCtx.createGain();
 o.type="square";o.frequency.value=f;
 g.gain.setValueAtTime(.0001,audioCtx.currentTime);
 g.gain.exponentialRampToValueAtTime(.42,audioCtx.currentTime+.02);
 g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+ms/1000);
 o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+ms/1000+.02);
}
function pattern(){beep(400,880);setTimeout(()=>beep(400,660),450);setTimeout(()=>beep(400,880),900);}
function startRepeatingAlarm(){
 unlockAudio();alarmActive=true;
 if(alarmTimer)clearInterval(alarmTimer);
 pattern();
 alarmTimer=setInterval(()=>{if(alarmActive)pattern();},2200);
}
function stopAlarm(){
 alarmActive=false;
 if(alarmTimer){clearInterval(alarmTimer);alarmTimer=null;}
}
function clean(s){s=s.trim().replace(/[.!?]+$/,"");return s?s.charAt(0).toLowerCase()+s.slice(1):"your goal"}

function reminder(texts,alarmGoals=[]){
 currentAlarmGoals=alarmGoals;
 let u=[...new Set(texts)];
 let msg=u.length===1?`It's time to ${clean(u[0])} now.`:`It's time to: ${u.map(clean).join("; ")}.`;
 $("alarmMessage").textContent=msg;
 $("alarmOverlay").classList.remove("hidden");
 startRepeatingAlarm();

 if("Notification"in window&&Notification.permission==="granted"){
  try{new Notification("PRIA Reminder",{body:msg,tag:"pria-"+Date.now(),renotify:true});}catch(e){}
 }
}

$("notifyBtn").onclick=async()=>{
 unlockAudio();
 if(!("Notification"in window)){alert("This browser does not support notifications. The repeating in-app alarm works while PRIA is active.");return;}
 let p=await Notification.requestPermission();
 alert(p==="granted"?"Notifications are allowed. PRIA can now show reminders.":"Notifications were not allowed. Please allow them in browser settings.");
};

$("testAlarmBtn").onclick=()=>{unlockAudio();reminder(["test reminder"],[])};

$("completeAlarmBtn").onclick=()=>{
 currentAlarmGoals.forEach(g=>g.done=true);
 save();
 $("alarmOverlay").classList.add("hidden");
 stopAlarm();
 currentAlarmGoals=[];
};

$("dismissBtn").onclick=()=>{
 $("alarmOverlay").classList.add("hidden");
 stopAlarm();
};

function checkClock(){
 let n=new Date();
 $("clock").textContent=n.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});
 let d=n.toISOString().slice(0,10),t=n.toTimeString().slice(0,5);

 // 6:00 AM daily reminder
 if(t==="06:00" && localStorage.getItem(MORNING_KEY)!==d){
  localStorage.setItem(MORNING_KEY,d);
  reminder(["set today's goals"],[]);
 }

 // Scheduled goals. If several goals have the same time, one repeating alarm is used.
 let due=goals.filter(g=>g.date===d&&g.time===t&&!g.notified&&!g.done);
 if(due.length){
  due.forEach(g=>g.notified=true);
  localStorage.setItem(KEY,JSON.stringify(goals));
  reminder(due.map(g=>g.text),due);
 }
}

if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
render();checkClock();setInterval(checkClock,1000);