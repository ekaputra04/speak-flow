"use client";
import { useState } from "react";

export default function Home() {
  const [audio, setAudio] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>("");

  const handleUpload = async () => {
    if (!audio) return;

    const formData = new FormData();
    formData.append("audio", audio);

    const response = await fetch("/api/whisper", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    setTranscription(result.text || "Failed to transcribe.");
  };

  return (
    <div className="p-6">
      <h1 className="font-bold text-2xl">Whisper Speech-to-Text</h1>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setAudio(e.target.files?.[0] || null)}
        className="mt-4"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-500 mt-4 px-4 py-2 rounded text-white"
      >
        Upload & Transcribe
      </button>
      <p className="mt-4">{transcription}</p>
    </div>
  );
}
