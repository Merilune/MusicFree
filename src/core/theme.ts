import Config from "@/core/appConfig";

import {
    DarkTheme as _DarkTheme,
    DefaultTheme as _DefaultTheme,
    type Theme as NavigationTheme,
} from "@react-navigation/native";
import { GlobalState } from "@/utils/stateMapper";
import { CustomizedColors } from "@/hooks/useColors";
import Color from "color";
import { Appearance, Image as RNImage } from "react-native";

/** RN Navigation 7+ reads theme.fonts.regular in native-stack headers. */
const navigationFonts: NavigationTheme["fonts"] =
    _DefaultTheme.fonts ?? _DarkTheme.fonts;

function ensureNavigationFonts<T extends { fonts?: NavigationTheme["fonts"] }>(
    theme: T,
): T & { fonts: NavigationTheme["fonts"] } {
    return {
        ...theme,
        fonts: theme.fonts ?? navigationFonts,
    };
}

export const lightTheme = {
    id: "p-light",
    ..._DefaultTheme,
    fonts: navigationFonts,
    colors: {
        ..._DefaultTheme.colors,
        background: "transparent",
        text: "#191815",
        textSecondary: Color("#191815").alpha(0.62).toString(),
        primary: "#D94B32",
        pageBackground: "#F3F0E9",
        shadow: "#201D18",
        appBar: "#F3F0E9",
        appBarText: "#191815",
        musicBar: "#FAF7F0",
        musicBarText: "#191815",
        divider: "rgba(25,24,21,0.13)",
        border: "rgba(25,24,21,0.14)",
        listActive: "rgba(25,24,21,0.08)", // 使用文本颜色的半透明
        mask: "rgba(25,24,21,0.24)",
        backdrop: "#E9E4DA",
        surface: "#ECE7DD",
        surfaceElevated: "#FAF7F0",
        accentWarm: "#D94B32",
        accentCool: "#3F899B",
        tabBar: "#E9E4DA",
        placeholder: "#E4DED3",
        success: "#08A34C",
        danger: "#FC5F5F",
        info: "#0A95C8",
        card: "#EAE4D9",
        notification: "#E9E4DA",
    },
};

export const darkTheme = {
    id: "p-dark",
    ..._DarkTheme,
    fonts: navigationFonts,
    colors: {
        ..._DarkTheme.colors,
        background: "transparent",
        text: "#F5F2EB",
        textSecondary: Color("#F5F2EB").alpha(0.64).toString(),
        primary: "#6C9BFF",
        pageBackground: "#12101A",
        shadow: "#000000",
        appBar: "#12101A",
        appBarText: "#F5F2EB",
        musicBar: "#1F1A29",
        musicBarText: "#F8F5EE",
        divider: "rgba(245,242,235,0.11)",
        border: "rgba(245,242,235,0.12)",
        listActive: "rgba(245,242,235,0.10)", // 使用文本颜色的半透明
        mask: "rgba(10,8,14,0.82)",
        backdrop: "#1E1826",
        surface: "#1E1926",
        surfaceElevated: "#262030",
        accentWarm: "#FF9A6C",
        accentCool: "#54A5B8",
        tabBar: "#1E1826",
        placeholder: "#262030",
        success: "#08A34C",
        danger: "#FC5F5F",
        info: "#0A95C8",
        card: "#211B2B",
        notification: "#1E1826",
    },
};

interface IBackgroundInfo {
    url?: string;
    blur?: number;
    opacity?: number;
}

/** 写入背景时用的参数，url 传 null 表示显式清除背景图 */
interface IBackgroundInput {
    url?: string | null;
    blur?: number;
    opacity?: number;
}

/**
 * 自定义主题的初始主色：中性白，配深色底就是黑底白字；
 * 不再继承深色主题的橙色
 */
export const customThemeDefaultPrimary = "#F2F2F2";

/** 深色主题的旧默认主色（橙），用于旧配置迁移判定 */
const LEGACY_DARK_PRIMARY = "#FF7650";

/**
 * 自定义主题的黑白初始配色：主色中性白，底色纯黑，
 * 顶栏/标签栏/强调色一并脱离深色主题的橙与蓝灰
 */
