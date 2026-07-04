/* The pre-written first message of the demo conversation. Pure data with no
   side effects, so normal builds tree-shake it away entirely. */

export const demoPrompt = (lang) =>
  String(lang || '').startsWith('it')
    ? 'Un on the road in Islanda a inizio agosto: cascate, ghiacciai, spiagge nere e qualche bagno caldo. Siamo in due e guidiamo volentieri.'
    : 'A road trip in Iceland in early August: waterfalls, glaciers, black beaches and a hot soak or two. Two of us, happy to drive.'
