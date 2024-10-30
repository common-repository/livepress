<?php

/**
 * A class representing the Live Blogging Tools tab on the edit post screen.
 *
 * @access public
 */
final class LivePress_Blogging_Tools {
	/**
	 * The tab data associated with the edit post screen.
	 *
	 * @var array
	 * @access private
	 */
	private $_tabs = array();

	/**
	 * The sidebar data associated with the edit post screen.
	 *
	 * @var string
	 * @access private
	 */
	private $sidebar = '';

	/**
	 * Constructor
	 *
	 * @uses add_action Adds an action to 'post_submitbox_misc_actions' to add the LivePress indicators.
	 */
	public function __construct() {
		add_action( 'add_meta_boxes', array( $this, 'livepress_status' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'feature_pointer' ) );
		foreach ( apply_filters( 'livepress_post_types', array( 'post' ) ) as $posttype ) {
			$filtername = 'postbox_classes_' . esc_attr( $posttype ) . '_livepress_status_meta_box';
			add_filter( $filtername, array( $this, 'add_livepress_status_metabox_classes' ) );
		}
		add_filter( 'mce_buttons', array( $this, 'lp_filter_mce_buttons' ) );
		add_filter( 'admin_body_class', array( $this, 'lp_admin_body_class' ) );
		add_filter( 'body_class', array( $this, 'lp_body_class' ) );
		add_action( 'wp', array( $this, 'opengraph_request' ) );
		add_action( 'wp_ajax_lp_update_shortlink', array( $this, 'lp_update_shortlink' ) );
		add_action( 'wp_ajax_nopriv_lp_update_shortlink', array( $this, 'lp_update_shortlink' ) );
	}

	/**
	 * String any shortcodes including caption
	 * @param $content
	 * @return mixed
	 */
	function lp_strip_shortcodes( $content ) {
		$content = preg_replace( '#\s*\[caption[^]]*\].*?\[/caption\]\s*#is', '', $content );
		$content = preg_replace( '/\[[^]]*\]/', '', $content );

		return $content;
	}

	/**
	 * Check if the request is from Facebook's Open Graph protocol. If
	 * so then just return the basic HTML for embedding. The link to
	 * share on Facebook should be:
	 * http://host/permalink?lpup=[livepress_update_id]
	 */
	function opengraph_request() {
		if ( isset( $_GET['lpup'] ) ) {
			$id              = absint( $_GET['lpup'] );
			$update          = $this->lp_get_single_update( $id );
			// lets check the parent post is Published and 404 if not
			if ( ! in_array( get_post_status( $update->post_parent ), array( 'publish', 'private' ), true ) ) {
				status_header( 404 );
				nocache_headers();
				include( get_query_template( '404' ) );
				die();
			}

			$data            = $this->opengraph_data( $update );
			$post_parent_url = get_permalink( $update->post_parent );
			if ( 0 === preg_match( '/\/\?/', $post_parent_url ) ) {
				$post_parent_url .= '?';
			} else {
				$post_parent_url .= '&';
			}
			$opengraph_url = apply_filters( 'livepress_opengraph_url', $post_parent_url . 'lpup=' . $id . '#livepress-update-' . $id );
			$canonical_url = apply_filters( 'livepress_canonical_url', $post_parent_url . '#livepress-update-' . $id );
			$old_description = $this->lp_strip_shortcodes( urldecode( $data->description ) );
			$description     = trim( wp_kses( apply_filters( 'the_excerpt', $old_description ), array() ) );

			echo '<!DOCTYPE html>' . PHP_EOL;
			echo '<html>' . PHP_EOL;
			echo '<head prefix="og: http://ogp.me/ns#">' . PHP_EOL;
			echo '<link rel="canonical" href="' . esc_url( $canonical_url ) . '">' . PHP_EOL;
			echo '<title>' . esc_html( $this->lp_strip_shortcodes( urldecode( $data->title ) ) ) . '</title>' . PHP_EOL;

			// Twitter card:
			// TODO: Make this customizable
			echo '<meta name="twitter:card" content="summary_large_image" />' . PHP_EOL;
			echo '<meta name="twitter:title" content="' . esc_attr( $this->lp_strip_shortcodes( urldecode( $data->title ) ) ) . '" />' . PHP_EOL;
			if ( $description ) {
				echo '<meta name="twitter:description" content="' . esc_attr( trim( $description ) ) . '" />' . PHP_EOL;
			}
			if ( isset( $data->img ) && $data->img ) {
				echo '<meta name="twitter:image" content="' . esc_attr( $data->img ) . '" />' . PHP_EOL;
			}
			if ( isset( $data->img_alt ) && $data->img_alt ) {
				echo '<meta name="twitter:image:alt" content="' . esc_attr( $data->img_alt ) . '" />' . PHP_EOL;
			}

			echo '<meta name="twitter:url" content="' . esc_url( $opengraph_url ) . '" />' . PHP_EOL;

			// Check if the update should be attributed to a Twitter user:
			$lp_twitter_user = get_user_meta( $update->post_author, 'lp_twitter', true );
			if ( ! empty( $lp_twitter_user ) ) {
				echo '<meta name="twitter:site:id" content="' . esc_attr( $lp_twitter_user ) . '" />' . PHP_EOL;
			}

			// Check if we're posting updates to a Twitter account and use
			// it for twitter site handle:
			$options = get_option( LivePress_Administration::$options_name );
			if ( isset( $options['post_to_twitter'] ) && true === $options['post_to_twitter'] && ! empty( $options['oauth_authorized_user'] ) ) {
				echo '<meta name="twitter:site" content=' . esc_attr( $options['oauth_authorized_user'] ) . '" />' . PHP_EOL;
			}

			// Facebook Open Graph:
			$old_title = $this->lp_strip_shortcodes( urldecode( $data->title ) );
			$title     = wp_kses( apply_filters( 'the_title', $old_title ), array() );
			echo '<meta property="og:title" content="' . esc_attr( $title ) . '" />' . PHP_EOL;
			echo '<meta property="og:type" content="' . esc_attr( $data->type ) . '" />' . PHP_EOL;
			echo '<meta property="og:url" content="' . esc_url( $opengraph_url ) . '" />' . PHP_EOL;
			if ( isset( $data->img ) && $data->img ) {
				echo '<meta property="og:image" content="' . esc_attr( $data->img ) . '" />' . PHP_EOL;
			}
			echo '<meta property="og:site_name" content="' . esc_attr( get_bloginfo( 'name' ) ) . '" />' . PHP_EOL;
			if ( $description ) {
				echo '<meta property="og:description" content="' . esc_attr( trim( $description ) ) . '" />' . PHP_EOL;
			}

			$facebook_app_id = apply_filters( 'lp_facebook_app_id', false );
			if ( $facebook_app_id ) {
				echo '<meta property="fb:app_id" content="' . esc_attr( $facebook_app_id ) . '" />' . PHP_EOL;
			}

			if ( ! isset( $_GET['lp_debug'] ) ) {
				if ( isset( $_GET['lp_close_popup'] ) ) {
					echo( '<script type="text/javascript">window.close();</script>' );
				} else {
					$post_url = $post_parent_url . '#livepress-update-' . $id;
					echo '<meta http-equiv="refresh" content="2;URL=' . esc_attr( $post_url ) . '">' . PHP_EOL;
					echo '<script type="text/javascript">window.location.replace(' . wp_json_encode( $post_url, JSON_UNESCAPED_SLASHES ) . ');</script>' . PHP_EOL;
				}
			} elseif ( current_user_can( apply_filters( 'lp_debug_capability', 'read_private_posts' ) ) ) {
				echo '<pre>' ;
				echo '<!--// The Updates raw post object' . PHP_EOL;
				print_r( $update );
				echo '//--> ' . PHP_EOL;
				echo '<!--// Opengraph Data : ' . PHP_EOL ;
				print_r( $data );
				echo '//--> ' . PHP_EOL;
				echo '<!--// Json LD Data : ' . PHP_EOL ;
				// so we see the header
				$json_ld = Json_Ld::header();
				list( $_t, $piece_id, $piece_gen ) = explode( '__', $update->post_title, 3 );
				$piece['id'] = $piece_id;
				$piece['content'] = $update->post_content;

				$json_ld = Json_Ld::pass_update( $json_ld, $piece );
				Json_Ld::render_json_block( $json_ld, true, true );
				echo '//--> </pre> ' . PHP_EOL;
			}

			echo '</head>' . PHP_EOL;
			echo '	<body>' . PHP_EOL;
			if ( isset( $_GET['lp_close_popup'] ) ) {
				echo '		<p>' . esc_html( __( 'Your post has sent to Facebook you may close this window now.', 'livepress' ) ) . '</p>' . PHP_EOL;
			} else {
				$description = preg_replace( '/\[\/livepress_metainfo\]/', '', $data->description );

				echo apply_filters( 'LP_opengraph_request_body', apply_filters( 'the_excerpt', $description ) ) . PHP_EOL;
			}
			echo '	</body>' . PHP_EOL . '</html>' . PHP_EOL;
			exit( 0 );
		}
	}

