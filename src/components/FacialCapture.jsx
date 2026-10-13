// Facial capture component — allows taking a photo via webcam or uploading
// an image file directly from the device. Auto-commits the photo on capture
// or file select so the parent form immediately has the image.
import { useCallback, useEffect, useRef, useState } from 'react';
import Button from './Button.jsx';
import { resolveApiUrl } from '../api/client.js';

const STOPPED = 'stopped';
const STREAMING = 'streaming';
const CAPTURED = 'captured';
const ERROR = 'error';

export default function FacialCapture({ onCapture, initialPhoto = null }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(initialPhoto ? CAPTURED : STOPPED);
  const [photo, setPhoto] = useState(initialPhoto);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state if initialPhoto changes asynchronously (e.g. on student fetch)
  useEffect(() => {
    if (initialPhoto) {
      setPhoto(initialPhoto);
      setStatus(CAPTURED);
    }
  }, [initialPhoto]);

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
        // Fallback to any camera
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

      let msg = 'Could not access camera. You can upload an image file instead.';
      if (err.message === 'SECURE_CONTEXT_REQUIRED') {
        msg = 'Camera access requires HTTPS or localhost. Please upload an image file from your device.';
      } else if (err.name === 'NotAllowedError') {
        msg = 'Camera access was denied. Grant browser permission or upload an image file.';
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

  // Attach stream to video element once rendered
  useEffect(() => {
    if (status === STREAMING && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [status]);

  // ── Capture from Camera ─────────────────────────────────────────────
  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhoto(dataUrl);
    setStatus(CAPTURED);
    stopCamera();
    onCapture?.(dataUrl);
  }, [onCapture, stopCamera]);

  // ── Upload from Device ──────────────────────────────────────────────
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG or PNG).');
      setStatus(ERROR);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setPhoto(dataUrl);
      setStatus(CAPTURED);
      setErrorMsg('');
      stopCamera();
      onCapture?.(dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset file input so selecting the same file again triggers change
    e.target.value = '';
  }, [onCapture, stopCamera]);

  // ── Retake / Remove ─────────────────────────────────────────────────
  const retake = useCallback(() => {
    setPhoto(null);
    startCamera();
  }, [startCamera]);

  const removePhoto = useCallback(() => {
    setPhoto(null);
    setStatus(STOPPED);
    setErrorMsg('');
    stopCamera();
    onCapture?.(null);
  }, [onCapture, stopCamera]);

  return (
    <div className="w-full space-y-3">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for uploading from device */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

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
          {/* Controls overlay */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 pb-4 bg-gradient-to-t from-black/60 to-transparent pt-6">
            <button
              type="button"
              onClick={() => { stopCamera(); setStatus(photo ? CAPTURED : STOPPED); }}
              className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-medium hover:bg-white/30 backdrop-blur"
            >
              Cancel
            </button>
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
        <div className="space-y-3">
          <div className="relative w-48 mx-auto aspect-[3/4] rounded-container overflow-hidden bg-primary-50 border-2 border-primary/20 shadow-sm">
            <img
              src={resolveApiUrl(photo)}
              alt="Captured photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              ✓ Attached
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" variant="tertiary" size="sm" onClick={retake}>
              Retake Camera
            </Button>
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Different File
            </Button>
            <Button type="button" variant="danger" size="sm" onClick={removePhoto}>
              Remove Photo
            </Button>
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
          <div className="flex flex-wrap gap-2 justify-center">
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Upload photo from device
            </Button>
            <Button type="button" variant="tertiary" size="sm" onClick={startCamera}>
              Try camera again
            </Button>
          </div>
        </div>
      )}

      {/* Stopped / initial state */}
      {status === STOPPED && !photo && (
        <div className="flex flex-col items-center gap-3 p-6 rounded-container border border-primary-200 bg-primary-50/50 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            <svg
              aria-hidden="true"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM8 14a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Add Student Photo</p>
            <p className="text-xs text-primary-400 mt-0.5">
              Take a photo using your webcam or upload an existing image file from your device
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={startCamera}>
              Open Camera
            </Button>
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Photo File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
