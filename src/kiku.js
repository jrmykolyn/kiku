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
// Utilities
// --------------------------------------------------
/**
 * Clone an object.
 *
 * @param {Object} obj
 * @return {Object}
 */
const clone = ( obj ) => {
	// If the input is a not an object, return it.
	if ( typeof obj !== 'object' ) {
		return obj;
	}

	let output = {};

	// Iterate over keys of input object; clone nested objects; allow primitives to pass through.
	for ( let k in obj ) {
		output[ k ] = ( typeof obj[ k ] === 'object' ) ? clone( obj[ k ] ) : obj[ k ];
	}

	return output;
};

const utils = {
	clone,
};

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
		caseSensitive:  true,
	},
	settings: {},
	bindings: [],
};

/// TODO: Consider migrating into `_self` obj.
const keyCodeBlacklist = [
	16, // Shift
];

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
		if ( typeof data[ k ] === 'undefined' || typeof data[ k ] !== typeof _self[ key ][ k ] ) {
			data[ k ] = _self[ key ][ k ];
		}
	}

	return data;
};

/**
 * Registers required event listeners and handles input.
 *
 * @param {Object} `context`
 * @param {Object} `selfObj`
 */
const addEventListeners = ( context, selfObj ) => {
	// Register core event listeners.
	context.addEventListener( 'keydown', ( e ) => {
		let k = parseInt( e.keyCode );
		let customEvent;

		// Handle cases where Kiku is active.
		if ( selfObj.state.isActive ) {

			// Bail early if key is blacklisted.
			if ( keyCodeBlacklist.indexOf( k ) !== -1 ) {
				return;
			}

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
		appendCharToInput( parseEvent( e.detail.data ) );
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
		let str = ( !_self.settings.caseSensitive ) ? _self.state.input.toLowerCase() : _self.state.input;

		// Get `binding` object.
		let binding = _self.bindings.filter( ( binding ) => {
			let string = ( !_self.settings.caseSensitive ) ? binding.string.toLowerCase() : binding.string;
			return string === str;
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
 * Allow events which contain 1x alphanumeric key to pass through; parse complex keys.
 *
 * @param {Object} e
 * @return {string}
 */
const parseEvent = ( e ) => {
	let p = /^[A-z0-9]$/gmi;
	let output = ( e.key.length === 1 && p.test( e.key ) ) ? e.key : getCharFromKeyCode( e.keyCode );
	return output;
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
 * @param {Array<Object>|Object} arr
 * @return {boolean}
 */
const add = ( arr ) => {
	// Ensure array.
	arr = ( Array.isArray( arr ) ) ? arr : [ arr ];

	// Validate and filter out duds.
	let vals = arr.filter( ( o ) => {
		return ( o && typeof o === 'object' && typeof o.string === 'string' && typeof o.fn === 'function' );
	} );

	// Update bindings.
	_self.bindings = ( vals.length ) ? [ ..._self.bindings, ...vals ] : _self.bindings;

	// Return value based on whether any new listeners/callbacks were added.
	return !!vals.length;
};

/**
 * Remove existing string and callback function.
 *
 * @param {Array<string>|string} arr
 * @return {boolean}
 */
const remove = ( arr ) => {
	// Ensure array.
	arr = ( Array.isArray( arr ) ) ? arr : [ arr ];

	// Validate.
	let vals = arr.filter( ( str ) => typeof str === 'string' );

	// Reassign bindings.
	let initLength = _self.bindings.length;
	_self.bindings = _self.bindings.filter( ( o ) => vals.indexOf( o.string ) === -1 );

	// Return value based on whether any listeners/callbacks were removed.
	return ( _self.bindings.length !== initLength );
};

/**
 * Activate Kiku instance.
 *
 * @return boolean
 */
const activate = () => {
	return ( _self.state.isActive = true );
};

/**
 * Deactivate Kiku instance.
 *
 * @return boolean
 */
const deactivate = () => {
	return ( _self.state.isActive = false );
};

/**
 * Return a copy of the Kiku instance's internal state.
 *
 * @return {Object}
 */
const getState = () => {
	return utils.clone( _self.state );
};

/**
 * Get a list of registered callback functions.
 *
 * @return {Array<string>}
 */
const getFunctionKeys = () => {
	return _self.bindings.map( binding => binding.string );
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

	// Validate/update instance settings.
	_self.settings = validateInput( options.settings, 'defaults' );

	addEventListeners( window, _self );

	// Expose public API
	return {
		// Core
		add,
		remove,
		activate,
		deactivate,
		// Supporting
		getState,
		// getFunctionKeys, /// TODO: Consider exposing.
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
