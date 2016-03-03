var common = require("./expandable-list-view-common");
var layoutBaseModule = require("ui/layouts/layout-base");
var stackLayout = require("ui/layouts/stack-layout");
var color = require("color");
var ITEMLOADING = common.ExpandableListView.itemLoadingEvent;
var LOADMOREITEMS = common.ExpandableListView.loadMoreItemsEvent;
var GROUPEXPAND = common.ExpandableListView.groupExpandEvent;
var GROUPCOLLAPSE = common.ExpandableListView.groupCollapseEvent;
var CHILDITEMTAP = common.ExpandableListView.childTapEvent;
var REALIZED_INDEX = "realizedIndex";
global.moduleMerge(common, exports);
function onSeparatorColorPropertyChanged(data) {
    var bar = data.object;
    if (!bar.android) {
        return;
    }
    if (data.newValue instanceof color.Color) {
        bar.android.setDivider(new android.graphics.drawable.ColorDrawable(data.newValue.android));
        bar.android.setDividerHeight(1);
    }
}
common.ExpandableListView.separatorColorProperty.metadata.onSetNativeValue = onSeparatorColorPropertyChanged;
var ExpandableListView = (function (_super) {
    __extends(ExpandableListView, _super);
    function ExpandableListView() {
        _super.apply(this, arguments);
        this._realizedItemsHeader = {};
        this._realizedItemsChild = {};
    }
    ExpandableListView.prototype._createUI = function () {
        this._android = new android.widget.ExpandableListView(this._context);
        this._android.setCacheColorHint(android.graphics.Color.TRANSPARENT);
        if (!this._androidViewId) {
            this._androidViewId = android.view.View.generateViewId();
        }
        this._android.setId(this._androidViewId);
        this.android.setAdapter(new ExpandableListViewAdapter(this));
        var that = new WeakRef(this);
        this.android.setOnScrollListener(new android.widget.AbsListView.OnScrollListener({
            onScrollStateChanged: function (view, scrollState) {
                var owner = this.owner;
                if (!owner) {
                    return;
                }
                if (scrollState === android.widget.AbsListView.OnScrollListener.SCROLL_STATE_IDLE) {
                    owner._setValue(common.ExpandableListView.isScrollingProperty, false);
                    owner._notifyScrollIdle();
                }
                else {
                    owner._setValue(common.ExpandableListView.isScrollingProperty, true);
                }
            },
            onScroll: function (view, firstVisibleItem, visibleItemCount, totalItemCount) {
                var owner = this.owner;
                if (!owner) {
                    return;
                }
                if (totalItemCount > 0 && firstVisibleItem + visibleItemCount === totalItemCount) {
                    owner.notify({ eventName: LOADMOREITEMS, object: owner });
                }
            },
            get owner() {
                return that.get();
            }
        }));
        this.android.setOnItemClickListener(new android.widget.AdapterView.OnItemClickListener({
            onItemClick: function (parent, convertView, index, id) {
            }
        }));

        this.android.setOnChildClickListener(new android.widget.ExpandableListView.OnChildClickListener({
            onChildClick: function(parent, convertView, groupPosition, childPosition, id){
                var owner = that.get();
                if (owner) {
                    owner.notify({ eventName: CHILDITEMTAP, object: owner, groupIndex: groupPosition, childIndex: childPosition, view: owner._getRealizedChildView(convertView, groupPosition, childPosition) });
                }
                return true
            }
        }))


        this.android.setOnGroupCollapseListener(new android.widget.ExpandableListView.OnGroupCollapseListener({
            onGroupCollapse: function(groupPosition){
                var owner = that.get();
                if (owner) {
                    owner.notify({ eventName: GROUPCOLLAPSE, object: owner, index: groupPosition, view: owner._getRealizedHeaderView(null, groupPosition) });
                }
            }
        }))
        
        this.android.setOnGroupExpandListener(new android.widget.ExpandableListView.OnGroupExpandListener({
            onGroupExpand: function(groupPosition){
                var owner = that.get();
                if (owner) {
                    owner.notify({ eventName: GROUPEXPAND, object: owner, index: groupPosition, view: owner._getRealizedHeaderView(null, groupPosition) });
                }
            }
        }))
            
    };
    Object.defineProperty(ExpandableListView.prototype, "android", {
        get: function () {
            return this._android;
        },
        enumerable: true,
        configurable: true
    });
    ExpandableListView.prototype.refresh = function () {
        if (!this._android || !this._android.getAdapter()) {
            return;
        }
        this.android.getAdapter().notifyDataSetChanged();
    };
    ExpandableListView.prototype.scrollToIndex = function (index) {
        if (this._android) {
            this._android.setSelection(index);
        }
    };
    ExpandableListView.prototype._onDetached = function (force) {
        _super.prototype._onDetached.call(this, force);
        var keys = Object.keys(this._realizedItemsHeader);
        var i;
        var length = keys.length;
        var view;
        var key;
        for (i = 0; i < length; i++) {
            key = keys[i];
            view = this._realizedItemsHeader[key];
            view.parent._removeView(view);
            delete this._realizedItemsHeader[key];
        }

        keys = Object.keys(this._realizedItemsChild);
        length = keys.length;

        for (i = 0; i < length; i++) {
            key = keys[i];
            view = this._realizedItemsChild[key];
            view.parent._removeView(view);
            delete this._realizedItemsChild[key];
        }

    };

    ExpandableListView.prototype._getRealizedHeaderView = function (convertView, index) {
        if (!convertView) {
            return this._getItemHeaderTemplateContent(index);
        }
        return this._realizedItemsHeader[convertView.hashCode()];
    };

    ExpandableListView.prototype._getRealizedChildView = function (convertView, index) {
        if (!convertView) {
            return this._getItemChildTemplateContent(index);
        }
        return this._realizedItemsChild[convertView.hashCode()];
    };

    ExpandableListView.prototype._notifyScrollIdle = function () {
        var keys = Object.keys(this._realizedItemsHeader);
        var i;
        var length = keys.length;
        var view;
        var key;
        for (i = 0; i < length; i++) {
            key = keys[i];
            view = this._realizedItemsHeader[key];
            this.notify({
                eventName: ITEMLOADING,
                object: this,
                index: view[REALIZED_INDEX],
                view: view
            });
        }

        keys = Object.keys(this._realizedItemsChild);        
        length = keys.length;
        for (i = 0; i < length; i++) {
            key = keys[i];
            view = this._realizedItemsChild[key];
            this.notify({
                eventName: ITEMLOADING,
                object: this,
                index: view[REALIZED_INDEX],
                view: view
            });
        }        
    };
    return ExpandableListView;
})(common.ExpandableListView);

