import{createServerClient}from'@supabase/ssr'
import{cookies}from'next/headers'
import{NextResponse}from'next/server'
export async function GET(request:Request){
  const{searchParams,origin}=new URL(request.url)
  const code=searchParams.get('code')
  if(code){
    const c=await cookies()
    const s=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>c.getAll(),setAll:(cs: any)=>cs.forEach(({name,value,options})=>c.set(name,value,options))}})
    await s.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/dashboard`)
}
