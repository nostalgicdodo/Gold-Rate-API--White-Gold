
/*
 |
 |
 |
 */

class MemoryStore {

	static #store = { }

	static get ( keyPath ) {
		// if ( ! keyPath )
		// 	return this.#store;

		// let keyPathParts = keyPath.split( "/" );

		// let currentPath = this.#store;
		// for ( let _key of keyPathParts.slice( 0, -1 ) ) {
		// 	if ( currentPath[ _key ] !== "object" )
		// 		return void 0;
		// 	currentPath = currentPath[ _key ];
		// }

		// return currentPath[ keyPathParts.slice( -1 )[ 0 ] ];
		return this.#store[ key ];
	}

	static set ( key, value ) {
		// let keyPathParts = keyPath.split( "/" );

		// let currentPath = this.#store;
		// if ( keyPathParts.length > 1 ) {
		// 	for ( let _key of keyPathParts.slice( 0, -1 ) ) {
		// 		currentPath[ _key ] = currentPath[ _key ] || { };
		// 		currentPath = currentPath[ _key ];
		// 	}
		// }

		// currentPath[ keyPathParts.slice( -1 )[ 0 ] ] = value;
		this.#store[ key ] = value;
	}

	static has ( key ) {
		return !! this.#store[ key ];
	}

}

module.exports = MemoryStore;
