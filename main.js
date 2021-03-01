const { app, BrowserWindow, ipcMain } = require('electron');
const processLib = require('process');
const memoryjs = require('@fry98/memoryjs');
const coordList = require('./locations.js');
const processName = "Among Us.exe";

const offsets = [null, 92, 0, 96, 56, 8, 92, 44]; // 5C 0 60 38 8 5C 2C
let process = null;
let dll = null;

function checkRunning(pid) {
  try {
    return processLib.kill(pid, 0);
  } catch (error) {
    return error.code === 'EPERM';
  }
}

function createWindow () {
  const win = new BrowserWindow({
    width: 960,
    height: 540,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    }
  });

  win.setMenu(null);
  win.loadFile('src/index.html');
  win.webContents.once('dom-ready', () => {
    tryOpen();
    setInterval(tryOpen, 1000);
  });

  ipcMain.on('vent', (_, location) => {
    tryOpen();
    if (process === null) return;

    const xCordAddr = getDataAddr(process.handle, offsets);
    if (xCordAddr === null) return;
    const yCordAddr = xCordAddr + 4;
    console.log("xAdd: ", xCordAddr , "yAdd: ", yCordAddr)
    memoryjs.writeMemory(process.handle, xCordAddr, coordList[location][0], 'float');
    memoryjs.writeMemory(process.handle, yCordAddr, coordList[location][1], 'float');
    console.log("X: ", coordList[location][0], "Y: ", coordList[location][1]);
  });

  function tryOpen() {
    if (process !== null) {
      if (checkRunning(process.th32ProcessID)) return;
      process = null;
      win.webContents.send('dead');
    }

    try {
      process = memoryjs.openProcess(processName);
      dll = memoryjs.findModule("GameAssembly.dll", process.th32ProcessID);
      offsets[0] = dll.modBaseAddr + 29720444;
      win.webContents.send('open');
    } catch {
      process = null;
      dll = null;
    }
  }

  function getDataAddr(handle, offsets) {
    let lastPointer = offsets[0];
    for (let i = 1; i < offsets.length; i++) {
      const pointer = memoryjs.readMemory(handle, lastPointer, 'dword');
      if (pointer === 0) return null;
      lastPointer = pointer + offsets[i];
    }
    offsets.forEach(offset => {
      console.log(offset.toString(16))
    })
    return lastPointer;
  }
}

app.allowRendererProcessReuse = true;
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (processLib.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
