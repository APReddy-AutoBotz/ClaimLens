import { memo, useRef, useEffect, useState } from 'react';
import { type VerdictLabel } from './VerdictBanner';
import styles from './ProofCard.module.css';

interface ProofCardProps {
  verdict: VerdictLabel;
  score: number;
  topReasons: string[];
  receiptsUrl?: string;
  productName?: string;
  onGenerated?: (dataUrl: string) => void;
}

const VERDICT_MICROCOPY: Record<VerdictLabel, string> = {
  allow: "Marked safe… for now.",
  modify: "Proceed with caution.",
  avoid: "Do not invite this into your body."
};

const VERDICT_COLORS: Record<VerdictLabel, string> = {
  allow: '#10B981',
  modify: '#F59E0B',
  avoid: '#EF4444'
};

/**
 * ProofCard - Lightweight shareable image component
 * Generates a visual proof card with verdict, score, top reasons, and QR code
 * Requirements: 8.1, 8.2
 */
export const ProofCard = memo(function ProofCard({
  verdict,
  score,
  topReasons,
  receiptsUrl,
  productName,
  onGenerated
}: ProofCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Generate QR code for receipts URL
  useEffect(() => {
    if (!receiptsUrl) return;

    // Use a simple QR code generation approach
    // In production, you'd use a library like qrcode or similar
    const generateQRCode = async () => {
      try {
        // For now, we'll create a placeholder
        // In a real implementation, use: import QRCode from 'qrcode'
        // const dataUrl = await QRCode.toDataURL(receiptsUrl);
        // setQrCodeDataUrl(dataUrl);
        
        // Placeholder: Create a simple data URL representing a QR code
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 120, 120);
          ctx.fillStyle = '#000000';
          ctx.font = '10px monospace';
          ctx.fillText('QR Code', 30, 60);
          ctx.fillText('Placeholder', 20, 75);
          setQrCodeDataUrl(canvas.toDataURL());
        }
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      }
    };

    generateQRCode();
  }, [receiptsUrl]);

  // Generate proof card image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (optimized for social sharing)
    canvas.width = 600;
    canvas.height = 400;

    // Background - Haunted Lens dark theme
    ctx.fillStyle = '#0B1220';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(20, 184, 166, 0.05)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header - ClaimLens branding
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('ClaimLens', 40, 50);
    
    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText('Proof-first food claim verification', 40, 75);

    // Product name (if provided)
    if (productName) {
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      const truncated = productName.length > 40 ? productName.substring(0, 37) + '...' : productName;
      ctx.fillText(truncated, 40, 110);
    }

    // Verdict badge
    const verdictColor = VERDICT_COLORS[verdict];
    const verdictText = verdict.charAt(0).toUpperCase() + verdict.slice(1);
    
    ctx.fillStyle = verdictColor + '40';
    ctx.fillRect(40, 130, 200, 60);
    
    ctx.strokeStyle = verdictColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 130, 200, 60);
    
    ctx.fillStyle = verdictColor;
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText(verdictText, 60, 165);

    // Trust Score
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    ctx.fillText(score.toString(), 280, 175);
    
    ctx.fillStyle = '#94A3B8';
    ctx.font = '20px system-ui, -apple-system, sans-serif';
    ctx.fillText('/ 100', 350, 175);

    // Verdict microcopy
    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'italic 14px system-ui, -apple-system, sans-serif';
    const microcopy = VERDICT_MICROCOPY[verdict];
    ctx.fillText(microcopy, 40, 220);

    // Top reasons
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('Key Findings:', 40, 260);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    const displayReasons = topReasons.slice(0, 2);
    displayReasons.forEach((reason, index) => {
      const y = 285 + (index * 25);
      const truncated = reason.length > 50 ? reason.substring(0, 47) + '...' : reason;
      ctx.fillText(`• ${truncated}`, 50, y);
    });

    // QR Code section
    if (qrCodeDataUrl) {
      const qrImage = new Image();
      qrImage.onload = () => {
        ctx.drawImage(qrImage, 460, 240, 100, 100);
        
        ctx.fillStyle = '#94A3B8';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.fillText('Scan for', 475, 355);
        ctx.fillText('full receipts', 465, 370);
        
        // Generate final data URL
        if (onGenerated) {
          onGenerated(canvas.toDataURL('image/png'));
        }
      };
      qrImage.src = qrCodeDataUrl;
    } else {
      // No QR code, just generate the card
      if (onGenerated) {
        onGenerated(canvas.toDataURL('image/png'));
      }
    }

    // Footer
    ctx.fillStyle = '#64748B';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText('No tricks. Just proof.', 40, 370);

  }, [verdict, score, topReasons, qrCodeDataUrl, productName, onGenerated]);

  return (
    <canvas 
      ref={canvasRef} 
      className={styles.canvas}
      aria-label="Proof card image"
    />
  );
});
