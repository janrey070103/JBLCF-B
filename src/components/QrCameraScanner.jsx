import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Button from './Button.jsx';

const isPermissionError = (error) => {
  const text = String(error?.name || error?.message || error || '').toLowerCase();
  return text.includes('notallowed') || text.includes('permission') || text.includes('denied');
};

export default function QrCameraScanner({ onScan, onError, disabled = false }) {
  const elementIdRef = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef(null);
  const hasScannedRef = useRef(false);
  const [status, setStatus] = useState('starting');

  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
  }, [onScan, onError]);

  useEffect(() => {
    if (disabled) return undefined;

    let alive = true;
    const scanner = new Html5Qrcode(elementIdRef.current);
    scannerRef.current = scanner;
    hasScannedRef.current = false;

    async function startScanner() {
      setStatus('starting');
      
      const onScanCallback = async (decodedText) => {
        if (hasScannedRef.current) return;
        hasScannedRef.current = true;
        setStatus('scanned');
        try {
          await scanner.pause(true);
        } catch (e) {}
        onScanRef.current?.(decodedText.trim());
      };

      try {
        try {
          // Attempt back camera first
          await scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
            onScanCallback
          );
        } catch (initialError) {
          // Fallback to front camera (common on laptops) if environment camera is missing
          if (isPermissionError(initialError)) throw initialError; // don't retry if denied
          await scanner.start(
            { facingMode: 'user' },
            { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
            onScanCallback
          );
        }
        
        if (alive) setStatus('scanning');
      } catch (error) {
        if (!alive) return;
        setStatus('error');
        onErrorRef.current?.(
          isPermissionError(error)
            ? {
                code: 'PERMISSION_DENIED',
                message: 'Camera permission was denied. Allow camera access in your browser settings, then try again.',
              }
            : {
                code: 'CAMERA_UNAVAILABLE',
                message: 'Could not start the camera. Check that a webcam is connected and not being used by another app.',
              },
        );
      }
    }

    startScanner();

    return () => {
      alive = false;
      try {
        scanner.stop()
          .then(() => {
            try { scanner.clear(); } catch (e) {}
          })
          .catch(() => {
            try { scanner.clear(); } catch (e) {}
          });
      } catch (err) {
        // scanner.stop() throws synchronously if it hasn't fully started yet.
        try { scanner.clear(); } catch (e) {}
      }
    };
  }, [disabled]);

  const restart = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    hasScannedRef.current = false;
    try {
      await scanner.resume();
      setStatus('scanning');
    } catch {
      setStatus('starting');
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-container border border-primary-100 bg-primary-900 shadow-card">
        <div id={elementIdRef.current} className="min-h-[280px] w-full" />
        {status === 'starting' && (
          <div className="absolute inset-0 grid place-items-center bg-primary-900 text-white">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-32 w-32 animate-pulse rounded-container border border-white/30 bg-white/10" />
              <p className="text-sm text-white/80">Starting camera...</p>
            </div>
          </div>
        )}
        {status === 'scanning' && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-60 w-60 rounded-container border-2 border-secondary shadow-[0_0_0_999px_rgba(2,11,31,0.35)]" />
          </div>
        )}
      </div>
      {status === 'scanned' && (
        <div className="flex justify-center">
          <Button type="button" variant="tertiary" size="sm" onClick={restart}>
            Scan Another QR
          </Button>
        </div>
      )}
    </div>
  );
}
