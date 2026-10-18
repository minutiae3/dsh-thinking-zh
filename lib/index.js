/**
 * dsh-thinking-zh — 思考过程中文汉化包
 *
 * 向 DSH 的系统提示词注册一个固定段落，要求模型的内部思考
 * （reasoning / thinking）使用简体中文。
 *
 * 兼容策略：
 * - 只用公开的 `ctx.systemPrompt.section()`，不 import 任何 DSH 内部模块；
 * - `inject = ['systemPrompt']`：服务不存在时插件不激活，不让宿主启动失败；
 * - 段落顺序用固定数字，不依赖未来可能改动的顺序表；
 * - `section()` 缺失或抛错时只写一条警告，然后什么都不做；
 * - 常量文本，逐次请求渲染结果一致，不破坏提示词前缀稳定性。
 */

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

const TEXT = `## 思考语言（简体中文）

你的内部思考与推理（reasoning / thinking）内容必须始终使用简体中文书写，无论用户使用哪种语言、代码或文档使用哪种语言。

- 代码、命令、文件路径、API 名称、变量名、错误原文与专有名词保持原样，不翻译、不改写。
- 中文推理要保持完整、严谨的推理链条，不省略步骤，也不因为改用中文而降低推理深度。
- 这条要求只约束内部思考；面向用户的最终回复仍使用用户要求的语言。
- 如果用户在当前对话中明确要求换用其他语言思考，以用户的要求为准。`

/**
 * 写一条警告；日志服务本身不可用时保持静默。
 * @param {object} ctx - Cordis 上下文。
 * @param {string} message - 警告内容。
 */
function warn(ctx, message) {
  try {
    ctx?.logger?.warn?.(`dsh-thinking-zh: ${message}`)
  } catch {
    // 这里不是值得让宿主出错的路径。
  }
}

/**
 * @param {object} ctx - Cordis 上下文（宿主侧）。
 * @param {object} [config] - profile 里给本插件的配置；`{ enabled: false }` 可关闭。
 */
export function apply(ctx, config) {
  try {
    if (config?.enabled === false) return
    const prompt = ctx?.systemPrompt
    if (typeof prompt?.section !== 'function') {
      warn(ctx, 'systemPrompt.section() 不可用，已跳过（不影响 DSH 启动）')
      return
    }
    const dispose = prompt.section({
      name: SECTION_NAME,
      order: SECTION_ORDER,
      text: TEXT,
      // 文本里没有 {{变量}}，关掉插值以免未来的模板语法误伤花括号。
      interpolate: false,
    })
    // 插件被禁用/卸载时移除段落；没有 ctx.effect 的老版本只是不清理。
    if (typeof dispose === 'function' && typeof ctx.effect === 'function') {
      try {
        ctx.effect(() => dispose)
      } catch {
        // 清理注册失败不影响已经生效的段落。
      }
    }
  } catch (error) {
    warn(ctx, `注册思考语言段落失败，已跳过（不影响 DSH 启动）：${String(error)}`)
  }
}
