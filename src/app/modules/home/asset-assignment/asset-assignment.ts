import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Toast, ToastModule } from "primeng/toast";
import { AssetAssignmentService } from '../../../core/services/asset-assignment/asset-assignment.service';
import { MessageService } from 'primeng/api';
import { AssetSearchResult, GuardianOption } from '../../../core/models/asset-assignment.model';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';

// ── Helpers de UI ─────────────────────────────────────────────────────────────
 import { ActivatedRoute, Router } from '@angular/router';

type ConditionStatus = 'GOOD' | 'REGULAR' | 'BAD';
type LifecycleStatus =
  | 'REGISTERED' | 'AVAILABLE' | 'ASSIGNED'
  | 'IN_MAINTENANCE' | 'IN_WARRANTY' | 'DECOMMISSIONED';

const CONDITION_LABEL: Record<ConditionStatus, string> = {
  GOOD: 'Bueno', REGULAR: 'Regular', BAD: 'Malo',
};
const CONDITION_SEVERITY: Record<ConditionStatus, 'success' | 'warn' | 'danger'> = {
  GOOD: 'success', REGULAR: 'warn', BAD: 'danger',
};
const LIFECYCLE_LABEL: Record<LifecycleStatus, string> = {
  REGISTERED: 'Registrado', AVAILABLE: 'Disponible', ASSIGNED: 'Asignado',
  IN_MAINTENANCE: 'Mantenimiento', IN_WARRANTY: 'Garantía', DECOMMISSIONED: 'Baja',
};
const LIFECYCLE_SEVERITY: Record<LifecycleStatus, 'info' | 'success' | 'secondary' | 'warn' | 'contrast' | 'danger'> = {
  REGISTERED: 'info', AVAILABLE: 'success', ASSIGNED: 'secondary',
  IN_MAINTENANCE: 'warn', IN_WARRANTY: 'contrast', DECOMMISSIONED: 'danger',
};

const PAGE_SIZE = 6;

