'use client'
import{useState,useRef,useEffect,useCallback}from'react'
import Link from'next/link'
import{createClient}from'@/lib/supabase/client'
import{useRouter}from'next/navigation'

interface Model{id:string;name:string;provider:string;price_per_unit:number}
interface Message{role:'user'|'assistant';content:string;model?:string;elapsed?:number}
interface Session{id:string;title:string;messages:Message[];modelName:string}
interface Props{user:{id:string;email:string};initialCredits:number;models:Model[]}

function genId(){return Math.random().toString(36).slice(2)}

const QUICK_PROMPTS=[
  {icon:'🔍',label:'深度分析',text:'请对以下内容进行深度分析：'},
  {icon:'💻',label:'代码设计',text:'帮我设计并实现以下功能的代码：'},
  {icon:'✍️',label:'创意写作',text:'帮我创作一篇关于'},
  {icon:'📚',label:'知识问答',text:'请详细解释一下'},
]

const FEATURE_CARDS=[
  {icon:'🌐',title:'联网搜索',desc:'实时获取最新信息，回答更准确',color:'#7263ff'},
  {icon:'🤖',title:'多模型',desc:'DeepSeek / GPT / Claude 自由切换',color:'#34e2c4'},
  {icon:'⚡',title:'极速响应',desc:'流式输出，毫秒级实时回复',color:'#9b8aff'},
  {icon:'🔒',title:'安全可靠',desc:'数据加密，隐私保护，稳定运行',color:'#ff6f5e'},
]

