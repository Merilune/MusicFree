import Image from "@/components/base/image";
import ThemeText from "@/components/base/themeText";
import SliderRow from "@/components/base/sliderRow";
import { showPanel } from "@/components/panels/usePanel";
import { ImgAsset } from "@/constants/assetsConst";
import globalStyle from "@/constants/globalStyle";
import { useI18N } from "@/core/i18n";
import Theme, {
    customBackgroundSurfaceColors,
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
import { trimHash } from "@/utils/fileUtils";
import {
    IMAGE_COLOR_FALLBACK,
    selectImageThemeColor,
} from "@/utils/imageThemeColor";
import { devLog } from "@/utils/log";
import Toast from "@/utils/toast";
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
        let bgUrl: string;
        let sourceUri: string;
        try {
            const uri = await pickBackgroundImage();
            if (!uri) {
                return;
            }
            sourceUri = uri;
            bgUrl = await saveBackgroundImage(uri, "background");
        } catch (e) {
            devLog("warn", "🎨[自定义主题] 背景图落盘失败", e);
            Toast.warn(`导入背景图失败：${(e as Error)?.message ?? e}`);
            return;
        }

        let autoPrimary: string | null = null;
        const paletteUris = [sourceUri, trimHash(bgUrl)].filter(
            (uri, index, all) => all.indexOf(uri) === index,
        );
        for (const [index, paletteUri] of paletteUris.entries()) {
            try {
                const colorsResult = await ImageColors.getColors(paletteUri, {
                    fallback: IMAGE_COLOR_FALLBACK,
                    cache: false,
                });
                autoPrimary = selectImageThemeColor(colorsResult);
                devLog("info", "🎨[自定义主题] 自动取色结果", {
                    attempt: index + 1,
                    uriType: paletteUri.split(":", 1)[0] || "path",
                    platform: colorsResult.platform,
                    success: !!autoPrimary,
                });
                if (autoPrimary) {
                    break;
                }
            } catch (e) {
                devLog("warn", "🎨[自定义主题] 自动取色尝试失败", {
                    attempt: index + 1,
                    uriType: paletteUri.split(":", 1)[0] || "path",
                    error: e,
                });
            }
        }

        const neutralMusicBar = Color(darkTheme.colors.musicBar)
            .alpha(0.92)
            .toString();
        const themeColors: Partial<CustomizedColors> = {
            ...customBackgroundSurfaceColors,
            musicBar: neutralMusicBar,
            ...(autoPrimary
                ? {
                    primary: autoPrimary,
                    tabBar: Color(autoPrimary).alpha(0.2).toString(),
                }
                : {}),
        };
        if (!autoPrimary) {
            Toast.warn("背景已更换，但自动取色失败，已保留原主题色");
        }

        try {
            Theme.setTheme("custom", {
                colors: themeColors,
                background: {
                    url: bgUrl,
                },
            });
        } catch (e) {
            devLog("warn", "🎨[自定义主题] 主题设置失败", e);
            Toast.warn(`导入背景图失败：${(e as Error)?.message ?? e}`);
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
