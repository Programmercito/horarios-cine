import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CityFilterService } from '../shared/citys/city-filter.service';
import { catchError, EMPTY, of, tap } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { EncodingCine } from '../shared/common/encoding';

@Component({
  selector: 'app-city-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './city-list.component.html',
  styleUrl: './city-list.component.css'
})
export class CityListComponent extends EncodingCine implements OnInit {
  cities: string[] = [];
  currentYear = new Date().getFullYear();
  cinemaConfig: { [key: string]: boolean } = {};
  private fileIndex = 1;
  private allCities = new Set<string>();

  constructor(
    private http: HttpClient,
    private cityFilterService: CityFilterService,
    private router: Router,
    private title: Title,
    private meta: Meta
  ) {
    super();
  }

  ngOnInit() {
    this.title.setTitle('Cinema Bo - Horarios de Cine en Bolivia');
    this.meta.updateTag({ name: 'description', content: 'Consulta la cartelera y horarios de películas en todos los cines de Bolivia. Elige tu ciudad y encuentra tu cine favorito.' });
    this.meta.updateTag({ property: 'og:title', content: 'Cinema Bo - Horarios de Cine en Bolivia' });
    this.meta.updateTag({ property: 'og:description', content: 'Consulta la cartelera y horarios de películas en todos los cines de Bolivia. Elige tu ciudad y encuentra tu cine favorito.' });

    // Verificar si hay una ciudad guardada para redirección automática
    const savedCity = localStorage.getItem('selected_city');
    if (savedCity) {
      // Redirigir automáticamente a la ciudad guardada
      this.router.navigate(['/cinemas', savedCity]);
      return;
    }

    this.loadCinemaConfig().subscribe(() => {
      this.fetchJsonFiles();
      this.loadPeliculasData();
    });
  }

  private loadCinemaConfig() {
    return this.http.get<{ [key: string]: boolean }>('/cinema-config.json').pipe(
      catchError(error => {
        console.error('Error loading cinema config:', error);
        return of({});
      }),
      tap(config => {
        this.cinemaConfig = config || {};
      })
    );
  }

  private fetchJsonFiles() {
    const enabledIds = Object.keys(this.cinemaConfig)
      .filter(id => this.cinemaConfig[id])
      .map(id => Number(id))
      .filter(id => !isNaN(id))
      .sort((a, b) => a - b);

    if (enabledIds.length === 0) {
      console.warn('No active cinema IDs configured. Falling back to sequential fetch.');
      this.fetchJsonFilesSequential();
      return;
    }

    this.fetchJsonFilesByIds(enabledIds, 0);
  }

  private fetchJsonFilesSequential() {
    this.http.get<any>(`/${this.fileIndex}.json`).pipe(
      catchError(error => {
        if (error.status === 404) {
          console.warn(`File /${this.fileIndex}.json not found (404). Stopping.`);
          this.cities = this.cityFilterService.filterCities(Array.from(this.allCities));
          return EMPTY;
        }
        console.error(`Error fetching /${this.fileIndex}.json:`, error);
        this.cities = Array.from(this.allCities);
        return EMPTY;
      })
    ).subscribe(data => {
      if (data && data.ciudades) {
        data.ciudades.forEach((cityData: any) => {
          this.allCities.add(cityData.ciudad);
        });
      }
      localStorage.setItem('cine_' + this.fileIndex, this.codificarBase64(JSON.stringify(data)));
      this.fileIndex++;
      this.fetchJsonFilesSequential();
    });
  }

  private fetchJsonFilesByIds(ids: number[], index: number) {
    if (index >= ids.length) {
      this.cities = this.cityFilterService.filterCities(Array.from(this.allCities));
      return;
    }

    const fileIndex = ids[index];
    this.http.get<any>(`/${fileIndex}.json`).pipe(
      catchError(error => {
        if (error.status === 404) {
          console.warn(`Active config says /${fileIndex}.json should exist, but it returned 404. Continuing.`);
          return of(null);
        }
        console.error(`Error fetching /${fileIndex}.json:`, error);
        return of(null);
      })
    ).subscribe(data => {
      if (data && data.ciudades) {
        data.ciudades.forEach((cityData: any) => {
          this.allCities.add(cityData.ciudad);
        });
      }

      if (data) {
        localStorage.setItem('cine_' + fileIndex, this.codificarBase64(JSON.stringify(data)));
      }

      this.fetchJsonFilesByIds(ids, index + 1);
    });
  }
  loadPeliculasData() {
    this.http.get<any>('/peliculas.json').pipe(
      catchError(error => {
        console.error('Error fetching peliculas.json:', error);
        return EMPTY;
      })
    ).subscribe(data => {
      if (data) {
        localStorage.setItem('peliculas', this.codificarBase64(JSON.stringify(data)));
      }
    });
  }
  goToCinemas(city: string) {
    // Guardar la ciudad seleccionada en localStorage
    localStorage.setItem('selected_city', city);
    this.router.navigate(['/cinemas', city]);
  }

  // Método público para limpiar la ciudad guardada (por si se necesita)
  clearSavedCity() {
    localStorage.removeItem('selected_city');
  }
}
