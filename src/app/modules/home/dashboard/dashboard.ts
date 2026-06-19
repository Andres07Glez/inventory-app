import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardStats } from '../../../core/models/dashboard-stats.model';
import { DashboardService } from '../../../core/services/dashboard/dashboard.service';
import { CAMPUS_LABELS } from '../../../core/models/location.model';
import { ChartModule } from 'primeng/chart';
import type { ChartData, ChartOptions } from 'chart.js';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ── Constantes de diseño ──────────────────────────────────────────────────────
const CHART_COLORS = {
  good:    '#18B32A',
  regular: '#D4A91D',
  bad:     '#B31818',
  primary: '#007D68',
  neutral: '#E2E8ED',
} as const;

// ── Tipos locales ─────────────────────────────────────────────────────────────
interface KpiConfig {
  label:  string;
  value:  string;
  icon:   string;
  color:  'primary' | 'success' | 'danger' | 'warning';
  detail: string;
}

@Component({
  selector: 'app-dashboard',
  standalone:true,
  imports: [SkeletonModule, RouterLink,ChartModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit{
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef       = inject(DestroyRef);

  readonly stats   = signal<DashboardStats | null>(null);
  readonly loading = signal(true);
  readonly error   = signal(false);

  // ── Gráficas tipadas ──────────────────────────────────────────────────────
  readonly conditionChartData = signal<ChartData<'doughnut'> | null>(null);
  readonly conditionChartOpts = signal<ChartOptions<'doughnut'> | null>(null);
  readonly locationChartData  = signal<ChartData<'bar'> | null>(null);
  readonly locationChartOpts  = signal<ChartOptions<'bar'> | null>(null);
  // ── KPIs como computed — se recalcula solo cuando stats() cambia ──────────
  readonly kpis = computed<KpiConfig[]>(() => {              // ← ya no es un método
    const s = this.stats();
    if (!s) return [];
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
        label:  'En mantenimiento',
        value:  s.inMaintenanceAssets.toLocaleString('es-MX'),
        icon:   'pi pi-wrench',
        color:  'warning',
        detail: 'bienes bloqueados',
      },
      {
        label:  'Incidencias abiertas',
        value:  s.openIncidents.toLocaleString('es-MX'),
        icon:   'pi pi-exclamation-triangle',
        color:  'danger',
        detail: 'requieren atención',
      },
    ];
  });

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.dashboardService.getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))              // ← cleanup automático
      .subscribe({
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
  // ── Construcción de gráficas ─────────────────────────────────────────────
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
            font:            { family: 'Roboto', size: 12 },
            padding:         16,
            usePointStyle:   true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.raw as number;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
              return ` ${ctx.label}: ${val.toLocaleString('es-MX')} (${pct}%)`;
            },
          },
        },
      },
      cutout:              '65%',
      maintainAspectRatio: false,
    });
  }

  private buildLocationChart(s: DashboardStats): void {
    if (!s.topLocations?.length) {
      this.locationChartData.set(null);
      return;
    }

    const labels = s.topLocations.map(l => {
      const campusStr = l.campus ? CAMPUS_LABELS[l.campus] : null;
      const label = campusStr ? `${l.locationName} · ${campusStr}` : l.locationName;
      return label.length > 28 ? label.substring(0, 26) + '…' : label;
    });

    this.locationChartData.set({
      labels,
      datasets: [{
        label:               'Bienes asignados',
        data:                s.topLocations.map(l => l.assetCount),
        backgroundColor:     CHART_COLORS.primary,
        hoverBackgroundColor: '#006355',
        borderRadius:        6,
        borderSkipped:       false,
      }],
    });

    this.locationChartOpts.set({
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${(ctx.raw as number).toLocaleString('es-MX')} bienes`,
          },
        },
      },
      scales: {
        x: {
          grid:  { color: CHART_COLORS.neutral },
          ticks: { font: { family: 'Roboto', size: 11 } },
        },
        y: {
          grid:  { display: false },
          ticks: { font: { family: 'Roboto', size: 11 } },
        },
      },
      maintainAspectRatio: false,
    });
  }
}