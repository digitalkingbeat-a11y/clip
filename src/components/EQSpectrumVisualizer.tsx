import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Activity,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  RefreshCw,
  Eye,
  Sliders,
  Radio,
} from "lucide-react";

interface EQSpectrumVisualizerProps {
  lowGain: number; // dB (-15 to +15)
  lowFreq: number; // Hz (e.g. 80)
  midGain: number; // dB (-15 to +15)
  midFreq: number; // Hz (e.g. 1000)
  midQ: number; // Q factor (e.g. 1.0)
  highGain: number; // dB (-15 to +15)
  highFreq: number; // Hz (e.g. 10000)
  isPlaying?: boolean;
  analyserNode?: AnalyserNode | null;
  onUpdateGains?: (updates: {
    lowGain?: number;
    midGain?: number;
    highGain?: number;
    lowFreq?: number;
    midFreq?: number;
    highFreq?: number;
    midQ?: number;
  }) => void;
}

export const EQSpectrumVisualizer: React.FC<EQSpectrumVisualizerProps> = ({
  lowGain,
  lowFreq,
  midGain,
  midFreq,
  midQ,
  highGain,
  highFreq,
  isPlaying = false,
  analyserNode = null,
  onUpdateGains,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Display mode: "bars" | "curve" | "pre_post"
  const [displayMode, setDisplayMode] = useState<"bars" | "curve" | "pre_post">("bars");
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
  const [hoverInfo, setHoverInfo] = useState<{ freq: number; db: number; x: number; y: number } | null>(null);
  const [hoveredBand, setHoveredBand] = useState<"low" | "mid" | "high" | null>(null);
  const [draggingBand, setDraggingBand] = useState<"low" | "mid" | "high" | null>(null);

  // Peak hold state for 42 frequency bins
  const peakHoldRef = useRef<number[]>(new Array(42).fill(0));
  const peakHoldTimerRef = useRef<number[]>(new Array(42).fill(0));
  const fftBufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // Audio test oscillator with real-time biquad filter nodes
  const auditionAudioRef = useRef<{
    ctx: AudioContext;
    osc: OscillatorNode;
    gain: GainNode;
    eqL: BiquadFilterNode;
    eqM: BiquadFilterNode;
    eqH: BiquadFilterNode;
    analyser: AnalyserNode;
  } | null>(null);

  // Sync audition audio filters when props change
  useEffect(() => {
    if (auditionAudioRef.current) {
      const { ctx, eqL, eqM, eqH } = auditionAudioRef.current;
      eqL.gain.setTargetAtTime(lowGain, ctx.currentTime, 0.02);
      eqL.frequency.setTargetAtTime(lowFreq, ctx.currentTime, 0.02);

      eqM.gain.setTargetAtTime(midGain, ctx.currentTime, 0.02);
      eqM.frequency.setTargetAtTime(midFreq, ctx.currentTime, 0.02);
      eqM.Q.setTargetAtTime(midQ, ctx.currentTime, 0.02);

      eqH.gain.setTargetAtTime(highGain, ctx.currentTime, 0.02);
      eqH.frequency.setTargetAtTime(highFreq, ctx.currentTime, 0.02);
    }
  }, [lowGain, lowFreq, midGain, midFreq, midQ, highGain, highFreq]);

  // Stop audition audio on unmount
  useEffect(() => {
    return () => {
      if (auditionAudioRef.current) {
        try {
          auditionAudioRef.current.osc.stop();
          auditionAudioRef.current.ctx.close();
        } catch (e) {}
      }
    };
  }, []);

  const toggleAudition = () => {
    if (isAuditioning) {
      if (auditionAudioRef.current) {
        try {
          auditionAudioRef.current.gain.gain.linearRampToValueAtTime(0, auditionAudioRef.current.ctx.currentTime + 0.05);
          setTimeout(() => {
            auditionAudioRef.current?.osc.stop();
            auditionAudioRef.current?.ctx.close();
            auditionAudioRef.current = null;
          }, 60);
        } catch (e) {}
      }
      setIsAuditioning(false);
    } else {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtxClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // 3-Band Biquad Filters for the test tone
        const eqL = ctx.createBiquadFilter();
        eqL.type = "lowshelf";
        eqL.frequency.value = lowFreq;
        eqL.gain.value = lowGain;

        const eqM = ctx.createBiquadFilter();
        eqM.type = "peaking";
        eqM.frequency.value = midFreq;
        eqM.Q.value = midQ;
        eqM.gain.value = midGain;

        const eqH = ctx.createBiquadFilter();
        eqH.type = "highshelf";
        eqH.frequency.value = highFreq;
        eqH.gain.value = highGain;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, ctx.currentTime);

        // Low volume safety
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.08);

        // Connect chain: osc -> eqL -> eqM -> eqH -> analyser -> gain -> ctx.destination
        osc.connect(eqL);
        eqL.connect(eqM);
        eqM.connect(eqH);
        eqH.connect(analyser);
        analyser.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        auditionAudioRef.current = { ctx, osc, gain, eqL, eqM, eqH, analyser };
        setIsAuditioning(true);
      } catch (e) {
        setIsAuditioning(true);
      }
    }
  };

  // Calculate EQ filter magnitude response in dB at any frequency f (Hz)
  const calculateEQResponseAtFreq = useCallback(
    (f: number): number => {
      // 1. Low Shelf Response
      const lowRatio = f / Math.max(20, lowFreq);
      const lowWeight = 1 / (1 + Math.pow(lowRatio, 2));
      const lowDb = lowGain * lowWeight;

      // 2. Mid Peaking Bell Response
      const octavesFromMid = Math.abs(Math.log2(Math.max(1, f) / Math.max(1, midFreq)));
      const bandwidth = Math.max(0.2, 1.8 / Math.max(0.3, midQ));
      const midWeight = Math.max(0, 1 - Math.pow(octavesFromMid / bandwidth, 2));
      const midDb = midGain * midWeight;

      // 3. High Shelf Response
      const highRatio = f / Math.max(100, highFreq);
      const highWeight = Math.pow(highRatio, 2) / (1 + Math.pow(highRatio, 2));
      const highDb = highGain * highWeight;

      return lowDb + midDb + highDb;
    },
    [lowGain, lowFreq, midGain, midFreq, midQ, highGain, highFreq]
  );

  // Main real-time rendering loop with High-DPI support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    let animId: number;
    const numBins = 42;
    const minFreq = 20;
    const maxFreq = 20000;

    let phase = 0;

    const render = () => {
      const container = containerRef.current;
      if (!container) {
        animId = requestAnimationFrame(render);
        return;
      }

      const rect = container.getBoundingClientRect();
      const cssWidth = rect.width;
      const cssHeight = rect.height;
      if (cssWidth === 0 || cssHeight === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const targetCanvasWidth = Math.floor(cssWidth * dpr);
      const targetCanvasHeight = Math.floor(cssHeight * dpr);

      if (canvas.width !== targetCanvasWidth || canvas.height !== targetCanvasHeight) {
        canvas.width = targetCanvasWidth;
        canvas.height = targetCanvasHeight;
      }

      phase += 0.05;

      // Save context and scale for High-DPI
      ctx2d.save();
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      const width = cssWidth;
      const height = cssHeight;

      // Clear with dark studio background
      ctx2d.fillStyle = "#0A0E17";
      ctx2d.fillRect(0, 0, width, height);

      // 1. Draw Subtle Grid Lines & dB Reference Scales
      const zeroY = height * 0.5; // 0 dB line
      const topY = height * 0.12; // +15 dB line
      const botY = height * 0.88; // -15 dB line

      ctx2d.strokeStyle = "#172033";
      ctx2d.lineWidth = 1;

      // Horizontal dB lines
      const dbLines = [
        { db: 15, y: topY },
        { db: 10, y: topY + (zeroY - topY) * (5 / 15) },
        { db: 5, y: topY + (zeroY - topY) * (10 / 15) },
        { db: 0, y: zeroY },
        { db: -5, y: zeroY + (botY - zeroY) * (5 / 15) },
        { db: -10, y: zeroY + (botY - zeroY) * (10 / 15) },
        { db: -15, y: botY },
      ];

      dbLines.forEach(({ db, y }) => {
        ctx2d.beginPath();
        if (db === 0) {
          ctx2d.strokeStyle = "rgba(100, 116, 139, 0.4)";
          ctx2d.setLineDash([4, 4]);
        } else {
          ctx2d.strokeStyle = "rgba(30, 41, 59, 0.5)";
          ctx2d.setLineDash([]);
        }
        ctx2d.moveTo(0, y);
        ctx2d.lineTo(width, y);
        ctx2d.stroke();
        ctx2d.setLineDash([]);

        // dB labels on left margin
        ctx2d.fillStyle = db === 0 ? "rgba(226, 232, 240, 0.7)" : "rgba(100, 116, 139, 0.5)";
        ctx2d.font = "8.5px monospace";
        ctx2d.textAlign = "left";
        ctx2d.fillText(db > 0 ? `+${db}` : `${db}`, 4, y - 2);
      });

      // Frequency Vertical Grid Lines
      const gridFreqs = [30, 60, 120, 250, 500, 1000, 2500, 5000, 10000, 16000];
      gridFreqs.forEach((freq) => {
        const norm = Math.log10(freq / minFreq) / Math.log10(maxFreq / minFreq);
        const x = norm * width;

        ctx2d.beginPath();
        ctx2d.strokeStyle = freq === 1000 ? "rgba(100, 116, 139, 0.35)" : "rgba(30, 41, 59, 0.4)";
        ctx2d.moveTo(x, 0);
        ctx2d.lineTo(x, height);
        ctx2d.stroke();

        ctx2d.fillStyle = "rgba(100, 116, 139, 0.6)";
        ctx2d.font = "8px monospace";
        ctx2d.textAlign = "center";
        const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
        ctx2d.fillText(label, x, height - 3);
      });

      // Band Influence Shaded Regions (Low, Mid, High)
      const lowBoundNorm = Math.log10(250 / minFreq) / Math.log10(maxFreq / minFreq);
      const highBoundNorm = Math.log10(4000 / minFreq) / Math.log10(maxFreq / minFreq);

      // Low Band Zone (0 to 250Hz) - Amber tint
      ctx2d.fillStyle = "rgba(245, 158, 11, 0.035)";
      ctx2d.fillRect(0, 0, lowBoundNorm * width, height);

      // Mid Band Zone (250Hz to 4kHz) - Cyan tint
      ctx2d.fillStyle = "rgba(6, 182, 212, 0.03)";
      ctx2d.fillRect(lowBoundNorm * width, 0, (highBoundNorm - lowBoundNorm) * width, height);

      // High Band Zone (4kHz to 20kHz) - Rose tint
      ctx2d.fillStyle = "rgba(244, 63, 94, 0.035)";
      ctx2d.fillRect(highBoundNorm * width, 0, width - highBoundNorm * width, height);

      // 2. Collect Real or Synthetic FFT Data & Apply 3-Band Gain Impact
      const effectiveAnalyser = auditionAudioRef.current?.analyser || analyserNode;
      let dataArray: Uint8Array<ArrayBuffer> | null = null;
      if (effectiveAnalyser && (isPlaying || isAuditioning)) {
        try {
          if (!fftBufferRef.current || fftBufferRef.current.length !== effectiveAnalyser.frequencyBinCount) {
            fftBufferRef.current = new Uint8Array(new ArrayBuffer(effectiveAnalyser.frequencyBinCount));
          }
          dataArray = fftBufferRef.current;
          effectiveAnalyser.getByteFrequencyData(dataArray);
        } catch (e) {}
      }

      const barWidth = Math.max(2, width / numBins - 1.5);
      const prePoints: { x: number; y: number }[] = [];
      const postPoints: { x: number; y: number }[] = [];

      for (let i = 0; i < numBins; i++) {
        const norm = i / (numBins - 1);
        const freq = minFreq * Math.pow(maxFreq / minFreq, norm);
        const x = norm * (width - barWidth) + barWidth / 2;

        // Base pre-EQ amplitude (0 to 1)
        let rawMag = 0;
        if (dataArray && effectiveAnalyser && (isPlaying || isAuditioning)) {
          // Map log frequency to linear FFT bin index
          const sampleRate = effectiveAnalyser.context?.sampleRate || 44100;
          const binIndex = Math.min(
            dataArray.length - 1,
            Math.max(0, Math.floor((freq / (sampleRate / 2)) * dataArray.length))
          );
          rawMag = dataArray[binIndex] / 255;
        } else if (isPlaying || isAuditioning) {
          // Dynamic organic spectrum animation model
          const bassJitter = Math.sin(phase * 1.8 + i * 0.4) * 0.15 + Math.cos(phase * 0.7) * 0.1;
          const vocalJitter = Math.sin(phase * 2.5 + i * 0.8) * 0.18;
          const highJitter = Math.cos(phase * 3.2 + i * 1.2) * 0.12;

          let naturalShape = 0.55 * Math.exp(-norm * 2.2); // Natural 4.5dB/octave acoustic slope
          if (norm < 0.25) naturalShape += bassJitter + 0.15;
          else if (norm < 0.65) naturalShape += vocalJitter + 0.12;
          else naturalShape += highJitter + 0.08;

          rawMag = Math.max(0.08, Math.min(0.92, naturalShape));
        } else {
          // Idle ambient floor with resting response
          const idleSlope = 0.35 * Math.exp(-norm * 1.8) + 0.05;
          rawMag = Math.max(0.05, idleSlope + Math.sin(i * 0.4) * 0.02);
        }

        // Apply 3-Band Parametric EQ transfer gain impact
        const eqDeltaDb = calculateEQResponseAtFreq(freq);
        const eqLinearFactor = Math.pow(10, eqDeltaDb / 24); // Scale impact gracefully to canvas height
        const postMag = Math.max(0.02, Math.min(1.2, rawMag * eqLinearFactor));

        // Coordinate calculations
        const preH = rawMag * (height * 0.72);
        const preY = height - preH - 8;

        const postH = postMag * (height * 0.78);
        const postY = height - postH - 8;

        prePoints.push({ x, y: preY });
        postPoints.push({ x, y: postY });

        // Update Peak Hold
        if (postY < peakHoldRef.current[i]) {
          peakHoldRef.current[i] = postY;
          peakHoldTimerRef.current[i] = 18; // Hold frames
        } else {
          if (peakHoldTimerRef.current[i] > 0) {
            peakHoldTimerRef.current[i]--;
          } else {
            peakHoldRef.current[i] += 1.8; // Smooth decay
            if (peakHoldRef.current[i] > height - 8) peakHoldRef.current[i] = height - 8;
          }
        }

        // Band color gradient based on frequency
        let colorTop = "#F59E0B";
        let colorBottom = "rgba(245, 158, 11, 0.15)";
        if (freq < 250) {
          colorTop = "#F59E0B"; // Amber for Bass
          colorBottom = "rgba(245, 158, 11, 0.15)";
        } else if (freq < 4000) {
          colorTop = "#06B6D4"; // Cyan for Mids
          colorBottom = "rgba(6, 182, 212, 0.15)";
        } else {
          colorTop = "#F43F5E"; // Rose for Highs
          colorBottom = "rgba(244, 63, 94, 0.15)";
        }

        // Render Spectrum Bars
        if (displayMode === "bars" || displayMode === "pre_post") {
          // If in pre/post mode: Draw ghosted pre-EQ bar
          if (displayMode === "pre_post") {
            ctx2d.fillStyle = "rgba(148, 163, 184, 0.18)";
            ctx2d.fillRect(x - barWidth / 2, preY, barWidth, preH);
            ctx2d.strokeStyle = "rgba(148, 163, 184, 0.4)";
            ctx2d.lineWidth = 1;
            ctx2d.strokeRect(x - barWidth / 2, preY, barWidth, preH);
          }

          // Draw Post-EQ spectrum bar
          const barGrad = ctx2d.createLinearGradient(0, postY, 0, height);
          barGrad.addColorStop(0, colorTop);
          barGrad.addColorStop(1, colorBottom);

          ctx2d.fillStyle = barGrad;
          ctx2d.fillRect(x - barWidth / 2, postY, barWidth, postH);

          // Top highlight line on each bar
          ctx2d.fillStyle = "#FFFFFF";
          ctx2d.fillRect(x - barWidth / 2, postY, barWidth, 1.5);

          // Peak Hold dot
          const peakY = peakHoldRef.current[i];
          ctx2d.fillStyle = colorTop;
          ctx2d.fillRect(x - barWidth / 2, peakY, barWidth, 2);
        }
      }

      // 3. Render Smooth Continuous Curve Mode
      if (displayMode === "curve") {
        if (postPoints.length > 1) {
          ctx2d.beginPath();
          ctx2d.moveTo(postPoints[0].x, postPoints[0].y);
          for (let i = 1; i < postPoints.length - 1; i++) {
            const xc = (postPoints[i].x + postPoints[i + 1].x) / 2;
            const yc = (postPoints[i].y + postPoints[i + 1].y) / 2;
            ctx2d.quadraticCurveTo(postPoints[i].x, postPoints[i].y, xc, yc);
          }
          ctx2d.lineTo(postPoints[postPoints.length - 1].x, postPoints[postPoints.length - 1].y);

          // Stroke
          ctx2d.strokeStyle = "#F59E0B";
          ctx2d.lineWidth = 2.5;
          ctx2d.stroke();

          // Fill Under Curve
          ctx2d.lineTo(width, height - 8);
          ctx2d.lineTo(0, height - 8);
          ctx2d.closePath();

          const curveGrad = ctx2d.createLinearGradient(0, topY, 0, height);
          curveGrad.addColorStop(0, "rgba(245, 158, 11, 0.45)");
          curveGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.25)");
          curveGrad.addColorStop(1, "rgba(244, 63, 94, 0.05)");
          ctx2d.fillStyle = curveGrad;
          ctx2d.fill();
        }
      }

      // 4. Draw EQ Transfer Response Curve (Golden Line showing direct gain shaping)
      ctx2d.beginPath();
      for (let px = 0; px <= width; px += 4) {
        const normX = px / width;
        const f = minFreq * Math.pow(maxFreq / minFreq, normX);
        const eqDb = calculateEQResponseAtFreq(f);
        // Map dB (-15 to +15) to Y
        const curveY = zeroY - (eqDb / 15) * (zeroY - topY);

        if (px === 0) ctx2d.moveTo(px, curveY);
        else ctx2d.lineTo(px, curveY);
      }
      ctx2d.strokeStyle = "#FACC15"; // Yellow neon
      ctx2d.lineWidth = 2.5;
      ctx2d.shadowColor = "#FACC15";
      ctx2d.shadowBlur = 8;
      ctx2d.stroke();
      ctx2d.shadowBlur = 0; // Reset shadow

      // 5. Draw Interactive EQ Band Handles on Curve
      const drawBandHandle = (
        bandKey: "low" | "mid" | "high",
        f: number,
        gain: number,
        color: string,
        label: string
      ) => {
        const norm = Math.log10(f / minFreq) / Math.log10(maxFreq / minFreq);
        const hx = norm * width;
        const hy = zeroY - (gain / 15) * (zeroY - topY);
        const isHovered = hoveredBand === bandKey;
        const isDragging = draggingBand === bandKey;

        // Outer pulsing ring when hovered or dragging
        if (isHovered || isDragging) {
          ctx2d.beginPath();
          ctx2d.arc(hx, hy, isDragging ? 12 : 10, 0, Math.PI * 2);
          ctx2d.fillStyle = isDragging ? "rgba(255, 255, 255, 0.3)" : "rgba(250, 204, 21, 0.25)";
          ctx2d.fill();
        }

        // Handle outer ring
        ctx2d.beginPath();
        ctx2d.arc(hx, hy, isDragging ? 7.5 : 6.5, 0, Math.PI * 2);
        ctx2d.fillStyle = color;
        ctx2d.fill();
        ctx2d.lineWidth = 2;
        ctx2d.strokeStyle = "#FFFFFF";
        ctx2d.stroke();

        // Handle text label
        ctx2d.fillStyle = "#FFFFFF";
        ctx2d.font = isDragging ? "bold 10px monospace" : "bold 9px monospace";
        ctx2d.textAlign = "center";
        ctx2d.fillText(label, hx, hy - 11);
      };

      drawBandHandle("low", lowFreq, lowGain, "#F59E0B", `LOW ${lowGain >= 0 ? "+" : ""}${lowGain}dB`);
      drawBandHandle("mid", midFreq, midGain, "#06B6D4", `MID ${midGain >= 0 ? "+" : ""}${midGain}dB`);
      drawBandHandle("high", highFreq, highGain, "#F43F5E", `HIGH ${highGain >= 0 ? "+" : ""}${highGain}dB`);

      // 6. Crosshair Tooltip if hovered
      if (hoverInfo) {
        ctx2d.beginPath();
        ctx2d.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx2d.setLineDash([2, 2]);
        ctx2d.moveTo(hoverInfo.x, 0);
        ctx2d.lineTo(hoverInfo.x, height);
        ctx2d.moveTo(0, hoverInfo.y);
        ctx2d.lineTo(width, hoverInfo.y);
        ctx2d.stroke();
        ctx2d.setLineDash([]);
      }

      // Restore high-DPI transform
      ctx2d.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [
    displayMode,
    isPlaying,
    isAuditioning,
    analyserNode,
    lowGain,
    lowFreq,
    midGain,
    midFreq,
    midQ,
    highGain,
    highFreq,
    hoverInfo,
    hoveredBand,
    draggingBand,
    calculateEQResponseAtFreq,
  ]);

  // Convert client coordinates to frequencies and dB
  const getCoordsInfo = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const normX = Math.max(0, Math.min(1, x / rect.width));
    const minFreq = 20;
    const maxFreq = 20000;
    const freq = Math.round(minFreq * Math.pow(maxFreq / minFreq, normX));

    // Convert Y to dB (-15 to +15)
    const zeroY = rect.height * 0.5;
    const topY = rect.height * 0.12;
    const rawDb = ((zeroY - y) / (zeroY - topY)) * 15;
    const db = Number(Math.max(-15, Math.min(15, rawDb)).toFixed(1));

    return { x, y, freq, db, rect, minFreq, maxFreq, zeroY, topY };
  };

  // Check if position is near any band node handle
  const getBandUnderCursor = (x: number, y: number, rectWidth: number, rectHeight: number) => {
    const minFreq = 20;
    const maxFreq = 20000;
    const zeroY = rectHeight * 0.5;
    const topY = rectHeight * 0.12;

    const checkDist = (f: number, gain: number) => {
      const norm = Math.log10(f / minFreq) / Math.log10(maxFreq / minFreq);
      const hx = norm * rectWidth;
      const hy = zeroY - (gain / 15) * (zeroY - topY);
      return Math.hypot(x - hx, y - hy);
    };

    if (checkDist(lowFreq, lowGain) < 18) return "low";
    if (checkDist(midFreq, midGain) < 18) return "mid";
    if (checkDist(highFreq, highGain) < 18) return "high";
    return null;
  };

  // Handle Mouse Down on Canvas for interactive dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const info = getCoordsInfo(e.clientX, e.clientY);
    if (!info) return;

    const band = getBandUnderCursor(info.x, info.y, info.rect.width, info.rect.height);
    if (band) {
      setDraggingBand(band);
    }
  };

  // Handle Mouse Move on Canvas for hover readout and interactive dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const info = getCoordsInfo(e.clientX, e.clientY);
    if (!info) return;

    setHoverInfo({ freq: info.freq, db: info.db, x: info.x, y: info.y });

    if (draggingBand) {
      // Actively dragging node
      if (draggingBand === "low") {
        onUpdateGains?.({ lowGain: info.db });
      } else if (draggingBand === "mid") {
        // Clamp mid frequency between 250Hz and 4500Hz
        const clampedFreq = Math.round(Math.max(250, Math.min(4500, info.freq)) / 25) * 25;
        onUpdateGains?.({ midGain: info.db, midFreq: clampedFreq });
      } else if (draggingBand === "high") {
        onUpdateGains?.({ highGain: info.db });
      }
    } else {
      // Check hover
      const band = getBandUnderCursor(info.x, info.y, info.rect.width, info.rect.height);
      setHoveredBand(band);
    }
  };

  const handleMouseUp = () => {
    setDraggingBand(null);
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
    setHoveredBand(null);
    setDraggingBand(null);
  };

  return (
    <div className="space-y-2 select-none">
      {/* Top Visualizer Control Bar */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-amber-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-mono">
            <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Real-Time Spectrum Analyzer
          </span>
          <span
            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
              isPlaying || isAuditioning
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-gray-800 text-gray-400 border border-gray-700"
            }`}
          >
            {isPlaying ? "LIVE PLAYBACK" : isAuditioning ? "AUDITION SIGNAL" : "FLOOR / STANDBY"}
          </span>
          <span className="hidden sm:inline-block text-[10px] text-gray-400 font-mono">
            (Drag nodes on curve to sculpt tone)
          </span>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-1.5">
          {/* Audition Signal Generator Button */}
          <button
            type="button"
            onClick={toggleAudition}
            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors border ${
              isAuditioning
                ? "bg-emerald-500/25 text-emerald-200 border-emerald-500/60 shadow-xs"
                : "bg-[#161F2E] text-gray-400 hover:text-white border-[#273247]"
            }`}
            title="Generate test audio tone routed through active 3-band EQ filters"
          >
            {isAuditioning ? (
              <Volume2 className="w-3 h-3 text-emerald-400 animate-bounce" />
            ) : (
              <VolumeX className="w-3 h-3 text-gray-400" />
            )}
            <span>{isAuditioning ? "Auditioning" : "Test Signal"}</span>
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#111723] rounded-md p-0.5 border border-[#273247] text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setDisplayMode("bars")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                displayMode === "bars"
                  ? "bg-amber-500 text-black font-extrabold shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
              title="FFT Spectrum Bars with Peak Hold"
            >
              Bars
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode("curve")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                displayMode === "curve"
                  ? "bg-amber-500 text-black font-extrabold shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Smooth Continuous RTA Wave"
            >
              Curve
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode("pre_post")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                displayMode === "pre_post"
                  ? "bg-amber-500 text-black font-extrabold shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Pre-EQ vs Post-EQ Spectrum Overlay"
            >
              Pre/Post
            </button>
          </div>
        </div>
      </div>

      {/* Main Spectrum Visualizer Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-36 bg-[#0A0E17] border border-[#1E2638] rounded-xl relative overflow-hidden shadow-inner group"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className={`w-full h-full block ${
            draggingBand ? "cursor-grabbing" : hoveredBand ? "cursor-grab" : "cursor-crosshair"
          }`}
        />

        {/* Realtime Cursor Readout Badge */}
        {hoverInfo && (
          <div
            className="absolute pointer-events-none z-20 bg-black/90 text-white font-mono text-[9px] px-2 py-1 rounded border border-white/20 shadow-lg -translate-x-1/2 -translate-y-8"
            style={{ left: `${hoverInfo.x}px`, top: `${hoverInfo.y}px` }}
          >
            <span className="text-amber-300 font-bold">
              {hoverInfo.freq >= 1000 ? `${(hoverInfo.freq / 1000).toFixed(1)}kHz` : `${hoverInfo.freq}Hz`}
            </span>
            <span className="text-gray-400 mx-1">•</span>
            <span className={hoverInfo.db >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
              {hoverInfo.db >= 0 ? `+${hoverInfo.db}` : hoverInfo.db} dB
            </span>
            {hoveredBand && (
              <span className="ml-1.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold uppercase text-[8px]">
                {hoveredBand} Drag
              </span>
            )}
          </div>
        )}

        {/* Bottom Legend Badges */}
        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between pointer-events-none text-[9px] font-mono text-gray-400 px-1">
          <span className="flex items-center gap-1 text-amber-300 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Low ({lowGain >= 0 ? `+${lowGain}` : lowGain}dB @ {lowFreq}Hz)
          </span>

          <span className="flex items-center gap-1 text-cyan-300 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Mid ({midGain >= 0 ? `+${midGain}` : midGain}dB @ {midFreq}Hz)
          </span>

          <span className="flex items-center gap-1 text-rose-300 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            High ({highGain >= 0 ? `+${highGain}` : highGain}dB @ {highFreq >= 1000 ? `${highFreq / 1000}k` : `${highFreq}`}Hz)
          </span>
        </div>
      </div>
    </div>
  );
};
