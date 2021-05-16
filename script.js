
gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(TextPlugin);
// using a path to draw a book 
// https://www.flaticon.com/free-icon/book-of-black-cover-closed_32354
const path1 = `
      M94.924,366.674h312.874c0.958,0,1.886-0.136,2.778-0.349c0.071,0,0.13,0.012,0.201,0.012
      c6.679,0,12.105-5.42,12.105-12.104V12.105C422.883,5.423,417.456,0,410.777,0h-2.955H114.284H94.941
      c-32.22,0-58.428,26.214-58.428,58.425c0,0.432,0.085,0.842,0.127,1.259c-0.042,29.755-0.411,303.166-0.042,339.109
      c-0.023,0.703-0.109,1.389-0.109,2.099c0,30.973,24.252,56.329,54.757,58.245c0.612,0.094,1.212,0.183,1.847,0.183h317.683
      c6.679,0,12.105-5.42,12.105-12.105v-45.565c0-6.68-5.427-12.105-12.105-12.105s-12.105,5.426-12.105,12.105v33.461H94.924
      c-18.395,0-33.411-14.605-34.149-32.817c0.018-0.325,0.077-0.632,0.071-0.963c-0.012-0.532-0.03-1.359-0.042-2.459
      C61.862,380.948,76.739,366.674,94.924,366.674z M103.178,58.425c0-6.682,5.423-12.105,12.105-12.105s12.105,5.423,12.105,12.105
      V304.31c0,6.679-5.423,12.105-12.105,12.105s-12.105-5.427-12.105-12.105V58.425z
`

// various number we will use 
const numWordsPerHPBook = 154881;

const avgLifeExpectacy = 79;
const avgWordsPerMin = 135; // between 120 and 150 so we take the avg 
const hoursSpeakPerDay = 1; // take low estimate of 1 hour 
const avgWordsPerYear = 365*hoursSpeakPerDay*60*avgWordsPerMin; // assuming 1 hour of speaking per day
const booksPerYear = Math.round(avgWordsPerYear / numWordsPerHPBook);
const totalNumBooks = Math.round(((avgLifeExpectacy - 1) * booksPerYear));
console.log("total number of books", totalNumBooks)

const numHPbooksByAge6 = booksPerYear * 5;
const avgWordsSpokenByAge6 = numHPbooksByAge6 * numWordsPerHPBook;
const numHPbooksByAge18 = booksPerYear * 17;
const avgWordsSpokenByAge18 = numHPbooksByAge18 * numWordsPerHPBook;
const avgWordsSpokenLifetime = (avgLifeExpectacy - 1) * avgWordsPerYear;


///////////////////////////////////////////////////////////////////////
///////////////////////////// Graphs //////////////////////////////////
///////////////////////////////////////////////////////////////////////
// Set up the graphs in D3 and we'll animate them later with GSAP

////////////////////////////////////////////
////////////// Containers //////////////////
////////////////////////////////////////////

const width = 760;
const height = 760;
const purpleColour = "#565264"
const lightBlueColour= "#70a0af"
const lightColour = "#e8e9ed"
const darkColour = "#1e1d25"

/// Draw the SVG ///
const svg = d3.select("svg")
  .attr("width", width)
  .attr("height", height)
  .style("background", lightColour)
  .style("overflow", 'visible')

/// wrapper group for the whole spiral ///
const gSpiral = svg.append("g")
  .classed("spiral-wrapper-g", true)
  .attr("transform", `translate(${width/2}, ${height/2})`)

/// wrapper group for the whole wordcloud ///
const gWords = svg.append("g").classed("words-wrapper-g", true)

/// data - array with as many elements as the total number of books ///
const data = Array.from({ length: totalNumBooks }, (_, i) => ({value: i, number: i*2}))

/// variables ///
// good idea to have the layers depend on the data -> more data, more layers
const innerRadius = 20; // how big the empty space in the middle of spiral should be 
const maxRadius = height/2 - 30;
const layers = data.length/100; // how many concentric circles that make up the spiral 
const precision = 7; // how many points on the circle 
const rectHeight = 4;

////////////////////////////////////////////
///////////////// Spiral ///////////////////
////////////////////////////////////////////
// ["#C07E9A", "#805880", "#6C6A94", "#191A3C"]
const barsColourScale = chroma.scale(["#70a0af", "#706993"]).mode('rgb').colors(data.length)

// create the spiral path - this is so that we can position elements along the path later
const spiral = gSpiral.append("path")
  .attr("id", 'axis')
  .attr("fill", "none")
  .attr("stroke-width", 0) // if you want the underlying spiral to be visiable
  .attr("d", axisSpiral(2 * precision * layers + 1)) // add + 1 to layers for complete layer

