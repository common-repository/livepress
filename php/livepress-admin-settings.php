<?php

/**
 * Adds the LivePress menu to the settings screen, uses the settings API to display form fields,
 * validates and saves those fields.
 */
class LivePress_Admin_Settings {
	/**
	 * @access public
	 * @var array $settings Settings array.
	 */
	public $settings = array();
	private $livepress_config;

	/**
	 * Constructor.
	 */
	function __construct() {
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		if ( ! defined( 'WPCOM_IS_VIP_ENV' ) || false === WPCOM_IS_VIP_ENV ) {
			add_action( 'pre_update_option_livepress', array( $this, 'process_prior_to_update' ), 10, 2 );
		}

		$this->settings         = $this->get_settings();
		$this->livepress_config = LivePress_Config::get_instance();
	}

	function get_array_value( $array, $key ) {
		return ( is_array( $array ) && isset( $array[ $key ] ) ) ? sanitize_text_field( $array[ $key ] ) : '';
	}

	function process_prior_to_update( $new_livepress, $old_livepress ) {
		if ( $this->sanitize_and_validate_api_key( $new_livepress, $old_livepress['api_key'] ) ) {
			$new_livepress = $this->process_slack_settings( $new_livepress, $old_livepress );
		}

		return $new_livepress;
	}

	function revert_slack_settings( & $new_livepress, $old_livepress ) {
		$new_livepress['slack_team_domain']    = $old_livepress['slack_team_domain'];
		$new_livepress['slack_channel']        = $old_livepress['slack_channel'];
		$new_livepress['slack_default_author'] = $old_livepress['slack_default_author'];
	}

	function process_slack_settings( $new_livepress, $old_livepress ) {
		$api_key = $this->get_array_value( $new_livepress, 'api_key' );
		if ( '' === $api_key ) {
			$this->revert_slack_settings( $new_livepress, $old_livepress );

			return $new_livepress;
		}
		if ( function_exists( 'get_settings_errors' ) ) {
			if ( ! empty( get_settings_errors( 'slack_team_domain' ) ) ||
			     ! empty( get_settings_errors( 'slack_channel' ) ) ||
			     ! empty( get_settings_errors( 'slack_default_author' ) )
			) {
				return $new_livepress;
			}
		}

		$new_slack_team_domain    = $this->get_array_value( $new_livepress, 'slack_team_domain' );
		$new_slack_channel        = $this->get_array_value( $new_livepress, 'slack_channel' );
		$new_slack_default_author = $this->get_array_value( $new_livepress, 'slack_default_author' );

		$clearing_all_slack =
			( '' === $new_slack_team_domain ) && ( '' === $new_slack_channel ) &&
			( ( - 1 === $new_slack_default_author ) || empty( $new_slack_default_author ) );
		$setting_all_slack  =
			( '' !== $new_slack_team_domain ) && ( '' !== $new_slack_channel ) &&
			( ( - 1 !== $new_slack_default_author ) && ! empty( $new_slack_default_author ) );

		if ( ! ( $clearing_all_slack || $setting_all_slack ) ) {
		    if( ! empty( $clearing_all_slack . $setting_all_slack ) ){
			    add_settings_error( 'slack_team_domain', 'invalid', esc_html__( 'All Slack settings must be provided, or all must be cleared. Slack Team Domain, Channel and Default Author have been reverted to their previous values.', 'livepress' ) );
		    }
			$this->revert_slack_settings( $new_livepress, $old_livepress );

			return $new_livepress;
		}

		$old_slack_team_domain    = $this->get_array_value( $old_livepress, 'slack_team_domain' );
		$old_slack_channel        = $this->get_array_value( $old_livepress, 'slack_channel' );
		$old_slack_default_author = $this->get_array_value( $old_livepress, 'slack_default_author' );

		if ( ( $new_slack_team_domain === $old_slack_team_domain ) &&
		     ( $new_slack_channel === $old_slack_channel ) &&
		     ( $new_slack_default_author === $old_slack_default_author )
		) {
			return $new_livepress;
		}

		$new_slack_default_author_username = '';
		if ( $new_slack_default_author != '-1' ) {
			$user                              = get_userdata( $new_slack_default_author );
			$new_slack_default_author_username = $user->user_login;

			$la                             = new LivePress_Administration();
			$enable_remote_posting_response = $la->enable_remote_post( $new_slack_default_author, '', $api_key );
			if ( ! $enable_remote_posting_response ) {
				$error_msg = 'Unexpected error encountered while attempting to update Slack default author settings. Please contact support@livepress.com for further assistance. Slack Team Domain, Channel and Default Author have been reverted to their previous values.';
				add_settings_error( 'slack_default_author', 'invalid', esc_html__( $error_msg, 'livepress' ) );
				$this->revert_slack_settings( $new_livepress, $old_livepress );

				return $new_livepress;
			}
		}

		$livepress_com = new LivePress_Communication( $api_key );
		$error_message = '';
		$return_code   = $livepress_com->set_slack_settings( $new_slack_team_domain, $new_slack_channel, $new_slack_default_author_username );

		if ( $return_code == 200 ) {
			if ( ( $new_slack_team_domain !== $old_slack_team_domain ) ||
			     ( $new_slack_channel !== $old_slack_channel )
			) {
				$new_livepress['slack_verification_pending'] = true;
			}
		} else {
			$return_data = json_decode( $livepress_com->get_last_response() );
			$error_code  = $return_data->code;

			$error_msg = '';
			if ( $error_code == 'slack_channel_non_unique' ) {
				$error_msg = 'Slack channel #' . $new_slack_channel . ' on ' . $new_slack_team_domain . '.slack.com is aleady associated with another LivePress-enabled site. Please choose another Slack channel or clear the settings on the other site and then try again. Contact support@livepress.com if you need further assistance. Slack Team Domain, Channel and Default Author have been reverted to their previous values.';
			} else {
				$error_msg = 'Unexpected error encountered while attempting to update Slack Integration settings. Slack Team Domain, Channel and Default Author have been reverted to their previous values. Please contact support@livepress.com for further assistance' .
				             ( isset( $return_data->message ) ? ' and provide this message: "' . $return_data->message . '"' : '.' );
			}

			add_settings_error( 'slack_team_domain', 'invalid', esc_html__( $error_msg, 'livepress' ) );
			$this->revert_slack_settings( $new_livepress, $old_livepress );
		}

		return $new_livepress;
	}

