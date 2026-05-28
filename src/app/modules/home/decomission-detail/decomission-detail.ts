import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { PanelModule } from 'primeng/panel';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DecommissionService } from '../../../core/services/decomission/decommission.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MessageService } from 'primeng/api';
import { DECOMMISSION_STATUS_LABEL, DECOMMISSION_STATUS_SEVERITY, DecommissionDetail, DecommissionStatus } from '../../../core/models/decommission.model';

type PrimeSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-decommission-detail',
  standalone: true,
  imports: [
    ButtonModule, DividerModule, MessageModule,
    PanelModule, SkeletonModule, TagModule, ToastModule,
  ],
  templateUrl: './decomission-detail.html',
  styleUrl:    './decomission-detail.scss',
})
export class DecommissionDetailComponent implements OnInit {

  private readonly route               = inject(ActivatedRoute);
  private readonly router              = inject(Router);
  private readonly decommissionService = inject(DecommissionService);
  private readonly authService         = inject(AuthService);
  private readonly messageService      = inject(MessageService);

  readonly decommission = signal<DecommissionDetail | null>(null);
  readonly loading      = signal(true);
  readonly confirming   = signal(false);

  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) { this.router.navigate(['/bajas']); return; }
    this.load(id);
  }

  load(id: number): void {
    this.loading.set(true);
    this.decommissionService.getById(id).subscribe({
      next:  d  => { this.decommission.set(d); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudo cargar el proceso de baja.', life: 4000,
        });
        this.router.navigate(['/bajas']);
      },
    });
  }

  confirmDecommission(): void {
    const d = this.decommission();
    if (!d) return;

    this.confirming.set(true);
    this.decommissionService.confirm(d.id).subscribe({
      next: updated => {
        this.decommission.set(updated);
        this.confirming.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Baja confirmada',
          detail: `El bien ${updated.assetInventoryNumber} ha sido dado de baja definitivamente.`,
          life: 5000,
        });
      },
      error: err => {
        this.confirming.set(false);
        const detail = err.status === 403
          ? 'No tienes permisos para confirmar bajas definitivas.'
          : (err.error?.message ?? 'No se pudo confirmar la baja.');
        this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
      },
    });
  }

  goBack(): void { this.router.navigate(['/bajas']); }

  goToAsset(): void {
    const id = this.decommission()?.assetId;
    if (id) this.router.navigate(['/inventario/bienes', id]);
  }

  goToIncident(): void {
    const id = this.decommission()?.incidentId;
    if (id) this.router.navigate(['/incidencias', id]);
  }

  // ── UI helpers ────────────────────────────────────────────────────────────

  statusLabel    = (s: DecommissionStatus) => DECOMMISSION_STATUS_LABEL[s] ?? s;
  statusSeverity = (s: DecommissionStatus): PrimeSeverity =>
    (DECOMMISSION_STATUS_SEVERITY[s] ?? 'secondary') as PrimeSeverity;

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  formatDateOnly(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }
}
