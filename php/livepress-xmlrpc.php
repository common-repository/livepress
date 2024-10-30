<?php

/*
 * Livepress extender to XMLRPC protocol.
 * This class initizalises only for XMLRPC requests
 *
 */


class LivePress_XMLRPC {

	/**
	 * Instance.
	 *
	 * @static
	 * @access private
	 *
	 * @var LivePress_XMLRPC
	 */
	static private $lp_xmlrpc = null;

	/**
	 * Instance.
	 *
	 * @static
	 */
	static function initialize() {
		if ( null === self::$lp_xmlrpc ) {
			self::$lp_xmlrpc = new LivePress_XMLRPC();
		}
	}

	/**
	 * Constructor.
	 *
	 * @access private
	 */
	private function __construct() {
		add_filter( 'xmlrpc_methods', array( $this, 'add_livepress_functions_to_xmlrpc' ) );
		add_filter( 'pre_option_enable_xmlrpc', array( $this, 'livepress_enable_xmlrpc' ), 0, 1 );
		add_filter( 'wp_insert_post_data', array( __CLASS__, 'insert_post_data' ), 10, 2 );
		add_filter( 'xmlrpc_wp_insert_post_data', array( __CLASS__, 'insert_post_data' ), 10, 2 );
	}

	/**
	 * Scrape hooks.
	 *
	 * @static
	 */
	public static function scrape_hooks() {
		add_filter( 'comment_flood_filter', '__return_false' );
		add_filter( 'xmlrpc_allow_anonymous_comments', '__return_true' );
	}

	/**
	 * Add LivePress XML-RPC methods.
	 *
	 * @param array $methods XML-RPC methods.
	 *
	 * @return array Filtered array of XML-RPC methods.
	 */
	function add_livepress_functions_to_xmlrpc( $methods ) {
		// unfortunatelly, it seems passed function names must relate to global ones
		$methods['livepress.appendToPost']      = 'livepress_append_to_post';
		$methods['livepress.appendToPostRaw']   = 'livepress_append_to_post_raw';
		$methods['livepress.changeRawUpdate']   = 'livepress_change_raw_update';
		$methods['livepress.deleteRawUpdate']   = 'livepress_delete_raw_update';
		$methods['livepress.editRawUpdate']     = 'livepress_edit_raw_update';
		$methods['livepress.setPostLiveStatus'] = 'livepress_set_post_live_status';
		$methods['livepress.newPost']           = 'livepress_create_new_post';
		$methods['livepress.newLivePost']       = 'livepress_new_live_post';
		$methods['livepress.getPost']           = 'livepress_get_post';
		$methods['livepress.getRecentPosts']    = 'livepress_get_recent_posts';
		$methods['livepress.newComment']        = 'livepress_new_comment';
		$methods['livepress.uploadFile']        = 'livepress_upload_file';

		return $methods;
	}


	var $livepress_authenticated = false;
	var $livepress_auth_called = false;

	/**
	 * When xml-rpc server active, short-circuit enable_xmlrpc option
	 * and apply original later.
	 *
	 * @param bool $v
	 *
	 * @return bool
	 */
	function livepress_enable_xmlrpc( $v ) {
		$val = ! ( $this->livepress_auth_called || $this->livepress_authenticated );

		return $val || (bool) $v;
	}

