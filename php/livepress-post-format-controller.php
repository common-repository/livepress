<?php
/**
 * Module to handle post-format updates to individual posts.
 *
 * @module LivePress
 * @since  0.7
 */

/**
 * Singleton class for managing post formats and updates.
 *
 * Covers inserting new updates into the database, overriding post displays to hide them from the normal display,
 * and pulling them back out in the appropriate loops for display on individual post pages.
 */
class LivePress_PF_Updates {
	/**
	 * Singleton instance
	 *
	 * @var bool|LivePress_PF_Updates
	 */
	protected static $instance = false;

	/**
	 * LivePress API communication instance.
	 * @var LivePress_Communication
	 */
	var $lp_comm;

	/**
	 * LivePress API key as stored in the database.
	 *
	 * @var string
	 */
	var $api_key;

	/**
	 * Order in which updates are displayed.
	 *
	 * @var string
	 */
	var $order;

	/**
	 * Array of region information for each update.
	 *
	 * Must be populated by calling assemble_pieces() and specifying the Post for which to parse regions.
	 *
	 * @var array[]
	 */
	var $pieces;

	/**
	 * Array of live tags.
	 *
	 * Must be populated by calling assemble_pieces() and specifying the Post for which to parse regions.
	 *
	 * @var array[]
	 */
	var $livetags;

	/**
	 * Collected post meta information, populated by assemble_pieces()
	 *
	 * post_modified_gmt = timestamp of most recent post modify
	 * near_uuid = uuid of post update, that was around 2 minutes ago (or last, if last older)
	 */
	var $post_modified_gmt;
	var $near_uuid;
	var $cache = false;

	/**
	 * Holds client provided ID for current update, if any
	 */
	var $client_provided_update_id = null;

	/**
	 * Private constructor used to build the singleton instance.
	 * Registers all hooks and filters.
	 *
	 * @access protected
	 */
	protected function __construct() {
		$options = get_option( LivePress_Administration::$options_name );

		if ( false != $options && array_key_exists( 'api_key', $options ) ) {
			$this->api_key = $options['api_key'];
			$this->lp_comm = new LivePress_Communication( $this->api_key );

			$this->order = $options['feed_order'];
		}

		// Wire actions
		add_action( 'wp_ajax_start_ee', array( $this, 'start_editor' ) );
		add_action( 'wp_ajax_lp_append_post_update', array( $this, 'append_update' ) );
		add_action( 'wp_ajax_lp_change_post_update', array( $this, 'change_update' ) );

		add_action( 'wp_ajax_lp_append_post_draft', array( $this, 'append_draft' ) );
		add_action( 'wp_ajax_lp_change_post_draft', array( $this, 'change_draft' ) );

		add_action( 'wp_ajax_lp_delete_post_update', array( $this, 'delete_update' ) );
		add_action( 'before_delete_post', array( $this, 'delete_children' ) );
		add_action( 'pre_get_posts', array( $this, 'filter_children_from_query' ) );

		// Wire filters
		add_filter( 'parse_query', array( $this, 'hierarchical_posts_filter' ) );
		add_filter( 'the_content', array( $this, 'process_oembeds' ), - 10 );
		add_filter( 'the_content', array( $this, 'append_more_tag' ) );
		add_filter( 'the_content', array( $this, 'add_children_to_post' ) );

		if ( true === apply_filters( 'lp_use_lazy_load', true ) ) {

			add_action( 'wp', array( $this, 'lazy_load_updates' ) );
		}

		add_filter( 'lp_update_wrapper_css', array( __CLASS__, 'add_raw_class' ), 10, 2 );
	}

	/**
	 * Static method used to retrieve the current class instance.
	 *
	 * @static
	 *
	 * @return LivePress_PF_Updates
	 */
	public static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Posts cannot typically have parent-child relationships.
	 *
	 * Our updates, however, are all "owned" by a traditional
	 * post so we know how to lump things together on the front-end
	 * and in the post editor.
	 *
	 * @param WP_Query $query Current query.
	 *
	 * @return WP_Query
	 */
	public function hierarchical_posts_filter( $query ) {
		global $pagenow, $typenow;

		if ( is_admin() && 'edit.php' == $pagenow && in_array( $typenow, apply_filters( 'livepress_post_types', array( 'post' ) ) )
		) {
			$query->query_vars['post_parent'] = 0;
		}

		return $query;
	}

	/**
	 * If a post has children (live updates) automatically append a read more link.
	 * Also, automatically pad the post's content with the first update if content
	 * is empty.
	 *
	 * @param string $content Post content
	 *
	 * @return string
	 */
	public function append_more_tag( $content ) {
		global $post;

		if ( ! is_object( $post ) ) {
			return $content;
		}

		if ( ! in_the_loop() ) {
			return $content;
		}

		if ( apply_filters( 'livepress_the_content_filter_disabled', false ) ) {
			return $content;
		}

		if ( isset( $post->no_update_tag ) || is_single() || is_admin() || ( defined( 'XMLRPC_REQUEST' ) && constant( 'XMLRPC_REQUEST' ) ) ) {
			return $content;
		}

		// First, make sure the content is non-empty
		$content = $this->hide_empty_update( $content );

		$is_live = LivePress_Updater::instance()->blogging_tools->get_post_live_status( $post->ID );

		if ( $is_live ) {
			$more_link_text = esc_html__( '(see updates...)', 'livepress' );

			$pad = $this->pad_content( $post );
			$content .= '<div class="livepress-update lp-hl-on-hover lp-live ui-container">';

			$content .= apply_filters( 'livepress_pad_content', $pad, $post );
			$content .= apply_filters( 'the_content_more_link', ' <a href="' . get_permalink() . "#more-{$post->ID}\" class=\"more-link\">$more_link_text</a></div>", $more_link_text );
			$content = force_balance_tags( $content );

			// make sure the LP css is loaded
			wp_enqueue_style( 'livepress_main_sheets', LP_PLUGIN_URL . 'css/livepress.css', array(), LP_PLUGIN_SCRIPT_VERSION );
		}

		return $content;
	}

	/**
	 * Don't display unnecessarily empty LivePress HTML tags.
	 *
	 * @param string $content
	 *
	 * @return string
	 */
	protected function hide_empty_update( $content ) {
		if ( $this->is_empty( $content ) ) {
			$content = '';
		}

		return $content;
	}

