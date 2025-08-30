/* =========================
   Données globales & utilitaires
========================= */
const participants = []; // {name, role: 'A'|'D'|'B'}
let classement = {};     // name -> victoires (qualifs)
let qualifsHistorique = [];
let finaleHistorique = [];

let dypTeams = [];       // [{A,D}]
let dypQueueMatches = [];

let qualifies = [];      // noms choisis pour la finale (modifiable)
let equipesFinale = [];  // [{attaquant, defenseur, note}]
let fileGagnants = [];   // queue of teams
let filePerdants = [];   // queue of teams
let matchEnCours = null; // {A,B,table: 'gagnants'|'perdants'}

const $ = id => document.getElementById(id);
const shuffleInPlace = arr => arr.sort(()=>Math.random()-0.5);

/* =========================
   UI — Participants
========================= */
function renderParticipants(){
  const box = $("listeParticipants");
  if(!participants.length){
    box.innerHTML = `<p class="small">Aucun participant pour l'instant.</p>`;
    return;
  }
  box.innerHTML = `<div class="list">` + participants.map(p=>`
    <div class="card">
      <b>${p.name}</b> <span class="badge">${p.role==='A'?'Attaquant': p.role==='D'?'Défenseur':'Les deux'}</span>
    </div>`).join("") + `</div>`;
}

function addParticipant(){
  const name = $("nomJoueur").value.trim();
  const role = $("roleJoueur").value;
  if(!name) return alert("Entre un nom.");
  if(participants.find(p=>p.name.toLowerCase()===name.toLowerCase())) return alert("Nom déjà inscrit.");
  participants.push({name, role});
  if(!(name in classement)) classement[name] = 0;
  $("nomJoueur").value="";
  renderParticipants(); renderClassement();
}

/* Reset complet */
function resetTournoi(){
  if(!confirm("Réinitialiser le tournoi ? Toutes les données seront perdues.")) return;
  participants.length = 0;
  classement = {}; qualifsHistorique = []; finaleHistorique = [];
  dypTeams = []; dypQueueMatches = [];
  qualifies = []; equipesFinale = []; fileGagnants = []; filePerdants = []; matchEnCours = null;
  $("listeParticipants").innerHTML = ""; $("dypEquipes").innerHTML = ""; $("zoneMatchQualif").innerHTML = "";
  $("historiqueQualifs").innerHTML = ""; $("tableClassement").innerHTML = ""; $("qualifiesList").innerHTML = "";
  $("equipesFinale").innerHTML = ""; $("zoneMatchFinale").innerHTML = ""; $("historiqueFinale").innerHTML = "";
  $("winnerItems").innerHTML = ""; $("loserItems").innerHTML = "";
  $("ajoutQualifie").value = ""; $("nbQualifies").value = 8; $("nomJoueur").value = "";
}

/* =========================
   Qualifs DYP
========================= */
function genererMancheDYP(){
  if(participants.length < 2) return alert("Ajoute des participants d'abord.");

  const A = participants.filter(p=>p.role==='A').map(p=>p.name);
  const D = participants.filter(p=>p.role==='D').map(p=>p.name);
  const B = participants.filter(p=>p.role==='B').map(p=>p.name);
  shuffleInPlace(A); shuffleInPlace(D); shuffleInPlace(B);

  const teams = [];
  // pairer A+D
  while(A.length && D.length){
    teams.push({A:A.pop(), D:D.pop()});
  }
  // compléter rôles manquants avec B
  while(A.length && B.length){
    teams.push({A:A.pop(), D:B.pop()});
  }
  while(D.length && B.length){
    teams.push({A:B.pop(), D:D.pop()});
  }

  // ceux restants deviennent BYE
  const byes = [...A, ...D, ...B];

  dypTeams = teams;
  dypQueueMatches = teams.map(t=>({A:t.A, D:t.D}));
  // rendu
  const list = teams.map((t,i)=>`<div class="team"><b>Équipe ${i+1}</b><br/>Attaquant: ${t.A}<br/>Défenseur: ${t.D}</div>`).join("");
  const byesHTML = byes.length ? `<p class="small">BYE (repos) : ${byes.join(", ")}</p>` : `<p class="small">Aucun bye 🎉</p>`;
  $("dypEquipes").innerHTML = `<div class="list">${list || '<p class="small">Aucune équipe.</p>'}</div>${byesHTML}
    <div class="actions" style="margin-top:8px"><button onclick="prochainMatchQualif()">Jouer le prochain match</button></div>`;
  $("zoneMatchQualif").innerHTML = "";
}