	/**
	 * Short circut the update mechanism.
	 *
	 * Logic branches
	 * - If this is a new post, do nothing.
	 * - If this is a change to an existing post, do nothing.
	 * - If this is an addition to an existing post, remove the addition and store it as
	 *   a LivePress update instead.
	 *
	 * @param array $post_data
	 * @param array $content_struct
	 *
	 * @return array
	 */
	public static function insert_post_data( $post_data, $content_struct ) {
		// Only fire on XML-RPC requests
		if ( ! defined( 'XMLRPC_REQUEST' ) || false == XMLRPC_REQUEST || ( defined( 'LP_FILTERED' ) && true == LP_FILTERED ) ) {
			return $post_data;
		}

		define( 'LP_FILTERED', true );

		$defaults = array(
			'post_status'   => 'draft',
			'post_type'     => 'post',
			'post_author'   => 0,
			'post_password' => '',
			'post_excerpt'  => '',
			'post_content'  => '',
			'post_title'    => '',
		);

		$unparsed_data = wp_parse_args( $content_struct, $defaults );

		// If this isn't an update, exit early so we don't walk all over ourselves.
		if ( empty( $unparsed_data['ID'] ) ) {
			return $post_data;
		}

		// Get the post we're updating so we can compare the new content with the old content.
		$post_id = $unparsed_data['ID'];
		$post    = get_post( $post_id );

		$live_posts = get_option( 'livepress_live_posts', array() );
		$is_live    = in_array( $post_id, $live_posts );

		if ( ! $is_live ) {

			return $post_data;
		}

		$original_posts = self::get_existing_updates( $post );
		$new_posts      = self::parse_updates( $unparsed_data['post_content'] );

		// First, add the new update if there is one
		if ( isset( $new_posts['new'] ) ) {
			if ( 1 === count( $new_posts ) ) {
				// Todo: If the only post sent up is "new" create a diff against the existing post so we can process the update.
				$clean_content               = preg_replace( '/\<\!--livepress(.+)--\>/', '', $post->post_content );
				$new_posts['new']['content'] = str_replace( $clean_content, '', $new_posts['new']['content'] );
			}

			$live_update = LivePress_Live_Update::instance();

			$options = $live_update->options;

			// Add timestamp to update - this is optional on the editor, but
			// we're adding it here and can be customized later on in case
			// it is requested:
			$new_posts['new']['content'] = str_replace( '[livepress_metainfo', '[livepress_metainfo show_timestmp="1"', $new_posts['new']['content'] );

			// get the author to pass to avatar function
			preg_match( '/authors="(.*)"/s', $new_posts['new']['content'], $author );

			$avatar_class = ( in_array( 'AVATAR', $options['show'] ) ) ? 'lp_avatar_shown' : 'lp_avatar_hidden';
			$avatar_class = 'lp_avatar_hidden'; // TODO: until we have the avatar code working

			// default is the inline version
			if ( 'default' === $options['update_format'] ) {

				if ( 'lp_avatar_shown' == $avatar_class ) {
					$new_posts['new']['content'] = self::avatar_html( $author[1] ) . $new_posts['new']['content'];
				}

				$new_posts['new']['content'] = $new_posts['new']['content'] . PHP_EOL . ' [/livepress_metainfo]' . PHP_EOL;

				if ( false === strpos( $new_posts['new']['content'], 'livepress-update-outer-wrapper' )  ) {
					$new_posts['new']['content'] = '<div class="livepress-update-outer-wrapper ' . $avatar_class . '">' . PHP_EOL . PHP_EOL . $new_posts['new']['content'] . PHP_EOL . PHP_EOL . '<\/div>';
				}
			} else {

				$bits        = explode( ']', $new_posts['new']['content'] );
				$content_bit = ( isset( $bits[1] ) ) ? $bits[1] : $bits[0];

				if ( false === strpos( $new_posts['new']['content'], 'livepress-update-inner-wrapper' ) ) {
					$new_posts['new']['content'] = '<div class="livepress-update-inner-wrapper ' . $avatar_class . '">' . PHP_EOL . PHP_EOL . $content_bit . PHP_EOL . PHP_EOL . '<\/div>';
				}

				if ( 'lp_avatar_shown' == $avatar_class ) {
					$new_posts['new']['content'] = self::avatar_html( $author[1] ) . $new_posts['new']['content'];
				}

				$new_posts['new']['content'] = $bits[0] . ']' . $new_posts['new']['content'];
			}

			$new_posts['new']['content'] = $live_update->fill_livepress_shortcodes( $new_posts['new']['content'] );
			$update_id                   = LivePress_PF_Updates::get_instance()->add_update( $post, $new_posts['new']['content'], array() );

			// Remove the new post from the array so we don't double-process by mistake.
			unset( $new_posts['new'] );
		}

		// Second, update the content of any posts that have been changed.
		// You cannot *delete* an update via XMLRPC.  For that, you need to actually use the WordPress UI.
		foreach ( $original_posts as $original_id => $original_post ) {
			// Skip the parent post
			if ( $post_id === $original_id ) {
				continue;
			}

			// Skip if no changes were passed in for this post
			if ( ! isset( $new_posts[ $original_id ] ) ) {
				continue;
			}

			$updated = $new_posts[ $original_id ];

			// Do we actually need to do an update?
			$md5 = md5( $updated['content'] );
			if ( $updated['md5'] === $md5 ) {
				continue;
			}

			$original_post['post_content'] = $updated['content'];

			wp_update_post( $original_post );
		}

		// Update post data for the parent post.
		if ( isset( $new_posts[ $post_id ] ) ) {
			$post_data['post_content'] = $new_posts[ $post_id ]['content'];
		} else {
			$post_data['post_content'] = $post->post_content;
		}

		return $post_data;
	}

	public static function convert_timestamps( $content ) {
		// convert the time to local timezone
		preg_match( '/data-lp-date-time-format.?=.?"(.*?)[\\|"]/', $content, $format );
		preg_match( '/data-lp-date-time.?=.?"(.*?)[\\|"]/', $content, $time );

		$updated_content = $content;

		if ( null !== $format && isset( $format[1] ) && null !== $time && isset( $time[1] ) ) {

			$original_timezone = new DateTimeZone( 'UTC' );

			// Instantiate the DateTime object, setting it's date, time and time zone.
			$clean_time = trim( $time[1], '\\' );
			$datetime = new DateTime( $clean_time, $original_timezone );

			$blog_timezone = get_option( 'timezone_string' );

			// timezone not set use offset
			if ( ! empty( $blog_timezone ) ) {
				// Set the DateTime object's time zone to convert the time appropriately.
				$target_timezone = new DateTimeZone( $blog_timezone );
				$datetime->setTimezone( $target_timezone );
			} else {
				$offset = get_option( 'gmt_offset' );

				if ( '0' !== $offset ) {
					$sign = $offset < 0 ? '-' : '+';
					$target_timezone = new DateTimeZone( $sign . abs( $offset ) );
					$datetime->setTimezone( $target_timezone );
				}
			}

			$clean_format = trim( $format[1], '\\' );
			// Outputs a date/time string based on the time zone you've set on the object.
			$new_time = $datetime->format( $clean_format );

			$updated_content = preg_replace( '/(.*data-lp-date-time.*".?>)(.*)(<\/.*)/', "$1 $new_time $3", $content );
		}

		return $updated_content;
	}

