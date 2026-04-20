import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { AssetQueryParams, AssetResponseDTO, CONDITION_STATUS_OPTIONS, ConditionStatus, LIFECYCLE_STATUS_OPTIONS, LifecycleStatus, SelectOption } from '../../../core/models/asset.model';
import { AssetService } from '../../../core/services/asset/asset.service';
import { MessageService } from 'primeng/api';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { Toast, ToastModule } from "primeng/toast";
import { Select, SelectModule } from "primeng/select";
import { Tag, TagModule } from "primeng/tag";
import { Skeleton, SkeletonModule } from "primeng/skeleton";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

// ── Helpers de UI ─────────────────────────────────────────────────────────────

const CONDITION_LABEL: Record<ConditionStatus, string> = {
  GOOD: 'Bueno',
  REGULAR: 'Regular',
  BAD: 'Malo',
};

const CONDITION_SEVERITY: Record<ConditionStatus, 'success' | 'warn' | 'danger'> = {
  GOOD: 'success',
  REGULAR: 'warn',
  BAD: 'danger',
};

const LIFECYCLE_LABEL: Record<LifecycleStatus, string> = {
  REGISTERED: 'Registrado',
  AVAILABLE: 'Disponible',
  ASSIGNED: 'Asignado',
  IN_MAINTENANCE: 'Mantenimiento',
  IN_WARRANTY: 'Garantía',
  DECOMMISSIONED: 'Baja',
};

const LIFECYCLE_SEVERITY: Record<LifecycleStatus, 'info' | 'success' | 'secondary' | 'warn' | 'contrast' | 'danger'> = {
  REGISTERED: 'info',
  AVAILABLE: 'success',
  ASSIGNED: 'secondary',
  IN_MAINTENANCE: 'warn',
  IN_WARRANTY: 'contrast',
  DECOMMISSIONED: 'danger',
};

@Component({
  selector: 'app-assets-list',
  imports: [CommonModule,
    FormsModule,
    TableModule,
    SelectModule,           // ← reemplaza a DropdownModule
    TagModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    SkeletonModule,
    ToastModule,            // RippleModule ya está incluido en ButtonModule en v17+
    IconFieldModule,
    InputIconModule, ],
  templateUrl: './assets-list.html',
  styleUrl: './assets-list.scss',
})
export class AssetsList implements OnInit {
  // ── DI ────────────────────────────────────────────────────────────────────
  private readonly assetService = inject(AssetService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
 
  // ── Estado ────────────────────────────────────────────────────────────────
  assets = signal<AssetResponseDTO[]>([]);
  totalRecords = signal<number>(0);
  loading = signal<boolean>(true);
 
  // ── Filtros ───────────────────────────────────────────────────────────────
  selectedCondition: ConditionStatus | null = null;
  selectedLifecycle: LifecycleStatus | null = null;
 
  readonly conditionOptions: SelectOption<ConditionStatus>[] = [
    { label: 'Todas las condiciones', value: null as any },
    ...CONDITION_STATUS_OPTIONS,
  ];
 
  readonly lifecycleOptions: SelectOption<LifecycleStatus>[] = [
    { label: 'Todos los estados', value: null as any },
    ...LIFECYCLE_STATUS_OPTIONS,
  ];
 
  // ── Paginación ────────────────────────────────────────────────────────────
  readonly PAGE_SIZE = 10;
  private currentPage = 0;
  private currentSort = 'inventoryNumber,asc';
 
  // ── Helpers de UI (expuestos al template) ─────────────────────────────────
  // Se usan métodos en lugar de Records directos porque en el template de
  // PrimeNG `let-asset` es implícitamente `any`, lo que impide indexar un
  // Record<EnumKey, ...> sin un cast explícito.
 
  getConditionLabel(status: string): string {
    return CONDITION_LABEL[status as ConditionStatus] ?? status;
  }
 
  getConditionSeverity(status: string): 'success' | 'warn' | 'danger' {
    return CONDITION_SEVERITY[status as ConditionStatus] ?? 'warn';
  }
 
  getLifecycleLabel(status: string): string {
    return LIFECYCLE_LABEL[status as LifecycleStatus] ?? status;
  }
 
  getLifecycleSeverity(status: string): 'info' | 'success' | 'secondary' | 'warn' | 'contrast' | 'danger' {
    return LIFECYCLE_SEVERITY[status as LifecycleStatus] ?? 'info';
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // La tabla PrimeNG dispara onLazyLoad al iniciarse, así que no
    // necesitamos llamar manualmente aquí.
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  /** Llamado por p-table en cada cambio de página / orden */
  onLazyLoad(event: TableLazyLoadEvent): void {
    this.loading.set(true);
 
    const page = Math.floor((event.first ?? 0) / this.PAGE_SIZE);
 
    let sort = 'inventoryNumber,asc';
    if (event.sortField) {
      const dir = (event.sortOrder ?? 1) === 1 ? 'asc' : 'desc';
      sort = `${event.sortField},${dir}`;
    }
 
    this.currentPage = page;
    this.currentSort = sort;
 
    this.fetchAssets();
  }
 
  /** Llamado cuando el usuario cambia algún filtro */
  onFilterChange(): void {
    this.currentPage = 0;
    this.fetchAssets();
  }
 
  /** Limpia todos los filtros */
  clearFilters(): void {
    this.selectedCondition = null;
    this.selectedLifecycle = null;
    this.onFilterChange();
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  private fetchAssets(): void {
    const params: AssetQueryParams = {
      page: this.currentPage,
      size: this.PAGE_SIZE,
      sort: this.currentSort,
    };
 
    if (this.selectedCondition) params.conditionStatus = this.selectedCondition;
    if (this.selectedLifecycle) params.lifecycleStatus = this.selectedLifecycle;
 
    this.assetService.getAssets(params).subscribe({
      next: (page) => {
        this.assets.set(page.content);
        this.totalRecords.set(page.totalElements);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los bienes. Verifique la conexión.',
        });
        this.cdr.markForCheck();
      },
    });
  }

  /** Verifica si hay filtros activos */
  get hasActiveFilters(): boolean {
    return !!this.selectedCondition || !!this.selectedLifecycle;
  }

}
