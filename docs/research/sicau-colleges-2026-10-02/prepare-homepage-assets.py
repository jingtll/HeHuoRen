"""Offline asset preparation: Python 3 + Pillow 12.2.0. No runtime processing.

Run from any directory; existing originals are reused. Official URLs and crop
coordinates come from colleges.json. IDs below are permanent integration keys.
"""

import base64
from concurrent.futures import ThreadPoolExecutor
import hashlib
from io import BytesIO
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen

from PIL import Image

RESEARCH = Path(__file__).resolve().parent
ROOT = RESEARCH.parents[2]
OUTPUT = ROOT / "apps/web/src/assets/colleges"
DATA = ROOT / "apps/web/src/data/colleges.ts"
COLLEGE_IDS = {
    "农学院": "agriculture",
    "动物科技学院": "animal-science",
    "动物医学院": "veterinary-medicine",
    "草业科技学院": "grassland-science",
    "水产学院": "fisheries",
    "林学院": "forestry",
    "园艺学院": "horticulture",
    "风景园林学院": "landscape-architecture",
    "资源学院": "resources",
    "环境学院": "environment",
    "经济学院": "economics",
    "管理学院": "management",
    "农业工程学院": "agricultural-engineering",
    "食品学院": "food-science",
    "理学院": "science",
    "生命科学学院": "life-science",
    "机电学院": "mechanical-electrical",
    "信息工程学院": "information-engineering",
    "水利水电学院": "water-conservancy",
    "人文学院": "humanities",
    "公共管理学院": "public-administration",
    "法学院": "law",
    "体育学院": "sports",
    "艺术与传媒学院": "arts-media",
    "建筑与城乡规划学院": "architecture-planning",
    "土木工程学院": "civil-engineering",
    "商旅学院": "business-tourism",
}


def prepare(item):
    college_id, record = item
    if not record["independentLogoFound"]:
        return {"id": college_id, "name": record["name"], "file": None, "whiteArtwork": False}
    local = record.get("assetLocalPath")
    if local:
        svg = (RESEARCH / local).read_text(encoding="utf-8")
        payload = base64.b64decode(re.search(r"data:image/png;base64,([^\"\s]+)", svg)[1])
        original = RESEARCH / "originals" / f"{college_id}-embedded.png"
        original.write_bytes(payload)
        source = local
    else:
        original = RESEARCH / "originals" / f"{college_id}.png"
        source = record["assetUrl"]
        if not original.exists():
            request = Request(source, headers={"User-Agent": "Mozilla/5.0", "Referer": record["assetSource"]})
            with urlopen(request, timeout=60) as response:
                original.write_bytes(response.read())
        payload = original.read_bytes()
    image = Image.open(BytesIO(payload)).convert("RGBA")
    crop = record["previewCrop"]
    if image.size != (crop["sourceWidth"], crop["sourceHeight"]):
        raise ValueError(f"{record['name']}: source size changed: {image.size}")
    box = (crop["x"], crop["y"], crop["x"] + crop["width"], crop["y"] + crop["height"])
    if box[0] < 0 or box[1] < 0 or box[2] > image.width or box[3] > image.height:
        raise ValueError(f"Invalid crop: {record['name']}")
    image = image.crop(box)
    # Largest display is 40 CSS px: use up to 80 physical px, without upscaling.
    image.thumbnail((80, 80), Image.Resampling.LANCZOS)
    visible_pixels = [pixel for pixel in image.get_flattened_data() if pixel[3] > 30]
    white_artwork = bool(visible_pixels) and all(min(pixel[:3]) > 220 for pixel in visible_pixels)
    candidates = {}
    for fmt in ("PNG", "WEBP"):
        buffer = BytesIO()
        options = {"optimize": True} if fmt == "PNG" else {"lossless": True, "method": 6, "exact": True}
        image.save(buffer, format=fmt, **options)
        candidates[fmt.lower()] = buffer.getvalue()
    extension = min(candidates, key=lambda fmt: len(candidates[fmt]))
    filename = f"{college_id}.{extension}"
    (OUTPUT / filename).write_bytes(candidates[extension])
    return {
        "id": college_id, "name": record["name"], "file": filename,
        "source": source, "sourcePage": record["assetSource"],
        "original": original.relative_to(RESEARCH).as_posix(),
        "originalBytes": len(payload), "originalSha256": hashlib.sha256(payload).hexdigest(),
        "crop": crop, "width": image.width, "height": image.height,
        "pngBytes": len(candidates["png"]), "webpBytes": len(candidates["webp"]),
        "selectedBytes": len(candidates[extension]),
        "whiteArtwork": white_artwork,
        "comparison": "Both candidates are lossless; choose smaller, with unchanged visible pixels.",
    }


def main():
    records = json.loads((RESEARCH / "colleges.json").read_text(encoding="utf-8"))["records"]
    if [record["name"] for record in records] != list(COLLEGE_IDS):
        raise ValueError("College names/order changed; preserve existing IDs and review the mapping.")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    DATA.parent.mkdir(parents=True, exist_ok=True)
    (RESEARCH / "originals").mkdir(exist_ok=True)
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(prepare, ((COLLEGE_IDS[record["name"]], record) for record in records)))
    imports = [f'import emblem{i} from "../assets/colleges/{row["file"]}?no-inline";' for i, row in enumerate(results) if row["file"]]
    entries = [f'  {{ id: "{row["id"]}", name: "{row["name"]}", emblem: ' + (f'emblem{i}' if row["file"] else 'null') + f', whiteArtwork: {str(row["whiteArtwork"]).lower()}' + ' },' for i, row in enumerate(results)]
    DATA.write_text('// Generated by docs/research/sicau-colleges-2026-10-02/prepare-homepage-assets.py.\n'
                    + '\n'.join(imports) + '\n\nexport const colleges = [\n' + '\n'.join(entries)
                    + '\n] as const;\n\nexport type CollegeId = (typeof colleges)[number]["id"];\n', encoding="utf-8")
    report = {"displayCssPixels": 40, "mobileDisplayCssPixels": 28, "targetPhysicalPixels": 80, "totalBytes": sum(row.get("selectedBytes", 0) for row in results), "records": results}
    (RESEARCH / "homepage-assets.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding="utf-8")
    print(json.dumps({"count": len(results), "images": sum(bool(row['file']) for row in results), "totalBytes": report['totalBytes']}, ensure_ascii=False))


if __name__ == "__main__":
    main()
