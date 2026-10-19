/**
 * 思考语言文本模板。
 *
 * 支持两种语言（zh-CN / zh-TW）与两种强度（strict / prefer）。
 * 模板是常量：同一配置下每次渲染结果完全一致，不会在请求之间抖动。
 */

export const LANGUAGES = ['zh-CN', 'zh-TW']
export const MODES = ['strict', 'prefer']

const TEMPLATES = {
  'zh-CN': {
    heading: '## 思考语言（简体中文）',
    intro:
      '你的内部思考与推理（reasoning / thinking）必须始终使用简体中文书写，无论用户使用哪种语言、代码或文档使用哪种语言。',
    rules: [
      '代码、命令、文件路径、API 名称、变量名、错误原文与专有名词保持原样，不翻译、不改写。',
      '中文推理要保持完整、严谨的推理链条，不省略步骤，也不因为改用中文而降低推理深度。',
      '这条要求只约束内部思考；面向用户的最终回复仍使用用户要求的语言。',
    ],
    strict:
      '如果发现自己正在用其他语言思考，立即改回简体中文继续，不必解释，也不必重述已经完成的部分。',
    prefer: '请尽量使用简体中文思考；个别术语或短句使用其他语言可以接受。',
    userOverride: '如果用户在当前对话中明确要求换用其他语言思考，以用户的要求为准。',
  },
  'zh-TW': {
    heading: '## 思考語言（繁體中文）',
    intro:
      '你的內部思考與推理（reasoning / thinking）必須始終使用繁體中文書寫，無論使用者使用哪種語言、程式碼或文件使用哪種語言。',
    rules: [
      '程式碼、指令、檔案路徑、API 名稱、變數名稱、錯誤原文與專有名詞保持原樣，不翻譯、不改寫。',
      '繁體中文推理要保持完整、嚴謹的推理鏈條，不省略步驟，也不因為改用繁體中文而降低推理深度。',
      '這項要求只約束內部思考；面向使用者的最終回覆仍使用使用者要求的語言。',
    ],
    strict:
      '如果發現自己正在用其他語言思考，立即改回繁體中文繼續，不必解釋，也不必重述已經完成的部分。',
    prefer: '請盡量使用繁體中文思考；個別術語或短句使用其他語言可以接受。',
    userOverride: '如果使用者在當前對話中明確要求換用其他語言思考，以使用者的要求為準。',
  },
}

/**
 * 把配置规范化为受支持的语言与模式；未知值回退默认。
 * @param {object} [options] - `{ language, mode }`。
 * @returns {{ language: string, mode: string }} 规范化结果。
 */
export function normalizeLanguageOptions(options = {}) {
  const language = LANGUAGES.includes(options?.language) ? options.language : 'zh-CN'
  const mode = MODES.includes(options?.mode) ? options.mode : 'strict'
  return { language, mode }
}

/**
 * 按语言与模式渲染提示词段落文本。
 * @param {object} [options] - `{ language, mode }`。
 * @returns {string} 固定段落文本。
 */
export function renderText(options = {}) {
  const { language, mode } = normalizeLanguageOptions(options)
  const template = TEMPLATES[language]
  return [
    template.heading,
    '',
    template.intro,
    '',
    ...template.rules.map((rule) => `- ${rule}`),
    `- ${template[mode]}`,
    `- ${template.userOverride}`,
  ].join('\n')
}

/** @param {string} language @returns {string} 中文显示名。 */
export function languageLabel(language) {
  return language === 'zh-TW' ? '繁體中文' : '简体中文'
}

/** @param {string} mode @returns {string} 中文显示名。 */
export function modeLabel(mode) {
  return mode === 'prefer' ? '宽松模式' : '严格模式'
}