export const customThemeDefaultColors = {
    primary: customThemeDefaultPrimary,
    pageBackground: "#000000",
    appBar: "#000000",
    tabBar: "#0A0A0A",
    musicBar: "#141414",
    card: "#121212",
    backdrop: "#161616",
    surface: "#141414",
    surfaceElevated: "#1D1D1D",
    notification: "#161616",
    placeholder: "#1F1F1F",
} as Partial<CustomizedColors>;

export const customBackgroundSurfaceColors: Partial<CustomizedColors> = {
    pageBackground: "rgba(0,0,0,0.12)",
    card: "rgba(0,0,0,0.22)",
    surface: "rgba(0,0,0,0.18)",
    surfaceElevated: "rgba(0,0,0,0.30)",
    appBar: "rgba(0,0,0,0.18)",
    tabBar: "rgba(0,0,0,0.22)",
    notification: "rgba(0,0,0,0.32)",
    backdrop: "rgba(0,0,0,0.62)",
    placeholder: "rgba(0,0,0,0.20)",
};

const themeStore = new GlobalState(ensureNavigationFonts(darkTheme));
const backgroundStore = new GlobalState<IBackgroundInfo | null>(null);

/** 背景默认模糊度 */
export const DEFAULT_BACKGROUND_BLUR = 20;
/** 背景默认不透明度 */
export const DEFAULT_BACKGROUND_OPACITY = 0.6;

/**
 * 会被「表面不透明度」影响的颜色。
 * pageBackground 是最底层的实色，不参与，否则会直接透出黑底。
 */
const surfaceColorKeys: Array<keyof CustomizedColors> = [
    "card",
    "surface",
    "surfaceElevated",
    "appBar",
    "musicBar",
    "tabBar",
    "backdrop",
    "placeholder",
    "notification",
];

/**
 * themeStore 里存的是叠加过「表面不透明度」的颜色，这里额外留一份未叠加的原始
 * 配色。持久化和再次计算都以它为基准，否则 alpha 会被反复乘进去越调越透。
 */
let baseColors = darkTheme.colors as CustomizedColors;

function applySurfaceOpacity(colors: CustomizedColors): CustomizedColors {
    const ratio = Config.getConfig("theme.surfaceOpacity") ?? 1;
    if (!(ratio > 0) || ratio >= 1) {
        return colors;
    }

    const nextColors = { ...colors };
    surfaceColorKeys.forEach(key => {
        const raw = nextColors[key] as string | undefined;
        if (!raw) {
            return;
        }

        try {
            const color = Color(raw);
            // @ts-ignore key 限定在字符串色值上
            nextColors[key] = color.alpha(color.alpha() * ratio).toString();
        } catch {
            // 非法色值保持原样
        }
    });

    return nextColors;
}

/** 写入主题：记录原始配色，同时把叠加「表面不透明度」后的颜色推给界面 */
function commitTheme(theme: any) {
    baseColors = theme.colors as CustomizedColors;
    themeStore.setValue(
        ensureNavigationFonts({
            ...theme,
            colors: applySurfaceOpacity(theme.colors),
        }),
    );
}

function sameColor(a?: string, b?: string) {
    if (!a || !b) {
        return false;
    }

    try {
        return Color(a).hexa().toLowerCase() === Color(b).hexa().toLowerCase();
    } catch {
        return a.toLowerCase() === b.toLowerCase();
    }
}

function normalizeCustomBackgroundColors(
    colors: CustomizedColors,
    hasBackground: boolean,
) {
    if (!hasBackground) {
        return colors;
    }

    const normalized = { ...colors };
    if (
        sameColor(normalized.appBar, normalized.primary) ||
        sameColor(normalized.appBar, darkTheme.colors.appBar)
    ) {
        normalized.appBar = customBackgroundSurfaceColors.appBar;
    }

    (Object.keys(customBackgroundSurfaceColors) as Array<
        keyof CustomizedColors
    >).forEach(key => {
        const current = normalized[key] as string | undefined;
        const preset =
            (darkTheme.colors as CustomizedColors)[key] ??
            (lightTheme.colors as CustomizedColors)[key];

        if (!current || sameColor(current, preset as string | undefined)) {
            // @ts-ignore key is constrained to CustomizedColors string colors here.
            normalized[key] = customBackgroundSurfaceColors[key];
        }
    });

    return normalized;
}

