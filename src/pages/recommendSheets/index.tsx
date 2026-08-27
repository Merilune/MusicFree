import AppBar from "@/components/base/appBar";
import StatusBar from "@/components/base/statusBar";
import VerticalSafeAreaView from "@/components/base/verticalSafeAreaView";
import MusicBar from "@/components/musicBar";
import globalStyle from "@/constants/globalStyle";
import { useI18N } from "@/core/i18n";
import React from "react";
import { View } from "react-native";
import Body from "./components/body";
import useEnterTransitionEnd from "@/hooks/useEnterTransitionEnd";

/**
 * 首帧只渲染 AppBar 骨架，等进入转场真正结束（transitionEnd）再挂
 * TabView + 请求链，保证原生滑入动画不被首帧渲染卡掉。
 */
export default function RecommendSheets() {
    const { t } = useI18N();
    const bodyReady = useEnterTransitionEnd();

    return (
        <VerticalSafeAreaView style={globalStyle.fwflex1}>
            <StatusBar />
            <AppBar>{t("recommendSheet.title")}</AppBar>
            {bodyReady ? (
                <Body />
            ) : (
                <View style={globalStyle.flex1} />
            )}
            <MusicBar />
        </VerticalSafeAreaView>
    );
}