	/**
	 * Adjust the_content filter removing all but a handful of whitelisted filters,
	 * preventing plugins from adding content to the live update stream
	 *
	 * @since 1.0.9
	 */
	private function clear_most_the_content_filters() {
		global $wp_filter;

		// do we have the_content and is not empty
		if ( isset( $wp_filter['the_content'] ) && empty( $wp_filter['the_content'] ) ) {

			return;
		}

		// is it an WP_Hook class
		if ( ! is_object( $wp_filter['the_content'] ) || 'WP_Hook' !== get_class( $wp_filter['the_content'] ) || ! isset( $wp_filter['the_content']->callbacks ) ) {

			return;
		}

		/**
		 * Filter to allow to override the White list of the filters we want to preserve.
		 *
		 * @since 1.3.5.2
		 *
		 * @param array $whitelisted_content_filters White list of the filters we want to preserve.
		 *
		 */
		$whitelisted_content_filters = apply_filters( 'livepress_whitelisted_content_filters',
			array(
				'process_oembeds',
				'run_shortcode',
				'autoembed',
				'wptexturize',
				'convert_smilies',
				'convert_chars',
				'wpautop',
				'shortcode_unautop',
				'capital_P_dangit',
				'do_shortcode',
				'add_children_to_post',
				'caption',
			)
		);

		// Iterate thru all existing the_content filters
		foreach ( $wp_filter['the_content'] as $filter_key => $filter_value ) {
			// Filters are in arrays by priority, so iterate thru each of those
			foreach ( $filter_value as $content_filter_key => $content_filter_value ) {
				$found_in_whitelist = false;
				// Loop thru the whitelisted filters to see if this filter should be unset
				foreach ( $whitelisted_content_filters as $white ) {
					if ( false !== strpos( $content_filter_key, $white ) ) {
						$found_in_whitelist = true;
						break;
					}
				}
				if ( ! $found_in_whitelist ) {
					remove_filter( 'the_content', $content_filter_key, $filter_key );
				}
			}
		}

		return;
	}

	public function lazy_load_updates() {
		global $post;

		if ( ! isset( $_REQUEST['action'] ) || 'lp_lazy_load' !== $_REQUEST['action'] ) {

			return;
		}
		$offset        = isset( $_REQUEST['offset'] ) ? absint( $_REQUEST['offset'] ) : 0;
		$top_update_id = isset( $_REQUEST['top_update_id'] ) ? absint( $_REQUEST['top_update_id'] ) : 0;
		$numberposts   = apply_filters( 'livepress_update_numberposts', 30 );
		$cache_key     = 'lp_lazy_update_' . $post->ID . '_' . $offset . '_' . $numberposts . '_' . $top_update_id;

		$lazy_update = wp_cache_get( $cache_key );

		if ( false === $lazy_update ) {
			// remove filter otherwise we loop
			remove_filter( 'the_content', array( $this, 'add_children_to_post' ) );

			$args = array(
				'numberposts'  => $numberposts,
				'offset'       => $offset,
				'lp_lazy_load' => true,
			);

			if ( 'bottom' === Pause_Updates::get_display_order( $post->ID ) ) {
				$args['order'] = 'ASC';
			}

			$this->assemble_pieces( $post, $args );
			$pin_header = LivePress_Updater::instance()->blogging_tools->is_post_header_enabled( $post->ID );
			if ( $pin_header ) {
				$pieces = array_reverse( $this->pieces );
			} else {
				$pieces = $this->pieces;
			}
			$response = array();
			foreach ( $pieces as $piece ) {

				$update_meta = $piece['meta'];
				if ( ! is_array( $update_meta ) || ! array_key_exists( 'draft', $update_meta ) || true !== $update_meta['draft'] ) {

					$html = str_replace( 'class="livepress-update', 'class="livepress-old-update', $piece['prefix'] );
					$html .= $piece['proceed'];
					$html .= $piece['suffix'];
					$response[] = array( $piece['id'], $html );
				}
			}

			$lazy_update['offset'] = $offset + $numberposts;

			$lazy_update['html'] = $response;

			wp_cache_set( $cache_key, $lazy_update, MINUTE_IN_SECONDS );
			$lazy_update['not_cached'] = true;
		}

		wp_send_json_success( $lazy_update );
	}


	/**
	 * Filter posts on the front end so that individual updates appear as separate elements.
	 *
	 * Filter automatically removes itself when called the first time.
	 *
	 * @param string $content Parent post content.
	 *
	 * @return string
	 */
	public function add_children_to_post( $content, $force = false ) {
		global $post;

		if ( apply_filters( 'livepress_the_content_filter_disabled', false ) ) {

			return $content;
		}

		// Only filter on single post pages
		if ( false === $force ) {
			if ( ! is_singular( apply_filters( 'livepress_post_types', array( 'post' ) ) ) ) {

				return $content;
			}
		}

		if ( ! LivePress_Updater::instance()->blogging_tools->get_post_live_status( get_the_ID() ) ) {

			return $content;
		}

		$this->assemble_pieces( $post );

		$response   = array();
		$do_json_ld = ( apply_filters( 'LP_do_json_ld', class_exists( 'Json_Ld' ) ) ) ? true : false;
		if ( $do_json_ld ) {
			$json_ld = Json_Ld::header();
		}
		$total_updates           = count( $this->pieces );
		$numberposts             = apply_filters( 'livepress_update_numberposts', $total_updates );
		$pin_header              = LivePress_Updater::instance()->blogging_tools->is_post_header_enabled( $post->ID );
		$number_of_posts_to_show = $numberposts;
		if ( $pin_header ) {
			$number_of_posts_to_show = $numberposts + 1;
		}

		foreach ( $this->pieces as $piece ) {
			if ( $do_json_ld ) {
				$update_meta = $piece['meta'];
				if ( ! is_array( $update_meta ) || ! array_key_exists( 'draft', $update_meta ) || true !== $update_meta['draft'] ) {

					$json_ld = Json_Ld::pass_update( $json_ld, $piece );
				}
			}

			$number_of_posts_to_show = $number_of_posts_to_show - 1;
			$update_meta             = $piece['meta'];
			if ( ! is_array( $update_meta ) || ! array_key_exists( 'draft', $update_meta ) || true !== $update_meta['draft'] ) {

				if ( 0 < $number_of_posts_to_show || true !== apply_filters( 'lp_use_lazy_load', true ) ) {
					$response[] = $piece['prefix'];
					$response[] = $piece['proceed'];
				} else {
					$response[] = str_replace( 'class="livepress-update', 'class="livepress-placeholder', $piece['prefix'] );
				}
				$response[] = $piece['suffix'];
			}
		}

		// Clear the original content if we have live updates
		if ( 0 !== count( $response ) ) {
			$content = '';
		}

		if ( $do_json_ld ) {
			$content .= Json_Ld::render_json_block( $json_ld );
		}

		$content .= join( '', $response );

		$classes = array();

		if ( 0 < $total_updates && $total_updates > $numberposts && true === apply_filters( 'lp_use_lazy_load', true ) ) {
			$classes = array( 'lp-lazy-loading' );
			$content .= sprintf( '<div id="lp-lazy-loading" data-total_posts="%d" data-offset="%d" data-parent="%d" data-top_update="%d" ><img src="%s" alt="%s" /></div>',
				absint( $total_updates ),
				absint( $numberposts - 1 ),
				absint( get_the_ID() ),
				( ! empty( $this->pieces ) ) ? absint( $this->pieces[0]['id'] ) : 0,
				esc_url( apply_filters( 'livepress-lazy-loading-image', LP_PLUGIN_URL . 'img/spin.gif' ) ),
				esc_attr__( apply_filters( 'livepress-lazy-loading-image', 'Loading…' ) )
			);
		}

		$content = LivePress_Updater::instance()->add_global_post_content_tag( $content, $this->post_modified_gmt, $this->livetags, $classes );

		return $content;
	}

