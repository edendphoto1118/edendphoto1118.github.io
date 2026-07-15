import colorsys
import json
import math
import sys
import warnings
from pathlib import Path

from PIL import Image, ImageStat

warnings.filterwarnings("ignore", category=DeprecationWarning)


def image_tone(path):
    with Image.open(path) as image:
        image = image.convert("RGB")
        image.thumbnail((96, 96))
        pixels = list(image.getdata())

    weighted_hue_x = 0.0
    weighted_hue_y = 0.0
    total_weight = 0.0
    sat_total = 0.0
    light_total = 0.0

    for red, green, blue in pixels:
        hue, sat, light = colorsys.rgb_to_hls(red / 255, green / 255, blue / 255)
        weight = max(0.05, sat) * max(0.2, light)
        weighted_hue_x += weight * math.cos(hue * math.tau)
        weighted_hue_y += weight * math.sin(hue * math.tau)
        total_weight += weight
        sat_total += sat
        light_total += light

    count = max(1, len(pixels))
    hue = (math.atan2(weighted_hue_y, weighted_hue_x) / math.tau) % 1

    stat = ImageStat.Stat(Image.open(path).convert("RGB").resize((1, 1)))
    avg_red, avg_green, avg_blue = [round(value) for value in stat.mean]

    return {
        "file": path.name,
        "hue": round(hue, 4),
        "saturation": round(sat_total / count, 4),
        "lightness": round(light_total / count, 4),
        "averageRgb": [avg_red, avg_green, avg_blue],
    }


def main():
    directory = Path(sys.argv[1])
    files = [Path(item) for item in sys.argv[2:]]
    tones = [image_tone(directory / file_path.name) for file_path in files]
    tones.sort(key=lambda item: (round(item["hue"] * 12), item["lightness"], item["saturation"], item["file"]))
    print(json.dumps(tones, ensure_ascii=False))


if __name__ == "__main__":
    main()
