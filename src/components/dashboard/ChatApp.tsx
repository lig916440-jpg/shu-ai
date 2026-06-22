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
  function newSession(){const id=genId();setSessions(p=>[{id,title:'新对话',messages:[],modelName:selectedModel},...p]);setActiveId(id)}
  const send=useCallback(async()=>{
    if(!input.trim()||streaming||credits<=0)return
    let sid=activeId
    if(!sid){const id=genId();setSessions(p=>[{id,title:input.slice(0,20),messages:[],modelName:selectedModel},...p]);setActiveId(id);sid=id}
    const userMsg:Message={role:'user',content:input.trim()}
    setSessions(p=>p.map(s=>s.id===sid?{...s,title:s.messages.length===0?input.slice(0,20):s.title,messages:[...s.messages,userMsg],modelName:selectedModel}:s))
    setInput('');setStreaming(true)
    const msgs=[...(activeSession?.messages??[]),userMsg]
    const t0=Date.now()
    try{
      const{data:{session:chatSession}}=await createClient().auth.getSession()
      const chatHeaders:Record<string,string>={'Content-Type':'application/json'}
      if(chatSession?.access_token)chatHeaders['Authorization']=`Bearer ${chatSession.access_token}`
      const res=await fetch('/api/chat',{method:'POST',headers:chatHeaders,body:JSON.stringify({model:selectedModel,messages:msgs})})
      if(!res.ok){const e=await res.json();setSessions(p=>p.map(s=>s.id===sid?{...s,messages:[...s.messages,{role:'assistant',content:`错误: ${e.error??'请求失败'}`}]}:s));return}
      const reader=res.body!.getReader();const dec=new TextDecoder();let content=''
      setSessions(p=>p.map(s=>s.id===sid?{...s,messages:[...s.messages,{role:'assistant',content:'',model:selectedModel}]}:s))
      while(true){
        const{done,value}=await reader.read();if(done)break
        const chunk=dec.decode(value)
        for(const line of chunk.split('\n')){
          if(!line.startsWith('data: '))continue
          const data=line.slice(6).trim();if(data==='[DONE]')continue
          try{const j=JSON.parse(data);const d=j.choices?.[0]?.delta?.content??''
            if(d){content+=d;setSessions(p=>p.map(s=>s.id===sid?{...s,messages:s.messages.map((m,i)=>i===s.messages.length-1?{...m,content}:m)}:s))}
            if(j.usage?.total_tokens)setCredits(p=>Math.max(0,p-Math.max(1,Math.ceil(j.usage.total_tokens/1000))))
          }catch{}
        }
      }
      const el=((Date.now()-t0)/1000).toFixed(1)
      setSessions(p=>p.map(s=>s.id===sid?{...s,messages:s.messages.map((m,i)=>i===s.messages.length-1?{...m,elapsed:parseFloat(el)}:m)}:s))
    }catch{setSessions(p=>p.map(s=>s.id===sid?{...s,messages:[...s.messages,{role:'assistant',content:'网络错误，请重试。'}]}:s))}
    finally{setStreaming(false)}
  },[input,streaming,credits,activeId,activeSession,selectedModel])
  async function logout(){await createClient().auth.signOut();router.push('/');router.refresh()}
  const pct=Math.min(100,(credits/5000)*100)
  return(
    <div className="h-screen flex flex-col bg-bg">
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#1b2030] flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 font-grotesk font-bold text-[18px]">
          <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-[15px] font-bold text-[#0a0d14]" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)'}}>枢</div>枢 AI
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/redeem" className="text-[13px] text-muted hover:text-primary">充值额度</Link>
          <span className="text-[13px] text-dim">{user.email}</span>
          <button onClick={logout} className="text-[13px] text-muted hover:text-coral">退出</button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[240px] border-r border-[#1b2030] p-4 flex-col flex-shrink-0 hidden md:flex">
          <div className="flex gap-[6px] bg-elevated p-1 rounded-[10px] mb-[22px]">
            {(['chat','image','video']as const).map(m=>{const L={chat:'聊天',image:'绘图',video:'视频'};const C={chat:'bg-violet',image:'bg-teal',video:'bg-coral'};return<button key={m} onClick={()=>setMode(m)} className={`flex-1 text-center py-2 rounded-[8px] text-[13px] font-semibold transition-colors ${mode===m?`${C[m]} text-white`:'text-muted'}`}>{L[m]}</button>})}
          </div>
          <button onClick={newSession} className="border border-dashed border-[#222838] rounded-[9px] p-[10px] text-[13px] text-muted mb-[18px] hover:border-violet hover:text-primary transition-colors">+ 新建对话</button>
          <p className="text-[11px] text-dim uppercase tracking-[.06em] mb-[10px] ml-1">最近</p>
          <div className="flex-1 overflow-y-auto space-y-[2px]">
            {sessions.map(s=><button key={s.id} onClick={()=>setActiveId(s.id)} className={`w-full text-left px-[10px] py-[9px] rounded-[8px] text-[13px] text-muted truncate hover:bg-elevated hover:text-primary transition-colors ${s.id===activeId?'bg-elevated text-primary':''}`}>{s.title}</button>)}
            {sessions.length===0&&<p className="text-[12px] text-dim text-center mt-4">暂无对话记录</p>}
          </div>
          <div className="mt-4 bg-elevated border border-[#222838] rounded-[12px] p-[14px]">
            <div className="flex justify-between text-[12px] text-muted mb-2"><span>当前额度</span><span>剩余</span></div>
            <div className="font-mono text-[19px] font-medium text-teal">{credits.toLocaleString()} 点</div>
            <div className="h-[4px] bg-[#222838] rounded-full overflow-hidden mt-[10px]"><div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:'linear-gradient(90deg,#34e2c4,#7263ff)'}}/></div>
            {credits===0&&<Link href="/redeem" className="block mt-3 text-center text-[12px] text-violet hover:underline">去充值</Link>}
          </div>
        </aside>
        <main className="flex-1 flex flex-col overflow-hidden">
          {mode==='chat'?(
            <>
              <div className="flex items-center justify-between px-[22px] py-[14px] border-b border-[#1b2030] flex-shrink-0">
                <select value={selectedModel} onChange={e=>setSelectedModel(e.target.value)} className="bg-elevated border border-[#222838] rounded-[9px] px-3 py-[7px] text-[13px] text-primary outline-none focus:border-violet cursor-pointer">
                  {models.map(m=><option key={m.id} value={m.name}>{m.name}</option>)}
                  {models.length===0&&<option value="deepseek-chat">deepseek-chat</option>}
                </select>
                <div className="flex items-center gap-2"><span className="w-[7px] h-[7px] rounded-full bg-teal inline-block"/><span className="text-[12px] text-muted font-mono">{credits} 点</span></div>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-7 flex flex-col gap-[18px]">
                {!activeSession||activeSession.messages.length===0?(
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full mb-6 flex items-center justify-center text-2xl" style={{background:'linear-gradient(135deg,#7263ff22,#34e2c422)',border:'1px solid #222838'}}>枢</div>
                    <h3 className="font-grotesk text-[18px] font-semibold mb-2">开始新对话</h3>
                    <p className="text-muted text-[14px]">当前模型：<span className="text-violet font-mono">{selectedModel}</span></p>
                  </div>
                ):activeSession.messages.map((msg,i)=>(
                  <div key={i} className={`flex ${msg.role==='user'?'justify-end':'justify-start'}`}>
                    <div className={`max-w-[74%] px-4 py-[13px] rounded-[13px] text-[14.5px] leading-[1.6] ${msg.role==='user'?'bg-violet text-white rounded-br-[4px]':'bg-elevated border border-[#222838] text-primary rounded-bl-[4px]'}`}>
                      {msg.role==='assistant'&&<span className="block font-mono text-[10.5px] text-teal mb-[6px] uppercase">{msg.model??selectedModel}{msg.elapsed?` · ${msg.elapsed}s`:''}</span>}
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                      {msg.role==='assistant'&&streaming&&i===activeSession.messages.length-1&&<span className="inline-block w-[2px] h-[14px] bg-teal ml-1 animate-pulse align-middle"/>}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef}/>
              </div>
              <div className="mx-[22px] mb-[22px] bg-elevated border border-[#222838] rounded-[13px] px-[14px] py-[13px] flex items-end gap-3">
                <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} disabled={streaming||credits<=0} placeholder={credits<=0?'额度不足，请先充值...':'输入消息，Shift+Enter 换行...'} rows={1} className="flex-1 bg-transparent border-none outline-none text-primary text-[14px] placeholder:text-dim resize-none max-h-[200px] leading-relaxed" onInput={e=>{const el=e.currentTarget;el.style.height='auto';el.style.height=`${el.scrollHeight}px`}}/>
                <button onClick={send} disabled={streaming||!input.trim()||credits<=0} className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white text-[14px] flex-shrink-0 disabled:opacity-40" style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)'}}>
                  {streaming?<span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>:'↑'}
                </button>
              </div>
            </>
          ):(
            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center px-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl border border-[#222838]" style={{background:mode==='image'?'#34e2c422':'#ff6f5e22'}}>{mode==='image'?'🎨':'🎬'}</div>
              <h3 className="font-grotesk text-[18px] font-semibold">{mode==='image'?'绘图模式':'视频模式'}</h3>
              <p className="text-muted text-[14px]">即将上线，敬请期待。</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