	/**
	 * Short circut the update mechanism.
	 *
	 * Logic branches
	 * - If this is a new post, do nothing.
	 * - If this is a change to an existing post, do nothing.
	 * - If this is an addition to an existing post, remove the addition and store it as
	 *   a LivePress update instead.
	 *
	 * @param array $post_data
	 * @param array $content_struct
	 */
	public static function insert_post_data_raw( $post_data, $content_struct ) {

		// Only fire on XML-RPC requests
		if ( ! defined( 'XMLRPC_REQUEST' ) || false == XMLRPC_REQUEST || ( defined( 'LP_FILTERED' ) && true == LP_FILTERED ) ) {

			return $post_data;
		}

		define( 'LP_FILTERED', true );

		$defaults = array(
			'post_status'   => 'draft',
			'post_type'     => 'post',
			'post_author'   => 0,
			'post_password' => '',
			'post_excerpt'  => '',
			'post_content'  => '',
			'post_title'    => '',
		);

		$unparsed_data = wp_parse_args( $content_struct, $defaults );

		// If this isn't an update, exit early so we don't walk all over ourselves.
		if ( empty( $unparsed_data['ID'] ) ) {

			return $post_data;
		}

		// Get the post we're updating so we can compare the new content with the old content.
		$post_id = $unparsed_data['ID'];
		$post    = get_post( $post_id );

		$live_posts = get_option( 'livepress_live_posts', array() );
		$is_live    = in_array( $post_id, $live_posts );

		if ( ! $is_live ) {

			return $post_data;
		}

		$original_posts = self::get_existing_updates( $post );
		$new_posts      = self::parse_updates( $unparsed_data['post_content'] );

		// First, add the new update if there is one
		if ( isset( $new_posts['new'] ) ) {
			if ( 1 === count( $new_posts ) ) {
				// Todo: If the only post sent up is "new" create a diff against the existing post so we can process the update.
				$clean_content               = preg_replace( '/\<\!--livepress(.+)--\>/', '', $post->post_content );
				$new_posts['new']['content'] = str_replace( $clean_content, '', $new_posts['new']['content'] );
			}

			$new_posts['new']['content'] = self::convert_timestamps( $new_posts['new']['content'] );

			if ( false === strpos( $new_posts['new']['content'], 'livepress-update-outer-wrapper' ) ) {
				$new_posts['new']['content'] = '<div class="livepress-update-outer-wrapper">' . PHP_EOL . PHP_EOL . $new_posts['new']['content'] . PHP_EOL . PHP_EOL . '<\/div>';
			}

			$update_id = LivePress_PF_Updates::get_instance()->add_update( $post, $new_posts['new']['content'], array() );



			// Remove the new post from the array so we don't double-process by mistake.
			unset( $new_posts['new'] );
		}

		// Second, update the content of any posts that have been changed.
		// You cannot *delete* an update via XMLRPC.  For that, you need to actually use the WordPress UI.
		foreach ( $original_posts as $original_id => $original_post ) {
			// Skip the parent post
			if ( $post_id === $original_id ) {
				continue;
			}

			// Skip if no changes were passed in for this post
			if ( ! isset( $new_posts[ $original_id ] ) ) {
				continue;
			}

			$updated = $new_posts[ $original_id ];

			// Do we actually need to do an update?
			$md5 = md5( $updated['content'] );
			if ( $updated['md5'] === $md5 ) {
				continue;
			}

			$original_post['post_content'] = $updated['content'];

			wp_update_post( $original_post );
		}

		// Update post data for the parent post.
		if ( isset( $new_posts[ $post_id ] ) ) {
			$post_data['post_content'] = $new_posts[ $post_id ]['content'];
		} else {
			$post_data['post_content'] = $post->post_content;
		}

		return $post_data;
	}


	private static function avatar_html( $author ) {
		return ''; // come back later

		$lp_authors = LivePress_Administration::lp_get_authors();

		error_log( 'lp_authors - ' . implode( ' - ', $lp_authors['names'][0] ) );
		error_log( 'author - ' . $author );
		$output = '';

	}


	/**
	 * Get an array of the existing post updates, including the parent post.
	 *
	 * @param WP_Post $parent
	 *
	 * @return array
	 */
	private static function get_existing_updates( $parent ) {
		$updates                = array();
		$updates[ $parent->ID ] = $parent;

		// Set up child posts
		$children = get_children(
			array(
				'post_type'        => 'post',
				'post_parent'      => $parent->ID,
				'orderby'          => 'ID',
				'order'            => 'ASC',
				'numberposts'      => 1000,
				'suppress_filters' => false,
			)
		);

		foreach ( $children as $child ) {
			$updates[ $child->ID ] = $child;
		}

		return $updates;
	}

	/**
	 * Parse the posts passed in as a string.
	 *
	 * Every discrete update is prefixed with an HTML comment containing an MD5 hash of the original content (for comparison)
	 * and the ID of the post that contains that content.  The hash can be used for a quick check to see if anything has changed.
	 *
	 * Example: <!--livepress md5=1234567890 id=3-->This is an update
	 *
	 * @param string $string Entire concatenated post, or just the
	 *
	 * @return array
	 */
	private static function parse_updates( $string ) {
		$parsed = array();

		$split = preg_split( '/\<\!--livepress(.+)--\>/', $string, - 1, PREG_SPLIT_DELIM_CAPTURE );

		for ( $i = 0; $i < count( $split ); $i ++ ) {
			$part = $split[ $i ];

			if ( '' === trim( $part ) ) {
				continue;
			}

			if ( strpos( trim( $part ), 'md5=' ) === 0 ) {
				$id = preg_match( '/md5=(?P<md5>\w+) id=(?P<id>\w+)/', trim( $part ), $matches );

				$parsed[ $matches['id'] ] = array(
					'md5'     => $matches['md5'],
					'content' => $split[ $i + 1 ],
				);

				$i ++;
			} else {
				if ( isset( $parsed['new'] ) ) {
					continue;
				}

				// This content was not prefixed, so assume it was new.
				$parsed['new'] = array(
					'content' => $split[ $i ],
				);
			}
		}

		return $parsed;
	}
}


