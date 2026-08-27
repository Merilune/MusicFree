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
                <ListItem withHorizontalPadding>
                    <ListItem.Content>
                        <ListItem.Title
                            onPress={() =>
                                showPicker(
                                    t("fontSetting.appFont"),
                                    "font.appFontFamily",
                                    ["default", "NotoSerifSC"],
                                    appFont,
                                )
                            }>
                            <ThemeText>{t("fontSetting.appFont")}</ThemeText>
                        </ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Actions>
                        <ThemeText
                            fontSize="subTitle"
                            style={[
                                styles.valueText,
                                appFont !== "default" && styles.activeValue,
                            ]}>
                            {labelMap[appFont]}
                        </ThemeText>
                    </ListItem.Actions>
                </ListItem>
                <ListItem withHorizontalPadding>
                    <ListItem.Content>
                        <ListItem.Title
                            onPress={() =>
                                showPicker(
                                    t("fontSetting.lyricFont"),
                                    "font.lyricFontFamily",
                                    ["follow", "default", "NotoSerifSC"],
                                    lyricFont,
                                )
                            }>
                            <ThemeText>{t("fontSetting.lyricFont")}</ThemeText>
                        </ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Actions>
                        <ThemeText
                            fontSize="subTitle"
                            style={[
                                styles.valueText,
                                lyricFont === "NotoSerifSC" && styles.activeValue,
                            ]}>
                            {labelMap[lyricFont]}
                        </ThemeText>
                    </ListItem.Actions>
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
