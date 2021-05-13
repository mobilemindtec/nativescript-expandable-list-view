var common = require("./expandable-list-view-common");
var utils = require("@nativescript/core/utils");
var view = require("@nativescript/core/ui/core/view");
var stack_layout_1 = require("@nativescript/core/ui/layouts/stack-layout");
var proxy_view_container_1 = require("@nativescript/core/ui/proxy-view-container");
var color;

function ensureColor() {
    if (!color) {
        color = require("@nativescript/core/color");
    }
}
var CELLIDENTIFIER = "cell";
var CELLIDENTIFIERHEADER = "celh"
var ITEMLOADING = common.ExpandableListView.itemLoadingEvent;
var LOADMOREITEMS = common.ExpandableListView.loadMoreItemsEvent;

var GROUPEXPAND = common.ExpandableListView.groupExpandEvent;
var GROUPCOLLAPSE = common.ExpandableListView.groupCollapseEvent;
var CHILDITEMTAP = common.ExpandableListView.childTapEvent;


var DEFAULT_HEIGHT = 44;

export * from "./expandable-list-view-common"

var infinity = utils.layout.makeMeasureSpec(0, utils.layout.UNSPECIFIED);
var expandableSections = NSMutableIndexSet.alloc().init()

var ListViewCell = (function (_super) {
    __extends(ListViewCell, _super);
    function ListViewCell() {                
        return _super.call(this, arguments) || this;
    }
    ListViewCell.prototype.willMoveToSuperview = function (newSuperview) {
        var parent = (this.view ? this.view.parent : null);
        if (parent && !newSuperview) {
            parent._removeContainer(this);
        }
    };

    Object.defineProperty(ListViewCell.prototype, "view", {
        get: function () {
            return this.owner ? this.owner.get() : null;
        },
        enumerable: true,
        configurable: true
    });

    ListViewCell.prototype.initWithStyleReuseIdentifier = function(style, reuseIdentifier){
        NSExpandableTableViewControllerHeaderCell.prototype.initWithStyleReuseIdentifier.apply(this, [style, reuseIdentifier])
        return this;
    }

    //ListViewCell.ObjCProtocols = [UIExpandingTableViewCell];

    return ListViewCell;

}(NSExpandableTableViewControllerHeaderCell));

function notifyForItemAtIndex(listView, cell, view, eventName, indexPath) {
    var args = {
        eventName: eventName,
        object: listView,
        childIndex: indexPath.row - 1,
        groupIndex: indexPath.section,
        view: view,
        ios: cell,
        android: undefined
    };
    listView.notify(args);
    return args;
}

