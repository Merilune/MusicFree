import ImagePicker from "react-native-image-crop-picker";
import { Dimensions } from "react-native";

/**
 * 打开相册选图并进入裁剪页。
 * @param options.aspectRatio 锁定裁剪框比例（如歌单封面传 1:1）；
 *            不传则自由比例裁剪（宽图横图都能框）
 * @returns 裁剪结果的 file:// 地址；用户取消返回 null
 */
export async function pickPhotoWithCrop(options?: {
    /** 关掉裁剪直接拿原图，默认开 */
    cropping?: boolean;
    /** 锁定裁剪框的宽高比 */
    aspectRatio?: [number, number];
}): Promise<string | null> {
    const [ratioW, ratioH] = options?.aspectRatio ?? [];
    let image;
    try {
        image = await ImagePicker.openPicker({
            mediaType: "photo",
            cropping: options?.cropping ?? true,
            // 锁定比例时关掉自由框；只有未指定比例才允许自由拖
            freeStyleCropEnabled: !options?.aspectRatio,
            // Android 上 width/height 既定裁剪框比例又是输出目标尺寸，
            // 直接传 1:1 会裁出 1x1 像素的图，必须换算成真实像素
            ...(options?.aspectRatio
                ? {
                    width: 1080,
                    height: Math.round((1080 * ratioH) / ratioW),
                }
                : {}),
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

/** 屏幕宽高比（背景图/启动图按整屏显示锁定裁剪框） */
export function getScreenAspectRatio(): [number, number] {
    const { width, height } = Dimensions.get("window");
    // 约分成小整数比（如 1080x2400 -> 9:20），避免传超大的浮点数
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const g = gcd(Math.round(width), Math.round(height)) || 1;
    return [Math.round(width) / g, Math.round(height) / g];
}