	/**
	 * If the post's content is below a certain threshhold, pad it with updates until it's reasonable.
	 *
	 * @param WP_Post $post
	 *
	 * @return string
	 */
	public function pad_content( $post ) {
		// Temporarily unhook this filter
		remove_filter( 'the_content', array( $this, 'append_more_tag' ) );

		$extras = '';

		$content = trim( $post->post_content );
		$excerpt = trim( $post->post_excerpt );

		if ( $this->is_empty( $content ) && $this->is_empty( $excerpt ) ) {

			// Use transient cache to ensure child query only runs once/minute
			if ( false === ( $extras = get_transient( 'lp_first_child_extra_' . $post->ID ) ) ) {
				// We have no content to display. Grab the post's first update and return it instead.
				$children = get_children(
					array(
						'post_type'        => 'post',
						'post_parent'      => $post->ID,
						'numberposts'      => 1,
						'suppress_filters' => false,
					)
				);

				if ( count( $children ) > 0 ) {
					reset( $children );
					$child    = $children[ key( $children ) ];
					$piece_id = get_post_meta( $child->ID, '_livepress_update_id', true );

					$extras = apply_filters( 'the_content', $child->post_content );
				}
				set_transient( 'lp_first_child_extra_' . $post->ID, $extras, MINUTE_IN_SECONDS );
			}
		}

		// Re-add filters
		add_filter( 'the_content', array( $this, 'append_more_tag' ) );

		return $extras;
	}

	/**
	 * Don't show child posts on the front page of the site, they'll be pulled in separately as updates to a live post.
	 *
	 * @param WP_Query $query The current query
	 *
	 * @return WP_Query
	 */
	public function filter_children_from_query( WP_Query $query ) {

		$post_type = $query->get( 'post_type' );

		// only applies to indexes and post format
		if ( ( $query->is_home() || $query->is_archive() ) && ( empty( $post_type ) || in_array( $post_type, apply_filters( 'livepress_post_types', array( 'post' ) ) ) ) ) {
			$parent = $query->get( 'post_parent' );
			if ( empty( $parent ) ) {
				$query->set( 'post_parent', 0 );
			}
		}
	}

	/**
	 * Prepend a region identifier to a post update so we can check it later.
	 *
	 * @param int $post_ID
	 * @param WP_Post $post
	 */
	public function prepend_lp_comment( $post_ID, $post ) {
		if ( ! in_array( $post->post_type, apply_filters( 'livepress_post_types', array( 'post' ) ) ) ) {
			return;
		}

		// If the content already has the LivePress comment field, remove it and re-add it
		if ( 1 === preg_match( '/\<\!--livepress(.+)--\>/', $post->post_content ) ) {
			$post->post_content = preg_replace( '/\<\!--livepress(.+)--\>/', '', $post->post_content );
		}

		if ( '' === $post->post_content ) {
			return;
		}

		$md5 = md5( $post->post_content );

		$post->post_content = "<!--livepress md5={$md5} id={$post_ID}-->" . $post->post_content;

		// Remove the action before updating
		remove_action( 'wp_insert_post', array( $this, 'prepend_lp_comment' ) );
		wp_update_post( $post );
		add_action( 'wp_insert_post', array( $this, 'prepend_lp_comment' ), 10, 2 );
	}

	/*****************************************************************/
	/*                         AJAX Functions                        */
	/*****************************************************************/

	/**
	 * Enable the Real-Time Editor for LivePress.
	 *
	 * Fetch the content of the user's current textarea and return:
	 * - Original post content, split into regions with distinct IDs
	 * - Processed content, again split into regions
	 * - User's POSTed content, split into regions with same IDs as original post
	 * - Processed POSTed content, split into regions
	 */
	public function start_editor() {
		// Globalize $post so we can modify it a bit before using it
		global $post;

		// Set up the $post object
		$post_id             = absint( $_POST['post_id'] );
		$post                = get_post( $post_id );
		$post->no_update_tag = true;

		if ( 'true' === get_post_meta( $post_id, 'lp_content_is_raw', true ) ) {
			header( 'Content-type: application/javascript' );
			echo wp_json_encode(
				array( 'raw' => true,
					'html' => sprintf( '<div style="text-align: center"><h4>%1$s</h4><p>%2$s</p></div>',
						esc_html( __( 'Content editing disabled', 'livepress' ) ),
						esc_html( __( 'Edit and update on Slack.', 'livepress' ) )
					),
				)
			);
			die;
		}

		if ( isset( $_POST['content'] ) ) {
			$user_content = wp_kses_post( stripslashes( $_POST['content'] ) );
		} else {
			$user_content = '';
		}

		$this->assemble_pieces( $post );

		// If the post content is not empty, and there are no child posts, the post has
		// just been made live.  Insert the content as a live update

		if ( 0 == count( $this->pieces ) ) {
			if ( '' !== $user_content ) {
				// Add a live update with the current content
				if ( array_key_exists( 'update_meta', $_POST ) ) {
					$update_meta = $_POST['update_meta'];
				}
				$update_meta['draft'] = false; // TODO: set to match the post state

				$title         = get_the_title( $post_id );
				$update_header = ( ! empty( $title ) && 'Auto Draft' !== $title ) ? 'update_header="' . $title . '"' : '';

				$user      = wp_get_current_user();
				$user_text = ' authors="' . $user->display_name . '" ' . $update_header;

				$user_content = str_replace( 'authors=""', $user_text, $user_content );

				$admin_settings = new LivePress_Admin_Settings();
				$settings       = $admin_settings->get_settings();

				if ( in_array( 'AUTHOR', $settings->show ) ) {
					$avatar_html = $this->avatar_html( $post ) . '<div class="livepress-update-inner-wrapper';

					$user_content = str_replace( '<div class="livepress-update-outer-wrapper', $avatar_html, $user_content );
				}
				$this->add_update( $post, $user_content, '', $update_meta );

				$this->assemble_pieces( $post );
			}
		}

		$original = $this->pieces;

		if ( $post->post_content == $user_content ) {
			$user = null;
		} else {
			// Proceed user-supplied post content.
			$user = $this->pieces;
		}

		$ans = array(
			'orig'        => $original,
			'user'        => $user,
			'edit_uuid'   => $this->near_uuid,
			'editStartup' => Collaboration::return_live_edition_data(),
		);

		header( 'Content-type: application/javascript' );
		echo wp_json_encode( $ans );
		die;
	}

