import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { CatalogService } from '../../../core/services/catalog/catalog.service';
import { CategoryRequestDTO, CategoryResponseDTO, DialogMode, SupplierRequestDTO, SupplierResponseDTO } from '../../../core/models/catalog.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TabsModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './catalog.html',
  styleUrls: ['./catalog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogComponent implements OnInit {
 
  // ── DI ────────────────────────────────────────────────────────────────────
  private readonly catalogService      = inject(CatalogService);
  private readonly fb                  = inject(FormBuilder);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr                 = inject(ChangeDetectorRef);
  private readonly destroyRef          = inject(DestroyRef);
 
  readonly pageSize = PAGE_SIZE;
 
  // ══════════════════════════════════════════════════════════════════════════
  // TAB ACTIVO
  // ══════════════════════════════════════════════════════════════════════════
  activeTab = signal<string>('suppliers');
 
  // ══════════════════════════════════════════════════════════════════════════
  // PROVEEDORES
  // ══════════════════════════════════════════════════════════════════════════
 
  suppliers       = signal<SupplierResponseDTO[]>([]);
  supplierTotal   = signal(0);
  supplierLoading = signal(true);
  supplierPage    = 0;
  supplierSort    = 'name,asc';
  supplierKeyword = '';
  private readonly supplierSearch$ = new Subject<string>();
 
  // ── Diálogo proveedor ────────────────────────────────────────────────────
  supplierDialogVisible = signal(false);
  supplierDialogMode    = signal<DialogMode>('create');
  supplierDialogLoading = signal(false);
  editingSupplierId     = signal<number | null>(null);
 
  supplierForm: FormGroup = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(200)]],
    contactName: ['', Validators.maxLength(150)],
    email:       ['', [Validators.email, Validators.maxLength(150)]],
    phone:       ['', Validators.maxLength(25)],
    address:     ['', Validators.maxLength(300)],
    notes:       [''],
  });
 
  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORÍAS
  // ══════════════════════════════════════════════════════════════════════════
 
  categories      = signal<CategoryResponseDTO[]>([]);
  categoryTotal   = signal(0);
  categoryLoading = signal(true);
  categoryPage    = 0;
  categorySort    = 'name,asc';
  categoryKeyword = '';
  private readonly categorySearch$ = new Subject<string>();
 
  // Opciones de categoría padre para el select del formulario
  parentCategoryOptions = signal<{ label: string; value: number | null }[]>([]);
 
  // ── Diálogo categoría ────────────────────────────────────────────────────
  categoryDialogVisible = signal(false);
  categoryDialogMode    = signal<DialogMode>('create');
  categoryDialogLoading = signal(false);
  editingCategoryId     = signal<number | null>(null);
 
  categoryForm: FormGroup = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(255)],
    parentId:    [null],
  });
 
  // ──────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadSuppliers();
    this.loadCategories();
    this.setupSupplierSearch();
    this.setupCategorySearch();
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  // PROVEEDORES — Carga y búsqueda
  // ══════════════════════════════════════════════════════════════════════════
 
  private setupSupplierSearch(): void {
    this.supplierSearch$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((kw) => {
          this.supplierLoading.set(true);
          this.supplierPage = 0;
          if (!kw.trim()) return this.catalogService.getSuppliers(0, PAGE_SIZE, this.supplierSort);
          return this.catalogService.searchSuppliers(kw.trim(), 0, PAGE_SIZE);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (page) => {
          this.suppliers.set(page.content);
          this.supplierTotal.set(page.totalElements);
          this.supplierLoading.set(false);
          this.cdr.markForCheck();
        },
        error: () => { this.supplierLoading.set(false); this.cdr.markForCheck(); },
      });
  }
 
  onSupplierSearch(value: string): void {
    this.supplierKeyword = value;
    this.supplierSearch$.next(value);
  }
 
  onSupplierLazyLoad(event: TableLazyLoadEvent): void {
    this.supplierPage = Math.floor((event.first ?? 0) / PAGE_SIZE);
    if (event.sortField) {
      this.supplierSort = `${event.sortField},${(event.sortOrder ?? 1) === 1 ? 'asc' : 'desc'}`;
    }
    this.loadSuppliers();
  }
 
  private loadSuppliers(): void {
    this.supplierLoading.set(true);
    const obs = this.supplierKeyword.trim()
      ? this.catalogService.searchSuppliers(this.supplierKeyword, this.supplierPage, PAGE_SIZE)
      : this.catalogService.getSuppliers(this.supplierPage, PAGE_SIZE, this.supplierSort);
 
    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.suppliers.set(page.content);
        this.supplierTotal.set(page.totalElements);
        this.supplierLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => { this.supplierLoading.set(false); this.cdr.markForCheck(); },
    });
  }
 
  // ── CRUD Proveedores ──────────────────────────────────────────────────────
 
  openCreateSupplier(): void {
    this.supplierForm.reset();
    this.editingSupplierId.set(null);
    this.supplierDialogMode.set('create');
    this.supplierDialogVisible.set(true);
  }
 
  openEditSupplier(supplier: SupplierResponseDTO): void {
    this.supplierForm.patchValue({
      name: supplier.name,
      contactName: supplier.contactName ?? '',
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      address: supplier.address ?? '',
      notes: supplier.notes ?? '',
    });
    this.editingSupplierId.set(supplier.id);
    this.supplierDialogMode.set('edit');
    this.supplierDialogVisible.set(true);
  }
 
  saveSupplier(): void {
    this.supplierForm.markAllAsTouched();
    if (this.supplierForm.invalid) return;
 
    this.supplierDialogLoading.set(true);
    const dto: SupplierRequestDTO = this.supplierForm.value;
    const isEdit = this.supplierDialogMode() === 'edit';
 
    const obs = isEdit
      ? this.catalogService.updateSupplier(this.editingSupplierId()!, dto)
      : this.catalogService.createSupplier(dto);
 
    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.supplierDialogLoading.set(false);
        this.supplierDialogVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary: isEdit ? 'Proveedor actualizado' : 'Proveedor creado',
          detail: `"${dto.name}" guardado correctamente.`,
          life: 4000,
        });
        this.loadSuppliers();
      },
      error: (err) => {
        this.supplierDialogLoading.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo guardar el proveedor.',
        });
        this.cdr.markForCheck();
      },
    });
  }
 
  confirmDeactivateSupplier(supplier: SupplierResponseDTO): void {
    this.confirmationService.confirm({
      header: 'Desactivar proveedor',
      message: `¿Deseas desactivar a <strong>${supplier.name}</strong>? El historial de facturas se conservará.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.catalogService.deactivateSupplier(supplier.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'info', summary: 'Desactivado',
                detail: `"${supplier.name}" fue desactivado.`, life: 4000,
              });
              this.loadSuppliers();
            },
            error: () => this.messageService.add({
              severity: 'error', summary: 'Error', detail: 'No se pudo desactivar el proveedor.',
            }),
          });
      },
    });
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORÍAS — Carga y búsqueda
  // ══════════════════════════════════════════════════════════════════════════
 
  private setupCategorySearch(): void {
    this.categorySearch$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((kw) => {
          this.categoryLoading.set(true);
          this.categoryPage = 0;
          if (!kw.trim()) return this.catalogService.getCategories(0, PAGE_SIZE, this.categorySort);
          return this.catalogService.searchCategories(kw.trim(), 0, PAGE_SIZE);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (page) => {
          this.categories.set(page.content);
          this.categoryTotal.set(page.totalElements);
          this.categoryLoading.set(false);
          this.cdr.markForCheck();
        },
        error: () => { this.categoryLoading.set(false); this.cdr.markForCheck(); },
      });
  }
 
  onCategorySearch(value: string): void {
    this.categoryKeyword = value;
    this.categorySearch$.next(value);
  }
 
  onCategoryLazyLoad(event: TableLazyLoadEvent): void {
    this.categoryPage = Math.floor((event.first ?? 0) / PAGE_SIZE);
    if (event.sortField) {
      this.categorySort = `${event.sortField},${(event.sortOrder ?? 1) === 1 ? 'asc' : 'desc'}`;
    }
    this.loadCategories();
  }
 
  private loadCategories(): void {
    this.categoryLoading.set(true);
    const obs = this.categoryKeyword.trim()
      ? this.catalogService.searchCategories(this.categoryKeyword, this.categoryPage, PAGE_SIZE)
      : this.catalogService.getCategories(this.categoryPage, PAGE_SIZE, this.categorySort);
 
    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.categories.set(page.content);
        this.categoryTotal.set(page.totalElements);
        this.categoryLoading.set(false);
        // Reconstruir opciones para el select de padre (excluye la que se edita)
        this.rebuildParentOptions(page.content);
        this.cdr.markForCheck();
      },
      error: () => { this.categoryLoading.set(false); this.cdr.markForCheck(); },
    });
  }
 
  private rebuildParentOptions(cats: CategoryResponseDTO[]): void {
    const editingId = this.editingCategoryId();
    const opts = [
      { label: '— Sin categoría padre (raíz) —', value: null },
      ...cats
        .filter((c) => c.id !== editingId) // no puede ser su propio padre
        .map((c) => ({ label: c.name, value: c.id })),
    ];
    this.parentCategoryOptions.set(opts as any);
  }
 
  // ── CRUD Categorías ───────────────────────────────────────────────────────
 
  openCreateCategory(): void {
    this.categoryForm.reset({ parentId: null });
    this.editingCategoryId.set(null);
    this.rebuildParentOptions(this.categories());
    this.categoryDialogMode.set('create');
    this.categoryDialogVisible.set(true);
  }
 
  openEditCategory(cat: CategoryResponseDTO): void {
    this.editingCategoryId.set(cat.id);
    this.rebuildParentOptions(this.categories());
    this.categoryForm.patchValue({
      name:        cat.name,
      description: cat.description ?? '',
      parentId:    cat.parentId ?? null,
    });
    this.categoryDialogMode.set('edit');
    this.categoryDialogVisible.set(true);
  }
 
  saveCategory(): void {
    this.categoryForm.markAllAsTouched();
    if (this.categoryForm.invalid) return;
 
    this.categoryDialogLoading.set(true);
    const dto: CategoryRequestDTO = {
      name:        this.categoryForm.value.name,
      description: this.categoryForm.value.description || undefined,
      parentId:    this.categoryForm.value.parentId ?? null,
    };
    const isEdit = this.categoryDialogMode() === 'edit';
 
    const obs = isEdit
      ? this.catalogService.updateCategory(this.editingCategoryId()!, dto)
      : this.catalogService.createCategory(dto);
 
    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.categoryDialogLoading.set(false);
        this.categoryDialogVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary: isEdit ? 'Categoría actualizada' : 'Categoría creada',
          detail: `"${dto.name}" guardada correctamente.`,
          life: 4000,
        });
        this.loadCategories();
      },
      error: (err) => {
        this.categoryDialogLoading.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo guardar la categoría.',
        });
        this.cdr.markForCheck();
      },
    });
  }
 
  confirmDeactivateCategory(cat: CategoryResponseDTO): void {
    this.confirmationService.confirm({
      header: 'Desactivar categoría',
      message: `¿Deseas desactivar <strong>${cat.name}</strong>? Los bienes con esta categoría conservarán su referencia.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.catalogService.deactivateCategory(cat.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'info', summary: 'Desactivada',
                detail: `"${cat.name}" fue desactivada.`, life: 4000,
              });
              this.loadCategories();
            },
            error: () => this.messageService.add({
              severity: 'error', summary: 'Error', detail: 'No se pudo desactivar la categoría.',
            }),
          });
      },
    });
  }
 
  // ── Helpers de formulario ─────────────────────────────────────────────────
 
  isInvalid(form: FormGroup, field: string): boolean {
    const c = form.get(field);
    return !!c && c.invalid && c.touched;
  }
}
