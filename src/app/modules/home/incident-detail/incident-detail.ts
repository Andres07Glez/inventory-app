import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { FileUploadModule } from 'primeng/fileupload';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { IncidentImageUpload } from '../incident-image-upload/incident-image-upload';
import { IncidentService } from '../../../core/services/incident/incident.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MessageService } from 'primeng/api';
import { IncidentDetail, ClosureType, INCIDENT_STATUS_LABEL, INCIDENT_STATUS_SEVERITY, REPAIR_TYPE_LABEL, RepairType } from '../../../core/models/incident.model';
import { Dialog } from "primeng/dialog";
interface SelectOption<T> { label: string; value: T; }

type PrimeSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;
 
@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [
    FormsModule, RouterLink,
    ButtonModule, CardModule, DividerModule, FloatLabelModule,
    PanelModule, SelectModule, SkeletonModule, TagModule, TextareaModule,
    MessageModule, ToastModule, FileUploadModule,
    IncidentImageUpload,
    Dialog
],
  templateUrl: './incident-detail.html',
  styleUrl:    './incident-detail.scss',
})
export class IncidentDetailComponent implements OnInit {
 
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly incidentService = inject(IncidentService);
  private readonly authService    = inject(AuthService);
  private readonly messageService = inject(MessageService);
 
  // ── Estado principal ──────────────────────────────────────────────────────
  readonly incident = signal<IncidentDetail | null>(null);
  readonly loading  = signal(true);
  readonly saving   = signal(false);
 
  // ── Estado del panel de resolución (RESOLVED → CLOSED) ───────────────────
  readonly selectedClosureType  = signal<ClosureType | null>(null);
  readonly resolutionNotes      = signal('');
  readonly selectedRepairType   = signal<RepairType | null>(null);
  // Decommission
  readonly justification        = signal('');
  readonly selectedPdf          = signal<File | null>(null);
  readonly pdfFileName          = signal<string | null>(null);
 
  // ── Estado del diálogo OPEN→IN_PROGRESS / IN_PROGRESS→RESOLVED ───────────
  readonly showStatusDialog     = signal(false);
  readonly dialogNotes          = signal('');
  readonly dialogRepairType     = signal<RepairType | null>(null);
 
  // ── Computed ──────────────────────────────────────────────────────────────
 
  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');
 
  readonly canDecommission = computed(
    () => this.isAdmin() && this.selectedClosureType() === 'DECOMMISSION'
  );
 
  readonly closureFormValid = computed(() => {
    if (!this.selectedClosureType()) return false;
    if (!this.resolutionNotes().trim()) return false;
    if (this.selectedClosureType() === 'DECOMMISSION') {
      return this.justification().trim().length > 0 && this.selectedPdf() !== null;
    }
    return true;
  });
 
  // ── Opciones de selects ───────────────────────────────────────────────────
 
  readonly closureOptions: SelectOption<ClosureType>[] = [
    { label: 'Resolución normal',                 value: 'STANDARD' },
    { label: 'Daño Irreparable / Baja definitiva', value: 'DECOMMISSION' },
  ];
 
  readonly repairTypeOptions: SelectOption<RepairType>[] = [
    { label: 'Reparación interna', value: 'INTERNAL' },
    { label: 'Reparación externa', value: 'EXTERNAL' },
  ];
 
