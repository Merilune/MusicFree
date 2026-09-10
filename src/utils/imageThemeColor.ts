import Color from "color";

/** 原生取色失败时用于识别的哨兵色，不能作为实际主题色写入。 */
export const IMAGE_COLOR_FALLBACK = "#010203";

export interface IImageColorCandidates {
    dominant?: string;
    primary?: string;
    average?: string;
    detail?: string;
    vibrant?: string;
    secondary?: string;
    muted?: string;
    darkVibrant?: string;
    lightVibrant?: string;
}

function parseCandidate(value?: string) {
    if (!value) {
        return null;
    }

    try {
        const color = Color(value);
        return color.hex().toLowerCase() === IMAGE_COLOR_FALLBACK.toLowerCase()
            ? null
            : color;
    } catch {
        return null;
    }
}

/**
 * 从原生 palette 结果中选出适合作为 UI 强调色的颜色。
 * 返回 null 表示所有字段都取色失败，调用方应保留用户原来的主题色。
 */
export function selectImageThemeColor(
    result: IImageColorCandidates,
): string | null {
    const dominant = parseCandidate(result.dominant ?? result.primary);
    const candidates = [
        dominant,
        parseCandidate(result.vibrant ?? result.secondary),
        parseCandidate(result.average ?? result.detail),
        parseCandidate(result.muted),
        parseCandidate(result.darkVibrant),
        parseCandidate(result.lightVibrant),
    ].filter((color): color is Color => color !== null);

    if (!candidates.length) {
        return null;
    }

    let base: Color;
    if (
        dominant &&
        dominant.saturationl() >= 15 &&
        dominant.lightness() >= 5 &&
        dominant.lightness() <= 85
    ) {
        const dominantHue = dominant.hue();
        base = candidates
            .map(color => {
                let score = color.saturationl();
                const lightness = color.lightness();
                if (lightness > 85 || lightness < 5) {
                    score *= 0.3;
                }
                const hueDistance = Math.min(
                    Math.abs(color.hue() - dominantHue),
                    360 - Math.abs(color.hue() - dominantHue),
                );
                if (hueDistance > 40) {
                    score *= 0.4;
                }
                return { color, score };
            })
            .sort((a, b) => b.score - a.score)[0].color;
    } else {
        base =
            candidates.find(
                color =>
                    color.saturationl() >= 20 && color.lightness() > 15,
            ) ?? candidates[0];
    }

    if (base.saturationl() < 20) {
        base = Color("#F2F2F2").lightness(
            Math.min(Math.max(base.lightness(), 40), 60),
        );
    }
    if (base.lightness() > 72) {
        base = base.lightness(62);
    } else if (base.lightness() < 32) {
        base = base.lightness(42);
    }

    return base.toString();
}
