async function draw(el, scale) {
  // Data
  const dataset = await d3.json("data.json");
  dataset.sort((a, b) => a - b); // Sort ascending

  // Dimensions
  let dimensions = {
    width: 600,
    height: 150,
  };

  const box = 30;

  // Draw Image
  const svg = d3
    .select(el)
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  // Scales
  let colorScale;

  if (scale === "linear") {
    // Continous color scale
    colorScale = d3
      .scaleLinear()
      .domain(d3.extent(dataset))
      .range(["white", "red"]);
  } else if (scale === "quantize") {
    // Three buckets of colors (equal intervals of input domain values (0 to 300577))
    colorScale = d3
      .scaleQuantize()
      .domain(d3.extent(dataset))
      .range(["white", "pink", "red"]);

    console.log("Quantize", colorScale.thresholds());
  } else if (scale === "quantile") {
    // Three buckets of colors (equal distribution of number of input domain values (100 values (lowest 33, middle 33, highest 34)))
    colorScale = d3
      .scaleQuantile()
      .domain(dataset)
      .range(["white", "pink", "red"]);

    console.log("Quantile", colorScale.quantiles());
  } else if (scale === "threshold") {
    // Threshold buckets
    colorScale = d3
      .scaleThreshold()
      .domain([45200, 135600])
      .range(d3.schemeReds[3]);
  }

  // Rectangles
  svg
    .append("g")
    .attr("transform", "translate(2,2)")
    .selectAll("rect")
    .data(dataset)
    .join("rect")
    .attr("stroke", "black")
    .attr("width", box - 3)
    .attr("height", box - 3)
    .attr("x", (d, i) => box * (i % 20)) // 0, 30, 60
    .attr("y", (d, i) => box * ((i / 20) | 0))
    .attr("fill", (d) => colorScale(d));
}

draw("#heatmap1", "linear");
draw("#heatmap2", "quantize");
draw("#heatmap3", "quantile");
draw("#heatmap4", "threshold");
