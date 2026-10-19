# dsh-thinking-zh

A small DeepSeek Harness plugin that makes the model write its **internal reasoning (thinking) in Simplified or Traditional Chinese**.

Not an official DeepSeek plugin. It only adds one fixed system-prompt section; it does not patch DSH, touch the UI, or make network requests.

## At a glance

| I want to... | How |
|---|---|
| Just install and go | Defaults to Simplified Chinese + strict mode; no config needed |
| Confirm it works | Look for `dsh-thinking-zh: 已启用 — 简体中文 / 严格模式` in the logs |
| Check status in chat | Type `/thinking-zh` |
| Use Traditional Chinese | `config.language: zh-TW` |
| Relax the requirement | `config.mode: prefer` |
| Turn it off | `config.enabled: false` |

## What it does

- Registers a constant system-prompt section (`dsh-thinking-zh:reasoning-language`) asking the model to:
  - think and reason in Simplified or Traditional Chinese at all times;
  - keep code, commands, paths, API names, error text and proper nouns unchanged;
  - keep the reasoning chain complete and rigorous — no skipped steps;
  - leave the final answer language to the user;
  - follow the user if they explicitly ask for another reasoning language.
- Only prompt text: it does not patch DSH, touch the UI, or make network requests.

## Install

From npm:

```powershell
dsh plugin --profile desktop add dsh-thinking-zh
```

From a tarball:

```powershell
dsh plugin --profile desktop add "file:C:/path/to/dsh-thinking-zh-0.2.0.tgz"
```

Then add `"dsh-thinking-zh"` to `dsh.profile.bundles` in the profile's `package.json` and restart DSH completely (including the tray icon).

## Configuration

Three optional fields. Invalid values fall back to defaults with a warning and never block DSH startup.

```yaml
- id: dsh-thinking-zh
  name: dsh-thinking-zh
  config:
    enabled: true      # default true
    language: zh-CN    # zh-CN | zh-TW
    mode: strict       # strict | prefer
```

| Field | Default | Values | Meaning |
|---|---|---|---|
| `enabled` | `true` | `true` / `false` | When false, no section is registered |
| `language` | `zh-CN` | `zh-CN` / `zh-TW` | Traditional Chinese also adjusts vocabulary, not just glyphs |
| `mode` | `strict` | `strict` / `prefer` | `strict` switches back immediately; `prefer` only asks nicely |

With a fixed configuration the prompt is stable across requests and does not disturb the KV cache.

## Status command

In an interactive UI:

```text
/thinking-zh
```

It reports whether the plugin is enabled, the language, the mode, and where to change the config. Environments without the command service (such as plain ACP) skip it silently.

## Verify it works

Look for this line in the logs:

```text
dsh-thinking-zh: 已启用 — 简体中文 / 严格模式（order=6000）
```

When disabled:

```text
dsh-thinking-zh: 配置中已关闭，未注册提示词段落
```

Registration failures log a warning with a suggested fix, such as checking `cordis.patch.yml` for a duplicate section.

## FAQ

**The model still occasionally thinks in English.**
A prompt can guide but not enforce. Keep `mode: strict` (the default), or ask for Chinese reasoning directly in the conversation.

**I changed the config but nothing happened.**
Plugin config is read at startup. Fully quit and reopen DSH.

**Will it register twice?**
The section name is namespaced; a duplicate registration in the same scope fails, and the log points you at `cordis.patch.yml`.

**Is Traditional Chinese supported?**
Yes, `zh-TW`, with adjusted vocabulary (程式碼 / 檔案 / 使用者).

## Uninstall

Remove `dsh-thinking-zh` from `dsh.profile.bundles` and `dependencies`, run `pnpm install`, and restart DSH. The plugin stores no user data.

## Layout

| File | Purpose |
|---|---|
| `lib/index.js` | Host plugin: config, logging, section registration, status command |
| `lib/text.js` | Simplified/Traditional × strict/prefer templates |
| `test/smoke.mjs` | Smoke tests |
| `cordis.patch.yml` | Bundle layer that inserts the plugin into the profile |
| `README.md` | Chinese docs |
| `CHANGELOG.md` | Release notes |

## Compatibility

- Uses only the public `ctx.systemPrompt.section()` and the optional `ctx.commands`; imports no DSH internals.
- `inject = ['systemPrompt']`: if that service is missing, the plugin stays inactive instead of failing the host.
- Fixed section order (`6000`), constant text per configuration, no client half, zero runtime dependencies.
- If `section()` is unavailable or throws, the plugin logs one warning and does nothing.

## License

MIT. See [LICENSE](LICENSE).
