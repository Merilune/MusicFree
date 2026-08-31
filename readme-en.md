# Audiora

<div align="center">

  <img src="./src/assets/imgs/audiora-wordmark.png" alt="Audiora" width="520" />

  **An open-source music player built on MusicFree**

  [中文](./readme.md) | English

  [![License](https://img.shields.io/badge/license-AGPL%203.0-blue)](LICENSE)
  [![Version](https://img.shields.io/github/v/release/yingjiedev/audiora?color=green)](https://github.com/yingjiedev/audiora/releases)
  [![Platform](https://img.shields.io/badge/platform-Android-orange)]()

</div>

---

## About Audiora

Audiora is an open-source music player developed from [Merilune/MusicFree](https://github.com/Merilune/MusicFree). That version descends from [Toskysun/MusicFree](https://github.com/Toskysun/MusicFree), whose original upstream is [maotoumao/MusicFree](https://github.com/maotoumao/MusicFree). Audiora adds a refined interface, deeper personalization, and an improved everyday listening experience while retaining the plugin ecosystem and core playback capabilities.

## Project Scope and Responsibilities

Audiora is a general-purpose client for managing, playing, and syncing music that users own, are authorized to use, or may otherwise access lawfully. The project does not provide music content or operate a music service.

- Audiora does not provide, bundle, or recommend unauthorized music sources, service-specific keys or credentials for commercial platforms, or implementations that bypass DRM or other access controls.
- Plugins and user-configured music sources are selected by the user and may be developed or operated by independent third parties. Providing a general plugin runtime does not mean that the project has reviewed or endorses their content, availability, security, or legality.
- Users must ensure that they have the right to access, play, download, or sync content and must comply with applicable laws, copyright rules, and service terms. Third-party providers and users remain responsible for their respective services and actions as required by law.

If a plugin, example, or project document may infringe your rights, please open an [issue](../../issues) with the source, the basis of your claim, and relevant links so maintainers can review it and take appropriate action, such as removing a link or recommendation.

## ✨ Core Features

<table>
<tr>
<td width="50%">

### 🎯 Plugin System
- 🔌 **Fully Pluggable**: Music sources, search, playback all based on plugins
- 🎵 **User-Configured Sources**: Connect compatible sources you control or are authorized to use
- 📦 **Flexible Management**: Support local and network plugin installation

</td>
<td width="50%">

### 🎨 Personalization
- 🎭 **Theme Customization**: Dark/light modes, custom backgrounds
- 🌈 **Audiora Branding**: Unified in-app, Android, and iOS visual identity
- 🏷️ **Quality Labels**: Customize quality display to your preference
- 🚀 **Launch Optimization**: Open playback details on app startup

</td>
</tr>
<tr>
<td width="50%">

### 📥 Enhanced Downloads
- 🔔 **Download Notifications**: Real-time download progress display
- 📝 **File Naming**: Support for multiple naming formats
- 🏷️ **Music Tags**: Automatically write metadata when downloading

</td>
<td width="50%">

### 🔒 Privacy & Security
- 💾 **Local Storage**: All data stored locally
- 🚫 **Ad-Free**: Completely free, no ads
- 🔓 **Open Source**: Based on AGPL 3.0 license

</td>
</tr>
</table>

## 🚀 Quick Start

### 📲 Install App
1. Go to [Releases](https://github.com/yingjiedev/audiora/releases) to download the latest version
2. Install the APK file on your Android device

### 🔌 Install Plugins

Audiora does not provide an official music source. Install only plugins or self-hosted sources that you trust and have the right to use. Before installation, review the provider, requested permissions, network access, and applicable service terms.

#### Plugin Installation Steps
1. Open app → Sidebar → Settings → Plugin Settings
2. Select "Install plugin from network"
3. Enter plugin address and confirm

## 📖 Documentation

- 📚 **Plugin Development**: [Development Docs](https://musicfree.catcat.work/plugin/introduction.html)
- ❓ **FAQ**: [Q&A Docs](https://musicfree.catcat.work/qa/common.html)
- 🔧 **Usage Guide**: [Detailed Tutorial](https://musicfree.catcat.work/usage/mobile/install-plugin.html)

## 🔧 Plugin Development Guide

### Quality Keys (IQualityKey)

This version supports the following **12 quality levels**:

| Quality Key | Description | Bitrate/Format |
|------------|-------------|----------------|
| `mgg` | Low Quality | 96 kbps |
| `128k` | Standard Quality | 128 kbps |
| `192k` | Medium Quality | 192 kbps |
| `320k` | High Quality | 320 kbps |
| `flac` | Lossless Quality | FLAC |
| `flac24bit` | Hi-Res Lossless | FLAC 24-bit |
| `hires` | Hi-Res Quality | Hi-Res |
| `vinyl` | Vinyl Quality | Vinyl |
| `dolby` | Dolby Atmos | Dolby Atmos |
| `atmos` | Premium Quality | Atmos 2.0 |
| `atmos_plus` | Premium Spatial | Atmos+ 2.0 |
| `master` | Premium Master | Master 3.0 |

### Legacy Plugin Compatibility

This version is **fully compatible with legacy plugins**. Legacy quality keys are automatically converted:

| Legacy Key | Converts To | Description |
|-----------|-------------|-------------|
| `low` | `128k` | Low → Standard Quality |
| `standard` | `192k` | Standard → Medium Quality |
| `high` | `320k` | High → High Quality |
| `super` | `flac` | Super → Lossless Quality |

**Development Tips**:
- ✅ New plugins should use the current quality keys
- ✅ Legacy plugins work without modification
- ✅ UI displays unified quality names

## 🤝 About

### Acknowledgments

Audiora builds on the work of:

- **Direct foundation**: [Merilune/MusicFree](https://github.com/Merilune/MusicFree)
- **Upstream fork**: [Toskysun/MusicFree](https://github.com/Toskysun/MusicFree)
- **Original author and project**: [maotoumao/MusicFree](https://github.com/maotoumao/MusicFree)

### Modifications

Based on original v0.6.1, main improvements include:
- Retained general plugin and user-configured source support
- Enhanced download features (notifications, naming, tags)
- Optimized personalization settings
- Fixed multiple known issues

## 📄 License

This project is licensed under [AGPL-3.0](LICENSE)

**Important**:
- ⚠️ Commercial use prohibited
- ⚠️ Please use legally and compliantly
- ⚠️ Data generated by plugins is not related to this software

## 💬 Feedback

Have issues or suggestions? Feel free to [submit an issue](../../issues)

---

<div align="center">
  Made with ❤️ by the community
</div>
