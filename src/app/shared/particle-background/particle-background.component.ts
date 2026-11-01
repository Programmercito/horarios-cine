import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  radius: number;
  alpha: number;
}

const MOUSE_REACH = 140;
const LINK_DISTANCE = 120;
const MAX_PARTICLES = 140;

@Component({
  selector: 'app-particle-background',
  standalone: true,
  template: `<canvas #canvas class="particle-canvas" aria-hidden="true"></canvas>`,
  styles: [
    `
      .particle-canvas {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        pointer-events: none;
      }
    `,
  ],
})
export class ParticleBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly zone = inject(NgZone);
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private width = 0;
  private height = 0;
  private frameId = 0;
  private mouse = { x: -9999, y: -9999 };

  private readonly onResize = () => this.resize();
  private readonly onMouseMove = (event: MouseEvent) => {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  };
  private readonly onMouseLeave = () => {
    this.mouse.x = -9999;
    this.mouse.y = -9999;
  };

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    document.addEventListener('mouseleave', this.onMouseLeave);
    this.zone.runOutsideAngular(() => this.frame());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseleave', this.onMouseLeave);
  }

  private resize(): void {
    const canvas = this.canvasRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = this.width * dpr;
    canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(MAX_PARTICLES, Math.floor((this.width * this.height) / 11000));
    this.particles = Array.from({ length: count }, () => this.createParticle());
  }

  private createParticle(): Particle {
    const baseVx = (Math.random() - 0.5) * 0.35;
    const baseVy = (Math.random() - 0.5) * 0.35;
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: baseVx,
      vy: baseVy,
      baseVx,
      baseVy,
      radius: 0.8 + Math.random() * 1.8,
      alpha: 0.3 + Math.random() * 0.5,
    };
  }

  private frame = (): void => {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Las partículas se alejan del mouse y vuelven poco a poco a su deriva base.
    for (const p of this.particles) {
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < MOUSE_REACH && dist > 0) {
        const force = (1 - dist / MOUSE_REACH) * 0.15;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
      p.vx += (p.baseVx - p.vx) * 0.03;
      p.vy += (p.baseVy - p.vy) * 0.03;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < this.particles.length; i++) {
      const a = this.particles[i];
      const mouseDist = Math.hypot(a.x - this.mouse.x, a.y - this.mouse.y);
      if (mouseDist < MOUSE_REACH) {
        ctx.strokeStyle = `rgba(139, 228, 243, ${0.35 * (1 - mouseDist / MOUSE_REACH)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(this.mouse.x, this.mouse.y);
        ctx.stroke();
      }
      for (let j = i + 1; j < this.particles.length; j++) {
        const b = this.particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < LINK_DISTANCE) {
          ctx.strokeStyle = `rgba(139, 228, 243, ${0.12 * (1 - dist / LINK_DISTANCE)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const p of this.particles) {
      ctx.fillStyle = `rgba(139, 228, 243, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!this.reducedMotion) {
      this.frameId = requestAnimationFrame(this.frame);
    }
  };
}
