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

<div align="center">
  <p>Hecho con IA y criterio humano · <a href="https://github.com/leosenderovsky">@leosenderovsky</a></p>
</div>
