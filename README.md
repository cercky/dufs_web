# Dufs Web

一个现代化的 Web 文件服务器前端界面，提供直观、高效的文件管理和上传下载体验。

## ⚠️ 免责声明

**重要提示：**

- 本程序完全由 AI 编写，作者不具备编程知识
- 对于代码的安全性、稳定性不做任何保障
- 使用者需要根据自身情况评估后选择使用，并承担使用风险
- 代码公开遵循 MIT 开源协议
- 目前版本开发基于 [dufs](https://github.com/sigoden/dufs) v0.45.0 版本
- 如有功能更改需求或好的建议，作者会尽量处理，但不保证时效性
- 请使用者酌情使用，谨慎部署到生产环境

**使用建议：**
- 建议在内部网络或受信任环境中使用
- 不建议直接暴露在公网环境
- 使用前请做好数据备份
- 生产环境使用前请务必进行安全审计

---

## 📖 简介

Dufs Web 是一个功能丰富的文件服务器**Web 前端**解决方案，采用原生 JavaScript 开发，无需任何框架依赖。它提供了类似云盘的文件管理体验，支持文件上传、下载、预览、编辑等多种功能。

![界面预览](images/image1.png)

## ✨ 核心特性

### 🎯 文件管理
- **双视图模式**：支持列表视图和网格视图切换，满足不同使用习惯
- **智能排序**：支持按文件名、修改时间、大小排序，升序/降序自由切换
- **批量操作**：支持多选文件进行批量删除、批量下载
- **拖拽选择**：列表视图支持鼠标拖拽快速选择多个文件
- **快捷键支持**：支持 Ctrl/Shift + 点击进行连续选择
- **右键上下文菜单**：右键文件快速访问下载、移动、删除、编辑等操作

### 📤 文件上传
- **拖拽上传**：支持拖拽文件和文件夹到页面进行上传
- **断点续传**：支持上传任务中断后恢复续传
- **并发控制**：智能控制同时上传的任务数量（默认 3 个）
- **实时进度**：悬浮面板实时显示上传进度、速度、剩余时间
- **文件验证**：恢复上传时验证文件名称和大小，确保文件一致性
- **自动重试**：上传失败支持手动重试
- **任务管理**：支持清理已完成/失败的上传任务

### 📥 文件下载
- **单文件下载**：支持单个文件直接下载
- **批量打包下载**：支持多选文件打包成 ZIP 下载
- **流式下载**：使用 ReadableStream 实现流式下载，实时显示进度
- **智能降级**：超过大小限制时自动降级为逐个下载
- **Token 认证下载**：登录用户支持带 Token 的安全下载
- **目录打包**：支持将整个目录打包下载

### 📝 文件预览与编辑
- **在线编辑器**：支持多种文本格式文件的在线编辑
  - 代码文件：`.js`, `.ts`, `.jsx`, `.tsx`, `.vue`, `.py`, `.java`, `.c`, `.cpp` 等
  - 配置文件：`.json`, `.yaml`, `.yml`, `.xml`, `.ini`, `.conf`, `.toml` 等
  - 文档文件：`.txt`, `.md`, `.markdown`, `.html`, `.css`, `.scss` 等
- **文件预览**：支持多种格式文件的浏览器预览
  - 图片：`.jpg`, `.png`, `.gif`, `.bmp`, `.svg`, `.webp` 等
  - 视频：`.mp4`, `.mov`, `.avi`, `.wmv`, `.flv`, `.webm` 等
  - 音频：`.mp3`, `.ogg`, `.wav`, `.m4a` 等
  - 文档：`.pdf` 等
- **保存提示**：编辑内容未保存时关闭页面会提示确认

### 🔐 用户认证
- **登录/登出**：支持用户登录和登出功能
- **权限控制**：根据用户权限显示/隐藏相应功能按钮
- **安全下载**：登录用户下载文件时自动添加 Token 认证

### 🌍 国际化
- **多语言支持**：
  - 🇨🇳 简体中文
  - 🇺🇸 English
- **自动检测**：自动检测系统语言并应用
- **持久化**：语言设置保存在 localStorage
- **实时切换**：切换语言后即时更新界面文本

![文件管理](images/image2.png)

### 🎨 用户体验
- **响应式设计**：适配桌面和移动设备
- **智能滚动条**：根据内容自动显示/隐藏滚动条
- **面包屑导航**：清晰展示当前路径，支持点击跳转
- **Toast 提示**：操作结果实时反馈
- **模态对话框**：确认、输入、提示等标准化交互
- **文件计数**：实时显示当前目录下文件和文件夹数量
- **空状态提示**：空文件夹或无搜索结果时显示友好提示

### 🛡️ 安全性
- **文件名验证**：防止路径遍历攻击
  - 禁止 `/`、`\` 路径分隔符
  - 禁止 `..` 路径遍历
  - 禁止控制字符
  - 禁止 Windows 保留名称（CON、PRN、AUX 等）
- **XSS 防护**：所有用户输入都进行 HTML 实体编码
- **页面卸载保护**：有未保存内容或活跃任务时提示确认

![上传下载](images/image3.png)

## 🚀 快速开始

### 前置要求

- 现代浏览器（Chrome、Firefox、Edge、Safari 等）
- 后端服务器支持（需提供相应的 API 接口）

### 文件结构

```
assets/
├── index.html      # 主页面
├── app.js          # 主应用逻辑
├── utils.js        # 工具函数和常量
├── auth.js         # 认证工具
├── i18n.js         # 国际化配置
├── uploader.js     # 上传管理器
├── jszip.min.js    # JSZip 库（用于打包下载）
├── base.css        # 基础样式
└── components.css  # 组件样式
```

### 集成步骤

1. **引入必要文件**

在 HTML 中引入 CSS 和 JS 文件：

```html
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/components.css">
```

```html
<script src="assets/jszip.min.js"></script>
<script src="assets/i18n.js"></script>
<script src="assets/utils.js"></script>
<script src="assets/auth.js"></script>
<script src="assets/uploader.js"></script>
<script src="assets/app.js"></script>
```

2. **配置后端 API**

后端需要提供以下 API 接口：

- `GET /path?json` - 获取目录内容（JSON 格式）
- `GET /path?zip` - 下载目录压缩包
- `GET /path?tokengen` - 生成下载 Token
- `PUT /path` - 上传/创建文件
- `DELETE /path` - 删除文件/目录
- `MKCOL /path` - 创建目录
- `MOVE /path` - 移动/重命名文件（需 Destination 头）
- `CHECKAUTH /path` - 检查认证状态
- `LOGOUT /path` - 退出登录

3. **数据格式**

后端返回的 JSON 数据格式：

```json
{
  "href": "/path/to/dir",
  "uri_prefix": "/",
  "kind": "Index",
  "dir_exists": true,
  "allow_archive": true,
  "allow_upload": true,
  "allow_delete": true,
  "allow_search": true,
  "user": "username",
  "paths": [
    {
      "name": "file.txt",
      "path_type": "File",
      "mtime": 1234567890,
      "size": 1024
    }
  ]
}
```

## 📋 配置说明

### 上传配置

```javascript
// 最大同时上传数
const DUFS_MAX_UPLOADINGS = 3;

// 最大子路径数（目录大小显示上限）
const MAX_SUBPATHS_COUNT = 1000;
```

### 批量下载配置

```javascript
// 合并下载最大文件大小（MB）
const _maxDownloadSize = 200;
```

### 支持的文件格式

**可编辑格式**（EDITOR_FORMATS）：
- 文本文件：`.txt`, `.md`, `.markdown`
- 代码文件：`.js`, `.ts`, `.jsx`, `.tsx`, `.vue`, `.py`, `.java`, `.c`, `.cpp`, `.h`, `.hpp`, `.cs`, `.php`, `.go`, `.rs`, `.swift`, `.kt`, `.rb`
- 配置文件：`.json`, `.yaml`, `.yml`, `.xml`, `.html`, `.htm`, `.css`, `.scss`, `.less`, `.ini`, `.conf`, `.cfg`, `.env`, `.toml`, `.sql`
- 其他：`.log`, `.csv`, `.gitignore`, `.dockerignore`

**预览格式**（IFRAME_FORMATS）：
- 图片：`.pdf`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.svg`
- 视频：`.mp4`, `.mov`, `.avi`, `.wmv`, `.flv`, `.webm`
- 音频：`.mp3`, `.ogg`, `.wav`, `.m4a`

## 🎯 使用指南

### 文件上传

1. 点击工具栏「上传」按钮，或拖拽文件/文件夹到页面
2. 上传面板自动打开，显示上传进度
3. 支持暂停、重试、取消操作
4. 上传中断后再次访问会提示恢复上传

### 批量操作

**列表视图**：
- 点击复选框选择单个文件
- 拖动鼠标批量选择
- Ctrl + 点击切换选择
- Shift + 点击连续选择

**网格视图**：
- 长按文件进入选择模式
- 点击文件切换选择状态
- 点击「退出选择」退出选择模式

**批量操作**：
- 选择文件后底部出现批量操作栏
- 点击「下载」打包选中文件
- 点击「删除」批量删除选中文件

### 文件编辑

1. 点击可编辑文件的「编辑」按钮
2. 在编辑器中修改内容
3. 点击「保存」按钮保存更改
4. 支持移动/重命名和删除操作

### 文件预览

- 点击图片、视频、音频、PDF 等文件直接预览
- 使用浏览器内置查看器显示

### 搜索功能

1. 在顶部搜索框输入关键词
2. 自动搜索当前目录及子目录
3. 搜索结果以列表形式展示

## 🔧 API 参考

### 工具函数

**URL 工具**：
- `baseUrl()` - 获取当前基础 URL
- `newUrl(name)` - 构建新文件/目录的 URL
- `baseName(url)` - 从 URL 提取文件名
- `extName(filename)` - 获取文件扩展名

**格式化工具**：
- `formatMtime(mtime)` - 格式化修改时间
- `formatDirSize(size)` - 格式化目录大小
- `formatFileSize(size)` - 格式化文件大小
- `formatDuration(seconds)` - 格式化时长
- `formatSpeed(speed)` - 格式化速度

**文件图标**：
- `getFileIcon(filename, path_type)` - 获取文件图标 SVG

**验证工具**：
- `validateFileName(filename)` - 验证文件名安全性

### 认证函数

- `fetchWithAuth(url, options)` - 带认证的 fetch 封装
- `showLogoutModal()` - 显示退出登录模态框
- `hideLogoutModal()` - 隐藏退出登录模态框

### 国际化

- `t(key, ...args)` - 翻译函数
- `setLanguage(lang)` - 设置当前语言
- `loadLanguage()` - 加载保存的语言设置
- `updateTranslations()` - 更新页面翻译

## 🎨 自定义

### 主题定制

通过修改 CSS 变量来自定义主题：

```css
:root {
  --primary-color: #2563eb;
  --danger-color: #dc2626;
  --success-color: #16a34a;
  /* ... 更多变量请参考 base.css */
}
```

### 语言扩展

在 `i18n.js` 中添加新的语言配置：

```javascript
const I18N = {
  'zh-CN': { /* ... */ },
  'en-US': { /* ... */ },
  'ja-JP': {
    // 添加日语翻译
    searchPlaceholder: 'ファイルやフォルダを検索...',
    // ... 其他翻译
  }
};
```

### 图标定制

在 `utils.js` 中修改图标映射：

```javascript
const _EXT_LABEL = {
  '.jpg': 'JPG',
  '.png': 'PNG',
  // 添加或修改扩展名标签
};

const _EXT_COLOR = {
  '.jpg': '#FF6B6B',
  '.png': '#4ECDC4',
  // 添加或修改扩展名颜色
};
```

## 🐛 常见问题

### 1. 上传失败

**原因**：可能是网络问题或服务器限制

**解决**：
- 检查网络连接
- 确认服务器配置（文件大小限制、超时设置等）
- 尝试重新上传

### 2. 批量下载失败

**原因**：文件过大或包含目录

**解决**：
- 减少选择的文件数量
- 调整 `_maxDownloadSize` 配置
- 使用逐个下载模式

### 3. 编辑器无法打开文件

**原因**：文件格式不支持或文件过大

**解决**：
- 检查文件扩展名是否在 `EDITOR_FORMATS` 列表中
- 确认文件大小适合在线编辑

### 4. 语言切换无效

**原因**：浏览器缓存或 localStorage 问题

**解决**：
- 清除浏览器缓存
- 清除 localStorage 后重试

## 📝 更新日志

### v1.0.0
- ✨ 初始版本发布
- 🎯 支持文件上传、下载、预览、编辑
- 🌍 支持中英文双语
- 📱 响应式设计，支持移动设备
- 🔐 用户认证和权限控制
- 📦 批量操作和打包下载

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请通过 Issue 联系我们。

---

**Dufs Web** - 简单、高效、现代化的文件服务器 Web 前端解决方案
