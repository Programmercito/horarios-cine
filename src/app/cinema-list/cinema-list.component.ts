import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, forkJoin, map, of } from 'rxjs';
import { Cinema } from '../shared/models';
import { EncodingCine } from '../shared/common/encoding';

@Component({
  selector: 'app-cinema-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cinema-list.component.html',
  styleUrl: './cinema-list.component.css'
})
export class CinemaListComponent extends EncodingCine implements OnInit {
  cinemas: Cinema[] = [];

  selectedCity: string | null = null;
  cinemaConfig: { [key: string]: boolean } = {};
  currentYear = new Date().getFullYear();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.selectedCity = params.get('city');
      if (this.selectedCity) {
        this.fetchCinemas(this.selectedCity);
      }
    });
  }

  private fetchCinemas(city: string) {
    // Load cinema config first
    this.http.get<{ [key: string]: boolean }>('/cinema-config.json').pipe(
      catchError(error => {
        console.error('Error loading cinema config:', error);
        return of({});
      })
    ).subscribe(config => {
      this.cinemaConfig = config;
      console.log('Cinema config loaded:', this.cinemaConfig);
      this.loadCinemas(city);
    });
  }

  private loadCinemas(city: string) {
    let fileIndex = 1;

    const fetchFile = () => {
      // Check localStorage first
      let storedData: string | null = null;
      storedData = localStorage.getItem('cine_' + fileIndex);
      if (storedData) {
        do {
          try {
            const data = JSON.parse(this.decodificarBase64(storedData));
            // Verificar si la fecha almacenada es actual
            if (this.isDataCurrent(data)) {
              this.processCinemaData(data, fileIndex, city);
              fileIndex++;
              storedData = localStorage.getItem('cine_' + fileIndex);
            } else {
              // Si la fecha no es actual, recargar desde remoto
              console.log(`Data for cine_${fileIndex} is outdated, fetching from remote...`);
              this.fetchRemoteCinemas(city);
              return; // Salir del bucle para evitar procesar datos antiguos
            }
          } catch (error) {
            console.error('Error parsing stored data:', error);
            // Si hay error, recargar desde remoto
            this.fetchRemoteCinemas(city);
            return;
          }
        } while (storedData);
      } else {
        this.fetchRemoteCinemas(city);
      }
    };

    fetchFile();
  }

  private isDataCurrent(data: any): boolean {
    if (!data || !data.fecha) {
      return false; // Si no hay fecha, consideramos que no es actual
    }

    const today = new Date();
    const dataDate = new Date(data.fecha);

    // Comparar solo año, mes y día (ignorar hora)
    return today.getFullYear() === dataDate.getFullYear() &&
      today.getMonth() === dataDate.getMonth() &&
      today.getDate() === dataDate.getDate();
  }
  private fetchRemoteCinemas(city: string) {
    let fileIndex = 1;
    const fetchremote = () => {
      this.http.get<any>(`/${fileIndex}.json`).pipe(
        catchError(error => {
          if (error.status === 404) {
            return EMPTY; // Stop fetching on 404
          }
          console.error(`Error fetching /${fileIndex}.json:`, error);
          return of(null);
        })
      ).subscribe(data => {
        if (data) {
          this.processCinemaData(data, fileIndex, city);
          localStorage.setItem('cine_' + fileIndex, this.codificarBase64(JSON.stringify(data)));
          fileIndex++;
          fetchremote();
        }
      });
    }
    fetchremote();
    this.loadPeliculasData();
  }
  private processCinemaData(data: any, fileIndex: number, city: string) {
    if (data && data.ciudades) {
      let cinemaname = data.cine || 'Unknown Cinema';
      console.log("cinemaname ", cinemaname);
      // Check if cinema is enabled in config
      if (this.cinemaConfig[fileIndex.toString()] === false) {
        console.log('Skipping disabled cinema:', fileIndex, cinemaname);
        return; // Skip disabled cinemas
      }
      data.ciudades.map((cityData: any) => {
        if (cityData.ciudad.toLowerCase().startsWith(city.toLowerCase())) {
          let cinema: Cinema = {
            id: fileIndex,
            name: cinemaname
          };
          const existingCinema = this.cinemas.find(c => c.name === cinema.name);
          if (!existingCinema) {
            this.cinemas.push(cinema);
          }
        }
      });
    }
  }

  goBack() {
    // Limpiar la ciudad guardada para mostrar la lista de ciudades
    localStorage.removeItem('selected_city');
    this.router.navigate(['/']);
  }
  loadPeliculasData() {
    // Check localStorage first
    const storedPeliculas = localStorage.getItem('peliculas');
    if (storedPeliculas) {
      try {
        const data = JSON.parse(this.decodificarBase64(storedPeliculas));
        // Verificar si alguna película tiene fecha actual
        const hasCurrentData = data.some((pelicula: any) => this.isDataCurrentFromArray(pelicula));

        if (hasCurrentData) {
          console.log('Peliculas data is current, using localStorage');
          return; // Los datos están actuales, no necesitamos recargar
        } else {
          console.log('Peliculas data is outdated, fetching from remote...');
        }
      } catch (error) {
        console.error('Error parsing stored peliculas data:', error);
      }
    }

    // Cargar desde remoto si no hay datos o están desactualizados
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

  private isDataCurrentFromArray(item: any): boolean {
    if (!item || !item.fecha) {
      return false;
    }

    const today = new Date();
    const itemDate = new Date(item.fecha);

    // Comparar solo año, mes y día (ignorar hora)
    return today.getFullYear() === itemDate.getFullYear() &&
      today.getMonth() === itemDate.getMonth() &&
      today.getDate() === itemDate.getDate();
  }
}
