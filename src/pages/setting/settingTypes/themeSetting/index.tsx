import React from "react";
import { StyleSheet } from "react-native";
import rpx from "@/utils/rpx";
import Mode from "./mode";
import Background from "./background";
import BackgroundTuning from "./backgroundTuning";
import SplashImage from "./splashImage";
import AppearanceTuning from "./appearanceTuning";
import CoverStyle from "./coverStyle";
import FontSetting from "./fontSetting";
import HomeDisplay from "./homeDisplay";
import { ScrollView } from "react-native-gesture-handler";

export default function ThemeSetting() {
    return (
        <ScrollView style={style.wrapper}>
            <Mode />
            <HomeDisplay />
            <CoverStyle />
            <FontSetting />
            <Background />
            <BackgroundTuning />
            <SplashImage />
            <AppearanceTuning />
        </ScrollView>
    );
}

const style = StyleSheet.create({
    wrapper: {
        width: "100%",
        marginVertical: rpx(24),
    },
});
