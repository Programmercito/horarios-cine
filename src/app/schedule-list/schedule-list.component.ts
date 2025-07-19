import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError } from 'rxjs';
import { CineData, Ciudad, Pelicula } from '../shared/models';

@Component({
  selector: 'app-schedule-list',
  templateUrl: './schedule-list.component.html',
  styleUrls: ['./schedule-list.component.css']
})
export class ScheduleListComponent implements OnInit {
  city: string = '';
  cinemid: string = '';
  cinemaName: string = '';
  cinemaData: CineData | null = null;
  pelidata: Pelicula[] = [];
  ciudadesFiltradas: Ciudad[] = [];
  constructor(private route: ActivatedRoute,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.city = params.get('city') || '';
      this.cinemid = params.get('id') || '';
      this.fetchcinema(this.cinemid, this.city);
    });
  }
  fetchcinema(cinemid: string, city: string) {
    this.http.get<any>(`/${cinemid}.json`).pipe(
      catchError(error => {
        console.error(`Error fetching /${cinemid}.json:`, error);
        return [];
      })
    ).subscribe(data => {
      this.cinemaData = data;
      this.fetchMovieData();
    }
    );

  }
  fetchMovieData() {
    this.http.get<any>(`/peliculas.json`).pipe(
      catchError(error => {
        console.error(`Error fetching /peliculas.json:`, error);
        return [];
      })
    ).subscribe(data => {
      this.pelidata = data || [];
      this.makeSchedule();
    }
    );
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
          }
        });
      });
      console.log(this.ciudadesFiltradas);

    }
  }
}
