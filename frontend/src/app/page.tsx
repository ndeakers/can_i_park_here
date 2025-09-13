// src/app/page.tsx
"use client";
import { useState } from "react";
import CameraCapture from "@/components/camera/CameraCapture";

export default function Page() {
  const [photo, setPhoto] = useState<string | null>(null);
  const isMobile = isMobileDevice();
  function isMobileDevice() {
    if (typeof navigator === "undefined" || typeof window === "undefined") return false;
    const mobileRegex = /(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)/i;
    const userAgentIsMobile = mobileRegex.test(navigator.userAgent);
    const screenWidthIsMobile = window.innerWidth <= 768;
    const hasTouchCapability = navigator.maxTouchPoints > 0;
    console.log(userAgentIsMobile, screenWidthIsMobile, hasTouchCapability);
    // Consider it mobile if user agent indicates mobile, OR if screen width is narrow AND it has touch capability.
    return userAgentIsMobile || (screenWidthIsMobile && hasTouchCapability);
  }
  console.log(isMobile);

  return (
    <main style={{ padding: 16 }}>
      <CameraCapture handleCameraSubmit={(_, dataUrl) => setPhoto(dataUrl)} />
      {photo && <p>Captured!</p>}
      {isMobile ? <p>Mobile</p> : <p>Desktop</p>}
    </main>
  );
}