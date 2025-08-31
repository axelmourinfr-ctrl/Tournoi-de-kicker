let players = [];
let qualifRound = 0;
let qualifMatches = [];
let stats = {};
let finals = null;

function el(id){ return document.getElementById(id); }
function shuffle(a){ return a.sort(()=>Math.random()-0.5); }
function ensurePlayerStats(name){
  if(!stats[name]) stats[name] = {W:0,D:0,GF:0,GA:0};
}
function updatePlayerStats(team, win, gf, ga){
  team.forEach(n=>{
    ensurePlayerStats(n);
    stats[n].GF += gf;
    stats[n].GA += ga;
    if(win) stats[n].W++; else stats[n].D++;
  });
}

function addPlayer(){
  const name = el('playerName').value.trim();
  const role = el('playerRole').value;
  if(!name) return alert('Nom requis');
  if(players.find(p=>p.name.toLowerCase()===name.toLowerCase())) return alert('Nom déjà utilisé');
  players.push({name, role});
  ensurePlayerStats(name);
  el('playerName').value = '';
  renderPlayers();
  renderRanking();
}

function renderPlayers(){
  const box = el('playersList');
  box.innerHTML = '';
  players.forEach(p=>{
    const span = document.createElement('span');
    span.className = 'pill';
    span.textContent = `${p.name} (${p.role})`;
    box.appendChild(span);
  });
}

function resetAll(){
  if(!confirm('Tout réinitialiser ?')) return;
  players = [];
  qualifRound = 0;
  qualifMatches = [];
  stats = {};
  finals = null;
  el('playersList').innerHTML = '';
  el('qualifMatches').innerHTML = '';
  el('roundInfo').textContent = '';
  el('ranking').innerHTML = '';
  el('finals').innerHTML = '';
}

// === Qualifications DYP 2v2 ===
function generateQualifRound(){
  if(players.length < 4) return alert('Au moins 4 joueurs pour 2 vs 2');
  qualifRound++;
  el('roundInfo').textContent = `Manche ${qualifRound}`;

  const A = players.filter(p=>p.role==='Attaquant').map(p=>p.name);
  const D = players.filter(p=>p.role==='Défenseur').map(p=>p.name);
  const X = players.filter(p=>p.role==='Polyvalent').map(p=>p.name);

  let poolA=[...A], poolD=[...D], poolX=[...X];
  shuffle(poolA); shuffle(poolD); shuffle(poolX);
  const unused = shuffle([...poolA, ...poolD, ...poolX]);

  let roundMatches = [];
  let taken = new Set();

  function pick(pref){
    if(pref==='A'){
      if(poolA.length) return poolA.pop();
      if(poolX.length) return poolX.pop();
    }else{
      if(poolD.length) return poolD.pop();
      if(poolX.length) return poolX.pop();
    }
    while(unused.length){
      const p = unused.pop();
      if(!taken.has(p)) return p;
    }
    return null;
  }

  while(true){
    let a1 = pick('A'); if(!a1) break; taken.add(a1);
    let d1 = pick('D'); if(!d1){ taken.delete(a1); break; } taken.add(d1);
    let a2 = pick('A'); if(!a2){ taken.delete(a1); taken.delete(d1); break; } taken.add(a2);
    let d2 = pick('D'); if(!d2){ taken.delete(a1); taken.delete(d1); taken.delete(a2); break; } taken.add(d2);

    roundMatches.push({round:qualifRound, teamA:[a1,d1], teamB:[a2,d2], scoreA:null, scoreB:null, done:false});
  }

  const allNames = players.map(p=>p.name);
  const byes = allNames.filter(n=>!taken.has(n));
  byes.forEach(n=>{ ensurePlayerStats(n); stats[n].W += 1; });

  qualifMatches.push(...roundMatches);
  renderQualifMatches(roundMatches, byes);
  renderRanking();
}

function renderQualifMatches(roundMatches, byes){
  const box = el('qualifMatches');
  const block = document.createElement('div');
  block.innerHTML = `<h3>Manche ${qualifRound}</h3>`;
  roundMatches.forEach((m, _) => {
    const idx = qualifMatches.indexOf(m);
    const id = `R${m.round}_${idx}`;
    const div = document.createElement('div');
    div.className = 'match';
    div.innerHTML = `
      <div class="teams">
        <div class="team"><span class="badge wb">Équipe A</span> ${m.teamA.join(' & ')}</div>
        <div class="team"><span class="badge wb">Équipe B</span> ${m.teamB.join(' & ')}</div>
        <div class="actions">
          <input type="number" id="A_${id}" min="0" max="11" placeholder="0" />
          <span>-</span>
          <input type="number" id="B_${id}" min="0" max="11" placeholder="0" />
          <button class="success" onclick="submitQualifScore('${id}')">Valider</button>
        </div>
      </div>`;
    block.appendChild(div);
  });
  if(byes && byes.length){
    const byed = document.createElement('div');
    byed.className = 'muted';
    byed.style.marginTop = '6px';
    byed.textContent = `BYE (victoire auto) : ${byes.join(', ')}`;
    block.appendChild(byed);
  }
  box.appendChild(block);
}

