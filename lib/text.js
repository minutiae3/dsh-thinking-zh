/**
 * 思考语言与回复语言文本模板。
 *
 * - 思考：zh-CN / zh-TW × strict / prefer，独立成段；
 * - 回复：auto（跟随用户）/ zh-CN / zh-TW，需要时独立成段。
 *
 * 模板是常量：同一配置下每次渲染结果完全一致，不会在请求之间抖动。
 */

export const LANGUAGES = ['zh-CN', 'zh-TW']
export const REPLY_LANGUAGES = ['auto', 'zh-CN', 'zh-TW']
export const MODES = ['strict', 'prefer']

const TEMPLATES = {
  'zh-CN': {
    thinkingHeading: '## 思考语言（简体中文）',
    thinkingIntro:
      '你的内部思考与推理（reasoning / thinking）必须始终使用简体中文书写，无论用户使用哪种语言、代码或文档使用哪种语言。',
    thinkingRules: [
      '代码、命令、文件路径、API 名称、变量名、错误原文与专有名词保持原样，不翻译、不改写。',
      '中文推理要保持完整、严谨的推理链条，不省略步骤，也不因为改用中文而降低推理深度。',
    ],
    strict:
      '如果发现自己正在用其他语言思考，立即改回简体中文继续，不必解释，也不必重述已经完成的部分。',
    prefer: '请尽量使用简体中文思考；个别术语或短句使用其他语言可以接受。',
    userOverride: '如果用户在当前对话中明确要求换用其他语言思考，以用户的要求为准。',
    replyAuto: '这条要求只约束内部思考；面向用户的最终回复仍使用用户要求的语言。',
    replyFixed: '这条要求只约束内部思考；面向用户的最终回复语言由「回复语言」段落规定。',
    replyHeading: '## 回复语言（简体中文）',
    replyIntro:
      '面向用户的最终回复必须使用简体中文书写，除非用户在当前对话中明确要求其他语言。',
    replyRules: [
      '代码、命令、文件路径、API 名称、变量名、错误原文与专有名词保持原样，不翻译、不改写。',
      '如果用户明确要求使用其他语言回复，以用户的要求为准。',
    ],
  },
  'zh-TW': {
    thinkingHeading: '## 思考語言（繁體中文）',
    thinkingIntro:
      '你的內部思考與推理（reasoning / thinking）必須始終使用繁體中文書寫，無論使用者使用哪種語言、程式碼或文件使用哪種語言。',
    thinkingRules: [
      '程式碼、指令、檔案路徑、API 名稱、變數名稱、錯誤原文與專有名詞保持原樣，不翻譯、不改寫。',
      '繁體中文推理要保持完整、嚴謹的推理鏈條，不省略步驟，也不因為改用繁體中文而降低推理深度。',
    ],
    strict:
      '如果發現自己正在用其他語言思考，立即改回繁體中文繼續，不必解釋，也不必重述已經完成的部分。',
    prefer: '請盡量使用繁體中文思考；個別術語或短句使用其他語言可以接受。',
    userOverride: '如果使用者在當前對話中明確要求換用其他語言思考，以使用者的要求為準。',
    replyAuto: '這項要求只約束內部思考；面向使用者的最終回覆仍使用使用者要求的語言。',
    replyFixed: '這項要求只約束內部思考；面向使用者的最終回覆語言由「回覆語言」段落規定。',
    replyHeading: '## 回覆語言（繁體中文）',
    replyIntro:
      '面向使用者的最終回覆必須使用繁體中文書寫，除非使用者在當前對話中明確要求其他語言。',
    replyRules: [
      '程式碼、指令、檔案路徑、API 名稱、變數名稱、錯誤原文與專有名詞保持原樣，不翻譯、不改寫。',
      '如果使用者明確要求使用其他語言回覆，以使用者的要求為準。',
    ],
  },
}

/**
 * 把配置规范化为受支持的语言、回复语言与模式；未知值回退默认。
 * @param {object} [options] - `{ thinkingLanguage, replyLanguage, mode }`；`language` 为兼容别名。
 * @returns {{ language: string, replyLanguage: string, mode: string }} 规范化结果。
 */
export function normalizeLanguageOptions(options = {}) {
  const requested =
    options?.thinkingLanguage !== undefined ? options.thinkingLanguage : options?.language
  const language = LANGUAGES.includes(requested) ? requested : 'zh-CN'
  const replyLanguage = REPLY_LANGUAGES.includes(options?.replyLanguage)
    ? options.replyLanguage
    : 'auto'
  const mode = MODES.includes(options?.mode) ? options.mode : 'strict'
  return { language, replyLanguage, mode }
}

/**
 * 渲染思考语言段落。
 * @param {object} [options] - `{ language, replyLanguage, mode }`。
 * @returns {string} 固定段落文本。
 */
export function renderThinkingText(options = {}) {
  const { language, replyLanguage, mode } = normalizeLanguageOptions(options)
  const template = TEMPLATES[language]
  const replyLine = replyLanguage === 'auto' ? template.replyAuto : template.replyFixed
  return [
    template.thinkingHeading,
    '',
    template.thinkingIntro,
    '',
    ...template.thinkingRules.map((rule) => `- ${rule}`),
    `- ${replyLine}`,
    `- ${template[mode]}`,
    `- ${template.userOverride}`,
  ].join('\n')
}

/**
 * 渲染回复语言段落。`auto` 表示不约束回复语言，返回空串。
 * @param {object} [options] - `{ language, replyLanguage }`。
 * @returns {string} 回复语言段落文本，或空串。
 */
export function renderReplyText(options = {}) {
  const { language, replyLanguage } = normalizeLanguageOptions(options)
  if (replyLanguage === 'auto') return ''
  const template = TEMPLATES[language]
  return [
    template.replyHeading,
    '',
    template.replyIntro,
    '',
    ...template.replyRules.map((rule) => `- ${rule}`),
  ].join('\n')
}

/**
 * 兼容旧调用：`renderText` 等价于渲染思考段落。
 * @param {object} [options] - `{ language, replyLanguage, mode }`。
 * @returns {string} 思考语言段落文本。
 */
export function renderText(options = {}) {
  return renderThinkingText(options)
}

/** @param {string} language @returns {string} 中文显示名。 */
export function languageLabel(language) {
  return language === 'zh-TW' ? '繁體中文' : '简体中文'
}

/** @param {string} replyLanguage @returns {string} 中文显示名。 */
export function replyLanguageLabel(replyLanguage) {
  return replyLanguage === 'auto' ? '跟随用户' : languageLabel(replyLanguage)
}

/** @param {string} mode @returns {string} 中文显示名。 */
export function modeLabel(mode) {
  return mode === 'prefer' ? '宽松模式' : '严格模式'
}
