"use client";

import { useRef, useState } from "react";

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon,.png,.jpg,.jpeg,.webp,.gif,.svg,.ico";

export async function uploadAdminFile(file: File) {
  const form = new FormData();
  form.set("file", file);
  form.set("alt", file.name);
  const res = await fetch("/api/admin/media", { method: "POST", body: form });
  const body = await res.json().catch(() => ({ error: "Could not upload that file." }));
  if (!res.ok) throw new Error(body.error || "Could not upload that file.");
  return body as { id: string; url: string; mime: string };
}

export function ImageUploadField({
  name,
  value,
  onChange,
  required,
  label = "Choose image",
}: {
  name: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = Boolean(value) && !/\.pdf($|\?)/i.test(value);

  async function onFile(file: File) {
    setBusy(true);
    setError("");
    try {
      const saved = await uploadAdminFile(file);
      onChange(saved.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value || ""} required={Boolean(required) && !value} />
      {preview ? (
        <img src={value} alt="" className="h-32 w-full max-w-sm rounded-2xl border border-slate-200 object-contain bg-paper" />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFile(file);
            event.currentTarget.value = "";
          }}
        />
        <button type="button" className="btn-navy" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Uploading…" : value ? "Change image" : label}
        </button>
        {value ? (
          <button type="button" className="btn-line" disabled={busy} onClick={() => onChange("")}>
            Remove
          </button>
        ) : null}
      </div>
      <p className="text-xs text-slate-500">
        {busy ? "Uploading from this computer…" : "Choose a PNG, JPG, WEBP, GIF or SVG from this computer. Keep live-site photos under 4 MB so they stay saved after deploy."}
      </p>
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}

export function MediaLibraryUpload({ onUploaded }: { onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function onFile(file: File) {
    setBusy(true);
    setMessage("");
    try {
      await uploadAdminFile(file);
      setMessage("Image saved to the library.");
      onUploaded();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not upload that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mb-4 space-y-2 p-4">
      <p className="font-semibold text-navy">Upload an image</p>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onFile(file);
          event.currentTarget.value = "";
        }}
      />
      <button type="button" className="btn-orange" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? "Uploading…" : "Choose image from computer"}
      </button>
      {message ? <p className="text-sm font-semibold">{message}</p> : null}
    </div>
  );
}
