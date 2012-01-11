Quickstart
----------
	`$('form selector').grewform({
		//Все селекторы CSS/jQuery-совместимы. Селекторы по значению работаю всегда: 'input[value=foo]'
		'rule_selector' or 'rule_selector_1 AND rule_selector_2]://используйте AND для объеденения 2х условий
		{		
			show:'elements_selector',   //показать элементы (slideDown; slideUp при откате)
			hide:'elements_selector',    //спрятать элементы (slideUp; slideDown при откате)
			disable:'elements_selector' //добавляет disabled="disabled" к атрибутам элемента (убирает при откате)
			enable:'elements_selector' //убирает атрибут элемента disabled  (добавляет disabled="disabled" при откате)
			check:'elements_selector'  //добавляет checked="checked" к атрибутам элемента (убирает при откате)
			uncheck:'elements_selector' //убирает атрибут элемента checked  (добавляет checked="checked" при откате)
			set_value: {  //задаёт value для <input>, для <select> добавляет selected="selected" у соответствующего <option>
			  <select_1>:<value_1>,
                <select_2>:<value_2>,
                ...
            },
			add_options:            //добавляет <option> в <select>
			{
			    '<select> selector':{
					  'value_1':'display_value_1', //соответствует <option value="1">display_value_1</option>
					  'value_2':'display_value_2',
				  ...
				    }
			    or
			    '<select> selector': function   //должна возвращать объект (формат - {'value_1':'display_value_1',...})
			},
			custom:     //для особых случаев
			{
			    match:function,       //будет вызвана при срабатывании правила
			    unmatch:function,   //будет вызвана при откате
			}

	})`

	$().grewform.reset(); //сбросить все правила ("выключить" плагин)
	$().grewform.runRules(); //вручную запустить проверку правил

Загляните в [примеры](http://h1d.github.com/jquery-grewform/)

[Статья](http://habrahabr.ru/blogs/jquery/123940/) на хабре