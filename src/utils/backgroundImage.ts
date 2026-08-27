import pathConst from "@/constants/pathConst";
import {
    addFileScheme,
    addRandomHash,
    removeFileScheme,
    trimHash,
} from "@/utils/fileUtils";
import { devLog } from "@/utils/log";
import {
    copyFile,
    downloadFile,
    exists,
    unlink,
} from "react-native-fs";
import {
    getScreenAspectRatio,
    pickPhotoWithCrop,
} from "@/utils/photoPicker";

/**
 * 背景图的最大边长（压图由裁剪器的 compress 参数控制）。
 * 相机原图会让 Fresco 的模糊后处理解码远超屏幕所需的像素量。
 */
export const BACKGROUND_MAX_DIMENSION = 2048;

function getExtension(uri: string) {
    const dotIndex = uri.lastIndexOf(".");
    const ext = dotIndex === -1 ? "" : uri.slice(dotIndex);
    // content:// 之类的地址没有扩展名，点号出现在路径中段时也不可信，统一按 jpg 处理
    return /^\.[A-Za-z0-9]{1,5}$/.test(ext) ? ext : ".jpg";
}

/** 打开相册选择背景图（带自由比例裁剪），返回裁剪后的原始地址；用户取消时返回 null */
export async function pickBackgroundImage(): Promise<string | null> {
    return pickPhotoWithCrop({ aspectRatio: getScreenAspectRatio() });
}

/**
 * 把选中的图片落盘到应用数据目录
 * @param uri 相册返回的原始地址，或已落盘的 file:// 地址
 * @param fileName 不含扩展名的目标文件名
 * @returns 带 file:// 前缀与随机 hash 的地址，hash 用于击穿图片缓存
 */
export async function saveBackgroundImage(uri: string, fileName: string) {
    // 已落盘的地址带 file:// 前缀和缓存 hash，copyFile 认不出来，先还原成纯路径
    let source = uri.startsWith("content://")
        ? uri
        : removeFileScheme(trimHash(uri));
    // 网络封面（如"用封面当背景"的在线封面）copyFile 拷不了，先下载到临时目录
    if (/^https?:\/\//.test(source)) {
        const downloadResult = await downloadFile({
            fromUrl: source,
            toFile: `${pathConst.dataPath}${fileName}.download`,
        }).promise;
        if (downloadResult.statusCode < 200 || downloadResult.statusCode >= 300) {
            throw new Error(`下载背景图失败: ${downloadResult.statusCode}`);
        }
        source = `${pathConst.dataPath}${fileName}.download`;
    }
    const targetPath = `${pathConst.dataPath}${fileName}${getExtension(source)}`;

    if (source === targetPath) {
        // 源和目标是同一个文件，只需要换个 hash 让图片缓存失效
        return addRandomHash(addFileScheme(targetPath));
    }

    // 同名文件已存在时 copyFile 会失败，先删掉旧的
    if (await exists(targetPath)) {
        await unlink(targetPath);
    }
    await copyFile(source, targetPath);

    return addRandomHash(addFileScheme(targetPath));
}

/** 删除背景图文件；文件不存在或已被清理时静默跳过 */
export async function removeBackgroundImage(url?: string | null) {
    if (!url) {
        return;
    }

    try {
        const filePath = removeFileScheme(trimHash(url));
        if (await exists(filePath)) {
            await unlink(filePath);
        }
    } catch (e) {
        devLog("warn", "🎨[背景图] 删除背景文件失败", e);
    }
}