	/**
	 * Set up settings.
	 */
	function admin_init() {
		$this->setup_settings();
	}

	/**
	 * Get the current settings.
	 */
	function get_settings() {
		$settings = get_option( LivePress_Administration::$options_name );

		return (object) wp_parse_args(
			$settings,
			array(
				'api_key'                      => '',
				'feed_order'                   => 'top',
				'notifications'                => array(),
				'show'                         => array( 'AVATAR', 'TIME', 'AUTHOR', 'HEADER' ),
				'byline_style'                 => '',
				'allow_remote_twitter'         => true,
				'allow_sms'                    => true,
				'enabled_to'                   => 'all',
				'disable_comments'             => apply_filters( 'LP_disable_admin_comments', true ),
				'comment_live_updates_default' => false,
				'timestamp'                    => get_option( 'time_format' ),
				'include_avatar'               => false,
				'update_author'                => true,
				'author_display'               => '',
				'timestamp_format'             => 'timeago',
				'update_format'                => 'default',
				'facebook_app_id'              => '',
				'slack_team_domain'            => '',
				'slack_channel'                => '',
				'slack_default_author'         => '',
				'slack_verification_pending'   => false,
				'sharing_ui'                   => 'dont_display',
			)
		);
	}

	/**
	 * Enqueue some styles on the profile page to display our LP form
	 * a little nicer.
	 *
	 * @param string $hook Page hook.
	 *
	 * @author tddewey
	 * @return string $hook, unaltered regardless.
	 */
	function admin_enqueue_scripts( $hook ) {
		if ( $hook != 'settings_page_livepress-settings' ) {
			return $hook;
		}

		if ( $this->livepress_config->script_debug() ) {
			wp_enqueue_script( 'livepress_admin_ui_js', LP_PLUGIN_URL . 'js/admin_ui.full.js', array( 'jquery' ), LP_PLUGIN_SCRIPT_VERSION );
		} else {
			wp_enqueue_script( 'livepress_admin_ui_js', LP_PLUGIN_URL . 'js/admin_ui.min.js', array( 'jquery' ), LP_PLUGIN_SCRIPT_VERSION );
		}

		wp_enqueue_style( 'livepress_admin', LP_PLUGIN_URL . 'css/wp-admin.css', LP_PLUGIN_SCRIPT_VERSION );

		return $hook;
	}

	/**
	 * Add a menu to the settings page.
	 *
	 * @author tddewey
	 * @return void
	 */
	function admin_menu() {
		add_options_page( esc_html__( 'LivePress Settings', 'livepress' ), esc_html__( 'LivePress', 'livepress' ), 'manage_options', 'livepress-settings', array( $this, 'render_settings_page' ) );
	}

