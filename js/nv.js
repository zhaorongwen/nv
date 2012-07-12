/*
 * nv.js
 *
 *
 * Here are the divs in nv.html:
 * - id="vis"
 * - id="options"
 * - id="edit"
 * - id="nessusinfo"
 * - id="histograms"
 */


// some tests for grabbing data from other websites
//$.get("http://codementum.org", function(data) {
//  var resp = $(data); // Now you can do whatever you want with it
//  $(".hero-unit", resp).appendTo("body");
//});

//$.get("http://www.nessus.org/plugins/index.php?view=single&id=42118/", function(data) {
//  var resp = $(data); // Now you can do whatever you want with it
//  $("#contentMain", resp).appendTo("#nessusinfo");
//});

//$.getJSON('http://www.panoramio.com/wapi/data/get_photos?v=1&key=dummykey&tag=test&offset=0&length=20&callback=?&minx=-30&miny=0&maxx=0&maxy=150', 
//    function(json) {
//      alert(json.photos[1].photoUrl);
//});

// colors
// http://colorbrewer2.org/index.php?type=sequential&scheme=Oranges&n=3
var nodeColor = d3.scale.linear()
    .domain([0.0, 10.0])
    .range([d3.hsl("#FEE6CE"), d3.hsl("#FDAE6B"), d3.hsl("#E6550D")]); // white-orange
    //.range(["hsl(62,100%,90%)", "hsl(228,30%,20%)"]); // yellow blue

var notSelected = d3.scale.linear()
    .domain([0.0, 10.0])
    .range([d3.hsl("#FFFFFF"), d3.hsl("#DCDCDC")]); // white-gray

// LabelMaps are used to find a label given a number (in initHistogram)
var vulntypeLabelMap = ["hole", "note", "port"];

// NumberMaps are used to find a number given a label (in drawHistogram)
var vulntypeNumberMap = d3.scale.ordinal()
      .domain(vulntypeLabelMap)
      .range([1,2,3]);

// globals
var margin = {top: 20, right: 0, bottom: 0, left: 0},
    width = 960,
    height = 500 - margin.top - margin.bottom,
    formatNumber = d3.format(",d"),
    transitioning;

// users can change this via buttons, which then redraws the treemap according to the new size metric
// cvss, value, criticality
var sizeOption = 'value';

// All the data!
var nbedata,
    all,
    byIP,
    byAny,
    byPort,
    byCVSS,
    byVulnID,
    byVulnType;

// crossfilter setup
function crossfilterInit(){
  // sets/resets our data
  nbedata = crossfilter();

  // dimensions/groups
  all = nbedata.groupAll(),
  byIP = nbedata.dimension(function(d) { return d.ip; }),
  byAny = nbedata.dimension(function(d) { return d; }),
  byPort = nbedata.dimension(function(d) { return d.port; }),
  byCVSS = nbedata.dimension(function(d) { return d.cvss; }),
  byVulnID = nbedata.dimension(function(d) { return d.vulnid; }),
  byVulnType = nbedata.dimension(function(d) { return d.vulntype; });
}

// treemap globals
var x,
    y,
    treemap,
    svg,
    grandparent;

function init() {

  d3.select("#options").append("button")
    .classed("btn btn-primary", true)
    .text("Severity")
    .on("click", function() { sizeOption = 'cvss'; redraw(); console.log("Severity was clicked"); });
  d3.select("#options").append("button")
    .classed("btn btn-primary", true)
    .text("Criticality")
    .on("click", function() { sizeOption = 'criticality'; redraw(); console.log("Criticality was clicked"); });
  d3.select("#options").append("button")
    .classed("btn btn-primary", true)
    .text("Counts")
    .on("click", function() { sizeOption = 'value'; redraw();  console.log("Counts was clicked"); });


  // initialize treemap
  initTreemap();

  // initialize histograms
  initHistogram("#histograms", 10, "cvssHistogram");
  initHistogram("#histograms", 3, "vulnTypeHistogram", vulntypeLabelMap);
  initHistogram("#histograms", 20, "top20NoteHistogram");
  initHistogram("#histograms", 20, "top20HoleHistogram");

  // load treemap data (sets nbedata which calls drawTreemap() after it loads)
  // this should be commented out when we receive data from the parser
  loadJSONData('../../data/testdata/testdata11.json');

  // test changes of data using timeouts
  //window.setTimeout(function() { loadJSONData('../../data/testdata/testdata6.json'); }, 3000);  
  //window.setTimeout(function() { loadJSONData('../../data/testdata/testdata7.json'); }, 10000);  
  
  // initialize nessus info area
  initNessusInfo();
}

