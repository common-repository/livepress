/*! livepress -v1.4.5
 * http://livepress.com/
 * Copyright (c) 2017 LivePress, Inc.
 */
var Livepress = Livepress || {};

/**
 * Returns object or {} depending if it exists
 * @param object
 */
Livepress.ensureExists = function( object ) {
	if ( object === undefined ) {
		object = {};
	}
	return object;
};

/***************** Utility functions *****************/

// Prevent extra calls to console.log from throwing errors when the console is closed.
var console = console || { log: function() { } };

// Get the permalink for a given update
// The url is used for sharing with an anchor link to the update and
// works for Open Graph and Twitter Cards:
Livepress.getUpdatePermalink = function( update_id ) {
    if ( false === update_id ) {
        return '';
    }
	var re = /livepress-update-([0-9]+)/,
		id = re.exec( update_id )[1],
		lpup = '',
		post_link = jQuery( location ).attr( 'protocol' ) + '//' + jQuery( location ).attr( 'host' ) + jQuery( location ).attr( 'pathname' ),
		query = jQuery( location ).attr( 'search' ),
		pid;

	// Check url depending on permalink (default / nice urls)
	if ( null !== ( pid = query.match( /\?p=[0-9]+/ ) ) ) {
		post_link += pid + '&';
	} else {
		post_link += '?';
	}

	lpup += 'lpup=';
	return post_link + lpup + id + '#' + update_id;
};
Livepress.updateShortlinksCache = {};
if ( undefined !== window.LivepressConfig ) {
    Livepress.updateShortlinksCache = window.LivepressConfig.shortlink || {};
}

Livepress.getUpdateShortlink = function( upd ) {
	var re = /livepress-update-([0-9]+)/,
	update_id = re.exec( upd )[1];
	if ( ! ( update_id in Livepress.updateShortlinksCache ) ) {

		return jQuery.ajax({
			url: window.LivepressConfig.ajax_url,
            xhrFields: {
				withCredentials: true
			},
			type: 'post',
			async: false,
			dataType: 'json',
			data: {
				'action': 'lp_update_shortlink',
				'post_id': window.LivepressConfig.post_id,
				'_ajax_nonce': LivepressConfig.lp_update_shortlink_nonce,
				'update_id': update_id
			}
		}).promise();

	} else {
		return Livepress.updateShortlinksCache[update_id];
	}
};

/*
 * Parse strings date representations into a real timestamp.
 */
String.prototype.parseGMT = function( format ) {
	var date = this,
		formatString = format || 'h:i:s a',
		parsed,
		timestamp;

	parsed = Date.parse( date.replace( /-/gi, '/' ), 'Y/m/d H:i:s' );
	timestamp = new Date( parsed );

	// Fallback to original value when invalid date
	if ( timestamp.toString() === 'Invalid Date' ) {
		return this.toString();
	}

	timestamp = timestamp.format( formatString );
	return timestamp;
};

/*
 * Needed for the post update
 */
String.prototype.replaceAll = function( from, to ) {
	var str = this;
	str = str.split( from ).join( to );
	return str;
};

// Ensure we have a twitter handler, even when the page starts with no embeds
// because they may be added later. Corrects issue where twitter embeds failed on live posts when
// original page load contained no embeds.
if ( 'undefined' === typeof window.twttr ) {
	window.twttr = (function( d, s, id ) {
						var t, js, fjs = d.getElementsByTagName( s )[0];
						if ( d.getElementById( id ) ) {
 return;
 } js = d.createElement( s ); js.id = id;
						js.src = 'https://platform.twitter.com/widgets.js'; fjs.parentNode.insertBefore( js, fjs );
						return window.twttr || ( t = { _e: [], ready: function( f ) {
 t._e.push( f );
 } });
					}( document, 'script', 'twitter-wjs' ) );
}
// Make sure instagram embeds is loaded
if ( 'undefined' === typeof window.instgrm ) {
    jQuery.getScript( 'https://platform.instagram.com/en_US/embeds.js' );
}
// Hack for when a user loads a post from a permalink to an update and
// twitter embeds manipulate the DOM and generate a "jump"
if ( window.location.hash ) {
    twttr.ready( function( twttr ) {
        twttr.events.bind( 'loaded', function( event ) {
            jQuery.scrollTo( jQuery( window.location.hash ) );
        });
    });
}

jQuery.fn.getBg = function () {
	var $this = jQuery(this),
		actual_bg, newBackground, color;
	actual_bg = $this.css('background-color');
	if (actual_bg !== 'transparent' && actual_bg !== 'rgba(0, 0, 0, 0)' && actual_bg !== undefined) {
		return actual_bg;
	}

	newBackground = this.parents().filter(function () {
		//return $(this).css('background-color').length > 0;
		color = $this.css('background-color');
		return color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)';
	}).eq(0).css('background-color');

	if (!newBackground) {
		$this.css('background-color', '#ffffff');
	} else {
		$this.css('background-color', newBackground);
	}
};

jQuery.extend({
	getUrlVars:function (loc) {
		var vars = [], hash;
		var href = (loc.href || window.location.href);
		var hashes = href.slice(href.indexOf('?') + 1).split('&');
		for (var i = 0; i < hashes.length; i++) {
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	},
	getUrlVar: function (name, loc) {
		return jQuery.getUrlVars(loc || false)[name];
	}
});

jQuery.fn.outerHTML = function (s) {
	return (s) ? this.before(s).remove() : jQuery("<div>").append(this.eq(0).clone()).html();
};

jQuery.fn.autolink = function () {
	return this.each(function () {
		var re = new RegExp('((http|https|ftp)://[\\w?=&./-;#~%-]+(?![\\w\\s?&./;#~%"=-]*>))', "g");
		jQuery(this).html(jQuery(this).html().replace(re, '<a href="$1">$1</a> '));
	});
};

if (typeof document.activeElement === 'undefined') {
	jQuery(document)
		.focusin(function (e) {
			document.activeElement = e.target;
		})
		.focusout(function () {
			document.activeElement = null;
		});
}
jQuery.extend(jQuery.expr[':'], {
	focus:function (element) {
		return element === document.activeElement;
	}
});
Date.prototype.format = function (format) {
	var i, curChar,
		returnStr = '',
		replace = Date.replaceChars;
	for (i = 0; i < format.length; i++) {
		curChar = format.charAt(i);
		if (replace[curChar]) {
			returnStr += replace[curChar].call(this);
		} else {
			returnStr += curChar;
		}
	}
	return returnStr;
};
Date.replaceChars = {
	shortMonths:['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	shortDays:  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	longDays:   ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	d:          function () {
		return (this.getDate() < 10 ? '0' : '') + this.getDate();
	},
	D:          function () {
		return Date.replaceChars.shortDays[this.getDay()];
	},
	j:          function () {
		return this.getDate();
	},
	l:          function () {
		return Date.replaceChars.longDays[this.getDay()];
	},
	N:          function () {
		return this.getDay() + 1;
	},
	S:          function () {
		return (this.getDate() % 10 === 1 && this.getDate() !== 11 ? 'st' : (this.getDate() % 10 === 2 && this.getDate() !== 12 ? 'nd' : (this.getDate() % 10 === 3 && this.getDate() !== 13 ? 'rd' : 'th')));
	},
	w:          function () {
		return this.getDay();
	},
	z:          function () {
		return "Not Yet Supported";
	},
	W:          function () {
		return "Not Yet Supported";
	},
	F:          function () {
		return Date.replaceChars.longMonths[this.getMonth()];
	},
	m:          function () {
		return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1);
	},
	M:          function () {
		return Date.replaceChars.shortMonths[this.getMonth()];
	},
	n:          function () {
		return this.getMonth() + 1;
	},
	t:          function () {
		return "Not Yet Supported";
	},
	L:          function () {
		return (((this.getFullYear() % 4 === 0) && (this.getFullYear() % 100 !== 0)) || (this.getFullYear() % 400 === 0)) ? '1' : '0';
	},
	o:          function () {
		return "Not Supported";
	},
	Y:          function () {
		return this.getFullYear();
	},
	y:          function () {
		return ('' + this.getFullYear()).substr(2);
	},
	a:          function () {
		return this.getHours() < 12 ? 'am' : 'pm';
	},
	A:          function () {
		return this.getHours() < 12 ? 'AM' : 'PM';
	},
	B:          function () {
		return "Not Yet Supported";
	},
	g:          function () {
		return this.getHours() % 12 || 12;
	},
	G:          function () {
		return this.getHours();
	},
	h:          function () {
		return ((this.getHours() % 12 || 12) < 10 ? '0' : '') + (this.getHours() % 12 || 12);
	},
	H:          function () {
		return (this.getHours() < 10 ? '0' : '') + this.getHours();
	},
	i:          function () {
		return (this.getMinutes() < 10 ? '0' : '') + this.getMinutes();
	},
	s:          function () {
		return (this.getSeconds() < 10 ? '0' : '') + this.getSeconds();
	},
	e:          function () {
		return "Not Yet Supported";
	},
	I:          function () {
		return "Not Supported";
	},
	O:          function () {
		return ( -this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + '00';
	},
	P:          function () {
		return ( -this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + ':' + (Math.abs(this.getTimezoneOffset() % 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() % 60));
	},
	T:          function () {
		var result, m;
		m = this.getMonth();
		this.setMonth(0);
		/*jslint regexp:false*/
		result = this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1');
		/*jslint regexp:true*/
		this.setMonth(m);
		return result;
	},
	Z:          function () {
		return -this.getTimezoneOffset() * 60;
	},
	c:          function () {
		return this.format("Y-m-d") + "T" + this.format("H:i:sP");
	},
	r:          function () {
		return this.toString();
	},
	U:          function () {
		return this.getTime() / 1000;
	}
};
/**
 * Object containing methods pertaining to instance message integration.
 *
 * @namespace
 * @type {Object}
 */
var ImIntegration = {
	CHECK_TIMEOUT_SECONDS: 5,
	CHECK_TIMES:           5
};

/**
 * Check the status of the specified protocol
 *
 * @memberOf ImIntegration
 * @param {String} protocol Protocol to check.
 * @see ImIntegration.__check_status
 */
ImIntegration.check_status = function( protocol ) {
	ImIntegration.__check_status( protocol, ImIntegration.CHECK_TIMES );
};

/**
 * Create HTML markup for a loading spinnter.
 *
 * @memberOf ImIntegration
 * @return {Object} jQuery object containing the spinner.
 * @private
 */
ImIntegration.__spin_loading = function() {
	var image_path = LivepressConfig.lp_plugin_url + '/img/spin.gif',
		html_image = jQuery( '<img />' ).attr( 'src', image_path );

	return html_image;
};

/**
 * Check the status of a specific protocol several times.
 *
 * @memberOf ImIntegration
 * @param {String} protocol Protocol to check.
 * @param {number} tries Number of times to test the protocol.
 * @private
 */
ImIntegration.__check_status = function( protocol, tries ) {
	var params = {},
		$check_button = jQuery( '#check_' + protocol ),
		$check_message = jQuery( '#check_message_' + protocol ),
		admin_ajax_url = LivepressConfig.site_url + '/wp-admin/admin-ajax.php';

	params.action = 'lp_im_integration';
	params._ajax_nonce = LivepressConfig.ajax_lp_im_integration;
	params.im_integration_check_status = true;
	params.im_service = protocol;

	//Console.log("Start status check to: protocol=" + protocol);

	$check_button.hide();

	$check_message.css({ 'color': 'black' }).html( ImIntegration.__spin_loading() );

	jQuery.post( admin_ajax_url, params, function( response, code ) {
		var json_response = JSON.parse( response ),
			show_button = false,
			error_msg = '',
			reason;

		if ( ( json_response.status === 'not_found' ||
			json_response.status === 'offline' ||
			json_response.status === 'failed' ) && tries > 0 ) {
			//Checked_str = ((LivePress_IM_Integration.CHECK_TIMES + 1) - tries) + "/" + LivePress_IM_Integration.CHECK_TIMES;
			setTimeout(function() {
				ImIntegration.__check_status( params.im_service, tries - 1 );
			}, ImIntegration.CHECK_TIMEOUT_SECONDS * 1000 );
		} else if ( json_response.status === 'not_found' ) {
			show_button = true;
			$check_message.html( lp_strings.account_not_found ).css({ 'color':'red' });
		} else if ( json_response.status === 'connecting' ) {
			setTimeout(function() {
				ImIntegration.__check_status( params.im_service, 5 );
			}, ImIntegration.CHECK_TIMEOUT_SECONDS * 1000 );
			$check_message.html( lp_strings.connecting ).css({ 'color':'lightgreen' });
		} else if ( json_response.status === 'offline' ) {
			$check_message.html( lp_strings.offline );
		} else if ( json_response.status === 'online' ) {
			$check_message.html( lp_strings.connected ).css({ 'color':'green' });
		} else if ( json_response.status === 'failed' ) {
			show_button = true;
			reason = json_response.reason;

			if ( reason === 'authentication_error' ) {
				error_msg = lp_strings.user_pass_invalid;
			} else if ( reason === 'wrong_jid' ) {
				error_msg = lp_strings.wrong_account_name;
			} else {
				console.log( 'Im check failure reason: ', reason );
				error_msg = lp_strings.internal_error;
			}

			$check_message.html( error_msg ).css({ 'color':'red' });
		} else {
			show_button = true;
			$check_message.html( lp_strings.unknown_error ).css({ 'color':'red' });
		}

		if ( show_button ) {
			$check_button.show();
		}
	});

};

/**
 * Current status of the test message.
 *
 * @memberOf ImIntegration
 * @type {Boolean}
 */
ImIntegration.test_message_sending = false;

/**
 * Send a test message from a given user via a specified protocol.
 *
 * @memberOf ImIntegration
 * @param {String} source Source of the message.
 * @param {String} protocol Protocol to use while sending the message.
 * @see ImIntegration.test_message_sending
 */
ImIntegration.send_test_message = function( source, protocol ) {
	var $input = jQuery( '#' + source ),
		buddy = $input.attr( 'value' ),
		$button,
		$feedback_msg,
		params,
		feedback_msg = '',
		self = this;

	if ( buddy.length === 0 ) {
		return;
	}
	if ( this.test_message_sending ) {
		return;
	}
	this.test_message_sending = true;
	$input.attr( 'readOnly', true );

	$button = jQuery( '#' + source + '_test_button' );
	$button.attr( 'value', lp_strings.sending + '...' );
	$button.attr( 'disabled', true );

	$feedback_msg = jQuery( '#' + protocol + '_message' );
	$feedback_msg.html( '' );

	params = {};
	params.action = 'im_integration';
	params.im_integration_test_message = true;
	params.im_service = protocol;
	params.buddy = buddy;

	//Console.log("Sending test message to: " + buddy + " using " + protocol + " protocol");

	jQuery.ajax({
		url:      LivepressConfig.ajax_url,
		type:     'post',
		dataType: 'json',
		data:     params,

		error: function( request ) {
			feedback_msg = lp_strings.problem_connecting;
		},

		success: function( data ) {
			//Console.log("return from test message: %d", data);
			if ( data === 200 ) {
				feedback_msg = lp_strings.test_msg_sent;
			} else {
				feedback_msg = lp_strings.test_msg_failure;
			}
		},

		complete: function( XMLHttpRequest, textStatus ) {
			//Console.log("feed: %s", feedback_msg);
			$feedback_msg.html( feedback_msg );

			self.test_message_sending = false;
			$input.attr( 'readOnly', false );

			$button.attr( 'value', lp_strings.send_again );
			$button.attr( 'disabled', false );
		}
	});
};

(function ($) {
    if(typeof $.fn.each2 == "undefined") {
        $.extend($.fn, {
            /*
            * 4-10 times faster .each replacement
            * use it carefully, as it overrides jQuery context of element on each iteration
            */
            each2 : function (c) {
                var j = $([0]), i = -1, l = this.length;
                while (
                    ++i < l
                    && (j.context = j[0] = this[i])
                    && c.call(j[0], i, j) !== false //"this"=DOM, i=index, j=jQuery object
                );
                return this;
            }
        });
    }
})(jQuery);

(function ($, undefined) {
    "use strict";
    /*global document, window, jQuery, console */

    if (window.Select2 !== undefined) {
        return;
    }

    var KEY, AbstractSelect2, SingleSelect2, MultiSelect2, nextUid, sizer,
        lastMousePosition={x:0,y:0}, $document, scrollBarDimensions,

    KEY = {
        TAB: 9,
        ENTER: 13,
        ESC: 27,
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        HOME: 36,
        END: 35,
        BACKSPACE: 8,
        DELETE: 46,
        isArrow: function (k) {
            k = k.which ? k.which : k;
            switch (k) {
            case KEY.LEFT:
            case KEY.RIGHT:
            case KEY.UP:
            case KEY.DOWN:
                return true;
            }
            return false;
        },
        isControl: function (e) {
            var k = e.which;
            switch (k) {
            case KEY.SHIFT:
            case KEY.CTRL:
            case KEY.ALT:
                return true;
            }

            if (e.metaKey) return true;

            return false;
        },
        isFunctionKey: function (k) {
            k = k.which ? k.which : k;
            return k >= 112 && k <= 123;
        }
    },
    MEASURE_SCROLLBAR_TEMPLATE = "<div class='select2-measure-scrollbar'></div>",

    DIACRITICS = {"\u24B6":"A","\uFF21":"A","\u00C0":"A","\u00C1":"A","\u00C2":"A","\u1EA6":"A","\u1EA4":"A","\u1EAA":"A","\u1EA8":"A","\u00C3":"A","\u0100":"A","\u0102":"A","\u1EB0":"A","\u1EAE":"A","\u1EB4":"A","\u1EB2":"A","\u0226":"A","\u01E0":"A","\u00C4":"A","\u01DE":"A","\u1EA2":"A","\u00C5":"A","\u01FA":"A","\u01CD":"A","\u0200":"A","\u0202":"A","\u1EA0":"A","\u1EAC":"A","\u1EB6":"A","\u1E00":"A","\u0104":"A","\u023A":"A","\u2C6F":"A","\uA732":"AA","\u00C6":"AE","\u01FC":"AE","\u01E2":"AE","\uA734":"AO","\uA736":"AU","\uA738":"AV","\uA73A":"AV","\uA73C":"AY","\u24B7":"B","\uFF22":"B","\u1E02":"B","\u1E04":"B","\u1E06":"B","\u0243":"B","\u0182":"B","\u0181":"B","\u24B8":"C","\uFF23":"C","\u0106":"C","\u0108":"C","\u010A":"C","\u010C":"C","\u00C7":"C","\u1E08":"C","\u0187":"C","\u023B":"C","\uA73E":"C","\u24B9":"D","\uFF24":"D","\u1E0A":"D","\u010E":"D","\u1E0C":"D","\u1E10":"D","\u1E12":"D","\u1E0E":"D","\u0110":"D","\u018B":"D","\u018A":"D","\u0189":"D","\uA779":"D","\u01F1":"DZ","\u01C4":"DZ","\u01F2":"Dz","\u01C5":"Dz","\u24BA":"E","\uFF25":"E","\u00C8":"E","\u00C9":"E","\u00CA":"E","\u1EC0":"E","\u1EBE":"E","\u1EC4":"E","\u1EC2":"E","\u1EBC":"E","\u0112":"E","\u1E14":"E","\u1E16":"E","\u0114":"E","\u0116":"E","\u00CB":"E","\u1EBA":"E","\u011A":"E","\u0204":"E","\u0206":"E","\u1EB8":"E","\u1EC6":"E","\u0228":"E","\u1E1C":"E","\u0118":"E","\u1E18":"E","\u1E1A":"E","\u0190":"E","\u018E":"E","\u24BB":"F","\uFF26":"F","\u1E1E":"F","\u0191":"F","\uA77B":"F","\u24BC":"G","\uFF27":"G","\u01F4":"G","\u011C":"G","\u1E20":"G","\u011E":"G","\u0120":"G","\u01E6":"G","\u0122":"G","\u01E4":"G","\u0193":"G","\uA7A0":"G","\uA77D":"G","\uA77E":"G","\u24BD":"H","\uFF28":"H","\u0124":"H","\u1E22":"H","\u1E26":"H","\u021E":"H","\u1E24":"H","\u1E28":"H","\u1E2A":"H","\u0126":"H","\u2C67":"H","\u2C75":"H","\uA78D":"H","\u24BE":"I","\uFF29":"I","\u00CC":"I","\u00CD":"I","\u00CE":"I","\u0128":"I","\u012A":"I","\u012C":"I","\u0130":"I","\u00CF":"I","\u1E2E":"I","\u1EC8":"I","\u01CF":"I","\u0208":"I","\u020A":"I","\u1ECA":"I","\u012E":"I","\u1E2C":"I","\u0197":"I","\u24BF":"J","\uFF2A":"J","\u0134":"J","\u0248":"J","\u24C0":"K","\uFF2B":"K","\u1E30":"K","\u01E8":"K","\u1E32":"K","\u0136":"K","\u1E34":"K","\u0198":"K","\u2C69":"K","\uA740":"K","\uA742":"K","\uA744":"K","\uA7A2":"K","\u24C1":"L","\uFF2C":"L","\u013F":"L","\u0139":"L","\u013D":"L","\u1E36":"L","\u1E38":"L","\u013B":"L","\u1E3C":"L","\u1E3A":"L","\u0141":"L","\u023D":"L","\u2C62":"L","\u2C60":"L","\uA748":"L","\uA746":"L","\uA780":"L","\u01C7":"LJ","\u01C8":"Lj","\u24C2":"M","\uFF2D":"M","\u1E3E":"M","\u1E40":"M","\u1E42":"M","\u2C6E":"M","\u019C":"M","\u24C3":"N","\uFF2E":"N","\u01F8":"N","\u0143":"N","\u00D1":"N","\u1E44":"N","\u0147":"N","\u1E46":"N","\u0145":"N","\u1E4A":"N","\u1E48":"N","\u0220":"N","\u019D":"N","\uA790":"N","\uA7A4":"N","\u01CA":"NJ","\u01CB":"Nj","\u24C4":"O","\uFF2F":"O","\u00D2":"O","\u00D3":"O","\u00D4":"O","\u1ED2":"O","\u1ED0":"O","\u1ED6":"O","\u1ED4":"O","\u00D5":"O","\u1E4C":"O","\u022C":"O","\u1E4E":"O","\u014C":"O","\u1E50":"O","\u1E52":"O","\u014E":"O","\u022E":"O","\u0230":"O","\u00D6":"O","\u022A":"O","\u1ECE":"O","\u0150":"O","\u01D1":"O","\u020C":"O","\u020E":"O","\u01A0":"O","\u1EDC":"O","\u1EDA":"O","\u1EE0":"O","\u1EDE":"O","\u1EE2":"O","\u1ECC":"O","\u1ED8":"O","\u01EA":"O","\u01EC":"O","\u00D8":"O","\u01FE":"O","\u0186":"O","\u019F":"O","\uA74A":"O","\uA74C":"O","\u01A2":"OI","\uA74E":"OO","\u0222":"OU","\u24C5":"P","\uFF30":"P","\u1E54":"P","\u1E56":"P","\u01A4":"P","\u2C63":"P","\uA750":"P","\uA752":"P","\uA754":"P","\u24C6":"Q","\uFF31":"Q","\uA756":"Q","\uA758":"Q","\u024A":"Q","\u24C7":"R","\uFF32":"R","\u0154":"R","\u1E58":"R","\u0158":"R","\u0210":"R","\u0212":"R","\u1E5A":"R","\u1E5C":"R","\u0156":"R","\u1E5E":"R","\u024C":"R","\u2C64":"R","\uA75A":"R","\uA7A6":"R","\uA782":"R","\u24C8":"S","\uFF33":"S","\u1E9E":"S","\u015A":"S","\u1E64":"S","\u015C":"S","\u1E60":"S","\u0160":"S","\u1E66":"S","\u1E62":"S","\u1E68":"S","\u0218":"S","\u015E":"S","\u2C7E":"S","\uA7A8":"S","\uA784":"S","\u24C9":"T","\uFF34":"T","\u1E6A":"T","\u0164":"T","\u1E6C":"T","\u021A":"T","\u0162":"T","\u1E70":"T","\u1E6E":"T","\u0166":"T","\u01AC":"T","\u01AE":"T","\u023E":"T","\uA786":"T","\uA728":"TZ","\u24CA":"U","\uFF35":"U","\u00D9":"U","\u00DA":"U","\u00DB":"U","\u0168":"U","\u1E78":"U","\u016A":"U","\u1E7A":"U","\u016C":"U","\u00DC":"U","\u01DB":"U","\u01D7":"U","\u01D5":"U","\u01D9":"U","\u1EE6":"U","\u016E":"U","\u0170":"U","\u01D3":"U","\u0214":"U","\u0216":"U","\u01AF":"U","\u1EEA":"U","\u1EE8":"U","\u1EEE":"U","\u1EEC":"U","\u1EF0":"U","\u1EE4":"U","\u1E72":"U","\u0172":"U","\u1E76":"U","\u1E74":"U","\u0244":"U","\u24CB":"V","\uFF36":"V","\u1E7C":"V","\u1E7E":"V","\u01B2":"V","\uA75E":"V","\u0245":"V","\uA760":"VY","\u24CC":"W","\uFF37":"W","\u1E80":"W","\u1E82":"W","\u0174":"W","\u1E86":"W","\u1E84":"W","\u1E88":"W","\u2C72":"W","\u24CD":"X","\uFF38":"X","\u1E8A":"X","\u1E8C":"X","\u24CE":"Y","\uFF39":"Y","\u1EF2":"Y","\u00DD":"Y","\u0176":"Y","\u1EF8":"Y","\u0232":"Y","\u1E8E":"Y","\u0178":"Y","\u1EF6":"Y","\u1EF4":"Y","\u01B3":"Y","\u024E":"Y","\u1EFE":"Y","\u24CF":"Z","\uFF3A":"Z","\u0179":"Z","\u1E90":"Z","\u017B":"Z","\u017D":"Z","\u1E92":"Z","\u1E94":"Z","\u01B5":"Z","\u0224":"Z","\u2C7F":"Z","\u2C6B":"Z","\uA762":"Z","\u24D0":"a","\uFF41":"a","\u1E9A":"a","\u00E0":"a","\u00E1":"a","\u00E2":"a","\u1EA7":"a","\u1EA5":"a","\u1EAB":"a","\u1EA9":"a","\u00E3":"a","\u0101":"a","\u0103":"a","\u1EB1":"a","\u1EAF":"a","\u1EB5":"a","\u1EB3":"a","\u0227":"a","\u01E1":"a","\u00E4":"a","\u01DF":"a","\u1EA3":"a","\u00E5":"a","\u01FB":"a","\u01CE":"a","\u0201":"a","\u0203":"a","\u1EA1":"a","\u1EAD":"a","\u1EB7":"a","\u1E01":"a","\u0105":"a","\u2C65":"a","\u0250":"a","\uA733":"aa","\u00E6":"ae","\u01FD":"ae","\u01E3":"ae","\uA735":"ao","\uA737":"au","\uA739":"av","\uA73B":"av","\uA73D":"ay","\u24D1":"b","\uFF42":"b","\u1E03":"b","\u1E05":"b","\u1E07":"b","\u0180":"b","\u0183":"b","\u0253":"b","\u24D2":"c","\uFF43":"c","\u0107":"c","\u0109":"c","\u010B":"c","\u010D":"c","\u00E7":"c","\u1E09":"c","\u0188":"c","\u023C":"c","\uA73F":"c","\u2184":"c","\u24D3":"d","\uFF44":"d","\u1E0B":"d","\u010F":"d","\u1E0D":"d","\u1E11":"d","\u1E13":"d","\u1E0F":"d","\u0111":"d","\u018C":"d","\u0256":"d","\u0257":"d","\uA77A":"d","\u01F3":"dz","\u01C6":"dz","\u24D4":"e","\uFF45":"e","\u00E8":"e","\u00E9":"e","\u00EA":"e","\u1EC1":"e","\u1EBF":"e","\u1EC5":"e","\u1EC3":"e","\u1EBD":"e","\u0113":"e","\u1E15":"e","\u1E17":"e","\u0115":"e","\u0117":"e","\u00EB":"e","\u1EBB":"e","\u011B":"e","\u0205":"e","\u0207":"e","\u1EB9":"e","\u1EC7":"e","\u0229":"e","\u1E1D":"e","\u0119":"e","\u1E19":"e","\u1E1B":"e","\u0247":"e","\u025B":"e","\u01DD":"e","\u24D5":"f","\uFF46":"f","\u1E1F":"f","\u0192":"f","\uA77C":"f","\u24D6":"g","\uFF47":"g","\u01F5":"g","\u011D":"g","\u1E21":"g","\u011F":"g","\u0121":"g","\u01E7":"g","\u0123":"g","\u01E5":"g","\u0260":"g","\uA7A1":"g","\u1D79":"g","\uA77F":"g","\u24D7":"h","\uFF48":"h","\u0125":"h","\u1E23":"h","\u1E27":"h","\u021F":"h","\u1E25":"h","\u1E29":"h","\u1E2B":"h","\u1E96":"h","\u0127":"h","\u2C68":"h","\u2C76":"h","\u0265":"h","\u0195":"hv","\u24D8":"i","\uFF49":"i","\u00EC":"i","\u00ED":"i","\u00EE":"i","\u0129":"i","\u012B":"i","\u012D":"i","\u00EF":"i","\u1E2F":"i","\u1EC9":"i","\u01D0":"i","\u0209":"i","\u020B":"i","\u1ECB":"i","\u012F":"i","\u1E2D":"i","\u0268":"i","\u0131":"i","\u24D9":"j","\uFF4A":"j","\u0135":"j","\u01F0":"j","\u0249":"j","\u24DA":"k","\uFF4B":"k","\u1E31":"k","\u01E9":"k","\u1E33":"k","\u0137":"k","\u1E35":"k","\u0199":"k","\u2C6A":"k","\uA741":"k","\uA743":"k","\uA745":"k","\uA7A3":"k","\u24DB":"l","\uFF4C":"l","\u0140":"l","\u013A":"l","\u013E":"l","\u1E37":"l","\u1E39":"l","\u013C":"l","\u1E3D":"l","\u1E3B":"l","\u017F":"l","\u0142":"l","\u019A":"l","\u026B":"l","\u2C61":"l","\uA749":"l","\uA781":"l","\uA747":"l","\u01C9":"lj","\u24DC":"m","\uFF4D":"m","\u1E3F":"m","\u1E41":"m","\u1E43":"m","\u0271":"m","\u026F":"m","\u24DD":"n","\uFF4E":"n","\u01F9":"n","\u0144":"n","\u00F1":"n","\u1E45":"n","\u0148":"n","\u1E47":"n","\u0146":"n","\u1E4B":"n","\u1E49":"n","\u019E":"n","\u0272":"n","\u0149":"n","\uA791":"n","\uA7A5":"n","\u01CC":"nj","\u24DE":"o","\uFF4F":"o","\u00F2":"o","\u00F3":"o","\u00F4":"o","\u1ED3":"o","\u1ED1":"o","\u1ED7":"o","\u1ED5":"o","\u00F5":"o","\u1E4D":"o","\u022D":"o","\u1E4F":"o","\u014D":"o","\u1E51":"o","\u1E53":"o","\u014F":"o","\u022F":"o","\u0231":"o","\u00F6":"o","\u022B":"o","\u1ECF":"o","\u0151":"o","\u01D2":"o","\u020D":"o","\u020F":"o","\u01A1":"o","\u1EDD":"o","\u1EDB":"o","\u1EE1":"o","\u1EDF":"o","\u1EE3":"o","\u1ECD":"o","\u1ED9":"o","\u01EB":"o","\u01ED":"o","\u00F8":"o","\u01FF":"o","\u0254":"o","\uA74B":"o","\uA74D":"o","\u0275":"o","\u01A3":"oi","\u0223":"ou","\uA74F":"oo","\u24DF":"p","\uFF50":"p","\u1E55":"p","\u1E57":"p","\u01A5":"p","\u1D7D":"p","\uA751":"p","\uA753":"p","\uA755":"p","\u24E0":"q","\uFF51":"q","\u024B":"q","\uA757":"q","\uA759":"q","\u24E1":"r","\uFF52":"r","\u0155":"r","\u1E59":"r","\u0159":"r","\u0211":"r","\u0213":"r","\u1E5B":"r","\u1E5D":"r","\u0157":"r","\u1E5F":"r","\u024D":"r","\u027D":"r","\uA75B":"r","\uA7A7":"r","\uA783":"r","\u24E2":"s","\uFF53":"s","\u00DF":"s","\u015B":"s","\u1E65":"s","\u015D":"s","\u1E61":"s","\u0161":"s","\u1E67":"s","\u1E63":"s","\u1E69":"s","\u0219":"s","\u015F":"s","\u023F":"s","\uA7A9":"s","\uA785":"s","\u1E9B":"s","\u24E3":"t","\uFF54":"t","\u1E6B":"t","\u1E97":"t","\u0165":"t","\u1E6D":"t","\u021B":"t","\u0163":"t","\u1E71":"t","\u1E6F":"t","\u0167":"t","\u01AD":"t","\u0288":"t","\u2C66":"t","\uA787":"t","\uA729":"tz","\u24E4":"u","\uFF55":"u","\u00F9":"u","\u00FA":"u","\u00FB":"u","\u0169":"u","\u1E79":"u","\u016B":"u","\u1E7B":"u","\u016D":"u","\u00FC":"u","\u01DC":"u","\u01D8":"u","\u01D6":"u","\u01DA":"u","\u1EE7":"u","\u016F":"u","\u0171":"u","\u01D4":"u","\u0215":"u","\u0217":"u","\u01B0":"u","\u1EEB":"u","\u1EE9":"u","\u1EEF":"u","\u1EED":"u","\u1EF1":"u","\u1EE5":"u","\u1E73":"u","\u0173":"u","\u1E77":"u","\u1E75":"u","\u0289":"u","\u24E5":"v","\uFF56":"v","\u1E7D":"v","\u1E7F":"v","\u028B":"v","\uA75F":"v","\u028C":"v","\uA761":"vy","\u24E6":"w","\uFF57":"w","\u1E81":"w","\u1E83":"w","\u0175":"w","\u1E87":"w","\u1E85":"w","\u1E98":"w","\u1E89":"w","\u2C73":"w","\u24E7":"x","\uFF58":"x","\u1E8B":"x","\u1E8D":"x","\u24E8":"y","\uFF59":"y","\u1EF3":"y","\u00FD":"y","\u0177":"y","\u1EF9":"y","\u0233":"y","\u1E8F":"y","\u00FF":"y","\u1EF7":"y","\u1E99":"y","\u1EF5":"y","\u01B4":"y","\u024F":"y","\u1EFF":"y","\u24E9":"z","\uFF5A":"z","\u017A":"z","\u1E91":"z","\u017C":"z","\u017E":"z","\u1E93":"z","\u1E95":"z","\u01B6":"z","\u0225":"z","\u0240":"z","\u2C6C":"z","\uA763":"z","\u0386":"\u0391","\u0388":"\u0395","\u0389":"\u0397","\u038A":"\u0399","\u03AA":"\u0399","\u038C":"\u039F","\u038E":"\u03A5","\u03AB":"\u03A5","\u038F":"\u03A9","\u03AC":"\u03B1","\u03AD":"\u03B5","\u03AE":"\u03B7","\u03AF":"\u03B9","\u03CA":"\u03B9","\u0390":"\u03B9","\u03CC":"\u03BF","\u03CD":"\u03C5","\u03CB":"\u03C5","\u03B0":"\u03C5","\u03C9":"\u03C9","\u03C2":"\u03C3"};

    $document = $(document);

    nextUid=(function() { var counter=1; return function() { return counter++; }; }());


    function reinsertElement(element) {
        var placeholder = $(document.createTextNode(''));

        element.before(placeholder);
        placeholder.before(element);
        placeholder.remove();
    }

    function stripDiacritics(str) {
        // Used 'uni range + named function' from http://jsperf.com/diacritics/18
        function match(a) {
            return DIACRITICS[a] || a;
        }

        return str.replace(/[^\u0000-\u007E]/g, match);
    }

    function indexOf(value, array) {
        var i = 0, l = array.length;
        for (; i < l; i = i + 1) {
            if (equal(value, array[i])) return i;
        }
        return -1;
    }

    function measureScrollbar () {
        var $template = $( MEASURE_SCROLLBAR_TEMPLATE );
        $template.appendTo('body');

        var dim = {
            width: $template.width() - $template[0].clientWidth,
            height: $template.height() - $template[0].clientHeight
        };
        $template.remove();

        return dim;
    }

    /**
     * Compares equality of a and b
     * @param a
     * @param b
     */
    function equal(a, b) {
        if (a === b) return true;
        if (a === undefined || b === undefined) return false;
        if (a === null || b === null) return false;
        // Check whether 'a' or 'b' is a string (primitive or object).
        // The concatenation of an empty string (+'') converts its argument to a string's primitive.
        if (a.constructor === String) return a+'' === b+''; // a+'' - in case 'a' is a String object
        if (b.constructor === String) return b+'' === a+''; // b+'' - in case 'b' is a String object
        return false;
    }

    /**
     * Splits the string into an array of values, trimming each value. An empty array is returned for nulls or empty
     * strings
     * @param string
     * @param separator
     */
    function splitVal(string, separator) {
        var val, i, l;
        if (string === null || string.length < 1) return [];
        val = string.split(separator);
        for (i = 0, l = val.length; i < l; i = i + 1) val[i] = $.trim(val[i]);
        return val;
    }

    function getSideBorderPadding(element) {
        return element.outerWidth(false) - element.width();
    }

    function installKeyUpChangeEvent(element) {
        var key="keyup-change-value";
        element.on("keydown", function () {
            if ($.data(element, key) === undefined) {
                $.data(element, key, element.val());
            }
        });
        element.on("keyup", function () {
            var val= $.data(element, key);
            if (val !== undefined && element.val() !== val) {
                $.removeData(element, key);
                element.trigger("keyup-change");
            }
        });
    }


    /**
     * filters mouse events so an event is fired only if the mouse moved.
     *
     * filters out mouse events that occur when mouse is stationary but
     * the elements under the pointer are scrolled.
     */
    function installFilteredMouseMove(element) {
        element.on("mousemove", function (e) {
            var lastpos = lastMousePosition;
            if (lastpos === undefined || lastpos.x !== e.pageX || lastpos.y !== e.pageY) {
                $(e.target).trigger("mousemove-filtered", e);
            }
        });
    }

    /**
     * Debounces a function. Returns a function that calls the original fn function only if no invocations have been made
     * within the last quietMillis milliseconds.
     *
     * @param quietMillis number of milliseconds to wait before invoking fn
     * @param fn function to be debounced
     * @param ctx object to be used as this reference within fn
     * @return debounced version of fn
     */
    function debounce(quietMillis, fn, ctx) {
        ctx = ctx || undefined;
        var timeout;
        return function () {
            var args = arguments;
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function() {
                fn.apply(ctx, args);
            }, quietMillis);
        };
    }

    function installDebouncedScroll(threshold, element) {
        var notify = debounce(threshold, function (e) { element.trigger("scroll-debounced", e);});
        element.on("scroll", function (e) {
            if (indexOf(e.target, element.get()) >= 0) notify(e);
        });
    }

    function focus($el) {
        if ($el[0] === document.activeElement) return;

        /* set the focus in a 0 timeout - that way the focus is set after the processing
            of the current event has finished - which seems like the only reliable way
            to set focus */
        window.setTimeout(function() {
            var el=$el[0], pos=$el.val().length, range;

            $el.focus();

            /* make sure el received focus so we do not error out when trying to manipulate the caret.
                sometimes modals or others listeners may steal it after its set */
            var isVisible = (el.offsetWidth > 0 || el.offsetHeight > 0);
            if (isVisible && el === document.activeElement) {

                /* after the focus is set move the caret to the end, necessary when we val()
                    just before setting focus */
                if(el.setSelectionRange)
                {
                    el.setSelectionRange(pos, pos);
                }
                else if (el.createTextRange) {
                    range = el.createTextRange();
                    range.collapse(false);
                    range.select();
                }
            }
        }, 0);
    }

    function getCursorInfo(el) {
        el = $(el)[0];
        var offset = 0;
        var length = 0;
        if ('selectionStart' in el) {
            offset = el.selectionStart;
            length = el.selectionEnd - offset;
        } else if ('selection' in document) {
            el.focus();
            var sel = document.selection.createRange();
            length = document.selection.createRange().text.length;
            sel.moveStart('character', -el.value.length);
            offset = sel.text.length - length;
        }
        return { offset: offset, length: length };
    }

    function killEvent(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    function killEventImmediately(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    function measureTextWidth(e) {
        if (!sizer){
            var style = e[0].currentStyle || window.getComputedStyle(e[0], null);
            sizer = $(document.createElement("div")).css({
                position: "absolute",
                left: "-10000px",
                top: "-10000px",
                display: "none",
                fontSize: style.fontSize,
                fontFamily: style.fontFamily,
                fontStyle: style.fontStyle,
                fontWeight: style.fontWeight,
                letterSpacing: style.letterSpacing,
                textTransform: style.textTransform,
                whiteSpace: "nowrap"
            });
            sizer.attr("class","select2-sizer");
            $("body").append(sizer);
        }
        sizer.text(e.val());
        return sizer.width();
    }

    function syncCssClasses(dest, src, adapter) {
        var classes, replacements = [], adapted;

        classes = $.trim(dest.attr("class"));

        if (classes) {
            classes = '' + classes; // for IE which returns object

            $(classes.split(/\s+/)).each2(function() {
                if (this.indexOf("select2-") === 0) {
                    replacements.push(this);
                }
            });
        }

        classes = $.trim(src.attr("class"));

        if (classes) {
            classes = '' + classes; // for IE which returns object

            $(classes.split(/\s+/)).each2(function() {
                if (this.indexOf("select2-") !== 0) {
                    adapted = adapter(this);

                    if (adapted) {
                        replacements.push(adapted);
                    }
                }
            });
        }

        dest.attr("class", replacements.join(" "));
    }


    function markMatch(text, term, markup, escapeMarkup) {
        var match=stripDiacritics(text.toUpperCase()).indexOf(stripDiacritics(term.toUpperCase())),
            tl=term.length;

        if (match<0) {
            markup.push(escapeMarkup(text));
            return;
        }

        markup.push(escapeMarkup(text.substring(0, match)));
        markup.push("<span class='select2-match'>");
        markup.push(escapeMarkup(text.substring(match, match + tl)));
        markup.push("</span>");
        markup.push(escapeMarkup(text.substring(match + tl, text.length)));
    }

    function defaultEscapeMarkup(markup) {
        var replace_map = {
            '\\': '&#92;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            "/": '&#47;'
        };

        return String(markup).replace(/[&<>"'\/\\]/g, function (match) {
            return replace_map[match];
        });
    }

    /**
     * Produces an ajax-based query function
     *
     * @param options object containing configuration parameters
     * @param options.params parameter map for the transport ajax call, can contain such options as cache, jsonpCallback, etc. see $.ajax
     * @param options.transport function that will be used to execute the ajax request. must be compatible with parameters supported by $.ajax
     * @param options.url url for the data
     * @param options.data a function(searchTerm, pageNumber, context) that should return an object containing query string parameters for the above url.
     * @param options.dataType request data type: ajax, jsonp, other datatypes supported by jQuery's $.ajax function or the transport function if specified
     * @param options.quietMillis (optional) milliseconds to wait before making the ajaxRequest, helps debounce the ajax function if invoked too often
     * @param options.results a function(remoteData, pageNumber, query) that converts data returned form the remote request to the format expected by Select2.
     *      The expected format is an object containing the following keys:
     *      results array of objects that will be used as choices
     *      more (optional) boolean indicating whether there are more results available
     *      Example: {results:[{id:1, text:'Red'},{id:2, text:'Blue'}], more:true}
     */
    function ajax(options) {
        var timeout, // current scheduled but not yet executed request
            handler = null,
            quietMillis = options.quietMillis || 100,
            ajaxUrl = options.url,
            self = this;

        return function (query) {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function () {
                var data = options.data, // ajax data function
                    url = ajaxUrl, // ajax url string or function
                    transport = options.transport || $.fn.select2.ajaxDefaults.transport,
                    // deprecated - to be removed in 4.0  - use params instead
                    deprecated = {
                        type: options.type || 'GET', // set type of request (GET or POST)
                        cache: options.cache || false,
                        jsonpCallback: options.jsonpCallback||undefined,
                        dataType: options.dataType||"json"
                    },
                    params = $.extend({}, $.fn.select2.ajaxDefaults.params, deprecated);

                data = data ? data.call(self, query.term, query.page, query.context) : null;
                url = (typeof url === 'function') ? url.call(self, query.term, query.page, query.context) : url;

                if (handler && typeof handler.abort === "function") { handler.abort(); }

                if (options.params) {
                    if ($.isFunction(options.params)) {
                        $.extend(params, options.params.call(self));
                    } else {
                        $.extend(params, options.params);
                    }
                }

                $.extend(params, {
                    url: url,
                    dataType: options.dataType,
                    data: data,
                    success: function (data) {
                        // TODO - replace query.page with query so users have access to term, page, etc.
                        // added query as third paramter to keep backwards compatibility
                        var results = options.results(data, query.page, query);
                        query.callback(results);
                    },
                    error: function(jqXHR, textStatus, errorThrown){
                        var results = {
                            hasError: true,
                            jqXHR: jqXHR,
                            textStatus: textStatus,
                            errorThrown: errorThrown
                        };

                        query.callback(results);
                    }
                });
                handler = transport.call(self, params);
            }, quietMillis);
        };
    }

    /**
     * Produces a query function that works with a local array
     *
     * @param options object containing configuration parameters. The options parameter can either be an array or an
     * object.
     *
     * If the array form is used it is assumed that it contains objects with 'id' and 'text' keys.
     *
     * If the object form is used it is assumed that it contains 'data' and 'text' keys. The 'data' key should contain
     * an array of objects that will be used as choices. These objects must contain at least an 'id' key. The 'text'
     * key can either be a String in which case it is expected that each element in the 'data' array has a key with the
     * value of 'text' which will be used to match choices. Alternatively, text can be a function(item) that can extract
     * the text.
     */
    function local(options) {
        var data = options, // data elements
            dataText,
            tmp,
            text = function (item) { return ""+item.text; }; // function used to retrieve the text portion of a data item that is matched against the search

         if ($.isArray(data)) {
            tmp = data;
            data = { results: tmp };
        }

         if ($.isFunction(data) === false) {
            tmp = data;
            data = function() { return tmp; };
        }

        var dataItem = data();
        if (dataItem.text) {
            text = dataItem.text;
            // if text is not a function we assume it to be a key name
            if (!$.isFunction(text)) {
                dataText = dataItem.text; // we need to store this in a separate variable because in the next step data gets reset and data.text is no longer available
                text = function (item) { return item[dataText]; };
            }
        }

        return function (query) {
            var t = query.term, filtered = { results: [] }, process;
            if (t === "") {
                query.callback(data());
                return;
            }

            process = function(datum, collection) {
                var group, attr;
                datum = datum[0];
                if (datum.children) {
                    group = {};
                    for (attr in datum) {
                        if (datum.hasOwnProperty(attr)) group[attr]=datum[attr];
                    }
                    group.children=[];
                    $(datum.children).each2(function(i, childDatum) { process(childDatum, group.children); });
                    if (group.children.length || query.matcher(t, text(group), datum)) {
                        collection.push(group);
                    }
                } else {
                    if (query.matcher(t, text(datum), datum)) {
                        collection.push(datum);
                    }
                }
            };

            $(data().results).each2(function(i, datum) { process(datum, filtered.results); });
            query.callback(filtered);
        };
    }

    // TODO javadoc
    function tags(data) {
        var isFunc = $.isFunction(data);
        return function (query) {
            var t = query.term, filtered = {results: []};
            var result = isFunc ? data(query) : data;
            if ($.isArray(result)) {
                $(result).each(function () {
                    var isObject = this.text !== undefined,
                        text = isObject ? this.text : this;
                    if (t === "" || query.matcher(t, text)) {
                        filtered.results.push(isObject ? this : {id: this, text: this});
                    }
                });
                query.callback(filtered);
            }
        };
    }

    /**
     * Checks if the formatter function should be used.
     *
     * Throws an error if it is not a function. Returns true if it should be used,
     * false if no formatting should be performed.
     *
     * @param formatter
     */
    function checkFormatter(formatter, formatterName) {
        if ($.isFunction(formatter)) return true;
        if (!formatter) return false;
        if (typeof(formatter) === 'string') return true;
        throw new Error(formatterName +" must be a string, function, or falsy value");
    }

  /**
   * Returns a given value
   * If given a function, returns its output
   *
   * @param val string|function
   * @param context value of "this" to be passed to function
   * @returns {*}
   */
    function evaluate(val, context) {
        if ($.isFunction(val)) {
            var args = Array.prototype.slice.call(arguments, 2);
            return val.apply(context, args);
        }
        return val;
    }

    function countResults(results) {
        var count = 0;
        $.each(results, function(i, item) {
            if (item.children) {
                count += countResults(item.children);
            } else {
                count++;
            }
        });
        return count;
    }

    /**
     * Default tokenizer. This function uses breaks the input on substring match of any string from the
     * opts.tokenSeparators array and uses opts.createSearchChoice to create the choice object. Both of those
     * two options have to be defined in order for the tokenizer to work.
     *
     * @param input text user has typed so far or pasted into the search field
     * @param selection currently selected choices
     * @param selectCallback function(choice) callback tho add the choice to selection
     * @param opts select2's opts
     * @return undefined/null to leave the current input unchanged, or a string to change the input to the returned value
     */
    function defaultTokenizer(input, selection, selectCallback, opts) {
        var original = input, // store the original so we can compare and know if we need to tell the search to update its text
            dupe = false, // check for whether a token we extracted represents a duplicate selected choice
            token, // token
            index, // position at which the separator was found
            i, l, // looping variables
            separator; // the matched separator

        if (!opts.createSearchChoice || !opts.tokenSeparators || opts.tokenSeparators.length < 1) return undefined;

        while (true) {
            index = -1;

            for (i = 0, l = opts.tokenSeparators.length; i < l; i++) {
                separator = opts.tokenSeparators[i];
                index = input.indexOf(separator);
                if (index >= 0) break;
            }

            if (index < 0) break; // did not find any token separator in the input string, bail

            token = input.substring(0, index);
            input = input.substring(index + separator.length);

            if (token.length > 0) {
                token = opts.createSearchChoice.call(this, token, selection);
                if (token !== undefined && token !== null && opts.id(token) !== undefined && opts.id(token) !== null) {
                    dupe = false;
                    for (i = 0, l = selection.length; i < l; i++) {
                        if (equal(opts.id(token), opts.id(selection[i]))) {
                            dupe = true; break;
                        }
                    }

                    if (!dupe) selectCallback(token);
                }
            }
        }

        if (original!==input) return input;
    }

    function cleanupJQueryElements() {
        var self = this;

        $.each(arguments, function (i, element) {
            self[element].remove();
            self[element] = null;
        });
    }

    /**
     * Creates a new class
     *
     * @param superClass
     * @param methods
     */
    function clazz(SuperClass, methods) {
        var constructor = function () {};
        constructor.prototype = new SuperClass;
        constructor.prototype.constructor = constructor;
        constructor.prototype.parent = SuperClass.prototype;
        constructor.prototype = $.extend(constructor.prototype, methods);
        return constructor;
    }

    AbstractSelect2 = clazz(Object, {

        // abstract
        bind: function (func) {
            var self = this;
            return function () {
                func.apply(self, arguments);
            };
        },

        // abstract
        init: function (opts) {
            var results, search, resultsSelector = ".select2-results";

            // prepare options
            this.opts = opts = this.prepareOpts(opts);

            this.id=opts.id;

            // destroy if called on an existing component
            if (opts.element.data("select2") !== undefined &&
                opts.element.data("select2") !== null) {
                opts.element.data("select2").destroy();
            }

            this.container = this.createContainer();

            this.liveRegion = $('.select2-hidden-accessible');
            if (this.liveRegion.length == 0) {
                this.liveRegion = $("<span>", {
                        role: "status",
                        "aria-live": "polite"
                    })
                    .addClass("select2-hidden-accessible")
                    .appendTo(document.body);
            }

            this.containerId="s2id_"+(opts.element.attr("id") || "autogen"+nextUid());
            this.containerEventName= this.containerId
                .replace(/([.])/g, '_')
                .replace(/([;&,\-\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
            this.container.attr("id", this.containerId);

            this.container.attr("title", opts.element.attr("title"));

            this.body = $("body");

            syncCssClasses(this.container, this.opts.element, this.opts.adaptContainerCssClass);

            this.container.attr("style", opts.element.attr("style"));
            this.container.css(evaluate(opts.containerCss, this.opts.element));
            this.container.addClass(evaluate(opts.containerCssClass, this.opts.element));

            this.elementTabIndex = this.opts.element.attr("tabindex");

            // swap container for the element
            this.opts.element
                .data("select2", this)
                .attr("tabindex", "-1")
                .before(this.container)
                .on("click.select2", killEvent); // do not leak click events

            this.container.data("select2", this);

            this.dropdown = this.container.find(".select2-drop");

            syncCssClasses(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass);

            this.dropdown.addClass(evaluate(opts.dropdownCssClass, this.opts.element));
            this.dropdown.data("select2", this);
            this.dropdown.on("click", killEvent);

            this.results = results = this.container.find(resultsSelector);
            this.search = search = this.container.find("input.select2-input");

            this.queryCount = 0;
            this.resultsPage = 0;
            this.context = null;

            // initialize the container
            this.initContainer();

            this.container.on("click", killEvent);

            installFilteredMouseMove(this.results);

            this.dropdown.on("mousemove-filtered", resultsSelector, this.bind(this.highlightUnderEvent));
            this.dropdown.on("touchstart touchmove touchend", resultsSelector, this.bind(function (event) {
                this._touchEvent = true;
                this.highlightUnderEvent(event);
            }));
            this.dropdown.on("touchmove", resultsSelector, this.bind(this.touchMoved));
            this.dropdown.on("touchstart touchend", resultsSelector, this.bind(this.clearTouchMoved));

            // Waiting for a click event on touch devices to select option and hide dropdown
            // otherwise click will be triggered on an underlying element
            this.dropdown.on('click', this.bind(function (event) {
                if (this._touchEvent) {
                    this._touchEvent = false;
                    this.selectHighlighted();
                }
            }));

            installDebouncedScroll(80, this.results);
            this.dropdown.on("scroll-debounced", resultsSelector, this.bind(this.loadMoreIfNeeded));

            // do not propagate change event from the search field out of the component
            $(this.container).on("change", ".select2-input", function(e) {e.stopPropagation();});
            $(this.dropdown).on("change", ".select2-input", function(e) {e.stopPropagation();});

            // if jquery.mousewheel plugin is installed we can prevent out-of-bounds scrolling of results via mousewheel
            if ($.fn.mousewheel) {
                results.mousewheel(function (e, delta, deltaX, deltaY) {
                    var top = results.scrollTop();
                    if (deltaY > 0 && top - deltaY <= 0) {
                        results.scrollTop(0);
                        killEvent(e);
                    } else if (deltaY < 0 && results.get(0).scrollHeight - results.scrollTop() + deltaY <= results.height()) {
                        results.scrollTop(results.get(0).scrollHeight - results.height());
                        killEvent(e);
                    }
                });
            }

            installKeyUpChangeEvent(search);
            search.on("keyup-change input paste", this.bind(this.updateResults));
            search.on("focus", function () { search.addClass("select2-focused"); });
            search.on("blur", function () { search.removeClass("select2-focused");});

            this.dropdown.on("mouseup", resultsSelector, this.bind(function (e) {
                if ($(e.target).closest(".select2-result-selectable").length > 0) {
                    this.highlightUnderEvent(e);
                    this.selectHighlighted(e);
                }
            }));

            // trap all mouse events from leaving the dropdown. sometimes there may be a modal that is listening
            // for mouse events outside of itself so it can close itself. since the dropdown is now outside the select2's
            // dom it will trigger the popup close, which is not what we want
            // focusin can cause focus wars between modals and select2 since the dropdown is outside the modal.
            this.dropdown.on("click mouseup mousedown touchstart touchend focusin", function (e) { e.stopPropagation(); });

            this.nextSearchTerm = undefined;

            if ($.isFunction(this.opts.initSelection)) {
                // initialize selection based on the current value of the source element
                this.initSelection();

                // if the user has provided a function that can set selection based on the value of the source element
                // we monitor the change event on the element and trigger it, allowing for two way synchronization
                this.monitorSource();
            }

            if (opts.maximumInputLength !== null) {
                this.search.attr("maxlength", opts.maximumInputLength);
            }

            var disabled = opts.element.prop("disabled");
            if (disabled === undefined) disabled = false;
            this.enable(!disabled);

            var readonly = opts.element.prop("readonly");
            if (readonly === undefined) readonly = false;
            this.readonly(readonly);

            // Calculate size of scrollbar
            scrollBarDimensions = scrollBarDimensions || measureScrollbar();

            this.autofocus = opts.element.prop("autofocus");
            opts.element.prop("autofocus", false);
            if (this.autofocus) this.focus();

            this.search.attr("placeholder", opts.searchInputPlaceholder);
        },

        // abstract
        destroy: function () {
            var element=this.opts.element, select2 = element.data("select2"), self = this;

            this.close();

            if (element.length && element[0].detachEvent && self._sync) {
                element.each(function () {
                    this.detachEvent("onpropertychange", self._sync);
                });
            }
            if (this.propertyObserver) {
                this.propertyObserver.disconnect();
                this.propertyObserver = null;
            }
            this._sync = null;

            if (select2 !== undefined) {
                select2.container.remove();
                select2.liveRegion.remove();
                select2.dropdown.remove();
                element
                    .removeClass("select2-offscreen")
                    .removeData("select2")
                    .off(".select2")
                    .prop("autofocus", this.autofocus || false);
                if (this.elementTabIndex) {
                    element.attr({tabindex: this.elementTabIndex});
                } else {
                    element.removeAttr("tabindex");
                }
                element.show();
            }

            cleanupJQueryElements.call(this,
                "container",
                "liveRegion",
                "dropdown",
                "results",
                "search"
            );
        },

        // abstract
        optionToData: function(element) {
            if (element.is("option")) {
                return {
                    id:element.prop("value"),
                    text:element.text(),
                    element: element.get(),
                    css: element.attr("class"),
                    disabled: element.prop("disabled"),
                    locked: equal(element.attr("locked"), "locked") || equal(element.data("locked"), true)
                };
            } else if (element.is("optgroup")) {
                return {
                    text:element.attr("label"),
                    children:[],
                    element: element.get(),
                    css: element.attr("class")
                };
            }
        },

        // abstract
        prepareOpts: function (opts) {
            var element, select, idKey, ajaxUrl, self = this;

            element = opts.element;

            if (element.get(0).tagName.toLowerCase() === "select") {
                this.select = select = opts.element;
            }

            if (select) {
                // these options are not allowed when attached to a select because they are picked up off the element itself
                $.each(["id", "multiple", "ajax", "query", "createSearchChoice", "initSelection", "data", "tags"], function () {
                    if (this in opts) {
                        throw new Error("Option '" + this + "' is not allowed for Select2 when attached to a <select> element.");
                    }
                });
            }

            opts = $.extend({}, {
                populateResults: function(container, results, query) {
                    var populate, id=this.opts.id, liveRegion=this.liveRegion;

                    populate=function(results, container, depth) {

                        var i, l, result, selectable, disabled, compound, node, label, innerContainer, formatted;

                        results = opts.sortResults(results, container, query);

                        // collect the created nodes for bulk append
                        var nodes = [];
                        for (i = 0, l = results.length; i < l; i = i + 1) {

                            result=results[i];

                            disabled = (result.disabled === true);
                            selectable = (!disabled) && (id(result) !== undefined);

                            compound=result.children && result.children.length > 0;

                            node=$("<li></li>");
                            node.addClass("select2-results-dept-"+depth);
                            node.addClass("select2-result");
                            node.addClass(selectable ? "select2-result-selectable" : "select2-result-unselectable");
                            if (disabled) { node.addClass("select2-disabled"); }
                            if (compound) { node.addClass("select2-result-with-children"); }
                            node.addClass(self.opts.formatResultCssClass(result));
                            node.attr("role", "presentation");

                            label=$(document.createElement("div"));
                            label.addClass("select2-result-label");
                            label.attr("id", "select2-result-label-" + nextUid());
                            label.attr("role", "option");

                            formatted=opts.formatResult(result, label, query, self.opts.escapeMarkup);
                            if (formatted!==undefined) {
                                label.html(formatted);
                                node.append(label);
                            }


                            if (compound) {

                                innerContainer=$("<ul></ul>");
                                innerContainer.addClass("select2-result-sub");
                                populate(result.children, innerContainer, depth+1);
                                node.append(innerContainer);
                            }

                            node.data("select2-data", result);
                            nodes.push(node[0]);
                        }

                        // bulk append the created nodes
                        container.append(nodes);
                        liveRegion.text(opts.formatMatches(results.length));
                    };

                    populate(results, container, 0);
                }
            }, $.fn.select2.defaults, opts);

            if (typeof(opts.id) !== "function") {
                idKey = opts.id;
                opts.id = function (e) { return e[idKey]; };
            }

            if ($.isArray(opts.element.data("select2Tags"))) {
                if ("tags" in opts) {
                    throw "tags specified as both an attribute 'data-select2-tags' and in options of Select2 " + opts.element.attr("id");
                }
                opts.tags=opts.element.data("select2Tags");
            }

            if (select) {
                opts.query = this.bind(function (query) {
                    var data = { results: [], more: false },
                        term = query.term,
                        children, placeholderOption, process;

                    process=function(element, collection) {
                        var group;
                        if (element.is("option")) {
                            if (query.matcher(term, element.text(), element)) {
                                collection.push(self.optionToData(element));
                            }
                        } else if (element.is("optgroup")) {
                            group=self.optionToData(element);
                            element.children().each2(function(i, elm) { process(elm, group.children); });
                            if (group.children.length>0) {
                                collection.push(group);
                            }
                        }
                    };

                    children=element.children();

                    // ignore the placeholder option if there is one
                    if (this.getPlaceholder() !== undefined && children.length > 0) {
                        placeholderOption = this.getPlaceholderOption();
                        if (placeholderOption) {
                            children=children.not(placeholderOption);
                        }
                    }

                    children.each2(function(i, elm) { process(elm, data.results); });

                    query.callback(data);
                });
                // this is needed because inside val() we construct choices from options and their id is hardcoded
                opts.id=function(e) { return e.id; };
            } else {
                if (!("query" in opts)) {

                    if ("ajax" in opts) {
                        ajaxUrl = opts.element.data("ajax-url");
                        if (ajaxUrl && ajaxUrl.length > 0) {
                            opts.ajax.url = ajaxUrl;
                        }
                        opts.query = ajax.call(opts.element, opts.ajax);
                    } else if ("data" in opts) {
                        opts.query = local(opts.data);
                    } else if ("tags" in opts) {
                        opts.query = tags(opts.tags);
                        if (opts.createSearchChoice === undefined) {
                            opts.createSearchChoice = function (term) { return {id: $.trim(term), text: $.trim(term)}; };
                        }
                        if (opts.initSelection === undefined) {
                            opts.initSelection = function (element, callback) {
                                var data = [];
                                $(splitVal(element.val(), opts.separator)).each(function () {
                                    var obj = { id: this, text: this },
                                        tags = opts.tags;
                                    if ($.isFunction(tags)) tags=tags();
                                    $(tags).each(function() { if (equal(this.id, obj.id)) { obj = this; return false; } });
                                    data.push(obj);
                                });

                                callback(data);
                            };
                        }
                    }
                }
            }
            if (typeof(opts.query) !== "function") {
                throw "query function not defined for Select2 " + opts.element.attr("id");
            }

            if (opts.createSearchChoicePosition === 'top') {
                opts.createSearchChoicePosition = function(list, item) { list.unshift(item); };
            }
            else if (opts.createSearchChoicePosition === 'bottom') {
                opts.createSearchChoicePosition = function(list, item) { list.push(item); };
            }
            else if (typeof(opts.createSearchChoicePosition) !== "function")  {
                throw "invalid createSearchChoicePosition option must be 'top', 'bottom' or a custom function";
            }

            return opts;
        },

        /**
         * Monitor the original element for changes and update select2 accordingly
         */
        // abstract
        monitorSource: function () {
            var el = this.opts.element, observer, self = this;

            el.on("change.select2", this.bind(function (e) {
                if (this.opts.element.data("select2-change-triggered") !== true) {
                    this.initSelection();
                }
            }));

            this._sync = this.bind(function () {

                // sync enabled state
                var disabled = el.prop("disabled");
                if (disabled === undefined) disabled = false;
                this.enable(!disabled);

                var readonly = el.prop("readonly");
                if (readonly === undefined) readonly = false;
                this.readonly(readonly);

                syncCssClasses(this.container, this.opts.element, this.opts.adaptContainerCssClass);
                this.container.addClass(evaluate(this.opts.containerCssClass, this.opts.element));

                syncCssClasses(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass);
                this.dropdown.addClass(evaluate(this.opts.dropdownCssClass, this.opts.element));

            });

            // IE8-10 (IE9/10 won't fire propertyChange via attachEventListener)
            if (el.length && el[0].attachEvent) {
                el.each(function() {
                    this.attachEvent("onpropertychange", self._sync);
                });
            }

            // safari, chrome, firefox, IE11
            observer = window.MutationObserver || window.WebKitMutationObserver|| window.MozMutationObserver;
            if (observer !== undefined) {
                if (this.propertyObserver) { delete this.propertyObserver; this.propertyObserver = null; }
                this.propertyObserver = new observer(function (mutations) {
                    $.each(mutations, self._sync);
                });
                this.propertyObserver.observe(el.get(0), { attributes:true, subtree:false });
            }
        },

        // abstract
        triggerSelect: function(data) {
            var evt = $.Event("select2-selecting", { val: this.id(data), object: data, choice: data });
            this.opts.element.trigger(evt);
            return !evt.isDefaultPrevented();
        },

        /**
         * Triggers the change event on the source element
         */
        // abstract
        triggerChange: function (details) {

            details = details || {};
            details= $.extend({}, details, { type: "change", val: this.val() });
            // prevents recursive triggering
            this.opts.element.data("select2-change-triggered", true);
            this.opts.element.trigger(details);
            this.opts.element.data("select2-change-triggered", false);

            // some validation frameworks ignore the change event and listen instead to keyup, click for selects
            // so here we trigger the click event manually
            this.opts.element.click();

            // ValidationEngine ignores the change event and listens instead to blur
            // so here we trigger the blur event manually if so desired
            if (this.opts.blurOnChange)
                this.opts.element.blur();
        },

        //abstract
        isInterfaceEnabled: function()
        {
            return this.enabledInterface === true;
        },

        // abstract
        enableInterface: function() {
            var enabled = this._enabled && !this._readonly,
                disabled = !enabled;

            if (enabled === this.enabledInterface) return false;

            this.container.toggleClass("select2-container-disabled", disabled);
            this.close();
            this.enabledInterface = enabled;

            return true;
        },

        // abstract
        enable: function(enabled) {
            if (enabled === undefined) enabled = true;
            if (this._enabled === enabled) return;
            this._enabled = enabled;

            this.opts.element.prop("disabled", !enabled);
            this.enableInterface();
        },

        // abstract
        disable: function() {
            this.enable(false);
        },

        // abstract
        readonly: function(enabled) {
            if (enabled === undefined) enabled = false;
            if (this._readonly === enabled) return;
            this._readonly = enabled;

            this.opts.element.prop("readonly", enabled);
            this.enableInterface();
        },

        // abstract
        opened: function () {
            return (this.container) ? this.container.hasClass("select2-dropdown-open") : false;
        },

        // abstract
        positionDropdown: function() {
            var $dropdown = this.dropdown,
                container = this.container,
                offset = container.offset(),
                height = container.outerHeight(false),
                width = container.outerWidth(false),
                dropHeight = $dropdown.outerHeight(false),
                $window = $(window),
                windowWidth = $window.width(),
                windowHeight = $window.height(),
                viewPortRight = $window.scrollLeft() + windowWidth,
                viewportBottom = $window.scrollTop() + windowHeight,
                dropTop = offset.top + height,
                dropLeft = offset.left,
                enoughRoomBelow = dropTop + dropHeight <= viewportBottom,
                enoughRoomAbove = (offset.top - dropHeight) >= $window.scrollTop(),
                dropWidth = $dropdown.outerWidth(false),
                enoughRoomOnRight = function() {
                    return dropLeft + dropWidth <= viewPortRight;
                },
                enoughRoomOnLeft = function() {
                    return offset.left + viewPortRight + container.outerWidth(false)  > dropWidth;
                },
                aboveNow = $dropdown.hasClass("select2-drop-above"),
                bodyOffset,
                above,
                changeDirection,
                css,
                resultsListNode;

            // always prefer the current above/below alignment, unless there is not enough room
            if (aboveNow) {
                above = true;
                if (!enoughRoomAbove && enoughRoomBelow) {
                    changeDirection = true;
                    above = false;
                }
            } else {
                above = false;
                if (!enoughRoomBelow && enoughRoomAbove) {
                    changeDirection = true;
                    above = true;
                }
            }

            //if we are changing direction we need to get positions when dropdown is hidden;
            if (changeDirection) {
                $dropdown.hide();
                offset = this.container.offset();
                height = this.container.outerHeight(false);
                width = this.container.outerWidth(false);
                dropHeight = $dropdown.outerHeight(false);
                viewPortRight = $window.scrollLeft() + windowWidth;
                viewportBottom = $window.scrollTop() + windowHeight;
                dropTop = offset.top + height;
                dropLeft = offset.left;
                dropWidth = $dropdown.outerWidth(false);
                $dropdown.show();

                // fix so the cursor does not move to the left within the search-textbox in IE
                this.focusSearch();
            }

            if (this.opts.dropdownAutoWidth) {
                resultsListNode = $('.select2-results', $dropdown)[0];
                $dropdown.addClass('select2-drop-auto-width');
                $dropdown.css('width', '');
                // Add scrollbar width to dropdown if vertical scrollbar is present
                dropWidth = $dropdown.outerWidth(false) + (resultsListNode.scrollHeight === resultsListNode.clientHeight ? 0 : scrollBarDimensions.width);
                dropWidth > width ? width = dropWidth : dropWidth = width;
                dropHeight = $dropdown.outerHeight(false);
            }
            else {
                this.container.removeClass('select2-drop-auto-width');
            }

            //console.log("below/ droptop:", dropTop, "dropHeight", dropHeight, "sum", (dropTop+dropHeight)+" viewport bottom", viewportBottom, "enough?", enoughRoomBelow);
            //console.log("above/ offset.top", offset.top, "dropHeight", dropHeight, "top", (offset.top-dropHeight), "scrollTop", this.body.scrollTop(), "enough?", enoughRoomAbove);

            // fix positioning when body has an offset and is not position: static
            if (this.body.css('position') !== 'static') {
                bodyOffset = this.body.offset();
                dropTop -= bodyOffset.top;
                dropLeft -= bodyOffset.left;
            }

            if (!enoughRoomOnRight() && enoughRoomOnLeft()) {
                dropLeft = offset.left + this.container.outerWidth(false) - dropWidth;
            }

            css =  {
                left: dropLeft,
                width: width
            };

            if (above) {
                css.top = offset.top - dropHeight;
                css.bottom = 'auto';
                this.container.addClass("select2-drop-above");
                $dropdown.addClass("select2-drop-above");
            }
            else {
                css.top = dropTop;
                css.bottom = 'auto';
                this.container.removeClass("select2-drop-above");
                $dropdown.removeClass("select2-drop-above");
            }
            css = $.extend(css, evaluate(this.opts.dropdownCss, this.opts.element));

            $dropdown.css(css);
        },

        // abstract
        shouldOpen: function() {
            var event;

            if (this.opened()) return false;

            if (this._enabled === false || this._readonly === true) return false;

            event = $.Event("select2-opening");
            this.opts.element.trigger(event);
            return !event.isDefaultPrevented();
        },

        // abstract
        clearDropdownAlignmentPreference: function() {
            // clear the classes used to figure out the preference of where the dropdown should be opened
            this.container.removeClass("select2-drop-above");
            this.dropdown.removeClass("select2-drop-above");
        },

        /**
         * Opens the dropdown
         *
         * @return {Boolean} whether or not dropdown was opened. This method will return false if, for example,
         * the dropdown is already open, or if the 'open' event listener on the element called preventDefault().
         */
        // abstract
        open: function () {

            if (!this.shouldOpen()) return false;

            this.opening();

            // Only bind the document mousemove when the dropdown is visible
            $document.on("mousemove.select2Event", function (e) {
                lastMousePosition.x = e.pageX;
                lastMousePosition.y = e.pageY;
            });

            return true;
        },

        /**
         * Performs the opening of the dropdown
         */
        // abstract
        opening: function() {
            var cid = this.containerEventName,
                scroll = "scroll." + cid,
                resize = "resize."+cid,
                orient = "orientationchange."+cid,
                mask;

            this.container.addClass("select2-dropdown-open").addClass("select2-container-active");

            this.clearDropdownAlignmentPreference();

            if(this.dropdown[0] !== this.body.children().last()[0]) {
                this.dropdown.detach().appendTo(this.body);
            }

            // create the dropdown mask if doesn't already exist
            mask = $("#select2-drop-mask");
            if (mask.length == 0) {
                mask = $(document.createElement("div"));
                mask.attr("id","select2-drop-mask").attr("class","select2-drop-mask");
                mask.hide();
                mask.appendTo(this.body);
                mask.on("mousedown touchstart click", function (e) {
                    // Prevent IE from generating a click event on the body
                    reinsertElement(mask);

                    var dropdown = $("#select2-drop"), self;
                    if (dropdown.length > 0) {
                        self=dropdown.data("select2");
                        if (self.opts.selectOnBlur) {
                            self.selectHighlighted({noFocus: true});
                        }
                        self.close();
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
            }

            // ensure the mask is always right before the dropdown
            if (this.dropdown.prev()[0] !== mask[0]) {
                this.dropdown.before(mask);
            }

            // move the global id to the correct dropdown
            $("#select2-drop").removeAttr("id");
            this.dropdown.attr("id", "select2-drop");

            // show the elements
            mask.show();

            this.positionDropdown();
            this.dropdown.show();
            this.positionDropdown();

            this.dropdown.addClass("select2-drop-active");

            // attach listeners to events that can change the position of the container and thus require
            // the position of the dropdown to be updated as well so it does not come unglued from the container
            var that = this;
            this.container.parents().add(window).each(function () {
                $(this).on(resize+" "+scroll+" "+orient, function (e) {
                    if (that.opened()) that.positionDropdown();
                });
            });


        },

        // abstract
        close: function () {
            if (!this.opened()) return;

            var cid = this.containerEventName,
                scroll = "scroll." + cid,
                resize = "resize."+cid,
                orient = "orientationchange."+cid;

            // unbind event listeners
            this.container.parents().add(window).each(function () { $(this).off(scroll).off(resize).off(orient); });

            this.clearDropdownAlignmentPreference();

            $("#select2-drop-mask").hide();
            this.dropdown.removeAttr("id"); // only the active dropdown has the select2-drop id
            this.dropdown.hide();
            this.container.removeClass("select2-dropdown-open").removeClass("select2-container-active");
            this.results.empty();

            // Now that the dropdown is closed, unbind the global document mousemove event
            $document.off("mousemove.select2Event");

            this.clearSearch();
            this.search.removeClass("select2-active");
            this.opts.element.trigger($.Event("select2-close"));
        },

        /**
         * Opens control, sets input value, and updates results.
         */
        // abstract
        externalSearch: function (term) {
            this.open();
            this.search.val(term);
            this.updateResults(false);
        },

        // abstract
        clearSearch: function () {

        },

        //abstract
        getMaximumSelectionSize: function() {
            return evaluate(this.opts.maximumSelectionSize, this.opts.element);
        },

        // abstract
        ensureHighlightVisible: function () {
            var results = this.results, children, index, child, hb, rb, y, more, topOffset;

            index = this.highlight();

            if (index < 0) return;

            if (index == 0) {

                // if the first element is highlighted scroll all the way to the top,
                // that way any unselectable headers above it will also be scrolled
                // into view

                results.scrollTop(0);
                return;
            }

            children = this.findHighlightableChoices().find('.select2-result-label');

            child = $(children[index]);

            topOffset = (child.offset() || {}).top || 0;

            hb = topOffset + child.outerHeight(true);

            // if this is the last child lets also make sure select2-more-results is visible
            if (index === children.length - 1) {
                more = results.find("li.select2-more-results");
                if (more.length > 0) {
                    hb = more.offset().top + more.outerHeight(true);
                }
            }

            rb = results.offset().top + results.outerHeight(true);
            if (hb > rb) {
                results.scrollTop(results.scrollTop() + (hb - rb));
            }
            y = topOffset - results.offset().top;

            // make sure the top of the element is visible
            if (y < 0 && child.css('display') != 'none' ) {
                results.scrollTop(results.scrollTop() + y); // y is negative
            }
        },

        // abstract
        findHighlightableChoices: function() {
            return this.results.find(".select2-result-selectable:not(.select2-disabled):not(.select2-selected)");
        },

        // abstract
        moveHighlight: function (delta) {
            var choices = this.findHighlightableChoices(),
                index = this.highlight();

            while (index > -1 && index < choices.length) {
                index += delta;
                var choice = $(choices[index]);
                if (choice.hasClass("select2-result-selectable") && !choice.hasClass("select2-disabled") && !choice.hasClass("select2-selected")) {
                    this.highlight(index);
                    break;
                }
            }
        },

        // abstract
        highlight: function (index) {
            var choices = this.findHighlightableChoices(),
                choice,
                data;

            if (arguments.length === 0) {
                return indexOf(choices.filter(".select2-highlighted")[0], choices.get());
            }

            if (index >= choices.length) index = choices.length - 1;
            if (index < 0) index = 0;

            this.removeHighlight();

            choice = $(choices[index]);
            choice.addClass("select2-highlighted");

            // ensure assistive technology can determine the active choice
            this.search.attr("aria-activedescendant", choice.find(".select2-result-label").attr("id"));

            this.ensureHighlightVisible();

            this.liveRegion.text(choice.text());

            data = choice.data("select2-data");
            if (data) {
                this.opts.element.trigger({ type: "select2-highlight", val: this.id(data), choice: data });
            }
        },

        removeHighlight: function() {
            this.results.find(".select2-highlighted").removeClass("select2-highlighted");
        },

        touchMoved: function() {
            this._touchMoved = true;
        },

        clearTouchMoved: function() {
          this._touchMoved = false;
        },

        // abstract
        countSelectableResults: function() {
            return this.findHighlightableChoices().length;
        },

        // abstract
        highlightUnderEvent: function (event) {
            var el = $(event.target).closest(".select2-result-selectable");
            if (el.length > 0 && !el.is(".select2-highlighted")) {
                var choices = this.findHighlightableChoices();
                this.highlight(choices.index(el));
            } else if (el.length == 0) {
                // if we are over an unselectable item remove all highlights
                this.removeHighlight();
            }
        },

        // abstract
        loadMoreIfNeeded: function () {
            var results = this.results,
                more = results.find("li.select2-more-results"),
                below, // pixels the element is below the scroll fold, below==0 is when the element is starting to be visible
                page = this.resultsPage + 1,
                self=this,
                term=this.search.val(),
                context=this.context;

            if (more.length === 0) return;
            below = more.offset().top - results.offset().top - results.height();

            if (below <= this.opts.loadMorePadding) {
                more.addClass("select2-active");
                this.opts.query({
                        element: this.opts.element,
                        term: term,
                        page: page,
                        context: context,
                        matcher: this.opts.matcher,
                        callback: this.bind(function (data) {

                    // ignore a response if the select2 has been closed before it was received
                    if (!self.opened()) return;


                    self.opts.populateResults.call(this, results, data.results, {term: term, page: page, context:context});
                    self.postprocessResults(data, false, false);

                    if (data.more===true) {
                        more.detach().appendTo(results).text(evaluate(self.opts.formatLoadMore, self.opts.element, page+1));
                        window.setTimeout(function() { self.loadMoreIfNeeded(); }, 10);
                    } else {
                        more.remove();
                    }
                    self.positionDropdown();
                    self.resultsPage = page;
                    self.context = data.context;
                    this.opts.element.trigger({ type: "select2-loaded", items: data });
                })});
            }
        },

        /**
         * Default tokenizer function which does nothing
         */
        tokenize: function() {

        },

        /**
         * @param initial whether or not this is the call to this method right after the dropdown has been opened
         */
        // abstract
        updateResults: function (initial) {
            var search = this.search,
                results = this.results,
                opts = this.opts,
                data,
                self = this,
                input,
                term = search.val(),
                lastTerm = $.data(this.container, "select2-last-term"),
                // sequence number used to drop out-of-order responses
                queryNumber;

            // prevent duplicate queries against the same term
            if (initial !== true && lastTerm && equal(term, lastTerm)) return;

            $.data(this.container, "select2-last-term", term);

            // if the search is currently hidden we do not alter the results
            if (initial !== true && (this.showSearchInput === false || !this.opened())) {
                return;
            }

            function postRender() {
                search.removeClass("select2-active");
                self.positionDropdown();
                if (results.find('.select2-no-results,.select2-selection-limit,.select2-searching').length) {
                    self.liveRegion.text(results.text());
                }
                else {
                    self.liveRegion.text(self.opts.formatMatches(results.find('.select2-result-selectable').length));
                }
            }

            function render(html) {
                results.html(html);
                postRender();
            }

            queryNumber = ++this.queryCount;

            var maxSelSize = this.getMaximumSelectionSize();
            if (maxSelSize >=1) {
                data = this.data();
                if ($.isArray(data) && data.length >= maxSelSize && checkFormatter(opts.formatSelectionTooBig, "formatSelectionTooBig")) {
                    render("<li class='select2-selection-limit'>" + evaluate(opts.formatSelectionTooBig, opts.element, maxSelSize) + "</li>");
                    return;
                }
            }

            if (search.val().length < opts.minimumInputLength) {
                if (checkFormatter(opts.formatInputTooShort, "formatInputTooShort")) {
                    render("<li class='select2-no-results'>" + evaluate(opts.formatInputTooShort, opts.element, search.val(), opts.minimumInputLength) + "</li>");
                } else {
                    render("");
                }
                if (initial && this.showSearch) this.showSearch(true);
                return;
            }

            if (opts.maximumInputLength && search.val().length > opts.maximumInputLength) {
                if (checkFormatter(opts.formatInputTooLong, "formatInputTooLong")) {
                    render("<li class='select2-no-results'>" + evaluate(opts.formatInputTooLong, opts.element, search.val(), opts.maximumInputLength) + "</li>");
                } else {
                    render("");
                }
                return;
            }

            if (opts.formatSearching && this.findHighlightableChoices().length === 0) {
                render("<li class='select2-searching'>" + evaluate(opts.formatSearching, opts.element) + "</li>");
            }

            search.addClass("select2-active");

            this.removeHighlight();

            // give the tokenizer a chance to pre-process the input
            input = this.tokenize();
            if (input != undefined && input != null) {
                search.val(input);
            }

            this.resultsPage = 1;

            opts.query({
                element: opts.element,
                    term: search.val(),
                    page: this.resultsPage,
                    context: null,
                    matcher: opts.matcher,
                    callback: this.bind(function (data) {
                var def; // default choice

                // ignore old responses
                if (queryNumber != this.queryCount) {
                  return;
                }

                // ignore a response if the select2 has been closed before it was received
                if (!this.opened()) {
                    this.search.removeClass("select2-active");
                    return;
                }

                // handle ajax error
                if(data.hasError !== undefined && checkFormatter(opts.formatAjaxError, "formatAjaxError")) {
                    render("<li class='select2-ajax-error'>" + evaluate(opts.formatAjaxError, opts.element, data.jqXHR, data.textStatus, data.errorThrown) + "</li>");
                    return;
                }

                // save context, if any
                this.context = (data.context===undefined) ? null : data.context;
                // create a default choice and prepend it to the list
                if (this.opts.createSearchChoice && search.val() !== "") {
                    def = this.opts.createSearchChoice.call(self, search.val(), data.results);
                    if (def !== undefined && def !== null && self.id(def) !== undefined && self.id(def) !== null) {
                        if ($(data.results).filter(
                            function () {
                                return equal(self.id(this), self.id(def));
                            }).length === 0) {
                            this.opts.createSearchChoicePosition(data.results, def);
                        }
                    }
                }

                if (data.results.length === 0 && checkFormatter(opts.formatNoMatches, "formatNoMatches")) {
                    render("<li class='select2-no-results'>" + evaluate(opts.formatNoMatches, opts.element, search.val()) + "</li>");
                    return;
                }

                results.empty();
                self.opts.populateResults.call(this, results, data.results, {term: search.val(), page: this.resultsPage, context:null});

                if (data.more === true && checkFormatter(opts.formatLoadMore, "formatLoadMore")) {
                    results.append("<li class='select2-more-results'>" + opts.escapeMarkup(evaluate(opts.formatLoadMore, opts.element, this.resultsPage)) + "</li>");
                    window.setTimeout(function() { self.loadMoreIfNeeded(); }, 10);
                }

                this.postprocessResults(data, initial);

                postRender();

                this.opts.element.trigger({ type: "select2-loaded", items: data });
            })});
        },

        // abstract
        cancel: function () {
            this.close();
        },

        // abstract
        blur: function () {
            // if selectOnBlur == true, select the currently highlighted option
            if (this.opts.selectOnBlur)
                this.selectHighlighted({noFocus: true});

            this.close();
            this.container.removeClass("select2-container-active");
            // synonymous to .is(':focus'), which is available in jquery >= 1.6
            if (this.search[0] === document.activeElement) { this.search.blur(); }
            this.clearSearch();
            this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
        },

        // abstract
        focusSearch: function () {
            focus(this.search);
        },

        // abstract
        selectHighlighted: function (options) {
            if (this._touchMoved) {
              this.clearTouchMoved();
              return;
            }
            var index=this.highlight(),
                highlighted=this.results.find(".select2-highlighted"),
                data = highlighted.closest('.select2-result').data("select2-data");

            if (data) {
                this.highlight(index);
                this.onSelect(data, options);
            } else if (options && options.noFocus) {
                this.close();
            }
        },

        // abstract
        getPlaceholder: function () {
            var placeholderOption;
            return this.opts.element.attr("placeholder") ||
                this.opts.element.attr("data-placeholder") || // jquery 1.4 compat
                this.opts.element.data("placeholder") ||
                this.opts.placeholder ||
                ((placeholderOption = this.getPlaceholderOption()) !== undefined ? placeholderOption.text() : undefined);
        },

        // abstract
        getPlaceholderOption: function() {
            if (this.select) {
                var firstOption = this.select.children('option').first();
                if (this.opts.placeholderOption !== undefined ) {
                    //Determine the placeholder option based on the specified placeholderOption setting
                    return (this.opts.placeholderOption === "first" && firstOption) ||
                           (typeof this.opts.placeholderOption === "function" && this.opts.placeholderOption(this.select));
                } else if ($.trim(firstOption.text()) === "" && firstOption.val() === "") {
                    //No explicit placeholder option specified, use the first if it's blank
                    return firstOption;
                }
            }
        },

        /**
         * Get the desired width for the container element.  This is
         * derived first from option `width` passed to select2, then
         * the inline 'style' on the original element, and finally
         * falls back to the jQuery calculated element width.
         */
        // abstract
        initContainerWidth: function () {
            function resolveContainerWidth() {
                var style, attrs, matches, i, l, attr;

                if (this.opts.width === "off") {
                    return null;
                } else if (this.opts.width === "element"){
                    return this.opts.element.outerWidth(false) === 0 ? 'auto' : this.opts.element.outerWidth(false) + 'px';
                } else if (this.opts.width === "copy" || this.opts.width === "resolve") {
                    // check if there is inline style on the element that contains width
                    style = this.opts.element.attr('style');
                    if (style !== undefined) {
                        attrs = style.split(';');
                        for (i = 0, l = attrs.length; i < l; i = i + 1) {
                            attr = attrs[i].replace(/\s/g, '');
                            matches = attr.match(/^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i);
                            if (matches !== null && matches.length >= 1)
                                return matches[1];
                        }
                    }

                    if (this.opts.width === "resolve") {
                        // next check if css('width') can resolve a width that is percent based, this is sometimes possible
                        // when attached to input type=hidden or elements hidden via css
                        style = this.opts.element.css('width');
                        if (style.indexOf("%") > 0) return style;

                        // finally, fallback on the calculated width of the element
                        return (this.opts.element.outerWidth(false) === 0 ? 'auto' : this.opts.element.outerWidth(false) + 'px');
                    }

                    return null;
                } else if ($.isFunction(this.opts.width)) {
                    return this.opts.width();
                } else {
                    return this.opts.width;
               }
            };

            var width = resolveContainerWidth.call(this);
            if (width !== null) {
                this.container.css("width", width);
            }
        }
    });

    SingleSelect2 = clazz(AbstractSelect2, {

        // single

        createContainer: function () {
            var container = $(document.createElement("div")).attr({
                "class": "select2-container"
            }).html([
                "<a href='javascript:void(0)' class='select2-choice' tabindex='-1'>",
                "   <span class='select2-chosen'>&#160;</span><abbr class='select2-search-choice-close'></abbr>",
                "   <span class='select2-arrow' role='presentation'><b role='presentation'></b></span>",
                "</a>",
                "<label for='' class='select2-offscreen'></label>",
                "<input class='select2-focusser select2-offscreen' type='text' aria-haspopup='true' role='button' />",
                "<div class='select2-drop select2-display-none'>",
                "   <div class='select2-search'>",
                "       <label for='' class='select2-offscreen'></label>",
                "       <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input' role='combobox' aria-expanded='true'",
                "       aria-autocomplete='list' />",
                "   </div>",
                "   <ul class='select2-results' role='listbox'>",
                "   </ul>",
                "</div>"].join(""));
            return container;
        },

        // single
        enableInterface: function() {
            if (this.parent.enableInterface.apply(this, arguments)) {
                this.focusser.prop("disabled", !this.isInterfaceEnabled());
            }
        },

        // single
        opening: function () {
            var el, range, len;

            if (this.opts.minimumResultsForSearch >= 0) {
                this.showSearch(true);
            }

            this.parent.opening.apply(this, arguments);

            if (this.showSearchInput !== false) {
                // IE appends focusser.val() at the end of field :/ so we manually insert it at the beginning using a range
                // all other browsers handle this just fine

                this.search.val(this.focusser.val());
            }
            if (this.opts.shouldFocusInput(this)) {
                this.search.focus();
                // move the cursor to the end after focussing, otherwise it will be at the beginning and
                // new text will appear *before* focusser.val()
                el = this.search.get(0);
                if (el.createTextRange) {
                    range = el.createTextRange();
                    range.collapse(false);
                    range.select();
                } else if (el.setSelectionRange) {
                    len = this.search.val().length;
                    el.setSelectionRange(len, len);
                }
            }

            // initializes search's value with nextSearchTerm (if defined by user)
            // ignore nextSearchTerm if the dropdown is opened by the user pressing a letter
            if(this.search.val() === "") {
                if(this.nextSearchTerm != undefined){
                    this.search.val(this.nextSearchTerm);
                    this.search.select();
                }
            }

            this.focusser.prop("disabled", true).val("");
            this.updateResults(true);
            this.opts.element.trigger($.Event("select2-open"));
        },

        // single
        close: function () {
            if (!this.opened()) return;
            this.parent.close.apply(this, arguments);

            this.focusser.prop("disabled", false);

            if (this.opts.shouldFocusInput(this)) {
                this.focusser.focus();
            }
        },

        // single
        focus: function () {
            if (this.opened()) {
                this.close();
            } else {
                this.focusser.prop("disabled", false);
                if (this.opts.shouldFocusInput(this)) {
                    this.focusser.focus();
                }
            }
        },

        // single
        isFocused: function () {
            return this.container.hasClass("select2-container-active");
        },

        // single
        cancel: function () {
            this.parent.cancel.apply(this, arguments);
            this.focusser.prop("disabled", false);

            if (this.opts.shouldFocusInput(this)) {
                this.focusser.focus();
            }
        },

        // single
        destroy: function() {
            $("label[for='" + this.focusser.attr('id') + "']")
                .attr('for', this.opts.element.attr("id"));
            this.parent.destroy.apply(this, arguments);

            cleanupJQueryElements.call(this,
                "selection",
                "focusser"
            );
        },

        // single
        initContainer: function () {

            var selection,
                container = this.container,
                dropdown = this.dropdown,
                idSuffix = nextUid(),
                elementLabel;

            if (this.opts.minimumResultsForSearch < 0) {
                this.showSearch(false);
            } else {
                this.showSearch(true);
            }

            this.selection = selection = container.find(".select2-choice");

            this.focusser = container.find(".select2-focusser");

            // add aria associations
            selection.find(".select2-chosen").attr("id", "select2-chosen-"+idSuffix);
            this.focusser.attr("aria-labelledby", "select2-chosen-"+idSuffix);
            this.results.attr("id", "select2-results-"+idSuffix);
            this.search.attr("aria-owns", "select2-results-"+idSuffix);

            // rewrite labels from original element to focusser
            this.focusser.attr("id", "s2id_autogen"+idSuffix);

            elementLabel = $("label[for='" + this.opts.element.attr("id") + "']");

            this.focusser.prev()
                .text(elementLabel.text())
                .attr('for', this.focusser.attr('id'));

            // Ensure the original element retains an accessible name
            var originalTitle = this.opts.element.attr("title");
            this.opts.element.attr("title", (originalTitle || elementLabel.text()));

            this.focusser.attr("tabindex", this.elementTabIndex);

            // write label for search field using the label from the focusser element
            this.search.attr("id", this.focusser.attr('id') + '_search');

            this.search.prev()
                .text($("label[for='" + this.focusser.attr('id') + "']").text())
                .attr('for', this.search.attr('id'));

            this.search.on("keydown", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;

                // filter 229 keyCodes (input method editor is processing key input)
                if (229 == e.keyCode) return;

                if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                    // prevent the page from scrolling
                    killEvent(e);
                    return;
                }

                switch (e.which) {
                    case KEY.UP:
                    case KEY.DOWN:
                        this.moveHighlight((e.which === KEY.UP) ? -1 : 1);
                        killEvent(e);
                        return;
                    case KEY.ENTER:
                        this.selectHighlighted();
                        killEvent(e);
                        return;
                    case KEY.TAB:
                        this.selectHighlighted({noFocus: true});
                        return;
                    case KEY.ESC:
                        this.cancel(e);
                        killEvent(e);
                        return;
                }
            }));

            this.search.on("blur", this.bind(function(e) {
                // a workaround for chrome to keep the search field focussed when the scroll bar is used to scroll the dropdown.
                // without this the search field loses focus which is annoying
                if (document.activeElement === this.body.get(0)) {
                    window.setTimeout(this.bind(function() {
                        if (this.opened()) {
                            this.search.focus();
                        }
                    }), 0);
                }
            }));

            this.focusser.on("keydown", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;

                if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e) || e.which === KEY.ESC) {
                    return;
                }

                if (this.opts.openOnEnter === false && e.which === KEY.ENTER) {
                    killEvent(e);
                    return;
                }

                if (e.which == KEY.DOWN || e.which == KEY.UP
                    || (e.which == KEY.ENTER && this.opts.openOnEnter)) {

                    if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return;

                    this.open();
                    killEvent(e);
                    return;
                }

                if (e.which == KEY.DELETE || e.which == KEY.BACKSPACE) {
                    if (this.opts.allowClear) {
                        this.clear();
                    }
                    killEvent(e);
                    return;
                }
            }));


            installKeyUpChangeEvent(this.focusser);
            this.focusser.on("keyup-change input", this.bind(function(e) {
                if (this.opts.minimumResultsForSearch >= 0) {
                    e.stopPropagation();
                    if (this.opened()) return;
                    this.open();
                }
            }));

            selection.on("mousedown touchstart", "abbr", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;
                this.clear();
                killEventImmediately(e);
                this.close();
                this.selection.focus();
            }));

            selection.on("mousedown touchstart", this.bind(function (e) {
                // Prevent IE from generating a click event on the body
                reinsertElement(selection);

                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }

                if (this.opened()) {
                    this.close();
                } else if (this.isInterfaceEnabled()) {
                    this.open();
                }

                killEvent(e);
            }));

            dropdown.on("mousedown touchstart", this.bind(function() {
                if (this.opts.shouldFocusInput(this)) {
                    this.search.focus();
                }
            }));

            selection.on("focus", this.bind(function(e) {
                killEvent(e);
            }));

            this.focusser.on("focus", this.bind(function(){
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.container.addClass("select2-container-active");
            })).on("blur", this.bind(function() {
                if (!this.opened()) {
                    this.container.removeClass("select2-container-active");
                    this.opts.element.trigger($.Event("select2-blur"));
                }
            }));
            this.search.on("focus", this.bind(function(){
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.container.addClass("select2-container-active");
            }));

            this.initContainerWidth();
            this.opts.element.addClass("select2-offscreen");
            this.setPlaceholder();

        },

        // single
        clear: function(triggerChange) {
            var data=this.selection.data("select2-data");
            if (data) { // guard against queued quick consecutive clicks
                var evt = $.Event("select2-clearing");
                this.opts.element.trigger(evt);
                if (evt.isDefaultPrevented()) {
                    return;
                }
                var placeholderOption = this.getPlaceholderOption();
                this.opts.element.val(placeholderOption ? placeholderOption.val() : "");
                this.selection.find(".select2-chosen").empty();
                this.selection.removeData("select2-data");
                this.setPlaceholder();

                if (triggerChange !== false){
                    this.opts.element.trigger({ type: "select2-removed", val: this.id(data), choice: data });
                    this.triggerChange({removed:data});
                }
            }
        },

        /**
         * Sets selection based on source element's value
         */
        // single
        initSelection: function () {
            var selected;
            if (this.isPlaceholderOptionSelected()) {
                this.updateSelection(null);
                this.close();
                this.setPlaceholder();
            } else {
                var self = this;
                this.opts.initSelection.call(null, this.opts.element, function(selected){
                    if (selected !== undefined && selected !== null) {
                        self.updateSelection(selected);
                        self.close();
                        self.setPlaceholder();
                        self.nextSearchTerm = self.opts.nextSearchTerm(selected, self.search.val());
                    }
                });
            }
        },

        isPlaceholderOptionSelected: function() {
            var placeholderOption;
            if (this.getPlaceholder() === undefined) return false; // no placeholder specified so no option should be considered
            return ((placeholderOption = this.getPlaceholderOption()) !== undefined && placeholderOption.prop("selected"))
                || (this.opts.element.val() === "")
                || (this.opts.element.val() === undefined)
                || (this.opts.element.val() === null);
        },

        // single
        prepareOpts: function () {
            var opts = this.parent.prepareOpts.apply(this, arguments),
                self=this;

            if (opts.element.get(0).tagName.toLowerCase() === "select") {
                // install the selection initializer
                opts.initSelection = function (element, callback) {
                    var selected = element.find("option").filter(function() { return this.selected && !this.disabled });
                    // a single select box always has a value, no need to null check 'selected'
                    callback(self.optionToData(selected));
                };
            } else if ("data" in opts) {
                // install default initSelection when applied to hidden input and data is local
                opts.initSelection = opts.initSelection || function (element, callback) {
                    var id = element.val();
                    //search in data by id, storing the actual matching item
                    var match = null;
                    opts.query({
                        matcher: function(term, text, el){
                            var is_match = equal(id, opts.id(el));
                            if (is_match) {
                                match = el;
                            }
                            return is_match;
                        },
                        callback: !$.isFunction(callback) ? $.noop : function() {
                            callback(match);
                        }
                    });
                };
            }

            return opts;
        },

        // single
        getPlaceholder: function() {
            // if a placeholder is specified on a single select without a valid placeholder option ignore it
            if (this.select) {
                if (this.getPlaceholderOption() === undefined) {
                    return undefined;
                }
            }

            return this.parent.getPlaceholder.apply(this, arguments);
        },

        // single
        setPlaceholder: function () {
            var placeholder = this.getPlaceholder();

            if (this.isPlaceholderOptionSelected() && placeholder !== undefined) {

                // check for a placeholder option if attached to a select
                if (this.select && this.getPlaceholderOption() === undefined) return;

                this.selection.find(".select2-chosen").html(this.opts.escapeMarkup(placeholder));

                this.selection.addClass("select2-default");

                this.container.removeClass("select2-allowclear");
            }
        },

        // single
        postprocessResults: function (data, initial, noHighlightUpdate) {
            var selected = 0, self = this, showSearchInput = true;

            // find the selected element in the result list

            this.findHighlightableChoices().each2(function (i, elm) {
                if (equal(self.id(elm.data("select2-data")), self.opts.element.val())) {
                    selected = i;
                    return false;
                }
            });

            // and highlight it
            if (noHighlightUpdate !== false) {
                if (initial === true && selected >= 0) {
                    this.highlight(selected);
                } else {
                    this.highlight(0);
                }
            }

            // hide the search box if this is the first we got the results and there are enough of them for search

            if (initial === true) {
                var min = this.opts.minimumResultsForSearch;
                if (min >= 0) {
                    this.showSearch(countResults(data.results) >= min);
                }
            }
        },

        // single
        showSearch: function(showSearchInput) {
            if (this.showSearchInput === showSearchInput) return;

            this.showSearchInput = showSearchInput;

            this.dropdown.find(".select2-search").toggleClass("select2-search-hidden", !showSearchInput);
            this.dropdown.find(".select2-search").toggleClass("select2-offscreen", !showSearchInput);
            //add "select2-with-searchbox" to the container if search box is shown
            $(this.dropdown, this.container).toggleClass("select2-with-searchbox", showSearchInput);
        },

        // single
        onSelect: function (data, options) {

            if (!this.triggerSelect(data)) { return; }

            var old = this.opts.element.val(),
                oldData = this.data();

            this.opts.element.val(this.id(data));
            this.updateSelection(data);

            this.opts.element.trigger({ type: "select2-selected", val: this.id(data), choice: data });

            this.nextSearchTerm = this.opts.nextSearchTerm(data, this.search.val());
            this.close();

            if ((!options || !options.noFocus) && this.opts.shouldFocusInput(this)) {
                this.focusser.focus();
            }

            if (!equal(old, this.id(data))) {
                this.triggerChange({ added: data, removed: oldData });
            }
        },

        // single
        updateSelection: function (data) {

            var container=this.selection.find(".select2-chosen"), formatted, cssClass;

            this.selection.data("select2-data", data);

            container.empty();
            if (data !== null) {
                formatted=this.opts.formatSelection(data, container, this.opts.escapeMarkup);
            }
            if (formatted !== undefined) {
                container.append(formatted);
            }
            cssClass=this.opts.formatSelectionCssClass(data, container);
            if (cssClass !== undefined) {
                container.addClass(cssClass);
            }

            this.selection.removeClass("select2-default");

            if (this.opts.allowClear && this.getPlaceholder() !== undefined) {
                this.container.addClass("select2-allowclear");
            }
        },

        // single
        val: function () {
            var val,
                triggerChange = false,
                data = null,
                self = this,
                oldData = this.data();

            if (arguments.length === 0) {
                return this.opts.element.val();
            }

            val = arguments[0];

            if (arguments.length > 1) {
                triggerChange = arguments[1];
            }

            if (this.select) {
                this.select
                    .val(val)
                    .find("option").filter(function() { return this.selected }).each2(function (i, elm) {
                        data = self.optionToData(elm);
                        return false;
                    });
                this.updateSelection(data);
                this.setPlaceholder();
                if (triggerChange) {
                    this.triggerChange({added: data, removed:oldData});
                }
            } else {
                // val is an id. !val is true for [undefined,null,'',0] - 0 is legal
                if (!val && val !== 0) {
                    this.clear(triggerChange);
                    return;
                }
                if (this.opts.initSelection === undefined) {
                    throw new Error("cannot call val() if initSelection() is not defined");
                }
                this.opts.element.val(val);
                this.opts.initSelection(this.opts.element, function(data){
                    self.opts.element.val(!data ? "" : self.id(data));
                    self.updateSelection(data);
                    self.setPlaceholder();
                    if (triggerChange) {
                        self.triggerChange({added: data, removed:oldData});
                    }
                });
            }
        },

        // single
        clearSearch: function () {
            this.search.val("");
            this.focusser.val("");
        },

        // single
        data: function(value) {
            var data,
                triggerChange = false;

            if (arguments.length === 0) {
                data = this.selection.data("select2-data");
                if (data == undefined) data = null;
                return data;
            } else {
                if (arguments.length > 1) {
                    triggerChange = arguments[1];
                }
                if (!value) {
                    this.clear(triggerChange);
                } else {
                    data = this.data();
                    this.opts.element.val(!value ? "" : this.id(value));
                    this.updateSelection(value);
                    if (triggerChange) {
                        this.triggerChange({added: value, removed:data});
                    }
                }
            }
        }
    });

    MultiSelect2 = clazz(AbstractSelect2, {

        // multi
        createContainer: function () {
            var container = $(document.createElement("div")).attr({
                "class": "select2-container select2-container-multi"
            }).html([
                "<ul class='select2-choices'>",
                "  <li class='select2-search-field'>",
                "    <label for='' class='select2-offscreen'></label>",
                "    <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input'>",
                "  </li>",
                "</ul>",
                "<div class='select2-drop select2-drop-multi select2-display-none'>",
                "   <ul class='select2-results'>",
                "   </ul>",
                "</div>"].join(""));
            return container;
        },

        // multi
        prepareOpts: function () {
            var opts = this.parent.prepareOpts.apply(this, arguments),
                self=this;

            // TODO validate placeholder is a string if specified

            if (opts.element.get(0).tagName.toLowerCase() === "select") {
                // install the selection initializer
                opts.initSelection = function (element, callback) {

                    var data = [];

                    element.find("option").filter(function() { return this.selected && !this.disabled }).each2(function (i, elm) {
                        data.push(self.optionToData(elm));
                    });
                    callback(data);
                };
            } else if ("data" in opts) {
                // install default initSelection when applied to hidden input and data is local
                opts.initSelection = opts.initSelection || function (element, callback) {
                    var ids = splitVal(element.val(), opts.separator);
                    //search in data by array of ids, storing matching items in a list
                    var matches = [];
                    opts.query({
                        matcher: function(term, text, el){
                            var is_match = $.grep(ids, function(id) {
                                return equal(id, opts.id(el));
                            }).length;
                            if (is_match) {
                                matches.push(el);
                            }
                            return is_match;
                        },
                        callback: !$.isFunction(callback) ? $.noop : function() {
                            // reorder matches based on the order they appear in the ids array because right now
                            // they are in the order in which they appear in data array
                            var ordered = [];
                            for (var i = 0; i < ids.length; i++) {
                                var id = ids[i];
                                for (var j = 0; j < matches.length; j++) {
                                    var match = matches[j];
                                    if (equal(id, opts.id(match))) {
                                        ordered.push(match);
                                        matches.splice(j, 1);
                                        break;
                                    }
                                }
                            }
                            callback(ordered);
                        }
                    });
                };
            }

            return opts;
        },

        // multi
        selectChoice: function (choice) {

            var selected = this.container.find(".select2-search-choice-focus");
            if (selected.length && choice && choice[0] == selected[0]) {

            } else {
                if (selected.length) {
                    this.opts.element.trigger("choice-deselected", selected);
                }
                selected.removeClass("select2-search-choice-focus");
                if (choice && choice.length) {
                    this.close();
                    choice.addClass("select2-search-choice-focus");
                    this.opts.element.trigger("choice-selected", choice);
                }
            }
        },

        // multi
        destroy: function() {
            $("label[for='" + this.search.attr('id') + "']")
                .attr('for', this.opts.element.attr("id"));
            this.parent.destroy.apply(this, arguments);

            cleanupJQueryElements.call(this,
                "searchContainer",
                "selection"
            );
        },

        // multi
        initContainer: function () {

            var selector = ".select2-choices", selection;

            this.searchContainer = this.container.find(".select2-search-field");
            this.selection = selection = this.container.find(selector);

            var _this = this;
            this.selection.on("click", ".select2-container:not(.select2-container-disabled) .select2-search-choice:not(.select2-locked)", function (e) {
                _this.search[0].focus();
                _this.selectChoice($(this));
            });

            // rewrite labels from original element to focusser
            this.search.attr("id", "s2id_autogen"+nextUid());

            this.search.prev()
                .text($("label[for='" + this.opts.element.attr("id") + "']").text())
                .attr('for', this.search.attr('id'));

            this.search.on("input paste", this.bind(function() {
                if (this.search.attr('placeholder') && this.search.val().length == 0) return;
                if (!this.isInterfaceEnabled()) return;
                if (!this.opened()) {
                    this.open();
                }
            }));

            this.search.attr("tabindex", this.elementTabIndex);

            this.keydowns = 0;
            this.search.on("keydown", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;

                ++this.keydowns;
                var selected = selection.find(".select2-search-choice-focus");
                var prev = selected.prev(".select2-search-choice:not(.select2-locked)");
                var next = selected.next(".select2-search-choice:not(.select2-locked)");
                var pos = getCursorInfo(this.search);

                if (selected.length &&
                    (e.which == KEY.LEFT || e.which == KEY.RIGHT || e.which == KEY.BACKSPACE || e.which == KEY.DELETE || e.which == KEY.ENTER)) {
                    var selectedChoice = selected;
                    if (e.which == KEY.LEFT && prev.length) {
                        selectedChoice = prev;
                    }
                    else if (e.which == KEY.RIGHT) {
                        selectedChoice = next.length ? next : null;
                    }
                    else if (e.which === KEY.BACKSPACE) {
                        if (this.unselect(selected.first())) {
                            this.search.width(10);
                            selectedChoice = prev.length ? prev : next;
                        }
                    } else if (e.which == KEY.DELETE) {
                        if (this.unselect(selected.first())) {
                            this.search.width(10);
                            selectedChoice = next.length ? next : null;
                        }
                    } else if (e.which == KEY.ENTER) {
                        selectedChoice = null;
                    }

                    this.selectChoice(selectedChoice);
                    killEvent(e);
                    if (!selectedChoice || !selectedChoice.length) {
                        this.open();
                    }
                    return;
                } else if (((e.which === KEY.BACKSPACE && this.keydowns == 1)
                    || e.which == KEY.LEFT) && (pos.offset == 0 && !pos.length)) {

                    this.selectChoice(selection.find(".select2-search-choice:not(.select2-locked)").last());
                    killEvent(e);
                    return;
                } else {
                    this.selectChoice(null);
                }

                if (this.opened()) {
                    switch (e.which) {
                    case KEY.UP:
                    case KEY.DOWN:
                        this.moveHighlight((e.which === KEY.UP) ? -1 : 1);
                        killEvent(e);
                        return;
                    case KEY.ENTER:
                        this.selectHighlighted();
                        killEvent(e);
                        return;
                    case KEY.TAB:
                        this.selectHighlighted({noFocus:true});
                        this.close();
                        return;
                    case KEY.ESC:
                        this.cancel(e);
                        killEvent(e);
                        return;
                    }
                }

                if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e)
                 || e.which === KEY.BACKSPACE || e.which === KEY.ESC) {
                    return;
                }

                if (e.which === KEY.ENTER) {
                    if (this.opts.openOnEnter === false) {
                        return;
                    } else if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) {
                        return;
                    }
                }

                this.open();

                if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                    // prevent the page from scrolling
                    killEvent(e);
                }

                if (e.which === KEY.ENTER) {
                    // prevent form from being submitted
                    killEvent(e);
                }

            }));

            this.search.on("keyup", this.bind(function (e) {
                this.keydowns = 0;
                this.resizeSearch();
            })
            );

            this.search.on("blur", this.bind(function(e) {
                this.container.removeClass("select2-container-active");
                this.search.removeClass("select2-focused");
                this.selectChoice(null);
                if (!this.opened()) this.clearSearch();
                e.stopImmediatePropagation();
                this.opts.element.trigger($.Event("select2-blur"));
            }));

            this.container.on("click", selector, this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;
                if ($(e.target).closest(".select2-search-choice").length > 0) {
                    // clicked inside a select2 search choice, do not open
                    return;
                }
                this.selectChoice(null);
                this.clearPlaceholder();
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.open();
                this.focusSearch();
                e.preventDefault();
            }));

            this.container.on("focus", selector, this.bind(function () {
                if (!this.isInterfaceEnabled()) return;
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.container.addClass("select2-container-active");
                this.dropdown.addClass("select2-drop-active");
                this.clearPlaceholder();
            }));

            this.initContainerWidth();
            this.opts.element.addClass("select2-offscreen");

            // set the placeholder if necessary
            this.clearSearch();
        },

        // multi
        enableInterface: function() {
            if (this.parent.enableInterface.apply(this, arguments)) {
                this.search.prop("disabled", !this.isInterfaceEnabled());
            }
        },

        // multi
        initSelection: function () {
            var data;
            if (this.opts.element.val() === "" && this.opts.element.text() === "") {
                this.updateSelection([]);
                this.close();
                // set the placeholder if necessary
                this.clearSearch();
            }
            if (this.select || this.opts.element.val() !== "") {
                var self = this;
                this.opts.initSelection.call(null, this.opts.element, function(data){
                    if (data !== undefined && data !== null) {
                        self.updateSelection(data);
                        self.close();
                        // set the placeholder if necessary
                        self.clearSearch();
                    }
                });
            }
        },

        // multi
        clearSearch: function () {
            var placeholder = this.getPlaceholder(),
                maxWidth = this.getMaxSearchWidth();

            if (placeholder !== undefined  && this.getVal().length === 0 && this.search.hasClass("select2-focused") === false) {
                this.search.val(placeholder).addClass("select2-default");
                // stretch the search box to full width of the container so as much of the placeholder is visible as possible
                // we could call this.resizeSearch(), but we do not because that requires a sizer and we do not want to create one so early because of a firefox bug, see #944
                this.search.width(maxWidth > 0 ? maxWidth : this.container.css("width"));
            } else {
                this.search.val("").width(10);
            }
        },

        // multi
        clearPlaceholder: function () {
            if (this.search.hasClass("select2-default")) {
                this.search.val("").removeClass("select2-default");
            }
        },

        // multi
        opening: function () {
            this.clearPlaceholder(); // should be done before super so placeholder is not used to search
            this.resizeSearch();

            this.parent.opening.apply(this, arguments);

            this.focusSearch();

            // initializes search's value with nextSearchTerm (if defined by user)
            // ignore nextSearchTerm if the dropdown is opened by the user pressing a letter
            if(this.search.val() === "") {
                if(this.nextSearchTerm != undefined){
                    this.search.val(this.nextSearchTerm);
                    this.search.select();
                }
            }

            this.updateResults(true);
            if (this.opts.shouldFocusInput(this)) {
                this.search.focus();
            }
            this.opts.element.trigger($.Event("select2-open"));
        },

        // multi
        close: function () {
            if (!this.opened()) return;
            this.parent.close.apply(this, arguments);
        },

        // multi
        focus: function () {
            this.close();
            this.search.focus();
        },

        // multi
        isFocused: function () {
            return this.search.hasClass("select2-focused");
        },

        // multi
        updateSelection: function (data) {
            var ids = [], filtered = [], self = this;

            // filter out duplicates
            $(data).each(function () {
                if (indexOf(self.id(this), ids) < 0) {
                    ids.push(self.id(this));
                    filtered.push(this);
                }
            });
            data = filtered;

            this.selection.find(".select2-search-choice").remove();
            $(data).each(function () {
                self.addSelectedChoice(this);
            });
            self.postprocessResults();
        },

        // multi
        tokenize: function() {
            var input = this.search.val();
            input = this.opts.tokenizer.call(this, input, this.data(), this.bind(this.onSelect), this.opts);
            if (input != null && input != undefined) {
                this.search.val(input);
                if (input.length > 0) {
                    this.open();
                }
            }

        },

        // multi
        onSelect: function (data, options) {

            if (!this.triggerSelect(data) || data.text === "") { return; }

            this.addSelectedChoice(data);

            this.opts.element.trigger({ type: "selected", val: this.id(data), choice: data });

            // keep track of the search's value before it gets cleared
            this.nextSearchTerm = this.opts.nextSearchTerm(data, this.search.val());

            this.clearSearch();
            this.updateResults();

            if (this.select || !this.opts.closeOnSelect) this.postprocessResults(data, false, this.opts.closeOnSelect===true);

            if (this.opts.closeOnSelect) {
                this.close();
                this.search.width(10);
            } else {
                if (this.countSelectableResults()>0) {
                    this.search.width(10);
                    this.resizeSearch();
                    if (this.getMaximumSelectionSize() > 0 && this.val().length >= this.getMaximumSelectionSize()) {
                        // if we reached max selection size repaint the results so choices
                        // are replaced with the max selection reached message
                        this.updateResults(true);
                    } else {
                        // initializes search's value with nextSearchTerm and update search result
                        if(this.nextSearchTerm != undefined){
                            this.search.val(this.nextSearchTerm);
                            this.updateResults();
                            this.search.select();
                        }
                    }
                    this.positionDropdown();
                } else {
                    // if nothing left to select close
                    this.close();
                    this.search.width(10);
                }
            }

            // since its not possible to select an element that has already been
            // added we do not need to check if this is a new element before firing change
            this.triggerChange({ added: data });

            if (!options || !options.noFocus)
                this.focusSearch();
        },

        // multi
        cancel: function () {
            this.close();
            this.focusSearch();
        },

        addSelectedChoice: function (data) {
            var enableChoice = !data.locked,
                enabledItem = $(
                    "<li class='select2-search-choice'>" +
                    "    <div></div>" +
                    "    <a href='#' class='select2-search-choice-close' tabindex='-1'></a>" +
                    "</li>"),
                disabledItem = $(
                    "<li class='select2-search-choice select2-locked'>" +
                    "<div></div>" +
                    "</li>");
            var choice = enableChoice ? enabledItem : disabledItem,
                id = this.id(data),
                val = this.getVal(),
                formatted,
                cssClass;

            formatted=this.opts.formatSelection(data, choice.find("div"), this.opts.escapeMarkup);
            if (formatted != undefined) {
                choice.find("div").replaceWith("<div>"+formatted+"</div>");
            }
            cssClass=this.opts.formatSelectionCssClass(data, choice.find("div"));
            if (cssClass != undefined) {
                choice.addClass(cssClass);
            }

            if(enableChoice){
              choice.find(".select2-search-choice-close")
                  .on("mousedown", killEvent)
                  .on("click dblclick", this.bind(function (e) {
                  if (!this.isInterfaceEnabled()) return;

                  this.unselect($(e.target));
                  this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
                  killEvent(e);
                  this.close();
                  this.focusSearch();
              })).on("focus", this.bind(function () {
                  if (!this.isInterfaceEnabled()) return;
                  this.container.addClass("select2-container-active");
                  this.dropdown.addClass("select2-drop-active");
              }));
            }

            choice.data("select2-data", data);
            choice.insertBefore(this.searchContainer);

            val.push(id);
            this.setVal(val);
        },

        // multi
        unselect: function (selected) {
            var val = this.getVal(),
                data,
                index;
            selected = selected.closest(".select2-search-choice");

            if (selected.length === 0) {
                throw "Invalid argument: " + selected + ". Must be .select2-search-choice";
            }

            data = selected.data("select2-data");

            if (!data) {
                // prevent a race condition when the 'x' is clicked really fast repeatedly the event can be queued
                // and invoked on an element already removed
                return;
            }

            var evt = $.Event("select2-removing");
            evt.val = this.id(data);
            evt.choice = data;
            this.opts.element.trigger(evt);

            if (evt.isDefaultPrevented()) {
                return false;
            }

            while((index = indexOf(this.id(data), val)) >= 0) {
                val.splice(index, 1);
                this.setVal(val);
                if (this.select) this.postprocessResults();
            }

            selected.remove();

            this.opts.element.trigger({ type: "select2-removed", val: this.id(data), choice: data });
            this.triggerChange({ removed: data });

            return true;
        },

        // multi
        postprocessResults: function (data, initial, noHighlightUpdate) {
            var val = this.getVal(),
                choices = this.results.find(".select2-result"),
                compound = this.results.find(".select2-result-with-children"),
                self = this;

            choices.each2(function (i, choice) {
                var id = self.id(choice.data("select2-data"));
                if (indexOf(id, val) >= 0) {
                    choice.addClass("select2-selected");
                    // mark all children of the selected parent as selected
                    choice.find(".select2-result-selectable").addClass("select2-selected");
                }
            });

            compound.each2(function(i, choice) {
                // hide an optgroup if it doesn't have any selectable children
                if (!choice.is('.select2-result-selectable')
                    && choice.find(".select2-result-selectable:not(.select2-selected)").length === 0) {
                    choice.addClass("select2-selected");
                }
            });

            if (this.highlight() == -1 && noHighlightUpdate !== false){
                self.highlight(0);
            }

            //If all results are chosen render formatNoMatches
            if(!this.opts.createSearchChoice && !choices.filter('.select2-result:not(.select2-selected)').length > 0){
                if(!data || data && !data.more && this.results.find(".select2-no-results").length === 0) {
                    if (checkFormatter(self.opts.formatNoMatches, "formatNoMatches")) {
                        this.results.append("<li class='select2-no-results'>" + evaluate(self.opts.formatNoMatches, self.opts.element, self.search.val()) + "</li>");
                    }
                }
            }

        },

        // multi
        getMaxSearchWidth: function() {
            return this.selection.width() - getSideBorderPadding(this.search);
        },

        // multi
        resizeSearch: function () {
            var minimumWidth, left, maxWidth, containerLeft, searchWidth,
                sideBorderPadding = getSideBorderPadding(this.search);

            minimumWidth = measureTextWidth(this.search) + 10;

            left = this.search.offset().left;

            maxWidth = this.selection.width();
            containerLeft = this.selection.offset().left;

            searchWidth = maxWidth - (left - containerLeft) - sideBorderPadding;

            if (searchWidth < minimumWidth) {
                searchWidth = maxWidth - sideBorderPadding;
            }

            if (searchWidth < 40) {
                searchWidth = maxWidth - sideBorderPadding;
            }

            if (searchWidth <= 0) {
              searchWidth = minimumWidth;
            }

            this.search.width(Math.floor(searchWidth));
        },

        // multi
        getVal: function () {
            var val;
            if (this.select) {
                val = this.select.val();
                return val === null ? [] : val;
            } else {
                val = this.opts.element.val();
                return splitVal(val, this.opts.separator);
            }
        },

        // multi
        setVal: function (val) {
            var unique;
            if (this.select) {
                this.select.val(val);
            } else {
                unique = [];
                // filter out duplicates
                $(val).each(function () {
                    if (indexOf(this, unique) < 0) unique.push(this);
                });
                this.opts.element.val(unique.length === 0 ? "" : unique.join(this.opts.separator));
            }
        },

        // multi
        buildChangeDetails: function (old, current) {
            var current = current.slice(0),
                old = old.slice(0);

            // remove intersection from each array
            for (var i = 0; i < current.length; i++) {
                for (var j = 0; j < old.length; j++) {
                    if (equal(this.opts.id(current[i]), this.opts.id(old[j]))) {
                        current.splice(i, 1);
                        if(i>0){
                            i--;
                        }
                        old.splice(j, 1);
                        j--;
                    }
                }
            }

            return {added: current, removed: old};
        },


        // multi
        val: function (val, triggerChange) {
            var oldData, self=this;

            if (arguments.length === 0) {
                return this.getVal();
            }

            oldData=this.data();
            if (!oldData.length) oldData=[];

            // val is an id. !val is true for [undefined,null,'',0] - 0 is legal
            if (!val && val !== 0) {
                this.opts.element.val("");
                this.updateSelection([]);
                this.clearSearch();
                if (triggerChange) {
                    this.triggerChange({added: this.data(), removed: oldData});
                }
                return;
            }

            // val is a list of ids
            this.setVal(val);

            if (this.select) {
                this.opts.initSelection(this.select, this.bind(this.updateSelection));
                if (triggerChange) {
                    this.triggerChange(this.buildChangeDetails(oldData, this.data()));
                }
            } else {
                if (this.opts.initSelection === undefined) {
                    throw new Error("val() cannot be called if initSelection() is not defined");
                }

                this.opts.initSelection(this.opts.element, function(data){
                    var ids=$.map(data, self.id);
                    self.setVal(ids);
                    self.updateSelection(data);
                    self.clearSearch();
                    if (triggerChange) {
                        self.triggerChange(self.buildChangeDetails(oldData, self.data()));
                    }
                });
            }
            this.clearSearch();
        },

        // multi
        onSortStart: function() {
            if (this.select) {
                throw new Error("Sorting of elements is not supported when attached to <select>. Attach to <input type='hidden'/> instead.");
            }

            // collapse search field into 0 width so its container can be collapsed as well
            this.search.width(0);
            // hide the container
            this.searchContainer.hide();
        },

        // multi
        onSortEnd:function() {

            var val=[], self=this;

            // show search and move it to the end of the list
            this.searchContainer.show();
            // make sure the search container is the last item in the list
            this.searchContainer.appendTo(this.searchContainer.parent());
            // since we collapsed the width in dragStarted, we resize it here
            this.resizeSearch();

            // update selection
            this.selection.find(".select2-search-choice").each(function() {
                val.push(self.opts.id($(this).data("select2-data")));
            });
            this.setVal(val);
            this.triggerChange();
        },

        // multi
        data: function(values, triggerChange) {
            var self=this, ids, old;
            if (arguments.length === 0) {
                 return this.selection
                     .children(".select2-search-choice")
                     .map(function() { return $(this).data("select2-data"); })
                     .get();
            } else {
                old = this.data();
                if (!values) { values = []; }
                ids = $.map(values, function(e) { return self.opts.id(e); });
                this.setVal(ids);
                this.updateSelection(values);
                this.clearSearch();
                if (triggerChange) {
                    this.triggerChange(this.buildChangeDetails(old, this.data()));
                }
            }
        }
    });

    $.fn.select2 = function () {

        var args = Array.prototype.slice.call(arguments, 0),
            opts,
            select2,
            method, value, multiple,
            allowedMethods = ["val", "destroy", "opened", "open", "close", "focus", "isFocused", "container", "dropdown", "onSortStart", "onSortEnd", "enable", "disable", "readonly", "positionDropdown", "data", "search"],
            valueMethods = ["opened", "isFocused", "container", "dropdown"],
            propertyMethods = ["val", "data"],
            methodsMap = { search: "externalSearch" };

        this.each(function () {
            if (args.length === 0 || typeof(args[0]) === "object") {
                opts = args.length === 0 ? {} : $.extend({}, args[0]);
                opts.element = $(this);

                if (opts.element.get(0).tagName.toLowerCase() === "select") {
                    multiple = opts.element.prop("multiple");
                } else {
                    multiple = opts.multiple || false;
                    if ("tags" in opts) {opts.multiple = multiple = true;}
                }

                select2 = multiple ? new window.Select2["class"].multi() : new window.Select2["class"].single();
                select2.init(opts);
            } else if (typeof(args[0]) === "string") {

                if (indexOf(args[0], allowedMethods) < 0) {
                    throw "Unknown method: " + args[0];
                }

                value = undefined;
                select2 = $(this).data("select2");
                if (select2 === undefined) return;

                method=args[0];

                if (method === "container") {
                    value = select2.container;
                } else if (method === "dropdown") {
                    value = select2.dropdown;
                } else {
                    if (methodsMap[method]) method = methodsMap[method];

                    value = select2[method].apply(select2, args.slice(1));
                }
                if (indexOf(args[0], valueMethods) >= 0
                    || (indexOf(args[0], propertyMethods) >= 0 && args.length == 1)) {
                    return false; // abort the iteration, ready to return first matched value
                }
            } else {
                throw "Invalid arguments to select2 plugin: " + args;
            }
        });
        return (value === undefined) ? this : value;
    };

    // plugin defaults, accessible to users
    $.fn.select2.defaults = {
        width: "copy",
        loadMorePadding: 0,
        closeOnSelect: true,
        openOnEnter: true,
        containerCss: {},
        dropdownCss: {},
        containerCssClass: "",
        dropdownCssClass: "",
        formatResult: function(result, container, query, escapeMarkup) {
            var markup=[];
            markMatch(this.text(result), query.term, markup, escapeMarkup);
            return markup.join("");
        },
        formatSelection: function (data, container, escapeMarkup) {
            return data ? escapeMarkup(this.text(data)) : undefined;
        },
        sortResults: function (results, container, query) {
            return results;
        },
        formatResultCssClass: function(data) {return data.css;},
        formatSelectionCssClass: function(data, container) {return undefined;},
        minimumResultsForSearch: 0,
        minimumInputLength: 0,
        maximumInputLength: null,
        maximumSelectionSize: 0,
        id: function (e) { return e == undefined ? null : e.id; },
        text: function (e) {
          if (e && this.data && this.data.text) {
            if ($.isFunction(this.data.text)) {
              return this.data.text(e);
            } else {
              return e[this.data.text];
            }
          } else {
            return e.text;
          }
        },
        matcher: function(term, text) {
            return stripDiacritics(''+text).toUpperCase().indexOf(stripDiacritics(''+term).toUpperCase()) >= 0;
        },
        separator: ",",
        tokenSeparators: [],
        tokenizer: defaultTokenizer,
        escapeMarkup: defaultEscapeMarkup,
        blurOnChange: false,
        selectOnBlur: false,
        adaptContainerCssClass: function(c) { return c; },
        adaptDropdownCssClass: function(c) { return null; },
        nextSearchTerm: function(selectedObject, currentSearchTerm) { return undefined; },
        searchInputPlaceholder: '',
        createSearchChoicePosition: 'top',
        shouldFocusInput: function (instance) {
            // Attempt to detect touch devices
            var supportsTouchEvents = (('ontouchstart' in window) ||
                                       (navigator.msMaxTouchPoints > 0));

            // Only devices which support touch events should be special cased
            if (!supportsTouchEvents) {
                return true;
            }

            // Never focus the input if search is disabled
            if (instance.opts.minimumResultsForSearch < 0) {
                return false;
            }

            return true;
        }
    };

    $.fn.select2.locales = [];

    $.fn.select2.locales['en'] = {
         formatMatches: function (matches) { if (matches === 1) { return "One result is available, press enter to select it."; } return matches + " results are available, use up and down arrow keys to navigate."; },
         formatNoMatches: function () { return "No matches found"; },
         formatAjaxError: function (jqXHR, textStatus, errorThrown) { return "Loading failed"; },
         formatInputTooShort: function (input, min) { var n = min - input.length; return "Please enter " + n + " or more character" + (n == 1 ? "" : "s"); },
         formatInputTooLong: function (input, max) { var n = input.length - max; return "Please delete " + n + " character" + (n == 1 ? "" : "s"); },
         formatSelectionTooBig: function (limit) { return "You can only select " + limit + " item" + (limit == 1 ? "" : "s"); },
         formatLoadMore: function (pageNumber) { return "Loading more results…"; },
         formatSearching: function () { return "Searching…"; }
    };

    $.extend($.fn.select2.defaults, $.fn.select2.locales['en']);

    $.fn.select2.ajaxDefaults = {
        transport: $.ajax,
        params: {
            type: "GET",
            cache: false,
            dataType: "json"
        }
    };

    // exports
    window.Select2 = {
        query: {
            ajax: ajax,
            local: local,
            tags: tags
        }, util: {
            debounce: debounce,
            markMatch: markMatch,
            escapeMarkup: defaultEscapeMarkup,
            stripDiacritics: stripDiacritics
        }, "class": {
            "abstract": AbstractSelect2,
            "single": SingleSelect2,
            "multi": MultiSelect2
        }
    };

}(jQuery));

/*global LivepressConfig, lp_strings, Livepress, Dashboard, Collaboration, tinymce, tinyMCE, console, confirm, switchEditors, livepress_merge_confirmation, LivepressConfig, _wpmejsSettings, FB  */


/**
 * Global object into which we add our other functionality.
 *
 * @namespace
 * @type {Object}
 */
var OORTLE = OORTLE || {};
/**
 * Container for Livepress administration functionality.
 *
 * @memberOf Livepress
 * @namespace
 * @type {Object}
 */
Livepress.Admin = Livepress.Admin || {};

/**
 * Object that checks the live update status of a given post asynchronously.
 *
 * @memberOf Livepress.Admin
 * @namespace
 * @constructor
 * @requires LivepressConfig
 */
Livepress.Admin.PostStatus = function() {
    var CHECK_WAIT_TIME = 4, // Seconds
        MESSAGE_DISPLAY_TIME = 10, // Seconds
        SELF = this,
        spin = false;

    /**
     * Add a spinner to the post form.
     *
     * @private
     */
    function add_spin() {
        if ( spin ) {
            return;
        }
        spin = true;
        var $spinner = jQuery( '<div class=\'lp-spinner\'></div>' )
            .attr( 'id', 'lp_spin_img' );
        jQuery( 'form#post' ).before( $spinner );
    }

    /**
     * Add a notice to alert the user of some change.
     *
     * This implementation is based in the edit-form-advanced.php html structure
     * @param {String} msg Message to display to the user.
     * @param {String} kind Type of message. Used as a CSS class for styling.
     * @private
     */
    function message( msg, kind ) {
        kind = kind || 'lp-notice';
        var $el = jQuery( '<p/>' ).text( msg ),
            $container = jQuery( '<div class="updated ' + kind + '"></div>' );
        $container.append( $el );
        jQuery( '#post' ).before( $container );
        setTimeout(function() {
            $container.fadeOut( 2000, function() {
                jQuery( this ).remove();
            });
        }, MESSAGE_DISPLAY_TIME * 1000 );
    }

    /**
     * Remove the spinner added by add_spin().
     *
     * @private
     */
    function remove_spin() {
        spin = false;
        jQuery( '#lp_spin_img' ).remove();
    }

    /**
     * Add an error message for the user.
     *
     * @param {String} msg Error message text.
     * @private
     */
    function error( msg ) {
        message( msg, 'lp-error' );
    }

    SELF.error = error;

    /**
     * Add a warning message for the user.
     *
     * @param {String} msg Warning message text.
     * @private
     */
    function warning( msg ) {
        message( msg, 'lp-warning' );
    }

    /**
     * Set the status of the post live update attempt.
     *
     * @param {String} status Status code.
     * @private
     */
    function set_status( status ) {
        if ( status === 'completed' ) {
            message( 'Update was published live to users.' );
            remove_spin();
        } else if ( status === 'failed' ) {
            warning( 'Update was published NOT live.' );
            remove_spin();
        } else if ( status === 'lp_failed' ) {
            error( 'Can\'t get update status from LivePress.' );
            remove_spin();
        } else if ( status === 'empty' || '0' === status ) {
            remove_spin();
        } else if ( status === '-1' ) {
            error( 'Wrong AJAX nonce.' );
            remove_spin();
        } else {
            setTimeout( SELF.check, CHECK_WAIT_TIME * 1000 );
        }
    }

    /**
     * Check the current post's update status.
     *
     * @requires LivepressConfig#ajax_nonce
     * @requires LivepressConfig#post_id
     */
    SELF.check = function() {
        var nonces = jQuery( '#blogging-tool-nonces' );
        add_spin();
        jQuery.ajax({
            url: LivepressConfig.ajax_url,
            data: {
                livepress_action: true,
                _ajax_nonce: LivepressConfig.ajax_status_nonce,
                post_id: LivepressConfig.post_id,
                action: 'lp_status'
            },
            success: set_status,
            error: function() {
                error( 'Can\'t get update status from blog server.' );
                remove_spin();
            }
        });
    };

    jQuery( window ).on( 'livepress.post_update', function() {
        add_spin();
        setTimeout( SELF.check, CHECK_WAIT_TIME * 1000 );
    });
};

/**
 * Object containing the logic to post updates to Twitter.
 *
 * @memberOf Livepress.Admin
 * @namespace
 * @constructor
 */
Livepress.Admin.PostToTwitter = function() {
    var sending_post_to_twitter = false,
        msg_span_id = 'post_to_twitter_message',
        check_timeout,
        oauth_popup,
        TIME_BETWEEN_CHECK_OAUTH_REQUESTS = 5;

    /**
     * Show an OAuth popup if necessary.
     *
     * @param {String} url OAuth popup url.
     * @private
     */
    function show_oauth_popup( url ) {
        try {
            oauth_popup.close();
        } catch ( exc ) {
        }
        oauth_popup = window.open( url, '_blank', 'height=600,width=600' );

        var a = jQuery( '<a />' );
        a.attr( 'href', url );
        a.text( url );
        var b = jQuery( '<br />' );

        jQuery( '#post_to_twitter_url' )
            .append( b )
            .append( a )
            .click( function( e ) {
                try {
                    oauth_popup.close();
                } catch ( exc ) {
                }
                oauth_popup = undefined;
                oauth_popup = window.open( url, '_blank', 'height=600,width=600' );
                return false;
            })
            .show();
    }

    /**
     * Check the current status of Twitter OAuth authorization.
     *
     * Will poll the Twitter API asynchronously and display an error if needed.
     *
     * @param {Number} attempts Number of times to check authorization status.
     * @private
     */
    function check_oauth_authorization_status( attempts ) {
        var $msg_span = jQuery( '#' + msg_span_id ),
            times = attempts || 1,
            params = {
                action: 'lp_check_oauth_authorization_status',
                _ajax_nonce: LivepressConfig.ajax_check_oauth
            };

        $msg_span.html( lp_strings.checking_auth + '... (' + times + ')' );

        jQuery.ajax({
            url: './admin-ajax.php',
            data: params,
            type: 'post',
            async: true,

            error: function( XMLHttpRequest ) {
                $msg_span.html( lp_strings.failed_to_check );
            },
            success: function( data ) {
                if ( data.status === 'authorized' ) {
                    $msg_span.html(
                        lp_strings.sending_twitter + ': <strong>' + data.username + '</strong>.' );
                    jQuery( '#lp-post-to-twitter-change_link' ).show();
                    jQuery( '#lp-post-to-twitter-change' ).hide();
                } else if ( data.status === 'unauthorized' ) {
                    handle_twitter_deauthorization();
                } else if ( data.status === 'not_available' ) {
                    var closed = false;
                    if ( oauth_popup !== undefined ) {
                        try {
                            closed = oauth_popup.closed;
                        } catch ( e ) {
                            if ( e.name.toString() === 'ReferenceError' ) {
                                closed = true;
                            } else {
                                throw e;
                            }
                        }
                    }
                    if ( oauth_popup !== undefined && closed ) {
                        handle_twitter_deauthorization();
                    } else {
                        $msg_span.html( lp_strings.status_not_avail );
                        check_timeout = setTimeout(function() {
                            check_oauth_authorization_status( ++times );
                        }, TIME_BETWEEN_CHECK_OAUTH_REQUESTS * 1000 );
                    }
                } else {
                    $msg_span.html( lp_strings.internal_error );
                }
            }
        });
    }

    /**
     * Update post on Twitter using current OAuth credentials.
     *
     * @param {Boolean} change_oauth_user Change the user making the request.
     * @param {Boolean} disable Disable OAuth popup.
     * @returns {Boolean} True when sending, False if already in the process of sending.
     * @private
     */
    function update_post_to_twitter( change_oauth_user, disable ) {
        var $msg_span,
            params;

        if ( sending_post_to_twitter ) {
            return false;
        }
        sending_post_to_twitter = true;

        $msg_span = jQuery( '#' + msg_span_id );

        params = {};
        params.action = 'lp_post_to_twitter';
        params._ajax_nonce = LivepressConfig.ajax_lp_post_to_twitter;
        params.enable = document.getElementById( 'lp-remote' ).checked;
        if ( change_oauth_user ) {
            params.change_oauth_user = true;
        }

        jQuery( '#post_to_twitter_message_change_link' ).hide();
        jQuery( '#post_to_twitter_url' ).hide();

        jQuery.ajax({
            url: './admin-ajax.php',
            data: params,
            type: 'post',
            async: true,

            error: function( XMLHttpRequest ) {
                if ( XMLHttpRequest.status === 409 ) {
                    $msg_span.html( 'Already ' + ( ( params.enable ) ? 'enabled.' : 'disabled.' ) );
                } else if ( XMLHttpRequest.status === 502 ) {
                    if ( XMLHttpRequest.responseText === '404' ) {
                        $msg_span.html( lp_strings.noconnect_twitter );
                    } else {
                        $msg_span.html( lp_strings.noconnect_livepress );
                    }
                } else {
                    $msg_span.html(
                        lp_strings.failed_unknown + ' (' + lp_strings.return_code + ': ' + XMLHttpRequest.status + ')'
                    );
                }
                clearTimeout( check_timeout );
            },
            success: function( data ) {
                if ( params.enable ) {

                    $msg_span.html(
                        lp_strings.new_twitter_window
                    );
                    show_oauth_popup( data );
                    check_timeout = setTimeout( check_oauth_authorization_status,
                        TIME_BETWEEN_CHECK_OAUTH_REQUESTS * 1000 );
                } else {
                    clearTimeout( check_timeout );
                    if ( disable !== true ) {
                        $msg_span.html( '' );
                    }
                }
            },
            complete: function() {
                sending_post_to_twitter = false;
            }
        });

        return true;
    }

    /**
     * If Twitter access is unauthorized, show the user an approripate message.
     *
     * @private
     */
    function handle_twitter_deauthorization() {
        var $msg_span = jQuery( '#' + msg_span_id );
        $msg_span.html( lp_strings.twitter_unauthorized );
        update_post_to_twitter( false, true );
    }

    /**
     * Universal callback function used inside click events.
     *
     * @param {Event} e Event passed by the click event.
     * @param {Boolean} change_oauth_user Flag to change the current OAuth user.
     * @private
     */
    function callback( e, change_oauth_user ) {
        e.preventDefault();
        e.stopPropagation();
        update_post_to_twitter( change_oauth_user );
    }

    jQuery( '#post_to_twitter' ).on( 'click', function( e ) {
        callback( e, false );
    });

    jQuery( '#lp-post-to-twitter-change, #lp-post-to-twitter-change_link' ).on( 'click', function( e ) {
        callback( e, true );
    });

    jQuery( '#lp-post-to-twitter-not-authorized' ).on( 'click', function( e ) {
        jQuery( '#' + msg_span_id ).html(
            lp_strings.new_twitter_window
        );
        show_oauth_popup( this.href );
        check_timeout = window.setTimeout( check_oauth_authorization_status, TIME_BETWEEN_CHECK_OAUTH_REQUESTS * 1000 );
        return false;
    });
};

/**
 * Object containing the logic responsible for the Live Blogging Tools palette.
 *
 * @memberOf Livepress.Admin
 * @namespace
 * @constructor
 * @requires OORTLE.Livepress.LivepressHUD.init
 * @requires Collaboration.Edit.initialize
 */
Livepress.Admin.Tools = function() {
    var tools_link_wrap = document.createElement( 'div' );
    tools_link_wrap.className = 'hide-if-no-js screen-meta-toggle';
    tools_link_wrap.setAttribute( 'id', 'blogging-tools-link-wrap' );

    // Var tools_link = document.createElement( 'button' );
    var tools_link = document.getElementById( 'show-settings-link' ).cloneNode();
    // Test for href to support olf versions of WP
    if ( tools_link.href ) {
        tools_link.setAttribute( 'href', '#blogging-tools-wrap' );
        tools_link.className = 'show-settings';
    } else {
        tools_link.className = 'button show-settings';
        tools_link.setAttribute( 'aria-controls', 'blogging-tools-wrap' );
        tools_link.setAttribute( 'aria-expanded', 'false' );
    }
    tools_link.setAttribute( 'id', 'blogging-tools-link' );

    var tools_wrap = document.createElement( 'div' );
    tools_wrap.className = 'hidden';
    tools_wrap.setAttribute( 'id', 'blogging-tools-wrap' );

    var $tools_link_wrap = jQuery( tools_link_wrap ),
        $tools_wrap = jQuery( tools_wrap );

    /**
     * Asynchronously load the markup for the Live Blogging Tools palette from the server and inject it into the page.
     *
     * @private
     */
    function getTabs() {
        jQuery.ajax({
            url: LivepressConfig.ajax_url,
            data: {
                action: 'lp_get_blogging_tools',
                _ajax_nonce: LivepressConfig.ajax_render_tabs,
                post_id: LivepressConfig.post_id
            },
            type: 'post',
            success: function( data ) {
                tools_wrap.innerHTML = data;

                jQuery( '.blogging-tools-tabs' ).on( 'click', 'a', function( e ) {
                    var link = jQuery( this ), panel;

                    e.preventDefault();

                    if ( link.is( '.active a' ) ) {
                        return false;
                    }

                    jQuery( '.blogging-tools-tabs .active' ).removeClass( 'active' );
                    link.parent( 'li' ).addClass( 'active' );

                    panel = jQuery( link.attr( 'href' ) );

                    jQuery( '.blogging-tools-content' ).not( panel ).removeClass( 'active' ).hide();
                    panel.addClass( 'active' ).show();

                    return false;
                });


                // Open by default
                if ( 'undefined' === typeof ( lp_keep_tools_closed ) ) {
                    jQuery( 'button#blogging-tools-link' ).click();
                }
            }
        });
    }

    // If we found the Facebook plugin on PHP, load the Facebook js for
    // admin panel post embedding:
    function checkFacebook() {
        if ( LivepressConfig.facebook === 'yes' ) {
            if ( typeof( FB ) !== 'undefined' ) {
                FB.XFBML.parse( document.getElementById( 'livepress-canvas' ) );
            } else {
                var fb_script = 'https://connect.facebook.net/' + LivepressConfig.locale + '/all.js';
                jQuery.getScript( fb_script, function() {
                    window.FB.init();
                    FB.XFBML.parse( document.getElementById( 'livepress-canvas' ) );
                });
            }
        }
    }

    function checkInstgrm() {
        if ( 'undefined' === typeof window.instgrm ) {
            jQuery.getScript( 'https://platform.instagram.com/en_US/embeds.js' );
        }else {
            window.instgrm.Embeds.process();
        }
    }

    /**
     * Configure event handlers for default Live Blogging Tools tabs.
     *
     * @public
     */
    this.wireupDefaults = function() {
        var nonces = jQuery( '#blogging-tool-nonces' ),
            SELF = this,
            promises;

        // Save and refresh when clicking the first update sticky toggle
        jQuery( '#pinfirst' ).on( 'click', function() {
            jQuery( 'form#post' ).submit();
        });

        jQuery( '#screen-meta' ).on( 'click', 'input#live-notes-submit', function( e ) {
            var submit = jQuery( this ),
                status = jQuery( '.live-notes-status' );
            e.preventDefault();

            jQuery.ajax({
                url: LivepressConfig.ajax_url,
                data: {
                    action: 'lp_update-live-notes',
                    post_id: LivepressConfig.post_id,
                    content: jQuery( '#live-notes-text' ).val(),
                    ajax_nonce: nonces.data( 'live-notes' )
                },
                type: 'post',
                success: function( data ) {
                    status.show();

                    setTimeout(function() {
                        status.addClass( 'hide-fade' );

                        setTimeout(function() {
                            status.hide().removeClass( 'hide-fade' );
                        }, 3000 );
                    }, 2000 );
                }
            });
        });
        jQuery( '#publish' ).on( 'click', function( e ) {
            jQuery( '#lp-pub-status-bar a' ).hide();
        });
        jQuery( '#lp-pub-status-bar' ).on( 'click', 'a.toggle-live', function( e ) {
            e.preventDefault();
            // Stop working if the main publishing button in play
            if ( 0 === jQuery( '#publish.disabled' ).length ) {
                // If already live, warn user
                if ( jQuery( '#livepress_status_meta_box' ).hasClass( 'live' ) ) {
                    var finished;
                    finished = jQuery.ajax({
                        url: LivepressConfig.ajax_url,
                        data: {
                            action: 'lp_update-live-status-to-finished',
                            post_id: LivepressConfig.post_id,
                            ajax_nonce: nonces.data( 'live-status' )
                        },
                        type: 'post'
                    });
                    jQuery.when( finished ).done(function() {
                        setTimeout(function() {
                            jQuery( '#publish' ).click();
                        }, 50 );
                    });
                } else if ( jQuery( '#livepress_status_meta_box' ).hasClass( 'finished' ) ) {

                    var restart;
                    restart = jQuery.ajax({
                        url: LivepressConfig.ajax_url,
                        data: {
                            action: 'lp_update-live-status-to-live',
                            post_id: LivepressConfig.post_id,
                            ajax_nonce: nonces.data( 'live-status' )
                        },
                        type: 'post'
                    });
                    jQuery.when( restart ).done(function() {
                        setTimeout(function() {
                            jQuery( '#publish' ).click();
                        }, 50 );
                    });
                    // todo: allow archiving
                    // if ( confirm( lp_strings.confirm_switch ) ) {
                    //     Dashboard.Twitter.removeAllTerms();
                    //     Dashboard.Twitter.removeAllTweets();
                    //     promises = toggleLiveStatus();
                    //     jQuery.when( promises ).done(function() {
                    //         // When toggle complete, redirect to complete the merge
                    //         jQuery( 'form#post' )
                    //             .attr( 'action', jQuery( 'form#post' ).attr( 'action' ) +
                    //                 '?post=' + LivepressConfig.post_id + '&action=edit' +
                    //                 '&merge_action=merge_children&merge_noonce=' + nonces.data( 'merge-post' ) )
                    //             .submit();
                    //     });
                    // }
                } else {
                    // Transitioning to live
                    promises = toggleLiveStatus();
                    jQuery.when( promises ).done(function() {
                        setTimeout(function() {
                            jQuery( '#publish' ).click();
                        }, 50 );
                    });
                }
            }

        });

        /**
         * Toggle live status with server
         */
        function toggleLiveStatus() {
            var promise1,
                promise2;

            promise1 = jQuery.ajax({
                url: LivepressConfig.ajax_url,
                data: {
                    action: 'lp_update-live-status',
                    post_id: LivepressConfig.post_id,
                    ajax_nonce: nonces.data( 'live-status' )
                },
                type: 'post'
            });

            promise2 = jQuery.ajax({
                url: LivepressConfig.ajax_url,
                data: {
                    action: 'lp_update-live-comments',
                    post_id: LivepressConfig.post_id,
                    _ajax_nonce: LivepressConfig.ajax_update_live_comments
                },
                type: 'post',
                dataType: 'json'
            });

            // Return a promise combining callbacks
            return ( jQuery.when( promise1, promise2 ) );
        }
    };

    /**
     * Render the loaded default tabs into the UI.
     */
    this.render = function() {
        var element = document.getElementById( 'blogging-tools-link-wrap' );
        if ( null !== element ) {
            element.parentNode.removeChild( element );
        }

        element = document.getElementById( 'blogging-tools-link' );
        if ( null !== element ) {
            element.parentNode.removeChild( element );
        }

        element = document.getElementById( 'blogging-tools-wrap' );
        if ( null !== element ) {
            element.parentNode.removeChild( element );
        }

        //Tools_link.innerText = 'Live Blogging Tools';
        $tools_link_wrap.append( tools_link );
        jQuery( tools_link ).html( '<span class="icon-livepress-logo"></span> ' + lp_strings.tools_link_text );
        $tools_link_wrap.insertAfter( '#screen-options-link-wrap' );

        $tools_wrap.insertAfter( '#screen-options-wrap' );

        getTabs();

        checkFacebook();

        checkInstgrm();

        jQuery( window ).trigger( 'livepress.blogging-tools-loaded' );
    };
};

function update_embeds() {
    var settings = {};
    if ( typeof _wpmejsSettings !== 'undefined' ) {
        settings.pluginPath = _wpmejsSettings.pluginPath;
    }
    settings.success = function( mejs ) {
        var autoplay = mejs.attributes.autoplay && 'false' !== mejs.attributes.autoplay;
        if ( 'flash' === mejs.pluginType && autoplay ) {
            mejs.addEventListener( 'canplay', function() {
                mejs.play();
            }, false );
        }
    };
    jQuery( '.wp-audio-shortcode, .wp-video-shortcode' ).not( '.mejs-container' ).mediaelementplayer( settings );

    if ( 'undefined' !== typeof( FB ) ) {
        FB.XFBML.parse( document.getElementById( 'livepress-canvas' ) );
    }
    if ( 'undefined' !== typeof window.instgrm ) {
        window.instgrm.Embeds.process();
    }
    if ( 'timeago' === LivepressConfig.timestamp_format ) {
        jQuery( 'abbr.livepress-timestamp' ).timeago().attr( 'title', '' );
    }
}

jQuery(function() {
    var pstatus = new Livepress.Admin.PostStatus(),
        post_to_twitter = new Livepress.Admin.PostToTwitter();

    pstatus.check();

    /**
     * Title: LivePress Plugin Documentation
     * Details the current LivePress plugin architecture (mostly internal objects).
     * This plugin works by splitting a blog entry into micro posts (identified by special div tags),
     * receiving new micro posts from other authors (ajax) while allowing the logged-in
     * user to post micro post updates (ajax).
     *
     * Authors:
     * Mauvis Ledford <switchstatement@gmail.com>
     * Filipe Giusti <filipegiusti@gmail.com>
     *
     * Section: (global variables)
     * These are variables accessible in the global Window namespace.
     *
     * method: tinyMCE.activeEditor.execCommand('livepress-activate')
     * Enables Livepress mode. Hides original TinyMCE area and displays LiveCanvas area. (Note that actual method call depends on <namespace>.)
     *
     * method: tinyMCE.activeEditor.execCommand('livepress-deactivate')
     * Disables Livepress mode. Redisplays original TinyMCE area. Hides LiveCanvas area. (Note that actual method call depends on <namespace>.)
     *
     * Events: global jQuery events.
     * See full list. LivePress events let you tie arbitrary code execution to specific happenings.
     *
     * start.livepress       -  _(event)_ Triggered when LivePress is starting.
     * stop.livepress        -  _(event)_ Triggered when LivePress is stopping.
     * connected.livepress    -  _(event)_ Triggered when LivePress is connected.
     * disconnected.livepress -  _(event)_ Triggered when LivePress is disconnected.
     * livepress.post_update -  _(event)_ Triggered when a new post update is made.
     *
     * Example: To listen for a livepress event run the following.
     *
     * >  $j(document).bind('stop.livepress', function(){
	 * >    alert(1);
	 * >  });
     */

    /**
     * Custom animate plugin for animating LivePressHUD.
     *
     * @memberOf jQuery
     * @param {Number} newInt New integer to which we are animating.
     */
    jQuery.fn.animateTo = function( newInt ) {
        var incremental = 1,
            $this = jQuery( this ),
            oldInt = parseInt( $this.text(), 10 ),
            t,
            ani;

        if ( oldInt === newInt ) {
            return;
        }

        if ( newInt < oldInt ) {
            incremental = incremental * -1;
        }

        ani = (function() {
            return function() {
                oldInt = oldInt + incremental;
                $this.text( oldInt );
                if ( oldInt === newInt ) {
                    clearInterval( t );
                }
            };
        }() );
        t = setInterval( ani, 50 );
    };

    if ( OORTLE.Livepress === undefined && window.tinymce !== undefined ) {
        /**
         * Global Livepress object inside the OORTLE namespace. Distinct from the global window.Livepress object.
         *
         * @namespace
         * @memberOf OORTLE
         * @type {Object}
         */
        OORTLE.Livepress = (function() {
            var LIVEPRESS_DEBUG = false,
                LiveCanvas,
                $liveCanvas,
                /**
                 * Object that controls the Micro post form that replaces (hides) the original WordPress TinyMCE form.
                 * It is blue instead of grey and posts (ajax) to the LiveCanvas area.
                 *
                 * @private
                 */
                microPostForm,

                /** Plugin namespace used for DOM ids and CSS classes. */
                namespace = 'livepress',
                /** Name of the current plugin. Must also be the name of the plugin directory. */
                pluginName = 'livepress-wp',
                i18n = tinyMCE.i18n,
                /** Default namespace of the current plugin. */
                pluginNamespace = 'en.livepress.',
                /** Relative folder for the TinyMCE plugin. */
                path = LivepressConfig.lp_plugin_url + 'tinymce/',

                /** Base directory from where the Livepress TinyMCE plugin loads. */
                d = tinyMCE.baseURI.directory,

                /** All configurable options. */
                config = LivepressConfig.PostMetainfo,

                $eDoc,
                $eHTML,
                $eHead,
                $eBody,

                livepressHUD,
                inittedOnce,
                username,
                Helper,
                draft = false,
                livePressChatStarted = false,

                $j = jQuery,
                $ = document.getElementById,

                extend = tinymce.extend,
                each = tinymce.each,

                livepress_init;

            window.eeActive = false;

            // Local i18n object, merges into tinyMCE.i18n
            each({
                // HUD
                'start': lp_strings.start_live,
                'stop': lp_strings.stop_live,
                'readers': lp_strings.readers_online,
                'updates': lp_strings.lp_updates_posted,
                'comments': lp_strings.comments,

                // TOGGLE
                'toggle': lp_strings.click_to_toggle,
                'title': lp_strings.real_time_editor,
                'toggleOff': lp_strings.off,
                'toggleOn': lp_strings.on,
                'toggleChat': lp_strings.private_chat
            }, function( val, name, obj ) {
                i18n[pluginNamespace + name] = val;
            });

            /**
             * Creates a stylesheet link for the specified file.
             *
             * @param {String} file Filename of the CSS to include.
             * @return {Object} jQuery object containing the new stylesheet reference.
             */
            function $makeStyle( file ) {
                return $j( '<link rel="stylesheet" type="text/css" href="' + path + 'css/' + file + '.css' + '?' + ( +new Date() ) + '" />' );
            }

            /**
             * Retrieve a string from the i18n object.
             *
             * @param {String} string Key to pull from the i18n object.
             * @returns {String} Value stored in the i18n object.
             */
            function getLang( string ) {
                return i18n[pluginNamespace + string];
            }

            /**
             * Informs you of current live posters, comments, etc.
             *
             * @namespace
             * @memberOf OORTLE.Livepress
             * @returns {Object}
             * @type {LivepressHUD}
             * @constructor
             */
            function LivepressHUD() {
                var $livepressHud,
                    $posts;

                /** Hide the HUD. */
                this.hide = function() {
                    $livepressHud.slideUp( 'fast' );
                };

                /** Hide the HUD. */
                this.show = function() {
                    $livepressHud.slideDown( 'fast' );
                };

                /**
                 * Initialize the HUD object.
                 *
                 * @see LivepressHUD#show
                 */
                this.init = function() {
                    $livepressHud = $j( '.inner-lp-dashboard' );
                    $posts = $j( '#livepress-updates_num' );
                    this.show();
                };

                /**
                 * Update the number of readers subscribed to the post.
                 *
                 * @param {Number} number New number of readers.
                 * @returns {Object} jQuery object containing the readers display element.
                 */
                this.updateReaders = function( number ) {
                    var label = ( 1 === number ) ? lp_strings.persons_online : lp_strings.people_online,
                        $readers = $j( '#livepress-online_num' );
                    $readers.siblings( '.label' ).text( label );
                    return $readers.text( number );
                };

                /**
                 * Update the number of live updates.
                 *
                 * @param {Number} number New number of updates.
                 * @returns {Object} jQuery object containing the updates display element.
                 */
                this.updateLivePosts = function( number ) {
                    if ( $posts.length === 0 ) {
                        $posts = $j( '#livepress-updates_num' );
                    }

                    return $posts.text( number );
                };

                /**
                 * Update the number of comments.
                 *
                 * @param {Number} number New number of comments.
                 * @return {Object} jQuery object containing the comments display element.
                 */
                this.updateComments = function( number ) {
                    var label = ( 1 === number ) ? lp_strings.comment : lp_strings.comments,
                        $comments = $j( '#livepress-comments_num' );

                    $comments.siblings( '.label' ).text( label );

                    return $comments.text( number );
                };

                /**
                 * Add to the total number of comments.
                 *
                 * @param {Number} number Number to add to the current number of comments.
                 */
                this.sumToComments = function( number ) {
                    var $comments = $j( '#livepress-comments_num' ),
                        actual = parseInt( $comments.text(), 10 ),
                        count = actual + number,
                        label = ( 1 === count ) ? lp_strings.comment : lp_strings.comments;

                    $comments.siblings( '.label' ).text( label );
                    $comments.text( count );
                };

                return this;
            }

            jQuery( window ).on( 'start.livechat', function() {
                if ( ! livePressChatStarted ) {
                    livePressChatStarted = true;

                    $j( '<link rel="stylesheet" type="text/css" href="' + LivepressConfig.lp_plugin_url + 'css/collaboration.css' + '?' + ( +new Date() ) + '" />' ).appendTo( 'head' );

                    // Load custom version of jQuery.ui if it doesn't contain the dialogue plugin
                    if ( ! jQuery.fn.dialog ) {
                        $j.getScript( path + 'jquery.ui.js', function() {
                            $makeStyle( 'flick/jquery-ui-1.7.2.custom' ).appendTo( 'head' );
                            // Out of first LP release
                            //          Collaboration.Chat.initialize();
                        });
                        //} else {
                        // Out of first LP release
                        //        Collaboration.Chat.initialize();
                    }
                } else {
                    // Out of first LP release
                    //      Collaboration.Chat.initialize();
                }
            });

            $makeStyle( 'outside' ).appendTo( 'head' );

            /**
             * Initialize the Livepress HUD.
             */
            livepress_init = function() {

                // Ensure we have a twitter handler, even when the page starts with no embeds
                // because they may be added later. Corrects issue where twitter embeds failed on live posts when
                // original page load contained no embeds.
                if ( 'undefined' === typeof window.twttr ) {
                    window.twttr = (function( d, s, id ) {
                        var t, js, fjs = d.getElementsByTagName( s )[0];
                        if ( d.getElementById( id ) ) {
                            return;
                        }
                        js = d.createElement( s );
                        js.id = id;
                        js.src = 'https://platform.twitter.com/widgets.js';
                        fjs.parentNode.insertBefore( js, fjs );
                        return window.twttr || ( t = {
                                _e: [], ready: function( f ) {
                                    t._e.push( f );
                                }
                            });
                    }( document, 'script', 'twitter-wjs' ) );
                }

                // On first init we load in external and internal styles
                // on secondary called we just disable / enable
                if ( ! inittedOnce ) {
                    inittedOnce = true;

                    var activeEditor = tinyMCE.activeEditor;
                    if ( activeEditor ) {
                        $eDoc = $j( tinyMCE.activeEditor.getDoc() );
                        $eHTML = $eDoc.find( 'html:first' );
                        $eHead = $eDoc.find( 'head:first' );
                        $eBody = $eDoc.find( 'body:first' );
                    } else {
                        $eDoc = $eHTML = $eHead = null;
                    }

                    if ( LivepressConfig.debug !== undefined && LivepressConfig.debug ) {
                        $j( document ).find( 'html:first' ).addClass( 'debug' );
                        if ( $eDoc !== null ) {
                            $eDoc.find( 'html:first' ).addClass( 'debug' );
                        }
                    }

                }

                OORTLE.Livepress.LivepressHUD.show();

                setTimeout( LiveCanvas.init, 1 );

                $j( document.body ).add( $eHTML ).addClass( namespace + '-active' );
            };

            var toggleTabs = function( $buttonDiv ) {
                $buttonDiv.first().find( 'a' ).each(function() {
                    jQuery( this ).toggleClass( 'active' );
                });
            };

            jQuery( window ).on( 'start.livepress', function() {
                window.eeActive = true;
                window.eeTextActive = false;
                // Switch to visual mode if in html mode
                if ( ! tinyMCE.editors.content ) {
                    switchEditors.go( 'content', 'tmce' );
                }

                addEditorTabControlListeners( jQuery( '.wp-editor-tabs' ), 'content', '.wp-editor-tabs' );

                // Remove the old visual editor
                jQuery( '.wp-editor-tabs > a.switch-tmce' ).remove();

                // A timeout is used to give TinyMCE a time to invoke itself and refresh the DOM.
                setTimeout( livepress_init, 5 );
            });

            jQuery( window ).on( 'stop.livepress', function() {
                window.eeActive = false;
                OORTLE.Livepress.LivepressHUD.hide();
                // Stops the livepress collaborative edit
                Collaboration.Edit.destroy();

                $j( document.body ).add( $eHTML ).removeClass( namespace + '-active' );
                LiveCanvas.hide();
            });

            /**
             * Add listeners for the text/html Real-time tabs
             */
            function addEditorTabControlListeners( $buttonDiv, editorID, toggleFinder, editor ) {

                $buttonDiv.find( 'a.switch-livepress' ).off( 'click' ).on( 'click', function( e ) {
                    if ( jQuery( this ).hasClass( 'active' ) ) {
                        return;
                    }
                    var currentEditorId = jQuery( this ).attr( 'data-editor' );
                    currentEditorId = ( 'undefined' === typeof( currentEditorId ) ) ? jQuery('.livepress-newform textarea').attr('id') : currentEditorId;

                    e = tinyMCE.get( currentEditorId );
                    e.show();

                    window.eeTextActive = false;
                    var parent_div = jQuery( this ).parent( '.livepress-inline-editor-tabs' );
                    toggleTabs( ( ( 'undefined' === typeof( toggleFinder ) || '' === toggleFinder ) ? parent_div : jQuery( toggleFinder ) ) );
                    return false;
                });

                $buttonDiv.find( 'a.switch-livepress-html' ).off( 'click' ).on( 'click', function( e ) {
                    if ( jQuery( this ).hasClass( 'active' ) ) {
                        return;
                    }

                    var currentEditorId = jQuery( this ).attr( 'data-editor' );
                    currentEditorId = ( 'undefined' === typeof( currentEditorId ) ) ? jQuery('.livepress-newform textarea').attr('id') : currentEditorId;

                    switchEditors.go( currentEditorId, 'html' );

                    window.eeTextActive = true;
                    var parent_div = jQuery( this ).parent( '.livepress-inline-editor-tabs' );
                    toggleTabs( ( ( 'undefined' === typeof( toggleFinder ) || '' === toggleFinder ) ? parent_div : jQuery( toggleFinder ) ) );
                    return false;
                });
            }

            /**
             * Generic helper object for the real-time editor.
             *
             * @returns {Object}
             * @constructor
             * @memberOf OORTLE.Livepress
             * @private
             */
            function InnerHelper() {
                var SELF = this,
                    NONCES = jQuery( '#livepress-nonces' ),
                    hasRegex = new RegExp( '\\[livepress_metainfo[^\\]]*]' ),
                    onlyRegex = new RegExp( '^\\s*\\[livepress_metainfo[^\\]]*]\\s*$' );

                SELF.getGravatars = function() {
                    // Set up the gravatar array
                    var gravatars = [];
                    for ( var i = 0, len = lp_strings.lp_gravatars.length; i < len; i++ ) {
                        gravatars[lp_strings.lp_gravatars[i].id] = lp_strings.lp_gravatars[i].avatar;
                    }
                    return gravatars;
                };

                SELF.getGravatarLinks = function() {
                    // Set up the gravatar array
                    var links = [];
                    for ( var i = 0, len = lp_strings.lp_avatar_links.length; i < len; i++ ) {
                        links[lp_strings.lp_avatar_links[i].id] = lp_strings.lp_avatar_links[i].link;
                    }
                    return links;
                };

                SELF.gravatars = SELF.getGravatars();
                SELF.avatarLinks = SELF.getGravatarLinks();

                /**
                 * Dispatch a specific action to the server asynchronously.
                 *
                 * @param {String} action Server-side action to invoke.
                 * @param {String} content Content in the current editor window.
                 * @param {Function} callback Function to invoke upon success or failure.
                 * @param {Object} additional Additional parameters to send with the request
                 * @return {Object} jQuery.
                 */
                SELF.ajaxAction = function( action, content, callback, additional ) {
                    return jQuery.ajax({
                        type: 'POST',
                        url: LivepressConfig.ajax_url,
                        data: jQuery.extend({
                            action: action,
                            content: content,
                            post_id: LivepressConfig.post_id
                        }, additional || {}),
                        dataType: 'json',
                        success: callback,
                        error: function( jqXHR, textStatus, errorThrown ) {
                            callback.apply( jqXHR, [undefined, textStatus, errorThrown]);
                        }
                    });
                };

                /**
                 * Start the Real-Time Editor.
                 *
                 * @param {String} content Content in the current editor window.
                 * @param {Function} callback Function to invoke upon success or failure,
                 * @returns {Object} jQuery
                 */
                SELF.doStartEE = function( content, callback ) {
                    return SELF.ajaxAction( 'start_ee', content, callback );
                };

                /**
                 * Append a new post update.
                 *
                 * @param {String} content Content to append.
                 * @param {Function} callback Function to invoke after processing.
                 * @param {String} title Title of the update.
                 * @returns {Object} jQuery
                 */

                SELF.appendPostUpdate = function( content, callback, title ) {
                    var args = ( title === undefined ) ? {} : { title: title };
                    args.liveTags = this.getCurrentLiveTags();
                    args.authors = this.getCurrentAuthors();
                    args._ajax_nonce = NONCES.data( 'append-nonce' );

                    jQuery( '.peeklink span, .peekmessage' ).removeClass( 'hidden' );
                    jQuery( '.peek' ).addClass( 'live' );
                    jQuery( window ).trigger( 'livepress.post_update' );
                    return SELF.ajaxAction( 'lp_append_post_update', content, callback, args );
                };

                /**
                 * Append a new post update.
                 *
                 * @param {String} content Content to append.
                 * @param {Function} callback Function to invoke after processing.
                 * @param {String} title Title of the update.
                 * @returns {Object} jQuery
                 */
                SELF.appendPostDraft = function( content, callback, title ) {
                    var args = ( title === undefined ) ? {} : { title: title };
                    args.liveTags = this.getCurrentLiveTags();
                    args.authors = this.getCurrentAuthors();
                    args._ajax_nonce = NONCES.data( 'append-nonce' );

                    jQuery( '.peeklink span, .peekmessage' ).removeClass( 'hidden' );
                    jQuery( '.peek' ).addClass( 'live' );
                    jQuery( window ).trigger( 'livepress.post_update' );
                    return SELF.ajaxAction( 'lp_append_post_draft', content, callback, args );
                };

                /**
                 * Modify a specific post update.
                 *
                 * @param {string} updateId ID of the update to change.
                 * @param {String} content Content with which to modify the update.
                 * @param {Function} callback Function to invoke after processing.
                 * @returns {Object} jQuery
                 */
                SELF.changePostUpdate = function( updateId, content, callback ) {
                    var nonce = NONCES.data( 'change-nonce' );
                    return SELF.ajaxAction( 'lp_change_post_update', content, callback, {
                        update_id: updateId,
                        _ajax_nonce: nonce
                    });
                };

                /**
                 * Modify a specific post update.
                 *
                 * @param {string} updateId ID of the update to change.
                 * @param {String} content Content with which to modify the update.
                 * @param {Function} callback Function to invoke after processing.
                 * @returns {Object} jQuery
                 */
                SELF.changePostDraft = function( updateId, content, callback ) {
                    var nonce = NONCES.data( 'change-nonce' );
                    return SELF.ajaxAction( 'lp_change_post_draft', content, callback, {
                        update_id: updateId,
                        _ajax_nonce: nonce
                    });
                };

                /**
                 * Remove a post update.
                 *
                 * @param {String} updateId ID of the update to remove.
                 * @param {Function} callback Function to invoke after processing.
                 * @returns {Object} jQuery
                 */
                SELF.deletePostUpdate = function( updateId, callback ) {
                    var nonce = NONCES.data( 'delete-nonce' );
                    return SELF.ajaxAction( 'lp_delete_post_update', '', callback, {
                        update_id: updateId,
                        _ajax_nonce: nonce
                    });
                };

                /**
                 * Get text from the editor, but preprocess it the same way WordPress does first.
                 * ready to be sent to server
                 *
                 * @param {Object} editor TinyMCE editor instance.
                 * @returns {String} Preprocessed text from editor.
                 */
                SELF.getProcessedContent = function( editor ) {
                    if ( undefined === editor ) {
                        return;
                    }

                    var html_editor_live = jQuery( 'textarea#' + editor.id ).is( ':visible' );
                    var originalContent = editor.getContent();

                    if ( '' === originalContent || html_editor_live ) {
                        originalContent = editor.targetElm.value;
                        editor.targetElm.value = '';
                    }

                    originalContent = originalContent.replace( '<p><br data-mce-bogus="1"></p>', '' );
                    // Remove the toolbar/dashicons present on images/galleries since WordPress 3.9 and embeds since 4.0
                    originalContent = originalContent.replace( '<div class="toolbar"><div class="dashicons dashicons-edit edit"></div><div class="dashicons dashicons-no-alt remove"></div></div>', '' );
                    originalContent = originalContent.replace( /<span class="livepress-update-header-timestamp.*span>/gi, '' );

                    originalContent = originalContent.replace( /^<div class="livepress-update-outer-wrapper lp_avatar_hidden">(<div.*)<\/div>$/gi, '$1' );

                    if ( '' === originalContent.trim() ) {
                        editor.undoManager.redo();

                        originalContent = editor.getContent({ format: 'raw' }).replace( '<p><br data-mce-bogus="1"></p>', '' );

                        if ( '' === originalContent.trim() ) {
                            return;
                        }
                    }

                    /**
                     * Add the live update header bar with timestamp (if option checked)
                     * and update header (if header entered).
                     */
                    var editorID = editor.editorContainer.id,
                        $activeForm = jQuery( '#' + editorID ).closest( '.livepress-update-form' );

                    /**
                     * Update header
                     */
                    var liveUpdateHeader = $activeForm.find( '.liveupdate-header' ),
                        processed = switchEditors.pre_wpautop( originalContent ),

                        /**
                         * Live Tags Support
                         */

                            // Add tags if present
                        $livetagField = $activeForm.find( '.livepress-live-tag' ),
                        liveTags = SELF.getCurrentLiveTags( $activeForm ),

                    // Save any new tags back to the taxonomy via ajax
                        newTags = jQuery( liveTags ).not( LivepressConfig.live_update_tags ).get(),
                        $timestampCheckbox = jQuery( '.livepress-timestamp-option input[type="checkbox"]' ),
                        includeTimestamp = ( 0 === $timestampCheckbox.length ) || $timestampCheckbox.is( ':checked' );
                    var authors = SELF.getCurrentAuthors( $activeForm );

                    // Save the existing tags back to the select2 field
                    if ( 0 !== newTags.length ) {
                        LivepressConfig.live_update_tags = LivepressConfig.live_update_tags.concat( newTags );
                        $livetagField.select2({ tags: LivepressConfig.live_update_tags });
                        jQuery.ajax({
                            method: 'post',
                            url: LivepressConfig.ajax_url,
                            data: {
                                action: 'lp_add_live_update_tags',
                                _ajax_nonce: LivepressConfig.lp_add_live_update_tags_nonce,
                                new_tags: JSON.stringify( newTags ),
                                post_id: LivepressConfig.post_id
                            },
                            success: function() {
                            }
                        });
                    }
                    var avatar_class = ( -1 !== jQuery.inArray( 'AVATAR', LivepressConfig.show ) && 0 !== authors.length ) ? 'lp_avatar_shown' : 'lp_avatar_hidden';
                    // Edge case if you have backslahes
                    processed = processed.replaceAll( '\\', '\\\\' );

                    // Wrap the inner update

                    if ( -1 === processed.search( 'livepress-update-inner-wrapper' ) ) { /* Don't double add */

                        if ( 'default' !== LivepressConfig.update_format ) {
                            processed = '<div class="livepress-update-inner-wrapper ' + avatar_class + '">\n\n' + processed + '\n\n</div>';
                            if ( -1 !== jQuery.inArray( 'AVATAR', LivepressConfig.show ) ) {
                                processed = ( ( 0 !== authors.length ) ? SELF.getAuthorsHTML( authors ) : '' ) + processed;
                            }
                            processed = SELF.newMetainfoShortcode( includeTimestamp, liveUpdateHeader, processed, authors ) +
                                ( ( 0 !== liveTags.length ) ? SELF.getLiveTagsHTML( liveTags ) : '' ) + processed;
                        } else {

                            processed = SELF.newMetainfoShortcode( includeTimestamp, liveUpdateHeader, processed, authors ) +
                                ( ( 0 !== liveTags.length ) ? SELF.getLiveTagsHTML( liveTags ) : '' );

                            if ( -1 !== jQuery.inArray( 'AVATAR', LivepressConfig.show ) ) {
                                processed = ( ( 0 !== authors.length ) ? SELF.getAuthorsHTML( authors ) : '' ) + processed;
                            }
                            if ( -1 === processed.search( 'livepress-update-outer-wrapper' ) ) {
                                processed = '<div class="livepress-update-outer-wrapper ' + avatar_class + '">\n\n' + processed + '\n\n</div>';
                            }
                        }
                    }

                    return processed;
                };

                /**
                 * Get the list of live tags added on this update
                 */
                SELF.getCurrentLiveTags = function( $activeForm ) {
                    if ( 'undefined' === typeof $activeForm ) {
                        $activeForm = jQuery( '.livepress-update-form' );
                    }
                    var livetags = $activeForm.find( '.livepress-live-tag' ).select2( 'val' );

                    if ( undefined === livetags ) {
                        livetags = [];
                    }

                    return livetags;
                };

                /**
                 * Get the list of authors added on this update
                 */
                SELF.getCurrentAuthors = function( $activeForm ) {
                    if ( 'undefined' === typeof $activeForm ) {
                        $activeForm = jQuery( '.livepress-update-form' );
                    }
                    var authors = $activeForm.find( '.liveupdate-byline' ).select2( 'data' );

                    if ( undefined === authors ) {
                        authors = [];
                    }

                    return authors;
                };

                /**
                 * Wrap the avatar image or name in a link
                 */
                SELF.linkToAvatar = function( html, userid ) {
                    if ( 'undefined' !== typeof SELF.avatarLinks[userid] && '' !== SELF.avatarLinks[userid] ) {
                        return '<a href="' + SELF.avatarLinks[userid] + '" target="_blank">' + html + '</a>';
                    } else {
                        return html;
                    }
                };

                /**
                 * Get the html for displaying the authors for this live update.
                 *
                 * @param  Array  Authors array of authors for this update.
                 *
                 * @return String HTML to display the authors.
                 *
                 */
                SELF.getAuthorsHTML = function( authors ) {
                    var toReturn = '';
                    var html = '';

                    if ( 0 === authors ) {
                        return '';
                    }

                    // Add each of the authors as a span
                    jQuery.each( authors, function() {

                        toReturn = LivepressConfig.author_html_order;

                        toReturn = toReturn.replace( /##id_html##/, LivepressConfig.authors_id.replace( /##id##/, this.id ) );

                        var avatar_html = '';
                        if ( 'undefined' !== typeof SELF.gravatars[this.id] && '' !== SELF.gravatars[this.id] ) {
                            avatar_html = LivepressConfig.authors_avatar.replace( /##avatar##/, SELF.linkToAvatar( SELF.gravatars[this.id], this.id ) );
                        }
                        toReturn = toReturn.replace( /##avatar##/, avatar_html );

                        toReturn = toReturn.replace( /##author_name##/, LivepressConfig.authors_name.replace( /##name##/, SELF.linkToAvatar( this.text, this.id ) ) );

                        html += LivepressConfig.author_wrap
                            .replace( /##slugg##/, this.text.replace( /\s/g, '-' ).toLowerCase() )
                            .replace( /##html##/, toReturn );


                    });

                    // wrap the divs tag
                    html = LivepressConfig.authors_wrap.replace(/##html##/, html );

                    return html;

                };

                /**
                 * Get the html for the live update tags.
                 *
                 * @param  Array An array of tags
                 *
                 * @return The HTML to append to the live update.
                 *
                 */
                SELF.getLiveTagsHTML = function( liveTags ) {
                    var toReturn = '';

                    if ( 0 === liveTags ) {
                        return '';
                    }
                    // Start the tags div
                    toReturn += '<div class="live-update-livetags">';

                    // Add each of the tags as a span
                    jQuery.each( liveTags, function() {
                        toReturn += '<span class="live-update-livetag live-update-livetag-' +
                            this + '">' +
                            this + '</span>';
                    });

                    // Close the divs tag
                    toReturn += '</div>';

                    return toReturn;
                };

                /**
                 * Gets the metainfo shortcode.
                 *
                 * @param {Boolean} showTimstamp Flag to determine whether to show the timestamp.
                 * @returns {String} Metainfo shortcode.
                 */
                SELF.newMetainfoShortcode = function( showTimstamp, $liveUpdateHeader, content, authors ) {
                    var metainfo = '[livepress_metainfo',
                        d,
                        utc,
                        server_time;

                    // Used stored meta information when editing an existing update
                    var show_timestmp = $liveUpdateHeader.data( 'show_timestmp' );

                    if ( '1' === show_timestmp ) {
                        var time = $liveUpdateHeader.data( 'time' ),
                            timestamp = $liveUpdateHeader.data( 'timestamp' );

                        metainfo += ' show_timestmp="1"';

                        if ( 'undefined' !== typeof time ) {
                            metainfo += ' time="' + time + '"';
                        }

                        if ( 'undefined' !== typeof timestamp ) {
                            metainfo += ' timestamp="' + timestamp + '"';
                        }

                    } else {
                        if ( showTimstamp ) {
                            metainfo += ' show_timestmp="1"';
                            d = new Date();
                            utc = d.getTime() + ( d.getTimezoneOffset() * 60000 ); // Minutes to milisec
                            server_time = utc + ( 3600000 * LivepressConfig.blog_gmt_offset ); // Hours to milisec
                            server_time = new Date( server_time );
                            if ( LivepressConfig.timestamp_template ) {
                                if ( window.eeActive ) {
                                    metainfo += ' time="' + server_time.format( LivepressConfig.timestamp_template ) + '"';
                                    metainfo += ' timestamp="' + d.toISOString() + '"';
                                } else {
                                    metainfo += ' POSTTIME ';
                                }
                            }
                        }
                    }

                    if ( LivepressConfig.has_avatar ) {
                        metainfo += ' has_avatar="1"';
                    }

                    if ( 0 <= jQuery.inArray( 'AVATAR', LivepressConfig.show ) ) {
                        metainfo += ' avatar_block="shown"';
                    }

                    if ( 'undefined' !== typeof authors ) {
                        var custom_author_names = '';
                        var separator = '';
                        for ( var i = 0; i < authors.length; i++ ) {
                            custom_author_names += separator + authors[i]['text'];
                            separator = ' - ';
                        }
                        metainfo += ' authors="' + custom_author_names + '"';
                    }

                    if ( 'undefined' !== typeof $liveUpdateHeader.val() && '' !== $liveUpdateHeader.val() ) {
                        var post_title = $liveUpdateHeader.val().replace( /%/g, '%25' );
                        metainfo += ' update_header="' + encodeURI( decodeURI( post_title ) ) + '"';
                    }
                    metainfo += ']\n\n';

                    if ( 'default' === LivepressConfig.update_format ) {
                        metainfo += ' ' + content + ' \n[/livepress_metainfo]\n\n';
                    }

                    return metainfo;
                };

                /**
                 * Tests if metainfo shortcode included in text.
                 *
                 * @param {String} text Text to test.
                 * @return {Boolean} Whether or not meta info is included in the shortcode.
                 */
                SELF.hasMetainfoShortcode = function( text ) {
                    return hasRegex.test( text );
                };

                /**
                 * Tests if text is ''only'' the metainfo shortcode.
                 *
                 * @param {String} text Text to test.
                 * @return {Boolean} Whether or not text is only the metainfo shortcode.
                 */
                SELF.hasMetainfoShortcodeOnly = function( text ) {
                    return onlyRegex.test( text );
                };
            }

            Helper = new InnerHelper();

            /**
             * Class that creates and controls TinyMCE-enabled form.
             * - called by the LiveCanvas whenever a new post needs to be added or edited.
             * - It converts selected element into a tinymce area and adds buttons to performs particular actions.
             * - It currently has two modes "new" or "editing".
             *
             * @param {String} mode Either 'editing' or 'new.' If 'new,' will create a new TinyMCE form after element el.
             * @param {String} el DOM identifier of element to be removed.
             * @returns {Object} New Selection object
             * @memberOf OORTLE.Livepress
             * @constructor
             * @private
             */
            function Selection( mode, el ) {
                var SELF = this;

                SELF.handle = namespace + '-tiny' + ( +new Date() );

                SELF.mode = mode;

                SELF.draft = jQuery( el ).hasClass( 'livepress-draft' );

                if ( SELF.mode === 'new' ) {
                    SELF.originalContent = '';
                    if ( tinyMCE.onRemoveEditor !== undefined ) {
                        /** As of WordPress 3.9, TinyMCE is upgraded to version 4 and the
                         /*  old action methods are deprecated. This check ensures compatibility.
                         **/
                        if ( '3' === tinymce.majorVersion ) {
                            tinyMCE.onRemoveEditor.add(function( mgr, ed ) {
                                if ( ( ed !== SELF ) && ( tinyMCE.editors.hasOwnProperty( SELF.handle ) ) ) {
                                    try {
                                        tinyMCE.execCommand( 'mceFocus', false, SELF.handle );
                                    } catch ( err ) {
                                        console.log( 'mceFocus error', err );
                                    }
                                }
                                return true;
                            });
                        } else {
                            tinyMCE.on( 'RemoveEditor', function( mgr, ed ) {
                                if ( ( ed !== SELF ) && ( tinyMCE.editors.hasOwnProperty( SELF.handle ) ) ) {
                                    try {
                                        tinyMCE.execCommand( 'mceFocus', false, SELF.handle );
                                        tinyMCE.editors[SELF.handle].focus();
                                    } catch ( err ) {
                                        console.log( 'mceFocus error', err );
                                        console.log( SELF.handle );
                                    }
                                }
                                return true;
                            });
                        }
                    }
                } else if ( SELF.mode === 'editing' || SELF.mode === 'deleting' ) {
                    // Saving old content in case of reset

                    var $el = $j( el );

                    SELF.originalHtmlContent = ( 'string' === typeof( $el.data( 'originalHtmlContent' ) ) ) ? $el.data( 'originalHtmlContent' ) : el.outerHTML || new XMLSerializer().serializeToString( el );

                    SELF.originalContent = $el.data( 'originalContent' ) || $el.data( 'nonExpandedContent' ) || '';
                    SELF.originalId = $el.data( 'originalId' );
                    SELF.originalUpdateId = $el.attr( 'id' );
                    if ( SELF.mode === 'deleting' ) {
                        SELF.newEditContent = null; // Display to user content to be removed by update
                    } else {
                        SELF.newEditContent = SELF.originalHtmlContent.replace( /<div.*livepress.*>/gi, '' ).replace( /<br ?\/?>\s/gi, '<br>' ).replace( /<div.*live-update-authors.*div>/gi, '' ).replace( /<\/div>/gi, '' ); // Display to user current content
                    }
                }

                SELF.newEditContent = SELF.newEditContent ? switchEditors.wpautop( SELF.newEditContent ) : SELF.newEditContent;
                SELF.formLayout = SELF.formLayout.replace( '{content}', SELF.newEditContent || SELF.originalContent || '' );
                SELF.formLayout = SELF.formLayout.replace( '{handle}', SELF.handle );
                SELF.$form = $j( SELF.formLayout )
                    .find( 'div.livepress-form-actions:first' ).on( 'click', function( e ) {
                        SELF.onFormAction( e );
                    })
                    .end()
                    // Running it this way is required since we don't have Function.bind
                    .on( 'submit', function() {
                        SELF.onSave();
                        SELF.resetFormFieldStates( SELF );
                        return false;
                    });
                SELF.$form.attr( 'id', SELF.originalUpdateId );
                SELF.$form.data( 'originalId', SELF.originalId );
                SELF.$form.addClass( 'livepress-update-form' );
                if ( mode === 'new' ) {
                    SELF.$form.find( 'input.button.save' ).remove();
                    SELF.$form.find( 'a.livepress-delete' ).remove();
                    SELF.$form.addClass( namespace + '-newform' );
                    var post_state = $j( '#post input[name=original_post_status]' ).val();
                    if ( post_state !== 'publish' && post_state !== 'private' && post_state !== 'auto-draft' ) {
                        SELF.$form.find( 'input.published' ).remove();
                        SELF.$form.find( '.quick-publish' ).remove();
                    } else {
                        SELF.$form.find( 'input.notpublished' ).remove();
                    }
                } else {

                    if ( SELF.draft ) {
                        SELF.$form.find( 'input.save' ).remove();
                        SELF.$form.find( '.primary.published' ).remove();
                        SELF.$form.addClass( 'livepress-draft' );
                    } else {
                        SELF.$form.find( '.primary.button-primary' ).remove();
                        SELF.$form.find( '.button-secondary.livepress-draft' ).remove();
                    }

                    SELF.$form.find( '.livepress-timestamp-option' ).remove();
                    if ( mode === 'deleting' ) {
                        SELF.$form.addClass( namespace + '-delform' );
                    }
                }

                // Add tag support to the form
                SELF.$form
                    .find( 'input.livepress-live-tag' )
                    .select2({
                        placeholder: lp_strings.live_tags_select_placeholder,
                        tokenSeparators: [','],
                        tags: LivepressConfig.live_update_tags
                    });

                // Add byline support to the form
                SELF.$form
                    .find( 'input.liveupdate-byline' )
                    .select2({
                        tokenSeparators: [','],
                        tags: lp_strings.lp_authors,
                        initSelection: function( element, callback ) {
                            var data = { id: element.data( 'id' ), text: element.data( 'name' ) };
                            callback( data );
                        }
                    });

                return this;
            }

            extend( Selection.prototype, {
                /*
                 * Variable: mode
                 * The mode of this Selection object (currently either 'new' or 'editing' or 'deleting')
                 */
                mode: null,


                /*
                 * Variable: formLayout
                 */
                formLayout: [
                    '<form>',
                    '<div class="livepress-update-header"><input type="text" placeholder="' + lp_strings.live_update_header + '"value="" autocomplete="off" class="liveupdate-header" name="liveupdate-header" id="liveupdate-header" /></div>',
                    '<div class="editorcontainer">',
                    '<textarea id="{handle}" class="wp-editor-area">{content}</textarea>',
                    '</div>',
                    '<div class="editorcontainerend"></div>',
                    '<div class="livepress-form-actions">',
                    '<div class="livepress-live-tags">' +
                    '<input type="hidden" style="width:95%;" class="livepress-live-tag" />' +
                    '</div>',
                    '<div class="livepress-byline">' + lp_strings.live_update_byline + ' <input type="text" data-name="' + LivepressConfig.author_display_name + '" data-id="' + LivepressConfig.author_id + '" autocomplete="off" style="width: 70%; float: right; margin-left: 5px;" class="liveupdate-byline" name="liveupdate-byline" id="liveupdate-byline" /></div>',
                    '<div class="livepress-timestamp-option"><input type="checkbox" checked="checked" /> ' + lp_strings.include_timestamp + '</div>',
                    '<div class="livepress-actions"><a href="#" class="livepress-delete" data-action="delete">' + lp_strings.delete_perm + '</a>',
                    '<input class="livepress-draft button button-secondary" type="button" value="' + lp_strings.draft + '" data-action="draft" />',
                    '<input class="livepress-cancel button button-secondary" type="button" value="' + lp_strings.cancel + '" data-action="cancel" />',
                    '<input class="livepress-update button button-primary save" type="submit" value="' + lp_strings.save + '" data-action="update" />',
                    '<input class="livepress-submit published primary button-primary" type="submit" value="' + lp_strings.push_update + '" data-action="update" />',
                    '<input class="livepress-submit notpublished primary button-primary" type="submit" value="' + lp_strings.add_update + '" data-action="publish-draft" />',
                    '<br /><span class="quick-publish">' + lp_strings.ctrl_enter + '</span></div>',
                    '</div>',
                    '<div class="clear"></div>',
                    '</form>'
                ].join( '' ),

                /**
                 * Reset all the form buttons and fields to their default status,
                 * called when pushing a live update.
                 */
                resetFormFieldStates: function( SELF ) {
                    SELF.$form.find( '.livepress-live-tag' ).select2( 'val', '' ).select2({
                        placeholder: lp_strings.live_tags_select_placeholder,
                        tokenSeparators: [','],
                        tags: LivepressConfig.live_update_tags
                    });
                    SELF.$form.find( '.liveupdate-header' ).val( '' );
                    if ( 'true' !== LivepressConfig.use_default_author ) {
                        // Removed as we wish to keep the author
                        //		SELF.$form.find( '.liveupdate-byline' ).select2( 'val', '' );
                        //     SELF.$form.find( '.liveupdate-byline' ).val(null).trigger("change"); // right way to clear
                    }

                },

                /*
                 * Function: enableTiny
                 */
                enableTiny: function( optClass ) {
                    var te,
                        selection = this,
                        SELF = this,
                        /** As of WordPress 3.9, TinyMCE is upgraded to version 4 and the
                         /*  old action methods are deprecated. This check ensures compatibility.
                         **/
                        mceAddCommand = ( '3' === tinymce.majorVersion ) ? 'mceAddControl' : 'mceAddEditor';
                    // Initialize default editor at required selector
                    tinyMCE.execCommand( mceAddCommand, false, this.handle );
                    te = tinyMCE.editors[this.handle];

                    if ( ! te ) {
                        console.log( 'Unable to get editor for ' + this.handle );
                        return;
                    }
                    te.dom.loadCSS( path + 'css/inside.css' + '?' + ( +new Date() ) );
                    // Only our punymce editors have this class, used for additional styling
                    te.dom.addClass( te.dom.getRoot(), 'livepress_editor' );

                    if ( optClass ) {
                        te.dom.addClass( te.dom.getRoot(), 'livepress-' + optClass + '_editor' );
                        te.dom.addClass( te.dom.getRoot().parentNode, 'livepress-' + optClass + '_editor' );
                    }
                    if ( config.has_avatar ) {
                        te.dom.addClass( te.dom.getRoot(), 'livepress-has-avatar' );
                    }
                    var metaAuthors = [];
                    /**
                     * Pull out existing header, authors and tags when editing
                     * an existing update
                     */

                    var $domcontent = jQuery( te.dom.getRoot() ),
                        editor = te.editorContainer.id,
                        $activeForm = jQuery( '#' + editor ).closest( '.livepress-update-form' ),
                        content = $domcontent.html();


                    /**
                     * Handle the livepress_metainfo shortcode if present, including headline and timestamp
                     */
                    var  originalContent = SELF.originalContent;
                    if ( Helper.hasMetainfoShortcode( originalContent ) ) {

                        /**
                         * Remove the meta information from the content
                         */
                        var contentParts = originalContent.split( '[livepress_metainfo' );
                        var metaInfo = contentParts[1].split( ']' )[0];

                        // Extract the header from the metainfo shortcode
                        var headerChunks = metaInfo.split( 'update_header="' ),
                            $formHeader = $activeForm.find( '.liveupdate-header' );

                        // If a header was found, add it to the editor
                        if ( 'undefined' !== typeof headerChunks[1] ) {
                            var header = headerChunks[1].split( '"' )[0];
                            $formHeader.val( decodeURI( header ) );
                        }

                        // Extract the show_timestmp setting
                        headerChunks = metaInfo.split( 'show_timestmp="' );
                        if ( 'undefined' !== typeof headerChunks[1] ) {
                            var show_timestmp = headerChunks[1].split( '"' )[0];
                            $formHeader.data( 'show_timestmp', show_timestmp );
                        } else {
                            // Default is on
                            $formHeader.data( 'show_timestmp', '1' );
                        }

                        // Extract the time setting
                        headerChunks = metaInfo.split( 'time="' );
                        if ( 'undefined' !== typeof headerChunks[1] ) {
                            var time = headerChunks[1].split( '"' )[0];
                            $formHeader.data( 'time', time );
                        }

                        // Extract the timestamp setting
                        headerChunks = metaInfo.split( 'timestamp="' );
                        if ( 'undefined' !== typeof headerChunks[1] ) {
                            var timestamp = headerChunks[1].split( '"' )[0];
                            $formHeader.data( 'timestamp', '' + timestamp );
                        }
                        // Extract the authors setting

                        headerChunks = metaInfo.split( 'authors="' );
                        if ( 'undefined' !== typeof headerChunks[1] ) {
                            var header_authors = headerChunks[1].split( '"' )[0];
                            var stuff = header_authors.split( ' - ' );

                            var returnAuthors = [];
                            metaAuthors = jQuery( stuff ).each(function( index, name ) {
                                returnAuthors[index] = name;
                            });
                            $formHeader.data( 'authors', '' + metaAuthors );
                        }
                    }


                    /**
                     * Authors
                     */
                    var theAuthors = [],
                        authors = jQuery( content ).find( '.live-update-author' );

                    if ( 0 !== metaAuthors.length ) {
                        // Get all the authors into an array
                        jQuery( metaAuthors ).each(function( i, author_name ) {
                            if ( '' !== author_name ) {
                                var theAuthor = {
                                    'id': -1,
                                    'text': author_name
                                };
                                theAuthors.push( theAuthor );
                            }
                        });
                        // Loop the authors and look into the master author list for a match
                        // set the ID is a match found
                        jQuery( theAuthors ).each(function( i, author_name ) {
                            jQuery( lp_strings.lp_authors ).each(function( index, author ) {
                                if ( author_name['text'] === author['text'] ) {
                                    theAuthors[i].id = author['id'];
                                    return false;
                                }
                            });
                        });
                        //TheAuthors = theAuthors.concat( fullAuthors );
                    } else {
                        // If no authors, use whats in the main author field
                        if ( 0 === authors.length ) {
                            var $a = SELF.$form.find( 'input.liveupdate-byline' );
                            if ( '' !== $a.data( 'name' ) ) {
                                theAuthors = [{
                                    'id': $a.data( 'id' ),
                                    'text': $a.data( 'name' )
                                }];
                            }
                        } else {
                            jQuery( authors ).each(function( i, a ) {
                                var $a = jQuery( a ),
                                    theAuthor = {
                                        'id': $a.find( '.lp-authorID' ).text(),
                                        'text': $a.find( '.live-author-name' ).text()
                                    };
                                theAuthors.push( theAuthor );
                            });
                        }
                    }
                    if ( 0 !== theAuthors.length ) {
                        $activeForm.find( '.liveupdate-byline' ).select2( 'data', theAuthors );
                    }

                    var $content = jQuery( jQuery.parseHTML( content ) );
                    /**
                     * Livetags
                     */
                    var theTags = [],
                        tags = $content.find( '.live-update-livetag' );

                    jQuery( tags ).each(function( i, a ) {
                        theTags.push( jQuery( a ).text() );
                    });

                    $activeForm.find( '.livepress-live-tag' ).select2( 'val', theTags );

                    // Clear the tags and authors from the content
                    // if we have content in the short code get otherwise look for the div
                    if ( 0 < content.indexOf( '[/livepress_metainfo' ) ) {
                        var bits = content.split( '[/' );
                        content = bits[0].replace( /<div.*hidden">/g, '' );
                    } else {
                        content = $domcontent.find( '.livepress-update-inner-wrapper' ).html();
                    }
                    if ( undefined !== content ) {

                        // Reset the editor with the cleaned content
                        $domcontent.html( content );
                    }


                    /**
                     * Add onchange and ctrl-click event handlers for the editor
                     */
                    SELF.setupEditorEventHandlers( te, selection );
                    SELF.te = te;

                    return te;
                },


                /**
                 * Handle key events, save on ctrl-enter
                 */
                handleKeyEvent: function( selection, te, e, ed ) {
                    var SELF = this;

                    if ( e.ctrlKey && e.keyCode === 13 ) {
                        e.preventDefault();
                        if ( '3' === tinymce.majorVersion ) {
                            ed.undoManager.undo();
                        }
                        te.show();
                        selection.onSave();
                        SELF.resetFormFieldStates( SELF );
                    }

                },

                /**
                 * Set up the event handlers for an editor
                 */
                setupEditorEventHandlers: function( te, selection ) {
                    var SELF = this;
                    /** As of WordPress 3.9, TinyMCE is upgraded to version 4 and the
                     /*  old action methods are deprecated. This check ensures compatibility.
                     **/
                    if ( '3' === tinymce.majorVersion ) {
                        te.onKeyDown.add(function( ed, e ) {
                            SELF.handleKeyEvent( selection, te, e, ed );
                        });
                    } else {
                        te.on( 'KeyDown', function( e ) {
                            SELF.handleKeyEvent( selection, te, e );
                        });
                    }
                    jQuery( '.livepress-update-form' ).on( 'keydown', 'textarea', function( e ) {
                        SELF.handleKeyEvent( selection, te, e );
                    });
                },

                /*
                 * Function: disableTiny
                 */
                disableTiny: function() {
                    tinyMCE.execCommand( 'mceRemoveControl', false, this.handle );
                },

                /*
                 * Function: stash
                 */
                stash: function() {
                    this.disableTiny();
                    this.$form.remove();
                },


                /*
                 * Function: mergeData
                 * merge data from external Edit info with current liveCanvas
                 */
                mergeIncrementalData: function( update ) {
                    var $target, gen, $block, dom = new Livepress.DOMManipulator( '' ),
                        $inside_first = $liveCanvas.find( 'div.inside:first' );
                    switch ( update.op ) {
                        case 'append':
                        case 'prepend':
                            // Add at top or bottom
                            $target = $liveCanvas.find( 'div#livepress-update-' + update.id );
                            if ( $target.length > 0 ) {
                                // Ignore already added update
                                return;
                            }
                            $block = $j( update.prefix + update.proceed + update.suffix );
                            $block.data( 'nonExpandedContent', update.content );
                            $block.data( 'originalContent', update.orig );
                            $block.data( 'originalHtmlContent', update.origproc );
                            $block.data( 'originalId', update.id );
                            $block.attr( 'editStyle', '' );
                            dom.process_twitter( $block[0], update.proceed );
                            if ( 'bottom' === LivepressConfig.placement_of_updates ) {
                                $block.appendTo( $inside_first );
                            } else {
                                $block.prependTo( $inside_first );
                            }
                            Collaboration.Edit.update_live_posts_number();
                            break;
                        case 'replace':
                            // Update update
                            $target = $inside_first.find( 'div#livepress-update-' + update.id );
                            if ( $target.length < 1 ) {
                                // Could happen if update come for already deleted update
                                // f.e., in scenario: add update, edit it, delete it, refresh
                                return;
                            }
                            gen = $target.data( 'lpg' );
                            if ( update.lpg <= gen ) {
                                // Will ignore update for own changes, and old updates
                                // received on first page load.
                                return;
                            }
                            $block = $j( update.prefix + update.proceed + update.suffix );
                            $block.data( 'nonExpandedContent', update.content );
                            $block.data( 'originalContent', update.orig );
                            $block.data( 'originalHtmlContent', update.origproc );
                            $block.data( 'originalId', update.id );
                            $block.attr( 'editStyle', '' );
                            dom.process_twitter( $block[0], update.proceed );
                            $target.replaceWith( $block );
                            break;
                        case 'delete':
                            // Remove update
                            $target = $inside_first.find( 'div#livepress-update-' + update.id ).remove();
                            Collaboration.Edit.update_live_posts_number();
                            break;
                        default:
                            console.log( 'Unknown incremental operation', update.op, update );
                    }
                    return;
                },
                mergeData: function( regions ) {
                    if ( 'op' in regions ) {
                        return this.mergeIncrementalData( regions );
                    }
                    var r, c, nc, reg, $block, curr = [], currlink = {}, reglink = {},
                        $inside_first = $liveCanvas.find( 'div.inside:first' );
                    // Get list of currently visible regions
                    $inside_first.children().each(function() {
                        var $this = $j( this ),
                            cnt = $this.data( 'nonExpandedContent' ),
                            handle = $this.data( 'originalId' );
                        currlink[handle] = curr.length;
                        curr[curr.length] = { 'id': handle, 'cnt': cnt, 'handle': $this };
                    });
                    for ( r = 0; r < regions.length; r++ ) {
                        reglink[regions[r].id] = r;
                    }
                    // Merge list with incoming list
                    for ( r = 0, c = 0; r < regions.length && c < curr.length; ) {
                        if ( regions[r].id === curr[c].id ) {
                            // Nothing
                            r++;
                            c++;
                        } else if ( regions[r].id in currlink ) {
                            nc = currlink[regions[r].id];
                            // From c to nc-1 regions are removed
                            for ( ; c < nc; c++ ) {
                                curr[c].handle.remove();
                                curr[c].handle = undefined;
                            }
                            r++;
                            c++;
                        } else {
                            // New region added just before c
                            reg = regions[r];
                            $block = $j( reg.prefix + reg.proceed + reg.suffix );
                            $block.data( 'nonExpandedContent', reg.content );
                            $block.data( 'originalContent', reg.orig );
                            $block.data( 'originalHtmlContent', reg.origproc );
                            $block.data( 'originalId', reg.id );
                            $block.attr( 'editStyle', '' );
                            $block.insertBefore( curr[c].handle );
                            r++; // Left c untouched
                        }
                    }
                    // Remove all regions not existed in received update
                    for ( ; c < curr.length; c++ ) {
                        curr[c].handle.remove();
                    }
                    // Append all new regions
                    for ( ; r < regions.length; r++ ) {
                        reg = regions[r];
                        $block = $j( reg.prefix + reg.proceed + reg.suffix );
                        $block.data( 'nonExpandedContent', reg.content );
                        $block.data( 'originalContent', reg.orig );
                        $block.data( 'originalHtmlContent', reg.origproc );
                        $block.data( 'originalId', reg.id );
                        $block.attr( 'editStyle', '' );
                        $inside_first.append( $block );
                    }
                    Collaboration.Edit.update_live_posts_number();
                },

                /*
                 * Function: onFormAction
                 */
                onFormAction: function( e ) {
                    var val = e.target.getAttribute( 'data-action' );
                    if ( 'undefined' === typeof( this.draft ) ) {
                        this.draft = false;
                    }
                    if ( val === 'cancel' ) {
                        e.preventDefault();
                        this.onCancel();
                        // Make sure if daft is stays draft
                        if ( this.draft ) {
                            jQuery( '#' + this.originalUpdateId ).addClass( 'livepress-draft' );
                        }
                        return false;
                    } else if ( val === 'delete' ) {
                        e.preventDefault();
                        this.onDelete();
                        return false;
                    } else if ( val === 'draft' ) {
                        e.preventDefault();
                        this.onDraft();
                        // Reset the main form if saving as draft
                        if ( true !== this.draft ) {
                            this.resetFormFieldStates( this );
                        }

                        return false;
                    } else if ( val === 'publish-draft' ) {
                        e.preventDefault();
                        this.onPublishDraft();
                        return false;
                    }
                    // Skipped (must be a save)...
                },

                /*
                 * Function: displayContent
                 * replaces given element with formatted text update
                 */
                displayContent: function( el ) {

                    var originalHtmlContent = ( 'string' === typeof( this.originalHtmlContent ) ) ? this.originalHtmlContent : this.originalHtmlContent.outerHTML || new XMLSerializer().serializeToString( this.originalHtmlContent );

                    var $newPost = $j( originalHtmlContent );
                    $newPost.data( 'nonExpandedContent', this.originalContent );
                    $newPost.data( 'originalContent', this.originalContent );
                    $newPost.data( 'originalHtmlContent', originalHtmlContent );
                    $newPost.data( 'originalId', this.originalId );
                    $newPost.data( 'draft', this.isDraft );
                    $newPost.attr( 'editStyle', '' ); // On cancel, disable delete mode
                    if ( this.isDraft ) {
                        $newPost.addClass( 'livepress-draft' );
                    }

                    try {
                        window.twttr.widgets.load( $newPost[0] );
                    } catch ( e ) {
                    }

                    $newPost.insertAfter( el );
                    el.remove();
                    this.addListeners( $newPost );
                    $liveCanvas.data( 'mode', '' );
                    if ( 'timeago' === LivepressConfig.timestamp_format ) {
                        jQuery( 'abbr.livepress-timestamp' ).timeago().attr( 'title', '' );
                    }

                    return false;
                },
                /*
                 * Function: onDraft
                 * Modifies livepress-tiny.
                 */
                onDraft: function() {
                    this.onSave( true );
                },

                /*
                 * Function: onPublishDraft
                 */
                onPublishDraft: function() {
                    this.onSave( 'publish' );
                },
                /*
                 * Function: onSave
                 * Modifies livepress-tiny.
                 */
                onSave: function( isDraft ) {
                    // First, we need to be sure we're toggling the update indicator if they're disabled
                    var $bar = jQuery( '#lp-pub-status-bar' );

                    // If the bar has this class, it means updates are disabled ... so don't do anything
                    if ( ! $bar.hasClass( 'no-toggle' ) ) {
                        $bar.removeClass( 'not-live' ).addClass( 'live' );

                        $bar.find( 'a.toggle-live span' ).removeClass( 'hidden' );
                        $bar.find( '.icon' ).addClass( 'live' ).removeClass( 'not-live' );
                        $bar.find( '.first-line' ).find( '.lp-on' ).removeClass( 'hidden' );
                        $bar.find( '.first-line' ).find( '.lp-off' ).addClass( 'hidden' );
                        $bar.find( '.second-line' ).find( '.inactive' ).addClass( 'hidden' );
                        $bar.find( '.recent' ).removeClass( 'hidden' );
                    }

                    var newContent = Helper.getProcessedContent( tinyMCE.editors[this.handle] );
                    // Check, is update empty
                    var hasTextNodes = $j( '<div>' ).append( newContent ).contents().filter(function() {
                            return this.nodeType === 3 || this.innerHtml !== '' || this.innerText !== '';
                        }).length > 0;
                    var onlyMeta = Helper.hasMetainfoShortcodeOnly( newContent );
                    if ( ( ! hasTextNodes && $j( newContent ).text().trim() === '' ) || onlyMeta ) {
                        if ( this.mode === 'new' ) {
                            var afterTitleUpdate = function( res ) {
                                return false;
                            };
                            // If new update empty -- just send title update
                            Helper.appendPostUpdate( '', afterTitleUpdate, $j( '#title' ).val() );
                            return false;
                        } else {
                            // If user tries to save empty update -- that means that he want to delete it
                            return this.onDelete();
                        }
                    } else {
                        var $spinner = $j( '<div class=\'lp-spinner\'></div>' );
                        var $spin = $spinner;
                        var afterUpdate = ( function( self ) {
                            return function( region ) {
                                if ( undefined !==  region ) {
                                    var $target = $liveCanvas.find( 'div#livepress-update-' + region.id );

                                    // Check, what faster: AJAX answer or oortle publish
                                    if ( $target.length > 0 ) {
                                        $spin.remove();
                                    } else {
                                        self.originalHtmlContent = region.prefix + region.proceed + region.suffix;
                                        self.originalContent = region.content;
                                        self.originalId = region.id;

                                        self.isDraft = ( true === region.update_meta.draft );
                                        self.displayContent( $spin );
                                        Collaboration.Edit.update_live_posts_number();
                                    }
                                    if ( 'undefined' !== typeof window.FB ) {
                                        FB.XFBML.parse( document.getElementById( 'livepress-update-' + region.id ) );
                                    }
                                    if ( 'undefined' === typeof window.instgrm ) {
                                        jQuery.getScript( 'https://platform.instagram.com/en_US/embeds.js' );
                                    }
                                }
                        };
                        }( this ) );
                        // Save of non-empty update can be:
                        // 1) append from new post form
                        if ( this.mode === 'new' /*&& this.handle == microPostForm.handle*/ ) {
                            var action = LivepressConfig.placement_of_updates === 'bottom' ? 'appendTo' : 'prependTo';
                            $spinner[action]( $liveCanvas.find( 'div.inside:first' ) );
                            tinyMCE.editors[this.handle].setContent( '' );
                            if ( true === isDraft ) {
                                Helper.appendPostDraft( newContent, afterUpdate, $j( '#title' ).val() );
                            } else {
                                Helper.appendPostUpdate( newContent, afterUpdate, $j( '#title' ).val() );
                            }

                        } else
                        // 2) save of newly appended text somewhere [TODO]
                        /*If(this.mode === 'new') {
                         } else*/
                        // 3) change of already existent update
                        {
                            tinyMCE.execCommand( 'mceRemoveControl', false, this.handle );
                            $spinner.insertAfter( this.$form );
                            $spinner.data( 'nonExpandedContent', newContent ); // Make sure syncData works even while spinner active
                            this.$form.remove();
                            if ( true === isDraft ) {
                                Helper.changePostDraft( this.originalId, newContent, afterUpdate );
                            } else if ( 'publish' === isDraft ) {
                                Helper.appendPostUpdate( newContent, afterUpdate, $j( '#title' ).val() );
                            } else {
                                Helper.changePostUpdate( this.originalId, newContent, afterUpdate );
                            }

                        }
                    }

                    if ( 'new' !== this.mode ) {
                        tinyMCE.remove( tinyMCE.editors[this.handle] );
                    }

                    // Switch back to the text editor if set
                    if ( window.eeTextActive ) {
                        switchEditors.go( 'content', 'html' );
                    }

                    return false;
                },

                /*
                 * Function: onCancel
                 * Modifies livepress-tiny.
                 */
                onCancel: function() {

                    //	Var newContent = Helper.getProcessedContent(tinyMCE.editors[this.handle]);
                    //	var check = true;
                    tinyMCE.execCommand( 'mceRemoveControl', false, this.handle );

                    this.displayContent( this.$form );
                    tinyMCE.remove( tinyMCE.editors[this.handle] );

                    return false;
                },

                /*
                 * Function: onDelete
                 * Modifies livepress-tiny.
                 */
                onDelete: function() {
                    var check = confirm( lp_strings.confirm_delete );
                    if ( check ) {
                        tinyMCE.execCommand( 'mceRemoveControl', false, this.handle );
                        tinyMCE.remove( tinyMCE.editors[this.handle] );
                        var $spinner = $j( '<div class=\'lp-spinner\'></div>' );
                        $spinner.insertAfter( this.$form );
                        this.$form.remove();

                        Helper.deletePostUpdate( this.originalId, function() {
                            $spinner.remove();
                            Collaboration.Edit.update_live_posts_number();
                        });
                    }
                    return false;
                },

                /*
                 * Function: addListeners
                 * Adds hover and click events to new / edited posts.
                 */
                addListeners: function( $el ) {
                    $el.hover( LiveCanvas.onUpdateHoverIn, LiveCanvas.onUpdateHoverOut );
                    // Not trigger editing on mebedded elements.
                    $el.find( 'div' ).not( '.livepress-meta' ).find( 'a' ).on( 'click', function( ev ) {
                        ev.stopPropagation();
                        ev.preventDefault();
                    });
                }

            });


            /*
             * Namespaces: LiveCanvas
             * _(object)_ Object that controls the LiveCanvas area.
             */
            LiveCanvas = (function() {
                var inittedOnce = 0;
                var initXhr = null;

                /*
                 * Variable: $liveCanvas
                 * _(private)_ jQuery liveCanvas DOM element.
                 */
                $liveCanvas = $j([
                    '<div id="livepress-canvas" class="">',
                    '<h3><span id="livepress-updates_num">-</span> ' + lp_strings.updates + '</h3>',
                    '<div class=\'inside\'></div>',
                    '</div>'
                ].join( '' ) );

                /*
                 * Function: isEditing
                 * _(private)_
                 */
                var isEditing = function() {
                    return $liveCanvas.data( 'mode' ) === 'editing';
                };

                /*
                 * Function: onUpdateHoverIn
                 * _(public)_
                 */
                var onUpdateHoverIn = function() {
                    if ( ! isEditing() ) {
                        $j( this ).addClass( 'hover' );
                    }
                };

                /*
                 * Function: showMicroPostForm
                 * _(public)_ Builds and enabled main micro post form.
                 */
                var showMicroPostForm = function( cnt ) {

                    // If MicroPost form doesn't exist
                    // add new micropost form
                    microPostForm = new Selection( 'new', cnt );
                    $liveCanvas.before( microPostForm.$form );
                    microPostForm.enableTiny( 'main' );

                    // Because (add) media buttons are hard coded to use wordpress TinyMCE.editors['content']
                    // we must switch the references while our editor is active
                    if ( ! tinyMCE.editors.originalContent ) {
                        tinyMCE.editors.originalContent = tinyMCE.editors.content;
                        tinyMCE.editors.content = tinyMCE.editors[microPostForm.handle];
                    }
                };

                var addPost = function( data ) {

                    if ( data.replace( /<p>\s*<\/p>/gi, '' ) === '' ) {
                        return false;
                    }
                    var $newPost = $j( data );
                    var action = ( LivepressConfig.placement_of_updates === 'bottom' ? 'appendTo' : 'prependTo' );

                    $newPost.hide()[action]( $liveCanvas.find( 'div.inside:first' ) ).animate(
                        {
                            'height': 'toggle',
                            'opacity': 'toggle'
                        },
                        'slow',
                        function() {
                            $j( this ).removeAttr( 'style' );
                        });
                    return false;
                };

                /*
                 * Function: hideMicroPostForm
                 * _(public)_
                 */
                var hideMicroPostForm = function() {
                    if ( microPostForm ) {
                        microPostForm.stash();
                    }
                    // Because (add) media buttons are hard coded to use wordpress TinyMCE.editors['content']
                    // we must switch the references while our editor is active
                    tinyMCE.editors.content = tinyMCE.editors.originalContent;
                    delete tinyMCE.editors.originalContent;
                };

                /*
                 * Function: hide
                 * _(public)_
                 */
                var hide = function() {
                    if ( initXhr ) {
                        var xhr = initXhr;
                        xhr.abort();
                        initXhr = null;
                    } else {
                        $j( '#post-body-content .livepress-newform,.secondary-editor-tools' ).hide();
                        hideMicroPostForm();
                        $liveCanvas.hide();
                        $j( '#postdivrich' ).show();
                    }
                };

                /*
                 * Funtion: mergeData
                 * _(public)_
                 */
                var mergeData = function( regions ) {
                    if ( microPostForm !== undefined ) {
                        microPostForm.mergeData( regions );
                    }
                };

                /*
                 * Function: onUpdateHoverOut
                 * _(public)_
                 */
                var onUpdateHoverOut = function() {
                    if ( ! isEditing() ) {
                        $j( this ).removeClass( 'hover' );
                    }
                };

                /*
                 * Function: livePressDisableCheck
                 * _(private)_ Called when disabling live blog, checks if there are unsaved editors open.
                 */
                var livePressDisableCheck = function() {
                    if ( isEditing() ) {
                        if ( ! confirm( lp_strings.discard_unsaved ) ) {
                            return false;
                        }
                    }

                    hide();
                    return false;
                };

                /*
                 * Function: init
                 * _(public)_ Hides original canvas and create live one.
                 */
                var init = function() {
                    var postdivrich = document.getElementById( 'postdivrich' ),
                        $postdivrich = jQuery( postdivrich );

                    if ( ! window.eeActive ) {
                        return;
                    } // Break initialization cycle in case of interrupt
                    if ( ! tinyMCE.editors.length || tinyMCE.editors.content === undefined || ! tinyMCE.editors.content.initialized ) {
                        window.setTimeout( init, 50 ); // TinyMCE not initialized? try a bit later
                        return;
                    }
                    if ( ! inittedOnce && ! $j.fn.live ) {
                        $j.fn.live = $j.fn.livequery;
                        // Set a listener on disabling live blog since
                        // we need to run checks before turning it off now that it's on
                        $j( document.getElementById( 'live-blog-disable' ) ).on( 'click', livePressDisableCheck );
                    }

                    // Hide original tinymce area
                    $postdivrich.hide();

                    var spinner = document.createElement( 'div' ),
                        $spinner = jQuery( spinner );

                    var spin_livecanvas = document.createElement( 'div' );
                    spin_livecanvas.className = 'lp-spinner';
                    spin_livecanvas.setAttribute( 'id', 'lp_spin_livecanvas' );
                    spinner.appendChild( spin_livecanvas );
                    var spin_p = document.createElement( 'p' );
                    spin_p.style.textAlign = 'center';
                    spin_p.innerText = lp_strings.loading_content + '...';
                    spinner.appendChild( spin_p );

                    var container = document.getElementById( 'titlediv' );
                    if ( null === container ) {
                        container = document.getElementById( 'post-body' );
                    }
                    if ( container.nextSibling ) {
                        container.parentNode.insertBefore( spinner, container.nextSibling );
                    } else {
                        container.parentNode.appendChild( spinner );
                    }

                    // Get content from existing "old" tinymce editor
                    var originalContent = Helper.getProcessedContent( tinyMCE.editors.content );

                    // Regions contains:
                    //    orig -- last saved (visible to users) content
                    //    user -- content from currently edit content
                    //            will be omitted, if not differs
                    // every part is array, where every element = region:
                    //    id -- ID of region
                    //    prefix -- wrapping prefix tag
                    //    suffix -- wrapping end tag
                    //    content -- original content
                    //    proceed -- filtered resulting html
                    // initial regions analyse:
                    //    we should find:
                    //    1. New region prepended
                    //    2. New region appended
                    //    3. Regions matching, not changed
                    //    4. Regions matching, changed
                    var analyseStartEE = function( in_regions ) {
                        var orig = in_regions.orig, user = in_regions.user;
                        if ( ! orig ) {
                            orig = [];
                        }
                        if ( ! user ) {
                            return { 'prepend': [], 'append': [], 'changed': [], 'deleted': [], 'regions': orig };
                        }
                        var prepend = [], append = [], changed = [], deleted = [], regions = [];
                        var o = 0, c = 0, state = 0, i;
                        // Discover head changes
                        for ( o = 0; o < orig.length && ! state; o++ ) {
                            var id = orig[o].id;
                            for ( c = 0; c < user.length && ! state; c++ ) {
                                if ( id === user[c].id ) {
                                    state = 1;
                                    if ( o === 0 && c === 0 ) {
                                        // Start of arrays equals, nothing was prepended
                                        state = 1; // Do nothing, make JSLint happy
                                    } else if ( o === 0 && c === 1 ) {
                                        // There one update appended
                                        prepend[prepend.length] = user[0].id;
                                        user[0].orig = '';
                                        user[0].origproc = '';
                                        regions[regions.length] = user[0];
                                    } else if ( o === 1 && c === 1 ) {
                                        // There edit conflict: first update fully rewritten.
                                        prepend[prepend.length] = user[0].id;
                                        deleted[deleted.length] = orig[0].id;
                                        user[0].orig = '';
                                        user[0].origproc = '';
                                        regions[regions.length] = user[0];
                                        orig[0].orig = orig[0].content;
                                        orig[0].origproc = orig[0].prefix + orig[0].proceed + orig[0].suffix;
                                        orig[0].content = '';
                                        regions[regions.length] = orig[0];
                                    } else {
                                        // Some weird was happend with post: lot of content changed.
                                        // better to reload editor page...
                                        for ( i = 0; i < o; i++ ) {
                                            deleted[deleted.length] = orig[i].id;
                                            orig[i].orig = orig[i].content;
                                            orig[i].proc = orig[i].prefix + orig[i].proceed + orig[i].suffix;
                                            orig[i].content = '';
                                            regions[regions.length] = orig[i];
                                        }
                                        for ( i = 0; i < c; i++ ) {
                                            prepend[prepend.length] = user[i].id;
                                            user[i].orig = '';
                                            user[i].origproc = '';
                                            regions[regions.length] = user[i];
                                        }
                                    }
                                    o--;
                                    c--;
                                }
                            }
                        }
                        // Discover body changes
                        while ( o < orig.length && c < user.length ) {
                            if ( orig[o].id !== user[c].id ) {
                                // Ids not match, possible some middle conflict
                                // solve it by find next same IDs (if any)
                                var no, nc, s = 0;
                                for ( no = o; no < orig.length && ! s; no++ ) {
                                    var ni = orig[no].id;
                                    for ( nc = c; nc < user.length && ! s; nc++ ) {
                                        if ( user[nc].id === ni ) {
                                            // Found equals match
                                            // all between match from user is "changed" (appended in middle)
                                            for ( s = c; s < nc; s++ ) {
                                                changed[changed.length] = user[s].id;
                                                user[s].orig = '';
                                                user[s].origproc = '';
                                                regions[regions.length] = user[s];
                                            }
                                            // All between match from orig is deleted.
                                            for ( s = o; s < no; s++ ) {
                                                deleted[deleted.length] = orig[s].id;
                                                orig[s].orig = orig[s].content;
                                                orig[s].origproc = orig[s].prefix + orig[s].proceed + orig[s].suffix;
                                                orig[s].content = '';
                                                regions[regions.length] = orig[s];
                                            }
                                            // Found, continue
                                            s = 1;
                                        }
                                    }
                                }
                                if ( s ) {
                                    o = no - 1;
                                    c = nc - 1;
                                } else {
                                    break;
                                }
                            }
                            if ( orig[o].content !== user[c].content ) {
                                changed[changed.length] = orig[o].id;
                            }
                            user[c].orig = orig[o].content;
                            user[c].origproc = orig[o].prefix + orig[o].proceed + orig[o].suffix;
                            regions[regions.length] = user[c];
                            // Advance
                            o++;
                            c++;
                        }
                        // End of equals body. anything left in user are appended,
                        // anything left in orig are deleted (conflict?)
                        for ( ; c < user.length; c++ ) {
                            append[append.length] = user[c].id;
                            user[c].orig = '';
                            user[c].origproc = '';
                            regions[regions.length] = user[c];
                        }
                        for ( ; o < orig.length; o++ ) {
                            deleted[deleted.length] = orig[o].id;
                            orig[o].orig = orig[o].content;
                            orig[o].origproc = orig[o].prefix + orig[o].proceed + orig[o].suffix;
                            orig[o].content = '';
                            regions[regions.length] = orig[o];
                        }
                        return {
                            'prepend': prepend,
                            'append': append,
                            'changed': changed,
                            'deleted': deleted,
                            'regions': regions
                        };
                    };
                    var startError = function( error ) {
                        var ps = new Livepress.Admin.PostStatus();
                        ps.error( error );
                        $j( '#post-body-content .livepress-newform,.secondary-editor-tools' ).hide();
                        $liveCanvas.hide();
                        $postdivrich.show();
                        $spinner.remove();
                        Collaboration.Edit.destroy();
                        var $ls = jQuery( '#live-switcher' );
                        if ( $ls.hasClass( 'on' ) ) {
                            $ls.trigger( 'click' );
                        }
                        return;
                    };
                    var initAfterStartEE = function( regions, textError, errorThrown ) {
                        if ( this !== initXhr && errorThrown !== initXhr ) {
                            // Got complete on aborted ajax call
                            return;
                        }
                        if ( 'undefined' === typeof regions ) {
                            return;
                        }

                        if( true === regions['raw'] ){
                            $liveCanvas.find( 'div.inside:first' ).html( regions['html'] );
                            $spinner.remove();
                            if ( 1 === jQuery( '#titlediv' ).length ) {
                                $liveCanvas.insertAfter( '#titlediv' );
                            } else {
                                $liveCanvas.insertBefore( '#postdivrich' );
                            }
                            return;
                        }
                        var blogContent = '', i = 0;
                        if ( regions === undefined && 'parsererror' !== textError && 'error' !== textError ) {
                            return startError( 'Error: ' + textError + ' : ' + errorThrown );
                        }
                        if ( regions.edit_uuid ) {
                            LivepressConfig.post_edit_msg_id = regions.edit_uuid;
                        }
                        // Start the livepress collaborative edit
                        if ( 'editStartup' in regions ) {
                            Collaboration.Edit.initialize( regions.editStartup );
                        } else {
                            Collaboration.Edit.initialize();
                        }
                        var ee = analyseStartEE( regions );
                        // Set this content in the livecanvas area but remove
                        // livepress-update-stub tags
                        // set events
                        var $inside_first = $liveCanvas.find( 'div.inside:first' ).html( '' );
                        var pr = 0, ap = 0, ch = 0, de = 0, sty = '';
                        var microContent = '';
                        for ( i = 0; i < ee.regions.length; i++ ) {
                            var reg = ee.regions[i];
                            if ( pr < ee.prepend.length && reg.id === ee.prepend[pr] ) {
                                // Prepended block
                                if ( ! pr && ! ap ) { // First prepended block come to new edit area
                                    microContent = reg.content;
                                    pr++;
                                    continue; // Do not apply it
                                }
                                sty = 'new'; // Display block as new (not saved yet)
                            } else if ( ap < ee.append.length && reg.id === ee.append[ap] ) {
                                // Appended block
                                if ( ! pr && ! ap ) { // First appended block come to new edit area
                                    microContent = reg.content;
                                    ap++;
                                    continue; // Do not apply it
                                }
                                sty = 'new'; // Display block as new (not saved yet)
                            } else if ( ch < ee.changed.length && reg.id === ee.changed[ch] ) {
                                // Changed block
                                sty = 'edit'; // Display block as edited
                                ch++;
                            } else if ( de < ee.deleted.length && reg.id === ee.deleted[de] ) {
                                // Deleted block
                                sty = 'del'; // Display block as deleted
                                de++;
                            } else {
                                // Published non touched block
                                sty = '';
                            }
                            var proc = reg.prefix + reg.proceed + reg.suffix;
                            var origproc = reg.origproc === undefined ? proc : reg.origproc;
                            var $block = $j( proc );
                            var orig = reg.orig === undefined ? reg.content : reg.orig;
                            $block.data( 'nonExpandedContent', reg.content );
                            $block.data( 'originalContent', orig );
                            $block.data( 'originalHtmlContent', origproc );
                            $block.data( 'originalId', reg.id );
                            if ( sty === 'new' ) {
                                // FIXME: add some kind of support for that
                                return startError( lp_strings.double_added );
                            }
                            $block.attr( 'editStyle', sty );
                            try {
                                window.twttr.widgets.load( $block[0] );
                            }
                            catch ( exc ) {
                            }
                            $inside_first.append( $block );
                        }
                        $inside_first
                            .find( 'div.livepress-update' )
                            .hover( onUpdateHoverIn, onUpdateHoverOut );

                        $spinner.remove();
                        if ( ! inittedOnce ) {
                            if ( 1 === jQuery( '#titlediv' ).length ) {
                                $liveCanvas.insertAfter( '#titlediv' );
                            } else {
                                $liveCanvas.insertBefore( '#postdivrich' );
                            }

                            var canvas = document.getElementById( 'livepress-canvas' ),
                                $canvas = $j( canvas );

                            // Live listeners, bound to canvas (since childs are recreated/added/removed dynamically)
                            // @todo ensure only one editor open at opnce, disable click when one editor active
                            $canvas.on( 'click', 'div.livepress-update', function( ev ) {

                                var $target = $j( ev.target );
                                if ( $target.is( 'a,input,button,textarea' ) || $target.parents( 'a,input,button,textarea' ).length > 0 ) {
                                    return true; // Do not handle click event from children links (needed to fix live)
                                }
                                if ( ! isEditing() ) {
                                    var style = this.getAttribute( 'editStyle' );

                                    var Sel = new Selection( 'del' === style ? 'deleting' : 'editing', this );
                                    Sel.$form.insertAfter( this );

                                    var editor = Sel.enableTiny( style );
                                    editor.show();
                                    // Remove all redo states to clear the version with the shortcode
                                    editor.undoManager.clear();
                                   // Hack just reload the content to make WP embed hooks in tinyMCE  refesh content to render emeb's
                                    tinyMCE.get( editor.id ).setContent( tinyMCE.get( editor.id ).getContent() );
                                    // Create a new undo state as the start point
                                    editor.undoManager.add();

                                    var tab_markup = '<div class="livepress-inline-editor-tabs wp-editor-tabs ' + editor.id + '"><a id="content-livepress-html" data-editor="' + editor.id + '" class="hide-if-no-js wp-switch-editor switch-livepress-html"><span class="icon-livepress-logo"></span> ' + lp_strings.text_editor + '</a><a id="content-livepress"  data-editor="' + editor.id + '" class="hide-if-no-js wp-switch-editor switch-livepress active"><span class="icon-livepress-logo"></span> ' + lp_strings.visual_text_editor + '</a></div>';
                                    jQuery( tab_markup ).prependTo( Sel.$form );
                                    // Clone the media button

                                    jQuery( '.wp-media-buttons' )
                                        .first()
                                        .clone( true )
                                        .prependTo( Sel.$form )
                                        .css( 'margin-left', '10px' )
                                        .find( 'button , a' )
                                        .attr( 'data-editor', editor.id )
                                        .click(function() {
                                            window.wp.media.editor.id( editor.id );
                                            window.LP_ActiveEditor = editor.id;
                                        });

                                    addEditorTabControlListeners( Sel.$form.parent().find( '.livepress-inline-editor-tabs' ), editor.id, '', editor );
                                    jQuery( this ).remove();
                                }
                            });
                            $canvas.on( 'click', 'div.livepress-update a', function( ev ) {
                                ev.stopPropagation();
                            });

                            //ShowMicroPostForm();
                        } else {
                            $j( '#post-body-content .livepress-newform' ).show();
                            $liveCanvas.show();
                        }

                        var $sec = $j( '.secondary-editor-tools' );
                        if ( ! $sec.length ) {
                            var insert_div = '#poststuff';
                            if ( 1 === jQuery( '#titlediv' ).length ) {
                                insert_div = '#titlediv';
                            }
                            //Copy media buttons from orig tinymce
                            jQuery( '#wp-content-editor-tools' )
                                .clone( true )
                                .insertAfter( insert_div )
                                .addClass( 'secondary-editor-tools' )
                                // This next line undoes WP 4.0 editor-expand (sticky toolbar/media button)
                                .css({ position: 'relative', top: 'auto', width: 'auto' })
                                .find( '#content-tmce, #content-html' )
                                .each(function() {
                                    jQuery( this )
                                        .removeAttr( 'id' )
                                        .removeAttr( 'onclick' )
                                        .on( 'click', function() {

                                        });
                                });
                        } else {
                            $sec.show();
                        }

                        showMicroPostForm( microContent );
                        Collaboration.Edit.update_live_posts_number();
                        window.setTimeout( update_embeds, 1000 );

                        // First micro post
                        var $currentPosts = $liveCanvas.find( 'div.livepress-update:first' );

                        /**
                         * Add the Live Post Header feature
                         */
                        if ( jQuery( '#livepress_status_meta_box' ).hasClass( 'pinned-header' ) ) {

                            // Add the 'Live Post Header' box
                            $currentPosts
                                .wrap( '<div class="pinned-first-livepress-update"></div>' )
                                .before( '<div class="pinned-first-livepress-update-header">' +
                                    '<div class="dashicons dashicons-arrow-down"></div>' +
                                    lp_strings.live_post_header +
                                    '</div>' );
                            // Move the box to above the Update Count
                            $liveCanvas.find( '.pinned-first-livepress-update' )
                                .prependTo( $liveCanvas )
                                .find( '.livepress-update:first' )
                                .find( '.livepress-delete' )
                                .hide();

                            $liveCanvas.find( '.pinned-first-livepress-update div.livepress-update' ).hide();

                            /**
                             * Add handlers for expanding/contracting the pinned post header
                             */
                                // Expand/Show the Live Post Header when triangle is clicked
                            $liveCanvas.on( 'click', '.pinned-first-livepress-update-header', function( el ) {
                                var $firstUpdate = $liveCanvas.find( '.pinned-first-livepress-update div.livepress-update' ),
                                    $icon = $liveCanvas.find( '.dashicons' );

                                if ( $firstUpdate.is( ':visible' ) ) {
                                    $firstUpdate.slideUp( 'fast' );
                                    $icon.removeClass( 'dashicons-arrow-up' ).addClass( 'dashicons-arrow-down' );
                                } else {
                                    $firstUpdate.slideDown( 'fast' );
                                    $icon.removeClass( 'dashicons-arrow-down' ).addClass( 'dashicons-arrow-up' );
                                }
                            });
                        }

                        var $pub = jQuery( '#publish' );
                        $pub.on( 'click', function() {
                            LiveCanvas.hide();
                            return true;
                        });

                        inittedOnce = 1;
                        initXhr = null;
                    };
                    initXhr = Helper.doStartEE( originalContent, initAfterStartEE );
                };

                /*
                 * Function: get
                 * _(public)_
                 */
                var get = function() {
                    return $liveCanvas.find( 'div.inside:first' );
                };

                return {
                    init: init,
                    get: get,
                    hide: hide,
                    mergeData: mergeData,
                    onUpdateHoverIn: onUpdateHoverIn,
                    onUpdateHoverOut: onUpdateHoverOut,
                    showMicroPostForm: showMicroPostForm,
                    hideMicroPostForm: hideMicroPostForm,
                    addPost: addPost
                };
            }() );

            // Creates live blogging activation tools
            Livepress.Ready = function() {
                OORTLE.Livepress.Dashboard = new Dashboard.Controller();
                OORTLE.Livepress.LivepressHUD.init();
                // Hide the screen option for LivePress live status
                jQuery( '.metabox-prefs label[for=livepress_status_meta_box-hide]' ).hide();
            };

            return {
                LivepressHUD: new LivepressHUD(),
                startLiveCanvas: LiveCanvas.init,
                getLiveCanvas: LiveCanvas.get,
                mergeLiveCanvasData: LiveCanvas.mergeData
            };
        }() );
    }

    /**
     * Optimized code for twitter intents.
     *
     * @see <a href="https://dev.twitter.com/pages/intents">External documentation</a>
     */
    (function() {
        if ( window.__twitterIntentHandler ) {
            return;
        }
        var intentRegex = /twitter\.com(\:\d{2,4})?\/intent\/(\w+)/,
            windowOptions = 'scrollbars=yes,resizable=yes,toolbar=no,location=yes',
            width = 550,
            height = 420,
            winHeight = screen.height,
            winWidth = screen.width;

        function handleIntent( e ) {
            e = e || window.event;
            var target = e.target || e.srcElement,
                m, left, top;

            while ( target && target.nodeName.toLowerCase() !== 'a' ) {
                target = target.parentNode;
            }

            if ( target && target.nodeName.toLowerCase() === 'a' && target.href ) {
                m = target.href.match( intentRegex );
                if ( m ) {
                    left = Math.round( ( winWidth / 2 ) - ( width / 2 ) );
                    top = 0;

                    if ( winHeight > height ) {
                        top = Math.round( ( winHeight / 2 ) - ( height / 2 ) );
                    }

                    window.open( target.href, 'intent', windowOptions + ',width=' + width +
                        ',height=' + height + ',left=' + left + ',top=' + top );
                    e.returnValue = false;
                    if ( e.preventDefault ) {
                        e.preventDefault();
                    }
                }
            }
        }

        if ( document.addEventListener ) {
            document.addEventListener( 'click', handleIntent, false );
        } else if ( document.attachEvent ) {
            document.attachEvent( 'onclick', handleIntent );
        }
        window.__twitterIntentHandler = true;
    }() );

    /**
     * Once all the other code is loaded, we check to be sure the user is on the post edit screen and load the new Live
     * Blogging Tools palette if they are.
     */
    if ( undefined !== LivepressConfig.current_screen && 'post' === LivepressConfig.current_screen.base ) {

        var live_blogging_tools = new Livepress.Admin.Tools();

        if ( '1' === LivepressConfig.post_live_status ) {
            live_blogging_tools.render();
        }
        live_blogging_tools.wireupDefaults();

    }

});

var AnyTime =
{
    version: '5.1.2',

  	//=========================================================================
  	//  AnyTime.pad() pads a value with a specified number of zeroes and
    //  returns a string containing the padded value.
  	//=========================================================================

  	pad: function( val, len )
  	{
  		var str = String(Math.abs(val));
  		while ( str.length < len )
  		str = '0'+str;
  		if ( val < 0 )
  		str = '-'+str;
  		return str;
  	}
};

(function($)
{
	// private members

	var __daysIn = [ 31,28,31,30,31,30,31,31,30,31,30,31 ];
	var __initialized = false;
  var __pickers = [];

  	//  Add methods to jQuery to create and destroy pickers using
  	//  the typical jQuery approach.

  	$.fn.AnyTime_picker = function( options )
  	{
  		return this.each( function(i) { AnyTime.picker( this.id, options ); } );
  	}

  	$.fn.AnyTime_noPicker = function()
  	{
  		return this.each( function(i) { AnyTime.noPicker( this.id ); } );
  	}

  	//  Add methods to jQuery to change the current, earliest and latest times
  	//  using the typical jQuery approach.

  	$.fn.AnyTime_setCurrent = function( newTime )
    {
  		return this.each( function(i) { AnyTime.setCurrent( this.id, newTime ); } );
    }

  	$.fn.AnyTime_setEarliest = function( newTime )
    {
  		return this.each( function(i) { AnyTime.setEarliest( this.id, newTime ); } );
    }

  	$.fn.AnyTime_setLatest = function( newTime )
    {
  		return this.each( function(i) { AnyTime.setLatest( this.id, newTime ); } );
    }

  	// 	Add a method to jQuery to change the classes of an element to
  	//  indicate whether it's value is current (used by AnyTime.picker),
  	//  and another to trigger the click handler for the currently-
  	//  selected button under an element.

  	$.fn.AnyTime_current = function(isCurrent,isLegal)
	{
	    if ( isCurrent )
	    {
		  this.removeClass('AnyTime-out-btn ui-state-default ui-state-disabled ui-state-highlight');
	      this.addClass('AnyTime-cur-btn ui-state-default ui-state-highlight');
	    }
	    else
	    {
	      this.removeClass('AnyTime-cur-btn ui-state-highlight');
	      if ( ! isLegal )
	    	  this.addClass('AnyTime-out-btn ui-state-disabled');
	      else
	    	  this.removeClass('AnyTime-out-btn ui-state-disabled');
	    }
	};

	$.fn.AnyTime_clickCurrent = function()
	{
		this.find('.AnyTime-cur-btn').triggerHandler('click');
	}

  	$(document).ready(
  		function()
		{
			//  Move popup windows to the end of the page.  This allows them to
			//  overcome XHTML restrictions on <table> placement enforced by MSIE.

			for ( var id in __pickers )
        if ( ! Array.prototype[id] ) // prototype.js compatibility issue
			    __pickers[id].onReady();

			__initialized = true;

		} ); // document.ready

//=============================================================================
//  AnyTime.Converter
//
//  This object converts between Date objects and Strings.
//
//  To use AnyTime.Converter, simply create an instance for a format string,
//  and then (repeatedly) invoke the format() and/or parse() methods to
//  perform the conversions.  For example:
//
//    var converter = new AnyTime.Converter({format:'%Y-%m-%d'})
//    var datetime = converter.parse('1967-07-30') // July 30, 1967 @ 00:00
//    alert( converter.format(datetime) ); // outputs: 1967-07-30
//
//  Constructor parameter:
//
//  options - an object of optional parameters that override default behaviors.
//    The supported options are:
//
//    baseYear - the number to add to two-digit years if the %y format
//      specifier is used.  By default, AnyTime.Converter follows the
//      MySQL assumption that two-digit years are in the range 1970 to 2069
//      (see http://dev.mysql.com/doc/refman/5.1/en/y2k-issues.html).
//      The most common alternatives for baseYear are 1900 and 2000.
//
//    dayAbbreviations - an array of seven strings, indexed 0-6, to be used
//      as ABBREVIATED day names.  If not specified, the following are used:
//      ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
//      Note that if the firstDOW option is passed to AnyTime.picker() (see
//      AnyTime.picker()), this array should nonetheless begin with the
//      desired abbreviation for Sunday.
//
//    dayNames - an array of seven strings, indexed 0-6, to be used as
//      day names.  If not specified, the following are used: ['Sunday',
//        'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
//      Note that if the firstDOW option is passed to AnyTime.picker() (see
//      AnyTime.picker()), this array should nonetheless begin with the
//      desired name for Sunday.
//
//    eraAbbreviations - an array of two strings, indexed 0-1, to be used
//      as ABBREVIATED era names.  Item #0 is the abbreviation for "Before
//      Common Era" (years before 0001, sometimes represented as negative
//      years or "B.C"), while item #1 is the abbreviation for "Common Era"
//      (years from 0001 to present, usually represented as unsigned years
//      or years "A.D.").  If not specified, the following are used:
//      ['BCE','CE']
//
//    format - a string specifying the pattern of strings involved in the
//      conversion.  The parse() method can take a string in this format and
//      convert it to a Date, and the format() method can take a Date object
//      and convert it to a string matching the format.
//
//      Fields in the format string must match those for the DATE_FORMAT()
//      function in MySQL, as defined here:
//      http://tinyurl.com/bwd45#function_date-format
//
//      IMPORTANT:  Some MySQL specifiers are not supported (especially
//      those involving day-of-the-year, week-of-the-year) or approximated.
//      See the code for exact behavior.
//
//      In addition to the MySQL format specifiers, the following custom
//      specifiers are also supported:
//
//        %B - If the year is before 0001, then the "Before Common Era"
//          abbreviation (usually BCE or the obsolete BC) will go here.
//
//        %C - If the year is 0001 or later, then the "Common Era"
//          abbreviation (usually CE or the obsolete AD) will go here.
//
//        %E - If the year is before 0001, then the "Before Common Era"
//          abbreviation (usually BCE or the obsolete BC) will go here.
//          Otherwise, the "Common Era" abbreviation (usually CE or the
//          obsolete AD) will go here.
//
//        %Z - The current four-digit year, without any sign.  This is
//          commonly used with years that might be before (or after) 0001,
//          when the %E (or %B and %C) specifier is used instead of a sign.
//          For example, 45 BCE is represented "0045".  By comparison, in
//          the "%Y" format, 45 BCE is represented "-0045".
//
//        %z - The current year, without any sign, using only the necessary
//          number of digits.  This if the year is commonly used with years
//          that might be before (or after) 0001, when the %E (or %B and %C)
//          specifier is used instead of a sign.  For example, the year
//          45 BCE is represented as "45", and the year 312 CE as "312".
//
//        %# - the timezone offset, with a sign, in minutes.
//
//        %+ - the timezone offset, with a sign, in hours and minutes, in
//          four-digit, 24-hour format with no delimiter (for example, +0530).
//          To remember the difference between %+ and %-, it might be helpful
//          to remember that %+ might have more characters than %-.
//
//        %: - the timezone offset, with a sign, in hours and minutes, in
//          four-digit, 24-hour format with a colon delimiter (for example,
//          +05:30).  This is similar to the %z format used by Java.
//          To remember the difference between %: and %;, it might be helpful
//          to remember that a colon (:) has a period (.) on the bottom and
//          a semicolon (;) has a comma (,), and in English sentence structure,
//          a period represents a more significant stop than a comma, and
//          %: might be a longer string than %; (I know it's a stretch, but
//          it's easier than looking it up every time)!
//
//        %- - the timezone offset, with a sign, in hours and minutes, in
//          three-or-four-digit, 24-hour format with no delimiter (for
//          example, +530).
//
//        %; - the timezone offset, with a sign, in hours and minutes, in
//          three-or-four-digit, 24-hour format with a colon delimiter
//          (for example, +5:30).
//
//        %@ - the timezone offset label.  By default, this will be the
//          string "UTC" followed by the offset, with a sign, in hours and
//          minutes, in four-digit, 24-hour format with a colon delimiter
//          (for example, UTC+05:30).  However, if Any+Time(TM) has been
//          extended with a member named utcLabel (for example, by the
//          anytimetz.js file), then it is assumed to be an array of arrays,
//          where the primary array is indexed by time zone offsets, and
//          each sub-array contains a potential label for that offset.
//          When parsing with %@, the array is scanned for matches to the
//          input string, and if a match is found, the corresponding UTC
//          offset is used.  When formatting, the array is scanned for a
//          matching offset, and if one is found, the first member of the
//          sub-array is used for output (unless overridden with
//          utcFormatOffsetSubIndex or setUtcFormatOffsetSubIndex()).
//          If the array does not exist, or does not contain a sub-array
//          for the offset, then the default format is used.
//
//    monthAbbreviations - an array of twelve strings, indexed 0-6, to be
//      used as ABBREVIATED month names.  If not specified, the following
//      are used: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep',
//        'Oct','Nov','Dec']
//
//    monthNames - an array of twelve strings, indexed 0-6, to be used as
//      month names.  If not specified, the following are used:
//      ['January','February','March','April','May','June','July',
//        'August','September','October','November','December']
//
//    utcFormatOffsetAlleged - the offset from UTC, in minutes, to claim that
//      a Date object represents during formatting, even though it is formatted
//      using local time. Unlike utcFormatOffsetImposed, which actually
//      converts the Date object to the specified different time zone, this
//      option merely reports the alleged offset when a timezone specifier
//      (%#, %+, %-, %:, %; %@) is encountered in the format string.
//      This primarily exists so AnyTime.picker can edit the time as specified
//      (without conversion to local time) and then convert the edited time to
//      a different time zone (as selected using the picker).  Any initial
//      value specified here can be changed by setUtcFormatOffsetAlleged().
//      If a format offset is alleged, one cannot also be imposed (the imposed
//      offset is ignored).
//
//    utcFormatOffsetImposed - the offset from UTC, in minutes, to specify when
//      formatting a Date object.  By default, a Date is always formatted
//      using the local time zone.
//
//    utcFormatOffsetSubIndex - when extending AnyTime with a utcLabel array
//      (for example, by the anytimetz.js file), the specified sub-index is
//      used to choose the Time Zone label for the UTC offset when formatting
//      a Date object.  This primarily exists so AnyTime.picker can specify
//      the label selected using the picker.  Any initial value specified here
//      can be changed by setUtcFormatOffsetSubIndex().
//
//    utcParseOffsetAssumed - the offset from UTC, in minutes, to assume when
//      parsing a String object.  By default, a Date is always parsed using the
//      local time zone, unless the format string includes a timezone
//      specifier (%#, %+, %-, %:, %; or %@), in which case the timezone
//      specified in the string is used. The Date object created by parsing
//      always represents local time regardless of the input time zone.
//
//    utcParseOffsetCapture - if true, any parsed string is always treated as
//      though it represents local time, and any offset specified by the string
//      (or utcParseOffsetAssume) is captured for return by the
//      getUtcParseOffsetCaptured() method.  If the %@ format specifier is
//      used, the sub-index of any matched label is also captured for return
//      by the getUtcParseOffsetSubIndex() method.  This primarily exists so
//      AnyTime.picker can edit the time as specified (without conversion to
//      local time) and then convert the edited time to a different time zone
//      (as selected using the picker).
//=============================================================================

AnyTime.Converter = function(options)
{
  	// private members

  	var _flen = 0;
	var _longDay = 9;
	var _longMon = 9;
	var _shortDay = 6;
	var _shortMon = 3;
	var _offAl = Number.MIN_VALUE; // format time zone offset alleged
	var _offCap = Number.MIN_VALUE; // parsed time zone offset captured
	var _offF = Number.MIN_VALUE; // format time zone offset imposed
	var _offFSI = (-1); // format time zone label subindex
	var _offP = Number.MIN_VALUE; // parsed time zone offset assumed
	var _offPSI = (-1);        // parsed time zone label subindex captured
	var _captureOffset = false;

	// public members

	this.fmt = '%Y-%m-%d %T';
	this.dAbbr = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
	this.dNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
	this.eAbbr = ['BCE','CE'];
	this.mAbbr = [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ];
	this.mNames = [ 'January','February','March','April','May','June','July','August','September','October','November','December' ];
	this.baseYear = null;

	//-------------------------------------------------------------------------
	//  AnyTime.Converter.dAt() returns true if the character in str at pos
	//  is a digit.
	//-------------------------------------------------------------------------

	this.dAt = function( str, pos )
	{
	    return ( (str.charCodeAt(pos)>='0'.charCodeAt(0)) &&
	            (str.charCodeAt(pos)<='9'.charCodeAt(0)) );
	};

	//-------------------------------------------------------------------------
	//  AnyTime.Converter.format() returns a String containing the value
	//  of a specified Date object, using the format string passed to
	//  AnyTime.Converter().
	//
	//  Method parameter:
	//
	//    date - the Date object to be converted
	//-------------------------------------------------------------------------

	this.format = function( date )
	{
		var d = new Date(date.getTime());
		if ( ( _offAl == Number.MIN_VALUE ) && ( _offF != Number.MIN_VALUE ) )
		  d.setTime( ( d.getTime() + (d.getTimezoneOffset()*60000) ) + (_offF*60000) );

	    var t;
	    var str = '';
	    for ( var f = 0 ; f < _flen ; f++ )
	    {
	      if ( this.fmt.charAt(f) != '%' )
	        str += this.fmt.charAt(f);
	      else
	      {
	    	var ch = this.fmt.charAt(f+1)
	        switch ( ch )
	        {
	          case 'a': // Abbreviated weekday name (Sun..Sat)
	            str += this.dAbbr[ d.getDay() ];
	            break;
	          case 'B': // BCE string (eAbbr[0], usually BCE or BC, only if appropriate) (NON-MYSQL)
	            if ( d.getFullYear() < 0 )
	              str += this.eAbbr[0];
	            break;
	          case 'b': // Abbreviated month name (Jan..Dec)
	            str += this.mAbbr[ d.getMonth() ];
	            break;
	          case 'C': // CE string (eAbbr[1], usually CE or AD, only if appropriate) (NON-MYSQL)
	            if ( d.getFullYear() > 0 )
	              str += this.eAbbr[1];
	            break;
	          case 'c': // Month, numeric (0..12)
	            str += d.getMonth()+1;
	            break;
	          case 'd': // Day of the month, numeric (00..31)
	            t = d.getDate();
	            if ( t < 10 ) str += '0';
	            str += String(t);
	            break;
	          case 'D': // Day of the month with English suffix (0th, 1st,...)
	            t = String(d.getDate());
	            str += t;
	            if ( ( t.length == 2 ) && ( t.charAt(0) == '1' ) )
	              str += 'th';
	            else
	            {
	              switch ( t.charAt( t.length-1 ) )
	              {
	                case '1': str += 'st'; break;
	                case '2': str += 'nd'; break;
	                case '3': str += 'rd'; break;
	                default: str += 'th'; break;
	              }
	            }
	            break;
	          case 'E': // era string (from eAbbr[], BCE, CE, BC or AD) (NON-MYSQL)
	            str += this.eAbbr[ (d.getFullYear()<0) ? 0 : 1 ];
	            break;
	          case 'e': // Day of the month, numeric (0..31)
	            str += d.getDate();
	            break;
	          case 'H': // Hour (00..23)
	            t = d.getHours();
	            if ( t < 10 ) str += '0';
	            str += String(t);
	            break;
	          case 'h': // Hour (01..12)
	          case 'I': // Hour (01..12)
	            t = d.getHours() % 12;
	            if ( t == 0 )
	              str += '12';
	            else
	            {
	              if ( t < 10 ) str += '0';
	              str += String(t);
	            }
	            break;
	          case 'i': // Minutes, numeric (00..59)
	            t = d.getMinutes();
	            if ( t < 10 ) str += '0';
	            str += String(t);
	            break;
	          case 'k': // Hour (0..23)
	            str += d.getHours();
	            break;
	          case 'l': // Hour (1..12)
	            t = d.getHours() % 12;
	            if ( t == 0 )
	              str += '12';
	            else
	              str += String(t);
	            break;
	          case 'M': // Month name (January..December)
	            str += this.mNames[ d.getMonth() ];
	            break;
	          case 'm': // Month, numeric (00..12)
	            t = d.getMonth() + 1;
	            if ( t < 10 ) str += '0';
	            str += String(t);
	            break;
	          case 'p': // AM or PM
	            str += ( ( d.getHours() < 12 ) ? 'AM' : 'PM' );
	            break;
	          case 'r': // Time, 12-hour (hh:mm:ss followed by AM or PM)
	            t = d.getHours() % 12;
	            if ( t == 0 )
	              str += '12:';
	            else
	            {
	              if ( t < 10 ) str += '0';
	              str += String(t) + ':';
	            }
	            t = d.getMinutes();
	            if ( t < 10 ) str += '0';
	            str += String(t) + ':';
	            t = d.getSeconds();
	            if ( t < 10 ) str += '0';
	            str += String(t);
	            str += ( ( d.getHours() < 12 ) ? 'AM' : 'PM' );
	            break;
	          case 'S': // Seconds (00..59)
	          case 's': // Seconds (00..59)
	            t = d.getSeconds();
	            if ( t < 10 ) str += '0';
	            str += String(t);
	            break;
	          case 'T': // Time, 24-hour (hh:mm:ss)
	            t = d.getHours();
	            if ( t < 10 ) str += '0';
	            str += String(t) + ':';
	            t = d.getMinutes();
	            if ( t < 10 ) str += '0';
	            str += String(t) + ':';
	            t = d.getSeconds();
	            if ( t < 10 ) str += '0';
	            str += String(t);
	            break;
	          case 'W': // Weekday name (Sunday..Saturday)
	            str += this.dNames[ d.getDay() ];
	            break;
	          case 'w': // Day of the week (0=Sunday..6=Saturday)
	            str += d.getDay();
	            break;
	          case 'Y': // Year, numeric, four digits (negative if before 0001)
	            str += AnyTime.pad(d.getFullYear(),4);
	            break;
	          case 'y': // Year, numeric (two digits, negative if before 0001)
	            t = d.getFullYear() % 100;
	            str += AnyTime.pad(t,2);
	            break;
	          case 'Z': // Year, numeric, four digits, unsigned (NON-MYSQL)
	            str += AnyTime.pad(Math.abs(d.getFullYear()),4);
	            break;
	          case 'z': // Year, numeric, variable length, unsigned (NON-MYSQL)
	            str += Math.abs(d.getFullYear());
	            break;
	          case '%': // A literal '%' character
	            str += '%';
	            break;
	          case '#': // signed timezone offset in minutes
	        	t = ( _offAl != Number.MIN_VALUE ) ? _offAl :
	        		( _offF == Number.MIN_VALUE ) ? (0-d.getTimezoneOffset()) : _offF;
	        	if ( t >= 0 )
	        		str += '+';
	        	str += t;
	        	break;
	          case '@': // timezone offset label
		        t = ( _offAl != Number.MIN_VALUE ) ? _offAl :
		        	( _offF == Number.MIN_VALUE ) ? (0-d.getTimezoneOffset()) : _offF;
		        if ( AnyTime.utcLabel && AnyTime.utcLabel[t] )
		        {
		          if ( ( _offFSI > 0 ) && ( _offFSI < AnyTime.utcLabel[t].length ) )
		            str += AnyTime.utcLabel[t][_offFSI];
		          else
		            str += AnyTime.utcLabel[t][0];
		          break;
		        }
		        str += 'UTC';
		        ch = ':'; // drop through for offset formatting
	          case '+': // signed, 4-digit timezone offset in hours and minutes
	          case '-': // signed, 3-or-4-digit timezone offset in hours and minutes
	          case ':': // signed 4-digit timezone offset with colon delimiter
	          case ';': // signed 3-or-4-digit timezone offset with colon delimiter
		        t = ( _offAl != Number.MIN_VALUE ) ? _offAl :
		        		( _offF == Number.MIN_VALUE ) ? (0-d.getTimezoneOffset()) : _offF;
		        if ( t < 0 )
		          str += '-';
		        else
		          str += '+';
		        t = Math.abs(t);
		        str += ((ch=='+')||(ch==':')) ? AnyTime.pad(Math.floor(t/60),2) : Math.floor(t/60);
		        if ( (ch==':') || (ch==';') )
		          str += ':';
		        str += AnyTime.pad(t%60,2);
		        break;
	          case 'f': // Microseconds (000000..999999)
	          case 'j': // Day of year (001..366)
	          case 'U': // Week (00..53), where Sunday is the first day of the week
	          case 'u': // Week (00..53), where Monday is the first day of the week
	          case 'V': // Week (01..53), where Sunday is the first day of the week; used with %X
	          case 'v': // Week (01..53), where Monday is the first day of the week; used with %x
	          case 'X': // Year for the week where Sunday is the first day of the week, numeric, four digits; used with %V
	          case 'x': // Year for the week, where Monday is the first day of the week, numeric, four digits; used with %v
	            throw '%'+ch+' not implemented by AnyTime.Converter';
	          default: // for any character not listed above
	            str += this.fmt.substr(f,2);
	        } // switch ( this.fmt.charAt(f+1) )
	        f++;
	      } // else
	    } // for ( var f = 0 ; f < _flen ; f++ )
	    return str;

	}; // AnyTime.Converter.format()

	//-------------------------------------------------------------------------
	//  AnyTime.Converter.getUtcParseOffsetCaptured() returns the UTC offset
	//  last captured by a parsed string (or assumed by utcParseOffsetAssumed).
	//  It returns Number.MIN_VALUE if this object was not constructed with
	//  the utcParseOffsetCapture option set to true, or if an offset was not
	//  specified by the last parsed string or utcParseOffsetAssumed.
	//-------------------------------------------------------------------------

	this.getUtcParseOffsetCaptured = function()
	{
	    return _offCap;
	};

	//-------------------------------------------------------------------------
	//  AnyTime.Converter.getUtcParseOffsetCaptured() returns the UTC offset
	//  last captured by a parsed string (or assumed by utcParseOffsetAssumed).
	//  It returns Number.MIN_VALUE if this object was not constructed with
	//  the utcParseOffsetCapture option set to true, or if an offset was not
	//  specified by the last parsed string or utcParseOffsetAssumed.
	//-------------------------------------------------------------------------

	this.getUtcParseOffsetSubIndex = function()
	{
	    return _offPSI;
	};

	//-------------------------------------------------------------------------
	//  AnyTime.Converter.parse() returns a Date initialized from a specified
	//  string, using the format passed to AnyTime.Converter().
	//
	//  Method parameter:
	//
	//    str - the String object to be converted
	//-------------------------------------------------------------------------

	this.parse = function( str )
	{
		_offCap = _offP;
		_offPSI = (-1);
	    var era = 1;
      var time = new Date(4,0,1,0,0,0,0);//4=leap year bug
	    var slen = str.length;
	    var s = 0;
	    var tzSign = 1, tzOff = _offP;
	    var i, matched, sub, sublen, temp;
	    for ( var f = 0 ; f < _flen ; f++ )
	    {
	      if ( this.fmt.charAt(f) == '%' )
	      {
			var ch = this.fmt.charAt(f+1);
	        switch ( ch )
	        {
	          case 'a': // Abbreviated weekday name (Sun..Sat)
	            matched = false;
	            for ( sublen = 0 ; s + sublen < slen ; sublen++ )
	            {
	              sub = str.substr(s,sublen);
	              for ( i = 0 ; i < 12 ; i++ )
	                if ( this.dAbbr[i] == sub )
	                {
	                  matched = true;
	                  s += sublen;
	                  break;
	                }
	              if ( matched )
	                break;
	            } // for ( sublen ... )
	            if ( ! matched )
	              throw 'unknown weekday: '+str.substr(s);
	            break;
	          case 'B': // BCE string (eAbbr[0]), only if needed. (NON-MYSQL)
	            sublen = this.eAbbr[0].length;
	            if ( ( s + sublen <= slen ) && ( str.substr(s,sublen) == this.eAbbr[0] ) )
	            {
	              era = (-1);
	              s += sublen;
	            }
	            break;
	          case 'b': // Abbreviated month name (Jan..Dec)
	            matched = false;
	            for ( sublen = 0 ; s + sublen < slen ; sublen++ )
	            {
	              sub = str.substr(s,sublen);
	              for ( i = 0 ; i < 12 ; i++ )
	                if ( this.mAbbr[i] == sub )
	                {
	                  time.setMonth( i );
	                  matched = true;
	                  s += sublen;
	                  break;
	                }
	              if ( matched )
	                break;
	            } // for ( sublen ... )
	            if ( ! matched )
	              throw 'unknown month: '+str.substr(s);
	            break;
	          case 'C': // CE string (eAbbr[1]), only if needed. (NON-MYSQL)
	            sublen = this.eAbbr[1].length;
	            if ( ( s + sublen <= slen ) && ( str.substr(s,sublen) == this.eAbbr[1] ) )
	              s += sublen; // note: CE is the default era
	            break;
	          case 'c': // Month, numeric (0..12)
	            if ( ( s+1 < slen ) && this.dAt(str,s+1) )
	            {
	              time.setMonth( (Number(str.substr(s,2))-1)%12 );
	              s += 2;
	            }
	            else
	            {
	              time.setMonth( (Number(str.substr(s,1))-1)%12 );
	              s++;
	            }
	            break;
	          case 'D': // Day of the month with English suffix (0th,1st,...)
	            if ( ( s+1 < slen ) && this.dAt(str,s+1) )
	            {
	              time.setDate( Number(str.substr(s,2)) );
	              s += 4;
	            }
	            else
	            {
	              time.setDate( Number(str.substr(s,1)) );
	              s += 3;
	            }
	            break;
	          case 'd': // Day of the month, numeric (00..31)
	            time.setDate( Number(str.substr(s,2)) );
	            s += 2;
	            break;
	          case 'E': // era string (from eAbbr[]) (NON-MYSQL)
	            sublen = this.eAbbr[0].length;
	            if ( ( s + sublen <= slen ) && ( str.substr(s,sublen) == this.eAbbr[0] ) )
	            {
	              era = (-1);
	              s += sublen;
	            }
	            else if ( ( s + ( sublen = this.eAbbr[1].length ) <= slen ) && ( str.substr(s,sublen) == this.eAbbr[1] ) )
	              s += sublen; // note: CE is the default era
	            else
	              throw 'unknown era: '+str.substr(s);
	            break;
	          case 'e': // Day of the month, numeric (0..31)
	            if ( ( s+1 < slen ) && this.dAt(str,s+1) )
	            {
	              time.setDate( Number(str.substr(s,2)) );
	              s += 2;
	            }
	            else
	            {
	              time.setDate( Number(str.substr(s,1)) );
	              s++;
	            }
	            break;
	          case 'f': // Microseconds (000000..999999)
	            s += 6; // SKIPPED!
	            break;
	          case 'H': // Hour (00..23)
	            time.setHours( Number(str.substr(s,2)) );
	            s += 2;
	            break;
	          case 'h': // Hour (01..12)
	          case 'I': // Hour (01..12)
	            time.setHours( Number(str.substr(s,2)) );
	            s += 2;
	            break;
	          case 'i': // Minutes, numeric (00..59)
	            time.setMinutes( Number(str.substr(s,2)) );
	            s += 2;
	            break;
	          case 'k': // Hour (0..23)
	            if ( ( s+1 < slen ) && this.dAt(str,s+1) )
	            {
	              time.setHours( Number(str.substr(s,2)) );
	              s += 2;
	            }
	            else
	            {
	              time.setHours( Number(str.substr(s,1)) );
	              s++;
	            }
	            break;
	          case 'l': // Hour (1..12)
	            if ( ( s+1 < slen ) && this.dAt(str,s+1) )
	            {
	              time.setHours( Number(str.substr(s,2)) );
	              s += 2;
	            }
	            else
	            {
	              time.setHours( Number(str.substr(s,1)) );
	              s++;
	            }
	            break;
	          case 'M': // Month name (January..December)
	            matched = false;
	            for (sublen=_shortMon ; s + sublen <= slen ; sublen++ )
	            {
	              if ( sublen > _longMon )
	                break;
	              sub = str.substr(s,sublen);
	              for ( i = 0 ; i < 12 ; i++ )
	              {
	                if ( this.mNames[i] == sub )
	                {
	                  time.setMonth( i );
	                  matched = true;
	                  s += sublen;
	                  break;
	                }
	              }
	              if ( matched )
	                break;
	            }
	            break;
	          case 'm': // Month, numeric (00..12)
	            time.setMonth( (Number(str.substr(s,2))-1)%12 );
	            s += 2;
	            break;
	          case 'p': // AM or PM
              if ( time.getHours() == 12 )
              {
	              if ( str.charAt(s) == 'A' )
	                time.setHours(0);
              }
              else if ( str.charAt(s) == 'P' )
	              time.setHours( time.getHours() + 12 );
	            s += 2;
	            break;
	          case 'r': // Time, 12-hour (hh:mm:ss followed by AM or PM)
	            time.setHours(Number(str.substr(s,2)));
	            time.setMinutes(Number(str.substr(s+3,2)));
	            time.setSeconds(Number(str.substr(s+6,2)));
              if ( time.getHours() == 12 )
              {
	              if ( str.charAt(s+8) == 'A' )
	                time.setHours(0);
              }
              else if ( str.charAt(s+8) == 'P' )
	              time.setHours( time.getHours() + 12 );
	            s += 10;
	            break;
	          case 'S': // Seconds (00..59)
	          case 's': // Seconds (00..59)
	            time.setSeconds(Number(str.substr(s,2)));
	            s += 2;
	            break;
	          case 'T': // Time, 24-hour (hh:mm:ss)
	            time.setHours(Number(str.substr(s,2)));
	            time.setMinutes(Number(str.substr(s+3,2)));
	            time.setSeconds(Number(str.substr(s+6,2)));
	            s += 8;
	            break;
	          case 'W': // Weekday name (Sunday..Saturday)
	            matched = false;
	            for (sublen=_shortDay ; s + sublen <= slen ; sublen++ )
	            {
	              if ( sublen > _longDay )
	                break;
	              sub = str.substr(s,sublen);
	              for ( i = 0 ; i < 7 ; i++ )
	              {
	                if ( this.dNames[i] == sub )
	                {
	                  matched = true;
	                  s += sublen;
	                  break;
	                }
	              }
	              if ( matched )
	                break;
	            }
	            break;
            case 'w': // Day of the week (0=Sunday..6=Saturday) (ignored)
              s += 1;
              break;
	          case 'Y': // Year, numeric, four digits, negative if before 0001
	            i = 4;
	            if ( str.substr(s,1) == '-' )
	              i++;
	            time.setFullYear(Number(str.substr(s,i)));
	            s += i;
	            break;
	          case 'y': // Year, numeric (two digits), negative before baseYear
	            i = 2;
	            if ( str.substr(s,1) == '-' )
	              i++;
	            temp = Number(str.substr(s,i));
	            if ( typeof(this.baseYear) == 'number' )
	            	temp += this.baseYear;
	            else if ( temp < 70 )
	            	temp += 2000;
	            else
	            	temp += 1900;
	            time.setFullYear(temp);
	            s += i;
	            break;
	          case 'Z': // Year, numeric, four digits, unsigned (NON-MYSQL)
	            time.setFullYear(Number(str.substr(s,4)));
	            s += 4;
	            break;
	          case 'z': // Year, numeric, variable length, unsigned (NON-MYSQL)
	            i = 0;
	            while ( ( s < slen ) && this.dAt(str,s) )
	              i = ( i * 10 ) + Number(str.charAt(s++));
	            time.setFullYear(i);
	            break;
	          case '#': // signed timezone offset in minutes.
	            if ( str.charAt(s++) == '-' )
	            	tzSign = (-1);
	            for ( tzOff = 0 ; ( s < slen ) && (String(i=Number(str.charAt(s)))==str.charAt(s)) ; s++ )
	            	tzOff = ( tzOff * 10 ) + i;
	            tzOff *= tzSign;
	            break;
	          case '@': // timezone label
	        	_offPSI = (-1);
	        	if ( AnyTime.utcLabel )
	        	{
		            matched = false;
		            for ( tzOff in AnyTime.utcLabel )
                  if ( ! Array.prototype[tzOff] ) // prototype.js compatibility issue
		              {
		            	  for ( i = 0 ; i < AnyTime.utcLabel[tzOff].length ; i++ )
  		            	{
	  	            		sub = AnyTime.utcLabel[tzOff][i];
		              		sublen = sub.length;
		              		if ( ( s+sublen <= slen ) && ( str.substr(s,sublen) == sub ) )
		              		{
                        s+=sublen;
		              			matched = true;
		              			break;
		              		}
		              	}
	            		  if ( matched )
	            			  break;
		              }
		            if ( matched )
		            {
		            	_offPSI = i;
		            	tzOff = Number(tzOff);
		            	break; // case
		            }
	        	}
	        	if ( ( s+9 < slen ) || ( str.substr(s,3) != "UTC" ) )
                    throw 'unknown time zone: '+str.substr(s);
	        	s += 3;
	            ch = ':'; // drop through for offset parsing
	          case '-': // signed, 3-or-4-digit timezone offset in hours and minutes
	          case '+': // signed, 4-digit timezone offset in hours and minutes
	          case ':': // signed 4-digit timezone offset with colon delimiter
	          case ';': // signed 3-or-4-digit timezone offset with colon delimiter
	            if ( str.charAt(s++) == '-' )
	            	tzSign = (-1);
	            tzOff = Number(str.charAt(s));
	            if ( (ch=='+')||(ch==':')||((s+3<slen)&&(String(Number(str.charAt(s+3)))!==str.charAt(s+3))) )
	            	tzOff = (tzOff*10) + Number(str.charAt(++s));
                tzOff *= 60;
	        	if ( (ch==':') || (ch==';') )
	        		s++; // skip ":" (assumed)
	        	tzOff = ( tzOff + Number(str.substr(++s,2)) ) * tzSign;
	        	s += 2;
		        break;
	          case 'j': // Day of year (001..366)
	          case 'U': // Week (00..53), where Sunday is the first day of the week
	          case 'u': // Week (00..53), where Monday is the first day of the week
	          case 'V': // Week (01..53), where Sunday is the first day of the week; used with %X
	          case 'v': // Week (01..53), where Monday is the first day of the week; used with %x
	          case 'X': // Year for the week where Sunday is the first day of the week, numeric, four digits; used with %V
	          case 'x': // Year for the week, where Monday is the first day of the week, numeric, four digits; used with %v
	            throw '%'+this.fmt.charAt(f+1)+' not implemented by AnyTime.Converter';
	          case '%': // A literal '%' character
	          default: // for any character not listed above
		        throw '%'+this.fmt.charAt(f+1)+' reserved for future use';
	            break;
	        }
	        f++;
	      } // if ( this.fmt.charAt(f) == '%' )
	      else if ( this.fmt.charAt(f) != str.charAt(s) )
	        throw str + ' is not in "' + this.fmt + '" format';
	      else
	        s++;
	    } // for ( var f ... )
	    if ( era < 0 )
	      time.setFullYear( 0 - time.getFullYear() );
		if ( tzOff != Number.MIN_VALUE )
		{
	       if ( _captureOffset )
	    	 _offCap = tzOff;
	       else
	    	 time.setTime( ( time.getTime() - (tzOff*60000) ) - (time.getTimezoneOffset()*60000) );
		}

	    return time;

	}; // AnyTime.Converter.parse()

	//-------------------------------------------------------------------------
	//  AnyTime.Converter.setUtcFormatOffsetAlleged()  sets the offset from
    //  UTC, in minutes, to claim that a Date object represents during
	//  formatting, even though it is formatted using local time.  This merely
	//  reports the alleged offset when a timezone specifier (%#, %+, %-, %:,
	//  %; or %@) is encountered in the format string--it does not otherwise
	//  affect the date/time value.  This primarily exists so AnyTime.picker
	//  can edit the time as specified (without conversion to local time) and
	//  then convert the edited time to a different time zone (as selected
	//  using the picker).  This method returns the previous value, if any,
	//  set by the utcFormatOffsetAlleged option, or a previous call to
	//  setUtcFormatOffsetAlleged(), or Number.MIN_VALUE if no offset was
	//  previously-alleged.  Call this method with Number.MIN_VALUE to cancel
	//  any prior value.  Note that if a format offset is alleged, any offset
	//  specified by option utcFormatOffsetImposed is ignored.
	//-------------------------------------------------------------------------

	this.setUtcFormatOffsetAlleged = function( offset )
	{
		var prev = _offAl;
	    _offAl = offset;
	    return prev;
	};

	//-------------------------------------------------------------------------
	//  AnyTime.Converter.setUtcFormatOffsetSubIndex() sets the sub-index
	//  to choose from the AnyTime.utcLabel array of arrays when formatting
	//  a Date using the %@ specifier.  For more information, see option
	//  AnyTime.Converter.utcFormatOffsetSubIndex.  This primarily exists so
	//  AnyTime.picker can specify the Time Zone label selected using the
	//  picker).  This method returns the previous value, if any, set by the
	//  utcFormatOffsetSubIndex option, or a previous call to
	//  setUtcFormatOffsetAlleged(), or (-1) if no sub-index was previously-
	//  chosen.  Call this method with (-1) to cancel any prior value.
	//-------------------------------------------------------------------------

	this.setUtcFormatOffsetSubIndex = function( subIndex )
	{
		var prev = _offFSI;
	    _offFSI = subIndex;
	    return prev;
	};

	//-------------------------------------------------------------------------
	//	AnyTime.Converter construction code:
	//-------------------------------------------------------------------------

	(function(_this)
	{
      var i, len;

		options = jQuery.extend(true,{},options||{});

	  	if ( options.baseYear )
			_this.baseYear = Number(options.baseYear);

	  	if ( options.format )
			_this.fmt = options.format;

	  	_flen = _this.fmt.length;

	  	if ( options.dayAbbreviations )
	  		_this.dAbbr = $.makeArray( options.dayAbbreviations );

	  	if ( options.dayNames )
	  	{
	  		_this.dNames = $.makeArray( options.dayNames );
	  		_longDay = 1;
	  		_shortDay = 1000;
	  		for ( i = 0 ; i < 7 ; i++ )
	  		{
          len = _this.dNames[i].length;
				if ( len > _longDay )
					_longDay = len;
				if ( len < _shortDay )
					_shortDay = len;
	  		}
	  	}

	  	if ( options.eraAbbreviations )
	  		_this.eAbbr = $.makeArray(options.eraAbbreviations);

	  	if ( options.monthAbbreviations )
	  		_this.mAbbr = $.makeArray(options.monthAbbreviations);

	  	if ( options.monthNames )
	  	{
	  		_this.mNames = $.makeArray( options.monthNames );
	  		_longMon = 1;
	  		_shortMon = 1000;
	  		for ( i = 0 ; i < 12 ; i++ )
	  		{
	  			len = _this.mNames[i].length;
	  			if ( len > _longMon )
					_longMon = len;
	  			if ( len < _shortMon )
	  				_shortMon = len;
	  		}
	  	}

	  	if ( typeof options.utcFormatOffsetImposed != "undefined" )
	  		_offF = options.utcFormatOffsetImposed;

	  	if ( typeof options.utcParseOffsetAssumed != "undefined" )
	  		_offP = options.utcParseOffsetAssumed;

	  	if ( options.utcParseOffsetCapture )
	  		_captureOffset = true;

	})(this); // AnyTime.Converter construction

}; // AnyTime.Converter =

//=============================================================================
//  AnyTime.noPicker()
//
//  Removes the date/time entry picker attached to a specified text field.
//=============================================================================

AnyTime.noPicker = function( id )
{
	if ( __pickers[id] )
	{
		__pickers[id].cleanup();
		delete __pickers[id];
	}
};

//=============================================================================
//  AnyTime.picker()
//
//  Creates a date/time entry picker attached to a specified text field.
//  Instead of entering a date and/or time into the text field, the user
//  selects legal combinations using the picker, and the field is auto-
//  matically populated.  The picker can be incorporated into the page
//	"inline", or used as a "popup" that appears when the text field is
//  clicked and disappears when the picker is dismissed. Ajax can be used
//  to send the selected value to a server to approve or veto it.
//
//  To create a picker, simply include the necessary files in an HTML page
//  and call the function for each date/time input field.  The following
//  example creates a popup picker for field "foo" using the default
//  format, and a second date-only (no time) inline (always-visible)
//  Ajax-enabled picker for field "bar":
//
//    <link rel="stylesheet" type="text/css" href="anytime.css" />
//    <script type="text/javascript" src="jquery.js"></script>
//    <script type="text/javascript" src="anytime.js"></script>
//    <input type="text" id="foo" tabindex="1" value="1967-07-30 23:45" />
//    <input type="text" id="bar" tabindex="2" value="01/06/90" />
//    <script type="text/javascript">
//      AnyTime.picker( "foo" );
//      AnyTime.picker( "bar", { placement:"inline", format: "%m/%d/%y",
//								ajaxOptions { url: "/some/server/page/" } } );
//    </script>
//
//  The appearance of the picker can be extensively modified using CSS styles.
//  A default appearance can be achieved by the "anytime.css" stylesheet that
//  accompanies this script.
//
//  Method parameters:
//
//  id - the "id" attribute of the textfield to associate with the
//    AnyTime.picker object.  The AnyTime.picker will attach itself
//    to the textfield and manage its value.
//
//  options - an object (associative array) of optional parameters that
//    override default behaviors.  The supported options are:
//
//    ajaxOptions - options passed to jQuery's $.ajax() method whenever
//      the user dismisses a popup picker or selects a value in an inline
//      picker.  The input's name (or ID) and value are passed to the
//      server (appended to ajaxOptions.data, if present), and the
//      "success" handler sets the input's value to the responseText.
//      Therefore, the text returned by the server must be valid for the
//      input'sdate/time format, and the server can approve or veto the
//      value chosen by the user. For more information, see:
//      http://docs.jquery.com/Ajax.
//      If ajaxOptions.success is specified, it is used instead of the
//      default "success" behavior.
//
//    askEra - if true, buttons to select the era are shown on the year
//        selector popup, even if format specifier does not include the
//        era.  If false, buttons to select the era are NOT shown, even
//        if the format specifier includes ther era.  Normally, era buttons
//        are only shown if the format string specifies the era.
//
//    askSecond - if false, buttons for number-of-seconds are not shown
//        even if the format includes seconds.  Normally, the buttons
//        are shown if the format string includes seconds.
//
//    earliest - String or Date object representing the earliest date/time
//        that a user can select.  For best results if the field is only
//        used to specify a date, be sure to set the time to 00:00:00.
//        If a String is used, it will be parsed according to the picker's
//        format (see AnyTime.Converter.format()).
//
//    firstDOW - a value from 0 (Sunday) to 6 (Saturday) stating which
//      day should appear at the beginning of the week.  The default is 0
//      (Sunday).  The most common substitution is 1 (Monday).  Note that
//      if custom arrays are specified for AnyTime.Converter's dayAbbreviations
//      and/or dayNames options, they should nonetheless begin with the
//      value for Sunday.
//
//    hideInput - if true, the <input> is "hidden" (the picker appears in
//      its place). This actually sets the border, height, margin, padding
//      and width of the field as small as possivle, so it can still get focus.
//      If you try to hide the field using traditional techniques (such as
//      setting "display:none"), the picker will not behave correctly.
//
//    labelDayOfMonth - the label for the day-of-month "buttons".
//      Can be any HTML!  If not specified, "Day of Month" is assumed.
//
//    labelDismiss - the label for the dismiss "button" (if placement is
//      "popup"). Can be any HTML!  If not specified, "X" is assumed.
//
//    labelHour - the label for the hour "buttons".
//      Can be any HTML!  If not specified, "Hour" is assumed.
//
//    labelMinute - the label for the minute "buttons".
//      Can be any HTML!  If not specified, "Minute" is assumed.
//
//    labelMonth - the label for the month "buttons".
//      Can be any HTML!  If not specified, "Month" is assumed.
//
//    labelTimeZone - the label for the UTC offset (timezone) "buttons".
//      Can be any HTML!  If not specified, "Time Zone" is assumed.
//
//    labelSecond - the label for the second "buttons".
//      Can be any HTML!  If not specified, "Second" is assumed.
//      This option is ignored if askSecond is false!
//
//    labelTitle - the label for the "title bar".  Can be any HTML!
//      If not specified, then whichever of the following is most
//      appropriate is used:  "Select a Date and Time", "Select a Date"
//      or "Select a Time", or no label if only one field is present.
//
//    labelYear - the label for the year "buttons".
//      Can be any HTML!  If not specified, "Year" is assumed.
//
//    latest - String or Date object representing the latest date/time
//        that a user can select.  For best results if the field is only
//        used to specify a date, be sure to set the time to 23:59:59.
//        If a String is used, it will be parsed according to the picker's
//        format (see AnyTime.Converter.format()).
//
//    placement - One of the following strings:
//
//      "popup" = the picker appears above its <input> when the input
//        receives focus, and disappears when it is dismissed.  This is
//        the default behavior.
//
//      "inline" = the picker is placed immediately after the <input>
//        and remains visible at all times.  When choosing this placement,
//        it is best to make the <input> invisible and use only the
//        picker to select dates.  The <input> value can still be used
//        during form submission as it will always reflect the current
//        picker state.
//
//        WARNING: when using "inline" and XHTML and including a day-of-
//        the-month format field, the input may only appear where a <table>
//        element is permitted (for example, NOT within a <p> element).
//        This is because the picker uses a <table> element to arrange
//        the day-of-the-month (calendar) buttons.  Failure to follow this
//        advice may result in an "unknown error" in Internet Explorer.
//
//    The following additional options may be specified; see documentation
//    for AnyTime.Converter (above) for information about these options:
//
//      baseYear
//      dayAbbreviations
//      dayNames
//      eraAbbreviations
//      format
//      monthAbbreviations
//      monthNames
//
//  Other behavior, such as how to format the values on the display
//  and which "buttons" to include, is inferred from the format string.
//=============================================================================

AnyTime.picker = function( id, options )
{
	//  Create a new private object instance to manage the picker,
	//  if one does not already exist.

    if ( __pickers[id] )
    	throw 'Cannot create another AnyTime.picker for "'+id+'"';

	var _this = null;

	__pickers[id] =
	{
		//  private members

		twelveHr: false,
		ajaxOpts: null,		// options for AJAX requests
		denyTab: true,      // set to true to stop Opera from tabbing away
		askEra: false,		// prompt the user for the era in yDiv?
		cloak: null,		// cloak div
		conv: null,			// AnyTime.Converter
		div: null,			// picker div
	  	dB: null,			// body div
	  	dD: null,			// date div
	  	dY: null,			// years div
	  	dMo: null,			// months div
	  	dDoM: null,			// date-of-month table
	  	hDoM: null,			// date-of-month heading
	  	hMo: null,			// month heading
	  	hTitle: null,		// title heading
	  	hY: null,			// year heading
	  	dT: null,			// time div
	  	dH: null,			// hours div
	  	dM: null,			// minutes div
	  	dS: null,			// seconds div
	  	dO: null,           // offset (time zone) div
		earliest: null,		// earliest selectable date/time
		fBtn: null,			// button with current focus
		fDOW: 0,			// index to use as first day-of-week
	    hBlur: null,        // input handler
	    hClick: null,       // input handler
	    hFocus: null,       // input handler
	    hKeydown: null,     // input handler
	    hKeypress: null,    // input handler
	    hResize: null,      // event handler
		id: null,			// picker ID
		inp: null,			// input text field
		latest: null,		// latest selectable date/time
		lastAjax: null,		// last value submitted using AJAX
		lostFocus: false,	// when focus is lost, must redraw
		lX: 'X',			// label for dismiss button
		lY: 'Year',			// label for year
		lO: 'Time Zone',    // label for UTC offset (time zone)
		oBody: null,        // UTC offset selector popup
		oConv: null,        // AnyTime.Converter for offset display
		oCur: null,         // current-UTC-offset button
		oDiv: null,			// UTC offset selector popup
		oLab: null,			// UTC offset label
		oList: null,       // UTC offset container
		oSel: null,         // select (plus/minus) UTC-offset button
		offMin: Number.MIN_VALUE, // current UTC offset in minutes
		offSI: -1,          // current UTC label sub-index (if any)
		offStr: "",         // current UTC offset (time zone) string
		pop: true,			// picker is a popup?
		ro: false,      // was input readonly before picker initialized?
		time: null,			// current date/time
		url: null,			// URL to submit value using AJAX
		yAhead: null,		// years-ahead button
		y0XXX: null,		// millenium-digit-zero button (for focus)
		yCur: null,			// current-year button
		yDiv: null,			// year selector popup
		yLab: null,			// year label
		yNext: null,		// next-year button
		yPast: null,		// years-past button
		yPrior: null,		// prior-year button

		//---------------------------------------------------------------------
		//  .initialize() initializes the picker instance.
		//---------------------------------------------------------------------

		initialize: function( id )
		{
			_this = this;

      this.id = 'AnyTime--'+id.replace(/[^-_.A-Za-z0-9]/g,'--AnyTime--');

			options = jQuery.extend(true,{},options||{});
		  	options.utcParseOffsetCapture = true;
		  	this.conv = new AnyTime.Converter(options);

		  	if ( options.placement )
		  	{
		  		if ( options.placement == 'inline' )
		  			this.pop = false;
		  		else if ( options.placement != 'popup' )
		  			throw 'unknown placement: ' + options.placement;
		  	}

		  	if ( options.ajaxOptions )
		  	{
		  		this.ajaxOpts = jQuery.extend( {}, options.ajaxOptions );
		        if ( ! this.ajaxOpts.success )
		        	this.ajaxOpts.success = function(data,status) { _this.updVal(data); };
		  	}

		  	if ( options.earliest )
          this.earliest = this.makeDate( options.earliest );

		  	if ( options.firstDOW )
		  	{
		  		if ( ( options.firstDOW < 0 ) || ( options.firstDOW > 6 ) )
		  			throw 'illegal firstDOW: ' + options.firstDOW;
		  		this.fDOW = options.firstDOW;
		  	}

		  	if ( options.latest )
		  		this.latest = this.makeDate( options.latest );

		  	this.lX = options.labelDismiss || 'X';
		  	this.lY = options.labelYear || 'Year';
		  	this.lO = options.labelTimeZone || 'Time Zone';

		  	//  Infer what we can about what to display from the format.

		  	var i;
		  	var t;
		  	var lab;
		  	var shownFields = 0;
		  	var format = this.conv.fmt;

		  	if ( typeof options.askEra != 'undefined' )
		  		this.askEra = options.askEra;
		  	else
		  		this.askEra = (format.indexOf('%B')>=0) || (format.indexOf('%C')>=0) || (format.indexOf('%E')>=0);
		  	var askYear = (format.indexOf('%Y')>=0) || (format.indexOf('%y')>=0) || (format.indexOf('%Z')>=0) || (format.indexOf('%z')>=0);
		  	var askMonth = (format.indexOf('%b')>=0) || (format.indexOf('%c')>=0) || (format.indexOf('%M')>=0) || (format.indexOf('%m')>=0);
		  	var askDoM = (format.indexOf('%D')>=0) || (format.indexOf('%d')>=0) || (format.indexOf('%e')>=0);
		  	var askDate = askYear || askMonth || askDoM;
		  	this.twelveHr = (format.indexOf('%h')>=0) || (format.indexOf('%I')>=0) || (format.indexOf('%l')>=0) || (format.indexOf('%r')>=0);
		  	var askHour = this.twelveHr || (format.indexOf('%H')>=0) || (format.indexOf('%k')>=0) || (format.indexOf('%T')>=0);
		  	var askMinute = (format.indexOf('%i')>=0) || (format.indexOf('%r')>=0) || (format.indexOf('%T')>=0);
		  	var askSec = ( (format.indexOf('%r')>=0) || (format.indexOf('%S')>=0) || (format.indexOf('%s')>=0) || (format.indexOf('%T')>=0) );
		  	if ( askSec && ( typeof options.askSecond != 'undefined' ) )
		  		askSec = options.askSecond;
		  	var askOff = ( (format.indexOf('%#')>=0) || (format.indexOf('%+')>=0) || (format.indexOf('%-')>=0) || (format.indexOf('%:')>=0) || (format.indexOf('%;')>=0) || (format.indexOf('%<')>=0) || (format.indexOf('%>')>=0) || (format.indexOf('%@')>=0) );
		  	var askTime = askHour || askMinute || askSec || askOff;

		  	if ( askOff )
			  	this.oConv = new AnyTime.Converter( { format: options.formatUtcOffset ||
			  		format.match(/\S*%[-+:;<>#@]\S*/g).join(' ') } );

		  	//  Create the picker HTML and add it to the page.
		  	//  Popup pickers will be moved to the end of the body
		  	//  once the entire page has loaded.

        this.inp = $(document.getElementById(id)); // avoids ID-vs-pseudo-selector probs like id="foo:bar"
        this.ro = this.inp.prop('readonly');
        this.inp.prop('readonly',true);
		  	this.div = $( '<div class="AnyTime-win AnyTime-pkr ui-widget ui-widget-content ui-corner-all" id="' + this.id + '" aria-live="off"></div>' );
		    this.inp.after(this.div);
		  	this.hTitle = $( '<h5 class="AnyTime-hdr ui-widget-header ui-corner-top"/>' );
		  	this.div.append( this.hTitle );
		  	this.dB = $( '<div class="AnyTime-body"></div>' );
		  	this.div.append( this.dB );

		  	if ( options.hideInput )
		        this.inp.css({border:0,height:'1px',margin:0,padding:0,width:'1px'});

		  	//  Add dismiss box to title (if popup)

		  	t = null;
		  	var xDiv = null;
		  	if ( this.pop )
		  	{
		  		xDiv = $( '<div class="AnyTime-x-btn ui-state-default">'+this.lX+'</div>' );
		  		this.hTitle.append( xDiv );
		  		xDiv.click(function(e){_this.dismiss(e);});
		  	}

		  	//  date (calendar) portion

		  	lab = '';
		  	if ( askDate )
		  	{
          this.dD = $( '<div class="AnyTime-date"></div>' );
          this.dB.append( this.dD );

		      if ( askYear )
		      {
		    	  this.yLab = $('<h6 class="AnyTime-lbl AnyTime-lbl-yr">' + this.lY + '</h6>');
		    	  this.dD.append( this.yLab );

		          this.dY = $( '<ul class="AnyTime-yrs ui-helper-reset" />' );
		          this.dD.append( this.dY );

		          this.yPast = this.btn(this.dY,'&lt;',this.newYear,['yrs-past'],'- '+this.lY);
		          this.yPrior = this.btn(this.dY,'1',this.newYear,['yr-prior'],'-1 '+this.lY);
		          this.yCur = this.btn(this.dY,'2',this.newYear,['yr-cur'],this.lY);
		          this.yCur.removeClass('ui-state-default');
		          this.yCur.addClass('AnyTime-cur-btn ui-state-default ui-state-highlight');

		          this.yNext = this.btn(this.dY,'3',this.newYear,['yr-next'],'+1 '+this.lY);
		          this.yAhead = this.btn(this.dY,'&gt;',this.newYear,['yrs-ahead'],'+ '+this.lY);

		          shownFields++;

		      } // if ( askYear )

		      if ( askMonth )
		      {
		    	  lab = options.labelMonth || 'Month';
		    	  this.hMo = $( '<h6 class="AnyTime-lbl AnyTime-lbl-month">' + lab + '</h6>' );
		    	  this.dD.append( this.hMo );
		    	  this.dMo = $('<ul class="AnyTime-mons" />');
		    	  this.dD.append(this.dMo);
		    	  for ( i = 0 ; i < 12 ; i++ )
		    	  {
		    		  var mBtn = this.btn( this.dMo, this.conv.mAbbr[i],
			    			function( event )
			    			{
			    				var elem = $(event.target);
			    			    if ( elem.hasClass("AnyTime-out-btn") )
			    			    	return;
			    				var mo = event.target.AnyTime_month;
			    				var t = new Date(this.time.getTime());
			    				if ( t.getDate() > __daysIn[mo] )
			    					t.setDate(__daysIn[mo])
			    				t.setMonth(mo);
			    				this.set(t);
			    			    this.upd(elem);
			    			},
			    			['mon','mon'+String(i+1)], lab+' '+this.conv.mNames[i] );
		    		  mBtn[0].AnyTime_month = i;
		    	  }
		    	  shownFields++;
		      }

		      if ( askDoM )
		      {
		    	lab = options.labelDayOfMonth || 'Day of Month';
		        this.hDoM = $('<h6 class="AnyTime-lbl AnyTime-lbl-dom">' + lab + '</h6>' );
		      	this.dD.append( this.hDoM );
		        this.dDoM =  $( '<table border="0" cellpadding="0" cellspacing="0" class="AnyTime-dom-table"/>' );
		        this.dD.append( this.dDoM );
		        t = $( '<thead class="AnyTime-dom-head"/>' );
		        this.dDoM.append(t);
		        var tr = $( '<tr class="AnyTime-dow"/>' );
		        t.append(tr);
		        for ( i = 0 ; i < 7 ; i++ )
		          tr.append( '<th class="AnyTime-dow AnyTime-dow'+String(i+1)+'">'+this.conv.dAbbr[(this.fDOW+i)%7]+'</th>' );

		        var tbody = $( '<tbody class="AnyTime-dom-body" />' );
		        this.dDoM.append(tbody);
		        for ( var r = 0 ; r < 6 ; r++ )
		        {
		          tr = $( '<tr class="AnyTime-wk AnyTime-wk'+String(r+1)+'"/>' );
		          tbody.append(tr);
		          for ( i = 0 ; i < 7 ; i++ )
		        	  this.btn( tr, 'x',
		        		function( event )
		        		{
		        			var elem = $(event.target);
		        		    if ( elem.hasClass("AnyTime-out-btn") )
		        		    	return;
		        			var dom = Number(elem.html());
		        			if ( dom )
		        			{
		        				var t = new Date(this.time.getTime());
		        				t.setDate(dom);
		        				this.set(t);
		        				this.upd(elem);
		        			}
		        		},
		        		['dom'], lab );
		        }
		        shownFields++;

		      } // if ( askDoM )

		    } // if ( askDate )

		    //  time portion

		    if ( askTime )
		    {
          var tensDiv, onesDiv;

		      this.dT = $('<div class="AnyTime-time"></div>');
		      this.dB.append(this.dT);

		      if ( askHour )
		      {
		        this.dH = $('<div class="AnyTime-hrs"></div>');
		        this.dT.append(this.dH);

		        lab = options.labelHour || 'Hour';
		        this.dH.append( $('<h6 class="AnyTime-lbl AnyTime-lbl-hr">'+lab+'</h6>') );
		        var amDiv = $('<ul class="AnyTime-hrs-am"/>');
		        this.dH.append( amDiv );
		        var pmDiv = $('<ul class="AnyTime-hrs-pm"/>');
		        this.dH.append( pmDiv );

		        for ( i = 0 ; i < 12 ; i++ )
		        {
		          if ( this.twelveHr )
		          {
		            if ( i == 0 )
		              t = '12am';
		            else
		              t = String(i)+'am';
		          }
		          else
		            t = AnyTime.pad(i,2);

		          this.btn( amDiv, t, this.newHour,['hr','hr'+String(i)],lab+' '+t);

		          if ( this.twelveHr )
		          {
		            if ( i == 0 )
		              t = '12pm';
		            else
		              t = String(i)+'pm';
		          }
		          else
		            t = i+12;

		          this.btn( pmDiv, t, this.newHour,['hr','hr'+String(i+12)],lab+' '+t);
		        }

				shownFields++;

		      } // if ( askHour )

		      if ( askMinute )
		      {
		        this.dM = $('<div class="AnyTime-mins"></div>');
		        this.dT.append(this.dM);

		        lab = options.labelMinute || 'Minute';
		        this.dM.append( $('<h6 class="AnyTime-lbl AnyTime-lbl-min">'+lab+'</h6>') );
            tensDiv = $('<ul class="AnyTime-mins-tens"/>');
		        this.dM.append(tensDiv);

		        for ( i = 0 ; i < 6 ; i++ )
		          this.btn( tensDiv, i,
		        		  function( event )
		        		  {
		        		      var elem = $(event.target);
		        			  if ( elem.hasClass("AnyTime-out-btn") )
		        			    	return;
		        		      var t = new Date(this.time.getTime());
		        		      t.setMinutes( (Number(elem.text())*10) + (this.time.getMinutes()%10) );
		        		      this.set(t);
		        		      this.upd(elem);
		        		  },
		        		  ['min-ten','min'+i+'0'], lab+' '+i+'0' );
		        for ( ; i < 12 ; i++ )
			          this.btn( tensDiv, '&#160;', $.noop, ['min-ten','min'+i+'0'], lab+' '+i+'0' ).addClass('AnyTime-min-ten-btn-empty ui-state-default ui-state-disabled');

            onesDiv = $('<ul class="AnyTime-mins-ones"/>');
		        this.dM.append(onesDiv);
		        for ( i = 0 ; i < 10 ; i++ )
		          this.btn( onesDiv, i,
		    		  function( event )
		    		  {
		    		      var elem = $(event.target);
		    			  if ( elem.hasClass("AnyTime-out-btn") )
		    			    	return;
		    		      var t = new Date(this.time.getTime());
		    		      t.setMinutes( (Math.floor(this.time.getMinutes()/10)*10)+Number(elem.text()) );
		    		      this.set(t);
		    		      this.upd(elem);
		    		  },
		    		  ['min-one','min'+i], lab+' '+i );
		        for ( ; i < 12 ; i++ )
			          this.btn( onesDiv, '&#160;', $.noop, ['min-one','min'+i+'0'], lab+' '+i ).addClass('AnyTime-min-one-btn-empty ui-state-default ui-state-disabled');

				shownFields++;

		      } // if ( askMinute )

		      if ( askSec )
		      {
		        this.dS = $('<div class="AnyTime-secs"></div>');
		        this.dT.append(this.dS);
		        lab = options.labelSecond || 'Second';
		        this.dS.append( $('<h6 class="AnyTime-lbl AnyTime-lbl-sec">'+lab+'</h6>') );
            tensDiv = $('<ul class="AnyTime-secs-tens"/>');
		        this.dS.append(tensDiv);

		        for ( i = 0 ; i < 6 ; i++ )
		          this.btn( tensDiv, i,
		    		  function( event )
		    		  {
		    		      var elem = $(event.target);
		    			  if ( elem.hasClass("AnyTime-out-btn") )
		    			    	return;
		    		      var t = new Date(this.time.getTime());
		    		      t.setSeconds( (Number(elem.text())*10) + (this.time.getSeconds()%10) );
		    		      this.set(t);
		    		      this.upd(elem);
		    		  },
		    		  ['sec-ten','sec'+i+'0'], lab+' '+i+'0' );
		        for ( ; i < 12 ; i++ )
			          this.btn( tensDiv, '&#160;', $.noop, ['sec-ten','sec'+i+'0'], lab+' '+i+'0' ).addClass('AnyTime-sec-ten-btn-empty ui-state-default ui-state-disabled');

            onesDiv = $('<ul class="AnyTime-secs-ones"/>');
		        this.dS.append(onesDiv);
		        for ( i = 0 ; i < 10 ; i++ )
		          this.btn( onesDiv, i,
		    		  function( event )
		    		  {
		    		      var elem = $(event.target);
		    			  if ( elem.hasClass("AnyTime-out-btn") )
		    			    	return;
		    		      var t = new Date(this.time.getTime());
		    		      t.setSeconds( (Math.floor(this.time.getSeconds()/10)*10) + Number(elem.text()) );
		    		      this.set(t);
		    		      this.upd(elem);
		    		  },
		    		  ['sec-one','sec'+i], lab+' '+i );
		        for ( ; i < 12 ; i++ )
			          this.btn( onesDiv, '&#160;', $.noop, ['sec-one','sec'+i+'0'], lab+' '+i ).addClass('AnyTime-sec-one-btn-empty ui-state-default ui-state-disabled');

				shownFields++;

		      } // if ( askSec )

		      if ( askOff )
		      {
		    	this.dO = $('<div class="AnyTime-offs" ></div>');
          this.dT.append('<br />');
          this.dT.append(this.dO);

		    	this.oList = $('<ul class="AnyTime-off-list ui-helper-reset" />');
          this.dO.append(this.oList);

          this.oCur = this.btn(this.oList,'',this.newOffset,['off','off-cur'],lab);
          this.oCur.removeClass('ui-state-default');
          this.oCur.addClass('AnyTime-cur-btn ui-state-default ui-state-highlight');

			  	this.oSel = this.btn(this.oList,'&#177;',this.newOffset,['off','off-select'],'+/- '+this.lO);

			  	this.oMinW = this.dO.outerWidth(true);
		    	this.oLab = $('<h6 class="AnyTime-lbl AnyTime-lbl-off">' + this.lO + '</h6>');
		    	this.dO.prepend( this.oLab );

				shownFields++;
		      }

		    } // if ( askTime )

		    //  Set the title.  If a title option has been specified, use it.
		    //  Otherwise, determine a worthy title based on which (and how many)
		    //  format fields have been specified.

		    if ( options.labelTitle )
		      this.hTitle.append( options.labelTitle );
		    else if ( shownFields > 1 )
		      this.hTitle.append( 'Select a '+(askDate?(askTime?'Date and Time':'Date'):'Time') );
		    else
		      this.hTitle.append( 'Select' );


		    //  Initialize the picker's date/time value.

		    try
		    {
		      this.time = this.conv.parse(this.inp.val());
		      this.offMin = this.conv.getUtcParseOffsetCaptured();
		      this.offSI = this.conv.getUtcParseOffsetSubIndex();
		      if ( 'init' in options ) // override
            this.time = this.makeDate( options.init);
		    }
		    catch ( e )
		    {
		      this.time = new Date();
		    }
		    this.lastAjax = this.time;


		    //  If this is a popup picker, hide it until needed.

		    if ( this.pop )
		    {
		      this.div.hide();
		      this.div.css('position','absolute');
		    }

		    //  Setup event listeners for the input and resize listeners for
		    //  the picker.  Add the picker to the instances list (which is used
		    //  to hide pickers if the user clicks off of them).

		    this.inp.blur( this.hBlur =
		    	function(e)
		    	{
		    		_this.inpBlur(e);
		    	} );

		    this.inp.click( this.hClick =
		    	function(e)
		    	{
	    			_this.showPkr(e);
		    	} );

		    this.inp.focus( this.hFocus =
		    	function(e)
		    	{
		    		if ( _this.lostFocus )
		    			_this.showPkr(e);
		    		_this.lostFocus = false;
		    	} );

		    this.inp.keydown( this.hKeydown =
		    	function(e)
		    	{
		    		_this.key(e);
		    	} );

		    this.inp.keypress( this.hKeypress =
          function(e)
          {
//			    if ( $.browser.opera && _this.denyTab )
//			    	e.preventDefault();
          } );

		    this.div.click(
          function(e)
          {
            _this.lostFocus = false;
            _this.inp.focus();
          } );

		    $(window).resize( this.hResize =
		    	function(e)
		    	{
		    		_this.pos(e);
		    	} );

		    if ( __initialized )
		    	this.onReady();

		}, // initialize()


		//---------------------------------------------------------------------
		//  .ajax() notifies the server of a value change using Ajax.
		//---------------------------------------------------------------------

		ajax: function()
		{
		    if ( this.ajaxOpts && ( this.time.getTime() != this.lastAjax.getTime() ) )
		    {
		      try
		      {
		    	var opts = jQuery.extend( {}, this.ajaxOpts );
		        if ( typeof opts.data == 'object' )
		        	opts.data[this.inp[0].name||this.inp[0].id] = this.inp.val();
		        else
		        {
		        	var opt = (this.inp[0].name||this.inp[0].id) + '=' + encodeURI(this.inp.val());
		        	if ( opts.data )
		        		opts.data += '&' + opt;
		        	else
		        		opts.data = opt;
		        }
		        $.ajax( opts );
		        this.lastAjax = this.time;
		      }
		      catch( e )
		      {
		      }
		    }
		    return;

		}, // .ajax()

		//---------------------------------------------------------------------
		//  .askOffset() is called by this.newOffset() when the UTC offset or
		//  +- selection button is clicked.
		//---------------------------------------------------------------------

		askOffset: function( event )
		{
		    if ( ! this.oDiv )
		    {
		      this.makeCloak();

		      this.oDiv = $('<div class="AnyTime-win AnyTime-off-selector ui-widget ui-widget-content ui-corner-all"></div>');
		      this.div.append(this.oDiv);

		      // the order here (HDR,BODY,XDIV,TITLE) is important for width calcluation:
		      var title = $('<h5 class="AnyTime-hdr AnyTime-hdr-off-selector ui-widget-header ui-corner-top" />');
		      this.oDiv.append( title );
		      this.oBody = $('<div class="AnyTime-body AnyTime-body-off-selector"></div>');
		      this.oDiv.append( this.oBody );

		      var xDiv = $('<div class="AnyTime-x-btn ui-state-default">'+this.lX+'</div>');
		      title.append(xDiv);
		      xDiv.click(function(e){_this.dismissODiv(e);});
		      title.append( this.lO );

		      var cont = $('<ul class="AnyTime-off-off" />' );
		      var last = null;
		      this.oBody.append(cont);
		      var useSubIndex = (this.oConv.fmt.indexOf('%@')>=0);
		      if ( AnyTime.utcLabel )
			      for ( var o = -720 ; o <= 840 ; o++ )
			    	  if ( AnyTime.utcLabel[o] )
			    	  {
				        this.oConv.setUtcFormatOffsetAlleged(o);
				        for ( var i = 0; i < AnyTime.utcLabel[o].length; i++ )
				        {
				          this.oConv.setUtcFormatOffsetSubIndex(i);
				          last = this.btn( cont, this.oConv.format(this.time), this.newOPos, ['off-off'], o );
				          last[0].AnyTime_offMin = o;
				          last[0].AnyTime_offSI = i;
				          if ( ! useSubIndex )
				        	  break; // for
				        }
			    	  }

		      if ( last )
		    	  last.addClass('AnyTime-off-off-last-btn');

          if ( this.oDiv.outerHeight(true) > this.div.height() )
          {
            var oldW = this.oBody.width();
            this.oBody.css('height','0');
            this.oBody.css({
              height:
                String(this.div.height()-
                  (this.oDiv.outerHeight(true)+this.oBody.outerHeight(false)))+'px',
              width: String(oldW+20)+'px' }); // wider for scroll bar
          }
          if ( this.oDiv.outerWidth(true) > this.div.width() )
          {
            this.oBody.css('width','0');
            this.oBody.css('width',
                  String(this.div.width()-
                    (this.oDiv.outerWidth(true)+this.oBody.outerWidth(false)))+'px');
          }

		    } // if ( ! this.oDiv )
		    else
		    {
		      this.cloak.show();
		      this.oDiv.show();
		    }
		    this.pos(event);
		    this.updODiv(null);

		    var f = this.oDiv.find('.AnyTime-off-off-btn.AnyTime-cur-btn:first');
		    if ( ! f.length )
		    	f = this.oDiv.find('.AnyTime-off-off-btn:first');
		    this.setFocus( f );

		}, // .askOffset()

		//---------------------------------------------------------------------
		//  .askYear() is called by this.newYear() when the yPast or yAhead
		//  button is clicked.
		//---------------------------------------------------------------------

		askYear: function( event )
		{
		    if ( ! this.yDiv )
		    {
		      this.makeCloak();

		      this.yDiv = $('<div class="AnyTime-win AnyTime-yr-selector ui-widget ui-widget-content ui-corner-all"></div>');
		      this.div.append(this.yDiv);

		      var title = $('<h5 class="AnyTime-hdr AnyTime-hdr-yr-selector ui-widget-header ui-corner-top" />');
		      this.yDiv.append( title );

		      var xDiv = $('<div class="AnyTime-x-btn ui-state-default">'+this.lX+'</div>');
		      title.append(xDiv);
		      xDiv.click(function(e){_this.dismissYDiv(e);});

		      title.append( this.lY );

		      var yBody = $('<div class="AnyTime-body AnyTime-body-yr-selector" ></div>');
		      this.yDiv.append( yBody );

		      cont = $('<ul class="AnyTime-yr-mil" />' );
		      yBody.append(cont);
		      this.y0XXX = this.btn( cont, 0, this.newYPos,['mil','mil0'],this.lY+' '+0+'000');
		      for ( i = 1; i < 10 ; i++ )
		        this.btn( cont, i, this.newYPos,['mil','mil'+i],this.lY+' '+i+'000');

  			  cont = $('<ul class="AnyTime-yr-cent" />' );
		      yBody.append(cont);
		      for ( i = 0 ; i < 10 ; i++ )
		        this.btn( cont, i, this.newYPos,['cent','cent'+i],this.lY+' '+i+'00');

		      cont = $('<ul class="AnyTime-yr-dec" />');
		      yBody.append(cont);
		      for ( i = 0 ; i < 10 ; i++ )
		        this.btn( cont, i, this.newYPos,['dec','dec'+i],this.lY+' '+i+'0');

		      cont = $('<ul class="AnyTime-yr-yr" />');
		      yBody.append(cont);
		      for ( i = 0 ; i < 10 ; i++ )
		        this.btn( cont, i, this.newYPos,['yr','yr'+i],this.lY+' '+i );

		      if ( this.askEra )
		      {
		        cont = $('<ul class="AnyTime-yr-era" />' );
		        yBody.append(cont);

		        this.btn( cont, this.conv.eAbbr[0],
		        		function( event )
		        		{
	  		      			var t = new Date(this.time.getTime());
		        			var year = t.getFullYear();
		        		    if ( year > 0 )
								t.setFullYear(0-year);
							this.set(t);
							this.updYDiv($(event.target));
		        		},
		        		['era','bce'], this.conv.eAbbr[0] );

		        this.btn( cont, this.conv.eAbbr[1],
		        		function( event )
		        		{
			      			var t = new Date(this.time.getTime());
		        			var year = t.getFullYear();
		        		    if ( year < 0 )
								t.setFullYear(0-year);
							this.set(t);
							this.updYDiv($(event.target));
		        		},
		        		['era','ce'], this.conv.eAbbr[1] );

		      } // if ( this.askEra )
		    } // if ( ! this.yDiv )
		    else
		    {
		      this.cloak.show();
		      this.yDiv.show();
		    }
		    this.pos(event);
		    this.updYDiv(null);
		    this.setFocus( this.yDiv.find('.AnyTime-yr-btn.AnyTime-cur-btn:first') );

		}, // .askYear()

		//---------------------------------------------------------------------
		//  .inpBlur() is called when a picker's input loses focus to dismiss
		//  the popup.  A 1/3 second delay is necessary to restore focus if
		//	the div is clicked (shorter delays don't always work!)  To prevent
		//  problems cause by scrollbar focus (except in FF), focus is
		//  force-restored if the offset div is visible.
		//---------------------------------------------------------------------

		inpBlur: function(event)
		{
			if ( this.oDiv && this.oDiv.is(":visible") )
			{
				_this.inp.focus();
				return;
			}
			this.lostFocus = true;
		    setTimeout(
		    	function()
		    	{
		    		if ( _this.lostFocus )
		    		{
		    			_this.div.find('.AnyTime-focus-btn').removeClass('AnyTime-focus-btn ui-state-focus');
		    			if ( _this.pop )
		    				_this.dismiss(event);
		    			else
		    				_this.ajax();
		    		}
		    	}, 334 );
		},

		//---------------------------------------------------------------------
		//  .btn() is called by AnyTime.picker() to create a <div> element
		//  containing an <a> element.  The elements are given appropriate
		//  classes based on the specified "classes" (an array of strings).
		//	The specified "text" and "title" are used for the <a> element.
		//	The "handler" is bound to click events for the <div>, which will
		//	catch bubbling clicks from the <a> as well.  The button is
		//	appended to the specified parent (jQuery), and the <div> jQuery
		//	is returned.
		//---------------------------------------------------------------------

		btn: function( parent, text, handler, classes, title )
		{
			var tagName = ( (parent[0].nodeName.toLowerCase()=='ul')?'li':'td');
			var div$ = '<' + tagName +
			  				' class="AnyTime-btn';
			for ( var i = 0 ; i < classes.length ; i++ )
				div$ += ' AnyTime-' + classes[i] + '-btn';
			var div = $( div$ + ' ui-state-default">' + text + '</' + tagName + '>' );
			parent.append(div);
			div.AnyTime_title = title;

			div.click(
			    function(e)
			  	{
			      // bind the handler to the picker so "this" is correct
				  _this.tempFunc = handler;
				  _this.tempFunc(e);
			  	});
			div.dblclick(
				function(e)
				{
					var elem = $(this);
					if ( elem.is('.AnyTime-off-off-btn') )
						_this.dismissODiv(e);
					else if ( elem.is('.AnyTime-mil-btn') || elem.is('.AnyTime-cent-btn') || elem.is('.AnyTime-dec-btn') || elem.is('.AnyTime-yr-btn') || elem.is('.AnyTime-era-btn') )
						_this.dismissYDiv(e);
					else if ( _this.pop )
						_this.dismiss(e);
				});
		    return div;

		}, // .btn()

		//---------------------------------------------------------------------
		//  .cleanup() destroys the DOM events and elements associated with
		//  the picker so it can be deleted.
		//---------------------------------------------------------------------

		cleanup: function(event)
		{
			this.
			  inp.
			    prop('readonly',this.ro).
			    off('blur',this.hBlur).
		      off('click',this.hClick).
		      off('focus',this.hFocus).
		      off('keydown',this.hKeydown).
		      off('keypress',this.hKeypress);
      $(window).off('resize',this.hResize);
			this.div.remove();
		},

		//---------------------------------------------------------------------
		//  .dismiss() dismisses a popup picker.
		//---------------------------------------------------------------------

		dismiss: function(event)
		{
			this.ajax();
			if ( this.yDiv )
				this.dismissYDiv();
			if ( this.oDiv )
				this.dismissODiv();
			this.div.hide();
			this.lostFocus = true;
		},

		//---------------------------------------------------------------------
		//  .dismissODiv() dismisses the UTC offset selector popover.
		//---------------------------------------------------------------------

		dismissODiv: function(event)
		{
		    this.oDiv.hide();
		    this.cloak.hide();
			this.setFocus(this.oCur);
		},

		//---------------------------------------------------------------------
		//  .dismissYDiv() dismisses the date selector popover.
		//---------------------------------------------------------------------

		dismissYDiv: function(event)
		{
		    this.yDiv.hide();
		    this.cloak.hide();
			this.setFocus(this.yCur);
		},

		//---------------------------------------------------------------------
		//  .setFocus() makes a specified psuedo-button appear to get focus.
		//---------------------------------------------------------------------

		setFocus: function(btn)
		{
			if ( ! btn.hasClass('AnyTime-focus-btn') )
			{
				this.div.find('.AnyTime-focus-btn').removeClass('AnyTime-focus-btn ui-state-focus');
				this.fBtn = btn;
				btn.removeClass('ui-state-default ui-state-highlight');
				btn.addClass('AnyTime-focus-btn ui-state-default ui-state-highlight ui-state-focus');
			}
			if ( btn.hasClass('AnyTime-off-off-btn') )
			{
				var oBT = this.oBody.offset().top;
				var btnT = btn.offset().top;
				var btnH = btn.outerHeight(true);
				if ( btnT - btnH < oBT ) // move a page up
					this.oBody.scrollTop( btnT + this.oBody.scrollTop() - ( this.oBody.innerHeight() + oBT ) + ( btnH * 2 ) );
				else if ( btnT + btnH > oBT + this.oBody.innerHeight() ) // move a page down
					this.oBody.scrollTop( ( btnT + this.oBody.scrollTop() ) - ( oBT + btnH ) );
			}
		},

		//---------------------------------------------------------------------
		//  .key() is invoked when a user presses a key while the picker's
		//	input has focus.  A psuedo-button is considered "in focus" and an
		//	appropriate action is performed according to the WAI-ARIA Authoring
		//	Practices 1.0 for datepicker from
		//  www.w3.org/TR/2009/WD-wai-aria-practices-20091215/#datepicker:
		//
		//  * LeftArrow moves focus left, continued to previous week.
		//  * RightArrow moves focus right, continued to next week.
		//  * UpArrow moves focus to the same weekday in the previous week.
		//  * DownArrow moves focus to same weekday in the next week.
		//  * PageUp moves focus to same day in the previous month.
		//  * PageDown moves focus to same day in the next month.
		//  * Shift+Page Up moves focus to same day in the previous year.
		//  * Shift+Page Down moves focus to same day in the next year.
		//  * Home moves focus to the first day of the month.
		//  * End moves focus to the last day of the month.
		//  * Ctrl+Home moves focus to the first day of the year.
		//  * Ctrl+End moves focus to the last day of the year.
		//  * Esc closes a DatePicker that is opened as a Popup.
		//
		//  The following actions (for multiple-date selection) are NOT
		//	supported:
		//  * Shift+Arrow performs continous selection.
		//  * Ctrl+Space multiple selection of certain days.
		//
		//  The authoring practices do not specify behavior for a time picker,
		//  or for month-and-year pickers that do not have a day-of-the-month,
		//  but AnyTime.picker uses the following behavior to be as consistent
		//  as possible with the defined datepicker functionality:
		//  * LeftArrow moves focus left or up to previous value or field.
		//  * RightArrow moves focus right or down to next value or field.
		//  * UpArrow moves focus up or left to previous value or field.
		//  * DownArrow moves focus down or right to next value or field
		//  * PageUp moves focus to the current value in the previous units
		//    (for example, from ten-minutes to hours or one-minutes to
		//	  ten-minutes or months to years).
		//  * PageDown moves focus to the current value in the next units
		//    (for example, from hours to ten-minutes or ten-minutes to
		//    one-minutes or years to months).
		//  * Home moves the focus to the first unit button.
		//  * End moves the focus to the last unit button.
		//
		//  In addition, Tab and Shift+Tab move between units (including to/
		//	from the Day-of-Month table) and also in/out of the picker.
		//
		//  Because AnyTime.picker sets a value as soon as the button receives
		//  focus, SPACE and ENTER are not needed (the WAI-ARIA guidelines use
		//  them to select a value.
		//---------------------------------------------------------------------

		key: function(event)
		{
      var mo;
			var t = null;
      var _this = this;
			var elem = this.div.find('.AnyTime-focus-btn');
		    var key = event.keyCode || event.which;
		    this.denyTab = true;

		    if ( key == 16 ) // Shift
		    {
		    }
		    else if ( ( key == 10 ) || ( key == 13 ) || ( key == 27 ) ) // Enter & Esc
		    {
		      if ( this.oDiv && this.oDiv.is(':visible') )
		        this.dismissODiv(event);
		      else if ( this.yDiv && this.yDiv.is(':visible') )
			    this.dismissYDiv(event);
		      else if ( this.pop )
			    this.dismiss(event);
		    }
		    else if ( ( key == 33 ) || ( ( key == 9 ) && event.shiftKey ) ) // PageUp & Shift+Tab
		    {
		    	if ( this.fBtn.hasClass('AnyTime-off-off-btn') )
				{
		    		if ( key == 9 )
				        this.dismissODiv(event);
				}
		    	else if ( this.fBtn.hasClass('AnyTime-mil-btn') )
				{
		    		if ( key == 9 )
				        this.dismissYDiv(event);
				}
		    	else if ( this.fBtn.hasClass('AnyTime-cent-btn') )
					this.yDiv.find('.AnyTime-mil-btn.AnyTime-cur-btn').triggerHandler('click');
		    	else if ( this.fBtn.hasClass('AnyTime-dec-btn') )
					this.yDiv.find('.AnyTime-cent-btn.AnyTime-cur-btn').triggerHandler('click');
		    	else if ( this.fBtn.hasClass('AnyTime-yr-btn') )
					this.yDiv.find('.AnyTime-dec-btn.AnyTime-cur-btn').triggerHandler('click');
		    	else if ( this.fBtn.hasClass('AnyTime-era-btn') )
					this.yDiv.find('.AnyTime-yr-btn.AnyTime-cur-btn').triggerHandler('click');
		    	else if ( this.fBtn.parents('.AnyTime-yrs').length )
				{
					if ( key == 9 )
					{
						this.denyTab = false;
						return;
					}
				}
		    	else if ( this.fBtn.hasClass('AnyTime-mon-btn') )
				{
					if ( this.dY )
						this.yCur.triggerHandler('click');
					else if ( key == 9 )
					{
						this.denyTab = false;
						return;
					}
				}
		    	else if ( this.fBtn.hasClass('AnyTime-dom-btn') )
		    	{
		    		if ( ( key == 9 ) && event.shiftKey ) // Shift+Tab
					{
						this.denyTab = false;
						return;
					}
		    		else // PageUp
		    		{
			    		t = new Date(this.time.getTime());
				    	if ( event.shiftKey )
				    		t.setFullYear(t.getFullYear()-1);
				    	else
				    	{
				    		mo = t.getMonth()-1;
		    				if ( t.getDate() > __daysIn[mo] )
		    					t.setDate(__daysIn[mo])
			    			t.setMonth(mo);
				    	}
			    		this.keyDateChange(t);
		    		}
		    	}
		    	else if ( this.fBtn.hasClass('AnyTime-hr-btn') )
				{
		    		t = this.dDoM || this.dMo;
					if ( t )
						t.AnyTime_clickCurrent();
					else if ( this.dY )
						this.yCur.triggerHandler('click');
					else if ( key == 9 )
					{
						this.denyTab = false;
						return;
					}
				}
		    	else if ( this.fBtn.hasClass('AnyTime-min-ten-btn') )
				{
		    		t = this.dH || this.dDoM || this.dMo;
					if ( t )
						t.AnyTime_clickCurrent();
					else if ( this.dY )
						this.yCur.triggerHandler('click');
					else if ( key == 9 )
					{
						this.denyTab = false;
						return;
					}
				}
		    	else if ( this.fBtn.hasClass('AnyTime-min-one-btn') )
					this.dM.AnyTime_clickCurrent();
		    	else if ( this.fBtn.hasClass('AnyTime-sec-ten-btn') )
				{
		    		if ( this.dM )
		    			t = this.dM.find('.AnyTime-mins-ones');
		    		else
		    			t = this.dH || this.dDoM || this.dMo;
					if ( t )
						t.AnyTime_clickCurrent();
					else if ( this.dY )
						this.yCur.triggerHandler('click');
					else if ( key == 9 )
					{
						this.denyTab = false;
						return;
					}
				}
		    	else if ( this.fBtn.hasClass('AnyTime-sec-one-btn') )
					this.dS.AnyTime_clickCurrent();
		    	else if ( this.fBtn.hasClass('AnyTime-off-btn') )
				{
		    		if ( this.dS )
		    			t = this.dS.find('.AnyTime-secs-ones');
		    		else if ( this.dM )
		    			t = this.dM.find('.AnyTime-mins-ones');
		    		else
		    			t = this.dH || this.dDoM || this.dMo;
					if ( t )
						t.AnyTime_clickCurrent();
					else if ( this.dY )
						this.yCur.triggerHandler('click');
					else if ( key == 9 )
					{
						this.denyTab = false;
						return;
					}
				}
			}
		    else if ( ( key == 34 ) || ( key == 9 ) ) // PageDown or Tab
		    {
		    	if ( this.fBtn.hasClass('AnyTime-mil-btn') )
					this.yDiv.find('.AnyTime-cent-btn.AnyTime-cur-btn').triggerHandler('click');
		    	else if ( this.fBtn.hasClass('AnyTime-cent-btn') )
					this.yDiv.find('.AnyTime-dec-btn.AnyTime-cur-btn').triggerHandler('click');
		    	else if ( this.fBtn.hasClass('AnyTime-dec-btn') )
					this.yDiv.find('.AnyTime-yr-btn.AnyTime-cur-btn').triggerHandler('click');
		    	else if ( this.fBtn.hasClass('AnyTime-yr-btn') )
		    	{
		    		t = this.yDiv.find('.AnyTime-era-btn.AnyTime-cur-btn');
					if ( t.length )
						t.triggerHandler('click');
					else if ( key == 9 )
						this.dismissYDiv(event);
		    	}
		    	else if ( this.fBtn.hasClass('AnyTime-era-btn') )
		    	{
		    		if ( key == 9 )
		    			this.dismissYDiv(event);
		    	}
		    	else if ( this.fBtn.hasClass('AnyTime-off-off-btn') )
		    	{
		    		if ( key == 9 )
		    			this.dismissODiv(event);
		    	}
		    	else if ( this.fBtn.parents('.AnyTime-yrs').length )
				{
		    		t = this.dDoM || this.dMo || this.dH || this.dM || this.dS || this.dO;
					if ( t )
						t.AnyTime_clickCurrent();
					else if ( key == 9 )
					{
						this.denyTab = false;
						return;
					}
				}
		    	else if ( this.fBtn.hasClass('AnyTime-mon-btn') )
				{
		    		t = this.dDoM || this.dH || this.dM || this.dS || this.dO;
					if ( t )
						t.AnyTime_clickCurrent();
					else if ( key == 9 )
					{
						this.denyTab = false;
						return;
					}
				}
		    	else if ( this.fBtn.hasClass('AnyTime-dom-btn') )
		    	{
		    		if ( key == 9 ) // Tab
		    		{
		        		t = this.dH || this.dM || this.dS || this.dO;
		    			if ( t )
							t.AnyTime_clickCurrent();
		    			else
						{
							this.denyTab = false;
							return;
						}
		    		}
		    		else // PageDown
		    		{
			    		t = new Date(this.time.getTime());
				    	if ( event.shiftKey )
				    		t.setFullYear(t.getFullYear()+1);
				    	else
				    	{
				    		mo = t.getMonth()+1;
		    				if ( t.getDate() > __daysIn[mo] )
		    					t.setDate(__daysIn[mo])
			    			t.setMonth(mo);
				    	}
			    		this.keyDateChange(t);
		    		}
		    	}
		    	else if ( this.fBtn.hasClass('AnyTime-hr-btn') )
				{
		    		t = this.dM || this.dS || this.dO;
					if ( t )
						t.AnyTime_clickCurrent();
					else if ( key == 9 )
					{
						this.denyTab = false;
						return;
					}
				}
		    	else if ( this.fBtn.hasClass('AnyTime-min-ten-btn') )
		    		this.dM.find('.AnyTime-mins-ones .AnyTime-cur-btn').triggerHandler('click');
		    	else if ( this.fBtn.hasClass('AnyTime-min-one-btn') )
				{
					t = this.dS || this.dO;
					if ( t )
						t.AnyTime_clickCurrent();
					else if ( key == 9 )
					{
						this.denyTab = false;
						return;
					}
				}
		    	else if ( this.fBtn.hasClass('AnyTime-sec-ten-btn') )
		    		this.dS.find('.AnyTime-secs-ones .AnyTime-cur-btn').triggerHandler('click');
		    	else if ( this.fBtn.hasClass('AnyTime-sec-one-btn') )
				{
		    		if ( this.dO )
						this.dO.AnyTime_clickCurrent();
		    		else if ( key == 9 )
					{
						this.denyTab = false;
						return;
					}
				}
		    	else if ( this.fBtn.hasClass('AnyTime-off-btn') )
				{
		    		if ( key == 9 )
					{
						this.denyTab = false;
						return;
					}
				}
			}
		    else if ( key == 35 ) // END
		    {
		    	if ( this.fBtn.hasClass('AnyTime-mil-btn') || this.fBtn.hasClass('AnyTime-cent-btn') ||
				    this.fBtn.hasClass('AnyTime-dec-btn') || this.fBtn.hasClass('AnyTime-yr-btn') ||
				    this.fBtn.hasClass('AnyTime-era-btn') )
		    	{
		    		t = this.yDiv.find('.AnyTime-ce-btn');
		    		if ( ! t.length )
		    			t = this.yDiv.find('.AnyTime-yr9-btn');
		    		t.triggerHandler('click');
		    	}
		    	else if ( this.fBtn.hasClass('AnyTime-dom-btn') )
		    	{
		    		t = new Date(this.time.getTime());
					t.setDate(1);
		    		t.setMonth(t.getMonth()+1);
					t.setDate(t.getDate()-1);
			    	if ( event.ctrlKey )
			    		t.setMonth(11);
		    		this.keyDateChange(t);
		    	}
		    	else if ( this.dS )
					this.dS.find('.AnyTime-sec9-btn').triggerHandler('click');
		    	else if ( this.dM )
					this.dM.find('.AnyTime-min9-btn').triggerHandler('click');
				else if ( this.dH )
					this.dH.find('.AnyTime-hr23-btn').triggerHandler('click');
				else if ( this.dDoM )
					this.dDoM.find('.AnyTime-dom-btn-filled:last').triggerHandler('click');
				else if ( this.dMo )
					this.dMo.find('.AnyTime-mon12-btn').triggerHandler('click');
				else if ( this.dY )
					this.yAhead.triggerHandler('click');
		    }
		    else if ( key == 36 ) // HOME
		    {
		    	if ( this.fBtn.hasClass('AnyTime-mil-btn') || this.fBtn.hasClass('AnyTime-cent-btn') ||
				    this.fBtn.hasClass('AnyTime-dec-btn') || this.fBtn.hasClass('AnyTime-yr-btn') ||
				    this.fBtn.hasClass('AnyTime-era-btn') )
				{
		    		this.yDiv.find('.AnyTime-mil0-btn').triggerHandler('click');
		    	}
			    else if ( this.fBtn.hasClass('AnyTime-dom-btn') )
		    	{
		    		t = new Date(this.time.getTime());
					t.setDate(1);
			    	if ( event.ctrlKey )
			    		t.setMonth(0);
		    		this.keyDateChange(t);
		    	}
				else if ( this.dY )
					this.yCur.triggerHandler('click');
				else if ( this.dMo )
					this.dMo.find('.AnyTime-mon1-btn').triggerHandler('click');
				else if ( this.dDoM )
					this.dDoM.find('.AnyTime-dom-btn-filled:first').triggerHandler('click');
				else if ( this.dH )
					this.dH.find('.AnyTime-hr0-btn').triggerHandler('click');
		    	else if ( this.dM )
					this.dM.find('.AnyTime-min00-btn').triggerHandler('click');
		    	else if ( this.dS )
					this.dS.find('.AnyTime-sec00-btn').triggerHandler('click');
		    }
		    else if ( key == 37 ) // left arrow
		    {
		    	if ( this.fBtn.hasClass('AnyTime-dom-btn') )
          {
			      t = new Date(this.time.getTime());
            t.setDate(t.getDate()-1);
		    		this.keyDateChange(t);
          }
		    	else
		    		this.keyBack();
		    }
		    else if ( key == 38 ) // up arrow
		    {
		    	if ( this.fBtn.hasClass('AnyTime-dom-btn') )
          {
			      t = new Date(this.time.getTime());
            t.setDate(t.getDate()-7);
		    		this.keyDateChange(t);
          }
		    	else
		    		this.keyBack();
		    }
		    else if ( key == 39 ) // right arrow
		    {
		    	if ( this.fBtn.hasClass('AnyTime-dom-btn') )
          {
			      t = new Date(this.time.getTime());
            t.setDate(t.getDate()+1);
		    		this.keyDateChange(t);
          }
		    	else
		    		this.keyAhead();
		    }
		    else if ( key == 40 ) // down arrow
		    {
		    	if ( this.fBtn.hasClass('AnyTime-dom-btn') )
         {
			      t = new Date(this.time.getTime());
            t.setDate(t.getDate()+7);
		    		this.keyDateChange(t);
          }
		    	else
		    		this.keyAhead();
		    }
		    else if ( ( ( key == 86 ) || ( key == 118 ) ) && event.ctrlKey )
		    {
		    	this.updVal('');
		    	setTimeout( function() { _this.showPkr(null); }, 100 );
		    	return;
		    }
		    else
    			this.showPkr(null);

		    event.preventDefault();

		}, // .key()

		//---------------------------------------------------------------------
		//  .keyAhead() is called by #key when a user presses the right or
		//	down arrow.  It moves to the next appropriate button.
		//---------------------------------------------------------------------

		keyAhead: function()
		{
		   	if ( this.fBtn.hasClass('AnyTime-mil9-btn') )
		   		this.yDiv.find('.AnyTime-cent0-btn').triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-cent9-btn') )
		   		this.yDiv.find('.AnyTime-dec0-btn').triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-dec9-btn') )
		   		this.yDiv.find('.AnyTime-yr0-btn').triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-yr9-btn') )
		   		this.yDiv.find('.AnyTime-bce-btn').triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-sec9-btn') )
		   		{}
		   	else if ( this.fBtn.hasClass('AnyTime-sec50-btn') )
		   		this.dS.find('.AnyTime-sec0-btn').triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-min9-btn') )
		   	{
		   		if ( this.dS )
		   			this.dS.find('.AnyTime-sec00-btn').triggerHandler('click');
		   	}
		   	else if ( this.fBtn.hasClass('AnyTime-min50-btn') )
		   		this.dM.find('.AnyTime-min0-btn').triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-hr23-btn') )
		   	{
		   		if ( this.dM )
		   			this.dM.find('.AnyTime-min00-btn').triggerHandler('click');
		   		else if ( this.dS )
		   			this.dS.find('.AnyTime-sec00-btn').triggerHandler('click');
		   	}
		   	else if ( this.fBtn.hasClass('AnyTime-hr11-btn') )
				this.dH.find('.AnyTime-hr12-btn').triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-mon12-btn') )
		   	{
		   		if ( this.dDoM )
		   			this.dDoM.AnyTime_clickCurrent();
		   		else if ( this.dH )
		   			this.dH.find('.AnyTime-hr0-btn').triggerHandler('click');
		   		else if ( this.dM )
		   			this.dM.find('.AnyTime-min00-btn').triggerHandler('click');
		   		else if ( this.dS )
		   			this.dS.find('.AnyTime-sec00-btn').triggerHandler('click');
		   	}
		   	else if ( this.fBtn.hasClass('AnyTime-yrs-ahead-btn') )
		   	{
		   		if ( this.dMo )
		   			this.dMo.find('.AnyTime-mon1-btn').triggerHandler('click');
		   		else if ( this.dH )
		   			this.dH.find('.AnyTime-hr0-btn').triggerHandler('click');
		   		else if ( this.dM )
		   			this.dM.find('.AnyTime-min00-btn').triggerHandler('click');
		   		else if ( this.dS )
		   			this.dS.find('.AnyTime-sec00-btn').triggerHandler('click');
		   	}
		   	else if ( this.fBtn.hasClass('AnyTime-yr-cur-btn') )
		        this.yNext.triggerHandler('click');
		   	else
				 this.fBtn.next().triggerHandler('click');

		}, // .keyAhead()


		//---------------------------------------------------------------------
		//  .keyBack() is called by #key when a user presses the left or
		//	up arrow. It moves to the previous appropriate button.
		//---------------------------------------------------------------------

		keyBack: function()
		{
		   	if ( this.fBtn.hasClass('AnyTime-cent0-btn') )
		   		this.yDiv.find('.AnyTime-mil9-btn').triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-dec0-btn') )
		   		this.yDiv.find('.AnyTime-cent9-btn').triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-yr0-btn') )
		   		this.yDiv.find('.AnyTime-dec9-btn').triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-bce-btn') )
			   		this.yDiv.find('.AnyTime-yr9-btn').triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-yr-cur-btn') )
		        this.yPrior.triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-mon1-btn') )
		   	{
		   		if ( this.dY )
		   			this.yCur.triggerHandler('click');
		   	}
		   	else if ( this.fBtn.hasClass('AnyTime-hr0-btn') )
		   	{
		   		if ( this.dDoM )
		   			this.dDoM.AnyTime_clickCurrent();
		   		else if ( this.dMo )
		   			this.dMo.find('.AnyTime-mon12-btn').triggerHandler('click');
		   		else if ( this.dY )
		   			this.yNext.triggerHandler('click');
		   	}
		   	else if ( this.fBtn.hasClass('AnyTime-hr12-btn') )
		   		 this.dH.find('.AnyTime-hr11-btn').triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-min00-btn') )
		   	{
		   		if ( this.dH )
		   			this.dH.find('.AnyTime-hr23-btn').triggerHandler('click');
		   		else if ( this.dDoM )
		   			this.dDoM.AnyTime_clickCurrent();
		   		else if ( this.dMo )
		   			this.dMo.find('.AnyTime-mon12-btn').triggerHandler('click');
		   		else if ( this.dY )
		   			this.yNext.triggerHandler('click');
		   	}
		   	else if ( this.fBtn.hasClass('AnyTime-min0-btn') )
		   		 this.dM.find('.AnyTime-min50-btn').triggerHandler('click');
		   	else if ( this.fBtn.hasClass('AnyTime-sec00-btn') )
		   	{
		   		if ( this.dM )
		   			this.dM.find('.AnyTime-min9-btn').triggerHandler('click');
		   		else if ( this.dH )
		   			this.dH.find('.AnyTime-hr23-btn').triggerHandler('click');
		   		else if ( this.dDoM )
		   			this.dDoM.AnyTime_clickCurrent();
		   		else if ( this.dMo )
		   			this.dMo.find('.AnyTime-mon12-btn').triggerHandler('click');
		   		else if ( this.dY )
		   			this.yNext.triggerHandler('click');
		   	}
		   	else if ( this.fBtn.hasClass('AnyTime-sec0-btn') )
		   		 this.dS.find('.AnyTime-sec50-btn').triggerHandler('click');
		   	else
				 this.fBtn.prev().triggerHandler('click');

		}, // .keyBack()

		//---------------------------------------------------------------------
		//  .keyDateChange() is called by #key when an direction key
		//	(arrows/page/etc) is pressed while the Day-of-Month calendar has
		//	focus. The current day is adjusted accordingly.
		//---------------------------------------------------------------------

		keyDateChange: function( newDate )
		{
			if ( this.fBtn.hasClass('AnyTime-dom-btn') )
			{
				this.set(newDate);
				this.upd(null);
				this.setFocus( this.dDoM.find('.AnyTime-cur-btn') );
			}
		},

		//---------------------------------------------------------------------
		//  .makeCloak() is called by .askOffset() and .askYear() to create
		//  a cloak div.
		//---------------------------------------------------------------------

		makeCloak: function()
		{
			if ( ! this.cloak )
			{
		      this.cloak = $('<div class="AnyTime-cloak"></div>');
		      this.div.append( this.cloak );
		      this.cloak.click(
		        function(e)
		        {
		        	if ( _this.oDiv && _this.oDiv.is(":visible") )
		        		_this.dismissODiv(e);
		        	else
		        		_this.dismissYDiv(e);
		        });
		    }
			else
		      this.cloak.show();
		},

		//---------------------------------------------------------------------
		//  makeDate() returns a Date object for the parameter as follows.
    //  Strings are parsed using the converter and numbers are assumed
    //  to be milliseconds.
		//---------------------------------------------------------------------

		makeDate: function(time)
    {
      if ( typeof time == 'number' )
        time = new Date(time);
      else if ( typeof time == 'string' )
        time = this.conv.parse( time );
      if ( 'getTime' in time )
        return time;
      throw 'cannot make a Date from ' + time;
    },

		//---------------------------------------------------------------------
		//  .newHour() is called when a user clicks an hour value.
		//  It changes the date and updates the text field.
		//---------------------------------------------------------------------

		newHour: function( event )
		{
		    var h;
		    var t;
		    var elem = $(event.target);
		    if ( elem.hasClass("AnyTime-out-btn") )
		    	return;
		    if ( ! this.twelveHr )
		      h = Number(elem.text());
		    else
		    {
		      var str = elem.text();
		      t = str.indexOf('a');
		      if ( t < 0 )
		      {
		        t = Number(str.substr(0,str.indexOf('p')));
		        h = ( (t==12) ? 12 : (t+12) );
		      }
		      else
		      {
		        t = Number(str.substr(0,t));
		        h = ( (t==12) ? 0 : t );
		      }
		    }
		    t = new Date(this.time.getTime());
		    t.setHours(h);
		    this.set(t);
		    this.upd(elem);

		}, // .newHour()

		//---------------------------------------------------------------------
		//  .newOffset() is called when a user clicks the UTC offset (timezone)
		//  (or +/- button) to shift the year.  It changes the date and updates
		//  the text field.
		//---------------------------------------------------------------------

		newOffset: function( event )
		{
		    if ( event.target == this.oSel[0] )
			    this.askOffset(event);
		    else
		    {
		      this.upd(this.oCur);
		    }
		},

		//---------------------------------------------------------------------
		//  .newOPos() is called internally whenever a user clicks an offset
		//  selection value.  It changes the date and updates the text field.
		//---------------------------------------------------------------------

		newOPos: function( event )
		{
		    var elem = $(event.target);
            this.offMin = elem[0].AnyTime_offMin;
            this.offSI = elem[0].AnyTime_offSI;
		    var t = new Date(this.time.getTime());
		    this.set(t);
		    this.updODiv(elem);

		}, // .newOPos()

		//---------------------------------------------------------------------
		//  .newYear() is called when a user clicks a year (or one of the
		//	"arrows") to shift the year.  It changes the date and updates the
		//	text field.
		//---------------------------------------------------------------------

		newYear: function( event )
		{
		    var elem = $(event.target);
		    if ( elem.hasClass("AnyTime-out-btn") )
		    	return;
		    var txt = elem.text();
		    if ( ( txt == '<' ) || ( txt == '&lt;' ) )
		      this.askYear(event);
		    else if ( ( txt == '>' ) || ( txt == '&gt;' ) )
		      this.askYear(event);
		    else
		    {
		      var t = new Date(this.time.getTime());
		      t.setFullYear(Number(txt));
		      this.set(t);
		      this.upd(this.yCur);
		    }
		},

		//---------------------------------------------------------------------
		//  .newYPos() is called internally whenever a user clicks a year
		//  selection value.  It changes the date and updates the text field.
		//---------------------------------------------------------------------

		newYPos: function( event )
		{
		    var elem = $(event.target);
		    if ( elem.hasClass("AnyTime-out-btn") )
		    	return;

		    var era = 1;
		    var year = this.time.getFullYear();
		    if ( year < 0 )
		    {
		      era = (-1);
		      year = 0 - year;
		    }
		    year = AnyTime.pad( year, 4 );
		    if ( elem.hasClass('AnyTime-mil-btn') )
		      year = elem.html() + year.substring(1,4);
		    else if ( elem.hasClass('AnyTime-cent-btn') )
		      year = year.substring(0,1) + elem.html() + year.substring(2,4);
		    else if ( elem.hasClass('AnyTime-dec-btn') )
		      year = year.substring(0,2) + elem.html() + year.substring(3,4);
		    else
		      year = year.substring(0,3) + elem.html();
		    if ( year == '0000' )
		      year = 1;
		    var t = new Date(this.time.getTime());
		    t.setFullYear( era * year );
		    this.set(t);
		    this.updYDiv(elem);

		}, // .newYPos()

		//---------------------------------------------------------------------
		//  .onReady() initializes the picker after the page has loaded.
		//---------------------------------------------------------------------

		onReady: function()
		{
			this.lostFocus = true;
			if ( ! this.pop )
				this.upd(null);
			else
			{
				if ( this.div.parent() != document.body )
					this.div.appendTo( document.body );
			}
		},

		//---------------------------------------------------------------------
		//  .pos() positions the picker, such as when it is displayed or
		//	when the window is resized.
		//---------------------------------------------------------------------

		pos: function(event) // note: event is ignored but this is a handler
		{
		    if ( this.pop )
		    {
		      var off = this.inp.offset();
		      var bodyWidth = $(document.body).outerWidth(true);
		      var pickerWidth = this.div.outerWidth(true);
		      var left = off.left;
		      if ( left + pickerWidth > bodyWidth - 20 )
		        left = bodyWidth - ( pickerWidth + 20 );
		      var top = off.top - this.div.outerHeight(true);
		      if ( top < 0 )
		        top = off.top + this.inp.outerHeight(true);
		      this.div.css( { top: String(top)+'px', left: String(left<0?0:left)+'px' } );
		    }

		    var wOff = this.div.offset();

		    if ( this.oDiv && this.oDiv.is(":visible") )
		    {
		      var oOff = this.oLab.offset();
		      if ( this.div.css('position') == 'absolute' )
		      {
		    	  oOff.top -= wOff.top;
		          oOff.left = oOff.left - wOff.left;
		    	  wOff = { top: 0, left: 0 };
		      }
		      var oW = this.oDiv.outerWidth(true);
		      var wW = this.div.outerWidth(true);
		      if ( oOff.left + oW > wOff.left + wW )
		      {
		    	  oOff.left = (wOff.left+wW)-oW;
		    	  if ( oOff.left < 2 )
		    		  oOff.left = 2;
		      }

		      var oH = this.oDiv.outerHeight(true);
		      var wH = this.div.outerHeight(true);
		      oOff.top += this.oLab.outerHeight(true);
		      if ( oOff.top + oH > wOff.top + wH )
		    	  oOff.top = oOff.top - oH;
		      if ( oOff.top < wOff.top )
		    	  oOff.top = wOff.top;

		      this.oDiv.css( { top: oOff.top+'px', left: oOff.left+'px' } ) ;
		    }

		    else if ( this.yDiv && this.yDiv.is(":visible") )
		    {
		      var yOff = this.yLab.offset();
		      if ( this.div.css('position') == 'absolute' )
		      {
		    	  yOff.top -= wOff.top;
		          yOff.left = yOff.left - wOff.left;
		    	  wOff = { top: 0, left: 0 };
		      }
		      yOff.left += ( (this.yLab.outerWidth(true)-this.yDiv.outerWidth(true)) / 2 );
		      this.yDiv.css( { top: yOff.top+'px', left: yOff.left+'px' } ) ;
		    }

		    if ( this.cloak )
			  this.cloak.css( {
		      	top: wOff.top+'px',
		      	left: wOff.left+'px',
		      	height: String(this.div.outerHeight(true)-2)+'px',
		    	width: String(this.div.outerWidth(true)-2)+'px'
		    	} );

		}, // .pos()

		//---------------------------------------------------------------------
		//  .set() changes the current time.  It returns true if the new
		//	time is within the allowed range (if any).
		//---------------------------------------------------------------------

		set: function(newTime)
		{
		    var t = newTime.getTime();
		    if ( this.earliest && ( t < this.earliest.getTime() ) )
		      this.time = new Date(this.earliest.getTime());
		    else if ( this.latest && ( t > this.latest.getTime() ) )
		      this.time = new Date(this.latest.getTime());
		    else
		      this.time = newTime;
		},

		//---------------------------------------------------------------------
		//  .setCurrent() changes the current time.
		//---------------------------------------------------------------------

		setCurrent: function(newTime)
		{
        this.set(this.makeDate(newTime));
        this.upd(null);
		},

		//---------------------------------------------------------------------
		//  .setEarliest() changes the earliest time.
		//---------------------------------------------------------------------

		setEarliest: function(newTime)
		{
        this.earliest = this.makeDate( newTime );
        this.set(this.time);
        this.upd(null);
		},

		//---------------------------------------------------------------------
		//  .setLatest() changes the latest time.
		//---------------------------------------------------------------------

		setLatest: function(newTime)
		{
        this.latest = this.makeDate( newTime );
        this.set(this.time);
        this.upd(null);
		},

		//---------------------------------------------------------------------
		//  .showPkr() displays the picker and sets the focus psuedo-
		//	element. The current value in the input field is used to initialize
		//	the picker.
		//---------------------------------------------------------------------

		showPkr: function(event)
		{
			try
		    {
		      this.time = this.conv.parse(this.inp.val());
		      this.offMin = this.conv.getUtcParseOffsetCaptured();
		      this.offSI = this.conv.getUtcParseOffsetSubIndex();
		    }
		    catch ( e )
		    {
		      this.time = new Date();
		    }
		    this.set(this.time);
		    this.upd(null);

		    fBtn = null;
		    var cb = '.AnyTime-cur-btn:first';
		    if ( this.dDoM )
		    	fBtn = this.dDoM.find(cb);
			else if ( this.yCur )
				fBtn = this.yCur;
			else if ( this.dMo )
				fBtn = this.dMo.find(cb);
			else if ( this.dH )
				fBtn = this.dH.find(cb);
			else if ( this.dM )
				fBtn = this.dM.find(cb);
			else if ( this.dS )
				fBtn = this.dS.find(cb);

      this.setFocus(fBtn);
      this.pos(event);

		}, // .showPkr()

		//---------------------------------------------------------------------
		//  .upd() updates the picker's appearance.  It is called after
		//	most events to make the picker reflect the currently-selected
		//	values. fBtn is the psuedo-button to be given focus.
		//---------------------------------------------------------------------

		upd: function(fBtn)
		{
		    var cmpLo = new Date(this.time.getTime());
		    cmpLo.setMonth(0,1);
		    cmpLo.setHours(0,0,0,0);
		    var cmpHi = new Date(this.time.getTime());
		    cmpHi.setMonth(11,31);
		    cmpHi.setHours(23,59,59,999);
        var earliestTime = this.earliest && this.earliest.getTime();
        var latestTime = this.latest && this.latest.getTime();

		    //  Update year.

		    var current = this.time.getFullYear();
		    if ( this.earliest && this.yPast )
		    {
				  cmpHi.setFullYear(current-2);
			      if ( cmpHi.getTime() < this.earliestTime )
              this.yPast.addClass('AnyTime-out-btn ui-state-disabled');
            else
              this.yPast.removeClass('AnyTime-out-btn ui-state-disabled');
          }
          if ( this.yPrior )
          {
		      this.yPrior.text(AnyTime.pad((current==1)?(-1):(current-1),4));
		      if ( this.earliest )
		      {
				  cmpHi.setFullYear(current-1);
			      if ( cmpHi.getTime() < this.earliestTime )
			    	  this.yPrior.addClass('AnyTime-out-btn ui-state-disabled');
			      else
			    	  this.yPrior.removeClass('AnyTime-out-btn ui-state-disabled');
		      }
		    }
		    if ( this.yCur )
		      this.yCur.text(AnyTime.pad(current,4));
		    if ( this.yNext )
		    {
		      this.yNext.text(AnyTime.pad((current==-1)?1:(current+1),4));
		      if ( this.latest )
		      {
			      cmpLo.setFullYear(current+1);
			      if ( cmpLo.getTime() > this.latestTime )
			    	  this.yNext.addClass('AnyTime-out-btn ui-state-disabled');
			      else
			    	  this.yNext.removeClass('AnyTime-out-btn ui-state-disabled');
		      }
		    }
		    if ( this.latest && this.yAhead )
		    {
				  cmpLo.setFullYear(current+2);
			      if ( cmpLo.getTime() > this.latestTime )
			    	  this.yAhead.addClass('AnyTime-out-btn ui-state-disabled');
			      else
			    	  this.yAhead.removeClass('AnyTime-out-btn ui-state-disabled');
		    }

		    //  Update month.

		    cmpLo.setFullYear( this.time.getFullYear() );
		    cmpHi.setFullYear( this.time.getFullYear() );
		    var i = 0;
		    current = this.time.getMonth();
		    $('#'+this.id+' .AnyTime-mon-btn').each(
		      function()
		      {
		    	cmpLo.setMonth(i);
				cmpHi.setDate(1);
		    	cmpHi.setMonth(i+1);
				cmpHi.setDate(0);
		        $(this).AnyTime_current( i == current,
		        		((!_this.earliest)||(cmpHi.getTime()>=earliestTime)) &&
		        		((!_this.latest)||(cmpLo.getTime()<=latestTime)) );
		        i++;
		      } );

		    //  Update days.

		    cmpLo.setFullYear( this.time.getFullYear() );
		    cmpHi.setFullYear( this.time.getFullYear() );
		    cmpLo.setMonth( this.time.getMonth() );
		    cmpHi.setMonth( this.time.getMonth(), 1 );
		    current = this.time.getDate();
		    var currentMonth = this.time.getMonth();
		    var lastLoDate = -1;
		    var dow1 = cmpLo.getDay();
		    if ( this.fDOW > dow1 )
		      dow1 += 7;
		    var wom = 0, dow=0;
		    $('#'+this.id+' .AnyTime-wk').each(
		      function()
		      {
		        dow = _this.fDOW;
		        $(this).children().each(
		          function()
		          {
		        	  if ( dow - _this.fDOW < 7 )
		        	  {
		        		  var td = $(this);
				          if ( ((wom==0)&&(dow<dow1)) || (cmpLo.getMonth()!=currentMonth) )
				          {
				            td.html('&#160;');
				            td.removeClass('AnyTime-dom-btn-filled AnyTime-cur-btn ui-state-default ui-state-highlight');
				            td.addClass('AnyTime-dom-btn-empty');
				            if ( wom ) // not first week
				            {
				            	if ( ( cmpLo.getDate() == 1 ) && ( dow != 0 ) )
				            		td.addClass('AnyTime-dom-btn-empty-after-filled');
				            	else
				            		td.removeClass('AnyTime-dom-btn-empty-after-filled');
				            	if ( cmpLo.getDate() <= 7 )
				            		td.addClass('AnyTime-dom-btn-empty-below-filled');
				            	else
				            		td.removeClass('AnyTime-dom-btn-empty-below-filled');
				                cmpLo.setDate(cmpLo.getDate()+1);
				                cmpHi.setDate(cmpHi.getDate()+1);
				            }
				            else // first week
				            {
				            	td.addClass('AnyTime-dom-btn-empty-above-filled');
				            	if ( dow == dow1 - 1 )
				            		td.addClass('AnyTime-dom-btn-empty-before-filled');
				            	else
				            		td.removeClass('AnyTime-dom-btn-empty-before-filled');
				            }
				            td.addClass('ui-state-default ui-state-disabled');
				          }
				          else
				          {
				            // Brazil daylight savings time sometimes results in
				            // midnight being the same day twice. This skips the
				            //  second one.
                    if ( ( i = cmpLo.getDate() ) == lastLoDate )
                      cmpLo.setDate( ++i );
                    lastLoDate = i;

				            td.text(i);
				            td.removeClass('AnyTime-dom-btn-empty AnyTime-dom-btn-empty-above-filled AnyTime-dom-btn-empty-before-filled '+
				            				'AnyTime-dom-btn-empty-after-filled AnyTime-dom-btn-empty-below-filled ' +
				            				'ui-state-default ui-state-disabled');
				            td.addClass('AnyTime-dom-btn-filled ui-state-default');
				            td.AnyTime_current( i == current,
					        		((!_this.earliest)||(cmpHi.getTime()>=earliestTime)) &&
					        		((!_this.latest)||(cmpLo.getTime()<=latestTime)) );
				            cmpLo.setDate(i+1);
				            cmpHi.setDate(i+1);
				          }
		        	  }
		              dow++;
		          } );
		          wom++;
		      } );

		    //  Update hour.

		    cmpLo.setFullYear( this.time.getFullYear() );
		    cmpHi.setFullYear( this.time.getFullYear() );
		    cmpLo.setMonth( this.time.getMonth(), this.time.getDate() );
		    cmpHi.setMonth( this.time.getMonth(), this.time.getDate() );
		    var not12 = ! this.twelveHr;
        var hr = this.time.getHours();
		    $('#'+this.id+' .AnyTime-hr-btn').each(
		      function()
		      {
            var html = this.innerHTML;
            var i;
            if ( not12 )
              i = Number(html);
            else
            {
              i = Number(html.substring(0,html.length-2) );
              if ( html.charAt(html.length-2) == 'a' )
              {
                if ( i == 12 )
                  i = 0;
              }
              else if ( i < 12 )
                i += 12;
            }
                cmpLo.setHours(i);
                cmpHi.setHours(i);
            $(this).AnyTime_current( hr == i,
		        	((!_this.earliest)||(cmpHi.getTime()>=earliestTime)) &&
		        		((!_this.latest)||(cmpLo.getTime()<=latestTime)) );
            if ( i < 23 )
		          cmpLo.setHours( cmpLo.getHours()+1 );
		      } );

		    //  Update minute.

        cmpLo.setHours( this.time.getHours() );
        cmpHi.setHours( this.time.getHours(), 9 );
		    var units = this.time.getMinutes();
		    var tens = String(Math.floor(units/10));
		    var ones = String(units % 10);
		    $('#'+this.id+' .AnyTime-min-ten-btn:not(.AnyTime-min-ten-btn-empty)').each(
		      function()
		      {
		        $(this).AnyTime_current( this.innerHTML == tens,
		        		((!_this.earliest)||(cmpHi.getTime()>=earliestTime)) &&
		        		((!_this.latest)||(cmpLo.getTime()<=latestTime)) );
            if ( cmpLo.getMinutes() < 50 )
            {
		        cmpLo.setMinutes( cmpLo.getMinutes()+10 );
		        cmpHi.setMinutes( cmpHi.getMinutes()+10 );
            }
		      } );
		    cmpLo.setMinutes( Math.floor(this.time.getMinutes()/10)*10 );
		    cmpHi.setMinutes( Math.floor(this.time.getMinutes()/10)*10 );
		    $('#'+this.id+' .AnyTime-min-one-btn:not(.AnyTime-min-one-btn-empty)').each(
		      function()
		      {
		        $(this).AnyTime_current( this.innerHTML == ones,
		        		((!_this.earliest)||(cmpHi.getTime()>=earliestTime)) &&
		        		((!_this.latest)||(cmpLo.getTime()<=latestTime)) );
		        cmpLo.setMinutes( cmpLo.getMinutes()+1 );
		        cmpHi.setMinutes( cmpHi.getMinutes()+1 );
		      } );

		    //  Update second.

		    cmpLo.setMinutes( this.time.getMinutes() );
		    cmpHi.setMinutes( this.time.getMinutes(), 9 );
		    units = this.time.getSeconds();
		    tens = String(Math.floor(units/10));
		    ones = String(units % 10);
		    $('#'+this.id+' .AnyTime-sec-ten-btn:not(.AnyTime-sec-ten-btn-empty)').each(
		      function()
		      {
		        $(this).AnyTime_current( this.innerHTML == tens,
		        		((!_this.earliest)||(cmpHi.getTime()>=earliestTime)) &&
		        		((!_this.latest)||(cmpLo.getTime()<=latestTime)) );
            if ( cmpLo.getSeconds() < 50 )
            {
		        cmpLo.setSeconds( cmpLo.getSeconds()+10 );
		        cmpHi.setSeconds( cmpHi.getSeconds()+10 );
            }
		      } );
		    cmpLo.setSeconds( Math.floor(this.time.getSeconds()/10)*10 );
		    cmpHi.setSeconds( Math.floor(this.time.getSeconds()/10)*10 );
		    $('#'+this.id+' .AnyTime-sec-one-btn:not(.AnyTime-sec-one-btn-empty)').each(
		      function()
		      {
		        $(this).AnyTime_current( this.innerHTML == ones,
		        		((!_this.earliest)||(cmpHi.getTime()>=earliestTime)) &&
		        		((!_this.latest)||(cmpLo.getTime()<=latestTime)) );
		        cmpLo.setSeconds( cmpLo.getSeconds()+1 );
		        cmpHi.setSeconds( cmpHi.getSeconds()+1 );
		      } );

		    //  Update offset (time zone).

		    if ( this.oConv )
		    {
			    this.oConv.setUtcFormatOffsetAlleged(this.offMin);
			    this.oConv.setUtcFormatOffsetSubIndex(this.offSI);
			    var tzs = this.oConv.format(this.time);
			    this.oCur.html( tzs );
		    }

		    //	Set the focus element, then size the picker according to its
		    //	components, show the changes, and invoke Ajax if desired.

		    if ( fBtn )
		    	this.setFocus(fBtn);

            this.conv.setUtcFormatOffsetAlleged(this.offMin);
		    this.conv.setUtcFormatOffsetSubIndex(this.offSI);
		    this.updVal(this.conv.format(this.time));
		    this.div.show();

        if ( this.dO ) // fit offset button
        {
          this.oCur.css('width','0');
          var curW = this.dT.width()-this.oMinW;
          if ( curW < 40 )
            curW = 40;
          this.oCur.css('width',String(curW)+'px');
        }

		    if ( ! this.pop )
		      this.ajax();

		}, // .upd()

		//---------------------------------------------------------------------
		//  .updODiv() updates the UTC offset selector's appearance.  It is
		//	called after most events to make the picker reflect the currently-
		//	selected values. fBtn is the psuedo-button to be given focus.
		//---------------------------------------------------------------------

		updODiv: function(fBtn)
		{
            var cur, matched = false, def = null;
		    this.oDiv.find('.AnyTime-off-off-btn').each(
		      function()
		      {
		    	  if ( this.AnyTime_offMin == _this.offMin )
		    	  {
		    		  if ( this.AnyTime_offSI == _this.offSI )
		    			  $(this).AnyTime_current(matched=true,true);
		    		  else
		    	      {
		    			  $(this).AnyTime_current(false,true);
		    			  if ( def == null )
			    			  def = $(this);
		    	      }
		    	  }
		    	  else
	    			  $(this).AnyTime_current(false,true);
		      } );
		    if ( ( ! matched ) && ( def != null ) )
		    	def.AnyTime_current(true,true);

		    //  Show change

            this.conv.setUtcFormatOffsetAlleged(this.offMin);
            this.conv.setUtcFormatOffsetSubIndex(this.offSI);
		    this.updVal(this.conv.format(this.time));
		    this.upd(fBtn);

		}, // .updODiv()

		//---------------------------------------------------------------------
		//  .updYDiv() updates the year selector's appearance.  It is
		//	called after most events to make the picker reflect the currently-
		//	selected values. fBtn is the psuedo-button to be given focus.
		//---------------------------------------------------------------------

		updYDiv: function(fBtn)
		{
		    var i, legal;
			var era = 1;
		    var yearValue = this.time.getFullYear();
		    if ( yearValue < 0 )
		    {
		      era = (-1);
		      yearValue = 0 - yearValue;
		    }
		    yearValue = AnyTime.pad( yearValue, 4 );
		    var eY = _this.earliest && _this.earliest.getFullYear();
		    var lY = _this.latest && _this.latest.getFullYear();

		    i = 0;
		    this.yDiv.find('.AnyTime-mil-btn').each(
		      function()
		      {
		    	legal = ( ((!_this.earliest)||(era*(i+(era<0?0:999))>=eY)) && ((!_this.latest)||(era*(i+(era>0?0:999))<=lY)) );
		        $(this).AnyTime_current( this.innerHTML == yearValue.substring(0,1), legal );
		        i += 1000;
		      } );

		    i = (Math.floor(yearValue/1000)*1000);
		    this.yDiv.find('.AnyTime-cent-btn').each(
		      function()
		      {
			    	legal = ( ((!_this.earliest)||(era*(i+(era<0?0:99))>=eY)) && ((!_this.latest)||(era*(i+(era>0?0:99))<=lY)) );
		        $(this).AnyTime_current( this.innerHTML == yearValue.substring(1,2), legal );
		        i += 100;
		      } );

		    i = (Math.floor(yearValue/100)*100);
		    this.yDiv.find('.AnyTime-dec-btn').each(
		      function()
		      {
			    	legal = ( ((!_this.earliest)||(era*(i+(era<0?0:9))>=eY)) && ((!_this.latest)||(era*(i+(era>0?0:9))<=lY)) );
		        $(this).AnyTime_current( this.innerHTML == yearValue.substring(2,3), legal );
		        i += 10;
		      } );

		    i = (Math.floor(yearValue/10)*10);
		    this.yDiv.find('.AnyTime-yr-btn').each(
		      function()
		      {
			    legal = ( ((!_this.earliest)||(era*i>=eY)) && ((!_this.latest)||(era*i<=lY)) );
		        $(this).AnyTime_current( this.innerHTML == yearValue.substring(3), legal );
		        i += 1;
	          } );

		    this.yDiv.find('.AnyTime-bce-btn').each(
		      function()
		      {
		    	  $(this).AnyTime_current( era < 0, (!_this.earliest) || ( _this.earliest.getFullYear() < 0 ) );
		      } );
		    this.yDiv.find('.AnyTime-ce-btn').each(
		      function()
		      {
		    	$(this).AnyTime_current( era > 0, (!_this.latest) || ( _this.latest.getFullYear() > 0 ) );
		      } );

		    //  Show change

            this.conv.setUtcFormatOffsetAlleged(this.offMin);
            this.conv.setUtcFormatOffsetSubIndex(this.offSI);
		    this.updVal(this.conv.format(this.time));
		    this.upd(fBtn);

		}, // .updYDiv()

		//---------------------------------------------------------------------
		//  .updVal() updates the input value, but only if it's different
		//	than the previous value. It also triggers a change() event if
		//	the value is updated.
		//---------------------------------------------------------------------

		updVal: function(val)
		{
		    if ( this.inp.val() != val ) {
		      this.inp.val(val);
		      this.inp.change();
          }
    }

	}; // __pickers[id] = ...
	__pickers[id].initialize(id);

} // AnyTime.picker =

//=============================================================================
//  AnyTime.setCurrent()
//
//  Updates the current date/time for the picker attached to a specified
//  text field.  This also sets the value of the text field.
//=============================================================================

AnyTime.setCurrent = function( id, newTime )
{
  __pickers[id].setCurrent(newTime)
};


//=============================================================================
//  AnyTime.setEarliest()
//
//  Updates the earliest date/time for the picker attached to a specified
//  text field.
//=============================================================================

AnyTime.setEarliest = function( id, newTime )
{
  __pickers[id].setEarliest(newTime)
};


//=============================================================================
//  AnyTime.setLatest()
//
//  Updates the latest date/time for the picker attached to a specified
//  text field.
//=============================================================================

AnyTime.setLatest = function( id, newTime )
{
  __pickers[id].setLatest(newTime)
};


})(jQuery); // function($)...


//
//  END OF FILE
//

/*global LivepressConfig, lp_strings, Livepress, datetimepicker  */

jQuery(document).ready(function () {

    if ('undefined' === typeof( LivepressConfig ) ) {

        return;
    }
    // check we have the metabox showning
    if ( ! jQuery( '#lp-json-ld-config' ).length ) {

        return;
    }

    jQuery( '#LP_json_ld_coverage_start_time' ).on( 'change', function () {
        var $start_date = jQuery('#LP_json_ld_parent_start_date');
        var $coverage_start_time = jQuery('#LP_json_ld_coverage_start_time');
        var coverage_start_time_val = $coverage_start_time.val();

        if ('' === $start_date.val()) {
            $start_date.val(coverage_start_time_val);
        }
    });
    var $date_inputs = jQuery( '#LP_json_ld_parent_start_date, #LP_json_ld_coverage_start_time, #LP_json_ld_coverage_end_time' );
    $date_inputs.on( 'mousedown', function (e) {
        var $target = jQuery(e.currentTarget);

        if ('' === $target.val()) {
            var d = new Date();
            $target.val(
                d.getFullYear() + '-' +
                ( '0' + (d.getMonth() + 1 ) ).slice(-2) + '-' +
                ( '0' + d.getDate() ).slice(-2) + ' ' +
                ( '0' + ( d.getHours() + 1 ) ).slice(-2) +
                ":00:00 " +
                LivepressConfig.timezone_string_short
            );
        }
    });

    $date_inputs.AnyTime_picker({
        format: "%m-%d-%Y %H:%i %@",
        formatUtcOffset: "%: (%@)",
        utcFormatOffsetImposed: LivepressConfig.gmt_offset_in_minutes,
        utcParseOffsetAssumed: LivepressConfig.gmt_offset_in_minutes
    });

    jQuery('#LP_json_ld_parent_start_date_clear, #LP_json_ld_coverage_start_time_clear, #LP_json_ld_coverage_end_time_clear').on( 'click', function (e) {
        e.preventDefault();
        var target_id = '#' + this.id.replace('_clear', '');
        jQuery( target_id ).val('');
    });
});