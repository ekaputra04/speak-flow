"use client";
import { useState } from "react";

export default function App() {
  const [text, setText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("Browser tidak mendukung Speech Recognition API");
  }

  const handleSpeak = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Browser tidak mendukung Speech Synthesis");
    }
  };

  const handleListen = () => {
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
      setTranscript(event.results[0][0].transcript);
    };

    recognition.start();
  };

  return (
    <main className="flex flex-col justify-center items-center bg-gray-100 p-6 min-h-screen">
      <div className="bg-white shadow-lg p-6 rounded-lg w-full max-w-lg text-center">
        <h1 className="mb-4 font-bold text-slate-800 text-2xl">
          TTS & STT App
        </h1>

        {/* Input untuk TTS */}
        <textarea
          className="mb-4 p-2 border border-gray-300 rounded w-full text-slate-800"
          rows={3}
          placeholder="Masukkan teks untuk dibaca..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={handleSpeak}
          className="bg-blue-500 hover:bg-blue-600 py-2 rounded w-full text-white"
        >
          🔊 Ucapkan Teks
        </button>

        <hr className="my-6" />

        {/* Output untuk STT */}
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
      </div>
    </main>
  );
}
