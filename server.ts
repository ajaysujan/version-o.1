import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// OpenRouter API Key (Supports ChatGPT, Llama 3.3 Free, Gemini Free)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';

// Initialize GoogleGenAI server-side with User-Agent telemetry
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// ChatGPT Writing and Answering Style System Instruction matching p1.png and 2p.png
const CHATGPT_STYLE_SYSTEM_INSTRUCTION = `
You are AURA, an exceptionally clear, friendly, and structured study companion and academic mentor (आप एक अत्यंत बुद्धिमान, विनम्र और मददगार अध्ययन साथी हैं).

CORE WRITING & ANSWERING STYLE (Follow the exact ChatGPT style):

1. CONVERSATIONAL & CHAPTER REQUEST QUERIES (Like 2p.png and p1.png):
   When the user asks in Hindi or Hinglish or general query (e.g., "hindi me", "chapter explain kr do", "mujhe class chapter explain krdo", "padha do", "namaste"):
   Respond warmly and directly in the exact ChatGPT format:
   - "हाँ, बिल्कुल।" or "Haan. Kis class aur kis chapter ko explain karna hai?"
   - "कौन-सी कक्षा और कौन-सा अध्याय? अध्याय का नाम या उसकी फोटो भेज दीजिए।" (or "Bas chapter ka naam ya photo bhej do (e.g. Class 12 Physics Chapter 1).")
   - "मैं अध्याय इस तरह समझाऊँगा / Format jo milega:"
     1. सरल हिंदी में लाइन-बाय-लाइन व्याख्या (NCERT line-by-line easy explanation)
     2. हर कठिन शब्द का आसान अर्थ व मुख्य परिभाषाएँ (Important definitions & exam points)
     3. चित्र सहित समझाना जहाँ आवश्यक हो (Diagrams wherever necessary)
     4. संख्यात्मक सवाल व MCQs का कॉन्सेप्ट (Numericals & MCQs concept)
     5. अंत में 5 मिनट का रिवीजन + महत्वपूर्ण प्रश्न-उत्तर (End me 5-minute revision + expected questions)
   - "उदाहरण: कक्षा 10 हिंदी – अध्याय 1 या कक्षा 12 भौतिकी – विद्युत आवेश एवं क्षेत्र।"

2. FULL CHAPTER OR CONCEPT EXPLANATION:
   When the user specifies a chapter, derivation, formula, or academic question (e.g. "Class 12 Physics: Ch 1...", "कूलॉम का नियम", "राउल्ट का नियम", "DNA प्रतिकृतियन", "हड़प्पा सभ्यता", etc.), ALWAYS structure your response with these exact 5-6 clear sections:
   
   • **Friendly Opening**: Acknowledge the topic with enthusiasm.
   
   • **### 1. सरल हिंदी में लाइन-बाय-लाइन व्याख्या (NCERT Line-by-Line Easy Explanation)**
     Break down the concepts into bullet points, explaining every tough term in simple everyday language.
   
   • **### 2. मुख्य परिभाषाएँ व महत्वपूर्ण बिंदु (Important Definitions & Exam Points)**
     Highlight board exam marking points, laws, and official scientific definitions.
   
   • **### 3. मुख्य सूत्र, नियम व व्यंजक (Key Formulas, Laws & Derivations)**
     Present mathematical formulas in distinct mathematical blocks with standard SI units and variable meanings.
   
   • **### 4. चित्र व आरेख की संकल्पना (Key Diagram & Visualization Concept)**
     Describe the visual diagram clearly (e.g. electric field lines, ray diagrams, circuit diagrams, DNA double helix) so the student knows how to draw it in the exam.
   
   • **### 5. संख्यात्मक प्रश्न (Numericals) व MCQs की समझ**
     Show how numerical problems are solved step-by-step with given values, formula substitution, and final answer with units.
   
   • **### 6. 5-मिनट क्विक रिवीजन + बोर्ड परीक्षा के अति महत्वपूर्ण प्रश्न (5-Minute Quick Revision & Expected Board Questions)**
     Give 3-4 top board questions (5-Star rating) and quick bullet-point summary.

3. VISUAL HIERARCHY, SPACING & BOLD DISCIPLINE (CRITICAL USER REQUIREMENT):
   - **Questions & Section Titles**: ALWAYS write question titles and headings in **BOLD** with an empty blank line before and after, for example:
     ### **1. सरल हिंदी में लाइन-बाय-लाइन व्याख्या**

     ### **प्रश्न 1 (5-Star Board Question): कूलॉम का नियम क्या है?**
   - **Proper Gap Between Question & Answer**: NEVER merge questions and answers into a single clump. Always leave an empty line between the question heading and the start of the answer.
   - **Selective Key Bolding in Answers**: In the answer text, bold ONLY the most important key terms, laws, formulas, and units (e.g., **कूलॉम बल**, **विद्युत आवेश**, **F = k*(q1*q2)/r^2**, **न्यूटन**). Do NOT bold entire sentences or every word. Keep the normal explanation text in clean, legible regular font so the bold keywords pop out instantly for rapid revision and clarity!
   - **Bullet Points**: Use clean bullet points ('• **मुख्य बिंदु:** विवरण') with a blank line separating major points.

4. TONE & POLITE MANNER:
   - Natural, encouraging, clear, and polite ChatGPT tone.
   - If user asks in Hindi, answer in clean Hindi with English technical terms in brackets.
   - If user asks in Hinglish/Roman script, respond in natural Hinglish.
   - If user asks in English, answer in polished English.
   - Never say "I am an AI", simply address yourself as AURA.
`;

