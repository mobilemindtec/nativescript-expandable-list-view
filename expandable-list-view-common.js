var observable = require("data/observable");
var observableArray = require("data/observable-array");
var view = require("ui/core/view");
var proxy = require("ui/core/proxy");
var dependencyObservable = require("ui/core/dependency-observable");
var builder = require("ui/builder");
var label = require("ui/label");
var color = require("color");
var weakEvents = require("ui/core/weak-event-listener");
var ITEMS = "items";
var ITEMHEADERTEMPLATE = "itemHeaderTemplate";
var ITEMCHILDTEMPLATE = "itemChildTemplate";
var ISSCROLLING = "isScrolling";
var LISTVIEW = "ExpandableListView";
var SEPARATORCOLOR = "separatorColor";
var ROWHEIGHT = "rowHeight";
var knownTemplates;

(function (knownTemplates) {
    knownTemplates.itemHeaderTemplate = "itemHeaderTemplate";
    knownTemplates.itemChildTemplate = "itemChildTemplate";
})(knownTemplates = exports.knownTemplates || (exports.knownTemplates = {}));

function onItemsPropertyChanged(data) {
    var listView = data.object;
    listView._onItemsPropertyChanged(data);
}

function onItemHeaderTemplatePropertyChanged(data) {
    var listView = data.object;
    listView.refresh();
}

function onItemChildTemplatePropertyChanged(data) {
    var listView = data.object;
    listView.refresh();
}

function onRowHeightPropertyChanged(data) {
    var listView = data.object;
    listView._onRowHeightPropertyChanged(data);
}