// called after data load
function redraw() {
  drawTreemap();
  drawHistogram("#cvssHistogram", 10, "cvss");
  drawHistogram("#vulnTypeHistogram", 3, "vulntype", vulntypeNumberMap);
  drawHistogram("#top20NoteHistogram", 20, "vulnid", null, null, "note");
  drawHistogram("#top20HoleHistogram", 20, "vulnid", null, null, "hole");
  //drawHistogram(name, n, par, scale, binWidth, typeFilter) {
}


// treemap functions
function initTreemap(){
  
  x = d3.scale.linear()
      .domain([0, width])
      .range([0, width]);
  
  y = d3.scale.linear()
      .domain([0, height])
      .range([0, height]);
  
  treemap = d3.layout.treemap()
      .children(function(d, depth) { return depth ? null : d.values; })
      .sort(function(a, b) { return a.value - b.value; })
      .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
      .round(false);
  
  svg = d3.select("#vis").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.bottom + margin.top)
      .style("margin-left", -margin.left + "px")
      .style("margin.right", -margin.right + "px")
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .style("shape-rendering", "crispEdges");
  
  grandparent = svg.append("g")
      .attr("class", "grandparent");
  
  grandparent.append("rect")
      .attr("y", -margin.top)
      .attr("width", width)
      .attr("height", margin.top);
  
  grandparent.append("text")
      .attr("x", 6)
      .attr("y", 6 - margin.top)
      .attr("dy", ".75em");
}

