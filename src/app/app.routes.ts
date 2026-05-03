import { Routes } from '@angular/router';

//import { AssetRegistration } from './modules/home/asset-registration/asset-registration';
import { MarcaRegistration } from './modules/home/marca-registration/marca-registration';

export const routes: Routes = [
  { path: 'marcas', component: MarcaRegistration }
];