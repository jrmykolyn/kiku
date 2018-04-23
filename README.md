# Kiku

![Kiku](https://raw.githubusercontent.com/jrmykolyn/sfco-kiku/master/kiku.gif)

## Table of Contents
- [About](#about)
- [Features](#features)
- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [Documentation](#documentation)
- [Contributing](#contributing)
	- [Contibuting Overview](#contributing-overview)
	- [Code Style](#code-style)
	- [Testing](#testing)
- [Attribution](#attribution)


## About
Listen for keyboard input and invoke callbacks each time a specific string is encountered.

## Features
- Update the view, enable/disable bonus features, or just log data to the console when the user enters a string of your choosing.
- Listen for one or many strings (and their corresponding callbacks).

## Installation
```
npm install --save sfco-kiku
```

## Setup
Once installed, Kiku can be setup in the following ways:

- Copy the Kiku script from the `node_modules/` folder into the dependent project; inject the Kiku script into the document using a `<script>` tag.
- Pull Kiku into a 'vendor script' bundle and reference the resulting file.

## Usage
Once enqueued, the Kiku script exposes the `Kiku` constructor as a property of the `window` object. Create a new Kiku instance as follows:

```
let kikuRef = new Kiku();
```

Please note that there can be only 1x Kiku instance at any given time. For example, the following will fail:

```
let myFirstKikuRef = new Kiku();
let mySecondKikuRef = new Kiku(); // Error
```

The Kiku constructor accepts an optional `options` object which can be used to provide the initial strings to listen for, their callback functions, and various configuration data.

```
// Create a Kiku instance and register a callback for the string 'hello'.
let kikuRef = new Kiku( {
	bindings: [
		{
			string: 'hello',
			fn: () => { console.log( 'Hello, world' ); }
		}
	],
} );
```
```
// Create a Kiku instance and set the trigger key to 'space'.
let kikuRef = new Kiku( {
	settings: {
		triggerKey: 32, // 'Space'
	}
} );
```

Additional listeners and callback functions can be provided after instantiation using the `add()` method.

```
let kikuRef = new Kiku();

// Invoke `add()` with an object to add 1x new callback.
kikuRef.add( {
	string: 'foo',
	fn: () => { console.log( 'Bar' ); }
} );

// Invoke `add()` with an array of objects to add multiple callbacks.
kikuRef.add( [
	{
		string: 'baz',
		fn: () => { console.log( 'Quux' ); }
	},
	{
		string: 'beep',
		fn: () => { console.log( 'Boop' ); }
	}
] );
```

Existing listeners and their callbacks can be removed using the `remove()` method.

```
// Invoke `remove()` with a string to remove 1x callback.
kikuRef.remove( 'foo' );

// Invoke `remove()` with an array to remove multiple callbacks.
kikuRef.add( [ 'bar', 'beep' ] );
```

## API

### Kiku( options? )

Returns a Kiku instance which exposes:
- add() (Function)
- remove() (Function)

**options**

Type: `Object`

A wrapper around all data that Kiku can receive at instantiation time.

**options.settings**

Type: `Object`

An object of data that can be used to override default values.

**options.settings.triggerKey**

Type: `number`

Default: `32` (Enter)

Keycode for the key which is used to activate/deactive Kiku's listening functionality.

**options.settings.dismissKey**

Type: `number`

Default: `27` (Esc)

Keycode for the key which is used to cancel the listening functionality.

**options.bindings**

Type: `Array<Object>`

Default: `[]`

An array of object data. Each object describes a single string/callback pair, and must include the following keys:

- `string`: The string to listen for/check against.
- `fn`: The function to call if/when the `string` is matched.

## Documentation
Currently, Kiku *does not* include any external documentation.

For an overview of the project's evolution, please consult the `CHANGELOG`.

## Contributing

### Contributing Overview
Issues and proposed enhancements are welcome!

### Code Style
`ESlint` and `editorconfig` are used to enforce consistent code style and formatting. Please ensure that both of these tools are available within your IDE.

### Testing
Whoops, Kiku doesn't ship with any tests. Want to add some? Spin up an [issue](https://github.com/jrmykolyn/sfco-kiku/issues)!.

## Attribution
- `README.md` gif: https://giphy.com/gifs/halloween-ghost-ghosts-Yph6D7zPIVtIc
