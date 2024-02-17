# Technician Job Scheduler with Google Maps Integration

## Overview

This project is a web application designed to streamline and optimize the workflow for technicians by providing an efficient job scheduling system. It leverages the Google Maps API to visualize the technician's location, job locations, and dynamically generate the shortest route to complete tasks.

## Features

- **Interactive Map Interface**: Technicians can easily choose their current location, and the application dynamically pins job locations on the map.
  
- **Route Optimization**: The system calculates the shortest route to complete assigned tasks and return back to its original location, ensuring optimal travel time for the technician.

- **Task Completion Tracking**: Technicians can click on job pins to view details and mark tasks as complete. This information is stored in a MySQL database, providing real-time updates on job statuses.

- **Database Integration**: All data, including technician details, job locations, and completion status, is securely stored and managed in a MySQL database.

## Usage

1. **Technician Location Setup**: Technician selects their current location on the map.
  
2. **Job Assignment**: The system retrieves job locations and pins them on the map.

3. **Route Visualization**: Clicking the "Show Routes" button generates and displays the optimal route for completing the assigned tasks.

4. **Task Completion**: Technicians can click on job pins and mark tasks as complete, updating the database in real-time.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Mapping**: Google Maps API

