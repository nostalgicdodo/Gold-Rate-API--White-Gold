
class AnError extends Error {
	constructor ( message, data ) {
		super( message );
		if ( typeof data === "object" )
			this.data = data;
	}
}

class InvalidInputError extends AnError {}
class DataNotFoundError extends AnError {}
class ServerError extends AnError {}

module.exports = {
	AnError,
	InvalidInputError,
	DataNotFoundError,
	ServerError
};
