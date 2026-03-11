
import React, { useState, useRef, useMemo } from 'react';
import { UploadCloud, Image as ImageIcon, CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight, Droplets, Download, RefreshCw } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type LogoPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center';
type ResolutionMode = 'custom' | 'social';

const socialResolutions = {
  'Instagram Post': { width: 1080, height: 1080 },
  'Instagram Story': { width: 1080, height: 1920 },
  'Facebook Post': { width: 1200, height: 630 },
  'Twitter Post': { width: 1600, height: 900 },
};

function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoName, setLogoName] = useState<string>('');
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('topRight');
  const [logoOpacity, setLogoOpacity] = useState(0.5);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [resolutionMode, setResolutionMode] = useState<ResolutionMode>('custom');
  const [outputWidth, setOutputWidth] = useState<number | ''>(1080);
  const [outputHeight, setOutputHeight] = useState<number | ''>(1080);
  const [socialPreset, setSocialPreset] = useState<string>('Instagram Post');

  const finalDimensions = useMemo(() => {
    if (resolutionMode === 'social') {
      return socialResolutions[socialPreset as keyof typeof socialResolutions];
    }
    return { width: outputWidth, height: outputHeight };
  }, [resolutionMode, outputWidth, outputHeight, socialPreset]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setPdfName(file.name);
      setGeneratedImages([]);
      setSelectedPages([]);
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      const pdfDoc = await loadingTask.promise;
      setTotalPages(pdfDoc.numPages);
      setSelectedPages(Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1));
    } else {
      alert('Please select a PDF file.');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      setLogoName(file.name);
    } else {
      alert('Please select an image file.');
    }
  };

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages(prev =>
      prev.includes(pageNumber)
        ? prev.filter(p => p !== pageNumber)
        : [...prev, pageNumber]
    );
  };
  
  const processPdf = async () => {
    if (!pdfFile) return;

    setIsProcessing(true);
    setGeneratedImages([]);

    let parsedWidth = Number(finalDimensions.width);
    if (!Number.isFinite(parsedWidth) || parsedWidth < 1) parsedWidth = 1080;
    let parsedHeight = Number(finalDimensions.height);
    if (!Number.isFinite(parsedHeight) || parsedHeight < 1) parsedHeight = 1080;

    const safeWidth = Math.max(1, Math.min(8000, Math.round(parsedWidth)));
    const safeHeight = Math.max(1, Math.min(8000, Math.round(parsedHeight)));

    const pdfArrayBuffer = await pdfFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(pdfArrayBuffer);
    const pdfDoc = await loadingTask.promise;
    const images: string[] = [];

    let logoImage: HTMLImageElement | null = null;
    if (logoFile) {
        logoImage = new Image();
        logoImage.src = URL.createObjectURL(logoFile);
        await new Promise(resolve => logoImage!.onload = resolve);
    }

    for (const pageNum of selectedPages) {
        const page = await pdfDoc.getPage(pageNum);
        const nativeViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(safeWidth / nativeViewport.width, safeHeight / nativeViewport.height);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = safeWidth;
        canvas.height = safeHeight;
        const context = canvas.getContext('2d');

        if (context) {
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            const offsetX = (safeWidth - viewport.width) / 2;
            const offsetY = (safeHeight - viewport.height) / 2;

            context.save();
            context.translate(offsetX, offsetY);
            await page.render({
              canvasContext: context,
              viewport: viewport,
              canvas: canvas
            }).promise;
            context.restore();

            if (logoImage) {
                const maxWidth = canvas.width * 0.15;
                const scale = maxWidth / logoImage.width;
                const logoWidth = logoImage.width * scale;
                const logoHeight = logoImage.height * scale;
                let x = 0, y = 0;
                const margin = 10;
                switch(logoPosition) {
                    case 'topLeft': x = margin; y = margin; break;
                    case 'topRight': x = canvas.width - logoWidth - margin; y = margin; break;
                    case 'bottomLeft': x = margin; y = canvas.height - logoHeight - margin; break;
                    case 'bottomRight': x = canvas.width - logoWidth - margin; y = canvas.height - logoHeight - margin; break;
                    case 'center': x = (canvas.width - logoWidth) / 2; y = (canvas.height - logoHeight) / 2; break;
                }
                context.globalAlpha = logoPosition === 'center' ? logoOpacity : 1;
                context.drawImage(logoImage, x, y, logoWidth, logoHeight);
                context.globalAlpha = 1;
            }
            images.push(canvas.toDataURL('image/png'));
        }
    }
    setGeneratedImages(images);
    setIsProcessing(false);
  };
  
  const downloadAllAsZip = async () => {
    const zip = new JSZip();
    generatedImages.forEach((imgData, index) => {
        const pageNum = selectedPages[index];
        zip.file(`page_${pageNum}.png`, imgData.split(',')[1], { base64: true });
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `${pdfName.replace('.pdf', '')}_images.zip`;
    link.click();
  };

  const handleDimensionChange = (value: string, setter: React.Dispatch<React.SetStateAction<number | ''>>) => {
    const raw = String(value || '').trim();
    // If user typed or pasted a minus sign, treat as empty (block negatives)
    if (raw.includes('-')) {
      setter('');
      return;
    }
    const sanitizedValue = raw.replace(/[^0-9]/g, '');
    if (sanitizedValue === '') {
      setter('');
    } else {
      const num = parseInt(sanitizedValue, 10);
      setter(num);
    }
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent characters that lead to negative/exponential/decimal input in number fields
    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
      e.preventDefault();
    }
  };

  const handlePasteNumeric = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text') || '';
    // Block paste that would introduce a negative value
    if (pasted.includes('-')) {
      e.preventDefault();
    }
  };

  const handleDimensionBlur = (value: number | string | '', setter: React.Dispatch<React.SetStateAction<number | ''>>, defaultValue: number) => {
    const num = Number(value);
    if (isNaN(num) || num < 1) {
      setter(defaultValue);
    } else if (num > 8000) {
      setter(8000);
    } else {
      setter(Math.round(num));
    }
  };

  const swapDimensions = () => {
    if (resolutionMode === 'custom') {
      setOutputHeight(outputWidth);
      setOutputWidth(outputHeight);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-indigo-400">PDF to Image Generator</h1>
        <p className="text-center text-gray-400 mb-8">Convert your PDF pages into images, with custom watermarks.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Configuration */}
          <div className="space-y-6">
            
            {/* 1. PDF Uploader */}
            <div>
              <label className="text-lg font-semibold mb-2 block">1. Upload PDF</label>
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700" onClick={() => fileInputRef.current?.click()}>
                <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                {pdfFile ? <div className="text-center"><p className="font-semibold text-indigo-400">{pdfName}</p><span className="text-sm text-gray-400">{totalPages} pages</span></div> : <p className="text-gray-400">Click to upload or drag & drop</p>}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
            </div>

            {/* 2. Page Selection */}
            {totalPages > 0 && (
                <div>
                  <label className="text-lg font-semibold mb-2 block">2. Select Pages ({selectedPages.length}/{totalPages})</label>
                  <div className="max-h-32 overflow-y-auto grid grid-cols-5 gap-2 p-2 bg-gray-700 rounded-lg">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button key={pageNum} onClick={() => togglePageSelection(pageNum)} className={`p-2 rounded-md text-sm ${selectedPages.includes(pageNum) ? 'bg-indigo-500 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>{pageNum}</button>
                    ))}
                  </div>
                </div>
            )}

            {/* 3. Output Resolution */}
            <div>
              <label className="text-lg font-semibold mb-2 block">3. Output Resolution</label>
              <div className="flex border-b border-gray-700 mb-4">
                <button onClick={() => setResolutionMode('custom')} className={`py-2 px-4 text-sm font-medium ${resolutionMode === 'custom' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-gray-400 hover:text-white'}`}>Personalizada</button>
                <button onClick={() => setResolutionMode('social')} className={`py-2 px-4 text-sm font-medium ${resolutionMode === 'social' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-gray-400 hover:text-white'}`}>Redes Sociales</button>
              </div>

              {resolutionMode === 'custom' ? (
                <div className='space-y-4'>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 mb-1 block">Ancho (px)</label>
                      <input id="out-width" data-testid="out-width" type="number" inputMode="numeric" pattern="[0-9]*" min="1" max="8000" value={outputWidth} onChange={e => handleDimensionChange(e.target.value, setOutputWidth)} onBlur={e => handleDimensionBlur((e.target as HTMLInputElement).value, setOutputWidth, 1080)} onKeyDown={handleNumericKeyDown} onPaste={handlePasteNumeric} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"/>
                    </div>
                    <span className="text-gray-400 mt-5">×</span>
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 mb-1 block">Alto (px)</label>
                      <input id="out-height" data-testid="out-height" type="number" inputMode="numeric" pattern="[0-9]*" min="1" max="8000" value={outputHeight} onChange={e => handleDimensionChange(e.target.value, setOutputHeight)} onBlur={e => handleDimensionBlur((e.target as HTMLInputElement).value, setOutputHeight, 1080)} onKeyDown={handleNumericKeyDown} onPaste={handlePasteNumeric} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"/>
                    </div>
                  </div>
                  <button onClick={swapDimensions} className="w-full flex items-center justify-center gap-2 text-sm py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg"><RefreshCw size={14}/> Swap Horizontal / Vertical</button>
                </div>
              ) : (
                <div>
                  <select value={socialPreset} onChange={e => setSocialPreset(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                    {Object.keys(socialResolutions).map(key => <option key={key} value={key}>{key} ({socialResolutions[key as keyof typeof socialResolutions].width}x{socialResolutions[key as keyof typeof socialResolutions].height})</option>)}
                  </select>
                </div>
              )}
            </div>
            
            {/* 4. Logo (Optional) */}
            <div>
              <label className="text-lg font-semibold mb-2 block">4. Add Logo (Optional)</label>
               <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700" onClick={() => logoInputRef.current?.click()}>
                <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                {logoFile ? <div className="text-center"><p className="font-semibold text-indigo-400">{logoName}</p><button onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoName(''); }} className="text-xs text-red-400 hover:text-red-300 mt-1">Remove</button></div> : <p className="text-gray-400">Click to upload logo</p>}
              </div>
              <input type="file" ref={logoInputRef} onChange={handleLogoChange} className="hidden" accept="image/*" />
            </div>

            {/* 5. Logo Position */}
            {logoFile && (
              <div>
                <label className="text-lg font-semibold mb-2 block">5. Logo Position</label>
                <div className="grid grid-cols-3 gap-2 bg-gray-700 p-2 rounded-lg">
                  <button onClick={() => setLogoPosition('topLeft')} className={`p-2 rounded-md flex justify-center ${logoPosition === 'topLeft' ? 'bg-indigo-500' : 'hover:bg-gray-600'}`}><CornerUpLeft/></button>
                  <div></div>
                  <button onClick={() => setLogoPosition('topRight')} className={`p-2 rounded-md flex justify-center ${logoPosition === 'topRight' ? 'bg-indigo-500' : 'hover:bg-gray-600'}`}><CornerUpRight/></button>
                  <div></div>
                  <button onClick={() => setLogoPosition('center')} className={`p-2 rounded-md flex justify-center items-center ${logoPosition === 'center' ? 'bg-indigo-500' : 'hover:bg-gray-600'}`}><Droplets size={20}/></button>
                  <div></div>
                  <button onClick={() => setLogoPosition('bottomLeft')} className={`p-2 rounded-md flex justify-center ${logoPosition === 'bottomLeft' ? 'bg-indigo-500' : 'hover:bg-gray-600'}`}><CornerDownLeft/></button>
                  <div></div>
                  <button onClick={() => setLogoPosition('bottomRight')} className={`p-2 rounded-md flex justify-center ${logoPosition === 'bottomRight' ? 'bg-indigo-500' : 'hover:bg-gray-600'}`}><CornerDownRight/></button>
                </div>
                {logoPosition === 'center' && (
                  <div className="mt-4">
                    <label htmlFor="opacity" className="block text-sm font-medium text-gray-300">Logo Opacity: {Math.round(logoOpacity * 100)}%</label>
                    <input type="range" id="opacity" min="0.1" max="1" step="0.1" value={logoOpacity} onChange={e => setLogoOpacity(parseFloat(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  </div>
                )}
              </div>
            )}
            
            {/* Process Button */}
            <button onClick={processPdf} disabled={!pdfFile || isProcessing || selectedPages.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">
              {isProcessing ? 'Processing...' : 'Generate Images'}
            </button>
          </div>

          {/* Right Column: Preview */}
          <div className="bg-gray-900 p-4 rounded-lg h-full min-h-[400px] flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-center">Generated Images</h2>
            {generatedImages.length > 0 && (
              <div className="flex items-center justify-between mb-2">
                 <p className="text-sm text-gray-400">Showing {generatedImages.length} image{generatedImages.length > 1 ? 's' : ''}</p>
                 <button onClick={downloadAllAsZip} className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-lg">
                  <Download size={16} /> Download All (.zip)
                </button>
              </div>
            )}
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
              {isProcessing ? (
                <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div></div>
              ) : generatedImages.length === 0 ? (
                 <div className="flex flex-col justify-center items-center h-full text-center text-gray-500"><ImageIcon size={48} className="mb-2"/><p>Your generated images will appear here.</p></div>
              ) : (
                generatedImages.map((imgSrc, index) => (
                  <div key={index} className="relative group">
                    <img src={imgSrc} alt={`Generated Page ${selectedPages[index]}`} className="w-full h-auto rounded-md" />
                     <a href={imgSrc} download={`page_${selectedPages[index]}.png`} className="absolute bottom-2 right-2 bg-indigo-600 p-2 rounded-full opacity-0 group-hover:opacity-100"><Download size={18} /></a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
