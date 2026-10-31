const { contextBridge } = require('electron');

// Expose safe platform APIs to the renderer
contextBridge.exposeInMainWorld('electronPlatform', {
  isElectron: true,
  platform: process.platform,
  arch: process.arch,
});
