jConfirm
======
by HTMLGuy, LLC (https://htmlguy.com)

![example jconfirm](https://htmlguyllc.github.io/jConfirm/example.png)

Demos
=======
https://htmlguyllc.github.io/jConfirm/
===

What is it?
=======
jQuery confirmation tooltip plugin. Easy to use and configure with excellent responsive placement (on the demo page, try resizing your screen!).

Getting the files
=======
Clone this repo to your website's public folder

OR

Available on NPM (https://www.npmjs.com/package/jconfirm):
```html
npm install jconfirm
```

Dependencies
=======
jQuery 3.0+

Setup
======
Include the plugin in your code:
```html
<link rel="stylesheet" href="jConfirm-master/jConfirm.min.css">
<script src="jConfirm-master/jConfirm.min.js"></script>
```

jConfirm's defaults make it dead-simple to get started:
```html
<a href='#' 
    data-toggle="confirm"
    data-id="1">Delete it!</a>
```
```javascript
$(function(){
  $('[data-toggle="confirm"]').jConfirm().on('confirm', function(e){
     var btn = $(this),
          id = btn.data('id');
     //make your ajax call to delete this record
  });
});
```

Options and Events
======

Defaults are shown
```javascript
$(function(){
  $('[data-toggle="confirm"]').jConfirm({
        //false|array: if provided, this will override the default confirm/deny buttons (see below for an example)
        btns: false,
        //string: question displayed to the user
        question: 'Are you sure?',
        //string: confirm button text
        confirm_text: 'Yes',
        //string: deny button text
        deny_text: 'No',
        //boolean: if true, when the confirm button is clicked the user will be redirected to the button's href location
        follow_href: true,
        //boolean: if true and follow_href is true, the href will be opened in a new window
        open_new_tab: false,
        //boolean : if true, the tooltip will be hidden if you click outside of it
        hide_on_click: true,
        //string ('auto','top','bottom','left','right'): preferred location of the tooltip (defaults to auto if no space)
        position: 'auto',
        //string: class(es) to add to the tooltip
        class: '',
        //boolean: if true, the deny button will be shown
        show_deny_btn: true,
        //string ('black', 'white', 'bootstrap-4', 'bootstrap-4-white')
        theme: 'black',
        //string ('tiny', 'small', 'medium', 'large')
        size: 'small',
        //string|false ('black', 'white', 'blurred')
        backdrop: false
  }).on('confirm', function(e){
     var btn = $(this);
     //triggered on confirm
  }).on('deny', function(e){
      var btn = $(this);
      //triggered on deny
  }).on('jc-show', function(e, tooltip){
      //triggered on show of tooltip
      //tooltip dom element is passed as the second parameter
  }).on('jc-hide', function(e){
      //triggered on hide of tooltip
  });
  
  //gets the currently displayed tooltip (if any)
  var current_tooltip = $.jConfirm.current;
  //gets the button that was clicked for the current tooltip
  current_tooltip.dom;
  //hides the current tooltip (remember to make sure there is one first)
  //returns the original dom element
  //you can pass false to disable triggering the hide event
  current_tooltip.hide(false);
});
```

You can set any of the options you see above globally using this syntax:
```javascript
$.jConfirm.defaults.question = 'Are you sure?';
$.jConfirm.defaults.confirm_text = 'Yes';
$.jConfirm.defaults.deny_text = 'No';
$.jConfirm.defaults.theme = 'black';
```

You can override the global and passed options by setting data attributes:
```html
<a href='#' 
    data-toggle="confirm"
    data-question="Are you sure?"
    data-confirm_text="Yes"
    data-deny_text="No"
    data-id="1">Delete it!</a>
```
```javascript
$('[data-toggle="confirm"]').jConfirm().on('confirm', function(e){
   var btn = $(this),
        id = btn.data('id');
   //do something
});
```

Examples
======

Bootstrap theme:
```javascript
$(function(){
  $('[data-toggle="confirm"]').jConfirm({
    theme: 'bootstrap-4'
  });
});
```
or globally:
```javascript
$.jConfirm.defaults.theme = 'bootstrap-4';
```

Preferred positioning:
```javascript
$(function(){
  $('[data-toggle="confirm"]').jConfirm({
    position: 'right'
  });
});
```

Follow link on confirm:
```html
<a href="https://htmlguy.com" 
    class="btn btn-secondary outside-link">
    HTMLGuy.com
</a>
```
```javascript
$('.outside-link').jConfirm({
    question:'You are about to visit an external site, are you sure you want to leave?',
    confirm_text: 'Yes, let\'s go!',
    deny_text:' No way!',
    follow_href: true,
});
```

Custom question and button text using data attributes:
```html
<a href="#" 
    class="btn btn-secondary send-email" 
    data-question="Are you ready to send your message?" 
    data-confirm_text="Yes, send now" 
    data-deny_text="No, cancel">
    Send
</a>
```
```javascript
$('.send-email').jConfirm().on('confirm', function(e){
   //send email
});
```

Overriding the confirm and deny buttons to create a custom tooltip:
```html
<a href="#" class="btn btn-primary social-share" data-url-to-share="https://htmlguy.com">
Share
</a>
```
```javascript
$('.social-share').jConfirm({
    question: 'Share to your favorite social media sites!',
    btns: [
        {
            text:'Facebook',
            event:'facebook-share',
            class:'facebook-btn jc-button-highlight'
        },
        {
            text:'Twitter',
            event:'twitter-share',
            class:'twitter-btn jc-button-highlight'
        }
    ]
}).on('facebook-share', function(e){
    var btn = $(this);
    console.log('Sharing to facebook: '+btn.data('url-to-share'));
}).on('twitter-share', function(e){
    var btn = $(this);
    console.log('Sharing to twitter: '+btn.data('url-to-share'));
});
```
