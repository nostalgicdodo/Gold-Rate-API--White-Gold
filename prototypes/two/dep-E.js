
module.exports = {
	level: 2,
	id: { number: 1 },
	prefix: "'tis",
	toString: function () {
		return `${this.prefix} ${ this.id.number }/${ this.id.number }`
	}
}
