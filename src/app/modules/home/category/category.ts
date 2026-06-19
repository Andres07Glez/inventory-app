import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryRequestDTO, CategoryResponseDTO, DialogMode } from '../../../core/models/category.model';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CategoryService } from '../../../core/services/category/category.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { RippleModule } from 'primeng/ripple';

const DEFAULT_PAGE_SIZE = 10;

/** Estado de paginación cohesionado. Inmutable: siempre se reemplaza completo. */
interface PaginationState {
  readonly page:     number;
  readonly pageSize: number;
  readonly sort:     string;
  readonly keyword:  string;
}
 
@Component({
  selector: 'app-category',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TableModule, DialogModule, ConfirmDialogModule,
    ButtonModule, InputTextModule, TextareaModule, SelectModule, TagModule,
    ToastModule, TooltipModule, SkeletonModule, IconFieldModule, InputIconModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './category.html',
  styleUrls: ['./category.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryComponent implements OnInit {
  private readonly categoryService       = inject(CategoryService);
  private readonly fb                    = inject(FormBuilder);
  private readonly messageService        = inject(MessageService);
  private readonly confirmationService   = inject(ConfirmationService);
  private readonly cdr                   = inject(ChangeDetectorRef);
  private readonly destroyRef            = inject(DestroyRef);

  // ── Estado de paginación cohesionado ──────────────────────────────────────
  /** Fuente única de verdad para paginación, orden y búsqueda.
   *  Al ser un signal se puede leer en computed() y markForCheck() reacciona. */
  private readonly pagination = signal<PaginationState>({
    page:     0,
    pageSize: DEFAULT_PAGE_SIZE,
    sort:     'id,asc',
    keyword:  '',
  });

  /** Expuesto al template solo para [rows] inicial del p-table */
  readonly pageSize = DEFAULT_PAGE_SIZE;

  /** Keyword expuesto al template para el [value] del input de búsqueda */
  get categoryKeyword(): string { return this.pagination().keyword; }
  // ─────────────────────────────────────────────────────────────────────────

  categories      = signal<CategoryResponseDTO[]>([]);
  categoryTotal   = signal(0);
  categoryLoading = signal(true);
  private readonly categorySearch$ = new Subject<string>();
 
  // ── Tree expand/collapse ──────────────────────────────────────────────────
  /** IDs de categorías padre actualmente expandidas */
  expandedCategories = signal<Set<number>>(new Set());
 
  /** Set con los IDs que tienen al menos un hijo en la página cargada */
  categoriesWithChildren = computed(() => {
    const ids = new Set<number>();
    for (const cat of this.categories()) {
      if (cat.parentId != null) {
        ids.add(cat.parentId);
      }
    }
    return ids;
  });
 
  /** Filas visibles: raíces en orden de registro; hijos insertados
   *  inmediatamente debajo de su padre cuando éste está expandido. */
  visibleCategories = computed(() => {
    const expanded = this.expandedCategories();
    const all      = this.categories();
 
    // Agrupar hijos por parentId para inserción rápida
    const childrenByParent = new Map<number, CategoryResponseDTO[]>();
    for (const cat of all) {
      if (cat.parentId != null) {
        const siblings = childrenByParent.get(cat.parentId) ?? [];
        siblings.push(cat);
        childrenByParent.set(cat.parentId, siblings);
      }
    }
 
    // Construir lista: cada raíz seguida de sus hijos (si está expandida)
    const result: CategoryResponseDTO[] = [];
    for (const cat of all) {
      if (cat.parentId != null) continue;   // los hijos se insertan con su padre
      result.push(cat);
      if (expanded.has(cat.id)) {
        const children = childrenByParent.get(cat.id) ?? [];
        result.push(...children);
      }
    }
    return result;
  });
 
  /** Expande o colapsa una categoría padre */
  toggleCategory(id: number): void {
    const next = new Set(this.expandedCategories());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.expandedCategories.set(next);
  }
  // ─────────────────────────────────────────────────────────────────────────
 
  parentCategoryOptions = signal<{ label: string; value: number | null }[]>([]);
 
  categoryDialogVisible = signal(false);
  categoryDialogMode    = signal<DialogMode>('create');
  categoryDialogLoading = signal(false);
  editingCategoryId     = signal<number | null>(null);
 
  categoryForm: FormGroup = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(255)],
    parentId:    [null],
  });
 
  ngOnInit(): void {
    this.loadCategories();
    this.setupCategorySearch();
  }
 
  private setupCategorySearch(): void {
    this.categorySearch$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((kw) => {
          // Resetear a página 0 al buscar; conservar pageSize y sort del usuario
          const { pageSize, sort } = this.pagination();
          this.pagination.set({ page: 0, pageSize, sort, keyword: kw });
          this.categoryLoading.set(true);

          const trimmed = kw.trim();
          if (!trimmed) return this.categoryService.getCategories(0, pageSize, sort);
          return this.categoryService.searchCategories(trimmed, 0, pageSize);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (page) => {
          this.categories.set(page.content);
          this.categoryTotal.set(page.totalElements);
          this.updateParentOptions(page.content);
          // Al buscar expandimos todo para no ocultar resultados hijos
          this.expandedCategories.set(
            new Set(page.content.map((c: CategoryResponseDTO) => c.id))
          );
          this.categoryLoading.set(false);
          this.cdr.markForCheck();
        },
        error: () => { this.categoryLoading.set(false); this.cdr.markForCheck(); },
      });
  }

  onCategorySearch(value: string): void {
    this.categorySearch$.next(value);
  }

  onCategoryLazyLoad(event: TableLazyLoadEvent): void {
    // FIX: usar event.rows (tamaño de página REAL elegido por el usuario)
    // en vez de la constante DEFAULT_PAGE_SIZE. Sin esto, al cambiar a 25 o
    // 50 filas la división produce un número de página incorrecto para el backend.
    const currentSize = this.pagination().pageSize;
    const incomingSize = event.rows ?? currentSize;
    const page = Math.floor((event.first ?? 0) / incomingSize);

    const sort = event.sortField
      ? `${event.sortField},${(event.sortOrder ?? 1) === 1 ? 'asc' : 'desc'}`
      : this.pagination().sort;

    this.pagination.update(prev => ({ ...prev, page, pageSize: incomingSize, sort }));
    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoryLoading.set(true);
    const { page, pageSize, sort, keyword } = this.pagination();
    const trimmed = keyword.trim();

    const obs = trimmed
      ? this.categoryService.searchCategories(trimmed, page, pageSize)
      : this.categoryService.getCategories(page, pageSize, sort);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.categories.set(res.content);
        this.categoryTotal.set(res.totalElements);
        this.updateParentOptions(res.content);
        this.expandedCategories.set(new Set());
        this.categoryLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => { this.categoryLoading.set(false); this.cdr.markForCheck(); },
    });
  }
 
  private updateParentOptions(categories: CategoryResponseDTO[]): void {
    const opts = categories
      .filter(c => c.isActive && !c.parentId)
      .map(c => ({ label: c.name, value: c.id }));
    this.parentCategoryOptions.set(opts);
  }
 
  openCreateCategory(): void {
    this.categoryForm.reset();
    this.editingCategoryId.set(null);
    this.categoryDialogMode.set('create');
    this.categoryDialogVisible.set(true);
  }
 
  openEditCategory(cat: CategoryResponseDTO): void {
    this.categoryForm.patchValue({
      name: cat.name,
      description: cat.description ?? '',
      parentId: cat.parentId ?? null,
    });
    this.editingCategoryId.set(cat.id);
    this.categoryDialogMode.set('edit');
    this.categoryDialogVisible.set(true);
  }
 
  saveCategory(): void {
    this.categoryForm.markAllAsTouched();
    if (this.categoryForm.invalid) return;
 
    this.categoryDialogLoading.set(true);
    const dto: CategoryRequestDTO = this.categoryForm.value;
    const isEdit = this.categoryDialogMode() === 'edit';
    const obs = isEdit
      ? this.categoryService.updateCategory(this.editingCategoryId()!, dto)
      : this.categoryService.createCategory(dto);
 
    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.categoryDialogLoading.set(false);
        this.categoryDialogVisible.set(false);
        this.messageService.add({
          severity: 'success', summary: isEdit ? 'Categoría actualizada' : 'Categoría creada',
          detail: `"${dto.name}" guardado correctamente.`, life: 4000,
        });
        this.loadCategories();
      },
      error: () => {
        this.categoryDialogLoading.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudo guardar la categoría.',
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
        this.categoryService.deactivateCategory(cat.id)
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
}