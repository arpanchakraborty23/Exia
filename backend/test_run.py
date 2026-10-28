import subprocess
import time
from pathlib import Path

exe = Path("release/Exia.exe").resolve()
if not exe.exists():
    exe = Path("backend/release/Exia.exe").resolve()

print(f"Testing {exe}")
proc = subprocess.Popen(
    [str(exe)],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    encoding="utf-8",
    errors="replace"
)

time.sleep(4)
proc.terminate()
try:
    stdout, stderr = proc.communicate(timeout=2)
except Exception:
    proc.kill()
    stdout, stderr = proc.communicate()

print("=== STDOUT ===")
print(stdout)
print("=== STDERR ===")
print(stderr)
print(f"Exit code: {proc.returncode}")
