<?php
/**
 * Fixes compatibility problems with 3rd party plugins
 *
 * @package livepress
 */

class LivePress_Compatibility_Fixes {
	/**
	 * Static instance.
	 *
	 * @static
	 * @access private
	 * @var null
	 */
	private static $instance = null;

	private static $ooyala_script_loaded = null;

	/**
	 * Instance.
	 *
	 * @static
	 * @access public
	 *
	 * @return LivePress_Compatibility_Fixes|null
	 */
	public static function instance() {
		if ( self::$instance == null ) {
			self::$instance = new LivePress_Compatibility_Fixes();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		global $wp_version;
		if ( $wp_version < '4.0' ) {
			add_filter( 'embed_oembed_html', array( $this, 'lp_embed_oembed_html' ), 1000, 4 );
		}
		add_filter( 'the_content', array( $this, 'lp_inject_twitter_script' ), 1000 );

		add_filter( 'tm_coschedule_save_post_callback_filter', array( $this, 'tm_coschedule_save_post_callback_filter' ), 10, 2 );

		add_action( 'init', array( $this, 'plugins_loaded' ) );

	}

	static function plugins_loaded() {

		// check for plugin using plugin name
		if ( class_exists( 'Ooyala' ) ) {
			add_filter( 'LP_json_ld_update_article_body_raw', array( __CLASS__, 'replace_ooyala_shortcode' ), 1000 );
			add_filter( 'LP_update_content_pushed', array( __CLASS__, 'set_ooyala_div_id' ), 10, 2 );
			add_filter( 'the_content', array( __CLASS__, 'ooyala_doshortcode' ), 10 );
			add_action( 'wp_footer', array( __CLASS__, 'ooyala_script' ) );
			add_action( 'admin_footer', array( __CLASS__, 'ooyala_admin_script' ) );
		}
	}


	// Remove twitter scripts embedded in live post
	/**
	 * @param $content
	 * @param $url
	 * @param $attr
	 * @param $post_id
	 *
	 * @return mixed
	 */
	static function lp_embed_oembed_html( $content, $url, $attr, $post_id ) {
		return preg_replace( '!<script[^>]*twitter[^>]*></script>!i', '', $content );
		return $content;
	}

	/**
	 * Escape amp HTML.
	 *
	 * @static
	 *
	 * @param $html
	 * @return mixed
	 */
	static function esc_amp_html( $html ) {
		return preg_replace( '/&(?![a-z]+;|#[0-9]+;)/', '&amp;', $html );
	}

	/**
	 * hanndle ooyala video in JSON+LD output.
	 *
	 * @static
	 *
	 * @param $html
	 * @return mixed
	 */
	static function replace_ooyala_shortcode( $html ) {
		$settings = get_option( 'ooyala' );
		$pcode = substr( $settings['api_key'], 0, strpos( $settings['api_key'], '.' ) );

		preg_match( '/code="(.*)" player_id="(.*)" auto="true" width="(.*)" height="(.*)"/', $html, $matches );

		if ( 1 < count( $matches ) ) {
			$url = sprintf( '//player.ooyala.com/static/v4/stable/4.7.9/skin-plugin/iframe.html?ec=%1$s&pbid=%2$s&pcode=%3$s',
				esc_attr( $matches[1] ),
				esc_attr( $matches[2] ),
				esc_attr( $pcode )
			);
			$html = preg_replace( '/\[ooyala .*\]/', $url, $html );
		}

		return $html;
	}
	static function ooyala_doshortcode( $content ) {
		if ( false !== stripos( $content, '[ooyala' ) ) {
			$content = do_shortcode( $content );
		}
		return $content;
	}
	static function set_ooyala_div_id( $content, $update_id ) {

		return str_replace( 'ooyalaplayer-1', 'ooyalaplayer-' . $update_id, $content );
	}
	static function ooyala_admin_script() {
		?>
		<script src="https://player.ooyala.com/static/v4/stable/latest/core.min.js"></script>
		<script src="https://player.ooyala.com/static/v4/stable/latest/video-plugin/main_html5.min.js"></script>
		<script src="https://player.ooyala.com/static/v4/stable/latest/skin-plugin/html5-skin.min.js"></script>
		<link rel="stylesheet" href="https://player.ooyala.com/static/v4/stable/latest/skin-plugin/html5-skin.min.css">
		<?php
	}
	static function ooyala_script() {
	?>
		<script type='text/javascript' >
			function nodeScriptReplace(node) {
				if ( nodeScriptIs(node) === true ) {
					node.parentNode.replaceChild( nodeScriptClone(node) , node );
				}
				else {
					var i        = 0;
					var children = node.childNodes;
					while ( i < children.length ) {
						nodeScriptReplace( children[i++] );
					}
				}

				return node;
			}
			function nodeScriptIs(node) {
				return node.tagName === 'SCRIPT';
			}
			function nodeScriptClone(node){
				var script  = document.createElement("script");
				script.text = node.innerHTML;
				for( var i = node.attributes.length-1; i >= 0; i-- ) {
					script.setAttribute( node.attributes[i].name, node.attributes[i].value );
				}
				return script;
			}

			jQuery(document).ready(function () {
				jQuery(document).bind('DOMNodeInserted', function(event) {
					if ( jQuery( event.target ).is( '.livepress-update' ) ) {
						nodeScriptReplace(document.getElementsByTagName('body')[0]);
					}
				});
			});

		</script>

	<?php
	}




	/**
	 * Patch tweet details.
	 *
	 * @static
	 *
	 * @param       $tweet_details
	 * @param array $options
	 * @return mixed
	 */
	static function patch_tweet_details( $tweet_details, $options = array() ) {
		$tweet_details['tweet_text'] = self::esc_amp_html( $tweet_details['tweet_text'] );
		return $tweet_details;
	}

	// Enqueue the Twitter platform script when update contains tweet
	static function lp_inject_twitter_script( $content ) {
		if ( preg_match( '/class="twitter-tweet"/i', $content ) ) {
			wp_enqueue_script( 'platform-twitter', 'https://platform.twitter.com/widgets.js', array() );
		}
		return $content;
	}


	/**
	 * Called by filter in the CoSchedule Plugin
	 * Returns false to stop an update from being posted to the CoSchedule system
	 * as only parent post needs to be scheduled
	 *
	 * @param bool	$state
	 * @param int	$post_id
	 *
	 * @return bool
	 */
	static function tm_coschedule_save_post_callback_filter( $state, $post_id ) {
		$parent_id = wp_get_post_parent_id( abs( $post_id ) );

		if ( LivePress_Updater::instance()->blogging_tools->get_post_live_status( $parent_id ) ) {
			$state = false;
		}
		// really make sure that we return a bool
		return ( false === $state ) ? false : true ;
	}
}
