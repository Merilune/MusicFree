import {
    BACKUP_SCHEMA,
    BACKUP_VERSION,
    createBackupFileName,
    createBackupPayload,
    parseBackupPayload,
} from "./backupFormat.ts";

function fixtureMusic(id: string | number) {
    return {
        id,
        platform: "fixture",
        title: `Track ${id}`,
        artist: "Fixture artist",
        duration: 180,
        album: "Fixture album",
        artwork: "",
    } as unknown as IMusic.IMusicItem;
}

function fixtureSheet(musicList = [fixtureMusic("one")]) {
    return {
        id: "sheet-fixture",
        platform: "本地",
        title: "Fixture sheet",
        musicList,
    } as IMusic.IMusicSheetItem;
}

describe("backup format", () => {
    it("writes the shared v3 envelope and preserves plugin ID scalar types", () => {
        const sheet = fixtureSheet([
            fixtureMusic(108175950),
            fixtureMusic("00108175950"),
        ]);
        const serialized = createBackupPayload(
            [sheet],
            [
                {
                    srcUrl: "https://example.com/plugin.js",
                    version: "1.2.3",
                },
            ],
            1234,
        );
        const envelope = JSON.parse(serialized);

        expect(envelope.schema).toBe(BACKUP_SCHEMA);
        expect(envelope.version).toBe(BACKUP_VERSION);
        expect(envelope.createdAt).toBe(1234);
        expect(
            envelope.data.musicSheets[0].musicList.map(item => item.id),
        ).toEqual([108175950, "00108175950"]);
        expect(parseBackupPayload(serialized)).toEqual({
            musicSheets: [sheet],
            plugins: [
                {
                    srcUrl: "https://example.com/plugin.js",
                    version: "1.2.3",
                },
            ],
        });
    });

    it("repairs canonical numeric IDs from BakaMusic v2 backups", () => {
        const serialized = JSON.stringify({
            schema: BACKUP_SCHEMA,
            version: 2,
            createdAt: 1234,
            data: {
                musicSheets: [
                    fixtureSheet([
                        fixtureMusic("108175950"),
                        fixtureMusic("00108175950"),
                        fixtureMusic("track-id"),
                    ]),
                ],
            },
        });

        expect(
            parseBackupPayload(serialized).musicSheets[0].musicList.map(
                item => item.id,
            ),
        ).toEqual([108175950, "00108175950", "track-id"]);
    });

    it("migrates original MusicFree v1 backups with local sheets", () => {
        const musicList = [fixtureMusic(123456)];
        const musicFreeV1Sheet = {
            id: "favorite",
            title: "我喜欢",
            coverImg: null,
            musicList,
        };
        expect(
            parseBackupPayload(
                JSON.stringify({
                    musicSheets: [musicFreeV1Sheet],
                    plugins: [
                        {
                            srcUrl: "https://example.com/legacy.js",
                            version: "1.0.0",
                        },
                    ],
                }),
            ),
        ).toEqual({
            musicSheets: [
                {
                    ...musicFreeV1Sheet,
                    platform: "本地",
                },
            ],
            plugins: [
                {
                    srcUrl: "https://example.com/legacy.js",
                    version: "1.0.0",
                },
            ],
        });
        expect(
            parseBackupPayload(
                JSON.stringify({
                    version: 1,
                    musicSheets: [musicFreeV1Sheet],
                    plugins: [],
                }),
            ).musicSheets[0].musicList[0].id,
        ).toBe(123456);
    });

    it("accepts BakaMusic v3 backups without plugin metadata", () => {
        const legacySheet = fixtureSheet([fixtureMusic(123456)]);
        const bakaPayload = JSON.stringify({
            schema: BACKUP_SCHEMA,
            version: BACKUP_VERSION,
            createdAt: 1234,
            data: { musicSheets: [legacySheet] },
        });
        expect(parseBackupPayload(bakaPayload)).toEqual({
            musicSheets: [legacySheet],
            plugins: [],
        });
    });

    it("drops unusable tracks and plugin entries without blocking playlists", () => {
        const serialized = createBackupPayload(
            [
                fixtureSheet([
                    fixtureMusic("valid"),
                    { id: "missing-platform" } as IMusic.IMusicItem,
                ]),
            ],
            [
                {
                    srcUrl: "file:///invalid/plugin.js",
                    version: "1.0.0",
                },
            ],
            1234,
        );
        const parsed = parseBackupPayload(serialized);

        expect(parsed.musicSheets[0].musicList.map(item => item.id)).toEqual([
            "valid",
        ]);
        expect(parsed.plugins).toEqual([]);
    });

    it("uses timestamped MusicFree filenames and rejects unsupported versions", () => {
        expect(createBackupFileName(Date.UTC(2026, 7, 9, 14, 21, 6))).toBe(
            "MusicFreeBackup-2026-08-09T14-21-06Z.json",
        );
        expect(() =>
            parseBackupPayload(
                JSON.stringify({
                    schema: BACKUP_SCHEMA,
                    version: BACKUP_VERSION + 1,
                    data: { musicSheets: [] },
                }),
            ),
        ).toThrow("Unsupported backup schema or version");
    });
});
