import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class Country extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			destination: "",
			routeToDestination: [],
		};

		this.changeDestination = this.changeDestination.bind(this);
		this.pathToCountry = this.pathToCountry.bind(this);

		this.distanceToCountries = []; /*Keeps track of distances to countries while calculating shortest route to destination country.*/
	}

	changeDestination(event) {
		let route = this.pathToCountry(event.target.value, [this.props.country.numericCode]);
		let routeToDestination = [];
		if (route !== null){
			for (var i = 1; i < route.length; i++) {
				routeToDestination.push(getCountryByNumericCode(this.props.countries, route[i]).name);
			}
		}
		this.distanceToCountries = [];
		this.setState({
			destination: event.target.value,
			routeToDestination: routeToDestination,
		});
	}

	selectCountry(numericCode) {
		this.props.selectCountry(numericCode);
		this.setState({
			destination: '',
			routeToDestination: '',
		})
	}

	/* Calculates shortest path to destination country */
	pathToCountry(destination, pathSoFar = [], solution = null) {
		pathSoFar = pathSoFar.slice();
		let newSolution = null;
		const currentCountry = getCountryByNumericCode(this.props.countries, pathSoFar[pathSoFar.length - 1]);
		if (this.distanceToCountries[currentCountry.numericCode] !== undefined && pathSoFar.length >= this.distanceToCountries[currentCountry.numericCode]) {
			return null;
		} else {
			this.distanceToCountries[currentCountry.numericCode] = pathSoFar.length;
		}
		if (pathSoFar[pathSoFar.length - 1] === destination) {
			return pathSoFar;
		}
		for (let i = 0; i < currentCountry.borders.length; i++) {
			let neighbor = getCountryByAlpha3Code(this.props.countries, currentCountry.borders[i]);
			let notVisited = true;
			for (let j = 0; j < pathSoFar.length; j++) {
				if(pathSoFar[j] === neighbor.numericCode) {
					notVisited = false;
				}
			}
			if (notVisited) {
				let pathToNeighbor = pathSoFar.slice();
				pathToNeighbor.push(neighbor.numericCode);
				if (solution === null || solution.length > pathToNeighbor.length) {
					newSolution = this.pathToCountry(destination, pathToNeighbor, solution);
					if (newSolution !== null && (solution === null || solution.length > newSolution.length)) {
						solution = newSolution;
					}
				}
			}
		}
		return solution;
	}

	render() {
		let countries = this.props.countries.slice();
		countries = sortFunction(countries, 'name');
		const countryOptions = countries.map((country) => {
			return(
				<option value={country.numericCode} key={country.numericCode}>{country.name}</option>
			)
		});
		const neighbors = this.props.country.borders.map((neighbor) => {
			let country = getCountryByAlpha3Code(this.props.countries, neighbor);
			return(
				<li className="link" onClick={() => {this.selectCountry(country.numericCode)}} key={country.numericCode}>{country.name}</li>
			);
		});
		let routeToDestination = '';
		if (this.state.destination !== '') {
			routeToDestination = (this.state.routeToDestination.length === 0) ? 'No route found.' : this.state.routeToDestination.join(' -> ');
		}
		return (
			<div>
				<p className="link" onClick={() => {this.props.selectCountry(null)}}>Back to country list</p>
				<p>Name: {this.props.country.name}</p>
				<img src={this.props.country.flag} alt="flag" />
				<p>
					Neighbors
				</p>
				<ul>{neighbors}</ul>
				<p>
					Show path to country:<br />
					<select name="countryToTravel" onChange={this.changeDestination} value={this.state.destination}>
						<option value="">Select country</option>
						{countryOptions}
					</select>
				</p>
				<p>{routeToDestination}</p>
			</div>
		);
	}
}

class CountriesApp extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			countries: [],
			onlyEnglishSpeakingCountries: false,
			selectedCountry: null,
			fetchFailed: false,
		}

		this.fetchCountries = this.fetchCountries.bind(this);
		this.selectCountry = this.selectCountry.bind(this);
	}

	componentWillMount() {
		this.fetchCountries();
	}

	fetchCountries() {
		fetch('https://restcountries.eu/rest/v2/all')
			.then((response) => {
				return response.json();
			})
			.then((response) => {
				this.setState({
					countries: response,
				});
			})
			.catch((error) => {
				this.setState({
					fetchFailed: true, 
				})
			});
	}

	sort(key) {
		let countries = this.state.countries.slice();
		if (key !== 'area' && key !== 'population') {
			key = 'name';
		}
		countries = sortFunction(countries, key);
		this.setState({
			countries: countries,
		});
	}

	filterEnglishSpeakingCountries() {
		this.setState({
			onlyEnglishSpeakingCountries: true,
		});
	}

	selectCountry(numericCode) {
		this.setState({selectedCountry: numericCode});
	}

	render() {
		const countries = this.state.countries.map(country => {
			let show = true;
			if (this.state.onlyEnglishSpeakingCountries) {
				if (country.languages.find(function(element) {
						return element.iso639_2 === 'eng';
					}) !== undefined) {
					show = true;
				} else {
					show = false;
				}
			}
			if (show) {
				return (
					<li className="link" key={country.numericCode} onClick={() => this.selectCountry(country.numericCode)}>{country.name}</li>
				);
			}
			return(null);
		});
		if (this.state.fetchFailed) {
			return(<p>Couldn't connect to backend.</p>);
		}
		if (this.state.selectedCountry) {
			let country;
			const countries = this.state.countries;
			const selectedCountry = this.state.selectedCountry;
			countries.forEach((element) => {
				if (element.numericCode === selectedCountry) {
					country = element;
				}
			});
			return <div><Country country={country} countries={countries} selectCountry={this.selectCountry} /></div>
		} else {
			return(
				<div>
					<button onClick={() => this.sort()}>Sort by name</button>
					<button onClick={() => this.sort('population')}>Sort by population</button>
					<button onClick={() => this.sort('area')}>Sort by area</button>
					<button onClick={() => this.filterEnglishSpeakingCountries()}>Only english speaking countries</button>
					<ul>{countries}</ul>
				</div>
			);
		}
	}
}

ReactDOM.render(
	<CountriesApp />, 
	document.getElementById('root')
);

function sortFunction(array, key) {
	array.sort(function(a, b){
		if (a[key] > b[key]) {
			return -1;
		}
		if (b[key] > a[key]) {
			return 1;
		}
		return 0;
	});
	if (key === 'name') {
		array.reverse();
	}
	return array;
}

/* Returns country by numericCode */
function getCountryByNumericCode(countries, numericCode) {
	for (var i = 0; i < countries.length; i++) {
		if (countries[i].numericCode === numericCode) {
			return countries[i];
		}
	}
}

/* Returns country by alpha3code */
function getCountryByAlpha3Code(countries, alpha3Code) {
	for (var i = 0; i < countries.length; i++) {
		if (countries[i].alpha3Code === alpha3Code) {
			return countries[i];
		}
	}
}