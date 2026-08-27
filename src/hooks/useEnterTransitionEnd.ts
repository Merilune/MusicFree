import { useEffect, useRef, useState } from "react";
import { InteractionManager } from "react-native";
import { useNavigation } from "@react-navigation/native";

/**
 * 等当前屏的进入转场真正结束再渲染重内容。
 *
 * InteractionManager.runAfterInteractions 只等 JS 空闲，不等原生转场，
 * JS 忙时回调被压后会导致进入动画丢失；这里监听 native-stack 的
 * transitionEnd 事件，语义才是"转场已结束"。
 *
 * 三重保障：
 * 1. transitionEnd 事件（正常路径）
 * 2. 600ms 兜底定时器（事件丢失/首帧即已结束时防空白卡死）
 * 3. InteractionManager（避免与转场期间的 JS 活动抢帧）
 */
export default function useEnterTransitionEnd(): boolean {
    const [ready, setReady] = useState(false);
    const doneRef = useRef(false);
    const navigation = useNavigation();

    useEffect(() => {
        const markReady = () => {
            if (!doneRef.current) {
                doneRef.current = true;
                setReady(true);
            }
        };

        // native-stack 转场结束时触发；closing=true 是退出方的事件，忽略
        const unsubscribe = navigation.addListener(
            "transitionEnd",
            (e: any) => {
                if (!e?.data?.closing) {
                    markReady();
                }
            },
        );

        // 兜底：事件没来（比如屏已在前台直接切）也最多空白 600ms
        const fallbackTimer = setTimeout(markReady, 600);

        // 尽量避开转场期间的 JS 活动
        const task = InteractionManager.runAfterInteractions(markReady);

        return () => {
            unsubscribe();
            clearTimeout(fallbackTimer);
            task.cancel();
        };
        // 转场只发生在挂载时，依赖留空
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return ready;
}