exports.ExpandableListView = ExpandableListView;

var ExpandableListViewAdapter = (function (_super) {
    __extends(ExpandableListViewAdapter, _super);

    // listDataHeader: header titles
    // listDataChild: child data in format of header title, child title
    function ExpandableListViewAdapter(listView) {
        _super.call(this);
        this._listView = listView;
        this._context = this._listView._context        
        return global.__native(this);
    }
    
    ExpandableListViewAdapter.prototype.getChild = function(groupPosition, childPosititon) {
        var dataHeader = this._listView.items[groupPosition];
        var dataChild = dataHeader.getItem(childPosititon);
        return dataChild;
    }
 
    ExpandableListViewAdapter.prototype.getChildId = function(groupPosition, childPosition) {
        return childPosition;
    }
     
    ExpandableListViewAdapter.prototype.getChildView = function(groupPosition, childPosition, isLastChild, convertView, parent) {
                
        if (!this._listView) {
            return null;
        }
        var view = this._listView._getRealizedChildView(convertView, childPosition);
        var args = {
            eventName: ITEMLOADING, object: this._listView, index: childPosition, view: view,
            android: parent,
            ios: undefined
        };
        this._listView.notify(args);
        if (!args.view) {
            args.view = this._listView._getDefaultItemChildContent(childPosition);
        }
        if (args.view) {
            if (this._listView.rowHeight > -1) {
                args.view.height = this._listView.rowHeight;
            }
            else {
                args.view.height = Number.NaN;
            }
            this._listView._prepareItemChild(args.view, groupPosition, childPosition);
            if (!args.view.parent) {
                if (args.view instanceof layoutBaseModule.LayoutBase) {
                    this._listView._addView(args.view);
                    convertView = args.view.android;
                }
                else {
                    var sp = new stackLayout.StackLayout();
                    sp.addChild(args.view);
                    this._listView._addView(sp);
                    convertView = sp.android;
                }
            }
            this._listView._realizedItemsChild[convertView.hashCode()] = args.view;
            args.view[REALIZED_INDEX] = childPosition;
        }
        return convertView;
    }
 
    ExpandableListViewAdapter.prototype.getChildrenCount = function(groupPosition) {
        var dataHeader = this._listView.items[groupPosition]
        return dataHeader.getItemsCount()
    }
     
    ExpandableListViewAdapter.prototype.getGroup = function(groupPosition) {
        return this._listView.items[groupPosition];
    }
 
    ExpandableListViewAdapter.prototype.getGroupCount = function() {        
        return (this._listView && this._listView.items) ? this._listView.items.length : 0;
    }
     
    ExpandableListViewAdapter.prototype.getGroupId = function(groupPosition) {
        return groupPosition;
    }
 
    ExpandableListViewAdapter.prototype.getGroupView = function(groupPosition, isExpanded, convertView, parent) {
        
        if (!this._listView) {
            return null;
        }
        var dataHeader = this._listView._getDataItemHeader(groupPosition)

        var view = this._listView._getRealizedHeaderView(convertView, groupPosition);
        var args = {
            eventName: ITEMLOADING, object: this._listView, index: groupPosition, view: view,
            android: parent,
            ios: undefined
        };
        this._listView.notify(args);
        if (!args.view) {
            args.view = this._listView._getDefaultItemHeaderContent(groupPosition);
        }
        if (args.view) {
            if (this._listView.rowHeight > -1) {
                args.view.height = this._listView.rowHeight;
            }
            else {
                args.view.height = Number.NaN;
            }
            this._listView._prepareItemHeader(args.view, groupPosition);
            if (!args.view.parent) {
                if (args.view instanceof layoutBaseModule.LayoutBase) {
                    this._listView._addView(args.view);
                    convertView = args.view.android;
                }
                else {
                    var sp = new stackLayout.StackLayout();
                    sp.addChild(args.view);
                    this._listView._addView(sp);
                    convertView = sp.android;
                }
            }
            this._listView._realizedItemsHeader[convertView.hashCode()] = args.view;
            args.view[REALIZED_INDEX] = groupPosition;
        }


        if(dataHeader.isExpanded()){
            // set and disable
            parent.expandGroup(groupPosition);            
            dataHeader.setExpanded(false)
        }

        return convertView;
    }
 
    ExpandableListViewAdapter.prototype.hasStableIds = function() {
        return false;
    }
     
    ExpandableListViewAdapter.prototype.isChildSelectable = function(groupPosition, childPosition) {
        return true;
    }

    return ExpandableListViewAdapter;
})(android.widget.BaseExpandableListAdapter);
