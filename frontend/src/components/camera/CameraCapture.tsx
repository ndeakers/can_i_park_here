// src/components/CameraCapture.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { H1 } from "@/components/ui/h1";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  handleCameraSubmit: () => void; // handles the captured photo
  setPhoto: (file: File) => void;
  facingMode?: "user" | "environment";
};

export default function CameraCapture({ handleCameraSubmit, setPhoto, facingMode = "environment" }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [activeFacingMode, setActiveFacingMode] = useState<"user" | "environment">(facingMode);

  // callbacks
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const switchCamera = useCallback(() => {
    setActiveFacingMode((m) => (m === "user" ? "environment" : "user"));
  }, []);


  const startStream = useCallback(async (mode: "user" | "environment") => {
    try {
      setError(null);
      stopStream();
      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: mode } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      setError(e?.message ?? "Unable to access camera");
    }
  }, [stopStream]);


  // captures
  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      setError("Camera not ready yet");
      return;
    }
    // converts the video to a convas element and draws the image
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Canvas context not available");
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to create image"))), "image/jpeg", 0.92)
    );

    const file = new File([blob], `capture-${Date.now()}.jpeg`, { type: "image/jpeg" });
    const quality = 0.92;
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    setPreview(dataUrl);
    setPhoto(file);
  }, [setPhoto]);

  // starts stream on mount or when user switches camera
  useEffect(() => {
    if (typeof navigator === "undefined" || typeof window === "undefined") return;
    startStream(activeFacingMode);
    return () => stopStream();
  }, [activeFacingMode, startStream, stopStream]);


  return (
    <div className="flex flex-col items-center justify-center">
      <H1 className="mb-4">Camera</H1>
      <div className="w-full max-w-[640px] max-h-[75vh]">
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full rounded-md object-cover bg-black"
            />

          </>
        ) : (
          <AspectRatio ratio={3 / 4}>
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full rounded-md object-cover bg-black"
            />
          </AspectRatio>
        )}
        {error && (
          <p className="text-sm text-red-600" aria-live="polite">{error}</p>
        )}

        <div className="flex gap-2 justify-center mt-4">
          {preview ?
            <>
              <Button onClick={() => {
                setPreview(null)
                startStream(activeFacingMode)
              }}>Retake photo</Button>
              <Button onClick={handleCameraSubmit}>Submit photo</Button>
            </>
            :
            <>
              <Button onClick={handleCapture}>Take photo</Button>
              <Button variant="secondary" onClick={switchCamera}>Switch camera</Button>
            </>
          }
        </div>
      </div>
    </div>
  );
}