	/**
	 * Create the HTML for avatar.
	 * Only use for converting parent content into first update on make live
	 *
	 */
	private function avatar_html( $current_post ) {
		$user_id    = $current_post->post_author;
		$author_url = ( '' !== get_the_author_meta( 'user_url', $user_id ) ) ? get_the_author_meta( 'user_url', $user_id ) : get_author_posts_url( $user_id );

		/*
		 * filter documented in livepress-update.php ln 1170
		 */
		$html_order = apply_filters( 'lp_authors_html_order', '##id_html## ##avatar## ##author_name##', true );

		/*
		 * filter documented in livepress-update.php ln 1078
		 */
		$id_html    = str_replace( '##id##', absint( $user_id ), apply_filters( 'lp_authors_html_id_wrap', '<span class="lp-authorID">##id##</span>', true ) );
		$html_order = str_replace( '##id_html##', $id_html, $html_order );

		$author_avatar = sprintf( '<a href="%s" target="_blank">%s</a>', esc_url( $author_url ), get_avatar( $user_id ) );
		/*
		 * filter documented in livepress-update.php ln 1097
		 */
		$avatar_html = str_replace( '##avatar##', $author_avatar, apply_filters( 'lp_authors_html_avatar_wrap', '<span class="live-author-gravatar">##avatar##</span>', true ) );
		$html_order  = str_replace( '##avatar##', $avatar_html, $html_order );

		$author_link = sprintf( '<a href="%s" target="_blank">%s</a>', esc_url( $author_url ), esc_html( get_the_author_meta( 'display_name', $user_id ) ) );
		/*
		 * filter documented in livepress-update.php ln 1106
		 */
		$author_html = str_replace( '##avatar##', $author_link, apply_filters( 'lp_authors_html_name_wrap', '<span class="live-author-name">##name##</span>', true ) );
		$html_order  = str_replace( '##author_name##', $author_html, $html_order );

		$author_slug = esc_attr( get_the_author_meta( 'user_login', $user_id ) );
		/*
		 * filter documment in livepress-update.php ln 1115
		 */
		$wrap       = str_replace( '##slugg##', $author_slug, apply_filters( 'lp_author_html_wrap', '<span class="live-update-author live-update-author-##slugg##">##html##</span>', true ) );
		$html_order = str_replace( '##html##', $html_order, $wrap );
		/*
		 * filter documented in livepress-update.php ln 1115
		 */
		$html_order = str_replace( '##html##', $html_order, apply_filters( 'lp_authors_html_wrap', '<div class="live-update-authors">##html##</div>', true ) );

		return $html_order;
	}

	/**
	 * Insert a new child post to the current post via AJAX.
	 *
	 * @uses LivePress_PF_Updates::add_update
	 */
	public function append_update( $is_draft = false ) {
		global $post;
		check_ajax_referer( 'livepress-append_post_update-' . intval( $_POST['post_id'] ) );

		$post = get_post( intval( $_POST['post_id'] ) );

		// VIP: Disables shortcode reversal
		remove_filter( 'pre_kses', array( 'Filter_Embedded_HTML_Objects', 'filter' ), 11 );
		remove_filter( 'pre_kses', array( 'Filter_Embedded_HTML_Objects', 'maybe_create_links' ), 100 );

		$user_content = wp_kses_post( wp_unslash( trim( $_POST['content'] ) ) );
		// VIP: Re-enables shortcode reversal
		if ( class_exists( 'Filter_Embedded_HTML_Objects' ) ) {
			add_filter( 'pre_kses', array( 'Filter_Embedded_HTML_Objects', 'filter' ), 11 );
			add_filter( 'pre_kses', array( 'Filter_Embedded_HTML_Objects', 'maybe_create_links' ), 100 );
		}

		// grab and escape the live update tags
		$livetags = isset( $_POST['liveTags'] ) ? array_map( 'esc_attr', $_POST['liveTags'] ) : array();

		if ( array_key_exists( 'update_meta', $_POST ) ) {
			$update_meta = $_POST['update_meta'];
		}
		$update_meta['draft'] = ( $is_draft ) ? true : false;
		// $response = $this::add_update($post, $user_content);
		// PHP 5.2 compat static call
		$response = call_user_func_array( array( $this, 'add_update' ), array( $post, $user_content, $livetags, $update_meta ) );

		header( 'Content-type: application/javascript' );
		echo wp_json_encode( $response );
		die;
	}


	/**
	 * Insert a new child post to the current post via AJAX.
	 *
	 * @uses LivePress_PF_Updates::add_update
	 */
	public function append_draft() {
		$this->append_update( true );
	}

	/**
	 * Modify an existing update. Basically, replace the content of a child post with some other content.
	 *
	 * @uses wp_update_post() Uses the WordPress API to update post content.
	 */
	public function change_update( $is_draft = false ) {
		global $post;
		check_ajax_referer( 'livepress-change_post_update-' . intval( $_POST['post_id'] ) );

		$post = get_post( intval( $_POST['post_id'] ) );
		$update_id = intval( $_POST['update_id'] );
		$update    = $this->get_update_by_lp_update_id( $post->ID, $update_id );

		if ( array_key_exists( 'update_meta', $_POST ) ) {
			$update_meta = $_POST['update_meta'];
		}
		$update_meta['draft'] = $is_draft;

		// 	TODO: allow contrib / authors to save drafts controlled from options
		if ( ! current_user_can( 'edit_post', $post->ID ) ) {
			die;
		}

		$region = $this->perform_change_update( $post, $update, $update_meta, $_POST['content'] );

		header( 'Content-type: application/javascript' );
		echo wp_json_encode( $region );
		die;
	}

	/**
	 * Set update status to "draft"
	 */
	public function change_draft() {
		$this->change_update( true );
	}

	/**
	 * Removes an update from the database entirely.
	 */
	public function delete_update() {
		global $post;
		check_ajax_referer( 'livepress-delete_post_update-' . intval( $_POST['post_id'] ) );

		$post = get_post( intval( $_POST['post_id'] ) );

		if ( ! current_user_can( 'edit_post', $post->ID ) ) {
			die();
		}

		$update_id = intval( $_POST['update_id'] );
		$update    = $this->get_update_by_lp_update_id( $post->ID, $update_id );

		$region = $this->perform_delete_update( $post, $update );

		header( 'Content-type: application/javascript' );
		echo wp_json_encode( $region );
		die;
	}

	/*****************************************************************/
	/*                         Helper Functions                      */
	/*****************************************************************/

