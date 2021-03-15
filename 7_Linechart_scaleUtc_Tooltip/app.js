async function draw() {
  // Data
  const dataset = await d3.csv("data.csv");
  console.log(dataset);

  const parseDate = d3.timeParse("%Y-%m-%d");

  const xAccessor = (d) => parseDate(d.date);
  const yAccessor = (d) => parseInt(d.close);

  // Dimensions
  let dimensions = {
    width: 1000,
    height: 500,
    margins: 50,
  };

  dimensions.ctrWidth = dimensions.width - dimensions.margins * 2;
  dimensions.ctrHeight = dimensions.height - dimensions.margins * 2;

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

  const tooltip = d3.select("#tooltip");
  const tooltipDot = ctr
    .append("circle")
    .attr("r", 5)
    .attr("fill", "#30475e")
    .attr("stroke", "#30475e")
    .attr("stroke-width", 2)
    .style("opacity", 0)
    .style("pointer-events", "none");

  // Scales
  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.ctrHeight, 0])
    .nice();

  const xScale = d3
    .scaleUtc() // Transform dates into numbers (vs. scaleTime)
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.ctrWidth]);

  // console.log(xScale(xAccessor(dataset[0]))); // Should return 0 as it's the oldest date
  // console.log(dataset[0]); // The first/oldest entry

  // Generators
  // d3.line() will return a generator/function that can draw a line with the <path> element
  const lineGenerator = d3
    .line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)));

  // console.log(lineGenerator(dataset));

  ctr
    .append("path")
    .datum(dataset)
    .attr("d", lineGenerator)
    .attr("fill", "none")
    .attr("stroke", "#30475e")
    .attr("stroke-width", 2);

  // Axis
  const yAxis = d3.axisLeft(yScale).tickFormat((d) => `$${d}`);

  ctr.append("g").call(yAxis);

  const xAxis = d3.axisBottom(xScale);

  ctr
    .append("g")
    .style("transform", `translate(0, ${dimensions.ctrHeight}px)`)
    .call(xAxis);

  // Tooltip
  ctr
    .append("rect")
    .attr("width", dimensions.ctrWidth)
    .attr("height", dimensions.ctrHeight)
    .style("opacity", 0)
    // EVENT HANDLERS (touchmouse = mobile)
    .on("touchmouse mousemove", function (event) {
      const mousePos = d3.pointer(event, this);
      // console.log(mousePos);
      // invert() reverses the scale value to it's original value
      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      const date = xScale.invert(mousePos[0]);
      // mousePos[0] holds the x coordinate !!!
      // console.log(date);

      // Getting the index of the dataset item with the current date !!!
      // const index = d3.bisect(dataset, date);

      // Custom bisector: left, center, right
      const bisector = d3.bisector(xAccessor).left;
      const index = bisector(dataset, date);
      const stock = dataset[index - 1];
      // console.log(stock);

      // Update image
      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

      // Showing and positioning the tooltip dot
      tooltipDot
        .style("opacity", 1)
        .attr("cx", xScale(xAccessor(stock)))
        .attr("cy", yScale(yAccessor(stock)))
        .raise();

      // Showing and positioning the tooltip container
      tooltip
        .style("display", "block")
        .style("top", yScale(yAccessor(stock)) - 20 + "px")
        .style("left", xScale(xAccessor(stock)) + "px");
      
      // Setting the tooltip values
      tooltip.select(".price").text(`$${yAccessor(stock)}`);
      
      const dateFormatter = d3.timeFormat("%B %-d, %Y")
      tooltip.select(".date").text(`${dateFormatter(xAccessor(stock))}`)
    })
    .on("mouseleave", function () {
      tooltipDot.style("opacity", 0);
      tooltip.style("display", "none");
    });
}

draw();
