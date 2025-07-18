import { Routes } from '@angular/router';
import { CityListComponent } from './city-list/city-list.component';
import { CinemaListComponent } from './cinema-list/cinema-list.component';

export const routes: Routes = [
    { path: '', component: CityListComponent },
    { path: 'cinemas', component: CinemaListComponent }
];