var DataSource = (function (_super) {
    __extends(DataSource, _super);
    function DataSource() {        
        return _super.call(this, arguments) || this;
    }
    DataSource.initWithOwner = function (owner) {
        var dataSource = DataSource.new();
        dataSource._owner = owner;
        return dataSource;
    };
    DataSource.prototype.tableViewNumberOfRowsInSection = function(tableView, section){

        var owner = this._owner.get();
        var count
        var dataHeader = owner.items.getItem ? owner.items.getItem(section) : owner.items[section]

        if(!dataHeader)
            count = 0
        else if(dataHeader.get)
            count = dataHeader.get('item').getItemsCount()
        else
            count = dataHeader.getItemsCount()

        return count + 1
    }
    DataSource.prototype.numberOfSectionsInTableView = function (tableView) {        
        var owner = this._owner.get();
        var count = (owner && owner.items) ? owner.items.length : 0;
        return count
    };
    DataSource.prototype.tableViewCellForRowAtIndexPath = function (tableView, indexPath) {

        var cell = tableView.dequeueReusableCellWithIdentifier(CELLIDENTIFIER);

        if (!cell) {
            cell = new ListViewCell().initWithStyleReuseIdentifier(UITableViewCellStyleValue1, CELLIDENTIFIER);
        }
        cell.backgroundColor = UIColor.clearColor


        var owner = this._owner.get();
        if (owner) {
            owner._prepareCellChild(cell, indexPath);
            var cellView = cell.view;
            if (cellView) {
                var width = utils.layout.getMeasureSpecSize(owner.widthMeasureSpec);
                var rowHeight = owner.nativeView.rowHeight;

                var cellHeight = rowHeight > 0 ? rowHeight : owner.getHeightChild(indexPath.section, indexPath.row);
                view.View.layoutChild(owner, cellView, 0, 0, width, cellHeight);
            }
        }
        return cell;
    };

    DataSource.prototype.tableViewCanExpandSection = function(tableView, section){
        return true;
    }

    DataSource.prototype.tableViewNeedsToDownloadDataForExpandableSection = function(tableView, section){
        return expandableSections.containsIndex(section);
    }

    DataSource.prototype.tableViewExpandingCellForSection = function(tableView, section){

        var cell = tableView.dequeueReusableCellWithIdentifier(CELLIDENTIFIERHEADER);

        if (!cell) {
            cell = new ListViewCell().initWithStyleReuseIdentifier(UITableViewCellStyleValue1, CELLIDENTIFIERHEADER);
        }
        cell.backgroundColor = UIColor.clearColor

        var indexPath = NSIndexPath.indexPathForRowInSection(-1, section)
        var owner = this._owner.get();
        if (owner) {
            owner._prepareCellHeader(cell, indexPath);
            var cellView = cell.view;
            if (cellView) {
                var width = utils.layout.getMeasureSpecSize(owner.widthMeasureSpec);
                var rowHeight = owner.nativeView.rowHeight;
                var cellHeight = rowHeight > 0 ? rowHeight : owner.getHeightHeader(indexPath.section);
                view.View.layoutChild(owner, cellView, 0, 0, width, cellHeight);
            }
        }

        /* // not implemented
        var dataHeader = owner._getDataItemHeader(section);
        if(dataHeader.isExpanded()){
            // set and disable
            dataHeader.setExpanded(false)
        }*/


        return cell;
    }

    DataSource.ObjCProtocols = [UITableViewDataSource, NSExpandableTableViewDatasource];
    return DataSource;
}(NSObject));

var UITableViewDelegateImpl = (function (_super) {
    __extends(UITableViewDelegateImpl, _super);
    function UITableViewDelegateImpl() {        
        return _super.call(this, arguments) || this;
    }
    UITableViewDelegateImpl.initWithOwner = function (owner) {
        var delegate = UITableViewDelegateImpl.new();
        delegate._owner = owner;
        return delegate;
    };
    UITableViewDelegateImpl.prototype.tableViewWillDisplayCellForRowAtIndexPath = function (tableView, cell, indexPath) {
        var owner = this._owner.get();
        if (owner && (indexPath.row === owner.items.length - 1)) {
            owner.notify({ eventName: LOADMOREITEMS, object: owner });
        }
    };
    UITableViewDelegateImpl.prototype.tableViewWillSelectRowAtIndexPath = function (tableView, indexPath) {
        var cell = tableView.cellForRowAtIndexPath(indexPath);
        var owner = this._owner.get();
        if (owner && indexPath.row > 0) {
            notifyForItemAtIndex(owner, cell, cell.view, CHILDITEMTAP, indexPath);
        }
        return indexPath;
    };
    UITableViewDelegateImpl.prototype.tableViewDidSelectRowAtIndexPath = function (tableView, indexPath) {
        tableView.deselectRowAtIndexPathAnimated(indexPath, true);
        return indexPath;
    };
    UITableViewDelegateImpl.prototype.tableViewHeightForRowAtIndexPath = function (tableView, indexPath) {
        var owner = this._owner.get();        

        if (!owner) {
            return DEFAULT_HEIGHT;
        }
        var height = undefined;
        var thisIsHeader = indexPath.row == 0
        if (utils.iOSNativeHelper.MajorVersion >= 8) {
            if(thisIsHeader)
                height = owner.getHeightHeader(indexPath.section);
            else
                height = owner.getHeightChild(indexPath.section,  indexPath.row);
        }
        if (utils.iOSNativeHelper.MajorVersion < 8 || height === undefined) {
            var cell = this._measureCell;
            if (!cell) {
                this._measureCell = tableView.dequeueReusableCellWithIdentifier(CELLIDENTIFIER);

                if (!this._measureCell) {
                    this._measureCell = new ListViewCell().initWithStyleReuseIdentifier(UITableViewCellStyleValue1, CellIdentifier);
                    this._measureCell.backgroundColor = UIColor.clearColor
                }

                //this._measureCell = cell
                cell = this._measureCell;
            }
            if(thisIsHeader)
                height = owner._prepareCellHeader(cell, indexPath);
            else
                height = owner._prepareCellChild(cell, indexPath);
        }

        return utils.layout.toDeviceIndependentPixels(height);
    };

    UITableViewDelegateImpl.prototype.tableViewDidSelectRowAtIndexPath = function(tableView, indexPath){
        tableView.deselectRowAtIndexPathAnimated(indexPath, false)
    }

    // SLE delegate
    UITableViewDelegateImpl.prototype.tableViewDownloadDataForExpandableSection = function(tableView, section){
        expandableSections.addIndex(section)
        tableView.expandSectionAnimated(section, true);
    }

    UITableViewDelegateImpl.prototype.tableViewDidCollapseSectionAnimated = function(tableView, section, animated){
        expandableSections.removeIndex(section)
    }

    UITableViewDelegateImpl.prototype.tableViewWillExpandSectionAnimated = function(tableView, animated, section){
        var owner = this._owner.get();
        var indexPath = NSIndexPath.indexPathForRowInSection(-1, section)
        notifyForItemAtIndex(owner, null, null, GROUPEXPAND, indexPath);
    }

    UITableViewDelegateImpl.prototype.tableViewWillCollapseSectionAnimated = function(tableView, animated, section){
        var owner = this._owner.get();
        var indexPath = NSIndexPath.indexPathForRowInSection(-1, section)
        notifyForItemAtIndex(owner, null, null, GROUPCOLLAPSE, indexPath);
    }

    UITableViewDelegateImpl.ObjCProtocols = [UITableViewDelegate, NSExpandableTableViewDelegate];
    return UITableViewDelegateImpl;
}(NSObject));

