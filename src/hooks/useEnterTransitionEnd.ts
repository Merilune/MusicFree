import { useEffect, useRef, useState } from "react";
import { InteractionManager } from "react-native";
import { useNavigation } from "@react-navigation/native";

/**
 * 等当前屏的进入转场真正结束再渲染重内容。
 *
 * transitionEnd 是正常就绪信号；收到它之后再等 JS interactions 清空，
 * 避免重内容和原生转场结束帧争用。定时器只在事件丢失时兜底，防止
 * 页面永久空白。
 */
export default function useEnterTransitionEnd(): boolean {
    const [ready, setReady] = useState(false);
    const doneRef = useRef(false);
    const navigation = useNavigation();

    useEffect(() => {
        let active = true;
        let task: ReturnType<typeof InteractionManager.runAfterInteractions> | null =
            null;

        const markReady = () => {
            if (active && !doneRef.current) {
                doneRef.current = true;
                setReady(true);
            }
        };

        const scheduleReady = () => {
            if (!doneRef.current && !task) {
                task = InteractionManager.runAfterInteractions(markReady);
            }
        };

        // native-stack 转场结束时触发；closing=true 是退出方的事件，忽略
        const unsubscribe = navigation.addListener(
            "transitionEnd",
            (e: any) => {
                if (!e?.data?.closing) {
                    scheduleReady();
                }
            },
        );

        // 兜底：事件没来（比如屏已在前台直接切）也最多空白 600ms
        const fallbackTimer = setTimeout(markReady, 600);

        return () => {
            active = false;
            unsubscribe();
            clearTimeout(fallbackTimer);
            task?.cancel();
        };
        // 转场只发生在挂载时，依赖留空
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return ready;
}
