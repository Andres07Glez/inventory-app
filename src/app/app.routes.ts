import { Routes } from '@angular/router';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then(m => m.Shell),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/home/dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'inventario/bienes',
        loadComponent: () =>
          import('./modules/home/assets-list/assets-list').then(m => m.AssetsList),
      },
      {
        path: 'inventario/bienes/:id',
        loadComponent: () =>
          import('./modules/home/asset-detail/asset-detail').then(m => m.AssetDetail),
      },
      {
        // Sin query param → muestra búsqueda completa (acceso desde sidebar)
        // Con ?assetId=42   → salta la búsqueda, pre-carga el bien (acceso desde asset-detail)
        path: 'inventario/asignaciones',
        loadComponent: () =>
          import('./modules/home/asset-assignment/asset-assignment').then(m => m.AssetAssignmentComponent),
      },
      {
        path: 'registro',
        loadComponent: () =>
          import('./modules/home/asset-registration/asset-registration').then(m => m.AssetRegistration),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
