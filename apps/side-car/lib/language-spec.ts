/**
 * Creates a json-render spec for language selection UI.
 * Shows communication language, document language, and UI language options.
 */
export function createLanguageSpec(currentConfig: Record<string, unknown>) {
  const chatLang = String(currentConfig.chatLanguage ?? 'en')
  const artifactLang = String(currentConfig.artifactLanguage ?? 'en')

  return {
    root: 'app',
    elements: {
      app: {
        type: 'Stack',
        props: { direction: 'column', gap: '4', padding: '4' },
        children: ['title', 'badge', 'langSection'],
      },
      title: {
        type: 'Heading',
        props: { text: 'HiveMind Language Settings', level: 'h1' },
        children: [],
      },
      badge: {
        type: 'Badge',
        props: { text: 'Connected to OpenCode server', variant: 'default' },
        children: [],
      },
      langSection: {
        type: 'Card',
        props: { title: 'Language Configuration' },
        children: ['langContent'],
      },
      langContent: {
        type: 'Stack',
        props: { direction: 'column', gap: '3' },
        children: ['commLang', 'docLang', 'currentValues'],
      },
      commLang: {
        type: 'Select',
        props: {
          label: 'Communication Language',
          name: 'chatLanguage',
          options: ['en', 'vi', 'zh', 'ko', 'ja'],
          value: chatLang,
        },
        children: [],
      },
      docLang: {
        type: 'Select',
        props: {
          label: 'Document Language',
          name: 'artifactLanguage',
          options: ['en', 'vi', 'zh', 'ko', 'ja'],
          value: artifactLang,
        },
        children: [],
      },
      currentValues: {
        type: 'Text',
        props: {
          children: `Current: chat=${chatLang}, artifact=${artifactLang}`,
          variant: 'muted',
        },
        children: [],
      },
    },
  }
}