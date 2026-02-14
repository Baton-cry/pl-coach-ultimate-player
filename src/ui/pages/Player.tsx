import React, { useEffect, useMemo, useState } from "react"
import { Container, Topbar, Card } from "../components"
import { getCheckInsAll, getTopSetsAll } from "../../core/db"
import {
  syncFromCloud,
  fatigueFlag,
  intensityMultiplier,
  isoToday,
  planFor,
  trainingMaxForLift,
  weightFromPct,
} from "../../core/logic"
import type { Lift } from "../../core/types"

type Mode = "mass" | "cut"

function liftName(l: Lift) {
  if (l === "bench") return "Жим"
  if (l === "squat") return "Присед"
  if (l === "deadlift") return "Тяга"
  return String(l)
}

function pickMode(s: any): Mode {
  const m = s?.goalMode ?? s?.mode
  return m === "mass" || m === "cut" ? m : "cut"
}

function safeNumber(x: any, fallback = 0) {
  const n = Number(x)
  return Number.isFinite(n) ? n : fallback
}

export function Player({ auth }: { auth: any }) {
  const today = isoToday()

  const [s, setS] = useState<any>(null)
  const [cis, setCis] = useState<any[]>([])
  const [top, setTop] = useState<any[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setErr(null)
        await syncFromCloud()
        const settings = await auth?.getSettings?.()
        const cisAll = await getCheckInsAll()
        const topAll = await getTopSetsAll()
        if (!alive) return
        setS(settings ?? null)
        setCis(Array.isArray(cisAll) ? cisAll : [])
        setTop(Array.isArray(topAll) ? topAll : [])
      } catch (e: any) {
        if (!alive) return
        setErr(e?.message ? String(e.message) : "Ошибка загрузки данных")
      }
    })()
    return () => {
      alive = false
    }
  }, [auth])

  const plan = useMemo(() => {
    if (!s) return []

    const cisArr = Array.isArray(cis) ? cis : []

    const fat = fatigueFlag(cisArr as any, s as any)
    const mult = intensityMultiplier(s as any, fat)
    const mode = ((s as any)?.goalMode || (s as any)?.mode || "cut") as any

    const raw = planFor(s, today, mult, mode) as any
    const arr = Array.isArray(raw) ? raw : []

    // Приводим к максимально простому виду для отображения
    return arr.map((p: any) => {
      const lift: Lift = p?.lift
      const focus = String(p?.focus ?? "")
      const sets = safeNumber(p?.sets, 0)
      const reps = safeNumber(p?.reps, 0)
      const pct = safeNumber(p?.basePct, 0)

      let tm = 0
      try {
        tm = safeNumber(trainingMaxForLift(top as any, s as any, lift), 0)
      } catch {
        tm = 0
      }

      let targetW = 0
      try {
        targetW = safeNumber(weightFromPct(tm, pct), 0)
      } catch {
        targetW = 0
      }

      return {
        lift,
        title: `${liftName(lift)} — ${focus || "тренировка"}`,
        focus,
        sets,
        reps,
        pct,
        targetW,
      }
    })
  }, [s, cis, top, today])

  if (err) {
    return (
      <Container>
        <Topbar title="Player" subtitle="Ошибка" />
        <div className="p-4 text-sm opacity-80">{err}</div>
      </Container>
    )
  }

  if (!s) {
    return (
      <Container>
        <Topbar title="Player" subtitle="Загрузка..." />
        <div className="p-4 text-sm opacity-70">Загружаю данные…</div>
      </Container>
    )
  }

  if (!plan.length) {
    return (
      <Container>
        <Topbar title="Player" subtitle={today} />
        <div className="p-4 text-sm opacity-70">Нет плана</div>
      </Container>
    )
  }

  return (
    <Container>
      <Topbar title="Player" subtitle={today} />
      <div className="p-4 space-y-2">
        {plan.map((ex: any, i: number) => (
          <Card
            key={i}
            title={ex.title}
            desc={`${ex.sets}×${ex.reps} • ${Math.round(ex.pct * 100)}% • ≈ ${Math.round(ex.targetW)} кг`}
          >
            {ex.focus ? (
              <div className="text-xs opacity-70 mt-1">{ex.focus}</div>
            ) : null}
          </Card>
        ))}
      </div>
    </Container>
  )
}

export default Player