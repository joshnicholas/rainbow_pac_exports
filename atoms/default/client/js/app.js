import * as topojson from "topojson"
import * as d3 from "d3"
import { makeTooltip } from './modules/tooltips'

var target = "#graphicContainer";

var button_values = ["Total Pacific", 'Papua New Guinea',"Fiji",'Solomon Islands',"Vanuatu","Samoa","Tonga","Cook Islands","Tuvalu","Niue", "Federated States of Micronesia","Kiribati","Marshall Islands","Palau","Nauru"]

// var form = d3.select(".buttons")
// .attr("class", "form")
// // .attr("transform", "translate(" + width*0.60 + "," + height*0.25 + ")")
// // .attr("transform", "translate(" + margin.left + "," + (height - 150) + ")")
// // .attr("transform", "translate(" + 10 + "," + 100 + ")")
// // .style("font-size", "1em");

// form.selectAll("label")
// .data(button_values)
// .enter()
// .append("label")
// .text(function(d){
// 	return d
// })
// .append("input")
// .attr("type", "checkbox")
// .attr("class", "checkbox")
// .attr("value", function(d){
// 	return d})
// .attr("checked", function(d){
// 	if (d == "Papua New Guinea"){
// 		return true
// 	}
// })

var selector = d3.select(".countryChooser")
.selectAll("options")
.data(button_values)
.enter()
.append('option')
.text(d => d)
.attr("value", d => d)

var countries_selected = ["Total Pacific"]

