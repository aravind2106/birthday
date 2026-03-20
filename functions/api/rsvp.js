function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    return json({ error: "Database binding is missing." }, 500);
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload." }, 400);
  }

  const guestName = payload.guestName?.trim();
  const contact = payload.contact?.trim();
  const adultCount = Number.isFinite(payload.adultCount) ? payload.adultCount : Number(payload.adultCount);
  const childCount = Number.isFinite(payload.childCount) ? payload.childCount : Number(payload.childCount);
  const childNames = payload.childNames?.trim() || "";
  const notes = payload.notes?.trim() || "";
  const attending = Boolean(payload.attending);

  if (!guestName || !contact) {
    return json({ error: "Name and contact are required." }, 400);
  }

  if (!Number.isFinite(adultCount) || !Number.isFinite(childCount)) {
    return json({ error: "Guest counts must be valid numbers." }, 400);
  }

  if (adultCount < 0 || childCount < 0) {
    return json({ error: "Guest counts must be zero or more." }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO rsvps (
      guest_name,
      contact,
      adult_count,
      child_count,
      child_names,
      notes,
      attending
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      guestName,
      contact,
      adultCount,
      childCount,
      childNames,
      notes,
      attending ? 1 : 0
    )
    .run();

  return json({ ok: true });
}