function drawTreemap() {
  var root=d3.nest()
    .key(function(d) {return 'network name';})
    .key(function(d) {return d.group;})
    .key(function(d) {return d.ip;})
    .key(function(d) {return d.port;})
    .sortKeys(d3.ascending)
    .entries(byCVSS.top(Infinity)); // TODO lane make work with crossfilter (feed it objects)

  // free the root from its original array
  root = root[0];

  var nodes = [];

  initialize(root);
  accumulate(root);
  layout(root);
  display(root);

  function initialize(root) {
    root.x = root.y = 0;
    root.dx = width;
    root.dy = height;
    root.depth = 0;
  }

  // Aggregate the values for internal nodes. This is normally done by the
  // treemap layout, but not here because of our custom implementation.
  function accumulate(d) {
    nodes.push(d);

    d.cvss = accumulateCVSS(d);

    return d.values
      ? d.value = d.values.reduce(function(p, v) { return p + accumulate(v); }, 0)
      : d[sizeOption];
  }

  function accumulateCVSS(d){
    return d.values
      ? d.cvss = d.values.reduce(function(p, v) { return Math.max(p, accumulateCVSS(v)); }, 0)
      : d.cvss;
  }

  // Compute the treemap layout recursively such that each group of siblings
  // uses the same size (1×1) rather than the dimensions of the parent cell.
  // This optimizes the layout for the current zoom state. Note that a wrapper
  // object is created for the parent node for each group of siblings so that
  // the parent’s dimensions are not discarded as we recurse. Since each group
  // of sibling was laid out in 1×1, we must rescale to fit using absolute
  // coordinates. This lets us use a viewport to zoom.
  function layout(d) {
    if (d.values) {
      treemap.nodes({values: d.values});
      d.values.forEach(function(c) {
        c.x = d.x + c.x * d.dx;
        c.y = d.y + c.y * d.dy;
        c.dx *= d.dx;
        c.dy *= d.dy;
        c.parent = d;
        layout(c);
      });
    }
  }

  function display(d) {
    grandparent
      .datum(d.parent)
      .on("click", transition)
      .select("text")
      .text(name(d));

    var g1 = svg.insert("g", ".grandparent")
      .datum(d)
      .attr("class", "depth");

    var g = g1.selectAll("g")
      .data(d.values)
      .enter().append("g");

    //TODO - Lane - move to front
    g.filter(function(d) { return d.values; })
      .classed("children", true)
      .attr("id", function(d) { return "IP" + (d.key).replace(/\./g, ""); })
      .on("click", transition)
      .on("mouseover", function(d) {
          
          d3.select(this).select(".parent")
            .style("stroke", "black")
            .style("stroke-width", "2px");

      })
      .on("mouseout", function(d) {
      
          d3.select(this).select(".parent")
            .style("stroke", "")
            .style("stroke-width", "");

      });

    // NOTE: can move the .style here to rect() to color by cell
    g.selectAll(".child")
      .data(function(d) { return d.values || [d]; })
      .enter().append("rect")
      .attr("class", "child")
      .attr("clicked", "n")
      .style("fill", function(d) { 
        return nodeColor(d.cvss);
      })
    .call(rect);

    g.append("rect")
      .attr("class", "parent")
      .call(rect)
      .append("title")
      .text(function(d) { return formatNumber(d.value); });

    g.append("text")
      .attr("dy", ".75em")
      .text(function(d) { return d.key; })
      .classed("rectlabel", true)
      .call(text);

    function transition(d) {
      if (transitioning || !d) return;
      transitioning = true;

      var g2 = display(d),
          t1 = g1.transition().duration(1250),
          t2 = g2.transition().duration(1250);

      // Update the domain only after entering new elements.
      x.domain([d.x, d.x + d.dx]);
      y.domain([d.y, d.y + d.dy]);

      // Enable anti-aliasing during the transition.
      svg.style("shape-rendering", null);

      // Draw child nodes on top of parent nodes.
      svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

      // Fade-in entering text.
      g2.selectAll("text").style("fill-opacity", 0);

      // Transition to the new view.
      t1.selectAll("text").call(text).style("fill-opacity", 0);
      t2.selectAll("text").call(text).style("fill-opacity", 1);
      t1.selectAll("rect").call(rect);
      t2.selectAll("rect").call(rect);

      // Remove the old node when the transition is finished.
      t1.remove().each("end", function() {
        svg.style("shape-rendering", "crispEdges");
        transitioning = false;
      });
    }

    return g;
  }

  function text(text) {
    text.attr("x", function(d) { return x(d.x) + 6; })
      .attr("y", function(d) { return y(d.y) + 6; });
  }

  function rect(rect) {
    rect.attr("x", function(d) { return x(d.x); })
      .attr("y", function(d) { return y(d.y); })
      .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
      .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); })
  }

  function name(d) {
    return d.parent
      ? name(d.parent) + "_" + d.key
      : d.key;
  }
}

// function that initalizes one histogram
//sel       -> d3 selection
//n         -> number of bins
//name      -> name of histogram (id)
//labelmap  -> mapping numbers to labels
//binWidth  -> width of each bar
function initHistogram(sel, n, name, labelmap, binWidth) {
  
  binWidth = binWidth ? binWidth : 20;  //ternary operator to check if binWidth was defined and set binWidth to a default number if it wasn't

  var histoW = binWidth*n,
      histoH = 200;

  var nothing = [];

  for ( var i = 0; i < n; i++) nothing[i] = 0;
  
  var hist = d3.select(sel)
               .append("div")
               .attr("id", name)
               .attr("class", "histogram")
               .append("svg")
               .attr("width", histoW)
               .attr("height", histoH);

  hist.selectAll("rect")
      .data(nothing)
      .enter().append("rect")
      .attr("x", function(d, i) { return (histoW / n)*i - 0.5; })
      .attr("width", histoW / n)
      .attr("y", histoH - n)
      .attr("height", 0.05*histoH)
      .style("fill", "purple")
      .style("stroke", "white");

  // labels
  var labels = d3.range(n);
  
  //x-axis
  hist.selectAll("text#histogramlabel")
      .data(labels)
      .enter().append("text")
      .attr("class", "histogramlabel")
      .attr("x", function(d, i) { return ( (histoW / n)*i ); })
      .attr("y", histoH - 11)
      .text( function(d) { 
        return labelmap ? labelmap[d] : d;
      });

  //title
  hist.append("text")
      .attr("class", "histogramtitle")
      .attr("x", histoW / 2 )
      .attr("y", histoH )
      .text(name);
}