function getCardDerivedSurfaceElevated(card: string, dark: boolean) {
    try {
        return Color(card).lighten(dark ? 0.24 : 0.12).toString();
    } catch {
        return card;
    }
}

function isDefaultLikeColor(
    color: string | undefined,
    candidates: Array<string | undefined>,
) {
    if (!color) {
        return true;
    }
    return candidates.some(candidate => sameColor(color, candidate));
}

function syncCardSurfaceColors(
    colors: CustomizedColors,
    options: {
        force?: boolean;
        dark?: boolean;
    } = {},
) {
    const { force = false, dark = true } = options;
    if (!colors.card) {
        return {
            colors,
            changed: false,
        };
    }

    const cardIsCustomized =
        force ||
        !isDefaultLikeColor(colors.card, [
            darkTheme.colors.card,
            lightTheme.colors.card,
            customBackgroundSurfaceColors.card,
        ]);

    if (!cardIsCustomized) {
        return {
            colors,
            changed: false,
        };
    }

    let changed = false;
    const nextColors = { ...colors };
    if (
        force ||
        isDefaultLikeColor(nextColors.surface, [
            darkTheme.colors.surface,
            lightTheme.colors.surface,
            customBackgroundSurfaceColors.surface,
        ])
    ) {
        nextColors.surface = colors.card;
        changed = true;
    }

    if (
        force ||
        isDefaultLikeColor(nextColors.surfaceElevated, [
            darkTheme.colors.surfaceElevated,
            lightTheme.colors.surfaceElevated,
            customBackgroundSurfaceColors.surfaceElevated,
        ])
    ) {
        nextColors.surfaceElevated = getCardDerivedSurfaceElevated(
            colors.card,
            dark,
        );
        changed = true;
    }

    return {
        colors: nextColors,
        changed,
    };
}

