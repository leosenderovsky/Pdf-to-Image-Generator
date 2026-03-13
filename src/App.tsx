import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min?url';
import JSZip from 'jszip';
import pako from 'pako';
import { useLanguage } from './i18n';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  workerUrl || `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const OWN_PROXY = (url: string) =>
  `/api/proxy?url=${encodeURIComponent(url)}`;

const CORS_PROXIES = [
  OWN_PROXY,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
];

const normalizeGdriveUrl = (url: string): string => {
  const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile) {
    return `https://drive.google.com/uc?export=download&id=${matchFile[1]}&confirm=t`;
  }
  const matchShort = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchShort) {
    return `https://drive.google.com/uc?export=download&id=${matchShort[1]}&confirm=t`;
  }
  return url;
};

type LogoMode = 'corner' | 'center';
type LogoCornerPos = 'tl' | 'tr' | 'bl' | 'br';
type ResolutionTab = 'custom' | 'social';
type PageSelectionMode = 'all' | 'custom';

type SocialFormat = {
  net: string;
  nameKey: string;
  w: number;
  h: number;
};

const socialFormats: SocialFormat[] = [
  { net: 'IG', nameKey: 'igFeedSquare', w: 1080, h: 1080 },
  { net: 'IG', nameKey: 'igFeedHoriz', w: 1080, h: 566 },
  { net: 'IG', nameKey: 'igFeedVert', w: 1080, h: 1350 },
  { net: 'IG', nameKey: 'igStoryReels', w: 1080, h: 1920 },
  { net: 'IG', nameKey: 'igProfile', w: 320, h: 320 },
  { net: 'FB', nameKey: 'fbPostSquare', w: 1080, h: 1080 },
  { net: 'FB', nameKey: 'fbPostHoriz', w: 1200, h: 630 },
  { net: 'FB', nameKey: 'fbStory', w: 1080, h: 1920 },
  { net: 'FB', nameKey: 'fbCover', w: 820, h: 312 },
  { net: 'X', nameKey: 'xImagePost', w: 1200, h: 675 },
  { net: 'X', nameKey: 'xHeader', w: 1500, h: 500 },
  { net: 'IN', nameKey: 'inImagePost', w: 1200, h: 627 },
  { net: 'IN', nameKey: 'inStory', w: 1080, h: 1920 },
  { net: 'IN', nameKey: 'inBanner', w: 1584, h: 396 },
  { net: 'TK', nameKey: 'tkVideoCover', w: 1080, h: 1920 },
  { net: 'YT', nameKey: 'ytThumbnail', w: 1280, h: 720 },
  { net: 'YT', nameKey: 'ytChannelArt', w: 2560, h: 1440 },
  { net: 'PI', nameKey: 'piPinStandard', w: 1000, h: 1500 },
  { net: 'PI', nameKey: 'piPinSquare', w: 1000, h: 1000 },
  { net: 'WA', nameKey: 'waStatus', w: 1080, h: 1920 }
];