/**
 * XMLRPC authentication, lets Livepress server post on behalf of user.
 * Use token based authentication or built in authentication if in VIP
 *
 * @param mixed $user
 * @param string $username
 * @param string $password
 *
 * @return mixed WP_User|bool
 */
function _livepress_authenticate( $username, $password ) {

	if ( empty( $username ) || empty( $password ) ) {

		return false;
	}

	$userdata = get_user_by( 'login', $username );

	return $userdata;
	if ( ! $userdata ) {

		return false;
	}

	// Use built in authentication on VIP - token based authentication disallowed
	if ( defined( 'WPCOM_IS_VIP_ENV' ) && true === WPCOM_IS_VIP_ENV ) {
		global $wp_xmlrpc_server;

		if ( ! $user = $wp_xmlrpc_server->login( $username, $password ) ) {

			return false;
		}

		// Authentication success!
		return $user;

	} else {
		// Use token based authentication
		$lp_pass = get_user_meta( $userdata->ID, 'livepress-access-key', true );
		$auth    = false;
		if ( ! empty( $lp_pass ) && wp_check_password( $password, $lp_pass, $userdata->ID ) ) {
			$auth = true;
		}

		if ( ! $auth ) {
			$lp_pass = get_user_meta( $userdata->ID, 'livepress-access-key-new', true );
			if ( ! empty( $lp_pass ) && wp_check_password( $password, $lp_pass, $userdata->ID ) ) {
				$auth = true;
			}
		}
		if ( $auth ) {
			$user = new WP_User( $userdata->ID );

			return $user;
		} else {

			return false;
		}
	}
}


/**
 * Called by livepress webservice instead of editPost as we need to save
 * display_author (if passed) before the actual post save method so we know the
 * real author of update.
 * Also, we want to fetch post and append given content to it here, as doing it
 * in livepress webservice can cause race conditions.
 * This handles passed values, updates the arguments and passes them to
 * xmlrpc.php so it works as nothing happened.
 *
 * Handles custom_fields correclty
 *
 * @param array $args
 *
 * @return bool
 */
function livepress_append_to_post( $args ) {
	global $wp_xmlrpc_server, $wpdb;

	$wp_xmlrpc_server->escape( $args );
	$post_id        = (int) $args[0];
	$username       = esc_sql( $args[1] );
	$password       = esc_sql( $args[2] );
	$content_struct = $args[3];

	if ( ! $user = _livepress_authenticate( $username, $password ) ) {
		return $wp_xmlrpc_server->error;
	}

	// at this point the user is authenticated

	// Check that the user can edit the post
	if ( ! user_can( $user, 'edit_post', $post_id ) ) {
		return false;
	}

	// Verify that the post is live
	$blogging_tools = new LivePress_Blogging_Tools();
	$is_live        = $blogging_tools->get_post_live_status( $post_id );
	if ( ! $is_live ) {

		return false;
	}
	wp_set_current_user( $user->ID ); // Allow updates

	if ( isset( $content_struct['display_author'] ) ) {
		LivePress_Updater::instance()->set_custom_author_name( $content_struct['display_author'] );
	}

	if ( isset( $content_struct['created_at'] ) ) {
		LivePress_Updater::instance()->set_custom_timestamp( $content_struct['created_at'] );
	}

	if ( isset( $content_struct['avatar_url'] ) ) {
		LivePress_Updater::instance()->set_custom_avatar_url( $content_struct['avatar_url'] );
	}

	$plugin_options = get_option( LivePress_Administration::$options_name );

	// Adds metainfo shortcode
	$content_struct['description'] = '[livepress_metainfo] ' . $content_struct['description'];

	$content_struct['ID']           = $args[0];
	$content_struct['post_content'] = $content_struct['description'];

	return wp_update_post( $content_struct );
}


/**
 * Called by livepress webservice instead of editPost as we need to save
 * display_author (if passed) before the actual post save method so we know the
 * real author of update.
 * Also, we want to fetch post and append given content to it here, as doing it
 * in livepress webservice can cause race conditions.
 * This handles passed values, updates the arguments and passes them to
 * xmlrpc.php so it works as nothing happened.
 *
 * Handles custom_fields correclty
 *
 * @param array $args
 *
 * @return bool
 */
