import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:'枢 AI · 一个入口直达全球大模型',
  description:'聊天、绘图、视频生成，统一接入全球顶尖 AI 模型。国内直连，无需 VPN。',
  icons:{icon:[{url:'/favicon.ico'}]},
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      </head>
      <body>{children}</body>
    </html>
  )
}
