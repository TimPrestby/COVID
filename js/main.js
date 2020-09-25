var centDic = {}


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
    var projection = d3.geoAzimuthalEquidistant()
        .center([-10.5, 43.061])
        .scale(500000)
        .translate([width / 2, height / 2])
        .rotate([79, 0.0, 0.1]);

    //Create path generator
    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [d3.csv("data/combinedDataPop.csv"),                    
                    d3.json("data/Dane_Land.topojson"),                    
                    d3.json("data/campus.topojson")                   
                    ];    
        Promise.all(promises).then(callback);    
        
    function callback(data){	
        csvData = data[0];	
        daneTracts = data[1];	
        campusTracts = data[2];

        //Translate TopoJSON into JSON
        var dane = topojson.feature(daneTracts, daneTracts.objects.Dane_Land),
            uw = topojson.feature(campusTracts, campusTracts.objects.campus).features; 

        //Create enumeration units
        setEnumerationUnits(map,uw,dane,path)
        
        //Create labels
        createLabels(projection, uw, map)

        //draw routes
        drawFlows("3/30/2020",csvData,map, projection)
    };
};

function setEnumerationUnits(map,uw,dane,path){
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
            return 'tract ' + d.properties.NAME;
        })
        .attr('d', path);
    
    
}

function createLabels(proj, uw, map){

    //create group
    var g2 = map.append("g");

    for (var a = 0; a < uw.length; a++) {
        centDic[uw[a].properties['GEOID']] = [parseFloat(uw[a].properties['INTPTLON']),parseFloat(uw[a].properties['INTPTLAT'])]
    }
    
    //console.log(centDic)
    
    g2.append("circle")
        .attr("cx", function() { return proj(centDic[55025000300])[0]})
        .attr("cy", function() { return proj(centDic[55025000300])[1]})
        .attr("r",6)
        .attr("class","source-port source");

}


// Draw a set of routes 
function drawFlows(date, data, map, proj) {
    console.log(data)



    //create group
    var g1 = map.append("g");


    var maxVolume = -12;
    data.forEach(function(routes){
        if(maxVolume < parseFloat(routes[date])){
        //Obtain flow volume
        maxVolume=parseFloat(routes[date])}
    })

    var line = d3.line().curve(d3.curveBasis);

    data.forEach( function(d,i) {
        var routePath = g1.append("path")	
            .attr("d", line ([ proj(centDic[d.geoid_o]),proj(centDic[d.geoid_d])]))
            .attr("class", d.geoid_o.replace(" ", "-") + " " + "route")
            .attr("stroke-opacity", Math.sqrt(d[date] / maxVolume) )
            .attr("stroke-width", 1 );

    var totalLength =  routePath.node().getTotalLength() + 10;
        routePath
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(2000)
            //.on("start", drawPorts(d) )
            .attr("stroke-dashoffset", 0);
    });





    /*
    d3.csv(date + ".csv", function (error, routes) {
        var maxVolume = d3.max(routes, function(d) { return d.vol; });
                    
        var line = d3.line().curve(d3.curveBasis);

        routes.forEach( function(d,i) {
             var routePath = g1.append("path")	
                .attr("d", line ([ projection(ports[d.dept].loc),projection(intermediatePoints[d.via]),projection(ports[d.arr].loc)]) )
                .attr("class", d.arr.replace(" ", "-") + " " + "route")
                .attr("stroke-opacity", Math.sqrt(d.vol / maxVolume) )
                .attr("stroke-width", 1 );

        var totalLength =  routePath.node().getTotalLength() + 10;
            routePath
                .attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(2000)
                .on("start", drawPorts(d) )
                .attr("stroke-dashoffset", 0);
        });
    });
    */
}	



//begin script when window loads
window.onload = setMap();
