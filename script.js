// Example script to log CTD data (this could later fetch data from a CSV file)
document.addEventListener('DOMContentLoaded', function() {
    console.log("Website loaded");

    // Later, this can be replaced with dynamic data fetching and visualization
    const ctdData = [
        { depth: 10, temperature: 12.3, salinity: 35.1 },
        { depth: 20, temperature: 12.0, salinity: 35.2 },
        // more data points...
    ];

    console.log(ctdData);
});