function setup() {
    // 全新安装的默认主题用浅色（米白+红），不跟系统时也回落到浅色
    const configuredTheme = Config.getConfig("theme.selectedTheme") ?? "p-light";
    const followSystem = Config.getConfig("theme.followSystem");
    const systemTheme = followSystem ? Appearance.getColorScheme() : null;
    const currentTheme =
        systemTheme === "light"
            ? "p-light"
            : systemTheme === "dark"
                ? "p-dark"
                : configuredTheme;
    const bgUrl = Config.getConfig("theme.background");

    if (currentTheme === "p-dark") {
        commitTheme(darkTheme);
    } else if (currentTheme === "p-light") {
        commitTheme(lightTheme);
    } else {
        let savedColors = (Config.getConfig("theme.colors") as CustomizedColors) ??
            darkTheme.colors;

        // 旧默认色迁移：主色还是深色主题的橙（#FF7650）就说明从没真正
        // 自定义过配色，一次性换成黑白初始色。只看主色——pageBackground
        // 等字段在旧版本导入背景/调节时可能已被写成别的值，一并要求相等
        // 会让迁移永远不触发
        if (savedColors.primary === LEGACY_DARK_PRIMARY) {
            savedColors = {
                ...darkTheme.colors,
                ...customThemeDefaultColors,
            };
            Config.setConfig("theme.colors", savedColors);
            // customColors 是自定义主题入口的配色来源，一并迁移，
            // 否则旧默认橙会从那个入口复活
            const savedCustomColors = Config.getConfig("theme.customColors");
            if (savedCustomColors?.primary === LEGACY_DARK_PRIMARY) {
                Config.setConfig("theme.customColors", {
                    ...darkTheme.colors,
                    ...customThemeDefaultColors,
                });
            }
        }

        // 表面色迁移：setColors 会把深色主题的表面色（弹窗/卡片底）
        // 一并写进配置；深色主题改色后自定义主题会渗进它的紫灰。
        // 表面色全部与深色主题一致 = 从没单独调过，换成中性黑灰
        const surfaceKeys: (keyof CustomizedColors)[] = [
            "pageBackground",
            "appBar",
            "tabBar",
            "musicBar",
            "card",
            "backdrop",
            "surface",
            "surfaceElevated",
            "notification",
            "placeholder",
        ];
        const surfacesUntouched = surfaceKeys.every(
            key => savedColors[key] === darkTheme.colors[key],
        );
        if (surfacesUntouched) {
            savedColors = {
                ...savedColors,
                ...customThemeDefaultColors,
            };
            Config.setConfig("theme.colors", savedColors);
        }

        // 修复旧版本中错误的 listActive 配置
        // 如果 listActive 存在但与 primary 不匹配，重新生成
        const fixedColors = { ...savedColors };
        if (fixedColors.primary && fixedColors.listActive) {
            const expectedListActive = Color(fixedColors.primary).alpha(0.12).toString();
            // 检查现有的 listActive 是否基于 primary 颜色
            try {
                const currentListActiveColor = Color(fixedColors.listActive);
                const primaryColor = Color(fixedColors.primary);
                // 如果色相差异超过10度，或者不是半透明，则重新生成
                if (
                    Math.abs(currentListActiveColor.hue() - primaryColor.hue()) > 10 ||
                    currentListActiveColor.alpha() > 0.2
                ) {
                    fixedColors.listActive = expectedListActive;
                    Config.setConfig("theme.colors", fixedColors);
                }
            } catch {
                // 解析失败，重新生成
                fixedColors.listActive = expectedListActive;
                Config.setConfig("theme.colors", fixedColors);
            }
        }

        const cardSynced = syncCardSurfaceColors(fixedColors);
        if (cardSynced.changed) {
            Config.setConfig("theme.colors", cardSynced.colors);
        }

        // Custom themes previously omitted `fonts`, which crashes RN Navigation 7
        // native-stack (Cannot read property 'regular' of undefined).
        commitTheme({
            ...darkTheme,
            id: currentTheme,
            dark: true,
            // @ts-ignore
            colors: normalizeCustomBackgroundColors(cardSynced.colors, !!bgUrl),
        });
    }

    const bgBlur = Config.getConfig("theme.backgroundBlur");
    const bgOpacity = Config.getConfig("theme.backgroundOpacity");

    backgroundStore.setValue({
        url: bgUrl,
        blur: bgBlur ?? DEFAULT_BACKGROUND_BLUR,
        opacity: bgOpacity ?? DEFAULT_BACKGROUND_OPACITY,
    });

    // Warm the native image cache while the splash screen is still visible.
    // This is fire-and-forget: a slow/corrupt image must never delay startup.
    if (bgUrl && typeof RNImage.prefetch === "function") {
        try {
            RNImage.prefetch(bgUrl).catch(() => false);
        } catch {
            // A malformed persisted URI must not abort the bootstrap path.
        }
    }
}

function setTheme(
    themeName: string,
    extra?: {
        colors?: Partial<CustomizedColors>;
        background?: IBackgroundInput;
    },
) {
    if (themeName === "p-light") {
        commitTheme(lightTheme);
    } else if (themeName === "p-dark") {
        commitTheme(darkTheme);
    } else {
        const hasBackground = !!(
            extra?.background?.url ??
            backgroundStore.getValue()?.url ??
            Config.getConfig("theme.background")
        );
        commitTheme({
            ...darkTheme,
            id: themeName,
            dark: true,
            colors: normalizeCustomBackgroundColors(
                {
                    ...darkTheme.colors,
                    ...customThemeDefaultColors,
                    ...(extra?.colors ?? {}),
                },
                hasBackground,
            ) as typeof darkTheme.colors,
        });
    }

    Config.setConfig("theme.selectedTheme", themeName);
    // 存未叠加「表面不透明度」的原始配色，否则 alpha 会被反复乘进去
    Config.setConfig("theme.colors", baseColors);

    if (extra?.background) {
        const currentBg = backgroundStore.getValue();
        let newBg: IBackgroundInfo = {
            blur: DEFAULT_BACKGROUND_BLUR,
            opacity: DEFAULT_BACKGROUND_OPACITY,
            ...(currentBg ?? {}),
        };
        if (typeof extra.background.blur === "number") {
            newBg.blur = extra.background.blur;
        }
        if (typeof extra.background.opacity === "number") {
            newBg.opacity = extra.background.opacity;
        }
        if (extra.background.url === null) {
            newBg.url = undefined;
        } else if (extra.background.url) {
            newBg.url = extra.background.url;
        }

        Config.setConfig("theme.background", newBg.url);
        Config.setConfig("theme.backgroundBlur", newBg.blur);
        Config.setConfig("theme.backgroundOpacity", newBg.opacity);

        backgroundStore.setValue(newBg);
    }
}

