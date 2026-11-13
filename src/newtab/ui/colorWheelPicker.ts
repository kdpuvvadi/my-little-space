import {
  clamp,
  hexToHsv,
  hexToRgb,
  hsvToHex,
  hsvToRgb,
  rgbToHex,
  type Hsv,
  type Rgb,
} from '../../shared/color';

export type ColorWheelPickerApi = {
  root: HTMLElement;
  /** Colored circle that opens the wheel. */
  trigger: HTMLButtonElement;
  setColor: (hex: string) => void;
  getColor: () => string;
  open: () => void;
  close: () => void;
  destroy: () => void;
};

type Options = {
  initialColor?: string;
  onChange: (hex: string) => void;
  /** Extra class on the trigger button. */
  triggerClass?: string;
};

const RING_SIZE = 196;
const RING_WIDTH = 18;
const SV_SIZE = 110;

/**
 * Canva-style accent control: spectrum circle trigger → round hue ring +
 * saturation/value square, with hex and RGB fields.
 */
export function createColorWheelPicker(options: Options): ColorWheelPickerApi {
  let hsv: Hsv = hexToHsv(options.initialColor ?? '#536a49') ?? {
    h: 100,
    s: 0.35,
    v: 0.42,
  };
  let open = false;
  let dragging: 'hue' | 'sv' | null = null;

  const root = document.createElement('div');
  root.className = 'cwp';
  root.innerHTML = `
    <button type="button" class="cwp-trigger ${options.triggerClass ?? ''}" title="Choose color" aria-label="Choose color" aria-haspopup="dialog" aria-expanded="false">
      <span class="cwp-trigger-fill" aria-hidden="true"></span>
    </button>
    <div class="cwp-popover" role="dialog" aria-label="Color picker" hidden>
      <div class="cwp-wheel">
        <canvas class="cwp-hue" width="${RING_SIZE}" height="${RING_SIZE}" aria-label="Hue ring"></canvas>
        <canvas class="cwp-sv" width="${SV_SIZE}" height="${SV_SIZE}" aria-label="Saturation and brightness"></canvas>
        <span class="cwp-hue-knob" aria-hidden="true"></span>
        <span class="cwp-sv-knob" aria-hidden="true"></span>
      </div>
      <div class="cwp-preview-row">
        <span class="cwp-preview" aria-hidden="true"></span>
        <div class="cwp-fields">
          <label class="cwp-field">
            <span>Hex</span>
            <input type="text" class="cwp-hex" spellcheck="false" maxlength="7" />
          </label>
          <div class="cwp-rgb">
            <label class="cwp-field"><span>R</span><input type="number" class="cwp-r" min="0" max="255" /></label>
            <label class="cwp-field"><span>G</span><input type="number" class="cwp-g" min="0" max="255" /></label>
            <label class="cwp-field"><span>B</span><input type="number" class="cwp-b" min="0" max="255" /></label>
          </div>
        </div>
      </div>
    </div>
  `;

  const trigger = root.querySelector('.cwp-trigger') as HTMLButtonElement;
  const triggerFill = root.querySelector('.cwp-trigger-fill') as HTMLElement;
  const popover = root.querySelector('.cwp-popover') as HTMLElement;
  const hueCanvas = root.querySelector('.cwp-hue') as HTMLCanvasElement;
  const svCanvas = root.querySelector('.cwp-sv') as HTMLCanvasElement;
  const hueKnob = root.querySelector('.cwp-hue-knob') as HTMLElement;
  const svKnob = root.querySelector('.cwp-sv-knob') as HTMLElement;
  const preview = root.querySelector('.cwp-preview') as HTMLElement;
  const hexInput = root.querySelector('.cwp-hex') as HTMLInputElement;
  const rInput = root.querySelector('.cwp-r') as HTMLInputElement;
  const gInput = root.querySelector('.cwp-g') as HTMLInputElement;
  const bInput = root.querySelector('.cwp-b') as HTMLInputElement;

  const hueCtx = hueCanvas.getContext('2d')!;
  const svCtx = svCanvas.getContext('2d')!;

  function emit(): void {
    options.onChange(hsvToHex(hsv));
  }

  function paintHueRing(): void {
    const ctx = hueCtx;
    const cx = RING_SIZE / 2;
    const cy = RING_SIZE / 2;
    const outer = RING_SIZE / 2 - 1;
    const inner = outer - RING_WIDTH;
    ctx.clearRect(0, 0, RING_SIZE, RING_SIZE);
    for (let angle = 0; angle < 360; angle++) {
      const start = ((angle - 1) * Math.PI) / 180;
      const end = ((angle + 1) * Math.PI) / 180;
      ctx.beginPath();
      ctx.arc(cx, cy, (outer + inner) / 2, start, end);
      ctx.strokeStyle = `hsl(${angle}, 100%, 50%)`;
      ctx.lineWidth = RING_WIDTH;
      ctx.stroke();
    }
    // Punch inner hole for the SV square.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function paintSvSquare(): void {
    const ctx = svCtx;
    const img = ctx.createImageData(SV_SIZE, SV_SIZE);
    for (let y = 0; y < SV_SIZE; y++) {
      for (let x = 0; x < SV_SIZE; x++) {
        const s = x / (SV_SIZE - 1);
        const v = 1 - y / (SV_SIZE - 1);
        const { r, g, b } = hsvToRgb({ h: hsv.h, s, v });
        const i = (y * SV_SIZE + x) * 4;
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function syncKnobs(): void {
    const cx = RING_SIZE / 2;
    const cy = RING_SIZE / 2;
    const midR = RING_SIZE / 2 - 1 - RING_WIDTH / 2;
    const rad = ((hsv.h - 90) * Math.PI) / 180;
    const hx = cx + midR * Math.cos(rad);
    const hy = cy + midR * Math.sin(rad);
    hueKnob.style.left = `${hx}px`;
    hueKnob.style.top = `${hy}px`;

    const svLeft = (RING_SIZE - SV_SIZE) / 2;
    const svTop = (RING_SIZE - SV_SIZE) / 2;
    svKnob.style.left = `${svLeft + hsv.s * (SV_SIZE - 1)}px`;
    svKnob.style.top = `${svTop + (1 - hsv.v) * (SV_SIZE - 1)}px`;
  }

  function syncFields(from: 'hsv' | 'hex' | 'rgb' = 'hsv'): void {
    const hex = hsvToHex(hsv);
    const rgb = hsvToRgb(hsv);
    triggerFill.style.background = hex;
    preview.style.background = hex;
    if (from !== 'hex') hexInput.value = hex;
    if (from !== 'rgb') {
      rInput.value = String(rgb.r);
      gInput.value = String(rgb.g);
      bInput.value = String(rgb.b);
    }
  }

  function applyHsv(next: Hsv, from: 'hsv' | 'hex' | 'rgb' = 'hsv', notify = true): void {
    hsv = {
      h: ((next.h % 360) + 360) % 360,
      s: clamp(next.s, 0, 1),
      v: clamp(next.v, 0, 1),
    };
    paintSvSquare();
    syncKnobs();
    syncFields(from);
    if (notify) emit();
  }

  function hueFromEvent(e: PointerEvent): void {
    const rect = hueCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left - RING_SIZE / 2;
    const y = e.clientY - rect.top - RING_SIZE / 2;
    let deg = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    applyHsv({ ...hsv, h: deg });
  }

  function svFromEvent(e: PointerEvent): void {
    const rect = svCanvas.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, SV_SIZE - 1);
    const y = clamp(e.clientY - rect.top, 0, SV_SIZE - 1);
    applyHsv({
      ...hsv,
      s: x / (SV_SIZE - 1),
      v: 1 - y / (SV_SIZE - 1),
    });
  }

  function ringHit(e: PointerEvent): boolean {
    const rect = hueCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left - RING_SIZE / 2;
    const y = e.clientY - rect.top - RING_SIZE / 2;
    const dist = Math.hypot(x, y);
    const outer = RING_SIZE / 2 - 1;
    const inner = outer - RING_WIDTH;
    return dist >= inner - 2 && dist <= outer + 2;
  }

  function openPopover(): void {
    if (open) return;
    open = true;
    popover.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    root.classList.add('is-open');
    // Position near trigger after layout.
    requestAnimationFrame(() => positionPopover());
  }

  function closePopover(): void {
    if (!open) return;
    open = false;
    dragging = null;
    popover.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-open');
  }

  function positionPopover(): void {
    const tr = trigger.getBoundingClientRect();
    const pad = 8;
    const width = popover.offsetWidth || 240;
    const height = popover.offsetHeight || 320;
    let left = tr.left;
    let top = tr.bottom + 8;
    if (left + width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - width - pad);
    }
    if (top + height > window.innerHeight - pad) {
      top = Math.max(pad, tr.top - height - 8);
    }
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  }

  paintHueRing();
  paintSvSquare();
  syncKnobs();
  syncFields();

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (open) closePopover();
    else openPopover();
  });

  hueCanvas.addEventListener('pointerdown', (e) => {
    if (!ringHit(e)) return;
    e.preventDefault();
    dragging = 'hue';
    hueCanvas.setPointerCapture(e.pointerId);
    hueFromEvent(e);
  });
  svCanvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    dragging = 'sv';
    svCanvas.setPointerCapture(e.pointerId);
    svFromEvent(e);
  });

  const onMove = (e: PointerEvent) => {
    if (dragging === 'hue') hueFromEvent(e);
    else if (dragging === 'sv') svFromEvent(e);
  };
  const onUp = () => {
    dragging = null;
  };
  hueCanvas.addEventListener('pointermove', onMove);
  svCanvas.addEventListener('pointermove', onMove);
  hueCanvas.addEventListener('pointerup', onUp);
  svCanvas.addEventListener('pointerup', onUp);
  hueCanvas.addEventListener('pointercancel', onUp);
  svCanvas.addEventListener('pointercancel', onUp);

  hexInput.addEventListener('change', () => {
    const next = hexToHsv(hexInput.value);
    if (!next) {
      hexInput.value = hsvToHex(hsv);
      return;
    }
    applyHsv(next, 'hex');
  });
  hexInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      hexInput.dispatchEvent(new Event('change'));
    }
  });

  const onRgbChange = () => {
    const rgb: Rgb = {
      r: clamp(Number(rInput.value) || 0, 0, 255),
      g: clamp(Number(gInput.value) || 0, 0, 255),
      b: clamp(Number(bInput.value) || 0, 0, 255),
    };
    applyHsv(hexToHsv(rgbToHex(rgb))!, 'rgb');
  };
  rInput.addEventListener('change', onRgbChange);
  gInput.addEventListener('change', onRgbChange);
  bInput.addEventListener('change', onRgbChange);

  const onDocPointer = (e: PointerEvent) => {
    if (!open) return;
    const t = e.target as Node | null;
    if (t && root.contains(t)) return;
    if (t && popover.contains(t)) return;
    closePopover();
  };
  // Popover is position:fixed — keep it on body while open for stacking.
  const ensurePopoverHost = () => {
    if (popover.parentElement !== document.body) {
      document.body.append(popover);
    }
  };
  trigger.addEventListener('click', () => {
    ensurePopoverHost();
  });

  document.addEventListener('pointerdown', onDocPointer, true);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      e.stopPropagation();
      closePopover();
    }
  };
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('resize', () => {
    if (open) positionPopover();
  });

  return {
    root,
    trigger,
    setColor: (hex: string) => {
      const next = hexToHsv(hex);
      if (!next) return;
      applyHsv(next, 'hsv', false);
    },
    getColor: () => hsvToHex(hsv),
    open: () => {
      ensurePopoverHost();
      openPopover();
    },
    close: closePopover,
    destroy: () => {
      document.removeEventListener('pointerdown', onDocPointer, true);
      document.removeEventListener('keydown', onKey, true);
      closePopover();
      popover.remove();
      root.remove();
    },
  };
}