export default function ChatApp({user,initialCredits,models}:Props){
  const router=useRouter()
  const[credits,setCredits]=useState(initialCredits)
  const[sessions,setSessions]=useState<Session[]>([])
  const[activeId,setActiveId]=useState<string|null>(null)
  const[selectedModel,setSelectedModel]=useState(models[0]?.name??'deepseek-chat')
  const[input,setInput]=useState('')
  const[streaming,setStreaming]=useState(false)
  const[webSearch,setWebSearch]=useState(true)
  const bottomRef=useRef<HTMLDivElement>(null)
  const textareaRef=useRef<HTMLTextAreaElement>(null)
  const activeSession=sessions.find(s=>s.id===activeId)??null

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'})},[activeSession?.messages])

  function newSession(){
    const id=genId()
    setSessions(p=>[{id,title:'新对话',messages:[],modelName:selectedModel},...p])
    setActiveId(id)
    setInput('')
    setTimeout(()=>textareaRef.current?.focus(),100)
  }

  function handleQuickPrompt(text:string){
    setInput(text)
    if(!activeId){
      const id=genId()
      setSessions(p=>[{id,title:'新对话',messages:[],modelName:selectedModel},...p])
      setActiveId(id)
    }
    setTimeout(()=>textareaRef.current?.focus(),50)
  }

  const send=useCallback(async(overrideInput?:string)=>{
    const msg=(overrideInput??input).trim()
    if(!msg||streaming||credits<=0)return
    let sid=activeId
    if(!sid){
      const id=genId()
      setSessions(p=>[{id,title:msg.slice(0,20),messages:[],modelName:selectedModel},...p])
      setActiveId(id);sid=id
    }
    const userMsg:Message={role:'user',content:msg}
    setSessions(p=>p.map(s=>s.id===sid?{...s,title:s.messages.length===0?msg.slice(0,24):s.title,messages:[...s.messages,userMsg],modelName:selectedModel}:s))
    setInput('');setStreaming(true)
    if(textareaRef.current){textareaRef.current.style.height='auto'}
    const msgs=[...(activeSession?.messages??[]),userMsg]
    const t0=Date.now()
    try{
      const{data:{session:chatSession}}=await createClient().auth.getSession()
      const headers:Record<string,string>={'Content-Type':'application/json'}
      if(chatSession?.access_token)headers['Authorization']=`Bearer ${chatSession.access_token}`
      const res=await fetch('/api/chat',{method:'POST',headers,body:JSON.stringify({model:selectedModel,messages:msgs,enableSearch:webSearch})})
      if(!res.ok){
        const e=await res.json()
        setSessions(p=>p.map(s=>s.id===sid?{...s,messages:[...s.messages,{role:'assistant',content:`错误：${e.error??'请求失败'}`}]}:s))
        return
      }
      const reader=res.body!.getReader();const dec=new TextDecoder();let content=''
      setSessions(p=>p.map(s=>s.id===sid?{...s,messages:[...s.messages,{role:'assistant',content:'',model:selectedModel}]}:s))
      while(true){
        const{done,value}=await reader.read();if(done)break
        const chunk=dec.decode(value)
        for(const line of chunk.split('\n')){
          if(!line.startsWith('data: '))continue
          const data=line.slice(6).trim();if(data==='[DONE]')continue
          try{
            const j=JSON.parse(data);const d=j.choices?.[0]?.delta?.content??''
            if(d){content+=d;setSessions(p=>p.map(s=>s.id===sid?{...s,messages:s.messages.map((m,i)=>i===s.messages.length-1?{...m,content}:m)}:s))}
            if(j.usage?.total_tokens)setCredits(p=>Math.max(0,p-Math.max(1,Math.ceil(j.usage.total_tokens/1000))))
          }catch{}
        }
      }
      const el=((Date.now()-t0)/1000).toFixed(1)
      setSessions(p=>p.map(s=>s.id===sid?{...s,messages:s.messages.map((m,i)=>i===s.messages.length-1?{...m,elapsed:parseFloat(el)}:m)}:s))
    }catch{
      setSessions(p=>p.map(s=>s.id===sid?{...s,messages:[...s.messages,{role:'assistant',content:'网络错误，请重试。'}]}:s))
    }finally{setStreaming(false)}
  },[input,streaming,credits,activeId,activeSession,selectedModel])

  async function logout(){await createClient().auth.signOut();router.push('/');router.refresh()}

  const pct=Math.min(100,(credits/5000)*100)
  const hasMessages=activeSession&&activeSession.messages.length>0

  return(
    <div className="h-screen flex flex-col" style={{background:'#0a0d14'}}>
      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{backgroundImage:'linear-gradient(rgba(114,99,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(114,99,255,.03) 1px,transparent 1px)',backgroundSize:'56px 56px'}}/>
      {/* Orbs */}
      <div className="fixed pointer-events-none z-0" style={{width:500,height:500,top:-150,left:-150,borderRadius:'50%',background:'radial-gradient(circle,rgba(114,99,255,.1),transparent)',filter:'blur(60px)'}}/>
      <div className="fixed pointer-events-none z-0" style={{width:400,height:400,bottom:-100,right:-100,borderRadius:'50%',background:'radial-gradient(circle,rgba(52,226,196,.07),transparent)',filter:'blur(60px)'}}/>

      {/* HEADER */}
      <header className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-[#1b2030] flex-shrink-0" style={{background:'rgba(10,13,20,.92)',backdropFilter:'blur(20px)'}}>
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)',boxShadow:'0 0 12px rgba(114,99,255,.4)'}}>枢</div>
            <span className="font-bold text-[17px] hidden sm:block" style={{fontFamily:'Space Grotesk,sans-serif',background:'linear-gradient(90deg,#7263ff,#34e2c4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>枢 AI</span>
          </Link>
          <div className="w-px h-5 bg-[#222838]"/>
          <button onClick={newSession} className="flex items-center gap-2 px-3 py-[7px] rounded-[9px] text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]" style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)',boxShadow:'0 3px 12px rgba(114,99,255,.35)'}}>
            <span className="text-[16px] leading-none">+</span> 新建对话
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select value={selectedModel} onChange={e=>setSelectedModel(e.target.value)}
            className="bg-[#161b29] border border-[#222838] rounded-[8px] px-3 py-[6px] text-[12.5px] text-[#edeff7] outline-none hover:border-[#7263ff55] transition-colors cursor-pointer">
            {models.map(m=><option key={m.id} value={m.name}>{m.name}</option>)}
            {models.length===0&&<option value="deepseek-chat">deepseek-chat</option>}
          </select>
          <div className="hidden sm:flex items-center gap-2 bg-[#161b29] border border-[#222838] rounded-[8px] px-3 py-[6px]">
            <span className="w-[6px] h-[6px] rounded-full bg-[#34e2c4]" style={{boxShadow:'0 0 5px #34e2c4'}}/>
            <span className="text-[12px] text-[#8d93a8] font-mono">{credits.toLocaleString()} 点</span>
          </div>
          <Link href="/redeem" className="text-[12px] text-[#7263ff] hover:text-[#9b8aff] transition-colors hidden md:block">充值</Link>
          <span className="text-[12px] text-[#565c70] hidden lg:block truncate max-w-[140px]">{user.email}</span>
          <button onClick={logout} className="text-[12px] text-[#565c70] hover:text-[#ff8a7c] transition-colors">退出</button>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-[220px] border-r border-[#1b2030] flex-col hidden md:flex flex-shrink-0" style={{background:'rgba(10,13,20,.6)'}}>
          <div className="p-4 border-b border-[#1b2030]">
            <div className="flex justify-between text-[11px] text-[#8d93a8] mb-2">
              <span>账户额度</span>
              <span className="text-[#34e2c4] font-mono font-medium">{credits.toLocaleString()} 点</span>
            </div>
            <div className="h-[3px] bg-[#1b2030] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,background:'linear-gradient(90deg,#7263ff,#34e2c4)',boxShadow:'0 0 6px rgba(52,226,196,.5)'}}/>
            </div>
            {credits===0&&<Link href="/redeem" className="block mt-2 text-center text-[11px] text-[#7263ff] hover:underline">去充值 →</Link>}
          </div>

          {/* Tools nav */}
          <div className="p-3 border-b border-[#1b2030]">
            <p className="text-[10px] text-[#565c70] uppercase tracking-[.08em] mb-2 px-1">AI 工具</p>
            <Link href="/dashboard/image-gen" className="flex items-center gap-2 w-full px-3 py-[8px] rounded-[9px] text-[12.5px] text-[#8d93a8] hover:bg-[#161b29] hover:text-[#edeff7] transition-all duration-150 mb-1">
              <span className="text-[16px]">🎨</span> 图片生成
            </Link>
            <Link href="/dashboard/video-gen" className="flex items-center gap-2 w-full px-3 py-[8px] rounded-[9px] text-[12.5px] text-[#8d93a8] hover:bg-[#161b29] hover:text-[#edeff7] transition-all duration-150">
              <span className="text-[16px]">🎬</span> 视频生成
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-[10px] text-[#565c70] uppercase tracking-[.08em] mb-3 px-1">对话记录</p>
            {sessions.length===0&&(
              <div className="text-center py-8">
                <div className="text-[28px] mb-2 opacity-30">💬</div>
                <p className="text-[12px] text-[#565c70]">暂无对话</p>
              </div>
            )}
            <div className="space-y-[2px]">
              {sessions.map(s=>(
                <button key={s.id} onClick={()=>setActiveId(s.id)}
                  className={`w-full text-left px-3 py-[9px] rounded-[9px] text-[12.5px] truncate transition-all duration-150 ${s.id===activeId?'text-[#edeff7]':'text-[#8d93a8] hover:bg-[#161b29] hover:text-[#edeff7]'}`}
                  style={s.id===activeId?{background:'rgba(114,99,255,.12)',borderLeft:'2px solid #7263ff',paddingLeft:'10px'}:{}}>
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {!hasMessages?(
              /* WELCOME SCREEN */
              <div className="max-w-[780px] mx-auto px-6 py-12">
                <div className="text-center mb-12">
                  <div className="w-[64px] h-[64px] rounded-[18px] flex items-center justify-center text-[28px] mx-auto mb-5" style={{background:'linear-gradient(135deg,rgba(114,99,255,.2),rgba(52,226,196,.2))',border:'1px solid rgba(114,99,255,.3)',boxShadow:'0 0 30px rgba(114,99,255,.15)'}}>枢</div>
                  <h2 className="font-bold text-[28px] mb-3 text-[#edeff7]" style={{fontFamily:'Space Grotesk,sans-serif'}}>有什么可以帮你的？</h2>
                  <p className="text-[#8d93a8] text-[14px]">当前模型：<span className="text-[#7263ff] font-mono">{selectedModel}</span> · 联网搜索{webSearch?<span className="text-[#34e2c4]">已开启</span>:<span className="text-[#565c70]">已关闭</span>}</p>
                </div>

                {/* AI 工具入口 */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <Link href="/dashboard/image-gen" className="group rounded-[16px] p-5 border border-[#7263ff44] hover:border-[#7263ff99] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_24px_rgba(114,99,255,.2)] cursor-pointer" style={{background:'linear-gradient(135deg,rgba(114,99,255,.12),rgba(114,99,255,.05))'}}>
                    <div className="text-[32px] mb-3">🎨</div>
                    <div className="font-semibold text-[15px] text-[#edeff7] mb-1">图片生成</div>
                    <p className="text-[12px] text-[#8d93a8]">xAI Aurora · 输入描述，秒出图</p>
                  </Link>
                  <Link href="/dashboard/video-gen" className="group rounded-[16px] p-5 border border-[#34e2c444] hover:border-[#34e2c499] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_24px_rgba(52,226,196,.15)] cursor-pointer" style={{background:'linear-gradient(135deg,rgba(52,226,196,.1),rgba(52,226,196,.04))'}}>
                    <div className="text-[32px] mb-3">🎬</div>
                    <div className="font-semibold text-[15px] text-[#edeff7] mb-1">视频生成</div>
                    <p className="text-[12px] text-[#8d93a8]">Gemini Veo 2 · 时长/比例自选</p>
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  {FEATURE_CARDS.map((f,i)=>(
                    <div key={i} className="rounded-[14px] p-4 border border-[#222838] hover:border-[#7263ff44] cursor-default transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_20px_rgba(114,99,255,.08)]" style={{background:'rgba(16,20,31,.8)'}}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[20px]">{f.icon}</span>
                        <span className="font-semibold text-[14px] text-[#edeff7]">{f.title}</span>
                      </div>
                      <p className="text-[12.5px] text-[#8d93a8] leading-[1.6]">{f.desc}</p>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[#565c70] uppercase tracking-[.08em] mb-3">快速开始</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((q,i)=>(
                    <button key={i} onClick={()=>handleQuickPrompt(q.text)}
                      className="flex items-center gap-2 px-4 py-[9px] rounded-full border border-[#222838] text-[13px] text-[#8d93a8] hover:text-[#edeff7] hover:border-[#7263ff55] hover:bg-[#161b29] transition-all duration-200">
                      <span>{q.icon}</span>{q.label}
                    </button>
                  ))}
                </div>
              </div>
            ):(
              /* MESSAGES */
              <div className="max-w-[820px] mx-auto px-6 py-6 flex flex-col gap-5">
                {activeSession.messages.map((msg,i)=>(
                  <div key={i} className={`flex ${msg.role==='user'?'justify-end':'justify-start'}`}>
                    {msg.role==='assistant'&&(
                      <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0 mr-3 mt-1" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)'}}>枢</div>
                    )}
                    <div className={`max-w-[75%] ${msg.role==='user'?'':'flex-1'}`}>
                      {msg.role==='assistant'&&(
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-mono text-[#34e2c4] uppercase tracking-wide">{msg.model??selectedModel}</span>
                          {msg.elapsed&&<span className="text-[11px] text-[#565c70]">· {msg.elapsed}s</span>}
                        </div>
                      )}
                      <div className={`px-4 py-3 rounded-[14px] text-[14.5px] leading-[1.7] ${msg.role==='user'?'rounded-br-[4px] text-white':'rounded-bl-[4px] border border-[#222838] text-[#edeff7]'}`}
                        style={msg.role==='user'
                          ?{background:'linear-gradient(135deg,#7263ff,#5a52d5)',boxShadow:'0 3px 14px rgba(114,99,255,.25)'}
                          :{background:'rgba(16,20,31,.9)',backdropFilter:'blur(8px)'}}>
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                        {msg.role==='assistant'&&streaming&&i===activeSession.messages.length-1&&(
                          <span className="inline-flex items-center gap-[3px] ml-2 align-middle">
                            <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
                          </span>
                        )}
                      </div>
                    </div>
                    {msg.role==='user'&&(
                      <div className="w-[30px] h-[30px] rounded-full bg-[#161b29] border border-[#222838] flex items-center justify-center text-[11px] text-[#8d93a8] flex-shrink-0 ml-3 mt-1">我</div>
                    )}
                  </div>
                ))}
                <div ref={bottomRef}/>
              </div>
            )}
          </div>

          {/* INPUT AREA */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2">
            <div className="max-w-[820px] mx-auto">
              <div className="rounded-[16px] border border-[#222838] overflow-hidden transition-all duration-200 focus-within:border-[rgba(114,99,255,.45)] focus-within:shadow-[0_0_0_3px_rgba(114,99,255,.08)]" style={{background:'rgba(16,20,31,.95)',backdropFilter:'blur(12px)'}}>
                <textarea
                  ref={textareaRef}
                  value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
                  disabled={streaming||credits<=0}
                  placeholder={credits<=0?'额度不足，请先充值...':'输入消息，Enter 发送，Shift+Enter 换行'}
                  rows={1}
                  className="w-full bg-transparent border-none outline-none text-[#edeff7] text-[14px] placeholder-[#565c70] resize-none px-4 pt-4 pb-2 max-h-[180px] leading-relaxed"
                  onInput={e=>{const el=e.currentTarget;el.style.height='auto';el.style.height=`${Math.min(el.scrollHeight,180)}px`}}
                />
                <div className="flex items-center justify-between px-3 pb-3 pt-1">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setWebSearch(v=>!v)}
                      className={`flex items-center gap-1.5 px-3 py-[5px] rounded-full border text-[11.5px] transition-all duration-200 ${webSearch?'border-[#34e2c466] text-[#34e2c4] bg-[#34e2c41a] hover:bg-[#34e2c422]':'border-[#222838] text-[#565c70] hover:border-[#444] hover:text-[#8d93a8]'}`}>
                      <span className={`w-[5px] h-[5px] rounded-full ${webSearch?'bg-[#34e2c4] animate-pulse':'bg-[#565c70]'}`}/>
                      联网搜索
                    </button>
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-[5px] rounded-full border border-[#222838] text-[11.5px] text-[#8d93a8]">
                      <span>🤖</span>{selectedModel.length>14?selectedModel.slice(0,14)+'…':selectedModel}
                    </div>
                  </div>
                  <button onClick={()=>send()} disabled={streaming||!input.trim()||credits<=0}
                    className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center text-white flex-shrink-0 disabled:opacity-35 transition-all duration-200 hover:scale-105"
                    style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)',boxShadow:'0 3px 12px rgba(114,99,255,.4)'}}>
                    {streaming?(
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    ):<span className="text-[16px]">↑</span>}
                  </button>
                </div>
              </div>
              <p className="text-center text-[11px] text-[#565c70] mt-2">枢 AI 可能出错，重要内容请自行核实</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
