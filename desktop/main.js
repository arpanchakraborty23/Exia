const { app, BrowserWindow, session, shell, protocol, net } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

// Register custom protocol scheme 'app' as privileged
// MUST be executed before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

// Set application name
app.name = 'Exia';

// Global error handlers for main process
process.on('uncaughtException', (err) => {
  console.error('[Exia Desktop Uncaught Exception]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Exia Desktop Unhandled Rejection]', reason);
});

// Ensure single application instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Exia Desktop] Another instance is already running. Exiting.');
  app.quit();
  process.exit(0);
}

let mainWindow = null;

function getMissingBuildHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Exia — Build Assets Required</title>
  <style>
    body {
      background-color: #090909;
      color: #EDEDED;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      background: #141414;
      border: 1px solid #282828;
      border-radius: 12px;
      padding: 32px;
      max-width: 580px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.5);
    }
    h1 {
      font-size: 20px;
      margin: 0 0 12px 0;
      color: #60A5FA;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    p {
      color: #A1A1AA;
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }
    code {
      background: #1F1F1F;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: Consolas, monospace;
      color: #F43F5E;
    }
    pre {
      background: #1A1A1A;
      border: 1px solid #2E2E2E;
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
      font-family: Consolas, monospace;
      font-size: 13px;
      color: #38BDF8;
      margin: 16px 0;
    }
    .btn {
      background: #2563EB;
      color: #FFF;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
    }
    .btn:hover {
      background: #1D4ED8;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚠️ Web Bundle Not Found</h1>
    <p>Exia Desktop could not locate the compiled web bundle at <code>desktop/dist/index.html</code>.</p>
    <p>Please compile the web client and synchronize assets before launching the desktop client:</p>
    <pre>pnpm --dir ui desktop:build</pre>
    <p>Alternatively, if running the Expo dev server locally, launch with:</p>
    <pre>ELECTRON_START_URL=http://localhost:8081 pnpm --dir desktop start</pre>
    <button class="btn" onclick="window.location.reload()">Retry Loading</button>
  </div>
</body>
</html>`;
}

function registerAppProtocol() {
  const distDir = path.join(__dirname, 'dist');

  protocol.handle('app', (request) => {
    try {
      const requestUrl = new URL(request.url);
      let pathname = decodeURIComponent(requestUrl.pathname);

      if (pathname.startsWith('/')) {
        pathname = pathname.slice(1);
      }
      if (!pathname || pathname === '') {
        pathname = 'index.html';
      }

      let targetFile = path.join(distDir, pathname);

      // Check if target file exists and is not a directory
      if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
        const hasExtension = path.extname(pathname) !== '';
        // If this is an SPA route without file extension (e.g. /login, /analytics, /history), serve index.html
        if (!hasExtension) {
          targetFile = path.join(distDir, 'index.html');
        } else {
          return new Response('File not found', { status: 404 });
        }
      }

      const fileUrl = url.pathToFileURL(targetFile).toString();
      return net.fetch(fileUrl);
    } catch (err) {
      console.error('[Exia Desktop Protocol Error]', err);
      return new Response('Protocol error', { status: 500 });
    }
  });
}

function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'assets', 'icon.ico')
    : path.join(__dirname, 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 960,
    minHeight: 600,
    title: 'Exia — Multimodal AI Assistant',
    backgroundColor: '#090909',
    autoHideMenuBar: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: true,
    },
  });

  // Content-Security-Policy to protect the application while supporting React Native Web and WebRTC
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' app: file: data: blob: ws: wss: https: http:; " +
          "script-src 'self' app: 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' app: 'unsafe-inline' https:; " +
          "img-src 'self' app: data: blob: https: http:; " +
          "font-src 'self' app: data: https:; " +
          "connect-src 'self' app: https: http: ws: wss:; " +
          "media-src 'self' app: data: blob: https: http:; "
        ],
      },
    });
  });

  // Automatically grant camera, microphone and media device access for LiveKit WebRTC
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'camera', 'microphone', 'notifications', 'mediaKeySystem', 'display-capture'];
    callback(allowed.includes(permission));
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    const allowed = ['media', 'camera', 'microphone', 'notifications', 'mediaKeySystem', 'display-capture'];
    return allowed.includes(permission);
  });

  // Event handlers and diagnostics
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Exia Desktop] Failed to load URL: ${validatedURL} (code: ${errorCode}, ${errorDescription})`);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error(`[Exia Desktop] Render process gone: reason=${details.reason}, exitCode=${details.exitCode}`);
  });

  if (!app.isPackaged) {
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      if (level >= 2) {
        console.log(`[Renderer ${level === 3 ? 'ERROR' : 'WARN'}] ${message} (${sourceId}:${line})`);
      }
    });
  }

  // Load production bundle via custom protocol or development server
  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    console.log(`[Exia Desktop] Loading development URL: ${startUrl}`);
    mainWindow.loadURL(startUrl);
  } else {
    const distIndexPath = path.join(__dirname, 'dist', 'index.html');
    if (!fs.existsSync(distIndexPath)) {
      console.warn(`[Exia Desktop] Bundle not found at ${distIndexPath}. Displaying build instructions.`);
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getMissingBuildHtml())}`);
    } else {
      console.log(`[Exia Desktop] Loading bundle via app:// protocol`);
      mainWindow.loadURL('app://exia/');
    }
  }

  // External link routing: open external links in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (process.env.ELECTRON_VERIFY_RUN === '1') {
      setTimeout(async () => {
        try {
          const rootChildren = await mainWindow.webContents.executeJavaScript(
            'document.getElementById("root")?.childElementCount'
          );
          const currentUrl = await mainWindow.webContents.executeJavaScript(
            'window.location.href'
          );
          console.log(`[Exia Desktop Verification] Success! Current URL: ${currentUrl}, Root children: ${rootChildren}`);
        } catch (err) {
          console.error('[Exia Desktop Verification] Error inspecting root:', err);
        }
        app.quit();
      }, 3500);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerAppProtocol();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
