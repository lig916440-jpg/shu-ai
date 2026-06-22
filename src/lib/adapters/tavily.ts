export interface SearchResult{
  title:string
  url:string
  content:string
}

export async function tavilySearch(query:string,apiKey:string):Promise<SearchResult[]>{
  try{
    const res=await fetch('https://api.tavily.com/search',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({api_key:apiKey,query,max_results:5,search_depth:'basic'})
    })
    if(!res.ok)return []
    const data=await res.json()
    return (data.results??[]).slice(0,5).map((r:any)=>({
      title:r.title??'',
      url:r.url??'',
      content:(r.content??'').slice(0,500)
    }))
  }catch{
    return []
  }
}
