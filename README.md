# Expo App + Express.js

## GitHub Actions

GitHub Actions workflows and EAS mobile build configurations have been added. They can be used immediately after pushing to GitHub.

- Documentation: `docs/github-actions.md`
- CI Workflow: `.github/workflows/ci.yml`
- Mobile Build Workflow: `.github/workflows/mobile-build.yml`
- EAS Config: `client/eas.json`

## Directory Structure Standards (Strictly Enforced)

This repository is a monorepo based on pnpm workspaces.

- Expo code resides in the `client` directory; Express.js code resides in the `server` directory.
- This template defaults to **no Tab Bar**, but can be modified as needed.

```
├── client/                     # React Native frontend code
│   ├── app/                    # Expo Router directory (routing config only)
│   │   ├── _layout.tsx         # Root layout file (required, must read)
│   │   └── index.tsx           # Home page
│   ├── screens/                # Page implementation directory (maps to app/ routes)
│   │   └── demo/               # Example screen
│   │       └── index.tsx
│   ├── components/             # Reusable components
│   │   └── Screen.tsx          # Screen container component (mandatory usage)
│   ├── hooks/                  # Custom Hooks
│   ├── contexts/               # React Context code
│   ├── utils/                  # Utility functions
│   ├── assets/                 # Static assets
│   └── package.json            # Expo app package.json
├── server/                     # Backend code root (Express.js)
│   ├── src/
│   │   └── index.ts            # Server entry point
│   └── package.json            # Server package.json
├── package.json
├── .cozeproj                   # Preset scaffolding scripts (Do Not Modify)
└── .coze                       # Configuration file (Do Not Modify)
```

## Styling Solution

Styling is developed using **tailwindcss** (underlying engine: Uniwind).

Example usage:

```tsx
<View className="flex-1 bg-white dark:bg-gray-900 p-4"></View>
```

```tsx
<Text
  className="text-lg font-bold text-gray-900 dark:text-white"
  selectionColorClassName="accent-blue-500"
>
  Hello World
</Text>
```

Uniwind Official Docs: https://docs.uniwind.dev/llms.txt

## How to Run Static Checks (TSC + ESLint)

```bash
# Lint both client and server directories
pnpm -w lint:all

# Lint client directory only
pnpm -w lint:client

# Lint server directory only
pnpm -w lint:server
```

## How to Modify Theme Mode (System, Dark, Light)

Default mode is **system**. If a user explicitly selects "Dark" or "Light," modify the `DEFAULT_THEME` variable in `client/components/ColorSchemeUpdater.tsx` to the appropriate value.

## How to Customize Design Tokens

The project's **Design System** is implemented via tailwindcss. The core entry file is `client/global.css`. To customize the theme, you should **read and modify the `client/global.css` file**.

## Routing & Tab Bar Implementation Standards

### Option 1: No Tab Bar (Stack Navigation)

Suitable for linear-flow applications. Uses a simplified directory structure:

```
client/app/
├── _layout.tsx         # Root layout (Stack navigation config)
├── index.tsx           # App entry
├── detail.tsx          # Detail page (pass data via params)
└── +not-found.tsx      # 404 page
```

**Root Layout Config** `client/app/_layout.tsx`:

*Code snippet for reference only*

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="index" />
  <Stack.Screen name="detail" />
</Stack>
```

**App Entry** `client/app/index.tsx`:
```tsx
export { default } from "@/screens/home";
```
> **Prohibited**: Do not create a `(tabs)` directory in scenarios without a Tab Bar.

### Option 2: With Tab Bar (Tabs Navigation)

Uses route grouping to implement a bottom tab bar:
```
client/app/
├── _layout.tsx              # Root layout
├── (tabs)/
│   ├── _layout.tsx          # Tab navigation configuration
│   ├── index.tsx            # Default Tab (must exist)
│   ├── discover.tsx         # Discover page
│   └── profile.tsx          # Profile page
├── detail.tsx               # Standalone page outside tabs (pass data via params)
└── +not-found.tsx
```
> **⚠️ [CRITICAL]**: `app/index.tsx` has higher priority than `(tabs)/index.tsx`, which will cause the home page to render without the Tab Bar. **When `(tabs)/index.tsx` exists, you MUST delete `app/index.tsx`**.

**Root Layout Config** `client/app/_layout.tsx`:

*Code snippet for reference only*

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="detail" />
</Stack>
```

**App Entry** `client/app/(tabs)/index.tsx`:
```tsx
export { default } from "@/screens/home";
```

