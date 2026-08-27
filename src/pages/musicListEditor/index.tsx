import AppBar from "@/components/base/appBar";
import StatusBar from "@/components/base/statusBar";
import VerticalSafeAreaView from "@/components/base/verticalSafeAreaView";
import globalStyle from "@/constants/globalStyle";
import i18n from "@/core/i18n";
import { useParams } from "@/core/router";
import { useSetAtom } from "jotai";
import React, { useEffect } from "react";
import { View } from "react-native";
import Body from "./components/body";
import Bottom from "./components/bottom";
import { editingMusicListAtom, musicListChangedAtom } from "./store/atom";
import useEnterTransitionEnd from "@/hooks/useEnterTransitionEnd";

export default function MusicListEditor() {
    const { musicSheet, musicList } = useParams<"music-list-editor">();

    const setEditingMusicList = useSetAtom(editingMusicListAtom);
    const setMusicListChanged = useSetAtom(musicListChangedAtom);

    // 整表 map 写 atom + 全量排序列表的首帧渲染都很重，
    // 等进入转场结束再挂内容，避免滑入动画被卡掉
    const contentReady = useEnterTransitionEnd();

    useEffect(() => {
        if (!contentReady) {
            return;
        }
        setEditingMusicList(
            (musicList ?? []).map(_ => ({ musicItem: _, checked: false })),
        );
        return () => {
            setEditingMusicList([]);
            setMusicListChanged(false);
        };
    }, [
        contentReady,
        musicList,
        setEditingMusicList,
        setMusicListChanged,
    ]);

    return (
        <VerticalSafeAreaView style={globalStyle.fwflex1}>
            <StatusBar />
            <AppBar>{musicSheet?.title ?? i18n.t("common.sheet")}</AppBar>
            {contentReady ? (
                <>
                    <Body />
                    <Bottom />
                </>
            ) : (
                <View style={globalStyle.flex1} />
            )}
        </VerticalSafeAreaView>
    );
}