	/**
	 * Set up all the settings, fields, and sections.
	 *
	 * @author tddewey
	 * @return void
	 */
	function setup_settings() {
		register_setting( 'livepress', 'livepress', array( $this, 'sanitize' ) );

		// Add sections
		add_settings_section( 'lp-connection', esc_html__( 'Connection to LivePress', 'livepress' ), '__return_null', 'livepress-settings' );
		add_settings_section( 'lp-appearance', esc_html__( 'Appearance', 'livepress' ), '__return_null', 'livepress-settings' );
		add_settings_section( 'lp-sharing', esc_html__( 'Sharing', 'livepress' ), '__return_null', 'livepress-settings' );
		if ( ! defined( 'WPCOM_IS_VIP_ENV' ) || false === WPCOM_IS_VIP_ENV ) {
			add_settings_section( 'lp-slack', esc_html__( 'Slack Integration', 'livepress' ), '__return_null', 'livepress-settings' );
		}
		add_settings_section( 'lp-remote', esc_html__( 'Remote Publishing', 'livepress' ), '__return_null', 'livepress-settings' );

		// Add setting fields
		add_settings_field( 'api_key', esc_html__( 'Authorization Key', 'livepress' ), array( $this, 'api_key_form' ), 'livepress-settings', 'lp-connection' );

		add_settings_field( 'feed_order', esc_html__( 'When using the real-time editor, place new updates on', 'livepress' ), array( $this, 'feed_order_form' ), 'livepress-settings', 'lp-appearance' );
		add_settings_field( 'timestamp_format', esc_html__( 'When using update timestamps, show', 'livepress' ), array( $this, 'timestamp_format_form' ), 'livepress-settings', 'lp-appearance' );
	//	add_settings_field( 'update_format', esc_html__( 'Live update format', 'livepress' ), array( $this, 'update_format_form' ), 'livepress-settings', 'lp-appearance' );
		add_settings_field( 'show_meta', esc_html__( 'Metadata to show', 'livepress' ), array( $this, 'show_form' ), 'livepress-settings', 'lp-appearance' );
		add_settings_field( 'notifications', esc_html__( 'Readers receive these notifications when you update or publish a post', 'livepress' ), array( $this, 'notifications_form' ), 'livepress-settings', 'lp-appearance' );

		add_settings_field( 'sharing_ui', esc_html__( 'Display Sharing links per update', 'livepress' ), array( $this, 'sharing_ui_form' ), 'livepress-settings', 'lp-sharing' );
		add_settings_field( 'facebook_app_id', esc_html__( 'Facebook App ID', 'livepress' ), array( $this, 'facebook_app_id_form' ), 'livepress-settings', 'lp-sharing' );

		if ( ! defined( 'WPCOM_IS_VIP_ENV' ) || false === WPCOM_IS_VIP_ENV ) {
			add_settings_field( 'slack_team_domain', esc_html__( 'Slack Team Domain', 'livepress' ), array( $this, 'slack_team_domain_form' ), 'livepress-settings', 'lp-slack' );
			add_settings_field( 'slack_channel', esc_html__( 'Slack Channel', 'livepress' ), array( $this, 'slack_channel_form' ), 'livepress-settings', 'lp-slack' );
			add_settings_field( 'slack_default_author', esc_html__( 'Slack Default Author', 'livepress' ), array( $this, 'slack_default_author_form' ), 'livepress-settings', 'lp-slack' );
		}

		add_settings_field( 'allow_remote_twitter', esc_html__( 'Allow authors to publish via Twitter', 'livepress' ), array( $this, 'allow_remote_twitter_form' ), 'livepress-settings', 'lp-remote' );
		add_settings_field( 'allow_sms', esc_html__( 'Allow authors to publish via SMS', 'livepress' ), array( $this, 'allow_sms_form' ), 'livepress-settings', 'lp-remote' );
		add_settings_field( 'post_to_twitter', esc_html__( 'Publish Updates to Twitter', 'livepress' ), array( $this, 'push_to_twitter_form' ), 'livepress-settings', 'lp-remote' );
	}

	/**
	 * Display the activation error
	 */
	function error_activation() {
		?>
        <div class="error lp-activated">
            <h2><?php _e( 'Website not ready for live blogging', 'livepress' ); ?></h2>

            <p class="explanation"><?php _e( 'LivePress does not have this website on file as being activated.', 'livepress' ); ?></p>

            <p class="solution"><?php _e( 'Sign up or sign in to a LivePress.com account to manage services for your websites.', 'livepress' ); ?></p>

            <p>
                <a href="#" class="lp-button"><span><?php _ex( 'Sign up for live blogging services', 'button text', 'livepress' ); ?></span></a>
                <a href="#" style="margin-left:1em"><?php _ex( 'Login', 'Sign in to LivePress.com, alternate action', 'livepress' ); ?></a>
            </p>
        </div>
		<?php
	}

