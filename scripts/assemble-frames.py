"""Stitch timestamped screencast frames (from record-video.cjs mobile) into a
constant-30fps H.264 MP4.  Usage: python3 assemble-frames.py <outDir> <out.mp4> [width]"""
import json, subprocess, sys
from pathlib import Path

out_dir, out_mp4 = Path(sys.argv[1]), sys.argv[2]
width = int(sys.argv[3]) if len(sys.argv) > 3 else 1080
frames = json.loads((out_dir / "frames.json").read_text())
frames = [f for f in frames if Path(f["file"]).exists()]
frames.sort(key=lambda f: f["t"])
# Drop the very first half-second (blank page before first paint).
t0 = frames[0]["t"] + 0.5
frames = [f for f in frames if f["t"] >= t0] or frames

lines = []
for cur, nxt in zip(frames, frames[1:]):
    lines += [f"file '{Path(cur['file']).resolve()}'", f"duration {max(nxt['t'] - cur['t'], 1/60):.4f}"]
lines += [f"file '{Path(frames[-1]['file']).resolve()}'", "duration 1.0", f"file '{Path(frames[-1]['file']).resolve()}'"]
listfile = out_dir / "concat.txt"
listfile.write_text("\n".join(lines) + "\n")

subprocess.run([
    "ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listfile),
    "-vf", f"scale={width}:-2:flags=lanczos,fps=30,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-movflags", "+faststart", out_mp4,
], check=True)
print(f"{len(frames)} frames -> {out_mp4}")
