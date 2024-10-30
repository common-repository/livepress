<?php

/**
 * Module to handle creating the ld+json for Google liveblogs data.
 *
 * @module LivePress
 * @since  1.3.5.2
 */
class Json_Ld {

	static $parent_url;

	static $found_authors;

	static $date_format = 'm-d-Y H:i T';

	public function __construct() {
		add_action( 'add_meta_boxes', array( __CLASS__, 'add_meta_box' ) );
		add_action( 'save_post', array( __CLASS__, 'save' ) );
		add_action( 'save_draft', array( __CLASS__, 'save' ) );
	}


	/**
	 * creates the json header fron Ld+json block for liveblogs
	 * https://developers.google.com/structured-data/carousels/live-blogs?hl=en
	 *
	 * @return mixed
	 */
	public static function header() {
		$parent_id = get_the_ID();
		$meta = get_post_meta( $parent_id, '_livepress_json_ld', true );

		$data['@context'] = 'http://schema.org';
		$data['@type'] = 'LiveBlogPosting';
		/**
		 * Filter to allow to override post URL in Ld+json.
		 *
		 * @since 1.3.5.2
		 *
		 * @param string $permalink parent post URL.
		 * @param int $parent_id parent post id.
		 */
		$data['url'] = self::$parent_url = apply_filters( 'LP_json_ld_parent_url', get_permalink(), $parent_id );

		/**
		 * Filter to allow to override featured image for the about section in Ld+json.
		 *
		 * @since 1.3.18
		 *
		 * @param string $permalink parent post URL.
		 * @param int $parent_id parent post id.
		 */
		$thumbnail = apply_filters( 'LP_json_ld_parent_image', get_the_post_thumbnail_url( $parent_id ), $parent_id );
		if ( false !== $thumbnail ) {
			$data['image'] = self::$parent_url = $thumbnail;
		}

		$about['@type'] = 'Event';

		if ( isset( $meta['parent_title'] ) && ! empty( $meta['parent_title'] ) ) {
			$about_name = $meta['parent_title'];
		} else {
			$about_name = get_the_title( $parent_id );
		}
		/**
		 * Filter to allow to override parent name in Ld+json.
		 * uses post title if none set
		 *
		 * @since 1.3.5.2
		 *
		 * @param string $about_name default parent post title.
		 * @param int $parent_id parent post id.
		 */
		$about['name'] = apply_filters( 'LP_json_ld_parent_title', $about_name, $parent_id );

		if ( isset( $meta['parent_same_as_url'] ) && ! empty( $meta['parent_same_as_url'] ) ) {
			$about_same_as_url = $meta['parent_same_as_url'];

			/**
			 * Filter to allow to override parent name in Ld+json.
			 * uses post title if none set
			 *
			 * @since 1.3.5.2
			 *
			 * @param string $about_name default parent post title.
			 * @param int $parent_id parent post id.
			 */
			$about['sameAs'] = apply_filters( 'LP_json_ld_parent_same_as_url', $about_same_as_url, $parent_id );
		}

		if ( isset( $meta['about_location'] ) && ! empty( $meta['about_location'] ) ) {
			/**
			 * Filter to allow to override location in Ld+json.
			 *
			 * @since 1.3.5.2
			 *
			 * @param object $about_location json decoded object.
			 * @param int $parent_id parent post id.
			 */
			$about['location'] = apply_filters( 'LP_json_ld_parent_about_location', $meta['about_location'], $parent_id );
		}

		if ( isset( $meta['coverage_start_time'] ) && ! empty( $meta['coverage_start_time'] ) ) {
			/**
			 * Filter to allow to override the full coverage start time  block in Ld+json.
			 * uses post title if none set
			 *
			 * @since 1.3.5.2
			 *
			 * @param string $coverage_start_time .
			 * @param int $parent_id parent post id.
			 */
			$data['coverageStartTime'] = apply_filters( 'LP_json_ld_parent_coverage_start_time', self::format_date_to_8601( $meta['coverage_start_time'] ), $parent_id );
		}

		if ( isset( $meta['coverage_end_time'] ) && ! empty( $meta['coverage_end_time'] ) ) {
			/**
			 * Filter to allow to override the coverage end time in Ld+json.
			 * uses post title if none set
			 *
			 * @since 1.3.5.2
			 *
			 * @param string $coverage_end_time .
			 * @param int $parent_id parent post id.
			 */
			$data['coverageEndTime'] = apply_filters( 'LP_json_ld_parent_coverage_end_time', self::format_date_to_8601( $meta['coverage_end_time'] ), $parent_id );
		}
		$parent_start_date = false;
		if ( isset( $meta['parent_start_date'] ) && ! empty( $meta['parent_start_date'] ) ) {
			$parent_start_date = $meta['parent_start_date'];
		} elseif ( isset( $meta['coverage_start_time'] ) && ! empty( $meta['coverage_start_time'] ) ) {
			$parent_start_date = $meta['coverage_start_time'];
		}

		if ( false !== $parent_start_date ) {
			/**
			 * Filter to allow to override start date in Ld+json.
			 *
			 * @since 1.3.5.2
			 *
			 * @param string $start_date post date.
			 * @param int $parent_id parent post id.
			 */
			$about['startDate'] = apply_filters( 'LP_json_ld_parent_start_date', self::format_date_to_8601( $parent_start_date ), $parent_id );
		}

		if ( isset( $meta['parent_headline'] ) && ! empty( $meta['parent_headline'] ) ) {
			$headline = $meta['parent_headline'];
		} else {
			$headline = get_the_title( $parent_id );
		}
		/**
		 * Filter to allow to override parent name in Ld+json.
		 * uses post title if none set
		 *
		 * @since 1.3.5.2
		 *
		 * @param string $headline default parent post title.
		 * @param int $parent_id parent post id.
		 */
		$about['name'] = apply_filters( 'LP_json_ld_parent_headline', $headline, $parent_id );

		if ( isset( $meta['parent_description'] ) && ! empty( $meta['parent_description'] ) ) {
			$description = $meta['parent_description'];
		} else {
			$description = sprintf( _x( 'A Live Blog from %s', 'name of blog', 'livepress' ), get_bloginfo( 'name' ) );
		}
		/**
		 * Filter to allow to override the coverage end time in Ld+json.
		 * uses post title if none set
		 *
		 * @since 1.3.5.2
		 *
		 * @param string $description .
		 * @param int $parent_id parent post id.
		 */
		$data['description'] = apply_filters( 'LP_json_ld_parent_description', $description, $parent_id );
		/**
		 * Filter to allow to override the full about block in Ld+json.
		 * uses post title if none set
		 *
		 * @since 1.3.5.2
		 *
		 * @param array $about json decoded object.
		 * @param int $parent_id parent post id.
		 */
		$data['about'] = apply_filters( 'LP_json_ld_parent_about', $about, $parent_id );

		return $data;
	}


