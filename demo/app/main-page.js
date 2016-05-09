var observableModule = require("data/observable");
var ExpandableListItem = require("nativescript-expandable-list-view").ExpandableListItem;

var models = [
	{
		id: 1,
		title: "Item A",
		items: [
			{
				id: 1,
				title: 'Sub item A 1'
			},
			{
				id: 2,
				title: 'Sub item A 2'
			},
			{
				id: 3,
				title: 'Sub item A 3'
			},
		]
	}
]

var viewModel

exports.loaded = function(args) {
    var page = args.object;
    var items = []
    
    for(var i in models){

		var item = new ExpandableListItem({
			id: models[i].id,
			title: models[i].title,
			tag: models[i]
		})          

		for(var j in models[i].items){
			item.addItem(new ExpandableListItem({
				id: models[i].items[j].id,
				title: models[i].items[j].title,
				tag: models[i].items[j]
			}))
		}

		items.push(item)
    }    	

    viewModel = new observableModule.Observable({   
	  'items': items 
	})
    page.bindingContext = viewModel
}

exports.onGroupCollapse = function(){
	console.log("## onGroupCollapse")
}

exports.onGroupExpand = function(){
	console.log("## onGroupExpand")
}

exports.onChildTap = function(args){

	var groupItem = viewModel.get('items')[args.groupIndex]
	var childItem = groupItem.items[args.childIndex]

	alert('Click at group=' + groupItem.title + ', child=' + childItem.title)
}
