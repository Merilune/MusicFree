import AppBar from "@/components/base/appBar";
import StatusBar from "@/components/base/statusBar";
import VerticalSafeAreaView from "@/components/base/verticalSafeAreaView";
import MusicBar from "@/components/musicBar";
import globalStyle from "@/constants/globalStyle";
import { useI18N } from "@/core/i18n";
import React, { useEffect, useState } from "react";
import { InteractionManager, View } from "react-native";
import Body from "./components/body";

/**
 * 进入动画丢了两次都是重首帧导致的，这次把整个 Body 推迟到
 * 转场结束后再挂载，首帧只有 AppBar + 空白，保证原生滑入动画流畅。
 */
export default function RecommendSheets() {
    const { t } = useI18N();
    const [bodyReady, setBodyReady] = useState(false);

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            setBodyReady(true);
        });
        return () => task.cancel();
    }, []);

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