	/**
	 * @param $json_ld
	 * @param $piece
	 *
	 * @return mixed
	 */
	public static function pass_update( $json_ld, $piece ) {

		$update_id = $piece['id'];
		$content = $piece['content'];
		$update['@type'] = 'BlogPosting';

		preg_match( '/\[livepress_metainfo.*update_header=.?"(.*?)".*\]/', $content, $headline_block );

		if ( ! empty( $headline_block ) ) {
			$headline_block = urldecode( $headline_block[1] );

		} else {

			/**
			 * Filter to allow to override the headline fail back in Ld+json.
			 * uses post title if none set
			 *
			 * @since 1.3.18
			 *
			 * @param string $title the parent post tilte .
			 * @param int $update_id current update id.
			 */
			$headline_block = apply_filters( 'LP_json_ld_update_header_in_none_in_update', get_the_title(), $update_id );
		}

		/**
		 * Filter to allow to override the headline in Ld+json.
		 * uses post title if none set
		 *
		 * @since 1.3.5.2
		 *
		 * @param string headline .
		 * @param int $update_id current update id.
		 */
		$update['headline'] = apply_filters( 'LP_json_ld_update_header', $headline_block, $update_id );

		preg_match( '/\[livepress_metainfo.*authors="(.*?)".*\]/', $content, $author_block );

		if ( isset( $author_block[1] ) && ! empty( $author_block[1] ) ) {
			$author_names = $author_block[1];

			$checked_author = array();
			$authors = explode( '|', $author_names );
			foreach ( $authors as $author ) {
				if ( isset( self::$found_authors[ $author ] ) ) {
					if ( false === self::$found_authors[ $author ] ) {
						$checked_author[] = $author;
					} else {
						$checked_author[] = self::$found_authors[ $author ];
					}
					continue;
				}
				$user_by_login = get_user_by( 'login', $author );
				if ( false === $user_by_login ) {
					self::$found_authors[ $author ] = false;
					$checked_author[] = $author;
				} else {
					self::$found_authors[ $author ] = $user_by_login->display_name;
					$checked_author[] = $user_by_login->display_name;
				}
			}

			/* Filter to allow to override the update URL in Ld+json.
			 * uses post title if none set
			                           *
			 * @since 1.3.5.2
			               *
			 * @param string $author_names       .
			 * @param int    $update_id current update id.
			 */
			$update['author']['name'] = apply_filters( 'LP_json_ld_update_author_name', implode( ' | ', $checked_author ), $update_id );
		}
		$lpup = sprintf( '%1$d#livepress-update-%1$d', $update_id );
		$update_url = add_query_arg( array( 'lpup' => $lpup ), self::$parent_url );
		/**
		 * Filter to allow to override the update URL in Ld+json.
		 * uses post title if none set
		 *
		 * @since 1.3.5.2
		 *
		 * @param string $url .
		 * @param int $update_id current update id.
		 */
		$update['url'] = apply_filters( 'LP_json_ld_update_url', $update_url, $update_id );

		preg_match( '/\[livepress_metainfo.*timestamp=.?"(.*?)".*\]/', $content, $timestamp );

		// if we are missing a timestamp get it from the post
		if ( empty( $timestamp ) ) {
			$post = LivePress_PF_Updates::get_instance()->get_update_by_lp_update_id( get_the_ID(), $update_id );
			$timestamp[1] = date( 'c', strtotime( $post->post_date_gmt ) );
		}

		if ( ! empty( $timestamp ) ) {
			/**
			 * Filter to allow to override the coverage end time in Ld+json.
			 * uses post title if none set
			 *
			 * @since 1.3.5.2
			 *
			 * @param string $description .
			 * @param int $update_id current update id.
			 */
			$update['datePublished'] = apply_filters( 'LP_json_ld_update_time', $timestamp[1], $update_id );
		}
		$blogging_tools = new LivePress_Blogging_Tools;
		$html = preg_replace( '/\[livepress_metainfo.*?\]/', '', $content );
		$html = $blogging_tools->remove_author_info( $html );
		$html = preg_replace( '/\[\/livepress_metainfo\]/', '', $html );
		$html = trim( $html );

		if ( ! empty( $html ) ) {
			/**
			 * Filter to allow to override the raw html in Ld+json.
			 * uses post title if none set
			 *
			 * @since 1.3.5.2
			 *
			 * @param string $html .
			 * @param int $update_id current update id.
			 */
			$html = apply_filters( 'LP_json_ld_update_article_body_raw', trim( $html ), $update_id );
			//TODO:  handle tweets from do_shortcode as removed

			$has_tweet = self::has_tweet( $html );

			if ( $has_tweet ) {
				$html = self::unwrap_embeds( $html );
			}

			$html = do_shortcode( $html ); // just in-case to remove them

			if ( self::content_is_just_image( $html ) ) {
				$img_url = self::get_url_from_image( trim( $html ) );
				/**
				 * Filter to allow to override the process html in Ld+json.
				 * uses post title if none set
				 *
				 * @since 1.3.5.2
				 *
				 * @param string $html .
				 * @param int $update_id current update id.
				 */
				$update['image'] = esc_url( apply_filters( 'LP_json_ld_update_image_url', $img_url, $update_id ) );

			} elseif ( self::content_has_video_link( $html ) ) {

				// get url from html
				$reg_ex_url = '/[^\/\/|(http|https)\:\/\/][a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?/';
				preg_match( $reg_ex_url, $html, $url );
				if ( ! empty( $url ) ) {
					$thumbnail_url = self::get_thumbnail_url_for_url( trim( $url[0] ) );
					/**
					 * Filter to allow to override the process html in Ld+json.
					 * uses post title if none set
					 *
					 * @since 1.3.5.2
					 *
					 * @param string $html .
					 * @param int $update_id current update id.
					 */
					$update['video']['@type'] = 'VideoObject';
					$update['video']['thumbnail'] = apply_filters( 'LP_json_ld_update_video_thumbnail_url', trim( $thumbnail_url ), trim( $html ), $update_id );

					/**
					 * Filter to allow to override the process html in Ld+json.
					 * uses post title if none set
					 *
					 * @since 1.3.5.2
					 *
					 * @param string $html .
					 * @param int $update_id current update id.
					 */
					$update['video']['contentUrl'] = apply_filters( 'LP_json_ld_update_video_url', trim( $url[0] ), $update_id );
					$text = str_replace( $url[0], '', $html );

					if ( 0 !== strlen( trim( $text ) ) ) {
						$update['articleBody']['@value'] = apply_filters( 'LP_json_ld_update_article_body', trim( $text ), $update_id );
						$update['articleBody']['@type'] = 'rdf:HTML';
					}
				}
			} else {
				$img_url = self::get_url_from_image( trim( $html ) );
				if ( false !== $img_url ) {
					$update['image'] = esc_url( apply_filters( 'LP_json_ld_update_image_url', $img_url, $update_id ) );
				} else {
					/**
					 * Filter to allow to override image in a text update in Ld+json.
					 *
					 * @since 1.3.18
					 *
					 * @param string $permalink parent post URL.
					 * @param int $update_id current update id.
					 * @param int $parent_id parent post id.
					 */
					$thumbnail = apply_filters( 'LP_json_ld_update_default_thumbnail_url', get_the_post_thumbnail_url( get_the_ID() ), $update_id , get_the_ID() );
					if ( false !== $thumbnail ) {
						$update['image'] = self::$parent_url = $thumbnail;
					}
				}

				if ( $has_tweet ) {

					$tweet_data = self::process_tweet( $html );
					// in case the URL is bad and we get no data back
					if ( ! empty( $tweet_data ) && false !== $tweet_data ) {

						$html = $tweet_data['html'];

						if ( isset( $tweet_data['twitter_thumbnail'] ) && false !== $tweet_data['twitter_thumbnail'] ) {
							$update['image'] = apply_filters( 'LP_json_ld_update_image_url', $tweet_data['twitter_thumbnail'], $update_id );
						}
						if ( isset( $tweet_data['twitter_video'] ) && false !== $tweet_data['twitter_video'] ) {
							$update['video']['contentUrl'] = esc_url( $tweet_data['twitter_video'] );
							$update['video']['thumbnail'] = esc_url( apply_filters( 'LP_json_ld_update_video_thumbnail_url', trim( $tweet_data['twitter_thumbnail'] ), trim( $html ), $update_id ) );
							$update['video']['@type'] = 'VideoObject';
						}
					}
				}
				$text = '';
				if ( ! empty( $html ) ) {
					$text = strip_tags( trim( $html ), '<br><br />' );
					$text = preg_replace( '/\n/', '<br />', trim( $text ) );
				}

				/**
				 * Filter to allow to override the process html in Ld+json.
				 * uses post title if none set
				 *
				 * @since 1.3.5.2
				 *
				 * @param string $html .
				 * @param int $update_id current update id.
				 */
				$update['articleBody']['@value'] = apply_filters( 'LP_json_ld_update_article_body', trim( $text ), $update_id );
				$update['articleBody']['@type'] = 'rdf:HTML';

			}
		}

		// convert html entities
		if ( isset( $update['articleBody']['@value'] ) ) {
			$update['articleBody']['@value'] = html_entity_decode( $update['articleBody']['@value'], ENT_COMPAT | ENT_HTML401, 'utf-8' );
		}
		if ( isset( $update['headline'] ) ) {
			$update['headline'] = html_entity_decode( $update['headline'], ENT_COMPAT | ENT_HTML401, 'utf-8' );
		}

		/**
		 * Filter to allow to override the blog posting in Ld+json.
		 *         *
		 * @since 1.3.5.2
		 *
		 * @param string $html .
		 * @param wp_post $piece current update.
		 */
		$json_ld['liveBlogUpdate'][] = apply_filters( 'LP_json_ld_update_article_final', $update, $piece );

		return $json_ld;
	}

