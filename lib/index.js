/**
 * dsh-thinking-zh — 思考与回复语言汉化包
 *
 * 向 DSH 的系统提示词注册两段内容：
 * - 思考语言段落（始终注册）：要求模型内部思考使用简体或繁体中文；
 * - 回复语言段落（按需注册）：要求最终回复使用指定中文，或跟随用户。
 *
 * 兼容策略：
 * - 只用公开的 `ctx.systemPrompt.section()` 与可选的 `ctx.commands`；
 * - `inject = ['systemPrompt']`：服务不存在时插件不激活，不让宿主启动失败；
 * - 段落顺序用固定数字，不依赖未来可能改动的顺序表；
 * - 注册失败只写一条警告，然后什么都不做；
 * - 常量文本，逐次请求渲染结果一致，不破坏提示词前缀稳定性。
 *
 * 配置（全部可选，非法值回退默认，绝不阻止 DSH 启动）：
 * - enabled: boolean，默认 true；
 * - thinkingLanguage: 'zh-CN' | 'zh-TW'，默认 'zh-CN'（旧字段 `language` 仍兼容）；
 * - replyLanguage: 'auto' | 'zh-CN' | 'zh-TW'，默认 'auto'（跟随用户）；
 * - mode: 'strict' | 'prefer'，默认 'strict'。
 */

import {
  LANGUAGES,
  MODES,
  REPLY_LANGUAGES,
  languageLabel,
  modeLabel,
  replyLanguageLabel,
  renderReplyText,
  renderThinkingText,
} from './text.js'

export const name = 'dsh-thinking-zh'

/** 唯一依赖：系统提示词服务。缺失时本插件不会被激活。 */
export const inject = ['systemPrompt']

/** 带命名空间，避免与其他插件注册的段落重名。 */
const SECTION_NAME = 'dsh-thinking-zh:reasoning-language'
const REPLY_SECTION_NAME = 'dsh-thinking-zh:reply-language'

/**
 * 固定顺序值。0.2.x 中它落在工具指令块（≤5000）之后、
 * 交付物/源码段落（≥9000）之前；用字面量而不是顺序表，
 * 是为了在未来版本重排自己的段落时仍然有效。
 */
const SECTION_ORDER = 6000
const REPLY_SECTION_ORDER = 6001

const DEFAULT_ENABLED = true
const DEFAULT_THINKING_LANGUAGE = 'zh-CN'
const DEFAULT_REPLY_LANGUAGE = 'auto'
const DEFAULT_MODE = 'strict'

const COMMAND_USAGE =
  '/thinking-zh [status|on|off|zh-CN|zh-TW|strict|prefer|reply auto|zh-CN|zh-TW|reset]'

/**
 * 把任意输入规范化为本插件配置；非法字段回退默认并记录一条警告。
 * @param {unknown} raw - profile 里传入的原始配置。
 * @returns {{
 *   enabled: boolean,
 *   thinkingLanguage: string,
 *   replyLanguage: string,
 *   mode: string,
 *   warnings: string[],
 * }}
 */
function normalizeConfig(raw) {
  const input = raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const warnings = []

  let enabled = DEFAULT_ENABLED
  if (input.enabled !== undefined) {
    if (typeof input.enabled === 'boolean') enabled = input.enabled
    else warnings.push(`config.enabled 不是布尔值（${String(input.enabled)}），已按 true 处理`)
  }

  // thinkingLanguage 是正式字段；language 是 0.2.0 的旧字段，仍然兼容。
  let thinkingLanguage = DEFAULT_THINKING_LANGUAGE
  if (input.thinkingLanguage !== undefined) {
    if (LANGUAGES.includes(input.thinkingLanguage)) thinkingLanguage = input.thinkingLanguage
    else
      warnings.push(
        `config.thinkingLanguage 值无效（${String(input.thinkingLanguage)}），已回退到 zh-CN`,
      )
    if (input.language !== undefined) {
      if (input.language !== input.thinkingLanguage) {
        warnings.push('config.language 已弃用，且与 thinkingLanguage 不一致，已采用 thinkingLanguage')
      } else {
        warnings.push('config.language 已弃用，请改用 thinkingLanguage（当前仍兼容）')
      }
    }
  } else if (input.language !== undefined) {
    if (LANGUAGES.includes(input.language)) {
      thinkingLanguage = input.language
      warnings.push('config.language 已弃用，请改用 thinkingLanguage（当前仍兼容）')
    } else {
      warnings.push(
        `config.language 值无效（${String(input.language)}），已回退到 zh-CN；该字段已弃用，请改用 thinkingLanguage`,
      )
    }
  }

  let replyLanguage = DEFAULT_REPLY_LANGUAGE
  if (input.replyLanguage !== undefined) {
    if (REPLY_LANGUAGES.includes(input.replyLanguage)) replyLanguage = input.replyLanguage
    else
      warnings.push(
        `config.replyLanguage 值无效（${String(input.replyLanguage)}），已回退到 auto（跟随用户）`,
      )
  }

  let mode = DEFAULT_MODE
  if (input.mode !== undefined) {
    if (MODES.includes(input.mode)) mode = input.mode
    else warnings.push(`config.mode 值无效（${String(input.mode)}），已回退到 strict`)
  }

  return { enabled, thinkingLanguage, replyLanguage, mode, warnings }
}