	/**
	 * Get an update to a post from the database.
	 *
	 * @access protected
	 *
	 * @param int $parent_id Parent post from which to retrieve an update.
	 * @param int $livepress_update_id ID of the update to retrieve.
	 *
	 * @return null|object Returns null if no matching post exists
	 */
	function get_update_by_client_provided_id( $parent_id, $client_provided_update_id ) {
		global $wpdb;

		$cache_key = 'get_update_by_client_provided_id-' . $parent_id . '-' . $client_provided_update_id;

		$posts = wp_cache_get( $cache_key );

		if ( false === $posts ) {
			$query = "
					SELECT $wpdb->posts.*
					FROM $wpdb->posts, $wpdb->postmeta
					WHERE $wpdb->posts.post_parent = $parent_id
					AND $wpdb->posts.ID = $wpdb->postmeta.post_id
					AND $wpdb->postmeta.meta_key = 'lp_client_provided_id'
					AND $wpdb->postmeta.meta_value = '$client_provided_update_id'
			";

			$posts = $wpdb->get_results( $query, OBJECT );
			wp_cache_set( $cache_key, $posts, MINUTE_IN_SECONDS );
		}

		return $posts[0];
	}


	/**
	 * Delete an update from an existing post.
	 *
	 * @param WP_Post $parent The object for the parent post containing the update to be deleted.
	 * @param int $update_id ID of the update to be deleted.
	 *
	 * @return int|WP_Error
	 *
	 * @uses wp_delete_post() Uses the WordPress API to delete the new child post.
	 */
	public function perform_delete_update( $parent, $update ) {
		if ( null === $update ) {
			$region = false;
		} else {
			list( $_, $piece_id, $piece_gen ) = explode( '__', $update->post_title, 3 );
			$piece_gen ++; // Deleted is new generation
			$update->post_title = 'livepress_update__' . $piece_id . '__' . $piece_gen;

			$response = wp_delete_post( $update->ID, true );

			$update_meta['draft'] = false;
			$region               = $this::send_to_livepress_incremental_post_update( 'delete', $parent, $update, $update_meta );

			/**
			 * Filter to allow you to disable clearing of the cache on each post delete.
			 *
			 * @since 1.3.4.4
			 *
			 * @param bool $state default true.
			 * @param object $post Post.
			 * @param object $update the current update.
			 */
			if ( apply_filters( 'LP_clear_cache_after_every_delete', true, $parent, $update ) ) {
				$this->delete_caches( $parent, $piece_id );
			}
		}

		return $region;
	}

	/**
	 * Change an existing update.
	 *
	 * @param WP_Post $post The object for the post containing the update to be deleted.
	 * @param int $update_id ID of the update to be deleted.
	 * @param array $update_meta The update meta
	 * @param string $content Content of the update
	 *
	 * @return int|WP_Error
	 *
	 * @uses wp_update_post() Uses the WordPress API to update the child post.
	 */
	public function perform_change_update( $post, $update, $update_meta, $content, $do_sanitization = true  ) {
		$region    = false;

		// set the custom timestamp to current publish date with the site time offset
		$lp_updater = new LivePress_Updater();

		$timezone_string = get_option( 'timezone_string' );
		$timezone_string = ( '' !== $timezone_string ) ? $timezone_string : 'Europe/London';
		$date            = new DateTime( $update->post_date, new DateTimeZone( $timezone_string ) );
		$lp_updater->set_custom_timestamp( $date->format( 'c' ) );

		if ( null == $update ) {
			// Todo: notify about error: post was deleted by another editor
			$region = false;
		} else {
			$user_content = stripslashes( stripslashes( $content ) );

			if ( $do_sanitization ) {
				// VIP: Disables shortcode reversal
				remove_filter( 'pre_kses', array( 'Filter_Embedded_HTML_Objects', 'filter' ), 11 );
				remove_filter( 'pre_kses', array( 'Filter_Embedded_HTML_Objects', 'maybe_create_links' ), 100 );

				//	need to double unslash here to normalize content
				$user_content = wp_kses_post( $user_content );

				// VIP: Re-enables shortcode reversal
				if ( class_exists( 'Filter_Embedded_HTML_Objects' ) ) {
					add_filter( 'pre_kses', array( 'Filter_Embedded_HTML_Objects', 'filter' ), 11 );
					add_filter( 'pre_kses', array( 'Filter_Embedded_HTML_Objects', 'maybe_create_links' ), 100 );
				}
			}

			if ( empty( $user_content ) ) {
				$region = false;
			} else {
				// Save updated post content to DB
				list( $_, $piece_id, $piece_gen ) = explode( '__', $update->post_title, 3 );
				$piece_gen ++;
				$update->post_title   = 'livepress_update__' . $piece_id . '__' . $piece_gen;
				$update->post_content = $user_content;

				kses_remove_filters();

				wp_update_post( $update );
				$region = $this::send_to_livepress_incremental_post_update( 'replace', $post, $update, $update_meta );

				kses_init_filters();

				/**
				 * Filter to allow you to disable clearing of the cache on each post update and change.
				 *
				 * @since 1.3.4.4
				 *
				 * @param bool $state default true.
				 * @param object $post Post.
				 * @param object $update the current update.
				 * @param array $update_meta the update meta
				 */
				if ( apply_filters( 'LP_clear_cache_after_every_update', true, $post, $update, $update_meta ) ) {
					$this->delete_caches( $post, $piece_id );
				}
			}
		}

		return $region;
	}


	/**
	 * Add an update to an existing post.
	 *
	 * @param int|WP_Post $parent Either the ID or object for the post which you are updating.
	 * @param string $content Post content.
	 * @param             string @livetags Live update tags for this update.
	 *
	 * @return int|WP_Error
	 *
	 * @uses wp_insert_post() Uses the WordPress API to create a new child post.
	 */
	public function add_update( $parent, $content, $livetags, $update_meta = array() ) {

		global $current_user, $post;
		wp_get_current_user();

		if ( ! is_object( $parent ) ) {
			$parent = get_post( $parent );
		}
		$save_post = $post;
		$post      = $parent;

		if ( empty( $content ) ) {
			$response = false;
		} else {
			$meta_order = get_post_meta( $parent->ID, 'livepress_feed_order', true );
			if ( false === $meta_order || empty( $meta_order ) ) {
				$plugin_options = get_option( LivePress_Administration::$options_name );
				$meta_order     = $plugin_options['feed_order'];
			}
			$meta_order = apply_filters( 'livepress_feed_order', $meta_order, $parent );
			if ( 'top' === $meta_order ) {
				$append = 'prepend';
			} else {
				$append = 'append';
			}

			$piece_id  = $post->ID  . strtotime( 'now' );
			$piece_gen = 0;
			$update    = wp_insert_post(
				array(
					'post_author'  => $current_user->ID,
					'post_content' => $content,
					'post_parent'  => $post->ID,
					'post_title'   => 'livepress_update__' . $piece_id . '__' . $piece_gen,
					'post_name'    => 'livepress_update__' . $piece_id,
					'post_type'    => 'post',
					'post_status'  => 'inherit',
				),
				true
			);

			if ( is_wp_error( $update ) ) {
				$response = false;
			} else {
				set_post_format( $update, 'aside' );
				// Associate any livetags with this update
				if ( ! empty( $livetags ) ) {
					wp_add_object_terms( $update, $livetags, 'livetags' );
				}
				$response = $this::send_to_livepress_incremental_post_update( $append, $post, $update, $update_meta );

				/**
				 * Filter to allow you disable clearing the cache on ech post update and change.
				 *
				 * @since 1.3.4.4
				 *
				 * @param bool $state default true.
				 * @param object $post Post.
				 * @param object $update the current update.
				 * @param array $update_meta the update meta
				 */
				if ( apply_filters( 'LP_clear_cache_after_every_add', false, $post, $update, $update_meta ) ) {
					$this->delete_caches( $post, $piece_id );
				}
			}
		}

		$post = $save_post;

		return $response;
	}