function livepress_append_to_post_raw( $args ) {
	global $wp_xmlrpc_server, $wpdb, $post;

	$wp_xmlrpc_server->escape( $args );

	$post_id            = (int) $args[0];
	$username           = esc_sql( $args[1] );
	$password           = esc_sql( $args[2] );
	$content_struct     = $args[3];
	$client_provided_id = esc_sql( $args[4] );

	if ( ! $user = _livepress_authenticate( $username, $password ) ) {

		return $wp_xmlrpc_server->error;
	}

	$post = get_post( $post_id );
	setup_postdata( $post );

	// at this point the user is authenticated

	// Check that the user can edit the post
	if ( ! user_can( $user, 'edit_post', $post_id ) ) {

		return false;
	}

	// Verify that the post is live
	$blogging_tools = new LivePress_Blogging_Tools();
	$is_live        = $blogging_tools->get_post_live_status( $post_id );

	if ( ! $is_live ) {

		return false;
	}
	wp_set_current_user( $user->ID ); // Allow updates

	if ( isset( $content_struct['display_author'] ) ) {
		LivePress_Updater::instance()->set_custom_author_name( $content_struct['display_author'] );
	}

	if ( isset( $content_struct['created_at'] ) ) {
		LivePress_Updater::instance()->set_custom_timestamp( $content_struct['created_at'] );
	}

	if ( isset( $content_struct['avatar_url'] ) ) {
		LivePress_Updater::instance()->set_custom_avatar_url( $content_struct['avatar_url'] );
	}

	$content_struct['ID']           = $post_id;
	$content_struct['post_content'] = $content_struct['description'];

	remove_filter( 'wp_insert_post_data', array( 'LivePress_XMLRPC', 'insert_post_data' ), 10 );

	remove_filter( 'xmlrpc_wp_insert_post_data', array( 'LivePress_XMLRPC', 'insert_post_data' ), 10 );
	remove_filter( 'content_save_pre', array( 'LivePress_Live_Update', 'fill_livepress_shortcodes' ), 5 );

	add_filter( 'wp_insert_post_data', array( 'LivePress_XMLRPC', 'insert_post_data_raw' ), 10, 2 );
	add_filter( 'xmlrpc_wp_insert_post_data', array( 'LivePress_XMLRPC', 'insert_post_data_raw' ), 10, 2 );

	LivePress_PF_Updates::get_instance()->client_provided_update_id = $client_provided_id;

	$update_response = wp_update_post( $content_struct );

	LivePress_PF_Updates::get_instance()->client_provided_update_id = null;

	if ( ! is_wp_error( $update_response ) ) {
		$args = array(
			'numberposts' => 1,
			'order' => 'DESC',
			'post_parent' => $post_id,
			'post_type' => 'post',
		);

		$get_children_array = get_children( $args, ARRAY_A );  //returns Array ( [$image_ID]...
		$rekeyed_array = array_values( $get_children_array );
		$update = $rekeyed_array[0];

		update_post_meta( $update['ID'], 'lp_client_provided_id', $client_provided_id );
		update_post_meta( $post_id, 'lp_content_is_raw', 'true' );
	}

	remove_filter( 'wp_insert_post_data', array( 'LivePress_XMLRPC', 'insert_post_data_raw' ), 10 );
	remove_filter( 'xmlrpc_wp_insert_post_data', array( 'LivePress_XMLRPC', 'insert_post_data_raw' ), 10 );

	add_filter( 'wp_insert_post_data', array( 'LivePress_XMLRPC', 'insert_post_data' ), 10, 2 );
	add_filter( 'xmlrpc_wp_insert_post_data', array( 'LivePress_XMLRPC', 'insert_post_data' ), 10, 2 );
	add_filter( 'content_save_pre', array( 'LivePress_Live_Update', 'fill_livepress_shortcodes' ), 5 );

	return $update_response;
}


/**
 * Called by livepress webservice to delete an update added via
 * livepress_append_to_post_raw.
 *
 * @param array $args {
 *        An array of arguments.
 * @param  string $post_id ID of the post to set the status of, -1 to check password only.
 * @param  string $username Username for action.
 * @param  string $password Livepress generated user access key.
 * @param  string $client_provided_update_id Client provided ID of update to be deleted.
 *
 * @return int|Object 1 if deletion successful, error otherwise.
 * }
 */
function livepress_delete_raw_update( $args ) {
	global $wp_xmlrpc_server, $wpdb, $post;

	$wp_xmlrpc_server->escape( $args );
	$post_id                   = (int) $args[0];
	$username                  = esc_sql( $args[1] );
	$password                  = esc_sql( $args[2] );
	$client_provided_update_id = esc_sql( $args[3] );

	$update = LivePress_PF_Updates::get_instance()->get_update_by_client_provided_id( $post_id, $client_provided_update_id );

	$post = get_post( $post_id );
	setup_postdata( $post );

	$response = LivePress_PF_Updates::get_instance()->perform_delete_update( $post, $update );

	return $response;
}

/**
 * Called by livepress webservice to change an update added via
 * livepress_append_to_post_raw.
 *
 * @param array $args {
 *        An array of arguments.
 * @param  string $post_id ID of the post to set the status of, -1 to check password only.
 * @param  string $username Username for action.
 * @param  string $password Livepress generated user access key.
 * @param  string $client_provided_update_id Client provided ID of update to be changed.
 *
 * @return int|Object 1 if deletion successful, error otherwise.
 * }
 */
function livepress_change_raw_update( $args ) {
	global $wp_xmlrpc_server, $wpdb, $post;

	$wp_xmlrpc_server->escape( $args );
	$post_id                   = (int) $args[0];
	$username                  = esc_sql( $args[1] );
	$password                  = esc_sql( $args[2] );
	$client_provided_update_id = esc_sql( $args[3] );
	$content_struct           = $args[4];

	$update = LivePress_PF_Updates::get_instance()->get_update_by_client_provided_id( $post_id, $client_provided_update_id );

	$post = get_post( $post_id );
	setup_postdata( $post );

	$update_meta['draft'] = false;

	$content = LivePress_XMLRPC::convert_timestamps( $content_struct['description'] );

	$response = LivePress_PF_Updates::get_instance()->perform_change_update( $post, $update, $update_meta, $content, false );

	return $response;
}

/**
 * Called by livepress webservice to set the live status of a post.
 *
 * @param array $args {
 *        An array of arguments.
 * @param  string $username Username for action.
 * @param  string $password Livepress generated user access key.
 * @param  string $post_id ID of the post to set the status of, -1 to check password only.
 * @param  bool $live_status True to turn live on, false to turn live off.
 *
 * @return int|Object 1 if password verified or status updated, false on error.
 * }
 */
