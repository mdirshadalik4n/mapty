'use strict';



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;
    constructor(coords, distance, duration) {
        // [lat, lng ]
        this.coords = coords;
        // km
        this.distance = distance;
        // min
        this.duration = duration;
    }
    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;

    }
    click() {
        this.clicks++;
    }
}

class Running extends workout {
    type = 'running';
    constructor(coords, distance, duration, Cadence) {
        super(coords, distance, duration)
        this.Cadence = Cadence;
        this.type = 'running';
        this._setDescription();
        this.calcPace()
    }

    calcPace() {
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends workout {
    type = 'cycling';
    constructor(coords, distance, duration, ElevationGain) {
        super(coords, distance, duration)
        this.ElevationGain = ElevationGain;
        this.type = 'cycling';
        this._setDescription();
        this.calcSpeed();
    }
    calcSpeed() {
        // km/he
        this.speed = this.distance / (this.duration / 60);
        return this.speed
    }
};

// const run1 = new running([12, -45], 5.2, 24, 178);
// const cycling1 = new cycling([12, -45], 23, 95, 523);
// console.log(run1, cycling1);
// Application Architecture
class App {
    #map;
    #mapEvent;
    #mapZoomLevel = 13;
    #workouts = [];
    constructor() {
        // Get the Position
        this._getPosition();
        // Set Local Storage
        this._getLocalStorage();
        // Add event Handleers
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElavationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }
    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert('could not get your position')
            });
    }
    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        const coords = [latitude, longitude];
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));
        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        })
    };
    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1000)
    }
    _toggleElavationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkout(e) {
        const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const ispositive = (...inputs) => inputs.every(inp => inp > 0);
        e.preventDefault();
        // // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        // if workout running, create running object
        if (type === 'running') {
            const cadence = +inputCadence.value
            // check if data is valid
            if (!validInput(distance, duration, cadence) || !ispositive(distance, duration, cadence))
                return alert('this number is not a positive number');
            workout = new Running([lat, lng], distance, duration, cadence);
            // return console.log(cadence);
        }
        // // if workout cycling, create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (!validInput(distance, duration, elevation) || !ispositive(distance, duration)) return alert('this number is not a positive number');
            workout = new Cycling([lat, lng], distance, duration, elevation)
        }
        // add new Object to workout array
        this.#workouts.push(workout)
        console.log(workout);
        // Render workout on app as marker
        this._renderWorkoutMarker(workout);
        this._renderWorkout(workout);

        // Render workout list 
        //Hide + Clear input fields;
        this._hideForm();

        // Set Local Storage
        this._setLocalStorage();
    }
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();

    }
    _renderWorkout(workout) {
        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;
        if (workout.type === 'running')
            html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.Cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
        if (workout.type === 'cycling')
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.ElevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
        form.insertAdjacentHTML('afterend', html)

    }
    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        console.log(workoutEl);

        if (!workoutEl) return;
        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
        console.log(workout);
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            }
        });
        // Using the public Interface
        // workout.click();
    };
    _setLocalStorage() {
        localStorage.setItem('workout', JSON.stringify(this.#workouts));
    };
    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workout'));
        console.log(data);
        if (!data) return;

        this.#workouts = data;
        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    };
    reset() {
        localStorage.removeItem('workout');
        location.reload();
    };

};

const app = new App();


