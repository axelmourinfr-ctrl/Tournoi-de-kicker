let players = [];
let matches = [];
let ranking = {};
let finalBracket = {};

// Ajouter joueur
function addPlayer() {
    let name = document.getElementById("playerName").value.trim();
    let role = document.getElementById("roleChoice").value;
    if (!name) return alert("Nom requis !");
    players.push({ name, role });
    document.getElementById("playerName").value = "";
    renderPlayers();
}

function renderPlayers() {
    let list = document.getElementById("playersList");
    list.innerHTML = "";
    players.forEach(p => {
        let li = document.createElement("li");
        li.textContent = p.name + " (" + p.role + ")";
        list.appendChild(li);
    });
}

// Générer matchs qualif
function generateQualifMatches() {
    if (players.length < 2) return alert("Pas assez de joueurs !");
    matches = [];
    let shuffled = [...players].sort(() => Math.random() - 0.5);
    if (shuffled.length % 2 === 1) {
        let bye = shuffled.pop();
        matches.push({ team1: [bye], team2: ["BYE"], scores: null });
    }
    for (let i = 0; i < shuffled.length; i += 2) {
        matches.push({ team1: [shuffled[i]], team2: [shuffled[i + 1]], scores: null });
    }
    renderQualifMatches();
}

function renderQualifMatches() {
    let div = document.getElementById("qualifMatches");
    div.innerHTML = "";
    matches.forEach((m, idx) => {
        let matchDiv = document.createElement("div");
        matchDiv.className = "match";
        if (m.team2[0] === "BYE") {
            matchDiv.innerHTML = m.team1[0].name + " passe (BYE)";
        } else {
            matchDiv.innerHTML = `
              ${m.team1[0].name} vs ${m.team2[0].name}<br>
              <input type="number" id="scoreA${idx}" min="0" max="11"> - 
              <input type="number" id="scoreB${idx}" min="0" max="11">
              <button onclick="validateMatch(${idx})">Valider</button>`;
        }
        div.appendChild(matchDiv);
    });
}

function validateMatch(i) {
    let match = matches[i];
    let sA = parseInt(document.getElementById("scoreA"+i).value);
    let sB = parseInt(document.getElementById("scoreB"+i).value);
    if (isNaN(sA) || isNaN(sB)) return alert("Scores requis !");
    if (sA !== 11 && sB !== 11) return alert("Un joueur doit atteindre 11 !");
    match.scores = [sA, sB];
    let winner = sA > sB ? match.team1[0].name : match.team2[0].name;
    let loser = sA < sB ? match.team1[0].name : match.team2[0].name;
    ranking[winner] = (ranking[winner] || { V:0, D:0 });
    ranking[winner].V++;
    ranking[loser] = (ranking[loser] || { V:0, D:0 });
    ranking[loser].D++;
    renderRanking();
}

function renderRanking() {
    let div = document.getElementById("ranking");
    div.innerHTML = "<table><tr><th>Joueur</th><th>Victoires</th><th>Défaites</th></tr>";
    for (let p in ranking) {
        div.innerHTML += `<tr><td>${p}</td><td>${ranking[p].V}</td><td>${ranking[p].D}</td></tr>`;
    }
    div.innerHTML += "</table>";
}

// Phase finale : génération bracket double élimination simplifié
function generateFinalBracket() {
    let nb = parseInt(document.getElementById("finalistsNumber").value);
    if (players.length < nb) return alert("Pas assez de joueurs inscrits !");
    let qualified = [...players].sort(() => Math.random() - 0.5).slice(0, nb);
    finalBracket = { WB: [], LB: [], Final: null };
    for (let i=0;i<nb;i+=2){
        finalBracket.WB.push({team1:qualified[i], team2:qualified[i+1], scores:null});
    }
    renderFinalBracket();
}

function renderFinalBracket(){
    let div = document.getElementById("finalBracket");
    div.innerHTML = "<h3>Winner Bracket</h3><table>";
    finalBracket.WB.forEach((m,idx)=>{
        div.innerHTML += `<tr><td>${m.team1.name}</td><td>vs</td><td>${m.team2.name}</td>
        <td><input id="wbA${idx}" type="number" min="0" max="11">-
        <input id="wbB${idx}" type="number" min="0" max="11">
        <button onclick="validateWB(${idx})">Valider</button></td></tr>`;
    });
    div.innerHTML += "</table>";
}

function validateWB(i){
    let m = finalBracket.WB[i];
    let sA = parseInt(document.getElementById("wbA"+i).value);
    let sB = parseInt(document.getElementById("wbB"+i).value);
    if (isNaN(sA)||isNaN(sB)) return;
    if (sA!==11 && sB!==11) return alert("Score à 11 requis");
    m.scores=[sA,sB];
    alert("Match WB"+(i+1)+" validé !");
}