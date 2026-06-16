"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  type?: "image" | "file";
  accept?: string;
  placeholder?: string;
  folder?: string;
  variant?: "dark" | "light";
  onFileChange?: (value: string) => void;
  value?: string;
  /** If true, shows a "Use sample card" shortcut button */
  showSample?: boolean;
  sampleSrc?: string;
  sampleLabel?: string;
}

const SAMPLE_CARD_PATH = "/images/sample-university-card.png";

const FileUpload = ({
  type = "image",
  accept = "image/*",
  placeholder = "Upload a file",
  variant = "dark",
  onFileChange,
  value,
  showSample = false,
  sampleSrc = SAMPLE_CARD_PATH,
  sampleLabel = "Use sample card",
}: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<string>(value || "");
  const [dragging, setDragging] = useState(false);
  const [usedSample, setUsedSample] = useState(false);

  // Sync preview with external value changes (e.g., form reset)
  useEffect(() => {
    if (value !== undefined && value !== preview) {
      setPreview(value);
      if (!value) {
        setFileName("");
        setUsedSample(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setUsedSample(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onFileChange?.(result);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleUseSample = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPreview(sampleSrc);
    setFileName("sample-university-card.png");
    setUsedSample(true);
    onFileChange?.(sampleSrc);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPreview("");
    setFileName("");
    setUsedSample(false);
    onFileChange?.("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Sample card quick-action — shown prominently ABOVE the dropzone when no file yet */}
      {showSample && !preview && (
        <button
          type="button"
          onClick={handleUseSample}
          className="flex items-center justify-center gap-2 w-full text-sm font-semibold text-primary border border-primary/40 bg-primary/10 hover:bg-primary/20 rounded-lg px-4 py-2.5 transition-all duration-200 group"
        >
          <span className="text-base">🪪</span>
          <span>{sampleLabel}</span>
          <span className="text-xs font-normal text-primary/70 ml-1">(quick demo)</span>
        </button>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "upload-btn cursor-pointer flex-col gap-2 border-2 border-dashed rounded-lg p-4 transition-colors",
          dragging
            ? "border-primary bg-primary/10"
            : variant === "dark"
            ? "border-dark-600 bg-dark-300 hover:border-primary/50"
            : "border-light-300 bg-light-300 hover:border-primary/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />

        {preview && type === "image" ? (
          <div className="relative w-full overflow-hidden rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Uploaded preview"
              className="w-full h-40 object-cover rounded-md"
            />
            {usedSample && (
              <div className="absolute top-2 left-2 bg-primary/90 text-dark-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Sample card
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Image
              src="/icons/upload.svg"
              alt="upload"
              width={32}
              height={32}
              className="opacity-70"
            />
            <p className={cn("text-sm text-center", variant === "dark" ? "text-light-100" : "text-dark-300")}>
              {fileName || placeholder}
            </p>
            <p className="text-xs text-light-100/50">
              {dragging ? "Drop it here!" : "Click or drag & drop your ID card"}
            </p>
          </div>
        )}

        {fileName && (
          <p className="upload-filename text-primary text-xs truncate max-w-full px-2">
            {fileName}
          </p>
        )}
      </div>

      {/* Action buttons row — shown below the dropzone when a file is selected */}
      {preview && (
        <div className="flex items-center gap-2 flex-wrap">
          {showSample && !usedSample && (
            <button
              type="button"
              onClick={handleUseSample}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 rounded-md px-3 py-1.5 transition-colors"
            >
              <span>🪪</span>
              Use sample instead
            </button>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-light-100/60 hover:text-red-400 border border-light-100/10 hover:border-red-400/30 rounded-md px-3 py-1.5 transition-colors"
          >
            ✕ Remove
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