	/**
	 * Display the authorization key error
	 */
	function authorization_key_error() {
		?>
        <div class="error lp-authorization-key">
            <h2><?php _e( 'Authorization key missing or invalid', 'livepress' ); ?></h2>

            <p class="explanation"><?php _e( 'The authorization key connects this website with LivePress services.', 'livepress' ); ?></p>

            <p class="solution"><?php printf( __( 'Your authorization key can be found in your welcome email or online in your account at <a href="%s">LivePress.com.</a>', 'livepress' ), 'https://livepress.com/my-account' ); ?></p>
        </div>

		<?php
	}

	/**
	 * Display a connection error
	 */
	function connection_error() {
		?>
        <div class="error lp-connection">
            <h2><?php _ex( 'No Connection', 'No connection to LivePress servers', 'livepress' ); ?></h2>

            <p class="explanation"><?php _e( 'LivePress was unable to create a connection.', 'livepress' ); ?></p>

            <p class="solution"><?php _e( 'We\'ll keep trying, but check that you\'re online and that this website is accessible to others on the internet.', 'livepress' ); ?></p>
        </div>
		<?php
	}

	/**
	 * Dipslay a notice that everything is working
	 */
	function connected_notice() {
		?>
        <div class="updated lp-enabled">
            <h2><?php _e( 'LivePress enabled', 'livepress' ); ?></h2>

            <p class="explanation"><?php _e( 'All posts can be live blogged.', 'livepress' ); ?></p>

            <p class="solution"><?php _e( 'Thank you for using LivePress.', 'livepress' ); ?></p>
        </div>
		<?php
	}

	/**
	 * Dipslay a notice indicating that Slack verification needs to take place
	 */
	function slack_verification_notice( $slack_team_domain, $slack_channel, $verification_code ) {
		?>
        <div class="updated lp-enabled">
            <h2><?php esc_html_ex( 'Slack Channel Verification pending', 'livepress' ); ?></h2>

            <p class="explanation"><?php esc_html_e( 'Please complete verification from within Slack', 'livepress' ); ?></p>

            <p class="solution"><?php esc_html_e( 'To finish enabling Slack simulcasts, first invite the LivePress bot to #' . $slack_channel . ' on ' . $slack_team_domain . '.slack.com.<br>Once the bot is active you will receive instructions on the "verify" command.<br>You will need the following activation code: <span class="lp-verification-code">' . $verification_code . '</span><br>Contact <a href=\"mailto:support@livepress.com\">support@livepress.com</a> if you need further assistance.', 'livepress' ); ?></p>
        </div>
		<?php
	}

	/**
	 * API key form output.
	 */
	function api_key_form() {
		$settings = $this->settings;
		echo '<input type="text" name="livepress[api_key]" id="api_key" value="' . esc_attr( $settings->api_key ) . '">';
		echo '<input type="submit" class="button-secondary" id="api_key_submit" value="' . esc_html__( 'Check', 'livepress' ) . '" />';

		$options       = get_option( 'livepress', array() );
		$api_key       = isset( $options['api_key'] ) ? $options['api_key'] : '';
		$authenticated = $api_key && ! $options['error_api_key'];

		if ( $api_key && $options['error_api_key'] ) {
			$api_key_status_class = 'invalid_api_key';
			$api_key_status_text  = esc_html__( 'Key not valid', 'livepress' );
		} elseif ( $authenticated ) {
			$api_key_status_class = 'valid_api_key';
			$api_key_status_text  = esc_html__( 'Authenticated!', 'livepress' );
		} else {
			$api_key_status_class = '';
			$api_key_status_text  = esc_html__( 'Found in your welcome email!', 'livepress' );
		}

		echo '<span id="api_key_status" class="' . esc_attr( $api_key_status_class ) . '" >';
		echo esc_html( $api_key_status_text );
		echo '</span>';
	}

