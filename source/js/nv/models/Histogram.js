var Histogram = Backbone.Model.extend({
  initialize: function() {
    this.on('change:limit', this.updateData, this);

    // respond to app-level events
    this.get('datasource').on('dataset updated', this.updateData, this);
  },

  updateData: function(){
    var filterOptions   = this.get('filterOptions')
      , attribute       = filterOptions.attribute
      , bins            = this.get('bins') || ""
      , range           = this.get('range') || ""
      , datamap         = this.get('datamap') || "";

    var rawData = this.get('datasource').getData(filterOptions);

    // compute histogram based on attribute value
    var histogram = d3.layout.histogram()
        .value(function(d) { 
          // if we have a datamap, use it
          return datamap ? datamap(d[attribute]) : d[attribute]; 
        });

    // if bins specified, set them
    if( bins )
      histogram.bins(bins);
  
    // if bins specified, set them
    if( range )
      histogram.range(range);

    // compute the histogram
    var data = histogram(rawData); 

    // if a limit is specified, sort and cut the data
    if( this.get('limit') ){

      // sort the data by length (ascending) and reverse
      data = _.sortBy(data, function(d){ return d.length; }).reverse();

      // cut off after limit
      if ( data.length > this.get('limit') )
        data = _.first(data, this.get('limit'));
    } 

    // set labels. if bins are specified, use numbers
    //  otherwise use the category (data + attribute)
    var labels;
    if( bins ) {

      labels = data.map( function(d, i) { 
        // if we have a datamap, access the domain to get the labels correct
        return datamap ? datamap.domain()[i] : i+1; 
      });

    } else {

      labels = data.map( function(d) { 
        // TODO some NOTES have no data, not sure why, this is a workaround
        if (d[0])
          return d[0][attribute]; 
      });

    }

    // TODO combine label and length in data attribute
    this.set('data', data.map(function(d, i) {
      return {
        length: d.length,
        label: labels[i]
      };
    }) );  

  }
});
