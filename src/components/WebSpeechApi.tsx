"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WebSpeechApi() {
  const [text, setText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");

  useEffect(() => {
    const loadVoices = () => {
      // Pastikan window dan speechSynthesis tersedia (untuk SSR compatibility)
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        // Set suara default jika tersedia
        if (availableVoices.length > 0 && !selectedVoice) {
          // Coba cari suara Indonesia
          const indonesianVoice = availableVoices.find(
            (voice) => voice.lang.includes("id") || voice.lang.includes("in-ID")
          );
          setSelectedVoice(indonesianVoice?.name || availableVoices[0].name);
        }

        console.log("Voices loaded:", availableVoices);
      }
    };

    // Pastikan kode berjalan di browser, bukan di server
    if (typeof window !== "undefined") {
      // Cek apakah suara sudah tersedia
      if (window.speechSynthesis?.getVoices().length > 0) {
        loadVoices();
      } else {
        // Tambahkan event listener jika suara belum tersedia
        window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
      }

      // Cleanup listener saat komponen unmount
      return () => {
        window.speechSynthesis?.removeEventListener(
          "voiceschanged",
          loadVoices
        );
      };
    }
  }, [selectedVoice]);

  const handleSpeak = (inputText: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Browser tidak mendukung speech synthesis");
      return;
    }

    // Hentikan utterance yang sedang berjalan
    window.speechSynthesis.cancel();

    if (!inputText.trim()) {
      alert("Silakan masukkan teks untuk dibaca");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(inputText);

    // Set language berdasarkan suara yang dipilih atau default ke id-ID
    const selectedVoiceObj = voices.find(
      (voice) => voice.name === selectedVoice
    );
    utterance.lang = selectedVoiceObj?.lang || "id-ID";
    utterance.rate = rate; // Menyesuaikan kecepatan
    utterance.pitch = pitch; // Menyesuaikan pitch
    utterance.voice = selectedVoiceObj || null;

    // Handler untuk mendeteksi errors
    utterance.onerror = (event) => {
      console.error("TTS Error:", event);
      alert(`Error saat membaca teks: ${event.error}`);
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
    if (typeof window === "undefined") return;

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

    recognition.onerror = (event: any) => {
      console.error("STT Error:", event);
      setListening(false);
      alert(`Error saat mendengarkan: ${event.error}`);
    };

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setTranscript(spokenText);
      handleSpeak(spokenText); // Langsung mengucapkan hasil transkripsi
    };

    recognition.start();
  };

  const handleCopy = () => {
    if (!transcript) {
      alert("Tidak ada teks untuk disalin");
      return;
    }

    navigator.clipboard
      .writeText(transcript)
      .then(() => alert("Teks berhasil disalin!"))
      .catch((err) => {
        console.error("Gagal menyalin teks:", err);
        alert("Gagal menyalin teks ke clipboard");
      });
  };

  return (
    <main className="flex-col justify-center items-center bg-gray-100 px-8 md:px-16 lg:px-32 py-6 min-h-screen">
      <h1 className="mb-4 font-bold text-slate-800 text-2xl">
        TTS & STT & STS App
      </h1>
      <div className="gap-8 grid grid-cols-1 md:grid-cols-5">
        <div className="col-span-1 md:col-span-2 bg-white shadow-lg p-6 rounded-lg w-full text-center">
          <div className=""></div>

          <Textarea
            className="mb-4 p-2 border border-gray-300 rounded w-full h-60 text-slate-800"
            rows={3}
            placeholder="Masukkan teks untuk dibaca..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <Button
            onClick={() => handleSpeak(text)}
            className="bg-blue-500 hover:bg-blue-600 mb-2 py-2 rounded w-full text-white"
          >
            🔊 Ucapkan Teks
          </Button>

          <Input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="border w-full text-slate-800"
          />

          <hr className="my-6" />
        </div>

        <div className="col-span-1 md:col-span-2 bg-white shadow-lg p-6 rounded-lg">
          <Button
            onClick={handleListen}
            className={`w-full py-2 rounded ${
              listening ? "bg-red-500" : "bg-green-500"
            } text-white hover:${listening ? "bg-red-600" : "bg-green-600"}`}
          >
            🎤 {listening ? "Mendengarkan..." : "Mulai Bicara"}
          </Button>

          <p className="bg-gray-50 mt-4 p-2 border border-gray-300 rounded min-h-[50px] text-slate-800">
            {transcript || "Hasil akan muncul di sini..."}
          </p>

          <Button
            onClick={handleCopy}
            className="bg-gray-600 hover:bg-gray-700 mt-2 px-4 py-2 rounded text-white"
          >
            📋 Salin Teks
          </Button>
        </div>
        <div className="col-span-1 bg-white shadow-lg p-6 rounded-lg">
          <div className="mb-4">
            <label className="block text-slate-800">
              Kecepatan: {rate.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-slate-800">
              Pitch: {pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="mb-2">
            <Label className="block mb-2 text-slate-800">Pilih Suara:</Label>

            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih suara..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Suara Tersedia</SelectLabel>
                  {voices.length === 0 ? (
                    <SelectItem value="loading">Memuat suara...</SelectItem>
                  ) : (
                    voices.map((voice, index) => (
                      <SelectItem key={index} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </main>
  );
}
