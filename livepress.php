<?php
/*
Plugin Name: LivePress
Plugin URI:  http://www.livepress.com
Description: Richly-featured live blogging for WordPress.
Version:     1.4.5
Author:      LivePress Inc.
Author URI:  http://www.livepress.com
Text Domain: livepress
Domain Path: /languages
*/

// on / off switch
class LivePress_Enabler {
	/**
	 * Constructor.
	 */
	function __construct() {
		add_action( 'admin_init', array( $this, 'admin_init' ) );
	}

	/**
	 * Set up all the settings and field
	 */
	function admin_init() {
		register_setting( 'writing', 'livepress_enabled', 'intval' );
		add_settings_field( 'livepress_enabled',  esc_html__( 'LivePress Live Blogging', 'livepress' ), array( $this, 'enabled_field' ), 'writing' );
	}

	/**
	 * Global Enable form
	 */
	function enabled_field() {
		?>
		<fieldset><legend class="screen-reader-text"><span>LivePress Live Blogging </span></legend>
			<label for="livepress_enabled"><input type="checkbox" name="livepress_enabled"  id="livepress_enabled" value="1" <?php checked( get_option( 'livepress_enabled', true ) ); ?> />
				<?php echo esc_html__( 'Enabled', 'livepress' ); ?></label>
		</fieldset>
	<?php
	}
}

$livepress_enabler = new LivePress_Enabler();

define( 'LP_PLUGIN_VERSION',      '1.4.5' );
define( 'LP_PLUGIN_NAME',         'livepress' );
define( 'LP_PLUGIN_SYMLINK',       false ); // Use for local testing when plugin symlinked
define( 'LP_PLUGIN_THEME_INCLUDE', false ); // Use when plugin included in theme
define( 'LP_PLUGIN_PATH',          plugin_dir_path( __FILE__ ) );
define( 'LP_LIVE_REQUIRES_ADMIN',  false ); /* Require manage_options capability to turn on Live (Administrator) */

/**
 * Filter Allows you to update the version string used to bust the cache for scripts.
 *
 * @since 1.3.18
 *
 * @param string $LP_PLUGIN_VERSION the plugin version.
 *
 */
define( 'LP_PLUGIN_SCRIPT_VERSION', apply_filters( 'LP_plugin_script_version', '45a3c2a_' . LP_PLUGIN_VERSION ) );

if ( get_option( 'livepress_enabled', true ) ) :

	if ( LP_PLUGIN_THEME_INCLUDE  ) {
		define( 'LP_PLUGIN_URL', get_stylesheet_directory_uri() . '/' . LP_PLUGIN_NAME . '/' );
	} elseif ( LP_PLUGIN_SYMLINK  ) {
		define( 'LP_PLUGIN_URL', plugins_url( LP_PLUGIN_NAME . '/' ) );
	} elseif ( defined( 'WPCOM_IS_VIP_ENV' ) && false !== WPCOM_IS_VIP_ENV ) {
		define( 'LP_PLUGIN_URL', plugins_url( LP_PLUGIN_NAME . '/', __DIR__ ) );
	} else {
		define( 'LP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
	}

	define( 'LP_STORE_URL', 'http://livepress.com/' ); // Store powered by Easy Digital Downloads
	define( 'LP_ITEM_NAME', 'LivePress' );

	require 'php/livepress-boot.php';
//	  require 'filter_examples.php'; // only for testing
endif;