var UITableViewRowHeightDelegateImpl = (function (_super) {
    __extends(UITableViewRowHeightDelegateImpl, _super);
    function UITableViewRowHeightDelegateImpl() {        
        return _super.call(this, arguments) || this;
    }
    UITableViewRowHeightDelegateImpl.initWithOwner = function (owner) {
        var delegate = UITableViewRowHeightDelegateImpl.new();
        delegate._owner = owner;
        return delegate;
    };
    UITableViewRowHeightDelegateImpl.prototype.tableViewWillDisplayCellForRowAtIndexPath = function (tableView, cell, indexPath) {
        var owner = this._owner.get();
        if (owner && (indexPath.row === owner.items.length - 1)) {
            owner.notify({ eventName: LOADMOREITEMS, object: owner });
        }
    };
    UITableViewRowHeightDelegateImpl.prototype.tableViewWillSelectRowAtIndexPath = function (tableView, indexPath) {
        var cell = tableView.cellForRowAtIndexPath(indexPath);
        var owner = this._owner.get();
        if (owner && indexPath.row > 0) {
            notifyForItemAtIndex(owner, cell, cell.view, CHILDITEMTAP, indexPath);
        }
        return indexPath;
    };
    UITableViewRowHeightDelegateImpl.prototype.tableViewHeightForRowAtIndexPath = function (tableView, indexPath) {
        var owner = this._owner.get();
        if (!owner) {
            return DEFAULT_HEIGHT;
        }

        return owner._effectiveRowHeight;
    };

    UITableViewRowHeightDelegateImpl.ObjCProtocols = [UITableViewDelegate];
    return UITableViewRowHeightDelegateImpl;
}(NSObject));

export class ExpandableListView extends common.ExpandableListView{
    
    constructor() {
        super()        
        this._preparingCell = false;
        this._isDataDirty = false;
        this.widthMeasureSpec = 0;

        this._heightsHeader = new Array();
        this._heightsChild = new Array();
        this._map = new Map();        
    }

    createNativeView(){
        var mainScreen = UIScreen.mainScreen;
        
        this.nativeView = this._ios = NSExpandableTableView.alloc().initWithFrameStyle(mainScreen.bounds, UITableViewStylePlain);

        this._ios.registerClassForCellReuseIdentifier(ListViewCell.class(), CELLIDENTIFIER);
        this._ios.autoresizingMask = UIViewAutoresizing.UIViewAutoresizingNone;
        this._ios.estimatedRowHeight = DEFAULT_HEIGHT;
        this._ios.rowHeight = UITableViewAutomaticDimension;
        this._ios.dataSource = this._dataSource = DataSource.initWithOwner(new WeakRef(this));
        this._ios.delegate = this._delegate = UITableViewDelegateImpl.initWithOwner(new WeakRef(this));
        return this.nativeView   
    }

