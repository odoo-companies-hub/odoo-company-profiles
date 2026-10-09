(function () {
  const FLAGS = {
    India: "🇮🇳", "United States": "🇺🇸", "United Kingdom": "🇬🇧", Germany: "🇩🇪",
    "United Arab Emirates": "🇦🇪", Canada: "🇨🇦", Netherlands: "🇳🇱", Australia: "🇦🇺",
    France: "🇫🇷", Belgium: "🇧🇪", Brazil: "🇧🇷", Spain: "🇪🇸", Italy: "🇮🇹",
    Mexico: "🇲🇽", "Saudi Arabia": "🇸🇦", Egypt: "🇪🇬"
  };
  const PAGE_SIZE = 24;
  let page = 1;

  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const meta = document.getElementById("results-meta");
  const pager = document.getElementById("pager");
  const searchInput = document.getElementById("search");
  const countrySelect = document.getElementById("country-filter");
  const tierSelect = document.getElementById("tier-filter");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const modalBody = document.getElementById("modal-body");

  const countries = [...new Set(PARTNERS.map(p => p.country))].sort();

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function telHref(phone) {
    return "tel:" + phone.replace(/[^+\d]/g, "");
  }

  function aboutBlurb(c) {
    const tierText = {
      Gold: "a Gold-certified",
      Silver: "a Silver-certified",
      Ready: "an Odoo Ready"
    }[c.tier] || "an official";
    return `${esc(c.name)} is ${tierText} Odoo implementation partner based in ${esc(c.country)}, listed in Odoo's own public partner directory.`;
  }

  function officialUrl(c) {
    return c.path ? "https://www.odoo.com" + c.path : (c.website || "#");
  }

  function popupGeometry(width, height) {
    const w = Math.min(width, screen.availWidth - 40);
    const h = Math.min(height, screen.availHeight - 40);
    const left = Math.round((screen.availWidth - w) / 2 + (screen.availLeft || 0));
    const top = Math.round((screen.availHeight - h) / 2 + (screen.availTop || 0));
    return { w, h, left, top };
  }

  function applyUrl(c) {
    return c.careersUrl || c.website;
  }

  let currentApplyPopup = null;
  let popupWatchTimer = null;

  function setPageBlurred(blurred) {
    document.body.classList.toggle("popup-open", blurred);
  }

  function watchApplyPopup() {
    clearInterval(popupWatchTimer);
    popupWatchTimer = setInterval(() => {
      if (!currentApplyPopup || currentApplyPopup.closed) {
        clearInterval(popupWatchTimer);
        setPageBlurred(false);
      }
    }, 400);
  }

  function openApplyPopup(c) {
    const url = applyUrl(c);
    if (!url) return;

    // Close any popup we previously opened — reusing the same window name would
    // otherwise make the browser just navigate the old window, keeping its old
    // (often wrong) size and position instead of applying a fresh centered one.
    if (currentApplyPopup && !currentApplyPopup.closed) {
      try { currentApplyPopup.close(); } catch (e) { /* ignore */ }
    }

    const { w, h, left, top } = popupGeometry(480, 720);
    // Deliberately NOT passing "noopener"/"noreferrer" here: per spec, window.open()
    // always returns null when either is set, which would also kill our ability to
    // track the popup for the blur effect below. We sever window.opener manually
    // right after instead, which achieves the same security benefit.
    const features = `width=${w},height=${h},left=${left},top=${top},` +
      "menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes";
    const uniqueName = "applyPopup_" + Date.now();

    currentApplyPopup = window.open(url, uniqueName, features);
    if (currentApplyPopup) {
      try { currentApplyPopup.opener = null; } catch (e) { /* cross-origin — safe to ignore */ }
      // Some browsers only honor size/position from the features string on the
      // very first paint; re-assert them explicitly as a fallback.
      try {
        currentApplyPopup.resizeTo(w, h);
        currentApplyPopup.moveTo(left, top);
      } catch (e) { /* cross-origin or browser restriction — safe to ignore */ }
      setPageBlurred(true);
      watchApplyPopup();
    }
  }

  function filtered() {
    const q = searchInput.value.trim().toLowerCase();
    const country = countrySelect.value;
    const tier = tierSelect.value;
    return PARTNERS.filter(c =>
      (!country || c.country === country) &&
      (!tier || c.tier === tier) &&
      (!q || c.name.toLowerCase().includes(q))
    );
  }

  function cardHtml(c, idx) {
    return `
      <div class="card">
        <span class="badge ${c.tier}">${esc(c.tier)} Tier</span>
        <h3>${esc(c.name)}</h3>
        <div class="country">${FLAGS[c.country] || ""} ${esc(c.country)}</div>
        <p class="about">${aboutBlurb(c)}</p>
        ${c.address ? `<div class="addr">📍 ${esc(c.address)}</div>` : ""}
        <div class="contact-row">
          ${c.phone ? `<a href="${telHref(c.phone)}">📞 ${esc(c.phone)}</a>` : ""}
          ${c.email ? `<a href="mailto:${esc(c.email)}">✉️ ${esc(c.email)}</a>` : ""}
        </div>
        ${c.phone || c.email ? "" : `<p class="no-contact">No direct contact published for this company.</p>`}
        <div class="card-actions">
          ${applyUrl(c) ? `<button type="button" class="apply-btn" data-idx="${idx}">${applyBtnLabel(c)}</button>` : ""}
          <button type="button" class="view-btn" data-idx="${idx}">View full profile →</button>
        </div>
      </div>
    `;
  }

  function applyBtnLabel(c) {
    return c.careersUrl ? "Apply — Careers page ↗" : "Apply on company site ↗";
  }

  function render() {
    const results = filtered();
    const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    if (page > totalPages) page = totalPages;
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = results.slice(start, start + PAGE_SIZE);

    grid.innerHTML = pageItems.map(c => cardHtml(c, PARTNERS.indexOf(c))).join("");
    empty.hidden = results.length !== 0;
    meta.textContent = `Showing ${results.length} of ${PARTNERS.length} companies` +
      (totalPages > 1 ? ` — page ${page} of ${totalPages}` : "");

    pager.innerHTML = totalPages > 1 ? `
      <button type="button" id="prev-page" ${page === 1 ? "disabled" : ""}>← Previous</button>
      <button type="button" id="next-page" ${page === totalPages ? "disabled" : ""}>Next →</button>
    ` : "";

    grid.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", () => openProfile(PARTNERS[+btn.dataset.idx]));
    });
    grid.querySelectorAll(".apply-btn").forEach(btn => {
      btn.addEventListener("click", () => openApplyPopup(PARTNERS[+btn.dataset.idx]));
    });
    const prev = document.getElementById("prev-page");
    const next = document.getElementById("next-page");
    if (prev) prev.addEventListener("click", () => { page--; render(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    if (next) next.addEventListener("click", () => { page++; render(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  function openProfile(c) {
    modalBody.innerHTML = `
      <button type="button" class="close-btn" id="modal-close">&times;</button>
      <span class="badge ${c.tier}">${esc(c.tier)} Tier</span>
      <h2>${esc(c.name)}</h2>
      <p>${aboutBlurb(c)}</p>
      <dl>
        <dt>Country</dt><dd>${FLAGS[c.country] || ""} ${esc(c.country)}</dd>
        <dt>Address</dt><dd>${c.address ? esc(c.address) : "Not published"}</dd>
        <dt>Phone</dt><dd>${c.phone ? `<a href="${telHref(c.phone)}">${esc(c.phone)}</a>` : "Not published"}</dd>
        <dt>Email</dt><dd>${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : "Not published"}</dd>
        <dt>Website</dt><dd>${c.website ? `<a href="${esc(c.website)}" target="_blank" rel="noopener">${esc(c.website)}</a>` : "Not published"}</dd>
        <dt>Official profile</dt><dd><a href="${esc(officialUrl(c))}" target="_blank" rel="noopener">View on odoo.com →</a></dd>
      </dl>
      ${applyUrl(c) ? `<button type="button" class="apply-btn modal-apply-btn" id="modal-apply">${applyBtnLabel(c)}</button>` : ""}
    `;
    modalBackdrop.hidden = false;
    document.getElementById("modal-close").addEventListener("click", closeProfile);
    const modalApplyBtn = document.getElementById("modal-apply");
    if (modalApplyBtn) modalApplyBtn.addEventListener("click", () => openApplyPopup(c));
  }

  function closeProfile() {
    modalBackdrop.hidden = true;
  }

  modalBackdrop.addEventListener("click", e => {
    if (e.target === modalBackdrop) closeProfile();
  });

  countries.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = `${FLAGS[c] || ""} ${c}`.trim();
    countrySelect.appendChild(opt);
  });

  searchInput.addEventListener("input", () => { page = 1; render(); });
  countrySelect.addEventListener("change", () => { page = 1; render(); });
  tierSelect.addEventListener("change", () => { page = 1; render(); });

  const heroStats = document.getElementById("hero-stats");
  if (heroStats) {
    const gold = PARTNERS.filter(c => c.tier === "Gold").length;
    heroStats.innerHTML = `
      <div class="stat"><b>${PARTNERS.length}</b><span>Companies listed</span></div>
      <div class="stat"><b>${countries.length}</b><span>Countries</span></div>
      <div class="stat"><b>${gold}</b><span>Gold-tier companies</span></div>
    `;
  }

  render();
})();
