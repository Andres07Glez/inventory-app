import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { PanelModule } from 'primeng/panel';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';import { AssetSearchInput } from '../asset-search/asset-search';
import { ActivatedRoute, Router } from '@angular/router';
import { DecommissionService } from '../../../core/services/decomission/decommission.service';
import { MessageService } from 'primeng/api';
import { AssetSearchResult } from '../../../core/models/asset-assignment.model';

const MAX_PDF_MB = 20;

@Component({
  selector: 'app-decomission-create',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule, DatePickerModule, DividerModule,
    MessageModule, PanelModule, TextareaModule, ToastModule,
    AssetSearchInput,
  ],
  templateUrl: './decomission-create.html',
  styleUrl:    './decomission-create.scss',
})
export class DecomissionCreateComponent implements OnInit {

  private readonly route              = inject(ActivatedRoute);
  private readonly router             = inject(Router);
  private readonly decommissionService = inject(DecommissionService);
  private readonly messageService      = inject(MessageService);

  // ── Estado del formulario ─────────────────────────────────────────────────

  selectedAsset    = signal<AssetSearchResult | null>(null);
  justification    = signal('');
  decommissionDate = signal<Date | null>(new Date());
  selectedPdf      = signal<File | null>(null);
  pdfFileName      = signal<string | null>(null);
  saving           = signal(false);

  readonly today = new Date();

  /**
   * incidentId pre-rellenado cuando se llega desde el detalle de una incidencia.
   * Es OPCIONAL — la baja puede registrarse sin incidencia.
   */
  linkedIncidentId = signal<number | null>(null);

  get isFormValid(): boolean {
    return (
      this.selectedAsset() !== null &&
      this.justification().trim().length > 0 &&
      this.decommissionDate() !== null
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Pre-cargar parámetros si se llega desde el detalle de una incidencia
    const params = this.route.snapshot.queryParams;

    if (params['incidentId']) {
      this.linkedIncidentId.set(Number(params['incidentId']));
    }

    // assetId ya no se pre-selecciona aquí porque AssetSearchInput necesita
    // un objeto AssetSearchResult completo. Si se necesita, usar un resolver
    // que cargue el bien desde el backend. Por ahora el operador busca el bien.
  }

  // ── PDF ────────────────────────────────────────────────────────────────────

  onPdfSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.messageService.add({
        severity: 'warn', summary: 'Archivo inválido',
        detail: 'Solo se acepta un archivo PDF como acta de baja.', life: 4000,
      });
      return;
    }

    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      this.messageService.add({
        severity: 'warn', summary: 'Archivo muy grande',
        detail: `El PDF no puede superar ${MAX_PDF_MB} MB.`, life: 4000,
      });
      return;
    }

    this.selectedPdf.set(file);
    this.pdfFileName.set(file.name);
  }

  removePdf(): void {
    this.selectedPdf.set(null);
    this.pdfFileName.set(null);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (!this.isFormValid) return;

    const date = this.decommissionDate();
    const isoDate = date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      : null;

    this.saving.set(true);
    this.decommissionService.create(
      {
        assetId:          this.selectedAsset()!.id,
        incidentId:       this.linkedIncidentId(),
        justification:    this.justification().trim(),
        decommissionDate: isoDate,
      },
      this.selectedPdf(),
    ).subscribe({
      next: created => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Baja registrada',
          detail: `El proceso de baja del bien ${created.assetInventoryNumber} fue iniciado.`,
          life: 5000,
        });
        this.router.navigate(['/bajas', created.id]);
      },
      error: err => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error al registrar',
          detail: err.error?.message ?? 'No se pudo registrar la baja.', life: 5000,
        });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/bajas']);
  }
}

