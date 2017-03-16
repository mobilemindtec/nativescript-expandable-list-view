var common = require("./expandable-list-view-common");
var utils = require("utils/utils");
var view = require("ui/core/view");
var stack_layout_1 = require("ui/layouts/stack-layout");
var proxy_view_container_1 = require("ui/proxy-view-container");
var color;
function ensureColor() {
    if (!color) {
        color = require("color");
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
global.moduleMerge(common, exports);
var infinity = utils.layout.makeMeasureSpec(0, utils.layout.UNSPECIFIED);
var expandableSections = NSMutableIndexSet.alloc().init()

var ListViewCell = (function (_super) {
    __extends(ListViewCell, _super);
    function ListViewCell() {
        _super.apply(this, arguments);
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
        _super.apply(this, arguments);
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


        var owner = this._owner.get();
        if (owner) {
            owner._prepareCellChild(cell, indexPath);
            var cellView = cell.view;
            if (cellView) {
                var width = utils.layout.getMeasureSpecSize(owner.widthMeasureSpec);
                var rowHeight = owner._nativeView.rowHeight;

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

        var indexPath = NSIndexPath.indexPathForRowInSection(-1, section)
        var owner = this._owner.get();
        if (owner) {
            owner._prepareCellHeader(cell, indexPath);
            var cellView = cell.view;
            if (cellView) {
                var width = utils.layout.getMeasureSpecSize(owner.widthMeasureSpec);
                var rowHeight = owner._nativeView.rowHeight;
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
        _super.apply(this, arguments);
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
            return 44;
        }
        var height = undefined;
        var thisIsHeader = indexPath.row == 0
        if (utils.ios.MajorVersion >= 8) {
            if(thisIsHeader)
                height = owner.getHeightHeader(indexPath.section);
            else
                height = owner.getHeightChild(indexPath.section,  indexPath.row);
        }
        if (utils.ios.MajorVersion < 8 || height === undefined) {
            var cell = this._measureCell;
            if (!cell) {
                this._measureCell = tableView.dequeueReusableCellWithIdentifier(CELLIDENTIFIER);

                if (!this._measureCell) {
                    this._measureCell = new ListViewCell().initWithStyleReuseIdentifier(UITableViewCellStyleValue1, CellIdentifier);
                }

                //this._measureCell = cell
                cell = this._measureCell;
            }
            if(thisIsHeader)
                height = owner._prepareCellHe(cell, indexPath);
            else
                height = owner._prepareCellChild(cell, indexPath);
        }

        return height;
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
        _super.apply(this, arguments);
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

        return owner.rowHeight;
    };

    UITableViewRowHeightDelegateImpl.ObjCProtocols = [UITableViewDelegate];
    return UITableViewRowHeightDelegateImpl;
}(NSObject));

function onSeparatorColorPropertyChanged(data) {
    var bar = data.object;
    if (!bar.ios) {
        return;
    }
    ensureColor();
    if (data.newValue instanceof color.Color) {
        bar.ios.separatorColor = data.newValue.ios;
    }
}

common.ExpandableListView.separatorColorProperty.metadata.onSetNativeValue = onSeparatorColorPropertyChanged;

var ExpandableListView = (function (_super) {
    __extends(ExpandableListView, _super);
    function ExpandableListView() {
        _super.call(this);
        this._preparingCell = false;
        this._isDataDirty = false;
        this.widthMeasureSpec = 0;

        var mainScreen = utils.ios.getter(UIScreen, UIScreen.mainScreen);        
        this._ios = NSExpandableTableView.alloc().initWithFrameStyle(mainScreen.bounds, UITableViewStylePlain);
        this._ios.registerClassForCellReuseIdentifier(ListViewCell.class(), CELLIDENTIFIER);
        this._ios.autoresizingMask = UIViewAutoresizing.UIViewAutoresizingNone;
        this._ios.estimatedRowHeight = DEFAULT_HEIGHT;
        this._ios.rowHeight = UITableViewAutomaticDimension;
        this._ios.dataSource = this._dataSource = DataSource.initWithOwner(new WeakRef(this));
        this._ios.delegate = this._delegate = UITableViewDelegateImpl.initWithOwner(new WeakRef(this));
        this._heightsHeader = new Array();
        this._heightsChild = new Array();
        this._map = new Map();
    }

    ExpandableListView.prototype.onLoaded = function () {
        _super.prototype.onLoaded.call(this);
        if (this._isDataDirty) {
            this.refresh();
        }
        this._ios.delegate = this._delegate;
    };
    ExpandableListView.prototype.onUnloaded = function () {
        this._ios.delegate = null;
        _super.prototype.onUnloaded.call(this);
    };
    Object.defineProperty(ExpandableListView.prototype, "ios", {
        get: function () {
            return this._ios;
        },
        enumerable: true,
        configurable: true
    });
    ExpandableListView.prototype.scrollToIndex = function (index) {
        if (this._ios) {
            this._ios.scrollToRowAtIndexPathAtScrollPositionAnimated(NSIndexPath.indexPathForItemInSection(index, 0), UITableViewScrollPosition.UITableViewScrollPositionTop, false);
        }
    };
    ExpandableListView.prototype.refresh = function () {
        if (this.isLoaded) {
            this._ios.reloadData();
            this.requestLayout();
            this._isDataDirty = false;
        }
        else {
            this._isDataDirty = true;
        }
    };
    ExpandableListView.prototype.getHeightHeader = function (index) {
        var height = this._heightsHeader[index] || DEFAULT_HEIGHT;
        return height
    };
    ExpandableListView.prototype.getHeightChild = function (headerIndex, index) {
        if(!this._heightsChild[headerIndex])
            return DEFAULT_HEIGHT

        return this._heightsChild[headerIndex][index] || DEFAULT_HEIGHT;
    };
    ExpandableListView.prototype.setHeightHeader = function (index, value) {
        this._heightsHeader[index] = value;
    };
    ExpandableListView.prototype.setHeightChild = function (headerIndex, index, value) {
        if(!this._heightsChild[headerIndex])
            this._heightsChild[headerIndex] = Array()
        this._heightsChild[headerIndex][index] = value;
    };
    ExpandableListView.prototype._onRowHeightPropertyChanged = function (data) {

        if (data.newValue < 0) {
            this._nativeView.rowHeight = UITableViewAutomaticDimension;
            this._nativeView.estimatedRowHeight = DEFAULT_HEIGHT;
            this._delegate = UITableViewDelegateImpl.initWithOwner(new WeakRef(this));
        }
        else {
            this._nativeView.rowHeight = data.newValue;
            this._nativeView.estimatedRowHeight = data.newValue;
            this._delegate = UITableViewRowHeightDelegateImpl.initWithOwner(new WeakRef(this));
        }
        if (this.isLoaded) {
            this._nativeView.delegate = this._delegate;
        }
        _super.prototype._onRowHeightPropertyChanged.call(this, data);
    };
    ExpandableListView.prototype.requestLayout = function () {
        if (!this._preparingCell) {
            _super.prototype.requestLayout.call(this);
        }
    };
    ExpandableListView.prototype.measure = function (widthMeasureSpec, heightMeasureSpec) {
        this.widthMeasureSpec = widthMeasureSpec;
        var changed = this._setCurrentMeasureSpecs(widthMeasureSpec, heightMeasureSpec);
        _super.prototype.measure.call(this, widthMeasureSpec, heightMeasureSpec);
        if (changed) {
            this._ios.reloadData();
        }
    };
    ExpandableListView.prototype._layoutCellHeader = function (cellView, indexPath) {
        if (cellView) {
            var measuredSize = view.View.measureChild(this, cellView, this.widthMeasureSpec, infinity);
            var height = measuredSize.measuredHeight;
            this.setHeightHeader(indexPath.section, height);
            return height;
        }
        return 0;
    };
    ExpandableListView.prototype._layoutCellChild = function (cellView, headerIndex, indexPath) {
        if (cellView) {
            var measuredSize = view.View.measureChild(this, cellView, this.widthMeasureSpec, infinity);
            var height = measuredSize.measuredHeight;
            this.setHeightChild(headerIndex, indexPath.row, height);
            return height;
        }
        return 0;
    };
    ExpandableListView.prototype._prepareCellChild = function (cell, indexPath) {

        var cellHeight;
        try {
            this._preparingCell = true;
            var view_1 = cell.view;
            if (!view_1) {
                view_1 = this._getItemChildTemplateContent(indexPath.row - 1);
            }
            var args = notifyForItemAtIndex(this, cell, view_1, ITEMLOADING, indexPath);
            view_1 = args.view || this._getDefaultItemChildContent(indexPath.row - 1);
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
                cell.view._nativeView.removeFromSuperview();
                cell.owner = new WeakRef(view_1);
            }
            //var path = this._ios.indexPathForCell(cell);
            //var headerIndex = indexPath.section;
            this._prepareItemChild(view_1, indexPath.section, indexPath.row - 1);
            this._map.set(cell, view_1);
            if (view_1 && !view_1.parent && view_1._nativeView) {
                cell.contentView.addSubview(view_1._nativeView);
                this._addView(view_1);
            }
            cellHeight = this._layoutCellChild(view_1, indexPath.section, indexPath);
        }
        finally {
            this._preparingCell = false;
        }
        return cellHeight;
    };
    ExpandableListView.prototype._prepareCellHeader = function (cell, indexPath) {

        var cellHeight;
        try {
            this._preparingCell = true;
            var view_1 = cell.view;
            if (!view_1) {
                view_1 = this._getItemHeaderTemplateContent(indexPath.section);
            }
            var args = notifyForItemAtIndex(this, cell, view_1, ITEMLOADING, indexPath);
            view_1 = args.view || this._getDefaultItemHeaderContent(indexPath.section);
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
                cell.view._nativeView.removeFromSuperview();
                cell.owner = new WeakRef(view_1);
            }
            this._prepareItemHeader(view_1, indexPath.section);
            this._map.set(cell, view_1);
            if (view_1 && !view_1.parent && view_1._nativeView) {
                cell.contentView.addSubview(view_1._nativeView);
                this._addView(view_1);
            }
            cellHeight = this._layoutCellHeader(view_1, indexPath);
        }
        finally {
            this._preparingCell = false;
        }
        return cellHeight;
    };
    ExpandableListView.prototype._removeContainer = function (cell) {
        this._removeView(cell.view);
        this._map.delete(cell);
    };
    return ExpandableListView;
}(common.ExpandableListView));
exports.ExpandableListView = ExpandableListView;
