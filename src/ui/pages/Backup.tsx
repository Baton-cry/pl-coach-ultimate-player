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
          <input
  type="file"
  accept=".plideal,.json,.txt,*/*"
  className="text-sm"
  onChange={async (e) => {
    const input = e.currentTarget
    try {
      const f = input.files?.[0]
      if (!f) return

      if (!auth?.password) {
        setMsg("Нужно войти по паролю")
        return
      }

      // iOS иногда даёт странный тип/расширение — читаем как текст без условий
      const txt = await f.text()

      // 1) пробуем как JSON (обычный путь)
      let parsed: any
      try {
        parsed = JSON.parse(txt)
      } catch {
        // 2) если не JSON (например файл случайно сохранился с мусором/обёрткой) — выходим
        setMsg("Файл не похож на JSON (.plideal). Пересохрани экспорт заново.")
        return
      }

      // дальше твоя старая логика
      const plain = await decryptBackup(auth.password, parsed)
      const data = JSON.parse(plain)

      await clearAllExceptPassword()
      await setSettings(data.settings)

      const d = await db()
      for (const ci of (data.checkins || [])) {
        await d.put("checkins", ci, `${ci.key}:${ci.dateISO}` as any)
      }
      for (const nu of (data.nutrition || [])) {
        await d.put("nutrition", nu, `${nu.key}:${nu.dateISO}` as any)
      }
      for (const ts of (data.topsets || [])) {
        await d.add("topsets", ts)
      }

      // exercises (fallback to seed)
      await seedExercises((data.exercises && data.exercises.length) ? data.exercises : EXERCISES)

      setMsg("Импорт завершён.")
    } catch {
      setMsg("Ошибка импорта (файл/пароль).")
    } finally {
      // важно для iOS: иначе повторный выбор того же файла не сработает
      input.value = ""
      if (input.files) {
        // @ts-ignore
        input.files = null
      }
    }
  }}
/>
        </Card>

        {msg && <div className="text-sm text-mut">{msg}</div>}
      </div>
    </Container>
  )
}