	/**
	 * Update format option form output.
	 */
	function update_format_form() {
		$settings = $this->settings;
		?>
        <p>
            <label>
                <input type="radio" name="livepress[update_format]" id="update_format" value="default" <?php echo checked( 'default', $settings->update_format, false ); ?> />
				<?php esc_html_e( 'Compact Format: the update metadata is shown inline,  preceding the content', 'livepress' ); ?>
            </label>
        </p>
        <p>
            <label>
                <input type="radio" name="livepress[update_format]" id="update_format" value="newstyle" <?php echo checked( 'newstyle', $settings->update_format, false ); ?> />
				<?php esc_html_e( 'Expanded Format: the update metadata is shown in a header above the content', 'livepress' ); ?>
            </label>
        </p>
		<?php
	}

	/**
	 * Timestamp format option form output.
	 */
	function timestamp_format_form() {
		$settings = $this->settings;
		?>
        <p>
            <label>
                <input type="radio" name="livepress[timestamp_format]" id="timestamp_format" value="timeago" <?php echo checked( 'timeago', $settings->timestamp_format, false ); ?> />
				<?php esc_html_e( 'Time since update', 'livepress' ); ?>
            </label>
        </p>
        <p>
            <label>
                <input type="radio" name="livepress[timestamp_format]" id="timestamp_format" value="timeof" <?php echo checked( 'timeof', $settings->timestamp_format, false ); ?> />
				<?php esc_html_e( 'Time of update', 'livepress' ); ?>
            </label>
        </p>
		<?php
	}

	/**
	 * Feed order form output.
	 */
	function feed_order_form() {
		$settings = $this->settings;
		?>
        <p>
            <label>
                <input type="radio" name="livepress[feed_order]" id="feed_order" value="top" <?php echo checked( 'top', $settings->feed_order, false ); ?> />
				<?php esc_html_e( 'Top (reverse chronological order, newest first)', 'livepress' ); ?>
            </label>
        </p>
        <p>
            <label>
                <input type="radio" name="livepress[feed_order]" id="feed_order" value="bottom" <?php echo checked( 'bottom', $settings->feed_order, false ); ?> />
				<?php esc_html_e( 'Bottom (chronological order, oldest first)', 'livepress' ); ?>
            </label>
        </p>
		<?php
	}

	/**
	 * Items to show.
	 */
	function show_form() {
		$settings = $this->settings;
		echo '<p><label><input type="checkbox" name="livepress[show][]" id="lp-notifications" value="AVATAR" ' .
		     checked( true, in_array( 'AVATAR', $settings->show ), false ) . '> ' . esc_html__( 'Show Avatar ( avatar shows to the left of the update )', 'livepress' ) . '</label></p>';
		echo '<p><label><input type="checkbox" name="livepress[show][]" id="lp-notifications" value="AUTHOR" ' .
		     checked( true, in_array( 'AUTHOR', $settings->show ), false ) . '> ' . esc_html__( 'Show Author', 'livepress' ) . '</label></p>';
		echo '<p><label><input type="checkbox" name="livepress[show][]" id="lp-notifications" value="TIME" ' .
		     checked( true, in_array( 'TIME', $settings->show ), false ) . '> ' . esc_html__( 'Show Time', 'livepress' ) . ' </label></p>';
		echo '<p><label><input type="checkbox" name="livepress[show][]" id="lp-notifications" value="HEADER" ' .
		     checked( true, in_array( 'HEADER', $settings->show ), false ) . '> ' . esc_html__( 'Show Headline', 'livepress' ) . ' </label></p>';
		echo '<p><label><input type="checkbox" name="livepress[show][]" id="lp-notifications" value="TAGS" ' .
		     checked( true, in_array( 'TAGS', $settings->show ), false ) . '> ' . esc_html__( 'Show tags', 'livepress' ) . ' </label></p>';
	}

	/**
	 * Notifications form.
	 */
	function notifications_form() {
		$settings = $this->settings;
		echo '<p><label><input type="checkbox" name="livepress[notifications][]" id="lp-notifications" value="tool-tip"
		' . checked( true, in_array( 'tool-tip', $settings->notifications ), false ) . '> ' . esc_html__( 'Tool-tip style popups', 'livepress' ) . '</label></p>';
		echo '<p><label><input type="checkbox" name="livepress[notifications][]" id="lp-notifications" value="audio" ' .
		     checked( true, in_array( 'audio', $settings->notifications ), false ) . '> ' . esc_html__( 'A soft chime (audio)', 'livepress' ) . '</label></p>';
		echo '<p><label><input type="checkbox" name="livepress[notifications][]" id="lp-notifications" value="effects" '
		     . checked( true, in_array( 'effects', $settings->notifications ), false ) . '> ' . esc_html__( 'Color highlight effect', 'livepress' ) . ' </label></p>';
	}

	/**
	 * Byline style form.
	 */
	function byline_style_form() {
		echo esc_html__( 'This setting may be removed in favor of a filter hook.', 'livepress' );
	}

