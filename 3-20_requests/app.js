async function getJson() {
  const data = await d3.json("data.json");
  console.log(data);
}

async function getCsv() {
  const data = await d3.csv("data.csv");
  console.log(data);
}

// getJson();

getCsv();