function setColors(colors: Partial<CustomizedColors>) {
    const currentTheme = themeStore.getValue();
    const persistedColors = Config.getConfig("theme.colors") as
        | CustomizedColors
        | undefined;

    // 如果设置了 primary 但没有明确设置 listActive，自动生成 listActive
    const colorsWithListActive = { ...colors };
    if (colors.primary && !colors.listActive) {
        colorsWithListActive.listActive = Color(colors.primary).alpha(0.12).toString();
    }

    const mergedColors = {
        ...darkTheme.colors,
        ...(persistedColors ?? {}),
        // 用未叠加「表面不透明度」的原始配色，否则 alpha 会被反复乘进去
        ...baseColors,
        ...colorsWithListActive,
    } as CustomizedColors;
    const newColors = syncCardSurfaceColors(mergedColors, {
        force: !!colors.card,
        dark: currentTheme.dark,
    }).colors;

    Config.setConfig("theme.customColors", newColors);
    Config.setConfig("theme.colors", newColors);

    if (currentTheme.id !== "p-light" && currentTheme.id !== "p-dark") {
        const hasBackground = !!(
            backgroundStore.getValue()?.url ?? Config.getConfig("theme.background")
        );
        const newTheme = {
            ...currentTheme,
            colors: normalizeCustomBackgroundColors(
                newColors,
                hasBackground,
            ) as typeof currentTheme.colors,
        };
        Config.setConfig("theme.colors", newTheme.colors);
        commitTheme(newTheme);
    }
}

/** 全局「表面不透明度」：卡片、弹窗、顶栏等叠加一层统一的 alpha 系数 */
function setSurfaceOpacity(opacity: number) {
    Config.setConfig("theme.surfaceOpacity", opacity);
    // 拿原始配色重算一遍推给界面，不动持久化的配色
    commitTheme({
        ...themeStore.getValue(),
        colors: baseColors,
    });
}

/** 抽屉这类整片滑出的浮层，底色至少要有这么多不透明度才立得住形态 */
const MIN_SLIDING_SURFACE_ALPHA = 0.94;

/**
 * 抽屉底色。不能直接用 colors.card：设了壁纸时 card 会被
 * customBackgroundSurfaceColors.card 换成 rgba(0,0,0,0.22)，那个值适合
 * 「轻微暗化的一片区域」，但撑不起一个滑出来的面板 —— 右缘会是一条从 22% 黑
 * 突变到全透明的硬直线，圆角和阴影也没有东西可以附着。
 *
 * 这里回落到主题自身的面板色再补足不透明度，而不是把那层黑叠加的 alpha 拉高：
 * 有壁纸时文字色并没有被一起改（normalizeCustomBackgroundColors 不碰 text），
 * 直接加深黑底会在浅色主题下把深色文字吞掉。
 *
 * 用未乘「表面不透明度」的 baseColors 计算，最后再乘回该系数，
 * 这样用户主动调低透明度的意图不会被这里覆盖。
 */
function getDrawerSurfaceColor() {
    const dark = !!themeStore.getValue().dark;
    const presetCard = (
        dark ? darkTheme.colors.card : lightTheme.colors.card
    ) as string;
    const raw = baseColors.card as string | undefined;

    // 被壁纸模式换成半透明黑叠加时，回到主题自己的面板色
    const base =
        !raw || sameColor(raw, customBackgroundSurfaceColors.card)
            ? presetCard
            : raw;

    const ratio = Config.getConfig("theme.surfaceOpacity") ?? 1;
    try {
        const color = Color(base);
        const alpha = Math.max(color.alpha(), MIN_SLIDING_SURFACE_ALPHA);
        return color.alpha(alpha * (ratio > 0 ? Math.min(ratio, 1) : 1)).toString();
    } catch {
        return base;
    }
}

