/*
 * jQuery DP UniSlider v1.3.2
 *
 * Copyright 2012, Diego Pereyra
 *
 * @Web: http://www.dpereyra.com
 * @Email: info@dpereyra.com
 *
 * Depends:
 * jquery.js
 */
 
 (function($){
	function UniSlider(element, options) {
		this.slider = $(element);
		this.slider.show();
		
		this.settings = $.extend({}, $.fn.dpUniSlider.defaults, options);

			/* global variables */
			
			var self = this;
			this.$container = $(this.slider).css('position','relative'),
			this.isIE = !$.support.opacity,
			this.$wrapper = '';
			this.$slides = $('> li', this.$container),
			this.slidesTotal = this.$slides.length,
			this.animateTimer = null,
			this.isReady = true;
			this.windowWidth = $(window).width(),
			this.$currentSlide = this.$slides.eq('0'),
			this.currentSlideNum = ( this.settings.preselectSlideNum > 0 ? (this.settings.preselectSlideNum - 1) : 
										(this.settings.startRandom ? this.rand(0, (this.slidesTotal -1), -1) : 0) 
									),
			this.firstSlide = true,
			this.firstHeightCalc = false,
			this.arrowsHeight = 0,
			this.outerHeight = 0,
			this.$pauseHoverElement = '',
			this.$autoLoader_icon = '',
			this.$nextSlide = $(), 
			this.no_draggable = false,
			this.hasTouch = false,
			this.downEvent = "mousedown.rs",
			this.moveEvent = "mousemove.rs",
			this.upEvent = "mouseup.rs",
			this.isDragging = false,
			this.successfullyDragged = false,
			this.startTime = 0,
			this.startMouseX = 0,
			this.startMouseY = 0,
			this.currentDragPosition = 0,
			this.lastDragPosition = 0,
			this.accelerationX = 0,
			this.tx = 0;
			this.lastWindowHeight = jQuery(window).height();
			this.lastWindowWidth = jQuery(window).width();
			
			this.sliderScaleRatio = this.settings.autoScaleSliderHeight / this.settings.autoScaleSliderWidth ;
		
			// Touch support
			if("ontouchstart" in window) {
						
				this.hasTouch = true;
				this.downEvent = "touchstart.rs";
				this.moveEvent = "touchmove.rs";
				this.upEvent = "touchend.rs";
			} 
			
			this.sliderWidth = 0;
			this.sliderHeight = 0;
			this.maxHeight = 0;
			
			var resizeTimer;
			
			this.init();
			
	}
	
	UniSlider.prototype = {
		init : function(){
			var me = this;
			
			if ( !this.isIE ) {
				this.$slides.css( {'position':'absolute','top':'0','left':'0','opacity':'0','zIndex':'3','visibility':'hidden','display':'block'} );
			} else {
				this.$slides.css( {'position':'absolute','top':'0','left':this.windowWidth,'zIndex':'3','display':'block'} );
			}
			
			// Create a wrapper
			this.$wrapper = $('<div />').addClass('dpUniSlider_wrapper');
			$(this.$container).before(this.$wrapper);
			this.$wrapper.append($(this.$container));
			this.$wrapper.show();
			
			this.$pauseHoverElement = this.$wrapper;
			
			/* set container height */
			//this.$container.css( 'height', this.$currentSlide.innerHeight() );
			
			this.$container.addClass('dpUniSlider_container');
			this.$slides.addClass('dpUniSlider_slide');
			
			this.$slides.each(this._manageSlides);
			
			this.orientation = (this.settings.slideTransitionEffect == 'vertical' || this.settings.slideTransitionEffect == 'vertical-smooth' ? "vertical" : "horizontal");
			
			/* Display Arrows */
			if(this.settings.showArrows) {
				var left_arrow = $('<a />').addClass('dpUniSlider_larrow '+(this.orientation == 'vertical' ? "vertical" : "horizontal")).attr({href: '#'}),
					right_arrow = $('<a />').addClass('dpUniSlider_rarrow '+(this.orientation == 'vertical' ? "vertical" : "horizontal")).attr({href: '#'});
					
				this.$container.parent().append(left_arrow);
				this.$container.parent().append(right_arrow);
				
				this.arrowsHeight = left_arrow.height();
				
				$(left_arrow).click(function(e) { e.preventDefault(); me._leftArrowActions(me); });
				
				$(right_arrow).click(function(e) { e.preventDefault(); me._rightArrowActions(me); });
				
				if ( !this.isIE ){ 
					$('.dpUniSlider_larrow, .dpUniSlider_rarrow', this.$container.parent()).hover(function(){
						$(this).stop(true,true).fadeTo( 'fast', .5 );
					}, function(){
						$(this).stop(true,true).fadeTo( 'fast', .9 );
					});
				}
				
				if ( this.slidesTotal !== 1 ) $( '.dpUniSlider_larrow, .dpUniSlider_rarrow', this.$container.parent() ).show();
			}
			
			/* Display Navigation */
			if(this.settings.showNavigation) {
				var navigation = (this.settings.customNav != "" ? $(this.settings.customNav) : $('<ul />').addClass('dpUniSlider_nav'));
				
				if(this.settings.customNav == "") {
					for(var i = 1; i <= this.$slides.length; i++) {
						this._createNavigation(i, navigation, me);
					}
				} else {
					this._createNavigation(0, navigation, me);
				}
				
				if ( !this.isIE && this.settings.customNav == "" ){ 
					$(navigation).hover(function(){
						$(this).stop(true,true).fadeTo( 'fast', .8 );
					}, function(){
						$(this).stop(true,true).fadeTo( 'fast', .9 );
					});
				}
				
				if(this.settings.customNav == "") {
					this.$container.parent().append(navigation);
				}
				
				this.$ulNav = (this.settings.customNav != "" ? $(this.settings.customNav) : this.$container.parent().find('ul.dpUniSlider_nav'));
				
				$($(this.$ulNav).find('li')[this.currentSlideNum]).addClass('active');
				
				if ( this.slidesTotal !== 1 && this.settings.customNav == "" ) { 
					$( navigation ).show();
					
					if(this.settings.navPosition == '') { this.settings.navPosition = 'bottom-center'; }
					
					if(this.settings.navPosition == 'top-center' || this.settings.navPosition == 'bottom-center') {
						$( navigation ).css({
							marginLeft: -(navigation.outerWidth() / 2)+'px'
						}); 
					}
					
					if(this.settings.navPosition == 'top-left' || this.settings.navPosition == 'bottom-left') {
						$( navigation ).css({
							left: '10px'	
						});
					}
					
					if(this.settings.navPosition == 'top-right' || this.settings.navPosition == 'bottom-right') {
						$( navigation ).css({
							right: '10px',
							left: 'auto'	
						});
					}
					
					if(this.settings.navPosition == 'top-right' || this.settings.navPosition == 'top-center' || this.settings.navPosition == 'top-left') {
						$( navigation ).css({
							bottom: 'auto',
							top: '10px'	
						});
					}
				}

			}
				
			/* autoload options */
			if(this.slidesTotal !== 1) {
				this.setAutoAnimation();
				
				if(this.settings.autoSlide && !this.$pauseHoverElement.find('.dpUniSlider_autoLoader').length && this.settings.showAutoSlideIcon) {
						this.$autoLoader_icon = $('<div />').addClass( 'dpUniSlider_autoLoader' );
						this.$pauseHoverElement.append(this.$autoLoader_icon);
						this.$autoLoader_icon.stop().fadeIn('fast');
				}
			} else {
				this.settings.showAutoSlideIcon = false;	
			}
			
			/* touch support */
			if(this.slidesTotal !== 1 && this.settings.draggable) {
				this.$container.addClass('isDraggable');
				this.$container.bind(this.downEvent, function(e) { 	

					if(!me.no_draggable) {
						me.startDrag(e); 	
					} else if(!me.hasTouch) {							
						e.preventDefault();
					}								
				});	
				
				$('iframe', this.$container).bind(this.downEvent, function(e) { 	

					if(!this.no_draggable) {
						me.startDrag(e); 	
					} else if(!me.hasTouch) {							
						e.preventDefault();
					}								
				});	
			}
			
			// Nav on hover
			if(this.settings.navOnHover) {
				
				$( '.dpUniSlider_larrow, .dpUniSlider_rarrow, .dpUniSlider_nav', this.$container.parent() ).animate({opacity: 0}, 'fast');
				this._fadeOnHover(me);
			}
			
			this.$slides.each(function() {$(this).children().each(function(i) { me._loadChildrenAnimations(i, this, me); });});
			
			this.goToSlide(this.currentSlideNum);
			
			$(window).bind('resize', function() {
				//confirm window was actually resized
				if($(window).height()!=me.lastWindowHeight || $(window).width()!=me.lastWindowWidth){
			
					//set this windows size
					me.lastWindowHeight = $(window).height();
					me.lastWindowWidth = $(window).width();
					
					//on window resize stuff
					
					me.updateSliderSize();
				}
			});
		},
		_fadeOnHover : function(me) {
			if(this.settings.navOnHover) {
				this.$pauseHoverElement.hover(function(){
					$( '.dpUniSlider_larrow, .dpUniSlider_rarrow', me.$container.parent() ).animate({opacity: .7}, 'fast');
					$( '.dpUniSlider_nav', me.$container.parent() ).animate({opacity: 1}, 'fast');
				}, function() {
					$( '.dpUniSlider_larrow, .dpUniSlider_rarrow, .dpUniSlider_nav', me.$container.parent() ).animate({opacity: 0}, 'fast');
				});
			}
		},
		_manageSlides : function(i){
			/* Set Background */
			var $background = $(this).find("img[data-unislider-type='background']");
			if($background.length) {
				$(this).css({ backgroundImage: 'url('+$background.attr('src')+')' });
				$background.remove();
			}
			
			/* Set Caption */
			var $caption = $(this).find("span[data-unislider-type='caption']");
			if($caption.length) {
				caption_position = (typeof $($caption).data('unislider-position') !== 'undefined' ? $($caption).data('unislider-position') : 'top-center');
				
				var caption_text = $('<span />').addClass('dpUniSlider_caption').html($caption.html());
				$(this).append(caption_text);
				$caption.remove();
				
				if(caption_position == 'top-center' || caption_position == 'bottom-center') {
					caption_text.css({
						marginLeft: -(caption_text.outerWidth() / 2)+'px'	
					});
				}
				
				if(caption_position == 'top-left' || caption_position == 'bottom-left') {
					caption_text.css({
						left: '10px'	
					});
				}
				
				if(caption_position == 'top-right' || caption_position == 'bottom-right') {
					caption_text.css({
						right: '10px',
						left: 'auto'	
					});
				}
				
				if(caption_position == 'bottom-right' || caption_position == 'bottom-center' || caption_position == 'bottom-left') {
					caption_text.css({
						bottom: '10px',
						top: 'auto'
					});
				}
				
			}
		},
		_leftArrowActions : function(me){
			me.clearAutoTimer();
			me.goToSlide( me.currentSlideNum - 1 );
			return false;
		},
		_rightArrowActions : function(me){
			me.clearAutoTimer();
			me.goToSlide( me.currentSlideNum + 1 );
			return false;
		},
		_createNavigation : (function(i, navigation, me) {
			if(this.settings.customNav == "") {
				navigation.append($('<li />').click(function() {
						if(!$(this).hasClass('active')) {
							me.goToSlide( i - 1 );
						}
					})
				);
			} else {
				navigation.find('li').each(function(y) {
					$(this).click(function() {
						me.goToSlide( y );
					})
				});
			}
		}),
		goToSlide : function( nextSlideNum, autoSliding, id ){

			if(!this.isReady) { return; }
			
			this.isReady = false;
			
			if ( autoSliding && this.settings.pauseOnHover && this.$pauseHoverElement.is('.dpUniSlider_ishovered') ) {
				this.isReady = true;
				this.clearAutoTimer();
				this.setAutoAnimation();
				return;
			}

			var directionMod = (this.currentSlideNum - nextSlideNum),
				startOffset = this.settings.startOffset * directionMod,
				endOffset = this.settings.endOffset * directionMod,
				currentstartOffset = this.$currentSlide.width() * directionMod + ( this.settings.slideOpacity * -directionMod ),
				nextstartOffset = this.$currentSlide.width() * directionMod,
				nextstartOffsetY,
				hideAutoloadIcon = false;

			/* OnSlidePrev and OnSlideNext Events */
			if ( directionMod > 0 ) { 
				if(typeof this.settings.onSlidePrev === 'function' && !this.firstSlide) { this.settings.onSlidePrev(nextSlideNum + 1); }
			} else { 
				if(typeof this.settings.onSlideNext === 'function' && !this.firstSlide) { this.settings.onSlideNext(nextSlideNum + 1); } 
			}
			
			/* Loop Hook */
			if(!this.settings.loop) {
				if(((nextSlideNum + 1) == this.slidesTotal) && this.settings.autoSlide) { this.clearAutoTimer();  }
				if((nextSlideNum + 1) > this.slidesTotal) { return; }

				if((this.slidesTotal - 1) == nextSlideNum) { 
					$( '.dpUniSlider_rarrow', this.$container.parent() ).hide().height(0); 

					if(!this.settings.autoSlideRandom) {
						hideAutoloadIcon = true;
					}
				} else { 
					$( '.dpUniSlider_rarrow', this.$container.parent() ).height(this.arrowsHeight).show(); 
				}
				(nextSlideNum == 0) ? $( '.dpUniSlider_larrow', this.$container.parent() ).hide().height(0) : $( '.dpUniSlider_larrow', this.$container.parent() ).height(this.arrowsHeight).show(); 

			}
			
			if ( nextSlideNum < 0 ) nextSlideNum = this.slidesTotal-1;
			if ( nextSlideNum >= this.slidesTotal ) nextSlideNum = 0;
			
			this.currentSlideNum = nextSlideNum;
			
			this.$nextSlide = this.$slides.eq( nextSlideNum );
			
			if(this.settings.showNavigation) {
				$(this.$ulNav.find('li')).removeClass('active');
				$(this.$ulNav.find('li')[nextSlideNum]).addClass('active');
			}
			
			/* Stop Videos */
			$("iframe", this.$currentSlide).attr("src",function ( i, val ) { return val; });
			
			/* OnSlideBeforeMove event */
			if(typeof this.settings.onSlideBeforeMove === 'function' && !this.firstSlide) { this.settings.onSlideBeforeMove(); }
			
			this.no_draggable = true;
			
			var me = this;
			
			switch(this.settings.slideTransitionEffect) {
				case 'default':
				default:
					this.$currentSlide.css('zIndex','3').animate( 
						{ 'left': -startOffset + 'px' }, 
						(this.firstSlide ? 500 : this.settings.slideTransitionSpeed),
						function() {
							if(me.settings.elementsDelayTransition) {
								$(me.$nextSlide).children().not("span.dpUniSlider_caption").css({opacity:0});
							}
							me.$nextSlide.css({
								'left': -nextstartOffset+'px',
								'zIndex':'4',
								'visibility':'visible'
							}).animate( 
								!this.isIE ? {'left': endOffset + 'px', 'opacity':'1'} : {'left': endOffset + 'px'}, 
								me.settings.slideTransitionSpeed
							).animate( 
								{'left': '0'}, 
								me.settings.slideTransitionSpeed, 
								function(){
									
									me._nextSlideTransition(hideAutoloadIcon);
									me.isReady = true;
								} 
							);	
						}
					).animate( 
						!this.isIE ? { 'left': currentstartOffset+'px','opacity':'0' } : { 'left': currentstartOffset+'px' }, 
						(this.firstSlide ? 500 : this.settings.slideTransitionSpeed), 
						function(){
						
							UniSlider.prototype._currentSlideTransition(me, null, false);
						
						}
					);
					break;
					
				case 'vertical':
					this.$currentSlide.css('zIndex','3').animate( 
						{ 'top': -startOffset + 'px' }, 
						this.settings.slideTransitionSpeed,
						function() {
							if(me.settings.elementsDelayTransition) {
								$(me.$nextSlide).children().not("span.dpUniSlider_caption").css({opacity:0});
							}
							me.$nextSlide.css({
								'top': -nextstartOffset+'px',
								'zIndex':'4',
								'visibility':'visible'
							}).animate( 
								!this.isIE ? {'top': endOffset + 'px', 'opacity':'1'} : {'top': endOffset + 'px'}, 
								me.settings.slideTransitionSpeed 
							).animate( 
								{'top': '0'}, 
								me.settings.slideTransitionSpeed, 
								function(){
									
									me._nextSlideTransition(hideAutoloadIcon);
									me.isReady = true;
								} 
							);	
						}
					).animate( 
						!this.isIE ? { 'top': currentstartOffset+'px','opacity':'0' } : { 'top': currentstartOffset+'px' }, 
						this.settings.slideTransitionSpeed, 
						function(){
						
							UniSlider.prototype._currentSlideTransition(me, null, false);
						
						}
					);
					break;
					
				case 'vertical-smooth':
					this.$currentSlide.css('zIndex','3');
					UniSlider.prototype._currentSlideTransition(me, null, false);
					nextstartOffsetY = this.$nextSlide.outerHeight() * directionMod;
					
					if(me.settings.elementsDelayTransition) {
						$(me.$nextSlide).children().not("span.dpUniSlider_caption").css({opacity:0});
					}
					me.$nextSlide.stop().css({
						'top': -nextstartOffsetY+'px',
						'zIndex':'4',
						'visibility':'visible', 
						'opacity': 1
					});	
					
					me.$slides.animate( 
						{'top': '+='+nextstartOffsetY+'px'}, 
						me.settings.slideTransitionSpeed, 
						function(){
							
							me._nextSlideTransition(hideAutoloadIcon);
							me.isReady = true;
						} 
					);	
					
					if(!me.firstSlide) {
						me.$currentSlide.animate( 
							{ 'opacity':'0' }, 
							me.settings.slideTransitionSpeed
						);
					}
						
					UniSlider.prototype._currentSlideTransition(me, null, false);
				
					break;
						
				case 'fade':
					
					me.$slides.css( 
						{'zIndex': '3'}
					);
					
					this.$currentSlide.css('zIndex','5');
					
					if(me.settings.elementsDelayTransition) {
						$(me.$nextSlide).children().not("span.dpUniSlider_caption").css({opacity:0});
					}
					
					me.$nextSlide.stop().css({
						'zIndex':'4',
						'visibility':'visible',
						'opacity': 1
					}).animate( 
						{'opacity': '1'}, 
						me.settings.slideTransitionSpeed, 
						function(){
							me.$slides.css( 
								{'zIndex': '3'}
							);
							me.$nextSlide.stop().css({
								'zIndex':'4'
							});
							me._nextSlideTransition(hideAutoloadIcon);
							me.isReady = true;
						} );	
					
					
					
					if(!me.firstSlide) {
						me.$currentSlide.animate( 
							{ 'opacity':'0', 'left': '0' }, 
							me.settings.slideTransitionSpeed
						);
					}
						
					UniSlider.prototype._currentSlideTransition(me, null, false);
				
					break;
					
				case 'smooth':
					this.$currentSlide.css('zIndex','3');
					
					if(me.settings.elementsDelayTransition) {
						$(me.$nextSlide).children().not("span.dpUniSlider_caption").css({opacity:0});
					}
					me.$nextSlide.stop().css({
						'left': -nextstartOffset+'px',
						'zIndex':'4',
						'visibility':'visible', 
						'opacity': 1
					});	
					
					me.$slides.animate( 
						{'left': '+='+nextstartOffset+'px'}, 
						me.settings.slideTransitionSpeed, 
						function(){

							me._nextSlideTransition(hideAutoloadIcon);
							me.isReady = true;
						} 
					);
					
					if(!me.firstSlide) {
						me.$currentSlide.animate( 
							{ 'opacity':'0' }, 
							me.settings.slideTransitionSpeed
						);
					}
						
					UniSlider.prototype._currentSlideTransition(me, null, false);
				
					break;
			}
		},
		_currentSlideTransition : function(me, fnk, hide) {

			if(hide === 'undefined' || hide) {
				$(me.$slides).css('visibility', 'hidden');
			}

			if(me.settings.autoSlide && me.settings.showAutoSlideIcon) {
				me.$autoLoader_icon.fadeOut('fast');
			}
			
			me.outerHeight = 0;

			// Load children animations
			$(me.$nextSlide).children().each(function(i) { me._loadChildrenAnimations(i, this, me); });
			
			/* Set Height */
			if(me.settings.fixedHeight != '' && me.settings.fixedHeight > 0 && !me.settings.updateSliderResize) {
				me.$container.height(me.settings.fixedHeight);
				me.$slides.height(me.settings.fixedHeight);
				me.maxHeight = me.settings.fixedHeight;
			} else {
				me.changeContainerHeight( me.$nextSlide );
			}
						
			if(typeof fnk == 'function')
				fnk.call(this);
		},
		_nextSlideTransition : function(hideAutoloadIcon) {
			var self = this;
			
			this.$nextSlide.css('visibility', 'visible');
			
			/* Stop Videos */
			$("object", this.$currentSlide).html(function ( i, val ) { return val; });

			this.$currentSlide = this.$nextSlide;

			this.clearAutoTimer();
			this.no_draggable = false;
			if(this.slidesTotal !== 1) {
				this.setAutoAnimation();
			}
			
			/* OnAfterSlideMove event */
			if(typeof this.settings.onSlideAfterMove === 'function' && !this.firstSlide) { this.settings.onSlideAfterMove(); }
			
			this.$pauseHoverElement.unbind('mouseenter mouseleave');
			this._fadeOnHover(self);
			
			if(!hideAutoloadIcon && this.settings.autoSlide) {
				if(self.settings.showAutoSlideIcon) { this.$autoLoader_icon.fadeIn('fast'); }
				
				if(this.settings.pauseOnHover) {
					
					this.$pauseHoverElement.hover(function(){
						$(this).addClass('dpUniSlider_ishovered');
						
						if(self.settings.showAutoSlideIcon) {
							if(self.$autoLoader_icon.is(':animated')) { self.$autoLoader_icon.stop().css('display', 'none'); return; }
							self.$autoLoader_icon.stop().fadeOut('fast');
						}
					}, function(){
						$(this).removeClass('dpUniSlider_ishovered');
						
						if(self.settings.showAutoSlideIcon) {
							if(self.$autoLoader_icon.is(':animated')) { self.$autoLoader_icon.stop().css({display: 'block', opacity: '1'}); return; }
							self.$autoLoader_icon.stop().fadeIn('fast');
						}
					});
				}
			}
			this.firstSlide = false;
		},
		_loadChildrenAnimations : function(i, element, me) {

			var unislider_settings 	= 	$(element).data('unislider-settings');
			var unislider_left 		= 	(typeof unislider_settings !== 'undefined' ? me.addPx(unislider_settings.left) : '');
			var unislider_right 	= 	(typeof unislider_settings !== 'undefined' ? me.addPx(unislider_settings.right) : '');
			var unislider_top 		= 	(typeof unislider_settings !== 'undefined' ? me.addPx(unislider_settings.top) : '');
			var unislider_align 	= 	(typeof unislider_settings !== 'undefined' ? unislider_settings.align : '');
			var unislider_width 	= 	(typeof unislider_settings !== 'undefined' ? me.addPx(unislider_settings.width) : '');
			var unislider_speed 	= 	me.settings.elementsDelayTransitionSpeed;

			$(element).not("span.dpUniSlider_caption").css({
				position: 'absolute',
				display: 'block',
				top: 0 
			});	
			
			if(unislider_width != '') { $(element).css('width', unislider_width); }
			
			if(unislider_left == 'center') { 
				$(element).css({left: -($(element).width())+'px', opacity: 0});
				
				if(me.settings.elementsDelayTransition) {
					$(element).delay(unislider_speed * i).animate({left: '50%', marginLeft: -($(element).outerWidth() / 2)+'px', opacity: 1}, 1000);
				} else {
					$(element).css({left: '50%', marginLeft: -($(element).outerWidth() / 2)+'px', opacity: 1});
				}
			} else if(unislider_left != '' && typeof unislider_left != 'undefined') { 
				$(element).css({left: -($(element).width())+'px', opacity: 0});
				
				if(me.settings.elementsDelayTransition) {
					$(element).delay(unislider_speed * i).animate({left: unislider_left, opacity: 1}, 1000); 
				} else {
					$(element).css({left: unislider_left, opacity: 1});
				}
			}

			if(unislider_right == 'center') { 
				$(element).css({right: -($(element).width())+'px', opacity: 0});
				
				if(me.settings.elementsDelayTransition) {
					$(element).delay(unislider_speed * i).animate({right: '50%', marginRight: -($(element).outerWidth() / 2)+'px', opacity: 1}, 1000);
				} else {
					$(element).css({right: '50%', marginRight: -($(element).outerWidth() / 2)+'px', opacity: 1});
				}
			} else if(unislider_right != '' && typeof unislider_right != 'undefined') { 
				$(element).css({right: -($(element).width())+'px', opacity: 0});
				
				if(me.settings.elementsDelayTransition) {
					$(element).delay(unislider_speed * i).animate({right : unislider_right, opacity: 1}, 1000); 
				} else {
					$(element).css({right : unislider_right, opacity: 1});
				}
			}
			
			if(unislider_top != '') { $(element).css('top', unislider_top); }
			
			if(unislider_align != '') { $(element).css('text-align', unislider_align); }
			
			if(unislider_right == '' && unislider_left == '') { 
				if(me.settings.elementsDelayTransition) {
					$(element).delay(unislider_speed * i).animate({opacity: 1}, 500); 
				} else {
					$(element).css({opacity: 1});
				} 
			}
			
			if(($(element).outerHeight() + parseInt($(element).css('top').replace('px', ''), 10)) > me.outerHeight) { 
				me.outerHeight = ($(element).outerHeight() + parseInt($(element).css('top').replace('px', ''), 10)); 
			}
			if(i == $(element).parent().children().length - 1 && me.firstHeightCalc == false && $(element).parent().is("li:first-child")) {
				$(me.$slides).eq( 0 ).height( me.outerHeight );
				me.$container.css( 'height', me.$currentSlide.innerHeight() );
				me.firstHeightCalc = true;
			}
			$(me.$nextSlide).height( me.outerHeight );
			

		},
		_loadChildrenStatic : function(i, element, me) {

			var unislider_settings 	= 	$(element).data('unislider-settings');
			var unislider_left 		= 	(typeof unislider_settings !== 'undefined' ? me.addPx(unislider_settings.left) : '');
			var unislider_right 	= 	(typeof unislider_settings !== 'undefined' ? me.addPx(unislider_settings.right) : '');
			var unislider_top 		= 	(typeof unislider_settings !== 'undefined' ? me.addPx(unislider_settings.top) : '');
			var unislider_align 	= 	(typeof unislider_settings !== 'undefined' ? unislider_settings.align : '');
			var unislider_width 	= 	(typeof unislider_settings !== 'undefined' ? me.addPx(unislider_settings.width) : '');
			var unislider_speed 	= 	me.settings.elementsDelayTransitionSpeed;


			if(unislider_width != '') { $(element).css('width', unislider_width); }
			
			if(unislider_left == 'center') { 
				
				$(element).css({left: '50%', marginLeft: -($(element).outerWidth() / 2)+'px', opacity: 1});
			
			} else if(unislider_left != '' && typeof unislider_left != 'undefined') { 
				
				$(element).css({left: unislider_left, opacity: 1});
			
			}

			if(unislider_right == 'center') { 
			
				$(element).css({right: '50%', marginRight: -($(element).outerWidth() / 2)+'px', opacity: 1});
				
			} else if(unislider_right != '' && typeof unislider_right != 'undefined') { 
				
				$(element).css({right : unislider_right, opacity: 1});
				
			}
			
			if(unislider_top != '') { $(element).css('top', unislider_top); }
			
			if(unislider_align != '') { $(element).css('text-align', unislider_align); }
			
			if(unislider_right == '' && unislider_left == '') { 
				
				$(element).css({opacity: 1});
				
			}
			
			if(($(element).outerHeight() + parseInt($(element).css('top').replace('px', ''), 10)) > me.outerHeight) { 
				me.outerHeight = ($(element).outerHeight() + parseInt($(element).css('top').replace('px', ''), 10)); 
			}
			if(i == $(element).parent().children().length - 1 && me.firstHeightCalc == false && $(element).parent().is("li:first-child")) {
				$(me.$slides).eq( 0 ).height( me.outerHeight );
				me.$container.css( 'height', me.$currentSlide.innerHeight() );
				me.firstHeightCalc = true;
			}
			if(me.settings.fixedHeight == '' || me.settings.fixedHeight == 0) {
				
				$(me.$nextSlide).height( me.outerHeight );
			
			}

		},
		changeContainerHeight : function( element, callback_function ){
			var newHeight = element.innerHeight(),
				containerHeight = this.$container.innerHeight(),
				self = this;
			if ( containerHeight === newHeight ){
				if ( callback_function instanceof Function ) callback_function.call( this );
				return;
			}

			$(self.$container).animate( { 'height': newHeight }, 'fast', function(){
				self.maxHeight = $(this).height();
				if ( callback_function instanceof Function ) callback_function.call( this );
			} );
		},
		setAutoAnimation : function(){
			if ( this.settings.autoSlide ) { var self = this; this.animateTimer = setTimeout( function(){ self.autoNext(self); }, this.settings.autoSlideSpeed ); }
		},
		clearAutoTimer : function(){
			if ( this.settings.autoSlide && typeof this.animateTimer !== 'undefined' ) clearTimeout( this.animateTimer );
		},
		autoNext : function(self){
			if(self.settings.autoSlideRandom && self.slidesTotal > 1) {
				var rand_num = self.rand(0, (self.slidesTotal - 1), self.currentSlideNum);
				if( rand_num != self.currentSlideNum ) {
					self.goToSlide( rand_num, true );
				}
			} else {
				self.goToSlide( self.currentSlideNum + 1, true );
			}
			
		},
		rand : function(min_val, max_val, current) {
			var argc = arguments.length, rand_val = 0;
			if (argc === 0) {
				min = 0;
				max = 2147483647;
			} else if (argc === 1) {
				throw new Error('Warning: rand() expects exactly 3 parameters, 1 given');
			}
			
			rand_val = Math.floor(Math.random() * (max_val - min_val + 1)) + min_val;

			if(rand_val == current) { return this.rand(min_val, max_val, current); }
			
			return rand_val;
		},
		addPx : function(val){
			if(val != '' && !isNaN(val)) {
				val+= "px";
			}
			return val;
		},
		updateSliderSize:function() {
			var self = this;			
			
			var newWidth;
			var newHeight;
			
			newWidth = this.slider.width();
			// XX  if(newWidth != this.sliderWidth && this.maxHeight > (newWidth * this.sliderScaleRatio)) {
			if(newWidth != this.sliderWidth) {
				// XX this.slider.css("height", newWidth * this.sliderScaleRatio);
				//this.slider.css("height", this.$currentSlide.height());
			}		

			newWidth = this.slider.width();
			newHeight = this.slider.height();
			
			
			if(newWidth != this.sliderWidth || newHeight != this.sliderHeight) {
			
				this.sliderWidth = newWidth;
				this.sliderHeight = newHeight;				
				
				var arLen=this.slidesTotal;
				var _currItem, _currImg;					

				for ( var i=0, len=arLen; i<len; ++i ){
					_currItem = this.$slides[i];
					_currImg = $(_currItem).find("img");
					if(_currImg) {							
						$(_currImg).each(function(i){
							//$(_currImg[i]).attr("width",$(_currImg[i]).width() * self.sliderScaleRatio);
						});				
					}
					
					$(_currItem).css({height: self.sliderHeight, width: self.sliderWidth});
				}
				
			}
			
			// Load children animations
			self.outerHeight = 0;
			$(self.$nextSlide).children().each(function(i) { self._loadChildrenStatic(i, this, self); });

		},
		
		// Start dragging the slide
		startDrag:function(e) {
			if(!this.isDragging) {					
				var point;
				if(this.hasTouch) {
					//parsing touch event
					this.lockVerticalAxis = false;
					
					var currTouches = e.originalEvent.touches;
					if(currTouches && currTouches.length > 0) {
						point = currTouches[0];
					}					
					else {	
						return false;						
					}
				} else {
					point = e;		
					
					if (e.target) el = e.target;
					else if (e.srcElement) el = e.srcElement;

					if(el.toString() !== "[object HTMLEmbedElement]" && el.toString() !== "[object HTMLObjectElement]" && el.toString() !== "[object HTMLInputElement]") {	
						e.preventDefault();						
					}
				}

				this.isDragging = true;
				
				var self = this;
				
				$(document).bind(this.moveEvent, function(e) { if(!self.hasTouch) { e.preventDefault();	} self.moveDrag(e); });
				$(document).bind(this.upEvent, function(e) { self.releaseDrag(e); });		

				
				startPos = this.tx = parseInt(this.$slides.css((this.orientation == 'vertical' ? "top" : "left")), 10);	
				
				this.successfullyDragged = false;
				this.accelerationX = this.tx;
				this.startTime = (e.timeStamp || new Date().getTime());
				this.startMouseX = point.clientX;
				this.startMouseY = point.clientY;
			}
			return false;	
		},				
		moveDrag:function(e) {	
			
			var point;
			if(this.hasTouch) {	
				if(this.lockVerticalAxis) {
					return false;
				}	

				var touches = e.originalEvent.touches;
				// If touches more then one, so stop sliding and allow browser do default action
				
				if(touches.length > 1) {
					return false;
				}
				
				point = touches[0];	
				
				if(Math.abs(point.clientY - this.startMouseY) > Math.abs(point.clientX - this.startMouseX) + 3) {
					if(this.settings.lockVertical) {
						this.lockVerticalAxis = true;
					}						
					return false;
				}
			
				e.preventDefault();				
			} else {
				point = e;
				e.preventDefault();		
			}

			// Helps find last direction of drag move
			this.lastDragPosition = this.currentDragPosition;
			var distance = (this.orientation == 'vertical' ? point.clientY - this.startMouseY : point.clientX - this.startMouseX);
			if(this.lastDragPosition != distance) {
				this.currentDragPosition = distance;
			}

			if(distance != 0)
			{	
				if(!this.settings.loop) {
					if(this.currentSlideNum == 0) {			
						if(distance > 0) {
							distance = Math.sqrt(distance) * 5;
						}			
					} else if(this.currentSlideNum == (this.slidesTotal -1)) {		
						if(distance < 0) {
							distance = -Math.sqrt(-distance) * 5;
						}	
					}
				}
				/* OnDrag Event */
				if(typeof this.settings.onDrag === 'function') { this.settings.onDrag(); }
				
				this.$container.addClass('isDragging');
				this.$slides.css((this.orientation == 'vertical' ? "top" : "left"), distance);		
				
			}	
			
			var timeStamp = (e.timeStamp || new Date().getTime());
			if (timeStamp - this.startTime > 350) {
				this.startTime = timeStamp;
				this.accelerationX = this.tx + distance;						
			}
			
				
			return false;		
		},
		releaseDrag:function(e) {

			if(this.isDragging) {	
				var self = this;
				this.isDragging = false;			
				this.$container.removeClass('isDragging');
				
				var endPos = parseInt(this.$slides.css((this.orientation == 'vertical' ? "top" : "left")), 10);

				$(document).unbind(this.moveEvent).unbind(this.upEvent);					

				if(endPos == this._startPos) {						
					this.successfullyDragged = false;
					return;
				} else {
					this.successfullyDragged = true;
				}
				
				var dist = ((this.orientation == 'vertical' ? this.accelerationY : this.accelerationX) - endPos);		
				var duration =  Math.max(40, (e.timeStamp || new Date().getTime()) - this.startTime);
				// For nav speed calculation F=ma :)
				var v0 = Math.abs(dist) / duration;	
				
				
				var newDist = this.$slides.width() - Math.abs(startPos - endPos);
				var newDuration = Math.max((newDist * 1.08) / v0, 200);
				newDuration = Math.min(newDuration, 600);
	
				function returnToCurrent() {						
					newDist = Math.abs(startPos - endPos);
					newDuration = Math.max((newDist * 1.08) / v0, 200);
					newDuration = Math.min(newDuration, 500);

					$(self.$slides).animate(
						(self.orientation == 'vertical' ? {'top': 0} : {'left': 0}), 
						'fast'
					);
				}
				
				/* OnDragRelease Event */
				if(typeof this.settings.onDragRelease === 'function') { this.settings.onDragRelease(); }
				
				// calculate slide move direction
				if((startPos - this.settings.dragOffset) > endPos) {		

					if(this.lastDragPosition < this.currentDragPosition || (!this.settings.loop && (this.currentSlideNum == (this.slidesTotal -1)))) {	
						returnToCurrent();
						return false;					
					}

					this.goToSlide(this.currentSlideNum + 1);
				} else if((startPos + this.settings.dragOffset) < endPos) {	

					if(this.lastDragPosition > this.currentDragPosition || (!this.settings.loop && (this.currentSlideNum == 0))) {
						returnToCurrent();
						return false;
					}
					this.goToSlide(this.currentSlideNum - 1);

				} else {
					returnToCurrent();
				}
			}

			return false;
		}
	}
	
	$.fn.dpUniSlider = function(options) {  
		var dpUniSlider;
		this.each(function(){
			dpUniSlider = new UniSlider($(this), options);
			$(this).data("dpUniSlider", dpUniSlider);
			
		});

		this.getCurrentSlide = function() {
			return (dpUniSlider.currentSlideNum + 1);
		}  
		
		this.nextSlide = function() {
			dpUniSlider.goToSlide(dpUniSlider.currentSlideNum + 1);
		}  
		
		this.prevSlide = function() {
			dpUniSlider.goToSlide(dpUniSlider.currentSlideNum - 1);
		}
		
		this.goToSlide = function(num) {
			dpUniSlider.goToSlide(num - 1);
		} 
		
		this.autoSlidePause = function() {
			dpUniSlider.settings.autoSlide = false;
			dpUniSlider.clearAutoTimer();
		}  
		
		this.autoSlideResume = function() {
			dpUniSlider.settings.autoSlide = true;
			dpUniSlider.setAutoAnimation();
		}  
		
		return this;
	};
	
	$.fn.dpUniSlider.defaults = { 
		autoSlideSpeed: 5000,
		autoSlide: false,
		autoSlideRandom: false,
		startRandom: false,
		pauseOnHover: false,
		showAutoSlideIcon: true,
		loop: true,
		showArrows: true,
		showNavigation: true,
		customNav: '',
		navOnHover: false,
		draggable: true,
		navPosition: 'bottom-center',
		fixedHeight: '',
		preselectSlideNum: 0,
		elementsDelayTransition: true,
		elementsDelayTransitionSpeed: 500,
		slideTransitionSpeed: 200,
		slideTransitionEffect: 'default',
		startOffset: 110,
		endOffset: 80,
		dragOffset: 50,
		slideOpacity: 0,
		lockVertical: true,
		onSlideBeforeMove: function(){},
		onSlideAfterMove: function(){},
		onSlidePrev: function(){},
		onSlideNext: function(){},
		onDrag: function(){},
		onDragRelease: function(){},
		autoScaleSliderWidth: 960,        
   		autoScaleSliderHeight: 400,
		updateSliderResize: false
	}
	
	$.fn.dpUniSlider.settings = {}
})(jQuery);