var ExpandableListView = (function (_super) {
    __extends(ExpandableListView, _super);
    function ExpandableListView() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(ExpandableListView.prototype, "items", {
        get: function () {
            return this._getValue(ExpandableListView.itemsProperty);
        },
        set: function (value) {            
            this._setValue(ExpandableListView.itemsProperty, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ExpandableListView.prototype, "itemHeaderTemplate", {
        get: function () {
            return this._getValue(ExpandableListView.itemHeaderTemplateProperty);
        },
        set: function (value) {
            this._setValue(ExpandableListView.itemHeaderTemplateProperty, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ExpandableListView.prototype, "itemChildTemplate", {
        get: function () {
            return this._getValue(ExpandableListView.itemChildTemplateProperty);
        },
        set: function (value) {
            this._setValue(ExpandableListView.itemChildTemplateProperty, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ExpandableListView.prototype, "isScrolling", {
        get: function () {
            return this._getValue(ExpandableListView.isScrollingProperty);
        },
        set: function (value) {
            this._setValue(ExpandableListView.isScrollingProperty, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ExpandableListView.prototype, "separatorColor", {
        get: function () {
            return this._getValue(ExpandableListView.separatorColorProperty);
        },
        set: function (value) {
            this._setValue(ExpandableListView.separatorColorProperty, value instanceof color.Color ? value : new color.Color(value));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ExpandableListView.prototype, "rowHeight", {
        get: function () {
            return this._getValue(ExpandableListView.rowHeightProperty);
        },
        set: function (value) {
            this._setValue(ExpandableListView.rowHeightProperty, value);
        },
        enumerable: true,
        configurable: true
    });
    ExpandableListView.prototype.refresh = function () {
    };
    ExpandableListView.prototype.scrollToIndex = function (index) {
    };
    ExpandableListView.prototype._getItemHeaderTemplateContent = function (index) {
        var v;
        if (this.itemHeaderTemplate && this.items) {
            v = builder.parse(this.itemHeaderTemplate, this);
        }
        return v;
    };
    ExpandableListView.prototype._getItemChildTemplateContent = function (index) {
        var v;
        if (this.itemChildTemplate && this.items) {
            v = builder.parse(this.itemChildTemplate, this);
        }
        return v;
    };
    ExpandableListView.prototype._prepareItemHeader = function (item, index) {
        if (item) {
            var dataItem = this._getDataItemHeader(index);
            if (!(dataItem instanceof observable.Observable)) {
                item.bindingContext = null;
            }
            item.bindingContext = dataItem;
            item._inheritProperties(this);
        }
    };
    ExpandableListView.prototype._prepareItemChild = function (item, headerIndex, index) {
        if (item) {
            var dataItem = this._getDataItemChild(headerIndex, index);
            if (!(dataItem instanceof observable.Observable)) {
                item.bindingContext = null;
            }
            item.bindingContext = dataItem;
            item._inheritProperties(this);
        }
    };
    ExpandableListView.prototype._getDataItemHeader = function (index) {

        if(this.items){
            if(this.items.getItem)
                return this.items.getItem(index)
            else
                return this.items[index]
        }

        return undefined

        //return this.items ? this.items[index] : undefined
    };
    ExpandableListView.prototype._getDataItemChild = function (headerIndex, index) {

        if(this.items){
            if(this.items.getItem){
                var header = this.items.getItem(headerIndex)
                if(header.get)
                    return header.get('item').getItem(index)
                return header.getItem('index')
            }
            else
                return this.items[headerIndex].getItem(index)
        }

        return undefined

        //return this.items ? this.items[headerIndex].getItem(index) : undefined
    };
    ExpandableListView.prototype._getDefaultItemHeaderContent = function (index) {
        var lbl = new label.Label();
        lbl.bind({
            targetProperty: "text",
            sourceProperty: "$value"
        });
        return lbl;
    };
    ExpandableListView.prototype._getDefaultItemChildContent = function (index) {
        var lbl = new label.Label();
        lbl.bind({
            targetProperty: "text",
            sourceProperty: "$value"
        });
        return lbl;
    };
    ExpandableListView.prototype._onItemsPropertyChanged = function (data) {
        console.log("## _onItemsPropertyChanged")
        if (data.oldValue instanceof observable.Observable) {
            weakEvents.removeWeakEventListener(data.oldValue, observableArray.ObservableArray.changeEvent, this._onItemsChanged, this);
        }
        if (data.newValue instanceof observable.Observable) {
            weakEvents.addWeakEventListener(data.newValue, observableArray.ObservableArray.changeEvent, this._onItemsChanged, this);
        }
        this.refresh();
    };
    ExpandableListView.prototype._onItemsChanged = function (args) {
        this.refresh();
    };
    ExpandableListView.prototype._onRowHeightPropertyChanged = function (data) {
        this.refresh();
    };
    ExpandableListView.prototype._propagateInheritableProperties = function (view) {
    };
    
    ExpandableListView.itemLoadingEvent = "itemLoading";
    ExpandableListView.groupExpandEvent = "groupExpand";
    ExpandableListView.groupCollapseEvent = "groupCollapse";
    ExpandableListView.childTapEvent = "childTap";
    ExpandableListView.loadMoreItemsEvent = "loadMoreItems";
    ExpandableListView.separatorColorProperty = new dependencyObservable.Property(SEPARATORCOLOR, LISTVIEW, new proxy.PropertyMetadata(undefined));
    ExpandableListView.itemsProperty = new dependencyObservable.Property(ITEMS, LISTVIEW, new proxy.PropertyMetadata(undefined, dependencyObservable.PropertyMetadataSettings.AffectsLayout, onItemsPropertyChanged));    
    ExpandableListView.itemHeaderTemplateProperty = new dependencyObservable.Property(ITEMHEADERTEMPLATE, LISTVIEW, new proxy.PropertyMetadata(undefined, dependencyObservable.PropertyMetadataSettings.AffectsLayout, onItemHeaderTemplatePropertyChanged));
    ExpandableListView.itemChildTemplateProperty = new dependencyObservable.Property(ITEMCHILDTEMPLATE, LISTVIEW, new proxy.PropertyMetadata(undefined, dependencyObservable.PropertyMetadataSettings.AffectsLayout, onItemChildTemplatePropertyChanged));
    ExpandableListView.isScrollingProperty = new dependencyObservable.Property(ISSCROLLING, LISTVIEW, new proxy.PropertyMetadata(false, dependencyObservable.PropertyMetadataSettings.None));
    ExpandableListView.rowHeightProperty = new dependencyObservable.Property(ROWHEIGHT, LISTVIEW, new proxy.PropertyMetadata(-1, dependencyObservable.PropertyMetadataSettings.AffectsLayout, onRowHeightPropertyChanged));
    return ExpandableListView;

})(view.View);

exports.ExpandableListView = ExpandableListView;


var ExpandableListItem = function (args) {    

    // listDataHeader: header titles
    // listDataChild: child data in format of header title, child title
           
    this.id = args.id
    this.title = args.title
    this.items = args.items || []
    this.tag = args.tag    
    this.expanded = args.expanded

    ExpandableListItem.prototype.getItems = function(){
        return this.items
    }

    ExpandableListItem.prototype.getItemsCount = function(){
        return this.items.length
    }

    ExpandableListItem.prototype.getItem = function(index){
        return this.items[index]
    }

    ExpandableListItem.prototype.getId = function(index){
        return this.id
    }

    ExpandableListItem.prototype.getTitle = function(index){
        return this.title
    }

    ExpandableListItem.prototype.isExpanded = function(index){
        return this.expanded
    }

    ExpandableListItem.prototype.setExpanded = function(expanded){
        this.expanded = expanded
    }    

    ExpandableListItem.prototype.addItem = function(item){
        this.items.push(item)
    }

    ExpandableListItem.prototype.makeAndAddItem = function(args){        
        this.addItem(new ExpandableListItem(args))
    }

    ExpandableListItem.prototype.getTag = function(args){
        return this.tag
    }
}

exports.ExpandableListItem = ExpandableListItem;