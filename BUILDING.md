# Android 本地测试包构建

本页用于构建可安装的 Android Release 测试 APK。它适用于 Windows + PowerShell，并固定产出 `arm64-v8a` 包。

## 构建前准备

- 使用 JDK 17、Android SDK（项目当前使用 Build Tools 36.0.0、NDK 27.1.12297006）和 Node.js。
- 在**独立的构建工作树**中操作，不能在含有未提交改动的主工作树中改版本或生成构建信息。
- Windows 下将工作树放在短路径、未启用 EFS 加密的目录，例如 `C:\a`。React Native 原生依赖的 CMake 构建路径很深；过长路径或加密目录可能导致构建失败。
- 每个可安装测试包都必须使用新的 `versionName` 和递增的 Android `versionCode`。这些仅用于测试的改动不得提交。

示例：从要测试的提交创建一个短路径工作树。

```powershell
git worktree add --detach C:\a <commit>
Set-Location C:\a
```

## 构建步骤

1. 安装锁定依赖。`postinstall` 会自动应用本项目需要的 React Native 兼容补丁。

   ```powershell
   npm ci --no-audit --no-fund
   ```

2. 在该临时工作树中更新 `package.json` 的 `version`，并在 `android/app/build.gradle` 中将 `appVersionCode` 递增。例如：`0.1.0-test.1` 和 `400035`。随后生成此次构建信息：

   ```powershell
   node scripts/generate-build-info.js
   ```

3. 配置 Android SDK 环境变量并只构建 arm64。`-PreactNativeArchitectures=arm64-v8a` 会限制 React Native 的原生依赖；`--max-workers=1` 避免 Windows 下多个 CMake/Ninja 任务同时重写生成文件。

   ```powershell
   $env:ANDROID_HOME = 'C:\Users\<username>\AppData\Local\Android\Sdk'
   $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
   Set-Location .\android
   .\gradlew.bat :app:assembleRelease `
     -PbuildAbi=arm64-v8a `
     -PreactNativeArchitectures=arm64-v8a `
     --max-workers=1 `
     --no-configuration-cache `
     --no-daemon `
     --console=plain
   ```

4. APK 位于：

   ```text
   android/app/build/outputs/apk/release/Audiora-v<version>-arm64-v8a-release.apk
   ```

5. 测试完成后，用临时工作树中原有的值恢复 `package.json`、`android/app/build.gradle` 和 `src/constants/buildInfo.ts`。不要提交版本号、构建时间或任何 Gradle 产物。

## APK 验证

构建成功后，验证实际 APK，而不是只检查 Gradle 的成功日志。将 `$apk` 替换为生成的 APK 路径。

```powershell
$apk = 'C:\a\android\app\build\outputs\apk\release\Audiora-v<version>-arm64-v8a-release.apk'
$aapt = "$env:ANDROID_HOME\build-tools\36.0.0\aapt.exe"
$apksigner = "$env:ANDROID_HOME\build-tools\36.0.0\apksigner.bat"

& $aapt dump badging $apk
& $aapt list $apk | Select-String '^lib/'
& $aapt dump resources $apk | Select-String 'network_security_config'
& $aapt dump xmltree $apk AndroidManifest.xml | Select-String 'networkSecurityConfig'
& $apksigner verify --verbose --print-certs $apk
Get-FileHash -LiteralPath $apk -Algorithm SHA256
```

至少记录并报告：APK 绝对路径、`applicationId`、`versionName`、`versionCode`、ABI、SHA-256、签名类型，以及是否有真机/模拟器验证。使用默认 `debug.keystore` 时，Release APK 是测试签名；若设备已有不同签名的同包名应用，应先卸载旧应用再安装。

## 常见问题

### `ninja: error: manifest 'build.ninja' still dirty after 100 tries`

不要在原工作树反复执行 `clean`；该操作也可能触发损坏的原生缓存。改用全新的短路径工作树，重新执行 `npm ci`，并使用上面的单 ABI、单 worker 命令。若工作目录或磁盘启用了 EFS 加密，请换到未加密的目录后重建。

### Android SDK 包目录不一致

若构建前出现 Android SDK package location 不一致的提示，先在 Android Studio SDK Manager 或 `sdkmanager` 中修复/重新安装对应的平台与 Build Tools，再构建。不要将 SDK 目录的临时重命名结果提交到仓库。
