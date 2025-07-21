import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CineData, Ciudad, Pelicula } from '../shared/models';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule-list.component.html',
  styleUrls: ['./schedule-list.component.css']
})
export class ScheduleListComponent implements OnInit {
  city: string = '';
  cinemid: string = '';
  cinemaName: string = '';
  cinemaDate: string = '';
  cinemaData: CineData | null = null;
  pelidata: Pelicula[] = [];
  ciudadesFiltradas: Ciudad[] = [];
  
  // Popup variables
  showMoviePopup: boolean = false;
  currentPeli: Pelicula | null = null;
  
  // Schedule popup variables
  showSchedulePopup: boolean = false;
  currentSchedule: any = null;
  currentMovieTitle: string = '';
  constructor(private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.city = params.get('city') || '';
      this.cinemid = params.get('id') || '';
      this.fetchcinema(this.cinemid, this.city);
    });
  }
  fetchcinema(cinemid: string, city: string) {
    // Check localStorage first
    const storedData = localStorage.getItem('cine_' + cinemid);
    if (storedData) {
      try {
        const data = JSON.parse(atob(storedData));
        // Verificar si la fecha almacenada es actual
        if (this.isDataCurrent(data)) {
          this.processCinemaData(data);
        } else {
          // Si la fecha no es actual, recargar desde remoto
          console.log(`Data for cine_${cinemid} is outdated, fetching from remote...`);
          this.fetchAllRemoteCinemas(cinemid);
        }
      } catch (error) {
        console.error('Error parsing stored cinema data:', error);
        this.fetchAllRemoteCinemas(cinemid);
      }
    } else {
      this.fetchAllRemoteCinemas(cinemid);
    }
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

  private fetchAllRemoteCinemas(targetCinemId: string) {
    let fileIndex = 1;
    const fetchRemote = () => {
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
          // Store in localStorage
          localStorage.setItem('cine_' + fileIndex, btoa(JSON.stringify(data)));
          
          // If this is the cinema we need, process it
          if (fileIndex.toString() === targetCinemId) {
            this.processCinemaData(data);
          }
          
          fileIndex++;
          fetchRemote();
        }
      });
    };
    fetchRemote();
  }

  private processCinemaData(data: any) {
    this.cinemaData = data;
    this.cinemaName = data?.cine || 'Cinema';
    this.cinemaDate = data?.fecha || '';
    this.fetchMovieData();
  }
  fetchMovieData() {
    // Check localStorage first
    const storedPeliculas = localStorage.getItem('peliculas');
    if (storedPeliculas) {
      try {
        const data = JSON.parse(atob(storedPeliculas));
        // Verificar si alguna película tiene fecha actual
        const hasCurrentData = data.some((pelicula: any) => this.isDataCurrentFromArray(pelicula));
        
        if (hasCurrentData) {
          console.log('Peliculas data is current, using localStorage');
          this.processPeliculasData(data);
          return; // Los datos están actuales, no necesitamos recargar
        } else {
          console.log('Peliculas data is outdated, fetching from remote...');
        }
      } catch (error) {
        console.error('Error parsing stored peliculas data:', error);
      }
    }
    
    // Cargar desde remoto si no hay datos o están desactualizados
    this.fetchRemotePeliculas();
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

  private fetchRemotePeliculas() {
    this.http.get<any>(`/peliculas.json`).pipe(
      catchError(error => {
        console.error(`Error fetching /peliculas.json:`, error);
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        this.processPeliculasData(data);
        localStorage.setItem('peliculas', btoa(JSON.stringify(data)));
      }
    });
  }

  private processPeliculasData(data: any) {
    this.pelidata = data || [];
    this.makeSchedule();
  }
  makeSchedule() {
    if (this.cinemaData && this.pelidata.length > 0) {
      let ciudades = this.cinemaData.ciudades;

      ciudades.forEach(ciudad => {
        if (ciudad.ciudad.toLowerCase().startsWith(this.city.toLowerCase())) {
          // remuevo la ciudad de this.cinemaData.ciudades
          this.ciudadesFiltradas.push(ciudad);
        }
      });
      this.ciudadesFiltradas.forEach(ciudad => {
        ciudad.peliculas.forEach(pelicula=>{
          // busco la pelicula en this.pelidata
          let data = this.pelidata.find(p => p.id === pelicula.id);
          if (data) {
            pelicula.datos = data;
          }else{
            console.warn(`Pelicula con id ${pelicula.id} no encontrada en pelidata`);
          }
          
          // Ordenar horarios por hora
          if (pelicula.horarios && pelicula.horarios.length > 0) {
            pelicula.horarios.sort((a, b) => {
              // Convertir horarios a minutos para comparar (ej: "14:30" -> 870 minutos)
              const timeToMinutes = (time: string): number => {
                const [hours, minutes] = time.split(':').map(Number);
                return hours * 60 + minutes;
              };
              
              return timeToMinutes(a.horario) - timeToMinutes(b.horario);
            });
          }
        });
      });
      console.log(this.ciudadesFiltradas);

    }
  }

  goBack() {
    this.router.navigate(['/cinemas', this.city]);
  }

  refreshData() {
    // Borrar todas las variables de localStorage relacionadas con cines y películas
    const keysToRemove: string[] = [];
    
    // Buscar todas las claves que empiecen con 'cine_'
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cine_')) {
        keysToRemove.push(key);
      }
    }
    
    // Remover las claves encontradas
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Remover también las películas
    localStorage.removeItem('peliculas');
    
    // Recargar la página
    window.location.reload();
  }

  // Movie data method
  loadMovieData(movieId: string) {
    // Buscar la película en pelidata por ID
    this.currentPeli = this.pelidata.find(p => p.id === movieId) || null;
    this.showMoviePopup = true;
  }

  // Schedule popup method
  showScheduleDetails(schedule: any, movieTitle: string) {
    this.currentSchedule = schedule;
    this.currentMovieTitle = movieTitle;
    this.showSchedulePopup = true;
  }

  // Sanitize YouTube URL
  getYouTubeUrl(videoId: string): SafeResourceUrl {
    const url = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
