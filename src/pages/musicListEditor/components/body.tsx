import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import rpx from "@/utils/rpx";
import Button from "@/components/base/textButton.tsx";
import { useAtom } from "jotai";
import { editingMusicListAtom, musicListChangedAtom } from "../store/atom";
import Toast from "@/utils/toast";
import MusicList from "./musicList";
import { useParams } from "@/core/router";
import { localMusicSheetId, musicHistorySheetId } from "@/constants/commonConst";
import LocalMusicSheet from "@/core/localMusicSheet";
import HorizontalSafeAreaView from "@/components/base/horizontalSafeAreaView.tsx";
import globalStyle from "@/constants/globalStyle";
import musicHistory from "@/core/musicHistory";
import MusicSheet from "@/core/musicSheet";
import { useI18N } from "@/core/i18n";
import { showPanel } from "@/components/panels/usePanel";

function getSourceKey(musicItem: IMusic.IMusicItem) {
    return String(musicItem.platform ?? "").trim();
}

export default function Body() {
    const { musicSheet } = useParams<"music-list-editor">();

    const { t } = useI18N();
    const [editingMusicList, setEditingMusicList] =
        useAtom(editingMusicListAtom);
    const [musicListChanged, setMusicListChanged] =
        useAtom(musicListChangedAtom);
    const selectedItems = useMemo(
        () => editingMusicList.filter(_ => _.checked),
        [editingMusicList],
    );
    const sourceCounts = useMemo(() => {
        const counts = new Map<string, number>();
        editingMusicList.forEach(({ musicItem }) => {
            const source = getSourceKey(musicItem);
            counts.set(source, (counts.get(source) ?? 0) + 1);
        });
        return [...counts.entries()];
    }, [editingMusicList]);

    const selectSource = (source: string) => {
        setEditingMusicList(current =>
            current.map(item =>
                getSourceKey(item.musicItem) === source
                    ? { ...item, checked: true }
                    : item,
            ),
        );
    };

    return (
        <HorizontalSafeAreaView style={globalStyle.flex1}>
            <View style={style.header}>
                <Button
                    onPress={() => {
                        if (
                            selectedItems.length !== editingMusicList.length &&
                            editingMusicList.length
                        ) {
                            setEditingMusicList(
                                editingMusicList.map(_ => ({
                                    musicItem: _.musicItem,
                                    checked: true,
                                })),
                            );
                        } else {
                            setEditingMusicList(
                                editingMusicList.map(_ => ({
                                    musicItem: _.musicItem,
                                    checked: false,
                                })),
                            );
                        }
                    }}>
                    {`${selectedItems.length !== editingMusicList.length &&
                        editingMusicList.length
                        ? t("common.selectAll")
                        : t("common.unselectAll")
                    } (${t("musicListEditor.selectMusicCount", { count: selectedItems.length })})`}
                </Button>
                <Button
                    onPress={() => {
                        showPanel("SimpleSelect", {
                            header: t("musicListEditor.selectBySource"),
                            candidates: sourceCounts.map(([source, count]) => ({
                                value: source,
                                title: t("musicListEditor.sourceCount", {
                                    source:
                                        source ||
                                        t("musicListEditor.unknownSource"),
                                    count,
                                }),
                            })),
                            onPress(item) {
                                selectSource(String(item.value));
                            },
                        });
                    }}>
                    {t("musicListEditor.selectBySource")}
                </Button>
                <Button
                    fontColor={
                        musicListChanged && musicSheet?.id
                            ? "primary"
                            : "textSecondary"
                    }
                    onPress={async () => {
                        if (musicListChanged && musicSheet?.id) {
                            if (musicSheet.id === localMusicSheetId) {
                                await LocalMusicSheet.updateMusicList(
                                    editingMusicList.map(_ => _.musicItem),
                                );
                            } else if (musicSheet.id === musicHistorySheetId) {
                                await musicHistory.setHistory(
                                    editingMusicList.map(_ => _.musicItem),
                                );
                            } else {
                                await MusicSheet.manualSort(
                                    musicSheet.id,
                                    editingMusicList.map(_ => _.musicItem),
                                );
                            }

                            Toast.success(t("toast.saveSuccess"));
                            setMusicListChanged(false);
                        }
                    }}>
                    {t("common.save")}
                </Button>
            </View>
            <MusicList />
        </HorizontalSafeAreaView>
    );
}

const style = StyleSheet.create({
    header: {
        flexDirection: "row",
        height: rpx(88),
        paddingHorizontal: rpx(24),
        alignItems: "center",
        justifyContent: "space-between",
    },
});
