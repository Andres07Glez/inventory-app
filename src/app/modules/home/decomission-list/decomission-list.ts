import { Component, inject, OnInit, signal } from '@angular/core';
import { DECOMMISSION_STATUS_LABEL, DECOMMISSION_STATUS_SEVERITY, DecommissionStatus, DecommissionSummary } from '../../../core/models/decommission.model';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule, TablePageEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DecommissionService } from '../../../core/services/decomission/decommission.service';
import { Router } from '@angular/router';
import { Page } from '../../../core/models/incident.model';

type PrimeSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

interface StatusOption { label: string; value: DecommissionStatus | null; }

@Component({
  selector: 'app-decomission-list',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule, SelectModule, SkeletonModule,
    TableModule, TagModule, ToastModule, TooltipModule,
  ],
  templateUrl: './decomission-list.html',
  styleUrl:    './decomission-list.scss',
})
export class DecommissionListComponent implements OnInit {

  private readonly decommissionService = inject(DecommissionService);
  private readonly router              = inject(Router);

  readonly pageData      = signal<Page<DecommissionSummary> | null>(null);
  readonly loading       = signal(true);
  readonly currentPage   = signal(0);
  readonly pageSize      = signal(20);
  readonly selectedStatus = signal<DecommissionStatus | null>(null);

  readonly statusOptions: StatusOption[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Pendiente',         value: 'PENDING' },
    { label: 'Confirmada',        value: 'CONFIRMED' },
  ];

  ngOnInit(): void { this.loadPage(); }

  loadPage(): void {
    this.loading.set(true);
    this.decommissionService
      .list(this.currentPage(), this.pageSize(), this.selectedStatus() ?? undefined)
      .subscribe({
        next: data => { this.pageData.set(data); this.loading.set(false); },
        error: ()   => { this.loading.set(false); },
      });
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPage.set(event.first / event.rows);
    this.pageSize.set(event.rows);
    this.loadPage();
  }

  onStatusChange(): void {
    this.currentPage.set(0);
    this.loadPage();
  }

  goToDetail(row: DecommissionSummary): void {
    this.router.navigate(['/bajas', row.id]);
  }

  goToCreate(): void {
    this.router.navigate(['/bajas/nueva']);
  }

  // ── UI helpers ────────────────────────────────────────────────────────────

  statusLabel    = (s: DecommissionStatus) => DECOMMISSION_STATUS_LABEL[s] ?? s;
  statusSeverity = (s: DecommissionStatus): PrimeSeverity =>
    (DECOMMISSION_STATUS_SEVERITY[s] ?? 'secondary') as PrimeSeverity;

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
}

