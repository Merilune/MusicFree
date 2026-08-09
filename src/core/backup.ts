/** 备份与恢复 */
/** 歌单、插件 */
import { compare } from "compare-versions";
import PluginManager from "./pluginManager";
import MusicSheet from "@/core/musicSheet";
import { ResumeMode } from "@/constants/commonConst.ts";
import {
    createBackupFileName,
    createBackupPayload,
    parseBackupPayload,
    type IBackupPlugin,
} from "./backupFormat.ts";

/** Build the shared BakaMusic/MusicFree v3 backup envelope. */

function backup() {
    const musicSheets = MusicSheet.backupSheets();
    const plugins = PluginManager.getEnabledPlugins();
    const normalizedPlugins = plugins.flatMap(plugin => {
        const { srcUrl } = plugin.instance;
        if (typeof srcUrl !== "string" || !srcUrl.length) {
            return [];
        }
        return [
            {
                srcUrl,
                version: plugin.instance.version ?? "0.0.0",
            } satisfies IBackupPlugin,
        ];
    });

    return createBackupPayload(musicSheets, normalizedPlugins);
}

async function resume(
    raw: string | Record<string, unknown>,
    resumeMode: ResumeMode = ResumeMode.Append,
) {
    const { plugins, musicSheets } = parseBackupPayload(raw);
    /** 恢复插件 */
    const validPlugins = PluginManager.getEnabledPlugins();
    const resumePlugins = plugins?.map(_ => {
        // 校验是否安装过: 同源且本地版本更高就忽略掉
        if (
            validPlugins.find(
                plugin =>
                    plugin.instance.srcUrl === _.srcUrl &&
                    compare(
                        plugin.instance.version ?? "0.0.0",
                        _.version ?? "0.0.1",
                        ">=",
                    ),
            )
        ) {
            return;
        }
        return PluginManager.installPluginFromUrl(_.srcUrl);
    });

    /** 恢复歌单 */
    const resumeMusicSheets = MusicSheet.resumeSheets(musicSheets, resumeMode);

    return Promise.all([...(resumePlugins ?? []), resumeMusicSheets]);
}

const Backup = {
    backup,
    resume,
    createBackupFileName,
};
export default Backup;
