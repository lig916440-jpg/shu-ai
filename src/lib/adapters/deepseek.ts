export interface ChatMessage{role:'user'|'assistant'|'system';content:string}
export async function deepseekStream(model:string,messages:ChatMessage[],apiKey:string,systemContent?:string):Promise<Response>{
  const now=new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})
  const sysText=systemContent??`你是枢AI助手。当前时间：${now}。请尽可能准确回答问题。`
  const systemMsg:ChatMessage={role:'system',content:sysText}
  const allMessages=[systemMsg,...messages]
  return fetch('https://api.deepseek.com/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
    body:JSON.stringify({model,messages:allMessages,stream:true,stream_options:{include_usage:true}})
  })
}
