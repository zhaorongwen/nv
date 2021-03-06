var HierarchyView = Backbone.View.extend({

  initialize: function() {
    //create the list
    var list = d3.select(this.options.target).append('ul');

    //respond to hierarchy changes
    this.model.on('change:data', this.render, this);
    
    // initial render
    this.render();
  },

  render: function() {
    var list = d3.select(this.options.target).select('ul')
      , hierarchy  = this.model.get('data')
      , self       = this;

    // remove all old
    list.selectAll('li').remove();
  
    // build the list based on the initial hierarchy
    var listItems = list.selectAll('li')
      .data(hierarchy, function(d) { return d.target; });

    listItems.enter().append('li')
      .attr('class', function(d){
        if(d.target === 'nv')
          return 'hierarchyNode ui-state-disabled';
        else
          return 'hierarchyNode';
      })
      .text(function(d) { return d.target; })
      .append('i')
      .attr('class', function(d){
        if(d.target !== 'nv')
          return 'icon-resize-horizontal';
      });

    listItems.exit().remove();

    // make the list sortable
    $('#hierarchy ul').sortable({
      items: "li:not(.ui-state-disabled)",

      cursor: "move",

      // on drop (stop), emit the new hierarchy
      stop: function(event, ui) {
        var h = [];

        // get each data item in the list (in order)
        $("#hierarchy li").each(function(i, el){
          h.push( d3.select(el).datum() );
        });

        self.options.app.trigger('hierarchyChange', h);
      }
    });
  }

});