function prochainMatchQualif(){
  if(!dypQueueMatches.length){
    $("zoneMatchQualif").innerHTML = `<p class="small">Plus de match à jouer pour cette manche.</p>`; return;
  }
  const m = dypQueueMatches.shift();
  $("zoneMatchQualif").innerHTML = `
    <div class="grid2">
      <div class="team"><b>Équipe A</b><br/>Att: ${m.A}<br/>Def: ${m.D}</div>
      <div class="team"><b>Équipe B</b><br/>(tirée au hasard)</div>
    </div>
    <div class="row" style="margin-top:8px">
      <label>Score A</label><input id="qScoreA" type="number" value="1" min="0" />
      <label>Score B</label><input id="qScoreB" type="number" value="0" min="0" />
      <button onclick="validerScoreQualif('${m.A}','${m.D}')">Valider</button>
    </div>
    <p class="small">L'adversaire est pris parmi les autres équipes de la manche (ou miroir si vide).</p>`;
}

function validerScoreQualif(A1,D1){
  const sA = parseInt($("qScoreA").value,10)||0;
  const sB = parseInt($("qScoreB").value,10)||0;
  // adversaire : première équipe restante (ou miroir)
  let adversaire = dypTeams.find(t => !(t.A===A1 && t.D===D1));
  if(!adversaire) adversaire = {A:A1, D:D1};
  const A2 = adversaire.A, D2 = adversaire.D;
  const winnerIsFirst = sA >= sB;
  const winners = winnerIsFirst ? [A1, D1] : [A2, D2];
  winners.forEach(n => { if(n in classement) classement[n] += 1; });
  qualifsHistorique.unshift({A1,D1,A2,D2,sA,sB,winner: winnerIsFirst?`${A1}/${D1}`:`${A2}/${D2}`});
  renderClassement(); renderHistoriqueQualifs();
  $("zoneMatchQualif").innerHTML = `<p class="small">Score enregistré — Vainqueur : <b>${winnerIsFirst?A1+'/'+D1:A2+'/'+D2}</b></p>`;
}

/* =========================
   Classement & historique qualifs
========================= */
function renderClassement(){
  const box = $("tableClassement");
  const keys = Object.keys(classement);
  if(!keys.length){ box.innerHTML = `<p class="small">Aucun score pour l'instant.</p>`; return; }
  const sorted = Object.entries(classement).sort((a,b)=>b[1]-a[1]);
  box.innerHTML = `<div class="list">` + sorted.map(([name,pts])=>`<div class="card"><b>${name}</b> — ${pts} victoire(s)</div>`).join("") + `</div>`;
}

function renderHistoriqueQualifs(){
  $("historiqueQualifs").innerHTML = `<h3>Historique qualifs</h3>
    <div class="list">${qualifsHistorique.map((m,i)=>`<div class="card small">Manche ${i+1} — ${m.A1}/${m.D1} ${m.sA}-${m.sB} ${m.A2}/${m.D2} | Gagnant: <b>${m.winner}</b></div>`).join("")}</div>`;
}

/* =========================
   Selection qualifiés
========================= */
function autoChoisirQualifies(){
  const n = Math.max(2, parseInt($("nbQualifies").value,10)||8);
  const sorted = Object.entries(classement).sort((a,b)=>b[1]-a[1]).map(([name])=>name);
  const pool = sorted.length ? [...sorted] : participants.map(p=>p.name);
  const choisis = [];
  for(let i=0;i<pool.length && choisis.length<n;i++) choisis.push(pool[i]);
  if(choisis.length<n){
    const reste = participants.map(p=>p.name).filter(x=>!choisis.includes(x));
    shuffleInPlace(reste);
    while(choisis.length<n && reste.length) choisis.push(reste.pop());
  }
  qualifies = choisis;
  renderQualifiesList();
}

