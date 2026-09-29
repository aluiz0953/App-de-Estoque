"""Renders frames of the web login's shader (frontend/web/src/components/HeroGeometric.jsx)
to images for the React Native login, which cannot run WebGL without a native library.

Same math as the fragment shader: simplex-noise diagonal gradient posterized to four
tones with 4x4 Bayer dithering, a fade in the bottom-left corner and a soft vignette.
No circles: only the shader look.

    python scripts/generate-login-background.py

Requires numpy and pillow. Output: src/assets/login-bg-{a,b,c}.webp
"""
import os

import numpy as np
from PIL import Image

W, H = 720, 1560  # portrait phone; RN scales it to the screen with resizeMode="cover"
COLOR1 = "#d5a0a2"  # colors.secondary  (dusty rose)
COLOR2 = "#f4efe8"  # colors.background (cream)
# Noise offsets (the shader moves them with uTime * (0.05, 0.03)); far apart so the
# three frames look clearly different and the crossfade reads as flowing.
OFFSETS = {"a": (0.0, 0.0), "b": (0.55, 0.33), "c": (1.15, 0.69)}
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "assets")


def hex_to_rgb(value):
    value = value.lstrip("#")
    return np.array([int(value[i : i + 2], 16) / 255.0 for i in (0, 2, 4)])


def permute(x):
    return np.mod(((x * 34.0) + 1.0) * x, 289.0)


def snoise(vx, vy):
    """Port of the GLSL 2D simplex noise used by the shader."""
    C = (0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439)
    s = (vx + vy) * C[1]
    ix, iy = np.floor(vx + s), np.floor(vy + s)
    t = (ix + iy) * C[0]
    x0x, x0y = vx - ix + t, vy - iy + t
    right = x0x > x0y
    i1x, i1y = np.where(right, 1.0, 0.0), np.where(right, 0.0, 1.0)
    x1x, x1y = x0x + C[0] - i1x, x0y + C[0] - i1y
    x2x, x2y = x0x + C[2], x0y + C[2]
    ix, iy = np.mod(ix, 289.0), np.mod(iy, 289.0)
    p = [permute(permute(iy + o) + ix + q) for o, q in ((0.0, 0.0), (i1y, i1x), (1.0, 1.0))]
    m = [np.maximum(0.5 - (a * a + b * b), 0.0) for a, b in ((x0x, x0y), (x1x, x1y), (x2x, x2y))]
    m = [mm * mm * mm * mm for mm in m]
    total = 0.0
    for k, (px, (ax, ay)) in enumerate(zip(p, ((x0x, x0y), (x1x, x1y), (x2x, x2y)))):
        x = 2.0 * (px * C[3] - np.floor(px * C[3])) - 1.0
        h = np.abs(x) - 0.5
        ox = np.floor(x + 0.5)
        a0 = x - ox
        mk = m[k] * (1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h))
        total = total + mk * (a0 * ax + h * ay)
    return 130.0 * total


BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def render(dx, dy):
    ys, xs = np.mgrid[0:H, 0:W]
    u = (xs + 0.5) / W
    v = 1.0 - (ys + 0.5) / H  # GLSL uv origin is bottom-left
    noise = snoise(u * 1.5 + dx, v * 1.5 + dy) * 0.25
    gradient = (u + v) * 0.5 * 1.2 + noise

    deep, pale = hex_to_rgb(COLOR1), hex_to_rgb(COLOR2)
    soft = deep + (pale - deep) * 0.33
    light = deep + (pale - deep) * 0.66
    tones = [deep, soft, light, pale]

    band = np.select([gradient < 0.3, gradient < 0.55, gradient < 0.8], [0, 1, 2], default=3)
    threshold = gradient * 4.0 - np.floor(gradient * 4.0)
    dither = BAYER[(H - 1 - ys) % 4, xs % 4]  # gl_FragCoord.y counts from the bottom
    bump = (band < 3) & (threshold > dither * 0.5)
    band = np.where(bump, band + 1, band)

    color = np.stack([np.choose(band, [t[c] for t in tones]) for c in range(3)], axis=-1)

    # Bottom-left corner fades to the page color, then the soft vignette.
    fade = smoothstep(0.0, 0.25, np.sqrt(u * u + v * v))[..., None]
    color = pale * (1.0 - fade) + color * fade
    dist = np.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2)
    vignette = 1.0 - smoothstep(0.3, 1.2, dist)
    color = color + (color * 0.95 - color) * ((1.0 - vignette) * 0.3)[..., None]
    return Image.fromarray((np.clip(color, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8), "RGB")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, (dx, dy) in OFFSETS.items():
        path = os.path.join(OUT, f"login-bg-{name}.webp")
        # Lossless keeps the dither crisp; the image is only a few dozen KB either way.
        render(dx, dy).save(path, "WEBP", lossless=True, quality=100, method=6)
        print(path, os.path.getsize(path) // 1024, "KB")
