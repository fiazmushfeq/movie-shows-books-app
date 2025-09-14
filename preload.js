const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  getAllMedia: () => ipcRenderer.invoke('get-all-media'),
  addMediaItem: (type, item) => ipcRenderer.invoke('add-media-item', { type, item }),
  removeMediaItem: (type, id) => ipcRenderer.invoke('remove-media-item', { type, id }),
  updateMediaItem: (type, id, updates) => ipcRenderer.invoke('update-media-item', { type, id, updates })
});
