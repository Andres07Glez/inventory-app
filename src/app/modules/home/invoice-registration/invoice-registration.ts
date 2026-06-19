import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  DestroyRef, ElementRef, inject, OnInit, signal, ViewChild
} from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import {
  InvoiceRequest, InvoiceResponse, InvoiceService,
  SpringPage, SupplierResponse
} from '../../../core/service/invoice.service';

const PAGE_SIZE = 10;
 
const MIN_INVOICE_YEAR = 2000;
 
function minDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.getFullYear() > MIN_INVOICE_YEAR ? null : { minDate: { min: MIN_INVOICE_YEAR } };
}
 
@Component({
  selector: 'app-invoice-registration',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TableModule, DialogModule, ConfirmDialogModule,
    ButtonModule, InputTextModule, TextareaModule, DatePickerModule, SelectModule,
    ToastModule, TooltipModule, SkeletonModule, IconFieldModule, InputIconModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './invoice-registration.html',
  styleUrls: ['./invoice-registration.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceRegistration implements OnInit {
 
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
 
  private readonly invoiceService      = inject(InvoiceService);
  private readonly fb                  = inject(FormBuilder);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr                 = inject(ChangeDetectorRef);
  private readonly destroyRef          = inject(DestroyRef);
 
  readonly pageSize = PAGE_SIZE;
 
  // ── Tabla ────────────────────────────────────────────────────────────────
  invoices      = signal<InvoiceResponse[]>([]);
  invoiceTotal  = signal(0);
  invoiceLoading = signal(true);
  invoicePage   = 0;
  invoiceSort   = 'invoiceDate,desc';
  invoiceKeyword = '';
  private readonly invoiceSearch$ = new Subject<string>();
 
  // ── Diálogo ──────────────────────────────────────────────────────────────
  dialogVisible   = signal(false);
  dialogMode      = signal<'create' | 'edit'>('create');
  dialogLoading   = signal(false);
  editingId       = signal<number | null>(null);
  selectedFileName = signal('');
 
  // ── PDF ──────────────────────────────────────────────────────────────────
  /** Archivo PDF seleccionado por el usuario, listo para subir */
  public selectedFile: File | null = null;
  /** URL pública del PDF ya almacenado (viene del backend en modo edición) */
  existingDocumentUrl = signal<string | null>(null);
 
  // ── Proveedores ──────────────────────────────────────────────────────────
  suppliers        = signal<SupplierResponse[]>([]);
  loadingSuppliers = signal(false);
 
  readonly today   = new Date();
  readonly maxDate = new Date();
  readonly minDate = new Date(MIN_INVOICE_YEAR + 1, 0, 1); // 1 Jan 2001
 
  form: FormGroup = this.fb.group({
    invoiceNumber: ['', [Validators.required, Validators.maxLength(100)]],
    supplierId:    [null, Validators.required],
    invoiceDate:   [this.today, [Validators.required, minDateValidator]],
    notes:         ['', Validators.maxLength(1000)],
  });
 
  ngOnInit(): void {
    this.loadInvoices();
    this.loadSuppliers();
    this.setupSearch();
  }
 
  private setupSearch(): void {
    this.invoiceSearch$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(kw => {
        this.invoiceLoading.set(true);
        this.invoicePage = 0;
        return this.invoiceService.getAll(0, PAGE_SIZE, kw.trim());
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: page => this.applyPage(page),
      error: () => { this.invoiceLoading.set(false); this.cdr.markForCheck(); },
    });
  }
 
  private loadInvoices(): void {
    this.invoiceLoading.set(true);
    this.invoiceService.getAll(this.invoicePage, PAGE_SIZE, this.invoiceKeyword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => this.applyPage(page),
        error: () => { this.invoiceLoading.set(false); this.cdr.markForCheck(); },
      });
  }
 
  private applyPage(page: SpringPage<InvoiceResponse>): void {
    this.invoices.set(page.content);
    this.invoiceTotal.set(page.totalElements);
    this.invoiceLoading.set(false);
    this.cdr.markForCheck();
  }
 
  private loadSuppliers(): void {
    this.loadingSuppliers.set(true);
    this.invoiceService.getSuppliers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => { this.suppliers.set(page.content); this.loadingSuppliers.set(false); this.cdr.markForCheck(); },
        error: () => { this.loadingSuppliers.set(false); },
      });
  }
 
  onSearch(value: string): void {
    this.invoiceKeyword = value;
    this.invoiceSearch$.next(value);
  }
 
  onLazyLoad(event: TableLazyLoadEvent): void {
    this.invoicePage = Math.floor((event.first ?? 0) / PAGE_SIZE);
    if (event.sortField) {
      this.invoiceSort = `${event.sortField},${(event.sortOrder ?? -1) === 1 ? 'asc' : 'desc'}`;
    }
    this.loadInvoices();
  }
 
  // ── Diálogo ───────────────────────────────────────────────────────────────
  openCreate(): void {
    this.form.reset({ invoiceNumber: '', supplierId: null, invoiceDate: this.today, notes: '' });
    this.selectedFileName.set('');
    this.selectedFile = null;                   // limpiar archivo pendiente
    this.existingDocumentUrl.set(null);         // sin PDF previo
    this.editingId.set(null);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
  }
 
  openEdit(inv: InvoiceResponse): void {
    this.form.patchValue({
      invoiceNumber: inv.invoiceNumber,
      supplierId:    inv.supplierId ?? null,
      invoiceDate:   inv.invoiceDate ? this.toDate(inv.invoiceDate) : this.today,
      notes:         inv.notes ?? '',
    });
    this.selectedFileName.set('');
    this.selectedFile = null;                          // ningún archivo nuevo todavía
    this.existingDocumentUrl.set(inv.documentUrl ?? null); // URL del PDF actual
    this.editingId.set(inv.id);
    this.dialogMode.set('edit');
    this.dialogVisible.set(true);
  }
 
  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
 
    this.dialogLoading.set(true);
    const raw = this.form.value;
    const payload: InvoiceRequest = {
      invoiceNumber: raw.invoiceNumber.trim().toUpperCase(),
      supplierId:    raw.supplierId,
      invoiceDate:   this.toIsoDate(raw.invoiceDate),
      totalAmount:   1,
      notes:         raw.notes?.trim() || undefined,
    };
 
    const isEdit = this.dialogMode() === 'edit';
    const obs = isEdit
      ? this.invoiceService.update(this.editingId()!, payload)
      : this.invoiceService.create(payload);
 
    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: saved => {
        // Si el usuario seleccionó un PDF, subirlo ahora que ya tenemos el ID
        if (this.selectedFile) {
          this.uploadPdfAfterSave(saved);
        } else {
          this.onSaveSuccess(saved, isEdit);
        }
      },
      error: err => {
        this.dialogLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'No se pudo guardar la factura.' });
        this.cdr.markForCheck();
      },
    });
  }
 
  /**
   * Sube el PDF inmediatamente después de crear/actualizar la factura.
   * Se llama solo cuando el usuario seleccionó un archivo nuevo.
   */
  private uploadPdfAfterSave(saved: InvoiceResponse): void {
    this.invoiceService.uploadPdf(saved.id, this.selectedFile!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.selectedFile = null;
          this.onSaveSuccess(saved, this.dialogMode() === 'edit');
        },
        error: () => {
          // La factura se guardó correctamente; el PDF falló — avisar sin revertir
          this.dialogLoading.set(false);
          this.dialogVisible.set(false);
          this.messageService.add({
            severity: 'warn',
            summary: 'Factura guardada',
            detail: `"${saved.invoiceNumber}" se guardó, pero el PDF no pudo cargarse. Intenta subirlo de nuevo editando la factura.`,
            life: 6000,
          });
          this.loadInvoices();
        },
      });
  }
 
  /** Cierra el diálogo y notifica éxito completo. */
  private onSaveSuccess(saved: InvoiceResponse, isEdit: boolean): void {
    this.dialogLoading.set(false);
    this.dialogVisible.set(false);
    this.messageService.add({
      severity: 'success',
      summary: isEdit ? 'Factura actualizada' : 'Factura registrada',
      detail: `"${saved.invoiceNumber}" guardada correctamente.`, life: 4000,
    });
    this.loadInvoices();
  }
 
  confirmDelete(inv: InvoiceResponse): void {
    this.confirmationService.confirm({
      header: 'Eliminar factura',
      message: `¿Deseas eliminar la factura <strong>${inv.invoiceNumber}</strong>?<br><small>Solo es posible si no tiene bienes asociados.</small>`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.invoiceService.delete(inv.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'info', summary: 'Eliminada', detail: `"${inv.invoiceNumber}" fue eliminada.`, life: 4000 });
              this.loadInvoices();
            },
            error: err => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'No se pudo eliminar la factura.' }),
          });
      },
    });
  }
 
  // ── Archivo ───────────────────────────────────────────────────────────────
  triggerFileSelect(): void { this.fileInput.nativeElement.click(); }
 
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
 
    // Validar que sea PDF antes de aceptarlo
    if (file.type !== 'application/pdf') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formato incorrecto',
        detail: 'Solo se permiten archivos PDF.',
      });
      this.fileInput.nativeElement.value = '';
      return;
    }
 
    this.selectedFile = file;       // guardar referencia al File real
    this.selectedFileName.set(file.name);
  }
 
  /** Abre el PDF actual en una pestaña nueva (solo en modo edición). */
  viewExistingPdf(): void {
    const url = this.existingDocumentUrl();
    if (url) window.open(url, '_blank');
  }
 
  // ── Utils ─────────────────────────────────────────────────────────────────
  formatDate(d: string | number[]): string {
    if (!d) return '—';
    const [y, m, day] = Array.isArray(d) ? d : (d as string).split('-').map(Number);
    return `${String(day).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
  }
 
  private toDate(d: string | number[]): Date {
    if (Array.isArray(d)) return new Date(d[0], d[1] - 1, d[2]);
    const [y, m, day] = (d as string).split('-').map(Number);
    return new Date(y, m - 1, day);
  }
 
  private toIsoDate(d: Date | string): string {
    if (!d) return '';
    if (typeof d === 'string') return d;
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
 
  hasError(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!(c?.hasError(error) && c.touched);
  }
}