export const onRequestPost = async (context: any) => {
  try {
    const body = await context.request.json()
    const key = "plcoach_sync_data"

    await context.env.PLCOACH_KV.put(key, JSON.stringify(body))

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export const onRequestGet = async (context: any) => {
  try {
    const key = "plcoach_sync_data"
    const data = await context.env.PLCOACH_KV.get(key)

    return new Response(data ?? "null", {
      headers: { "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response("null", { status: 500 })
  }
}