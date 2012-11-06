var HistogramView = Backbone.View.extend({

  initialize: function() {
    // listen for model changes
    this.model.on('change:data', this.render, this);

    // init a d3 histogram
    d3.select(this.options.target)
      .append('svg')
      .attr('width', this.options.w)
      .attr('height', this.options.h);
  },

  // TODO implement @mbostock's margins (http://bl.ocks.org/3019563)
  render: function(){
    var vis         = d3.select(this.options.target).select('svg')
      , app         = this.model.get('app')
      , data        = this.model.get('data')
      , range       = this.options.range
      , attribute   = this.model.get('attribute')
      , view        = this
      , w           = this.options.w
      , h           = this.options.h
      , barwidth    = this.options.barwidth
      , title       = this.options.title
      , that        = this
      , numBins     = data.length
      , barspace    = Math.floor( w/data.length - barwidth )
      , rect        = vis.selectAll('.bar')
      , rectLabels  = vis.selectAll('.histogramLabel')
      , titleLabel  = vis.selectAll('.histogramtitle');

    // y scale for bars
    var y = d3.scale.linear()
              .domain([0, d3.max(data, function(d) { return d.length; })])
              .range([5, h-40]);

    // enter
    rect.data(data, function(d) { return d.length; })
        .enter().append('rect')
        .classed('bar', true)
        .on('click', function() { barClick(this); })
        .on('mouseover', function() { barMouseOver(this); })
        .attr('width', barwidth)
        .attr('height', function(d, i) { return y(d.length); })
        .attr('x', function(d, i) { return i*(barwidth+barspace); })
        .attr('y', function(d, i) { return h - 45 - y(d.length); });

    // update

    //x-axis labels for bars
    rectLabels.data(data, function(d) { return d.label; })
      .enter().append('text')
      .attr('class', 'histogramlabel')
      .attr('x', function(d, i) { return i*(barwidth+barspace) + barwidth/2; })
      .attr('y', h - 35)
      .attr('text-anchor', 'middle')
      .text( function(d) { return d.label; });

    //title
    titleLabel.data([title])
      .enter().append('text')
      .attr('class', 'histogramtitle')
      .attr('x', w / 2 )
      .attr('y', h - 20)
      .attr('text-anchor', 'middle')
      .text(title);


    // on bar mouseover, emit the chart title and label of the selected
    var barMouseOver = function barMouseOver(d) {   
      var msg = {
        chart: title,
        label: d3.select(d).data()[0].label
      };
      that.options.app.trigger('histogramMouseover', msg);
    };

    // on bar click, emit the chart title, label, and bar size of the selected
    var barClick = function barClick(d) {   

      // get the data for the clicked element
      var data = d3.select(d).data()[0];

      // prepare the message to send to the app
      var msg = {
        label: data.label,
        length: data.length,
        chart: that.options.title
      };

      // trigger an event and attach the message
      that.options.app.trigger('histogramClick', msg);

      // style all bars to remove any previous clicks
      d3.selectAll('.bar').style('fill', 'steelblue');

      // style the clicked bar to be brighter
      d3.select(d).style('fill', function() {
        return d3.hsl( d3.select(this).style('fill') ).brighter().toString();
      });

    };
  }
});
