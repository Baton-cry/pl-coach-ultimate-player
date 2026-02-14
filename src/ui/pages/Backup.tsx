import React, { useState } from 'react'
import { Btn, Card, Container, Pill, Topbar } from '../components'
import { db, getCheckInsAll, getExercisesAll, getNutritionAll, getSettings, getTopSetsAll, setSettings, upsertCheckIn, upsertNutrition, addTopSet, seedExercises, clearAllExceptPassword } from '../../core/db'
import { decryptBackup, encryptBackup, type BackupFileV1 } from '../../core/crypto'
import { EXERCISES } from '../../core/exercises_seed'
import { isoToday } from '../../core/logic'

function download(filename: string, text: string){
  const a=document.createElement('a')
  a.href=URL.createObjectURL(new Blob([text],{type:'application/octet-stream'}))
  a.download=filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(a.href)
}

export function Backup({ auth }:{ auth:any }){
  const [msg,setMsg]=useState<string|null>(null)

  return (
    <Container>
      <Topbar title="Бэкап" subtitle="Экспорт/импорт через iCloud Drive. Файл шифруется твоим паролем." right={<Pill tone="mut">.plideal</Pill>} />
      <div className="mt-4 space-y-3">
        <Card title="Экспорт" desc="Создаёт один зашифрованный файл. Сохрани его в iCloud Drive.">
          <Btn className="w-full" onClick={async()=>{
            if(!auth.password){ setMsg('Нужно войти по паролю'); return }
            const payload={
              settings: await auth.getSettings(),
              checkins: await getCheckInsAll(),
              topsets: await getTopSetsAll(),
              nutrition: await getNutritionAll(),
              exercises: await getExercisesAll()
            }
            const enc=await encryptBackup(auth.password, JSON.stringify(payload))
            download(`plideal-${isoToday()}.plideal`, JSON.stringify(enc))
            setMsg('Экспорт готов. Сохрани файл в iCloud Drive.')
          }}>Сделать экспорт</Btn>
        </Card>

        <Card title="Импорт" desc="Импорт заменит текущие данные данными из файла (аккуратно).">
          <input type="file" accept=".plideal,application/json" className="text-sm" onChange={async(e)=>{
            try{
              const f=e.target.files?.[0]; if(!f) return
              if(!auth.password){ setMsg('Нужно войти по паролю'); return }
              const txt=await f.text()
              const parsed=JSON.parse(txt) as BackupFileV1
              const plain=await decryptBackup(auth.password, parsed)
              const data=JSON.parse(plain)
              await clearAllExceptPassword()
              await setSettings(data.settings)
              const d=await db()
              for(const ci of (data.checkins||[])) await d.put('checkins',{...ci,key:ci.dateISO} as any)
              for(const nu of (data.nutrition||[])) await d.put('nutrition',{...nu,key:nu.dateISO} as any)
              for(const ts of (data.topsets||[])) await d.add('topsets', ts)
              // exercises (fallback to seed)
              await seedExercises(data.exercises?.length?data.exercises:EXERCISES)
              setMsg('Импорт завершён.')
            } catch {
              setMsg('Ошибка импорта (файл/пароль).')
            } finally {
              e.currentTarget.value=''
            }
          }} />
        </Card>

        {msg && <div className="text-sm text-mut">{msg}</div>}
      </div>
    </Container>
  )
}
