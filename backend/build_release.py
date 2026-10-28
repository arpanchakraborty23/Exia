"""
Exia Desktop Release & Installer Packaging Pipeline.

Automates:
1. Verification of frontend static export in backend/dist.
2. Cleaning old build artifacts and preparing backend/release.
3. Detecting UPX binary compression (in PATH or backend/tools/upx).
4. Running PyInstaller with heavy library exclusions (NumPy, Pygments, etc.).
5. Detecting Inno Setup compiler (ISCC) and generating the Windows Setup Wizard (Exia-Setup-1.0.0.exe).
6. Generating a final size & verification report.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
RELEASE_DIR = BACKEND_DIR / "release"
BUILD_DIR = BACKEND_DIR / "build"
TOOLS_DIR = BACKEND_DIR / "tools" / "upx"
SPEC_FILE = BACKEND_DIR / "exia.spec"
ISS_FILE = BACKEND_DIR / "installer" / "exia_setup.iss"


def find_iscc() -> Path | None:
    """Locates the Inno Setup Compiler executable."""
    # 1. In PATH
    which_iscc = shutil.which("iscc")
    if which_iscc:
        return Path(which_iscc)

    # 2. Standard Windows installation paths
    candidates = [
        Path(os.environ.get("ProgramFiles(x86)", "C:/Program Files (x86)")) / "Inno Setup 6" / "ISCC.exe",
        Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "Inno Setup 6" / "ISCC.exe",
        Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Inno Setup 6" / "ISCC.exe",
    ]
    for c in candidates:
        if c.exists():
            return c
    return None


def find_upx_dir() -> Path | None:
    """Locates UPX directory if available."""
    if TOOLS_DIR.exists() and (TOOLS_DIR / "upx.exe").exists():
        return TOOLS_DIR
    which_upx = shutil.which("upx")
    if which_upx:
        return Path(which_upx).parent
    return None


def format_size(bytes_num: int) -> str:
    mb = bytes_num / (1024 * 1024)
    return f"{mb:.2f} MB ({bytes_num:,} bytes)"


def main():
    print("=" * 60)
    print("[*] EXIA DESKTOP OPTIMIZATION & RELEASE BUILDER")
    print("=" * 60)

    # 1. Verify frontend dist
    dist_dir = BACKEND_DIR / "dist"
    index_html = dist_dir / "index.html"
    if not index_html.exists():
        print("[X] Error: backend/dist/index.html not found!")
        print("Please build the frontend first (`npm run build` in /frontend).")
        sys.exit(1)

    print(f"[OK] Verified frontend distribution at: {dist_dir}")

    # 2. Prepare directories
    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    if (RELEASE_DIR / "Exia.exe").exists():
        try:
            (RELEASE_DIR / "Exia.exe").unlink()
        except Exception:
            pass

    # 3. Check for UPX
    upx_dir = find_upx_dir()
    if upx_dir:
        print(f"[OK] UPX binary compression detected at: {upx_dir}")
    else:
        print("[INFO] UPX not found in PATH or backend/tools/upx. Building with PyInstaller zlib.")
        print("       (To enable ~16MB ultra-compression, drop upx.exe into backend/tools/upx/)")

    # 4. Run PyInstaller
    print("\n[*] Compiling Exia.exe with PyInstaller (excluding NumPy, Pygments, etc.)...")
    pyinstaller_cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--distpath",
        str(RELEASE_DIR),
        "--workpath",
        str(BUILD_DIR),
        "--noconfirm",
    ]
    if upx_dir:
        pyinstaller_cmd.extend(["--upx-dir", str(upx_dir)])

    pyinstaller_cmd.append(str(SPEC_FILE))

    start_time = time.time()
    res = subprocess.run(pyinstaller_cmd, cwd=str(BACKEND_DIR))
    if res.returncode != 0:
        print("[X] PyInstaller compilation failed!")
        sys.exit(res.returncode)

    build_time = time.time() - start_time
    output_exe = RELEASE_DIR / "Exia.exe"
    if not output_exe.exists():
        print("[X] Compiled Exia.exe not found in release directory!")
        sys.exit(1)

    exe_size = output_exe.stat().st_size
    print(f"\n[OK] Standalone Exia.exe compiled successfully in {build_time:.1f}s!")
    print(f"Location: {output_exe}")
    print(f"Final Size: {format_size(exe_size)}")

    ROOT_RELEASE_DIR = PROJECT_ROOT / "release"
    ROOT_RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    try:
        shutil.copy2(output_exe, ROOT_RELEASE_DIR / "Exia.exe")
        print(f"[OK] Mirrored to root release folder: {ROOT_RELEASE_DIR / 'Exia.exe'}")
    except Exception as e:
        print(f"[!] Note: Could not copy to root release folder: {e}")

    # 5. Build Native Setup Wizard Installer (Exia-Setup.exe)
    SETUP_SPEC = BACKEND_DIR / "installer" / "setup_wizard.spec"
    if SETUP_SPEC.exists():
        print("\n[*] Packaging Standalone Windows Setup Wizard (Exia-Setup.exe)...")
        setup_workpath = BUILD_DIR / "setup_wizard"
        setup_cmd = [
            sys.executable,
            "-m",
            "PyInstaller",
            "--distpath",
            str(RELEASE_DIR),
            "--workpath",
            str(setup_workpath),
            "--noconfirm",
            str(SETUP_SPEC),
        ]
        res_setup = subprocess.run(setup_cmd, cwd=str(BACKEND_DIR))
        if res_setup.returncode == 0:
            setup_exe = RELEASE_DIR / "Exia-Setup.exe"
            if setup_exe.exists():
                print(f"[OK] Windows Setup Wizard compiled successfully: {setup_exe}")
                print(f"Installer Size: {format_size(setup_exe.stat().st_size)}")
                try:
                    shutil.copy2(setup_exe, ROOT_RELEASE_DIR / "Exia-Setup.exe")
                    print(f"[OK] Mirrored to root release folder: {ROOT_RELEASE_DIR / 'Exia-Setup.exe'}")
                except Exception:
                    pass

    # 6. Check for Inno Setup (ISCC)
    iscc_path = find_iscc()
    if iscc_path and ISS_FILE.exists():
        print("\n[*] Inno Setup Compiler detected! Building Windows Setup Wizard...")
        iscc_cmd = [str(iscc_path), str(ISS_FILE)]
        iscc_res = subprocess.run(iscc_cmd, cwd=str(BACKEND_DIR))
        if iscc_res.returncode == 0:
            setup_exe = RELEASE_DIR / "Exia-Setup-1.0.0.exe"
            if setup_exe.exists():
                setup_size = setup_exe.stat().st_size
                print(f"\n[OK] Inno Windows Setup Wizard built successfully!")
                print(f"Location: {setup_exe}")
                print(f"Installer Size: {format_size(setup_size)}")
                try:
                    shutil.copy2(setup_exe, ROOT_RELEASE_DIR / "Exia-Setup-1.0.0.exe")
                    print(f"[OK] Mirrored to root release folder: {ROOT_RELEASE_DIR / 'Exia-Setup-1.0.0.exe'}")
                except Exception as e:
                    pass
            else:
                print("[!] Inno Setup completed but installer binary not found in release.")
        else:
            print("[!] Inno Setup compilation encountered an error.")
    else:
        print("\n[INFO] Inno Setup (iscc.exe) not in PATH (Standard Setup Wizard Exia-Setup.exe is ready above).")
        print(f"       Inno script also available at: {ISS_FILE}")

    print("\n" + "=" * 60)
    print("[OK] BUILD COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    import time
    main()
