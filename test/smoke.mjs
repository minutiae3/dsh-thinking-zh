/**
 * dsh-thinking-zh 冒烟测试。
 *
 * 不启动真实 DSH：用最小 mock 上下文检查注册参数、配置回退、
 * 关闭路径、失败降级、会话级命令与回复语言。
 * 运行：node test/smoke.mjs
 */

import assert from 'node:assert/strict'
import { apply, Config } from '../lib/index.js'

let passed = 0

/**
 * @param {string} label - 用例名。
 * @param {() => void} fn - 同步断言。
 */
function test(label, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${label}`)
}

/**
 * 构造最小 Cordis 上下文。
 * @param {{ systemPrompt?: boolean, commands?: object }} [options]
 */
function createCtx(options = {}) {
  const sections = []
  const effects = []
  const logs = []

  const ctx = {
    logger: {
      info: (message) => logs.push({ level: 'info', message }),
      warn: (message) => logs.push({ level: 'warn', message }),
    },
    effect(fn) {
      effects.push(fn)
    },
    get(name, strict = true) {
      if (name === 'commands') return options.commands
      if (strict) throw new Error(`missing service: ${name}`)
      return undefined
    },
  }

  if (options.systemPrompt !== false) {
    ctx.systemPrompt = {
      section(section) {
        sections.push(section)
        return () => {
          const index = sections.indexOf(section)
          if (index >= 0) sections.splice(index, 1)
        }
      },
    }
  }

  return { ctx, sections, effects, logs }
}

/**
 * 构造最小 agent，模拟 agent 作用域的提示词注册。
 */
function createAgent() {
  const sections = []
  return {
    sections,
    ctx: {
      systemPrompt: {
        section(section) {
          sections.push(section)
          return () => {
            const index = sections.indexOf(section)
            if (index >= 0) sections.splice(index, 1)
          }
        },
      },
    },
  }
}

test('默认配置只注册简体中文思考段落', () => {
  const { ctx, sections, logs } = createCtx()
  apply(ctx)
  assert.equal(sections.length, 1)
  assert.equal(sections[0].name, 'dsh-thinking-zh:reasoning-language')
  assert.equal(sections[0].order, 6000)
  assert.equal(sections[0].interpolate, false)
  assert.match(sections[0].text, /简体中文/)
  assert.match(sections[0].text, /立即改回/)
  assert.match(sections[0].text, /最终回复仍使用用户要求的语言/)
  assert.ok(logs.some((entry) => entry.level === 'info' && entry.message.includes('已启用')))
})

test('enabled: false 时不注册段落', () => {
  const { ctx, sections, logs } = createCtx()
  apply(ctx, { enabled: false })
  assert.equal(sections.length, 0)
  assert.ok(logs.some((entry) => entry.level === 'info' && entry.message.includes('已关闭')))
})

test('缺少 systemPrompt 时只警告，不抛错', () => {
  const { ctx, logs } = createCtx({ systemPrompt: false })
  assert.doesNotThrow(() => apply(ctx))
  assert.ok(logs.some((entry) => entry.level === 'warn' && entry.message.includes('不可用')))
})

test('thinkingLanguage: zh-TW 渲染繁体思考文本', () => {
  const { ctx, sections } = createCtx()
  apply(ctx, { thinkingLanguage: 'zh-TW' })
  assert.match(sections[0].text, /繁體中文/)
  assert.doesNotMatch(sections[0].text, /简体中文/)
})

test('replyLanguage: zh-CN 额外注册回复语言段落', () => {
  const { ctx, sections } = createCtx()
  apply(ctx, { replyLanguage: 'zh-CN' })
  assert.equal(sections.length, 2)
  const reply = sections.find((section) => section.name === 'dsh-thinking-zh:reply-language')
  assert.ok(reply)
  assert.equal(reply.order, 6001)
  assert.match(reply.text, /最终回复必须使用简体中文/)
  assert.match(sections[0].text, /最终回复语言由「回复语言」段落规定/)
})

test('replyLanguage: auto 不注册回复语言段落', () => {
  const { ctx, sections } = createCtx()
  apply(ctx, { replyLanguage: 'auto' })
  assert.equal(sections.length, 1)
  assert.doesNotMatch(sections[0].text, /段落规定/)
})

test('旧字段 language 仍兼容，并提示弃用', () => {
  const { ctx, sections, logs } = createCtx()
  apply(ctx, { language: 'zh-TW' })
  assert.match(sections[0].text, /繁體中文/)
  assert.ok(logs.some((entry) => entry.level === 'warn' && entry.message.includes('已弃用')))
})

test('thinkingLanguage 优先于 language', () => {
  const { ctx, sections, logs } = createCtx()
  apply(ctx, { thinkingLanguage: 'zh-TW', language: 'zh-CN' })
  assert.match(sections[0].text, /繁體中文/)
  assert.ok(logs.some((entry) => entry.level === 'warn' && entry.message.includes('不一致')))
})

test('非法 replyLanguage 回退到 auto 并警告', () => {
  const { ctx, sections, logs } = createCtx()
  apply(ctx, { replyLanguage: 'en' })
  assert.equal(sections.length, 1)
  assert.ok(logs.some((entry) => entry.level === 'warn' && entry.message.includes('已回退')))
})

test('非法 language 回退到 zh-CN 并警告', () => {
  const { ctx, sections, logs } = createCtx()
  apply(ctx, { language: 'jp' })
  assert.match(sections[0].text, /简体中文/)
  assert.ok(logs.some((entry) => entry.level === 'warn' && entry.message.includes('已回退')))
})

test('prefer 模式不包含强制改回语句', () => {
  const { ctx, sections } = createCtx()
  apply(ctx, { mode: 'prefer' })
  assert.doesNotMatch(sections[0].text, /立即改回/)
  assert.match(sections[0].text, /尽量/)
})

test('Config.validate 规范化非法值并记录警告', () => {
  const result = Config['~standard'].validate({
    enabled: 'yes',
    language: 'jp',
    replyLanguage: 'en',
    mode: 'loose',
  })
  assert.equal(result.value.enabled, true)
  assert.equal(result.value.thinkingLanguage, 'zh-CN')
  assert.equal(result.value.replyLanguage, 'auto')
  assert.equal(result.value.mode, 'strict')
  assert.equal(result.value.warnings.length, 4)
})

test('注册 /thinking-zh 命令并可切换会话语言', () => {
  const registered = []
  const commands = {
    register(definition) {
      registered.push(definition)
      return () => {}
    },
  }
  const { ctx } = createCtx({ commands })
  apply(ctx)

  assert.equal(registered.length, 1)
  assert.equal(registered[0].name, 'thinking-zh')
  const handler = registered[0].handler
  const agent = createAgent()

  const status = handler({ agent, rawInput: '' })
  assert.equal(status.kind, 'success')
  assert.match(status.text, /简体中文/)
  assert.match(status.text, /跟随用户/)

  const switched = handler({ agent, rawInput: 'zh-TW' })
  assert.equal(switched.kind, 'success')
  assert.equal(agent.sections.length, 1)
  assert.equal(agent.sections[0].name, 'dsh-thinking-zh:reasoning-language')
  assert.match(agent.sections[0].text, /繁體中文/)
  assert.match(switched.text, /本会话覆盖：有/)
})

test('命令可切换回复语言、关闭并 reset', () => {
  const registered = []
  const commands = {
    register(definition) {
      registered.push(definition)
      return () => {}
    },
  }
  const { ctx } = createCtx({ commands })
  apply(ctx)
  const handler = registered[0].handler
  const agent = createAgent()

  const reply = handler({ agent, rawInput: 'reply zh-CN' })
  assert.equal(reply.kind, 'success')
  assert.equal(agent.sections.length, 2)
  const replySection = agent.sections.find(
    (section) => section.name === 'dsh-thinking-zh:reply-language',
  )
  assert.ok(replySection)
  assert.match(replySection.text, /最终回复必须使用简体中文/)

  const off = handler({ agent, rawInput: 'off' })
  assert.equal(off.kind, 'success')
  assert.equal(agent.sections.length, 1)
  assert.equal(agent.sections[0].text, '')

  const reset = handler({ agent, rawInput: 'reset' })
  assert.equal(reset.kind, 'success')
  assert.equal(agent.sections.length, 0)
  assert.match(reset.text, /本会话覆盖：无/)
})

test('命令遇到未知参数时返回错误用法', () => {
  const registered = []
  const commands = {
    register(definition) {
      registered.push(definition)
      return () => {}
    },
  }
  const { ctx } = createCtx({ commands })
  apply(ctx)
  const result = registered[0].handler({ agent: createAgent(), rawInput: 'xx' })
  assert.equal(result.kind, 'error')
  assert.match(result.text, /用法/)
})

test('section 抛错时降级为警告', () => {
  const { ctx, logs } = createCtx()
  ctx.systemPrompt.section = () => {
    throw new Error('boom')
  }
  assert.doesNotThrow(() => apply(ctx))
  assert.ok(logs.some((entry) => entry.level === 'warn' && entry.message.includes('插件未生效')))
})

console.log(`\n${passed} tests passed`)