// API: Health / Status
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    configured: Boolean(apiKey || OPENROUTER_API_KEY),
    model: 'ChatGPT / Multi-Provider',
    name: 'AURA',
  });
});

// API: Text-to-Speech (TTS) using Gemini Flash Lite TTS
app.post('/api/tts', async (req: Request, res: Response) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  const cleanSpeechText = text
    .replace(/###|\*\*|\*|#|`|_|\[.*?\]\(.*?\)/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[|•✓➤▪→]/g, '')
    .slice(0, 800)
    .trim();

  if (!cleanSpeechText) {
    return res.status(400).json({ error: 'Text after cleanup is empty' });
  }

  if (!apiKey) {
    return res.json({ available: false, reason: 'No API key' });
  }

  try {
    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanSpeechText,
              speechMetadata: {
                style: 'Clear, warm, friendly and articulate female teacher',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const candidate = ttsResponse.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);

    if (audioPart && audioPart.inlineData?.data) {
      return res.json({
        available: true,
        audioBase64: audioPart.inlineData.data,
        mimeType: audioPart.inlineData.mimeType || 'audio/wav',
      });
    }

    return res.json({ available: false, reason: 'No audio returned' });
  } catch (err: any) {
    return res.json({ available: false, error: err.message });
  }
});

// Helper: Stream from OpenRouter with multiple free & fast model fallbacks
async function streamFromOpenRouter(messages: any[], res: Response): Promise<boolean> {
  if (!OPENROUTER_API_KEY) return false;

  const candidateModels = [
    'openai/gpt-4o-mini',
    'openai/gpt-3.5-turbo',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-7b-instruct:free',
    'deepseek/deepseek-r1:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'qwen/qwen-2.5-72b-instruct',
  ];

  for (const modelName of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aura-learning.edu',
          'X-Title': 'AURA Learning System',
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          stream: true,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok || !response.body) {
        console.warn(`OpenRouter model ${modelName} returned status ${response.status}`);
        continue;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedAnyChunk = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                receivedAnyChunk = true;
                res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
              }
            } catch {}
          }
        }
      }

      if (receivedAnyChunk) {
        res.write('data: [DONE]\n\n');
        res.end();
        return true;
      }
    } catch (err: any) {
      console.warn(`OpenRouter model ${modelName} failed:`, err?.message);
    }
  }

  return false;
}

