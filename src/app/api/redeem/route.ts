import{NextRequest,NextResponse}from'next/server'
import{createClient}from'@supabase/supabase-js'

const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey=process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req:NextRequest){
  const authHeader=req.headers.get('authorization')??''
  const token=authHeader.startsWith('Bearer ')?authHeader.slice(7):''
  if(!token)return NextResponse.json({error:'请先登录'},{status:401})

  const serviceClient=createClient(supabaseUrl,supabaseServiceKey)
  const{data:{user},error:authError}=await serviceClient.auth.getUser(token)
  if(authError||!user)return NextResponse.json({error:'登录已过期'},{status:401})

  const{code}=await req.json() as{code:string}
  if(!code)return NextResponse.json({error:'请输入兑换码'},{status:400})

  const{data,error}=await serviceClient.rpc('redeem_code',{p_user_id:user.id,p_code:code.trim().toUpperCase()})
  if(error)return NextResponse.json({error:'兑换码无效或已使用'},{status:400})
  return NextResponse.json({success:true,credits:data})
}
