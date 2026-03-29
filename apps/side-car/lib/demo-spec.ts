export const demoSpec = {
  root: 'app',
  elements: {
    app: {
      type: 'Stack',
      props: { direction: 'column', gap: '4', padding: '4' },
      children: ['title', 'statusLine', 'content'],
    },
    title: {
      type: 'Heading',
      props: { text: 'Hivefiver settings dashboard proof', level: 'h1' },
      children: [] as string[],
    },
    statusLine: {
      type: 'Badge',
      props: { text: 'hm-settings dashboard mode: settings', variant: 'default' },
      children: [] as string[],
    },
    content: {
      type: 'Stack',
      props: { direction: 'row', gap: '4' },
      children: ['pane40', 'pane60'],
    },
    pane40: {
      type: 'Card',
      props: { title: '40 pane · runtime/session mirror' },
      children: ['pane40Body'],
    },
    pane40Body: {
      type: 'Text',
      props: { children: '- sessionId: abc\n- runtimeAuthority: attached-sdk' },
      children: [] as string[],
    },
    pane60: {
      type: 'Card',
      props: { title: '60 pane · Hivefiver settings' },
      children: ['pane60Body'],
    },
    pane60Body: {
      type: 'Text',
      props: { children: '- group: language\n- nextAction: none' },
      children: [] as string[],
    },
  },
}
