import { Component, inject, OnInit, signal } from '@angular/core';
import { AssetDetailResponseDTO, AssignmentHistoryDTO, CONDITION_STATUS_OPTIONS, ConditionStatus, SelectOption, UpdateConditionRequest } from '../../../core/models/asset.model';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AssetService } from '../../../core/services/asset/asset.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';



type ConditionSeverity = 'success' | 'warn' | 'danger';
type LifecycleSeverity = 'info' | 'success' | 'secondary' | 'warn' | 'contrast' | 'danger';
// ── Helpers de UI ─────────────────────────────────────────────────────────────

const CONDITION_LABEL: Record<ConditionStatus, string> = {
  GOOD: 'Bueno', REGULAR: 'Regular', BAD: 'Malo',
};

// El tipo del valor del Record ya es ConditionSeverity → el compilador lo infiere correctamente
const CONDITION_SEVERITY: Record<ConditionStatus, ConditionSeverity> = {
  GOOD: 'success', REGULAR: 'warn', BAD: 'danger',
};

const LIFECYCLE_LABEL: Record<string, string> = {
  REGISTERED: 'Registrado', AVAILABLE: 'Disponible', ASSIGNED: 'Asignado',
  IN_MAINTENANCE: 'Mantenimiento', IN_WARRANTY: 'Garantía', DECOMMISSIONED: 'Dado de baja',
};

const LIFECYCLE_SEVERITY: Record<string, LifecycleSeverity> = {
  REGISTERED: 'info', AVAILABLE: 'success', ASSIGNED: 'secondary',
  IN_MAINTENANCE: 'warn', IN_WARRANTY: 'contrast', DECOMMISSIONED: 'danger',
};

@Component({
  selector: 'app-asset-detail',
  standalone:true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,
    TabsModule, TagModule, ButtonModule, SelectModule, ToastModule,
    SkeletonModule, TimelineModule, ConfirmDialogModule, TableModule,
    TooltipModule, CardModule],
  templateUrl: './asset-detail.html',
  styleUrl: './asset-detail.scss',
})
export class AssetDetail implements OnInit{

  private readonly route               = inject(ActivatedRoute);
  private readonly router              = inject(Router);
  private readonly assetService        = inject(AssetService);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  // ── Estado de la vista ────────────────────────────────────────────────────
  asset             = signal<AssetDetailResponseDTO | null>(null);
  assignments       = signal<AssignmentHistoryDTO[]>([]);
  loading           = signal(true);
  loadingAssignments = signal(true);

  // ── SP-09: estado del formulario de condición ─────────────────────────────
  selectedCondition: ConditionStatus | null = null;
  savingCondition   = signal(false);
  activeTab = 'resumen';

  readonly conditionOptions: SelectOption<ConditionStatus>[] = CONDITION_STATUS_OPTIONS;

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || isNaN(id)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'ID de bien inválido.' });
      this.router.navigate(['/inventario/bienes']);
      return;
    }

    // Carga paralela: detalle del bien + historial de asignaciones
    // forkJoin espera a que ambas respondan antes de actualizar la vista
    this.assetService.getAssetById(id).subscribe({
      next: (data) => {
        this.asset.set(data);
        this.selectedCondition = data.conditionStatus;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el bien. Verifica la conexión.',
        });
      },
    });

    this.assetService.getAssignmentHistory(id).subscribe({
      next: (data) => { this.assignments.set(data); this.loadingAssignments.set(false); },
      error: ()     => { this.assignments.set([]);   this.loadingAssignments.set(false); },
    });
  }

  // ── Actualizar condición ───────────────────────────────────────────

  /**
   * Muestra un diálogo de confirmación antes de enviar el PATCH.
   * p-confirmDialog cumple el principio HCI de "prevención de errores".
   */
  onUpdateCondition(): void {
    if (!this.selectedCondition || !this.asset()) return;

    const current = this.asset()!;

    // No hacer nada si la condición no cambió
    if (this.selectedCondition === current.conditionStatus) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin cambios',
        detail: 'La condición seleccionada ya es la actual del bien.',
      });
      return;
    }

    const newLabel  = CONDITION_LABEL[this.selectedCondition];
    const prevLabel = CONDITION_LABEL[current.conditionStatus];

    this.confirmationService.confirm({
      header: 'Confirmar cambio de condición',
      message: `¿Deseas cambiar la condición de <strong>${prevLabel}</strong> a <strong>${newLabel}</strong>?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, actualizar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => this.sendConditionUpdate(current.id),
    });
  }

  private sendConditionUpdate(assetId: number): void {
    if (!this.selectedCondition) return;

    this.savingCondition.set(true);

    const request: UpdateConditionRequest = { conditionStatus: this.selectedCondition };

    this.assetService.updateCondition(assetId, request).subscribe({
      next: (response) => {
        // Actualiza solo el campo cambiado sin recargar todo el bien
        this.asset.update(current =>
          current ? { ...current, conditionStatus: response.newCondition } : null
        );
        this.savingCondition.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Condición actualizada',
          detail: `Cambió de ${CONDITION_LABEL[response.previousCondition]} → ${CONDITION_LABEL[response.newCondition]}`,
        });
      },
      error: (err) => {
        this.savingCondition.set(false);
        const detail = err.status === 409
          ? 'No se puede modificar un bien dado de baja.'
          : 'Ocurrió un error al actualizar la condición.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  // ── Helpers de UI expuestos al template ──────────────────────────────────
  getConditionLabel(status: string): string {
    return CONDITION_LABEL[status as ConditionStatus] ?? status;
  }

  getConditionSeverity(status: string): ConditionSeverity {
    return CONDITION_SEVERITY[status as ConditionStatus] ?? 'warn';
  }

  getLifecycleLabel(status: string): string {
    return LIFECYCLE_LABEL[status] ?? status;
  }

  getLifecycleSeverity(status: string): LifecycleSeverity {
    return LIFECYCLE_SEVERITY[status] ?? 'info';
  }

  isAssignmentActive = (a: AssignmentHistoryDTO): boolean => a.returnedAt === null;

  goBack(): void { this.router.navigate(['/inventario/bienes']); }
  goToAssignment(assetId: number): void {
    this.router.navigate(['/inventario/asignaciones'], {
      queryParams: { assetId }
    });
  }

}
