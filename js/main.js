

function setMap(){


    //Assign map frame dimensions
    var width = window.innerWidth * 0.75,
        height = window.innerHeight * 0.75;

    //Create new SVG container for the map 
    var map = d3.select('#map')
        .append('svg')
        .attr('class', 'map')
        .attr('width', width)
        .attr('height', height);

    //Create Albers equal area conic projection centered on China
    var projection = d3.geoAlbers()
        .center([-10.5, 43.06])
        .rotate([79, 0.0, 0.1])
        .parallels([31.32, 45.8])
        .scale(300000)
        .translate([width / 2, height / 2]);

    //Create path generator
    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [d3.csv("data/combinedDataPop.csv"),                    
                    d3.json("data/Dane_CT.topojson"),                    
                    d3.json("data/campus.topojson")                   
                    ];    
        Promise.all(promises).then(callback);    
        
        function callback(data){	
            csvData = data[0];	
            daneTracts = data[1];	
            campusTracts = data[2];
 
            //Translate TopoJSON into JSON
            var dane = topojson.feature(daneTracts, daneTracts.objects.Dane_CT),
                uw = topojson.feature(campusTracts, campusTracts.objects.campus).features; 

            var tracts = map.append('path')
                //Assign datum to countries path
                .datum(dane)
                //Assign class as countries
                .attr('class', 'daneCT')
                //Assign d attribute to path generator which defines the shape
                .attr('d', path);

            var uwTracts = map.selectAll('.uwCT')
                //Add data as array
                .data(uw)
                //Identifies elements that need to be added to DOM
                .enter()
                //Append path element to map/DOM
                .append('path')
                //Assign unique class name for each enumeration unit
                .attr('class', function (d) {
                    console.log(d.properties)
                    return 'tract ' + d.properties.NAME;
                })
                .attr('d', path);

        };
};

//begin script when window loads
window.onload = setMap();
