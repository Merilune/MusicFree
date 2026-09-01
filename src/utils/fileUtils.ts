import pathConst from "@/constants/pathConst";
import NativeUtils from "@/native/utils";
import { devLog } from "@/utils/log";
import FastImage from "react-native-fast-image";
import RNFS, {
    PicturesDirectoryPath,
    copyFile,
    downloadFile,
    exists,
    mkdir,
    readDir,
    unlink,
    writeFile,
} from "react-native-fs";
import { Platform } from "react-native";
import { errorLog } from "./log";
import path from "path-browserify";
import resolveAssetSource from "react-native/Libraries/Image/resolveAssetSource";

const galleryBasePath = `${PicturesDirectoryPath}/Audiora/`;

/**
 * 将图片保存到相册
 * @param src 图片地址
 * @returns 保存后的文件路径
 */
export async function saveToGallery(src: string) {
    const fileName = `${Date.now()}.png`;
    let sourcePath: string | null = null;
    let temporaryPath: string | null = null;

    if (Platform.OS === "android") {
        try {
            if (src.startsWith("http://") || src.startsWith("https://")) {
                temporaryPath = `${pathConst.cachePath}gallery_${fileName}`;
                const downloadResult = await downloadFile({
                    fromUrl: src,
                    toFile: temporaryPath,
                    background: false,
                }).promise;
                if (downloadResult.statusCode < 200 || downloadResult.statusCode >= 300) {
                    throw new Error(`下载图片失败: ${downloadResult.statusCode}`);
                }
                sourcePath = temporaryPath;
            } else if (src.startsWith("data:")) {
                temporaryPath = `${pathConst.cachePath}gallery_${fileName}`;
                const [, data = ""] = src.split(",", 2);
                await writeFile(temporaryPath, data, "base64");
                sourcePath = temporaryPath;
            } else {
                sourcePath = removeFileScheme(src);
            }

            if (!sourcePath || !(await exists(sourcePath))) {
                throw new Error("图片文件不存在");
            }
            return await NativeUtils.saveImageToGallery(sourcePath, fileName);
        } finally {
            if (temporaryPath) {
                await unlink(temporaryPath).catch(() => { });
            }
        }
    }

    const galleryFilePath = `${galleryBasePath}${fileName}`;
    if (!(await exists(galleryBasePath))) {
        await mkdir(galleryBasePath);
    }
    if (await exists(removeFileScheme(src))) {
        try {
            await copyFile(removeFileScheme(src), galleryFilePath);
        } catch (e) {
            devLog("warn", "📁[文件工具] 文件复制失败", { src, galleryFilePath, error: e });
        }
    }
    if (src.startsWith("http")) {
        const { promise } = downloadFile({
            fromUrl: src,
            toFile: galleryFilePath,
            background: true,
        });
        await promise;
    }
    if (src.startsWith("data")) {
        const [, data = ""] = src.split(",", 2);
        await writeFile(galleryFilePath, data, "base64");
    }

    return galleryFilePath;
}

export function sizeFormatter(bytes: number | string) {
    if (typeof bytes === "string") {
        return bytes;
    }
    if (bytes === 0) {
        return "0B";
    }
    let k = 1024,
        sizes = ["B", "KB", "MB", "GB"],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + sizes[i];
}

export async function checkAndCreateDir(dirPath: string) {
    const filePath = dirPath;
    try {
        if (!(await exists(filePath))) {
            await mkdir(filePath);
        }
    } catch (e) {
        errorLog("无法初始化目录", { path: dirPath, e });
    }
}

async function getFolderSize(dirPath: string): Promise<number> {
    let size = 0;
    try {
        const fns = await readDir(dirPath);
        for (let fn of fns) {
            if (fn.isFile()) {
                size += fn.size;
            }
            // todo: 可以改成并行 promise.all
            if (fn.isDirectory()) {
                size += await getFolderSize(fn.path);
            }
        }
    } catch {}
    return size;
}

