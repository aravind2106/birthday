async function submitRsvp(form) {
  const status = document.querySelector("#form-status");
  const button = form.querySelector("button");
  const formData = new FormData(form);
  const payload = {
    guestName: formData.get("guestName")?.toString().trim(),
    contact: formData.get("contact")?.toString().trim(),
    adultCount: Number(formData.get("adultCount")),
    childCount: Number(formData.get("childCount")),
    childNames: formData.get("childNames")?.toString().trim() || "",
    notes: formData.get("notes")?.toString().trim() || "",
    attending: formData.get("attending") === "on"
  };

  button.disabled = true;
  status.textContent = "Sending your RSVP...";

  try {
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to save RSVP right now.");
    }

    form.reset();
    form.querySelector('[name="adultCount"]').value = "1";
    form.querySelector('[name="childCount"]').value = "1";
    form.querySelector('[name="attending"]').checked = true;
    status.textContent = "Thanks. Your RSVP is in.";
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[character];
  });
}

function renderSummary(records) {
  const totals = records.reduce(
    (summary, record) => {
      if (record.attending) {
        summary.families += 1;
        summary.adults += record.adult_count;
        summary.kids += record.child_count;
      }
      return summary;
    },
    { families: 0, adults: 0, kids: 0 }
  );

  return `
    <article class="summary-tile">
      <span class="label">Attending families</span>
      <strong>${totals.families}</strong>
    </article>
    <article class="summary-tile">
      <span class="label">Adults</span>
      <strong>${totals.adults}</strong>
    </article>
    <article class="summary-tile">
      <span class="label">Kids</span>
      <strong>${totals.kids}</strong>
    </article>
  `;
}

function renderResults(records) {
  return records
    .map((record) => {
      const createdAt = new Date(record.created_at).toLocaleString();
      return `
        <article class="result-card">
          <p><strong>${escapeHtml(record.guest_name)}</strong> (${record.attending ? "Attending" : "Not attending"})</p>
          <p>${escapeHtml(record.contact)}</p>
          <p>Adults: ${record.adult_count} | Kids: ${record.child_count}</p>
          <p>Child names: ${escapeHtml(record.child_names || "None listed")}</p>
          <p>Notes: ${escapeHtml(record.notes || "No notes")}</p>
          <p>Submitted: ${createdAt}</p>
        </article>
      `;
    })
    .join("");
}

async function loadAdmin(form) {
  const status = document.querySelector("#admin-status");
  const summary = document.querySelector("#summary");
  const results = document.querySelector("#results");
  const password = new FormData(form).get("password")?.toString() || "";

  status.textContent = "Loading RSVPs...";

  try {
    const response = await fetch("/api/admin", {
      headers: {
        Authorization: `Bearer ${password}`
      }
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to load RSVPs.");
    }

    summary.innerHTML = renderSummary(result.records);
    results.innerHTML = renderResults(result.records);
    summary.classList.remove("hidden");
    results.classList.remove("hidden");
    status.textContent = `${result.records.length} RSVP entries loaded.`;
  } catch (error) {
    summary.classList.add("hidden");
    results.classList.add("hidden");
    status.textContent = error.message;
  }
}

const rsvpForm = document.querySelector("#rsvp-form");
if (rsvpForm) {
  rsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitRsvp(rsvpForm);
  });
}

const adminForm = document.querySelector("#admin-form");
if (adminForm) {
  adminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadAdmin(adminForm);
  });
}
