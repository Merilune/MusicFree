import React from "react";
import { View } from "react-native";
import NavBar from "./components/navBar";
import MusicBar from "@/components/musicBar";
import SheetMusicList from "./components/sheetMusicList";
import StatusBar from "@/components/base/statusBar";
import VerticalSafeAreaView from "@/components/base/verticalSafeAreaView";
import globalStyle from "@/constants/globalStyle";
import CustomBackground from "@/components/base/customBackground";
import { LocalBackgroundContext } from "@/hooks/useHasCustomBackground";
import useColors from "@/hooks/useColors";
import { useSheetItem } from "@/core/musicSheet";
import { useParams } from "@/core/router";

export default function SheetDetail() {
    const { id = "favorite" } = useParams<"local-sheet-detail">();
    const musicSheet = useSheetItem(id);
    const colors = useColors();
    const background = musicSheet?.background;

    // 背景层放在 SafeAreaView 外面：绝对定位是相对父节点的内边距框计算的，
    // 放在里面会盖不住状态栏那条安全区。
    return (
        <LocalBackgroundContext.Provider value={!!background}>
            <View style={globalStyle.fwflex1}>
                {background ? (
                    <CustomBackground
                        url={background}
                        blur={musicSheet?.backgroundBlur}
                        opacity={musicSheet?.backgroundOpacity}
                        backgroundColor={
                            colors?.pageBackground ?? colors.background
                        }
                    />
                ) : null}
                <VerticalSafeAreaView style={globalStyle.fwflex1}>
                    <StatusBar />
                    <NavBar />
                    <SheetMusicList />
                    <MusicBar />
                </VerticalSafeAreaView>
            </View>
        </LocalBackgroundContext.Provider>
    );
}
