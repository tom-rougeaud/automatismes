/* Moteur de questions extrait de Flash Maths (tom-rougeaud/flash, prof.html, CC BY-NC 4.0, Tom Rougeaud).
   Aucune modification des générateurs : seul l’emballage change (module Node / bloc de page). */
function esc(s){return String(s===undefined||s===null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function rnd(r,a,b){return a+Math.floor(r()*(b-a+1));}
function pick(r,arr){return arr[Math.floor(r()*arr.length)];}
function shuffle(r,arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function rd(x,d){var m=Math.pow(10,d);return Math.round(x*m+(x>=0?1e-7:-1e-7))/m;}

/* Nombre au format français : virgule, espace fine pour les milliers, vrai signe moins */
function f(x,d){
  if(d===undefined)d=2;
  var v=rd(x,d); if(v===0)v=0;
  var s=Math.abs(v).toFixed(d);
  if(s.indexOf(".")>=0)s=s.replace(/0+$/,"").replace(/\.$/,"");
  var p=s.split("."),i=p[0].replace(/\B(?=(\d{3})+(?!\d))/g," ");
  s=p[1]?i+","+p[1]:i;
  return (v<0?"−":"")+s;
}
function sg(x,d){var s=f(x,d===undefined?2:d);return (x>0?"+":"")+s;}
var SUPS={"0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","-":"⁻"};
function sup(n){return String(n).split("").map(function(c){return SUPS[c]||c;}).join("");}
/* polynôme / expression affine rendus proprement : ax + b */
function lin(a,b,v){
  v=v||"x";var s="";
  if(a!==0){s=(a===1?"":a===-1?"−":f(a))+v;}
  if(b!==0){s+= s===""?f(b):(b<0?" − ":" + ")+f(Math.abs(b));}
  return s===""?"0":s;
}
function quad(a,b,c){
  var s=(a===1?"":a===-1?"−":f(a))+"x²";
  if(b!==0)s+=(b<0?" − ":" + ")+(Math.abs(b)===1?"":f(Math.abs(b)))+"x";
  if(c!==0)s+=(c<0?" − ":" + ")+f(Math.abs(c));
  return s;
}

/* ─── Erreurs types (« distracteurs diagnostiques ») ─── */
var HIDDEN={},TIMES={};   /* questions masquées / temps personnalisés (remplis par custom.js) */
var ERR={
  inv:   {e:"⇄",l:"inversion (produit en croix, quotient, coefficient)",s:"Tu as sans doute inversé : le quotient, le produit en croix ou le coefficient est à l’envers."},
  pct0:  {e:"%",l:"oubli de diviser par 100 (ou division en trop)",s:"Attention au « pour cent » : p % = p ÷ 100."},
  addp:  {e:"+×",l:"addition à la place d’une multiplication (ou l’inverse)",s:"Tu as ajouté là où il fallait multiplier (ou l’inverse)."},
  unit:  {e:"u",l:"virgule décalée, unités confondues",s:"La virgule est décalée : vérifie les unités et les puissances de 10."},
  ordre: {e:"①",l:"priorités de calcul non respectées",s:"Les priorités : parenthèses, puis × et ÷, puis + et −."},
  signe: {e:"±",l:"erreur de signe",s:"C’est une erreur de signe : vérifie les « moins »."},
  formule:{e:"f(x)",l:"mauvaise formule ou mauvaise notion",s:"Ce n’est pas la bonne formule : revois la formule de cette notion."},
  demi:  {e:"½",l:"oubli d’un facteur (½, ⅓, un carré…)",s:"Il manque un facteur dans ton calcul (une moitié, un carré, un tiers…)."},
  conf:  {e:"≠",l:"confusion entre deux notions voisines",s:"Tu as confondu deux notions voisines."},
  calc:  {e:"=",l:"erreur de calcul",s:"La méthode est bonne, mais il y a une erreur de calcul."},
  arr:   {e:"≈",l:"arrondi ou troncature",s:"Attention à l’arrondi : regarde le chiffre suivant."},
  base:  {e:"60",l:"base 60 / base 100 mal gérée",s:"Les durées se comptent en base 60 : 1 h = 60 min, pas 100."},
  compl: {e:"1−",l:"confusion avec le complément",s:"Tu as donné le complément (ce qui reste) au lieu de la valeur demandée."},
  lect:  {e:"👁",l:"mauvaise lecture du graphique ou du tableau",s:"Relis le graphique : axe, graduation, colonne ou ligne."},
  grand: {e:"10ⁿ",l:"ordre de grandeur faux",s:"L’ordre de grandeur est loin : arrondis les nombres et calcule de tête."},
  assoc: {e:"⇆",l:"tuiles mal associées",s:"Certaines tuiles sont mal associées : regarde la correction."},
  ordre2:{e:"↕",l:"ordre faux",s:"L’ordre n’est pas le bon : compare les nombres deux à deux."},
  form:  {e:"✎",l:"résultat juste mais pas sous la forme demandée",s:"Ton expression est juste, mais pas sous la forme demandée (développée, réduite ou factorisée)."},
  autre: {e:"?",l:"autre réponse",s:""}
};

/* ─── Écriture mathématique (KaTeX) ───
   Dans un énoncé ou une réponse, tout ce qui est entre $…$ est affiché en LaTeX. */
function fm(x,d){return f(x,d).replace(/−/g,"-").replace(/,/g,"{,}").replace(/[ \u00a0\u202f]/g,"\\,");}
function M(s){return "$"+s+"$";}
function par(x,d){return x<0?"("+fm(x,d)+")":fm(x,d);}
function linL(a,b,v){
  v=v||"x";var s="";
  if(a!==0){s=(a===1?"":a===-1?"-":fm(a))+v;}
  if(b!==0){s+= s===""?fm(b):(b<0?" - ":" + ")+fm(Math.abs(b));}
  return s===""?"0":s;
}
function quadL(a,b,c){
  var s=(a===1?"":a===-1?"-":fm(a))+"x^2";
  if(b!==0)s+=(b<0?" - ":" + ")+(Math.abs(b)===1?"":fm(Math.abs(b)))+"x";
  if(c!==0)s+=(c<0?" - ":" + ")+fm(Math.abs(c));
  return s;
}
/* forme « calculable » d’une expression en x (pour la saisie libre) */
function linE(a,b){return "("+a+")*x+("+b+")";}

/* ─── Fabrique de question à choix (2 à 4 propositions) ───
   ok : bonne réponse (nombre ou texte) ; wr : [[valeur, codeErreur], …] dans l’ordre d’importance
   o  : {u:unité, d:décimales, F:formateur perso, nu:unité de la saisie libre si F perso,
         lit:expression attendue en x (saisie libre littérale), form:"dev"|"red"|"fact", n:nombre de choix}
   Une réponse numérique (ou littérale) rend la question jouable en « saisie libre ».          */
/* Un distracteur « loin » (plus de 8 fois plus grand ou plus petit que la bonne réponse) s’élimine
   d’un coup d’œil : on en garde au plus un (o.far), les autres erreurs types restent du même ordre de grandeur. */
function isFar(v,ok){
  if(typeof v!=="number"||typeof ok!=="number"||!ok||!v)return false;
  if((v<0)!==(ok<0))return false;
  var q=Math.abs(v/ok);return q>=8||q<=0.125;
}
/* plus petite « marche » du nombre : 45 → 1 ; 12,5 → 0,1 ; 0,25 → 0,01 */
function lastStep(x,d){var s=String(rd(Math.abs(x),d)),i=s.indexOf(".");return i<0?(Math.abs(x)>=100&&Math.abs(x)%10===0?10:1):Math.pow(10,-(s.length-i-1));}
function mk(r,ok,wr,o){
  o=o||{};
  var u=o.u?" "+o.u:"",d=o.d===undefined?2:o.d,want=o.n||Math.min(4,1+wr.length);
  if(typeof ok==="number")want=o.n||4;
  var F=o.F||function(v){return typeof v==="string"?v:f(v,d)+u;};
  var seen={},list=[],far=[],farMax=o.far===undefined?1:o.far,nFar=0;
  var okt=F(ok);seen[okt]=1;list.push({t:okt,err:null,ok:true});
  for(var i=0;i<wr.length&&list.length<want;i++){
    var v=wr[i][0],e=wr[i][1],t;
    if(typeof v==="number"&&!isFinite(v))continue;
    if(typeof v==="number"&&o.pos&&v<=0)continue;
    t=F(v);
    if(!t||seen[t]||/NaN|Infinity|undefined/.test(t))continue;
    if(isFar(v,ok)){if(nFar>=farMax){far.push({t:t,err:e});continue;}nFar++;}
    seen[t]=1;list.push({t:t,err:e});
  }
  /* pas assez d’erreurs « proches » : on reprend les éloignées plutôt qu’inventer */
  for(var j=0;j<far.length&&list.length<want;j++){if(!seen[far[j].t]){seen[far[j].t]=1;list.push(far[j]);}}
  if(typeof ok==="number"){
    /* dernier recours : erreurs de calcul plausibles (un chiffre de trop ou de moins, la retenue oubliée) */
    var st=lastStep(ok,d),cand=[ok+st,ok-st,ok+10*st,ok-10*st,ok+2*st,ok-2*st,ok+5*st,ok-5*st],tries=0;
    cand=shuffle(r,cand.slice(0,4)).concat(shuffle(r,cand.slice(4)));
    while(list.length<want&&tries<cand.length){
      var v2=cand[tries++];
      if(o.pos&&v2<=0)continue;
      var t2=F(v2);
      if(seen[t2]||/NaN|Infinity/.test(t2))continue;
      seen[t2]=1;list.push({t:t2,err:"calc",fb:1});
    }
  }
  if(list.length<2||(typeof ok==="number"&&list.length<4))throw new Error("mk : pas assez de distracteurs pour "+okt);
  var sh=o.keep?list:shuffle(r,list),ans=0;
  for(var k=0;k<sh.length;k++)if(sh[k].ok)ans=k;
  return {choices:sh.map(function(c){return {t:c.t,err:c.err};}),ans:ans,nfb:list.filter(function(c){return c.fb;}).length};
}
function Q(r,q,ok,wr,o,expl){
  o=o||{};
  var m=mk(r,ok,wr,o),res={q:q,choices:m.choices,ans:m.ans,expl:expl||""};
  if(m.nfb)res.nfb=m.nfb;
  if(o.fig)res.fig=o.fig;
  if(o.est)res.est=1;
  if(typeof ok==="number"&&isFinite(ok)&&(!o.F||o.nu!==undefined)){
    res.num=ok;res.unit=o.F?o.nu:(o.u||"");res.dec=o.d===undefined?2:o.d;
  }
  if(o.lit){res.lit=o.lit;if(o.form)res.form=o.form;}
  return res;
}
/* Vrai / Faux */
function VF(r,q,vrai,expl){return {q:q,choices:[{t:"Vrai",err:vrai?null:"conf"},{t:"Faux",err:vrai?"conf":null}],ans:vrai?0:1,expl:expl||"",vf:true};}

/* ─── Métiers (habillage des énoncés) ─── */
var METIERS={
  general:   {label:"Général",                       emoji:""},
  cuisine:   {label:"Cuisine · Restauration",        emoji:""},
  batiment:  {label:"Bâtiment · Travaux publics",    emoji:""},
  commerce:  {label:"Commerce · Vente · Accueil",    emoji:""},
  coiffure:  {label:"Coiffure · Esthétique",         emoji:""},
  auto:      {label:"Maintenance auto · Mécanique",  emoji:""},
  logistique:{label:"Logistique · Transport",        emoji:""},
  sante:     {label:"Santé · Social (ASSP)",         emoji:""}
};
function cm(r,c){var l=(c&&c.metiers&&c.metiers.length)?c.metiers:["general"];return l.length===1?l[0]:pick(r,l);}

var PROP={
  general:   {t:"Un robinet débite {b} L en {a} minutes. Quel volume en {a2} minutes ?",u:"L",A:[3,4,5,6,8],K:[6,8,10,12,15],A2:[10,12,15,20,25]},
  cuisine:   {t:"Une recette pour {a} personnes demande {b} g de farine. Quelle quantité pour {a2} personnes ?",u:"g",A:[4,6,8],K:[50,75,100,125],A2:[10,12,15,20]},
  batiment:  {t:"Pour {a} m² de carrelage, il faut {b} kg de colle. Combien pour {a2} m² ?",u:"kg",A:[4,5,6,8,10],K:[3,4,5,6],A2:[12,15,20,25,30]},
  commerce:  {t:"{a} articles identiques coûtent {b} €. Quel prix pour {a2} articles ?",u:"€",A:[3,4,5,6],K:[4,6,8,12,15],A2:[10,12,15,20]},
  coiffure:  {t:"Pour {a} colorations, il faut {b} mL de colorant. Combien pour {a2} colorations ?",u:"mL",A:[2,3,4,5],K:[40,50,60],A2:[8,10,12,15]},
  auto:      {t:"Pour {a} vidanges, il faut {b} L d’huile moteur. Combien pour {a2} vidanges ?",u:"L",A:[2,3,4,5],K:[4,5,6],A2:[8,10,12,15]},
  logistique:{t:"{a} palettes identiques pèsent {b} kg. Quelle masse pour {a2} palettes ?",u:"kg",A:[2,3,4,5],K:[300,400,450,500],A2:[8,10,12,15]},
  sante:     {t:"Pour un enfant de {a} kg, la dose prescrite est de {b} mg. Quelle dose pour un enfant de {a2} kg ?",u:"mg",A:[10,12,15,20],K:[5,10,15],A2:[24,25,30,40]}
};
var PCTC={
  general:   {t:function(v){return "Un objet coûte "+f(v)+" €.";},u:"€",V:[40,60,80,120,150,200,250]},
  cuisine:   {t:function(v){return "Une caisse de légumes coûte "+f(v)+" €.";},u:"€",V:[40,60,80,120,150,200,250]},
  batiment:  {t:function(v){return "Un devis s’élève à "+f(v)+" €.";},u:"€",V:[200,400,600,800,1000,1200,2000]},
  commerce:  {t:function(v){return "Un article est affiché "+f(v)+" €.";},u:"€",V:[40,60,80,120,150,200,250]},
  coiffure:  {t:function(v){return "Un soin coûte "+f(v)+" €.";},u:"€",V:[20,40,60,80,100,120]},
  auto:      {t:function(v){return "Une facture de pièces s’élève à "+f(v)+" €.";},u:"€",V:[120,160,240,300,400,500]},
  logistique:{t:function(v){return "Un entrepôt stocke "+f(v)+" colis.";},u:"colis",V:[200,400,500,800,1000]},
  sante:     {t:function(v){return "Une dose est de "+f(v)+" mg.";},u:"mg",V:[50,80,120,200,250,400]}
};
var CONV={
  general:   [{f:"m",t:"cm",k:100,V:[0.5,1.5,2.5,3.2,0.75]},{f:"g",t:"kg",k:0.001,V:[250,450,1200,2500,3600]},{f:"mL",t:"L",k:0.001,V:[250,500,1500,2500]},{f:"mm",t:"cm",k:0.1,V:[35,120,250,48]}],
  cuisine:   [{f:"g",t:"kg",k:0.001,V:[250,450,1200,2500,3600],o:" de farine"},{f:"cL",t:"L",k:0.01,V:[25,50,75,150,250],o:" de crème"},{f:"kg",t:"g",k:1000,V:[0.5,1.5,2.5,0.25,0.75],o:" de sucre"},{f:"mL",t:"cL",k:0.1,V:[50,250,330,750]}],
  batiment:  [{f:"cm",t:"m",k:0.01,V:[250,45,120,180,75],o:" de plinthe"},{f:"m",t:"cm",k:100,V:[0.5,1.5,2.5,3.2,0.75]},{f:"mm",t:"cm",k:0.1,V:[35,120,250,48]},{f:"m²",t:"cm²",k:10000,V:[0.5,2,3.5,0.25]}],
  commerce:  [{f:"g",t:"kg",k:0.001,V:[250,500,1200,2500]},{f:"kg",t:"g",k:1000,V:[0.5,1.5,2.5,0.25]},{f:"cL",t:"L",k:0.01,V:[25,50,75,150]},{f:"m",t:"cm",k:100,V:[0.5,1.5,2.5,0.75]}],
  coiffure:  [{f:"mL",t:"L",k:0.001,V:[250,500,1500,2500],o:" de shampooing"},{f:"cL",t:"mL",k:10,V:[3,7.5,12,25]},{f:"L",t:"mL",k:1000,V:[0.25,0.5,1.5,2]},{f:"g",t:"kg",k:0.001,V:[250,450,1200]}],
  auto:      [{f:"mL",t:"L",k:0.001,V:[500,750,1500,4500],o:" d’huile"},{f:"L",t:"mL",k:1000,V:[0.5,1.5,2.5,4.5],o:" d’huile"},{f:"mm",t:"cm",k:0.1,V:[35,120,250,48]},{f:"cm",t:"mm",k:10,V:[3.5,12,2.5,0.8]}],
  logistique:[{f:"kg",t:"t",k:0.001,V:[500,1200,2500,12000]},{f:"t",t:"kg",k:1000,V:[0.5,1.2,2.5,0.75]},{f:"m³",t:"L",k:1000,V:[0.5,1.2,2.5,0.75]},{f:"cm",t:"m",k:0.01,V:[250,45,120,180]}],
  sante:     [{f:"mg",t:"g",k:0.001,V:[250,500,1500,2500],o:" de principe actif"},{f:"g",t:"mg",k:1000,V:[0.25,0.5,1.5,0.75],o:" de principe actif"},{f:"mL",t:"L",k:0.001,V:[250,500,1500,2500]},{f:"L",t:"mL",k:1000,V:[0.25,0.5,1.5,2]}]
};
var BAC={
  general:"un réservoir",cuisine:"un bac de plonge",batiment:"une cuve à eau",commerce:"un bac de présentation",
  coiffure:"un bac à shampooing",auto:"un bac de vidange",logistique:"un carton",sante:"un bac à instruments"
};
var STATC={
  general:   {n:"notes sur 20",lo:8,hi:18},
  cuisine:   {n:"temps de cuisson (en min)",lo:8,hi:40},
  batiment:  {n:"longueurs de planches (en cm)",lo:80,hi:250},
  commerce:  {n:"ventes par jour (en articles)",lo:20,hi:80},
  coiffure:  {n:"durées de prestation (en min)",lo:20,hi:90},
  auto:      {n:"temps de diagnostic (en min)",lo:15,hi:60},
  logistique:{n:"colis chargés par camion",lo:40,hi:120},
  sante:     {n:"pulsations par minute",lo:60,hi:95}
};
var RENT={
  general:   "pièces",cuisine:"plateaux repas",batiment:"cadres de fenêtre",commerce:"articles",
  coiffure:"forfaits soin",auto:"forfaits vidange",logistique:"livraisons",sante:"kits de soins"
};

/* ═══════════════════════════════════════════════════════════════
   NOUVEAUX FORMATS DE QUESTIONS
   QA : associer des tuiles (calcul ↔ résultat…)
   QO : remettre dans l’ordre
   QE : estimer avec un curseur (ordre de grandeur)
   QX : trouver l’étape fausse d’un calcul rédigé
═══════════════════════════════════════════════════════════════ */
function permNotId(r,n){
  var base=[];for(var i=0;i<n;i++)base.push(i);
  for(var t=0;t<12;t++){var p=shuffle(r,base);if(p.some(function(v,k){return v!==k;}))return p;}
  return base.slice(1).concat([0]);
}
/* pairs : [[gauche, droite], …] (3 ou 4 paires, textes tous différents) */
function QA(r,q,pairs,expl,o){
  o=o||{};
  var L=pairs.map(function(p){return String(p[0]);}),R0=pairs.map(function(p){return String(p[1]);});
  var dl={},dr={};
  if(L.some(function(t){if(dl[t])return true;dl[t]=1;return false;})||R0.some(function(t){if(dr[t])return true;dr[t]=1;return false;}))return null;
  var perm=permNotId(r,pairs.length);
  var res={kind:"assoc",q:q,L:L,R:perm.map(function(i){return R0[i];}),rk:perm,expl:expl||"",ans:0,
    choices:[{t:pairs.map(function(p){return p[0]+" → "+p[1];}).join("\n"),err:null}]};
  if(o.fig)res.fig=o.fig;
  return res;
}
/* items : dans le BON ordre ; how : « du plus petit au plus grand »… */
function QO(r,q,items,expl,o){
  o=o||{};
  var it=items.map(String),dd={};
  if(it.some(function(t){if(dd[t])return true;dd[t]=1;return false;}))return null;
  var perm=permNotId(r,it.length);
  var res={kind:"ordre",q:q,D:perm.map(function(i){return it[i];}),op:perm,how:o.how||"",sep:o.sep||" ; ",expl:expl||"",ans:0,
    choices:[{t:it.join(o.sep||" ; "),err:null}]};
  if(o.fig)res.fig=o.fig;
  return res;
}
/* nombres « ronds » pour les graduations */
function niceUp(x){if(!(x>0))return 1;var e=Math.pow(10,Math.floor(Math.log(x)/Math.LN10)),m=x/e;return (m<=1.0001?1:m<=2.0001?2:m<=2.5001?2.5:m<=5.0001?5:10)*e;}
function niceDown(x){if(!(x>0))return 1;var e=Math.pow(10,Math.floor(Math.log(x)/Math.LN10)),m=x/e;return (m>=9.999?10:m>=4.999?5:m>=2.499?2.5:m>=1.999?2:1)*e;}
function decOf(x){var s=String(+(+x).toPrecision(10));var i=s.indexOf(".");return i<0?0:s.length-i-1;}
/* Estimation au curseur. o : {u, min, max, tol, spread, lo, tr}
   - le curseur va de min à max (graduations « rondes ») ; la réponse n’est jamais au milieu ni au bord ;
   - zone juste : ± tol (par défaut 4 % de la largeur) ; zone « presque » : ± 2,5 tol (moitié des points). */
function QE(r,q,ans,o,expl){
  o=o||{};
  var min,max,a=Math.abs(ans)||1;
  if(o.min!==undefined&&o.max!==undefined){min=o.min;max=o.max;}
  else{
    var sp=a*(o.spread||pick(r,[1.6,2,2.4,3])),g=niceUp(sp/5),span=Math.ceil(sp/g)*g,pos=0.22+0.56*r();
    min=Math.floor((ans-pos*span)/g)*g;
    var lo=o.lo!==undefined?o.lo:(ans>=0?0:undefined);
    if(lo!==undefined&&min<lo)min=lo;
    max=min+span;
    if(ans>max-0.12*span)max=Math.ceil((ans+0.2*span)/g)*g;
    min=rd(min,6);max=rd(max,6);
  }
  if(!(max>min))return null;
  var W=max-min,tol=o.tol!==undefined?o.tol:W*(o.tr||0.04),step=niceDown(Math.min(W/100,tol/2));
  if(step<=0)step=W/100;
  var d=Math.min(4,Math.max(decOf(step),decOf(min),decOf(max)));
  var u=o.u||"";
  return {kind:"slider",q:q,sl:{min:min,max:max,step:rd(step,8),ans:ans,tol:rd(tol,8),u:u,d:d},expl:expl||"",ans:0,est:1,
    choices:[{t:"≈ "+f(ans,Math.max(d,decOf(ans)>4?4:decOf(ans)))+(u?" "+u:""),err:null}],fig:o.fig};
}
/* transforme une question numérique (q.num) en estimation au curseur */
function toSlider(q,seed){
  if(!q||q.num===undefined||!isFinite(q.num)||q.unit==="%"&&Math.abs(q.num)>1000)return null;
  var txt=String(q.q).replace(/^Calculer /,"Estimer ").replace(/^Combien /,"Environ combien ");
  if(txt===q.q&&!/^Estimer|^Environ/.test(txt))txt="Estimation : "+txt;
  var s=QE(mulberry32((seed||7)>>>0),txt,q.num,{u:q.unit||"",lo:q.num>=0?0:undefined},q.expl);
  if(!s)return null;
  ["id","d","titre","chap","seed","uid","dur","fig"].forEach(function(k){if(q[k]!==undefined)s[k]=q[k];});
  s.from=1;
  return s;
}
var CIRC=["①","②","③","④","⑤","⑥"];
/* steps : étapes d’un calcul rédigé, bad : index de l’étape fausse */
function QX(r,intro,steps,bad,expl,o){
  o=o||{};
  var txt=intro+"\n"+steps.map(function(s,i){return CIRC[i]+" "+s;}).join("\n");
  var ch=steps.map(function(s,i){return {t:"Étape "+CIRC[i],err:i===bad?null:"conf"};});
  var res={q:txt,choices:ch,ans:bad,expl:expl||"",qx:1};
  if(o.fig)res.fig=o.fig;
  return res;
}

/* ═══════════════════════════════════════════════════════════════
   FIGURES (SVG produit ici, à partir de nombres et de courtes étiquettes échappées :
   aucune balise n’est transmise sur le réseau, seulement la description de la figure)
═══════════════════════════════════════════════════════════════ */
var FIGC={v:"#2B4C7E",c:"#A8483F",s:"#B7791F",m:"#2F7D5B",k:"#3A6EA5",ink:"#1E2A3A",g:"#D9DFE8",l:"#EAF0F8"};
var FIG_PAL=["#2B4C7E","#A8483F","#B7791F","#2F7D5B","#3A6EA5","#7A4B8A"];
function xe(s){return String(s===undefined||s===null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").slice(0,40);}
function fnum(v){return typeof v==="number"&&isFinite(v)?v:0;}
function figT(x,y,s,o){o=o||{};return '<text x="'+rd(fnum(x),1)+'" y="'+rd(fnum(y),1)+'" font-size="'+(o.fs||15)+'" font-weight="'+(o.fw||800)+'" fill="'+(o.c||FIGC.ink)+'" text-anchor="'+(o.a||"middle")+'" dominant-baseline="middle"'+(o.rot?' transform="rotate('+o.rot+" "+rd(x,1)+" "+rd(y,1)+')"':"")+">"+xe(s)+"</text>";}
function figLab(x,y,s,c){if(s===undefined||s===null||s==="")return "";var w=Math.max(22,String(s).length*8.6+10);return '<rect x="'+rd(x-w/2,1)+'" y="'+rd(y-12,1)+'" width="'+rd(w,1)+'" height="24" rx="12" fill="#fff" stroke="'+(c||FIGC.v)+'" stroke-width="2"/>'+figT(x,y+0.5,s,{fs:14,c:c&&c!==FIGC.v?c:FIGC.ink});}
function svgWrap(w,h,body,cls){return '<svg class="figsvg'+(cls?" "+cls:"")+'" viewBox="0 0 '+w+" "+h+'" role="img" aria-label="figure" xmlns="http://www.w3.org/2000/svg">'+body+"</svg>";}
function figHtml(fig){
  if(!fig||typeof fig!=="object")return "";
  try{
    var k=fig.k,b="";
    if(k==="tri"){   /* triangle rectangle : a = côté vertical, b = côté horizontal, c = hypoténuse */
      var P0=[60,170],P1=[60,34],P2=[290,170];
      b+='<polygon points="'+[P0,P1,P2].map(function(p){return p.join(",");}).join(" ")+'" fill="'+FIGC.l+'" stroke="'+FIGC.v+'" stroke-width="4" stroke-linejoin="round"/>';
      b+='<path d="M60 152h18v18" fill="none" stroke="'+FIGC.v+'" stroke-width="3"/>';
      if(fig.ang)b+='<path d="M252 170A38 38 0 0 0 258 151" fill="none" stroke="'+FIGC.c+'" stroke-width="4"/>'+figT(236,158,fig.ang,{c:FIGC.c,fs:15});
      if(fig.ang2)b+='<path d="M60 64A30 30 0 0 0 76 58" fill="none" stroke="'+FIGC.c+'" stroke-width="4"/>'+figT(80,76,fig.ang2,{c:FIGC.c,fs:14});
      b+=figLab(34,102,fig.a,fig.hl==="a"?FIGC.c:0)+figLab(175,192,fig.b,fig.hl==="b"?FIGC.c:0)+figLab(196,88,fig.c,fig.hl==="c"?FIGC.c:0);
      if(fig.n){b+=figT(48,182,fig.n[0],{fs:15})+figT(48,22,fig.n[1],{fs:15})+figT(302,182,fig.n[2],{fs:15});}
      return svgWrap(330,206,b);
    }
    if(k==="rect"){
      b+='<rect x="70" y="36" width="200" height="110" rx="4" fill="'+(fig.fill?FIGC.l:"#fff")+'" stroke="'+FIGC.k+'" stroke-width="4"/>';
      b+=figLab(170,166,fig.L)+figLab(42,91,fig.l);
      if(fig.in)b+=figT(170,91,fig.in,{fs:16,c:FIGC.v});
      return svgWrap(330,186,b);
    }
    if(k==="disc"){
      b+='<circle cx="165" cy="98" r="76" fill="'+FIGC.l+'" stroke="'+FIGC.m+'" stroke-width="4"/><circle cx="165" cy="98" r="4" fill="'+FIGC.ink+'"/>';
      if(fig.d){b+='<line x1="89" y1="98" x2="241" y2="98" stroke="'+FIGC.c+'" stroke-width="3" stroke-dasharray="7 5"/>'+figLab(165,122,fig.d,FIGC.c);}
      else{b+='<line x1="165" y1="98" x2="241" y2="98" stroke="'+FIGC.c+'" stroke-width="3"/>'+figLab(203,78,fig.r,FIGC.c);}
      return svgWrap(330,196,b);
    }
    if(k==="pave"){
      var x=70,y=70,w=170,h=90,dx=46,dy=-36;
      b+='<polygon points="'+x+","+y+" "+(x+dx)+","+(y+dy)+" "+(x+w+dx)+","+(y+dy)+" "+(x+w)+","+y+'" fill="#D3DCEA" stroke="'+FIGC.v+'" stroke-width="3"/>';
      b+='<polygon points="'+(x+w)+","+y+" "+(x+w+dx)+","+(y+dy)+" "+(x+w+dx)+","+(y+h+dy)+" "+(x+w)+","+(y+h)+'" fill="#B9C6DA" stroke="'+FIGC.v+'" stroke-width="3"/>';
      b+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+FIGC.l+'" stroke="'+FIGC.v+'" stroke-width="3"/>';
      b+='<path d="M'+x+" "+(y+h)+"L"+(x+dx)+" "+(y+h+dy)+"L"+(x+w+dx)+" "+(y+h+dy)+"M"+(x+dx)+" "+(y+h+dy)+"V"+(y+dy)+'" fill="none" stroke="'+FIGC.v+'" stroke-width="2" stroke-dasharray="6 5" opacity=".6"/>';
      b+=figLab(x+w/2,y+h+20,fig.L)+figLab(x-28,y+h/2,fig.h)+figLab(x+w+dx/2+30,y+h+dy/2+28,fig.l);
      return svgWrap(330,196,b);
    }
    if(k==="cyl"){
      b+='<path d="M95 50v110a70 20 0 0 0 140 0V50" fill="'+FIGC.l+'" stroke="'+FIGC.m+'" stroke-width="3"/><ellipse cx="165" cy="50" rx="70" ry="20" fill="#CFE5DA" stroke="'+FIGC.m+'" stroke-width="3"/>';
      b+='<path d="M95 160a70 20 0 0 1 140 0" fill="none" stroke="'+FIGC.m+'" stroke-width="2" stroke-dasharray="6 5"/><line x1="165" y1="50" x2="235" y2="50" stroke="'+FIGC.c+'" stroke-width="3"/>';
      b+=figLab(200,30,fig.r,FIGC.c)+figLab(262,105,fig.h);
      return svgWrap(330,196,b);
    }
    if(k==="angtri"){
      var A=[40,170],B=[290,170],C=[120,36];
      b+='<polygon points="'+[A,B,C].map(function(p){return p.join(",");}).join(" ")+'" fill="'+FIGC.l+'" stroke="'+FIGC.v+'" stroke-width="4" stroke-linejoin="round"/>';
      b+=figT(78,154,fig.a,{c:FIGC.c})+figT(246,156,fig.b,{c:FIGC.k})+figT(123,72,fig.c,{c:FIGC.m});
      if(fig.n)b+=figT(28,182,fig.n[0])+figT(302,182,fig.n[1])+figT(120,20,fig.n[2]);
      return svgWrap(330,196,b);
    }
    if(k==="thales"){ /* A en haut, M sur [AB], N sur [AC], (MN) // (BC) */
      var pA=[165,22],pB=[40,182],pC=[300,182],t=0.45,pM=[pA[0]+t*(pB[0]-pA[0]),pA[1]+t*(pB[1]-pA[1])],pN=[pA[0]+t*(pC[0]-pA[0]),pA[1]+t*(pC[1]-pA[1])];
      b+='<polygon points="'+[pA,pB,pC].map(function(p){return p.join(",");}).join(" ")+'" fill="'+FIGC.l+'" stroke="'+FIGC.v+'" stroke-width="3.5" stroke-linejoin="round"/>';
      b+='<line x1="'+pM[0]+'" y1="'+pM[1]+'" x2="'+pN[0]+'" y2="'+pN[1]+'" stroke="'+FIGC.c+'" stroke-width="3.5"/>';
      b+=figT(165,10,"A")+figT(28,190,"B")+figT(312,190,"C")+figT(pM[0]-14,pM[1],"M")+figT(pN[0]+14,pN[1],"N");
      var L=fig.L||{};
      b+=figLab((pA[0]+pM[0])/2-26,(pA[1]+pM[1])/2,L.AM)+figLab((pM[0]+pB[0])/2-26,(pM[1]+pB[1])/2,L.MB)+figLab((pA[0]+pN[0])/2+26,(pA[1]+pN[1])/2,L.AN)+figLab((pN[0]+pC[0])/2+26,(pN[1]+pC[1])/2,L.NC)+figLab(165,pM[1]-14,L.MN,FIGC.c)+figLab(165,200,L.BC);
      return svgWrap(330,214,b);
    }
    if(k==="bars"){
      var xs=fig.x||[],ys=(fig.y||[]).map(fnum),n=ys.length;if(!n)return "";
      var ymax=Math.max.apply(null,ys.concat([1])),g=niceUp(ymax/5),top=Math.ceil(ymax/g)*g;if(top===ymax)top+=g;
      var X0=48,Y0=170,H=140,W=270,bw=W/n*0.62;
      for(var v=0;v<=top+1e-9;v+=g){var yy=Y0-H*v/top;b+='<line x1="'+X0+'" y1="'+rd(yy,1)+'" x2="'+(X0+W)+'" y2="'+rd(yy,1)+'" stroke="'+FIGC.g+'" stroke-width="1.5"/>'+figT(X0-8,yy,f(v,3),{fs:12,fw:700,a:"end"});}
      ys.forEach(function(v,i){var bx=X0+W/n*(i+0.5)-bw/2,bh=H*v/top;b+='<rect x="'+rd(bx,1)+'" y="'+rd(Y0-bh,1)+'" width="'+rd(bw,1)+'" height="'+rd(bh,1)+'" rx="5" fill="'+FIG_PAL[i%FIG_PAL.length]+'"/>'+figT(bx+bw/2,Y0+14,xs[i],{fs:12,fw:800});});
      b+='<line x1="'+X0+'" y1="'+Y0+'" x2="'+(X0+W)+'" y2="'+Y0+'" stroke="'+FIGC.ink+'" stroke-width="2"/>';
      if(fig.u)b+=figT(X0-6,16,fig.u,{fs:12,a:"start",c:FIGC.v});
      return svgWrap(330,196,b);
    }
    if(k==="graph"){ /* repère quadrillé ; pts = courbe (ligne brisée) ; dots = points nommés */
      var xr=fig.xr||[-1,6],yr=fig.yr||[-1,6],GW=290,GH=190,ox=24,oy=10,sx=GW/(xr[1]-xr[0]),sy=GH/(yr[1]-yr[0]);
      var gx=function(x){return ox+(x-xr[0])*sx;},gy=function(y){return oy+(yr[1]-y)*sy;};
      var stx=fig.sx||1,sty=fig.sy||1;
      for(var i=Math.ceil(xr[0]/stx)*stx;i<=xr[1]+1e-9;i+=stx)b+='<line x1="'+rd(gx(i),1)+'" y1="'+oy+'" x2="'+rd(gx(i),1)+'" y2="'+(oy+GH)+'" stroke="'+FIGC.g+'" stroke-width="1"/>';
      for(var j=Math.ceil(yr[0]/sty)*sty;j<=yr[1]+1e-9;j+=sty)b+='<line x1="'+ox+'" y1="'+rd(gy(j),1)+'" x2="'+(ox+GW)+'" y2="'+rd(gy(j),1)+'" stroke="'+FIGC.g+'" stroke-width="1"/>';
      if(xr[0]<=0&&xr[1]>=0)b+='<line x1="'+rd(gx(0),1)+'" y1="'+oy+'" x2="'+rd(gx(0),1)+'" y2="'+(oy+GH)+'" stroke="'+FIGC.ink+'" stroke-width="2"/>';
      if(yr[0]<=0&&yr[1]>=0)b+='<line x1="'+ox+'" y1="'+rd(gy(0),1)+'" x2="'+(ox+GW)+'" y2="'+rd(gy(0),1)+'" stroke="'+FIGC.ink+'" stroke-width="2"/>';
      var x0=xr[0]<=0&&xr[1]>=0?0:xr[0],y0=yr[0]<=0&&yr[1]>=0?0:yr[0];
      for(var a2=Math.ceil(xr[0]/stx)*stx;a2<=xr[1]+1e-9;a2+=stx){if(Math.abs(a2-x0)<1e-9&&x0===0)continue;if(fig.lx===false)break;if(Math.round(a2/stx)%(fig.ex||1)===0)b+=figT(gx(a2),Math.min(oy+GH-8,gy(y0)+12),f(a2,2),{fs:11,fw:700});}
      for(var b2=Math.ceil(yr[0]/sty)*sty;b2<=yr[1]+1e-9;b2+=sty){if(Math.abs(b2-y0)<1e-9&&y0===0)continue;if(fig.ly===false)break;if(Math.round(b2/sty)%(fig.ey||1)===0)b+=figT(Math.max(ox+10,gx(x0)-10),gy(b2),f(b2,2),{fs:11,fw:700,a:"end"});}
      if(x0===0&&y0===0)b+=figT(gx(0)-8,gy(0)+11,"0",{fs:11,fw:700});
      (fig.curves||(fig.pts?[fig.pts]:[])).forEach(function(cv,ci){
        var d=cv.map(function(p,pi){return (pi?"L":"M")+rd(gx(p[0]),1)+" "+rd(gy(p[1]),1);}).join("");
        b+='<path d="'+d+'" fill="none" stroke="'+FIG_PAL[ci===0?0:1+ci%5]+'" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>';
      });
      (fig.names||[]).forEach(function(nm){b+=figT(gx(nm[0]),gy(nm[1]),nm[2],{fs:14,c:FIG_PAL[(nm[3]||0)%6]});});
      (fig.dots||[]).forEach(function(p,pi){b+='<circle cx="'+rd(gx(p[0]),1)+'" cy="'+rd(gy(p[1]),1)+'" r="5" fill="'+FIGC.c+'" stroke="#fff" stroke-width="2"/>'+(p[2]?figT(gx(p[0])+11,gy(p[1])-11,p[2],{fs:14,c:FIGC.c}):"");});
      if(fig.xn)b+=figT(ox+GW-4,Math.min(oy+GH-8,gy(y0)-10),fig.xn,{fs:12,a:"end",c:FIGC.v});
      if(fig.yn)b+=figT(gx(x0)+6,oy+8,fig.yn,{fs:12,a:"start",c:FIGC.v});
      return svgWrap(330,214,b);
    }
    if(k==="axe"){ /* droite graduée ; pts = [[valeur, nom]] */
      var mn=fig.min,mx=fig.max,stp=fig.step||1,X1=24,X2=306,Y=70,sc=(X2-X1)/(mx-mn),px=function(v){return X1+(v-mn)*sc;};
      b+='<line x1="'+(X1-8)+'" y1="'+Y+'" x2="'+(X2+12)+'" y2="'+Y+'" stroke="'+FIGC.ink+'" stroke-width="3"/><path d="M'+(X2+14)+" "+Y+"l-10 -6v12z\" fill=\""+FIGC.ink+'"/>';
      var nt=Math.round((mx-mn)/stp);
      for(var q2=0;q2<=nt;q2++){var vv=rd(mn+q2*stp,6),big=fig.every?q2%fig.every===0:true;b+='<line x1="'+rd(px(vv),1)+'" y1="'+(Y-(big?10:6))+'" x2="'+rd(px(vv),1)+'" y2="'+(Y+(big?10:6))+'" stroke="'+FIGC.ink+'" stroke-width="'+(big?2.5:1.5)+'"/>';if(big&&(fig.labels===undefined||fig.labels.indexOf(q2)>=0))b+=figT(px(vv),Y+26,f(vv,3),{fs:13,fw:700});}
      (fig.pts||[]).forEach(function(p,i){b+='<circle cx="'+rd(px(p[0]),1)+'" cy="'+Y+'" r="6.5" fill="'+FIG_PAL[(i+1)%6]+'" stroke="#fff" stroke-width="2"/>'+figT(px(p[0]),Y-24,p[1],{fs:16,c:FIG_PAL[(i+1)%6]});});
      return svgWrap(330,112,b);
    }
    if(k==="tree"){ /* arbre pondéré à deux niveaux ; p = [p(A), p(Ā)] ; c = [[pA(B), pA(B̄)], [pĀ(B), pĀ(B̄)]] (étiquettes) */
      var ev=fig.ev||["A","Ā"],e2=fig.e2||["B","B̄"],R0=[22,110],L1=[[130,52],[130,168]],L2=[[262,22],[262,82],[262,138],[262,198]];
      var line=function(p,q){return '<line x1="'+(p[0]+10)+'" y1="'+p[1]+'" x2="'+(q[0]-14)+'" y2="'+q[1]+'" stroke="'+FIGC.v+'" stroke-width="3"/>';};
      b+=line(R0,L1[0])+line(R0,L1[1]);for(var t2=0;t2<4;t2++)b+=line(L1[t2>>1],L2[t2]);
      b+=figT(L1[0][0],L1[0][1],ev[0],{fs:17})+figT(L1[1][0],L1[1][1],ev[1],{fs:17});
      for(var t3=0;t3<4;t3++)b+=figT(L2[t3][0]+4,L2[t3][1],e2[t3%2],{fs:16});
      var pl=fig.p||["",""],cl=fig.c||[["",""],["",""]];
      b+=figLab(70,66,pl[0])+figLab(70,156,pl[1]);
      b+=figLab(196,30,cl[0][0])+figLab(196,76,cl[0][1])+figLab(196,144,cl[1][0])+figLab(196,190,cl[1][1]);
      return svgWrap(300,220,b);
    }
    if(k==="code"){ /* programme Python ou instructions : texte brut échappé, une ligne par instruction */
      return '<pre class="figcode">'+(fig.lines||[]).slice(0,12).map(function(l){return String(l).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").slice(0,60);}).join("\n")+"</pre>";
    }
    if(k==="tab"){ /* tableau : rows = [[…],[…]] (1re ligne = en-têtes) */
      var rows=(fig.rows||[]).slice(0,6);
      return '<table class="figtab">'+rows.map(function(rw,i){return "<tr>"+rw.slice(0,9).map(function(c,j){var tg=(i===0||(fig.hc&&j===0))?"th":"td";return "<"+tg+">"+xe(c)+"</"+tg+">";}).join("")+"</tr>";}).join("")+"</table>";
    }
  }catch(e){}
  return "";
}

/* ═══════════════════════════════════════════════════════════════
   BANQUE DE QUESTIONS — items (3ᵉ PM · CAP · 2nde · 1re · Tle Bac Pro)
   Chaque item = une famille de questions à paramètres aléatoires
   avec des distracteurs qui correspondent chacun à une erreur type.
   Les formules s’écrivent entre $…$ (rendu KaTeX).
═══════════════════════════════════════════════════════════════ */
var NIVEAUX=[
  {id:"3pm", label:"3ᵉ Prépa-Métiers", court:"3ᵉ PM", color:"#A8483F"},
  {id:"cap", label:"CAP",              court:"CAP",   color:"#B7791F"},
  {id:"2nde",label:"2nde Bac Pro",     court:"2nde",  color:"#3A6EA5"},
  {id:"1re", label:"1ʳᵉ Bac Pro",      court:"1ʳᵉ",   color:"#2F7D5B"},
  {id:"term",label:"Terminale Bac Pro",court:"Tle",   color:"#2B4C7E"}
];
var BANK=[];
function reg(id,niv,chap,titre,tags,d,gen,extra){var it={id:id,niv:niv,chap:chap,titre:titre,tags:tags,d:d,gen:gen};if(extra)for(var k in extra)it[k]=extra[k];BANK.push(it);}
var C_CALC="Calcul mental et automatismes",C_PROP="Proportionnalité et pourcentages",C_GRAN="Grandeurs, mesures et volumes",
    C_GEO="Géométrie et trigonométrie",C_STAT="Statistiques",C_EQ="Équations et calcul littéral",C_FONC="Fonctions affines et linéaires";

/* ═════════ CALCUL MENTAL ET AUTOMATISMES ═════════ */
reg("add_dec",["3pm","cap"],C_CALC,"Additions et soustractions de décimaux",["décimaux","addition","soustraction","virgule"],1,function(r){
  var a=rnd(r,11,299)/10,b=rnd(r,101,999)/100,plus=r()<0.6,x=a,y=b;
  if(!plus){x=Math.max(a,b);y=Math.min(a,b);}
  var ok=plus?x+y:x-y;
  return Q(r,"Calculer "+M(fm(x)+(plus?" + ":" - ")+fm(y)),ok,
    [[ok*10,"unit"],[ok/10,"unit"],[ok+0.1,"calc"],[ok-0.1,"calc"]],{d:2},
    "On aligne les virgules : "+M(fm(x)+(plus?" + ":" - ")+fm(y)+" = "+fm(ok))+".");
});
reg("mult10",["3pm","cap"],C_CALC,"Multiplier et diviser par 10, 100, 0,1…",["puissances de 10","virgule","décalage"],1,function(r){
  var ops=[["\\times 10",10],["\\times 100",100],["\\times 0{,}1",0.1],["\\times 0{,}01",0.01],["\\div 10",0.1],["\\div 100",0.01],["\\times 1\\,000",1000]];
  var o=pick(r,ops),x=pick(r,[rnd(r,12,99)/10,rnd(r,3,95),rnd(r,101,999)/100]),ok=x*o[1];
  return Q(r,"Calculer "+M(fm(x,3)+" "+o[0]),ok,
    [[ok*10,"unit"],[ok/10,"unit"],[x/o[1],"conf"],[ok*100,"unit"]],{d:4,far:3},
    "On décale la virgule : "+M(fm(x,3)+" "+o[0]+" = "+fm(ok,4))+".");
});
reg("frac_de",["3pm","cap","2nde"],C_CALC,"Prendre une fraction d’une quantité",["fraction","3/4 de","quantité"],2,function(r){
  var den=pick(r,[2,3,4,5,10]),n=den===2?1:rnd(r,1,den-1),v=den*rnd(r,3,12),ok=n*v/den;
  return Q(r,"Calculer "+M("\\dfrac{"+n+"}{"+den+"}")+" de "+f(v),ok,
    [[v*den/n,"inv"],[v/den,"demi"],[v-ok,"compl"],[v-den,"conf"],[v/n,"inv"],[ok*2,"calc"],[v*n,"conf"]],{d:2,pos:true},
    "On divise par "+den+" puis on multiplie par "+n+" : "+M(fm(v)+" \\div "+den+" \\times "+n+" = "+fm(ok))+".");
});
reg("prio",["3pm","cap","2nde"],C_CALC,"Priorités de calcul",["priorités","parenthèses","ordre des opérations"],2,function(r){
  var t=rnd(r,0,2),a,b,c,ok,e,wr,ex;
  if(t===0){a=rnd(r,2,15);b=rnd(r,2,9);c=rnd(r,2,9);ok=a+b*c;e=a+" + "+b+" \\times "+c;wr=[[(a+b)*c,"ordre"],[a*b+c,"calc"],[a+b+c,"ordre"]];ex="La multiplication passe avant l’addition : "+M(b+" \\times "+c+" = "+b*c)+", puis "+M(a+" + "+b*c+" = "+ok)+".";}
  else if(t===1){a=rnd(r,2,15);b=rnd(r,2,9);c=rnd(r,2,9);ok=(a+b)*c;e="("+a+" + "+b+") \\times "+c;wr=[[a+b*c,"ordre"],[a*c+b,"calc"],[a+b+c,"ordre"]];ex="On calcule d’abord la parenthèse : "+(a+b)+", puis "+M("\\times "+c)+" : "+ok+".";}
  else{c=pick(r,[2,3,4,5]);b=c*rnd(r,2,9);a=rnd(r,20,60);ok=a-b/c;e=a+" - "+b+" \\div "+c;wr=[[(a-b)/c,"ordre"],[a-b*c,"ordre"],[ok+1,"calc"]];ex="La division passe avant la soustraction : "+M(b+" \\div "+c+" = "+b/c)+", puis "+M(a+" - "+b/c+" = "+ok)+".";}
  return Q(r,"Calculer "+M(e),ok,wr,{d:2},ex);
});
reg("puissances",["cap","2nde"],C_CALC,"Puissances et notation scientifique",["puissance","10^n","notation scientifique","exposant"],2,function(r){
  var t=rnd(r,0,2);
  if(t===0){
    var m=pick(r,[1.5,2.4,3.2,4.7,5,6.25,8,12]),e=pick(r,[2,3,4,-1,-2,-3]),ok=m*Math.pow(10,e);
    return Q(r,"Écrire "+M(fm(m)+" \\times 10^{"+e+"}")+" en écriture décimale",ok,
      [[ok*10,"unit"],[ok/10,"unit"],[m*Math.pow(10,-e),"signe"],[m*e,"formule"],[m+e,"addp"]],{d:5,far:3},
      "On décale la virgule de "+Math.abs(e)+" rang"+(Math.abs(e)>1?"s":"")+" vers "+(e>0?"la droite":"la gauche")+" : "+M(fm(ok,5))+".");
  }
  if(t===1){
    var a=rnd(r,2,5),b=rnd(r,3,6),P=function(v){return M(v);};
    return Q(r,"Simplifier "+M("10^{"+a+"} \\times 10^{"+b+"}"),P("10^{"+(a+b)+"}"),
      [[P("10^{"+(a*b)+"}"),"formule"],[P("100^{"+(a+b)+"}"),"conf"],[P("10^{"+Math.abs(b-a)+"}"),"conf"]],{},
      "Produit de puissances de même base : on additionne les exposants, "+M(a+" + "+b+" = "+(a+b))+".");
  }
  var base=pick(r,[2,3,5,10]),n=rnd(r,2,4),ok2=Math.pow(base,n);
  return Q(r,"Calculer "+M(base+"^{"+n+"}"),ok2,[[base*n,"formule"],[Math.pow(n,base),"inv"],[Math.pow(base,n-1),"calc"],[Math.pow(base,n+1),"calc"],[base+n,"addp"]],{d:0},
    M(base+"^{"+n+"} = "+Array(n).fill(base).join(" \\times ")+" = "+ok2)+".");
});
reg("carres_racines",["cap","2nde"],C_CALC,"Carrés et racines carrées",["carré","racine carrée","√"],2,function(r){
  var t=rnd(r,0,2),n;
  if(t===0){n=rnd(r,11,20);return Q(r,"Calculer "+M(n+"^2"),n*n,[[2*n,"demi"],[n*n+n,"calc"],[n*n-n,"calc"],[n*n+10,"calc"]],{d:0},M(n+"^2 = "+n+" \\times "+n+" = "+n*n)+".");}
  if(t===1){n=rnd(r,6,15);return Q(r,"Calculer "+M("\\sqrt{"+n*n+"}"),n,[[n*n/2,"demi"],[n+1,"calc"],[n-1,"calc"],[n*n/4,"demi"]],{d:2},M("\\sqrt{"+n*n+"} = "+n)+" car "+M(n+"^2 = "+n*n)+".");}
  n=rnd(r,3,9);return Q(r,"Calculer "+M("(-"+n+")^2"),n*n,[[-n*n,"signe"],[-2*n,"signe"],[2*n,"demi"]],{d:0},"Un carré est toujours positif : "+M("(-"+n+")^2 = (-"+n+") \\times (-"+n+") = "+n*n)+".");
});
reg("relatifs",["cap","2nde"],C_CALC,"Calculs avec des nombres relatifs",["relatifs","signes","négatifs"],2,function(r){
  var t=rnd(r,0,3),a,b,ok,e,wr,ex;
  if(t===0){a=rnd(r,-15,-2);b=rnd(r,3,15);ok=a+b;e="("+fm(a)+") + "+b;wr=[[Math.abs(a)+b,"signe"],[a-b,"signe"],[-(a+b),"signe"],[b,"calc"]];ex="On cherche la différence des distances à zéro : "+M(e+" = "+fm(ok))+".";}
  else if(t===1){a=rnd(r,-10,10);b=rnd(r,2,9);ok=a+b;e=fm(a)+" - ("+fm(-b)+")";wr=[[a-b,"signe"],[-(a+b),"signe"],[b-a,"signe"]];ex="Soustraire un négatif revient à ajouter : "+M(fm(a)+" + "+b+" = "+fm(ok))+".";}
  else if(t===2){a=rnd(r,2,9);b=rnd(r,2,9);ok=a*b;e="(-"+a+") \\times (-"+b+")";wr=[[-a*b,"signe"],[a+b,"addp"],[-(a+b),"signe"]];ex="Deux négatifs : produit positif, "+M(a+" \\times "+b+" = "+ok)+".";}
  else{b=rnd(r,2,6);a=b*rnd(r,2,9);ok=-a/b;e="(-"+a+") \\div "+b;wr=[[a/b,"signe"],[-a*b,"inv"],[-(a-b),"calc"]];ex="Un négatif divisé par un positif est négatif : "+M(e+" = "+fm(ok))+".";}
  return Q(r,"Calculer "+M(e),ok,wr,{d:2},ex);
});
reg("arrondi",["3pm","cap"],C_CALC,"Arrondir un nombre",["arrondi","troncature","dixième","centième"],1,function(r){
  var x=rnd(r,1000,99999)/10000,p=rnd(r,0,2),noms=["à l’unité","au dixième","au centième"];
  var ok=rd(x,p),tr=Math.floor(x*Math.pow(10,p))/Math.pow(10,p);
  if(tr===ok)tr=rd(ok-Math.pow(10,-p),p);
  return Q(r,"Arrondir "+f(x,4)+" "+noms[p],ok,[[tr,"arr"],[rd(x,p+1),"arr"],[rd(ok+Math.pow(10,-p),p),"arr"],[rd(x,p+2),"arr"],[p===0?ok+1:rd(x,p-1),"arr"]],{d:4},
    "On regarde le chiffre suivant : "+f(x,4)+" arrondi "+noms[p]+" donne "+f(ok,p)+".");
});

/* ═════════ PROPORTIONNALITÉ ET POURCENTAGES ═════════ */
reg("regle3",["3pm","cap","2nde"],C_PROP,"Proportionnalité : règle de trois, produit en croix",["proportionnalité","règle de trois","produit en croix","tableau"],2,function(r,c){
  var m=cm(r,c),s=PROP[m],a=pick(r,s.A),k=pick(r,s.K),b=a*k,a2=pick(r,s.A2);if(a2===a)a2=a+10;
  var ok=a2*k,t=s.t.replace("{a}",a).replace("{b}",f(b)).replace("{a2}",a2);
  return Q(r,t,ok,[[b*a/a2,"inv"],[b+a2-a,"addp"],[ok/2,"calc"],[b*a2,"conf"],[ok*10,"unit"]],{u:s.u,d:2},
    "Pour 1 : "+M(fm(b)+" \\div "+a+" = "+fm(k))+" "+s.u+". Pour "+a2+" : "+M(fm(k)+" \\times "+a2+" = "+fm(ok))+" "+s.u+".");
});
reg("pct_de",["3pm","cap","2nde"],C_PROP,"Calculer un pourcentage d’une quantité",["pourcentage","p % de","part"],2,function(r,c){
  var m=cm(r,c),s=PCTC[m],v=pick(r,s.V),p=pick(r,[5,10,15,20,25,30,40,60,75]),ok=v*p/100;
  return Q(r,s.t(v)+" Combien représentent "+p+" % ?",ok,
    [[v-ok,"compl"],[v*(1+p/100),"addp"],[v/p,"conf"],[v*p,"pct0"],[v*100/p,"inv"],[ok*2,"calc"]],{u:s.u,d:2},
    M(p+"\\,\\% \\text{ de } "+fm(v)+" = "+fm(v)+" \\times \\dfrac{"+p+"}{100} = "+fm(ok))+" "+s.u+".");
});
reg("pct_mental",["3pm","cap"],C_PROP,"Pourcentages simples de tête (10 %, 25 %, 50 %…)",["pourcentage","mental","automatisme","moitié","quart"],1,function(r){
  var p=pick(r,[10,20,25,50,75]),v=pick(r,[40,60,80,120,160,200,240,360,400,520]),ok=v*p/100;
  return Q(r,"Calculer "+p+" % de "+f(v),ok,[[v/p,"conf"],[v-ok,"compl"],[ok/10,"unit"],[v*p,"pct0"],[v*100/p,"inv"],[v/10,"conf"]],{d:2},
    p+" % de "+f(v)+" = "+f(ok)+(p===50?" (la moitié)":p===25?" (le quart)":p===10?" (on divise par 10)":"")+".");
});
reg("coef_evol",["cap","2nde"],C_PROP,"Augmenter ou diminuer de p % (coefficient multiplicateur)",["coefficient multiplicateur","hausse","baisse","remise","évolution"],2,function(r,c){
  var m=cm(r,c),s=PCTC[m],v=pick(r,s.V),p=pick(r,[5,10,15,20,25,30]),up=r()<0.5,form=rnd(r,0,2),ok,wr,ex,t;
  if(form===0){
    ok=up?v*(1+p/100):v*(1-p/100);
    t=s.t(v)+" Cette valeur "+(up?"augmente":"diminue")+" de "+p+" %. Quelle est la nouvelle valeur ?";
    wr=[[up?v+p:v-p,"addp"],[v*p/100,"conf"],[up?v*(1-p/100):v*(1+p/100),"signe"],[ok*10,"unit"]];
    ex="Coefficient multiplicateur "+f(up?1+p/100:1-p/100)+" : "+M(fm(v)+" \\times "+fm(up?1+p/100:1-p/100)+" = "+fm(ok))+" "+s.u+".";
    return Q(r,t,ok,wr,{u:s.u,d:2},ex);
  }
  if(form===1){
    ok=up?1+p/100:1-p/100;
    t="Quel coefficient multiplicateur correspond à "+(up?"une hausse":"une baisse")+" de "+p+" % ?";
    wr=[[p/100,"conf"],[up?1-p/100:1+p/100,"signe"],[up?1+p:1-p,"pct0"],[p,"pct0"]];
    return Q(r,t,ok,wr,{d:2},M((up?"1 + ":"1 - ")+fm(p/100)+" = "+fm(ok))+".");
  }
  var cf=pick(r,[0.6,0.7,0.75,0.8,0.85,0.9,1.05,1.1,1.2,1.25,1.5]),pc=rd((cf-1)*100,2),
      okT=(pc>0?"hausse de ":"baisse de ")+f(Math.abs(pc))+" %";
  return Q(r,"Un coefficient multiplicateur de "+f(cf)+" correspond à…",okT,
    [[(pc>0?"baisse de ":"hausse de ")+f(Math.abs(pc))+" %","signe"],[(pc>0?"hausse de ":"baisse de ")+f(cf*100)+" %","pct0"],[(pc>0?"hausse de ":"baisse de ")+f(Math.abs(rd(cf*10,2)))+" %","pct0"]],{},
    M(fm(cf)+" = 1 "+(pc>0?"+ ":"- ")+fm(Math.abs(pc)/100))+" : "+okT+".");
});
reg("ttc_ht",["cap","2nde"],C_PROP,"Prix HT, TVA et prix TTC",["TVA","HT","TTC","taxe","commerce"],2,function(r){
  var t=pick(r,[20,20,10,5.5]),ht=pick(r,[50,80,100,150,200,250,400]),ttc=ht*(1+t/100),rev=r()<0.5;
  if(!rev)return Q(r,"Un produit coûte "+f(ht)+" € HT. La TVA est de "+f(t)+" %. Quel est le prix TTC ?",ttc,
    [[ht+t,"addp"],[ht*t/100,"conf"],[ht/(1+t/100),"inv"],[ht*(1-t/100),"signe"]],{u:"€",d:2},
    "TTC = HT "+M("\\times "+fm(1+t/100))+" : "+M(fm(ht)+" \\times "+fm(1+t/100)+" = "+fm(ttc))+" €.");
  return Q(r,"Un produit coûte "+f(ttc)+" € TTC (TVA "+f(t)+" %). Quel est son prix HT ?",ht,
    [[ttc*(1-t/100),"conf"],[ttc-t,"addp"],[ttc*(1+t/100),"inv"],[ttc*t/100,"conf"]],{u:"€",d:2},
    "HT = TTC "+M("\\div "+fm(1+t/100))+" : "+M(fm(ttc)+" \\div "+fm(1+t/100)+" = "+fm(ht))+" €. Retirer "+f(t)+" % du TTC ne marche pas : le % porte sur le HT.");
});
reg("echelle",["3pm","cap"],C_PROP,"Échelle d’un plan",["échelle","plan","maquette","longueur réelle"],2,function(r){
  var E=pick(r,[20,25,50,100,200]),L=rnd(r,2,12),ok=L*E/100;
  return Q(r,"Sur un plan à l’échelle "+M("\\frac{1}{"+E+"}")+", une longueur mesure "+L+" cm. Quelle est la longueur réelle en mètres ?",ok,
    [[ok*10,"unit"],[ok/10,"unit"],[L*E,"unit"],[L/E,"inv"]],{u:"m",d:2,far:3},
    M(L+" \\times "+E+" = "+fm(L*E))+" cm, soit "+f(ok)+" m.");
});
reg("vitesse",["3pm","cap"],C_PROP,"Vitesse, distance et durée",["vitesse","distance","durée","km/h"],2,function(r){
  var v=pick(r,[30,45,60,90,120]),t=pick(r,[10,15,20,30,40,45]),ok=v*t/60;
  return Q(r,"Un véhicule roule à "+v+" km/h pendant "+t+" min. Quelle distance parcourt-il ?",ok,
    [[v*t/100,"base"],[v*t,"base"],[t/v*60,"inv"],[ok*2,"calc"],[ok/2,"calc"]],{u:"km",d:2},
    t+" min = "+M("\\frac{"+t+"}{60}")+" h, donc "+M("d = "+v+" \\times \\frac{"+t+"}{60} = "+fm(ok))+" km.");
});

/* ═════════ GRANDEURS, MESURES ET VOLUMES ═════════ */
function uL(u){return u.replace("²","^2").replace("³","^3");}
reg("conv",["3pm","cap","2nde"],C_GRAN,"Conversions d’unités",["conversion","unités","kg","litre","mètre"],1,function(r,c){
  var m=cm(r,c),cv=pick(r,CONV[m]),v=pick(r,cv.V),ok=v*cv.k;
  return Q(r,"Convertir "+f(v)+" "+cv.f+(cv.o||"")+" en "+cv.t,ok,
    [[ok*10,"unit"],[ok/10,"unit"],[ok*100,"unit"],[ok/100,"unit"]],{u:cv.t,d:5,far:4},
    "1 "+cv.f+" = "+f(cv.k,5)+" "+cv.t+", donc "+f(v)+" "+cv.f+" = "+f(ok,5)+" "+cv.t+".");
});
reg("perim_aire",["3pm","cap"],C_GRAN,"Périmètre et aire d’un rectangle",["périmètre","aire","rectangle"],1,function(r){
  var L=rnd(r,5,20),l=rnd(r,2,L-1),aire=r()<0.5;
  return aire?Q(r,"Un rectangle mesure "+L+" cm sur "+l+" cm. Quelle est son aire ?",L*l,[[2*(L+l),"conf"],[L+l,"conf"],[L*l*2,"demi"],[L*l/2,"demi"]],{u:"cm²",d:0},M("\\mathcal{A} = L \\times \\ell = "+L+" \\times "+l+" = "+L*l)+" cm².")
       :Q(r,"Un rectangle mesure "+L+" cm sur "+l+" cm. Quel est son périmètre ?",2*(L+l),[[L*l,"conf"],[L+l,"demi"],[4*L,"conf"],[2*L+l,"demi"]],{u:"cm",d:0},M("\\mathcal{P} = 2 \\times (L + \\ell) = 2 \\times ("+L+" + "+l+") = "+2*(L+l))+" cm.");
});
reg("aire_disque",["cap","2nde"],C_GRAN,"Aire d’un disque",["disque","cercle","π","aire"],2,function(r){
  var t=rnd(r,0,3);
  if(t===1){var R1=pick(r,[1.5,2.5,3,3.5,4,5,6,7,9,11]),ok1=3.14*R1*R1;
    return Q(r,"Quelle est l’aire d’un disque de rayon "+f(R1)+" m ? ("+M("\\pi \\approx 3{,}14")+")",ok1,[[3.14*2*R1,"formule"],[3.14*R1*2,"demi"],[3.14*(2*R1)*(2*R1),"demi"],[3.14*R1,"formule"]],{u:"m²",d:2},M("\\mathcal{A} = \\pi r^2 = 3{,}14 \\times "+fm(R1)+"^2 = "+fm(ok1))+" m².");}
  if(t===2){var R2=pick(r,[2,3,4,5,10]),A2=3.14*R2*R2;
    return Q(r,"Un disque a une aire de "+f(A2)+" cm² ("+M("\\pi \\approx 3{,}14")+"). Quel est son rayon ?",R2,[[A2/3.14,"demi"],[A2/(2*3.14),"formule"],[2*R2,"conf"],[R2*R2,"demi"]],{u:"cm",d:2},M("r^2 = "+fm(A2)+" \\div 3{,}14 = "+R2*R2)+", donc "+M("r = \\sqrt{"+R2*R2+"} = "+R2)+" cm.");}
  if(t===3){var D3=rnd(r,7,29),ok3=3.14*D3*D3/4;
    return QE(r,"Estime l’aire d’un disque de diamètre "+D3+" cm.",ok3,{u:"cm²",fig:{k:"disc",d:D3+" cm"}},"Rayon "+f(D3/2)+" cm ; "+M("\\pi r^2 \\approx 3 \\times "+fm(D3/2)+"^2 \\approx "+fm(3*D3*D3/4,0))+" ; exact : "+f(ok3)+" cm².");}
  var d=pick(r,[4,6,8,10,12,14,20,16,18,30,24]),R=d/2,ok=3.14*R*R;
  return Q(r,"Quelle est l’aire d’un disque de diamètre "+d+" cm ? ("+M("\\pi \\approx 3{,}14")+")",ok,
    [[3.14*d*d,"demi"],[3.14*d,"formule"],[3.14*R,"formule"],[2*3.14*R*R,"demi"]],{u:"cm²",d:2},
    "Rayon "+R+" cm. "+M("\\mathcal{A} = \\pi r^2 = 3{,}14 \\times "+R+"^2 = "+fm(ok))+" cm².");
});
reg("volume_pave",["cap","2nde"],C_GRAN,"Volume d’un pavé et capacité en litres",["volume","pavé","litre","dm³","capacité"],2,function(r,c){
  var m=cm(r,c),L=rnd(r,3,8),l=rnd(r,2,6),h=rnd(r,2,5),ok=L*l*h;
  var nom=BAC[m].charAt(0).toUpperCase()+BAC[m].slice(1);
  return Q(r,nom+" mesure "+L+" dm × "+l+" dm × "+h+" dm. Quelle est sa capacité en litres ?",ok,
    [[L*l,"formule"],[ok/10,"unit"],[ok*10,"unit"],[2*(L*l+l*h+L*h),"conf"]],{u:"L",d:0},
    M("V = "+L+" \\times "+l+" \\times "+h+" = "+ok)+" dm³, et 1 dm³ = 1 L, donc "+ok+" L.");
});
reg("volume_cyl",["2nde","term"],C_GRAN,"Volume d’un cylindre",["cylindre","volume","π","boîte"],2,function(r){
  var R=pick(r,[2,3,4,5,1.5,6,2.5,10]),h=pick(r,[5,10,12,20,8,15,30,4]),ok=3.14*R*R*h;
  return Q(r,"Un cylindre a un rayon de "+f(R)+" cm et une hauteur de "+h+" cm. Quel est son volume ? ("+M("\\pi \\approx 3{,}14")+")",ok,
    [[3.14*R*h,"demi"],[3.14*(2*R)*(2*R)*h,"conf"],[ok/3,"demi"],[2*3.14*R*h,"formule"]],{u:"cm³",d:2},
    M("V = \\pi r^2 h = 3{,}14 \\times "+fm(R)+"^2 \\times "+h+" = "+fm(ok))+" cm³.");
});
reg("durees",["3pm","cap"],C_GRAN,"Additionner des durées (heures et minutes)",["durée","heures","minutes","base 60"],2,function(r){
  var h1=rnd(r,1,4),h2=rnd(r,1,4),m1=rnd(r,25,55),m2=rnd(r,60-m1+1,59),tot=h1*60+m1+h2*60+m2,H=Math.floor(tot/60),M2=tot%60;
  var T=function(h,m){return h+" h "+m+" min";};
  return Q(r,"Calculer "+T(h1,m1)+" + "+T(h2,m2),T(H,M2),
    [[T(h1+h2,m1+m2),"base"],[T(H+1,M2),"calc"],[T(H,(M2+30)%60),"calc"]],{},
    m1+" + "+m2+" = "+(m1+m2)+" min = 1 h "+M2+" min, donc le total est "+T(H,M2)+".");
});

/* ═════════ GÉOMÉTRIE ET TRIGONOMÉTRIE ═════════ */
var NOMS2=[["B","A","C"],["E","D","F"],["S","R","T"],["N","M","P"],["J","I","K"]];
var TRIP=[[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15],[7,24,25],[12,16,20],[20,21,29],[9,40,41],[15,20,25],[1.5,2,2.5],[4.5,6,7.5],[10,24,26],[12,35,37],[0.6,0.8,1],[2.4,3.2,4],[15,36,39],[18,24,30],[30,40,50],[21,28,35]];
reg("pyth_hyp",["3pm","cap","2nde"],C_GEO,"Pythagore : calculer l’hypoténuse",["pythagore","hypoténuse","triangle rectangle"],2,function(r){
  var t=pick(r,TRIP),a=t[0],b=t[1],c=t[2];
  return Q(r,"Un triangle est rectangle ; les côtés de l’angle droit mesurent "+a+" cm et "+b+" cm. Combien mesure l’hypoténuse ?",c,
    [[a+b,"formule"],[a*a+b*b,"formule"],[b-a,"conf"],[c+1,"calc"]],{u:"cm",d:0},
    M("c^2 = "+a+"^2 + "+b+"^2 = "+(a*a+b*b))+", donc "+M("c = \\sqrt{"+(a*a+b*b)+"} = "+c)+" cm.");
});
reg("pyth_cote",["cap","2nde"],C_GEO,"Pythagore : calculer un côté de l’angle droit",["pythagore","côté","triangle rectangle"],3,function(r){
  var t=pick(r,TRIP),c=t[2],a=t[0],b=t[1];
  return Q(r,"Un triangle est rectangle ; l’hypoténuse mesure "+c+" cm et un côté de l’angle droit mesure "+a+" cm. Combien mesure l’autre côté ?",b,
    [[Math.sqrt(c*c+a*a),"signe"],[c-a,"formule"],[c*c-a*a,"formule"],[c+a,"formule"]],{u:"cm",d:2},
    M("b^2 = "+c+"^2 - "+a+"^2 = "+(c*c-a*a))+", donc "+M("b = \\sqrt{"+(c*c-a*a)+"} = "+b)+" cm. On soustrait : l’hypoténuse est le plus grand côté.");
});
reg("aire_triangle",["3pm","cap"],C_GEO,"Aire d’un triangle",["triangle","aire","base","hauteur"],1,function(r){
  var b=rnd(r,4,20),h=2*rnd(r,2,9),ok=b*h/2;
  return Q(r,"Quelle est l’aire d’un triangle de base "+b+" cm et de hauteur "+h+" cm ?",ok,
    [[b*h,"demi"],[b+h,"conf"],[b*h/4,"demi"],[b*h/3,"formule"],[2*(b+h),"conf"]],{u:"cm²",d:2},
    M("\\mathcal{A} = \\dfrac{b \\times h}{2} = \\dfrac{"+b+" \\times "+h+"}{2} = "+fm(ok))+" cm².");
});
reg("trigo_choix",["2nde"],C_GEO,"Trigonométrie : choisir la bonne relation",["sinus","cosinus","tangente","SOH CAH TOA","triangle rectangle"],2,function(r){
  var cas=pick(r,[
    {k:"l’hypoténuse",w:"le côté adjacent",ok:"cos"},{k:"l’hypoténuse",w:"le côté opposé",ok:"sin"},{k:"le côté adjacent",w:"le côté opposé",ok:"tan"}]);
  var S={cos:M("\\cos\\alpha = \\dfrac{\\text{adj.}}{\\text{hyp.}}"),sin:M("\\sin\\alpha = \\dfrac{\\text{opp.}}{\\text{hyp.}}"),tan:M("\\tan\\alpha = \\dfrac{\\text{opp.}}{\\text{adj.}}")};
  var others=["cos","sin","tan"].filter(function(x){return x!==cas.ok;});
  var nm=pick(r,NOMS2),ctx=pick(r,["","Pour une rampe, ","Pour une échelle contre un mur, ","Pour un toit, "]);
  if(r()<0.5)return Q(r,ctx+"le triangle "+nm.join("")+" est rectangle en "+nm[0]+". On connaît l’angle "+M("\\widehat{"+nm[2]+"}")+" et "+cas.k+". On cherche "+cas.w+". Quelle relation utiliser ?",S[cas.ok],
    [[S[others[0]],"conf"],[S[others[1]],"conf"],[M("a^2 + b^2 = c^2"),"formule"]],{fig:{k:"tri",ang:"α",n:nm}},"On repère les côtés par rapport à l’angle : "+S[cas.ok]+".");
  return Q(r,ctx+"triangle rectangle : on connaît l’angle "+M("\\alpha")+" et "+cas.k+". On cherche "+cas.w+". Quelle relation utiliser ?",S[cas.ok],
    [[S[others[0]],"conf"],[S[others[1]],"conf"],[M("a^2 + b^2 = c^2"),"formule"]],{},
    "On repère les côtés par rapport à "+M("\\alpha")+" : "+S[cas.ok]+".");
});
reg("trigo_calc",["2nde"],C_GEO,"Trigonométrie : calculer une longueur",["sinus","cosinus","tangente","longueur","angle"],3,function(r){
  var hyp=pick(r,[8,10,12,16,20,5,7,9,14,18,22,25,3.6,4.2]),opp=r()<0.5,ok=hyp*0.5;
  return Q(r,"Triangle rectangle : hypoténuse "+hyp+" cm, angle de "+(opp?"30°":"60°")+". Longueur du côté "+(opp?"opposé":"adjacent")+" à cet angle ? ("+M("\\sin 30^\\circ = \\cos 60^\\circ = 0{,}5")+")",ok,
    [[hyp*0.87,"conf"],[hyp/0.5,"inv"],[hyp-0.5,"addp"],[hyp*0.5+1,"calc"]],{u:"cm",d:2},
    M(opp?"\\sin 30^\\circ = \\dfrac{\\text{opp.}}{\\text{hyp.}}":"\\cos 60^\\circ = \\dfrac{\\text{adj.}}{\\text{hyp.}}")+", donc "+M(hyp+" \\times 0{,}5 = "+fm(ok))+" cm.");
});

/* ═════════ STATISTIQUES ═════════ */
function serie(r,c,n){
  var m=cm(r,c),s=STATC[m],v=[],i,sum=0;
  for(i=0;i<n;i++){v.push(rnd(r,s.lo,s.hi));}
  for(i=0;i<n;i++)sum+=v[i];
  var adj=((sum%n)+n)%n;v[n-1]=v[n-1]-adj;
  if(v[n-1]<s.lo-5)v[n-1]+=n;
  return {v:v,n:s.n};
}
reg("moyenne",["3pm","cap","2nde"],C_STAT,"Calculer une moyenne",["moyenne","série statistique","indicateur"],1,function(r,c){
  var n=pick(r,[4,5]),sr=serie(r,c,n),v=sr.v,sum=v.reduce(function(a,b){return a+b;},0),ok=sum/n,s=v.slice().sort(function(a,b){return a-b;});
  return Q(r,"Relevé de "+sr.n+" : "+v.join(" ; ")+". Quelle est la moyenne ?",ok,
    [[s[Math.floor(n/2)],"conf"],[sum/(n-1),"calc"],[sum/(n+1),"calc"],[(s[0]+s[n-1])/2,"conf"],[sum,"formule"],[s[n-1]-s[0],"conf"]],{d:2},
    "Somme "+sum+", effectif "+n+" : "+M("\\bar{x} = \\dfrac{"+sum+"}{"+n+"} = "+fm(ok))+".");
});
reg("mediane",["cap","2nde"],C_STAT,"Calculer une médiane",["médiane","série","ordre croissant"],2,function(r,c){
  var n=pick(r,[5,7]),sr=serie(r,c,n),v=sr.v,s=v.slice().sort(function(a,b){return a-b;}),ok=s[(n-1)/2],mean=v.reduce(function(a,b){return a+b;},0)/n;
  return Q(r,"Relevé de "+sr.n+" : "+v.join(" ; ")+". Quelle est la médiane ?",ok,
    [[v[(n-1)/2],"ordre"],[(n+1)/2,"conf"],[mean,"conf"],[(s[0]+s[n-1])/2,"conf"],[s[(n-1)/2+1],"calc"],[s[(n-1)/2-1],"calc"]],{d:2},
    "On range par ordre croissant : "+s.join(" ; ")+". La valeur du milieu est "+ok+".");
});
reg("etendue",["cap","2nde"],C_STAT,"Calculer une étendue",["étendue","dispersion","max","min"],1,function(r,c){
  var n=pick(r,[5,6]),sr=serie(r,c,n),v=sr.v,mx=Math.max.apply(null,v),mn=Math.min.apply(null,v),ok=mx-mn;
  if(ok===0)return null;
  return Q(r,"Relevé de "+sr.n+" : "+v.join(" ; ")+". Quelle est l’étendue ?",ok,
    [[mx,"conf"],[mx+mn,"signe"],[ok/2,"demi"],[mn,"conf"]],{d:2},
    "Étendue = plus grande valeur − plus petite = "+M(mx+" - "+mn+" = "+ok)+".");
});
reg("freq_pct",["3pm","cap","2nde"],C_STAT,"Fréquence et pourcentage",["fréquence","effectif","pourcentage","proportion"],2,function(r){
  var N=pick(r,[20,25,40,50,80]),k=pick(r,[3,7,9,12,14,16,18]),ok=k/N*100;
  if(k>=N)return null;
  return Q(r,"Sur "+N+" pièces contrôlées, "+k+" sont défectueuses. Quel pourcentage cela représente-t-il ?",ok,
    [[(N-k)/N*100,"compl"],[k,"conf"],[k/(N-k)*100,"formule"],[k/N,"pct0"],[N/k*100,"inv"]],{u:"%",d:2},
    "Fréquence "+M("\\dfrac{"+k+"}{"+N+"} = "+fm(k/N,3))+", soit "+f(ok)+" %.");
});

/* ═════════ ÉQUATIONS ET CALCUL LITTÉRAL ═════════ */
reg("eq1",["cap","2nde"],C_EQ,"Résoudre une équation du 1er degré",["équation","inconnue","x","1er degré"],2,function(r){
  var t=rnd(r,0,2),x=rnd(r,2,15),a,b,c,q,wr,ex;
  if(t===0){a=rnd(r,3,25);c=x+a;q="x + "+a+" = "+c;wr=[[c+a,"signe"],[a-c,"signe"],[c/a,"formule"],[c-a+1,"calc"]];ex="On retire "+a+" aux deux membres : "+M("x = "+c+" - "+a+" = "+x)+".";}
  else if(t===1){a=rnd(r,2,9);c=a*x;q=a+"x = "+c;wr=[[c-a,"formule"],[c*a,"inv"],[a/c,"inv"],[x+1,"calc"]];ex="On divise par "+a+" : "+M("x = \\dfrac{"+c+"}{"+a+"} = "+x)+".";}
  else{a=rnd(r,2,9);b=rnd(r,1,15);c=a*x+b;q=a+"x + "+b+" = "+c;wr=[[(c+b)/a,"signe"],[c/a-b,"ordre"],[c-b,"demi"],[(c-b)*a,"inv"]];ex="On retire "+b+" : "+M(a+"x = "+(c-b))+", puis on divise par "+a+" : "+M("x = "+x)+".";}
  return Q(r,"Résoudre "+M(q),x,wr,{d:2},ex);
});
reg("eval_expr",["cap","2nde"],C_EQ,"Calculer la valeur d’une expression",["expression littérale","remplacer x","valeur"],2,function(r){
  var sq=r()<0.4;
  if(!sq){var a=rnd(r,2,9),b=rnd(r,-9,12),x=rnd(r,-4,6),ok=a*x+b;
    return Q(r,"Calculer "+M(linL(a,b))+" pour "+M("x = "+fm(x)),ok,[[a*(x+b),"ordre"],[a+x+b,"addp"],[a*x-b,"signe"],[-a*x+b,"signe"],[a*x,"calc"],[Number(String(a)+String(Math.abs(x)))*(x<0?-1:1)+b,"conf"]],{d:0},
      "On remplace x : "+M(a+" \\times "+par(x)+(b<0?" - ":" + ")+Math.abs(b)+" = "+fm(ok))+".");}
  var a2=rnd(r,2,5),x2=rnd(r,-4,5),b2=rnd(r,1,9),ok2=a2*x2*x2+b2;
  return Q(r,"Calculer "+M(a2+"x^2 + "+b2)+" pour "+M("x = "+fm(x2)),ok2,[[(a2*x2)*(a2*x2)+b2,"ordre"],[-a2*x2*x2+b2,"signe"],[a2*2*x2+b2,"demi"],[a2*x2+b2,"demi"],[a2*x2*x2-b2,"signe"],[a2*x2*x2,"calc"]],{d:0},
    "Le carré passe avant la multiplication : "+M(a2+" \\times "+par(x2)+"^2 + "+b2+" = "+a2+" \\times "+x2*x2+" + "+b2+" = "+fm(ok2))+".");
});
reg("formules",["cap","2nde"],C_EQ,"Utiliser une formule (loi d’Ohm, vitesse…)",["formule","isoler","U=RI","d=vt"],2,function(r){
  var t=rnd(r,0,2),a=rnd(r,2,12),b=rnd(r,2,10),p=a*b;
  if(t===0)return Q(r,M("U = R \\times I")+". Calculer "+M("I")+" pour "+M("U = "+p)+" V et "+M("R = "+a)+" Ω.",b,[[p*a,"inv"],[p+a,"addp"],[p-a,"addp"]],{far:2,u:"A",d:2},M("I = \\dfrac{U}{R} = \\dfrac{"+p+"}{"+a+"} = "+b)+" A.");
  if(t===1)return Q(r,M("d = v \\times t")+". Calculer "+M("t")+" pour "+M("d = "+p)+" km et "+M("v = "+a)+" km/h.",b,[[p*a,"inv"],[p+a,"addp"],[p-a,"addp"]],{far:2,u:"h",d:2},M("t = \\dfrac{d}{v} = \\dfrac{"+p+"}{"+a+"} = "+b)+" h.");
  return Q(r,M("P = U \\times I")+". Calculer "+M("U")+" pour "+M("P = "+p)+" W et "+M("I = "+a)+" A.",b,[[p*a,"inv"],[p+a,"addp"],[p-a,"addp"]],{far:2,u:"V",d:2},M("U = \\dfrac{P}{I} = \\dfrac{"+p+"}{"+a+"} = "+b)+" V.");
});
/* calcul littéral : réponses en x (saisie libre avec la touche x) */
reg("lit_reduire",["3pm","cap","2nde"],C_EQ,"Réduire une expression littérale",["réduire","termes semblables","calcul littéral"],1,function(r){
  var a=rnd(r,2,9),b=rnd(r,1,9),c=rnd(r,1,8)*(r()<0.3?-1:1),dd=rnd(r,1,9)*(r()<0.4?-1:1),A=a+c,B=b+dd;
  if(A===0||B===0)return null;
  var E=M(a+"x + "+b+(c<0?" - ":" + ")+(Math.abs(c)===1?"":Math.abs(c))+"x"+(dd<0?" - ":" + ")+Math.abs(dd)),L=function(p,q){return M(linL(p,q));};
  return Q(r,"Réduire "+E,L(A,B),[[L(A+B,0),"conf"],[L(a*c,b+dd),"addp"],[L(A,b-dd),"signe"],[M(fm(A+B)),"conf"]],{lit:linE(A,B),form:"red"},
    "On regroupe les x d’un côté et les nombres de l’autre : "+M(linL(A,B))+".");
});
reg("lit_dev",["cap","2nde"],C_EQ,"Développer (simple distributivité)",["développer","distributivité","calcul littéral"],2,function(r){
  var k=pick(r,[2,3,4,5,6,-2,-3]),a=rnd(r,1,9)*(r()<0.35?-1:1),L=function(p,q){return M(linL(p,q));};
  return Q(r,"Développer "+M(fm(k)+"(x "+(a<0?"- ":"+ ")+Math.abs(a)+")"),L(k,k*a),[[L(k,a),"demi"],[L(1,k*a),"demi"],[L(k,k+a),"addp"],[L(k,-k*a),"signe"]],{lit:linE(k,k*a),form:"dev"},
    "On multiplie chaque terme par "+fm(k)+" : "+M(fm(k)+" \\times x "+(k*a<0?"- ":"+ ")+Math.abs(k*a)+" = "+linL(k,k*a))+".");
});
reg("lit_fact",["2nde"],C_EQ,"Factoriser (facteur commun)",["factoriser","facteur commun","calcul littéral"],2,function(r){
  var k=pick(r,[2,3,4,5,6,7]),a=rnd(r,1,9)*(r()<0.3?-1:1),P=function(p,q){return M(p+"(x "+(q<0?"- ":"+ ")+Math.abs(q)+")");};
  return Q(r,"Factoriser "+M(linL(k,k*a)),P(k,a),[[P(k,k*a),"demi"],[M(k+"x("+(k*a)+")"),"conf"],[P(k,-a),"signe"],[P(k*a,k),"inv"]],{lit:k+"*(x+("+a+"))",form:"fact"},
    "Le facteur commun est "+k+" : "+M(linL(k,k*a)+" = "+k+" \\times x "+(k*a<0?"- ":"+ ")+k+" \\times "+Math.abs(a)+" = "+k+"(x "+(a<0?"- ":"+ ")+Math.abs(a)+")")+".");
});

/* ═════════ FONCTIONS AFFINES ET LINÉAIRES ═════════ */
reg("image_affine",["2nde"],C_FONC,"Image d’un nombre par une fonction affine",["fonction affine","image","f(x)"],2,function(r){
  var a=rnd(r,-5,6),b=rnd(r,-8,10),x=rnd(r,-3,7);if(a===0)a=3;
  var ok=a*x+b;
  return Q(r,M("f(x) = "+linL(a,b))+". Calculer "+M("f("+fm(x)+")")+".",ok,[[a*(x+b),"ordre"],[a+x+b,"addp"],[a*x-b,"signe"],[-a*x+b,"signe"],[a*x,"calc"],[(x-b)/a,"inv"]],{d:0},
    M("f("+fm(x)+") = "+fm(a)+" \\times "+par(x)+(b<0?" - ":" + ")+Math.abs(b)+" = "+fm(ok))+".");
});
reg("antecedent_affine",["2nde"],C_FONC,"Antécédent par une fonction affine",["antécédent","fonction affine","équation"],3,function(r){
  var a=pick(r,[2,3,4,5,-2,-3]),b=rnd(r,-8,12),x=rnd(r,-4,8),c=a*x+b;
  return Q(r,M("f(x) = "+linL(a,b))+". Quel est l’antécédent de "+M(fm(c))+" ?",x,[[a*c+b,"conf"],[(c+b)/a,"signe"],[c-b,"demi"],[c/a-b,"ordre"],[-x,"signe"],[(c-b)*a,"inv"]],{d:2},
    "On résout "+M(linL(a,b)+" = "+fm(c))+" : "+M(fm(a)+"x = "+fm(c-b))+", donc "+M("x = "+fm(x))+".");
});
reg("coeff_dir",["2nde"],C_FONC,"Coefficient directeur d’une droite",["coefficient directeur","pente","deux points","droite"],3,function(r){
  var a=pick(r,[-3,-2,-1,2,3,4,0.5]),x1=rnd(r,-3,3),dx=pick(r,[2,4]),x2=x1+dx,y1=rnd(r,-5,8),y2=y1+a*dx;
  return Q(r,"Une droite passe par "+M("A("+fm(x1)+"\\,;\\,"+fm(y1)+")")+" et "+M("B("+fm(x2)+"\\,;\\,"+fm(y2)+")")+". Quel est son coefficient directeur ?",a,
    [[dx/(y2-y1),"inv"],[(y1-y2)/dx,"signe"],[y2-y1,"demi"],[(y2+y1)/(x2+x1===0?1:x2+x1),"addp"],[y1-a*x1,"conf"]],{d:2},
    M("a = \\dfrac{y_B - y_A}{x_B - x_A} = \\dfrac{"+fm(y2)+" - "+par(y1)+"}{"+fm(x2)+" - "+par(x1)+"} = "+fm(a))+".");
});
reg("sens_variation",["2nde"],C_FONC,"Sens de variation d’une fonction affine",["croissante","décroissante","coefficient directeur"],1,function(r){
  var a=pick(r,[-5,-3,-2,2,3,4,5,6]),b=rnd(r,-9,9),inc=a>0;
  return Q(r,"La fonction "+M("f(x) = "+linL(a,b))+" est…",inc?"croissante":"décroissante",
    [[inc?"décroissante":"croissante","signe"],[b>0?"toujours positive":"toujours négative","conf"],["constante","conf"]],{},
    "Le coefficient directeur est "+M(fm(a)+(inc?" > 0":" < 0"))+" : la fonction est "+(inc?"croissante":"décroissante")+".");
});

/* ═════════ 1ʳᵉ BAC PRO ═════════ */
var C_EVOL="Évolutions et calcul économique",C_SP="Statistiques et probabilités",C_FN="Fonctions numériques",C_GP="Géométrie plane";
function sgp(v){return sg(v,2)+" %";}

reg("evol_succ",["1re"],C_EVOL,"Évolutions successives",["évolutions successives","coefficient global","pourcentages composés"],3,function(r){
  var p1=pick(r,[10,20,25,30,50]),p2=pick(r,[10,20,25,30,40]),up2=r()<0.5,cg=(1+p1/100)*(up2?1+p2/100:1-p2/100),ok=rd((cg-1)*100,2);
  return Q(r,"Une valeur augmente de "+p1+" % puis "+(up2?"augmente":"diminue")+" de "+p2+" %. Quelle est l’évolution globale ?",ok,
    [[up2?p1+p2:p1-p2,"addp"],[rd(((1+p1/100)*(up2?1-p2/100:1+p2/100)-1)*100,2),"signe"],[(p1+(up2?p2:-p2))/2,"conf"],[up2?p1*p2/100:-p1*p2/100,"conf"],[-ok,"signe"]],{F:sgp,nu:"%",d:2},
    "Coefficient global "+M(fm(1+p1/100)+" \\times "+fm(up2?1+p2/100:1-p2/100)+" = "+fm(cg,4))+", soit "+sgp(ok)+". Les taux ne s’additionnent pas.");
});
reg("taux_moyen",["1re"],C_EVOL,"Taux d’évolution moyen",["taux moyen","coefficient","racine","évolution globale"],3,function(r){
  var q=pick(r,[1.1,1.2,1.05,1.5,0.9,1.02,1.03,1.04,0.95,0.8,1.25]),n=pick(r,[2,3,4,5]),cg=Math.pow(q,n),glob=rd((cg-1)*100,2),ok=rd((q-1)*100,2);
  return Q(r,"Une valeur a évolué de "+sgp(glob)+" en "+n+" ans. Quel est le taux d’évolution annuel moyen ?",ok,
    [[rd(glob/n,2),"addp"],[glob,"conf"],[rd(ok*n,2),"addp"],[-ok,"signe"]],{F:sgp,nu:"%",d:2},
    "Coefficient global "+M(fm(cg,4)+" = q^{"+n+"}")+", donc "+M("q = "+fm(q,2))+" : taux annuel "+sgp(ok)+". Diviser le taux global par "+n+" est faux.");
});
reg("indices",["1re"],C_EVOL,"Indices en base 100",["indice","base 100","évolution","IPC"],2,function(r){
  var t=rnd(r,0,2);
  if(t===0){var I=pick(r,[80,90,110,115,125,140,150]),ok=I-100;
    return Q(r,"L’indice d’un prix passe de 100 (année de base) à "+I+". Quelle est l’évolution du prix depuis la base ?",ok,
      [[I,"conf"],[100-I,"signe"],[I/100,"pct0"],[ok/2,"calc"]],{F:sgp,nu:"%"},
      "Indice "+I+" signifie "+M("\\times "+fm(I/100))+", soit "+sgp(ok)+".");}
  if(t===1){var P=pick(r,[80,120,150,200,250]),I2=pick(r,[110,115,120,125,140]),ok2=P*I2/100;
    return Q(r,"Un produit coûte "+f(P)+" € en base 100. Quel est son prix quand l’indice vaut "+I2+" ?",ok2,
      [[P+I2-100,"addp"],[P/(I2/100),"inv"],[P*(I2-100)/100,"conf"],[P*I2,"pct0"]],{u:"€",d:2},
      "Prix "+M("= "+fm(P)+" \\times "+fm(I2/100)+" = "+fm(ok2))+" €.");}
  var v1=pick(r,[40,50,80,125,200]),k=pick(r,[1.2,1.5,0.8,1.25,0.6]),v2=v1*k,ok3=100*k;
  return Q(r,"Une valeur passe de "+f(v1)+" à "+f(v2)+". Quel est l’indice de "+f(v2)+" (base 100 pour "+f(v1)+") ?",ok3,
    [[v2-v1,"conf"],[v1/v2*100,"inv"],[(k-1)*100,"conf"],[100+v2-v1,"addp"]],{d:2},
    "Indice "+M("= \\dfrac{"+fm(v2)+"}{"+fm(v1)+"} \\times 100 = "+fm(ok3))+".");
});
reg("evol_reciproque",["1re"],C_EVOL,"Évolution réciproque",["réciproque","hausse puis baisse","coefficient inverse"],3,function(r){
  var pairs=[[25,20],[100,50],[150,60],[300,75],[400,80],[20,16.67],[50,33.33],[60,37.5],[10,9.09],[5,4.76],[40,28.57],[200,66.67],[11.11,10],[66.67,40]],pr=pick(r,pairs),up=r()<0.5;
  var given=up?pr[0]:pr[1],ok=up?pr[1]:pr[0],ok1=up?-ok:ok;
  return Q(r,"Une valeur "+(up?"augmente":"diminue")+" de "+f(given)+" %. Quelle évolution la ramène à sa valeur de départ ?",ok1,
    [[up?-given:given,"conf"],[up?ok:-ok,"signe"],[up?-(100-given):(100-given),"compl"],[up?-(given-5):(given+5),"calc"]],{F:sgp,nu:"%",d:2},
    "Coefficient aller "+f(up?1+given/100:1-given/100,3)+", donc retour "+M("\\times "+fm(up?1/(1+given/100):1/(1-given/100),3))+", soit "+sgp(ok1)+".");
});

reg("ajustement",["1re"],C_SP,"Droite d’ajustement et estimation",["nuage de points","droite d’ajustement","estimation","statistiques à deux variables"],2,function(r){
  var a=pick(r,[1.5,2,2.5,3,0.5,4]),b=rnd(r,5,40),x=rnd(r,4,15),ok=a*x+b;
  return Q(r,"Une droite d’ajustement a pour équation "+M("y = "+fm(a)+"x + "+b)+". Estimer "+M("y")+" pour "+M("x = "+x)+".",ok,
    [[a*x,"formule"],[a*(x+b),"ordre"],[b*x+a,"conf"],[a+x+b,"addp"]],{d:2},
    M("y = "+fm(a)+" \\times "+x+" + "+b+" = "+fm(ok))+".");
});
reg("proba_arbre",["1re"],C_SP,"Probabilités : arbre pondéré",["probabilité","arbre","complémentaire","intersection"],2,function(r){
  var t=rnd(r,0,2);
  if(t===0){var p=pick(r,[0.2,0.3,0.4,0.6,0.7]);
    return Q(r,M("P(A) = "+fm(p))+". Quelle est la probabilité de l’événement contraire "+M("\\bar{A}")+" ?",rd(1-p,2),[[p,"conf"],[rd(p-1,2),"signe"],[rd(1/p,3),"inv"],[rd(p/2,3),"demi"]],{d:3},M("P(\\bar{A}) = 1 - "+fm(p)+" = "+fm(1-p))+".");}
  var pa=pick(r,[0.2,0.4,0.5,0.6,0.8]),pb=pick(r,[0.25,0.5,0.75,0.4,0.2]),ok=rd(pa*pb,3);
  return Q(r,"Dans un arbre : "+M("P(A) = "+fm(pa))+" et "+M("P_A(B) = "+fm(pb))+". Que vaut "+M("P(A \\cap B)")+" ?",ok,
    [[rd(pa+pb,3),"addp"],[rd(pa/pb,3),"inv"],[pb,"conf"],[rd(pa*(1-pb),3),"conf"]],{d:3},
    "On multiplie le long des branches : "+M(fm(pa)+" \\times "+fm(pb)+" = "+fm(ok,3))+".");
});
reg("proba_simple",["1re","term"],C_SP,"Probabilité d’un événement (urne, tirage)",["probabilité","urne","tirage","événement"],1,function(r){
  var N=pick(r,[10,20,25,40]),v=rnd(r,2,N/2),ro=rnd(r,1,N-v-1),ok=v/N;
  return Q(r,"Un sac contient "+ro+" boules rouges, "+v+" vertes et "+(N-v-ro)+" bleues. On tire une boule au hasard. Probabilité qu’elle soit verte ?",ok,
    [[v/(N-v),"formule"],[ro/N,"conf"],[v/ro,"formule"],[v,"formule"]],{d:3},
    M("P = \\dfrac{\\text{cas favorables}}{\\text{cas possibles}} = \\dfrac{"+v+"}{"+N+"} = "+fm(ok,3))+".");
});

reg("carre_valeurs",["1re"],C_FN,"Fonction carré : calculer une image",["fonction carré","x²","image","signe"],2,function(r){
  var a=rnd(r,1,4),b=rnd(r,-6,8),x=rnd(r,-5,5);if(x===0)x=3;
  var ok=a*x*x+b;
  return Q(r,M("f(x) = "+(a===1?"":a)+"x^2"+(b===0?"":(b<0?" - ":" + ")+Math.abs(b)))+". Calculer "+M("f("+fm(x)+")")+".",ok,
    [[(a*x)*(a*x)+b,"ordre"],[-a*x*x+b,"signe"],[2*a*x+b,"demi"],[a*x+b,"demi"],[a*x*x-b,"signe"],[a*x*x,"calc"]],{d:0},
    M("f("+fm(x)+") = "+a+" \\times "+par(x)+"^2 "+(b<0?"- ":"+ ")+Math.abs(b)+" = "+fm(ok))+".");
});
reg("racine_inverse",["1re"],C_FN,"Fonctions racine carrée et inverse",["racine carrée","fonction inverse","1/x"],2,function(r){
  if(r()<0.5){var n=rnd(r,4,15);
    return Q(r,M("f(x) = \\sqrt{x}")+". Calculer "+M("f("+n*n+")")+".",n,[[n*n/2,"demi"],[n*n*n*n,"conf"],[n+1,"calc"],[n-1,"calc"]],{d:0},M("\\sqrt{"+n*n+"} = "+n)+".");}
  var x=pick(r,[2,4,5,8,10,20,25,0.5,0.25,0.2,40,50,100]),ok=1/x;
  return Q(r,M("f(x) = \\dfrac{1}{x}")+". Calculer "+M("f("+fm(x)+")")+".",ok,[[x,"inv"],[-ok,"signe"],[ok*10,"unit"],[1-ok,"conf"]],{d:3},
    M("f("+fm(x)+") = \\dfrac{1}{"+fm(x)+"} = "+fm(ok,3))+".");
});
reg("seuil_rentab",["1re"],C_FN,"Seuil de rentabilité (modèle affine)",["coût","recette","bénéfice","seuil de rentabilité","modélisation"],3,function(r,c){
  var m=cm(r,c),x0=pick(r,[10,20,25,40,50]),d=pick(r,[2,3,4,5]),a=pick(r,[3,4,6,8]),p=a+d,F=x0*d;
  return Q(r,"Pour fabriquer des "+RENT[m]+" : "+F+" € de coûts fixes et "+a+" € par unité. Chaque unité est vendue "+p+" €. Pour combien d’unités le bénéfice est-il nul ?",x0,
    [[F/p,"formule"],[F/a,"formule"],[F*d,"inv"],[F/(p+a),"signe"]],{d:2},
    M("C(x) = "+a+"x + "+F)+" et "+M("R(x) = "+p+"x")+". On résout "+M(p+"x = "+a+"x + "+F)+" : "+M(d+"x = "+F)+", donc "+M("x = "+x0)+".");
});

reg("vecteur_coord",["1re"],C_GP,"Coordonnées d’un vecteur",["vecteur","coordonnées","repère"],2,function(r){
  var xa=rnd(r,-5,5),ya=rnd(r,-5,5),xb=rnd(r,-5,6),yb=rnd(r,-5,6);
  var ok=[xb-xa,yb-ya];
  if(ok[0]===0&&ok[1]===0)return null;
  var wr=[[[xa-xb,ya-yb],"signe"],[[xb+xa,yb+ya],"addp"],[[yb-ya,xb-xa],"conf"],[[xb-xa,ya-yb],"signe"]];
  return Q(r,M("A("+fm(xa,0)+"\\,;\\,"+fm(ya,0)+")")+" et "+M("B("+fm(xb,0)+"\\,;\\,"+fm(yb,0)+")")+". Coordonnées du vecteur "+M("\\overrightarrow{AB}")+" ?",ok,wr,{F:function(v){return M("("+fm(v[0],0)+"\\,;\\,"+fm(v[1],0)+")");}},
    M("\\overrightarrow{AB}(x_B - x_A\\,;\\,y_B - y_A) = ("+fm(ok[0],0)+"\\,;\\,"+fm(ok[1],0)+")")+".");
});
reg("norme_vecteur",["1re"],C_GP,"Norme d’un vecteur",["norme","longueur","vecteur","distance"],3,function(r){
  var t=pick(r,TRIP),a=t[0],b=t[1],c=t[2],sa=r()<0.5?-1:1,sb=r()<0.5?-1:1;
  return Q(r,"Le vecteur "+M("\\vec{u}")+" a pour coordonnées "+M("("+fm(sa*a)+"\\,;\\,"+fm(sb*b)+")")+". Quelle est sa norme ?",c,
    [[a+b,"formule"],[a*a+b*b,"formule"],[sa*a+sb*b,"signe"],[c+1,"calc"]],{d:2},
    M("\\|\\vec{u}\\| = \\sqrt{"+a+"^2 + "+b+"^2} = \\sqrt{"+(a*a+b*b)+"} = "+c)+".");
});
reg("milieu",["1re"],C_GP,"Milieu d’un segment",["milieu","coordonnées","segment"],2,function(r){
  var xa=2*rnd(r,-4,4),xb=2*rnd(r,-4,4),ya=2*rnd(r,-4,4),yb=2*rnd(r,-4,4),ok=[(xa+xb)/2,(ya+yb)/2];
  var G=function(v){return M("("+fm(v[0],0)+"\\,;\\,"+fm(v[1],0)+")");};
  return Q(r,M("A("+fm(xa,0)+"\\,;\\,"+fm(ya,0)+")")+" et "+M("B("+fm(xb,0)+"\\,;\\,"+fm(yb,0)+")")+". Coordonnées du milieu de [AB] ?",ok,
    [[[xa+xb,ya+yb],"demi"],[[(xb-xa)/2,(yb-ya)/2],"signe"],[[(xa+xb)/2,(ya-yb)/2],"signe"],[[(ya+yb)/2,(xa+xb)/2],"conf"]],{F:G},
    M("M\\left(\\dfrac{x_A + x_B}{2}\\,;\\,\\dfrac{y_A + y_B}{2}\\right) = ("+fm(ok[0],0)+"\\,;\\,"+fm(ok[1],0)+")")+".");
});

/* ═════════ TERMINALE BAC PRO ═════════ */
var C_DER="Dérivation et optimisation",C_SUI="Suites numériques",C_PRO="Probabilités",C_ESP="Géométrie dans l’espace";

reg("deriv_poly",["term"],C_DER,"Dériver un polynôme du 2nd degré",["dérivée","f’(x)","polynôme","dérivation"],3,function(r){
  var a=rnd(r,1,5),b=rnd(r,-8,8),c=rnd(r,-9,9);if(c===0)c=4;if(b===0)b=3;
  var L=function(p,q){return M(linL(p,q));};
  return Q(r,M("f(x) = "+quadL(a,b,c))+". Que vaut "+M("f'(x)")+" ?",L(2*a,b),
    [[L(a,b),"demi"],[L(2*a,b+c),"conf"],[L(2*a,c),"conf"],[M(quadL(2*a,b,0)),"formule"]],{lit:linE(2*a,b),form:"red"},
    M("(ax^2)' = 2ax")+", "+M("(bx)' = b")+", la constante disparaît : "+M("f'(x) = "+linL(2*a,b))+".");
});
reg("deriv_point",["term"],C_DER,"Nombre dérivé en un point",["nombre dérivé","tangente","pente","dérivée"],3,function(r){
  var a=rnd(r,1,4),b=rnd(r,-6,6),c=rnd(r,-5,5),k=rnd(r,-3,4),ok=2*a*k+b,fk=a*k*k+b*k+c;
  return Q(r,M("f(x) = "+quadL(a,b,c))+". Calculer le nombre dérivé "+M("f'("+fm(k)+")")+".",ok,
    [[fk,"conf"],[a*k+b,"demi"],[2*a*k,"formule"],[2*a*k-b,"signe"],[a*k*k+b,"conf"],[2*a+b,"calc"]],{d:0},
    M("f'(x) = "+linL(2*a,b))+" donc "+M("f'("+fm(k)+") = "+fm(ok))+". Ne pas confondre avec "+M("f("+fm(k)+") = "+fm(fk))+".");
});
reg("variation_signe",["term"],C_DER,"Signe de la dérivée et variations",["variations","signe de f’","croissante","extremum"],2,function(r){
  var t=rnd(r,0,5);
  if(t>=4){var a=pick(r,[2,3,4,-2,-3]),b=rnd(r,1,6)*(a>0?-1:1)*a,z=-b/a,inc=a>0;
    if(t===4)return Q(r,M("f'(x) = "+linL(a,b))+". Sur quel intervalle "+M("f")+" est-elle croissante ?",inc?M("["+fm(z)+"\\,;\\,+\\infty[")+"":M("]-\\infty\\,;\\,"+fm(z)+"]"),
      [[inc?M("]-\\infty\\,;\\,"+fm(z)+"]"):M("["+fm(z)+"\\,;\\,+\\infty["),"signe"],[inc?M("["+fm(-z)+"\\,;\\,+\\infty["):M("]-\\infty\\,;\\,"+fm(-z)+"]"),"signe"],[M("[0\\,;\\,+\\infty["),"conf"]].filter(function(w){return z!==0||w[0]!==M("[0\\,;\\,+\\infty[");}),{},
      M("f'(x) = 0")+" pour "+M("x = "+fm(z))+" ; "+M("f'(x) > 0")+" "+(inc?"après":"avant")+" cette valeur (coefficient "+fm(a)+(inc?" > 0":" < 0")+").");
    return Q(r,M("f'(x) = "+linL(a,b))+". En quelle valeur "+M("f")+" admet-elle un extremum ?",z,[[-z,"signe"],[b,"conf"],[a,"conf"],[z+1,"calc"]],{d:2},"On résout "+M(linL(a,b)+" = 0")+" : "+M("x = "+fm(z))+". La dérivée change de signe en cette valeur.");}
  if(t===0)return Q(r,"Sur un intervalle, "+M("f'(x) > 0")+". La fonction "+M("f")+" est…","croissante",[["décroissante","signe"],["positive","conf"],["constante","conf"]],{},M("f' > 0")+" : "+M("f")+" est croissante.");
  if(t===1)return Q(r,"Sur un intervalle, "+M("f'(x) < 0")+". La fonction "+M("f")+" est…","décroissante",[["croissante","signe"],["négative","conf"],["constante","conf"]],{},M("f' < 0")+" : "+M("f")+" est décroissante.");
  if(t===2)return Q(r,M("f'")+" est négative puis positive, et s’annule en "+M("x = 3")+". En 3, "+M("f")+" admet…","un minimum",[["un maximum","signe"],["une valeur nulle","conf"],["une asymptote","conf"]],{},M("f")+" décroît puis croît : c’est un minimum.");
  return Q(r,M("f'")+" est positive puis négative, et s’annule en "+M("x = 2")+". En 2, "+M("f")+" admet…","un maximum",[["un minimum","signe"],["une valeur nulle","conf"],["une asymptote","conf"]],{},M("f")+" croît puis décroît : c’est un maximum.");
});
reg("minimum_parabole",["term"],C_DER,"Optimisation : minimum d’une parabole",["optimisation","minimum","parabole","coût minimal","extremum"],3,function(r){
  var a=pick(r,[1,2]),xm=rnd(r,2,8),b=-2*a*xm,c=rnd(r,1,20),fmin=a*xm*xm+b*xm+c,val=r()<0.5;
  if(val)return Q(r,"Le coût est "+M("C(x) = "+quadL(a,b,c))+". Pour quelle valeur de "+M("x")+" est-il minimal ?",xm,
    [[-b/a,"demi"],[b/(2*a),"signe"],[fmin,"conf"],[xm+1,"calc"]],{d:2},
    M("C'(x) = "+linL(2*a,b))+" s’annule en "+M("x = "+xm)+" ; la parabole est tournée vers le haut : c’est un minimum.");
  return Q(r,"Le coût "+M("C(x) = "+quadL(a,b,c))+" est minimal en "+M("x = "+xm)+". Quel est ce coût minimal ?",fmin,
    [[xm,"conf"],[c,"conf"],[a*xm*xm-b*xm+c,"signe"],[fmin+a,"calc"]],{d:2},
    M("C("+xm+") = "+a+" \\times "+xm*xm+" - "+Math.abs(b)+" \\times "+xm+" + "+c+" = "+fm(fmin))+".");
});

reg("suite_arith",["term"],C_SUI,"Suite arithmétique : terme général",["suite arithmétique","raison","terme général","u_n"],2,function(r){
  var u0=pick(r,[3,5,10,20]),rr=pick(r,[2,3,4,5,-2]),n=pick(r,[5,8,10,12]),ok=u0+n*rr;
  return Q(r,M("(u_n)")+" est arithmétique, "+M("u_0 = "+u0)+", raison "+M(fm(rr))+". Calculer "+M("u_{"+n+"}")+".",ok,
    [[u0+(n+1)*rr,"calc"],[u0*Math.pow(rr,n),"conf"],[u0+rr,"demi"],[n*rr,"formule"]],{d:0},
    M("u_n = u_0 + n \\times r = "+u0+" + "+n+" \\times "+par(rr)+" = "+fm(ok))+".");
});
reg("suite_geo",["term"],C_SUI,"Suite géométrique : terme général",["suite géométrique","raison","terme général","puissance"],3,function(r){
  var u0=pick(r,[2,3,5,10]),q=pick(r,[2,2,3]),n=q===2?rnd(r,3,6):rnd(r,2,4),ok=u0*Math.pow(q,n);
  return Q(r,M("(u_n)")+" est géométrique, "+M("u_0 = "+u0)+", raison "+M(q)+". Calculer "+M("u_{"+n+"}")+".",ok,
    [[u0*q*n,"conf"],[Math.pow(u0*q,n),"ordre"],[u0+n*q,"conf"],[u0*Math.pow(q,n+1),"calc"]],{d:0},
    M("u_n = u_0 \\times q^n = "+u0+" \\times "+q+"^{"+n+"} = "+u0+" \\times "+Math.pow(q,n)+" = "+ok)+".");
});
reg("suite_somme",["term"],C_SUI,"Somme des termes d’une suite arithmétique",["somme","suite arithmétique","n(a+b)/2"],3,function(r){
  var a=pick(r,[1,2,3,5]),rr=pick(r,[1,2,3,4]),n=pick(r,[4,6,8,10,12]),un=a+(n-1)*rr,ok=n*(a+un)/2;
  return Q(r,"Suite arithmétique : premier terme "+a+", raison "+rr+". Calculer la somme des "+n+" premiers termes.",ok,
    [[n*(a+un),"demi"],[(a+un)/2,"demi"],[n*un/2,"formule"],[n*(a+rr*n)/2,"calc"]],{d:2},
    "Dernier terme "+M(a+" + "+(n-1)+" \\times "+rr+" = "+un)+". Somme "+M("= \\dfrac{"+n+" \\times ("+a+" + "+un+")}{2} = "+fm(ok))+".");
});
reg("interets_composes",["term"],C_SUI,"Intérêts composés",["intérêts composés","placement","capital","taux","suite géométrique"],3,function(r){
  var C=pick(r,[500,1000,2000,4000]),t=pick(r,[2,5,10]),n=pick(r,[2,3]),ok=C*Math.pow(1+t/100,n);
  return Q(r,"On place "+f(C)+" € à "+t+" % par an, intérêts composés, pendant "+n+" ans. Quel capital obtient-on ?",ok,
    [[C*(1+n*t/100),"addp"],[C*(1+t/100)*n,"conf"],[C*(1+t/100),"demi"],[C*(1+t/100)*(n+1),"conf"]],{u:"€",d:2},
    M(fm(C)+" \\times "+fm(1+t/100)+"^{"+n+"} = "+fm(ok))+" €. Des intérêts simples donneraient "+f(C*(1+n*t/100))+" €.");
});
reg("reconnaitre_suite",["term"],C_SUI,"Reconnaître une suite arithmétique ou géométrique",["suite arithmétique","suite géométrique","raison"],2,function(r){
  var geo=r()<0.5;
  if(geo){var u=pick(r,[1,2,3,5]),q=pick(r,[2,3,10]);var s=[u,u*q,u*q*q,u*q*q*q];
    return Q(r,s.join(" ; ")+" ; … est une suite…","géométrique, "+M("q = "+q),[["arithmétique, "+M("r = "+q),"conf"],["arithmétique, "+M("r = "+(s[1]-s[0])),"conf"],["ni l’une ni l’autre","conf"]],{},"On passe d’un terme au suivant en multipliant par "+q+" : suite géométrique.");}
  var u2=pick(r,[3,5,7,10]),d=pick(r,[2,3,4,5]);var s2=[u2,u2+d,u2+2*d,u2+3*d];
  return Q(r,s2.join(" ; ")+" ; … est une suite…","arithmétique, "+M("r = "+d),[["géométrique, "+M("q = "+d),"conf"],["géométrique, "+M("q = "+fm(s2[1]/s2[0],2)),"conf"],["ni l’une ni l’autre","conf"]],{},"On passe d’un terme au suivant en ajoutant "+d+" : suite arithmétique.");
});

reg("proba_cond",["term"],C_PRO,"Probabilité conditionnelle",["probabilité conditionnelle","P_A(B)","arbre","sachant que"],3,function(r){
  var pa=pick(r,[0.4,0.5,0.6,0.8,0.3,0.25,0.9,0.7]),pb=pick(r,[0.25,0.5,0.75,0.2,0.4,0.6,0.1,0.3]),pab=rd(pa*pb,3);
  return Q(r,M("P(A) = "+fm(pa))+" et "+M("P(A \\cap B) = "+fm(pab,3))+". Calculer "+M("P_A(B)")+".",pb,
    [[rd(pa*pab,3),"formule"],[rd(pa+pab,3),"addp"],[rd(pa/pab,3),"inv"],[pab,"conf"]],{d:3},
    M("P_A(B) = \\dfrac{P(A \\cap B)}{P(A)} = \\dfrac{"+fm(pab,3)+"}{"+fm(pa)+"} = "+fm(pb))+".");
});
reg("esperance",["term"],C_PRO,"Espérance d’une variable aléatoire",["espérance","variable aléatoire","gain","jeu"],3,function(r){
  var P=pick(r,[[0.5,0.3,0.2],[0.4,0.4,0.2],[0.6,0.3,0.1],[0.25,0.5,0.25]]),xs=shuffle(r,[-5,-2,0,1,3,4,5,8,10]).slice(0,3).sort(function(a,b){return a-b;});
  var ok=P[0]*xs[0]+P[1]*xs[1]+P[2]*xs[2],mean=(xs[0]+xs[1]+xs[2])/3;
  return Q(r,"Un jeu rapporte "+f(xs[0])+" € avec la probabilité "+f(P[0])+", "+f(xs[1])+" € avec "+f(P[1])+" et "+f(xs[2])+" € avec "+f(P[2])+". Quelle est l’espérance du gain ?",ok,
    [[mean,"conf"],[xs[2],"conf"],[xs[0]+xs[1]+xs[2],"addp"],[P[0]+P[1]+P[2],"conf"]],{u:"€",d:2},
    M("E(X) = "+par(xs[0])+" \\times "+fm(P[0])+" + "+par(xs[1])+" \\times "+fm(P[1])+" + "+par(xs[2])+" \\times "+fm(P[2])+" = "+fm(ok))+" €.");
});
reg("independance",["term"],C_PRO,"Événements indépendants",["indépendants","P(A ∩ B)","produit"],2,function(r){
  var pa=pick(r,[0.2,0.3,0.5,0.6,0.25,0.7,0.9,0.15]),pb=pick(r,[0.4,0.5,0.8,0.1,0.3,0.6,0.35,0.2]),ok=rd(pa*pb,3);
  return Q(r,"A et B sont indépendants, "+M("P(A) = "+fm(pa))+" et "+M("P(B) = "+fm(pb))+". Que vaut "+M("P(A \\cap B)")+" ?",ok,
    [[rd(pa+pb,3),"addp"],[rd(Math.abs(pb-pa),3),"calc"],[rd(pa/pb,3),"inv"],[rd(pa+pb-pa*pb,3),"conf"]],{d:3},
    "Indépendance : "+M("P(A \\cap B) = P(A) \\times P(B) = "+fm(pa)+" \\times "+fm(pb)+" = "+fm(ok,3))+".");
});

reg("vol_pyramide",["term"],C_ESP,"Volume d’une pyramide ou d’un cône",["pyramide","cône","volume","1/3"],3,function(r){
  var c=pick(r,[3,6,9,12]),h=rnd(r,4,15),ok=c*c*h/3;
  return Q(r,"Une pyramide a pour base un carré de côté "+c+" cm et pour hauteur "+h+" cm. Quel est son volume ?",ok,
    [[c*c*h,"demi"],[c*c*h/2,"conf"],[c*h/3,"formule"],[c*c/3,"formule"]],{u:"cm³",d:2},
    M("V = \\dfrac{\\mathcal{B} \\times h}{3} = \\dfrac{"+c+"^2 \\times "+h+"}{3} = "+fm(ok))+" cm³.");
});
reg("reduction_agrandissement",["term"],C_ESP,"Réduction et agrandissement (aires, volumes)",["agrandissement","réduction","coefficient k","k²","k³"],3,function(r){
  if(r()<0.5){var k2=pick(r,[2,3,0.5,1.5,4]),A0=pick(r,[12,20,36,50,80]),V0=pick(r,[10,40,120,250]),av=r()<0.5,res=av?A0*k2*k2:V0*k2*k2*k2;
    return Q(r,"Une maquette est "+(k2>1?"agrandie":"réduite")+" à l’échelle "+M("k = "+fm(k2))+". "+(av?"Son aire était de "+A0+" cm². Quelle est la nouvelle aire ?":"Son volume était de "+V0+" cm³. Quel est le nouveau volume ?"),res,
      [[(av?A0:V0)*k2,"demi"],[(av?A0*k2*k2*k2:V0*k2*k2),"demi"],[(av?A0:V0)*2*k2,"formule"],[(av?A0:V0)+k2,"addp"]],{u:av?"cm²":"cm³",d:2},
      (av?"Aire × k² : "+M(A0+" \\times "+fm(k2)+"^2 = "+fm(res)):"Volume × k³ : "+M(V0+" \\times "+fm(k2)+"^3 = "+fm(res)))+".");}
  var k=pick(r,[2,3,0.5,4,1.5,10]),vol=r()<0.5,e=vol?3:2,ok=Math.pow(k,e);
  var F=function(v){return "× "+f(v,3);};
  return Q(r,"On "+(k>1?"agrandit":"réduit")+" un solide dans le rapport "+M("k = "+fm(k))+". Par combien "+(vol?"le volume est-il multiplié":"l’aire est-elle multipliée")+" ?",ok,
    [[k,"conf"],[Math.pow(k,vol?2:3),"demi"],[k*e,"formule"],[k+e,"addp"],[1/Math.pow(k,e),"inv"],[Math.pow(k,e)*k,"calc"]],{F:F,nu:"",d:3},
    "Longueurs "+M("\\times k")+", aires "+M("\\times k^2")+", volumes "+M("\\times k^3")+" : "+M("k^{"+e+"} = "+fm(ok,3))+".");
});
reg("vol_sphere",["term"],C_ESP,"Volume d’une boule",["sphère","boule","volume","4/3 π r³"],3,function(r){
  if(r()<0.35){var Re=rnd(r,2,9);return QE(r,"Estime le volume d’une boule de rayon "+Re+" cm.",4/3*3.14*Re*Re*Re,{u:"cm³"},M("V = \\dfrac{4}{3} \\pi r^3 \\approx 4 \\times "+Re+"^3 = "+4*Re*Re*Re)+" cm³ (ordre de grandeur, car "+M("\\dfrac{4}{3}\\pi \\approx 4{,}19")+").");}
  var R=pick(r,[3,6,1.5,9,12,0.3]),ok=4/3*3.14*R*R*R;
  return Q(r,"Quel est le volume d’une boule de rayon "+f(R)+" cm ? ("+M("\\pi \\approx 3{,}14")+")",ok,
    [[4*3.14*R*R,"formule"],[4/3*3.14*R*R,"demi"],[3.14*R*R*R,"demi"],[2/3*3.14*R*R*R,"conf"]],{u:"cm³",d:2},
    M("V = \\dfrac{4}{3} \\pi r^3 = \\dfrac{4}{3} \\times 3{,}14 \\times "+fm(R)+"^3 = "+fm(ok))+" cm³.");
});

/* ═══════════════════════════════════════════════════════════════
   BANQUE ENRICHIE (v3.2) — 1/3 : calcul, proportionnalité
   Chaque notion propose plusieurs « angles » : calcul direct, calcul inverse,
   choix de l’opération, piège classique, tuiles à associer, remise en ordre,
   estimation au curseur, étape fausse à trouver, lecture de figure.
   Les mauvaises réponses sont des erreurs types (codes ERR, voir bank_core.js).
═══════════════════════════════════════════════════════════════ */
var C_MET="Problèmes des métiers (plusieurs étapes)",C_ALGO="Algorithmique et tableur";
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a||1;}
function frL(n,d){return "\\dfrac{"+n+"}{"+d+"}";}
function frM(n,d){return M(frL(n,d));}
function pickN(r,arr,n){return shuffle(r,arr).slice(0,n);}
function cap1(s){return s.charAt(0).toUpperCase()+s.slice(1);}

/* ═════════ CALCUL MENTAL ET AUTOMATISMES ═════════ */
reg("tables",["3pm","cap"],C_CALC,"Tables de multiplication et divisions de tête",["tables","multiplication","division","calcul mental"],1,function(r){
  var t=rnd(r,0,3);
  if(t===0){var a=rnd(r,6,12),b=rnd(r,6,12),ok=a*b;
    return Q(r,"Calculer "+M(a+" \\times "+b),ok,[[a*(b-1),"calc"],[a*(b+1),"calc"],[(a-1)*b,"calc"],[ok+10,"calc"],[a+b,"addp"]],{d:0,pos:true},
      M(a+" \\times "+b+" = "+ok)+(b===9?" (astuce : "+M(a+" \\times 10 - "+a)+")":b===11?" (astuce : "+M(a+" \\times 10 + "+a)+")":"")+".");}
  if(t===1){var ps=[],seen={};while(ps.length<4){var x=rnd(r,3,12),y=rnd(r,3,12);if(seen[x*y])continue;seen[x*y]=1;ps.push([M(x+" \\times "+y),String(x*y)]);}
    return QA(r,"Associe chaque produit à son résultat.",ps,"Tables de multiplication : à connaître par cœur, elles servent partout.");}
  if(t===2){var d=rnd(r,3,9),q=rnd(r,4,12),n=d*q;
    return Q(r,"Combien de fois "+d+" dans "+n+" ?",q,[[q+1,"calc"],[q-1,"calc"],[n-d,"addp"],[d,"conf"]],{d:0,pos:true},M(n+" \\div "+d+" = "+q)+" car "+M(d+" \\times "+q+" = "+n)+".");}
  var a2=rnd(r,3,9),b2=rnd(r,3,9),c2=rnd(r,2,9),ok2=a2*b2*c2;
  return Q(r,"Calculer "+M(a2+" \\times "+b2+" \\times "+c2),ok2,[[a2*b2+c2,"ordre"],[a2+b2*c2,"ordre"],[a2*b2*(c2+1),"calc"],[ok2-a2*b2,"calc"]],{d:0},M(a2+" \\times "+b2+" = "+a2*b2)+", puis "+M(a2*b2+" \\times "+c2+" = "+ok2)+".");
});
reg("estim_calc",["3pm","cap","2nde"],C_CALC,"Ordre de grandeur d’un calcul (estimation)",["ordre de grandeur","estimation","arrondir","curseur"],2,function(r){
  var t=rnd(r,0,3);
  if(t===0){var a=rnd(r,21,98),b=rnd(r,21,98),A=Math.round(a/10)*10,B=Math.round(b/10)*10,ok=a*b;
    return QE(r,"Estimer "+M(a+" \\times "+b),ok,{},"Ordre de grandeur : "+M(A+" \\times "+B+" = "+fm(A*B))+". Valeur exacte : "+f(ok)+".");}
  if(t===1){var b2=rnd(r,12,48),qq=rnd(r,11,60),a2=b2*qq+rnd(r,0,b2-1),ok2=a2/b2,B2=Math.round(b2/10)*10;
    return QE(r,"Estimer "+M(a2+" \\div "+b2),ok2,{},"On arrondit : "+M(fm(a2)+" \\div "+B2+" \\approx "+fm(rd(a2/B2,1)))+". Valeur exacte : "+f(ok2,2)+".");}
  if(t===2){var x=rnd(r,31,89)/10,y=rnd(r,21,99);if(x===Math.round(x)||y%10===0)return null;var ok3=x*y,X=Math.round(x),Y=Math.round(y/10)*10;
    return QE(r,"Estimer "+M(fm(x)+" \\times "+y),ok3,{},"On arrondit : "+M(X+" \\times "+Y+" = "+X*Y)+". Valeur exacte : "+f(ok3)+".");}
  var p=rnd(r,31,79)+rnd(r,1,9)/10,q2=rnd(r,11,39)+rnd(r,1,9)/10,P=Math.round(p/10)*10,Qr=Math.round(q2/10)*10,okq=P*Qr;
  return Q(r,"Quel est le meilleur ordre de grandeur de "+M(fm(p)+" \\times "+fm(q2))+" ?",okq,[[okq*10,"unit"],[okq/10,"unit"],[P+Qr,"addp"],[P*Qr*2,"calc"]],{d:0,far:2},
    "On arrondit à la dizaine : "+M(P+" \\times "+Qr+" = "+fm(okq))+" (valeur exacte "+f(p*q2)+").");
});
reg("ranger_dec",["3pm","cap"],C_CALC,"Comparer et ranger des nombres décimaux",["comparer","ranger","décimaux","ordre croissant","virgule"],1,function(r){
  var base=rnd(r,0,9),pool=pickN(r,[0.5,0.15,0.05,0.4,0.45,0.125,0.09,0.3,0.25,0.505,0.7],4).map(function(d){return rd(base+d,3);}),t=rnd(r,0,2);
  var pad=function(v){return f(v,3).indexOf(",")<0?f(v,3)+",000":f(v,3)+"000".slice(0,3-f(v,3).split(",")[1].length);};
  var ex="On compare la partie entière, puis les dixièmes, les centièmes… En complétant avec des zéros : "+pool.slice().sort(function(a,b){return a-b;}).map(pad).join(" < ")+".";
  if(t<2){var asc=t===0,s=pool.slice().sort(function(a,b){return asc?a-b:b-a;});
    return QO(r,"Range ces nombres "+(asc?"du plus petit au plus grand.":"du plus grand au plus petit."),s.map(function(v){return f(v,3);}),ex,{how:asc?"du plus petit au plus grand":"du plus grand au plus petit",sep:asc?" < ":" > "});}
  var mx=Math.max.apply(null,pool);
  return Q(r,"Quel est le plus grand de ces nombres ?",f(mx,3),pool.filter(function(v){return v!==mx;}).map(function(v){return [f(v,3),"conf"];}),{},ex+" Un nombre n’est pas plus grand parce qu’il a plus de chiffres après la virgule.");
});
var FEQ=[[1,2,"0,5",50],[1,4,"0,25",25],[3,4,"0,75",75],[1,5,"0,2",20],[2,5,"0,4",40],[1,10,"0,1",10],[3,10,"0,3",30],[1,20,"0,05",5],[3,2,"1,5",150],[1,8,"0,125",12.5],[7,10,"0,7",70],[3,5,"0,6",60]];
reg("frac_dec_pct",["3pm","cap","2nde"],C_CALC,"Fractions, décimaux et pourcentages : écritures égales",["fraction","décimal","pourcentage","équivalence","tuiles"],1,function(r){
  var t=rnd(r,0,3),s=pickN(r,FEQ,4);
  if(t===0)return QA(r,"Associe chaque fraction à son écriture décimale.",s.map(function(e){return [frM(e[0],e[1]),e[2]];}),"Pour passer d’une fraction au décimal, on divise le numérateur par le dénominateur.");
  if(t===1)return QA(r,"Associe chaque nombre décimal à son pourcentage.",s.map(function(e){return [e[2],f(e[3])+" %"];}),"Pourcentage = décimal × 100 : 0,05 = 5 %, 0,5 = 50 %.");
  var e=s[0],okp=f(e[3])+" %";
  if(t===2)return Q(r,"Écrire "+frM(e[0],e[1])+" en pourcentage.",okp,[[e[0]+""+e[1]+" %","conf"],[e[2]+" %","pct0"],[f(e[3]/10)+" %","unit"],[f(e[1]/e[0]*100)+" %","inv"]],{},
    frM(e[0],e[1])+" = "+M(fm(e[0]/e[1],3))+" = "+okp+". Ce n’est pas « "+e[0]+""+e[1]+" % » !");
  var near=FEQ.filter(function(x){return x!==e;}).sort(function(a,b){return Math.abs(a[3]-e[3])-Math.abs(b[3]-e[3]);}).slice(0,3);
  return Q(r,"Quelle fraction est égale à "+e[2]+" ?",frM(e[0],e[1]),near.map(function(x){return [frM(x[0],x[1]),"conf"];}),{},e[2]+" = "+frM(e[0],e[1])+" car "+M(e[0]+" \\div "+e[1]+" = "+fm(e[0]/e[1],3))+".");
});
reg("frac_ops",["cap","2nde"],C_CALC,"Additionner et multiplier des fractions",["fraction","addition","multiplication","dénominateur commun"],2,function(r){
  var t=rnd(r,0,3),F=function(n,d){return frM(n,d);},fo={F:function(v){return typeof v==="string"?v:"";}};
  if(t===0){var b=pick(r,[5,7,9,11]),a=rnd(r,1,b-2),c=rnd(r,1,b-a-1);if(gcd(a+c,b)!==1)return null;
    var q=Q(r,"Calculer "+M(frL(a,b)+" + "+frL(c,b)),F(a+c,b),[[F(a+c,2*b),"formule"],[F(a*c,b),"addp"],[F(a+c,b*b),"formule"],[F(a+c+1,b),"calc"]],{},
      "Même dénominateur : on additionne les numérateurs, on garde le dénominateur. "+M(frL(a,b)+" + "+frL(c,b)+" = "+frL(a+c,b))+".");
    q.num=(a+c)/b;q.unit="";q.dec=3;return q;}
  if(t===1){var a1=rnd(r,1,5),b1=rnd(r,2,7),c1=rnd(r,1,5),d1=rnd(r,2,7);if(a1>=b1||c1>=d1||gcd(a1*c1,b1*d1)!==1)return null;
    var q1=Q(r,"Calculer "+M(frL(a1,b1)+" \\times "+frL(c1,d1)),F(a1*c1,b1*d1),[[F(a1*d1,b1*c1),"inv"],[F(a1+c1,b1+d1),"formule"],[F(a1*c1,b1+d1),"addp"],[F(a1+c1,b1*d1),"addp"]],{},
      "On multiplie les numérateurs entre eux et les dénominateurs entre eux : "+M(frL(a1+" \\times "+c1,b1+" \\times "+d1)+" = "+frL(a1*c1,b1*d1))+".");
    q1.num=a1*c1/(b1*d1);q1.unit="";q1.dec=3;return q1;}
  if(t===2){var p=pick(r,[[1,2,1,3],[1,2,1,4],[1,3,1,4],[2,3,1,4],[1,2,1,5],[3,4,1,8],[1,4,1,6],[2,5,1,2]]),N=p[0]*p[3]+p[2]*p[1],D=p[1]*p[3],g=gcd(N,D);
    var q2=Q(r,"Calculer "+M(frL(p[0],p[1])+" + "+frL(p[2],p[3])),F(N/g,D/g),[[F(p[0]+p[2],p[1]+p[3]),"formule"],[F(p[0]+p[2],D),"formule"],[F(p[0]*p[2],D),"addp"],[F(N/g+1,D/g),"calc"]],{},
      "On met au même dénominateur "+D+" : "+M(frL(p[0]*p[3],D)+" + "+frL(p[2]*p[1],D)+" = "+frL(N,D)+(g>1?" = "+frL(N/g,D/g):""))+". On n’additionne jamais les dénominateurs.");
    q2.num=N/D;q2.unit="";q2.dec=3;return q2;}
  var a3=rnd(r,1,3),b3=pick(r,[2,3,4]),c3=rnd(r,1,3),d3=b3*2;if(a3>=b3||c3>=d3)return null;
  var N3=a3*2+c3,bad=rnd(r,0,2),st=[M("= "+frL(a3+" \\times 2",b3+" \\times 2")+" + "+frL(c3,d3)),M("= "+frL(2*a3,d3)+" + "+frL(c3,d3)),M("= "+frL(N3,d3))];
  if(bad===0)st[0]=M("= "+frL(a3+" + 2",b3+" + 2")+" + "+frL(c3,d3));
  if(bad===1)st[1]=M("= "+frL(2*a3+c3,d3+d3));
  if(bad===2)st[2]=M("= "+frL(N3+1,d3));
  return QX(r,"Sami calcule "+M(frL(a3,b3)+" + "+frL(c3,d3))+". Où est son erreur ?",st,bad,
    "Bon calcul : "+M(frL(a3,b3)+" + "+frL(c3,d3)+" = "+frL(2*a3,d3)+" + "+frL(c3,d3)+" = "+frL(N3,d3))+". On multiplie le numérateur ET le dénominateur par le même nombre, puis on additionne seulement les numérateurs.");
});
reg("frac_comp",["cap","2nde"],C_CALC,"Comparer et ranger des fractions",["fraction","comparer","ranger"],2,function(r){
  var pool=pickN(r,[[1,2],[1,3],[2,3],[3,4],[1,4],[2,5],[3,5],[5,6],[1,6],[3,8],[5,8],[7,10],[1,5],[4,5]],8),vals={},sel=[];
  pool.forEach(function(p){var v=rd(p[0]/p[1],6);if(!vals[v]&&sel.length<4){vals[v]=1;sel.push(p);}});
  var srt=sel.slice().sort(function(a,b){return a[0]/a[1]-b[0]/b[1];});
  var ex="En écriture décimale : "+srt.map(function(p){return frM(p[0],p[1])+" ≈ "+f(p[0]/p[1],2);}).join(" ; ")+".";
  if(r()<0.6)return QO(r,"Range ces fractions du plus petit au plus grand.",srt.map(function(p){return frM(p[0],p[1]);}),ex,{how:"du plus petit au plus grand",sep:" < "});
  var mx=srt[3];
  return Q(r,"Quelle est la plus grande fraction ?",frM(mx[0],mx[1]),srt.slice(0,3).map(function(p){return [frM(p[0],p[1]),"conf"];}),{},ex+" Un grand dénominateur ne veut pas dire une grande fraction.");
});
reg("carres12",["3pm","cap"],C_CALC,"Carrés de 1 à 12 et racines carrées",["carré","racine carrée","estimation"],1,function(r){
  var t=rnd(r,0,3);
  if(t===0){var ns=pickN(r,[2,3,4,5,6,7,8,9,10,11,12],4);return QA(r,"Associe chaque nombre à son carré.",ns.map(function(n){return [M(n+"^2"),String(n*n)];}),"Le carré de n, c’est n × n (et non 2 × n).");}
  if(t===1){var N=pick(r,[10,20,30,40,50,60,70,80,90,110,120,130,140]),s=Math.sqrt(N),a=Math.floor(s);
    return Q(r,"Entre quels entiers consécutifs se trouve "+M("\\sqrt{"+N+"}")+" ?","entre "+a+" et "+(a+1),[["entre "+Math.floor(N/2)+" et "+(Math.floor(N/2)+1),"demi"],["entre "+(a-1)+" et "+a,"calc"],["entre "+(a+1)+" et "+(a+2),"calc"]],{},
      M(a+"^2 = "+a*a)+" et "+M((a+1)+"^2 = "+(a+1)*(a+1))+", donc "+M("\\sqrt{"+N+"}")+" est entre "+a+" et "+(a+1)+".");}
  if(t===2){var N2=pick(r,[8,15,24,30,45,50,62,75,90,110,130]);
    return QE(r,"Estime "+M("\\sqrt{"+N2+"}")+" avec le curseur.",Math.sqrt(N2),{min:0,max:pick(r,[12,15]),tol:0.3},M("\\sqrt{"+N2+"} \\approx "+fm(Math.sqrt(N2),2))+" : on cherche le carré le plus proche.");}
  var n=rnd(r,4,12);
  return Q(r,"Calculer "+M(n+"^2"),n*n,[[2*n,"demi"],[n*n+n,"calc"],[(n-1)*n,"calc"],[n+2,"addp"]],{d:0},M(n+"^2 = "+n+" \\times "+n+" = "+n*n)+".");
});
reg("axe_gradue",["3pm","cap"],C_CALC,"Lire une abscisse sur une droite graduée",["droite graduée","abscisse","relatifs","décimaux","lecture"],1,function(r){
  var t=rnd(r,0,2),fig,ok,wr,ex;
  if(t===0){var mn=rnd(r,0,5),k=pick(r,[1,2,3,4,6,7,8,9]),st=0.2;ok=rd(mn+k*st,2);
    fig={k:"axe",min:mn,max:mn+2,step:st,every:5,labels:[0,5,10],pts:[[ok,"A"]]};
    wr=[[rd(mn+k*0.1,2),"lect"],[mn+k,"lect"],[rd(ok+st,2),"lect"],[rd(ok-st,2),"lect"]];ex="Entre "+mn+" et "+(mn+1)+" il y a 5 intervalles : un intervalle vaut "+M("1 \\div 5 = 0{,}2")+". A est à "+k+" intervalles de "+mn+" : "+f(ok)+".";}
  else if(t===1){var k2=rnd(r,1,7);ok=-k2;fig={k:"axe",min:-8,max:4,step:1,every:1,labels:[8,9],pts:[[ok,"B"]]};
    wr=[[k2,"signe"],[-(k2+1),"lect"],[-(k2-1),"lect"],[k2-8,"lect"]];ex="On compte les graduations à gauche de 0 : B est à "+k2+" unités, donc son abscisse est "+f(ok)+".";}
  else{var k3=pick(r,[1,3,5,6,7]);ok=k3/4;fig={k:"axe",min:0,max:2,step:0.25,every:4,labels:[0,4,8],pts:[[ok,"C"]]};
    wr=[[k3/10,"lect"],[k3,"lect"],[k3/5,"lect"],[ok+0.25,"lect"]];ex="L’unité est partagée en 4 : chaque graduation vaut "+M("\\dfrac{1}{4} = 0{,}25")+". C est à "+k3+" graduations : "+M(frL(k3,4)+" = "+fm(ok))+".";}
  var q=Q(r,"Quelle est l’abscisse du point "+fig.pts[0][1]+" ?",ok,wr,{d:2,fig:fig},ex);
  return q;
});
reg("prio_err",["cap","2nde"],C_CALC,"Trouver l’erreur dans un calcul (priorités, signes)",["priorités","erreur","signes","étapes"],2,function(r){
  var t=rnd(r,0,3);
  if(t===0){var a=rnd(r,20,40),b=rnd(r,2,5),c=rnd(r,2,6),d=rnd(r,2,6),s=c+d;
    return QX(r,"Inès calcule "+M(a+" - "+b+" \\times ("+c+" + "+d+")")+". Où est son erreur ?",[M("= "+a+" - "+b+" \\times "+s),M("= "+(a-b)+" \\times "+s),M("= "+(a-b)*s)],1,
      "La multiplication passe avant la soustraction : "+M(a+" - "+b+" \\times "+s+" = "+a+" - "+b*s+" = "+(a-b*s))+".");}
  if(t===1){var x=rnd(r,2,6),m=rnd(r,2,5),n=rnd(r,2,6);
    return QX(r,"Tom calcule "+M("(-"+x+")^2 + "+m+" \\times "+n)+". Où est son erreur ?",[M("= -"+x*x+" + "+m+" \\times "+n),M("= -"+x*x+" + "+m*n),M("= "+(m*n-x*x))],0,
      "Un carré est positif : "+M("(-"+x+")^2 = "+x*x)+". Donc "+M(x*x+" + "+m*n+" = "+(x*x+m*n))+".");}
  if(t===2){var a2=rnd(r,2,9),b2=rnd(r,3,9),c2=rnd(r,2,5);
    return QX(r,"Lina calcule "+M(a2+" + "+b2+" \\times "+c2+" - 1")+". Où est son erreur ?",[M("= "+a2+" + "+b2*c2+" - 1"),M("= "+(a2+b2*c2)+" - 1"),M("= "+(a2+b2*c2+1))],2,
      "Les deux premières étapes sont justes ; la dernière est une erreur de calcul : "+M((a2+b2*c2)+" - 1 = "+(a2+b2*c2-1))+".");}
  var p=rnd(r,2,6),q=rnd(r,2,6),w=rnd(r,10,30);
  return QX(r,"Noé calcule "+M(w+" - (-"+p+") \\times "+q)+". Où est son erreur ?",[M("= "+w+" - (-"+p*q+")"),M("= "+w+" - "+p*q),M("= "+(w-p*q))],1,
    "Soustraire un nombre négatif revient à ajouter son opposé : "+M(w+" - (-"+p*q+") = "+w+" + "+p*q+" = "+(w+p*q))+".");
});
reg("sci_ordre",["cap","2nde"],C_CALC,"Notation scientifique : comparer, convertir",["notation scientifique","puissances de 10","ranger","tuiles"],2,function(r){
  var t=rnd(r,0,2);
  if(t===0){var used={},it=[];while(it.length<4){var m=pick(r,[1.2,2.5,3,4.8,5,7.5,9]),e=rnd(r,2,6),v=m*Math.pow(10,e);if(used[v])continue;used[v]=1;it.push({m:m,e:e,v:v});}
    it.sort(function(a,b){return a.v-b.v;});
    return QO(r,"Range ces nombres du plus petit au plus grand.",it.map(function(x){return M(fm(x.m)+" \\times 10^{"+x.e+"}");}),"On compare d’abord les puissances de 10, puis les nombres devant si les puissances sont égales.",{how:"du plus petit au plus grand",sep:" < "});}
  if(t===1){var ps=[],us={};while(ps.length<4){var m2=pick(r,[1.5,2,3.4,4,5.6,6,8]),e2=pick(r,[-3,-2,-1,2,3,4]),k=m2+"|"+e2;if(us[k])continue;us[k]=1;ps.push([M(fm(m2)+" \\times 10^{"+e2+"}"),f(m2*Math.pow(10,e2),5)]);}
    var dl={};if(ps.some(function(p){if(dl[p[1]])return true;dl[p[1]]=1;return false;}))return null;
    return QA(r,"Associe chaque écriture scientifique à son écriture décimale.",ps,"Exposant positif : la virgule va vers la droite ; exposant négatif : vers la gauche.");}
  var m3=pick(r,[4.5,3.2,7,1.8,6.25]),e3=pick(r,[-4,-3,-2,3,4,5]),x=m3*Math.pow(10,e3),S=function(mm,ee){return M(fm(mm)+" \\times 10^{"+ee+"}");};
  return Q(r,"Quelle est l’écriture scientifique de "+f(x,6)+" ?",S(m3,e3),[[S(m3,-e3),"signe"],[S(m3*10,e3-1),"conf"],[S(m3,e3+(e3>0?-1:1)),"calc"]],{},
    "Un seul chiffre non nul avant la virgule : "+f(x,6)+" = "+S(m3,e3)+".");
});
reg("mult_dec",["3pm","cap"],C_CALC,"Multiplier des nombres décimaux",["décimaux","multiplication","virgule"],1,function(r){
  var a=rnd(r,2,9),b=rnd(r,2,9),da=pick(r,[1,1,2]),db=pick(r,[0,1]),x=a/Math.pow(10,da),y=b/Math.pow(10,db),ok=x*y;
  return Q(r,"Calculer "+M(fm(x,3)+" \\times "+fm(y,3)),ok,[[a*b/Math.pow(10,Math.max(da,db)),"unit"],[x+y,"addp"],[ok*10,"unit"],[ok/10,"unit"]],{d:4,far:2},
    "On calcule "+M(a+" \\times "+b+" = "+a*b)+", puis on place la virgule : "+(da+db)+" chiffre"+(da+db>1?"s":"")+" après la virgule au total, d’où "+f(ok,4)+".");
});

/* ═════════ PROPORTIONNALITÉ ET POURCENTAGES ═════════ */
var PTAB=[["Masse (kg)","Prix (€)"],["Durée (h)","Distance (km)"],["Nombre de pots","Surface peinte (m²)"],["Volume (L)","Masse (kg)"],["Nombre d’articles","Prix (€)"],["Temps (min)","Volume (L)"]];
reg("prop_tableau",["3pm","cap","2nde"],C_PROP,"Tableau de proportionnalité : reconnaître, compléter",["proportionnalité","tableau","coefficient","quatrième proportionnelle"],1,function(r){
  var lab=pick(r,PTAB),k=pick(r,[1.5,2,2.5,3,4,5,6,8,12]),xs=pickN(r,[2,3,4,5,6,8,10,12],3).sort(function(a,b){return a-b;}),ys=xs.map(function(x){return x*k;}),t=rnd(r,0,2);
  if(t===0){var hole=rnd(r,1,2),ok=ys[hole],row=ys.map(function(y,i){return i===hole?"?":f(y);});
    var fig={k:"tab",hc:1,rows:[[lab[0]].concat(xs.map(String)),[lab[1]].concat(row)]};
    return Q(r,"Ce tableau est un tableau de proportionnalité. Quelle est la valeur manquante ?",ok,[[ys[0]+(xs[hole]-xs[0]),"addp"],[xs[hole]/k,"inv"],[ok+k,"calc"],[ok-k,"calc"]],{d:2,fig:fig},
      "Coefficient : "+M(fm(ys[0])+" \\div "+xs[0]+" = "+fm(k))+", donc "+M(xs[hole]+" \\times "+fm(k)+" = "+fm(ok))+".");}
  if(t===1){var prop=r()<0.5,add=rnd(r,2,9),ys2=prop?ys:xs.map(function(x){return x*k+add;});
    var q=VF(r,"Ce tableau est-il un tableau de proportionnalité ?",prop,prop?"Oui : on passe de la 1re ligne à la 2e en multipliant toujours par "+f(k)+".":"Non : les quotients ne sont pas égaux ("+xs.map(function(x,i){return f(ys2[i])+" ÷ "+x+" ≈ "+f(ys2[i]/x,2);}).join(" ; ")+").");
    q.fig={k:"tab",hc:1,rows:[[lab[0]].concat(xs.map(String)),[lab[1]].concat(ys2.map(function(y){return f(y);}))]};
    q.choices=[{t:"Oui",err:prop?null:"conf"},{t:"Non",err:prop?"conf":null}];return q;}
  var fig2={k:"tab",hc:1,rows:[[lab[0]].concat(xs.map(String)),[lab[1]].concat(ys.map(function(y){return f(y);}))]};
  return Q(r,"Par quel nombre multiplie-t-on la 1re ligne pour obtenir la 2e ?",k,[[1/k,"inv"],[ys[0]-xs[0],"addp"],[ys[0],"conf"],[k+1,"calc"]],{d:3,fig:fig2},
    "Coefficient de proportionnalité : "+M(fm(ys[0])+" \\div "+xs[0]+" = "+fm(k))+".");
});
reg("prop_graph",["cap","2nde"],C_PROP,"Proportionnalité et graphique",["proportionnalité","graphique","droite","origine","lecture"],2,function(r){
  var t=rnd(r,0,1),k=pick(r,[1,2,3]);
  if(t===0){var x0=rnd(r,2,5),ok=k*x0,fig={k:"graph",xr:[0,6],yr:[0,6*k],sy:k,ey:k>1?2:1,pts:[[0,0],[6,6*k]],xn:"masse (kg)",yn:"prix (€)",dots:[]};
    return Q(r,"Le graphique donne le prix payé selon la masse achetée. Quel est le prix de "+x0+" kg ?",ok,[[x0/k,"inv"],[ok+k,"lect"],[ok-k,"lect"],[x0,"conf"],[ok+2*k,"lect"],[ok/2,"calc"]],{u:"€",d:2,fig:fig},
      "On part de "+x0+" sur l’axe horizontal, on monte jusqu’à la droite, puis on lit sur l’axe vertical : "+f(ok)+" €.");}
  var c=rnd(r,0,2),fg;
  if(c===0)fg={k:"graph",xr:[0,6],yr:[0,6],pts:[[0,0],[6,6*k/k]]};
  else if(c===1){var b=rnd(r,1,3);fg={k:"graph",xr:[0,6],yr:[0,8],pts:[[0,b],[6,b+6*0.8]]};}
  else fg={k:"graph",xr:[0,6],yr:[0,7],pts:[[0,0],[1,0.2],[2,0.8],[3,1.8],[4,3.2],[5,5],[5.9,7]]};
  var q=VF(r,"Ce graphique représente-t-il une situation de proportionnalité ?",c===0,c===0?"Oui : c’est une droite qui passe par l’origine.":c===1?"Non : c’est une droite, mais elle ne passe pas par l’origine.":"Non : la courbe passe par l’origine mais ce n’est pas une droite.");
  q.fig=fg;q.choices=[{t:"Oui",err:c===0?null:"conf"},{t:"Non",err:c===0?"conf":null}];return q;
});
reg("pct_inverse",["cap","2nde","1re"],C_PROP,"Pourcentages : valeur initiale, taux d’évolution",["pourcentage","prix initial","remise","taux d’évolution","calcul inverse"],3,function(r){
  var t=rnd(r,0,2);
  if(t===0){var p=pick(r,[10,20,25,40,50]),P=pick(r,[40,60,80,120,150,200,250]),F=P*(1-p/100);
    return Q(r,"Après une remise de "+p+" %, un article coûte "+f(F)+" €. Quel était son prix avant la remise ?",P,[[F*(1+p/100),"inv"],[F+p,"addp"],[F/(p/100),"pct0"],[F*(1-p/100),"signe"]],{u:"€",d:2},
      "Prix réduit = prix initial × "+fm(1-p/100)+", donc prix initial = "+M(fm(F)+" \\div "+fm(1-p/100)+" = "+fm(P))+" €. Ajouter "+p+" % au prix réduit ne redonne PAS le prix initial.");}
  if(t===1){var v1=pick(r,[20,40,50,80,120,200,250]),pp=pick(r,[5,10,15,20,25,30,40,60]),up=r()<0.6,v2=v1*(up?1+pp/100:1-pp/100),ok=up?pp:-pp;
    return Q(r,"Un prix passe de "+f(v1)+" € à "+f(v2)+" €. Quel est le taux d’évolution ?",ok,[[rd(v2-v1,2),"conf"],[rd((v2-v1)/v2*100,2),"inv"],[rd(v2/v1*100,2),"conf"],[-ok,"signe"]],{F:sgp,nu:"%",d:2},
      "Taux = "+M("\\dfrac{V_2 - V_1}{V_1} = \\dfrac{"+fm(v2)+" - "+fm(v1)+"}{"+fm(v1)+"} = "+fm(ok/100))+", soit "+sgp(ok)+".");}
  var p2=pick(r,[10,20,25,50]),P2=pick(r,[40,80,120,200]),F2=P2*(1-p2/100);
  return QX(r,"Un article soldé −"+p2+" % coûte "+f(F2)+" €. Jade cherche le prix initial. Où est son erreur ?",
    ["Remise de "+p2+" % : on paie "+(100-p2)+" % du prix.",M("\\text{prix initial} \\times "+fm(1-p2/100)+" = "+fm(F2)),M("\\text{prix initial} = "+fm(F2)+" \\times "+fm(1+p2/100)+" = "+fm(F2*(1+p2/100)))],2,
    "Il faut diviser : "+M(fm(F2)+" \\div "+fm(1-p2/100)+" = "+fm(P2))+" €. Multiplier par "+fm(1+p2/100)+" ne compense pas la baisse.");
});
reg("choix_op",["3pm","cap","2nde"],C_PROP,"Quel calcul faut-il faire ? (choisir l’opération)",["choisir l’opération","problème","modéliser","sens des opérations"],2,function(r){
  var t=rnd(r,0,5);
  if(t===0){var X=pick(r,[40,60,80,120,150]),p=pick(r,[15,20,25,30,35]);
    return Q(r,"Un article à "+X+" € est soldé à −"+p+" %. Quel calcul donne le nouveau prix ?",M(X+" \\times "+fm(1-p/100)),[[M(X+" - "+p),"addp"],[M(X+" \\times "+fm(p/100)),"compl"],[M(X+" \\times "+fm(1+p/100)),"signe"]],{},
      "Baisser de "+p+" %, c’est garder "+(100-p)+" % : on multiplie par "+fm(1-p/100)+". "+M(X+" \\times "+fm(p/100))+" donne le montant de la remise, pas le nouveau prix.");}
  if(t===1){var L=pick(r,[12,18,24,30,36]),n=pick(r,[4,5,6,8]);
    return Q(r,"On coupe un câble de "+L+" m en "+n+" morceaux de même longueur. Quel calcul donne la longueur d’un morceau ?",M(L+" \\div "+n),[[M(L+" \\times "+n),"addp"],[M(n+" \\div "+L),"inv"],[M(L+" - "+n),"addp"]],{},"Partager en parts égales : on divise.");}
  if(t===2){var pr=pick(r,[6,9,12,15]),m=pick(r,[2,3,4]);
    return Q(r,"On paie "+pr+" € pour "+m+" kg de pommes. Quel calcul donne le prix d’un kilogramme ?",M(pr+" \\div "+m),[[M(m+" \\div "+pr),"inv"],[M(pr+" \\times "+m),"addp"],[M(pr+" - "+m),"addp"]],{},"Prix au kg = prix payé ÷ masse.");}
  if(t===3){var v=pick(r,[50,60,80,90]),h=pick(r,[2,3,1.5]);
    return Q(r,"Un camion roule "+fm(h).replace("{,}",",")+" h à "+v+" km/h. Quel calcul donne la distance parcourue ?",M(v+" \\times "+fm(h)),[[M(v+" \\div "+fm(h)),"inv"],[M(fm(h)+" \\div "+v),"inv"],[M(v+" + "+fm(h)),"addp"]],{},"Distance = vitesse × durée.");}
  if(t===4){var C=pick(r,[40,60,80,120]);
    return Q(r,"Un réservoir de "+C+" L est rempli aux "+frM(3,4)+". Quel calcul donne le volume d’essence ?",M(C+" \\div 4 \\times 3"),[[M(C+" \\div 3 \\times 4"),"inv"],[M(C+" - "+frL(3,4)),"addp"],[M(C+" \\div 4"),"demi"]],{},"Prendre les trois quarts : on divise par 4 puis on multiplie par 3.");}
  var N=pick(r,[24,30,36]),P=pick(r,[450,600,750]),n2=pick(r,[6,10,12]);
  return Q(r,"Une recette pour "+n2+" personnes demande "+P+" g de farine. Quel calcul donne la farine pour "+N+" personnes ?",M(P+" \\div "+n2+" \\times "+N),[[M(P+" \\times "+n2+" \\div "+N),"inv"],[M(P+" + "+(N-n2)),"addp"],[M(P+" \\times "+N),"conf"]],{},"On calcule pour 1 personne (÷ "+n2+"), puis pour "+N+" (× "+N+").");
});
var CMP=[["hausse de 20 %","× 1,2"],["baisse de 20 %","× 0,8"],["hausse de 2 %","× 1,02"],["baisse de 2 %","× 0,98"],["hausse de 5 %","× 1,05"],["baisse de 5 %","× 0,95"],["hausse de 50 %","× 1,5"],["baisse de 50 %","× 0,5"],["hausse de 100 %","× 2"],["baisse de 25 %","× 0,75"],["hausse de 25 %","× 1,25"],["baisse de 10 %","× 0,9"],["hausse de 10 %","× 1,1"],["hausse de 1 %","× 1,01"]];
reg("pct_cm_tuiles",["cap","2nde","1re"],C_PROP,"Évolutions et coefficients multiplicateurs (tuiles)",["coefficient multiplicateur","hausse","baisse","tuiles"],2,function(r){
  var p=pick(r,[[0,1,2,3],[4,5,0,3],[2,3,12,11],[6,7,9,10],[11,12,4,5],[8,7,1,13]]);
  if(r()<0.25){var e=CMP[p[0]];return Q(r,"Une "+e[0]+" correspond à un coefficient multiplicateur…",e[1],p.slice(1).map(function(i){return [CMP[i][1],"conf"];}),{},"Hausse de t % : × (1 + t/100) ; baisse de t % : × (1 − t/100).");}
  return QA(r,"Associe chaque évolution à son coefficient multiplicateur.",p.map(function(i){return CMP[i];}),"Hausse de t % : × (1 + t/100). Baisse de t % : × (1 − t/100). Attention : + 2 % donne × 1,02 et non × 1,2.");
});
reg("pct_estim",["cap","2nde"],C_PROP,"Estimer un pourcentage (curseur)",["pourcentage","estimation","ordre de grandeur","curseur"],2,function(r){
  var p=pick(r,[9,11,19,21,24,26,31,49,51,74]),v=rnd(r,18,92)*10+rnd(r,1,9),ok=v*p/100,P=Math.round(p/5)*5,V=Math.round(v/50)*50;
  return QE(r,"Estime "+p+" % de "+f(v)+" €.",ok,{u:"€"},"On arrondit : "+P+" % de "+f(V)+" = "+f(V*P/100)+" €. Valeur exacte : "+f(ok)+" €.");
});
reg("heures_dec",["3pm","cap","2nde"],C_PROP,"Heures décimales, durées et vitesses (m/s, km/h)",["durée","heure décimale","base 60","km/h","m/s"],2,function(r){
  var t=rnd(r,0,3),H=function(h,m){return h+" h "+(m<10?"0":"")+m+" min";};
  if(t===0){var x=pick(r,[0.25,0.5,0.75,0.2,0.1,1.5,1.75,2.25,0.4,2.6,1.2,3.25]),h=Math.floor(x),m=Math.round((x-h)*60),dec=Math.round((x-h)*100);
    return Q(r,"Convertir "+f(x)+" h en heures et minutes.",H(h,m),[[H(h,dec),"base"],[H(h,Math.round((x-h)*10)),"base"],[H(h,(m+15)%60),"calc"]],{},
      f(x-h)+" h = "+M(fm(x-h)+" \\times 60 = "+m)+" min, donc "+f(x)+" h = "+H(h,m)+".");}
  if(t===1){var h2=rnd(r,1,3),m2=pick(r,[15,30,45,12,6,24,36,48]),ok=h2+m2/60;
    return Q(r,"Convertir "+H(h2,m2)+" en heures décimales.",ok,[[h2+m2/100,"base"],[h2+m2/10,"base"],[h2+60/m2/10,"inv"],[ok+0.1,"calc"]],{u:"h",d:2},
      m2+" min = "+M("\\dfrac{"+m2+"}{60} = "+fm(m2/60))+" h, donc "+f(ok)+" h.");}
  if(t===2){var v=pick(r,[36,54,72,90,108,18]),ok2=v/3.6;
    return Q(r,"Convertir "+v+" km/h en m/s.",ok2,[[v*3.6,"inv"],[v/60,"base"],[v/10,"unit"],[v/36,"unit"]],{u:"m/s",d:2},
      M(v+" \\text{ km/h} = \\dfrac{"+v+"\\,000 \\text{ m}}{3\\,600 \\text{ s}} = "+fm(ok2))+" m/s (on divise par 3,6).");}
  var d=pick(r,[[14,45,1,35],[8,50,2,20],[9,40,1,45],[16,35,2,40],[11,25,3,50]]),tot=d[0]*60+d[1]+d[2]*60+d[3];
  return Q(r,"Un trajet commence à "+d[0]+" h "+d[1]+" et dure "+d[2]+" h "+d[3]+" min. À quelle heure arrive-t-on ?",Math.floor(tot/60)+" h "+(tot%60<10?"0":"")+tot%60,
    [[(d[0]+d[2])+" h "+(d[1]+d[3]),"base"],[(d[0]+d[2])+" h "+(tot%60<10?"0":"")+tot%60,"calc"],[Math.floor(tot/60)+" h "+((tot%60+40)%60<10?"0":"")+(tot%60+40)%60,"calc"]],{},
    d[1]+" min + "+d[3]+" min = "+(d[1]+d[3])+" min = 1 h "+((d[1]+d[3])-60)+" min. On arrive à "+Math.floor(tot/60)+" h "+(tot%60<10?"0":"")+tot%60+".");
});

/* ═════════ GRANDEURS, MESURES ET VOLUMES ═════════ */
reg("conv_aire_vol",["cap","2nde"],C_GRAN,"Conversions d’aires, de volumes et de contenances",["conversion","aire","volume","m²","m³","litre"],2,function(r){
  var t=rnd(r,0,3);
  if(t===0){var c=pick(r,[{f:"m²",t:"cm²",k:10000,V:[0.5,1.2,2,3.5]},{f:"m²",t:"dm²",k:100,V:[0.4,1.5,2.5,12]},{f:"cm²",t:"m²",k:0.0001,V:[2500,5000,15000,800]},{f:"km²",t:"ha",k:100,V:[0.5,2,3.2]},{f:"ha",t:"m²",k:10000,V:[0.5,1.5,2,3]}]),v=pick(r,c.V),ok=v*c.k;
    var tab=c.k>=1?Math.sqrt(c.k):1/Math.sqrt(1/c.k);
    return Q(r,"Convertir "+f(v,4)+" "+c.f+" en "+c.t+".",ok,[[v*tab,"unit"],[v*c.k*10,"unit"],[v*c.k/10,"unit"],[v/c.k,"inv"]],{u:c.t,d:6,far:4},
      "Pour les aires, chaque unité vaut 100 fois la suivante : 1 "+c.f+" = "+f(c.k,6)+" "+c.t+", donc "+f(v,4)+" "+c.f+" = "+f(ok,6)+" "+c.t+".");}
  if(t===1){var c2=pick(r,[{f:"m³",t:"L",k:1000,V:[0.5,1.2,2.5,0.75,3]},{f:"dm³",t:"L",k:1,V:[2.5,12,0.8,45]},{f:"cm³",t:"L",k:0.001,V:[350,750,1500,250]},{f:"cm³",t:"mL",k:1,V:[33,250,500,75]},{f:"L",t:"m³",k:0.001,V:[500,1500,250,12000]}]),v2=pick(r,c2.V),ok2=v2*c2.k;
    return Q(r,"Convertir "+f(v2,4)+" "+c2.f+" en "+c2.t+".",ok2,[[ok2*10,"unit"],[ok2/10,"unit"],[ok2*100,"unit"],[ok2/100,"unit"]],{u:c2.t,d:6,far:4},
      "À retenir : 1 dm³ = 1 L, 1 cm³ = 1 mL, 1 m³ = 1 000 L. Donc "+f(v2,4)+" "+c2.f+" = "+f(ok2,6)+" "+c2.t+".");}
  if(t===2)return QA(r,"Associe les mesures égales.",pickN(r,[["1 L","1 dm³"],["1 mL","1 cm³"],["1 m³","1 000 L"],["1 hL","100 L"],["1 cL","10 mL"],["1 m²","10 000 cm²"],["1 ha","10 000 m²"],["1 dm²","100 cm²"]],4),
    "Contenances : 1 L = 1 dm³ ; 1 mL = 1 cm³ ; 1 m³ = 1 000 L. Aires : 1 m² = 100 dm² = 10 000 cm².");
  var it=[["25 cL",0.25],["0,3 L",0.3],["350 mL",0.35],["0,04 m³",40],["1,5 dm³",1.5]],s=pickN(r,it,4).sort(function(a,b){return a[1]-b[1];});
  return QO(r,"Range ces contenances de la plus petite à la plus grande.",s.map(function(x){return x[0];}),"En litres : "+s.map(function(x){return x[0]+" = "+f(x[1],3)+" L";}).join(" ; ")+".",{how:"de la plus petite à la plus grande",sep:" < "});
});
var REAL=[["la masse d’une voiture","1,2 t",["1,2 kg","120 g","12 t"]],["la hauteur d’une porte","2 m",["2 cm","20 m","2 km"]],["la contenance d’une bouteille d’eau","1,5 L",["1,5 mL","15 L","150 L"]],["l’aire d’une chambre","12 m²",["12 cm²","1 200 m²","12 km²"]],["la masse d’un smartphone","180 g",["180 kg","18 mg","1,8 kg"]],["l’épaisseur d’une pièce de 1 €","2 mm",["2 cm","2 m","20 cm"]],["la contenance d’une baignoire","200 L",["200 mL","20 L","2 m³"]],["la distance Dijon – Paris","310 km",["310 m","3 100 km","31 km"]],["la masse d’un sac de ciment","35 kg",["35 g","350 kg","3,5 t"]],["la longueur d’un stylo","14 cm",["14 mm","1,4 m","14 m"]],["la durée d’un cours","55 min",["55 s","5,5 h","550 min"]],["l’aire d’un terrain de foot","7 000 m²",["70 m²","7 000 cm²","7 km²"]]];
reg("unite_adaptee",["3pm","cap"],C_GRAN,"Unité adaptée et ordre de grandeur (vraisemblance)",["unité","ordre de grandeur","vraisemblance","cohérence"],1,function(r){
  var e=pick(r,REAL);
  if(r()<0.7)return Q(r,"Quelle est la valeur la plus vraisemblable pour "+e[0]+" ?",e[1],e[2].map(function(w){return [w,"unit"];}),{},"Ordre de grandeur réaliste : "+e[0]+" ≈ "+e[1]+". Vérifier que le résultat est cohérent avec la réalité !");
  var w=pick(r,e[2]),bon=r()<0.4;
  var q=VF(r,"Un élève trouve que "+e[0]+" vaut "+(bon?e[1]:w)+". Ce résultat est-il vraisemblable ?",bon,(bon?"Oui":"Non")+" : "+e[0]+" vaut environ "+e[1]+".");
  q.choices=[{t:"Oui",err:bon?null:"grand"},{t:"Non",err:bon?"grand":null}];return q;
});
reg("perim_cercle",["3pm","cap","2nde"],C_GRAN,"Périmètre d’un cercle, aire d’un disque (figure)",["cercle","périmètre","disque","π","figure"],2,function(r){
  var t=rnd(r,0,2),R=pick(r,[2,3,4,5,6,10]);
  if(t===0){var ok=2*3.14*R;return Q(r,"Quel est le périmètre de ce cercle ? ("+M("\\pi \\approx 3{,}14")+")",ok,[[3.14*R,"demi"],[3.14*R*R,"formule"],[2*3.14*2*R,"conf"],[2*R*3,"arr"],[2*R+3.14,"addp"]],{u:"cm",d:2,fig:{k:"disc",r:R+" cm"}},
    M("\\mathcal{P} = 2 \\pi r = 2 \\times 3{,}14 \\times "+R+" = "+fm(ok))+" cm.");}
  if(t===1){var D=2*R,ok2=3.14*R*R;return Q(r,"Quelle est l’aire de ce disque ? ("+M("\\pi \\approx 3{,}14")+")",ok2,[[3.14*D*D,"demi"],[3.14*D,"formule"],[2*3.14*R,"formule"],[3.14*R*2,"formule"]],{u:"cm²",d:2,fig:{k:"disc",d:D+" cm"}},
    "Le rayon vaut "+D+" ÷ 2 = "+R+" cm. "+M("\\mathcal{A} = \\pi r^2 = 3{,}14 \\times "+R+"^2 = "+fm(ok2))+" cm².");}
  return QA(r,"Associe chaque formule à ce qu’elle calcule.",pickN(r,[[M("2 \\pi r"),"périmètre du cercle"],[M("\\pi r^2"),"aire du disque"],[M("L \\times \\ell"),"aire du rectangle"],[M("2(L + \\ell)"),"périmètre du rectangle"],[M("\\dfrac{b \\times h}{2}"),"aire du triangle"],[M("c^2"),"aire du carré"],[M("4c"),"périmètre du carré"]],4),"Périmètre : une longueur (en cm). Aire : une surface (en cm²).");
});
reg("vol_estim",["cap","2nde","1re"],C_GRAN,"Volumes et contenances en situation (estimation)",["volume","contenance","litre","pavé","cylindre","estimation"],3,function(r){
  var t=rnd(r,0,2);
  if(t===0){var L=pick(r,[1.2,1.5,2,0.8]),l=pick(r,[0.5,0.6,0.8,1]),h=pick(r,[0.4,0.5,0.6]),ok=L*l*h*1000;
    return QE(r,"Une cuve mesure "+f(L)+" m × "+f(l)+" m × "+f(h)+" m. Estime sa contenance en litres.",ok,{u:"L",fig:{k:"pave",L:f(L)+" m",l:f(l)+" m",h:f(h)+" m"}},
      M("V = "+fm(L)+" \\times "+fm(l)+" \\times "+fm(h)+" = "+fm(L*l*h,3))+" m³, et 1 m³ = 1 000 L : "+f(ok)+" L.");}
  if(t===1){var R=pick(r,[3,4,5,6]),H=pick(r,[10,12,15,20]),ok2=3.14*R*R*H/1000;
    return QE(r,"Une boîte cylindrique a un rayon de "+R+" cm et une hauteur de "+H+" cm. Estime sa contenance en litres.",ok2,{u:"L",fig:{k:"cyl",r:R+" cm",h:H+" cm"}},
      M("V = \\pi r^2 h \\approx 3{,}14 \\times "+R+"^2 \\times "+H+" \\approx "+fm(ok2*1000,0))+" cm³, soit environ "+f(ok2,2)+" L (1 L = 1 000 cm³).");}
  var c=pick(r,[60,80,100,120]),d=pick(r,[40,50,60]),e=pick(r,[30,40,50]),ok3=c*d*e/1000;
  return Q(r,"Un aquarium mesure "+c+" cm × "+d+" cm × "+e+" cm. Quelle est sa contenance ?",ok3,[[c*d*e,"unit"],[ok3*10,"unit"],[ok3/10,"unit"],[(c+d+e)/10,"addp"]],{u:"L",d:2,fig:{k:"pave",L:c+" cm",l:d+" cm",h:e+" cm"},far:2},
    M("V = "+c+" \\times "+d+" \\times "+e+" = "+fm(c*d*e))+" cm³ = "+f(ok3)+" L (1 L = 1 000 cm³).");
});
reg("grandeurs_comp",["cap","2nde"],C_GRAN,"Grandeurs composées : consommation, débit, rendement",["consommation","débit","rendement","L/100 km","grandeur quotient"],2,function(r){
  var t=rnd(r,0,2);
  if(t===0){var c=pick(r,[5,6,6.5,7,8]),d=pick(r,[150,250,340,400,520]),ok=c*d/100;
    return Q(r,"Une voiture consomme "+f(c)+" L aux 100 km. Combien consomme-t-elle pour "+d+" km ?",ok,[[c*d,"unit"],[d/c,"inv"],[c*d/10,"unit"],[c+d/100,"addp"]],{u:"L",d:2},
      M(fm(c)+" \\times \\dfrac{"+d+"}{100} = "+fm(ok))+" L.");}
  if(t===1){var V=pick(r,[120,180,240,300,600]),deb=pick(r,[12,15,20,30]),ok2=V/deb;
    return Q(r,"Un robinet débite "+deb+" L par minute. Combien de temps faut-il pour remplir une cuve de "+V+" L ?",ok2,[[V*deb,"inv"],[deb/V,"inv"],[V-deb,"addp"],[ok2*60,"base"]],{u:"min",d:2,far:2},
      "Durée = volume ÷ débit : "+M(V+" \\div "+deb+" = "+fm(ok2))+" min.");}
  var S=pick(r,[24,36,45,60,80]),rd2=pick(r,[8,10,12]),n=2,ok3=S*n/rd2;
  return Q(r,"Une peinture couvre "+rd2+" m² par litre. On passe "+n+" couches sur un mur de "+S+" m². Quelle quantité de peinture faut-il ?",ok3,[[S/rd2,"demi"],[S*rd2*n,"inv"],[S*n,"conf"],[rd2*n,"conf"]],{u:"L",d:2},
    "Surface à peindre : "+M(S+" \\times "+n+" = "+S*n)+" m². Peinture : "+M(S*n+" \\div "+rd2+" = "+fm(ok3))+" L.");
});

/* ═════════ GÉOMÉTRIE ═════════ */
var NOMS=[["B","A","C"],["E","D","F"],["S","R","T"],["N","M","P"],["J","I","K"],["H","G","L"]];
reg("pyth_fig",["3pm","cap","2nde"],C_GEO,"Pythagore avec une figure : égalité, calcul, estimation",["pythagore","hypoténuse","figure","égalité","estimation"],2,function(r){
  var n=pick(r,NOMS),R=n[0],A=n[1],C=n[2],t=rnd(r,0,3);   /* angle droit en n[0], sommet du haut n[1], sommet de droite n[2] */
  var tri=function(a,b,c){return {k:"tri",a:a,b:b,c:c,n:n};};
  if(t===0){var S=function(x){return x.split("").sort().join("");};var AC=S(A+C),AR=S(A+R),RC=S(R+C);
    return Q(r,"Le triangle "+A+R+C+" est rectangle en "+R+". Quelle égalité est vraie ?",M(AC+"^2 = "+AR+"^2 + "+RC+"^2"),[[M(AR+"^2 = "+AC+"^2 + "+RC+"^2"),"conf"],[M(RC+"^2 = "+AR+"^2 + "+AC+"^2"),"conf"],[M(AC+" = "+AR+" + "+RC),"formule"]],{fig:tri("","","")},
      "L’hypoténuse est le côté opposé à l’angle droit : ["+AC+"]. Donc "+M(AC+"^2 = "+AR+"^2 + "+RC+"^2")+".");}
  var tp=pick(r,TRIP);
  if(t===1){var a=tp[0],b=tp[1],c=tp[2];
    return Q(r,"Calculer la longueur de l’hypoténuse.",c,[[a+b,"formule"],[a*a+b*b,"formule"],[Math.round(Math.sqrt(b*b-a*a)*10)/10,"signe"],[c+1,"calc"]],{u:"cm",d:1,fig:tri(a+" cm",b+" cm","?")},
      M("c^2 = "+a+"^2 + "+b+"^2 = "+(a*a+b*b))+", donc "+M("c = \\sqrt{"+(a*a+b*b)+"} = "+c)+" cm.");}
  if(t===2){var a2=tp[0],c2=tp[2],b2=tp[1];
    return Q(r,"Calculer la longueur marquée « ? ».",b2,[[Math.round(Math.sqrt(a2*a2+c2*c2)*10)/10,"signe"],[c2-a2,"formule"],[c2*c2-a2*a2,"formule"],[c2+a2,"formule"]],{u:"cm",d:1,fig:tri(a2+" cm","?",c2+" cm")},
      "On connaît l’hypoténuse : on soustrait. "+M("? ^2 = "+c2+"^2 - "+a2+"^2 = "+(c2*c2-a2*a2))+", donc "+M("? = "+b2)+" cm.");}
  var x=rnd(r,3,9),y=rnd(r,4,12),h=Math.sqrt(x*x+y*y);if(Math.abs(h-Math.round(h))<0.05)return null;
  return QE(r,"Estime la longueur de l’hypoténuse avec le curseur.",h,{u:"cm",min:0,max:Math.ceil((x+y+2)/5)*5,tol:Math.max(0.3,(Math.ceil((x+y+2)/5)*5)*0.03),fig:tri(x+" cm",y+" cm","?")},
    M("\\sqrt{"+x+"^2 + "+y+"^2} = \\sqrt{"+(x*x+y*y)+"} \\approx "+fm(h,2))+" cm. Repère : l’hypoténuse est plus longue que "+Math.max(x,y)+" cm mais plus courte que "+(x+y)+" cm.");
});
reg("pyth_recip",["cap","2nde"],C_GEO,"Le triangle est-il rectangle ? (réciproque)",["pythagore","réciproque","triangle rectangle","vérifier"],2,function(r){
  var ok=r()<0.5,tp=ok?pick(r,TRIP):pick(r,[[4,5,7],[5,6,8],[6,7,9],[3,5,6],[7,8,11],[5,9,10],[6,8,11]]),a=tp[0],b=tp[1],c=tp[2];
  if(r()<0.35)return Q(r,"Un triangle a pour côtés "+a+" cm, "+b+" cm et "+c+" cm. Que faut-il comparer pour savoir s’il est rectangle ?",M(c+"^2")+" et "+M(a+"^2 + "+b+"^2"),[[M(c)+" et "+M(a+" + "+b),"formule"],[M(a+"^2")+" et "+M(b+"^2 + "+c+"^2"),"conf"],[M(c+"^2")+" et "+M("("+a+" + "+b+")^2"),"formule"]],{},
    "On compare le carré du plus grand côté avec la somme des carrés des deux autres.");
  var q=VF(r,"Un triangle a pour côtés "+a+" cm, "+b+" cm et "+c+" cm. Est-il rectangle ?",ok,M(c+"^2 = "+c*c)+" et "+M(a+"^2 + "+b+"^2 = "+(a*a+b*b))+" : "+(ok?"égalité, donc il est rectangle (réciproque de Pythagore).":"pas d’égalité, donc il n’est pas rectangle."));
  q.choices=[{t:"Oui",err:ok?null:"calc"},{t:"Non",err:ok?"calc":null}];return q;
});
reg("angles_tri",["3pm","cap"],C_GEO,"Somme des angles d’un triangle",["angles","triangle","180°","isocèle","figure"],1,function(r){
  var t=rnd(r,0,1);
  if(t===0){var a=rnd(r,3,9)*10,b=rnd(r,2,8)*10;if(a+b>=170)return null;var ok=180-a-b;
    return Q(r,"Quelle est la mesure de l’angle marqué « ? » ?",ok,[[360-a-b,"conf"],[a+b,"calc"],[90-Math.abs(a-b),"conf"],[ok+10,"calc"]],{u:"°",d:0,pos:true,fig:{k:"angtri",a:a+"°",b:b+"°",c:"?"}},
      "La somme des angles d’un triangle vaut 180° : "+M("180 - "+a+" - "+b+" = "+ok)+"°.");}
  var s=pick(r,[20,30,40,50,80,100]),base=(180-s)/2;
  return Q(r,"Un triangle isocèle a un angle au sommet de "+s+"°. Combien mesure chacun des deux autres angles ?",base,[[180-s,"demi"],[s,"conf"],[90-s/2+10,"calc"],[(360-s)/2,"conf"]],{u:"°",d:1,pos:true},
    "Les deux angles à la base sont égaux : "+M("(180 - "+s+") \\div 2 = "+fm(base))+"°.");
});
reg("thales",["cap","2nde"],C_GEO,"Thalès : calculer une longueur (figure)",["thalès","parallèles","proportionnalité","longueur"],3,function(r){
  var k=pick(r,[[2,3],[3,5],[1,2],[2,5],[3,4],[1,3]]),AB=k[1]*rnd(r,2,4),AM=AB*k[0]/k[1],MB=AB-AM,BC=k[1]*rnd(r,2,5),MN=BC*AM/AB;
  if(r()<0.7)return Q(r,"Les droites (MN) et (BC) sont parallèles. Calculer MN.",MN,[[BC*AM/MB,"conf"],[BC*AB/AM,"inv"],[BC-MB,"addp"],[MN+1,"calc"]],{u:"cm",d:2,fig:{k:"thales",L:{AM:f(AM)+" cm",MB:f(MB)+" cm",BC:f(BC)+" cm",MN:"?"}}},
    "Thalès : "+M("\\dfrac{AM}{AB} = \\dfrac{MN}{BC}")+" avec AB = "+f(AM)+" + "+f(MB)+" = "+f(AB)+" cm. Donc "+M("MN = "+fm(BC)+" \\times \\dfrac{"+fm(AM)+"}{"+fm(AB)+"} = "+fm(MN))+" cm. Attention : on utilise AB, pas MB !");
  return Q(r,"Les droites (MN) et (BC) sont parallèles. Quelle égalité est vraie ?",M("\\dfrac{AM}{AB} = \\dfrac{MN}{BC}"),[[M("\\dfrac{AM}{MB} = \\dfrac{MN}{BC}"),"conf"],[M("\\dfrac{AM}{AB} = \\dfrac{BC}{MN}"),"inv"],[M("\\dfrac{AB}{AM} = \\dfrac{MN}{BC}"),"inv"]],{fig:{k:"thales",L:{}}},
    "On compare les longueurs du petit triangle AMN à celles du grand triangle ABC, dans le même ordre : "+M("\\dfrac{AM}{AB} = \\dfrac{AN}{AC} = \\dfrac{MN}{BC}")+".");
});
reg("trigo_fig",["2nde","1re"],C_GEO,"Trigonométrie avec une figure : quelle relation ? quelle longueur ?",["cosinus","sinus","tangente","figure","angle"],2,function(r){
  var cas=pick(r,[{kn:"c",un:"b",ok:"cos"},{kn:"c",un:"a",ok:"sin"},{kn:"b",un:"a",ok:"tan"},{kn:"b",un:"c",ok:"cos"},{kn:"a",un:"c",ok:"sin"},{kn:"a",un:"b",ok:"tan"}]);
  var val=rnd(r,4,15),fg={k:"tri",ang:"α",a:"",b:"",c:""};fg[cas.kn]=val+" cm";fg[cas.un]="?";
  var S={cos:M("\\cos\\alpha = \\dfrac{\\text{adjacent}}{\\text{hypoténuse}}"),sin:M("\\sin\\alpha = \\dfrac{\\text{opposé}}{\\text{hypoténuse}}"),tan:M("\\tan\\alpha = \\dfrac{\\text{opposé}}{\\text{adjacent}}")};
  if(r()<0.6){var oth=["cos","sin","tan"].filter(function(x){return x!==cas.ok;});
    return Q(r,"On connaît l’angle α et la longueur indiquée. Quelle relation permet de calculer « ? » ?",S[cas.ok],[[S[oth[0]],"conf"],[S[oth[1]],"conf"],[M("a^2 + b^2 = c^2"),"formule"]],{fig:fg},
      "Par rapport à α : le côté vertical est opposé, le côté horizontal est adjacent, le plus long est l’hypoténuse. "+S[cas.ok]+".");}
  var hyp=pick(r,[10,12,20,8]),ang=pick(r,[30,60]),opp=hyp*(ang===30?0.5:0.866),fg2={k:"tri",ang:ang+"°",a:"?",b:"",c:hyp+" cm"};
  return Q(r,"Calculer la longueur « ? » (arrondie au dixième). On donne "+M("\\sin "+ang+"^\\circ \\approx "+(ang===30?"0{,}5":"0{,}866")),rd(opp,1),[[rd(hyp/(ang===30?0.5:0.866),1),"inv"],[rd(hyp*(ang===30?0.866:0.5),1),"conf"],[rd(hyp-(ang===30?0.5:0.866),1),"addp"]],{u:"cm",d:1,fig:fg2},
    M("\\sin "+ang+"^\\circ = \\dfrac{?}{"+hyp+"}")+", donc "+M("? = "+hyp+" \\times \\sin "+ang+"^\\circ \\approx "+fm(rd(opp,1)))+" cm.");
});
reg("repere",["3pm","cap","2nde"],C_GEO,"Lire les coordonnées d’un point dans un repère",["repère","coordonnées","abscisse","ordonnée","lecture"],1,function(r){
  var pts=[],us={},names=["A","B","C"];
  while(pts.length<3){var x=rnd(r,-4,4),y=rnd(r,-3,3);if(us[x+"|"+y]||x===y||x===0&&y===0)continue;us[x+"|"+y]=1;pts.push([x,y,names[pts.length]]);}
  var i=rnd(r,0,2),p=pts[i],C=function(a,b){return M("("+fm(a,0)+"\\,;\\,"+fm(b,0)+")");};
  var fig={k:"graph",xr:[-5,5],yr:[-4,4],dots:pts};
  return Q(r,"Quelles sont les coordonnées du point "+p[2]+" ?",C(p[0],p[1]),[[C(p[1],p[0]),"inv"],[C(-p[0],p[1]),"signe"],[C(p[0],-p[1]),"signe"],[C(p[0]+1,p[1]),"lect"]],{fig:fig},
    "On lit d’abord l’abscisse (axe horizontal), puis l’ordonnée (axe vertical) : "+p[2]+C(p[0],p[1])+".");
});

/* ═════════ STATISTIQUES ═════════ */
var DIAG=[{t:"ventes de croissants",x:["lun","mar","mer","jeu","ven"],g:10,u:"croissants"},{t:"colis livrés",x:["S1","S2","S3","S4","S5"],g:20,u:"colis"},{t:"clients du salon",x:["mar","mer","jeu","ven","sam"],g:5,u:"clients"},{t:"interventions",x:["jan","fév","mar","avr","mai"],g:2,u:"interventions"},{t:"élèves présents",x:["L","M","Me","J","V"],g:4,u:"élèves"}];
reg("lecture_diag",["3pm","cap","2nde"],C_STAT,"Lire et exploiter un diagramme en barres",["diagramme","lecture graphique","effectif","étendue","maximum"],1,function(r){
  var d=pick(r,DIAG),ys=d.x.map(function(){return d.g*rnd(r,2,9);}),fig={k:"bars",x:d.x,y:ys,u:d.u},t=rnd(r,0,2),i=rnd(r,0,4),mx=Math.max.apply(null,ys),mn=Math.min.apply(null,ys);
  if(t===0)return Q(r,"Combien y a-t-il eu de "+d.u+" pour « "+d.x[i]+" » ?",ys[i],[[ys[(i+1)%5],"lect"],[ys[i]+d.g,"lect"],[ys[i]-d.g,"lect"],[ys[i]/d.g,"lect"]],{d:0,fig:fig,pos:true},
    "On lit le haut de la barre « "+d.x[i]+" » sur l’axe vertical (une graduation = "+d.g+") : "+ys[i]+".");
  if(t===1){if(ys.filter(function(y){return y===mx;}).length>1)return null;var im=ys.indexOf(mx);
    return Q(r,"Pour quelle catégorie y a-t-il eu le plus de "+d.u+" ?","« "+d.x[im]+" »",d.x.filter(function(x,j){return j!==im;}).slice(0,3).map(function(x){return ["« "+x+" »","lect"];}),{fig:fig},"La barre la plus haute est « "+d.x[im]+" » ("+mx+").");}
  if(mx===mn)return null;
  return Q(r,"Quelle est l’étendue de cette série ?",mx-mn,[[mx,"conf"],[mx+mn,"signe"],[(mx-mn)/d.g,"lect"],[mx-mn+d.g,"lect"]],{d:0,fig:fig,pos:true},"Étendue = plus grande valeur − plus petite = "+M(mx+" - "+mn+" = "+(mx-mn))+".");
});
reg("stats_tab",["cap","2nde","1re"],C_STAT,"Effectifs et fréquences dans un tableau",["tableau","effectif","fréquence","moyenne pondérée","total"],2,function(r){
  var t=rnd(r,0,2);
  if(t<2){var cat=pick(r,[["Bus","Voiture","Vélo","À pied"],["CAP","2nde","1re","Tle"],["0 h","1 h","2 h","3 h"]]),n=cat.map(function(){return rnd(r,1,9)*2;}),N=n.reduce(function(a,b){return a+b;},0),i=rnd(r,0,3);
    if(N%5)n[3]+=5-N%5;N=n.reduce(function(a,b){return a+b;},0);
    var fig={k:"tab",hc:1,rows:[["Catégorie"].concat(cat),["Effectif"].concat(n.map(String))]};
    if(t===0)return Q(r,"Quel est l’effectif total ?",N,[[n.reduce(function(a,b){return Math.max(a,b);},0),"conf"],[N/4,"conf"],[N-n[3],"calc"],[N+n[0],"calc"]],{d:0,fig:fig},"On additionne les effectifs : "+n.join(" + ")+" = "+N+".");
    var ok=n[i]/N*100;
    return Q(r,"Quelle est la fréquence de « "+cat[i]+" » (en %) ?",ok,[[n[i],"conf"],[n[i]/N,"pct0"],[N/n[i],"inv"],[(N-n[i])/N*100,"compl"]],{u:"%",d:2,fig:fig},"Fréquence = effectif ÷ effectif total = "+M(n[i]+" \\div "+N+" = "+fm(n[i]/N,4))+", soit "+f(ok)+" %.");}
  var vals=[0,1,2,3],eff=vals.map(function(){return rnd(r,1,8);}),Ne=eff.reduce(function(a,b){return a+b;},0),S=vals.reduce(function(s,v,i){return s+v*eff[i];},0),moy=S/Ne;
  var fig2={k:"tab",hc:1,rows:[["Nombre d’enfants"].concat(vals.map(String)),["Effectif"].concat(eff.map(String))]};
  return Q(r,"Quelle est la moyenne du nombre d’enfants (arrondie au centième) ?",rd(moy,2),[[1.5,"conf"],[rd(S/4,2),"formule"],[rd(Ne/4,2),"conf"],[rd(S/(Ne+1),2),"calc"]],{d:2,fig:fig2},
    "Moyenne pondérée : "+M("\\dfrac{"+vals.map(function(v,i){return v+" \\times "+eff[i];}).join(" + ")+"}{"+Ne+"} = \\dfrac{"+S+"}{"+Ne+"} \\approx "+fm(moy,2))+".");
});
reg("moy_ponderee",["cap","2nde"],C_STAT,"Moyenne pondérée (coefficients)",["moyenne pondérée","coefficient","notes"],2,function(r){
  var n=[rnd(r,6,18),rnd(r,6,18),rnd(r,6,18)],c=pickN(r,[1,2,3,4],3),S=n[0]*c[0]+n[1]*c[1]+n[2]*c[2],C=c[0]+c[1]+c[2],ok=S/C,simple=(n[0]+n[1]+n[2])/3;
  if(Math.abs(ok-simple)<0.2)return null;
  return Q(r,"Notes : "+n[0]+" (coef. "+c[0]+"), "+n[1]+" (coef. "+c[1]+"), "+n[2]+" (coef. "+c[2]+"). Quelle est la moyenne (arrondie au dixième) ?",rd(ok,1),[[rd(simple,1),"conf"],[rd(S/3,1),"formule"],[rd(S/(C+1),1),"calc"],[rd((n[0]+n[1]+n[2])/C,1),"formule"]],{d:1},
    M("\\dfrac{"+n[0]+" \\times "+c[0]+" + "+n[1]+" \\times "+c[1]+" + "+n[2]+" \\times "+c[2]+"}{"+c[0]+" + "+c[1]+" + "+c[2]+"} = \\dfrac{"+S+"}{"+C+"} \\approx "+fm(ok,1))+". On divise par la somme des coefficients.");
});

/* ═════════ ÉQUATIONS ET CALCUL LITTÉRAL ═════════ */
reg("eq_traduire",["cap","2nde"],C_EQ,"Traduire un énoncé par une équation",["équation","mettre en équation","modéliser","problème"],2,function(r){
  var t=rnd(r,0,3),a=rnd(r,2,5),b=rnd(r,2,9),x=rnd(r,3,12);
  if(t===0){var c=a*x+b,nm=["le double","le triple","le quadruple","le quintuple"][a-2];
    return Q(r,"On multiplie un nombre "+M("x")+" par "+a+", puis on ajoute "+b+" : on obtient "+c+". Quelle équation traduit cette phrase ?",M(a+"x + "+b+" = "+c),[[M(a+"(x + "+b+") = "+c),"ordre"],[M("x + "+a+" + "+b+" = "+c),"addp"],[M(a+"x = "+c+" + "+b),"signe"]],{},
      "« multiplier par "+a+" » : "+M(a+"x")+" ; « puis ajouter "+b+" » : "+M(a+"x + "+b)+". Cela s’appelle aussi "+nm+" de x augmenté de "+b+".");}
  if(t===1){var c2=a*(x+b);
    return Q(r,"On ajoute "+b+" à un nombre "+M("x")+", puis on multiplie le résultat par "+a+" : on obtient "+c2+". Quelle équation traduit cette phrase ?",M(a+"(x + "+b+") = "+c2),[[M(a+"x + "+b+" = "+c2),"ordre"],[M("x + "+b+" \\times "+a+" = "+c2),"ordre"],[M(a+" + x + "+b+" = "+c2),"addp"]],{},
      "On ajoute d’abord : "+M("x + "+b)+", puis on multiplie TOUT par "+a+" : parenthèses obligatoires.");}
  if(t===2){var F=pick(r,[10,15,20,25]),h=pick(r,[3,4,5,6]),tot=F+h*x;
    return Q(r,"Une location coûte "+F+" € de frais fixes, plus "+h+" € par heure. On a payé "+tot+" €. Quelle équation permet de trouver la durée "+M("x")+" (en heures) ?",M(h+"x + "+F+" = "+tot),[[M(F+"x + "+h+" = "+tot),"inv"],[M(h+"(x + "+F+") = "+tot),"ordre"],[M(h+"x = "+tot+" + "+F),"signe"]],{},
      "Prix payé = frais fixes + prix par heure × nombre d’heures : "+M(F+" + "+h+"x = "+tot)+".");}
  var p=pick(r,[2,3]),age=rnd(r,8,14),sum=age+p*age;
  return Q(r,"Léo a "+M("x")+" ans. Sa mère a "+p+" fois son âge. Ensemble, ils ont "+sum+" ans. Quelle équation traduit la situation ?",M("x + "+p+"x = "+sum),[[M("x + "+p+" = "+sum),"addp"],[M(p+"x = "+sum),"demi"],[M("x \\times "+p+"x = "+sum),"addp"]],{},
    "Âge de Léo : "+M("x")+" ; âge de sa mère : "+M(p+"x")+" ; somme : "+M("x + "+p+"x = "+sum)+".");
});
reg("eq_err",["cap","2nde"],C_EQ,"Trouver l’erreur dans la résolution d’une équation",["équation","erreur","étapes","résoudre"],2,function(r){
  var a=rnd(r,2,6),b=rnd(r,2,15),x=rnd(r,2,9),c=a*x+b,bad=rnd(r,0,2);
  var st=[M(a+"x = "+c+" - "+b),M(a+"x = "+(c-b)),M("x = \\dfrac{"+(c-b)+"}{"+a+"} = "+x)];
  if(bad===0){st[0]=M(a+"x = "+c+" + "+b);st[1]=M(a+"x = "+(c+b));st[2]=M("x = \\dfrac{"+(c+b)+"}{"+a+"} \\approx "+fm(rd((c+b)/a,2)));}
  if(bad===1){var v1=c-b+(r()<0.5?1:-1)*rnd(r,1,3);st[1]=M(a+"x = "+v1);st[2]=M("x = \\dfrac{"+v1+"}{"+a+"}");}
  if(bad===2){st[2]=M("x = "+(c-b)+" - "+a+" = "+(c-b-a));}
  return QX(r,"Résolution de "+M(a+"x + "+b+" = "+c)+". Où est l’erreur ?",st,bad,
    "On retire "+b+" des deux côtés : "+M(a+"x = "+(c-b))+", puis on DIVISE par "+a+" : "+M("x = "+x)+".");
});
var FORMS=[{f:"U = R \\times I",x:"R",ok:"R = \\dfrac{U}{I}",w:["R = U \\times I","R = \\dfrac{I}{U}","R = U - I"]},{f:"d = v \\times t",x:"v",ok:"v = \\dfrac{d}{t}",w:["v = d \\times t","v = \\dfrac{t}{d}","v = d - t"]},{f:"P = U \\times I",x:"I",ok:"I = \\dfrac{P}{U}",w:["I = P \\times U","I = \\dfrac{U}{P}","I = P - U"]},{f:"\\rho = \\dfrac{m}{V}",x:"V",ok:"V = \\dfrac{m}{\\rho}",w:["V = m \\times \\rho","V = \\dfrac{\\rho}{m}","V = m - \\rho"]},{f:"V = L \\times \\ell \\times h",x:"h",ok:"h = \\dfrac{V}{L \\times \\ell}",w:["h = V \\times L \\times \\ell","h = \\dfrac{L \\times \\ell}{V}","h = V - L - \\ell"]},{f:"C = 2 \\pi r",x:"r",ok:"r = \\dfrac{C}{2\\pi}",w:["r = C \\times 2\\pi","r = \\dfrac{2\\pi}{C}","r = \\dfrac{C}{\\pi}"]},{f:"P = m \\times g",x:"m",ok:"m = \\dfrac{P}{g}",w:["m = P \\times g","m = \\dfrac{g}{P}","m = P - g"]},{f:"E = P \\times t",x:"t",ok:"t = \\dfrac{E}{P}",w:["t = E \\times P","t = \\dfrac{P}{E}","t = E - P"]}];
reg("formules_isoler",["cap","2nde","1re"],C_EQ,"Isoler une grandeur dans une formule",["formule","isoler","transformer une formule","U=RI"],2,function(r){
  var F=pick(r,FORMS);
  if(r()<0.25){var G=pickN(r,FORMS,4);return QA(r,"Associe chaque formule à la grandeur isolée correspondante.",G.map(function(g){return [M(g.f),M(g.ok)];}),"Pour isoler une grandeur qui multiplie, on divise par les autres facteurs.");}
  return Q(r,"À partir de "+M(F.f)+", comment exprimer "+M(F.x)+" ?",M(F.ok),F.w.map(function(w,i){return [M(w),i===2?"addp":"inv"];}),{},
    "Si "+M(F.f)+", on divise par ce qui multiplie "+M(F.x)+" : "+M(F.ok)+".");
});
var LITP=[["2(x + 3)","2x + 6"],["x + x","2x"],["x \\times x","x^2"],["3(x - 2)","3x - 6"],["2x + 3x","5x"],["x^2 + x^2","2x^2"],["4x - x","3x"],["(x + 1) + (x + 2)","2x + 3"],["2 \\times 3x","6x"],["-(x - 4)","-x + 4"],["x(x + 2)","x^2 + 2x"],["5x - 2x + 1","3x + 1"],["x \\times 4","4x"],["2x \\times 3x","6x^2"]];
reg("lit_tuiles",["cap","2nde"],C_EQ,"Expressions littérales égales (tuiles et pièges)",["calcul littéral","réduire","développer","x²","tuiles"],2,function(r){
  if(r()<0.6)return QA(r,"Associe chaque expression à l’expression égale.",pickN(r,LITP,4).map(function(p){return [M(p[0]),M(p[1])];}),"x + x = 2x (on additionne) ; x × x = x² (on multiplie).");
  var t=rnd(r,0,2),a=rnd(r,2,6),b=rnd(r,2,6);
  if(t===0)return Q(r,"Réduire "+M(a+"x + "+b+"x"),M((a+b)+"x"),[[M((a+b)+"x^2"),"conf"],[M((a*b)+"x"),"addp"],[M(a*b+"x^2"),"conf"]],{lit:(a+b)+"*x",form:"red"},M(a+"x + "+b+"x = ("+a+" + "+b+")x = "+(a+b)+"x")+". Pas de carré : on additionne des « x ».");
  if(t===1)return Q(r,"Réduire "+M(a+"x \\times "+b+"x"),M((a*b)+"x^2"),[[M((a*b)+"x"),"conf"],[M((a+b)+"x^2"),"addp"],[M((a+b)+"x"),"addp"]],{lit:(a*b)+"*x^2",form:"red"},M(a+"x \\times "+b+"x = "+a+" \\times "+b+" \\times x \\times x = "+(a*b)+"x^2")+".");
  return Q(r,"Réduire "+M(a+"x + "+b),M(a+"x + "+b),[[M((a+b)+"x"),"conf"],[M(String(a+b)),"conf"],[M((a*b)+"x"),"addp"]],{},"On ne peut pas additionner des « x » et des nombres seuls : "+M(a+"x + "+b)+" est déjà réduite.");
});
reg("double_dist",["2nde","1re"],C_EQ,"Développer un produit (double distributivité)",["développer","double distributivité","calcul littéral"],3,function(r){
  var a=rnd(r,1,7)*(r()<0.3?-1:1),b=rnd(r,1,7)*(r()<0.3?-1:1),s=a+b,p=a*b,P=function(c1,c0){return M(quadL(1,c1,c0).replace(/^1x/,"x"));};
  if(s===0)return null;
  var A=function(v){return (v<0?"- ":"+ ")+Math.abs(v);};
  return Q(r,"Développer et réduire "+M("(x "+A(a)+")(x "+A(b)+")"),P(s,p),[[P(0,p),"demi"],[P(s,s),"addp"],[P(p,s),"inv"],[P(s,-p),"signe"]],{lit:"x^2+("+s+")*x+("+p+")",form:"dev"},
    "Chaque terme du 1er facteur multiplie chaque terme du 2e : "+M("x^2 "+A(b)+"x "+A(a)+"x "+A(p)+" = "+quadL(1,s,p).replace(/^1x/,"x"))+".");
});

/* ═════════ FONCTIONS ═════════ */
function polyInc(r){var y=[rnd(r,-2,1)],i;for(i=1;i<=6;i++)y.push(y[i-1]+rnd(r,0,2));if(y[6]-y[0]<4)return null;return y;}
reg("lect_image",["cap","2nde","1re"],C_FONC,"Lire une image, un antécédent sur un graphique",["image","antécédent","lecture graphique","courbe","f(x)"],2,function(r){
  var y=polyInc(r);if(!y)return null;
  var pts=y.map(function(v,i){return [i,v];}),ymin=Math.min.apply(null,y)-1,ymax=Math.max.apply(null,y)+1,fig={k:"graph",xr:[-1,7],yr:[ymin,ymax],pts:pts,names:[[6.6,y[6]-0.6,"𝒞f",0]]},t=rnd(r,0,2);
  var i=rnd(r,1,5);
  if(t===0){var wr=[[y[i+1],"lect"],[y[i-1],"lect"],[i,"conf"],[y[i]+1,"lect"],[y[i]-1,"lect"]];var inv=y.indexOf(i);if(inv>=0&&inv!==i)wr.unshift([inv,"inv"]);
    return Q(r,"Lire l’image de "+i+" par la fonction "+M("f")+".",y[i],wr,{d:0,fig:fig},"On part de "+i+" sur l’axe des abscisses, on monte jusqu’à la courbe, on lit l’ordonnée : "+M("f("+i+") = "+y[i])+".");}
  var target=y[i];if(y.filter(function(v){return v===target;}).length>1)return null;
  if(t===1)return Q(r,"Lire l’antécédent de "+target+" par la fonction "+M("f")+".",i,[[y[target]!==undefined&&target>=0&&target<=6?y[target]:target+1,"inv"],[i+1,"lect"],[i-1,"lect"],[target,"conf"]],{d:0,fig:fig},"On part de "+target+" sur l’axe des ordonnées, on va jusqu’à la courbe, on lit l’abscisse : "+i+".");
  return Q(r,"Résoudre graphiquement "+M("f(x) = "+target)+".",M("x = "+i),[[M("x = "+(y[target]!==undefined&&target>=0&&target<=6&&y[target]!==i?y[target]:i+2)),"inv"],[M("x = "+(i+1)),"lect"],[M("x = "+target),"conf"]],{fig:fig},"On cherche le(s) point(s) de la courbe d’ordonnée "+target+" : abscisse "+i+".");
});
reg("fn_types",["2nde"],C_FONC,"Fonction linéaire, affine, constante (tuiles)",["fonction linéaire","fonction affine","constante","reconnaître"],1,function(r){
  var a=pick(r,[2,3,-4,0.5,5]),b=pick(r,[1,-3,4,7]),c=pick(r,[3,-2,6]);
  return QA(r,"Associe chaque fonction à sa nature.",[[M("f(x) = "+linL(a,0)),"linéaire"],[M("g(x) = "+linL(pick(r,[2,-3,4]),b)),"affine (non linéaire)"],[M("h(x) = "+c),"constante"],[M("k(x) = x^2 "+(b<0?"- ":"+ ")+Math.abs(b)),"ni affine, ni linéaire"]],
    "Linéaire : f(x) = ax. Affine : f(x) = ax + b. Constante : f(x) = b. Avec x², ce n’est plus une fonction affine.");
});
reg("droite_eq",["2nde","1re"],C_FONC,"Lire l’équation d’une droite sur un graphique",["droite","coefficient directeur","ordonnée à l’origine","équation réduite","lecture graphique"],2,function(r){
  var a=pick(r,[-2,-1,1,2,0.5,3]),b=rnd(r,-2,3);if(a===b)return null;
  var x1=a>0?-2:-1,x2=a===3?1:a===2?2:4,fig={k:"graph",xr:[-3,5],yr:[-4,6],pts:[[-3,-3*a+b],[5,5*a+b]].map(function(p){return p;}),dots:[[0,b,""],[1,a+b,""]]};
  var Y=function(p,q){return M("y = "+linL(p,q));};
  if(r()<0.6)return Q(r,"Quelle est l’équation de cette droite ?",Y(a,b),[[Y(b===0?a+1:b,a),"inv"],[Y(a,-b===b?b+1:-b),"signe"],[Y(-a,b),"signe"],[Y(a,b+1),"lect"],[Y(a+1,b),"lect"]],{fig:fig},
    "La droite coupe l’axe des ordonnées en "+b+" (ordonnée à l’origine). Quand x augmente de 1, y "+(a>0?"augmente":"diminue")+" de "+f(Math.abs(a))+" : coefficient directeur "+f(a)+". Donc "+Y(a,b)+".");
  return Q(r,"Quelle est l’ordonnée à l’origine de cette droite ?",b,[[a,"conf"],[rd(-b/a,2),"conf"],[b+1,"lect"]],{d:2,fig:fig},"C’est l’ordonnée du point où la droite coupe l’axe vertical : "+b+".");
});
reg("parabole_lect",["1re","term"],C_FN,"Fonction du 2nd degré : lire une parabole",["parabole","second degré","sommet","coefficient a","solutions"],2,function(r){
  var a=pick(r,[1,-1,0.5,-0.5]),h=rnd(r,-2,3),k=rnd(r,-3,3),pts=[];for(var x=-3;x<=5.01;x+=0.25)pts.push([x,a*(x-h)*(x-h)+k]);
  pts=pts.filter(function(p){return p[1]>=-6&&p[1]<=6;});
  var fig={k:"graph",xr:[-3,5],yr:[-5,5],pts:pts},t=rnd(r,0,2),C=function(p,q){return M("("+fm(p,0)+"\\,;\\,"+fm(q,0)+")");};
  if(t===0)return Q(r,"Quelles sont les coordonnées du sommet de la parabole ?",C(h,k),[[C(k,h),"inv"],[C(-h,k),"signe"],[C(h,-k),"signe"]].filter(function(w){return w[0]!==C(h,k);}),{fig:fig},"Le sommet est le point le plus "+(a>0?"bas":"haut")+" de la parabole : "+C(h,k)+".");
  if(t===1)return Q(r,"Que peut-on dire du coefficient "+M("a")+" de "+M("f(x) = ax^2 + bx + c")+" ?",a>0?"a est positif":"a est négatif",[[a>0?"a est négatif":"a est positif","signe"],["a est nul","conf"],["on ne peut pas savoir","conf"]],{fig:fig},
    "Parabole tournée vers le "+(a>0?"haut (en U) : a > 0.":"bas (en ∩) : a < 0."));
  var n=k===0?1:(a>0)===(k<0)?2:0;
  return Q(r,"Combien de solutions l’équation "+M("f(x) = 0")+" a-t-elle ?",String(n),[[String((n+1)%3),"lect"],[String((n+2)%3),"lect"],["une infinité","conf"]],{fig:fig},"On compte les points où la parabole coupe l’axe des abscisses : "+n+".");
});

/* ═════════ 1re et Tle ═════════ */
reg("evol_pieges",["1re"],C_EVOL,"Évolutions : pièges classiques (étape fausse, estimation)",["évolutions successives","coefficient","piège","estimation"],3,function(r){
  var t=rnd(r,0,2),p=pick(r,[10,20,25,50]);
  if(t===0)return QX(r,"Un prix augmente de "+p+" % puis baisse de "+p+" %. Malik écrit :",[M("\\text{CM global} = "+fm(1+p/100)+" \\times "+fm(1-p/100)),M("= "+fm((1+p/100)*(1-p/100),4)),"donc le prix revient à sa valeur de départ."],2,
    "Le coefficient global vaut "+f((1+p/100)*(1-p/100),4)+" < 1 : le prix BAISSE de "+f(p*p/100)+" %. Une hausse puis une baisse de même taux ne se compensent pas.");
  if(t===1){var C=pick(r,[1000,1500,2000,5000]),tx=pick(r,[2,3,4,5]),n=pick(r,[5,8,10]),ok=C*Math.pow(1+tx/100,n);
    return QE(r,"On place "+f(C)+" € à "+tx+" % par an (intérêts composés). Estime le capital au bout de "+n+" ans.",ok,{u:"€",lo:0},M(fm(C)+" \\times "+fm(1+tx/100)+"^{"+n+"} \\approx "+fm(ok,0))+" €. Les intérêts simples donneraient "+f(C*(1+n*tx/100))+" €.");}
  var p1=pick(r,[10,20,30]),p2=pick(r,[10,20,50]),cg=(1+p1/100)*(1+p2/100);
  return QA(r,"Associe chaque situation à son coefficient multiplicateur global.",[["+"+p1+" % puis +"+p2+" %","× "+f(cg,4)],["+"+p1+" % puis −"+p2+" %","× "+f((1+p1/100)*(1-p2/100),4)],["−"+p1+" % puis −"+p2+" %","× "+f((1-p1/100)*(1-p2/100),4)],["+"+(p1+p2)+" %","× "+f(1+(p1+p2)/100,4)]],
    "Évolutions successives : on MULTIPLIE les coefficients. « +"+p1+" % puis +"+p2+" % » n’est pas « +"+(p1+p2)+" % ».");
});
reg("proba_tab",["1re","term"],C_SP,"Probabilités à partir d’un tableau croisé",["probabilité","tableau croisé","intersection","conditionnelle"],2,function(r){
  var a=rnd(r,4,15),b=rnd(r,4,15),c=rnd(r,4,15),d=rnd(r,4,15),N=a+b+c+d,t=rnd(r,0,2);
  var fig={k:"tab",hc:1,rows:[["","Fille","Garçon","Total"],["Interne",String(a),String(b),String(a+b)],["Externe",String(c),String(d),String(c+d)],["Total",String(a+c),String(b+d),String(N)]]};
  var P=function(n,dd){return M(frL(n,dd));};
  if(t===0)return Q(r,"On choisit un élève au hasard. Probabilité qu’il soit interne ?",P(a+b,N),[[P(a+b,c+d),"formule"],[P(a,N),"conf"],[P(a+b,a+c),"conf"]],{fig:fig},"Internes : "+(a+b)+" sur "+N+" élèves : "+P(a+b,N)+".");
  if(t===1)return Q(r,"On choisit un élève au hasard. Probabilité que ce soit une fille interne ?",P(a,N),[[P(a,a+b),"conf"],[P(a,a+c),"conf"],[P(a+b+a+c,N),"addp"]],{fig:fig},"Filles ET internes : "+a+" élèves sur "+N+" : "+P(a,N)+".");
  return Q(r,"On choisit une fille au hasard. Probabilité qu’elle soit interne ?",P(a,a+c),[[P(a,N),"conf"],[P(a,a+b),"inv"],[P(a+c,N),"conf"]],{fig:fig},"On se limite aux "+(a+c)+" filles : "+a+" sont internes, d’où "+P(a,a+c)+" (probabilité conditionnelle).");
});
reg("deriv_tuiles",["term"],C_DER,"Dérivées usuelles (tuiles)",["dérivée","formules","tuiles","f’(x)"],2,function(r){
  var pool=[["x^2","2x"],["x^3","3x^2"],["5x","5"],["7","0"],["\\dfrac{1}{x}","-\\dfrac{1}{x^2}"],["3x^2","6x"],["x^2 + 4x","2x + 4"],["-2x + 1","-2"],["4x^3","12x^2"]];
  if(r()<0.7)return QA(r,"Associe chaque fonction "+M("f(x)")+" à sa dérivée "+M("f'(x)")+".",pickN(r,pool,4).map(function(p){return [M(p[0]),M(p[1])];}),"(xⁿ)’ = n xⁿ⁻¹ ; (ax)’ = a ; (constante)’ = 0.");
  var n=rnd(r,2,4),a=rnd(r,2,6);
  return Q(r,"Dériver "+M("f(x) = "+a+"x^{"+n+"}"),M((a*n)+"x^{"+(n-1)+"}"),[[M((a*n)+"x^{"+n+"}"),"demi"],[M(a+"x^{"+(n-1)+"}"),"demi"],[M((a+n)+"x^{"+(n-1)+"}"),"addp"]],{},M("(ax^n)' = a \\times n \\times x^{n-1} = "+(a*n)+"x^{"+(n-1)+"}")+".");
});
reg("suites_plus",["term"],C_SUI,"Suites : reconnaître, ranger, estimer",["suite","arithmétique","géométrique","estimation","tuiles"],2,function(r){
  var t=rnd(r,0,2);
  if(t===0){var u=pick(r,[2,3,5]),d=pick(r,[2,3,4]),q=pick(r,[2,3]);
    return QA(r,"Associe chaque suite à sa nature.",[[[u,u+d,u+2*d,u+3*d].join(" ; ")+" ; …","arithmétique de raison "+d],[[u,u*q,u*q*q,u*q*q*q].join(" ; ")+" ; …","géométrique de raison "+q],[[u+20,u+20-d,u+20-2*d,u+20-3*d].join(" ; ")+" ; …","arithmétique de raison −"+d],[[1,4,9,16].join(" ; ")+" ; …","ni arithmétique, ni géométrique"]],
      "Arithmétique : on ajoute toujours le même nombre. Géométrique : on multiplie toujours par le même nombre.");}
  if(t===1){var u0=pick(r,[1000,1500,2000]),qq=pick(r,[1.03,1.05,0.95,0.9]),n=pick(r,[8,10,12]),ok=u0*Math.pow(qq,n);
    return QE(r,"Suite géométrique : "+M("u_0 = "+fm(u0))+", raison "+M(fm(qq))+". Estime "+M("u_{"+n+"}")+".",ok,{lo:0},M("u_{"+n+"} = "+fm(u0)+" \\times "+fm(qq)+"^{"+n+"} \\approx "+fm(ok,0))+".");}
  var a=pick(r,[3,5,7]),rr=pick(r,[-2,4,3]);
  return QO(r,"Remets dans l’ordre les étapes pour calculer "+M("u_{10}")+" (suite arithmétique, "+M("u_0 = "+a)+", raison "+rr+").",["On écrit la formule "+M("u_n = u_0 + n r"),"On remplace : "+M("u_{10} = "+a+" + 10 \\times "+par(rr)),"On calcule : "+M("u_{10} = "+(a+10*rr))],"Formule, remplacement, calcul.",{how:"dans l’ordre",sep:" → "});
});

/* ═════════ PROBLÈMES DES MÉTIERS (plusieurs étapes) ═════════ */
reg("pb_commerce",["3pm","cap","2nde"],C_MET,"Commerce : remise, TVA, prix de vente",["commerce","remise","TVA","prix","problème"],3,function(r){
  var t=rnd(r,0,2);
  if(t===0){var HT=pick(r,[80,100,120,150,200,250]),p=pick(r,[10,20,25]),ok=HT*(1-p/100)*1.2;
    return Q(r,"Un article coûte "+HT+" € HT. On accorde une remise de "+p+" % sur le prix HT, puis on ajoute la TVA à 20 %. Quel est le prix TTC à payer ?",ok,[[HT*(1-p/100),"demi"],[HT*(1+0.2-p/100),"addp"],[HT*1.2-p,"addp"],[HT*1.2,"demi"]],{u:"€",d:2},
      "Remise : "+M(HT+" \\times "+fm(1-p/100)+" = "+fm(HT*(1-p/100)))+" € HT. TVA : "+M(fm(HT*(1-p/100))+" \\times 1{,}2 = "+fm(ok))+" € TTC.");}
  if(t===1){var A=pick(r,[12,15,20,24,30]),m=pick(r,[25,40,50,60]),ok2=A*(1+m/100);
    return Q(r,"Un commerçant achète un produit "+A+" € et applique un coefficient de marge de "+m+" %. Quel est son prix de vente ?",ok2,[[A+m,"addp"],[A*m/100,"compl"],[A/(1-m/100),"inv"],[A*m,"pct0"]],{u:"€",d:2},M(A+" \\times "+fm(1+m/100)+" = "+fm(ok2))+" €.");}
  var pu=pick(r,[2.4,3.5,4.2,1.85]),n=pick(r,[12,18,24,36]);
  return QE(r,"Estime le prix de "+n+" articles à "+f(pu)+" € l’unité.",pu*n,{u:"€"},"Ordre de grandeur : "+M(Math.round(pu)+" \\times "+n+" = "+Math.round(pu)*n)+" €. Exact : "+f(pu*n)+" €.");
});
reg("pb_batiment",["cap","2nde"],C_MET,"Bâtiment : surfaces, peinture, carrelage",["bâtiment","surface","peinture","carrelage","pots","problème"],3,function(r){
  var t=rnd(r,0,2);
  if(t===0){var L=pick(r,[4,5,6]),l=pick(r,[3,4]),H=2.5,S=2*(L+l)*H,cov=pick(r,[10,12]),pot=2.5,lit=S/cov,np=Math.ceil(lit/pot);
    return Q(r,"Une pièce mesure "+L+" m × "+l+" m, hauteur "+f(H)+" m. On peint les 4 murs (une couche). La peinture couvre "+cov+" m²/L et se vend en pots de 2,5 L. Combien de pots faut-il ?",np,[[Math.max(1,Math.floor(lit/pot)),"arr"],[Math.ceil(L*l/cov/pot),"formule"],[Math.ceil(lit),"conf"],[np+1,"calc"]].filter(function(w){return w[0]!==np;}),{d:0},
      "Murs : "+M("2 \\times ("+L+" + "+l+") \\times "+fm(H)+" = "+fm(S))+" m². Peinture : "+M(fm(S)+" \\div "+cov+" \\approx "+fm(lit,2))+" L. Pots : "+M(fm(lit,2)+" \\div 2{,}5 \\approx "+fm(lit/pot,2))+", donc "+np+" pots (on arrondit au-dessus).");}
  if(t===1){var a=pick(r,[3,4,5]),b=pick(r,[2,3,4]),c=pick(r,[20,25,30,40]),ok=a*100/c*(b*100/c);
    return Q(r,"Combien de carreaux carrés de "+c+" cm de côté faut-il pour couvrir une surface de "+a+" m × "+b+" m (sans perte) ?",ok,[[a*b*100/c,"unit"],[a*b/(c*c),"unit"],[(a+b)*100/c,"addp"],[ok*2,"calc"]],{d:0,far:2},
      "Sur la longueur : "+M(a*100+" \\div "+c+" = "+a*100/c)+" ; sur la largeur : "+M(b*100+" \\div "+c+" = "+b*100/c)+". Total : "+M(a*100/c+" \\times "+b*100/c+" = "+ok)+" carreaux.");}
  var pente=pick(r,[2,3,4,5]),Lh=pick(r,[2,3,4,5]),dh=pente*Lh;
  return Q(r,"Une rampe d’accès a une pente de "+pente+" %. Quelle hauteur monte-t-elle sur "+Lh+" m de longueur horizontale ?",dh,[[pente*Lh*10,"unit"],[pente+Lh,"addp"],[dh/10,"unit"],[Lh*100/pente,"inv"]],{u:"cm",d:1},
    "Pente de "+pente+" % : on monte "+pente+" cm pour 100 cm. Sur "+Lh+" m = "+Lh*100+" cm : "+M(fm(pente/100)+" \\times "+Lh*100+" = "+dh)+" cm.");
});
reg("pb_cuisine",["3pm","cap"],C_MET,"Cuisine : recettes, coût d’une portion",["cuisine","recette","proportionnalité","coût","portion"],2,function(r){
  var t=rnd(r,0,1);
  if(t===0){var n=pick(r,[4,6,8]),q=pick(r,[150,200,250,300]),N=pick(r,[10,15,20,30]),ok=q*N/n/1000;
    return Q(r,"Une recette pour "+n+" personnes demande "+q+" g de beurre. Combien de kilogrammes faut-il pour "+N+" personnes ?",ok,[[q*N/n,"unit"],[q*n/N/1000,"inv"],[(q+N-n)/1000,"addp"],[ok*10,"unit"]],{u:"kg",d:3},
      "Pour 1 personne : "+M(q+" \\div "+n+" = "+fm(q/n))+" g. Pour "+N+" : "+M(fm(q/n)+" \\times "+N+" = "+fm(q*N/n))+" g = "+f(ok,3)+" kg.");}
  var c=pick(r,[18,24,30,36]),p=pick(r,[8,10,12]),ok2=c/p;
  return Q(r,"Un plat de "+p+" portions coûte "+c+" € en matières premières. Avec un coefficient multiplicateur de 3,5, quel est le prix de vente d’une portion ?",ok2*3.5,[[c*3.5,"demi"],[ok2,"demi"],[ok2+3.5,"addp"],[c/3.5/p,"inv"]],{u:"€",d:2},
    "Coût d’une portion : "+M(c+" \\div "+p+" = "+fm(ok2))+" €. Prix de vente : "+M(fm(ok2)+" \\times 3{,}5 = "+fm(ok2*3.5))+" €.");
});
reg("pb_auto",["cap","2nde"],C_MET,"Maintenance auto · Transport : carburant, vitesse moyenne",["auto","consommation","carburant","vitesse moyenne","problème"],2,function(r){
  var t=rnd(r,0,1);
  if(t===0){var c=pick(r,[5,6,7,8]),d=pick(r,[150,200,250,300]),px=pick(r,[1.8,1.9,1.75]),ok=c*d/100*px;
    return Q(r,"Un véhicule consomme "+c+" L aux 100 km. Le carburant coûte "+f(px)+" €/L. Quel est le coût d’un trajet de "+d+" km ?",ok,[[c*d/100,"demi"],[c*d*px,"unit"],[c*px,"demi"],[d/c*px,"inv"]],{u:"€",d:2},
      "Carburant : "+M(c+" \\times \\dfrac{"+d+"}{100} = "+fm(c*d/100))+" L. Coût : "+M(fm(c*d/100)+" \\times "+fm(px)+" = "+fm(ok))+" €.");}
  var d1=pick(r,[60,90,120]),h=pick(r,[[1,30],[2,0],[1,15],[2,30]]),T=h[0]+h[1]/60,ok2=d1/T;
  return Q(r,"Un livreur parcourt "+d1+" km en "+h[0]+" h "+(h[1]<10?"0":"")+h[1]+". Quelle est sa vitesse moyenne ?",ok2,[[d1/(h[0]+h[1]/100),"base"],[d1/h[0],"demi"],[d1/(h[0]+1),"calc"],[d1*T,"inv"],[ok2+10,"calc"]],{u:"km/h",d:2},
    h[0]+" h "+h[1]+" = "+f(T)+" h. "+M("v = \\dfrac{d}{t} = \\dfrac{"+d1+"}{"+fm(T)+"} = "+fm(ok2))+" km/h.");
});
reg("pb_logistique",["cap","2nde"],C_MET,"Logistique : palettes, cartons, chargement",["logistique","palette","colis","rangement","problème"],3,function(r){
  var t=rnd(r,0,1);
  if(t===0){var P=[120,80],c=pick(r,[[40,20],[30,20],[40,40],[60,40]]),couches=pick(r,[3,4,5]),parC=(P[0]/c[0])*(P[1]/c[1]),ok=parC*couches;
    return Q(r,"Sur une palette de 120 cm × 80 cm, on pose des cartons de "+c[0]+" cm × "+c[1]+" cm sur "+couches+" couches. Combien de cartons au maximum ?",ok,[[parC,"demi"],[(P[0]+P[1])/(c[0]+c[1])*couches,"addp"],[ok+couches,"calc"],[parC*(couches+1),"calc"]],{d:0},
      "Par couche : "+M("(120 \\div "+c[0]+") \\times (80 \\div "+c[1]+") = "+(P[0]/c[0])+" \\times "+(P[1]/c[1])+" = "+parC)+". Avec "+couches+" couches : "+ok+" cartons.");}
  var m=pick(r,[12,15,18,25]),n=pick(r,[20,30,40]),max=pick(r,[400,500,600]),ok2=Math.floor(max/m);
  return Q(r,"Un chariot supporte "+max+" kg. Chaque colis pèse "+m+" kg. Combien de colis au maximum peut-on charger ?",ok2,[[Math.ceil(max/m)===ok2?ok2+2:Math.ceil(max/m),"arr"],[max*m,"inv"],[max-m,"addp"],[ok2-1,"calc"]],{d:0,far:2},
    M(max+" \\div "+m+" \\approx "+fm(rd(max/m,2)))+" : on garde l’entier INFÉRIEUR, donc "+ok2+" colis (un de plus dépasserait "+max+" kg).");
});
reg("pb_sante",["cap","2nde"],C_MET,"Santé · Social : doses, débits, dilutions",["santé","dose","débit","dilution","problème"],3,function(r){
  var t=rnd(r,0,2);
  if(t===0){var dpk=pick(r,[10,15,20]),kg=pick(r,[12,18,25,30]),ok=dpk*kg;
    return Q(r,"La dose prescrite est de "+dpk+" mg par kg. Quelle dose pour un enfant de "+kg+" kg ?",ok,[[dpk+kg,"addp"],[kg/dpk,"inv"],[ok/10,"unit"],[ok*2,"calc"]],{u:"mg",d:0},M(dpk+" \\times "+kg+" = "+ok)+" mg.");}
  if(t===1){var V=pick(r,[250,500,1000]),h=pick(r,[2,4,5,8]),ok2=V/h;
    return Q(r,"Une perfusion de "+V+" mL doit passer en "+h+" h. Quel est le débit en mL/h ?",ok2,[[V*h,"inv"],[V/(h*60),"base"],[h/V,"inv"],[ok2/2,"calc"]],{u:"mL/h",d:2,far:2},M(V+" \\div "+h+" = "+fm(ok2))+" mL/h.");}
  var pr=pick(r,[1,2]),eau=pick(r,[4,9,19]),tot=pick(r,[500,1000,2000]),ok3=tot*pr/(pr+eau);
  return Q(r,"Un produit se dilue à raison de "+pr+" volume de produit pour "+eau+" volumes d’eau. Quelle quantité de produit pour préparer "+tot+" mL de solution ?",ok3,[[tot*pr/eau,"conf"],[tot/eau,"conf"],[tot*pr/(pr+eau)*2,"calc"],[tot-tot*pr/(pr+eau),"compl"]],{u:"mL",d:1},
    "La solution compte "+(pr+eau)+" volumes, dont "+pr+" de produit : "+M(tot+" \\times \\dfrac{"+pr+"}{"+(pr+eau)+"} \\approx "+fm(rd(ok3,1)))+" mL.");
});
reg("pb_coiffure",["3pm","cap"],C_MET,"Coiffure · Esthétique : mélanges, temps de pose, tarifs",["coiffure","mélange","durée","tarif","problème"],2,function(r){
  var t=rnd(r,0,1);
  if(t===0){var col=pick(r,[30,40,50,60]),k=pick(r,[1.5,2,3]),ok=col*(1+k);
    return Q(r,"Un mélange se prépare avec "+col+" mL de coloration et "+f(k)+" fois plus d’oxydant. Quel volume total obtient-on ?",ok,[[col*k,"demi"],[col+k,"addp"],[col*k*2,"calc"],[col*2,"conf"]],{u:"mL",d:1},
      "Oxydant : "+M(col+" \\times "+fm(k)+" = "+fm(col*k))+" mL. Total : "+M(col+" + "+fm(col*k)+" = "+fm(ok))+" mL.");}
  var h=pick(r,[[9,40],[10,15],[14,50],[15,35]]),pose=pick(r,[25,35,40,45]),tt=h[0]*60+h[1]+pose,H=Math.floor(tt/60),Mn=tt%60;
  return Q(r,"Une couleur est posée à "+h[0]+" h "+h[1]+". Le temps de pose est de "+pose+" min. À quelle heure faut-il rincer ?",H+" h "+(Mn<10?"0":"")+Mn,[[h[0]+" h "+(h[1]+pose),"base"],[(H+1)+" h "+(Mn<10?"0":"")+Mn,"calc"],[H+" h "+((Mn+20)%60<10?"0":"")+(Mn+20)%60,"calc"]],{},
    h[1]+" + "+pose+" = "+(h[1]+pose)+" min = 1 h "+(h[1]+pose-60)+" min : on rince à "+H+" h "+(Mn<10?"0":"")+Mn+".");
});
reg("pb_elec",["cap","2nde","1re"],C_MET,"Électricité · Énergie : puissance, énergie, coût",["électricité","puissance","énergie","kWh","coût","problème"],3,function(r){
  var t=rnd(r,0,1);
  if(t===0){var P=pick(r,[1000,1500,2000,2500]),h=pick(r,[2,3,4,5]),px=pick(r,[0.2,0.25]),E=P*h/1000,ok=E*px;
    return Q(r,"Un radiateur de "+P+" W fonctionne "+h+" h. Le kWh coûte "+f(px)+" €. Quel est le coût ?",ok,[[P*h*px,"unit"],[E,"demi"],[P/h*px/1000,"inv"],[ok*10,"unit"]],{u:"€",d:2,far:2},
      "Énergie : "+M("E = P \\times t = "+fm(P/1000)+" \\text{ kW} \\times "+h+" \\text{ h} = "+fm(E))+" kWh. Coût : "+M(fm(E)+" \\times "+fm(px)+" = "+fm(ok))+" €.");}
  var U=230,I=pick(r,[2,4,5,8,10]),ok2=U*I;
  return Q(r,"Un appareil branché sur 230 V est traversé par un courant de "+I+" A. Quelle est sa puissance ?",ok2,[[U/I,"inv"],[U+I,"addp"],[ok2/1000,"unit"],[ok2*2,"calc"]],{u:"W",d:2,far:2},M("P = U \\times I = 230 \\times "+I+" = "+ok2)+" W.");
});

/* ═════════ ALGORITHMIQUE ET TABLEUR ═════════ */
reg("algo_var",["3pm","cap","2nde"],C_ALGO,"Lire un programme (variables, boucles, tests)",["algorithmique","python","variable","boucle","programme"],2,function(r){
  var t=rnd(r,0,3);
  if(t===0){var x0=rnd(r,2,7),a=rnd(r,2,4),b=rnd(r,1,9),c=rnd(r,1,6),x1=a*x0+b,ok=x1-c;
    return Q(r,"Que vaut x à la fin de ce programme ?",ok,[[x0,"conf"],[x1,"demi"],[a*(x0+b)-c,"ordre"],[ok+c+c,"signe"]],{d:0,fig:{k:"code",lines:["x = "+x0,"x = "+a+" * x + "+b,"x = x - "+c]}},
      "x vaut "+x0+", puis "+a+" × "+x0+" + "+b+" = "+x1+", puis "+x1+" − "+c+" = "+ok+". Chaque ligne remplace l’ancienne valeur.");}
  if(t===1){var n=rnd(r,3,6),s=0,i;for(i=0;i<n;i++)s+=i;
    return Q(r,"Que vaut s à la fin de ce programme ?",s,[[s+n,"calc"],[n,"conf"],[s-(n-1),"calc"],[n*(n+1)/2+n,"calc"]],{d:0,fig:{k:"code",lines:["s = 0","for i in range("+n+"):","    s = s + i"]}},
      "range("+n+") donne i = 0, 1, …, "+(n-1)+" (et pas "+n+") : s = "+Array.apply(null,{length:n}).map(function(_,k){return k;}).join(" + ")+" = "+s+".");}
  if(t===2){var v=rnd(r,5,20),seuil=rnd(r,8,14),res=v>=seuil?"Admis":"Refusé";
    return Q(r,"Qu’affiche ce programme ?",res,[[res==="Admis"?"Refusé":"Admis","conf"],["seuil","conf"],[String(v),"conf"]],{fig:{k:"code",lines:["note = "+v,"if note >= "+seuil+":","    print(\"Admis\")","else:","    print(\"Refusé\")"]}},
      v+(v>=seuil?" ≥ ":" < ")+seuil+" : le programme affiche « "+res+" ».");}
  var A1=rnd(r,2,9),A2=rnd(r,2,9),k=rnd(r,2,5),ok2=k*A1+A2;
  return Q(r,"Dans un tableur, A1 contient "+A1+" et A2 contient "+A2+". Qu’affiche la cellule B1 ?",ok2,[[k*(A1+A2),"ordre"],[k+A1+A2,"addp"],[k*A1,"demi"],[ok2+1,"calc"]],{d:0,fig:{k:"code",lines:["B1  =  ="+k+"*A1+A2"]}},
    "Le tableur respecte les priorités : "+M(k+" \\times "+A1+" + "+A2+" = "+ok2)+".");
});

/* ═══════════════════════════════════════════════════════════════
   MOTEUR DE LA BANQUE : questions de cours, tirage, arborescence
═══════════════════════════════════════════════════════════════ */
/* Questions de cours : chargées depuis le bloc JSON « fm-cours » de la page */
function loadCours(obj){
  if(!obj||!obj.items)return;
  obj.items.forEach(function(it){
    reg(it.id,it.niv,it.chap,it.titre,it.tags||[],it.d||1,function(r){
      var v=pick(r,it.qs);
      return coursQuestion(r,v);
    },{cours:true,nvar:it.qs.length});
  });
}
/* une entrée de cours.json → question (QCM, Vrai/Faux, tuiles, ordre, estimation, étape fausse) */
function coursQuestion(r,v){
  var o=v.fig?{fig:v.fig}:{};
  if(v.vf!==undefined){var q=VF(r,v.q,!!v.vf,v.x);if(v.fig)q.fig=v.fig;return q;}
  if(v.as)return QA(r,v.q,shuffle(r,v.as).slice(0,4),v.x,o);
  if(v.or)return QO(r,v.q,v.or,v.x,{how:v.how,sep:v.sep,fig:v.fig});
  if(v.es)return QE(r,v.q,v.es.v,{u:v.es.u,min:v.es.min,max:v.es.max,tol:v.es.tol,fig:v.fig},v.x);
  if(v.st)return QX(r,v.q,v.st,v.bad,v.x,o);
  o.keep=!!v.keep;
  return Q(r,v.q,v.ok,v.wr.map(function(w){return Array.isArray(w)?w:[w,"conf"];}),o,v.x);
}
(function(){
  try{
    if(typeof document!=="undefined"){var el=document.getElementById("fm-cours");if(el)loadCours(JSON.parse(el.textContent));}
    else if(typeof require!=="undefined"){loadCours(JSON.parse(require("fs").readFileSync(require("path").join(__dirname,"cours.json"),"utf8")));}
  }catch(e){if(typeof console!=="undefined")console.error("Questions de cours illisibles",e);}
})();

var ITEM_BY_ID={};
/* notions dont les calculs se prêtent à l’estimation au curseur (ordre de grandeur) */
var EST_OK={};["pct_de","coef_evol","ttc_ht","regle3","vitesse","aire_disque","volume_cyl","volume_pave","vol_pyramide","vol_sphere","moyenne","interets_composes","suite_geo","pyth_hyp","pyth_cote","echelle","grandeurs_comp","pb_commerce","pb_auto","pb_elec","pb_cuisine","perim_cercle","frac_de","indices","evol_succ","pct_inverse","seuil_rentab","esperance","moy_ponderee","stats_tab","conv_aire_vol"].forEach(function(k){EST_OK[k]=1;});
function indexBank(){ITEM_BY_ID={};BANK.forEach(function(it){ITEM_BY_ID[it.id]=it;});}
indexBank();

function makeQuestion(itemId,seed,ctx){
  var it=ITEM_BY_ID[itemId];if(!it)return null;
  for(var tries=0;tries<12;tries++){
    var r=mulberry32((seed+tries*7919)>>>0),q=null;
    try{q=it.gen(r,ctx||{});}catch(e){q=null;}
    if(q&&validQ(q)){
      q.id=it.id;q.d=it.d;q.titre=it.titre;q.chap=it.chap;
      if(EST_OK[it.id]&&!q.kind&&q.num!==undefined&&Math.abs(q.num)>=2)q.est=1;
      return q;
    }
  }
  return null;
}
function validQ(q){
  var k=q.kind||"qcm";
  if(k==="assoc")return q.L&&q.L.length>=2&&q.L.length<=5&&q.R.length===q.L.length;
  if(k==="ordre")return q.D&&q.D.length>=3&&q.D.length<=6;
  if(k==="slider")return q.sl&&q.sl.max>q.sl.min&&q.sl.ans>=q.sl.min&&q.sl.ans<=q.sl.max;
  return q.choices&&q.choices.length<=4&&(q.choices.length>=2||(q.only==="libre"&&q.choices.length===1));
}
/* n questions tirées dans la sélection, en alternant les items (jamais deux fois de suite le même).
   avoid = {texte:1} : questions déjà jouées récemment, évitées tant que c’est possible. */
function drawQuestions(itemIds,n,ctx,seed,avoid){
  if(!itemIds.length)return [];
  avoid=avoid||{};
  var r=mulberry32(seed>>>0),out=[],pool=[],last=null,seen={},guard=0;
  while(out.length<n&&guard++<n*25){
    if(!pool.length)pool=shuffle(r,itemIds);
    var idx=0;
    if(pool.length>1&&pool[0]===last)idx=1;
    var id=pool.splice(idx,1)[0];
    var q=null,fallback=null,tries=ITEM_BY_ID[id]&&ITEM_BY_ID[id].nvar?Math.max(30,ITEM_BY_ID[id].nvar*8):30;
    for(var k=0;k<tries&&!q;k++){
      var cand=makeQuestion(id,(seed+out.length*104729+k*7919+guard*31)>>>0,ctx);
      if(!cand||seen[cand.q])continue;
      if(ctx&&ctx.plain&&cand.kind){if(!fallback)fallback=cand;continue;}
      if(!avoid[cand.q])q=cand;else if(!fallback)fallback=cand;
    }
    if(!q)q=fallback;
    if(!q)continue;
    seen[q.q]=1;out.push(q);last=id;
  }
  return out;
}
/* durée : temps propre à la notion > réglage global > automatique (difficulté, saisie libre plus longue) */
function dureeQuestion(q,mode,libre){
  if(q.dur>0)return q.dur;
  if(TIMES[q.id]>0)return TIMES[q.id];
  if(mode&&mode>0)return mode;
  var base=q.d===1?15:q.d===3?30:20,k=q.kind;
  if(k==="assoc")return base+(q.L&&q.L.length>3?20:15);
  if(k==="ordre")return base+15;
  if(k==="slider")return base+5;
  if(q.qx||q.fig)base+=10;
  return libre?base+15:base;
}
/* arborescence niveaux > chapitres > items, pour la page prof */
function buildTree(){
  var tree=[];
  NIVEAUX.forEach(function(nv){
    var chaps=[],idx={};
    BANK.forEach(function(it){
      if(it.niv.indexOf(nv.id)<0||HIDDEN[it.id])return;
      if(idx[it.chap]===undefined){idx[it.chap]=chaps.length;chaps.push({nom:it.chap,items:[]});}
      chaps[idx[it.chap]].items.push(it);
    });
    tree.push({niv:nv,chaps:chaps});
  });
  return tree;
}

return {BANK:BANK,NIVEAUX:NIVEAUX,ITEM_BY_ID:ITEM_BY_ID,makeQuestion:makeQuestion,drawQuestions:drawQuestions,figHtml:figHtml,mulberry32:mulberry32,f:f,esc:esc,validQ:validQ};
