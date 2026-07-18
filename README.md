# S0ren 个人主页

基于 [Fuwari](https://github.com/saicaca/fuwari) 的纯静态个人网站。保留原主题的卡片布局、明暗模式、响应式设计、Pagefind 搜索与轻量动画，不包含数据库、后端、登录或上传功能。

## 本地运行

需要 Node.js 22 和 pnpm。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

访问 `http://localhost:4321`。提交前可执行：

```bash
pnpm check
pnpm build
```

构建结果位于 `dist/`。

## 内容维护

- 文章：在 `src/content/posts/` 新建 Markdown 文件。
- 项目页：编辑 `src/pages/projects.astro`。
- 关于页：编辑 `src/content/spec/about.md`。
- 站点导航、GitHub 与知识库地址：编辑 `src/config.ts` 中的 `siteLinks`。
- 主站 canonical 地址：编辑 `astro.config.mjs` 中的 `site`。

## 添加 PDF

1. 将 PDF 放入 `public/documents/` 下对应分类目录。
2. 在 `src/data/documents.ts` 增加一条文档信息。
3. Word 文档请先在本地导出为 PDF；本站不提供上传或在线转换后台。

## EdgeOne Makers

从 GitHub 导入本仓库，生产分支选 `main`。仓库中的 `edgeone.json` 已配置：

- Node.js：`22.11.0`
- 安装命令：`pnpm install --frozen-lockfile`
- 构建命令：`pnpm build`
- 输出目录：`dist`

当前项目域名为 `https://s0ren-home-xk8rcnfv.edgeone.cool/`，知识库链接与
canonical 地址已经回填。当前加速区域包含中国大陆；按 Makers 的默认域名策略，
控制台生成的预览链接有效期为 3 小时，长期公开访问需绑定自定义域名。

## 许可

上游 Fuwari 使用 MIT License，本仓库保留其许可证与署名。