/**
 * Standard Schema 配置声明（零依赖，不引入 schemastery）。
 * 始终返回规范化后的值：非法配置只产生警告，不会让 DSH 启动失败。
 */
export const Config = {
  '~standard': {
    version: 1,
    vendor: 'dsh-thinking-zh',
    validate(value) {
      return { value: normalizeConfig(value) }
    },
  },
}

/**
 * 写一条信息日志；日志服务不可用时保持静默。
 * @param {object} ctx - Cordis 上下文。
 * @param {string} message - 日志内容。
 */
function info(ctx, message) {
  try {
    ctx?.logger?.info?.(`dsh-thinking-zh: ${message}`)
  } catch {
    // 日志失败不是值得让宿主出错的路径。
  }
}

/**
 * 写一条警告；日志服务本身不可用时保持静默。
 * @param {object} ctx - Cordis 上下文。
 * @param {string} message - 警告内容。
 */
function warn(ctx, message) {
  try {
    ctx?.logger?.warn?.(`dsh-thinking-zh: ${message}`)
  } catch {
    // 同上。
  }
}

/**
 * 把服务返回的 disposer 绑定到插件生命周期。
 * `section()` / `commands.register()` 的 disposer 绑定在服务上下文上，
 * 需要插件自己用 `ctx.effect` 收起，卸载时才会真正移除。
 * @param {object} ctx - Cordis 上下文。
 * @param {unknown} dispose - 服务返回的 disposer。
 */
function bindDispose(ctx, dispose) {
  if (typeof dispose !== 'function') return
  if (typeof ctx?.effect !== 'function') return
  try {
    ctx.effect(() => dispose)
  } catch {
    // 清理注册失败不影响已经生效的注册。
  }
}

/**
 * @param {{ enabled: boolean, thinkingLanguage: string, replyLanguage: string, mode: string }} settings
 * @returns {string} 用于日志的单行摘要。
 */
function summary(settings) {
  return `思考：${languageLabel(settings.thinkingLanguage)} / 回复：${replyLanguageLabel(settings.replyLanguage)} / ${modeLabel(settings.mode)}`
}

/**
 * 注册 `/thinking-zh` 命令：查看状态，或为当前会话临时切换。
 * 命令服务只在交互式 UI 中存在；拿不到时静默跳过，不影响提示词。
 * @param {object} ctx - Cordis 上下文。
 * @param {{ enabled: boolean, thinkingLanguage: string, replyLanguage: string, mode: string }} settings
 */