**Tab Layout Config** `client/app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [background, muted, accent, border] = useCSSVariable([
    '--color-background',
    '--color-muted',
    '--color-accent',
    '--color-border',
  ]) as string[];

  let tabBarStyle = {
    backgroundColor: background,
    borderTopWidth: 1,
    borderTopColor: border,
  };

  // Fix abnormal height issues on Web (this logic is mandatory)
  if (Platform.OS === 'web') {
    tabBarStyle = {
      ...tabBarStyle,
      height: 'auto',
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted,
      }}
    >
      {/* Name must match filename exactly */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="compass" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**Tab Page File** `client/app/(tabs)/index.tsx`:
```tsx
export { default } from "@/screens/home";
```

### Notes

Before modifying `client/app/_layout.tsx`, you must read the file first.

The following logic must be preserved:
- Keep the `global.css` import (crucial for tailwindcss).
- Keep the `Provider` usage.

## Dependency Management & Module Import Standards

### Dependency Installation
**Do not** use `npm` or `yarn`. Use specific commands based on the directory:

| Directory | Command | Description |
|------|----------|------|
| `client/` | `npx expo install <package>` | Expo auto-selects versions compatible with the SDK |
| `server/` | `pnpm add <package>` | Use pnpm for backend dependency management |

```bash
# client directory (Expo project)
cd client && npx expo install expo-camera expo-image-picker

# server directory (Express project)
cd server && pnpm add axios cors
```

**Network Issues**: `npx expo install` may fail due to network conditions. Retry up to 2 times. If it still fails, fall back to `pnpm add`.

## Expo Development Standards

### Path Aliases

Expo is configured with an `@/` path alias pointing to the `client/` directory:

```tsx
// Correct
import { Screen } from '@/components/Screen';

// Avoid relative paths
import { Screen } from '../../../components/Screen';
```

## Local Development

`coze dev`: Used for the initial startup of both frontend and backend services. It can also be used to restart them (the command attempts to kill processes occupying the ports before starting the services).

# Expo App + Express.js

## GitHub Actions

已添加 GitHub Actions 工作流与 EAS 移动端构建配置，上传到 GitHub 后可直接使用。

- 说明文档：`docs/github-actions.md`
- CI 工作流：`.github/workflows/ci.yml`
- 移动端构建工作流：`.github/workflows/mobile-build.yml`
- EAS 配置：`client/eas.json`

## 目录结构规范（严格遵循）

当前仓库是一个 monorepo（基于 pnpm 的 workspace）

- Expo 代码在 client 目录，Express.js 代码在 server 目录
- 本模板默认无 Tab Bar，可按需改造

├── client/                     # React Native 前端代码
│   ├── app/                    # Expo Router 路由目录（仅路由配置）
│   │   ├── _layout.tsx         # 根布局文件（必需，务必阅读）
│   │   └── index.tsx           # 首页
│   ├── screens/                # 页面实现目录（与 app/ 路由对应）
│   │   └── demo/               # 示例页面
│   │       └── index.tsx
│   ├── components/             # 可复用组件
│   │   └── Screen.tsx          # 页面容器组件（必用）
│   ├── hooks/                  # 自定义 Hooks
│   ├── contexts/               # React Context 代码
│   ├── utils/                  # 工具函数
│   ├── assets/                 # 静态资源
|   └── package.json            # Expo 应用 package.json
├── server/                     # 服务端代码根目录 (Express.js)
|   ├── src/
│   │   └── index.ts            # 服务端入口文件
|   └── package.json            # 服务端 package.json
├── package.json
├── .cozeproj                   # 预置脚手架脚本（禁止修改）
└── .coze                       # 配置文件（禁止修改）

## 样式方案

基于 tailwindcss 进行样式开发（底层基于 Uniwind）

写法示例：

```tsx
<View className="flex-1 bg-white dark:bg-gray-900 p-4"></View>
```

```tsx
<Text
  className="text-lg font-bold text-gray-900 dark:text-white"
  selectionColorClassName="accent-blue-500"
>
  Hello World
</Text>
```

Uniwind 官方文档：https://docs.uniwind.dev/llms.txt

## 如何进行静态校验（TSC + ESLint）

```bash
# 对 client 和 server 目录同时进行校验
pnpm -w lint:all

# 对 client 目录进行校验
pnpm -w lint:client

