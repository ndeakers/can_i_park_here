// src/app/page.tsx
"use client";
import { useState } from "react";
import CameraCapture from "@/components/camera/CameraCapture";
import { useEffect } from "react";
import { analyzeImage } from "@/api";

export default function Page() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobileRegex = /(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)/i;
    const userAgentIsMobile = mobileRegex.test(navigator.userAgent);
    const screenWidthIsMobile = window.innerWidth <= 768;
    const hasTouchCapability = navigator.maxTouchPoints > 0;
    console.log(userAgentIsMobile, screenWidthIsMobile, hasTouchCapability);
    // Consider it mobile if user agent indicates mobile, OR if screen width is narrow AND it has touch capability.
    setIsMobile(userAgentIsMobile || (screenWidthIsMobile && hasTouchCapability));
  }, [])

  const handleCameraSubmit = async () => {
    try {
      if (!photo) return;
      const response = await analyzeImage(photo);
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <main className="px-4 py-12">
      <div className="mx-auto w-full max-w-[640px] space-y-6">
        <CameraCapture handleCameraSubmit={handleCameraSubmit} setPhoto={setPhoto} />
      </div>
    </main>
  );
}