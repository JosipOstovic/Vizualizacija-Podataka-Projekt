const width = 1470;
const height = 810;

const svg = d3
  .select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const g = svg.append("g");

// Tooltip za prikaz informacija (inspirirano tooltip primjerima sa Observable i bl.ocks.org)
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

//Omogućavanje zoomiranja i pomicanja karte (preuzeto s: https://observablehq.com/@d3/zoomable-map)
const zoom = d3
  .zoom()
  .scaleExtent([1, 8])
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

svg.call(zoom);

// Projekcija karte Europe (geoMercator) – temeljeno na D3 geo primjerima sa observablehq.com/@d3
const projection = d3
  .geoMercator()
  .center([13, 52])
  .scale(500)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);
let clubData = [];
let goalData = [];

Promise.all([
  d3.json("data/europe_countries.geojson"),
  d3.csv("data/clubs.csv"),
  d3.csv("data/scorers_goals_by_year.csv"),
]).then(([geoData, loadedClubData, loadedGoalData]) => {
  clubData = loadedClubData;
  goalData = loadedGoalData;
  console.log("Učitani podaci o golovima:", goalData);
  // Dohvaćanje i prikaz geoJSON podataka karte Europe
  // Ovaj pristup korišten u gotovo svim D3 geo map primjerima na Observable (posebno kod interaktivnih prikaza Europe)
  g.selectAll("path")
    .data(geoData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#dfe6e9")
    .attr("stroke", "#636e72")
    .attr("stroke-width", 0.5);

  const clubLogos = {
    "Real Madrid":
      "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
    Barcelona:
      "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
    "Man City":
      "https://upload.wikimedia.org/wikipedia/sco/e/eb/Manchester_City_FC_badge.svg",
    "Bayern Munich":
      "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
    Juventus:
      "https://cdn.freebiesupply.com/images/thumbs/2x/juventus-logo.png",
    Arsenal: "https://upload.wikimedia.org/wikipedia/sco/5/53/Arsenal_FC.svg",
    PSG: "https://upload.wikimedia.org/wikipedia/sco/a/a7/Paris_Saint-Germain_F.C..svg",
    "Inter Milan":
      "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg",
    Liverpool:
      "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
    Ajax: "https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg",
    Lyon: "https://upload.wikimedia.org/wikipedia/hr/1/1c/Olympique_Lyonnais_logo.svg",
    "Borussia Dortmund":
      "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
    Marseille:
      "https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg",
    Napoli:
      "https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Neapel.svg",
    "Bayer Leverkusen":
      "https://upload.wikimedia.org/wikipedia/de/f/f7/Bayer_Leverkusen_Logo.svg",
    Roma: "https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg",
  };
  // Prikaz logotipa klubova na mapi pomoću <image> elemenata
  // Slično rješenje korišteno u nekim sport vizualizacijama na bl.ocks.org (custom simboli/ikone nad geoMap)
  g.selectAll("image")
    .data(clubData)
    .enter()
    .append("image")
    .attr("class", "club-logo")
    .attr("xlink:href", (d) => {
      console.log("Club name:", d.club);
      return (
        clubLogos[d.club] ||
        "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg"
      );
    })
    .attr("x", (d) => projection([+d.longitude, +d.latitude])[0] - 12)
    .attr("y", (d) => projection([+d.longitude, +d.latitude])[1] - 12)
    .attr("width", 24)
    .attr("height", 24)
    .on("error", function () {
      d3.select(this).attr(
        "xlink:href",
        "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg"
      );
    })
    .on("mouseover", (event, d) => {
      // Tooltip efekt inspiriran klasičnim D3 primjerima s Observable (hover informacije iznad ikona)
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr("width", 30)
        .attr("height", 30)
        .attr("x", projection([+d.longitude, +d.latitude])[0] - 15)
        .attr("y", projection([+d.longitude, +d.latitude])[1] - 15);

      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(`<strong>${d.club}</strong><br>${d.city}, ${d.country}`)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", (event, d) => {
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr("width", 24)
        .attr("height", 24)
        .attr("x", projection([+d.longitude, +d.latitude])[0] - 12)
        .attr("y", projection([+d.longitude, +d.latitude])[1] - 12);

      tooltip.transition().duration(500).style("opacity", 0);
    })
    .on("click", (event, d) => {
      if (defaultClub) {
        d3.select("#club-info").classed("visible", true);
        d3.select("#charts").classed("visible", true);
        showClubInfo(d);
      }
    });

  const select1 = d3.select("#club1-select");
  const select2 = d3.select("#club2-select");

  clubData.forEach((d) => {
    select1.append("option").attr("value", d.club).text(d.club);
    select2.append("option").attr("value", d.club).text(d.club);
  });
  d3.select("#filter-type").on("change", function () {
    const selected = this.value;
    d3.select("#filter-chart").selectAll("*").remove();

    if (selected === "none") return;

    let data = [];

    if (selected === "most-valuable") {
      data = [...clubData]
        .filter((d) => d.club_value)
        .sort((a, b) => +b.club_value - +a.club_value)
        .slice(0, 5)
        .map((d) => ({
          label: d.club,
          value: +d.club_value,
        }));
      drawFilterChart(data, "club");
    } else if (selected === "most-expensive-player") {
      data = [...clubData]
        .filter((d) => d.top_player && d.top_player_value)
        .map((d) => ({
          label: d.top_player,
          value: +d.top_player_value,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      drawFilterChart(data, "player");
    } else if (selected === "most-titles") {
      data = [...clubData]
        .filter((d) => d.championships)
        .sort((a, b) => +b.championships - +a.championships)
        .slice(0, 5)
        .map((d) => ({
          label: d.club,
          value: +d.championships,
        }));
      drawFilterChart(data, "club");
    }
  });

  const defaultClub = clubData.find((d) => d.club === "Bayern Munich");
  if (defaultClub) {
    d3.select("#charts").classed("visible", true);
    showClubChartsOnly(defaultClub);
  }
});

function compareClubs() {
  const club1 = d3.select("#club1-select").property("value");
  const club2 = d3.select("#club2-select").property("value");

  const data1 = clubData.find((d) => d.club === club1);
  const data2 = clubData.find((d) => d.club === club2);

  if (!data1 || !data2) return;
  const stats = [
    {
      label: "Prvenstva",
      value1: +data1.championships,
      value2: +data2.championships,
    },
    {
      label: "Liga prvaka",
      value1: +data1.ucl_titles,
      value2: +data2.ucl_titles,
    },
    {
      label: "Top strijelac (golova)",
      value1: +data1.goals.split(";")[0],
      value2: +data2.goals.split(";")[0],
    },
  ];

  d3.select("#comparison-result").html(`
    <p><strong>${data1.club}</strong>: ${data1.city}, ${data1.country}</p>
    <p><strong>${data2.club}</strong>: ${data2.city}, ${data2.country}</p>
  `);
  drawComparisonChart(stats, data1.club, data2.club);
}

function drawComparisonChart(data, club1, club2) {
  d3.select("#comparison-chart").selectAll("*").remove();
  const width = 400,
    height = 340,
    margin = { top: 20, right: 120, bottom: 90, left: 60 };

  const svg = d3
    .select("#comparison-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x0 = d3
    .scaleBand()
    .domain(data.map((d) => d.label))
    .range([margin.left, width - margin.right])
    .paddingInner(0.2);

  const x1 = d3
    .scaleBand()
    .domain([club1, club2])
    .range([0, x0.bandwidth()])
    .padding(0.05);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => Math.max(d.value1, d.value2))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const color = d3
    .scaleOrdinal()
    .domain([club1, club2])
    .range(["#3498db", "#e67e22"]);

  svg
    .append("g")
    .selectAll("g")
    .data(data)
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(${x0(d.label)},0)`)
    .selectAll("rect")
    .data((d) => [
      { key: club1, value: d.value1 },
      { key: club2, value: d.value2 },
    ])
    .enter()
    .append("rect")
    .attr("x", (d) => x1(d.key))
    .attr("y", y(0))
    .attr("width", x1.bandwidth())
    .attr("height", 0)
    .attr("fill", (d) => color(d.key))
    .transition()
    .duration(1000)
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => height - margin.bottom - y(d.value));

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-45)")
    .style("font-size", "12px");

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .style("font-size", "12px");

  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr(
      "transform",
      `translate(${width - margin.right + 10}, ${margin.top})`
    );

  const legendItems = [club1, club2];
  legend
    .selectAll(".legend-item")
    .data(legendItems)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`)
    .each(function (d) {
      const g = d3.select(this);
      g.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(d));
      g.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .attr("dy", ".35em")
        .text(d)
        .style("font-size", "12px")
        .style("fill", "#333");
    });
}

function showClubInfo(d) {
  console.log("Kliknut klub:", d.club);
  const scorers = d.top_scorers.split(";");
  const goals = d.goals.split(";").map(Number);
  const maxGoalsIndex = goals.indexOf(Math.max(...goals));
  const topScorer = scorers[maxGoalsIndex];
  const topGoals = goals[maxGoalsIndex];
  const clubInfo = d3.select("#club-info");

  d3.select("#club-info").html(`
    <div class="club-card">
      <h2>${d.club}</h2>
      <p><strong>📍 Grad:</strong> ${d.city}, ${d.country}</p>
      <p><strong>🏆 Naslova prvaka:</strong> ${d.championships}</p>
      <p><strong>⭐ Liga prvaka:</strong> ${d.ucl_titles}</p>
      <p><strong>⚽ Najbolji strijelac:</strong> ${topScorer} (${topGoals} golova)</p>
    </div>
  `);

  clubInfo.classed("visible", false);
  void clubInfo.node().offsetHeight;

  clubInfo.classed("visible", true);

  d3.select("#charts").classed("visible", true);

  const barData = scorers.map((name, i) => ({
    scorer: name,
    goals: goals[i],
  }));
  drawPieChart([
    { label: "Domaća prvenstva", value: +d.championships },
    { label: "Liga prvaka", value: +d.ucl_titles },
  ]);
  drawBarChart(barData);

  const years = [2000, 2005, 2010, 2015, 2020, 2024];
  const lineData = barData.map((d, i) => ({
    name: d.scorer,
    values: years.map((year, index) => ({
      year,
      goals:
        i < goals.length
          ? Math.round((goals[i] / (years.length - 1)) * index)
          : 0,
    })),
  }));
  drawLineChartWithAnimation(lineData);
}

function showClubChartsOnly(d) {
  const scorers = d.top_scorers.split(";");
  const goals = d.goals.split(";").map(Number);

  const barData = scorers.map((name, i) => ({
    scorer: name,
    goals: goals[i],
  }));

  drawPieChart([
    { label: "Domaća prvenstva", value: +d.championships },
    { label: "Liga prvaka", value: +d.ucl_titles },
  ]);
  drawBarChart(barData);

  d3.csv("data/clubs.csv").then((yearlyData) => {
    const playerNames = scorers;
    const lineData = playerNames.map((name) => {
      const filtered = yearlyData
        .filter((row) => row.player === name)
        .map((row) => ({
          year: +row.year,
          goals: +row.goals,
        }));
      return {
        name: name,
        values: filtered,
      };
    });
    drawLineChartWithAnimation(lineData);
  });
}

// Crtanje pie chart-a
function drawPieChart(data) {
  d3.select("#pie-chart").selectAll("*").remove();
  const width = 300,
    height = 300,
    radius = Math.min(width, height) / 2;

  const svg = d3
    .select("#pie-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const color = d3.scaleOrdinal(["#6c5ce7", "#00b894"]);

  const pie = d3.pie().value((d) => d.value);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  svg
    .selectAll("path")
    .data(pie(data))
    .enter()
    .append("path")
    .attr("fill", (d, i) => color(i))
    .transition()
    .duration(1000)
    .attrTween("d", function (d) {
      const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return function (t) {
        return arc(i(t));
      };
    });

  svg
    .selectAll("text")
    .data(pie(data))
    .enter()
    .append("text")
    .transition()
    .delay(1000)
    .attr("transform", (d) => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .text((d) => d.data.label)
    .style("font-size", "12px");
}

// Crtanje bar chart-a – inspiracija iz: https://observablehq.com/@d3/bar-chart
function drawBarChart(data) {
  d3.select("#bar-chart").selectAll("*").remove();
  const width = 400,
    height = 300,
    margin = { top: 20, right: 20, bottom: 50, left: 50 };

  const svg = d3
    .select("#bar-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.scorer))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.goals)])
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal(d3.schemeSet2);
  // Dodavanje stupaca i animacija rasta visine
  svg
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.scorer))
    .attr("y", y(0))
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", (d, i) => color(i))
    .transition()
    .duration(1000)
    .attr("y", (d) => y(d.goals))
    .attr("height", (d) => height - margin.bottom - y(d.goals));

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));
}

// Crtanje line chart-a (više linija) – inspirirano primjerom: https://observablehq.com/@d3/multi-line-chart
function drawLineChartWithAnimation(datasets) {
  d3.select("#line-chart").selectAll("*").remove();
  const width = 450,
    height = 300,
    margin = { top: 20, right: 120, bottom: 60, left: 90 };

  const svg = d3
    .select("#line-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const allYears = [
    ...new Set(datasets.flatMap((d) => d.values.map((v) => v.year))),
  ];
  const allGoals = datasets.flatMap((d) => d.values.map((v) => v.goals));

  const x = d3
    .scaleLinear()
    .domain(d3.extent(allYears))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(allGoals)])
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal(d3.schemeSet2);

  const line = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.goals));

  const paths = svg
    .selectAll(".line")
    .data(datasets)
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", (d, i) => color(i))
    .attr("stroke-width", 2)
    .attr("d", (d) => line(d.values))
    .attr("stroke-dasharray", function () {
      return this.getTotalLength(); // efekt crtanja linije
    })
    .attr("stroke-dashoffset", function () {
      return this.getTotalLength();
    })
    .transition()
    .duration(1500)
    .ease(d3.easeCubic)
    .attr("stroke-dashoffset", 0); // animirano iscrtavanje linije

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(allYears.length));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  const legend = svg
    .selectAll(".legend")
    .data(datasets)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr(
      "transform",
      (d, i) => `translate(${width - 100},${height - 130 + i * 20})`
    );

  legend
    .append("rect")
    .attr("x", 0)
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", (d, i) => color(i));

  legend
    .append("text")
    .attr("x", 18)
    .attr("y", 10)
    .text((d) => d.name)
    .style("font-size", "12px");
}