	/**
	 * @param $id
	 *
	 * @return mixed
	 */
	private function lp_get_single_update( $id ) {
		global $wpdb;

		$lp_get_post_cache_key = 'lp_get_post_cache_key_' . LP_PLUGIN_VERSION . '_' . $id;
		if ( false === ( $theresult = get_transient( $lp_get_post_cache_key ) ) ) {

			$query = $wpdb->prepare(
				'SELECT * FROM ' . $wpdb->posts . ' WHERE ' .
				" post_name = '%s' AND post_type = 'post'" .
				' ORDER BY ID DESC LIMIT 1', 'livepress_update__' . $id
			);

			$results   = $wpdb->get_results( $query );
			$theresult = $results[0];
			set_transient( $lp_get_post_cache_key, $theresult, DAY_IN_SECONDS );
		}

		return $theresult;
	}

	/**
	 * @param $update
	 *
	 * @return stdClass
	 */
	private function opengraph_data( $update ) {
		$data              = new stdClass();
		$data->description = '';
		// TODO: make this customizable:
		$data->type  = 'article';
		$data->title = $this->headline_title( $update );
		if ( ! $data->title ) {
			$data->title = get_the_title();
		}

		$content = $this->remove_author_info( $update->post_content );

		// Get image attributes for later
		$img_attrs = $this->og_image( $update );

		$content = wp_strip_all_tags(
			preg_replace( '/\[livepress_metainfo.+\]/', '', $content )
		);
		// remove [caption]
		$content = preg_replace( '/\[caption.*\[\/caption\]/i', '', $content );

		// Check tweets first since their content is already cached:
		if ( 1 === preg_match( '/https?:\/\/twitter\.com\S*/', $content, $matches ) ) {
			// Get embedded tweet from WP
			$tweet_data        = wp_oembed_get( $matches[0] );
			$data->description = wp_strip_all_tags( $tweet_data );

			if ( isset( $img_attrs['url'] ) ) {
				$data->img = $img_attrs['url'];
				if ( isset( $img_attrs['alt'] ) ) {
					$data->img_alt = $img_attrs['alt'];
				}
			}

			if ( ! $data->title ) {
				$data->title = wp_trim_words( $data->description, 10, esc_html__( '&hellip;', 'livepress' ) );
			}

			return $data;

		} elseif ( preg_match( '/^(https?:\/\/)\S*/i', $content, $matches ) ) {
			// oEmbed update:
			$odata = get_transient( 'lpup_' . LP_PLUGIN_VERSION . '_' . $update->ID );

			if ( false === $odata ) {
				// Get oEmbed data
				$url = $matches[0];
				wp_oembed_get( $url );
				$oembed       = _wp_oembed_get_object();
				$provider_url = $oembed->get_provider( $matches[0] );
				// Returns false on failure or object (
				$odata = $oembed->fetch( $provider_url, $url );
				if ( false !== $odata ) {
					// Set the cache to expire in one month
					set_transient( 'lpup_' . LP_PLUGIN_VERSION . '_' . $update->ID, $odata, 30 * DAY_IN_SECONDS );
				}
			}
			if ( false !== $odata ) {
				if ( ! $data->title ) {
					$data->title = $odata->title;
				}

				$data->description = $data->title;
				$data->img         = $odata->thumbnail_url;

				return $data;
			}
		}

		// No oEmbeds:
		if ( isset( $img_attrs['url'] ) ) {
			$data->img = $img_attrs['url'];
			if ( isset( $img_attrs['alt'] ) ) {
				$data->img_alt = $img_attrs['alt'];
			}
		}
		if ( ! $data->title ) {
			$data->title = $this->og_title( $content );
		}

		if ( count( $content ) > 0 && '' !== $content ) {
			$data->description = wp_trim_words( $content, 40, esc_html__( '&hellip;', 'livepress' ) );
		} else {
			if ( isset ( $img_attrs['alt'] ) ) {
				$data->description = $img_attrs['alt'];
			} else {
				$data->description = $data->title;
			}
		}

		return $data;
	}

