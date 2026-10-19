# Changelog

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
