<?php
/**
 * LivePress template
 */

/**
 * LivePress template.
 *
 * @param bool $auto               Optional. Auto. Default false.
 * @param int  $seconds_since_last Optional. Seconds since last update. Default 0.
 * @return mixed|string
 */
function livepress_template( $auto = false, $seconds_since_last = 0 ) {
	global $post;

	$is_live    = LivePress_Updater::instance()->blogging_tools->get_post_live_status( $post->ID );
	$pin_header = LivePress_Updater::instance()->blogging_tools->is_post_header_enabled( $post->ID );

	$lp_status  = $is_live    ? 'lp-on' : 'lp-off';
	$pin_class  = $pin_header ? 'livepress-pinned-header' : '';
	// Don't show the LivePress bar on front end if the post isn't live or LivePress disabled
	$finished          = get_post_meta( $post->ID, 'lp_post_finished', true );
	if ( ! $is_live || ! LivePress_Updater::instance()->has_livepress_enabled() || $finished ) {

		return;
	}

	$live            = esc_html( apply_filters( 'LP_status_text', ( $finished ) ? __( 'FINISHED', 'livepress' ) : __( 'LIVE', 'livepress' ) , $finished ) );
	$about           = wp_kses_post( __( 'Receive live updates to<br />this and other posts on<br />this site.', 'livepress' ) );
	$notifications   = esc_html__( 'Notifications', 'livepress' );
	$updates         = esc_html__( 'Live Updates', 'livepress' );
	$powered_by      = wp_kses_post( __( 'powered by <a href="http://livepress.com">LivePress</a>', 'livepress' ) );
	$date            = new DateTime();
	$interval_string = 'P0Y0M0DT0H' . floor( $seconds_since_last / 60 ) . 'M' . $seconds_since_last % 60 . 'S';
	/**
	 * Filter to adjust the "powered by LivePress" HTML
	 * return empty string to remove
	 *
	 * @since 1.3.9
	 *
	 * @param string $html
	 */
	$logo_link       = apply_filters( 'livepress_live_bar_logo_html', LivePress_Themes_Helper::logo_link() );

	// Generate an ISO-8601 formatted timestamp for timeago.js
	$date->sub( new DateInterval( $interval_string ) );
	$date8601 = $date->format( 'c' );

	static $called = 0;
	if ( $called++ ) { return; }
	if ( apply_filters( 'LP_hide_timestamp', true ) ) {
		$htmlTemplate = <<<HTML
		<div id="livepress">
			<div class="lp-bar">
				$logo_link
				<div class="lp-status $lp_status $pin_class "><span class="lp-status-title">$live</span></div>
			</div>
		</div>
HTML;
	} else {
		$htmlTemplate = <<<HTML
		<div id="livepress">
			<div class="lp-bar">
				$logo_link
				<div class="lp-status $lp_status $pin_class "><span class="lp-status-title">$live</span></div>
				<div class="lp-updated">
					<span class="lp-updated-counter" data-min="$seconds_since_last">
						<abbr class="livepress-timestamp" title="$date8601"></abbr>
					</span>
					</div>
			</div>
		</div>
HTML;
	}

	$image_url    = LP_PLUGIN_URL . 'img/spin.gif';
	$htmlTemplate = str_replace( 'SPIN_IMAGE', $image_url, $htmlTemplate );

	$image_url    = LP_PLUGIN_URL . 'img/lp-bar-logo.png';
	$htmlTemplate = str_replace( 'LOGO_IMAGE', $image_url, $htmlTemplate );

	$image_url    = LP_PLUGIN_URL . 'img/lp-settings-close.gif';
	$htmlTemplate = str_replace( 'CLOSE_SETTINGS_IMAGE', $image_url, $htmlTemplate );

	$image_url    = LP_PLUGIN_URL . 'img/lp-bar-cogwheel.png';
	$htmlTemplate = str_replace( 'BAR_COG_IMAGE', $image_url, $htmlTemplate );

	$lp_update    = LivePress_Updater::instance();
	$htmlTemplate = str_replace('<!--UPDATES_NUM-->',
	$lp_update->current_post_updates_count(), $htmlTemplate);

	if ( $auto ) {
		$htmlTemplate = str_replace( 'id="livepress"', 'id="livepress" class="auto"', $htmlTemplate ); }

	if ( LivePress_Updater::instance()->is_comments_enabled() ) {
		$htmlTemplate = str_replace( array( '<!--COMMENTS-->', '<!--/COMMENTS-->' ), '', $htmlTemplate );
		$htmlTemplate = str_replace('<!--COMMENTS_NUM-->',
		$lp_update->current_post_comments_count(), $htmlTemplate);
	} else {
		$htmlTemplate = preg_replace( '#<!--COMMENTS-->.*?<!--/COMMENTS-->#s', '', $htmlTemplate );
	}

	if ( $auto ) {
		return $htmlTemplate;
	} else {
		echo wp_kses_post( $htmlTemplate );
	}
}
add_action( 'livepress_widget', 'livepress_template' );

/**
 * LivePress update box output.
 */
function livepress_update_box() {
	static $called = 0;
	if ( $called++ ) { return; }
	if ( LivePress_Updater::instance()->has_livepress_enabled() ) {
		echo '<div id="lp-update-box"></div>';
	}
}
add_action( 'livepress_update_box', 'livepress_update_box' );

/**
 * LivePress dashboard template output.
 */
function livepress_dashboard_template() {
	echo '<div id="lp-switch-panel" class="editor-hidden">';
	echo '<a id="live-switcher" class="off preview button-secondary disconnected" style="display: none" title="' .
			esc_html__( 'Show or Hide the Real-Time Editor', 'livepress' ) . '">' .
			esc_html__( 'Show', 'livepress' ) .
		'</a>';
	echo '<h3>' .
			esc_html__( 'Real-Time Editor', 'livepress' ) .
		'</h3>';
	echo '<span class="warning">' .
			esc_html__( 'Click "Show" to activate the Real-Time Editor and streamline your liveblogging workflow.', 'livepress' ) .
		'</span>';
	echo '</div>';
}
