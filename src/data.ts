export const roadmapData = [
  {
    phase: 1,
    title: "Narrativa y Guion",
    description: "Arquitectura de la historia y guion estructurado.",
    tools: [
      {
        name: "Google Gemini 3.1 Pro",
        specialty: "Contexto estructurado y masivo (2M tokens). Ideal para procesar libros enteros o analizar videos extensos para extraer estructuras.",
        icon: "BrainCircuit"
      },
      {
        name: "Claude 4.6 Sonnet",
        specialty: "Escritura creativa matizada. La mejor opción para arcos de personajes y diálogos naturales sin el 'tono IA'.",
        icon: "Feather"
      },
      {
        name: "Team-GPT",
        specialty: "Prompt Builder y colaboración en equipo en tiempo real.",
        icon: "Users"
      }
    ]
  },
  {
    phase: 2,
    title: "Previsualización y Storyboarding",
    description: "Visualización temprana de la narrativa.",
    tools: [
      {
        name: "Drawstory",
        specialty: "Flujo Cero Prompts: Sube el guion directamente. Respeta encuadres, tipos de plano y reglas cinemáticas. Modo Sketch para evitar confusión del cliente con fotorrealismo temprano.",
        icon: "PenTool"
      },
      {
        name: "LTX Studio / Pelican",
        specialty: "Alta consistencia, uso de cinemática de paneo.",
        icon: "Video"
      },
      {
        name: "Boords",
        specialty: "Software tradicional, automatización IA limitada.",
        icon: "Layout"
      }
    ]
  },
  {
    phase: 3,
    title: "Generación de Activos (Imágenes Base)",
    description: "Creación de imágenes base para el video.",
    tools: [
      {
        name: "Nano Banana Pro (vía Gemini)",
        specialty: "Fotorrealismo extremo y seguimiento estricto de prompts complejos.",
        icon: "Image"
      },
      {
        name: "Ideogram",
        specialty: "Dominio absoluto de la tipografía perfecta para títulos y carteles.",
        icon: "Type"
      },
      {
        name: "Midjourney v7",
        specialty: "Estética artística superior y comprensión cinemática.",
        icon: "Palette"
      },
      {
        name: "Leonardo.ai",
        specialty: "Control técnico mediante 'Image Guidance' para moodboards coherentes.",
        icon: "Sliders"
      }
    ]
  },
  {
    phase: 4,
    title: "Producción de Audio y Música",
    description: "Voces, clonación y composición musical generativa.",
    tools: [
      {
        name: "ElevenLabs",
        specialty: "El Estándar: Realismo puro, 70+ idiomas, clonación instantánea. Pro Tip: Graba tu guion > Text-to-Speech > Descarga MP3 > Sincroniza en el editor.",
        icon: "Mic"
      },
      {
        name: "Suno v5",
        specialty: "Pistas completas (voz + instrumentos). Acuerdo con Warner Music Group (evita problemas de Content ID).",
        icon: "Music"
      },
      {
        name: "Udio",
        specialty: "Calidad de estudio/radio. Ideal para pistas de alta fidelidad y stems editables.",
        icon: "Headphones"
      }
    ]
  },
  {
    phase: 5,
    title: "El Motor de Video",
    description: "El campo de batalla 2026 para generación de video.",
    tools: [
      {
        name: "Kling AI 3.0",
        specialty: "Consistencia. Resolución Nativa 4K. Elements 3.0 para bloquear personajes. Audio Nativo Referenciado.",
        icon: "Film"
      },
      {
        name: "Sora 2",
        specialty: "Tomas largas. Alta Accesibilidad.",
        icon: "Video"
      },
      {
        name: "Seedance 2.0",
        specialty: "Coherencia Multi-toma (2K). Audio Nativo Dual. Restringida (Bloqueo Regional).",
        icon: "Globe"
      },
      {
        name: "GlobalGPT",
        specialty: "Plataforma unificada que permite el bypass regional para acceder a Seedance 2.0, Sora 2 Pro y Veo 3.1.",
        icon: "Unlock"
      }
    ]
  },
  {
    phase: 6,
    title: "Post-producción y Edición",
    description: "Edición conversacional y post-producción.",
    tools: [
      {
        name: "Descript",
        specialty: "Edición basada en transcripción. Borrar una palabra del texto corta el video automáticamente. Función 'Studio Sound'.",
        icon: "Scissors"
      },
      {
        name: "CapCut AI",
        specialty: "El rey del formato corto. Subtítulos dinámicos automáticos y efectos visuales sin marcas de agua.",
        icon: "Smartphone"
      },
      {
        name: "Adobe Firefly Video",
        specialty: "Edición generativa segura. Modelos entrenados 100% con contenido licenciado, garantizando seguridad IP comercial.",
        icon: "ShieldCheck"
      }
    ]
  },
  {
    phase: 7,
    title: "Upscaling y Optimización",
    description: "Mejora de calidad y resolución.",
    tools: [
      {
        name: "Magnific AI / Pixelbin",
        specialty: "Nube (Cloud AI). Añade detalle hiperrealista y corrige texturas faciales. Costoso por imagen/video.",
        icon: "Cloud"
      },
      {
        name: "Video2X",
        specialty: "Local (Open Source). 100% Gratis. Escala videos a 4K/8K usando modelos como Real-ESRGAN. Requiere hardware local potente.",
        icon: "Monitor"
      }
    ]
  },
  {
    phase: 8,
    title: "Distribución y Localización",
    description: "Distribución global y traducción.",
    tools: [
      {
        name: "Rask AI",
        specialty: "Soporte para 130+ idiomas. VoiceClone mantiene la personalidad. Lip-Sync sincroniza los movimientos de la boca.",
        icon: "Languages"
      },
      {
        name: "CanvaTranslator",
        specialty: "Alternativa rápida para clips cortos de redes sociales (hasta 1 min).",
        icon: "Share2"
      }
    ]
  }
];

export const zeroCostWorkflow = [
  { step: "Guion", tool: "Gemini 3.1 Pro (Starter Plan)" },
  { step: "Storyboard", tool: "Drawstory" },
  { step: "Assets/Imágenes", tool: "Leonardo.ai (150 tokens)" },
  { step: "Música", tool: "Suno v5 (50 créditos)" },
  { step: "Video", tool: "Kling AI 3.0 (66 créditos)" },
  { step: "Edición & Subtítulos", tool: "CapCut AI / Descript" },
  { step: "Localización", tool: "Rask AI (Prueba)" }
];
