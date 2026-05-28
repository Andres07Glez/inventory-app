import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { IncidentImageService } from '../../../core/services/incidentImage/IncidentImageService .service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { IncidentImageDTO } from '../../../core/models/incident.model';
import imageCompression from 'browser-image-compression';
import { HttpErrorResponse } from '@angular/common/http';

const MAX_IMAGES    = 8; // igual que el backend
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};
 
@Component({
  selector: 'app-incident-image-upload',
  standalone: true,
  imports: [ToastModule, TooltipModule, ProgressBarModule, ConfirmPopupModule, DialogModule],
  templateUrl: './incident-image-upload.html',
  styleUrl:    './incident-image-upload.scss',
})
export class IncidentImageUpload implements OnInit {
 
  readonly incidentId = input.required<number>();
  readonly readOnly   = input<boolean>(false);
 
  private readonly imageService   = inject(IncidentImageService);
  private readonly messageService = inject(MessageService);
  private readonly confirmSvc     = inject(ConfirmationService);
 
  readonly images         = signal<IncidentImageDTO[]>([]);
  readonly isLoading      = signal(false);
  readonly uploadProgress = signal<number | null>(null);
  readonly isDragging     = signal(false);
  readonly previewUrl     = signal<string | null>(null);
 
  readonly canUploadMore = computed(
    () => !this.readOnly() && this.images().length < MAX_IMAGES
  );
  readonly maxImages = MAX_IMAGES;
 
  ngOnInit(): void { this.loadImages(); }
 
  loadImages(): void {
    this.isLoading.set(true);
    this.imageService.getImages(this.incidentId()).subscribe({
      next: imgs => { this.images.set(imgs); this.isLoading.set(false); },
      error: ()  => { this.isLoading.set(false); },
    });
  }
 
  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragging.set(true); }
  onDragLeave(): void { this.isDragging.set(false); }
 
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    this.processFiles(Array.from(event.dataTransfer?.files ?? []));
  }
 
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.processFiles(Array.from(input.files ?? []));
    input.value = '';
  }
 
  private async processFiles(files: File[]): Promise<void> {
    const remaining = MAX_IMAGES - this.images().length;
    const toProcess = files.slice(0, remaining);
 
    if (files.length > remaining) {
      this.messageService.add({
        severity: 'warn', summary: 'Límite alcanzado',
        detail: `Solo puedes subir ${remaining} imagen(es) más.`, life: 4000,
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
 
    this.imageService.upload(this.incidentId(), compressed).subscribe({
      next: img => {
        this.images.update(list => [...list, img]);
        this.uploadProgress.set(null);
        this.messageService.add({
          severity: 'success', summary: 'Evidencia subida',
          detail: 'Imagen de evidencia añadida.', life: 3000,
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
 
  openPreview(img: IncidentImageDTO): void { this.previewUrl.set(img.url); }
 
  confirmDelete(image: IncidentImageDTO, event: Event): void {
    this.confirmSvc.confirm({
      key: 'inc-img-delete',
      target: event.target as EventTarget,
      message: '¿Eliminar esta imagen de evidencia?',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger', size: 'small' },
      accept: () => this.deleteImage(image),
    });
  }
 
  private deleteImage(image: IncidentImageDTO): void {
    this.imageService.delete(this.incidentId(), image.id).subscribe({
      next: () => {
        this.images.update(list => list.filter(img => img.id !== image.id));
        this.messageService.add({
          severity: 'info', summary: 'Eliminada',
          detail: 'Imagen de evidencia eliminada.', life: 3000,
        });
      },
    });
  }
}
