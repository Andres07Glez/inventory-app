import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { AssetImageDTO } from '../../../core/models/asset.model';
import { AssetImageService } from '../../../core/services/asset-image/asset-image.service';
import imageCompression from 'browser-image-compression';


const MAX_IMAGES    = 5;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,          // 500 KB máximo tras comprimir
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

@Component({
  selector: 'app-asset-image-upload',
  standalone:true,
  imports: [ToastModule, TooltipModule, ProgressBarModule],
  templateUrl: './asset-image-upload.html',
  styleUrl: './asset-image-upload.scss',
})
export class AssetImageUpload implements OnInit{
  /** ID del bien al que pertenecen las imágenes. Requerido. */
  readonly assetId = input.required<number>();

  private readonly imageService   = inject(AssetImageService);
  private readonly messageService = inject(MessageService);

  readonly images         = signal<AssetImageDTO[]>([]);
  readonly isLoading      = signal(false);
  readonly uploadProgress = signal<number | null>(null);
  readonly isDragging     = signal(false);

  readonly canUploadMore = () => this.images().length < MAX_IMAGES;

  ngOnInit(): void {
    this.loadImages();
  }

  // ── Carga inicial ─────────────────────────────────────────────────────────

  loadImages(): void {
    this.isLoading.set(true);
    this.imageService.getImages(this.assetId()).subscribe({
      next: imgs => { this.images.set(imgs); this.isLoading.set(false); },
      error: ()  => { this.isLoading.set(false); },
    });
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.processFiles(files);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.processFiles(files);
    input.value = ''; // permite seleccionar el mismo archivo de nuevo
  }

  // ── Procesamiento y upload ─────────────────────────────────────────────────

  private async processFiles(files: File[]): Promise<void> {
    const remaining = MAX_IMAGES - this.images().length;
    const toProcess = files.slice(0, remaining);

    if (files.length > remaining) {
      this.messageService.add({
        severity: 'warn', summary: 'Límite alcanzado',
        detail: `Solo se pueden subir ${remaining} imagen(es) más.`, life: 4000,
      });
    }

    for (const file of toProcess) {
      if (!ALLOWED_TYPES.has(file.type)) {
        this.messageService.add({
          severity: 'warn', summary: 'Formato inválido',
          detail: `"${file.name}" no es JPEG, PNG ni WEBP.`, life: 4000,
        });
        continue;
      }
      await this.compressAndUpload(file);
    }
  }

  private async compressAndUpload(file: File): Promise<void> {
    this.uploadProgress.set(0);
    let compressed: File;

    try {
      // Comprimir en el cliente antes de enviar
      compressed = await imageCompression(file, COMPRESSION_OPTIONS);
      this.uploadProgress.set(30);
    } catch {
      this.messageService.add({
        severity: 'error', summary: 'Error de compresión',
        detail: `No se pudo comprimir "${file.name}".`, life: 4000,
      });
      this.uploadProgress.set(null);
      return;
    }

    this.imageService.upload(this.assetId(), compressed).subscribe({
      next: (img) => {
        this.images.update(list => [...list, img]);
        this.uploadProgress.set(null);
        this.messageService.add({
          severity: 'success', summary: 'Imagen subida',
          detail: img.isPrimary ? 'Establecida como imagen principal.' : 'Imagen añadida.', life: 3000,
        });
      },
      error: (err: HttpErrorResponse) => {
        this.uploadProgress.set(null);
        this.messageService.add({
          severity: 'error', summary: 'Error al subir',
          detail: err.error?.message ?? 'No se pudo subir la imagen.', life: 5000,
        });
      },
    });
  }

  // ── Acciones sobre imágenes existentes ────────────────────────────────────

  setPrimary(image: AssetImageDTO): void {
    if (image.isPrimary) return;
    this.imageService.setPrimary(this.assetId(), image.id).subscribe({
      next: (updated) => {
        this.images.update(list =>
          list.map(img => ({ ...img, isPrimary: img.id === updated.id }))
        );
      },
    });
  }

  confirmDelete(image: AssetImageDTO): void {
    // Sin ConfirmDialog para no añadir dependencia extra; usamos el toast de acción
    this.imageService.delete(this.assetId(), image.id).subscribe({
      next: () => {
        this.images.update(list => list.filter(img => img.id !== image.id));
        this.messageService.add({
          severity: 'info', summary: 'Eliminada', detail: 'Imagen eliminada.', life: 3000,
        });
      },
    });
  }
}
