import React, { useEffect, useMemo, useState } from 'react'
import { Btn, Card, Container, LineChart, Pill, Select, TopTabs, Topbar } from '../components'
import { getCheckInsAll, getTopSetsAll } from '../../core/db'
import { addDaysISO, dayTypeForDate, isoToday, weekTypeForDate, weekdayMon1 } from '../../core/logic'

export function Progress({ auth }:{ auth:any }){
  const [tab,setTab]=useState<'Графики'|'Календарь'>('Графики')
  const [s,setS]=useState<any>(null)
  const [w,setW]=useState<number[]>([])
  const [b,setB]=useState<number[]>([])
  const [sq,setSq]=useState<number[]>([])
  const [dl,setDl]=useState<number[]>([])
  const [year,setYear]=useState(new Date().getFullYear())
  const [month,setMonth]=useState(new Date().getMonth()+1)

  useEffect(()=>{
    (async()=>{
      setS(await auth.getSettings())
      const ci=await getCheckInsAll()
      const ww=ci.map(x=>x.weightMorningKg).filter((x:any)=>typeof x==='number')
      setW(ww.slice(-30))
      const ts=await getTopSetsAll()
      const last=ts.slice().sort((a,b)=>a.dateISO<b.dateISO?1:-1).slice(0,120).reverse()
      const series=(lift:string)=> last.filter(t=>t.lift===lift).map(t=>t.e1rm).slice(-30)
      setB(series('bench')); setSq(series('squat')); setDl(series('deadlift'))
    })()
  },[])

  const today=isoToday()

  const cal = useMemo(()=>{
    if(!s) return null
    const dim=new Date(year, month, 0).getDate()
    const firstISO=`${year}-${String(month).padStart(2,'0')}-01`
    const firstWd=weekdayMon1(firstISO)
    const cells:any[]=[]
    for(let i=1;i<firstWd;i++) cells.push(null)
    for(let d=1; d<=dim; d++){
      const iso=`${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const dt=dayTypeForDate(s, iso)
      const wk=weekTypeForDate(s, iso)
      const main=dt==='upper'?'Ж':dt==='lower'?'П':'Т'
      const wkC=wk==='light'?'L':wk==='medium'?'M':wk==='medium_plus'?'M+':'H'
      const wd=weekdayMon1(iso)
      const isTrain=(s.trainingDays||[]).includes(wd)
      cells.push({iso,main,wkC,isTrain})
    }
    while(cells.length%7!==0) cells.push(null)
    return { cells }
  },[s,year,month])

  return (
    <Container>
      <Topbar title="Прогресс" subtitle="Графики силы + календарь (реальные дни тренировок учитываются)" right={<Pill tone="mut">30 точек</Pill>} />
      <div className="mt-3">
        <TopTabs tabs={['Графики','Календарь']} active={tab} onChange={(v)=>setTab(v as any)} />
      </div>

      <div className="mt-4 space-y-3">
        {tab==='Графики' && (
          <>
            <Card title="Вес (утро)" desc="Смотри тренд, а не один день (вода гуляет)." right={<Pill tone="red">{w.length?w[w.length-1]+' кг':'—'}</Pill>} glow>
              <LineChart values={w} height={90}/>
            </Card>
            <Card title="e1RM Жим" desc="Если e1RM держится — сила на месте даже на сушке." right={<Pill tone="red">{b.length?b[b.length-1]+' кг':'—'}</Pill>}>
              <LineChart values={b} height={90}/>
            </Card>
            <Card title="e1RM Присед" right={<Pill tone="red">{sq.length?sq[sq.length-1]+' кг':'—'}</Pill>}>
              <LineChart values={sq} height={90}/>
            </Card>
            <Card title="e1RM Тяга" right={<Pill tone="red">{dl.length?dl[dl.length-1]+' кг':'—'}</Pill>}>
              <LineChart values={dl} height={90}/>
            </Card>
          </>
        )}

        {tab==='Календарь' && s && cal && (
          <Card title="Календарь" desc="Показывает Ж/П/Т и тип недели. Серым — день без тренировки (если ты так отметил)."
            right={<Pill tone="mut">{year}-{String(month).padStart(2,'0')}</Pill>} glow>
            <div className="flex gap-2 mb-3">
              <Btn tone="mut" onClick={()=>{ const m=month===1?12:month-1; const y=month===1?year-1:year; setMonth(m); setYear(y) }}>◀</Btn>
              <div className="flex-1 grid place-items-center text-sm font-semibold">{year}-{String(month).padStart(2,'0')}</div>
              <Btn tone="mut" onClick={()=>{ const m=month===12?1:month+1; const y=month===12?year+1:year; setMonth(m); setYear(y) }}>▶</Btn>
            </div>

            <div className="grid grid-cols-7 gap-1 text-[11px] text-mut mb-2">
              {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x=><div key={x} className="text-center">{x}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cal.cells.map((c:any,idx:number)=>{
                if(!c) return <div key={idx} className="h-10 rounded-lg" />
                const isToday=c.iso===today
                const cls = c.isTrain ? 'bg-card/60' : 'bg-bg2/40 opacity-50'
                return (
                  <div key={idx} className={`h-10 rounded-lg border ${isToday?'border-red bg-red/10':'border-stroke'} ${cls} flex flex-col items-center justify-center`}>
                    <div className={`text-xs font-semibold ${isToday?'text-red':'text-text'}`}>{c.iso.slice(-2)}</div>
                    <div className="text-[10px] text-mut">{c.main} • {c.wkC}</div>
                  </div>
                )
              })}
            </div>

            <div className="mt-2 text-[11px] text-mut">Легенда: Ж=жим, П=присед, Т=тяга • L/M/M+/H — неделя • серый = ты отметил “не тренируюсь”.</div>
          </Card>
        )}
      </div>
    </Container>
  )
}
