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

export default function ChatApp({user,initialCredits,models}:Props){
  const router=useRouter()
  const[credits,setCredits]=useState(initialCredits)
  const[sessions,setSessions]=useState<Session[]>([])
  const[activeId,setActiveId]=useState<string|null>(null)
  const[selectedModel,setSelectedModel]=useState(models[0]?.name??'deepseek-chat')
  const[input,setInput]=useState('')
  const[streaming,setStreaming]=useState(false)
  const[mode,setMode]=useState<'chat'|'image'|'video'>('chat')
  const bottomRef=useRef<HTMLDivElement>(null)
  const activeSession=sessions.find(s=>s.id===activeId)??null

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'})},[activeSession?.messages])

  function newSession(){
    const id=genId()
    setSessions(p=>[{id,title:'新对话',messages:[],modelName:selectedModel},...p])
    setActiveId(id)
  }

  const send=useCallback(async()=>{
    if(!input.trim()||streaming||credits<=0)return
    let sid=activeId
    if(!sid){
      const id=genId()
      setSessions(p=>[{id,title:input.slice(0,20),messages:[],modelName:selectedModel},...p])
      setActiveId(id);sid=id
    }
    const userMsg:Message={role:'user',content:input.trim()}
    setSessions(p=>p.map(s=>s.id===sid?{...s,title:s.messages.length===0?input.slice(0,20):s.title,messages:[...s.messages,userMsg],modelName:selectedModel}:s))
    setInput('');setStreaming(true)
    const msgs=[...(activeSession?.messages??[]),userMsg]
    const t0=Date.now()
    try{
      const{data:{session:chatSession}}=await createClient().auth.getSession()
      const headers:Record<string,string>={'Content-Type':'application/json'}
      if(chatSession?.access_token)headers['Authorization']=`Bearer ${chatSession.access_token}`
      const res=await fetch('/api/chat',{method:'POST',headers,body:JSON.stringify({model:selectedModel,messages:msgs})})
      if(!res.ok){
        const e=await res.json()
        setSessions(p=>p.map(s=>s.id===sid?{...s,messages:[...s.messages,{role:'assistant',content:`错误: ${e.error??'请求失败'}`}]}:s))
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

  return(
    <div className="h-screen flex flex-col" style={{background:'#0a0d14'}}>
      {/* Subtle grid */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{backgroundImage:'linear-gradient(rgba(114,99,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(114,99,255,.03) 1px,transparent 1px)',backgroundSize:'56px 56px'}}/>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-[14px] border-b border-[#1b2030]" style={{background:'rgba(10,13,20,.9)',backdropFilter:'blur(20px)'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-[15px] font-bold text-white" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)',boxShadow:'0 0 12px rgba(114,99,255,.4)'}}>枢</div>
          <span className="font-grotesk font-bold text-[17px] shimmer-text">枢 AI</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/redeem" className="text-[13px] text-[#8d93a8] hover:text-[#edeff7] transition-colors">充值额度</Link>
          <span className="text-[12px] text-[#565c70] hidden sm:block">{user.email}</span>
          <button onClick={logout} className="text-[13px] text-[#8d93a8] hover:text-[#ff8a7c] transition-colors">退出</button>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[250px] border-r border-[#1b2030] p-4 flex-col flex-shrink-0 hidden md:flex" style={{background:'rgba(10,13,20,.6)'}}>
          {/* Mode tabs */}
          <div className="flex gap-1 bg-[#161b29] p-1 rounded-[11px] mb-5 border border-[#222838]">
            {(['chat','image','video'] as const).map(m=>{
              const labels={chat:'聊天',image:'绘图',video:'视频'}
              const activeStyle={chat:'linear-gradient(100deg,#7263ff,#9b8aff)',image:'linear-gradient(100deg,#34e2c4,#5ef0d8)',video:'linear-gradient(100deg,#ff6f5e,#ff9a8d)'}
              return(
                <button key={m} onClick={()=>setMode(m)}
                  className={`flex-1 text-center py-[8px] rounded-[8px] text-[13px] font-semibold transition-all duration-200 ${mode===m?'text-white shadow-md':'text-[#8d93a8] hover:text-[#edeff7]'}`}
                  style={mode===m?{background:activeStyle[m]}:{}}>
                  {labels[m]}
                </button>
              )
            })}
          </div>

          {/* New chat button */}
          <button onClick={newSession}
            className="flex items-center justify-center gap-2 border border-dashed border-[#222838] rounded-[10px] p-[10px] text-[13px] text-[#8d93a8] mb-5 hover:border-[#7263ff88] hover:text-[#edeff7] hover:bg-[#161b29] transition-all duration-200">
            <span className="text-[16px] leading-none">+</span> 新建对话
          </button>

          {/* Sessions */}
          <p className="text-[10.5px] text-[#565c70] uppercase tracking-[.08em] mb-2 ml-1">最近对话</p>
          <div className="flex-1 overflow-y-auto space-y-[2px]">
            {sessions.map(s=>(
              <button key={s.id} onClick={()=>setActiveId(s.id)}
                className={`w-full text-left px-3 py-[9px] rounded-[9px] text-[13px] truncate transition-all duration-150 ${s.id===activeId?'text-[#edeff7] border-l-2 border-[#7263ff] pl-[10px]':'text-[#8d93a8] hover:bg-[#161b29] hover:text-[#edeff7]'}`}
                style={s.id===activeId?{background:'rgba(114,99,255,.12)'}:{}}>
                {s.title}
              </button>
            ))}
            {sessions.length===0&&<p className="text-[12px] text-[#565c70] text-center mt-6 leading-relaxed">开始你的第一次<br/>AI 对话</p>}
          </div>

          {/* Credits */}
          <div className="mt-4 rounded-[14px] p-4 border border-[#222838]" style={{background:'rgba(22,27,41,.8)'}}>
            <div className="flex justify-between text-[11.5px] text-[#8d93a8] mb-2">
              <span>账户额度</span>
              <span className="text-[#34e2c4] font-mono font-medium">{credits.toLocaleString()}</span>
            </div>
            <div className="font-mono text-[20px] font-semibold text-[#edeff7] mb-3">{credits.toLocaleString()} <span className="text-[13px] text-[#8d93a8] font-normal">点</span></div>
            <div className="h-[4px] bg-[#222838] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,background:'linear-gradient(90deg,#34e2c4,#7263ff)',boxShadow:'0 0 8px rgba(52,226,196,.4)'}}/>
            </div>
            {credits===0&&<Link href="/redeem" className="block mt-3 text-center text-[12px] text-[#7263ff] hover:text-[#9b8aff] transition-colors">去充值 →</Link>}
          </div>
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {mode==='chat'?(
            <>
              {/* Model selector bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#1b2030] flex-shrink-0" style={{background:'rgba(10,13,20,.5)'}}>
                <select value={selectedModel} onChange={e=>setSelectedModel(e.target.value)}
                  className="bg-[#161b29] border border-[#222838] rounded-[9px] px-3 py-[7px] text-[13px] text-[#edeff7] outline-none focus:border-[#7263ff88] cursor-pointer transition-colors duration-200 hover:border-[#7263ff55]">
                  {models.map(m=><option key={m.id} value={m.name}>{m.name}</option>)}
                  {models.length===0&&<option value="deepseek-chat">deepseek-chat</option>}
                </select>
                <div className="flex items-center gap-2">
                  <span className="w-[7px] h-[7px] rounded-full bg-[#34e2c4] animate-pulse" style={{boxShadow:'0 0 6px #34e2c4'}}/>
                  <span className="text-[12px] text-[#8d93a8] font-mono">{credits} 点</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
                {!activeSession||activeSession.messages.length===0?(
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                    <div className="w-[70px] h-[70px] rounded-full mb-6 flex items-center justify-center text-[28px] float" style={{background:'linear-gradient(135deg,rgba(114,99,255,.15),rgba(52,226,196,.15))',border:'1px solid rgba(114,99,255,.2)',boxShadow:'0 0 30px rgba(114,99,255,.1)'}}>枢</div>
                    <h3 className="font-grotesk text-[19px] font-semibold mb-2 text-[#edeff7]">开始新对话</h3>
                    <p className="text-[#8d93a8] text-[14px]">当前模型：<span className="text-[#7263ff] font-mono">{selectedModel}</span></p>
                    <p className="text-[#565c70] text-[13px] mt-2">联网搜索已开启 · 支持实时信息</p>
                  </div>
                ):activeSession.messages.map((msg,i)=>(
                  <div key={i} className={`flex ${msg.role==='user'?'justify-end':'justify-start'} ${msg.role==='user'?'msg-in':''}`}>
                    <div className={`max-w-[75%] px-4 py-[13px] rounded-[14px] text-[14.5px] leading-[1.65] ${
                      msg.role==='user'
                        ?'text-white rounded-br-[5px]'
                        :'border border-[#222838] text-[#edeff7] rounded-bl-[5px]'
                    }`} style={msg.role==='user'
                      ?{background:'linear-gradient(135deg,#7263ff,#5a52e0)',boxShadow:'0 4px 16px rgba(114,99,255,.25)'}
                      :{background:'rgba(22,27,41,.9)',backdropFilter:'blur(8px)'}
                    }>
                      {msg.role==='assistant'&&(
                        <span className="block font-mono text-[10.5px] text-[#34e2c4] mb-[7px] uppercase tracking-wide">
                          {msg.model??selectedModel}{msg.elapsed?` · ${msg.elapsed}s`:''}
                        </span>
                      )}
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                      {msg.role==='assistant'&&streaming&&i===activeSession.messages.length-1&&(
                        <span className="inline-flex items-center gap-[3px] ml-2 align-middle">
                          <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef}/>
              </div>

              {/* Input area */}
              <div className="mx-5 mb-5 rounded-[14px] border border-[#222838] px-4 py-3 flex items-end gap-3 input-glow transition-all duration-200" style={{background:'rgba(22,27,41,.9)',backdropFilter:'blur(8px)'}}>
                <textarea
                  value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
                  disabled={streaming||credits<=0}
                  placeholder={credits<=0?'额度不足，请先充值...':'输入消息，Shift+Enter 换行...'}
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none text-[#edeff7] text-[14px] placeholder-[#565c70] resize-none max-h-[200px] leading-relaxed"
                  onInput={e=>{const el=e.currentTarget;el.style.height='auto';el.style.height=`${el.scrollHeight}px`}}
                />
                <button onClick={send} disabled={streaming||!input.trim()||credits<=0}
                  className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center text-white text-[15px] flex-shrink-0 disabled:opacity-40 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)',boxShadow:'0 4px 14px rgba(114,99,255,.4)'}}>
                  {streaming?(
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  ):'↑'}
                </button>
              </div>
            </>
          ):(
            <div className="flex-1 flex items-center justify-center flex-col gap-5 text-center px-8">
              <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-3xl float" style={{background:mode==='image'?'rgba(52,226,196,.12)':'rgba(255,111,94,.12)',border:`1px solid ${mode==='image'?'rgba(52,226,196,.3)':'rgba(255,111,94,.3)'}`,boxShadow:`0 0 24px ${mode==='image'?'rgba(52,226,196,.15)':'rgba(255,111,94,.15)'}`}}>
                {mode==='image'?'🎨':'🎬'}
              </div>
              <h3 className="font-grotesk text-[20px] font-semibold text-[#edeff7]">{mode==='image'?'绘图模式':'视频模式'}</h3>
              <p className="text-[#8d93a8] text-[14px]">即将上线，敬请期待。</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