function makeMap(data1, data2, data3, use_countries) {

	d3.select("#chartTitle").text("China dominates Pacific extractive exports")

	d3.select("#subTitle").text("Value of trade flows measured in tonnes")

	d3.select("#sourceText").text("| Guardian analysis of CEPII's BACI dataset")

	var importerCutoff = 20;

	var new_centroids = data3.features

	// REPLACE FAUTLY PACIFIC CENTROIDS

	var kiri_index = new_centroids.findIndex(c => c.properties.name_long == "Kiribati")
	var fiji_index = new_centroids.findIndex(c => c.properties.name_long == "Fiji")
	var wallis_index = new_centroids.findIndex(c => c.properties.name_long == "Wallis and Futuna Islands")

	
	
	new_centroids[kiri_index].geometry.coordinates = [-168.734039, -3.370417]
	new_centroids[fiji_index].geometry.coordinates = [179.414413, -16.578193]
	new_centroids[wallis_index].geometry.coordinates = [-180.348348251,-13.8873703903]
	// https://marineregions.org/gazetteer.php?p=details&id=8441

	// new_centroids['Tuvalu']['geometry']["coordinates"] = [177.64933, -7.109535]
	new_centroids.push({"properties": {"name_long": "Tuvalu"}, "geometry":{"coordinates": [-177.64933, -7.109535]}})

	// var commodities = data1.columns.filter(d => d != "Importing country" && d != "Exporting country" && d!= "Oil, metals and mineral products");
	var commodities = data1.columns.filter(d => d != "Importing country" && d != "Exporting country");

	var max_val = d3.max(data1.map(d => +d[commodities[0]] && +d[commodities[1]] && +d[commodities[2]]))
	

	var chyna = data1.filter(d => d['Importing country'] == "China" && d['Exporting country'] != "Total Pacific")
	chyna = chyna.map(d => {
		const obj = {};
		commodities.forEach(e => obj[e] = d[e])
		return obj
	})
	var china_total = chyna.map(d => Object.values(d))
	china_total = Array.prototype.concat.apply([], china_total)
	china_total = china_total.map(d => +d)
	china_total = d3.sum(china_total)

	var countries = topojson.feature(data2, data2.objects.countries);

	var isMobile;
	var windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

	if (windowWidth < 610) {
			isMobile = true;
	}	

	if (windowWidth >= 610){
			isMobile = false;
	}

	var width = document.querySelector(target).getBoundingClientRect().width
	var height = width*0.45;					
	var margin = {top: 20, right: 10, bottom: 10, left:10};

	width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;
   
	var projection = d3.geoMercator()
                .center([0,12])
                .scale(width * 0.16)
                .rotate([-145,0])
				.translate([width/2,height/2]); 
				
	var path = d3.geoPath(projection);

	var color = d3.scaleSequential()
    .domain(d3.extent(Array.from(data1.values())))
    .interpolator(d3.interpolateYlGnBu)
    .unknown("#ccc");

	var data = []  

	var keys = commodities

	function drawCurve(context, source, target) {
		var midPoint = [(source[0] + target[0])/2, (source[1] + target[1])/2]
		var midPoints = getCirclePoints(midPoint[0],midPoint[1], target[0], target[1], 30)
		context.moveTo(source[0], source[1])
		context.quadraticCurveTo(midPoints.leftX, midPoints.leftY, target[0], target[1])
		return context
	  }

	var arcTotalWidth = d3.scaleLinear()
  		.range([1,30])
		.domain([1,max_val]);

	var arcWidth = d3.scaleLog()
		.range([1,10])		
		.domain([1,max_val]);

	var nodeWidth = d3.scaleLinear()
		.range([5,30])
  		.domain([1,china_total]);
	  
	var getCirclePoints = function(x1,y1,x2,y2,r) {
		var startAngle = Math.atan2(y2- y1, x2-x1) * 180 / Math.PI
		var angRight = (startAngle + 90 > 360) ? (startAngle + 90 - 360) : (startAngle + 90)
		var angLeft = (startAngle - 90 < 0) ? 360 - (90 - startAngle) : (startAngle - 90)
		var rightX = x1 + r * Math.cos(angRight * 0.0174532925)
		var rightY = y1 + r * Math.sin(angRight * 0.0174532925)
		var leftX = x1 + r * Math.cos(angLeft * 0.0174532925)
		var leftY = y1 + r * Math.sin(angLeft * 0.0174532925)
		return {"rightX": rightX, "rightY": rightY, "leftX":leftX, "leftY":leftY}
	  }

	var getLinePoints = function(x1,y1,x2,y2,r) {
		var startAngle = Math.atan2(y2- y1, x2-x1)
		var pointX = x1 + r * Math.cos(startAngle)
		var pointY = y1 + r * Math.sin(startAngle)
		return [pointX,pointY]
	}

	var colors = d3.scaleOrdinal()
	.range(['#d10a10', '#0099db', '#4f524a','#de007e','#ffe500',' #b29163','#9970ab', '#bbce00', "#ea5a0b"])
	.domain(keys)

	// var new_data = data1.filter(d => d['Exporting country'] != "Total Pacific")
	// var new_data = data1
	var new_data = data1.filter(d => use_countries.includes(d['Exporting country']))
	new_data.forEach(d => {
		var newRow = {}
		// var source = new_centroids.find(c => c.properties.name_long == "Papua New Guinea").geometry.coordinates
		// console.log(d['Exporting country'])
		if (d['Exporting country'] == "Total Pacific") {
			var source = new_centroids.find(c => c.properties.name_long == "Wallis and Futuna Islands").geometry.coordinates
		} else {
			var source = new_centroids.find(c => c.properties.name_long == d['Exporting country']).geometry.coordinates	
		}
		// var source = new_centroids.find(c => c.properties.name_long == d['Exporting country']).geometry.coordinates		
		// console.log(d['Importing country'])
		var target = new_centroids.find(c => c.properties.name_long == d['Importing country']).geometry.coordinates
		newRow['targetName'] = d['Importing country']
		
		newRow['sourceName'] = d['Exporting country']
		// newRow['sourceName'] = "Papua New Guinea"
		newRow['imports'] = []
		newRow['source'] = source
		newRow['target'] = target
		var posCounter = 0
		var totalCounter = 0
		keys.forEach(key => {
			totalCounter = totalCounter + +d[key]
		})
		
		newRow['total'] = totalCounter
		
		keys.forEach(key => {
			var width = (+d[key]/newRow['total']) * arcTotalWidth(newRow['total'])
			var position = posCounter + width/2 
			totalCounter = totalCounter + +d[key]
			newRow['imports'].push({"category": key, "value": +d[key], "position":position, "width":width})
			posCounter = posCounter + width
		})
		
		newRow['sourcePoints'] = getCirclePoints(
			projection(newRow.source)[0],
			projection(newRow.source)[1],
			projection(newRow.target)[0],
			projection(newRow.target)[1],
			arcTotalWidth(newRow['total'])/2
		)
		newRow['targetPoints'] = getCirclePoints(
			projection(newRow.target)[0],
			projection(newRow.target)[1],
			projection(newRow.source)[0],
			projection(newRow.source)[1],
			arcTotalWidth(newRow['total'])/2
		)
		
		newRow['imports'].forEach(e => {
			e.source = getLinePoints(
			newRow['sourcePoints'].leftX,
			newRow['sourcePoints'].leftY,
			newRow['sourcePoints'].rightX,
			newRow['sourcePoints'].rightY,
			e.position
			)
			
			e.target = getLinePoints(
			newRow['targetPoints'].rightX,
			newRow['targetPoints'].rightY,
			newRow['targetPoints'].leftX,
			newRow['targetPoints'].leftY,
			e.position
			)
		})
		data.push(newRow)
		})


		var sourceNodes = []
		var sourceTotals = {}
		var sourceExports = []
		var sourceUniques = new Set()
		var sourceLocations = {}

		data.forEach(d => {
			if (!sourceUniques.has(d.sourceName)) {
				sourceTotals[d.sourceName] = []
				sourceUniques.add(d.sourceName)
				sourceLocations[d.sourceName] = d.source
				sourceExports[d.sourceName] = []
				}
		})

		data.map(d => sourceTotals[d.sourceName].push(+d.total))
		data.map(d => sourceExports[d.sourceName].push(d.imports))

		var export_totals = {}

		for (let country in sourceExports){
			var temp_country = sourceExports[country]
			var country_total = {}
			for (let commodity in commodities){
				var sumat = d3.sum(temp_country.map(d => d[commodity].value))
				country_total[commodities[commodity]] = sumat
			}
			export_totals[country] = country_total
		}
	
		sourceUniques.forEach(d => {
			var newRow = {}
			newRow['nodeName'] = d
			newRow['location'] = sourceLocations[d]
			newRow['total'] = d3.sum(sourceTotals[d])
			newRow['exports'] = export_totals[d]
			sourceNodes.push(newRow)
		})	

		var targetNodes = []
		var targetTotals = {}
		var targetUniques = new Set()
		var targetLocations = {}
		var targetImports = []

		data.forEach(d => {
			if (!targetUniques.has(d.targetName)) {
				targetTotals[d.targetName] = []
				targetUniques.add(d.targetName)
				targetLocations[d.targetName] = d.target
				targetImports[d.targetName] = []
				
				}
		})

		data.map(d => targetTotals[d.targetName].push(+d.total))
		data.map(d => targetImports[d.targetName].push(d.imports))
		
		var import_totals = {}

		for (let country in targetImports){
			var temp_country = targetImports[country]
			var country_total = {}
			for (let commodity in commodities){
				var sumat = d3.sum(temp_country.map(d => d[commodity].value))
				country_total[commodities[commodity]] = sumat
			}
			import_totals[country] = country_total
		}

		targetUniques.forEach(d => {
			var newRow = {}
			newRow['nodeName'] = d
			newRow['location'] = targetLocations[d]
			newRow['total'] = d3.sum(targetTotals[d])
			newRow['imports'] = import_totals[d]
			targetNodes.push(newRow)
		})	

	var pacific_countries = ["Total Pacific", 'Papua New Guinea',"Fiji",'Solomon Islands',"Vanuatu","Samoa","Tonga","Cook Islands","Tuvalu","Niue", "Federated States of Micronesia","Kiribati","Marshall Islands","Palau","Nauru"]
	
	var topTargets = targetNodes.sort((a, b) => d3.descending(a.total, b.total)).slice(0, importerCutoff)

	var shortNodes = sourceNodes.concat(topTargets)

	shortNodes = shortNodes.filter(d => d.total != 0)

	// remove empty nodes
	var top_x_importers = topTargets.map(d => d.nodeName)
	
	var exports = data.filter(function(d) {
		if (top_x_importers.includes(d.targetName)){
			return d.imports
		}
	})
	exports = exports.filter(d => d.total != 0)
	console.log(exports)
	


	// var	selected_countries = use_countries
	// console.log(selected_countries)

	// exports = exports.filter(d => selected_countries.includes(d.sourceName))
	
	// console.log(exports)

	d3.select("#graphicContainer svg").remove();



	var svg = d3.select(target).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.attr("id", "svg")
		.attr("overflow", "hidden");					

	var features = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	const g= features.append("g");

	g.append("g")
		.selectAll("path")
		.data(countries.features)
		.enter()
		.append("path")
		.attr("fill", "lightgrey")
		.attr("d", path)
		.attr("title", d => d.properties.NAME_LONG);

	g.append("path")
		.datum(topojson.mesh(data2, data2.objects.countries, (a, b) => a !== b))
		.attr("fill", "none")
		.attr("stroke", "white")
		.attr("stroke-linejoin", "round")
		.attr('d', path)

	var arcs = g.append("g")
		.attr("class", "arcs")
		.selectAll("g")
		.data(exports)
		.enter()
		.append("g")

	var curves = arcs.selectAll(".curve")
		.data(d => d.imports)
		.enter()
		.append("path")
		.attr("d", d => drawCurve(d3.path(), d.source, d.target))
		.style("stroke", d => colors(d.category))
		.style("fill", "none")
		.style("stroke-width", d => d.width)
		.style("opacity","60%")

	var nodes = g.append("g")
		.attr("class", "nodes")
		.selectAll("g")
		.data(shortNodes)
		.enter()
		.append("g")
		.attr("class", "node")

	makeTooltip(".node", shortNodes, pacific_countries);	


	var nodeCircles = nodes.append("circle")
		.attr("cx",d => projection(d.location)[0])
		.attr("cy",d => projection(d.location)[1])
		.attr("r", function(d){
			if (d.nodeName == "Papua New Guinea" | d.nodeName == "Solomon Islands"){
				// var oz_total = (d.total / country_array.length)
				// var oz_total = (d.total / 2)
				return nodeWidth(d.total / 2)
			} else if (d.nodeName == "Total Pacific"){
				return nodeWidth(d.total / 3)
			} else {
				return nodeWidth(d.total)
			}
		})
		.attr("Country", d => d.nodeName)
		// .attr("Total", d => d.total)
		// .attr("Imports", d=> d.imports)
		.attr("fill",function(d){
			if (pacific_countries.includes(d.nodeName)){
				return "white"
			} else {
				return "grey"}
		})
		.attr("stroke", "black")




		var self = this
		var keyLeftMargin = 20
		var keyRightMargin = 20

		// var keyWidth = document.querySelector(".col50").getBoundingClientRect().width
		var keyWidth = 400

		keyWidth = keyWidth - keyRightMargin - keyLeftMargin

		// var keySquare = keyWidth / 10;

		var keyHeight = 30

		var labels = commodities;

		var x = d3.scaleBand()
		.range([0, keyWidth])
		.paddingInner(0.05);
		x.domain(labels);
	
		var y = d3.scaleLinear().range([keyHeight, 0]);
	
		d3.select("#keyContainer svg").remove();

		var keyBox = d3.select("#keyContainer")
			.append("svg")
			.attr("width", keyWidth)
			.attr("height", "40px")

		var keySize = 5; 
	
		keyBox.selectAll(".annotationCircles")
				.data(labels)
				.enter()
				.append("circle")
				.attr("class", "annotationCircle")
				.attr("cy", keyHeight /2 )
				.attr("cx", function(d, i) { 
					return x(d) + x.bandwidth()/2})
				.attr("r", keySize)
				.attr("fill", function(d){
					return colors(d)
				});

		keyBox.selectAll(".annotationText")
			.data(labels)
			.enter().append("text")
			.attr("class", "annotationText")
			.attr("y", keyHeight + 5)
			.attr("x", function(d,i){ return x(d) + x.bandwidth()/2})
			.style("text-anchor", "middle")
			.style("opacity", 1)
			.style("font-size", "0.6em")
			.text(function(d) {return d});


} 

