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
import { IncidentDetail, ClosureType, INCIDENT_STATUS_LABEL, INCIDENT_STATUS_SEVERITY, REPAIR_TYPE_LABEL, RepairType, IncidentStatus } from '../../../core/models/incident.model';
import { Dialog, DialogModule } from "primeng/dialog";


type PrimeSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule, CardModule, DialogModule, DividerModule,
    MessageModule, SkeletonModule, TagModule, TextareaModule, ToastModule,
    IncidentImageUpload,
  ],
  templateUrl: './incident-detail.html',
  styleUrl:    './incident-detail.scss',
})
export class IncidentDetailComponent implements OnInit {

  private readonly route           = inject(ActivatedRoute);
  private readonly router          = inject(Router);
  private readonly incidentService = inject(IncidentService);
  private readonly authService     = inject(AuthService);
  private readonly messageService  = inject(MessageService);

  readonly incident = signal<IncidentDetail | null>(null);
  readonly loading  = signal(true);
  readonly saving   = signal(false);

  // ── Panel de cierre (único punto con notas) ───────────────────────────────

  readonly resolutionNotes = signal('');

  // ── Diálogo de avance de estado (sin notas desde SP-16 v2) ───────────────

  readonly showStatusDialog = signal(false);

  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');
  readonly closureFormValid = computed(() => this.resolutionNotes().trim().length > 0);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) { this.router.navigate(['/incidencias']); return; }
    this.loadIncident(id);
  }

  loadIncident(id: number): void {
    this.loading.set(true);
    this.incidentService.getById(id).subscribe({
      next:  data => { this.incident.set(data); this.loading.set(false); },
      error: ()   => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudo cargar la incidencia.', life: 4000,
        });
        this.router.navigate(['/incidencias']);
      },
    });
  }

  // ── Diálogo OPEN→IN_PROGRESS / IN_PROGRESS→RESOLVED ──────────────────────

  openStatusDialog(): void {
    // SP-16 v2: no hay nada que resetear, el diálogo ya no tiene campos
    this.showStatusDialog.set(true);
  }

  confirmStatusUpdate(): void {
    const inc = this.incident();
    if (!inc) return;

    const next: IncidentStatus = inc.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED';
    const label = INCIDENT_STATUS_LABEL[next];

    this.saving.set(true);
    // SP-16 v2: solo se envía el status, sin notas
    this.incidentService.updateStatus(inc.id, { status: next }).subscribe({
      next: updated => {
        this.incident.set(updated);
        this.saving.set(false);
        this.showStatusDialog.set(false);
        this.messageService.add({
          severity: 'success', summary: 'Estado actualizado',
          detail: `Incidencia movida a "${label}".`, life: 3000,
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

  // ── Cierre STANDARD (único punto con notas) ───────────────────────────────

  closeStandard(): void {
    const inc = this.incident();
    if (!inc) return;

    this.saving.set(true);
    this.incidentService.close(inc.id, { resolutionNotes: this.resolutionNotes() }).subscribe({
      next: updated => {
        this.incident.set(updated);
        this.saving.set(false);
        this.resolutionNotes.set('');
        this.messageService.add({
          severity: 'success', summary: 'Incidencia cerrada',
          detail: 'La incidencia se cerró correctamente.', life: 3000,
        });
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

  goBack(): void { this.router.navigate(['/incidencias']); }

  goToAsset(): void {
    const id = this.incident()?.assetId;
    if (id) this.router.navigate(['/inventario/bienes', id]);
  }

  goToCreateDecommission(): void {
    const inc = this.incident();
    if (!inc) return;
    this.router.navigate(['/bajas/nueva'], {
      queryParams: { assetId: inc.assetId, incidentId: inc.id },
    });
  }

  // ── UI helpers ────────────────────────────────────────────────────────────

  statusLabel       = (s: string) => INCIDENT_STATUS_LABEL[s as IncidentStatus] ?? s;
  statusSeverity    = (s: string): PrimeSeverity =>
    (INCIDENT_STATUS_SEVERITY[s as IncidentStatus] ?? 'secondary') as PrimeSeverity;
  repairLabel       = (r: string | null) =>
    r ? (REPAIR_TYPE_LABEL[r as keyof typeof REPAIR_TYPE_LABEL] ?? r) : '—';
  conditionLabel    = (c: string | null) =>
    ({ GOOD: 'Bueno', REGULAR: 'Regular', BAD: 'Malo' }[c ?? ''] ?? '—');
  conditionSeverity = (c: string | null): PrimeSeverity =>
    ({ GOOD: 'success', REGULAR: 'warn', BAD: 'danger' }[c ?? ''] ?? 'secondary') as PrimeSeverity;

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  formatDateOnly(iso: string | null): string {
    if (!iso) return '—';
    // incidentDate llega como YYYY-MM-DD; parsearlo con hora para evitar off-by-one de zona horaria
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }
}