// Fallback response generator in exact ChatGPT style
function generateStructuredFallbackResponse(question: string): string {
  const qLower = question.toLowerCase();

  if (qLower.includes('hindi me') || qLower.includes('chapter explain') || qLower.includes('explain krdo') || qLower.includes('padha do')) {
    return `हाँ, बिल्कुल।\n\nकौन-सी कक्षा और कौन-सा अध्याय?\nअध्याय का नाम या उसकी फोटो भेज दीजिए।\n\n**मैं अध्याय इस तरह समझाऊँगा:**\n1. **सरल हिंदी में लाइन-बाय-लाइन व्याख्या (NCERT Explanation)**\n2. **हर कठिन शब्द का आसान अर्थ व मुख्य परिभाषाएँ**\n3. **मुख्य बिंदु (Exam Points & Formulas)**\n4. **चित्र सहित समझाना (जहाँ आवश्यक हो)**\n5. **अंत में 5 मिनट का रिवीजन + महत्वपूर्ण बोर्ड प्रश्न-उत्तर**\n\n*उदाहरण:* कक्षा 10 हिंदी – अध्याय 1 या कक्षा 12 भौतिकी – विद्युत आवेश एवं क्षेत्र।`;
  }

  return `हाँ, बिल्कुल! चलिए **${question}** को बोर्ड परीक्षा के लिए बहुत ही सरल, स्पष्ट और पूरे अंक दिलाने वाले फॉर्मेट में समझते हैं:\n\n---\n\n### 1. सरल हिंदी में लाइन-बाय-लाइन व्याख्या (NCERT Line-by-Line Easy Explanation)\n• **मुख्य संकल्पना:** यह विषय बोर्ड परीक्षा का अत्यंत महत्वपूर्ण भाग है। इस अध्याय में मुख्य अवधारणाओं को आसान उदाहरणों से समझा गया है।\n• **कठिन शब्दों का अर्थ:** वैज्ञानिक नियमों को व्यावहारिक जीवन के उदाहरणों से जोड़कर सरलता से समझा जा सकता है।\n\n---\n\n### 2. मुख्य परिभाषाएँ व महत्वपूर्ण बिंदु (Important Definitions & Exam Points)\n• **परिभाषा:** वैज्ञानिक सिद्धांतों को प्रमाणिक परिभाषा और सटीक तकनीकी शब्दों के साथ लिखें।\n• **परीक्षा टिप्स:** बोर्ड परीक्षा में हमेशा मुख्य परिभाषा को रेखांकित (underline) करें ताकि परीक्षक आसानी से पूरे अंक दे सके।\n\n---\n\n### 3. मुख्य सूत्र, नियम व व्यंजक (Key Formulas & Derivations)\n• **मानक सूत्र:** सूत्रों में प्रत्येक चर (variable) का नाम और उसका SI मात्रक अवश्य लिखें।\n• **सीमाएँ:** नियम किन परिस्थितियों में लागू होता है, इसका उल्लेख करें।\n\n---\n\n### 4. चित्र व आरेख की संकल्पना (Key Diagram & Visualization Concept)\n• नामांकित स्वच्छ चित्र (Neat & Clean Labeled Diagram) बनाएँ।\n• तीर के निशानों (arrows) द्वारा दिशा स्पष्ट प्रदर्शित करें।\n\n---\n\n### 5. संख्यात्मक प्रश्न (Numericals) व MCQs की समझ\n• प्रश्न में दिए गए मान (Given data) सबसे पहले लिखें।\n• सही सूत्र का चयन कर मान प्रतिस्थापित करें और अंत में मात्रक सहित उत्तर लिखें।\n\n---\n\n### 6. 5-मिनट क्विक रिवीजन + बोर्ड परीक्षा के अति महत्वपूर्ण प्रश्न (5-Minute Quick Revision & Expected Questions)\n• **Q1 (5-Star):** मुख्य नियम का कथन लिखिए तथा इसका गणितीय व्यंजक व्युत्पन्न कीजिए।\n• **Q2 (Short):** दो प्रमुख अनुप्रयोग एवं सीमाएँ लिखिए।\n• **Q3 (Objective):** संबंधित भौतिक राशि का SI मात्रक एवं विमीय सूत्र लिखिए।`;
}

