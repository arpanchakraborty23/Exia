# -*- mode: python ; coding: utf-8 -*-

import sys
from pathlib import Path

spec_dir = Path(SPECPATH).resolve() if "SPECPATH" in globals() else Path.cwd().resolve()
backend_dir = spec_dir.parent if spec_dir.name == "installer" else spec_dir
release_dir = backend_dir / "release"
icon_path = backend_dir / "exia-icon.ico"

datas = []
exia_exe = release_dir / "Exia.exe"
if exia_exe.exists():
    datas.append((str(exia_exe), "payload"))
if icon_path.exists():
    datas.append((str(icon_path), "payload"))

hiddenimports = [
    "webview",
    "webview.platforms.winforms",
    "clr",
]

a = Analysis(
    [str(spec_dir / 'setup_wizard.py')],
    pathex=[str(spec_dir), str(backend_dir)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["numpy", "scipy", "pandas", "pygments", "matplotlib", "tkinter"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='Exia-Setup',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    icon=str(icon_path) if icon_path.exists() else None,
)
