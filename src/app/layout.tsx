import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title:'枢 AI · 一个入口直达全球大模型', description:'聊天、绘图、视频生成，统一接入全球顶尖模型。国内直连，无需 VPN。' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>
}
