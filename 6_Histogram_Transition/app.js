async function draw() {
  // Data
  const dataset = await d3.json("data.json");

  // The accessor functions need to change based on the current metric
  // See in below histogram() function
  // const xAccessor = (d) => d.currently.humidity;
  // const yAccessor = (d) => d.length;

  // Dimensions
  let dimensions = {
    width: 800,
    height: 400,
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

  const labelsGroup = ctr.append("g").classed("bar-labels", true);

  const xAxisGroup = ctr
    .append("g")
    .style("transform", `translateY(${dimensions.ctrHeight}px)`);

  const lineGroup = ctr.append("g");
  const meanLine = lineGroup.append("line").classed("mean-line", true);
  const meanLineLabel = lineGroup.append("text");

  // The histogram function will draw/update the dynamic stuff
  ////////////////////////////////////////////////////////////
  
  function histogram(metric) {
    const xAccessor = (d) => d.currently[metric];
    const yAccessor = (d) => d.length;

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(dataset, xAccessor))
      .range([0, dimensions.ctrWidth])
      .nice();

    // Format data
    const bin = d3
      .bin()
      .domain(xScale.domain()) // Use xScale.domain() instead of d3.extent(dataset, xAccessor)
      .value(xAccessor)
      .thresholds(10); // The given number is a RECOMMENDATION

    const newDataSet = bin(dataset); // bin() because "const bin"
    const padding = 1;

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(newDataSet, yAccessor)])
      .range([dimensions.ctrHeight, 0])
      .nice();

    // console.log("Original", dataset);
    // console.log("Formatted", newDataSet);

    // THIS is done in order to avoid playing all transitions at once !!!
    const exitTransition = d3.transition().duration(500);
    // const updateTransition = d3.transition().duration(500).transition().duration(500);
    const updateTransition = exitTransition.transition().duration(500);
    const lineTransition = updateTransition.transition().duration(500);

    // Draw bars
    const temp = ctr
      .selectAll("rect")
      .data(newDataSet)
      .join(
        // Enter new elements
        (enter) =>
          enter
            .append("rect")
            .attr("width", (d) =>
              d3.max([0, xScale(d.x1) - xScale(d.x0) - padding])
            )
            .attr("height", 0)
            .attr("x", (d) => xScale(d.x0))
            .attr("y", dimensions.ctrHeight)
            .attr("fill", "#b8de6f"),
        // Update elements
        (update) => update,
        // Remove unnecesary elements
        (exit) =>
          exit
            .attr("fill", "#f39233")
            .transition(exitTransition)
            .attr("y", dimensions.ctrHeight)
            .attr("height", 0)
            .remove()
      )
      .transition(updateTransition) // Will animate attributes AFTER this
      // By default, all transitions of NEW shapes start at x: 0, y: 0 and get animated into place !!!
      // All at the same time !!!
      // That's why we customized above join() function with custom enter, update, and exit behavior
      .attr("width", (d) => d3.max([0, xScale(d.x1) - xScale(d.x0) - padding]))
      .attr("height", (d) => dimensions.ctrHeight - yScale(yAccessor(d)))
      .attr("x", (d) => xScale(d.x0))
      .attr("y", (d) => yScale(yAccessor(d)))
      .attr("fill", "#01c5c4");

    labelsGroup
      .selectAll("text")
      .data(newDataSet)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("x", (d) => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
            .attr("y", dimensions.ctrHeight)
            .text(yAccessor),
        (update) => update,
        (exit) =>
          exit
            .transition(exitTransition)
            .attr("y", dimensions.ctrHeight)
            .remove()
      )
      .transition(updateTransition)
      .attr("x", (d) => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
      .attr("y", (d) => yScale(yAccessor(d)) - 10)
      .text(yAccessor);

    const mean = d3.mean(dataset, xAccessor);

    lineGroup.raise(); // raise() to make it appear in front !!!

    meanLine
      // .raise() // raise() to make it appear in front !!!
      .transition(lineTransition)
      .attr("x1", xScale(mean))
      .attr("y", dimensions.ctrHeight)
      .attr("x2", xScale(mean))
      .attr("y2", dimensions.ctrHeight)
      .style("opacity", 1);

    meanLineLabel
      .transition(lineTransition)
      .attr("x", xScale(mean))
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("fill", "#d62828")
      .text("Mean");

    // Draw axis
    const xAxis = d3.axisBottom(xScale);

    xAxisGroup.transition().call(xAxis);
  }

  // Listen to which option is selected in the dropdown
  d3.select("#metric").on("change", function (e) {
    e.preventDefault();
    // console.log(this);

    histogram(this.value); // Call above histogram function with the value of the currently selected option
  });

  // Draw default humidity histogram
  histogram("humidity");
}

draw();