function axisSpiral(length) {
  return d3.lineRadial()
    //.curve(d3.curveCatmullRomOpen)
    .angle((d, i) => Math.PI / precision * i)
    .radius((d, i) => i * (maxRadius - innerRadius) / length + innerRadius)({ length })
}

// get length of the spiral path 
const spiralLength = spiral.node().getTotalLength();

// use the spiral length to compute the width of the 'bars' - i.e. the shape that defined each section
const barWidth = spiralLength / data.length / 2 // divide by a small number to have them with some gaps in between

// map each element to position on the path string for spital
const pathScale = d3.scaleLinear()
  .domain([0, data.length])
  .range([0, spiralLength]);

// compute the position of each 'bar' based on the (x, y) coords along the path string
// and also the angle that we want to rotate by if we want to align the bar with the spiral path
const barsData = data.map((d, i) => {
  const value = d.value
  const pointPostion = pathScale(i);
  const p1 = spiral.node().getPointAtLength(pointPostion);
  const p2 = spiral.node().getPointAtLength(pointPostion - barWidth)
  return {
      value: value,
      t: pointPostion,
      x: p1.x,
      y: p1.y,
      y0: p1.y,
      yr: p1.y, // rotate y
      angle: Math.atan2(p2.y, p2.x) * 180 / Math.PI - 90
  };
});

/// Draw the elements (books) along the spiral ///
const bars = gSpiral.selectAll(".bar")
  .data(barsData)
  .join("path")
    .attr("class", "bar")
    .attr("fill", (d, i) => barsColourScale[i])   
    .attr("stroke", (d, i) => barsColourScale[i])    
    .attr("stroke-width", 25)    // 30 
    .attr("d", path1)
    .attr("transform", d => `scale(${0.035})translate(${d.x*30},${d.y*30})rotate(${d.angle+180},${d.x},${d.yr})`) // 0.035, 30, 30
    .attr("fill-opacity", 0) 
    .attr("stroke-opacity", 0) 


////////////////////////////////////////////
/////////////// Wordcloud //////////////////
////////////////////////////////////////////
const wordsForWordcloud = ["mommy", "daddy", "ball", "bye", "hi", "no", "dog", "baby", "woof woof", "banana"];
const wordcloud = gWords
  .selectAll(".word")
  .data(wordsForWordcloud)
  .join("text")
  .classed("word", true)
    .attr("x", (d, i) => width/2)
    .attr("y", (d, i) => 50*(i) + 150)
    .attr("opacity", 0)
    .text(d => d)



///////////////////////////////////////////////////////////////////////
//////////////////////////// Animation ////////////////////////////////
///////////////////////////////////////////////////////////////////////

// This pins the SVG chart wrapper when it hits the center of the viewport the first time we start scrolling 
// and then releases the pin when the final textbox meets the bottom of the chart 
// We use a function to define the end point to line up the bottom of the last text box with the bottom of the chart 
// and make sure to bring it up by amountToScrollOnScrub since this is the artificial space we add so that we can scrub scroll 
// on the last step 

// this is how long the scroll on scrub will happen at the end
const amountToScrollOnScrub = 4000;

ScrollTrigger.create({
  trigger: '#chart-wrapper',
  endTrigger: '#step-5',
  start: 'center center',
  //end: 'bottom bottom',
  end: () => {
      const height = window.innerHeight;
      const chartHeight = document.querySelector('#chart-wrapper').offsetHeight;
      return `bottom ${chartHeight + (height - chartHeight) / 2 - amountToScrollOnScrub }px `
  },
  pin: true,
  pinSpacing: false,
  markers: false,
  id: 'chart-pin'
});


////////////////////////////////////////////
//////////////// Step 1 ////////////////////
////////////////////////////////////////////
// First we enter the word cloud 
gsap.to('.word', {
  // the animation is triggered via a scroll trigger
  scrollTrigger: {
    trigger: '#step-1', // when the step-1 div's top
    start: 'top center', // hits the center of the viewport 
    toggleActions: 'play complete none reverse', // this allows us to reverse the animation when we hit the same spot but scrolling up
    markers: false,
    id: 'first-box',
    //scrub: true,
  },
  attr: { opacity: 1 }, // make the words appear
  //duration: 0.5,
  ease: 'power.3.out',
  stagger: { amount: 1 } // total amount of time the scrolling should take 
});

