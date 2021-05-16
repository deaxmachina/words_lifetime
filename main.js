//////////////////////////////////////////////////////////////////////
////////////////////// Vocabulary Graph //////////////////////////////
//////////////////////////////////////////////////////////////////////

const totalVocab = 100;
const data = Array.from({ length: totalVocab }, (_, i) => ({value: i, r:15}))

const widthSVGVocab = 400;
const heightSVGVocab = 400;

const svgVocabulary = d3.select("#vocabulary-graph-wrapper")
  .append("svg")
  .attr("width", widthSVGVocab)
  .attr("height", heightSVGVocab)
  .style("background-color", 'plum')


const circlesG = svgVocabulary.append("g")
  .attr("transform", `translate(${widthSVGVocab/2}, ${heightSVGVocab/2})`)
const circles  = circlesG
  .selectAll(".my-circle")
  .data(data)
  .join("circle")
  .classed('my-circle', true)
    .attr("fill", 'maroon')
    .attr("fill-opacity", 0.5)
    .attr("stroke", 'white')
    .attr("stroke-width", 0)
    .attr("r", d => d.r)

function tick() { circles.attr("cx", d => d.x).attr("cy", d => d.y); }
const simulation = d3.forceSimulation(data)
    .on("tick", tick)
    .force("collide", d3.forceCollide().radius(d => d.r))
