import React from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import rpx, { fontRpx } from "@/utils/rpx";
import { ImgAsset } from "@/constants/assetsConst";
import ThemeText from "@/components/base/themeText";
import LinkText from "@/components/base/linkText";
import useOrientation from "@/hooks/useOrientation";
import Theme from "@/core/theme";
import DeviceInfo from "react-native-device-info";
import buildInfo from "@/constants/buildInfo";
import useHasCustomBackground from "@/hooks/useHasCustomBackground";
import { useI18N } from "@/core/i18n";

export default function AboutSetting() {
    const orientation = useOrientation();
    const { colors } = Theme.useTheme();
    const { t } = useI18N();
    const hasCustomBackground = useHasCustomBackground();
    const version = DeviceInfo.getVersion(); // 从 package.json 获取版本号
    const buildTime = buildInfo.buildTime; // 从构建信息文件获取构建时间
    const cardChrome = hasCustomBackground
        ? {
            elevation: 0,
            shadowColor: "transparent",
            shadowOpacity: 0,
            borderWidth: 0,
        }
        : null;

    return (
        <View
            style={[
                style.wrapper,
                orientation === "horizontal"
                    // eslint-disable-next-line react-native/no-inline-styles -- Dynamic orientation layout
                    ? {
                        flexDirection: "row",
                    }
                    : null,
            ]}>
            <View
                style={[
                    style.header,
                    orientation === "horizontal" ? style.horizontalSize : null,
                ]}>
                <Image
                    source={ImgAsset.author}
                    style={style.image}
                    resizeMode="contain"
                />
                <ThemeText fontSize="title" style={style.appTitle}>
                    Audiora
                </ThemeText>
                <ThemeText style={style.versionText}>
                    {t("about.version", { version })}
                </ThemeText>
                <ThemeText style={style.buildText}>
                    {t("about.buildTime", { buildTime })}
                </ThemeText>
            </View>
            <ScrollView
                contentContainerStyle={style.scrollViewContainer}
                style={style.scrollView}>

                <View
                    style={[
                        style.infoCard,
                        { backgroundColor: colors.card },
                        cardChrome,
                    ]}>
                    <ThemeText fontSize="subTitle" style={style.cardTitle}>
                        {t("about.positioningTitle")}
                    </ThemeText>
                    <ThemeText style={style.cardContent}>
                        {t("about.positioningContent")}
                    </ThemeText>
                </View>

                <View
                    style={[
                        style.infoCard,
                        { backgroundColor: colors.card },
                        cardChrome,
                    ]}>
                    <ThemeText fontSize="subTitle" style={style.cardTitle}>
                        {t("about.responsibilityTitle")}
                    </ThemeText>
                    <ThemeText style={style.cardContent}>
                        {t("about.responsibilityContent")}
                    </ThemeText>
                </View>

                <View
                    style={[
                        style.infoCard,
                        { backgroundColor: colors.card },
                        cardChrome,
                    ]}>
                    <ThemeText fontSize="subTitle" style={style.cardTitle}>
                        {t("about.originalAuthor")}
                    </ThemeText>
                    <ThemeText style={style.cardContent}>猫头猫</ThemeText>
                    <LinkText linkTo="https://github.com/maotoumao/MusicFree">
                        https://github.com/maotoumao/MusicFree
                    </LinkText>
                </View>

                <View
                    style={[
                        style.infoCard,
                        { backgroundColor: colors.card },
                        cardChrome,
                    ]}>
                    <ThemeText fontSize="subTitle" style={style.cardTitle}>
                        {t("about.upstreamAuthor")}
                    </ThemeText>
                    <ThemeText style={style.cardContent}>Toskysun</ThemeText>
                    <LinkText linkTo="https://github.com/Toskysun/MusicFree">
                        https://github.com/Toskysun/MusicFree
                    </LinkText>
                </View>

                <View
                    style={[
                        style.infoCard,
                        { backgroundColor: colors.card },
                        cardChrome,
                    ]}>
                    <ThemeText fontSize="subTitle" style={style.cardTitle}>
                        {t("about.directFoundation")}
                    </ThemeText>
                    <ThemeText style={style.cardContent}>Merilune</ThemeText>
                    <LinkText linkTo="https://github.com/Merilune/MusicFree">
                        https://github.com/Merilune/MusicFree
                    </LinkText>
                </View>
            </ScrollView>
        </View>
    );
}

const style = StyleSheet.create({
    wrapper: {
        width: "100%",
        flex: 1,
    },
    header: {
        width: rpx(750),
        height: rpx(400),
        justifyContent: "center",
        alignItems: "center",
        marginBottom: rpx(40),
    },
    horizontalSize: {
        width: rpx(600),
        height: "100%",
    },
    image: {
        width: rpx(150),
        height: rpx(150),
        borderRadius: rpx(28),
    },
    appTitle: {
        marginTop: rpx(24),
    },
    versionText: {
        marginTop: rpx(12),
        opacity: 0.8,
    },
    buildText: {
        marginTop: rpx(8),
        marginBottom: rpx(32),
        opacity: 0.6,
        fontSize: fontRpx(24),
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: rpx(24),
        paddingTop: rpx(12),
    },
    scrollViewContainer: {
        paddingBottom: rpx(96),
    },
    infoCard: {
        padding: rpx(24),
        borderRadius: rpx(16),
        marginBottom: rpx(16),
        // elevation/shadow applied only when NOT custom wallpaper (see cardChrome)
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    cardTitle: {
        marginBottom: rpx(12),
        opacity: 0.7,
    },
    cardContent: {
        fontSize: fontRpx(28),
    },
});
