=== LivePress ===
Requires at least: 3.5
Tested up to: 4.9
Tags: LivePress, live, live blogging, liveblogging, realtime, collaboration, Twitter, Slack
Stable tag: 1.4.5

LivePress is a hosted live blogging solution that integrates seamlessly with your WordPress-based site.

== Description ==

LivePress converts your blog into a fully real-time information resource.  Your visitors see posts update in real-time.

Take advantage of an enhanced mode for the WordPress editor featuring live comment moderation, streaming Twitter search and more.  Or, live blog entirely via Twitter or Slack.

To use LivePress, you must sign up for an account at https://livepress.com (paid subscription required, 7 day free trial available).

== Installation ==

1. Upload `livepress-wp` folder into `/wp-content/plugins/` directory.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Sign up for an account at https://livepress.com/pricing
4. Go to Settings >> LivePress, enter your authorization key into field, and press "Check".
5. Configure settings as you wish and press save. You can use all the power of LivePress now!

== Frequently Asked Questions ==

Answers to frequently asked questions are available at https://help.livepress.com

== Other notes ==

== Hooks and Filters ==

LivePress is fully extensible by third-party applications using WordPress-style action hooks and filters.

= Custom post types =

In order to live blog on a custom post type, you need to add a filter. You can add it in your theme's functions.php file:

`
// In this case, add the 'books' post type
function add_livepress_post_types( $post_types ) {
         array_push( $post_types, 'books' );
         return $post_types;
}
add_filter( 'livepress_post_types', 'add_livepress_post_types' );
`

= Control insertion of live stream =

You can use the 'livepress_the_content_filter_disabled' to turn off LivePress's 'the_content' filter.

`
apply_filters( 'livepress_the_content_filter_disabled', '__return_true' );
`

== Screenshots ==

1. Just create a new post with livepress enabled.  Anyone who has the main blog page open will see the notification.
2. New update sent -- it appears for all readers of this post at the same time.

== Changelog ==

= 1.4.5 =
* Fixes for WP 4.9 changes to tinyMCE editor id
* Fixes to stop a loop running away if drafts loaded by another user

= 1.4.4 =
* Remove 'update_format' option
* Removed deprecated get_screen_icon() call
* Added examples for reorder post content and html avatar wrap filters
* Changed the update ID from random to parent is + time(now)
* Fixed call to is_comments_enabled();
* Added common class "lp-live" to all updates

= 1.4.3 =
* Fixed visual editor shows raw shortcode
* Stopped printing blank descriptions for meta data

= 1.4.2 =
* Added support for captions for images
* fixed regression for multiple authors
* disabled editing for posts that are using Slack

= 1.4.1 =
* Improve wording of post-installation prompt
* Fixed avatar showing in the edit window on re edit sometimes
* Remove Autoscroll option
* Added twitter:image:alt to Twitter Card info

= 1.4.0 =
* added filter (lp_facebook_js_loaded) to set if you are loading the Facebook Javascript yourself
* added support for live blogging from Slack (currently pending approval from Slack)

= 1.3.19 =
 * adjusted when the js and CSS are loaded in the admin

= 1.3.18 =
 * Made sure that TinyMCE editor is always loaded for LP pages
 * Stopped using vip_safe_wp_remote_get for post calls
 * Added css to archive pages for LP posts
 * Added filter to disable lazy loading
 * Added JS trigger to lazy-loading when done
 * Added the plug-in version to all the scripts and styles

= 1.3.17 =
 * removed load all for VIP
 * Fixed FB embeds
 * CSS tweaks
 * added filter (lp_authors_divider) to allow setting of the divider for authors

= 1.3.16 =
* Adjusted regx for opengraph twitter URL to support other content in update
* Made remove_author_info() public and use to clean content in JSON+ld
* Added call to clear the cache created for OpenGraph data on update change/delete

= 1.3.15 =
* Added lazy loading for long posts
* Removed not needed "reject_unsafe_urls => false"
* Change production LIVEPRESS_SERVICE_HOST
* Added location to Json_Ld
* VIP: Disabled shortcode reversal
* updated get current user function to wp_get_current_user() from the deprecated get_currentuserinfo()
* Fixes loading updates to the bottom of the feed
* Added support for bottom load to new Update message
* Added filter to override feed order
* Updated to scrollTo.js
* Other Odd bits


= 1.3.14 =
* Added translation to JS for view # new update(s)

= 1.3.13 =
* Fixed the the_content whitelist

= 1.3.12 =
* Changed how the end live blog works so that it doesn't attempt to merge updates - merge will be made into separate step in future release
* Changed the default update notification colors
* Added partial support for Ooyala Videos
* Disabled by default using LP ajax Comments
* Added link to OpenGraph data to links with anchor tags

