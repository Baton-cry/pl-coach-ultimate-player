import React, { useEffect, useMemo, useState } from 'react'
import { Card, Container, Pill, Topbar } from '../components'
import { getTopSetsAll, getCheckInsAll, getAchievements, unlockAchievement, getGamify, setGamify } from '../../core/db'
import { calcPoints, isoToday, isoWeekKey, levelFromPoints, questsForWeek, streakFromDatesISO, uniqueDatesISO } from '../../core/logic'

export function Game({ auth }:{ auth:any }){
  const [top,setTop]=useState<any[]>([])
  const [cis,setCis]=useState<any[]>([])
  const [achs,setAchs]=useState<any[]>([])
  const [points,setPoints]=useState(0)

  useEffect(()=>{
    (async()=>{
      const t = await getTopSetsAll()
      const c = await getCheckInsAll()
      setTop(t); setCis(c)
      const pts = calcPoints(t)
      setPoints(pts)

      const g = await getGamify()
      if (g.points !== pts){
        await setGamify({ ...g, points: pts, lastRecalcISO: isoToday() })
      }

      // unlock achievements (offline)
      const dates = uniqueDatesISO(t)
      const streak = streakFromDatesISO(dates)
      if (streak>=3) await unlockAchievement({ id:'streak3', title:'Серия 3', desc:'3 дня подряд есть запись тренировки', unlockedAtISO: isoToday() })
      if (streak>=7) await unlockAchievement({ id:'streak7', title:'Серия 7', desc:'7 дней подряд есть запись тренировки', unlockedAtISO: isoToday() })
      if (t.length>=10) await unlockAchievement({ id:'log10', title:'Дисциплина', desc:'10 записей топ-сетов', unlockedAtISO: isoToday() })
      if (t.length>=30) await unlockAchievement({ id:'log30', title:'Конвейер', desc:'30 записей топ-сетов', unlockedAtISO: isoToday() })

      setAchs(await getAchievements())
    })()
  },[])

  const workoutDates = useMemo(()=> uniqueDatesISO(top), [top])
  const streak = useMemo(()=> streakFromDatesISO(workoutDates), [workoutDates])
  const lvl = useMemo(()=> levelFromPoints(points), [points])

  const thisWeek = useMemo(()=>{
    const wk = isoWeekKey(isoToday())
    const wDates = workoutDates.filter(d=> isoWeekKey(d)===wk)
    const ptsThisWeek = top.filter(ts=> isoWeekKey(ts.dateISO)===wk).reduce((a,ts)=>a+Math.max(5,Math.round((ts.weightKg*(1+ts.reps/10))/10)),0)
    return { workouts: wDates.length, points: ptsThisWeek }
  },[top, workoutDates])

  const quests = useMemo(()=> questsForWeek(thisWeek.points, thisWeek.workouts), [thisWeek])

  return (
    <Container>
      <Topbar title="Ранги и интерактив" subtitle="Офлайн-версия геймификации: серия, уровни, квесты и ачивки." right={<Pill tone="red">streak</Pill>} />
      <div className="mt-4 space-y-3">
        <Card title="Серия" desc="Считается по дням, где ты записал хотя бы один топ-сет." right={<Pill tone={streak>=3?'ok':'mut'}>{streak} дн</Pill>} glow>
          <div className="text-sm text-mut">Хочешь «как в Liftoff» — серия здесь реально работает: просто не пропадай и логай тренировки.</div>
        </Card>

        <Card title="Уровень" desc="Очки идут от топ-сетов: тяжелее и больше повторов → больше." right={<Pill tone="red">lvl {lvl.level}</Pill>} glow>
          <div className="text-lg font-semibold">{lvl.title}</div>
          <div className="text-xs text-mut mt-1">Очки всего: {points} • до следующего: {lvl.nextAt}</div>
          <div className="mt-3 w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-2 bg-red" style={{width:`${Math.round(lvl.progress*100)}%`}}/>
          </div>
        </Card>

        <Card title="Квесты недели" desc="Мини-цели, чтобы не сливаться (и не убиваться на сушке)." right={<Pill tone="mut">{quests.length}</Pill>} glow>
          <div className="space-y-2">
            {quests.map(q=>(
              <div key={q.id} className="rounded-xl border border-stroke bg-bg2 p-3">
                <div className="flex justify-between gap-2">
                  <div className="font-semibold">{q.title}</div>
                  <div className="text-xs text-mut">{q.value}/{q.target} {q.unit}</div>
                </div>
                <div className="mt-2 w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-2 bg-red" style={{width:`${Math.min(100, Math.round((q.value/q.target)*100))}%`}}/>
                </div>
                <div className="text-xs text-mut mt-2">{q.tip}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Достижения" desc="Открываются сами." right={<Pill tone="mut">{achs.length}</Pill>}>
          <div className="space-y-2">
            {achs.map((a:any)=>(
              <div key={a.id} className="rounded-xl border border-stroke bg-bg2 p-3">
                <div className="font-semibold">{a.title}</div>
                <div className="text-xs text-mut">{a.desc}</div>
                <div className="text-[11px] text-mut mt-1">{a.unlockedAtISO}</div>
              </div>
            ))}
            {achs.length===0 && <div className="text-sm text-mut">Пока пусто. Запиши топ-сет в «Сегодня → Логи».</div>}
          </div>
        </Card>

        <Card title="Чек-ин" desc="Здесь для дисциплины и контроля восстановления." right={<Pill tone="mut">{cis.length}</Pill>}>
          <div className="text-sm text-mut">Чек-ин сам по себе не даёт «очки», но помогает вовремя понять, что ты зажался по сну/стрессу/весу.</div>
        </Card>
      </div>
    </Container>
  )
}
