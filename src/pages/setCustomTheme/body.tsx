import Image from "@/components/base/image";
import ThemeText from "@/components/base/themeText";
import SliderRow from "@/components/base/sliderRow";
import { showPanel } from "@/components/panels/usePanel";
import { ImgAsset } from "@/constants/assetsConst";
import globalStyle from "@/constants/globalStyle";
import { useI18N } from "@/core/i18n";
import Theme, {
    customBackgroundSurfaceColors,
    customThemeDefaultPrimary,
    darkTheme,
    DEFAULT_BACKGROUND_BLUR,
    DEFAULT_BACKGROUND_OPACITY,
} from "@/core/theme";
import { CustomizedColors } from "@/hooks/useColors";
import {
    pickBackgroundImage,
    saveBackgroundImage,
} from "@/utils/backgroundImage";
import rpx from "@/utils/rpx";
import { devLog } from "@/utils/log";
import Color from "color";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import ImageColors from "react-native-image-colors";

export default function Body() {
    const theme = Theme.useTheme();
    const backgroundInfo = Theme.useBackground();
    const { t } = useI18N();

    async function onImageClick() {
        try {
            const uri = await pickBackgroundImage();
            if (!uri) {
                return;
            }

            const bgUrl = await saveBackgroundImage(uri, "background");

            const colorsResult = await ImageColors.getColors(uri, {
                fallback: "#ffffff",
            });
            const colors = {
                primary:
                    colorsResult.platform === "android"
                        ? colorsResult.dominant
                        : colorsResult.platform === "ios"
                            ? colorsResult.primary
                            : colorsResult.vibrant,
                average:
                    colorsResult.platform === "android"
                        ? colorsResult.average
                        : colorsResult.platform === "ios"
                            ? colorsResult.detail
                            : colorsResult.dominant,
                vibrant:
                    colorsResult.platform === "android"
                        ? colorsResult.vibrant
                        : colorsResult.platform === "ios"
                            ? colorsResult.secondary
                            : colorsResult.vibrant,
            };

            // 候选色全部收集，以 dominant（主导色）为基准挑：
            // Palette 对深色图的量化可能抠出只占极小面积的暖色 vibrant
            // （蓝黑图出橙色就是它），色相偏离主导色太多的候选强降权
            const candidates = [colors.primary, colors.vibrant, colors.average]
                .filter(Boolean)
                .map(cl => Color(cl));
            const dom = candidates[0];
            let base: Color;
            if (
                dom &&
                dom.saturation() >= 0.15 &&
                dom.lightness() >= 0.05 &&
                dom.lightness() <= 0.85
            ) {
                const domHue = dom.hue();
                base = candidates
                    .map(c => {
                        let score = c.saturation();
                        const l = c.lightness();
                        if (l > 0.85 || l < 0.05) {
                            score *= 0.3;
                        }
                        const dh = Math.min(
                            Math.abs(c.hue() - domHue),
                            360 - Math.abs(c.hue() - domHue),
                        );
                        if (dh > 40) {
                            score *= 0.4;
                        }
                        return { c, score };
                    })
                    .sort((a, b) => b.score - a.score)[0].c;
            } else {
                // dominant 本身接近黑/白/灰（色相不可信），用中性白保持黑白调
                base =
                    candidates.find(
                        c => c.saturation() >= 0.2 && c.lightness() > 0.15,
                    ) ?? Color(customThemeDefaultPrimary);
            }

            // 归一化：饱和度太低（灰白）提饱和，亮度太亮（白）/太黑收进
            // 中间区间，保证主色在深浅底色上都看得清，不会出现纯白主色
            let normalizedPrimary: string;
            try {
                let c = base;
                if (c.saturation() < 0.2) {
                    // 灰白图保持黑白调，只把亮度收进可读区间，不提饱和
                    // （提饱和会借 hue=0 变成粉色）
                    c = Color(customThemeDefaultPrimary).lightness(
                        Math.min(Math.max(c.lightness(), 0.4), 0.6),
                    );
                }
                const lightness = c.lightness();
                if (lightness > 0.72) {
                    c = c.lightness(0.62);
                } else if (lightness < 0.32) {
                    c = c.lightness(0.42);
                }
                normalizedPrimary = c.toString();
            } catch {
                normalizedPrimary = customThemeDefaultPrimary;
            }

            const neutralMusicBar = Color(darkTheme.colors.musicBar)
                .alpha(0.92)
                .toString();

            const themeColors: Partial<CustomizedColors> = {
                ...customBackgroundSurfaceColors,
                primary: normalizedPrimary,
                musicBar: neutralMusicBar,
                tabBar: Color(normalizedPrimary).alpha(0.2).toString(),
            };

            Theme.setTheme("custom", {
                colors: themeColors,
                background: {
                    url: bgUrl,
                },
            });
            // Config.set('setting.theme.colors', {
            //     primary: primaryColor,
            //     textHighlight: textHighlight,
            //     accent: textHighlight,
            // });
        } catch (e) {
            devLog("warn", "🎨[自定义主题] 主题生成异常", e);
        }
    }

    return (
        <ScrollView style={globalStyle.fwflex1}>
            <TouchableOpacity onPress={onImageClick}>
                <Image
                    style={styles.image}
                    uri={backgroundInfo?.url}
                    emptySrc={ImgAsset.addBackground}
                />
            </TouchableOpacity>

            <View style={styles.sliderWrapper}>
                <SliderRow
                    title={t("setCustomTheme.blur")}
                    value={backgroundInfo?.blur ?? DEFAULT_BACKGROUND_BLUR}
                    minimumValue={0}
                    maximumValue={50}
                    step={1}
                    onChange={val => {
                        Theme.setBackground({
                            blur: val,
                        });
                    }}
                />
                <SliderRow
                    title={t("setCustomTheme.opacity")}
                    value={
                        backgroundInfo?.opacity ?? DEFAULT_BACKGROUND_OPACITY
                    }
                    minimumValue={0}
                    maximumValue={1}
                    step={0.01}
                    format={val => `${Math.round(val * 100)}%`}
                    onChange={val => {
                        Theme.setBackground({
                            opacity: val,
                        });
                    }}
                />
            </View>
            <View style={styles.colorsContainer}>
                {Theme.configableColorKey.map(key => (
                    <View key={key} style={styles.colorItem}>
                        <ThemeText>{t("setCustomTheme." + key + "Color" as any)}</ThemeText>
                        <TouchableOpacity
                            onPress={() => {
                                showPanel("ColorPicker", {
                                    // @ts-ignore
                                    defaultColor: theme.colors[key],
                                    onSelected(color) {
                                        Theme.setColors({
                                            [key]: color.hexa().toString(),
                                        });
                                    },
                                });
                            }}
                            style={styles.colorItemBlockContainer}>
                            <View style={[styles.colorBlockContainer]}>
                                <Image
                                    resizeMode="repeat"
                                    emptySrc={ImgAsset.transparentBg}
                                    style={styles.transparentBg}
                                />
                                <View
                                    style={[
                                        {
                                            /** @ts-ignore */
                                            backgroundColor: theme.colors[key],
                                        },
                                        styles.colorBlock,
                                    ]}
                                />
                            </View>
                            <ThemeText
                                fontSize="subTitle"
                                style={styles.colorText}>
                                {
                                    /** @ts-ignore */
                                    Color(theme.colors[key]).hexa().toString()
                                }
                            </ThemeText>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        flex: 1,
    },
    image: {
        marginTop: rpx(36),
        borderRadius: rpx(12),
        width: rpx(460),
        height: rpx(690),
        alignSelf: "center",
    },
    sliderWrapper: {
        marginTop: rpx(36),
        width: "100%",
    },
    colorsContainer: {
        width: "100%",
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: rpx(48),
        paddingHorizontal: rpx(24),
        justifyContent: "space-between",
    },
    colorItem: {
        flex: 1,
        flexBasis: "40%",
        marginBottom: rpx(36),
    },
    colorBlockContainer: {
        width: rpx(76),
        height: rpx(50),
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#ccc",
    },
    colorBlock: {
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 2,
    },
    colorItemBlockContainer: {
        marginTop: rpx(18),
        flexDirection: "row",
        alignItems: "center",
    },
    colorText: {
        marginLeft: rpx(8),
    },
    transparentBg: {
        position: "absolute",
        zIndex: -1,
        width: "100%",
        height: "100%",
        left: 0,
        top: 0,
    },
});
