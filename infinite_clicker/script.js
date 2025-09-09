document.addEventListener('DOMContentLoaded', () => {
    // Game state
    let score = 0;
    let mineralsPerClick = 1;
    let mineralsPerSecond = 0;

    // DOM Elements
    const scoreDisplay = document.getElementById('score');
    const mpsDisplay = document.getElementById('mps');
    const asteroid = document.getElementById('asteroid');
    const upgradesList = document.getElementById('upgrades-list');
    const clickerZone = document.getElementById('clicker-zone');

    // Upgrades definition
    const upgrades = [
        {
            id: 'reinforced-drill',
            name: 'Reinforced Drill',
            cost: 15,
            power: 1,
            type: 'click',
            level: 0,
            description: 'Increases minerals per click.'
        },
        {
            id: 'mining-drone',
            name: 'Mining Drone',
            cost: 50,
            power: 1,
            type: 'auto',
            level: 0,
            description: 'Automatically mines 1 mineral/sec.'
        },
        {
            id: 'drone-swarm',
            name: 'Drone Swarm',
            cost: 250,
            power: 5,
            type: 'auto',
            level: 0,
            description: 'Adds 5 minerals/sec.'
        },
        {
            id: 'planet-cracker-laser',
            name: 'Planet Cracker Laser',
            cost: 1200,
            power: 50,
            type: 'click',
            level: 0,
            description: 'Massively increases click power.'
        },
        {
            id: 'space-freighter',
            name: 'Space Freighter',
            cost: 5000,
            power: 100,
            type: 'auto',
            level: 0,
            description: 'Adds 100 minerals/sec.'
        }
    ];

    // Update score and upgrade buttons display
    function updateDisplay() {
        scoreDisplay.textContent = Math.floor(score).toLocaleString();
        mpsDisplay.textContent = mineralsPerSecond.toLocaleString();
        
        upgrades.forEach(upgrade => {
            const upgradeEl = document.getElementById(upgrade.id);
            if (score >= upgrade.cost) {
                upgradeEl.classList.remove('disabled');
            } else {
                upgradeEl.classList.add('disabled');
            }
        });
    }

    // Handle clicking the asteroid
    function mineAsteroid(event) {
        score += mineralsPerClick;
        createFloatingText(mineralsPerClick, event.clientX, event.clientY);
        updateDisplay();
    }

    function createFloatingText(amount, x, y) {
        const floatingText = document.createElement('div');
        floatingText.classList.add('floating-text');
        floatingText.textContent = `+${amount.toLocaleString()}`;

        const rect = clickerZone.getBoundingClientRect();
        floatingText.style.left = `${x - rect.left - 20}px`;
        floatingText.style.top = `${y - rect.top - 20}px`;

        clickerZone.appendChild(floatingText);

        setTimeout(() => floatingText.remove(), 1000);
    }

    function buyUpgrade(upgrade) {
        if (score >= upgrade.cost) {
            score -= upgrade.cost;
            upgrade.level++;
            if (upgrade.type === 'click') {
                mineralsPerClick += upgrade.power;
            } else if (upgrade.type === 'auto') {
                mineralsPerSecond += upgrade.power;
            }
            upgrade.cost = Math.ceil(upgrade.cost * 1.25);
            renderUpgrades();
            updateDisplay();
        }
    }

    function renderUpgrades() {
        upgradesList.innerHTML = '';
        upgrades.forEach(upgrade => {
            const upgradeEl = document.createElement('div');
            upgradeEl.className = 'upgrade';
            upgradeEl.id = upgrade.id;
            upgradeEl.innerHTML = `
                <h3>${upgrade.name} (Lvl ${upgrade.level})</h3>
                <p>${upgrade.description}</p>
                <p>Cost: <span class="upgrade-cost">${upgrade.cost.toLocaleString()}</span></p>
            `;
            upgradeEl.addEventListener('click', () => buyUpgrade(upgrade));
            upgradesList.appendChild(upgradeEl);
        });
    }

    asteroid.addEventListener('click', mineAsteroid);
    renderUpgrades();
    setInterval(() => {
        score += mineralsPerSecond / 10; // Add score 10 times per second for smoother updates
        updateDisplay();
    }, 100);
});