import React, { createContext, useContext, useMemo, useState } from 'react';

export type Language = 'en' | 'es';

type TranslationMap = Record<string, string>;

type LanguageContextValue = {
  lang: Language;
  setLang: React.Dispatch<React.SetStateAction<Language>>;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const translations: Record<Language, TranslationMap> = {
  en: {
    appTitle: 'PDF to Image',
    appSubtitle: 'Convert your document to images & add watermark',
    appTagline: 'Online converter',
    byLabel: 'by',
    step1: '1. Upload Document',
    dropzone: 'Drag a PDF here or click to select',
    officeHint: 'For Word, PowerPoint or Office files, export them as PDF first.',
    urlLabel: 'Or load from public URL',
    loadBtn: 'Load',
    googleHint: "Google Docs must be publicly accessible ('Anyone with the link')",
    step2: '2. Page Selection',
    allDoc: 'Entire document',
    specificPages: 'Specific pages',
    pagesPlaceholder: 'E.g.: 1,3,5-8,12',
    pagesSelected: '{n} pages selected',
    step3: '3. Output Resolution',
    custom: 'Custom',
    socialMedia: 'Social Media',
    width: 'Width (px)',
    height: 'Height (px)',
    swap: 'Swap Horizontal / Vertical',
    step4: '4. Logo / Watermark',
    activateLogo: 'Enable Logo',
    uploadLogo: 'Upload Logo (transparent PNG)',
    corner: 'Corner',
    center: 'Center',
    position: 'Position',
    sizePercent: 'Size (% width)',
    margin: 'Margin (px)',
    dropShadow: 'Drop Shadow',
    opacity: 'Opacity (%)',
    step5: '5. Export',
    jpgQuality: 'JPG Quality (%)',
    downloadJpg: 'Download JPG',
    downloadPng: 'Download PNG',
    packageFormat: 'Package format',
    downloadPackage: 'Download Package',
    refreshPreview: 'Refresh Preview',
    footer: '© 2026 · sender.ia · Leo Aquiba Senderovsky',
    processing: 'Processing...',
    generateImages: 'Generate Images',
    generatedImages: 'Generated Images',
    showingImage: 'Showing {n} image',
    showingImages: 'Showing {n} images',
    emptyState: 'Your generated images will appear here.',
    generatedPageAlt: 'Generated Page {n}',
    clickToUpload: 'Click to upload logo',
    remove: 'Remove',
    logoPositionTitle: 'Logo Position',
    logoOpacityLabel: 'Logo Opacity: {n}%',
    pages: '{n} pages',
    selectPages: '2. Select Pages',
    selectPagesCount: '{selected}/{total}',
    urlPlaceholder: 'https://example.com/file.pdf or Google Drive link',
    proxyLabel: "Custom proxy (optional): use '{url}' or ?url=, or leave blank to use built-in proxy.",
    proxyPlaceholder: 'https://your-proxy.example?url={url}',
    pdfOnlyAlert: 'Please select a PDF file.',
    urlRequiredAlert: 'Please enter a URL',
    imageOnlyAlert: 'Please select an image file.',
    loadError: 'Unable to load the PDF. Make sure the file is public and the URL is direct.'
  },
  es: {
    appTitle: 'PDF a Imagen',
    appSubtitle: 'Convierte tu documento a imágenes con tu marca de agua',
    appTagline: 'Convertidor online',
    byLabel: 'por',
    step1: '1. Cargar Documento',
    dropzone: 'Arrastra un PDF aquí o haz clic para seleccionar',
    officeHint: 'Para archivos Word, PowerPoint u Office, expórtalos primero como PDF.',
    urlLabel: 'O cargar desde URL pública',
    loadBtn: 'Cargar',
    googleHint: 'Los documentos de Google Docs deben ser de acceso público.',
    step2: '2. Selección de Páginas',
    allDoc: 'Todo el documento',
    specificPages: 'Páginas específicas',
    pagesPlaceholder: 'Ej: 1,3,5-8,12',
    pagesSelected: '{n} páginas seleccionadas',
    step3: '3. Resolución de Salida',
    custom: 'Personalizada',
    socialMedia: 'Redes Sociales',
    width: 'Ancho (px)',
    height: 'Alto (px)',
    swap: 'Swap Horizontal / Vertical',
    step4: '4. Logo / Marca de agua',
    activateLogo: 'Activar Logo',
    uploadLogo: 'Subir Logo (PNG transparente)',
    corner: 'Esquina',
    center: 'Centro',
    position: 'Posición',
    sizePercent: 'Tamaño (% ancho)',
    margin: 'Margen (px)',
    dropShadow: 'Drop Shadow',
    opacity: 'Opacidad (%)',
    step5: '5. Exportar',
    jpgQuality: 'Calidad JPG (%)',
    downloadJpg: 'Descargar JPG',
    downloadPng: 'Descargar PNG',
    packageFormat: 'Formato de paquete',
    downloadPackage: 'Descargar Paquete',
    refreshPreview: 'Refrescar Preview',
    footer: '© 2026 · sender.ia · Leo Aquiba Senderovsky',
    processing: 'Procesando...',
    generateImages: 'Generar Imágenes',
    generatedImages: 'Imágenes Generadas',
    showingImage: 'Mostrando {n} imagen',
    showingImages: 'Mostrando {n} imágenes',
    emptyState: 'Tus imágenes generadas aparecerán aquí.',
    generatedPageAlt: 'Página generada {n}',
    clickToUpload: 'Haz clic para subir logo',
    remove: 'Quitar',
    logoPositionTitle: 'Posición del Logo',
    logoOpacityLabel: 'Opacidad del Logo: {n}%',
    pages: '{n} páginas',
    selectPages: '2. Seleccionar Páginas',
    selectPagesCount: '{selected}/{total}',
    urlPlaceholder: 'https://example.com/file.pdf o enlace de Google Drive',
    proxyLabel: "Proxy personalizado (opcional): usa '{url}' o ?url=, o dejalo en blanco para usar el proxy integrado.",
    proxyPlaceholder: 'https://tu-proxy.ejemplo?url={url}',
    pdfOnlyAlert: 'Por favor selecciona un PDF.',
    urlRequiredAlert: 'Por favor ingresa una URL',
    imageOnlyAlert: 'Por favor selecciona una imagen.',
    loadError: 'No se pudo cargar el PDF. Asegúrate de que el archivo sea público y la URL sea directa.'
  }
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  const t = useMemo(
    () =>
      (key: string, vars: Record<string, string | number> = {}) => {
        const template = translations[lang][key] || translations.en[key] || key;
        return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
      },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
