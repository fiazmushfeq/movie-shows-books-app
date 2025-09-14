const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Path to store data
const userDataPath = app.getPath('userData');
const dataFilePath = path.join(userDataPath, 'media-data.json');

let mainWindow;

// Initialize data file if it doesn't exist
function initializeDataFile() {
  if (!fs.existsSync(dataFilePath)) {
    const initialData = {
      movies: [],
      books: [],
      shows: []
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
  }
}

// Read data from file
function readData() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return { movies: [], books: [], shows: [] };
  }
}

// Write data to file
function writeData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png') // Add your icon here
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  initializeDataFile();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-all-media', async () => {
  return readData();
});

ipcMain.handle('add-media-item', async (event, { type, item }) => {
  const data = readData();
  
  // Add unique ID and timestamp
  const newItem = {
    ...item,
    id: Date.now().toString(),
    dateAdded: new Date().toISOString()
  };
  
  if (data[type]) {
    data[type].push(newItem);
    const success = writeData(data);
    return success ? newItem : null;
  }
  return null;
});

ipcMain.handle('remove-media-item', async (event, { type, id }) => {
  const data = readData();
  
  if (data[type]) {
    data[type] = data[type].filter(item => item.id !== id);
    const success = writeData(data);
    return success;
  }
  return false;
});

ipcMain.handle('update-media-item', async (event, { type, id, updates }) => {
  const data = readData();
  
  if (data[type]) {
    const index = data[type].findIndex(item => item.id === id);
    if (index !== -1) {
      data[type][index] = { ...data[type][index], ...updates };
      const success = writeData(data);
      return success ? data[type][index] : null;
    }
  }
  return null;
});
