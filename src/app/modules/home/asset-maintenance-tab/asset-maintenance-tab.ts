import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MaintenanceCreate } from '../maintenance-create/maintenance-create';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MaintenanceService } from '../../../core/services/maintenance/maintenance.service';
import { CONDITION_LABELS, CONDITION_SEVERITY, MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPE_SEVERITY, MaintenanceResponse, MaintenanceSummary } from '../../../core/models/maintenance.model';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

type PrimeSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
  selector:    'app-asset-maintenance-tab',
  standalone:  true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    TableModule, ButtonModule, TagModule,
    SkeletonModule, TooltipModule, ToastModule,
    DialogModule, InputTextModule, ConfirmDialogModule,
    MaintenanceCreate, HasRoleDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './asset-maintenance-tab.html',
  styleUrl:    './asset-maintenance-tab.scss',
})
export class AssetMaintenanceTab implements OnInit {

  readonly assetId = input.required<number>();

  private readonly maintenanceService  = inject(MaintenanceService);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly records  = signal<MaintenanceSummary[]>([]);
  readonly loading  = signal(true);

  private readonly createDialog = viewChild.required(MaintenanceCreate);

  // ── Punto 3: búsqueda dinámica ──────────────────────────────────────────────
  protected searchQuery = '';

  get filteredRecords(): MaintenanceSummary[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.records();
    return this.records().filter(r =>
      r.performedDate.includes(q) ||
      (r.performedBy ?? '').toLowerCase().includes(q) ||
      r.createdByName.toLowerCase().includes(q)
    );
  }

  // ── Punto 1 + 5: modal de detalle ───────────────────────────────────────────
  readonly detailVisible  = signal(false);
  readonly detailRecord   = signal<MaintenanceResponse | null>(null);
  readonly loadingDetail  = signal(false);
  readonly deletingDetail = signal(false);

  // ── Helpers de presentación ─────────────────────────────────────────────────

  getTypeLabel(type: any): string {
    return MAINTENANCE_TYPE_LABELS[type as keyof typeof MAINTENANCE_TYPE_LABELS];
  }

  getTypeSeverity(type: any): PrimeSeverity {
    return MAINTENANCE_TYPE_SEVERITY[type as keyof typeof MAINTENANCE_TYPE_SEVERITY] as PrimeSeverity;
  }

  getCondLabel(status: any): string {
    return CONDITION_LABELS[status as keyof typeof CONDITION_LABELS];
  }

  getCondSeverity(status: any): PrimeSeverity {
    return CONDITION_SEVERITY[status as keyof typeof CONDITION_SEVERITY] as PrimeSeverity;
  }

  ngOnInit(): void {
    this.loadRecords();
  }

  openCreateDialog(): void {
    this.createDialog().open();
  }

  onCreated(): void {
    this.loadRecords();
  }

  // ── Punto 1: abrir modal de detalle ─────────────────────────────────────────

  openDetail(row: MaintenanceSummary): void {
    this.detailRecord.set(null);
    this.detailVisible.set(true);
    this.loadingDetail.set(true);

    this.maintenanceService.getById(row.id).subscribe({
      next:  (detail) => { this.detailRecord.set(detail); this.loadingDetail.set(false); },
      error: ()       => {
        this.loadingDetail.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle.' });
      },
    });
  }

  // ── Punto 5: eliminar ────────────────────────────────────────────────────────

  confirmDelete(record: MaintenanceResponse): void {
    this.confirmationService.confirm({
      header:      '¿Eliminar registro?',
      message:     `Se eliminará el mantenimiento del ${new Date(record.performedDate).toLocaleDateString('es-MX')}. Esta acción no se puede deshacer.`,
      icon:         'pi pi-exclamation-triangle',
      acceptLabel:  'Sí, eliminar',
      rejectLabel:  'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      accept: () => this.deleteRecord(record.id),
    });
  }

  private deleteRecord(id: number): void {
    this.deletingDetail.set(true);
    this.maintenanceService.delete(id).subscribe({
      next: () => {
        this.deletingDetail.set(false);
        this.detailVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary:  'Registro eliminado',
          detail:   'El registro de mantenimiento fue eliminado correctamente.',
        });
        this.loadRecords();
      },
      error: (err) => {
        this.deletingDetail.set(false);
        this.messageService.add({
          severity: 'error',
          summary:  'Error al eliminar',
          detail:   err?.error?.message ?? 'No se pudo eliminar el registro.',
        });
      },
    });
  }

  private loadRecords(): void {
    this.loading.set(true);
    this.maintenanceService.getByAssetId(this.assetId()).subscribe({
      next:  (data) => { this.records.set(data); this.loading.set(false); },
      error: ()     => this.loading.set(false),
    });
  }
}
