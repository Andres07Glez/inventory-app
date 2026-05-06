import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { DashboardStats } from '../../../core/models/dashboard-stats.model';
import { DashboardService } from '../../../core/services/dashboard/dashboard.service';
import { ChartModule } from 'primeng/chart';

const CHART_COLORS = {
  good:     '#18B32A',   // --color-success
  regular:  '#D4A91D',   // --color-warning
  bad:      '#B31818',   // --color-danger
  primary:  '#007D68',   // --color-primary
  neutral:  '#E2E8ED',   // --surface-border (hover/grid lines)
};

@Component({
  selector: 'app-dashboard',
  standalone:true,
  imports: [CommonModule, SkeletonModule, TagModule, RouterLink,ChartModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit{
  private readonly dashboardService = inject(DashboardService);

  stats   = signal<DashboardStats | null>(null);
  loading = signal(true);
  error   = signal(false);

  // Los datos de Chart.js se generan cuando llegan las stats
  conditionChartData  = signal<any>(null);
  conditionChartOpts  = signal<any>(null);
  locationChartData   = signal<any>(null);
  locationChartOpts   = signal<any>(null);

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.buildCharts(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  getKpis(s: DashboardStats) {
    return [
      {
        label:  'Total de bienes',
        value:  s.totalAssets.toLocaleString('es-MX'),
        icon:   'pi pi-box',
        color:  'primary',
        detail: 'activos en sistema',
      },
      {
        label:  'Disponibles',
        value:  s.availableAssets.toLocaleString('es-MX'),
        icon:   'pi pi-check-circle',
        color:  'success',
        detail: 'sin asignar',
      },
      {
        label:  'Incidencias abiertas',
        value:  s.openIncidents.toLocaleString('es-MX'),
        icon:   'pi pi-exclamation-triangle',
        color:  'danger',
        detail: 'requieren atención',
      },
      {
        label:  'Mantenimientos del mes',
        value:  s.maintenanceThisMonth.toLocaleString('es-MX'),
        icon:   'pi pi-wrench',
        color:  'warning',
        detail: 'este mes',
      },
    ];
  }

  // ── Construcción de gráficas ──────────────────────────────────────────────
  private buildCharts(s: DashboardStats): void {
    this.buildConditionChart(s);
    this.buildLocationChart(s);
  }

  private buildConditionChart(s: DashboardStats): void {
    const total = s.goodCondition + s.regularCondition + s.badCondition;

    this.conditionChartData.set({
      labels: ['Bueno', 'Regular', 'Malo'],
      datasets: [{
        data:            [s.goodCondition, s.regularCondition, s.badCondition],
        backgroundColor: [CHART_COLORS.good, CHART_COLORS.regular, CHART_COLORS.bad],
        hoverOffset:     6,
        borderWidth:     2,
        borderColor:     '#ffffff',
      }],
    });

    this.conditionChartOpts.set({
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Roboto', size: 12 },
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          callbacks: {
            // Muestra: "Bueno: 6,420 (57%)"
            label: (ctx: any) => {
              const val = ctx.raw as number;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
              return ` ${ctx.label}: ${val.toLocaleString('es-MX')} (${pct}%)`;
            },
          },
        },
      },
      cutout: '65%',   // dona más delgada, se ve más moderna
      maintainAspectRatio: false,
    });
  }

  private buildLocationChart(s: DashboardStats): void {
    if (!s.topLocations?.length) {
      this.locationChartData.set(null);
      return;
    }

    // Trunca labels largos para no romper el layout de la gráfica
    const labels = s.topLocations.map(l => {
      const label = l.campus ? `${l.locationName} · ${l.campus}` : l.locationName;
      return label.length > 28 ? label.substring(0, 26) + '…' : label;
    });

    this.locationChartData.set({
      labels,
      datasets: [{
        label:           'Bienes asignados',
        data:            s.topLocations.map(l => l.assetCount),
        backgroundColor: CHART_COLORS.primary,
        hoverBackgroundColor: '#006355',
        borderRadius:    6,
        borderSkipped:   false,
      }],
    });

    this.locationChartOpts.set({
      indexAxis: 'y',   // barras horizontales — más espacio para labels largos
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) =>
              ` ${(ctx.raw as number).toLocaleString('es-MX')} bienes`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: CHART_COLORS.neutral },
          ticks: { font: { family: 'Roboto', size: 11 } },
        },
        y: {
          grid: { display: false },
          ticks: { font: { family: 'Roboto', size: 11 } },
        },
      },
      maintainAspectRatio: false,
    });
  }
}
