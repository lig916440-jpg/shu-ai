'use client'
import{useState,useEffect}from'react'
import{useRouter}from'next/navigation'
import Link from'next/link'
import{createClient}from'@/lib/supabase/client'
import ParticleCanvas from'@/components/dashboard/ParticleCanvas'

const DURATIONS=[
  {label:'5 秒',value:5,cost:3},
  {label:'8 秒',value:8,cost:5},
  {label:'10 秒',value:10,cost:8},
]
const ASPECT_RATIOS=[
  {label:'横屏 16:9',value:'16:9',icon:'⬛'},
  {label:'竖屏 9:16',value:'9:16',icon:'🟦'},
  {label:'正方形 1:1',value:'1:1',icon:'⬜'},
]
const QUALITIES=[
  {label:'标准 720p',value:'standard'},
  {label:'高清 1080p',value:'high'},
]

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
    const supabase=createClient()
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(!session){router.replace('/login');return}
      setToken(session.access_token)
      const{data:profile}=await supabase.from('profiles').select('credits').eq('id',session.user.id).single()
      setCredits(profile?.credits??0)
      setReady(true)
    })
  },[])

  const cost=DURATIONS.find(d=>d.value===duration)?.cost??3

  async function generate(){
    if(!prompt.trim()||loading||credits<cost)return
    setLoading(true);setError('');setVideoUrl('');setElapsed(0)
    const t0=Date.now()
    const timer=setInterval(()=>setElapsed(Math.floor((Date.now()-t0)/1000)),1000)
    try{
      const res=await fetch('/api/video-gen',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body:JSON.stringify({prompt,duration,aspectRatio,quality})
      })
      const data=await res.json()
      if(!res.ok){setError(data.error??'生成失败');return}
      setVideoUrl(data.videoUrl??'')
      setCredits(p=>Math.max(0,p-cost))
    }catch(e:any){
      setError(e.message??'网络错误，请重试')
    }finally{setLoading(false);clearInterval(timer)}
  }

  if(!ready)return(
    <div style={{background:'#0a0d14',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#8d93a8'}}>加载中...</div>
  )

  return(
    <div style={{background:'#080b12',minHeight:'100vh',color:'#edeff7'}}>
      <ParticleCanvas/>
      <div className="fixed inset-0 pointer-events-none z-0" style={{backgroundImage:'linear-gradient(rgba(114,99,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(114,99,255,.025) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
      <div className="fixed pointer-events-none z-0" style={{width:500,height:500,top:-150,right:-150,borderRadius:'50%',background:'radial-gradient(circle,rgba(52,226,196,.06),transparent)',filter:'blur(60px)'}}/>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-[#1b2030]" style={{background:'rgba(10,13,20,.92)',backdropFilter:'blur(20px)'}}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-[15px] font-bold text-white" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)',boxShadow:'0 0 12px rgba(114,99,255,.4)'}}>枢</div>
            <span className="font-bold text-[17px] hidden sm:block" style={{fontFamily:'Space Grotesk,sans-serif',background:'linear-gradient(90deg,#7263ff,#34e2c4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>枢 AI</span>
          </Link>
          <div className="w-px h-5 bg-[#222838]"/>
          <span className="text-[13px] text-[#8d93a8]">🎬 视频生成</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#161b29] border border-[#222838] rounded-[8px] px-3 py-[6px]">
            <span className="w-[6px] h-[6px] rounded-full bg-[#34e2c4]" style={{boxShadow:'0 0 5px #34e2c4'}}/>
            <span className="text-[12px] text-[#8d93a8] font-mono">{credits.toLocaleString()} 点</span>
          </div>
          <Link href="/dashboard" className="text-[12px] text-[#565c70] hover:text-[#edeff7] transition-colors">← 返回对话</Link>
          <Link href="/dashboard/image-gen" className="text-[12px] text-[#7263ff] hover:text-[#9b8aff] transition-colors">🎨 图片生成</Link>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-[860px] mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <div className="w-[60px] h-[60px] rounded-[18px] flex items-center justify-center text-[26px] mx-auto mb-4" style={{background:'linear-gradient(135deg,rgba(52,226,196,.2),rgba(114,99,255,.2))',border:'1px solid rgba(52,226,196,.3)',boxShadow:'0 0 30px rgba(52,226,196,.1)'}}>🎬</div>
          <h1 className="font-bold text-[28px] mb-2" style={{fontFamily:'Space Grotesk,sans-serif'}}>AI 视频生成</h1>
          <p className="text-[14px] text-[#8d93a8]">由 Google Gemini Veo 2 驱动 · 文字描述，AI 生成短视频</p>
        </div>

        {/* Controls */}
        <div className="rounded-[18px] border border-[#222838] p-6 mb-6" style={{background:'rgba(16,20,31,.9)'}}>
          <label className="block text-[12px] text-[#8d93a8] mb-2 uppercase tracking-wide">描述你想生成的视频内容</label>
          <textarea
            value={prompt} onChange={e=>setPrompt(e.target.value)}
            placeholder="例如：一只海豚在波光粼粼的海面跳跃，慢镜头，史诗级镜头，超清画质..."
            rows={3}
            className="w-full bg-[#0a0d14] border border-[#222838] rounded-[12px] px-4 py-3 text-[14px] text-[#edeff7] placeholder-[#565c70] outline-none resize-none focus:border-[#34e2c455] transition-colors"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            {/* Duration */}
            <div>
              <label className="block text-[12px] text-[#8d93a8] mb-2">视频时长</label>
              <div className="flex flex-col gap-2">
                {DURATIONS.map(d=>(
                  <button key={d.value} onClick={()=>setDuration(d.value)}
                    className={`px-3 py-[8px] rounded-[9px] text-[12.5px] border text-left flex justify-between items-center transition-all duration-150 ${duration===d.value?'border-[#34e2c4] bg-[#34e2c422] text-[#34e2c4]':'border-[#222838] text-[#8d93a8] hover:border-[#444]'}`}>
                    <span>{d.label}</span>
                    <span className="text-[11px] opacity-70">{d.cost} 点</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-[12px] text-[#8d93a8] mb-2">画面比例</label>
              <div className="flex flex-col gap-2">
                {ASPECT_RATIOS.map(ar=>(
                  <button key={ar.value} onClick={()=>setAspectRatio(ar.value)}
                    className={`px-3 py-[8px] rounded-[9px] text-[12.5px] border text-left flex items-center gap-2 transition-all duration-150 ${aspectRatio===ar.value?'border-[#34e2c4] bg-[#34e2c422] text-[#34e2c4]':'border-[#222838] text-[#8d93a8] hover:border-[#444]'}`}>
                    <span>{ar.icon}</span>{ar.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-[12px] text-[#8d93a8] mb-2">视频质量</label>
              <div className="flex flex-col gap-2">
                {QUALITIES.map(q=>(
                  <button key={q.value} onClick={()=>setQuality(q.value)}
                    className={`px-3 py-[8px] rounded-[9px] text-[12.5px] border text-left transition-all duration-150 ${quality===q.value?'border-[#7263ff] bg-[#7263ff22] text-[#9b8aff]':'border-[#222838] text-[#8d93a8] hover:border-[#444]'}`}>
                    {q.label}
                  </button>
                ))}
                <div className="px-3 py-[8px] rounded-[9px] border border-[#1b2030] text-[11px] text-[#565c70]">
                  生成需 30-90 秒，请耐心等待
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5">
            <p className="text-[12px] text-[#565c70]">本次消耗：{cost} 点额度 · 当前余额 {credits} 点</p>
            <button onClick={generate} disabled={loading||!prompt.trim()||credits<cost}
              className="flex items-center gap-2 px-6 py-[10px] rounded-[12px] text-[14px] font-semibold text-white disabled:opacity-40 transition-all hover:scale-[1.02] hover:opacity-90"
              style={{background:'linear-gradient(100deg,#34c4b2,#34e2c4)',boxShadow:'0 3px 16px rgba(52,226,196,.3)'}}>
              {loading?(
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>生成中 {elapsed}s...</>
              ):<>✨ 生成视频</>}
            </button>
          </div>
        </div>

        {/* Error */}
        {error&&(
          <div className="rounded-[12px] border border-[#ff6f5e44] bg-[#ff6f5e11] px-4 py-3 mb-6 text-[13px] text-[#ff8a7c]">⚠️ {error}</div>
        )}

        {/* Loading state */}
        {loading&&(
          <div className="rounded-[14px] border border-[#222838] overflow-hidden mb-6" style={{background:'rgba(16,20,31,.8)'}}>
            <div className="flex items-center justify-center py-16 flex-col gap-4">
              <div className="relative">
                <div className="w-[64px] h-[64px] rounded-full border-2 border-[#1b2030] flex items-center justify-center text-[26px]">🎬</div>
                <div className="absolute inset-0 rounded-full border-t-2 border-[#34e2c4] animate-spin"/>
              </div>
              <div className="text-center">
                <p className="text-[14px] text-[#edeff7] font-medium mb-1">AI 正在生成视频</p>
                <p className="text-[12px] text-[#565c70]">已等待 {elapsed} 秒，预计总计 30-90 秒</p>
              </div>
              <div className="flex gap-1">
                {[0,1,2].map(i=>(
                  <div key={i} className="w-[6px] h-[6px] rounded-full bg-[#34e2c4]" style={{animation:`pulse 1.2s ease-in-out ${i*0.4}s infinite`}}/>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Video result */}
        {videoUrl&&(
          <div className="rounded-[14px] border border-[#222838] overflow-hidden" style={{background:'rgba(16,20,31,.9)'}}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1b2030]">
              <span className="text-[12px] text-[#8d93a8]">✅ 视频生成完成</span>
              <a href={videoUrl} download="shu-ai-video.mp4" target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-[5px] rounded-[7px] text-[12px] text-white"
                style={{background:'linear-gradient(100deg,#34c4b2,#34e2c4)'}}>
                ↓ 下载视频
              </a>
            </div>
            <video controls className="w-full" style={{maxHeight:480}}>
              <source src={videoUrl} type="video/mp4"/>
              您的浏览器不支持视频播放，请<a href={videoUrl} className="text-[#34e2c4]">点此下载</a>。
            </video>
          </div>
        )}

        {credits<cost&&!loading&&(
          <div className="text-center py-8">
            <p className="text-[14px] text-[#8d93a8] mb-4">额度不足（需要 {cost} 点，当前 {credits} 点）</p>
            <Link href="/redeem" className="inline-block px-6 py-3 rounded-[12px] text-[14px] font-semibold text-white" style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)'}}>去充值</Link>
          </div>
        )}
      </main>
    </div>
  )
}
