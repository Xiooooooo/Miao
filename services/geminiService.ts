import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategoryItem } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:audio/webm;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper to format categories for AI context
const getCategoryContext = (categories?: { expense: CategoryItem[]; income: CategoryItem[] }) => {
    if (!categories) return "";
    
    let context = "You MUST categorize the transaction into one of the following existing categories if applicable:\n";
    
    context += "--- EXPENSE CATEGORIES ---\n";
    categories.expense.forEach(c => {
        const subs = c.children?.map(s => s.name).join(', ');
        context += `Main: "${c.name}"${subs ? ` | Sub-options: [${subs}]` : ''}\n`;
    });
    
    context += "--- INCOME CATEGORIES ---\n";
    categories.income.forEach(c => {
         const subs = c.children?.map(s => s.name).join(', ');
        context += `Main: "${c.name}"${subs ? ` | Sub-options: [${subs}]` : ''}\n`;
    });
    
    return context;
};

// Parse natural language input into a structured transaction
export const parseTransactionInput = async (input: string, categories?: { expense: CategoryItem[]; income: CategoryItem[] }): Promise<any> => {
  const ai = getAIClient();
  if (!ai) throw new Error("API Key not found");

  const today = new Date().toISOString();
  const categoryContext = getCategoryContext(categories);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Current datetime: ${today}. Parse the following finance log into structured data: "${input}". 
      
      ${categoryContext}

      Rules:
      1. If the year is missing, assume current year.
      2. If exact date missing, use closest logical past date or today.
      3. If time is not specified, use current time.
      4. CATEGORIZATION:
         - Compare input with the "EXPENSE CATEGORIES" and "INCOME CATEGORIES" list provided above.
         - If the input matches a Sub-option (e.g. input "Hotpot" matches Sub-option "火锅"), set 'category' to the Main category (e.g. "餐饮") and 'subCategory' to the Sub-option (e.g. "火锅").
         - If no exact Sub-option match, pick the most logically relevant Main category.
         - Only use a new category name if it completely fails to fit any existing ones.
      5. NOTE field:
         - Extract the description of the item or activity as the 'note' (e.g. "Lunch with Tom", "Taxi home").
         - Do not repeat the date or amount in the note.
      
      Output JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "The numeric monetary value." },
            type: { type: Type.STRING, enum: ["income", "expense"] },
            category: { type: Type.STRING, description: "Main category name." },
            subCategory: { type: Type.STRING, description: "Specific sub-item name. Optional." },
            date: { type: Type.STRING, description: "ISO 8601 date format YYYY-MM-DDTHH:mm:ss" },
            note: { type: Type.STRING, description: "Brief description of the transaction." },
          },
          required: ["amount", "type", "category", "date", "note"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};

// Parse voice audio into structured transaction
export const parseVoiceTransaction = async (audioBlob: Blob, categories?: { expense: CategoryItem[]; income: CategoryItem[] }): Promise<any> => {
  const ai = getAIClient();
  if (!ai) throw new Error("API Key not found");

  const today = new Date().toISOString();
  const base64Audio = await blobToBase64(audioBlob);
  const categoryContext = getCategoryContext(categories);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type || "audio/webm",
              data: base64Audio
            }
          },
          {
            text: `Current datetime: ${today}. Listen to this audio and parse the finance log into structured JSON.
            
            ${categoryContext}

            Rules:
            1. If exact date missing, use closest logical past date or today.
            2. CATEGORIZATION: Strictly try to match the provided Main Categories and Sub-options.
               - Map specific items to their defined Sub-options if available.
            3. NOTE: Extract a brief description for the 'note' field.
            4. Ignore filler words.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "The numeric monetary value." },
            type: { type: Type.STRING, enum: ["income", "expense"] },
            category: { type: Type.STRING, description: "Main category name." },
            subCategory: { type: Type.STRING, description: "Specific sub-item name. Optional." },
            date: { type: Type.STRING, description: "ISO 8601 date format YYYY-MM-DDTHH:mm:ss" },
            note: { type: Type.STRING, description: "Brief description." },
          },
          required: ["amount", "type", "category", "date", "note"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini Voice Parse Error:", error);
    throw error;
  }
};

// Generate financial insights based on transaction history
export const getFinancialInsights = async (transactions: Transaction[], question?: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "API Key missing. Cannot generate insights.";

  // Simplify data to save tokens but keep relevant info for Q&A
  // Gemini Flash has a huge context window, so we can pass a lot of data.
  // We prioritize recent 500 transactions which covers most use cases.
  const simplifiedData = transactions
    .slice(0, 500) 
    .map(t => ({
      d: t.date.replace('T', ' '), // Date Time
      a: t.amount, // Amount
      t: t.type === 'expense' ? 'out' : 'in', // Type
      c: t.category, // Category
      s: t.subCategory || '', // Sub Category
      n: t.note || '', // Note
      l: t.ledgerId // Ledger
    }));

  const today = new Date();
  const todayStr = today.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const systemContext = `
    You are a personal financial AI assistant for the app "Miao记账".
    Current Date: ${today.toISOString()} (${todayStr}).
    
    Data Format (JSON Array): 
    d: Date, a: Amount, t: Type (in/out), c: Category, s: SubCategory, n: Note.

    Your Goal:
    Answer the user's specific question about their spending history accurately.
    - If asked "How much did I spend on [Date]?", calculate the sum of 'out' transactions for that day.
    - If asked "When did I buy [Item]?", find the record matching the note or category.
    - If asked "How much for [Category] last month?", filter and sum.
    - If no specific question is asked, give a brief, friendly insight or savings tip.

    Tone: Cute, helpful, concise. Use emojis.
    Language: Simplified Chinese (简体中文).
  `;

  const prompt = question 
    ? `Transaction Data: ${JSON.stringify(simplifiedData)}\n\nUser Question: "${question}"`
    : `Transaction Data: ${JSON.stringify(simplifiedData)}\n\nAnalyze my recent spending patterns and give me one cute and specific tip.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemContext,
      }
    });
    return response.text || "喵？大脑暂时短路了，请稍后再试～";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "网络开小差了，暂时无法分析您的账单哦 😿";
  }
};