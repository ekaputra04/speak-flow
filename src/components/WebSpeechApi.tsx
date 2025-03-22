"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Clipboard, Mic, Volume2 } from "lucide-react";

export default function WebSpeechApi() {
  const [text, setText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();

        if (availableVoices.length > 0) {
          setVoices(availableVoices);

          // Only set default voice if none is selected yet
          if (!selectedVoice) {
            // Try to find Indonesian voice
            const indonesianVoice = availableVoices.find(
              (voice) =>
                voice.lang.includes("id") || voice.lang.includes("in-ID")
            );
            setSelectedVoice(indonesianVoice?.name || availableVoices[0].name);
          }
        }
      }
    };

    // Check if we're in the browser
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Initial load attempt
      loadVoices();

      // Set up event listener for when voices are loaded asynchronously
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

      // Cleanup listener on unmount
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      };
    }
  }, [selectedVoice]);

  // Cleanup audio URLs when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }

      // Make sure speech synthesis is canceled when component unmounts
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      // Stop any ongoing speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping recognition
        }
      }
    };
  }, [audioUrl, recordedAudioUrl]);

  const handleSpeak = (inputText: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Browser tidak mendukung speech synthesis");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    if (!inputText.trim()) {
      alert("Silakan masukkan teks untuk dibaca");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(inputText);

    // Find the selected voice object
    const selectedVoiceObj = voices.find(
      (voice) => voice.name === selectedVoice
    );

    // Set voice properties
    utterance.lang = selectedVoiceObj?.lang || "id-ID";
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.voice = selectedVoiceObj || null;

    // Error handling
    utterance.onerror = (event) => {
      console.error("TTS Error:", event);
      alert(`Error saat membaca teks: ${event.error}`);
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
  };

  // Generate audio from text
  const handleGenerateAudio = async () => {
    if (!text.trim()) {
      alert("Silakan masukkan teks untuk dibaca");
      return;
    }

    setIsGeneratingAudio(true);

    try {
      // Create audio context
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        throw new Error("AudioContext not supported");
      }

      const audioContext = new AudioContext();
      const audioDestination = audioContext.createMediaStreamDestination();

      // Create media recorder
      const mediaRecorder = new MediaRecorder(audioDestination.stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create audio blob and URL
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

        // Clean up previous URL
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsGeneratingAudio(false);
      };

      // Start recording
      mediaRecorder.start();

      // Create speech utterance
      const utterance = new SpeechSynthesisUtterance(text);
      const selectedVoiceObj = voices.find(
        (voice) => voice.name === selectedVoice
      );

      utterance.voice = selectedVoiceObj || null;
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Stop recording when speech ends
      utterance.onend = () => {
        mediaRecorder.stop();
      };

      // Handle errors
      utterance.onerror = (event) => {
        console.error("TTS Error:", event);
        mediaRecorder.stop();
        setIsGeneratingAudio(false);
        alert(`Error saat membaca teks: ${event.error}`);
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Error generating audio:", error);
      setIsGeneratingAudio(false);
      alert(
        "Gagal menghasilkan audio. Browser mungkin tidak mendukung fitur ini."
      );
    }
  };

  const handleDownloadAudio = () => {
    if (!audioUrl) return;

    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "tts-audio.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setText(result);
      }
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

    // If already listening, stop
    if (listening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setListening(false);
        return;
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
    }

    // Create new recognition instance
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "id-ID";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setListening(true);

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      console.error("STT Error:", event);
      setListening(false);
      recognitionRef.current = null;

      if (event.error !== "no-speech") {
        alert(`Error saat mendengarkan: ${event.error}`);
      }
    };

    recognition.onresult = (event: any) => {
      // Get the latest result
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;

      // Update transcript
      setTranscript(transcript);

      // Only speak if it's a final result
      if (event.results[current].isFinal) {
        handleSpeak(transcript);
      }
    };

    // Start recognition
    try {
      recognition.start();
    } catch (e) {
      console.error("Error starting recognition:", e);
      alert("Gagal memulai pengenalan suara");
    }
  };

  // Record audio from microphone
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Create media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // Create audio blob and URL
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });

        // Clean up previous URL
        if (recordedAudioUrl) {
          URL.revokeObjectURL(recordedAudioUrl);
        }

        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        // Stop all tracks of the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorderRef.current.start();
      setListening(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Gagal mengakses mikrofon. Pastikan Anda memberikan izin akses.");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setListening(false);
    }
  };

  const handleAudioRecording = () => {
    if (listening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleDownloadRecording = () => {
    if (!recordedAudioUrl) return;

    const a = document.createElement("a");
    a.href = recordedAudioUrl;
    a.download = "recording.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
    <main className="flex flex-col justify-center items-center bg-gray-100 px-4 md:px-8 lg:px-16 py-6 min-h-screen">
      <h1 className="mb-6 font-bold text-slate-800 text-2xl md:text-3xl">
        TTS & STT & STS App
      </h1>
      <div className="gap-4 md:gap-6 grid grid-cols-1 md:grid-cols-5 w-full max-w-7xl">
        <div className="col-span-1 md:col-span-2 bg-white shadow-lg p-4 md:p-6 rounded-lg w-full">
          <Textarea
            className="mb-4 p-2 border border-gray-300 rounded w-full h-40 md:h-60 text-slate-800"
            placeholder="Masukkan teks untuk dibaca..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="mb-4">
            <Input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="border w-full text-slate-800"
            />
          </div>

          <div className="gap-2 grid grid-cols-1 md:grid-cols-2">
            <Button
              onClick={() => handleSpeak(text)}
              className="flex justify-center items-center bg-blue-500 hover:bg-blue-600 py-2 rounded text-white"
            >
              <Volume2 className="mr-2 w-4 h-4" /> Ucapkan Teks
            </Button>

            <Button
              onClick={handleGenerateAudio}
              disabled={isGeneratingAudio}
              className="flex justify-center items-center bg-purple-500 hover:bg-purple-600 py-2 rounded text-white"
            >
              {isGeneratingAudio ? "Generating..." : "Generate Audio"}
            </Button>
          </div>

          {audioUrl && (
            <div className="space-y-2 mt-4">
              <audio src={audioUrl} controls className="my-2 w-full" />
              <Button
                onClick={handleDownloadAudio}
                className="flex justify-center items-center bg-green-500 hover:bg-green-600 py-2 rounded w-full text-white"
              >
                <Download className="mr-2 w-4 h-4" /> Download Audio
              </Button>
            </div>
          )}
        </div>

        <div className="col-span-1 md:col-span-2 bg-white shadow-lg p-4 md:p-6 rounded-lg">
          <div className="gap-2 grid grid-cols-1 md:grid-cols-2 mb-4">
            <Button
              onClick={handleListen}
              className={`py-2 rounded flex items-center justify-center ${
                listening
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              } text-white`}
            >
              <Mic className="mr-2 w-4 h-4" />{" "}
              {listening ? "Berhenti" : "Mulai Bicara"}
            </Button>

            <Button
              onClick={handleAudioRecording}
              className={`py-2 rounded flex items-center justify-center ${
                listening
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white`}
            >
              {listening ? "Berhenti Rekam" : "Rekam Audio"}
            </Button>
          </div>

          <div className="bg-gray-50 mb-3 p-3 border border-gray-300 rounded min-h-[100px] text-slate-800">
            {transcript || "Hasil akan muncul di sini..."}
          </div>

          <div className="gap-2 grid grid-cols-1 md:grid-cols-2">
            <Button
              onClick={handleCopy}
              className="flex justify-center items-center bg-gray-600 hover:bg-gray-700 py-2 rounded text-white"
              disabled={!transcript}
            >
              <Clipboard className="mr-2 w-4 h-4" /> Salin Teks
            </Button>

            {recordedAudioUrl && (
              <Button
                onClick={handleDownloadRecording}
                className="flex justify-center items-center bg-green-500 hover:bg-green-600 py-2 rounded text-white"
              >
                <Download className="mr-2 w-4 h-4" /> Download Rekaman
              </Button>
            )}
          </div>

          {recordedAudioUrl && (
            <div className="mt-3">
              <audio src={recordedAudioUrl} controls className="w-full" />
            </div>
          )}
        </div>

        <div className="col-span-1 bg-white shadow-lg p-4 md:p-6 rounded-lg">
          <div className="mb-4">
            <Label className="block mb-1 text-slate-800">
              Kecepatan: {rate.toFixed(1)}
            </Label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number.parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <Label className="block mb-1 text-slate-800">
              Pitch: {pitch.toFixed(1)}
            </Label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number.parseFloat(e.target.value))}
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
