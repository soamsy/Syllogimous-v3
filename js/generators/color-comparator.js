class ColorComparator {
    static hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
    }

    static rgbToXyz(r, g, b) {
        [r, g, b] = [r, g, b].map(v => {
            v /= 255;
            return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92;
        });

        return [
            (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100,
            (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) * 100,
            (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) * 100
        ];
    }

    static xyzToLab(x, y, z) {
        const refX = 95.047, refY = 100.000, refZ = 108.883;
        x /= refX; y /= refY; z /= refZ;

        [x, y, z] = [x, y, z].map(v =>
            v > 0.008856 ? Math.cbrt(v) : (7.787 * v) + (16 / 116)
        );

        return [
            (116 * y) - 16,
            500 * (x - y),
            200 * (y - z)
        ];
    }

    static deltaE2000(lab1, lab2) {
        const [L1, a1, b1] = lab1, [L2, a2, b2] = lab2;
        const avgL = (L1 + L2) / 2;
        const C1 = Math.sqrt(a1 ** 2 + b1 ** 2);
        const C2 = Math.sqrt(a2 ** 2 + b2 ** 2);
        const avgC = (C1 + C2) / 2;

        const G = 0.5 * (1 - Math.sqrt(avgC ** 7 / (avgC ** 7 + 25 ** 7)));
        const a1p = (1 + G) * a1;
        const a2p = (1 + G) * a2;
        const C1p = Math.sqrt(a1p ** 2 + b1 ** 2);
        const C2p = Math.sqrt(a2p ** 2 + b2 ** 2);
        const avgCp = (C1p + C2p) / 2;

        const h1p = Math.atan2(b1, a1p) * (180 / Math.PI);
        const h2p = Math.atan2(b2, a2p) * (180 / Math.PI);
        const avgHp = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2;

        const T = 1 -
            0.17 * Math.cos((avgHp - 30) * (Math.PI / 180)) +
            0.24 * Math.cos((2 * avgHp) * (Math.PI / 180)) +
            0.32 * Math.cos((3 * avgHp + 6) * (Math.PI / 180)) -
            0.20 * Math.cos((4 * avgHp - 63) * (Math.PI / 180));

        const deltaLp = L2 - L1;
        const deltaCp = C2p - C1p;
        const deltaHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(((h2p - h1p) / 2) * (Math.PI / 180));

        const SL = 1 + ((0.015 * (avgL - 50) ** 2) / Math.sqrt(20 + (avgL - 50) ** 2));
        const SC = 1 + 0.045 * avgCp;
        const SH = 1 + 0.015 * avgCp * T;

        const deltaTheta = 30 * Math.exp(-(((avgHp - 275) / 25) ** 2));
        const RC = 2 * Math.sqrt(avgCp ** 7 / (avgCp ** 7 + 25 ** 7));
        const RT = -RC * Math.sin(2 * deltaTheta * (Math.PI / 180));

        return Math.sqrt(
            (deltaLp / SL) ** 2 +
            (deltaCp / SC) ** 2 +
            (deltaHp / SH) ** 2 +
            RT * (deltaCp / SC) * (deltaHp / SH)
        );
    }

    static compareHslColors(hsl1, hsl2) {
        const parseHsl = hsl => hsl.match(/\d+/g).map(Number);

        const rgb1 = this.hslToRgb(...parseHsl(hsl1));
        const rgb2 = this.hslToRgb(...parseHsl(hsl2));

        const lab1 = this.xyzToLab(...this.rgbToXyz(...rgb1));
        const lab2 = this.xyzToLab(...this.rgbToXyz(...rgb2));

        return this.deltaE2000(lab1, lab2);
    }

    static areSimilarHslColors(hsl1, hsl2) {
      const index = this.compareHslColors(hsl1, hsl2);
      return index < 18;
    }
}
