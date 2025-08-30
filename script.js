// =====================
// Variables globales
// =====================
let players = [];
let matches = [];
let standings = {};
let currentRound = 0;
let finalsBracket = null;

// =====================
// Inscriptions
// =====================
function addPlayer() {
    const nameInput = document.getElementById("playerName");
    const roleInput = document.getElementById("playerRole");
    const name = nameInput.value.trim();
    const role = roleInput.value;

    if (name && !players.find(p => p.name === name)) {
        players.push({ name, role });
        standings[name] = { wins: 0, losses: 0, role: role };
        renderPlayers();
        nameInput.value = "";
    }
}

function renderPlayers() {
    const container = document.getElementById("playersList");
    container.innerHTML = "";
    players.forEach(p => {
        const li = document.createElement("div");
        li.textContent = `${p.name} (${p.role})`;
        container.appendChild(li);
    });
}

function resetTournament() {
    players = [];
    matches = [];
    standings = {};
    currentRound = 0;
    finalsBracket = null;
    document.getElementById("playersList").innerHTML = "";
    document.getElementById("qualifs").innerHTML = "";
    document.getElementById("standings").innerHTML = "";
    document.getElementById("finals").innerHTML = "";
}

// =====================
// Qualifications (DYP)
// =====================
function generateRound() {
    if (players.length < 4) {
        alert("Ajoute au moins 4 joueurs !");
        return;
    }

    currentRound++;
    let roundMatches = [];
    let shuffled = [...players].sort(() => Math.random() - 0.5);

    while (shuffled.length >= 4) {
        let p1 = shuffled.pop();
        let p2 = shuffled.pop();
        let p3 = shuffled.pop();
        let p4 = shuffled.pop();
        roundMatches.push([[p1, p2], [p3, p4]]);
    }

    matches.push(roundMatches);
    renderMatches();
}

function renderMatches() {
    const container = document.getElementById("qualifs");
    container.innerHTML = "";

    matches.forEach((round, rIndex) => {
        const roundDiv = document.createElement("div");
        roundDiv.innerHTML = `<h4>Manche ${rIndex + 1}</h4>`;

        round.forEach((match, mIndex) => {
            const matchDiv = document.createElement("div");
            matchDiv.classList.add("match");

            let team1 = match[0].map(p => `${p.name} (${p.role})`).join(" & ");
            let team2 = match[1].map(p => `${p.name} (${p.role})`).join(" & ");

            matchDiv.innerHTML = `
                <p>${team1} VS ${team2}</p>
                <div>
                    <input type="number" id="scoreA-${rIndex}-${mIndex}" value="0" min="0" max="11"> 
                    <span> - </span>
                    <input type="number" id="scoreB-${rIndex}-${mIndex}" value="0" min="0" max="11">
                    <button onclick="submitScore(${rIndex}, ${mIndex})">Valider</button>
                </div>
            `;

            roundDiv.appendChild(matchDiv);
        });

        container.appendChild(roundDiv);
    });
}

function submitScore(rIndex, mIndex) {
    const scoreA = parseInt(document.getElementById(`scoreA-${rIndex}-${mIndex}`).value);
    const scoreB = parseInt(document.getElementById(`scoreB-${rIndex}-${mIndex}`).value);

    if (scoreA !== 11 && scoreB !== 11) {
        alert("Un match se termine seulement quand une équipe atteint 11 points !");
        return;
    }

    let match = matches[rIndex][mIndex];
    let team1 = match[0];
    let team2 = match[1];

    if (scoreA === 11) {
        team1.forEach(p => standings[p.name].wins++);
        team2.forEach(p => standings[p.name].losses++);
    } else if (scoreB === 11) {
        team2.forEach(p => standings[p.name].wins++);
        team1.forEach(p => standings[p.name].losses++);
    }

    renderStandings();
}

// =====================
// Classement
// =====================
function renderStandings() {
    const container = document.getElementById("standings");
    container.innerHTML = "";

    let sorted = Object.entries(standings).sort((a, b) => b[1].wins - a[1].wins);

    sorted.forEach(([name, stats]) => {
        const div = document.createElement("div");
        div.textContent = `${name} — ${stats.role} — ${stats.wins}V/${stats.losses}D`;
        container.appendChild(div);
    });
}

// =====================
// Phase finale (Double élimination)
// =====================
function startFinals() {
    const n = parseInt(document.getElementById("finalistsNumber").value);
    let sorted = Object.entries(standings).sort((a, b) => b[1].wins - a[1].wins);
    let qualified = sorted.slice(0, n).map(([name, stats]) => ({ name, ...stats }));

    finalsBracket = { round: 1, matches: [] };

    for (let i = 0; i < qualified.length; i += 2) {
        finalsBracket.matches.push([[qualified[i]], [qualified[i + 1]]]);
    }

    renderFinals();
}

function renderFinals() {
    const container = document.getElementById("finals");
    container.innerHTML = `<h3>Tableau final</h3>`;

    finalsBracket.matches.forEach((match, i) => {
        let team1 = match[0].map(p => `${p.name}`).join(" & ");
        let team2 = match[1].map(p => `${p.name}`).join(" & ");

        const matchDiv = document.createElement("div");
        matchDiv.innerHTML = `
            <p>${team1} VS ${team2}</p>
            <div>
                <input type="number" id="fscoreA-${i}" value="0" min="0" max="11"> 
                <span> - </span>
                <input type="number" id="fscoreB-${i}" value="0" min="0" max="11">
                <button onclick="submitFinalScore(${i})">Valider</button>
            </div>
        `;
        container.appendChild(matchDiv);
    });
}

function submitFinalScore(mIndex) {
    const scoreA = parseInt(document.getElementById(`fscoreA-${mIndex}`).value);
    const scoreB = parseInt(document.getElementById(`fscoreB-${mIndex}`).value);

    if (scoreA !== 11 && scoreB !== 11) {
        alert("Un match se termine seulement quand une équipe atteint 11 points !");
        return;
    }

    alert(`Match ${mIndex + 1} terminé ! Vainqueur : ${scoreA === 11 ? "Équipe A" : "Équipe B"}`);
}
