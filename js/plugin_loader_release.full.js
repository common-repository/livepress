/*! livepress -v1.4.5
 * http://livepress.com/
 * Copyright (c) 2017 LivePress, Inc.
 */
var Livepress = Livepress || {};
(function() {
	var lpEnabled = false;
    var mode = 'min';
	var lpLoad = function() {
        var loader = document.createElement( 'script' );
		if ( lpEnabled ) {
			return;
		}
		lpEnabled = true;
		Livepress.CSSQueue = [];
		if ( LivepressConfig.debug ) {
			mode = 'full';
		}
        Livepress.JSQueue = [( undefined === jQuery ? 'jquery://' : '' ), 'wpstatic://js/livepress-release.' + mode + '.js?v=' + LivepressConfig.ver];
		loader.setAttribute( 'id', 'LivePress-loader-script' );
		loader.setAttribute( 'src', LivepressConfig.wpstatic_url + 'js/livepress_loader.' + mode + '.js?v=' + LivepressConfig.ver );
		loader.setAttribute( 'type', 'text/javascript' );
		document.getElementsByTagName( 'head' ).item( 0 ).appendChild( loader );
	};

	if ( 'home' === LivepressConfig.page_type || 'single' === LivepressConfig.page_type ) {
		lpLoad();
	}
}() );
