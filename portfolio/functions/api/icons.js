const KEY = "icon_overrides";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequestGet(context) {
  const kv = context.env.ICON_KV;
  if (!kv) return json({ error: "ICON_KV binding is missing" }, 500);

  const raw = await kv.get(KEY);
  if (!raw) return json({ overrides: {}, source: "kv" });

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return json({ overrides: {}, source: "kv-invalid" });
    }
    return json({ overrides: parsed, source: "kv" });
  } catch {
    return json({ overrides: {}, source: "kv-invalid-json" });
  }
}

export async function onRequestPut(context) {
  const kv = context.env.ICON_KV;
  if (!kv) return json({ error: "ICON_KV binding is missing" }, 500);

  const expectedToken = context.env.ICON_ADMIN_TOKEN;
  if (!expectedToken) return json({ error: "ICON_ADMIN_TOKEN is missing" }, 500);

  const provided = context.request.headers.get("x-icon-admin-token") || "";
  if (provided !== expectedToken) return json({ error: "Unauthorized" }, 401);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const overrides = body?.overrides;
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return json({ error: "Body must be { overrides: { ... } }" }, 400);
  }

  await kv.put(KEY, JSON.stringify(overrides));
  return json({ ok: true, count: Object.keys(overrides).length });
}

