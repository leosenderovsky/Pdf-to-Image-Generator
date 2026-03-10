import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight, Droplets, Download } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type LogoPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center';

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
  const [outputWidth, setOutputWidth] = useState<number>(1080);
  const [outputHeight, setOutputHeight] = useState<number>(1080);
  const [widthStr, setWidthStr] = useState<string>('1080');
  const [heightStr, setHeightStr] = useState<string>('1080');

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

    const safeWidth = Math.max(1, Math.min(8000, Math.round(outputWidth)));
    const safeHeight = Math.max(1, Math.min(8000, Math.round(outputHeight)));

    if (!safeWidth || !safeHeight || safeWidth <= 0 || safeHeight <= 0) {
      alert('Please enter valid positive dimensions (1–8000px).');
      setIsProcessing(false);
      return;
    }

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

        const scaleX = safeWidth / nativeViewport.width;
        const scaleY = safeHeight / nativeViewport.height;
        const scale = Math.min(scaleX, scaleY);

        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = safeWidth;
        canvas.height = safeHeight;
        const context = canvas.getContext('2d');

        if (context) {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, safeWidth, safeHeight);

            const offsetX = (safeWidth - scaledViewport.width) / 2;
            const offsetY = (safeHeight - scaledViewport.height) / 2;

            const renderContext = {
                canvasContext: context,
                viewport: scaledViewport,
                transform: [1, 0, 0, 1, offsetX, offsetY],
            };
            
            await page.render(renderContext).promise;

            if (logoImage) {
                const maxWidth = canvas.width * 0.15;
                const scale = maxWidth / logoImage.width;
                const logoWidth = logoImage.width * scale;
                const logoHeight = logoImage.height * scale;
                
                let x = 0, y = 0;
                
                switch(logoPosition) {
                    case 'topLeft':
                        x = 10;
                        y = 10;
                        break;
                    case 'topRight':
                        x = canvas.width - logoWidth - 10;
                        y = 10;
                        break;
                    case 'bottomLeft':
                        x = 10;
                        y = canvas.height - logoHeight - 10;
                        break;
                    case 'bottomRight':
                        x = canvas.width - logoWidth - 10;
                        y = canvas.height - logoHeight - 10;
                        break;
                    case 'center':
                        x = (canvas.width - logoWidth) / 2;
                        y = (canvas.height - logoHeight) / 2;
                        break;
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

  const handleWidthChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    setWidthStr(digits);
    const num = parseInt(digits, 10);
    if (!isNaN(num) && num >= 1 && num <= 8000) {
      setOutputWidth(num);
    }
  };

  const handleHeightChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    setHeightStr(digits);
    const num = parseInt(digits, 10);
    if (!isNaN(num) && num >= 1 && num <= 8000) {
      setOutputHeight(num);
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
            {/* PDF Uploader */}
            <div>
              <label className="text-lg font-semibold mb-2 block">1. Upload PDF</label>
              <div 
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                {pdfFile ? (
                  <div className="text-center">
                    <p className="font-semibold text-indigo-400">{pdfName}</p>
                    <span className="text-sm text-gray-400">{totalPages} pages</span>
                  </div>
                ) : (
                  <p className="text-gray-400">Click to upload or drag & drop</p>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
            </div>

            {/* Logo Uploader */}
            <div>
              <label className="text-lg font-semibold mb-2 block">2. Add Logo (Optional)</label>
               <div 
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => logoInputRef.current?.click()}
              >
                <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                {logoFile ? (
                    <div className="text-center">
                      <p className="font-semibold text-indigo-400">{logoName}</p>
                      <button onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoName(''); }} className="text-xs text-red-400 hover:text-red-300 mt-1">Remove</button>
                    </div>
                ) : (
                  <p className="text-gray-400">Click to upload logo</p>
                )}
              </div>
              <input type="file" ref={logoInputRef} onChange={handleLogoChange} className="hidden" accept="image/*" />
            </div>

            {/* Logo Position */}
            {logoFile && (
              <div>
                <label className="text-lg font-semibold mb-2 block">3. Logo Position</label>
                <div className="grid grid-cols-3 gap-2 bg-gray-700 p-2 rounded-lg">
                  <button onClick={() => setLogoPosition('topLeft')} className={`p-2 rounded-md ${logoPosition === 'topLeft' ? 'bg-indigo-500' : 'hover:bg-gray-600'}`}><CornerUpLeft/></button>
                  <button disabled className="p-2"></button>
                  <button onClick={() => setLogoPosition('topRight')} className={`p-2 rounded-md ${logoPosition === 'topRight' ? 'bg-indigo-500' : 'hover:bg-gray-600'}`}><CornerUpRight/></button>
                  <button disabled className="p-2"></button>
                  <button onClick={() => setLogoPosition('center')} className={`p-2 rounded-md flex justify-center items-center ${logoPosition === 'center' ? 'bg-indigo-500' : 'hover:bg-gray-600'}`}><Droplets size={20}/></button>
                  <button disabled className="p-2"></button>
                  <button onClick={() => setLogoPosition('bottomLeft')} className={`p-2 rounded-md ${logoPosition === 'bottomLeft' ? 'bg-indigo-500' : 'hover:bg-gray-600'}`}><CornerDownLeft/></button>
                  <button disabled className="p-2"></button>
                  <button onClick={() => setLogoPosition('bottomRight')} className={`p-2 rounded-md ${logoPosition === 'bottomRight' ? 'bg-indigo-500' : 'hover:bg-gray-600'}`}><CornerDownRight/></button>
                </div>
                {logoPosition === 'center' && (
                  <div className="mt-4">
                    <label htmlFor="opacity" className="block text-sm font-medium text-gray-300">Logo Opacity</label>
                    <input type="range" id="opacity" min="0.1" max="1" step="0.1" value={logoOpacity} onChange={e => setLogoOpacity(parseFloat(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                    <div className="text-center text-sm text-gray-400 mt-1">{Math.round(logoOpacity * 100)}%</div>
                  </div>
                )}
              </div>
            )}
            
            {/* Page Selection */}
            {totalPages > 0 && (
                <div>
                  <label className="text-lg font-semibold mb-2 block">
                    {logoFile ? '4.' : '3.'} Select Pages ({selectedPages.length}/{totalPages})
                  </label>
                  <div className="max-h-32 overflow-y-auto grid grid-cols-4 gap-2 p-2 bg-gray-700 rounded-lg">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button 
                        key={pageNum}
                        onClick={() => togglePageSelection(pageNum)}
                        className={`p-2 rounded-md text-sm ${selectedPages.includes(pageNum) ? 'bg-indigo-500 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                </div>
            )}

            <div>
              <label className="text-lg font-semibold mb-2 block">
                Output Resolution
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">Width (px)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={widthStr}
                    onKeyDown={(e) => {
                      if (['-', '+', '.', 'e', 'E'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={e => handleWidthChange(e.target.value)}
                    onBlur={() => {
                      const num = parseInt(widthStr, 10);
                      const clamped = (!widthStr || isNaN(num) || num < 1)
                        ? 1080
                        : Math.min(num, 8000);
                      setWidthStr(String(clamped));
                      setOutputWidth(clamped);
                    }}
                    placeholder="1080"
                    className="w-full bg-gray-700 border border-gray-600 text-white
                               rounded-lg px-3 py-2 text-sm focus:outline-none
                               focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-gray-400 mt-5">×</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">Height (px)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={heightStr}
                    onKeyDown={(e) => {
                      if (['-', '+', '.', 'e', 'E'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={e => handleHeightChange(e.target.value)}
                    onBlur={() => {
                      const num = parseInt(heightStr, 10);
                      const clamped = (!heightStr || isNaN(num) || num < 1)
                        ? 1080
                        : Math.min(num, 8000);
                      setHeightStr(String(clamped));
                      setOutputHeight(clamped);
                    }}
                    placeholder="1080"
                    className="w-full bg-gray-700 border border-gray-600 text-white
                               rounded-lg px-3 py-2 text-sm focus:outline-none
                               focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Min: 1px · Max: 8000px</p>
            </div>
            
            {/* Process Button */}
            <button
              onClick={processPdf}
              disabled={!pdfFile || isProcessing || selectedPages.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isProcessing ? 'Processing...' : 'Generate Images'}
            </button>
          </div>

          {/* Right Column: Preview */}
          <div className="bg-gray-900 p-4 rounded-lg h-full min-h-[400px] flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-center">Generated Images</h2>
            {generatedImages.length > 0 && (
              <div className="flex items-center justify-between mb-2">
                 <p className="text-sm text-gray-400">Showing {generatedImages.length} image{generatedImages.length > 1 ? 's' : ''}</p>
                 <button onClick={downloadAllAsZip} className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-lg transition-colors">
                  <Download size={16} />
                  Download All (.zip)
                </button>
              </div>
            )}
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
              {generatedImages.map((imgSrc, index) => (
                <div key={index} className="relative group">
                  <img src={imgSrc} alt={`Generated Page ${selectedPages[index]}`} className="w-full h-auto rounded-md" />
                   <a 
                      href={imgSrc} 
                      download={`page_${selectedPages[index]}.png`} 
                      className="absolute bottom-2 right-2 bg-indigo-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download size={18} />
                    </a>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div>
                </div>
              )}
               {!isProcessing && generatedImages.length === 0 && (
                 <div className="flex flex-col justify-center items-center h-full text-center text-gray-500">
                    <ImageIcon size={48} className="mb-2"/>
                    <p>Your generated images will appear here.</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
