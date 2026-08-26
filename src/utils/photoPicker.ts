import ImagePicker from "react-native-image-crop-picker";

/**
 * 打开相册选图并进入自由比例裁剪页（宽图可自行框选想要的部分）。
 * @returns 裁剪结果的 file:// 地址；用户取消返回 null
 */
export async function pickPhotoWithCrop(options?: {
    /** 关掉裁剪直接拿原图，默认开 */
    cropping?: boolean;
}): Promise<string | null> {
    let image;
    try {
        image = await ImagePicker.openPicker({
            mediaType: "photo",
            cropping: options?.cropping ?? true,
            // 自由比例裁剪框，宽图横图都能框
            freeStyleCropEnabled: true,
            compressImageMaxWidth: 2048,
            compressImageMaxHeight: 2048,
            compressImageQuality: 0.85,
        });
    } catch (e: any) {
        // 用户在相册或裁剪页取消时库会抛 Cancel 异常，按取消处理
        const message = String(e?.message ?? e).toLowerCase();
        if (message.includes("cancel")) {
            return null;
        }
        throw e;
    }

    if (!image?.path) {
        return null;
    }
    return image.path.startsWith("file://")
        ? image.path
        : `file://${image.path}`;
}
