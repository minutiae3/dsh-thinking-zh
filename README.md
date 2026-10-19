# dsh-thinking-zh

让 DeepSeek Harness 里模型的**内部思考（reasoning / thinking）使用简体或繁体中文**，并可选择让**最终回复**也使用指定中文。

> 非官方插件，与 DeepSeek 无关。英文说明见 [README.en.md](README.en.md)。

## 30 秒看懂

| 你想做的事 | 怎么做 |
|---|---|
| 装完就能用 | 默认简体中文思考，回复跟随用户，不用配置 |
| 确认已生效 | 日志出现 `已启用 — 思考：简体中文 / 回复：跟随用户` |
| 在对话里查状态或切换 | 输入 `/thinking-zh` |
| 思考换繁体 | `config.thinkingLanguage: zh-TW` |
| 让回复也用中文 | `config.replyLanguage: zh-CN` |
| 放宽要求 | `config.mode: prefer` |
| 关掉 | `config.enabled: false` |

## 它做什么

- **思考段落（始终注册）**：要求模型的内部思考与推理使用简体或繁体中文；
  - 代码、命令、路径、API 名、错误原文、专有名词保持原样；
  - 中文推理不得省略步骤、降低严谨度；
  - 用户明确要求换语言时，以用户要求为准。
- **回复段落（可选注册）**：`replyLanguage` 不是 `auto` 时，要求最终回复使用指定中文；
  - 用户明确要求其他语言时仍然以用户为准。
- 只改提示词，不改 DSH 程序文件、不改 UI、不发网络请求。

## 安装

从 npm：

```powershell
dsh plugin --profile desktop add dsh-thinking-zh
```

从本地 tarball：

```powershell
dsh plugin --profile desktop add "file:C:/path/to/dsh-thinking-zh-0.2.1.tgz"
```

然后确认 profile 的 `package.json` 里 `dsh.profile.bundles` 含 `"dsh-thinking-zh"`，**完全退出并重开 DSH**（包括托盘图标）。

## 配置

四个字段，全部可选。写错只会回退默认并打一条警告，不会让 DSH 启动失败。

```yaml
- id: dsh-thinking-zh
  name: dsh-thinking-zh
  config:
    enabled: true           # 默认 true
    thinkingLanguage: zh-CN # zh-CN | zh-TW
    replyLanguage: auto     # auto | zh-CN | zh-TW
    mode: strict            # strict | prefer
```

| 字段 | 默认 | 可选值 | 说明 |
|---|---|---|---|
| `enabled` | `true` | `true` / `false` | 关闭后不注册任何段落 |
| `thinkingLanguage` | `zh-CN` | `zh-CN` / `zh-TW` | 内部思考语言，繁体同时调整用词 |
| `replyLanguage` | `auto` | `auto` / `zh-CN` / `zh-TW` | `auto` 跟随用户；指定后约束最终回复 |
| `mode` | `strict` | `strict` / `prefer` | `strict` 发现英文思考立即改回；`prefer` 只要求尽量 |

`language` 是 0.2.0 的旧字段，仍然兼容，等价于 `thinkingLanguage`，但会提示弃用。新配置请使用 `thinkingLanguage`。

配置固定时提示词完全稳定，不会在请求之间抖动，也不影响 KV cache。

## 状态命令

在交互式 UI 中：

```text
/thinking-zh                 查看当前状态
/thinking-zh zh-TW           本会话切换为繁体思考
/thinking-zh zh-CN           本会话切换为简体思考
/thinking-zh reply zh-CN     本会话让最终回复使用简体中文
/thinking-zh reply auto      本会话让回复重新跟随用户
/thinking-zh prefer          本会话放宽为 prefer
/thinking-zh strict          本会话切回 strict
/thinking-zh off             本会话关闭
/thinking-zh on              本会话重新启用
/thinking-zh reset           清除本会话所有覆盖
```

这些切换**只影响当前会话**，不改全局配置、不需要重启。底层用 agent 作用域段落遮蔽全局段落，会话结束自动清理。

