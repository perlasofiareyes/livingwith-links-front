# livingwith-links-front

Landing tipo link-in-bio de **@livingwith_sofiaa** — plantillas de Canva, TikTok, Instagram, Pinterest, la guía de Garmin + Claude, favoritos, blog de tips y formulario de colaboraciones.

HTML/CSS/JS puro, sin build. Se publica gratis en **GitHub Pages**.
Backend: [`livingwith-links-api`](https://github.com/perlasofiareyes/livingwith-links-api) (Railway).

## Cómo funciona

- Al cargar, la página pide todo a `API_URL/api/site` (configurado en `config.js`).
- Si el backend no responde en 4 s (o `API_URL` está vacío), usa `content.fallback.json`. **La página nunca se cae**, aunque Railway esté apagado.
- Rutas: `#/` inicio · `#/blog` · `#/post/<slug>` · `#/favorites` · `#/collab`.

## Configurar

1. Deploya el backend en Railway y copia su dominio.
2. Pégalo en `config.js` → `API_URL`.
3. Commit + push. GitHub Pages actualiza solo.

## Actualizar el contenido de respaldo

El contenido se edita en el repo del backend (`content/`). Después, desde esa carpeta:

```bash
npm run export-fallback   # escribe ../livingwith-links-front/content.fallback.json
```

y haz commit + push en este repo.

## Correr local

```bash
python3 -m http.server 5173   # http://localhost:5173
```

## Publicar en GitHub Pages

Repo → **Settings → Pages → Source: Deploy from a branch → `main` / root**.
URL: `https://perlasofiareyes.github.io/livingwith-links-front/`