function addQualifieManuel(){
  const nm = $("ajoutQualifie").value.trim(); if(!nm) return;
  if(!qualifies.includes(nm)) qualifies.push(nm);
  $("ajoutQualifie").value = ""; renderQualifiesList();
}
function renderQualifiesList(){
  $("qualifiesList").innerHTML = `<div class="list">${qualifies.map(q=>`<div class="card">${q}</div>`).join("") || '<p class="small">Aucun qualifié.</p>'}</div>`;
}

/* =========================
   Phase finale : formation équipes + bracket double élimination
========================= */
function demarrerFinale(){
  if(qualifies.length < 2) return alert("Il faut au moins 2 qualifiés.");
  // Former paires aléatoires
  const pool = [...qualifies]; shuffleInPlace(pool);
  equipesFinale = [];
  for(let i=0;i<pool.length;i+=2){
    if(!pool[i+1]) break;
    const n1 = pool[i], n2 = pool[i+1];
    const p1 = participants.find(p=>p.name===n1) || {role:'B'};
    const p2 = participants.find(p=>p.name===n2) || {role:'B'};
    let attaquant=null, defenseur=null, note="";
    const r1 = p1.role, r2 = p2.role;
    // respecter A+D quand possible, sinon B comble, sinon note à définir
    if((r1==='A' && r2==='D') || (r1==='D' && r2==='A')){
      attaquant = r1==='A' ? n1 : n2;
      defenseur = r1==='D' ? n1 : n2;
    } else if(r1==='A' && r2==='B'){ attaquant = n1; defenseur = n2; }
    else if(r2==='A' && r1==='B'){ attaquant = n2; defenseur = n1; }
    else if(r1==='D' && r2==='B'){ attaquant = n2; defenseur = n1; }
    else if(r2==='D' && r1==='B'){ attaquant = n1; defenseur = n2; }
    else { attaquant = n1; defenseur = n2; note = "Rôles à définir (A/D)"; }
    equipesFinale.push({attaquant, defenseur, note});
  }

  // Initialiser winner bracket (toutes les équipes)
  fileGagnants = equipesFinale.map(t=>({...t}));
  filePerdants = [];
  finaleHistorique = [];
  renderEquipesFinale();
  renderQueues();
  renderNextFinaleMatch();
}

function renderEquipesFinale(){
  $("equipesFinale").innerHTML = `<div class="list">${equipesFinale.map((t,i)=>`<div class="team"><b>Équipe ${i+1}</b><br/>Att: ${t.attaquant}<br/>Def: ${t.defenseur}${t.note?`<div class="small">${t.note}</div>`:''}</div>`).join("")}</div>`;
}

/* afficher queues */
function renderQueues(){
  $("winnerItems").innerHTML = fileGagnants.map((t,i)=>`<div class="card small">#${i+1} ${t.attaquant}/${t.defenseur}</div>`).join("");
  $("loserItems").innerHTML  = filePerdants.map((t,i)=>`<div class="card small">#${i+1} ${t.attaquant}/${t.defenseur}</div>`).join("");
}

/* Obtenir prochain match : priorité winner queue, sinon loser queue */
function renderNextFinaleMatch(){
  if(fileGagnants.length >= 2){
    const A = fileGagnants.shift();
    const B = fileGagnants.shift();
    matchEnCours = {A,B,table:'gagnants'};
  } else if(filePerdants.length >= 2){
    const A = filePerdants.shift();
    const B = filePerdants.shift();
    matchEnCours = {A,B,table:'perdants'};
  } else {
    $("zoneMatchFinale").innerHTML = `<p class="small">Finale terminée ou en attente d'équipes.</p>`;
    renderQueues(); return;
  }

  $("zoneMatchFinale").innerHTML = `
    <div class="grid2">
      <div class="team"><b>Équipe A</b><br/>Att: ${matchEnCours.A.attaquant}<br/>Def: ${matchEnCours.A.defenseur}</div>
      <div class="team"><b>Équipe B</b><br/>Att: ${matchEnCours.B.attaquant}<br/>Def: ${matchEnCours.B.defenseur}</div>
    </div>
    <div class="row" style="margin-top:8px">
      <label>Score A</label><input id="fScoreA" type="number" value="0" min="0" />
      <label>Score B</label><input id="fScoreB" type="number" value="0" min="0" />
      <button onclick="validerFinaleMatch()">Valider (score)</button>
      <button onclick="forceWinner('A')">Équipe A gagne</button>
      <button onclick="forceWinner('B')">Équipe B gagne</button>
    </div>
    <p class="small">Après validation : les <b>défenseurs s’échangent</b> entre les deux équipes pour leur prochain match.</p>
  `;
  renderQueues();
}

