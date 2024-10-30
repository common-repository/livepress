<?php
/**
 * wp-plugin.
 * User: Paul
 * Date: 2016-08-03
 *
 */

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Pause_Updates {

	const FE_PAUSED_META_KEY = 'lp_frontend_pause';
	const UPDATE_ORDER_OPTION_KEY = 'feed_order';
	const NONCE_KEY = 'lp_nonce';

	public function __construct() {
		add_filter( 'body_class', array( __CLASS__, 'toggle_frontend_pause_body_class' ), 99 );
		add_filter( 'livepress_inject_widget', array( __CLASS__, 'render_button' ) );
		add_action( 'admin_init', array( __CLASS__, 'toggle_frontend_pause' ), 1 );
		add_action( 'pre_update_option_livepress', array( __CLASS__, 'toggle_frontend_pause_save' ), 12, 2 );

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'wp_enqueue_scripts' ) );
		add_action( 'activate_plugin', array( __CLASS__, 'set_options' ) );
	}

	public static function wp_enqueue_scripts() {
		wp_enqueue_script( 'underscore' );
	}

	public static function render_button( $content ) {
		$content = sprintf( '<div class="view-new-button-container" id="view-new-button-container">
				<button class="button" id="view-new-posts" role="button">%1$s</button>
			</div>',
			esc_html__( apply_filters( 'livepress_paused_button_text', 'View New Updates' ) )
		) . $content;

		return $content;
	}

	/**
	 * Setup for adding functionality to LivePress Settings page
	 */
	public static function toggle_frontend_pause() {
		add_settings_field(
			self::FE_PAUSED_META_KEY,
			'Prevent new LB updates from appearing if user is not at top of the page',
			array( __CLASS__, 'toggle_frontend_pause_display' ),
			'livepress-settings',
			'lp-appearance'
		);
	}

	/**
	 * Display output on the LivePress Settings page
	 */
	public static function toggle_frontend_pause_display() {
		$paused = get_option( self::FE_PAUSED_META_KEY, true );

		echo '<p><label><input type="checkbox" name="' . esc_attr( self::FE_PAUSED_META_KEY ) . '" id="lp-toggle-frontend-pause" value="pause"' .
			checked( true, $paused, false ) . '> Yes, pause new updates</label></p>';
		wp_nonce_field( 'save-toggle-frontend-pause', self::NONCE_KEY );
	}

	/**
	 * Need to save our own value as LP won't accept custom ones in their validation function
	 * via Settings API callback. This runs when the "livepress" main option updates. Careful with returns in here
	 *
	 * @param mixed $new_vals
	 * @param mixed $old_vals
	 */
	public static function toggle_frontend_pause_save( $new_vals, $old_vals ) {
		if ( ! isset( $_POST[ self::NONCE_KEY ] ) ) { // input var okay
			return $new_vals;
		}

		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ self::NONCE_KEY ] ) ), 'save-toggle-frontend-pause' ) ) { // input var okay

			return $new_vals;
		}

		$paused = false;
		if ( isset( $_POST[ self::FE_PAUSED_META_KEY ] ) ) { // input var okay
			if ( 'pause' === $_POST[ self::FE_PAUSED_META_KEY ] ) { // input var okay
				$paused = true;
			}
		}

		update_option( self::FE_PAUSED_META_KEY, $paused );

		return $new_vals;
	}

	/**
	 * If this class exists on body, CSS/JS will follow to create the paused effect
	 *
	 * @param array $classes
	 *
	 * @return array
	 */
	public static function toggle_frontend_pause_body_class( $classes ) {
		global $post;
		$is_live = isset( $post ) ? LivePress_Updater::instance()->blogging_tools->get_post_live_status( $post->ID ) : false;

		if ( $is_live ) {
			$paused = get_option( self::FE_PAUSED_META_KEY );

			if ( true === $paused || '1' === $paused ) {
				$classes[] = 'lp-pause-new-updates';
			}
			// get tne order the updates are shown in
			$meta_order = get_post_meta( $post->ID , 'livepress_' . self::UPDATE_ORDER_OPTION_KEY , true );
			if ( false === $meta_order || empty( $meta_order ) ) {
				$options = get_option( LivePress_Administration::$options_name );
				$meta_order = $options[ self::UPDATE_ORDER_OPTION_KEY ];
			}
			$meta_order = apply_filters( 'livepress_feed_order', $meta_order, $post );
			$classes[] = 'lp-update-order-' . $meta_order;

			if ( apply_filters( 'livepress_float_pause_button', __return_true() ) ) {
				$classes[] = 'lp-pause-new-updates-float';
			}
		}

		return $classes;
	}

	/**
	 * if option created then create and set to true
	 *
	 * @static
	 */
	public static function set_options() {
		if ( false === get_option( self::FE_PAUSED_META_KEY ) ) {
			update_option( self::FE_PAUSED_META_KEY, true );
		}
	}

	/**
	 *
	 *
	 * @static
	 *
	 * @param $post
	 *
	 * @return mixed|void
	 */
	public static function get_display_order( $post ) {
		$post = get_post( $post );

		if ( null === $post ) {

			return 'top';
		}
		$meta_order = get_post_meta( $post->ID, 'livepress_' . self::UPDATE_ORDER_OPTION_KEY, true );

		if ( false === $meta_order || empty( $meta_order ) ) {
			$options    = get_option( LivePress_Administration::$options_name );
			$meta_order = $options[ self::UPDATE_ORDER_OPTION_KEY ];
		}
		$meta_order = apply_filters( 'livepress_feed_order', $meta_order, $post );

		return $meta_order;
	}
}

new Pause_Updates();
