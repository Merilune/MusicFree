# Audiora

<div align="center">

  <img src="./src/assets/imgs/audiora-wordmark.png" alt="Audiora" width="520" />

  **基于 MusicFree 打造的开源音乐播放器**

  [English](./readme-en.md) | 简体中文

  [![License](https://img.shields.io/badge/license-AGPL%203.0-blue)](LICENSE)
  [![Version](https://img.shields.io/github/v/release/yingjiedev/audiora?color=green)](https://github.com/yingjiedev/audiora/releases)
  [![Platform](https://img.shields.io/badge/platform-Android-orange)]()

</div>

---

## 本仓库是什么

Audiora 是一个基于 [Toskysun/MusicFree](https://github.com/Toskysun/MusicFree) 的开源音乐播放器（其上游为 [maotoumao/MusicFree](https://github.com/maotoumao/MusicFree)，原作者猫头猫），专注于更精致的界面、丰富的个性化能力与顺手的播放体验。

上游的全部能力（插件系统、ikun 音源 12 级音质、下载增强等）都保留，主要新增/改进见下。

## 相较上游的主要区别

### 主要亮点
- **内置字体**：思源宋体、汉仪细中圆、霞鹜新致宋、志莽行书四款内置字体，全局字体与歌词字体可分别选择
- **自定义启动页**：换上自己喜欢的图，开屏体验直接对标网易云

### 主题与个性化
- **自定义主题重做**：黑白初始配色；背景壁纸支持模糊度/透明度/暗化遮罩调节，表面不透明度、卡片阴影强度全局可调
- **歌单独立背景**：每个本地歌单可单独设置背景，支持"用封面当背景"（在线封面同样可用）
- **全新 Audiora 品牌**：应用内 Logo、Android/iOS 图标与启动资源统一更新
- **选图裁剪**：所有选图入口支持自由比例裁剪，并按最终显示比例锁定裁剪框

### 播放与通知
- **紧凑媒体通知**：参考QQ音乐式矮高度通知，收藏/上一首/播放暂停/下一首四个按钮，收藏状态实时显示（实心红心），锁屏/耳机控制不受影响
- **桌面悬浮歌词**：逐字进度、翻译副行、拖动定位、多套配色预设、字体字号可调、锁定防误触

### 一些体验修复
- 转场动画不再丢失：歌单详情、推荐歌单、榜单、专辑/歌手页进入时左侧滑入动画恢复
- 评论区/全屏面板补不透明底，壁纸下不再看不清字
- 逐字歌词开关切换、歌词跳回旧歌、弹窗标题顶出、备份导入合并我喜欢歌单等一堆小毛病
- 移除上游公告、更新与许可协议弹窗

> 完整改动见 [changelog](./changelog.md) 与提交历史。

## 快速开始

1. 前往 [Releases](https://github.com/yingjiedev/audiora/releases) 下载最新 APK 安装
2. 打开应用 → 侧边栏 → 设置 → 插件设置 → 从网络安装插件
3. 插件源参考：`https://musicfree-plugins.netlify.app`

> 需要注意的是 **目前只编译了 Android arm64（64 位）版本**，其他架构有需要的话可以提 Issue （真的会有人用吗）。

## 📖 文档

- 📚 **插件开发**：[开发文档](https://musicfree.catcat.work/plugin/introduction.html)
- ❓ **常见问题**：[Q&A 文档](https://musicfree.catcat.work/qa/common.html)
- 🔧 **使用指南**：[详细教程](https://musicfree.catcat.work/usage/mobile/install-plugin.html)

音质键值、原版插件兼容说明与上游一致，详见上游 README。

## 致谢

本项目站在前人的肩膀上：

- **原作者**：[猫头猫 maotoumao](https://github.com/maotoumao) — [原项目](https://github.com/maotoumao/MusicFree)
- **上游**：[Toskysun](https://github.com/Toskysun) — [Toskysun/MusicFree](https://github.com/Toskysun/MusicFree)
- **二次开发**：[Merilune](https://github.com/Merilune) — 本仓库

- **Claude** — [Claude Code](https://claude.com/claude-code)：陪我一路把这个播放器改到今天，这里的绝大部分改动都有它的一份，在此致谢 🤝

## 协议

本项目遵循 [AGPL-3.0](LICENSE) 开源协议

- ⚠️ 禁止用于商业用途
- ⚠️ 请合法合规使用
- ⚠️ 插件产生的数据与本软件无关

## 反馈

遇到问题或有建议？欢迎 [提交 Issue](../../issues)

---

<div align="center">
  Made with ❤️
</div>
