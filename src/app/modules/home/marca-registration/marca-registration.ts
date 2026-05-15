import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { BrandService, BrandResponse, BrandRequest } from '../../../core/service/brand.service';

@Component({
  selector: 'app-marca-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    SkeletonModule,
    TooltipModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './marca-registration.html',
  styleUrls: ['./marca-registration.css'],
})
export class MarcaRegistration implements OnInit {

  // ── Estado reactivo ──────────────────────────────────────────────────────────
  brands = signal<BrandResponse[]>([]);
  loading = signal(true);
  saving = signal(false);
  dialogVisible = signal(false);
  editingBrand = signal<BrandResponse | null>(null);
  filterQuery = signal('');

  filteredBrands = computed(() => {
    const q = this.filterQuery().toLowerCase().trim();
    if (!q) return this.brands();
    return this.brands().filter(b => b.name.toLowerCase().includes(q));
  });

  // ── Formulario ───────────────────────────────────────────────────────────────
  form!: FormGroup;

  constructor(
    private brandService: BrandService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
    });
    this.loadBrands();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  get isEditing(): boolean { return this.editingBrand() !== null; }
  get dialogTitle(): string { return this.isEditing ? 'Editar marca' : 'Nueva marca'; }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.hasError(error) && ctrl.touched);
  }

  onFilterInput(event: Event): void {
    this.filterQuery.set((event.target as HTMLInputElement).value);
  }

  // ── Carga ────────────────────────────────────────────────────────────────────
  loadBrands(): void {
    this.loading.set(true);
    this.brandService.getAll().subscribe({
      next: data => { this.brands.set(data); this.loading.set(false); },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el catálogo de marcas.' });
        this.loading.set(false);
      },
    });
  }

  // ── Diálogo ──────────────────────────────────────────────────────────────────
  openCreate(): void {
    this.editingBrand.set(null);
    this.form.reset();
    this.dialogVisible.set(true);
  }

  openEdit(brand: BrandResponse): void {
    this.editingBrand.set(brand);
    this.form.patchValue({ name: brand.name });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingBrand.set(null);
    this.form.reset();
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const payload: BrandRequest = { name: this.form.value.name.trim() };
    this.saving.set(true);

    const op$ = this.isEditing
      ? this.brandService.update(this.editingBrand()!.id, payload)
      : this.brandService.create(payload);

    op$.subscribe({
      next: saved => {
        if (this.isEditing) {
          this.brands.update(list => list.map(b => b.id === saved.id ? saved : b));
          this.messageService.add({ severity: 'success', summary: 'Actualizada', detail: `La marca "${saved.name}" fue actualizada.` });
        } else {
          this.brands.update(list => [...list, saved].sort((a, b) => a.name.localeCompare(b.name)));
          this.messageService.add({ severity: 'success', summary: 'Registrada', detail: `La marca "${saved.name}" fue registrada.` });
        }
        this.saving.set(false);
        this.closeDialog();
      },
      error: err => {
        const detail = err?.error?.message ?? 'Ocurrió un error al guardar.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
        this.saving.set(false);
      },
    });
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  confirmDelete(brand: BrandResponse): void {
    this.confirmationService.confirm({
      message: `¿Desea desactivar la marca <strong>${brand.name}</strong>?<br><small>El registro no se eliminará, solo quedará inactivo.</small>`,
      header: 'Confirmar desactivación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.brandService.delete(brand.id).subscribe({
          next: () => {
            this.brands.update(list => list.filter(b => b.id !== brand.id));
            this.messageService.add({ severity: 'warn', summary: 'Desactivada', detail: `La marca "${brand.name}" fue desactivada.` });
          },
          /*error: err => {
            const detail = err?.error?.message ?? 'No se pudo desactivar la marca.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail });
          },*/
          error: err => {
            const isBrandInUse = err.status === 409;
            this.messageService.add({
              severity: isBrandInUse ? 'warn' : 'error',
              summary: isBrandInUse ? 'Marca en uso' : 'Error',
              detail: err?.error?.message
                ?? (isBrandInUse
                  ? 'Esta marca está vinculada a bienes y no puede desactivarse.'
                  : 'No se pudo desactivar la marca.'),
              life: isBrandInUse ? 6000 : 4000,
            });
          },
        });
      },
    });
  }
}