function livepress_set_post_live_status( $args ) {
	global $wp_xmlrpc_server, $wpdb;

	$wp_xmlrpc_server->escape( $args );
	$username    = esc_sql( $args[0] );
	$password    = esc_sql( $args[1] );
	$post_id     = (int) $args[2];
	$live_status = (bool) $args[3];

	// Verify user is authorized
	if ( ! $user = _livepress_authenticate( $username, $password ) ) {
		return false;
	}

	// If post_id is -1 call is only to check password
	if ( - 1 == $post_id ) {
		return true;
	}

	// Verify user can edit post
	if ( ! user_can( $user, 'edit_post', $post_id ) ) {
		return false;
	}

	// Set the post live status

	if ( $live_status ) {
		// remove the lp_post_finished just in case this is a toggle.
		delete_post_meta( $post_id, 'lp_post_finished', true );
		// set to live for new posts
		$blogging_tools = new LivePress_Blogging_Tools();
		$blogging_tools->set_post_live_status( $post_id, $live_status );
	} else {
		// don't remove from global LP post list just mark as finished.
		update_post_meta( $post_id, 'lp_post_finished', true );
	}

	return 1;
}

/**
 * Called by livepress webservice to create a new live post.
 * Uses livepress_new_post()
 *
 * @param array $args {
 *        An array of arguments.
 * @param  int $blog_id Id of blog to to add post to.
 * @param  string $username Username for action.
 * @param  string $password Livepress generated user access key.
 * @param  array $content_struct Initial post content.
 * @param  string $feed_order Order the post should show in top|bottom
 *
 * @return Object Post object or false on error.
 * }
 */
function livepress_new_live_post( $args ) {
	$post = livepress_create_new_post( $args );

	// If there was an error, return the error, else move along
	if ( ! is_a( $post, 'WP_Post' ) ) {

		return $post;
	}

	// Set the post live status to live
	$blogging_tools = new LivePress_Blogging_Tools();
	$blogging_tools->set_post_live_status( $post->ID, true );

	return $post;
}

/**
 * Called by livepress webservice to create a new post.
 *
 * @param array $args {
 *        An array of arguments.
 * @param  int $blog_id Id of blog to to add post to.
 * @param  string $username Username for action.
 * @param  string $password Livepress generated user access key.
 * @param  array $content_struct Initial post content.
 * @param string $feed_order order the post should show in top|bottom
 *
 * @return mixed Post object or false on error.
 * }
 */
function livepress_create_new_post( $args ) {
	global $wp_xmlrpc_server, $wpdb;

	$wp_xmlrpc_server->escape( $args );
	$blog_id        = (int) $args[0];
	$username       = $args[1];
	$password       = $args[2];
	$content_struct = $args[3];

	// get the default feed order
	$update_order_key = 'feed_order';
	$options          = get_option( LivePress_Administration::$options_name );
	$meta_order       = $options[ $update_order_key ];

	$feed_order = ( isset( $args[4] ) && 'bottom' === strtolower( $args[4] ) ) ? 'bottom' : $meta_order;

	// Verify user is authorized
	if ( ! $user = _livepress_authenticate( $username, $password ) ) {
		return false;
	}

	// Verify user can edit posts
	if ( ! user_can( $user, 'edit_posts' ) ) {
		return false;
	}

	unset( $content_struct['ID'] );

	$defaults = array(
		'post_status' => 'publish',
		'post_type'   => 'post',
		'post_author' => $user->ID,
		'post_title'  => $content_struct['title'],
	);

	$post_data = wp_parse_args( $content_struct, $defaults );

	// Insert the new post
	$post_id = wp_insert_post( $post_data, true );

	if ( is_wp_error( $post_id ) ) {

		return false;
	}

	if ( ! $post_id ) {

		return false;
	}

	//set feed order
	update_post_meta( $post_id, 'livepress_feed_order', $feed_order );

	// get post object
	$post = get_post( $post_id );

	return $post;
}

/**
 * Called by livepress webservice to get a post.
 *
 * @param array $args {
 *        An array of arguments.
 * @param  int $post_id Id of post to retrieve.
 * @param  string $username Username for action.
 * @param  string $password Livepress generated user access key.
 * }
 *
 * @return array
 */
function livepress_get_post( $args ) {
	global $wp_xmlrpc_server, $wpdb;

	$wp_xmlrpc_server->escape( $args );
	$post_id  = (int) $args[0];
	$username = $args[1];
	$password = $args[2];

	// Verify user is authorized
	if ( ! $user = _livepress_authenticate( $username, $password ) ) {
		return false;
	}
	if ( ! user_can( $user, 'edit_post', $post_id ) ) {
		return false;
	}

	return ( _livepress_get_post_data( $post_id ) );
}

/**
 * Retrieve a structured data representation of a single post
 *
 * @param int $post_id The post ID.
 *
 * @return Array The post data in an array expected by LivePress.
 *
 */
