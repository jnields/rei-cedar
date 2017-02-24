riot.tag2('another-test', '<h4>Here is another test tag!</h4>', '', '', function(opts) {
});
riot.tag2('cdr-textinput', '<label for="{opts.el_id}" class="{\'sr-only\': !opts.label || opts.nolabel}">{opts.label} <span if="{opts.required}">&nbsp;*</span> </label> <div class="input-wrap"> <input id="{opts.el_id}" aria-label="{opts.label}" type="{opts.type || \'text\'}" name="{opts.name}" maxlength="{opts.maxlength}" placeholder="{opts.placeholder}" required="{opts.required}" disabled="{opts.disabled}" onkeypress="{delayedValidate}" onchange="{setDirty}" onpaste="{immediateValidate}" onkeydown="{checkDelete}" onblur="{setBlurred}" onfocus="{setFocused}" riot-value="{opts.riotValue}"> <div class="validation-icon"> <i class="icon"></i> </div> <div class="validation-block"> <div class="validation-block-inner"> <span>{validationMsg}</span> </div> </div> </div>', '', 'class="{\'has-error\': hasError(), \'has-warning\': hasWarning()}"', function(opts) {
		var _this = this;

		this.mixin( 'validationAnimations' );

		this.validationMsg = opts.pattern_error_msg;
		this.validationBlockOn = !!opts.external_error || false;
		this.shouldShowExternalError = !!opts.external_error;
		this.isDirty = true;
		this.errorBlockAnimating = false;

		this.hasError = () => this.validationBlockOn
		this.hasWarning = () => false

		this.on( 'mount', () => {
			if ( opts.external_error ) {
				_this.validate()
					.then( () => {
						_this.shouldShowExternalError = false;
					} );
			}

			if ( opts.pattern ) {
				this.root.querySelector( 'input' ).pattern = opts.pattern.toString().replace(/^\/|\/$/g, '');
			}
		} );

		this.on( 'update', () => {

		} );

		this.on( 'reset-validation', () => {
			this.update( { validationType: null, validationBlockOn: false } );
			_this.validationBlock.hide();
		} );

		this.setBlurred = ( e ) => {
			e.preventUpdate = true;
			this.isFocused = false;

			if ( this.validationBlockOn || !this.isDirty ) return;
			this.immediateValidate( e );
		}

		this.setFocused = ( e ) => {
			this.isFocused = true;
			this.isDirty = true;
		}

		this.setDirty = ( e ) => {
			e.preventUpdate = true;
			this.isDirty = true;

			this.execProperValidation( e );
		};

		this.execProperValidation = ( e ) => {

			if ( !_this.validationBlockOn ) {
				debounced.cancel();
				debounced( e );
			} else {
				timerId = _.defer( ( e ) => {
					_this.validate( e )
						.catch( _this.handleErr );
				} );
			}
		}

		this.validate = ( e ) => {
			debounced.cancel();
			clearTimeout(timerId);
			return new Promise( ( resolve, reject ) => {
				let _target = _.get( e, 'target' ) || _this.root.querySelector( 'input' );
				let isValid = _target.checkValidity();
				let currentValidityState = _target.validity;

				if ( _this.shouldShowExternalError ) {
					_this.update( { validationBlockOn: true, validationType: 'error', validationMsg: opts.external_error.errorText, isDirty: false } );
					_this.validationBlock.show();

					resolve( 'invalid' );
				}

				else {

					if ( isValid ) {
						_this.update( { validationType: null, validationBlockOn: false, isDirty: false } );
						_this.validationBlock.hide();
						resolve( 'valid' );
					}

					else {

						if( currentValidityState.typeMismatch ){

							if( _target.type === "email" ){
								_this.update( { validationBlockOn: true, validationType: 'error', validationMsg: 'Please enter a valid email.' } );
								_this.validationBlock.show();
							}
							if( _target.type === "tel" ){
								_this.update( { validationBlockOn: true, validationType: 'error', validationMsg: 'Please enter a valid phone number.' } );
								_this.validationBlock.show();
							}
						} else {

							if( currentValidityState.patternMismatch ){
								if( _target.type === "email" ){

									_this.update( { validationBlockOn: true, validationType: 'error', validationMsg: 'Please enter a valid email.' } );
									_this.validationBlock.show();
								} else {
									_this.update( { validationBlockOn: true, validationType: 'error', validationMsg: opts.pattern_error_msg } );
									_this.validationBlock.show();
								}
							}

							else if( opts.required && currentValidityState.valueMissing && !this.isFocused ){
								_this.update( { validationBlockOn: true, validationType: 'error', validationMsg: 'This field is required' });
								_this.validationBlock.show();
							}

							else {
								_this.update( { validationType: null, validationBlockOn: false, hasValidationError: true } );
								_this.validationBlock.hide();
							}
						}

						reject( 'invalid' );
					}
				}

				return;
			} );
		}

		let debounced = _.debounce( () => { this.validate().catch( _this.handleErr ); }, 750, { 'leading': false } );

		let timerId;

		this.delayedValidate = ( e ) => {
			e.preventUpdate = true;

			if ( _this.validationBlockOn ) {

				timerId = _.defer( ( e ) => {
					_this.validate( e )
						.catch( _this.handleErr );
				} );
			} else {
				debounced.cancel();
				debounced( e );
			}
		};

		this.immediateValidate = ( e ) => {
			e.preventUpdate = true;
			debounced.cancel();
			timerId = _.defer( ( e ) => {
				_this.validate( e )
					.catch( _this.handleErr );
			} );
		};

		this.checkDelete = ( e ) => {
			e.preventUpdate = true;
			if ( e.which == 8 || e.which == 46 ) {

				this.isDirty = true;

				this.execProperValidation( e );
			}
			return true;
		}

		this.handleErr = ( e ) => {
			console.log( e, 'debug' );
		}

		this.validationBlock = {
			isHidden: true,
			isShown: false,
			isAnimatingIn: false,
			isAnimatingOut: false,
			currentMsg: null,
			validationType: null,
			errorAnimationClass: 'has-error-animating',
			warningAnimationClass: 'has-warning-animating',
		};

		Object.defineProperty(this.validationBlock, 'show', {
			value: function() {
				if( this.isAnimatingIn || this.isShown && this.currentMsg === _this.validationMsg ) return

				this.isShown = false;
				this.isHidden = false;
				this.isAnimatingIn = true;
				this.isAnimatingOut = false;
				this.validationType = _this.validationType;
				this.currentMsg = _this.validationMsg;

				let animationClass;
				if( this.validationType === 'error' ) animationClass = this.errorAnimationClass;
				if( this.validationType === 'warning' ) animationClass = this.warningAnimationClass;

				_this.root.classList.add( animationClass );
				_this.root.classList.add( 'animating-in' );

				_this.showValidationBlock( _this.root.querySelector( '.validation-block' ), {}, () => {
					this.isAnimatingIn = false;
					this.isShown = true;
					_this.root.classList.remove( animationClass );
					_this.root.classList.remove( 'animating-in' );
					_this.hasValidationError = false;
				} );
			},
		} );

		Object.defineProperty(this.validationBlock, 'hide', {
			value: function() {
				if( this.isAnimatingOut || this.isHidden ) return

				this.isShown = false;
				this.isHidden = false;
				this.isAnimatingIn = false;
				this.isAnimatingOut = true;

				let animationClass;
				if( this.validationType === 'error' ) animationClass = this.errorAnimationClass;
				if( this.validationType === 'warning' ) animationClass = this.warningAnimationClass;

				_this.root.classList.add( animationClass );
				_this.root.classList.add( 'animating-out' );

				_this.hideValidationBlock( _this.root.querySelector( '.validation-block' ), {}, () => {
					this.isAnimatingOut = false;
					this.isHidden = true;
					this.validationType = null;
					_this.root.classList.remove( animationClass );
					_this.root.classList.remove( 'animating-out' );
					_this.hasValidationError = false;
				} );
			}
		} );

});
riot.tag2('test-tag', '<span>Hello Component!</span>', '', '', function(opts) {
});
/////////////////////////////////
// Validation Animations Mixin //
/////////////////////////////////



	var validationAnimations = {
		/**
		 * event handler that opens the drawer below an 
		 * input field to display a validation error.
		 * 
		 * @return {null} no return
		 */
		showValidationBlock: ( element, opts, cb ) => {
			let $el = $( element );
			let _opts = _.extend( opts, {} );
			let prevHeight = $el[ 0 ].offsetHeight || 0;
			let padding = _.get( _opts, 'padding' ) ? _.get( _opts, 'padding' ) : 0;
			let fullHeight = $el.css( { 'display': 'block', 'height': 'auto' } ).height() + padding;
			$el.css( { 'display': ' block', 'height': prevHeight } );
			$el
				.velocity( "stop" )
				.velocity( { height: fullHeight }, { 
					duration: 350, 
					easing: 'easeOutQuint',
					complete: () => {
						if( _.isFunction( cb ) ) cb.call();
					} } );
		},

		/**
		 * Event handler to hide the validation block whenever
		 * the validation state is valid or has been cleared for 
		 * other circumstances.
		 * 
		 * @return {null} no return
		 */
		hideValidationBlock: ( element, opts, cb ) => {
			let $el = $( element );
			$el
				.velocity( "stop" )
				.velocity( { height: 0 }, {
					duration: 350,
					easing: 'easeOutQuint',
					complete: () => {
						$el.css( { 'display': 'none' } );
						if( _.isFunction( cb ) ) cb.call();
					}
				} );
		}
	};

	riot.mixin( 'validationAnimations', validationAnimations );
