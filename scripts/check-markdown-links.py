#!/usr/bin/env python3
"""Validate relative Markdown links and image paths without network access."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []
for md in ROOT.rglob("*.md"):
    if any(part in {".git", "node_modules"} for part in md.parts):
        continue
    text = md.read_text(encoding="utf-8")
    # Ignore fenced code blocks to avoid treating examples as links.
    text = re.sub(r"(?ms)^\x60\x60\x60.*?^\x60\x60\x60[^\n]*$", "", text)
    for target in re.findall(r"!?(?:\[[^\]]*\])\(([^)]+)\)", text):
        target = target.split()[0].strip("<>")
        if not target or target.startswith(("http://", "https://", "mailto:", "#")):
            continue
        path = target.split("#", 1)[0].split("?", 1)[0]
        if not path:
            continue
        candidate = (md.parent / path).resolve()
        if not candidate.exists():
            errors.append(f"{md.relative_to(ROOT)}: broken local link -> {target}")
if errors:
    print("\n".join(errors))
    sys.exit(1)
print("Markdown local-link check passed.")
