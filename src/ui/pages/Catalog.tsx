import React, { useEffect, useMemo, useState } from 'react'
import { Card, Container, Input, Pill, Topbar } from '../components'
import { getExercisesAll, getSettings } from '../../core/db'

export function Catalog({ auth }:{ auth:any }){
  const [all,setAll]=useState<any[]>([])
  const [settings,setSettings]=useState<any>(null)
  const [base,setBase]=useState<'bench'|'squat'|'deadlift'>('bench')
  const [q,setQ]=useState('')

  useEffect(()=>{ (async()=>{ setAll(await getExercisesAll()); setSettings(await getSettings()) })() },[])

  const shown=useMemo(()=>{
    const qq=q.trim().toLowerCase()
    if(!qq) return all
    return all.filter(ex =>
      String(ex.name).toLowerCase().includes(qq) ||
      String(ex.pattern||'').toLowerCase().includes(qq) ||
      (ex.primary||[]).join(' ').toLowerCase().includes(qq)
    )
  },[all,q])

  return (
    <Container>
      <Topbar title="Каталог упражнений" subtitle="Замены, анатомия движения, плюсы и подсказки." right={<Pill tone="mut">{shown.length}</Pill>} />
      <div className="mt-4 space-y-3">
        <Card title="Поиск" desc="Пиши как хочешь: “пауза”, “RDL”, “трицепс”, “плечо”…">
          <Input placeholder="Поиск…" value={q} onChange={e=>setQ(e.target.value)} />
        </Card>


<Card title="Подобрать замену (умно)" desc="Если устал, болит, нет инвентаря — выбери базу и получи варианты." right={<Pill tone="red">auto</Pill>} glow>
  <div className="grid grid-cols-3 gap-2">
    {[
      ['Жим','bench'],
      ['Присед','squat'],
      ['Тяга','deadlift'],
    ].map(([label,val])=>{
      const active = base===val
      return (
        <button key={val}
          onClick={()=>setBase(val as any)}
          className={`px-3 py-2 rounded-xl text-sm border transition-all duration-300 ${
            active?'bg-red/15 border-red/30 text-text':'bg-white/5 border-stroke text-mut hover:bg-white/10'
          }`}>
          {label}
        </button>
      )
    })}
  </div>

  <div className="text-xs text-mut mt-3">
    Фильтры: учитываю твой список «Оборудование» и «Ограничения» из Настроек.
  </div>

  <div className="mt-3 space-y-2">
    {(shown.filter(ex => (ex.replaces||[]).includes(base))
      .filter(ex => {
        if(!settings) return true
        const eq = (ex.needs||[]).join(' ').toLowerCase()
        const have = (settings.equipment||[]).join(' ').toLowerCase()
        // very simple: if exercise needs something not present, hide
        const needs = (ex.needs||[]).map((x:string)=>String(x).toLowerCase())
        if(needs.length){
          for(const n of needs){
            if(!have.includes(n)) return false
          }
        }
        // limitations: if listed in avoidIf, hide
        const lim = (settings.limitations||[]).map((x:string)=>String(x).toLowerCase())
        const avoid = (ex.avoidIf||[]).map((x:string)=>String(x).toLowerCase())
        if(lim.length && avoid.length){
          for(const a of avoid){
            if(lim.some(l=>a.includes(l))) return false
          }
        }
        return true
      })
    ).slice(0,8).map(ex=>(
      <div key={ex.name} className="rounded-xl p-3 border border-stroke bg-bg2">
        <div className="flex justify-between gap-2">
          <div className="font-semibold">{ex.name}</div>
          <div className="text-xs text-mut">{ex.pattern}</div>
        </div>
        <div className="text-xs text-mut mt-1">
          Плюсы: {(ex.benefits||[]).slice(0,3).join(' • ')}
        </div>
        <div className="text-xs text-mut mt-2">
          Анатомия: {(ex.anatomy||[]).slice(0,2).join(' • ')}
        </div>
        <div className="text-xs text-mut mt-2">
          Рекомендация по сетам/повт: {ex.recommendedSetsReps || '—'}
        </div>
      </div>
    ))}
    {shown.filter(ex => (ex.replaces||[]).includes(base)).length===0 && (
      <div className="text-sm text-mut">Нет вариантов — проверь, что упражнения засевлены (Настройки → Сид).</div>
    )}
  </div>
</Card>



        {shown.map((ex,idx)=>(
          <Card key={idx} title={ex.name} desc={`${ex.pattern} • рекомендовано: ${ex.recommendedSetsReps}`} right={<Pill tone="red">{(ex.replaces||[]).join(', ')}</Pill>} glow={idx===0}>
            <div className="text-sm">
              <div className="text-xs text-mut">Основные мышцы</div>
              <div>{(ex.primary||[]).join(', ') || '—'}</div>
            </div>
            <div className="mt-2 text-sm">
              <div className="text-xs text-mut">Вторичные</div>
              <div>{(ex.secondary||[]).join(', ') || '—'}</div>
            </div>
            <div className="mt-2 text-sm">
              <div className="text-xs text-mut">Плюсы</div>
              <ul className="list-disc pl-5">
                {(ex.benefits||[]).map((b:any,i:number)=><li key={i}>{b}</li>)}
              </ul>
            </div>
            <div className="mt-2 text-sm">
              <div className="text-xs text-mut">Анатомия (очень коротко)</div>
              <ul className="list-disc pl-5">
                {(ex.anatomy||[]).map((a:any,i:number)=><li key={i}>{a}</li>)}
              </ul>
            </div>
            <div className="mt-2 text-sm">
              <div className="text-xs text-mut">Подсказки по технике</div>
              <ul className="list-disc pl-5">
                {(ex.cues||[]).map((c:any,i:number)=><li key={i}>{c}</li>)}
              </ul>
            </div>
            <div className="mt-2 text-xs text-mut">
              Не делай, если: {(ex.avoidIf||[]).join(', ') || '—'} • Нужно: {(ex.needs||[]).join(', ') || '—'}
            </div>
          </Card>
        ))}

        {shown.length===0 && (
          <Card title="Ничего не найдено" desc="Попробуй другое слово." right={<Pill tone="mut">0</Pill>}>
            <div className="text-sm text-mut">—</div>
          </Card>
        )}
      </div>
    </Container>
  )
}
