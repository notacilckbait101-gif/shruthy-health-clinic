from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
NPM = shutil.which("npm.cmd") or shutil.which("npm")


def run(args: list[str]) -> None:
    completed = subprocess.run(args, cwd=ROOT)
    if completed.returncode != 0:
        raise SystemExit(completed.returncode)


if NPM is None:
    raise SystemExit("npm was not found on PATH.")

if not (ROOT / "node_modules").exists():
    print("Installing dependencies...")
    run([NPM, "install"])

build_id = ROOT / ".next" / "BUILD_ID"
middleware_manifest = ROOT / ".next" / "server" / "middleware-manifest.json"

if not build_id.exists() or not middleware_manifest.exists():
    if (ROOT / ".next").exists():
        shutil.rmtree(ROOT / ".next", ignore_errors=True)
    print("Production build not found. Building the app first...")
    run([NPM, "run", "build"])

print("Starting Shruty Health Clinic on http://localhost:3000")
run([NPM, "run", "start"])
