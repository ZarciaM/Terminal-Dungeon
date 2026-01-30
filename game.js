const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const game = {
    player: { x: 0, y: 0, hp: 100, xp: 0, gold: 0, items: [], level: 1 },
    map: [],
    mapSize: 6,
    currentLevel: 1,
    enemies: [
        { name: "Gobelin", hp: 30, atk: 10, reward: 20 },
        { name: "Orc", hp: 60, atk: 15, reward: 50 },
        { name: "Dragon", hp: 120, atk: 25, reward: 200 }
    ],
    riddles: [
        { q: "Plus j'ai de gardiens, moins je suis gardé. Qui suis-je ?", a: "secret" },
        { q: "Je commence la nuit et finit le matin. Qui suis-je ?", a: "n" }
    ],
    isGameOver: false
};


function initMap() {
    game.map = Array.from({ length: game.mapSize }, () => Array(game.mapSize).fill('.'));

    const events = ['E', 'R', 'H'];
    for (let i = 0; i < 5; i++) {
        let rx = Math.floor(Math.random() * game.mapSize);
        let ry = Math.floor(Math.random() * game.mapSize);
        if (rx !== 0 || ry !== 0) game.map[ry][rx] = events[Math.floor(Math.random() * events.length)];
    }
    game.map[game.mapSize - 1][game.mapSize - 1] = 'S';
}

function draw() {
    console.clear();
    console.log(`--- NIVEAU ${game.currentLevel} | HP: ${game.player.hp} | Gold: ${game.player.gold} | XP: ${game.player.xp} ---`);
    for (let y = 0; y < game.mapSize; y++) {
        let row = "";
        for (let x = 0; x < game.mapSize; x++) {
            if (x === game.player.x && y === game.player.y) row += " P ";
            else row += ` ${game.map[y][x]} `;
        }
        console.log(row);
    }
    console.log("\n(Z: Haut, S: Bas, Q: Gauche, D: Droite)");
}


async function handleCombat() {
    const enemy = { ...game.enemies[Math.min(game.currentLevel - 1, 2)] };
    console.log(`\n⚔️ Un ${enemy.name} sauvage apparaît !`);

    while (enemy.hp > 0 && game.player.hp > 0) {
        enemy.hp -= 10 + (game.player.level * 5);
        if (enemy.hp > 0) game.player.hp -= enemy.atk;
        console.log(`${enemy.name}: ${enemy.hp}HP | Vous: ${game.player.hp}HP`);
    }

    if (game.player.hp <= 0) {
        game.isGameOver = true;
    } else {
        console.log(`🎉 Victoire ! +${enemy.reward} Gold.`);
        game.player.gold += enemy.reward;
        game.player.xp += 50;
    }
}

function handleRiddle() {
    return new Promise((resolve) => {
        const riddle = game.riddles[Math.floor(Math.random() * game.riddles.length)];
        rl.question(`\n🧩 ÉNIGME : ${riddle.q}\nRéponse : `, (answer) => {
            if (answer.toLowerCase().trim() === riddle.a) {
                console.log("💎 Correct ! +100 Gold.");
                game.player.gold += 100;
            } else {
                console.log("❌ Faux... Vous perdez 10 HP.");
                game.player.hp -= 10;
            }
            resolve();
        });
    });
}

async function movePlayer(dir) {
    let nx = game.player.x, ny = game.player.y;
    if (dir === 'z' && ny > 0) ny--;
    if (dir === 's' && ny < game.mapSize - 1) ny++;
    if (dir === 'q' && nx > 0) nx--;
    if (dir === 'd' && nx < game.mapSize - 1) nx++;

    game.player.x = nx; game.player.y = ny;
    const cell = game.map[ny][nx];

    if (cell === 'E') {
        await handleCombat();
        game.map[ny][nx] = '.';
    } else if (cell === 'R') {
        await handleRiddle();
        game.map[ny][nx] = '.';
    } else if (cell === 'H') {
        console.log("❤️ Vous trouvez une potion ! +20 HP.");
        game.player.hp = Math.min(100, game.player.hp + 20);
        game.map[ny][nx] = '.';
    } else if (cell === 'S') {
        console.log("🏁 Passage au niveau suivant !");
        game.currentLevel++;
        game.player.x = 0; game.player.y = 0;
        initMap();
    }

    if (game.player.hp <= 0) {
        console.log("\n💀 GAME OVER. Vous avez péri dans le donjon.");
        process.exit();
    }

    draw();
}


initMap();
draw();

rl.on('line', (input) => {
    const cmd = input.toLowerCase().trim();
    if (['z', 'q', 's', 'd'].includes(cmd)) {
        movePlayer(cmd);
    }
});
