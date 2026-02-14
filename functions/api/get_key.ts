export const onRequestGet: PagesFunction = async ({ env }) => {
  const raw = await env.PLCOACH_KV.get("key");

  if (!raw) {
    return new Response(JSON.stringify({ ok: false }), {
      headers: { "content-type": "application/json" }
    });
  }

  let data: any = raw;

  try { data = JSON.parse(data); } catch {}
  if (typeof data === "string") {
    data = JSON.parse(data);
  }

  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" }
  });
};