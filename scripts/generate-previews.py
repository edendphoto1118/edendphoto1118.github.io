from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageOps


IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
MAX_DIMENSION = 1600
QUALITY = 82


def is_source_image(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS


def output_path(source: Path, works_dir: Path, previews_dir: Path) -> Path:
    return (previews_dir / source.relative_to(works_dir)).with_suffix('.webp')


def needs_update(source: Path, preview: Path) -> bool:
    return not preview.exists() or preview.stat().st_mtime < source.stat().st_mtime


def create_preview(source: Path, preview: Path) -> None:
    preview.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        if image.mode not in ('RGB', 'RGBA'):
            image = image.convert('RGBA' if 'transparency' in image.info else 'RGB')
        image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)
        image.save(preview, 'WEBP', quality=QUALITY, method=6)


def main() -> int:
    if len(sys.argv) != 3:
        print('Usage: generate-previews.py <works_dir> <previews_dir>', file=sys.stderr)
        return 1

    works_dir = Path(sys.argv[1])
    previews_dir = Path(sys.argv[2])
    generated = 0
    skipped = 0

    for source in works_dir.rglob('*'):
        relative_parts = source.relative_to(works_dir).parts
        if any(part.lower().startswith('vol') for part in relative_parts):
            continue
        if not is_source_image(source):
            continue

        preview = output_path(source, works_dir, previews_dir)
        if not needs_update(source, preview):
            skipped += 1
            continue

        try:
            create_preview(source, preview)
            generated += 1
        except (OSError, ValueError) as error:
            print(f'Skipped {source}: {error}', file=sys.stderr)

    print(f'Generated {generated} previews; reused {skipped}.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
