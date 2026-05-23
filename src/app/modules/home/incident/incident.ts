import { Component, inject, Injectable, OnInit, signal } from '@angular/core';import { Observable } from 'rxjs';
import { TableModule, TablePageEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IncidentService } from '../../../core/services/incident/incident.service';
import { INCIDENT_STATUS_LABEL, INCIDENT_STATUS_SEVERITY, IncidentDetail, IncidentStatus, IncidentSummary, Page, REPAIR_TYPE_LABEL } from '../../../core/models/incident.model';
import { FormsModule } from '@angular/forms';
import { SkeletonModule } from 'primeng/skeleton';
import { IncidentCreate } from '../incident-create/incident-create';
import { Router } from '@angular/router';

type PrimeSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

interface StatusOption { label: string; value: IncidentStatus | null; }
 
@Component({
  selector: 'app-incident',
  standalone: true,
  imports: [
    FormsModule,
    TableModule, ButtonModule, TagModule, SelectModule,
    SkeletonModule, ToastModule, TooltipModule,
    IncidentCreate,
  ],
  templateUrl: './incident.html',
  styleUrl:    './incident.scss',
})
export class IncidentComponent implements OnInit {
 
  private readonly incidentService = inject(IncidentService);
  private readonly router          = inject(Router);
 
  // ── Estado de la lista ────────────────────────────────────────────────────
  readonly pageData      = signal<Page<IncidentSummary> | null>(null);
  readonly loading        = signal(true);
  readonly currentPage    = signal(0);
  readonly pageSize       = signal(20);
  readonly selectedStatus = signal<IncidentStatus | null>(null);
  readonly showCreate     = signal(false);
 
  readonly statusOptions: StatusOption[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Abierta',           value: 'OPEN' },
    { label: 'En proceso',        value: 'IN_PROGRESS' },
    { label: 'Resuelta',          value: 'RESOLVED' },
    { label: 'Cerrada',           value: 'CLOSED' },
  ];
 
  ngOnInit(): void { this.loadPage(); }
 
  loadPage(): void {
    this.loading.set(true);
    this.incidentService
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
 
  goToDetail(incident: IncidentSummary): void {
    this.router.navigate(['/incidencias', incident.id]);
  }
 
  onIncidentCreated(incident: IncidentDetail): void {
    this.loadPage();
    this.router.navigate(['/incidencias', incident.id]);
  }
 
  // ── Helpers de UI ─────────────────────────────────────────────────────────
 
  statusLabel    = (s: IncidentStatus) => INCIDENT_STATUS_LABEL[s]    ?? s;
  statusSeverity = (s: IncidentStatus): PrimeSeverity => 
  (INCIDENT_STATUS_SEVERITY[s] ?? 'secondary') as PrimeSeverity;  repairLabel    = (r: string | null)  => r ? (REPAIR_TYPE_LABEL[r as keyof typeof REPAIR_TYPE_LABEL] ?? r) : '—';
 
  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
}
