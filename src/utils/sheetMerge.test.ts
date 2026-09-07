import { describe, expect, it } from "@jest/globals";
import {
    isSameTrack,
    mergeMusicSheetsByPriority,
    normalizeTrackArtist,
    normalizeTrackTitle,
} from "./sheetMerge";

function item(
    id: string,
    platform: string,
    title: string,
    artist: string,
    duration: number | undefined,
): IMusic.IMusicItem {
    return {
        id,
        platform,
        title,
        artist,
        duration: duration ?? 0,
        album: "",
        artwork: "",
    } as IMusic.IMusicItem;
}

describe("normalizeTrackTitle", () => {
    it("normalizes width, case and whitespace", () => {
        expect(normalizeTrackTitle("  Hello   World ")).toBe("hello world");
        expect(normalizeTrackTitle("Ｌｏｖｅ　ｙｏｕ")).toBe("love you");
    });
});

describe("normalizeTrackArtist", () => {
    it("is order-insensitive across common separators", () => {
        expect(normalizeTrackArtist("周杰伦/费玉清")).toBe(
            normalizeTrackArtist("费玉清、周杰伦"),
        );
        expect(normalizeTrackArtist("A feat. B")).toBe(
            normalizeTrackArtist("B & A"),
        );
    });
});

describe("isSameTrack", () => {
    it("matches same title/artist within tolerance", () => {
        expect(
            isSameTrack(
                item("1", "QQ音乐插件", "晴天", "周杰伦", 269),
                item("2", "网易云插件", "晴天", "周杰伦", 270),
            ),
        ).toBe(true);
    });

    it("rejects when duration differs beyond tolerance", () => {
        expect(
            isSameTrack(
                item("1", "A", "晴天", "周杰伦", 269),
                item("2", "B", "晴天", "周杰伦", 275),
            ),
        ).toBe(false);
    });

    it("rejects different artists with same title", () => {
        expect(
            isSameTrack(
                item("1", "A", "晴天", "周杰伦", 269),
                item("2", "B", "晴天", "沈以诚", 269),
            ),
        ).toBe(false);
    });

    it("rejects live/studio versions with different titles", () => {
        expect(
            isSameTrack(
                item("1", "A", "晴天", "周杰伦", 269),
                item("2", "B", "晴天 (Live)", "周杰伦", 269),
            ),
        ).toBe(false);
    });

    it("does not merge when duration is missing", () => {
        expect(
            isSameTrack(
                item("1", "A", "晴天", "周杰伦", 0),
                item("2", "B", "晴天", "周杰伦", 0),
            ),
        ).toBe(false);
    });
});

describe("mergeMusicSheetsByPriority", () => {
    it("keeps higher priority source and supplements with the lower", () => {
        const qq = [
            item("1", "qq-plugin", "晴天", "周杰伦", 269),
            item("2", "qq-plugin", "七里香", "周杰伦", 296),
        ];
        const netease = [
            item("n1", "netease-plugin", "晴天", "周杰伦", 269),
            item("n2", "netease-plugin", "告白气球", "周杰伦", 215),
        ];
        const result = mergeMusicSheetsByPriority([
            { pluginHash: "h-qq", pluginName: "自定义QQ", musicList: qq },
            { pluginHash: "h-ne", pluginName: "网易云", musicList: netease },
        ]);

        expect(result.mergedList).toHaveLength(3);
        expect(result.mergedList.map(it => it.id)).toEqual(["1", "2", "n2"]);
        expect(result.stats[1].duplicates).toBe(1);
        expect(result.stats[1].kept).toBe(1);
    });

    it("respects priority across three sources", () => {
        const a = [item("a1", "A", "歌", "歌手", 200)];
        const b = [item("b1", "B", "歌", "歌手", 200)];
        const c = [item("c1", "C", "歌", "歌手", 200)];

        const result = mergeMusicSheetsByPriority([
            { pluginHash: "a", pluginName: "A", musicList: a },
            { pluginHash: "b", pluginName: "B", musicList: b },
            { pluginHash: "c", pluginName: "C", musicList: c },
        ]);

        expect(result.mergedList).toHaveLength(1);
        expect(result.mergedList[0].id).toBe("a1");
        expect(result.stats[2].duplicates).toBe(1);
    });

    it("flips kept source when priority order changes", () => {
        const a = [item("a1", "A", "歌", "歌手", 200)];
        const b = [item("b1", "B", "歌", "歌手", 200)];

        const result = mergeMusicSheetsByPriority([
            { pluginHash: "b", pluginName: "B", musicList: b },
            { pluginHash: "a", pluginName: "A", musicList: a },
        ]);

        expect(result.mergedList[0].id).toBe("b1");
    });

    it("dedupes within a single source by platform+id", () => {
        const list = [
            item("1", "A", "歌", "歌手", 200),
            item("1", "A", "歌", "歌手", 200),
            item("2", "A", "歌2", "歌手", 200),
        ];
        const result = mergeMusicSheetsByPriority([
            { pluginHash: "a", pluginName: "A", musicList: list },
        ]);
        expect(result.mergedList).toHaveLength(2);
        expect(result.stats[0].total).toBe(2);
    });

    it("keeps and counts uncertain items with missing duration", () => {
        const a = [item("a1", "A", "歌", "歌手", 0)];
        const b = [item("b1", "B", "歌", "歌手", 0)];
        const result = mergeMusicSheetsByPriority([
            { pluginHash: "a", pluginName: "A", musicList: a },
            { pluginHash: "b", pluginName: "B", musicList: b },
        ]);
        expect(result.mergedList).toHaveLength(2);
        expect(result.stats[1].uncertain).toBe(1);
    });
});