	/**
	 * Clear all cache for post data
	 *
	 * @param $post
	 * @param $piece_id
	 */
	public function delete_caches( $post, $piece_id ) {

		// the global post cache
		clean_post_cache( $post );

		// clear the lp_get_single_update cache
		$cache_id = 'lp_get_post_cache_key_' . LP_PLUGIN_VERSION . '_' . $piece_id;
		delete_transient( $cache_id );
	}


	/**
	 * Merge nested child posts into a parent post.
	 *
	 * @param  int $post_id ID of the parent post
	 *
	 * @return $post post object
	 */
	public function merge_children( $post_id ) {
		global $post;

		$post_id = (int) $post_id; // Force a cast as an integer.

		$post = get_post( $post_id );

		// If post has no children bail
		if ( 0 == count( get_children(
			array(
					'post_type'        => 'post',
					'post_parent'      => $post_id,
					'numberposts'      => 1,
					'suppress_filters' => false,
		) ) )
		) {
			return $post;
		}

		// Sanity check: only merge children of top-level posts.
		if ( 0 !== $post->post_parent ) {
			return $post;
		}
		remove_filter( 'parse_query', array( $this, 'hierarchical_posts_filter' ) );

		$post_content = $post->post_content;

		// Remove all the_content filters for merge
		global $wp_filter;
		$stored_wp_filter_the_content = $wp_filter['the_content'];
		unset( $wp_filter['the_content'] );
		// Assemble all the children for merging
		$this->assemble_pieces( $post );
		// Restore the_content filters
		$wp_filter['the_content'] = $stored_wp_filter_the_content;

		// we want to render the HTML that the 'livepress_metainfo' shortcode will output into the Post content inorder fix the post
		global $shortcode_tags; // all the shortcode
		$golbal_shortcodes_tags = $shortcode_tags; // save so re-added them
		remove_all_shortcodes();
		$shortcode_tags['livepress_metainfo'] = $golbal_shortcodes_tags['livepress_metainfo']; // just back the shortcode need

		$response = array();
		// Wrap each child for display
		foreach ( $this->pieces as $piece ) {
			// skip if draft
			// this content will only have the current author's draft but we need to skip that
			$update_meta = $piece['meta'];
			if (
				false !== $update_meta &&
				is_array( $update_meta ) &&
				array_key_exists( 'draft', $update_meta ) &&
				true == $update_meta['draft']
			) {
				continue;
			}

			$prefix     = sprintf( '<div id="livepress-old-update-%s" class="livepress-old-update lp-live">', $piece['id'] );
			$response[] = $prefix;
			$response[] = do_shortcode( $piece['proceed'] );
			$response[] = '</div>';
		}

		$shortcode_tags = $golbal_shortcodes_tags; // reset the short codes

		// Append the children to the parent post content
		$post->post_content = join( '', $response );

		// Update the post
		wp_update_post( $post );

		// Delete the merged children
		$this->delete_children( $post_id );

		add_filter( 'parse_query', array( $this, 'hierarchical_posts_filter' ) );

		return $post;
	}

	/**
	 * Remove nested child posts when a parent is removed.
	 *
	 * @param int $parent ID of the parent post being deleted
	 */
	public function delete_children( $parent ) {

		// Remove the query filter.
		remove_filter( 'parse_query', array( $this, 'hierarchical_posts_filter' ) );

		$parent = (int) $parent; // Force a cast as an integer.

		$post = get_post( $parent );
		// Only delete children of top-level posts.
		if ( 0 !== $post->post_parent ) {
			return;
		}

		// Get all children
		$children = get_children(
			array(
				'post_type'        => 'post',
				'post_parent'      => $parent,
				'suppress_filters' => false,
			)
		);

		// Remove the action so it doesn't fire again
		remove_action( 'before_delete_post', array( $this, 'delete_children' ) );

		foreach ( $children as $child ) {
			// Never delete top level posts!
			if ( 0 === (int) $child->post_parent ) {
				continue;
			}
			// Note: before_delete_post filter will also fire remove_related_followers which will call
			// the LivePress server API clear_guest_blogger
			wp_delete_post( $child->ID, true );
		}
		add_action( 'before_delete_post', array( $this, 'delete_children' ) );
		add_filter( 'parse_query', array( $this, 'hierarchical_posts_filter' ) );

	}

	/**
	 * Get the full content of a given parent post.
	 *
	 * @param object $parent
	 *
	 * @return string
	 */
	public function get_content( $parent ) {

		$this->assemble_pieces( $parent );

		$pieces = array();
		foreach ( $this->pieces as $piece ) {
			$pieces[] = $piece['content'];
		}

		return join( '', $pieces );
	}

