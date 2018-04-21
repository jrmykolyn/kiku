/* eslint-disable no-console */

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

// --------------------------------------------------
// Private Vars
// --------------------------------------------------
/**
 * Stores a reference to the 'singleton' Kiku instance.
 */
const _self = {
	state: {
		isActive: false,
		input: '',
	},
	defaults: {
		triggerKey: 13, // Enter
		dismissKey: 27, // Esc
	},
	settings: {},
	data: {
		bindings: [],
	},
};

// --------------------------------------------------
// Private Functions
// --------------------------------------------------
/**
 * Prints messages to the console relating to the invalid creation of a new Kiku instance.
 *
 * @param {Object} `context`
 */
const handleInvalidInstantiation = ( context ) => {
	let method = ( typeof console.error !== 'undefined' ) ? 'error' : 'log';

	if ( context === window ) {
		console[ method ]( '`Kiku` MUST BE INITIALIZED USING THE `new` KEYWORD' ); // TEMP
	} else {
		console[ method ]( '`Kiku` HAS ALREADY BEEN INITIALIZED' ); // TEMP
	}
};

/**
 * Validates any data received on instantiation.
 *
 * Modifies the `data` object to ensure that all required keys are present.
 *
 * Falls back to default value if a given input is missing/invalid.
 *
 * @param {Object} `data`
 * @param {string} `key`
 * @return {Object}
 */
const validateInput = ( data, key ) => {
	// If the input is missing/invalid, return the entire default object.
	if ( !data || typeof data !== 'object' ) {
		return _self[ key ];
	}

	// Otherwise, migrate indiv. values from default object if required.
	for ( let k in _self[ key ] ) {
		if ( !data[ k ] || typeof data[ k ] !== typeof _self[ key ][ k ] ) {
			data[ k ] = _self[ key ][ k ];
		}
	}

	return data;
};

/**
 * Adds a 'keyup' listener to the `window` object.
 * If event keycode is equal to the value of `triggerKey` (stored on the Kiku instance), `evaluateInput()` is invoked.
 * Otherwise, `appendCharToInput()` is invoked.
 *
 * @param {Object} `context`
 * @param {Object} `selfObj`
 */
const addEventListeners = ( context, selfObj ) => {
	// Register core event listeners.
	context.addEventListener( 'keyup', ( e ) => {
		let k = parseInt( e.keyCode );
		let customEvent;

		// Handle cases where Kiku is active.
		if ( selfObj.state.isActive ) {
			switch ( k ) {
			case selfObj.settings.dismissKey:
				customEvent = new CustomEvent( 'KIKU_DISMISS' );
				window.dispatchEvent( customEvent );
				break;
			case selfObj.settings.triggerKey:
				customEvent = new CustomEvent( 'KIKU_EVALUATE' );
				window.dispatchEvent( customEvent );
				break;
			default:
				customEvent = new CustomEvent( 'KIKU_APPEND', { detail: { data: e } } );
				window.dispatchEvent( customEvent );
			}
		// Handle cases where Kiku is inactive.
		} else {
			switch ( k ) {
			case selfObj.settings.triggerKey:
				customEvent = new CustomEvent( 'KIKU_ACTIVATE' );
				window.dispatchEvent( customEvent );
			}
		}

	} );

	// Register custom event/Kiku-specific event listeners.
	context.addEventListener( 'KIKU_ACTIVATE', () => {
		_self.state.isActive = true;
	} );

	context.addEventListener( 'KIKU_EVALUATE', () => {
		evaluateInput();
		_self.state.isActive = false;
	} );

	context.addEventListener( 'KIKU_APPEND', ( e ) => {
		appendCharToInput( getCharFromKeyCode( parseInt( e.detail.data.keyCode ) ) );
	} );

	context.addEventListener( 'KIKU_DISMISS', () => {
		_self.state.isActive = false;
		_self.state.data = '';
	} );

	context.addEventListener( 'KIKU_ON_SUCCESS', () => {
		/// TODO
	} );

	context.addEventListener( 'KIKU_ON_FAIL', () => {
		/// TODO
	} );
};

/**
 * Validate input and invoke corresponding function.
 */
const evaluateInput = () => {
	if ( _self.state.input ) {
		let str = _self.state.input.toLowerCase(); /// TODO: Consider making this case-sensitive, exposing 'caseSensitive' option.

		// Get `binding` object.
		let binding = _self.data.bindings.filter( ( binding ) => {
			return binding.string === str;
		} )[ 0 ];

		// Validate, invoke, and dispatch event(s).
		if ( binding && typeof binding === 'object' && binding.fn instanceof Function ) {
			binding.fn();

			window.dispatchEvent( ( new CustomEvent( 'KIKU_ON_SUCCESS' ) ) );
		} else {
			window.dispatchEvent( ( new CustomEvent( 'KIKU_ON_FAIL' ) ) );
		}

		_self.state.input = '';
	}
};

/**
 * Adds the received `char` to the `input` property on the Kiku instance.
 * Sets the `input` property to an empty string if it doesn't exist.
 *
 * @param {String} `char`
 */
const appendCharToInput = ( char ) => {
	if ( !_self.state.input ) { _self.state.input = ''; }

	_self.state.input += char;
};

/**
 * Returns the alphabetical character for a given integer.
 *
 * @param {Number} `keyCode`
 * @return {String}
 */
const getCharFromKeyCode = ( keyCode ) => {
	return String.fromCharCode( keyCode );
};


// --------------------------------------------------
// Public Methods
// --------------------------------------------------
/**
 * Register a new string and callback function.
 *
 * @param {Object} o
 * @return {boolean}
 */
const add = ( o ) => {
	if ( !o || typeof o !== 'object' || typeof o.string !== 'string' || typeof o.fn !== 'function' ) {
		return false;
	}

	_self.data.bindings = [ ..._self.data.bindings, o ];
	return true;
};

/**
 * Remove existing string and callback function.
 *
 * @param {string} str
 * @return {boolean}
 */
const remove = ( str ) => {
	if ( !str || typeof str !== 'string' ) {
		return false;
	}

	_self.data.bindings = _self.data.bindings.filter( ( o ) => o.string !== str );
	return true;
};

/**
 * Get a list of registered callback functions.
 *
 * @return {Array<string>}
 */
const getFunctionKeys = () => {
	return _self.data.bindings.map( binding => binding.string );
};

/**
 * Initialize and return the public API for the Kiku Instance
 *
 * @param {Object} `options`
 * @return {Object}
 */
const init = ( options ) => {
	// Initialize Kiku instance
	_self.init = true;

	// Re-assign `options` object or fallack to empty obj.
	options = ( options instanceof Object ) ? options : {};

	// Validate/update instance settings && data.
	_self.settings = validateInput( options.settings, 'defaults' );
	_self.data = validateInput( options.data, 'data' );

	addEventListeners( window, _self );

	// Expose public API
	return {
		// Core
		add,
		remove,
		// Supporting
		getFunctionKeys,
	};
};

// --------------------------------------------------
// Public API
// --------------------------------------------------
const Kiku = ( options ) => {
	let _this = this;

	// If Kiku has not been instantiated and context is *not* `window`.
	if ( !_self.init && _this !== window ) {
		return init( options );

	// Otherwise, display the appropriate error message(s).
	} else {
		handleInvalidInstantiation( _this );
	}
};

/* eslint-disable-next-line no-undef */
module.exports = Kiku;
