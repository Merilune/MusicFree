import React from "react";
import { View } from "react-native";
import TopListBody from "./components/topListBody";
import MusicBar from "@/components/musicBar";
import VerticalSafeAreaView from "@/components/base/verticalSafeAreaView";
import globalStyle from "@/constants/globalStyle";
import HorizontalSafeAreaView from "@/components/base/horizontalSafeAreaView.tsx";
import AppBar from "@/components/base/appBar";
import { useI18N } from "@/core/i18n";
import useEnterTransitionEnd from "@/hooks/useEnterTransitionEnd";

export default function TopList() {
    const { t } = useI18N();
    const bodyReady = useEnterTransitionEnd();

    return (
        <VerticalSafeAreaView style={globalStyle.fwflex1}>
            <AppBar withStatusBar>{t("topList.title")}</AppBar>
            <HorizontalSafeAreaView style={globalStyle.flex1}>
                {bodyReady ? <TopListBody /> : <View style={globalStyle.flex1} />}
            </HorizontalSafeAreaView>
            <MusicBar />
        </VerticalSafeAreaView>
    );
}
