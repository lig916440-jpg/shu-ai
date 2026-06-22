import{createServerClient}from'@supabase/ssr'
import{cookies}from'next/headers'

export async function createClient(){
  const c=await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
    cookies:{
      getAll:()=>c.getAll(),
      setAll:(cs:{name:string;value:string;options?:any}[])=>{try{cs.forEach(({name,value,options})=>c.set(name,value,options))}catch{}}
    }
  })
}
