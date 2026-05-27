import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MaintenanceCreate } from '../maintenance-create/maintenance-create';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MaintenanceService } from '../../../core/services/maintenance/maintenance.service';
import { CONDITION_LABELS, CONDITION_SEVERITY, MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPE_SEVERITY, MaintenanceResponse, MaintenanceSummary, MaintenanceType } from '../../../core/models/maintenance.model';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

interface TypeFilterOption { label: string; value: MaintenanceType | null }
type PrimeSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
  selector:    'app-maintenance',
  standalone:  true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    CardModule, TableModule, ButtonModule,
    TagModule, SelectModule, SkeletonModule,
    TooltipModule, ToastModule, DialogModule,
    InputTextModule, ConfirmDialogModule,
    MaintenanceCreate, HasRoleDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './maintenance.html',
  styleUrl:    './maintenance.scss',
})
export class MaintenanceComponent implements OnInit {

  private readonly maintenanceService  = inject(MaintenanceService);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly records      = signal<MaintenanceSummary[]>([]);
  readonly loading      = signal(true);
  readonly selectedType = signal<MaintenanceType | null>(null);

  private readonly createDialog = viewChild.required(MaintenanceCreate);

  // ── Punto 3: búsqueda dinámica ──────────────────────────────────────────────
  protected searchQuery = '';

  // ── Punto 7: filtros de fecha ───────────────────────────────────────────────
  protected dateRangeStart = '';
  protected dateRangeEnd   = '';
  protected showCurrentMonthOnly = false;

  /** Filas visibles tras aplicar búsqueda y filtros de fecha en el cliente. */
  get filteredRecords(): MaintenanceSummary[] {
    let list = this.records();

    // Filtro texto
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(r =>
        r.inventoryNumber.toLowerCase().includes(q) ||
        (r.performedBy ?? '').toLowerCase().includes(q) ||
        r.createdByName.toLowerCase().includes(q)
      );
    }

    // Filtro mes actual
    if (this.showCurrentMonthOnly) {
      const now  = new Date();
      const year = now.getFullYear();
      const mon  = now.getMonth();
      list = list.filter(r => {
        const d = new Date(r.performedDate);
        return d.getFullYear() === year && d.getMonth() === mon;
      });
    }

    // Filtro rango de fechas
    if (this.dateRangeStart) {
      list = list.filter(r => r.performedDate >= this.dateRangeStart);
    }
    if (this.dateRangeEnd) {
      list = list.filter(r => r.performedDate <= this.dateRangeEnd);
    }

    return list;
  }

  // ── Punto 1: modal de detalle ───────────────────────────────────────────────
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

  readonly typeFilterOptions: TypeFilterOption[] = [
    { label: 'Todos los tipos', value: null },
    { label: 'Preventivo',      value: 'PREVENTIVE' },
    { label: 'Correctivo',      value: 'CORRECTIVE' },
    { label: 'Garantía',        value: 'WARRANTY' },
  ];

  ngOnInit(): void {
    this.loadRecords();
  }

  onTypeFilterChange(value: MaintenanceType | null): void {
    this.selectedType.set(value);
    this.loadRecords();
  }

  openCreateDialog(): void {
    this.createDialog().open();
  }

  onCreated(): void {
    this.loadRecords();
  }

  // ── Punto 7: toggle mes actual ──────────────────────────────────────────────

  toggleCurrentMonth(): void {
    this.showCurrentMonthOnly = !this.showCurrentMonthOnly;
    // Al activar mes actual, limpia rango manual para evitar conflicto
    if (this.showCurrentMonthOnly) {
      this.dateRangeStart = '';
      this.dateRangeEnd   = '';
    }
  }

  clearDateFilters(): void {
    this.showCurrentMonthOnly = false;
    this.dateRangeStart       = '';
    this.dateRangeEnd         = '';
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

  // ── Punto 5: eliminar desde modal de detalle ─────────────────────────────────

  confirmDelete(record: MaintenanceResponse): void {
    this.confirmationService.confirm({
      header:      '¿Eliminar registro?',
      message:     `Se eliminará el mantenimiento del bien <b>${record.inventoryNumber}</b> del ${new Date(record.performedDate).toLocaleDateString('es-MX')}. Esta acción no se puede deshacer.`,
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
    this.maintenanceService.getAll(this.selectedType() ?? undefined).subscribe({
      next:  (data) => { this.records.set(data); this.loading.set(false); },
      error: ()     => this.loading.set(false),
    });
  }
}