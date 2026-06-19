import { Component, computed, DestroyRef, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { AssetDetailResponseDTO, AssignmentHistoryDTO, CONDITION_STATUS_OPTIONS, ConditionStatus, SelectOption, UpdateConditionRequest } from '../../../core/models/asset.model';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AssetService } from '../../../core/services/asset/asset.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CAMPUS_LABELS } from '../../../core/models/location.model';
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
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { DisableIfNoRoleDirective } from '../../../shared/directives/disable-if-no-role-directive';
import { AssetImageUpload } from '../asset-image-upload/asset-image-upload';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Message } from 'primeng/message';
import { INCIDENT_STATUS_LABEL, INCIDENT_STATUS_SEVERITY, IncidentSummary, REPAIR_TYPE_LABEL, RepairType } from '../../../core/models/incident.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MaintenanceSummary, MAINTENANCE_TYPE_LABELS, MaintenanceType, MAINTENANCE_TYPE_SEVERITY } from '../../../core/models/maintenance.model';
import { IncidentService } from '../../../core/services/incident/incident.service';
import { MaintenanceService } from '../../../core/services/maintenance/maintenance.service';

// ── Tipos locales ──────────────────────────────────────────────────────────────

type ConditionSeverity = 'success' | 'warn' | 'danger';
type LifecycleSeverity = 'info' | 'success' | 'secondary' | 'warn' | 'contrast' | 'danger';
type TagSeverity       = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

type TimelineEventType = 'CREATION' | 'ASSIGNMENT' | 'RETURN' | 'INCIDENT' | 'MAINTENANCE';
interface AssetTimelineEvent {
  readonly dateObj:        Date;
  readonly date:           string;
  readonly type:           TimelineEventType;
  readonly icon:           string;
  readonly color:          string;
  readonly title:          string;
  readonly subtitle?:      string;
  readonly badge?:         string;
  readonly badgeSeverity?: string;
}
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
const TIMELINE_META: Record<TimelineEventType, { icon: string; color: string }> = {
  CREATION:    { icon: 'pi pi-star',                 color: 'var(--primary-color)' },
  ASSIGNMENT:  { icon: 'pi pi-user-plus',             color: 'var(--green-600)'    },
  RETURN:      { icon: 'pi pi-user-minus',             color: 'var(--surface-500)'  },
  INCIDENT:    { icon: 'pi pi-exclamation-triangle',  color: 'var(--yellow-600)'   },
  MAINTENANCE: { icon: 'pi pi-wrench',                color: 'var(--blue-600)'     },
};

@Component({
  selector: 'app-asset-detail',
  standalone:true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,
    TabsModule, TagModule, ButtonModule, SelectModule, ToastModule,
    SkeletonModule, TimelineModule, ConfirmDialogModule, TableModule,
    TooltipModule, CardModule, HasRoleDirective, DisableIfNoRoleDirective, AssetImageUpload,Message],
  templateUrl: './asset-detail.html',
  styleUrl: './asset-detail.scss',
})
export class AssetDetail implements OnInit{

  readonly campusLabels = CAMPUS_LABELS;

  // ── Servicios ─────────────────────────────────────────────────────────────
  private readonly route               = inject(ActivatedRoute);
  private readonly router              = inject(Router);
  private readonly assetService        = inject(AssetService);
  private readonly incidentService     = inject(IncidentService);
  private readonly maintenanceService  = inject(MaintenanceService);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly authService         = inject(AuthService);
  // DestroyRef permite usar takeUntilDestroyed() fuera del constructor
  private readonly destroyRef          = inject(DestroyRef);

  // ── Estado de la vista ────────────────────────────────────────────────────
  readonly asset        = signal<AssetDetailResponseDTO | null>(null);
  readonly assignments  = signal<AssignmentHistoryDTO[]>([]);
  readonly incidents    = signal<IncidentSummary[]>([]);
  readonly maintenances = signal<MaintenanceSummary[]>([]);

  readonly loading             = signal(true);
  readonly loadingAssignments  = signal(true);
  readonly loadingIncidents    = signal(true);
  readonly loadingMaintenances = signal(true);

  // ── SP-09: formulario de condición ────────────────────────────────────────
  selectedCondition: ConditionStatus | null = null;
  readonly savingCondition = signal(false);

  // ── Control de tabs ───────────────────────────────────────────────────────
  /**
   * Signal que mantiene el tab activo.
   * Usar [value]="activeTab()" (valueChange)="activeTab.set($event)" en el template.
   */
  readonly activeTab = signal('resumen');

  readonly conditionOptions: SelectOption<ConditionStatus>[] = CONDITION_STATUS_OPTIONS;

