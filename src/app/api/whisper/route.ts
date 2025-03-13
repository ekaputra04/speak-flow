import { NextRequest, NextResponse } from "next/server";
import { IncomingMessage } from "http";
import formidable from "formidable";
import { writeFile } from "fs/promises";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // **Wajib** agar bisa menangani file upload
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Fungsi untuk mengonversi NextRequest ke IncomingMessage agar bisa digunakan dengan formidable
async function convertToIncomingMessage(
  req: NextRequest
): Promise<IncomingMessage> {
  console.log("API KEY : ", process.env.OPENAI_API_KEY);

  const contentLength = req.headers.get("content-length");
  const contentType = req.headers.get("content-type");

  const body = await req.arrayBuffer();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(body));
      controller.close();
    },
  });

  const incomingMessage = new IncomingMessage(null as any);
  incomingMessage.headers = {
    "content-length": contentLength || "",
    "content-type": contentType || "",
  };
  incomingMessage.push(Buffer.from(body));
  incomingMessage.push(null);

  return incomingMessage;
}

// Fungsi untuk parsing file dengan formidable
async function parseForm(req: NextRequest) {
  const incomingReq = await convertToIncomingMessage(req);
  const form = formidable({ multiples: false, keepExtensions: true });

  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      form.parse(incomingReq, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    console.log("📥 Menerima request...");

    // Parsing form-data
    const { files } = await parseForm(req);

    const fileInput = files.audio;
    if (!fileInput) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Jika fileInput berupa array, ambil file pertama
    const file = Array.isArray(fileInput) ? fileInput[0] : fileInput;

    if (!file.filepath) {
      return NextResponse.json(
        { error: "Invalid file format" },
        { status: 400 }
      );
    }

    console.log("📂 File diterima:", file.originalFilename);

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log("📂 File diterima:", file.originalFilename);

    // Simpan file ke direktori sementara
    const tempFilePath = path.join("/tmp", file.newFilename);
    await writeFile(tempFilePath, fs.readFileSync(file.filepath));
    console.log("✅ File disimpan:", tempFilePath);

    // Kirim ke OpenAI Whisper API
    console.log("🚀 Mengirim file ke OpenAI Whisper...");
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1",
      language: "id",
    });

    console.log("✅ Transkripsi berhasil:", response.text);

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error("❌ Error transcribing audio:", error);
    return NextResponse.json(
      { error: "Failed to transcribe", details: error },
      { status: 500 }
    );
  }
}