	/**
	 * format the date
	 *
	 * @param $date
	 *
	 * @return string
	 */
	private static function format_date_to_8601( $date ) {

		$utc = DateTime::createFromFormat( self::$date_format, $date );
		$utc->setTimezone( new DateTimeZone( 'UTC' ) );

		return $utc->format( 'c' );
	}

	/**
	 * format the date to blog timezone
	 *
	 * @param $date
	 *
	 * @return string
	 */
	private static function format_date_to_wp_timezone( $date ) {
		if ( empty( $date ) ) {
			return $date;
		}

		$new_date = DateTime::createFromFormat( self::$date_format, $date );
		$timezone_string = get_option( 'timezone_string' );
		$timezone_string = ( '' !== $timezone_string ) ? $timezone_string : 'Europe/London';
		$new_date->setTimezone( new DateTimeZone( $timezone_string ) );

		return $new_date->format( self::$date_format );
	}

	/**
	 * format the date to blog timezone
	 *
	 * @param $date
	 *
	 * @return string
	 */
	private static function format_date_to_utc( $date ) {
		if ( empty( $date ) ) {
			return $date;
		}

		$date = str_replace( 'UTC', '', $date );
		$new_date = DateTime::createFromFormat( self::$date_format, $date );
		$new_date->setTimezone( new DateTimeZone( 'UTC' ) );

		return $new_date->format( self::$date_format );
	}

