// import { createWorker } from 'tesseract.js';
// import Ticket from '../models/Ticket.js';

// export const scanAndSaveTicket = async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ message: "No image uploaded" });

//         // 1. Initialize Tesseract Worker
//         const worker = await createWorker('eng'); // 'eng' for English
        
//         // 2. Perform OCR on the image buffer
//         const { data: { text } } = await worker.recognize(req.file.buffer);
//         await worker.terminate();

//         console.log("Raw Scanned Text:", text);

//         // 3. Simple Logic to "Extract" Data (Regex)
//         // This looks for something like $ or £ followed by numbers
//         const priceMatch = text.match(/[$£€]\s?\d+[.,]\d{2}/);
//         // This looks for common date patterns (DD/MM/YYYY or YYYY-MM-DD)
//         const dateMatch = text.match(/\d{2}[/-]\d{2}[/-]\d{4}/) || text.match(/\d{4}[/-]\d{2}[/-]\d{2}/);

//         const ticketData = {
//             price: priceMatch ? priceMatch[0] : "Not found",
//             date: dateMatch ? dateMatch[0] : "Not found",
//             distance: "Manual check needed", // Tesseract struggles with context like "distance"
//             rawText: text // Keep this so you can see what it missed
//         };

//         // 4. Save to MongoDB
//         const newTicket = await Ticket.create(ticketData);
        
//         res.status(201).json(newTicket);
//     } catch (error) {
//         console.error("Tesseract Error:", error);
//         res.status(500).json({ error: "Failed to read image" });
//     }
// };


// import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
// import Ticket from '../models/Ticket.js';

// export const scanAndSaveTicket = async (req, res) => {
//     // 1. Initialize inside the function for fresh .env access
//     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//     try {
//         if (!req.file) return res.status(400).json({ message: "No image uploaded" });

//         // 2. Configure model for native JSON output
//         const model = genAI.getGenerativeModel({ 
//             model: "gemini-1.5-flash", // Use the stable 2.0 version
//             generationConfig: {
//                 responseMimeType: "application/json", // Force valid JSON response
//             }
//         });

//         const imageParts = [{
//             inlineData: { 
//                 data: req.file.buffer.toString("base64"), 
//                 mimeType: req.file.mimetype 
//             }
//         }];

//         // 3. Simplified prompt - no need for "ONLY JSON" instructions
//         const prompt = "Extract Price, Date, and Distance from this bus ticket.";

//         const result = await model.generateContent([prompt, ...imageParts]);
//         const response = await result.response;
        
//         // 4. No more regex! 2.0-flash returns clean JSON directly
//         const ticketData = JSON.parse(response.text());

//         // 5. Save to MongoDB
//         const newTicket = await Ticket.create(ticketData);
        
//         res.status(201).json(newTicket);
//     } catch (error) {
//         console.error("Scanning Error:", error);
//         res.status(500).json({ error: error.message });
//     }
// };


import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import Ticket from "../models/Ticket.js";

let isProcessing = false; // 🔒 prevent duplicate scans

export const scanAndSaveTicket = async (req, res) => {
  if (isProcessing) {
    return res.status(429).json({ message: "Scan already in progress" });
  }

  isProcessing = true;

  try {
    if (!req.file) {
      isProcessing = false;
      return res.status(400).json({ message: "No image uploaded" });
    }

    // 1️⃣ Resize image (THIS SAVES YOUR FREE TIER)
    const resizedImage = await sharp(req.file.buffer)
      .resize({ width: 900 }) // perfect for tickets
      .jpeg({ quality: 80 })
      .toBuffer();

    // 2️⃣ Init Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2, // more accurate, less creative
      },
    });

    // 3️⃣ Tight prompt (cheap tokens)
    const prompt = `
Extract the following from this bus ticket image:
- price (number)
- date (YYYY-MM-DD)
- origin (city name)
- destination (city name)
- distance (number in km)

Note: If the distance is '000' or missing on the ticket, use your knowledge to estimate the road distance between the extracted origin and destination city.

Return ONLY valid JSON.
`;

    const imageParts = [
      {
        inlineData: {
          data: resizedImage.toString("base64"),
          mimeType: "image/jpeg",
        },
      },
    ];

    // 4️⃣ ONE Gemini call. No retries.
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;

    // Change this line:
//const ticketData = JSON.parse(response.text());

// To this (just in case):
const text = response.text();
const cleanJson = text.replace(/```json|```/g, "").trim();
const ticketData = JSON.parse(cleanJson);

    // 5️⃣ Save once
    const newTicket = await Ticket.create(ticketData);

    res.status(201).json(newTicket);
  } catch (error) {
    console.error("Scanning Error:", error);
    res.status(500).json({ error: "Ticket scan failed" });
  } finally {
    isProcessing = false;
  }
};