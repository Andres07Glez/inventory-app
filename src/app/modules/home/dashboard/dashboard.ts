import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-dashboard',
  standalone:true,
  imports: [CommonModule, CardModule, SkeletonModule, TagModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  // ── Placeholder KPIs (reemplazar con datos reales del backend) ────────────
  readonly kpis = [
    { label: 'Total de bienes',       value: '—',  icon: 'pi pi-box',                  severity: 'info',    detail: 'activos en sistema' },
    { label: 'Disponibles en almacén', value: '—', icon: 'pi pi-check-circle',          severity: 'success', detail: 'sin asignar' },
    { label: 'Incidencias abiertas',   value: '—', icon: 'pi pi-exclamation-triangle',  severity: 'danger',  detail: 'requieren atención' },
    { label: 'Mantenimientos del mes', value: '—', icon: 'pi pi-wrench',                severity: 'warn',    detail: 'este mes' },
  ];

  // ── Distribución por condición (donut chart — p-chart) ────────────────────
  readonly conditionData = {
    labels: ['Bueno', 'Regular', 'Malo'],
    datasets: [{
      data: [0, 0, 0],  // placeholder
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
    }],
  };

  // ── Top ubicaciones (bar chart — p-chart) ─────────────────────────────────
  readonly locationData = {
    labels: [],
    datasets: [{ label: 'Bienes asignados', data: [], backgroundColor: '#3b82f6' }],
  };

}