	/**
	 * Get the image from the parent post if there's a featured image:
	 *
	 * @param $update
	 *
	 * @return array
	 */
	private function og_image( $update ) {
		global $post;
		$img_attrs = [];
		$content = $this->remove_author_info( $update->post_content );

		preg_match( '/data-lp-screenshot-url\s*=\s*\"([^\"]+)\"/', $content, $matches );
		if ( 0 < count( $matches ) ) {
			$img_attrs = [
			'url' => $matches[1],
			];
		} elseif ( has_post_thumbnail( $update->ID ) ) {
			$img_attrs = $this->image_attrs_from_thumbnail( $update );
		} else {
			$doc = new DOMDocument();
			$doc->loadHTML( $content );
			$img_tags = $doc->getElementsByTagName( 'img' );

			if ( 0 < $img_tags->length ) {
				$img_attrs = [
				'url' => $img_tags->item( 0 )->getAttribute( 'src' ),
				'alt' => $img_tags->item( 0 )->getAttribute( 'alt' ),
				];
			} elseif ( has_post_thumbnail( $post->ID ) ) {
				$img_attrs = $this->image_attrs_from_thumbnail( $post );
			}
		}

		return $img_attrs;
	}

	/**
	 * @param $post
	 *
	 * @return array
	*/
	private function image_attrs_from_thumbnail( $post ) {
		$img_attrs = [];

		if ( has_post_thumbnail( $post->ID ) ) {
			$img_id = get_post_thumbnail_id( $post->ID );
			$img_attrs = [
			'url' => wp_get_attachment_url( $img_id ),
			'alt' => wp_strip_all_tags( get_post_meta( $img_id, '_wp_attachment_image_alt', true ) ),
			];
		}

		return $img_attrs;
	}

	// Get the title from the update header
	private function headline_title( $update ) {
		if ( preg_match( '/\[livepress_metainfo.+update_header=\"(.+)\".*\]/', $update->post_content, $matches ) ) {
			return $matches[1];
		} else {
			return false;
		}
	}

	// Use when there's no update header or oembed title. Get the title from
	// the post content or the original post's title if everything else fails.
	/**
	 *
	 *
	 * @param $post_content
	 * @return string
	 */
	private function og_title( $post_content ) {
		if ( 0 < count( $post_content ) && '' != $post_content ) {
			$title = wp_trim_words( $post_content, 10, esc_html__( '&hellip;', 'livepress' ) );
		} else {
			global $post;
			$title = $post->post_title;
		}

		return $title;
	}

	// Remove author name and avatar from content:
	public function remove_author_info( $content ) {

		return preg_replace( '/\<div\sclass="live-update-authors"\>.+?\<\/div\>/s', '', $content );
	}


	/**
	 * Add the livepress classes to the page when a post is live.
	 *
	 * @param  array $classes Array of classes.
	 *
	 * @return array          Updated array of classes.
	 *
	 * @since 1.1.5
	 */
	function lp_body_class( $classes ) {
		global $post;

		// Only add once!
		if ( in_array( 'livepress-live', $classes ) ) {
			return $classes;
		}

		// Only apply to live posts
		if ( ! is_object( $post ) || ! $this->get_post_live_status( $post->ID ) ) {

			return $classes;
		}

		// Add the livepress-live class
		array_push( $classes, 'livepress-live' );

		// Add the livepress update format class
		$settings      = get_option( 'livepress', array() );
		$update_format = isset( $settings['update_format'] ) ? $settings['update_format'] : 'default';
		array_push( $classes, 'livepress-update-format-' . $update_format );

		if ( array_key_exists( 'show', $settings ) && null !== $settings['show'] ) {
			foreach ( $settings['show'] as $show ) {
				// "###AVATAR### ###AUTHOR###  ###TIME### 	###HEADER###";
				array_push( $classes, 'livepress-update-show-' . strtolower( $show ) );
			}
		}

		return $classes;
	}