function findQualifById(id){
  const globalIndex = parseInt(id.split('_')[1],10);
  return qualifMatches[globalIndex];
}

function submitQualifScore(id){
  const m = findQualifById(id);
  if(!m || m.done) return;
  const a = parseInt(el('A_'+id).value||'0',10);
  const b = parseInt(el('B_'+id).value||'0',10);
  if(a<11 && b<11) return alert('Un score doit atteindre 11');
  m.scoreA=a; m.scoreB=b; m.done=true;

  const teamWin = a>b ? m.teamA : m.teamB;
  const teamLose = a>b ? m.teamB : m.teamA;
  updatePlayerStats(teamWin, true, Math.max(a,b), Math.min(a,b));
  updatePlayerStats(teamLose, false, Math.min(a,b), Math.max(a,b));

  el('A_'+id).disabled = true;
  el('B_'+id).disabled = true;
  renderRanking();
}

// === Classement ===
function renderRanking(){
  const rows = Object.entries(stats).map(([name, s])=>({name, ...s, GAve:(s.GF - s.GA)}));
  rows.sort((r1,r2)=>{
    if(r2.W!==r1.W) return r2.W-r1.W;
    const gd1=r1.GF-r1.GA, gd2=r2.GF-r2.GA;
    if(gd2!==gd1) return gd2-gd1;
    if(r2.GF!==r1.GF) return r2.GF-r1.GF;
    return r1.name.localeCompare(r2.name);
  });
  const htmlRows = rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.name}</td><td>${r.W}</td><td>${r.D}</td><td>${r.GF}</td><td>${r.GA}</td><td>${r.GF - r.GA}</td></tr>`).join('');
  el('ranking').innerHTML = `<table>
    <tr><th>Rang</th><th>Joueur</th><th>V</th><th>D</th><th>But+</th><th>But-</th><th>GA</th></tr>
    ${htmlRows}
  </table>`;
}

// === Phase Finale — Double Élimination simplifiée (rounds W/L) ===
function startFinals(){
  if(Object.keys(stats).length < 4) return alert('Pas assez de joueurs classés');
  let N = parseInt(el('finalistsNumber').value,10);
  const standing = Object.entries(stats).map(([name,s])=>({name, ...s}))
    .sort((a,b)=>{
      if(b.W!==a.W) return b.W-a.W;
      const gdA=a.GF-a.GA, gdB=b.GF-b.GA;
      if(gdB!==gdA) return gdB-gdA;
      return b.GF-a.GF;
    });
  if(N > standing.length) N = standing.length;
  if(N%4!==0) return alert('Le nombre de finalistes doit être un multiple de 4 (2 vs 2)');
  const finalists = standing.slice(0,N).map(x=>x.name);

  const shuffled = shuffle(finalists.slice());
  let teams = [];
  for(let i=0;i<shuffled.length;i+=2){ teams.push([shuffled[i], shuffled[i+1]]); }

  const teamCount = teams.length;
  if((teamCount & (teamCount-1))!==0) return alert('Nombre d\'équipes doit être une puissance de 2 (4,8,16...)');

  let WB = [[]]; // rounds[0] = W1
  for(let i=0;i<teamCount;i+=2){
    WB[0].push(makeMatch('W',1,teams[i],teams[i+1]));
  }
  finals = { teams, WB:{rounds:WB}, LB:{rounds:[]}, GF:[] };
  renderFinals();
}

function makeMatch(type, round, teamA, teamB){
  return { type, round, teamA, teamB, scoreA:null, scoreB:null, done:false };
}

function renderFinals(){
  const box = el('finals');
  let html = '';

  // WB
  html += `<h3>Winner Bracket</h3>`;
  finals.WB.rounds.forEach((roundMatches, idx)=>{
    const r = idx+1;
    html += `<div class="match"><div class="tag">W${r}</div>`;
    roundMatches.forEach((m, i)=>{
      const id = `W${r}_${i}`;
      html += `
      <div class="teams">
        <div class="team"><span class="badge wb">Équipe A</span> ${m.teamA.join(' & ')}</div>
        <div class="team"><span class="badge wb">Équipe B</span> ${m.teamB.join(' & ')}</div>
        <div class="actions">
          <input type="number" id="A_${id}" min="0" max="11" placeholder="0" ${m.done?'disabled':''}/>
          <span>-</span>
          <input type="number" id="B_${id}" min="0" max="11" placeholder="0" ${m.done?'disabled':''}/>
          <button class="success" onclick="submitFinalScore('${id}')">Valider</button>
        </div>
      </div>`;
    });
    html += `</div>`;
  });

  // LB
  html += `<h3>Loser Bracket</h3>`;
  if(!finals.LB.rounds.length){
    html += `<div class="muted">Aucun match pour le moment.</div>`;
  }else{
    finals.LB.rounds.forEach((roundMatches, idx)=>{
      const r = idx+1;
      html += `<div class="match"><div class="tag">L${r}</div>`;
      roundMatches.forEach((m, i)=>{
        const id = `L${r}_${i}`;
        html += `
        <div class="teams">
          <div class="team"><span class="badge lb">Équipe A</span> ${m.teamA.join(' & ')}</div>
          <div class="team"><span class="badge lb">Équipe B</span> ${m.teamB.join(' & ')}</div>
          <div class="actions">
            <input type="number" id="A_${id}" min="0" max="11" placeholder="0" ${m.done?'disabled':''}/>
            <span>-</span>
            <input type="number" id="B_${id}" min="0" max="11" placeholder="0" ${m.done?'disabled':''}/>
            <button class="warn" onclick="submitFinalScore('${id}')">Valider</button>
          </div>
        </div>`;
      });
      html += `</div>`;
    });
  }

  // GF
  if(finals.GF.length){
    html += `<h3>Grande Finale</h3>`;
    finals.GF.forEach((m, i)=>{
      const id = `F_${i+1}`;
      html += `<div class="match final">
        <div class="teams">
          <div class="team"><span class="badge final">WB</span> ${m.teamA.join(' & ')}</div>
          <div class="team"><span class="badge final">LB</span> ${m.teamB.join(' & ')}</div>
          <div class="actions">
            <input type="number" id="A_${id}" min="0" max="11" placeholder="0" ${m.done?'disabled':''}/>
            <span>-</span>
            <input type="number" id="B_${id}" min="0" max="11" placeholder="0" ${m.done?'disabled':''}/>
            <button class="success" onclick="submitFinalScore('${id}')">Valider</button>
          </div>
        </div>
      </div>`;
    });
  }

  box.innerHTML = html;
}

function submitFinalScore(id){
  const [prefix, idxStr] = id.split('_');
  const a = parseInt(el('A_'+id).value||'0',10);
  const b = parseInt(el('B_'+id).value||'0',10);
  if(a<11 && b<11) return alert('Un score doit atteindre 11');

  if(prefix[0]==='W'){
    const r = parseInt(prefix.slice(1),10);
    const i = parseInt(idxStr,10);
    const m = finals.WB.rounds[r-1][i];
    if(m.done) return;
    m.done = true; m.scoreA=a; m.scoreB=b;
    const win = a>b ? m.teamA : m.teamB;
    const lose = a>b ? m.teamB : m.teamA;

    // Avance gagnant en WB (round r+1)
    if(finals.WB.rounds.length < r+1) finals.WB.rounds.push([]);
    pushIntoRound(finals.WB.rounds[r], 'W', r+1, win);

    // Perdant vers LB au round r
    if(finals.LB.rounds.length < r) finals.LB.rounds.push([]);
    pushIntoRound(finals.LB.rounds[r-1], 'L', r, lose);

  }else if(prefix[0]==='L'){
    const r = parseInt(prefix.slice(1),10);
    const i = parseInt(idxStr,10);
    const m = finals.LB.rounds[r-1][i];
    if(m.done) return;
    m.done = true; m.scoreA=a; m.scoreB=b;
    const win = a>b ? m.teamA : m.teamB;
    // gagnant avance à L(r+1), perdant éliminé
    if(finals.LB.rounds.length < r+1) finals.LB.rounds.push([]);
    pushIntoRound(finals.LB.rounds[r], 'L', r+1, win);

  }else if(prefix[0]==='F'){
    const i = parseInt(idxStr,10)-1;
    const m = finals.GF[i];
    if(m.done) return;
    m.done = true; m.scoreA=a; m.scoreB=b;
    const winner = a>b ? m.teamA : m.teamB;
    if(i===0 && winner.join(',')===m.teamB.join(',')){
      // reset
      finals.GF.push({ type:'F', round:2, teamA:m.teamB, teamB:m.teamA, scoreA:null, scoreB:null, done:false });
    }else{
      alert(`Vainqueur du tournoi : ${winner.join(' & ')}`);
    }
  }

  maybeCreateFinals();
  renderFinals();
}

function pushIntoRound(roundArr, type, roundNum, team){
  // Place deux équipes par match
  if(roundArr.length === 0 || (roundArr[roundArr.length-1].teamB)){
    roundArr.push({ type, round:roundNum, teamA:team, teamB:null, scoreA:null, scoreB:null, done:false });
  }else{
    roundArr[roundArr.length-1].teamB = team;
  }
}

function maybeCreateFinals(){
  // WB champion
  let wbRounds = finals.WB.rounds;
  let wbChampion = null;
  for(let k=wbRounds.length-1;k>=0;k--){
    const r = wbRounds[k];
    if(r.length===1 && r[0].done){
      wbChampion = (r[0].scoreA > r[0].scoreB) ? r[0].teamA : r[0].teamB;
      break;
    }
  }
  // LB champion
  let lbRounds = finals.LB.rounds;
  let lbChampion = null;
  for(let k=lbRounds.length-1;k>=0;k--){
    const r = lbRounds[k];
    if(r.length===1 && r[0].done){
      lbChampion = (r[0].scoreA > r[0].scoreB) ? r[0].teamA : r[0].teamB;
      break;
    }
  }
  if(wbChampion && lbChampion && finals.GF.length===0){
    finals.GF.push({ type:'F', round:1, teamA: wbChampion, teamB: lbChampion, scoreA:null, scoreB:null, done:false });
  }
}
