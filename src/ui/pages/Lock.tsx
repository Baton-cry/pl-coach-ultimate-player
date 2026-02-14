import React, { useEffect, useState } from "react";
import { Btn, Card, Container, Input, Pill, Topbar } from "../components";

export function Lock({ auth }: { auth: any }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Онлайн/оффлайн только по состоянию браузера, а не по ошибкам API
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);

    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);

    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, []);

  async function go() {
    setErr(null);

    if (pw.length < 6) {
      setErr("Пароль минимум 6 символов");
      return;
    }

    setBusy(true);
    try {
      // Первый запуск — создаём пароль один раз
      if (!auth.hasPass?.()) {
        if (pw !== pw2) {
          setErr("Пароли не совпали");
          return;
        }
        await auth.setPasswordOnce?.(pw);
        // если у тебя есть метод “войти/разблокировать” после установки — можно вызывать тут
        // await auth.unlock?.(pw)
      } else {
        // Обычная разблокировка
        const ok = await auth.unlock?.(pw);
        if (!ok) setErr("Неверный пароль");
      }
    } catch (e: any) {
      // НЕ включаем “OFFLINE” по ошибке /api — это чинится в логике sync,
      // здесь просто показываем текст ошибки
      setErr(e?.message || "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  const hasPass = !!auth.hasPass?.();

  return (
    <Container>
      <Topbar
        title={hasPass ? "Вход" : "Вход"}
        subtitle="Офлайн. Пароль восстановить нельзя."
        right={!online ? <Pill tone="red">OFFLINE</Pill> : null}
      />

      <div className="mt-4 space-y-3">
        <Card
          title={hasPass ? "Введи пароль" : "Задай пароль (один раз)"}
          desc="Данные хранятся на устройстве. Перенос между айфоном и ПК — экспорт/импорт файла (в бэкапе)."
        >
          <div className="space-y-2">
            <Input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Пароль"
            />

            {!hasPass && (
              <Input
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="Повтори пароль"
              />
            )}

            {err && <div className="text-sm text-red">{err}</div>}

            <Btn className="w-full" onClick={go} disabled={busy}>
              {hasPass ? "Войти" : "Создать пароль"}
            </Btn>
          </div>
        </Card>
      </div>
    </Container>
  );
}