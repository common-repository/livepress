<?php

/**
 * Try to automagically inject livepress widget into theme.
 * Magic can be removed by adding into functions.php of theme:
 * define('LIVEPRESS_THEME', true)
 *
 * @package livepress
 */
class LivePress_Themes_Helper {
	/**
	 * Instance.
	 *
	 * @static
	 * @access private
	 * @var null $instance LivePress_Themes_Helper instance.
	 */
	private static $instance = null;

	/**
	 * Instance.
	 *
	 * @static
	 *
	 * @return LivePress_Themes_Helper
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new LivePress_Themes_Helper();
		}

		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		add_action( 'loop_start', array( $this, 'inject_updatebox' ) );
		add_filter( 'livepress_inject_widget', array( __CLASS__, 'append_logo' ), 99 );
	}

	/**
	 * Inject update box into theme.
	 */
	function inject_updatebox() {
		static $did_output = false;
		if ( ! defined( 'LIVEPRESS_THEME' ) || ! constant( 'LIVEPRESS_THEME' ) ) {
			if ( ! $did_output && ( is_single() || is_home() ) ) {
				if ( is_single() ) {
					LivePress_Updater::instance()->inject_widget( true );
				}
				$did_output = true;
			}
		}
	}

	/**
	 * Inject widget.
	 *
	 * @param     $content
	 * @param int $last_update
	 *
	 * @return string
	 */
	function inject_widget( $content, $last_update = 0 ) {
		static $did_output = false;
		if ( ! defined( 'LIVEPRESS_THEME' ) || ! constant( 'LIVEPRESS_THEME' ) ) {
			if ( ! $did_output ) {
				$livepress_template = livepress_template( true, $last_update );
				$content = $livepress_template . $content;
				$did_output = true;
			}
		}
		/**
		 * Filter to adjust the HTML around the live content
		 * return empty string to remove
		 *
		 * @since 1.3.9
		 *
		 * @param string $content
		 */
		return apply_filters( 'livepress_inject_widget', $content );
	}

	public static function append_logo( $content ) {

		return $content . '<p class="lp-credits lp-credits-after">' . self::logo_link() . '</p>';
	}

	public static function logo_link() {
			return sprintf(
				'<a class="lp-logo-link" href="https://livepress.com/" target="_blank">
					%1$s <span class="text">LivePress</span>&nbsp;<img alt="LivePress logo" class="lp-logo-img"  src="%2$s">
				</a>',
				esc_html__( 'Powered by', 'livepress' ),
				esc_url( plugins_url( 'img/livepress-logo-no-text.svg', dirname( __FILE__ ) ) )
			);
	}
}


function livepress_show_updates() {
	global $post;
	$parent_post_id   = apply_filters( 'livepress_current_post_id', $post->ID );
	$livepress_query = new WP_Query( array( 'p' => $parent_post_id ) );
	while ( $livepress_query->have_posts() ) : $livepress_query->the_post();

		the_title( '<h3 class="entry-title">', '</h3>' );
		LivePress_Updater::instance()->inject_widget( true );
		echo LivePress_PF_Updates::get_instance()->add_children_to_post( get_the_content(), true );

	endwhile;
	wp_reset_postdata();
}


function livepress_configure_to_load( $parent_post_id ) {
	// say the current livepress post to be used to load content from
	livepress_theme_support::set_current_parent_id( $parent_post_id );

	// when loading on an none livepress page force the loading of livepress JS and CSS
	add_filter( 'livepress_add_css_and_js_on_header', '__return_true' );
	//  set to 'single'
	add_filter( 'livepress_js_config_page_type', 'livepress_js_config_page_type' );
	// before set before wp_enqueue_scripts ,11 is called
	// the function needs to return parent post ID of the updates you wish to show on the page
	add_filter( 'livepress_current_post_id', array( 'livepress_theme_support', 'get_current_parent_id' ) );
}


class livepress_theme_support {

	static $livepress_current_parent_id;

	public static function set_current_parent_id( $current_parent_id ) {

		self::$livepress_current_parent_id = $current_parent_id;
	}


	public static function get_current_parent_id( $current_parent_id ) {

		if ( null !== self::$livepress_current_parent_id ) {
			return self::$livepress_current_parent_id;
		}

		return $current_parent_id;
	}
}


function livepress_js_config_page_type( $page_type ) {

	if ( 'home' !== $page_type ) {

		return 'single';
	}

	return $page_type;
}

// you need to set if you need to load the livepress JS and CSS on the home page
// add_filter( 'livepress_dont_load_js_on_homepage', '__return_false' );

// call this to setup the page
// livepress_configure_to_load( 1786 );

// and tell LP that livepress is live
//	add_filter( 'livepress_get_post_live_status ', '__return_true' );
