import React from "react";
import { StyleSheet, View } from "react-native";
import ThemeText from "@/components/base/themeText";
import ListItem from "@/components/base/listItem";
import Config, { useAppConfig } from "@/core/appConfig";
import { showDialog } from "@/components/dialogs/useDialog";
import { useI18N } from "@/core/i18n";
import rpx from "@/utils/rpx";

/** 字体选项：default = 系统默认，NotoSerifSC = 内置思源宋体 */
export default function FontSetting() {
    const { t } = useI18N();
    const appFont = useAppConfig("font.appFontFamily") ?? "default";
    const lyricFont = useAppConfig("font.lyricFontFamily") ?? "follow";

    const labelMap: Record<string, string> = {
        default: t("fontSetting.default"),
        NotoSerifSC: t("fontSetting.notoSerifSC"),
        HanYiXiZhongYuanJ: t("fontSetting.hanYiXiZhongYuanJ"),
        LXGWNeoZhiSong: t("fontSetting.lxgwNeoZhiSong"),
        ZhiMangXing: t("fontSetting.zhiMangXing"),
        follow: t("fontSetting.followApp"),
    };

    const showPicker = (
        title: string,
        changeKey: "font.appFontFamily" | "font.lyricFontFamily",
        candidates: string[],
        value: string,
    ) => {
        showDialog("RadioDialog", {
            title,
            content: candidates.map(_ => ({
                label: labelMap[_],
                value: _,
            })),
            onOk(val) {
                Config.setConfig(changeKey, val);
            },
        });
    };

    return (
        <View>
            <ThemeText
                fontSize="subTitle"
                fontWeight="bold"
                style={styles.header}>
                {t("fontSetting.title")}
            </ThemeText>
            <View style={styles.sectionWrapper}>
                <ListItem
                    withHorizontalPadding
                    onPress={() =>
                        showPicker(
                            t("fontSetting.appFont"),
                            "font.appFontFamily",
                            [
                                "default",
                                "NotoSerifSC",
                                "HanYiXiZhongYuanJ",
                                "LXGWNeoZhiSong",
                                "ZhiMangXing",
                            ],
                            appFont,
                        )
                    }>
                    <ListItem.Content title={t("fontSetting.appFont")} />
                    <ThemeText
                        fontSize="subTitle"
                        style={[
                            styles.valueText,
                            appFont !== "default" && styles.activeValue,
                        ]}>
                        {labelMap[appFont]}
                    </ThemeText>
                </ListItem>
                <ListItem
                    withHorizontalPadding
                    onPress={() =>
                        showPicker(
                            t("fontSetting.lyricFont"),
                            "font.lyricFontFamily",
                            [
                                "follow",
                                "default",
                                "NotoSerifSC",
                                "HanYiXiZhongYuanJ",
                                "LXGWNeoZhiSong",
                                "ZhiMangXing",
                            ],
                            lyricFont,
                        )
                    }>
                    <ListItem.Content title={t("fontSetting.lyricFont")} />
                    <ThemeText
                        fontSize="subTitle"
                        style={[
                            styles.valueText,
                            lyricFont !== "follow" &&
                                lyricFont !== "default" &&
                                styles.activeValue,
                        ]}>
                        {labelMap[lyricFont]}
                    </ThemeText>
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
    valueText: {
        paddingVertical: rpx(24),
    },
    activeValue: {
        fontWeight: "600",
    },
});