	/**
	 * looks for twitter url in content and return true if found
	 *
	 * @static
	 *
	 * @param $html
	 *
	 * @return bool
	 */
	private static function has_tweet( $html ) {

		$regex = '/(https?):\/\/[-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/i';

		preg_match( $regex, $html, $url );

		if ( $url ) {
			if ( empty( $url[0] ) ) {

				return false;
			}

			/**
			 * Filter to allow to override the twitter URL.
			 *
			 * @since 1.3.5.2
			 *
			 * @param string $html .
			 * @param int $parent_id update post id.
			 */
			$twitter_urls = apply_filters( 'LP_json_ld_video_site_named', array( 'twitter.com', 't.co' ) );
			foreach ( $twitter_urls as $twitter ) {
				if ( strpos( $url[0], $twitter ) ) {

					return true;
				}
			}
		}

		return false;
	}


	/**
	 * removes the embed shortcode from content
	 *
	 * @static
	 *
	 * @param $html
	 *
	 * @return string
	 */
	private static function unwrap_embeds( $html ) {

		$html = str_replace( '[embed]', '', str_replace( '[/embed]', '', $html ) );

		return $html;
	}

	private static function process_tweet( $html ) {

		$output = array( 'html' => $html, 'twitter_thumbnail' => false, 'twitter_video' => false );
		// get the twiter URL
		$reg_ex_url = '#https?://(www\.)?(twitter\.com|t.co)/.+?/status(es)?/[0-9]*#i';
		preg_match( $reg_ex_url, $html, $url );

		// empty array
		if ( empty( $url ) ) {
			return false;
		}

		// get url from array
		$url = $url[0];

		// return early if empty URL
		if ( empty( $url ) ) {
			return false;
		}

		$transit_id = 'LP-open-graph-data';
		$transit_key = md5( $url );

		$open_graph_data = get_transient( $transit_id );

		if ( false === $open_graph_data || ! isset( $open_graph_data[ $transit_key ] ) ) {
			try {
				$scraper = new SimpleScraper( esc_url( $url ) );
				$open_graph_data[ $transit_key ] = $scraper->getOgp();

			} catch ( Exception $e ) {
				return false;
			}
			// lets get the username
			$username_text = self::get_twitter_username_from_url( $open_graph_data[ $transit_key ]['url'] );
			$open_graph_data[ $transit_key ]['twitter_username'] = $username_text;

			// spilt the description to get any link url
			preg_match( '/^“(.*?)(http.*?$)/', $open_graph_data[ $transit_key ]['description'], $description );

			// then try to get an image from the URL
			if ( ! empty( $description ) && isset( $description[2] ) && ! empty( $description[2] ) ) {
				$twitter_link_graph_data = self::get_open_graph_data_for_url( $description[2] );

				if ( ! empty( $twitter_link_graph_data ) && false !== $twitter_link_graph_data ) {

					$open_graph_data[ $transit_key ]['twitter_thumbnail'] = $twitter_link_graph_data['image'];

					if ( isset( $twitter_link_graph_data['type'] ) && 'video' === $twitter_link_graph_data['type'] ) {
						if ( isset( $twitter_link_graph_data['video:url'] ) ) {
							$open_graph_data[ $transit_key ]['twitter_video'] = $twitter_link_graph_data['video:url'];
						} elseif ( isset( $twitter_link_graph_data['url'] ) ) {
							$open_graph_data[ $transit_key ]['twitter_video'] = $twitter_link_graph_data['url'];
						}
					}
				}
			}

			// and save the rest of the description as
			if ( ! empty( $description ) && isset( $description[1] ) ) {
				$open_graph_data[ $transit_key ]['twitter_text'] = $username_text . $description[1];
			} else {
				$cleaned = preg_replace( '/“|”/', '', $open_graph_data[ $transit_key ]['description'] );
				$open_graph_data[ $transit_key ]['twitter_text'] = $cleaned;
			}

			set_transient( $transit_id, $open_graph_data, HOUR_IN_SECONDS );
		}

		$twitter_thumbnail = false;
		if ( isset( $open_graph_data[ $transit_key ]['twitter_thumbnail'] ) ) {
			$twitter_thumbnail = $open_graph_data[ $transit_key ]['twitter_thumbnail'];
		}

		$output['twitter_thumbnail'] = $twitter_thumbnail;

		$twitter_video = false;
		if ( isset( $open_graph_data[ $transit_key ]['twitter_video'] ) ) {
			$twitter_video = $open_graph_data[ $transit_key ]['twitter_video'];
		}

		$output['twitter_video'] = $twitter_video;

		$twitter_text = $open_graph_data[ $transit_key ]['twitter_text'];

		// we want to add br's around the tweet if we have other content
		$html_bits = explode( $url, $html );
		if ( 0 < strlen( $html_bits[0] ) ) {
			$twitter_text = '<br />' . $twitter_text;
		}
		if ( 0 < strlen( $html_bits[1] ) ) {
			$twitter_text = $twitter_text . '<br />';
		}
		// replace the URL in html with the tweet text
		// Trim the html_bits to remove line returns
		$output['html'] = trim( $html_bits[0] ) . $twitter_text . trim( $html_bits[1] );

		return $output;
	}


