const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const game = {
    p: { x: 0, y: 0, hp: 100, maxHp: 100, atk: 20, gold: 0, lv: 1, pots: 1 },
    map: [], size: 7, floor: 1, logs: ["Bienvenue ! Trouve la sortie 🏁"],
    enemies: [
        { name: "Slime 💧", hp: 40, atk: 10, move: "Jet de boue 💩" },
        { name: "Orc 👹", hp: 80, atk: 18, move: "Coup de massue 🔨" },
        { name: "Dragon 🐲", hp: 150, atk: 30, move: "Souffle de foudre ⚡" }
    ],
    riddles: [
        { q: "J'ai des villes sans maisons, qui suis-je ?", a: "carte" },
        { q: "Plus j'ai de gardiens, moins je suis gardé.", a: "secret" },
        { q: "Je ne respire pas mais j'ai besoin d'air.", a: "feu" },
        { q: "Noir quand on l'achète, rouge quand on l'utilise.", a: "charbon" },
        { q: "On me prend sans me toucher.", a: "photo" }
    ],
    isBusy: false
};

function initMap() {
    game.map = Array.from({ length: game.size }, () => Array(game.size).fill('ᐧ'));
    ['👾', '🧩', '🧪', '💰'].forEach(icon => {
        for(let i=0; i<2; i++) {
            let rx = Math.floor(Math.random()*game.size), ry = Math.floor(Math.random()*game.size);
            if (rx+ry !== 0) game.map[ry][rx] = icon;
        }
    });
    game.map[game.size-1][game.size-1] = '🏁';
}

function draw(combatUI = "") {
    console.clear();
    console.log(`🏰 ÉTAGE: ${game.floor} | ❤️ HP: ${game.p.hp} | 💰: ${game.p.gold} | 🧪: ${game.p.pots}`);
    console.log("—".repeat(30));
    game.map.forEach((row, y) => {
        console.log(row.map((cell, x) => (x === game.p.x && y === game.p.y ? '🛡️' : cell)).join('  '));
    });
    console.log("—".repeat(30));
    if (combatUI) console.log(combatUI);
    else console.log(`💬 Log: ${game.logs[game.logs.length-1]}`);
    if (!game.isBusy) process.stdout.write("\n(Z,Q,S,D) > ");
}

async function fight() {
    game.isBusy = true;
    const enemy = { ...game.enemies[Math.min(game.floor - 1, 2)] };
    let combatLog = `Un ${enemy.name} bloque la route !`;

    while (enemy.hp > 0 && game.p.hp > 0) {
        draw(`⚔️ COMBAT : ${enemy.name} (HP: ${enemy.hp})\n${combatLog}\n\nActions: (1)🔥Lance-flamme (2)🛡️Défense (3)🦘Sauter (4)🧪Potion`);
        const choice = await new Promise(res => rl.question("Choix: ", res));

        let pDmg = game.p.atk + Math.floor(Math.random()*10);
        let eDmg = enemy.atk;
        combatLog = "";

        if (choice === '1') {
            enemy.hp -= pDmg;
            combatLog += `🔥 Tu lances un LANCE-FLAMME ! (-${pDmg} HP)\n`;
        } else if (choice === '2') {
            eDmg = Math.floor(eDmg * 0.3);
            combatLog += `🛡️ Tu te bloques derrière ton bouclier !\n`;
        } else if (choice === '3') {
            if (Math.random() > 0.4) { eDmg = 0; combatLog += `🦘 ESQUIVE RÉUSSIE ! L'attaque passe sous tes pieds !\n`; }
            else combatLog += `❌ Saut raté ! Tu retombes sur l'attaque...\n`;
        } else if (choice === '4' && game.p.pots > 0) {
            game.p.hp = Math.min(100, game.p.hp + 40); game.p.pots--;
            combatLog += `🧪 Soin +40 HP !\n`;
        }

        if (enemy.hp > 0 && eDmg > 0) {
            game.p.hp -= eDmg;
            combatLog += `⚠️ ${enemy.name} utilise ${enemy.move} (-${eDmg} HP)`;
        }
    }

    if (game.p.hp <= 0) { console.log("\n💀 Tu as péri..."); process.exit(); }
    game.p.gold += 50; game.p.atk += 5; game.isBusy = false;
    game.logs.push(`Victoire sur ${enemy.name} ! +50 Or / +5 ATK`);
}

async function riddle() {
    game.isBusy = true;
    const r = game.riddles[Math.floor(Math.random()*game.riddles.length)];
    draw(`🧩 ÉNIGME : ${r.q}`);
    const ans = await new Promise(res => rl.question("Ta réponse: ", res));
    if (ans.toLowerCase().includes(r.a)) {
        game.p.gold += 100; game.logs.push("💎 Énigme résolue ! +100 Or.");
    } else {
        game.p.hp -= 15; game.logs.push("❌ Erreur ! Le piège s'active (-15 HP).");
    }
    game.isBusy = false; draw();
}

async function move(d) {
    if (game.isBusy) return;
    let nx = game.p.x, ny = game.p.y;
    if (d==='z'&&ny>0) ny--; if (d==='s'&&ny<game.size-1) ny++;
    if (d==='q'&&nx>0) nx--; if (d==='d'&&nx<game.size-1) nx++;

    game.p.x = nx; game.p.y = ny;
    const tile = game.map[ny][nx];
    game.map[ny][nx] = 'ᐧ';

    if (tile === '👾') await fight();
    else if (tile === '🧩') await riddle();
    else if (tile === '🧪') { game.p.pots++; game.logs.push("🧪 Potion trouvée !"); }
    else if (tile === '💰') { game.p.gold += 40; game.logs.push("💰 Tu as trouvé de l'or !"); }
    else if (tile === '🏁') {
        game.floor++; game.p.hp = Math.min(100, game.p.hp + 30);
        game.p.x = 0; game.p.y = 0; initMap();
        game.logs.push("🚪 Étage suivant atteint !");
    }
    draw();
}

initMap();
draw();
rl.on('line', (input) => move(input.toLowerCase().trim()));