	/**
	 * Add the livepress classes to the edit post page when a post is live.
	 *
	 * @param  String $classes String list of classes.
	 *
	 * @return String          Updated list of classes.
	 *
	 * @since 1.1.1
	 */
	function lp_admin_body_class( $classes ) {
		global $post;
		$screen = get_current_screen();
		// In admin, only add on supported post types
		if ( is_admin() && ! in_array( $screen->id, apply_filters( 'livepress_post_types', array( 'post' ) ) ) ) {
			return $classes;
		}

		// Only apply to live posts
		if ( ! $this->get_post_live_status( $post->ID ) ) {
			return $classes;
		}
		// Only add once!
		if ( false !== strstr( $classes, 'livepress-live' ) ) {
			return $classes;
		}

		// Add the livepress-live class
		$classes .= ' livepress-live';

		// Add the livepress update format class
		$settings      = get_option( 'livepress' );
		$update_format = isset( $settings['update_format'] ) ? $settings['update_format'] : 'default';
		$classes .= ' livepress-update-format-' . $update_format;
		if ( array_key_exists( 'show', $settings ) && null !== $settings['show'] ) {
			foreach ( $settings['show'] as $show ) {
				// "###AVATAR### ###AUTHOR###  ###TIME### 	###HEADER###";
				$classes .= ' livepress-update-show-' . strtolower( $show );
			}
		}

		return $classes;
	}

	/**
	 * Check if a post has the Live Post Header feature enabled.
	 *
	 * @param  int $post_id The post id.
	 *
	 * @return boolean      True if the header is enabled, false if not.
	 *
	 * @since  1.0.9
	 */
	public function is_post_header_enabled( $post_id ) {
		return ( '1' === ( $this->get_option( 'post_header_enabled', $post_id, '0' ) ) );
	}

	/**
	 * Set if a post has the Live Post Header feature enabled.
	 *
	 * @param int $post_id The post id.
	 * @param boolean $enable Enable (true) or disable (false) the feature.
	 *
	 * @since  1.0.9
	 */
	public function set_post_header_enabled( $post_id, $enable = true ) {

		$this->save_option( 'post_header_enabled', $enable, $post_id );
	}

	/**
	 * Check to see if we have previously saved a password for the user
	 *
	 * @param  int $user_id The id of the user to check.
	 *
	 * @return boolean True if we have a paassword save, otherwise false
	 *
	 * @since 1.0.9
	 */
	public function get_have_user_pass( $user_id ) {
		$users_with_passwords = get_option( 'livepress_users_with_passwords', array() );

		return in_array( $user_id, $users_with_passwords );
	}

	/**
	 * Set the status of the saved user password.
	 *
	 * @param int $user_id The id of the user to check.
	 * @param boolean $status Whether the password bas been saved
	 *
	 * @since 1.0.9
	 */
	public function set_have_user_pass( $user_id, $status = false ) {
		$users_with_passwords = get_option( 'livepress_users_with_passwords', array() );
		if ( $status && ! in_array( $user_id, $users_with_passwords ) ) {
			array_push( $users_with_passwords, $user_id );
		} else {
			// Remove post id if setting status not live
			if ( ! $status && in_array( $user_id, $users_with_passwords ) ) {
				$users_with_passwords = array_diff( $users_with_passwords, array( $user_id ) );
			}
		}
		update_option( 'livepress_users_with_passwords', $users_with_passwords );
	}

	/**
	 * Clear the livepress_users_with_passwords option
	 *
	 * @since 1.0.9
	 */
	public function clear_have_user_pass() {
		delete_option( 'livepress_users_with_passwords' );
	}

	/**
	 * Check the live status of a post.
	 *
	 * @param  int $post_id The post id.
	 *
	 * @return boolean      True if the post is live, false if not live.
	 *
	 * @since  1.0.7
	 */
	public function get_post_live_status( $post_id ) {
		$live_posts = get_option( 'livepress_live_posts', array() );

		// Search for the post id among the live posts
		return apply_filters( 'livepress_get_post_live_status', in_array( $post_id, $live_posts ), $post_id );
	}

	/**
	 * Set the live status of a post.
	 *
	 * @param int $post_id The post id.
	 * @param bool $status Status - True to set the post is live, false to set not live.
	 *
	 * @since  1.0.7
	 */
	public function set_post_live_status( $post_id, $status ) {
		$live_posts = get_option( 'livepress_live_posts', array() );
		// Add post id if setting status live
		if ( $status ) {
			if ( ! in_array( $post_id, $live_posts ) ) {
				array_push( $live_posts, $post_id );
			}
		} else {
			$live_posts = array_diff( $live_posts, array( $post_id ) );
		}
		update_option( 'livepress_live_posts', $live_posts );

		// get the order the updates are shown in
		$update_order_key = 'feed_order';

		$options = get_option( LivePress_Administration::$options_name );
		$meta_order = $options[ $update_order_key ];

		// only set if this value hasn't already been set
		add_post_meta( $post_id, 'livepress_' . $update_order_key, $meta_order, true );
	}

	/**
	 * Get an array of all posts that are live.
	 *
	 * @return mixed|void @param array $args {
	 *     An array of post_ids for all live posts
	 * @internal param int $post_id The post id
	 * }
	 *
	 * @since  1.0.7
	 */
	function get_all_live_posts() {

		return get_option( 'livepress_live_posts', array() );
	}

	/**
	 * Upgrade the live status storage from using post meta for each post.
	 * Instead use a single option that contains a list of live Posts.
	 *
	 * Each option is an array containing a list of live post ids.
	 *
	 * Called when upgrading.
	 *
	 * @since  1.0.7
	 */
	function upgrade_live_status_system() {
		$all_posts = get_posts( array( 'suppress_filters' => false ) );
		foreach ( $all_posts as $post ) {
			$status = $this->get_option( 'live_status', $post->ID );
			if ( ( isset( $status['live'] ) ) && 1 === (int) $status['live'] ) {
				$this->set_post_live_status( $post->ID, true );
				$this->save_option( 'live_status', false, $post->ID );
			}
		}
	}

	/**
	 * Filter the default mce editor icons to exclude the fullscreen button.
	 * @param $buttons
	 * @return mixed
	 */
	public function lp_filter_mce_buttons( $buttons ) {
		global $post;
		if ( ! is_object( $post ) ) {

			return $buttons;
		};

		$remove  = 'fullscreen';
		$is_live = $this->get_post_live_status( $post->ID );

		if ( $is_live && false !== ( $key = array_search( $remove, $buttons ) ) ) {
			//Find the array key and then unset
			unset( $buttons[ $key ] );
		}

		return $buttons;
	}

