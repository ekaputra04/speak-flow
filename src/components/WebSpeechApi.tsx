"use client";
import { useState, useRef } from "react";

export default function WebSpeechApi() {
  const [text, setText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSpeak = () => {
    if (!window.speechSynthesis) {
      alert("Browser tidak mendukung speech synthesis");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";

    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    const mediaRecorder = new MediaRecorder(destination.stream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      const url = URL.createObjectURL(audioBlob);
      setAudioURL(url);
    };

    mediaRecorder.start();

    const utteranceSource = audioContext.createMediaStreamSource(
      destination.stream
    );
    utteranceSource.connect(audioContext.destination);

    utterance.onend = () => {
      mediaRecorder.stop();
      audioContext.close();
    };

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
      setTranscript(event.results[0][0].transcript);
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

        {audioURL && (
          <a
            href={audioURL}
            download="tts_audio.wav"
            className="block mt-2 text-blue-600 underline"
          >
            🎵 Unduh Suara
          </a>
        )}

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

        <button
          onClick={handleCopy}
          className="bg-gray-600 hover:bg-gray-700 mt-2 px-4 py-2 rounded text-white"
        >
          📋 Salin Teks
        </button>

        <input
          type="file"
          accept="audio/*"
          ref={fileInputRef}
          className="mt-4 p-2 border w-full text-slate-800"
        />
      </div>
    </main>
  );
}