// function that draws one histogram
//name  -> name of histogram (id)
//n     -> number of bins
//par   -> parameter in data being used
//binWidth  -> width of each bar
function drawHistogram(name, n, par, scale, binWidth, typeFilter) {

  binWidth = binWidth ? binWidth : 20;  //ternary operator to check if binWidth was defined and set binWidth to a default number if it wasn't

  var histoW = binWidth*n,
      histoH = 200;

  // if typeFilter defined, filter
  if(typeFilter){
    byVulnType.filter(typeFilter);
  }
  //create histogram
  var hist = d3.layout.histogram()
              .bins(n)
              .range([1, n])
              .value(function(d,i) { 
                return scale ? scale(d[par]) : d[par];
              })
              (byAny.top(Infinity));

  // if typeFilter defined, remove filter and sort/reverse array (descending order for top 20)
  if(typeFilter){
    byVulnType.filterAll();
    hist = hist.sort().reverse();
  }

  //set domain for data
  var max = d3.max(hist, function(d, i) { return d.length; });
  var hScale = d3.scale.linear()
                  .domain([0,  max])
                  .range([0, histoH - 50]);

  //TODO - Evan - add histogram interation w/treemap
  d3.select(name)
    .data(hist)
    .on("click", function(d) { 

        //label the clicked rectangles as "y"
        for ( var i = 0; i < d.length; i++) {
            
            d3.select("#vis")
              .select(".depth")
              .select("#IP" + (d[i].ip).replace(/\./g, ""))
              .selectAll(".child")
              .attr("clicked", "y");

        }

        //gray out all rectangles who have clicked set as "n"
        d3.select("#vis")
          .select(".depth")
          .selectAll(".child")
          .filter(function() {
              if ( d3.select(this).attr("clicked") === "n") { return this; }
              else return null;
          })
          .style("fill", function(d) {
              return notSelected(d.values[0].cvss);
          });

    })
    .transition()
      .duration(1000)
      .attr("y", function(d) { return histoH - hScale(d.length) - 20; })
      .attr("height", function(d) { return hScale(d.length); });

  // if the data in the hist is a vulnid, change labels to corresponding vulnids
  if(typeFilter){
    d3.select(name).selectAll("text.histogramlabel")
      .data(hist)
      .text(function(d) { return d[0].vulnid; });
  }

  d3.select(name)
    .append("text")
    .text("max: "+max);
}

// initialize our nessus info area with labels
function initNessusInfo(){
  var nessusInfoLabels = ['title', 'overview', 'synopsis', 'description', 'seealso', 'solution', 'riskfactor'];
  var div = d3.select('#nessusinfo');

  var nessussections = div.selectAll('.nessusinfosection')
    .data(nessusInfoLabels, function(d) { return d; })
    .enter().append('div')
    .classed('.nessusinfosection', true)
    .attr('id', function(d) { return "nessus_"+d; });

  nessussections.append('span')
    .classed('nessusinfotitle', true)
    .text(function(d) { return d; });

  // this p later modified by the setNessusIDData function
  nessussections.append('p');

  // quick test of function below
  var testdata = [
    {key:"title", text:"3Com HiPer Access Router Card (HiperARC) IAC Packet Flood DoS"},
    {key:"overview", text:"This script is Copyright (C) 1999-2011 Tenable Network Security, Inc."
        + "<br />" + "Family  Denial of Service"
        + "<br />" + "Nessus Plugin ID  10108 (hyperbomb.nasl)"
        + "<br />" + "Bugtraq ID"  
        + "<br />" + "CVE ID  CVE-1999-1336"},
    {key:"synopsis", text:"The remote host is vulnerable to a denial of service attack."},
    {key:"description", text:"It was possible to reboot the remote host (likely a HyperARC router) by sending it a high volume of IACs."
      + "An attacker may use this flaw to shut down your internet connection."},
    {key:"seealso", text:"http://marc.info/?l=bugtraq&m=93492615408725&w=2"
      + "<br />" + "http://marc.info/?l=bugtraq&m=93458364903256&w=2"},
    {key:"solution", text:"Add a telnet access list to your Hyperarc router. If the remote system is not a Hyperarc router, then contact your vendor for a patch."},
    {key:"riskfactor", text:"(CVSS2#AV:N/AC:L/Au:N/C:N/I:N/A:P)"}
  ];

  setNessusIDData(testdata);
}