////////////////////////////////////////////
//////////////// Step 2 ////////////////////
////////////////////////////////////////////
// We select just the bars that we want to 'appear' in the graph on this step
const barsToAnimateStep2 = gsap.utils.toArray('.bar').slice(0, numHPbooksByAge6)
gsap.to(barsToAnimateStep2, {
  // the animation is triggered via a scroll trigger
  scrollTrigger: {
    trigger: '#step-2', // when the step-1 div's top
    start: 'top center', // hits the center of the viewport 
    toggleActions: 'play complete none reverse', // this allows us to reverse the animation when we hit the same spot but scrolling up
    markers: false,
    id: 'second-box',
    //scrub: true,
  },
  attr: { 
    "stroke-opacity": 1,
    "fill-opacity": 0.7
  },
  duration: 0.5,
  ease: 'power.3.out',
  stagger: { amount: 1 } 
});

// And we make the wordcloud disappear - much quicker than the spiral is drawn in their place 
gsap.to('.word', {
  // the animation is triggered via a scroll trigger
  scrollTrigger: {
    trigger: '#step-2', // when the step-1 div's top
    start: 'top center', // hits the center of the viewport 
    toggleActions: 'play complete none reverse', // this allows us to reverse the animation when we hit the same spot but scrolling up
    markers: false,
  },
  attr: { opacity: 0 }, // make them fade away 
  duration: 0.3,
  ease: 'power.3.out',
  stagger: { amount: 0.5 } // faster than the spiral bars come in 
});

////////////////////////////////////////////
//////////////// Step 3 ////////////////////
////////////////////////////////////////////
const barsToAnimateStep3 = gsap.utils.toArray('.bar').slice(numHPbooksByAge6, numHPbooksByAge18)
gsap.to(barsToAnimateStep3, {
  // the animation is triggered via a scroll trigger
  scrollTrigger: {
    trigger: '#step-3', // when the step-1 div's top
    start: 'top center', // hits the center of the viewport 
    toggleActions: 'play complete none reverse', // this allows us to reverse the animation when we hit the same spot but scrolling up
    markers: false,
    id: 'third-box',
    //scrub: true,
  },
  attr: { 
    "stroke-opacity": 1,
    "fill-opacity": 0.7
  },
  duration: 0.5,
  ease: 'power.3.out',
  stagger: { amount: 1 } 
});

////////////////////////////////////////////
//////////////// Step 4 ////////////////////
////////////////////////////////////////////
// all the remaining bars to reveal 
const barsToAnimateStep4 = gsap.utils.toArray('.bar').slice(numHPbooksByAge18)
gsap.to(barsToAnimateStep4, {
  scrollTrigger: {
    trigger: '#step-4', 
    start: 'center center', 
    toggleActions: 'play complete none reverse', 
    markers: false,
    id: 'forth-box',
    scrub: true,
    pin: true,
    end: `+=${amountToScrollOnScrub}px`, 
  },
  attr: { 
    "stroke-opacity": 1,
    "fill-opacity": 0.5
  },
  duration: 0.5,
  ease: 'power.3.out',
  stagger: { amount: 2 } 
});


// counter for number of words uttered 
// update the numbers as counters 
let startCount = avgWordsSpokenByAge18;
let num = {var:startCount};
const endCount = avgWordsSpokenLifetime;

gsap.timeline({
  scrollTrigger: {
    trigger: '#step-4', 
    start: 'center center', 
    toggleActions: 'play complete none reverse', 
    markers: false,
    scrub: true,
    pin: true,
    end: `+=${amountToScrollOnScrub}px`, 
  },
  })
  .to(num, {var: endCount, duration: 5, ease:"none", onUpdate:changeNumber})
  .to({}, {duration:2})

const numbers = document.querySelector(".number-words")
function changeNumber() {
  numbers.innerHTML = d3.format(".2s")((num.var).toFixed())
}

// counter for age
// update the numbers as counters 
let startCountAge = 18;
let numAge = { var: startCountAge };
const endCountAge = avgLifeExpectacy;

gsap.timeline({
  scrollTrigger: {
    trigger: '#step-4', 
    start: 'center center', 
    toggleActions: 'play complete none reverse', 
    markers: false,
    scrub: true,
    pin: true,
    end: `+=${amountToScrollOnScrub}px`, 
  },
  })
  .to(numAge, {var: endCountAge, duration: 5, ease:"none", onUpdate:changeNumberAge})
  .to({}, {duration:2})

const numbersAge = document.querySelector(".age")
function changeNumberAge() {
  numbersAge.innerHTML = (numAge.var).toFixed()
}

///////////////////////////////
/// Simple title animation ////
///////////////////////////////
const anim = gsap.from('.speech-bubbles', {
  //height: 0,
  yPercent: -300,
  duration: 2,
  ease: 'power.3.out',
});

window.addEventListener('resize', () => { 
  anim.kill().restart().play();
});
