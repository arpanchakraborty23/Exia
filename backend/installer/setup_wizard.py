"""
Exia Windows Setup Wizard — Standalone Installer GUI.

Provides the classic Windows desktop software installation wizard:
  1. Welcome Screen
  2. Installation Location Selection (%LOCALAPPDATA%\\Programs\\Exia)
  3. Shortcut Options (Desktop & Start Menu)
  4. Installation Progress & File Extraction
  5. Completion Screen with 'Launch Exia now' option
"""

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

# Safe stream sink for PyInstaller GUI mode
class SafeWriter:
    def write(self, s):
        pass
    def flush(self):
        pass
    def isatty(self):
        return False

if sys.stdout is None:
    sys.stdout = SafeWriter()
if sys.stderr is None:
    sys.stderr = SafeWriter()


def get_default_install_dir() -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        return Path(local_app_data) / "Programs" / "Exia"
    return Path.home() / "AppData" / "Local" / "Programs" / "Exia"


def create_windows_shortcut(target_exe: Path, icon_file: Path, lnk_path: Path, description: str = "Exia AI Voice Agent"):
    """Creates a Windows shortcut using WScript.Shell via PowerShell."""
    lnk_path.parent.mkdir(parents=True, exist_ok=True)
    ps_cmd = (
        f'$WshShell = New-Object -comObject WScript.Shell; '
        f'$Shortcut = $WshShell.CreateShortcut("{lnk_path}"); '
        f'$Shortcut.TargetPath = "{target_exe}"; '
        f'$Shortcut.WorkingDirectory = "{target_exe.parent}"; '
        f'$Shortcut.IconLocation = "{icon_file}, 0"; '
        f'$Shortcut.Description = "{description}"; '
        f'$Shortcut.Save()'
    )
    subprocess.run(
        ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_cmd],
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        check=False,
    )


class SetupApi:
    def __init__(self, window, payload_dir: Path):
        self.window = window
        self.payload_dir = payload_dir
        self.default_dest = get_default_install_dir()

    def get_defaults(self):
        desktop = Path.home() / "Desktop"
        return {
            "default_path": str(self.default_dest),
            "desktop_exists": desktop.exists(),
        }

    def install(self, options_json: str):
        try:
            options = json.loads(options_json)
            dest_dir = Path(options.get("install_path", str(self.default_dest)))
            dest_dir.mkdir(parents=True, exist_ok=True)

            # 1. Locate source payload (Exia.exe and exia-icon.ico)
            exe_src = None
            icon_src = None

            # Check bundled PyInstaller temporary folder
            if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
                bundle_path = Path(sys._MEIPASS)
                if (bundle_path / "payload" / "Exia.exe").exists():
                    exe_src = bundle_path / "payload" / "Exia.exe"
                elif (bundle_path / "Exia.exe").exists():
                    exe_src = bundle_path / "Exia.exe"
                
                if (bundle_path / "payload" / "exia-icon.ico").exists():
                    icon_src = bundle_path / "payload" / "exia-icon.ico"
                elif (bundle_path / "exia-icon.ico").exists():
                    icon_src = bundle_path / "exia-icon.ico"

            # Check next to installer binary or repo release dir
            if not exe_src or not exe_src.exists():
                candidates = [
                    Path(__file__).resolve().parent.parent / "release" / "Exia.exe",
                    Path.cwd() / "Exia.exe",
                    Path(sys.executable).parent / "Exia.exe",
                ]
                for c in candidates:
                    if c.exists():
                        exe_src = c
                        break

            if not icon_src or not icon_src.exists():
                candidates = [
                    Path(__file__).resolve().parent.parent / "exia-icon.ico",
                    Path.cwd() / "exia-icon.ico",
                    Path(sys.executable).parent / "exia-icon.ico",
                ]
                for c in candidates:
                    if c.exists():
                        icon_src = c
                        break

            if not exe_src or not exe_src.exists():
                return {"success": False, "error": "Application payload (Exia.exe) not found."}

            # 2. Copy binary and icon to destination
            target_exe = dest_dir / "Exia.exe"
            target_icon = dest_dir / "exia-icon.ico"

            shutil.copy2(exe_src, target_exe)
            if icon_src and icon_src.exists():
                shutil.copy2(icon_src, target_icon)

            # 3. Create Desktop shortcut
            if options.get("desktop_shortcut", True):
                desktop_lnk = Path.home() / "Desktop" / "Exia.lnk"
                create_windows_shortcut(target_exe, target_icon, desktop_lnk)

            # 4. Create Start Menu shortcut
            if options.get("start_menu_shortcut", True):
                appdata = os.environ.get("APPDATA")
                if appdata:
                    start_menu_lnk = Path(appdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Exia.lnk"
                    create_windows_shortcut(target_exe, target_icon, start_menu_lnk)

            # 5. Create uninstaller script in destination folder
            uninstall_cmd = dest_dir / "Uninstall.cmd"
            uninstall_script = (
                f'@echo off\n'
                f'echo Uninstalling Exia Desktop...\n'
                f'taskkill /F /IM Exia.exe >nul 2>&1\n'
                f'del "{Path.home() / "Desktop" / "Exia.lnk"}" >nul 2>&1\n'
                f'del "{Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Exia.lnk"}" >nul 2>&1\n'
                f'echo Exia shortcuts removed.\n'
                f'echo To complete uninstallation, delete this folder: {dest_dir}\n'
                f'pause\n'
            )
            try:
                uninstall_cmd.write_text(uninstall_script, encoding="utf-8")
            except Exception:
                pass

            return {"success": True, "target_exe": str(target_exe)}

        except Exception as e:
            return {"success": False, "error": str(e)}

    def finish_and_launch(self, should_launch: bool, target_exe_path: str):
        if should_launch and target_exe_path:
            p = Path(target_exe_path)
            if p.exists():
                subprocess.Popen(
                    [str(p)],
                    cwd=str(p.parent),
                    creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0) if sys.platform == "win32" else 0,
                )
        self.window.destroy()


HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Exia Setup</title>
  <style>
    * { box-sizing: border-box; user-select: none; }
    body {
      margin: 0;
      padding: 0;
      background: #09090b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .header {
      background: #18181b;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid #27272a;
    }
    .header img {
      width: 36px;
      height: 36px;
      border-radius: 8px;
    }
    .header-text h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #fafafa;
    }
    .header-text p {
      margin: 2px 0 0;
      font-size: 12px;
      color: #a1a1aa;
    }
    .content {
      flex: 1;
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
    }
    .step {
      display: none;
      flex-direction: column;
      flex: 1;
    }
    .step.active {
      display: flex;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 18px;
      color: #f4f4f5;
    }
    p {
      color: #a1a1aa;
      font-size: 13px;
      line-height: 1.5;
      margin: 0 0 16px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: #d4d4d8;
      margin-bottom: 6px;
    }
    input[type="text"] {
      width: 100%;
      background: #18181b;
      border: 1px solid #3f3f46;
      border-radius: 6px;
      padding: 8px 12px;
      color: #fafafa;
      font-size: 13px;
      outline: none;
    }
    input[type="text"]:focus {
      border-color: #3b82f6;
    }
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      cursor: pointer;
    }
    .checkbox-group input {
      accent-color: #3b82f6;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    .checkbox-group span {
      font-size: 13px;
      color: #e4e4e7;
    }
    .progress-bar-container {
      width: 100%;
      height: 8px;
      background: #27272a;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 16px;
    }
    .progress-bar {
      height: 100%;
      width: 0%;
      background: #3b82f6;
      transition: width 0.3s ease;
    }
    .status-text {
      font-size: 12px;
      color: #a1a1aa;
      margin-top: 8px;
    }
    .footer {
      background: #121215;
      padding: 14px 24px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid #27272a;
    }
    button {
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      outline: none;
      transition: all 0.15s ease;
    }
    .btn-secondary {
      background: #27272a;
      color: #e4e4e7;
      border-color: #3f3f46;
    }
    .btn-secondary:hover {
      background: #3f3f46;
    }
    .btn-primary {
      background: #3b82f6;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #2563eb;
    }
    .btn-primary:disabled, .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .badge {
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #0284c7;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      display: inline-block;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" x2="12" y1="19" y2="22"/>
    </svg>
    <div class="header-text">
      <h1>Exia Desktop Setup</h1>
      <p id="header-desc">Welcome to the Exia Installation Wizard</p>
    </div>
  </div>

  <div class="content">
    <!-- Step 1: Welcome -->
    <div class="step active" id="step-1">
      <span class="badge">Version 1.0.0</span>
      <h2>Welcome to Exia Setup</h2>
      <p>This wizard will install the Exia AI Voice Agent application on your computer.</p>
      <p>Exia gives you local low-latency conversational AI with LiveKit Real-Time Audio, DeepSeek / OpenAI / Anthropic models, and FastMCP tools.</p>
      <p style="margin-top: auto; color: #71717a; font-size: 12px;">Click Next to continue or Cancel to exit Setup.</p>
    </div>

    <!-- Step 2: Location -->
    <div class="step" id="step-2">
      <h2>Destination Location</h2>
      <p>Setup will install Exia into the following folder. Standard user installation requires no administrator elevation.</p>
      <div class="form-group" style="margin-top: 12px;">
        <label>Install to folder:</label>
        <input type="text" id="install-path" value="">
      </div>
      <p style="font-size: 12px; color: #71717a;">Required disk space: ~38 MB</p>
    </div>

    <!-- Step 3: Options -->
    <div class="step" id="step-3">
      <h2>Select Additional Tasks</h2>
      <p>Select the shortcuts you would like setup to create during installation:</p>
      <label class="checkbox-group" style="margin-top: 12px;">
        <input type="checkbox" id="chk-desktop" checked>
        <span>Create a Desktop shortcut (Recommended)</span>
      </label>
      <label class="checkbox-group">
        <input type="checkbox" id="chk-startmenu" checked>
        <span>Create a Start Menu shortcut</span>
      </label>
    </div>

    <!-- Step 4: Installing -->
    <div class="step" id="step-4">
      <h2>Installing Exia...</h2>
      <p>Please wait while Setup installs Exia on your computer.</p>
      <div class="progress-bar-container">
        <div class="progress-bar" id="progress-bar"></div>
      </div>
      <div class="status-text" id="status-text">Preparing installation...</div>
    </div>

    <!-- Step 5: Completed -->
    <div class="step" id="step-5">
      <span class="badge" style="background: #14532d; color: #4ade80; border-color: #22c55e;">Installation Complete</span>
      <h2>Completing Exia Setup</h2>
      <p>Exia has been successfully installed on your computer. An icon shortcut has been created on your Desktop for easy daily launching.</p>
      <label class="checkbox-group" style="margin-top: 24px;">
        <input type="checkbox" id="chk-launch" checked>
        <span>Launch Exia now</span>
      </label>
    </div>
  </div>

  <div class="footer">
    <button class="btn-secondary" id="btn-back" style="display: none;" onclick="prevStep()">Back</button>
    <button class="btn-secondary" id="btn-cancel" onclick="cancelSetup()">Cancel</button>
    <button class="btn-primary" id="btn-next" onclick="nextStep()">Next</button>
  </div>

  <script>
    let currentStep = 1;
    let installedExePath = "";

    window.addEventListener('pywebviewready', async () => {
      try {
        const defaults = await window.pywebview.api.get_defaults();
        document.getElementById('install-path').value = defaults.default_path;
      } catch (e) {
        console.error(e);
      }
    });

    function showStep(step) {
      document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
      document.getElementById('step-' + step).classList.add('active');
      currentStep = step;

      const btnBack = document.getElementById('btn-back');
      const btnCancel = document.getElementById('btn-cancel');
      const btnNext = document.getElementById('btn-next');
      const desc = document.getElementById('header-desc');

      if (step === 1) {
        btnBack.style.display = 'none';
        btnCancel.style.display = 'block';
        btnNext.textContent = 'Next';
        btnNext.disabled = false;
        desc.textContent = 'Welcome to the Exia Installation Wizard';
      } else if (step === 2) {
        btnBack.style.display = 'block';
        btnCancel.style.display = 'block';
        btnNext.textContent = 'Next';
        btnNext.disabled = false;
        desc.textContent = 'Select Destination Folder';
      } else if (step === 3) {
        btnBack.style.display = 'block';
        btnCancel.style.display = 'block';
        btnNext.textContent = 'Install';
        btnNext.disabled = false;
        desc.textContent = 'Select Additional Shortcuts';
      } else if (step === 4) {
        btnBack.style.display = 'none';
        btnCancel.style.display = 'none';
        btnNext.style.display = 'none';
        desc.textContent = 'Extracting and Installing Files...';
        startInstallation();
      } else if (step === 5) {
        btnBack.style.display = 'none';
        btnCancel.style.display = 'none';
        btnNext.style.display = 'block';
        btnNext.textContent = 'Finish';
        btnNext.disabled = false;
        desc.textContent = 'Setup Completed';
      }
    }

    function nextStep() {
      if (currentStep === 3) {
        showStep(4);
      } else if (currentStep === 5) {
        const shouldLaunch = document.getElementById('chk-launch').checked;
        window.pywebview.api.finish_and_launch(shouldLaunch, installedExePath);
      } else {
        showStep(currentStep + 1);
      }
    }

    function prevStep() {
      if (currentStep > 1) {
        showStep(currentStep - 1);
      }
    }

    function cancelSetup() {
      window.pywebview.api.finish_and_launch(false, "");
    }

    async function startInstallation() {
      const pBar = document.getElementById('progress-bar');
      const sText = document.getElementById('status-text');

      pBar.style.width = '20%';
      sText.textContent = 'Extracting application binaries...';

      const options = {
        install_path: document.getElementById('install-path').value,
        desktop_shortcut: document.getElementById('chk-desktop').checked,
        start_menu_shortcut: document.getElementById('chk-startmenu').checked
      };

      await new Promise(r => setTimeout(r, 600));
      pBar.style.width = '60%';
      sText.textContent = 'Creating Desktop and Start Menu shortcuts...';

      try {
        const res = await window.pywebview.api.install(JSON.stringify(options));
        if (res.success) {
          installedExePath = res.target_exe;
          pBar.style.width = '100%';
          sText.textContent = 'Finalizing installation...';
          await new Promise(r => setTimeout(r, 500));
          showStep(5);
        } else {
          sText.style.color = '#ef4444';
          sText.textContent = 'Installation failed: ' + res.error;
          document.getElementById('btn-cancel').style.display = 'block';
        }
      } catch (err) {
        sText.style.color = '#ef4444';
        sText.textContent = 'Error: ' + err;
        document.getElementById('btn-cancel').style.display = 'block';
      }
    }
  </script>
</body>
</html>
"""


def main():
    import webview

    payload_dir = Path(__file__).resolve().parent
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        payload_dir = Path(sys._MEIPASS)

    # Locate icon
    icon_path = None
    candidates = [
        payload_dir / "exia-icon.ico",
        payload_dir.parent / "exia-icon.ico",
    ]
    for c in candidates:
        if c.exists():
            icon_path = str(c.resolve())
            break

    window = webview.create_window(
        title="Exia Setup",
        html=HTML_CONTENT,
        width=580,
        height=420,
        resizable=False,
        background_color="#09090b",
    )
    api = SetupApi(window, payload_dir)
    window.expose(api.get_defaults, api.install, api.finish_and_launch)
    webview.start(icon=icon_path)


if __name__ == "__main__":
    main()
