import React, { useEffect, useMemo, useState } from 'react'
import { Btn, Card, Container, Input, Pill, Select, Topbar } from '../components'
import { addTopSet, getCheckInsAll, getExercisesAll, getNutrition, getTopSetsAll, upsertCheckIn, upsertNutrition } from '../../core/db'
import { coachAdjustVolume, e1rm, fatigueFlag, intensityMultiplier, isoToday, modeAutoFromTopSets, nutritionTargets, planFor, substitutionsForLift, trainingMaxForLift, weightFromPct } from '../../core/logic'
import type { Lift } from '../../core/types'

function liftName(l: Lift){ return l==='bench'?'Жим':l==='squat'?'Присед':'Тяга (сумо/классика)' }

export function Today({ auth }:{ auth:any }){
  const today=isoToday()
  const [s,setS]=useState<any>(null)
  const [checkins,setCheckins]=useState<any[]>([])
  const [topsets,setTopsets]=useState<any[]>([])
  const [ex,setEx]=useState<any[]>([])
  const [nu,setNu]=useState<any>(null)

  const [weight,setWeight]=useState('')
  const [steps,setSteps]=useState('')
  const [sleep,setSleep]=useState(3)
  const [stress,setStress]=useState(3)
  const [kcal,setKcal]=useState('')

  // liftoff-like readiness
  const [timeMin,setTimeMin]=useState<45|60|90>(60)
  const [pain,setPain]=useState<'none'|'mild'|'sharp'>('none')
  const [mood,setMood]=useState<1|2|3|4|5>(3)

  // log top set quick
  const [lift,setLift]=useState<Lift>('bench')
  const [wTop,setWTop]=useState('')
  const [reps,setReps]=useState('3')

  async function refresh(){
    setS(await auth.getSettings())
    setCheckins(await getCheckInsAll())
    setTopsets(await getTopSetsAll())
    setEx(await getExercisesAll())
    setNu(await getNutrition(today))
  }
  useEffect(()=>{ refresh() },[])

  const computed = useMemo(()=>{
    if(!s) return null
    const fatigue=fatigueFlag(checkins.slice(-14), s)
    const auto=modeAutoFromTopSets(topsets, today)
    const mode = s.mode==='auto'?auto:s.mode
    const mult=intensityMultiplier(mode, fatigue)
    const plan=planFor(s, today, mult, mode)
    const nut=nutritionTargets(s, mode)
    const ready={ pain, timeMin, mood } as any
    return { fatigue, mode, mult, plan, nut, ready }
  },[s,checkins,topsets,today,pain,timeMin,mood])

  if(!s || !computed) return <div className="min-h-screen grid place-items-center text-mut">Загрузка…</div>

  const fatigueTone = computed.fatigue==='HIGH'?'warn':'ok'
  const modeLabel = computed.mode==='cut'?'Сушка':computed.mode==='mass'?'Масса':'Авто'

  return (
    <Container>
      <Topbar title="Сегодня" subtitle="План + замены + мини-коуч" right={<Btn tone="mut" onClick={()=>auth.lock()}>Выйти</Btn>} />

      <div className="mt-3">
        <Card
          title="Готовность (как в Liftoff, но без магии)"
          desc="Выбираешь время/боль/настроение — и объём автоматически ужмётся, чтобы ты не ломал себя на сушке."
          right={<Pill tone={fatigueTone}>{computed.fatigue}</Pill>}
          glow
        >
          <div className="grid grid-cols-3 gap-2">
            <Select value={String(timeMin)} onChange={e=>setTimeMin(Number(e.target.value) as any)}>
              <option value="45">45 мин</option>
              <option value="60">60 мин</option>
              <option value="90">90 мин</option>
            </Select>
            <Select value={pain} onChange={e=>setPain(e.target.value as any)}>
              <option value="none">Боль: нет</option>
              <option value="mild">Боль: ноет</option>
              <option value="sharp">Боль: резкая</option>
            </Select>
            <Select value={String(mood)} onChange={e=>setMood(Number(e.target.value) as any)}>
              <option value="1">Настроение 1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </Select>
          </div>
          <div className="text-xs text-mut mt-2">Если боль резкая — лучше замена на технику/объём, а не “тяжело”.</div>
        </Card>
      </div>

      <div className="mt-3 space-y-3">
        <Card title="Тренировка" desc={`Режим: ${modeLabel} • Множитель интенсивности ×${computed.mult} (учёт усталости).`}>
          <div className="space-y-2">
            {computed.plan.map((p:any,idx:number)=>{
              const tm = trainingMaxForLift(s, topsets, p.lift)
              const w = weightFromPct(tm.tm, p.pct)
              const adjSets = coachAdjustVolume(p.sets, computed.ready)
              return (
                <div key={idx} className="rounded-xl p-3 border border-stroke bg-bg2">
                  <div className="flex justify-between gap-3">
                    <div className="font-semibold">{liftName(p.lift)} {p.main && <span className="text-xs text-red">• главное</span>}</div>
                    <div className="text-sm">{w} кг</div>
                  </div>
                  <div className="text-xs text-mut mt-1">
                    {Math.round(p.pct*1000)/10}% • {adjSets}×{p.reps} • фокус: {p.focus}
                  </div>
                  <div className="text-[11px] text-mut mt-1">TM: {tm.tm} кг (источник {tm.source}) • Рекоменд. добивка: {p.accessories.join(' • ')}</div>

                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-red">Показать замены + анатомию</summary>
                    <div className="mt-2 space-y-2">
                      {substitutionsForLift(p.lift, ex, s).slice(0,3).map((x:any,i:number)=>(
                        <div key={i} className="rounded-xl p-3 border border-stroke bg-card/60">
                          <div className="font-semibold">{x.name} <span className="text-xs text-mut">({x.recommendedSetsReps})</span></div>
                          <div className="text-xs text-mut mt-1"><span className="text-text">Основные:</span> {x.primary.join(', ')}</div>
                          <div className="text-xs text-mut mt-1"><span className="text-text">Плюсы:</span> {x.benefits.join(' • ')}</div>
                          <div className="text-xs text-mut mt-1"><span className="text-text">Анатомия:</span> {x.anatomy.join(' • ')}</div>
                          <div className="text-xs text-mut mt-1"><span className="text-text">Подсказки:</span> {x.cues.join(' • ')}</div>
                          <div className="text-xs text-mut mt-1"><span className="text-text">Не делай, если:</span> {x.avoidIf.join(', ') || '—'}</div>
                          <div className="text-[11px] text-mut mt-1">Нужно: {x.needs.join(', ')}</div>
                        </div>
                      ))}
                      {substitutionsForLift(p.lift, ex, s).length===0 && (
                        <div className="text-xs text-mut">Нет подходящих замен. Проверь “Оборудование” и “Ограничения” в настройках.</div>
                      )}
                    </div>
                  </details>
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="КБЖУ + быстрый лог" desc="Занёс калории — получаешь понятную корректировку. Белок/жиры стабильны, угли гуляют под тренировки." right={<Pill tone="red">{computed.nut.kcal} ккал</Pill>} glow>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-3 border border-stroke bg-bg2"><div className="text-xs text-mut">Белок</div><div className="font-semibold">{computed.nut.protein} г</div></div>
            <div className="rounded-xl p-3 border border-stroke bg-bg2"><div className="text-xs text-mut">Жиры</div><div className="font-semibold">{computed.nut.fat} г</div></div>
            <div className="rounded-xl p-3 border border-stroke bg-bg2"><div className="text-xs text-mut">Угли</div><div className="font-semibold">{computed.nut.carbs} г</div></div>
          </div>
          <div className="mt-3 flex gap-2">
            <Input className="flex-1" inputMode="numeric" placeholder="Сколько ккал съел сегодня" value={kcal} onChange={e=>setKcal(e.target.value)} />
            <Btn onClick={async()=>{
              const k=Number(kcal); if(!Number.isFinite(k)||k<=0) return
              await upsertNutrition({dateISO:today, calories:Math.round(k), proteinG:null, fatG:null, carbsG:null})
              setKcal(''); await refresh()
            }}>Сохранить</Btn>
          </div>
          <div className="text-xs text-mut mt-2">Факт сегодня: <span className="text-text">{nu?.calories ?? '—'}</span></div>
        </Card>

        <Card title="Чек-ин (2 минуты)" desc="Это нужно, чтобы приложение не заставляло тебя “геройствовать”, когда ты разваливаешься.">
          <div className="grid grid-cols-2 gap-2">
            <Input inputMode="decimal" placeholder="Вес утром (кг)" value={weight} onChange={e=>setWeight(e.target.value)} />
            <Input inputMode="numeric" placeholder="Шаги (сегодня)" value={steps} onChange={e=>setSteps(e.target.value)} />
            <Select value={String(sleep)} onChange={e=>setSleep(Number(e.target.value) as any)}>
              {[1,2,3,4,5].map(x=><option key={x} value={x}>Сон {x}</option>)}
            </Select>
            <Select value={String(stress)} onChange={e=>setStress(Number(e.target.value) as any)}>
              {[1,2,3,4,5].map(x=><option key={x} value={x}>Стресс {x}</option>)}
            </Select>
          </div>
          <div className="mt-2">
            <Btn className="w-full" onClick={async()=>{
              const wv=weight.trim()===''?null:Number(weight)
              const st=steps.trim()===''?null:Number(steps)
              await upsertCheckIn({dateISO:today, weightMorningKg:(wv&&Number.isFinite(wv))?Math.round(wv*10)/10:null,
                sleep1to5:sleep as any, stress1to5:stress as any, steps:(st&&Number.isFinite(st))?Math.round(st):null, note:null})
              setWeight(''); setSteps(''); await refresh()
            }}>Сохранить чек-ин</Btn>
          </div>
        </Card>

        <Card title="Быстрый лог топ-сета (для авто TM)" desc="Запиши лучший сет главного движения. Это подтянет рабочие веса автоматически." right={<Pill tone="mut">e1RM</Pill>}>
          <div className="grid grid-cols-3 gap-2">
            <Select value={lift} onChange={e=>setLift(e.target.value as any)}>
              <option value="bench">Жим</option>
              <option value="squat">Присед</option>
              <option value="deadlift">Тяга</option>
            </Select>
            <Input inputMode="decimal" placeholder="Вес" value={wTop} onChange={e=>setWTop(e.target.value)} />
            <Input inputMode="numeric" placeholder="Повт." value={reps} onChange={e=>setReps(e.target.value)} />
          </div>
          <div className="mt-2">
            <Btn className="w-full" onClick={async()=>{
              const ww=Number(wTop), rr=Number(reps)
              if(!Number.isFinite(ww)||!Number.isFinite(rr)||ww<=0||rr<=0) return
              const est=e1rm(ww,rr)
              await addTopSet({dateISO:today,lift,weightKg:ww,reps:rr,rpe:null,e1rm:est,note:null})
              setWTop(''); await refresh()
              alert(`Сохранено. e1RM ≈ ${est} кг`)
            }}>Сохранить топ-сет</Btn>
          </div>
        </Card>
      </div>
    </Container>
  )
}