	/**
	 * Add appropriate classes to the meta box for proper diaplay of LivePress status.
	 *
	 * Adds one of 'live' or 'not-live'
	 *
	 * @param array $classes existing classes for the meta box
	 *
	 * @return array ammended classes for the meta box
	 */
	public function add_livepress_status_metabox_classes( $classes ) {
		global $post;

		$is_live = $this->get_post_live_status( $post->ID );

		if ( $is_live ) {
			$finished = get_post_meta( $post->ID, 'lp_post_finished', true );
			if ( $finished ) {
				$toggle = 'finished';
			} else {
				$toggle = 'live';
				// Also delete the post lock since the post is live - allow simultaneous editing
				delete_post_meta( $post->ID, '_edit_lock' );
			}
		} else {

			$toggle = 'not-live';
		}

		if ( ! in_array( $toggle, $classes ) ) {
			array_push( $classes, $toggle );
		}

		$pin_header = $this->is_post_header_enabled( $post->ID );
		if ( $pin_header ) {
			$toggle = 'pinned-header';
			if ( ! in_array( $toggle, $classes ) ) {
				array_push( $classes, $toggle );
			}
		}

		return $classes;
	}

	/**
	 * Display the LivePress meta box above the Post Publish meta box.
	 */
	public function livepress_status_meta_box() {
		global $post;

		$pin_header = $this->is_post_header_enabled( $post->ID );

		echo '<div id="lp-pub-status-bar" class="major-publishing-actions">';
		echo '<div class="info">';
		echo '<span class="first-line">';
		echo '<span class="lp-on">' . sprintf( '%s <strong>%s</strong>', esc_html__( 'This Post is', 'livepress' ), esc_html__( 'LIVE' ) ) . '</span>';
		echo '<span class="lp-off">' . sprintf( '%s <strong>%s</strong>', esc_html__( 'This Post is', 'livepress' ), esc_html__( 'NOT LIVE' ) ) . '</span>';
		echo '<span class="lp-finish">' . sprintf( '%s <strong>%s</strong>', esc_html__( 'This Post is', 'livepress' ), esc_html__( 'FINISHED' ) ) . '</span>';
		echo '<span class="disabled">' . esc_html__( 'LivePress is Disabled', 'livepress' ) . '</span>';
		echo sprintf( ' <a class="toggle-live button finish">%s</a>', esc_html__( 'End Live Blog', 'livepress' ) );
		echo sprintf( ' <a class="toggle-live button restart">%s</a>', esc_html__( 'Restart', 'livepress' ) );
		//echo sprintf( ' <a class="toggle-live button turnoff">%s</a>', esc_html__( 'Archive', 'livepress' ) );
		echo sprintf( ' <a class="toggle-live button turnon">%s</a>', esc_html__( 'Turn on live', 'livepress' ) );
		echo '</span>';
		echo '</div>';
		echo '</div>';
		echo '<div class="pinned-first-option">';
		echo '<label class="pinnit"><input id="pinfirst" type="checkbox" ' . ( $pin_header ? 'checked="checked" ' : '' ) . ' name="pinfirst" value="1">';
		echo esc_html__( 'Pin first update', 'livepress' );
		echo '</label></div>';
	}

	/**
	 * Add the LivePress meta box above the Post Publish meta box.
	 */
	public function livepress_status() {
		global $post;

		// Only show on post_type == 'post'
		if ( ! in_array( $post->post_type, apply_filters( 'livepress_post_types', array( 'post' ) ) ) ) {
			return;
		}
		if ( LP_LIVE_REQUIRES_ADMIN ) {
			// Only allow enabling live for posts to admins
			// If post is already live, allow anyone to live blog
			$is_live = $this->get_post_live_status( $post->ID );
			if ( ! current_user_can( 'manage_options' ) && ! $is_live ) {
				return;
			}
		}

		add_meta_box(
			'livepress_status_meta_box',
			esc_html__( 'LivePress Status', 'livepress' ),
			array( $this, 'livepress_status_meta_box' ),
			'',
			'side',
			'high'
		);
	}

	/**
	 * Get all of the tabs for the Live Blogging Tools section.
	 *
	 * @return array All tabs with arguments.
	 */
	public function get_tabs() {
		return $this->_tabs;
	}

	/**
	 * Get the arguments for a specifc tab.
	 *
	 * @param string $id Tab ID.
	 *
	 * @return array Tab arguments
	 */
	public function get_tab( $id ) {
		if ( ! isset( $this->_tabs[ $id ] ) ) {
			return null;
		}

		return $this->_tabs[ $id ];
	}

	/**
	 * Add a tab to the Live Blogging Tools section.
	 *
	 * @param array $args {
	 *     Array of arguments for a Live Blogging Tools tab.
	 *
	 * @type string $title Title for the tab.
	 * @type string $id Tab ID. Must be HTML-safe.
	 * @type string $content HTML content for the tab.
	 * @type callback $callback Optional. Callback function to generate tab content.
	 * }
	 */
	public function add_tab( $args ) {
		$defaults = array(
			'title'    => false,
			'id'       => false,
			'content'  => '',
			'callback' => false,
		);
		$args     = wp_parse_args( $args, $defaults );

		$args['id'] = sanitize_html_class( $args['id'] );

		// Ensure we have a title and ID
		if ( ! $args['id'] || ! $args['title'] ) {
			return;
		}

		// Allows for overriding an existing tab with that id.
		$this->_tabs[ $args['id'] ] = $args;
	}

	/**
	 * Remove the identified tab from the Live Blogging Tools section.
	 *
	 * @param string $id The tab id.
	 */
	public function remove_tab( $id ) {
		unset( $this->_tabs[ $id ] );
	}

