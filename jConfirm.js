
/*
	jConfirm
	https://github.com/HTMLGuyLLC/jConfirm
	Made with love by HTMLGuy, LLC
	MIT Licensed
*/
;(function($) {

    $.fn.jConfirm = function(options) {

        //Instantiate jConfirm once per dom element
        if (this.length > 1){
            this.each(function() {
                $(this).jConfirm(options);
            });
            return this;
        }

        //if there's nothing being passed
        if( typeof this === 'undefined' || this.length !== 1 )
        {
            return false;
        }

        //get list of options
        options = $.extend({}, $.jConfirm.defaults, options, $(this).data());

        //create tooltip html
        var html = "<div class='jc-tooltip "+options.class+"' role='tooltip'>";
            html += "<div class='jc-arrow'></div>";
            if( options.question && options.question.length > 0 ) {
                html += "<div class='jc-question'>"+options.question+"</div>";
            }
            html += "<div class='jc-buttons-wrap'>";
            if( !options.btns )
            {
                options.btns = [
                    {
                        text:options.confirm_text,
                        class:'jc-confirm jc-button-bordered',
                        event:'confirm'
                    }
                ];
                //if include deny button
                if( options.show_deny_btn )
                {
                    options.btns.push({
                        text:options.deny_text,
                        class:'jc-deny',
                        event:'deny'
                    });
                }
            }

            $.each(options.btns, function(key,btn){
                html += "<div class='jc-button-wrap'>";
                html += "<a href='#' data-event='"+btn.event+"' class='jc-button "+btn.class+"'>"+btn.text+"</a>";
                html += "</div>";
            });

            html += "</div>";
            html += "</div>";

        var helper = {
            dom: this,
            dom_wrapped: $(this),
            position_debug: options.position_debug,
            question: options.question,
            confirm_text: options.confirm_text,
            deny_text: options.deny_text,
            follow_href: options.follow_href,
            hide_on_click: options.hide_on_click,
            class: options.class,
            position: options.position,
            tooltipHTML: html,
            dataAttr: 'jConfirm',
            //disable existing options/handlers
            destroy: function(){
                //only if it's actually tied to this element
                var existing = helper.dom_wrapped.data(helper.dataAttr);
                if( typeof existing !== 'undefined' && existing !== null ) {

                    //if currently shown, hide it
                    existing.isCurrentlyShown() && existing.hide();

                    //disable on-click handler
                    existing.dom_wrapped.off(existing.onClickHandler);

                    //detach from dom
                    existing.dom_wrapped.data(existing.dataAttr, null);
                }
            },
            //initialize
            initialize: function(){
                //attach on click handler to show jConfirm
                helper.dom_wrapped.on('click', helper.onClickHandler);

                //attach to dom for easy access later
                helper.dom_wrapped.data(helper.dataAttr, helper);

                //return dom for chaining of event handlers and such
                return helper.dom;
            },
            //on click of element, show it
            onClickHandler: function(e){
                e.preventDefault();
                if( helper.isCurrentlyShown() )
                {
                    helper.hide();
                }
                else
                {
                    helper.show();
                }
                return false;
            },
            //shows the tooltip for this element
            show: function(){
                //if already visible, don't show
                if( helper.isCurrentlyShown() )
                {
                    return false;
                }
                //if there's another one, hide it
                else if( $.jConfirm.current !== null )
                {
                    //hide existing
                    $.jConfirm.current.hide();
                }
                //add the tooltip to the dom
                $('body').append(helper.tooltipHTML);
                //cache tooltip
                helper.tooltip = $('.jc-tooltip');
                //attach handlers
                helper.attachTooltipHandlers();
                //position it
                helper.positionTooltip();
                //attach resize handler to reposition tooltip
                $(window).on('resize', helper.onResize);
                //add on click to body to hide
                if( helper.hide_on_click ){
                    $(document).on('click', helper.onClickOutside);
                }
                //give the tooltip an id so we can set accessibility props
                var id = 'jconfirm'+Date.now();
                helper.tooltip.attr('id', id);
                helper.dom.attr('aria-describedby', id);
                //set as current one
                $.jConfirm.current = helper;
                //trigger event on show and pass the tooltip
                helper.dom.trigger('jc-show', {
                    'tooltip':helper.tooltip
                });
            },
            //is currently shown
            isCurrentlyShown: function(){
                return $.jConfirm.current !== null && helper.dom === $.jConfirm.current.dom;
            },
            //hides the tooltip for this element
            hide: function(){
                //remove scroll handler to reposition tooltip
                $(window).off('resize', helper.onResize);
                //remove body on click outside
                if( helper.hide_on_click ) {
                    $(document).off('click', helper.onClickOutside);
                }
                //remove accessbility props
                helper.dom.attr('aria-describedby', null);
                //remove from dom
                helper.dom_wrapped.data(helper.dataAttr).tooltip.remove();
                //remove current
                $.jConfirm.current = null;
                //trigger event on show and pass the tooltip
                helper.dom.trigger('jc-hide');
            },
            //position the tooltip on resize
            onResize: function(){
              helper.hide();
              helper.show();
            },
            //on click outside
            onClickOutside: function(e){
              var target = $(e.target);
              if( !target.hasClass('jc-tooltip') && !target.parents('.jc-tooltip:first').length )
              {
                  helper.hide();
              }
            },
            //attach event handlers to the tooltip elements
            attachTooltipHandlers: function(){
                //on click of button, trigger event
                helper.tooltip.find('.jc-button').on('click', function(e){
                    e.preventDefault();
                    var btn = $(this);
                    //trigger event
                    helper.dom_wrapped.trigger(btn.data('event'));
                    //hide helper
                    helper.hide();
                    //follow href
                    if( helper.follow_href )
                    {
                        window.location.href = helper.dom_wrapped.prop('href');
                    }
                    return false;
                });
            },
            //position tooltip based on where the dom element was
            positionTooltip: function(){

                helper.positionDebug('-- Starting positioning --');

                //cache reference to arrow
                var arrow = helper.tooltip.find('.jc-arrow');

                //first try to fit it with the preferred position
                var [arrow_dir, elem_width, tooltip_width, tooltip_height, left, top] = helper.detectFit(helper.position);

                //if couldn't fit, add class tight-fit and run again
                if( typeof left === 'undefined' )
                {
                    helper.positionDebug('Couldn\'t fit preferred position, downsizing and trying again');
                    helper.tooltip.addClass('jc-tight-fit');
                    [arrow_dir, elem_width, tooltip_width, tooltip_height, left, top] = helper.detectFit(helper.position);
                }

                //if still couldn't fit, switch to auto
                if( typeof left === 'undefined' && helper.position !== 'auto' )
                {
                    helper.positionDebug('Couldn\'t fit preferred position');
                    [arrow_dir, elem_width, tooltip_width, tooltip_height, left, top] = helper.detectFit('auto');
                }

                //fallback to centered (modal style)
                if( typeof left === 'undefined' )
                {
                    helper.positionDebug('Doesn\'t appear to fit. Displaying centered');
                    helper.tooltip.addClass('jc-centered').css({
                        'top': '50%',
                        'left': '50%',
                        'margin-left': -(tooltip_width / 2),
                        'margin-top': -(tooltip_height / 2)
                    });
                    arrow.remove();
                    helper.positionDebug('-- Done positioning --');
                    return;
                }

                //position the tooltip
                helper.positionDebug('Setting position: left:'+left+' top:'+top);
                helper.tooltip.css('left', left);
                helper.tooltip.css('top', top);

                //arrow won't point at it if hugging side
                if( elem_width < 60 )
                {
                    helper.positionDebug('Element is less than '+elem_width+'px. Setting arrow to hug the side tighter');
                    arrow_dir += ' jc-arrow-super-hug';
                }

                //set the arrow location
                arrow.addClass('jc-arrow-'+arrow_dir);

                helper.positionDebug('-- Done positioning --');

                return helper;
            },
            //detects where it will fit and returns the positioning info
            detectFit: function(position)
            {
                //cache reference to arrow
                var arrow = helper.tooltip.find('.jc-arrow');

                //get position of clicked element
                var elem_position = helper.dom_wrapped.position();
                var elem_height = helper.dom_wrapped.outerHeight();
                var elem_width = helper.dom_wrapped.outerWidth();

                //we need to take margins into consideration with positioning
                //Tried outerHeight(true) and outerWidth(true) and it didn't work correctly
                var elem_marg_left = parseInt(helper.dom_wrapped.css('marginLeft').replace('px', ''));
                var elem_marg_top = parseInt(helper.dom_wrapped.css('marginTop').replace('px', ''));
                elem_position.left += elem_marg_left;
                elem_position.top += elem_marg_top;

                //get tooltip dimensions
                var tooltip_width = helper.tooltip.outerWidth();
                var tooltip_height = helper.tooltip.outerHeight();

                //get window dimensions
                var window_width = document.querySelector('body').offsetWidth;
                var window_height = document.querySelector('body').offsetHeight;

                //get arrow size so we can pad
                var arrow_height = arrow.is(":visible") ? arrow.outerHeight() : 0;
                var arrow_width = arrow.is(":visible") ? arrow.outerWidth() : 0;

                //see where it fits in relation to the clicked element
                var fits_below = (window_height - (tooltip_height+elem_height+elem_position.top)) > 5;
                var fits_below_half = (window_height - (elem_width/2) - elem_position.top - (tooltip_height/2)) > 5;
                var fits_above = (elem_position.top - tooltip_height) > 5;
                var fits_above_half = (elem_position.top - (elem_width/2) - (tooltip_height/2)) > 5;
                var fits_right = (window_width - (tooltip_width+elem_width+elem_position.left)) > 5;
                var fits_right_half = (window_width - elem_position.left - (elem_width/2) - (tooltip_width/2)) > 5;
                var fits_right_full = (window_width - elem_position.left - tooltip_width) > 5;
                var fits_left = (elem_position.left - tooltip_width) > 5;
                var fits_left_half = (elem_position.left - (elem_width/2) - (tooltip_width/2)) > 5;
                var fits_left_full = (elem_position.left - tooltip_width) > 5;

                //in debug mode, display all details
                helper.positionDebug('Clicked element position: left:'+elem_position.left+' top:'+elem_position.top);
                helper.positionDebug('Element dimensions: height:'+elem_height+' width:'+elem_width);
                helper.positionDebug('Tooltip dimensions: height:'+tooltip_height+' width:'+tooltip_width);
                helper.positionDebug('Window dimensions: height:'+window_height+' width:'+window_width);
                helper.positionDebug('Arrow dimensions: height:'+arrow_height+' width:'+arrow_width);

                if(fits_below){ helper.positionDebug('Fits below: '+fits_below); }
                if(fits_below_half){ helper.positionDebug('Fits below half (for vertical centering): '+fits_below_half); }
                if(fits_above){ helper.positionDebug('Fits above: '+fits_above); }
                if(fits_above_half){ helper.positionDebug('Fits above half (for vertical centering): '+fits_above_half); }
                if(fits_right){ helper.positionDebug('Fits right (to the right of the element):'+fits_right); }
                if(fits_right_half){ helper.positionDebug('Fits right half (for horizontal centering): '+fits_right_half); }
                if(fits_right_full){ helper.positionDebug('Fits right full (starting where element starts): '+fits_right_full); }
                if(fits_left){ helper.positionDebug('Fits left (to the left of the element): '+fits_left); }
                if(fits_left_half){ helper.positionDebug('Fits left half (for horizontal centering): '+fits_left_half); }
                if(fits_left_full){ helper.positionDebug('Fits left full (starting where element starts): '+fits_left_full); }

                //vars we need for positioning
                var arrow_dir, left, top;

                //the following comments refer to the general location of the clicked element

                //top middle
                if( (position === 'auto' || position === 'bottom') && fits_below && fits_left_half && fits_right_half )
                {
                    helper.positionDebug('Displaying below, centered');
                    arrow_dir = 'top';
                    left = elem_position.left - (tooltip_width/2) + (elem_width/2);
                    top = elem_position.top + elem_height + (arrow_height/2);
                }
                //bottom middle
                else if( (position === 'auto' || position === 'top') && fits_above && fits_left_half && fits_right_half )
                {
                    helper.positionDebug('Displaying above, centered');
                    arrow_dir = 'bottom';
                    left = elem_position.left - (tooltip_width/2) + (elem_width/2);
                    top = elem_position.top - tooltip_height - (elem_height/2) - (arrow_height/2);
                }
                //middle right
                else if( (position === 'auto' || position === 'left') && fits_left && fits_below_half && fits_above_half )
                {
                    helper.positionDebug('Displaying left, centered');
                    arrow_dir = 'right';
                    left = elem_position.left - tooltip_width - (arrow_width/2);
                    top = elem_position.top + (elem_height/2) - (tooltip_height/2);
                }
                //middle left
                else if( (position === 'auto' || position === 'right') && fits_right && fits_below_half && fits_above_half )
                {
                    helper.positionDebug('Displaying right, centered');
                    arrow_dir = 'left';
                    left = elem_position.left + elem_width + (arrow_width/2);
                    top = elem_position.top + (elem_height/2) - (tooltip_height/2);
                }
                //top left
                else if( (position === 'auto' || position === 'bottom') && fits_below && fits_right_full )
                {
                    helper.positionDebug('Displaying below, to the right');
                    arrow_dir = 'top jc-arrow-hug-left';
                    left = elem_position.left;
                    top = elem_position.top + elem_height + (arrow_height/2);
                }
                //top right
                else if( (position === 'auto' || position === 'bottom') && fits_below && fits_left_full )
                {
                    helper.positionDebug('Displaying below, to the left');
                    arrow_dir = 'top jc-arrow-hug-right';
                    left = elem_position.left + elem_width - tooltip_width;
                    top = elem_position.top + elem_height + (arrow_height/2);
                }
                //bottom left
                else if( (position === 'auto' || position === 'top') && fits_above && fits_right_full )
                {
                    helper.positionDebug('Displaying above, to the right');
                    arrow_dir = 'bottom jc-arrow-hug-left';
                    left = elem_position.left;
                    top = elem_position.top - tooltip_height - (elem_height/2) - (arrow_height/2);
                }
                //bottom right
                else if( (position === 'auto' || position === 'top') && fits_above && fits_left_full )
                {
                    helper.positionDebug('Displaying above, to the left');
                    arrow_dir = 'bottom jc-arrow-hug-right';
                    left = elem_position.left + elem_width - tooltip_width;
                    top = elem_position.top - tooltip_height - (elem_height/2) - (arrow_height/2);
                }

                return [arrow_dir, elem_width, tooltip_width, tooltip_height, left, top];
            },
            //if position_debug is enabled, let's console.log the details
            positionDebug: function(msg){
                if( helper.position_debug )
                {
                    console.log('Position: '+msg);
                }
            }
        };

        //If this is an existing jConfirm, destroy first
        helper.destroy();

        //initialize
        return helper.initialize();
    };

    $.jConfirm = {};
    //default current to null
    $.jConfirm.current = null;

    $.jConfirm.defaults = {
        btns: false,
        position_debug: false,
        question: 'Are you sure?',
        confirm_text: 'Yes',
        deny_text: 'No',
        follow_href: false,
        hide_on_click: true,
        position: 'auto',
        class: '',
        show_deny_btn: true,
    }

})(jQuery);