= 1.3.11 =
* typo

= 1.3.10 =
* fixed the "Authorization Key" authentication on the setting page

= 1.3.9 =
* Make new updates hidden if not in viewport - this behavior can be disabled in Settings -> LivePress
* Support to display LivePress Stream as a sub-component of a page via PHP function
* Fixed issue with # being encoded in update title
* Added default "powered by LivePress" links and logos to the content
* made all calls to Facebook and Twitter HTTPS
* Added basic support for Instagram


= 1.3.8 =
* fix to allow no authors for updates

= 1.3.7 =
* Fixed the starting point for TInyMCE redo
* Fixed dropping of Author names on re-edit if not real users
* Added target to the FaceBook loading code to load just LivePress updates
* Add timestanp to the HTML data on the span
* Added jSON+LD output to the debug output

= 1.3.6 =
* Added magic quotes to update titles
* Fixed display in FB id in meta
* Removed extra <br> in tweets
* Added filter to allow adjustment of the white-listed content filters
* Hide the title timestamp by default use filter LP_hide_timestamp set to false to show

= 1.3.5.2 =
* Support for the schema.org LiveBlogPosting standard, currently used by Google News (https://developers.google.com/structured-data/carousels/live-blogs).

= 1.3.5.1 =
* fix the timezone for edited posts

= 1.3.5 =
* added clear cache call for parent post on each update action
* added initial support for WP oEmbeds

= 1.3.4.3 =
* fixed sticky posts from showing twice
* Stopped update data leaking if parent is not public

= 1.3.4.2 =
* set social sharing for sticky updates to use post details
* set social sharing for update missing title to use post title
* set social sharing for update missing content to use img alt if found
* rename livepress_meta_info_template_header filter to livepress_meta_info_template_header_class
* corrected filter name for livepress_meta_info_template_avatar
* fixed class string in meta info
* fixed URL encoding for social sharing calls
* code tidy


= 1.3.4.1 =
* added fallback to img alt for twitter text if not content or update title props: Paul Schreiber from FiveThirtyEight.com

= 1.3.4 =
* Added support for WP version 4.3
* Fixed code where the "add media" button in the editors was changed from a href to a button
* Fixed inserting media into text editor for new updates

= 1.3.3 =
* Fixed FB popup not closing

= 1.3.2 =

* replaced &$this with $this in hook calls
* added the_title filter to the metatag og:title
* added the_excerpt filter to the metatag og:description

= 1.3.1 =

* Fixed left margin in pinned post
* Fixed draft and private posts not working as LivePress posts
* Fixes to make sure the stored short code is correctly formatted
* Added check to make sure LivePress doesn't load on non-live posts or outside the post loop
* Added code to generate avatar and shortcode for the existing content when converting to a live post
* Renamed CSS class "status-title" to "lp-status-title" to avoided CSS override
* Fixed a problem with converting to a live post by changing which filter we use
* Fixed the CSS to show draft LivePress updates in green in the main listing

= 1.3 =
* sync with WordPress VIP Version
* code tidy and various undefined vars props: Paul Schreiber from FiveThirtyEight.com
* fix to handle '%' in titles and message body
* fix to handle sounds URL on WordPress VIP
* fix to handle popup blocking for Twitter share links
* fix to share links on pinned post
* optimized all images
* added language support for select2.js
* fix to stop getting undefined authors when editing an update
* fix to ensure that editing an update does not update its timestamp
* fix to ensure an update edited in the plain text editor saves correctly
* fix to ensure that all of the paragraphs of a multi-paragraph update are shown in the editor
* Stopped some of the JS loading when not needed
* Fix to allow \ in the content
* Added a scrollTO to keep the page fixed when loading embeded tweets
* changed css class from "status-title" to "lp-status-title" on live status span

= 1.2.4 =
* Added the ability to have drafts for updates
* Added filter to suppress live updates from showing in the CoSchedule by Todaymade plugin; needs Version 2.3.0 of the CoSchedule plugin
* moved the pinned update about the status bar
* bug fixes around linefeeds being stripped when changing editor modes

= 1.2.3 =
* removed comment block that was creating and install error
* Added text domain detail to plugin Comment block

= 1.2.2 =
* WP CLI commands to manage posts
* removed JS console.log calls
* Increased the timeout for vip_safe_wp_remote_get calls from 1 to 10
* Did some work to allow the twitter popup to still work if the calling Ajax call is slow
* Other small bug fixes
* test on WordPress 4.1

= 1.2.1 =
* removed src files from plugin
* Issue with raw code being displayed after converting post to "non-live" fixed
* other bug fixes

= 1.2.0 =
* Back port of the code changes from the WordPress VIP version of LivePress
* Fixed: remote authors and posting from Twitter
* Added sharing links for individual updates
* Added Headlines for individual updates (edited)
* Added Tags for individual updates
* Added Avatars for individual
* General bug squashing and cleanup

= 1.1.5 =
* Adds filter to disable LivePress's 'the_content' filter. See more in [Other notes](https://wordpress.org/plugins/livepress/other_notes/)
* Adds support for custom post types. In order to enable live blogging on a custom post type, you need to add a filter. See more in [Other notes](https://wordpress.org/plugins/livepress/other_notes/)
* Adds support for per update headers.
* Adds support for tags for updates.
* Several bug fixes: timezone offset in live updates, clear comment textarea after sending comment, sound notifications setting being ignored, first update not editable.

= 1.1.4 =
* Merge in WordPress VIP branch
* Fixes formatting issues after going 'non-live' with a post
* Fix twitter embeds
* Fix deleting updates
* Fixes in pinned post
* General bug squashing and cleanup

= 1.1.3 =
* Bugfix release to include new fonts.

= 1.1.2 =
* Remove Soundmanager, replace it with SoundJS, enable sound.
* Add translation for timeago().
* Add embedded media preview on live posts in the admin dashboard.
* Optimize update engine with 'incremental api'
* Style refinements, better match for new WordPress look and feel
* Bug fixes: embeds for Facebook using Facebook's official WP Plugin, incompatibility with WordPress' embedded audio, comment tab on live post editor, display issue for images in old live posts, other small bug fixes.

= 1.1.1 =
* Continue refining design elements to match new WordPress look
* WordPress 4.0 compatibility fixes
* Incremental updates for faster, more reliable live updates
* Bug fixes: clear console errors, correct settings page error

= 1.1.0 =
* Bug squashing, media conflicts.

= 1.0.9 =
* Switch to timeago() for live update time calculations
* Add pinned post feature to pin the first update as a header for live posts
* Small bug fixes, cleanup, better compatibility with WordPress 3.9

= 1.0.8 =
* Correct an issue where tweets are not embedded correctly in editor

= 1.0.7 =
* Add translations for all strings, including in Javascript
* Escape all outputs for security
* Remove all stored terms/guest bloggers when taking post not live
* Correct category post counts
* Remove deprecated/unused code
* Address PHP compatibility/warnings
* Address jQuery migrate warnings
* Hide 'full screen' button in mce editor when in live mode
* Improve twitter oEmbed rendering speed when large number of tweets are embedded in live post
* Remove config file/use of fopen
* Design cleanup to match new design in WordPress 3.8+
* Improved error messages when adding remote author fails
* Improved plugin deactivation and uninstall routines
* Individual nonces for each action, remove check_ajax_referer pluggable function override
* Only apply the LivePress Status column to posts
* Remove .swf files from SoundManager code
* Added inline documentation throughout plugin
* Address compatibility issues for TinyMCE 4 (WordPress 3.9+)
* Use timeago.js to keep update times updated
* Fix Twitter oEmbeds to address introduction of https only Twitter API requirement
* Regenerate translation file and add to build process

= 1.0.6 =
* Add post-activation workflow, API signup link
* Correct category/list post counts - use 3.7 filter when available
* Improve count of unviewed Twitter results and Comments
* Refine Twitter component initialization
* Miscellaneous bug fixes, remove depreciated warnings

= 1.0.5 =
* New live blogging via SMS
* Improve live blogging via twitter
* Improve switching live on and off
* Small bug fixes

= 1.0.4 =
* Miscellaneous bug fixes

= 1.0.3 =
* Update connection to LivePress api to use port 80
* Display post live or not live status on post list page
* Make post status live or not live more visible in post editor
* Fix issue where a large number of comments would cause live blogging tools tab to grow too large
* Better notifications when adding new Twitter handle
* Fix Facebook embedding issue

= 1.0.2 =
* Reduce Twitter search history from 500 to 200 items
* Attempt to fix discrepancy between autoscroll/chime settings
* Rename 'Post' to 'Send to Editor' in live Twitter search
* Improve JS binding on live update editor
* Miscellaneous UI refinements

= 1.0.1 =
* Patch remote author count returning invalid data
* Pluralize HUD counts (remote authors, comments, visitors)
* Allow Twitter feed to pause on click of appropriate button or hover

= 1.0 =
* Initial public release

= 0.7.4 =
* Update API server references for staging

= 0.7.3 =
* Debug remote, automatic updates

= 0.7.2 =
* Update translation file

= 0.7.1 =
* Various UI tweaks to rectify user test errors and misses

= 0.7 =
* Implement post "regions" as post formats of "Aside"
* Modify HTMLPurifier to use a custom post type for storing the definition cache

= 0.6 =
* Fix a JS inclusion bug causing issues on the admin screen

== Upgrade Notice ==

= 1.0 =
None