	/**
	 * get the username from URL and foramat
	 *
	 * @static
	 *
	 * @param $url
	 *
	 * @return string
	 */
	private static function get_twitter_username_from_url( $url ) {
		$bits = explode( '/', $url );
		if ( ! empty( $bits ) && isset( $bits[3] ) ) {
			/**
			 * Filter to allow to override the text wrapping a twitter username.
			 *
			 * @since 1.3.5.3
			 *
			 * @param string $text .
			 */
			return sprintf( apply_filters( 'LP_json_ld_twitter_username_wrap', __( '@%s: ', 'gradds' ) ), $bits[3] );
		}

		return '';
	}


	/**
	 * @param $html
	 *
	 * @return bool
	 */
	private static function content_has_video_link( $html ) {

		$regex = '/[^\/\/|(https?):\/\/][-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/i';

		preg_match( $regex, $html, $url );

		if ( $url ) {
			if ( empty( $url[0] ) ) {

				return false;
			}

			/**
			 * Filter to allow to override the video names.
			 *
			 * @since 1.3.5.2
			 *
			 * @param string $html .
			 * @param int $parent_id update post id.
			 */
			$video_names = apply_filters( 'LP_json_ld_video_site_named', array( 'youtu', 'vimeo', 'ooyala' ) );
			foreach ( $video_names as $video_name ) {
				if ( strpos( $url[0], $video_name ) ) {

					return true;
				}
			}
		}

		return false;
	}