export async function getCacheSize(
    type: "music" | "lyric" | "image",
): Promise<number> {
    if (type === "music") {
        return getFolderSize(pathConst.musicCachePath);
    } else if (type === "lyric") {
        return getFolderSize(pathConst.lrcCachePath);
    } else if (type === "image") {
        return getFolderSize(pathConst.imageCachePath);
    }
    throw new Error();
}

export async function clearCache(type: "music" | "lyric" | "image") {
    if (type === "music") {
        try {
            if (await exists(pathConst.musicCachePath)) {
                return unlink(pathConst.musicCachePath);
            }
        } catch {}
    } else if (type === "lyric") {
        try {
            const lrcs = readDir(pathConst.lrcCachePath);
            return Promise.all((await lrcs).map(_ => unlink(_.path)));
        } catch {}
    } else if (type === "image") {
        return FastImage.clearDiskCache();
    }
}

export function addFileScheme(fileName: string) {
    if (fileName.startsWith("/")) {
        return `file://${fileName}`;
    }
    return fileName;
}

export function removeFileScheme(filePath: string) {
    if (filePath.startsWith("file://")) {
        return filePath.slice(7);
    }
    return filePath;
}

export function addRandomHash(url: string) {
    if (url.indexOf("#") === -1) {
        return `${url}#${Date.now()}`;
    }
    return url;
}

export function trimHash(url: string) {
    const index = url.lastIndexOf("#");
    if (index === -1) {
        return url;
    }
    return url.substring(0, index);
}

export function escapeCharacter(str?: string) {
    return str !== undefined ? `${str}`.replace(/[/|\\?*"<>:]+/g, "_") : "";
}

export function getDirectory(dirPath: string) {
    const lastSlash = dirPath.lastIndexOf("/");
    if (lastSlash === -1) {
        return dirPath;
    }
    return dirPath.slice(0, lastSlash);
}

export function getFileName(filePath: string, withoutExt?: boolean) {
    const lastSlash = filePath.lastIndexOf("/");
    if (lastSlash === -1) {
        return filePath;
    }
    let fileName = filePath.slice(lastSlash + 1);
    if (withoutExt) {
        const lastDot = fileName.lastIndexOf(".");
        fileName = lastDot === -1 ? fileName : fileName.slice(0, lastDot);
    }

    try {
        return decodeURIComponent(fileName);
    } catch {
        return fileName;
    }
}

export async function mkdirR(directory: string) {
    let folder = directory;
    const checkStack: string[] = [];
    while (folder.length > 15) {
        checkStack.push(folder);
        folder = path.dirname(folder);
    }
    let existPos = 0;
    for (let i = 0; i < checkStack.length; ++i) {
        const isExist = await exists(checkStack[i]);
        if (isExist) {
            existPos = i;
            break;
        }
    }

    for (let j = existPos - 1; j >= 0; --j) {
        try {
            await mkdir(checkStack[j]);
        } catch (e) {
            devLog("warn", "📁[文件工具] 文件处理异常", { error: e });
        }
    }
}

export async function writeInChunks(
    filePath: string,
    data,
    chunkSize = 1024 * 1024 * 2,
) {
    let offset = 0;
    if (await exists(filePath)) {
        await unlink(filePath);
    }

    while (offset < data.length) {
        const chunk = data.slice(offset, offset + chunkSize);
        if (offset === 0) {
            await RNFS.writeFile(filePath, chunk, "utf8");
        } else {
            await RNFS.appendFile(filePath, chunk, "utf8");
        }
        offset += chunkSize;
    }
}


export function resolveImportedAssetOrPath(pathOrAsset: string | number | undefined) {
    return pathOrAsset === undefined
        ? undefined
        : typeof pathOrAsset === "string"
            ? pathOrAsset
            : resolveImportedAsset(pathOrAsset);
}

function resolveImportedAsset(id?: number) {
    return id
        ? (resolveAssetSource(id) as { uri: string } | null) ?? undefined
        : undefined;
}
