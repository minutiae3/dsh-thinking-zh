/**
 * dsh-thinking-zh — 思考过程中文汉化包
 *
 * 向 DSH 的系统提示词注册一个固定段落，要求模型的内部思考
 * （reasoning / thinking）使用简体或繁体中文。
 *
 * 兼容策略：
 * - 只用公开的 `ctx.systemPrompt.section()`，不 import 任何 DSH 内部模块；
 * - `inject = ['systemPrompt']`：服务不存在时插件不激活，不让宿主启动失败；
 * - 段落顺序用固定数字，不依赖未来可能改动的顺序表；
 * - `section()` 缺失或抛错时只写一条警告，然后什么都不做；
 * - 常量文本，逐次请求渲染结果一致，不破坏提示词前缀稳定性。
 *
 * 配置（全部可选，非法值回退默认，绝不阻止 DSH 启动）：
 * - enabled: boolean，默认 true；
 * - language: 'zh-CN' | 'zh-TW'，默认 'zh-CN'；
 * - mode: 'strict' | 'prefer'，默认 'strict'。
 */

import { LANGUAGES, MODES, languageLabel, modeLabel, renderText } from './text.js'

export const name = 'dsh-thinking-zh'

/** 唯一依赖：系统提示词服务。缺失时本插件不会被激活。 */
export const inject = ['systemPrompt']

/** 带命名空间，避免与其他插件注册的段落重名。 */
const SECTION_NAME = 'dsh-thinking-zh:reasoning-language'

/**
 * 固定顺序值。0.2.x 中它落在工具指令块（≤5000）之后、
 * 交付物/源码段落（≥9000）之前；用字面量而不是顺序表，
 * 是为了在未来版本重排自己的段落时仍然有效。
 */
const SECTION_ORDER = 6000

const DEFAULT_ENABLED = true
const DEFAULT_LANGUAGE = 'zh-CN'
const DEFAULT_MODE = 'strict'

/**
 * 把任意输入规范化为本插件配置；非法字段回退默认并记录一条警告。
 * @param {unknown} raw - profile 里传入的原始配置。
 * @returns {{ enabled: boolean, language: string, mode: string, warnings: string[] }}
 */
function normalizeConfig(raw) {
  const input = raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const warnings = []

  let enabled = DEFAULT_ENABLED
  if (input.enabled !== undefined) {
    if (typeof input.enabled === 'boolean') enabled = input.enabled
    else warnings.push(`config.enabled 不是布尔值（${String(input.enabled)}），已按 true 处理`)
  }

  let language = DEFAULT_LANGUAGE
  if (input.language !== undefined) {
    if (LANGUAGES.includes(input.language)) language = input.language
    else warnings.push(`config.language 值无效（${String(input.language)}），已回退到 zh-CN`)
  }

  let mode = DEFAULT_MODE
  if (input.mode !== undefined) {
    if (MODES.includes(input.mode)) mode = input.mode
    else warnings.push(`config.mode 值无效（${String(input.mode)}），已回退到 strict`)
  }

  return { enabled, language, mode, warnings }
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
 * 注册 `/thinking-zh` 状态命令。
 * 命令服务只在交互式 UI 中存在；拿不到时静默跳过，不影响提示词。
 * @param {object} ctx - Cordis 上下文。
 * @param {{ enabled: boolean, language: string, mode: string }} settings - 已规范化配置。
 */
function registerStatusCommand(ctx, settings) {
  try {
    const commands = typeof ctx?.get === 'function' ? ctx.get('commands', false) : undefined
    if (!commands || typeof commands.register !== 'function') return

    const dispose = commands.register({
      name: 'thinking-zh',
      description: '查看 dsh-thinking-zh（思考语言）的状态',
      handler: () => ({
        kind: 'success',
        text: [
          `dsh-thinking-zh：${settings.enabled ? '已启用' : '已关闭'}`,
          `语言：${languageLabel(settings.language)}`,
          `模式：${modeLabel(settings.mode)}`,
          '修改：在 profile 的 cordis.patch.yml 中调整本插件的 config',
        ].join('\n'),
      }),
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

    const dispose = prompt.section({
      name: SECTION_NAME,
      order: SECTION_ORDER,
      text: renderText(settings),
      // 文本里没有 {{变量}}，关掉插值以免未来的模板语法误伤花括号。
      interpolate: false,
    })

    info(ctx, `已启用 — ${languageLabel(settings.language)} / ${modeLabel(settings.mode)}（order=${SECTION_ORDER}）`)
    bindDispose(ctx, dispose)
    registerStatusCommand(ctx, settings)
  } catch (error) {
    warn(
      ctx,
      `注册思考语言段落失败，插件未生效 — ${String(error)}。请检查 profile 的 cordis.patch.yml 是否有同名段落，或 systemPrompt 服务是否可用`,
    )
  }
}