	/**
	 * @param $html
	 *
	 * @return bool
	 */
	private static function content_is_just_image( $html ) {

		$return = false;
		if ( preg_match( '/^<img.*?>$/', $html ) ) {
			$return = true;
		}

		if ( preg_match( '/^<figure.*?<img.*?><\/figure>$/', $html ) ) {
			$return = true;
		}

		/**
		 *Filter to allow to override the output from content_is_just_image.
		 *
		 * @since 1.3.5.2
		 *
		 * @param bool $return current value.
		 * @param string $html .
		 *
		 */
		return (bool) apply_filters( 'LP_content_is_just_image', $return, $html );
	}


	private static function get_url_from_image( $html ) {
		preg_match( '/<img.*?src=[\' | "](.*?)[\'|"]/', $html, $src );
		if ( empty( $src ) ) {
			return false;
		}

		/**
		 * Filter to allow to override the output from get_url_from_image.
		 *
		 * @since 1.3.5.2
		 *
		 * @param string $src value.
		 * @param string $html .
		 *
		 */
		return apply_filters( 'LP_get_url_from_image', $src[1], $html );
	}


	/**
	 * http://stackoverflow.com/questions/2068344/how-do-i-get-a-youtube-video-thumbnail-from-the-youtube-api
	 *
	 * @param $url
	 *
	 * @return string
	 */
	private static function get_open_graph_data_for_url( $url ) {
		if ( empty( $url ) ) {
			return false;
		}
		$transit_id = 'LP-open-graph-data';
		$transit_key = md5( $url );

		$open_graph_data = get_transient( $transit_id );

		if ( false === $open_graph_data || ! isset( $open_graph_data[ $transit_key ] ) ) {
			try {
				$scraper = new SimpleScraper( esc_url( $url ) );
				$open_graph_data[ $transit_key ] = $scraper->getOgp();

				set_transient( $transit_id, $open_graph_data, HOUR_IN_SECONDS );
			} catch ( Exception $e ) {
				error_log( 'Caught SimpleScrape exception: ' . $e->getMessage() );

				return false;
			}

		}

		return $open_graph_data[ $transit_key ];
	}

	private static function get_thumbnail_url_for_url( $url ) {

		$open_graph_data = self::get_open_graph_data_for_url( $url );

		if ( isset( $open_graph_data['image'] ) && false !== $open_graph_data ) {
			return $open_graph_data['image'];
		}

		return '';
	}


