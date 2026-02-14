import React from 'react'

export function Container({children}:{children:React.ReactNode}){
  return <div className="max-w-md mx-auto px-4 pt-5 pb-10">{children}</div>
}

export function Topbar({title,subtitle,right}:{title:string,subtitle?:string,right?:React.ReactNode}){
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-xs text-mut">PL Coach IDEAL</div>
        <div className="text-xl font-semibold tracking-tight">{title}</div>
        {subtitle && <div className="text-xs text-mut mt-1">{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}

export function Card({title,desc,right,children,glow}:{title:string,desc?:string,right?:React.ReactNode,children:React.ReactNode,glow?:boolean}){
  return (
    <div className={`rounded-2xl p-4 border border-stroke bg-card ${glow?'shadow-glow':''} fadeIn`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {desc && <div className="text-xs text-mut mt-1 leading-relaxed">{desc}</div>}
        </div>
        {right}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

export function Pill({tone,children}:{tone:'red'|'mut'|'ok'|'warn',children:React.ReactNode}){
  const cls = tone==='red'?'bg-red/15 text-red border-red/20':
              tone==='ok'?'bg-ok/15 text-ok border-ok/20':
              tone==='warn'?'bg-warn/15 text-warn border-warn/20':
              'bg-white/5 text-mut border-stroke'
  return <span className={`px-2 py-1 rounded-full text-xs border ${cls}`}>{children}</span>
}

export function Btn(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'red'|'mut'|'ghost' }){
  const tone=props.tone ?? 'red'
  const cls=tone==='red'?'bg-red text-bg0 hover:bg-red2':
            tone==='mut'?'bg-white/10 text-text hover:bg-white/15':
            'bg-transparent border border-stroke text-text hover:bg-white/5'
  return <button {...props} className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${cls} ${props.className??''}`}>{props.children}</button>
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>){
  return <input {...props} className={`w-full bg-bg2 border border-stroke rounded-xl px-3 py-2 text-sm outline-none focus:border-red/60 ${props.className??''}`} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>){
  return <select {...props} className={`w-full bg-bg2 border border-stroke rounded-xl px-3 py-2 text-sm outline-none focus:border-red/60 ${props.className??''}`}>{props.children}</select>
}

export function TopTabs({tabs,active,onChange}:{tabs:string[],active:string,onChange:(v:string)=>void}){
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {tabs.map(t=>{
        const is=active===t
        return (
          <button key={t} onClick={()=>onChange(t)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
              is?'bg-red text-bg0 shadow-glow scale-[1.02]':'bg-white/5 text-mut hover:bg-white/10'
            }`}>
            {t}
          </button>
        )
      })}
    </div>
  )
}

export function LineChart({values,height=80}:{values:number[],height?:number}){
  const w=320, h=height
  if(values.length<2) return <div className="text-xs text-mut">Недостаточно данных.</div>
  const min=Math.min(...values), max=Math.max(...values)
  const pad=6
  const xs=values.map((_,i)=> pad + (i*(w-2*pad))/(values.length-1))
  const ys=values.map(v=>{
    const t=max===min?0.5:(v-min)/(max-min)
    return (h-pad)-t*(h-2*pad)
  })
  const d=xs.map((x,i)=>`${i===0?'M':'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <path d={d} fill="none" stroke="rgba(239,68,68,0.95)" strokeWidth="2"/>
      <path d={`${d} L ${w-pad} ${h-pad} L ${pad} ${h-pad} Z`} fill="rgba(239,68,68,0.10)"/>
      {xs.map((x,i)=><circle key={i} cx={x} cy={ys[i]} r="2.8" fill="rgba(239,68,68,0.98)"/>)}
    </svg>
  )
}
