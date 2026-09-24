# 月光里的中秋祝福

一个可静态部署的中秋主题节日贺卡引擎。首版包含四屏叙事、Canvas 星尘粒子、灯笼互动、个性化文案、声音反馈和 URL 分享。

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

构建产物在 `dist/`，可以直接交给静态托管平台。

## 分享参数

贺卡通过 URL 参数携带个性化内容，不需要后端：

```text
?theme=midautumn&to=明月&msg=中秋快乐&from=小明
```

在手机浏览器中点击“分享卡片”会优先调用系统分享面板，并把祝福卡片生成为 PNG 图片发送出去；支持文件分享的应用会直接显示卡片预览。卡片里的祝福入口仍会随分享内容带出，收卡人打开后会先看到祝福，再点击“我也做一张”制作自己的卡片。

## 结构

- `src/config/theme.ts`：主题、文案、调色板和粒子预设配置
- `src/components/ParticleField.tsx`：Canvas 环境粒子与交互爆发
- `src/App.tsx`：四屏状态机、交互、个性化和分享降级逻辑
- `src/styles.css`：现代东方电影感视觉系统和响应式布局

后续增加春节或生日主题时，优先新增主题配置和素材，不改动运行时流程。