	/**
	 * Allow remote Twitter form output.
	 */
	function allow_remote_twitter_form() {
		$settings = $this->settings;
		echo '<p><label><input type="checkbox" name="livepress[allow_remote_twitter]" id="lp-remote" value="allow"' .
		     checked( 'allow', $settings->allow_remote_twitter, false ) . '> ' . esc_html__( 'Allow', 'livepress' ) . '</label></p>';
	}

	/**
	 * Allow SMS form output.
	 */
	function allow_sms_form() {
		$settings = $this->settings;
		echo '<p><label><input type="checkbox" name="livepress[allow_sms]" id="lp-sms" value="allow"' .
		     checked( 'allow', $settings->allow_sms, false ) . '> ' . esc_html__( 'Allow', 'livepress' ) . '</label></p>';
	}

	/**
	 * Push to Twitter form output.
	 */
	function push_to_twitter_form() {
		$options    = get_option( 'livepress' );
		$oauth      = isset( $options['oauth_authorized_user'] ) ? trim( $options['oauth_authorized_user'] ) : '';
		$authorized = empty( $oauth ) ? 'false' : 'true';

		echo '<script type="text/javascript">var livepress_twitter_authorized=' . esc_js( $authorized ) . ';</script>';

		echo '<input type="submit" class="button-secondary" id="lp-post-to-twitter-change" value="' . esc_html__( 'Authorize', 'livepress' ) . '" />';
		echo '<div class="post_to_twitter_messages">';
		echo '<span id="post_to_twitter_message">';
		if ( 'true' == $authorized ) {
			echo esc_html__( 'Sending out alerts on Twitter account:', 'livepress' ) . ' <strong>' . esc_html( $options['oauth_authorized_user'] ) . '</strong>.';
		}
		echo '</span>';
		echo '<br /><a href="#" id="lp-post-to-twitter-change_link" style="display: none">' . esc_html__( 'Click here to change accounts.', 'livepress' ) . '</a>';
	}

