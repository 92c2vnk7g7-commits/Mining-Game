const STORAGE_KEY = 'mining-game-save';

const ores = [
  { name: 'coal', label: 'Coal', value: 1 },
  { name: 'iron', label: 'Iron', value: 4 },
  { name: 'gold', label: 'Gold', value: 12 },
  { name: 'diamond', label: 'Diamond', value: 40 }
];

const state = {
  gold: 0,
  coal: 0,
  iron: 0,
  goldOre: 0,
  diamond: 0,
  drillLevel: 1,
  cartLevel: 1,
  autoMiner: 0,
  energy: 100,
  maxEnergy: 100,
  zone: 'Surface Ridge',
  log: ['Welcome to your first mining shift!']
};

const elements = {
  goldValue: document.getElementById('goldValue'),
  energyValue: document.getElementById('energyValue'),
  drillLevelValue: document.getElementById('drillLevelValue'),
  cartLevelValue: document.getElementById('cartLevelValue'),
  autoMinerValue: document.getElementById('autoMinerValue'),
  coalValue: document.getElementById('coalValue'),
  ironValue: document.getElementById('ironValue'),
  goldOreValue: document.getElementById('goldOreValue'),
  diamondValue: document.getElementById('diamondValue'),
  mineBtn: document.getElementById('mineBtn'),
  restBtn: document.getElementById('restBtn'),
  sellBtn: document.getElementById('sellBtn'),
  resetBtn: document.getElementById('resetBtn'),
  upgradeDrillBtn: document.getElementById('upgradeDrillBtn'),
  upgradeCartBtn: document.getElementById('upgradeCartBtn'),
  upgradeAutoBtn: document.getElementById('upgradeAutoBtn'),
  zoneName: document.getElementById('zoneName'),
  drillCost: document.getElementById('drillCost'),
  cartCost: document.getElementById('cartCost'),
  autoMinerCost: document.getElementById('autoMinerCost'),
  logList: document.getElementById('logList')
};

function getDrillCost() {
  return 30 * state.drillLevel;
}

function getCartCost() {
  return 60 * state.cartLevel;
}

function getAutoCost() {
  return 120 * (state.autoMiner + 1);
}

function addLog(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 8);
}

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadGame() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    Object.assign(state, data);
  } catch (error) {
    console.warn('Could not load saved game', error);
  }
}

function mineOre() {
  if (state.energy < 5) {
    addLog('You are too exhausted to keep mining. Take a rest.');
    render();
    return;
  }

  state.energy = Math.max(0, state.energy - 5);

  const drillBoost = state.drillLevel * 0.75;
  const roll = Math.random();
  let oreName = 'coal';

  if (roll < 0.5 - state.drillLevel * 0.04) {
    oreName = 'coal';
  } else if (roll < 0.75 - state.drillLevel * 0.03) {
    oreName = 'iron';
  } else if (roll < 0.9 - state.drillLevel * 0.02) {
    oreName = 'gold';
  } else {
    oreName = 'diamond';
  }

  const amount = Math.max(1, Math.floor(Math.random() * 3 + 1 + drillBoost));
  state[oreName] += amount;

  const zoneIndex = Math.min(4, Math.floor((state.drillLevel + state.autoMiner) / 2));
  state.zone = ['Surface Ridge', 'Copper Vein', 'Iron Basin', 'Crystal Cavern', 'Deep Core'][zoneIndex];

  addLog(`You mined ${amount} ${oreName}${amount > 1 ? 's' : ''} in the ${state.zone}.`);
  render();
  saveGame();
}

function rest() {
  const restored = Math.min(state.maxEnergy, state.maxEnergy - state.energy + 20);
  state.energy = Math.min(state.maxEnergy, state.energy + 25);
  addLog(`You rest and recover ${Math.max(0, state.energy - (state.energy - 25))} energy.`);
  render();
  saveGame();
}

function sellOre() {
  const inventory = {
    coal: state.coal,
    iron: state.iron,
    gold: state.goldOre,
    diamond: state.diamond
  };

  const totalValue = Object.entries(inventory).reduce((sum, [name, amount]) => {
    const ore = ores.find((entry) => entry.name === name);
    return sum + amount * ore.value;
  }, 0);

  if (totalValue <= 0) {
    addLog('Your cargo hold is empty. Keep digging!');
    render();
    return;
  }

  state.gold += totalValue;
  state.coal = 0;
  state.iron = 0;
  state.goldOre = 0;
  state.diamond = 0;

  addLog(`You sold your ore haul for ${totalValue} gold.`);
  render();
  saveGame();
}

