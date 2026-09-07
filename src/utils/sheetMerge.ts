import { isSameMediaItem } from "./mediaUtils";

/** 跨平台同曲判定的时长容差（毫秒） */
export const SAME_TRACK_DURATION_TOLERANCE_MS = 5000;

/** 每个音源的输入：按优先级从高到低排列 */
export interface IMergeSource {
    /** 插件稳定标识（仅用于统计展示与排序，不参与判重） */
    pluginHash: string;
    /** 插件显示名（用于统计展示） */
    pluginName: string;
    musicList: IMusic.IMusicItem[];
}

export interface IMergeSourceStat {
    pluginHash: string;
    pluginName: string;
    /** 去除自身重复后的原始数量 */
    total: number;
    /** 保留进最终结果的数量 */
    kept: number;
    /** 与更高优先级音源判定为同曲而跳过的数量 */
    duplicates: number;
    /** 因时长缺失等原因无法判定的数量（默认保留） */
    uncertain: number;
}

export interface IMergeMusicSheetsResult {
    /** 合并后的歌曲列表（保持输入优先级顺序） */
    mergedList: IMusic.IMusicItem[];
    /** 各音源统计，顺序与输入一致 */
    stats: IMergeSourceStat[];
}

/**
 * 规范化标题：
 * - 去除首尾空白，合并连续空白
 * - 全角字母/数字转半角，统一小写
 * - 保留 live、伴奏等版本词，避免不同版本被合并
 */
export function normalizeTrackTitle(title: string): string {
    return normalizeText(title);
}

/**
 * 规范化歌手：
 * - 按常见分隔符（/ 、 , 、 & feat. 等）拆分
 * - 每个名字规范化后排序重组，忽略歌手顺序差异
 */
export function normalizeTrackArtist(artist: string): string {
    const names = artist
        .split(/\s*(?:[/、,，;；&]|feat\.?|ft\.?)\s*/i)
        .map(normalizeText)
        .filter(Boolean)
        .sort();
    return names.join("|");
}

function normalizeText(text: string): string {
    return (text ?? "")
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, char =>
            String.fromCharCode(char.charCodeAt(0) - 0xfee0),
        )
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

/** 时长（秒）转毫秒；无效返回 null */
function durationMs(item: IMusic.IMusicItem): number | null {
    const duration = Number(item?.duration);
    if (!Number.isFinite(duration) || duration <= 0) {
        return null;
    }
    return duration * 1000;
}

/**
 * 跨平台判断两首歌是否为同一首：
 * 标题与歌手规范化后完全一致；双方时长有效时差值不超过容差。
 * 任一方时长缺失则视为"未确定"（不判定为相同）。
 */
export function isSameTrack(
    a: IMusic.IMusicItem,
    b: IMusic.IMusicItem,
): boolean {
    if (normalizeTrackTitle(a.title ?? "") !== normalizeTrackTitle(b.title ?? "")) {
        return false;
    }
    if (
        normalizeTrackArtist(a.artist ?? "") !==
        normalizeTrackArtist(b.artist ?? "")
    ) {
        return false;
    }
    const aMs = durationMs(a);
    const bMs = durationMs(b);
    if (aMs === null || bMs === null) {
        return false;
    }
    return Math.abs(aMs - bMs) <= SAME_TRACK_DURATION_TOLERANCE_MS;
}

/**
 * 按音源优先级合并多个歌单：
 * - 先去掉每个歌单内部 platform+id 相同的重复项（复用现有身份规则）
 * - 依次遍历（从最高优先级到最低）；与已保留歌曲判定为同曲的跳过，
 *   时长缺失等原因无法判定的也保留（uncertain）
 *
 * 不修改 isSameMediaItem / SortedMusicList 的现有语义。
 */
export function mergeMusicSheetsByPriority(
    sources: IMergeSource[],
): IMergeMusicSheetsResult {
    const mergedList: IMusic.IMusicItem[] = [];
    const stats: IMergeSourceStat[] = [];

    for (const source of sources) {
        const stat: IMergeSourceStat = {
            pluginHash: source.pluginHash,
            pluginName: source.pluginName,
            total: 0,
            kept: 0,
            duplicates: 0,
            uncertain: 0,
        };

        // 同一歌单内部先按现有 platform + id 去重，保持首次出现顺序
        const uniqueList: IMusic.IMusicItem[] = [];
        for (const item of source.musicList ?? []) {
            if (!uniqueList.some(it => isSameMediaItem(it, item))) {
                uniqueList.push(item);
            }
        }
        stat.total = uniqueList.length;

        for (const item of uniqueList) {
            const duplicate = mergedList.find(it => isSameTrack(it, item));
            if (duplicate) {
                stat.duplicates += 1;
                continue;
            }
            const aMs = durationMs(item);
            const uncertain =
                aMs === null ||
                mergedList.some(
                    it =>
                        normalizeTrackTitle(it.title ?? "") ===
                            normalizeTrackTitle(item.title ?? "") &&
                        normalizeTrackArtist(it.artist ?? "") ===
                            normalizeTrackArtist(item.artist ?? "") &&
                        durationMs(it) === null,
                );
            if (uncertain) {
                stat.uncertain += 1;
            }
            mergedList.push(item);
            stat.kept += 1;
        }

        stats.push(stat);
    }

    return { mergedList, stats };
}
