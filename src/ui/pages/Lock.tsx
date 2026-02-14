import { useEffect, useState } from "react"

export function Lock({ auth }: any) {

  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // 👉 реальный статус сети
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onUp = () => setOnline(true)
    const onDown = () => setOnline(false)

    window.addEventListener("online", onUp)
    window.addEventListener("offline", onDown)

    return () => {
      window.removeEventListener("online", onUp)
      window.removeEventListener("offline", onDown)
    }
  }, [])

  async function go() {
    setErr(null)

    if (pw.length < 6) {
      setErr("Пароль минимум 6 символов")
      return
    }

    setBusy(true)
    try {
      if (!auth.hasPass) {
        if (pw !== pw2) {
          setErr("Пароли не совпали")
          return
        }
        await auth.setPasswordOnce(pw)
      } else {
        const ok = await auth.unlock(pw)
        if (!ok) setErr("Неверный пароль")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container>
      <Topbar
        title="Вход"
        subtitle={online ? "Онлайн режим." : "Офлайн. Пароль восстановить нельзя."}
        right={!online ? <Pill tone="red">OFFLINE</Pill> : null}
      />

      <div className="mt-4 space-y-3">
        <Card
          title={auth.hasPass ? "Введи пароль" : "Задай пароль (один раз)"}
          desc="Данные хранятся на устройстве. Перенос между айфоном и ПК — экспорт/импорт файла (в бэкапе)."
        >
          <div className="space-y-2">
            <Input
              type="password"
              value={pw}
              onChange={(e:any)=>setPw(e.target.value)}
              placeholder="Пароль"
            />

            {!auth.hasPass && (
              <Input
                type="password"
                value={pw2}
                onChange={(e:any)=>setPw2(e.target.value)}
                placeholder="Повтори пароль"
              />
            )}

            {err && <div className="text-sm text-red">{err}</div>}

            <Btn className="w-full" onClick={go} disabled={busy}>
              {auth.hasPass ? "Войти" : "Создать пароль"}
            </Btn>
          </div>
        </Card>
      </div>
    </Container>
  )
}