(function(){
'use strict';
/* =====================================================================
   1. BOSHLANG'ICH SOZLAMA — eski Excel (Qum_final_31.08.2026) asosida
   ===================================================================== */
const WH=['K01','K02','S01','S02','T01','T02','C01'], LINKS=['K01','K02','S01','S02','C01'], TR='TR';
/* Karyerlar; OTV — krisha otvali (qum ombori emas). Joylar: har birida o'z operatori va o'z material ombori bor. */
const KQ=['K01','K02'], OTV='OTV';
const SITE_NAME={SAM:'Samarqand',QIB:'Qibray',CHU:'Chust',MEG:'Megaton'};
const SITES=[['SAM','Samarqand',['K02','S02']],['QIB','Qibray',['K01','S01']],['CHU','Chust',['C01']],['MEG','Megaton',[]]], SITE_OF={K01:'QIB',S01:'QIB',K02:'SAM',S02:'SAM',C01:'CHU'};
/* Vagon — ombor. Har tarmoqning o'z «vagonlarda» ombori bor: qum vagonga yuklangan kuni stansiyadan chiqib shu omborga kiradi
   va faqat Chustda TUSHIRILGAN kuni Chust omboriga o'tadi. Chustga kelib, tushirilmay turgan vagon ham hali vagon omborida. */
const TW=['T01','T02'], TOF={S01:'T01',S02:'T02'}, SOFT={T01:'S01',T02:'S02'}, isT=w=>w==='T01'||w==='T02';
const stageOf=l=>!l?null:l===TR?'trans':l[0]==='K'?'karyer':l[0]==='S'?'stansiya':l[0]==='C'?'chust':null;
const SN={karyer:'Karyer',stansiya:'Stansiya',chust:'Chust',trans:"O'z transporti"};
const linksOf=st=>st==='trans'?[TR]:LINKS.filter(l=>stageOf(l)===st);
/* Tan narx komponentlari: har so'm aynan bittasiga tushadi va qum bilan birga ombordan omborga ko'chadi */
const COMP=[['op',"Boshlang'ich qoldiq qiymati"],['zx','Kon qiymati: sotib olish va geologiya'],['kr','Krisha ochish (qumga yotqizilgan ulush)'],['nd',"Yer qa'ri solig'i"],['kdz','Karyer: dizel'],['kam','Karyer: amortizatsiya'],['kfx','Karyer: ish haqi va doimiy xarajatlar'],['kot','Karyer: boshqa xarajatlar'],['buy','Sotib olingan qum'],
  ['h1x','Karyer → stansiya: tashqi logistika'],['h1o',"Karyer → stansiya: o'z transporti"],['st','Stansiya: saqlash va vagonga yuklash'],['ty',"Temir yo'l tarifi"],['ch','Chust: podacha, tushirish, xarajatlar'],
  ['h2x','Chust → zavod: tashqi logistika'],['h2o',"Chust → zavod: o'z transporti"],['h3x',"To'g'ridan zavodga: tashqi logistika"],['h3o',"To'g'ridan zavodga: o'z transporti"]];
const CI={}; COMP.forEach((c,i)=>CI[c[0]]=i);
const DEF = {
  start:'2026-10-01',
  sapItem:'QUM-KVARS',
  tol:0.05,
  wh:{
    K01:{name:'Mayskiy',full:'Mayskiy karyer',open:0,plan:5000,resKg:null,resVal:null,krK:null,note:"Marksheyder o'lchovi bilan kiriting"},
    K02:{name:'Samarqand',full:'Samarqand karyeri',open:0,plan:0,resKg:null,resVal:null,krK:null,note:'Oylik reja hajmini kiriting'},
    S01:{name:"Bo'zsuv",full:"Bo'zsuv stansiya ombori",open:8071190,plan:6500,note:"Eski Excel bo'yicha 31.08.2026 qoldig'i — haqiqiysi bilan yangilang"},
    S02:{name:'Samarqand st.',full:'Samarqand stansiya ombori',open:0,plan:0,note:'Qoldiq va oylik reja hajmini kiriting'},
    T01:{name:"Vagonda: Bo'zsuv",full:"Vagonlarda: Bo'zsuv → Chust",open:null,openVal:null,plan:null,note:"Qoldiq Vagonlar jurnalidan olinadi: yuklangan, hali Chustda tushirilmagan vagonlar"},
    T02:{name:'Vagonda: Samarqand st.',full:'Vagonlarda: Samarqand st. → Chust',open:null,openVal:null,plan:null,note:"Qoldiq Vagonlar jurnalidan olinadi: yuklangan, hali Chustda tushirilmagan vagonlar"},
    C01:{name:'Chust',full:'Chust stansiya ombori',open:0,plan:6500,note:'Inventarizatsiya natijasini kiriting'}
  },
  norms:{
    nedra:5, karDizel:0.58, reysYuk:30000, reysMin:27000, vagYuk:69700, vagMin:69000,
    sim:18, plyonka:13, stDizel:13, stXizmat:150000,
    tyTarif:5660000, tyTarif2:null, podacha:292000, gu46:0, tushirish:425000,
    yoqKS:0.005, yoqChust:0.01, tranzKun:6, yoldaKun:8, chustKun:2, zich:1.5, krZich:1.5, krReys:25, bakKun:7
  },
  machines:[
    {code:'M1',name:'Ekskavator 1',type:'E',loc:'K01',normL:null,normT:null,cost:null,life:null},
    {code:'M2',name:'Pogruzchik 1',type:'P',loc:'K01',normL:null,normT:null,cost:null,life:null},
    {code:'M3',name:'Ekskavator 2',type:'E',loc:'K02',normL:null,normT:null,cost:null,life:null},
    {code:'M4',name:'Pogruzchik 2',type:'P',loc:'K02',normL:null,normT:null,cost:null,life:null},
    {code:'T1',name:'Yuk mashinasi 50 419 NBA',type:'T',plate:'50 419 NBA',loc:'TR',normL:null,normT:null,cost:null,life:null},
    {code:'T2',name:'Yuk mashinasi 50 429 NBA',type:'T',plate:'50 429 NBA',loc:'TR',normL:null,normT:null,cost:null,life:null}
  ],
  routes:[
    {code:'KS1',from:'K01',to:'S01',type:'reys',tarif:600000,stage:'avtoSt'},
    {code:'K2S',from:'K02',to:'S02',type:'reys',tarif:600000,stage:'avtoSt'},
    {code:'TS1',from:'TASHQI',to:'S01',type:'reys',tarif:600000,stage:'avtoSt'},
    {code:'KZ',from:'K01',to:'Z01',type:'kg',tarif:190,stage:'togri'},
    {code:'K2Z',from:'K02',to:'Z01',type:'kg',tarif:190,stage:'togri'},
    {code:'TZ',from:'TASHQI',to:'Z01',type:'kg',tarif:190,stage:'togri'},
    {code:'CZ',from:'C01',to:'Z01',type:'kg',tarif:20,stage:'avtoZav'},
    {code:'K1O',from:'K01',to:'OTV',type:'reys',tarif:0,stage:'krisha'},
    {code:'K2O',from:'K02',to:'OTV',type:'reys',tarif:0,stage:'krisha'}
  ],
  suppliers:[
    {code:'MEG',name:"MEGATON (o'z karyeri)",price:0},
    {code:'AQ',name:'ACTIVE QUARZ',price:65},
    {code:'MSV',name:'MS VOSTOK',price:60},
    {code:'ASK',name:'ASIA KVARS',price:180},
    {code:'BEN',name:'BENTA KVARTS',price:20}
  ],
  items:[
    {code:'K-ISH',stage:'karyer',name:'Ish haqi',type:'D',plans:{K01:49200000},acc:''},
    {code:'K-YAIT',stage:'karyer',name:'YaIT 12%',type:'D',plans:{K01:5904000},acc:''},
    {code:'K-OVQ',stage:'karyer',name:'Oziq-ovqat',type:'D',plans:{K01:17000000},acc:''},
    {code:'K-EL',stage:'karyer',name:'Elektr energiya',type:'D',plans:{K01:6000000},acc:''},
    {code:'K-IJR',stage:'karyer',name:'Tashqi texnika ijarasi',type:'D',plans:{K01:9500000},acc:''},
    {code:'K-TAX',stage:'karyer',name:"Ishchilar yo'lkirasi",type:'D',plans:{K01:2600000},acc:''},
    {code:'K-SUV',stage:'karyer',name:'Ichimlik suvi',type:'D',plans:{K01:800000},acc:''},
    {code:'K-TAM',stage:'karyer',name:"Ta'mirlash va ehtiyot qism",type:'O',plans:{},acc:''},
    {code:'K-BSH',stage:'karyer',name:'Boshqa xarajat',type:'O',plans:{K01:7300000},acc:''},
    {code:'K-AMO',stage:'karyer',name:'Amortizatsiya (buxgalteriya, oylik summa)',type:'D',plans:{},acc:''},
    {code:'S-ISH',stage:'stansiya',name:'Ish haqi',type:'D',plans:{S01:19200000},acc:''},
    {code:'S-YAIT',stage:'stansiya',name:'YaIT 12%',type:'D',plans:{S01:2304000},acc:''},
    {code:'S-EL',stage:'stansiya',name:'Elektr energiya',type:'D',plans:{S01:1800000},acc:''},
    {code:'S-IJR',stage:'stansiya',name:'Ombor ijarasi',type:'D',plans:{S01:5000000},acc:''},
    {code:'S-XIZ',stage:'stansiya',name:'Stansiya xizmati (vagon uchun)',type:'O',plans:{},nv:'stXizmat',acc:''},
    {code:'S-TAM',stage:'stansiya',name:"Ta'mirlash va ehtiyot qism",type:'O',plans:{},acc:''},
    {code:'S-BSH',stage:'stansiya',name:'Boshqa xarajat',type:'O',plans:{},acc:''},
    {code:'S-UMM',stage:'stansiya',name:'Umumiy xarajat (kvartira, ovqat, yengil mashina)',type:'O',plans:{},sh:0.2,acc:''},
    {code:'C-TSH',stage:'chust',name:'Pogruzchik va xodim tushligi',type:'D',plans:{C01:2600000},acc:''},
    {code:'C-TAM',stage:'chust',name:"Ta'mirlash va ehtiyot qism",type:'O',plans:{},acc:''},
    {code:'C-BSH',stage:'chust',name:'Boshqa xarajat',type:'O',plans:{},acc:''},
    {code:'T-ISH',stage:'trans',name:'Haydovchilar ish haqi',type:'D',plans:{},acc:''},
    {code:'T-YAIT',stage:'trans',name:'YaIT 12% (haydovchilar)',type:'D',plans:{},acc:''},
    {code:'T-TAM',stage:'trans',name:"Ta'mirlash, shina, moy",type:'O',plans:{},acc:''},
    {code:'T-BSH',stage:'trans',name:'Boshqa transport xarajati',type:'O',plans:{},acc:''}
  ],
  mats:{
    DIZEL:{name:"Dizel yoqilg'isi",unit:'l',open:0,price:11200},
    SIM:{name:'Sim 6 mm',unit:'dona',open:0,price:1257},
    PLYONKA:{name:'Plyonka 0,8',unit:'m',open:0,price:4667}
  }
};
const NORM_META=[
  ['nedra',"Yer qa'ridan foydalanish solig'i (qazilgan har kg uchun)","so'm/kg",null,null,null,2],
  ['karDizel',"Karyer: dizel — texnika normasi kiritilmaguncha ishlatiladi",'l/t',0.18,0.58,1.33,2],
  ['reysYuk',"Avto karyer → stansiya: reys normativ yuki",'kg',17740,28607,37540,0],
  ['reysMin',"Avto: minimal yuk (ogohlantirish chegarasi)",'kg',null,null,null,0],
  ['vagYuk',"Vagon normativ yuki",'kg',68443,69490,69953,0],
  ['vagMin',"Vagon minimal yuki (ogohlantirish chegarasi)",'kg',null,null,null,0],
  ['sim',"Stansiya: sim 6 mm",'dona/vagon',18,18,18,1],
  ['plyonka',"Stansiya: plyonka 0,8",'m/vagon',13,13,13,1],
  ['stDizel',"Stansiya: dizel",'l/vagon',8.5,13.8,28.2,1],
  ['stXizmat',"Stansiya xizmati","so'm/vagon",150000,150000,150000,0],
  ['tyTarif',"Temir yo'l tarifi, Bo'zsuv → Chust","so'm/vagon",5395115,5603423,5826269,0],
  ['tyTarif2',"Temir yo'l tarifi, Samarqand stansiyasi → Chust (bo'sh bo'lsa Bo'zsuv tarifi olinadi)","so'm/vagon",null,null,null,0],
  ['podacha',"Qo'qon TexPD podacha","so'm/vagon",288866,292689,317753,0],
  ['gu46',"GU-46 jarima","so'm/vagon",5963,45457,384635,0],
  ['tushirish',"Vagon tushirish + temir yo'l xizmati","so'm/vagon",398222,426166,449477,0],
  ['yoqKS',"Yo'qotish normasi: karyer → stansiya (ikki tarozi farqi)",'ulush',null,null,null,3],
  ['yoqChust',"Yo'qotish normasi: Chust (nakladnoy → zavod tarozisi)",'ulush',null,0.030,0.044,3],
  ['tranzKun',"Vagon yo'lda: o'rtacha muddat (yuklangandan Chustga kelguncha) — kutilayotgan kelish sanasi shundan hisoblanadi",'kun',null,null,null,0],
  ['yoldaKun',"Vagon yo'lda: maksimal muddat (shundan o'tsa «Kechikmoqda»)",'kun',null,null,null,0],
  ['chustKun',"Chustda tushirishni kutish: maksimal muddat",'kun',null,null,null,0],
  ['zich',"Qum zichligi (kg ↔ m³ hisobi uchun)",'t/m³',null,null,null,2],
  ['krZich',"Krisha (tuproq) zichligi",'t/m³',null,null,null,2],
  ['krReys',"Karyer samosvali: bitta reys hajmi (qum va krisha reyslarini kg ga o'tkazish uchun)",'m³',null,null,null,1],
  ['bakKun',"Bak o'lchovi oralig'i: shundan ko'p kun o'lchanmasa ogohlantiradi",'kun',null,null,null,0]
];
const STAGES=[
  ['karyer','Karyer (qazish, yuklash)'],['avtoSt','Avto: karyer → stansiya'],['stansiya','Stansiya (saqlash, yuklash)'],
  ['temir',"Temir yo'l (Toshkent TexPD)"],['chust','Chust (podacha, tushirish, jarima)'],['avtoZav','Avto: Chust → zavod']
];
const BASE={karyer:23.86,avtoSt:18.75,stansiya:9.87,temir:83.96,chust:10.44,avtoZav:20};
/* U — karyer texnikasining kunlik jami ishi: soat va dizel bir marta kiritiladi; krisha ochish, qum qazish va qum yuklashga shu kungi tonnaga mutanosib bo'linadi.
   Q — qazilgan qum miqdori (texnikasiz ham kiritiladi). Y, K, B — ishni alohida ko'rsatish kerak bo'lgan hollar va eski yozuvlar uchun. */
const OPS={U:'Karyer ishi: krisha, qazish, yuklash (jami)',Q:'Qum qazildi (miqdor)',Y:'Qum yuklash',K:'Krisha ochish',B:'Boshqa ish',A:"Bak o'lchandi"};

/* =====================================================================
   2. HISOB DVIGATELI (toza funksiyalar)
   ===================================================================== */
const E={};
E.dn=s=>Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10))/864e5;
E.add=(s,n)=>new Date((E.dn(s)+n)*864e5).toISOString().slice(0,10);
E.ms=s=>s.slice(0,8)+'01';
E.dim=s=>new Date(Date.UTC(+s.slice(0,4),+s.slice(5,7),0)).getUTCDate();
E.me=s=>s.slice(0,8)+String(E.dim(s)).padStart(2,'0');
E.n=v=>(v==null||v===''||isNaN(v))?null:+v;
E.inr=(d,a,b)=>!!d&&d>=a&&d<=b;
E.whName=(cfg,w)=>w==='TASHQI'?"Ta'minotchi":w==='Z01'?'Zavod':w===OTV?'krisha otvali':w===TR?"O'z transporti":(cfg.wh[w]?cfg.wh[w].name:w);
E.stName=(cfg,S)=>{ const n=cfg.wh[S].name; return /\bst\.?$/.test(n)?n.replace(/\s*\bst\.?$/,'')+' stansiyasi':n+' stansiyasi'; };
/* Xarajat moddasining tan narxga kiradigan ulushi (sh): 1 — to'liq; 0,2 — beshdan biri. Qolgani tan narxdan tashqarida, Auditda alohida ko'rinadi. */
E.sh=it=>{ const v=it?E.n(it.sh):null; return v==null?1:Math.max(0,Math.min(1,v)); };
E.planOf=(it,L)=>(E.n(it.plans&&it.plans[L])||0)*E.sh(it);
E.m3=(cfg,kg,kr)=>{ const z=E.n(cfg.norms[kr?'krZich':'zich'])||1.5; return kg/(z*1000); };
E.rtName=(cfg,r)=>r.to===OTV?'Krisha: '+E.whName(cfg,r.from)+' → otval':E.whName(cfg,r.from)+' → '+E.whName(cfg,r.to)+(r.stage==='togri'?" (avto to'g'ridan)":'');
E.route=(cfg,code)=>cfg.routes.find(r=>r.code===code);
E.resRate=(cfg,L)=>{ const w=cfg.wh[L]; return (w&&E.n(w.resKg)>0&&E.n(w.resVal)!=null)?w.resVal/w.resKg:0; };   /* 1 kg qum yer ostida: (sotib olish + geologiya) ÷ tasdiqlangan zaxira */
E.mcRate=m=>(E.n(m.cost)&&E.n(m.life))?m.cost/m.life:0;   /* texnika: so'm/moto-soat; yuk mashinasi: so'm/km */
E.mc=(cfg,code)=>cfg.machines.find(m=>m.code===code);
E.isTruck=(cfg,code)=>{ const m=E.mc(cfg,code); return !!m&&m.type==='T'; };

/* Material narxi: sana bo'yicha harakatlanuvchi o'rtacha. Kelajakdagi kirim o'tgan davr xarajatini o'zgartirmaydi.
   Ombor har joyning o'ziniki: Samarqand dizeli Qibraynikiga aralashmaydi. Kirimda «qaysi joy ombori» ko'rsatilgan bo'lsa, shu joyning sarfi
   o'sha kundan boshlab o'z omboridan, o'z o'rtacha narxida chiqadi. Joyi ko'rsatilmagan kirimlar — umumiy ombor (eski yozuvlar o'zgarmaydi). */
E.siteOf=function(cfg,loc,mc){ if(mc){ const m=E.mc(cfg,mc); if(m&&m.type==='T') return m.site||'QIB'; } return SITE_OF[loc]||'QIB'; };
E.matInfo=function(cfg,mat,tex){
  const out={}, s0=cfg.start||'';
  /* Tizim boshlanishidan oldingi yozuvlar ombor qoldig'iga kirmaydi: boshlang'ich qoldiq — sozlamadagi (Normativlar → Materiallar) */
  mat=mat.filter(r=>!r.d||r.d>=s0); tex=tex.filter(t=>!t.d||t.d>=s0);
  const run=(ev,open,p0)=>{ ev.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:a[1]-b[1]);
    let q=open, price=p0, val=q*price, inq=0, outq=0; const tl=[];
    for(const e of ev){
      if(e[1]===0){ if(q<0){ q=0; val=0; } q+=e[2]; val+=e[2]*e[3]; inq+=e[2]; if(q>0) price=val/q; }
      else { q-=e[2]; val-=e[2]*price; outq+=e[2]; }
      if(tl.length&&tl[tl.length-1][0]===e[0]) tl[tl.length-1][1]=price; else tl.push([e[0],price]); }
    return {price,p0,stock:open+inq-outq,inq,outq,tl}; };
  for(const k in cfg.mats){ const m=cfg.mats[k], fr={}, ev={'':[]};
    for(const r of mat){ if(r.it===k&&r.d&&r.op==='K'&&r.sk&&SITE_NAME[r.sk]&&(!fr[r.sk]||r.d<fr[r.sk])) fr[r.sk]=r.d; }
    const so=(site,d)=>(site&&fr[site]&&fr[site]<=d)?site:'', add=(st,e)=>{ (ev[st]||(ev[st]=[])).push(e); };
    for(const r of mat){ if(r.it!==k||!r.d) continue; if(r.op==='K') add(fr[r.sk]?r.sk:'',[r.d,0,E.n(r.q)||0,E.n(r.p)||0]); else add(so(SITE_OF[r.st],r.d),[r.d,1,E.n(r.q)||0,0]); }
    if(k==='DIZEL') for(const t of tex){ if(t.d&&E.n(t.l)) add(so(E.siteOf(cfg,t.loc,t.mc),t.d),[t.d,1,E.n(t.l),0]); }
    const p0=E.n(m.price)||0, o=run(ev[''],E.n(m.open)||0,p0); o.fr=fr; o.st={};
    for(const st in ev) if(st) o.st[st]=run(ev[st],0,p0);
    out[k]=o; }
  return out;
};
E.prS=(P,it,d,site)=>{ const p=P[it]; return (p&&site&&p.fr[site]&&p.fr[site]<=d)?p.st[site]:p; };
E.pr=function(P,it,d,site){ const p=E.prS(P,it,d,site); if(!p) return 0; const tl=p.tl; let lo=0, hi=tl.length; while(lo<hi){ const m=(lo+hi)>>1; if(tl[m][0]<=d) lo=m+1; else hi=m; } return lo?tl[lo-1][1]:p.p0; };
E.prNow=(P,it,site)=>{ const p=P[it]; if(!p) return 0; return (site&&p.st[site]?p.st[site]:p).price; };

/* Texnika normasi → so'm/kg, ish turi bo'yicha alohida: Q — qazish, Y — yuklash */
E.mcNorm=function(cfg,P,L){
  const g={Q:[],Y:[]};
  for(const m of cfg.machines){ if(m.type==='T'||m.loc!==L||!E.n(m.normT)||E.n(m.normL)==null) continue; g[m.type==='E'?'Q':'Y'].push(m); }
  const dp=E.prNow(P,'DIZEL',SITE_OF[L]);
  const f=a=>a.length?{dz:a.reduce((s,m)=>s+m.normL*dp/m.normT,0)/a.length/1000,am:a.reduce((s,m)=>s+E.mcRate(m)/m.normT,0)/a.length/1000,ok:true}:{dz:0,am:0,ok:false};
  return {Q:f(g.Q),Y:f(g.Y)};
};
E.linkNorm=function(cfg,P,L){
  const N=cfg.norms, st=stageOf(L), mc=E.mcNorm(cfg,P,L), el={}, plan=E.n(cfg.wh[L].plan)||0, ok=mc.Q.ok||mc.Y.ok, so=SITE_OF[L], pz=E.prNow(P,'DIZEL',so);
  if(st==='karyer'){ el.zx=E.resRate(cfg,L); el.nd=E.n(N.nedra)||0;
    el.dz=ok?(mc.Q.ok?mc.Q.dz:null):N.karDizel*pz/1000; el.am=mc.Q.am; el.dzY=ok?(mc.Y.ok?mc.Y.dz:null):0; el.amY=mc.Y.am; }
  if(st==='stansiya'){ el.dz=N.stDizel*pz/N.vagYuk; el.am=mc.Q.am+mc.Y.am; el['m:SIM']=N.sim*E.prNow(P,'SIM',so)/N.vagYuk; el['m:PLYONKA']=N.plyonka*E.prNow(P,'PLYONKA',so)/N.vagYuk; }
  if(st==='chust'){ el.dz=mc.Q.dz+mc.Y.dz; el.am=mc.Q.am+mc.Y.am; el.pod=N.podacha/N.vagYuk; el.tush=N.tushirish/N.vagYuk; }
  for(const it of cfg.items){ if(it.stage!==st) continue; const k='i:'+it.code;
    if(it.nv) el[k]=N[it.nv]/N.vagYuk;
    else { const p=E.planOf(it,L); el[k]=plan>0?p/(plan*1000):(p>0?null:0); } }
  let total=0; for(const k in el) total+=el[k]||0;
  return {el,total,mcOk:ok,gu:(E.n(N.gu46)||0)/N.vagYuk};
};
E.tyNorm=(cfg,S)=>(S==='S02'&&E.n(cfg.norms.tyTarif2)!=null)?cfg.norms.tyTarif2:cfg.norms.tyTarif;
E.rtNorm=(cfg,r)=>r.type==='reys'?r.tarif/cfg.norms.reysYuk:r.tarif;
E.normRates=function(cfg,P,LN){
  const N=cfg.norms, r={};
  let w=0,s=0; LINKS.forEach(l=>{ if(stageOf(l)!=='karyer') return; const p=E.n(cfg.wh[l].plan)||0; w+=p; s+=p*LN[l].total; });
  r.karyer=w>0?s/w:LN.K01.total;
  r.avtoSt=E.rtNorm(cfg,E.route(cfg,'KS1'));
  let sw=0,ss=0,st=0; ['S01','S02'].forEach(l=>{ const p=E.n(cfg.wh[l].plan)||0; sw+=p; ss+=p*LN[l].total; st+=p*E.tyNorm(cfg,l)/N.vagYuk; });
  r.stansiya=sw>0?ss/sw:LN.S01.total;
  r.temir=sw>0?st/sw:N.tyTarif/N.vagYuk;
  r.chust=LN.C01.total;
  r.avtoZav=E.rtNorm(cfg,E.route(cfg,'CZ'));
  r.total=r.karyer+r.avtoSt+r.stansiya+r.temir+r.chust+r.avtoZav;
  r.logist=r.total-r.karyer;
  const kn=l=>(E.n(cfg.wh[l].plan)||0)>0?LN[l].total:r.karyer;
  const sn=l=>(E.n(cfg.wh[l].plan)||0)>0?LN[l].total:r.stansiya, s1=kn('K01')+r.avtoSt, s2=kn('K02')+E.rtNorm(cfg,E.route(cfg,'K2S'));
  r.wh={K01:kn('K01'),K02:kn('K02'),S01:s1,S02:s2,T01:s1+sn('S01')+E.tyNorm(cfg,'S01')/N.vagYuk,T02:s2+sn('S02')+E.tyNorm(cfg,'S02')/N.vagYuk,
        C01:r.karyer+r.avtoSt+r.stansiya+r.temir+r.chust,Z01:r.total};
  return r;
};
/* Reyslar. Tashqi logistika: reysga (yoki kg ga) belgilangan summa. O'z transporti: summa keyin E.ownAlloc da taqsimlanadi. */
E.dReys=function(cfg,rows){
  const cnt={}, RM={}, RN={}, SM={}, TK={}, keys=new Array(rows.length);
  cfg.routes.forEach(r=>{ RM[r.code]=r; RN[r.code]=E.rtName(cfg,r); }); cfg.suppliers.forEach(x=>SM[x.code]=x); cfg.machines.forEach(m=>{ if(m.type==='T') TK[m.code]=1; });
  rows.forEach((r,i)=>{ if(r.a&&r.wq!=null){ const k=r.d+'|'+String(r.a).replace(/\s+/g,'').toUpperCase()+'|'+r.wq; keys[i]=k; cnt[k]=(cnt[k]||0)+1; } });
  return rows.map((r,i)=>{
    const rt=RM[r.m]||{code:r.m,from:'?',to:'?',type:'reys',tarif:0,stage:'?'};
    const wq=E.n(r.wq), wj=E.n(r.wj);
    const kgQ=wq!=null?wq:(wj!=null?wj:0), kgJ=wj!=null?wj:kgQ;
    const own=!!r.tk&&!!TK[r.tk];
    const tarif=E.n(r.t)!=null?E.n(r.t):rt.tarif;
    const rn=Math.max(1,Math.round(E.n(r.rn)||1)), kr=rt.to===OTV;      /* rn — bitta qatordagi reyslar soni; kr — krisha reysi: qum omboriga tegmaydi */
    const ttype=r.tt||rt.type, haul=own?0:(ttype==='reys'?tarif*rn:tarif*kgQ);
    const sup=SM[r.s];
    const price=rt.from==='TASHQI'?(E.n(r.sp)!=null?E.n(r.sp):(sup?(+sup.price||0):0)):0;
    const loss=(wq!=null&&wj!=null)?wj-wq:0;
    const flags=[];
    if(wq==null) flags.push(wj!=null?['warn',"Qabul vazni yo'q"]:['bad',"Vazn yo'q"]);
    if(keys[i]&&cnt[keys[i]]>1) flags.push(['bad','Takror']);
    if(rt.stage==='avtoSt'&&kgQ>0&&kgQ/rn<cfg.norms.reysMin) flags.push(['warn','Kam yuk']);
    if(loss>0&&kgJ>0&&loss/kgJ>cfg.norms.yoqKS) flags.push(['warn',"Yo'qotish"]);
    if(r.tk&&!own) flags.push(['bad',"Mashina ro'yxatda yo'q"]);
    if(rt.from==='?') flags.push(['bad',"Marshrut yo'q"]);
    return Object.assign({},r,{rt,rname:rt.from==='?'?String(r.m):RN[rt.code],from:rt.from,to:rt.to,stage:rt.stage,own,kgQ,kgJ,loss:kr?0:loss,haul,parts:null,w:(E.n(rt.km)||1)*rn,rn,kr,
      perKg:kgQ&&!own?haul/kgQ:null,price,sand:price*kgQ,flags});
  });
};
/* Vagon yozuvi. Vagon ombori a'zoligi: ent — vagon omboriga kirgan kun (boshlang'ich qoldiq uchun '0000-00-00'), exd — Chustda tushirilgan kun.
   pre  — tizim boshlanishidan oldin yuklangan va boshlanish kunida hali tushirilmagan vagon: vagon omborining boshlang'ich qoldig'i.
   orph — manbasi yoki sanasi yo'q yozuv: hech bir omborga tushmaydi, Auditda alohida ko'rsatiladi. */
E.dVag=function(cfg,rows,D){
  const N=cfg.norms, s=cfg.start, cnt={}, tz=E.n(N.tranzKun)||6, fast=Math.floor(tz/2);
  for(const v of rows){ if(v.nak){ cnt[v.nak]=(cnt[v.nak]||0)+1; } }
  return rows.map(v=>{
    const ext=v.src==='TASHQI', kg=E.n(v.kg)||0, tw=TOF[v.src]||null, dkE=v.dk||v.dt||null;
    const orph=!ext&&(!tw||(!v.dy&&!dkE));
    const pre=!ext&&!orph&&(!v.dy||v.dy<s)&&!(v.dt&&v.dt<s);
    const ent=(ext||orph)?null:(pre?'0000-00-00':(v.dy&&v.dy>=s?v.dy:null)), exd=(ent&&v.dt&&v.dt>=s)?v.dt:null;
    let st='Kelgusi';
    if(v.dt&&v.dt<=D) st='Tushirilgan'; else if(dkE&&dkE<=D) st='Chustda vagonda'; else if((v.dy&&v.dy<=D)||pre) st=ext?"Ta'minotchidan yo'lda":"Yo'lda";
    const yol=v.dy&&v.dy<=D?Math.max(0,E.dn(dkE&&dkE<=D?dkE:D)-E.dn(v.dy)):null;
    const kut=dkE&&dkE<=D?Math.max(0,E.dn(v.dt&&v.dt<=D?v.dt:D)-E.dn(dkE)):null;
    const tr=(v.dy&&dkE)?E.dn(dkE)-E.dn(v.dy):null;
    const eta=(!ext&&!orph&&v.dy&&!dkE)?E.add(v.dy,tz):null;
    const tyP=E.n(v.ty)==null&&!ext&&!!v.dy&&v.dy>=s;      /* boshlanishdan oldin yuklangan vagon tarifi boshlang'ich qiymat ichida */
    const ty=E.n(v.ty)!=null?E.n(v.ty):(tyP?E.tyNorm(cfg,v.src):0);
    const pod=E.n(v.pod)!=null?E.n(v.pod):(v.dt?N.podacha:0);
    const tush=E.n(v.tush)!=null?E.n(v.tush):(v.dt?N.tushirish:0);
    const gu=E.n(v.gu)||0;
    const pendSum=(tyP?ty:0)+((E.n(v.pod)==null&&v.dt)?pod:0)+((E.n(v.tush)==null&&v.dt)?tush:0);
    const pend=(tyP?1:0)+((E.n(v.pod)==null&&v.dt)?1:0)+((E.n(v.tush)==null&&v.dt)?1:0);
    const sup=cfg.suppliers.find(x=>x.code===v.s);
    const flags=[];
    if(!ext&&!tw) flags.push(['bad',"Manba noma'lum"]);
    else if(orph) flags.push(['bad',"Sana yo'q"]);
    if(!ext&&!orph&&!v.dy) flags.push(['bad',"Yuklangan sana yo'q"]);
    if((tr!=null&&tr<0)||(v.dk&&v.dt&&v.dt<v.dk)) flags.push(['bad','Sana tartibi']);
    else if(!ext&&tr!=null&&tr<fast) flags.push(['warn','Juda tez']);
    if(!ext&&v.dt&&!v.dk) flags.push(['warn',"Kelgan sana yo'q"]);
    if(!ext&&kg>0&&kg<N.vagMin) flags.push(['warn','Kam yuk']);
    if(v.nak&&cnt[v.nak]>1) flags.push(['bad','Takror']);
    if(gu>0) flags.push(['bad','Jarima']);
    if(st==="Yo'lda"&&yol>N.yoldaKun) flags.push(['warn','Kechikmoqda']);
    if(st==='Chustda vagonda'&&kut>N.chustKun) flags.push(['warn',"Tushirilmagan"]);
    if(pre) flags.push(['na',"Boshlang'ich"]);
    return Object.assign({},v,{ext,kg,tw,dkE,orph,pre,ent,exd,st,yol,kut,tr,eta,tyH:ty,podH:pod,tushH:tush,guH:gu,chustH:pod+tush,pend,pendSum,
      sand:ext?(E.n(v.sp)!=null?E.n(v.sp):(sup?(+sup.price||0):0))*kg:0,flags});
  });
};
/* Vagon d kun oxirida vagon omboridami */
E.inT=(v,d)=>!!v.ent&&v.ent<=d&&!(v.exd&&v.exd<=d);
/* Vagon ombori davr hisoboti: boshida + yuklandi − tushirildi = oxirida (vagon, kg, qiymat komponentlar bo'yicha).
   Miqdor — Vagonlar jurnalidan, qiymat — qiymat zanjiridan (har vagon o'z qiymati bilan). */
E.vagWh=function(c,T,a,b){
  const led=c.led, W=c.vag.filter(v=>v.tw===T&&v.ent), a0=E.add(a,-1);
  const acc=list=>{ const o={n:list.length,kg:0,v:led.z(),est:false,list};
    for(const x of list){ o.kg+=x.kg; const l=led.wload[x.id]; if(l){ for(let i=0;i<o.v.length;i++) o.v[i]+=l.v[i]; if(l.est) o.est=true; } else if(x.kg>0) o.est=true; }
    o.val=E.vsum(o.v); o.unit=o.kg>0?o.val/o.kg:null; o.idle=E.idleOf(o.v); return o; };
  const inw=W.filter(v=>E.inT(v,b)), arrived=v=>!!v.dkE&&v.dkE<=b;
  return {open:acc(W.filter(v=>E.inT(v,a0))),load:acc(W.filter(v=>v.ent>=a&&v.ent<=b)),unl:acc(W.filter(v=>v.exd&&v.exd>=a&&v.exd<=b)),
    close:acc(inw),road:acc(inw.filter(v=>!arrived(v))),wait:acc(inw.filter(arrived))};
};
/* Tranzit ko'rsatkichlari: davrda Chustga kelgan vagonlarning fakt muddati va b kuniga yo'ldagilarning yoshi */
E.vagStat=function(c,T,a,b){
  const N=c.cfg.norms, tz=E.n(N.tranzKun)||6, mx=E.n(N.yoldaKun)||tz, W=c.vag.filter(v=>v.tw===T&&v.ent);
  const arr=W.filter(v=>v.tr!=null&&v.tr>=0&&E.inr(v.dkE,a,b)), days=arr.map(v=>v.tr);
  const unl=W.filter(v=>E.inr(v.dt,a,b)&&v.dkE&&v.dt>=v.dkE), wd=unl.map(v=>E.dn(v.dt)-E.dn(v.dkE));
  const road=W.filter(v=>E.inT(v,b)&&!(v.dkE&&v.dkE<=b)), age=v=>v.dy?E.dn(b)-E.dn(v.dy):null, ages=road.map(age).filter(x=>x!=null);
  const avg=x=>x.length?x.reduce((p,q)=>p+q,0)/x.length:null;
  return {tz,mx,n:arr.length,avg:avg(days),min:days.length?Math.min(...days):null,max:days.length?Math.max(...days):null,waitAvg:avg(wd),waitN:wd.length,
    fast:arr.filter(v=>v.tr<Math.floor(tz/2)).length,inNorm:ages.filter(x=>x<=tz).length,over:ages.filter(x=>x>tz&&x<=mx).length,late:ages.filter(x=>x>mx).length,
    unk:road.length-ages.length,oldest:ages.length?Math.max(...ages):null};
};
/* Chustga kutilayotgan kirim va Chust qoldig'i prognozi. Kelish sanasi = yuklangan sana + o'rtacha tranzit normasi.
   Chustda vagonda turganlar ertaga tushiriladi deb olinadi; muddati o'tgan vagonlar prognozga qo'shilmaydi (ehtiyotkor baho). */
E.pipeline=function(c,d,n){
  const tz=E.n(c.cfg.norms.tranzKun)||6, own=c.vag.filter(v=>E.inT(v,d)), arrived=v=>!!v.dkE&&v.dkE<=d;
  const wait=own.filter(arrived), road=own.filter(v=>!arrived(v)), etaOf=v=>v.dy?E.add(v.dy,tz):null, sum=l=>l.reduce((x,v)=>x+v.kg,0);
  const late=road.filter(v=>{ const e=etaOf(v); return !e||e<=d; });
  const nd=Math.min(7,E.dn(d)-E.dn(c.start)+1), out=nd>0?-E.flow(c,'C01',E.add(d,-(nd-1)),d,0)/nd:0, bal0=E.bal(c,'C01',d);
  let bal=bal0, short=null; const days=[];
  for(let i=1;i<=n;i++){ const dt=E.add(d,i), a=road.filter(v=>etaOf(v)===dt).concat(i===1?wait:[]), kg=sum(a); bal+=kg-out; if(bal<-0.5&&!short&&out>0) short=dt; days.push({d:dt,n:a.length,kg,out,bal}); }
  const lim=E.add(d,n), after=road.filter(v=>{ const e=etaOf(v); return e&&e>lim; });
  const ext=c.vag.filter(v=>v.ext&&!(v.dt&&v.dt<=d)&&((v.dy&&v.dy<=d)||(v.dkE&&v.dkE<=d)));
  return {tz,wait,road,late,after,ext,days,out,bal0,short,kgWait:sum(wait),kgRoad:sum(road),kgLate:sum(late),kgExt:sum(ext)};
};
/* ---------------------------------------------------------------------
   TEXNIKA BAKI — KICHIK OMBOR. Operator yonganini emas, QUYILGANINI biladi. Shuning uchun:
     quyildi (fakt)  — joy omboridan texnika bakiga o'tadi (ombor narxida);
     sarf (norma)    — moto-soat × norma (yuk mashinasida km × norma ÷ 100) bakdan chiqadi va tan narxga kiradi;
     bak o'lchandi   — hisobdagi qoldiq bilan o'lchangan qoldiq farqi «dizel og'ishi»: tan narxga yashirilmaydi, alohida ko'rinadi.
   Qoidalar:
   1) Norma usuli har texnika uchun BIRINCHI bak o'lchovidan keyin boshlanadi (o'sha o'lchov — bakning boshlang'ich qoldig'i). Undan oldingi yozuvlar
      avvalgidek: quyilgan dizel o'sha kunning sarfi (fakt usuli) — o'tgan davr qayta hisoblanmaydi.
   2) Norma yozuvning o'zida saqlanadi (nl): Normativlarda keyin o'zgartirilsa, o'tgan yozuvlar o'zgarmaydi. Normasiz yozuv — fakt usulida.
   3) Birinchi o'lchovdagi dizel avval (fakt usulida) quyilganda xarajatga chiqqan bo'lsa, o'sha qismi o'lchov kuni xarajatdan qaytariladi (manfiy dizel xarajati,
      shu bo'g'inga) — aks holda bakdagi dizel tan narxga ikki marta kirardi: bir marta quyilganda, ikkinchi marta norma bo'yicha yonganda.
   4) Bak qiymati: musbat qoldiq — quyilgan narxlarning o'rtachasida; manfiy qoldiq (quyilgani kiritilmagan) — oxirgi ombor narxida, quyilganda tenglashtiriladi.
   Tenglik (har texnika): boshlang'ich + quyildi = sarf + og'ish + bak qoldig'i — litrda ham, so'mda ham.
   --------------------------------------------------------------------- */
E.isAud=r=>E.n(r.bak)!=null;
E.tankRun=function(cfg,rows,P){
  const by={}, M={}, vars=[];
  const ord=rows.filter(r=>r.d&&r.mc).sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:((E.isAud(a)?1:0)-(E.isAud(b)?1:0))||((a.at||0)-(b.at||0)));
  for(const r of ord){ const m=E.mc(cfg,r.mc); if(!m) continue;
    const truck=m.type==='T', p=E.pr(P,'DIZEL',r.d,E.siteOf(cfg,r.loc,r.mc)), l=E.n(r.l)||0, bak=E.n(r.bak);
    const T=M[r.mc]||(M[r.mc]={q:0,v:0,on:false,onD:null,factL:0,fuelL:0,fuelV:0,consL:0,consV:0,ogL:0,ogV:0,openL:0,openV:0,credL:0,credV:0,lastD:null,lastBak:null,iw:0,ifu:0,ic:0,ints:[],evs:[],neg:null});
    let e;
    if(bak!=null){
      if(!T.on){ const cl=Math.min(bak,T.factL), cv=cl*p; T.on=true; T.onD=r.d; T.q=bak; T.v=bak*p; T.openL=bak; T.openV=bak*p; T.credL=cl; T.credV=cv;
        e={aud:true,kind:'open',bak,book:null,ogL:-cl,og:-cv,dz:-cv,fuel:0,cons:0,work:0,tank:bak,price:p};
        if(cv>0) vars.push({id:r.id,d:r.d,mc:r.mc,l:-cl,v:-cv,kind:'open'}); }
      else { const book=T.q, diff=book-bak; let og=0;
        if(diff>0){ og=T.v*diff/book; T.v-=og; }                                         /* kamomad: bakdagi o'rtacha narxda */
        else if(diff<0){ if(book<0){ const vn=bak*p; og=T.v-vn; T.v=vn; } else { og=diff*(book>0?T.v/book:p); T.v-=og; } }   /* ortiqcha: og manfiy */
        T.q=bak; T.ogL+=diff; T.ogV+=og;
        const it={id:r.id,from:T.lastD,to:r.d,work:T.iw,fuel:T.ifu,norm:T.ic,start:T.lastBak,bak,act:T.lastBak+T.ifu-bak,ogL:diff,og,dev:T.ic>0?diff/T.ic:null}; T.ints.push(it);
        e={aud:true,kind:'aud',bak,book,ogL:diff,og,dz:0,fuel:0,cons:0,work:0,tank:bak,price:p,it};
        vars.push({id:r.id,d:r.d,mc:r.mc,l:diff,v:og,kind:'aud'}); }
      T.lastD=r.d; T.lastBak=bak; T.iw=0; T.ifu=0; T.ic=0; }
    else { const nl=E.n(r.nl), work=truck?(E.n(r.km)||0):(E.n(r.mh)||0);
      if(!T.on||nl==null){ if(!T.on) T.factL+=l; e={nm:false,fuel:l,cons:l,dz:l*p,work,tank:T.on?T.q:null,price:p}; }      /* fakt usuli: quyilgan = sarf, bakka tegmaydi */
      else { let adj=0;
        if(l>0){ if(T.q<0){ const v0=T.v; T.q+=l; T.v=T.q*p; adj=v0+l*p-T.v; } else { T.q+=l; T.v+=l*p; } T.fuelL+=l; T.fuelV+=l*p; T.ifu+=l; }
        const cons=nl*(truck?work/100:work); let val=0;
        if(cons>0){ if(T.q>0){ const fp=Math.min(cons,T.q); val=T.v*fp/T.q+(cons-fp)*p; } else val=cons*p; T.q-=cons; T.v-=val; if(Math.abs(T.q)<1e-9){ adj+=T.v; T.q=0; T.v=0; } }
        T.consL+=cons; T.consV+=val+adj; T.iw+=work; T.ic+=cons;
        e={nm:true,nl,fuel:l,cons,dz:val+adj,work,tank:T.q,price:p,neg:T.q<-1e-6}; if(e.neg&&!T.neg) T.neg=r.d; } }
    e.id=r.id; e.d=r.d; by[r.id]=e; T.evs.push(e); }
  return {by,mc:M,vars}; };
/* d kun oxiriga bak holati: on — norma usuli yoqilganmi, q — hisobdagi qoldiq, last — oxirgi o'lchov */
E.tankAt=function(c,code,d){ const T=c.TK.mc[code]; if(!T) return {on:false,onD:null,q:null,last:null}; let q=null, last=null;
  for(const e of T.evs){ if(e.d>d) break; if(e.tank!=null) q=e.tank; if(e.aud) last=e; } return {on:T.on&&T.onD<=d,onD:T.onD,q,last}; };
/* Davr bo'yicha: aud — dizel og'ishi (bak o'lchovlari farqi, tan narxdan tashqarida); open — birinchi o'lchovda xarajatdan qaytarilgan dizel (tan narx ichida, manfiy) */
E.fuelVar=function(c,a,b){ const o={aud:{l:0,v:0,n:0},open:{l:0,v:0,n:0},by:{}}; for(const x of c.TK.vars){ if(!E.inr(x.d,a,b)) continue; const g=o[x.kind]; g.l+=x.l; g.v+=x.v; g.n++;
    const m=o.by[x.mc]||(o.by[x.mc]={l:0,v:0,n:0,cl:0,cv:0}); if(x.kind==='aud'){ m.l+=x.l; m.v+=x.v; m.n++; } else { m.cl+=x.l; m.cv+=x.v; } } return o; };
/* Baklar tengligi: boshlang'ich + quyildi − sarf − og'ish − qoldiq = 0 (so'm va litr) */
E.tankCheck=function(c){ let dv=0, dl=0, n=0, val=0, lit=0; for(const k in c.TK.mc){ const T=c.TK.mc[k]; if(!T.on) continue; n++; val+=T.v; lit+=T.q;
    dv=Math.max(dv,Math.abs(T.openV+T.fuelV-T.consV-T.ogV-T.v)); dl=Math.max(dl,Math.abs(T.openL+T.fuelL-T.consL-T.ogL-T.q)); } return {dv,dl,n,val,lit}; };
/* TEXNIKA KARTOCHKASI: bitta texnika (yoki yuk mashinasi) bo'yicha davr hisoboti — bak daftari, ish joylari, o'lchovlar oralig'i, oylar, reyslar, ta'mir */
E.mcRep=function(c,code,a,b){ const cfg=c.cfg, m=E.mc(cfg,code); if(!m) return null; const truck=m.type==='T', T=c.TK.mc[code]||null;
  const rows=c.tex.filter(t=>t.mc===code&&E.inr(t.d,a,b)).sort((x,y)=>x.d<y.d?-1:x.d>y.d?1:((x.aud?1:0)-(y.aud?1:0))||((x.at||0)-(y.at||0)));
  const tot={work:0,fuel:0,fuelV:0,cons:0,dz:0,am:0,ogL:0,og:0,auds:0,credL:0,cred:0,days:0,kg:0,kgW:0,mhW:0,nmN:0,factN:0,nmFuel:0,nmCons:0,openL:0}, where={}, months={}, dset={};
  const mo=d=>months[d.slice(0,7)]||(months[d.slice(0,7)]={m:d.slice(0,7),work:0,fuel:0,cons:0,dz:0,am:0,ogL:0,og:0,auds:0,kg:0,ds:{}});
  for(const t of rows){ const M=mo(t.d);
    if(t.aud){ if(t.audK==='aud'){ tot.ogL+=t.ogL; tot.og+=t.og; tot.auds++; M.ogL+=t.ogL; M.og+=t.og; M.auds++; } else { tot.cred+=t.og; tot.credL+=t.credL||0; tot.openL+=t.bak; tot.dz+=t.dz; M.dz+=t.dz; tot.cons-=t.credL||0; M.cons-=t.credL||0;
        if(!truck&&t.dz){ const k=t.loc+'|A', g=where[k]||(where[k]={loc:t.loc,op:'A',ds:{},work:0,kg:0,cons:0,dz:0,am:0}); g.cons-=t.credL||0; g.dz+=t.dz; } } continue; }      /* boshlang'ich o'lchov: bakda qolgan dizel sarfdan ham, summadan ham chiqariladi */
    const w=truck?t.km:t.mh; tot.work+=w; tot.fuel+=t.fuel; tot.fuelV+=t.fuel*t.price; tot.cons+=t.cons; tot.dz+=t.dz; tot.am+=t.am; tot.kg+=t.kg||0; if(w>0){ dset[t.d]=1; M.ds[t.d]=1; } if(!truck&&t.mh>0&&t.op!=='B'){ tot.kgW+=t.kg||0; tot.mhW+=t.mh; }
    if(t.nm){ tot.nmN++; tot.nmFuel+=t.fuel; tot.nmCons+=t.cons; } else tot.factN++;
    M.work+=w; M.fuel+=t.fuel; M.cons+=t.cons; M.dz+=t.dz; M.am+=t.am; M.kg+=t.kg||0;
    if(!truck){ const k=t.loc+'|'+(t.op||''), g=where[k]||(where[k]={loc:t.loc,op:t.op,ds:{},work:0,kg:0,cons:0,dz:0,am:0}); if(w>0) g.ds[t.d]=1; g.work+=w; g.kg+=t.kg||0; g.cons+=t.cons; g.dz+=t.dz; g.am+=t.am; } }
  tot.days=Object.keys(dset).length;
  const trips={}; let tn=0, tkg=0, th=0;
  if(truck) for(const r of c.reys) if(r.own&&r.tk===code&&E.inr(r.d,a,b)){ const g=trips[r.m]||(trips[r.m]={name:r.rname,n:0,kg:0,haul:0,kr:r.kr}); g.n+=r.rn; g.kg+=r.kgQ; g.haul+=r.haul; tn+=r.rn; tkg+=r.kgQ; th+=r.haul; }
  const rep={}; let repS=0; for(const x of c.xar) if(x.mc===code&&E.inr(x.d,a,b)){ const nm=(c.item[x.it]||{}).name||x.it; rep[nm]=(rep[nm]||0)+(E.n(x.sum)||0); repS+=E.n(x.sum)||0; }
  const st1=E.tankAt(c,code,b), st0=E.tankAt(c,code,E.add(a,-1));
  /* davr tengligi (litr): boshida + boshlang'ich o'lchov + quyildi − sarf − og'ish = oxirida (faqat norma usulidagi yozuvlar) */
  const chk=st1.on?((st0.on?st0.q:0)+tot.openL+tot.nmFuel-tot.nmCons-tot.ogL-st1.q):0;
  return {m,truck,T,rows,tot,where:Object.values(where).map(g=>Object.assign(g,{days:Object.keys(g.ds).length})),months:Object.values(months).sort((x,y)=>x.m<y.m?-1:1).map(g=>Object.assign(g,{days:Object.keys(g.ds).length})),
    ints:T?T.ints.filter(i=>E.inr(i.to,a,b)):[],trips:Object.values(trips),tn,tkg,th,rep,repS,st0,st1,chk,nL:E.n(m.normL),nT:E.n(m.normT)||null,cap:E.n(m.bakV)||null}; };
/* Texnika kunlik yozuvi. Ekskavator/pogruzchik: moto-soat bo'yicha; yuk mashinasi: km bo'yicha.
   Dizel: l — quyilgan (ombordan chiqqan); cons — xarajatga olingan sarf (fakt usulida = l, norma usulida = norma × ish); dz — shu sarfning qiymati. */
E.dTex=function(cfg,rows,P,krDay,sandDay,ksM,loadDay){
  const tol=cfg.tol, last={}, prev={}, kg0={}; krDay=krDay||{}; sandDay=sandDay||{}; loadDay=loadDay||{}; const TK=E.tankRun(cfg,rows,P);
  /* Krisha ochgan texnika: ish hajmi alohida kiritilmagan bo'lsa, shu kun shu karyerdagi krisha reyslari hajmi olinadi
     (bir turdagi bir necha texnika ishlagan bo'lsa — moto-soatga mutanosib). Norma qum qazishdagi bilan bir xil. */
  /* Karyer ishi (U): kunlik ish hajmi = ochilgan krisha + qazilgan qum + yuklangan qum (ko'chirilgan har tonna teng). Kim nimani qilgani so'ralmaydi,
     shuning uchun hajm shu kuni ishlagan HAMMA texnika o'rtasida bo'linadi: (moto-soat × norma t/soat) ga mutanosib; biror texnikada norma bo'lmasa —
     moto-soatga mutanosib. Shunda texnikalar hajmi yig'indisi haqiqiy hajmga teng (bir tonna ikki marta sanalmaydi) va norma bajarilishi butun brigada uchun bir xil chiqadi. */
  for(const r of rows){ if(!((r.op==='K'&&E.n(r.kg)==null)||r.op==='U')) continue; if(r.op==='U'&&!(E.n(r.mh)>0)) continue; const m=E.mc(cfg,r.mc), u=r.op==='U', k=u?'U|'+r.loc+'|'+r.d:r.op+'|'+r.loc+'|'+r.d+'|'+(m?m.type:'?'), g=kg0[k]||(kg0[k]={mh:0,n:0,w:0,nn:0});
    const h=E.n(r.mh)||0, nt=(m&&E.n(m.normT))||0; g.mh+=h; g.n++; if(nt>0){ g.w+=h*nt; g.nn++; } }
  rows.slice().sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:(a.at||0)-(b.at||0)).forEach(r=>{ if(E.n(r.mr)!=null&&!E.isAud(r)){ prev[r.id]=last[r.mc]; last[r.mc]=E.n(r.mr); } });
  const out=rows.map(r=>{
    const m=E.mc(cfg,r.mc)||{code:r.mc,name:r.mc||'—',type:'?',loc:r.loc};
    const truck=m.type==='T';
    const site=E.siteOf(cfg,r.loc,r.mc), l=E.n(r.l)||0, rate=E.n(r.ar)!=null?E.n(r.ar):E.mcRate(m), nL=E.n(m.normL), price=E.pr(P,'DIZEL',r.d,site), flags=[];
    const k=TK.by[r.id]||null, nm=!!(k&&k.nm), cons=k?k.cons:l, dz=k?k.dz:l*price, tank=k?k.tank:null, cap=E.n(m.bakV)||null;
    if(k&&k.aud){ const fl=[];      /* bak o'lchovi: xarajat emas; farqi — dizel og'ishi */
      if(k.kind==='open') fl.push(['na',"Boshlang'ich o'lchov"]);
      else { const it=k.it; if(it.dev!=null&&it.dev>tol) fl.push(['bad','Dizel oshgan']); else if(it.dev!=null&&it.dev<-tol) fl.push(['warn','Sarf normadan kam']); else if(it.dev==null&&Math.abs(k.ogL)>0.5) fl.push(['warn',"O'lchovlar orasida ish yozuvi yo'q"]); }
      if(cap&&k.bak>cap*1.02) fl.push(['bad',"Bak sig'imidan katta"]);
      return Object.assign({},r,{m,truck,loc:truck?TR:(r.loc||m.loc),op:truck?null:'A',aud:true,audK:k.kind,qo:true,bak:k.bak,book:k.book,ogL:k.kind==='aud'?k.ogL:null,og:k.og,credL:k.kind==='open'?-k.ogL:0,it:k.it||null,tank:k.tank,nm:true,
        mh:0,km:0,l:0,fuel:0,cons:0,kg:0,kgD:false,ku:null,kl:null,t:0,rate:0,dz:k.dz||0,am:0,price,lmh:null,tmh:null,nL,nT:null,has:true,overL:k.kind==='aud'?k.ogL:null,shortT:null,perT:null,normPerT:null,flags:fl}); }
    if(nm){ if(k.neg) flags.push(['warn','Bak hisobda manfiy']); else if(cap&&tank>cap*1.05) flags.push(['warn',"Hisobda bak sig'imidan ko'p"]); }
    if(truck){ const km=E.n(r.km)||0, am=km*rate, l100=(km&&!nm)?l/km*100:null, overL=(nL!=null&&!nm)?l-nL*km/100:null;
      if(nL==null) flags.push(['na',"Norma yo'q"]); else if(l100!=null&&l100>nL*(1+tol)) flags.push(['bad','Dizel oshgan']);
      if(prev[r.id]!=null&&Math.abs((E.n(r.mr)-prev[r.id])-km)>0.6) flags.push(['bad','Hisoblagich mos emas']);
      return Object.assign({},r,{m,truck,loc:TR,op:null,mh:0,km,l,fuel:l,cons,nm,tank,kg:0,t:0,rate,dz,am,price,lmh:l100,tmh:null,nL,nT:null,has:nL!=null,overL,shortT:null,perT:null,normPerT:null,flags}); }
    const mh=E.n(r.mh)||0; let kg=E.n(r.kg)||0, kgD=false;
    let ku=null, kl=null; const dk=r.loc+'|'+r.d, qo=r.op==='Q'&&!mh&&!l;      /* qo — faqat miqdor yozuvi: texnika ko'rsatkichlariga kirmaydi */
    if(r.op==='K'&&E.n(r.kg)==null){ const g=kg0['K|'+dk+'|'+m.type], tot=krDay[dk]||0; kg=g?tot*(g.mh>0?mh/g.mh:1/g.n):0; kgD=true; }
    if(r.op==='U'){ const g=kg0['U|'+dk], sq=sandDay[dk]||0, kq=krDay[dk]||0, lq=loadDay[dk]||0, tot=sq+kq+lq, nt=E.n(m.normT)||0, KY=stageOf(r.loc)==='karyer';
      kg=(g&&mh>0)?tot*((g.nn===g.n&&g.w>0)?mh*nt/g.w:(g.mh>0?mh/g.mh:1/g.n)):0; kgD=true;
      /* ulushlar shu kungi tonna bo'yicha: ku — krisha (hovuzga), kl — yuklash (shu kuni jo'natilgan qumga), qolgani — qazish (karyer omboriga).
         Shu kuni hech qanday hajm kiritilmagan bo'lsa — krishaga oy ulushi, qolgani omborga. */
      ku=KY?(tot>0?kq/tot:(ksM?ksM(r.loc,r.d):0)):0; kl=(KY&&tot>0)?lq/tot:0; }
    const t=kg/1000, nT=E.n(m.normT)||null;
    const am=mh*rate, lmh=(mh&&!nm)?l/mh:null, tmh=(mh&&r.op!=='B')?t/mh:null, has=nL!=null&&nT!=null;
    const overL=(nL!=null&&!nm)?l-nL*mh:null, shortT=(nT!=null&&r.op!=='B')?nT*mh-t:null;
    const perT=t?(dz+am)/t:null, normPerT=has?(nL*E.prNow(P,'DIZEL',site)+rate)/nT:null;
    if(qo){ /* miqdor yozuvi: norma tekshiruvi yo'q */ }
    else if(!has) flags.push(['na',"Norma yo'q"]);
    else { if(lmh!=null&&lmh>nL*(1+tol)) flags.push(['bad','Dizel oshgan']); if(tmh!=null&&tmh<nT*(1-tol)&&t>0) flags.push(['bad','Unum past']); }
    if(r.op==='U'&&!(kg>0)&&mh>0&&stageOf(r.loc)==='karyer') flags.push(['warn',"Shu kunga hajm yo'q"]);
    if(prev[r.id]!=null&&Math.abs((E.n(r.mr)-prev[r.id])-mh)>0.11) flags.push(['bad','Hisoblagich mos emas']);
    if(!stageOf(r.loc)||r.loc===TR) flags.push(['bad',"Bo'g'in yo'q"]);
    return Object.assign({},r,{m,truck,mh,km:0,l,fuel:l,cons,nm,tank,kg,kgD,ku,kl,qo,t,rate,dz,am,price,lmh,tmh:(tmh!=null&&t>0)?tmh:null,nL,nT,has,overL,shortT:(shortT!=null&&(r.op!=='U'||t>0))?shortT:null,perT,normPerT,flags});
  });
  out.TK=TK; return out;
};
E.texRep=function(c,a,b){
  const g={};
  for(const t of c.tex){ if(t.truck||!E.inr(t.d,a,b)) continue;
    const x=g[t.mc]||(g[t.mc]={mh:0,l:0,cons:0,ogL:0,og:0,auds:0,kg:0,kgW:0,mhW:0,dz:0,am:0,overL:null,shortT:null,rep:0,days:0});
    if(t.aud){ x.dz+=t.dz; if(t.audK==='aud'){ x.ogL+=t.ogL; x.og+=t.og; x.auds++; x.overL=(x.overL||0)+t.ogL; } continue; }
    x.mh+=t.mh; x.l+=t.l; x.cons+=t.cons; x.dz+=t.dz; x.am+=t.am; x.days++;
    if(t.op!=='B'&&t.mh>0){ x.kgW+=t.kg; x.mhW+=t.mh; } x.kg+=t.kg;
    if(t.overL!=null) x.overL=(x.overL||0)+t.overL; if(t.shortT!=null) x.shortT=(x.shortT||0)+t.shortT; }
  for(const x of c.xar){ if(x.mc&&g[x.mc]&&E.inr(x.d,a,b)) g[x.mc].rep+=E.n(x.sum)||0; }
  return c.cfg.machines.filter(m=>m.type!=='T').map(m=>{ const x=g[m.code]||{mh:0,l:0,cons:0,ogL:0,og:0,auds:0,kg:0,kgW:0,mhW:0,dz:0,am:0,overL:null,shortT:null,rep:0,days:0};
    const nL=E.n(m.normL), nT=E.n(m.normT)||null, has=nL!=null&&nT!=null;
    x.m=m; x.nL=nL; x.nT=nT; x.has=has; x.lmh=x.mh?(x.cons+x.ogL)/x.mh:null; x.tmh=x.mhW?x.kgW/1000/x.mhW:null; x.tank=E.tankAt(c,m.code,b>c.D?c.D:b);
    const dp=E.prNow(c.P,'DIZEL',SITE_OF[m.loc]);
    x.perT=x.kgW?(x.dz+x.am)/(x.kgW/1000):null; x.normPerT=has?(nL*dp+E.mcRate(m))/nT:null;
    x.overSum=x.overL!=null?x.overL*dp:null; return x; });
};
/* O'z yuk mashinalari: yoqilg'i, masofa, reyslar va reysga tushgan to'liq tannarx */
E.truckRep=function(c,a,b){
  return E.trucks(c.cfg).map(m=>{ const x={m,km:0,l:0,cons:0,ogL:0,og:0,auds:0,dz:0,am:0,overL:null,n:0,kg:0,cost:0,pdz:0,pam:0,plab:0,poth:0,ext:0};
    for(const t of c.tex) if(t.truck&&t.mc===m.code&&E.inr(t.d,a,b)){ x.km+=t.km; x.l+=t.l; x.cons+=t.cons; x.dz+=t.dz; x.am+=t.am; if(t.overL!=null) x.overL=(x.overL||0)+t.overL; if(t.aud&&t.audK==='aud'){ x.ogL+=t.ogL; x.og+=t.og; x.auds++; } }
    for(const r of c.reys) if(r.own&&r.tk===m.code&&E.inr(r.d,a,b)){ x.n+=r.rn; x.kg+=r.kgQ; x.cost+=r.haul; x.ext+=r.rt.type==='reys'?r.rt.tarif*r.rn:r.rt.tarif*r.kgQ;
      if(r.parts){ x.pdz+=r.parts.dz; x.pam+=r.parts.am; x.plab+=r.parts.lab; x.poth+=r.parts.oth; } }
    x.nL=E.n(m.normL); x.l100=x.km?(x.cons+x.ogL)/x.km*100:null; x.tank=E.tankAt(c,m.code,b>c.D?c.D:b); x.perTrip=x.n?x.cost/x.n:null; x.perKg=x.kg?x.cost/x.kg:null; x.extTrip=x.n?x.ext/x.n:null; return x; });
};
E.trucks=cfg=>cfg.machines.filter(m=>m.type==='T');

/* Doimiy xarajat: yopilgan oyda fakt (oy kunlariga teng yoyiladi), fakt yo'q bo'lsa reja; ochiq oyda reja ulushi.
   Shu sababli kunlar yig'indisi har doim oy summasiga teng — ikki xil ko'rinishda ikki xil raqam chiqmaydi. */
E.monthFact=function(c,code,L,m){ if(!c._mfAll){ c._mfAll={}; c._mfHas={}; for(const x of c.xar){ if(!x.d) continue; const k=x.it+'|'+x.lk+'|'+x.d.slice(0,8)+'01'; c._mfAll[k]=(c._mfAll[k]||0)+x.sumC; c._mfHas[k]=1; } } return c._mfAll[code+'|'+L+'|'+m]||0; };
E.monthHas=function(c,code,L,m){ E.monthFact(c,code,L,m); return !!c._mfHas[code+'|'+L+'|'+m]; };
E.monthFactOld=function(c,code,L,m){ const k=code+'|'+L+'|'+m; if(k in c._mf) return c._mf[k]; let s=0; const me=E.me(m);
  for(const x of c.xar) if(x.it===code&&x.lk===L&&x.d>=m&&x.d<=me) s+=E.n(x.sum)||0; return c._mf[k]=s; };
/* BO'SH TURISH — ishlagan kun bo'yicha, rejaga bog'liq emas.
   Ish bo'lgan kun: shu bo'g'inda texnika ishlagan (moto-soat, hajm yoki dizel yozilgan) yoki qum harakati bo'lgan kun
   (karyerdan reys chiqqan; stansiyaga reys kelgan yoki vagon yuklangan; Chustda vagon tushirilgan yoki zavodga reys chiqqan).
   Bunday yozuvi yo'q kun — bo'sh turgan kun; o'sha kunning doimiy xarajati (ish haqi, ijara va h.k.) «bo'sh turish» deb belgilanadi.
   Bu qo'shimcha xarajat emas, tan narx ICHIDAGI «shundan» ko'rsatkich: jami o'zgarmaydi. Alohida kiritish talab qilmaydi. */
E.fixDay=function(c,it,L,d){ const m=E.ms(d), plan=E.planOf(it,L), dim=E.dim(m);
  if(m<E.ms(c.D)){ const mf=E.monthFact(c,it.code,L,m); return (E.monthHas(c,it.code,L,m)?mf:plan)/dim; }
  if(plan>0) return plan/dim;
  let x=0; for(const r of c.xarD[d]||[]) if(r.it===it.code&&r.lk===L) x+=r.sumC; return x; };
/* doimiy modda kunlik summasi baho (reja) bo'yichami: 1 — reja ulushi, 0 — fakt */
E.fixEst=function(c,it,L,d){ const m=E.ms(d), plan=E.planOf(it,L); if(m<E.ms(c.D)) return E.monthHas(c,it.code,L,m)?0:1; return plan>0?1:0; };
E.idleDays=function(c,L,a,b){ const days=[], its=c.fixItems[stageOf(L)]||[]; let sum=0,n=0;
  for(let d=a; d<=b; d=E.add(d,1)){ n++; if(c.act[L][d]) continue; let x=0; for(const it of its) x+=E.fixDay(c,it,L,d); x*=1-c.ks(L,d); if(x>0){ days.push(d); sum+=x; } }
  return {days,sum,n}; };
E.itemCost=function(c,it,L,a,b,mode){
  /* acc — bo'g'in jami; kr — shundan krisha ochishga tegishli qismi (faqat karyerda, oy hajmi ulushi bo'yicha) */
  const K=stageOf(L)==='karyer'; let raw=0, rawK=0;
  if(a<=b) for(const x of E.rng(c,'xar',a,b)) if(x.it===it.code&&x.lk===L){ raw+=x.sumC; if(K) rawK+=x.sumC*c.ks(L,x.d); }
  const plan=E.planOf(it,L);
  if(it.type!=='D'||mode==='fact') return {acc:raw,raw,planM:null,est:0,plan,kr:rawK};
  let acc=0,pm=0,est=0,kr=0,m=E.ms(a); const cm=E.ms(c.D);
  while(m<=b){ const me=E.me(m), sa=a>m?a:m, sb=b<me?b:me, fr=(E.dn(sb)-E.dn(sa)+1)/E.dim(m); pm+=plan*fr; let x=0;
    if(m<cm){ const mf=E.monthFact(c,it.code,L,m); if(E.monthHas(c,it.code,L,m)) x=mf*fr; else { x=plan*fr; est+=plan*fr; } }
    else if(plan>0){ x=plan*fr; est+=plan*fr; }
    else { for(const r of E.rng(c,'xar',sa,sb)) if(r.it===it.code&&r.lk===L) x+=r.sumC; }
    acc+=x; if(K) kr+=x*c.ks(L,m); m=E.add(me,1); }
  return {acc,raw,planM:pm,est,plan,kr};
};
/* O'z transporti tannarxi: har oy uchun (dizel + amortizatsiya + ish haqi + boshqa) → reyslarga.
   Mashinaning o'z xarajati — o'z reyslariga; umumiy xarajat (ish haqi, reyssiz mashina) — hamma o'z reyslariga.
   Og'irlik: marshrut masofasi (km), kiritilmagan bo'lsa har reys teng. */
E.ownAlloc=function(c){
  const cfg=c.cfg, cm=E.ms(c.D), mon={}, res={months:{},unalloc:0,unallocList:[],est:0};
  const own=c.reys.filter(r=>r.own), titems=cfg.items.filter(i=>i.stage==='trans');
  own.forEach(r=>mon[E.ms(r.d)]=1); c.tex.forEach(t=>{ if(t.truck) mon[E.ms(t.d)]=1; }); c.xar.forEach(x=>{ if(x.lk===TR&&x.d) mon[E.ms(x.d)]=1; });
  if(titems.some(i=>i.type==='D'&&E.planOf(i,TR)>0)){ let m=E.ms(c.start); while(m<=cm){ mon[m]=1; m=E.add(E.me(m),1); } }
  for(const m of Object.keys(mon).sort()){ if(E.me(m)<c.start) continue;
    const a=m<c.start?c.start:m, b=(m===cm&&c.D<E.me(m))?c.D:E.me(m), T={};
    const tk=code=>T[code]||(T[code]={dz:0,am:0,oth:0,W:0,n:0});
    for(const t of c.tex) if(t.truck&&E.inr(t.d,a,b)){ const x=tk(t.mc); x.dz+=t.dz; x.am+=t.am; }
    let lab=0, oth=0, est=0;
    for(const it of titems){
      if(it.type==='D'){ const r=E.itemCost(c,it,TR,a,b,'acc'); lab+=r.acc; est+=r.est; }
      else for(const x of c.xar) if(x.it===it.code&&x.lk===TR&&E.inr(x.d,a,b)){ const s=x.sumC; if(x.mc&&E.isTruck(cfg,x.mc)) tk(x.mc).oth+=s; else oth+=s; } }
    const trips=own.filter(r=>E.inr(r.d,a,b)); let W=0;
    trips.forEach(r=>{ const x=tk(r.tk); x.W+=r.w; x.n+=r.rn; W+=r.w; });
    let sdz=0,sam=0,soth=oth,idle=0;
    for(const k in T){ if(T[k].W===0){ sdz+=T[k].dz; sam+=T[k].am; soth+=T[k].oth; idle+=T[k].dz+T[k].am+T[k].oth; } }
    const tot=Object.values(T).reduce((s,x)=>s+x.dz+x.am+x.oth,0)+lab+oth;
    if(W===0){ if(tot>0.5){ res.unalloc+=tot; res.unallocList.push([m,tot]); } }
    else { res.est+=est; trips.forEach(r=>{ const x=T[r.tk], f=r.w/x.W, g=r.w/W;
      r.parts={dz:x.dz*f+sdz*g,am:x.am*f+sam*g,lab:lab*g,oth:x.oth*f+soth*g}; r.haul=r.parts.dz+r.parts.am+r.parts.lab+r.parts.oth; r.perKg=r.kgQ?r.haul/r.kgQ:null; }); }
    res.months[m]={a,b,T,lab,oth,W,tot,est,idle,n:trips.reduce((q,r)=>q+r.rn,0)}; }
  return res;
};
/* Davr bo'yicha qatorlar: sana indeksidan (qisqa davr) yoki bir o'tishda (uzun davr); natija keshlanadi */
E.rng=function(c,key,a,b){ const ck=key+'|'+a+'|'+b; let r=c._rg[ck]; if(r) return r; const src=c.src[key], arr=src[0], df=src[1];
  if(a>b){ r=[]; }
  else if(E.dn(b)-E.dn(a)>92){ r=arr.filter(x=>E.inr(df(x),a,b)); }
  else { let ix=c._ix[key]; if(!ix){ ix=c._ix[key]={}; for(const x of arr){ const d=df(x); if(d) (ix[d]||(ix[d]=[])).push(x); } }
    r=[]; for(let d=a; d<=b; d=E.add(d,1)){ const l=ix[d]; if(l) for(const x of l) r.push(x); } }
  return c._rg[ck]=r; };
/* Bitta kontekst: hisobot sanasi D uchun hamma hosila ma'lumot */
E.ctx=function(cfg,rows,D,end){
  const c={cfg,D,start:cfg.start,_mf:{}};
  c.item={}; cfg.items.forEach(i=>c.item[i.code]=i);
  const leg={KARYER:'K01',STANSIYA:'S01'};
  c.mat=rows.mat.map(m=>leg[m.st]?Object.assign({},m,{st:leg[m.st]}):m);
  /* tan narxga kiradigan ulush yozuvning o'zida saqlanadi (sh): moddaning ulushi keyin o'zgarsa, o'tgan yozuvlar o'zgarmaydi; belgisiz yozuv — to'liq kiradi */
  c.xar=rows.xar.map(x=>{ const it=c.item[x.it], v=E.n(x.sh), sh=v==null?1:Math.max(0,Math.min(1,v)), sum=E.n(x.sum)||0; return Object.assign({},x,{lk:x.lk||(it?linksOf(it.stage)[0]:null),sumC:sum*sh,sumX:sum*(1-sh)}); });
  c.kar=rows.karyer||[];
  c.P=E.matInfo(cfg,c.mat,rows.tex);
  c.LN={}; LINKS.forEach(L=>c.LN[L]=E.linkNorm(cfg,c.P,L));
  c.NS=E.normRates(cfg,c.P,c.LN);
  c.reys=E.dReys(cfg,rows.reys);
  const va=E.dVag(cfg,rows.vagon,D); c.vag=va.filter(v=>!v.orph); c.vagX=va.filter(v=>v.orph);
  c.openT={}; TW.forEach(T=>c.openT[T]=0); for(const v of c.vag) if(v.pre) c.openT[v.tw]+=v.kg;
  const krDay={}, sandDay={}; for(const r of c.reys) if(r.kr){ const k=r.from+'|'+r.d; krDay[k]=(krDay[k]||0)+r.kgQ; }
  for(const t of rows.tex) if(t.op==='Q'&&t.d&&KQ.indexOf(t.loc)>=0&&!E.isTruck(cfg,t.mc)){ const k=t.loc+'|'+t.d; sandDay[k]=(sandDay[k]||0)+(E.n(t.kg)||0); }
  for(const k of c.kar) if(k.d){ const q='K01|'+k.d; sandDay[q]=(sandDay[q]||0)+(E.n(k.kg)||0); }
  const loadDay={}; for(const r of c.reys) if(!r.kr&&r.d&&KQ.indexOf(r.from)>=0){ const k=r.from+'|'+r.d; loadDay[k]=(loadDay[k]||0)+r.kgJ; }
  c.krDay=krDay; c.sandDay=sandDay; c.loadDay=loadDay;
  /* oy ulushi xom yozuvlardan: texnika yozuvlarini hisoblashdan oldin kerak (hajmsiz kunda «karyer ishi» shu ulush bilan bo'linadi) */
  c.kr=E.krPre(c,rows.tex,end&&end>D?end:D); c.ks=(L,d)=>{ const k=c.kr[L]; return k?(k.ks[d.slice(0,8)+'01']||0):0; };
  c.tex=E.dTex(cfg,rows.tex,c.P,krDay,sandDay,c.ks,loadDay); c.TK=c.tex.TK;
  c._ix={}; c._rg={}; c.src={tex:[c.tex,t=>t.d],reys:[c.reys,r=>r.d],xar:[c.xar,x=>x.d],mat:[c.mat,m=>m.d],kar:[c.kar,k=>k.d],vdy:[c.vag,v=>v.dy],vdt:[c.vag,v=>v.dt]};
  c.own=E.ownAlloc(c);
  c.xarD={}; for(const x of c.xar) if(x.d) (c.xarD[x.d]||(c.xarD[x.d]=[])).push(x);
  c.fixItems={}; cfg.items.forEach(i=>{ if(i.type==='D'&&i.stage!=='trans') (c.fixItems[i.stage]||(c.fixItems[i.stage]=[])).push(i); });
  /* ish bo'lgan kunlar: mavjud jurnallardan, alohida belgi kiritilmaydi */
  c.act={}; LINKS.forEach(L=>c.act[L]={}); { const mark=(L,d)=>{ if(c.act[L]&&d) c.act[L][d]=1; };
    for(const t of c.tex) if(!t.truck&&(t.mh>0||t.kg>0||(t.l>0&&!t.nm))) mark(t.loc,t.d);
    for(const k of c.kar) mark('K01',k.d);
    for(const r of c.reys){ mark(r.from,r.d); mark(r.to,r.d); }
    for(const v of c.vag){ if(!v.ext&&v.dy) mark(v.src,v.dy); if(v.dt) mark('C01',v.dt); } }
  const fl=[]; const s=cfg.start;
  for(const k of c.kar) if(k.d>=s) fl.push(['K01',k.d,E.n(k.kg)||0,1]);
  for(const t of c.tex) if(t.d>=s&&t.op==='Q'&&stageOf(t.loc)==='karyer') fl.push([t.loc,t.d,t.kg,1]);
  for(const r of c.reys){ if(r.d<s) continue;
    if(r.kr) continue;      /* krisha reysi qum emas: hech bir qum omboriga kirim-chiqim bo'lmaydi */
    if(r.from!=='TASHQI'&&r.from!=='?') fl.push([r.from,r.d,-r.kgJ,0]);
    if(r.to!=='?') fl.push([r.to,r.d,r.kgQ,1]); }
  /* Vagon: yuklangan kuni stansiya → vagon ombori; tushirilgan kuni vagon ombori → Chust. Orada qum faqat vagon omborida turadi. */
  for(const v of c.vag){
    if(v.ext){ if(v.dt&&v.dt>=s) fl.push(['C01',v.dt,v.kg,1]); continue; }
    if(v.ent&&!v.pre){ fl.push([v.src,v.dy,-v.kg,0]); fl.push([v.tw,v.dy,v.kg,1]); }
    if(v.exd){ fl.push([v.tw,v.dt,-v.kg,0]); fl.push(['C01',v.dt,v.kg,1]); }
  }
  c.fl=fl; c.fx=null;
  c.adj=[];
  c.invAll=rows.inv;
  const inv=rows.inv.slice().sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:(a.at||0)-(b.at||0));
  for(const i of inv){ if(i.d<s||E.n(i.kg)==null||isT(i.wh)) continue;
    const book=E.bal(c,i.wh,i.d); const a=E.n(i.kg)-book;
    c.adj.push({id:i.id,wh:i.wh,d:i.d,kg:a,book,phys:E.n(i.kg)}); }
  c.led=E.ledger(c,end&&end>D?end:D);
  return c;
};
/* KRISHA OCHISH. Krisha — qumga yetish uchun ustidan olib tashlangan tuproq. Uning xarajati shu oyning xarajati emas: u keyin qaziladigan
   qumga yo'l ochadi. Shuning uchun alohida «krisha hovuzi»da yig'iladi va har qazilgan kilogramm qum bilan tan narxga o'tadi.
   Hovuzga nima tushadi: (1) krisha ochgan texnikaning dizeli va amortizatsiyasi; (2) krisha tashigan reyslar; (3) karyerning umumiy xarajatidan
   (ish haqi, ovqat, texnikasiz dizel va h.k.) krisha ulushi. Ulush — oy ichidagi hajm bo'yicha: krisha kg ÷ (krisha kg + qazilgan qum kg);
   texnika normasi ikkala ishda bir xil bo'lgani uchun bir tonna krisha bir tonna qumga teng ish deb olinadi.
   Bu yerda faqat oylik hajm va ulush hisoblanadi; hovuz harakati — qiymat zanjirida (E.ledger). */
E.krPre=function(c,tex,lim){ const s=c.start, o={}, cfg=c.cfg;
  for(const L of KQ) o[L]={sand:{},kr:{},ks:{},n:{}};
  const add=(g,d,kg)=>{ const m=d.slice(0,8)+'01'; g[m]=(g[m]||0)+kg; };
  for(const t of tex) if(t.op==='Q'&&t.d&&o[t.loc]&&!E.isTruck(cfg,t.mc)&&t.d>=s&&t.d<=lim) add(o[t.loc].sand,t.d,E.n(t.kg)||0);
  for(const k of c.kar) if(k.d>=s&&k.d<=lim) add(o.K01.sand,k.d,E.n(k.kg)||0);
  for(const r of c.reys) if(r.kr&&o[r.from]&&r.d>=s&&r.d<=lim){ add(o[r.from].kr,r.d,r.kgQ); add(o[r.from].n,r.d,r.rn); }
  for(const L of KQ) for(const m in o[L].kr){ const k=o[L].kr[m], q=o[L].sand[m]||0; o[L].ks[m]=k>0?k/(k+q):0; }
  return o; };
/* Vagon omborining boshlang'ich qoldig'i qo'lda kiritilmaydi — boshlanish kunida vagonda bo'lgan vagonlar ro'yxatidan olinadi */
E.open=(c,wh)=>isT(wh)?(c.openT[wh]||0):(c.cfg.wh[wh]?E.n(c.cfg.wh[wh].open)||0:0);
/* Oqimlar indeksi: har ombor bo'yicha sana tartibida yig'ma summalar — istalgan davr yig'indisi ikkilik qidiruv bilan */
E.fxBuild=function(c){ const g={}; for(const f of c.fl){ const w=f[0]; let o=g[w]; if(!o) o=g[w]={m:{}}; let e=o.m[f[1]]; if(!e) e=o.m[f[1]]=[0,0]; e[f[3]?0:1]+=f[2]; }
  for(const w in g){ const o=g[w], ds=Object.keys(o.m).sort(); o.d=ds; o.ci=new Float64Array(ds.length+1); o.co=new Float64Array(ds.length+1); ds.forEach((d,i)=>{ o.ci[i+1]=o.ci[i]+o.m[d][0]; o.co[i+1]=o.co[i]+o.m[d][1]; }); }
  c.fx=g; };
E.ub=function(arr,x){ let lo=0, hi=arr.length; while(lo<hi){ const m=(lo+hi)>>1; if(arr[m]<=x) lo=m+1; else hi=m; } return lo; };   /* x dan katta bo'lmagan elementlar soni */
E.flow=function(c,wh,a,b,sign){ if(!c.fx) E.fxBuild(c); const o=c.fx[wh]; if(!o||a>b) return 0; const i=E.ub(o.d,E.add(a,-1)), j=E.ub(o.d,b);
  const inn=o.ci[j]-o.ci[i], out=o.co[j]-o.co[i]; return sign===1?inn:sign===0?out:inn+out; };
E.flowDay=function(c,wh,d){ if(!c.fx) E.fxBuild(c); const o=c.fx[wh], e=o&&o.m[d]; return e||[0,0]; };
E.adjSum=function(c,wh,a,b){ let s=0; for(const x of c.adj){ if(x.wh===wh&&x.d>=a&&x.d<=b) s+=x.kg; } return s; };
E.bal=function(c,wh,d){ if(d<c.start) return E.open(c,wh); return E.open(c,wh)+E.flow(c,wh,c.start,d)+E.adjSum(c,wh,c.start,d); };
E.matQty=function(c,it,L,a,b){ let s=0; for(const m of E.rng(c,'mat',a,b)){ if(m.op==='S'&&m.it===it&&m.st===L&&E.inr(m.d,a,b)) s+=E.n(m.q)||0; } return s; };
E.matVal=function(c,it,L,a,b){ let s=0; for(const m of E.rng(c,'mat',a,b)){ if(m.op==='S'&&m.it===it&&m.st===L&&E.inr(m.d,a,b)) s+=(E.n(m.q)||0)*E.pr(c.P,it,m.d,SITE_OF[L]); } return s; };
E.matKr=function(c,it,L,a,b){ let s=0; if(stageOf(L)!=='karyer') return 0; for(const m of E.rng(c,'mat',a,b)){ if(m.op==='S'&&m.it===it&&m.st===L&&E.inr(m.d,a,b)) s+=(E.n(m.q)||0)*E.pr(c.P,it,m.d,SITE_OF[L])*c.ks(L,m.d); } return s; };

/* ---------------------------------------------------------------------
   QIYMAT ZANJIRI. Har omborda kg va so'm (komponentlar bo'yicha) yuritiladi, o'rtacha tortilgan usulda.
   Qum bir ombordan ikkinchisiga o'tganda o'z qiymatini olib o'tadi va yo'ldagi xarajat ustiga qo'shiladi.
   Tekshiruv: kiritilgan jami qiymat = qoldiqlar + zavodga yetkazilgan + kamomad.
   --------------------------------------------------------------------- */
E.ledger=function(c,end){
  const cfg=c.cfg, N=cfg.norms, s=c.start, n=COMP.length, z=()=>new Array(n+1).fill(0);   /* n-indeks — bo'sh turish belgisi: qiymat emas, qum bilan birga ko'chadigan «shundan» */
  const led={snap:{},snap0:null,del:[],loss:[],wload:{},cap:z(),gu:0,neg:[],openEst:false,openEstT:false,end,pre:[]};
  const st={}, wv={}; led.reg0=[];
  /* krisha hovuzi: kg — ochilgan krisha, v[kr] — yig'ilgan xarajat; ext — tizim boshidan qazilgan qum (qolgan zaxirani bilish uchun) */
  const kp={}, ext={}; KQ.forEach(L=>{ kp[L]={q:0,v:z()}; ext[L]=0; }); led.krRel={}; led.krOut={}; led.krNo={}; KQ.forEach(L=>{ led.krRel[L]={}; led.krOut[L]=0; led.krNo[L]=0; });
  for(const w of WH){ const q=isT(w)?0:E.open(c,w), v=z(); if(q>0){ const ov=E.n(cfg.wh[w].openVal); if(ov!=null) v[CI.op]=ov; else { v[CI.op]=q*(c.NS.wh[w]||0); led.openEst=true; } }
    st[w]={q,v}; led.cap[CI.op]+=v[CI.op]; if(v[CI.op]) led.reg0.push([s,CI.op,v[CI.op],'open',w,w,E.n(cfg.wh[w].openVal)==null?1:0]); }
  /* Vagon omborlari umumiy «qozon» emas: har vagon o'z kg va qiymati bilan yuritiladi (wv). Boshlang'ich qoldiq — boshlanish kunida vagonda
     bo'lgan vagonlar; qiymati — kiritilgan balans summasi (kg ga mutanosib) yoki, kiritilmagan bo'lsa, tarmoq normativi (baho deb belgilanadi). */
  for(const T of TW){ const ws=c.vag.filter(v=>v.pre&&v.tw===T), q=ws.reduce((x,v)=>x+v.kg,0); if(!(q>0)) continue;
    const ov=E.n(cfg.wh[T].openVal), tv=ov!=null?ov:q*(c.NS.wh[T]||0); if(ov==null){ led.openEst=true; led.openEstT=true; }
    for(const w of ws){ const v=z(); v[CI.op]=tv*w.kg/q; wv[w.id]={q:w.kg,v,tw:T}; led.wload[w.id]={kg:w.kg,v:v.slice(),src:w.src,tw:T,d:null,pre:true,est:ov==null}; }
    led.cap[CI.op]+=tv; if(tv) led.reg0.push([s,CI.op,tv,'open',T,T,ov==null?1:0]); }
  const by=(arr,f)=>{ const m={}; for(const x of arr){ const d=f(x); if(!d||d<s||d>end) continue; (m[d]||(m[d]=[])).push(x); } return m; };
  const texD=by(c.tex.filter(t=>!t.truck),t=>t.d), matD=by(c.mat.filter(m=>m.op==='S'),m=>m.d), xarD=by(c.xar,x=>x.d), reysD=by(c.reys,r=>r.d),
    vLoad=by(c.vag.filter(v=>!v.ext),v=>v.dy), vUnl=by(c.vag,v=>v.dt), karD=by(c.kar,k=>k.d), adjD=by(c.adj,x=>x.d);
  const fixed=cfg.items.filter(i=>i.type==='D'&&i.stage!=='trans'), vari={}; cfg.items.forEach(i=>{ if(i.type!=='D'&&i.stage!=='trans') vari[i.code]=i; });
  const KC={karyer:{dz:CI.kdz,am:CI.kam,fx:CI.kfx,ot:CI.kot},stansiya:{dz:CI.st,am:CI.st,fx:CI.st,ot:CI.st},chust:{dz:CI.ch,am:CI.ch,fx:CI.ch,ot:CI.ch}};
  const HC={avtoSt:[CI.h1x,CI.h1o],avtoZav:[CI.h2x,CI.h2o],togri:[CI.h3x,CI.h3o]};
  const tot=v=>{ let x=0; for(let i=0;i<n;i++) x+=v[i]; return x; };
  const take=(w,kg,d)=>{ const o=st[w], v=z(); if(!(kg>0)) return v; const f=o.q>0?Math.min(1,kg/o.q):1;
    for(let i=0;i<=n;i++){ v[i]=o.v[i]*f; o.v[i]-=v[i]; } o.q-=kg; if(o.q<-0.5) led.neg.push([d,w,o.q]); return v; };
  const put=(w,kg,v)=>{ const o=st[w]; o.q+=kg; for(let i=0;i<=n;i++) o.v[i]+=v[i]; };
  const addv=(a,b,f)=>{ for(let i=0;i<=n;i++) a[i]+=b[i]*f; };
  led.idleCap={}; LINKS.forEach(L=>led.idleCap[L]=0);
  let curD=s; led.reg=[]; led.dcap={};
  /* cap: qiymatga kiritilgan har so'm manbasi bilan reyestrga yoziladi — [sana, komponent, summa, jurnal, yozuv id, bo'g'in, baho(0 fakt,1 norma/reja,2 taqsimot)] */
  const cap=(v,i,x,j,id,L,e)=>{ if(!x) return; v[i]+=x; led.cap[i]+=x; led.reg.push([curD,i,x,j||'?',id||null,L||null,e||0]); led.dcap[curD]=(led.dcap[curD]||0)+x; };
  const cm=E.ms(c.D);
  const copy=()=>{ const o={}; for(const w of WH) o[w]={q:st[w].q,v:st[w].v.slice()}; for(const id in wv){ const x=wv[id], t=o[x.tw]; t.q+=x.q; addv(t.v,x.v,1); } o.KP={}; for(const L of KQ) o.KP[L]={q:kp[L].q,v:kp[L].v[CI.kr]}; return o; };
  /* karyerning umumiy xarajati: krisha ulushi hovuzga, qolgani qumga */
  const capS=(L,d,tgt,i,x,j,id,e)=>{ if(!x) return; const k=kp[L]?c.ks(L,d):0; if(k>0){ cap(kp[L].v,CI.kr,x*k,j,id,L,e); cap(tgt,i,x*(1-k),j,id,L,e); } else cap(tgt,i,x,j,id,L,e); };
  led.snap0=copy();
  for(let d=s; d<=end; d=E.add(d,1)){ curD=d;
    /* 1. kunlik xarajatlar bo'g'inlar bo'yicha: stock — ombor qiymatiga; out — shu kuni jo'natilgan qumga */
    const dc={}; LINKS.forEach(L=>dc[L]={stock:z(),out:z()});
    for(const t of texD[d]||[]){ const L=t.loc, sg=stageOf(L); if(!dc[L]) continue;
      if(t.aud){ if(sg==='karyer') capS(L,d,dc[L].stock,KC[sg].dz,t.dz,'tex',t.id,2); else cap(dc[L].stock,KC[sg].dz,t.dz,'tex',t.id,L,2); continue; }      /* bak o'lchovi: faqat boshlang'ich o'lchovda manfiy summa — bakda qolgan, avval xarajatga chiqqan dizel qaytariladi */
      if(sg==='karyer'&&t.op==='K'){ cap(kp[L].v,CI.kr,t.dz,'tex',t.id,L,0); cap(kp[L].v,CI.kr,t.am,'tex',t.id,L,0); continue; }     /* krisha ochgan texnika — to'liq hovuzga */
      if(sg==='karyer'&&t.op==='U'){ const k=t.ku||0, y=t.kl||0, q=Math.max(0,1-k-y), e=(k>0||y>0)?2:0;      /* karyer ishi: krisha ulushi hovuzga, yuklash ulushi shu kuni jo'natilgan qumga, qazish ulushi omborga */
        cap(kp[L].v,CI.kr,t.dz*k,'tex',t.id,L,2); cap(kp[L].v,CI.kr,t.am*k,'tex',t.id,L,2); cap(dc[L].out,KC[sg].dz,t.dz*y,'tex',t.id,L,2); cap(dc[L].out,KC[sg].am,t.am*y,'tex',t.id,L,2);
        cap(dc[L].stock,KC[sg].dz,t.dz*q,'tex',t.id,L,e); cap(dc[L].stock,KC[sg].am,t.am*q,'tex',t.id,L,e); continue; }
      const tgt=((sg==='karyer'&&t.op==='Y')||sg==='stansiya')?dc[L].out:dc[L].stock;
      if(sg==='karyer'&&t.op==='B'){ capS(L,d,tgt,KC[sg].dz,t.dz,'tex',t.id,0); capS(L,d,tgt,KC[sg].am,t.am,'tex',t.id,0); }
      else { cap(tgt,KC[sg].dz,t.dz,'tex',t.id,L,0); cap(tgt,KC[sg].am,t.am,'tex',t.id,L,0); } }
    for(const m of matD[d]||[]){ const L=m.st, sg=stageOf(L); if(!dc[L]||!c.P[m.it]) continue; const val=(E.n(m.q)||0)*E.pr(c.P,m.it,d,SITE_OF[L]), ci=KC[sg][m.it==='DIZEL'?'dz':'ot'];
      if(sg==='karyer') capS(L,d,dc[L].stock,ci,val,'mat',m.id,0); else cap(sg==='stansiya'?dc[L].out:dc[L].stock,ci,val,'mat',m.id,L,0); }
    for(const x of xarD[d]||[]){ const it=vari[x.it]; if(!it||!dc[x.lk]||stageOf(x.lk)!==it.stage) continue;
      if(it.stage==='karyer') capS(x.lk,d,dc[x.lk].stock,KC.karyer.ot,x.sumC,'xar',x.id,0); else cap(it.stage==='stansiya'?dc[x.lk].out:dc[x.lk].stock,KC[it.stage].ot,x.sumC,'xar',x.id,x.lk,0); }
    /* doimiy xarajat ombor qiymatiga; shu kuni bo'g'inda ish bo'lmagan bo'lsa, xuddi shu summa «bo'sh turish» belgisiga ham yoziladi (n-indeks) */
    for(const it of fixed) for(const L of linksOf(it.stage)){ const x=E.fixDay(c,it,L,d), e=E.fixEst(c,it,L,d), xs=x*(1-c.ks(L,d));
      if(it.stage==='karyer') capS(L,d,dc[L].stock,KC.karyer.fx,x,'fix',it.code,e); else cap(dc[L].stock,KC[it.stage].fx,x,'fix',it.code,L,e);
      if(!c.act[L][d]){ dc[L].stock[n]+=xs; led.idleCap[L]+=xs; } }
    /* 1b. krisha reyslari: hajmi va tashish xarajati hovuzga */
    const tr=reysD[d]||[];
    for(const r of tr){ if(!r.kr||!kp[r.from]) continue; kp[r.from].q+=r.kgQ; cap(kp[r.from].v,CI.kr,r.haul,'reys',r.id,r.from,r.own?2:0); }
    /* 2. karyer: qazish — zahira qiymati va soliq bilan omborga */
    for(const L of KQ){ let q=0; for(const t of texD[d]||[]) if(t.loc===L&&t.op==='Q') q+=t.kg; if(L==='K01') for(const k of karD[d]||[]) q+=E.n(k.kg)||0;
      /* Hovuzdan qumga: koeffitsient kiritilgan bo'lsa — har tonna qum k tonna krishani o'rtacha narxida oladi;
         kiritilmagan bo'lsa — hovuz qolgan tasdiqlangan zaxiraga teng yoyiladi (qazilgan kg ÷ qolgan zaxira). Faqat shu kundan keyingi qumga: o'tgan kunlar o'zgarmaydi. */
      if(q>0&&kp[L].v[CI.kr]>0){ const w=cfg.wh[L], k=E.n(w.krK), rk=E.n(w.resKg); let f=null;
        if(k!=null&&k>0) f=kp[L].q>0?Math.min(1,k*q/kp[L].q):0;
        else if(rk>0){ const rem=rk-ext[L]; f=rem>0?Math.min(1,q/rem):1; }
        if(f==null) led.krNo[L]+=q;
        else if(f>0){ const x=kp[L].v[CI.kr]*f, xq=kp[L].q*f; kp[L].v[CI.kr]-=x; kp[L].q-=xq; dc[L].stock[CI.kr]+=x; led.krRel[L][d]={v:x,kg:xq,q}; led.krOut[L]+=x; } }
      ext[L]+=q;
      cap(dc[L].stock,CI.zx,q*E.resRate(cfg,L),'auto','zx',L,0); cap(dc[L].stock,CI.nd,q*(E.n(N.nedra)||0),'auto','nd',L,0); put(L,q,dc[L].stock); }
    put('S01',0,dc.S01.stock); put('S02',0,dc.S02.stock);
    /* 3. karyerdan va ta'minotchidan reyslar */
    const outK={K01:0,K02:0};
    for(const r of tr) if(!r.kr&&outK[r.from]!=null) outK[r.from]+=r.kgJ;
    for(const L of ['K01','K02']) if(!(outK[L]>0)) put(L,0,dc[L].out);
    for(const r of tr){ if(r.kr||r.from==='C01'||r.from==='?'||r.to==='?') continue; let v;
      if(r.from==='TASHQI'){ v=z(); cap(v,CI.buy,r.sand,'reys',r.id,r.to,0); }
      else if(outK[r.from]!=null){ v=take(r.from,r.kgJ,d); if(outK[r.from]>0) addv(v,dc[r.from].out,r.kgJ/outK[r.from]); }
      else continue;
      const hc=HC[r.stage]; if(hc) cap(v,hc[r.own?1:0],r.haul,'reys',r.id,r.to,r.own?2:0);
      if(r.to==='Z01') led.del.push({d,kg:r.kgQ,v,from:r.from,stage:r.stage}); else if(st[r.to]) put(r.to,r.kgQ,v); }
    /* 4. vagonga yuklash: stansiyaning yuklash xarajati va temir yo'l tarifi vagon bilan ketadi */
    const ld=vLoad[d]||[], outS={S01:0,S02:0};
    for(const v of ld) if(outS[v.src]!=null) outS[v.src]+=v.kg;
    for(const S of ['S01','S02']) if(!(outS[S]>0)) put(S,0,dc[S].out);
    for(const w of ld){ if(outS[w.src]==null) continue; const v=take(w.src,w.kg,d); if(outS[w.src]>0) addv(v,dc[w.src].out,w.kg/outS[w.src]); cap(v,CI.ty,w.tyH,'vagon',w.id,w.tw,E.n(w.ty)==null?1:0);
      led.wload[w.id]={kg:w.kg,v:v.slice(),src:w.src,tw:w.tw,d};
      if(wv[w.id]&&wv[w.id].debt){ delete wv[w.id]; put('C01',0,v); }      /* xato tartib: avval tushirilgan deb yozilgan — qiymat qumning ortidan Chustga boradi */
      else wv[w.id]={q:w.kg,v,tw:w.tw}; }
    /* 5. Chustda tushirish */
    for(const w of vUnl[d]||[]){ let v;
      if(w.ext){ v=z(); cap(v,CI.buy,w.sand,'vagon',w.id,'C01',0); }
      else if(!w.exd) continue;
      else if(wv[w.id]&&!wv[w.id].debt){ v=wv[w.id].v; delete wv[w.id]; }
      else { v=z(); wv[w.id]={q:-w.kg,v:z(),tw:w.tw,debt:1}; led.neg.push([d,w.tw,-w.kg]); led.pre.push(w.id); }   /* yuklanmasdan tushirilgan: vagon ombori manfiy, Auditda xato */
      cap(v,CI.ch,w.podH+w.tushH,'vagon',w.id,'C01',(E.n(w.pod)==null||E.n(w.tush)==null)?1:0); led.gu+=w.guH; put('C01',w.kg,v); }
    put('C01',0,dc.C01.stock); put('C01',0,dc.C01.out);
    /* 6. Chustdan zavodga */
    for(const r of tr){ if(r.kr||r.from!=='C01'||r.to==='?') continue; const v=take('C01',r.kgJ,d); const hc=HC[r.stage]; if(hc) cap(v,hc[r.own?1:0],r.haul,'reys',r.id,r.to,r.own?2:0);
      if(r.to==='Z01') led.del.push({d,kg:r.kgQ,v,from:'C01',stage:r.stage}); else if(st[r.to]) put(r.to,r.kgQ,v); }
    /* 7. inventarizatsiya: kamomad o'rtacha narxda zararga, ortiqcha qiymatsiz kirim */
    for(const x of adjD[d]||[]){ if(!st[x.wh]||isT(x.wh)) continue; if(x.kg<0){ const v=take(x.wh,-x.kg,d); led.loss.push({d,wh:x.wh,kg:-x.kg,v}); } else st[x.wh].q+=x.kg; }
    led.snap[d]=copy();
  }
  led.tot=tot; led.z=z;
  return led;
};
E.snapAt=function(c,d){ const l=c.led; if(d<c.start) return l.snap0; return l.snap[d>l.end?l.end:d]||l.snap0; };
E.vsum=v=>{ let x=0; for(let i=0;i<COMP.length;i++) x+=v[i]; return x; };
E.idleOf=v=>v[COMP.length]||0;
/* Davr ichida zavodga yetkazilgan qum: kg, qiymat vektori */
E.delivered=function(c,a,b,f){ const v=c.led.z(); let kg=0,n=0; for(const x of c.led.del){ if(!E.inr(x.d,a,b)||(f&&!f(x))) continue; kg+=x.kg; n++; for(let i=0;i<v.length;i++) v[i]+=x.v[i]; } return {kg,v,n,val:E.vsum(v),unit:kg>0?E.vsum(v)/kg:null,idle:E.idleOf(v)}; };
/* Saqlanish tengligi: kiritilgan = qoldiq + yetkazilgan + kamomad */
E.conserve=function(c){ const l=c.led, n=COMP.length, end=l.snap[l.end]||l.snap0, stock=l.z(), del=l.z(), loss=l.z();
  for(const w of WH) for(let i=0;i<n;i++) stock[i]+=end[w].v[i];
  let pool=0; if(end.KP) for(const L of KQ) pool+=end.KP[L].v; stock[CI.kr]+=pool;     /* krisha hovuzidagi, hali qumga o'tmagan xarajat ham qoldiq */
  for(const x of l.del) for(let i=0;i<n;i++) del[i]+=x.v[i];
  for(const x of l.loss) for(let i=0;i<n;i++) loss[i]+=x.v[i];
  const rows=COMP.map((cp,i)=>({key:cp[0],name:cp[1],inn:l.cap[i],stock:stock[i],del:del[i],loss:loss[i],diff:l.cap[i]-stock[i]-del[i]-loss[i]}));
  const t={inn:0,stock:0,del:0,loss:0,diff:0}; rows.forEach(r=>{ for(const k in t) t[k]+=r[k]; });
  const id={inn:0,stock:0,del:0,loss:0}; for(const k in l.idleCap) id.inn+=l.idleCap[k]; for(const w of WH) id.stock+=end[w].v[n]||0; for(const x of l.del) id.del+=x.v[n]||0; for(const x of l.loss) id.loss+=x.v[n]||0;
  id.diff=id.inn-id.stock-id.del-id.loss;
  return {rows,t,ok:rows.every(r=>Math.abs(r.diff)<1),idle:id,pool}; };

/* ---------------------------------------------------------------------
   DAVR TAHLILI. Har bo'g'in va har xarajat elementi: fakt, norma, og'ish, sabab.
   mode: 'fact' — faqat kiritilgan; boshqasi — doimiy xarajatlar E.itemCost qoidasi bilan.
   Karyerda qazish va yuklash ketma-ket ishlar: har biri o'z hajmiga bo'linadi, stavkalar qo'shiladi.
   --------------------------------------------------------------------- */
E.chain=function(c,a,b,mode){
  if(a<c.start) a=c.start;     /* boshlanishdan oldingi yozuvlar (jumladan boshlang'ich vagonlar) davr xarajatiga kirmaydi — ular boshlang'ich qoldiq */
  const cfg=c.cfg, N=cfg.norms, P=c.P, L={};
  const TX=E.rng(c,'tex',a,b), KR=E.rng(c,'kar',a,b), VY=E.rng(c,'vdy',a,b), VT=E.rng(c,'vdt',a,b), RS=E.rng(c,'reys',a,b);
  const mk=(id,stage,name)=>({id,stage,name,vol:0,cost:0,n:0,els:[],norm:null,idle:0,idleDays:[],days:0,idleRate:null});
  /* nc — bo'g'in jamiga kirmaydi (jarima); tr — boshqa joyda sanalgan xarajatning ko'chishi: 1 kg narxiga kiradi, davr xarajatiga qayta qo'shilmaydi */
  const add=(lk,key,name,fact,norm,info)=>{ if(!(Math.abs(fact)>1e-9)&&!(norm>0)) return; const e=Object.assign({key,name,fact,norm:norm===undefined?null:norm},info||{}); lk.els.push(e); if(!e.nc&&!e.tr) lk.cost+=fact; };
  const KRL={}, addG=(g,t,f)=>{ g.dz+=t.dz*f; g.am+=t.am*f; g.l+=t.cons*f; g.mh+=t.mh*f; if(t.has){ g.rateEff+=(t.cons-t.nL*t.mh)*t.price*f; if(t.op!=='B') g.prodEff+=(t.mh-t.t/t.nT)*t.nL*t.price*f; } else g.noNorm++; };
  for(const id of LINKS){ const st=stageOf(id), lk=mk(id,st,cfg.wh[id].name), ln=c.LN[id]; L[id]=lk; lk.norm=ln.total; let volY=0;
    if(st==='karyer'){ lk.seq=true; for(const t of TX) if(t.loc===id){ if(t.op==='Q') lk.vol+=t.kg; else if(t.op==='Y') volY+=t.kg; } if(id==='K01') for(const k of KR) lk.vol+=E.n(k.kg)||0; }
    if(st==='stansiya') for(const v of VY) if(!v.ext&&v.src===id){ lk.vol+=v.kg; lk.n++; }
    if(st==='chust') for(const v of VT){ lk.vol+=v.kg; lk.n++; }
    const g0=()=>({dz:0,am:0,l:0,rateEff:0,prodEff:0,noNorm:0,mh:0}), G={Q:g0(),Y:g0(),K:g0()}, KY=st==='karyer';
    for(const t of TX){ if(t.truck||t.loc!==id) continue;
      if(t.aud){ if(t.dz){ const k=KY?c.ks(id,t.d):0; G.Q.dz+=t.dz*(1-k); G.K.dz+=t.dz*k; } continue; }      /* boshlang'ich bak o'lchovi: bakda qolgan dizel xarajatdan qaytariladi */
      if(KY&&t.op==='K') addG(G.K,t,1);
      else if(KY&&t.op==='U'){ const k=t.ku||0, y=t.kl||0, q=Math.max(0,1-k-y); if(q>0) addG(G.Q,t,q); if(y>0){ addG(G.Y,t,y); volY+=t.kg*y; } if(k>0) addG(G.K,t,k); }
      else if(KY&&t.op==='B'){ const k=c.ks(id,t.d); if(k<1) addG(G.Q,t,1-k); if(k>0) addG(G.K,t,k); }
      else addG(G[(KY&&t.op==='Y')?'Y':'Q'],t,1); }
    const mdK=E.matKr(c,'DIZEL',id,a,b), md=E.matVal(c,'DIZEL',id,a,b)-mdK;
    if(st==='karyer'){ add(lk,'zx','Kon qiymati: sotib olish va geologiya',lk.vol*(ln.el.zx||0),ln.el.zx,{qty:lk.vol}); add(lk,'nd',"Yer qa'ri solig'i",lk.vol*(ln.el.nd||0),ln.el.nd,{qty:lk.vol});
      add(lk,'dz','Dizel: qazish',G.Q.dz+md,ln.el.dz,Object.assign({mcOk:ln.mcOk},G.Q)); add(lk,'am','Amortizatsiya: qazish',G.Q.am,ln.el.am,{});
      add(lk,'dzY','Dizel: yuklash',G.Y.dz,ln.el.dzY,Object.assign({evol:volY,mcOk:ln.mcOk},G.Y)); add(lk,'amY','Amortizatsiya: yuklash',G.Y.am,ln.el.amY,{evol:volY}); }
    else { add(lk,'dz','Dizel',G.Q.dz+md,ln.el.dz,Object.assign({mcOk:ln.mcOk},G.Q)); add(lk,'am','Amortizatsiya (moto-soat)',G.Q.am,ln.el.am,{}); }
    const KM=[]; for(const it in cfg.mats){ if(it==='DIZEL') continue; const vk=E.matKr(c,it,id,a,b), val=E.matVal(c,it,id,a,b)-vk; if(vk) KM.push([it,vk]); add(lk,'m:'+it,cfg.mats[it].name,val,ln.el['m:'+it]||0,{qty:E.matQty(c,it,id,a,b)}); }
    if(st==='chust'){ let pod=0,tu=0,gu=0; for(const v of VT){ pod+=v.podH; tu+=v.tushH; gu+=v.guH; }
      add(lk,'pod',"Qo'qon TexPD podacha",pod,ln.el.pod); add(lk,'tush','Vagon tushirish',tu,ln.el.tush); add(lk,'gu','GU-46 jarima (tan narxga kirmaydi)',gu,ln.gu,{nc:true}); }
    const KI=[]; for(const it of cfg.items){ if(it.stage!==st) continue; const r=E.itemCost(c,it,id,a,b,mode); if(r.kr) KI.push([it,r.kr]);
      add(lk,'i:'+it.code,it.name,r.acc-r.kr,ln.el['i:'+it.code],{fixed:it.type==='D',raw:r.raw,planM:r.planM,plan:r.plan,est:r.est,nv:it.nv||null}); }
    if(a<=b){ const idl=E.idleDays(c,id,a,b); lk.idle=idl.sum; lk.idleDays=idl.days; lk.days=idl.n; }
    if(KY){ /* krisha hovuzidan shu davrda qazilgan qumga o'tgan summa — 1 kg qum narxining bir qismi */
      let rv=0, rq=0; const rel=c.led.krRel[id]; for(const d in rel) if(d>=a&&d<=b){ rv+=rel[d].v; rq+=rel[d].kg; }
      add(lk,'kr','Krisha ochish (hovuzdan qumga yotqizildi)',rv,null,{tr:true,qty:rq});
      /* krisha ochishning o'zi: shu davrda hovuzga tushgan xarajat, o'z hajmiga (krisha kg) bo'linadi; texnika normasi qum qazishdagi bilan bir xil */
      const kl=mk('X'+id,'krisha',cfg.wh[id].name+': krisha ochish'); kl.of=id; let hn=0, hv=0;
      for(const r of RS) if(r.kr&&r.from===id){ kl.vol+=r.kgQ; kl.n+=r.rn; }
      add(kl,'dz','Dizel: krisha ochish',G.K.dz+mdK,ln.el.dz,Object.assign({mcOk:ln.mcOk},G.K)); add(kl,'am','Amortizatsiya: krisha ochish',G.K.am,ln.el.am,{});
      for(const r of cfg.routes){ if(r.to!==OTV||r.from!==id) continue; const X={v:0,h:0,n:0}, O={v:0,h:0,n:0,dz:0,am:0,lab:0,oth:0};
        for(const x of RS) if(x.m===r.code){ const g=x.own?O:X; g.v+=x.kgQ; g.h+=x.haul; g.n+=x.rn; if(x.own&&x.parts){ O.dz+=x.parts.dz; O.am+=x.parts.am; O.lab+=x.parts.lab; O.oth+=x.parts.oth; } }
        const kgR=(E.n(N.krReys)||25)*(E.n(N.krZich)||1.5)*1000, nr=r.tarif>0?(r.type==='reys'?r.tarif/kgR:r.tarif):null; if(nr!=null){ hn+=nr*(X.v+O.v); hv+=X.v+O.v; }
        if(X.n) add(kl,'r:'+r.code+':x','Krisha tashish: tashqi transport',X.h,nr,{evol:X.v,trips:X.n,rtype:r.type,rcode:r.code});
        if(O.n) add(kl,'r:'+r.code+':o',"Krisha tashish: o'z transporti",O.h,nr,{evol:O.v,trips:O.n,rtype:r.type,rcode:r.code,own:true,parts:{dz:O.dz,am:O.am,lab:O.lab,oth:O.oth}}); }
      for(const x of KM) add(kl,'m:'+x[0],cfg.mats[x[0]].name+' (krisha ulushi)',x[1],null,{share:true});
      for(const x of KI) add(kl,'i:'+x[0].code,x[0].name+' (krisha ulushi)',x[1],null,{share:true,fixed:x[0].type==='D'});
      kl.norm=(ln.el.dz!=null||ln.el.am)?(ln.el.dz||0)+(ln.el.am||0)+(hv>0?hn/hv:0):null; KRL[id]=kl; }
  }
  const rl=(id,stage,name)=>{ const lk=mk(id,stage,name); let nv=0;
    for(const r of cfg.routes){ if(r.stage!==stage) continue; const X={v:0,h:0,n:0}, O={v:0,h:0,n:0,dz:0,am:0,lab:0,oth:0};
      for(const x of RS) if(x.m===r.code){ const g=x.own?O:X; g.v+=x.kgQ; g.h+=x.haul; g.n+=x.rn; if(x.own&&x.parts){ O.dz+=x.parts.dz; O.am+=x.parts.am; O.lab+=x.parts.lab; O.oth+=x.parts.oth; } }
      if(!X.n&&!O.n) continue; const nr=E.rtNorm(cfg,r), nm=E.rtName(cfg,r); lk.vol+=X.v+O.v; lk.n+=X.n+O.n; nv+=nr*(X.v+O.v);
      if(X.n) add(lk,'r:'+r.code+':x','Tashqi logistika: '+nm,X.h,nr,{evol:X.v,trips:X.n,rtype:r.type,rcode:r.code});
      if(O.n) add(lk,'r:'+r.code+':o',"O'z transporti: "+nm,O.h,nr,{evol:O.v,trips:O.n,rtype:r.type,rcode:r.code,own:true,parts:{dz:O.dz,am:O.am,lab:O.lab,oth:O.oth}}); }
    lk.norm=lk.vol>0?nv/lk.vol:E.rtNorm(cfg,cfg.routes.find(r=>r.stage===stage)); return lk; };
  L.avtoSt=rl('avtoSt','avtoSt','Avto: karyer → stansiya');
  L.avtoZav=rl('avtoZav','avtoZav','Avto: Chust → zavod');
  L.togri=rl('togri','togri',"Avto to'g'ridan zavodga");
  const tm=mk('temir','temir',"Temir yo'l"); let tnv=0;
  for(const S of ['S01','S02']){ let v0=0,t0=0,n0=0; for(const v of VY) if(!v.ext&&v.src===S){ v0+=v.kg; t0+=v.tyH; n0++; }
    if(!n0) continue; const nr=E.tyNorm(cfg,S)/N.vagYuk; tm.vol+=v0; tm.n+=n0; tnv+=nr*v0; add(tm,'ty:'+S,"Temir yo'l tarifi: "+cfg.wh[S].name+' → Chust',t0,nr,{evol:v0,trips:n0}); }
  tm.norm=tm.vol>0?tnv/tm.vol:E.tyNorm(cfg,'S01')/N.vagYuk; L.temir=tm;
  const order=['K01','K02','avtoSt','S01','S02','temir','C01','avtoZav'];
  const out=order.map(id=>L[id]).filter(lk=>!(lk.id==='K02'||lk.id==='S02')||lk.vol>0||lk.cost>0||(E.n(cfg.wh[lk.id].plan)||0)>0||cfg.machines.some(m=>m.loc===lk.id));
  for(const lk of out.concat([L.togri],Object.values(KRL))){ let rs=0;
    for(const e of lk.els){ const ev=e.evol!=null?e.evol:lk.vol; e.ev=ev; e.rate=ev>0?e.fact/ev:null;
      e.dv=(e.rate==null||e.norm==null)?null:e.rate-e.norm; e.dsum=e.dv==null?null:e.dv*ev; e.cause=E.cause(c,lk,e); if(!e.nc&&e.rate!=null) rs+=e.rate; }
    lk.idleRate=(stageOf(lk.id)&&lk.vol>0)?lk.idle/lk.vol:null;
    lk.rate=lk.vol>0?(lk.seq?rs:lk.cost/lk.vol):null; lk.dv=lk.rate==null||lk.norm==null?null:lk.rate-lk.norm; lk.dsum=lk.dv==null?null:lk.dv*lk.vol; }
  out.togri=L.togri; out.kr=KRL; return out;
};
E.cause=function(c,lk,e){
  const N=c.cfg.norms, pr=c.P.DIZEL.price||1;
  if(e.tr) return e.fact>0?"Avval ochilgan krisha xarajatidan shu davrda qazilgan qumga tushgan qism":'';
  if(e.share) return "Karyerning umumiy xarajatidan krisha ulushi (oy hajmi bo'yicha)";
  if(e.rate==null) return "Bu davrda hajm yo'q — xarajat tonnaga bo'linmadi";
  if(e.norm==null) return (lk.stage==='krisha'&&e.key.slice(0,2)==='r:')?'Krisha marshrutiga tarif kiritilmagan (Normativlar → Marshrutlar)':'Norma yoki oylik reja hajmi kiritilmagan';
  if(e.dv<=Math.max(1e-9,(e.norm||0)*0.005)) return '';
  const k=e.key;
  if(k==='gu') return "Vagonlar o'z vaqtida tushirilmagan";
  if(k==='dz'||k==='dzY'){ if(lk.stage==='stansiya') return 'Vagoniga dizel normadan yuqori';
    if(!e.mcOk) return 'Texnika normasi kiritilmagan — umumiy norma bilan solishtirildi';
    if(e.rateEff<=0&&e.prodEff<=0) return 'Texnikadan tashqari dizel sarfi';
    return e.rateEff>=e.prodEff?`Moto-soatiga dizel normadan yuqori (+${fmt(e.rateEff/pr,0)} l)`:`Unumdorlik past: shu hajmga ortiqcha moto-soat ishlangan (+${fmt(e.prodEff/pr,0)} l)`; }
  if(k==='am'||k==='amY') return "Unumdorlik past: tonnaga ko'p moto-soat";
  if(k.slice(0,2)==='m:') return lk.stage==='stansiya'?'Vagoniga sarf normadan yuqori':"Bu bo'g'inda norma yo'q";
  if(k==='pod'||k==='tush') return 'Fakt tarif normadan yuqori';
  if(k.slice(0,3)==='ty:'){ const avg=e.trips?e.ev/e.trips:0; return avg<N.vagYuk?`Vagon yuki normadan kam (o'rtacha ${fmt(avg)} kg)`:'Tarif normadan yuqori'; }
  if(k.slice(0,2)==='r:'){ const avg=e.trips?e.ev/e.trips:0;
    if(e.own){ const p=e.parts, mx=Math.max(p.dz,p.am,p.lab,p.oth), nm=mx===p.dz?'dizel':mx===p.am?'amortizatsiya':mx===p.lab?'ish haqi':'boshqa xarajat'; return `O'z reys tannarxi tashqi tarifdan yuqori; eng katta qismi — ${nm}`; }
    if(lk.stage==='krisha') return 'Krisha tashish tarifi marshrut tarifidan yuqori';
    return (e.rtype==='reys'&&avg<N.reysYuk)?`Reys yuki normadan kam (o'rtacha ${fmt(avg)} kg)`:'Tarif normadan yuqori'; }
  if(k.slice(0,2)==='i:'){ if(e.nv) return 'Vagoniga xizmat haqi normadan yuqori'; if(e.fixed&&!(e.plan>0)) return "Bu bo'g'in uchun oylik reja kiritilmagan";
    if(e.fixed){ const sp=e.fact-(e.planM||0); return sp>1?`Xarajat rejadan ${fmt(sp/1e6,2)} mln so'm yuqori`:"Hajm rejadan past — doimiy xarajat kam tonnaga bo'lindi"; }
    return e.plan>0?'Xarajat rejadan yuqori':"Rejada yo'q xarajat"; }
  return '';
};
E.agg=function(c,a,b,mode){
  if(a<c.start) a=c.start;
  const ch=E.chain(c,a,b,mode), o={chain:ch};
  const sum=f=>{ const g={vol:0,cost:0,n:0,idle:0}; let rv=0,rw=0,iv=0; ch.filter(f).forEach(l=>{ g.vol+=l.vol; g.cost+=l.cost; g.n+=l.n; g.idle+=l.idle||0; if(l.rate!=null){ rv+=l.rate*l.vol; rw+=l.vol; iv+=l.idle||0; } }); g.rate=rw>0?rv/rw:null; g.idleRate=rw>0?iv/rw:null; return g; };
  o.karyer=sum(l=>l.stage==='karyer'); o.avtoSt=sum(l=>l.id==='avtoSt'); o.stansiya=sum(l=>l.stage==='stansiya');
  o.temir=sum(l=>l.id==='temir'); o.chust=sum(l=>l.stage==='chust'); o.avtoZav=sum(l=>l.id==='avtoZav');
  o.togri={vol:ch.togri.vol,cost:ch.togri.cost,n:ch.togri.n,rate:ch.togri.rate};
  o.krisha={vol:0,cost:0,n:0}; for(const k in ch.kr){ o.krisha.vol+=ch.kr[k].vol; o.krisha.cost+=ch.kr[k].cost; o.krisha.n+=ch.kr[k].n; }
  o.buy={vol:0,cost:0}; o.gu={sum:0,n:0};
  for(const r of E.rng(c,'reys',a,b)) if(r.sand){ o.buy.vol+=r.kgQ; o.buy.cost+=r.sand; }
  for(const v of E.rng(c,'vdt',a,b)){ o.gu.sum+=v.guH; o.gu.n++; if(v.sand){ o.buy.vol+=v.kg; o.buy.cost+=v.sand; } }
  let tot=0, full=true; STAGES.forEach(([k])=>{ if(o[k].rate==null) full=false; else tot+=o[k].rate; });
  o.landed=tot; o.full=full; o.landedIdle=STAGES.reduce((x,k)=>x+(o[k[0]].idleRate||0),0); o.idle=STAGES.reduce((x,k)=>x+(o[k[0]].idle||0),0);
  return o;
};
E.reserve=function(c,L,d){ const w=c.cfg.wh[L], has=E.n(w.resKg)>0, rate=E.resRate(c.cfg,L), ext=d<c.start?0:E.flow(c,L,c.start,d,1);
  return {has,rate,initKg:E.n(w.resKg)||0,initVal:E.n(w.resVal)||0,ext,remKg:(E.n(w.resKg)||0)-ext,remVal:(E.n(w.resVal)||0)-ext*rate}; };
/* Krisha hovuzi davr hisoboti: boshida + ochildi − qumga o'tdi = qoldi (kg va so'm), manbalar bo'yicha */
E.krRep=function(c,L,a,b){ const led=c.led, s=c.start; if(a<s) a=s; const a0=E.add(a,-1), o0=E.snapAt(c,a0).KP[L], o1=E.snapAt(c,b).KP[L];
  const src={tex:0,reys:0,mat:0,xar:0,fix:0}; let inn=0, inq=0, n=0, rv=0, rq=0, sq=0;
  for(const g of led.reg) if(g[1]===CI.kr&&g[5]===L&&g[0]>=a&&g[0]<=b){ inn+=g[2]; src[g[3]]=(src[g[3]]||0)+g[2]; }
  for(const r of E.rng(c,'reys',a,b)) if(r.kr&&r.from===L){ inq+=r.kgQ; n+=r.rn; }
  const rel=led.krRel[L]; for(const d in rel) if(d>=a&&d<=b){ rv+=rel[d].v; rq+=rel[d].kg; sq+=rel[d].q; }
  const w=c.cfg.wh[L], k=E.n(w.krK), rs=E.reserve(c,L,b), mode=(k!=null&&k>0)?'k':(rs.has?'res':'none');
  const next=o1.v>0?(mode==='k'?(o1.q>0?o1.v/o1.q*k:null):(mode==='res'?(rs.remKg>0?o1.v/rs.remKg:null):null)):0;      /* keyingi qazilgan 1 kg qumga tushadigan krisha */
  return {open:o0,close:o1,inn,inq,n,src,rv,rq,sq,mode,k,next,any:o0.v>0||o1.v>0||inn>0||rv>0||inq>0}; };
E.topCauses=function(ch,n){ const a=[]; ch.forEach(lk=>lk.els.forEach(e=>{ if(e.dsum>0&&e.cause) a.push({lk,e}); })); a.sort((x,y)=>y.e.dsum-x.e.dsum); return a.slice(0,n); };
E.kpi=function(c,a,b){
  if(a<c.start) a=c.start;
  const N=c.cfg.norms, A=E.agg(c,a,b,'fact'), k=[];
  const ks=c.reys.filter(r=>r.stage==='avtoSt'&&E.inr(r.d,a,b)), ksn=ks.reduce((q,r)=>q+r.rn,0);
  const both=ks.filter(r=>r.wj!=null&&r.wq!=null);
  const lj=both.reduce((s,r)=>s+r.kgJ,0), ll=both.reduce((s,r)=>s+r.loss,0);
  const vl=c.vag.filter(v=>!v.ext&&E.inr(v.dy,a,b)), vt=c.vag.filter(v=>E.inr(v.dt,a,b)), vk=c.vag.filter(v=>!v.ext&&v.tr!=null&&v.tr>=0&&E.inr(v.dkE,a,b));
  const sq=(it)=>['S01','S02'].reduce((s,l)=>s+E.matQty(c,it,l,a,b),0);
  const sdz=sq('DIZEL')+c.tex.filter(t=>stageOf(t.loc)==='stansiya'&&E.inr(t.d,a,b)).reduce((s,t)=>s+t.cons,0);
  k.push(["Reys o'rtacha yuki (karyer → stansiya)",'kg',ksn?A.avtoSt.vol/ksn:null,N.reysYuk,'high',0]);
  k.push(["Yo'qotish karyer → stansiya",'%',lj?ll/lj*100:null,N.yoqKS*100,'low',2]);
  k.push(["Vagon o'rtacha yuki",'kg',vl.length?A.stansiya.vol/vl.length:null,N.vagYuk,'high',0]);
  k.push(['Stansiya: sim','dona/vagon',vl.length?sq('SIM')/vl.length:null,N.sim,'low',1]);
  k.push(['Stansiya: plyonka','m/vagon',vl.length?sq('PLYONKA')/vl.length:null,N.plyonka,'low',1]);
  k.push(['Stansiya: dizel','l/vagon',vl.length?sdz/vl.length:null,N.stDizel,'low',1]);
  k.push(['GU-46 jarima',"so'm/vagon",vt.length?A.gu.sum/vt.length:null,N.gu46,'low',0]);
  k.push(["Vagon yo'lda: o'rtacha muddat (kelganlar)",'kun',vk.length?vk.reduce((s,v)=>s+v.tr,0)/vk.length:null,E.n(N.tranzKun)||6,'low',1]);
  const vq=vt.filter(v=>v.kut!=null);
  k.push(['Chustda tushirishni kutish','kun',vq.length?vq.reduce((s,v)=>s+v.kut,0)/vq.length:null,N.chustKun,'low',1]);
  return k;
};
E.status=function(fact,norm,dir,tol){
  if(fact==null||norm==null) return ['na','—'];
  if(dir==='high'){ if(fact>=norm*0.995) return ['ok','✓ Normada']; return fact>=norm*(1-tol)?['warn','▼ Chegarada']:['bad','▼ Past']; }
  if(fact<=norm*1.005+1e-9) return ['ok','✓ Normada'];
  if(norm>0&&fact<=norm*(1+tol)) return ['warn','▲ Chegarada'];
  return ['bad','▲ Oshgan'];
};
E.alerts=function(c){
  const D=c.D, a=E.ms(D), out=[], N=c.cfg.norms;
  const cnt=(arr,f)=>arr.filter(f).length;
  const rm=c.reys.filter(r=>E.inr(r.d,a,D));
  let n;
  const cs=E.conserve(c); if(!cs.ok) out.push(['bad',`Qiymat zanjirida ${fmt(cs.t.diff)} so'm farq bor — Audit bo'limini oching.`]);
  for(const wh of WH){ const b=E.bal(c,wh,D); if(b<-0.5) out.push(['bad',`${c.cfg.wh[wh].name}: hisobdagi qoldiq manfiy (${fmt(b/1000,1)} t). Boshlang'ich qoldiq yoki kirim kiritilmagan.`]); }
  if(c.own.unalloc>0.5) out.push(['bad',`O'z transporti xarajati ${fmt(c.own.unalloc)} so'm reyslarga taqsimlanmadi — o'z mashinasida reys kiritilmagan.`]);
  if((n=cnt(c.cfg.machines,m=>m.type!=='T'&&(E.n(m.normL)==null||!E.n(m.normT))))) out.push(['warn',`${n} ta texnika uchun moto-soat normasi kiritilmagan — Normativlar bo'limida to'ldiring.`]);
  const tt=c.tex.filter(t=>t.d===D);
  { const bk=E.n(N.bakKun)||7, neg=[], noB=[], late=[]; for(const m of c.cfg.machines){ const st=E.tankAt(c,m.code,D), wk=c.tex.some(t=>t.mc===m.code&&!t.aud&&E.inr(t.d,a,D)&&(t.mh>0||t.km>0||t.l>0));
      if(st.on){ if(st.q<-0.5) neg.push(`${m.name} (${fmt(st.q,0)} l)`); else if(st.last&&wk&&E.dn(D)-E.dn(st.last.d)>bk) late.push(`${m.name} (${E.dn(D)-E.dn(st.last.d)} kun)`); } else if(E.n(m.normL)!=null&&wk) noB.push(m.name); }
    if(neg.length) out.push(['bad',`Bak hisobda manfiy: ${neg.join(', ')} — quyilgan dizel kiritilmagan yoki sarf normadan ancha ko'p. Bakni o'lchab kiriting.`]);
    if(noB.length) out.push(['warn',`${noB.join(', ')}: norma bor, bak o'lchanmagan — dizel hali quyilgani bo'yicha xarajatga chiqmoqda. Norma usuliga o'tish uchun bakni bir marta o'lchab kiriting (Kiritish → Bak o'lchandi).`]);
    if(late.length) out.push(['warn',`Bak ${bk} kundan ortiq o'lchanmagan: ${late.join(', ')} — hisobdagi qoldiq haqiqiysidan uzoqlashgan bo'lishi mumkin.`]);
    const fv=E.fuelVar(c,a,D); if(fv.aud.n&&Math.abs(fv.aud.v)>0.5) out.push([fv.aud.v>0?'bad':'warn',`Dizel og'ishi oy boshidan: ${fs(fv.aud.l,0)} l, ${fs(fv.aud.v,0)} so'm (${fv.aud.n} ta bak o'lchovi). Tan narxga kirmaydi — alohida ko'rinadi.`]); }
  if((n=cnt(tt,t=>t.flags.some(f=>f[1]==='Dizel oshgan')))) out.push(['bad',`Bugun ${n} ta texnikada dizel sarfi normadan yuqori.`]);
  if((n=cnt(tt,t=>t.flags.some(f=>f[1]==='Unum past')))) out.push(['bad',`Bugun ${n} ta texnikada unumdorlik normadan past.`]);
  if((n=cnt(c.tex.filter(t=>E.inr(t.d,a,D)),t=>t.flags.some(f=>f[1]==='Hisoblagich mos emas')))) out.push(['bad',`${n} ta yozuvda ish hajmi hisoblagich ko'rsatkichiga mos emas (oy boshidan).`]);
  if((n=cnt(rm,r=>r.flags.some(f=>f[1]==='Takror')))) out.push(['bad',`${n} ta reys yozuvi takror ko'rinadi (bir kun, bir mashina, bir xil vazn).`]);
  if((n=cnt(rm,r=>r.wq==null&&r.wj==null))) out.push(['bad',`${n} ta reysda tarozi vazni kiritilmagan.`]);
  if((n=cnt(rm,r=>r.wq==null&&r.wj!=null&&r.d<D))) out.push(['warn',`${n} ta reysda qabul vazni kiritilmagan (jo'natilgan, qabul qilinmagan) — Megaton yoki stansiya operatori to'ldirishi kerak.`]);
  if((n=cnt(rm,r=>r.flags.some(f=>f[1]==='Kam yuk')))) out.push(['warn',`${n} ta reys ${fmt(N.reysMin)} kg dan kam yuk bilan kelgan (oy boshidan).`]);
  const vy=c.vag.filter(v=>v.st==="Yo'lda"&&v.yol>N.yoldaKun);
  if(vy.length) out.push(['warn',`${vy.length} ta vagon ${N.yoldaKun} kundan ortiq yo'lda.`]);
  const vc=c.vag.filter(v=>v.st==='Chustda vagonda'&&v.kut>N.chustKun);
  if(vc.length) out.push(['warn',`${vc.length} ta vagon Chustda ${N.chustKun} kundan ortiq tushirilmay turibdi — GU-46 xavfi.`]);
  const vall=c.vag.concat(c.vagX), hasF=(v,t)=>v.flags.some(f=>f[1]===t);
  if((n=cnt(vall,v=>hasF(v,'Sana tartibi')))) out.push(['bad',`${n} ta vagonda sanalar tartibi buzilgan (kelgan yoki tushirilgan sana yuklangan sanadan oldin).`]);
  if(c.vagX.length) out.push(['bad',`${c.vagX.length} ta vagon yozuvi hech bir omborga tushmayapti — manbasi yoki sanasi yo'q.`]);
  if((n=cnt(c.vag,v=>hasF(v,"Yuklangan sana yo'q")))) out.push(['bad',`${n} ta vagonda yuklangan sana yo'q — boshlang'ich qoldiq deb olindi, stansiyadan chiqim yozilmadi.`]);
  if((n=cnt(c.vag,v=>hasF(v,'Juda tez')&&E.inr(v.dkE,a,D)))) out.push(['warn',`${n} ta vagon ${Math.floor((E.n(N.tranzKun)||6)/2)} kundan kam vaqtda kelgan deb yozilgan (oy boshidan) — sanalarni nakladnoy bilan solishtiring.`]);
  if(D>=c.start){ const idl=E.chain(c,D,D,'day').filter(l=>stageOf(l.id)&&l.idle>0);
    if(idl.length) out.push(['warn',`Bugun ish bo'lmagan bo'g'inlar: ${idl.map(l=>`${l.name} (${fm(l.idle)} mln)`).join(', ')} — shu kunning doimiy xarajati ombordagi qum tan narxiga «bo'sh turish» bo'lib tushdi. Agar ish bo'lgan bo'lsa, Texnika yoki Reyslar yozuvi kiritilmagan.`]); }
  if(D>=c.start){ const pl=E.pipeline(c,D,7); if(pl.short) out.push(['warn',`Prognoz: Chust ombori ${fd(pl.short)} kuni tugaydi — yo'ldagi vagonlar zavodga jo'natish sur'atiga yetmayapti.`]); }
  const gu=c.vag.filter(v=>E.inr(v.dt,a,D)&&v.guH>0);
  if(gu.length) out.push(['bad',`GU-46 jarima: ${gu.length} ta vagon, ${fmt(gu.reduce((s,v)=>s+v.guH,0))} so'm (oy boshidan). Tan narxga kirmaydi, davr zarari.`]);
  const pend=c.vag.reduce((s,v)=>s+v.pend,0);
  if(pend) out.push(['warn',`${pend} ta vagon xarajati hali norma bo'yicha hisoblangan — fakt hujjati kutilmoqda.`]);
  const nq=c.xar.filter(x=>E.inr(x.d,a,D)&&x.pay==='Naqd'&&!x.doc);
  if(nq.length) out.push(['warn',`Hujjatsiz naqd xarajat: ${nq.length} ta yozuv, ${fmt(nq.reduce((s,x)=>s+(E.n(x.sum)||0),0))} so'm (oy boshidan).`]);
  for(const k in c.P){ if(c.P[k].stock<-1e-6) out.push(['bad',`${c.cfg.mats[k].name}: ombor qoldig'i manfiy (${fmt(c.P[k].stock,0)} ${c.cfg.mats[k].unit}). Kirim kiritilmagan.`]);
    for(const st in c.P[k].st) if(c.P[k].st[st].stock<-1e-6) out.push(['bad',`${c.cfg.mats[k].name}, ${SITE_NAME[st]} ombori: qoldiq manfiy (${fmt(c.P[k].st[st].stock,0)} ${c.cfg.mats[k].unit}). Kirim kiritilmagan.`]); }
  if(D>=c.start) for(const L of KQ){ const kr=E.krRep(c,L,c.start,D); if(kr.close.v>0.5&&kr.mode==='none') out.push(['warn',`${c.cfg.wh[L].name}: krisha ochish xarajati (${fm(kr.close.v)} mln) qumga o'tmayapti — tasdiqlangan zaxira ham, krisha koeffitsienti ham kiritilmagan (Normativlar → Kon).`]); }
  return out;
};
E.pivot=function(rows,keyf){ const g={}; for(const x of rows){ const k=keyf(x)||'—'; const r=g[k]||(g[k]={k,Bank:0,Naqd:0,Karta:0,tot:0,n:0}); const s=E.n(x.sum)||0; r[x.pay]=(r[x.pay]||0)+s; r.tot+=s; r.n++; } return Object.values(g).sort((a,b)=>b.tot-a.tot); };

/* HAR YOZUV TASNIFI. Har jurnal yozuvi aynan bitta sinfga tushadi:
   in — tan narxga kirdi; pool — o'z transporti xarajati, reyslarga taqsimlandi; neutral — xarajat emas (ombor kirimi, inventar o'lchovi);
   wait — hisobga olinadi, lekin hali emas (oy yopilganda fakt, tushirilganda kirim); open — boshlang'ich qoldiq;
   pre — tizim boshlanishidan oldin; future — hisobot sanasidan keyin; out — hech qayerga tushmadi (sababi bilan — tuzatish kerak). */
E.CLS={in:'Tan narxga kirdi',pool:"O'z transporti: reyslarga taqsimlandi",neutral:'Xarajat emas',wait:'Kutilmoqda',open:"Boshlang'ich qoldiq",pre:'Boshlanishdan oldin',future:'Hisobot sanasidan keyin',out:'Chetda qoldi'};
E.classify=function(c){
  const s=c.start, end=c.led.end, cfg=c.cfg, out={}, cm=E.ms(c.D);
  const dcl=d=>!d?null:(d<s?'pre':(d>end?'future':null));
  const ownM=d=>{ const m=c.own.months[E.ms(d)]; return !!(m&&m.n>0); };
  const R=(j,rows,f)=>{ out[j]=rows.map(r=>{ const x=f(r); return {id:r.id,r,cls:x[0],why:x[1]||'',sum:x[2]||0}; }); };
  R('tex',c.tex,t=>{ const k=dcl(t.d), sm=t.dz+t.am; if(t.aud){ if(t.audK==='open'&&t.dz) return [k||(t.truck?(ownM(t.d)?'pool':'out'):'in'),"Bakda qolgan, avval xarajatga chiqqan dizel xarajatdan qaytarildi (ikki marta sanalmasin)",t.dz]; return [k||'neutral',t.audK==='open'?"Bak boshlang'ich o'lchovi — xarajat emas":"Bak o'lchovi — xarajat emas; farqi «dizel og'ishi»da alohida",Math.abs(t.og||0)]; } if(k) return [k,'',sm];
    if(t.truck) return ownM(t.d)?['pool','',sm]:['out',"Shu oyda o'z mashinasida reys yo'q",sm];
    return LINKS.indexOf(t.loc)>=0?['in',t.op==='K'?'Krisha hovuziga — keyin qazilgan qumga o\'tadi':'',sm]:['out',"Bo'g'in ko'rsatilmagan yoki noto'g'ri",sm]; });
  R('mat',c.mat,m=>{ const q=E.n(m.q)||0; if(m.op==='K') return ['neutral','Ombor kirimi — sarflanganda xarajatga o\'tadi',q*(E.n(m.p)||0)]; const sm=q*E.pr(c.P,m.it,m.d), k=dcl(m.d); if(k) return [k,'',sm];
    return (LINKS.indexOf(m.st)>=0&&c.P[m.it])?['in','',sm]:['out',"Sarf bo'g'inga biriktirilmagan",sm]; });
  R('xar',c.xar,x=>{ const sm=x.sumC, it=c.item[x.it], k=dcl(x.d); if(k) return [k,'',sm];
    if(!it) return ['out',"Xarajat moddasi ro'yxatda yo'q",sm]; if(!x.lk||stageOf(x.lk)!==it.stage) return ['out',"Bo'g'in moddaga mos emas",sm];
    if(it.stage==='trans'){ if(!ownM(x.d)) return ['out',"Shu oyda o'z mashinasida reys yo'q",sm];
      if(it.type==='D'&&E.ms(x.d)>=cm&&(E.n(it.plans&&it.plans[TR])||0)>0) return ['wait',"Joriy oyda reja ulushi olinadi; oy yopilganda shu fakt bilan almashadi",sm]; return ['pool','',sm]; }
    const shn=x.sumX>0?`Tan narxga ${fmt(x.sumC/(x.sumC+x.sumX)*100,0)}% kiradi; qolgan ${fmt(x.sumX)} so'm tashqarida`:'';
    if(it.type!=='D') return ['in',shn,sm];
    if(E.ms(x.d)<cm) return ['in',shn||'Oy fakti kunlarga teng yoyilgan',sm];
    return (E.n(it.plans&&it.plans[x.lk])||0)>0?['wait',"Joriy oyda reja ulushi olinadi; oy yopilganda shu fakt bilan almashadi",sm]:['in','',sm]; });
  R('reys',c.reys,r=>{ const sm=r.haul+r.sand, k=dcl(r.d); if(k) return [k,'',sm]; if(r.from==='?'||r.to==='?') return ['out',"Marshrut ro'yxatda yo'q",sm]; if(r.kr&&KQ.indexOf(r.from)<0) return ['out','Krisha reysi karyerdan emas',sm]; return ['in',r.kr?"Krisha hovuziga — keyin qazilgan qumga o'tadi":'',sm]; });
  R('vagon',c.vag.concat(c.vagX),v=>{ const sm=v.tyH+v.podH+v.tushH+v.sand; if(v.orph) return ['out',"Manbasi yoki sanasi yo'q",sm];
    if(v.ext){ if(!v.dt) return ['wait','Tushirilganda kirim qilinadi',sm]; return [dcl(v.dt)||'in','',sm]; }
    if(!v.ent) return ['pre','',sm]; if(v.pre) return ['open',"Boshlanish kunida vagonda bo'lgan",sm]; return [dcl(v.dy)||'in','',sm]; });
  R('inv',c.invAll||[],i=>{ const k=dcl(i.d); if(k) return [k]; if(E.n(i.kg)==null||isT(i.wh)||WH.indexOf(i.wh)<0) return ['out',"Ombor noto'g'ri yoki vazn yo'q"]; return ['in','Qoldiq haqiqiysiga tenglashtirildi']; });
  R('karyer',c.kar,k=>[dcl(k.d)||'in','Eski versiya yozuvi',0]);
  return out;
};
E.classSum=function(cl){ const o={}; for(const j in cl){ const g=o[j]={n:cl[j].length,by:{}}; for(const k in E.CLS) g.by[k]={n:0,sum:0}; for(const x of cl[j]){ g.by[x.cls].n++; g.by[x.cls].sum+=x.sum; } } return o; };
/* ---------------------------------------------------------------------
   AUDIT. Har tekshiruv: [bo'lim, holat, nomi, qiymat, izoh]
   --------------------------------------------------------------------- */
E.audit=function(c){
  const cfg=c.cfg, D=c.D, s=c.start, N=cfg.norms, R=[], a=E.ms(D);
  const ck=(sec,st,title,val,note)=>R.push({sec,st,title,val:val==null?'':val,note:note||''});
  const sumf=(arr,f)=>arr.reduce((x,y)=>x+(f(y)||0),0);
  /* A. miqdor zanjiri */
  let md=0; const sn=E.snapAt(c,D); for(const w of WH) md=Math.max(md,Math.abs(sn[w].q-E.bal(c,w,D)));
  ck('A',md<1?'ok':'bad','Ombor qoldiqlari: qiymat zanjiri va harakat jurnali bir xil kg beradi',md<1?'mos':fmt(md)+' kg farq','Ikki mustaqil hisob: jurnal oqimlari yig\'indisi va kunma-kun zanjir.');
  if(c.led.neg.length){ const f=c.led.neg[0]; ck('A','bad','Manfiy qoldiq',c.led.neg.length+' holat',`Birinchi: ${fd(f[0])}, ${E.whName(cfg,f[1])}, ${fmt(f[2]/1000,1)} t. Manfiy ombordan chiqqan qum qiymatsiz ketadi — boshlang'ich qoldiq yoki kirimni tuzating.`); }
  else ck('A','ok',"Manfiy qoldiq yo'q",'',"Hech bir ombor, hech bir kunda noldan pastga tushmagan.");
  const ks=c.reys.filter(r=>r.d>=s&&r.stage==='avtoSt'&&r.from!=='TASHQI'), both=ks.filter(r=>r.wj!=null&&r.wq!=null), lj=sumf(both,r=>r.kgJ), ll=sumf(both,r=>r.loss);
  if(ks.length){ const one=ks.length-both.length; ck('A',one?'warn':'ok',"Karyer → stansiya: ikki tarozi",`${both.length} / ${ks.length} reys`,one?`${one} ta reysda faqat bitta vazn bor — yo'ldagi yo'qotish ko'rinmaydi.`:'Hamma reysda jo\'natish va qabul vazni bor.');
    if(lj) ck('A',ll/lj<=N.yoqKS?'ok':'warn',"Yo'ldagi yo'qotish",fmt(ll/lj*100,2)+'%',`${fmt(ll)} kg; norma ${fmt(N.yoqKS*100,2)}%. Yo'qotish qabul qilingan qum narxiga singadi.`); }
  /* Vagon omborlari: jurnal ro'yxati bo'yicha, harakat oqimlari bo'yicha va qiymat zanjiri bo'yicha uch hisob bir xil chiqishi kerak */
  const tz=E.n(N.tranzKun)||6, vall=c.vag.concat(c.vagX), hasF=(v,t)=>v.flags.some(f=>f[1]===t);
  if(D>=s) for(const T of TW){ if(!c.vag.some(v=>v.tw===T&&v.ent)) continue; const vw=E.vagWh(c,T,s,D), calc=vw.open.kg+vw.load.kg-vw.unl.kg, bk=E.bal(c,T,D), sv=E.vsum(sn[T].v);
    const ok=Math.abs(calc-vw.close.kg)<1&&Math.abs(vw.close.kg-bk)<1&&Math.abs(vw.close.val-sv)<1;
    ck('A',ok?'ok':'bad',`${cfg.wh[T].full}: boshida + yuklandi − tushirildi = vagonlarda`,`${vw.open.n} + ${vw.load.n} − ${vw.unl.n} = ${vw.close.n} vagon`,
      `${ft(vw.open.kg)} + ${ft(vw.load.kg)} − ${ft(vw.unl.kg)} = ${ft(vw.close.kg)} t (harakat jurnali ${ft(bk)} t); qiymati ${fm(vw.close.val)} mln (zanjir ${fm(sv)} mln). Vagonlarda: ${vw.road.n} ta yo'lda, ${vw.wait.n} ta Chustda tushirilmagan — bu qum Chust ombori qoldig'iga kirmaydi.`);
    const stt=E.vagStat(c,T,s,D); if(stt.n) ck('A',stt.avg<=tz*(1+cfg.tol)?'ok':'warn',`${cfg.wh[SOFT[T]].name} → Chust: o'rtacha tranzit muddati`,fmt(stt.avg,1)+' kun',`${stt.n} vagon; eng tez ${stt.min}, eng sekin ${stt.max} kun; norma ${tz} kun.`); }
  const bo=vall.filter(v=>hasF(v,'Sana tartibi'));
  ck('A',bo.length?'bad':'ok','Vagon sanalari tartibi: yuklangan ≤ Chustga kelgan ≤ tushirilgan',bo.length+' ta',bo.length?`Masalan: ${bo.slice(0,4).map(v=>v.no||'?').join(', ')}. Bunday vagon qumi Chustda vaqtidan oldin (yoki kech) ko'rinadi.`:'Hech bir vagon yuklanmasdan oldin kelgan yoki tushirilgan deb yozilmagan.');
  if(c.led.pre.length) ck('A','bad','Yuklanmasdan oldin tushirilgan deb yozilgan vagonlar',c.led.pre.length+' ta',"Shu kunlarda vagon ombori manfiy bo'lib, Chustga qiymatsiz qum kirgan. Sanalarni tuzating.");
  const fst=c.vag.filter(v=>hasF(v,'Juda tez')&&v.dkE>=s);
  ck('A',fst.length?'warn':'ok',`Juda tez kelgan vagonlar (${Math.floor(tz/2)} kundan kam)`,fst.length+' ta',fst.length?`Vagon o'rtacha ${tz} kunda keladi. Yuklangan kuni yoki ertasiga Chustga kelgan deb yozilgan vagon Chust qoldig'ini vaqtidan oldin ko'paytiradi: ${fst.slice(0,4).map(v=>v.no||'?').join(', ')}.`:'');
  const nody=c.vag.filter(v=>hasF(v,"Yuklangan sana yo'q"));
  if(nody.length) ck('A','bad',"Yuklangan sanasi yo'q vagonlar",nody.length+' ta',"Boshlang'ich qoldiq deb olindi, stansiyadan chiqim yozilmadi. Agar ular tizim boshlanganidan keyin yuklangan bo'lsa, stansiya qoldig'i ortiqcha ko'rinadi.");
  for(const L of ['K01','K02']){ const rs=E.reserve(c,L,D); if(rs.has) ck('A',rs.remKg>=0?'ok':'bad',`${cfg.wh[L].name}: kon zahirasi`,fmt(rs.remKg/1000,0)+' t qoldi',rs.remKg<0?'Qazilgan hajm zahiradan oshib ketdi — zahirani yangilang.':`Boshida ${fmt(rs.initKg/1000,0)} t, qazildi ${fmt(rs.ext/1000,1)} t.`);
    const y=sumf(c.tex.filter(t=>t.loc===L&&t.op==='Y'&&t.d>=s&&t.d<=D),t=>t.kg), o=-E.flow(c,L,s,D,0);
    const hasU=c.tex.some(t=>t.loc===L&&t.op==='U'&&t.d>=s&&t.d<=D);      /* «karyer ishi» bilan yuritilsa, yuklash alohida yozilmaydi */
    if((y>0||o>0)&&!(y===0&&hasU)){ const df=o?Math.abs(y-o)/o:1; ck('A',y===0?'warn':(df<=0.05?'ok':'warn'),`${cfg.wh[L].name}: pogruzchik yuklagani va reyslar`,`${fmt(y/1000,1)} t / ${fmt(o/1000,1)} t`,y===0?"Yuklash yozuvi yo'q — yuklash xarajati ko'rinmaydi.":(df<=0.05?'Farq 5% ichida.':`Farq ${fmt(df*100,0)}% — operator hisoboti yoki tarozi tekshirilsin.`)); }
    /* krisha hovuzi: boshida + yig'ildi − qumga o'tdi = qoldi; yig'ilgan summa reyestrdan, qoldiq zanjirdan — ikki manba */
    if(D>=s){ const kr=E.krRep(c,L,s,D); if(kr.any){ const df=kr.open.v+kr.inn-kr.rv-kr.close.v, mt=kr.mode==='k'?`koeffitsient bo'yicha: 1 t qumga ${fmt(kr.k,2)} t krisha`:(kr.mode==='res'?'qolgan tasdiqlangan zaxiraga teng yoyiladi':'usul aniqlanmagan');
        ck('A',Math.abs(df)<1?'ok':'bad',`${cfg.wh[L].name}: krisha hovuzi — yig'ildi − qumga o'tdi = qoldi`,Math.abs(df)<1?`${ft(kr.inq)} t krisha`:fmt(df)+" so'm farq",`${fm(kr.inn)} mln yig'ildi (texnika ${fm(kr.src.tex)}, tashish ${fm(kr.src.reys)}, umumiy xarajat ulushi ${fm(kr.src.fix+kr.src.xar+kr.src.mat)}) − ${fm(kr.rv)} mln ${ft(kr.sq)} t qumga o'tdi = ${fm(kr.close.v)} mln hovuzda. Qumga o'tkazish: ${mt}.`+(kr.next!=null&&kr.close.v>0?` Keyingi qazilgan har kg qumga ${fmt(kr.next,2)} so'm tushadi.`:''));
        if(kr.mode==='none'&&kr.close.v>0.5) ck('A','warn',`${cfg.wh[L].name}: krisha xarajati qumga o'tmayapti`,fm(kr.close.v)+' mln',"Tasdiqlangan zaxira (kg) yoki krisha koeffitsientini Normativlar → Kon jadvaliga kiriting.");
        const km={}, kq=c.kr[L].kr; c.tex.filter(t=>!t.truck&&t.loc===L&&t.op==='K'&&t.d>=s&&t.d<=D).forEach(t=>{ const m=E.ms(t.d); if(!(kq[m]>0)) km[m]=(km[m]||0)+t.dz+t.am; }); const kms=Object.keys(km);
        if(kms.length) ck('A','warn',`${cfg.wh[L].name}: krisha texnikasi ishlagan, krisha reyslari kiritilmagan`,kms.length+' oy',`${kms.map(m=>m.slice(5,7)+'.'+m.slice(0,4)).join(', ')}: xarajat hovuzga tushdi, lekin hajm yo'q — karyerning umumiy xarajatidan krisha ulushi hisoblanmadi.`); } } }
  const cin=E.flow(c,'C01',s,D,1), cadj=E.adjSum(c,'C01',s,D);
  if(cin>0) ck('A',(-cadj/cin)<=N.yoqChust?'ok':'bad','Chust: inventarizatsiya farqi',fs(cadj/1000,1)+' t',cadj?`Kirimning ${fmt(-cadj/cin*100,2)}%; norma ${fmt(N.yoqChust*100,1)}%.`:'Inventarizatsiya kiritilmagan yoki farq yo\'q.');
  /* B. qiymat zanjiri */
  const cs=E.conserve(c);
  ck('B',cs.ok?'ok':'bad','Qiymat saqlanishi: kiritilgan = qoldiq + zavodga yetkazilgan + kamomad',cs.ok?'farq 0':fmt(cs.t.diff)+" so'm farq",`${fm(cs.t.inn)} = ${fm(cs.t.stock)} + ${fm(cs.t.del)} + ${fm(cs.t.loss)} mln so'm.`);
  let chT=0; if(s<=D){ const A=E.agg(c,s,D,'acc'); A.chain.concat([A.chain.togri],Object.values(A.chain.kr)).forEach(l=>chT+=l.cost); chT+=A.buy.cost; }
  const ledT=E.vsum(c.led.cap)-c.led.cap[CI.op];
  if(c.led.end===D) ck('B',Math.abs(chT-ledT)<1?'ok':'bad',"Ikki usul bir xil yig'indi beradi",Math.abs(chT-ledT)<1?'mos':fmt(chT-ledT)+" so'm farq",`Davr tahlili (bo'g'in × element) ${fm(chT)} mln, qiymat zanjiri ${fm(ledT)} mln. Farq bo'lsa — biror yozuv bir usulda sanalib, ikkinchisida tushib qolgan.`);
  if(D>=s){ const AI=E.agg(c,s,D,'acc'), il=AI.chain.filter(l=>stageOf(l.id)), chI=sumf(il,l=>l.idle), ledI=cs.idle.inn, okI=Math.abs(chI-ledI)<1&&Math.abs(cs.idle.diff)<1, iw=il.filter(l=>l.idle>0);
    if(c.led.end===D) ck('B',okI?'ok':'bad',"Bo'sh turish: ikki usul bir xil va hech qayerda yo'qolmagan",okI?'mos':fmt(chI-ledI)+' / '+fmt(cs.idle.diff)+" so'm farq",`Davr tahlili ${fm(chI)} mln, kunma-kun zanjir ${fm(ledI)} mln = omborlarda ${fm(cs.idle.stock)} + zavodga yetkazilgan ${fm(cs.idle.del)} + kamomadda ${fm(cs.idle.loss)}.`);
    ck('B','ok',"Bo'sh turish — tan narx ichida, alohida xarajat emas",fm(chI)+' mln',(iw.length?iw.map(l=>`${l.name}: ${l.days} kundan ${l.idleDays.length} kun ish bo'lmagan → ${fm(l.idle)} mln`).join('; ')+'. ':"Doimiy xarajati bor bo'g'inlarda ish bo'lmagan kun yo'q. ")+"Ish bo'lgan kun — bo'g'inda texnika yozuvi yoki qum harakati (reys, vagon) bor kun. Yozuv kiritilmay qolgan kun ham bo'sh turish bo'lib ko'rinadi. Jami tan narx bundan o'zgarmaydi."); }
  if(c.led.openEst) ck('B','warn',"Boshlang'ich qoldiq qiymati kiritilmagan",'',"Normativ narxda baholandi. Normativlar → Bo'g'inlar jadvaliga balans qiymatini kiriting.");
  for(const T of TW){ const pw=c.vag.filter(v=>v.pre&&v.tw===T), ov=E.n(cfg.wh[T].openVal);
    if(pw.length) ck('B',ov==null?'warn':'ok',`${cfg.wh[T].full}: boshlang'ich qoldiq`,`${pw.length} vagon, ${ft(sumf(pw,v=>v.kg))} t`,ov==null?`Qiymati tarmoq normativida baholandi (${fmt(c.NS.wh[T],1)} so'm/kg). Balansdagi summani Normativlar → Bo'g'inlar jadvaliga kiriting.`:`Balans qiymati ${fm(ov)} mln so'm vagonlarga vazniga mutanosib taqsimlandi.`);
    else if(ov!=null&&ov>0) ck('B','warn',`${cfg.wh[T].full}: boshlang'ich qiymat kiritilgan, vagon yo'q`,fm(ov)+' mln',"Boshlanish kunida vagonda bo'lgan vagonlarni Vagonlar jurnaliga haqiqiy yuklangan sanasi bilan kiriting — aks holda bu qiymat hisobga olinmaydi."); }
  { let rs=0; (c.led.reg0||[]).concat(c.led.reg).forEach(g=>rs+=g[2]); const ct=E.vsum(c.led.cap); ck('B',Math.abs(rs-ct)<1?'ok':'bad',"Xarajatlar reyestri = qiymat zanjiriga kiritilgan jami",Math.abs(rs-ct)<1?'mos':fmt(rs-ct)+" so'm farq",`${fmt(c.led.reg.length+(c.led.reg0||[]).length)} ta yozuv, ${fm(rs)} mln so'm. Tan narxga kirgan har so'mning manbasi (jurnal va yozuv) Hisobot → Xarajatlar reyestrida.`); }
  { const tc=E.tankCheck(c); if(tc.n){ const ok=tc.dv<1&&tc.dl<0.01; ck('B',ok?'ok':'bad',"Texnika baklari: boshlang'ich + quyildi = sarf + og'ish + bakdagi qoldiq",ok?`${tc.n} ta bak`:fmt(tc.dv)+" so'm / "+fmt(tc.dl,2)+' l farq',`Baklarda hisobda ${fmt(tc.lit,0)} l, ${fm(tc.val)} mln so'm. Bu dizel ombordan chiqqan, lekin hali yonmagan — tan narxga kirmagan.`); } }
  if(c.led.loss.length) ck('B','warn','Kamomad zararga chiqarildi',fm(sumf(c.led.loss,x=>E.vsum(x.v)))+' mln',`${c.led.loss.length} ta inventarizatsiya, ${fmt(sumf(c.led.loss,x=>x.kg)/1000,1)} t. O'rtacha tan narxda, qoldiq qiymatidan chiqarilgan.`);
  /* C. tan narxga kirmagan */
  const gu=sumf(c.vag.filter(v=>v.dt&&v.dt>=s&&v.dt<=D),v=>v.guH);
  ck('C',gu?'warn':'ok','GU-46 jarimalar',fmt(gu)+" so'm",'Tan narxga kiritilmaydi — davr zarari (boshqa operatsion xarajat).');
  if(D>=s){ const fv=E.fuelVar(c,s,D); if(fv.aud.n||fv.open.n){ const nm=Object.keys(fv.by).filter(k=>fv.by[k].n).map(k=>((E.mc(cfg,k)||{}).name||k)+' '+fs(fv.by[k].l,0)+' l').join('; ');
      ck('C',fv.aud.v>0.5?'warn':'ok',"Dizel og'ishi (bak o'lchovlari): hisobdagi va o'lchangan qoldiq farqi",fs(fv.aud.v,0)+" so'm",`${fv.aud.n} ta o'lchov, ${fs(fv.aud.l,0)} l${nm?': '+nm:''}. Musbat — normadan ortiq yongan yoki kam quyilgan dizel. Qum tan narxiga kirmaydi: davr og'ishi sifatida alohida hisobga olinadi.`+(fv.open.v<-0.5?` Bundan tashqari, birinchi o'lchovlarda bakda turgan, avval quyilganda xarajatga chiqqan dizel tan narxdan qaytarildi: ${fmt(-fv.open.v)} so'm (${fmt(-fv.open.l,0)} l) — ikki marta sanalmasligi uchun.`:'')); } }
  ck('C',c.own.unalloc>0.5?'bad':'ok',"O'z transporti: taqsimlanmagan xarajat",fmt(c.own.unalloc)+" so'm",c.own.unalloc>0.5?"Shu oylarda o'z mashinasida reys yo'q, xarajat bor: "+c.own.unallocList.map(x=>x[0].slice(0,7)).join(', '):"Hamma transport xarajati reyslarga o'tgan.");
  { const sx=c.xar.filter(x=>x.d>=s&&x.d<=D&&x.sumX>0), tx=sumf(sx,x=>x.sumX); ck('C',tx>0?'warn':'ok',"Xarajatning tan narxga kirmagan ulushi (modda ulushi 100% dan kam)",fmt(tx)+" so'm",tx>0?`${sx.length} ta yozuv: ${[...new Set(sx.map(x=>(c.item[x.it]||{}).name))].join(', ')}. Bu qism qum tan narxiga kirmaydi — boshqa faoliyat yoki davr xarajati sifatida hisobga olinishi kerak.`:'Hamma modda tan narxga to\'liq kiradi.'); }
  const orx=c.xar.filter(x=>x.d>=s&&x.d<=D&&(!c.item[x.it]||!x.lk||stageOf(x.lk)!==c.item[x.it].stage));
  ck('C',orx.length?'bad':'ok',"Xarajat: modda yoki bo'g'ini noto'g'ri yozuvlar",orx.length+' ta',orx.length?`${fmt(sumf(orx,x=>E.n(x.sum)))} so'm hech bir bo'g'inga tushmayapti. Xarajatlar jurnalida tuzating.`:'Har bir xarajat o\'z bo\'g\'iniga tushgan.');
  const orm=c.mat.filter(m=>m.op==='S'&&m.d>=s&&m.d<=D&&(!stageOf(m.st)||m.st===TR||!c.P[m.it]));
  ck('C',orm.length?'bad':'ok',"Material sarfi: bo'g'insiz yozuvlar",orm.length+' ta',orm.length?"Sarf bo'g'inga biriktirilmagan — tan narxga tushmayapti.":'');
  const ort=c.tex.filter(t=>!t.truck&&t.d>=s&&t.d<=D&&(!stageOf(t.loc)||t.loc===TR));
  ck('C',ort.length?'bad':'ok',"Texnika: bo'g'insiz yozuvlar",ort.length+' ta',ort.length?`${fmt(sumf(ort,t=>t.dz+t.am))} so'm tushib qolgan.`:'');
  const orr=c.reys.filter(r=>r.d>=s&&r.d<=D&&(r.from==='?'||(r.tk&&!r.own)));
  ck('C',orr.length?'bad':'ok',"Reys: marshruti yoki mashinasi ro'yxatda yo'q",orr.length+' ta','');
  { const cs=E.classSum(E.classify(c)); let tot=0, outN=0, outS=0, wt=0; for(const j in cs){ tot+=cs[j].n; outN+=cs[j].by.out.n; outS+=cs[j].by.out.sum; wt+=cs[j].by.wait.n; }
    ck('C',outN?'bad':'ok','Har jurnal yozuvi hisobga olingan',`${fmt(tot-outN)} / ${fmt(tot)}`,outN?`${outN} ta yozuv (${fmt(outS)} so'm) hech qayerga tushmagan — Hisobot → Yozuvlar nazoratida sababi bilan.`:`Hech bir yozuv chetda qolmagan.`+(wt?` ${wt} ta yozuv kutilmoqda (oy yopilganda yoki vagon tushirilganda hisobga kiradi).`:'')); }
  ck('C',c.vagX.length?'bad':'ok',"Vagon: manbasi yoki sanasi yo'q yozuvlar",c.vagX.length+' ta',c.vagX.length?`${ft(sumf(c.vagX,v=>v.kg))} t qum hech bir omborga tushmayapti. Vagonlar jurnalida tuzating.`:'Har vagon bitta tarmoqqa tegishli.');
  const pre=[['reys',c.reys,r=>r.d],['texnika',c.tex,t=>t.d],['xarajat',c.xar,x=>x.d],['material',c.mat,m=>m.d]].map(x=>[x[0],x[1].filter(r=>x[2](r)&&x[2](r)<s).length]).filter(x=>x[1]);
  ck('C',pre.length?'warn':'ok','Tizim boshlanish sanasidan oldingi yozuvlar',pre.map(x=>x[1]+' '+x[0]).join(', ')||'0','Bu yozuvlar zanjir hisobiga kirmaydi.');
  /* D. ikki marta sanash xavfi */
  const dd={}; c.tex.filter(t=>!t.truck&&t.l>0).forEach(t=>dd[t.d+'|'+t.loc]=1); const dbl=c.mat.filter(m=>m.op==='S'&&m.it==='DIZEL'&&dd[m.d+'|'+m.st]);
  ck('D',dbl.length?'warn':'ok',"Dizel bir kunda ikki joyda kiritilgan (Texnika va Materiallar)",dbl.length+' ta',dbl.length?`${fmt(sumf(dbl,m=>E.n(m.q)))} l. Texnika dizeli faqat Texnika jurnalida bo'lishi kerak.`:'');
  const ovr=c.reys.filter(r=>r.own&&E.n(r.t)!=null);
  ck('D',ovr.length?'warn':'ok',"O'z reysida qo'lda tarif kiritilgan",ovr.length+' ta',"O'z transportida tarif ishlatilmaydi — tannarx hisoblanadi.");
  const mis=c.xar.filter(x=>x.mc&&c.item[x.it]&&((E.isTruck(cfg,x.mc)&&c.item[x.it].stage!=='trans')||(!E.isTruck(cfg,x.mc)&&c.item[x.it].stage==='trans')));
  ck('D',mis.length?'bad':'ok',"Xarajat boshqa turdagi texnikaga biriktirilgan",mis.length+' ta',mis.length?`${fmt(sumf(mis,x=>E.n(x.sum)))} so'm: yuk mashinasi xarajati karyerga yoki aksincha yozilgan — zanjirlar aralashadi.`:"Yuk mashinasi xarajatlari faqat transportda, karyer texnikasiniki faqat o'z bo'g'inida.");
  { const seen={}, dd=[]; c.tex.forEach(t=>{ if(t.op!=='U'||t.d<s||t.d>D) return; const k=t.d+'|'+t.mc+'|'+t.loc; if(seen[k]) dd.push(t); seen[k]=1; });
    ck('D',dd.length?'bad':'ok',"Bir texnikaga bir kunda ikki «karyer ishi» yozuvi",dd.length+' ta',dd.length?`Soat va dizel ikki marta sanalgan bo'lishi mumkin: ${dd.slice(0,4).map(t=>fd(t.d)+' '+t.m.name).join('; ')}.`:'Har texnikaga kuniga bitta yozuv.'); }
  const dup=c.reys.filter(r=>r.flags.some(f=>f[1]==='Takror')).length, dupv=c.vag.filter(v=>v.flags.some(f=>f[1]==='Takror')).length;
  ck('D',dup||dupv?'bad':'ok','Takroriy reys va vagon yozuvlari',`${dup} reys, ${dupv} vagon`,'');
  const tkm={}; c.tex.filter(t=>t.truck).forEach(t=>tkm[t.mc+'|'+E.ms(t.d)]=1); const nolog={}; c.reys.filter(r=>r.own&&r.d>=s).forEach(r=>{ if(!tkm[r.tk+'|'+E.ms(r.d)]) nolog[r.tk+'|'+E.ms(r.d)]=1; });
  ck('D',Object.keys(nolog).length?'warn':'ok',"O'z mashinasi reys qilgan, lekin yoqilg'i va km yozuvi yo'q",Object.keys(nolog).length+' mashina-oy',"Bunday reyslarga faqat umumiy xarajat (ish haqi) tushadi — tannarx past ko'rinadi.");
  /* E. hisoblangan (fakt kutilayotgan) summalar */
  const pv=c.vag.filter(v=>v.pend&&((v.dy&&v.dy>=s)||(v.dt&&v.dt>=s)));
  ck('E',pv.length?'warn':'ok',"Vagon xarajatlari norma bo'yicha",fmt(sumf(pv,v=>v.pendSum))+" so'm",`${pv.length} ta vagonda fakt hujjat kiritilmagan.`);
  let est=0, noFact=[]; cfg.items.forEach(it=>{ if(it.type!=='D') return; linksOf(it.stage).forEach(L=>{ if(s>D) return; const r=E.itemCost(c,it,L,s,D,'acc'); est+=r.est;
    let m=E.ms(s); const cm=E.ms(D); while(m<cm){ if((E.n(it.plans&&it.plans[L])||0)>0&&!E.monthHas(c,it.code,L,m)) noFact.push(m.slice(0,7)+' '+it.name); m=E.add(E.me(m),1); } }); });
  ck('E',est>0?'warn':'ok',"Doimiy xarajatlar reja bo'yicha hisoblangan",fmt(est)+" so'm","Joriy oyda fakt kelguncha reja ulushi olinadi; oy yopilganda fakt bilan almashadi.");
  ck('E',noFact.length?'bad':'ok','Yopilgan oyda fakti kiritilmagan doimiy moddalar',noFact.length+' ta',noFact.slice(0,6).join('; ')+(noFact.length>6?' …':''));
  /* F. hujjatlar to'liqligi */
  const pct=(arr,f,title,note)=>{ if(!arr.length) return; const m=arr.filter(f).length; ck('F',m?'warn':'ok',title,`${arr.length-m} / ${arr.length}`,m?`${m} ta yozuvda yo'q. ${note||''}`:'To\'liq.'); };
  pct(c.reys.filter(r=>r.d>=s&&!r.kr),r=>!r.doc,'Reyslar: TTN raqami','');
  pct(c.vag.filter(v=>v.ent||v.ext),v=>!v.nak,'Vagonlar: nakladnoy raqami','');
  pct(c.vag.filter(v=>v.exd),v=>!v.dk,'Vagonlar: Chustga kelgan sana',"Kelgan sanasiz tranzit muddati va kutish vaqti noto'g'ri chiqadi.");
  pct(c.xar.filter(x=>x.d>=s&&x.pay==='Naqd'),x=>!x.doc,'Naqd xarajat: hujjat raqami','Naqd xarajat hujjatsiz tan narxga kiritilmasligi kerak.');
  pct(c.xar.filter(x=>x.d>=s&&x.pay==='Karta'),x=>!x.doc,'Korporativ karta: chek raqami','');
  pct(c.xar.filter(x=>x.d>=s),x=>!x.who,"Xarajat: kim sarflagani",'');
  pct(c.tex.filter(t=>t.d>=s&&!t.qo),t=>E.n(t.mr)==null,"Texnika: hisoblagich ko'rsatkichi","Hisoblagichsiz moto-soat va km ni tekshirib bo'lmaydi.");
  /* joriy oy: hajm bor kun — texnika yozuvi yo'q; texnika ishlagan kun — hajm yo'q */
  for(const L of KQ){ const dv={}, dm={}; for(const k in c.sandDay) if(k.slice(0,3)===L&&c.sandDay[k]>0) dv[k.slice(4)]=1; for(const k in c.krDay) if(k.slice(0,3)===L&&c.krDay[k]>0) dv[k.slice(4)]=1; for(const k in c.loadDay) if(k.slice(0,3)===L&&c.loadDay[k]>0) dv[k.slice(4)]=1;
    for(const t of c.tex) if(!t.truck&&t.loc===L&&t.mh>0) dm[t.d]=1; const inM=d=>d>=a&&d<=D&&d>=s, nv=Object.keys(dv).filter(d=>inM(d)&&!dm[d]), nm=Object.keys(dm).filter(d=>inM(d)&&!dv[d]&&c.tex.some(t=>t.d===d&&t.loc===L&&t.op==='U')), sd=d=>d.slice(8,10)+'.'+d.slice(5,7);
    if(Object.keys(dv).some(inM)||Object.keys(dm).some(inM)){ ck('F',nv.length?'warn':'ok',`${cfg.wh[L].name}: qum qazilgan, yuklangan yoki krisha chiqqan kunlarda texnika yozuvi (oy boshidan)`,nv.length?nv.length+' kunda yo\'q':'to\'liq',nv.length?`${nv.slice(0,8).map(sd).join(', ')}: hajm bor, lekin texnika soati va dizeli kiritilmagan — xarajat kam ko'rinadi.`:'');
      if(nm.length) ck('F','warn',`${cfg.wh[L].name}: texnika ishlagan, hajm kiritilmagan kunlar (oy boshidan)`,nm.length+' kun',`${nm.slice(0,8).map(sd).join(', ')}: qazilgan qum, krisha reysi ham, karyerdan chiqqan reys ham yo'q — texnika xarajati oy ulushi bo'yicha bo'lindi, unumdorlik hisoblanmadi.`);
      /* aralash kiritish: bir kunda ham «karyer ishi» (jami), ham alohida ish yozuvi — hajm ikkalasiga ham hisoblanadi */
      { const mx={}; for(const t of c.tex) if(!t.truck&&t.loc===L&&t.d>=s&&t.d<=D&&t.mh>0&&(t.op==='Y'||t.op==='K'||t.op==='Q')) mx[t.d]=1; const md=Object.keys(mx).filter(d=>c.tex.some(t=>t.d===d&&t.loc===L&&t.op==='U')).sort();
        if(md.length) ck('F','warn',`${cfg.wh[L].name}: bir kunda ham «karyer ishi», ham alohida ish yozuvi`,md.length+' kun',`${md.slice(0,8).map(sd).join(', ')}: «karyer ishi» yozuvi shu kungi butun hajmni (krisha, qazish, yuklash) qamraydi. Alohida «Qum yuklash», «Krisha ochish» yoki soatli «Qum qazildi» yozuvi ham bo'lsa, taqsimot va unumdorlik buziladi — bir kunga bitta usul qoldiring.`); } } }
  /* G. sozlama to'liqligi */
  const g1=cfg.machines.filter(m=>m.type!=='T'&&(E.n(m.normL)==null||!E.n(m.normT))), g2=cfg.machines.filter(m=>!E.mcRate(m)), g3=E.trucks(cfg).filter(m=>E.n(m.normL)==null);
  ck('G',g1.length?'warn':'ok','Texnika normalari (dizel, unumdorlik)',`${cfg.machines.filter(m=>m.type!=='T').length-g1.length} / ${cfg.machines.filter(m=>m.type!=='T').length}`,g1.map(m=>m.name).join(', '));
  ck('G',g2.length?'warn':'ok','Amortizatsiya uchun qiymat va resurs',`${cfg.machines.length-g2.length} / ${cfg.machines.length}`,g2.length?'Kiritilmaganlarida amortizatsiya nol: '+g2.map(m=>m.name).join(', '):'');
  if(E.trucks(cfg).length) ck('G',g3.length?'warn':'ok',"Yuk mashinalari: dizel normasi (l/100 km)",`${E.trucks(cfg).length-g3.length} / ${E.trucks(cfg).length}`,'');
  ['K01','K02'].forEach(L=>{ if((E.n(cfg.wh[L].plan)||0)>0||E.flow(c,L,s,D,1)>0) ck('G',E.n(cfg.wh[L].resKg)>0?'ok':'warn',`${cfg.wh[L].name}: kon zahirasi va qiymati`,E.n(cfg.wh[L].resKg)>0?'kiritilgan':'kiritilmagan',E.n(cfg.wh[L].resKg)>0?'':'Zahira qiymati tan narxga nol bo\'lib kirmoqda.'); });
  LINKS.forEach(L=>{ const act=stageOf(L)==='karyer'?E.flow(c,L,s,D,1):(stageOf(L)==='stansiya'?-E.flow(c,L,s,D,0):E.flow(c,L,s,D,1)); if(act>0&&!((E.n(cfg.wh[L].plan)||0)>0)) ck('G','warn',`${cfg.wh[L].name}: oylik reja hajmi kiritilmagan`,'',"Doimiy xarajat normasini hisoblab bo'lmaydi."); });
  if(E.flow(c,'S02',s,D,1)>0&&E.n(N.tyTarif2)==null) ck('G','warn',`${E.stName(cfg,'S02')} → Chust temir yo'l tarifi kiritilmagan`,'',"Bo'zsuv tarifi ishlatilmoqda — Normativlar → Logistika normativlarida kiriting.");
  for(const k in c.P) for(const st in c.P[k].st) if(c.P[k].st[st].stock<-1e-6) ck('G','bad',`${cfg.mats[k].name}: ${SITE_NAME[st]} ombori manfiy`,fmt(c.P[k].st[st].stock,0)+' '+cfg.mats[k].unit,'Kirim kiritilmagan — sarf narxi oxirgi ma\'lum narxda olinmoqda.');
  { const used=m=>c.tex.some(t=>t.mc===m.code&&!t.aud&&t.d>=s&&t.d<=D), noB=cfg.machines.filter(m=>E.n(m.normL)!=null&&used(m)&&!E.tankAt(c,m.code,D).on), neg=cfg.machines.filter(m=>{ const st=E.tankAt(c,m.code,D); return st.on&&st.q<-0.5; }), onN=cfg.machines.filter(m=>E.tankAt(c,m.code,D).on).length;
    if(noB.length||onN) ck('G',noB.length?'warn':'ok',"Dizel sarfi usuli: norma (bak o'lchangan) yoki fakt (quyilgani)",`${onN} ta norma usulida`,noB.length?`Norma bor, bak o'lchanmagan — hali fakt usulida: ${noB.map(m=>m.name).join(', ')}. Bakni bir marta o'lchab kiriting.`:"Normasi bor, ishlagan har texnikaning baki o'lchangan.");
    if(neg.length) ck('G','bad','Bak hisobda manfiy',neg.length+' ta',neg.map(m=>m.name+' '+fmt(E.tankAt(c,m.code,D).q,0)+' l').join('; ')+". Quyilgan dizel kiritilmagan yoki norma past: bakni o'lchab kiriting."); }
  const noacc=cfg.items.filter(i=>!i.acc).length; ck('G',noacc?'warn':'ok','Xarajat moddalariga SAP hisobi biriktirilgan',`${cfg.items.length-noacc} / ${cfg.items.length}`,'');
  return R;
};

/* =====================================================================
   3. YORDAMCHI: raqam formati, DOM, jadval, Excel
   Raqamlar: minglik nuqta bilan, kasr vergul bilan — 1.234.567,89. Kiritishda ham, chiqarishda ham bir xil.
   ===================================================================== */
const grp=s=>s.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
function fmt(n,dec){ if(n==null||n===''||isNaN(n)) return '—'; dec=dec||0;
  const s=Math.abs(+n).toFixed(dec).split('.'); s[0]=grp(s[0]);
  return ((+n<0&&(+(+n).toFixed(dec))!==0)?'−':'')+s.join(','); }
/* kiritish maydoni uchun: yaxlitlamasdan */
function fmtIn(n){ if(n==null||n===''||isNaN(n)) return ''; let t=String(+n); if(/e/i.test(t)) t=(+n).toFixed(8).replace(/0+$/,'').replace(/\.$/,'');
  const neg=t[0]==='-'; if(neg) t=t.slice(1); const p=t.split('.'); return (neg?'-':'')+grp(p[0])+(p[1]?','+p[1]:''); }
const ft=kg=>kg==null?'—':fmt(kg/1000,1);
const fm=s=>s==null?'—':fmt(s/1e6,2);
const fs=(v,d)=>v==null?'—':((v>0?'+':'')+fmt(v,d));
const fd=d=>d?d.slice(8,10)+'.'+d.slice(5,7)+'.'+d.slice(0,4):'—';
/* Matndan son: vergul — kasr; nuqta — minglik (1.234.567). Vergulsiz bitta nuqta minglik ko'rinishida bo'lmasa (0.58, 16.5) kasr deb olinadi. */
function pnum(v){ if(v==null) return null; if(typeof v==='number') return v; v=String(v).replace(/[\s  ']/g,'').replace('−','-'); if(v==='') return null;
  if(v.indexOf(',')>=0){ if(v.split(',').length>2) return NaN; v=v.replace(/\./g,'').replace(',','.'); }
  else if(v.indexOf('.')>=0){ if(/^-?\d{1,3}(\.\d{3})+$/.test(v)&&!/^-?0\./.test(v)) v=v.replace(/\./g,''); else if(v.split('.').length>2) return NaN; }
  const n=Number(v); return isNaN(n)?NaN:n; }
/* Yozish paytida guruhlash: 1234567 → 1.234.567; kasr uchun vergul (nuqta bosilsa ham vergulga aylanadi) */
function fmtTyped(v){ const neg=/^\s*[-−]/.test(v); let s=String(v).replace(/[^\d,]/g,''); const k=s.indexOf(','); let int=k<0?s:s.slice(0,k); const dec=k<0?null:s.slice(k+1).replace(/,/g,'');
  int=grp(int.replace(/^0+(?=\d)/,'')); return (neg?'-':'')+int+(dec==null?'':','+dec); }
function numMask(inp){ inp.setAttribute('inputmode','decimal'); inp.setAttribute('autocomplete','off'); inp.classList.add('numin');
  inp.addEventListener('beforeinput',ev=>{ if(ev.inputType==='insertText'&&(ev.data==='.'||ev.data===',')){ ev.preventDefault();
      if(inp.value.indexOf(',')<0){ const a=inp.selectionStart==null?inp.value.length:inp.selectionStart, b=inp.selectionEnd==null?a:inp.selectionEnd; inp.setRangeText(',',a,b,'end'); inp.dispatchEvent(new Event('input',{bubbles:true})); } } });
  inp.addEventListener('paste',ev=>{ const cd=ev.clipboardData; if(!cd) return; const n=pnum(cd.getData('text')); if(n===null||isNaN(n)) return; ev.preventDefault(); inp.value=fmtIn(n); inp.dispatchEvent(new Event('input',{bubbles:true})); });
  inp.addEventListener('input',()=>{ const v=inp.value, pos=inp.selectionStart==null?v.length:inp.selectionStart; let sig=0; for(let i=0;i<pos;i++) if(/[\d,]/.test(v[i])) sig++;
    const out=fmtTyped(v); if(out===v) return; inp.value=out; let i=0,c=0; while(i<out.length&&c<sig){ if(/[\d,]/.test(out[i])) c++; i++; } try{ inp.setSelectionRange(i,i); }catch(e){} });
  return inp; }
function el(tag,attrs,...kids){ const e=document.createElement(tag);
  if(attrs) for(const k in attrs){ const v=attrs[k]; if(v==null||v===false) continue;
    if(k==='class') e.className=v; else if(k.startsWith('on')) e.addEventListener(k.slice(2),v); else if(k==='text') e.textContent=v; else e.setAttribute(k,v===true?'':v); }
  for(const k of kids.flat(Infinity)){ if(k==null||k===false) continue; e.append(k.nodeType?k:document.createTextNode(String(k))); }
  return e; }
const chip=(cls,txt)=>el('span',{class:'chip '+cls},txt);
let toastT; function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true,3600); }
const rid=()=>Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-5);

/* ---------- Jadval: uzun ro'yxat sahifalanadi, har jadval Excelga chiqadi ---------- */
const PAGE=200;
function cellText(c){ if(c==null||c===false) return ''; if(Array.isArray(c)) return c.map(cellText).join(''); if(c.nodeType){ const i=c.matches&&c.matches('input,select')?c:(c.querySelector?c.querySelector('input,select'):null); return i?(i.tagName==='SELECT'?(i.selectedOptions[0]?i.selectedOptions[0].textContent:''):i.value):c.textContent; } return String(c); }
/* Eksport qiymati: o'ng ustunlarda son (hisoblash uchun), sana — haqiqiy sana */
function xval(c,num){ if(typeof c==='number') return c; let t=cellText(c).trim(); if(t==='—'||t==='') return '';
  const dm=/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(t); if(dm) return {d:dm[3]+'-'+dm[2]+'-'+dm[1]};
  if(num){ const u=t.replace(/\s*~$/,'').replace(/^\+/,''); if(/^[−-]?\d{1,3}(\.\d{3})*(,\d+)?$/.test(u)||/^[−-]?\d+(,\d+)?$/.test(u)){ const n=pnum(u); if(n!==null&&!isNaN(n)) return n; } }
  return t; }
function tableData(heads,rows){ const hs=heads.map(h=>cellText(h[0]).trim()), keep=hs.map((h,i)=>i).filter(i=>hs[i]!=='');      /* sarlavhasiz ustun (tugmalar) eksportga kirmaydi */
  return {heads:keep.map(i=>hs[i]),rows:rows.map(r=>{ const cells=r.cells||r; const o=keep.map(i=>xval(cells[i],!!(heads[i]&&heads[i][1]==='r'))); if(r.cls==='total') o._b=1; return o; })}; }
function table(heads,rows,opt){ opt=opt||{};
  const t=el('table'), tr=el('tr'); heads.forEach(h=>tr.append(el('th',{class:h[1]||''},h[0]))); t.append(el('thead',null,tr));
  const tb=el('tbody'); t.append(tb);
  const mk=r=>{ const cells=r.cells||r, row=el('tr',{class:r.cls||''}); cells.forEach((c,i)=>{ const cls=(heads[i]&&heads[i][1])||''; row.append(el('td',{class:cls},c)); }); return row; };
  let k=rows.length; while(k>0&&rows[k-1]&&rows[k-1].cls==='total') k--;           /* oxiridagi jami qatorlari har doim ko'rinadi */
  const main=rows.slice(0,k), foot=rows.slice(k), footEls=foot.map(mk); let shown=0;
  const info=el('span',{class:'muted num'}), more=el('button',{type:'button',class:'link'}), allb=el('button',{type:'button',class:'link'},'Hammasini ko\'rsatish');
  const draw=n=>{ const to=Math.min(main.length,n), fr=document.createDocumentFragment(); for(let i=shown;i<to;i++) fr.append(mk(main[i])); if(footEls.length&&footEls[0].parentNode) tb.insertBefore(fr,footEls[0]); else { tb.append(fr); footEls.forEach(f=>tb.append(f)); }
    shown=to; const left=main.length-shown; info.textContent=left>0?`${fmt(shown)} / ${fmt(main.length)} qator`:''; more.textContent=`Yana ${fmt(Math.min(PAGE,left))} ta`; more.hidden=allb.hidden=left<=0; };
  more.addEventListener('click',()=>draw(shown+PAGE)); allb.addEventListener('click',()=>draw(main.length));
  draw(main.length>PAGE+40?PAGE:main.length);
  const hasInput=!!t.querySelector('input,select,textarea'), exp=!opt.noExport&&!hasInput&&main.length>=2;
  const w=el('div',{class:'tblock'},el('div',{class:'tw'},t));
  if(exp||main.length>shown){ const bar=el('div',{class:'tbar'},el('span',{class:'tpage'},info,more,allb));
    if(exp) bar.append(el('span',{class:'texp'},
      el('button',{type:'button',class:'link',title:'Jadvalni Excel fayl qilib yuklab olish',onclick:()=>exportSheets([Object.assign({name:opt.name||secName(w)},tableData(heads,rows))],opt.name||secName(w))},'Excel'),
      el('button',{type:'button',class:'link',title:'Jadvalni nusxalash — Excelga qo\'yish mumkin',onclick:()=>copyTsv(tableData(heads,rows))},'Nusxa')));
    w.append(bar); }
  return w; }
function secName(node){ const s=node.closest('section'); let h=s&&s.querySelector('h2,h3'); if(node.previousElementSibling&&/^H[23]$/.test(node.previousElementSibling.tagName)) h=node.previousElementSibling; return (h?h.textContent:'Jadval').replace(/\s+/g,' ').trim(); }
function tsvOf(td){ const f=v=>v===''||v==null?'':(typeof v==='number'?String(v).replace('.',','):(v.d?fd(v.d):String(v).replace(/[\t\r\n]+/g,' '))); return [td.heads.map(f).join('\t')].concat(td.rows.map(r=>r.map(f).join('\t'))).join('\r\n'); }
async function copyTsv(td){ const txt=tsvOf(td); try{ await navigator.clipboard.writeText(txt); toast(`Nusxalandi: ${fmt(td.rows.length)} qator. Excelda katakni tanlab, qo'ying.`); }
  catch(e){ const ta=el('textarea',{style:'position:fixed;left:0;top:0;opacity:0'}); ta.value=txt; document.body.append(ta); ta.select(); let ok=false; try{ ok=document.execCommand('copy'); }catch(_){} ta.remove(); toast(ok?`Nusxalandi: ${fmt(td.rows.length)} qator.`:"Nusxalab bo'lmadi — Excel faylni yuklab oling."); } }

/* ---------- .xlsx yozuvchi (siqilmagan zip): sonlar son bo'lib, sanalar sana bo'lib tushadi ---------- */
const CRCT=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
function crc32(u8){ let c=0xFFFFFFFF; for(let i=0;i<u8.length;i++) c=CRCT[(c^u8[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
function zipStore(files){ const enc=new TextEncoder(), parts=[], cd=[]; let off=0;
  const u16=n=>[n&255,(n>>>8)&255], u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
  for(const f of files){ const name=enc.encode(f[0]), data=typeof f[1]==='string'?enc.encode(f[1]):f[1], crc=crc32(data);
    const lh=new Uint8Array([0x50,0x4b,3,4].concat(u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0)));
    parts.push(lh,name,data);
    cd.push(new Uint8Array([0x50,0x4b,1,2].concat(u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(off))),name);
    off+=lh.length+name.length+data.length; }
  let cdl=0; cd.forEach(x=>cdl+=x.length);
  const end=new Uint8Array([0x50,0x4b,5,6].concat(u16(0),u16(0),u16(files.length),u16(files.length),u32(cdl),u32(off),u16(0)));
  const all=parts.concat(cd,[end]); let len=0; all.forEach(x=>len+=x.length); const out=new Uint8Array(len); let p=0; all.forEach(x=>{ out.set(x,p); p+=x.length; }); return out; }
const xesc=s=>String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const colName=i=>{ let s=''; i++; while(i>0){ const m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=(i-m-1)/26; } return s; };
/* uslublar: 0 oddiy, 1 sarlavha, 2 butun son, 3 kasr son, 4 sana, 5 qalin matn, 6 qalin butun, 7 qalin kasr */
function xlsxBytes(sheets){ const used={}; sheets=sheets.map((s,i)=>{ let nm=String(s.name||('Jadval '+(i+1))).replace(/[\\\/\?\*\[\]:]/g,' ').slice(0,31).trim()||('Jadval '+(i+1)); let k=2; const base=nm; while(used[nm.toLowerCase()]) nm=base.slice(0,28)+' '+(k++); used[nm.toLowerCase()]=1; return Object.assign({},s,{name:nm}); });
  const sheetXml=s=>{ const nc=Math.max(s.heads.length,...s.rows.map(r=>r.length),1), w=new Array(nc).fill(8); const rows=[];
    const cell=(v,ci,ri,bold)=>{ const ref=colName(ci)+ri; if(v===''||v==null) return '';
      if(typeof v==='number'&&isFinite(v)){ const int=Number.isInteger(v); w[ci]=Math.max(w[ci],String(Math.round(Math.abs(v))).length*1.25+(int?2:5)); return `<c r="${ref}" s="${bold?(int?6:7):(int?2:3)}"><v>${v}</v></c>`; }
      if(v&&v.d){ w[ci]=Math.max(w[ci],11); return `<c r="${ref}" s="4"><v>${Math.round(Date.UTC(+v.d.slice(0,4),+v.d.slice(5,7)-1,+v.d.slice(8,10))/864e5)+25569}</v></c>`; }
      const t=String(v); w[ci]=Math.max(w[ci],Math.min(60,t.length+2)); return `<c r="${ref}" t="inlineStr" s="${bold?5:0}"><is><t xml:space="preserve">${xesc(t)}</t></is></c>`; };
    rows.push('<row r="1">'+s.heads.map((h,ci)=>{ w[ci]=Math.max(w[ci],Math.min(40,String(h).length+2)); return `<c r="${colName(ci)}1" t="inlineStr" s="1"><is><t xml:space="preserve">${xesc(h)}</t></is></c>`; }).join('')+'</row>');
    s.rows.forEach((r,ri)=>rows.push(`<row r="${ri+2}">`+r.map((v,ci)=>cell(v,ci,ri+2,!!r._b)).join('')+'</row>'));
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
      +'<cols>'+w.map((x,i)=>`<col min="${i+1}" max="${i+1}" width="${Math.min(60,Math.round(x*10)/10)}" customWidth="1"/>`).join('')+'</cols><sheetData>'+rows.join('')+'</sheetData>'
      +(s.rows.length?`<autoFilter ref="A1:${colName(nc-1)}${s.rows.length+1}"/>`:'')+'</worksheet>'; };
  const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="dd\\.mm\\.yyyy"/></numFmts>'
    +'<fonts count="2"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font></fonts>'
    +'<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDAEAF0"/><bgColor indexed="64"/></patternFill></fill></fills>'
    +'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    +'<cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'
    +'<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
    +'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="3" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/><xf numFmtId="4" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  const files=[['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
      +sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>'],
    ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>`<sheet name="${xesc(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+`<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml',styles]].concat(sheets.map((s,i)=>['xl/worksheets/sheet'+(i+1)+'.xml',sheetXml(s)]));
  return zipStore(files); }
const slug=s=>String(s).toLowerCase().replace(/[ʻ’'`]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40)||'jadval';
async function exportSheets(sheets,title){ const n=sheets.reduce((s,x)=>s+x.rows.length,0);
  if(!downloads){ await copyTsv(sheets[0]); return; }
  try{ const u8=xlsxBytes(sheets); await downloads.save({filename:'qum_'+slug(title)+'_'+ui.D+'.xlsx',data:new Blob([u8],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}); toast(`Excel fayl tayyor: ${sheets.length>1?sheets.length+' varaq, ':''}${fmt(n)} qator.`); }
  catch(e){ const c=e&&e.code; if(c==='declined') return; if(c==='rate_limited'){ toast("Oldingi yuklash oynasi hali ochiq — avval uni yoping."); return; }
    await copyTsv(sheets[0]); toast("Fayl yuklash bu ko'rinishda yopiq — jadval nusxalandi, Excelga qo'ying."); } }

/* =====================================================================
   4. MA'LUMOT QATLAMI (artifact db yoki xotira rejimi)
   Saqlash qoidalari — hech narsa jimgina yo'qolmasligi uchun:
   1) Mavjud hujjat hech qachon to'liq almashtirilmaydi: yozuv faqat qo'shib yoziladi (update). Yangi hujjat faqat u haqiqatan yo'qligi
      tekshirilgandan keyin va band qilingan holda ochiladi.
   2) Hujjat hajmi chegarasiga yetmaslik uchun har davr bo'laklarga bo'linadi (bitta bo'lakda ROWS_MAX tagacha yozuv).
   3) O'chirish — belgi qo'yish: yozuv bazada qoladi va Tarix bo'limidan tiklanadi.
   4) Har qo'shish, tahrir, o'chirish va tiklash alohida «log» to'plamiga yoziladi: kim, qachon, nima edi, nima bo'ldi.
   5) Baza to'liq yuklanmaguncha saqlash kutadi.
   ===================================================================== */
const JN=['reys','vagon','tex','mat','xar','inv','karyer'];   /* 'karyer' — eski versiya yozuvlari, faqat o'qiladi */
const ROWS_MAX=150, LOG_MAX=250, tabId=Math.random().toString(36).slice(2,8);
const store={docs:{},rows:{},dead:{},ready:{},cfg:JSON.parse(JSON.stringify(DEF)),cfgSaved:false,cfgRaw:null,ver:0};
JN.forEach(j=>{store.docs[j]={};store.rows[j]=[];store.dead[j]=[];});
let db=null,user=null,me={id:null},canWrite=true,canAdmin=true,mem=false,downloads=null;
function memDb(){ const data={}, subs=[];
  const fire=()=>subs.forEach(f=>f());
  const snapDoc=(p)=>({id:p.split('/').pop(),exists:!!data[p],data:()=>data[p]});
  const merge=(a,b)=>{ for(const k in b){ if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object') merge(a[k],b[k]); else a[k]=b[k]; } return a; };
  const doc=p=>({id:p.split('/').pop(),path:p,
    get:async()=>snapDoc(p), set:async d=>{data[p]=JSON.parse(JSON.stringify(d));fire();},
    update:async d=>{ if(!data[p]) throw {code:'invalid_argument',message:'no doc'}; merge(data[p],JSON.parse(JSON.stringify(d))); fire(); },
    delete:async()=>{delete data[p];fire();}, acquire:async()=>({acquired:true}),
    onSnapshot:(n)=>{ const f=()=>n(snapDoc(p)); subs.push(f); setTimeout(f,0); return ()=>{}; }});
  const coll=c=>{ const list=()=>Object.keys(data).filter(p=>p.startsWith(c+'/')&&p.slice(c.length+1).indexOf('/')<0).map(snapDoc);
    const q={ orderBy:()=>q, limit:()=>q, where:()=>q, doc:id=>doc(c+'/'+id), get:async()=>{ const docs=list(); return {docs,size:docs.length,empty:!docs.length}; },
    onSnapshot:(n)=>{ const f=()=>{ const docs=list(); n({docs,size:docs.length,empty:!docs.length}); }; subs.push(f); setTimeout(f,0); return ()=>{}; } }; return q; };
  return {doc,collection:coll,_data:data};
}
function mergeCfg(saved){ const c=JSON.parse(JSON.stringify(DEF)); if(!saved) return c;
  ['start','sapItem','tol'].forEach(k=>{ if(saved[k]!=null) c[k]=saved[k]; });
  if(saved.norms) Object.assign(c.norms,saved.norms);
  if(saved.wh) for(const k in c.wh) if(saved.wh[k]) Object.assign(c.wh[k],saved.wh[k]);
  if(c.wh.T01.name==="Yo'lda") Object.assign(c.wh.T01,{name:DEF.wh.T01.name,full:DEF.wh.T01.full});
  if(c.wh.S02.name==='Ziyovuddin'){ Object.assign(c.wh.S02,{name:DEF.wh.S02.name,full:DEF.wh.S02.full}); Object.assign(c.wh.T02,{name:DEF.wh.T02.name,full:DEF.wh.T02.full}); }      /* Ziyovuddin bir martalik bo'lgan: ikkinchi tarmoq stansiyasi — Samarqand */
  TW.forEach(T=>{ c.wh[T].open=null; c.wh[T].note=DEF.wh[T].note; });
  if(saved.norms){ const lg={karHajm:'K01',stHajm:'S01',chHajm:'C01'}; for(const k in lg) if(saved.norms[k]!=null&&!(saved.wh&&saved.wh[lg[k]]&&saved.wh[lg[k]].plan!=null)) c.wh[lg[k]].plan=saved.norms[k]; }
  if(saved.mats) for(const k in c.mats) if(saved.mats[k]) Object.assign(c.mats[k],saved.mats[k]);
  if(Array.isArray(saved.routes)) c.routes=c.routes.map(r=>{ const s=saved.routes.find(x=>x.code===r.code); return s?Object.assign(r,{type:s.type,tarif:s.tarif,km:s.km==null?null:s.km}):r; });
  if(Array.isArray(saved.suppliers)&&saved.suppliers.length) c.suppliers=saved.suppliers;
  if(Array.isArray(saved.machines)) c.machines=saved.machines;
  if(Array.isArray(saved.items)&&saved.items.length) c.items=saved.items.filter(it=>it.code!=='K-AMR'&&it.code!=='K-SOL').map(it=>{ it=Object.assign({},it);
    if(!it.plans){ it.plans={}; const L=linksOf(it.stage)[0]; if(it.plan!=null&&L) it.plans[L]=it.plan; } delete it.plan;
    if(it.code==='S-XIZ') it.nv='stXizmat'; return it; });
  DEF.items.forEach(it=>{ if((it.stage==='trans'||it.code==='K-AMO'||it.code==='S-UMM')&&!c.items.some(x=>x.code===it.code)) c.items.push(JSON.parse(JSON.stringify(it))); });
  return c; }
/* Jurnal qatorlari: tirik va o'chirilgan (belgilangan) yozuvlar alohida. Bir id ikki hujjatda uchrasa (davr o'zgargan paytdagi uzilish) — eng yangisi olinadi. */
function rebuild(j){ const live={}, dead=[]; const d=store.docs[j];
  for(const p in d){ const doc=d[p], rows=(doc&&doc.rows)||{}; for(const id in rows){ const r=rows[id]; if(!r) continue; const x=Object.assign({},r,{id,_p:p,_pp:doc.p||p});
      if(r._del){ if(!r._mv) dead.push(x); continue; } const o=live[id]; if(!o||(x.at||0)>=(o.at||0)) live[id]=x; } }
  store.rows[j]=Object.values(live); store.dead[j]=dead.filter(x=>!live[x.id]); store.ver++; }
const q={}; let pending=0, failed=0;
function setSync(){ const s=document.getElementById('sync'); if(!s) return;
  s.className='sync'+(mem||!canWrite||failed?' bad':'');
  s.textContent=mem?'Xotira rejimi — saqlanmaydi':(!canWrite?"Faqat ko'rish":(pending?'Saqlanmoqda…':(failed?'Oxirgi yozuv saqlanmadi':'Saqlangan'))); }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* Xavfsiz yozish: mavjud hujjatga faqat update; yo'q hujjat — band qilib, yo'qligi qayta tekshirilgach ochiladi. set() hech qachon mavjud hujjat ustidan chaqirilmaydi. */
async function safeMerge(coll,id,base,patch){ const ref=db.collection(coll).doc(id);
  let snap=await ref.get();
  if(snap.exists){ await ref.update(patch); return; }
  let leased=true; try{ const l=await ref.acquire({holder:(me.id||'anon')+':'+tabId,ttlMs:4000}); leased=!!(l&&l.acquired); }catch(e){ leased=true; }
  if(!leased) await sleep(700);
  snap=await ref.get();
  if(snap.exists){ await ref.update(Object.assign({},base,patch)); return; }
  await ref.set(Object.assign({},base,patch)); }
function writeDoc(j,docId,period,patch){ const key=j+'/'+docId;
  const run=async()=>{ const k=+(String(docId).split('_')[1]||1);
    if(store.docs[j][docId]){ try{ await db.collection(j).doc(docId).update({rows:patch}); return; }catch(e){ if(!(e&&e.code==='invalid_argument')) throw e; }
      const snap=await db.collection(j).doc(docId).get(); if(snap.exists) throw {code:'refused',message:'update refused on existing doc'}; }
    await safeMerge(j,docId,{p:period,k},{rows:patch});
    if(!store.docs[j][docId]) store.docs[j][docId]={p:period,k,rows:{}}; };
  pending++; setSync();
  const pr=(q[key]||Promise.resolve()).then(run,run);
  q[key]=pr.catch(()=>{});
  return pr.then(x=>{ failed=0; return x; },e=>{ failed=1; throw e; }).finally(()=>{pending--;setSync();}); }
/* Davr uchun bo'lak tanlash: joyi bor eng kichik bo'lak, bo'lmasa yangisi */
function pickDoc(j,period){ const ds=store.docs[j]; let max=0, pick=null;
  for(const id in ds){ const d=ds[id]; if(!d||(d.p||id)!==period) continue; const k=+(d.k||1); if(k>max) max=k; const n=d.rows?Object.keys(d.rows).length:0; if(n<ROWS_MAX&&(pick==null||k<pick.k)) pick={id,k}; }
  return pick?pick.id:period+'_'+(max+1); }
function errMsg(e){ const c=e&&e.code;
  if(c==='quota_exceeded') return "Baza to'lgan — eski davrlarni arxivlash kerak.";
  if(c==='invalid_argument'||c==='refused') return "Yozishga ruxsat yo'q yoki ma'lumot noto'g'ri. Yozuv saqlanmadi, boshqa yozuvlarga tegilmadi.";
  if(c==='revoked'||c==='not_granted') return "Ruxsat yopilgan — sahifani qayta oching.";
  if(c==='not_ready') return "Baza hali to'liq yuklanmadi — bir necha soniyadan keyin qayta saqlang.";
  return "Saqlanmadi. Aloqani tekshirib, qayta urinib ko'ring."; }
async function whenReady(j){ for(let i=0;i<40&&!store.ready[j];i++) await sleep(250); if(!store.ready[j]) throw {code:'not_ready'}; }
function fullRow(j,row){ const full={}; J[j].fields.forEach(f=>full[f.k]=row[f.k]==null?null:row[f.k]); full.at=row.at; full.by=row.by; full.rev=row.rev||1; full.demo=row.demo?1:null; full._del=null; full._mv=null; return full; }
/* ---- o'zgarishlar tarixi ---- */
const LOG={day:null,k:1,n:0,made:false};
const rowBrief=(j,row)=>{ const o={}; J[j].fields.forEach(f=>{ if(!f.hid&&row[f.k]!=null&&row[f.k]!=='') o[f.k]=row[f.k]; }); return o; };
function rowDiff(j,a,b){ const ch={}; J[j].fields.forEach(f=>{ if(f.hid) return; const x=a[f.k]==null?null:a[f.k], y=b[f.k]==null?null:b[f.k]; if(x!==y) ch[f.k]=[x,y]; }); return ch; }
async function logWrite(en){ try{ const day=new Date(Date.now()+5*36e5).toISOString().slice(0,10);
    if(LOG.day!==day){ LOG.day=day; LOG.k=1; LOG.n=0; LOG.made=false; } if(LOG.n>=LOG_MAX){ LOG.k++; LOG.n=0; LOG.made=false; }
    const id=day+'_'+tabId+'_'+LOG.k, ref=db.collection('log').doc(id), eid=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    const body=Object.assign({t:Date.now(),by:me.id||null},en);
    if(LOG.made) await ref.update({e:{[eid]:body}}); else { await safeMerge('log',id,{d:day,u:me.id||null},{e:{[eid]:body}}); LOG.made=true; }
    LOG.n++; ui.hist=null;
  }catch(e){ console.error('log',e); toast("Yozuv saqlandi, lekin tarixga yozib bo'lmadi."); } }
async function saveRow(j,row,prev){ await whenReady(j); const period=J[j].period(row), now=Date.now(); row.at=now; row.by=me.id||null; row.rev=((prev&&prev.rev)||0)+1;
  const docId=(prev&&prev._pp===period)?prev._p:pickDoc(j,period);
  await writeDoc(j,docId,period,{[row.id]:fullRow(j,row)});
  if(prev&&prev._p!==docId){ try{ await writeDoc(j,prev._p,prev._pp,{[prev.id]:{_del:1,_mv:docId,dat:now,dby:me.id||null}}); }catch(e){ console.error(e); toast("Yozuv yangi davrga saqlandi; eski davrdagi nusxasi qoldi — Tarix bo'limida tekshiring."); } }
  if(prev) logWrite({j,id:row.id,op:'edit',d:J[j].date(row)||null,ch:rowDiff(j,prev,row)}); else logWrite({j,id:row.id,op:'add',d:J[j].date(row)||null,row:rowBrief(j,row)}); }
async function delRow(j,row){ await whenReady(j); await writeDoc(j,row._p,row._pp,{[row.id]:{_del:1,dat:Date.now(),dby:me.id||null}}); logWrite({j,id:row.id,op:'del',d:J[j].date(row)||null,row:rowBrief(j,row)}); }
async function restoreRow(j,row){ await whenReady(j); await writeDoc(j,row._p,row._pp,{[row.id]:{_del:null,dat:null,dby:null,at:Date.now(),by:me.id||null}}); logWrite({j,id:row.id,op:'restore',d:J[j].date(row)||null,row:rowBrief(j,row)}); }
/* Ko'p yozuvni birdan yozish (namuna, import): bo'laklarga taqsimlab */
async function saveMany(j,rows){ await whenReady(j); const by={}, cnt={};
  for(const r of rows){ const period=J[j].period(r); let docId=null;
    for(let k=1;;k++){ const id=period+'_'+k, d=store.docs[j][id], have=(d&&d.rows?Object.keys(d.rows).length:0)+(cnt[id]||0); if(have<ROWS_MAX){ docId=id; break; } }
    cnt[docId]=(cnt[docId]||0)+1; (by[docId]||(by[docId]={period,rows:{}})).rows[r.id]=fullRow(j,r); }
  for(const id in by) await writeDoc(j,id,by[id].period,by[id].rows); }

/* =====================================================================
   5. JURNALLAR TA'RIFI
   ===================================================================== */
const optsLk=ls=>ls.map(k=>[k,E.whName(store.cfg,k)]);
const optsMc=()=>store.cfg.machines.map(m=>[m.code,m.name]);
const isTk=v=>E.isTruck(store.cfg,v.mc);
const isKr=v=>{ const r=E.route(store.cfg,v.m); return !!r&&r.to===OTV; };
/* Texnika shakli: isA — bak o'lchovi yozuvi; nOn — shu sanada norma usuli amalda (dizel quyilmagan kun ham, faqat quyilgan kun ham yozilishi mumkin) */
const isA=v=>!isTk(v)&&v.op==='A', bakTk=v=>isTk(v)&&pnum(v.bak)!=null, nOnV=v=>tankOnAt(v.mc,v.d), fuelOnly=v=>nOnV(v)&&pnum(v.l)>0;
const J={
  reys:{title:'Reyslar',sub:"Har bir mashina — bitta qator. Vaznni tarozi chiptasidan kg da kiriting. Tashqi logistikada reysga belgilangan summa (marshrut tarifi yoki alohida tarif) olinadi. O'z transportida summa kiritilmaydi: mashinaning dizeli, amortizatsiyasi va haydovchi ish haqi reyslarga taqsimlanadi.",
    period:r=>r.d.slice(0,7),date:r=>r.d,
    fields:[{k:'d',l:'Sana',t:'date',req:1,keep:1},
      {k:'m',l:'Marshrut',t:'sel',req:1,keep:1,opts:()=>store.cfg.routes.map(r=>[r.code,E.rtName(store.cfg,r)])},
      {k:'rn',l:'Reys soni',t:'num',reqIf:isKr,hint:"Shu qatorda nechta reys. Krisha uchun: kun bo'yi tashilgan reyslar soni"},
      {k:'s',l:'Qum manbai',t:'sel',keep:1,show:v=>!isKr(v),opts:()=>store.cfg.suppliers.map(s=>[s.code,s.name])},
      {k:'tk',l:'Kim tashidi',t:'sel',keep:1,noBlank:1,opts:()=>[['','Tashqi logistika']].concat(E.trucks(store.cfg).map(m=>[m.code,"O'z transporti: "+m.name]))},
      {k:'a',l:'Mashina raqami',t:'text',ph:'40 020 MCA',show:v=>!v.tk},
      {k:'c',l:'Tashuvchi firma',t:'text',keep:1,show:v=>!v.tk},
      {k:'wj',l:"Jo'natishdagi vazn, kg",t:'num',show:v=>!isKr(v)},
      {k:'wq',l:'Qabuldagi vazn (tarozi), kg',t:'num',hint:"Krisha reyslarida bo'sh qoldirilsa: reys soni × reys hajmi (m³) × zichlik"},
      {k:'t',l:"Tashuv tarifi, so'm",t:'num',show:v=>!v.tk,hint:"Reys uchun yoki 1 kg uchun — marshrut turiga qarab. Bo'sh qoldirilsa marshrutning joriy tarifi yozib qo'yiladi va keyin o'zgarmaydi"},
      {k:'sp',l:"Qum narxi, so'm/kg",t:'num',show:v=>{ const r=E.route(store.cfg,v.m); return !!r&&r.from==='TASHQI'; },hint:"Bo'sh qoldirilsa ta'minotchining joriy narxi yozib qo'yiladi"},{k:'tt',hid:1},
      {k:'doc',l:'TTN №',t:'text'},{k:'n',l:'Izoh',t:'text'}]},
  vagon:{title:'Vagonlar',sub:"Bitta vagon — bitta qator: yuklangan kuni ochiladi, Chustga kelganda va tushirilganda to'ldiriladi. Vagon — alohida ombor: yuklangan qum stansiyadan chiqadi, lekin Chust omboriga faqat «Tushirilgan sana» kiritilgandan keyin kiradi. Fakt summa kiritilmaguncha xarajat norma bo'yicha hisoblanadi.",
    period:r=>(r.dy||r.dk||r.dt||'0000-00').slice(0,7),date:r=>r.dy||r.dk||r.dt,
    fields:[{k:'no',l:'Vagon №',t:'text',req:1},{k:'nak',l:'Nakladnoy №',t:'text'},
      {k:'src',l:'Qayerdan',t:'sel',req:1,keep:1,opts:()=>[['S01',store.cfg.wh.S01.name],['S02',store.cfg.wh.S02.name],['TASHQI',"Ta'minotchidan (tashqi)"]]},
      {k:'s',l:"Ta'minotchi",t:'sel',show:v=>v.src==='TASHQI',opts:()=>store.cfg.suppliers.filter(s=>s.price>0).map(s=>[s.code,s.name])},
      {k:'sp',l:"Qum narxi, so'm/kg",t:'num',show:v=>v.src==='TASHQI',hint:"Bo'sh qoldirilsa ta'minotchining joriy narxi yozib qo'yiladi"},
      {k:'dy',l:'Yuklangan sana',t:'date',keep:1,hint:"Tizim boshlanishidan oldin yuklangan, hali tushirilmagan vagonni ham haqiqiy sanasi bilan kiriting — u vagon omborining boshlang'ich qoldig'i bo'ladi"},{k:'kg',l:'Nakladnoy vazni, kg',t:'num',req:1},
      {k:'ty',l:"Temir yo'l tarifi (fakt), so'm",t:'num'},
      {k:'dk',l:'Chustga kelgan sana',t:'date',hint:"Vagon Chust stansiyasiga yetib kelgan kun. Tushirilmaguncha qum vagon omborida qoladi"},{k:'dt',l:'Tushirilgan sana',t:'date',hint:"Shu kundan qum Chust ombori qoldig'iga kiradi"},
      {k:'pod',l:"Qo'qon TexPD podacha (fakt), so'm",t:'num'},{k:'gu',l:"GU-46 jarima, so'm",t:'num'},
      {k:'tush',l:"Tushirish xizmati (fakt), so'm",t:'num'},{k:'n',l:'Izoh',t:'text'}]},
  tex:{title:'Texnika',sub:"Karyerda ikki xil yozuv bor. «Qum qazildi (miqdor)» — shu kuni qazilgan qum, kg: karyer omboriga kirim bo'ladi. «Karyer ishi» — har ekskavator va pogruzchikning shu kungi jami moto-soati va dizeli: xarajatni krisha ochish, qum qazish va qum yuklash o'rtasida tizim shu kungi tonnaga mutanosib bo'ladi (krisha miqdori — Reyslar jurnalidagi krisha reyslaridan, yuklangan qum — karyerdan chiqqan reyslardan olinadi). Ishni alohida ko'rsatish kerak bo'lsa — «Qum yuklash», «Krisha ochish», «Boshqa ish». Yuk mashinasi: yurgan km va dizel. Dizel — shu kuni bakka QUYILGAN litr: u ombordan shu yerdan chiqadi, Materiallarda takror kiritmang. Normasi bor texnikaning baki bir marta o'lchangach («Bak o'lchandi»), sarf norma bo'yicha hisoblanadi (moto-soat × norma), quyilgan dizel esa bakda turadi; keyingi har o'lchovda hisobdagi va o'lchangan qoldiq farqi «dizel og'ishi» bo'lib chiqadi.",
    period:r=>r.d.slice(0,7),date:r=>r.d,
    fields:[{k:'d',l:'Sana',t:'date',req:1,keep:1},
      {k:'mc',l:'Texnika',t:'sel',reqIf:v=>v.op!=='Q',keep:1,opts:optsMc,on:v=>{ const m=E.mc(store.cfg,v.mc); if(m&&m.type!=='T'){ v.loc=m.loc; if(v.op!=='A') v.op=stageOf(m.loc)==='karyer'?'U':'Y'; } }},
      {k:'loc',l:"Bo'g'in",t:'sel',req:1,keep:1,show:v=>!isTk(v)&&!isA(v),opts:()=>optsLk(LINKS)},
      {k:'op',l:'Ish turi',t:'sel',req:1,keep:1,show:v=>!isTk(v),opts:()=>Object.keys(OPS).map(k=>[k,OPS[k]])},
      {k:'mh',l:'Moto-soat',t:'num',show:v=>!isTk(v)&&!isA(v),reqIf:v=>!isTk(v)&&v.op!=='Q'&&!isA(v)&&!fuelOnly(v)},
      {k:'km',l:'Yurgan masofa, km',t:'num',show:isTk,reqIf:v=>isTk(v)&&!bakTk(v)&&!fuelOnly(v)},
      {k:'mr',l:"Hisoblagich ko'rsatkichi, kun oxiri",t:'num',show:v=>!isA(v),hint:"Kiritilsa, moto-soat yoki km oldingi ko'rsatkich bilan solishtiriladi"},
      {k:'l',l:'Quyilgan dizel, l',t:'num',show:v=>!isA(v),reqIf:v=>(v.op!=='Q'||isTk(v))&&!isA(v)&&!bakTk(v)&&!nOnV(v),dhint:v=>(v.op==='Q'&&!isTk(v)&&!v.mc)?'':tankHint(v)},
      {k:'kg',l:'Ish hajmi, kg',t:'num',show:v=>!isTk(v)&&v.op!=='B'&&v.op!=='U'&&v.op!=='A',reqIf:v=>!isTk(v)&&(v.op==='Q'||v.op==='Y'),hint:"«Qum qazildi» — qazilgan qum, kg. Krisha ochishda bo'sh qoldirilsa, shu kungi krisha reyslari hajmi olinadi"},
      {k:'bak',l:"Bakdagi dizel (o'lchov), l",t:'num',show:v=>isA(v)||isTk(v),reqIf:isA,dhint:v=>(isA(v)||bakTk(v))?bakHint(v):(isTk(v)?"Faqat bak o'lchangan kuni, alohida yozuvda to'ldiriladi (km va dizel bo'sh qoladi).":'')},
      {k:'who',l:'Operator / haydovchi',t:'text',keep:1},{k:'n',l:'Izoh',t:'text'},{k:'ar',hid:1},{k:'nl',hid:1}]},
  mat:{title:'Materiallar',sub:"Dizel, sim va plyonka ombori: kirim narxi bilan, texnikadan tashqari sarf bo'g'ini bilan. Sarf shu kundagi o'rtacha kirim narxida xarajatga o'tadi.",
    period:r=>r.d.slice(0,7),date:r=>r.d,
    fields:[{k:'d',l:'Sana',t:'date',req:1,keep:1},
      {k:'it',l:'Material',t:'sel',req:1,keep:1,opts:()=>Object.keys(store.cfg.mats).map(k=>[k,store.cfg.mats[k].name+', '+store.cfg.mats[k].unit])},
      {k:'op',l:'Amal',t:'sel',req:1,keep:1,opts:()=>[['S','Sarf'],['K','Kirim']]},
      {k:'q',l:'Miqdor',t:'num',req:1},
      {k:'p',l:"Narx, so'm (kirimda)",t:'num',show:v=>v.op==='K',reqIf:v=>v.op==='K'},
      {k:'st',l:"Bo'g'in (sarfda)",t:'sel',show:v=>v.op!=='K',reqIf:v=>v.op!=='K',keep:1,opts:()=>optsLk(LINKS)},
      {k:'sk',l:'Qaysi joy ombori (kirimda)',t:'sel',show:v=>v.op==='K',keep:1,opts:()=>SITES.filter(x=>x[2].length).map(x=>[x[0],x[1]]),hint:"Tanlansa, shu joyning sarfi o'z omboridan, o'z narxida chiqadi"},
      {k:'n',l:"Ta'minotchi / izoh",t:'text'}]},
  xar:{title:'Xarajatlar',sub:"Korporativ karta, naqd va bank xarajatlari. Har biri bo'g'inga, kerak bo'lsa texnikaga biriktiriladi. Haydovchi ish haqi va yuk mashinasi ta'miri «O'z transporti» moddalariga yoziladi — karyerga emas. Summa faqat raqam sifatida qabul qilinadi.",
    period:r=>r.d.slice(0,7),date:r=>r.d,
    fields:[{k:'d',l:'Sana',t:'date',req:1,keep:1},
      {k:'it',l:'Xarajat moddasi',t:'sel',req:1,keep:1,opts:()=>store.cfg.items.map(i=>[i.code,SN[i.stage]+': '+i.name])},
      {k:'lk',l:"Bo'g'in",t:'sel',req:1,keep:1,dyn:1,opts:v=>{ const it=store.cfg.items.find(i=>i.code===v.it); return optsLk(it?linksOf(it.stage):LINKS); }},
      {k:'mc',l:'Texnika (agar tegishli)',t:'sel',dyn:1,opts:v=>{ const it=store.cfg.items.find(i=>i.code===v.it), tr=it&&it.stage==='trans'; return store.cfg.machines.filter(m=>(m.type==='T')===!!tr).map(m=>[m.code,m.name]); }},
      {k:'sum',l:"Summa, so'm",t:'num',req:1},
      {k:'pay',l:"To'lov turi",t:'sel',req:1,keep:1,opts:()=>[['Karta','Korporativ karta'],['Naqd','Naqd'],['Bank','Bank']]},
      {k:'who',l:"Kim sarfladi",t:'text',keep:1},{k:'doc',l:'Chek / hujjat №',t:'text'},{k:'n',l:'Izoh',t:'text'},{k:'sh',hid:1}]},
  inv:{title:'Inventarizatsiya',sub:"Haqiqiy o'lchov natijasi. Kiritilgan kundan boshlab hisobdagi qoldiq haqiqiysiga tenglashadi. Kamomad o'rtacha tan narxda zararga chiqariladi; ortiqcha qiymatsiz kirim bo'ladi.",
    period:r=>'Y'+r.d.slice(0,4),date:r=>r.d,
    fields:[{k:'d',l:'Sana',t:'date',req:1},{k:'wh',l:'Ombor',t:'sel',req:1,opts:()=>optsLk(LINKS)},
      {k:'kg',l:'Haqiqiy qoldiq, kg',t:'num',req:1},{k:'n',l:'Izoh',t:'text'}]}
};
const TABS=[['kir','Kiritish',0],['my','Mening uchastkam',0],['map','Xarita',0],['panel','Panel',0],['rep','Hisobot',0],['reys','Reyslar',1],['vagon','Vagonlar',1],['tex','Texnika',1],['mat','Materiallar',1],['xar','Xarajatlar',1],['inv','Inventarizatsiya',1],['tah','Tahlil',2],['tan','Tan narx',2],['aud','Audit',2],['hist','Tarix',2],['norm','Normativlar',3],['sap','SAP',3]];

/* =====================================================================
   6. UI HOLATI
   ===================================================================== */
const today=new Date(Date.now()+5*36e5).toISOString().slice(0,10);
const ui={op:{site:null,task:null},mapPause:false,mapSel:'K01',mapScope:'oy',mapFrom:null,mapTo:null,tab:'map',D:today,form:{},scope:{},flt:{},rep:{type:'zanjir',sc:'oy',grp:'kun',wh:'C01',from:null,to:null,f:{}},hist:null,histF:{},cfgDraft:null,sap:'transfer',del:null,tahScope:'oy',tahLink:'',my:{site:null,scope:'oy',from:null,to:null,veh:'',only:false}};
let C=null;
let CK=null;
/* Hisob konteksti keshlanadi: ma'lumot, sozlama yoki sana o'zgarmaguncha qayta hisoblanmaydi */
function ctx(){ const end=(ui.tab==='map'&&ui.mapScope==='ora'&&ui.mapTo&&ui.mapTo>ui.D)?ui.mapTo:ui.D, k=store.ver+'|'+ui.D+'|'+end; if(C&&CK===k) return C; C=E.ctx(store.cfg,store.rows,ui.D,end); CK=k; return C; }
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
const segBtn=(opts,cur,on,label)=>el('div',{class:'seg',role:'group','aria-label':label||'Davr'},opts.map(s=>el('button',{type:'button','aria-pressed':String(cur===s[0]),onclick:()=>on(s[0])},s[1])));
function causeList(top){ return top.length?el('ul',{class:'alerts'},top.map(x=>el('li',null,el('span',{class:'num',style:'min-width:9ch;text-align:right;font-weight:600'},'+'+fm(x.e.dsum)+' mln'),
  el('span',null,el('b',null,x.lk.name+' · '+x.e.name),' — ',x.e.cause||'normadan yuqori',el('span',{class:'muted num'},` (fakt ${fmt(x.e.rate,2)}, norma ${fmt(x.e.norm,2)} so'm/kg)`))))):el('div',{class:'empty'},"Normadan oshgan element yo'q."); }
function texTable(c,rep,withMoney){
  const heads=[['Texnika'],["Bo'g'in"],['Moto-soat','r'],['Quyildi, l','r'],['Sarf, l','r'],['Bak hisobda, l','r'],['l/m-s fakt','r'],['norma','r'],['Ortiqcha dizel, l','r'],['Hajm, t','r'],['t/m-s fakt','r'],['norma','r'],['Kam bajarilgan, t','r']];
  if(withMoney) heads.push(["Dizel, so'm",'r'],["Amortizatsiya, so'm",'r'],["Ta'mir, so'm",'r']);
  heads.push(["so'm/t fakt",'r'],['norma','r'],['Holat']);
  const rows=rep.map(x=>{ const tol=c.cfg.tol; let st;
    if(!x.has) st=chip('warn',"Norma yo'q"); else if(!x.mh) st=chip('na','Ishlamagan');
    else { const a=E.status(x.lmh,x.nL,'low',tol), b=E.status(x.tmh,x.nT,'high',tol); const rk={ok:0,na:0,warn:1,bad:2}; const worst=rk[a[0]]>=rk[b[0]]?a:b;
      st=chip(worst[0],worst[0]==='ok'?'✓ Normada':(worst===a?'Dizel: ':'Unum: ')+worst[1]); }
    const cells=[x.m.name,E.whName(c.cfg,x.m.loc),fmt(x.mh,1),fmt(x.l,0),fmt(x.cons,0),(x.tank&&x.tank.on)?fmt(x.tank.q,0):'—',x.lmh==null?'—':fmt(x.lmh,1),x.nL==null?'—':fmt(x.nL,1),x.overL==null||!(x.mh||x.auds)?'—':fs(x.overL,0),ft(x.kgW),x.tmh==null?'—':fmt(x.tmh,1),x.nT==null?'—':fmt(x.nT,1),x.shortT==null||!x.mh?'—':fs(x.shortT,1)];
    if(withMoney) cells.push(fmt(x.dz),fmt(x.am),x.rep?fmt(x.rep):'—');
    cells.push(x.perT==null?'—':fmt(x.perT,0),x.normPerT==null?'—':fmt(x.normPerT,0),st); return cells; });
  return table(heads,rows); }


function truckTable(c,rep){ if(!rep.length) return null;
  return table([['Yuk mashinasi'],['Km','r'],['Quyildi, l','r'],['Sarf, l','r'],['Bak hisobda, l','r'],['l/100 km','r'],['norma','r'],['Ortiqcha, l','r'],["O'z reyslari",'r'],['Tashildi, t','r'],['Dizel, mln','r'],['Amortizatsiya, mln','r'],['Ish haqi, mln','r'],['Boshqa, mln','r'],['Jami tannarx, mln','r'],["so'm/reys",'r'],["Tashqi tarif, so'm/reys",'r'],['Farq','r'],["so'm/kg",'r'],['Holat']],
    rep.map(x=>{ const df=x.perTrip!=null&&x.extTrip!=null?x.perTrip-x.extTrip:null; let st;
      if(!x.n&&(x.dz+x.am)>0.5) st=chip('bad','Reys yo\'q'); else if(!x.n) st=chip('na','Ishlamagan'); else if(x.nL==null) st=chip('warn',"Norma yo'q");
      else { const a=E.status(x.l100,x.nL,'low',c.cfg.tol); st=a[0]==='ok'?(df>0?chip('warn','Tashqidan qimmat'):chip('ok','✓ Tashqidan arzon')):chip(a[0],'Dizel: '+a[1]); }
      return [x.m.name,fmt(x.km,0),fmt(x.l,0),fmt(x.cons,0),(x.tank&&x.tank.on)?fmt(x.tank.q,0):'—',x.l100==null?'—':fmt(x.l100,1),x.nL==null?'—':fmt(x.nL,1),x.overL==null?'—':fs(x.overL,0),x.n,ft(x.kg),fm(x.pdz),fm(x.pam),fm(x.plab),fm(x.poth),fm(x.cost),x.perTrip==null?'—':fmt(x.perTrip),x.extTrip==null?'—':fmt(x.extTrip),df==null?'—':fs(df,0),x.perKg==null?'—':fmt(x.perKg,2),st]; })); }
/* ---------- Xarita: izometrik zanjir ---------- */
const MAPN=[['K01',1],['A1',2],['S01',3],['W1',4],['K02',5],['A2',6],['S02',7],['W2',8],['C01',9],['avtoZav',10],['Z01',11],['togri',12]];
const SVGNS='http://www.w3.org/2000/svg';
function sv(tag,attrs,...kids){ const e=document.createElementNS(SVGNS,tag); for(const k in attrs||{}){ if(attrs[k]!=null&&attrs[k]!==false) e.setAttribute(k,attrs[k]); } kids.flat(Infinity).forEach(k=>{ if(k!=null&&k!==false) e.append(k.nodeType?k:document.createTextNode(String(k))); }); return e; }
function mapRange(){ const D=ui.D, s=ui.mapScope; if(s==='kun') return [D,D]; if(s==='yil') return [D.slice(0,4)+'-01-01',D];
  if(s==='ora'){ let a=ui.mapFrom||E.ms(D), b=ui.mapTo||D; if(a>b){ const t=a; a=b; b=t; } return [a,b]; } return [E.ms(D),D]; }
function isoScene(info,sel,pick){
  const A=27,B=15.6,H=20,OX=40,OY=500;
  const P=(u,v,z)=>[OX+(u+v)*A, OY+(v-u)*B-(z||0)*H];
  const pts=a=>a.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const poly=(a,cls)=>sv('polygon',{points:pts(a),class:cls});
  const box=(u,v,z,du,dv,dz,k)=>{ const u1=u+du,v1=v+dv,z1=z+dz; return [poly([P(u,v,z),P(u,v1,z),P(u,v1,z1),P(u,v,z1)],k+'l'),poly([P(u,v1,z),P(u1,v1,z),P(u1,v1,z1),P(u,v1,z1)],k+'r'),poly([P(u,v,z1),P(u1,v,z1),P(u1,v1,z1),P(u,v1,z1)],k+'t')]; };
  const top=(u,v,z,du,dv,cls)=>poly([P(u,v,z),P(u+du,v,z),P(u+du,v+dv,z),P(u,v+dv,z)],cls);
  const pile=(u,v,r,h)=>{ const ap=P(u,v,h); return [poly([P(u-r,v-r),P(u-r,v+r),ap],'sl'),poly([P(u-r,v+r),P(u+r,v+r),ap],'sr')]; };
  const wh=(u,v)=>{ const p=P(u,v,.13); return sv('ellipse',{cx:p[0].toFixed(1),cy:p[1].toFixed(1),rx:4,ry:4.6,class:'dk'}); };
  const truckU=(u,v)=>[box(u+1,v,.18,.42,.6,.6,'w'),box(u,v,.18,.95,.6,.4,'b'),top(u+.07,v+.07,.6,.81,.46,'st'),wh(u+.2,v+.6),wh(u+.72,v+.6),wh(u+1.22,v+.6)];
  const truckV=(u,v)=>[box(u,v,.18,.6,.95,.4,'b'),top(u+.07,v+.07,.6,.46,.81,'st'),box(u,v+1,.18,.6,.42,.6,'w'),wh(u,v+.2),wh(u,v+.72),wh(u,v+1.22)];
  const wagon=(u,v)=>[box(u,v,.22,1.5,.9,.6,'d'),top(u+.08,v+.08,.84,1.34,.74,'st'),wh(u+.25,v+.9),wh(u+1.25,v+.9)];
  const line=(a,cls)=>sv('polyline',{points:pts(a),class:cls,fill:'none'});
  /* harakat: du, dv — izometrik o'qlar bo'yicha siljish */
  const live=id=>!!info[id].live, idle=kids=>sv('g',{class:'idle'},kids);
  const mv=(du,dv,dur,frac,kids)=>sv('g',{class:'mv',style:`--dx:${((du+dv)*A).toFixed(1)}px;--dy:${((dv-du)*B).toFixed(1)}px;animation-duration:${dur}s;animation-delay:${(-dur*frac).toFixed(2)}s`},kids);
  const shut=(du,dv,dur,kids,on)=>sv('g',{class:on?'shut':'',style:`--dx:${((du+dv)*A).toFixed(1)}px;--dy:${((dv-du)*B).toFixed(1)}px;animation-duration:${dur}s`},kids);
  const exc=(u,v,dl,on)=>{ const o=P(u+.25,v+.35,.8); return [box(u,v,.05,.9,.7,.28,'d'),box(u+.12,v+.08,.33,.66,.54,.45,'b'),box(u+.45,v+.12,.78,.3,.3,.3,'w'),
    sv('g',{class:on?'dig':'',style:`transform-origin:${o[0].toFixed(1)}px ${o[1].toFixed(1)}px;animation-delay:${dl||0}s`},line([P(u+.25,v+.35,.8),P(u-.35,v+.35,1.55),P(u-.8,v+.35,.55)],'arm'),poly([P(u-.95,v+.2,.55),P(u-.65,v+.2,.55),P(u-.7,v+.5,.25),P(u-.95,v+.5,.3)],'dr'))]; };
  const loader=(u,v)=>[box(u,v,.12,.75,.55,.38,'b'),box(u+.4,v+.1,.5,.3,.35,.3,'w'),box(u-.3,v+.02,.12,.26,.5,.28,'d'),wh(u+.15,v+.55),wh(u+.6,v+.55)];
  const quarry=(u,v,dl,on)=>[box(u+.3,v+.5,0,3.2,3,.45,'s'),box(u+.8,v+1,.45,2.3,2.1,.45,'s'),box(u+1.3,v+1.5,.9,1.4,1.2,.45,'s'),exc(u+4.3,v+.7,dl,on),pile(u+4.9,v+2.9,.75,1.1),shut(-.5,0,3.6,loader(u+3.9,v+2.9),on)];
  const station=(u,v,on)=>[top(u,v,0,4.5,4,'fl'),box(u+.5,v+.4,0,2,1.6,1.3,'b'),top(u+.4,v+.3,1.3,2.2,1.8,'wt'),pile(u+3.1,v+2.6,1.2,1.7),pile(u+1.5,v+3.2,.6,.8),shut(0,-.6,4.2,loader(u+3.4,v+1),on)];
  const rails=(u,v,len)=>{ const t=[]; for(let x=u+.4;x<u+len;x+=.8) t.push(line([P(x,v-.4),P(x,v+.4)],'tie')); return [top(u,v-.6,0,len,1.2,'rd'),t,line([P(u,v-.25),P(u+len,v-.25)],'rail'),line([P(u,v+.25),P(u+len,v+.25)],'rail')]; };
  const mk=(id,cls,kids)=>{ const i=info[id]; const e=sv('g',{class:'zn '+cls+(sel===id?' on':''),role:'button',tabindex:cls==='cal'?0:-1,'aria-label':i.n+'. '+i.title+'. '+i.lines.join('. '),'data-id':id},kids);
    e.addEventListener('click',()=>pick(id)); e.addEventListener('keydown',ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); pick(id); } }); return e; };
  const g=(id,...kids)=>mk(id,'obj',kids);
  const call=(id,x,y,ap)=>{ const i=info[id]; const w=Math.max(150,Math.max(i.title.length*7.6,...i.lines.map(s=>s.length*6.2))+46), h=22+i.lines.length*15+8;
    return mk(id,'cal',[sv('line',{x1:x+20,y1:y+h/2,x2:ap[0].toFixed(1),y2:ap[1].toFixed(1),class:'ld'}),sv('circle',{cx:ap[0].toFixed(1),cy:ap[1].toFixed(1),r:3,class:'ldp'}),sv('rect',{x,y,width:w.toFixed(0),height:h,rx:7,class:'co'}),
      sv('circle',{cx:x+18,cy:y+18,r:12,class:'mk'}),sv('text',{x:x+18,y:y+22.5,class:'mkt','text-anchor':'middle'},i.n),
      sv('text',{x:x+38,y:y+20,class:'ct'},i.title),i.lines.map((s,k)=>sv('text',{x:x+38,y:y+36+k*15,class:'cl'},s))]); };
  const s=sv('svg',{viewBox:'0 0 1340 730',role:'group','aria-label':"Qum zanjiri xaritasi: Mayskiy karyeridan Bo'zsuv, Samarqand karyeridan o'z stansiyasi orqali vagonda Chustga, u yerdan Megaton zavodiga"});
  const sm=P(24.92,13.72,3.5);
  s.append(...[
    top(6,.6,0,3.5,1.2,'rd'),top(7.5,8.6,0,3,1.2,'rd'),top(22.4,10.5,0,1.2,2.5,'rd'),rails(14,1,7),rails(15,9,6),
    line([P(5,11),P(5,17.5),P(21,17.5)],'dash'+(live('togri')?' run':'')),
    /* 9: Chust */
    g('C01',top(21,-.5,0,4,11,'fl'),box(24,-.1,0,.8,.8,.8,'w'),pile(23,1.6,1.2,1.6),pile(22.9,5,1.3,1.8),pile(23,8.6,1.1,1.5),shut(0,1.4,5,loader(22,2.9),live('C01')),shut(0,-1.2,4.4,loader(22,7.3),live('C01'))),
    /* 4: vagonlar Bo'zsuv → Chust */
    g('W1',live('W1')?[0,1/3,2/3].map(f=>mv(5.3,0,15,f,wagon(14.1,.55))):[]),
    /* 3: Bo'zsuv */
    g('S01',station(9.5,-1,live('S01'))),
    /* 2: Mayskiy → Bo'zsuv */
    g('A1',live('A1')?[0,.5].map(f=>mv(2.1,0,7,f,truckU(6,.9))):idle(truckU(7,.9))),
    /* 1: Mayskiy */
    g('K01',top(0,-1,0,6,4,'fl'),quarry(0,-1,0,live('K01'))),
    /* 8: vagonlar Samarqand st. → Chust */
    g('W2',live('W2')?[0,1/3,2/3].map(f=>mv(4.3,0,13,f,wagon(15.1,8.55))):[]),
    /* 10: Chust → Megaton */
    g('avtoZav',live('avtoZav')?[0,.5].map(f=>mv(0,1.05,5,f,truckV(22.7,10.5))):idle(truckV(22.7,11))),
    /* 7: Samarqand stansiyasi */
    g('S02',station(10.5,7,live('S02'))),
    /* 6: Samarqand karyeri → stansiya */
    g('A2',live('A2')?[0,.5].map(f=>mv(1.6,0,6,f,truckU(7.5,8.9))):idle(truckU(8.3,8.9))),
    /* 11: Megaton */
    g('Z01',top(21,13,0,5,5,'fl'),box(24.7,13.5,0,.45,.45,3.4,'w'),
      live('Z01')?[0,1,2].map(k=>sv('circle',{cx:sm[0].toFixed(1),cy:sm[1].toFixed(1),r:7,class:'smk',style:`animation-delay:${-k*1.4}s`})):[],
      box(21.6,13.6,0,3,2.8,1.7,'b'),top(21.5,13.5,1.7,3.2,3,'wt'),box(22,14,1.7,2.2,.7,.4,'b'),box(22,15.2,1.7,2.2,.7,.4,'b'),
      poly([P(22.4,16.4,0),P(23.3,16.4,0),P(23.3,16.4,1),P(22.4,16.4,1)],'dr'),
      box(25,16.9,0,.5,.5,.35,'w'),box(25,17.5,0,.5,.5,.35,'w'),box(24.4,17.2,0,.5,.5,.35,'w'),box(25,17.2,.35,.5,.5,.35,'w')),
    /* 5: Samarqand */
    g('K02',top(1.5,7,0,6,4,'fl'),quarry(1.5,7,-1.5,live('K02'))),
    /* 12: avto to'g'ridan */
    g('togri',live('togri')?mv(12,0,18,.2,truckU(7,17.2)):idle(truckU(12.3,17.2))),
    call('C01',640,20,P(23,1.6,1.6)),call('W1',540,290,P(17.5,1.3,.3)),call('S01',300,150,P(11.5,.5,1.4)),call('A1',150,226,P(7.75,1.2,.2)),call('K01',14,322,P(2.2,.6,1.4)),
    call('W2',790,402,P(18,9.3,.3)),call('avtoZav',1030,170,P(23,11.7,.3)),call('S02',690,470,P(13.6,9.6,1)),call('A2',550,566,P(9,9.2,.2)),call('Z01',1110,470,P(24.5,17,.2)),
    call('K02',40,612,P(3.7,8.6,1.4)),call('togri',880,600,P(13,17.5,.3))
  ].flat(Infinity).filter(Boolean));
  return s; }
/* Krisha ochish: qancha ochildi, qancha turdi, qumga qancha tushdi, hovuzda qancha qoldi — va 1 kg qum yer ostida qanchaga tushgani */
function krView(c,L,a,b,kr,krl,rs,per){ const cfg=c.cfg, z=(kg,k)=>fmt(E.m3(cfg,kg,k),0)+' m³', p=kr.close, tot=kr.open.v+kr.inn;
  const mt=kr.mode==='k'?`Krisha koeffitsienti bo'yicha: har 1 t qum ${fmt(kr.k,2)} t krishani hovuzdagi o'rtacha narxida oladi.`:(kr.mode==='res'?"Hovuzdagi summa qolgan tasdiqlangan zaxiraga teng yoyiladi: qazilgan kg ÷ qolgan zaxira kg.":"Usul yo'q: zaxira ham, koeffitsient ham kiritilmagan — xarajat qumga o'tmayapti.");
  const lad=[['Karyerni sotib olish va geologiya',rs.rate,'tasdiqlangan zaxiraga bo\'lingan'],['Krisha ochish',kr.next==null?0:kr.next,kr.mode==='k'?'koeffitsient × 1 kg krisha narxi':'hovuz qoldig\'i ÷ qolgan zaxira']];
  return [el('h3',null,`Krisha ochish — ${per}`),kvTiles([
      ['Krisha ochildi',ft(kr.inq)+' t',`${z(kr.inq,1)} · ${fmt(kr.n)} reys`],
      ['Krisha xarajati (davrda)',fm(kr.inn)+' mln',kr.inq>0?`${fmt(kr.inn/kr.inq,2)} so'm/kg krisha`:null],
      ["Qumga yotqizildi (davrda)",fm(kr.rv)+' mln',kr.sq>0?`${ft(kr.sq)} t qumga · ${fmt(kr.rv/kr.sq,2)} so'm/kg`:'qum qazilmagan'],
      ['Hovuzda qoldi',fm(p.v)+' mln',`${ft(p.q)} t krisha · keyingi qumga`],
      ['Keyingi 1 kg qumga tushadi',kr.next==null?'—':fmt(kr.next,2)+" so'm",kr.mode==='k'?`koeffitsient ${fmt(kr.k,2)}`:(kr.mode==='res'?'qolgan zaxiraga yoyilgan':null)]]),
    el('div',{class:'two',style:'margin-top:8px'},
      el('div',null,el('h3',null,'1 kg qum yer ostida qanchaga tushgan'),table([['Nimadan'],["so'm/kg",'r'],['Qanday hisoblangan','w']],lad.map(x=>[x[0],fmt(x[1],4),x[2]]).concat([{cls:'total',cells:['Jami: qazilmagan 1 kg qum',fmt(lad[0][1]+lad[1][1],4),'qazilganda shu summa tan narxga o\'tadi']}]))),
      el('div',null,el('h3',null,'Krisha hovuzi harakati'),table([['Harakat'],['t krisha','r'],["mln so'm",'r']],[[`Davr boshida`,ft(kr.open.q),fm(kr.open.v)],['+ Ochildi: texnika (dizel, amortizatsiya)','',fm(kr.src.tex)],['+ Ochildi: krisha tashish',ft(kr.inq),fm(kr.src.reys)],['+ Karyer umumiy xarajatidan krisha ulushi','',fm(kr.src.fix+kr.src.xar+kr.src.mat)],["− Qumga yotqizildi",ft(kr.rq),fm(kr.rv)],{cls:'total',cells:['= Hovuzda qoldi',ft(p.q),fm(p.v)]}]))),
    krl&&krl.els.length?[el('h3',null,'Krisha ochish xarajatlari: norma va fakt (1 kg krishaga)'),elsTable(krl)]:null,
    el('p',{class:'note'},`Krisha — qumga yetish uchun ustidan olingan tuproq. Uning xarajati shu oyning xarajati emas: keyin qaziladigan qumga yo'l ochadi, shuning uchun hovuzda yig'iladi va faqat qum qazilganda tan narxga o'tadi. ${mt} O'tgan kunlarda qazilgan qum narxi keyingi krisha tufayli o'zgarmaydi. Texnika normasi (dizel l/moto-soat, t/moto-soat) krisha ochishda ham qum qazishdagi bilan bir xil, shuning uchun har texnikaning kunlik dizeli va amortizatsiyasi shu kungi ko'chirilgan tonnaga mutanosib uchga bo'linadi: krisha ochish (hovuzga), qum qazish (karyer omboriga) va qum yuklash (shu kuni jo'natilgan qumga). Krisha ulushi = krisha kg ÷ (krisha kg + qazilgan qum kg + karyerdan yuklab jo'natilgan qum kg). Karyerning umumiy xarajati (ish haqi, ovqat, texnikasiz dizel) oy ichidagi hajmga qarab bo'linadi: krisha kg ÷ (krisha kg + qazilgan qum kg).`)]; }
function kvTiles(arr){ return el('div',{class:'tiles'},arr.filter(Boolean).map(x=>el('div',{class:'tile'},el('span',null,x[0]),el('b',{class:'num'},x[1]),x[2]?el('span',{class:'num'},x[2]):null))); }
function elsTable(lk){ if(!lk||!lk.els.length) return el('div',{class:'panel empty'},"Bu davrda bu bo'g'inda xarajat yo'q.");
  return table([['Xarajat elementi'],['Summa, mln','r'],["so'm/kg",'r'],['Norma','r'],["Og'ish",'r'],['Sabab','w']],
    lk.els.slice().sort((x,y)=>y.fact-x.fact).map(e=>[e.name+(e.est>1?' ~':''),fm(e.fact),e.rate==null?'—':fmt(e.rate,2),e.norm==null?'—':fmt(e.norm,2),fs(e.dv,2),e.cause])
    .concat([{cls:'total',cells:[lk.stage==='krisha'?'Jami (krisha hovuziga tushgan)':'Jami (tan narxga kiradigan)',fm(lk.cost+lk.els.reduce((x,e)=>x+(e.tr?e.fact:0),0)),lk.rate==null?'—':fmt(lk.rate,2),lk.norm==null?'—':fmt(lk.norm,2),fs(lk.dv,2),'']}],idleRow(lk,['',''])));  }
/* «shundan: bo'sh turish» qatori — bo'g'in jami ichidagi ulush, jamiga qo'shilmaydi */
function idleRow(lk,pad){ if(!lk||!stageOf(lk.id)||!lk.days) return []; const ds=lk.idleDays||[], sd=d=>d.slice(8,10)+'.'+d.slice(5,7);
  return [{cls:'sub',cells:["shundan: bo'sh turish",fm(lk.idle),lk.idle>0?(lk.idleRate==null?'—':fmt(lk.idleRate,2)):'0,00'].concat(pad,[
    ds.length?`${lk.days} kundan ${ds.length} kun ish bo'lmagan: ${ds.slice(0,8).map(sd).join(', ')}${ds.length>8?' …':''}. Shu kunlarning doimiy xarajati; jami ichida, qo'shimcha xarajat emas.`:`${lk.days} kunning hammasida ish bo'lgan (yoki ish bo'lmagan kunda doimiy xarajat yo'q).`])}]; }
/* Qiymat tarkibi: zanjir bo'ylab yig'ilgan komponentlar */
function compTable(v,q,title){ const tot=E.vsum(v), rows=COMP.map((cp,i)=>[cp[1],v[i]]).filter(x=>Math.abs(x[1])>0.5), mx=Math.max(1,...rows.map(x=>x[1]));
  if(!rows.length) return el('div',{class:'panel empty'},"Bu yerda hozir qiymat yo'q.");
  const idle=E.idleOf(v);
  return table([[title||'Nimadan tashkil topgan'],['Summa, mln','r'],["so'm/kg",'r'],['Ulushi','r'],['','w']],
    rows.map(x=>[x[0],fm(x[1]),q>0?fmt(x[1]/q,2):'—',tot?fmt(x[1]/tot*100,0)+'%':'—',el('div',{class:'bars one','aria-hidden':'true'},el('i',{class:'bf',style:'width:'+Math.max(0,x[1]/mx*100)+'%'}))])
    .concat([{cls:'total',cells:['Jami',fm(tot),q>0?fmt(tot/q,2):'—','100%','']}],
      idle>0.5?[{cls:'sub',cells:["shundan: bo'sh turish (ish bo'lmagan kunlarning doimiy xarajati)",fm(idle),q>0?fmt(idle/q,2):'—',tot?fmt(idle/tot*100,0)+'%':'—','']}]:[])); }
function ownTable(c,l){ const rows=l.els.filter(e=>e.own); if(!rows.length) return null; const pk=(e,k)=>e.ev?fmt(e.parts[k]/e.ev,2):'—';
  return [el('h3',null,"O'z transporti tannarxi nimadan tashkil topgan"),table([['Marshrut'],['Reys','r'],['Hajm, t','r'],['Dizel, mln','r'],['Amortizatsiya, mln','r'],['Ish haqi, mln','r'],['Boshqa, mln','r'],['Jami, mln','r'],["so'm/reys",'r'],["so'm/kg",'r'],["Tashqi tarif, so'm/kg",'r']],
    rows.map(e=>[e.name.replace("O'z transporti: ",''),e.trips,ft(e.ev),fm(e.parts.dz),fm(e.parts.am),fm(e.parts.lab),fm(e.parts.oth),fm(e.fact),fmt(e.fact/e.trips),e.rate==null?'—':fmt(e.rate,2),fmt(e.norm,2)])),
    el('p',{class:'note'},"Mashinaning o'z dizeli va amortizatsiyasi shu mashina reyslariga, haydovchilar ish haqi va reyssiz turgan mashina xarajati hamma o'z reyslariga bo'linadi. Marshrutga masofa (km) kiritilgan bo'lsa, uzun reys ko'proq oladi.")]; }
/* ---------- Vagon ombori: harakat, tranzit, kutilayotgan kirim ---------- */
const vagTs=c=>TW.filter(T=>T==='T01'||c.vag.some(v=>v.tw===T&&v.ent));
function vagMove(c,Ts,a,b){ const R=Ts.map(T=>E.vagWh(c,T,a,b)), cfg=c.cfg, heads=[['Harakat']];
  Ts.forEach(T=>heads.push([Ts.length>1?cfg.wh[SOFT[T]].name+': vagon':'Vagon','r'],['t','r'],["mln so'm",'r'],["so'm/kg",'r']));
  const row=(lab,k,cls)=>{ const cells=[lab]; R.forEach(r=>{ const x=r[k]; cells.push(x.n,ft(x.kg),fm(x.val)+(x.est&&x.n?' ~':''),x.unit==null?'—':fmt(x.unit,1)); }); return cls?{cls,cells}:cells; };
  return [table(heads,[row(`Davr boshida vagonlarda (${fd(a)} kun boshiga)`,'open'),row('+ Stansiyada vagonga yuklandi','load'),row('− Chustda tushirildi (Chust omboriga kirim)','unl'),
      row(`= Vagonlarda qoldi (${fd(b)} kun oxiriga)`,'close','total'),row("shundan: yo'lda",'road','sub'),row('shundan: Chustda, hali tushirilmagan','wait','sub')]),
    R.some(r=>r.open.est||r.close.est||r.unl.est)?el('p',{class:'note',style:'margin-top:6px'},"~ belgisi: boshlang'ich vagonlar qiymati balans summasi kiritilmagani uchun tarmoq normativida baholangan."):null]; }
function vagTransit(c,Ts,a,b){ const N=c.cfg.norms, tz=E.n(N.tranzKun)||6, mx=E.n(N.yoldaKun)||tz;
  return table([['Tarmoq'],['Davrda Chustga keldi','r'],["O'rtacha yo'lda, kun",'r'],['Norma','r'],['Eng tez – eng sekin','r'],['Tushirishni kutish, kun','r'],[`Hozir yo'lda: ${tz} kungacha`,'r'],[`${tz+1}–${mx} kun`,'r'],[`${mx} kundan ortiq`,'r'],["Eng uzoq yo'lda, kun",'r'],['Holat']],
    Ts.map(T=>{ const s=E.vagStat(c,T,a,b), st=E.status(s.avg,s.tz,'low',c.cfg.tol);
      return [c.cfg.wh[SOFT[T]].name+' → Chust',s.n+' vagon',s.avg==null?'—':fmt(s.avg,1),s.tz,s.n?`${s.min} – ${s.max}`:'—',s.waitAvg==null?'—':fmt(s.waitAvg,1),s.inNorm,s.over,s.late,s.oldest==null?'—':s.oldest,chip(st[0],st[1])]; })); }
function vagList(c,list,b){ const N=c.cfg.norms, led=c.led, tz=E.n(N.tranzKun)||6;
  return table([['Vagon №'],['Nakladnoy'],['Yuklangan'],['Chustga kelgan'],['Kutilmoqda'],['Vazn, kg','r'],["Qiymati, so'm",'r'],["so'm/kg",'r'],['Vagonda, kun','r'],['Holat']],
    list.slice().sort((x,y)=>(x.dy||'')<(y.dy||'')?-1:1).map(v=>{ const arr=!!v.dkE&&v.dkE<=b, days=v.dy?E.dn(b)-E.dn(v.dy):null, l=led.wload[v.id], val=l?E.vsum(l.v):null, eta=v.dy?E.add(v.dy,tz):null;
      const st=arr?chip('warn','Chustda, tushirilmagan'):(days!=null&&days>N.yoldaKun?chip('bad','Kechikmoqda'):(eta&&eta<=b?chip('warn',"Muddati o'tdi"):chip('na',"Yo'lda")));
      return [v.no||'—',v.nak||'—',fd(v.dy),arr?fd(v.dkE):'—',arr?'—':(eta?'≈ '+fd(eta):'—'),fmt(v.kg),val==null?'—':fmt(val)+(l.est?' ~':''),val==null||!v.kg?'—':fmt(val/v.kg,1),days==null?'—':days,v.pre?[st,' ',chip('na',"Boshlang'ich")]:st]; })); }
function pipeView(c,d){ const pl=E.pipeline(c,d,7), cover=pl.out>0?pl.bal0/pl.out:null;
  const tiles=kvTiles([
    ["Chust ombori qoldig'i",ft(pl.bal0)+' t',cover==null?"zavodga jo'natish yo'q":`${fmt(cover,1)} kunga yetadi · ${ft(pl.out)} t/kun`],
    ['Chustda, vagonda (tushirilmagan)',pl.wait.length+' vagon',ft(pl.kgWait)+' t'],
    ["Yo'lda kelyapti",pl.road.length+' vagon',ft(pl.kgRoad)+' t'],
    pl.late.length?["Muddati o'tgan",pl.late.length+' vagon',ft(pl.kgLate)+` t · ${pl.tz} kundan ortiq yo'lda`]:null,
    pl.ext.length?["Ta'minotchidan kelyapti",pl.ext.length+' vagon',ft(pl.kgExt)+' t · tushirilganda kirim qilinadi']:null]);
  if(!pl.wait.length&&!pl.road.length) return [tiles,el('p',{class:'note',style:'margin-top:6px'},"Hozir vagonlarda qum yo'q.")];
  const rows=pl.days.map(x=>{ const st=pl.out>0?(x.bal<-0.5?['bad','▼ Yetmaydi']:(x.bal<pl.out?['warn','△ 1 kundan kam']:['ok','✓ Yetadi'])):['na','—']; return [fd(x.d),x.n||'—',x.kg?ft(x.kg):'—',pl.out?ft(pl.out):'—',ft(x.bal),chip(st[0],st[1])]; });
  if(pl.after.length) rows.push({cls:'sub',cells:[`${fd(pl.days[pl.days.length-1].d)} dan keyin`,pl.after.length,ft(pl.after.reduce((s,v)=>s+v.kg,0)),'','','']});
  return [tiles,el('div',{style:'margin-top:8px'},table([['Sana'],['Kutilayotgan vagon','r'],['Kirim, t','r'],["Zavodga jo'natish, t",'r'],["Chust qoldig'i (prognoz), t",'r'],['Holat']],rows)),
    el('p',{class:'note',style:'margin-top:6px'},`Prognoz taxminiy: kelish sanasi = yuklangan sana + ${pl.tz} kun (o'rtacha tranzit normasi); Chustda vagonda turganlar ertasi kuni tushiriladi deb olingan; zavodga jo'natish — oxirgi 7 kun o'rtachasi.`+(pl.late.length?` Muddati o'tgan ${pl.late.length} vagon prognozga qo'shilmagan.`:''))]; }
function vagSection(c){ const D=ui.D; if(D<c.start) return []; const a=E.ms(D)<c.start?c.start:E.ms(D), Ts=vagTs(c);
  return [el('section',null,el('div',{class:'sechead'},el('h2',null,'Vagon ombori: yuklangan, hali Chustda tushirilmagan qum'),el('span',{class:'muted'},fd(a)+' – '+fd(D))),
      vagMove(c,Ts,a,D),el('h3',{style:'margin-top:10px'},'Tranzit muddati'),vagTransit(c,Ts,a,D),
      el('p',{class:'note',style:'margin-top:6px'},"Qum vagonga yuklangan kuni stansiya omboridan chiqib, vagon omboriga o'tadi; Chust omboriga faqat tushirilgan kuni kiradi. Shu oraliqda u na stansiyada, na Chustda — vagonlarda, temir yo'l tarifi qo'shilgan qiymati bilan.")),
    el('section',null,el('div',{class:'sechead'},el('h2',null,'Chustga kutilayotgan kirim'),el('span',{class:'muted'},fd(D)+' holatiga')),pipeView(c,D))]; }
function vMap(){ const c=ctx(), r=mapRange(), a=r[0], b=r[1], A=E.agg(c,a,b,'acc'), NS=c.NS, cfg=c.cfg, out=[], led=c.led, sn=E.snapAt(c,b);
  const lk=id=>A.chain.find(l=>l.id===id)||(id==='togri'?A.chain.togri:null);
  const SOF={A1:'S01',W1:'S01',A2:'S02',W2:'S02'}, KOF={S01:'K01',S02:'K02'};
  const vg=c.vag, VW={S01:E.vagWh(c,'T01',a,b),S02:E.vagWh(c,'T02',a,b)}, pl=E.pipeline(c,b,7);
  const unit=w=>sn[w].q>0.5?E.vsum(sn[w].v)/sn[w].q:null;
  const avl=S=>{ const full=lk('avtoSt'); const els=full.els.filter(e=>{ const rt=E.route(cfg,e.rcode); return rt&&rt.to===S; }); const vol=els.reduce((s,e)=>s+e.ev,0), cost=els.reduce((s,e)=>s+e.fact,0), n=els.reduce((s,e)=>s+e.trips,0);
    const rt=cfg.routes.find(x=>x.to===S&&x.from!=='TASHQI'); const norm=vol>0?els.reduce((s,e)=>s+e.norm*e.ev,0)/vol:E.rtNorm(cfg,rt), rate=vol>0?cost/vol:null; return {id:'avtoSt',els,vol,cost,n,rate,norm,dv:rate==null?null:rate-norm}; };
  const un=(x,nm)=>x==null?`Norma ${fmt(nm,1)} so'm/kg`:`Tan narxi ${fmt(x,1)} so'm/kg`;
  const info={};
  ['K01','K02'].forEach(id=>{ const rs=E.reserve(c,id,b), kp=sn.KP[id]; info[id]={title:cfg.wh[id].full,lines:[rs.has?`Zaxira ${fmt(rs.remKg/1000,0)} t · ${fmt(rs.rate,2)} so'm/kg`:'Zaxira kiritilmagan',`Omborda ${ft(sn[id].q)} t`,un(unit(id),NS.wh[id])].concat(kp.v>0.5?[`Krisha hovuzi ${fm(kp.v)} mln`]:[])}; });
  const avLines=l=>[`${l.n} reys · ${ft(l.vol)} t`,`${l.rate==null?'—':fmt(l.rate,1)} so'm/kg`];
  ['S01','S02'].forEach(S=>{
    info[S]={title:E.stName(cfg,S),lines:[`Qoldiq ${ft(sn[S].q)} t`,un(unit(S),NS.wh[S])]};
    info[S==='S01'?'A1':'A2']={title:'Avto → '+cfg.wh[S].name,lines:avLines(avl(S))};
    info[S==='S01'?'W1':'W2']={title:'Vagon ombori → Chust',lines:[`${VW[S].close.n} vagon · ${ft(VW[S].close.kg)} t`,un(VW[S].close.unit,NS.wh[TOF[S]])].concat(VW[S].wait.n?[`${VW[S].wait.n} tasi Chustda, tushirilmagan`]:[])}; });
  info.C01={title:'Chust stansiyasi',lines:[`Omborda ${ft(sn.C01.q)} t`,un(unit('C01'),NS.wh.C01)].concat(pl.road.length+pl.wait.length?[`Vagonlarda kelyapti +${ft(pl.kgRoad+pl.kgWait)} t`]:[])};
  info.avtoZav={title:'Avto → Megaton',lines:avLines(lk('avtoZav'))};
  const del=E.delivered(c,a,b), delC=E.delivered(c,a,b,x=>x.from==='C01'), delD=E.delivered(c,a,b,x=>x.from!=='C01');
  info.Z01={title:'Megaton zavodi',lines:[`Keldi ${ft(del.kg)} t`,un(del.unit,NS.total)]};
  info.togri={title:"Avto to'g'ridan",lines:avLines(lk('togri'))};
  MAPN.forEach(m=>info[m[0]].n=m[1]);
  const empty=JN.every(j=>!store.rows[j].length), inp_=(w)=>E.flow(c,w,a,b,1)>0, ld=S=>vg.some(v=>v.tw===TOF[S]&&(E.inr(v.dy,a,b)||E.inT(v,b)));
  const kq=L=>c.tex.some(t=>t.loc===L&&E.inr(t.d,a,b))||c.reys.some(r=>r.from===L&&E.inr(r.d,a,b));
  const lv={K01:kq('K01'),K02:kq('K02'),A1:avl('S01').n>0,A2:avl('S02').n>0,S01:inp_('S01')||ld('S01'),S02:inp_('S02')||ld('S02'),W1:ld('S01'),W2:ld('S02'),
    C01:vg.some(v=>E.inr(v.dt,a,b))||lk('avtoZav').n>0,avtoZav:lk('avtoZav').n>0,Z01:del.kg>0,togri:lk('togri').n>0};
  MAPN.forEach(m=>info[m[0]].live=empty||lv[m[0]]);
  const sel=info[ui.mapSel]?ui.mapSel:'K01';
  const pick=id=>{ ui.mapSel=id; mount(); const d=document.getElementById('map-detail'); if(d&&d.getBoundingClientRect().top>window.innerHeight*0.75) d.scrollIntoView({block:'start',behavior:'auto'}); };
  const df=el('input',{id:'map-from',type:'date',style:'width:auto','aria-label':'Boshlanish'}), dt=el('input',{id:'map-to',type:'date',style:'width:auto','aria-label':'Tugash'});
  df.value=a; dt.value=b; df.addEventListener('change',()=>{ if(df.value){ ui.mapScope='ora'; ui.mapFrom=df.value; ui.mapTo=dt.value||b; mount(); } }); dt.addEventListener('change',()=>{ if(dt.value){ ui.mapScope='ora'; ui.mapTo=dt.value; ui.mapFrom=df.value||a; mount(); } });
  const anim=el('button',{type:'button',id:'map-anim','aria-pressed':String(!ui.mapPause),onclick:()=>{ ui.mapPause=!ui.mapPause; lsSet('qz-anim',ui.mapPause?'0':'1'); mount(); }},ui.mapPause?'▶ Harakat':'❚❚ Harakat');
  const flt=el('div',{class:'ctl'},segBtn([['kun','Kun'],['oy','Oy'],['yil','Yil'],['ora','Oraliq']],ui.mapScope,v=>{ ui.mapScope=v; if(v==='ora'){ ui.mapFrom=a; ui.mapTo=b; } mount(); }),df,el('span',{class:'muted'},'–'),dt,anim);
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Qum zanjiri xaritasi'),flt),
    el('figure',{class:'mapfig'},el('div',{class:'mapwrap'+(ui.mapPause?' paused':'')},isoScene(info,sel,pick)),
      el('figcaption',{class:'note'},`Bo'g'in ustiga bosing — pastda uning to'liq hisobi ochiladi. Qoldiq va tan narx ${fd(b)} kun oxiriga, harakat ${fd(a)} – ${fd(b)} davri uchun. `+(empty?"Ma'lumot kiritilmaguncha harakat namoyish uchun ko'rsatiladi.":"Faqat shu davrda ish bo'lgan bo'g'inlar harakatlanadi.")))));
  const i=info[sel], d=[]; const per=`${fd(a)} – ${fd(b)}`;
  const nsel=el('select',{id:'map-node',style:'width:auto','aria-label':"Bo'g'in"},MAPN.map(m=>el('option',{value:m[0]},m[1]+'. '+info[m[0]].title))); nsel.value=sel; nsel.addEventListener('change',()=>{ ui.mapSel=nsel.value; mount(); });
  const head=el('div',{class:'sechead'},el('h2',null,el('span',{class:'mkh'},i.n),' ',i.title),nsel);
  const carriers=rows=>{ const g={}; rows.forEach(x=>{ const k=x.own?"O'z transporti: "+(E.mc(cfg,x.tk)||{}).name:(x.c||'Tashqi (firma ko\'rsatilmagan)'); const o=g[k]||(g[k]={k,n:0,kg:0,h:0}); o.n++; o.kg+=x.kgQ; o.h+=x.haul; });
    return table([['Kim tashidi'],['Reys','r'],['Hajm, t','r'],["O'rtacha yuk, kg",'r'],["Tashuv, mln",'r'],["so'm/reys",'r'],["so'm/kg",'r']],Object.values(g).sort((x,y)=>y.kg-x.kg).map(o=>[o.k,o.n,ft(o.kg),fmt(o.kg/o.n),fm(o.h),fmt(o.h/o.n),o.kg?fmt(o.h/o.kg,2):'—'])); };
  const stk=(w,lab)=>{ const s=sn[w], val=E.vsum(s.v), u=unit(w); return kvTiles([[lab,ft(s.q)+' t',null],['Qiymati',fm(val)+' mln',"zanjir bo'ylab yig'ilgan"],['1 kg tan narxi',u==null?'—':fmt(u,2)+" so'm",u==null?`qoldiq yo'q; norma ${fmt(NS.wh[w],1)}`:`norma ${fmt(NS.wh[w],1)}`]]); };
  if(stageOf(sel)==='karyer'){ const l=lk(sel), rs=E.reserve(c,sel,b), ext=l?l.vol:0;
    const outR=c.reys.filter(x=>x.from===sel&&!x.kr&&E.inr(x.d,a,b)), toS=outR.filter(x=>x.to!=='Z01').reduce((s,x)=>s+x.kgJ,0), toZ=outR.filter(x=>x.to==='Z01').reduce((s,x)=>s+x.kgJ,0);
    if(!rs.has) d.push(el('div',{class:'banner'},"Kon zahirasi va uning dastlabki qiymati kiritilmagan. Normativlar → «Kon zahirasi» jadvalida to'ldiring — shundan keyin har qazilgan kilogramm bilan zahira qiymati tan narxga o'tadi."));
    const kr=E.krRep(c,sel,a,b), krl=A.chain.kr[sel];
    d.push(el('h3',null,`Kon zaxirasi — ${fd(b)} holatiga`),kvTiles([
      ['Qazib olinmagan qum',ft(rs.remKg)+' t',rs.has?`boshida ${ft(rs.initKg)} t`:null],
      ['Zahira qiymati',fm(rs.remVal)+' mln',rs.has?`boshida ${fm(rs.initVal)} mln`:null],
      ['1 kg qum yer ostida',fmt(rs.rate,4)+" so'm",'(sotib olish + geologiya) ÷ tasdiqlangan zaxira'],
      ["Boshidan qazib olingan",ft(rs.ext)+' t',rs.initKg?fmt(rs.ext/rs.initKg*100,1)+'% zahiradan':null]]));
    d.push(el('h3',null,`Karyer ombori (qazilgan, hali tashilmagan) — ${fd(b)} holatiga`),stk(sel,'Ombordagi qum'),compTable(sn[sel].v,sn[sel].q,'Ombordagi qum nimadan tashkil topgan'));
    d.push(el('h3',null,`Davr: ${per}`),kvTiles([
      ['Qazib olindi',ft(ext)+' t',null],
      ["Zahiradan tan narxga o'tdi",fm(ext*rs.rate)+' mln',`${fmt(rs.rate,2)} so'm/kg`],
      ["Yer qa'ri solig'i",fm(ext*cfg.norms.nedra)+' mln',`${fmt(cfg.norms.nedra,2)} so'm/kg`],
      ['Tashildi',ft(toS+toZ)+' t',`stansiyaga ${ft(toS)} · zavodga ${ft(toZ)}`],
      ['Davr xarajati ÷ hajm',l&&l.rate!=null?fmt(l.rate,1)+" so'm/kg":'—',`norma ${fmt(l?l.norm:NS.wh[sel],1)}`]]));
    d.push(el('h3',null,'Qum qazish xarajatlari: norma va fakt'),elsTable(l));
    if(kr.any) d.push(krView(c,sel,a,b,kr,krl,rs,per));
    d.push(el('h3',null,'Texnika'),texTable(c,E.texRep(c,a,b).filter(x=>x.m.loc===sel),true)); }
  else if((SOF[sel]&&sel[0]==='A')||sel==='avtoZav'||sel==='togri'){ const S=SOF[sel], l=S?avl(S):lk(sel); const rr=c.reys.filter(x=>E.inr(x.d,a,b)&&(S?x.to===S:x.stage===sel)); const both=rr.filter(x=>x.wj!=null&&x.wq!=null), lj=both.reduce((s,x)=>s+x.kgJ,0), ll=both.reduce((s,x)=>s+x.loss,0);
    const ex=rr.filter(x=>!x.own), ow=rr.filter(x=>x.own), sm=(arr,f)=>arr.reduce((s,x)=>s+f(x),0);
    d.push(el('h3',null,`Davr: ${per}`),kvTiles([['Reyslar',l.n,`tashqi ${ex.length} · o'z ${ow.length}`],['Tashildi',ft(l.vol)+' t',l.n?`o'rtacha yuk ${fmt(l.vol/l.n)} kg`:null],['Tashuv xarajati',fm(l.cost)+' mln',`tashqi ${fm(sm(ex,x=>x.haul))} · o'z ${fm(sm(ow,x=>x.haul))}`],
      ["1 kg tashuv",l.rate==null?'—':fmt(l.rate,2)+" so'm",`norma ${fmt(l.norm,2)}`],
      ex.length?['Tashqi logistika',fmt(sm(ex,x=>x.haul)/ex.length)+" so'm/reys",sm(ex,x=>x.kgQ)?fmt(sm(ex,x=>x.haul)/sm(ex,x=>x.kgQ),2)+" so'm/kg":null]:null,
      ow.length?["O'z transporti",fmt(sm(ow,x=>x.haul)/ow.length)+" so'm/reys",sm(ow,x=>x.kgQ)?fmt(sm(ow,x=>x.haul)/sm(ow,x=>x.kgQ),2)+" so'm/kg":null]:null,
      ["Yo'ldagi yo'qotish",lj?fmt(ll)+' kg':'—',lj?fmt(ll/lj*100,2)+'% (ikki tarozi)':"jo'natish vazni kiritilmagan"],
      sel==='togri'?["Temir yo'l zanjiri logistikasi",fmt(NS.logist,1)+" so'm/kg",l.rate!=null?(l.rate>NS.logist?`avto ${fmt(l.rate-NS.logist,1)} qimmat`:`avto ${fmt(NS.logist-l.rate,1)} arzon`):null]:null]));
    d.push(el('h3',null,"Marshrut va tashuvchi turi bo'yicha"),elsTable(l)); d.push(ownTable(c,l)); if(rr.length) d.push(el('h3',null,"Kim tashidi"),carriers(rr)); }
  else if(stageOf(sel)==='stansiya'){ const l=lk(sel)||{vol:0,n:0,cost:0,rate:null,norm:c.LN[sel].total,els:[]}, inn=c.reys.filter(x=>x.to===sel&&E.inr(x.d,a,b));
    const own={}; inn.filter(x=>x.from!=='TASHQI').forEach(x=>own[x.from]=(own[x.from]||0)+x.kgQ); const buy=inn.filter(x=>x.from==='TASHQI'), bk=buy.reduce((s,x)=>s+x.kgQ,0), bs=buy.reduce((s,x)=>s+x.sand,0);
    d.push(el('h3',null,`Ombor — ${fd(b)} holatiga`),stk(sel,'Stansiyadagi qum'),compTable(sn[sel].v,sn[sel].q,'Stansiyadagi qum nimadan tashkil topgan'));
    d.push(el('h3',null,`Davr: ${per}`),kvTiles(Object.keys(own).map(k=>[cfg.wh[k].name+' karyeridan keldi',ft(own[k])+' t',null]).concat([
      !Object.keys(own).length?[cfg.wh[KOF[sel]].name+' karyeridan keldi','0,0 t',null]:null,
      bk?['Sotib olingan qum',ft(bk)+' t',`${fm(bs)} mln · ${fmt(bs/bk,1)} so'm/kg`]:null,
      ['Vagonga yuklandi',ft(l.vol)+' t',`${l.n} vagon`+(l.n?` · o'rtacha ${fmt(l.vol/l.n)} kg`:'')],
      ['Stansiya xarajati ÷ yuklangan hajm',l.rate==null?'—':fmt(l.rate,2)+" so'm/kg",`norma ${fmt(l.norm,2)} · ${fm(l.cost)} mln`]])));
    d.push(el('h3',null,"Stansiya xarajatlari: norma va fakt"),elsTable(l),el('p',{class:'note'},"Doimiy xarajatlar (ish haqi, ijara, elektr) ombordagi qum qiymatiga, yuklash xarajatlari (sim, plyonka, dizel, stansiya xizmati) shu kuni yuklangan vagonlarga o'tadi.")); }
  else if(SOF[sel]){ const S=SOF[sel], T=TOF[S], vw=VW[S], vs=E.vagStat(c,T,a,b), ldn=vw.load.n;
    const te=(lk('temir').els.find(e=>e.key==='ty:'+S))||{fact:0,rate:null,norm:E.tyNorm(cfg,S)/cfg.norms.vagYuk};
    d.push(el('p',{class:'note'},`Vagon — alohida ombor. Qum ${cfg.wh[S].name} stansiyasida vagonga yuklangan kuni shu omborga kiradi va Chustda tushirilgan kunigacha shu yerda turadi (o'rtacha ${vs.tz} kun). Chust ombori qoldig'iga faqat tushirilgandan keyin qo'shiladi.`));
    d.push(el('h3',null,`Vagon ombori: ${cfg.wh[S].name} → Chust — ${fd(b)} kun oxiriga`),kvTiles([
      ['Vagonlardagi qum',ft(vw.close.kg)+' t',`${vw.close.n} vagon`],
      ['Qiymati',fm(vw.close.val)+' mln',vw.close.est?'bir qismi normativ baho':"temir yo'l tarifi bilan"],
      ['1 kg tan narxi',vw.close.unit==null?'—':fmt(vw.close.unit,2)+" so'm",`norma ${fmt(NS.wh[T],1)}`],
      ["Yo'lda",vw.road.n+' vagon',ft(vw.road.kg)+' t'+(vs.late?` · ${vs.late} tasi kechikmoqda`:'')],
      ['Chustda, tushirilmagan',vw.wait.n+' vagon',ft(vw.wait.kg)+' t · hali Chust omborida emas'],
      ["O'rtacha yo'lda (davrda kelganlar)",vs.avg==null?'—':fmt(vs.avg,1)+' kun',`norma ${vs.tz} kun`+(vs.n?` · ${vs.n} vagon`:'')]]));
    d.push(compTable(vw.close.v,vw.close.kg,'Vagondagi qum nimadan tashkil topgan'));
    d.push(el('h3',null,`Davr harakati: ${per}`),vagMove(c,[T],a,b),el('div',{style:'margin-top:8px'},kvTiles([
      ["Temir yo'l tarifi (davrda yuklangan)",fm(te.fact)+' mln',ldn?`${fmt(te.fact/ldn)} so'm/vagon`:null],["1 kg temir yo'l",te.rate==null?'—':fmt(te.rate,2)+" so'm",`norma ${fmt(te.norm,2)}`]])));
    d.push(el('h3',null,'Tranzit muddati'),vagTransit(c,[T],a,b));
    if(vw.close.n) d.push(el('h3',null,`Vagonlar ro'yxati — ${fd(b)} kun oxiriga`),vagList(c,vw.close.list,b)); }
  else if(sel==='C01'){ const l=lk(sel), unl=vg.filter(v=>E.inr(v.dt,a,b)), ext=unl.filter(v=>v.ext), outz=c.reys.filter(x=>x.from===sel&&E.inr(x.d,a,b)), adj=E.adjSum(c,sel,a,b), ls=led.loss.filter(x=>x.wh===sel&&E.inr(x.d,a,b));
    const by=S=>{ const x=unl.filter(v=>v.src===S); return [cfg.wh[S].name+'dan tushirildi',ft(x.reduce((s,v)=>s+v.kg,0))+' t',`${x.length} vagon`]; };
    d.push(el('h3',null,`Ombor — ${fd(b)} holatiga (faqat tushirilgan qum)`),stk(sel,'Chustdagi qum'),compTable(sn[sel].v,sn[sel].q,'Chustdagi qum nimadan tashkil topgan'));
    d.push(el('h3',null,`Davr: ${per}`),kvTiles([by('S01'),by('S02'),ext.length?["Ta'minotchidan tushirildi",ft(ext.reduce((s,v)=>s+v.kg,0))+' t',`${ext.length} vagon · ${fm(ext.reduce((s,v)=>s+v.sand,0))} mln`]:null,
      ["Zavodga jo'natildi",ft(outz.reduce((s,x)=>s+x.kgJ,0))+' t',`${outz.length} reys`],
      ['GU-46 jarima',fmt(A.gu.sum)+" so'm",'tan narxga kirmaydi'],
      ['Chust xarajati ÷ tushirilgan hajm',l.rate==null?'—':fmt(l.rate,2)+" so'm/kg",`norma ${fmt(l.norm,2)}`],adj?['Inventarizatsiya farqi',fs(adj/1000,1)+' t',ls.length?`zararga ${fm(ls.reduce((s,x)=>s+E.vsum(x.v),0))} mln`:'ortiqcha, qiymatsiz']:null]));
    d.push(el('h3',null,`Chustga kelayotgan qum — ${fd(b)} holatiga (ombor qoldig'iga hali kirmagan)`),pipeView(c,b));
    d.push(el('h3',null,"Chust xarajatlari: norma va fakt"),elsTable(l)); }
  else { const lm=led.z(), Bq={S01:0,S02:0}, Bv={S01:led.z(),S02:led.z()};
    for(const id in led.wload){ const x=led.wload[id]; if(E.inr(x.d,a,b)&&Bv[x.src]){ Bq[x.src]+=x.kg; for(let k=0;k<lm.length;k++) Bv[x.src][k]+=x.v[k]; } }
    d.push(el('h3',null,`Davr: ${per}`),kvTiles([['Zavodga keldi',ft(del.kg)+' t',`${del.n} reys`],
      ['Kelgan qum qiymati',fm(del.val)+' mln',null],
      ["1 kg fakt tan narxi",del.unit==null?'—':fmt(del.unit,2)+" so'm",`norma ${fmt(NS.total,1)}`+(del.unit==null?'':' · '+fs(del.unit-NS.total,1))],
      ['Chust orqali',ft(delC.kg)+' t',delC.unit==null?null:fmt(delC.unit,1)+" so'm/kg"],
      ["Avto to'g'ridan",ft(delD.kg)+' t',delD.unit==null?null:fmt(delD.unit,1)+" so'm/kg"],
      A.buy.vol?['Sotib olingan qum (davr)',ft(A.buy.vol)+' t',`${fm(A.buy.cost)} mln · ${fmt(A.buy.cost/A.buy.vol,1)} so'm/kg`]:null]));
    d.push(compTable(del.v,del.kg,"Megatonga kelgan qum nimadan tashkil topgan"),
      el('p',{class:'note'},"Bu — o'rtacha tortilgan fakt: har kilogramm karyerdan boshlab o'z yo'lidagi xarajatlarni yig'ib kelgan. Davr xarajati ÷ davr hajmi usulidagi norma–fakt tahlili Tahlil bo'limida."));
    const cols=['S01','S02'].filter(S=>Bq[S]>0);
    if(cols.length) d.push(el('h3',null,"Tarmoqlar bo'yicha: vagonga yuklangan qumning 1 kg tan narxi (temir yo'l bilan)"),table([['Komponent']].concat(cols.map(S=>[cfg.wh[KOF[S]].name+' → '+cfg.wh[S].name,'r'])),
      COMP.map((cp,k)=>[cp[1]].concat(cols.map(S=>Bv[S][k]))).filter(x=>x.slice(1).some(v=>Math.abs(v)>0.5)).map(x=>[x[0]].concat(x.slice(1).map((v,j)=>fmt(v/Bq[cols[j]],2))))
      .concat([{cls:'total',cells:['Jami, so\'m/kg'].concat(cols.map(S=>fmt(E.vsum(Bv[S])/Bq[S],2)))},{cls:'sub',cells:['Yuklangan, t'].concat(cols.map(S=>ft(Bq[S])))}]))); }
  out.push(el('section',{id:'map-detail',class:'detail'},head,d));
  return out; }

/* ---------- Panel ---------- */
function vPanel(){ const c=ctx(), D=ui.D, a=E.ms(D), NS=c.NS, out=[];
  if(D<c.start) out.push(el('div',{class:'banner'},`Hisobot sanasi tizim boshlanishidan (${fd(c.start)}) oldin. Qoldiqlar boshlang'ich holatda ko'rsatiladi.`));
  const day=E.agg(c,D,D,'day'), mtd=E.agg(c,a,D,'mtd'), sn=E.snapAt(c,D), dlv=E.delivered(c,a,D), dld=E.delivered(c,D,D);
  const al=E.alerts(c);
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Diqqat talab qiladi'),el('span',{class:'muted'},fd(D)+' holatiga')),
    el('div',{class:'panel'},al.length?el('ul',{class:'alerts'},al.map(x=>el('li',null,chip(x[0],x[0]==='bad'?'! Muhim':'△ Tekshiring'),el('span',null,x[1])))):el('div',{class:'empty'},"Ogohlantirish yo'q."))));
  const act=w=>Math.abs(E.bal(c,w,D))>0.5||E.flow(c,w,a,D,1)>0||(E.n(c.cfg.wh[w].plan)||0)>0||c.cfg.machines.some(m=>m.loc===w);
  const whs=WH.filter(w=>(w!=='S02'&&w!=='K02'&&w!=='T02')||act(w)), ok0=D>=c.start, vwD={T01:E.vagWh(c,'T01',D,D),T02:E.vagWh(c,'T02',D,D)}, plD=E.pipeline(c,D,7);
  const nodes=whs.map(w=>{ const b=E.bal(c,w,D), i=E.flow(c,w,D,D,1), o=-E.flow(c,w,D,D,0), mi=E.flow(c,w,a,D,1), mo=-E.flow(c,w,a,D,0);
    const o7=-E.flow(c,w,E.add(D,-6),D,0)/Math.max(1,Math.min(7,E.dn(D)-E.dn(c.start)+1)); const adj=E.adjSum(c,w,a,D);
    return el('div',{class:'node'+(b<-0.5?' neg':'')},
      el('div',{class:'nm'},c.cfg.wh[w].name,el('small',null,w)),
      el('div',{class:'big num'},ft(b),' ',el('small',null,'t')),
      el('dl',{class:'num'},
        el('dt',null,'Bugun'),el('dd',null,'+'+ft(i)+' / −'+ft(o)),
        el('dt',null,'Oy boshidan'),el('dd',null,'+'+ft(mi)+' / −'+ft(mo)),
        adj?[el('dt',null,'Inventar farqi'),el('dd',null,fs(adj/1000,1))]:null,
        isT(w)?[el('dt',null,'Vagonlar'),el('dd',null,vwD[w].close.n+' ta'),el('dt',null,'Chustda, tushirilmagan'),el('dd',null,vwD[w].wait.n+' ta')]:[el('dt',null,'Zaxira'),el('dd',null,(o7>0&&b>0)?fmt(b/o7,0)+' kun':'—')],
        (w==='C01'&&ok0)?[el('dt',null,'Vagonlarda kelyapti'),el('dd',null,'+'+ft(plD.kgRoad+plD.kgWait)+' t')]:null,
        el('dt',null,'Tan narxi'),el('dd',null,sn[w].q>0.5?fmt(E.vsum(sn[w].v)/sn[w].q,1)+" so'm/kg":'—'),
        el('dt',null,'Norma'),el('dd',null,fmt(NS.wh[w],1)+" so'm/kg"),
        el('dt',null,'Qiymati'),el('dd',null,fm(E.vsum(sn[w].v))+" mln")));
  });
  const zi=E.flow(c,'Z01',D,D,1), zm=E.flow(c,'Z01',a,D,1);
  nodes.push(el('div',{class:'node end'},el('div',{class:'nm'},'Zavod',el('small',null,'Z01')),
    el('div',{class:'big num'},ft(zm),' ',el('small',null,'t oy boshidan')),
    el('dl',{class:'num'},el('dt',null,'Bugun kirim'),el('dd',null,ft(zi)+' t'),
      el('dt',null,'Chustdan'),el('dd',null,ft(mtd.avtoZav.vol)+' t'),
      el('dt',null,"Avto to'g'ridan"),el('dd',null,ft(mtd.togri.vol)+' t'),
      el('dt',null,'Norma'),el('dd',null,fmt(NS.total,1)+" so'm/kg"),
      el('dt',null,'Fakt (oy)'),el('dd',null,dlv.unit!=null?fmt(dlv.unit,1)+" so'm/kg":'—'))));
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Zanjir: qoldiq va harakat'),el('span',{class:'muted'},'kun oxiriga, tonna')),el('div',{class:'chain'},nodes)));
  /* tan narx: bo'g'inlar */
  const tol=c.cfg.tol, dl={}; day.chain.forEach(l=>dl[l.id]=l);
  const rows=mtd.chain.map(m=>{ const d=dl[m.id]||{vol:0,rate:null}; const st=E.status(m.rate,m.norm,'low',tol);
    return [(stageOf(m.id)?SN[m.stage]+': ':'')+m.name,ft(d.vol),d.rate==null?'—':fmt(d.rate,1),ft(m.vol),fm(m.cost),m.rate==null?'—':fmt(m.rate,1),stageOf(m.id)?(m.idleRate==null?(m.idle>0?fm(m.idle)+' mln':'—'):fmt(m.idleRate,1)):'—',fmt(m.norm,1),fs(m.dv,1),m.dsum==null?'—':fs(m.dsum/1e6,2),chip(st[0],st[1])]; });
  const dvT=mtd.full?mtd.landed-NS.total:null, stT=E.status(mtd.full?mtd.landed:null,NS.total,'low',tol);
  rows.push({cls:'total',cells:["Bosqich stavkalari yig'indisi",'',day.full?fmt(day.landed,1):'—','','',mtd.full?fmt(mtd.landed,1):'—',mtd.full?fmt(mtd.landedIdle,1):'—',fmt(NS.total,1),fs(dvT,1),'',chip(stT[0],stT[1])]});
  const stL=E.status(dlv.unit,NS.total,'low',tol);
  rows.push({cls:'total',cells:["Zavodga kelgan qum: o'rtacha tortilgan fakt",ft(dld.kg),dld.unit==null?'—':fmt(dld.unit,1),ft(dlv.kg),fm(dlv.val),dlv.unit==null?'—':fmt(dlv.unit,1),dlv.kg>0?fmt(dlv.idle/dlv.kg,1):'—',fmt(NS.total,1),dlv.unit==null?'—':fs(dlv.unit-NS.total,1),dlv.unit==null?'—':fs((dlv.unit-NS.total)*dlv.kg/1e6,2),chip(stL[0],stL[1])]});
  rows.push({cls:'sub',cells:["Avto to'g'ridan zavodga",ft(day.togri.vol),day.togri.rate==null?'—':fmt(day.togri.rate,1),ft(mtd.togri.vol),fm(mtd.togri.cost),mtd.togri.rate==null?'—':fmt(mtd.togri.rate,1),'',fmt(NS.logist,1),'','','']});
  rows.push({cls:'sub',cells:['Sotib olingan qum',ft(day.buy.vol),day.buy.vol?fmt(day.buy.cost/day.buy.vol,1):'—',ft(mtd.buy.vol),fm(mtd.buy.cost),mtd.buy.vol?fmt(mtd.buy.cost/mtd.buy.vol,1):'—','','','','','']});
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,"Tan narx bo'g'inlar bo'yicha: norma va fakt"),el('span',{class:'muted'},"so'm/kg; xarajat va og'ish — mln so'm")),
    table([["Bo'g'in"],['Bugun, t','r'],["Bugun, so'm/kg",'r'],['Oy boshidan, t','r'],['Xarajat','r'],["Fakt",'r'],["shundan bo'sh turish",'r'],['Norma','r'],["Og'ish",'r'],["Og'ish, mln",'r'],['Holat']],rows),
    el('p',{class:'note'},"Har bo'g'in xarajati o'z hajmiga bo'linadi: karyer — qazilgan, stansiya va temir yo'l — yuklangan, Chust — tushirilgan tonnaga. Doimiy xarajatlar oy yopilguncha oylik rejaning kunlik ulushi bilan hisoblanadi. «Bosqich stavkalari yig'indisi» — davr xarajati ÷ davr hajmi; «o'rtacha tortilgan fakt» — zavodga haqiqatda kelgan qum o'z yo'lida yig'ib kelgan qiymat. «Shundan bo'sh turish» — faktning ichidagi ulush: karyer, stansiya yoki Chustda ish bo'lmagan kunlarning doimiy xarajati (ish haqi, ijara va h.k.). Ish bo'lgan kun jurnallardan aniqlanadi (texnika yozuvi, reys yoki vagon bor kun) — alohida kiritilmaydi va reja hajmiga bog'liq emas.")));
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,"Tan narx nimaning hisobiga ko'tarildi"),el('button',{class:'link',type:'button',onclick:()=>go('tah')},"To'liq tahlil →")),
    el('div',{class:'panel'},causeList(E.topCauses(mtd.chain,5)))));
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Texnika bugun: norma va fakt'),el('span',{class:'muted'},fd(D))),texTable(c,E.texRep(c,D,D),false),E.trucks(c.cfg).length?[el('h3',{style:'margin-top:8px'},"O'z yuk mashinalari: oy boshidan"),truckTable(c,E.truckRep(c,a,D))]:null));
  const kp=E.kpi(c,a,D).map(k=>{ const st=E.status(k[2],k[3],k[4],tol); return [k[0],k[1],k[2]==null?'—':fmt(k[2],k[5]),fmt(k[3],k[5]),chip(st[0],st[1])]; });
  const yo=c.vag.filter(v=>v.st==="Yo'lda"), ku=c.vag.filter(v=>v.st==='Chustda vagonda');
  const tiles=el('div',{class:'tiles'},
    el('div',{class:'tile'},el('b',{class:'num'},yo.length),el('span',null,"vagon yo'lda · "+ft(yo.reduce((s,v)=>s+v.kg,0))+' t')),
    el('div',{class:'tile'},el('b',{class:'num'},ku.length),el('span',null,'Chustda vagonda, tushirilmagan')),
    el('div',{class:'tile'},el('b',{class:'num'},plD.days.slice(0,3).reduce((s,x)=>s+x.n,0)),el('span',null,'keyingi 3 kunda kutilmoqda')),
    el('div',{class:'tile'},el('b',{class:'num'},c.vag.filter(v=>!v.ext&&v.dy===D).length),el('span',null,'bugun yuklangan')),
    el('div',{class:'tile'},el('b',{class:'num'},c.vag.filter(v=>v.dt===D).length),el('span',null,'bugun tushirilgan')),
    el('div',{class:'tile'},el('b',{class:'num'},yo.length?Math.max(...yo.map(v=>v.yol||0)):'—'),el('span',null,"eng uzoq yo'lda, kun")));
  const truck=E.route(c.cfg,'KZ').tarif, diff=truck-NS.logist;
  out.push(el('div',{class:'two'},
    el('section',null,el('h2',null,"Logistika normativlari (oy boshidan)"),table([["Ko'rsatkich",'w'],['Birlik'],['Fakt','r'],['Norma','r'],['Holat']],kp)),
    el('section',null,el('h2',null,'Vagonlar'),tiles,
      el('h2',{style:'margin-top:12px'},'Marshrut tanlovi'),
      el('div',{class:'panel pad'},el('p',{class:'num'},`Temir yo'l zanjiri logistikasi (norma): ${fmt(NS.logist,1)} so'm/kg. Avto to'g'ridan tarifi: ${fmt(truck,1)} so'm/kg.`),
        el('p',{style:'margin-top:6px'},diff>0?chip('ok',"Temir yo'l arzon"):chip('warn','Avto arzon'),' ',el('span',{class:'num'},`farq ${fmt(Math.abs(diff),1)} so'm/kg. Avto tarifi ${fmt(NS.logist,0)} so'm/kg dan past bo'lsagina avto foydali.`))))));
  return out;
}

/* ---------- Tahlil: qayerda va nimaning hisobiga ---------- */
function vTah(){ const c=ctx(), D=ui.D, day=ui.tahScope==='kun', a=day?D:E.ms(D), A=E.agg(c,a,D,day?'day':'mtd'), ch=A.chain, tol=c.cfg.tol, out=[];
  const seg=segBtn([['kun','Bugun'],['oy','Oy boshidan']],ui.tahScope,v=>{ui.tahScope=v;mount();});
  const tot=ch.reduce((s,l)=>s+(l.rate||0),0);
  const maxv=Math.max(1,...ch.map(l=>Math.max(l.rate||0,l.norm||0)));
  const bar=(l)=>{ const w=v=>Math.max(0,Math.min(100,(v||0)/maxv*100)); return el('div',{class:'bars','aria-hidden':'true'},el('i',{class:'bn',style:'width:'+w(l.norm)+'%'}),el('i',{class:'bf'+(E.status(l.rate,l.norm,'low',tol)[0]==='bad'?' over':''),style:'width:'+w(l.rate)+'%'})); };
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,"Qaysi bo'g'inda qancha xarajat"),seg),
    table([["Bo'g'in"],['Hajm, t','r'],['Xarajat, mln','r'],["Fakt, so'm/kg",'r'],['Norma','r'],['Fakt va norma','w'],["Og'ish, so'm/kg",'r'],["Og'ish, mln",'r'],['Tan narxdagi ulushi','r'],['Holat']],
      ch.map(l=>{ const st=E.status(l.rate,l.norm,'low',tol); return [(stageOf(l.id)?SN[l.stage]+': ':'')+l.name,ft(l.vol),fm(l.cost),l.rate==null?'—':fmt(l.rate,2),fmt(l.norm,2),bar(l),fs(l.dv,2),l.dsum==null?'—':fs(l.dsum/1e6,2),l.rate==null||!tot?'—':fmt(l.rate/tot*100,0)+'%',chip(st[0],st[1])]; })
      .concat([{cls:'total',cells:["Jami zavodda",'',fm(ch.reduce((s,l)=>s+l.cost,0)),A.full?fmt(A.landed,2):'—',fmt(c.NS.total,2),'',A.full?fs(A.landed-c.NS.total,2):'—',fs(ch.reduce((s,l)=>s+(l.dsum||0),0)/1e6,2),'','']}])),
    el('p',{class:'note'},"Chiziqlar: och — norma, to'q — fakt. Jami og'ish (mln) — har bo'g'indagi og'ishning o'z hajmiga ko'paytmasi yig'indisi.")));
  const KRS=Object.values(ch.kr||{}).filter(l=>l.vol>0||l.cost>0), chx=ch.concat(KRS);
  if(KRS.length) out.push(el('section',null,el('h2',null,'Krisha ochish: shu davrda hovuzga tushgan xarajat'),table([['Karyer'],['Krisha, t','r'],['Krisha, m³','r'],['Reys','r'],['Xarajat, mln','r'],["Fakt, so'm/kg krisha",'r'],['Norma','r'],["Og'ish",'r'],['Holat']],
      KRS.map(l=>{ const st=E.status(l.rate,l.norm,'low',tol); return [l.name,ft(l.vol),fmt(E.m3(c.cfg,l.vol,1),0),fmt(l.n),fm(l.cost),l.rate==null?'—':fmt(l.rate,2),l.norm==null?'—':fmt(l.norm,2),fs(l.dv,2),chip(st[0],st[1])]; })),
    el('p',{class:'note'},"Krisha xarajati yuqoridagi jadvalga (qum tan narxi) to'g'ridan qo'shilmaydi: u hovuzda yig'iladi va karyer qatoridagi «Krisha ochish (hovuzdan qumga yotqizildi)» elementi orqali faqat qazilgan qumga o'tadi. Texnika normasi krisha ochishda ham qum qazishdagi bilan bir xil.")));
  out.push(el('section',null,el('h2',null,"Nimaning hisobiga: eng katta og'ishlar"),el('div',{class:'panel'},causeList(E.topCauses(chx,8)))));
  const ls=ui.tahLink&&chx.some(l=>l.id===ui.tahLink)?ui.tahLink:'';
  const sel=el('select',{id:'tah-link',style:'width:auto'},el('option',{value:''},"Hamma bo'g'inlar"),chx.map(l=>el('option',{value:l.id},l.name))); sel.value=ls; sel.addEventListener('change',()=>{ui.tahLink=sel.value;mount();});
  const body=[]; chx.filter(l=>!ls||l.id===ls).forEach(l=>{
    body.push({cls:'total',cells:[(stageOf(l.id)?SN[l.stage]+': ':'')+l.name,fm(l.cost),l.rate==null?'—':fmt(l.rate,2),fmt(l.norm,2),fs(l.dv,2),l.dsum==null?'—':fs(l.dsum/1e6,2),'']});
    l.els.slice().sort((x,y)=>y.fact-x.fact).forEach(e=>body.push(['   '+e.name+(e.est>1?' ~':''),fm(e.fact),e.rate==null?'—':fmt(e.rate,2),e.norm==null?'—':fmt(e.norm,2),fs(e.dv,2),e.dsum==null?'—':fs(e.dsum/1e6,2),e.cause])); idleRow(l,['','','']).forEach(r=>{ r.cells[0]='   '+r.cells[0]; body.push(r); }); });
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Xarajat elementlari'),sel),
    table([['Element'],['Fakt, mln','r'],["Fakt, so'm/kg",'r'],['Norma','r'],["Og'ish, so'm/kg",'r'],["Og'ish, mln",'r'],['Sabab','w']],body),
    el('p',{class:'note'},"~ belgisi: doimiy xarajat hali fakt bilan yopilmagan, reja ulushi bilan hisoblangan. GU-46 jarima alohida ko'rsatiladi va bo'g'in jamiga qo'shilmaydi. «Shundan: bo'sh turish» — bo'g'in jami ichidagi ulush: shu bo'g'inda ish bo'lmagan kunlarning (texnika yozuvi ham, reys yoki vagon ham yo'q) doimiy xarajati; jamiga qo'shilmaydi.")));
  out.push(el('section',null,el('h2',null,'Texnika: '+(day?'bugun':'oy boshidan')),texTable(c,E.texRep(c,a,D),true)));
  { const fv=E.fuelVar(c,a,D), ks=Object.keys(fv.by).filter(k=>fv.by[k].n);
    if(ks.length) out.push(el('section',null,el('h2',null,"Dizel og'ishi: bak o'lchovlari ("+(day?'bugun':'oy boshidan')+')'),table([['Texnika'],["O'lchov",'r'],["Og'ish, l",'r'],["Og'ish, so'm",'r'],['Holat']],
      ks.map(k=>{ const g=fv.by[k]; return [(E.mc(c.cfg,k)||{}).name||k,g.n,fs(g.l,0),fs(g.v,0),chip(g.v>0.5?'bad':(g.v<-0.5?'warn':'ok'),g.v>0.5?'▲ Normadan ortiq':(g.v<-0.5?'▼ Normadan kam':'✓ Mos'))]; }).concat([{cls:'total',cells:['Jami',fv.aud.n,fs(fv.aud.l,0),fs(fv.aud.v,0),'']}])),
      el('p',{class:'note'},"Yuqoridagi tan narx jadvallarida dizel norma bo'yicha yozilgan (norma usulidagi texnikada). Bu jadval — bak o'lchanganda chiqqan haqiqiy farq: tan narxga qo'shilmaydi, alohida og'ish sifatida ko'riladi. To'liq daftar — Texnika bo'limidagi kartochkada."))); }
  if(E.trucks(c.cfg).length) out.push(el('section',null,el('h2',null,"O'z yuk mashinalari: reys tannarxi (oy boshidan)"),truckTable(c,E.truckRep(c,E.ms(D),D)),el('p',{class:'note'},"O'z reysining tannarxi oy bo'yicha hisoblanadi: bir kunlik yoqilg'i quyish yoki ish haqi bitta reysni sun'iy qimmatlashtirmasligi uchun.")));
  return out; }

/* ---------- Mening uchastkam: operator uchun o'z qumi, tashish, tan narx va mashinalar ta'siri ---------- */
const MYS={SAM:{K:'K02',S:'S02',t:'Samarqand karyeri → Samarqand stansiyasi'},QIB:{K:'K01',S:'S01',t:"Mayskiy karyeri → Bo'zsuv stansiyasi"},CHU:{C:'C01',t:'Chust stansiyasi → zavod'},MEG:{t:'Megaton zavodi: kelgan qum'}};
const MYT={karyer:'Karyer: qazish',avtoSt:'Karyer → stansiya: tashish',stansiya:'Stansiya: saqlash va yuklash',temir:"Temir yo'l tarifi",chust:'Chust: tushirish',avtoZav:'Chust → zavod: tashish',togri:"To'g'ridan zavodga"};
function myRange(c){ const D=ui.D, m=ui.my, s=m.scope; let a=E.ms(D), b=D;
  if(s==='kun') a=D; else if(s==='hafta') a=E.add(D,-6);
  else if(s==='ora'){ a=m.from||E.ms(D); b=m.to||D; if(a>b){ const t=a; a=b; b=t; } if(b>D) b=D; }
  if(a<c.start) a=c.start; return [a,b]; }
/* Bir nechta elementdan «bo'g'in» (davr hajmi, xarajati, stavkasi va normasi) */
function myLine(id,name,els,stage){ let vol=0,cost=0,nw=0,nv=0; els.forEach(e=>{ const ev=e.ev!=null?e.ev:(e.evol||0); vol+=ev; cost+=e.fact; if(e.norm!=null){ nw+=e.norm*ev; nv+=ev; } });
  const rate=vol>0?cost/vol:null, norm=nv>0?nw/nv:null, dv=(rate!=null&&norm!=null)?rate-norm:null;
  return {id,name,stage,els,vol,cost,rate,norm,dv,dsum:dv==null?null:dv*vol,n:0,idle:0}; }
function myLines(c,ch,site){ const cfg=c.cfg, M=MYS[site], by={}; ch.forEach(l=>by[l.id]=l); const L=[];
  const z=(id,st)=>by[id]||myLine(id,cfg.wh[id].name,[],st);
  if(M.K){ const rc=cfg.routes.filter(r=>r.stage==='avtoSt'&&(r.to===M.S||r.from===M.K)).map(r=>r.code);
    L.push(z(M.K,'karyer'),myLine('avto','Karyer → stansiya',((by.avtoSt||{els:[]}).els).filter(e=>rc.indexOf(e.rcode)>=0),'avtoSt'),z(M.S,'stansiya'),
      myLine('temir',"Temir yo'l",((by.temir||{els:[]}).els).filter(e=>e.key==='ty:'+M.S),'temir')); }
  else if(M.C) L.push(z('C01','chust'),by.avtoZav||myLine('avtoZav','Chust → zavod',[],'avtoZav'));
  else ch.forEach(l=>{ if(l.vol>0||l.cost>0) L.push(l); });
  return L; }
function mySum(L){ let r=0,n=0,any=false; L.forEach(l=>{ if(l.rate!=null&&l.norm!=null){ r+=l.rate; n+=l.norm; any=true; } }); return {rate:any?r:null,norm:any?n:null}; }
/* Shu uchastkadagi har bir mashina (o'z va tashqi): reys, tonna, xarajat va normadan farqi */
function myVeh(c,site,a,b){ const cfg=c.cfg, N=cfg.norms, g={}, kgR=(E.n(N.krReys)||25)*(E.n(N.krZich)||1.5)*1000;
  c.reys.forEach(r=>{ if(!E.inr(r.d,a,b)||!opMine(site,'reys',r)) return;
    let key,label,own=false,firm; const m=r.own?E.mc(cfg,r.tk):null;
    if(r.own){ key='own:'+r.tk; label=m?(m.plate||m.name):r.tk; own=true; firm="O'z transporti"; }
    else { const p=String(r.a||'').replace(/\s+/g,' ').trim().toUpperCase(); key='x:'+(p||'?')+'|'+(r.c||''); label=p||'(raqamsiz)'; firm=r.c||'—'; }
    const x=g[key]||(g[key]={key,label,own,firm,sand:{n:0,kg:0,kgN:0,cost:0,nc:0,loss:0,kam:0,rows:0},kr:{n:0,kg:0,kgN:0,cost:0,nc:0},trips:[]});
    const rt=r.rt, nm=r.kr?(rt.tarif>0?(rt.type==='reys'?rt.tarif/kgR:rt.tarif):null):E.rtNorm(cfg,rt), costed=!(r.own&&!r.parts&&!(r.haul>0));
    const s=r.kr?x.kr:x.sand; s.n+=r.rn; s.kg+=r.kgQ;
    if(nm!=null&&costed){ s.kgN+=r.kgQ; s.cost+=r.haul; s.nc+=nm*r.kgQ; }
    if(!r.kr){ s.loss+=Math.max(0,r.loss||0); if(rt.stage==='avtoSt'&&r.kgQ>0&&r.kgQ/r.rn<N.reysMin) s.kam++; }
    x.trips.push({d:r.d,rname:r.rname,rn:r.rn,kg:r.kgQ,kgJ:r.kgJ,haul:r.haul,norm:nm,costed,kr:r.kr,doc:r.doc,flags:r.flags,s:r.s}); });
  return Object.keys(g).map(k=>g[k]); }
function myDays(c,site,a,b){ const M=MYS[site], ds=[], ix={}; if(E.dn(b)-E.dn(a)>45) a=E.add(b,-45);
  for(let d=a; d<=b; d=E.add(d,1)){ ix[d]={d}; ds.push(ix[d]); }
  const add=(d,k,v)=>{ const o=ix[d]; if(o&&v) o[k]=(o[k]||0)+v; };
  if(M.K){ c.tex.forEach(t=>{ if(!t.truck&&!t.aud&&t.loc===M.K&&t.op==='Q') add(t.d,'dig',E.n(t.kg)||0); }); if(M.K==='K01') c.kar.forEach(k=>add(k.d,'dig',E.n(k.kg)||0));
    c.reys.forEach(r=>{ if(!r.kr&&r.from===M.K) add(r.d,'ship',r.kgQ); }); c.vag.forEach(v=>{ if(!v.ext&&v.src===M.S&&v.dy) add(v.dy,'load',v.kg); }); }
  else if(M.C){ c.vag.forEach(v=>{ if(v.dt) add(v.dt,'unl',v.kg); }); c.reys.forEach(r=>{ if(r.m==='CZ') add(r.d,'out',r.kgQ); }); }
  else c.led.del.forEach(x=>add(x.d,'inn',x.kg));
  ds.forEach(x=>{ if(!(x.dig||x.ship||x.load||x.unl||x.out||x.inn)) return;
    if(site==='MEG'){ const dl=E.delivered(c,x.d,x.d); x.rate=dl.unit; x.norm=dl.unit==null?null:c.NS.total; }
    else { const s=mySum(myLines(c,E.chain(c,x.d,x.d,'day'),site)); x.rate=s.rate; x.norm=s.norm; } });
  return ds; }
function myBarChart(days,cols,H){ const W=Math.max(480,days.length*(cols.length*7+5)+48), pl=34, pb=20, pt=10, h=H-pb-pt, g=[];
  const mx=Math.max(1,...days.map(x=>Math.max(...cols.map(cl=>x[cl.k]||0)))), step=(W-pl-6)/Math.max(1,days.length), bw=Math.max(3,Math.min(14,(step-3)/cols.length));
  [0,.5,1].forEach(f=>{ const y=pt+h*(1-f); g.push(sv('line',{x1:pl,x2:W-4,y1:y.toFixed(1),y2:y.toFixed(1),class:'my-grid'}),sv('text',{x:pl-5,y:(y+3).toFixed(1),class:'my-ax','text-anchor':'end'},fmt(mx*f/1000,0))); });
  days.forEach((x,i)=>{ const x0=pl+i*step+(step-bw*cols.length)/2;
    cols.forEach((cl,j)=>{ const v=x[cl.k]||0, hh=v/mx*h; g.push(sv('rect',{x:(x0+j*bw).toFixed(1),y:(pt+h-hh).toFixed(1),width:Math.max(1,bw-1).toFixed(1),height:Math.max(0,hh).toFixed(1),rx:1.5,class:'my-b '+cl.cls},sv('title',null,fd(x.d)+' · '+cl.l+': '+ft(v)+' t'))); });
    if(days.length<=16||i%Math.ceil(days.length/16)===0) g.push(sv('text',{x:(pl+i*step+step/2).toFixed(1),y:H-5,class:'my-ax','text-anchor':'middle'},x.d.slice(8,10))); });
  return el('div',{class:'my-chart'},sv('svg',{viewBox:'0 0 '+W+' '+H,width:'100%',role:'img','aria-label':'Kunlik hajm, tonna'},g)); }
function myLineChart(days,H){ const vals=[]; days.forEach(x=>{ if(x.rate!=null) vals.push(x.rate); if(x.norm!=null) vals.push(x.norm); });
  if(!vals.length) return el('div',{class:'empty'},"Hisoblangan kun yo'q"); const W=Math.max(480,days.length*16+48), pl=40, pb=20, pt=10, h=H-pb-pt, mx=Math.max(...vals)*1.12||1, step=(W-pl-8)/Math.max(1,days.length), g=[];
  const X=i=>pl+i*step+step/2, Y=v=>pt+h*(1-v/mx);
  [0,.5,1].forEach(f=>{ const y=pt+h*(1-f); g.push(sv('line',{x1:pl,x2:W-4,y1:y.toFixed(1),y2:y.toFixed(1),class:'my-grid'}),sv('text',{x:pl-5,y:(y+3).toFixed(1),class:'my-ax','text-anchor':'end'},fmt(mx*f,0))); });
  const seg=(k,cls)=>{ let d='',on=false; days.forEach((x,i)=>{ if(x[k]==null){ on=false; return; } d+=(on?'L':'M')+X(i).toFixed(1)+' '+Y(x[k]).toFixed(1)+' '; on=true; }); if(d) g.push(sv('path',{d,class:cls})); };
  seg('norm','my-norm'); seg('rate','my-ln');
  days.forEach((x,i)=>{ if(x.rate!=null){ const bad=x.norm!=null&&x.rate>x.norm*(1+(ui.tolMy||0.05)); g.push(sv('circle',{cx:X(i).toFixed(1),cy:Y(x.rate).toFixed(1),r:3,class:'my-dot'+(bad?' over':'')},sv('title',null,fd(x.d)+': '+fmt(x.rate,1)+" so'm/kg"+(x.norm!=null?' (norma '+fmt(x.norm,1)+')':'')))); }
    if(days.length<=16||i%Math.ceil(days.length/16)===0) g.push(sv('text',{x:X(i).toFixed(1),y:H-5,class:'my-ax','text-anchor':'middle'},x.d.slice(8,10))); });
  return el('div',{class:'my-chart'},sv('svg',{viewBox:'0 0 '+W+' '+H,width:'100%',role:'img','aria-label':"Tan narx, so'm/kg"},g)); }
function vMy(){ const c=ctx(), cfg=c.cfg, NS=c.NS, D=ui.D, tol=cfg.tol, my=ui.my, out=[], N=cfg.norms; ui.tolMy=tol;
  const locked=(me&&me.role==='operator'&&MYS[me.site])?me.site:null;
  const site=locked||(MYS[my.site]?my.site:null)||(MYS[ui.op.site]?ui.op.site:null);
  const setSite=s=>{ my.site=s; my.veh=''; lsSet('qz-site',s); ui.op.site=s; mount(); };
  const siteSeg=()=>el('div',{class:'seg',role:'group','aria-label':'Uchastka'},Object.keys(MYS).map(s=>el('button',{type:'button','aria-pressed':String(site===s),onclick:()=>setSite(s)},SITE_NAME[s])));
  if(!site){ out.push(el('section',null,el('h2',null,"Qaysi uchastka hisobotini ko'rasiz?"),el('p',{class:'note'},"Bir marta tanlang — keyin sahifa shu uchastka bilan ochiladi."),siteSeg())); return out; }
  const M=MYS[site], [a,b]=myRange(c), mode=a===b?'day':'mtd';
  const seg=segBtn([['kun','Bugun'],['hafta','7 kun'],['oy','Oy boshidan'],['ora','Oraliq']],my.scope,v=>{ my.scope=v; mount(); });
  const only=el('button',{type:'button',class:'my-tg','aria-pressed':String(!!my.only),onclick:()=>{ my.only=!my.only; mount(); }},"Faqat normadan yuqorilari");
  /* ---- sarlavha va filtrlar ---- */
  const head=el('section',{class:'my-head'},el('div',{class:'sechead'},el('h2',null,'Mening uchastkam: '+SITE_NAME[site]),el('span',{class:'muted'},M.t+' · '+(a===b?fd(a):fd(a)+' – '+fd(b)))),
    el('div',{class:'my-filters'},locked?null:siteSeg(),seg,
      my.scope==='ora'?[el('input',{type:'date',id:'my-from',value:a,'aria-label':'Boshlanish',onchange:ev=>{ my.from=ev.target.value; mount(); }}),el('span',{class:'muted'},'—'),el('input',{type:'date',id:'my-to',value:b,'aria-label':'Tugash',onchange:ev=>{ my.to=ev.target.value; mount(); }})]:null,
      only));
  out.push(head);
  if(b<c.start){ out.push(el('div',{class:'banner'},"Tanlangan davr tizim boshlanishidan ("+fd(c.start)+") oldin — hisobot yo'q.")); return out; }
  const ch=E.chain(c,a,b,mode), L=myLines(c,ch,site), SM=mySum(L), sn=E.snapAt(c,b), st=(f,n,d)=>E.status(f,n,d||'low',tol)[0];
  const tile=o=>el('div',{class:'my-tile'+(o.st&&o.st!=='na'?' '+o.st:'')},el('span',{class:'my-l'},o.l),el('b',{class:'num'},o.v),o.s?el('span',{class:'my-s num'},o.s):null,
    o.pct!=null?el('div',{class:'my-prog','aria-hidden':'true'},el('i',{style:'width:'+Math.max(0,Math.min(100,o.pct)).toFixed(0)+'%'})):null);
  const unit=w=>{ const q=sn[w]?sn[w].q:0; return q>0.5?E.vsum(sn[w].v)/q:null; };
  const whTile=(w,l)=>{ const u=unit(w), nm=NS.wh[w]; return {l,v:ft(E.bal(c,w,b))+' t',s:u==null?"qoldiq yo'q":`tan narxi ${fmt(u,1)} so'm/kg · norma ${fmt(nm,1)}`,st:st(u,nm)}; };
  const tiles=[];
  if(M.K){ const K=L[0], S=L[2], sh=c.reys.filter(r=>E.inr(r.d,a,b)&&!r.kr&&r.from===M.K), shKg=sh.reduce((s,r)=>s+r.kgQ,0), shN=sh.reduce((s,r)=>s+r.rn,0), shJ=sh.reduce((s,r)=>s+r.kgJ,0), plan=E.n(cfg.wh[M.K].plan)||0;
    const avg=shN?shKg/shN:null, ls=sh.reduce((s,r)=>s+Math.max(0,r.loss||0),0);
    tiles.push({l:'Qazilgan qum',v:ft(K.vol)+' t',s:plan>0&&my.scope==='oy'?`oylik reja ${fmt(plan,0)} t · ${fmt(K.vol/1000/plan*100,0)}%`:(K.rate!=null?`qazish tan narxi ${fmt(K.rate,1)} so'm/kg`:null),st:st(K.rate,K.norm),pct:plan>0&&my.scope==='oy'?K.vol/1000/plan*100:null},
      {l:'Stansiyaga tashildi',v:ft(shKg)+' t',s:shN?`${fmt(shN)} reys · o'rtacha ${fmt(avg)} kg/reys`+(ls>0?` · yo'qotish ${ft(ls)} t`:''):"reys yo'q",st:avg==null?null:st(avg,N.reysYuk,'high')},
      whTile(M.K,'Karyer ombori qoldig\'i'),whTile(M.S,"Stansiya ombori qoldig'i"),
      {l:'Vagonga yuklandi',v:ft(S.vol)+' t',s:S.n?`${fmt(S.n)} vagon · o'rtacha ${fmt(S.vol/S.n)} kg`:"vagon yo'q",st:S.n?st(S.vol/S.n,N.vagYuk,'high'):null},
      {l:"Vagondagi qum tan narxi",v:SM.rate==null?'—':fmt(SM.rate,1)+" so'm/kg",s:SM.rate==null?"hajm yo'q":`norma ${fmt(SM.norm,1)} · og'ish ${fs(SM.rate-SM.norm,1)} so'm/kg`,st:st(SM.rate,SM.norm)}); }
  else if(M.C){ const C1=L[0], Z=L[1], vt=c.vag.filter(v=>E.inr(v.dt,a,b)), snt=c.reys.filter(r=>E.inr(r.d,a,b)&&r.m==='CZ'), zk=snt.reduce((s,r)=>s+r.kgQ,0);
    const road=c.vag.filter(v=>v.st==="Yo'lda"), wait=c.vag.filter(v=>v.st==='Chustda vagonda');
    tiles.push({l:'Tushirildi',v:ft(C1.vol)+' t',s:vt.length?`${fmt(vt.length)} vagon · o'rtacha ${fmt(C1.vol/vt.length)} kg`:"vagon yo'q",st:vt.length?st(C1.vol/vt.length,N.vagYuk,'high'):null},
      {l:"Zavodga jo'natildi",v:ft(zk)+' t',s:snt.length?`${fmt(snt.reduce((s,r)=>s+r.rn,0))} reys`:"reys yo'q"},whTile('C01',"Chust ombori qoldig'i"),
      {l:"Yo'lda va tushirilmagan",v:fmt(road.length+wait.length)+' vagon',s:`yo'lda ${fmt(road.length)} · Chustda ${fmt(wait.length)} · ${ft(road.concat(wait).reduce((s,v)=>s+v.kg,0))} t`,st:wait.length&&wait.some(v=>v.kut>N.chustKun)?'warn':null},
      {l:'Chust xarajati',v:C1.rate==null?'—':fmt(C1.rate,1)+" so'm/kg",s:C1.rate==null?null:`norma ${fmt(C1.norm,1)} · og'ish ${fs(C1.dv,1)}`,st:st(C1.rate,C1.norm)},
      {l:"Zavodgacha tashish",v:Z.rate==null?'—':fmt(Z.rate,1)+" so'm/kg",s:Z.rate==null?null:`norma ${fmt(Z.norm,1)} · og'ish ${fs(Z.dv,1)}`,st:st(Z.rate,Z.norm)}); }
  else { const dl=E.delivered(c,a,b), ch1=ch.find(l=>l.id==='avtoZav'), tg=ch.togri;
    tiles.push({l:'Zavodga kelgan qum',v:ft(dl.kg)+' t',s:dl.n?`${fmt(dl.n)} partiya`:"qabul yo'q"},
      {l:"O'rtacha tortilgan tan narx",v:dl.unit==null?'—':fmt(dl.unit,1)+" so'm/kg",s:dl.unit==null?null:`norma ${fmt(NS.total,1)} · og'ish ${fs(dl.unit-NS.total,1)} so'm/kg`,st:st(dl.unit,NS.total)},
      {l:'Jami qiymati',v:fm(dl.val)+' mln',s:dl.unit==null?null:`og'ish ${fs((dl.unit-NS.total)*dl.kg/1e6,2)} mln so'm`,st:dl.unit==null?null:st(dl.unit,NS.total)},
      {l:"Chustdan (avto)",v:ft(ch1?ch1.vol:0)+' t',s:ch1&&ch1.rate!=null?`tashish ${fmt(ch1.rate,1)} · norma ${fmt(ch1.norm,1)} so'm/kg`:null,st:ch1?st(ch1.rate,ch1.norm):null},
      {l:"To'g'ridan kelgan",v:ft(tg?tg.vol:0)+' t',s:tg&&tg.rate!=null?`${fmt(tg.rate,1)} so'm/kg`:null,st:tg?st(tg.rate,tg.norm):null},
      {l:'Bo\'sh turish (jami ichida)',v:dl.kg>0?fmt(dl.idle/dl.kg,1)+" so'm/kg":'—',s:dl.kg>0?fm(dl.idle)+' mln so\'m':null}); }
  out.push(el('div',{class:'my-tiles'},tiles.map(tile)));
  /* ---- qum yo'li ---- */
  const ls=L.filter(l=>l.rate!=null||l.vol>0), maxv=Math.max(1,...ls.map(l=>Math.max(l.rate||0,l.norm||0)));
  const w=v=>Math.max(0,Math.min(100,(v||0)/maxv*100));
  if(ls.length) out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,"Qum yo'li: har bosqichda qancha va qanchadan"),el('span',{class:'muted'},"so'm/kg · och chiziq — norma, to'q — fakt")),
    el('div',{class:'my-flow'},ls.map((l,i)=>{ const s=st(l.rate,l.norm);
      return [i?el('span',{class:'my-arr','aria-hidden':'true'},'→'):null,el('div',{class:'my-step '+s},el('b',null,MYT[l.stage]||l.name),
        el('div',{class:'num my-v'},ft(l.vol)+' t'),el('div',{class:'num my-r'},l.rate==null?'—':fmt(l.rate,1)),el('span',{class:'muted'},l.norm==null?"norma yo'q":'norma '+fmt(l.norm,1)),
        el('div',{class:'bars','aria-hidden':'true'},el('i',{class:'bn',style:'width:'+w(l.norm)+'%'}),el('i',{class:'bf'+(s==='bad'?' over':''),style:'width:'+w(l.rate)+'%'})),
        chip(s==='ok'?'ok':s,E.status(l.rate,l.norm,'low',tol)[1]),l.dsum!=null&&Math.abs(l.dsum)>=5e4?el('span',{class:'num '+(l.dsum>0?'my-pos':'my-neg')},fs(l.dsum/1e6,2)+' mln'):null)]; })),
    SM.rate!=null?el('p',{class:'note'},`Jami: ${fmt(SM.rate,1)} so'm/kg, norma ${fmt(SM.norm,1)}. ${SM.rate>SM.norm*(1+tol)?"Tan narx normadan yuqori — pastdagi «Nimaning hisobiga» va «Mashinalar ta'siri» bo'limlarini ko'ring.":'Tan narx normada.'}`):null));
  /* ---- diqqat + mashinalar ta'siri (top) ---- */
  const V=myVeh(c,site,a,b), sandKg=V.reduce((s,x)=>s+x.sand.kg,0);
  const vr=V.filter(x=>x.sand.n).map(x=>{ const s=x.sand, rate=s.kgN>0?s.cost/s.kgN:null, norm=s.kgN>0?s.nc/s.kgN:null, eff=s.kgN>0?s.cost-s.nc:null;
    return {x,rate,norm,eff,per:eff!=null&&sandKg>0?eff/sandKg:null,avg:s.n?s.kg/s.n:null,st:E.status(rate,norm,'low',tol)}; });
  vr.sort((p,q)=>(q.eff==null?-1e18:q.eff)-(p.eff==null?-1e18:p.eff));
  const top=vr.filter(r=>r.eff>1e4).slice(0,5), mxE=Math.max(1,...top.map(r=>r.eff));
  const lineTop=E.topCauses(L,6);
  out.push(el('div',{class:'two'},
    el('section',null,el('div',{class:'sechead'},el('h2',null,'Diqqat: nimaning hisobiga qimmatlashdi')),el('div',{class:'panel'},causeList(lineTop))),
    el('section',null,el('div',{class:'sechead'},el('h2',null,"Tan narxga eng ko'p ta'sir qilgan mashinalar"),el('span',{class:'muted'},'normadan oshgan summa, mln so\'m')),
      el('div',{class:'panel pad'},top.length?el('div',{class:'my-eff'},top.map(r=>el('button',{type:'button',class:'my-er',onclick:()=>{ my.veh=r.x.key; mount(); setTimeout(()=>{ const e=document.getElementById('my-vdet'); if(e) e.scrollIntoView({block:'start'}); },30); }},
        el('span',{class:'nm'},r.x.label,el('small',null,r.x.firm)),el('span',{class:'bar'},el('i',{style:'width:'+(r.eff/mxE*100).toFixed(0)+'%'})),el('span',{class:'num my-pos'},'+'+fm(r.eff)),
        el('span',{class:'num muted'},r.per==null?'':'+'+fmt(r.per,2)+" so'm/kg")))):el('div',{class:'empty'},vr.length?"Hamma mashina normada.":"Bu davrda reys yo'q.")))));
  /* ---- tan narx tarkibi ---- */
  const body=[], mxr=Math.max(1,...L.map(l=>Math.max(l.rate||0,l.norm||0)),...L.reduce((a2,l)=>a2.concat(l.els.map(e=>Math.max(e.rate||0,e.norm||0))),[]));
  const bar=(f,n)=>{ const ww=v=>Math.max(0,Math.min(100,(v||0)/mxr*100)); return el('div',{class:'bars','aria-hidden':'true'},el('i',{class:'bn',style:'width:'+ww(n)+'%'}),el('i',{class:'bf'+(E.status(f,n,'low',tol)[0]==='bad'?' over':''),style:'width:'+ww(f)+'%'})); };
  L.forEach(l=>{ const els=l.els.filter(e=>!my.only||(e.dv!=null&&e.dv>0)); if(my.only&&!els.length) return; const s=E.status(l.rate,l.norm,'low',tol);
    body.push({cls:'total',cells:[MYT[l.stage]||l.name,l.rate==null?'—':fmt(l.rate,2),l.norm==null?'—':fmt(l.norm,2),fs(l.dv,2),l.dsum==null?'—':fs(l.dsum/1e6,2),bar(l.rate,l.norm),'',chip(s[0],s[1])]});
    els.slice().sort((p,q)=>(q.dsum||0)-(p.dsum||0)).forEach(e=>{ const es=E.status(e.rate,e.norm,'low',tol);
      body.push(['   '+e.name+(e.est>1?' ~':''),e.rate==null?'—':fmt(e.rate,2),e.norm==null?'—':fmt(e.norm,2),fs(e.dv,2),e.dsum==null?'—':fs(e.dsum/1e6,2),bar(e.rate,e.norm),e.cause||'',e.dv!=null?chip(es[0],es[1]):'']); }); });
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Tan narx tarkibi: norma va fakt'),el('span',{class:'muted'},"so'm/kg; og'ish — mln so'm")),
    body.length?table([['Element'],["Fakt, so'm/kg",'r'],['Norma','r'],["Og'ish",'r'],["Og'ish, mln",'r'],['Fakt va norma','w'],['Sabab','w'],['Holat']],body,{name:'Tan narx tarkibi'}):el('div',{class:'panel empty'},my.only?"Normadan oshgan element yo'q.":"Bu davrda ma'lumot yo'q."),
    el('p',{class:'note'},"~ belgisi: doimiy xarajat hali fakt bilan yopilmagan, oylik reja ulushi bilan hisoblangan. Oy yopilganda fakt (oylik jami) kunlarga teng yoyiladi.")));
  /* ---- kunlik dinamika ---- */
  if(a!==b){ const days=myDays(c,site,a,b), cols=M.K?[{k:'dig',l:'Qazildi',cls:'c1'},{k:'ship',l:'Tashildi',cls:'c2'},{k:'load',l:'Vagonga',cls:'c3'}]:(M.C?[{k:'unl',l:'Tushirildi',cls:'c1'},{k:'out',l:"Zavodga jo'natildi",cls:'c2'}]:[{k:'inn',l:'Zavodga kelgan',cls:'c1'}]);
    out.push(el('div',{class:'two'},
      el('section',null,el('div',{class:'sechead'},el('h2',null,'Kunlik hajm, tonna'),el('span',{class:'my-leg'},cols.map(cl=>el('span',null,el('i',{class:'sw '+cl.cls}),cl.l)))),el('div',{class:'panel pad'},myBarChart(days,cols,190))),
      el('section',null,el('div',{class:'sechead'},el('h2',null,'Kunlik tan narx, so\'m/kg'),el('span',{class:'my-leg'},el('span',null,el('i',{class:'sw ln'}),'fakt'),el('span',null,el('i',{class:'sw nm'}),'norma'))),el('div',{class:'panel pad'},myLineChart(days,190))))); }
  /* ---- mashinalar jadvali ---- */
  const vsel=el('select',{id:'my-veh','aria-label':'Mashina',style:'width:auto',onchange:ev=>{ my.veh=ev.target.value; mount(); }},el('option',{value:''},'Hamma mashinalar'),vr.map(r=>el('option',{value:r.x.key},r.x.label+' · '+r.x.firm)));
  vsel.value=vr.some(r=>r.x.key===my.veh)?my.veh:'';
  const vrows=vr.filter(r=>(!my.only||(r.eff!=null&&r.eff>0))&&(!vsel.value||r.x.key===vsel.value));
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,"Mashinalar ta'siri: qaysi mashina tan narxni oshiryapti"),vsel),
    vrows.length?table([['Mashina'],['Kim'],['Reys','r'],['Tonna','r'],["O'rtacha yuk, kg",'r'],['Xarajat, mln','r'],["Fakt, so'm/kg",'r'],['Norma','r'],["Og'ish, mln",'r'],["Tan narxga ta'siri, so'm/kg",'r'],['Holat']],
      vrows.map(r=>{ const s=r.x.sand, kam=s.kam>0?chip('warn','Kam yuk: '+s.kam):null;
        return [el('button',{type:'button',class:'link',onclick:()=>{ my.veh=r.x.key; mount(); }},r.x.label),r.x.firm,fmt(s.n),ft(s.kg),r.avg==null?'—':fmt(r.avg),s.kgN>0?fm(s.cost):'—',r.rate==null?'—':fmt(r.rate,2),r.norm==null?'—':fmt(r.norm,2),r.eff==null?'—':fs(r.eff/1e6,2),
          r.per==null?'—':fs(r.per,2),el('span',{style:'display:inline-flex;gap:4px;flex-wrap:wrap'},chip(r.st[0],r.st[1]),kam)]; })
        .concat([{cls:'total',cells:['Jami','',fmt(vrows.reduce((s,r)=>s+r.x.sand.n,0)),ft(vrows.reduce((s,r)=>s+r.x.sand.kg,0)),'','','','',fs(vrows.reduce((s,r)=>s+(r.eff||0),0)/1e6,2),fs(vrows.reduce((s,r)=>s+(r.per||0),0),2),'']}]),{name:'Mashinalar'}):el('div',{class:'panel empty'},"Bu davrda mos mashina yo'q."),
    el('p',{class:'note'},"Fakt — mashinaga to'langan (o'z mashinasi uchun — dizel, amortizatsiya, haydovchi ish haqidan taqsimlangan) tashish xarajati ÷ qabul qilingan kg. Norma — marshrut tarifi. «Tan narxga ta'siri» — shu mashinaning normadan ortiq (yoki kam) xarajati ÷ uchastkadan tashilgan jami kg: ya'ni 1 kg qum tan narxiga qancha qo'shdi. Kam yuk — reys yuki minimaldan past.")));
  /* ---- tanlangan mashina tafsiloti ---- */
  const cur=V.find(x=>x.key===vsel.value);
  if(cur){ const trips=cur.trips.slice().sort((p,q)=>q.d<p.d?-1:1), sn2=cur.sand, k2=cur.kr;
    const rs=vr.find(r=>r.x.key===cur.key);
    out.push(el('section',{id:'my-vdet'},el('div',{class:'sechead'},el('h2',null,'Mashina: '+cur.label+' · '+cur.firm),el('button',{type:'button',class:'link',onclick:()=>{ my.veh=''; mount(); }},'Yopish ✕')),
      kvTiles([['Reys',fmt(sn2.n+k2.n),fmt(sn2.n)+' qum · '+fmt(k2.n)+' krisha'],['Tashildi',ft(sn2.kg)+' t',sn2.n?"o'rtacha "+fmt(sn2.kg/sn2.n)+' kg/reys':null],
        ["Fakt so'm/kg",rs&&rs.rate!=null?fmt(rs.rate,2):'—',rs&&rs.norm!=null?'norma '+fmt(rs.norm,2):null],["Normadan og'ish",rs&&rs.eff!=null?fs(rs.eff/1e6,2)+' mln':'—',rs&&rs.per!=null?fs(rs.per,2)+" so'm/kg tan narxga":null],
        ["Yo'qotish (tarozi farqi)",ft(sn2.loss)+' t',sn2.loss>0&&sn2.kg?fmt(sn2.loss/(sn2.kg+sn2.loss)*100,2)+'%':null]]),
      table([['Sana'],['Marshrut'],['Reys','r'],['Jo\'natildi, kg','r'],['Qabul, kg','r'],['Xarajat, so\'m','r'],["so'm/kg",'r'],['Norma','r'],['TTN'],['Belgilar']],
        trips.slice(0,120).map(t=>{ const rt=t.costed&&t.kg>0?t.haul/t.kg:null, bad=rt!=null&&t.norm!=null&&rt>t.norm*(1+tol);
          return [fd(t.d),t.rname+(t.kr?' (krisha)':''),fmt(t.rn),fmt(t.kgJ),fmt(t.kg),t.costed?fmt(t.haul):'—',rt==null?'—':fmt(rt,2),t.norm==null?'—':fmt(t.norm,2),t.doc||'—',(t.flags||[]).length?el('span',{style:'display:inline-flex;gap:4px;flex-wrap:wrap'},t.flags.map(f=>chip(f[0],f[1]))):(bad?chip('warn','Normadan yuqori'):chip('ok','✓'))]; }),{name:'Mashina reyslari'})));
  }
  /* ---- texnika va o'z yuk mashinalari ---- */
  const locs=M.K?[M.K,M.S]:(M.C?['C01']:[]);
  const tr=locs.length?E.texRep(c,a,b).filter(x=>locs.indexOf(x.m.loc)>=0&&(x.mh>0||x.l>0)):[];
  if(tr.length) out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Texnika: dizel va unumdorlik normasi')),texTable(c,tr,false)));
  const tk=E.truckRep(c,a,b).filter(x=>mcSite(x.m)===site&&(x.n||x.km||x.l));
  if(tk.length) out.push(el('section',null,el('h2',null,"O'z yuk mashinalari: dizel va reys tannarxi"),truckTable(c,tk)));
  out.push(el('p',{class:'note'},"Hisobot kiritilgan yozuvlardan avtomatik hisoblanadi. Raqam noto'g'ri ko'rinsa — «Kiritish» bo'limida shu kungi yozuvlarni tekshiring (vazn, mashina raqami, moto-soat, dizel)."));
  return out; }

/* ---------- Jurnal sahifalari ---------- */
function defVals(j){ const v={}; J[j].fields.forEach(f=>{ if(!f.hid) v[f.k]=''; }); if('d' in v) v.d=ui.D; if(j==='vagon') { v.dy=ui.D; v.src='S01'; }
  if(j==='reys'){ v.m='KS1'; v.s='MEG'; v.tk=''; } if(j==='mat'){ v.it='DIZEL'; v.op='S'; v.st='S01'; v.sk=''; } if(j==='xar') v.pay='Karta';
  if(j==='tex'){ const m=store.cfg.machines[0]; if(m){ v.mc=m.code; v.loc=m.loc; v.op=m.type==='T'?'':(stageOf(m.loc)==='karyer'?'U':'Y'); } } return v; }
/* Filtr holati: davr (kun / oy / hammasi / oraliq), jurnalga xos tanlovlar, matn bo'yicha qidiruv, faqat belgilanganlar */
function fltOf(j){ return ui.flt[j]||(ui.flt[j]={sc:j==='vagon'?'faol':(j==='inv'?'all':'kun'),from:E.ms(ui.D),to:ui.D,q:'',fl:false,f:{}}); }
const FSEL={
  reys:()=>[['m','Marshrut',store.cfg.routes.map(r=>[r.code,E.rtName(store.cfg,r)])],['tur','Kim tashidi',[['ext','Tashqi logistika'],['own',"O'z transporti"]]],['s','Qum manbai',store.cfg.suppliers.map(s=>[s.code,s.name])]],
  vagon:()=>[['src','Qayerdan',[['S01',store.cfg.wh.S01.name],['S02',store.cfg.wh.S02.name],['TASHQI',"Ta'minotchidan"]]],['st','Holat',[["Yo'lda","Yo'lda"],['Chustda vagonda','Chustda vagonda'],['Tushirilgan','Tushirilgan']]]],
  tex:()=>[['mc','Texnika',store.cfg.machines.map(m=>[m.code,m.name])],['loc',"Bo'g'in",optsLk(LINKS).concat([[TR,"O'z transporti"]])],['op','Ish turi',Object.keys(OPS).map(k=>[k,OPS[k]])]],
  mat:()=>[['it','Material',Object.keys(store.cfg.mats).map(k=>[k,store.cfg.mats[k].name])],['op','Amal',[['S','Sarf'],['K','Kirim']]],['st',"Bo'g'in",optsLk(LINKS)]],
  xar:()=>[['it','Modda',store.cfg.items.map(i=>[i.code,SN[i.stage]+': '+i.name])],['lk',"Bo'g'in",optsLk(LINKS).concat([[TR,"O'z transporti"]])],['pay',"To'lov",[['Karta','Korporativ karta'],['Naqd','Naqd'],['Bank','Bank']]]],
  inv:()=>[['wh','Ombor',optsLk(LINKS)]]
};
function fltBar(j){ const f=fltOf(j), segs=j==='vagon'?[['faol','Faol'],['oy','Oy'],['all','Hammasi'],['ora','Oraliq']]:[['kun','Kun'],['oy','Oy'],['all','Hammasi'],['ora','Oraliq']];
  const df=el('input',{id:'flt-from',type:'date','aria-label':'Boshlanish'}), dt=el('input',{id:'flt-to',type:'date','aria-label':'Tugash'}); df.value=f.from; dt.value=f.to;
  const rng=el('span',{class:'frange',hidden:f.sc!=='ora'},df,el('span',{class:'muted'},'–'),dt);
  df.addEventListener('change',()=>{ if(df.value){ f.from=df.value; refresh(); } }); dt.addEventListener('change',()=>{ if(dt.value){ f.to=dt.value; refresh(); } });
  const seg=el('div',{class:'seg',role:'group','aria-label':'Davr'},segs.map(s=>el('button',{type:'button','aria-pressed':String(f.sc===s[0]),onclick:ev=>{ f.sc=s[0]; rng.hidden=f.sc!=='ora'; [...seg.children].forEach(b=>b.setAttribute('aria-pressed',String(b===ev.currentTarget))); refresh(); }},s[1])));
  const sels=FSEL[j]().map(x=>{ const s=el('select',{id:'flt-'+x[0],'aria-label':x[1]},el('option',{value:''},x[1]+': hammasi'),x[2].map(o=>el('option',{value:o[0]},o[1]))); s.value=f.f[x[0]]||''; s.addEventListener('change',()=>{ f.f[x[0]]=s.value; refresh(); }); return s; });
  const ms=el('select',{id:'flt-imp','aria-label':'Manba'},[['','Manba: hammasi'],['0',"Qo'lda kiritilgan"],['1','Exceldan: alohida yozuv'],['2','Exceldan: oylik jamidan']].map(o=>el('option',{value:o[0]},o[1]))); ms.value=f.imp||''; ms.addEventListener('change',()=>{ f.imp=ms.value; refresh(); }); sels.push(ms);
  const q=el('input',{id:'flt-q',type:'search',placeholder:'Qidirish: raqam, hujjat, izoh…','aria-label':'Qidirish'}); q.value=f.q; q.addEventListener('input',()=>{ f.q=q.value; refresh(); });
  const fl=el('input',{id:'flt-fl',type:'checkbox'}); fl.checked=!!f.fl; fl.addEventListener('change',()=>{ f.fl=fl.checked; refresh(); });
  const clr=el('button',{type:'button',class:'link',onclick:()=>{ ui.flt[j]=null; mount(); }},'Tozalash');
  return el('div',{class:'fbar'},seg,rng,sels,q,j==='inv'?null:el('label',{class:'chk',for:'flt-fl'},fl,'Faqat belgilanganlar'),clr); }
function vJournal(j){ const spec=J[j]; const st=ui.form[j]||(ui.form[j]={vals:defVals(j),edit:null,msg:null});
  const jf=ui.jf||(ui.jf={}), open=!!st.edit||jf[j]===true||(jf[j]==null&&lsGet('qz-jf-'+j)==='1');
  const out=[el('section',null,el('div',{class:'sechead'},el('h2',null,spec.title),st.edit?chip('warn',"Tahrirlanmoqda"):null),canWrite?null:el('p',{class:'note'},spec.sub))];
  if(j==='tex'){ const cx=ctx(), mcs=mcCards(cx); if(mcs) out.push(mcs); if(mcs&&ui.card&&E.mc(cx.cfg,ui.card)) out.push(mcCardView(cx,ui.card)); }
  if(!canWrite) out.push(el('div',{class:'banner'},"Sizda kiritish huquqi yo'q — faqat ko'rish."));
  else if(open) out.push(el('section',{id:'jf-sec'},el('div',{class:'sechead'},el('h3',null,st.edit?'Yozuvni tuzatish':'Yangi yozuv'),
      st.edit?null:el('button',{type:'button',class:'link',id:'jf-close',onclick:()=>{ jf[j]=false; lsSet('qz-jf-'+j,'0'); ui.form[j]=null; ui.del=null; mount(); }},'Shaklni yopish ✕')),el('p',{class:'note'},spec.sub),buildForm(j)));
  else out.push(el('div',{class:'actions',id:'jf-bar'},el('button',{type:'button',class:'pri',id:'jf-open',onclick:()=>{ jf[j]=true; lsSet('qz-jf-'+j,'1'); mount(); const e=document.getElementById('f-'+j), i=e&&e.querySelector('input:not([type=date]),select'); if(i) i.focus(); }},'+ Yangi yozuv'),
      (st.msg&&st.msg[0]==='ok')?el('span',{class:'msg ok',id:'jf-msg'},st.msg[1]):el('span',{class:'muted',style:'font-size:13px;max-width:70ch'},"Kunlik yozuvlarni operatorlar «Kiritish» bo'limidan kiritadi. Bu yerda — to'liq ro'yxat; yozuv qo'shish yoki tuzatish kerak bo'lsa, shaklni oching.")));
  if(j==='vagon') vagSection(ctx()).forEach(x=>out.push(x));
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,"Yozuvlar")),fltBar(j),el('div',{id:'list'},listFor(j))));
  return out; }
/* Shakl. opt berilmasa — jurnalning to'liq shakli. opt — operator vazifasi: key (holat kaliti), fields (ko'rsatiladigan maydonlar, tartibi bilan),
   fix (oldindan belgilangan qiymatlar — ko'rsatilmaydi), lim (tanlov ro'yxatini toraytirish), lab (sodda nom), req (majburiy maydonlar),
   calc (reys soni × m³ → kg hisoblagichi). Ko'rsatilmagan maydon tahrirda o'z qiymatini saqlaydi. */
function buildForm(j,opt){ const spec=J[j], key=opt?opt.key:j, st=ui.form[key], fix=(opt&&opt.fix)||{}, lab=(opt&&opt.lab)||{}, lim=(opt&&opt.lim)||{}, rq=(opt&&opt.req)||[];
  const vis=fd=>!fd.hid&&!(fd.k in fix)&&(!opt||!opt.fields||opt.fields.indexOf(fd.k)>=0);
  Object.assign(st.vals,fix);
  const FL=spec.fields.filter(vis); if(opt&&opt.fields) FL.sort((a,b)=>opt.fields.indexOf(a.k)-opt.fields.indexOf(b.k));
  const f=el('form',{class:'entry'+(opt&&opt.fields?' op':''),id:'f-'+key,novalidate:true});
  const wraps={}, inps={}, dh=[];
  const hints=()=>dh.forEach(x=>{ let t=''; try{ t=x[0].dhint(st.vals)||''; }catch(e){} x[1].textContent=t; x[1].hidden=!t; });
  const need=fd=>!!(fd.req||rq.indexOf(fd.k)>=0||(fd.reqIf&&fd.reqIf(st.vals)));
  const fill=(fd,inp)=>{ const cur=st.vals[fd.k]; inp.replaceChildren(); if(!fd.req&&!fd.noBlank&&rq.indexOf(fd.k)<0) inp.append(el('option',{value:''},'—'));
    let os=fd.opts(st.vals); if(lim[fd.k]) os=os.filter(o=>lim[fd.k](o[0],st.vals)); os.forEach(o=>inp.append(el('option',{value:o[0]},o[1])));
    inp.value=cur==null?'':cur; if(inp.selectedIndex<0&&inp.options.length) inp.selectedIndex=0; st.vals[fd.k]=inp.value; };
  const sync=()=>{ FL.forEach(fd=>{ if(fd.t==='sel'){ if(fd.dyn) fill(fd,inps[fd.k]); else if(inps[fd.k].value!==String(st.vals[fd.k]==null?'':st.vals[fd.k])){ inps[fd.k].value=st.vals[fd.k]; } } if(fd.show) wraps[fd.k].hidden=!fd.show(st.vals); }); };
  FL.forEach(fd=>{ const id='f-'+key+'-'+fd.k; let inp;
    if(fd.t==='sel'){ inp=el('select',{id}); inps[fd.k]=inp; fill(fd,inp); }
    else { inp=el('input',{id,type:fd.t==='date'?'date':'text',placeholder:fd.ph||(fd.t==='num'?'0':null),autocomplete:'off',maxlength:fd.t==='text'?200:null}); inps[fd.k]=inp;
      if(fd.t==='num'){ numMask(inp); const cur=st.vals[fd.k]; inp.value=cur==null||cur===''?'':(typeof cur==='number'?fmtIn(cur):fmtTyped(String(cur))); st.vals[fd.k]=inp.value; }
      else inp.value=st.vals[fd.k]==null?'':st.vals[fd.k]; }
    const chg=()=>{ st.vals[fd.k]=inp.value; inp.classList.remove('err'); if(fd.t==='sel'){ if(fd.on){ fd.on(st.vals); Object.assign(st.vals,fix); } sync(); } hints(); };
    inp.addEventListener('input',chg); inp.addEventListener('change',chg);
    const star=fd.req||rq.indexOf(fd.k)>=0;
    wraps[fd.k]=el('div',{class:'fld'+(fd.t==='num'?' fnum':'')},el('label',{for:id},(lab[fd.k]||fd.l)+(star?' *':'')),inp,(fd.hint&&!lab[fd.k])?el('small',null,fd.hint):null);
    if(fd.dhint){ const sm=el('small',{class:'dh',id:id+'-dh'}); wraps[fd.k].append(sm); dh.push([fd,sm]); }
    if(opt&&opt.calc&&opt.calc.k===fd.k){ const N=store.cfg.norms, a=el('input',{type:'text',id:id+'-rn',placeholder:'0','aria-label':'Reys soni'}), b=el('input',{type:'text',id:id+'-m3','aria-label':'Bir reys hajmi, m³'}); numMask(a); numMask(b); b.value=fmtIn(E.n(N.krReys)||25);
      const run=()=>{ const n=pnum(a.value), m=pnum(b.value); if(n>0&&m>0){ const z=E.n(N[opt.calc.z])||1.5; inp.value=fmtIn(Math.round(n*m*z*1000)); st.vals[fd.k]=inp.value; st.calc=fmt(n)+' reys × '+fmtIn(m)+' m³'; inp.classList.remove('err'); } };
      a.addEventListener('input',run); b.addEventListener('input',run);
      wraps[fd.k].append(el('div',{class:'calc'},el('span',null,'yoki'),a,el('span',null,'reys ×'),b,el('span',null,'m³'))); wraps[fd.k].classList.add('wide'); }
    f.append(wraps[fd.k]); });
  sync(); hints();
  const msg=el('span',{class:'msg '+(st.msg?st.msg[0]:''),id:'f-'+key+'-msg',role:'status'},st.msg?st.msg[1]:'');
  const acts=el('div',{class:'actions'},el('button',{class:'pri',type:'submit'},st.edit?"O'zgarishni saqlash":'Saqlash'));
  const close=()=>{ ui.form[key]=null; ui.del=null; if(opt&&ui.op.task&&key.indexOf('op-')===0) ui.op.task=null; };
  if(st.edit){ acts.append(el('button',{type:'button',onclick:()=>{ close(); mount(); }},'Bekor qilish'));
    if(ui.del===st.edit.id) acts.append(el('button',{type:'button',class:'danger',onclick:async()=>{ try{ await delRow(j,st.edit); close(); toast("O'chirildi. Tarix bo'limidan tiklash mumkin."); mount(); }catch(e){ toast(errMsg(e)); } }},"Ha, o'chirilsin"));
    else acts.append(el('button',{type:'button',class:'danger',onclick:()=>{ui.del=st.edit.id;mount();}},"O'chirish")); }
  acts.append(msg); f.append(acts);
  f.addEventListener('submit',async ev=>{ ev.preventDefault(); const row={}, bad=[];
    spec.fields.forEach(fd=>{ if(fd.hid){ row[fd.k]=st.edit&&st.edit[fd.k]!=null?st.edit[fd.k]:null; return; }
      if(fd.k in fix){ row[fd.k]=fix[fd.k]; return; }
      if(!vis(fd)){ row[fd.k]=st.edit&&st.edit[fd.k]!=null?st.edit[fd.k]:null; return; }
      const inp=inps[fd.k]; let v=st.vals[fd.k]; const hidden=fd.show&&!fd.show(st.vals);
      if(hidden){ row[fd.k]=null; return; }
      if(fd.t==='num'){ v=pnum(v); if(v!==null&&(isNaN(v)||v<0)){ bad.push(lab[fd.k]||fd.l); inp.classList.add('err'); } }
      else v=(v==null?'':String(v).trim())||null;
      if(need(fd)&&(v==null)){ bad.push(lab[fd.k]||fd.l); inp.classList.add('err'); }
      row[fd.k]=v; });
    if(st.calc&&('n' in row)&&!row.n) row.n=st.calc;
    if(j==='reys'){ const rt=E.route(store.cfg,row.m), N=store.cfg.norms; if(rt&&rt.to===OTV){ row.wj=null; row.s=null; row.sp=null; if(row.rn>0&&row.wq==null) row.wq=Math.round(row.rn)*(E.n(N.krReys)||25)*(E.n(N.krZich)||1.5)*1000; } if(row.rn!=null) row.rn=Math.max(1,Math.round(row.rn)); }
    if(j==='reys'&&row.wj==null&&row.wq==null){ bad.push('Vazn'); }
    if(j==='vagon'){ const ownW=row.src!=='TASHQI', mark=k=>{ if(inps[k]) inps[k].classList.add('err'); };
      if(ownW&&!row.dy){ bad.push('Yuklangan sana'); mark('dy'); }
      if(!ownW&&!row.dy&&!row.dk&&!row.dt){ bad.push('Sana'); }
      if(!ownW&&!row.s){ bad.push("Ta'minotchi"); }
      if(row.dy&&row.dk&&row.dk<row.dy){ bad.push('Chustga kelgan sana yuklangan sanadan oldin'); mark('dk'); }
      if(row.dt&&row.dk&&row.dt<row.dk){ bad.push('Tushirilgan sana kelgan sanadan oldin'); mark('dt'); }
      if(row.dt&&!row.dk&&row.dy&&row.dt<row.dy){ bad.push('Tushirilgan sana yuklangan sanadan oldin'); mark('dt'); }
      if(ownW&&row.dt&&!row.dk){ bad.push('Chustga kelgan sana'); mark('dk'); } }
    let audRow=false;
    if(j==='tex'){ const m=E.mc(store.cfg,row.mc), tk=isTk(row), nOn=tankOnAt(row.mc,row.d), eid=st.edit&&st.edit.id;
      audRow=row.bak!=null&&(tk||row.op==='A'); if(!audRow) row.bak=null;
      if(audRow){ if(tk){ if(row.km!=null||row.l!=null) bad.push("bak o'lchovi alohida yozuv — km va dizelni bo'sh qoldiring"); row.loc=TR; row.op=null; } else { row.loc=m?m.loc:row.loc; row.op='A'; row.mh=null; row.l=null; row.kg=null; } row.mr=null; row.km=tk?row.km:null;
        if(m&&E.n(m.bakV)>0&&row.bak>m.bakV*1.02) bad.push(`o'lchov bak sig'imidan (${fmt(m.bakV,0)} l) katta`);
        if(store.rows.tex.some(r=>E.n(r.bak)!=null&&r.d===row.d&&r.mc===row.mc&&r.id!==eid)) bad.push("bu texnikaning shu kungi bak o'lchovi allaqachon bor — ro'yxatdan «Tuzatish» orqali o'zgartiring"); }
      else if(tk){ row.loc=TR; row.op=null; if(!(row.km>0)&&!(nOn&&row.l>0)) bad.push('Km'); }
      else { if(!(row.mh>0)&&row.l>0&&!nOn) bad.push('Moto-soat'); if(row.op==='K'&&stageOf(row.loc)!=='karyer') bad.push("Krisha ochish faqat karyerda bo'ladi");
        if(row.op==='U'){ row.kg=null; if(!(row.mh>0)&&!(nOn&&row.l>0)) bad.push('Moto-soat'); if(store.rows.tex.some(r=>r.op==='U'&&r.d===row.d&&r.mc===row.mc&&r.loc===row.loc&&r.id!==eid)) bad.push("bu texnikaning shu kungi yozuvi allaqachon bor — pastdagi ro'yxatdan «Tuzatish» orqali o'zgartiring"); }
        if(row.op==='Q'&&row.kg!=null&&!(row.kg>0)) bad.push('Qazilgan qum, kg'); if(row.op==='Q'&&KQ.indexOf(row.loc)<0) bad.push("Qum faqat karyerda qaziladi"); } }
    if(j==='reys'&&row.tk){ const m=E.mc(store.cfg,row.tk); row.a=m&&m.plate?m.plate:(m?m.name:null); row.c=null; row.t=null; row.tt=null; }
    /* Faktlar yozuvning o'zida saqlanadi: sozlamadagi tarif yoki narx keyin o'zgarsa, o'tgan yozuv o'zgarmaydi */
    if(j==='reys'){ const rt=E.route(store.cfg,row.m); if(rt){ if(!row.tk){ if(row.t==null) row.t=rt.tarif; if(!row.tt||!st.edit||st.edit.m!==row.m) row.tt=rt.type; }
        if(rt.from==='TASHQI'&&row.sp==null){ const sp=store.cfg.suppliers.find(x=>x.code===row.s); if(sp&&sp.price>0) row.sp=+sp.price; } if(rt.from!=='TASHQI') row.sp=null; } }
    if(j==='vagon'&&row.src==='TASHQI'&&row.sp==null){ const sp=store.cfg.suppliers.find(x=>x.code===row.s); if(sp&&sp.price>0) row.sp=+sp.price; }
    if(j==='tex'){ const m=E.mc(store.cfg,row.mc), rate=m?E.mcRate(m):0;
      if(audRow){ row.ar=null; row.nl=null; }
      else { if(row.ar==null||!st.edit||st.edit.mc!==row.mc) row.ar=rate>0?rate:null;
        /* dizel normasi yozuvning o'zida: Normativlarda keyin o'zgarsa, o'tgan yozuv o'zgarmaydi */
        if(row.nl==null||!st.edit||st.edit.mc!==row.mc) row.nl=(m&&E.n(m.normL)!=null)?+m.normL:null; } }
    if(j==='xar'&&(!st.edit||st.edit.it!==row.it)){ const v=E.sh(store.cfg.items.find(i=>i.code===row.it)); row.sh=v<1?v:null; }      /* ulush kiritilgan paytdagi qiymati bilan saqlanadi */
    if(bad.length){ st.msg=['bad',"To'ldiring yoki tuzating: "+bad.join(', ')]; msg.className='msg bad'; msg.textContent=st.msg[1]; return; }
    row.id=st.edit?st.edit.id:rid(); row.demo=st.edit?st.edit.demo:null;
    const prev=st.edit; const btn=f.querySelector('button.pri'); btn.disabled=true;
    try{ await saveRow(j,row,prev);
      const nv=Object.assign(defVals(j),(opt&&opt.def)||{},fix); FL.forEach(fd=>{ if(fd.keep) nv[fd.k]=st.vals[fd.k]; }); const allDone=!!(opt&&opt.next&&!prev&&opt.next(nv,row)===false);
      ui.form[key]={vals:nv,edit:null,msg:['ok',prev?"O'zgarish saqlandi":'Saqlandi — keyingisini kiritishingiz mumkin']}; ui.del=null;
      if(opt&&opt.id==='qab'){ ui.form[key]=null; ui.op.task=null; toast('Qabul qilindi'); }
      if(allDone){ ui.form[key]=null; ui.op.task=null; toast('Saqlandi. Shu kunga hamma texnika kiritildi.'); }
      mount();
      const first=FL.find(fd=>!fd.keep); const fe=first&&document.getElementById('f-'+key+'-'+first.k); if(fe&&!prev) fe.focus();
    }catch(e){ btn.disabled=false; st.msg=['bad',errMsg(e)]; msg.className='msg bad'; msg.textContent=st.msg[1]; }
  });
  return f; }
function editBtn(j,r){ if(!canWrite) return ''; return el('button',{class:'link',type:'button','aria-label':'Tahrirlash',onclick:()=>{ const v={}; J[j].fields.forEach(f=>{ if(!f.hid) v[f.k]=r[f.k]==null?'':(f.t==='num'?fmtIn(r[f.k]):r[f.k]); }); ui.form[j]={vals:v,edit:r,msg:null}; ui.del=null; if(ui.tab!==j){ go(j); return; } mount(); window.scrollTo({top:0,behavior:'auto'}); }},'Tahrir'); }
const flagCell=(r,fl)=>{ const a=(fl||[]).map(f=>chip(f[0],f[1])); if(r.demo) a.push(chip('demo','Namuna')); if(r.imp===2) a.push(chip('demo','Oylik jamidan')); else if(r.imp===1) a.push(chip('na','Excel')); return a.length?el('span',{style:'display:inline-flex;gap:4px;flex-wrap:wrap'},a):chip('ok','✓'); };
/* Jurnal ro'yxati: davr → tanlovlar → qidiruv → jadval va jami. Jami har doim filtrlangan qatorlar bo'yicha. */
function listFor(j){ const c=ctx(), D=ui.D, f=fltOf(j), sc=f.sc; let rows, heads, cells, foot=null; const extra=[];
  const ra=sc==='all'||sc==='faol'?'0000-00-00':(sc==='oy'?E.ms(D):(sc==='ora'?(f.from||'0000-00-00'):D)), rb=sc==='all'||sc==='faol'?'9999-12-31':(sc==='oy'?E.me(D):(sc==='ora'?(f.to||'9999-12-31'):D));
  const inS=d=>E.inr(d,ra,rb), F=f.f, sel=(k,v)=>!F[k]||F[k]===v;
  const srt=(x,y)=>(J[j].date(y)||'').localeCompare(J[j].date(x)||'')||(y.at||0)-(x.at||0);
  const sup=code=>(c.cfg.suppliers.find(s=>s.code===code)||{}).name;
  const flagged=r=>(r._fl||r.flags||[]).some(x=>x[0]==='bad'||x[0]==='warn');
  if(j==='reys'){ rows=c.reys.filter(r=>inS(r.d)&&sel('m',r.m)&&sel('s',r.s)&&(!F.tur||(F.tur==='own')===r.own));
    heads=[['Sana'],['Marshrut'],['Manba'],['Mashina'],['Kim tashidi'],['Reys','r'],["Jo'nat., kg",'r'],['Qabul, kg','r'],["Yo'qot., kg",'r'],["Tashuv, so'm",'r'],["so'm/kg",'r'],["Qum, so'm",'r'],['TTN'],['Holat'],['']];
    cells=r=>[fd(r.d),r.rname,r.kr?'—':(sup(r.s)||'—'),r.a||'—',r.own?"O'z transporti":(r.c||'Tashqi'),fmt(r.rn),r.wj==null?'—':fmt(r.wj),r.wq==null?'—':fmt(r.wq),r.loss?fmt(r.loss):'—',fmt(r.haul),r.perKg==null?'—':fmt(r.perKg,1),r.sand?fmt(r.sand):'—',r.doc||'—',flagCell(r,r.flags),editBtn(j,r)];
    foot=rows=>[`Jami: ${fmt(rows.length)} yozuv`,'','','','',fmt(rows.reduce((s,r)=>s+r.rn,0)),fmt(rows.reduce((s,r)=>s+(r.wj==null?0:r.kgJ),0)),fmt(rows.reduce((s,r)=>s+r.kgQ,0)),fmt(rows.reduce((s,r)=>s+r.loss,0)),fmt(rows.reduce((s,r)=>s+r.haul,0)),'',fmt(rows.reduce((s,r)=>s+r.sand,0)),'','',''];
    extra.push(rows=>{ const ow=rows.filter(r=>r.own), exr=rows.filter(r=>!r.own), sm=(x,g)=>x.reduce((s,r)=>s+g(r),0), nx=sm(exr,r=>r.rn), no=sm(ow,r=>r.rn), kq=sm(rows.filter(r=>r.kr),r=>r.kgQ);
      return el('p',{class:'note',style:'margin-top:6px'},`Tashqi logistika: ${fmt(nx)} reys, ${fmt(sm(exr,r=>r.haul))} so'm`+(nx?` (${fmt(sm(exr,r=>r.haul)/nx)} so'm/reys)`:'')+`. O'z transporti: ${fmt(no)} reys, ${fmt(sm(ow,r=>r.haul))} so'm`+(no?` (${fmt(sm(ow,r=>r.haul)/no)} so'm/reys — oy bo'yicha taqsimlangan tannarx)`:'')+'.'+(kq?` Shundan krisha: ${ft(kq)} t — qum omboriga kirmaydi, xarajati krisha hovuziga tushadi.`:'')); }); }
  else if(j==='vagon'){ rows=c.vag.concat(c.vagX).filter(v=>(sc==='faol'?(v.st!=='Tushirilgan'||v.dt===D||v.dy===D):(sc==='all'||inS(v.dy)||inS(v.dk)||inS(v.dt)))&&sel('src',v.src)&&sel('st',v.st));
    heads=[['Vagon №'],['Nakladnoy'],['Qayerdan'],['Yuklangan'],['Kelgan (≈ kutilmoqda)'],['Tushirilgan'],['Vazn, kg','r'],['Holat'],["Yo'lda, kun",'r'],['Kutish, kun','r'],["T/y tarifi",'r'],['Chust xarajati','r'],['GU-46','r'],['Tekshiruv'],['']];
    const sc2={'Tushirilgan':'ok',"Yo'lda":'na','Chustda vagonda':'warn','Kelgusi':'na',"Ta'minotchidan yo'lda":'na'};
    cells=v=>[v.no||'—',v.nak||'—',v.ext?(sup(v.s)||'Tashqi'):E.whName(c.cfg,v.src),fd(v.dy),v.dk?fd(v.dk):(v.eta&&v.st==="Yo'lda"?'≈ '+fd(v.eta):'—'),fd(v.dt),fmt(v.kg),chip(sc2[v.st]||'na',v.st),v.yol==null?'—':fmt(v.yol),v.kut==null?'—':fmt(v.kut),(v.pre&&!v.tyH)?'—':fmt(v.tyH)+(E.n(v.ty)==null&&v.tyH?' ~':''),fmt(v.podH+v.tushH)+((E.n(v.pod)==null||E.n(v.tush)==null)&&v.dt?' ~':''),v.guH?fmt(v.guH):'—',flagCell(v,v.flags),editBtn(j,v)];
    foot=rows=>[`Jami: ${fmt(rows.length)} vagon`,'','','','','',fmt(rows.reduce((s,v)=>s+v.kg,0)),'','','',fmt(rows.reduce((s,v)=>s+(v.pre?0:v.tyH),0)),fmt(rows.reduce((s,v)=>s+v.podH+v.tushH,0)),fmt(rows.reduce((s,v)=>s+v.guH,0)),'',''];
    extra.push(()=>el('p',{class:'note',style:'margin-top:6px'},"~ belgisi: fakt summa kiritilmagan, norma bo'yicha hisoblangan. ≈ belgisi: kutilayotgan kelish sanasi (yuklangan sana + o'rtacha tranzit). «Boshlang'ich» — tizim boshlanishidan oldin yuklangan vagon: tarifi boshlang'ich qoldiq qiymati ichida.")); }
  else if(j==='tex'){ const all=c.tex.filter(r=>inS(r.d)&&sel('mc',r.mc)&&sel('loc',r.loc)&&sel('op',r.op)), trk=all.filter(r=>r.truck).sort(srt); rows=all.filter(r=>!r.truck);
    rows.forEach(r=>{ r._fl=r.aud?r.flags:r.flags.filter(x=>x[0]!=='na').concat((r.has||r.qo)?[]:[['warn',"Norma yo'q"]]).concat(r.op==='U'&&r.ku>0?[['na','krishaga '+fmt(r.ku*100,0)+'%']]:[]).concat(r.op==='U'&&r.kl>0?[['na','yuklashga '+fmt(r.kl*100,0)+'%']]:[]); }); trk.forEach(r=>{ r._fl=r.aud?r.flags:r.flags.filter(x=>x[0]!=='na').concat(r.has?[]:[['warn',"Norma yo'q"]]); });
    heads=[['Sana'],['Texnika'],["Bo'g'in"],['Ish'],['Moto-soat','r'],['Quyildi, l','r'],['Sarf, l','r'],['Bak, l','r'],['l/m-s','r'],['norma','r'],['Ortiqcha, l','r'],['Hajm, t','r'],['t/m-s','r'],['norma','r'],['Kam, t','r'],["Dizel, so'm",'r'],["Amort., so'm",'r'],["so'm/t",'r'],['norma','r'],['Operator'],['Holat'],['']];
    const tkc=r=>r.tank==null?'—':fmt(r.tank,0)+(r.aud?' ✓':''), csc=r=>fmt(r.cons,0)+(r.nm?' ~':'');
    cells=r=>r.aud?[fd(r.d),r.m.name,E.whName(c.cfg,r.loc),OPS.A,'—','—','—',tkc(r),'—',r.nL==null?'—':fmt(r.nL,1),r.ogL==null?'—':fs(r.ogL,0),'—','—','—','—','—','—','—','—',r.who||'—',flagCell(r,r._fl),editBtn(j,r)]
      :[fd(r.d),r.m.name,E.whName(c.cfg,r.loc),OPS[r.op]||r.op,fmt(r.mh,1),fmt(r.l,0),r.qo?'—':csc(r),tkc(r),r.lmh==null?'—':fmt(r.lmh,1),r.nL==null?'—':fmt(r.nL,1),(r.overL==null||r.qo)?'—':fs(r.overL,0),r.op==='B'?'—':fmt(r.t,1)+(r.kgD?' ≈':''),r.tmh==null?'—':fmt(r.tmh,1),r.nT==null?'—':fmt(r.nT,1),r.shortT==null?'—':fs(r.shortT,1),fmt(r.dz),fmt(r.am),r.perT==null?'—':fmt(r.perT,0),r.normPerT==null?'—':fmt(r.normPerT,0),r.who||'—',flagCell(r,r._fl),editBtn(j,r)];
    foot=rows=>[`Jami: ${fmt(rows.length)} yozuv`,'','','',fmt(rows.reduce((s,r)=>s+r.mh,0),1),fmt(rows.reduce((s,r)=>s+r.l,0)),fmt(rows.reduce((s,r)=>s+r.cons,0)),'','','',fs(rows.reduce((s,r)=>s+(r.overL||0),0),0),fmt(rows.reduce((s,r)=>s+((r.op==='B'||(r.qo&&rows.some(x=>!x.qo&&!x.truck)))?0:r.t),0),1),'','','',fmt(rows.reduce((s,r)=>s+r.dz,0)),fmt(rows.reduce((s,r)=>s+r.am,0)),'','','','',''];
    const pa=ra<c.start?c.start:ra, pb=rb>'9000'?D:rb;
    extra.push(()=>[el('h3',{style:'margin-top:14px'},"Texnika bo'yicha jami"),texTable(c,E.texRep(c,ra,rb),true),
      el('p',{class:'note',style:'margin-top:6px'},"«Quyildi» — bakka quyilgan dizel; «Sarf» — xarajatga olingan: ~ belgisi bilan norma bo'yicha (moto-soat × norma), belgisiz — quyilganning o'zi (bak hali o'lchanmagan yoki norma yo'q). «Bak» — hisobdagi qoldiq, ✓ — o'lchangan. Ortiqcha dizel: fakt usulida = quyilgan − norma × moto-soat; norma usulida = bak o'lchovidagi farq (hisobda − o'lchangan). l/m-s fakt = (sarf + o'lchov farqi) ÷ moto-soat. Kam bajarilgan hajm = norma × moto-soat − fakt. so'm/t = (dizel + amortizatsiya) ÷ hajm."),
      (trk.length||E.trucks(c.cfg).length)?[el('h3',{style:'margin-top:14px'},"Yuk mashinalari: kunlik yozuvlar"),
        trk.length?table([['Sana'],['Mashina'],['Km','r'],['Quyildi, l','r'],['Sarf, l','r'],['Bak, l','r'],['l/100 km','r'],['norma','r'],['Ortiqcha, l','r'],["Dizel, so'm",'r'],["Amortizatsiya, so'm",'r'],['Haydovchi'],['Holat'],['']],
          trk.map(r=>r.aud?[fd(r.d),r.m.name,"Bak o'lchandi",'—','—',tkc(r),'—',r.nL==null?'—':fmt(r.nL,1),r.ogL==null?'—':fs(r.ogL,0),'—','—',r.who||'—',flagCell(r,r._fl),editBtn(j,r)]
            :[fd(r.d),r.m.name,fmt(r.km,0),fmt(r.l,0),csc(r),tkc(r),r.lmh==null?'—':fmt(r.lmh,1),r.nL==null?'—':fmt(r.nL,1),r.overL==null?'—':fs(r.overL,0),fmt(r.dz),fmt(r.am),r.who||'—',flagCell(r,r._fl),editBtn(j,r)])):el('div',{class:'panel empty'},"Bu davrda yuk mashinasi yozuvi yo'q."),
        el('h3',{style:'margin-top:14px'},"Yuk mashinalari bo'yicha jami va reys tannarxi"),truckTable(c,E.truckRep(c,pa,pb)),
        el('p',{class:'note',style:'margin-top:6px'},"Reyslar soni va tashilgan hajm Reyslar jurnalidan olinadi. Jami tannarx = mashinaning dizeli va amortizatsiyasi + haydovchilar ish haqi va boshqa transport xarajatlaridan ulushi.")]:null]); }
  else if(j==='mat'){ rows=c.mat.filter(r=>inS(r.d)&&sel('it',r.it)&&sel('op',r.op)&&(!F.st||r.st===F.st));
    heads=[['Sana'],['Material'],['Amal'],['Miqdor','r'],['Birlik'],['Narx','r'],["Summa, so'm",'r'],["Bo'g'in"],['Izoh','w'],['Holat'],['']];
    const prOf=r=>r.op==='K'?(E.n(r.p)||0):E.pr(c.P,r.it,r.d,SITE_OF[r.st]);
    cells=r=>{ const m=c.cfg.mats[r.it]||{name:r.it,unit:''}, pr=prOf(r); return [fd(r.d),m.name,r.op==='K'?'Kirim':'Sarf',fmt(r.q,1),m.unit,fmt(pr,0),fmt((E.n(r.q)||0)*pr),r.op==='K'?(SITE_NAME[r.sk]?SITE_NAME[r.sk]+' ombori':'umumiy ombor'):E.whName(c.cfg,r.st),r.n||'',flagCell(r,[]),editBtn(j,r)]; };
    foot=rows=>[`Jami: ${fmt(rows.length)} yozuv`,'','','','','',fmt(rows.reduce((s,r)=>s+(E.n(r.q)||0)*prOf(r)*(r.op==='K'?0:1),0)),'sarf summasi','','',''];
    const txl=c.tex.reduce((s,t)=>s+t.l,0);
    extra.push(()=>[el('h3',{style:'margin-top:14px'},"Ombor holati (hamma davr)"),table([['Material'],['Ombor'],['Kirim','r'],['Sarf','r'],['Qoldiq','r'],["O'rtacha narx",'r']],
      [].concat(...Object.keys(c.cfg.mats).map(k=>{ const p=c.P[k], nm=c.cfg.mats[k].name+', '+c.cfg.mats[k].unit, st=Object.keys(p.st); return [[nm,st.length?'umumiy':'—',fmt(p.inq,1),fmt(p.outq,1),fmt(p.stock,1),fmt(p.price,0)]].concat(st.map(x=>[nm,SITE_NAME[x],fmt(p.st[x].inq,1),fmt(p.st[x].outq,1),fmt(p.st[x].stock,1),fmt(p.st[x].price,0)])); }))),
      el('p',{class:'note',style:'margin-top:6px'},`Dizel sarfiga Texnika jurnalida «quyildi» deb yozilgan ${fmt(txl)} l ham kiradi (ombordan texnika bakiga).`)]); }
  else if(j==='xar'){ rows=c.xar.filter(r=>inS(r.d)&&sel('it',r.it)&&sel('lk',r.lk)&&sel('pay',r.pay));
    rows.forEach(r=>{ const fl=[]; if(r.pay==='Naqd'&&!r.doc) fl.push(['warn','Hujjatsiz naqd']); if(!c.item[r.it]) fl.push(['bad',"Modda yo'q"]); r._fl=fl; });
    heads=[['Sana'],["Bo'g'in"],['Modda'],['Texnika'],["Summa, so'm",'r'],["To'lov"],["Kim"],['Hujjat'],['Izoh','w'],['Holat'],['']];
    const pn={Karta:'Korp. karta',Naqd:'Naqd',Bank:'Bank'};
    cells=r=>{ const it=c.item[r.it], mc=c.cfg.machines.find(m=>m.code===r.mc); return [fd(r.d),E.whName(c.cfg,r.lk),it?it.name:r.it,mc?mc.name:'—',fmt(r.sum),pn[r.pay]||r.pay,r.who||'—',r.doc||'—',r.n||'',flagCell(r,r._fl),editBtn(j,r)]; };
    foot=rows=>[`Jami: ${fmt(rows.length)} yozuv`,'','','',fmt(rows.reduce((s,r)=>s+(E.n(r.sum)||0),0)),'','','','','',''];
    extra.push(rows=>{ if(!rows.length) return null; const pv=(title,keyf,lab)=>{ const p=E.pivot(rows,keyf); const tot=p.reduce((s,x)=>({K:s.K+x.Karta,N:s.N+x.Naqd,B:s.B+x.Bank,T:s.T+x.tot}),{K:0,N:0,B:0,T:0});
        return el('section',null,el('h3',null,title),table([[lab],['Korp. karta','r'],['Naqd','r'],['Bank','r'],['Jami','r'],['Yozuv','r']],p.map(x=>[x.k,fmt(x.Karta),fmt(x.Naqd),fmt(x.Bank),fmt(x.tot),x.n]).concat([{cls:'total',cells:['Jami',fmt(tot.K),fmt(tot.N),fmt(tot.B),fmt(tot.T),rows.length]}]))); };
      return el('div',{class:'two',style:'margin-top:14px'},pv("Bo'g'inlar bo'yicha",x=>E.whName(c.cfg,x.lk),"Bo'g'in"),pv("Kim sarfladi",x=>x.who,'Shaxs')); }); }
  else { rows=store.rows.inv.filter(r=>inS(r.d)&&sel('wh',r.wh));
    heads=[['Sana'],['Ombor'],['Hisobda, kg','r'],['Haqiqiy, kg','r'],['Farq, kg','r'],['Farq, %','r'],["Farq, so'm",'r'],['Holat'],['Izoh','w'],['']];
    cells=r=>{ const x=c.adj.find(q=>q.id===r.id); const g=x?x.kg:null; const st=g==null?['na','—']:(Math.abs(g)<1?['ok','✓ Mos']:(g<0?['bad','▼ Kamomad']:['warn','▲ Ortiqcha']));
      return [fd(r.d),E.whName(c.cfg,r.wh),x?fmt(x.book):'—',fmt(r.kg),g==null?'—':fs(g,0),x&&x.book?fmt(g/x.book*100,2):'—',g==null?'—':fmt(g*(c.NS.wh[r.wh]||0)),r.demo?[chip(st[0],st[1]),' ',chip('demo','Namuna')]:chip(st[0],st[1]),r.n||'',editBtn(j,r)]; }; }
  rows.sort(srt);
  if(f.imp) rows=rows.filter(r=>String(r.imp||0)===f.imp);
  if(f.fl) rows=rows.filter(flagged);
  let body=rows.map(r=>({r,c:cells(r)}));
  const q=(f.q||'').trim().toLowerCase(); if(q){ const ws=q.split(/\s+/); body=body.filter(x=>{ const t=(x.c.map(cellText).join(' ')+' '+(x.r.n||'')+' '+(x.r.doc||'')).toLowerCase(); return ws.every(w=>t.indexOf(w)>=0); }); }
  const shown=body.map(x=>x.r);
  const active=!!(q||f.fl||f.imp||Object.keys(F).some(k=>F[k]));
  if(!shown.length){ const hint=active?"Filtrga mos yozuv topilmadi. Filtrni o'zgartiring yoki «Tozalash»ni bosing.":{reys:"Bu davrda reys yo'q. Birinchi mashinani yuqoridagi shaklga kiriting.",vagon:"Faol vagon yo'q. Vagon yuklanganda uni shu yerda oching.",tex:"Bu davrda texnika yozuvi yo'q. Smena oxirida har bir ekskavator va pogruzchik uchun bitta qator kiriting.",mat:"Bu davrda material harakati yo'q. Avval kirimni narxi bilan kiriting.",xar:"Bu davrda xarajat yo'q.",inv:"Inventarizatsiya kiritilmagan. Boshlang'ich qoldiqni tasdiqlash uchun birinchi o'lchovni kiriting."}[j];
    return [el('div',{class:'panel empty'},hint),(j==='mat'||j==='tex')?extra.map(g=>g(shown)):null]; }
  const tr=body.map(x=>x.c); if(foot) tr.push({cls:'total',cells:foot(shown)});
  return [table(heads,tr,{name:J[j].title}),extra.map(g=>g(shown))]; }

/* ---------- Texnika kartochkalari va bak ma'lumoti ---------- */
/* Shu kunning bak o'lchovigacha bo'lgan hisobdagi qoldiq (o'lchov kiritilayotganda solishtirish uchun) */
function tankBook(c,code,d){ const T=c.TK.mc[code]; if(!T||!T.on||T.onD>d) return null; let q=null, last=null; for(const e of T.evs){ if(e.d>d) break; if(e.aud&&e.d===d) continue; if(e.tank!=null) q=e.tank; if(e.aud) last=e; } return {q,last}; }
/* norma usuli shu texnikaga d kuni amal qiladimi: norma bor va bak d dan oldin o'lchangan */
function tankOnAt(mc,d){ const m=E.mc(store.cfg,mc); if(!m||E.n(m.normL)==null||!d) return false; const T=ctx().TK.mc[mc]; return !!(T&&T.on&&T.onD<d); }
function tankHint(v){ const m=E.mc(store.cfg,v.mc); if(!m) return ''; const d=v.d||ui.D, u=m.type==='T'?'l/100 km':'l/moto-soat';
  if(E.n(m.normL)==null) return "Bu texnikaga norma kiritilmagan: quyilgan dizel shu kunning sarfi deb olinadi.";
  if(!tankOnAt(m.code,d)) return `Bak hali o'lchanmagan: quyilgan dizel shu kunning sarfi deb olinadi. Norma (${fmt(m.normL,1)} ${u}) bo'yicha hisob birinchi «Bak o'lchandi» yozuvidan keyin boshlanadi.`;
  const b=tankBook(ctx(),m.code,d); return `Sarf norma bo'yicha yoziladi: ${fmt(m.normL,1)} ${u}. Bakda hisobda ${b&&b.q!=null?fmt(b.q,0):'—'} l. Bugun quyilmagan bo'lsa — bo'sh qoldiring.`; }
function bakHint(v){ const m=E.mc(store.cfg,v.mc); if(!m) return ''; const d=v.d||ui.D, b=tankBook(ctx(),m.code,d), cap=E.n(m.bakV)?` Bak sig'imi ${fmt(m.bakV,0)} l.`:'';
  if(!b||b.q==null) return "Birinchi o'lchov — bakning boshlang'ich qoldig'i: ertadan sarf norma bo'yicha hisoblanadi."+(E.n(m.normL)==null?" Diqqat: bu texnikaga norma kiritilmagan (Normativlar) — norma kiritilmaguncha hisob o'zgarmaydi.":'')+cap;
  return `Hisobda: ${fmt(b.q,0)} l`+(b.last?` (oxirgi o'lchov ${fd(b.last.d)}: ${fmt(b.last.bak,0)} l)`:'')+". Farqi «dizel og'ishi» bo'lib yoziladi."+cap; }
/* Operator uchun: shu joydagi texnikalarning bak holati */
function opTankInfo(c,site){ const cfg=c.cfg, D=ui.D, ms=cfg.machines.filter(m=>mcSite(m)===site); if(!ms.length) return null;
  return el('div',{class:'opinfo',id:'op-tanks'},el('b',null,'Baklar hisobda ('+fd(D)+'): '),ms.map((m,i)=>{ const st=E.tankAt(c,m.code,D);
    return el('span',{class:'num'},(i?' · ':'')+m.name+': '+(st.on?fmt(st.q,0)+' l'+(st.last?' (o\'lchov '+fd(st.last.d).slice(0,5)+')':''):(E.n(m.normL)!=null?"o'lchanmagan":"norma yo'q"))); })); }
function mcCards(c){ const cfg=c.cfg, D=ui.D, a=E.ms(D)<c.start?c.start:E.ms(D), tn={E:'Ekskavator',P:'Pogruzchik',T:'Yuk mashinasi'};
  if(!cfg.machines.length) return null;
  const cards=cfg.machines.map(m=>{ const R=E.mcRep(c,m.code,a,D), tk=m.type==='T', st=R.st1, hasN=E.n(m.normL)!=null; let ch;
    if(st.on&&st.q<-0.5) ch=chip('bad','Bak hisobda manfiy'); else if(R.ints.some(i=>i.dev!=null&&i.dev>cfg.tol)) ch=chip('bad',"Og'ish "+fs(R.tot.ogL,0)+' l');
    else if(st.on) ch=chip('ok','Norma usuli'); else ch=chip(hasN?'warn':'na',hasN?"Bak o'lchanmagan":"Norma yo'q");
    return el('button',{type:'button',class:'opcard','data-mc':m.code,'aria-pressed':String(ui.card===m.code),onclick:()=>{ ui.card=ui.card===m.code?null:m.code; mount(); const e=document.getElementById('mc-card'); if(e) e.scrollIntoView({block:'start',behavior:'auto'}); }},
      el('b',null,m.name||m.code),el('span',null,(tn[m.type]||'Texnika')+' · '+(tk?SITE_NAME[m.site||'QIB']:E.whName(cfg,m.loc))),
      el('span',{class:'num'},`Oy boshidan: ${fmt(R.tot.work,tk?0:1)} ${tk?'km':'m-s'} · quyildi ${fmt(R.tot.fuel,0)} l`),el('span',{class:'num'},st.on?'Bakda hisobda: '+fmt(st.q,0)+' l':'Bak: —'),ch); });
  return el('section',null,el('div',{class:'sechead'},el('h2',null,'Texnika kartochkalari'),el('span',{class:'muted'},"Kartochkani bosing — shu texnikaning to'liq hisoboti ochiladi")),el('div',{class:'opgrid',id:'mc-cards'},cards)); }
function mcRange(c){ const D=ui.D, sc=ui.cardSc||'oy'; let a, b=D;
  if(sc==='otgan'){ b=E.add(E.ms(D),-1); a=E.ms(b); } else if(sc==='all') a=c.start; else if(sc==='yil') a=D.slice(0,4)+'-01-01'; else a=E.ms(D);
  if(a<c.start) a=c.start; return [a,b]; }
function mcCardView(c,code){ const cfg=c.cfg, D=ui.D, [a,b]=mcRange(c), R=E.mcRep(c,code,a,b); if(!R) return null;
  const m=R.m, tk=R.truck, t=R.tot, st=R.st1, U=tk?'km':'m-s', UR=tk?'l/100 km':'l/moto-soat', per=w=>tk?w/100:w, out=[];
  const seg=segBtn([['oy','Oy'],['otgan',"O'tgan oy"],['yil','Yil boshidan'],['all','Boshidan']],ui.cardSc||'oy',v=>{ ui.cardSc=v; mount(); });
  /* haqiqiy sarf me'yori: bak o'lchovlari bo'lsa — o'lchovlar oralig'idan (aniq); bo'lmasa — hisobdagi sarfdan */
  const iw=R.ints.reduce((x,i)=>x+per(i.work),0), ia=R.ints.reduce((x,i)=>x+(i.work>0?i.act:0),0), byInt=iw>0, rate=byInt?ia/iw:(t.work>0?(t.cons+t.ogL)/per(t.work):null);
  const mix=t.nmN&&!t.factN?"norma bo'yicha":(t.nmN?'norma va fakt aralash':"quyilgani bo'yicha");
  out.push(el('div',{class:'sechead'},el('h2',null,m.name||m.code),el('span',{class:'muted'},`${fd(a)} – ${fd(b)}`),seg,
    st.on?(Math.abs(R.chk)<0.5?chip('ok',"✓ boshida + quyildi − sarf − og'ish = bakda"):chip('bad','Bak tengligida '+fmt(R.chk,1)+' l farq')):null,
    el('button',{type:'button',class:'link',onclick:()=>{ ui.card=null; mount(); }},'Yopish ✕')));
  out.push(kvTiles([
    ['Bakda hisobda'+(b===D?'':' · '+fd(b)),st.on?fmt(st.q,0)+' l':'—',st.on?(st.last?`oxirgi o'lchov ${fd(st.last.d)}: ${fmt(st.last.bak,0)} l`:null):"bak o'lchanmagan"],
    ['Ishladi',fmt(t.work,tk?0:1)+' '+U,t.days+' kun'],
    ['Quyildi',fmt(t.fuel,0)+' l',fm(t.fuelV)+" mln so'm"],
    ['Sarf — tan narxga',fmt(t.cons,0)+' l',fm(t.dz)+' mln · '+mix],
    ["Dizel og'ishi",t.auds?fs(t.ogL,0)+' l':'—',t.auds?fs(t.og,0)+" so'm · "+t.auds+" o'lchov":"bak o'lchovi yo'q"],
    [UR,rate==null?'—':fmt(rate,1),(R.nL==null?"norma yo'q":'norma '+fmt(R.nL,1))+(byInt?" · bak o'lchovlari bo'yicha":'')],
    tk?['Reyslar',fmt(R.tn),ft(R.tkg)+' t · '+fm(R.th)+' mln tannarx']:['Hajm',ft(t.kg)+' t',(t.mhW>0&&t.kgW>0)?fmt(t.kgW/1000/t.mhW,1)+' t/m-s'+(R.nT?' · norma '+fmt(R.nT,1):''):null],
    ['Amortizatsiya',fm(t.am)+' mln',null],R.repS?["Ta'mir va boshqa xarajat",fm(R.repS)+' mln',null]:null]));
  const T=R.T, mode=(T&&T.on)?`Norma usuli ${fd(T.onD)} kungi birinchi bak o'lchovidan keyin: sarf = ${tk?'km × norma ÷ 100':'moto-soat × norma'}, quyilgan dizel bakka tushadi. Bak o'lchanganda hisobdagi va o'lchangan qoldiq farqi «dizel og'ishi» bo'ladi — u qum tan narxiga kirmaydi, alohida ko'rinadi.`
    :(R.nL!=null?"Fakt usuli: quyilgan dizel o'sha kunning sarfi deb olinadi. Norma usuliga o'tish uchun bakni bir marta o'lchab kiriting — keyingi kundan sarf norma bo'yicha hisoblanadi, o'tgan kunlar o'zgarmaydi."
      :"Fakt usuli: bu texnikaga dizel normasi kiritilmagan (Normativlar). Norma kiritilib, bak bir marta o'lchangach, sarf norma bo'yicha hisoblanadi.");
  out.push(el('p',{class:'note'},mode+(R.cap?` Bak sig'imi ${fmt(R.cap,0)} l.`:'')),
    canWrite?el('div',{class:'actions'},el('button',{type:'button',id:'mc-bak',onclick:()=>{ (ui.jf||(ui.jf={})).tex=true; ui.form.tex={vals:Object.assign(defVals('tex'),{mc:code,op:'A',loc:tk?TR:m.loc}),edit:null,msg:null}; mount(); const e=document.getElementById('f-tex'); if(e) e.scrollIntoView({block:'center',behavior:'auto'}); }},"Bak o'lchovini kiritish")):null);
  /* 1. bak daftari */
  const fl=r=>{ const a=(r.flags||[]).filter(x=>x[0]!=='na'||r.aud).map(f=>chip(f[0],f[1])); return a.length?el('span',{style:'display:inline-flex;gap:4px;flex-wrap:wrap'},a):chip('ok','✓'); };
  const led=R.rows.map(r=>{ if(r.aud) return [fd(r.d),r.audK==='open'?"Bak o'lchandi (boshlang'ich)":"Bak o'lchandi",tk?'—':E.whName(cfg,r.loc),'—','—',r.credL?'−'+fmt(r.credL,0):'—',r.book==null?'—':fmt(r.book,0),fmt(r.bak,0),r.audK==='aud'?fs(r.ogL,0):'—',r.audK==='aud'?fs(r.og,0):'—',r.dz?fs(r.dz,0):'—','—',r.who||'—',fl(r),editBtn('tex',r)];
    const w=tk?r.km:r.mh; return [fd(r.d),w>0?(tk?'Yurdi':(OPS[r.op]||'Ishladi')):(r.fuel>0?'Dizel quyildi':'—'),tk?'—':E.whName(cfg,r.loc),w?fmt(w,tk?0:1):'—',r.fuel?fmt(r.fuel,0):'—',fmt(r.cons,0)+(r.nm?' ~':''),r.tank==null?'—':fmt(r.tank,0),'—','—','—',fmt(r.dz),fmt(r.am),r.who||'—',fl(r),editBtn('tex',r)]; });
  if(R.st0.on) led.unshift({cls:'sub',cells:[fd(a),'Davr boshida bakda','','','','',fmt(R.st0.q,0),'','','','','','','','']});
  if(R.rows.length) led.push({cls:'total',cells:['Jami','','',fmt(t.work,tk?0:1),fmt(t.fuel,0),fmt(t.cons,0),st.on?fmt(st.q,0):'—','',t.auds?fs(t.ogL,0):'—',t.auds?fs(t.og,0):'—',fmt(t.dz),fmt(t.am),'','','']});
  out.push(el('h3',{style:'margin-top:8px'},'Bak daftari: qachon qancha quyildi, qancha ishladi'),
    R.rows.length?table([['Sana'],['Amal'],['Qayerda'],[tk?'Km':'Moto-soat','r'],['Quyildi, l','r'],['Sarf, l','r'],['Bak hisobda, l','r'],["O'lchov, l",'r'],["Og'ish, l",'r'],["Og'ish, so'm",'r'],["Sarf, so'm",'r'],["Amort., so'm",'r'],[tk?'Haydovchi':'Operator'],['Holat'],['']],led,{name:(m.name||m.code)+' — bak daftari'})
      :el('div',{class:'panel empty'},'Bu davrda bu texnika bo\'yicha yozuv yo\'q.'),
    el('p',{class:'note'},"«Sarf» ustunidagi ~ belgisi — norma bo'yicha hisoblangan sarf; belgisiz — quyilgan dizelning o'zi (fakt usuli). «Bak hisobda» — shu yozuvdan keyingi hisobiy qoldiq. Og'ish musbat bo'lsa — bakda hisobdagidan kam: normadan ortiq yongan yoki dizel kam quyilgan. Boshlang'ich o'lchov qatoridagi manfiy sarf — bakda turgan, avval quyilganda xarajatga chiqqan dizel: u ikki marta sanalmasligi uchun shu kuni xarajatdan chiqariladi va keyin norma bo'yicha yonganda qayta kiradi."));
  /* 2. o'lchovlar oralig'i: norma va haqiqiy sarf */
  if(R.ints.length){ const tol=cfg.tol; out.push(el('h3',{style:'margin-top:8px'},"Bak o'lchovlari: norma va haqiqiy sarf"),
    table([["O'lchov"],["Oldingi o'lchov"],['Bakda edi, l','r'],['Quyildi, l','r'],[tk?'Yurdi, km':'Ishladi, m-s','r'],['Norma sarf, l','r'],['Haqiqiy sarf, l','r'],["O'lchandi, l",'r'],["Og'ish, l",'r'],["Og'ish, %",'r'],['Fakt '+UR,'r'],['Norma','r'],["Og'ish, so'm",'r'],['Holat']],
      R.ints.map(i=>{ const w=per(i.work), stt=i.dev==null?['warn',"Ish yozuvi yo'q"]:(i.dev>tol?['bad','▲ Dizel oshgan']:(i.dev<-tol?['warn','▼ Normadan kam']:['ok','✓ Normada']));
        return [fd(i.to),fd(i.from),fmt(i.start,0),fmt(i.fuel,0),fmt(i.work,tk?0:1),fmt(i.norm,0),fmt(i.act,0),fmt(i.bak,0),fs(i.ogL,0),i.dev==null?'—':fs(i.dev*100,1),w>0?fmt(i.act/w,1):'—',w>0?fmt(i.norm/w,1):'—',fs(i.og,0),chip(stt[0],stt[1])]; }),{name:(m.name||m.code)+" — bak o'lchovlari"}),
    el('p',{class:'note'},"Haqiqiy sarf = oldingi o'lchovda bakda bo'lgani + shu oraliqda quyilgani − hozir o'lchangani. Og'ish = haqiqiy sarf − norma sarf. Normadan ancha kam chiqsa — norma yuqori qo'yilgan yoki moto-soat ortiqcha yozilgan bo'lishi mumkin.")); }
  /* 3. qayerda qancha ishladi / reyslar */
  if(!tk&&R.where.length) out.push(el('h3',{style:'margin-top:8px'},'Qayerda qancha ishladi'),table([["Bo'g'in"],['Ish'],['Kun','r'],['Moto-soat','r'],['Hajm, t','r'],['t/m-s','r'],['Sarf, l','r'],["Dizel, so'm",'r'],["Amortizatsiya, so'm",'r']],
    R.where.map(g=>[E.whName(cfg,g.loc),g.op==='A'?"Boshlang'ich bak o'lchovi: bakda qolgani qaytarildi":(OPS[g.op]||g.op||'—'),g.days||'—',fmt(g.work,1),ft(g.kg),g.work>0&&g.kg>0?fmt(g.kg/1000/g.work,1):'—',fmt(g.cons,0),fmt(g.dz),fmt(g.am)]),{name:(m.name||m.code)+' — ish joylari'}));
  if(tk) out.push(el('h3',{style:'margin-top:8px'},'Reyslar: qayerga qancha tashidi'),R.trips.length?table([['Marshrut'],['Reys','r'],['Tashildi, t','r'],["Tannarx, so'm",'r'],["so'm/reys",'r'],["so'm/kg",'r']],
    R.trips.map(g=>[g.name,fmt(g.n),ft(g.kg),fmt(g.haul),g.n?fmt(g.haul/g.n):'—',g.kg?fmt(g.haul/g.kg,2):'—']).concat([{cls:'total',cells:['Jami',fmt(R.tn),ft(R.tkg),fmt(R.th),R.tn?fmt(R.th/R.tn):'—',R.tkg?fmt(R.th/R.tkg,2):'—']}]),{name:(m.name||m.code)+' — reyslar'})
    :el('div',{class:'panel empty'},"Bu davrda bu mashinada o'z reysi yo'q."),
    el('p',{class:'note'},"Reys tannarxi — mashinaning dizeli (sarf bo'yicha), amortizatsiyasi, haydovchi ish haqi va boshqa transport xarajatlaridan shu reyslarga tushgan qismi (oy bo'yicha taqsimlanadi)."));
  /* 4. oylar */
  if(R.months.length>1) out.push(el('h3',{style:'margin-top:8px'},"Oylar bo'yicha"),table([['Oy'],['Ish kuni','r'],[tk?'Km':'Moto-soat','r'],['Quyildi, l','r'],['Sarf, l','r'],["Og'ish, l",'r'],["Og'ish, so'm",'r'],["Sarf, so'm",'r'],["Amortizatsiya, so'm",'r']].concat(tk?[]:[['Hajm, t','r']]),
    R.months.map(g=>[g.m.slice(5,7)+'.'+g.m.slice(0,4),g.days,fmt(g.work,tk?0:1),fmt(g.fuel,0),fmt(g.cons,0),g.auds?fs(g.ogL,0):'—',g.auds?fs(g.og,0):'—',fmt(g.dz),fmt(g.am)].concat(tk?[]:[ft(g.kg)])),{name:(m.name||m.code)+' — oylar'}));
  const rk=Object.keys(R.rep); if(rk.length) out.push(el('h3',{style:'margin-top:8px'},"Ta'mir va boshqa xarajatlar (Xarajatlar jurnalidan)"),table([['Modda'],["Summa, so'm",'r']],rk.map(k=>[k,fmt(R.rep[k])]).concat([{cls:'total',cells:['Jami',fmt(R.repS)]}]),{name:(m.name||m.code)+' — xarajatlar'}));
  return el('section',{id:'mc-card',class:'detail',style:'scroll-margin-top:130px'},out); }
/* Hisobot varag'i: baklar va dizel og'ishi */
function bakSheet(c,a,b){ const cfg=c.cfg, rows=[], tt=[0,0,0,0,0,0,0,0,0]; let any=false;
  for(const m of cfg.machines){ const R=E.mcRep(c,m.code,a,b), t=R.tot, tk=R.truck; if(!R.rows.length&&!R.st1.on) continue; any=true;
    const w=tk?t.work/100:t.work, r=[m.name||m.code,R.st1.on?'norma':(R.nL!=null?"fakt (bak o'lchanmagan)":"fakt (norma yo'q)"),tk?'km':'moto-soat',t.work,R.st0.on?R.st0.q:'',t.fuel,t.cons,t.auds?t.ogL:'',R.st1.on?R.st1.q:'',t.fuelV,t.dz,t.auds?t.og:'',t.cred||'',w>0?(t.cons+t.ogL)/w:'',R.nL==null?'':R.nL];
    rows.push(r); [5,6,7,9,10,11,12].forEach((i,k)=>{ if(typeof r[i]==='number') tt[k]+=r[i]; }); }
  const tot=['Jami','','','','',tt[0],tt[1],tt[2],'',tt[3],tt[4],tt[5],tt[6],'','']; tot._b=1;
  return {key:'bak',name:'Baklar va dizel',any,heads:['Texnika','Usul','Birlik','Ishladi','Bak boshida, l','Quyildi, l','Sarf (tan narxga), l',"Og'ish, l",'Bak oxirida, l',"Quyildi, so'm","Sarf (tan narxga), so'm","Og'ish, so'm","shundan: bakda qolgani qaytarildi, so'm",'Fakt sarf, l/birlik','Norma'],rows:rows.concat([tot]),dec:[0,0,0,1,0,0,0,0,0,0,0,0,0,1,1]}; }

/* ---------- Tan narx (oylik) ---------- */
function vTan(){ const c=ctx(), D=ui.D, NS=c.NS; const months=[]; let m=E.ms(c.start<=D?c.start:D);
  while(m<=D&&months.length<24){ months.push(m); m=E.add(E.me(m),1); }
  const heads=[['Oy']].concat(STAGES.map(s=>[s[1].replace(/ \(.*\)/,''),'r']),[["Bosqichlar yig'indisi",'r'],["Og'ish",'r'],["shundan bo'sh turish",'r'],["Zavodga kelgan qum, fakt",'r'],['Zavod kirimi, t','r'],["Avto to'g'ridan, t",'r'],["Sotib olingan, t",'r'],['GU-46, mln','r'],["Dizel og'ishi, mln",'r']]);
  const rows=months.slice(-12).map(ms=>{ const cur=ms===E.ms(D), b=cur?D:E.me(ms), A=E.agg(c,ms<c.start?c.start:ms,b,'acc'), dl=E.delivered(c,ms,b);
    return [ms.slice(5,7)+'.'+ms.slice(0,4)+(cur?' *':'')].concat(STAGES.map(s=>A[s[0]].rate==null?'—':fmt(A[s[0]].rate,1)),
      [A.full?fmt(A.landed,1):'—',A.full?fs(A.landed-NS.total,1):'—',A.full?fmt(A.landedIdle,1):'—',dl.unit==null?'—':fmt(dl.unit,1),ft(A.avtoZav.vol+A.togri.vol),ft(A.togri.vol),ft(A.buy.vol),fm(A.gu.sum),(fv=>fv.aud.n?fs(fv.aud.v/1e6,2):'—')(E.fuelVar(c,ms<c.start?c.start:ms,b))]); });
  rows.push({cls:'total',cells:['Norma'].concat(STAGES.map(s=>fmt(NS[s[0]],1)),[fmt(NS.total,1),'','',fmt(NS.total,1),'','','','',''])});
  const bt=STAGES.reduce((s,x)=>s+BASE[x[0]],0);
  rows.push({cls:'sub',cells:['Eski Excel, sen–dek 2025'].concat(STAGES.map(s=>fmt(BASE[s[0]],1)),[fmt(bt,1),fs(bt-NS.total,1),'','','','','','',''])});
  const nb=[]; const en={zx:'Kon qiymati: sotib olish va geologiya',nd:"Yer qa'ri solig'i",dzY:'Dizel: yuklash',amY:'Amortizatsiya: yuklash',dz:'Dizel',am:'Amortizatsiya','m:SIM':'Sim','m:PLYONKA':'Plyonka',pod:"Qo'qon TexPD podacha",tush:'Vagon tushirish',gu:'GU-46 jarima'};
  LINKS.forEach(L=>{ const ln=c.LN[L]; if((L==='K02'||L==='S02')&&!((E.n(c.cfg.wh[L].plan)||0)>0||c.cfg.machines.some(m=>m.loc===L))) return;
    nb.push({cls:'total',cells:[SN[stageOf(L)]+': '+c.cfg.wh[L].name,fmt(ln.total,2),stageOf(L)==='karyer'&&!ln.mcOk?'Texnika normasi kiritilmagan — dizel umumiy norma bilan':'']});
    for(const k in ln.el){ const v=ln.el[k]; if(!(v>0)&&v!==null) continue; const nm=en[k]||(c.item[k.slice(2)]||{}).name||k; nb.push(['   '+nm,v==null?'—':fmt(v,2),v==null?'Oylik reja hajmi kiritilmagan':'']); } });
  nb.push({cls:'total',cells:['Avto: karyer → stansiya',fmt(NS.avtoSt,2),'tarif ÷ reys normativ yuki']},{cls:'total',cells:["Temir yo'l",fmt(NS.temir,2),'vagon tarifi ÷ vagon normativ yuki']},{cls:'total',cells:['Avto: Chust → zavod',fmt(NS.avtoZav,2),'']},{cls:'total',cells:['Jami zavodda',fmt(NS.total,2),"karyer — reja hajmi bo'yicha o'rtacha"]});
  return [el('section',null,el('div',{class:'sechead'},el('h2',null,"Oylik tan narx, so'm/kg"),el('span',{class:'muted'},"* joriy oy — hisobot sanasigacha")),table(heads,rows),
      el('p',{class:'note'},"«Bosqichlar yig'indisi» — har bosqichning oylik xarajati ÷ o'z hajmi. «Zavodga kelgan qum, fakt» — shu oyda zavodga kelgan qumning o'rtacha tortilgan tan narxi. Yopilgan oyda doimiy xarajat fakti kiritilmagan bo'lsa, reja olinadi va Audit bo'limida ko'rsatiladi. «Dizel og'ishi» — shu oydagi bak o'lchovlarida topilgan farq (hisobda − o'lchangan): tan narx ustunlariga kirmaydi, norma bo'yicha yozilgan dizel xarajatidan chetlanishni ko'rsatadi.")),
    el('section',null,el('h2',null,"Normativ tan narx tarkibi"),table([["Bo'g'in va element"],["so'm/kg",'r'],['Izoh','w']],nb),
      el('p',{class:'note'},"Texnika elementi: (dizel normasi × dizel narxi + amortizatsiya stavkasi) ÷ soatlik unumdorlik. Doimiy xarajat: oylik reja ÷ oylik reja hajmi. Material narxi — ombordagi o'rtacha kirim narxi."))];
}

/* ---------- Normativlar (sozlama) ---------- */
function vNorm(){ const d=ui.cfgDraft||(ui.cfgDraft=JSON.parse(JSON.stringify(store.cfg))); const ro=!canAdmin; const out=[];
  const dirty=()=>{ ui.cfgDirty=true; const b=document.getElementById('cfg-save'); if(b) b.disabled=false; };
  const inp=(obj,key,id,num,txt,after)=>{ const i=el('input',{id,type:'text',inputmode:num?'decimal':null,class:txt?'txt':'',disabled:ro});
    i.value=obj[key]==null?'':(num?fmtIn(obj[key]):obj[key]); if(num) numMask(i);
    i.addEventListener('input',()=>{ if(num){ const v=pnum(i.value); if(v!==null&&isNaN(v)){ i.classList.add('err'); return; } i.classList.remove('err'); obj[key]=v; } else obj[key]=i.value; dirty(); if(after) after(); }); return i; };
  const sel=(obj,key,id,opts)=>{ const s=el('select',{id,disabled:ro,style:'width:auto'},opts.map(o=>el('option',{value:o[0]},o[1]))); s.value=obj[key]; s.addEventListener('change',()=>{obj[key]=s.value;dirty();}); return s; };
  if(ro) out.push(el('div',{class:'banner'},"Normativlarni faqat sahifa egasi va muharrirlar o'zgartira oladi."));
  const sd=el('input',{id:'cfg-start',type:'date',disabled:ro,style:'width:auto'}); sd.value=d.start; sd.addEventListener('change',()=>{ if(sd.value){ d.start=sd.value; dirty(); } });
  const wide=i=>{ i.style.width='100%'; i.style.textAlign='left'; return i; };
  out.push(el('section',null,el('h2',null,'Umumiy'),el('div',{class:'panel pad cfg'},
    el('div',{class:'fld'},el('label',{for:'cfg-start'},'Tizim boshlanish sanasi'),sd,el('small',null,"Boshlang'ich qoldiqlar shu kun boshiga kiritiladi")),
    el('div',{class:'fld'},el('label',{for:'cfg-item'},'SAP ItemCode (qum)'),wide(inp(d,'sapItem','cfg-item',false,true)),el('small',null,"O'zingizdagi kod bilan almashtiring")),
    el('div',{class:'fld'},el('label',{for:'cfg-tol'},"Og'ish chegarasi (ulush)"),wide(inp(d,'tol','cfg-tol',true)),el('small',null,"0,05 = normadan 5% gacha «chegarada»")))));
  /* texnika */
  const rateCells={};
  const upd=m=>{ const r=E.mcRate(m), nL=E.n(m.normL), nT=E.n(m.normT); const p=store.cfg.mats.DIZEL.price; const cell=rateCells[m.code]; if(cell){ cell[0].textContent=r?fmt(r,0):'—'; cell[1].textContent=(nL!=null&&nT)?fmt((nL*(C?E.prNow(C.P,'DIZEL',SITE_OF[m.loc]):p)+r)/nT,0):'—'; } };
  const mrows=d.machines.map((m,i)=>[m,i]).filter(x=>x[0].type!=='T').map(([m,i])=>{ const a=el('span',{class:'num'}), b=el('span',{class:'num'}); rateCells[m.code]=[a,b]; const u=()=>upd(m);
    const row=[inp(m,'name','cfg-mc-n'+i,false,true),sel(m,'type','cfg-mc-t'+i,[['E','Ekskavator'],['P','Pogruzchik']]),sel(m,'loc','cfg-mc-l'+i,LINKS.map(l=>[l,d.wh[l].name])),
      inp(m,'normL','cfg-mc-nl'+i,true,false,u),inp(m,'normT','cfg-mc-nt'+i,true,false,u),inp(m,'bakV','cfg-mc-b'+i,true),inp(m,'cost','cfg-mc-c'+i,true,false,u),inp(m,'life','cfg-mc-lf'+i,true,false,u),a,b,
      ro?'':el('button',{class:'link danger',type:'button',onclick:()=>{ d.machines.splice(i,1); dirty(); mount(); }},'Olib tashlash')]; return row; });
  ctx();
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Texnika va moto-soat normalari'),ro?null:el('button',{type:'button',onclick:()=>{ d.machines.push({code:'M'+rid().slice(0,5).toUpperCase(),name:'',type:'E',loc:'K01',normL:null,normT:null,cost:null,life:null}); dirty(); mount(); }},'+ Texnika')),
    table([['Nomi'],['Turi'],["Bo'g'in"],['Dizel, l/moto-soat','r'],['Unumdorlik, t/moto-soat','r'],["Bak sig'imi, l",'r'],["Qiymati, so'm",'r'],['Resursi, moto-soat','r'],["Amortizatsiya, so'm/m-s",'r'],["Norma, so'm/t",'r'],['']],mrows),
    el('p',{class:'note'},"Amortizatsiya stavkasi = qiymat ÷ resurs; har kuni ishlangan moto-soatga ko'paytiriladi. Norma so'm/t = (dizel normasi × dizel narxi + amortizatsiya stavkasi) ÷ unumdorlik. Normalar bo'sh — o'zingizdagi tasdiqlangan normalarni kiriting. Dizel: norma kiritilgan va baki bir marta o'lchangan («Bak o'lchandi») texnikada sarf norma bo'yicha hisoblanadi (moto-soat × norma), quyilgan dizel bakda turadi, o'lchovdagi farq «dizel og'ishi» bo'ladi. Bak o'lchanmaguncha — quyilgan dizel shu kunning sarfi. Norma har yozuvga kiritilgan paytdagi qiymati bilan yoziladi: bu yerda o'zgartirilsa, faqat keyingi yozuvlarga ta'sir qiladi. Bak sig'imi ixtiyoriy — kiritilsa, undan katta o'lchov qabul qilinmaydi.")));
  d.machines.filter(m=>m.type!=='T').forEach(upd);
  const kc={}; const kupd=m=>{ const r=E.mcRate(m); if(kc[m.code]) kc[m.code].textContent=r?fmt(r,0):'—'; };
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,"O'z yuk mashinalari"),ro?null:el('button',{type:'button',onclick:()=>{ d.machines.push({code:'T'+rid().slice(0,5).toUpperCase(),name:'',type:'T',plate:'',loc:'TR',normL:null,normT:null,cost:null,life:null}); dirty(); mount(); }},'+ Yuk mashinasi')),
    table([['Nomi'],['Davlat raqami'],['Qayerda ishlaydi'],['Dizel normasi, l/100 km','r'],["Bak sig'imi, l",'r'],["Qiymati, so'm",'r'],['Resursi, km','r'],["Amortizatsiya, so'm/km",'r'],['']],
      d.machines.map((m,i)=>[m,i]).filter(x=>x[0].type==='T').map(([m,i])=>{ kc[m.code]=el('span',{class:'num'}); const u=()=>kupd(m);
        return [inp(m,'name','cfg-tk-n'+i,false,true),inp(m,'plate','cfg-tk-p'+i,false,true),sel(m,'site','cfg-tk-s'+i,[['QIB','Qibray'],['SAM','Samarqand'],['CHU','Chust']]),inp(m,'normL','cfg-tk-nl'+i,true),inp(m,'bakV','cfg-tk-b'+i,true),inp(m,'cost','cfg-tk-c'+i,true,false,u),inp(m,'life','cfg-tk-lf'+i,true,false,u),kc[m.code],
          ro?'':el('button',{class:'link danger',type:'button',onclick:()=>{ d.machines.splice(i,1); dirty(); mount(); }},'Olib tashlash')]; })),
    el('p',{class:'note'},"Reys «O'z transporti» deb kiritilsa, unga tarif qo'yilmaydi: shu mashinalarning dizeli (Texnika jurnali), amortizatsiyasi (km × stavka) va haydovchilar ish haqi (Xarajatlar → O'z transporti) oyning o'z reyslariga bo'linadi. Ikkita raqam eski Exceldagi «MEGATON» mashinalaridan olindi — ro'yxatni o'zingiznikiga moslang.")));
  d.machines.filter(m=>m.type==='T').forEach(kupd);
  const rc={}; const rupd=k=>{ const r=E.resRate(d,k); rc[k].textContent=r?fmt(r,4):'—'; };
  out.push(el('section',null,el('h2',null,'Kon: sotib olish, geologiya, tasdiqlangan zaxira va krisha'),table([['Karyer'],['Geologiya tasdiqlagan zaxira, kg','r'],["Sotib olish va geologiya xarajati, so'm",'r'],["1 kg qum yer ostida, so'm",'r'],['Krisha koeffitsienti: 1 t qumga necha t krisha','r']],
    ['K01','K02'].map(k=>{ rc[k]=el('span',{class:'num'}); const w=i=>{ i.style.width='11.5em'; return i; }; return [d.wh[k].full,w(inp(d.wh[k],'resKg','cfg-rs-k'+k,true,false,()=>rupd(k))),w(inp(d.wh[k],'resVal','cfg-rs-v'+k,true,false,()=>rupd(k))),rc[k],inp(d.wh[k],'krK','cfg-rs-c'+k,true)]; })),
    el('p',{class:'note'},"Zaxira va uning qiymati — tizim boshlanish sanasiga. Karyerni sotib olish va geologiya ishlari xarajati tasdiqlangan zaxiraga bo'linadi: bu — qazilmagan 1 kg qumning narxi; har qazilgan kilogramm bilan tan narxga o'tadi. Krisha ochish xarajati alohida hovuzda yig'iladi va faqat qazilgan qumga o'tadi. Krisha koeffitsienti (geologiya hisobotidagi krisha hajmi ÷ qum hajmi) kiritilsa — har tonna qum shuncha tonna krishani o'z narxida oladi; bo'sh qolsa — hovuz qolgan zaxiraga teng yoyiladi. Koeffitsient bo'sh turganda krisha qum tan narxiga sekin o'tadi (eng past baho): geologiya hisoboti bo'yicha tasdiqlang.")));
  ['K01','K02'].forEach(rupd);
  out.push(el('section',null,el('h2',null,"Bo'g'inlar: nomi, boshlang'ich qoldiq, oylik reja hajmi"),table([['Kod'],['Qisqa nomi'],["Boshlang'ich qoldiq, kg",'r'],["Boshlang'ich qiymati, so'm",'r'],['Reja hajmi, t/oy','r'],['Izoh','w']],
    WH.map(k=>[k,inp(d.wh[k],'name','cfg-wh-n'+k,false,true),isT(k)?el('span',{class:'num muted'},fmt(E.open(ctx(),k))+' · jurnaldan'):inp(d.wh[k],'open','cfg-wh-'+k,true),inp(d.wh[k],'openVal','cfg-wh-v'+k,true),isT(k)?'—':inp(d.wh[k],'plan','cfg-wh-p'+k,true),d.wh[k].note||''])),
    el('p',{class:'note'},"Boshlang'ich qiymat — shu qoldiqning balansdagi summasi; bo'sh qolsa normativ narxda baholanadi va Auditda belgilanadi. Reja hajmi doimiy xarajatlarni tonnaga bo'lish uchun kerak: karyerda — qazish, stansiyada — yuklash, Chustda — tushirish hajmi. Vagon omborlarining (T01, T02) boshlang'ich qoldig'i qo'lda kiritilmaydi: tizim boshlanishidan oldin yuklangan, hali tushirilmagan vagonlarni Vagonlar jurnaliga haqiqiy yuklangan sanasi bilan kiriting, bu yerga esa faqat ularning balansdagi jami qiymatini yozing.")));
  out.push(el('section',null,el('h2',null,'Logistika normativlari'),table([["Ko'rsatkich",'w'],['Birlik'],['Eski Excel: min','r'],["o'rtacha",'r'],['maks','r'],['Norma','r']],
    NORM_META.map(m=>[m[1],m[2],m[3]==null?'—':fmt(m[3],m[6]),m[4]==null?'—':fmt(m[4],m[6]),m[5]==null?'—':fmt(m[5],m[6]),inp(d.norms,m[0],'cfg-n-'+m[0],true)])),
    el('p',{class:'note'},"Eski Excel ustunlari — Qum_final_31.08.2026 faylidan hisoblangan tarixiy fakt (may 2025 – avgust 2026). Yo'qotish va muddat normalari — taklif, tasdiqlang.")));
  out.push(el('section',null,el('h2',null,'Marshrutlar va tariflar'),table([['Marshrut'],['Tashqi logistika: tarif turi'],['Tarif','r'],['Masofa, km','r']],
    d.routes.map(r=>[E.rtName(d,r),sel(r,'type','cfg-rt-'+r.code,[['reys',"so'm / reys"],['kg',"so'm / kg"]]),inp(r,'tarif','cfg-rtt-'+r.code,true),inp(r,'km','cfg-rtk-'+r.code,true)])),
    el('p',{class:'note'},"Eski Excelda reys uchun 600 000 so'm to'langan, yuk esa 17,7 dan 37,5 t gacha bo'lgan. Tarifni so'm/kg ga o'tkazsangiz, tashuv narxi vaznga bog'lanadi. Masofa faqat o'z transporti xarajatini marshrutlar orasida bo'lish uchun: kiritilmasa har reys teng ulush oladi.")));
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,"Ta'minotchilar va qum narxi"),ro?null:el('button',{type:'button',onclick:()=>{ d.suppliers.push({code:'T'+rid().slice(0,5).toUpperCase(),name:'',price:0}); dirty(); mount(); }},"+ Ta'minotchi")),
    table([["Ta'minotchi"],["Narx, so'm/kg",'r']],d.suppliers.map((s,i)=>[inp(s,'name','cfg-sup-n'+i,false,true),inp(s,'price','cfg-sup-p'+i,true)]))));
  Object.keys(SN).forEach(stg=>{ const ls=linksOf(stg);
    out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,SN[stg]+': xarajat moddalari va oylik reja'),ro?null:el('button',{type:'button',onclick:()=>{ d.items.push({code:'X'+rid().slice(0,5).toUpperCase(),stage:stg,name:'',type:'O',plans:{},acc:''}); dirty(); mount(); }},'+ Modda')),
      table([['Modda'],['Turi']].concat(ls.map(l=>[E.whName(d,l)+", so'm/oy",'r']),[['Tan narxga kiradigan ulushi','r'],['SAP hisob']]),
        d.items.map((it,i)=>[it,i]).filter(x=>x[0].stage===stg).map(([it,i])=>{ if(!it.plans) it.plans={};
          return [inp(it,'name','cfg-it-n'+i,false,true),sel(it,'type','cfg-it-t'+i,[['D','Doimiy (oylik)'],['O',"O'zgaruvchan"]])].concat(ls.map(l=>it.nv?'vagon normasidan':inp(it.plans,l,'cfg-it-p'+i+l,true)),[(x=>{ x.placeholder='1'; return x; })(inp(it,'sh','cfg-it-s'+i,true)),inp(it,'acc','cfg-it-a'+i,false,true)]); })))); });
  out.push(el('p',{class:'note'},"«Tan narxga kiradigan ulushi»: bo'sh yoki 1 — xarajat to'liq kiradi; 0,2 — beshdan biri kiradi, qolgani tan narxdan tashqarida qoladi va Auditda alohida ko'rsatiladi (masalan, bir necha faoliyatga umumiy bo'lgan kvartira, ovqat, yengil mashina). Ulush har xarajat yozuviga kiritilgan paytda yozib qo'yiladi: bu yerda o'zgartirilsa, faqat keyingi yozuvlarga ta'sir qiladi, o'tganlari o'zgarmaydi. Karyerning umumiy xarajatlari krisha ochilgan oyda krisha va qum o'rtasida hajmga qarab o'zi bo'linadi — alohida belgilash shart emas. Mayskiy va Bo'zsuv rejalari — eski Excelning oxirgi 8 oyi medianasi; ikkinchi karyer rejasini o'zingiz kiriting. Oziq-ovqat tarixda 1,5 dan 53 mln gacha o'zgargan; yer qa'ri solig'i eski Excelda nol."));
  out.push(el('section',null,el('h2',null,"Materiallar: boshlang'ich qoldiq"),table([['Material'],["Boshlang'ich qoldiq",'r'],["Boshlang'ich narx, so'm",'r']],
    Object.keys(d.mats).map(k=>[d.mats[k].name+', '+d.mats[k].unit,inp(d.mats[k],'open','cfg-m-o'+k,true),inp(d.mats[k],'price','cfg-m-p'+k,true)]))));
  if(!ro){ const sb=el('button',{class:'pri',id:'cfg-save',type:'button',disabled:!ui.cfgDirty,onclick:async()=>{ sb.disabled=true;
      try{ const prevRaw=store.cfgRaw, next=JSON.parse(JSON.stringify(d)); await db.doc('config/main').set(next); cfgLog(prevRaw,next); store.cfgRaw=next; store.cfg=mergeCfg(d); store.ver++; ui.cfgDirty=false; ui.cfgDraft=null; ui.form={}; toast('Sozlama saqlandi'); mount(); }catch(e){ sb.disabled=false; toast(errMsg(e)); } }},'Sozlamani saqlash');
    const has=JN.some(j=>store.rows[j].some(r=>r.demo));
    out.push(el('section',null,el('div',{class:'actions'},sb,el('button',{type:'button',onclick:()=>{ ui.cfgDraft=null; ui.cfgDirty=false; mount(); }},"O'zgarishlarni bekor qilish")),
      el('h2',{style:'margin-top:14px'},"Namuna ma'lumot"),
      el('p',{class:'note'},"Tizim qanday hisoblashini ko'rish uchun boshlanish sanasidan 3 kunlik o'ylab topilgan yozuvlarni yuklash mumkin. Har biri «Namuna» belgisi bilan chiqadi va bir tugma bilan o'chiriladi. Haqiqiy ishni boshlashdan oldin o'chiring."),
      el('div',{class:'actions'},el('button',{type:'button',disabled:has,onclick:loadDemo},'Namunani yuklash'),el('button',{type:'button',class:'danger',disabled:!has,onclick:clearDemo},"Namunani o'chirish")))); }
  return out; }
function demoRows(s,cfg){ const d=n=>E.add(s,n), R=[], V=[], T=[], M=[], X=[], I=[];
  const trk=["40 020 MCA","40 494 MCA","10 165 ECA","01 324 YKA"], own=E.trucks(cfg), t1=own[0], t2=own[1];
  const w=[[29850,31200,26400,30900],[30450,31750,29600,30100],[31100,28900,30650]];
  w.forEach((arr,i)=>arr.forEach((kg,k)=>{ const o=(k===3&&t1)?t1:null; R.push({d:d(i),m:'KS1',s:'MEG',tk:o?o.code:null,a:o?o.plate:trk[k],c:o?null:(k<2?'MEGALOGISTIKA':'Gulrux logistik'),wj:k===0?kg+250:null,wq:kg,t:null,doc:k===2?null:'TTN-'+(100+i*10+k),n:null}); }));
  [[28950,27990],[28400],[]].forEach((arr,i)=>arr.forEach((kg,k)=>R.push({d:d(i),m:'TS1',s:'AQ',tk:null,a:trk[2+k],c:'NEW LIME BUSINESS',wj:null,wq:kg,t:null,doc:'TTN-'+(200+i*10+k),n:null})));
  R.push({d:d(1),m:'TS1',s:'AQ',tk:null,a:trk[2],c:'NEW LIME BUSINESS',wj:null,wq:28400,t:null,doc:null,n:'Takror tekshiruvi namunasi'});
  R.push({d:d(2),m:'K2S',s:'MEG',tk:null,a:'40 U 372 NB',c:'Gulrux logistik',wj:null,wq:29500,t:null,doc:'TTN-301',n:null});
  [[45900,46350],[44100,47250],[45600,46800,44950]].forEach((arr,i)=>arr.forEach((kg,k)=>{ const o=(k===1&&t2)?t2:null; R.push({d:d(i),m:'CZ',s:null,tk:o?o.code:null,a:o?o.plate:'50 9'+(46+k)+' MBA',c:o?null:'Namangan Sement MCHJ',wj:null,wq:kg,t:null,doc:'TTN-'+(400+i*10+k),n:null}); }));
  R.push({d:d(2),m:'KZ',s:'MEG',tk:null,a:'40 X 873 DB',c:'BEST TRUCK SERVIS 1995',wj:null,wq:25250,t:null,doc:'TTN-501',n:null});
  const vg=(no,src,sp,dy,kg,ty,dk,dt,pod,gu,tu)=>V.push({no,nak:'N-'+no.slice(-4),src,s:sp,dy,kg,ty,dk,dt,pod,gu,tush:tu,n:null});
  vg('60214417','TASHQI','ASK',null,69500,null,d(0),d(0),296283,null,424914);
  vg('60214425','TASHQI','ASK',null,69700,null,d(0),d(0),296283,null,null);
  vg('60214433','TASHQI','ASK',null,69600,null,d(0),d(1),296283,154500,null);
  /* tizim boshlanishidan oldin yuklangan, boshlanish kunida vagonda bo'lgan qum — vagon omborining boshlang'ich qoldig'i */
  vg('52870918','S01',null,d(-6),69650,5657624,d(0),d(0),296283,null,424914);
  vg('52870926','S01',null,d(-6),69800,5657624,d(0),d(0),296283,null,null);
  vg('52870934','S01',null,d(-5),69700,5657624,d(0),d(1),null,null,null);
  vg('52870942','S01',null,d(-5),69550,5657624,d(1),d(1),null,null,null);
  vg('52870959','S01',null,d(-4),69900,5657624,d(2),d(2),null,null,null);
  vg('52870967','S01',null,d(-4),69750,5657624,d(2),null,null,null,null);
  vg('52870975','S01',null,d(-3),69600,null,null,null,null,null,null);
  vg('52870983','S01',null,d(-2),69850,null,null,null,null,null,null);
  /* tizim ishlay boshlagach yuklanganlar: hammasi yo'lda, Chustga 5–6 kunda yetadi */
  ['52871106','52871114','52871122'].forEach((n,i)=>vg(n,'S01',null,d(0),[69750,69800,68700][i],i<2?5657624:null,null,null,null,null,null));
  ['52871130','52871148','52871155','52871163'].forEach((n,i)=>vg(n,'S01',null,d(1),[69850,69700,69900,69650][i],null,null,null,null,null,null));
  vg('52871171','S01',null,d(2),69800,null,null,null,null,null,null);
  vg('52871189','S01',null,d(2),69750,null,null,null,null,null,null);
  const mc=cfg.machines, ex=l=>mc.find(m=>m.type==='E'&&m.loc===l), pg=l=>mc.find(m=>m.type==='P'&&m.loc===l);
  const tx=(m,loc,op,day,mh,mr,l,kg,who)=>{ if(m) T.push({d:d(day),mc:m.code,loc,op,mh,km:null,mr,l,kg,who,n:null}); };
  [[8,136,210000],[9.5,171,245000],[7.5,120,190000]].forEach((x,i)=>tx(ex('K01'),'K01','Q',i,x[0],[4120,4129.5,4137.5][i],x[1],x[2],'Operator A'));
  [[6,66,119000],[6.5,70,122000],[6,75,116000]].forEach((x,i)=>tx(pg('K01'),'K01','Y',i,x[0],null,x[1],x[2],'Operator B'));
  tx(ex('K02'),'K02','Q',1,5,null,95,110000,'Operator C'); tx(pg('K02'),'K02','Y',2,2,null,24,29500,'Operator D');
  const tk=(m,day,km,mr,l,who)=>{ if(m) T.push({d:d(day),mc:m.code,loc:TR,op:null,mh:null,km,mr,l,kg:null,who,n:null}); };
  [[86,31],[84,30],[88,33]].forEach((x,i)=>tk(t1,i,x[0],[125086,125170,125258][i],x[1],'Haydovchi A'));
  [[52,17],[50,16],[54,18]].forEach((x,i)=>tk(t2,i,x[0],null,x[1],'Haydovchi B'));
  M.push({d:d(0),it:'DIZEL',op:'K',q:4800,p:11200,st:null,n:'BRAND YANGI MAKON'},{d:d(0),it:'SIM',op:'K',q:1800,p:1257,st:null,n:'ODIL METAL'},{d:d(0),it:'PLYONKA',op:'K',q:6000,p:4667,st:null,n:'MAXIMA ECOPLAST'});
  [[40,54,39],[55,72,56],[30,36,26]].forEach((x,i)=>{ M.push({d:d(i),it:'DIZEL',op:'S',q:x[0],p:null,st:'S01',n:null},{d:d(i),it:'SIM',op:'S',q:x[1],p:null,st:'S01',n:null},{d:d(i),it:'PLYONKA',op:'S',q:x[2],p:null,st:'S01',n:null}); });
  const e1=ex('K01');
  X.push({d:d(0),it:'K-SUV',lk:'K01',mc:null,sum:30000,pay:'Naqd',who:'Operator A',doc:null,n:null},{d:d(0),it:'K-TAX',lk:'K01',mc:null,sum:120000,pay:'Naqd',who:'Operator A',doc:'KO-101',n:null},{d:d(0),it:'S-XIZ',lk:'S01',mc:null,sum:450000,pay:'Bank',who:null,doc:'INV-77',n:'3 vagon'},
    {d:d(1),it:'K-OVQ',lk:'K01',mc:null,sum:650000,pay:'Karta',who:'Operator A',doc:'CHK-12',n:null},{d:d(1),it:'K-OVQ',lk:'K02',mc:null,sum:280000,pay:'Karta',who:'Operator C',doc:'CHK-13',n:null},{d:d(1),it:'S-XIZ',lk:'S01',mc:null,sum:600000,pay:'Bank',who:null,doc:'INV-78',n:'4 vagon'},{d:d(1),it:'C-TSH',lk:'C01',mc:null,sum:68966,pay:'Naqd',who:'Komiljon',doc:'KO-102',n:null},
    {d:d(2),it:'S-XIZ',lk:'S01',mc:null,sum:300000,pay:'Bank',who:null,doc:'INV-79',n:'2 vagon'},{d:d(2),it:'K-TAM',lk:'K01',mc:e1?e1.code:null,sum:850000,pay:'Naqd',who:'Operator A',doc:null,n:'Gidravlik shlang'});
  if(t1) X.push({d:d(0),it:'T-ISH',lk:TR,mc:null,sum:900000,pay:'Bank',who:null,doc:'QAY-10',n:'Haydovchilar avansi'},{d:d(1),it:'T-TAM',lk:TR,mc:t1.code,sum:320000,pay:'Karta',who:'Haydovchi A',doc:'CHK-21',n:'Shina ta\'miri'});
  I.push({d:d(2),wh:'C01',kg:234600,n:null});
  return {reys:R,vagon:V,tex:T,mat:M,xar:X,inv:I}; }
async function loadDemo(){ const data=demoRows(store.cfg.start,store.cfg); try{
    for(const j in data) await saveMany(j,data[j].map(r=>Object.assign({},r,{id:'d'+rid(),at:Date.now(),by:me.id||null,demo:1,rev:1})));
    ui.D=E.add(store.cfg.start,2); document.getElementById('repdate').value=ui.D; toast('Namuna yuklandi'); go('panel'); }catch(e){ toast(errMsg(e)); } }
async function clearDemo(){ try{ for(const j of JN){ const by={}; store.rows[j].filter(r=>r.demo).forEach(r=>{ (by[r._p]||(by[r._p]={pp:r._pp,rows:{}})).rows[r.id]={_del:1,dat:Date.now(),dby:me.id||null}; }); for(const p in by) await writeDoc(j,p,by[p].pp,by[p].rows); }
    toast("Namuna o'chirildi"); mount(); }catch(e){ toast(errMsg(e)); } }

/* ---------- Audit va moliyaviy harakat hujjatlari ---------- */
const AUDSEC={A:'Miqdor zanjiri (kg)',B:"Qiymat zanjiri (so'm)",C:'Tan narxga kirmagan summalar',D:'Ikki marta sanash va zanjirlar aralashishi xavfi',E:'Hisoblangan, fakti kutilayotgan summalar',F:'Birlamchi hujjatlar',G:"Sozlama to'liqligi"};
/* [hodisa, birlamchi hujjat, jurnal, tan narx komponenti, SAP B1 hujjati, debet, kredit] */
const DOCFLOW=[
  ['Krisha ochish (qum ustidagi tuproqni olish)',"Texnika hisoboti, krisha reyslari hisobi, marksheyder o'lchovi",'Kiritish → Krisha (reyslar va texnika); karyer umumiy xarajatidan ulush avtomatik','Krisha hovuzi (hali tan narxda emas)','Journal Entry: xarajatni kapitallashtirish',"Kelgusi davr xarajatlari — krisha ochish (namunaviy: NSBU 3190)","Yoqilg'i, jamg'arilgan eskirish, mehnat haqi, yetkazib beruvchilar"],
  ["Krisha xarajatini qazilgan qumga o'tkazish",'Kalkulyatsiya: qazilgan kg × stavka (shu sahifa)','avtomatik, qum qazilgan kuni','Krisha ochish (qumga yotqizilgan ulush)','Inventory Revaluation, WhsCode = karyer','Qum — karyer ombori','Kelgusi davr xarajatlari — krisha ochish'],
  ['Kondan qazib olish','Texnika hisoboti (qazish hajmi), marksheyder dalolatnomasi','Texnika','Kon qiymati: sotib olish va geologiya','Goods Receipt, WhsCode = karyer','Qum — karyer ombori','Kon zahirasi (kapitallashtirilgan qiymat)'],
  ["Yer qa'ri solig'i",'Soliq hisob-kitobi','avtomatik: qazilgan kg × stavka',"Yer qa'ri solig'i",'Journal Entry, oy oxirida Inventory Revaluation','Qum — karyer ombori',"Byudjetga to'lovlar bo'yicha qarz (NSBU 6410)"],
  ['Dizel, sim, plyonka kirimi','Yuk xati, hisob-faktura','Materiallar (kirim)','—','GRPO + A/P Invoice',"Yoqilg'i va materiallar (NSBU 1030, 1010)",'Yetkazib beruvchilar (NSBU 6010)'],
  ['Dizel sarfi: ekskavator, pogruzchik',"Texnika hisoboti, hisoblagich ko'rsatkichi, limit-zabor kartasi",'Texnika','Karyer: dizel (yoki stansiya, Chust)',"Goods Issue; xarajat markazi = bo'g'in, o'lcham = texnika","Bo'g'in xarajatlari (yordamchi ishlab chiqarish, NSBU 2310)","Yoqilg'i (NSBU 1030)"],
  ["Dizel bakka quyildi (norma usuli)","Yoqilg'i tarqatish qaydnomasi, limit-zabor kartasi",'Texnika («quyildi», l)','— (bakda turadi; sarf norma bo\'yicha)','Inventory Transfer: dizel ombori → texnika baki (yoki Goods Issue norma bo\'yicha)',"Yoqilg'i — texnika bakida (namunaviy: NSBU 1030 subschyot)","Yoqilg'i — ombor (NSBU 1030)"],
  ["Bak o'lchovi: dizel og'ishi","Bak o'lchovi dalolatnomasi (lineyka yoki datchik)","Texnika («Bak o'lchandi»)",'tan narxga kirmaydi — og\'ish','Goods Issue yoki Inventory Posting, xarajat markazi = DIZEL-OGISH',"Normadan ortiq sarf — og'ish hisobi (namunaviy: NSBU 9430 yoki aybdor shaxs 4730)","Yoqilg'i — texnika bakida"],
  ['Amortizatsiya: moto-soat bo\'yicha',"Texnika hisoboti, hisoblagich ko'rsatkichi",'Texnika (avtomatik)','Karyer: amortizatsiya','Fixed Assets: Manual Depreciation',"Bo'g'in xarajatlari (NSBU 2310)",'Jamg\'arilgan eskirish (NSBU 0200 qatori)'],
  ['Ish haqi va YaIT','Tabel, hisob-kitob qaydnomasi','Xarajatlar (doimiy modda; oy ichida reja ulushi)','Karyer / stansiya / Chust: doimiy xarajatlar','Journal Entry',"Bo'g'in xarajatlari (NSBU 2310)","Mehnat haqi (NSBU 6710), ijtimoiy soliq (NSBU 6520)"],
  ['Korporativ karta va naqd xarajat','Chek, avans hisoboti','Xarajatlar',"Bo'g'inning boshqa xarajatlari",'Outgoing Payment yoki Journal Entry',"Bo'g'in xarajatlari (NSBU 2310)",'Hisobdor shaxslar (NSBU 4220/4230), karta yoki kassa'],
  ["Oy oxiri: karyer xarajatlarini qum qiymatiga o'tkazish",'Kalkulyatsiya (shu sahifadagi qiymat zanjiri)','—','—','Inventory Revaluation, WhsCode = karyer','Qum — karyer ombori',"Bo'g'in xarajatlari (NSBU 2310)"],
  ['Karyer → stansiya: tashqi logistika','TTN, tarozi chiptasi, xizmat dalolatnomasi','Reyslar (Tashqi logistika)','Karyer → stansiya: tashqi logistika','Inventory Transfer + A/P Invoice (xizmat) → Inventory Revaluation','Qum — stansiya ombori','Yetkazib beruvchilar (NSBU 6010)'],
  ["Karyer → stansiya: o'z transporti","Yo'l varaqasi, tarozi chiptasi, yoqilg'i hisoboti","Reyslar (O'z transporti) + Texnika (km, dizel) + Xarajatlar (haydovchi)","Karyer → stansiya: o'z transporti","Inventory Transfer; transport xarajatlari yig'ilib, reyslarga taqsimlanadi → Inventory Revaluation",'Qum — stansiya ombori',"Transport xarajatlarini yig'uvchi hisob (NSBU 2310 yoki 2510)"],
  ["O'z transporti xarajatlari: dizel, amortizatsiya, haydovchi","Yo'l varaqasi, tabel, ta'mir dalolatnomasi","Texnika (yuk mashinasi), Xarajatlar (O'z transporti moddalari)","reyslarga taqsimlanadi",'Goods Issue, Manual Depreciation, Journal Entry',"Transport xarajatlarini yig'uvchi hisob","Yoqilg'i, jamg'arilgan eskirish, mehnat haqi"],
  ['Sotib olingan qum','Shartnoma, hisob-faktura, tarozi chiptasi','Reyslar yoki Vagonlar (ta\'minotchidan)','Sotib olingan qum','GRPO + A/P Invoice; tashuv — Landed Costs','Qum — qabul qilgan ombor','Yetkazib beruvchilar (NSBU 6010)'],
  ['Stansiya: saqlash, sim, plyonka, yuklash','Limit-zabor kartasi, ijara va xizmat hisob-fakturasi','Materiallar (sarf), Xarajatlar, Texnika','Stansiya: saqlash va vagonga yuklash','Goods Issue, A/P Invoice → Inventory Revaluation',"Qum — stansiya ombori (saqlash) yoki yo'ldagi qum (yuklash)",'Materiallar, yetkazib beruvchilar, mehnat haqi'],
  ["Vagonga yuklash va temir yo'l tarifi","Temir yo'l nakladnoyi, temir yo'l hisob-fakturasi (TexPD)",'Vagonlar (yuklangan sana, tarif)',"Temir yo'l tarifi",'Inventory Transfer S01 → T01 (S02 → T02); A/P Invoice → Inventory Revaluation',"Qum — vagon ombori (yo'ldagi)",'Yetkazib beruvchilar — temir yo\'l (NSBU 6010)'],
  ['Chust: podacha va tushirish','Xizmat dalolatnomasi, hisob-faktura','Vagonlar (tushirilgan sana, summalar)','Chust: podacha, tushirish, xarajatlar','Inventory Transfer T01 / T02 → C01 (faqat tushirilgan kuni); A/P Invoice → Inventory Revaluation','Qum — Chust ombori',"Qum — vagon ombori; xizmat uchun yetkazib beruvchilar (NSBU 6010)"],
  ["Boshlanish kunida vagonda bo'lgan qum","Temir yo'l nakladnoylari ro'yxati, balans qoldig'i",'Vagonlar (yuklangan sana boshlanishdan oldin) + Normativlar (balans qiymati)',"Boshlang'ich qoldiq qiymati","Boshlang'ich qoldiq, WhsCode = T01 / T02","Qum — vagon ombori (yo'ldagi)","Boshlang'ich qoldiqlar hisobi"],
  ['GU-46 jarima','GU-46 dalolatnomasi','Vagonlar (jarima)','tan narxga kirmaydi','A/P Invoice yoki Journal Entry','Boshqa operatsion xarajatlar (NSBU 9430)','Yetkazib beruvchilar (NSBU 6010)'],
  ['Chust → zavod','TTN, zavod tarozisi chiptasi','Reyslar','Chust → zavod: tashqi logistika yoki o\'z transporti','Inventory Transfer C → Z + A/P Invoice yoki transport taqsimoti','Qum — zavod xomashyo ombori (NSBU 1010)','Yetkazib beruvchilar yoki transport xarajatlari hisobi'],
  ['Inventarizatsiya kamomadi','Inventarizatsiya dalolatnomasi, taqqoslash qaydnomasi','Inventarizatsiya','zararga chiqariladi','Inventory Counting → Inventory Posting',"Kamomad va yo'qotishlar (NSBU 5910), keyin aybdor shaxs yoki 9430",'Qum — tegishli ombor']
];
function vAud(){ const c=ctx(), R=E.audit(c), cs=E.conserve(c), out=[], cfg=c.cfg;
  const cnt=s=>R.filter(r=>r.st===s).length, ic={ok:'✓ Joyida',warn:'△ Tekshiring',bad:'! Xato'};
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Audit: zanjir to\'liq va aralashmagan holda yuritilyaptimi'),el('span',{class:'muted'},fd(c.start)+' – '+fd(c.D))),
    kvTiles([['Tekshiruvlar',R.length,null],['Joyida',cnt('ok'),null],['Tekshirish kerak',cnt('warn'),null],['Xato',cnt('bad'),null],['Qiymat saqlanishi',cs.ok?'farq 0':fmt(cs.t.diff)+" so'm",'kiritilgan = qoldiq + yetkazilgan + kamomad']]),
    el('p',{class:'note'},"Har tekshiruv hisobot sanasidagi ma'lumot bo'yicha har ochilganda qayta hisoblanadi. «Xato» — raqamlarga ishonib bo'lmaydigan holat; «Tekshiring» — hisob to'g'ri, lekin ma'lumot to'liq emas yoki baho ishlatilgan.")));
  out.push(el('section',null,el('h2',null,'Har jurnal yozuvi qayerda hisobga olingan'),classMatrix(c).tab,el('p',{class:'note'},"Har yozuv aynan bitta ustunga tushadi. «Chetda» ustuni nol bo'lishi kerak; nol bo'lmasa, ro'yxati Hisobot → Yozuvlar nazorati bo'limida sababi bilan turibdi.")));
  Object.keys(AUDSEC).forEach(k=>{ const rows=R.filter(r=>r.sec===k); if(!rows.length) return;
    out.push(el('section',null,el('h2',null,k+'. '+AUDSEC[k]),table([['Holat'],['Tekshiruv','w'],['Natija','r'],['Izoh','w']],rows.map(r=>[chip(r.st,ic[r.st]),r.title,r.val,r.note])))); });
  out.push(el('section',null,el('h2',null,"Qiymat harakati: har komponent qayerdan kelib, qayerda turibdi"),
    table([['Komponent'],['Kiritilgan, mln','r'],['Omborlarda, mln','r'],['Zavodga yetkazilgan, mln','r'],['Kamomad, mln','r'],["Farq, so'm",'r']],
      cs.rows.filter(r=>Math.abs(r.inn)>0.5||Math.abs(r.diff)>0.5).map(r=>[r.name,fm(r.inn),fm(r.stock),fm(r.del),fm(r.loss),fmt(r.diff,0)]).concat([{cls:'total',cells:['Jami',fm(cs.t.inn),fm(cs.t.stock),fm(cs.t.del),fm(cs.t.loss),fmt(cs.t.diff,0)]}])),
    el('p',{class:'note'},"Har so'm bitta komponentda kiradi va qum bilan birga ombordan omborga ko'chadi. Farq ustuni har qatorda nol bo'lishi kerak: nol bo'lmasa, qiymat yo'lda yo'qolgan yoki ikki marta sanalgan."+(cs.pool>0.5?` «Krisha ochish» qatorining «Omborlarda» ustunidagi ${fm(cs.pool)} mln — krisha hovuzida turgan, hali qumga o'tmagan xarajat.`:''))));
  const sn=E.snapAt(c,c.D);
  out.push(el('section',null,el('h2',null,`Omborlar: kg va qiymat — ${fd(c.D)} holatiga`),table([['Ombor'],['Qoldiq, t','r'],['Qiymati, mln','r'],["1 kg tan narxi",'r'],['Norma','r'],['Harakat jurnali bo\'yicha, t','r']],
    WH.map(w=>[cfg.wh[w].full,ft(sn[w].q),fm(E.vsum(sn[w].v)),sn[w].q>0.5?fmt(E.vsum(sn[w].v)/sn[w].q,2):'—',fmt(c.NS.wh[w],1),ft(E.bal(c,w,c.D))])
    .concat(KQ.filter(L=>sn.KP[L].v>0.5||sn.KP[L].q>0.5).map(L=>({cls:'sub',cells:[cfg.wh[L].name+': krisha hovuzi (qum emas — kelgusi qumga o\'tadigan xarajat)',ft(sn.KP[L].q)+' krisha',fm(sn.KP[L].v),'—','—','—']}))))));
  const ms=Object.keys(c.own.months);
  if(ms.length) out.push(el('section',null,el('h2',null,"O'z transporti: xarajat qanday taqsimlandi"),table([['Oy'],['Dizel, mln','r'],['Amortizatsiya, mln','r'],['Ish haqi, mln','r'],['Boshqa, mln','r'],['Jami, mln','r'],["O'z reyslari",'r'],["so'm/reys",'r'],['Reyssiz mashina xarajati, mln','r'],['Holat']],
    ms.map(m=>{ const x=c.own.months[m], t=Object.values(x.T), dz=t.reduce((s,y)=>s+y.dz,0), am=t.reduce((s,y)=>s+y.am,0), ot=t.reduce((s,y)=>s+y.oth,0)+x.oth;
      return [m.slice(5,7)+'.'+m.slice(0,4),fm(dz),fm(am),fm(x.lab),fm(ot),fm(x.tot),x.n,x.n?fmt(x.tot/x.n):'—',fm(x.idle),x.n?chip('ok','✓ Taqsimlandi'):(x.tot>0.5?chip('bad','! Reys yo\'q'):chip('na','—'))]; })),
    el('p',{class:'note'},"Jami = dizel (yuk mashinalari yoqilg'isi, shu kundagi o'rtacha narxda) + amortizatsiya (km × stavka) + haydovchilar ish haqi + ta'mir va boshqa. Shu summa oyning o'z reyslari orasida bo'linadi va faqat transport komponentiga tushadi — karyer yoki stansiya xarajatiga aralashmaydi.")));
  out.push(el('section',null,el('h2',null,'Moliyaviy harakat hujjatlari: hodisadan buxgalteriya yozuvigacha'),
    table([['Hodisa','w'],['Birlamchi hujjat','w'],['Qaysi jurnalga kiritiladi','w'],['Tan narx komponenti','w'],['SAP B1 hujjati','w'],['Debet','w'],['Kredit','w']],DOCFLOW),
    el('p',{class:'note'},"Hisob raqamlari — namunaviy NSBU hisoblar rejasi bo'yicha yo'nalish; o'zingizdagi SAP hisoblar rejasidagi raqamlar bilan almashtiring. Har modda uchun aniq hisobni Normativlar → Xarajat moddalari jadvalidagi «SAP hisob» ustuniga kiritasiz.")));
  return out; }

/* ---------- Hisobot: davr bo'yicha tarix, ombor kartochkasi, tan narx dinamikasi, xarajat reyestri, yozuvlar nazorati ---------- */
const REPT=[['zanjir','Zanjir harakati'],['kon','Karyer bosqichlari: zaxira, krisha, qum'],['ombor','Ombor kartochkasi'],['tan','Tan narx dinamikasi'],['reg','Xarajatlar reyestri'],['bak',"Texnika baklari va dizel og'ishi"],['chet','Yozuvlar nazorati']];
const CGR=[['Karyer',['zx','kr','nd','kdz','kam','kfx','kot']],['Sotib olingan qum',['buy']],['Karyer → stansiya',['h1x','h1o']],['Stansiya',['st']],["Temir yo'l",['ty']],['Chust',['ch']],['Chust → zavod',['h2x','h2o']],["To'g'ridan zavodga",['h3x','h3o']],["Boshlang'ich qoldiq",['op']]];
const RJ={tex:'Texnika',mat:'Materiallar',xar:'Xarajatlar',reys:'Reyslar',vagon:'Vagonlar',inv:'Inventarizatsiya',karyer:'Karyer (eski)',fix:'Doimiy xarajat (kunlik ulush)',auto:'Avtomatik (kon qiymati, soliq)',open:"Boshlang'ich qoldiq"};
const REB=['Fakt','Norma yoki reja','Taqsimot'];
function repRange(){ const r=ui.rep, D=ui.D, s=store.cfg.start; let a, b=D;
  if(r.sc==='kun') a=D; else if(r.sc==='hafta') a=E.add(D,-6); else if(r.sc==='oy') a=E.ms(D); else if(r.sc==='otgan'){ b=E.add(E.ms(D),-1); a=E.ms(b); }
  else if(r.sc==='yil') a=D.slice(0,4)+'-01-01'; else if(r.sc==='all') a=s; else { a=r.from||E.ms(D); b=r.to||D; }
  if(a<s) a=s; if(b>D) b=D; return [a,b]; }
function buckets(a,b,g){ const out=[]; if(a>b) return out;
  if(g==='kun'){ for(let d=a; d<=b; d=E.add(d,1)) out.push([fd(d),d,d]); }
  else if(g==='hafta'){ let x=a; while(x<=b){ const dow=(E.dn(x)+3)%7, y0=E.add(x,6-dow), y=y0>b?b:y0; out.push([fd(x).slice(0,5)+' – '+fd(y).slice(0,5),x,y]); x=E.add(y,1); } }
  else { let x=a; while(x<=b){ const me=E.me(x), y=me>b?b:me; out.push([x.slice(5,7)+'.'+x.slice(0,4),x,y]); x=E.add(y,1); } }
  return out; }
/* Chiziqli grafik: bitta qator (so'm/kg) va norma chizig'i; sichqoncha yoki klaviatura bilan har nuqta qiymati */
function lineChart(pts,norm,unit){ if(pts.length<2) return null; const W=960,H=250,ml=56,mr=104,mt=14,mb=30, n=pts.length;
  const vals=pts.map(p=>p.v).concat(norm!=null?[norm]:[]); let lo=Math.min(...vals), hi=Math.max(...vals); if(hi-lo<1e-9){ hi+=1; lo-=1; } const pad=(hi-lo)*0.12; lo-=pad; hi+=pad; if(lo<0&&Math.min(...vals)>=0) lo=0;
  const step0=(hi-lo)/4, mag=Math.pow(10,Math.floor(Math.log10(step0))), step=[1,2,2.5,5,10].map(k=>k*mag).find(k=>k>=step0)||step0; lo=Math.floor(lo/step)*step; hi=Math.ceil(hi/step)*step;
  const X=i=>ml+(n===1?0:i*(W-ml-mr)/(n-1)), Y=v=>mt+(hi-v)*(H-mt-mb)/(hi-lo), sv=(t,a,...k)=>{ const e=document.createElementNS('http://www.w3.org/2000/svg',t); for(const q in a) e.setAttribute(q,a[q]); k.flat().forEach(x=>{ if(x!=null) e.append(x.nodeType?x:document.createTextNode(x)); }); return e; };
  const dec=step<1?2:(step<10?1:0), s=sv('svg',{viewBox:`0 0 ${W} ${H}`,class:'chart',role:'img',tabindex:'0','aria-label':`Zavodga kelgan qum tan narxi, ${unit}: ${pts.map(p=>p.l+' — '+fmt(p.v,1)).join('; ')}`});
  for(let v=lo; v<=hi+1e-9; v+=step){ s.append(sv('line',{x1:ml,x2:W-mr,y1:Y(v),y2:Y(v),class:'cg'}),sv('text',{x:ml-8,y:Y(v)+4,class:'ca','text-anchor':'end'},fmt(v,dec))); }
  const every=Math.max(1,Math.ceil(n/9)); pts.forEach((p,i)=>{ if((i%every===0&&n-1-i>=every*0.7)||i===n-1) s.append(sv('text',{x:X(i),y:H-9,class:'ca','text-anchor':i===0?'start':(i===n-1?'end':'middle')},p.l)); });
  if(norm!=null) s.append(sv('line',{x1:ml,x2:W-mr,y1:Y(norm),y2:Y(norm),class:'cn'}),sv('text',{x:W-mr+8,y:Y(norm)+4,class:'ca'},'norma '+fmt(norm,1)));
  const path=pts.map((p,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(p.v).toFixed(1)).join(' ');
  s.append(sv('path',{d:path+` L${X(n-1).toFixed(1)} ${Y(lo)} L${X(0).toFixed(1)} ${Y(lo)} Z`,class:'cw'}),sv('path',{d:path,class:'cl2'}));
  const last=pts[n-1], ly=Y(last.v), ny=norm!=null?Y(norm):-99; s.append(sv('circle',{cx:X(n-1),cy:ly,r:5,class:'cd'}),sv('text',{x:W-mr+8,y:(Math.abs(ly-ny)<13?(ly<=ny?ny-13:ny+13):ly)+4,class:'cv'},fmt(last.v,1)));
  const hair=sv('line',{y1:mt,y2:H-mb,class:'ch',visibility:'hidden'}), hd=sv('circle',{r:5,class:'cd',visibility:'hidden'}); s.append(hair,hd);
  const tip=el('div',{class:'ctip',hidden:true}), wrap=el('div',{class:'chartwrap'},s,tip); let cur=-1;
  const show=i=>{ cur=i; const p=pts[i]; hair.setAttribute('x1',X(i)); hair.setAttribute('x2',X(i)); hair.setAttribute('visibility','visible'); hd.setAttribute('cx',X(i)); hd.setAttribute('cy',Y(p.v)); hd.setAttribute('visibility','visible');
    tip.replaceChildren(el('b',{class:'num'},fmt(p.v,2)+' '+unit),el('span',null,p.l+(p.t?' · '+p.t:'')),norm!=null?el('span',{class:'num'},'normadan '+fs(p.v-norm,2)):null); tip.hidden=false;
    const r=s.getBoundingClientRect(), px=X(i)/W*r.width; tip.style.left=Math.max(0,Math.min(r.width-170,px+(px>r.width*0.6?-178:10)))+'px'; tip.style.top=Math.max(0,Y(p.v)/H*r.height-34)+'px'; };
  const hide=()=>{ cur=-1; hair.setAttribute('visibility','hidden'); hd.setAttribute('visibility','hidden'); tip.hidden=true; };
  s.addEventListener('pointermove',ev=>{ const r=s.getBoundingClientRect(), x=(ev.clientX-r.left)/r.width*W; let i=Math.round((x-ml)/((W-ml-mr)/(n-1))); i=Math.max(0,Math.min(n-1,i)); if(i!==cur) show(i); });
  s.addEventListener('pointerleave',hide); s.addEventListener('blur',hide); s.addEventListener('focus',()=>show(n-1));
  s.addEventListener('keydown',ev=>{ if(ev.key==='ArrowLeft'||ev.key==='ArrowRight'){ ev.preventDefault(); show(Math.max(0,Math.min(n-1,(cur<0?n-1:cur)+(ev.key==='ArrowLeft'?-1:1)))); } });
  return wrap; }
/* Kapitalizatsiya reyestri qatorlari: doimiy xarajat va avtomatik hisoblar oy bo'yicha yig'iladi, qolganlari — har yozuv alohida */
function regRows(c,a,b){ const led=c.led, out=[], agg={}; const by={}; ['tex','mat','xar','reys'].forEach(j=>{ by[j]={}; c[j].forEach(r=>by[j][r.id]=r); }); by.vagon={}; c.vag.forEach(v=>by.vagon[v.id]=v);
  const src=(led.reg0||[]).concat(led.reg);
  for(const g of src){ const d=g[0]; if(d<a||d>b) continue; const j=g[3], id=g[4];
    if(j==='fix'||j==='auto'){ const k=d.slice(0,7)+'|'+j+'|'+id+'|'+g[5]+'|'+g[1]+'|'+g[6]; let o=agg[k]; if(!o){ o=agg[k]={d:null,dl:d.slice(5,7)+'.'+d.slice(0,4),j,L:g[5],i:g[1],x:0,e:g[6],id,doc:'',desc:j==='fix'?((c.item[id]||{}).name||id)+(g[6]?' — reja ulushi':' — oy fakti kunlarga yoyilgan'):(id==='zx'?'Kon qiymati: sotib olish va geologiya: qazilgan kg × 1 kg narxi':"Yer qa'ri solig'i: qazilgan kg × stavka")}; out.push(o); } o.x+=g[2]; continue; }
    const r=by[j]&&by[j][id]; let desc='', doc='';
    if(j==='tex'&&r){ desc=r.m.name+' · '+(OPS[r.op]||'')+' · '+(Math.abs(g[2]-r.dz)<0.01?'dizel '+fmt(r.cons)+' l'+(r.nm?' (norma)':''):'amortizatsiya '+fmt(r.mh,1)+' m-s'); doc=r.who||''; }
    else if(j==='mat'&&r){ const m=c.cfg.mats[r.it]||{name:r.it,unit:''}; desc=m.name+' sarfi: '+fmt(r.q,1)+' '+m.unit; doc=r.n||''; }
    else if(j==='xar'&&r){ desc=((c.item[r.it]||{}).name||r.it)+(r.who?' · '+r.who:''); doc=r.doc||''; }
    else if(j==='reys'&&r){ desc=(g[1]===CI.buy?'Qum: ':(r.kr?'':'Tashuv: '))+r.rname+' · '+(r.kr?fmt(r.rn)+' reys':(r.a||''))+' · '+fmt(r.kgQ)+' kg'; doc=r.doc||''; }
    else if(j==='vagon'&&r){ desc=(g[1]===CI.ty?"Temir yo'l tarifi":(g[1]===CI.buy?'Sotib olingan qum':'Podacha va tushirish'))+' · vagon '+(r.no||'')+' · '+fmt(r.kg)+' kg'; doc=r.nak||''; }
    else if(j==='open'){ desc="Boshlang'ich qoldiq qiymati"; }
    out.push({d,dl:fd(d),j,L:g[5],i:g[1],x:g[2],e:g[6],id,doc,desc}); }
  out.sort((x,y)=>(x.d||x.dl.slice(3)+'-'+x.dl.slice(0,2)+'-99')<(y.d||y.dl.slice(3)+'-'+y.dl.slice(0,2)+'-99')?-1:1);
  return out; }
function classMatrix(c){ const cl=E.classify(c), cs=E.classSum(cl), ks=['in','pool','neutral','open','wait','pre','future','out'];
  const rows=Object.keys(cs).filter(j=>cs[j].n).map(j=>{ const g=cs[j], bad=g.by.out.n; return [RJ[j]||j,g.n].concat(ks.map(k=>g.by[k].n||'—'),[bad?chip('bad','! '+bad+' ta chetda'):chip('ok','✓ Hammasi hisobda')]); });
  const tot=ks.map(k=>Object.keys(cs).reduce((s,j)=>s+cs[j].by[k].n,0)), all=Object.keys(cs).reduce((s,j)=>s+cs[j].n,0);
  if(rows.length) rows.push({cls:'total',cells:['Jami',all].concat(tot.map(x=>x||'—'),[tot[7]?chip('bad','! '+tot[7]+' ta'):chip('ok','✓')])});
  return {cl,cs,tab:rows.length?table([['Jurnal'],['Jami yozuv','r'],['Tan narxga kirdi','r'],['Reyslarga taqsimlandi','r'],['Xarajat emas','r'],["Boshlang'ich qoldiq",'r'],['Kutilmoqda','r'],['Boshlanishdan oldin','r'],['Sanadan keyin','r'],['Chetda','r'],['Holat']],rows,{name:'Yozuvlar nazorati'}):el('div',{class:'panel empty'},"Hali yozuv yo'q.")}; }
function rowTitle(c,j,r){ const sup=code=>(c.cfg.suppliers.find(s=>s.code===code)||{}).name||'';
  if(j==='reys'){ const rt=E.route(c.cfg,r.m); return (r.rname||(rt?E.rtName(c.cfg,rt):r.m)||'')+(r.a?' · '+r.a:'')+' · '+fmt(r.kgQ!=null?r.kgQ:(r.wq||r.wj||0))+' kg'; }
  if(j==='reys0') return (r.rname||r.m||'')+' · '+(r.a||'')+' · '+fmt(r.kgQ!=null?r.kgQ:(r.wq||0))+' kg';
  if(j==='vagon') return 'Vagon '+(r.no||'')+' · '+(r.src==='TASHQI'?sup(r.s):E.whName(c.cfg,r.src))+' · '+fmt(r.kg)+' kg';
  if(j==='tex'&&E.isAud(r)) return ((E.mc(c.cfg,r.mc)||{}).name||r.mc||'')+" · bak o'lchandi · "+fmt(E.n(r.bak),0)+' l';
  if(j==='tex'&&r.op==='Q'&&!E.n(r.mh)&&!E.n(r.l)) return 'Qum qazildi · '+fmt(E.n(r.kg)||0)+' kg';
  if(j==='tex') return ((E.mc(c.cfg,r.mc)||{}).name||r.mc||'')+' · '+(r.op?OPS[r.op]||r.op:'km '+fmt(r.km||0))+' · quyildi '+fmt(r.l||0)+' l';
  if(j==='mat') return ((c.cfg.mats[r.it]||{}).name||r.it)+' · '+(r.op==='K'?'kirim':'sarf')+' '+fmt(r.q,1);
  if(j==='xar') return ((c.item[r.it]||{}).name||r.it)+' · '+E.whName(c.cfg,r.lk)+(r.who?' · '+r.who:'');
  if(j==='inv') return E.whName(c.cfg,r.wh)+' · '+fmt(r.kg)+' kg';
  return ''; }
function repSheets(c,a,b){ const out=[], g=ui.rep.grp, NS=c.NS, cfg=c.cfg;
  const sumW=(sn,ws)=>ws.reduce((s,w)=>s+sn[w].q,0), fl=(ws,x,y,sg)=>ws.reduce((s,w)=>s+E.flow(c,w,x,y,sg),0);
  /* 1. zanjir */
  { const B=buckets(a,b,g), rows=B.map(([lab,x,y])=>{ const sn=E.snapAt(c,y), dl=E.delivered(c,x,y); let cap=0; for(let d=x; d<=y; d=E.add(d,1)) cap+=c.led.dcap[d]||0;
      return [g==='kun'?{d:x}:lab,fl(['K01','K02'],x,y,1)/1000,fl(['S01','S02'],x,y,1)/1000,fl(['T01','T02'],x,y,1)/1000,fl(['C01'],x,y,1)/1000,fl(['Z01'],x,y,1)/1000,sumW(sn,['K01','K02'])/1000,sumW(sn,['S01','S02'])/1000,sumW(sn,['T01','T02'])/1000,sn.C01.q/1000,cap/1e6,dl.unit==null?'':dl.unit]; });
    const dl=E.delivered(c,a,b), sn=E.snapAt(c,b); let cap=0; for(let d=a; d<=b; d=E.add(d,1)) cap+=c.led.dcap[d]||0;
    const tot=['Jami / davr oxiri',fl(['K01','K02'],a,b,1)/1000,fl(['S01','S02'],a,b,1)/1000,fl(['T01','T02'],a,b,1)/1000,fl(['C01'],a,b,1)/1000,fl(['Z01'],a,b,1)/1000,sumW(sn,['K01','K02'])/1000,sumW(sn,['S01','S02'])/1000,sumW(sn,['T01','T02'])/1000,sn.C01.q/1000,cap/1e6,dl.unit==null?'':dl.unit]; tot._b=1;
    out.push({key:'zanjir',name:'Zanjir harakati',heads:['Davr','Qazildi, t','Stansiyaga keldi, t','Vagonga yuklandi, t','Chustda tushirildi, t','Zavodga keldi, t','Qoldiq: karyer, t','Qoldiq: stansiya, t','Qoldiq: vagonlarda, t','Qoldiq: Chust, t','Kiritilgan xarajat, mln','Zavodga kelgan qum, so\'m/kg'],rows:rows.concat([tot]),dec:[0,1,1,1,1,1,1,1,1,1,2,1]}); }
  /* 2. ombor kartochkasi */
  { const w=ui.rep.wh, B=buckets(a,b,g), rows=[]; for(const [lab,x,y] of B){ const inn=E.flow(c,w,x,y,1), ot=-E.flow(c,w,x,y,0), adj=E.adjSum(c,w,x,y); if(g==='kun'&&!inn&&!ot&&!adj) continue; const sn=E.snapAt(c,y)[w], val=E.vsum(sn.v), op=E.bal(c,w,E.add(x,-1));
      rows.push([g==='kun'?{d:x}:lab,op,inn,ot,adj,sn.q,val,sn.q>0.5?val/sn.q:'',E.idleOf(sn.v)]); }
    const sn=E.snapAt(c,b)[w], val=E.vsum(sn.v), tot=['Jami / davr oxiri',E.bal(c,w,E.add(a,-1)),E.flow(c,w,a,b,1),-E.flow(c,w,a,b,0),E.adjSum(c,w,a,b),sn.q,val,sn.q>0.5?val/sn.q:'',E.idleOf(sn.v)]; tot._b=1;
    out.push({key:'ombor',name:'Ombor '+w,heads:['Davr','Boshida, kg','Kirim, kg','Chiqim, kg','Inventar farqi, kg','Oxirida, kg',"Qiymati, so'm","1 kg tan narxi, so'm","shundan bo'sh turish, so'm"],rows:rows.concat([tot]),dec:[0,0,0,0,0,0,0,2,0]}); }
  /* 3. tan narx dinamikasi */
  { const B=buckets(a,b,g==='kun'&&E.dn(b)-E.dn(a)>120?'hafta':g), mk=(lab,x,y)=>{ const dl=E.delivered(c,x,y), k=dl.kg; return [lab,k/1000,dl.val/1e6,k>0?dl.unit:''].concat(CGR.map(gr=>k>0?gr[1].reduce((s,q)=>s+dl.v[CI[q]],0)/k:''),[k>0?dl.idle/k:'',NS.total,k>0?dl.unit-NS.total:'']); };
    const rows=B.map(([lab,x,y])=>mk(lab,x,y)).filter(r=>r[1]>0), tot=mk('Davr jami',a,b); tot._b=1;
    out.push({key:'tan',name:'Tan narx dinamikasi',heads:['Davr','Zavodga keldi, t','Qiymati, mln',"Tan narx, so'm/kg"].concat(CGR.map(x=>x[0]),["shundan bo'sh turish",'Norma',"Og'ish"]),rows:rows.concat([tot]),dec:[0,1,2,2].concat(CGR.map(()=>2),[2,1,2])}); }
  /* 4. xarajatlar reyestri */
  { const R=regRows(c,a,b), rows=R.map(r=>[r.d?{d:r.d}:r.dl,RJ[r.j]||r.j,r.L?E.whName(cfg,r.L):'',COMP[r.i][1],r.desc,r.doc,r.x,REB[r.e]]); const t=['Jami','','','','','',R.reduce((s,r)=>s+r.x,0),'']; t._b=1;
    out.push({key:'reg',name:'Xarajatlar reyestri',heads:['Sana','Manba',"Bo'g'in",'Tan narx komponenti','Tavsif','Hujjat / izoh',"Summa, so'm",'Asos'],rows:rows.concat([t]),raw:R,dec:[0,0,0,0,0,0,0,0]}); }
  KQ.forEach(L=>{ const k=konSheet(c,L,a,b); if(k.any) out.push(k); });
  { const k=bakSheet(c,a,b); if(k.any) out.push(k); }
  return out; }
function sheetTable(s,opt){ const heads=s.heads.map((h,i)=>[h,(i&&s.rows.some(r=>typeof r[i]==='number'))?'r':'']);
  const rows=s.rows.map(r=>{ const cells=r.map((v,i)=>v&&v.d?fd(v.d):(typeof v==='number'?fmt(v,s.dec[i]||0):v)); return r._b?{cls:'total',cells}:cells; });
  return table(heads,rows,Object.assign({name:s.name},opt||{})); }
function vRep(){ const c=ctx(), r=ui.rep, [a,b]=repRange(), out=[], D=ui.D;
  if(D<c.start) return [el('div',{class:'banner'},`Hisobot sanasi tizim boshlanishidan (${fd(c.start)}) oldin — hisobot uchun ma'lumot yo'q.`)];
  const df=el('input',{id:'rep-from',type:'date','aria-label':'Boshlanish'}), dt=el('input',{id:'rep-to',type:'date','aria-label':'Tugash'}); df.value=a; dt.value=b;
  df.addEventListener('change',()=>{ if(df.value){ r.sc='ora'; r.from=df.value; r.to=dt.value||b; mount(); } }); dt.addEventListener('change',()=>{ if(dt.value){ r.sc='ora'; r.to=dt.value; r.from=df.value||a; mount(); } });
  const ts=el('select',{id:'rep-type','aria-label':'Hisobot turi'},REPT.map(x=>el('option',{value:x[0]},x[1]))); ts.value=r.type; ts.addEventListener('change',()=>{ r.type=ts.value; mount(); });
  const S=repSheets(c,a,b);
  const allBtn=el('button',{type:'button',class:'pri',id:'rep-all',onclick:()=>exportAll(c,a,b,S)},"Hammasini Excelga");
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Hisobot'),el('span',{class:'muted'},`${fd(a)} – ${fd(b)} · ${fmt(E.dn(b)-E.dn(a)+1)} kun`)),
    el('div',{class:'fbar'},ts,segBtn([['kun','Bugun'],['hafta','7 kun'],['oy','Oy'],['otgan',"O'tgan oy"],['yil','Yil'],['all','Boshidan'],['ora','Oraliq']],r.sc,v=>{ r.sc=v; if(v==='ora'){ r.from=a; r.to=b; } mount(); }),
      el('span',{class:'frange'},df,el('span',{class:'muted'},'–'),dt),
      (r.type==='zanjir'||r.type==='ombor'||r.type==='tan')?segBtn([['kun','Kunlik'],['hafta','Haftalik'],['oy','Oylik']],r.grp,v=>{ r.grp=v; mount(); },'Guruhlash'):null,allBtn),
    el('p',{class:'note'},"Davr hisobot sanasidan nariga o'tmaydi. «Hammasini Excelga» — shu davr hisobotlari va barcha jurnallar bitta faylda, har biri alohida varaqda. Har jadval ostidagi «Excel» faqat o'sha jadvalni yuklaydi.")));
  if(r.type==='zanjir'){ const s=S.find(x=>x.key==='zanjir'), sn=E.snapAt(c,b), dl=E.delivered(c,a,b), tot=s.rows[s.rows.length-1];
    out.push(el('section',null,el('h2',null,'Zanjir harakati: har davrda qancha qum qayerdan qayerga o\'tdi'),kvTiles([['Qazildi',fmt(tot[1],1)+' t',null],['Vagonga yuklandi',fmt(tot[3],1)+' t',null],['Chustda tushirildi',fmt(tot[4],1)+' t',null],['Zavodga keldi',fmt(tot[5],1)+' t',dl.unit==null?null:fmt(dl.unit,1)+" so'm/kg"],['Kiritilgan xarajat',fmt(tot[10],2)+' mln',null]]),
      sheetTable(s),el('p',{class:'note'},"Qoldiqlar — har davr oxiriga. «Vagonlarda» — yuklangan, hali Chustda tushirilmagan qum. «Kiritilgan xarajat» — shu davrda tan narxga yozilgan jami summa (fakt va baho).")));
  } else if(r.type==='kon'){ const KS=S.filter(x=>x.L);
    if(!KS.length) out.push(el('section',null,el('h2',null,'Karyer bosqichlari'),el('div',{class:'panel empty'},"Bu davrda karyerlarda harakat yo'q.")));
    KS.forEach(s=>out.push(el('section',null,el('h2',null,`${c.cfg.wh[s.L].full}: zaxiradan vagongacha — miqdor, xarajat va tan narx`),sheetTable(s),
      el('p',{class:'note'},"Tan narx = xarajat ÷ miqdor. 1–2: yer ostidagi qum va uni ochish; 3–7: qazilgan qum nimadan tashkil topgani; 8–10: karyer ombori; 11–16: stansiyagacha va vagonga; 18: hali qumga o'tmagan krisha xarajati. Krisha qatorlarida so'm/kg va m³ — krishaning o'ziga nisbatan. Qoldiq qatorlari — davr oxiriga, o'rtacha tortilgan narxda."))));
  } else if(r.type==='ombor'){ const ws=el('select',{id:'rep-wh','aria-label':'Ombor'},WH.map(w=>el('option',{value:w},c.cfg.wh[w].full))); ws.value=r.wh; ws.addEventListener('change',()=>{ r.wh=ws.value; mount(); });
    const s=S.find(x=>x.key==='ombor'), sn=E.snapAt(c,b)[r.wh];
    out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Ombor kartochkasi'),ws),sheetTable(s,{name:'Ombor kartochkasi '+r.wh}),
      el('p',{class:'note'},"Boshida + kirim − chiqim ± inventar farqi = oxirida. Kunlik ko'rinishda harakatsiz kunlar tashlab ketilgan. Qiymat va 1 kg tan narxi — davr oxiriga, zanjir bo'ylab yig'ilgan."),
      el('h3',{style:'margin-top:8px'},`Qoldiq nimadan tashkil topgan — ${fd(b)} kun oxiriga`),compTable(sn.v,sn.q)));
  } else if(r.type==='tan'){ const s=S.find(x=>x.key==='tan'), pts=s.rows.slice(0,-1).filter(x=>x[3]!=='').map(x=>({l:x[0],v:x[3],t:fmt(x[1],1)+' t'})), ch=lineChart(pts,c.NS.total,"so'm/kg");
    out.push(el('section',null,el('h2',null,"Zavodga kelgan qumning 1 kg tan narxi"),ch?el('figure',{class:'panel pad chartfig'},ch,el('figcaption',{class:'note'},"Chiziq — har davrda zavodga haqiqatda kelgan qumning o'rtacha tortilgan tan narxi; kulrang chiziq — norma. Nuqta ustiga boring yoki ← → tugmalarini bosing.")):null,
      sheetTable(s),el('p',{class:'note'},"Ustunlar yig'indisi tan narxga teng: har kilogramm karyerdan boshlab o'z yo'lidagi xarajatlarni yig'ib kelgan. Zavodga qum kelmagan davrlar ko'rsatilmaydi.")));
  } else if(r.type==='bak'){ const s=S.find(x=>x.key==='bak'), fv=E.fuelVar(c,a,b), tc=E.tankCheck(c);
    out.push(el('section',null,el('h2',null,"Texnika baklari: quyildi, sarf, og'ish"),
      s?[kvTiles([["Dizel og'ishi (o'lchovlar)",fs(fv.aud.l,0)+' l',fs(fv.aud.v,0)+" so'm · "+fv.aud.n+" o'lchov"],['Baklarda hisobda (hozir)',fmt(tc.lit,0)+' l',fm(tc.val)+" mln so'm · "+tc.n+' ta bak'],fv.open.n?["Bakda qolgan dizel xarajatdan qaytarildi",fs(fv.open.v,0)+" so'm",fmt(-fv.open.l,0)+" l · birinchi o'lchovda, tan narx ichida"]:null]),sheetTable(s)]
       :el('div',{class:'panel empty'},"Bu davrda texnika yozuvi yo'q."),
      el('p',{class:'note'},"Norma usulidagi texnika: bak boshida + quyildi − sarf (norma) − og'ish = bak oxirida. Og'ish — bak o'lchovida topilgan farq (hisobda − o'lchangan): musbat bo'lsa normadan ortiq yongan yoki kam quyilgan. U qum tan narxiga kirmaydi, shu yerda alohida ko'rinadi. Fakt usulidagi texnikada quyilgan dizel o'sha kunning sarfi, bak yuritilmaydi. Har texnikaning to'liq daftari — Texnika bo'limidagi kartochkasida.")));
  } else if(r.type==='reg'){ const s=S.find(x=>x.key==='reg'), f=r.f, R=s.raw;
    const mkSel=(k,lab,opts)=>{ const e=el('select',{id:'rep-f-'+k,'aria-label':lab},el('option',{value:''},lab+': hammasi'),opts.map(o=>el('option',{value:o[0]},o[1]))); e.value=f[k]||''; e.addEventListener('change',()=>{ f[k]=e.value; refreshRep(); }); return e; };
    const q=el('input',{id:'rep-q',type:'search',placeholder:'Qidirish: hujjat, mashina, vagon…','aria-label':'Qidirish'}); q.value=f.q||''; q.addEventListener('input',()=>{ f.q=q.value; refreshRep(); });
    const js=[...new Set(R.map(x=>x.j))], Ls=[...new Set(R.map(x=>x.L).filter(Boolean))], cs=[...new Set(R.map(x=>x.i))].sort((x,y)=>x-y);
    const draw=()=>{ const ws=(f.q||'').trim().toLowerCase().split(/\s+/).filter(Boolean); const rows=R.filter(x=>(!f.j||x.j===f.j)&&(!f.L||x.L===f.L)&&(f.i===''||f.i==null||String(x.i)===f.i)&&(!f.e||String(x.e)===f.e)&&(!ws.length||ws.every(w=>(x.desc+' '+x.doc+' '+x.dl).toLowerCase().indexOf(w)>=0)));
      const sum=rows.reduce((t,x)=>t+x.x,0), est=rows.filter(x=>x.e===1).reduce((t,x)=>t+x.x,0);
      return [kvTiles([['Qatorlar',fmt(rows.length),null],['Jami summa',fm(sum)+' mln',null],['Shundan norma yoki reja bo\'yicha',fm(est)+' mln',sum?fmt(est/sum*100,0)+'%':null]]),
        table([['Sana'],['Manba'],["Bo'g'in"],['Tan narx komponenti'],['Tavsif','w2'],['Hujjat / izoh'],["Summa, so'm",'r'],['Asos']],rows.map(x=>[x.dl,RJ[x.j]||x.j,x.L?E.whName(c.cfg,x.L):'—',COMP[x.i][1],x.desc,x.doc||'—',fmt(x.x),chip(x.e===1?'warn':(x.e===2?'na':'ok'),REB[x.e])]).concat([{cls:'total',cells:[`Jami: ${fmt(rows.length)} qator`,'','','','','',fmt(sum),'']}]),{name:'Xarajatlar reyestri'})]; };
    ui.repDraw=draw; const full=R.reduce((t,x)=>t+x.x,0); let ledT=0; (c.led.reg0||[]).concat(c.led.reg).forEach(g=>{ if(g[0]>=a&&g[0]<=b) ledT+=g[2]; });
    out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,"Xarajatlar reyestri: tan narxga yozilgan har so'm manbasi bilan"),Math.abs(full-ledT)<1?chip('ok','✓ Reyestr = qiymat zanjiri'):chip('bad','! Farq '+fmt(full-ledT))),
      el('div',{class:'fbar'},mkSel('j','Manba',js.map(x=>[x,RJ[x]||x])),mkSel('L',"Bo'g'in",Ls.map(x=>[x,E.whName(c.cfg,x)])),mkSel('i','Komponent',cs.map(x=>[String(x),COMP[x][1]])),mkSel('e','Asos',[['0','Fakt'],['1','Norma yoki reja'],['2','Taqsimot']]),q),
      el('div',{id:'rep-list'},draw()),
      el('p',{class:'note'},"Doimiy xarajatlar (ish haqi, ijara) va avtomatik hisoblar (zahira qiymati, yer qa'ri solig'i) oy bo'yicha bitta qatorga yig'ilgan; qolgan har bir yozuv alohida. «Norma yoki reja» — fakt hujjati kelguncha hisoblangan summa; fakt kiritilganda o'zi almashadi. O'z transporti dizeli, amortizatsiyasi va haydovchi ish haqi bu yerda reyslar orqali «Taqsimot» bo'lib ko'rinadi.")));
  } else { const M=classMatrix(c), f=r.f, lab={out:'bad',wait:'warn',pre:'na',future:'na',pool:'ok',in:'ok',neutral:'na',open:'na'};
    const list=[]; Object.keys(M.cl).forEach(j=>M.cl[j].forEach(x=>{ if(x.cls==='in'||x.cls==='neutral'||x.cls==='pool'||x.cls==='open') return; if(f.cls&&x.cls!==f.cls) return; list.push([J[j]?fd(J[j].date(x.r)):fd(x.r.d),RJ[j]||j,rowTitle(c,j,x.r),x.sum?fmt(x.sum):'—',chip(lab[x.cls],E.CLS[x.cls]),x.why||'—']); }));
    const cs=el('select',{id:'rep-cls','aria-label':'Holat'},el('option',{value:''},'Holat: hammasi'),['out','wait','pre','future'].map(k=>el('option',{value:k},E.CLS[k]))); cs.value=f.cls||''; cs.addEventListener('change',()=>{ f.cls=cs.value; mount(); });
    out.push(el('section',null,el('h2',null,'Yozuvlar nazorati: har jurnal yozuvi qayerda hisobga olingan'),M.tab,
      el('p',{class:'note'},"Har yozuv aynan bitta ustunga tushadi, shuning uchun qator yig'indisi «Jami yozuv»ga teng. «Chetda» — hech bir bo'g'inga tushmagan yozuv: uni tuzatish kerak. «Kutilmoqda» — hisobga olinadi, lekin hali emas (masalan, joriy oydagi ish haqi fakti oy yopilganda reja ulushi o'rnini egallaydi). Hisob butun davr bo'yicha, tanlangan oraliqqa bog'liq emas.")),
      el('section',null,el('div',{class:'sechead'},el('h2',null,'Tan narxga kirmagan yoki kutilayotgan yozuvlar'),cs),
        list.length?table([['Sana'],['Jurnal'],['Yozuv','w'],["Summa, so'm",'r'],['Holat'],['Sabab','w']],list,{name:'Tan narxga kirmagan yozuvlar'}):el('div',{class:'panel empty'},"Bunday yozuv yo'q: hamma yozuv tan narxda yoki xarajat emas.")));
  }
  return out; }
function refreshRep(){ const l=document.getElementById('rep-list'); if(l&&ui.repDraw){ l.replaceChildren(...[].concat(ui.repDraw()).flat(Infinity).filter(Boolean)); } }
/* Hammasi bitta Excel faylda: davr hisobotlari + barcha jurnallar (xom ma'lumot) + audit */
function exportAll(c,a,b,S){ const sheets=S.map(s=>({name:s.name,heads:s.heads,rows:s.rows}));
  const M=classMatrix(c); sheets.push(tableDataOf(M.tab,'Yozuvlar nazorati'));
  const sn=E.snapAt(c,b); sheets.push({name:'Omborlar '+fd(b),heads:['Kod','Ombor','Qoldiq, kg',"Qiymati, so'm","1 kg, so'm"].concat(COMP.map(x=>x[1]),["shundan bo'sh turish"]),rows:WH.map(w=>[w,c.cfg.wh[w].full,sn[w].q,E.vsum(sn[w].v),sn[w].q>0.5?E.vsum(sn[w].v)/sn[w].q:''].concat(COMP.map((x,i)=>sn[w].v[i]),[E.idleOf(sn[w].v)]))});
  const A=E.audit(c); sheets.push({name:'Audit',heads:["Bo'lim",'Holat','Tekshiruv','Natija','Izoh'],rows:A.map(r=>[AUDSEC[r.sec]||r.sec,{ok:'Joyida',warn:'Tekshiring',bad:'Xato'}[r.st],r.title,String(r.val),r.note])});
  const optName=(fdef,v)=>{ if(v==null||v==='') return ''; if(fdef.t!=='sel') return v; try{ const o=fdef.opts({}).find(x=>x[0]===v); return o?o[1]:v; }catch(e){ return v; } };
  ['reys','vagon','tex','mat','xar','inv'].forEach(j=>{ const rows=store.rows[j].slice().sort((x,y)=>(J[j].date(x)||'')<(J[j].date(y)||'')?-1:1); if(!rows.length) return;
    const FL=J[j].fields.filter(f=>!f.hid); sheets.push({name:J[j].title,heads:FL.map(f=>f.l).concat(['Namuna']),rows:rows.map(r=>FL.map(f=>{ const v=r[f.k]; if(v==null||v==='') return ''; if(f.t==='date') return {d:v}; if(f.t==='num') return +v; return optName(f,v); }).concat([r.demo?'ha':'']))}); });
  exportSheets(sheets,'hisobot_'+a+'_'+b); }
function tableDataOf(tblock,name){ const t=tblock.querySelector?tblock.querySelector('table'):null; if(!t) return {name,heads:['—'],rows:[]}; const heads=[...t.querySelectorAll('thead th')].map(th=>th.textContent), rc=[...t.querySelectorAll('thead th')].map(th=>th.classList.contains('r'));
  return {name,heads,rows:[...t.querySelectorAll('tbody tr')].map(tr=>{ const o=[...tr.children].map((td,i)=>xval(td.textContent,rc[i])); if(tr.classList.contains('total')) o._b=1; return o; })}; }

/* ---------- Tarix: kim, qachon, nimani o'zgartirdi; o'chirilgan yozuvlarni tiklash; sozlama o'zgarishlari; baza holati ---------- */
const OPN={import:['na','Excel importi'],add:['ok',"Qo'shildi"],edit:['warn','Tahrirlandi'],del:['bad',"O'chirildi"],restore:['ok','Tiklandi']};
async function loadHist(){ const h=ui.hist; if(!h||h.state!=='need') return; h.state='loading';
  try{ const get=async coll=>{ const s=await db.collection(coll).where('d','>=',h.from).where('d','<=',h.to).limit(1000).get(); return s.docs.map(x=>x.data()).filter(x=>x&&x.d>=h.from&&x.d<=h.to); };
    const [lg,cg]=await Promise.all([get('log'),get('cfglog')]); const en=[]; lg.forEach(d=>{ const e=d.e||{}; for(const k in e) en.push(e[k]); }); en.sort((x,y)=>y.t-x.t);
    h.en=en; h.cfg=cg.sort((x,y)=>y.t-x.t); h.full=lg.length>=1000; h.names={};
    const ids=[...new Set(en.map(x=>x.by).concat(h.cfg.map(x=>x.by)).filter(Boolean))];
    if(user&&user.profiles&&ids.length){ try{ const ps=await user.profiles(ids); ids.forEach(i=>{ if(ps[i]&&ps[i].name) h.names[i]=ps[i].name; }); }catch(e){} }
    h.state='ok';
  }catch(e){ console.error(e); h.state='err'; }
  if(ui.tab==='hist') mount(); }
function vHist(){ const c=ctx(), D=ui.D, out=[]; const tday=new Date(Date.now()+5*36e5).toISOString().slice(0,10);
  if(!ui.hist) ui.hist={state:'need',from:ui.histFrom||E.add(tday,-13),to:ui.histTo||tday,en:[],cfg:[],names:{}};
  const h=ui.hist, f=ui.histF; if(h.state==='need') loadHist();
  const who=id=>!id?'—':(id===me.id?(h.names[id]||'Siz'):(h.names[id]||'Foydalanuvchi'));
  const tm=t=>{ const d=new Date(t+5*36e5).toISOString(); return fd(d.slice(0,10))+' '+d.slice(11,16); };
  const flab=(j,k)=>{ const fdef=J[j]&&J[j].fields.find(x=>x.k===k); return fdef?fdef.l:k; };
  const fval=(j,k,v)=>{ if(v==null||v==='') return '∅'; const fdef=J[j]&&J[j].fields.find(x=>x.k===k); if(fdef&&fdef.t==='num') return fmtIn(v); if(fdef&&fdef.t==='date') return fd(v); if(fdef&&fdef.t==='sel'){ try{ const o=fdef.opts({}).find(q=>q[0]===v); if(o) return o[1]; }catch(e){} } return String(v); };
  const df=el('input',{id:'hist-from',type:'date','aria-label':'Boshlanish'}), dt=el('input',{id:'hist-to',type:'date','aria-label':'Tugash'}); df.value=h.from; dt.value=h.to;
  const re=()=>{ ui.histFrom=df.value||h.from; ui.histTo=dt.value||h.to; ui.hist=null; mount(); }; df.addEventListener('change',re); dt.addEventListener('change',re);
  const js=el('select',{id:'hist-j','aria-label':'Jurnal'},el('option',{value:''},'Jurnal: hammasi'),['reys','vagon','tex','mat','xar','inv'].map(j=>el('option',{value:j},J[j].title))); js.value=f.j||''; js.addEventListener('change',()=>{ f.j=js.value; mount(); });
  const os=el('select',{id:'hist-op','aria-label':'Amal'},el('option',{value:''},'Amal: hammasi'),Object.keys(OPN).map(k=>el('option',{value:k},OPN[k][1]))); os.value=f.op||''; os.addEventListener('change',()=>{ f.op=os.value; mount(); });
  const en=h.en.filter(x=>(!f.j||x.j===f.j)&&(!f.op||x.op===f.op));
  const rows=en.map(x=>{ const r=x.row||{}; let det;
    if(x.op==='edit'){ const ks=Object.keys(x.ch||{}); det=ks.length?ks.map(k=>flab(x.j,k)+': '+fval(x.j,k,x.ch[k][0])+' → '+fval(x.j,k,x.ch[k][1])).join('; '):"o'zgarish yo'q"; }
    else det=Object.keys(r).map(k=>flab(x.j,k)+': '+fval(x.j,k,r[k])).join('; ');
    return [tm(x.t),who(x.by),J[x.j]?J[x.j].title:x.j,chip(OPN[x.op]?OPN[x.op][0]:'na',OPN[x.op]?OPN[x.op][1]:x.op),x.d?fd(x.d):'—',det]; });
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,"O'zgarishlar tarixi"),el('span',{class:'muted'},h.state==='loading'?'Yuklanmoqda…':`${fmt(en.length)} ta amal`)),
    el('div',{class:'fbar'},el('span',{class:'frange'},df,el('span',{class:'muted'},'–'),dt),js,os),
    h.state==='err'?el('div',{class:'banner'},"Tarixni yuklab bo'lmadi. Aloqani tekshirib, sanani qayta tanlang."):
    (rows.length?table([['Vaqt'],['Kim'],['Jurnal'],['Amal'],['Yozuv sanasi'],["Nima kiritildi yoki o'zgardi",'w']],rows,{name:"O'zgarishlar tarixi"}):el('div',{class:'panel empty'},h.state==='loading'?'Yuklanmoqda…':"Bu davrda o'zgarish yozilmagan. Har qo'shish, tahrir, o'chirish va tiklash shu yerda ko'rinadi.")),
    el('p',{class:'note'},"Har yozuv qo'shilganda, tahrirlanganda, o'chirilganda yoki tiklanganda bu yerga alohida qator tushadi: kim, qachon, eski va yangi qiymat. Tarix jurnal yozuvlaridan alohida saqlanadi va sahifadan o'chirilmaydi."+(h.full?" Davrda yozuv ko'p — hammasi sig'madi, oraliqni qisqartiring.":''))));
  /* o'chirilganlar */
  const dead=[]; ['reys','vagon','tex','mat','xar','inv'].forEach(j=>store.dead[j].forEach(r=>{ if(!r.demo) dead.push([j,r]); })); dead.sort((x,y)=>(y[1].dat||0)-(x[1].dat||0));
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,"O'chirilgan yozuvlar"),el('span',{class:'muted'},fmt(dead.length)+' ta')),
    dead.length?table([['Jurnal'],['Yozuv sanasi'],['Yozuv','w'],["O'chirilgan vaqt"],['Kim'],['']],dead.map(([j,r])=>[J[j].title,fd(J[j].date(r)),rowTitle(c,j,r)+(r.demo?' · namuna':''),r.dat?tm(r.dat):'—',who(r.dby),
      canWrite?el('button',{type:'button',class:'link',onclick:async ev=>{ ev.currentTarget.disabled=true; try{ await restoreRow(j,r); toast('Yozuv tiklandi'); }catch(e){ toast(errMsg(e)); } }},'Tiklash'):'']),{noExport:true})
    :el('div',{class:'panel empty'},"O'chirilgan yozuv yo'q."),
    el('p',{class:'note'},"O'chirish yozuvni bazadan olib tashlamaydi — faqat belgilaydi va hisobdan chiqaradi. «Tiklash» uni avvalgi holida qaytaradi.")));
  /* sozlama */
  const crow=h.cfg.map(x=>{ let ch=[]; try{ ch=JSON.parse(x.ch||'[]'); }catch(e){} const fv=v=>v==null?'∅':(typeof v==='number'?fmtIn(v):String(v));
    return [tm(x.t),who(x.by),ch.length,ch.slice(0,10).map(q=>q[0]+': '+fv(q[1])+' → '+fv(q[2])).join('; ')+(ch.length>10?` … yana ${ch.length-10} ta`:'')]; });
  out.push(el('section',null,el('h2',null,"Normativ va sozlama o'zgarishlari"),crow.length?table([['Vaqt'],['Kim'],["O'zgargan maydon",'r'],['Eski → yangi','w']],crow,{name:"Sozlama o'zgarishlari"}):el('div',{class:'panel empty'},"Bu davrda sozlama o'zgarmagan."),
    el('p',{class:'note'},"Norma, reja, tarif yoki boshlang'ich qoldiq o'zgarsa, o'tgan davr hisobi ham shu yangi qiymat bilan qayta hisoblanadi (fakt hujjati kiritilmagan joylarda). Shuning uchun har o'zgarish oldingi qiymati bilan saqlanadi.")));
  /* baza holati */
  const cap=['reys','vagon','tex','mat','xar','inv'].map(j=>{ const ds=store.docs[j], ids=Object.keys(ds); let mx=0; ids.forEach(i=>{ const n=ds[i]&&ds[i].rows?Object.keys(ds[i].rows).length:0; if(n>mx) mx=n; });
    return [J[j].title,fmt(store.rows[j].length),fmt(store.dead[j].length),ids.length,mx?`${mx} / ${ROWS_MAX}`:'—',store.ready[j]?chip('ok','✓ Yuklangan'):chip('warn','Yuklanmoqda')]; });
  out.push(el('section',null,el('h2',null,'Baza holati'),table([['Jurnal'],['Yozuvlar','r'],["O'chirilgan",'r'],['Hujjat (bo\'lak)','r'],["Eng to'la bo'lak",'r'],['Holat']],cap,{noExport:true}),
    el('p',{class:'note'},mem?"Hozir xotira rejimi: sahifa yopilganda ma'lumot yo'qoladi. Nashr qilingan sahifada ma'lumot bazada saqlanadi.":`Har oy yozuvlari ${ROWS_MAX} talik bo'laklarda saqlanadi; bo'lak to'lsa yangisi ochiladi. Mavjud bo'lak hech qachon ustidan yozilmaydi — yangi yozuv faqat qo'shiladi.`)));
  return out; }
function flatCfg(o,p,out){ if(o&&typeof o==='object'){ if(Array.isArray(o)) o.forEach((x,i)=>flatCfg(x,p+'['+((x&&x.code)||i)+']',out)); else for(const k in o) flatCfg(o[k],p?p+'.'+k:k,out); } else out[p]=o==null||o===''?null:o; return out; }
async function cfgLog(prev,next){ try{ const a=flatCfg(mergeCfg(prev),'',{}), b=flatCfg(mergeCfg(next),'',{}), ch=[]; new Set(Object.keys(a).concat(Object.keys(b))).forEach(k=>{ if(/\.note$/.test(k)) return; const x=a[k]===undefined?null:a[k], y=b[k]===undefined?null:b[k]; if(x!==y&&ch.length<200) ch.push([k,x,y]); });
    if(!ch.length) return; const day=new Date(Date.now()+5*36e5).toISOString().slice(0,10);
    await db.collection('cfglog').doc(Date.now().toString(36)+tabId).set({t:Date.now(),d:day,by:me.id||null,ch:JSON.stringify(ch),prev:prev?JSON.stringify(prev):null}); ui.hist=null;
  }catch(e){ console.error('cfglog',e); toast("Sozlama saqlandi, lekin tarixga yozib bo'lmadi."); } }

/* ---------- SAP ---------- */
const SAPMAP=[
  ['Texnika: qazish hajmi','Goods Receipt (OIGN)',"ItemCode, WhsCode = karyer (K01 / K02), miqdor, narx = shu karyer normativi. Qarshi hisob — karyer xarajatlarini yig'uvchi hisob."],
  ['Texnika: dizel sarfi','Goods Issue (OIGE)',"Dizel ItemCode, xarajat markazi = bo'g'in, qo'shimcha o'lcham = texnika. Norma usulida miqdor — norma bo'yicha sarf; bak o'lchovidagi farq alohida qator bilan «DIZEL-OGISH» markaziga (og'ish hisobi) chiqariladi. Bakdagi qoldiq SAPda alohida ombor (texnika baki) sifatida yuritilsa — quyish Inventory Transfer bo'ladi."],
  ['Amortizatsiya (moto-soat)','Fixed Assets: Manual Depreciation yoki Journal Entry',"Summa = oylik moto-soat × stavka, har bir texnika bo'yicha; xarajat markazi = bo'g'in."],
  ["O'z transporti tannarxi",'Journal Entry / Inventory Revaluation',"Yuk mashinalari dizeli, amortizatsiyasi va haydovchi ish haqi transport hisobida yig'iladi; «O'z transporti taqsimoti» eksporti bo'yicha qabul qilgan ombor qiymatiga o'tkaziladi."],
  ['Reys: karyer → stansiya','Inventory Transfer (OWTR)',"K01 / K02 → S01, miqdor = qabul vazni. Ikki tarozi farqi — Goods Issue (OIGE) yo'qotish hisobiga."],
  ["Reys: ta'minotchi → stansiya / zavod",'GRPO (OPDN) + A/P Invoice (OPCH)',"WhsCode = S01 yoki Z01. Tashuv — Landed Costs (OIPF) orqali tan narxga."],
  ['Vagon yuklandi','Inventory Transfer (OWTR)',"S01 → T01 (Ziyovuddin: S02 → T02), sana = yuklangan kun, miqdor = nakladnoy vazni. UDF: vagon №, nakladnoy №. Shu kundan qum vagon omborida."],
  ['Sim, plyonka sarfi','Goods Issue (OIGE)',"Xarajat markazi = stansiya."],
  ['Vagon tushirildi','Inventory Transfer (OWTR)',"T01 / T02 → C01, sana = tushirilgan kun (yuklangan yoki kelgan kun emas). Temir yo'l tarifi, podacha, tushirish — A/P xizmat hisob-fakturasi, tan narxga qo'shiladi."],
  ['GU-46 jarima','A/P Invoice yoki Journal Entry',"Tan narxga emas, davr xarajatiga. Bu sahifada og'ish sifatida ko'rinadi."],
  ['Reys: Chust → zavod','Inventory Transfer (OWTR)',"C01 → Z01, miqdor = zavod tarozisi."],
  ['Inventarizatsiya','Inventory Counting → Inventory Posting (OIQR)',"Farq — kamomad yoki ortiqcha hisobiga."],
  ['Xarajatlar: karta, naqd, bank','A/P Invoice / Outgoing Payment / Journal Entry',"Moddaga biriktirilgan SAP hisob, xarajat markazi = bo'g'in, o'lcham = texnika."],
  ['Oy oxiri: norma va fakt farqi','Inventory Revaluation (OMRV)',"Bo'g'in bo'yicha yig'ilgan fakt xarajat minus normativ kapitalizatsiya — ombor qiymatiga yoki og'ish hisobiga."]
];
function csvOf(kind){ const c=ctx(), a=E.ms(ui.D), b=ui.D, it=c.cfg.sapItem, L=[]; const esc=v=>{ v=v==null?'':String(v); return /[";\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
  const push=arr=>L.push(arr.map(esc).join(';')); const dd=d=>d.replace(/-/g,''); const sup=code=>(c.cfg.suppliers.find(s=>s.code===code)||{}).name||'';
  if(kind==='transfer'){ push(['DocDate','FromWarehouse','ToWarehouse','ItemCode','Quantity','Reference','U_Mashina','U_Vagon','Comments']);
    c.reys.filter(r=>E.inr(r.d,a,b)&&r.from!=='TASHQI'&&r.from!=='?'&&!r.kr).forEach(r=>push([dd(r.d),r.from,r.to,it,r.kgQ,r.doc||'',r.a||'','',r.rname]));
    c.vag.filter(v=>v.ent&&!v.pre&&E.inr(v.dy,a,b)).forEach(v=>push([dd(v.dy),v.src,v.tw,it,v.kg,v.nak||'','',v.no,'Vagon yuklandi: stansiya → vagon ombori']));
    c.vag.filter(v=>v.exd&&E.inr(v.dt,a,b)).forEach(v=>push([dd(v.dt),v.tw,'C01',it,v.kg,v.nak||'','',v.no,'Vagon tushirildi: vagon ombori → Chust'])); }
  else if(kind==='grpo'){ push(['DocDate','CardName','ItemCode','Quantity','Price','WarehouseCode','Reference','U_Mashina','U_Vagon']);
    c.reys.filter(r=>E.inr(r.d,a,b)&&r.from==='TASHQI').forEach(r=>push([dd(r.d),sup(r.s),it,r.kgQ,r.price,r.to,r.doc||'',r.a||'','']));
    c.vag.filter(v=>v.ext&&E.inr(v.dt,a,b)).forEach(v=>push([dd(v.dt),sup(v.s),it,v.kg,v.kg?v.sand/v.kg:0,'C01',v.nak||'','',v.no])); }
  else if(kind==='receipt'){ push(['DocDate','ItemCode','Quantity','WarehouseCode','Price','U_Texnika','Comments']);
    c.tex.filter(t=>E.inr(t.d,a,b)&&t.op==='Q'&&stageOf(t.loc)==='karyer').forEach(t=>push([dd(t.d),it,t.kg,t.loc,(c.NS.wh[t.loc]||0).toFixed(4),t.m.name,'Qazish'])); }
  else if(kind==='issue'){ push(['DocDate','ItemCode','Quantity','CostCenter','U_Texnika','LineTotal']);
    c.tex.filter(t=>E.inr(t.d,a,b)&&!t.aud&&(t.cons>0||Math.abs(t.dz)>0.005)).forEach(t=>push([dd(t.d),'DIZEL',+t.cons.toFixed(3),t.truck?'TRANSPORT':t.loc,t.m.name+(t.nm?' (norma)':''),t.dz.toFixed(2)]));
    c.tex.filter(t=>E.inr(t.d,a,b)&&t.aud&&Math.abs(t.og||0)>0.005).forEach(t=>push([dd(t.d),'DIZEL',+(t.audK==='aud'?t.ogL:-t.credL).toFixed(3),t.audK==='aud'?'DIZEL-OGISH':(t.truck?'TRANSPORT':t.loc),t.m.name+(t.audK==='aud'?" (bak o'lchovi farqi)":" (bakda qolgan dizel xarajatdan qaytarildi)"),t.og.toFixed(2)]));
    c.mat.filter(m=>m.op==='S'&&E.inr(m.d,a,b)&&c.P[m.it]).forEach(m=>push([dd(m.d),m.it,m.q,m.st,'',((E.n(m.q)||0)*E.pr(c.P,m.it,m.d,SITE_OF[m.st])).toFixed(2)])); }
  else if(kind==='amort'){ push(['Oy','Texnika','CostCenter','Birlik','Hajm','Stavka','Summa']);
    const g={}; c.tex.filter(t=>E.inr(t.d,a,b)&&!t.qo).forEach(t=>{ const k=t.mc+'|'+t.loc; const x=g[k]||(g[k]={t,mh:0,am:0}); x.mh+=t.truck?t.km:t.mh; x.am+=t.am; });
    Object.values(g).forEach(x=>push([a.slice(0,7),x.t.m.name,x.t.truck?'TRANSPORT':x.t.loc,x.t.truck?'km':'moto-soat',x.mh.toFixed(1),x.t.rate.toFixed(2),x.am.toFixed(0)])); }
  else if(kind==='own'){ push(['DocDate','Marshrut','ToWarehouse','Mashina','Quantity','Dizel','Amortizatsiya','IshHaqi','Boshqa','Jami','SomKg','Reference']);
    c.reys.filter(r=>E.inr(r.d,a,b)&&r.own).forEach(r=>{ const p=r.parts||{dz:0,am:0,lab:0,oth:0}; push([dd(r.d),r.rname,r.to,r.a||'',r.kgQ,p.dz.toFixed(0),p.am.toFixed(0),p.lab.toFixed(0),p.oth.toFixed(0),r.haul.toFixed(0),r.kgQ?(r.haul/r.kgQ).toFixed(4):'',r.doc||'']); }); }
  else if(kind==='val'){ const sn=E.snapAt(c,b); push(['Sana','WarehouseCode','Ombor','Quantity','Qiymat','SomKg'].concat(COMP.map(x=>x[1]),['Shundan: bosh turish']));
    WH.forEach(w=>push([dd(b),w,c.cfg.wh[w].full,sn[w].q.toFixed(0),E.vsum(sn[w].v).toFixed(0),sn[w].q>0.5?(E.vsum(sn[w].v)/sn[w].q).toFixed(4):''].concat(sn[w].v.map(x=>x.toFixed(0)))));
    KQ.forEach(L=>{ const p=sn.KP[L]; if(p.v>0.5||p.q>0.5) push([dd(b),'KR-'+L,c.cfg.wh[L].name+': krisha hovuzi (kelgusi qumga)',p.q.toFixed(0),p.v.toFixed(0),'']); }); }   /* oxirgi ustun — qiymat ichidagi bo'sh turish ulushi, Qiymatga qo'shilmaydi */
  else if(kind==='loss'){ push(['DocDate','WarehouseCode','ItemCode','Quantity','Turi','Reference']);
    c.reys.filter(r=>E.inr(r.d,a,b)&&r.loss>0&&r.from!=='TASHQI').forEach(r=>push([dd(r.d),r.from,it,r.loss,"Yo'ldagi yo'qotish",r.doc||'']));
    c.adj.filter(x=>E.inr(x.d,a,b)).forEach(x=>push([dd(x.d),x.wh,it,x.kg.toFixed(0),x.kg<0?'Inventar kamomad':'Inventar ortiqcha',''])); }
  else if(kind==='cost'){ push(['DocDate','Modda','SAP_hisob','CostCenter','U_Texnika','Summa','Tolov','Kim','Hujjat','Izoh']);
    c.xar.filter(x=>E.inr(x.d,a,b)).forEach(x=>{ const i=c.item[x.it]||{}; const m=c.cfg.machines.find(q=>q.code===x.mc); push([dd(x.d),i.name||x.it,i.acc||'',x.lk||'',m?m.name:'',x.sum,x.pay,x.who||'',x.doc||'',x.n||'']); });
    c.reys.filter(r=>E.inr(r.d,a,b)).forEach(r=>push([dd(r.d),(r.own?"Tashuv (o'z transporti): ":'Tashuv (tashqi logistika): ')+r.rname,'',r.stage.toUpperCase(),r.own?(r.a||''):'',r.haul.toFixed(0),'',r.own?'':(r.c||''),r.doc||'',r.a||'']));
    c.vag.filter(v=>v.ent&&!v.pre&&E.inr(v.dy,a,b)).forEach(v=>push([dd(v.dy),"Temir yo'l tarifi",'','TEMIR','',v.tyH,'','',v.nak||'',(E.n(v.ty)==null?'NORMA ':'')+v.no]));
    c.vag.filter(v=>E.inr(v.dt,a,b)).forEach(v=>{ push([dd(v.dt),'Podacha + tushirish','','C01','',v.podH+v.tushH,'','',v.nak||'',((E.n(v.pod)==null||E.n(v.tush)==null)?'NORMA ':'')+v.no]); if(v.guH) push([dd(v.dt),'GU-46 jarima','','JARIMA','',v.guH,'','',v.nak||'',v.no]); }); }
  return L.join('\r\n'); }
function vSap(){ const kinds=[['transfer',"Ombor ko'chirishlari (OWTR)"],['grpo','Sotib olingan qum (OPDN)'],['receipt','Karyer kirimi (OIGN)'],['issue','Dizel va material sarfi (OIGE)'],['amort','Amortizatsiya (moto-soat, km)'],['own',"O'z transporti taqsimoti (reyslar bo'yicha)"],['val',"Ombor qoldig'i va qiymati (qayta baholash uchun)"],['loss',"Yo'qotish va inventar farqi"],['cost','Xarajatlar reyestri']];
  const csv=csvOf(ui.sap), n=Math.max(0,csv.split('\r\n').length-1);
  const sel=el('select',{id:'sap-kind',style:'width:auto'},kinds.map(k=>el('option',{value:k[0]},k[1]))); sel.value=ui.sap; sel.addEventListener('change',()=>{ui.sap=sel.value;mount();});
  const ta=el('textarea',{id:'sap-csv',readonly:true,'aria-label':'CSV'}); ta.value=csv;
  const acts=el('div',{class:'actions'},sel,
    el('button',{type:'button',onclick:async()=>{ try{ await navigator.clipboard.writeText(csv); toast('Nusxalandi'); }catch(e){ ta.focus(); ta.select(); toast("Matn belgilandi — nusxa oling"); } }},'Nusxa olish'),
    downloads?el('button',{type:'button',class:'pri',onclick:async()=>{ try{ await downloads.save({filename:'qum_'+ui.sap+'_'+ui.D.slice(0,7)+'.csv',data:'﻿'+csv}); }catch(e){ if(e&&e.code!=='declined') toast("Yuklab bo'lmadi — nusxa oling"); } }},'CSV yuklab olish'):null,
    el('span',{class:'muted'},`${n} qator · ${ui.D.slice(5,7)}.${ui.D.slice(0,4)} oyi, ${fd(ui.D)} gacha`));
  return [el('section',null,el('h2',null,'Jurnallar SAP B1 da qaysi hujjatga aylanadi'),table([['Hodisa'],['SAP B1 hujjati'],['Asosiy maydonlar','w']],SAPMAP),
      el('p',{class:'note'},"Omborlar bo'yicha qayta baholash uchun SAP da «Manage Item Cost per Warehouse» yoqilgan bo'lishi kerak. Yoqilmagan bo'lsa, har bosqich uchun alohida ItemCode va ishlab chiqarish buyurtmasi (BOM: oldingi bosqich qumi + tashuv resursi) ishlatiladi.")),
    el('section',null,el('h2',null,'Eksport'),el('p',{class:'note'},"Ajratuvchi — nuqtali vergul. Ustunlarni DTW shabloningizga moslab oling; UDF nomlari (U_Mashina, U_Vagon, U_Texnika) — taklif."),acts,ta)]; }

/* =====================================================================
   6b. KIRITISH — operatorlar uchun kunlik panellar
   To'rt joy, har birida bitta operator: Samarqand (karyer + stansiya), Qibray (Mayskiy karyer + Bo'zsuv stansiyasi), Chust, Megaton.
   Karyerda yagona mantiq: operator MIQDORNI (qancha qum qazildi, qancha krisha ochildi) va har TEXNIKANING jami soati hamda dizelini kiritadi;
   texnika xarajatini krisha ochish, qum qazish va qum yuklash o'rtasida tizim shu kungi tonnaga mutanosib bo'ladi (yuklangan qum — karyerdan chiqqan reyslardan).
   Ish turini tanlash, soatni bo'lish kerak emas.
   Har operator faqat o'z joyida bo'lgan ishni ko'radi. Har «vazifa» — mavjud jurnalning sodda shakli: bo'g'in, marshrut, ish turi
   oldindan belgilangan, operator faqat sanab-o'lchab biladigan narsani yozadi. Hisob-kitobning hammasi shu yozuvlardan chiqadi.
   ===================================================================== */
const SITE_K={SAM:['K02','S02','K2S','K2O'],QIB:['K01','S01','KS1','K1O']};
const mcSite=m=>m.type==='T'?(m.site||'QIB'):SITE_OF[m.loc];
function opTasks(site){ const cfg=store.cfg, T=[], mcs=cfg.machines;
  const mcAt=L=>code=>{ const m=E.mc(cfg,code); return !!m&&m.type!=='T'&&m.loc===L; }, trk=code=>{ const m=E.mc(cfg,code); return !!m&&m.type==='T'&&mcSite(m)===site; };
  const hasMc=L=>mcs.some(m=>m.type!=='T'&&m.loc===L), hasTr=mcs.some(m=>m.type==='T'&&mcSite(m)===site), links=(SITES.find(x=>x[0]===site)||[0,0,[]])[2];
  const add=t=>{ t.key='op-'+site+'-'+t.id; T.push(t); };
  const TXL={mc:'Qaysi texnika',mh:'Necha moto-soat ishladi',l:'Quyilgan dizel, litr',mr:"Hisoblagich ko'rsatkichi (kun oxiri)",who:'Operator (kim ishlatdi)',n:'Izoh'};
  if(SITE_K[site]){ const [K,S,rs,rk]=SITE_K[site], kn=cfg.wh[K].name, sn=E.stName(cfg,S);
    const kmc=mcs.filter(m=>m.type!=='T'&&m.loc===K);
    add({id:'qaz',grp:'Karyer',title:'Qum qazildi',sub:"Bugun jami qancha qum qazildi. Samosval bilan sanasangiz: reys soni × bir reys hajmi — kg ni o'zi hisoblaydi.",j:'tex',fix:{loc:K,op:'Q'},fields:['d','kg','n'],def:{mc:''},
      lab:{kg:'Qazilgan qum, kg',n:'Izoh'},calc:{k:'kg',z:'zich'},daily:1,match:r=>r.loc===K&&r.op==='Q'&&!E.isTruck(cfg,r.mc)});
    add({id:'kr',grp:'Karyer',title:'Krisha ochildi',sub:"Bugun nechta reys krisha (qum ustidagi tuproq) olib chiqildi. Vazn o'zi hisoblanadi: reys soni × reys hajmi. Aniq vaznni bilsangiz — o'zingiz yozing.",j:'reys',fix:{m:rk},fields:['d','rn','wq','tk','a','c','t','n'],
      lab:{rn:'Krisha reyslari soni',tk:'Kim tashidi',a:'Mashina raqami',c:'Tashuvchi firma',t:"1 reys narxi, so'm (tashqi transportda)",wq:"Jami vazn, kg — bo'sh qoldirsangiz o'zi hisoblanadi",n:'Izoh'},req:['rn'],lim:{tk:c=>!c||trk(c)}});
    add({id:'tex',grp:'Karyer',title:'Texnika ishladi',sub:"Har ekskavator va pogruzchik uchun bitta qator: bugun jami necha soat ishladi va bakka qancha dizel quyildi. Krisha ochish, qum qazish va qum yuklashga bo'lishni tizim o'zi qiladi — shu kungi tonnaga qarab.",j:'tex',fix:{loc:K,op:'U'},fields:['d','mc','mh','l','mr','who','n'],lim:{mc:mcAt(K)},
      lab:Object.assign({},TXL,{mh:'Bugun jami necha moto-soat ishladi',l:'Bugun bakka quyilgan dizel, litr'}),daily:1,need:hasMc(K),total:kmc.length,
      next:(nv,row)=>{ const dd=nv.d||ui.D, done={}; store.rows.tex.forEach(r=>{ if(r.d===dd&&r.loc===K&&r.op==='U') done[r.mc]=1; }); if(row&&row.mc) done[row.mc]=1; const nx=kmc.find(m=>!done[m.code]); if(nx) nv.mc=nx.code; return !!nx||!row; }});
    add({id:'reys',grp:'Tashish',title:'Karyerdan stansiyaga reys',sub:`${kn} karyeridan ${sn}ga qum olib borgan har mashina — bitta qator. Karyerdagi va stansiyadagi tarozi vaznini yozing.`,j:'reys',fix:{m:rs,s:'MEG'},fields:['d','tk','a','c','wj','wq','t','doc','n'],
      lab:{tk:'Kim tashidi',a:'Mashina raqami',c:'Tashuvchi firma',wj:'Karyerdagi vazn, kg',wq:'Stansiya tarozisidagi vazn, kg',t:"Reys narxi, so'm (bo'sh — marshrut tarifi)",doc:'TTN №',n:'Izoh'},lim:{tk:c=>!c||trk(c)},daily:1});
    if(hasTr) add({id:'tk',grp:'Tashish',title:"O'z yuk mashinasi: km va dizel",sub:"Kun oxirida har yuk mashinasi uchun: necha km yurdi, qancha dizel quyildi.",j:'tex',fields:['d','mc','km','l','mr','who','n'],lim:{mc:trk},lab:{mc:'Qaysi mashina',km:'Bugun yurgan masofa, km',l:'Quyilgan dizel, litr',mr:"Spidometr ko'rsatkichi (kun oxiri)",who:'Haydovchi',n:'Izoh'},match:r=>E.isTruck(cfg,r.mc)&&!E.isAud(r)});
    if(site==='QIB') add({id:'sot',grp:'Tashish',title:'Sotib olingan qum keldi',sub:"Ta'minotchidan stansiyaga kelgan har mashina — bitta qator.",j:'reys',fix:{m:'TS1'},fields:['d','s','a','c','wq','sp','t','doc','n'],
      lab:{s:"Kimdan (ta'minotchi)",a:'Mashina raqami',c:'Tashuvchi firma',wq:'Stansiya tarozisidagi vazn, kg',sp:"Qum narxi, so'm/kg (bo'sh — kelishilgan narx)",t:"Reys narxi, so'm",doc:'TTN №',n:'Izoh'},req:['wq','s'],lim:{s:c=>(cfg.suppliers.find(x=>x.code===c)||{}).price>0}});
    add({id:'vag',grp:'Stansiya',title:'Vagon yuklandi',sub:"Har vagon — bitta qator: vagon raqami va nakladnoydagi vazn. Chustga kelishi va tushirilishini Chust operatori belgilaydi.",j:'vagon',fix:{src:S},fields:['no','nak','dy','kg','ty','n'],
      lab:{no:'Vagon raqami',nak:'Nakladnoy №',dy:'Yuklangan sana',kg:'Nakladnoy vazni, kg',ty:"Temir yo'l tarifi, so'm (hujjat kelganda)",n:'Izoh'},daily:1});
    if(hasMc(S)) add({id:'stx',grp:'Stansiya',title:'Stansiya texnikasi',sub:"Stansiyadagi pogruzchik: necha soat va qancha dizel.",j:'tex',fix:{loc:S,op:'Y'},fields:['d','mc','mh','l','kg','mr','who','n'],lim:{mc:mcAt(S)},lab:Object.assign({},TXL,{kg:'Vagonga yuklangan qum, kg'})});
  }
  if(site==='CHU'){
    add({id:'cz',grp:'Chust',title:"Zavodga mashina jo'natildi",sub:"Har mashina — bitta qator. Chust tarozisidagi vaznni yozing; zavod tarozisi vaznini Megaton operatori kiritadi.",j:'reys',fix:{m:'CZ'},fields:['d','tk','a','c','wj','t','doc','n'],
      lab:{tk:'Kim tashidi',a:'Mashina raqami',c:'Tashuvchi firma',wj:'Chust tarozisidagi vazn, kg',t:"Tarif, so'm/kg (bo'sh — marshrut tarifi)",doc:'TTN №',n:'Izoh'},req:['wj'],lim:{tk:c=>!c||trk(c)},daily:1});
    add({id:'tvag',grp:'Chust',title:"Ta'minotchidan vagon keldi",sub:"Sotib olingan qum vagonda to'g'ri Chustga kelganda.",j:'vagon',fix:{src:'TASHQI'},fields:['no','nak','s','sp','kg','dk','dt','pod','tush','gu','n'],
      lab:{no:'Vagon raqami',nak:'Nakladnoy №',s:"Kimdan (ta'minotchi)",sp:"Qum narxi, so'm/kg",kg:'Nakladnoy vazni, kg',dk:'Chustga kelgan sana',dt:'Tushirilgan sana',pod:"Podacha, so'm",tush:"Tushirish xizmati, so'm",gu:"GU-46 jarima, so'm",n:'Izoh'}});
    if(hasMc('C01')) add({id:'ctx',grp:'Chust',title:'Pogruzchik ishi',sub:"Chustdagi pogruzchik: necha soat va qancha dizel.",j:'tex',fix:{loc:'C01',op:'B'},fields:['d','mc','mh','l','mr','who','n'],lim:{mc:mcAt('C01')},lab:TXL});
    if(hasTr) add({id:'tk',grp:'Chust',title:"O'z yuk mashinasi: km va dizel",sub:"Kun oxirida har yuk mashinasi uchun.",j:'tex',fields:['d','mc','km','l','mr','who','n'],lim:{mc:trk},lab:{mc:'Qaysi mashina',km:'Bugun yurgan masofa, km',l:'Quyilgan dizel, litr',mr:"Spidometr ko'rsatkichi",who:'Haydovchi',n:'Izoh'},match:r=>E.isTruck(cfg,r.mc)&&!E.isAud(r)});
  }
  if(site==='MEG'){
    add({id:'tz',grp:'Zavod',title:"To'g'ridan kelgan mashina",sub:"Karyerdan yoki ta'minotchidan Chustsiz, to'g'ri zavodga kelgan qum.",j:'reys',fields:['d','m','s','a','c','wq','sp','t','doc','n'],def:{m:'TZ'},
      lab:{m:'Qayerdan keldi',s:"Qum kimniki (ta'minotchi)",a:'Mashina raqami',c:'Tashuvchi firma',wq:'Zavod tarozisidagi vazn, kg',sp:"Qum narxi, so'm/kg",t:"Tashuv tarifi, so'm/kg",doc:'TTN №',n:'Izoh'},req:['wq'],lim:{m:c=>{ const r=E.route(cfg,c); return !!r&&r.to==='Z01'&&c!=='CZ'; }},match:r=>{ const x=E.route(cfg,r.m); return !!x&&x.to==='Z01'&&r.m!=='CZ'; }});
    add({id:'czm',grp:'Zavod',title:"Chustdan kelgan, ro'yxatda yo'q mashina",sub:"Agar mashina pastdagi «Qabul kutilmoqda» ro'yxatida bo'lmasa — shu yerdan kiriting.",j:'reys',fix:{m:'CZ'},fields:['d','a','c','wj','wq','doc','n'],
      lab:{a:'Mashina raqami',c:'Tashuvchi firma',wj:'Chustdagi vazn, kg (bilsangiz)',wq:'Zavod tarozisidagi vazn, kg',doc:'TTN №',n:'Izoh'},req:['wq']});
    add({id:'qab',hid:1,grp:'Zavod',title:'Mashinani qabul qilish',sub:"Zavod tarozisidagi vaznni yozing.",j:'reys',fields:['wq','n'],lab:{wq:'Zavod tarozisidagi vazn, kg',n:'Izoh'},req:['wq'],match:()=>false});
  }
  if(site!=='MEG'){
    add({id:'dzk',grp:'Xarajat',title:'Dizel yoki material keldi',sub:"Omborga kelgan dizel, sim, plyonka: qancha va qanchadan.",j:'mat',fix:{op:'K',sk:site},fields:['d','it','q','p','n'],lab:{it:'Nima keldi',q:'Qancha',p:"Narxi, so'm (1 litr yoki 1 dona uchun)",n:'Kimdan olindi'}});
    add({id:'dzs',grp:'Xarajat',title:'Material sarflandi',sub:"Sim, plyonka yoki texnikaga bog'lanmagan dizel. Ekskavator va pogruzchik dizeli bu yerga yozilmaydi — u texnika shaklida.",j:'mat',fix:{op:'S'},fields:['d','it','q','st','n'],lab:{it:'Nima sarflandi',q:'Qancha',st:'Qayerda',n:'Izoh'},lim:{st:l=>links.indexOf(l)>=0},req:['st']});
    if(mcs.some(m=>mcSite(m)===site)) add({id:'bak',grp:'Xarajat',title:"Bak o'lchandi",sub:"Texnika yoki yuk mashinasi bakidagi dizel o'lchanganda (lineyka yoki datchik bilan): kun oxirida bakda necha litr bor. Hisobdagi qoldiq bilan farqi «dizel og'ishi» bo'lib chiqadi. Birinchi o'lchovdan keyin sarf norma bo'yicha hisoblanadi.",j:'tex',fix:{op:'A'},fields:['d','mc','bak','who','n'],
      lab:{mc:'Qaysi texnika',bak:'Bakdagi dizel, litr (kun oxirida)',who:"Kim o'lchadi",n:'Izoh'},req:['bak'],lim:{mc:c=>{ const m=E.mc(cfg,c); return !!m&&mcSite(m)===site; }},match:r=>E.isAud(r)});
    add({id:'xar',grp:'Xarajat',title:'Xarajat qilindi',sub:"Naqd, karta yoki bank orqali to'langan har bir xarajat: nima uchun, qancha, kim to'ladi.",j:'xar',fields:['d','it','lk','mc','sum','pay','who','doc','n'],
      lab:{it:'Nima uchun',lk:'Qayerda',mc:"Qaysi texnika uchun (bo'lsa)",sum:"Summa, so'm",pay:"Qanday to'landi",who:"Kim to'ladi",doc:'Chek yoki hujjat №',n:'Izoh'},
      lim:{it:c=>{ const it=cfg.items.find(i=>i.code===c); return !!it&&(it.stage==='trans'?hasTr:links.some(l=>stageOf(l)===it.stage)); },lk:l=>links.indexOf(l)>=0||l===TR,mc:c=>{ const m=E.mc(cfg,c); return !!m&&mcSite(m)===site; }}});
    add({id:'inv',grp:'Xarajat',title:"Ombor o'lchandi",sub:"Qum uyumi o'lchanganda (marksheyder yoki tarozi): haqiqiy qoldiq. Hisobdagi qoldiq shu kundan haqiqiysiga tenglashadi.",j:'inv',fields:['d','wh','kg','n'],lab:{wh:'Qaysi ombor',kg:'Haqiqiy qoldiq, kg',n:'Izoh'},lim:{wh:l=>links.indexOf(l)>=0}});
  }
  /* tahrir uchun to'liq shakllar: sodda vazifaga to'g'ri kelmagan yozuv ham shu yerdan ochiladi */
  ['reys','vagon','tex','mat','xar','inv'].forEach(j=>add({id:'*'+j,hid:1,full:1,grp:'',title:J[j].title+': yozuvni tuzatish',sub:'',j,match:()=>true}));
  T.forEach(t=>{ if(!t.match){ const fx=t.fix||{}; t.match=r=>Object.keys(fx).every(k=>(r[k]==null?null:r[k])===fx[k])&&!(t.j==='tex'&&(E.isTruck(cfg,r.mc)||E.isAud(r))); } });
  return T; }
/* Yozuv shu joyga tegishlimi */
function opMine(site,j,r){ const cfg=store.cfg, links=(SITES.find(x=>x[0]===site)||[0,0,[]])[2], inL=l=>links.indexOf(l)>=0;
  if(j==='tex'){ const m=E.mc(cfg,r.mc); return m&&m.type==='T'?mcSite(m)===site:inL(r.loc); }
  if(j==='reys'){ const rt=E.route(cfg,r.m); if(!rt) return false; return site==='MEG'?rt.to==='Z01':(inL(rt.from)||inL(rt.to)); }
  if(j==='vagon') return site==='CHU'?true:inL(r.src);
  if(j==='mat') return r.op==='K'?r.sk===site:inL(r.st);
  if(j==='xar'){ if(r.lk===TR){ const m=r.mc?E.mc(cfg,r.mc):null; return (m?mcSite(m):'QIB')===site; } return inL(r.lk); }
  if(j==='inv') return inL(r.wh);
  return false; }
/* Shu joyda shu sanada kiritilgan yozuvlar. Vagon: yuklangan, kelgan yoki tushirilgan sanasi shu kun */
function opRows(site,D){ const out=[];
  ['reys','vagon','tex','mat','xar','inv'].forEach(j=>store.rows[j].forEach(r=>{ if(!opMine(site,j,r)) return;
    const hit=j==='vagon'?(site==='CHU'?(r.dk===D||r.dt===D||(r.src==='TASHQI'&&(r.dy===D))):r.dy===D):J[j].date(r)===D; if(hit) out.push({j,r}); }));
  return out.sort((x,y)=>(y.r.at||0)-(x.r.at||0)); }
function opOpen(t,row){ ui.op.task=t.id; if(row){ const v={}; J[t.j].fields.forEach(f=>{ if(!f.hid) v[f.k]=row[f.k]==null?'':(f.t==='num'?fmtIn(row[f.k]):row[f.k]); }); ui.form[t.key]={vals:v,edit:row,msg:null}; } ui.del=null; mount();
  const e=document.getElementById('op-form'); if(e) e.scrollIntoView({block:'start',behavior:'auto'}); }
/* Vagonga bir tugma bilan sana qo'yish: «Keldi», «Tushirildi» */
async function opVag(id,what){ const raw=store.rows.vagon.find(x=>x.id===id); if(!raw) return; const D=ui.D, row={}; J.vagon.fields.forEach(f=>row[f.k]=raw[f.k]==null?null:raw[f.k]); row.id=raw.id; row.demo=raw.demo||null; if(raw.imp) row.imp=raw.imp;
  if(raw.dy&&D<raw.dy){ toast(`Sana xato: vagon ${fd(raw.dy)} kuni yuklangan, ${fd(D)} undan oldin.`); return; }
  if(what==='dk') row.dk=D; else { if(!row.dk) row.dk=D; if(row.dk>D){ toast(`Sana xato: vagon ${fd(row.dk)} kuni kelgan deb yozilgan.`); return; } row.dt=D; }
  try{ await saveRow('vagon',row,raw); toast(what==='dk'?`Vagon ${raw.no||''}: ${fd(D)} kuni Chustga keldi`:`Vagon ${raw.no||''}: ${fd(D)} kuni tushirildi — Chust omboriga kirdi`); }catch(e){ toast(errMsg(e)); } }
function vOp(){ const c=ctx(), D=ui.D, cfg=c.cfg, out=[]; let site=ui.op.site;
  const pickSite=sx=>{ ui.op.site=sx; ui.op.task=null; lsSet('qz-site',sx); mount(); };
  const SD={SAM:'Samarqand karyeri va stansiyasi',QIB:"Mayskiy karyeri va Bo'zsuv stansiyasi",CHU:'Chust stansiyasi: vagon qabul qilish, zavodga jo\'natish',MEG:'Megaton zavodi: qumni qabul qilish'};
  if(!site){ out.push(el('section',null,el('h2',null,'Qayerda ishlaysiz?'),el('p',{class:'note'},"Bir marta tanlang — keyin sahifa shu joyning kiritish paneli bilan ochiladi. Istalgan vaqtda o'zgartirish mumkin."),
      el('div',{class:'opgrid big'},SITES.map(x=>el('button',{type:'button',class:'opcard',onclick:()=>pickSite(x[0])},el('b',null,x[1]),el('span',null,SD[x[0]])))))); return out; }
  const T=opTasks(site), today=opRows(site,D), cnt=t=>today.filter(x=>x.j===t.j&&t.match(x.r)).length;
  const realToday=new Date(Date.now()+5*36e5).toISOString().slice(0,10);
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Kiritish: '+SITE_NAME[site]),segBtn(SITES.map(x=>[x[0],x[1]]),site,pickSite,'Joy')),
    el('div',{class:'opday'},el('span',null,'Yozuvlar sanasi'),el('b',{class:'num'},fd(D)),D===realToday?chip('ok','bugun'):chip('warn',D<realToday?'o\'tgan kun':'kelgusi kun'),el('span',{class:'muted'},"Sanani tepadagi ‹ › tugmalari bilan o'zgartirasiz. Kechagi ish kechagi sana bilan kiritiladi."))));
  if(!canWrite) out.push(el('div',{class:'banner'},"Sizda kiritish huquqi yo'q — faqat ko'rish."));
  /* vazifalar */
  const grp=[]; T.filter(t=>!t.hid).forEach(t=>{ let g=grp.find(x=>x[0]===t.grp); if(!g) grp.push(g=[t.grp,[]]); g[1].push(t); });
  const cur=T.find(t=>t.id===ui.op.task)||null;
  out.push(el('section',null,el('h2',null,'Bugun nima bo\'ldi? Kerakligini tanlang'),grp.map(g=>[el('h3',{class:'opgh'},g[0]),el('div',{class:'opgrid'},g[1].map(t=>{ const n=cnt(t);
    return el('button',{type:'button',class:'opcard','aria-pressed':String(!!cur&&cur.id===t.id),'data-task':t.id,onclick:()=>{ if(ui.op.task===t.id&&!(ui.form[t.key]&&ui.form[t.key].edit)){ ui.op.task=null; mount(); } else { ui.form[t.key]=null; opOpen(t); } }},
      el('b',null,t.title),el('span',null,t.sub),n?(t.total&&n<t.total?chip('warn',`kiritildi: ${n} / ${t.total} texnika`):chip('ok','✓ kiritildi: '+n+(t.total?' / '+t.total:''))):(t.daily?chip('warn','hali kiritilmagan'):null),t.need===false?chip('bad','texnika ro\'yxatda yo\'q'):null); }))])));
  /* tanlangan vazifa shakli */
  if(cur&&canWrite){ let st=ui.form[cur.key]; if(!st){ st=ui.form[cur.key]={vals:Object.assign(defVals(cur.j),cur.def||{},cur.fix||{}),edit:null,msg:null}; if(cur.next) cur.next(st.vals,null); }
    out.push(el('section',{id:'op-form',class:'opform'},el('div',{class:'sechead'},el('h2',null,cur.title),st.edit?chip('warn','Tuzatilmoqda'):null,el('button',{type:'button',class:'link',onclick:()=>{ ui.form[cur.key]=null; ui.op.task=null; ui.del=null; mount(); }},'Yopish ✕')),
      cur.sub?el('p',{class:'note'},cur.sub):null,
      (cur.j==='tex'&&cur.id!=='qaz')?opTankInfo(c,site):null,
      cur.id==='qab'&&st.edit?el('p',{class:'opinfo num'},`${fd(st.edit.d)} · ${E.rtName(cfg,E.route(cfg,st.edit.m)||{from:'?',to:'?'})} · mashina ${st.edit.a||'—'} · jo'natilgan vazn ${fmt(st.edit.wj)} kg`):null,
      buildForm(cur.j,cur.full?{key:cur.key}:cur))); }
  /* Chust: yo'ldagi va tushirilmagan vagonlar */
  if(site==='CHU'){ const N=cfg.norms, tz=E.n(N.tranzKun)||6, list=c.vag.filter(v=>(v.ext||v.ent)&&!v.orph&&(v.dy||'')<=D&&!(v.dt&&v.dt<=D)).sort((x,y)=>(x.dy||'')<(y.dy||'')?-1:1);
    const btn=(v,what,lab,pri)=>canWrite?el('button',{type:'button',class:pri?'pri sm':'sm','data-vag':v.id,'data-act':what,onclick:ev=>{ ev.currentTarget.disabled=true; opVag(v.id,what); }},lab):'';
    const vq=el('input',{id:'op-vq',type:'search',placeholder:"Vagon raqami bo'yicha qidirish…",'aria-label':'Vagon qidirish',style:'max-width:300px'});
    vq.addEventListener('input',()=>{ const q=vq.value.trim().toLowerCase(); document.querySelectorAll('#op-vag tbody tr').forEach(tr=>{ tr.hidden=!!q&&tr.firstElementChild.textContent.toLowerCase().indexOf(q)<0; }); });
    out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Kelayotgan vagonlar'),el('span',{class:'muted'},`${list.length} ta · ${ft(list.reduce((q,v)=>q+v.kg,0))} t`)),list.length>8?el('div',{class:'fbar'},vq):null,
      list.length?el('div',{id:'op-vag'},table([['Vagon №'],['Qayerdan'],['Yuklangan'],['Chustga kelgan'],['Vazn, kg','r'],["Yo'lda, kun",'r'],['Holat'],['Belgilash']],list.map(v=>{ const arr=!!v.dkE&&v.dkE<=D, days=v.dy?E.dn(D)-E.dn(v.dy):null;
        return [v.no||'—',v.ext?((cfg.suppliers.find(x=>x.code===v.s)||{}).name||"Ta'minotchi"):E.whName(cfg,v.src),fd(v.dy),arr?fd(v.dkE):(v.dy?'≈ '+fd(E.add(v.dy,tz)):'—'),fmt(v.kg),days==null?'—':days,arr?chip('warn','Chustda, tushirilmagan'):(days!=null&&days>N.yoldaKun?chip('bad','Kechikmoqda'):chip('na',"Yo'lda")),
          el('span',{class:'opacts'},arr?null:btn(v,'dk',`Keldi (${fd(D).slice(0,5)})`),btn(v,'dt',`Tushirildi (${fd(D).slice(0,5)})`,true),canWrite?el('button',{type:'button',class:'link',onclick:()=>{ const raw=store.rows.vagon.find(x=>x.id===v.id); if(raw) opOpen(T.find(t=>t.id==='*vagon'),raw); }},'Tuzatish'):null)]; }),{name:'Kelayotgan vagonlar'}))
        :el('div',{class:'panel empty'},"Hozir yo'lda yoki Chustda tushirilmagan vagon yo'q."),
      el('p',{class:'note'},`Vagon kelganda «Keldi», tushirib bo'linganda «Tushirildi» tugmasini bosing — sana tepadagi hisobot sanasi (${fd(D)}) bilan yoziladi. Qum Chust omboriga faqat tushirilgan kundan kiradi. Podacha, tushirish va jarima summalarini hujjat kelganda «Tuzatish» orqali kiritasiz.`))); }
  /* Megaton: jo'natilgan, hali qabul qilinmagan mashinalar */
  if(site==='MEG'){ const list=c.reys.filter(r=>r.to==='Z01'&&r.wq==null&&r.wj!=null&&r.d<=D&&r.d>=E.add(D,-30)).sort((x,y)=>x.d<y.d?-1:1), qt=T.find(t=>t.id==='qab');
    out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,'Qabul kutilmoqda'),el('span',{class:'muted'},`${list.length} ta mashina · ${ft(list.reduce((q,r)=>q+r.kgJ,0))} t`)),
      list.length?table([["Jo'natilgan"],['Qayerdan'],['Mashina'],['Kim tashidi'],["Jo'natilgan vazn, kg",'r'],['TTN'],['']],list.map(r=>[fd(r.d),E.whName(cfg,r.from),r.a||'—',r.own?"O'z transporti":(r.c||'Tashqi'),fmt(r.wj),r.doc||'—',
          canWrite?el('button',{type:'button',class:'pri sm','data-qab':r.id,onclick:()=>{ const raw=store.rows.reys.find(x=>x.id===r.id); if(raw){ opOpen(qt,raw); } }},'Qabul qilish'):'']),{name:'Qabul kutilmoqda'})
        :el('div',{class:'panel empty'},"Jo'natilgan, lekin hali qabul qilinmagan mashina yo'q."),
      el('p',{class:'note'},"Chust operatori jo'natgan har mashina shu yerda chiqadi. Mashina kelganda «Qabul qilish»ni bosib, zavod tarozisidagi vaznni yozing — ikki tarozi farqi yo'ldagi yo'qotishni ko'rsatadi."))); }
  /* shu kunda shu joyda kiritilganlar */
  const tn=x=>{ const t=T.find(t=>!t.hid&&t.j===x.j&&t.match(x.r)); return t?t.title:J[x.j].title; };
  out.push(el('section',null,el('div',{class:'sechead'},el('h2',null,`${fd(D)} kuni kiritilganlar`),el('span',{class:'muted'},today.length+' ta yozuv')),
    today.length?table([['Nima'],['Yozuv','w'],['Miqdor / summa','r'],['Holat'],['']],today.map(x=>{ const r=x.r, d=opDer(c,x.j,r), fl=(d&&(d._fl||d.flags)||[]).filter(f=>f[0]==='bad'||f[0]==='warn');
        const amt=x.j==='xar'?fmt(r.sum)+" so'm":(x.j==='mat'?fmt(r.q,1)+' '+((cfg.mats[r.it]||{}).unit||''):(x.j==='tex'?(E.isAud(r)?'bakda '+fmt(r.bak,0)+' l':(r.op==='Q'&&!r.mh&&!r.l)?fmt(r.kg||0)+' kg':(E.isTruck(cfg,r.mc)?fmt(r.km||0)+' km':fmt(r.mh||0,1)+' m-s')+' · '+fmt(r.l||0)+' l'):(x.j==='reys'?fmt(d?d.kgQ:(r.wq||r.wj||0))+' kg':fmt(r.kg)+' kg')));
        return [tn(x),rowTitle(c,x.j,d||r),amt,fl.length?el('span',{style:'display:inline-flex;gap:4px;flex-wrap:wrap'},fl.map(f=>chip(f[0],f[1]))):chip('ok','✓'),
          canWrite?el('button',{type:'button',class:'link','data-edit':r.id,onclick:()=>{ const t=T.find(t=>t.id!=='qab'&&t.j===x.j&&t.match(r)); opOpen(t,r); }},'Tuzatish'):'']; }),{name:'Kiritilganlar '+fd(D)})
      :el('div',{class:'panel empty'},`${fd(D)} kuni bu joyda hali hech narsa kiritilmagan.`),
    el('p',{class:'note'},"Xato kiritilgan yozuvni «Tuzatish» orqali o'zgartirasiz yoki o'chirasiz. O'chirilgan yozuv yo'qolmaydi — rahbar uni Tarix bo'limidan tiklay oladi.")));
  return out; }
/* hisoblangan yozuv (belgilar va vazn uchun) */
function opDer(c,j,r){ const src=j==='reys'?c.reys:j==='tex'?c.tex:j==='vagon'?c.vag.concat(c.vagX):null; return src?src.find(x=>x.id===r.id):null; }

/* ---------- Karyer bosqichlari: zaxiradan vagongacha, kg, m³, so'm, so'm/kg ---------- */
function konSheet(c,L,a,b){ const cfg=c.cfg, S=L==='K01'?'S01':'S02', T=TOF[S], a0=E.add(a,-1), sn0=E.snapAt(c,a0), sn1=E.snapAt(c,b), rs0=E.reserve(c,L,a0), kr=E.krRep(c,L,a,b);
  const A=E.agg(c,a,b,'acc'), lk=A.chain.find(l=>l.id===L)||{vol:0,cost:0,els:[]}, ls=A.chain.find(l=>l.id===S)||{vol:0,cost:0,n:0,els:[]}, ef=k=>{ const e=lk.els.find(x=>x.key===k); return e?e.fact:0; };
  const ext=lk.vol, zx=ef('zx'), nd=ef('nd'), own=lk.cost-zx-nd, v0=E.vsum(sn0[L].v), v1=E.vsum(sn1[L].v);
  const RS=E.rng(c,'reys',a,b).filter(r=>!r.kr&&r.from===L), toS=RS.filter(r=>r.to===S), toZ=RS.filter(r=>r.to==='Z01'), sm=(x,f)=>x.reduce((q,r)=>q+f(r),0);
  let ls0=0; for(const x of c.led.loss) if(x.wh===L&&x.d>=a&&x.d<=b) ls0+=E.vsum(x.v);
  const outV=v0+lk.cost+kr.rv-v1-ls0; let wq=0, wv=0, wt=0, wn=0; for(const id in c.led.wload){ const x=c.led.wload[id]; if(x.src===S&&x.d&&x.d>=a&&x.d<=b){ wq+=x.kg; wv+=E.vsum(x.v); wt+=x.v[CI.ty]; wn++; } }
  const m3=(kg,k)=>kg?E.m3(cfg,kg,k):'', z=(E.n(cfg.norms.zich)||1.5)*1000, zk=(E.n(cfg.norms.krZich)||1.5)*1000;
  const R=(lab,kg,sum,k,bold)=>{ const o=[lab,kg===''?'':kg,kg===''?'':m3(kg,k),sum===''?'':sum,(kg>0&&sum!=='')?sum/kg:'',(kg>0&&sum!=='')?sum/kg*(k?zk:z):'']; if(bold) o._b=1; return o; };
  const rows=[
    rs0.has?R('1. Kon zaxirasi (yer ostida), davr boshida',rs0.remKg,rs0.remVal):R('1. Kon zaxirasi kiritilmagan (Normativlar → Kon)','',''),
    R('2. Krisha ochildi (davrda): texnika, tashish, umumiy xarajat ulushi',kr.inq,kr.inn,1),
    R('3. Qum qazildi — kon qiymati (sotib olish va geologiya)',ext,zx),
    R('4. Qum qazildi — karyer xarajati, qumga tegishli qismi',ext,own),
    R('5. Qum qazildi — krisha ochishdan yotqizilgan ulush',ext,kr.rv),
    R("6. Qum qazildi — yer qa'ri solig'i",ext,nd),
    R("7. QAZILGAN QUMNING BOSHLANG'ICH TAN NARXI (3+4+5+6)",ext,zx+own+kr.rv+nd,0,1),
    R('8. Karyer ombori: davr boshida',sn0[L].q,v0),
    R('9. Karyerdan tashildi (stansiyaga va zavodga) — ombor qiymati bilan',sm(RS,r=>r.kgJ),outV),
    R("10. KARYER OMBORI QOLDIG'I",sn1[L].q,v1,0,1),
    R('11. Tashish xarajati: karyer → stansiya',sm(toS,r=>r.kgQ),sm(toS,r=>r.haul)),
    toZ.length?R("11a. Tashish xarajati: karyer → zavod (to'g'ridan)",sm(toZ,r=>r.kgQ),sm(toZ,r=>r.haul)):null,
    R('12. Stansiya ombori: davr boshida',sn0[S].q,E.vsum(sn0[S].v)),
    R('13. Stansiya xarajati (saqlash, vagonga yuklash)',ls.vol,ls.cost),
    R("14. VAGONGA YUKLANDI — TO'LIQ TAN NARX (temir yo'l tarifi bilan)",wq,wv,0,1),
    R("15.   shundan temir yo'l tarifi",wq,wt),
    R("16. STANSIYA OMBORI QOLDIG'I",sn1[S].q,E.vsum(sn1[S].v),0,1),
    R("17. Vagonlarda (yo'lda va Chustda tushirilmagan)",sn1[T].q,E.vsum(sn1[T].v)),
    R("18. KRISHA HOVUZI QOLDIG'I (keyingi qumga o'tadi)",kr.close.q,kr.close.v,1,1)].filter(Boolean);
  return {key:'kon'+L,name:'Karyer '+cfg.wh[L].name,L,heads:['Bosqich','Miqdor, kg','Miqdor, m³',"Xarajat / qiymat, so'm","so'm/kg","so'm/m³"],rows,dec:[0,0,0,0,2,0],any:ext>0||kr.any||sn1[L].q>0.5||sn0[L].q>0.5||wq>0||sn1[S].q>0.5,kr,wn}; }

/* =====================================================================
   7. MARSHRUTLASH VA ISHGA TUSHIRISH
   ===================================================================== */
/* Operator (kiritish huquqi bor, muharrir emas) uchun sahifa faqat Kiritish bo'limi bilan ochiladi; hisobotlarni o'zi xohlasa ochadi */
const opOnly=()=>!canAdmin&&lsGet('qz-full')!=='1';
function renderTabs(){ const n=document.getElementById('tabs'), kids=[], only=opOnly(), TL=only?TABS.filter(t=>t[0]==='kir'||t[0]==='my'):TABS; TL.forEach((t,i)=>{ if(i&&TL[i-1][2]!==t[2]) kids.push(el('span',{class:'tsep','aria-hidden':'true'})); kids.push(el('a',{href:'#'+t[0],'aria-current':ui.tab===t[0]?'page':null,onclick:ev=>{ev.preventDefault();go(t[0]);}},t[1])); });
  if(!canAdmin) kids.push(el('button',{type:'button',class:'link',id:'op-full',onclick:()=>{ lsSet('qz-full',only?'1':'0'); if(!only) ui.tab='kir'; mount(); }},only?"Hisobotlarni ko'rish →":'← Faqat kiritish')); n.replaceChildren(...kids); const cur=n.querySelector('[aria-current]'); if(cur&&cur.scrollIntoView) try{ cur.scrollIntoView({block:'nearest',inline:'nearest'}); }catch(e){} }
function go(t){ ui.tab=t; ui.del=null; lsSet('qz-tab',t); try{ history.replaceState(null,'','#'+t); }catch(e){} mount(); window.scrollTo(0,0); }
function mount(){ if(opOnly()&&ui.tab!=='kir'&&ui.tab!=='my') ui.tab='kir'; renderTabs(); const m=document.getElementById('main'); let v;
  try{ v=ui.tab==='kir'?vOp():ui.tab==='my'?vMy():ui.tab==='map'?vMap():ui.tab==='aud'?vAud():ui.tab==='panel'?vPanel():ui.tab==='tah'?vTah():ui.tab==='tan'?vTan():ui.tab==='norm'?vNorm():ui.tab==='sap'?vSap():ui.tab==='rep'?vRep():ui.tab==='hist'?vHist():vJournal(ui.tab); }
  catch(e){ console.error(e); v=[el('div',{class:'banner'},"Hisobda xato: "+(e&&e.message||e))]; }
  m.replaceChildren(...[mem?el('div',{class:'banner'},"Baza ulanmagan: kiritilgan ma'lumot sahifa yopilganda yo'qoladi."):null].concat(v).filter(Boolean)); }
let rf=0;
function refresh(){ if(rf) return; rf=requestAnimationFrame(()=>{ rf=0;
  if(J[ui.tab]){ const l=document.getElementById('list'); if(l){ try{ l.replaceChildren(...[].concat(listFor(ui.tab)).flat(Infinity).filter(Boolean)); }catch(e){ console.error(e); } return; } }
  if(ui.tab==='norm'&&ui.cfgDirty) return;
  if(document.activeElement&&/^(sap-csv|cfg-|map-|rep-|hist-|op-vq|my-)/.test(document.activeElement.id||'')) return;
  if(ui.tab==='kir'&&document.activeElement&&/^f-op-/.test(document.activeElement.id||'')){ ui.opStale=true; return; }      /* operator yozayotgan paytda shakl qayta chizilmaydi */
  mount(); }); }

async function boot(){
  ui.mapPause=lsGet('qz-anim')==='0'; { const sx=lsGet('qz-site'); if(SITE_NAME[sx]) ui.op.site=sx; }
  const h=(location.hash||'').slice(1), saved=lsGet('qz-tab'); if(TABS.some(t=>t[0]===h)) ui.tab=h; else if(TABS.some(t=>t[0]===saved)) ui.tab=saved;
  const rd=document.getElementById('repdate'); rd.value=ui.D;
  const setD=d=>{ if(!d) return; ui.D=d; rd.value=d; Object.keys(ui.form).forEach(j=>{ if(ui.form[j]&&!ui.form[j].edit) ui.form[j]=null; }); mount(); };
  rd.addEventListener('change',()=>setD(rd.value));
  document.getElementById('d-prev').addEventListener('click',()=>setD(E.add(ui.D,-1))); document.getElementById('d-next').addEventListener('click',()=>setD(E.add(ui.D,1)));
  document.getElementById('d-today').addEventListener('click',()=>setD(new Date(Date.now()+5*36e5).toISOString().slice(0,10)));
  mount();
  const cl=window.claude&&window.claude.use?window.claude:null;
  if(cl){ try{ [db,user,downloads]=await Promise.all([cl.use('db'),cl.use('user'),cl.use('downloads')]); }catch(e){ db=null; } }
  if(user){ try{ me=await user.me(); const w=await user.can('data.write'); canWrite=w!==false; canAdmin=!!(await user.canEdit()); }catch(e){} }
  if(!canAdmin&&!TABS.some(t=>t[0]===h)) ui.tab='kir';
  if(!db){ db=memDb(); mem=true; canWrite=true; canAdmin=true; }
  if(window.__QZ_ROLE__==='op'){ canAdmin=false; if(!TABS.some(t=>t[0]===h)) ui.tab='kir'; }      /* faqat avtomatik sinov uchun */
  setSync();
  db.doc('config/main').onSnapshot(s=>{ store.cfgRaw=s.exists?JSON.parse(JSON.stringify(s.data())):null; store.cfg=mergeCfg(store.cfgRaw); store.cfgSaved=s.exists; store.ver++; if(!ui.cfgDirty) ui.cfgDraft=null; refresh(); },e=>console.error(e));
  JN.forEach(j=>{ db.collection(j).orderBy('p','desc').limit(1000).onSnapshot(s=>{ const d={}; s.docs.forEach(x=>{ d[x.id]=x.data(); }); store.docs[j]=d; if(!(s.metadata&&s.metadata.fromCache)) store.ready[j]=true; else setTimeout(()=>{ store.ready[j]=true; },5000); rebuild(j); refresh(); },
    e=>{ console.error(e); if(e&&(e.code==='revoked'||e.code==='not_granted')){ canWrite=false; setSync(); } }); });
  mount();
}
if(typeof module!=='undefined'&&module.exports){ module.exports={E,DEF,demoRows,fmt,fmtIn,fmtTyped,pnum,J,JN,mergeCfg,stageOf,COMP,CI,WH,LINKS,TW,TOF,xlsxBytes,memDb,TR,KQ,OTV,SITES,SITE_OF}; }
else { if(window.__QZ_TEST__) window.__qz={store,ui,E,J,writeDoc,saveRow,delRow,restoreRow,saveMany,pickDoc,ctx,mount,xlsxBytes,tableData,getDb:()=>db,ROWS_MAX,opTasks,opRows,konSheet,go,COMP,CI};   /* faqat avtomatik sinov uchun */
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot(); }
})();
