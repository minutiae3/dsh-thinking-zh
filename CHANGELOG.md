# Changelog

## 0.2.1 — 2026-10-19

### Added

- 配置项 `replyLanguage`（`auto` / `zh-CN` / `zh-TW`）：可单独约束最终回复语言，默认跟随用户。
- 配置项 `thinkingLanguage`：`language` 的正式替代字段，语义不变。
- `/thinking-zh` 命令支持会话级切换：`on` / `off` / `zh-CN` / `zh-TW` / `strict` / `prefer` / `reply ...` / `reset`。
- 会话级覆盖使用 agent 作用域段落，会话结束自动清理，不改全局配置。
- README 增加“与同类插件的区别”对比表。

### Changed

- 思考段落中“最终回复仍使用用户要求语言”的表述会随 `replyLanguage` 调整，避免与回复段落冲突。
- 日志摘要改为 `思考：… / 回复：… / …模式`。
- 冒烟测试从 9 个扩展到 16 个，覆盖回复语言与会话命令。

### Deprecated

- `language` 字段仍兼容，等价于 `thinkingLanguage`；启动时会提示弃用。

### Unchanged

- 段落名、`order=6000` 与默认行为（简体中文思考、回复跟随用户）保持不变。
- 配置固定时提示词完全稳定，不会在请求之间抖动。

## 0.2.0 — 2026-10-19

### Added

- 配置项 `language`（`zh-CN` / `zh-TW`）与 `mode`（`strict` / `prefer`）。
- 零依赖 Standard Schema 配置校验：非法值自动回退默认并记录警告，不阻止 DSH 启动。
- 启动日志：启用、关闭、失败三种状态均有明确提示。
- `/thinking-zh` 状态命令（无命令服务时自动跳过，不影响提示词）。
- `test/smoke.mjs` 冒烟测试（9 个用例）。
- `CHANGELOG.md`。

### Changed

- 提示词文本按配置渲染；默认行为与 0.1.0 保持一致。
- README 增加 30 秒上手、配置表、状态命令与 FAQ。

### Unchanged

- 段落名 `dsh-thinking-zh:reasoning-language` 与 `order=6000` 保持不变。
- 配置固定时提示词完全稳定，不会在请求之间抖动。

## 0.1.0 — 2026-10-18

- 首次发布：注册简体中文思考提示词段落。
