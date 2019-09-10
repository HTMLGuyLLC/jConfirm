/*
	jConfirm
	https://github.com/HTMLGuyLLC/jConfirm
	Made with love by HTMLGuy, LLC
	https://htmlguy.com
	MIT Licensed
*/
;(function($) {

    $.fn.jConfirm = function(options) {
        var this_wrapped = $(this);

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
            return this;
        }

        //get list of options
        options = $.extend({}, $.jConfirm.defaults, options, this_wrapped.data());

        //add theme class
        options.class += ' jc-'+options.theme+'-theme';
        //add size class
        options.class += ' jc-'+options.size;

        let helper = {
            dom: this,
            dom_wrapped: this_wrapped,
            position_debug: options.position_debug,
            follow_href: options.follow_href,
            open_new_tab: options.open_new_tab,
            hide_on_click: options.hide_on_click,
            question: options.question,
            theme: options.theme,
            class: options.class,
            backdrop: options.backdrop,
            btns: options.btns,
            confirm_text: options.confirm_text,
            deny_text: options.deny_text,
            show_deny_btn: options.show_deny_btn,
            position: options.position,
            show_now: options.show_now,
            dataAttr: 'jConfirm',
            //create tooltip html
            createTooltipHTML: function(){

                //if no buttons were provided (default), set confirm and deny
                if( !helper.btns )
                {
                    helper.btns = [
                        {
                            text: helper.confirm_text,
                            class: helper.theme.indexOf('bootstrap') > -1 ? 'btn btn-success' : 'jc-button-highlight',
                            event: 'confirm'
                        }
                    ];
                    //if include deny button
                    if( helper.show_deny_btn )
                    {
                        helper.btns.push({
                            text: helper.deny_text,
                            class: helper.theme.indexOf('bootstrap') > -1 ? 'btn btn-secondary' : '',
                            event: 'deny'
                        });
                    }
                }

                let html = `<div class='jc-tooltip ${helper.class}' role='tooltip'>
                                <div class='jc-arrow'></div>`;

                if( helper.question && helper.question.length > 0 ) {
                    html += "<div class='jc-question'>"+helper.question+"</div>";
                }
                html += "<div class='jc-buttons-wrap'>";

                //loop through buttons and add to html
                $.each(helper.btns, function(key,btn){
                    if( typeof btn.class === 'undefined' ) btn.class = '';
                    html += `<div class='jc-button-wrap'>
                                <a href='#' data-event='${btn.event}' class='jc-button ${btn.class}'`;
                    if( typeof btn.data === 'object' ){
                        $.each(btn.data, function(prop,val) {
                            html += ` data-${prop}="${val}"`;
                        });
                    }
                    html += `>${btn.text}</a>
                            </div>`;
                });

                //end buttons wrap and tooltip
                html += "</div></div>";

                return html;
            },
            //creates backdrop html if necessary
            createBackdropHTML: function(){
               return helper.backdrop ? `<div class='jc-backdrop jc-${helper.backdrop}-backdrop'></div>` : false;
            },
            //disable existing options/handlers
            destroy: function(){
                //only if it's actually tied to this element
                const existing = helper.dom_wrapped.data(helper.dataAttr);
                if( typeof existing !== 'undefined' && existing !== null ) {

                    //disable handler
                    existing.dom_wrapped.off('touchstart mousedown', existing.toggleTooltipHandler);
                    existing.dom_wrapped.off('click', existing.preventDefaultHandler);

                    //attach resize handler to reposition tooltip
                    $(window).off('resize', existing.onResize);

                    //if currently shown, hide it
                    existing.isVisible() && existing.hide();

                    //detach from dom
                    existing.dom_wrapped.data(existing.dataAttr, null);
                }
            },
            //initialize the plugin on this element
            initialize: function(){
                //attach on handler to show tooltip
                //use touchstart and mousedown just like if you click outside the tooltip to close it
                //this way it blocks the hide if you click the button a second time to close the tooltip
                helper.dom_wrapped.on('touchstart mousedown', helper.toggleTooltipHandler);
                helper.dom_wrapped.on('click', helper.preventDefaultHandler);

                //attach to dom for easy access later
                helper.dom_wrapped.data(helper.dataAttr, helper);

                //return dom for chaining of event handlers and such
                return helper.dom;
            },
            //on click of element, prevent default
            preventDefaultHandler: function(e){
                e.preventDefault();
                //prevent click following href
                return false;
            },
            //on click of element, show it
            toggleTooltipHandler: function(e){
                e.preventDefault();
                if( helper.isVisible() )
                {
                    helper.hide();
                }
                else
                {
                    helper.show();
                }
                return false;
            },
            //shows the tooltip
            show: function(trigger_event){
                //if already visible, don't show
                if( helper.isVisible() )
                {
                    return false;
                }
                //if there's another one, hide it
                else if( $.jConfirm.current !== null )
                {
                    //hide existing
                    $.jConfirm.current.hide();
                }
                //cache reference to the body
                const body = $('body');
                //blurred won't work like the standard separate div backdrop
                //it has to be applied directly to the dom we're blurring
                if( helper.backdrop === 'blurred' )
                {
                    body.addClass('jc-blurred-body');
                }
                //if regular backdrop, append the div
                else if( helper.backdrop )
                {
                    body.append(helper.createBackdropHTML());
                }
                //add the tooltip to the dom
                body.append(helper.createTooltipHTML());
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
                    //using mousedown and touchstart means it will be prioritized ahead
                    //of any existing click handlers on an element and close the tooltip
                    //for many reasons people bind to click and preventDefault which would
                    //stop this from being called
                    $(document).on('touchstart mousedown', helper.onClickOutside);
                }
                //give the tooltip an id so we can set accessibility props
                const id = 'jconfirm'+Date.now();
                helper.tooltip.attr('id', id);
                helper.dom.attr('aria-describedby', id);
                //set as current one and expose dom and hide method
                $.jConfirm.current = {
                    dom: helper.dom,
                    hide: helper.hide
                };
                //trigger event on show and pass the tooltip
                if( typeof trigger_event === 'undefined' || trigger_event ) {
                    helper.dom.trigger('jc-show', {
                        'tooltip': helper.tooltip
                    });
                }
            },
            //is this tooltip visible
            isVisible: function(){
                return $.jConfirm.current !== null && helper.dom === $.jConfirm.current.dom;
            },
            //hides the tooltip for this element
            hide: function(trigger_event){
                //remove scroll handler to reposition tooltip
                $(window).off('resize', helper.onResize);
                //remove body on click outside
                if( helper.hide_on_click ) {
                    $(document).off('touchstart mousedown', helper.onClickOutside);
                }
                //remove accessbility props
                helper.dom.attr('aria-describedby', null);
                //remove from dom
                helper.tooltip.remove();
                //remove blurring to body
                if( helper.backdrop === 'blurred' )
                {
                    $('body').removeClass('jc-blurred-body');
                }
                //remove backdrop
                else if( helper.backdrop )
                {
                    $('.jc-backdrop').remove();
                }
                //remove current
                $.jConfirm.current = null;
                //trigger hide event
                if( typeof trigger_event === 'undefined' || trigger_event ) {
                    helper.dom.trigger('jc-hide');
                }
                return helper.dom;
            },
            //on body resized
            onResize: function(){
              //hiding and showing the tooltip will update it's position
              helper.hide(false);
              helper.show(false);
            },
            //on click outside of the tooltip
            onClickOutside: function(e){
              const target = $(e.target);
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
                    const btn = $(this);
                    //trigger event
                    helper.dom_wrapped.trigger(btn.data('event'), btn.data());
                    //hide helper
                    helper.hide();
                    //follow href
                    if( btn.data('event') === 'confirm' && helper.follow_href )
                    {
                        if( helper.open_new_tab )
                        {
                            window.open(
                                helper.dom_wrapped.prop('href'),
                                '_blank'
                            );
                        }
                        else
                        {
                            window.location.href = helper.dom_wrapped.prop('href');
                        }
                    }
                    return false;
                });
            },
            //position tooltip based on where the clicked element is
            positionTooltip: function(){

                helper.positionDebug('-- Start positioning --');

                //cache reference to arrow
                let arrow = helper.tooltip.find('.jc-arrow');

                //first try to fit it with the preferred position
                let [arrow_dir, elem_width, tooltip_width, tooltip_height, left, top] = helper.calculateSafePosition(helper.position);

                //if couldn't fit, add class tight-fit and run again
                if( typeof left === 'undefined' )
                {
                    helper.positionDebug('Couldn\'t fit preferred position, downsizing and trying again');
                    helper.tooltip.addClass('jc-tight-fit');
                    [arrow_dir, elem_width, tooltip_width, tooltip_height, left, top] = helper.calculateSafePosition(helper.position);
                }

                //if still couldn't fit, switch to auto
                if( typeof left === 'undefined' && helper.position !== 'auto' )
                {
                    helper.positionDebug('Couldn\'t fit preferred position');
                    [arrow_dir, elem_width, tooltip_width, tooltip_height, left, top] = helper.calculateSafePosition('auto');
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
                helper.positionDebug({'Setting Position':{'Left':left,'Top':top}});
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
            calculateSafePosition: function(position)
            {
                //cache reference to arrow
                let arrow = helper.tooltip.find('.jc-arrow');

                //get tooltip dimensions
                let tooltip_width = helper.tooltip.outerWidth();
                let tooltip_height = helper.tooltip.outerHeight();

                //if the original element is gone or hidden
                if( helper.dom_wrapped.length === 0 || !helper.dom_wrapped.is(":visible") )
                {
                    helper.position = 'auto';
                    return ['none', 0, tooltip_width, tooltip_height];
                }

                //get position + size of clicked element
                let elem_position = helper.dom_wrapped.offset();
                let elem_height = helper.dom_wrapped.outerHeight();
                let elem_width = helper.dom_wrapped.outerWidth();

                //we need to take margins into consideration with positioning
                //Tried outerHeight(true) and outerWidth(true) and it didn't work correctly
                let elem_marg_left = parseInt(helper.dom_wrapped.css('marginLeft').replace('px', ''));
                let elem_marg_top = parseInt(helper.dom_wrapped.css('marginTop').replace('px', ''));
                elem_position.left += elem_marg_left;
                elem_position.top += elem_marg_top;

                //get window dimensions
                let window_width = document.querySelector('body').offsetWidth;
                let window_height = document.querySelector('body').offsetHeight;

                //get arrow size so we can pad
                let arrow_height = arrow.is(":visible") ? arrow.outerHeight() : 0;
                let arrow_width = arrow.is(":visible") ? arrow.outerWidth() : 0;

                //see where it fits in relation to the clicked element
                let fits = {};
                fits.below = (window_height - (tooltip_height+elem_height+elem_position.top)) > 5;
                fits.above = (elem_position.top - tooltip_height) > 5;
                fits.vertical_half = (elem_position.top + (elem_width/2) - (tooltip_height/2)) > 5;
                fits.right = (window_width - (tooltip_width+elem_width+elem_position.left)) > 5;
                fits.right_half = (window_width - elem_position.left - (elem_width/2) - (tooltip_width/2)) > 5;
                fits.right_full = (window_width - elem_position.left - tooltip_width) > 5;
                fits.left = (elem_position.left - tooltip_width) > 5;
                fits.left_half = (elem_position.left + (elem_width/2) - (tooltip_width/2)) > 5;
                fits.left_full = (elem_position.left - tooltip_width) > 5;

                //in debug mode, display all details
                helper.positionDebug({
                    'Clicked Element': {'Left': elem_position.left, 'Top': elem_position.top},
                });
                helper.positionDebug({
                    'Element Dimensions':{'Height':elem_height, 'Width':elem_width},
                    'Tooltip Dimensions':{'Height':tooltip_height, 'Width':tooltip_width},
                    'Window Dimensions':{'Height':window_height, 'Width':window_width},
                    'Arrow Dimensions':{'Height':arrow_height, 'Width':arrow_width},
                });
                helper.positionDebug(fits);

                //vars we need for positioning
                let arrow_dir, left, top;

                if( (position === 'auto' || position === 'bottom') && fits.below && fits.left_half && fits.right_half )
                {
                    helper.positionDebug('Displaying below, centered');
                    arrow_dir = 'top';
                    left = elem_position.left - (tooltip_width/2) + (elem_width/2);
                    top = elem_position.top + elem_height + (arrow_height/2);
                }
                else if( (position === 'auto' || position === 'top') && fits.above && fits.left_half && fits.right_half )
                {
                    helper.positionDebug('Displaying above, centered');
                    arrow_dir = 'bottom';
                    left = elem_position.left - (tooltip_width/2) + (elem_width/2);
                    top = elem_position.top - tooltip_height - (arrow_height/2);
                }
                else if( (position === 'auto' || position === 'left') && fits.left && fits.vertical_half )
                {
                    helper.positionDebug('Displaying left, centered');
                    arrow_dir = 'right';
                    left = elem_position.left - tooltip_width - (arrow_width/2);
                    top = elem_position.top + (elem_height/2) - (tooltip_height/2);
                }
                else if( (position === 'auto' || position === 'right') && fits.right && fits.vertical_half )
                {
                    helper.positionDebug('Displaying right, centered');
                    arrow_dir = 'left';
                    left = elem_position.left + elem_width + (arrow_width/2);
                    top = elem_position.top + (elem_height/2) - (tooltip_height/2);
                }
                else if( (position === 'auto' || position === 'bottom') && fits.below && fits.right_full )
                {
                    helper.positionDebug('Displaying below, to the right');
                    arrow_dir = 'top jt-arrow-hug-left';
                    left = elem_position.left;
                    top = elem_position.top + elem_height + (arrow_height/2);
                }
                else if( (position === 'auto' || position === 'bottom') && fits.below && fits.left_full )
                {
                    helper.positionDebug('Displaying below, to the left');
                    arrow_dir = 'top jt-arrow-hug-right';
                    left = elem_position.left + elem_width - tooltip_width;
                    top = elem_position.top + elem_height + (arrow_height/2);
                }
                else if( (position === 'auto' || position === 'top') && fits.above && fits.right_full )
                {
                    helper.positionDebug('Displaying above, to the right');
                    arrow_dir = 'bottom jt-arrow-hug-left';
                    left = elem_position.left;
                    top = elem_position.top - tooltip_height - (arrow_height/2);
                }
                else if( (position === 'auto' || position === 'top') && fits.above && fits.left_full )
                {
                    helper.positionDebug('Displaying above, to the left');
                    arrow_dir = 'bottom jt-arrow-hug-right';
                    left = elem_position.left + elem_width - tooltip_width;
                    top = elem_position.top - tooltip_height - (arrow_height/2);
                }

                return [arrow_dir, elem_width, tooltip_width, tooltip_height, left, top];
            },
            //if position_debug is enabled, let's console.log the details
            positionDebug: function(msg){
                if( !helper.position_debug ) {
                    return false;
                }

                return typeof msg === 'object' ? console.table(msg) : console.log(`Position: ${msg}`);
            }
        };

        helper.destroy();

        var initialized = helper.initialize();

        //if showing immediately, do it!
        if( helper.show_now )
        {
            helper.show();
        }

        return initialized;
    };

    $.jConfirm = {};
    //initially, there is not a tooltip showing
    $.jConfirm.current = null;

    $.jConfirm.defaults = {
        btns: false,
        position_debug: false,
        question: 'Are you sure?',
        confirm_text: 'Yes',
        deny_text: 'No',
        follow_href: false,
        open_new_tab: false,
        hide_on_click: true,
        position: 'auto',
        class: '',
        show_deny_btn: true,
        theme: 'black',
        size: 'small',
        backdrop: false,
        show_now: false,
    }

})(jQuery);