function _livepress_get_post_data( $post_id ) {
	global $wp_xmlrpc_server;
	$post_data = get_post( $post_id, ARRAY_A );

	if ( ! $post_data ) {

		return false;
	}
	$post_date         = $wp_xmlrpc_server->_convert_date( $post_data['post_date'] );
	$post_date_gmt     = $wp_xmlrpc_server->_convert_date_gmt( $post_data['post_date_gmt'], $post_data['post_date'] );
	$post_modified     = $wp_xmlrpc_server->_convert_date( $post_data['post_modified'] );
	$post_modified_gmt = $wp_xmlrpc_server->_convert_date_gmt( $post_data['post_modified_gmt'], $post_data['post_modified'] );

	$categories = array();
	$catids     = wp_get_post_categories( $post_id );

	foreach ( $catids as $catid ) {
		$categories[] = get_cat_name( $catid );
	}

	$tagnames = array();
	$tags     = wp_get_post_tags( $post_id );

	if ( ! empty( $tags ) ) {
		foreach ( $tags as $tag ) {
			$tagnames[] = $tag->name;
		}
		$tagnames = implode( ', ', $tagnames );
	} else {
		$tagnames = '';
	}

	$post = get_extended( $post_data['post_content'] );
	$link = get_permalink( $post_data['ID'] );

	// Get the author info.
	$author = get_userdata( $post_data['post_author'] );

	$allow_comments = ( 'open' == $post_data['comment_status'] ) ? 1 : 0;
	$allow_pings    = ( 'open' == $post_data['ping_status'] ) ? 1 : 0;

	// Consider future posts as published
	if ( 'future' === $post_data['post_status'] ) {
		$post_data['post_status'] = 'publish';
	}

	// Get post format
	$post_format = get_post_format( $post_id );
	if ( empty( $post_format ) ) {
		$post_format = 'standard';
	}

	$sticky = false;
	if ( is_sticky( $post_id ) ) {
		$sticky = true;
	}

	$enclosure = array();
	foreach ( (array) get_post_custom( $post_id ) as $key => $val ) {
		if ( 'enclosure' === $key ) {
			foreach ( (array) $val as $enc ) {
				$encdata             = explode( "\n", $enc );
				$enclosure['url']    = trim( htmlspecialchars( $encdata[0] ) );
				$enclosure['length'] = (int) trim( $encdata[1] );
				$enclosure['type']   = trim( $encdata[2] );
				break 2;
			}
		}
	}

	$resp = array(
		// commented out because no other tool seems to use this
		//'content' => $entry['post_content'],
		'dateCreated'            => $post_date,
		'userid'                 => $post_data['post_author'],
		'postid'                 => $post_data['ID'],
		'description'            => $post['main'],
		'title'                  => $post_data['post_title'],
		'link'                   => $link,
		'permaLink'              => $link,
		'categories'             => $categories,
		'mt_excerpt'             => $post_data['post_excerpt'],
		'mt_text_more'           => $post['extended'],
		'wp_more_text'           => $post['more_text'],
		'mt_allow_comments'      => $allow_comments,
		'mt_allow_pings'         => $allow_pings,
		'mt_keywords'            => $tagnames,
		'wp_slug'                => $post_data['post_name'],
		'wp_password'            => $post_data['post_password'],
		'wp_author_id'           => (string) $author->ID,
		'wp_author_display_name' => $author->display_name,
		'date_created_gmt'       => $post_date_gmt,
		'post_status'            => $post_data['post_status'],
		'custom_fields'          => $wp_xmlrpc_server->get_custom_fields( $post_id ),
		'wp_post_format'         => $post_format,
		'sticky'                 => $sticky,
		'date_modified'          => $post_modified,
		'date_modified_gmt'      => $post_modified_gmt,
	);

	if ( ! empty( $enclosure ) ) {
		$resp['enclosure'] = $enclosure;
	}

	$resp['wp_post_thumbnail'] = get_post_thumbnail_id( $post_data['ID'] );

	return $resp;
}


/**
 * Retrieve list of recent posts. Taken from WordPress XMLRPC server
 * implementation - class_wp_xmlrpc_server
 *
 * @param array $args {
 *        An array of arguments.
 * @param  int $blog_id Id of the blog.
 * @param  string $username Username for action.
 * @param  string $password Livepress generated user access key.
 * @param  int $numberposts (optional) Number of posts
 * }
 *
 * @return mixed array|bool
 */
function livepress_get_recent_posts( $args ) {
	global $wp_xmlrpc_server, $wpdb;

	$wp_xmlrpc_server->escape( $args );
	$blog_id  = (int) $args[0];  /* though we don't use it yet */
	$username = $args[1];
	$password = $args[2];
	if ( isset( $args[3] ) ) {
		$query = array( 'numberposts' => absint( $args[3] ) );
	} else {

		$query = array();
	}

	// Verify user is authorized
	if ( ! $user = _livepress_authenticate( $username, $password ) ) {

		return false;
	}

	if ( ! user_can( $user, 'edit_posts' ) ) {

		return false;
	}

	$posts_list = wp_get_recent_posts( $query );

	if ( ! $posts_list ) {

		return array();
	}

	$struct = array();
	foreach ( $posts_list as $entry ) {
		$struct[] = _livepress_get_post_data( $entry['ID'] );
	}

	$recent_posts = array();
	for ( $j = 0; $j < count( $struct ); $j ++ ) {
		array_push( $recent_posts, $struct[ $j ] );
	}

	return $recent_posts;
}

/**
 * Create new comment. Taken from WordPress XMLRPC server
 * implementation - class_wp_xmlrpc_server
 *
 * @param array $args Method parameters.
 *
 * @return mixed {@link wp_new_comment()}
 */