	function facebook_app_id_form() {
		$options         = get_option( 'livepress' );
		$facebook_app_id = isset( $options['facebook_app_id'] ) ? trim( $options['facebook_app_id'] ) : '';

		echo '<input type="text" name="livepress[facebook_app_id]" id="facebook_app_id" value="' . esc_attr( $facebook_app_id ) . '">';
		echo '<br />' . sprintf( esc_html__( 'Supply an  app ID to enable the Facebook Share Dialog.%1$s
					By default LivePress will present a Feed Dialog for sharing to Facebook.%1$s ', 'livepress' ), '<br />' ) .
		     '<a href="http://help.livepress.com/" target="_blank" >' .
		     esc_html__( 'See our FAQ for more information.', 'livepress' ) . '</a>';
	}

	/**
	 * Slack team domain form output.
	 */
	function slack_team_domain_form() {
		$options           = get_option( 'livepress' );
		$slack_team_domain = isset( $options['slack_team_domain'] ) ? trim( $options['slack_team_domain'] ) : '';

		echo '<input type="text" style="text-align:right" name="livepress[slack_team_domain]" id="slack_team_domain" value="' . esc_attr( $slack_team_domain ) . '"><strong>.slack.com</strong>';
	}

	/**
	 * Slack channel form output.
	 */
	function slack_channel_form() {
		$options       = get_option( 'livepress' );
		$slack_channel = isset( $options['slack_channel'] ) ? trim( $options['slack_channel'] ) : '';

		echo '#<input type="text" name="livepress[slack_channel]" id="slack_channel" value="' . esc_attr( $slack_channel ) . '">';
		echo '<br />' . sprintf( esc_html__( 'Supply a Slack team domain and channel to allow you to interact with our Slack bot.%1$s
					This will let you simulcast Slack chats as LivePress live posts. ', 'livepress' ), '<br />' );
	}

	function filter_wp_dropdown_users_args( $query_args ) {
		$query_args['role'] = 'editor';

		return $query_args;
	}

	function slack_default_author_options() {
		$all_users      = get_users();
		$specific_users = array();

		foreach ( $all_users as $user ) {
			if ( $user->has_cap( 'publish_posts' ) && $user->has_cap( 'unfiltered_html' ) ) {
				$specific_users[] = $user->ID;
			}
		}

		return $specific_users;
	}

	/**
	 * Slack default author form output.
	 */
	function slack_default_author_form() {
		$options              = get_option( 'livepress' );
		$slack_default_author = isset( $options['slack_default_author'] ) ? trim( $options['slack_default_author'] ) : '';

		wp_dropdown_users( [
			'name'             => 'livepress[slack_default_author]',
			'id'               => 'slack_default_author',
			'selected'         => $slack_default_author,
			'show_option_none' => __( 'Select Slack Default Author' ),
			'orderby'          => 'ASC',
			'include'          => $this->slack_default_author_options(),
		] );

		echo '<br />' . sprintf( esc_html__( 'Choose the default author for Slack simulcast posts.  This is required for Slack simulcasts to work.  You may wish to create a special user for this purpose.  The user must have the ability to publish posts and create unfiltered HTML (typically, an Editor or Administrator).', 'livepress' ), '<br />' );
	}

	function sharing_ui_form() {
		$settings = $this->settings;
		echo '<p><label><input type="checkbox" name="livepress[sharing_ui]" id="lp-sharing-ui" value="display"' .
		     checked( 'display', $settings->sharing_ui, false ) . '> ' . esc_html__( 'Display', 'livepress' ) . '</label></p>';
	}

	/**
	 * Enabled-to form output.
	 */
	function enabled_to_form() {
		$settings = $this->settings;
		echo '<p><input type="text" name="livepress[enabled_to]" value="' . esc_attr( $settings->enabled_to ) . '"></p>';
	}

	function sanitize_and_validate_api_key( $input ) {
		$valid = true;

		if ( isset( $input['api_key'] ) ) {
			$api_key = sanitize_text_field( $input['api_key'] );

			if ( ! empty( $input['api_key'] ) ) {
				$livepress_com = new LivePress_Communication( $api_key );

				// Note: site_url is the admin url on VIP
				$validation             = $livepress_com->validate_on_livepress( site_url() );
				$input['api_key']       = $api_key;
				$input['error_api_key'] = ( $validation != 1 );

				if ( $validation == 1 ) {
					// We pass validation, update blog parameters from LP side
					$blog = $livepress_com->get_blog();

					$input['blog_shortname']             = isset( $blog->shortname ) ? $blog->shortname : '';
					$input['post_from_twitter_username'] = isset( $blog->twitter_username ) ? $blog->twitter_username : '';
					$input['api_key']                    = $api_key;
				} else {
					add_settings_error( 'api_key', 'invalid', esc_html__( 'Key is not valid', 'livepress' ) );
					$valid = false;
				}
			} else {
				$input['api_key'] = $api_key;
			}
		}

		return $valid;
	}

	/**
	 * Sanitize form data.
	 *
	 * @param array $input Raw form input.
	 *
	 * @return array Sanitized form input.
	 */
	function sanitize( $input ) {
		// clear the blog detail cache
		delete_transient( 'lp_blog_details' );

		if ( isset( $input['error_api_key'] ) ) {
			$sanitized_input['error_api_key'] = $input['error_api_key'];
		} else {
			$sanitized_input['error_api_key'] = false;
		}

		if ( isset( $input['api_key'] ) ) {
			$sanitized_input['api_key'] = sanitize_text_field( $input['api_key'] );
		}

		if ( isset( $input['feed_order'] ) && $input['feed_order'] == 'bottom' ) {
			$sanitized_input['feed_order'] = 'bottom';
		} else {
			$sanitized_input['feed_order'] = 'top';
		}

		if ( isset( $input['timestamp_format'] ) && $input['timestamp_format'] == 'timeof' ) {
			$sanitized_input['timestamp_format'] = 'timeof';
		} else {
			$sanitized_input['timestamp_format'] = 'timeago';
		}

		$sanitized_input['update_format'] = 'default';
		if ( isset( $input['update_format'] ) && 'newstyle' === $input['update_format'] ) {
			$sanitized_input['update_format'] = 'newstyle';
		} else {
			$sanitized_input['update_format'] = 'default';
		}

		if ( isset( $input['show'] ) && ! empty( $input['show'] ) ) {
			$sanitized_input['show'] = array_map( 'sanitize_text_field', $input['show'] );
		} else {
			$sanitized_input['show'] = array();
		}

		if ( isset( $input['notifications'] ) && ! empty( $input['notifications'] ) ) {
			$sanitized_input['notifications'] = array_map( 'sanitize_text_field', $input['notifications'] );
		} else {
			$sanitized_input['notifications'] = array();
		}

		if ( isset( $input['allow_remote_twitter'] ) ) {
			$sanitized_input['allow_remote_twitter'] = 'allow';
		} else {
			$sanitized_input['allow_remote_twitter'] = 'deny';
		}

		if ( isset( $input['oauth_authorized_user'] ) ) {
			$sanitized_input['oauth_authorized_user'] = sanitize_text_field( $input['oauth_authorized_user'] );
		}

		if ( isset( $input['allow_sms'] ) ) {
			$sanitized_input['allow_sms'] = 'allow';
		} else {
			$sanitized_input['allow_sms'] = 'deny';
		}

		if ( isset( $input['post_to_twitter'] ) ) {
			$sanitized_input['post_to_twitter'] = (bool) $input['post_to_twitter'];
		}

		if ( isset( $input['sharing_ui'] ) ) {
			$sanitized_input['sharing_ui'] = 'display';
		} else {
			$sanitized_input['sharing_ui'] = 'dont_display';
		}

		if ( isset( $input['facebook_app_id'] ) ) {
			$sanitized_input['facebook_app_id'] = sanitize_text_field( $input['facebook_app_id'] );
		} else {
			$sanitized_input['facebook_app_id'] = '';
		}

		if ( isset( $input['slack_team_domain'] ) ) {
			$sanitized_input['slack_team_domain'] = sanitize_text_field( $input['slack_team_domain'] );
		} else {
			$sanitized_input['slack_team_domain'] = '';
		}

		if ( isset( $input['slack_channel'] ) ) {
			$sanitized_input['slack_channel'] = sanitize_text_field( $input['slack_channel'] );
		} else {
			$sanitized_input['slack_channel'] = '';
		}

		if ( isset( $input['slack_default_author'] ) ) {
			$sanitized_input['slack_default_author'] = $input['slack_default_author'];
		}

		$merged_input = wp_parse_args( $sanitized_input, (array) $this->settings ); // For the settings not exposed

		return $merged_input;
	}

	function show_slack_verification_notice() {
		if ( $this->options['slack_verification_pending'] &&
		     isset( $this->options['slack_team_domain'] ) &&
		     isset( $this->options['slack_channel'] )
		) {
			$livepress_com = new LivePress_Communication( $this->options['api_key'] );
			$return_code   = $livepress_com->slack_verification_code( $this->options['slack_team_domain'], $this->options['slack_channel'] );
			$json_response = $livepress_com->get_last_response();
			$return_data   = json_decode( $json_response );
			if ( 200 === $return_code ) {
				if ( $return_data->verification_pending ) {
					$this->slack_verification_notice( $this->options['slack_team_domain'], $this->options['slack_channel'], $return_data->verification_code );

				} else {
					$this->options['slack_verification_pending'] = false;
					update_option( LivePress_Administration::$options_name, $this->options );
				}
			} else {
				add_settings_error( 'slack_team_domain', 'invalid', esc_html__( 'An unexpected error has occurred. ' . $return_data->message, 'livepress' ) );
			}
		}
	}

	/**
	 * Settings page display.
	 */
	function render_settings_page() {
		?>
        <div class="wrap">
        <form action="options.php" method="post">
		<h2><?php esc_html_e( 'LivePress Settings', 'livepress' ); ?></h2>
		<?php
		$this->options = get_option( LivePress_Administration::$options_name );
		// If the API key is blank and the show=enter-api-key toggle is not passed, prompt the user to register
		if ( ( ! ( isset( $_GET['show'] ) && 'enter-api-key' == $_GET['show'] ) ) && empty( $this->options['api_key'] ) && ! isset( $_POST['submit'] ) ) {
			echo '<div class="updated" style="padding: 0; margin: 0; border: none; background: none;">
							<div class="livepress_admin_warning">
								<div class="aa_button_container" onclick="window.open(\'http://www.livepress.com\', \'_blank\' );">
									<div class="aa_button_border">
										<div class="aa_button">' . esc_html__( 'Sign up for LivePress' ) . '</div>
									</div>
								</div>
								<div class="aa_description">
									<a href = "' . esc_url( add_query_arg( array( 'page' => 'livepress-settings' ), admin_url( 'options-general.php' ) ) ) .
			     '&show=enter-api-key">' .
			     esc_html__( 'I have already signed up for a LivePress account', 'livepress' ) . '</a></div>
							</div>
					</div>
				';
		} else {
			// Otherwise, display the settings page as usual
			$this->show_slack_verification_notice();
			?>
			<?php settings_fields( 'livepress' ); ?>
			<?php do_settings_sections( 'livepress-settings' ); ?>
			<?php wp_nonce_field( 'activate_license', '_lp_nonce' ); ?>
			<?php submit_button(); ?>
            </form>
            </div>
			<?php
		}
	}
}

$livepress_admin_settings = new LivePress_Admin_Settings();
