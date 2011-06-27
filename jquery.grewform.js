/*!
 * jQuery GrewForm Plugin v0.0.1
 *
 * Copyright 2011, Artem Suschev
 * Grandcapital Ltd.
 */

jQuery.fn.grewform = function(options){

    //this will allow selectors like 'input[value=foo]' to work with all jQuery versions
    $('input').bind('keyup change',function() {
        $(this).attr('value',this.value)
    });


    var form = jQuery(this)

    for (var rule_key in options)
    {
        var rule_keys = arrayfy(rule_key)
        for (var i in rule_keys)
            var rule = new Rule(rule_keys[i],form,options[rule_key])
    }

    //run in 300ms after keyup
    form.find('*').keyup(function(){
        var wait = setInterval(function(){
            clearInterval(wait)
            run_rules()
        },
        300)
    });

    //run on DOM loaded
    $(document).ready(function(){
        run_rules()
    });

    //run after every change
    return form.find('*').change(function(){
        run_rules()
    });
};

function debug(str)
{
    console.log('jQuery.brForms >>> '+str)
}

function run_rules(){
    //debug(checking rules')

    //first run all unmatch actions
    for(var i in Rule.all)
            (function(rule){
                 var wait = setInterval(
                     function() {
                         if( !rule.form.find('*').is(":animated"))
                         {
                             clearInterval(wait);
                             if(rule.trigged && rule.form.find(rule.selector).length == 0)
                                 rule.run_unmatch_actions()
                         }
                     },
                     200
                 )
            }(Rule.all[i]))

    //then run all math actions
    for(var i in Rule.all)
            (function(rule){
                 var wait = setInterval(
                     function() {
                         if( !rule.form.find('*').is(":animated"))
                         {
                             clearInterval(wait);
                             if((!rule.trigged))
                             {
                                 //('option:visible') always return nothing
                                 if(rule.form.find(rule.selector).filter('option').length > 0)
                                 {
                                    if(rule.form.find(rule.selector).parent('select:visible').length > 0)
                                        rule.run_match_actions()
                                 }
                                 else if(rule.form.find(rule.selector).filter(':visible').length > 0)
                                    rule.run_match_actions()
                             }
                         }
                     },
                     200
                 )
            }(Rule.all[i]))
}

//constructor for rules
function Rule(selector,form,raw_rule){
    if ( typeof Rule.id == 'undefined' )
    {
        //unique id for rules
        Rule.id=0
        //special blip to mark DOM elements witch invoke rule actions
        Rule.blip_ptr = 'hgo_grewform_rule'
        //function for cascade unmatch
        Rule.unmtach_by_blip = function(blip){
                                   for(var k in Rule.all)
                                       if(Rule.all[k].blip === blip)
                                       {
                                           //debug('unmtach_by_blip '+blip)
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

    //debug('created rule: '+this.selector +'['+ this.match_actions.length +'|'+this.unmatch_actions.length+']')

    this.run_match_actions = function(){
        //debug('match: '+this.selector)

        this.trigged = true
        //mark elements that rule trigged, it's need for cascade actions
        this.form.find(this.selector).addClass(this.blip)
        for(var c in this.match_actions)
            this.match_actions[c].call(this)
    }
    this.run_match_actions.first_run = true

    this.run_unmatch_actions = function(){
        //debug('unmatch: '+this.selector)

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
                function(elems){
                    return function(){
                        //debug('show action');
                        elems.slideDown();
                    }
                }(form.find(rule.raw[key]))
            )

            rule.unmatch_actions.push(
                function(elems){
                    return function(){
                        //debug('show action rollback');
                        cascade_unmatch(elems);
                        elems.slideUp();
                    }
                }(form.find(rule.raw[key]))
            )
            break
        case 'hide':
            rule.match_actions.push(
                function(elems){
                    return function(){
                        //debug('hide action');
                        elems.slideUp();
                    }
                }(form.find(rule.raw[key]))
            )

            rule.unmatch_actions.push(
                function(elems){
                    return function(){
                        //debug('hide action rollback');
                        cascade_unmatch(elems);
                        elems.slideDown();
                    }
                }(form.find(rule.raw[key]))
            )
            break
        case 'set_value':
            rule.match_actions.push(
                function(values){
                    return function(){
                        //debug('value action');

                        var rule=this
                        jQuery.each(values,function(selector,value){
                            jQuery.each(rule.form.find(selector),function(){
                                var tagName = $(this).tagName

                                if(tagName == 'select')
                                {
                                     elems.find('option').removeAttr('selected')
                                     elems.find('option [value='+value+']').attr('selected','selected')
                                }
                                else
                                    $(this).val(value)
                            })
                        })
                    }
                }(rule.raw[key]))
            break
        case 'add_options':
            for (var selector in rule.raw[key])
            {
                var options = rule.raw[key][selector]

                if(typeof options == 'function')
                {
                    rule.match_actions.push(
                        function(e,selector,fn){
                             return function(){
                                 var options = fn()
                                 for(var v in options){
                                     //debug('add_options action')
                                     var selects = e.find(selector)
                                     jQuery('<option></option>').html(options[v])
                                                  .val(v)
                                                  .appendTo(selects);
                                 }

                                 //small trick with callable options:
                                 //we should determine what to remove from DOM right after we add it!
                                 if(this.run_match_actions.first_run){
                                     for(var v in options)
                                        this.unmatch_actions.push(
                                            function(e,selector,v){
                                                 return function(){
                                                     //debug('add_options action rollback');
                                                     cascade_unmatch(e.children(selector).children('option[value='+v+']'))
                                                     e.find(selector).children().remove('option[value='+v+']')
                                                 }
                                            }(form,selector,v)
                                     )
                                     //for adding unmatch actions only once!
                                     this.run_match_actions.first_run = false
                                 }
                             }
                        }(form,selector,options)
                    )
                }
                else{
                    for(var v in options){
                        rule.match_actions.push(
                            function(e,selector,v,h){
                                 return function(){
                                     //debug('add_options action')
                                     var selects = e.find(selector)
                                     jQuery('<option></option>').html(h)
                                                  .val(v)
                                                  .appendTo(selects);
                                 }
                            }(form,selector,v,options[v])
                        )
                        rule.unmatch_actions.push(
                            function(e,selector,v){
                                 return function(){
                                     //debug('add_options action rollback');
                                     cascade_unmatch(e.children(selector).children('option[value='+v+']'))
                                     e.find(selector).children().remove('option[value='+v+']')
                                 }
                            }(form,selector,v)
                        )
                    }
                }
            }
            break
        case 'disable':
            rule.match_actions.push(
                function(elems){
                    return function(){
                        //debug('disable action');
                        elems.attr('disabled','disabled');
                    }
                }(form.find(rule.raw[key]))
            )

            rule.unmatch_actions.push(
                function(elems){
                    return function(){
                        //debug('disable action rollback');
                        cascade_unmatch(elems);
                        elems.removeAttr('disabled');
                    }
                }(form.find(rule.raw[key]))
            )
            break
        case 'custom':
            rule.match_actions.push(
                function(fn,context){
                    return function(){fn.call(context)}
                }(rule.raw[key]['match'],jQuery(rule.selector))
            )

            rule.unmatch_actions.push(
                function(fn,context){
                    return function(){fn.call(context)}
                }(rule.raw[key]['unmatch'],jQuery(rule.selector))
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

function arrayfy(obj)
{
    if(obj.constructor != Array)
        return [obj];

    return obj;
}