	/**
	 * create an script tag and output it
	 *
	 * @param array $json_ld
	 * @param bool $echo
	 *
	 * @param bool $pretty
	 *
	 * @return string
	 */
	public static function render_json_block( $json_ld, $echo = false, $pretty = false ) {

		$depth = apply_filters( 'LP_json_ld_depth', 1024 );
		$options = apply_filters( 'LP_json_ld_options', JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
		if ( ( defined( 'SCRIPT_DEBUG' ) && true === SCRIPT_DEBUG ) || $pretty ) {
			$options = $options | JSON_PRETTY_PRINT;
		}

		/**
		 * Filter to allow to override the output to the page.
		 *
		 * @since 1.3.5.2
		 *
		 * @param string $src value.
		 * @param string $html .
		 *
		 */
		$json_ld = apply_filters( 'LP_json_ld_full_array', $json_ld );

		$output = sprintf( '<script type="application/ld+json">%s</script>', str_replace( '</', '<\/', wp_json_encode( $json_ld, $options, $depth ) ) );

		if ( $echo ) {
			echo $output;

			return true;
		}

		return $output;
	}


	/**
	 * Adds the meta box container.
	 *
	 * @param $post_type
	 */
	public static function add_meta_box( $post_type ) {

		if ( ! in_array( $post_type, apply_filters( 'livepress_post_types', array( 'post' ) ) ) ) {
			return;
		}
		$blogging_tools = new LivePress_Blogging_Tools();
		if ( ! $blogging_tools->get_post_live_status( get_the_ID() ) ) {
			return;
		}

		add_meta_box(
			'lp-json-ld-config'
			, __( 'Schema.org Live Blog Posting Metadata', 'livepress' )
			, array( __CLASS__, 'render_meta_box_content' )
			, $post_type
			, 'side'
			, 'low'
		);
	}


	/**
	 * Save the meta when the post is saved.
	 *
	 * @param int $post_id The ID of the post being saved.
	 *
	 * @return int
	 */
	public static function save( $post_id ) {

		/*
		 * We need to verify this came from the our screen and with proper authorization,
		 * because save_post can be triggered at other times.
		 */

		// Check if our nonce is set.
		if ( ! isset( $_POST['livepress_json_ld_nonce'] ) ) {
			return $post_id;
		}

		$nonce = $_POST['livepress_json_ld_nonce'];

		// Verify that the nonce is valid.
		if ( ! wp_verify_nonce( $nonce, 'livepress_json_ld' ) ) {
			return $post_id;
		}

		// If this is an autosave, our form has not been submitted,
		// so we don't want to do anything.
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return $post_id;
		}

		// Check the user's permissions.
		if ( 'page' == $_POST['post_type'] ) {
			if ( ! current_user_can( 'edit_page', $post_id ) ) {
				return $post_id;
			}
		} else {
			if ( ! current_user_can( 'edit_post', $post_id ) ) {
				return $post_id;
			}
		}

		/* OK, its safe for us to save the data now. */
		$data = array();

		if ( isset( $_POST['LP_json_ld_parent_title'] ) ) {
			// Sanitize the user input.
			$data['parent_title'] = sanitize_text_field( $_POST['LP_json_ld_parent_title'] );
		}
		if ( isset( $_POST['LP_json_ld_parent_same_as_url'] ) ) {
			// Sanitize the user input.
			$data['parent_same_as_url'] = esc_url( $_POST['LP_json_ld_parent_same_as_url'] );
		}

		if ( isset( $_POST['LP_json_ld_parent_start_date'] ) && '' !== $_POST['LP_json_ld_parent_start_date'] ) {
			$data['parent_start_date'] = self::format_date_to_utc( $_POST['LP_json_ld_parent_start_date'] );
		} elseif ( isset( $_POST['LP_json_ld_coverage_start_time'] ) && '' !== $_POST['LP_json_ld_coverage_start_time'] ) {
			$data['parent_start_date'] = self::format_date_to_utc( $_POST['LP_json_ld_coverage_start_time'] );
		} else {
			$data['parent_start_date'] = '';
		}

		if ( isset( $_POST['LP_json_ld_coverage_start_time'] ) && '' !== $_POST['LP_json_ld_coverage_start_time'] ) {
			$data['coverage_start_time'] = self::format_date_to_utc( $_POST['LP_json_ld_coverage_start_time'] );
		} else {
			$data['coverage_start_time'] = '';
		}

		if ( isset( $_POST['LP_json_ld_coverage_end_time'] ) && '' !== $_POST['LP_json_ld_coverage_end_time'] ) {
			$data['coverage_end_time'] = self::format_date_to_utc( $_POST['LP_json_ld_coverage_end_time'] );
		} else {
			$data['coverage_end_time'] = '';
		}

		if ( isset( $_POST['LP_json_ld_parent_headline'] ) ) {
			// Sanitize the user input.
			$data['parent_headline'] = sanitize_text_field( $_POST['LP_json_ld_parent_headline'] );
		}

		if ( isset( $_POST['LP_json_ld_parent_description'] ) ) {
			// Sanitize the user input.
			$data['parent_description'] = sanitize_text_field( $_POST['LP_json_ld_parent_description'] );
		}

		if ( isset( $_POST['LP_json_ld_about_location'] ) ) {
			// Sanitize the user input.
			$data['about_location'] = sanitize_text_field( $_POST['LP_json_ld_about_location'] );
		}

		// Update the meta field.
		return update_post_meta( $post_id, '_livepress_json_ld', $data );

	}


