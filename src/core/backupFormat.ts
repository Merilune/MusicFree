export const BACKUP_SCHEMA = "bakamusic.music-sheet-backup";
export const BACKUP_VERSION = 3;
export const MAX_BACKUP_BYTES = 128 * 1024 * 1024;
export const MAX_BACKUP_SHEETS = 2_000;
export const MAX_BACKUP_TRACKS = 200_000;
export const MAX_BACKUP_PLUGINS = 1_000;

const STRINGIFIED_TRACK_ID_BACKUP_VERSION = 2;
const MUSICFREE_V1_LOCAL_SHEET_PLATFORM = "本地";

export interface IBackupPlugin {
    srcUrl: string;
    version: string;
}

export interface IParsedBackupPayload {
    musicSheets: IMusic.IMusicSheetItem[];
    plugins: IBackupPlugin[];
}

interface IBackupEnvelope {
    schema: typeof BACKUP_SCHEMA;
    version: typeof BACKUP_VERSION;
    createdAt: number;
    data: IParsedBackupPayload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getUtf8Size(value: string) {
    let bytes = 0;
    for (const character of value) {
        const codePoint = character.codePointAt(0) ?? 0;
        bytes +=
            codePoint <= 0x7f
                ? 1
                : codePoint <= 0x7ff
                    ? 2
                    : codePoint <= 0xffff
                        ? 3
                        : 4;
    }
    return bytes;
}

function assertBoundedString(
    value: unknown,
    name: string,
    maxLength = 8_192,
    allowEmpty = false,
) {
    if (
        typeof value !== "string" ||
        (!allowEmpty && !value.length) ||
        value.length > maxLength
    ) {
        throw new Error(`Invalid ${name}`);
    }
}

function normalizeOptionalTitle(value: unknown, name: string) {
    if (value == null) {
        return "";
    }
    assertBoundedString(value, name, 8_192, true);
    return value as string;
}

function coerceIdentityString(value: unknown, maxLength = 512): string | null {
    let text: string | null = null;
    if (typeof value === "string") {
        text = value;
    } else if (typeof value === "number" && Number.isFinite(value)) {
        text = String(value);
    } else if (typeof value === "bigint") {
        text = String(value);
    }
    if (!text?.length || text.length > maxLength) {
        return null;
    }
    return text;
}

function requireIdentityString(value: unknown, name: string, maxLength = 512) {
    const text = coerceIdentityString(value, maxLength);
    if (text === null) {
        throw new Error(`Invalid ${name}`);
    }
    return text;
}

/** Preserve the JSON scalar type supplied by the plugin for future backups. */
function normalizeMusicItemId(
    value: unknown,
    restoreStringifiedNumber: boolean,
): string | number | null {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "bigint") {
        return coerceIdentityString(value);
    }
    const text = coerceIdentityString(value);
    if (text === null || !restoreStringifiedNumber) {
        return text;
    }

    const numericId = Number(text);
    return Number.isSafeInteger(numericId) && String(numericId) === text
        ? numericId
        : text;
}

function normalizeMusicItem(
    musicItem: unknown,
    restoreStringifiedNumber: boolean,
): IMusic.IMusicItem | null {
    if (!isRecord(musicItem)) {
        return null;
    }
    const id = normalizeMusicItemId(musicItem.id, restoreStringifiedNumber);
    const platform = coerceIdentityString(musicItem.platform);
    if (id === null || platform === null) {
        return null;
    }
    if (id === musicItem.id && platform === musicItem.platform) {
        return musicItem as unknown as IMusic.IMusicItem;
    }
    return {
        ...musicItem,
        id,
        platform,
    } as unknown as IMusic.IMusicItem;
}

