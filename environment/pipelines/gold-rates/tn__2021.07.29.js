
module.exports = function deriveGoldRates ( goldRate ) {

	let cost__24KaratGold__perGram = ( goldRate.ask - ( ( this.marginPercentage / 100 ) * goldRate.ask ) ) / 10;
	if ( this.stopLoss > cost__24KaratGold__perGram )
		cost__24KaratGold__perGram = this.stopLoss;

	let cost__22KaratGold__perGram = ( this[ "22KaratPercentage" ] / 100 ) * cost__24KaratGold__perGram;

	return {
		timestamp: goldRate.timestamp,
		cost__24KaratGold__perGram,
		cost__22KaratGold__perGram
	};

};
