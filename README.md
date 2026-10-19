# dsh-thinking-zh

让 DeepSeek Harness 里模型的**内部思考（reasoning / thinking）使用简体或繁体中文**的提示词汉化包。

> 非官方插件，与 DeepSeek 无关。英文说明见 [README.en.md](README.en.md)。

## 30 秒看懂

| 你想做的事 | 怎么做 |
|---|---|
| 装完就能用 | 默认简体中文 + 严格模式，不用配置 |
| 确认已生效 | 日志出现 `dsh-thinking-zh: 已启用 — 简体中文 / 严格模式` |
| 在对话里查状态 | 输入 `/thinking-zh` |
| 换成繁体 | `config.language: zh-TW` |
| 放宽要求 | `config.mode: prefer` |
| 关掉 | `config.enabled: false` |

## 它做什么

- 向 DSH 的系统提示词注册一个固定段落（`dsh-thinking-zh:reasoning-language`），要求模型：
  - 内部思考与推理一律使用简体或繁体中文；
  - 代码、命令、路径、API 名、错误原文、专有名词保持原样；
  - 中文推理不得省略步骤、降低严谨度；
  - 只约束内部思考，最终回复仍按用户语言；
  - 用户在当前对话中明确要求换语言时，以用户要求为准。
- 只改提示词，不改 DSH 程序文件、不改 UI、不发网络请求。

## 安装

从 npm：

```powershell
dsh plugin --profile desktop add dsh-thinking-zh
```

从本地 tarball：

```powershell
dsh plugin --profile desktop add "file:C:/path/to/dsh-thinking-zh-0.2.0.tgz"
```

然后确认 profile 的 `package.json` 里 `dsh.profile.bundles` 含 `"dsh-thinking-zh"`，**完全退出并重开 DSH**（包括托盘图标）。

## 配置

三个字段，全部可选。写错只会回退默认并打一条警告，不会让 DSH 启动失败。

```yaml
- id: dsh-thinking-zh
  name: dsh-thinking-zh
  config:
    enabled: true      # 默认 true
    language: zh-CN    # zh-CN | zh-TW
    mode: strict       # strict | prefer
```

| 字段 | 默认 | 可选值 | 说明 |
|---|---|---|---|
| `enabled` | `true` | `true` / `false` | 关闭后不注册段落 |
| `language` | `zh-CN` | `zh-CN` / `zh-TW` | 繁体同时调整用词，不只是字形 |
| `mode` | `strict` | `strict` / `prefer` | `strict` 发现英文思考立即改回；`prefer` 只要求尽量 |

配置固定时提示词完全稳定，不会在请求之间抖动，也不影响 KV cache。

## 状态命令

在交互式 UI 中输入：

```text
/thinking-zh
```

返回当前是否启用、语言、模式，以及去哪里修改配置。没有命令服务的环境（如纯 ACP）会自动跳过，不影响提示词。

## 确认生效

日志里出现这一行就说明生效：

```text
dsh-thinking-zh: 已启用 — 简体中文 / 严格模式（order=6000）
```

关闭时：

```text
dsh-thinking-zh: 配置中已关闭，未注册提示词段落
```

注册失败时会有带修复建议的警告，例如检查 `cordis.patch.yml` 是否有同名段落。

## FAQ

**模型偶尔还是用英文思考？**
提示词只能引导，不能强制。保持 `mode: strict`（默认），或在对话里直接要求“用中文思考”。

**改了配置没生效？**
插件配置在启动时读取，改完需要完全退出并重开 DSH。

**会不会重复注册？**
段落名带命名空间前缀；同一作用域内重复注册会报错，日志会提示检查 `cordis.patch.yml`。

**支持繁体吗？**
支持 `zh-TW`，用词会一起调整（程式碼 / 檔案 / 使用者）。

## 卸载

从 `package.json` 的 `dsh.profile.bundles` 与 `dependencies` 中删掉 `dsh-thinking-zh`，
再执行 `pnpm install`，重启 DSH 即可。它不写入任何用户数据。

## 目录

| 文件 | 作用 |
|---|---|
| `lib/index.js` | 宿主插件：配置、日志、段落注册、状态命令 |
| `lib/text.js` | 简繁 × 严格/宽松 文本模板 |
| `test/smoke.mjs` | 冒烟测试 |
| `cordis.patch.yml` | bundle 层：把自己插入 profile 的组合 |
| `package.json` | 包声明，`dsh.bundle.patch` 指向上面的 patch |
| `README.en.md` | 英文说明 |
| `CHANGELOG.md` | 版本记录 |
| `LICENSE` | MIT 许可证 |

## 安全说明

- 无网络、无文件读写、无子进程、无凭据访问；
- 只新增一段提示词，不覆盖、不删除任何已有段落；
- 段落名带命名空间前缀，避免与其他插件冲突。

## 兼容性

- 只用公开的 `ctx.systemPrompt.section()` 与 `ctx.commands`（可选），不 import 任何 DSH 内部模块；
- `inject = ['systemPrompt']`：服务不存在时插件静默不激活；
- 固定段落顺序 `6000`，不依赖未来可能改动的顺序表；
- 纯 ESM、零运行时依赖、无客户端（client）部分。
