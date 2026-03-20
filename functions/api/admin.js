function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const expectedPassword = env.ADMIN_PASSWORD;
  const providedPassword = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!env.DB) {
    return json({ error: "Database binding is missing." }, 500);
  }

  if (!expectedPassword) {
    return json({ error: "Admin password is not configured." }, 500);
  }

  if (!providedPassword || providedPassword !== expectedPassword) {
    return json({ error: "Unauthorized." }, 401);
  }

  const { results } = await env.DB.prepare(
    `SELECT
      id,
      guest_name,
      contact,
      adult_count,
      child_count,
      child_names,
      notes,
      attending,
      created_at
    FROM rsvps
    ORDER BY datetime(created_at) DESC`
  ).all();

  const records = (results || []).map((record) => ({
    ...record,
    attending: Boolean(record.attending)
  }));

  return json({ records });
}
