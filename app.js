(function () {
  const CFG = window.LW_CONFIG || {};
  const API = (CFG.API_URL || "").replace(/\/+$/, "");
  const app = document.getElementById("app");
  document.getElementById("year").textContent = new Date().getFullYear();

  // ---------- data ----------
  let fallbackPromise;
  const fallback = () =>
    (fallbackPromise ||= fetch("content.fallback.json", { cache: "no-cache" }).then((r) => r.json()));

  async function api(path) {
    if (!API) throw new Error("no api");
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), CFG.API_TIMEOUT_MS || 4000);
    try {
      const r = await fetch(API + path, { signal: ctrl.signal });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } finally {
      clearTimeout(t);
    }
  }

  let sitePromise;
  const getSite = () =>
    (sitePromise ||= api("/api/site").catch(async () => {
      const fb = await fallback();
      return { ...fb, posts: fb.posts.map(({ body, ...m }) => m) };
    }));

  async function getPost(slug) {
    try {
      return await api("/api/posts/" + encodeURIComponent(slug));
    } catch {
      const fb = await fallback();
      return fb.posts.find((p) => p.slug === slug) || null;
    }
  }

  function trackClick(id) {
    if (!API) return;
    const body = JSON.stringify({ id });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(API + "/api/click", new Blob([body], { type: "text/plain" }));
      else fetch(API + "/api/click", { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } });
    } catch {}
  }

  // ---------- helpers ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d + "T12:00:00");
    return isNaN(dt) ? esc(d) : dt.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  };

  const ICONS = {
    canva: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.8 1.6-1.6 0-.5-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5C21 6.6 17 3 12 3Z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7.5" r="1.2"/><circle cx="14.5" cy="7.5" r="1.2"/>',
    tiktok: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".8"/>',
    pinterest: '<path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11Z"/><circle cx="12" cy="10" r="2.2"/>',
    watch: '<rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6l.6-3h4.8l.6 3M9 18l.6 3h4.8l.6-3M12 9.5V12l1.8 1.2"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7L19 15Z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    arrow: '<path d="M7 17L17 7M8 7h9v9"/>',
  };
  const icon = (name, cls = "ic") =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.link}</svg>`;

  const backBtn = () => `<a class="back" href="#/">${icon("back")}<span>inicio</span></a>`;

  function header(site, compact) {
    const p = site.profile || {};
    const initial = (p.name || "S").trim()[0];
    const avatar = p.avatar
      ? `<img class="avatar" src="${esc(p.avatar)}" alt="${esc(p.name)}" />`
      : `<div class="avatar avatar--mono" aria-hidden="true">${esc(initial.toLowerCase())}</div>`;
    if (compact) return "";
    return `
      <header class="hero">
        ${avatar}
        <h1>${esc(p.name)}</h1>
        <p class="handle">${esc(p.handle)}</p>
        <p class="tagline">${esc(p.tagline)}</p>
        ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ""}
      </header>`;
  }

  function linkHref(l) {
    if (l.post) return `#/post/${encodeURIComponent(l.post)}`;
    if (l.section) return `#/${l.section}`;
    return l.url || "";
  }

  // ---------- views ----------
  function viewHome(site) {
    const links = (site.links || [])
      .map((l, i) => {
        const href = linkHref(l);
        const soon = l.status === "soon" || !href;
        const ext = /^https?:/.test(href);
        const cls = `card${l.highlight ? " card--hl" : ""}${soon ? " card--soon" : ""}`;
        const inner = `
          <span class="card__ic">${icon(l.icon)}</span>
          <span class="card__txt">
            <span class="card__title">${esc(l.title)}</span>
            ${l.subtitle ? `<span class="card__sub">${esc(l.subtitle)}</span>` : ""}
          </span>
          ${soon ? '<span class="pill">pronto</span>' : ext ? icon("arrow", "ic ic--end") : ""}`;
        const style = `style="--d:${i * 40}ms"`;
        return soon
          ? `<div class="${cls}" ${style} aria-disabled="true">${inner}</div>`
          : `<a class="${cls}" ${style} href="${esc(href)}" data-id="${esc(l.id)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${inner}</a>`;
      })
      .join("");

    const latest = (site.posts || []).slice(0, 3);
    const posts = latest.length
      ? `<section class="sec">
          <div class="sec__head"><h2>Lo último</h2><a href="#/blog">ver todo</a></div>
          ${latest.map(postCard).join("")}
        </section>`
      : "";

    return `${header(site)}<nav class="links">${links}</nav>${posts}`;
  }

  function postCard(p) {
    return `<a class="post" href="#/post/${encodeURIComponent(p.slug)}">
      <span class="post__meta">${fmtDate(p.date)}${(p.tags || []).length ? " · " + p.tags.map(esc).join(", ") : ""}</span>
      <span class="post__title">${esc(p.title)}</span>
      ${p.excerpt ? `<span class="post__ex">${esc(p.excerpt)}</span>` : ""}
    </a>`;
  }

  function viewBlog(site) {
    const posts = site.posts || [];
    return `${backBtn()}
      <header class="page-head"><p class="eyebrow">tips & blog</p><h1>Running, food y balance</h1></header>
      ${posts.length ? posts.map(postCard).join("") : '<p class="empty">Muy pronto ✨</p>'}`;
  }

  function viewFavorites(site) {
    const favs = site.favorites || [];
    const groups = {};
    favs.forEach((f) => (groups[f.category || "Otros"] ||= []).push(f));
    const body = favs.length
      ? Object.entries(groups)
          .map(
            ([cat, items]) => `<section class="sec"><h2 class="cat">${esc(cat)}</h2>
              ${items
                .map((f) => {
                  const inner = `<span class="card__txt"><span class="card__title">${esc(f.name)}</span>${f.note ? `<span class="card__sub">${esc(f.note)}</span>` : ""}</span>${f.url ? icon("arrow", "ic ic--end") : ""}`;
                  return f.url
                    ? `<a class="card" href="${esc(f.url)}" target="_blank" rel="noopener">${inner}</a>`
                    : `<div class="card">${inner}</div>`;
                })
                .join("")}</section>`
          )
          .join("")
      : '<p class="empty">Estoy armando esta lista — muy pronto ✨</p>';
    return `${backBtn()}
      <header class="page-head"><p class="eyebrow">mis favoritos</p><h1>Lo que uso y me encanta</h1></header>${body}`;
  }

  function viewCollab(site) {
    const c = site.collab || {};
    const types = (c.types || []).map((t) => `<option>${esc(t)}</option>`).join("");
    const form = API
      ? `<form class="form" id="collab-form" novalidate>
          <label>Tu nombre<input name="name" required maxlength="120" autocomplete="name" /></label>
          <label>Email<input name="email" type="email" required maxlength="160" autocomplete="email" /></label>
          <label>Marca o proyecto <span class="opt">(opcional)</span><input name="brand" maxlength="160" /></label>
          ${types ? `<label>Tipo de colaboración<select name="type">${types}</select></label>` : ""}
          <label>Cuéntame tu idea<textarea name="message" required minlength="10" maxlength="2000" rows="5"></textarea></label>
          <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <button type="submit" class="btn">Enviar</button>
          <p class="form__msg" role="status"></p>
        </form>`
      : `<p class="empty">El formulario estará disponible muy pronto. Mientras, escríbeme por DM en Instagram o TikTok ✨</p>`;
    return `${backBtn()}
      <header class="page-head"><p class="eyebrow">colaboremos</p><h1>Trabajemos juntas</h1>
      ${c.intro ? `<p class="lead">${esc(c.intro)}</p>` : ""}</header>${form}`;
  }

  async function viewPost(slug) {
    const p = await getPost(slug);
    if (!p) return `${backBtn()}<p class="empty">No encontré ese post.</p>`;
    return `${backBtn()}
      <article class="article">
        <p class="eyebrow">${fmtDate(p.date)}${(p.tags || []).length ? " · " + p.tags.map(esc).join(", ") : ""}</p>
        <h1>${esc(p.title)}</h1>
        <div class="prose">${window.renderMarkdown(p.body || "")}</div>
      </article>`;
  }

  function bindCollab() {
    const f = document.getElementById("collab-form");
    if (!f) return;
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = f.querySelector(".form__msg");
      const btn = f.querySelector("button");
      if (!f.checkValidity()) {
        msg.textContent = "Revisa tu nombre, email y mensaje (mínimo 10 caracteres).";
        msg.className = "form__msg is-err";
        return;
      }
      btn.disabled = true;
      msg.textContent = "Enviando…";
      msg.className = "form__msg";
      try {
        const r = await fetch(API + "/api/collab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(f))),
        });
        if (!r.ok) throw new Error(r.status);
        f.reset();
        msg.textContent = "¡Gracias! Te respondo pronto ✨";
        msg.className = "form__msg is-ok";
      } catch {
        msg.textContent = "No se pudo enviar. Intenta de nuevo o escríbeme por DM.";
        msg.className = "form__msg is-err";
      } finally {
        btn.disabled = false;
      }
    });
  }

  // ---------- router ----------
  async function route() {
    const hash = location.hash.replace(/^#\/?/, "");
    const [view, arg] = hash.split("/");
    const site = await getSite();
    let html;
    if (view === "post" && arg) html = await viewPost(decodeURIComponent(arg));
    else if (view === "blog") html = viewBlog(site);
    else if (view === "favorites") html = viewFavorites(site);
    else if (view === "collab") html = viewCollab(site);
    else html = viewHome(site);
    app.innerHTML = html;
    app.dataset.view = view || "home";
    bindCollab();
    if (view) window.scrollTo(0, 0);
    const title = app.querySelector("h1");
    document.title = view && title ? `${title.textContent} · livingwith_sofiaa` : "Sofia · livingwith_sofiaa";
  }

  app.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-id]");
    if (a) trackClick(a.dataset.id);
  });
  window.addEventListener("hashchange", route);
  route().catch((err) => {
    console.error(err);
    app.innerHTML = '<p class="empty">Algo falló al cargar. Recarga la página.</p>';
  });
})();
