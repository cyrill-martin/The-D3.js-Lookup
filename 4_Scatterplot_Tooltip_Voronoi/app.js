async function draw() {
  // Data
  ////////////////////////////////////////////////////////////////////
  const dataset = await d3.json("data.json");
  console.log(dataset);

  // Outsourced accessors
  ////////////////////////////////////////////////////////////////////
  // const xAccessor = function (d) {
  //     return d.currently.humidity;
  // };
  const xAccessor = (d) => d.currently.humidity;
  const yAccessor = (d) => d.currently.apparentTemperature;

  // Dimensions
  ////////////////////////////////////////////////////////////////////
  let dimensions = {
    width: 800,
    height: 800,
    margin: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    },
  };

  // Add a width for the up to come container inside the up to come svg image
  dimensions.ctrWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;

  // Add a height for the up to come container inside the up to come svg image
  dimensions.ctrHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // Draw svg image
  ////////////////////////////////////////////////////////////////////
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  // Add g container with margins
  ////////////////////////////////////////////////////////////////////
  const ctr = svg
    .append("g") // <g> does NOT support x,y coordinates
    .attr(
      "transform",
      `translate(${dimensions.margin.left}, ${dimensions.margin.top})`
    );

  const tooltip = d3.select("#tooltip");

  // Scales
  ////////////////////////////////////////////////////////////////////
  // Handling input DOMAIN and outut RANGE
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, xAccessor)) // d3.extent() with additional accessor function !!!
    .rangeRound([0, dimensions.ctrWidth]) // rangeRound() to avoid decimal coordinate values (in RANGE)
    .clamp(true); // clamp(true) to add new data that might be outside of the RANGE

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .rangeRound([dimensions.ctrHeight, 0])
    .nice() // Round the DOMAIN values !!!
    .clamp(true);

  // Add circles to the g container
  ////////////////////////////////////////////////////////////////////
  // Multiple circles --> selectAll()
  // This will be an empty (!) selection but the entire data will be put into the enter selection
  ctr
    .selectAll("circle")
    .data(dataset)
    .join("circle")
    // .attr("cx", (d) => d.currently.humidity) // Outsource these accessors
    // .attr("cy", (d) => d.currently.apparentTemperature)
    // .attr("cx", (d) => xAccessor(d))
    // .attr("cy", (d) => yAccessor(d))
    // .attr("cx", xAccessor)
    // .attr("cy", yAccessor)
    .attr("cx", (d) => xScale(xAccessor(d)))
    .attr("cy", (d) => yScale(yAccessor(d)))
    .attr("r", 5)
    .attr("fill", "red")
    .attr("data-temp", yAccessor);
    // .on("mouseenter", function (event, datum) {
    //   // console.log(datum);
    //   d3.select(this).attr("fill", "#120078").attr("r", 8);

    //   tooltip
    //     .style("display", "block")
    //     .style("top", yScale(yAccessor(datum)) - 25 + "px")
    //     .style("left", xScale(xAccessor(datum)) + "px");

    //   // Formatters
    //   const formatter = d3.format(".2f");
    //   const dateFormatter = d3.timeFormat("%B %-d, %Y");

    //   tooltip.select(".metric-humidity span").text(formatter(xAccessor(datum)));
    //   tooltip.select(".metric-temp span").text(formatter(yAccessor(datum)));
    //   tooltip
    //     .select(".metric-date")
    //     .text(dateFormatter(datum.currently.time * 1000));
    // })
    // .on("mouseleave", function (event) {
    //   d3.select(this).attr("fill", "red").attr("r", 5);

    //   tooltip.style("display", "none");
    // });

  // Axis
  ////////////////////////////////////////////////////////////////////

  // X axis
  ///////////////////////////////
  // const xAxis = d3.axisBottom().scale(xScale) --> same as:
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(5) // ticks() is considered a recommendation by D3.js
    // .tickValues([0.4, 0.5, 0.8])
    .tickFormat((d) => d * 100);

  const xAxisGroup = ctr
    .append("g")
    .attr("transform", `translate(0,${dimensions.ctrHeight})`)
    .classed("axis", true) // Check css (it makes sure the axis gets always rendered crisp)
    .call(xAxis); // You'll need to call the xAxis function (can't be chained);

  // Refine xAxis
  xAxisGroup
    .append("text")
    .attr("x", dimensions.ctrWidth / 2) // Center the text
    .attr("y", dimensions.margin.bottom - 10) // 10px above the bottom
    .attr("fill", "black")
    .text("Humidity (%)");

  // Y axis
  ///////////////////////////////
  const yAxis = d3.axisLeft(yScale);

  const yAxisGroup = ctr.append("g").classed("axis", true).call(yAxis);

  yAxisGroup
    .append("text")
    .attr("x", -dimensions.ctrHeight / 2)
    .attr("y", -dimensions.margin.left + 15)
    .attr("fill", "black")
    .html("Temperature &deg; F")
    .style("transform", "rotate(270deg")
    .style("text-anchor", "middle");

  // Adding voronoi
  //////////////////////////////////
  const delaunay = d3.Delaunay.from(
    dataset,
    (d) => xScale(xAccessor(d)),
    (d) => yScale(yAccessor(d))
  );
  // console.log(delaunay);

  const voronoi = delaunay.voronoi();
  voronoi.xmax = dimensions.ctrWidth;
  voronoi.ymax = dimensions.ctrHeight;
  console.log(voronoi);

  ctr
    .append("g")
    .selectAll("path")
    .data(dataset)
    .join("path")
    // .attr("stroke", "black")
    .attr("fill", "transparent")
    .attr("d", (d, i) => voronoi.renderCell(i))
    // Slightly changed (drawing new circle above currently "selected" one)
    .on("mouseenter", function (event, datum) {
      // console.log(datum);
      ctr
        .append("circle")
        .classed("dot-hovered", true)
        .attr("fill", "#120078")
        .attr("r", 8)
        .attr("cx", (d) => xScale(xAccessor(datum)))
        .attr("cy", (d) => yScale(yAccessor(datum)))
        .style("pointer-events", "none");

      tooltip
        .style("display", "block")
        .style("top", yScale(yAccessor(datum)) - 60 + "px")
        .style("left", xScale(xAccessor(datum)) + "px");

      // Formatters
      const formatter = d3.format(".2f");
      const dateFormatter = d3.timeFormat("%B %-d, %Y");

      tooltip.select(".metric-humidity span").text(formatter(xAccessor(datum)));
      tooltip.select(".metric-temp span").text(formatter(yAccessor(datum)));
      tooltip
        .select(".metric-date")
        .style("font-weight", "bold")
        .style("margin-bottom", "1rem")
        .text(dateFormatter(datum.currently.time * 1000));
    })
    .on("mouseleave", function (event) {
      ctr.select(".dot-hovered").remove();
      // d3.select(this).attr("fill", "red").attr("r", 5);

      tooltip.style("display", "none");
    });;
}

draw();
