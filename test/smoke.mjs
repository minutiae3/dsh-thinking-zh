/**
 * dsh-thinking-zh 冒烟测试。
 *
 * 不启动真实 DSH：用最小 mock 上下文检查注册参数、配置回退、
 * 关闭路径、失败降级与状态命令。运行：node test/smoke.mjs
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
        return () => {}
      },
    }
  }

  return { ctx, sections, effects, logs }
}

test('默认配置注册简体中文严格段落', () => {
  const { ctx, sections, logs } = createCtx()
  apply(ctx)
  assert.equal(sections.length, 1)
  assert.equal(sections[0].name, 'dsh-thinking-zh:reasoning-language')
  assert.equal(sections[0].order, 6000)
  assert.equal(sections[0].interpolate, false)
  assert.match(sections[0].text, /简体中文/)
  assert.match(sections[0].text, /立即改回/)
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

test('非法 language 回退到 zh-CN 并警告', () => {
  const { ctx, sections, logs } = createCtx()
  apply(ctx, { language: 'jp' })
  assert.match(sections[0].text, /简体中文/)
  assert.ok(logs.some((entry) => entry.level === 'warn' && entry.message.includes('已回退')))
})

test('zh-TW 渲染繁体文本', () => {
  const { ctx, sections } = createCtx()
  apply(ctx, { language: 'zh-TW' })
  assert.match(sections[0].text, /繁體中文/)
  assert.doesNotMatch(sections[0].text, /简体中文/)
})

test('prefer 模式不包含强制改回语句', () => {
  const { ctx, sections } = createCtx()
  apply(ctx, { mode: 'prefer' })
  assert.doesNotMatch(sections[0].text, /立即改回/)
  assert.match(sections[0].text, /尽量/)
})

test('Config.validate 规范化非法值并记录警告', () => {
  const result = Config['~standard'].validate({ enabled: 'yes', language: 'jp', mode: 'loose' })
  assert.equal(result.value.enabled, true)
  assert.equal(result.value.language, 'zh-CN')
  assert.equal(result.value.mode, 'strict')
  assert.equal(result.value.warnings.length, 3)
})

test('注册 /thinking-zh 状态命令', () => {
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
  const result = registered[0].handler({})
  assert.equal(result.kind, 'success')
  assert.match(result.text, /已启用/)
  assert.match(result.text, /简体中文/)
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
