import React, { useEffect, useState } from 'react'
import { Btn, Card, Container, Input, Pill, Select, Topbar } from '../components'
import type { Settings, Mode } from '../../core/types'

export function SettingsPage({ auth }:{ auth:any }){
  const [s,setS]=useState<Settings|null>(null)
  useEffect(()=>{ (async()=> setS(await auth.getSettings()))() },[])
  if(!s) return <div className="min-h-screen grid place-items-center text-mut">Загрузка…</div>

  const days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

  return (
    <Container>
      <Topbar title="Настройки" subtitle="Один раз настроил — потом только живёшь по плану." right={<Pill tone="mut">PRO</Pill>} />
      <div className="mt-4 space-y-3">

        <Card title="Цель" desc="Авто: приложение выбирает сушку/массу по динамике e1RM за 30 дней.">
          <div className="grid grid-cols-2 gap-2">
            <Select value={s.mode} onChange={e=>setS({ ...s, mode:e.target.value as Mode })}>
              <option value="auto">Авто</option>
              <option value="cut">Сушка</option>
              <option value="mass">Масса</option>
            </Select>
            <Select value={String(s.activity)} onChange={e=>setS({ ...s, activity:Number(e.target.value) as any })}>
              <option value="1.45">Активность 1.45</option>
              <option value="1.55">Активность 1.55</option>
              <option value="1.65">Активность 1.65</option>
              <option value="1.75">Активность 1.75</option>
            </Select>
          </div>
        </Card>

        <Card title="Тело" desc="Вес и процент жира нужны для КБЖУ. Не надо суперточно — достаточно адекватной оценки.">
          <div className="grid grid-cols-2 gap-2">
            <Input inputMode="decimal" value={String(s.bwKg)} onChange={e=>setS({ ...s, bwKg:Number(e.target.value) })} placeholder="Вес (кг)" />
            <Input inputMode="decimal" value={String(s.bfPercent)} onChange={e=>setS({ ...s, bfPercent:Number(e.target.value) })} placeholder="Жир (%)" />
          </div>
        </Card>

        <Card title="Дни тренировок" desc="Отметь дни недели, когда ты реально тренируешься. Календарь и план будут честными.">
          <div className="grid grid-cols-4 gap-2">
            {days.map((d,i)=>{
              const val=i+1
              const active=s.trainingDays.includes(val)
              return (
                <button key={val} onClick={()=>{
                  const arr=[...s.trainingDays]
                  setS({ ...s, trainingDays: active ? arr.filter(x=>x!==val) : [...arr,val] })
                }} className={`px-3 py-2 rounded-xl text-xs border transition-all ${active?'bg-red/20 border-red text-red':'border-stroke text-mut hover:bg-white/5'}`}>
                  {d}
                </button>
              )
            })}
          </div>
        </Card>

        <Card title="1RM и авто-TM" desc="Авто TM делает рабочие веса умнее: берёт свежий e1RM и делает запас (фактор).">
          <div className="grid grid-cols-3 gap-2">
            <Input inputMode="decimal" value={String(s.rmBench)} onChange={e=>setS({ ...s, rmBench:Number(e.target.value) })} placeholder="Жим 1RM" />
            <Input inputMode="decimal" value={String(s.rmSquat)} onChange={e=>setS({ ...s, rmSquat:Number(e.target.value) })} placeholder="Присед 1RM" />
            <Input inputMode="decimal" value={String(s.rmDeadlift)} onChange={e=>setS({ ...s, rmDeadlift:Number(e.target.value) })} placeholder="Тяга 1RM" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Select value={s.useAutoTM?'on':'off'} onChange={e=>setS({ ...s, useAutoTM: e.target.value==='on' })}>
              <option value="on">Авто TM: ВКЛ</option>
              <option value="off">Авто TM: ВЫКЛ</option>
            </Select>
            <Input inputMode="decimal" value={String(s.tmFactor)} onChange={e=>setS({ ...s, tmFactor:Number(e.target.value) })} placeholder="Фактор TM (0.90–0.97)" />
          </div>
        </Card>

        <Card title="Оборудование" desc="Это влияет на автозамены: если чего-то нет — не предлагать. Отметь, что реально есть. Тогда замены будут не фантазией, а по делу.">
          <div className="grid grid-cols-2 gap-2">
            {['штанга','стойки','скамья','гантели','плинты/блоки','бокс/лавка','платформа/блин'].map(it=>{
              const active=s.equipment.includes(it)
              return (
                <button key={it} onClick={()=>{
                  const arr=[...s.equipment]
                  setS({ ...s, equipment: active ? arr.filter(x=>x!==it) : [...arr,it] })
                }} className={`px-3 py-2 rounded-xl text-xs border transition-all ${active?'bg-red/20 border-red text-red':'border-stroke text-mut hover:bg-white/5'}`}>{it}</button>
              )
            })}
          </div>
        </Card>

        <Card title="Ограничения" desc="Напиши: плечо, локоть, поясница, колено, приводящие и т.д. — я буду скрывать плохие варианты. Это не диагноз. Просто чтобы не предлагать плохие варианты, если что-то болит.">
          <div className="grid grid-cols-2 gap-2">
            {['острая боль в плече','боль в локте','сильная боль в колене','острая боль в пояснице','боль в спине','сильная усталость'].map(it=>{
              const active=s.limitations.includes(it)
              return (
                <button key={it} onClick={()=>{
                  const arr=[...s.limitations]
                  setS({ ...s, limitations: active ? arr.filter(x=>x!==it) : [...arr,it] })
                }} className={`px-3 py-2 rounded-xl text-xs border transition-all ${active?'bg-red/20 border-red text-red':'border-stroke text-mut hover:bg-white/5'}`}>{it}</button>
              )
            })}
          </div>
        </Card>

        <Card title="Старт цикла" desc="От этой даты крутится цикл: Жим → Присед → Тяга и 4 недели (лёгкая→…→тяжёлая).">
          <Input type="date" value={s.startDateISO} onChange={e=>setS({ ...s, startDateISO:e.target.value })} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input inputMode="numeric" value={String(s.stepsTarget)} onChange={e=>setS({ ...s, stepsTarget:Number(e.target.value) })} placeholder="Цель шагов" />
            <Input inputMode="decimal" value={String(s.targetWeeklyLossPct)} onChange={e=>setS({ ...s, targetWeeklyLossPct:Number(e.target.value) })} placeholder="% снижения/нед" />
          </div>
        </Card>

        <Btn className="w-full" onClick={async()=>{ await auth.saveSettings(s); alert('Сохранено') }}>Сохранить</Btn>
      </div>
    </Container>
  )
}
