
"use client";

import { useRef, useState } from "react";
import QRCode from "qrcode";
import {
  ArrowDownToLine,
  Check,
  Copy,
  ExternalLink,
  Link2,
  ScanLine,
  Upload,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { BrowserQRCodeReader } from "@zxing/browser";

type Tab = "generate" | "scan";

export default function Home() {
  const [tab, setTab] = useState<Tab>("generate");
  const [url, setUrl] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  async function generateQR() {
    setError("");
    setQrImage("");

    const value = url.trim();

    if (!value) {
      setError("Masukkan link terlebih dahulu.");
      return;
    }

    try {
      const parsed = new URL(value);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("URL tidak valid.");
      }

      const image = await QRCode.toDataURL(value, {
        width: 800,
        margin: 4,
        errorCorrectionLevel: "H",
        color: {
          dark: "#111827",
          light: "#FFFFFF",
        },
      });

      setQrImage(image);
    } catch {
      setError("Link tidak valid. Gunakan URL lengkap, misalnya https://contoh.com");
    }
  }

  function downloadQR() {
    if (!qrImage) return;

    const anchor = document.createElement("a");
    anchor.href = qrImage;
    anchor.download = "qr-link-studio.png";
    anchor.click();
  }

  async function copyResult() {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Tidak dapat menyalin teks. Silakan salin secara manual.");
    }
  }

  async function scanImage(file: File) {
    setError("");
    setResult("");

    try {
      const imageURL = URL.createObjectURL(file);

      try {
        const reader = new BrowserQRCodeReader();
        const image = new Image();
        image.src = imageURL;

        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("Gambar tidak dapat dibuka."));
        });

        const decoded = await reader.decodeFromImageElement(image);
        setResult(decoded.getText());
      } finally {
        URL.revokeObjectURL(imageURL);
      }
    } catch {
      setError("QR Code tidak ditemukan. Gunakan gambar QR yang jelas.");
    }
  }

  async function startCamera() {
    setError("");

    if (!videoRef.current) return;

    try {
      const reader = new BrowserQRCodeReader();

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (decoded) => {
          if (decoded) {
            setResult(decoded.getText());
            controlsRef.current?.stop();
            controlsRef.current = null;
            setCameraOn(false);
          }
        }
      );

      controlsRef.current = controls;
      setCameraOn(true);
    } catch {
      setError(
        "Kamera tidak dapat diakses. Izinkan akses kamera atau gunakan upload gambar."
      );
    }
  }

  function stopCamera() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraOn(false);
  }

  function openResult() {
    try {
      const parsed = new URL(result);

      if (["http:", "https:"].includes(parsed.protocol)) {
        window.open(parsed.href, "_blank", "noopener,noreferrer");
      } else {
        setError("Hasil QR bukan link web yang valid.");
      }
    } catch {
      setError("Hasil QR berupa teks, bukan URL yang valid.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-5">
          <div className="rounded-xl bg-blue-600 p-2.5 text-white">
            <QrCode size={25} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              QR Link Generated
            </h1>
            <p className="text-xs text-slate-500">
              Generate, scan, and decode QR codes
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
            <ScanLine size={16} />
            Free QR Code Tools
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Semua kebutuhan QR Code
            <span className="mt-2 block text-blue-600">
              dalam satu tempat.
            </span>
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-600 md:text-base">
            Ubah link menjadi QR Code atau scan QR Code untuk
            membaca link dan teks secara praktis.
          </p>
        </div>

        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 gap-2 border-b border-slate-200 p-3">
            <button
              onClick={() => {
                stopCamera();
                setTab("generate");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                tab === "generate"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Link2 size={18} />
              Link ke QR
            </button>

            <button
              onClick={() => {
                stopCamera();
                setTab("scan");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                tab === "scan"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ScanLine size={18} />
              QR ke Link
            </button>
          </div>

          <div className="p-5 md:p-8">
            {tab === "generate" ? (
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-bold">Generate QR Code</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Masukkan URL lengkap yang ingin diubah menjadi QR Code.
                  </p>

                  <label
                    htmlFor="url"
                    className="mb-2 mt-6 block text-sm font-semibold"
                  >
                    URL website
                  </label>
                  <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") generateQR();
                    }}
                    placeholder="https://contoh.com"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    onClick={generateQR}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    <QrCode size={18} />
                    Generate QR Code
                  </button>

                  {qrImage && (
                    <button
                      onClick={downloadQR}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                    >
                      <ArrowDownToLine size={18} />
                      Download PNG
                    </button>
                  )}
                </div>

                <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  {qrImage ? (
                    <>
                      <img
                        src={qrImage}
                        alt="QR Code hasil generate"
                        className="h-auto w-full max-w-64 rounded-lg bg-white"
                      />
                      <p className="mt-4 text-center text-sm font-semibold">
                        QR Code berhasil dibuat
                      </p>
                      <p className="mt-1 text-center text-xs text-slate-500">
                        Coba scan dengan Google Lens.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl bg-blue-100 p-5 text-blue-600">
                        <QrCode size={48} />
                      </div>
                      <p className="mt-4 font-semibold">
                        Preview QR Code
                      </p>
                      <p className="mt-2 text-center text-sm text-slate-500">
                        QR Code akan muncul di sini.
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold">Scan QR Code</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Gunakan kamera atau upload gambar QR Code untuk
                  membaca isinya.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={cameraOn ? stopCamera : startCamera}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    {cameraOn ? (
                      <RefreshCw size={18} />
                    ) : (
                      <ScanLine size={18} />
                    )}
                    {cameraOn ? "Hentikan Kamera" : "Buka Kamera"}
                  </button>

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50">
                    <Upload size={18} />
                    Upload Gambar
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) scanImage(file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>

                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className={`mt-5 max-h-96 w-full rounded-2xl bg-black object-contain ${
                    cameraOn ? "block" : "hidden"
                  }`}
                />

                {result && (
                  <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="font-semibold text-green-800">
                      QR Code berhasil dibaca
                    </p>
                    <div className="mt-3 break-all rounded-xl border border-green-100 bg-white p-3 text-sm">
                      {result}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={copyResult}
                        className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? "Tersalin" : "Salin"}
                      </button>
                      <button
                        onClick={openResult}
                        className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
                      >
                        <ExternalLink size={16} />
                        Buka Link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          {[
            {
              title: "Mudah digunakan",
              description: "Generate QR hanya dengan memasukkan URL.",
            },
            {
              title: "Bisa dibaca",
              description: "QR Code standar untuk Google Lens dan scanner lain.",
            },
            {
              title: "Privasi",
              description: "Tidak perlu login atau menyimpan link ke database.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <h4 className="font-semibold">{item.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <footer className="mt-12 text-center text-xs text-slate-400">
          Generate and scan QR codes by Roby
        </footer>
      </section>
    </main>
  );
}
