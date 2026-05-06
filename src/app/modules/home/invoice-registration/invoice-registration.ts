import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { InvoiceService, InvoiceResponse, InvoiceRequest } from '../../../core/service/invoice.service';

@Component({
  selector: 'app-invoice-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    IconFieldModule,
    InputIconModule,
    SkeletonModule,
    TooltipModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './invoice-registration.html',
  styleUrls: ['./invoice-registration.css', '../../../shared/styles/primeng-overlays.css'],
})
export class InvoiceRegistration implements OnInit {

  // Referencia al input oculto de archivo
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ── Estado reactivo ──────────────────────────────────────────────────────────
  invoices         = signal<InvoiceResponse[]>([]);
  loading          = signal(true);
  saving           = signal(false);
  dialogVisible    = signal(false);
  editingInvoice   = signal<InvoiceResponse | null>(null);
  filterQuery      = signal('');
  selectedFileName = signal<string>('');

  // Solo los últimos 15 registros, respetando el filtro de búsqueda
  filteredInvoices = computed(() => {
    const q = this.filterQuery().toLowerCase().trim();
    const list = q
      ? this.invoices().filter(inv =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.supplier?.toLowerCase().includes(q)     ||
          inv.createdByName?.toLowerCase().includes(q)
        )
      : this.invoices();
    return list.slice(0, 15);
  });

  // ── Formulario ───────────────────────────────────────────────────────────────
  form!: FormGroup;

  readonly today   = new Date();
  readonly maxDate = new Date();

  constructor(
    private invoiceService: InvoiceService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      invoiceNumber: ['', [Validators.required, Validators.maxLength(100)]],
      supplier:      ['', [Validators.required, Validators.maxLength(200)]],  // ahora obligatorio
      invoiceDate:   [this.today, [Validators.required]],                     // predefinida: hoy
      documentPath:  ['', [Validators.maxLength(500)]],
      notes:         ['', [Validators.maxLength(1000)]],
    });
    this.loadInvoices();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  get isEditing(): boolean { return this.editingInvoice() !== null; }
  get dialogTitle(): string { return this.isEditing ? 'Editar factura' : 'Nueva factura'; }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.hasError(error) && ctrl.touched);
  }

  onFilterInput(event: Event): void {
    this.filterQuery.set((event.target as HTMLInputElement).value);
  }

  formatDate(dateStr: string | number[]): string {
    if (!dateStr) return '—';
    let y: number, m: number, d: number;
    if (Array.isArray(dateStr)) {
      [y, m, d] = dateStr;
    } else {
      const parts = (dateStr as string).split('-');
      [y, m, d] = [Number(parts[0]), Number(parts[1]), Number(parts[2])];
    }
    return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
  }

  // ── Selección de archivo ─────────────────────────────────────────────────────
  triggerFileSelect(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFileName.set(file.name);
    this.form.patchValue({ documentPath: file.name });
  }

  // ── Carga ────────────────────────────────────────────────────────────────────
  loadInvoices(): void {
    this.loading.set(true);
    this.invoiceService.getAll().subscribe({
      next: data => { this.invoices.set(data); this.loading.set(false); },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el catálogo de facturas.' });
        this.loading.set(false);
      },
    });
  }

  // ── Diálogo ──────────────────────────────────────────────────────────────────
  openCreate(): void {
    this.editingInvoice.set(null);
    this.selectedFileName.set('');
    this.form.reset({
      invoiceNumber: '',
      supplier:      '',
      invoiceDate:   this.today,
      documentPath:  '',
      notes:         '',
    });
    this.dialogVisible.set(true);
  }

  openEdit(invoice: InvoiceResponse): void {
    this.editingInvoice.set(invoice);
    this.selectedFileName.set(invoice.documentPath ?? '');
    this.form.patchValue({
      invoiceNumber: invoice.invoiceNumber,
      supplier:      invoice.supplier ?? '',
      invoiceDate:   invoice.invoiceDate ? this.toDate(invoice.invoiceDate) : this.today,
      documentPath:  invoice.documentPath ?? '',
      notes:         invoice.notes ?? '',
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingInvoice.set(null);
    this.selectedFileName.set('');
    this.form.reset();
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const raw = this.form.value;
    const payload: InvoiceRequest = {
      invoiceNumber: raw.invoiceNumber.trim(),
      supplier:      raw.supplier.trim(),
      invoiceDate:   this.toIsoDate(raw.invoiceDate),
      totalAmount:   1,                                  // siempre 0 por defecto
      documentPath:  raw.documentPath?.trim() || undefined,
      notes:         raw.notes?.trim() || undefined,
    };

    this.saving.set(true);

    const op$ = this.isEditing
      ? this.invoiceService.update(this.editingInvoice()!.id, payload)
      : this.invoiceService.create(payload);

    op$.subscribe({
      next: saved => {
        if (this.isEditing) {
          this.invoices.update(list => list.map(i => i.id === saved.id ? saved : i));
          this.messageService.add({ severity: 'success', summary: 'Actualizada', detail: `Factura "${saved.invoiceNumber}" actualizada.` });
        } else {
          this.invoices.update(list => [saved, ...list]);
          this.messageService.add({ severity: 'success', summary: 'Registrada', detail: `Factura "${saved.invoiceNumber}" registrada.` });
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
  confirmDelete(invoice: InvoiceResponse): void {
    this.confirmationService.confirm({
      message: `¿Desea eliminar la factura <strong>${invoice.invoiceNumber}</strong>?<br>
                <small>Solo es posible si no tiene bienes asociados.</small>`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.invoiceService.delete(invoice.id).subscribe({
          next: () => {
            this.invoices.update(list => list.filter(i => i.id !== invoice.id));
            this.messageService.add({ severity: 'warn', summary: 'Eliminada', detail: `Factura "${invoice.invoiceNumber}" eliminada.` });
          },
          error: err => {
            const detail = err?.error?.message ?? 'No se puede eliminar: la factura tiene bienes asociados.';
            this.messageService.add({ severity: 'error', summary: 'No se pudo eliminar', detail });
          },
        });
      },
    });
  }

  // ── Utils ────────────────────────────────────────────────────────────────────
  private toDate(dateStr: string | number[]): Date {
    if (Array.isArray(dateStr)) {
      const [y, m, d] = dateStr;
      return new Date(y, m - 1, d);
    }
    const [y, m, d] = (dateStr as string).split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private toIsoDate(date: Date | string): string {
    if (!date) return '';
    if (typeof date === 'string') return date;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}