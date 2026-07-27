"""Refresh data/warming.json with the global mean-temperature series (NASA GISTEMP).

Runs as part of the daily build (best-effort: on any failure the existing file is
kept). GISTEMP anomalies are relative to the 1951–1980 mean; we add a fixed offset
to express them versus the 1850–1900 pre-industrial baseline (the offset the IPCC
AR6 uses is ~0.2 °C).
"""
import json
import os
import urllib.request
from datetime import datetime, timezone

GISTEMP_URL = "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv"
PREINDUSTRIAL_OFFSET = 0.2
UA = {"User-Agent": "climate-silent-coverage/1.0"}


def fetch_series():
    req = urllib.request.Request(GISTEMP_URL, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        text = r.read().decode("utf-8", "replace")
    series = []
    for line in text.splitlines():
        parts = line.split(",")
        if len(parts) < 14 or not parts[0].strip().isdigit():
            continue
        try:
            anom = round(float(parts[13].strip()) + PREINDUSTRIAL_OFFSET, 2)
        except ValueError:
            continue  # incomplete year (J-D shown as ***)
        series.append({"y": int(parts[0]), "a": anom})
    return series


def update(data_dir, force=False):
    path = os.path.join(data_dir, "warming.json")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if not force and os.path.exists(path):
        try:
            cur = json.load(open(path, encoding="utf-8"))
            if cur.get("updated", "")[:10] == today:
                return cur  # already refreshed today
        except Exception:
            pass
    try:
        series = fetch_series()
    except Exception as exc:
        print("  warming: GISTEMP fetch failed (%s); keeping existing file" % exc)
        return None
    if len(series) < 10:
        print("  warming: too few rows parsed; keeping existing file")
        return None
    latest = series[-1]
    out = {
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "NASA GISTEMP v4",
        "baseline": "pre-industrial (1850-1900)",
        "offset_note": "GISTEMP 1951-1980 anomaly + %.1f C" % PREINDUSTRIAL_OFFSET,
        "unit": "C", "span": 1,
        "hero_c": round(latest["a"], 1), "hero_year": latest["y"],
        "series": series,
        "sources": [
            {"label": "NASA GISTEMP", "url": "https://data.giss.nasa.gov/gistemp/"},
            {"label": "WMO", "url": "https://wmo.int/"},
            {"label": "Copernicus C3S", "url": "https://climate.copernicus.eu/"},
        ],
    }
    os.makedirs(data_dir, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    print("  warming: wrote %d years, %d = +%.2f C above pre-industrial"
          % (len(series), latest["y"], latest["a"]))
    return out
