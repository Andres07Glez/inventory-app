import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConditionStatus, LifecycleStatus, AssetResumeResponse, MyAssetsQueryParams } from '../../../core/models/asset.model';
import { AssetService } from '../../../core/services/asset/asset.service';


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
  selector: 'app-guardian-assets-list',
  imports: [CommonModule,
    TableModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    ToastModule,],
  templateUrl: './guardian-assets-list.html',
  styleUrl: './guardian-assets-list.scss',
})
export class GuardianAssetsList implements OnInit {

  // ── DI ────────────────────────────────────────────────────────────────────
  private readonly assetService   = inject(AssetService);
  private readonly messageService = inject(MessageService);
  private readonly cdr            = inject(ChangeDetectorRef);
  private readonly router         = inject(Router);

  // ── Estado ────────────────────────────────────────────────────────────────
  assets       = signal<AssetResumeResponse[]>([]);
  totalRecords = signal<number>(0);
  loading      = signal<boolean>(true);

  // ── Paginación ────────────────────────────────────────────────────────────
  readonly PAGE_SIZE = 10;
  private currentPage = 0;
  private currentSort = 'inventoryNumber,asc';

  // ── Helpers de UI expuestos al template ──────────────────────────────────
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
    // p-table dispara onLazyLoad automáticamente al iniciar.
  }

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

    this.fetchMyAssets();
  }

  /** Navega al detalle del bien — mismo flujo que assets-list.ts */
  navigateToDetail(id: number): void {
    this.router.navigate(['/inventario/bienes', id]);
  }

  private fetchMyAssets(): void {
    const params: MyAssetsQueryParams = {
      page: this.currentPage,
      size: this.PAGE_SIZE,
      sort: this.currentSort,
    };

    this.assetService.getMyAssets(params).subscribe({
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
          detail: 'No se pudieron cargar tus bienes asignados. Verifique la conexión.',
        });
        this.cdr.markForCheck();
      },
    });
  }
}