	/**
	 * Send an update (add/change/delete) to LivePress' API
	 *
	 * @param string $op Operation (append/prepend/replace/delete)
	 * @param WP_Post $post Parent post object
	 * @param WP_Post $update Update piece object
	 *
	 * @return array[] $region Object to send to editor
	 */
	protected function send_to_livepress_incremental_post_update( $op, $post, $update, $update_meta ) {
		if ( ! is_object( $post ) ) {
			$post = get_post( $post );
		}
		if ( ! is_object( $update ) ) {
			$update = get_post( $update );
		}

		// FIXME: may be better use $update->post_author there ?
		$user = wp_get_current_user();
		if ( $user->ID ) {
			if ( empty( $user->display_name ) ) {
				$update_author = addslashes( $user->user_login );
			}
			$update_author = addslashes( $user->display_name );
		} else {
			$update_author = '';
		}

		list( $_, $piece_id, $piece_gen ) = explode( '__', $update->post_title, 3 );

		$livepress_update_css_classes = apply_filters( 'lp_update_wrapper_css', 'livepress-update lp-live', $update, $update_meta, $post, $piece_id );

		global $wp_filter;
		// Remove all the_content filters so child posts are not filtered
		// removing share, vote and other per-post items from the live update stream.
		// Store the filters first for later restoration so filters still fire outside the update stream
		if ( isset( $wp_filter['the_content'] ) ) {
			if ( is_object( $wp_filter['the_content'] ) ) {
				$stored_wp_filter_the_content = clone $wp_filter['the_content'];
			} else {
				$stored_wp_filter_the_content = $wp_filter['the_content'];
			}
		}
		$this->clear_most_the_content_filters();


		$region = array(
			'id'      => $piece_id,
			'lpg'     => $piece_gen,
			'op'      => $op,
			'content' => $update->post_content,
			'proceed' => apply_filters( 'LP_update_content_pushed', do_shortcode( str_replace( '</span></p>', '</span>', apply_filters( 'the_content', $update->post_content ) ) ), $piece_id ),
			'prefix'  => sprintf(
				'<div id="livepress-update-%d" data-lpg="%d"%s class="%s">',
				$piece_id,
				$piece_gen,
				$this->get_client_provided_id_attr( $this->client_provided_update_id ),
				$livepress_update_css_classes
			),
			'suffix'  => '</div>',
		);

		if ( isset( $stored_wp_filter_the_content ) ) {
			// Restore the_content filters and carry on
			$wp_filter['the_content'] = $stored_wp_filter_the_content;
		}
		$message = array(
			'op'          => $op,
			'post_id'     => $post->ID,
			'post_title'  => $post->post_title,
			'post_link'   => get_permalink( $post->ID ),
			'post_author' => $update_author,
			'update_id'   => 'livepress-update-' . $piece_id,
			// todo: get updated from post update?
			'updated_at'  => get_gmt_from_date( current_time( 'mysql' ) ) . 'Z',
			'uuid'        => $piece_id . ':' . $piece_gen,
			'edit'        => wp_json_encode( $region ),
		);

		if ( $op == 'replace' ) {
			$message['new_data'] = $region['prefix'] . $region['proceed'] . $region['suffix'];
		} elseif ( $op == 'delete' ) {
			$region['content'] = ''; // remove content from update for delete
			$region['proceed'] = '';
		} else {
			$message['data'] = $region['prefix'] . $region['proceed'] . $region['suffix'];
		}

		if ( ! isset( $update_meta['draft'] ) || true !== $update_meta['draft'] ) {
			try {
				$job_uuid = $this->lp_comm->send_to_livepress_incremental_post_update( $op, $message );
				LivePress_WP_Utils::save_on_post( $post->ID, 'status_uuid', $job_uuid );
			} catch ( livepress_communication_exception $e ) {
				$e->log( 'incremental post update' );
			}
		}

		// Set the parent post as having been updated
		$region['status'] = array( 'last_post' => $piece_id . ':' . $piece_gen, 'automatic' => 1, 'live' => 1 );
		update_post_meta( $post->ID, '_livepress_live_status', $region['status'] );

		// add meta to the child update
		update_post_meta( $update->ID, '_livepress_update_meta', $update_meta );
		$region['update_meta'] = $update_meta;

		return $region;
	}

	private function get_client_provided_id_attr( $client_provided_update_id ) {
		$client_provided_id_attr = '';
		if ( isset( $client_provided_update_id ) ) {
			$client_provided_id_attr = sprintf( ' data-lp-client-provided-id="%s"', $client_provided_update_id );
		}
		return $client_provided_id_attr;
	}

	/**
	 * Cache pieces, so info get populated, but next call will not reevaluate
	 *
	 * @param object $parent Parent post for which we're assembling pieces
	 */
	function cache_pieces( $parent ) {
		$this->assemble_pieces( $parent );
	}

