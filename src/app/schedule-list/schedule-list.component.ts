import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, of, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl, Title, Meta } from '@angular/platform-browser';
import { CineData, Ciudad, Pelicula, PeliculaHorario } from '../shared/models';
import { EncodingCine } from '../shared/common/encoding';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule-list.component.html',
  styleUrls: ['./schedule-list.component.css']
})
export class ScheduleListComponent extends EncodingCine implements OnInit, OnDestroy {
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
  currentYear = new Date().getFullYear();
  cinemaConfig: { [key: string]: boolean } = {};

  @ViewChild('movieDialog') movieDialogRef!: ElementRef<HTMLDialogElement>;
  @ViewChild('scheduleDialog') scheduleDialogRef!: ElementRef<HTMLDialogElement>;

  constructor(private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private sanitizer: DomSanitizer,
    private title: Title,
    private meta: Meta
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadCinemaConfig().subscribe(() => {
      this.route.paramMap.subscribe(params => {
        this.city = params.get('city') || '';
        this.cinemid = params.get('id') || '';
        this.fetchcinema(this.cinemid, this.city);
      });
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
  fetchcinema(cinemid: string, city: string) {
    // Check localStorage first
    const storedData = localStorage.getItem('cine_' + cinemid);
    if (storedData) {
      try {
        const data = JSON.parse(this.decodificarBase64(storedData));
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
    const enabledIds = Object.keys(this.cinemaConfig)
      .filter(id => this.cinemaConfig[id])
      .map(id => Number(id))
      .filter(id => !isNaN(id))
      .sort((a, b) => a - b);

    if (enabledIds.length > 0) {
      const targetIdNumber = Number(targetCinemId);
      const ids = enabledIds.includes(targetIdNumber) ? enabledIds : [...enabledIds, targetIdNumber];
      const uniqueIds = Array.from(new Set(ids)).sort((a, b) => a - b);
      this.fetchRemoteCinemasByIds(uniqueIds, 0, targetCinemId);
      return;
    }

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
          localStorage.setItem('cine_' + fileIndex, this.codificarBase64(JSON.stringify(data)));
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

  private fetchRemoteCinemasByIds(ids: number[], index: number, targetCinemId: string) {
    if (index >= ids.length) {
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
      if (data) {
        localStorage.setItem('cine_' + fileIndex, this.codificarBase64(JSON.stringify(data)));
        if (fileIndex.toString() === targetCinemId) {
          this.processCinemaData(data);
        }
      }
      this.fetchRemoteCinemasByIds(ids, index + 1, targetCinemId);
    });
  }

  private processCinemaData(data: any) {
    this.cinemaData = data;
    this.cinemaName = data?.cine || 'Cinema';
    this.cinemaDate = data?.fecha || '';

    // Actualizar tags SEO dinámicamente
    this.title.setTitle(`Horarios en ${this.cinemaName} (${this.city}) - Cinema Bo`);
    this.meta.updateTag({ name: 'description', content: `Consulta la cartelera y horarios de películas para hoy en ${this.cinemaName} de ${this.city}. Disfruta los mejores estrenos.` });
    this.meta.updateTag({ property: 'og:title', content: `Horarios en ${this.cinemaName} (${this.city}) - Cinema Bo` });
    this.meta.updateTag({ property: 'og:description', content: `Consulta la cartelera y horarios de películas para hoy en ${this.cinemaName} de ${this.city}.` });

    this.fetchMovieData();
  }
  fetchMovieData() {
    // Check localStorage first
    const storedPeliculas = localStorage.getItem('peliculas');
    if (storedPeliculas) {
      try {
        const data = JSON.parse(this.decodificarBase64(storedPeliculas));
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
        localStorage.setItem('peliculas', this.codificarBase64(JSON.stringify(data)));
      }
    });
  }

  private formatRuntime(minutes?: number): string {
    if (minutes == null || isNaN(minutes)) {
      return '';
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins.toString().padStart(2, '0')}m` : `${mins}m`;
  }

  private resolveMovie(movie: Pelicula | PeliculaHorario | null | undefined): Pelicula | null {
    if (!movie) {
      return null;
    }
    if ('datos' in movie) {
      return movie.datos || null;
    }
    return movie;
  }

  getMovieRuntime(movie: Pelicula | PeliculaHorario | null | undefined): string | null {
    const movieData = this.resolveMovie(movie);
    const runtime = movieData?.details?.runtime;
    return runtime ? this.formatRuntime(runtime) : null;
  }

  getMovieAverageRating(movie: Pelicula | PeliculaHorario | null | undefined): string | null {
    const movieData = this.resolveMovie(movie);
    const average = movieData?.details?.vote_average ?? movieData?.extras?.vote_average;
    return average != null && average > 0 ? average.toFixed(1) : null;
  }

  getMovieGenres(movie: Pelicula | PeliculaHorario | null | undefined): string | null {
    const movieData = this.resolveMovie(movie);
    return movieData?.details?.genres || null;
  }

  getMovieHomepage(movie: Pelicula | PeliculaHorario | null | undefined): string | null {
    const movieData = this.resolveMovie(movie);
    const homepage = movieData?.details?.homepage;
    return homepage?.trim() ? homepage : null;
  }

  getMoviePopularity(movie: Pelicula | PeliculaHorario | null | undefined): string | null {
    const movieData = this.resolveMovie(movie);
    const popularity = movieData?.details?.popularity;
    return popularity != null ? popularity.toFixed(1) : null;
  }

  getMovieProductionCompanies(movie: Pelicula | PeliculaHorario | null | undefined): string | null {
    const movieData = this.resolveMovie(movie);
    return movieData?.details?.production_companies || null;
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
        ciudad.peliculas.forEach(pelicula => {
          // busco la pelicula en this.pelidata
          let data = this.pelidata.find(p => p.id === pelicula.id);
          if (data) {
            pelicula.datos = data;
          } else {
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
    this.currentPeli = this.pelidata.find(p => p.id === movieId) || null;
    this.showMoviePopup = true;
    this.movieDialogRef.nativeElement.showModal();
  }

  closeMoviePopup(): void {
    this.showMoviePopup = false;
    this.movieDialogRef.nativeElement.close();
  }

  // Schedule popup method
  showScheduleDetails(schedule: any, movieTitle: string) {
    this.currentSchedule = schedule;
    this.currentMovieTitle = movieTitle;
    this.showSchedulePopup = true;
    this.scheduleDialogRef.nativeElement.showModal();
  }

  closeSchedulePopup(): void {
    this.showSchedulePopup = false;
    this.scheduleDialogRef.nativeElement.close();
  }

  onDialogBackdropClick(event: MouseEvent, dialog: HTMLDialogElement): void {
    if (event.target === dialog) {
      dialog.close();
      this.showMoviePopup = false;
      this.showSchedulePopup = false;
    }
  }

  // Sanitize YouTube URL
  getYouTubeUrl(videoId: string): SafeResourceUrl {
    const url = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Generate share text without emojis
  private getShareText(): string {
    const currentCity = this.ciudadesFiltradas.length > 0 ? this.ciudadesFiltradas[0].ciudad : this.city;
    const siteUrl = 'https://cine.devcito.org';

    return [
      '* ' + this.currentMovieTitle + ' *',
      '',
      'Cine: ' + this.cinemaName,
      'Ciudad: ' + currentCity,
      'Fecha: ' + this.cinemaDate,
      'Hora: ' + (this.currentSchedule?.horario || ''),
      'Formato: ' + (this.currentSchedule?.formato || ''),
      'Idioma: ' + (this.currentSchedule?.idioma || ''),
      '',
      'Ver mas horarios en:',
      siteUrl
    ].join('\n');
  }

  // Share on WhatsApp
  shareOnWhatsApp(): void {
    const text = encodeURIComponent(this.getShareText());
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  }

  // Share on Telegram
  shareOnTelegram(): void {
    const text = encodeURIComponent(this.getShareText());
    const siteUrl = encodeURIComponent('https://cine.devcito.org');
    const url = `https://t.me/share/url?url=${siteUrl}&text=${text}`;
    window.open(url, '_blank');
  }

  ngOnDestroy(): void {
    if (this.movieDialogRef?.nativeElement?.open) {
      this.movieDialogRef.nativeElement.close();
    }
    if (this.scheduleDialogRef?.nativeElement?.open) {
      this.scheduleDialogRef.nativeElement.close();
    }
  }
}
