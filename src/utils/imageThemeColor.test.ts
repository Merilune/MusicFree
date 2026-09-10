import { describe, expect, it } from "@jest/globals";
import Color from "color";
import {
    IMAGE_COLOR_FALLBACK,
    selectImageThemeColor,
} from "./imageThemeColor";

function hueOf(color: string) {
    return Color(color).hue();
}

describe("selectImageThemeColor", () => {
    it("selects a representative blue from a blue palette", () => {
        const result = selectImageThemeColor({
            dominant: "#214E9A",
            vibrant: "#3478D4",
            average: "#18345C",
        });
        expect(result).not.toBeNull();
        expect(hueOf(result!)).toBeGreaterThan(190);
        expect(hueOf(result!)).toBeLessThan(240);
    });

    it("selects a warm color from a warm palette", () => {
        const result = selectImageThemeColor({
            dominant: "#9B3A24",
            vibrant: "#DF5A35",
            average: "#6A3228",
        });
        expect(result).not.toBeNull();
        expect(hueOf(result!)).toBeLessThan(40);
    });

    it("ignores fallback fields when another field is valid", () => {
        const result = selectImageThemeColor({
            dominant: IMAGE_COLOR_FALLBACK,
            vibrant: "#2E7D32",
            average: IMAGE_COLOR_FALLBACK,
        });
        expect(result).not.toBeNull();
        expect(hueOf(result!)).toBeGreaterThan(80);
        expect(hueOf(result!)).toBeLessThan(160);
    });

    it("returns null when every field is a fallback", () => {
        expect(
            selectImageThemeColor({
                dominant: IMAGE_COLOR_FALLBACK,
                vibrant: IMAGE_COLOR_FALLBACK,
                average: IMAGE_COLOR_FALLBACK,
            }),
        ).toBeNull();
    });

    it("ignores invalid values", () => {
        expect(
            selectImageThemeColor({
                dominant: "not-a-color",
                vibrant: "also-invalid",
            }),
        ).toBeNull();
    });

    it("keeps monochrome images neutral and readable", () => {
        const result = selectImageThemeColor({
            dominant: "#E8E8E8",
            average: "#BDBDBD",
            muted: "#777777",
        });
        expect(result).not.toBeNull();
        expect(Color(result!).saturationl()).toBeLessThan(5);
        expect(Color(result!).lightness()).toBeGreaterThanOrEqual(0.4);
        expect(Color(result!).lightness()).toBeLessThanOrEqual(0.62);
    });
});
