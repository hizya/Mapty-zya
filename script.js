'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');

const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// const formInput=document.querySelector('')

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
    'August', 'September', 'October', 'November', 'December'];

    const month = months[this.date.getMonth()];
    const day = this.date.getDate();

    this.description = `${this.name[0].toUpperCase()}${this.name.slice(
      1
    )} on ${month} ${day}`;
  }
}

class Running extends Workout {
  name = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  name = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/*

=========================

*/
class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];

  // Load page
  constructor() {
    this._getPosition();

    this._getLocalStorage();
    // place the listener funtion in the constructor function
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToMarker.bind(this));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => this._renderWorkout(work));
    // this.#workouts.forEach(work => this._renderWorkMarker(work));
  }

  _moveToMarker(e) {
    // guard clause
    const workoutEl = e.target.closest('li');

    if (!workoutEl) return;

    const workout = this.#workouts.find(w => w.id === workoutEl.dataset.id);

    // this.#map.panTo(workout.coords, {
    //   animate: true,
    //   duration: 1,
    //   easeLinearity: 0.5,
    //   noMoveStart: true,
    // });

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // get position
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () =>
        alert('Get not get your position!')
      );
    }
  }

  // display the form
  _showForm(mapE) {
    this.#mapEvent = mapE;

    // this.#workouts.forEach(work => this._renderWorkout(work));

    if (form.classList.contains('hidden')) {
      form.classList.remove('hidden');
    }
    inputDistance.focus();
  }

  // hide the form
  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // Receive position
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    // Load the map
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    // console.log(this.#map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => this._renderWorkMarker(work));
  }

  // toggle the elevation field
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInput = (...input) =>
      input.every(value => Number.isFinite(value));
    const allPositive = (...input) => input.every(value => value > 0);

    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const type = inputType.value;
    let workout;
    // if workout running, create running object

    if (type === 'running') {
      //  Check if data is valid
      const cadence = +inputCadence.value;
      // validInput(distance);
      if (
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('The input must be positve number');
      workout = new Running(this.#mapEvent.latlng, distance, duration, cadence);
    }

    // if workout cycling, create cycling object
    if (type === 'cycling') {
      //  Check if data is valid
      const elevation = +inputElevation.value;
      if (
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('The input must be positve number');
      workout = new Cycling(
        this.#mapEvent.latlng,
        distance,
        duration,
        elevation
      );
    }
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkMarker(workout);

    // Render workout on list + clear the input
    this._renderWorkout(workout);

    this._hideForm();

    this._setLocalStorage();
  }

  _renderWorkMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.name}-popup`,
        })
      )
      .setPopupContent(
        `${workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    // workout.forEach(work => {});
    // prettier-ignore
    let html = `<li class="workout workout--${workout.name}" data-id="${workout.id}">
                  <h2 class="workout__title">${workout.description}</h2>
                  <div class="workout__details">
                    <span class="workout__icon">${
                      workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'
                    }</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                  </div>
                 <div class="workout__details">
                   <span class="workout__icon">⏱</span>
                   <span class="workout__value">${workout.duration}</span>
                   <span class="workout__unit">min</span>
                 </div>
     `;

    if (workout.name === 'running') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
    </li>`;
    }

    if (workout.name === 'cycling') {
      html += ` <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _setLocalStorage() {
    localStorage.setItem(`workouts`, JSON.stringify(this.#workouts));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();

console.log(new Workout());