function validerFinaleMatch(){
  const sA = parseInt($("fScoreA").value,10)||0;
  const sB = parseInt($("fScoreB").value,10)||0;
  const winnerSide = sA >= sB ? 'A' : 'B';
  applyFinalMatchResult(winnerSide, sA, sB);
}
function forceWinner(side){
  const sA = side==='A' ? 1 : 0;
  const sB = side==='B' ? 1 : 0;
  applyFinalMatchResult(side, sA, sB);
}

function applyFinalMatchResult(winnerSide, sA, sB){
  const A = matchEnCours.A, B = matchEnCours.B;
  const winner = winnerSide==='A' ? A : B;
  const loser  = winnerSide==='A' ? B : A;

  // échange croisé des défenseurs
  const tmp = winner.defenseur; winner.defenseur = loser.defenseur; loser.defenseur = tmp;

  // Gestion des queues selon bracket
  if(matchEnCours.table === 'gagnants'){
    // winner retourne au bas du winner queue (prochaine ronde)
    fileGagnants.push(winner);
    // loser descend dans loser queue
    filePerdants.push(loser);
  } else { // match des perdants
    // winner réintègre la filePerdants pour continuer, loser éliminé (n'est pas repoussé)
    filePerdants.push(winner);
    // (le loser est éliminé et n'est pas ré-ajouté)
  }

  finaleHistorique.unshift({
    table: matchEnCours.table,
    Aatt: A.attaquant, Adef: A.defenseur,
    Batt: B.attaquant, Bdef: B.defenseur,
    sA, sB, winner: winner.attaquant + '/' + winner.defenseur
  });

  renderHistoriqueFinale();
  renderQueues();
  // préparation prochain match
  matchEnCours = null;
  // Si on a atteint une situation de finale entre winner queue (1) et loser queue (1), la logique ci-dessus
  // continuera de produire le prochain match correctement. Si la loser team bat la winner team en finale,
  // on pourrait ici implémenter une "reset match" en réinsérant les deux équipes pour rejouer.
  // Pour simplicité, on considère la logique FIFO : si la finale doit être rejouée, tu relances manuellement
  // un nouveau match quand il reste deux équipes (ou on peut ajouter la règle de reset ci-dessous).
  // Avancer
  setTimeout(renderNextFinaleMatch, 200);
}

/* reset final / adaptation : si tu veux une règle "reset final" :
   - quand il ne reste qu'une équipe en winner queue et qu'une seule en loser queue,
     leur match est joué ; si loser gagne, on peut créer un match supplémentaire (reset).
   (implémentation plus complète possible si tu veux) */

function renderHistoriqueFinale(){
  $("historiqueFinale").innerHTML = `<div class="list">${finaleHistorique.map((m,i)=>`<div class="card small">Match ${i+1} [${m.table}] — A(${m.Aatt}/${m.Adef}) ${m.sA}-${m.sB} B(${m.Batt}/${m.Bdef}) | Vainqueur: <b>${m.winner}</b></div>`).join("")}</div>`;
}

/* =========================
   Initialisation écouteurs
========================= */
window.addEventListener("DOMContentLoaded", ()=>{
  $("btnAdd").addEventListener("click", addParticipant);
  $("btnReset").addEventListener("click", resetTournoi);
  $("btnGenDYP").addEventListener("click", genererMancheDYP);
  $("btnChoisirQualifies").addEventListener("click", autoChoisirQualifies);
  $("btnAddQualifie").addEventListener("click", addQualifieManuel);
  $("btnStartFinale").addEventListener("click", demarrerFinale);

  renderParticipants(); renderClassement();
});
