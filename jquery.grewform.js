var grewForms = {}

jQuery.fn.grewform = function(options){
    var rules =[]
    var form = jQuery(this)

    for (var rule_key in options)
    {
        var rule = new Rule(rule_key,form,options[rule_key])
        rules[rule_key] = rule
    }

    grewForms[this] = rules

    return $(this).change(function(eventObj){
        for(var i in rules)
            (function(form,rule,eventObj){
                 var wait = setInterval(
                     function() {
                         if( !form.find().is(":animated"))
                         {
                             clearInterval(wait);
                             if(rule.trigged && form.find(rule.selector).length == 0)
                                 rule.run_unmatch_actions()
                             else if((!rule.trigged))
                             {
                                 //('option:visible') always return nothing
                                 if(form.find(rule.selector).filter('option').length > 0)
                                 {
                                    if(form.find(rule.selector).parent('select:visible').length > 0)
                                        rule.run_match_actions()
                                 }
                                 else if(form.find(rule.selector).filter(':visible').length > 0)
                                    rule.run_match_actions()
                             }
                         }
                     },
                     200
                 )
            }(form,rules[i],eventObj))
    });
};

function debug(str)
{
    console.log('jQuery.brForms:'+str)
}

//constructor for rules
function Rule(selector,form,raw_rule){
    if ( typeof Rule.id == 'undefined' )
    {
        //unique id for rules
        Rule.id=0
        //special blip to mark DOM elements witch invoke rule actions
        Rule.blip_ptr = 'rule'
        //function for cascade unmatch
        Rule.unmtach_by_blip = function(blip){
                                   for(var k in Rule.all)
                                       if(Rule.all[k].blip === blip)
                                       {
                                           debug('unmtach_by_blip '+blip)
                                           Rule.all[k].run_unmatch_actions()
                                       }
                               }

        //All rules (hello Django:])
        Rule.all = []
    }

    this.id = Rule.id++
    this.blip = Rule.blip_ptr+this.id
    this.selector = selector          //selector of the rule
    this.trigged = false       //indicates is rule trigged or not
    this.match_actions = []
    this.unmatch_actions = []
    this.raw = raw_rule
    this.form = form

    //extract actions
    for(var action_key in raw_rule)
        generate_actions(action_key,form,this)

    debug('created rule: '+this.selector +'['+ this.match_actions.length +'|'+this.unmatch_actions.length+']')

    this.run_match_actions = function(){
        debug('match: '+this.selector)

        this.trigged = true
        //mark elements that rule trigged, it's need for cascade actions
        this.form.find(this.selector).addClass(this.blip)
        for(var c in this.match_actions)
            this.match_actions[c].call(this)
    }

    this.run_unmatch_actions = function(){
        debug('unmatch: '+this.selector)

        this.trigged = false
        jQuery('.'+this.blip).removeClass(this.blip)
        for(var c in this.unmatch_actions)
            this.unmatch_actions[c].call(this)
    }

    Rule.all.push(this)
}

function generate_actions(key,form,rule)
{
    //genereting different actions
    switch(key){
        case 'show':
            rule.match_actions.push(
                function(elems,ruleId){
                    return function(){
                        debug('show action');
                        elems.slideDown();
                    }
                }(form.children(rule.raw[key]),rule.id)
            )

            rule.unmatch_actions.push(
                function(elems,ruleId){
                    return function(){
                        debug('show action rollback');
                        cascade_unmatch(elems);
                        elems.slideUp();
                    }
                }(form.children(rule.raw[key]),rule.id)
            )
            break
        case 'hide':
            rule.match_actions.push(
                function(elems){
                    return function(){
                        debug('hide action');
                        elems.slideUp();
                    }
                }(form.children(rule.raw[key]))
            )

            rule.unmatch_actions.push(
                function(elems){
                    return function(){
                        debug('hide action rollback');
                        cascade_unmatch(elems);
                        elems.slideDown();
                    }
                }(form.children(rule.raw[key]))
            )
            break
        case 'add_options':
            for (var selector in rule.raw[key])
                for(var v in rule.raw[key][selector]){
                    rule.match_actions.push(
                        function(e,selector,v,h){
                             return function(){
                                 debug('add_options action')
                                 var selects = e.find(selector)
                                 jQuery('<option></option>').html(h)
                                              .val(v)
                                              .appendTo(selects);
                             }
                        }(form,selector,v,rule.raw[key][selector][v])
                    )
                    rule.unmatch_actions.push(
                        function(e,selector,v){
                             return function(){
                                 debug('add_options action rollback');
                                 cascade_unmatch(e.children(selector).children('option[value='+v+']'))
                                 e.find(selector).children().remove('option[value='+v+']')
                             }
                        }(form,selector,v)
                    )
                }
            break
        case 'custom':
            rule.match_actions.push(
                function(fn,context){
                    return function(){fn.call(context)}
                }(rule[key]['match'],jQuery(rule.selector))
            )

            rule.unmatch_actions.push(
                function(fn,context){
                    return function(){fn.call(context)}
                }(rule[key]['unmatch'],jQuery(rule.selector))
            )
            break
    }
}

function cascade_unmatch(elements)
{
    jQuery.each(elements,function(k,v){
        var classes = jQuery(this).attr('class').split(' ')
        jQuery.each(classes,function(k,v){
            Rule.unmtach_by_blip(v)
        })
        cascade_unmatch(elements.children())
    })
}