function upgradeDrill() {
  const cost = getDrillCost();
  if (state.gold < cost) {
    addLog('Not enough gold for a drill upgrade.');
    render();
    return;
  }

  state.gold -= cost;
  state.drillLevel += 1;
  state.maxEnergy += 8;
  state.energy = Math.min(state.maxEnergy, state.energy + 10);
  addLog(`Drill upgraded to level ${state.drillLevel}! Mining gets easier.`);
  render();
  saveGame();
}

function upgradeCart() {
  const cost = getCartCost();
  if (state.gold < cost) {
    addLog('You need more gold to expand your cart capacity.');
    render();
    return;
  }

  state.gold -= cost;
  state.cartLevel += 1;
  addLog(`Cart upgraded to level ${state.cartLevel}. More ore can be hauled.`);
  render();
  saveGame();
}

function upgradeAutoMiner() {
  const cost = getAutoCost();
  if (state.gold < cost) {
    addLog('You need more gold to install an auto-miner.');
    render();
    return;
  }

  state.gold -= cost;
  state.autoMiner += 1;
  addLog(`Auto-miner installed. Efficiency increased.`);
  render();
  saveGame();
}

function resetGame() {
  localStorage.removeItem(STORAGE_KEY);
  Object.assign(state, {
    gold: 0,
    coal: 0,
    iron: 0,
    goldOre: 0,
    diamond: 0,
    drillLevel: 1,
    cartLevel: 1,
    autoMiner: 0,
    energy: 100,
    maxEnergy: 100,
    zone: 'Surface Ridge',
    log: ['Run reset. Fresh shift, fresh fortune!']
  });
  render();
}

function autoMineTick() {
  if (state.autoMiner > 0 && state.energy > 0) {
    const bonus = state.autoMiner * 2;
    const oreIndex = Math.floor(Math.random() * 4);
    const ore = ores[oreIndex];
    const amount = Math.max(1, Math.floor(Math.random() * (state.autoMiner + 2)) + bonus);
    state[ore.name] += amount;
    state.energy = Math.max(0, state.energy - 1);
    addLog(`Auto-miner extracted ${amount} ${ore.label.toLowerCase()}s.`);
    render();
    saveGame();
  }
}

function render() {
  elements.goldValue.textContent = `${state.gold}`;
  elements.energyValue.textContent = `${state.energy} / ${state.maxEnergy}`;
  elements.drillLevelValue.textContent = `${state.drillLevel}`;
  elements.cartLevelValue.textContent = `${state.cartLevel}`;
  elements.autoMinerValue.textContent = `${state.autoMiner}`;
  elements.coalValue.textContent = `${state.coal}`;
  elements.ironValue.textContent = `${state.iron}`;
  elements.goldOreValue.textContent = `${state.goldOre}`;
  elements.diamondValue.textContent = `${state.diamond}`;
  elements.zoneName.textContent = state.zone;
  elements.drillCost.textContent = `Cost: ${getDrillCost()}`;
  elements.cartCost.textContent = `Cost: ${getCartCost()}`;
  elements.autoMinerCost.textContent = `Cost: ${getAutoCost()}`;

  elements.logList.innerHTML = '';
  state.log.forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = entry;
    elements.logList.appendChild(li);
  });
}

loadGame();
render();

setInterval(() => {
  state.energy = Math.min(state.maxEnergy, state.energy + 1);
  if (state.autoMiner > 0) {
    autoMineTick();
  }
}, 1500);

functions maybe not needed; no.

elements.mineBtn.addEventListener('click', mineOre);
elements.restBtn.addEventListener('click', rest);
elements.sellBtn.addEventListener('click', sellOre);
elements.upgradeDrillBtn.addEventListener('click', upgradeDrill);
elements.upgradeCartBtn.addEventListener('click', upgradeCart);
elements.upgradeAutoBtn.addEventListener('click', upgradeAutoMiner);
elements.resetBtn.addEventListener('click', resetGame);

window.addEventListener('beforeunload', saveGame);