# 对 server 目录进行校验
pnpm -w lint:server
```

## 如何修改主题模式（跟随系统、固定暗色、固定亮色）

默认为跟随系统，如果用户明确指定为“暗色”或“亮色”，需要修改 `client/components/ColorSchemeUpdater.tsx` 的 `DEFAULT_THEME` 变量为合适的值

## 如何定制主题 design tokens

当前项目的**设计系统**基于 tailwindcss 实现，核心入口文件为 `client/global.css`，如果需要定制主题，应该**阅读并修改 `client/global.css` 文件**

## 路由及 Tab Bar 实现规范

### 方案一：无 Tab Bar（Stack 导航）

适用于线性流程应用，采用简化的目录结构：

```
client/app/
├── _layout.tsx         # 根布局（Stack 导航配置）
├── index.tsx           # 应用入口
├── detail.tsx          # 详情页（通过 params 传递数据）
└── +not-found.tsx      # 404 页面
```

**根布局配置** `client/app/_layout.tsx`：

以下仅为代码片段供写法参考

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="index" />
  <Stack.Screen name="detail" />
</Stack>
```

**应用入口** `client/app/index.tsx`：
```tsx
export { default } from "@/screens/home";
```
> **禁止事项**：无 Tab Bar 场景下，不得创建 `(tabs)` 目录。

### 方案二：有 Tab Bar（Tabs 导航）

采用路由分组实现底部导航栏：
```
client/app/
├── _layout.tsx              # 根布局
├── (tabs)/
│   ├── _layout.tsx          # Tab 导航配置
│   ├── index.tsx            # 默认 Tab（必须存在）
│   ├── discover.tsx         # 发现页
│   └── profile.tsx          # 个人中心
├── detail.tsx               # Tab 外的独立页面（通过 params 传递数据）
└── +not-found.tsx
```
> **⚠️ [CRITICAL]**： `app/index.tsx` 优先级高于 `(tabs)/index.tsx`，会导致首页无 Tab Bar。**当有(tabs)/index.tsx时必须删除 `app/index.tsx`**。

**根布局配置** `client/app/_layout.tsx`：

以下仅为代码片段供写法参考

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="detail" />
</Stack>
```

**应用入口** `client/app/(tabs)/index.tsx`：
```tsx
export { default } from "@/screens/home";
```

**Tab 布局配置** `client/app/(tabs)/_layout.tsx`：

```tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [background, muted, accent, border] = useCSSVariable([
    '--color-background',
    '--color-muted',
    '--color-accent',
    '--color-border',
  ]) as string[];

  let tabBarStyle = {
    backgroundColor: background,
    borderTopWidth: 1,
    borderTopColor: border,
  };

  // 用于修复 Web 上高度异常的问题（这个 if 逻辑必须添加）
  if (Platform.OS === 'web') {
    tabBarStyle = {
      ...tabBarStyle,
      height: 'auto',
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted,
      }}
    >
      {/* name 必须与文件名完全一致 */}
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: '发现',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="compass" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**Tab 页面文件** `client/app/(tabs)/index.tsx`：
```tsx
export { default } from "@/screens/home";
```

### 注意事项

在改动 `client/app/_layout.tsx` 前，必须先阅读该文件，再进行修改操作

以下是需要保留的重要逻辑

- 保留 global.css 引入（tailwindcss 生效的关键）
- 保留 Provider 的使用

## 依赖管理与模块导入规范

### 依赖安装
**禁止**使用 `npm` 或 `yarn`，按目录区分安装命令：

| 目录 | 安装命令 | 说明 |
|------|----------|------|
| `client/` | `npx expo install <package>` | Expo 会自动选择与 SDK 兼容的版本 |
| `server/` | `pnpm add <package>` | 使用 pnpm 管理后端依赖 |

```bash
# client 目录（Expo 项目）
cd client && npx expo install expo-camera expo-image-picker

# server 目录（Express 项目）
cd server && pnpm add axios cors
```

**网络问题处理**：`npx expo install` 可能因网络原因失败，失败时重试 2 次，仍失败则改用 `pnpm add` 安装

## Expo 开发规范

### 路径别名

Expo 配置了 `@/` 路径别名指向 `client/` 目录：

```tsx
// 正确
import { Screen } from '@/components/Screen';

// 避免相对路径
import { Screen } from '../../../components/Screen';
```

## 本地开发

`coze dev`：用来首次启动前后端服务，也可以用来重启前后端服务（该命令会先尝试杀掉占用端口的进程，再启动服务）
