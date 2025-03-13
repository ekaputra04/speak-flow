"use client";
import { useState, useRef } from "react";

export default function WebSpeechApi() {
  const [text, setText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSpeak = (inputText: string) => {
    if (!window.speechSynthesis) {
      alert("Browser tidak mendukung speech synthesis");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(inputText);
    utterance.lang = "id-ID";

    window.speechSynthesis.speak(utterance);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setText(e.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleListen = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser tidak mendukung Speech Recognition");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setTranscript(spokenText);
      handleSpeak(spokenText); // Langsung mengucapkan hasil transkripsi
    };

    recognition.start();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    alert("Teks berhasil disalin!");
  };

  return (
    <main className="flex flex-col justify-center items-center bg-gray-100 p-6 min-h-screen">
      <div className="bg-white shadow-lg p-6 rounded-lg w-full max-w-lg text-center">
        <h1 className="mb-4 font-bold text-slate-800 text-2xl">
          TTS & STT & STS App
        </h1>

        <textarea
          className="mb-4 p-2 border border-gray-300 rounded w-full text-slate-800"
          rows={3}
          placeholder="Masukkan teks untuk dibaca..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={() => handleSpeak(text)}
          className="bg-blue-500 hover:bg-blue-600 mb-2 py-2 rounded w-full text-white"
        >
          🔊 Ucapkan Teks
        </button>

        <input
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          className="mb-4 p-2 border w-full text-slate-800"
        />

        <hr className="my-6" />

        <button
          onClick={handleListen}
          className={`w-full py-2 rounded ${
            listening ? "bg-red-500" : "bg-green-500"
          } text-white hover:opacity-80`}
        >
          🎤 {listening ? "Mendengarkan..." : "Mulai Bicara"}
        </button>

        <p className="bg-gray-50 mt-4 p-2 border border-gray-300 rounded min-h-[50px] text-slate-800">
          {transcript || "Hasil akan muncul di sini..."}
        </p>

        <button
          onClick={handleCopy}
          className="bg-gray-600 hover:bg-gray-700 mt-2 px-4 py-2 rounded text-white"
        >
          📋 Salin Teks
        </button>
      </div>
    </main>
  );
}
