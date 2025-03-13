import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import FormData from "form-data";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Gunakan variabel lingkungan
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Simpan file sementara
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempFilePath = `/tmp/${file.name}`;
    fs.writeFileSync(tempFilePath, buffer);

    // Kirim file ke OpenAI API
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1",
      language: "id", // Sesuaikan dengan bahasa yang digunakan
    });

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
}
