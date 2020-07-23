(function() {
    var Slideshow = function(opts) {
      this.options = slideshowAssignOptions(Slideshow.defaults , opts);
      this.element = this.options.element;
      this.items = this.element.getElementsByClassName('js-slideshow__item');
      this.controls = this.element.getElementsByClassName('js-slideshow__control'); 
      this.selectedSlide = 0;
      this.autoplayId = false;
      this.autoplayPaused = false;
      this.navigation = false;
      this.navCurrentLabel = false;
      this.ariaLive = false;
      this.moveFocus = false;
      this.animating = false;
      this.supportAnimation = Util.cssSupports('transition');
      this.animationOff = (!Util.hasClass(this.element, 'slideshow--transition-fade') && !Util.hasClass(this.element, 'slideshow--transition-slide') && !Util.hasClass(this.element, 'slideshow--transition-prx'));
      this.animationType = Util.hasClass(this.element, 'slideshow--transition-prx') ? 'prx' : 'slide';
      this.animatingClass = 'slideshow--is-animating';
      initSlideshow(this);
      initSlideshowEvents(this);
      initAnimationEndEvents(this);
    };
  
    Slideshow.prototype.showNext = function() {
      showNewItem(this, this.selectedSlide + 1, 'next');
    };
  
    Slideshow.prototype.showPrev = function() {
      showNewItem(this, this.selectedSlide - 1, 'prev');
    };
  
    Slideshow.prototype.showItem = function(index) {
      showNewItem(this, index, false);
    };
  
    Slideshow.prototype.startAutoplay = function() {
      var self = this;
      if(this.options.autoplay && !this.autoplayId && !this.autoplayPaused) {
        self.autoplayId = setInterval(function(){
          self.showNext();
        }, self.options.autoplayInterval);
      }
    };
  
    Slideshow.prototype.pauseAutoplay = function() {
      var self = this;
      if(this.options.autoplay) {
        clearInterval(self.autoplayId);
        self.autoplayId = false;
      }
    };
  
    function slideshowAssignOptions(defaults, opts) {
      // initialize the object options
      var mergeOpts = {};
      mergeOpts.element = (typeof opts.element !== "undefined") ? opts.element : defaults.element;
      mergeOpts.navigation = (typeof opts.navigation !== "undefined") ? opts.navigation : defaults.navigation;
      mergeOpts.autoplay = (typeof opts.autoplay !== "undefined") ? opts.autoplay : defaults.autoplay;
      mergeOpts.autoplayInterval = (typeof opts.autoplayInterval !== "undefined") ? opts.autoplayInterval : defaults.autoplayInterval;
      mergeOpts.swipe = (typeof opts.swipe !== "undefined") ? opts.swipe : defaults.swipe;
      return mergeOpts;
    };
  
    function initSlideshow(slideshow) { // basic slideshow settings
      // if no slide has been selected -> select the first one
      if(slideshow.element.getElementsByClassName('slideshow__item--selected').length < 1) Util.addClass(slideshow.items[0], 'slideshow__item--selected');
      slideshow.selectedSlide = Util.getIndexInArray(slideshow.items, slideshow.element.getElementsByClassName('slideshow__item--selected')[0]);
      // create an element that will be used to announce the new visible slide to SR
      var srLiveArea = document.createElement('div');
      Util.setAttributes(srLiveArea, {'class': 'sr-only js-slideshow__aria-live', 'aria-live': 'polite', 'aria-atomic': 'true'});
      slideshow.element.appendChild(srLiveArea);
      slideshow.ariaLive = srLiveArea;
    };
  
    function initSlideshowEvents(slideshow) {
      // if slideshow navigation is on -> create navigation HTML and add event listeners
      if(slideshow.options.navigation) {
        // check if navigation has already been included
        if(slideshow.element.getElementsByClassName('js-slideshow__navigation').length == 0) {
          var navigation = document.createElement('ol'),
            navChildren = '';
  
          var navClasses = 'slideshow__navigation js-slideshow__navigation';
          if(slideshow.items.length <= 1) {
            navClasses = navClasses + ' is-hidden';
          } 
          
          navigation.setAttribute('class', navClasses);
          for(var i = 0; i < slideshow.items.length; i++) {
            var className = (i == slideshow.selectedSlide) ? 'class="slideshow__nav-item slideshow__nav-item--selected js-slideshow__nav-item"' :  'class="slideshow__nav-item js-slideshow__nav-item"',
              navCurrentLabel = (i == slideshow.selectedSlide) ? '<span class="sr-only js-slideshow__nav-current-label">Current Item</span>' : '';
            navChildren = navChildren + '<li '+className+'><button class="reset"><span class="sr-only">'+ (i+1) + '</span>'+navCurrentLabel+'</button></li>';
          }
          navigation.innerHTML = navChildren;
          slideshow.element.appendChild(navigation);
        }
        
        slideshow.navCurrentLabel = slideshow.element.getElementsByClassName('js-slideshow__nav-current-label')[0]; 
        slideshow.navigation = slideshow.element.getElementsByClassName('js-slideshow__nav-item');
  
        var dotsNavigation = slideshow.element.getElementsByClassName('js-slideshow__navigation')[0];
  
        dotsNavigation.addEventListener('click', function(event){
          navigateSlide(slideshow, event, true);
        });
        dotsNavigation.addEventListener('keyup', function(event){
          navigateSlide(slideshow, event, (event.key.toLowerCase() == 'enter'));
        });
      }
      // slideshow arrow controls
      if(slideshow.controls.length > 0) {
        // hide controls if one item available
        if(slideshow.items.length <= 1) {
          Util.addClass(slideshow.controls[0], 'is-hidden');
          Util.addClass(slideshow.controls[1], 'is-hidden');
        }
        slideshow.controls[0].addEventListener('click', function(event){
          event.preventDefault();
          slideshow.showPrev();
          updateAriaLive(slideshow);
        });
        slideshow.controls[1].addEventListener('click', function(event){
          event.preventDefault();
          slideshow.showNext();
          updateAriaLive(slideshow);
        });
      }
      // swipe events
      if(slideshow.options.swipe) {
        //init swipe
        new SwipeContent(slideshow.element);
        slideshow.element.addEventListener('swipeLeft', function(event){
          slideshow.showNext();
        });
        slideshow.element.addEventListener('swipeRight', function(event){
          slideshow.showPrev();
        });
      }
      // autoplay
      if(slideshow.options.autoplay) {
        slideshow.startAutoplay();
        // pause autoplay if user is interacting with the slideshow
        slideshow.element.addEventListener('mouseenter', function(event){
          slideshow.pauseAutoplay();
          slideshow.autoplayPaused = true;
        });
        slideshow.element.addEventListener('focusin', function(event){
          slideshow.pauseAutoplay();
          slideshow.autoplayPaused = true;
        });
        slideshow.element.addEventListener('mouseleave', function(event){
          slideshow.autoplayPaused = false;
          slideshow.startAutoplay();
        });
        slideshow.element.addEventListener('focusout', function(event){
          slideshow.autoplayPaused = false;
          slideshow.startAutoplay();
        });
      }
      // detect if external buttons control the slideshow
      var slideshowId = slideshow.element.getAttribute('id');
      if(slideshowId) {
        var externalControls = document.querySelectorAll('[data-controls="'+slideshowId+'"]');
        for(var i = 0; i < externalControls.length; i++) {
          (function(i){externalControlSlide(slideshow, externalControls[i]);})(i);
        }
      }
      // custom event to trigger selection of a new slide element
      slideshow.element.addEventListener('selectNewItem', function(event){
        // check if slide is already selected
        if(event.detail) {
          if(event.detail - 1 == slideshow.selectedSlide) return;
          showNewItem(slideshow, event.detail - 1, false);
        }
      });
    };
  
    function navigateSlide(slideshow, event, keyNav) { 
      // user has interacted with the slideshow navigation -> update visible slide
      var target = ( Util.hasClass(event.target, 'js-slideshow__nav-item') ) ? event.target : event.target.closest('.js-slideshow__nav-item');
      if(keyNav && target && !Util.hasClass(target, 'slideshow__nav-item--selected')) {
        slideshow.showItem(Util.getIndexInArray(slideshow.navigation, target));
        slideshow.moveFocus = true;
        updateAriaLive(slideshow);
      }
    };
  
    function initAnimationEndEvents(slideshow) {
      // remove animation classes at the end of a slide transition
      for( var i = 0; i < slideshow.items.length; i++) {
        (function(i){
          slideshow.items[i].addEventListener('animationend', function(){resetAnimationEnd(slideshow, slideshow.items[i]);});
          slideshow.items[i].addEventListener('transitionend', function(){resetAnimationEnd(slideshow, slideshow.items[i]);});
        })(i);
      }
    };
  
    function resetAnimationEnd(slideshow, item) {
      setTimeout(function(){ // add a delay between the end of animation and slideshow reset - improve animation performance
        if(Util.hasClass(item,'slideshow__item--selected')) {
          if(slideshow.moveFocus) Util.moveFocus(item);
          emitSlideshowEvent(slideshow, 'newItemVisible', slideshow.selectedSlide);
          slideshow.moveFocus = false;
        }
        Util.removeClass(item, 'slideshow__item--'+slideshow.animationType+'-out-left slideshow__item--'+slideshow.animationType+'-out-right slideshow__item--'+slideshow.animationType+'-in-left slideshow__item--'+slideshow.animationType+'-in-right');
        item.removeAttribute('aria-hidden');
        slideshow.animating = false;
        Util.removeClass(slideshow.element, slideshow.animatingClass); 
      }, 100);
    };
  
    function showNewItem(slideshow, index, bool) {
      if(slideshow.items.length <= 1) return;
      if(slideshow.animating && slideshow.supportAnimation) return;
      slideshow.animating = true;
      Util.addClass(slideshow.element, slideshow.animatingClass); 
      if(index < 0) index = slideshow.items.length - 1;
      else if(index >= slideshow.items.length) index = 0;
      var exitItemClass = getExitItemClass(slideshow, bool, slideshow.selectedSlide, index);
      var enterItemClass = getEnterItemClass(slideshow, bool, slideshow.selectedSlide, index);
      // transition between slides
      if(!slideshow.animationOff) Util.addClass(slideshow.items[slideshow.selectedSlide], exitItemClass);
      Util.removeClass(slideshow.items[slideshow.selectedSlide], 'slideshow__item--selected');
      slideshow.items[slideshow.selectedSlide].setAttribute('aria-hidden', 'true'); //hide to sr element that is exiting the viewport
      if(slideshow.animationOff) {
        Util.addClass(slideshow.items[index], 'slideshow__item--selected');
      } else {
        Util.addClass(slideshow.items[index], enterItemClass+' slideshow__item--selected');
      }
      // reset slider navigation appearance
      resetSlideshowNav(slideshow, index, slideshow.selectedSlide);
      slideshow.selectedSlide = index;
      // reset autoplay
      slideshow.pauseAutoplay();
      slideshow.startAutoplay();
      // reset controls/navigation color themes
      resetSlideshowTheme(slideshow, index);
      // emit event
      emitSlideshowEvent(slideshow, 'newItemSelected', slideshow.selectedSlide);
      if(slideshow.animationOff) {
        slideshow.animating = false;
        Util.removeClass(slideshow.element, slideshow.animatingClass);
      }
    };
  
    function getExitItemClass(slideshow, bool, oldIndex, newIndex) {
      var className = '';
      if(bool) {
        className = (bool == 'next') ? 'slideshow__item--'+slideshow.animationType+'-out-right' : 'slideshow__item--'+slideshow.animationType+'-out-left'; 
      } else {
        className = (newIndex < oldIndex) ? 'slideshow__item--'+slideshow.animationType+'-out-left' : 'slideshow__item--'+slideshow.animationType+'-out-right';
      }
      return className;
    };
  
    function getEnterItemClass(slideshow, bool, oldIndex, newIndex) {
      var className = '';
      if(bool) {
        className = (bool == 'next') ? 'slideshow__item--'+slideshow.animationType+'-in-right' : 'slideshow__item--'+slideshow.animationType+'-in-left'; 
      } else {
        className = (newIndex < oldIndex) ? 'slideshow__item--'+slideshow.animationType+'-in-left' : 'slideshow__item--'+slideshow.animationType+'-in-right';
      }
      return className;
    };
  
    function resetSlideshowNav(slideshow, newIndex, oldIndex) {
      if(slideshow.navigation) {
        Util.removeClass(slideshow.navigation[oldIndex], 'slideshow__nav-item--selected');
        Util.addClass(slideshow.navigation[newIndex], 'slideshow__nav-item--selected');
        slideshow.navCurrentLabel.parentElement.removeChild(slideshow.navCurrentLabel);
        slideshow.navigation[newIndex].getElementsByTagName('button')[0].appendChild(slideshow.navCurrentLabel);
      }
    };
  
    function resetSlideshowTheme(slideshow, newIndex) {
      var dataTheme = slideshow.items[newIndex].getAttribute('data-theme');
      if(dataTheme) {
        if(slideshow.navigation) slideshow.navigation[0].parentElement.setAttribute('data-theme', dataTheme);
        if(slideshow.controls[0]) slideshow.controls[0].parentElement.setAttribute('data-theme', dataTheme);
      } else {
        if(slideshow.navigation) slideshow.navigation[0].parentElement.removeAttribute('data-theme');
        if(slideshow.controls[0]) slideshow.controls[0].parentElement.removeAttribute('data-theme');
      }
    };
  
    function emitSlideshowEvent(slideshow, eventName, detail) {
      var event = new CustomEvent(eventName, {detail: detail});
      slideshow.element.dispatchEvent(event);
    };
  
    function updateAriaLive(slideshow) {
      slideshow.ariaLive.innerHTML = 'Item '+(slideshow.selectedSlide + 1)+' of '+slideshow.items.length;
    };
  
    function externalControlSlide(slideshow, button) { // control slideshow using external element
      button.addEventListener('click', function(event){
        var index = button.getAttribute('data-index');
        if(!index || index == slideshow.selectedSlide + 1) return;
        event.preventDefault();
        showNewItem(slideshow, index - 1, false);
      });
    };
  
    Slideshow.defaults = {
      element : '',
      navigation : true,
      autoplay : false,
      autoplayInterval: 5000,
      swipe: false
    };
  
    window.Slideshow = Slideshow;
    
    //initialize the Slideshow objects
    var slideshows = document.getElementsByClassName('js-slideshow');
    if( slideshows.length > 0 ) {
      for( var i = 0; i < slideshows.length; i++) {
        (function(i){
          var navigation = (slideshows[i].getAttribute('data-navigation') && slideshows[i].getAttribute('data-navigation') == 'off') ? false : true,
            autoplay = (slideshows[i].getAttribute('data-autoplay') && slideshows[i].getAttribute('data-autoplay') == 'on') ? true : false,
            autoplayInterval = (slideshows[i].getAttribute('data-autoplay-interval')) ? slideshows[i].getAttribute('data-autoplay-interval') : 5000,
            swipe = (slideshows[i].getAttribute('data-swipe') && slideshows[i].getAttribute('data-swipe') == 'on') ? true : false;
          new Slideshow({element: slideshows[i], navigation: navigation, autoplay : autoplay, autoplayInterval : autoplayInterval, swipe : swipe});
        })(i);
      }
    }
  }());