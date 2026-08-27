import React, { useEffect, useState } from "react";
import VerticalSafeAreaView from "@/components/base/verticalSafeAreaView";
import globalStyle from "@/constants/globalStyle";
import StatusBar from "@/components/base/statusBar";
import musicHistory, { useMusicHistory } from "@/core/musicHistory";
import MusicList from "@/components/musicList";
import { musicHistorySheetId, RequestStateCode } from "@/constants/commonConst";
import MusicBar from "@/components/musicBar";
import AppBar from "@/components/base/appBar";
import { ROUTE_PATH, useNavigate } from "@/core/router";
import { useI18N } from "@/core/i18n";
import { InteractionManager, View } from "react-native";

export default function History() {
    const musicHistoryList = useMusicHistory();

    const navigate = useNavigate();
    const { t } = useI18N();

    // 历史列表可能很长，首帧全量渲染会卡掉进入动画，推迟到转场结束再挂
    const [listReady, setListReady] = useState(false);
    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            setListReady(true);
        });
        return () => task.cancel();
    }, []);

    return (
        <VerticalSafeAreaView style={globalStyle.fwflex1}>
            <StatusBar />
            <AppBar
                menu={[
                    {
                        icon: "trash-outline",
                        title: t("history.clearHistory"),
                        onPress() {
                            if (musicHistoryList.length) {
                                musicHistory.clearMusic();
                            }
                        },
                    },
                    {
                        icon: "pencil-square",
                        title: t("common.edit"),
                        onPress() {
                            navigate(ROUTE_PATH.MUSIC_LIST_EDITOR, {
                                musicList: musicHistoryList,
                                musicSheet: {
                                    id: musicHistorySheetId,
                                    title: t("history.title"),
                                },
                            });
                        },
                    },
                ]}>
                {t("history.title")}
            </AppBar>
            {listReady ? (
                <MusicList
                    musicList={musicHistoryList}
                    showIndex
                    state={RequestStateCode.IDLE}
                    variant="card"
                    itemSpacing={12}
                    musicSheet={{
                        id: musicHistorySheetId,
                        title: t("history.title"),
                        musicList: musicHistoryList,
                    } as IMusic.IMusicSheetItem}
                />
            ) : (
                <View style={globalStyle.flex1} />
            )}
            <MusicBar />
        </VerticalSafeAreaView>
    );
}