var q = Promise.all([d3.csv("<%= path %>/pac_indi_grouped_rain.csv"),
					d3.json("<%= path %>/countries.json"),
					d3.json("<%= path %>/country_centroids_az8.json")])

					.then(([exports, countries, new_centroids]) => {
						
						makeMap(exports, countries, new_centroids, countries_selected)
						var to=null
						var lastWidth = document.querySelector(target).getBoundingClientRect()
						window.addEventListener('resize', function() {
							var thisWidth = document.querySelector(target).getBoundingClientRect()
							if (lastWidth != thisWidth) {
								window.clearTimeout(to);
								to = window.setTimeout(function() {

										makeMap(exports, countries, new_centroids, countries_selected)

									}, 500)
									}
						})
// 						var checked = d3.selectAll(".checkbox")
// 							checked.on("click", function(d){
// 							const selected = d3.select(this).property("value")
// 							// selected_value = selected.property("value")
// 							// console.log(selected)
// 							if (countries_selected.includes(selected)){
// 								countries_selected = countries_selected.filter(d => d != selected)
// 								console.log(countries_selected)
// 								makeMap(exports, countries, new_centroids, countries_selected)
// 							} else {
// 								countries_selected.push(selected)
// 								console.log(countries_selected)
// 								makeMap(exports, countries, new_centroids, countries_selected)
// 							}
// })

							d3.select(".countryChooser")
							.on("change", function(d){
								countries_selected = [d3.select(this).property("value")]
								console.log(countries_selected)
								makeMap(exports, countries, new_centroids, countries_selected)
							})
        });

        