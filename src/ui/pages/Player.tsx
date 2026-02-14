import React, { useEffect, useMemo, useState } from "react"
import { Container, Topbar } from "../components"
import { isoToday, fatigueFlag, intensityMultiplier, planFor } from "../../core/logic"

export function Player({ auth }: { auth: any }) {
  const today = isoToday()

  const [s, setS] = useState<any | null>(null)
  const [cis, setCis] = useState<any[]>([])
  const [top, setTop] = useState<any[]>([])
  const [state, setState] = useState<any | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        if (!auth) return
        const settings = await auth.getSettings?.()
        setS(settings ?? null)

        // если у тебя эти методы есть — отлично, если нет — просто будут []
        const checkins = await (typeof auth.getCheckInsAll === "function" ? auth.getCheckInsAll() : [])
        const topsets = await (typeof auth.getTopSetsAll === "function" ? auth.getTopSetsAll() : [])

        setCis(Array.isArray(checkins) ? checkins : [])
        setTop(Array.isArray(topsets) ? topsets : [])
      } catch (e) {
        console.error(e)
        setS(null)
        setCis([])
        setTop([])
      }
    })()
  }, [auth])

  // ВСЕГДА массив
  const freshPlan = useMemo(() => {
    if (!s) return []

    const fat = fatigueFlag(Array.isArray(cis) ? cis : [], today)
    const mult = intensityMultiplier(s, today, fat)
    const mode = ((s.goalMode || s.mode || "cut") as "mass" | "cut")

    const planRaw = planFor(s, today, mult, mode) as any
    const plan = Array.isArray(planRaw) ? planRaw : []

    const exs = plan.map((p: any) => ({
      lift: p.lift,
      name: `${p.lift} -> ${p.focus}`,
      sets: [],
      focus: p.focus,
    }))

    return Array.isArray(exs) ? exs : []
  }, [s, cis, today])

  useEffect(() => {
    // если тебе реально нужен state — сохраняем
    setState(freshPlan)
  }, [freshPlan])

  // если вообще нет настроек — покажем заглушку
  if (!s) {
    return (
      <Container>
        <Topbar title="Player" />
        <div className="p-4 text-sm opacity-70">Нет настроек/данных</div>
      </Container>
    )
  }

  return (
    <Container>
      <Topbar title="Player" />
      <div className="p-4 space-y-2">
        {freshPlan.length === 0 ? (
          <div className="text-sm opacity-70">Нет плана</div>
        ) : (
          freshPlan.map((ex: any, i: number) => (
            <div key={i} className="border rounded-xl p-3">
              {ex?.name ?? "—"}
            </div>
          ))
        )}
      </div>
    </Container>
  )
}

export default Player