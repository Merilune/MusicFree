import Theme from "@/core/theme";
import { createContext, useContext } from "react";

/**
 * 页面自带背景（例如歌单专属背景）时置为 true。
 * 全局壁纸没开也要让边框/阴影按「有背景」处理，否则会出现细线和黑色投影。
 */
export const LocalBackgroundContext = createContext(false);

/**
 * True when the page uses a wallpaper / custom background image.
 *
 * Previously required a non-preset theme id (`!p-*`), so users on p-dark/p-light
 * with a custom wallpaper still got hairline borders + black elevation rings.
 * Wallpaper alone is enough to treat chrome as "custom background".
 */
export default function useHasCustomBackground() {
    const background = Theme.useBackground();
    const hasLocalBackground = useContext(LocalBackgroundContext);
    return hasLocalBackground || !!background?.url;
}
