import React, { useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import rpx, { vmax } from "@/utils/rpx";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ListItem from "@/components/base/listItem";
import ThemeText from "@/components/base/themeText";
import IconButton from "@/components/base/iconButton";
import useColors from "@/hooks/useColors";
import Toast from "@/utils/toast";
import { showDialog } from "@/components/dialogs/useDialog";
import PanelBase from "../base/panelBase";
import PanelHeader from "../base/panelHeader";
import PluginManager, { Plugin } from "@/core/pluginManager";
import { normalizeImportedMusicSheet } from "@/utils/mediaUtils";
import { mergeMusicSheetsByPriority } from "@/utils/sheetMerge";
import { showPanel } from "../usePanel";
import { useI18N } from "@/core/i18n";

interface ISourceRow {
    plugin: Plugin | null;
    url: string;
}

export default function MergeImportMusicSheet() {
    const validPlugins =
        PluginManager.getSortedPluginsWithAbility("importMusicSheet");
    const { t } = useI18N();
    const colors = useColors();
    const safeAreaInsets = useSafeAreaInsets();

    const [rows, setRows] = useState<ISourceRow[]>([
        { plugin: validPlugins[0] ?? null, url: "" },
        { plugin: null, url: "" },
    ]);
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
            Toast.warn(
                e?.message ?? t("panel.mergeImportMusicSheet.mergeFailed"),
            );
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
                        loading={merging}
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
                            <View
                                key={`${index}`}
                                style={style.rowWrapper}>
                                <View style={style.rowHeader}>
                                    <ThemeText
                                        fontWeight="bold"
                                        fontSize="subTitle">
                                        {`${index + 1}. ${
                                            row.plugin?.name ??
                                            t(
                                                "panel.mergeImportMusicSheet.selectPlugin",
                                            )
                                        }`}
                                    </ThemeText>
                                    <View style={style.rowActions}>
                                        <IconButton
                                            name="trash-outline"
                                            sizeType="light"
                                            onPress={() => {
                                                setRows(prev =>
                                                    prev.filter(
                                                        (_, i) =>
                                                            i !== index,
                                                    ),
                                                );
                                            }}
                                        />
                                        <IconButton
                                            name="skip-left"
                                            sizeType="light"
                                            onPress={() =>
                                                moveRow(index, -1)
                                            }
                                        />
                                        <IconButton
                                            name="skip-right"
                                            sizeType="light"
                                            onPress={() => moveRow(index, 1)}
                                        />
                                    </View>
                                </View>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={style.pluginScroll}>
                                    <View style={style.pluginChips}>
                                        {validPlugins.map(plugin => {
                                            const isSelected =
                                                row.plugin?.hash ===
                                                plugin.hash;
                                            return (
                                                <View
                                                    key={plugin.hash}
                                                    style={[
                                                        style.pluginChip,
                                                        {
                                                            backgroundColor:
                                                                isSelected
                                                                    ? colors.primary
                                                                    : colors.placeholder,
                                                        },
                                                    ]}>
                                                    <ThemeText
                                                        fontSize="subTitle"
                                                        numberOfLines={1}
                                                        style={{
                                                            color: isSelected
                                                                ? "#fff"
                                                                : colors.text,
                                                        }}
                                                        onPress={() => {
                                                            updateRow(index, {
                                                                plugin:
                                                                    isSelected
                                                                        ? row.plugin
                                                                        : plugin,
                                                            });
                                                        }}>
                                                        {plugin.name}
                                                    </ThemeText>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </ScrollView>
                                <TextInput
                                    value={row.url}
                                    onChangeText={text => {
                                        updateRow(index, { url: text });
                                    }}
                                    style={[
                                        style.input,
                                        {
                                            color: colors.text,
                                            backgroundColor:
                                                colors.placeholder,
                                        },
                                    ]}
                                    placeholderTextColor={colors.textSecondary}
                                    placeholder={t(
                                        "panel.mergeImportMusicSheet.linkPlaceholder",
                                    )}
                                    maxLength={1000}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        ))}
                        <ListItem
                            withHorizontalPadding
                            heightType="small"
                            onPress={() => {
                                setRows(prev => [
                                    ...prev,
                                    { plugin: null, url: "" },
                                ]);
                            }}>
                            <ListItem.Content
                                title={t(
                                    "panel.mergeImportMusicSheet.addSource",
                                )}
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
    rowWrapper: {
        paddingHorizontal: rpx(24),
        paddingVertical: rpx(12),
    },
    rowHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    rowActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: rpx(4),
    },
    pluginScroll: {
        marginTop: rpx(8),
    },
    pluginChips: {
        flexDirection: "row",
        flexWrap: "nowrap",
        gap: rpx(12),
        paddingVertical: rpx(6),
    },
    pluginChip: {
        paddingHorizontal: rpx(20),
        paddingVertical: rpx(10),
        borderRadius: rpx(24),
    },
    input: {
        marginTop: rpx(10),
        borderRadius: rpx(14),
        paddingHorizontal: rpx(20),
        paddingVertical: rpx(14),
    },
});
