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
        .center([-10.5, 43.062])
        .scale(600000)
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

    //create group
    var g1 = map.append("g");

    var maxVolume = -12;
    data.forEach(function(routes){
        if(maxVolume < parseFloat(routes[date])){
        //Obtain flow volume
        maxVolume=parseFloat(routes[date])}
    })

    var line = d3.line().curve(d3.curveBasis);

    data.forEach( function(d) {
        var routePath = g1.append("path")	
            .attr("d", line ([ proj(centDic[d.geoid_o]),proj(centDic[d.geoid_d])]))
            .attr("class", "t"+ d.geoid_o + "_" + d.geoid_d + " route")
            .attr("stroke-opacity", (d[date] / maxVolume) )
            .attr("stroke-width", Math.sqrt(d[date] / maxVolume)*5 )
            //Create event listeners for highlighting and dehighlighting using mouse over
            .on("mouseover", function () { highlight(d)})
            .on("mouseout", function () { dehighlight(d)})
            .on("mousemove", moveLabel);
            



        var totalLength =  routePath.node().getTotalLength() + 10;
            routePath
                .attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(2000)
                .attr("stroke-dashoffset", 0);

        //Set default style for once flow is dehighlighted 
        var desc = routePath.append("desc")
            .text('{"stroke": " #c5050c"}');
    });



}	




//Function: highlight enumeration units and bars//
function highlight(props) {
    console.log(props)
    //Change the opacity of the highlighted item by selecting the class
    var selected = d3.selectAll("." + "t" + props.geoid_o + "_" + props.geoid_d)
        .style("stroke", "white");
    //Call setlabel to create dynamic label
    setLabel(props);
};

//Function: dehighlight regions//
function dehighlight(props) {
    var selected = d3.selectAll("." + "t" + props.geoid_o + "_" + props.geoid_d)
        .style("stroke", function () {
            //Get the unique opacity element for current DOM element within the desc element
            return getStyle(this, "stroke")
        });

    //Create function that gets the description text of an element
    function getStyle(element, styleName) {
        //Select current DOM element
        var styleText = d3.select(element)
            .select("desc")
            //Return text content in desc
            .text();
        //Create JSON string
        var styleObject = JSON.parse(styleText);
        return styleObject[styleName];
    };
    d3.select(".infolabel")
        .remove();
} 

 //Function: create dynamic labels//
 function setLabel(props) {
	//Create label content as HTML string
	var labelAttribute = '<h1>' + 'Travel volume between ' + props.geoid_o + ' tract and ' + props.geoid_d + ' tract: <i>' + props['3/30/2020'] + '</i></h1><br>';
	//Create detailed label in html page 
	var infolabel = d3.select('div#map')
			.append('div')
			//Define class, ID, and add it to HTML
			.attr('class', 'infolabel')
			.attr('id', 'label_' + props.geoid_o + "_" + props.geoid_d)
            .html(labelAttribute);
    
};

//Function: move label where mouse moves//
function moveLabel() {
    console.log('hi')
    //Determine width of label
    var labelWidth = d3.select('.infolabel')
        //Use node() to get the first element in this selection
        .node()
        //Return an object containing the sie of the label
        .getBoundingClientRect()
        //Examine width to determine how much to shift the mouse over
        .width;

    //Use coordinates of mousemove event to set label coordinates with offsets from wherever event is
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        //Used to switch vertical sides
        y2 = d3.event.clientY + 25;
    //Test for overflow horizontally (If the event x coordinate is greater than the width of the window and label buffer)
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //Test for overflow vertically (Is the Y coordinate less than the distance between mouse and upper-left label)
    var y = d3.event.clientY < 75 ? y2 : y1;
    //Select the infolabel currently mousing over
    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};


//begin script when window loads
window.onload = setMap();
