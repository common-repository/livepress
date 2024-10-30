/*! livepress -v1.4.5
 * http://livepress.com/
 * Copyright (c) 2017 LivePress, Inc.
 */
jQuery( document ).ready(function() {
	jQuery( '#wp-admin-bar-livepress-enable' ).on( 'click', 'a', function( e ) {
		e.preventDefault();

		// Enable updates via AJAX
		var data = {
			action: 'livepress-enable-global',
			nonce:  jQuery( this ).data( 'nonce' )
		};

		endisable( data );
	});

	jQuery( '#wp-admin-bar-livepress-disable' ).on( 'click', 'a', function( e ) {

        // Disable updates via AJAX
        var data = {
            action:  'livepress-disable-global',
            post_id: LivepressToolbar.post_id,
            nonce:   jQuery( this ).data( 'nonce' )
        };
        e.preventDefault();

		endisable( data );
	});

	/**
	 * Enabledisable called when user enabled or disabled livepress from the Admin bar can be removed if
	 * this feature is moved from the admin bar to the plugin settings page
	 *
	 * @param object data
	 *        - action	- string	action to take
	 *        - post_id - string	post id
	 *        - nonce	- string	nonce for ajax call
	 */
	var endisable = function( data ) {
		jQuery.post(
			ajaxurl || LivepressToolbar.ajax_url,
			data,
			function( response ) {
				var bar = jQuery( '#wp-admin-bar-livepress-status' ),
					meta_box = jQuery( '#livepress_status_meta_box' ),
					external = jQuery( '#wp-admin-bar-livepress-status-external' );
				switch ( response ) {
					case 'connected':
						meta_box.removeClass( 'globally_disabled' ).removeClass( 'globally_disconnected' );
						bar.removeClass( 'disabled' ).addClass( 'connected' );
						external.removeClass( 'disabled' ).addClass( 'enabled' );
						break;
					case 'disconnected':
						meta_box.addClass( 'globally_disconnected' ).removeClass( 'globally_disabled' );
						bar.removeClass( 'disabled' ).removeClass( 'connected' );
						external.removeClass( 'disabled' ).addClass( 'enabled' );
						break;
					case 'disabled':
						meta_box.addClass( 'globally_disabled' ).removeClass( 'globally_disconnected' );
						bar.addClass( 'disabled' ).removeClass( 'connected' );
						external.removeClass( 'enabled' ).addClass( 'disabled' );
						break;
				}
			}
		);
	};
});