	/**
	 * Remove all tabs from the Live Blogging Tools section.
	 */
	public function remove_tabs() {
		$this->_tabs = array();
	}

	/**
	 * Get the content from the Live Blogging Tools sidebar.
	 *
	 * @users apply_filters() Calls 'livepress_blogging_tools_sidebar' to get the remaining markup of the sidebar.
	 */
	public function get_sidebar() {
		return apply_filters( 'livepress_blogging_tools_sidebar', $this->sidebar );
	}

	/**
	 * Add a sidebar to the Live Blogging Tools section.
	 *
	 * @param string $content Sidebar content in plaintext or HTML.
	 */
	public function set_sidebar( $content ) {
		$this->sidebar = $content;
	}

	/**
	 * Get either a global option or one tied to a specific post.
	 *
	 * @param  string $option_name Name of the option to retrieve.
	 * @param  int $post_id Post ID (optional).
	 * @param  mixed $default_return Default value to return if option is not set, empty string by default
	 *
	 * @return mixed|null Stored option.
	 */
	public function get_option( $option_name, $post_id = null, $default_return = '' ) {
		if ( null != $post_id ) {
			$to_return = get_post_meta( $post_id, '_livepress_' . $option_name, true );
			if ( '' == $to_return ) {
				$to_return = $default_return;
			}
		} else {
			$to_return = get_option( 'livepress_' . $option_name );
		}

		return $to_return;
	}

	/**
	 * Save an option, either as a global or for a specific post.
	 *
	 * @param string $option_name Name of the option to save.
	 * @param mixed $value Option value
	 * @param int $post_id Post ID (optional).
	 */
	public function save_option( $option_name, $value, $post_id = null ) {
		if ( null != $post_id ) {
			update_post_meta( $post_id, '_livepress_' . $option_name, $value );

			return;
		}

		update_option( 'livepress_' . $option_name, $value );
	}

	/**
	 * Render the screen's Live Blogging Tools section.
	 *
	 * @users add_filter() Adds a filter to the get_sidebar class method to load the current post's live status.
	 */
	public function render_tabs() {
		$sidebar = $this->get_sidebar();

		// Render the section
		?>
		<div id="blogging-tools-back"></div>
		<div id="blogging-tools-columns">
			<div class="blogging-tools-tabs">
				<ul>
					<?php
					$class = ' class=active';
					foreach ( $this->get_tabs() as $tab ) :
						$link_id = "tab-link-{$tab['id']}";
						$panel_id = "tab-panel-{$tab['id']}";
					?>
						<li id="<?php echo esc_attr( $link_id ); ?>"<?php echo esc_attr( $class ); ?>>
							<a href="<?php echo esc_url( "#$panel_id" ); ?>" aria-controls="<?php echo esc_attr( $panel_id ); ?>">
								<?php echo esc_html( $tab['title'] ); ?>
							</a>
							<span class="count-update">0</span>
						</li>
						<?php
						$class   = '';
					endforeach;
					?>
				</ul>
			</div>

			<?php if ( $sidebar ) : ?>
				<div class="blogging-tools-sidebar">
					<?php echo wp_kses_post( $sidebar ); ?>
				</div>
			<?php endif; ?>

			<div class="blogging-tools-tabs-wrap">
				<?php
				$classes = 'blogging-tools-content active';
				foreach ( $this->get_tabs() as $tab ) :
					$panel_id = "tab-panel-{$tab['id']}";
					?>
					<div id="<?php echo esc_attr( $panel_id ); ?>" class="<?php echo esc_attr( $classes ); ?>">
						<?php
						echo wp_kses_post( $tab['content'] );

						if ( ! empty( $tab['callback'] ) ) {
							call_user_func_array( $tab['callback'], array( $this, $tab ) );
						}
						?>
					</div>
					<?php
					$classes  = 'blogging-tools-content';
				endforeach;
				?>
			</div>
		</div>
		<?php
	}

	/**
	 * AJAX short-circuit function to render tabs and immediately die().
	 */
	public function ajax_render_tabs() {
		global $current_post_id;

		check_ajax_referer( 'render_tabs_nonce' );

		if ( isset( $_POST['post_id'] ) ) {
			$current_post_id = (int) $_POST['post_id'];
		} else {
			$current_post_id = null;
		}

		if ( ! current_user_can( 'edit_post', $current_post_id ) ) {
			die();
		}

		$this->render_tabs();
		die();
	}

	/**
	 * Add the default tabs required by the UI.
	 *
	 * @uses apply_filters() Calls 'livepress_sidebar_top' to allow adding items to the "This post at a glance" section.
	 * @uses do_action() Calls 'livepress_setup_tabs' to allow adding new tabs to the tools palette.
	 */
	public function setup_tabs() {

		$this->add_tab( array(
			'id'       => 'live-twitter-search',
			'title'    => esc_attr__( 'Twitter Search', 'livepress' ),
			'callback' => array( $this, 'live_twitter_search' ),
		) );

		$this->add_tab( array(
			'id'       => 'live-remote-authors',
			'title'    => esc_attr__( 'Manage Remote Authors', 'livepress' ),
			'callback' => array( $this, 'remote_authors' ),
		) );

		$this->add_tab( array(
			'id'       => 'live-notes',
			'title'    => esc_attr__( 'Author Notes', 'livepress' ),
			'callback' => array( $this, 'author_notes' ),
		) );

		$sidebar = '<p><strong>' . esc_html__( 'This post at a glance:', 'livepress' ) . '</strong></p>';
		$sidebar .= '<p><span class="dashicons dashicons-admin-comments"></span> <span id="livepress-comments_num">0</span> <span class="label">' . esc_html__( 'Comments', 'livepress' ) . '</span></p>';
		$sidebar .= '<p><span class="icon-remote-authors"></span> <span id="livepress-authors_num">0</span> <span class="label">' . esc_html__( 'Remote Authors', 'livepress' ) . '</span></p>';
		$sidebar .= '<p><span class="icon-people-online"></span> <span id="livepress-online_num">0</span> <span class="label">' . esc_html__( 'People Online', 'livepress' ) . '</span></p>';

		apply_filters( 'livepress_sidebar_top', $sidebar );

		$this->set_sidebar( $sidebar );

		do_action( 'livepress_setup_tabs', $this );
	}

