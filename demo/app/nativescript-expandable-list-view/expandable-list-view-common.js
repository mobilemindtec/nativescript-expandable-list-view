var observable = require("data/observable");
var observableArray = require("data/observable-array");
var view = require("ui/core/view");
var builder = require("ui/builder");
var label = require("ui/label");
var color = require("color");
var weakEvents = require("ui/core/weak-event-listener");
var utils = require("utils/utils");
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

var ExpandableListView = (function (_super) {
    __extends(ExpandableListView, _super);
    function ExpandableListView() {
        _super.apply(this, arguments);
    }


    ExpandableListView.prototype._onScrolling = function(value){
        this._onScrollingPropertyChanged(false, value)
    }

    ExpandableListView.prototype._onScrollingPropertyChanged = function(oldValue, newValue){

    }

    ExpandableListView.prototype._onItemHeaderTemplatePropertyChanged = function(oldValue, newValue) {
        this.refresh();
    }

    ExpandableListView.prototype._onItemChildTemplatePropertyChanged = function(oldValue, newValue) {
        this.refresh();
    }

    ExpandableListView.prototype.refresh = function () {
    }

    ExpandableListView.prototype.scrollToIndex = function (index) {
    }

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
        }
    };

    ExpandableListView.prototype._prepareItemChild = function (item, headerIndex, index) {
        if (item) {
            var dataItem = this._getDataItemChild(headerIndex, index);
            if (!(dataItem instanceof observable.Observable)) {
                item.bindingContext = null;
            }
            item.bindingContext = dataItem;
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

    ExpandableListView.prototype._onItemsPropertyChanged = function (oldValue, newValue) {

        var data = {
            oldValue: oldValue, 
            newValue: newValue
        }

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

    ExpandableListView.prototype._onRowHeightPropertyChanged = function (oldValue, newValue) {
        this.refresh();
    };

    ExpandableListView.prototype._propagateInheritableProperties = function (view) {
    };

    ExpandableListView.itemLoadingEvent = "itemLoading";
    ExpandableListView.groupExpandEvent = "groupExpand";
    ExpandableListView.groupCollapseEvent = "groupCollapse";
    ExpandableListView.childTapEvent = "childTap";
    ExpandableListView.loadMoreItemsEvent = "loadMoreItems";

    return ExpandableListView;

})(view.View);

exports.separatorColorProperty = new view.Property({
    name: "separatorColor",
    valueChanged: function (target, oldValue, newValue) {
        target._onDrawerContentPropertyChanged(oldValue, newValue)
    }
});

exports.itemsProperty = new view.Property({
    name: "items",
    valueChanged: function (target, oldValue, newValue) {
        target._onItemsPropertyChanged(oldValue, newValue)
    }
});

exports.itemHeaderTemplateProperty = new view.Property({
    name: "itemHeaderTemplate",
    valueChanged: function (target, oldValue, newValue) {
        target._onItemHeaderTemplatePropertyChanged(oldValue, newValue)
    }
});

exports.itemChildTemplateProperty = new view.Property({
    name: "itemChildTemplate",
    valueChanged: function (target, oldValue, newValue) {
        target._onItemChildTemplatePropertyChanged(oldValue, newValue)
    }
});

exports.isScrollingProperty = new view.Property({
    name: "isScrolling",
    valueChanged: function (target, oldValue, newValue) {
        target._onScrollingPropertyChanged(oldValue, newValue)
    }
});

exports.rowHeightProperty = new view.Property({
    name: "rowHeight",
    defaultValue: 0,
    valueChanged: function (target, oldValue, newValue) {

        if(typeof newValue == "string")
            newValue = parseInt(newValue)

        target._effectiveRowHeight = utils.layout.toDevicePixels(newValue, -1)
        target._onRowHeightPropertyChanged(oldValue, newValue)
    }
});

exports.separatorColorProperty.register(ExpandableListView);
exports.itemsProperty.register(ExpandableListView);
exports.itemHeaderTemplateProperty.register(ExpandableListView);
exports.itemChildTemplateProperty.register(ExpandableListView);
exports.isScrollingProperty.register(ExpandableListView);
exports.rowHeightProperty.register(ExpandableListView);

exports.ExpandableListView = ExpandableListView;
exports.ExpandableListItem = ExpandableListItem;
