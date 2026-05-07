import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogMode, SupplierRequestDTO, SupplierResponseDTO } from '../../../core/models/supplier.model';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SupplierService } from '../../../core/services/supplier/supplier.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TableModule, DialogModule, ConfirmDialogModule,
    ButtonModule, InputTextModule, TextareaModule, TagModule, ToastModule, 
    TooltipModule, SkeletonModule, IconFieldModule, InputIconModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './supplier.html',
  styleUrls: ['./supplier.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierComponent implements OnInit {
  private readonly supplierService     = inject(SupplierService);
  private readonly fb                  = inject(FormBuilder);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr                 = inject(ChangeDetectorRef);
  private readonly destroyRef          = inject(DestroyRef);

  readonly pageSize = PAGE_SIZE;

  suppliers       = signal<SupplierResponseDTO[]>([]);
  supplierTotal   = signal(0);
  supplierLoading = signal(true);
  supplierPage    = 0;
  supplierSort    = 'name,asc';
  supplierKeyword = '';
  private readonly supplierSearch$ = new Subject<string>();

  supplierDialogVisible = signal(false);
  supplierDialogMode    = signal<DialogMode>('create');
  supplierDialogLoading = signal(false);
  editingSupplierId     = signal<number | null>(null);

  supplierForm: FormGroup = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(200)]],
    rfc:         ['', [Validators.pattern('^[A-ZÑ&]{3,4}\\d{6}[A-Z0-9]{3}$'), Validators.maxLength(13)]],
    contactName: ['', Validators.maxLength(150)],
    email:       ['', [Validators.email, Validators.maxLength(150)]],
    phone:       ['', Validators.maxLength(25)],
    address:     ['', Validators.maxLength(300)],
    notes:       [''],
  });

  ngOnInit(): void {
    this.loadSuppliers();
    this.setupSupplierSearch();
  }

  private setupSupplierSearch(): void {
    this.supplierSearch$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((kw) => {
          this.supplierLoading.set(true);
          this.supplierPage = 0;
          if (!kw.trim()) return this.supplierService.getSuppliers(0, PAGE_SIZE, this.supplierSort);
          return this.supplierService.searchSuppliers(kw.trim(), 0, PAGE_SIZE);
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
      ? this.supplierService.searchSuppliers(this.supplierKeyword, this.supplierPage, PAGE_SIZE)
      : this.supplierService.getSuppliers(this.supplierPage, PAGE_SIZE, this.supplierSort);

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

  openCreateSupplier(): void {
    this.supplierForm.reset();
    this.editingSupplierId.set(null);
    this.supplierDialogMode.set('create');
    this.supplierDialogVisible.set(true);
  }

  openEditSupplier(supplier: SupplierResponseDTO): void {
    this.supplierForm.patchValue({
      name:        supplier.name,
      rfc:         supplier.rfc ?? '',
      contactName: supplier.contactName ?? '',
      email:       supplier.email ?? '',
      phone:       supplier.phone ?? '',
      address:     supplier.address ?? '',
      notes:       supplier.notes ?? '',
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
      ? this.supplierService.updateSupplier(this.editingSupplierId()!, dto)
      : this.supplierService.createSupplier(dto);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.supplierDialogLoading.set(false);
        this.supplierDialogVisible.set(false);
        this.messageService.add({
          severity: 'success', summary: isEdit ? 'Proveedor actualizado' : 'Proveedor creado',
          detail: `"${dto.name}" guardado correctamente.`, life: 4000,
        });
        this.loadSuppliers();
      },
      error: () => {
        this.supplierDialogLoading.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudo guardar el proveedor.',
        });
        this.cdr.markForCheck();
      },
    });
  }

  confirmDeactivateSupplier(supplier: SupplierResponseDTO): void {
    this.confirmationService.confirm({
      header: 'Desactivar proveedor',
      message: `¿Deseas desactivar <strong>${supplier.name}</strong>?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.supplierService.deactivateSupplier(supplier.id)
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
}