    onLoaded() {
        super.onLoaded()
        if (this._isDataDirty) {
            this.refresh();
        }
        this._ios.delegate = this._delegate;
    }

    onUnloaded() {
        this._ios.delegate = null;
        super.onUnloaded()
    }


    scrollToIndex(index) {
        if (this._ios) {
            this._ios.scrollToRowAtIndexPathAtScrollPositionAnimated(NSIndexPath.indexPathForItemInSection(index, 0), UITableViewScrollPosition.UITableViewScrollPositionTop, false);
        }
    }

    refresh() {
        this._map.forEach(function (view, nativeView, map) {
            if (!(view.bindingContext instanceof common.Observable)) {
                view.bindingContext = null;
            }
        });
        if (this.isLoaded) {
            this._ios.reloadData();
            this.requestLayout();
            this._isDataDirty = false;
        }
        else {
            this._isDataDirty = true;
        }

    }

    getHeightHeader(index) {        
        var height = this._heightsHeader[index] || DEFAULT_HEIGHT;
        return height
    }

    getHeightChild(headerIndex, index) {
        if(!this._heightsChild[headerIndex])
            return DEFAULT_HEIGHT

        return this._heightsChild[headerIndex][index] || DEFAULT_HEIGHT;
    }

    setHeightHeader(index, value) {
        this._heightsHeader[index] = value;
    }

    setHeightChild(headerIndex, index, value) {
        if(!this._heightsChild[headerIndex])
            this._heightsChild[headerIndex] = Array()
        this._heightsChild[headerIndex][index] = value;
    }

    _onRowHeightPropertyChanged(oldValue, newValue) {

        var value = this._effectiveRowHeight;

        var data = {
            oldValue: oldValue,
            newValue: newValue
        }

        if (value < 0) {
            this._nativeView.rowHeight = UITableViewAutomaticDimension;
            this._nativeView.estimatedRowHeight = DEFAULT_HEIGHT;
            this._delegate = UITableViewDelegateImpl.initWithOwner(new WeakRef(this));
        }
        else {
            this._nativeView.rowHeight = value;
            this._nativeView.estimatedRowHeight = value;
            this._delegate = UITableViewRowHeightDelegateImpl.initWithOwner(new WeakRef(this));
        }
        if (this.isLoaded) {
            this._nativeView.delegate = this._delegate;
        }
        super._onRowHeightPropertyChanged(oldValue, newValue);
    }

    requestLayout() {
        if (!this._preparingCell) {
            super.requestLayout()
        }
    }

    measure(widthMeasureSpec, heightMeasureSpec) {
        this.widthMeasureSpec = widthMeasureSpec;
        var changed = this._setCurrentMeasureSpecs(widthMeasureSpec, heightMeasureSpec);
        super.measure(widthMeasureSpec, heightMeasureSpec);
        if (changed) {
            this._ios.reloadData();
        }
    }

    _layoutCellHeader(cellView, indexPath) {
        if (cellView) {
            var rowHeight = this._effectiveRowHeight;
            var heightMeasureSpec = rowHeight >= 0 ? utils.layout.makeMeasureSpec(rowHeight, utils.layout.EXACTLY) : infinity;
            var measuredSize = view.View.measureChild(this, cellView, this.widthMeasureSpec, heightMeasureSpec);
            var height = measuredSize.measuredHeight;
            //var measuredSize = view.View.measureChild(this, cellView, this.widthMeasureSpec, infinity);
            //var height = measuredSize.measuredHeight;
            this.setHeightHeader(indexPath.section, height);
            return height;
        }
        return utils.layout.toDevicePixels(DEFAULT_HEIGHT);
    }

