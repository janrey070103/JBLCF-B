// Facial capture component — uses navigator.mediaDevices.getUserMedia to
// access the device camera (desktop webcam or phone front camera).
// Provides: live preview, capture button, retake option, thumbnail preview.
// Stores the captured frame as a base-64 data URL in local state.
//
// Props:
//   onCapture(dataUrl)  — called when the user confirms the captured image
//   initialPhoto        — pre-existing photo data URL (for edit mode)
//
// NOTE: getUserMedia requires HTTPS in production. On localhost HTTP works
// per browser security policy. If camera is unavailable, a graceful fallback
// message is shown (no crash).

import { useCallback, useEffect, useRef, useState } from 'react';
import Button from './Button.jsx';

const STOPPED = 'stopped';
const STREAMING = 'streaming';
const CAPTURED = 'captured';
const ERROR = 'error';

export default function FacialCapture({ onCapture, initialPhoto = null }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState(initialPhoto ? CAPTURED : STOPPED);
  const [photo, setPhoto] = useState(initialPhoto);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Camera lifecycle ────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setErrorMsg('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('SECURE_CONTEXT_REQUIRED');
      }

      let stream;
      try {
        // Attempt front camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch (initialErr) {
        // Fallback to any camera if front camera is not explicitly found
        if (initialErr.name === 'NotAllowedError') throw initialErr;
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setStatus(STREAMING);
    } catch (err) {
      console.error('Camera access error:', err);
      
      let msg = 'Could not access the camera. Make sure a webcam is connected and try again.';
      if (err.message === 'SECURE_CONTEXT_REQUIRED') {
        msg = 'Camera access requires a secure connection (HTTPS) or localhost. If you are on mobile, use a secure tunnel or localhost port forwarding.';
      } else if (err.name === 'NotAllowedError') {
        msg = 'Camera access was denied. Grant permission in your browser settings and try again.';
      }
      
      setErrorMsg(msg);
      setStatus(ERROR);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  // Attach stream to video element once it's rendered
  useEffect(() => {
    if (status === STREAMING && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [status]);

  // ── Capture ─────────────────────────────────────────────────────────
  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhoto(dataUrl);
    setStatus(CAPTURED);
    stopCamera();
  }, [stopCamera]);

  // ── Retake ──────────────────────────────────────────────────────────
  const retake = useCallback(() => {
    setPhoto(null);
    startCamera();
  }, [startCamera]);

  const confirm = useCallback(() => {
    if (photo) onCapture?.(photo);
  }, [onCapture, photo]);

  return (
    <div className="w-full space-y-3">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera preview */}
      {status === STREAMING && (
        <div className="relative w-full aspect-[4/3] bg-primary-900 rounded-container overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Capture button overlay */}
          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3">
            <button
              type="button"
              onClick={capture}
              aria-label="Capture photo"
              className="w-14 h-14 rounded-full bg-white border-4 border-secondary shadow-elevated hover:scale-105 transition-transform ease-out-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
            />
          </div>
        </div>
      )}

      {/* Captured thumbnail */}
      {status === CAPTURED && photo && (
        <div className="space-y-2">
          <div className="w-full aspect-[4/3] rounded-container overflow-hidden bg-primary-50 border border-primary-100">
            <img
              src={photo}
              alt="Captured photo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex justify-center">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="tertiary" size="sm" onClick={retake}>
                Retake photo
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={confirm}>
                Use photo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === ERROR && (
        <div className="flex flex-col items-center gap-3 p-6 rounded-container border border-error/30 bg-error-light text-center">
          <svg
            aria-hidden="true"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-error"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          <p className="text-sm text-error">{errorMsg}</p>
          <Button type="button" variant="tertiary" size="sm" onClick={startCamera}>
            Try again
          </Button>
        </div>
      )}

      {/* Stopped / initial state — prompt to start */}
      {status === STOPPED && !initialPhoto && (
        <div className="flex flex-col items-center gap-3 p-6 rounded-container border border-primary-200 bg-primary-50/50 text-center">
          <svg
            aria-hidden="true"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-primary-300"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM8 14a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z" />
          </svg>
          <p className="text-sm text-primary-500">
            Take a photo for the student ID card
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={startCamera}>
            Open camera
          </Button>
        </div>
      )}
    </div>
  );
}
