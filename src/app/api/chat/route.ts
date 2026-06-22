import{NextRequest,NextResponse}from'next/server'
import{createClient as createServiceClient}from'@supabase/supabase-js'
import{deepseekStream,type ChatMessage}from'@/lib/adapters/deepseek'
import{tavilySearch}from'@/lib/adapters/tavily'

const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey=process.env.SUPABASE_SERVICE_ROLE_KEY!
const deepseekApiKey=process.env.DEEPSEEK_API_KEY!
const tavilyApiKey=process.env.TAVILY_API_KEY??''

function getProvider(model:string){
  if(model.startsWith('deepseek-'))return'deepseek'
  return'deepseek'
}

export async function POST(req:NextRequest){
  const authHeader=req.headers.get('authorization')??''
  const token=authHeader.startsWith('Bearer ')?authHeader.slice(7):''
  if(!token)return NextResponse.json({error:'请先登录'},{status:401})

  const serviceClient=createServiceClient(supabaseUrl,supabaseServiceKey)
  const{data:{user},error:authError}=await serviceClient.auth.getUser(token)
  if(authError||!user)return NextResponse.json({error:'登录已过期，请重新登录'},{status:401})

  const{data:profile}=await serviceClient.from('profiles').select('credits').eq('id',user.id).single()
  if(!profile||profile.credits<=0)return NextResponse.json({error:'额度不足，请充值'},{status:402})

  const{model='deepseek-chat',messages=[],enableSearch=true}=await req.json() as{model:string;messages:ChatMessage[];enableSearch?:boolean}

  // Get last user message for search query
  const lastUserMsg=messages.filter(m=>m.role==='user').pop()
  const now=new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})

  let searchContext=''
  if(enableSearch&&lastUserMsg&&tavilyApiKey){
    const results=await tavilySearch(lastUserMsg.content,tavilyApiKey)
    if(results.length>0){
      searchContext='\n\n【实时联网搜索结果】\n'+results.map((r,i)=>
        `[${i+1}] 标题：${r.title}\n来源：${r.url}\n摘要：${r.content}`
      ).join('\n\n')
    }
  }

  const systemContent=enableSearch
    ?(searchContext
      ?`你是枢AI助手，联网搜索功能已开启。当前时间：${now}。\n你已获得以下实时搜索结果，请直接基于这些内容回答用户，不要说自己没有联网搜索功能。回答末尾请注明信息来源（标注网址）。${searchContext}`
      :`你是枢AI助手，联网搜索功能已开启。当前时间：${now}。本次搜索未返回相关结果，请凭已有知识尽力回答，并说明信息截止日期。`)
    :`你是枢AI助手。当前时间：${now}。请尽可能准确回答问题。`

  try{
    const upstream=await deepseekStream(model,messages,deepseekApiKey,systemContent,enableSearch)
    if(!upstream.ok){
      const err=await upstream.text()
      return NextResponse.json({error:`DeepSeek错误: ${upstream.status} ${err}`},{status:500})
    }
    return new Response(upstream.body,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'}})
  }catch(e:any){
    return NextResponse.json({error:e.message??'请求失败'},{status:500})
  }
}
