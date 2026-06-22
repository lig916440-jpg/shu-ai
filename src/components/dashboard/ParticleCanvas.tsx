'use client'
import{useRef,useEffect}from'react'

export default function ParticleCanvas(){
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const mouse=useRef({x:-9999,y:-9999})
  useEffect(()=>{
    const canvas=canvasRef.current!
    const ctx=canvas.getContext('2d')!
    let animId:number
    const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight}
    resize()
    window.addEventListener('resize',resize)
    const onMove=(e:MouseEvent)=>{mouse.current={x:e.clientX,y:e.clientY}}
    window.addEventListener('mousemove',onMove)
    const N=90
    const pts=Array.from({length:N},()=>({
      x:Math.random()*window.innerWidth,
      y:Math.random()*window.innerHeight,
      vx:(Math.random()-.5)*.5,
      vy:(Math.random()-.5)*.5,
      r:Math.random()*1.8+.6,
      hue:Math.random()>.5?263:174,
    }))
    const CONN=130,REPEL=110
    function tick(){
      ctx.clearRect(0,0,canvas.width,canvas.height)
      for(const p of pts){
        const dx=mouse.current.x-p.x,dy=mouse.current.y-p.y
        const d=Math.sqrt(dx*dx+dy*dy)
        if(d<REPEL&&d>0){const f=(REPEL-d)/REPEL*.6;p.vx-=(dx/d)*f;p.vy-=(dy/d)*f}
        p.vx*=.97;p.vy*=.97
        p.x+=p.vx;p.y+=p.vy
        if(p.x<0)p.x=canvas.width;if(p.x>canvas.width)p.x=0
        if(p.y<0)p.y=canvas.height;if(p.y>canvas.height)p.y=0
        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`hsla(${p.hue},80%,65%,.75)`
        ctx.shadowBlur=8;ctx.shadowColor=`hsla(${p.hue},80%,65%,1)`
        ctx.fill()
        ctx.restore()
      }
      for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){
        const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y
        const d=Math.sqrt(dx*dx+dy*dy)
        if(d<CONN){
          ctx.save()
          ctx.beginPath()
          ctx.moveTo(pts[i].x,pts[i].y)
          ctx.lineTo(pts[j].x,pts[j].y)
          const a=(1-d/CONN)*.18
          ctx.strokeStyle=`rgba(114,99,255,${a})`
          ctx.lineWidth=.7
          ctx.stroke()
          ctx.restore()
        }
      }
      animId=requestAnimationFrame(tick)
    }
    tick()
    return()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',resize);window.removeEventListener('mousemove',onMove)}
  },[])
  return<canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-60"/>
}