// replaces the current dataset and calls redraw
function setNBEData(dataset){
  crossfilterInit();
  nbedata.add(dataset);
  // test crossfilter here
  console.log(nbedata.size());
  //  byCVSS.filter([2.0, 7.0]);
  console.log(byAny.top(Infinity));
  //  byCVSS.filterAll();

  redraw();
}

// updates the nessus data by id
// TODO Lane throw this on stackoverflow to see if the $.each can be avoided
function setNessusIDData(iddata){
  var div = d3.select('#nessusinfo');

  var enter = div.selectAll('.nessusinfosection')
    .data(iddata, function(d) { return d.key; })
    .enter();

  $.each(enter[0], function(i, v) { 
    var key = v.__data__.key;
    var text = v.__data__.text;
    console.log(key); 
    d3.select('#nessus_'+key).select('p').html(text);
  });
}

function loadJSONData(file){
  // if file isn't .json file, load a default
  if(file.indexOf('json') === -1){
    console.log('invalid file named, reverting to a default');
    file = 'data/testdata/testdata10.json';
  }

  // Load data and set to nbedata global
  d3.json(file, function(data) {
    setNBEData(data);
  });
}

var groupList = [];

function handleGroupAdd(){
  //TODO make sure each IP is only in one group(?)
  //TODO should really be able to remove groups also ...
  var start = $("#ipStart").val();
  var end = $("#ipEnd").val();
  var groupName = $("#groupName").val();
  var weight = $("#defaultWeight").val();
  var newGroup = {"start":start, "end":end, "groupName":groupName, "weight":weight};
  groupList.push(newGroup);
  console.log("added group: " + JSON.stringify(newGroup));
  console.log("group list now contains: " + JSON.stringify(groupList));
  updateCurrentGroupTable();
}

function handleDataPageAdd(){
  console.log("Data page add button");
}

function handleDataTab(){
  console.log("Data tab active");
}

function handleVisTab(){
  console.log("Vis tab active");
}

function handleGroupsTab(){
  console.log("Groups tab active");
  updateCurrentGroupTable();
}

function updateCurrentGroupTable(){
  var nbeText = $("#nbeFile1").val();
  var eventList = parseNBEFile( nbeText );

  //build default group list
  console.log("event list is " + JSON.stringify(eventList));
  var ips = findIPsInList(eventList);
  //console.log("have these IPs: " + JSON.stringify(ips));

  //add to the default group.
  //NOTE we are building this list of groups:ips, instead of the two seperate lists we already have, so that all machines in a group are next to each other in the table.
  groups = {};
  for( var i=0; i < ips.length; i++ ){
    var groupName = findGroupName(ips[i]);
    var weight = 1; //default
    for(var j=0; j<groupList.length; j++){
      if(groupList[j].groupName === groupName){
        weight = groupList[j].weight;
      }
    }
    var entry = {"ip": ips[i], "weight": weight}
    console.log("found that ip " + ips[i] + " is in group " + groupName);
    if( !groups[groupName] ){
      groups[groupName] = [];
    }
    groups[groupName].push(entry);
  }

  //console.log("current group list is: " + JSON.stringify(groups) );

  //display the (default) groups and weights for all machines.
  buildTable(groups);

  //add group name to item in crossfilter
  eventList = addGroupInfoToData(groups, eventList)

  setNBEData(eventList);
}