/**
 * 弹窗底色。和抽屉同理：设了壁纸时 surfaceElevated 会被换成
 * rgba(0,0,0,0.30) 那层黑叠加，弹窗底直接透出壁纸，正文就糊了。
 * 回落到主题自己的 surfaceElevated 并补足不透明度。
 */
function getDialogSurfaceColor() {
    const dark = !!themeStore.getValue().dark;
    const preset = (
        dark ? darkTheme.colors.surfaceElevated : lightTheme.colors.surfaceElevated
    ) as string;
    const raw = baseColors.surfaceElevated as string | undefined;

    const base =
        !raw || sameColor(raw, customBackgroundSurfaceColors.surfaceElevated)
            ? preset
            : raw;

    const ratio = Config.getConfig("theme.surfaceOpacity") ?? 1;
    try {
        const color = Color(base);
        const alpha = Math.max(color.alpha(), MIN_SLIDING_SURFACE_ALPHA);
        return color.alpha(alpha * (ratio > 0 ? Math.min(ratio, 1) : 1)).toString();
    } catch {
        return base;
    }
}

/**
 * 不透明的页面底色。
 *
 * 全屏面板（评论、编辑歌单信息）跑在自己的 Modal 窗口里，下面没有 App 那棵树的
 * PageBackground 垫底。设了壁纸时 pageBackground 会被换成 rgba(0,0,0,0.12)，
 * 面板就成了一层 12% 的黑浮在下层页面像素上，文字自然看不清。
 *
 * 这里保证拿到一个 alpha 为 1 的底色：用户自定义的实色照用，
 * 半透明（含壁纸模式那层黑叠加）则回落到主题预设的页面色。
 * pageBackground 不在 surfaceColorKeys 里，不受「表面不透明度」影响，
 * 所以不需要像抽屉那样再乘系数。
 */
function getOpaquePageBackgroundColor() {
    const dark = !!themeStore.getValue().dark;
    const preset = (
        dark ? darkTheme.colors.pageBackground : lightTheme.colors.pageBackground
    ) as string;
    const raw = baseColors.pageBackground as string | undefined;

    if (!raw) {
        return preset;
    }

    try {
        const color = Color(raw);
        return color.alpha() >= 1 ? color.toString() : preset;
    } catch {
        return preset;
    }
}

function setBackground(backgroundInfo: IBackgroundInput) {
    const currentBackgroundInfo = backgroundStore.getValue();
    let newBgInfo: IBackgroundInfo = {
        ...(currentBackgroundInfo ?? {
            opacity: DEFAULT_BACKGROUND_OPACITY,
            blur: DEFAULT_BACKGROUND_BLUR,
        }),
    };
    if (typeof backgroundInfo.blur === "number") {
        Config.setConfig("theme.backgroundBlur", backgroundInfo.blur);
        newBgInfo.blur = backgroundInfo.blur;
    }
    if (typeof backgroundInfo.opacity === "number") {
        Config.setConfig("theme.backgroundOpacity", backgroundInfo.opacity);
        newBgInfo.opacity = backgroundInfo.opacity;
    }
    // null 表示显式清除；undefined 表示这次不动背景图
    if (backgroundInfo.url === null) {
        Config.setConfig("theme.background", undefined);
        newBgInfo.url = undefined;
    } else if (backgroundInfo.url !== undefined) {
        Config.setConfig("theme.background", backgroundInfo.url);
        newBgInfo.url = backgroundInfo.url;
    }
    backgroundStore.setValue(newBgInfo);
}

const configableColorKey: Array<keyof CustomizedColors> = [
    "primary",
    "text",
    "appBar",
    "appBarText",
    "musicBar",
    "musicBarText",
    "pageBackground",
    "backdrop",
    "card",
    "placeholder",
    "tabBar",
    "notification",
];

const Theme = {
    setup,
    setTheme,
    setBackground,
    setColors,
    setSurfaceOpacity,
    getDrawerSurfaceColor,
    getDialogSurfaceColor,
    getOpaquePageBackgroundColor,
    useTheme: themeStore.useValue,
    getTheme: themeStore.getValue,
    useBackground: backgroundStore.useValue,
    getBackground: backgroundStore.getValue,
    configableColorKey,
};

export default Theme;