	/**
	 * Render the markup of the per-post author notes section.
	 *
	 */
	private function author_notes() {
		global $current_post_id;
		?>
		<label for="live-notes-text">
		<?php esc_html_e( 'These notes are for reference and will not be published. They will be saved with the post for future reference for sharing with co-authors.', 'livepress' ); ?>
		</label>

		<textarea rows="4" cols="10" id="live-notes-text" name="live-notes-text"><?php echo esc_textarea( $this->get_option( 'live-note', $current_post_id ) ); ?></textarea>
		<input type="submit" id="live-notes-submit" name="live-notes-submit" class="button-secondary" value="<?php esc_html_e( 'Save', 'livepress' ); ?>"/>
		<div class="live-notes-status"><?php esc_html_e( 'Notes Saved', 'livepress' ); ?></div>
		<?php
	}

	/**
	 * Update a post's author notes via AJAX.
	 */
	public function update_author_notes() {
		$post_id = (int) $_POST['post_id'];
		$content = wp_kses_post( $_POST['content'] );
		$nonce   = $_POST['ajax_nonce'];

		if ( ! wp_verify_nonce( $nonce, 'livepress-update_live-notes-' . $post_id ) ) {
			die();
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			die();
		}

		$this->save_option( 'live-note', $content, $post_id );

		die();
	}


	/**
	 * Render the markup for the live Twitter search section.
	 *
	 */
	private function live_twitter_search() {
		?>
		<label for="live-search-query">
		<?php esc_html_e( 'Updates in real-time using your search terms.', 'livepress' ); ?>
		</label>
		<div id="live-search-column">

			<p>
				<input type="text" id="live-search-query" name="live-search-query"/>
				<input type="submit" class="button-secondary" value="<?php esc_html_e( 'Add Search Term', 'livepress' ); ?>"/>
				<a id="lp-tweet-player" class="streamcontrol button-secondary icon-pause" href="#" title="<?php esc_attr_e( 'Click to pause the tweets so you can decide when to display them', 'livepress' ); ?>">
					<span class="screen-reader-text"><?php esc_html_e( 'play/pause', 'livepress' ); ?><span>
				</a>
			</p>

			<div id="lp-twitter-search-terms">
			</div>
		</div>
		<div id="lp-hidden-tweets"></div>
		<div id="lp-twitter-results">

		</div>
		<?php
	}

