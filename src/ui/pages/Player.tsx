import React, { useEffect, useMemo, useState } from 'react'
import { Btn, Card, Container, Input, Pill, Topbar } from '../components'
import { addTopSet, getCheckInsAll, getTopSetsAll } from '../../core/db'
import { e1rm, fatigueFlag, intensityMultiplier, isoToday, planFor, trainingMaxForLift, weightFromPct } from '../../core/logic'
import type { Lift } from '../../core/types'

type PlayerSet = { w:number, reps:number, rpe?:number|null, done:boolean }
type PlayerExercise = { lift: Lift, name:string, targetPct:number, targetW:number, sets: PlayerSet[], focus:string }
type PlayerState = {
  dateISO: string
  variant: 'normal'|'light'|'recovery'
  ex: PlayerExercise[]
  idxEx: number
  idxSet: number
  restSec: number
  restRunning: boolean
}

function liftName(l: Lift){ return l==='bench'?'Жим':l==='squat'?'Присед':'Тяга' }
const lsKey = (dateISO:string)=> `pl_player_${dateISO}`
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
const round2p5=(x:number)=> Math.round(x/2.5)*2.5

export function Player({ auth }:{ auth:any }){
  const today = isoToday()
  const [s,setS]=useState<any>(null)
  const [cis,setCis]=useState<any[]>([])
  const [top,setTop]=useState<any[]>([])
  const [state,setState]=useState<PlayerState|null>(null)
  const [rest,setRest]=useState<number>(0)

  useEffect(()=>{
    (async()=>{
      setS(await auth.getSettings())
      setCis(await getCheckInsAll())
      setTop(await getTopSetsAll())
    })()
  },[auth])

  const freshPlan = useMemo(()=>{
    if(!s) return null
    const fat = fatigueFlag(cis, today)
    const mult = intensityMultiplier(s, today, fat)
    const mode = s.goalMode || s.mode || 'cut'
    const plan = planFor(s, today, mult, mode)
    const exs: PlayerExercise[] = plan.map((p:any)=>{
      const tmObj = trainingMaxForLift(s, top as any, p.lift)
      const targetW = weightFromPct(tmObj.tm, p.pct)
      const sets: PlayerSet[] = Array.from({length:p.sets}).map(()=>({ w: targetW, reps: p.reps, rpe:null, done:false }))
      return {
        lift: p.lift,
        name: `${liftName(p.lift)} — ${p.focus}`,
        targetPct: p.pct,
        targetW,
        sets,
        focus: p.focus
      }
    })
    return exs
  },[s,cis,top,today])

  useEffect(()=>{
    if(!freshPlan || !s) return
    const raw = localStorage.getItem(lsKey(today))
    if(raw){
      try{
        const st = JSON.parse(raw) as PlayerState
        setState(st)
        setRest(st.restRunning ? (st.restSec||0) : 0)
        return
      }catch{}
    }
    const st: PlayerState = {
      dateISO: today,
      variant: 'normal',
      ex: freshPlan,
      idxEx: 0,
      idxSet: 0,
      restSec: 180,
      restRunning: false
    }
    setState(st)
    setRest(0)
    localStorage.setItem(lsKey(today), JSON.stringify(st))
  },[freshPlan,s,today])

  useEffect(()=>{
    if(!state?.restRunning) return
    if(rest<=0){
      setState(v=> v ? ({...v, restRunning:false}) : v)
      return
    }
    const t = setTimeout(()=> setRest(x=>x-1), 1000)
    return ()=> clearTimeout(t)
  },[state?.restRunning, rest])

  function save(st: PlayerState){
    setState(st)
    localStorage.setItem(lsKey(today), JSON.stringify(st))
  }

  function applyVariant(variant: PlayerState['variant']){
    if(!state) return
    const factor = variant==='normal' ? 1 : (variant==='light'?0.95:0.90)
    const volCut = variant==='normal'?0 : (variant==='light'?1:2)
    const ex = state.ex.map(e=>{
      const newW = Math.max(20, round2p5(e.targetW*factor))
      const keepN = Math.max(1, e.sets.length - volCut)
      const newSets = e.sets.slice(0, keepN).map(st=> ({...st, w: st.done?st.w:newW}))
      return { ...e, targetW:newW, sets:newSets }
    })
    save({ ...state, variant, ex })
  }

  if(!s || !state) return <div className="min-h-screen grid place-items-center text-mut">Загрузка…</div>

  const ex = state.ex[state.idxEx]
  const set = ex.sets[state.idxSet]
  const doneAll = state.ex.every(e=> e.sets.every(s=>s.done))

  const restLabel=(sec:number)=>`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`

  function markDone(){
    const exs = state.ex.map((e,ei)=>{
      if(ei!==state.idxEx) return e
      const sets = e.sets.map((s,si)=> si===state.idxSet ? ({...s, done:true}) : s)
      return { ...e, sets }
    })
    let idxEx=state.idxEx, idxSet=state.idxSet
    if(idxSet < ex.sets.length-1) idxSet++
    else if(idxEx < state.ex.length-1){ idxEx++; idxSet=0 }
    const st = { ...state, ex:exs, idxEx, idxSet, restRunning:true }
    setRest(state.restSec)
    save(st)
  }

  function editSet(field:'w'|'reps'|'rpe', val:number){
    const exs = state.ex.map((e,ei)=>{
      if(ei!==state.idxEx) return e
      const sets = e.sets.map((s,si)=>{
        if(si!==state.idxSet) return s
        if(field==='rpe') return { ...s, rpe: val }
        if(field==='w') return { ...s, w: val }
        return { ...s, reps: val }
      })
      return { ...e, sets }
    })
    save({ ...state, ex: exs })
  }

  async function finishAndLog(){
    for(const e of state.ex){
      const doneSets = e.sets.filter(s=>s.done)
      if(!doneSets.length) continue
      const best = doneSets.sort((a,b)=> b.w-a.w)[0]
      await addTopSet({ dateISO: today, lift: e.lift, weightKg: best.w, reps: best.reps, e1rm: e1rm(best.w, best.reps) })
    }
    localStorage.removeItem(lsKey(today))
    alert('Готово. Лучшие сеты записаны в Логи.')
  }

  const coachTip = (()=> {
    if(set.rpe && set.rpe>=9) return 'Слишком близко к отказу. Следующий сет: -2.5 кг или -1 повтор.'
    if(set.rpe && set.rpe<=7) return 'Запас большой. Следующий сет: +2.5 кг (если техника чистая).'
    return 'Держи 1–2 повтора в запасе (RIR), особенно на сушке.'
  })()

  return (
    <Container>
      <Topbar title="Тренинг‑плеер" subtitle="Пошагово: сет → отдых → следующий сет. Офлайн." right={<Pill tone="red">PRO</Pill>} />
      <div className="mt-4 space-y-3">

        <Card title="Автозамена тренировки по усталости" desc="Переключай режим — я облегчаю веса/объём. Это умнее, чем срываться." right={<Pill tone="mut">{state.variant}</Pill>} glow>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Норм','normal'],
              ['Лёгкая','light'],
              ['Восст','recovery'],
            ].map(([label,val])=>{
              const active = state.variant===val
              return (
                <button key={val} onClick={()=>applyVariant(val as any)}
                  className={`px-3 py-2 rounded-xl text-sm border transition-all duration-300 ${
                    active?'bg-red/15 border-red/40 text-text':'bg-white/5 border-stroke text-mut hover:bg-white/10'
                  }`}>
                  {label}
                </button>
              )
            })}
          </div>
          <div className="text-xs text-mut mt-2">
            Норм = план • Лёгкая = техника/скорость (-5% и -1 сет) • Восст = восстановление (-10% и -2 сета).
          </div>
        </Card>

        <Card title="Текущий сет" desc="Заполни факт (вес/повторы/RPE) → «Сет сделан». Таймер отдыха стартует сам." right={<Pill tone="red">{state.idxEx+1}/{state.ex.length}</Pill>} glow>
          <div className="text-sm font-semibold">{ex.name}</div>
          <div className="text-xs text-mut mt-1">Цель: {Math.round(ex.targetPct*1000)/10}% • {ex.targetW} кг • сетов: {ex.sets.length} • сейчас: {state.idxSet+1}</div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-stroke bg-bg2 p-3">
              <div className="text-xs text-mut">Вес (кг)</div>
              <Input inputMode="decimal" value={String(set.w)} onChange={e=>editSet('w', Number(e.target.value))} />
            </div>
            <div className="rounded-xl border border-stroke bg-bg2 p-3">
              <div className="text-xs text-mut">Повторы</div>
              <Input inputMode="numeric" value={String(set.reps)} onChange={e=>editSet('reps', Number(e.target.value))} />
            </div>
            <div className="rounded-xl border border-stroke bg-bg2 p-3">
              <div className="text-xs text-mut">RPE</div>
              <Input inputMode="decimal" value={set.rpe==null?'':String(set.rpe)} onChange={e=>editSet('rpe', Number(e.target.value))} placeholder="6–10" />
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-stroke bg-card p-3 text-sm text-mut">{coachTip}</div>

          <div className="mt-3 flex gap-2">
            <Btn className="flex-1" tone="red" onClick={markDone}>Сет сделан</Btn>
            <Btn className="flex-1" tone="ghost" onClick={()=>save({ ...state, idxEx: clamp(state.idxEx-1,0,state.ex.length-1), idxSet:0 })}>Назад</Btn>
          </div>
        </Card>

        <Card title="Отдых" desc="Выбери длительность и жми старт. Работает офлайн." right={<Pill tone={state.restRunning?'red':'mut'}>{state.restRunning?restLabel(rest):'готов'}</Pill>} glow>
          <div className="flex gap-2">
            {[120,180,240].map(v=>(
              <button key={v}
                onClick={()=>{ save({ ...state, restSec: v }); setRest(v) }}
                className={`px-3 py-2 rounded-xl text-sm border transition-all duration-300 ${
                  state.restSec===v?'bg-red/15 border-red/40':'bg-white/5 border-stroke text-mut'
                }`}>
                {Math.floor(v/60)}:{String(v%60).padStart(2,'0')}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Btn className="flex-1" onClick={()=>{ setRest(state.restSec); save({ ...state, restRunning:true }) }}>Старт</Btn>
            <Btn className="flex-1" tone="ghost" onClick={()=>{ setRest(0); save({ ...state, restRunning:false }) }}>Стоп</Btn>
          </div>
        </Card>

        <Card title="Сводка тренировки" desc="Нажми на номер сета — прыгнешь к нему. В конце можно одним нажатием записать в Логи." right={<Pill tone={doneAll?'ok':'mut'}>{doneAll?'готово':'идёт'}</Pill>}>
          <div className="space-y-2">
            {state.ex.map((e,ei)=>(
              <div key={ei} className="rounded-xl border border-stroke bg-bg2 p-3">
                <div className="flex justify-between gap-2">
                  <div className="font-semibold text-sm">{e.name}</div>
                  <div className="text-xs text-mut">{e.sets.filter(s=>s.done).length}/{e.sets.length}</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {e.sets.map((s,si)=>(
                    <button key={si}
                      onClick={()=>save({ ...state, idxEx: ei, idxSet: si })}
                      className={`px-2 py-1 rounded-lg text-[11px] border ${
                        s.done?'bg-green-500/15 border-green-500/30 text-green-300':
                        (ei===state.idxEx && si===state.idxSet)?'bg-red/15 border-red/40 text-text':
                        'bg-white/5 border-stroke text-mut'
                      }`}>
                      {si+1}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <Btn className="w-full" tone={doneAll?'red':'mut'} onClick={finishAndLog}>Завершить и записать в Логи</Btn>
            <div className="text-xs text-mut mt-2">Записываю лучший (самый тяжёлый) выполненный сет по каждому главному движению.</div>
          </div>
        </Card>

      </div>
    </Container>
  )
}
