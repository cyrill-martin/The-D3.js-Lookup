async function draw() {
  // Data
  const dataset = await d3.csv("data.csv");

  // Dimensions
  let dimensions = {
    width: 600,
    height: 600,
    margins: 10,
  };

  dimensions.ctrWidth = dimensions.width - dimensions.margins * 2;
  dimensions.ctrHeight = dimensions.height - dimensions.margins * 2;

  const radius = dimensions.ctrWidth / 2;

  // Draw Image
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const ctr = svg
    .append("g") // <g>
    .attr(
      "transform",
      `translate(${dimensions.margins}, ${dimensions.margins})`
    );

  // Scales (angles, etc.)
  // d3.pie(): will FORMAT the DATA to use in pie charts
  // It will also calculate how big each pie slice will have to be

  const populationPie = d3
    .pie()
    .value((d) => d.value)
    // DON'T sort the data according to d.value (leave it as is)
    .sort(null);
  // console.log(dataset);

  // d.value is accessing the value key in each dataset item
  const slices = populationPie(dataset);

  // slices holds the information to draw the pie chart (a new object) !!!
  // console.log(slices);

  // d3.arc() will return a function that will be able to DRAW an ARC !!!
  const arc = d3.arc().outerRadius(radius).innerRadius(0);

  // A second arc function for the slice labes (creating a donught chart)
  // To use the centroid function on this in order to position slice labels on the donought (at the edge of the pie)
  const arcLabels = d3.arc().outerRadius(radius).innerRadius(200);

  // Creating a color for every age group in the dataset !!!
  const colors = d3.quantize((t) => d3.interpolateSpectral(t), dataset.length);

  const colorScale = d3
    .scaleOrdinal()
    // Iterate through dataset, call each item element and take the value of the name key
    // This will return a new array of all the group names available in the data
    .domain(dataset.map((element) => element.name))
    .range(colors);

  // Draw shape
  const arcGroup = ctr
    .append("g")
    .attr(
      "transform",
      `translate(${dimensions.ctrHeight / 2}, ${dimensions.ctrWidth / 2})`
    );

  // Drawing the actual arcs (as paths)
  // D3 will call the above arc function for each data item in slices
  arcGroup
    .selectAll("path")
    .data(slices)
    .join("path")
    .attr("d", arc)
    .attr("fill", (d) => colorScale(d.data.name));

  const labelsGroup = ctr
    .append("g")
    .attr(
      "transform",
      `translate(${dimensions.ctrHeight / 2}, ${dimensions.ctrWidth / 2})`
    )
    .classed("labels", true);

  labelsGroup
    .selectAll("text")
    .data(slices)
    .join("text")
    .attr("transform", (d) => `translate(${arcLabels.centroid(d)})`)
    .call((text) =>
      text
        .append("tspan")
        .style("font-weight", "bold")
        .attr("y", -4)
        .text((d) => d.data.name)
    )
    .call((text) =>
      text
        // Only show population if slice is big enough
        .filter((d) => d.endAngle - d.startAngle > 0.25)
        .append("tspan")
        .attr("y", 9)
        .attr("x", 0)
        .text((d) => d.data.value)
    );
}

draw();
