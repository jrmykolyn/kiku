'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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

(function (global, document) {
	// --------------------------------------------------
	// Private Vars
	// --------------------------------------------------
	/**
  * Stores a reference to the 'singleton' Kiku instance.
 */
	var _self = {
		state: {
			isActive: false,
			input: ''
		}
	};

	var _defaults = {
		data: {
			bindings: []
		},
		settings: {
			triggerKey: 13,
			dismissKey: 27
		}
	};

	// --------------------------------------------------
	// Private Functions
	// --------------------------------------------------
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
		options = options instanceof Object ? options : {};

		// Validate/update instance settings && data.
		_self.settings = validateInput(options.settings, 'settings');
		_self.data = validateInput(options.data, 'data');

		addEventListeners(global, _self);

		// Expose public API
		return {
			getFunctionKeys: function getFunctionKeys() {
				return _self.data.bindings.map(function (binding) {
					return binding.string;
				});
			}
		};
	}

	/**
  * Prints messages to the console relating to the invalid creation of a new Kiku instance.
  *
  * @param {Object} `context`
 */
	function handleInvalidInstantiation(context) {
		var method = typeof console.error !== 'undefined' ? 'error' : 'log';

		if (context === global) {
			console[method]('`Kiku` MUST BE INITIALIZED USING THE `new` KEYWORD'); // TEMP
		} else {
			console[method]('`Kiku` HAS ALREADY BEEN INITIALIZED'); // TEMP
		}
	}

	/**
  * Validates any data received on instantiation.
  *
  * Modifies the `data` object to ensure that all required keys are present.
  *
  * Falls back to default value if a given input is missing/invalid.
  *
  * @param {Object} `settings`
  * @param {string} `key`
  * @return {Object}
 */
	function validateInput(data, key) {
		if (!data || (typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') {
			return _defaults[key];
		}

		for (var k in _defaults[key]) {
			if (!data[k]) {
				data[k] = _defaults[key][k];
			} else if (_typeof(data[k]) !== _typeof(_defaults[key][k])) {
				data[k] = _defaults[key][k];
			}
		}

		return data;
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
		context.addEventListener('keyup', function (e) {
			var k = parseInt(e.keyCode);;

			// Handle cases where Kiku is active.
			if (selfObj.state.isActive) {
				switch (k) {
					case selfObj.settings.dismissKey:
						var e = new CustomEvent('KIKU_DISMISS');
						window.dispatchEvent(e);
						break;
					case selfObj.settings.triggerKey:
						var e = new CustomEvent('KIKU_EVALUATE');
						window.dispatchEvent(e);
						break;
					default:
						var e = new CustomEvent('KIKU_APPEND', { detail: { data: e } });
						window.dispatchEvent(e);
				}
				// Handle cases where Kiku is inactive.
			} else {
				switch (k) {
					case selfObj.settings.triggerKey:
						var e = new CustomEvent('KIKU_ACTIVATE');
						window.dispatchEvent(e);
				}
			}
		});

		// Register custom event/Kiku-specific event listeners.
		context.addEventListener('KIKU_ACTIVATE', function (e) {
			_self.state.isActive = true;
		});

		context.addEventListener('KIKU_EVALUATE', function (e) {
			evaluateInput();
			_self.state.isActive = false;
		});

		context.addEventListener('KIKU_APPEND', function (e) {
			appendCharToInput(getCharFromKeyCode(parseInt(e.detail.data.keyCode)));
		});

		context.addEventListener('KIKU_DISMISS', function (e) {
			_self.state.isActive = false;
			_self.state.data = '';
		});

		context.addEventListener('KIKU_ON_SUCCESS', function (e) {
			/// TODO
		});

		context.addEventListener('KIKU_ON_FAIL', function (e) {
			/// TODO
		});
	}

	/**
  * Validate input and invoke corresponding function.
 */
	function evaluateInput() {
		if (_self.state.input) {
			var str = _self.state.input.toLowerCase(); /// TODO: Consider making this case-sensitive, exposing 'caseSensitive' option.

			// Get `binding` object.
			var binding = _self.data.bindings.filter(function (binding) {
				return binding.string === str;
			})[0];

			// Validate, invoke, and dispatch event(s).
			if (binding && (typeof binding === 'undefined' ? 'undefined' : _typeof(binding)) === 'object' && binding.fn instanceof Function) {
				binding.fn();

				window.dispatchEvent(new CustomEvent('KIKU_ON_SUCCESS'));
			} else {
				window.dispatchEvent(new CustomEvent('KIKU_ON_FAIL'));
			}

			_self.state.input = '';
		}
	}

	/**
  * Adds the received `char` to the `input` property on the Kiku instance.
  * Sets the `input` property to an empty string if it doesn't exist.
  *
  * @param {String} `char`
 */
	function appendCharToInput(char) {
		if (!_self.state.input) {
			_self.state.input = '';
		}

		_self.state.input += char;
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

	// --------------------------------------------------
	// Constructor
	// --------------------------------------------------
	global.Kiku = function (options) {
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