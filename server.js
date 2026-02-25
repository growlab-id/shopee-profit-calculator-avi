import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/api/analyze", async (req, res) => {
  try {
    const { base64, mimeType } = req.body;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
          {
            text: "Extract 'Total Penghasilan', 'Sub Total', and 'Jumlah Pesanan'. Return JSON."
          },
        ],
      },
      config: { responseMimeType: "application/json" },
    });

    res.json(JSON.parse(response.text));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.listen(3015, () => {
  console.log("Server running on port 3015");
});