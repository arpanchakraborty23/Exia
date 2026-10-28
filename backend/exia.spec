# -*- mode: python ; coding: utf-8 -*-

import os
import sys
from pathlib import Path

block_cipher = None

# In PyInstaller .spec files, SPECPATH points to the directory containing this spec file
backend_dir = Path(SPECPATH).resolve() if "SPECPATH" in globals() else Path.cwd().resolve()
dist_dir = backend_dir / "dist"
static_dir = backend_dir / "static"
icon_path = backend_dir / "exia-icon.ico"

datas = []
if dist_dir.exists():
    for p in dist_dir.rglob("*"):
        if p.is_file() and not p.name.endswith(".exe") and not p.name.endswith(".map") and "-backup" not in p.name:
            rel_parent = p.relative_to(dist_dir).parent
            datas.append((str(p), str(Path("dist") / rel_parent)))
if static_dir.exists():
    datas.append((str(static_dir), "static"))
if icon_path.exists():
    datas.append((str(icon_path), "."))

hiddenimports = [
    "uvicorn",
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "pymongo",
    "bcrypt",
    "passlib.handlers.bcrypt",
    "fastapi",
    "pydantic",
    "pydantic_settings",
    "livekit",
    "livekit.api",
    "webview",
    "webview.platforms.winforms",
    "clr",
]

excludes = [
    "tkinter",
    "matplotlib",
    "numpy",
    "numpy.core",
    "numpy.lib",
    "scipy",
    "pandas",
    "pygments",
    "IPython",
    "unittest",
    "pydoc",
    "pydoc_data",
    "test",
    "tests",
    "watchfiles",
    "pytest",
    "pdb",
    "curses",
]

a = Analysis(
    [str(backend_dir / 'main_desktop.py')],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='Exia',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    icon=str(icon_path) if icon_path.exists() else None,
)
