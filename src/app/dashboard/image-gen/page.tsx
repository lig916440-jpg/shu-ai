'use client'
import{useState,useEffect}from'react'
import{useRouter}from'next/navigation'
import Link from'next/link'
import{createClient}from'@/lib/supabase/client'

const SIZES=[
  {label:'正方形 1:1',value:'1024x1024'},
  {label:'横版 16:9',value:'1792x1024'},
  {label:'竖版 9:16',value:'1024x1792'},
]

interface ImageResult{url:string;revised_prompt?:string}

export default function ImageGenPage(){
  const router=useRouter()
  const[ready,setReady]=useState(false)
  const[credits,setCredits]=useState(0)
  const[token,setToken]=useState('')
  const[prompt,setPrompt]=useState('')
  const[size,setSize]=useState('1024x1024')
  const[n,setN]=useState(1)
  const[loading,setLoading]=useState(false)
  const[images,setImages]=useState<ImageResult[]>([])
  const[error,setError]=useState('')

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

  async function generate(){
    if(!prompt.trim()||loading||credits<=0)return
    setLoading(true);setError('');setImages([])
    try{
      const res=await fetch('/api/image-gen',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body:JSON.stringify({prompt,n,size})
      })
      const data=await res.json()
      if(!res.ok){setError(data.error??'生成失败');return}
      setImages(data.images??[])
      setCredits(p=>Math.max(0,p-n))
    }catch(e:any){
      setError(e.message??'网络错误')
    }finally{setLoading(false)}
  }

  if(!ready)return(
    <div style={{background:'#0a0d14',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#8d93a8'}}>加载中...</div>
  )

  return(
    <div style={{background:'#0a0d14',minHeight:'100vh',color:'#edeff7'}}>
      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{backgroundImage:'linear-gradient(rgba(114,99,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(114,99,255,.03) 1px,transparent 1px)',backgroundSize:'56px 56px'}}/>
      <div className="fixed pointer-events-none z-0" style={{width:500,height:500,top:-150,left:-150,borderRadius:'50%',background:'radial-gradient(circle,rgba(114,99,255,.1),transparent)',filter:'blur(60px)'}}/>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-[#1b2030]" style={{background:'rgba(10,13,20,.92)',backdropFilter:'blur(20px)'}}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-[15px] font-bold text-white" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)',boxShadow:'0 0 12px rgba(114,99,255,.4)'}}>枢</div>
            <span className="font-bold text-[17px] hidden sm:block" style={{fontFamily:'Space Grotesk,sans-serif',background:'linear-gradient(90deg,#7263ff,#34e2c4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>枢 AI</span>
          </Link>
          <div className="w-px h-5 bg-[#222838]"/>
          <span className="text-[13px] text-[#8d93a8]">🎨 图片生成</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#161b29] border border-[#222838] rounded-[8px] px-3 py-[6px]">
            <span className="w-[6px] h-[6px] rounded-full bg-[#34e2c4]" style={{boxShadow:'0 0 5px #34e2c4'}}/>
            <span className="text-[12px] text-[#8d93a8] font-mono">{credits.toLocaleString()} 点</span>
          </div>
          <Link href="/dashboard" className="text-[12px] text-[#565c70] hover:text-[#edeff7] transition-colors">← 返回对话</Link>
          <Link href="/dashboard/video-gen" className="text-[12px] text-[#7263ff] hover:text-[#9b8aff] transition-colors">🎬 视频生成</Link>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <div className="w-[60px] h-[60px] rounded-[18px] flex items-center justify-center text-[26px] mx-auto mb-4" style={{background:'linear-gradient(135deg,rgba(114,99,255,.2),rgba(52,226,196,.2))',border:'1px solid rgba(114,99,255,.3)',boxShadow:'0 0 30px rgba(114,99,255,.15)'}}>🎨</div>
          <h1 className="font-bold text-[28px] mb-2" style={{fontFamily:'Space Grotesk,sans-serif'}}>AI 图片生成</h1>
          <p className="text-[14px] text-[#8d93a8]">由 xAI Aurora 模型驱动 · 描述你想要的画面，AI 为你生成</p>
        </div>

        {/* Controls */}
        <div className="rounded-[18px] border border-[#222838] p-6 mb-6" style={{background:'rgba(16,20,31,.9)'}}>
          <label className="block text-[12px] text-[#8d93a8] mb-2 uppercase tracking-wide">描述你想生成的图片</label>
          <textarea
            value={prompt} onChange={e=>setPrompt(e.target.value)}
            placeholder="例如：一只在星空下奔跑的发光独角兽，赛博朋克风格，超高清细节..."
            rows={3}
            className="w-full bg-[#0a0d14] border border-[#222838] rounded-[12px] px-4 py-3 text-[14px] text-[#edeff7] placeholder-[#565c70] outline-none resize-none focus:border-[#7263ff55] transition-colors"
          />

          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[12px] text-[#8d93a8] mb-2">画面比例</label>
              <div className="flex gap-2 flex-wrap">
                {SIZES.map(s=>(
                  <button key={s.value} onClick={()=>setSize(s.value)}
                    className={`px-3 py-[6px] rounded-[8px] text-[12px] border transition-all duration-150 ${size===s.value?'border-[#7263ff] bg-[#7263ff22] text-[#9b8aff]':'border-[#222838] text-[#8d93a8] hover:border-[#444]'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-[#8d93a8] mb-2">生成数量</label>
              <div className="flex gap-2">
                {[1,2,4].map(num=>(
                  <button key={num} onClick={()=>setN(num)}
                    className={`w-[40px] h-[34px] rounded-[8px] text-[13px] font-medium border transition-all duration-150 ${n===num?'border-[#7263ff] bg-[#7263ff22] text-[#9b8aff]':'border-[#222838] text-[#8d93a8] hover:border-[#444]'}`}>
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5">
            <p className="text-[12px] text-[#565c70]">消耗额度：每张 1 点 · 本次约 {n} 点</p>
            <button onClick={generate} disabled={loading||!prompt.trim()||credits<=0}
              className="flex items-center gap-2 px-6 py-[10px] rounded-[12px] text-[14px] font-semibold text-white disabled:opacity-40 transition-all hover:scale-[1.02] hover:opacity-90"
              style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)',boxShadow:'0 3px 16px rgba(114,99,255,.4)'}}>
              {loading?(
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>生成中...</>
              ):<>✨ 生成图片</>}
            </button>
          </div>
        </div>

        {/* Error */}
        {error&&(
          <div className="rounded-[12px] border border-[#ff6f5e44] bg-[#ff6f5e11] px-4 py-3 mb-6 text-[13px] text-[#ff8a7c]">⚠️ {error}</div>
        )}

        {/* Loading skeleton */}
        {loading&&(
          <div className={`grid gap-4 mb-6 ${n===1?'grid-cols-1 max-w-[500px] mx-auto':n===2?'grid-cols-2':'grid-cols-2'}`}>
            {Array.from({length:n}).map((_,i)=>(
              <div key={i} className="rounded-[14px] border border-[#222838] overflow-hidden" style={{aspectRatio:size==='1792x1024'?'16/9':size==='1024x1792'?'9/16':'1/1',background:'rgba(16,20,31,.8)'}}>
                <div className="w-full h-full flex items-center justify-center" style={{minHeight:200}}>
                  <div className="text-center">
                    <div className="animate-pulse text-[32px] mb-3">🎨</div>
                    <p className="text-[12px] text-[#565c70]">AI 正在创作...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {images.length>0&&(
          <div>
            <p className="text-[11px] text-[#565c70] uppercase tracking-wide mb-4">生成结果 · {images.length} 张</p>
            <div className={`grid gap-4 ${images.length===1?'grid-cols-1 max-w-[500px] mx-auto':images.length===2?'grid-cols-2':'grid-cols-2'}`}>
              {images.map((img,i)=>(
                <div key={i} className="group relative rounded-[14px] border border-[#222838] overflow-hidden transition-all duration-200 hover:border-[#7263ff55] hover:shadow-[0_4px_24px_rgba(114,99,255,.15)]">
                  <img src={img.url} alt={`生成图片 ${i+1}`} className="w-full h-auto block"/>
                  <div className="absolute inset-0 bg-[#0a0d14cc] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <a href={img.url} download={`shu-ai-image-${i+1}.png`} target="_blank" rel="noreferrer"
                      className="px-4 py-2 rounded-[8px] text-[12px] font-medium text-white"
                      style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)'}}>
                      ↓ 下载
                    </a>
                    <a href={img.url} target="_blank" rel="noreferrer"
                      className="px-4 py-2 rounded-[8px] text-[12px] font-medium text-[#edeff7] border border-[#444] hover:border-[#7263ff]">
                      ↗ 查看原图
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {credits<=0&&(
          <div className="text-center py-8">
            <p className="text-[14px] text-[#8d93a8] mb-4">额度不足，无法生成图片</p>
            <Link href="/redeem" className="inline-block px-6 py-3 rounded-[12px] text-[14px] font-semibold text-white" style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)'}}>去充值</Link>
          </div>
        )}
      </main>
    </div>
  )
}
