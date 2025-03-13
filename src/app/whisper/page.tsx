"use client";
import { useState, useRef } from "react";

export default function Home() {
  const [audio, setAudio] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [recording, setRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // const handleUpload = async () => {
  //   if (!audio) {
  //     console.warn("⚠️ Tidak ada file audio yang dipilih!");
  //     return;
  //   }

  //   console.log("📤 Mengupload file:", audio.name);

  //   const formData = new FormData();
  //   formData.append("audio", audio);

  //   try {
  //     const response = await fetch(`${window.location.origin}/api/whisper`, {
  //       method: "POST",
  //       body: formData,
  //     });

  //     console.log("🔍 RESPONSE STATUS:", response.status);

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       console.error("❌ Error response:", errorText);
  //       return;
  //     }

  //     const result = await response.json();
  //     console.log("✅ Transkripsi Sukses:", result.text);

  //     setTranscription(result.text || "Failed to transcribe.");
  //   } catch (error) {
  //     console.error("❌ Terjadi kesalahan saat mengupload:", error);
  //   }
  // };

  const handleUpload = async () => {
    if (!audio) return;

    const formData = new FormData();
    formData.append("audio", audio);

    console.log("🔼 Mengunggah audio ke server:", audio.name);

    try {
      const response = await fetch(`${origin}/api/whisper`, {
        method: "POST",
        body: formData,
      });

      console.log("📩 Response diterima:", response);

      if (!response.ok) {
        console.error("❌ Gagal mengunggah. Status:", response.status);
        const errorText = await response.text();
        console.error("Pesan error:", errorText);
        return;
      }

      const result = await response.json();
      console.log("✅ Transkripsi sukses:", result);

      setTranscription(result.text || "Failed to transcribe.");
    } catch (error) {
      console.error("❗ Terjadi kesalahan:", error);
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const audioFile = new File([audioBlob], "recorded_audio.wav", {
        type: "audio/wav",
      });

      setAudio(audioFile);
      console.log("🎙️ Audio direkam:", audioFile.name);
      audioChunksRef.current = []; // Reset audio chunks
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    console.log("🎙️ Audio Berhenti");
  };

  return (
    <div className="p-6">
      <h1 className="font-bold text-2xl">Whisper Speech-to-Text</h1>

      <div className="mt-4">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`px-4 py-2 rounded text-white ${
            recording ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>

      <div className="mt-4">
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setAudio(e.target.files?.[0] || null)}
        />
      </div>

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
