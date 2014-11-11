Quickstart
----------
	`$('form selector').grewform({
		//Selectors are CSS/jQuery compatible. You can select inputs by values setted runtime: 'input[value=foo]'
		'rule_selector' or 'rule_selector_1 AND rule_selector_2]:
		{		
			//all actions are optional and rolls back automatically
			show:'elements_selector',	//showing elements (slideDown; slideUp on rollback)
			hide:'elements_selector',	//hiding elements (slideUp; slideDown on rollback)
			disable:'elements selecotr'	//adding disabled="disabled" to attributes (remove on rollback)
			enable:'elements selecotr'	//removing disabled from attributes (adding on rollback)
			check:'elements selecotr'	//adding disabled="checked" to attributes (remove on rollback)
			uncheck:'elements selecotr'	//removing "checked" from attributes (adding on rollback)
			set_value: { //setting value (<input> and <select> are supported, setting "selected" for <option> matched by value; restoring values on rollback)
                <select_1>:<value_1>,
                <select_2>:<value_2>,
                ...
            },
            set_html: { //setting html (restoring html on rollback)
                <select_1>:<html_1>,
                <select_2>:<html_2>,
                ...
            },
			add_options: { 			//for adding options to selects
				'<select> selector':{
		                      <value_1>:<display_value_1>,
		                      <value_2>:<display_value_2>,
				      ...
		              	}
				or
				'<select> selector': function	//should return obj formatted like described above
			},
			custom: {		//for custom actions
				match:function,		//will be called when rule selector matches at least one element
				unmatch:function,	//will be called on rollback
			}

	})`

	$().grewform.reset(); // reset all rules (i.e. turn off)
	$().grewform.runRules(); //manualy run rules

##Requirements
 jQuery 1.7 or more

Check out [demos](http://h1d.github.com/jquery-grewform/)

More help in [article(RUS)](http://habrahabr.ru/blogs/jquery/123940/)
