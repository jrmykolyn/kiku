/**
 * Kiku is a JavaScript plugin which allows for functions
 * to be invoked in response to user-specified strings
 * of alphanumeric characters.
 *
 * Kiku follows the 'singleton' pattern, meaning that
 * only one instance may exist at a given time.
 *
 * The Kiku instance exposes a public API which allows
 * the invoking script to view, access, and update
 * the instance's settings and data.
 *
 * @summary   Kiku is a JavaScript plugin which allows for
 *			  functions to be invoked in response to
 *			  user-specified strings of alphanumeric
 *			  characters.
 *
 * @link      N/A
 * @since     0.0.0 (if available)
 * @requires  N/A
 *
 * @author    Jesse R Mykolyn <jrmykolyn@gmail.com>
 */

(function(global, document) {
	/* ---------------------------------------------------------------------------------------------------- */
	/* Private Vars */
	/* ---------------------------------------------------------------------------------------------------- */
	/**
	 * Stores a reference to the 'singleton' Kiku instance.
	*/
	var _self = {
		state: {
			isActive: false,
		},
	};

	var _defaults = {
			data: {
				bindings: [],
				functions: {}
			},
			settings: {
				triggerKey: 13,
				dismissKey: 27,
			},
		};

	/* ---------------------------------------------------------------------------------------------------- */
	/* Private Functions */
	/* ---------------------------------------------------------------------------------------------------- */
	/**
	 * Initialize and return the public API for the Kiku Instance
	 *
	 * @param {Object} `options`
	 * @return {Object}
	*/
	function init(options) {
		// Initialize Kiku instance
		_self.init = true;

		// Re-assign `options` object or fallack to empty obj.
		options = (options instanceof Object) ? options : {};

		// Validate/update instance settings && data.
		_self.settings = validateSettings(options.settings || null);
		_self.data = validateData(options.data || null);

		// Reconfigure functions and add global event listeners.
		parseFunctionBindings(_self);
		addEventListeners(global, _self);

		// Expose public API
		return {
			logSettings: function() {
				var output = [],
					str = '';

				for (var key in _self.settings) {
					str += (key + ': ' + _self.settings[key]);

					output.push(str);

					str = '';
				}

				return output;
			},
			getFunctionKeys: function() {
				return Object.keys(_self.data.functions);
			}
		};
	}

	/**
	 * Prints messages to the console relating to the invalid creation of a new Kiku instance.
	 *
	 * @param {Object} `context`
	*/
	function handleInvalidInstantiation(context) {
		var method = (typeof console.error !== 'undefined') ? 'error' : 'log';

		if (context === global) {
			console[method]('`Kiku` MUST BE INITIALIZED USING THE `new` KEYWORD'); // TEMP
		} else {
			console[method]('`Kiku` HAS ALREADY BEEN INITIALIZED'); // TEMP
		}
	}

	/**
	 * Validates any settings received on instantiation.
	 * Modifies the `settings` argument to ensure that all required settings are present.
	 * Falls back to 'default settings' if argument is missing/invalid.
	 *
	 * @param {Object} `settings`
	 * @return {Object}
	*/
	function validateSettings(settings) {
		if (settings instanceof Object) {

			for (var key in _defaults.settings) {
				do {
					if (settings[key] && typeof settings[key] !== typeof _defaults.settings[key]) {
						settings[key] = _defaults.settings[key];
					}

					if (!settings[key]) {
						settings[key] = _defaults.settings[key];
					}
				} while (0);
			}

			return settings;
		} else {

			return _defaults.settings;
		}
	}

	/**
	 * Validates `data` - functions and corresponding strings - received on instantiation.
	 * Modifies the `data` argument to ensure that all required keys are present.
	 * Falls back to 'default data' if argument is missing/invalid.
	 *
	 * @param {Object} `data`
	 * @return {Object}
	*/
	function validateData(data) {
		if (data instanceof Object) {

			for (var key in _defaults.data) {
				do {
					if (data[key] && typeof data[key] !== typeof _defaults.data[key]) {
						data[key] = _defaults.data[key];
					}

					if (!data[key]) {
						data[key] = _defaults.data[key];
					}
				} while (0);
			}

			return data;
		} else {
			return _defaults.data;
		}
	}

	/**
	 * Loops over functions and strings received by Kiku instance, adds to property on self if valid.
	 *
	 * @param {Object} `selfObj`
	 * @return {'undefined'}
	*/
	function parseFunctionBindings(selfObj) {
		if (Array.isArray(selfObj.data.bindings)) {
			for (var i = 0, x = selfObj.data.bindings.length; i < x; i++) {
				var binding = selfObj.data.bindings[i];

				if (binding instanceof Object) {
					if (typeof binding.string === 'string' && binding.fn instanceof Function) {
						_self.data.functions[binding.string.toLowerCase()] = binding.fn;
					}
				}
			}
		}
	}

	/**
	 * Adds a 'keyup' listener to the `window` object.
	 * If event keycode is equal to the value of `triggerKey` (stored on the Kiku instance), `evaluateInput()` is invoked.
	 * Otherwise, `appendCharToInput()` is invoked.
	 *
	 * @param {Object} `context`
	 * @param {Object} `selfObj`
	*/
	function addEventListeners(context, selfObj) {
		// Register core event listeners.
		context.addEventListener('keyup', function( e ) {
			var k = parseInt( e.keyCode );;

			// Handle cases where Kiku is active.
			if ( selfObj.state.isActive ) {
				switch ( k ) {
					case selfObj.settings.dismissKey:
						var e = new CustomEvent( 'KIKU_DISMISS' );
						window.dispatchEvent( e );
						break;
					case selfObj.settings.triggerKey:
						var e = new CustomEvent( 'KIKU_EVALUATE' );
						window.dispatchEvent( e );
						break;
					default:
						var e = new CustomEvent( 'KIKU_APPEND', { detail: { data: e } } );
						window.dispatchEvent( e );
						console.log( selfObj.data.input );
				}
			// Handle cases where Kiku is inactive.
			} else {
					switch ( k ) {
						case selfObj.settings.triggerKey:
							var e = new CustomEvent( 'KIKU_ACTIVATE' );
							window.dispatchEvent( e );
					}
			}

		});

		// Register custom event/Kiku-specific event listeners.
		context.addEventListener( 'KIKU_ACTIVATE', function( e ) {
			_self.state.isActive = true;
		} );

		context.addEventListener( 'KIKU_EVALUATE', function( e ) {
			evaluateInput();
			_self.state.isActive = false;
		} );

		context.addEventListener( 'KIKU_APPEND', function( e ) {
			appendCharToInput( getCharFromKeyCode( parseInt( e.detail.data.keyCode ) ) );
		} );

		context.addEventListener( 'KIKU_DISMISS', function( e ) {
			_self.state.isActive = false;
			/// TODO: Clear `data`.
		} );

		context.addEventListener( 'KIKU_ON_SUCCESS', function( e ) {
			/// TODO
		} );

		context.addEventListener( 'KIKU_ON_FAIL', function( e ) {
			/// TODO
		} );
	}

	/**
	 * Checks for function that matches the value of `input` property on the Kiku instance. Invokes function if valid.
	 * Resets the `input` property to an empty string.
	*/
	function evaluateInput() {
		if (_self.data.input) {
			var k = _self.data.input.toLowerCase();

			if (_self.data.functions[k] instanceof Function) {
				_self.data.functions[k]();

				window.dispatchEvent( ( new CustomEvent( 'KIKU_ON_SUCCESS' ) ) );
			} else {
				window.dispatchEvent( ( new CustomEvent( 'KIKU_ON_FAIL' ) ) );
			}

			_self.data.input = '';
		}
	}

	/**
	 * Adds the received `char` to the `input` property on the Kiku instance.
	 * Sets the `input` property to an empty string if it doesn't exist.
	 *
	 * @param {String} `char`
	*/
	function appendCharToInput(char) {
		if (!_self.data.input) { _self.data.input = ''; }

		_self.data.input += char;
	}

	/**
	 * Returns the alphabetical character for a given integer.
	 *
	 * @param {Number} `keyCode`
	 * @return {String}
	*/
	function getCharFromKeyCode(keyCode) {
		return String.fromCharCode(keyCode);
	}

	/* ---------------------------------------------------------------------------------------------------- */
	/* Constructor */
	/* ---------------------------------------------------------------------------------------------------- */
	global.Kiku = function(options) {
		var _this = this;

		// If Kiku has not been instantiated and context is *not* `window`.
		if (!_self.init && _this !== global) {
			return init(options);

		// Otherwise, display the appropriate error message(s).
		} else {
			handleInvalidInstantiation(_this);
		}
	};
})(window, document);