function drawFilterChart(data, type) {
  d3.select("#filter-chart").selectAll("*").remove();

  const width = 500;
  const height = 300;
  const margin = { top: 40, right: 20, bottom: 70, left: 60 };

  const svg = d3
    .select("#filter-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.label))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal(d3.schemeSet2);

  svg
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.label))
    .attr("y", y(0))
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", (d, i) => color(i))
    .transition()
    .duration(800)
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => height - margin.bottom - y(d.value));

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Ako je type == klubovi, dodaj logo iznad stupaca
  if (type === "club") {
    const clubLogos = {
      "Real Madrid":
        "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
      Barcelona:
        "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
      "Man City":
        "https://upload.wikimedia.org/wikipedia/sco/e/eb/Manchester_City_FC_badge.svg",
      "Bayern Munich":
        "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
      Juventus:
        "https://cdn.freebiesupply.com/images/thumbs/2x/juventus-logo.png",
      Arsenal: "https://upload.wikimedia.org/wikipedia/sco/5/53/Arsenal_FC.svg",
      PSG: "https://upload.wikimedia.org/wikipedia/sco/a/a7/Paris_Saint-Germain_F.C..svg",
      "Inter Milan":
        "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg",
      Liverpool:
        "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
      Ajax: "https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg",
      Lyon: "https://upload.wikimedia.org/wikipedia/hr/1/1c/Olympique_Lyonnais_logo.svg",
      "Borussia Dortmund":
        "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
      Marseille:
        "https://upload.wikimedia.org/wikipedia/en/6/63/Olympique_Marseille_logo.svg",
      Napoli:
        "https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Napoli.svg",
      "Bayer Leverkusen":
        "https://upload.wikimedia.org/wikipedia/en/e/e6/Bayer_04_Leverkusen_logo.svg",
      Roma: "https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg",
    };

    // Filter bar chart – dodatak logotipa kluba iznad stupaca (prilagođeni prikaz)
    svg
      .selectAll("image")
      .data(data)
      .enter()
      .append("image")
      .attr("xlink:href", (d) => clubLogos[d.label])
      .attr("x", (d) => x(d.label) + x.bandwidth() / 2 - 12)
      .attr("y", (d) => y(d.value) - 30)
      .attr("width", 24)
      .attr("height", 24);
  }
}

document.addEventListener("click", function (event) {
  const clubInfo = document.getElementById("club-info");
  const isVisible = clubInfo.classList.contains("visible");

  if (
    isVisible &&
    !clubInfo.contains(event.target) &&
    !event.target.closest(".club-logo")
  ) {
    clubInfo.classList.remove("visible");
  }
});