function registerStatusCommand(ctx, settings) {
  try {
    const commands = typeof ctx?.get === 'function' ? ctx.get('commands', false) : undefined
    if (!commands || typeof commands.register !== 'function') return

    /** @type {WeakMap<object, { settings: object, dispose: () => void }>} */
    const overrides = new WeakMap()

    const resolveFor = (agent) => ({ ...settings, ...(overrides.get(agent)?.settings ?? {}) })

    /**
     * 用 agent 作用域段落遮蔽全局段落；同一 agent 重复切换时先移除旧覆盖。
     * @returns {boolean} 是否成功注册。
     */
    const applyForAgent = (agent, next) => {
      const prompt = agent?.ctx?.systemPrompt
      if (typeof prompt?.section !== 'function') return false

      const previous = overrides.get(agent)
      if (typeof previous?.dispose === 'function') {
        try {
          previous.dispose()
        } catch {
          // 旧覆盖已经失效时继续注册新覆盖。
        }
      }
      overrides.delete(agent)

      const thinkingDispose = prompt.section({
        name: SECTION_NAME,
        order: SECTION_ORDER,
        text: next.enabled ? renderThinkingText(next) : '',
        interpolate: false,
      })

      let replyDispose
      if (next.enabled && next.replyLanguage !== 'auto') {
        replyDispose = prompt.section({
          name: REPLY_SECTION_NAME,
          order: REPLY_SECTION_ORDER,
          text: renderReplyText(next),
          interpolate: false,
        })
      }

      overrides.set(agent, {
        settings: {
          enabled: next.enabled,
          thinkingLanguage: next.thinkingLanguage,
          replyLanguage: next.replyLanguage,
          mode: next.mode,
        },
        dispose: () => {
          thinkingDispose?.()
          replyDispose?.()
        },
      })
      return true
    }

    const statusText = (agent) => {
      const active = resolveFor(agent)
      return [
        `dsh-thinking-zh：${active.enabled ? '已启用' : '已关闭'}`,
        `思考语言：${languageLabel(active.thinkingLanguage)}`,
        `回复语言：${replyLanguageLabel(active.replyLanguage)}`,
        `模式：${modeLabel(active.mode)}`,
        `本会话覆盖：${overrides.has(agent) ? '有（/thinking-zh reset 可清除）' : '无'}`,
        `用法：${COMMAND_USAGE}`,
      ].join('\n')
    }

    const dispose = commands.register({
      name: 'thinking-zh',
      description: '查看或切换思考/回复语言（本会话生效，不改全局配置）',
      handler: ({ agent, rawInput } = {}) => {
        if (!agent) return { kind: 'error', text: '当前命令没有关联会话。' }

        const raw = String(rawInput ?? '').trim()
        const arg = raw.toLowerCase()

        if (!arg || arg === 'status') {
          return { kind: 'success', text: statusText(agent) }
        }

        if (arg === 'reset') {
          const previous = overrides.get(agent)
          if (typeof previous?.dispose === 'function') {
            try {
              previous.dispose()
            } catch {
              // 已经失效的覆盖不影响 reset 结果。
            }
          }
          overrides.delete(agent)
          return {
            kind: 'success',
            text: `已清除本会话覆盖，恢复全局配置。\n${statusText(agent)}`,
          }
        }

        const current = resolveFor(agent)
        let next

        if (arg === 'on' || arg === 'off') {
          next = { ...current, enabled: arg === 'on' }
        } else if (arg === 'zh-cn' || arg === 'zh-tw') {
          next = { ...current, thinkingLanguage: arg === 'zh-tw' ? 'zh-TW' : 'zh-CN' }
        } else if (arg === 'strict' || arg === 'prefer') {
          next = { ...current, mode: arg }
        } else if (arg.startsWith('reply ')) {
          const value = raw.slice('reply '.length).trim().toLowerCase()
          if (value === 'auto') next = { ...current, replyLanguage: 'auto' }
          else if (value === 'zh-cn') next = { ...current, replyLanguage: 'zh-CN' }
          else if (value === 'zh-tw') next = { ...current, replyLanguage: 'zh-TW' }
          else return { kind: 'error', text: `用法：${COMMAND_USAGE}` }
        } else {
          return { kind: 'error', text: `用法：${COMMAND_USAGE}` }
        }

        if (!applyForAgent(agent, next)) {
          return { kind: 'error', text: '当前会话不支持提示词覆盖。' }
        }

        return { kind: 'success', text: statusText(agent) }
      },
    })
    bindDispose(ctx, dispose)
  } catch (error) {
    warn(ctx, `注册 /thinking-zh 命令失败，已跳过（不影响提示词）：${String(error)}`)
  }
}

/**
 * @param {object} ctx - Cordis 上下文（宿主侧）。
 * @param {object} [config] - profile 里给本插件的配置。
 */
export function apply(ctx, config) {
  try {
    const settings = normalizeConfig(config)
    const warnings = [
      ...new Set([
        ...(Array.isArray(config?.warnings) ? config.warnings : []),
        ...settings.warnings,
      ]),
    ]
    for (const message of warnings) warn(ctx, message)

    if (!settings.enabled) {
      info(ctx, '配置中已关闭，未注册提示词段落')
      return
    }

    const prompt = ctx?.systemPrompt
    if (typeof prompt?.section !== 'function') {
      warn(ctx, 'systemPrompt.section() 不可用，已跳过（不影响 DSH 启动）')
      return
    }

    const thinkingDispose = prompt.section({
      name: SECTION_NAME,
      order: SECTION_ORDER,
      text: renderThinkingText(settings),
      // 文本里没有 {{变量}}，关掉插值以免未来的模板语法误伤花括号。
      interpolate: false,
    })

    const replyText = renderReplyText(settings)
    const replyDispose = replyText
      ? prompt.section({
          name: REPLY_SECTION_NAME,
          order: REPLY_SECTION_ORDER,
          text: replyText,
          interpolate: false,
        })
      : undefined

    info(ctx, `已启用 — ${summary(settings)}（order=${SECTION_ORDER}）`)
    bindDispose(ctx, thinkingDispose)
    if (replyDispose) bindDispose(ctx, replyDispose)
    registerStatusCommand(ctx, settings)
  } catch (error) {
    warn(
      ctx,
      `注册思考语言段落失败，插件未生效 — ${String(error)}。请检查 profile 的 cordis.patch.yml 是否有同名段落，或 systemPrompt 服务是否可用`,
    )
  }
}
