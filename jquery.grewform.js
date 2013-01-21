/*!
 * jQuery GrewForm Plugin v0.4.0.1
 *
 * Copyright 2011, Artem Suschev
 * Grandcapital Ltd.
 *
 * Licensed under the MIT license (license.txt)
 */
(function() {
    jQuery.fn.grewform = function(rules, options) {

        //this will allow selectors like 'input[value=foo]' to work with all jQuery versions
        jQuery('input,textarea').live('keyup change', function(e) {
            var ignore_codes = [16,9,33,34,36,35,45,38,40,37,39];//arrows and others
            if (e.keyCode && jQuery.inArray(e.keyCode, ignore_codes) < 0)//ignore this keyUps to let this keys work as expected
            {
                var cp = getCP(this);
                jQuery(this).attr('value', this.value);
                setCP(this,cp);
            }
        });

        var form = this;

        for (var rule_key in rules) {
            var rule = new Rule(rule_key, form, rules[rule_key]);
        }

        //wait 300ms after keyup
        form.find('*').keyup(function() {
            var wait = setInterval(function() {
                                       clearInterval(wait);
                                       run_rules()
                                   },
                                   300)
        });

        //run on DOM loaded
        jQuery(document).ready(function() {
            run_rules()
        });


        //init default options
        Options();

        //set custom options if there are
        if (options && options.effects) {
            for(var opt in options) {
                Options[opt] = options[opt];
            }
        }

        //run after every change
        return form.find('*').change(function() {
            run_rules()
        });
    };

    //default options
    function Options() {
        Options.effects = {
            'show': 'slideDown',
            'hide': 'slideUp'
        }
    }

    //reset all rules
    jQuery.fn.grewform.reset = function() {
        Rule.id = undefined;
        Rule.all = [];
    };

    jQuery.fn.grewform.runRules = function() {
        run_rules();
    };

    function debug(str) {
        //console.log('jQuery.brForms >>> '+str)
    }

    function run_rules() {
        //debug(checking rules')

        //first run all unmatch actions
        jQuery.each(Rule.all, function(i, rule) {
            (function(rule) {
                var wait = setInterval(
                    function() {
                        try {
                            if (!Rule.form.find('*').is(":animated")) {
                                clearInterval(wait);
                                if (rule.unmatches()) {
                                    rule.run_unmatch_actions()
                                }
                            }
                        }
                        catch(e) {
                            clearInterval(wait);
                        }
                    },
                    200);
            }(rule));
        });

        //then run all math actions
        jQuery.each(Rule.all, function(i, rule) {
            (function(rule) {
                var wait = setInterval(
                    function() {
                        try {
                            if (!Rule.form.find('*').is(":animated")) {
                                clearInterval(wait);
                                if (rule.matches()) {
                                    rule.run_match_actions()
                                }
                            }
                        }
                        catch(e) {
                            clearInterval(wait);
                        }
                    },
                    200);
            }(rule));
        })
    }

    //constructor for rules
    function Rule(selector, form, raw_rule) {
        if (typeof Rule.id == 'undefined') {
            //unique id for rules
            Rule.id = 0;
            //special blip to mark DOM elements witch invoke rule actions
            Rule.blip_ptr = 'hgo_grewform_rule';
            //function for cascade unmatch
            Rule.unmtach_by_blip = function(blip) {
                jQuery.each(Rule.all, function(i, rule) {
                    if (rule.blip === blip) {
                        //debug('unmtach_by_blip '+blip)
                        rule.run_unmatch_actions()
                    }
                })
            };

            //All rules (hello Django:])
            Rule.all = [];
            Rule.form = form;
        }

        this.id = Rule.id;
        Rule.id = Rule.id + 1;
        this.blip = Rule.blip_ptr + this.id;
        this.selectors = arrayfy(('' + selector).split('AND')); //selectors of the rule
        jQuery.each(this.selectors, function(selectors) {
            return function(k, v) {
                selectors[k] = jQuery.trim('' + v)
            }
        }(this.selectors)); //trim each selector
        this.selector = arr_to_selector(this.selectors); //selector of the rule
        this.trigged = false; //indicates is rule trigged or not
        this.match_actions = [];
        this.unmatch_actions = [];
        this.raw = raw_rule;
        this.raw_selector = selector;

        //extract actions
        for (var action_key in raw_rule) {
            generate_actions(action_key, form, this);
        }

        //debug('created rule: '+this.selector +'['+ this.match_actions.length +'|'+this.unmatch_actions.length+']')

        this.matches = function() {
            for (var i = 0; i < this.selectors.length; i++) {
                var selector = this.selectors[i];
                if ((!this.trigged)) {
                    //('option:visible') always return nothing
                    if (Rule.form.find(selector).filter('option:first').length > 0) {
                        if (Rule.form.find(selector).parent('select:visible:first').length === 0) {
                            return false;
                        }
                    }
                    else if (Rule.form.find(selector).filter(':visible:first,input[type=hidden]:first').length === 0) {
                        return false;
                    }

                }
                else {
                    return false
                }
            }
            return true
        };

        this.unmatches = function() {
            if (!this.trigged) {
                return false;
            }

            for (var i = 0; i < this.selectors.length; i++) {
                var selector = this.selectors[i];
                if (Rule.form.find(selector + ':first').length === 0) {
                    return true;
                }
            }

            return false
        };

        this.run_match_actions = function() {
            debug('match: ' + this.raw_selector);

            this.trigged = true;
            //mark elements that rule trigged, it's need for cascade actions
            Rule.form.find(this.selector).addClass(this.blip);
            for (var i = 0; i < this.match_actions.length; i++) {
                var action = this.match_actions[i];
                action.call(this)
            }
        };
        this.run_match_actions.first_run = true;

        this.run_unmatch_actions = function() {
            debug('unmatch: ' + this.raw_selector);

            this.trigged = false;
            jQuery('.' + this.blip).removeClass(this.blip);
            for (var i = 0; i < this.unmatch_actions.length; i++) {
                var action = this.unmatch_actions[i];
                action.call(this)
            }
        };

        Rule.all.push(this)
    }

    function generate_actions(key, form, rule) {
        //genereting different actions
        switch (key) {
            case 'show':
                rule.match_actions.push(
                    function(elems) {
                        return function () {
                            //debug('show action');
                            if (elems.is('option')) {
                                elems.show();
                            }
                            else {
                                elems[Options.effects.show]();
                            }
                        }
                    }(form.find(rule.raw[key])));

                rule.unmatch_actions.push(
                    function(elems) {
                        return function () {
                            //debug('show action rollback');
                            cascade_unmatch(elems);
                            if (elems.is('option')) {
                                elems.hide();
                            }
                            else {
                                elems[Options.effects.hide]();
                            }
                        }
                    }(form.find(rule.raw[key])));
                break;
            case 'hide':
                rule.match_actions.push(
                    function(elems) {
                        return function () {
                            //debug('hide action');
                            if (elems.is('option')) {
                                elems.hide();
                            }
                            else {
                                elems[Options.effects.hide]();
                            }
                        }
                    }(form.find(rule.raw[key])));

                rule.unmatch_actions.push(
                    function(elems) {
                        return function () {
                            //debug('hide action rollback');
                            cascade_unmatch(elems);
                            if (elems.is('option')) {
                                elems.show();
                            }
                            else {
                                elems[Options.effects.show]();
                            }
                        }
                    }(form.find(rule.raw[key])));
                break;
            case 'set_value':
                rule.match_actions.push(
                    function(values) {
                        return function () {
                            //debug('value action');

                            var rule = this;
                            jQuery.each(values, function(selector, value) {
                                jQuery.each(Rule.form.find(selector), function() {
                                    var tagName = jQuery(this).tagName;

                                    if (tagName == 'select') {

                                        //rollback
                                        if (rule.run_match_actions.first_run) {
                                            rule.unmatch_actions.push(function (elems,prev_elems) {
                                                return function () {
                                                    cascade_unmatch(elems);
                                                    prev_elems.attr('selected', 'selected')
                                                }
                                            }(elems.find('option [value=' + value + ']'),elems.find('option:selected')))
                                        }

                                        elems.find('option').removeAttr('selected');
                                        elems.find('option [value=' + value + ']').attr('selected', 'selected')
                                    }
                                    else {
                                        //rollback
                                        if (rule.run_match_actions.first_run) {
                                            rule.unmatch_actions.push(function (elem,prev_value) {
                                                return function () {
                                                    cascade_unmatch(elem);
                                                    elem.val(prev_value)
                                                }
                                            }(jQuery(selector),jQuery(selector).val()))
                                        }

                                        jQuery(selector).val(value);
                                    }
                                })
                            });

                            rule.run_match_actions.first_run = false
                        }
                    }(rule.raw[key]));
                break;
            case 'add_options':
                for (var selector in rule.raw[key]) {
                    var options = rule.raw[key][selector];

                    if (typeof options == 'function') {
                        rule.match_actions.push(
                            function(e, selector, fn) {
                                return function () {
                                    var options = fn();
                                    for (var v in options) {
                                        //debug('add_options action')
                                        var selects = e.find(selector);
                                        jQuery('<option></option>').html(options[v]).val(v).appendTo(selects);
                                    }

                                    //small trick with callable options:
                                    //we should determine what to remove from DOM right after we add it!
                                    if (this.run_match_actions.first_run) {
                                        for (var v in options) {
                                            this.unmatch_actions.push(
                                                function(e, selector, v) {
                                                    return function () {
                                                        //debug('add_options action rollback');
                                                        cascade_unmatch(e.children(selector).children('option[value=' + v + ']'));
                                                        e.find(selector).children().remove('option[value=' + v + ']');
                                                    }
                                                }(form, selector, v));
                                        }
                                        //for adding unmatch actions once!
                                        this.run_match_actions.first_run = false
                                    }
                                }
                            }(form, selector, options));
                    }
                    else {
                        for (var v in options) {
                            rule.match_actions.push(
                                function(e, selector, v, h) {
                                    return function () {
                                        //debug('add_options action')
                                        var selects = e.find(selector)
                                        jQuery('<option></option>').html(h).val(v).appendTo(selects);
                                    }
                                }(form, selector, v, options[v]))
                            rule.unmatch_actions.push(
                                function(e, selector, v) {
                                    return function () {
                                        //debug('add_options action rollback');
                                        cascade_unmatch(e.children(selector).children('option[value=' + v + ']'));
                                        e.find(selector).children().remove('option[value=' + v + ']');
                                    }
                                }(form, selector, v));
                        }
                    }
                }
                break;
            case 'disable':
                rule.match_actions.push(
                    function(elems) {
                        return function () {
                            //debug('disable action');
                            elems.attr('disabled', 'disabled');
                        }
                    }(form.find(rule.raw[key])));

                rule.unmatch_actions.push(
                    function(elems) {
                        return function () {
                            //debug('disable action rollback');
                            cascade_unmatch(elems);
                            elems.removeAttr('disabled');
                        }
                    }(form.find(rule.raw[key])));
                break;
            case 'enable':
                rule.match_actions.push(
                    function(elems) {
                        return function () {
                            //debug('enable action');
                            elems.removeAttr('disabled');
                        }
                    }(form.find(rule.raw[key])));

                rule.unmatch_actions.push(
                    function(elems) {
                        return function () {
                            //debug('enable action rollback');
                            cascade_unmatch(elems);
                            elems.attr('disabled', 'disabled');
                        }
                    }(form.find(rule.raw[key])));
                break;
            case 'check':
                rule.match_actions.push(
                    function(elems) {
                        return function () {
                            //debug('check action');
                            elems.attr('checked', 'checked');
                        }
                    }(form.find(rule.raw[key])));

                rule.unmatch_actions.push(
                    function(elems) {
                        return function () {
                            //debug('check action rollback');
                            cascade_unmatch(elems);
                            elems.removeAttr('checked');
                        }
                    }(form.find(rule.raw[key])));
                break;
            case 'uncheck':
                rule.match_actions.push(
                    function(elems) {
                        return function () {
                            //debug('uncheck action');
                            elems.removeAttr('checked');
                        }
                    }(form.find(rule.raw[key])));

                rule.unmatch_actions.push(
                    function(elems) {
                        return function () {
                            //debug('uncheck action rollback');
                            cascade_unmatch(elems);
                            elems.attr('checked', 'checked');
                        }
                    }(form.find(rule.raw[key])));
                break;
            case 'set_html':
                rule.match_actions.push(
                    function(values) {
                        return function () {
                            //debug('value action');
                            var rule = this;
                            jQuery.each(values, function(selector, value) {
                                jQuery.each(Rule.form.find(selector), function() {
                                    //rollback
                                    if (rule.run_match_actions.first_run) {
                                        rule.unmatch_actions.push(function (elem,prev_html) {
                                            return function () {
                                                cascade_unmatch(elem);
                                                elem.html(prev_html)
                                            }
                                        }(jQuery(selector),jQuery(selector).html()))
                                    }

                                    jQuery(selector).html(value);
                                })
                            });

                            rule.run_match_actions.first_run = false
                        }
                    }(rule.raw[key]));
                break;
            case 'custom':
                rule.match_actions.push(
                    function(fn, context) {
                        return function () {
                            fn.call(context)
                        }
                    }(rule.raw[key]['match'], jQuery(rule.selector)));

                rule.unmatch_actions.push(
                    function(fn, context) {
                        return function () {
                            fn.call(context)
                        }
                    }(rule.raw[key]['unmatch'], jQuery(rule.selector)));
                break;
            default:
                return;
        }
    }

    function cascade_unmatch(elements) {
        jQuery.each(elements, function () {
            var elem = jQuery(this);
            if (elem.attr('class') !== undefined) {
                var classes = elem.attr('class').split(' ');
                jQuery.each(classes, function(k, v) {
                    Rule.unmtach_by_blip(v);
                })
            }

            cascade_unmatch(elem.children())
        })
    }


    // ----------------- U T I L S  -----------------

    function arrayfy(obj) {
        if (obj.constructor !== Array) {
            return [obj];
        }
        return obj;
    }

    function arr_to_selector(arr) {
        var res = [];
        for (var i = 0; i < arr.length; i++)
            res.push(jQuery.trim('' + arr[i]));

        return res.join(',');
    }

    function getCP (ctrl) {
        var cp = 0;

        // IE Support
        if (document.selection) {
            ctrl.focus ();
            var sel = document.selection.createRange ();
            sel.moveStart ('character', -ctrl.value.length);
            cp = Sel.text.length;
        }
        // Firefox support
        else if (ctrl.selectionStart || ctrl.selectionStart == '0') {
            cp = ctrl.selectionStart;
        }
        return (cp);
    }
    function setCP(ctrl, pos){
        if(ctrl.setSelectionRange) {
            ctrl.focus();
            ctrl.setSelectionRange(pos,pos);
        } else if (ctrl.createTextRange) {
            var range = ctrl.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    }
})();
