const { ipcRenderer } = require('electron');
const appEl = document.getElementById('app');
const ingEl = document.getElementById('ing');
const vents = document.querySelectorAll('.vent-btn');

onMapChange('skeld');
rescaleMap();
window.onresize = rescaleMap;

function rescaleMap() {
  const targetHeight = window.innerWidth / 16 * 9;

  if (window.innerHeight < targetHeight) {
    appEl.style.width = `${window.innerHeight / 9 * 16}px`;
    appEl.style.height = `${window.innerHeight}px`;
  } else {
    appEl.style.width = `${window.innerWidth}px`;
    appEl.style.height = `${targetHeight}px`;
  }

  for (const vent of vents) {
    const coef = window.innerWidth / 1920;
    vent.style.width = `${81 * coef}px`;
    vent.style.height = `${51 * coef}px`;
  }
}

function vent(ventId) {
  ipcRenderer.send('vent', ventId);
}

ipcRenderer.on('open', () => {
  ingEl.classList.add('hide');
});

ipcRenderer.on('dead', () => {
  ingEl.classList.remove('hide');
});

function showVents(min, max){
  // Hide all vents
  for(let i = 0; i<=36; i++){
    document.getElementById(`id${i}`).style.display = 'none';
  }
  // Show vents only for a certain map
  for(let i=min; i<=max; i++){
    document.getElementById(`id${i}`).style.display = 'block';
  }
}

function onMapChange(map){
  document.getElementById('app').style.backgroundImage = `url(./${map}.png)`;
  switch(map){
    case 'skeld':
      showVents(0, 13);
    break;
    case 'mirahq':
      showVents(14, 24);
    break;
    case 'polus':
      showVents(25, 36);
    break;
  }
}