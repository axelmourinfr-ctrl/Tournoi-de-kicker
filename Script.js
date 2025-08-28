let attaquants = [];
let defenseurs = [];
let qualifies = [];
let tableauGagnants = [];
let tableauPerdants = [];
let currentMatch = null;
let matchNum = 1;
let historique = [];
let classement = {};

function enregistrerParticipants() {
    attaquants = document.getElementById("attaquants").value.split(",").map(a => a.trim()).filter(a=>a);
    defenseurs = document.getElementById("defenseurs").value.split(",").map(d => d.trim()).filter(d=>d);
    attaquants.forEach(a => classement[a]=0);
    alert(`${attaquants.length} attaquants et ${defenseurs.length} défenseurs enregistrés.`);
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function genererDYP() {
    let nbEquipes = Math.min(attaquants.length, defenseurs.length);
    let attShuffle = shuffle([...attaquants]);
    let defShuffle = shuffle([...defenseurs]);
    let html = "<ul>";
    for(let i=0;i<nbEquipes;i++){
        html += `<li>Équipe ${i+1}: Attaquant ${attShuffle[i]} - Défenseur ${defShuffle[i]}</li>`;
    }
    html += "</ul>";
    document.getElementById("dypResult").innerHTML = html;
}

function demarrerFinale() {
    qualifies = shuffle(attaquants.slice(0,8));
    tableauGagnants = [];
    for(let i=0;i<8;i+=2){
        tableauGagnants.push([{attaquant: qualifies[i], defenseur:null},{attaquant: qualifies[i+1], defenseur:null}]);
    }
    tableauPerdants = [];
    matchNum = 1;
    afficherMatch();
}

function afficherMatch() {
    let container = document.getElementById("matchActuel");
    if(tableauGagnants.length >=2){
        let match = tableauGagnants.splice(0,2);
        currentMatch = [match[0][0], match[1][0]];
        currentMatch[0].defenseur = shuffle(defenseurs)[0];
        currentMatch[1].defenseur = shuffle(defenseurs)[0];
    } else if(tableauPerdants.length >=2){
        let match = tableauPerdants.splice(0,2);
        currentMatch = [match[0][0], match[1][0]];
        currentMatch[0].defenseur = shuffle(defenseurs)[0];
        currentMatch[1].defenseur = shuffle(defenseurs)[0];
    } else{
        container.innerHTML = "Tournoi terminé !";
        return;
    }
    container.innerHTML = `
        <p>Match ${matchNum}</p>
        <p>Équipe A : ${currentMatch[0].attaquant} - Défenseur : ${currentMatch[0].defenseur}</p>
        <p>Équipe B : ${currentMatch[1].attaquant} - Défenseur : ${currentMatch[1].defenseur}</p>
        <label>Score A:</label><input id="scoreA" type="number" value=0>
        <label>Score B:</label><input id="scoreB" type="number" value=0>
        <button onclick="validerScore()">Valider Score</button>
    `;
}

function validerScore(){
    let scoreA = parseInt(document.getElementById("scoreA").value);
    let scoreB = parseInt(document.getElementById("scoreB").value);
    let matchA = currentMatch[0];
    let matchB = currentMatch[1];
    let winner, loser;
    if(scoreA>scoreB){winner=matchA; loser=matchB;} else {winner=matchB; loser=matchA;}
    [winner.defenseur, loser.defenseur] = [loser.defenseur, winner.defenseur]; // inversion
    tableauGagnants.push([winner]);
    tableauPerdants.push([loser]);
    historique.push({matchNum, A:matchA.attaquant, B:matchB.attaquant, scoreA, scoreB, winner:winner.attaquant});
    classement[winner.attaquant] +=1;
    matchNum++;
    afficherMatch();
    afficherClassement();
}

function afficherClassement(){
    let html = "<ul>";
    let sorted = Object.entries(classement).sort((a,b)=>b[1]-a[1]);
    sorted.forEach(([joueur, pts])=>{
        html += `<li>${joueur} : ${pts} victoire(s)</li>`;
    });
    html += "</ul>";
    document.getElementById("classementTable").innerHTML = html;
}
