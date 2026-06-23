#!/usr/bin/env python3
"""Generate the extension icons (16/48/128 px) with no dependencies.
Design: indigo rounded square + white left rail + two content lines.
Run: python3 make_icons.py
"""
import zlib
import struct
import os

ACCENT = (79, 70, 229)  # #4F46E5


def make_png(path, size):
    W = H = size
    r = max(2, round(size / 5))  # corner radius
    pad = size * 0.18
    rail_w = size * 0.20
    line_t = max(1, round(size / 16))
    ax0, ay0, ax1, ay1 = pad, pad, W - pad, H - pad
    cy1 = ay0 + (ay1 - ay0) * 0.30
    cy2 = ay0 + (ay1 - ay0) * 0.60

    def rounded(x, y):
        if x < 0 or x >= W or y < 0 or y >= H:
            return False
        cx = None
        cy = None
        if x < r and y < r:
            cx, cy = r, r
        elif x >= W - r and y < r:
            cx, cy = W - 1 - r, r
        elif x < r and y >= H - r:
            cx, cy = r, H - 1 - r
        elif x >= W - r and y >= H - r:
            cx, cy = W - 1 - r, H - 1 - r
        if cx is not None:
            return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
        return True

    raw = bytearray()
    for y in range(H):
        raw.append(0)  # PNG row filter: none
        for x in range(W):
            px = (0, 0, 0, 0)
            if rounded(x, y):
                px = (ACCENT[0], ACCENT[1], ACCENT[2], 255)
                if ax0 <= x < ax1 and ay0 <= y < ay1:
                    if x < ax0 + rail_w:
                        px = (255, 255, 255, 255)
                    elif (cy1 <= y < cy1 + line_t or cy2 <= y < cy2 + line_t) and x < ax1 - size * 0.06:
                        px = (255, 255, 255, 255)
            raw.extend(px)

    def chunk(typ, data):
        return (
            struct.pack(">I", len(data))
            + typ
            + data
            + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
        )

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0)  # 8-bit RGBA
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


if __name__ == "__main__":
    os.makedirs("icons", exist_ok=True)
    for s in (16, 48, 128):
        make_png(os.path.join("icons", f"icon{s}.png"), s)
        print(f"wrote icons/icon{s}.png")
