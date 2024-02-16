let map;
let jobLocations = [];
let technicianLocation;
let markers = [];
const serverUrl = 'http://localhost:3001';


function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 28.6139, lng: 77.2090 }, // Default to Noida, India
        zoom: 12
    });
}

function addAddress() {
    const addressInput = document.getElementById('addressInput').value;

    getCoordinates(addressInput)
        .then(location => {
            saveLocationToDatabase(addressInput, location,false);
            jobLocations.push({ name: addressInput, location: location, visited: false });
            addMarker(location, addressInput);
        })
        .catch(error => console.error('Error getting coordinates:', error));
}

function addTechnicianLocation() {
    const technicianAddressInput = document.getElementById('technicianAddressInput').value;

    getCoordinates(technicianAddressInput)
        .then(location => {
            technicianLocation = { name: 'Technician', location: location, visited: false };
            saveLocationToDatabase('Technician', location,false);
            addMarker(location, 'Technician');
        })
        .catch(error => console.error('Error getting technician coordinates:', error));
}

function planRoute() {
    if (jobLocations.length === 0 || !technicianLocation) {
        alert('Please add job locations and technician location first.');
        return;
    }

    const optimizedRoute = tspRoutePlanning(jobLocations.map(job => job.location), technicianLocation.location);
    displayRouteOnMap(optimizedRoute);
}

function markJobCompleted() {
    if (!technicianLocation) {
        alert('Please add technician location first.');
        return;
    }

    // Removing green marker
    markers.forEach(marker => {
        if (marker.getTitle() === 'Technician' && technicianLocation.visited) {
            // If Technician marker & visited, removing it
            marker.setMap(null);
            saveLocationToDatabase(technicianLocation.name, technicianLocation.location,true)
        } else if (marker.getTitle() !== 'Technician' && jobLocations.find(job => job.name === marker.getTitle())?.visited) {
            // If Job marker and visited, removing it
            marker.setMap(null);
            saveLocationToDatabase(jobLocations.find(job => job.name === marker.getTitle())?.name, jobLocations.find(job => job.name === marker.getTitle())?.location,true)
        }
    });
}

function addMarker(location, label = '') {
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        title: label,
    });

    marker.addListener('click', function () {
        const selectedLocation = jobLocations.find(job => job.name === label) || technicianLocation;
        if (!selectedLocation.visited) {
            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/yellow-dot.png');
            selectedLocation.visited = true;
        }
    });

    markers.push(marker);
}



function tspRoutePlanning(locations, startLocation) {
    const n = locations.length;
    const allLocations = [startLocation, ...locations];
    const dp = new Array(1 << n).fill(null).map(() => new Array(n).fill(null));

    function calculateDistance(point1, point2) {
        const latDiff = point1.lat - point2.lat;
        const lngDiff = point1.lng - point2.lng;
        return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    }

    function dijkstra(startNode) {
        const distances = new Array(n+1).fill(Number.MAX_VALUE);
        const visited = new Array(n+1).fill(false);
        distances[startNode] = 0;

        for (let i = 0; i < n ; i++) {
            let minDistance = Number.MAX_VALUE;
            let minIndex = -1;

            // Finding closest unvisited node
            for (let j = 0; j <= n; j++) {
                if (!visited[j] && distances[j] < minDistance) {
                    minDistance = distances[j];
                    minIndex = j;
                }
            }

            visited[minIndex] = true;

            // Updating distance to neighbors through the current node
            for (let j = 0; j <= n; j++) {
                if (!visited[j]) {
                    const distance = calculateDistance(allLocations[minIndex], allLocations[j]);
                    if (distances[minIndex] + distance < distances[j]) {
                        distances[j] = distances[minIndex] + distance;
                    }
                }
            }
        }

        return distances;
    }

    const distances = dijkstra(0); //start location at index 0
    const finalRoute = [];
    const sortedIndexes = indexesInIncreasingOrder(distances);
    for (let i = 0; i <= n; i++) {

        finalRoute.push(allLocations[sortedIndexes[i]]);
    }

    return finalRoute;
}

function indexesInIncreasingOrder(arr) {
    // Create an array of indexes [0, 1, 2, ..., arr.length - 1]
    const indexes = Array.from({ length: arr.length }, (_, index) => index);

    indexes.sort((a, b) => arr[a] - arr[b]);

    return indexes;
}



function displayRouteOnMap(route) {

     const directionsService = new google.maps.DirectionsService();

     // object to display the route directions
     const directionsRenderer = new google.maps.DirectionsRenderer({
       map: map,
       suppressMarkers: true // Suppress default markers
     });


 

    //  request object with the route coordinates
      const request = {
        origin: route[0],
        destination: route[route.length - 1],
        waypoints: route.slice(1, -1).map(coord => ({ location: coord })),
        travelMode: google.maps.TravelMode.DRIVING
      };

      // Calling  DirectionsService route method to calculate the route
      directionsService.route(request, function(response, status) {
        if (status === 'OK') {
          // Displaying  route directions on the map
          directionsRenderer.setDirections(response);
        } else {
          window.alert('Directions request failed due to ' + status);
        }
      });
}


function getCoordinates(address) {
    return fetch(`${serverUrl}/get-api-key`)
      .then(response => response.json())
      .then(data => {
        const apiKey = data.apiKey;
        return fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`)
          .then(response => response.json())
          .then(data => {
            const location = data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
          })
          .catch(error => {
            console.error('Error fetching coordinates:', error);
            throw error;
          });
      })
      .catch(error => {
        console.error('Error fetching API key:', error);
        throw error;
      });
  }

function saveLocationToDatabase(name, location,visited) {
    //  saving location to the MySQL database
    // using Node.js server to handle the database operations
    if(!visited){
    fetch('/saveLocation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: name, location: location, visited }), // Adding 'visited' property with default value
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error saving location:', error));

} else{

    fetch('/updateVisited', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: name, location: location, visited }), // Adding 'visited' property with default value
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error saving location:', error));
}
}

fetch(`${serverUrl}/get-api-key`)
  .then(response => response.json())
  .then(data => {
    const apiKey = data.apiKey;

    const googleMapsScript = document.createElement('script');
    googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    googleMapsScript.async = true;
    googleMapsScript.defer = true;

    googleMapsScript.onload = function () {
    initMap();
    };
    document.head.appendChild(googleMapsScript);

  })
  .catch(error => console.error('Error fetching API key:', error));
  

