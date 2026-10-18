# dsh-thinking-zh

A small DeepSeek Harness plugin that makes the model write its **internal reasoning (thinking) in Simplified Chinese**.

Not an official DeepSeek plugin. It only adds one fixed system-prompt section; it does not patch DSH, touch the UI, or make network requests.

## What it does

- Registers a constant system-prompt section (`dsh-thinking-zh:reasoning-language`) asking the model to:
  - think and reason in Simplified Chinese at all times;
  - keep code, commands, paths, API names, error text and proper nouns unchanged;
  - keep the reasoning chain complete and rigorous — no skipped steps;
  - leave the final answer language to the user;
  - follow the user if they explicitly ask for another reasoning language.

## Install

From npm:

```powershell
dsh plugin --profile desktop add dsh-thinking-zh
```

From a tarball:

```powershell
dsh plugin --profile desktop add "file:C:/path/to/dsh-thinking-zh-0.1.0.tgz"
```

Then add `"dsh-thinking-zh"` to `dsh.profile.bundles` in the profile's `package.json` and restart DSH completely (including the tray icon).

## Configuration

On by default. To turn it off without uninstalling, add a config row to your profile's `cordis.patch.yml`:

```yaml
- id: dsh-thinking-zh
  name: dsh-thinking-zh
  config:
    enabled: false
```

## Uninstall

Remove `dsh-thinking-zh` from `dsh.profile.bundles` and `dependencies`, run `pnpm install`, and restart DSH. The plugin stores no user data.

## Compatibility

- Uses only the public `ctx.systemPrompt.section()` API; imports no DSH internals.
- Declares `inject = ['systemPrompt']`: if that service is missing, the plugin stays inactive instead of failing the host.
- Fixed section order (`6000`), constant text, no client half, zero runtime dependencies.
- If `section()` is unavailable or throws, the plugin logs one warning and does nothing.
- Removes its section when disabled or unloaded via `ctx.effect` (older hosts without that API simply skip cleanup).

## License

MIT. See [LICENSE](LICENSE).
