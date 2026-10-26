(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function e(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(i){if(i.ep)return;i.ep=!0;const a=e(i);fetch(i.href,a)}})();const U=Math.PI,P=Math.sin,N=Math.cos,it=Math.tan,qt=Math.asin,at=Math.atan2,Ht=Math.acos,$=U/180,tt=180/U,Lt=1e3*60*60*24,Mt=2440588,Ct=2451545;function jt(S){return S.valueOf()/Lt-.5+Mt}function et(S){return new Date((S+.5-Mt)*Lt)}function st(S){return jt(S)-Ct}const nt=$*23.4397;function Pt(S){return Ht(Math.max(-1,Math.min(1,S)))}function Nt(S){return qt(Math.max(-1,Math.min(1,S)))}function Ft(S,t){return at(P(S)*N(nt)-it(t)*P(nt),N(S))}function lt(S,t){return Nt(P(t)*N(nt)+N(t)*P(nt)*P(S))}function dt(S,t,e){return at(P(S),N(S)*P(t)-it(e)*N(t))}function ht(S,t,e){return Nt(P(t)*P(e)+N(t)*N(e)*N(S))}function ut(S,t){return $*(280.16+360.9856235*S)-t}function At(S){return $*(357.5291+.98560028*S)}function It(S){const t=$*(1.9148*P(S)+.02*P(2*S)+3e-4*P(3*S)),e=$*102.9372;return S+t+e+U}function pt(S){const t=At(S),e=It(t);return{dec:lt(e,0),ra:Ft(e,0)}}const Rt=9e-4;function Bt(S,t){return Math.round(S-Rt-t/(2*U))}function mt(S,t,e){return Rt+(S+t)/(2*U)+e}function ft(S,t,e){return Ct+S+.0053*P(t)-.0069*P(2*e)}function Vt(S,t,e){const s=(P(S)-P(t)*P(e))/(N(t)*N(e));return s>1.0001||s<-1.0001?NaN:Pt(s)}const gt=[[-.833*$,"sunrise","sunset"],[-.3*$,"sunriseEnd","sunsetStart"],[-4*$,"blueHourDawnEnd","blueHourDuskStart"],[-6*$,"civilDawn","civilDusk"],[-12*$,"nauticalDawn","nauticalDusk"],[-18*$,"astronomicalDawn","astronomicalDusk"],[6*$,"goldenHourDawnEnd","goldenHourDuskStart"]];class F{static getSunTimes(t,e,s){const i=$*-s,a=$*e,o=st(t),l=Bt(o,i),c=mt(0,i,l),r=At(c),n=It(r),d=lt(n,0),h=ft(c,r,n),u={solarNoon:et(h),nadir:et(h-.5)};for(let m=0;m<gt.length;m++){const p=gt[m],g=p[0],v=Vt(g,a,d);if(isNaN(v)){u[p[1]]=null,u[p[2]]=null;continue}const y=mt(v,i,l),x=ft(y,r,n),b=h-(x-h);u[p[1]]=et(b),u[p[2]]=et(x)}return u.goldenHourMorning={start:u.sunrise||u.civilDawn,end:u.goldenHourDawnEnd},u.goldenHourEvening={start:u.goldenHourDuskStart,end:u.sunset||u.civilDusk},u.blueHourMorning={start:u.civilDawn,end:u.blueHourDawnEnd||u.sunrise},u.blueHourEvening={start:u.blueHourDuskStart||u.sunset,end:u.civilDusk},u.nightSky={start:u.astronomicalDusk,end:u.astronomicalDawn},u}static getSunPosition(t,e,s){const i=$*-s,a=$*e,o=st(t),l=pt(o),c=ut(o,i)-l.ra,r=dt(c,a,l.dec),n=ht(c,a,l.dec);return{azimuth:(r*tt+180)%360,altitude:n*tt}}static moonCoords(t){const e=$*(218.316+13.176396*t),s=$*(134.963+13.064993*t),i=$*(93.272+13.22935*t),a=e+$*6.289*P(s),o=$*5.128*P(i),l=385001-20905*N(s);return{ra:Ft(a,o),dec:lt(a,o),dist:l}}static getMoonIllumination(t){const e=st(t),s=pt(e),i=this.moonCoords(e),a=149598e3,o=Pt(P(s.dec)*P(i.dec)+N(s.dec)*N(i.dec)*N(s.ra-i.ra)),l=at(a*P(o),i.dist-a*N(o)),c=at(N(s.dec)*P(s.ra-i.ra),P(s.dec)*N(i.dec)-N(s.dec)*P(i.dec)*N(s.ra-i.ra)),r=(1+N(l))/2;let n=.5+.5*l*(c<0?-1:1)/U;n>=1&&(n-=1);let d="Nymåne",h="🌑";return n<.03||n>.97?(d="Nymåne",h="🌑"):n<.22?(d="Tiltagende månesegl",h="🌒"):n<.28?(d="Første kvarter",h="🌓"):n<.47?(d="Tiltagende måne",h="🌔"):n<.53?(d="Fuldmåne",h="🌕"):n<.72?(d="Aftagende måne",h="🌖"):n<.78?(d="Sidste kvarter",h="🌗"):(d="Aftagende månesegl",h="🌘"),{fraction:Math.round(r*100),phase:n,name:d,icon:h}}static getMoonPosition(t,e,s){const i=$*-s,a=$*e,o=st(t),l=this.moonCoords(o),c=ut(o,i)-l.ra,r=ht(c,a,l.dec),n=r-$*.017/it(r+$*10.26/(r+$*5.1));return{azimuth:(dt(c,a,l.dec)*tt+180)%360,altitude:n*tt}}static getMoonTimes(t,e,s){const i=new Date(t.getFullYear(),t.getMonth(),t.getDate(),0,0,0),a=.133*$;let o=this.getMoonPosition(i,e,s).altitude*$-a,l=null,c=null;for(let r=1;r<=24;r+=2){const n=this.getMoonPosition(new Date(i.getTime()+r*36e5),e,s).altitude*$-a,d=this.getMoonPosition(new Date(i.getTime()+(r+1)*36e5),e,s).altitude*$-a,h=(o+d)/2-n,u=(d-o)/2,m=-u/(2*h),p=(h*m+u)*m+n,g=u*u-4*h*n;let v=0;if(g>=0){const y=Math.sqrt(g)/(Math.abs(h)*2),x=m-y,b=m+y;Math.abs(x)<=1&&v++,Math.abs(b)<=1&&v++,v===1?o<0?l=new Date(i.getTime()+(r+x)*36e5):c=new Date(i.getTime()+(r+x)*36e5):v===2&&(l=new Date(i.getTime()+(r+(p<0?b:x))*36e5),c=new Date(i.getTime()+(r+(p<0?x:b))*36e5))}o=d}return{rise:l,set:c}}static calculateShadow(t,e,s=1.75){const i=s>0?s:1.75,a=(e+180)%360,o=this.getCompassDirection(a);if(t<=0)return{hasDirectShadow:!1,shadowLength:1/0,shadowRatio:1/0,shadowAzimuth:a,shadowCompass:o,objectHeight:i,lightPhase:this.getLightPhase(t),description:"Solen er under horisonten. Diffust tusmørke – ingen direkte skygger.",cameraTip:"Brug stativ og lange lukkertider. Blødt ambient lys uden hårde kontraster."};const l=t*$,c=1/it(l),r=i*c,n=this.getLightPhase(t);let d="",h="";return t<3?(d="Ekstremt lange og bløde skygger med diffus kant.",h="Fantastisk til modlysbilleder (rim light) og dramatisk relief i jorden."):t<6?(d="Klassisk gylden time. Skulpturelle, varme skygger.",h="Udnyt skyggerne som stærke ledende linjer. Varm farvetemperatur (3000K-3500K)."):t<15?(d="Lav morgensol / sensommereftermiddag. Fremragende struktur og dybde.",h="Flot kontrast i arkitektur og landskaber. Skyggen er ca. 4–9× genstandens højde."):t<30?(d="Mellemhøj sol. Behagelig 3D-modellering af motiver.",h="Gode arbejdsforhold. Skyggelængde er 1.7–3.7× genstandens højde."):t<45?(d="Moderat høj sol. Skygger begynder at blive mere kompakte end genstanden.",h="Hold øje med skyggernes hårdhed. Overvej polarisationsfilter for at dæmpe reflekser."):(d="Høj sol. Meget korte og hårde skygger direkte under motivet.",h="Pas på hårde øjenskygger i portrætter. Brug udfyldningslys eller modlysblænde."),{hasDirectShadow:!0,shadowLength:r,shadowRatio:c,shadowAzimuth:a,shadowCompass:o,objectHeight:i,lightPhase:n,description:d,cameraTip:h}}static getLightPhase(t){return t<-18?{id:"night",name:"Astronomisk nat",badge:"MØRKE",color:"#6366f1"}:t<-12?{id:"astro-twilight",name:"Astronomisk daggry/skumring",badge:"ASTRO",color:"#818cf8"}:t<-6?{id:"nautical",name:"Nautisk tusmørke",badge:"TUSMØRKE",color:"#38bdf8"}:t<-4?{id:"blue-hour",name:"Den Blå Time",badge:"BLÅ TIME",color:"#0ea5e9"}:t<0?{id:"twilight-edge",name:"Overgang til Gylden Time",badge:"DAGGRY/SKUMRING",color:"#f59e0b"}:t<6?{id:"golden-hour",name:"Den Gyldne Time",badge:"GYLDEN TIME",color:"#f59e0b"}:t<15?{id:"low-sun",name:"Lav sol (tekstur-lys)",badge:"LAV SOL",color:"#fbbf24"}:t<30?{id:"mid-sun",name:"Mellem sol",badge:"MODERAT SOL",color:"#fde047"}:{id:"high-sun",name:"Høj sol",badge:"HØJ SOL",color:"#ffffff"}}static getEstimatedKelvin(t){return t<=-6?{kelvin:12e3,label:"Kølig natsort / stjernehimmel"}:t<=-2?{kelvin:9e3,label:"Kølig dybblå (blå time)"}:t<=0?{kelvin:2200,label:"Dyb rav / rødglødende horisont"}:t<=3?{kelvin:2800,label:"Varm rødgylden sol"}:t<=6?{kelvin:3300,label:"Klassisk gyldent lys (golden hour)"}:t<=12?{kelvin:4e3,label:"Varm dagslys"}:t<=25?{kelvin:4800,label:"Naturligt dagslys"}:{kelvin:5500,label:"Standard dagslys (5500K)"}}static getCompassDirection(t){const e=["N","NNØ","NØ","ØNØ","Ø","ØSØ","SØ","SSØ","S","SSV","SV","VSV","V","VNV","NV","NNV"],s=(t%360+360)%360,i=Math.floor(s/22.5+.5);return e[i%16]}static getCompassDirectionFullName(t){const e=["Nord","Nord-nordøst","Nordøst","Øst-nordøst","Øst","Øst-sydøst","Sydøst","Syd-sydøst","Syd","Syd-sydvest","Sydvest","Vest-sydvest","Vest","Vest-nordvest","Nordvest","Nord-nordvest"],s=(t%360+360)%360,i=Math.floor(s/22.5+.5);return e[i%16]}static formatDegrees(t){return t==null||isNaN(t)?"--°":(t>=0?"+":"")+t.toFixed(1)+"°"}}const vt="fs_shared_location_v1",ot="fs_saved_spots_v1",bt={lat:55.6761,lng:12.5683,name:"København",sub:"Standard (tryk GPS for din position)",source:"default",accuracy:null};class C{static currentLocation=C.loadStoredLocation();static listeners=new Set;static isLocating=!1;static loadStoredLocation(){try{if(typeof localStorage<"u"){const t=localStorage.getItem(vt);if(t)return{...bt,...JSON.parse(t)}}}catch(t){console.warn("Kunne ikke læse lokation fra storage:",t)}return{...bt}}static getSavedSpots(){try{const t=localStorage.getItem(ot);if(t)return JSON.parse(t)}catch(t){console.warn("Kunne ikke hente gemte fotospots:",t)}return[]}static saveSpot(t,e,s){const i=this.getSavedSpots(),a=t.trim()||"Mit fotospot",o={id:"spot_"+Date.now()+"_"+Math.random().toString(36).substring(2,6),name:a,lat:+e.toFixed(4),lng:+s.toFixed(4),createdAt:Date.now()};i.unshift(o);try{localStorage.setItem(ot,JSON.stringify(i))}catch(l){console.warn("Kunne ikke gemme fotospot:",l)}return o}static deleteSpot(t){const e=this.getSavedSpots().filter(s=>s.id!==t);try{localStorage.setItem(ot,JSON.stringify(e))}catch(s){console.warn("Kunne ikke slette fotospot:",s)}}static getLocation(){return{...this.currentLocation}}static setLocation(t){this.currentLocation={...this.currentLocation,...t,updatedAt:Date.now()};try{localStorage.setItem(vt,JSON.stringify(this.currentLocation))}catch(e){console.warn("Fejl ved lagring af lokation:",e)}return this.notifyListeners(),this.getLocation()}static subscribe(t){return this.listeners.add(t),()=>{this.listeners.delete(t)}}static notifyListeners(){const t=this.getLocation();this.listeners.forEach(e=>{try{e(t)}catch(s){console.error("Fejl i location listener:",s)}})}static async requestGpsLocation(){if(!navigator.geolocation)throw new Error("GPS understøttes ikke af denne browser");return this.isLocating=!0,new Promise((t,e)=>{navigator.geolocation.getCurrentPosition(async s=>{this.isLocating=!1;const i=s.coords.latitude,a=s.coords.longitude,o=Math.round(s.coords.accuracy);let l="Aktuel GPS-position",c=`Nøjagtighed: ±${o}m`;try{const n=await C.reverseGeocode(i,a);n&&(l=n.name,c=`${n.sub||"GPS"} • ±${o}m`)}catch(n){console.warn("Reverse geocode fejlede:",n)}const r=C.setLocation({lat:i,lng:a,name:l,sub:c,source:"gps",accuracy:o});t(r)},s=>{this.isLocating=!1;let i="Kunne ikke hente GPS-position";s.code===s.PERMISSION_DENIED?i="Adgang til GPS blev afvist af bruger/browser":s.code===s.POSITION_UNAVAILABLE?i="Positionen er utilgængelig lige nu":s.code===s.TIMEOUT&&(i="GPS-forespørgslen fik timeout"),e(new Error(i))},{enableHighAccuracy:!0,timeout:1e4,maximumAge:6e4})})}static async search(t){if(!t||t.trim().length<2)return[];const e=t.trim(),s=[],i=new Set,a=e.match(/^([+-]?\d{1,2}(?:\.\d+)?)[,\s]+([+-]?\d{1,3}(?:\.\d+)?)$/);if(a){const n=parseFloat(a[1]),d=parseFloat(a[2]);if(!isNaN(n)&&!isNaN(d)&&n>=-90&&n<=90&&d>=-180&&d<=180)return[{name:`Koordinater: ${n.toFixed(4)}°N, ${d.toFixed(4)}°Ø`,sub:"Direkte koordinat-angivelse",lat:n,lng:d}]}const o=`https://photon.komoot.io/api/?q=${encodeURIComponent(e)}&lat=56.0&lon=11.0&limit=8`,l=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(e)}&count=5&language=da&format=json`,[c,r]=await Promise.allSettled([fetch(o).then(async n=>n.ok?n.json():null),fetch(l).then(async n=>n.ok?n.json():null)]);if(c.status==="fulfilled"&&c.value?.features&&Array.isArray(c.value.features))for(const n of c.value.features){if(!n.geometry?.coordinates||n.geometry.coordinates.length<2)continue;const[d,h]=n.geometry.coordinates,u=n.properties||{};let m="";const p=[u.street,u.housenumber].filter(Boolean).join(" ");u.name&&p&&u.name!==u.street?m=`${u.name} (${p})`:p?m=p:u.name?m=u.name:u.city?m=u.city:m="Ukendt sted";const v=[u.postcode,u.city||u.locality||u.district,u.state,u.country].filter(Boolean).join(", "),y=`${h.toFixed(4)},${d.toFixed(4)}`;i.has(y)||(i.add(y),s.push({name:m,sub:v||"Danmark",lat:h,lng:d}))}if(r.status==="fulfilled"&&r.value?.results&&Array.isArray(r.value.results))for(const n of r.value.results){const d=`${n.latitude.toFixed(4)},${n.longitude.toFixed(4)}`;i.has(d)||(i.add(d),s.push({name:n.name,sub:[n.admin1,n.country].filter(Boolean).join(", "),lat:n.latitude,lng:n.longitude}))}return s.slice(0,10)}static async reverseGeocode(t,e){try{const s=`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(t)}&longitude=${encodeURIComponent(e)}&localityLanguage=da`,i=await fetch(s);if(i.ok){const a=await i.json(),o=a.city||a.locality||a.principalSubdivision||"",l=a.principalSubdivision||a.countryName||"";if(o)return{name:o,sub:l&&l!==o?l:a.countryName}}}catch(s){console.warn("Reverse geocoding netværksfejl:",s)}return null}}class f{static currentDate=new Date;static listeners=new Set;static getDate(){return new Date(this.currentDate.getTime())}static setDate(t){this.currentDate=new Date(t.getTime()),this.notifyListeners()}static setTimeToNow(){this.setDate(new Date)}static subscribe(t){return this.listeners.add(t),()=>{this.listeners.delete(t)}}static notifyListeners(){const t=this.getDate();this.listeners.forEach(e=>{try{e(t)}catch(s){console.error("Fejl i time listener:",s)}})}static formatTime(t){if(!t||isNaN(t.getTime()))return"--:--";const e=String(t.getHours()).padStart(2,"0"),s=String(t.getMinutes()).padStart(2,"0");return`${e}:${s}`}static formatDateDanish(t){const e=["Søndag","Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag"],s=["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"],i=e[t.getDay()],a=t.getDate(),o=s[t.getMonth()];return`${i} d. ${a}. ${o}`}static formatShortDate(t){const e=["Søn","Man","Tir","Ons","Tor","Fre","Lør"],s=["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];return`${e[t.getDay()]} ${t.getDate()}. ${s[t.getMonth()]}`}static formatDuration(t){(isNaN(t)||t<0)&&(t=0);const e=Math.round(t/6e4);if(e<1)return"under 1 min";if(e<60)return`${e} min`;const s=Math.floor(e/60),i=e%60;if(s<24)return i===0?s===1?"1 time":`${s} timer`:s===1?`1 t. ${i} min`:`${s} t. ${i} min`;const a=Math.floor(s/24),o=Math.round(s%24);return a===1?o>0?`1 d. ${o} t.`:"1 dag":`${a} dage`}static formatIsoDate(t){const e=t.getFullYear(),s=String(t.getMonth()+1).padStart(2,"0"),i=String(t.getDate()).padStart(2,"0");return`${e}-${s}-${i}`}static parseIsoDate(t){if(!t||typeof t!="string")return null;const e=t.trim().split("-");if(e.length!==3)return null;const s=Number(e[0]),i=Number(e[1])-1,a=Number(e[2]);return isNaN(s)||isNaN(i)||isNaN(a)||s<1900||i<0||i>11||a<1||a>31?null:new Date(s,i,a)}static formatDateWithYearDanish(t){return`${this.formatDateDanish(t)} ${t.getFullYear()}`}static isToday(t,e=new Date){return t.getFullYear()===e.getFullYear()&&t.getMonth()===e.getMonth()&&t.getDate()===e.getDate()}static isTomorrow(t,e=new Date){const s=new Date(e);return s.setDate(s.getDate()+1),this.isToday(t,s)}static isYesterday(t,e=new Date){const s=new Date(e);return s.setDate(s.getDate()-1),this.isToday(t,s)}static getDaysDifference(t,e=new Date){const s=new Date(e.getFullYear(),e.getMonth(),e.getDate()),a=new Date(t.getFullYear(),t.getMonth(),t.getDate()).getTime()-s.getTime();return Math.round(a/(1e3*60*60*24))}static formatRelativeDay(t,e=new Date){const s=this.getDaysDifference(t,e);return s===0?"I dag":s===1?"I morgen":s===2?"I overmorgen":s===-1?"I går":s>0?`Om ${s} dage`:`${Math.abs(s)} dage siden`}static getNextSolsticeOrEquinox(t,e=new Date){const s=e.getFullYear();let i=0,a=0;switch(t){case"summer-solstice":i=5,a=21;break;case"autumn-equinox":i=8,a=22;break;case"winter-solstice":i=11,a=21;break;case"spring-equinox":i=2,a=20;break}const o=new Date(s,i,a),l=new Date(e.getFullYear(),e.getMonth(),e.getDate());return o.getTime()>=l.getTime()?o:new Date(s+1,i,a)}}const yt={nightMode:!1,units:"metric",lastModule:"home",version:1},xt="fs_app_settings_v1";class X{static getSettings(){try{const t=localStorage.getItem(xt);if(t)return{...yt,...JSON.parse(t)}}catch(t){console.warn("Fejl under læsning af indstillinger fra localStorage:",t)}return{...yt}}static saveSettings(t){const s={...this.getSettings(),...t};try{localStorage.setItem(xt,JSON.stringify(s))}catch(i){console.warn("Fejl under gemning af indstillinger i localStorage:",i)}return s}static getItem(t,e){try{const s=localStorage.getItem(t);if(s!==null)return JSON.parse(s)}catch(s){console.warn(`Fejl ved læsning af ${t}:`,s)}return e}static setItem(t,e){try{localStorage.setItem(t,JSON.stringify(e))}catch(s){console.warn(`Fejl ved lagring af ${t}:`,s)}}static removeItem(t){try{localStorage.removeItem(t)}catch(e){console.warn(`Fejl ved sletning af ${t}:`,e)}}}const rt="fs_desktop_workspace_v1";class M{static mode="dashboard";static maximizedPanel=null;static autoEvEnabled=!1;static currentCloudCoverPct=25;static modeListeners=new Set;static ambientListeners=new Set;static opticsListeners=new Set;static init(){const t=X.getItem(rt,{});t.mode&&["dashboard","planning","optics"].includes(t.mode)&&(this.mode=t.mode),typeof t.autoEv=="boolean"&&(this.autoEvEnabled=t.autoEv),f.subscribe(()=>{this.broadcastAmbientEv()}),C.subscribe(()=>{this.broadcastAmbientEv()})}static getMode(){return this.mode}static getMaximizedPanel(){return this.maximizedPanel}static setMode(t){this.mode=t,this.maximizedPanel=null,X.setItem(rt,{mode:this.mode,autoEv:this.autoEvEnabled}),this.notifyModeListeners()}static toggleMaximizePanel(t){this.maximizedPanel===t?this.maximizedPanel=null:this.maximizedPanel=t,this.notifyModeListeners()}static subscribeMode(t){return this.modeListeners.add(t),()=>this.modeListeners.delete(t)}static notifyModeListeners(){this.modeListeners.forEach(t=>{try{t(this.mode,this.maximizedPanel)}catch(e){console.error("Fejl i WorkspaceMode listener:",e)}}),setTimeout(()=>{window.dispatchEvent(new Event("resize"))},60)}static isAutoEvEnabled(){return this.autoEvEnabled}static setAutoEvEnabled(t){this.autoEvEnabled=t,X.setItem(rt,{mode:this.mode,autoEv:this.autoEvEnabled}),this.broadcastAmbientEv()}static setCloudCoverForCurrentTime(t){const e=Math.max(0,Math.min(100,Math.round(t)));e!==this.currentCloudCoverPct&&(this.currentCloudCoverPct=e,this.broadcastAmbientEv())}static getAmbientLightEstimate(t=f.getDate(),e=C.getLocation()){const i=F.getSunPosition(t,e.lat,e.lng).altitude,a=this.currentCloudCoverPct;let o=15,l="Fuldt dagslys";i>=30?(o=15,l="Høj sol (Sunny 16)"):i>=15?(o=14+(i-15)/15,l="Moderat solhøjde"):i>=6?(o=12.5+(i-6)/9*1.5,l="Lav sol"):i>=0?(o=9.5+i/6*3,l="Gylden time"):i>=-4?(o=6+(i+4)/4*3.5,l="Blå time (Civil skumring)"):i>=-6?(o=4+(i+6)/2*2,l="Sen blå time"):i>=-12?(o=1+(i+12)/6*3,l="Nautisk tusmørke"):(o=-2,l="Nat / Stjernehimmel");const c=i>-4?a/100*2.5:a/100*1,r=Math.round((o-c)*2)/2;return a>75&&i>0?l+=` • Overskyet (${a}%)`:a>35&&i>0&&(l+=` • Let skyet (${a}%)`),{ev100:r,label:l,sunAltitude:i,cloudCoverPct:a}}static subscribeAmbientEv(t){return this.ambientListeners.add(t),()=>this.ambientListeners.delete(t)}static broadcastAmbientEv(){const t=this.getAmbientLightEstimate();this.ambientListeners.forEach(e=>{try{e(t,this.autoEvEnabled)}catch(s){console.error("Fejl i AmbientEv listener:",s)}})}static emitOpticsSync(t){this.opticsListeners.forEach(e=>{try{e(t)}catch(s){console.error("Fejl i OpticsSync listener:",s)}})}static subscribeOpticsSync(t){return this.opticsListeners.add(t),()=>this.opticsListeners.delete(t)}}const B=Math.PI,I=Math.sin,q=Math.cos,zt=Math.tan,z=B/180;class Gt{canvas;ctx;currentMode="3d";subjectType="person";subjectHeight=1.75;camera={azimuth:220,pitch:35,zoom:1,isDragging:!1,lastMouseX:0,lastMouseY:0};simData={lat:55.6761,lng:12.5683,sunAzimuth:180,sunAltitude:30,shadowAzimuth:0,shadowLength:3.12,shadowRatio:1.73,hasDirectShadow:!0,diffusionFactor:1,sunTimes:null};animFrameId=null;isPaused=!1;resizeObserver=null;boundMouseMove;boundMouseUp;boundTouchMove;boundTouchEnd;boundThemeChange;constructor(t,e){this.canvas=t,this.ctx=t.getContext("2d"),e?.mode&&(this.currentMode=e.mode),e?.subjectType&&(this.subjectType=e.subjectType),e?.subjectHeight&&(this.subjectHeight=e.subjectHeight),this.setupInteraction(),this.setupResizeObserver()}setupResizeObserver(){typeof ResizeObserver<"u"&&(this.resizeObserver=new ResizeObserver(()=>{this.isPaused||this.render()}),this.canvas.parentElement?this.resizeObserver.observe(this.canvas.parentElement):this.resizeObserver.observe(this.canvas))}setupInteraction(){const t=(i,a)=>{this.currentMode==="3d"&&(this.camera.isDragging=!0,this.camera.lastMouseX=i,this.camera.lastMouseY=a)},e=(i,a)=>{if(!this.camera.isDragging||this.currentMode!=="3d")return;const o=i-this.camera.lastMouseX,l=a-this.camera.lastMouseY;this.camera.azimuth=((this.camera.azimuth-o*.5)%360+360)%360,this.camera.pitch=Math.max(12,Math.min(85,this.camera.pitch+l*.4)),this.camera.lastMouseX=i,this.camera.lastMouseY=a,this.render()},s=()=>{this.camera.isDragging=!1};this.boundMouseMove=i=>e(i.clientX,i.clientY),this.boundMouseUp=s,this.boundTouchMove=i=>{this.camera.isDragging&&i.touches.length===1&&e(i.touches[0].clientX,i.touches[0].clientY)},this.boundTouchEnd=s,this.boundThemeChange=()=>{this.isPaused||this.render()},this.canvas.addEventListener("mousedown",i=>t(i.clientX,i.clientY)),window.addEventListener("mousemove",this.boundMouseMove),window.addEventListener("mouseup",this.boundMouseUp),window.addEventListener("fs-theme-change",this.boundThemeChange),this.canvas.addEventListener("touchstart",i=>{i.touches.length===1&&t(i.touches[0].clientX,i.touches[0].clientY)},{passive:!0}),window.addEventListener("touchmove",this.boundTouchMove,{passive:!0}),window.addEventListener("touchend",this.boundTouchEnd)}destroy(){this.pause(),window.removeEventListener("mousemove",this.boundMouseMove),window.removeEventListener("mouseup",this.boundMouseUp),window.removeEventListener("touchmove",this.boundTouchMove),window.removeEventListener("touchend",this.boundTouchEnd),window.removeEventListener("fs-theme-change",this.boundThemeChange),this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=null)}pause(){this.isPaused=!0,this.animFrameId&&(cancelAnimationFrame(this.animFrameId),this.animFrameId=null)}resume(){this.isPaused=!1,this.render()}isNightRedMode(){return typeof document<"u"&&document.body.classList.contains("theme-night-red")}update(t,e,s,i){if(typeof s=="number"&&s>0&&(this.subjectHeight=s),i?.subjectType&&(this.subjectType=i.subjectType),typeof i?.diffusionFactor=="number"&&(this.simData.diffusionFactor=i.diffusionFactor),i?.sunTimes&&(this.simData.sunTimes=i.sunTimes),typeof i?.lat=="number"&&(this.simData.lat=i.lat),typeof i?.lng=="number"&&(this.simData.lng=i.lng),this.simData.sunAzimuth=e,this.simData.sunAltitude=t,this.simData.shadowAzimuth=(e+180)%360,t>0){const a=t*z;this.simData.hasDirectShadow=!0,this.simData.shadowRatio=1/zt(a),this.simData.shadowLength=this.subjectHeight*this.simData.shadowRatio}else this.simData.hasDirectShadow=!1,this.simData.shadowRatio=1/0,this.simData.shadowLength=1/0;this.isPaused||this.render()}setMode(t){this.currentMode=t,this.render()}setSubjectType(t,e){this.subjectType=t,e&&(this.subjectHeight=e),this.render()}resetCamera(t){t==="top"?this.camera.pitch=85:t==="rim"?(this.camera.azimuth=this.simData.sunAzimuth,this.camera.pitch=22):t==="shadow"?(this.camera.azimuth=this.simData.shadowAzimuth,this.camera.pitch=28):(this.camera.azimuth=(this.simData.sunAzimuth+45)%360,this.camera.pitch=35),this.camera.zoom=1,this.render()}render(){if(this.isPaused)return;const t=window.devicePixelRatio||1,e=this.canvas.getBoundingClientRect(),s=e.width||this.canvas.width||360,i=e.height||this.canvas.height||360;(this.canvas.width!==Math.floor(s*t)||this.canvas.height!==Math.floor(i*t))&&(this.canvas.width=Math.floor(s*t),this.canvas.height=Math.floor(i*t)),this.ctx.save(),this.ctx.scale(t,t),this.ctx.clearRect(0,0,s,i),this.currentMode==="3d"?this.render3DView(s,i):this.currentMode==="compass"&&this.renderCompassView(s,i),this.ctx.restore()}render3DView(t,e){const s=t*.5,i=e*.58,a=this.simData.sunAltitude,o=this.simData.sunAzimuth,l=this.simData.shadowAzimuth;this.drawSkyDome(t,e,a);const c=Math.min(this.simData.shadowLength,30),r=Math.max(9,Math.min(35,t*.38/Math.max(this.subjectHeight*2.2,c*.72))),n=this.camera.azimuth*z,d=this.camera.pitch*z,h=(u,m,p)=>{const g=u*q(n)-m*I(n),v=u*I(n)+m*q(n),y=p,x=s+g*r,w=i-v*r*I(d)-y*r*q(d);return{x,y:w,depth:v}};this.drawIlluminatedGroundPlane(h,r,a),this.drawGroundGrid(h),this.drawGroundCompass(h,t,e,r,d),this.simData.hasDirectShadow&&this.drawCastShadow(h,l,this.simData.shadowLength),this.drawSubject3D(h,r),this.drawSunInSky(t,e,s,i,a,o,h),this.drawEvfOverlay(t,e)}drawSkyDome(t,e,s){const i=this.ctx.createLinearGradient(0,0,0,e);if(this.isNightRedMode()){i.addColorStop(0,"#080000"),i.addColorStop(.6,"#140202"),i.addColorStop(.88,s>0?"#2a0404":"#180202"),i.addColorStop(1,"#0a0101"),this.ctx.fillStyle=i,this.ctx.fillRect(0,0,t,e);return}s>20?(i.addColorStop(0,"#0c1322"),i.addColorStop(.55,"#19243a"),i.addColorStop(.85,"#22324e"),i.addColorStop(1,"#111827")):s>6?(i.addColorStop(0,"#0d1322"),i.addColorStop(.55,"#1e283d"),i.addColorStop(.82,"#313247"),i.addColorStop(1,"#141824")):s>0?(i.addColorStop(0,"#0f1424"),i.addColorStop(.45,"#261b2e"),i.addColorStop(.72,"#5c2c1a"),i.addColorStop(.88,"#8c4815"),i.addColorStop(1,"#211822")):s>-6?(i.addColorStop(0,"#060a17"),i.addColorStop(.55,"#111833"),i.addColorStop(.85,"#1b2247"),i.addColorStop(1,"#0b0f1c")):(i.addColorStop(0,"#04060c"),i.addColorStop(.65,"#070b17"),i.addColorStop(1,"#03050a")),this.ctx.fillStyle=i,this.ctx.fillRect(0,0,t,e)}drawIlluminatedGroundPlane(t,e,s){const o=this.isNightRedMode();this.ctx.save(),this.ctx.beginPath();for(let r=0;r<=64;r++){const n=r/64*B*2,d=t(I(n)*24,q(n)*24,0);r===0?this.ctx.moveTo(d.x,d.y):this.ctx.lineTo(d.x,d.y)}this.ctx.closePath();const l=t(0,0,0),c=this.ctx.createRadialGradient(l.x,l.y,5,l.x,l.y,24*e*1.1);o?(c.addColorStop(0,"#240505"),c.addColorStop(.6,"#140202"),c.addColorStop(1,"rgba(10, 0, 0, 0)")):s>6?(c.addColorStop(0,"#243048"),c.addColorStop(.6,"#182030"),c.addColorStop(1,"rgba(15, 23, 42, 0)")):s>0?(c.addColorStop(0,"#3a2920"),c.addColorStop(.55,"#241a22"),c.addColorStop(1,"rgba(17, 24, 39, 0)")):(c.addColorStop(0,"#151d2f"),c.addColorStop(.7,"#0f1522"),c.addColorStop(1,"rgba(10, 15, 25, 0)")),this.ctx.fillStyle=c,this.ctx.fill(),this.ctx.strokeStyle=o?"rgba(255, 50, 50, 0.2)":"rgba(255, 255, 255, 0.12)",this.ctx.lineWidth=1.5,this.ctx.stroke(),this.ctx.restore()}drawGroundGrid(t){const e=[1,2,5,10,20],s=this.isNightRedMode();this.ctx.save(),this.ctx.font="10px ui-monospace, SFMono-Regular, monospace",this.ctx.textAlign="center",this.ctx.textBaseline="middle";for(let i=0;i<e.length;i++){const a=e[i];this.ctx.beginPath();const o=48;for(let c=0;c<=o;c++){const r=c/o*B*2,n=t(I(r)*a,q(r)*a,0);c===0?this.ctx.moveTo(n.x,n.y):this.ctx.lineTo(n.x,n.y)}s?this.ctx.strokeStyle=a===5||a===10?"rgba(255, 60, 60, 0.25)":"rgba(255, 50, 50, 0.12)":this.ctx.strokeStyle=a===5||a===10?"rgba(255, 255, 255, 0.18)":"rgba(255, 255, 255, 0.08)",this.ctx.lineWidth=a===5||a===10?1.5:1,this.ctx.stroke();const l=t(a,0,0);this.ctx.fillStyle=s?"rgba(201, 52, 52, 0.8)":"rgba(148, 163, 184, 0.65)",this.ctx.fillText(`${a}m`,l.x,l.y-5)}this.ctx.restore()}drawGroundCompass(t,e,s,i,a){const o=Math.max(.3,I(a)),l=Math.min(e,s)*.42/(i*o),c=Math.max(3.5,Math.min(22,l*.85)),r=this.isNightRedMode();this.ctx.save(),this.ctx.font="bold 11px ui-monospace, SFMono-Regular, monospace",this.ctx.textAlign="center",this.ctx.textBaseline="middle";const n=t(0,0,0),d=t(0,c,0),h=t(0,-c,0),u=t(c,0,0),m=t(-c,0,0);this.ctx.lineWidth=1.5,this.ctx.setLineDash([4,4]),this.ctx.strokeStyle=r?"rgba(255, 50, 50, 0.22)":"rgba(255, 255, 255, 0.16)",this.ctx.beginPath(),this.ctx.moveTo(n.x,n.y),this.ctx.lineTo(h.x,h.y),this.ctx.stroke(),this.ctx.strokeStyle=r?"rgba(255, 77, 77, 0.6)":"rgba(239, 68, 68, 0.45)",this.ctx.beginPath(),this.ctx.moveTo(n.x,n.y),this.ctx.lineTo(d.x,d.y),this.ctx.stroke(),this.ctx.strokeStyle=r?"rgba(255, 50, 50, 0.22)":"rgba(255, 255, 255, 0.16)",this.ctx.beginPath(),this.ctx.moveTo(m.x,m.y),this.ctx.lineTo(u.x,u.y),this.ctx.stroke(),this.ctx.setLineDash([]);const p=(g,v,y)=>{const x=y?28:22,b=18,w=g.x-x*.5,L=g.y-b*.5;this.ctx.fillStyle=r?"rgba(24, 2, 2, 0.94)":"rgba(15, 23, 42, 0.92)",this.ctx.strokeStyle=y?"#ef4444":r?"rgba(201, 52, 52, 0.5)":"rgba(148, 163, 184, 0.45)",this.ctx.lineWidth=y?1.5:1,this.ctx.beginPath(),this.ctx.roundRect(w,L,x,b,4),this.ctx.fill(),this.ctx.stroke(),this.ctx.fillStyle=y?"#ef4444":r?"#c93434":"#cbd5e1",this.ctx.fillText(v,g.x,g.y)};p(d,"▲ N",!0),p(u,"Ø",!1),p(h,"S",!1),p(m,"V",!1),this.ctx.restore()}drawCastShadow(t,e,s){if(s<=.05)return;const i=this.isNightRedMode(),a=e*z,o=I(a),l=q(a),c=-l,r=o,n=t(0,0,0),d=t(o*s,l*s,0);let h=Math.max(.7,this.subjectHeight*.45);this.subjectType==="tree"&&(h=Math.max(2.5,this.subjectHeight*.7)),this.subjectType==="building"&&(h=Math.max(4,this.subjectHeight*.8));const u=h*(1+Math.min(s*.06,1.4)),m=t(c*(h*.5),r*(h*.5),0),p=t(-c*(h*.5),-r*(h*.5),0),g=t(o*s+c*(u*.5),l*s+r*(u*.5),0),v=t(o*s-c*(u*.5),l*s-r*(u*.5),0);this.ctx.save();const y=this.ctx.createLinearGradient(n.x,n.y,d.x,d.y),x=this.simData.diffusionFactor||1;y.addColorStop(0,`rgba(0, 0, 0, ${.95*x})`),y.addColorStop(.7,i?`rgba(12, 0, 0, ${.85*x})`:`rgba(2, 6, 18, ${.85*x})`),y.addColorStop(1,i?`rgba(20, 2, 2, ${.45*x})`:`rgba(10, 16, 28, ${.45*x})`),this.ctx.fillStyle=y,this.ctx.beginPath(),this.ctx.moveTo(m.x,m.y),this.ctx.lineTo(g.x,g.y),this.ctx.quadraticCurveTo(d.x+o*6,d.y+l*6,v.x,v.y),this.ctx.lineTo(p.x,p.y),this.ctx.closePath(),this.ctx.fill();const b=i?"#ff4444":"#38bdf8";this.ctx.strokeStyle=i?"rgba(255, 68, 68, 0.45)":"rgba(56, 189, 248, 0.45)",this.ctx.lineWidth=1.5,this.ctx.stroke(),this.ctx.strokeStyle=b,this.ctx.setLineDash([4,4]),this.ctx.lineWidth=2,this.ctx.beginPath(),this.ctx.moveTo(n.x,n.y),this.ctx.lineTo(d.x,d.y),this.ctx.stroke(),this.ctx.setLineDash([]);const w=s<100?`${s.toFixed(1)} m`:"> 100 m",L=74,k=22,T=d.x-L*.5,O=d.y-28;this.ctx.fillStyle=i?"rgba(24, 2, 2, 0.94)":"rgba(15, 23, 42, 0.92)",this.ctx.strokeStyle=b,this.ctx.lineWidth=1.5,this.ctx.beginPath(),this.ctx.roundRect(T,O,L,k,4),this.ctx.fill(),this.ctx.stroke(),this.ctx.fillStyle=b,this.ctx.font="bold 11px ui-monospace, SFMono-Regular, monospace",this.ctx.textAlign="center",this.ctx.textBaseline="middle",this.ctx.fillText(`👤 ${w}`,d.x,O+k*.5),this.ctx.restore()}drawSubject3D(t,e){const s=this.subjectHeight,i=t(0,0,0),a=t(0,0,s),o=this.isNightRedMode();if(this.ctx.save(),this.subjectType==="tree"){this.ctx.strokeStyle=o?"#7f1d1d":"#92400e",this.ctx.lineWidth=Math.max(4,e*.25),this.ctx.beginPath(),this.ctx.moveTo(i.x,i.y),this.ctx.lineTo(a.x,a.y+(i.y-a.y)*.4),this.ctx.stroke();const c=t(0,0,s*.7),r=(i.y-a.y)*.45,n=this.ctx.createRadialGradient(c.x,c.y,r*.1,c.x,c.y,r);o?(n.addColorStop(0,"#dc2626"),n.addColorStop(.7,"#991b1b"),n.addColorStop(1,"#450a0a")):(n.addColorStop(0,"#4ade80"),n.addColorStop(.7,"#16a34a"),n.addColorStop(1,"#14532d")),this.ctx.fillStyle=n,this.ctx.beginPath(),this.ctx.arc(c.x,c.y,r,0,B*2),this.ctx.fill()}else if(this.subjectType==="building"){const c=s*.6,r=t(-c*.5,-c*.5,0),n=t(c*.5,-c*.5,0),d=t(c*.5,c*.5,0),h=t(-c*.5,-c*.5,s),u=t(c*.5,-c*.5,s),m=t(c*.5,c*.5,s),p=t(-c*.5,c*.5,s);this.ctx.fillStyle=o?"rgba(69, 10, 10, 0.9)":"rgba(51, 65, 85, 0.9)",this.ctx.strokeStyle=o?"#dc2626":"#94a3b8",this.ctx.lineWidth=1.5,this.ctx.beginPath(),this.ctx.moveTo(r.x,r.y),this.ctx.lineTo(n.x,n.y),this.ctx.lineTo(u.x,u.y),this.ctx.lineTo(h.x,h.y),this.ctx.closePath(),this.ctx.fill(),this.ctx.stroke(),this.ctx.beginPath(),this.ctx.moveTo(n.x,n.y),this.ctx.lineTo(d.x,d.y),this.ctx.lineTo(m.x,m.y),this.ctx.lineTo(u.x,u.y),this.ctx.closePath(),this.ctx.fill(),this.ctx.stroke(),this.ctx.fillStyle=o?"rgba(90, 15, 15, 0.95)":"rgba(71, 85, 105, 0.95)",this.ctx.beginPath(),this.ctx.moveTo(h.x,h.y),this.ctx.lineTo(u.x,u.y),this.ctx.lineTo(m.x,m.y),this.ctx.lineTo(p.x,p.y),this.ctx.closePath(),this.ctx.fill(),this.ctx.stroke()}else{const c=a.y,r=i.y,n=r-c,d=o?"#ff4d4d":"#f8fafc";this.ctx.strokeStyle=d,this.ctx.lineWidth=3,this.ctx.beginPath(),this.ctx.arc(i.x,c+5,5.5,0,B*2),this.ctx.fillStyle=d,this.ctx.fill(),this.ctx.beginPath(),this.ctx.moveTo(i.x,c+11),this.ctx.lineTo(i.x,r-n*.4),this.ctx.lineTo(i.x-6,r),this.ctx.moveTo(i.x,r-n*.4),this.ctx.lineTo(i.x+6,r),this.ctx.moveTo(i.x-8,c+18),this.ctx.lineTo(i.x+8,c+18),this.ctx.stroke()}const l=i.x+20;this.ctx.strokeStyle=o?"rgba(255, 77, 77, 0.4)":"rgba(255, 255, 255, 0.35)",this.ctx.lineWidth=1,this.ctx.beginPath(),this.ctx.moveTo(l,i.y),this.ctx.lineTo(l,a.y),this.ctx.moveTo(l-3,i.y),this.ctx.lineTo(l+3,i.y),this.ctx.moveTo(l-3,a.y),this.ctx.lineTo(l+3,a.y),this.ctx.stroke(),this.ctx.fillStyle=o?"#c93434":"#cbd5e1",this.ctx.font="10px ui-monospace, SFMono-Regular, monospace",this.ctx.textAlign="left",this.ctx.fillText(`${this.subjectHeight.toFixed(1)}m`,l+6,(i.y+a.y)*.5+3),this.ctx.restore()}drawSunInSky(t,e,s,i,a,o,l){if(a<=-.833){this.drawSubHorizonIndicator(t,e,a);return}const c=this.isNightRedMode(),r=(o-this.camera.azimuth+540)%360-180,n=Math.abs(r)<95,d=l(0,0,this.subjectHeight);if(!n){this.ctx.save();const O=`☀ Sol: ${o.toFixed(0)}° ${F.getCompassDirection(o)} (+${a.toFixed(1)}°) [Bag synsvinkel]`;this.ctx.fillStyle=c?"rgba(24, 2, 2, 0.92)":"rgba(15, 23, 42, 0.88)",this.ctx.strokeStyle=c?"rgba(255, 77, 77, 0.45)":"rgba(245, 158, 11, 0.4)",this.ctx.lineWidth=1;const j=230,G=22;this.ctx.beginPath(),this.ctx.roundRect(14,14,j,G,4),this.ctx.fill(),this.ctx.stroke(),this.ctx.fillStyle=c?"#ff4d4d":"#fbbf24",this.ctx.font="bold 10px ui-monospace, SFMono-Regular, monospace",this.ctx.textAlign="left",this.ctx.textBaseline="middle",this.ctx.fillText(O,22,25),this.ctx.restore();return}const h=this.simData.shadowAzimuth*z,u=I(h),m=q(h),p=Math.max(.5,this.simData.shadowLength),g=l(u*p,m*p,0),v=d.x-g.x,y=d.y-g.y,x=Math.hypot(v,y);let b=s,w=i-60;if(x>.001){const j=Math.max(70,Math.min(180,Math.min(t,e)*.44))/x;b=d.x+v*j,w=d.y+y*j,b=Math.max(36,Math.min(t-75,b)),w=Math.max(28,Math.min(e*.65,w))}this.ctx.save();const L=40,k=this.ctx.createRadialGradient(b,w,4,b,w,L);c?(k.addColorStop(0,"#ff4d4d"),k.addColorStop(.35,"rgba(220, 38, 38, 0.5)"),k.addColorStop(1,"rgba(127, 29, 29, 0)")):a<6?(k.addColorStop(0,"#fbbf24"),k.addColorStop(.35,"rgba(245, 158, 11, 0.6)"),k.addColorStop(1,"rgba(180, 83, 9, 0)")):(k.addColorStop(0,"#ffffff"),k.addColorStop(.3,"rgba(253, 224, 71, 0.7)"),k.addColorStop(.7,"rgba(245, 158, 11, 0.3)"),k.addColorStop(1,"rgba(245, 158, 11, 0)")),this.ctx.fillStyle=k,this.ctx.beginPath(),this.ctx.arc(b,w,L,0,B*2),this.ctx.fill(),this.ctx.fillStyle=c?"#ff6666":a<6?"#fef08a":"#ffffff",this.ctx.beginPath(),this.ctx.arc(b,w,11,0,B*2),this.ctx.fill(),this.ctx.strokeStyle=c?"rgba(255, 77, 77, 0.55)":"rgba(251, 191, 36, 0.55)",this.ctx.lineWidth=1.5,this.ctx.setLineDash([4,4]),this.ctx.beginPath(),this.ctx.moveTo(b,w),this.ctx.lineTo(d.x,d.y),this.ctx.stroke(),this.ctx.setLineDash([]),this.ctx.fillStyle=c?"#ff4d4d":"#fbbf24",this.ctx.font="bold 11px ui-monospace, SFMono-Regular, monospace",this.ctx.textAlign=b>s?"left":"right";const T=b>s?b+16:b-16;this.ctx.fillText(`SOL ${a>=0?"+":""}${a.toFixed(1)}°`,T,w-4),this.ctx.fillStyle=c?"#c93434":"#94a3b8",this.ctx.fillText(`${o.toFixed(0)}° ${F.getCompassDirection(o)}`,T,w+10),this.ctx.restore()}drawSubHorizonIndicator(t,e,s){const i=this.isNightRedMode();this.ctx.save(),this.ctx.fillStyle=i?"#ff4d4d":"#818cf8",this.ctx.font="bold 12px ui-monospace, SFMono-Regular, monospace",this.ctx.textAlign="center";const a=s<-18?"ASTRONOMISK NAT":s<-6?"TUSMØRKE":"BLÅ TIME";this.ctx.fillText(`☾ ${a} (SOL ${s.toFixed(1)}° UNDER HORISONTEN)`,t*.5,34),this.ctx.font="10px -apple-system, BlinkMacSystemFont, sans-serif",this.ctx.fillStyle=i?"#8b1e1e":"#64748b",this.ctx.fillText("Ingen hårde direkte skygger – diffus belysning",t*.5,50),this.ctx.restore()}drawEvfOverlay(t,e){const s=this.isNightRedMode(),i=s?"rgba(255, 60, 60, 0.25)":"rgba(255, 255, 255, 0.2)",a=14,o=12;this.ctx.save(),this.ctx.strokeStyle=i,this.ctx.lineWidth=1.5,this.ctx.beginPath(),this.ctx.moveTo(o,o+a),this.ctx.lineTo(o,o),this.ctx.lineTo(o+a,o),this.ctx.moveTo(t-o-a,o),this.ctx.lineTo(t-o,o),this.ctx.lineTo(t-o,o+a),this.ctx.moveTo(o,e-o-a),this.ctx.lineTo(o,e-o),this.ctx.lineTo(o+a,e-o),this.ctx.moveTo(t-o-a,e-o),this.ctx.lineTo(t-o,e-o),this.ctx.lineTo(t-o,e-o-a),this.ctx.stroke(),this.drawMiniCompassRose(t,e),this.ctx.fillStyle=s?"rgba(201, 52, 52, 0.6)":"rgba(148, 163, 184, 0.5)",this.ctx.font="9px ui-monospace, SFMono-Regular, monospace",this.ctx.textAlign="center",this.ctx.fillText("TRÆK FOR AT ROTERE 3D-SØGER",t*.5,e-16),this.ctx.restore()}drawMiniCompassRose(t,e){const i=t-46,a=46,o=this.isNightRedMode();this.ctx.save(),this.ctx.fillStyle=o?"rgba(24, 2, 2, 0.92)":"rgba(15, 23, 42, 0.9)",this.ctx.strokeStyle=o?"rgba(255, 60, 60, 0.3)":"rgba(255, 255, 255, 0.2)",this.ctx.lineWidth=1.5,this.ctx.beginPath(),this.ctx.arc(i,a,24,0,B*2),this.ctx.fill(),this.ctx.stroke();const l=this.camera.azimuth,c=(-l-90)*z,r=18,n=i+q(c)*r,d=a+I(c)*r,h=i-q(c)*(r*.65),u=a-I(c)*(r*.65);this.ctx.strokeStyle=o?"rgba(201, 52, 52, 0.45)":"rgba(148, 163, 184, 0.45)",this.ctx.lineWidth=2,this.ctx.beginPath(),this.ctx.moveTo(i,a),this.ctx.lineTo(h,u),this.ctx.stroke(),this.ctx.strokeStyle="#ef4444",this.ctx.lineWidth=2.5,this.ctx.beginPath(),this.ctx.moveTo(i,a),this.ctx.lineTo(n,d),this.ctx.stroke();const m=i+q(c)*19,p=a+I(c)*19;this.ctx.font="bold 9px ui-monospace, SFMono-Regular, monospace",this.ctx.textAlign="center",this.ctx.textBaseline="middle",this.ctx.fillStyle="#ef4444",this.ctx.fillText("N",m,p);const g=(this.simData.sunAzimuth-l-90)*z,v=i+q(g)*22,y=a+I(g)*22;this.ctx.fillStyle=o?"#ff6666":"#fbbf24",this.ctx.beginPath(),this.ctx.arc(v,y,3.5,0,B*2),this.ctx.fill();const x=(this.simData.shadowAzimuth-l-90)*z,b=i+q(x)*22,w=a+I(x)*22;this.ctx.fillStyle=o?"#ff3333":"#38bdf8",this.ctx.beginPath(),this.ctx.arc(b,w,2.5,0,B*2),this.ctx.fill(),this.ctx.fillStyle=o?"#ff4d4d":"#ffffff",this.ctx.beginPath(),this.ctx.arc(i,a,2,0,B*2),this.ctx.fill();const L=`${Math.round(l)}° ${F.getCompassDirection(l)}`;this.ctx.font="9px ui-monospace, SFMono-Regular, monospace",this.ctx.fillStyle=o?"#c93434":"#94a3b8",this.ctx.textAlign="center",this.ctx.fillText(L,i,a+24+10),this.ctx.restore()}renderCompassView(t,e){const s=t*.5,i=e*.5,a=Math.min(t,e)*.42,o=this.isNightRedMode();this.ctx.fillStyle=o?"#080000":"#070a12",this.ctx.fillRect(0,0,t,e),this.ctx.save(),this.ctx.beginPath(),this.ctx.arc(s,i,a,0,B*2),this.ctx.fillStyle=o?"#140202":"#0f172a",this.ctx.fill(),this.ctx.strokeStyle=o?"rgba(255, 50, 50, 0.25)":"rgba(255, 255, 255, 0.15)",this.ctx.lineWidth=2,this.ctx.stroke();for(let n=0;n<360;n+=10){const d=(n-90)*z,h=n%30===0,u=n%90===0,m=u?12:h?8:4,p=s+q(d)*a,g=i+I(d)*a,v=s+q(d)*(a-m),y=i+I(d)*(a-m);if(this.ctx.beginPath(),this.ctx.moveTo(p,g),this.ctx.lineTo(v,y),this.ctx.strokeStyle=u?o?"#ff4d4d":"#38bdf8":o?"rgba(255, 50, 50, 0.15)":"rgba(255, 255, 255, 0.12)",this.ctx.lineWidth=u?2:1,this.ctx.stroke(),h){const x=s+q(d)*(a-20),b=i+I(d)*(a-20);this.ctx.font=u?"bold 12px ui-monospace, monospace":"9px ui-monospace, monospace",this.ctx.textAlign="center",this.ctx.textBaseline="middle",this.ctx.fillStyle=u?n===0?"#f43f5e":o?"#ff4d4d":"#38bdf8":o?"#8b1e1e":"#64748b";const w=n===0?"N":n===90?"Ø":n===180?"S":n===270?"V":`${n}°`;this.ctx.fillText(w,x,b)}}if(this.simData.sunTimes?.sunrise&&this.simData.sunTimes?.sunset){const n=F.getSunPosition(this.simData.sunTimes.sunrise,this.simData.lat,this.simData.lng),d=F.getSunPosition(this.simData.sunTimes.sunset,this.simData.lat,this.simData.lng);this.ctx.beginPath();const h=(n.azimuth-90)*z,u=(d.azimuth-90)*z;this.ctx.arc(s,i,a*.75,h,u,!1),this.ctx.strokeStyle=o?"rgba(255, 77, 77, 0.35)":"rgba(245, 158, 11, 0.35)",this.ctx.lineWidth=3,this.ctx.stroke()}const l=(this.simData.sunAzimuth-90)*z,c=s+q(l)*(a*.92),r=i+I(l)*(a*.92);if(this.ctx.strokeStyle=o?"#ff5533":"#f59e0b",this.ctx.lineWidth=2,this.ctx.beginPath(),this.ctx.moveTo(s,i),this.ctx.lineTo(c,r),this.ctx.stroke(),this.ctx.fillStyle=o?"#ff6666":"#fbbf24",this.ctx.beginPath(),this.ctx.arc(c,r,8,0,B*2),this.ctx.fill(),this.simData.hasDirectShadow){const n=(this.simData.shadowAzimuth-90)*z,d=Math.min(a*.85,this.simData.shadowLength/10*a*.5),h=s+q(n)*d,u=i+I(n)*d;this.ctx.strokeStyle=o?"#ff3333":"#38bdf8",this.ctx.lineWidth=3,this.ctx.beginPath(),this.ctx.moveTo(s,i),this.ctx.lineTo(h,u),this.ctx.stroke(),this.ctx.fillStyle=o?"#ff3333":"#38bdf8",this.ctx.beginPath(),this.ctx.arc(h,u,5,0,B*2),this.ctx.fill()}this.ctx.fillStyle=o?"#ff4d4d":"#ffffff",this.ctx.beginPath(),this.ctx.arc(s,i,4,0,B*2),this.ctx.fill(),this.ctx.restore()}}const _t="modulepreload",Kt=function(S,t){return new URL(S,t).href},St={},Ot=function(t,e,s){let i=Promise.resolve();if(e&&e.length>0){const o=document.getElementsByTagName("link"),l=document.querySelector("meta[property=csp-nonce]"),c=l?.nonce||l?.getAttribute("nonce");i=Promise.allSettled(e.map(r=>{if(r=Kt(r,s),r in St)return;St[r]=!0;const n=r.endsWith(".css"),d=n?'[rel="stylesheet"]':"";if(!!s)for(let m=o.length-1;m>=0;m--){const p=o[m];if(p.href===r&&(!n||p.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${r}"]${d}`))return;const u=document.createElement("link");if(u.rel=n?"stylesheet":_t,n||(u.as="script"),u.crossOrigin="",u.href=r,c&&u.setAttribute("nonce",c),document.head.appendChild(u),n)return new Promise((m,p)=>{u.addEventListener("load",m),u.addEventListener("error",()=>p(new Error(`Unable to preload CSS for ${r}`)))})}))}function a(o){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=o,window.dispatchEvent(l),!l.defaultPrevented)throw o}return i.then(o=>{for(const l of o||[])l.status==="rejected"&&a(l.reason);return t().catch(a)})};class Wt{container;options;map=null;L=null;marker=null;sunRayLine=null;sunMarker=null;shadowLine=null;shadowPoly=null;shadowMarker=null;isLoaded=!1;lastUpdateArgs=null;constructor(t,e){this.container=t,this.options=e||{}}async init(t,e){if(this.isLoaded)return;const s=await Ot(()=>import("./leaflet-src-DTmlu4rB.js").then(d=>d.l),[],import.meta.url);this.L=s.default||s,this.isLoaded=!0,this.map=this.L.map(this.container,{center:[t,e],zoom:16,zoomControl:!1,attributionControl:!1}),this.L.control.zoom({position:"bottomright"}).addTo(this.map);const i=this.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}),a=this.L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:19,attribution:"&copy; Esri World Imagery"});i.addTo(this.map);const o={"🗺️ Gadekort":i,"🛰️ Satellit":a};this.L.control.layers(o,null,{position:"topright"}).addTo(this.map);const c=this.L.divIcon({className:"fs-leaflet-icon",html:`
      <div style="width:30px;height:30px;border-radius:50%;background:#07080a;border:2px solid #f59e0b;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(245,158,11,0.6);cursor:grab;">
        <span style="font-size:13px;line-height:1;">📷</span>
      </div>
    `,iconSize:[30,30],iconAnchor:[15,15]});this.marker=this.L.marker([t,e],{icon:c,draggable:!0}).addTo(this.map),this.marker.on("dragend",d=>{const h=d.target.getLatLng();this.options.onLocationChange&&this.options.onLocationChange(h.lat,h.lng)}),this.map.on("click",d=>{this.marker.setLatLng(d.latlng),this.options.onLocationChange&&this.options.onLocationChange(d.latlng.lat,d.latlng.lng)}),this.sunRayLine=this.L.polyline([],{color:"#f59e0b",weight:3.5,dashArray:"6, 6",opacity:.95}).addTo(this.map);const r=this.L.divIcon({className:"fs-leaflet-sun-marker",html:`
        <div class="fs-map-sun-badge">
          <span style="font-size:15px;line-height:1;">☀️</span>
          <span class="fs-map-sun-text">SOL</span>
        </div>
      `,iconSize:[95,28],iconAnchor:[47,14]});this.sunMarker=this.L.marker([t,e],{icon:r,interactive:!1}).addTo(this.map),this.shadowPoly=this.L.polygon([],{color:"#38bdf8",fillColor:"#0369a1",fillOpacity:.45,weight:2}).addTo(this.map),this.shadowLine=this.L.polyline([],{color:"#38bdf8",weight:3,dashArray:"4, 4",opacity:.9}).addTo(this.map);const n=this.L.divIcon({className:"fs-leaflet-shadow-marker",html:`
        <div class="fs-map-shadow-badge">
          <span style="font-size:11px;line-height:1;">👤</span>
          <span class="fs-map-shadow-text">0,0 m</span>
        </div>
      `,iconSize:[85,22],iconAnchor:[42,11]});this.shadowMarker=this.L.marker([t,e],{icon:n,interactive:!1}).addTo(this.map),this.invalidateSize(),this.lastUpdateArgs&&this.update(...this.lastUpdateArgs)}update(t,e,s,i,a,o){if(this.lastUpdateArgs=[t,e,s,i,a,o],!this.map||!this.L)return;const l=[t,e];this.marker.setLatLng(l);const c=s>-.833,r=s>0;if(c){const d=this.calculateDestination(t,e,350,i);this.sunRayLine.setLatLngs([l,d]),this.sunRayLine.setStyle({opacity:.95}),this.sunMarker.setLatLng(d),this.sunMarker.setOpacity(1);const h=F.getCompassDirection(i),u=this.container.querySelector(".fs-map-sun-text");u&&(u.textContent=`SOL ${i.toFixed(0)}° ${h}`)}else this.sunRayLine.setLatLngs([]),this.sunMarker.setOpacity(0);if(r){const n=Math.max(24,Math.min(o,2e3)),d=this.calculateDestination(t,e,n,a),h=this.calculateDestination(t,e,n,(a-3.5+360)%360),u=this.calculateDestination(t,e,n,(a+3.5)%360);this.shadowPoly.setLatLngs([l,h,d,u]),this.shadowPoly.setStyle({opacity:.9,fillOpacity:.45}),this.shadowLine.setLatLngs([l,d]),this.shadowLine.setStyle({opacity:.9}),this.shadowMarker.setLatLng(d),this.shadowMarker.setOpacity(1);const m=o<1e3?`${o.toFixed(1).replace(".",",")} m`:`${(o/1e3).toFixed(2).replace(".",",")} km`,p=this.container.querySelector(".fs-map-shadow-text");p&&(p.textContent=`${m}`)}else this.shadowPoly.setLatLngs([]),this.shadowLine.setLatLngs([]),this.shadowMarker.setOpacity(0)}setCenter(t,e){this.map&&(this.map.setView([t,e],this.map.getZoom()),this.invalidateSize())}invalidateSize(){this.map&&setTimeout(()=>{this.map?.invalidateSize()},50)}calculateDestination(t,e,s,i){const o=s,l=i*Math.PI/180,c=t*Math.PI/180,r=e*Math.PI/180,n=Math.asin(Math.sin(c)*Math.cos(o/6371e3)+Math.cos(c)*Math.sin(o/6371e3)*Math.cos(l)),d=r+Math.atan2(Math.sin(l)*Math.sin(o/6371e3)*Math.cos(c),Math.cos(o/6371e3)-Math.sin(c)*Math.sin(n));return[n*180/Math.PI,d*180/Math.PI]}}class Yt{container;simulator=null;mapView=null;viewLayout="split";canvasSubMode="3d";subjectType="person";subjectHeight=1.75;currentDate=f.getDate();currentLocation=C.getLocation();isPlaying=!1;playSpeed=1;playIntervalId=null;unsubLocation=null;unsubTime=null;isInternalTimeChange=!1;async mount(t){this.container=t,this.currentLocation=C.getLocation(),this.currentDate=f.getDate(),this.render(),this.initSimulator(),await this.initMap(),this.attachEventListeners(),this.updateCalculations(),this.unsubLocation=C.subscribe(e=>{this.currentLocation=e,this.updateCalculations(),this.mapView&&this.mapView.setCenter(e.lat,e.lng)}),this.unsubTime=f.subscribe(e=>{if(this.isInternalTimeChange)return;this.currentDate=e;const s=e.getHours()*60+e.getMinutes(),i=this.container.querySelector("#sunTimeSlider");i&&Number(i.value)!==s&&(i.value=String(s)),this.updateCalculations()})}onActivate(){this.simulator?.resume(),this.mapView?.invalidateSize(),this.updateCalculations()}onDeactivate(){this.pausePlayback()}render(){const t=this.currentDate.getHours()*60+this.currentDate.getMinutes();this.container.innerHTML=`
      <div class="sun-container desktop-sun-panel">
        <!-- 1. KOMPAKT TELEMETRI TOP-STRIP -->
        <div class="sun-hero-card desktop-sun-telemetry">
          <div class="sun-main-telemetry">
            <div style="display:flex;align-items:baseline;gap:12px;">
              <div class="sun-time-large tabular-nums" id="sunTimeDisplay">${f.formatTime(this.currentDate)}</div>
              <div class="sun-date-sub" id="sunDateDisplay">${f.formatDateDanish(this.currentDate)}</div>
            </div>
            <div class="sun-phase-badge-wrap">
              <span class="fs-badge badge-sun" id="sunLightPhaseBadge">Gylden time</span>
              <span class="sun-kelvin-badge tabular-nums" id="sunKelvinDisplay">3300K</span>
            </div>
          </div>

          <div class="sun-grid-metrics">
            <div class="stat-item">
              <span class="stat-label">Solhøjde</span>
              <span class="stat-num tabular-nums" id="sunAltitudeVal">+0.0°</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Solretning</span>
              <span class="stat-num tabular-nums" id="sunAzimuthVal">180° S</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Skyggelængde (${this.subjectHeight.toFixed(1).replace(".",",")}m)</span>
              <span class="stat-num tabular-nums" id="sunShadowLengthVal">0,0 m</span>
            </div>
          </div>
        </div>

        <!-- 2. DUAL-VIEW SCENE: KORT + 3D EVF SIDE-OM-SIDE -->
        <div class="sun-scene-card desktop-dual-scene-card">
          <div class="scene-header-row">
            <div class="fs-segmented-control" style="max-width: 390px;">
              <button class="fs-segment-btn ${this.viewLayout==="split"?"active":""}" data-layout="split">⚡ Kort + 3D Split</button>
              <button class="fs-segment-btn ${this.viewLayout==="map"?"active":""}" data-layout="map">🗺️ Kun Kort</button>
              <button class="fs-segment-btn ${this.viewLayout==="3d"?"active":""}" data-layout="3d">🎥 Kun 3D</button>
              <button class="fs-segment-btn ${this.viewLayout==="compass"?"active":""}" data-layout="compass">🧭 Solur</button>
            </div>

            <!-- Kameragenveje for 3D-søger -->
            <div class="camera-preset-bar desktop-cam-presets" id="cameraPresetsWrap">
              <button class="quick-val-btn" data-cam="default">Standard 3D</button>
              <button class="quick-val-btn" data-cam="top">Top</button>
              <button class="quick-val-btn" data-cam="rim">Modlys</button>
              <button class="quick-val-btn" data-cam="shadow">Medlys</button>
            </div>
          </div>

          <!-- Dual Viewport Container -->
          <div class="desktop-dual-viewport layout-${this.viewLayout}" id="sunDualViewport">
            <!-- Venstre/Første: Interaktivt Leaflet Kort med Sol- & Skyggevektor -->
            <div class="dual-pane pane-map" id="sunMapPane">
              <div id="sunMapContainer" style="width:100%;height:100%;"></div>
              <div class="pane-corner-tag">🗺️ Klik eller træk kamera-pin på kortet</div>
            </div>

            <!-- Højre/Anden: Retina 3D EVF / Solur Canvas -->
            <div class="dual-pane pane-canvas" id="sunCanvasPane">
              <canvas id="sunCanvas"></canvas>
              <div class="pane-corner-tag" id="sunCanvasTag">🎥 3D Søger (træk for at rotere)</div>
            </div>
          </div>
        </div>

        <!-- 3. DØGN-SCRUBBER & HURTIGSPRING TIL SOLTIDER -->
        <div class="timeline-card desktop-sun-timeline">
          <div class="timeline-controls-row">
            <div class="playback-btns">
              <button class="btn-play-pause" id="btnPlayPause" title="Start/Pause tidsanimation">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </button>
              <button class="btn-speed-badge" id="btnSpeedToggle">1x</button>
            </div>

            <!-- Hurtige planlægnings-presets -->
            <div class="sun-date-presets-scroll" id="sunDatePresets" style="flex:1;margin:0 8px;">
              <button class="sun-preset-pill active" data-preset="today">I dag</button>
              <button class="sun-preset-pill" data-preset="tomorrow">I morgen</button>
              <button class="sun-preset-pill" data-preset="week">+7 dage</button>
              <button class="sun-preset-pill" data-preset="summer-solstice">☀️ Sommersolhverv</button>
              <button class="sun-preset-pill" data-preset="winter-solstice">❄️ Vintersolhverv</button>
            </div>

            <button class="fs-btn" id="btnJumpNow" style="padding: 4px 10px; font-size: 11px; min-height: 28px;">
              Nu
            </button>
          </div>

          <div class="fs-slider-wrap" style="margin-bottom:6px;">
            <input type="range" id="sunTimeSlider" min="0" max="1439" step="1" value="${t}">
          </div>

          <!-- Hurtige spring til solopgang, gylden time, solmiddag, solnedgang -->
          <div class="sun-jump-scroll" id="sunQuickJumps"></div>
        </div>

        <!-- 4. MOTIVHØJDE & FOTOGRAFISK LYS-TIP -->
        <div class="fs-card" style="margin-bottom:0;">
          <div class="fs-card-header" style="margin-bottom:8px;">
            <span class="fs-card-title">Motiv & Skyggemodel</span>
            <span class="fs-badge" id="subjectHeightBadge">${this.subjectHeight.toFixed(2).replace(".",",")} m</span>
          </div>

          <div class="subject-selector-row" style="grid-template-columns: repeat(4, 1fr);">
            <button class="subject-btn ${this.subjectType==="person"?"active":""}" data-subject="person" data-height="1.75">
              <span class="subject-icon">👤</span>
              <span class="subject-name">Person (1,75m)</span>
            </button>
            <button class="subject-btn ${this.subjectType==="tree"?"active":""}" data-subject="tree" data-height="5.0">
              <span class="subject-icon">🌳</span>
              <span class="subject-name">Træ (5m)</span>
            </button>
            <button class="subject-btn ${this.subjectType==="building"?"active":""}" data-subject="building" data-height="12.0">
              <span class="subject-icon">🏢</span>
              <span class="subject-name">Bygning (12m)</span>
            </button>
            <button class="subject-btn ${this.subjectType==="custom"?"active":""}" data-subject="custom" data-height="${this.subjectHeight}">
              <span class="subject-icon">📏</span>
              <span class="subject-name">Valgfri</span>
            </button>
          </div>

          <div class="fs-slider-wrap" id="customHeightWrap" style="margin-top: 10px; display: ${this.subjectType==="custom"?"flex":"none"};">
            <div class="fs-slider-header">
              <span class="fs-slider-label">Brugerdefineret højde</span>
              <span class="fs-slider-val" id="customHeightDisplay">${this.subjectHeight.toFixed(1).replace(".",",")} m</span>
            </div>
            <input type="range" id="customHeightSlider" min="0.5" max="50" step="0.25" value="${this.subjectHeight}">
          </div>

          <p id="sunShadowTip" style="font-size: 12px; color: var(--text-muted); line-height: 1.4; margin-top: 10px;"></p>
        </div>
      </div>
    `}initSimulator(){const t=this.container.querySelector("#sunCanvas");t&&(this.simulator=new Gt(t,{mode:this.canvasSubMode,subjectType:this.subjectType,subjectHeight:this.subjectHeight}))}async initMap(){const t=this.container.querySelector("#sunMapContainer");t&&(this.mapView=new Wt(t,{onLocationChange:async(e,s)=>{let i=`Kortpunkt (${e.toFixed(3)}°N, ${s.toFixed(3)}°Ø)`;C.setLocation({lat:e,lng:s,name:i,source:"search"});try{const a=await C.reverseGeocode(e,s);a?.name&&C.setLocation({lat:e,lng:s,name:a.name,sub:a.sub,source:"search"})}catch{}}}),await this.mapView.init(this.currentLocation.lat,this.currentLocation.lng))}attachEventListeners(){const t=this.container.querySelector("#sunDualViewport"),e=this.container.querySelector("#cameraPresetsWrap"),s=this.container.querySelector("#sunCanvasTag");this.container.querySelectorAll("[data-layout]").forEach(r=>{r.addEventListener("click",()=>{const n=r.dataset.layout;this.viewLayout=n,this.container.querySelectorAll("[data-layout]").forEach(d=>{d.classList.toggle("active",d.dataset.layout===n)}),t.className=`desktop-dual-viewport layout-${n}`,n==="compass"?(this.canvasSubMode="compass",this.simulator?.setMode("compass"),s&&(s.textContent="🧭 2D Top-down Solur & Kompas"),e&&(e.style.display="none")):(this.canvasSubMode="3d",this.simulator?.setMode("3d"),s&&(s.textContent="🎥 3D Søger (træk for at rotere)"),e&&(e.style.display=n==="map"?"none":"flex")),setTimeout(()=>{this.mapView?.invalidateSize(),this.simulator?.render()},60)})}),this.container.querySelectorAll("[data-cam]").forEach(r=>{r.addEventListener("click",()=>{const n=r.dataset.cam;this.simulator?.resetCamera(n)})}),this.container.querySelectorAll("[data-preset]").forEach(r=>{r.addEventListener("click",()=>{this.pausePlayback();const n=r.dataset.preset,d=new Date;let h=new Date(this.currentDate);switch(n){case"today":h=new Date;break;case"tomorrow":h=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1);break;case"week":h=new Date(this.currentDate.getFullYear(),this.currentDate.getMonth(),this.currentDate.getDate()+7);break;case"summer-solstice":h=f.getNextSolsticeOrEquinox("summer-solstice",d);break;case"winter-solstice":h=f.getNextSolsticeOrEquinox("winter-solstice",d);break}h.setHours(this.currentDate.getHours(),this.currentDate.getMinutes(),0,0),this.broadcastDateChange(h)})});const i=this.container.querySelector("#sunTimeSlider");i?.addEventListener("input",()=>{this.pausePlayback();const r=Number(i.value),n=new Date(this.currentDate);n.setHours(Math.floor(r/60),r%60,0,0),this.broadcastDateChange(n)}),this.container.querySelector("#btnPlayPause")?.addEventListener("click",()=>{this.isPlaying?this.pausePlayback():this.startPlayback()});const a=this.container.querySelector("#btnSpeedToggle");a?.addEventListener("click",()=>{this.playSpeed=this.playSpeed===1?2:this.playSpeed===2?4:1,a&&(a.textContent=`${this.playSpeed}x`),this.isPlaying&&(this.pausePlayback(),this.startPlayback())}),this.container.querySelector("#btnJumpNow")?.addEventListener("click",()=>{this.pausePlayback(),f.setTimeToNow()});const o=this.container.querySelector("#customHeightWrap"),l=this.container.querySelector("#customHeightSlider"),c=this.container.querySelector("#customHeightDisplay");this.container.querySelectorAll("[data-subject]").forEach(r=>{r.addEventListener("click",()=>{const n=r,d=n.dataset.subject;this.subjectType=d,d!=="custom"&&(this.subjectHeight=Number(n.dataset.height),l&&(l.value=String(this.subjectHeight))),o&&(o.style.display=d==="custom"?"flex":"none"),this.container.querySelectorAll("[data-subject]").forEach(u=>u.classList.remove("active")),n.classList.add("active");const h=this.container.querySelector("#subjectHeightBadge");h&&(h.textContent=`${this.subjectHeight.toFixed(2).replace(".",",")} m`),c&&(c.textContent=`${this.subjectHeight.toFixed(1).replace(".",",")} m`),this.simulator?.setSubjectType(d,this.subjectHeight),this.updateCalculations()})}),l?.addEventListener("input",()=>{const r=Number(l.value);this.subjectHeight=r;const n=this.container.querySelector("#subjectHeightBadge");n&&(n.textContent=`${r.toFixed(2).replace(".",",")} m`),c&&(c.textContent=`${r.toFixed(2).replace(".",",")} m`),this.simulator?.setSubjectType(this.subjectType,r),this.updateCalculations()})}broadcastDateChange(t){this.currentDate=t,this.isInternalTimeChange=!0,f.setDate(t),this.isInternalTimeChange=!1,this.updateCalculations()}startPlayback(){this.isPlaying=!0;const t=this.container.querySelector("#btnPlayPause");t&&(t.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>');const e=Math.max(25,Math.floor(100/this.playSpeed));this.playIntervalId=setInterval(()=>{const s=new Date(this.currentDate.getTime()+12e4),i=s.getHours()*60+s.getMinutes(),a=this.container.querySelector("#sunTimeSlider");a&&(a.value=String(i)),this.broadcastDateChange(s)},e)}pausePlayback(){this.isPlaying=!1,this.playIntervalId&&(clearInterval(this.playIntervalId),this.playIntervalId=null);const t=this.container.querySelector("#btnPlayPause");t&&(t.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>')}updateCalculations(){const t=this.currentLocation.lat,e=this.currentLocation.lng,s=F.getSunPosition(this.currentDate,t,e),i=F.getSunTimes(this.currentDate,t,e),a=F.calculateShadow(s.altitude,s.azimuth,this.subjectHeight),o=F.getEstimatedKelvin(s.altitude),l=this.container.querySelector("#sunTimeDisplay"),c=this.container.querySelector("#sunDateDisplay"),r=this.container.querySelector("#sunAltitudeVal"),n=this.container.querySelector("#sunAzimuthVal"),d=this.container.querySelector("#sunShadowLengthVal"),h=this.container.querySelector("#sunKelvinDisplay"),u=this.container.querySelector("#sunLightPhaseBadge"),m=this.container.querySelector("#sunShadowTip");if(l&&(l.textContent=f.formatTime(this.currentDate)),c){const p=f.formatRelativeDay(this.currentDate);c.textContent=`${f.formatShortDate(this.currentDate)} (${p})`}r&&(r.textContent=`${s.altitude>=0?"+":""}${s.altitude.toFixed(1)}°`),n&&(n.textContent=`${s.azimuth.toFixed(0)}° ${F.getCompassDirection(s.azimuth)}`),d&&(d.textContent=a.hasDirectShadow?`${a.shadowLength.toFixed(1).replace(".",",")} m`:"Ingen (Diffust)"),h&&(h.textContent=`${o.kelvin}K`),u&&(u.textContent=a.lightPhase.badge,u.setAttribute("style",`background: ${a.lightPhase.color}33; color: ${a.lightPhase.color};`)),m&&(m.textContent=`${a.description} ${a.cameraTip}`),this.simulator?.update(s.altitude,s.azimuth,this.subjectHeight,{subjectType:this.subjectType,sunTimes:i,lat:t,lng:e}),this.mapView&&this.mapView.update(t,e,s.altitude,s.azimuth,a.shadowAzimuth,a.shadowLength),this.renderQuickJumps(i)}renderQuickJumps(t){const e=this.container.querySelector("#sunQuickJumps");if(!e)return;const s=[{name:"Blå time (morgen)",time:t.blueHourMorning?.start},{name:"Solopgang",time:t.sunrise},{name:"Gylden slut",time:t.goldenHourMorning?.end},{name:"Solmiddag",time:t.solarNoon},{name:"Gylden start",time:t.goldenHourEvening?.start},{name:"Solnedgang",time:t.sunset},{name:"Blå time (aften)",time:t.blueHourEvening?.end}].filter(i=>i.time!==null&&i.time!==void 0);e.innerHTML=s.map(i=>`
      <button class="sun-jump-btn" data-time="${i.time.getTime()}">
        <span class="jump-time">${f.formatTime(i.time)}</span>
        <span class="jump-name">${i.name}</span>
      </button>
    `).join(""),e.querySelectorAll("[data-time]").forEach(i=>{i.addEventListener("click",()=>{this.pausePlayback();const a=Number(i.dataset.time),o=new Date(a),l=o.getHours()*60+o.getMinutes(),c=this.container.querySelector("#sunTimeSlider");c&&(c.value=String(l)),this.broadcastDateChange(o)})})}}const Ut="photoweather_cache_v2_";class Y{static async fetchForecast(t,e,s=!1){const i=`${Ut}${t.toFixed(4)}_${e.toFixed(4)}`;let a=null;try{const c=localStorage.getItem(i);c&&(a=JSON.parse(c))}catch(c){console.warn("Kunne ikke læse vejr-cache:",c)}const o=Date.now();if(!s&&a&&a.timestamp&&o-a.timestamp<1e3*60*60*2)return{forecast:a.data,isCached:!0,updatedAt:new Date(a.timestamp)};const l=`https://api.open-meteo.com/v1/forecast?latitude=${t.toFixed(4)}&longitude=${e.toFixed(4)}&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&wind_speed_unit=ms&timezone=auto`;try{const c=await fetch(l);if(!c.ok)throw new Error(`Open-Meteo svarede med status ${c.status}`);const r=await c.json();try{localStorage.setItem(i,JSON.stringify({timestamp:o,data:r}))}catch(n){console.warn("Kunne ikke gemme vejr i localStorage:",n)}return{forecast:r,isCached:!1,updatedAt:new Date(o)}}catch(c){if(a&&a.data)return{forecast:a.data,isCached:!0,updatedAt:new Date(a.timestamp)};throw c}}static parseDayData(t,e,s,i){if(!t?.hourly?.time||!t?.daily?.time)return null;const a=t.daily.time[e];if(!a)return null;const o=a.split("-"),l=new Date(Number(o[0]),Number(o[1])-1,Number(o[2]),12,0,0),c=F.getSunTimes(l,s,i),r=F.getMoonIllumination(l),n=F.getMoonTimes(l,s,i),d=t.hourly.time,h=[],u=[],m=`${a}T`,p=t.daily.time[e+1],g=p?`${p}T`:null,v=(k,T)=>{const O=Number(T.substring(11,13)),j=t.hourly.temperature_2m[k],G=t.hourly.dew_point_2m[k],D=t.hourly.weather_code[k],A=this.getWeatherCodeDescription(D);return{time:T,hour:O,temp:j,apparentTemp:t.hourly.apparent_temperature[k],humidity:t.hourly.relative_humidity_2m[k],dewPoint:G,spread:+(j-G).toFixed(1),precipProb:t.hourly.precipitation_probability[k],precipMm:t.hourly.precipitation[k],weatherCode:D,weatherDesc:A.desc,weatherIcon:A.icon,cloudTotal:t.hourly.cloud_cover[k],cloudLow:t.hourly.cloud_cover_low[k],cloudMid:t.hourly.cloud_cover_mid[k],cloudHigh:t.hourly.cloud_cover_high[k],visibility:t.hourly.visibility[k],windSpeed:t.hourly.wind_speed_10m[k],windDir:t.hourly.wind_direction_10m[k],windGusts:t.hourly.wind_gusts_10m[k]}};for(let k=0;k<d.length;k++){const T=d[k];T.startsWith(m)?h.push(v(k,T)):g&&T.startsWith(g)&&Number(T.substring(11,13))<=4&&u.push(v(k,T))}const y=this.calculateFogRisk(h,c),x=this.calculateGoldenHourQuality(h,c.goldenHourMorning,c.sunrise),b=this.calculateGoldenHourQuality(h,c.goldenHourEvening,c.sunset),w=this.calculateAstroScore(h,c,r,s,i,l,u);return{date:l,dayIndex:e,dateStr:a,dayName:["Søndag","Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag"][l.getDay()],maxTemp:t.daily.temperature_2m_max[e],minTemp:t.daily.temperature_2m_min[e],weatherCode:t.daily.weather_code[e],weatherDesc:this.getWeatherCodeDescription(t.daily.weather_code[e]).desc,sun:c,moon:r,moonTimes:n,fog:y,goldenHourMorning:x,goldenHourEvening:b,astro:w,hourly:h}}static calculateFogRisk(t,e){if(!t||t.length===0)return{score:0,level:"Ukendt",text:"Ingen vejrdata tilgængelig",icon:"❓",classType:"low"};const s=e.sunrise?e.sunrise.getHours():6,i=Math.max(0,s-3),a=Math.min(23,s+1),o=t.filter(y=>y.hour>=i&&y.hour<=a);if(o.length===0)return{score:10,level:"Lav",text:"Lav tågerisiko",icon:"☀️",classType:"low"};let l=0,c=0,r=0,n=99999,d=!1;o.forEach(y=>{l+=y.spread,c+=y.humidity,r+=y.windSpeed,y.visibility<n&&(n=y.visibility),(y.weatherCode===45||y.weatherCode===48)&&(d=!0)}),l/=o.length,c/=o.length,r/=o.length;let h=0;l<=.5?h+=40:l<=1.2?h+=32:l<=2.2?h+=20:l<=3.5&&(h+=10),c>=96?h+=30:c>=92?h+=24:c>=88?h+=16:c>=80&&(h+=8),r<=2?h+=20:r<=3.5?h+=14:r<=5?h+=6:h-=15,d||n<=1e3?h+=20:n<=4e3&&(h+=12);const u=Math.min(100,Math.max(0,h));let m="Lav",p="Lav tågerisiko – klar morgensigt",g="☀️",v="low";return u>=75?(m="Meget høj",p="Perfekte tågebetingelser! Tæt morgentåge forventes i lavninger og ved søer",g="🌫️",v="high"):u>=55?(m="Høj",p="Gode chancer for stemningsfuld morgendis og jordtåge",g="🌫️",v="high"):u>=35&&(m="Moderat",p="Mulighed for let dis over enge og vand tidligt om morgenen",g="🌁",v="moderate"),{score:u,level:m,text:p,icon:g,classType:v,avgSpread:l.toFixed(1),avgHumidity:Math.round(c),avgWind:r.toFixed(1),minVisibilityKm:(n/1e3).toFixed(1)}}static calculateGoldenHourQuality(t,e,s){if(!t||!s)return{score:50,text:"Middel betingelser",cloudsDesc:"Normalt skydække",clouds:{total:50,low:20,mid:20,high:20}};const i=s.getHours(),a=t.find(u=>u.hour===i)||t[i]||t[0],o=a.cloudTotal,l=a.cloudLow,c=a.cloudMid,r=a.cloudHigh;let n=50,d="Pænt lys",h="☀️";return l>=70||o>=85&&l+c>=80?(n=20,d="Tungt lavt skydække blokerer for direkte sollys og gylden glød",h="☁️"):o>=75?(n=35,d="Overvejende overskyet – diffust og dæmpet lys ved horisonten",h="☁️"):o<=15?(n=85,d="Klar himmel – rent gyldent lys og skarpe lange skygger",h="🌅"):l<=30&&c+r>=30&&c+r<=75?(n=95,d="Fremragende! Høje og mellemskyer kan skabe en flammende farverig himmel",h="🔥"):o<=50?(n=75,d="Gode forhold med dynamiske lysstriber gennem spredte skyer",h="🌤️"):(n=45,d="Vekslende skydække med diffuse lysforhold",h="⛅"),{score:n,text:d,icon:h,clouds:{total:o,low:l,mid:c,high:r}}}static calculateAstroScore(t,e,s,i,a,o,l){const c=e.astronomicalDusk&&e.astronomicalDawn;let r;l&&l.length>0?r=[...t.filter(b=>b.hour>=22),...l.filter(b=>b.hour<=4)]:r=t.filter(b=>b.hour>=22||b.hour<=4),r.length===0&&(r=t.slice(0,4));let n=0,d=0;r.forEach(b=>{n+=b.cloudTotal,d+=b.cloudLow}),n/=r.length,d/=r.length;const h=Math.round(n);let u=0;r.forEach(b=>{const w=new Date(o.getFullYear(),o.getMonth(),o.getDate()+(b.hour<=4?1:0),b.hour,0,0);try{const L=F.getMoonPosition(w,i,a);L&&L.altitude>0&&u++}catch{}});let m=100;h<=10?m-=h*.5:h<=30?m-=5+(h-10)*1:h<=60?m-=25+(h-30)*1.5:m-=70+(h-60)*.7,m-=d*.25;let p="";u===0?p="Månen er under horisonten hele natten (ingen måneforstyrrelse)":s.fraction<=15?p=`Nymåne / ultrasvagt segl (${s.fraction}%) – intet generende måneskin`:s.fraction<=45?(m-=Math.round(s.fraction/100*15),p=`Svag månefase (${s.fraction}%) – kun moderat lyspåvirkning`):(m-=Math.round(s.fraction/100*35),p=`Kraftigt måneskin (${s.fraction}%) oplyser natten og udvisker svage stjerner`),c||(m=Math.min(m,50),p+=" • Bemærk: Lyse nætter forhindrer kulsort astronomisk mørke");const g=Math.min(100,Math.max(0,Math.round(m)));let v="Ugunstig",y="☁️",x="";return h>=75?(v="Ugunstig",y="☁️",x=`Tæt skydække (${h}%) dækker himlen i nat.`):h>=50?(v="Svag",y="⛅",x=`Overvejende skyet (${h}%). Kun spredte kighuller til enkelte klare stjerner.`):h>=25?(v="Moderat",y="✨",x=`Gode observationsforhold med lette slørskyer (${h}%).`):(v="Fremragende",y="🌌",x=`Krystalklar nattehimmel (${h}% skyer)! Perfekte forhold for Mælkevejen og stjernebaner.`),{score:g,status:v,icon:y,text:x,roundClouds:h,moonImpact:p}}static getWeatherCodeDescription(t){switch(t){case 0:return{desc:"Klar himmel / Skyfrit",icon:"☀️"};case 1:return{desc:"Hovedsageligt klart",icon:"🌤️"};case 2:return{desc:"Delvist skyet",icon:"⛅"};case 3:return{desc:"Overskyet",icon:"☁️"};case 45:return{desc:"Tåge",icon:"🌫️"};case 48:return{desc:"Rimtåge",icon:"🌫️"};case 51:return{desc:"Let støvregn",icon:"🌦️"};case 53:return{desc:"Moderat støvregn",icon:"🌧️"};case 55:return{desc:"Tæt støvregn",icon:"🌧️"};case 61:return{desc:"Let regn",icon:"🌦️"};case 63:return{desc:"Moderat regn",icon:"🌧️"};case 65:return{desc:"Kraftig regn",icon:"🌧️"};case 71:return{desc:"Let snefald",icon:"🌨️"};case 73:return{desc:"Moderat snefald",icon:"❄️"};case 75:return{desc:"Kraftigt snefald",icon:"❄️"};case 80:return{desc:"Lette regnbyger",icon:"🌦️"};case 81:return{desc:"Moderate regnbyger",icon:"🌧️"};case 82:return{desc:"Voldsomme regnbyger",icon:"⛈️"};case 95:return{desc:"Tordenvejr",icon:"⛈️"};default:return{desc:"Vekslende vejr",icon:"🌤️"}}}static getEventTiming(t,e,s,i,a,o=50,l){const c=l||f.getDate()||new Date,r=["Søndag","Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag"],n=typeof o=="number"?o:50;if(s===0){if(t&&e&&c>=t&&c<=e){const m=e.getTime()-c.getTime(),p=f.formatDuration(m);let g="banner-active",v="🟢",y="Aktiv nu",x=`Aktiv lige nu • Slutter om ${p}`,b=`Aktiv lige nu (slutter kl. ${f.formatTime(e)})`;return a==="astro"?n>=65?(g="banner-active",v="✨",y="Aktiv nu",x=`Gode stjerneforhold nu • Slutter om ${p}`,b=`Astronomisk nat aktiv lige nu (slutter kl. ${f.formatTime(e)})`):n>=40?(g="banner-active-moderate",v="⛅",y="Moderat nu",x=`Astronomisk nat aktiv • Vekslende skydække (slutter om ${p})`,b=`Mørke i gang (kl. ${f.formatTime(e)}) • Skiftende skyer`):(g="banner-active-poor",v="☁️",y="Overskyet nu",x=`Astronomisk nat er i gang • Desværre overskyet (slutter om ${p})`,b=`Mørke i gang (kl. ${f.formatTime(e)}) • Dækket af skyer`):a==="fog"?n>=55?(g="banner-active",v="🌫️",y="Aktiv nu",x=`Tågevindue aktivt nu • Gode tågebetingelser (slutter om ${p})`,b=`Tågevindue aktivt lige nu (slutter kl. ${f.formatTime(e)})`):n>=35?(g="banner-active-moderate",v="🌁",y="Moderat nu",x=`Tidsvindue aktivt • Mulighed for let morgendis (slutter om ${p})`,b=`Tidsvindue aktivt (slutter kl. ${f.formatTime(e)})`):(g="banner-active-poor",v="☀️",y="Klar sigt",x=`Morgentime i gang • Lav tågerisiko / klar luft (slutter om ${p})`,b=`Morgenstund i gang (slutter kl. ${f.formatTime(e)}) • Ingen tåge`):a==="morning"?n>=65?(g="banner-active",v="🌅",y="Aktiv nu",x=`Gylden time aktiv lige nu • Flot morgenlys (slutter om ${p})`,b=`Daggry i gang nu (slutter kl. ${f.formatTime(e)})`):n>=40?(g="banner-active-moderate",v="🌤️",y="Vekslende nu",x=`Morgenlys aktivt nu • Vekslende skydække (slutter om ${p})`,b=`Morgenlys i gang (slutter kl. ${f.formatTime(e)})`):(g="banner-active-poor",v="☁️",y="Overskyet nu",x=`Morgentime i gang • Solen skjult af skydække (slutter om ${p})`,b="Morgenlys i gang, men dækket af skyer"):a==="evening"&&(n>=65?(g="banner-active",v="🌆",y="Aktiv nu",x=`Solnedgang aktiv lige nu • Smukt aftenlys (slutter om ${p})`,b=`Aktiv solnedgang lige nu (slutter kl. ${f.formatTime(e)})`):n>=40?(g="banner-active-moderate",v="🌤️",y="Moderat nu",x=`Aftenlys i gang • Vekslende skydække (slutter om ${p})`,b=`Solnedgang i gang (slutter kl. ${f.formatTime(e)})`):(g="banner-active-poor",v="☁️",y="Overskyet nu",x=`Solnedgang i gang • Skjult bag tungt skydække (slutter om ${p})`,b="Solnedgang i gang, men skjult bag skyer")),{status:"active",bannerClass:g,icon:v,pill:y,label:x,sub:b,isPassed:!1}}if(e&&c>e){const m=c.getTime()-e.getTime(),p=f.formatDuration(m);let g=`I morges • For ${p} siden`,v=`Afsluttet i morges (for ${p} siden)`;return a==="evening"?(g=`I aften • For ${p} siden`,v=`Afsluttet i aften kl. ${f.formatTime(e)}`):a==="astro"&&(g="Natten er ovre",v=`Astronomisk nat afsluttet kl. ${f.formatTime(e)}`),{status:"passed",bannerClass:"banner-passed",icon:"⏳",pill:"Passeret",label:g,sub:v,isPassed:!0}}if(t&&c<t){const m=t.getTime()-c.getTime(),p=f.formatDuration(m);let g=`I dag • Om ${p}`,v=`Starter kl. ${f.formatTime(t)} (om ${p})`;return a==="evening"?(g=n>=65?`I aften • Om ${p} (flot aftenlys)`:`I aften • Om ${p}`,v=`Starter i aften kl. ${f.formatTime(t)} (om ${p})`):a==="astro"?(g=n>=65?`I aften/nat • Om ${p} (klare stjerneforhold)`:n<=35?`I aften/nat • Om ${p} (forventet overskyet)`:`I aften/nat • Om ${p}`,v=`Astronomisk nat starter kl. ${f.formatTime(t)} (om ${p})`):(a==="fog"||a==="morning")&&(g=`I dag ved daggry • Om ${p}`),{status:"upcoming",bannerClass:"banner-upcoming",icon:"⏱️",pill:"Kommende",label:g,sub:v,isPassed:!1}}}if(s===1){const m=t?Math.max(0,t.getTime()-c.getTime()):0,p=f.formatDuration(m);let g=`I morgen • Om ${p}`,v=`I morgen kl. ${t?f.formatTime(t):"--:--"}`;return a==="fog"||a==="morning"?(g=`I morgen tidlig • Om ${p}`,v=`I morgen kl. ${f.formatTime(t)} (om ${p})`):a==="evening"?(g=`I morgen aften • Om ${p}`,v=`I morgen kl. ${f.formatTime(t)} (om ${p})`):a==="astro"&&(g=`I morgen nat • Om ${p}`,v=`I morgen nat fra kl. ${f.formatTime(t)}`),{status:"future",bannerClass:"banner-future",icon:"📅",pill:"I morgen",label:g,sub:v,isPassed:!1}}const d=r[i.getDay()];let h=`${d} • Om ${s} dage`,u=`${d}`;return a==="fog"||a==="morning"?(h=`${d} morgen • Om ${s} dage`,u=`${d} kl. ${t?f.formatTime(t):"06:00"}`):a==="evening"?(h=`${d} aften • Om ${s} dage`,u=`${d} kl. ${t?f.formatTime(t):"18:00"}`):a==="astro"&&(h=`${d} nat • Om ${s} dage`,u=`${d} nat`),{status:"future-distant",bannerClass:"banner-future",icon:"📅",pill:d,label:h,sub:u,isPassed:!1}}}class Xt{container;currentLocation=C.getLocation();selectedDayIndex=0;forecastData=null;parsedDays=[];isCachedForecast=!1;cacheUpdatedAt=null;isLoading=!1;unsubLocation=null;unsubTime=null;async mount(t){this.container=t,this.currentLocation=C.getLocation(),this.render(),this.attachEventListeners(),await this.loadWeather(),this.unsubLocation=C.subscribe(async e=>{this.currentLocation=e,await this.loadWeather(!1)}),this.unsubTime=f.subscribe(e=>{this.syncDayWithMasterDate(e),this.broadcastCloudCoverForTime(e)})}onActivate(){this.renderSelectedDay()}render(){this.container.innerHTML=`
      <div class="weather-container desktop-weather-panel">
        <!-- OFFLINE STATUS BANNER -->
        <div class="weather-status-banner" id="weatherStatusBanner">
          <span id="weatherStatusText">Offline tilstand – gemt vejrudsigt</span>
          <span id="weatherStatusTime" style="font-family: var(--font-mono); font-weight: 700;"></span>
        </div>

        <!-- 7 DAGES VÆLGER + OPDATER KNAP -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <div class="days-scroll-wrap" id="weatherDaysScroll" style="flex:1;">
            <div style="color: var(--text-dim); font-size: 13px; padding: 10px;">Henter 7-døgns vejrudsigt...</div>
          </div>
          <button class="fs-btn" id="btnWeatherRefresh" style="padding: 6px 10px; font-size: 11px; min-height: 32px; white-space: nowrap;" title="Hent frisk vejrudsigt fra Open-Meteo">
            🔄 Opdater
          </button>
        </div>

        <!-- INDHOLD FOR DEN VALGTE DAG -->
        <div id="weatherSelectedDayWrap"></div>
      </div>
    `}attachEventListeners(){this.container.querySelector("#btnWeatherRefresh")?.addEventListener("click",()=>{this.loadWeather(!0)})}syncDayWithMasterDate(t){if(this.parsedDays.length===0)return;const e=this.parsedDays.findIndex(s=>s.date.getFullYear()===t.getFullYear()&&s.date.getMonth()===t.getMonth()&&s.date.getDate()===t.getDate());if(e!==-1&&e!==this.selectedDayIndex){this.selectedDayIndex=e;const s=this.container.querySelector("#weatherDaysScroll");s&&(s.querySelectorAll(".day-tab-card").forEach(i=>i.classList.remove("active")),s.querySelector(`[data-day="${this.selectedDayIndex}"]`)?.classList.add("active")),this.renderSelectedDay()}else this.highlightActiveHourOnTable(t.getHours())}highlightActiveHourOnTable(t){this.container.querySelectorAll(".hourly-col[data-hour]").forEach(e=>{const s=Number(e.dataset.hour);e.classList.toggle("hourly-master-selected",s===t)})}broadcastCloudCoverForTime(t){const e=this.parsedDays[this.selectedDayIndex];if(!e||!e.hourly)return;const s=e.hourly.find(i=>i.hour===t.getHours());s&&M.setCloudCoverForCurrentTime(s.cloudTotal)}async loadWeather(t=!1){if(!this.isLoading){this.isLoading=!0;try{const e=await Y.fetchForecast(this.currentLocation.lat,this.currentLocation.lng,t);this.forecastData=e.forecast,this.isCachedForecast=e.isCached,this.cacheUpdatedAt=e.updatedAt,this.parsedDays=[];for(let s=0;s<7;s++){const i=Y.parseDayData(this.forecastData,s,this.currentLocation.lat,this.currentLocation.lng);i&&this.parsedDays.push(i)}this.renderDaysScroll(),this.renderSelectedDay(),this.renderStatusBanner(),this.broadcastCloudCoverForTime(f.getDate())}catch(e){console.error("Fejl ved indlæsning af vejr:",e);const s=this.container.querySelector("#weatherSelectedDayWrap");s&&(s.innerHTML=`
          <div class="fs-card" style="border-color:var(--accent-danger);">
            <h4 style="color:var(--accent-danger);margin-bottom:6px;">Kunne ikke hente vejrdata</h4>
            <p style="color:var(--text-muted);font-size:13px;">${e.message||"Tjek din internetforbindelse"}</p>
          </div>
        `)}finally{this.isLoading=!1}}}renderStatusBanner(){const t=this.container.querySelector("#weatherStatusBanner"),e=this.container.querySelector("#weatherStatusTime");t&&(this.isCachedForecast&&this.cacheUpdatedAt?(t.classList.add("active"),e&&(e.textContent=`Hentet kl. ${f.formatTime(this.cacheUpdatedAt)}`)):t.classList.remove("active"))}selectDay(t){this.selectedDayIndex=Math.min(6,Math.max(0,t));const e=this.container.querySelector("#weatherDaysScroll");e&&(e.querySelectorAll(".day-tab-card").forEach(i=>i.classList.remove("active")),e.querySelector(`[data-day="${this.selectedDayIndex}"]`)?.classList.add("active"));const s=this.parsedDays[this.selectedDayIndex];if(s){const i=f.getDate(),a=new Date(s.date);a.setHours(i.getHours(),i.getMinutes(),0,0),f.setDate(a)}this.renderSelectedDay()}renderDaysScroll(){const t=this.container.querySelector("#weatherDaysScroll");!t||this.parsedDays.length===0||(t.innerHTML=this.parsedDays.map((e,s)=>{const a=s===0?"I dag":e.dayName.substring(0,3),o=Y.getWeatherCodeDescription(e.weatherCode);return`
        <div class="day-tab-card ${s===this.selectedDayIndex?"active":""}" data-day="${s}">
          <span class="day-name">${a}</span>
          <span class="day-date">${e.date.getDate()}</span>
          <span class="day-icon">${o.icon}</span>
          <span class="day-temp-range">${Math.round(e.minTemp)}° / ${Math.round(e.maxTemp)}°</span>
        </div>
      `}).join(""),t.querySelectorAll("[data-day]").forEach(e=>{e.addEventListener("click",()=>{const s=Number(e.dataset.day);this.selectDay(s)})}))}renderSelectedDay(){const t=this.container.querySelector("#weatherSelectedDayWrap");if(!t||!this.parsedDays[this.selectedDayIndex])return;const e=this.parsedDays[this.selectedDayIndex],s=e.sun,i=e.moon,a=e.fog,o=e.goldenHourMorning,l=e.goldenHourEvening,c=e.astro,r=new Date,n=f.getDate(),d=this.selectedDayIndex===0;this.selectedDayIndex;const h=s.civilDawn||(s.sunrise?new Date(s.sunrise.getTime()-45*60*1e3):null),u=s.sunriseEnd||(s.sunrise?new Date(s.sunrise.getTime()+65*60*1e3):null),m=Y.getEventTiming(h,u,this.selectedDayIndex,e.date,"fog",a.score,r),p=s.blueHourMorning&&s.blueHourMorning.start||(s.sunrise?new Date(s.sunrise.getTime()-50*60*1e3):null),g=s.goldenHourMorning&&s.goldenHourMorning.end||(s.sunrise?new Date(s.sunrise.getTime()+45*60*1e3):null),v=Y.getEventTiming(p,g,this.selectedDayIndex,e.date,"morning",o.score,r),y=s.goldenHourEvening&&s.goldenHourEvening.start||(s.sunset?new Date(s.sunset.getTime()-45*60*1e3):null),x=s.blueHourEvening&&s.blueHourEvening.end||(s.sunset?new Date(s.sunset.getTime()+45*60*1e3):null),b=Y.getEventTiming(y,x,this.selectedDayIndex,e.date,"evening",l.score,r);let w=null,L=null;s.astronomicalDusk&&(d&&s.astronomicalDawn&&r<s.astronomicalDawn?(w=new Date(s.astronomicalDusk.getTime()-24*60*60*1e3),L=s.astronomicalDawn):(w=s.astronomicalDusk,L=s.astronomicalDawn?new Date(s.astronomicalDawn.getTime()+24*60*60*1e3):new Date(w.getTime()+9*60*60*1e3)));const k=Y.getEventTiming(w,L,this.selectedDayIndex,e.date,"astro",c.score,r),T=D=>D>=70?"score-high":D>=40?"score-moderate":"score-low",O=D=>`
      <div class="card-timing-banner ${D.bannerClass}">
        <div class="timing-banner-left">
          <span class="timing-icon">${D.icon}</span>
          <span class="timing-label">${D.label}</span>
        </div>
        <span class="timing-banner-pill">${D.pill}</span>
      </div>
    `,j=r.getHours(),G=n.getHours();t.innerHTML=`
      <!-- ASTRONOMISK OVERBLIK (SOL & MÅNE) -->
      <div class="astro-overview-grid" style="margin-top:8px;">
        <div class="astro-sub-card">
          <div class="astro-sub-title"><span>☀️</span> Soltider (${e.dayName})</div>
          <div class="astro-sub-val tabular-nums">${f.formatTime(s.sunrise)} / ${f.formatTime(s.sunset)}</div>
          <div class="astro-sub-detail">Solopgang • Solnedgang</div>
          <div class="astro-sub-detail" style="color:var(--golden-primary);">Gylden aften: ${f.formatTime(s.goldenHourEvening?.start)} - ${f.formatTime(s.sunset)}</div>
        </div>

        <div class="astro-sub-card">
          <div class="astro-sub-title"><span>${i.icon}</span> Måne</div>
          <div class="astro-sub-val tabular-nums">${i.fraction}% • ${i.name}</div>
          <div class="astro-sub-detail">Op: ${f.formatTime(e.moonTimes?.rise)} • Ned: ${f.formatTime(e.moonTimes?.set)}</div>
          <div class="astro-sub-detail" style="color:var(--accent-weather);">Astro nat: ${s.nightSky?.start?`${f.formatTime(s.nightSky.start)} - ${f.formatTime(s.nightSky.end)}`:"Lyse nætter"}</div>
        </div>
      </div>

      <!-- FOTOGRAFISKE ANALYSE-KORT (2x2 Grid på Desktop) -->
      <div class="photo-event-grid desktop-weather-cards" style="margin-top: 10px;">
        <!-- 1. Morgentåge & Dis -->
        <div class="photo-card ${m.isPassed?"card-event-passed":""}">
          ${O(m)}
          <div class="photo-card-top">
            <span class="photo-card-title">${a.icon} Morgentåge & Dis</span>
            <span class="photo-score-badge ${T(a.score)}">${a.score}/100 • ${a.level}</span>
          </div>
          <div class="photo-card-time">
            Tidsvindue: ca. ${f.formatTime(h)} - ${f.formatTime(u)}
          </div>
          <div class="photo-card-desc">${a.text}</div>
          <div class="photo-card-footer">
            <span style="font-size:11px;color:var(--text-dim);">Dugpunkt: Δ${a.avgSpread}°C • Fugt: ${a.avgHumidity}% • Vind: ${a.avgWind} m/s</span>
            <button class="btn-goto-sol" data-time="${(h||s.sunrise||e.date).getTime()}">
              Synk Sol til kl. ${f.formatTime(h||s.sunrise)} →
            </button>
          </div>
        </div>

        <!-- 2. Gylden Time Morgen -->
        <div class="photo-card ${v.isPassed?"card-event-passed":""}">
          ${O(v)}
          <div class="photo-card-top">
            <span class="photo-card-title">${o.icon} Morgenlys (Solopgang)</span>
            <span class="photo-score-badge ${T(o.score)}">${o.score}/100</span>
          </div>
          <div class="photo-card-time">
            Gylden time: ${f.formatTime(s.sunrise)} - ${f.formatTime(s.goldenHourMorning?.end)}
          </div>
          <div class="photo-card-desc">${o.text}</div>
          <div class="photo-card-footer">
            <span style="font-size:11px;color:var(--text-dim);">Skyer: ${o.clouds.total}% (L:${o.clouds.low}% M:${o.clouds.mid}% H:${o.clouds.high}%)</span>
            <button class="btn-goto-sol" data-time="${s.sunrise?s.sunrise.getTime():e.date.getTime()}">
              Synk Sol til Solopgang →
            </button>
          </div>
        </div>

        <!-- 3. Gylden Time Aften & Solnedgang -->
        <div class="photo-card ${b.isPassed?"card-event-passed":""}">
          ${O(b)}
          <div class="photo-card-top">
            <span class="photo-card-title">${l.icon} Aftenlys (Solnedgang)</span>
            <span class="photo-score-badge ${T(l.score)}">${l.score}/100</span>
          </div>
          <div class="photo-card-time">
            Gylden time: ${f.formatTime(s.goldenHourEvening?.start)} - ${f.formatTime(s.sunset)}
          </div>
          <div class="photo-card-desc">${l.text}</div>
          <div class="photo-card-footer">
            <span style="font-size:11px;color:var(--text-dim);">Skyer: ${l.clouds.total}% (L:${l.clouds.low}% M:${l.clouds.mid}% H:${l.clouds.high}%)</span>
            <button class="btn-goto-sol" data-time="${(s.goldenHourEvening?.start||s.sunset||e.date).getTime()}">
              Synk Sol til Aftenlys →
            </button>
          </div>
        </div>

        <!-- 4. Stjernehimmel & Nat (Astro) -->
        <div class="photo-card ${k.isPassed?"card-event-passed":""}">
          ${O(k)}
          <div class="photo-card-top">
            <span class="photo-card-title">${c.icon} Stjernehimmel (Astro)</span>
            <span class="photo-score-badge ${T(c.score)}">${c.score}/100 • ${c.status}</span>
          </div>
          <div class="photo-card-time">
            Astro mørke: ${s.nightSky?.start?`${f.formatTime(s.nightSky.start)} - ${f.formatTime(s.nightSky.end)}`:"Lyse nætter"}
          </div>
          <div class="photo-card-desc">${c.text}</div>
          <div class="photo-card-footer">
            <span style="font-size:11px;color:var(--text-dim);">${c.moonImpact}</span>
            ${s.nightSky?.start?`<button class="btn-goto-sol" data-time="${s.nightSky.start.getTime()}">Synk til Astro-nat →</button>`:""}
          </div>
        </div>
      </div>

      <!-- TIME-FOR-TIME TABEL (Klik på en time synkroniserer Master-Tid!) -->
      <div class="fs-card" style="margin-top: 10px; margin-bottom: 0;">
        <div class="fs-card-header" style="margin-bottom:8px;">
          <span class="fs-card-title">Time-for-time vejrdata <span style="font-size:10px;font-weight:400;color:var(--text-dim);text-transform:none;">(Klik på en time for at synkronisere Sol & Kort)</span></span>
          <span class="fs-badge">${e.dayName}</span>
        </div>
        <div class="hourly-table-wrap">
          <div class="hourly-scroll">
            ${e.hourly.map(D=>{let A="hourly-col",V=`<span class="hour-badge">${String(D.hour).padStart(2,"0")}:00</span>`;return d&&(D.hour<j?A+=" hourly-past-hour":D.hour===j&&(A+=" hourly-current-hour",V+='<span class="hour-now-badge">NU</span>')),D.hour===G&&(A+=" hourly-master-selected"),`
                <div class="${A}" data-hour="${D.hour}" style="cursor:pointer;" title="Klik for at sætte klokkeslæt til kl. ${String(D.hour).padStart(2,"0")}:00">
                  ${V}
                  <span>${D.weatherIcon}</span>
                  <span class="hour-temp">${Math.round(D.temp)}°</span>
                  <span class="hour-clouds">☁️ ${D.cloudTotal}%</span>
                  <span class="hour-wind">💨 ${D.windSpeed.toFixed(0)}m/s</span>
                  <span style="font-size:9px;color:var(--text-dim);">${(D.visibility/1e3).toFixed(0)}km</span>
                </div>
              `}).join("")}
          </div>
        </div>
      </div>
    `,t.querySelectorAll(".btn-goto-sol").forEach(D=>{D.addEventListener("click",()=>{const A=Number(D.dataset.time),V=new Date(A);f.setDate(V)})}),t.querySelectorAll(".hourly-col[data-hour]").forEach(D=>{D.addEventListener("click",()=>{const A=Number(D.dataset.hour),V=new Date(e.date);V.setHours(A,0,0,0),f.setDate(V)})})}}const J={medium_format:{id:"medium_format",name:"Mellemformat (44×33mm)",shortName:"MF 44×33",width:43.8,height:32.9,cropFactor:.79,coc:.038,description:"Fujifilm GFX, Hasselblad X2D"},full_frame:{id:"full_frame",name:"Full Frame / 35mm (36×24mm)",shortName:"Full Frame [FX]",width:36,height:24,cropFactor:1,coc:.029,description:"Sony A7/A9, Canon R5/R6, Nikon Z, Leica M/SL"},apsc_sony_nikon_fuji:{id:"apsc_sony_nikon_fuji",name:"APS-C 1.5× (Sony, Nikon, Fuji)",shortName:"APS-C 1.5× [DX]",width:23.5,height:15.6,cropFactor:1.53,coc:.019,description:"Fujifilm X-T, Sony A6700, Nikon Z50"},apsc_canon:{id:"apsc_canon",name:"APS-C Canon 1.6× (Canon EOS R/D)",shortName:"APS-C Canon 1.6×",width:22.2,height:14.8,cropFactor:1.62,coc:.018,description:"Canon EOS R7, R10, R50, 90D"},mft:{id:"mft",name:"Micro Four Thirds (MFT 2.0×)",shortName:"Micro 4/3 [2.0×]",width:17.3,height:13,cropFactor:2,coc:.015,description:"OM System, Olympus OM-D, Panasonic Lumix G"},one_inch:{id:"one_inch",name:'1" Tomme (13.2×8.8mm)',shortName:'1" Type [2.7×]',width:13.2,height:8.8,cropFactor:2.73,coc:.011,description:"Sony RX100, ZV-1, Canon G7X"},phone_main:{id:"phone_main",name:'Smartphone Stor Sensor (1/1.3")',shortName:'Mobil 1/1.3"',width:9.6,height:7.2,cropFactor:3.6,coc:.008,description:"iPhone 15/16 Pro, Samsung S24 Ultra, Pixel 8/9"},phone_small:{id:"phone_small",name:'Smartphone Standard (1/2.55")',shortName:'Mobil 1/2.5"',width:5.76,height:4.29,cropFactor:6,coc:.005,description:"Standard ultravidvinkel & ældre smartphones"}};class R{static calculateDOF(t){const e=Math.max(1,Number(t.focalLength)||50),s=Math.max(.5,Number(t.aperture)||2.8),i=Math.max(.05,Number(t.distance)||2),a=J[t.sensor]||J.full_frame;let o=t.customCoc?Number(t.customCoc):a.coc;(!o||o<=0)&&(o=.029);const l=e/1e3,c=o/1e3,r=s,n=i,d=l*l/(r*c)+l;let h=0;const u=n*(d-l),m=d+n-2*l;m>0?h=u/m:h=0,h=Math.max(.01,h);let p=1/0;const g=n>=d;if(!g){const ct=d-n;ct>1e-6?(p=n*(d-l)/ct,(p>1e5||p<=0)&&(p=1/0)):p=1/0}let v=1/0;p!==1/0&&(v=Math.max(0,p-h));const y=Math.max(0,n-h);let x=1/0,b=50,w=50;p!==1/0?(x=Math.max(0,p-n),v>0&&(b=y/v*100,w=x/v*100)):(b=0,w=100);let L=0;n>l&&(L=l/(n-l));const k=e/s,T=Math.round(e*a.cropFactor),O=+(s*a.cropFactor).toFixed(1),j=1.342*s,G=o*1e3,D=j>G;let A={level:"optimal",label:"Optimal skarphed",badgeClass:"badge-success",desc:"Blænden er i det ideelle optiske område uden synlig diffraktionsuskarphed."};s>=16?A={level:"noticeable",label:"Mærkbar diffraktion",badgeClass:"badge-danger",desc:"Diffraktion gennem den lille blændeåbning spreder lyset og blødgør fine detaljer."}:(s>=11||D)&&(A={level:"mild",label:"Begyndende diffraktion",badgeClass:"badge-warning",desc:"Diffraktion kan anes ved 100% zoom på højtopløste sensorer."});const V=Math.max(.001,n-l),Q=l*l/(r*V)*1e3/o;let Z={rating:"medium",label:"Klassisk Bokeh",desc:"Behagelig separation mellem motiv og baggrund."};return Q<1?Z={rating:"sharp",label:"Skarp baggrund",desc:"Baggrunden bevarer fuld genkendelighed og skarphed."}:Q<4?Z={rating:"subtle",label:"Let sløring",desc:"Baggrunden er let dæmpet, men kontekst kan tydeligt ses."}:Q>=15&&(Z={rating:"creamy",label:'Fløjlsblød "Creamy" Bokeh',desc:"Baggrunden smelter fuldstændigt sammen til ren, blød bokeh."}),{focalLengthMm:e,aperture:s,distanceM:i,sensor:a,cocMm:o,hyperfocalM:d,nearLimitM:h,farLimitM:p,totalDofM:v,isInfinity:g,depthInFrontM:y,depthBehindM:x,frontPercent:Math.min(100,Math.max(0,b)),rearPercent:Math.min(100,Math.max(0,w)),magnification:L,pupilDiameterMm:k,equivFocalLength:T,equivAperture:O,diffractionStatus:A,airyDiskUm:j,bokehQuality:Z,blurToCocRatio:Q}}static formatDistance(t,e=!0){return t===1/0||t>=99999?e?"∞ (Uendelig)":"∞":t<.001?(t*1e3).toFixed(1).replace(".",",")+(e?" mm":""):t<.1||t<1?(t*100).toFixed(1).replace(".",",")+(e?" cm":""):t<10?t.toFixed(2).replace(".",",")+(e?" m":""):t<100?t.toFixed(1).replace(".",",")+(e?" m":""):Math.round(t).toString()+(e?" m":"")}static calculateBlurCircleAtDistance(t,e,s,i){if(t<=0||e<=0)return 0;const a=s/1e3,o=i,l=e,c=t;if(c===l)return 0;const r=o*Math.max(.001,l-a)*c;return Math.abs(r)<1e-6?0:Math.abs(a*a*(c-l)/r)*1e3}}class Jt{svgDiagram;evfContainer;peakingEnabled=!1;gridEnabled=!0;cachedBokehPositions=[];constructor(t,e){this.svgDiagram=t,this.evfContainer=e}toggleFocusPeaking(t){this.peakingEnabled=t!==void 0?t:!this.peakingEnabled;const e=document.getElementById("evfPeakingSubject");return e&&(e.style.opacity=this.peakingEnabled?"0.85":"0"),this.peakingEnabled}toggleGrid(t){this.gridEnabled=t!==void 0?t:!this.gridEnabled;const e=document.getElementById("evfGridOverlay");return e&&(e.style.display=this.gridEnabled?"block":"none"),this.gridEnabled}getDisplayMaxDistance(t,e,s){return s===1/0||s>100?Math.max(t*2.2,Math.min(e*1.4,60)):Math.max(s*1.35,t*1.5,1)}distanceToX(t,e){if(t<=0)return .08;const s=Math.min(1,t/e);return .1+Math.pow(s,.72)*.85}render(t){this.renderOpticalDiagram(t),this.renderEvfViewfinder(t)}renderOpticalDiagram(t){if(!this.svgDiagram)return;const{distanceM:e,hyperfocalM:s,nearLimitM:i,farLimitM:a,totalDofM:o,isInfinity:l}=t,c=this.getDisplayMaxDistance(e,s,a),r=1e3,n=72,d=125,h=75,u=this.distanceToX(e,c)*r,m=Math.max(h+8,this.distanceToX(i,c)*r),p=a===1/0||a>c,g=p?r-20:this.distanceToX(a,c)*r,v=s<=c?this.distanceToX(s,c)*r:null,y=this.generateScaleTicks(c);let x="";y.forEach(A=>{const V=this.distanceToX(A.val,c)*r;x+=`
        <line x1="${V}" y1="${d}" x2="${V}" y2="${d+7}" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" />
        <text x="${V}" y="${d+20}" font-size="10.5" font-family="ui-monospace, monospace" fill="#94a3b8" text-anchor="middle">${A.label}</text>
      `});const b=46,w=`
      <polygon points="${h},${n} ${r-15},${n-b} ${r-15},${n+b}" fill="url(#rayGrad)" opacity="0.4" />
      <line x1="${h}" y1="${n}" x2="${r-15}" y2="${n-b}" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1" stroke-dasharray="3 3"/>
      <line x1="${h}" y1="${n}" x2="${r-15}" y2="${n+b}" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1" stroke-dasharray="3 3"/>
      <line x1="${h}" y1="${n}" x2="${r-10}" y2="${n}" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="2 4"/>
    `,L=Math.max(3,g-m),k=`
      <defs>
        <linearGradient id="dofZoneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.25"/>
          <stop offset="50%" stop-color="#10b981" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="${p?"#38bdf8":"#10b981"}" stop-opacity="${p?"0.2":"0.25"}"/>
        </linearGradient>
        <linearGradient id="rayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.03"/>
        </linearGradient>
      </defs>

      <rect x="${h+5}" y="24" width="${Math.max(0,m-h-5)}" height="100" fill="rgba(239, 68, 68, 0.05)" />
      <rect x="${m}" y="24" width="${L}" height="100" fill="url(#dofZoneGrad)" rx="3"/>
      <line x1="${m}" y1="24" x2="${m}" y2="${d}" stroke="#10b981" stroke-width="2.2" />
      <line x1="${g}" y1="24" x2="${g}" y2="${d}" stroke="${p?"#38bdf8":"#10b981"}" stroke-width="2.2" ${p?'stroke-dasharray="5 3"':""}/>
      ${p?`<polygon points="${r-20},${n-6} ${r-8},${n} ${r-20},${n+6}" fill="#38bdf8" opacity="0.85"/>`:""}
    `,T=l?"DOF: ∞":`DOF: ${R.formatDistance(o)}`,O=m+L/2,j=`
      <g transform="translate(${m}, 20)">
        <rect x="-30" y="-15" width="60" height="17" rx="3" fill="#0f172a" stroke="#10b981" stroke-width="1.1" opacity="0.95"/>
        <text x="0" y="-3" font-size="9" font-weight="700" font-family="ui-monospace, monospace" fill="#10b981" text-anchor="middle">
          Dn: ${R.formatDistance(i)}
        </text>
      </g>

      <g transform="translate(${u}, ${n})">
        <line x1="0" y1="-50" x2="0" y2="52" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3 2"/>
        <circle cx="0" cy="0" r="11" fill="#1e293b" stroke="#f59e0b" stroke-width="2.2"/>
        <circle cx="0" cy="0" r="3.5" fill="#f59e0b"/>
        <line x1="-14" y1="0" x2="14" y2="0" stroke="#f59e0b" stroke-width="1.2"/>
        <line x1="0" y1="-14" x2="0" y2="14" stroke="#f59e0b" stroke-width="1.2"/>
        
        <rect x="-36" y="-68" width="72" height="18" rx="4" fill="#f59e0b" />
        <text x="0" y="-55" font-size="9.5" font-weight="800" font-family="-apple-system, sans-serif" fill="#07080a" text-anchor="middle">
          ${R.formatDistance(e)}
        </text>
      </g>

      <g transform="translate(${g}, 20)">
        <rect x="-30" y="-15" width="60" height="17" rx="3" fill="#0f172a" stroke="${p?"#38bdf8":"#10b981"}" stroke-width="1.1" opacity="0.95"/>
        <text x="0" y="-3" font-size="9" font-weight="700" font-family="ui-monospace, monospace" fill="${p?"#38bdf8":"#10b981"}" text-anchor="middle">
          Df: ${p?"∞":R.formatDistance(a)}
        </text>
      </g>

      ${L>60?`
        <g transform="translate(${O}, 48)">
          <rect x="-42" y="-10" width="84" height="19" rx="9" fill="rgba(16, 185, 129, 0.22)" stroke="#10b981" stroke-width="1.1"/>
          <text x="0" y="3" font-size="10" font-weight="800" font-family="-apple-system, sans-serif" fill="#10b981" text-anchor="middle">${T}</text>
        </g>
      `:""}

      ${v?`
        <g transform="translate(${v}, ${d-2})">
          <polygon points="0,0 -4,7 4,7" fill="#38bdf8"/>
          <text x="0" y="16" font-size="8" font-family="ui-monospace, monospace" fill="#38bdf8" text-anchor="middle" font-weight="700">H: ${R.formatDistance(s)}</text>
        </g>
      `:""}
    `,G=`
      <g transform="translate(16, ${n-22})">
        <rect x="0" y="6" width="38" height="34" rx="5" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect x="11" y="1" width="16" height="6" rx="2" fill="#334155"/>
        <circle cx="19" cy="23" r="10" fill="#0f172a" stroke="#64748b" stroke-width="1.3"/>
        <rect x="36" y="14" width="13" height="18" rx="2" fill="#334155" stroke="#64748b" stroke-width="1"/>
        <line x1="19" y1="9" x2="19" y2="37" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round"/>
        <text x="19" y="50" font-size="8.5" font-family="-apple-system, sans-serif" fill="#94a3b8" text-anchor="middle" font-weight="600">0 m</text>
      </g>
    `,D=`
      <line x1="${h}" y1="${d}" x2="${r-15}" y2="${d}" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
    `;this.svgDiagram.innerHTML=`
      <rect width="100%" height="100%" fill="#070a0f" rx="8"/>
      ${w}
      ${k}
      ${D}
      ${x}
      ${j}
      ${G}
    `}generateScaleTicks(t){const e=[];return t<=1?[.1,.25,.5,.75,1].forEach(s=>{s<=t*1.05&&e.push({val:s,label:(s*100).toFixed(0)+" cm"})}):t<=5?[.5,1,2,3,4,5].forEach(s=>{s<=t*1.05&&e.push({val:s,label:s+" m"})}):t<=20?[1,3,5,10,15,20].forEach(s=>{s<=t*1.05&&e.push({val:s,label:s+" m"})}):t<=60?[2,5,10,20,40,60].forEach(s=>{s<=t*1.05&&e.push({val:s,label:s+" m"})}):[5,15,30,60,100].forEach(s=>{s<=t*1.05&&e.push({val:s,label:s+" m"})}),e}renderEvfViewfinder(t){if(!this.evfContainer)return;const{focalLengthMm:e,aperture:s,distanceM:i,blurToCocRatio:a,bokehQuality:o}=t,l=Math.max(.15,i*.45),c=R.calculateBlurCircleAtDistance(l,i,e,s),r=Math.max(15,i*4),n=R.calculateBlurCircleAtDistance(r,i,e,s),d=38,h=Math.min(30,c*d).toFixed(1),u=Math.min(32,n*d).toFixed(1),m=document.getElementById("evfLayerForeground"),p=document.getElementById("evfLayerBackground"),g=document.getElementById("evfBokehOverlay"),v=document.getElementById("evfPeakingSubject");if(m&&(m.style.filter=`blur(${h}px)`,m.style.opacity=Number(h)>15?"0.6":"0.9"),p&&(p.style.filter=`blur(${u}px)`),v&&(v.style.opacity=this.peakingEnabled?"0.85":"0"),g){const k=Math.min(18,Math.floor(a*.9));if(k>=3){g.style.display="block";const T=Math.max(18,Math.min(65,n*80));this.renderBokehBalls(g,k,T)}else g.style.display="none",g.innerHTML=""}const y=document.getElementById("evfOsdShutter"),x=document.getElementById("evfOsdAperture"),b=document.getElementById("evfOsdDist"),w=document.getElementById("evfOsdFocal"),L=document.getElementById("evfBokehQualityLabel");if(x&&(x.textContent=`f/${s.toFixed(1).replace(".0","")}`),b&&(b.textContent=R.formatDistance(i)),w&&(w.textContent=`${e}mm`),L&&(L.textContent=o.label),y){const k=s*s/100;let T="1/500s";k<5e-4?T="1/4000s":k<.001?T="1/2000s":k<.002?T="1/1000s":k<.004?T="1/500s":k<.008?T="1/250s":k<.016?T="1/125s":k<.033?T="1/60s":T="1/30s",y.textContent=T}}renderBokehBalls(t,e,s){if(this.cachedBokehPositions.length!==e){this.cachedBokehPositions=[];for(let a=0;a<e;a++)this.cachedBokehPositions.push({x:10+(Math.sin(a*1.9)*.5+.5)*80,y:8+(Math.cos(a*2.3)*.5+.5)*55,scale:.6+(Math.sin(a*3.7)*.5+.5)*.8,color:["#fbbf24","#f59e0b","#38bdf8","#e2e8f0","#ffffff"][a%5]})}let i="";this.cachedBokehPositions.forEach(a=>{const o=s*a.scale;i+=`
        <div class="bokeh-ball" style="
          left: ${a.x}%;
          top: ${a.y}%;
          width: ${o}px;
          height: ${o}px;
          border-color: ${a.color};
          box-shadow: 0 0 ${o*.4}px ${a.color};
        "></div>
      `}),t.innerHTML=i}}const kt=[{id:"portrait",name:"👤 Klassisk Portræt",sub:"85mm f/1.4 • FF • 2,0 m",params:{sensor:"full_frame",focalLength:85,aperture:1.4,distance:2}},{id:"landscape",name:"🏞️ Landskab (Hyperfokal)",sub:"24mm f/8 • FF • Hyperfokal",params:{sensor:"full_frame",focalLength:24,aperture:8,distance:"hyperfocal"}},{id:"macro",name:"🌿 Makro / Nærbillede",sub:"100mm f/2.8 • FF • 0,35 m",params:{sensor:"full_frame",focalLength:100,aperture:2.8,distance:.35}},{id:"street",name:"🏙️ Gadefoto / Zonefokus",sub:"35mm f/5.6 • APS-C • 3,0 m",params:{sensor:"apsc_sony_nikon_fuji",focalLength:35,aperture:5.6,distance:3}},{id:"wildlife",name:"🦅 Tele / Fugle & Dyr",sub:"400mm f/4 • FF • 15,0 m",params:{sensor:"full_frame",focalLength:400,aperture:4,distance:15}},{id:"phone",name:"📱 Mobilkamera",sub:"24mm ækv. f/1.8 • Mobil • 1,5 m",params:{sensor:"phone_main",focalLength:6.8,aperture:1.8,distance:1.5}}],_=[1,1.2,1.4,1.8,2,2.8,4,5.6,8,11,16,22],Qt=[16,24,35,50,85,105,135,200,400];class Zt{container;visualizer=null;currentParams={sensor:"full_frame",focalLength:50,aperture:2.8,distance:2};activeVisTab="both";liveSyncExposure=!0;mount(t){this.container=t,this.loadSavedState(),this.render(),this.attachEventListeners(),this.updateCalculations()}loadSavedState(){try{const t=localStorage.getItem("fs_dof_state_v1");t&&(this.currentParams={...this.currentParams,...JSON.parse(t)})}catch(t){console.warn("Kunne ikke hente gemt DOF-tilstand:",t)}}saveState(){try{localStorage.setItem("fs_dof_state_v1",JSON.stringify(this.currentParams))}catch(t){console.warn("Kunne ikke gemme DOF-tilstand:",t)}}render(){const t=Object.values(J).map(i=>`<option value="${i.id}" ${i.id===this.currentParams.sensor?"selected":""}>${i.name}</option>`).join("");this.container.innerHTML=`
      <div class="dof-container desktop-dof-panel">
        <!-- HERO KORT MED HOVEDTAL -->
        <div class="dof-hero-card">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
            <div class="dof-main-metric" style="text-align:left;margin-bottom:0;">
              <div class="dof-total-val tabular-nums" id="dofTotalVal">--</div>
              <div class="dof-total-sub">Total Dybdeskarphed (DOF)</div>
            </div>
            <span class="fs-badge badge-dof" id="dofSensorBadge">Full Frame [1.0×]</span>
          </div>

          <div class="dof-grid-stats">
            <div class="stat-item">
              <span class="stat-label">Nærgrænse (Dn)</span>
              <span class="stat-num tabular-nums" id="dofNearVal">--</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Fjerngrænse (Df)</span>
              <span class="stat-num highlight-dof tabular-nums" id="dofFarVal">--</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Hyperfokal (H)</span>
              <span class="stat-num highlight-hyper tabular-nums" id="dofHyperVal">--</span>
            </div>
          </div>

          <div class="dof-distribution-wrap">
            <div class="dof-dist-bar">
              <div class="dist-front" id="dofDistFront" style="width: 50%;"></div>
              <div class="dist-rear" id="dofDistRear" style="width: 50%;"></div>
            </div>
            <div class="dist-labels">
              <span id="dofFrontLabel">Foran: 50%</span>
              <span id="dofRearLabel">Bagved: 50%</span>
            </div>
          </div>
        </div>

        <!-- VISUALISERING (På Desktop kan vi vise BÅDE Diagram og EVF Søger, eller vælge én) -->
        <div class="dof-vis-card">
          <div class="vis-header-row">
            <div class="fs-segmented-control" style="max-width: 280px;">
              <button class="fs-segment-btn ${this.activeVisTab==="both"?"active":""}" data-tab="both">⚡ Begge</button>
              <button class="fs-segment-btn ${this.activeVisTab==="diagram"?"active":""}" data-tab="diagram">📏 Diagram</button>
              <button class="fs-segment-btn ${this.activeVisTab==="evf"?"active":""}" data-tab="evf">📷 EVF Søger</button>
            </div>
            <div class="vis-toggles" id="evfControlsWrap" style="${this.activeVisTab!=="diagram"?"":"display: none;"}">
              <button class="vis-toggle-btn" id="btnTogglePeaking" title="Focus Peaking">Peaking</button>
              <button class="vis-toggle-btn active" id="btnToggleGrid" title="3x3 Kompositionsgitter">Gitter</button>
            </div>
          </div>

          <!-- SVG Diagram Visning -->
          <div class="dof-svg-wrap" id="diagramContainer" style="${this.activeVisTab!=="evf"?"":"display: none;"}">
            <svg class="dof-svg-diagram" id="dofSvgDiagram" viewBox="0 0 1000 165" preserveAspectRatio="none"></svg>
          </div>

          <!-- EVF Viewfinder Visning -->
          <div class="evf-viewfinder" id="evfContainer" style="${this.activeVisTab!=="diagram"?"margin-top:8px;":"display: none;"}">
            <div class="evf-hud-top">
              <span class="hud-item"><span class="af-dot"></span> AF-C SINGLE</span>
              <span class="hud-item hud-bokeh" id="evfBokehQualityLabel">Bokeh</span>
              <span class="hud-item" id="evfOsdIso">ISO 100</span>
            </div>

            <div class="evf-layer evf-bg-scenery" id="evfLayerBackground">
              <div class="evf-sky"></div>
              <div class="evf-mountains"></div>
              <div class="evf-distant-trees"></div>
            </div>

            <div class="evf-bokeh-overlay" id="evfBokehOverlay"></div>

            <div class="evf-layer evf-subject-wrap" id="evfLayerSubject">
              <div class="evf-peaking-glow" id="evfPeakingSubject"></div>
              <div class="evf-subject-figure">
                <svg width="64" height="150" viewBox="0 0 64 150" fill="none">
                  <circle cx="32" cy="22" r="14" fill="#334155" stroke="#94a3b8" stroke-width="2"/>
                  <path d="M12 55 C12 40, 52 40, 52 55 L56 100 L42 100 L44 145 L34 145 L32 102 L30 145 L20 145 L22 100 L8 100 Z" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
                </svg>
              </div>
              <div class="evf-af-box">
                <span class="af-dot"></span>
              </div>
            </div>

            <div class="evf-layer evf-foreground-wrap" id="evfLayerForeground">
              <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
                <path d="M0,80 Q20,30 40,80 Q70,20 90,80 Q130,40 150,80 Q180,10 210,80 Q260,35 290,80 Q340,25 370,80 Q390,45 400,80 Z" fill="#0f172a" opacity="0.85"/>
              </svg>
            </div>

            <div class="evf-grid-overlay" id="evfGridOverlay">
              <div class="grid-line grid-v1"></div>
              <div class="grid-line grid-v2"></div>
              <div class="grid-line grid-h1"></div>
              <div class="grid-line grid-h2"></div>
            </div>

            <div class="evf-hud-bottom">
              <span id="evfOsdShutter">1/500s</span>
              <span id="evfOsdAperture" style="color: var(--golden-primary); font-weight: 700;">f/2.8</span>
              <span id="evfOsdDist">2,0 m</span>
              <span id="evfOsdFocal">50mm</span>
            </div>
          </div>
        </div>

        <!-- KONTROLPANEL KORT -->
        <div class="fs-card">
          <!-- 1. SENSOR VÆLGER -->
          <div class="fs-slider-wrap">
            <div class="fs-slider-header">
              <span class="fs-slider-label">Sensorformat</span>
              <span class="fs-slider-val" id="dofCocDisplay">CoC: 0.029 mm</span>
            </div>
            <select class="fs-btn" id="dofSensorSelect" style="width: 100%; text-align: left; padding: 8px 10px;">
              ${t}
            </select>
          </div>

          <!-- 2. BRÆNDVIDDE -->
          <div class="fs-slider-wrap" style="margin-top: var(--space-3);">
            <div class="fs-slider-header">
              <span class="fs-slider-label">Brændvidde</span>
              <span class="fs-slider-val" id="dofFocalDisplay">50 mm</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="fs-btn-icon" id="btnFocalMinus" aria-label="Mindre brændvidde">-</button>
              <input type="range" id="dofFocalSlider" min="10" max="600" step="1" value="${this.currentParams.focalLength}">
              <button class="fs-btn-icon" id="btnFocalPlus" aria-label="Større brændvidde">+</button>
            </div>
            <div class="quick-btn-scroll">
              ${Qt.map(i=>`<button class="quick-val-btn ${i===this.currentParams.focalLength?"active":""}" data-focal="${i}">${i}mm</button>`).join("")}
            </div>
          </div>

          <!-- 3. BLÆNDE -->
          <div class="fs-slider-wrap" style="margin-top: var(--space-3);">
            <div class="fs-slider-header">
              <span class="fs-slider-label">Blænde</span>
              <span class="fs-slider-val" id="dofApertureDisplay" style="color: var(--golden-primary);">f/2.8</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="fs-btn-icon" id="btnApertureMinus" aria-label="Større blænde">-</button>
              <input type="range" id="dofApertureSlider" min="0" max="${_.length-1}" step="1" value="5">
              <button class="fs-btn-icon" id="btnAperturePlus" aria-label="Mindre blænde">+</button>
            </div>
            <div class="quick-btn-scroll">
              ${_.map(i=>`<button class="quick-val-btn ${i===this.currentParams.aperture?"active":""}" data-aperture="${i}">f/${i}</button>`).join("")}
            </div>
          </div>

          <!-- 4. AFSTAND -->
          <div class="fs-slider-wrap" style="margin-top: var(--space-3);">
            <div class="fs-slider-header">
              <span class="fs-slider-label">Motivafstand</span>
              <span class="fs-slider-val" id="dofDistanceDisplay">2,00 m</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="fs-btn-icon" id="btnDistMinus" aria-label="Tættere på">-</button>
              <input type="range" id="dofDistSlider" min="0.1" max="50" step="0.05" value="${this.currentParams.distance}">
              <button class="fs-btn-icon" id="btnDistPlus" aria-label="Længere væk">+</button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
              <label style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:var(--text-muted);cursor:pointer;">
                <input type="checkbox" id="checkLiveSyncExp" ${this.liveSyncExposure?"checked":""}>
                <span>🔗 Synkroniser blænde & brændvidde live med Eksponering</span>
              </label>
              <button class="fs-btn" id="btnSetHyperfocal" style="padding: 4px 10px; font-size: 11px; min-height: 28px;">
                🎯 Sæt til Hyperfokal
              </button>
            </div>
          </div>
        </div>

        <!-- HURTIGE SCENARIER & OPTISK ANALYSE -->
        <div class="fs-card" style="margin-bottom:0;">
          <div class="fs-card-header">
            <span class="fs-card-title">Hurtige Scenarier & Diffraktion</span>
            <span class="fs-badge" id="dofDiffractionBadge">Optimal skarphed</span>
          </div>
          <div class="scenarios-grid" style="margin-bottom:10px;">
            ${kt.map(i=>`
              <button class="scenario-card-btn" data-scenario="${i.id}">
                <span class="scenario-name">${i.name}</span>
                <span class="scenario-sub">${i.sub}</span>
              </button>
            `).join("")}
          </div>
          <p id="dofDiffractionDesc" style="font-size: 12px; color: var(--text-muted); line-height: 1.4; margin-bottom: 8px;"></p>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 8px;">
            <span>35mm ækvivalent: <strong id="dofEquivDisplay" style="color: var(--text-main);">50mm f/2.8</strong></span>
            <span>Indgangspupil: <strong id="dofPupilDisplay" style="color: var(--text-main);">17,9 mm</strong></span>
          </div>
        </div>
      </div>
    `;const e=this.container.querySelector("#dofSvgDiagram"),s=this.container.querySelector("#evfContainer");this.visualizer=new Jt(e,s)}attachEventListeners(){const t=this.container.querySelector("#diagramContainer"),e=this.container.querySelector("#evfContainer"),s=this.container.querySelector("#evfControlsWrap");this.container.querySelectorAll("[data-tab]").forEach(d=>{d.addEventListener("click",()=>{const h=d.dataset.tab;this.activeVisTab=h,this.container.querySelectorAll("[data-tab]").forEach(u=>{u.classList.toggle("active",u.dataset.tab===h)}),t.style.display=h!=="evf"?"block":"none",e.style.display=h!=="diagram"?"block":"none",s.style.display=h!=="diagram"?"flex":"none",this.updateCalculations()})});const i=this.container.querySelector("#btnTogglePeaking");i?.addEventListener("click",()=>{const d=this.visualizer?.toggleFocusPeaking();i.classList.toggle("active",d)});const a=this.container.querySelector("#btnToggleGrid");a?.addEventListener("click",()=>{const d=this.visualizer?.toggleGrid();a.classList.toggle("active",d)});const o=this.container.querySelector("#dofSensorSelect");o?.addEventListener("change",()=>{this.currentParams.sensor=o.value,this.updateCalculations(!0)});const l=this.container.querySelector("#dofFocalSlider");l?.addEventListener("input",()=>{this.currentParams.focalLength=Number(l.value),this.updateCalculations(!0)}),this.container.querySelector("#btnFocalMinus")?.addEventListener("click",()=>{this.currentParams.focalLength=Math.max(10,this.currentParams.focalLength-5),l.value=String(this.currentParams.focalLength),this.updateCalculations(!0)}),this.container.querySelector("#btnFocalPlus")?.addEventListener("click",()=>{this.currentParams.focalLength=Math.min(600,this.currentParams.focalLength+5),l.value=String(this.currentParams.focalLength),this.updateCalculations(!0)}),this.container.querySelectorAll("[data-focal]").forEach(d=>{d.addEventListener("click",()=>{const h=Number(d.dataset.focal);this.currentParams.focalLength=h,l.value=String(h),this.updateCalculations(!0)})});const c=this.container.querySelector("#dofApertureSlider");c?.addEventListener("input",()=>{const d=Number(c.value);this.currentParams.aperture=_[d]||2.8,this.updateCalculations(!0)}),this.container.querySelector("#btnApertureMinus")?.addEventListener("click",()=>{const d=_.indexOf(this.currentParams.aperture);d>0&&(this.currentParams.aperture=_[d-1],c.value=String(d-1),this.updateCalculations(!0))}),this.container.querySelector("#btnAperturePlus")?.addEventListener("click",()=>{const d=_.indexOf(this.currentParams.aperture);d>=0&&d<_.length-1&&(this.currentParams.aperture=_[d+1],c.value=String(d+1),this.updateCalculations(!0))}),this.container.querySelectorAll("[data-aperture]").forEach(d=>{d.addEventListener("click",()=>{const h=Number(d.dataset.aperture);this.currentParams.aperture=h;const u=_.indexOf(h);u!==-1&&(c.value=String(u)),this.updateCalculations(!0)})});const r=this.container.querySelector("#dofDistSlider");r?.addEventListener("input",()=>{this.currentParams.distance=Number(r.value),this.updateCalculations()}),this.container.querySelector("#btnDistMinus")?.addEventListener("click",()=>{this.currentParams.distance=Math.max(.1,Number((this.currentParams.distance*.85).toFixed(2))),r.value=String(this.currentParams.distance),this.updateCalculations()}),this.container.querySelector("#btnDistPlus")?.addEventListener("click",()=>{this.currentParams.distance=Math.min(100,Number((this.currentParams.distance*1.18).toFixed(2))),r.value=String(this.currentParams.distance),this.updateCalculations()}),this.container.querySelector("#btnSetHyperfocal")?.addEventListener("click",()=>{const d=R.calculateDOF(this.currentParams);this.currentParams.distance=Number(d.hyperfocalM.toFixed(2)),r.value=String(Math.min(50,this.currentParams.distance)),this.updateCalculations()});const n=this.container.querySelector("#checkLiveSyncExp");n?.addEventListener("change",()=>{this.liveSyncExposure=n.checked,this.liveSyncExposure&&this.emitOpticsToExposure()}),this.container.querySelectorAll("[data-scenario]").forEach(d=>{d.addEventListener("click",()=>{const h=d.dataset.scenario,u=kt.find(p=>p.id===h);if(!u)return;if(this.currentParams.sensor=u.params.sensor,this.currentParams.focalLength=u.params.focalLength,this.currentParams.aperture=u.params.aperture,u.params.distance==="hyperfocal"){const p=R.calculateDOF(this.currentParams);this.currentParams.distance=Number(p.hyperfocalM.toFixed(2))}else this.currentParams.distance=Number(u.params.distance);o.value=this.currentParams.sensor,l.value=String(this.currentParams.focalLength),r.value=String(Math.min(50,this.currentParams.distance));const m=_.indexOf(this.currentParams.aperture);m!==-1&&(c.value=String(m)),this.updateCalculations(!0)})})}emitOpticsToExposure(){const t=J[this.currentParams.sensor]||J.full_frame;M.emitOpticsSync({aperture:this.currentParams.aperture,focalLength:this.currentParams.focalLength,cropFactor:t.cropFactor,sensorName:t.shortName})}updateCalculations(t=!1){const e=R.calculateDOF(this.currentParams);this.saveState(),t&&this.liveSyncExposure&&this.emitOpticsToExposure();const s=this.container.querySelector("#dofTotalVal"),i=this.container.querySelector("#dofNearVal"),a=this.container.querySelector("#dofFarVal"),o=this.container.querySelector("#dofHyperVal"),l=this.container.querySelector("#dofSensorBadge"),c=this.container.querySelector("#dofCocDisplay"),r=this.container.querySelector("#dofFocalDisplay"),n=this.container.querySelector("#dofApertureDisplay"),d=this.container.querySelector("#dofDistanceDisplay");s&&(s.textContent=e.isInfinity?"∞ (Uendelig)":R.formatDistance(e.totalDofM)),i&&(i.textContent=R.formatDistance(e.nearLimitM)),a&&(a.textContent=e.isInfinity?"∞":R.formatDistance(e.farLimitM)),o&&(o.textContent=R.formatDistance(e.hyperfocalM)),l&&(l.textContent=`${e.sensor.shortName}`),c&&(c.textContent=`CoC: ${e.cocMm} mm`),r&&(r.textContent=`${e.focalLengthMm} mm`),n&&(n.textContent=`f/${e.aperture}`),d&&(d.textContent=R.formatDistance(e.distanceM));const h=this.container.querySelector("#dofDistFront"),u=this.container.querySelector("#dofDistRear"),m=this.container.querySelector("#dofFrontLabel"),p=this.container.querySelector("#dofRearLabel");h&&u&&(h.style.width=`${e.frontPercent}%`,u.style.width=`${e.rearPercent}%`),m&&(m.textContent=`Foran: ${Math.round(e.frontPercent)}% (${R.formatDistance(e.depthInFrontM)})`),p&&(p.textContent=`Bagved: ${Math.round(e.rearPercent)}% (${e.isInfinity?"∞":R.formatDistance(e.depthBehindM)})`),this.container.querySelectorAll("[data-focal]").forEach(b=>{const w=Number(b.dataset.focal);b.classList.toggle("active",w===e.focalLengthMm)}),this.container.querySelectorAll("[data-aperture]").forEach(b=>{const w=Number(b.dataset.aperture);b.classList.toggle("active",Math.abs(w-e.aperture)<.05)});const g=this.container.querySelector("#dofDiffractionBadge"),v=this.container.querySelector("#dofDiffractionDesc"),y=this.container.querySelector("#dofEquivDisplay"),x=this.container.querySelector("#dofPupilDisplay");g&&(g.textContent=e.diffractionStatus.label,g.className=`fs-badge ${e.diffractionStatus.badgeClass}`),v&&(v.textContent=e.diffractionStatus.desc),y&&(y.textContent=`${e.equivFocalLength}mm f/${e.equivAperture}`),x&&(x.textContent=`${e.pupilDiameterMm.toFixed(1).replace(".",",")} mm`),this.visualizer?.render(e)}}const wt=[{id:"nd2",name:"ND2",stops:1,ndFactor:2,opticalDensity:.3,description:"1 stop (Let lysdæmpning)"},{id:"cpl",name:"CPL Polfilter",stops:1.5,ndFactor:2.8,opticalDensity:.45,description:"~1.5 stops (Refleksioner)"},{id:"nd4",name:"ND4",stops:2,ndFactor:4,opticalDensity:.6,description:"2 stops (Mellem)"},{id:"nd8",name:"ND8",stops:3,ndFactor:8,opticalDensity:.9,description:"3 stops (Klassisk video/portræt)"},{id:"nd16",name:"ND16",stops:4,ndFactor:16,opticalDensity:1.2,description:"4 stops (Solskin portræt)"},{id:"nd32",name:"ND32",stops:5,ndFactor:32,opticalDensity:1.5,description:"5 stops"},{id:"nd64",name:"ND64",stops:6,ndFactor:64,opticalDensity:1.8,description:"6 stops (Vandfald & bevægelse)"},{id:"nd128",name:"ND128",stops:7,ndFactor:128,opticalDensity:2.1,description:"7 stops"},{id:"nd256",name:"ND256",stops:8,ndFactor:256,opticalDensity:2.4,description:"8 stops"},{id:"nd512",name:"ND512",stops:9,ndFactor:512,opticalDensity:2.7,description:"9 stops"},{id:"nd1000",name:"ND1000",stops:10,ndFactor:1024,opticalDensity:3,description:"10 stops (Big Stopper / Silkevand)"},{id:"nd2000",name:"ND2000",stops:11,ndFactor:2048,opticalDensity:3.3,description:"11 stops"},{id:"nd4000",name:"ND4000",stops:12,ndFactor:4096,opticalDensity:3.6,description:"12 stops"},{id:"nd32000",name:"ND32000",stops:15,ndFactor:32768,opticalDensity:4.5,description:"15 stops (Super Stopper)"},{id:"nd65000",name:"ND65000",stops:16,ndFactor:65536,opticalDensity:4.8,description:"16 stops"},{id:"nd1000000",name:"ND1000000",stops:20,ndFactor:1048576,opticalDensity:6,description:"20 stops (Solfotografering)"}],K=[32,22,20,18,16,14,13,11,10,9,8,7.1,6.3,5.6,5,4.5,4,3.5,3.2,2.8,2.5,2.2,2,1.8,1.4,1.2,1],te=[22,16,11,8,5.6,4,2.8,2,1.4,1],H=[1/8e3,1/6400,1/5e3,1/4e3,1/3200,1/2500,1/2e3,1/1600,1/1250,1/1e3,1/800,1/640,1/500,1/400,1/320,1/250,1/200,1/160,1/125,1/100,1/80,1/60,1/50,1/40,1/30,1/25,1/20,1/15,1/13,1/10,1/8,1/6,1/5,1/4,.3,.4,.5,.6,.8,1,1.3,1.6,2,2.5,3.2,4,5,6,8,10,13,15,20,25,30],W=[50,64,80,100,125,160,200,250,320,400,500,640,800,1e3,1250,1600,2e3,2500,3200,4e3,5e3,6400,8e3,1e4,12800,25600,51200],Et=[{id:"birds_flight",category:"action",title:"🦅 Flyvende fugle & hurtig vildt",recommendedRange:"1/2000s – 1/4000s",minShutter:1/4e3,maxShutter:1/2e3,description:"Fryser lynhurtige vingeslag og dråber kastes fra vinger.",tip:"Brug blænde f/4 eller f/5.6 og lad Auto-ISO kompensere."},{id:"sports_action",category:"action",title:"⚽ Sport, løb & action",recommendedRange:"1/1000s – 1/2000s",minShutter:1/2e3,maxShutter:1/1e3,description:"Fryser intense bevægelser, bolde i luften og atleter.",tip:"Hurtig serieoptagelse og kontinuerlig autofokus (AF-C)."},{id:"children_pets",category:"action",title:"🐕 Børn & kæledyr i leg",recommendedRange:"1/500s – 1/1000s",minShutter:1/1e3,maxShutter:1/500,description:"Undgår bevægelsesuskarphed ved uforudsigelig leg.",tip:"Vær i øjenhøjde med motivet for den bedste dynamik."},{id:"street_walking",category:"creative",title:"🚶 Gadefoto & gående personer",recommendedRange:"1/250s – 1/500s",minShutter:1/500,maxShutter:1/250,description:"Fryser almindelig gang og byliv skarpt.",tip:"Glimrende zonefokus-hastighed ved f/5.6 eller f/8."},{id:"portrait_handheld",category:"handheld",title:"👤 Stillestående portræt",recommendedRange:"1/125s – 1/250s",minShutter:1/250,maxShutter:1/125,description:"Sikrer mod små mikrobevægelser og øjenblink.",tip:"Kombinér med stor blænde (f/1.4 - f/2.8) for blød bokeh."},{id:"water_texture",category:"creative",title:"🌊 Vandfald med tekstur & liv",recommendedRange:"1/8s – 1/2s",minShutter:.125,maxShutter:.5,description:"Bevarer vandets kraft og skumdråber med let slør.",tip:"Kræver stativ eller særdeles effektiv billedstabilisering."},{id:"silky_water",category:"creative",title:"✨ Silkeblødt hav & kystbølger",recommendedRange:"2s – 15s",minShutter:2,maxShutter:15,description:"Udjævner bølger til et drømmende slør omkring klipper.",tip:"Typisk oplagt med ND64 (6-stop) eller ND1000 (10-stop) filter."},{id:"stretched_clouds",category:"creative",title:"☁️ Strøgne skyer & spejlblankt vand",recommendedRange:"30s – 4 min",minShutter:30,maxShutter:240,description:"Total udglatning af vandoverflader og maleriske skytræk.",tip:"Brug kameraets Bulb-tilstand og appens indbyggede timer."},{id:"light_trails",category:"creative",title:"🚗 Biltrafik lysstriber i mørke",recommendedRange:"10s – 30s",minShutter:10,maxShutter:30,description:"Forvandler forlygter og baglygter til ubrudte lysbånd.",tip:"Blænde f/8-f/11 skaber flotte stjerneeffekter (starburst) på gadelamper."}];class E{static calculateEV100(t,e){return t<=0||e<=0?0:Math.log2(t*t/e)}static calculateEV(t,e,s){const i=this.calculateEV100(t,e),a=Math.log2(Math.max(1,s)/100);return i-a}static calculateMeterDelta(t,e,s,i){const a=this.calculateEV(t,e,s),o=i-a;return Math.max(-3,Math.min(3,o))}static calculateApertureStopsDiff(t,e){return t<=0||e<=0?0:2*Math.log2(t/e)}static calculateShutterStopsDiff(t,e){return t<=0||e<=0?0:Math.log2(e/t)}static calculateIsoStopsDiff(t,e){return t<=0||e<=0?0:Math.log2(e/t)}static formatStopsDiff(t){if(Math.abs(t)<.15)return"0 stops (uændret)";const e=t>0?"+":"",s=Math.round(t*10)/10,i=Number.isInteger(s)?String(s):s.toFixed(1).replace(".",",");return`${e}${i} stops`}static solveShutter(t,e,s){const i=Math.pow(2,s)*(e/100);return i<=0?1/125:t*t/i}static solveAperture(t,e,s){const i=t*Math.pow(2,s)*(e/100);return i<=0?2.8:Math.sqrt(i)}static solveIso(t,e,s){const i=t*t,a=e*Math.pow(2,s);return a<=0?100:100*(i/a)}static findClosestValue(t,e){let s=e[0],i=Math.abs(t-s);for(const a of e){const o=Math.abs(t-a);o<i&&(i=o,s=a)}return s}static calculateHandheldShutter(t,e=1,s=0){const a=1/Math.max(10,t*e),o=Math.pow(2,Math.max(0,s)),l=a*o;return{baseSafeShutter:a,stabilizedSafeShutter:l,displayBase:this.formatShutterSpeed(a),displayStabilized:this.formatShutterSpeed(l),description:s>0?`Uden stabilisering: ${this.formatShutterSpeed(a)}. Med ${s} stops stabilisering kan du håndholde ned til ca. ${this.formatShutterSpeed(l)}.`:`Minimum ca. ${this.formatShutterSpeed(a)} håndholdt for at undgå rystelser med ${t}mm optik.`}}static calculateAstroShutter(t,e=1){const s=Math.max(10,t*e),i=500/s,a=300/s;return{rule500:i,rule300:a,display500:this.formatShutterSpeed(i),display300:this.formatShutterSpeed(a),tip:`Ved ${t}mm optik undgås stjernespor op til ${this.formatShutterSpeed(i)} (500-reglen) eller ${this.formatShutterSpeed(a)} (300-reglen til skarpe pixels).`}}static calculateNdExposure(t,e){const s=Math.pow(2,Math.max(0,e)),i=t*s,a=e*.30103;return{newShutter:i,factor:s,displayTime:this.formatShutterSpeed(i),opticalDensity:Number(a.toFixed(2)),requiresBulb:i>30}}static formatShutterSpeed(t){if(!Number.isFinite(t)||t<=0)return"0s";if(t<.45)return`1/${Math.round(1/t)}s`;if(t<2)return`${t.toFixed(1).replace(".",",")}s`;if(t<60)return`${Math.round(t)}s`;if(t<3600){const a=Math.floor(t/60),o=Math.round(t%60);return o>0?`${a}m ${o}s`:`${a}m`}const e=Math.floor(t/3600),s=Math.floor(t%3600/60),i=Math.round(t%60);return`${e}t ${s}m ${i}s`}static generateHistogramPath(t,e=240,s=70){const i=.5+t/6,a=Math.max(.1,Math.min(.9,i))*e,o=e*.18,l=[],c=40;for(let n=0;n<=c;n++){const d=n/c*e,h=d-a,u=Math.exp(-(h*h)/(2*o*o)),m=.08*Math.sin(d/e*Math.PI),p=Math.min(1,u*.9+m),g=s-p*(s-6);l.push([d,g])}let r=`M 0,${s}`;for(const[n,d]of l)r+=` L ${n.toFixed(1)},${d.toFixed(1)}`;return r+=` L ${e},${s} Z`,r}}class ee{svgEl;meterEl;histSvgEl;statusTextEl;constructor(t,e,s,i){this.svgEl=t,this.meterEl=e,this.histSvgEl=s,this.statusTextEl=i}render(t){this.renderTriangle(t),this.renderMeter(t),this.renderHistogram(t)}renderTriangle(t){const n=Math.max(-3,Math.min(3,t.deltaEv)),d=n/3*22,h=-(n/3)*16,u=200+d,m=191+h;let p="var(--accent-exposure, #a855f7)",g="rgba(168, 85, 247, 0.4)";Math.abs(t.deltaEv)<=.33?(p="var(--accent-success, #10b981)",g="rgba(16, 185, 129, 0.5)"):t.deltaEv>1.5||t.deltaEv<-1.5?(p="var(--accent-danger, #ef4444)",g="rgba(239, 68, 68, 0.5)"):(p="var(--accent-warning, #f59e0b)",g="rgba(245, 158, 11, 0.5)"),this.svgEl.innerHTML=`
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${g}" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>
        <linearGradient id="edgeGradTopLeft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.8" />
        </linearGradient>
        <linearGradient id="edgeGradTopRight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#a855f7" stop-opacity="0.8" />
        </linearGradient>
        <linearGradient id="edgeGradBottom" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#a855f7" stop-opacity="0.8" />
        </linearGradient>
      </defs>

      <!-- Trekant flade -->
      <polygon points="200,45 50,265 350,265"
               fill="var(--bg-surface-elevated, #161b22)"
               fill-opacity="0.55"
               stroke="var(--border-subtle, rgba(255,255,255,0.1))"
               stroke-width="1.5" />

      <!-- Vektorlinjer fra centrum til hjørner -->
      <line x1="200" y1="45" x2="200" y2="191" stroke="var(--border-subtle)" stroke-dasharray="3,3" />
      <line x1="50" y1="265" x2="200" y2="191" stroke="var(--border-subtle)" stroke-dasharray="3,3" />
      <line x1="350" y1="265" x2="200" y2="191" stroke="var(--border-subtle)" stroke-dasharray="3,3" />

      <!-- Farvede trekantkanter -->
      <line x1="200" y1="45" x2="50" y2="265" stroke="url(#edgeGradTopLeft)" stroke-width="2.5" />
      <line x1="200" y1="45" x2="350" y2="265" stroke="url(#edgeGradTopRight)" stroke-width="2.5" />
      <line x1="50" y1="265" x2="350" y2="265" stroke="url(#edgeGradBottom)" stroke-width="2.5" />

      <!-- Lysbalance glød i centrum -->
      <circle cx="${u}" cy="${m}" r="38" fill="url(#centerGlow)" />
      <circle cx="${u}" cy="${m}" r="8" fill="${p}" stroke="#ffffff" stroke-width="2" />
      <circle cx="${u}" cy="${m}" r="2" fill="#000000" />

      <!-- TOP VERTEX: BLÆNDE -->
      <g transform="translate(200, 45)">
        <circle cx="0" cy="0" r="22" fill="var(--bg-card, #0f1217)" stroke="#f59e0b" stroke-width="2" />
        <text x="0" y="-2" font-size="11" font-weight="800" fill="#f59e0b" text-anchor="middle" dominant-baseline="middle" font-family="var(--font-mono)">f/${t.aperture}</text>
        <text x="0" y="8" font-size="8" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="middle">BLÆNDE</text>
        <!-- Pædagogisk undertitel -->
        <text x="0" y="-28" font-size="10" font-weight="700" fill="var(--text-main)" text-anchor="middle">Dybdeskarphed & Lys</text>
      </g>

      <!-- VENSTRE VERTEX: LUKKERTID -->
      <g transform="translate(50, 265)">
        <circle cx="0" cy="0" r="24" fill="var(--bg-card, #0f1217)" stroke="#38bdf8" stroke-width="2" />
        <text x="0" y="-2" font-size="11" font-weight="800" fill="#38bdf8" text-anchor="middle" dominant-baseline="middle" font-family="var(--font-mono)">${E.formatShutterSpeed(t.shutter)}</text>
        <text x="0" y="8" font-size="8" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="middle">LUKKER</text>
        <!-- Pædagogisk undertitel -->
        <text x="0" y="32" font-size="10" font-weight="700" fill="var(--text-main)" text-anchor="middle">Bevægelse & Frys</text>
      </g>

      <!-- HØJRE VERTEX: ISO -->
      <g transform="translate(350, 265)">
        <circle cx="0" cy="0" r="24" fill="var(--bg-card, #0f1217)" stroke="#a855f7" stroke-width="2" />
        <text x="0" y="-2" font-size="11" font-weight="800" fill="#a855f7" text-anchor="middle" dominant-baseline="middle" font-family="var(--font-mono)">${t.iso}</text>
        <text x="0" y="8" font-size="8" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="middle">ISO</text>
        <!-- Pædagogisk undertitel -->
        <text x="0" y="32" font-size="10" font-weight="700" fill="var(--text-main)" text-anchor="middle">Lysfølsomhed & Støj</text>
      </g>

      <!-- Center EV Badge -->
      <g transform="translate(200, 236)">
        <rect x="-42" y="-12" width="84" height="24" rx="12" fill="var(--bg-surface-elevated, #161b22)" stroke="var(--border-subtle)" />
        <text x="0" y="1" font-size="10" font-weight="700" fill="var(--text-main)" text-anchor="middle" dominant-baseline="middle" font-family="var(--font-mono)">EV ${t.evCurrent.toFixed(1)}</text>
      </g>
    `}renderMeter(t){const e=t.isLocked?t.deltaEv:0,i=(Math.max(-3,Math.min(3,e))+3)/6*100;let a=`${e>=0?"+":""}${e.toFixed(1)} EV`,o="status-balanced",l="Balanceret eksponering",c="Kombinationen matcher dit låste udgangspunkt.";t.isLocked?e<=-.2?(o="status-under",l=`Undereksponeret (${a})`,c="Indstillingerne har nået grænsen og lukker mindre lys ind end dit låste udgangspunkt."):e>=.2&&(o="status-over",l=`Overeksponeret (${a})`,c="Indstillingerne har nået grænsen og lukker mere lys ind end dit låste udgangspunkt."):(o="status-balanced",l="Fri tilstand • Indstil måling",c='Juster blænde, lukker og ISO til hvad dit kamera måler, og tryk derefter på "Lås som udgangspunkt".'),this.meterEl.innerHTML=`
      <div class="ev-meter-scale">
        <div class="meter-tick" style="left: 0%;"><span>-3</span></div>
        <div class="meter-tick" style="left: 16.66%;"><span>-2</span></div>
        <div class="meter-tick" style="left: 33.33%;"><span>-1</span></div>
        <div class="meter-tick center" style="left: 50%;"><span>0</span></div>
        <div class="meter-tick" style="left: 66.66%;"><span>+1</span></div>
        <div class="meter-tick" style="left: 83.33%;"><span>+2</span></div>
        <div class="meter-tick" style="left: 100%;"><span>+3</span></div>
        
        <!-- Nål -->
        <div class="meter-needle ${o}" style="left: ${i}%;"></div>
      </div>
    `;const r=t.isLocked&&t.baseline?`🔒 LÅST TIL EV ${t.baseline.ev.toFixed(1)}`:`🔓 FRI MÅLING (EV ${t.evCurrent.toFixed(1)})`;this.statusTextEl.innerHTML=`
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <span class="fs-badge badge-${o}">${l}</span>
        <span style="font-size: 11px; font-family: var(--font-mono); color: var(--text-muted);">${r}</span>
      </div>
      <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4; margin: 0;">${c}</p>
    `}renderHistogram(t){const i=E.generateHistogramPath(t.deltaEv,240,60),a=t.deltaEv<-1.8,o=t.deltaEv>1.8;this.histSvgEl.setAttribute("viewBox","0 0 240 60"),this.histSvgEl.innerHTML=`
      <defs>
        <linearGradient id="histGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="var(--accent-exposure, #a855f7)" stop-opacity="0.8" />
          <stop offset="100%" stop-color="var(--accent-exposure, #a855f7)" stop-opacity="0.1" />
        </linearGradient>
      </defs>

      <!-- Histogram grid linjer for zoner (skygger, mellemtoner, højlys) -->
      <line x1="${240*.33}" y1="0" x2="${240*.33}" y2="60" stroke="var(--border-subtle)" stroke-dasharray="2,2" />
      <line x1="${240*.66}" y1="0" x2="${240*.66}" y2="60" stroke="var(--border-subtle)" stroke-dasharray="2,2" />

      <!-- Selve kurven -->
      <path d="${i}" fill="url(#histGradient)" stroke="var(--accent-exposure, #a855f7)" stroke-width="1.5" />

      <!-- Clipping indikatorer i kanterne -->
      ${a?'<rect x="0" y="0" width="4" height="60" fill="var(--accent-danger, #ef4444)" opacity="0.9" />':""}
      ${o?'<rect x="236" y="0" width="4" height="60" fill="var(--accent-danger, #ef4444)" opacity="0.9" />':""}
    `}}const Tt={aperture:8,shutter:1/125,iso:100,isLocked:!1,baseline:null,handheldFocal:50,handheldCrop:1,handheldIbis:0,ndBaseShutter:1/125,selectedNdIds:["nd1000"],timerDurationSec:60,timerDarkFrame:!1},Dt=[{name:"Fuld sol",ev:15,aperture:16,shutter:1/125,iso:100,tip:"Klar solskin (Sunny 16)"},{name:"Overskyet",ev:12,aperture:8,shutter:1/125,iso:100,tip:"Diffust dagslys"},{name:"Gylden time",ev:9,aperture:4,shutter:1/125,iso:200,tip:"Solopgang / Solnedgang"},{name:"Indendørs",ev:6,aperture:2.8,shutter:1/60,iso:800,tip:"Hjemme- eller galleribelysning"},{name:"By om natten",ev:3,aperture:2,shutter:1/30,iso:1600,tip:"Gadebelysning & neonskilte"}];class se{container;visualizer=null;state={...Tt};activeTab="triangle";timerInterval=null;timerEndTimeMs=null;timerRemainingSec=60;timerTotalSec=60;timerPhase="idle";timerRunning=!1;wakeLockSentinel=null;mount(t){this.container=t,this.loadState(),this.render(),this.attachEventListeners(),this.updateAllViews(),M.subscribeAmbientEv((e,s)=>{this.updateAmbientEvBanner(e,s),s&&this.applyAmbientEvToCamera(e)}),M.subscribeOpticsSync(e=>{const s=E.findClosestValue(e.aperture,K);if(this.state.aperture=s,M.isAutoEvEnabled()){const o=M.getAmbientLightEstimate(),l=E.solveShutter(this.state.aperture,this.state.iso,o.ev100);this.state.shutter=E.findClosestValue(l,H)}else if(this.state.isLocked&&this.state.baseline){const o=E.solveShutter(this.state.aperture,this.state.iso,this.state.baseline.ev);this.state.shutter=E.findClosestValue(o,H)}this.state.handheldFocal=Math.min(600,Math.max(10,Math.round(e.focalLength))),this.state.handheldCrop=E.findClosestValue(e.cropFactor,[1,1.5,2]);const i=this.container.querySelector("#sliderHandheldFocal");i&&(i.value=String(this.state.handheldFocal));const a=this.container.querySelector("#selectHandheldCrop");a&&(a.value=String(this.state.handheldCrop)),this.syncSlidersFromState(),this.updateAllViews(),this.saveState()}),this.updateAmbientEvBanner(M.getAmbientLightEstimate(),M.isAutoEvEnabled())}applyAmbientEvToCamera(t){let e=this.state.iso;t.ev100<=2&&e<1600?e=1600:t.ev100<=6&&e<400?e=400:t.ev100>=12&&e>400&&(e=100),this.state.iso=e;const s=E.solveShutter(this.state.aperture,this.state.iso,t.ev100);this.state.shutter=E.findClosestValue(s,H),this.state.baseline={aperture:this.state.aperture,shutter:this.state.shutter,iso:this.state.iso,ev:t.ev100},this.state.isLocked=!0,this.syncSlidersFromState(),this.updateTriangleView(),this.saveState()}updateAmbientEvBanner(t,e){const s=this.container.querySelector("#expAmbientLabel"),i=this.container.querySelector("#expAmbientEvVal"),a=this.container.querySelector("#btnToggleAutoEv");s&&(s.textContent=`${t.label} (Sol ${t.sunAltitude>=0?"+":""}${t.sunAltitude.toFixed(1)}°)`),i&&(i.textContent=`EV ${t.ev100.toFixed(1)}`),a&&(a.classList.toggle("active",e),a.textContent=e?"⚡ Auto-EV fra Sol/Vejr: TIL":"🔗 Auto-EV fra Sol/Vejr: FRA")}loadState(){try{const t=localStorage.getItem("fs_exposure_state_v1");t&&(this.state={...Tt,...JSON.parse(t)})}catch(t){console.warn("Kunne ikke hente gemt tilstand for Eksponering:",t)}}saveState(){try{localStorage.setItem("fs_exposure_state_v1",JSON.stringify(this.state))}catch(t){console.warn("Kunne ikke gemme tilstand for Eksponering:",t)}}render(){const t=te.map(r=>`<button class="quick-val-btn ${r===this.state.aperture?"active":""}" data-aperture="${r}">f/${r}</button>`).join(""),e=[1/1e3,1/500,1/250,1/125,1/60,1/15,1/2,1,4,15,30].map(r=>`<button class="quick-val-btn ${Math.abs(r-this.state.shutter)<1e-4?"active":""}" data-shutter="${r}">${E.formatShutterSpeed(r)}</button>`).join(""),s=[100,200,400,800,1600,3200,6400].map(r=>`<button class="quick-val-btn ${r===this.state.iso?"active":""}" data-iso="${r}">ISO ${r}</button>`).join(""),i=wt.map(r=>`
        <button class="nd-filter-btn ${this.state.selectedNdIds.includes(r.id)?"active":""}" data-nd-id="${r.id}">
          <div class="nd-btn-name">${r.name}</div>
          <div class="nd-btn-stops">${r.stops>=0?"+":""}${r.stops} ${r.stops===1?"stop":"stops"}</div>
          <div class="nd-btn-density">OD ${r.opticalDensity.toFixed(1)}</div>
        </button>
      `).join("");this.container.innerHTML=`
      <div class="exposure-container desktop-exposure-panel">
        <!-- DESKTOP AUTO-EV SYNKRONISERINGS-BAR (FRA SOL & VEJR) -->
        <div class="desktop-auto-ev-bar">
          <div class="auto-ev-info">
            <span class="auto-ev-title">☀️ Beregnet lys fra Sol & Vejr: <strong id="expAmbientEvVal" class="tabular-nums">EV 13.0</strong></span>
            <span class="auto-ev-sub" id="expAmbientLabel">Dagslys</span>
          </div>
          <button class="fs-btn auto-ev-toggle-btn" id="btnToggleAutoEv" title="Når slået til, følger kameraets eksponering automatisk solhøjden og skydækket når du trækker i tidslinjen">
            🔗 Auto-EV fra Sol/Vejr: FRA
          </button>
        </div>

        <!-- HOVED FANE-VÆLGER -->
        <div class="fs-segmented-control" style="width: 100%;">
          <button class="fs-segment-btn ${this.activeTab==="triangle"?"active":""}" data-exp-tab="triangle">📐 Trekant</button>
          <button class="fs-segment-btn ${this.activeTab==="shutter"?"active":""}" data-exp-tab="shutter">⏱️ Lukkertid</button>
          <button class="fs-segment-btn ${this.activeTab==="nd"?"active":""}" data-exp-tab="nd">🔲 ND-filter</button>
          <button class="fs-segment-btn ${this.activeTab==="timer"?"active":""}" data-exp-tab="timer">⏳ Bulb Timer</button>
        </div>

        <!-- ==================== FANE 1: EKSPONERINGSTREKANT ==================== -->
        <div id="tabContentTriangle" style="${this.activeTab==="triangle"?"":"display: none;"}">
          <div class="exposure-hero-card">
            <div class="exposure-hero-header">
              <div class="hero-title-group">
                <span class="hero-main-title">Eksponeringstrekanten</span>
                <span class="hero-sub-title">Samspillet mellem blænde, lukkertid & ISO</span>
              </div>
              <div style="display:flex;gap:6px;align-items:center;">
                <span class="fs-badge tabular-nums" id="expCurrentEvBadge">EV 13.0</span>
                <span class="fs-badge" id="expLockBadge">Fri tilstand</span>
              </div>
            </div>

            <div class="triangle-svg-wrap">
              <svg class="triangle-svg" id="expTriangleSvg" viewBox="0 0 400 320"></svg>
            </div>

            <div class="ev-meter-wrap" id="expMeterWrap"></div>

            <div class="histogram-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Simuleret Tonal Fordeling</span>
                <span style="font-size: 10px; color: var(--text-dim);">Skygger • Mellemtoner • Højlys</span>
              </div>
              <svg class="hist-svg" id="expHistSvg"></svg>
              <div class="hist-labels">
                <span>0 (Sort)</span>
                <span>Mellem</span>
                <span>255 (Hvid)</span>
              </div>
            </div>

            <div id="expStatusTextWrap"></div>
          </div>

          <div id="expBaselineMount"></div>

          <div class="fs-card" style="margin-bottom:0;">
            <div class="fs-card-header">
              <span class="fs-card-title">Kameraindstillinger</span>
              <div style="display: flex; gap: 4px;" id="scenePresetWrap">
                <select class="fs-btn" id="scenePresetSelect" style="padding: 3px 8px; font-size: 11px; min-height: 26px;">
                  <option value="" disabled selected>Hurtig lysscene...</option>
                  ${Dt.map((r,n)=>`<option value="${n}">${r.name} (EV ${r.ev})</option>`).join("")}
                </select>
              </div>
            </div>

            <!-- 1. BLÆNDE -->
            <div class="fs-slider-wrap">
              <div class="fs-slider-header">
                <span class="fs-slider-label">Blænde <span style="font-size:10px;color:var(--text-dim);">• Lysåbning</span></span>
                <span class="fs-slider-val" id="dispAperture" style="color: #f59e0b;">f/${this.state.aperture}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="fs-btn-icon" id="btnApertureMinus">-</button>
                <input type="range" id="sliderAperture" min="0" max="${K.length-1}" step="1" value="0">
                <button class="fs-btn-icon" id="btnAperturePlus">+</button>
              </div>
              <div class="quick-btn-scroll" id="apertureQuickScroll">${t}</div>
            </div>

            <!-- 2. LUKKERTID -->
            <div class="fs-slider-wrap" style="margin-top: var(--space-3);">
              <div class="fs-slider-header">
                <span class="fs-slider-label">Lukkertid <span style="font-size:10px;color:var(--text-dim);">• Eksponeringstid</span></span>
                <span class="fs-slider-val" id="dispShutter" style="color: #38bdf8;">${E.formatShutterSpeed(this.state.shutter)}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="fs-btn-icon" id="btnShutterMinus">-</button>
                <input type="range" id="sliderShutter" min="0" max="${H.length-1}" step="1" value="0">
                <button class="fs-btn-icon" id="btnShutterPlus">+</button>
              </div>
              <div class="quick-btn-scroll" id="shutterQuickScroll">${e}</div>
            </div>

            <!-- 3. ISO -->
            <div class="fs-slider-wrap" style="margin-top: var(--space-3);">
              <div class="fs-slider-header">
                <span class="fs-slider-label">Lysfølsomhed <span style="font-size:10px;color:var(--text-dim);">• ISO</span></span>
                <span class="fs-slider-val" id="dispIso" style="color: #a855f7;">ISO ${this.state.iso}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="fs-btn-icon" id="btnIsoMinus">-</button>
                <input type="range" id="sliderIso" min="0" max="${W.length-1}" step="1" value="0">
                <button class="fs-btn-icon" id="btnIsoPlus">+</button>
              </div>
              <div class="quick-btn-scroll" id="isoQuickScroll">${s}</div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 12px; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
              <button class="fs-btn" id="btnTransferToNd" style="padding: 6px 12px; font-size: 12px; min-height: 30px;">
                Brug denne lukkertid i ND-filter →
              </button>
            </div>
          </div>
        </div>

        <!-- ==================== FANE 2: LUKKERTID & BEVÆGELSE ==================== -->
        <div id="tabContentShutter" style="${this.activeTab==="shutter"?"":"display: none;"}">
          <div class="fs-card">
            <div class="fs-card-header">
              <span class="fs-card-title">Håndholdt Rysteregel</span>
              <span class="fs-badge" id="handheldResultBadge">1/50s</span>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4; margin-bottom: 10px;" id="handheldAdviceText"></p>

            <div class="fs-slider-wrap">
              <div class="fs-slider-header">
                <span class="fs-slider-label">Optik Brændvidde</span>
                <span class="fs-slider-val" id="dispHHandheldFocal">${this.state.handheldFocal} mm</span>
              </div>
              <input type="range" id="sliderHandheldFocal" min="10" max="600" step="1" value="${this.state.handheldFocal}">
              <div class="quick-btn-scroll">
                ${[24,35,50,85,135,200,400].map(r=>`<button class="quick-val-btn ${r===this.state.handheldFocal?"active":""}" data-focal-h="${r}">${r}mm</button>`).join("")}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
              <div>
                <label style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 4px;">Sensorformat</label>
                <select class="fs-btn" id="selectHandheldCrop" style="width: 100%; padding: 8px; font-size: 12px;">
                  <option value="1.0" ${this.state.handheldCrop===1?"selected":""}>Full Frame [1.0×]</option>
                  <option value="1.5" ${this.state.handheldCrop===1.5?"selected":""}>APS-C [1.5×]</option>
                  <option value="2.0" ${this.state.handheldCrop===2?"selected":""}>Micro Four Thirds [2.0×]</option>
                </select>
              </div>
              <div>
                <label style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 4px;">Billedstabilisering (IBIS / IS)</label>
                <select class="fs-btn" id="selectHandheldIbis" style="width: 100%; padding: 8px; font-size: 12px;">
                  <option value="0" ${this.state.handheldIbis===0?"selected":""}>Ingen stabilisering</option>
                  <option value="2" ${this.state.handheldIbis===2?"selected":""}>2 stops (Let IS)</option>
                  <option value="3" ${this.state.handheldIbis===3?"selected":""}>3 stops (Standard)</option>
                  <option value="4" ${this.state.handheldIbis===4?"selected":""}>4 stops (Moderne)</option>
                  <option value="5" ${this.state.handheldIbis===5?"selected":""}>5 stops (Effektiv IBIS)</option>
                  <option value="6" ${this.state.handheldIbis===6?"selected":""}>6 stops (Avanceret sync)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="fs-card">
            <div class="fs-card-header">
              <span class="fs-card-title">Astrofoto • Punktformede Stjerner</span>
              <span class="fs-badge" style="background: rgba(168, 85, 247, 0.2); color: #c084fc;" id="astro500Badge">--</span>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4; margin-bottom: 8px;" id="astroRuleDesc"></p>
            <div style="display: flex; gap: 8px; font-size: 11px; font-family: var(--font-mono); color: var(--text-dim);">
              <span>500-reglen: <strong id="astroT500" style="color: var(--text-main);">--</strong></span>
              <span>•</span>
              <span>300-reglen (højopløst): <strong id="astroT300" style="color: var(--text-main);">--</strong></span>
            </div>
          </div>

          <div class="fs-card" style="margin-bottom:0;">
            <div class="fs-card-header">
              <span class="fs-card-title">Motivscenarier & Frysning</span>
              <span style="font-size: 11px; color: var(--text-dim);">Klik for at vælge tid</span>
            </div>
            <div class="shutter-scenarios-grid">
              ${Et.map(r=>`
                <div class="shutter-scenario-card" data-scenario-id="${r.id}">
                  <div class="scenario-header-row">
                    <strong style="font-size: 13px; color: var(--text-main);">${r.title}</strong>
                    <span class="scenario-badge-time">${r.recommendedRange}</span>
                  </div>
                  <p style="font-size: 12px; color: var(--text-muted); margin: 0;">${r.description}</p>
                  <span style="font-size: 11px; color: var(--text-dim); font-style: italic;">💡 ${r.tip}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- ==================== FANE 3: ND-FILTER BEREGNER ==================== -->
        <div id="tabContentNd" style="${this.activeTab==="nd"?"":"display: none;"}">
          <div class="fs-card" style="margin-bottom:0;">
            <div class="fs-card-header">
              <span class="fs-card-title">ND-Filterberegner & Stacking</span>
              <button class="fs-btn" id="btnSyncFromTriangle" style="padding: 3px 8px; font-size: 11px; min-height: 26px;">
                🔄 Hent lukkertid fra trekant
              </button>
            </div>

            <div class="fs-slider-wrap">
              <div class="fs-slider-header">
                <span class="fs-slider-label">Basiseksponering (Uden filter)</span>
                <span class="fs-slider-val" id="dispNdBase" style="color: #38bdf8;">${E.formatShutterSpeed(this.state.ndBaseShutter)}</span>
              </div>
              <input type="range" id="sliderNdBase" min="0" max="${H.length-1}" step="1" value="0">
              <div class="quick-btn-scroll" id="ndBaseQuickScroll">
                ${[1/1e3,1/500,1/250,1/125,1/60,1/30,1/15,1/4,1].map(r=>`
                  <button class="quick-val-btn ${Math.abs(r-this.state.ndBaseShutter)<1e-4?"active":""}" data-nd-base="${r}">
                    ${E.formatShutterSpeed(r)}
                  </button>
                `).join("")}
              </div>
            </div>

            <div style="margin-top: var(--space-3);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">
                  Monterede filtre (Stacking)
                </span>
                <button class="fs-btn" id="btnClearFilters" style="padding: 2px 6px; font-size: 10px; min-height: 22px;">Nulstil filtre</button>
              </div>
              <div class="nd-filters-grid" id="ndFiltersGrid">${i}</div>
            </div>

            <div class="nd-result-box">
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--accent-exposure, #a855f7); letter-spacing: 0.06em;">
                Ny Beregnet Eksponeringstid
              </div>
              <div class="nd-calc-value tabular-nums" id="dispNdFinalTime">--</div>
              <div style="display: flex; justify-content: center; gap: 14px; font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">
                <span>Reduktion: <strong id="dispNdTotalStops" style="color: var(--text-main);">0 stops</strong></span>
                <span>•</span>
                <span>Faktor: <strong id="dispNdFactor" style="color: var(--text-main);">1×</strong></span>
                <span>•</span>
                <span>OD: <strong id="dispNdOd" style="color: var(--text-main);">0.0</strong></span>
              </div>
              <div style="display: flex; justify-content: center; gap: 8px; margin-top: 4px;">
                <button class="fs-btn fs-btn-accent-sun" id="btnTransferToTimer" style="padding: 8px 16px; font-size: 13px; font-weight: 700; min-height: 36px;">
                  ⏳ Start Bulb Timer med denne tid →
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== FANE 4: BULB TIMER ==================== -->
        <div id="tabContentTimer" style="${this.activeTab==="timer"?"":"display: none;"}">
          <div class="fs-card" style="margin-bottom:0;">
            <div class="fs-card-header">
              <span class="fs-card-title">Bulb Nedtællingstimer</span>
              <span class="fs-badge" id="timerStatusBadge">Klar</span>
            </div>

            <div class="bulb-timer-wrap">
              <div class="timer-circle-wrap">
                <svg class="timer-svg" viewBox="0 0 200 200">
                  <circle class="timer-circle-bg" cx="100" cy="100" r="85"></circle>
                  <circle class="timer-circle-progress" id="timerCircleProgress" cx="100" cy="100" r="85"
                          stroke-dasharray="534.07"
                          stroke-dashoffset="0"></circle>
                </svg>
                <div class="timer-display-inner">
                  <div class="timer-time-main tabular-nums" id="timerDisplayNumber">01:00</div>
                  <div class="timer-phase-label" id="timerPhaseLabel">Eksponering</div>
                </div>
              </div>

              <div class="timer-controls-row">
                <button class="fs-btn fs-btn-accent-sun" id="btnTimerStartPause" style="flex: 2; min-height: 40px; font-weight: 700; font-size: 14px;">
                  Start Optagelse
                </button>
                <button class="fs-btn" id="btnTimerReset" style="flex: 1; min-height: 40px;">
                  Nulstil
                </button>
              </div>

              <div class="quick-btn-scroll" style="justify-content: center; width: 100%;">
                ${[15,30,60,120,240,480].map(r=>`
                  <button class="quick-val-btn ${r===this.state.timerDurationSec?"active":""}" data-timer-preset="${r}">
                    ${E.formatShutterSpeed(r)}
                  </button>
                `).join("")}
              </div>
            </div>

            <div style="background: var(--bg-surface-elevated); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-top: 8px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <strong style="font-size: 12px; color: var(--text-main); display: block;">Dark Frame (LENR)</strong>
                <span style="font-size: 11px; color: var(--text-muted); display: block;">
                  Tæller ekstra tid til kameraets indbyggede støjreduktion
                </span>
              </div>
              <input type="checkbox" id="checkDarkFrame" ${this.state.timerDarkFrame?"checked":""} style="width: 18px; height: 18px; cursor: pointer;">
            </div>
          </div>
        </div>
      </div>
    `;const a=this.container.querySelector("#expTriangleSvg"),o=this.container.querySelector("#expMeterWrap"),l=this.container.querySelector("#expHistSvg"),c=this.container.querySelector("#expStatusTextWrap");a&&o&&l&&c&&(this.visualizer=new ee(a,o,l,c)),this.syncSlidersFromState()}attachEventListeners(){this.container.querySelector("#btnToggleAutoEv")?.addEventListener("click",()=>{const n=!M.isAutoEvEnabled();M.setAutoEvEnabled(n)}),this.container.querySelectorAll("[data-exp-tab]").forEach(n=>{n.addEventListener("click",()=>{const d=n.dataset.expTab;this.switchTab(d)})});const t=this.container.querySelector("#scenePresetSelect");t?.addEventListener("change",()=>{const n=Number(t.value),d=Dt[n];d&&(M.setAutoEvEnabled(!1),this.state.aperture=d.aperture,this.state.shutter=d.shutter,this.state.iso=d.iso,this.state.isLocked=!1,this.state.baseline=null,this.syncSlidersFromState(),this.updateTriangleView(),this.saveState())});const e=this.container.querySelector("#sliderAperture");e?.addEventListener("input",()=>{const n=Number(e.value);this.handleApertureChange(K[n]||8)}),this.container.querySelector("#btnApertureMinus")?.addEventListener("click",()=>{const n=K.indexOf(this.state.aperture);n>0&&this.handleApertureChange(K[n-1])}),this.container.querySelector("#btnAperturePlus")?.addEventListener("click",()=>{const n=K.indexOf(this.state.aperture);n<K.length-1&&this.handleApertureChange(K[n+1])}),this.container.querySelectorAll("[data-aperture]").forEach(n=>{n.addEventListener("click",()=>{this.handleApertureChange(Number(n.dataset.aperture))})});const s=this.container.querySelector("#sliderShutter");s?.addEventListener("input",()=>{const n=Number(s.value);this.handleShutterChange(H[n]||1/125)}),this.container.querySelector("#btnShutterMinus")?.addEventListener("click",()=>{const n=H.indexOf(this.state.shutter);n>0&&this.handleShutterChange(H[n-1])}),this.container.querySelector("#btnShutterPlus")?.addEventListener("click",()=>{const n=H.indexOf(this.state.shutter);n<H.length-1&&this.handleShutterChange(H[n+1])}),this.container.querySelectorAll("[data-shutter]").forEach(n=>{n.addEventListener("click",()=>{this.handleShutterChange(Number(n.dataset.shutter))})});const i=this.container.querySelector("#sliderIso");i?.addEventListener("input",()=>{const n=Number(i.value);this.handleIsoChange(W[n]||100)}),this.container.querySelector("#btnIsoMinus")?.addEventListener("click",()=>{const n=W.indexOf(this.state.iso);n>0&&this.handleIsoChange(W[n-1])}),this.container.querySelector("#btnIsoPlus")?.addEventListener("click",()=>{const n=W.indexOf(this.state.iso);n<W.length-1&&this.handleIsoChange(W[n+1])}),this.container.querySelectorAll("[data-iso]").forEach(n=>{n.addEventListener("click",()=>{this.handleIsoChange(Number(n.dataset.iso))})}),this.container.querySelector("#btnTransferToNd")?.addEventListener("click",()=>{this.state.ndBaseShutter=this.state.shutter,this.switchTab("nd"),this.updateNdView(),this.saveState()});const a=this.container.querySelector("#sliderHandheldFocal");a?.addEventListener("input",()=>{this.state.handheldFocal=Number(a.value),this.updateHandheldView(),this.saveState()}),this.container.querySelectorAll("[data-focal-h]").forEach(n=>{n.addEventListener("click",()=>{const d=Number(n.dataset.focalH);this.state.handheldFocal=d,a&&(a.value=String(d)),this.updateHandheldView(),this.saveState()})});const o=this.container.querySelector("#selectHandheldCrop");o?.addEventListener("change",()=>{this.state.handheldCrop=Number(o.value),this.updateHandheldView(),this.saveState()});const l=this.container.querySelector("#selectHandheldIbis");l?.addEventListener("change",()=>{this.state.handheldIbis=Number(l.value),this.updateHandheldView(),this.saveState()}),this.container.querySelectorAll("[data-scenario-id]").forEach(n=>{n.addEventListener("click",()=>{const d=n.dataset.scenarioId,h=Et.find(u=>u.id===d);if(h){const u=(h.minShutter+h.maxShutter)/2,m=E.findClosestValue(u,H);this.handleShutterChange(m),this.switchTab("triangle")}})});const c=this.container.querySelector("#sliderNdBase");c?.addEventListener("input",()=>{const n=Number(c.value);this.state.ndBaseShutter=H[n]||1/125,this.updateNdView(),this.saveState()}),this.container.querySelectorAll("[data-nd-base]").forEach(n=>{n.addEventListener("click",()=>{const d=Number(n.dataset.ndBase);if(this.state.ndBaseShutter=d,c){const h=H.indexOf(d);h!==-1&&(c.value=String(h))}this.updateNdView(),this.saveState()})}),this.container.querySelector("#btnSyncFromTriangle")?.addEventListener("click",()=>{this.state.ndBaseShutter=this.state.shutter,this.updateNdView(),this.saveState()}),this.container.querySelectorAll("[data-nd-id]").forEach(n=>{n.addEventListener("click",()=>{const d=n.dataset.ndId,h=this.state.selectedNdIds.indexOf(d);h>=0?this.state.selectedNdIds.splice(h,1):this.state.selectedNdIds.push(d),this.updateNdView(),this.saveState()})}),this.container.querySelector("#btnClearFilters")?.addEventListener("click",()=>{this.state.selectedNdIds=[],this.updateNdView(),this.saveState()}),this.container.querySelector("#btnTransferToTimer")?.addEventListener("click",()=>{const n=this.calculateTotalNdStops(),d=E.calculateNdExposure(this.state.ndBaseShutter,n);this.setTimerDuration(Math.round(d.newShutter)),this.switchTab("timer")}),this.container.querySelector("#btnTimerStartPause")?.addEventListener("click",()=>{this.toggleTimer()}),this.container.querySelector("#btnTimerReset")?.addEventListener("click",()=>{this.resetTimer()}),this.container.querySelectorAll("[data-timer-preset]").forEach(n=>{n.addEventListener("click",()=>{const d=Number(n.dataset.timerPreset);this.setTimerDuration(d)})});const r=this.container.querySelector("#checkDarkFrame");r?.addEventListener("change",()=>{this.state.timerDarkFrame=r.checked,this.saveState()})}switchTab(t){this.activeTab=t,this.container.querySelectorAll("[data-exp-tab]").forEach(o=>{o.classList.toggle("active",o.dataset.expTab===t)});const e=this.container.querySelector("#tabContentTriangle"),s=this.container.querySelector("#tabContentShutter"),i=this.container.querySelector("#tabContentNd"),a=this.container.querySelector("#tabContentTimer");e&&(e.style.display=t==="triangle"?"block":"none"),s&&(s.style.display=t==="shutter"?"block":"none"),i&&(i.style.display=t==="nd"?"block":"none"),a&&(a.style.display=t==="timer"?"block":"none"),this.updateAllViews()}handleApertureChange(t){if(this.state.aperture=t,this.state.isLocked&&this.state.baseline){const e=E.solveShutter(this.state.aperture,this.state.iso,this.state.baseline.ev);this.state.shutter=E.findClosestValue(e,H)}this.syncSlidersFromState(),this.updateTriangleView(),this.saveState()}handleShutterChange(t){if(this.state.shutter=t,this.state.isLocked&&this.state.baseline){const e=E.solveAperture(this.state.shutter,this.state.iso,this.state.baseline.ev);this.state.aperture=E.findClosestValue(e,K)}this.syncSlidersFromState(),this.updateTriangleView(),this.saveState()}handleIsoChange(t){if(this.state.iso=t,this.state.isLocked&&this.state.baseline){const e=E.solveShutter(this.state.aperture,this.state.iso,this.state.baseline.ev);this.state.shutter=E.findClosestValue(e,H)}this.syncSlidersFromState(),this.updateTriangleView(),this.saveState()}syncSlidersFromState(){const t=this.container.querySelector("#sliderAperture"),e=this.container.querySelector("#sliderShutter"),s=this.container.querySelector("#sliderIso");if(t){const i=K.indexOf(this.state.aperture);i!==-1&&(t.value=String(i))}if(e){const i=H.indexOf(this.state.shutter);i!==-1&&(e.value=String(i))}if(s){const i=W.indexOf(this.state.iso);i!==-1&&(s.value=String(i))}this.container.querySelectorAll("[data-aperture]").forEach(i=>{const a=Number(i.dataset.aperture);i.classList.toggle("active",Math.abs(a-this.state.aperture)<.05)}),this.container.querySelectorAll("[data-shutter]").forEach(i=>{const a=Number(i.dataset.shutter);i.classList.toggle("active",Math.abs(a-this.state.shutter)<1e-4)}),this.container.querySelectorAll("[data-iso]").forEach(i=>{const a=Number(i.dataset.iso);i.classList.toggle("active",a===this.state.iso)})}updateAllViews(){this.updateTriangleView(),this.updateHandheldView(),this.updateNdView(),this.updateTimerDisplay()}updateTriangleView(){const t=E.calculateEV100(this.state.aperture,this.state.shutter),e=E.calculateEV(this.state.aperture,this.state.shutter,this.state.iso),s=this.state.isLocked&&this.state.baseline?this.state.baseline.ev:e,i=E.calculateMeterDelta(this.state.aperture,this.state.shutter,this.state.iso,s),a=this.container.querySelector("#expCurrentEvBadge");a&&(a.textContent=`EV ${e.toFixed(1)}`);const o=this.container.querySelector("#expLockBadge");o&&(this.state.isLocked&&this.state.baseline?(o.textContent=`🔒 Låst (EV ${this.state.baseline.ev.toFixed(1)})`,o.className="fs-badge badge-exposure"):(o.textContent="🔓 Fri tilstand",o.className="fs-badge"));const l=this.container.querySelector("#dispAperture"),c=this.container.querySelector("#dispShutter"),r=this.container.querySelector("#dispIso");l&&(l.textContent=`f/${this.state.aperture}`),c&&(c.textContent=E.formatShutterSpeed(this.state.shutter)),r&&(r.textContent=`ISO ${this.state.iso}`),this.renderBaselineSection(i),this.visualizer?.render({aperture:this.state.aperture,shutter:this.state.shutter,iso:this.state.iso,ev100:t,evCurrent:e,targetEv:s,deltaEv:i,isLocked:this.state.isLocked,baseline:this.state.baseline})}renderBaselineSection(t){const e=this.container.querySelector("#expBaselineMount");if(e)if(!this.state.isLocked||!this.state.baseline)e.innerHTML=`
        <div class="exposure-instruction-banner">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
              <strong style="color: var(--text-main); display: block;">Lås eksponering eller slå Auto-EV til øverst</strong>
              Lås dit udgangspunkt for at udforske ækvivalente lukkertider og blænder.
            </div>
            <button class="fs-btn fs-btn-accent-sun" id="btnLockBaseline" style="padding: 6px 14px; font-size: 12px; font-weight: 700; min-height: 34px;">
              🔒 Lås udgangspunkt
            </button>
          </div>
        </div>
      `,e.querySelector("#btnLockBaseline")?.addEventListener("click",()=>{const s=E.calculateEV(this.state.aperture,this.state.shutter,this.state.iso);this.state.baseline={aperture:this.state.aperture,shutter:this.state.shutter,iso:this.state.iso,ev:Number(s.toFixed(1))},this.state.isLocked=!0,this.updateTriangleView(),this.saveState()});else{const s=this.state.baseline,i=E.calculateApertureStopsDiff(s.aperture,this.state.aperture),a=E.calculateShutterStopsDiff(s.shutter,this.state.shutter),o=E.calculateIsoStopsDiff(s.iso,this.state.iso);let l="✅ <strong>Gensidighedsloven:</strong> Eksponeringen matcher mål-EV (0 EV afvigelse).";t<=-.2?l=`⚠️ <strong>Grænseværdi:</strong> ${Math.abs(t).toFixed(1)} stops for mørkt.`:t>=.2&&(l=`⚠️ <strong>Grænseværdi:</strong> ${t.toFixed(1)} stops for lyst.`),e.innerHTML=`
        <div class="exposure-baseline-card">
          <div class="baseline-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">🎯</span>
              <div>
                <strong style="font-size: 12px; color: var(--text-main);">Låst mål-eksponering (EV ${s.ev.toFixed(1)})</strong>
                <span style="font-size: 11px; color: var(--text-muted); display: block; font-family: var(--font-mono);">
                  Ref: f/${s.aperture} • ${E.formatShutterSpeed(s.shutter)} • ISO ${s.iso}
                </span>
              </div>
            </div>
            <button class="fs-btn" id="btnUnlockBaseline" style="padding: 4px 10px; font-size: 11px; min-height: 26px;">
              🔓 Frigør
            </button>
          </div>

          <div class="baseline-diff-grid">
            <div class="diff-item">
              <span class="diff-label">Blænde</span>
              <span class="diff-val">${E.formatStopsDiff(i)}</span>
            </div>
            <div class="diff-item">
              <span class="diff-label">Lukkertid</span>
              <span class="diff-val highlight-shutter">${E.formatStopsDiff(a)}</span>
            </div>
            <div class="diff-item">
              <span class="diff-label">ISO</span>
              <span class="diff-val highlight-iso">${E.formatStopsDiff(o)}</span>
            </div>
          </div>
          <div class="baseline-summary-text">${l}</div>
        </div>
      `,e.querySelector("#btnUnlockBaseline")?.addEventListener("click",()=>{M.setAutoEvEnabled(!1),this.state.isLocked=!1,this.state.baseline=null,this.updateTriangleView(),this.saveState()})}}updateHandheldView(){const t=E.calculateHandheldShutter(this.state.handheldFocal,this.state.handheldCrop,this.state.handheldIbis),e=E.calculateAstroShutter(this.state.handheldFocal,this.state.handheldCrop),s=this.container.querySelector("#dispHHandheldFocal"),i=this.container.querySelector("#handheldResultBadge"),a=this.container.querySelector("#handheldAdviceText");s&&(s.textContent=`${this.state.handheldFocal} mm`),i&&(i.textContent=t.displayStabilized),a&&(a.textContent=t.description);const o=this.container.querySelector("#astro500Badge"),l=this.container.querySelector("#astroRuleDesc"),c=this.container.querySelector("#astroT500"),r=this.container.querySelector("#astroT300");o&&(o.textContent=`${e.display500} maks`),l&&(l.textContent=e.tip),c&&(c.textContent=e.display500),r&&(r.textContent=e.display300),this.container.querySelectorAll("[data-focal-h]").forEach(n=>{const d=Number(n.dataset.focalH);n.classList.toggle("active",d===this.state.handheldFocal)})}calculateTotalNdStops(){let t=0;for(const e of this.state.selectedNdIds){const s=wt.find(i=>i.id===e);s&&(t+=s.stops)}return t}updateNdView(){const t=this.calculateTotalNdStops(),e=E.calculateNdExposure(this.state.ndBaseShutter,t),s=this.container.querySelector("#dispNdBase"),i=this.container.querySelector("#dispNdFinalTime"),a=this.container.querySelector("#dispNdTotalStops"),o=this.container.querySelector("#dispNdFactor"),l=this.container.querySelector("#dispNdOd");s&&(s.textContent=E.formatShutterSpeed(this.state.ndBaseShutter)),i&&(i.textContent=e.displayTime),a&&(a.textContent=`${t} stops`),o&&(o.textContent=`${Math.round(e.factor)}×`),l&&(l.textContent=`${e.opticalDensity.toFixed(1)}`),this.container.querySelectorAll("[data-nd-id]").forEach(c=>{const r=c.dataset.ndId;c.classList.toggle("active",this.state.selectedNdIds.includes(r))}),this.container.querySelectorAll("[data-nd-base]").forEach(c=>{const r=Number(c.dataset.ndBase);c.classList.toggle("active",Math.abs(r-this.state.ndBaseShutter)<1e-4)})}setTimerDuration(t){this.state.timerDurationSec=Math.max(1,t),this.resetTimer(),this.saveState()}toggleTimer(){this.timerRunning?this.pauseTimer():this.startTimer()}startTimer(){(this.timerPhase==="idle"||this.timerPhase==="finished")&&(this.timerTotalSec=this.state.timerDurationSec,this.timerRemainingSec=this.timerTotalSec,this.timerPhase="exposure"),this.timerRunning=!0,this.timerEndTimeMs=Date.now()+this.timerRemainingSec*1e3;const t=this.container.querySelector("#btnTimerStartPause");t&&(t.textContent="Pause",t.classList.remove("fs-btn-accent-sun")),this.timerInterval&&clearInterval(this.timerInterval),this.timerInterval=window.setInterval(()=>{this.tickTimer()},250),this.updateTimerDisplay()}pauseTimer(){if(this.timerRunning&&this.timerEndTimeMs!==null){const e=Math.max(0,this.timerEndTimeMs-Date.now());this.timerRemainingSec=Math.ceil(e/1e3)}this.timerRunning=!1,this.timerEndTimeMs=null,this.timerInterval&&(clearInterval(this.timerInterval),this.timerInterval=null);const t=this.container.querySelector("#btnTimerStartPause");t&&(t.textContent="Fortsæt Optagelse",t.classList.add("fs-btn-accent-sun")),this.updateTimerDisplay()}resetTimer(){this.timerRunning=!1,this.timerEndTimeMs=null,this.timerInterval&&(clearInterval(this.timerInterval),this.timerInterval=null),this.timerPhase="idle",this.timerRemainingSec=this.state.timerDurationSec,this.timerTotalSec=this.state.timerDurationSec;const t=this.container.querySelector("#btnTimerStartPause");t&&(t.textContent="Start Optagelse",t.classList.add("fs-btn-accent-sun")),this.updateTimerDisplay()}tickTimer(){const t=Date.now(),e=Math.max(0,(this.timerEndTimeMs??t)-t);if(this.timerRemainingSec=Math.ceil(e/1e3),e<=0)if(this.playCompletionSound(),this.timerPhase==="exposure"&&this.state.timerDarkFrame)this.timerPhase="darkframe",this.timerTotalSec=this.state.timerDurationSec,this.timerRemainingSec=this.timerTotalSec,this.timerEndTimeMs=Date.now()+this.timerTotalSec*1e3;else{this.timerPhase="finished",this.timerRemainingSec=0,this.timerEndTimeMs=null,this.pauseTimer();const s=this.container.querySelector("#btnTimerStartPause");s&&(s.textContent="Start Igen")}this.updateTimerDisplay()}updateTimerDisplay(){const t=this.container.querySelector("#timerDisplayNumber"),e=this.container.querySelector("#timerPhaseLabel"),s=this.container.querySelector("#timerStatusBadge"),i=this.container.querySelector("#timerCircleProgress"),a=Math.floor(this.timerRemainingSec/60),o=this.timerRemainingSec%60;t&&(t.textContent=`${String(a).padStart(2,"0")}:${String(o).padStart(2,"0")}`);let l="Eksponering",c="Klar",r="var(--accent-exposure, #a855f7)";if(this.timerPhase==="exposure"?(l=this.timerRunning?"Optager lys...":"Pause",c="Lukker Åben"):this.timerPhase==="darkframe"?(l="Dark Frame (LENR)",c="Dark Frame",r="var(--accent-sun, #f59e0b)"):this.timerPhase==="finished"&&(l="Færdig!",c="Gennemført",r="var(--accent-success, #10b981)"),e&&(e.textContent=l,e.style.color=r),s&&(s.textContent=c,s.className=`fs-badge ${this.timerRunning?"badge-sun":""}`),i){const d=this.timerTotalSec>0?this.timerRemainingSec/this.timerTotalSec:0;i.style.strokeDashoffset=String(534.07*(1-d)),i.style.stroke=r}this.container.querySelectorAll("[data-timer-preset]").forEach(n=>{const d=Number(n.dataset.timerPreset);n.classList.toggle("active",d===this.state.timerDurationSec)})}playCompletionSound(){try{const t=window.AudioContext||window.webkitAudioContext;if(!t)return;const e=new t,s=e.createOscillator(),i=e.createGain();s.type="sine",s.frequency.setValueAtTime(880,e.currentTime),s.frequency.exponentialRampToValueAtTime(440,e.currentTime+.35),i.gain.setValueAtTime(.2,e.currentTime),i.gain.exponentialRampToValueAtTime(.01,e.currentTime+.35),s.connect(i),i.connect(e.destination),s.start(),s.stop(e.currentTime+.35)}catch{}}}class ie{static rootEl;static isLocPopoverOpen=!1;static isSavingSpot=!1;static searchDebounce=null;static isPlayingMasterTime=!1;static playInterval=null;static sunInstance;static weatherInstance;static dofInstance;static exposureInstance;static async init(t){this.rootEl=t,M.init(),this.renderShell(),this.initNightMode(),this.attachTopbarListeners(),this.attachKeyboardShortcuts(),await this.mountAllPanels(),C.subscribe(()=>{this.updateMasterTopbarDisplay(),this.isLocPopoverOpen&&this.renderLocationPopoverContent()}),f.subscribe(()=>{this.updateMasterTopbarDisplay()}),M.subscribeMode((e,s)=>{this.applyWorkspaceGridLayout(e,s)}),this.updateMasterTopbarDisplay(),this.applyWorkspaceGridLayout(M.getMode(),M.getMaximizedPanel())}static escapeHtml(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}static renderShell(){const t=f.getDate(),e=t.getHours()*60+t.getMinutes();this.rootEl.innerHTML=`
      <div class="desktop-app-shell">
        <!-- ==================== GLOBAL MASTER TOPBAR ==================== -->
        <header class="desktop-topbar">
          <!-- 1. Brand -->
          <div class="topbar-brand" id="btnDesktopBrand" title="Nulstil til Komplet Dashboard">
            <img src="fotografiske-signaler-wordmark.png" alt="Fotografiske Signaler" class="topbar-logo" onerror="this.style.display='none'">
            <div class="topbar-brand-badge">
              <span class="studio-dot"></span>
              <span>DESKTOP STUDIO</span>
            </div>
          </div>

          <!-- 2. Global Lokationsvælger med Popover -->
          <div class="topbar-location-wrap">
            <button class="topbar-loc-trigger" id="btnTopbarLocTrigger" title="Skift global lokation, søg adresse eller vælg gemt fotospot">
              <span class="loc-pin-icon">📍</span>
              <div class="loc-trigger-text">
                <span class="loc-trigger-name" id="topbarLocName">København</span>
                <span class="loc-trigger-coords" id="topbarLocCoords">55.6761°N, 12.5683°Ø</span>
              </div>
              <span class="loc-trigger-chevron">▾</span>
            </button>
            <button class="fs-btn-icon topbar-gps-btn" id="btnTopbarGps" title="Hent aktuel GPS-position" aria-label="GPS">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="8"></circle>
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
              </svg>
            </button>

            <!-- Lokations-Popover -->
            <div class="topbar-loc-popover hidden" id="topbarLocPopover"></div>
          </div>

          <!-- 3. Global Master Dato & Klokkeslæt Styring -->
          <div class="topbar-master-time">
            <div class="master-date-group">
              <button class="master-step-btn" id="btnMasterPrevDay" title="Forrige dag (-1 dag)">‹</button>
              <div class="master-date-picker-wrap" title="Vælg dato for planlægning">
                <input type="date" id="masterDatePicker" class="master-date-input" value="${f.formatIsoDate(t)}">
                <span class="master-date-label" id="masterDateLabel">${f.formatShortDate(t)}</span>
              </div>
              <button class="master-step-btn" id="btnMasterNextDay" title="Næste dag (+1 dag)">›</button>
            </div>

            <div class="master-clock-scrubber">
              <button class="master-play-btn" id="btnMasterPlay" title="Afspil døgnets sol- og lysbevægelse">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </button>
              <div class="master-slider-col">
                <div class="master-clock-row">
                  <span class="master-time-val tabular-nums" id="masterTimeDisplay">${f.formatTime(t)}</span>
                  <span class="master-phase-pill" id="masterPhaseBadge">Dagslys</span>
                  <span class="master-sun-mini tabular-nums" id="masterSunMini">☀️ +0.0°</span>
                </div>
                <input type="range" id="masterTimeSlider" class="master-time-range" min="0" max="1439" step="1" value="${e}" title="Træk for at ændre klokkeslæt på tværs af alle moduler">
              </div>
              <button class="master-now-btn" id="btnMasterNow" title="Spring til aktuel dato og klokkeslæt (Nu)">Nu</button>
            </div>
          </div>

          <!-- 4. Workspace Mode Switcher + Nattilstand -->
          <div class="topbar-right-actions">
            <div class="workspace-switcher" role="tablist" aria-label="Vælg arbejdsområde">
              <button class="ws-mode-btn active" data-ws-mode="dashboard" title="Komplet Dashboard: Alle 4 moduler synlige samtidigt (Tast 1)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                </svg>
                <span>Dashboard</span>
              </button>
              <button class="ws-mode-btn" data-ws-mode="planning" title="Planlægning: Stort Sol & Satellitkort + Vejranalyse side om side (Tast 2)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                  <line x1="9" y1="3" x2="9" y2="18"></line>
                  <line x1="15" y1="6" x2="15" y2="21"></line>
                </svg>
                <span>Planlægning</span>
              </button>
              <button class="ws-mode-btn" data-ws-mode="optics" title="Kamera & Optik: Stort DOF + Eksponering + 3D-Søger (Tast 3)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="9"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Kamera & Optik</span>
              </button>
            </div>

            <button class="fs-btn-icon topbar-night-btn" id="btnDesktopNightMode" title="Astro Rød Nattilstand (skåner nattesynet)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
              </svg>
            </button>
          </div>
        </header>

        <!-- ==================== MULTI-PANEL WORKSPACE GRID ==================== -->
        <main class="desktop-workspace-grid mode-dashboard" id="desktopWorkspaceGrid">
          <!-- PANEL 1: SOL, SATELLITKORT & 3D SØGER -->
          <section class="workspace-panel panel-sun" id="panel-sun" data-panel="sun">
            <div class="panel-chrome-bar">
              <div class="panel-chrome-title">
                <span class="panel-dot dot-sun"></span>
                <span>SOL, SKYGGE & KORT</span>
                <span class="panel-chrome-sub">Dual-View: Interaktivt Kort + 3D EVF Søger</span>
              </div>
              <div class="panel-chrome-actions">
                <button class="panel-max-btn" data-maximize="sun" title="Maksimer / Gendan Sol-panel">
                  <span class="max-icon">⤢</span>
                  <span class="max-label">Maksimer</span>
                </button>
              </div>
            </div>
            <div class="panel-body-scroll" id="mount-sun"></div>
          </section>

          <!-- PANEL 2: VEJR & FOTOVINDUER -->
          <section class="workspace-panel panel-weather" id="panel-weather" data-panel="weather">
            <div class="panel-chrome-bar">
              <div class="panel-chrome-title">
                <span class="panel-dot dot-weather"></span>
                <span>VEJRANALYSE & FOTOVINDUER</span>
                <span class="panel-chrome-sub">7-døgns prognose, Tåge, Gylden time & Astro</span>
              </div>
              <div class="panel-chrome-actions">
                <button class="panel-max-btn" data-maximize="weather" title="Maksimer / Gendan Vejr-panel">
                  <span class="max-icon">⤢</span>
                  <span class="max-label">Maksimer</span>
                </button>
              </div>
            </div>
            <div class="panel-body-scroll" id="mount-weather"></div>
          </section>

          <!-- PANEL 3: DOF & OPTISK SIMULATOR -->
          <section class="workspace-panel panel-dof" id="panel-dof" data-panel="dof">
            <div class="panel-chrome-bar">
              <div class="panel-chrome-title">
                <span class="panel-dot dot-dof"></span>
                <span>DYBDESKARPHED (DOF) & EVF</span>
                <span class="panel-chrome-sub">Hyperfokal, CoC, Diffraktion & Søger-simulator</span>
              </div>
              <div class="panel-chrome-actions">
                <button class="panel-max-btn" data-maximize="dof" title="Maksimer / Gendan DOF-panel">
                  <span class="max-icon">⤢</span>
                  <span class="max-label">Maksimer</span>
                </button>
              </div>
            </div>
            <div class="panel-body-scroll" id="mount-dof"></div>
          </section>

          <!-- PANEL 4: EKSPONERING, ND-FILTER & BULB -->
          <section class="workspace-panel panel-exposure" id="panel-exposure" data-panel="exposure">
            <div class="panel-chrome-bar">
              <div class="panel-chrome-title">
                <span class="panel-dot dot-exposure"></span>
                <span>EKSPONERING, ND & BULB</span>
                <span class="panel-chrome-sub">Eksponeringstrekant, Auto-EV, ND-Stacking & Timer</span>
              </div>
              <div class="panel-chrome-actions">
                <button class="panel-max-btn" data-maximize="exposure" title="Maksimer / Gendan Eksponerings-panel">
                  <span class="max-icon">⤢</span>
                  <span class="max-label">Maksimer</span>
                </button>
              </div>
            </div>
            <div class="panel-body-scroll" id="mount-exposure"></div>
          </section>
        </main>
      </div>
    `}static async mountAllPanels(){const t=this.rootEl.querySelector("#mount-sun"),e=this.rootEl.querySelector("#mount-weather"),s=this.rootEl.querySelector("#mount-dof"),i=this.rootEl.querySelector("#mount-exposure");this.sunInstance=new Yt,this.weatherInstance=new Xt,this.dofInstance=new Zt,this.exposureInstance=new se,await Promise.all([this.sunInstance.mount(t),this.weatherInstance.mount(e),this.dofInstance.mount(s),this.exposureInstance.mount(i)])}static attachTopbarListeners(){this.rootEl.querySelector("#btnDesktopBrand")?.addEventListener("click",()=>{M.setMode("dashboard")});const t=this.rootEl.querySelector("#btnTopbarLocTrigger"),e=this.rootEl.querySelector("#topbarLocPopover");t?.addEventListener("click",a=>{a.stopPropagation(),this.isLocPopoverOpen=!this.isLocPopoverOpen,e.classList.toggle("hidden",!this.isLocPopoverOpen),this.isLocPopoverOpen&&(this.renderLocationPopoverContent(),setTimeout(()=>{e.querySelector("#desktopLocSearchInput")?.focus()},40))}),document.addEventListener("click",a=>{this.isLocPopoverOpen&&e&&!e.contains(a.target)&&!t?.contains(a.target)&&(this.isLocPopoverOpen=!1,e.classList.add("hidden"))}),this.rootEl.querySelector("#btnTopbarGps")?.addEventListener("click",async()=>{const a=this.rootEl.querySelector("#btnTopbarGps");a.style.opacity="0.5";try{await C.requestGpsLocation()}catch(o){alert(o.message)}finally{a.style.opacity="1"}}),this.rootEl.querySelector("#btnMasterPrevDay")?.addEventListener("click",()=>{this.pauseMasterPlayback();const a=f.getDate();a.setDate(a.getDate()-1),f.setDate(a)}),this.rootEl.querySelector("#btnMasterNextDay")?.addEventListener("click",()=>{this.pauseMasterPlayback();const a=f.getDate();a.setDate(a.getDate()+1),f.setDate(a)});const s=this.rootEl.querySelector("#masterDatePicker");s?.addEventListener("change",()=>{this.pauseMasterPlayback();const a=f.parseIsoDate(s.value);if(a){const o=f.getDate();a.setHours(o.getHours(),o.getMinutes(),0,0),f.setDate(a)}});const i=this.rootEl.querySelector("#masterTimeSlider");i?.addEventListener("input",()=>{this.pauseMasterPlayback();const a=Number(i.value),o=f.getDate();o.setHours(Math.floor(a/60),a%60,0,0),f.setDate(o)}),this.rootEl.querySelector("#btnMasterPlay")?.addEventListener("click",()=>{this.isPlayingMasterTime?this.pauseMasterPlayback():this.startMasterPlayback()}),this.rootEl.querySelector("#btnMasterNow")?.addEventListener("click",()=>{this.pauseMasterPlayback(),f.setTimeToNow()}),this.rootEl.querySelectorAll("[data-ws-mode]").forEach(a=>{a.addEventListener("click",()=>{const o=a.dataset.wsMode;M.setMode(o)})}),this.rootEl.querySelectorAll("[data-maximize]").forEach(a=>{a.addEventListener("click",()=>{const o=a.dataset.maximize;M.toggleMaximizePanel(o)})}),this.rootEl.querySelector("#btnDesktopNightMode")?.addEventListener("click",()=>{this.toggleNightMode()})}static attachKeyboardShortcuts(){window.addEventListener("keydown",t=>{const e=t.target?.tagName;e==="INPUT"||e==="SELECT"||e==="TEXTAREA"||(t.key==="1"?M.setMode("dashboard"):t.key==="2"?M.setMode("planning"):t.key==="3"?M.setMode("optics"):t.key==="Escape"&&M.getMaximizedPanel()!==null&&M.toggleMaximizePanel(M.getMaximizedPanel()))})}static startMasterPlayback(){this.isPlayingMasterTime=!0;const t=this.rootEl.querySelector("#btnMasterPlay");t&&(t.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>',t.classList.add("active")),this.playInterval=setInterval(()=>{const e=new Date(f.getDate().getTime()+18e4);f.setDate(e)},60)}static pauseMasterPlayback(){if(!this.isPlayingMasterTime)return;this.isPlayingMasterTime=!1,this.playInterval&&(clearInterval(this.playInterval),this.playInterval=null);const t=this.rootEl.querySelector("#btnMasterPlay");t&&(t.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',t.classList.remove("active"))}static updateMasterTopbarDisplay(){const t=C.getLocation(),e=f.getDate(),s=this.rootEl.querySelector("#topbarLocName"),i=this.rootEl.querySelector("#topbarLocCoords");s&&(s.textContent=t.name),i&&(i.textContent=`${t.lat.toFixed(4)}°N, ${t.lng.toFixed(4)}°Ø`);const a=this.rootEl.querySelector("#masterDatePicker"),o=this.rootEl.querySelector("#masterDateLabel"),l=f.formatIsoDate(e);if(a&&a.value!==l&&(a.value=l),o){const p=f.formatRelativeDay(e);o.textContent=`${f.formatShortDate(e)} (${p})`}const c=this.rootEl.querySelector("#masterTimeDisplay"),r=this.rootEl.querySelector("#masterTimeSlider");c&&(c.textContent=f.formatTime(e));const n=e.getHours()*60+e.getMinutes();r&&Number(r.value)!==n&&(r.value=String(n));const d=F.getSunPosition(e,t.lat,t.lng),h=F.getLightPhase(d.altitude),u=this.rootEl.querySelector("#masterPhaseBadge"),m=this.rootEl.querySelector("#masterSunMini");if(u&&(u.textContent=h.badge,u.style.color=h.color,u.style.borderColor=`${h.color}55`),m){const p=F.getCompassDirection(d.azimuth);m.textContent=`☀️ ${d.altitude>=0?"+":""}${d.altitude.toFixed(1)}° (${d.azimuth.toFixed(0)}° ${p})`}}static applyWorkspaceGridLayout(t,e){const s=this.rootEl.querySelector("#desktopWorkspaceGrid");s&&(s.classList.remove("mode-dashboard","mode-planning","mode-optics","has-maximized"),s.classList.add(`mode-${t}`),e&&s.classList.add("has-maximized"),this.rootEl.querySelectorAll("[data-ws-mode]").forEach(i=>{const a=i.dataset.wsMode;i.classList.toggle("active",a===t&&!e)}),this.rootEl.querySelectorAll(".workspace-panel").forEach(i=>{const a=i.dataset.panel,o=e===a;i.classList.toggle("is-maximized",o);const l=i.querySelector("[data-maximize]");if(l){const c=l.querySelector(".max-label"),r=l.querySelector(".max-icon");c&&(c.textContent=o?"Gendan grid":"Maksimer"),r&&(r.textContent=o?"⤡":"⤢"),l.classList.toggle("active",o)}}))}static renderLocationPopoverContent(){const t=this.rootEl.querySelector("#topbarLocPopover");if(!t)return;const e=C.getLocation(),s=C.getSavedSpots(),i=this.escapeHtml(e.name);t.innerHTML=`
      <div class="loc-popover-inner">
        <div class="loc-popover-header">
          <strong>📍 Global Lokation & Fotospots</strong>
          <button class="loc-popover-close" id="btnCloseLocPopover">✕</button>
        </div>

        <div class="loc-popover-search">
          <input type="text" id="desktopLocSearchInput" placeholder="Søg adresse, by, sted eller koordinat (f.eks. Møns Klint, 55.67, 12.56)..." autocomplete="off">
          <div id="desktopLocSearchResults" class="loc-popover-results"></div>
        </div>

        <div class="loc-popover-save-row">
          ${this.isSavingSpot?`
              <div style="display:flex;gap:6px;width:100%;">
                <input type="text" id="desktopSpotNameInput" value="${i}" style="flex:1;padding:6px 10px;border-radius:6px;border:1px solid var(--accent-sun);background:var(--bg-surface);color:var(--text-main);font-size:12px;">
                <button class="fs-btn fs-btn-accent-sun" id="btnConfirmSaveDesktopSpot" style="padding:4px 12px;min-height:30px;font-size:12px;">Gem</button>
                <button class="fs-btn" id="btnCancelSaveDesktopSpot" style="padding:4px 10px;min-height:30px;font-size:12px;">Annuller</button>
              </div>
              `:`
              <button class="fs-btn" id="btnTriggerSaveDesktopSpot" style="width:100%;min-height:32px;font-size:12px;border:1px dashed var(--accent-sun);color:var(--accent-sun);">
                ⭐ Gem "${i}" i dine fotospots
              </button>
              `}
        </div>

        <div class="loc-popover-spots">
          <div class="loc-spots-heading">Gemte Fotospots (${s.length})</div>
          <div class="loc-spots-list">
            ${s.length===0?'<div style="font-size:12px;color:var(--text-dim);padding:8px 0;">Ingen gemte spots endnu. Gem dine favorit-lokationer for hurtigt skift.</div>':s.map(l=>`
                  <div class="loc-spot-item">
                    <div class="loc-spot-main" data-pick-spot="${this.escapeHtml(l.id)}">
                      <strong>📍 ${this.escapeHtml(l.name)}</strong>
                      <span>${l.lat.toFixed(4)}°N, ${l.lng.toFixed(4)}°Ø</span>
                    </div>
                    <button class="loc-spot-del" data-del-spot="${this.escapeHtml(l.id)}" title="Slet spot">🗑️</button>
                  </div>
                `).join("")}
          </div>
        </div>
      </div>
    `,t.querySelector("#btnCloseLocPopover")?.addEventListener("click",()=>{this.isLocPopoverOpen=!1,t.classList.add("hidden")});const a=t.querySelector("#desktopLocSearchInput"),o=t.querySelector("#desktopLocSearchResults");a?.addEventListener("input",()=>{const l=a.value.trim();if(this.searchDebounce&&clearTimeout(this.searchDebounce),l.length<2){o.innerHTML="";return}this.searchDebounce=setTimeout(async()=>{o.innerHTML='<div style="font-size:12px;color:var(--text-muted);padding:6px;">Søger...</div>';const c=await C.search(l);if(c.length===0){o.innerHTML='<div style="font-size:12px;color:var(--text-dim);padding:6px;">Ingen steder fundet</div>';return}o.innerHTML=c.map((r,n)=>`
          <div class="loc-search-hit" data-hit="${n}">
            <strong>📍 ${this.escapeHtml(r.name)}</strong>
            <span>${this.escapeHtml(r.sub)} • ${r.lat.toFixed(4)}°N, ${r.lng.toFixed(4)}°Ø</span>
          </div>
        `).join(""),o.querySelectorAll("[data-hit]").forEach(r=>{r.addEventListener("click",()=>{const n=c[Number(r.dataset.hit)];n&&(this.isLocPopoverOpen=!1,t.classList.add("hidden"),C.setLocation({lat:n.lat,lng:n.lng,name:n.name,sub:n.sub,source:"search"}))})})},220)}),t.querySelector("#btnTriggerSaveDesktopSpot")?.addEventListener("click",()=>{this.isSavingSpot=!0,this.renderLocationPopoverContent()}),t.querySelector("#btnCancelSaveDesktopSpot")?.addEventListener("click",()=>{this.isSavingSpot=!1,this.renderLocationPopoverContent()}),t.querySelector("#btnConfirmSaveDesktopSpot")?.addEventListener("click",()=>{const l=t.querySelector("#desktopSpotNameInput");C.saveSpot(l?.value||e.name,e.lat,e.lng),this.isSavingSpot=!1,this.renderLocationPopoverContent()}),t.querySelectorAll("[data-pick-spot]").forEach(l=>{l.addEventListener("click",()=>{const c=l.dataset.pickSpot,r=s.find(n=>n.id===c);r&&(this.isLocPopoverOpen=!1,t.classList.add("hidden"),C.setLocation({lat:r.lat,lng:r.lng,name:r.name,sub:"Gemt fotospot",source:"search"}))})}),t.querySelectorAll("[data-del-spot]").forEach(l=>{l.addEventListener("click",c=>{c.stopPropagation();const r=l.dataset.delSpot;r&&(C.deleteSpot(r),this.renderLocationPopoverContent())})})}static initNightMode(){const t=X.getSettings(),e=this.rootEl.querySelector("#btnDesktopNightMode");t.nightMode&&(document.body.classList.add("theme-night-red"),e?.classList.add("active"))}static toggleNightMode(){const t=document.body.classList.toggle("theme-night-red");this.rootEl.querySelector("#btnDesktopNightMode")?.classList.toggle("active",t),X.saveSettings({nightMode:t}),window.dispatchEvent(new CustomEvent("fs-theme-change",{detail:{nightMode:t}}))}}function ae(S={}){const{immediate:t=!1,onNeedRefresh:e,onOfflineReady:s,onRegistered:i,onRegisteredSW:a,onRegisterError:o}=S;let l,c,r;const n=async(h=!0)=>{await c,await r?.()};async function d(){if("serviceWorker"in navigator){if(l=await Ot(async()=>{const{Workbox:h}=await import("./workbox-window.prod.es5-BqEJf4Xk.js");return{Workbox:h}},[],import.meta.url).then(({Workbox:h})=>new h("./sw.js",{scope:"./",type:"classic"})).catch(h=>{o?.(h)}),!l)return;r=async()=>{await l?.messageSkipWaiting()};{let h=!1;const u=()=>{h=!0,l?.addEventListener("controlling",m=>{m.isUpdate&&window.location.reload()}),e?.()};l.addEventListener("installed",m=>{typeof m.isUpdate>"u"?typeof m.isExternal<"u"?m.isExternal?u():!h&&s?.():m.isExternal?window.location.reload():!h&&s?.():m.isUpdate||s?.()}),l.addEventListener("waiting",u),l.addEventListener("externalwaiting",u)}l.register({immediate:t}).then(h=>{a?a("./sw.js",h):i?.(h)}).catch(h=>{o?.(h)})}}return c=d(),n}const $t=document.getElementById("app");$t&&ie.init($t);const ne=ae({onNeedRefresh(){window.dispatchEvent(new CustomEvent("pwa-update-available",{detail:{update:()=>ne(!0)}}))},onOfflineReady(){console.log("Fotografiske Signaler Desktop Studio er klar til offline brug.")}});
