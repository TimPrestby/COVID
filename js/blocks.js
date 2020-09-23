var width = 950; var height = 650;
	var commodities = ["lumber","coal","stone"];
	
	var projection = d3.geoKavrayskiy7()
		.scale(302)
		.rotate([-205,-10])
		.translate([width/2,height/2])
		.precision(0.1);

	var path = d3.geoPath().projection(projection);

	var svg = d3.select("#map").append("svg")
		.attr("width", width)
		.attr("height", height);
	
	// Create a few groups to layer elements correctly
	var g1 = svg.append("g"); var g2 = svg.append("g"); 
		
	d3.json("world.json",function(error,world) {
		g1.insert("path")
			.datum(topojson.feature(world, world.objects.land))
			.attr("class", "land")
			.attr("d", path);
			
		// Place and label Victoria
		g2.append("circle")
			.attr("cx", function() { return projection(ports["Victoria"].loc)[0];})
			.attr("cy", function() { return projection(ports["Victoria"].loc)[1];})
			.attr("r",6)
			.attr("class","source-port source");
		
		g2.append("text")
			.attr("x", function() { return projection(ports["Victoria"].loc)[0] + 5;})
			.attr("y", function() { return projection(ports["Victoria"].loc)[1] + 0;})
			.text("Victoria");

		// Add some buttons
		var buttons = g2.selectAll(".commodityButton")
			.data(commodities)
			.enter()
			.append("rect")
			.attr("x", function(d,i) { return i * 90 + 20} )
			.attr("y", 20)
			.attr("rx",20).attr("ry",20).attr("width",80).attr("height",80)
			.attr("fill","#aaa").attr("stroke","#999")
			.attr("class","commodityButton")
			.on("click",function(d) { replaceCommodity(d); });
				
		var text = g2.selectAll(".commodityLabel")
			.data(commodities).enter()
			.append("text")
			.attr("x",function (d,i) { return i * 90 + 60} )
			.attr("y",65)
			.attr("text-anchor","middle")
			.text(function(d) { return d; })
			.attr("class","commodityLabel")
			.on("click",function(d) { replaceCommodity(d); });
						
		// Start with a set of routes
		drawCommodity("coal");	
	});
	///////////////////////////////////////////////////////////////////////////////////////////////
	// Draw a set of routes 
	function drawCommodity(commodity) {
		d3.csv(commodity + ".csv", function (error, routes) {
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
	}		
	//////////////////////////////////////////////////////////////////////////////////////////////////		
	// Replace a commodity			
	function replaceCommodity(commodity) {
		d3.selectAll(".port").remove();
		d3.selectAll(".port-label").remove();
		
		var routes = g1.selectAll(".route")
			.transition()
			.duration(1000)
			.attr("stroke-dashoffset",  function() { return -this.getTotalLength(); })
			.transition().duration(0).remove();
		
		drawCommodity(commodity);	
	}	
	///////////////////////////////////////////////////////////////////////////////////////////////////		
	// Draw ports and labels associated with routes
	function drawPorts(d) {
		var point = g2.append("circle")
			.attr("cx", projection(ports[d.arr].loc)[0])
			.attr("cy", projection(ports[d.arr].loc)[1])
			.attr("r",4.5)
			.attr("class","port")
			.attr("opacity",0.1)
			.transition().duration(2000)
			.attr("id",d.arr.replace(" ", "-")) 
			.attr("opacity",1);
			
		var text = g2.append("text")
			.attr("x", projection(ports[d.arr].loc)[0] + ports[d.arr]["off"][0])
			.attr("y", projection(ports[d.arr].loc)[1] - ports[d.arr]["off"][1])
			.text(d.arr)
			.attr("opacity",0.1)
			.attr("class","port-label")
			.transition().duration(2000)
			.attr("opacity",1)
			.attr("id",d.arr.replace(" ", "-") + "-label");
	}			