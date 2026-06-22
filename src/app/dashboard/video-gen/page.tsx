'use client'
import{useState,useEffect}from'react'
import{useRouter}from'next/navigation'
import Link from'next/link'
import{createClient}from'@/lib/supabase/client'

const DURATIONS=[{label:'5 秒',value:5,cost:3},{label:'8 秒',value:8,cost:5},{label:'10 秒',value:10,cost:8}]
const ASPECT_RATIOS=[{label:'横屏 16:9',value:'16:9'},{label:'竖屏 9:16',value:'9:16'},{label:'正方形 1:1',value:'1:1'}]
const QUALITIES=[{label:'标准 720p',value:'standard'},{label:'高清 1080p',value:'high'}]

const EXAMPLES=['一只海豚在波光粼粼的海面跳跃，慢镜头，史诗级画面','樱花飘落的日本小巷，黄昏，电影感','赛博朋克都市夜雨，霓虹倒影，无人机俯拍']

export default function VideoGenPage(){
  const router=useRouter()
  const[ready,setReady]=useState(false)
  const[credits,setCredits]=useState(0)
  const[token,setToken]=useState('')
  const[prompt,setPrompt]=useState('')
  const[duration,setDuration]=useState(5)
  const[aspectRatio,setAspectRatio]=useState('16:9')
  const[quality,setQuality]=useState('standard')
  const[loading,setLoading]=useState(false)
  const[videoUrl,setVideoUrl]=useState('')
  const[error,setError]=useState('')
  const[elapsed,setElapsed]=useState(0)

  useEffect(()=>{
    createClient().auth.getSession().then(async({data:{session}})=>{
      if(!session){router.replace('/login');return}
      setToken(session.access_token)
      const{data:profile}=await createClient().from('profiles').select('credits').eq('id',session.user.id).single()
      setCredits(profile?.credits??0);setReady(true)
    })
  },[])

  const cost=DURATIONS.find(d=>d.value===duration)?.cost??3

  async function generate(){
    if(!prompt.trim()||loading||credits<cost)return
    setLoading(true);setError('');setVideoUrl('');setElapsed(0)
    const t0=Date.now()
    const timer=setInterval(()=>setElapsed(Math.floor((Date.now()-t0)/1000)),1000)
    try{
      const res=await fetch('/api/video-gen',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({prompt,duration,aspectRatio,quality})})
      const data=await res.json()
      if(!res.ok){setError(data.error??'生成失败');return}
      setVideoUrl(data.videoUrl??'');setCredits(p=>Math.max(0,p-cost))
    }catch(e:any){setError(e.message??'网络错误，请重试')}
    finally{setLoading(false);clearInterval(timer)}
  }

  if(!ready)return(
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--black)'}}>
      <div className="flex items-center gap-3" style={{color:'var(--text-2)'}}>
        <svg className="w-4 h-4" style={{animation:'rotate 1s linear infinite'}} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20"/></svg>
        加载中...
      </div>
    </div>
  )

  return(
    <div className="min-h-screen" style={{background:'var(--black)'}}>
      <div className="fixed inset-0 pointer-events-none z-0" style={{background:'radial-gradient(ellipse 60% 50% at 20% 80%,rgba(245,158,11,.05),transparent)'}}/>

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 h-[58px]" style={{background:'rgba(8,8,9,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)'}}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center font-bold text-[13px] text-black" style={{background:'var(--amber)',fontFamily:'Syne,sans-serif'}}>枢</div>
            <span className="font-display font-bold text-[16px] hidden sm:block" style={{color:'var(--text)'}}>枢 AI</span>
          </Link>
          <div className="w-px h-4" style={{background:'var(--border-h)'}}/>
          <div className="flex items-center gap-1.5 text-[13px]" style={{color:'var(--text-2)'}}>
            <span className="text-[15px]">🎬</span>
            <span>视频生成</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-[6px] rounded-[8px]" style={{background:'var(--raised)',border:'1px solid var(--border)'}}>
            <span className="w-[5px] h-[5px] rounded-full" style={{background:'var(--amber)',boxShadow:'0 0 5px var(--amber)'}}/>
            <span className="text-[12px] font-mono-custom font-medium" style={{color:'var(--amber)'}}>{credits.toLocaleString()}</span>
            <span className="text-[10px]" style={{color:'var(--text-3)'}}>pts</span>
          </div>
          <Link href="/dashboard/image-gen" className="btn btn-ghost text-[12px] px-3 py-[6px]">🎨 图片</Link>
          <Link href="/dashboard" className="btn btn-ghost text-[12px] px-3 py-[6px]">← 对话</Link>
        </div>
      </header>

      <main className="relative z-10 max-w-[860px] mx-auto px-6 py-10">

        {/* Hero */}
        <div className="text-center mb-10 fade-up">
          <div className="w-[58px] h-[58px] rounded-[16px] flex items-center justify-center text-[24px] mx-auto mb-4 float" style={{background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.2)'}}>🎬</div>
          <h1 className="font-display font-bold mb-2" style={{fontSize:'clamp(22px,4vw,32px)',color:'var(--text)'}}>AI 视频生成</h1>
          <p className="text-[14px]" style={{color:'var(--text-2)'}}>Google Gemini Veo 2 驱动 · 文字描述生成短视频</p>
        </div>

        {/* Controls */}
        <div className="card p-6 mb-5 fade-up-1">
          <label className="block text-[11px] uppercase tracking-[.1em] font-semibold mb-2.5" style={{color:'var(--text-3)'}}>描述你想生成的视频内容</label>
          <div className="mb-4">
            <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
              placeholder="例如：一只海豚在波光粼粼的海面跳跃，慢镜头，史诗级镜头，超清画质..."
              rows={3} className="w-full bg-transparent border-none outline-none text-[14px] resize-none leading-relaxed" style={{color:'var(--text)'}}/>
            <div className="border-t mt-1 pt-1" style={{borderColor:'var(--border)'}}>
              <p className="text-[11px]" style={{color:'var(--text-3)'}}>灵感：
                {EXAMPLES.map((ex,i)=>(
                  <button key={i} onClick={()=>setPrompt(ex)} className="ml-2 underline underline-offset-2 hover:opacity-80 transition-opacity" style={{color:'var(--text-3)'}}>示例{i+1}</button>
                ))}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
            <div>
              <label className="block text-[11px] uppercase tracking-[.1em] font-semibold mb-2" style={{color:'var(--text-3)'}}>视频时长</label>
              <div className="flex flex-col gap-1.5">
                {DURATIONS.map(d=>(
                  <button key={d.value} onClick={()=>setDuration(d.value)}
                    className={`btn text-[12.5px] px-3 py-[8px] justify-between ${duration===d.value?'btn-amber-ghost':'btn-ghost'}`}>
                    <span>{d.label}</span>
                    <span className="text-[11px]" style={{color:duration===d.value?'var(--amber)':'var(--text-3)'}}>{d.cost} pt</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[.1em] font-semibold mb-2" style={{color:'var(--text-3)'}}>画面比例</label>
              <div className="flex flex-col gap-1.5">
                {ASPECT_RATIOS.map(ar=>(
                  <button key={ar.value} onClick={()=>setAspectRatio(ar.value)}
                    className={`btn text-[12.5px] px-3 py-[8px] justify-start ${aspectRatio===ar.value?'btn-amber-ghost':'btn-ghost'}`}>
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[.1em] font-semibold mb-2" style={{color:'var(--text-3)'}}>视频质量</label>
              <div className="flex flex-col gap-1.5">
                {QUALITIES.map(q=>(
                  <button key={q.value} onClick={()=>setQuality(q.value)}
                    className={`btn text-[12.5px] px-3 py-[8px] justify-start ${quality===q.value?'btn-amber-ghost':'btn-ghost'}`}>
                    {q.label}
                  </button>
                ))}
                <div className="px-3 py-[8px] rounded-[var(--r-s)] text-[11px]" style={{background:'var(--raised)',color:'var(--text-3)'}}>
                  预计 30-90 秒
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4" style={{borderTop:'1px solid var(--border)'}}>
            <span className="text-[12px]" style={{color:'var(--text-3)'}}>本次消耗：<span style={{color:'var(--amber)'}}>{cost} pt</span> · 余额 {credits} pt</span>
            <button onClick={generate} disabled={loading||!prompt.trim()||credits<cost} className="btn btn-primary text-[14px] px-6 py-[10px]">
              {loading?(
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" style={{animation:'rotate 1s linear infinite'}} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20"/></svg>
                  生成中 {elapsed}s...
                </span>
              ):'✨ 生成视频'}
            </button>
          </div>
        </div>

        {error&&(
          <div className="px-4 py-3 rounded-[10px] mb-5 text-[13px]" style={{background:'rgba(244,63,94,.08)',border:'1px solid rgba(244,63,94,.25)',color:'#f87171'}}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading&&(
          <div className="card p-12 mb-5 fade-up text-center">
            <div className="w-[60px] h-[60px] rounded-full mx-auto mb-5 flex items-center justify-center text-[22px] relative">
              <span style={{animation:'float 2s ease-in-out infinite'}}>🎬</span>
              <div className="absolute inset-0 rounded-full" style={{border:'2px solid var(--border)'}}/>
              <div className="absolute inset-0 rounded-full border-t-2" style={{borderColor:'var(--amber)',animation:'rotate 1.2s linear infinite'}}/>
            </div>
            <p className="font-semibold mb-1.5" style={{color:'var(--text)'}}>AI 正在生成视频</p>
            <p className="text-[13px] mb-4" style={{color:'var(--text-3)'}}>已等待 {elapsed} 秒 · 预计 30-90 秒</p>
            <div className="flex justify-center gap-1.5">
              <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
            </div>
          </div>
        )}

        {/* Result */}
        {videoUrl&&(
          <div className="card overflow-hidden fade-up">
            <div className="flex items-center justify-between px-5 py-3" style={{borderBottom:'1px solid var(--border)'}}>
              <div className="flex items-center gap-2">
                <span className="w-[6px] h-[6px] rounded-full" style={{background:'#4ade80'}}/>
                <span className="text-[13px]" style={{color:'var(--text-2)'}}>视频生成完成</span>
              </div>
              <a href={videoUrl} download="shu-ai-video.mp4" target="_blank" rel="noreferrer"
                className="btn btn-primary text-[12px] px-4 py-[7px]">↓ 下载视频</a>
            </div>
            <video controls className="w-full" style={{maxHeight:480}}>
              <source src={videoUrl} type="video/mp4"/>
              <a href={videoUrl} style={{color:'var(--amber)'}}>点此下载</a>
            </video>
          </div>
        )}

        {credits<cost&&!loading&&(
          <div className="text-center py-10">
            <p className="text-[14px] mb-4" style={{color:'var(--text-2)'}}>额度不足（需要 {cost} pt，当前 {credits} pt）</p>
            <Link href="/redeem" className="btn btn-primary text-[14px] px-6 py-[10px]">去充值</Link>
          </div>
        )}
      </main>
    </div>
  )
}
