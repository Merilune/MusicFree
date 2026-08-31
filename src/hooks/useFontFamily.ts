import { useAppConfig } from "@/core/appConfig";
import type { TextStyle } from "react-native";

/** 内置字体注册名（react-native.config.js assets，打包进 APK） */
export const BUILTIN_FONT_FAMILIES = [
    "NotoSerifSC",
    "LXGWNeoZhiSong",
    "ZhiMangXing",
] as const;

export type AppFontFamily = (typeof BUILTIN_FONT_FAMILIES)[number] | "default";
export type LyricFontFamily = AppFontFamily | "follow";

function resolveFontFamily(choice: AppFontFamily | undefined): TextStyle["fontFamily"] {
    // 未配置或 default 时返回 undefined，沿用系统 sans-serif
    return choice && choice !== "default" ? choice : undefined;
}

/**
 * 全局应用字体。null = 系统默认（调用方不设 fontFamily，
 * 避免 undefined 与显式覆盖混淆）。
 */
export function useAppFontFamily(): string | null {
    const font = useAppConfig("font.appFontFamily");
    return resolveFontFamily(font) ?? null;
}

/**
 * 歌词页字体。follow 时回落到全局字体。
 */
export function useLyricFontFamily(): string | null {
    const lyricFont = useAppConfig("font.lyricFontFamily");
    const appFont = useAppConfig("font.appFontFamily");
    if (lyricFont && lyricFont !== "follow") {
        return resolveFontFamily(lyricFont) ?? null;
    }
    return resolveFontFamily(appFont) ?? null;
}