没有命令服务的环境（如纯 ACP）会自动跳过，不影响提示词。

## 确认生效

日志里出现这一行就说明生效：

```text
dsh-thinking-zh: 已启用 — 思考：简体中文 / 回复：跟随用户 / 严格模式（order=6000）
```

关闭时：

```text
dsh-thinking-zh: 配置中已关闭，未注册提示词段落
```

注册失败时会有带修复建议的警告，例如检查 `cordis.patch.yml` 是否有同名段落。

## 与同类插件的区别

以下是 2026-10 的公开信息，竞品可能已更新。对比对象是 npm 和 GitHub 上定位相近的插件。

| 插件 | 思考语言 | 回复语言 | 简/繁 | 严格/宽松 | 会话级切换 | 零运行时依赖 |
|---|---|---|---|---|---|---|
| **dsh-thinking-zh（本插件）** | ✅ | ✅ 可独立开关 | ✅ | ✅ | ✅ | ✅ |
| `@tirol/dsh-language-set` | ✅ | ✅ 可独立开关 | 仅中/英 | ❌ | ❌（只有全局命令） | ❌ peer 依赖 |
| `@max-null/dsh-chinese-thinking` | ✅ | ✅ 同一条要求 | 仅简中 | ❌ | ❌ | ❌ peer 依赖 |
| `yingjian666/dsh-zh-thinking` | ✅ | ❌ | 仅简中 | ❌ | ❌ | ✅ |
| `dsh-reasoning-cn` | ✅ + 翻译 reasoning | ❌ | 仅简中 | ❌ | ❌ | 未核实 |

本插件的差异点：简/繁双语言、`strict`/`prefer` 强度、思考与回复解耦、会话级切换、零运行时依赖、16 个冒烟测试。

## FAQ

**模型偶尔还是用英文思考？**
提示词只能引导，不能强制。保持 `mode: strict`（默认），或在对话里直接要求“用中文思考”。

**改了配置没生效？**
插件配置在启动时读取，改完需要完全退出并重开 DSH。临时切换请用 `/thinking-zh`。

**`/thinking-zh` 切换会改全局配置吗？**
不会。它只注册当前会话的遮蔽段落，`reset` 或会话结束即恢复全局配置。

**支持繁体吗？**
支持 `zh-TW`，用词会一起调整（程式碼 / 檔案 / 使用者）。

**旧配置 `language` 还能用吗？**
能。它等价于 `thinkingLanguage`，但会提示弃用；建议迁移。

**会不会重复注册？**
段落名带命名空间前缀；同一作用域内重复注册会报错，日志会提示检查 `cordis.patch.yml`。

## 卸载

从 `package.json` 的 `dsh.profile.bundles` 与 `dependencies` 中删掉 `dsh-thinking-zh`，
再执行 `pnpm install`，重启 DSH 即可。它不写入任何用户数据。

## 目录

| 文件 | 作用 |
|---|---|
| `lib/index.js` | 宿主插件：配置、日志、两段提示词注册、会话命令 |
| `lib/text.js` | 思考/回复 × 简繁 × 严格/宽松 文本模板 |
| `test/smoke.mjs` | 冒烟测试 |
| `cordis.patch.yml` | bundle 层：把自己插入 profile 的组合 |
| `package.json` | 包声明，`dsh.bundle.patch` 指向上面的 patch |
| `README.en.md` | 英文说明 |
| `CHANGELOG.md` | 版本记录 |
| `LICENSE` | MIT 许可证 |

## 安全说明

- 无网络、无文件读写、无子进程、无凭据访问；
- 只新增提示词段落，不覆盖、不删除任何已有段落；
- 段落名带命名空间前缀，避免与其他插件冲突。

## 兼容性

- 只用公开的 `ctx.systemPrompt.section()` 与可选的 `ctx.commands`，不 import 任何 DSH 内部模块；
- `inject = ['systemPrompt']`：服务不存在时插件静默不激活；
- 固定段落顺序 `6000` / `6001`，不依赖未来可能改动的顺序表；
- 纯 ESM、零运行时依赖、无客户端（client）部分。
