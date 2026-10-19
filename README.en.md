# dsh-thinking-zh

A small DeepSeek Harness plugin that makes the model write its **internal reasoning (thinking) in Simplified or Traditional Chinese**, with an optional policy for the **final reply language**.

Not an official DeepSeek plugin. It only adds prompt sections; it does not patch DSH, touch the UI, or make network requests.

## At a glance

| I want to... | How |
|---|---|
| Just install and go | Simplified Chinese thinking, replies follow the user; no config needed |
| Confirm it works | Look for `已启用 — 思考：简体中文 / 回复：跟随用户` in the logs |
| Check or switch in chat | Type `/thinking-zh` |
| Traditional Chinese thinking | `config.thinkingLanguage: zh-TW` |
| Force Chinese replies | `config.replyLanguage: zh-CN` |
| Relax the requirement | `config.mode: prefer` |
| Turn it off | `config.enabled: false` |

## What it does

- **Thinking section (always registered)**: asks the model to reason in Simplified or Traditional Chinese;
  - keeps code, commands, paths, API names, error text and proper nouns unchanged;
  - keeps the reasoning chain complete and rigorous;
  - follows the user if they explicitly ask for another reasoning language.
- **Reply section (registered on demand)**: when `replyLanguage` is not `auto`, asks for the final reply in the chosen Chinese variant;
  - an explicit user request for another language still wins.
- Only prompt text: it does not patch DSH, touch the UI, or make network requests.

## Install

From npm:

```powershell
dsh plugin --profile desktop add dsh-thinking-zh
```

From a tarball:

```powershell
dsh plugin --profile desktop add "file:C:/path/to/dsh-thinking-zh-0.2.1.tgz"
```

Then add `"dsh-thinking-zh"` to `dsh.profile.bundles` in the profile's `package.json` and restart DSH completely (including the tray icon).

## Configuration

Four optional fields. Invalid values fall back to defaults with a warning and never block DSH startup.

```yaml
- id: dsh-thinking-zh
  name: dsh-thinking-zh
  config:
    enabled: true           # default true
    thinkingLanguage: zh-CN # zh-CN | zh-TW
    replyLanguage: auto     # auto | zh-CN | zh-TW
    mode: strict            # strict | prefer
```

| Field | Default | Values | Meaning |
|---|---|---|---|
| `enabled` | `true` | `true` / `false` | When false, no section is registered |
| `thinkingLanguage` | `zh-CN` | `zh-CN` / `zh-TW` | Internal reasoning language; Traditional also adjusts vocabulary |
| `replyLanguage` | `auto` | `auto` / `zh-CN` / `zh-TW` | `auto` follows the user; otherwise constrains the final reply |
| `mode` | `strict` | `strict` / `prefer` | `strict` switches back immediately; `prefer` only asks nicely |

`language` is the 0.2.0 field name. It still works as an alias of `thinkingLanguage`, with a deprecation warning. New configs should use `thinkingLanguage`.

With a fixed configuration the prompt is stable across requests and does not disturb the KV cache.

## Status command

In an interactive UI:

```text
/thinking-zh                 show current status
/thinking-zh zh-TW           switch this session to Traditional Chinese
/thinking-zh zh-CN           switch this session to Simplified Chinese
/thinking-zh reply zh-CN     make final replies use Simplified Chinese this session
/thinking-zh reply auto      let replies follow the user again
/thinking-zh prefer          relax this session
/thinking-zh strict          switch back to strict
/thinking-zh off             disable this session
/thinking-zh on              re-enable this session
/thinking-zh reset           clear all session overrides
```

These switches affect **the current session only**: they do not change the global config and need no restart. They register agent-scoped sections that shadow the global ones and are cleaned up when the session ends.

Environments without the command service (such as plain ACP) skip it silently.

## Verify it works

Look for this line in the logs:

```text
dsh-thinking-zh: 已启用 — 思考：简体中文 / 回复：跟随用户 / 严格模式（order=6000）
```

When disabled:

```text
dsh-thinking-zh: 配置中已关闭，未注册提示词段落
```

Registration failures log a warning with a suggested fix, such as checking `cordis.patch.yml` for a duplicate section.

## Comparison

Based on public information as of October 2026; other plugins may have changed.

| Plugin | Thinking language | Reply language | Simplified/Traditional | Strict/prefer | Session switching | Zero runtime deps |
|---|---|---|---|---|---|---|
| **dsh-thinking-zh (this)** | ✅ | ✅ independent | ✅ | ✅ | ✅ | ✅ |
| `@tirol/dsh-language-set` | ✅ | ✅ independent | Chinese/English only | ❌ | ❌ (global command only) | ❌ peer deps |
| `@max-null/dsh-chinese-thinking` | ✅ | ✅ same section | Simplified only | ❌ | ❌ | ❌ peer deps |
| `yingjian666/dsh-zh-thinking` | ✅ | ❌ | Simplified only | ❌ | ❌ | ✅ |
| `dsh-reasoning-cn` | ✅ + reasoning translation | ❌ | Simplified only | ❌ | ❌ | unverified |

What this plugin adds: Simplified/Traditional variants, `strict`/`prefer`, thinking/reply separation, session-level switching, zero runtime dependencies, and 16 smoke tests.

## FAQ

**The model still occasionally thinks in English.**
A prompt can guide but not enforce. Keep `mode: strict` (the default), or ask for Chinese reasoning directly in the conversation.

**I changed the config but nothing happened.**
Plugin config is read at startup. Fully quit and reopen DSH. For temporary changes use `/thinking-zh`.

**Does `/thinking-zh` change the global config?**
No. It registers a session-scoped shadow section; `reset` or the end of the session restores the global config.

**Is Traditional Chinese supported?**
Yes, `zh-TW`, with adjusted vocabulary (程式碼 / 檔案 / 使用者).

**Does the old `language` field still work?**
Yes, as an alias of `thinkingLanguage`, with a deprecation warning.

## Uninstall

Remove `dsh-thinking-zh` from `dsh.profile.bundles` and `dependencies`, run `pnpm install`, and restart DSH. The plugin stores no user data.

## Layout

| File | Purpose |
|---|---|
| `lib/index.js` | Host plugin: config, logging, two prompt sections, session command |
| `lib/text.js` | Thinking/reply × Simplified/Traditional × strict/prefer templates |
| `test/smoke.mjs` | Smoke tests |
| `cordis.patch.yml` | Bundle layer that inserts the plugin into the profile |
| `README.md` | Chinese docs |
| `CHANGELOG.md` | Release notes |

## Compatibility

- Uses only the public `ctx.systemPrompt.section()` and the optional `ctx.commands`; imports no DSH internals.
- `inject = ['systemPrompt']`: if that service is missing, the plugin stays inactive instead of failing the host.
- Fixed section order (`6000` / `6001`), constant text per configuration, no client half, zero runtime dependencies.

## License

MIT. See [LICENSE](LICENSE).
