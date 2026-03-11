# 📄 PDF to Image Generator

Convertí cualquier documento PDF en imágenes PNG, página por página, con la opción de agregarle un logo como marca de agua o en una esquina. Todo corre en el navegador — ningún archivo se sube a ningún servidor.

---

## ✨ Funcionalidades

- **Carga de PDF** — Seleccioná cualquier archivo `.pdf` desde tu dispositivo
- **Renderizado real** — Cada página se renderiza visualmente con toda su fidelidad usando PDF.js
- **Selección de páginas** — Elegí cuáles páginas convertir; por defecto selecciona todas
- **Logo opcional** — Subí tu logo en cualquier formato de imagen y posicionalo donde quieras
- **5 posiciones de logo** — Superior izquierda, superior derecha, inferior izquierda, inferior derecha o centro como marca de agua
- **Opacidad ajustable** — Cuando el logo va al centro, controlás su transparencia (10% – 100%)
- **Preview instantáneo** — Las imágenes generadas aparecen en pantalla al momento
- **Descarga individual** — Hover sobre cualquier imagen para descargarla como PNG
- **Descarga en ZIP** — Todas las imágenes en un solo archivo `.zip` con un click

---

## 🖥️ Cómo usarla

Subí tu PDF             →  Click en el área de upload o arrastrá el archivo
Subí tu logo (opcional) →  PNG, JPG o cualquier formato de imagen
Elegí la posición       →  Grilla de 5 posiciones + opacidad si va al centro
Seleccioná las páginas  →  Todas activas por defecto, deseleccioná las que no querés
Generá las imágenes     →  Click en "Generate Images"
Descargá                →  Individualmente (hover) o todo en ZIP


---

## 🛠️ Stack tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| React | 19.x | UI framework |
| TypeScript | 5.8 | Tipado estático |
| Vite | 6.x | Build tool y dev server |
| Tailwind CSS | 4.x | Estilos |
| PDF.js (`pdfjs-dist`) | 5.x | Renderizado real de páginas PDF en canvas |
| JSZip | 3.10 | Generación del archivo ZIP de descarga |
| Lucide React | 0.546 | Iconografía |

> El procesamiento ocurre íntegramente en el navegador usando PDF.js + Web Canvas API. Ningún archivo sale de tu dispositivo.

---

## 🚀 Instalación local

### Prerequisitos

- Node.js `>= 18`
- npm

### Pasos
```bash
# 1. Clonar el repositorio
git clone https://github.com/leosenderovsky/Pdf-to-Image-Generator.git
cd Pdf-to-Image-Generator

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editá .env con tu GEMINI_API_KEY si usás funciones de IA adicionales

# 4. Iniciar en modo desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`.

### Scripts disponibles
```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción → carpeta /dist
npm run preview  # Preview del build generado
npm run lint     # Chequeo de tipos TypeScript
npm run clean    # Limpia la carpeta /dist
```

---

## ⚙️ Variables de entorno
```env
# Requerida para integraciones con Gemini AI (opcional según uso)
GEMINI_API_KEY="tu_api_key_aqui"

# URL base de la app (AI Studio lo inyecta automáticamente)
APP_URL="http://localhost:3000"
```

> Si usás **Google AI Studio / Firebase Studio**, las variables se inyectan automáticamente desde el panel de Secrets.

---

## 📁 Estructura del proyecto
Pdf-to-Image-Generator/
├── src/
│   ├── App.tsx       # Componente principal — toda la lógica y UI
│   ├── main.tsx      # Entry point de React
│   └── index.css     # Estilos globales (Tailwind)
├── index.html        # HTML base
├── vite.config.ts    # Configuración de Vite
├── tsconfig.json     # Configuración TypeScript
├── .env.example      # Template de variables de entorno
└── metadata.json     # Metadata del proyecto (Google AI Studio)

---

## ☁️ Despliegue
```bash
npm run build
# Carpeta /dist lista para subir a cualquier plataforma estática
```

| Plataforma | Método |
|---|---|
| **Vercel** | `vercel deploy` |
| **Netlify** | Drag & drop de la carpeta `/dist` |
| **Firebase Hosting** | `firebase deploy` |
| **GitHub Pages** | Contenido de `/dist` en rama `gh-pages` |

---

## 📄 Licencia

MIT — Libre para usar, modificar y distribuir con atribución.

---

## 🔗 Cargar PDFs remotos (Google Drive / CORS)

Si querés cargar PDFs desde una URL (por ejemplo un enlace público de Google Drive) podés encontrarte con errores 403 o con bloqueos por CORS. Causas comunes:

- Los enlaces de Google Drive tipo "share" no siempre son enlaces de descarga directa y, en algunos casos, requieren cookies o una confirmación intermedia.
- Muchos hosts no devuelven `Access-Control-Allow-Origin`, por lo que el navegador bloquea la petición.

Opciones para resolverlo:

- Frontend sólo: la app normaliza links comunes de Google Drive a la forma `https://drive.google.com/uc?export=download&id=FILEID` y intenta `fetch` directo. Funciona si el archivo es público y el host devuelve CORS permisivo.
- Proxy (más fiable): desplegar un proxy serverless (Cloudflare Worker, Netlify Function, Vercel Serverless) que haga el fetch desde el servidor y reenvíe la respuesta con `Access-Control-Allow-Origin: *`.

Ejemplo incluido: `cloudflare-worker-proxy.js` — un Worker mínimo que acepta `?url=` y retorna el recurso con cabeceras CORS. Desplegalo y pegá la URL del worker en el campo "Optional proxy" de la UI si un fetch directo falla.

Si necesitás ayuda desplegando el Worker o creando una Function en Netlify/Vercel, avisame y te doy los pasos precisos.

Serverless examples (Netlify / Vercel)

Si preferís funciones serverless integradas en el mismo repo, hay dos ejemplos incluidos:

- `netlify/functions/pdf-proxy.js` — función para Netlify. Endpoint de ejemplo cuando está desplegada: `https://your-site.netlify.app/.netlify/functions/pdf-proxy?url=...`
- `api/pdf-proxy.js` — función para Vercel. Endpoint de ejemplo cuando está desplegada: `https://your-site.vercel.app/api/pdf-proxy?url=...`

Ambas funciones hacen fetch server-side al recurso remoto y devuelven los bytes con `Access-Control-Allow-Origin: *`. Pegar la URL base en el campo "Optional proxy" de la app hará que la app envíe `?url=` al proxy.

Notas:
- Netlify devuelve la respuesta en base64 y marca `isBase64Encoded` como `true` (Netlify Functions). Vercel responde con el buffer binario directamente.
- Para ficheros muy grandes revisá los límites del proveedor (Netlify/Vercel/Cloudflare). Si necesitás soporte para confirmaciones de descarga de Google Drive (páginas intermedias) se requiere lógica adicional server-side.

<div align="center">
  <p>Hecho con IA y criterio humano · <a href="https://github.com/leosenderovsky">@leosenderovsky</a></p>
</div>
