/*
  backgrid
  http://github.com/cloudflare/backgrid

  Copyright (c) 2013-present Cloudflare, Inc. and contributors
  Licensed under the MIT license.
*/

/**
   Row is a simple container view that takes a model instance and a list of
   column metadata describing how each of the model's attribute is to be
   rendered, and apply the appropriate cell to each attribute.

   @class Backgrid.Row
   @extends Backbone.View
*/
var Row = Backgrid.Row = Backbone.View.extend({

  /** @property */
  tagName: "tr",

  /**
     Initializes a row view instance.

     @param {Object} options
     @param {Backbone.Collection.<Backgrid.Column>|Array.<Backgrid.Column>|Array.<Object>} options.columns Column metadata.
     @param {Backbone.Model} options.model The model instance to render.

     @throws {TypeError} If options.columns or options.model is undefined.
  */
  initialize: function (options) {

    var columns = this.columns = options.columns;
    if (!(columns instanceof Backbone.Collection)) {
      columns = this.columns = new Columns(columns);
    }

    var cells = this.cells = [];
    for (var i = 0; i < columns.length; i++) {
      cells.push(this.makeCell(columns.at(i), options));
    }

    this.listenTo(columns, "add", function (column, columns) {
      var i = columns.indexOf(column);
      var cell = this.makeCell(column, options);
      cells.splice(i, 0, cell);

      var $el = this.$el;
      if (i === 0) {
        $el.prepend(cell.render().$el);
      }
      else if (i === columns.length - 1) {
        $el.append(cell.render().$el);
      }
      else {
        $el.children().eq(i).before(cell.render().$el);
      }
    });

    this.listenTo(columns, "remove", function (column, columns, opts) {
      cells[opts.index].remove();
      cells.splice(opts.index, 1);
    });
  },

  /**
     Factory method for making a cell. Used by #initialize internally. Override
     this to provide an appropriate cell instance for a custom Row subclass.

     @protected

     @param {Backgrid.Column} column
     @param {Object} options The options passed to #initialize.

     @return {Backgrid.Cell}
  */
  makeCell: function (column) {
    return new (column.get("cell"))({
      column: column,
      model: this.model
    });
  },

  /**
     Renders a row of cells for this row's model.
  */
  render: function () {
    this.$el.empty();

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < this.cells.length; i++) {
      fragment.appendChild(this.cells[i].render().el);
    }

    this.el.appendChild(fragment);

    this.delegateEvents();

    return this;
  },

  /**
     Clean up this row and its cells.

     @chainable
  */
  remove: function () {
    for (var i = 0; i < this.cells.length; i++) {
      var cell = this.cells[i];
      cell.remove.apply(cell, arguments);
    }
    return Backbone.View.prototype.remove.apply(this, arguments);
  }

});

/**
   EmptyRow is a simple container view that takes a list of column and render a
   row with a single column.

   @class Backgrid.EmptyRow
   @extends Backbone.View
*/
var EmptyRow = Backgrid.EmptyRow = Backbone.View.extend({

  /** @property */
  tagName: "tr",

  /** @property {string|function(): string} */
  emptyText: null,

  /**
     Initializer.

     @param {Object} options
     @param {string|function(): string} options.emptyText
     @param {Backbone.Collection.<Backgrid.Column>|Array.<Backgrid.Column>|Array.<Object>} options.columns Column metadata.
   */
  initialize: function (options) {
    this.emptyText = options.emptyText;
    this.columns =  options.columns;
  },

  /**
     Renders an empty row.
  */
  render: function () {
    this.$el.empty();

    var td = document.createElement("td");
    td.setAttribute("colspan", this.columns.length);
    var span = document.createElement("span");
    span.innerHTML = _.result(this, "emptyText");
    td.appendChild(span);

    this.el.className = "empty";
    this.el.appendChild(td);

    return this;
  }
});

  var SelectableRow = Backgrid.SelectableRow = Row.extend({
    focusedBgColor : '#F0FFFF',
    selectedBgColor : '#FFFFF0',
    events : {
      'click' : 'onClick',
      'contextmenu' : 'onRightClick'
    },
    onClick : function(evt) {
      var $el = this.$el;
      var selectedBgColor = this.selectedBgColor;
      if ($el.attr('data-row-focused')) {
        return;
      }
      var drf = $el.css('data-row-selected') || $el.css('background-color') || 'transparent';
      $el.attr('data-row-focused', drf).css('background-color', this.focusedBgColor);
      $el.siblings().each(function() {
        var $this = $(this);
        var _drf = $this.attr('data-row-focused') || '';
        var _drs = $this.attr('data-row-selected') || '';
        if (_drf) {
          if (_drs) {
            $this.css('background-color', selectedBgColor);
          } else {
            $this.css('background-color', _drf);
          }
          $this.removeAttr('data-row-focused');

        }
      });
    },
    onRightClick : function(evt) {
      var $el, drs, drf;
      evt.preventDefault();
      evt.stopPropagation();
      $el = this.$el;
      drf = $el.attr('data-row-focused') || '';
      drs = $el.attr('data-row-selected') || '';
      if (drs) {
        if (drf) {
          $el.css('background-color', this.focusedBgColor);
        } else {
          $el.css('background-color', drs);
        }
        $el.removeAttr('data-row-selected');
        return;
      }
      drs = $el.css('data-row-focused') || $el.css('background-color') || 'transparent';
      $el.attr('data-row-selected', drs);
      if (!drf) {
        $el.css('background-color', this.selectedBgColor);
      }
    }
  });