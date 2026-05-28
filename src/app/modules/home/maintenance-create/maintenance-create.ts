import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { AssetSearchInput } from '../asset-search/asset-search';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MaintenanceService } from '../../../core/services/maintenance/maintenance.service';
import { AssetService } from '../../../core/services/asset/asset.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AssetSearchResult } from '../../../core/models/asset-assignment.model';
import { CONDITION_LABELS, ConditionStatus, MAINTENANCE_TYPE_LABELS, MaintenanceType } from '../../../core/models/maintenance.model';
import { IncidentService } from '../../../core/services/incident/incident.service';
import { IncidentSummary } from '../../../core/models/incident.model';

interface SelectOption<T> { label: string; value: T }

@Component({
  selector:    'app-maintenance-create',
  standalone:  true,
  imports: [
    CommonModule, FormsModule,
    DialogModule, ButtonModule, SelectModule, TextareaModule,
    ToastModule, ConfirmDialogModule, DividerModule,
    AssetSearchInput,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './maintenance-create.html',
  styleUrl:    './maintenance-create.scss',
})
export class MaintenanceCreate implements OnInit {

  // ── Inputs / Outputs ────────────────────────────────────────────────────────

  /** Si se abre desde el tab de un bien, el bien ya está fijo. */
  readonly fixedAssetId = input<number | null>(null);

  /** Emite cuando se crea exitosamente un registro. */
  readonly created = output<void>();

  // ── DI ─────────────────────────────────────────────────────────────────────

  private readonly maintenanceService  = inject(MaintenanceService);
  private readonly incidentService     = inject(IncidentService);
  private readonly assetService        = inject(AssetService);
  readonly authService                 = inject(AuthService);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  // ── Estado del dialog ───────────────────────────────────────────────────────

  readonly visible  = signal(false);
  readonly saving   = signal(false);

  // ── Campos del formulario ───────────────────────────────────────────────────
  // p-autoComplete necesita propiedad de clase plana (regla crítica del contexto)

  protected selectedAsset: AssetSearchResult | null = null;

  /**
   * Punto 6: la fecha siempre es la del día del registro.
   * No es un campo editable, es un computed value derivado del momento de apertura del dialog.
   */
  readonly performedDate = signal<string>('');

  readonly selectedType            = signal<MaintenanceType | null>(null);
  readonly selectedConditionBefore = signal<ConditionStatus | null>(null);
  readonly selectedConditionAfter  = signal<ConditionStatus | null>(null);

  protected description = '';
  protected performedBy = '';

  // ── Incidencia vinculada (Punto 8) ──────────────────────────────────────────

  /** Lista de incidencias disponibles para el bien seleccionado. */
  readonly availableIncidents   = signal<IncidentSummary[]>([]);
  readonly loadingIncidents     = signal(false);
  protected selectedIncident: IncidentSummary | null = null;

  /** Computed: opciones formateadas para el p-select de incidencias. */
  readonly incidentOptions = computed<SelectOption<IncidentSummary>[]>(() =>
    this.availableIncidents().map(inc => ({
      label: `#${inc.id} — ${inc.folio}`,
      value: inc,
    }))
  );

  // ── Opciones de selects ─────────────────────────────────────────────────────

  readonly typeOptions: SelectOption<MaintenanceType>[] = (
    Object.keys(MAINTENANCE_TYPE_LABELS) as MaintenanceType[]
  ).map(k => ({ label: MAINTENANCE_TYPE_LABELS[k], value: k }));

  readonly conditionOptions: SelectOption<ConditionStatus>[] = (
    Object.keys(CONDITION_LABELS) as ConditionStatus[]
  ).map(k => ({ label: CONDITION_LABELS[k], value: k }));

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const fixedId = this.fixedAssetId();
    if (fixedId !== null) {
      this.assetService.getAssetById(fixedId).subscribe((asset: any) => {
        this.selectedAsset = {
          id:              asset.id,
          inventoryNumber: asset.inventoryNumber,
          description:     asset.description,
          lifecycleStatus: asset.lifecycleStatus,
          conditionStatus: asset.conditionStatus,
        } as AssetSearchResult;

        // Punto 4 — Efecto Historial: precarga conditionBefore con el estado actual del bien
        if (asset.conditionStatus) {
          this.selectedConditionBefore.set(asset.conditionStatus as ConditionStatus);
        }

        // Punto 8: cargar incidencias del bien fijo al iniciar
        this.loadIncidentsByAsset(fixedId);
      });
    }
  }

  open(): void {
    this.resetForm();
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
  }

  // ── Punto 4: Efecto Historial al seleccionar bien desde buscador ─────────────

  onAssetSelected(asset: AssetSearchResult | null): void {
    this.selectedAsset = asset;
    this.selectedIncident = null;
    this.availableIncidents.set([]);

    if (asset) {
      // Precarga conditionBefore con la condición actual del bien
      this.selectedConditionBefore.set(
        asset.conditionStatus ? (asset.conditionStatus as ConditionStatus) : null
      );
      // Cargar incidencias del bien recién seleccionado
      this.loadIncidentsByAsset(asset.id);
    } else {
      this.selectedConditionBefore.set(null);
    }
  }

// ── Punto 8: cargar incidencias del bien ─────────────────────────────────────

private loadIncidentsByAsset(assetId: number | undefined | null): void {
  // 1. Validar que tengamos un ID real antes de llamar al backend
  if (!assetId) {
    this.availableIncidents.set([]);
    return;
  }

  this.loadingIncidents.set(true);
  this.incidentService.listByAsset(assetId).subscribe({
    next: (data) => { 
      this.availableIncidents.set(data); 
      this.loadingIncidents.set(false); 
    },
    error: () => this.loadingIncidents.set(false),
  });
} 

  // ── Guardar ─────────────────────────────────────────────────────────────────

  save(): void {
    if (!this.isFormValid()) return;

    this.saving.set(true);

    const request = {
      assetId:         this.selectedAsset!.id,
      incidentId:      this.selectedIncident?.id ?? null,
      maintenanceType: this.selectedType()!,
      description:     this.description.trim(),
      performedBy:     this.performedBy.trim() || null,
      performedDate:   this.performedDate(),  // siempre la fecha de hoy (Punto 6)
      cost:            null,                   // Punto 1: costo eliminado del registro
      conditionBefore: this.selectedConditionBefore(),
      conditionAfter:  this.selectedConditionAfter(),
    };

    this.maintenanceService.create(request).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.visible.set(false);
        this.messageService.add({
          severity: 'success',
          summary:  'Mantenimiento registrado',
          detail:   `Registro creado para ${response.inventoryNumber}`,
        });
        this.created.emit();
        this.suggestConditionUpdateIfNeeded(response);
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary:  'Error al guardar',
          detail:   err?.error?.message ?? 'Ocurrió un error inesperado.',
        });
      },
    });
  }

  /**
   * Regla de negocio: si conditionAfter difiere del estado actual del bien,
   * ofrecer actualizar la condición mediante p-confirmDialog.
   */
  private suggestConditionUpdateIfNeeded(response: { assetId: number; conditionAfter: string | null }): void {
    const conditionAfter   = response.conditionAfter;
    const currentCondition = this.selectedAsset?.conditionStatus;

    if (!conditionAfter || !currentCondition || conditionAfter === currentCondition) return;

    const fromLabel = CONDITION_LABELS[currentCondition as ConditionStatus];
    const toLabel   = CONDITION_LABELS[conditionAfter   as ConditionStatus];

    this.confirmationService.confirm({
      header:       'Actualizar condición del bien',
      message:      `El bien tenía condición <b>${fromLabel}</b> y el mantenimiento reporta <b>${toLabel}</b>. ¿Deseas actualizar la condición del bien?`,
      icon:         'pi pi-refresh',
      acceptLabel:  'Sí, actualizar',
      rejectLabel:  'No por ahora',
      accept: () => {
        this.assetService.updateCondition(response.assetId, { conditionStatus: conditionAfter as ConditionStatus })
          .subscribe({
            next: () => this.messageService.add({
              severity: 'success',
              summary:  'Condición actualizada',
              detail:   `La condición del bien se actualizó a ${toLabel}.`,
            }),
            error: () => this.messageService.add({
              severity: 'warn',
              summary:  'No se pudo actualizar',
              detail:   'El mantenimiento quedó guardado pero la condición no se actualizó.',
            }),
          });
      },
    });
  }

  private isFormValid(): boolean {
    return (
      this.selectedAsset !== null &&
      this.selectedType() !== null &&
      this.description.trim().length > 0
    );
  }

  private resetForm(): void {
    // Punto 6: fecha fijada al momento de apertura del dialog, no editable
    this.performedDate.set(new Date().toISOString().split('T')[0]);

    if (this.fixedAssetId() === null) {
      this.selectedAsset = null;
      this.availableIncidents.set([]);
    }
    this.selectedType.set(null);
    this.selectedConditionBefore.set(null);
    this.selectedConditionAfter.set(null);
    this.description     = '';
    this.performedBy     = '';
    this.selectedIncident = null;
  }
}