	/**
	 * Render the markup for the remote authors section.
	 *
	 */
	private function remote_authors() {
		?>
		<div id="remote-authors">
			<label for="new-twitter-account">
				<?php echo sprintf( '<strong>%s</strong> %s', esc_html__( 'All', 'livepress' ), esc_html__( 'tweets from these remote authors will automatically be published as updates to this blog post until removed..', 'livepress' ) ); ?>
			</label>

			<div class="configure">
				<span class="add-on">@</span>
				<input type="text" name="new_term" id="new-twitter-account" class="new-term lp-input form-input-tip" size="16" autocomplete="off" placeholder="<?php esc_html_e( 'Account Name', 'livepress' ); ?>"/>
				<input class="button-secondary termadd" value="<?php esc_html_e( 'Add Remote Author', 'livepress' ); ?>" type="submit"/>

				<div id="termadderror" class="lp-message lp-error"><?php esc_html_e( 'Author error: ', 'livepress' ); ?>
					<span id="errmsg"></span></div>
				<div class="clean lp-tweet-cleaner">
					<p><?php esc_html_e( 'Done live blogging on this post?', 'livepress' ); ?></p>
					<input class="button-secondary cleaner" value="<?php esc_html_e( 'Remove All', 'livepress' ); ?>"  type="submit"/>
				</div>
			</div>
			<ul id="lp-account-list"></ul>
		</div>
		<?php
	}
	/**
	 * Toggle the live status of the current post via AJAX.
	 */
	public function toggle_live_status_to_finished() {
		$post_id = (int) $_POST['post_id'];
		$nonce   = $_POST['ajax_nonce'];

		if ( ! wp_verify_nonce( $nonce, 'livepress-update_live-status-' . $post_id ) ) {

			die();
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {

			die();
		}

		update_post_meta( $post_id, 'lp_post_finished', true );

		die();
	}

	/**
 * Toggle the live status of the current post via AJAX.
 */
	public function toggle_live_status_to_live() {
		$post_id = (int) $_POST['post_id'];
		$nonce   = $_POST['ajax_nonce'];

		if ( ! wp_verify_nonce( $nonce, 'livepress-update_live-status-' . $post_id ) ) {

			die();
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {

			die();
		}

		delete_post_meta( $post_id, 'lp_post_finished', true );

		die();
	}
	/**
	 * Toggle the live status of the current post via AJAX.
	 */
	public function toggle_live_status() {
		$post_id = (int) $_POST['post_id'];
		$nonce   = $_POST['ajax_nonce'];

		if ( ! wp_verify_nonce( $nonce, 'livepress-update_live-status-' . $post_id ) ) {
			die();
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			die();
		}

		$is_live = $this->get_post_live_status( $post_id );

		$this->set_post_live_status( $post_id, ! $is_live );

		die();
	}

	/**
	 * Make a feature pointer available so that users can find
	 * the Blogging Tools Palette.
	 */
	public function feature_pointer() {
		if ( function_exists( 'get_current_screen' ) ) {
			$screen = get_current_screen();
			if ( is_admin() &&  'settings_page_livepress-settings' !== $screen->id && ! in_array( $screen->id, apply_filters( 'livepress_post_types', array( 'post' ) ) ) ) {

				return;
			}
		}

		$dismissed = explode( ',', (string) get_user_meta( get_current_user_id(), 'dismissed_wp_pointers', true ) );

		if ( ! in_array( 'livepress_pointer', $dismissed ) ) {
			// Enqueue pointers
			wp_enqueue_script( 'wp-pointer' );
			wp_enqueue_style( 'wp-pointer' );

			if ( LivePress_Config::get_instance()->debug() ) {
				wp_enqueue_script( 'livepress-pointer', LP_PLUGIN_URL . 'js/admin/livepress-pointer.full.js', array( 'wp-pointer' ), LP_PLUGIN_SCRIPT_VERSION, true );
			} else {
				wp_enqueue_script( 'livepress-pointer', LP_PLUGIN_URL . 'js/admin/livepress-pointer.min.js', array( 'wp-pointer' ), LP_PLUGIN_SCRIPT_VERSION, true );
			}

			// Initialize JS Options
			$pointer            = array();
			$pointer['ajaxurl'] = admin_url( 'admin-ajax.php' );

			$html               = array();
			$html[]             = '<h3>' . esc_html__( 'New Real-Time Writing Tools!', 'livepress' ) . '</h3>';
			$html[]             = '<p>' . esc_html__( 'Click the above link to expand a set of tools for managing comments, searching Twitter, adding remote authors, and saving notes. &mdash; All in real-time!', 'livepress' ) . '</p>';
			$pointer['content'] = implode( '', $html );

			wp_localize_script( 'livepress-pointer', 'livepress_pointer', $pointer );
		}
	}

	/**
	 * Display custom column on the Post list page.
	 *
	 * @param $column
	 * @param $post_id
	 */
	function display_posts_livestatus( $column, $post_id ) {

		if ( 'livepress_status' !== $column ) {
			return;
		}
		$is_live = $this->get_post_live_status( $post_id );

		if ( $is_live ) {
			if ( 'true' === get_post_meta( $post_id, 'lp_content_is_raw', true ) ) {
				$toggle = 'slack';
				$title  = esc_html__( 'This a Slack driven post', 'livepress' );
			}else{
				$toggle = 'enabled';
				$title  = esc_html__( 'This Post is LIVE', 'livepress' );
            }
		} else {
			$toggle = 'disabled';
			$title  = esc_html__( 'This Post is NOT LIVE', 'livepress' );
		}

		echo sprintf( '<div title="%s" class="live-status-circle live-status-%s"></div>', esc_attr( $title ), esc_attr( $toggle ) );

		add_action( 'admin_print_footer_scripts', array( $this, 'admin_print_styles' ) );
	}


	/**
	 * output css needed to status
	 */
	function admin_print_styles(){
	    ?>
<style type="text/css">

    .live-status-circle {
        border-radius: 50%;
        width: 10px;
        height: 10px;
        margin: 3px 0 0;
        padding: 0;
    }

    .live-status-enabled {
        background-color: #69ca14;
        border: 1px solid #69ca0f;
    }
    .live-status-slack {
        background-color: #6793ca;
        border: 1px solid #6793CA;
    }
    .live-status-disabled {
        background-color: #cacaca;
        border: 1px solid #999;
    }
</style>
	<?php
    }

	function lp_update_shortlink() {
		check_ajax_referer( 'lp_update_shortlink' );
		$post_id     = isset( $_REQUEST['post_id'] ) ? intval( $_REQUEST['post_id'] ) : null;
		$update_id   = isset( $_REQUEST['update_id'] ) ? intval( $_REQUEST['update_id'] ) : null;
		$cache_key   = 'lp_shortlink_aaaa' . LP_PLUGIN_VERSION . '_' . $update_id;
		$shortlink   = LivePress_WP_Utils::get_from_post( $post_id, $cache_key, true );
		$status_code = 200;
		if ( ! $shortlink ) {
			global $post;
			$post            = get_post( $post_id );
			$post_parent_url = get_permalink( $post );
			if ( 0 === preg_match( '/\/\?/', $post_parent_url ) ) {
				$post_parent_url .= '?';
			} else {
				$post_parent_url .= '&';
			}
			$canonical_url = $post_parent_url . 'lpup=' . $update_id . '#livepress-update-' . $update_id;

			//$bitly_api = '7ea952a9826d091fbda8a4ca220ba634efe61e31'; // TODO: Allow to set up from web page
			$bitly_api     = 'a68d0da03159457bff5f6b287d6cdecb88b108dd'; // datacompboy
			$get_shortlink = 'https://api-ssl.bitly.com/v3/shorten?access_token=' . $bitly_api . '&domain=bit.ly&longUrl=' . urlencode( $canonical_url );

			$url = $get_shortlink;
			if ( function_exists( 'vip_safe_wp_remote_get' ) ) {
				$res = vip_safe_wp_remote_get(
					$url,
					'',    /* fallback value */
					5,     /* threshold */
					10,     /* timeout */
					20    /* retry */
				);
			} else {
				$res = wp_remote_get( $url );
			}
			$response    = json_decode( $res['body'], true );
			$status_code = $response['status_code'];

			if ( is_wp_error( $res ) || 200 !== $status_code ) {
				$shortlink = $canonical_url;
			} else {
				if ( ! $res || ! isset( $response['data'] ) || ! isset( $response['data']['url'] ) ) {
					$shortlink   = $canonical_url;
					$status_code = 500;
				} else {
					$shortlink = $response['data']['url'];
					LivePress_WP_Utils::save_on_post( $post_id, $cache_key, $shortlink );

					$options       = get_option( LivePress_Administration::$options_name );
					$livepress_com = new LivePress_Communication( $options['api_key'] );
					$livepress_com->send_to_livepress_broadcast( $post_id, array( 'shortlink' => array( $update_id => $shortlink ) ) );
				}
			}
		}
		wp_send_json_success( array( 'shortlink' => $shortlink, 'code' => $status_code ) );
	}
}