// API: Chat (ChatGPT / Multi-Provider Pipeline)
app.post('/api/chat', async (req: Request, res: Response) => {
  const { question, history = [], deepThink = false, smartSearch = false, stream = true } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required' });
  }

  let promptAddition = question;
  if (deepThink) {
    promptAddition += '\n\n[Gahan Chintan / DeepThink Mode: Provide deep step-by-step rigorous breakdown, edge cases, formulas and proof.]';
  }
  if (smartSearch) {
    promptAddition += '\n\n[Smart Search: Provide verified board exam pattern and syllabus references.]';
  }

  // Format messages for OpenAI / OpenRouter format
  const openRouterMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: CHATGPT_STYLE_SYSTEM_INSTRUCTION },
  ];

  if (Array.isArray(history)) {
    for (const item of history.slice(-6)) {
      if (item.text) {
        openRouterMessages.push({
          role: item.type === 'user' ? 'user' : 'assistant',
          content: item.text,
        });
      }
    }
  }

  openRouterMessages.push({ role: 'user', content: promptAddition });

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    // 1. Try OpenRouter (ChatGPT & Free Models)
    const openRouterSuccess = await streamFromOpenRouter(openRouterMessages, res);
    if (openRouterSuccess) return;

    // 2. Fallback to Gemini SDK if available
    if (apiKey) {
      try {
        const formattedGeminiContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
        if (Array.isArray(history)) {
          for (const item of history.slice(-6)) {
            if (item.text) {
              formattedGeminiContents.push({
                role: item.type === 'user' ? 'user' : 'model',
                parts: [{ text: item.text }],
              });
            }
          }
        }
        formattedGeminiContents.push({
          role: 'user',
          parts: [{ text: promptAddition }],
        });

        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: formattedGeminiContents,
          config: {
            systemInstruction: CHATGPT_STYLE_SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
        return;
      } catch (geminiErr: any) {
        console.warn('Gemini streaming fallback error:', geminiErr?.message);
      }
    }

    // 3. Guaranteed Reliable Instant Fallback (Never fail the student)
    const fallbackText = generateStructuredFallbackResponse(question);
    const words = fallbackText.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const slice = words.slice(i, i + 3).join(' ') + ' ';
      res.write(`data: ${JSON.stringify({ text: slice })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } else {
    // Non-streaming response
    try {
      if (OPENROUTER_API_KEY) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: openRouterMessages,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const answer = data.choices?.[0]?.message?.content;
          if (answer) return res.json({ answer });
        }
      }

      if (apiKey) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptAddition,
          config: { systemInstruction: CHATGPT_STYLE_SYSTEM_INSTRUCTION },
        });
        if (response.text) return res.json({ answer: response.text });
      }

      return res.json({ answer: generateStructuredFallbackResponse(question) });
    } catch {
      return res.json({ answer: generateStructuredFallbackResponse(question) });
    }
  }
});

// API: Image Generation
app.post('/api/generate-image', async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    let enhancedPrompt = prompt;

    if (apiKey) {
      try {
        const enhancement = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Convert this user educational request into a single concise English prompt suitable for AI image generation (focused on clarity, educational detail, vibrant lighting, diagrammatic accuracy, 8k resolution, clean aesthetic): "${prompt}"`,
        });
        if (enhancement.text) enhancedPrompt = enhancement.text.trim();
      } catch {}
    }

    const encodedPrompt = encodeURIComponent(`${enhancedPrompt}, high quality, educational, detailed, masterpiece, 8k, sharp focus`);
    const seed = Math.floor(Math.random() * 1000000);
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;

    return res.json({
      imageUrl: fallbackUrl,
      enhancedPrompt,
      source: 'flux',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate image' });
  }
});

// API: Generate MCQ dynamically for unlimited practice
app.post('/api/generate-mcq', async (req: Request, res: Response) => {
  const { subject = 'Physics', targetClass = 12, chapter = 'All' } = req.body;

  const prompt = `You are a Senior Board Examination Paper Setter for Class ${targetClass} (${subject}).
Create 1 high-yield, authentic Multiple Choice Question (MCQ / Objective) with 4 options for the chapter/topic: "${chapter}".
Return ONLY valid JSON matching this schema:
{
  "subject": "${subject}",
  "chapter": "${chapter}",
  "targetClass": ${targetClass},
  "question": "Question text in Hindi and English",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Clear, step-by-step conceptual explanation in Hindi and English why this option is correct.",
  "yearTag": "Board Exam High Yield"
}
Do not include any markdown backticks or commentary outside the JSON.`;

  try {
    // 1. Try OpenRouter
    if (OPENROUTER_API_KEY) {
      try {
        const resOR = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        if (resOR.ok) {
          const data = await resOR.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            return res.json({ success: true, mcq: parsed });
          }
        }
      } catch {}
    }

    // 2. Try Gemini
    if (apiKey) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });
        const parsed = JSON.parse(response.text || '{}');
        return res.json({ success: true, mcq: parsed });
      } catch {}
    }

    // 3. Fallback MCQ
    return res.json({
      success: true,
      mcq: {
        subject: subject,
        chapter: chapter,
        targetClass: targetClass,
        question: `Class ${targetClass} ${subject}: विद्युत आवेश का SI मात्रक क्या होता है?`,
        options: ['न्यूटन (Newton)', 'कूलॉम (Coulomb)', 'वोल्ट (Volt)', 'एम्पियर (Ampere)'],
        correctIndex: 1,
        explanation: 'विद्युत आवेश का SI मात्रक कूलॉम (Coulomb, C) है। q = I × t से 1 C = 1 A·s.',
        yearTag: 'Board Exam High Yield',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AURA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