function livepress_new_comment( $args ) {
	global $wp_xmlrpc_server;

	$wp_xmlrpc_server->escape( $args );
	$blog_id        = (int) $args[0];
	$username       = $args[1];
	$password       = $args[2];
	$post           = $args[3];
	$content_struct = $args[4];

	/**
	 * Filter whether to allow anonymous comments over XML-RPC.
	 *
	 * @param bool $allow Whether to allow anonymous commenting via XML-RPC.
	 *                    Default false.
	 *  In order to turn them on you'll need to add a filter on
	 *                    xmlrpc_allow_anonymous_comments to return
	 *                    TRUE.
	 */
	$allow_anon = apply_filters( 'xmlrpc_allow_anonymous_comments', false );

	$user = _livepress_authenticate( $username, $password );

	if ( ! $user ) {
		$logged_in = false;
		if ( $allow_anon && get_option( 'comment_registration' ) ) {

			return new IXR_Error( 403, __( 'You must be registered to comment' ) );
		} elseif ( ! $allow_anon ) {

			return $this->error;
		}
	} else {
		$logged_in = true;
	}

	if ( is_numeric( $post ) ) {
		$post_id = absint( $post );
	} else {
		$post_id = url_to_postid( $post );
	}

	if ( ! $post_id ) {

		return new IXR_Error( 404, __( 'Invalid post ID.' ) );
	}

	if ( ! get_post( $post_id ) ) {

		return new IXR_Error( 404, __( 'Invalid post ID.' ) );
	}

	$comment['comment_post_ID'] = $post_id;

	if ( $logged_in ) {
		$comment['comment_author']       = $wp_xmlrpc_server->escape( $user->display_name );
		$comment['comment_author_email'] = $wp_xmlrpc_server->escape( $user->user_email );
		$comment['comment_author_url']   = $wp_xmlrpc_server->escape( $user->user_url );
		$comment['user_ID']              = $user->ID;
	} else {
		$comment['comment_author'] = '';
		if ( isset( $content_struct['author'] ) ) {
			$comment['comment_author'] = $content_struct['author'];
		}

		$comment['comment_author_email'] = '';
		if ( isset( $content_struct['author_email'] ) ) {
			$comment['comment_author_email'] = $content_struct['author_email'];
		}

		$comment['comment_author_url'] = '';
		if ( isset( $content_struct['author_url'] ) ) {
			$comment['comment_author_url'] = $content_struct['author_url'];
		}

		$comment['user_ID'] = 0;

		if ( get_option( 'require_name_email' ) ) {
			if ( 6 > strlen( $comment['comment_author_email'] ) || '' == $comment['comment_author'] ) {

				return new IXR_Error( 403, __( 'Comment author name and email are required' ) );
			} elseif ( ! is_email( $comment['comment_author_email'] ) ) {

				return new IXR_Error( 403, __( 'A valid email address is required' ) );
			}
		}
	}

	$comment['comment_parent'] = isset( $content_struct['comment_parent'] ) ? absint( $content_struct['comment_parent'] ) : 0;

	$comment['comment_content'] = isset( $content_struct['content'] ) ? $content_struct['content'] : null;

	$comment_id = wp_new_comment( $comment );

	/**
	 * Fires after a new comment has been successfully created via XML-RPC.
	 *
	 * @since 3.4.0
	 *
	 * @param int $comment_id ID of the new comment.
	 * @param array $args An array of new comment arguments.
	 */
	do_action( 'xmlrpc_call_success_wp_newComment', $comment_id, $args );

	return $comment_id;
}

/**
 * Uploads a file, following your settings. From WordPress XMLRPC
 * server - mw_newMediaObject()
 *
 * @param array $args Method parameters.
 *
 * @return array
 */
function livepress_upload_file( $args ) {
	global $wpdb, $wp_xmlrpc_server;

	$blog_id  = (int) $args[0];
	$username = $wp_xmlrpc_server->escape( $args[1] );
	$password = $wp_xmlrpc_server->escape( $args[2] );
	$data     = $args[3];

	$name = sanitize_file_name( $data['name'] );
	$type = $data['type'];
	$bits = $data['bits'];

	if ( ! $user = _livepress_authenticate( $username, $password ) ) {

		return false;
	}

	if ( ! user_can( $user, 'upload_files' ) ) {

		return false;
	}

	/**
	 * Filter whether to preempt the XML-RPC media upload.
	 *
	 * Passing a truthy value will effectively short-circuit the media upload,
	 * returning that value as a 500 error instead.
	 *
	 * @param bool $error Whether to pre-empt the media upload. Default false.
	 */
	if ( $upload_err = apply_filters( 'pre_upload_error', false ) ) {

		return false;
	}

	if ( ! empty( $data['overwrite'] ) && ( true == $data['overwrite'] ) ) {
		// Get postmeta info on the object.
		$old_file = $wpdb->get_row( "
				SELECT ID
				FROM {$wpdb->posts}
				WHERE post_title = '{$name}'
					AND post_type = 'attachment'
			" );

		// Delete previous file.
		wp_delete_attachment( $old_file->ID );

		// Make sure the new name is different by pre-pending the
		// previous post id.
		$filename = preg_replace( '/^wpid\d+-/', '', $name );
		$name     = "wpid{$old_file->ID}-{$filename}";
	}

	$upload = wp_upload_bits( $name, null, $bits );
	if ( ! empty( $upload['error'] ) ) {
		$error_string = sprintf( __( 'Could not write file %1$s (%2$s)' ), $name, $upload['error'] );

		return false;
	}
	// Construct the attachment array
	$post_id = 0;
	if ( ! empty( $data['post_id'] ) ) {
		$post_id = (int) $data['post_id'];

		if ( ! current_user_can( 'edit_post', $post_id ) ) {

			return false;
		}
	}
	$attachment = array(
		'post_title'     => $name,
		'post_content'   => '',
		'post_type'      => 'attachment',
		'post_parent'    => $post_id,
		'post_mime_type' => $type,
		'guid'           => $upload['url'],
	);

	// Save the data
	$id = wp_insert_attachment( $attachment, $upload['file'], $post_id );
	wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );

	$struct = array(
		'id'   => strval( $id ),
		'file' => $name,
		'url'  => $upload['url'],
		'type' => $type,
	);

	/** This filter is documented in wp-admin/includes/file.php */
	return apply_filters( 'wp_handle_upload', $struct, 'upload' );
}
