const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });


const game = {
    p: { x: 0, y: 0, hp: 100, maxHp: 100, atk: 15, gold: 0, lv: 1, potions: 1 },
    map: [], size: 7, level: 1,
    enemies: [
        { name: "Slime 💧", hp: 40, atk: 8, gold: 30 },
        { name: "Squelette 💀", hp: 70, atk: 15, gold: 60 },
        { name: "Démon 👹", hp: 150, atk: 25, gold: 150 }
    ],
    riddles: [{ q: "J'ai des villes mais pas de maisons. Qui suis-je ?", a: "carte" }],
    isBusy: false
};

function initMap() {
    game.map = Array.from({ length: game.size }, () => Array(game.size).fill('ᐧ'));
    ['👾', '🧩', '🧪', '💰'].forEach(icon => {
        for(let i=0; i<3; i++) {
            let rx = Math.floor(Math.random()*game.size), ry = Math.floor(Math.random()*game.size);
            if (rx+ry !== 0) game.map[ry][rx] = icon;
        }
    });
    game.map[game.size-1][game.size-1] = '🏁';
}

function draw(msg = "") {
    console.clear();
    console.log(`🏰 NODE KNIGHT | Étage: ${game.level} | ❤️ HP: ${game.p.hp}/${game.p.maxHp} | 💪 ATK: ${game.p.atk} | 💰 Or: ${game.p.gold} | 🧪: ${game.p.potions}`);
    console.log("=" .repeat(40));
    game.map.forEach((row, y) => {
        console.log(row.map((cell, x) => (x === game.p.x && y === game.p.y ? '⚔️' : cell)).join('  '));
    });
    if (msg) console.log(`\n💬 ${msg}`);
    if (!game.isBusy) console.log("\n(Z: Haut, S: Bas, Q: Gauche, D: Droite) -> Appuie sur Entrée");
}

async function fight() {
    game.isBusy = true;
    const enemy = { ...game.enemies[Math.min(game.level - 1, 2)] };
    let effectMsg = `Un ${enemy.name} bloque la route !`;

    while (enemy.hp > 0 && game.p.hp > 0) {
        draw(`${effectMsg}\n${enemy.name}: ❤️ ${enemy.hp} HP\n\nActions: (1) Attaquer (2) Défendre (3) Potion`);
        const choice = await new Promise(res => rl.question("Ton choix: ", res));

        let pDamage = game.p.atk + Math.floor(Math.random() * 5);
        let eDamage = enemy.atk;
        effectMsg = "";

        if (choice === '1') {
            enemy.hp -= pDamage;
            effectMsg += `💥 Tu infliges ${pDamage} dégâts ! `;
        } else if (choice === '2') {
            eDamage = Math.floor(eDamage / 3);
            effectMsg += `🛡️ Tu te protèges ! `;
        } else if (choice === '3' && game.p.potions > 0) {
            game.p.hp = Math.min(game.p.maxHp, game.p.hp + 40);
            game.p.potions--;
            effectMsg += `🧪 Potion bue ! +40 HP. `;
        }

        if (enemy.hp > 0) {
            game.p.hp -= eDamage;
            effectMsg += `\n${enemy.name} t'inflige ${eDamage} dégâts !`;
        }
    }

    if (game.p.hp <= 0) { console.log("💀 Tu es mort..."); process.exit(); }
    game.p.gold += enemy.gold;
    game.p.atk += 2;
    game.isBusy = false;
    draw(`✨ Victoire ! Tu as ramassé ${enemy.gold} or et gagné en force !`);
}

async function riddle() {
    game.isBusy = true;
    const r = game.riddles[0];
    const ans = await new Promise(res => rl.question(`🧩 ENIGME: ${r.q}\nRéponse: `, res));
    if (ans.toLowerCase().includes(r.a)) {
        game.p.gold += 100;
        draw("💎 Bravo ! +100 Or.");
    } else {
        game.p.hp -= 20;
        draw("❌ Raté ! Le piège t'inflige 20 dégâts.");
    }
    game.isBusy = false;
}

async function move(d) {
    if (game.isBusy) return;
    let nx = game.p.x, ny = game.p.y;
    if (d === 'z' && ny > 0) ny--; if (d === 's' && ny < game.size-1) ny++;
    if (d === 'q' && nx > 0) nx--; if (d === 'd' && nx < game.size-1) nx++;

    game.p.x = nx; game.p.y = ny;
    const tile = game.map[ny][nx];
    game.map[ny][nx] = 'ᐧ';

    if (tile === '👾') await fight();
    else if (tile === '🧩') await riddle();
    else if (tile === '🧪') { game.p.potions++; draw("🧪 Tu trouves une potion !"); }
    else if (tile === '💰') { game.p.gold += 50; draw("💰 Un sac d'or ! +50"); }
    else if (tile === '🏁') {
        game.level++; game.p.maxHp += 20; game.p.hp = game.p.maxHp;
        game.p.x = 0; game.p.y = 0; initMap();
        draw("🚪 Étage suivant ! Tes PV sont restaurés.");
    } else draw();
}

initMap();
draw("Bienvenue dans Terminal Dungeon !");
rl.on('line', (input) => move(input.toLowerCase().trim()));