function validateMusicSheetList(
    value: unknown,
    restoreStringifiedTrackIds = false,
    missingSheetPlatform?: string,
) {
    if (!Array.isArray(value) || value.length > MAX_BACKUP_SHEETS) {
        throw new Error("Invalid backup music sheet list");
    }

    let totalTracks = 0;
    return value.map((sheet, sheetIndex) => {
        if (!isRecord(sheet)) {
            throw new Error(`Invalid music sheet at index ${sheetIndex}`);
        }
        const id = requireIdentityString(
            sheet.id,
            `musicSheets[${sheetIndex}].id`,
        );
        const platform = requireIdentityString(
            sheet.platform ?? missingSheetPlatform,
            `musicSheets[${sheetIndex}].platform`,
        );
        const title = normalizeOptionalTitle(
            sheet.title,
            `musicSheets[${sheetIndex}].title`,
        );
        const rawMusicList = sheet.musicList ?? [];
        if (!Array.isArray(rawMusicList)) {
            throw new Error(`Invalid music list at sheet ${sheetIndex}`);
        }
        const musicList = rawMusicList
            .map(musicItem =>
                normalizeMusicItem(musicItem, restoreStringifiedTrackIds),
            )
            .filter((musicItem): musicItem is IMusic.IMusicItem =>
                Boolean(musicItem),
            );
        totalTracks += musicList.length;
        if (totalTracks > MAX_BACKUP_TRACKS) {
            throw new Error("Backup contains too many tracks");
        }

        const unchanged =
            id === sheet.id &&
            platform === sheet.platform &&
            title === sheet.title &&
            musicList.length === rawMusicList.length &&
            musicList.every((item, index) => item === rawMusicList[index]);
        if (unchanged) {
            return sheet as unknown as IMusic.IMusicSheetItem;
        }
        return {
            ...sheet,
            id,
            platform,
            title,
            musicList,
        } as unknown as IMusic.IMusicSheetItem;
    });
}

function validatePluginList(value: unknown): IBackupPlugin[] {
    if (value == null) {
        return [];
    }
    if (!Array.isArray(value) || value.length > MAX_BACKUP_PLUGINS) {
        throw new Error("Invalid backup plugin list");
    }

    return value.flatMap(plugin => {
        if (!isRecord(plugin)) {
            return [];
        }
        const srcUrl = coerceIdentityString(plugin.srcUrl, 8_192);
        if (srcUrl === null) {
            return [];
        }
        try {
            const parsedUrl = new URL(srcUrl);
            if (
                parsedUrl.protocol !== "https:" &&
                parsedUrl.protocol !== "http:"
            ) {
                return [];
            }
        } catch {
            return [];
        }
        const version =
            plugin.version == null
                ? "0.0.0"
                : coerceIdentityString(plugin.version, 128);
        if (version === null) {
            return [];
        }
        return [{ srcUrl, version }];
    });
}

export function createBackupFileName(createdAt = Date.now()) {
    const timestamp = new Date(createdAt)
        .toISOString()
        .replace(/\.\d{3}Z$/, "Z")
        .replace(/:/g, "-");
    return `MusicFreeBackup-${timestamp}.json`;
}

export function createBackupPayload(
    musicSheets: IMusic.IMusicSheetItem[],
    plugins: IBackupPlugin[] = [],
    createdAt = Date.now(),
) {
    const envelope: IBackupEnvelope = {
        schema: BACKUP_SCHEMA,
        version: BACKUP_VERSION,
        createdAt,
        data: {
            musicSheets: validateMusicSheetList(musicSheets),
            plugins: validatePluginList(plugins),
        },
    };
    const serialized = JSON.stringify(envelope);
    if (getUtf8Size(serialized) > MAX_BACKUP_BYTES) {
        throw new Error("Backup exceeds the size limit");
    }
    return serialized;
}

export function parseBackupPayload(
    data: string | Record<string, unknown>,
): IParsedBackupPayload {
    const serialized = typeof data === "string" ? data : JSON.stringify(data);
    if (getUtf8Size(serialized) > MAX_BACKUP_BYTES) {
        throw new Error("Backup exceeds the size limit");
    }

    const parsed: unknown = typeof data === "string" ? JSON.parse(data) : data;
    if (!isRecord(parsed)) {
        throw new Error("Invalid backup payload");
    }

    // MusicFree v1 used root-level fields and omitted the platform of local
    // sheets. Restore that app-owned field without changing any track data.
    // BakaMusic v1 used the same root-level container.
    if (Array.isArray(parsed.musicSheets) && parsed.schema === undefined) {
        return {
            musicSheets: validateMusicSheetList(
                parsed.musicSheets,
                false,
                MUSICFREE_V1_LOCAL_SHEET_PLATFORM,
            ),
            plugins: validatePluginList(parsed.plugins),
        };
    }

    if (parsed.schema !== BACKUP_SCHEMA || !isRecord(parsed.data)) {
        throw new Error("Unsupported backup schema or version");
    }
    if (parsed.version === BACKUP_VERSION) {
        return {
            musicSheets: validateMusicSheetList(parsed.data.musicSheets),
            plugins: validatePluginList(parsed.data.plugins ?? parsed.plugins),
        };
    }
    if (parsed.version === STRINGIFIED_TRACK_ID_BACKUP_VERSION) {
        return {
            musicSheets: validateMusicSheetList(parsed.data.musicSheets, true),
            plugins: validatePluginList(parsed.data.plugins ?? parsed.plugins),
        };
    }
    throw new Error("Unsupported backup schema or version");
}
