//Example 1.3 line 4...set up choropleth map
function setMap(){
    //use Promise.all to parallelize asynchronous data loading
    var promises = [d3.csv("data/unitsData.csv"),                    
                    d3.json("data/EuropeCountries.topojson"),                    
                    d3.json("data/FranceRegions.topojson")                   
                    ];    
        Promise.all(promises).then(callback);    
        
        function callback(data){	
            csvData = data[0];	
            europe = data[1];	
            france = data[2];
            console.log(csvData);
            console.log(europe);
            console.log(france);    
        };
};