@Component({
  selector: 'app-asset-assignment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    ToastModule,
    TooltipModule,
    TagModule,
    SkeletonModule,
    DividerModule,
    PaginatorModule,
  ],
  providers: [MessageService],
  templateUrl: './asset-assignment.html',
  styleUrls: ['./asset-assignment.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetAssignmentComponent implements OnInit {

  // ── DI ────────────────────────────────────────────────────────────────────
  private readonly fb            = inject(FormBuilder);
  private readonly service       = inject(AssetAssignmentService);
  private readonly messageService = inject(MessageService);
  private readonly cdr           = inject(ChangeDetectorRef);
  private readonly destroyRef    = inject(DestroyRef);
   private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // ── Estado de búsqueda ────────────────────────────────────────────────────
  searchResults   = signal<AssetSearchResult[]>([]);
  totalRecords    = signal(0);
  searching       = signal(false);
  searchError     = signal<string | null>(null);
  hasSearched     = signal(false);  // true después del primer intento
  currentPage     = signal(0);
  keyword         = signal('');

  readonly pageSize = PAGE_SIZE;
  readonly skeletonRows = Array(PAGE_SIZE);

  private readonly search$ = new Subject<string>();

  // ── Estado de selección ───────────────────────────────────────────────────
  selectedAsset = signal<AssetSearchResult | null>(null);
  submitting    = signal(false);

  // ── Catálogos ─────────────────────────────────────────────────────────────
  guardians       = signal<GuardianOption[]>([]);
  loadingCatalogs = signal(true);
  preloaded       = signal(false);
  // ── Guardian seleccionado en el formulario (para mostrar su ubicación heredada) ──
  selectedGuardian = signal<GuardianOption | null>(null);

  // ── Formulario de asignación ──────────────────────────────────────────────
  assignmentForm: FormGroup = this.fb.group({
    guardianId: [null, Validators.required],
    // locationId eliminado: se hereda de guardian.location en el backend
    notes: [''],
  });

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadCatalogs();
    const assetIdParam = this.route.snapshot.queryParamMap.get('assetId');
    if (assetIdParam) {
      const assetId = Number(assetIdParam);
      if (!isNaN(assetId)) {
        this.preloaded.set(true);
        this.searching.set(true);
        // Reutilizamos el lookupAsset del servicio que ya habla con GET /v1/assets/lookup
        // pero usando el inventoryNumber no disponible aquí. En su lugar llamamos
        // directamente al endpoint de detalle.
        this.service.lookupAssetById(assetId).subscribe({
          next: (res) => {
            if (res.data.lifecycleStatus === 'DECOMMISSIONED') {
              this.searchError.set('Este bien está dado de baja y no puede ser asignado.');
              this.preloaded.set(false);
            } else {
              this.searchResults.set([res.data]);
            }
            this.searching.set(false);
            this.cdr.markForCheck();
          },
          error: () => {
            this.searchError.set('No se pudo cargar el bien seleccionado.');
            this.preloaded.set(false);
            this.searching.set(false);
            this.cdr.markForCheck();
          },
        });
      }
    }
    this.setupSearchPipe();
  }

  // ── Configurar debounce de búsqueda ───────────────────────────────────────

  private setupSearchPipe(): void {
    this.search$
      .pipe(
        debounceTime(380),
        distinctUntilChanged(),
        switchMap((kw) => {
          this.searching.set(true);
          this.searchError.set(null);
          // Si el campo está vacío, limpiar resultados sin llamar al servidor
          if (!kw.trim()) {
            this.searchResults.set([]);
            this.totalRecords.set(0);
            this.hasSearched.set(false);
            this.searching.set(false);
            this.cdr.markForCheck();
            return of(null);
          }
          return this.service.searchAssets(kw.trim(), this.currentPage(), PAGE_SIZE);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (page) => {
          if (page === null) return;
          this.searchResults.set(page.content);
          this.totalRecords.set(page.totalElements);
          this.hasSearched.set(true);
          this.searching.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.searchError.set('Error al buscar bienes. Verifica la conexión.');
          this.searching.set(false);
          this.hasSearched.set(true);
          this.cdr.markForCheck();
        },
      });
  }

  // ── Eventos del buscador ──────────────────────────────────────────────────

  onKeywordChange(value: string): void {
    this.keyword.set(value);
    this.currentPage.set(0);
    // Deseleccionar si el usuario vuelve a escribir
    if (this.selectedAsset()) {
      this.selectedAsset.set(null);
      this.assignmentForm.reset();
    }
    this.search$.next(value);
  }

  onPageChange(event: PaginatorState): void {
    this.currentPage.set(event.page ?? 0);
    this.service
      .searchAssets(this.keyword().trim(), event.page ?? 0, PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.searchResults.set(page.content);
          this.totalRecords.set(page.totalElements);
          this.cdr.markForCheck();
        },
      });
  }

  // ── Selección de un resultado ─────────────────────────────────────────────

  selectAsset(asset: AssetSearchResult): void {
    if (asset.lifecycleStatus === 'DECOMMISSIONED') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Bien no disponible',
        detail: `"${asset.description}" está dado de baja y no puede asignarse.`,
      });
      return;
    }
    this.selectedAsset.set(asset);
    this.assignmentForm.reset();
    this.cdr.markForCheck();
  }

  clearSelection(): void {
    this.selectedAsset.set(null);
    this.selectedGuardian.set(null);
    this.assignmentForm.reset();
  }

  clearSearch(): void {
    if (this.preloaded()) {
      // Si fue pre-cargado, volver a la pantalla de detalle del bien
      this.router.navigate(['/inventario/bienes', this.searchResults().at(0)?.id]);
      return;
    }
    this.keyword.set('');
    this.searchResults.set([]);
    this.totalRecords.set(0);
    this.hasSearched.set(false);
    this.selectedAsset.set(null);
    this.selectedGuardian.set(null);
    this.assignmentForm.reset();
  }

  /** Actualiza selectedGuardian cuando el usuario elige uno en el select */
  onGuardianChange(guardianId: number | null): void {
    if (!guardianId) { this.selectedGuardian.set(null); return; }
    const found = this.guardians().find(g => g.id === guardianId) ?? null;
    this.selectedGuardian.set(found);
  }

  // ── Envío ─────────────────────────────────────────────────────────────────

  onSubmit(): void {
    this.assignmentForm.markAllAsTouched();
    if (this.assignmentForm.invalid || !this.selectedAsset()) return;

    // Validar que el resguardante tenga ubicación base — el backend la exige
    if (!this.selectedGuardian()?.locationId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Resguardante sin ubicación',
        detail: `"${this.selectedGuardian()?.fullName}" no tiene una ubicación base configurada. Actualiza el resguardante antes de asignarle bienes.`,
        life: 7000,
      });
      return;
    }

    this.submitting.set(true);

    const payload = {
      assetId:    this.selectedAsset()!.id,
      guardianId: this.assignmentForm.value.guardianId,
      assignedBy: 1, // TODO: reemplazar con ID del usuario autenticado (JWT)
      notes:      this.assignmentForm.value.notes ?? '',
      // locationId eliminado: el backend lo hereda de guardian.location
    };

    this.service.createAssignment(payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Asignación registrada',
          detail: `${res.assetInventoryNumber} asignado a ${res.guardianName}.`,
          life: 5000,
        });
        // Si vino pre-cargado, redirigir de vuelta al detalle del bien
        if (this.preloaded()) {
          setTimeout(() => this.router.navigate(['/inventario/bienes', payload.assetId]), 2000);
        } else {
          if (this.preloaded()) {
            setTimeout(() => this.router.navigate(['/inventario/bienes', payload.assetId]), 2000);
          } else {
            this.clearSelection();
          }
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message ?? 'Ocurrió un error al registrar la asignación.',
          life: 6000,
        });
        this.cdr.markForCheck();
      },
    });
  }

  // ── Helpers de UI ─────────────────────────────────────────────────────────

  getConditionLabel(s: string): string {
    return CONDITION_LABEL[s as ConditionStatus] ?? s;
  }
  getConditionSeverity(s: string): 'success' | 'warn' | 'danger' {
    return CONDITION_SEVERITY[s as ConditionStatus] ?? 'warn';
  }
  getLifecycleLabel(s: string): string {
    return LIFECYCLE_LABEL[s as LifecycleStatus] ?? s;
  }
  getLifecycleSeverity(s: string): 'info' | 'success' | 'secondary' | 'warn' | 'contrast' | 'danger' {
    return LIFECYCLE_SEVERITY[s as LifecycleStatus] ?? 'info';
  }
  isFieldInvalid(field: string): boolean {
    const ctrl = this.assignmentForm.get(field);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }
  isDecommissioned(asset: AssetSearchResult): boolean {
    return asset.lifecycleStatus === 'DECOMMISSIONED';
  }

  // ── Catálogos ─────────────────────────────────────────────────────────────

private loadCatalogs(): void {
    this.service.getGuardians().subscribe({
      next: (res: any) => {
        // 1. Extraemos el arreglo de resguardantes del objeto paginado
        const arraySeguro = Array.isArray(res?.content) ? res.content : [];

        // 2. Lo guardamos en la señal
        this.guardians.set(arraySeguro);
        this.loadingCatalogs.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({ severity: 'warn', summary: 'Catálogo', detail: 'No se pudieron cargar los resguardantes.' });
        this.loadingCatalogs.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
