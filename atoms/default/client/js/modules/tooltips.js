import * as d3 from "d3"
import { numberFormat } from './numberFormat'

function makeTooltip(el, data, included_countries) {

	// console.log("make", el)

	// console.log(data)
	var els = d3.selectAll(el)
	var width = document.querySelector("#graphicContainer").getBoundingClientRect().width
	var tooltip = d3.select("#graphicContainer").append("div")
		    .attr("class", "tooltip")
		    .attr("id", "tooltip")
		    .style("position", "absolute")
		    .style("background-color", "white")
		    .style("opacity", 0);

	els.on("mouseover.tooltip", function(d, i) {
		// console.log(i)
		var country = i.nodeName;
		// console.log(country)
		var country_array = data.find(d => d.nodeName == country)
		// console.log(country_array.imports)
		var text = ''
		if (included_countries.includes(i.nodeName)) {
			text += `<b>${i.nodeName} exports:</b>`
			for (let category in country_array.exports){
				if (country_array.exports[category] > 0){
					text += `<br>- ${category}: ${numberFormat(country_array.exports[category])} tonnes`
				}
			}
		} else {
			var text = `<b>${i.nodeName} imports:</b>`			
			for (let category in country_array.imports){
				if (country_array.imports[category] > 0){
					text += `<br>- ${category}: ${numberFormat(country_array.imports[category])} tonnes`
				}
			}
		}
		
		tooltip.transition()
			.duration(200)
		   	.style("opacity", .9);

		tooltip.html(text)
		var tipHeight = document.querySelector("#tooltip").getBoundingClientRect().height
		var tipWidth = document.querySelector("#tooltip").getBoundingClientRect().width
		// console.log(tipHeight)
		var mouseX = d3.pointer(d)[0]
        var mouseY = d3.pointer(d)[1]

        var half = width/2;

        if (mouseX < half) {
            tooltip.style("left", (d3.pointer(d)[0]) + 10 + "px");
        }

        else if (mouseX >= half) {
            tooltip.style("left", (d3.pointer(d)[0] - tipWidth) + "px");
        }

        // tooltip.style("left", (d3.pointer(d)[0] + tipWidth/2) + "px");
        tooltip.style("top", (d3.pointer(d)[1]) + "px");

	})
	
	els.on("mouseout", function(d) {

	  tooltip.transition()
	       .duration(500)
	       .style("opacity", 0);

	})


}

export { makeTooltip }