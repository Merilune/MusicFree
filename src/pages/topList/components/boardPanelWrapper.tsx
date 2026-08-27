import React, { useEffect, useMemo } from "react";
import useGetTopList from "../hooks/useGetTopList";
import { InteractionManager } from "react-native";
import { useAtomValue } from "jotai";
import { pluginsTopListAtom } from "../store/atoms";
import BoardPanel from "./boardPanel";

interface IBoardPanelProps {
    hash: string;
}
export default function BoardPanelWrapper(props: IBoardPanelProps) {
    const { hash } = props ?? {};
    const topLists = useAtomValue(pluginsTopListAtom);
    const getTopList = useGetTopList();
    const topListData = useMemo(() => topLists[hash], [topLists, hash]);

    useEffect(() => {
        // 转场动画期间跑插件 JS 会卡掉新页首帧，进入动画会丢
        const task = InteractionManager.runAfterInteractions(() => {
            getTopList(hash);
        });
        return () => task.cancel();
    }, [getTopList, hash]);

    return <BoardPanel topListData={topListData} hash={hash} />;
}
