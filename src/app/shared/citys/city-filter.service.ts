import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CityFilterService {

  constructor() { }

  filterCities(cityList: string[]): string[] {
    let filteredCities: string[] = [];

    // Sort the cities by length in ascending order
    cityList.sort((a, b) => a.length - b.length);

    cityList.forEach(city => {
      let isSubString = false;
      for (let i = 0; i < filteredCities.length; i++) {
        if (city.startsWith(filteredCities[i])) {
          isSubString = true;
          break;
        }
      }
      if (!isSubString) {
        filteredCities.push(city);
      }
    });

    return filteredCities;
  }
}
