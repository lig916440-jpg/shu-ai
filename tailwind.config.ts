import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: {
      bg:'#0a0d14',surface:'#10141f',elevated:'#161b29',
      border:'#222838','border-soft':'#1b2030',
      violet:'#7263ff',teal:'#34e2c4',coral:'#ff6f5e',
      primary:'#edeff7',muted:'#8d93a8',dim:'#565c70',
    },
    fontFamily: {
      grotesk:['Space Grotesk','sans-serif'],
      sans:['Inter','sans-serif'],
      mono:['JetBrains Mono','monospace'],
    },
  }},
  plugins:[],
}
export default config
