# dsh-thinking-zh

让 DeepSeek Harness 里模型的**内部思考（reasoning / thinking）使用简体中文**的提示词汉化包。

> 非官方插件，与 DeepSeek 无关。英文说明见 [README.en.md](README.en.md)。

## 它做什么

- 向 DSH 的系统提示词注册一个固定段落（`dsh-thinking-zh:reasoning-language`），要求模型：
  - 所有内部思考与推理一律使用简体中文；
  - 代码、命令、路径、API 名、错误原文、专有名词保持原样；
  - 中文推理不得省略步骤、降低严谨度；
  - 只约束内部思考，最终回复仍按用户语言；
  - 用户在当前对话中明确要求换语言时，以用户要求为准。
- 只改提示词，不改 DSH 程序文件、不改 UI、不发网络请求。

## 为什么这样兼容后续版本

- 只用 DSH 公开的 `ctx.systemPrompt.section()` API，不 import 任何 DSH 内部模块；
- 声明 `inject = ['systemPrompt']`：未来版本若没有该服务，插件静默不激活，不会让宿主启动失败；
- 段落 `order` 用固定数字 `6000`，不依赖未来版本可能改动的顺序表；
- 注册过程全部包在 try/catch 中，失败只写一条警告；
- 插件被禁用/卸载时通过 `ctx.effect` 移除段落（老版本没有该 API 时只是不清理）；
- 纯 ESM、零运行时依赖、无客户端（client）部分，不与 UI 版本耦合。

提示词是逐次请求重新组装的；本插件注册的是**常量文本**，不会改变其余提示词，也不会在两次请求之间抖动。

## 安装

从 npm：

```powershell
dsh plugin --profile desktop add dsh-thinking-zh
```

从本地 tarball：

```powershell
dsh plugin --profile desktop add "file:C:/path/to/dsh-thinking-zh-0.1.0.tgz"
```

然后确认 profile 的 `package.json` 里 `dsh.profile.bundles` 含 `"dsh-thinking-zh"`，**完全退出并重开 DSH**。

## 配置（可关闭）

默认开启。不想用时不必卸载，在 profile 的 `cordis.patch.yml` 里加一行即可关闭：

```yaml
- id: dsh-thinking-zh
  name: dsh-thinking-zh
  config:
    enabled: false
```

## 卸载

从 `package.json` 的 `dsh.profile.bundles` 与 `dependencies` 中删掉 `dsh-thinking-zh`，
再执行 `pnpm install`，重启 DSH 即可。它不写入任何用户数据。

## 目录

| 文件 | 作用 |
|---|---|
| `lib/index.js` | 宿主插件：注册系统提示词段落 |
| `cordis.patch.yml` | bundle 层：把自己插入 profile 的组合 |
| `package.json` | 包声明，`dsh.bundle.patch` 指向上面的 patch |
| `README.en.md` | 英文说明 |
| `LICENSE` | MIT 许可证 |

## 安全说明

- 无网络、无文件读写、无子进程、无凭据访问；
- 只新增一段提示词，不覆盖、不删除任何已有段落；
- 段落名带命名空间前缀，避免与其他插件冲突。
