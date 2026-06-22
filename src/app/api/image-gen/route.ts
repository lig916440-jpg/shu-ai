import{NextRequest,NextResponse}from'next/server'
import{createClient}from'@supabase/supabase-js'

const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey=process.env.SUPABASE_SERVICE_ROLE_KEY!
const xaiApiKey=process.env.XAI_API_KEY!

export async function POST(req:NextRequest){
  const authHeader=req.headers.get('authorization')??''
  const token=authHeader.startsWith('Bearer ')?authHeader.slice(7):''
  if(!token)return NextResponse.json({error:'请先登录'},{status:401})

  const serviceClient=createClient(supabaseUrl,supabaseServiceKey)
  const{data:{user},error:authError}=await serviceClient.auth.getUser(token)
  if(authError||!user)return NextResponse.json({error:'登录已过期'},{status:401})

  const{data:profile}=await serviceClient.from('profiles').select('credits').eq('id',user.id).single()
  if(!profile||profile.credits<=0)return NextResponse.json({error:'额度不足'},{status:402})

  const{prompt,n=1,size='1024x1024'}=await req.json()
  if(!prompt)return NextResponse.json({error:'请输入描述内容'},{status:400})

  try{
    const res=await fetch('https://api.x.ai/v1/images/generations',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${xaiApiKey}`},
      body:JSON.stringify({model:'aurora',prompt,n,response_format:'url',size})
    })
    if(!res.ok){
      const err=await res.text()
      return NextResponse.json({error:`xAI错误: ${err}`},{status:500})
    }
    const data=await res.json()
    // 扣除额度 (图片按张数扣)
    await serviceClient.from('profiles').update({credits:profile.credits-n}).eq('id',user.id)
    return NextResponse.json({images:data.data})
  }catch(e:any){
    return NextResponse.json({error:e.message??'生成失败'},{status:500})
  }
}