  // ─────────────────────────────────────────────────────────────────────────
 
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) { this.router.navigate(['/incidencias']); return; }
    this.loadIncident(id);
  }
 
  loadIncident(id: number): void {
    this.loading.set(true);
    this.incidentService.getById(id).subscribe({
      next: data => { this.incident.set(data); this.loading.set(false); },
      error: ()  => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la incidencia.', life: 4000 });
        this.router.navigate(['/incidencias']);
      },
    });
  }
 
  // ── Transiciones OPEN→IN_PROGRESS y IN_PROGRESS→RESOLVED ─────────────────
 
  openStatusDialog(): void {
    this.dialogNotes.set('');
    this.dialogRepairType.set(this.incident()?.repairType ?? null);
    this.showStatusDialog.set(true);
  }
 
  confirmStatusUpdate(): void {
    const inc = this.incident();
    if (!inc) return;
    const next = inc.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED';
 
    this.saving.set(true);
    this.incidentService.updateStatus(inc.id, {
      status:          next,
      resolutionNotes: this.dialogNotes().trim() || null,
      repairType:      this.dialogRepairType(),
    }).subscribe({
      next: updated => {
        this.incident.set(updated);
        this.saving.set(false);
        this.showStatusDialog.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `Incidencia movida a "${INCIDENT_STATUS_LABEL[next]}".`,
          life: 3000,
        });
      },
      error: err => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err.error?.message ?? 'No se pudo actualizar el estado.', life: 5000,
        });
      },
    });
  }
 
  // ── Cierre STANDARD ───────────────────────────────────────────────────────
 
  closeStandard(): void {
    const inc = this.incident();
    if (!inc) return;
 
    this.saving.set(true);
    this.incidentService.close(inc.id, {
      resolutionNotes: this.resolutionNotes(),
      repairType:      this.selectedRepairType(),
    }).subscribe({
      next: updated => {
        this.incident.set(updated);
        this.saving.set(false);
        this.messageService.add({
          severity: 'success', summary: 'Incidencia cerrada',
          detail: 'La incidencia se cerró correctamente.', life: 3000,
        });
        this.resetClosureForm();
      },
      error: err => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err.error?.message ?? 'No se pudo cerrar la incidencia.', life: 5000,
        });
      },
    });
  }
 
  // ── Baja definitiva (solo ADMIN) ──────────────────────────────────────────
 
  confirmDecommission(): void {
    const inc = this.incident();
    if (!inc || !this.selectedPdf()) return;
 
    this.saving.set(true);
    this.incidentService
      .confirmDecommission(inc.id, this.justification(), this.selectedPdf()!)
      .subscribe({
        next: updated => {
          this.incident.set(updated);
          this.saving.set(false);
          this.messageService.add({
            severity: 'success', summary: 'Baja confirmada',
            detail: `El bien ${updated.assetInventoryNumber} ha sido dado de baja. Incidencia cerrada.`,
            life: 5000,
          });
          this.resetClosureForm();
        },
        error: err => {
          this.saving.set(false);
          const detail = err.status === 403
            ? 'No tienes permisos para confirmar bajas definitivas.'
            : (err.error?.message ?? 'No se pudo confirmar la baja.');
          this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
        },
      });
  }
 
  onPdfSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
 
    if (file.type !== 'application/pdf') {
      this.messageService.add({
        severity: 'warn', summary: 'Archivo inválido',
        detail: 'Solo se acepta un archivo PDF como acta de baja.', life: 4000,
      });
      return;
    }
    this.selectedPdf.set(file);
    this.pdfFileName.set(file.name);
  }
 
  removePdf(): void { this.selectedPdf.set(null); this.pdfFileName.set(null); }
 
  // ── Helpers de UI ─────────────────────────────────────────────────────────
 
  statusLabel       = (s: string) => INCIDENT_STATUS_LABEL[s as keyof typeof INCIDENT_STATUS_LABEL] ?? s;
  statusSeverity    = (s: string): PrimeSeverity => (INCIDENT_STATUS_SEVERITY[s as keyof typeof INCIDENT_STATUS_SEVERITY] ?? 'secondary') as PrimeSeverity;
  repairLabel       = (r: string | null) => r ? (REPAIR_TYPE_LABEL[r as keyof typeof REPAIR_TYPE_LABEL] ?? r) : '—';
  conditionLabel    = (c: string | null) =>
    ({ GOOD: 'Bueno', REGULAR: 'Regular', BAD: 'Malo' }[c ?? ''] ?? '—');
  conditionSeverity = (c: string | null): PrimeSeverity =>
    (({ GOOD: 'success', REGULAR: 'warn', BAD: 'danger' }[c ?? ''] ?? 'secondary') as PrimeSeverity);
 
  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
 
  goBack(): void { this.router.navigate(['/incidencias']); }
  goToAsset(): void {
    const id = this.incident()?.assetId;
    if (id) this.router.navigate(['/inventario/bienes', id]);
  }
 
  private resetClosureForm(): void {
    this.selectedClosureType.set(null);
    this.resolutionNotes.set('');
    this.selectedRepairType.set(null);
    this.justification.set('');
    this.selectedPdf.set(null);
    this.pdfFileName.set(null);
  }
}
