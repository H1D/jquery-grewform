Quickstart
----------
	`$('form selector').grewform({
		//Selectors are jQuery and CSS3 compatible. You can select inputs by values setted runtime: 'input[value=foo]'
		'rule_selector' or ['rule_selector_1','rule_selector_2']: //if array rule will be created for each selector
		{		
			//all actions are optional and rolls back automatically
			show:'elements_selector',	//showing elements
			hide:'elements_selector',	//hiding elements
			disable:'elements selecotr'	//adding disabled="disabled" to attributes
			set_value:<elements_selector>,	//setting value (<input> and <select> are supported)
			add_options: 			//for adding options to selects
			{
				'<select> selector':{
		                      <value_1>:<display_value_1>,
		                      <value_2>:<display_value_2>,
				      ...
		              	}
				or
				'<select> selector': function	//should return obj formatted like described above
			},
			custom:		//for custom actions
			{
				match:function,		//will be called when rule selector matches at least one element
				unmatch:function,	//will be called when rule selector matches nothing
			}

	})`
Check out demo.html



