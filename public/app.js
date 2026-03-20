async function submitRsvp(form) {
  const status = document.querySelector("#form-status");
  const button = form.querySelector("button");
  const formData = new FormData(form);
  const email = formData.get("email")?.toString().trim() || "";
  const payload = {
    guestName: formData.get("guestName")?.toString().trim(),
    contact: email,
    adultCount: Number(formData.get("adultCount")),
    childCount: Number(formData.get("childCount")),
    childNames: formData.get("childNames")?.toString().trim() || "",
    notes: formData.get("notes")?.toString().trim() || "",
    attending: formData.get("attending") === "on"
  };

  if (!isValidEmail(email)) {
    status.textContent = "Please enter a valid email address.";
    form.querySelector('[name="email"]').focus();
    return;
  }

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
    status.textContent = "Brilliant. Your art crew is on the guest list.";
    burstConfetti(window.innerWidth / 2, Math.min(window.innerHeight * 0.4, 320), 36);
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function updateCountdown() {
  const headline = document.querySelector("#countdown-headline");
  const dayNode = document.querySelector('[data-unit="days"]');
  const hourNode = document.querySelector('[data-unit="hours"]');
  const minuteNode = document.querySelector('[data-unit="minutes"]');
  const secondNode = document.querySelector('[data-unit="seconds"]');

  if (!headline || !dayNode || !hourNode || !minuteNode || !secondNode) {
    return;
  }

  const target = new Date("2026-04-12T15:00:00-05:00");
  const now = new Date();
  const difference = target.getTime() - now.getTime();

  if (difference <= 0) {
    headline.textContent = "The party is happening right now.";
    dayNode.textContent = "0";
    hourNode.textContent = "0";
    minuteNode.textContent = "0";
    secondNode.textContent = "0";
    return;
  }

  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  headline.textContent = `${days} days until Aarush's art party opens its studio doors.`;
  dayNode.textContent = String(days);
  hourNode.textContent = String(hours);
  minuteNode.textContent = String(minutes);
  secondNode.textContent = String(seconds);
}

function burstConfetti(x, y, count = 24) {
  const layer = document.querySelector("#confetti-burst-layer");

  if (!layer) {
    return;
  }

  const colors = ["#ec4d8f", "#ff8b2b", "#ffd34d", "#1aa8b8", "#3b70ff", "#7bcf52"];

  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement("span");
    const angle = (Math.PI * 2 * index) / count;
    const distance = 60 + Math.random() * 120;
    const driftX = Math.cos(angle) * distance;
    const driftY = Math.sin(angle) * distance + 40 + Math.random() * 60;
    const rotation = `${Math.round(Math.random() * 360)}deg`;

    piece.className = "burst-piece";
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.background = colors[index % colors.length];
    piece.style.setProperty("--x", `${driftX}px`);
    piece.style.setProperty("--y", `${driftY}px`);
    piece.style.setProperty("--r", rotation);
    piece.style.animationDelay = `${Math.random() * 0.08}s`;
    layer.appendChild(piece);

    window.setTimeout(() => piece.remove(), 1500);
  }
}

function launchPartyFriend() {
  const friend = document.querySelector("#party-friend");
  const popper = document.querySelector("#friend-popper");

  if (!friend || !popper) {
    return;
  }

  friend.classList.add("is-live");

  window.setTimeout(() => {
    const rect = popper.getBoundingClientRect();
    const burstX = rect.left + rect.width / 2;
    const burstY = rect.top + rect.height / 2;

    friend.classList.add("is-pop");
    burstConfetti(burstX, burstY, 34);

    window.setTimeout(() => {
      friend.classList.remove("is-pop");
    }, 650);
  }, 1100);
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
  const emailInput = rsvpForm.querySelector('[name="email"]');
  emailInput?.addEventListener("input", () => {
    if (!emailInput.value || isValidEmail(emailInput.value.trim())) {
      emailInput.setCustomValidity("");
      return;
    }

    emailInput.setCustomValidity("Please enter a valid email address.");
  });

  rsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitRsvp(rsvpForm);
  });
}

updateCountdown();
window.setInterval(updateCountdown, 1000);
window.addEventListener("load", launchPartyFriend, { once: true });

document.addEventListener("click", (event) => {
  const isInteractiveElement = event.target.closest("input, textarea, button, label, a");

  if (isInteractiveElement) {
    return;
  }

  burstConfetti(event.clientX, event.clientY, 28);
});

const adminForm = document.querySelector("#admin-form");
if (adminForm) {
  adminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadAdmin(adminForm);
  });
}
