import React, { Fragment, useRef } from "react";
import { ScrollView, StyleSheet } from "react-native";
import rpx from "@/utils/rpx";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PanelBase from "../base/panelBase";
import { hidePanel } from "../usePanel";
import ListItem from "@/components/base/listItem";
import PanelHeader from "../base/panelHeader";

interface ICandidateItem {
    title?: string;
    value: any;
    invokeAfterDismiss?: boolean;
}

interface ISimpleSelectProps {
    height?: number;
    header?: string;
    candidates?: Array<ICandidateItem>;
    onPress?: (item: ICandidateItem) => void;
}

const ACTION_DELAY_MS = 350;

export default function SimpleSelect(props: ISimpleSelectProps) {
    const {
        height = rpx(520),
        header = "",
        candidates = [],
        onPress,
    } = props ?? {};

    const safeAreaInsets = useSafeAreaInsets();
    const actionPendingRef = useRef(false);

    const handlePress = (item: ICandidateItem) => {
        if (!item.invokeAfterDismiss) {
            onPress?.(item);
            hidePanel();
            return;
        }
        if (actionPendingRef.current) {
            return;
        }
        actionPendingRef.current = true;
        hidePanel();

        // PanelBase is hosted in a native Modal. On iOS, presenting another
        // controller before that Modal is dismissed can leave it permanently
        // marked as active (notably expo-document-picker).
        setTimeout(() => {
            onPress?.(item);
        }, ACTION_DELAY_MS);
    };

    return (
        <PanelBase
            height={height}
            renderBody={() => (
                <>
                    <PanelHeader title={header} hideButtons />

                    <ScrollView
                        style={[
                            styles.body,
                            { marginBottom: safeAreaInsets.bottom },
                        ]}>
                        {candidates.map((it, index) => {
                            return (
                                <Fragment key={`frag-${index}`}>
                                    <ListItem
                                        heightType="small"
                                        withHorizontalPadding
                                        onPress={() => handlePress(it)}>
                                        <ListItem.Content
                                            title={it.title ?? it.value}
                                        />
                                    </ListItem>
                                </Fragment>
                            );
                        })}
                    </ScrollView>
                </>
            )}
        />
    );
}

const styles = StyleSheet.create({
    header: {
        width: "100%",
        flexDirection: "row",
        padding: rpx(24),
    },
    body: {
        flex: 1,
    },
    item: {
        height: rpx(96),
        justifyContent: "center",
    },
});
