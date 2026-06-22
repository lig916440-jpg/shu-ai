'use client'
import{useState,useEffect}from'react'
import{useRouter}from'next/navigation'
import Link from'next/link'
import{createClient}from'@/lib/supabase/client'

const SIZES=[
  {label:'正方形 1:1',value:'1024x1024',icon:'⬜'},
  {label:'横版 16:9',value:'1792x1024',icon:'⬛'},
  {label:'竖版 9:16',value:'1024x1792',icon:'🟦'},
]
interface ImageResult{url:string;revised_prompt?:string}

const EXAMPLES=['一只在星空下奔跑的发光独角兽，赛博朋克风格','未来城市夜景，霓虹倒影，下雨，超写实','蒸汽朋克飞艇在云层穿梭，黄金色调','侘寂风格竹林，晨雾，极简构图，电影感']

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
    createClient().auth.getSession().then(async({data:{session}})=>{
      if(!session){router.replace('/login');return}
      setToken(session.access_token)
      const{data:profile}=await createClient().from('profiles').select('credits').eq('id',session.user.id).single()
      setCredits(profile?.credits??0);setReady(true)
    })
  },[])

  async function generate(){
    if(!prompt.trim()||loading||credits<=0)return
    setLoading(true);setError('');setImages([])
    try{
      const res=await fetch('/api/image-gen',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({prompt,n,size})})
      const data=await res.json()
      if(!res.ok){setError(data.error??'生成失败');return}
      setImages(data.images??[]);setCredits(p=>Math.max(0,p-n))
    }catch(e:any){setError(e.message??'网络错误')}
    finally{setLoading(false)}
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
      <div className="fixed inset-0 pointer-events-none z-0" style={{background:'radial-gradient(ellipse 60% 50% at 80% 20%,rgba(245,158,11,.05),transparent)'}}/>

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 h-[58px]" style={{background:'rgba(8,8,9,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)'}}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center font-bold text-[13px] text-black" style={{background:'var(--amber)',fontFamily:'Syne,sans-serif'}}>枢</div>
            <span className="font-display font-bold text-[16px] hidden sm:block" style={{color:'var(--text)'}}>枢 AI</span>
          </Link>
          <div className="w-px h-4" style={{background:'var(--border-h)'}}/>
          <div className="flex items-center gap-1.5 text-[13px]" style={{color:'var(--text-2)'}}>
            <span className="text-[15px]">🎨</span>
            <span>图片生成</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-[6px] rounded-[8px]" style={{background:'var(--raised)',border:'1px solid var(--border)'}}>
            <span className="w-[5px] h-[5px] rounded-full" style={{background:'var(--amber)',boxShadow:'0 0 5px var(--amber)'}}/>
            <span className="text-[12px] font-mono-custom font-medium" style={{color:'var(--amber)'}}>{credits.toLocaleString()}</span>
            <span className="text-[10px]" style={{color:'var(--text-3)'}}>pts</span>
          </div>
          <Link href="/dashboard/video-gen" className="btn btn-ghost text-[12px] px-3 py-[6px]">🎬 视频生成</Link>
          <Link href="/dashboard" className="btn btn-ghost text-[12px] px-3 py-[6px]">← 对话</Link>
        </div>
      </header>

      <main className="relative z-10 max-w-[900px] mx-auto px-6 py-10">

        {/* Hero */}
        <div className="text-center mb-10 fade-up">
          <div className="w-[58px] h-[58px] rounded-[16px] flex items-center justify-center text-[24px] mx-auto mb-4 float" style={{background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.2)'}}>🎨</div>
          <h1 className="font-display font-bold mb-2" style={{fontSize:'clamp(22px,4vw,32px)',color:'var(--text)'}}>AI 图片生成</h1>
          <p className="text-[14px]" style={{color:'var(--text-2)'}}>xAI Aurora 模型驱动 · 描述即出图</p>
        </div>

        {/* Controls */}
        <div className="card p-6 mb-5 fade-up-1">
          <label className="block text-[11px] uppercase tracking-[.1em] font-semibold mb-2.5" style={{color:'var(--text-3)'}}>描述你想生成的画面</label>
          <div className="relative mb-4">
            <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
              placeholder="例如：一只在星空下奔跑的发光独角兽，赛博朋克风格，超高清细节..."
              rows={3} className="w-full bg-transparent border-none outline-none text-[14px] resize-none leading-relaxed" style={{color:'var(--text)'}}/>
            <div className="border-t mt-1 pt-1" style={{borderColor:'var(--border)'}}>
              <p className="text-[11px]" style={{color:'var(--text-3)'}}>灵感：
                {EXAMPLES.map((ex,i)=>(
                  <button key={i} onClick={()=>setPrompt(ex)} className="ml-2 underline underline-offset-2 hover:opacity-80 transition-opacity" style={{color:'var(--text-3)'}}>示例{i+1}</button>
                ))}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mb-5">
            <div>
              <label className="block text-[11px] uppercase tracking-[.1em] font-semibold mb-2" style={{color:'var(--text-3)'}}>画面比例</label>
              <div className="flex gap-2">
                {SIZES.map(s=>(
                  <button key={s.value} onClick={()=>setSize(s.value)}
                    className={`btn text-[12.5px] px-3 py-[7px] ${size===s.value?'btn-amber-ghost':'btn-ghost'}`}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[.1em] font-semibold mb-2" style={{color:'var(--text-3)'}}>生成数量</label>
              <div className="flex gap-2">
                {[1,2,4].map(num=>(
                  <button key={num} onClick={()=>setN(num)}
                    className={`btn w-[40px] h-[34px] text-[13px] font-semibold p-0 ${n===num?'btn-amber-ghost':'btn-ghost'}`}>
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4" style={{borderTop:'1px solid var(--border)'}}>
            <span className="text-[12px]" style={{color:'var(--text-3)'}}>消耗：每张 1 pt · 本次约 <span style={{color:'var(--amber)'}}>{n} pt</span> · 余额 {credits} pt</span>
            <button onClick={generate} disabled={loading||!prompt.trim()||credits<=0} className="btn btn-primary text-[14px] px-6 py-[10px]">
              {loading?(
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" style={{animation:'rotate 1s linear infinite'}} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20"/></svg>
                  生成中...
                </span>
              ):'✨ 生成图片'}
            </button>
          </div>
        </div>

        {error&&(
          <div className="px-4 py-3 rounded-[10px] mb-5 text-[13px]" style={{background:'rgba(244,63,94,.08)',border:'1px solid rgba(244,63,94,.25)',color:'#f87171'}}>
            ⚠️ {error}
          </div>
        )}

        {/* Skeleton */}
        {loading&&(
          <div className={`grid gap-4 mb-5 ${n===1?'grid-cols-1 max-w-[480px] mx-auto':n===2?'grid-cols-2':'grid-cols-2'}`}>
            {Array.from({length:n}).map((_,i)=>(
              <div key={i} className="card overflow-hidden" style={{aspectRatio:size==='1792x1024'?'16/9':size==='1024x1792'?'9/16':'1/1',minHeight:200}}>
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="text-[28px]" style={{animation:'float 2s ease-in-out infinite',animationDelay:`${i*.3}s`}}>🎨</div>
                  <div className="flex gap-1">
                    <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {images.length>0&&(
          <div className="fade-up">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-[.1em] font-semibold" style={{color:'var(--text-3)'}}>生成结果 · {images.length} 张</p>
              <button onClick={()=>setImages([])} className="text-[12px] hover:opacity-80 transition-opacity" style={{color:'var(--text-3)'}}>清除</button>
            </div>
            <div className={`grid gap-4 ${images.length===1?'grid-cols-1 max-w-[480px] mx-auto':images.length===2?'grid-cols-2':'grid-cols-2'}`}>
              {images.map((img,i)=>(
                <div key={i} className="card overflow-hidden group cursor-pointer" style={{transition:'all .2s'}}>
                  <div className="relative">
                    <img src={img.url} alt={`生成图片 ${i+1}`} className="w-full h-auto block"/>
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{background:'rgba(8,8,9,.7)'}}>
                      <a href={img.url} download={`shu-ai-image-${i+1}.png`} target="_blank" rel="noreferrer"
                        className="btn btn-primary text-[12px] px-4 py-[8px]">↓ 下载</a>
                      <a href={img.url} target="_blank" rel="noreferrer"
                        className="btn btn-ghost text-[12px] px-4 py-[8px]">↗ 查看</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {credits<=0&&!loading&&(
          <div className="text-center py-10">
            <p className="text-[14px] mb-4" style={{color:'var(--text-2)'}}>额度不足，无法生成图片</p>
            <Link href="/redeem" className="btn btn-primary text-[14px] px-6 py-[10px]">去充值</Link>
          </div>
        )}
      </main>
    </div>
  )
}
