
import { GoogleGenAI, Type } from "@google/genai";
import * as pdfjs from "pdfjs-dist";
import { Transaction } from "../types";

// Set up the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: base64EncodedData, mimeType: file.type },
  };
};

const pdfToGenerativeParts = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument(arrayBuffer).promise;
  const numPages = pdf.numPages;
  const imageParts = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
        await page.render({ canvas, canvasContext: context, viewport: viewport }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg");
        imageParts.push({
            inlineData: {
                data: dataUrl.split(",")[1],
                mimeType: "image/jpeg",
            },
        });
    }
  }
  return imageParts;
};

const transactionSchema = {
    type: Type.OBJECT,
    properties: {
        Date: { type: Type.STRING, description: 'Transaction date in YYYY-MM-DD format.' },
        Description: { type: Type.STRING, description: 'A concise description of the transaction.' },
        Amount: { type: Type.NUMBER, description: 'Transaction amount. Negative for expenses, positive for deposits.' },
        Category: { type: Type.STRING, description: 'Auto-detected category (e.g., Groceries, Dining, Salary).' },
        Notes: { type: Type.STRING, description: 'Any relevant details about the transaction.' },
    },
    required: ['Date', 'Description', 'Amount', 'Category']
};

export const verifyUserIdentity = async (referenceImageBase64: string, currentImageBase64: string): Promise<boolean> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = "You are a biometric security system. Compare the person in the first image (Reference) with the person in the second image (Live Feed). Determine if they are the same person. Ignore background differences, lighting, or minor accessories (glasses). Strictness: High. Return a JSON object with a single boolean field 'match' set to true only if they are the same person.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: 'image/jpeg', data: referenceImageBase64 } },
                    { inlineData: { mimeType: 'image/jpeg', data: currentImageBase64 } }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        match: { type: Type.BOOLEAN }
                    },
                    required: ['match']
                }
            }
        });

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.match === true;
    } catch (error) {
        console.error("Face verification failed:", error);
        return false;
    }
};

export const analyzeStatements = async (
  statementFiles: File[],
  onProgress: (processedCount: number, total: number, status: string) => void
): Promise<Transaction[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
  
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const totalFiles = statementFiles.length;
    let processedCount = 0;
    const allFileParts = [];

    for (const statementFile of statementFiles) {
      onProgress(processedCount, totalFiles, `Preparing ${statementFile.name}...`);
      if (statementFile.type === "application/pdf") {
        const pdfParts = await pdfToGenerativeParts(statementFile);
        allFileParts.push(...pdfParts);
      } else if (statementFile.type.startsWith("image/")) {
        const imagePart = await fileToGenerativePart(statementFile);
        allFileParts.push(imagePart);
      } else {
        console.warn(`Unsupported file type: ${statementFile.type}. Skipping file: ${statementFile.name}`);
      }
      processedCount++;
    }

    if (allFileParts.length === 0) {
      throw new Error("No valid files to process. Please upload supported file types (PDF, PNG, JPG).");
    }

    onProgress(processedCount, totalFiles, `Analyzing with Gemini...`);

    const prompt = `You are an expert financial analyst. Analyze the provided bank statement image(s). These images may represent multiple pages of a single statement or multiple statements. Extract every single transaction across all images. For each transaction, determine the date, a concise description, the amount (use a negative sign for debits/expenses and a positive sign for credits/deposits), and categorize it (e.g., Groceries, Dining, Transport, Salary, Bills, Shopping, Entertainment, Other). Provide any relevant details in a 'Notes' field. Ignore all non-transactional information like headers, footers, summaries, and promotional text. Ensure the date is in YYYY-MM-DD format. Provide the output as a JSON object with a single key 'transactions' which is an array of all transaction objects found, adhering to the provided schema.`;
    
    const contents = {
        parts: [
            { text: prompt },
            ...allFileParts,
        ]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    transactions: {
                        type: Type.ARRAY,
                        items: transactionSchema,
                    }
                },
                required: ['transactions']
            }
        }
    });
    
    onProgress(totalFiles, totalFiles, "Finalizing results...");

    try {
        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse.transactions && Array.isArray(jsonResponse.transactions)) {
            const sortedTransactions = (jsonResponse.transactions as Transaction[]).sort((a, b) => {
                const dateA = new Date(a.Date).getTime();
                const dateB = new Date(b.Date).getTime();
                if (isNaN(dateA) || isNaN(dateB)) return 0;
                return dateA - dateB;
            });
            return sortedTransactions;
        } else {
            throw new Error("Invalid JSON structure in API response.");
        }
    } catch (e) {
        console.error("Failed to parse Gemini response:", response.text);
        throw new Error("Could not process the statement. The AI response was not in the expected format.");
    }
};
