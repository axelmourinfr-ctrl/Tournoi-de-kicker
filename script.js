let players = [];
let round = 0;
let matches = [];
let finalBracket = [];

// === Inscriptions ===
function addPlayer() {
  const name = document.getElementById("playerName").value.trim();
  const role = document.getElementById("playerRole").value;

  if (name === "") {
    alert("Veuillez entrer un nom de joueur");
    return;
  }

  players.push({ name, role, wins: 0, losses: 0 });
  document.getElementById("playerName").value = "";
  displayPlayers();
}

function displayPlayers() {
  const div = document.getElementById("playerList");
  div.innerHTML = "<h4>Joueurs inscrits :</h4>";
  players.forEach(p => {
    div.innerHTML += `<div>${p.name} (${p.role})</div>`;
  });
}

function resetTournament() {
  if (confirm("Réinitialiser le tournoi ?")) {
    players = [];
    round = 0;
    matches = [];
    finalBracket = [];
    document.getElementById("playerList").innerHTML = "";
    document.getElementById("qualifMatches").innerHTML = "";
    document.getElementById("ranking").innerHTML = "";
    document.getElementById("finalBracket").innerHTML = "";
  }
}

// === Qualifications DYP ===
function generateDYP() {
  if (players.length < 4) {
    alert("Il faut au moins 4 joueurs !");
    return;
  }
  round++;
  matches = [];

  let shuffled = [...players].sort(() => Math.random() - 0.5);
  while (shuffled.length >= 2) {
    let p1 = shuffled.pop();
    let p2 = shuffled.pop();
    matches.push([p1, p2]);
  }

  let div = document.getElementById("qualifMatches");
  div.innerHTML = `<h4>Manche ${round}</h4>`;
  matches.forEach((m, i) => {
    div.innerHTML += `<div>Match ${i + 1}: ${m[0].name} (${m[0].role}) & ${m[1].name} (${m[1].role})</div>`;
  });

  updateRanking();
}

function updateRanking() {
  let div = document.getElementById("ranking");
  div.innerHTML = "";
  players.forEach(p => {
    div.innerHTML += `<div>${p.name} — ${p.role} — ${p.wins}V/${p.losses}D</div>`;
  });
}

// === Phase finale double élimination ===
function startFinalPhase() {
  let num = parseInt(document.getElementById("numQualified").value);
  if (players.length < num) {
    alert("Pas assez de joueurs qualifiés !");
    return;
  }

  let qualified = [...players].sort(() => Math.random() - 0.5).slice(0, num);

  finalBracket = qualified.map(p => ({ ...p, status: "WB" }));
  displayFinalBracket();
}

function displayFinalBracket() {
  let div = document.getElementById("finalBracket");
  div.innerHTML = "<h3>Tableau final</h3>";

  finalBracket.forEach((team, i) => {
    div.innerHTML += `<div>Équipe ${i + 1}: ${team.name} (${team.role}) — [${team.status}]</div>`;
  });
}
