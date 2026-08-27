import PluginManager from "@/core/pluginManager";
import { InteractionManager } from "react-native";
import { useCallback, useEffect, useState } from "react";

export default function (hash: string) {
    const [tags, setTags] =
        useState<IPlugin.IGetRecommendSheetTagsResult | null>(null);

    const query = useCallback(async () => {
        const plugin = PluginManager.getByHash(hash);
        if (plugin) {
            try {
                const result = await plugin.methods?.getRecommendSheetTags?.();
                if (!result) {
                    throw new Error();
                }
                setTags(result);
            } catch {
                setTags(null);
            }
        }
    }, [hash]);

    useEffect(() => {
        // 转场动画期间跑插件 JS 会卡掉新页首帧，进入动画会丢
        const task = InteractionManager.runAfterInteractions(() => {
            query();
        });
        return () => task.cancel();
    }, [query]);

    return tags;
}
