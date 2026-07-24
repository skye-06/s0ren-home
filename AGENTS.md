# S0ren 个人主页

基于 Fuwari 的 Astro 5 纯静态个人主页，生产域名为 `https://aisoren.top/`

## 运行与验证

- 安装：`pnpm install --frozen-lockfile`
- 开发：`pnpm dev`
- 类型检查：`pnpm check`
- 完整构建与 Pagefind 索引：`pnpm build`

## 结构

- `src/content/posts/`：文章 Markdown
- `src/content/spec/about.md`：关于页
- `src/data/site-content.json`：项目与 PDF 文档数据
- `public/documents/`：公开 PDF 文件
- `src/layouts/MainGridLayout.astro`：共享页面主体与 Pagefind 索引边界
- `dist/`：生成产物，不手工编辑

## 约定

- 保持纯静态站点，不添加数据库、登录或上传后台
- 页面内容进入共享 `<main data-pagefind-body>`，局部内容不要重复声明索引主体
- 搜索索引由 `pnpm build` 生成，不手工修改 `dist/pagefind/`
- 样式优先复用现有 Tailwind 与 CSS 变量，不引入新的 UI 依赖
- 通过相邻 `s0ren-editor` 发布时，新增可发布源码路径需同步加入其 `homePublishPaths`
- 提交前至少运行 `pnpm check` 与 `pnpm build`
