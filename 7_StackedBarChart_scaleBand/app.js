async function draw() {
  // Data

  // name,<10,10-19,20-29,30-39,40-49,50-59,60-69,70-79,≥80              ==> columns
  // AL,598478,638789,661666,603013,625599,673864,548376,316598,174781   ==> d
  // AK,106741,99926,120674,102008,91539,104569,70473,28422,12503
  // AZ,892083,912735,939804,857054,833290,834858,737884,466153,254716

  // d3.csv ==>
  //   {
  //     "name": "AL",
  //     "<10": 598478,
  //     "10-19": 638789,
  //     "20-29": 661666,
  //     "30-39": 603013,
  //     "40-49": 625599,
  //     "50-59": 673864,
  //     "60-69": 548376,
  //     "70-79": 316598,
  //     "≥80": 174781,
  // }

  // ALSO: format data types right away !!!
  const dataset = await d3.csv("data.csv", (d, index, columns) => {
    d3.autoType(d);

    // Adding a new property "total" with the total population per state !!!
    // columns holds all the property names in each object (d)
    // We call each property "c" and inside each object (d; see above),
    // we access d["name"], d["<10"], d["10-19"], etc. and add up everything
    // Apparently, there's no problem adding a string with a number with d3.sum()
    d.total = d3.sum(columns, (columnName) => d[columnName]);
    return d;
  });

  // Sort the data according to total population
  // compareFunction (descending)
  dataset.sort((a, b) => b.total - a.total);

  // Format data (to stack it !!!)

  // Inspect dataset
  console.log("CSV", dataset);

  // Dimensions
  let dimensions = {
    width: 1000,
    height: 600,
    margins: 20,
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
    .append("g")
    .attr(
      "transform",
      `translate(${dimensions.margins}, ${dimensions.margins})`
    );

  // Scales

  // The stack generator !!!
  // Keys are the list of age groups
  // The d3.csv() function creates a key "columns" !!!
  // Of interest are all items in "columns" expect the first one (it's the header for the states)
  const stackGenerator = d3.stack().keys(dataset.columns.slice(1));

  // Create an object with 9 bins (for each age group)
  // Each bin having 52 objects (for each state) --> The stacks !!!
  // with a starting value (0) and an end value (1) --> beginning and end of each stack part
  // The additional map() function iterates through each bin (ageGroup) and inside each bin, ...
  // ...adds the current ageGroup label to each state object
  // short: storing the age group label in each child array
  const stackData = stackGenerator(dataset).map((ageGroup) => {
    ageGroup.forEach((state) => {
      // Adding a "key" property (a key called "key") to each child array
      state.key = ageGroup.key;
    });

    return ageGroup;
  });

  console.log("Formatted", stackData);

  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(stackData, (ag) => {
        // ag is age group
        return d3.max(ag, (state) => state[1]);
      }),
    ])
    .rangeRound([dimensions.ctrHeight, dimensions.margins]);

  const xScale = d3
    .scaleBand()
    .domain(dataset.map((state) => state.name)) // Array with each state name
    .range([dimensions.margins, dimensions.ctrWidth])
    // .paddingInner(0.1)
    // .paddingOuter(0.1)
    .padding(0.1);

  const colorScale = d3
    .scaleOrdinal()
    .domain(stackData.map((d) => d.key))
    .range(d3.schemeSpectral[stackData.length])
    .unknown("#ccc");

  // Draw (stacked) bars
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  const ageGroups = ctr
    .append("g")
    .classed("age-groups", true) // Create one <g class="age-group">
    .selectAll("g")
    .data(stackData)
    .join("g") // Create nine <g>
    .attr("fill", (d) => colorScale(d.key));

  // In order to understand ANYTHING, you have to
  // always check out the logged formatted data (stackData)

  ageGroups
    .selectAll("rect")
    // THE TRICKY PART: ageGroups data is: stackData
    // This time, data is each item in stackData as above code is iterating through stackData
    // We call each item d and return it (it's one of the bins, and therefore an array of 52 items (each state information for each age group))
    .data((d) => d)
    .join("rect") // A <rect> for each stack item
    .attr("x", (d) => xScale(d.data.name))
    .attr("y", (d) => yScale(d[1]))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => yScale(d[0]) - yScale(d[1]));

  // Draw axis
  const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
  const yAxis = d3.axisLeft(yScale).ticks(null, "s");

  ctr
    .append("g")
    .attr("transform", `translate(0, ${dimensions.ctrHeight})`)
    .call(xAxis);

  ctr
    .append("g")
    .attr("transform", `translate(${dimensions.margins}, 0)`)
    .call(yAxis);
}

draw();
