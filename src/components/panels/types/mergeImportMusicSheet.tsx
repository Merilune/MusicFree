import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import rpx, { vmax } from "@/utils/rpx";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ListItem from "@/components/base/listItem";
import ThemeText from "@/components/base/themeText";
import IconButton from "@/components/base/iconButton";
import Toast from "@/utils/toast";
import { showDialog } from "@/components/dialogs/useDialog";
import { showPanel } from "../usePanel";
import PanelBase from "../base/panelBase";
import PanelHeader from "../base/panelHeader";
import PluginManager, { Plugin } from "@/core/pluginManager";
import { normalizeImportedMusicSheet } from "@/utils/mediaUtils";
import { mergeMusicSheetsByPriority } from "@/utils/sheetMerge";
import { useI18N } from "@/core/i18n";

interface ISourceRow {
    plugin: Plugin | null;
    url: string;
}

interface IMergeImportMusicSheetProps {
    /** 预置的音源行（由单歌单导入入口进入时传入） */
    initialRows?: ISourceRow[];
}

export default function MergeImportMusicSheet(
    props: IMergeImportMusicSheetProps,
) {
    const validPlugins =
        PluginManager.getSortedPluginsWithAbility("importMusicSheet");
    const { t } = useI18N();
    const safeAreaInsets = useSafeAreaInsets();

    const [rows, setRows] = useState<ISourceRow[]>(
        props?.initialRows?.length
            ? props.initialRows
            : [{ plugin: validPlugins[0] ?? null, url: "" }, { plugin: null, url: "" }],
    );
    const [merging, setMerging] = useState(false);

    const updateRow = (index: number, patch: Partial<ISourceRow>) => {
        setRows(prev =>
            prev.map((it, i) => (i === index ? { ...it, ...patch } : it)),
        );
    };

    const moveRow = (index: number, offset: number) => {
        const target = index + offset;
        if (target < 0 || target >= rows.length) {
            return;
        }
        setRows(prev => {
            const next = [...prev];
            const [row] = next.splice(index, 1);
            next.splice(target, 0, row);
            return next;
        });
    };

    const startMerge = async () => {
        if (merging) {
            return;
        }
        const readyRows = rows.filter(it => it.plugin && it.url.trim());
        if (readyRows.length < 2) {
            Toast.warn(t("panel.mergeImportMusicSheet.needTwoSources"));
            return;
        }

        setMerging(true);
        try {
            const loadedSheets = [];
            for (const row of readyRows) {
                const plugin = row.plugin!;
                const result = await plugin.methods.importMusicSheet(
                    row.url.trim(),
                );
                const sheet = normalizeImportedMusicSheet(
                    result,
                    plugin.name,
                    row.url.trim(),
                    t("panel.importMusicSheet.fallbackTitle", {
                        plugin: plugin.name,
                    }),
                );
                if (!sheet) {
                    throw new Error(
                        t("panel.mergeImportMusicSheet.sourceFailed", {
                            plugin: plugin.name,
                        }),
                    );
                }
                loadedSheets.push({
                    pluginHash: plugin.hash,
                    pluginName: plugin.name,
                    sheet,
                    musicList: sheet.musicList ?? [],
                });
            }

            const { mergedList, stats } = mergeMusicSheetsByPriority(
                loadedSheets.map(it => ({
                    pluginHash: it.pluginHash,
                    pluginName: it.pluginName,
                    musicList: it.musicList,
                })),
            );

            const statsText = stats
                .map(
                    it =>
                        `${it.pluginName}: ${t(
                            "panel.mergeImportMusicSheet.statLine",
                            {
                                total: it.total,
                                kept: it.kept,
                                duplicates: it.duplicates,
                                uncertain: it.uncertain,
                            },
                        )}`,
                )
                .join("\n");

            showDialog("SimpleDialog", {
                title: t("panel.mergeImportMusicSheet.previewTitle"),
                content: (
                    <ThemeText>
                        {`${statsText}\n\n${t(
                            "panel.mergeImportMusicSheet.totalLine",
                            { count: mergedList.length },
                        )}`}
                    </ThemeText>
                ),
                async onOk() {
                    showPanel("AddToMusicSheet", {
                        musicItem: mergedList,
                        newSheetDefaultName:
                            loadedSheets[0]?.sheet.title ||
                            t("panel.mergeImportMusicSheet.defaultSheetName"),
                    });
                },
            });
        } catch (e: any) {
            Toast.warn(e?.message ?? t("panel.mergeImportMusicSheet.mergeFailed"));
        } finally {
            setMerging(false);
        }
    };

    return (
        <PanelBase
            height={vmax(70)}
            renderBody={() => (
                <>
                    <PanelHeader
                        title={t("panel.mergeImportMusicSheet.title")}
                        okText={t("panel.mergeImportMusicSheet.merge")}
                        onOk={startMerge}
                        onCancel={() => showPanel("ImportMusicSheet")}
                    />
                    <ScrollView
                        style={{ marginBottom: safeAreaInsets.bottom }}
                        contentContainerStyle={style.content}>
                        <ThemeText
                            fontColor="textSecondary"
                            fontSize="subTitle"
                            style={style.hint}>
                            {t("panel.mergeImportMusicSheet.priorityHint")}
                        </ThemeText>
                        {rows.map((row, index) => (
                            <ListItem
                                key={`${index}`}
                                withHorizontalPadding
                                heightType="small"
                                onPress={() => {
                                    showPanel("SimpleSelect", {
                                        header: t(
                                            "panel.mergeImportMusicSheet.selectPlugin",
                                        ),
                                        candidates: validPlugins.map(plugin => ({
                                            title: plugin.name,
                                            value: plugin.hash,
                                        })),
                                        onPress(candidate) {
                                            updateRow(index, {
                                                plugin:
                                                    validPlugins.find(
                                                        it =>
                                                            it.hash ===
                                                            candidate.value,
                                                    ) ?? null,
                                            });
                                        },
                                    });
                                }}>
                                <ListItem.Content
                                    title={
                                        row.plugin?.name ??
                                        t(
                                            "panel.mergeImportMusicSheet.selectPlugin",
                                        )
                                    }
                                    description={
                                        row.url ||
                                        t(
                                            "panel.mergeImportMusicSheet.linkPlaceholder",
                                        )
                                    }
                                />
                                <View style={style.rowActions}>
                                    <IconButton
                                        name="pencil-square"
                                        sizeType="light"
                                        onPress={() => {
                                            if (!row.plugin) {
                                                Toast.warn(
                                                    t(
                                                        "panel.mergeImportMusicSheet.selectPluginFirst",
                                                    ),
                                                );
                                                return;
                                            }
                                            showPanel("SimpleInput", {
                                                title: row.plugin.name,
                                                placeholder: t(
                                                    "panel.mergeImportMusicSheet.linkPlaceholder",
                                                ),
                                                hints: row.plugin.instance
                                                    .hints?.importMusicSheet,
                                                maxLength: 1000,
                                                onOk(text) {
                                                    updateRow(index, {
                                                        url: text,
                                                    });
                                                },
                                            });
                                        }}
                                    />
                                    <IconButton
                                        name="trash-outline"
                                        sizeType="light"
                                        onPress={() => {
                                            setRows(prev =>
                                                prev.filter(
                                                    (_, i) => i !== index,
                                                ),
                                            );
                                        }}
                                    />
                                    <TouchableOpacity
                                        style={style.moveButton}
                                        disabled={index === 0}
                                        onPress={() => moveRow(index, -1)}>
                                        <ThemeText
                                            fontColor={
                                                index === 0
                                                    ? "textSecondary"
                                                    : "primary"
                                            }>
                                            ↑
                                        </ThemeText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={style.moveButton}
                                        disabled={index === rows.length - 1}
                                        onPress={() => moveRow(index, 1)}>
                                        <ThemeText
                                            fontColor={
                                                index === rows.length - 1
                                                    ? "textSecondary"
                                                    : "primary"
                                            }>
                                            ↓
                                        </ThemeText>
                                    </TouchableOpacity>
                                </View>
                            </ListItem>
                        ))}
                        <ListItem
                            withHorizontalPadding
                            heightType="small"
                            onPress={() => {
                                setRows(prev => [...prev, { plugin: null, url: "" }]);
                            }}>
                            <ListItem.Content
                                title={t("panel.mergeImportMusicSheet.addSource")}
                            />
                        </ListItem>
                    </ScrollView>
                </>
            )}
        />
    );
}

const style = StyleSheet.create({
    content: {
        paddingBottom: rpx(24),
    },
    hint: {
        paddingHorizontal: rpx(24),
        paddingVertical: rpx(16),
    },
    rowActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: rpx(4),
    },
    moveButton: {
        width: rpx(52),
        height: rpx(52),
        alignItems: "center",
        justifyContent: "center",
    },
});