	/**
	 * Populate the pieces array based on a given parent post.
	 *
	 * @param object $parent Parent post for which we're assembling pieces
	 * @param array $function_args
	 */
	protected function assemble_pieces( $parent, $function_args = [] ) {
		global $wp_filter;

		if ( ! is_object( $parent ) ) {
			$parent = get_post( $parent );
		}

		$defaults = array(
			'numberposts'  => 100,
			'offset'       => 0,
			'cache'        => false,
			'lp_lazy_load' => false,
			'order'        => 'DESC',
		);

		$args = wp_parse_args( $function_args, $defaults );

		if ( true === $args['cache'] ) {
			$this->cache = $parent->ID;
		} elseif ( $this->cache == $parent->ID ) {

			return;
		}
		// Remove all the_content filters so child posts are not filtered
		// removing share, vote and other per-post items from the live update stream.
		// Store the filters first for later restoration so filters still fire outside the update stream
		if ( isset( $wp_filter['the_content'] ) ) {
			if ( is_object( $wp_filter['the_content'] ) ) {
				$stored_wp_filter_the_content = clone $wp_filter['the_content'];
			} else {
				$stored_wp_filter_the_content = $wp_filter['the_content'];
			}
		}
		$this->clear_most_the_content_filters();

		$this->post_modified_gmt = $parent->post_modified_gmt;
		$this->near_uuid         = '';
		$min_uuid_ts             = 2 * 60; // not earlier, than 2 minutes
		$near_uuid_ts            = 0;
		$now                     = new DateTime();

		$pieces = array();

		// Set up child posts
		remove_filter( 'the_content', array( $this, 'add_children_to_post' ) );
		$posts             = new WP_Query(
			array(
				'post_type'        => 'post',
				'post_status'      => 'any',
				'post_parent'      => $parent->ID,
				'suppress_filters' => false,
				'posts_per_page'   => $args['numberposts'],
				'offset'           => $args['offset'],
				'order'            => $args['order'],
			)
		);
		$total_child_count = $posts->found_posts;
		$children          = $posts->posts;

		$child_pieces = array();
		$live_tags    = array();
		$update_count = 0;
		$user_id      = get_current_user_id();
		// Upto 100 updates are fetched from the DB each loop 200 loops for a maximum of updates 200,00
		$safety_count = apply_filters( 'LP_get_children_safety_count', 200 );
		while ( count( $child_pieces ) < $total_child_count ) {

			// let make sure don't loop for ever
			if( 0 >= $safety_count ){

				break;
			}
			$safety_count--;

			foreach ( $children as $child ) {

				$update_meta = get_post_meta( $child->ID, '_livepress_update_meta', true );
				$client_provided_id = get_post_meta( $child->ID, 'lp_client_provided_id', true );
				$is_draft    = (
					false !== $update_meta &&
					is_array( $update_meta ) &&
					array_key_exists( 'draft', $update_meta ) &&
					true == $update_meta['draft']
				) ? true : false;

				// if this is a draft only include the current authors posts
				if ( $is_draft && absint( $child->post_author ) !== $user_id ) {
					$total_child_count--;
					continue;
				}

				$update_count ++;
				$post = $child;
				list( $_t, $piece_id, $piece_gen ) = explode( '__', $child->post_title, 3 );
				$this->post_modified_gmt = max( $this->post_modified_gmt, $child->post_modified_gmt );

				$modified = new DateTime( $child->post_modified_gmt, new DateTimeZone( 'UTC' ) );
				$since    = $now->format( 'U' ) - $modified->format( 'U' );
				if ( $since > $min_uuid_ts && ( $since < $near_uuid_ts || 0 === $near_uuid_ts ) ) {
					$near_uuid_ts    = $since;
					$this->near_uuid = $piece_id . ':' . $piece_gen;
				}

				// Grab and integrate any live update tags
				$update_tags        = get_the_terms( $child->ID, 'livetags' );
				$update_tag_classes = ( $is_draft ) ? ' livepress-draft ' : '';
				if ( ! empty( $update_tags ) ) {
					foreach ( $update_tags as $a_tag ) {
						$live_tag_name = $a_tag->name;
						$update_tag_classes .= ' live-update-livetag-' . sanitize_title_with_dashes( $live_tag_name );
						if ( ! in_array( $live_tag_name, $live_tags ) ) {
							array_push( $live_tags, $live_tag_name );
						}
					}
					$update_tag_classes .= ' livepress-has-tags ';
				}

				$update_tag_classes = apply_filters( 'lp_update_wrapper_css', $update_tag_classes, $child, $update_meta, $parent, $piece_id );

				$pin_header = LivePress_Updater::instance()->blogging_tools->is_post_header_enabled( $parent->ID );

				$piece      = array(
					'id'      => $piece_id,
					'lpg'     => $piece_gen,
					'content' => $child->post_content,
					'proceed' => do_shortcode( str_replace( '</span></p>', '</span>', apply_filters( 'the_content', $child->post_content ) ) ),
					'prefix'  => sprintf(
						'<div id="livepress-update-%s" data-lpg="%d"%s class="livepress-update%s %s">',
						$piece_id,
						$piece_gen,
						$this->get_client_provided_id_attr( $client_provided_id ),
						$update_tag_classes,
					( 0 === $args['offset'] && $total_child_count === $update_count && $pin_header ) ? 'pinned-first-live-update' : '' ),
					'suffix'  => '</div>',
					'meta'    => $update_meta,
				);

				$child_pieces[] = $piece;
			}

			if ( true === $args['lp_lazy_load'] ) {

				break;
			}

			$args['offset'] = $args['offset'] + $args['numberposts'];
			$posts          = new WP_Query(
				array(
					'post_type'        => 'post',
					'post_status'      => 'any',
					'post_parent'      => $parent->ID,
					'suppress_filters' => false,
					'posts_per_page'   => $args['numberposts'],
					'offset'           => $args['offset'],
				)
			);
			$children       = $posts->posts;
		}
		add_filter( 'the_content', array( $this, 'add_children_to_post' ) );

		// Display posts oldest-newest by default
		$child_pieces = array_reverse( $child_pieces );
		$pieces       = array_merge( $pieces, $child_pieces );
		if ( 0 !== count( $pieces ) ) {
			// check for a order set in meta
			$meta_order = get_post_meta( $parent->ID, 'livepress_feed_order', true );
			if ( false === $meta_order || empty( $meta_order ) ) {
				$meta_order = $this->order;
			}
			$meta_order = apply_filters( 'livepress_feed_order', $meta_order, $parent );
			if ( 'top' === $meta_order || is_admin() ) {
				// If the header is pinned and the order reversed, ensure the first post remains first
				$pin_header = LivePress_Updater::instance()->blogging_tools->is_post_header_enabled( $parent->ID );
				if ( $pin_header ) {
					$first  = array_shift( $pieces );
					$pieces = array_reverse( $pieces );
					array_unshift( $pieces, $first );
				} else {
					$pieces = array_reverse( $pieces );
				}
			}
		}
		$this->pieces   = $pieces;
		$this->livetags = $live_tags;

		if ( isset( $stored_wp_filter_the_content ) ) {
			// Restore the_content filters and carry on
			$wp_filter['the_content'] = $stored_wp_filter_the_content;
		}
	}

	public function process_oembeds( $content ) {
		return preg_replace( '&((?:<!--livepress.*?-->|\[livepress[^]]*\])\s*)(https?://[^\s"]+)&', '$1[embed]$2[/embed]', $content );
	}

	/**
	 * Check if a post update is empty (blank or only an HTML comment).
	 *
	 * @access protected
	 *
	 * @param string $post_content
	 *
	 * @return boolean
	 */
	protected function is_empty( $post_content ) {
		$empty_tag_position = strpos( $post_content, '<!--livepress md5=d41d8cd98f00b204e9800998ecf8427e' );

		return empty( $post_content ) || false !== $empty_tag_position || ( is_int( $empty_tag_position ) && $empty_tag_position >= 0 );
	}

	/**
	 * Check if an update is new or if it has been previously saved
	 *
	 * @access protected
	 *
	 * @param int $post_id
	 *
	 * @return boolean true if post has just been created.
	 */
	protected function is_new( $post_id ) {
		$options = array(
			'post_parent'      => $post_id,
			'post_type'        => 'revision',
			'numberposts'      => 2,
			'post_status'      => 'any',
			'suppress_filters' => false,
		);

		$updates = get_children( $options );
		if ( count( $updates ) == 0 ) {
			return true;
		} elseif ( count( $updates ) >= 2 ) {
			$first = array_shift( $updates );
			$last  = array_pop( $updates );

			return $last->post_modified_gmt == $first->post_modified_gmt;
		} else {
			return true;
		}
	}

	/**
	 * Get an update to a post from the database.
	 *
	 * @access protected
	 *
	 * @param int $parent_id Parent post from which to retrieve an update.
	 * @param int $livepress_update_id ID of the update to retrieve.
	 *
	 * @return null|object Returns null if a post doesn't exist.
	 */
	public function get_update_by_lp_update_id( $parent_id, $livepress_update_id ) {
		global $wpdb;

		$query = $wpdb->prepare( '
			SELECT      *
			FROM        ' . $wpdb->posts . '
			WHERE       post_name   = %s
			AND         post_type   = "post"
			AND         post_parent = %s
			LIMIT 1',
			'livepress_update__' . $livepress_update_id,
			$parent_id
		);
		$wpdb->get_results( $query );

		if ( 0 === $wpdb->num_rows ) {
			return null;
		}

		return $wpdb->last_result[0];
	}

	/**
	 * add the raw class to out wapper
	 *
	 * @static
	 *
	 * @param $classes
	 *
	 * @return string
	 */
	public static function add_raw_class( $classes, $update = null ) {

		if ( null !== $update && 0 < stripos( $update->post_content, 'lp-simul-raw' ) ) {

			return $classes . ' livepress-update-raw';
		}

		return $classes;
	}
}

LivePress_PF_Updates::get_instance();
