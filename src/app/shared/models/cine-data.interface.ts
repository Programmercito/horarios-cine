import { Pelicula } from "./pelicula.interface";

export interface Horario {
  horario: string;
  idioma: string;
  formato: string;
}

export interface PeliculaHorario {
  titulo: string;
  horarios: Horario[];
  id: string;
  datos: Pelicula | null;
}

export interface Ciudad {
  peliculas: PeliculaHorario[];
  ciudad: string;
}

export interface CineData {
  ciudades: Ciudad[];
  cine: string;
  fecha: string;

}
