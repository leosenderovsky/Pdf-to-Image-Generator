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
    gdriveHint: 'Google Drive link detected. File must be public ("Anyone with the link").',
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
    footerHtml: '© 2026 · <a href="https://www.instagram.com/sender.ia/" target="_blank" rel="noopener noreferrer">sender.ia</a> · Leo Aquiba Senderovsky',
    urlPlaceholder: 'https://example.com/file.pdf',
    downloadIndividual: 'Download individually:',
    pageLabelJpg: 'Page {n} (JPG)',
    pagesInfo: '{name}.pdf ({n} pages)',
    logLoadingUrl: 'Loading from URL via proxy...',
    logDocLoaded: 'Document loaded. Generating thumbnails...',
    logThumbsReady: 'Thumbnails ready.',
    logRenderingPage: 'Rendering page {n}...',
    logDownloadStarted: 'Download started.',
    logPackaging: 'Packaging files...',
    logReady: 'Ready to export.',
    pdfOnlyAlert: 'Please select a PDF file.',
    loadError: 'Error loading PDF from URL. It may be a CORS issue, private file, or invalid URL.\n{message}',
    igFeedSquare: 'Feed Square',
    igFeedHoriz: 'Feed Horizontal',
    igFeedVert: 'Feed Vertical',
    igStoryReels: 'Story/Reels',
    igProfile: 'Profile',
    fbPostSquare: 'Post Square',
    fbPostHoriz: 'Post Horizontal',
    fbStory: 'Story',
    fbCover: 'Cover',
    xImagePost: 'Image Post',
    xHeader: 'Header',
    inImagePost: 'Image Post',
    inStory: 'Story',
    inBanner: 'Banner',
    tkVideoCover: 'Video Cover',
    ytThumbnail: 'Thumbnail',
    ytChannelArt: 'Channel Art',
    piPinStandard: 'Standard Pin',
    piPinSquare: 'Square Pin',
    waStatus: 'Status'
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
    gdriveHint: 'Enlace de Google Drive detectado. El archivo debe ser público ("Cualquier usuario que tenga el vínculo").',
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
    footerHtml: '© 2026 · <a href="https://www.instagram.com/sender.ia/" target="_blank" rel="noopener noreferrer">sender.ia</a> · Leo Aquiba Senderovsky',
    urlPlaceholder: 'https://example.com/file.pdf',
    downloadIndividual: 'Descargar individualmente:',
    pageLabelJpg: 'Página {n} (JPG)',
    pagesInfo: '{name}.pdf ({n} páginas)',
    logLoadingUrl: 'Cargando desde URL a través de proxy...',
    logDocLoaded: 'Documento cargado. Generando miniaturas...',
    logThumbsReady: 'Miniaturas listas.',
    logRenderingPage: 'Renderizando página {n}...',
    logDownloadStarted: 'Descarga iniciada.',
    logPackaging: 'Empaquetando archivos...',
    logReady: 'Listo para exportar.',
    pdfOnlyAlert: 'Por favor selecciona un archivo PDF.',
    loadError: 'Error cargando PDF desde URL. Puede ser un problema de CORS, archivo privado o URL inválida.\n{message}',
    igFeedSquare: 'Feed Cuadrado',
    igFeedHoriz: 'Feed Horizontal',
    igFeedVert: 'Feed Vertical',
    igStoryReels: 'Story/Reels',
    igProfile: 'Perfil',
    fbPostSquare: 'Post Cuadrado',
    fbPostHoriz: 'Post Horizontal',
    fbStory: 'Story',
    fbCover: 'Portada',
    xImagePost: 'Post Imagen',
    xHeader: 'Header',
    inImagePost: 'Post Imagen',
    inStory: 'Story',
    inBanner: 'Banner',
    tkVideoCover: 'Portada Video',
    ytThumbnail: 'Miniatura',
    ytChannelArt: 'Arte del canal',
    piPinStandard: 'Pin Estándar',
    piPinSquare: 'Pin Cuadrado',
    waStatus: 'Estado'
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