function findIPsInList(eventList){
  var ips = {}; //making a fake set here.
  for( var i=0; i < eventList.length; i++ ){
    ips[eventList[i].ip] = true;
  }
  ips = Object.keys(ips); //only need to keep this
  return ips;
}

function findGroupName(ip){
  var testAddr = ip.split('.')
  if( testAddr.length !== 4){
    throw "address of " + groupList[i].end + " is invalid";
  }

  function isAfter(start, test){ //after or equal will return true
    for(var i=0; i<4; i++){
      if(parseInt(start[i]) > parseInt(test[i])){
        return false;
      }
    }
    return true;
  }

  function isBefore(end, test){ //before or equal
    return isAfter(test, end);
  }

  //grouplist contains a list of {start, end, groupName, weight}
  for(var i=0; i<groupList.length; i++){
    var start = groupList[i].start.split('.')
    if( start.length !== 4){
      throw "start address of " + groupList[i].start + " is invalid";
    }
    var end = groupList[i].end.split('.')
    if( end.length !== 4){
      throw "end address of " + groupList[i].end + " is invalid";
    }
    console.log(groupList[i].groupName + ": isAfter(" + groupList[i].start + ", " + ip + ") returned " + isAfter(start, testAddr) );
    console.log(groupList[i].groupName + ": isBefore(" + groupList[i].end  + ", " + ip + ") returned " + isBefore(end, testAddr) );
    if( isAfter(start, testAddr) && isBefore(end, testAddr) ){
      return groupList[i].groupName;
    }
  }
  return "none"; //not found; "none" is the default label for table.
}

function addGroupInfoToData(groups, eventList){
  var events = [];
  var ips = {}; //make a map of ip:{group, weight}
  var groupNames = Object.keys(groups);
  for( var j=0; j < groupNames.length; j++ ){
    var machines = groups[groupNames[j]];
    for( var i=0; i < machines.length; i++ ){
      ips[machines[i]["ip"]] = {"group": groupNames[j], "weight": machines[i]["weight"]}
    }
  }

  for( var i=0; i < eventList.length; i++ ){
    events.push(eventList[i])
    events[i].group  = ips[eventList[i].ip].group
    events[i].weight = ips[eventList[i].ip].weight
  }
  return events;
}

function buildTable(groups){
  $('#currentGroupTable').select('tbody').html("");
  var weightSelector, row;
  var groupNames = Object.keys(groups);
  for( var j=0; j < groupNames.length; j++ ){
    var machines = groups[groupNames[j]];
    for( var i=0; i < machines.length; i++ ){
      weightSelector = '<select class="weightSelect" id="weightSelect' + machines[i]["ip"].split('.').join('_') + '"';
      weightSelector += '><option value="1">1 (lowest)</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10 (highest)</option></select>';
      row = '<tr>';
      row += '<td>'+ groupNames[j] +'</td><td>'+ machines[i]["ip"] +'</td>';
      row += '<td>'+ weightSelector +'</td>';
      row += '</tr>';
      $('#currentGroupTable').select('tbody').append(row);
      $('#weightSelect' + machines[i]["ip"].split('.').join('_') ).children().eq(machines[i]["weight"]-1).attr("selected","selected");
      //console.log( $('#weightSelect' + machines[i]["ip"].split('.').join('_') ).select('option').eq(machines[i]["weight"]-1).html() );
    }
  }
}


// initialization
$(document).ready(function () {
  // set up needed event listeners, etc.
  $('#addGroupBtn').bind('click', function(event) {
    handleGroupAdd();
  });
  $('#dataTabLink').bind('click', function(event) {
    handleDataTab();
  });
  $('#groupsTabLink').bind('click', function(event) {
    handleGroupsTab();
  });
  $('#visTabLink').bind('click', function(event) {
    handleVisTab();
  });

  // start the vis
  init();
});