	/**
	 * Render Meta Box content.
	 *
	 * @param WP_Post $post The post object.
	 */
	public static function render_meta_box_content( $post ) {

		// Add an nonce field so we can check for it later.
		wp_nonce_field( 'livepress_json_ld', 'livepress_json_ld_nonce' );

		// Use get_post_meta to retrieve an existing value from the database.
		$values = get_post_meta( $post->ID, '_livepress_json_ld', true );

		$lp_json_ld_parent_title = ( isset( $values['parent_title'] ) ) ? $values['parent_title'] : '';
		echo '<label for="LP_json_ld_parent_title">';
		_e( 'Event name<sup>required</sup>', 'livepress' );
		echo '</label> ';
		echo '<input type="text" id="LP_json_ld_parent_title" name="LP_json_ld_parent_title"';
		echo ' value="' . esc_attr( $lp_json_ld_parent_title ) . '" />';

		$parent_description = ( isset( $values['parent_description'] ) ) ? $values['parent_description'] : '';
		echo '<br /><label for="LP_json_ld_parent_description">';
		_e( 'Event description<sup>required</sup>', 'livepress' );
		echo '</label> ';
		echo '<br /><textarea type="text" id="LP_json_ld_parent_description" name="LP_json_ld_parent_description"';
		echo '>' . esc_attr( $parent_description ) . '</textarea>';

		$coverage_start_time = ( isset( $values['coverage_start_time'] ) ) ? self::format_date_to_wp_timezone( $values['coverage_start_time'] ) : '';
		echo '<br /><label for="LP_json_ld_coverage_start_time">';
		_e( 'Coverage start time', 'livepress' );
		echo '</label> ';
		printf( '<button id="LP_json_ld_coverage_start_time_clear">%s</button>', __( 'clear', 'livepress' ) );
		echo '<input type="text" id="LP_json_ld_coverage_start_time" name="LP_json_ld_coverage_start_time"';
		echo ' value="' . esc_attr( $coverage_start_time ) . '" size="25" />';

		$coverage_end_time = ( isset( $values['coverage_end_time'] ) ) ? self::format_date_to_wp_timezone( $values['coverage_end_time'] ) : '';
		echo '<br /><label for="LP_json_ld_coverage_end_time">';
		_e( 'Coverage end time', 'livepress' );
		echo '</label> ';
		printf( '<button id="LP_json_ld_coverage_end_time_clear">%s</button>', __( 'clear', 'livepress' ) );
		echo '<input type="text" id="LP_json_ld_coverage_end_time" name="LP_json_ld_coverage_end_time"';
		echo ' value="' . esc_attr( $coverage_end_time ) . '" size="25" />';

		// Display the form, using the current value.
		$parent_start_date = ( isset( $values['parent_start_date'] ) ) ? self::format_date_to_wp_timezone( $values['parent_start_date'] ) : '';
		echo '<br /><label for="LP_json_ld_parent_start_date">';
		_e( 'Event start time', 'livepress' );
		echo '</label> ';
		printf( '<button id="LP_json_ld_parent_start_date_clear">%s</button>', __( 'clear', 'livepress' ) );
		echo '<input type="text" id="LP_json_ld_parent_start_date" name="LP_json_ld_parent_start_date"';
		echo ' value="' . esc_attr( $parent_start_date ) . '" size="25" />';

		$parent_headline = ( isset( $values['parent_headline'] ) ) ? $values['parent_headline'] : '';
		echo '<br /><label for="LP_json_ld_parent_headline">';
		_e( 'Headline (for Google News)', 'livepress' );
		echo '</label> ';
		echo '<input type="text" id="LP_json_ld_parent_headline" name="LP_json_ld_parent_headline"';
		echo ' value="' . esc_attr( $parent_headline ) . '" />';

		$about_location = ( isset( $values['about_location'] ) ) ? $values['about_location'] : '';
		echo '<br /><label for="LP_json_ld_about_location">';
		_e( 'Location', 'livepress' );
		echo '</label> ';
		echo '<input type="text" id="LP_json_ld_about_location" name="LP_json_ld_about_location"';
		echo ' value="' . esc_attr( $about_location ) . '" />';

		$lp_json_ld_parent_same_as_url = ( isset( $values['parent_same_as_url'] ) ) ? $values['parent_same_as_url'] : '';
		echo '<label for="LP_json_ld_parent_same_as_url">';
		_e( 'Event website', 'livepress' );
		echo '</label> ';
		echo '<input type="text" id="LP_json_ld_parent_same_as_url" name="LP_json_ld_parent_same_as_url"';
		echo 'placeholder = "http://..."';
		echo ' value="' . esc_url( $lp_json_ld_parent_same_as_url ) . '" />';
	}
}

new  Json_Ld();
