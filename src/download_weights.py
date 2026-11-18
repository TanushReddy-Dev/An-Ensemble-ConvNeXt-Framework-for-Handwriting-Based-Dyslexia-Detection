"""Utility script to ensure 5-fold ConvNeXt checkpoints are present.

If checkpoints are missing (e.g. during cloud deployment), this script automatically
downloads them from the GitHub v1.0.0 release.
"""

from pathlib import Path
import urllib.request
import sys

RELEASE_BASE_URL = "https://github.com/TanushReddy-Dev/An-Ensemble-ConvNeXt-Framework-for-Handwriting-Based-Dyslexia-Detection/releases/download/v1.0.0"
CHECKPOINT_DIR = Path(__file__).resolve().parent.parent / "outputs" / "checkpoints"

FOLDS = [f"convnext_fold{i}_best.pt" for i in range(5)]


def download_checkpoints_if_missing():
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    for filename in FOLDS:
        target_path = CHECKPOINT_DIR / filename
        if target_path.exists() and target_path.stat().st_size > 10_000_000:
            print(f"[OK] Checkpoint already present: {filename}")
            continue

        url = f"{RELEASE_BASE_URL}/{filename}"
        print(f"[Downloading] {filename} from {url} ...")
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req) as resp, open(target_path, "wb") as f:
                total_bytes = 0
                while chunk := resp.read(1024 * 1024):
                    f.write(chunk)
                    total_bytes += len(chunk)
            print(f"[Success] Downloaded {filename} ({total_bytes / (1024*1024):.1f} MB)")
        except Exception as e:
            print(f"[Error] Failed to download {filename}: {e}", file=sys.stderr)
            if target_path.exists():
                target_path.unlink()
            raise


if __name__ == "__main__":
    download_checkpoints_if_missing()
