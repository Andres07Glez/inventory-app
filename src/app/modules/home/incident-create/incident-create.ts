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
import { MessageModule } from 'primeng/message';
import { DatePickerModule } from 'primeng/datepicker';

 
interface SelectOption<T> { label: string; value: T; }

/** Mínimo permitido por el backend: 2002-01-01 */
const MIN_INCIDENT_DATE = new Date(2002, 0, 1);

@Component({
  selector: 'app-incident-create',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule, DatePickerModule, DialogModule, DividerModule,
    MessageModule, SelectModule, TagModule, TextareaModule,
    AssetSearchInput,
  ],
  templateUrl: './incident-create.html',
  styleUrl:    './incident-create.scss',
})
export class IncidentCreate implements OnChanges {

  readonly visible          = input<boolean>(false);
  readonly preselectedAsset = input<AssetSearchResult | null>(null);

  readonly visibleChange = output<boolean>();
  readonly created       = output<IncidentDetail>();

  private readonly incidentService = inject(IncidentService);
  private readonly messageService  = inject(MessageService);

  // ── Estado del formulario ─────────────────────────────────────────────────

  selectedAsset      = signal<AssetSearchResult | null>(null);
  description        = '';
  selectedRepairType = signal<RepairType | null>(null);

  /**
   * SP-16 v2: conditionAtIncident se carga automáticamente del bien seleccionado.
   * Se muestra como campo de solo lectura, no como selector.
   */
  assetCondition = signal<ConditionStatus | null>(null);

  /**
   * SP-16 v2: fecha del evento. Inicia con hoy; el operador puede retroceder
   * hasta el 2002-01-01.
   */
  incidentDate = signal<Date>(new Date());

  saving = signal(false);

  /** Límites del calendario */
  readonly minDate = MIN_INCIDENT_DATE;
  readonly maxDate = new Date();

  readonly repairTypeOptions: SelectOption<RepairType>[] = [
    { label: 'Reparación interna', value: 'INTERNAL' },
    { label: 'Reparación externa', value: 'EXTERNAL' },
  ];

  readonly conditionLabel: Record<ConditionStatus, string> = {
    GOOD:    'Bueno',
    REGULAR: 'Regular',
    BAD:     'Malo',
  };

  readonly conditionSeverity: Record<ConditionStatus, 'success' | 'warn' | 'danger'> = {
    GOOD:    'success',
    REGULAR: 'warn',
    BAD:     'danger',
  };

  ngOnChanges(): void {
    const pre = this.preselectedAsset();
    if (pre) this.onAssetSelected(pre);
  }

  onAssetSelected(asset: AssetSearchResult): void {
    this.selectedAsset.set(asset);
    // Carga automática de la condición desde los datos del bien
    this.assetCondition.set(asset.conditionStatus as ConditionStatus);
  }

  onAssetCleared(): void {
    this.selectedAsset.set(null);
    this.assetCondition.set(null);
  }

  get isFormValid(): boolean {
    return (
      this.selectedAsset() !== null &&
      this.description.trim().length > 0 &&
      this.incidentDate() !== null
    );
  }

  onSubmit(): void {
    if (!this.isFormValid) return;

    const date = this.incidentDate();
    const isoDate = date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      : null;

    this.saving.set(true);
    this.incidentService.create({
      assetId:      this.selectedAsset()!.id,
      description:  this.description.trim(),
      repairType:   this.selectedRepairType(),
      incidentDate: isoDate,
      conditionAtIncident: this.assetCondition() as ConditionStatus
    }).subscribe({
      next: incident => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary:  'Incidencia registrada',
          detail:   `Folio ${incident.folio} creado correctamente.`,
          life: 4000,
        });
        this.created.emit(incident);
        this.close();
      },
      error: err => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary:  'Error al registrar',
          detail:   err.error?.message ?? 'No se pudo crear la incidencia.',
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
    if (!this.preselectedAsset()) {
      this.selectedAsset.set(null);
      this.assetCondition.set(null);
    }
    this.description = '';
    this.selectedRepairType.set(null);
    this.incidentDate.set(new Date());
  }
}