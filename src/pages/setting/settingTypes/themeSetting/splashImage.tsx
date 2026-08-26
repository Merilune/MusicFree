import React from "react";
import { StyleSheet, View } from "react-native";
import rpx from "@/utils/rpx";
import ThemeText from "@/components/base/themeText";
import ListItem from "@/components/base/listItem";
import Config, { useAppConfig } from "@/core/appConfig";
import { useI18N } from "@/core/i18n";
import {
    pickBackgroundImage,
    removeBackgroundImage,
    saveBackgroundImage,
} from "@/utils/backgroundImage";
import { devLog } from "@/utils/log";
import Toast from "@/utils/toast";

export default function SplashImage() {
    const { t } = useI18N();
    const splashImage = useAppConfig("theme.splashImage");

    async function onPickPress() {
        try {
            const uri = await pickBackgroundImage();
            if (!uri) {
                return;
            }

            const previousUrl = Config.getConfig("theme.splashImage");
            const newUrl = await saveBackgroundImage(uri, "splash");
            // 换了扩展名时旧文件不会被覆盖，得单独删
            if (
                previousUrl &&
                previousUrl.split("#")[0] !== newUrl.split("#")[0]
            ) {
                await removeBackgroundImage(previousUrl);
            }
            Config.setConfig("theme.splashImage", newUrl);
        } catch (e) {
            devLog("warn", "🖼️[启动图] 设置启动图失败", e);
            Toast.warn(t("themeSettings.toast.backgroundFailed"));
        }
    }

    async function onClearPress() {
        const previousUrl = Config.getConfig("theme.splashImage");
        Config.setConfig("theme.splashImage", undefined);
        await removeBackgroundImage(previousUrl);
    }

    return (
        <View>
            <ThemeText
                fontSize="subTitle"
                fontWeight="bold"
                style={styles.header}>
                {t("themeSettings.splashImage")}
            </ThemeText>
            <View style={styles.sectionWrapper}>
                <ListItem withHorizontalPadding onPress={onPickPress}>
                    <ListItem.Content
                        title={
                            splashImage
                                ? t("themeSettings.changeSplashImage")
                                : t("themeSettings.pickSplashImage")
                        }
                        description={t("themeSettings.splashImageDesc")}
                    />
                </ListItem>
                {splashImage ? (
                    <ListItem withHorizontalPadding onPress={onClearPress}>
                        <ListItem.Content
                            title={t("themeSettings.clearSplashImage")}
                        />
                    </ListItem>
                ) : null}
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
