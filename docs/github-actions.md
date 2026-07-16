# GitHub Actions 使用说明

当前仓库已经包含两套工作流：

- `CI`：安装依赖、校验 Expo 配置、检查前后端类型和 lint、构建服务端、导出 Expo Web 产物
- `Mobile Build`：通过 GitHub Actions 触发 EAS 云构建，避免本地安装 Android Studio / Xcode

## 上传前准备

1. 创建 GitHub 仓库并推送整个项目
2. 打开 `Settings -> Secrets and variables -> Actions`
3. 添加必需的 Secret：

| 类型 | 名称 | 是否必需 | 作用 |
| --- | --- | --- | --- |
| Secret | `EXPO_TOKEN` | 是 | 让 GitHub Actions 可以登录你的 Expo 账号 |

4. 添加建议配置的 Variables：

| 类型 | 名称 | 是否建议 | 作用 |
| --- | --- | --- | --- |
| Variable | `EXPO_PUBLIC_BACKEND_BASE_URL` | 可选 | Expo 应用在构建时使用的后端地址 |
| Variable | `EXPO_PUBLIC_COZE_PROJECT_ID` | 可选 | 当前项目 id，会影响 slug/package 命名 |
| Variable | `COZE_PROJECT_NAME` | 可选 | App 显示名称覆盖值 |
| Variable | `EXPO_OWNER` | 建议 | Expo 账号 owner，首次 EAS 构建时尤其有用 |
| Variable | `EXPO_EAS_PROJECT_ID` | 建议 | 已关联的 EAS project id，首次非交互构建强烈建议填写 |

## 如何使用

### CI

- 推送到 `main` 或 `master` 时自动触发
- 创建 Pull Request 时自动触发
- 也可以在 GitHub Actions 页面手动触发

`CI` 产物：

- `server-dist`
- `expo-web-dist`

### Mobile Build

1. 打开 `Actions -> Mobile Build`
2. 点击 `Run workflow`
3. 选择：
   - `platform`：`android`、`ios` 或 `all`
   - `profile`：`preview` 或 `production`

构建行为：

- `preview` 使用 `client/eas.json` 里的预览配置
- `preview` 下 Android 会产出 `apk`，适合最先验证是否能装机
- `production` 使用发布配置，适合后续正式发版

## 首次 EAS 构建说明

Expo 官方建议在 CI 触发非交互构建前，先完成一次 EAS 项目初始化，否则第一次云构建可能因为缺少项目关联信息而失败。

如果你完全不想在本地装原生环境，最稳妥的做法是：

1. 注册并登录 Expo 账号
2. 在 Expo/EAS 中先创建或关联项目
3. 把 `EXPO_OWNER` 和 `EXPO_EAS_PROJECT_ID` 填到 GitHub Variables
4. 再运行 `Mobile Build`

项目里的 `client/app.config.ts` 已支持从环境变量读取：

- `EXPO_OWNER`
- `EXPO_EAS_PROJECT_ID`

这能让 GitHub Actions 更容易直接完成云端打包。

## 重要提示

- Android 通常最容易先跑通
- iOS 一般还需要你在 Expo/EAS 侧准备 Apple Developer 相关凭据
- `Mobile Build` 使用了 `--wait`，所以 GitHub Actions 会等待 EAS 构建完成并在日志里显示结果
- 如果你想先验证整条链路，优先选择 `platform=android` 且 `profile=preview`
