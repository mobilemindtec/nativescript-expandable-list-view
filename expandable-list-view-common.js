import {Observable, ObservableArray, Property} from "@nativescript/core";
import {Builder} from "@nativescript/core/ui/builder";
var view = require("@nativescript/core/ui/core/view");
var label = require("@nativescript/core/ui/label");
var color = require("@nativescript/core/color");
var weakEvents = require("ui/core/weak-event-listener");
var utils = require("@nativescript/core/utils");
var ITEMS = "items";
var ITEMHEADERTEMPLATE = "itemHeaderTemplate";
var ITEMCHILDTEMPLATE = "itemChildTemplate";
var ISSCROLLING = "isScrolling";
var LISTVIEW = "ExpandableListView";
var SEPARATORCOLOR = "separatorColor";
var ROWHEIGHT = "rowHeight";
var knownTemplates;


Builder.knownTemplates.add("itemHeaderTemplate")
Builder.knownTemplates.add("itemChildTemplate")

export class ExpandableListItem {

    // listDataHeader: header titles
    // listDataChild: child data in format of header title, child title

    constructor(args){
        this.id = args.id
        this.title = args.title
        this.items = args.items || []
        this.tag = args.tag
        this.expanded = args.expanded        
    }

    getItems(){
        return this.items
    }

    getItemsCount(){
        return this.items.length
    }

    getItem(index){
        return this.items[index]
    }

    getId(index){
        return this.id
    }

    getTitle(index){
        return this.title
    }

    isExpanded(index){
        return this.expanded
    }

    setExpanded(expanded){
        this.expanded = expanded
    }

    addItem(item){
        this.items.push(item)
    }

    makeAndAddItem(args){
        this.addItem(new ExpandableListItem(args))
    }

    getTag(args){
        return this.tag
    }
}

export class ExpandableListView extends view.View{


    constructor(){
        super(...arguments);
        this._defaultItemHeaderTemplate = {
            key: 'default',
            createView: () => {
                if (this.itemHeaderTemplate) {
                    return Builder.parse(this.itemHeaderTemplate, this);
                }
                return undefined;
            },
        };

        this.defaultItemChildTemplate = {
            key: 'default',
            createView: () => {
                if (this.itemChildTemplate) {
                    return Builder.parse(this.itemChildTemplate, this);
                }
                return undefined;
            },
        };
    }

    _onScrolling(value){
        this._onScrollingPropertyChanged(false, value)
    }

    _onScrollingPropertyChanged(oldValue, newValue){

    }

    _onItemHeaderTemplatePropertyChanged(oldValue, newValue) {
        this.refresh();
    }

    _onItemChildTemplatePropertyChanged(oldValue, newValue) {
        this.refresh();
    }

    refresh () {
    }

    scrollToIndex (index) {
    }

    _getItemHeaderTemplateContent (index) {
        var v;
        if (this.itemHeaderTemplate && this.items) {
            v = this._defaultItemHeaderTemplate
        }
        return v;
    };

    _getItemChildTemplateContent (index) {
        var v;
        if (this.itemChildTemplate && this.items) {
            v = this.defaultItemChildTemplate
        }
        return v;
    };

    _prepareItemHeader (item, index) {
        if (item) {
            var dataItem = this._getDataItemHeader(index);
            if (!(dataItem instanceof Observable)) {
                item.bindingContext = null;
            }
            item.bindingContext = dataItem;
        }
    };

    _prepareItemChild (item, headerIndex, index) {
        if (item) {
            var dataItem = this._getDataItemChild(headerIndex, index);
            if (!(dataItem instanceof Observable)) {
                item.bindingContext = null;
            }
            item.bindingContext = dataItem;
        }
    };

    _getDataItemHeader (index) {

        if(this.items){
            if(this.items.getItem)
                return this.items.getItem(index)
            else
                return this.items[index]
        }

        return undefined

    };

    _getDataItemChild (headerIndex, index) {

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

    _getDefaultItemHeaderContent (index) {
        var lbl = new label.Label();
        lbl.bind({
            targetProperty: "text",
            sourceProperty: "$value"
        });
        return lbl;
    };

    _getDefaultItemChildContent (index) {
        var lbl = new label.Label();
        lbl.bind({
            targetProperty: "text",
            sourceProperty: "$value"
        });
        return lbl;
    };

    _onItemsPropertyChanged (oldValue, newValue) {

        var data = {
            oldValue: oldValue, 
            newValue: newValue
        }

        if (data.oldValue instanceof Observable) {
            weakEvents.removeWeakEventListener(data.oldValue, ObservableArray.changeEvent, this._onItemsChanged, this);
        }

        if (data.newValue instanceof Observable) {
            weakEvents.addWeakEventListener(data.newValue, ObservableArray.changeEvent, this._onItemsChanged, this);
        }

        this.refresh();
    };

    _onItemsChanged (args) {
        this.refresh();
    };

    _onRowHeightPropertyChanged (oldValue, newValue) {
        this.refresh();
    };

    _propagateInheritableProperties (view) {
    };

}

ExpandableListView.itemLoadingEvent = "itemLoading";
ExpandableListView.groupExpandEvent = "groupExpand";
ExpandableListView.groupCollapseEvent = "groupCollapse";
ExpandableListView.childTapEvent = "childTap";
ExpandableListView.loadMoreItemsEvent = "loadMoreItems";

exports.separatorColorProperty = new Property({
    name: "separatorColor",
    valueChanged: function (target, oldValue, newValue) {
        target._onDrawerContentPropertyChanged(oldValue, newValue)
    }
});

exports.itemsProperty = new Property({
    name: "items",
    valueChanged: function (target, oldValue, newValue) {
        target._onItemsPropertyChanged(oldValue, newValue)
    }
});

exports.itemHeaderTemplateProperty = new Property({
    name: "itemHeaderTemplate",
    valueChanged: function (target, oldValue, newValue) {
        target._onItemHeaderTemplatePropertyChanged(oldValue, newValue)
    }
});

exports.itemChildTemplateProperty = new Property({
    name: "itemChildTemplate",
    valueChanged: function (target, oldValue, newValue) {
        target._onItemChildTemplatePropertyChanged(oldValue, newValue)
    }
});

exports.isScrollingProperty = new Property({
    name: "isScrolling",
    valueChanged: function (target, oldValue, newValue) {
        target._onScrollingPropertyChanged(oldValue, newValue)
    }
});

exports.rowHeightProperty = new Property({
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
