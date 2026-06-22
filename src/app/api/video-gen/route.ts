import{NextRequest,NextResponse}from'next/server'
import{createClient}from'@supabase/supabase-js'

const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey=process.env.SUPABASE_SERVICE_ROLE_KEY!
const geminiApiKey=process.env.GEMINI_API_KEY!

export async function POST(req:NextRequest){
  const authHeader=req.headers.get('authorization')??''
  const token=authHeader.startsWith('Bearer ')?authHeader.slice(7):''
  if(!token)return NextResponse.json({error:'请先登录'},{status:401})

  const serviceClient=createClient(supabaseUrl,supabaseServiceKey)
  const{data:{user},error:authError}=await serviceClient.auth.getUser(token)
  if(authError||!user)return NextResponse.json({error:'登录已过期'},{status:401})

  const{data:profile}=await serviceClient.from('profiles').select('credits').eq('id',user.id).single()
  if(!profile||profile.credits<=0)return NextResponse.json({error:'额度不足'},{status:402})

  if(!geminiApiKey)return NextResponse.json({error:'Gemini API Key 未配置'},{status:500})

  const{prompt,duration=5,aspectRatio='16:9',quality='standard'}=await req.json()
  if(!prompt)return NextResponse.json({error:'请输入描述内容'},{status:400})

  try{
    // Gemini Veo 2 video generation
    const initRes=await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-flash-exp:generateVideo?key=${geminiApiKey}`,
      {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          prompt:{text:prompt},
          generationConfig:{
            durationSeconds:duration,
            aspectRatio,
            ...(quality==='high'?{resolution:'1080p'}:{resolution:'720p'})
          }
        })
      }
    )
    if(!initRes.ok){
      const err=await initRes.text()
      return NextResponse.json({error:`Gemini错误: ${err}`},{status:500})
    }
    const initData=await initRes.json()
    const operationName=initData.name

    // 轮询等待完成 (最多等60秒)
    let videoUri=''
    for(let i=0;i<20;i++){
      await new Promise(r=>setTimeout(r,3000))
      const pollRes=await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${geminiApiKey}`
      )
      const pollData=await pollRes.json()
      if(pollData.done&&pollData.response?.generatedSamples?.[0]?.video?.uri){
        videoUri=pollData.response.generatedSamples[0].video.uri
        break
      }
      if(pollData.error)return NextResponse.json({error:pollData.error.message},{status:500})
    }

    if(!videoUri)return NextResponse.json({error:'视频生成超时，请重试'},{status:504})

    // 扣除额度
    const cost=duration<=5?3:duration<=8?5:8
    await serviceClient.from('profiles').update({credits:Math.max(0,profile.credits-cost)}).eq('id',user.id)

    return NextResponse.json({videoUrl:videoUri})
  }catch(e:any){
    return NextResponse.json({error:e.message??'生成失败'},{status:500})
  }
}