  // ── Computed ──────────────────────────────────────────────────────────────

  readonly canEditImages = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'ADMIN' || role === 'OPERADOR';
  });

  /**
   * AUDITOR solo puede ver el tab "resumen".
   * Controla tanto el renderizado de las pestañas como un guard reactivo.
   */
  readonly canAccessAllTabs = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'ADMIN' || role === 'OPERADOR';
  });

  /**
   * El tab de ciclo de vida requiere que los tres datasets hayan terminado de cargar.
   */
  readonly loadingTimeline = computed(
    () => this.loadingAssignments() || this.loadingIncidents() || this.loadingMaintenances(),
  );

  /**
   * Timeline unificado del ciclo de vida del bien.
   *
   * Combina cuatro fuentes de datos sin necesitar un endpoint dedicado:
   *   1. Fecha de alta del bien (asset.entryDate)
   *   2. Historial de asignaciones (assignments signal)
   *   3. Incidencias (incidents signal)
   *   4. Mantenimientos (maintenances signal)
   *
   * Ordenado DESC para que el evento más reciente aparezca primero.
   */
  readonly timelineEvents = computed<AssetTimelineEvent[]>(() => {
    const bien = this.asset();
    if (!bien) return [];

    const events: AssetTimelineEvent[] = [];

    // 1. Registro del bien
    events.push({
      dateObj:  new Date(bien.entryDate),
      date:     bien.entryDate,
      type:     'CREATION',
      ...TIMELINE_META['CREATION'],
      title:    'Bien registrado en el inventario',
      subtitle: `Número: ${bien.inventoryNumber}`,
    });

    // 2. Asignaciones y devoluciones
    for (const a of this.assignments()) {
      events.push({
        dateObj:  new Date(a.assignedAt),
        date:     a.assignedAt,
        type:     'ASSIGNMENT',
        ...TIMELINE_META['ASSIGNMENT'],
        title:    `Asignado a ${a.guardianName}`,
        subtitle: a.locationName ?? undefined,
      });

      if (a.returnedAt) {
        events.push({
          dateObj:  new Date(a.returnedAt),
          date:     a.returnedAt,
          type:     'RETURN',
          ...TIMELINE_META['RETURN'],
          title:    `Devuelto por ${a.guardianName}`,
        });
      }
    }

    // 3. Incidencias
    for (const inc of this.incidents()) {
      const desc = inc.description.length > 90
        ? `${inc.description.slice(0, 90)}…`
        : inc.description;

      events.push({
        dateObj:       new Date(inc.incidentDate),
        date:          inc.incidentDate,
        type:          'INCIDENT',
        ...TIMELINE_META['INCIDENT'],
        title:         `Incidencia ${inc.folio}`,
        subtitle:      desc,
        badge:         INCIDENT_STATUS_LABEL[inc.status],
        badgeSeverity: INCIDENT_STATUS_SEVERITY[inc.status],
      });
    }

    // 4. Mantenimientos
    for (const m of this.maintenances()) {
      events.push({
        dateObj:  new Date(m.performedDate),
        date:     m.performedDate,
        type:     'MAINTENANCE',
        ...TIMELINE_META['MAINTENANCE'],
        title:    `Mantenimiento ${MAINTENANCE_TYPE_LABELS[m.maintenanceType]}`,
        subtitle: m.performedBy ?? undefined,
      });
    }

    return events.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  });

  // ── Constructor: guards reactivos ─────────────────────────────────────────

  constructor() {
    /**
     * Guard AUDITOR: si el rol activo no tiene acceso a todos los tabs y el tab
     * activo no es 'resumen', se fuerza la navegación de vuelta.
     *
     * untracked() evita que la escritura en activeTab vuelva a disparar el effect.
     * Edge case cubierto: el usuario cambia de rol en otra pestaña del navegador.
     */
    effect(() => {
      if (!this.canAccessAllTabs() && this.activeTab() !== 'resumen') {
        untracked(() => this.activeTab.set('resumen'));
      }
    });
  }

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || isNaN(id)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'ID de bien inválido.' });
      this.router.navigate(['/inventario/bienes']);
      return;
    }

    // ── Carga del bien principal ───────────────────────────────────────────
    this.assetService.getAssetById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.asset.set(data);
          this.selectedCondition = data.conditionStatus;
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary:  'Error',
            detail:   'No se pudo cargar el bien. Verifica la conexión.',
          });
        },
      });

    // ── Carga paralela de tabs secundarios ────────────────────────────────
    // Los cuatro requests corren en paralelo. Para AUDITOR los datos de
    // incidencias y mantenimientos igual se cargan pero nunca se muestran —
    // la diferencia es mínima y simplifica el código.
    // TODO: Si el rendimiento lo requiere, envolver los 3 últimos en un
    //       `if (this.canAccessAllTabs())` para evitar requests innecesarios.

    this.assetService.getAssignmentHistory(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.assignments.set(data); this.loadingAssignments.set(false); },
        error: ()    => { this.assignments.set([]);   this.loadingAssignments.set(false); },
      });

    this.incidentService.listByAsset(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.incidents.set(data); this.loadingIncidents.set(false); },
        error: ()    => { this.incidents.set([]);   this.loadingIncidents.set(false); },
      });

    this.maintenanceService.getByAssetId(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.maintenances.set(data); this.loadingMaintenances.set(false); },
        error: ()    => { this.maintenances.set([]);   this.loadingMaintenances.set(false); },
      });
  }

  // ── Actualizar condición ───────────────────────────────────────────────────

  onUpdateCondition(): void {
    if (!this.selectedCondition || !this.asset()) return;

    const current = this.asset()!;

    if (this.selectedCondition === current.conditionStatus) {
      this.messageService.add({
        severity: 'info',
        summary:  'Sin cambios',
        detail:   'La condición seleccionada ya es la actual del bien.',
      });
      return;
    }

    const newLabel  = CONDITION_LABEL[this.selectedCondition];
    const prevLabel = CONDITION_LABEL[current.conditionStatus];

    this.confirmationService.confirm({
      header:                  'Confirmar cambio de condición',
      message:                 `¿Deseas cambiar la condición de <strong>${prevLabel}</strong> a <strong>${newLabel}</strong>?`,
      icon:                    'pi pi-exclamation-triangle',
      acceptLabel:             'Sí, actualizar',
      rejectLabel:             'Cancelar',
      acceptButtonStyleClass:  'p-button-warning',
      accept: () => this.sendConditionUpdate(current.id),
    });
  }

  private sendConditionUpdate(assetId: number): void {
    if (!this.selectedCondition) return;

    this.savingCondition.set(true);
    const request: UpdateConditionRequest = { conditionStatus: this.selectedCondition };

    this.assetService.updateCondition(assetId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.asset.update(current =>
            current ? { ...current, conditionStatus: response.newCondition } : null
          );
          this.savingCondition.set(false);
          this.messageService.add({
            severity: 'success',
            summary:  'Condición actualizada',
            detail:   `Cambió de ${CONDITION_LABEL[response.previousCondition]} → ${CONDITION_LABEL[response.newCondition]}`,
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

  // ── Helpers de UI expuestos al template ───────────────────────────────────

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

  getIncidentStatusLabel(status: string): string {
    return INCIDENT_STATUS_LABEL[status as keyof typeof INCIDENT_STATUS_LABEL] ?? status;
  }

  getIncidentStatusSeverity(status: string): TagSeverity {
    return (INCIDENT_STATUS_SEVERITY[status as keyof typeof INCIDENT_STATUS_SEVERITY] ?? 'secondary') as TagSeverity;
  }

  getRepairTypeLabel(type: RepairType | null): string {
    return type ? (REPAIR_TYPE_LABEL[type] ?? type) : '—';
  }

  getMaintenanceTypeLabel(type: string): string {
    return MAINTENANCE_TYPE_LABELS[type as MaintenanceType] ?? type;
  }

  getMaintenanceTypeSeverity(type: string): TagSeverity {
    return (MAINTENANCE_TYPE_SEVERITY[type as MaintenanceType] ?? 'secondary') as TagSeverity;
  }

  isAssignmentActive = (a: AssignmentHistoryDTO): boolean => a.returnedAt === null;

  /**
   * Handler para el evento (valueChange) de p-tabs.
   * PrimeNG tipifica el output como `string | number | undefined` porque soporta
   * tabs numéricos, pero nuestros tabs usan siempre strings literales.
   * Convertir aquí en lugar de castear en el template mantiene el HTML limpio.
   */
  onTabChange(value: string | number | undefined): void {
    this.activeTab.set(String(value ?? 'resumen'));
  }

  // ── Navegación ────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/inventario/bienes']);
  }

  goToAssignment(assetId: number): void {
    this.router.navigate(['/inventario/asignaciones'], { queryParams: { assetId } });
  }

  /**
   * TODO: actualizar la ruta cuando se construya el formulario de incidencias.
   */
  goToNewIncident(assetId: number): void {
    this.router.navigate(['/incidencias/'],/* { queryParams: { assetId } }*/);
  }

  /**
   * TODO: actualizar la ruta cuando se construya el formulario de mantenimientos.
   */
  goToNewMaintenance(assetId: number): void {
    this.router.navigate(['/mantenimiento/'], { queryParams: { assetId } });
  }

}
