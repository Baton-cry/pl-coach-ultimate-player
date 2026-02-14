module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg0:'#07070a', bg1:'#0c0d12', bg2:'#10121a', card:'#0f121b',
        stroke:'rgba(255,255,255,0.09)',
        text:'#f3f4f6', mut:'#a7b0bf',
        red:'#ef4444', red2:'#fb7185', ok:'#22c55e', warn:'#f59e0b'
      },
      boxShadow: { glow:'0 0 0 1px rgba(239,68,68,0.22), 0 0 44px rgba(239,68,68,0.12)' }
    }
  },
  plugins: []
}