    _layoutCellChild(cellView, headerIndex, indexPath) {
        if (cellView) {

            var rowHeight = this._effectiveRowHeight 
            var heightMeasureSpec = rowHeight >= 0 ? utils.layout.makeMeasureSpec(rowHeight, utils.layout.EXACTLY) : infinity;
            var measuredSize = view.View.measureChild(this, cellView, this.widthMeasureSpec, heightMeasureSpec);
            var height = measuredSize.measuredHeight;

            //var measuredSize = view.View.measureChild(this, cellView, this.widthMeasureSpec, infinity);
            //var height = measuredSize.measuredHeight;
            this.setHeightChild(headerIndex, indexPath.row, height);
            return height;
        }
        return utils.layout.toDevicePixels(DEFAULT_HEIGHT);
    }

    _prepareCellChild(cell, indexPath) {
        var cellHeight;
        try {
            this._preparingCell = true;
            var view_1 = cell.view;
            if (!view_1) {
                view_1 = this._getItemChildTemplateContent(indexPath.row - 1).createView();                
            }
            var args = notifyForItemAtIndex(this, cell, view_1, ITEMLOADING, indexPath);
            view_1 = args.view || this._getDefaultItemChildContent(indexPath.row - 1).createView();
            if (view_1 instanceof proxy_view_container_1.ProxyViewContainer) {
                var sp = new stack_layout_1.StackLayout();
                sp.addChild(view_1);
                view_1 = sp;
            }
            if (!cell.view) {
                cell.owner = new WeakRef(view_1);
            }
            else if (cell.view !== view_1) {
                this._removeContainer(cell);
                cell.view.nativeViewProtected.removeFromSuperview();
                cell.owner = new WeakRef(view_1);
            }
            //var path = this._ios.indexPathForCell(cell);
            //var headerIndex = indexPath.section;
            this._prepareItemChild(view_1, indexPath.section, indexPath.row - 1);
            this._map.set(cell, view_1);
            if (view_1 && !view_1.parent) {
                this._addView(view_1);
                cell.contentView.addSubview(view_1.nativeViewProtected);  
                view_1.nativeViewProtected.backgroundColor = UIColor.clearColor              
            }
            cellHeight = this._layoutCellChild(view_1, indexPath.section, indexPath);
        }
        finally {
            this._preparingCell = false;
        }
        return cellHeight;
    }

    _prepareCellHeader(cell, indexPath) {
        var cellHeight;
        try {
            this._preparingCell = true;
            var view_1 = cell.view;
            if (!view_1) {
                view_1 = this._getItemHeaderTemplateContent(indexPath.section).createView();
            }
            var args = notifyForItemAtIndex(this, cell, view_1, ITEMLOADING, indexPath);
            view_1 = args.view || this._getDefaultItemHeaderContent(indexPath.section).createView();
            if (view_1 instanceof proxy_view_container_1.ProxyViewContainer) {
                var sp = new stack_layout_1.StackLayout();
                sp.addChild(view_1);
                view_1 = sp;
            }
            if (!cell.view) {
                cell.owner = new WeakRef(view_1);
            }
            else if (cell.view !== view_1) {
                this._removeContainer(cell);
                cell.view.nativeViewProtected.removeFromSuperview();
                cell.owner = new WeakRef(view_1);
            }
            this._prepareItemHeader(view_1, indexPath.section);
            this._map.set(cell, view_1);
            if (view_1 && !view_1.parent) {
                this._addView(view_1);
                cell.contentView.addSubview(view_1.nativeViewProtected);   
                view_1.nativeViewProtected.backgroundColor = UIColor.clearColor             
            }
            cellHeight = this._layoutCellHeader(view_1, indexPath);
        }
        finally {
            this._preparingCell = false;
        }
        return cellHeight;
    }

    _removeContainer(cell) {
        var view = cell.view;
        if (!(view.parent instanceof ExpandableListView)) {
            this._removeView(view.parent);
        }
        view.parent._removeView(view);
        this._map.delete(cell);
    }   

}

Object.defineProperty(ExpandableListView.prototype, "ios", {
    get: function () {
        return this._ios;
    },
    enumerable: true,
    configurable: true
})

Object.defineProperty(ExpandableListView.prototype, "_nativeView", {
    get: function () {
        return this._ios;
    },
    enumerable: true,
    configurable: true
})

Object.defineProperty(ExpandableListView.prototype, "_childrenCount", {
    get: function () {
        return this.items.length;
    },
    enumerable: true,
    configurable: true
})