function App() {
  const { lang, setLang, t } = useLanguage();

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [currentPagePreview, setCurrentPagePreview] = useState(1);
  const [fileName, setFileName] = useState('documento');
  const [thumbnails, setThumbnails] = useState<{ page: number; url: string }[]>([]);

  const [pageSelectionMode, setPageSelectionMode] = useState<PageSelectionMode>('all');
  const [customPagesInput, setCustomPagesInput] = useState('');

  const [resolutionTab, setResolutionTab] = useState<ResolutionTab>('custom');
  const [outputWidth, setOutputWidth] = useState('1080');
  const [outputHeight, setOutputHeight] = useState('1080');
  const [socialIndex, setSocialIndex] = useState<number | null>(null);

  const [logoActive, setLogoActive] = useState(false);
  const [logoMode, setLogoMode] = useState<LogoMode>('corner');
  const [logoCornerPos, setLogoCornerPos] = useState<LogoCornerPos>('tl');
  const [logoSizeCorner, setLogoSizeCorner] = useState(15);
  const [logoMargin, setLogoMargin] = useState(40);
  const [logoShadow, setLogoShadow] = useState(false);
  const [logoSizeCenter, setLogoSizeCenter] = useState(50);
  const [logoOpacity, setLogoOpacity] = useState(30);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');

  const [urlInput, setUrlInput] = useState('');
  const [showGdocsWarning, setShowGdocsWarning] = useState(false);
  const [showGdriveWarning, setShowGdriveWarning] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dragOver, setDragOver] = useState(false);

  const [logMessage, setLogMessage] = useState('');
  const logTimerRef = useRef<number | null>(null);

  const [progress, setProgress] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const pageBackgroundColorsRef = useRef<Record<number, string>>({});

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (pdfDoc) {
      updatePageSelection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSelectionMode, customPagesInput, pdfDoc]);

  useEffect(() => {
    if (selectedPages.length > 0 && !selectedPages.includes(currentPagePreview)) {
      setCurrentPagePreview(selectedPages[0]);
    }
  }, [selectedPages, currentPagePreview]);

  useEffect(() => {
    updatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    outputWidth,
    outputHeight,
    pdfDoc,
    currentPagePreview,
    logoActive,
    logoMode,
    logoCornerPos,
    logoSizeCorner,
    logoMargin,
    logoShadow,
    logoSizeCenter,
    logoOpacity
  ]);

  useEffect(() => {
    updatePreviewInfo();
  }, [outputWidth, outputHeight]);

  const showLog = (msg: string) => {
    setLogMessage(msg);
    if (logTimerRef.current) {
      window.clearTimeout(logTimerRef.current);
    }
    logTimerRef.current = window.setTimeout(() => {
      setLogMessage('');
    }, 3000);
  };

  const setupPdf = async (doc: pdfjsLib.PDFDocumentProxy, name: string) => {
    setPdfDoc(doc);
    setNumPages(doc.numPages);
    setFileName(name);
    setCurrentPagePreview(1);
    pageBackgroundColorsRef.current = {};
    setSelectedPages(Array.from({ length: doc.numPages }, (_, i) => i + 1));
    showLog(t('logDocLoaded'));
    await generateThumbnails(doc, doc.numPages);
    showLog(t('logThumbsReady'));
  };

  const generateThumbnails = async (doc: pdfjsLib.PDFDocumentProxy, total: number) => {
    const thumbs: { page: number; url: string }[] = [];
    for (let i = 1; i <= total; i++) {
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 1));
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 0.15 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx!, viewport, canvas, background: 'transparent' }).promise;
      thumbs.push({ page: i, url: canvas.toDataURL('image/jpeg', 0.5) });
    }
    setThumbnails(thumbs);
  };

  const renderPage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number) => {
    const page = await pdf.getPage(pageNumber);
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const viewport = page.getViewport({ scale: 1.5 });
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context!,
      viewport: viewport,
      canvas
    };
    await page.render(renderContext).promise;
  };

  const handleFileLoad = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      alert(t('pdfOnlyAlert'));
      return;
    }
    try {
      setIsLoading(true);
      setLoadError(null);
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const name = file.name.replace('.pdf', '');
      await setupPdf(pdf, name);
      await renderPage(pdf, 1);
    } catch (err) {
      console.error('Error al cargar PDF desde archivo:', err);
      setLoadError('No se pudo cargar el archivo PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileLoad(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await handleFileLoad(file);
  };

  const handleUrlLoad = async () => {
    const rawUrl = urlInput.trim();
    if (!rawUrl) return;

    setIsLoading(true);
    setLoadError(null);
    setIsLoadingUrl(true);
    showLog(t('logLoadingUrl'));

    let url = rawUrl;
    let isGdrive = false;

    if (rawUrl.includes('drive.google.com') || rawUrl.includes('docs.google.com')) {
      url = normalizeGdriveUrl(rawUrl);
      isGdrive = true;
    }

    const isGdocs = rawUrl.includes('docs.google.com');
    setShowGdriveWarning(false);
    setShowGdocsWarning(isGdocs);

    let lastError: unknown = null;

    for (const proxyFn of CORS_PROXIES) {
      try {
        const proxiedUrl = proxyFn(url);
        // eslint-disable-next-line no-console
        console.log('Intentando cargar desde:', proxiedUrl);

        const loadingTask = pdfjsLib.getDocument({
          url: proxiedUrl,
          withCredentials: false,
          httpHeaders: {}
        });

        const pdf = await loadingTask.promise;
        const guessed = rawUrl.split('/').pop() || 'documento';
        const name = guessed.includes('?') ? guessed.split('?')[0] : guessed;
        await setupPdf(pdf, name.replace('.pdf', ''));
        await renderPage(pdf, 1);
        setShowGdriveWarning(false);
        setIsLoading(false);
        setIsLoadingUrl(false);
        return;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Falló proxy, intentando siguiente...', err);
        lastError = err;
      }
    }

    // eslint-disable-next-line no-console
    console.error('Todos los proxies fallaron:', lastError);
    if (isGdrive) {
      setShowGdriveWarning(true);
    }
    setLoadError(
      lang === 'es'
        ? 'No se pudo cargar el PDF desde la URL. Verificá que el archivo sea público y accesible.'
        : 'Could not load the PDF from the URL. Make sure the file is publicly accessible.'
    );
    setIsLoading(false);
    setIsLoadingUrl(false);
  };

  const LanguageSwitch = () => (
    <div className="lang-switch" role="group" aria-label="Language selector">
      <button
        type="button"
        onClick={() => setLang('en')}
        className={lang === 'en' ? 'active' : ''}
        aria-label="Switch to English"
        title="English"
      >
        <img
          src="https://flagcdn.com/w20/gb.png"
          srcSet="https://flagcdn.com/w40/gb.png 2x"
          width="20"
          height="15"
          alt="UK flag"
          loading="lazy"
        />
        <span>EN</span>
      </button>

      <span className="lang-divider" aria-hidden="true">|</span>

      <button
        type="button"
        onClick={() => setLang('es')}
        className={lang === 'es' ? 'active' : ''}
        aria-label="Cambiar a Español"
        title="Español"
      >
        <img
          src="https://flagcdn.com/w20/es.png"
          srcSet="https://flagcdn.com/w40/es.png 2x"
          width="20"
          height="15"
          alt="Spain flag"
          loading="lazy"
        />
        <span>ES</span>
      </button>
    </div>
  );

  const parsePageRanges = (str: string, max: number) => {
    if (!str.trim()) return [] as number[];
    const pages = new Set<number>();
    const parts = str.split(',');
    for (let part of parts) {
      part = part.trim();
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (start && end && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= max) pages.add(i);
          }
        }
      } else {
        const p = Number(part);
        if (p >= 1 && p <= max) pages.add(p);
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const updatePageSelection = () => {
    if (!pdfDoc) return;
    if (pageSelectionMode === 'all') {
      setSelectedPages(Array.from({ length: numPages }, (_, i) => i + 1));
    } else {
      setSelectedPages(parsePageRanges(customPagesInput, numPages));
    }
  };
  const updatePreviewInfo = () => {
    const w = outputWidth || '0';
    const h = outputHeight || '0';
    const el = document.getElementById('preview-info');
    if (el) el.textContent = `${w} × ${h} px`;
  };

  const detectBackgroundColor = async (tempCanvas: HTMLCanvasElement) => {
    try {
      const ctx = tempCanvas.getContext('2d');
      const w = tempCanvas.width;
      const h = tempCanvas.height;
      const imgData = ctx!.getImageData(0, 0, w, h).data;

      let rSum = 0, gSum = 0, bSum = 0, count = 0;

      const sampleArea = (startX: number, startY: number) => {
        for (let y = startY; y < startY + 3; y++) {
          for (let x = startX; x < startX + 3; x++) {
            if (x >= 0 && x < w && y >= 0 && y < h) {
              const i = (y * w + x) * 4;
              if (imgData[i + 3] > 0) {
                rSum += imgData[i];
                gSum += imgData[i + 1];
                bSum += imgData[i + 2];
                count++;
              }
            }
          }
        }
      };

      sampleArea(0, 0);
      sampleArea(w - 3, 0);
      sampleArea(0, h - 3);
      sampleArea(w - 3, h - 3);

      sampleArea(Math.floor(w / 2) - 1, 0);
      sampleArea(Math.floor(w / 2) - 1, h - 3);
      sampleArea(0, Math.floor(h / 2) - 1);
      sampleArea(w - 3, Math.floor(h / 2) - 1);

      if (count === 0) return '#ffffff';

      const r = Math.round(rSum / count);
      const g = Math.round(gSum / count);
      const b = Math.round(bSum / count);

      return `rgb(${r}, ${g}, ${b})`;
    } catch (e) {
      return '#ffffff';
    }
  };

  const renderPageToCanvas = async (
    page: pdfjsLib.PDFPageProxy,
    outW: number,
    outH: number,
    targetCanvas?: HTMLCanvasElement | null
  ) => {
    const pageNumber = page.pageNumber;
    let bgColor = pageBackgroundColorsRef.current[pageNumber];

    const viewportOriginal = page.getViewport({ scale: 1 });

    if (!bgColor) {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = viewportOriginal.width;
      tempCanvas.height = viewportOriginal.height;
      await page.render({ canvasContext: tempCtx!, viewport: viewportOriginal, canvas: tempCanvas, background: 'transparent' }).promise;
      bgColor = await detectBackgroundColor(tempCanvas);
      pageBackgroundColorsRef.current[pageNumber] = bgColor;
    }

    const scaleX = outW / viewportOriginal.width;
    const scaleY = outH / viewportOriginal.height;
    const scale = Math.min(scaleX, scaleY);

    const viewport = page.getViewport({ scale });

    const canvas = targetCanvas || document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = outW;
    canvas.height = outH;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, outW, outH);

    const offsetX = (outW - viewport.width) / 2;
    const offsetY = (outH - viewport.height) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    await page.render({ canvasContext: ctx, viewport, canvas, background: 'transparent' }).promise;
    ctx.restore();

    if (logoActive && logoImgRef.current) {
      composeLogo(ctx, outW, outH);
    }

    return canvas;
  };

  const composeLogo = (ctx: CanvasRenderingContext2D, outW: number, outH: number) => {
    const img = logoImgRef.current;
    if (!img) return;
    const imgRatio = img.height / img.width;

    ctx.save();

    if (logoMode === 'corner') {
      const logoW = outW * (logoSizeCorner / 100);
      const logoH = logoW * imgRatio;
      const m = logoMargin;

      let x = 0, y = 0;
      if (logoCornerPos === 'tl') { x = m; y = m; }
      else if (logoCornerPos === 'tr') { x = outW - logoW - m; y = m; }
      else if (logoCornerPos === 'bl') { x = m; y = outH - logoH - m; }
      else if (logoCornerPos === 'br') { x = outW - logoW - m; y = outH - logoH - m; }

      if (logoShadow) {
        ctx.filter = 'drop-shadow(4px 4px 12px rgba(0,0,0,0.6))';
      }
      ctx.drawImage(img, x, y, logoW, logoH);
    } else {
      const logoW = outW * (logoSizeCenter / 100);
      const logoH = logoW * imgRatio;
      const x = (outW - logoW) / 2;
      const y = (outH - logoH) / 2;
      ctx.globalAlpha = logoOpacity / 100;
      ctx.drawImage(img, x, y, logoW, logoH);
    }

    ctx.restore();
  };

  const updatePreview = async () => {
    if (!pdfDoc) return;
    const outW = Math.max(1, Math.min(8000, Math.round(Number(outputWidth) || 1080)));
    const outH = Math.max(1, Math.min(8000, Math.round(Number(outputHeight) || 1080)));
    const page = await pdfDoc.getPage(currentPagePreview || 1);
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    await renderPageToCanvas(page, outW, outH, canvas);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        logoImgRef.current = img;
        setLogoPreviewUrl(String(ev.target?.result || ''));
        updatePreview();
      };
      img.src = String(ev.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSwapDimensions = () => {
    setOutputWidth(outputHeight);
    setOutputHeight(outputWidth);
  };

  const handleDimensionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
      e.preventDefault();
    }
  };

  const handleDimensionPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text') || '';
    if (pasted.includes('-')) e.preventDefault();
  };

  const handleDimensionChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const raw = String(value || '').trim();
    if (raw.includes('-')) {
      setter('');
      return;
    }
    setter(raw.replace(/[^0-9]/g, ''));
  };

  const handleDimensionBlur = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 1) setter('1080');
    else if (num > 8000) setter('8000');
    else setter(String(Math.round(num)));
  };

  const handleSelectSocial = (idx: number) => {
    setSocialIndex(idx);
    const fmt = socialFormats[idx];
    setOutputWidth(String(fmt.w));
    setOutputHeight(String(fmt.h));
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportSinglePage = async (pageNum: number, format: 'jpeg' | 'png') => {
    if (!pdfDoc) return;
    const outW = Math.max(1, Math.min(8000, Math.round(Number(outputWidth) || 1080)));
    const outH = Math.max(1, Math.min(8000, Math.round(Number(outputHeight) || 1080)));
    const quality = Number(document.getElementById('export-quality')?.getAttribute('data-val') || '90') / 100;

    showLog(t('logRenderingPage', { n: pageNum }));
    const page = await pdfDoc.getPage(pageNum);
    const canvas = await renderPageToCanvas(page, outW, outH);

    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const ext = format === 'png' ? 'png' : 'jpg';
    const dataUrl = canvas.toDataURL(mime, quality);

    downloadDataUrl(dataUrl, `${fileName}_p${pageNum.toString().padStart(2, '0')}.${ext}`);
    showLog(t('logDownloadStarted'));
  };

  const exportSingle = async (format: 'jpeg' | 'png') => {
    if (selectedPages.length === 0) return;
    await exportSinglePage(selectedPages[0], format);
  };

  const createTarGz = (files: { name: string; data: Uint8Array }[]) => {
    let tarSize = 0;
    files.forEach(f => {
      tarSize += 512 + Math.ceil(f.data.length / 512) * 512;
    });
    tarSize += 1024;

    const tarBuffer = new Uint8Array(tarSize);
    let offset = 0;

    files.forEach(f => {
      const header = new Uint8Array(512);
      for (let i = 0; i < f.name.length && i < 100; i++) header[i] = f.name.charCodeAt(i);
      const mode = '0000644\0';
      for (let i = 0; i < 8; i++) header[100 + i] = mode.charCodeAt(i);
      const uid = '0000000\0';
      for (let i = 0; i < 8; i++) header[108 + i] = uid.charCodeAt(i);
      const gid = '0000000\0';
      for (let i = 0; i < 8; i++) header[116 + i] = gid.charCodeAt(i);
      const sizeStr = f.data.length.toString(8).padStart(11, '0') + '\0';
      for (let i = 0; i < 12; i++) header[124 + i] = sizeStr.charCodeAt(i);
      const mtimeStr = Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0';
      for (let i = 0; i < 12; i++) header[136 + i] = mtimeStr.charCodeAt(i);
      header[156] = '0'.charCodeAt(0);
      const magic = 'ustar\0';
      for (let i = 0; i < 6; i++) header[257 + i] = magic.charCodeAt(i);
      header[263] = '0'.charCodeAt(0);
      header[264] = '0'.charCodeAt(0);

      for (let i = 0; i < 8; i++) header[148 + i] = 32;
      let sum = 0;
      for (let i = 0; i < 512; i++) sum += header[i];
      const chksumStr = sum.toString(8).padStart(6, '0') + '\0 ';
      for (let i = 0; i < 8; i++) header[148 + i] = chksumStr.charCodeAt(i);

      tarBuffer.set(header, offset);
      offset += 512;
      tarBuffer.set(f.data, offset);
      offset += Math.ceil(f.data.length / 512) * 512;
    });

    const gzData = pako.gzip(tarBuffer);
    return new Blob([gzData], { type: 'application/gzip' });
  };

  const exportMultiple = async () => {
    if (!pdfDoc || selectedPages.length === 0) return;
    const format = (document.getElementById('export-package-format') as HTMLSelectElement)?.value || 'zip';
    const outW = Math.max(1, Math.min(8000, Math.round(Number(outputWidth) || 1080)));
    const outH = Math.max(1, Math.min(8000, Math.round(Number(outputHeight) || 1080)));
    const quality = Number(document.getElementById('export-quality')?.getAttribute('data-val') || '90') / 100;

    setProgress(0);
    const files: { name: string; data: Uint8Array }[] = [];

    for (let i = 0; i < selectedPages.length; i++) {
      const pageNum = selectedPages[i];
      showLog(t('logRenderingPage', { n: pageNum }));

      const page = await pdfDoc.getPage(pageNum);
      const canvas = await renderPageToCanvas(page, outW, outH);
      const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b as Blob), 'image/jpeg', quality));
      const arrayBuffer = await blob.arrayBuffer();
      files.push({
        name: `${fileName}_p${pageNum.toString().padStart(2, '0')}.jpg`,
        data: new Uint8Array(arrayBuffer)
      });
      setProgress(((i + 1) / selectedPages.length) * 100);
    }

    showLog(t('logPackaging'));

    if (format === 'zip') {
      const zip = new JSZip();
      files.forEach(f => zip.file(f.name, f.data));
      const content = await zip.generateAsync({ type: 'blob' });
      downloadDataUrl(URL.createObjectURL(content), `${fileName}_images.zip`);
    } else {
      const tarBlob = createTarGz(files);
      downloadDataUrl(URL.createObjectURL(tarBlob), `${fileName}_images.tar.gz`);
    }

    setProgress(null);
    showLog(t('logReady'));
  };

  const exportQuality = useMemo(() => 90, []);

  const handleQualityChange = (value: number) => {
    const el = document.getElementById('export-quality');
    if (el) el.setAttribute('data-val', String(value));
    const label = document.getElementById('val-quality');
    if (label) label.textContent = String(value);
  };

  const refreshPreview = () => updatePreview();
  return (
    <div id="app-container">
      <div id="left-panel">
        <header style={{ padding: '1.5rem 1rem', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div className="header-top" style={{ marginBottom: '0.75rem' }}>
            <LanguageSwitch />
          </div>
          <div className="header-content">
            <h1 className="app-title" style={{ color: 'var(--accent-teal)', marginBottom: '0.5rem' }}>{t('appTitle')}</h1>
            <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
              {t('appSubtitle')}
            </p>
            <p style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)', margin: 0 }}>
              {t('byLabel')}{' '}
              <a href="https://www.instagram.com/sender.ia/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-teal)', textDecoration: 'none' }}>
                sender.ia
              </a>
            </p>
          </div>
        </header>

        <div className="accordion-item active">
          <div className="accordion-header" onClick={(e) => (e.currentTarget.parentElement?.classList.toggle('active'))}>
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            <span className="accordion-title">{t('step1')}</span>
          </div>
          <div className="accordion-content">
            <div
              id="drop-zone"
              className={dragOver ? 'dragover' : ''}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <p>{t('dropzone')}</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx,.ppt,.pptx" style={{ display: 'none' }} />
            </div>
            <p className="warning-text" style={{ display: 'block' }}>{t('officeHint')}</p>

            <div style={{ marginTop: '1rem' }}>
              <label>{t('urlLabel')}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUrlLoad(); }}
                  placeholder={t('urlPlaceholder')}
                />
                <button onClick={handleUrlLoad} style={{ width: 'auto' }} disabled={isLoadingUrl}>{t('loadBtn')}</button>
              </div>
              {showGdocsWarning && <p className="warning-text" style={{ display: 'block' }}>{t('googleHint')}</p>}
              {showGdriveWarning && <p className="warning-text" style={{ display: 'block' }}>{t('gdriveHint')}</p>}
            </div>

            {pdfDoc && (
              <div id="pdf-info" style={{ display: 'block' }}>
                <div id="pdf-info-text">{t('pagesInfo', { name: fileName, n: numPages })}</div>
                <div id="thumbnails-container">
                  {thumbnails.map((thumb) => (
                    <div
                      key={thumb.page}
                      className={`thumbnail ${thumb.page === currentPagePreview ? 'active' : ''}`}
                      style={{ backgroundImage: `url(${thumb.url})`, display: selectedPages.includes(thumb.page) ? 'block' : 'none' }}
                      onClick={() => { setCurrentPagePreview(thumb.page); }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="accordion-item">
          <div className="accordion-header" onClick={(e) => (e.currentTarget.parentElement?.classList.toggle('active'))}>
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="9"></rect><rect x="14" y="7" width="3" height="5"></rect></svg>
            <span className="accordion-title">{t('step2')}</span>
          </div>
          <div className="accordion-content">
            <div className="radio-group">
              <label className="radio-label">
                <input type="radio" name="page-selection" value="all" checked={pageSelectionMode === 'all'} onChange={() => setPageSelectionMode('all')} />
                <span>{t('allDoc')}</span>
              </label>
              <label className="radio-label">
                <input type="radio" name="page-selection" value="custom" checked={pageSelectionMode === 'custom'} onChange={() => setPageSelectionMode('custom')} />
                <span>{t('specificPages')}</span>
              </label>
            </div>
            {pageSelectionMode === 'custom' && (
              <div id="custom-pages-container">
                <label>{t('pagesPlaceholder')}</label>
                <input type="text" value={customPagesInput} onChange={(e) => setCustomPagesInput(e.target.value)} placeholder={t('pagesPlaceholder')} />
              </div>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', marginTop: '0.5rem' }} id="selected-pages-count">
              {t('pagesSelected', { n: selectedPages.length })}
            </p>
          </div>
        </div>

        <div className="accordion-item">
          <div className="accordion-header" onClick={(e) => (e.currentTarget.parentElement?.classList.toggle('active'))}>
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span className="accordion-title">{t('step3')}</span>
          </div>
          <div className="accordion-content" style={{ paddingTop: 0 }}>
            <div className="tabs">
              <div className={`tab ${resolutionTab === 'custom' ? 'active' : ''}`} onClick={() => setResolutionTab('custom')}>{t('custom')}</div>
              <div className={`tab ${resolutionTab === 'social' ? 'active' : ''}`} onClick={() => setResolutionTab('social')}>{t('socialMedia')}</div>
            </div>

            <div id="custom-res" className={`tab-content ${resolutionTab === 'custom' ? 'active' : ''}`}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label>{t('width')}</label>
                  <input
                    type="number"
                    value={outputWidth}
                    onKeyDown={handleDimensionKeyDown}
                    onPaste={handleDimensionPaste}
                    onChange={(e) => handleDimensionChange(e.target.value, setOutputWidth)}
                    onBlur={(e) => handleDimensionBlur(e.target.value, setOutputWidth)}
                  />
                </div>
                <div>
                  <label>{t('height')}</label>
                  <input
                    type="number"
                    value={outputHeight}
                    onKeyDown={handleDimensionKeyDown}
                    onPaste={handleDimensionPaste}
                    onChange={(e) => handleDimensionChange(e.target.value, setOutputHeight)}
                    onBlur={(e) => handleDimensionBlur(e.target.value, setOutputHeight)}
                  />
                </div>
              </div>
              <button className="secondary" onClick={handleSwapDimensions}>{t('swap')}</button>
            </div>

            <div id="social-res" className={`tab-content ${resolutionTab === 'social' ? 'active' : ''}`}>
              <div className="social-grid" id="social-grid-container">
                {socialFormats.map((fmt, idx) => {
                  const ratio = fmt.w / fmt.h;
                  let svgW = 40; let svgH = 40;
                  if (ratio > 1) { svgH = 40 / ratio; } else { svgW = 40 * ratio; }
                  return (
                    <div key={`${fmt.net}-${idx}`} className={`social-card ${socialIndex === idx ? 'active' : ''}`} onClick={() => handleSelectSocial(idx)}>
                      <svg viewBox="0 0 50 50">
                        <rect x={25 - svgW / 2} y={25 - svgH / 2} width={svgW} height={svgH} rx="2"></rect>
                      </svg>
                      <div className="social-title">{fmt.net} {t(fmt.nameKey)}</div>
                      <div className="social-dim">{fmt.w}x{fmt.h}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="accordion-item">
          <div className="accordion-header" onClick={(e) => (e.currentTarget.parentElement?.classList.toggle('active'))}>
            <svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            <span className="accordion-title">{t('step4')}</span>
          </div>
          <div className="accordion-content">
            <div className="toggle-row">
              <span style={{ fontSize: '0.85rem' }}>{t('activateLogo')}</span>
              <label className="switch">
                <input type="checkbox" checked={logoActive} onChange={(e) => setLogoActive(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>

            {logoActive && (
              <div id="logo-settings" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label>{t('uploadLogo')}</label>
                  <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/png,image/jpeg" style={{ fontSize: '0.75rem' }} />
                  {logoPreviewUrl && <img src={logoPreviewUrl} alt="Logo preview" style={{ maxWidth: '100px', maxHeight: '50px', marginTop: '0.5rem' }} />}
                </div>

                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="logo-mode" value="corner" checked={logoMode === 'corner'} onChange={() => setLogoMode('corner')} />
                    <span>{t('corner')}</span>
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="logo-mode" value="center" checked={logoMode === 'center'} onChange={() => setLogoMode('center')} />
                    <span>{t('center')}</span>
                  </label>
                </div>

                {logoMode === 'corner' && (
                  <div id="logo-corner-settings">
                    <label>{t('position')}</label>
                    <div className="placement-grid" id="placement-grid">
                      <div className={`placement-cell ${logoCornerPos === 'tl' ? 'active' : ''}`} onClick={() => setLogoCornerPos('tl')}></div>
                      <div className={`placement-cell ${logoCornerPos === 'tr' ? 'active' : ''}`} onClick={() => setLogoCornerPos('tr')}></div>
                      <div className={`placement-cell ${logoCornerPos === 'bl' ? 'active' : ''}`} onClick={() => setLogoCornerPos('bl')}></div>
                      <div className={`placement-cell ${logoCornerPos === 'br' ? 'active' : ''}`} onClick={() => setLogoCornerPos('br')}></div>
                    </div>

                    <label style={{ marginTop: '1rem' }}>{t('sizePercent')}</label>
                    <div className="slider-row">
                      <input type="range" min="5" max="40" value={logoSizeCorner} onChange={(e) => setLogoSizeCorner(Number(e.target.value))} />
                      <span className="slider-val">{logoSizeCorner}</span>
                    </div>

                    <label style={{ marginTop: '0.5rem' }}>{t('margin')}</label>
                    <div className="slider-row">
                      <input type="range" min="10" max="100" value={logoMargin} onChange={(e) => setLogoMargin(Number(e.target.value))} />
                      <span className="slider-val">{logoMargin}</span>
                    </div>

                    <div className="toggle-row" style={{ marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem' }}>{t('dropShadow')}</span>
                      <label className="switch">
                        <input type="checkbox" checked={logoShadow} onChange={(e) => setLogoShadow(e.target.checked)} />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                )}

                {logoMode === 'center' && (
                  <div id="logo-center-settings">
                    <label>{t('sizePercent')}</label>
                    <div className="slider-row">
                      <input type="range" min="20" max="80" value={logoSizeCenter} onChange={(e) => setLogoSizeCenter(Number(e.target.value))} />
                      <span className="slider-val">{logoSizeCenter}</span>
                    </div>

                    <label style={{ marginTop: '0.5rem' }}>{t('opacity')}</label>
                    <div className="slider-row">
                      <input type="range" min="10" max="60" value={logoOpacity} onChange={(e) => setLogoOpacity(Number(e.target.value))} />
                      <span className="slider-val">{logoOpacity}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="accordion-item">
          <div className="accordion-header" onClick={(e) => (e.currentTarget.parentElement?.classList.toggle('active'))}>
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span className="accordion-title">{t('step5')}</span>
          </div>
          <div className="accordion-content">
            <label>{t('jpgQuality')}</label>
            <div className="slider-row" style={{ marginBottom: '1rem' }}>
              <input
                id="export-quality"
                type="range"
                min="60"
                max="100"
                defaultValue={exportQuality}
                data-val={exportQuality}
                onChange={(e) => handleQualityChange(Number(e.target.value))}
              />
              <span className="slider-val" id="val-quality">{exportQuality}</span>
            </div>

            {selectedPages.length === 1 && (
              <div id="export-single" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button onClick={() => exportSingle('jpeg')}>{t('downloadJpg')}</button>
                <button className="secondary" onClick={() => exportSingle('png')}>{t('downloadPng')}</button>
              </div>
            )}

            {selectedPages.length > 1 && (
              <div id="export-multi" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>{t('packageFormat')}</label>
                <select id="export-package-format">
                  <option value="zip">ZIP</option>
                  <option value="targz">TAR.GZ</option>
                </select>
                <button onClick={exportMultiple}>{t('downloadPackage')}</button>
                {selectedPages.length <= 5 && (
                  <div id="export-individual-btns" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                    <label>{t('downloadIndividual')}</label>
                    {selectedPages.map(p => (
                      <button key={p} className="secondary" style={{ padding: '0.3rem', fontSize: '0.75rem' }} onClick={() => exportSinglePage(p, 'jpeg')}>
                        {t('pageLabelJpg', { n: p })}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div id="left-footer" dangerouslySetInnerHTML={{ __html: t('footerHtml') }} />
      </div>

      <div id="right-panel">
        {progress !== null && (
          <div id="progress-container">
            <div id="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
        )}
        {logMessage && <div id="log-area">{logMessage}</div>}

        <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
          <button className="secondary" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={refreshPreview}>
            {t('refreshPreview')}
          </button>
        </div>

        <div id="preview-container">
          <canvas id="preview-canvas" ref={previewCanvasRef} width={Number(outputWidth) || 1080} height={Number(outputHeight) || 1080}></canvas>
        </div>
        <div id="preview-info"></div>
      </div>
    </div>
  );
}

export default App;
