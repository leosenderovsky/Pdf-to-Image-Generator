# 📄 PDF to Image Generator

Convertí cualquier documento PDF en imágenes PNG, página por página, con la opción de agregarle un logo como marca de agua o en una esquina. Todo corre en el navegador, sin servidor, sin subir archivos a ningún lado.

---

## ✨ Funcionalidades

- **Carga de PDF** — Seleccioná cualquier archivo `.pdf` desde tu dispositivo
- **Selección de páginas** — Elegí cuáles páginas convertir; por defecto selecciona todas
- **Logo opcional** — Subí tu logo en formato imagen y posicionalo donde quieras
- **5 posiciones de logo** — Esquina superior izquierda, superior derecha, inferior izquierda, inferior derecha o centro como marca de agua
- **Opacidad ajustable** — Cuando el logo está en el centro, podés controlar su transparencia (10% – 100%)
- **Preview en tiempo real** — Las imágenes generadas aparecen en pantalla al instante
- **Descarga individual** — Descargá cada imagen por separado (hover sobre la imagen)
- **Descarga en ZIP** — Descargá todas las imágenes en un solo archivo `.zip`

---

## 🖥️ Cómo usarla

```
1. Subí tu PDF             →  Click en el área de upload o arrastrá el archivo
2. Subí tu logo (opcional) →  PNG, JPG o cualquier formato de imagen
3. Elegí la posición       →  Grilla de 5 posiciones + opacidad si va al centro
4. Seleccioná las páginas  →  Todas activas por defecto, deseleccioná las que no querés
5. Generá las imágenes     →  Click en "Generate Images"
6. Descargá                →  Individualmente o todo en ZIP
```

---

## 🛠️ Stack tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| React | 19.x | UI framework |
| TypeScript | 5.8 | Tipado estático |
| Vite | 6.x | Build tool y dev server |
| Tailwind CSS | 4.x | Estilos |
| pdf-lib | — | Lectura y procesamiento de PDFs |
| JSZip | — | Generación del archivo ZIP de descarga |
| Lucide React | 0.546 | Iconografía |

> **Nota:** El procesamiento ocurre íntegramente en el navegador usando la Web Canvas API. Ningún archivo se sube a ningún servidor.

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

> Si usás **Google AI Studio**, las variables se inyectan desde el panel de Secrets. No necesitás configurar nada manualmente.

---

## 📁 Estructura del proyecto

```
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
```

---

## ☁️ Despliegue

El build genera archivos estáticos en `/dist`, compatibles con cualquier plataforma:

```bash
npm run build
```

| Plataforma | Comando / Método |
|---|---|
| **Vercel** | `vercel deploy` |
| **Netlify** | Drag & drop de la carpeta `/dist` |
| **Firebase Hosting** | `firebase deploy` |
| **GitHub Pages** | Subí el contenido de `/dist` a la rama `gh-pages` |

---

## 📄 Licencia

MIT — Libre para usar, modificar y distribuir con atribución.

---

<div align="center">
  <p>Hecho con IA y criterio humano · <a href="https://github.com/leosenderovsky">@leosenderovsky</a></p>
</div>