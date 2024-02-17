let map;
let jobLocations = [];
let technicianLocation;
let markers = [];

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
    const allLocations = [technicianLocation.location, ...jobLocations.map(job => job.location)];
    //const minimumTree = minimumSpanningTree(allLocations);
    const minimumTree = findShortestPath(allLocations);
    displayRouteOnMap(minimumTree);
    //displayTreeOnMap(minimumTree);
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
         const route = response.routes[0];
         drawArrows(route);
       } else {
         window.alert('Directions request failed due to ' + status);
       }
     });
}

function drawArrows(route) {
    const path = route.overview_path;
    const arrowSymbol = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        fillColor: "blue",
        fillOpacity: 0.8,
        strokeWeight: 0,
        scale: 4
    };
    const minDistanceBetweenArrows = 250; // Minimum distance between arrows in meters

    for (let i = 0; i < path.length - 1; i++) {
        const nextPoint = path[i + 1];
        const currentPoint = path[i];
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(currentPoint.lat(), currentPoint.lng()),
            new google.maps.LatLng(nextPoint.lat(), nextPoint.lng())
        );

        if (distance >= minDistanceBetweenArrows) {
            const line = new google.maps.Polyline({
                path: [currentPoint, nextPoint],
                icons: [{
                    icon: arrowSymbol,
                    offset: "100%"
                }],
                map: map
            });
        }
    }
}
// Function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

// Function to generate permutations of array elements
function permute(arr) {
    const result = [];

    const permuteHelper = (arr, startIndex) => {
        if (startIndex === arr.length - 1) {
            result.push([...arr]);
            return;
        }

        for (let i = startIndex; i < arr.length; i++) {
            [arr[startIndex], arr[i]] = [arr[i], arr[startIndex]]; // swap
            permuteHelper(arr, startIndex + 1);
            [arr[startIndex], arr[i]] = [arr[i], arr[startIndex]]; // backtrack
        }
    };

    permuteHelper(arr, 0);

    return result;
}

// Function to find the shortest path using brute force
function findShortestPath(locations) {
    const n = locations.length;
    const permutations = permute([...Array(n).keys()].slice(1)); // Generating permutations of locations excluding the start point
    let shortestDistance = Infinity;
    let shortestPath = [];

    for (const perm of permutations) {
        let distance = 0;
        let currentLocationIndex = 0; // Start point index

        for (const nextLocationIndex of perm) {
           // const { lat: lat1, lng: lon1 } = locations[currentLocationIndex];
            //const { lat: lat2, lng: lon2 } = locations[nextLocationIndex];
            distance += calculateDistance(locations[currentLocationIndex], locations[nextLocationIndex]);
            currentLocationIndex = nextLocationIndex;
        }

      
       distance += calculateDistance(locations[currentLocationIndex],  locations[0]);

        if (distance < shortestDistance) {
            shortestDistance = distance;
            shortestPath = [0, ...perm]; // Adding start and end points
        }
    }

    return shortestPath.map(index => locations[index]);
}


function minimumSpanningTree(locations) {
    const n = locations.length;
    const allLocations = [...locations];
    const visited = new Array(n).fill(false);
    const parent = new Array(n).fill(-1); // To store the parent node of each vertex in the MST
    const key = new Array(n).fill(Number.MAX_VALUE); // To store the weight of edges

    key[0] = 0; // Start with the first node

    for (let count = 0; count < n - 1; count++) {
        // Pick the minimum key vertex from the set of vertices not yet included in MST
        let minKey = Number.MAX_VALUE;
        let minIndex = -1;
        for (let v = 0; v < n; v++) {
            if (!visited[v] && key[v] < minKey) {
                minKey = key[v];
                minIndex = v;
            }
        }

        visited[minIndex] = true; // Include the picked vertex to MST

        // Update key value and parent index of the adjacent vertices of the picked vertex
        for (let v = 0; v < n; v++) {
            const dist = calculateDistance(allLocations[minIndex], allLocations[v]);
            if (!visited[v] && dist < key[v]) {
                parent[v] = minIndex;
                key[v] = dist;
            }
        }
    }

    // Construct the minimum spanning tree
    const minimumTree = [];
    for (let i = 1; i < n; i++) {
        minimumTree.push([allLocations[parent[i]], allLocations[i]]);
    }

    return minimumTree;
}

function displayTreeOnMap(tree) {
    // Display the minimum spanning tree on the map
    const lineSymbol = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    };
    tree.forEach(edge => {
        const line = new google.maps.Polyline({
            path: [edge[0], edge[1]],
            icons: [{
                icon: lineSymbol,
                offset: '100%',
            }],
            map: map,
        });
    });
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

// Modify the calculateDistance function to suit your needs
function calculateDistance(point1, point2) {
    const latDiff = point1.lat - point2.lat;
    const lngDiff = point1.lng - point2.lng;
    // You may use a different formula to calculate distance based on your requirements
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
}

function getCoordinates(address) {
  
    return fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyBqe7URHq9O2PoUK6NKZT5fREVnmW_kc_w`)
      .then(response => response.json())
      .then(data => {
          const location = data.results[0].geometry.location;
          return { lat: location.lat, lng: location.lng };
      })
      .catch(error => {
          console.error('Error fetching coordinates:', error);
          throw error;
      });
    

 
}

function saveLocationToDatabase(name, location, visited) {
   
}

const googleMapsScript = document.createElement('script');
googleMapsScript.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBqe7URHq9O2PoUK6NKZT5fREVnmW_kc_w&callback=initMap';
googleMapsScript.async = true;
googleMapsScript.defer = true;

googleMapsScript.onload = function () {
    initMap();
};
document.head.appendChild(googleMapsScript);
