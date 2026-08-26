import React, { memo } from "react";
import useColors from "@/hooks/useColors";
import Theme from "@/core/theme";
import CustomBackground from "./customBackground";

function PageBackground() {
    const background = Theme.useBackground();
    const colors = useColors();

    // 壁纸不再限定「自定义主题」：预设主题的 pageBackground 是不透明底色，
    // 壁纸叠在它上面观感正确，而 useHasCustomBackground 一直按「有壁纸就算」判断，
    // 之前限定主题会导致边框阴影已按壁纸调整、壁纸本身却不显示。
    return (
        <CustomBackground
            url={background?.url}
            blur={background?.blur}
            opacity={background?.opacity}
            backgroundColor={colors?.pageBackground ?? colors.background}
        />
    );
}
export default memo(PageBackground, () => true);
