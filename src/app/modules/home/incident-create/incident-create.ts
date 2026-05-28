import { Component, inject, input, OnChanges, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { AssetSearchInput } from '../asset-search/asset-search';
import { AssetSearchResult } from '../../../core/models/asset-assignment.model';
import { ConditionStatus, IncidentDetail, RepairType } from '../../../core/models/incident.model';
import { IncidentService } from '../../../core/services/incident/incident.service';
import { MessageService } from 'primeng/api';

 
interface SelectOption<T> { label: string; value: T; }
 
@Component({
  selector: 'app-incident-create',
  standalone: true,
  imports: [
    FormsModule, DialogModule, ButtonModule, SelectModule,
    TextareaModule, DividerModule, TagModule, FloatLabelModule,
    AssetSearchInput,
  ],
  templateUrl: './incident-create.html',
  styleUrl:    './incident-create.scss',
})
export class IncidentCreate implements OnChanges {
 
  /** Controla la visibilidad del diálogo desde el padre con [(visible)] */
  readonly visible = input<boolean>(false);
 
  /**
   * Bien pre-seleccionado. Útil cuando se abre desde el tab de incidencias
   * del detalle de un bien específico.
   */
  readonly preselectedAsset = input<AssetSearchResult | null>(null);
 
  readonly visibleChange = output<boolean>();
  readonly created       = output<IncidentDetail>();
 
  private readonly incidentService = inject(IncidentService);
  private readonly messageService  = inject(MessageService);
 
  // ── Estado del formulario ─────────────────────────────────────────────────
 
  selectedAsset         = signal<AssetSearchResult | null>(null);
  description           = '';
  selectedCondition     = signal<ConditionStatus | null>(null);
  selectedRepairType    = signal<RepairType | null>(null);
  saving                = signal(false);
 
  readonly conditionOptions: SelectOption<ConditionStatus>[] = [
    { label: 'Bueno',   value: 'GOOD' },
    { label: 'Regular', value: 'REGULAR' },
    { label: 'Malo',    value: 'BAD' },
  ];
 
  readonly repairTypeOptions: SelectOption<RepairType>[] = [
    { label: 'Reparación interna', value: 'INTERNAL' },
    { label: 'Reparación externa', value: 'EXTERNAL' },
  ];
 
  // Si se pre-selecciona un bien desde el padre, pre-cargarlo
  ngOnChanges(): void {
    const pre = this.preselectedAsset();
    if (pre) this.selectedAsset.set(pre);
  }
 
  // ── Lógica ────────────────────────────────────────────────────────────────
 
  get isFormValid(): boolean {
    return (
      this.selectedAsset() !== null &&
      this.description.trim().length > 0 &&
      this.selectedCondition() !== null
    );
  }
 
  onSubmit(): void {
    if (!this.isFormValid) return;
 
    this.saving.set(true);
    this.incidentService.create({
      assetId:             this.selectedAsset()!.id,
      description:         this.description.trim(),
      conditionAtIncident: this.selectedCondition()!,
      repairType:          this.selectedRepairType(),
    }).subscribe({
      next: incident => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Incidencia registrada',
          detail: `Folio ${incident.folio} creado correctamente.`,
          life: 4000,
        });
        this.created.emit(incident);
        this.close();
      },
      error: err => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al registrar',
          detail: err.error?.message ?? 'No se pudo crear la incidencia.',
          life: 5000,
        });
      },
    });
  }
 
  close(): void {
    this.resetForm();
    this.visibleChange.emit(false);
  }
 
  private resetForm(): void {
    // Si había preselección, mantenerla; si no, limpiar todo
    if (!this.preselectedAsset()) this.selectedAsset.set(null);
    this.description        = '';
    this.selectedCondition.set(null);
    this.selectedRepairType.set(null);
  }
}