import React from "react";
import { StyleSheet, View } from "react-native";
import rpx from "@/utils/rpx";
import ThemeText from "@/components/base/themeText";
import ListItem from "@/components/base/listItem";
import SliderRow from "@/components/base/sliderRow";
import Config, { useAppConfig } from "@/core/appConfig";
import Theme, {
    DEFAULT_BACKGROUND_BLUR,
    DEFAULT_BACKGROUND_OPACITY,
} from "@/core/theme";
import { useI18N } from "@/core/i18n";
import {
    pickBackgroundImage,
    removeBackgroundImage,
    saveBackgroundImage,
} from "@/utils/backgroundImage";
import { devLog } from "@/utils/log";
import Toast from "@/utils/toast";

export default function BackgroundTuning() {
    const { t } = useI18N();
    const backgroundInfo = Theme.useBackground();
    const backgroundMask = useAppConfig("theme.backgroundMask") ?? 0;
    const hasBackground = !!backgroundInfo?.url;

    async function onPickPress() {
        try {
            const uri = await pickBackgroundImage();
            if (!uri) {
                return;
            }

            const previousUrl = Theme.getBackground()?.url;
            const newUrl = await saveBackgroundImage(uri, "background");
            // 换了扩展名时旧文件不会被覆盖，得单独删
            if (previousUrl && previousUrl.split("#")[0] !== newUrl.split("#")[0]) {
                await removeBackgroundImage(previousUrl);
            }
            Theme.setBackground({ url: newUrl });
        } catch (e) {
            devLog("warn", "🎨[背景设置] 设置背景失败", e);
            Toast.warn(t("themeSettings.toast.backgroundFailed"));
        }
    }

    async function onClearPress() {
        const previousUrl = Theme.getBackground()?.url;
        Theme.setBackground({ url: null });
        await removeBackgroundImage(previousUrl);
    }

    function onResetPress() {
        Theme.setBackground({
            blur: DEFAULT_BACKGROUND_BLUR,
            opacity: DEFAULT_BACKGROUND_OPACITY,
        });
        Config.setConfig("theme.backgroundMask", 0);
    }

    return (
        <View>
            <ThemeText
                fontSize="subTitle"
                fontWeight="bold"
                style={styles.header}>
                {t("themeSettings.backgroundTuning")}
            </ThemeText>
            <View style={styles.sectionWrapper}>
                <ListItem withHorizontalPadding onPress={onPickPress}>
                    <ListItem.Content
                        title={
                            hasBackground
                                ? t("themeSettings.changeBackground")
                                : t("themeSettings.pickBackground")
                        }
                        description={t("themeSettings.backgroundDesc")}
                    />
                </ListItem>
                {hasBackground ? (
                    <ListItem withHorizontalPadding onPress={onClearPress}>
                        <ListItem.Content
                            title={t("themeSettings.clearBackground")}
                        />
                    </ListItem>
                ) : null}
                <SliderRow
                    title={t("setCustomTheme.blur")}
                    value={backgroundInfo?.blur ?? DEFAULT_BACKGROUND_BLUR}
                    minimumValue={0}
                    maximumValue={50}
                    step={1}
                    onChange={val => {
                        Theme.setBackground({ blur: val });
                    }}
                />
                <SliderRow
                    title={t("setCustomTheme.opacity")}
                    value={backgroundInfo?.opacity ?? DEFAULT_BACKGROUND_OPACITY}
                    minimumValue={0}
                    maximumValue={1}
                    step={0.01}
                    format={val => `${Math.round(val * 100)}%`}
                    onChange={val => {
                        Theme.setBackground({ opacity: val });
                    }}
                />
                <SliderRow
                    title={t("themeSettings.backgroundMask")}
                    value={backgroundMask}
                    minimumValue={0}
                    maximumValue={0.8}
                    step={0.01}
                    format={val => `${Math.round(val * 100)}%`}
                    onChange={val => {
                        Config.setConfig("theme.backgroundMask", val);
                    }}
                />
                <ListItem withHorizontalPadding onPress={onResetPress}>
                    <ListItem.Content
                        title={t("themeSettings.resetBackgroundTuning")}
                        description={t("themeSettings.resetBackgroundTuningDesc")}
                    />
                </ListItem>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingLeft: rpx(24),
        marginTop: rpx(36),
    },
    sectionWrapper: {
        marginTop: rpx(24),
    },
});
