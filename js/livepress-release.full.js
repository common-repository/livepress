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
/*!
 * jQuery.scrollTo
 * Copyright (c) 2007-2015 Ariel Flesler - aflesler ○ gmail • com | http://flesler.blogspot.com
 * Licensed under MIT
 * http://flesler.blogspot.com/2007/10/jqueryscrollto.html
 * @projectDescription Lightweight, cross-browser and highly customizable animated scrolling with jQuery
 * @author Ariel Flesler
 * @version 2.1.2
 */
;(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery'], factory);
    } else if (typeof module !== 'undefined' && module.exports) {
        // CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Global
        factory(jQuery);
    }
})(function($) {
    'use strict';

    var $scrollTo = $.scrollTo = function(target, duration, settings) {
        return $(window).scrollTo(target, duration, settings);
    };

    $scrollTo.defaults = {
        axis:'xy',
        duration: 0,
        limit:true
    };

    function isWin(elem) {
        return !elem.nodeName ||
            $.inArray(elem.nodeName.toLowerCase(), ['iframe','#document','html','body']) !== -1;
    }

    $.fn.scrollTo = function(target, duration, settings) {
        if (typeof duration === 'object') {
            settings = duration;
            duration = 0;
        }
        if (typeof settings === 'function') {
            settings = { onAfter:settings };
        }
        if (target === 'max') {
            target = 9e9;
        }

        settings = $.extend({}, $scrollTo.defaults, settings);
        // Speed is still recognized for backwards compatibility
        duration = duration || settings.duration;
        // Make sure the settings are given right
        var queue = settings.queue && settings.axis.length > 1;
        if (queue) {
            // Let's keep the overall duration
            duration /= 2;
        }
        settings.offset = both(settings.offset);
        settings.over = both(settings.over);

        return this.each(function() {
            // Null target yields nothing, just like jQuery does
            if (target === null) return;

            var win = isWin(this),
                elem = win ? this.contentWindow || window : this,
                $elem = $(elem),
                targ = target,
                attr = {},
                toff;

            switch (typeof targ) {
                // A number will pass the regex
                case 'number':
                case 'string':
                    if (/^([+-]=?)?\d+(\.\d+)?(px|%)?$/.test(targ)) {
                        targ = both(targ);
                        // We are done
                        break;
                    }
                    // Relative/Absolute selector
                    targ = win ? $(targ) : $(targ, elem);
                /* falls through */
                case 'object':
                    if (targ.length === 0) return;
                    // DOMElement / jQuery
                    if (targ.is || targ.style) {
                        // Get the real position of the target
                        toff = (targ = $(targ)).offset();
                    }
            }

            var offset = $.isFunction(settings.offset) && settings.offset(elem, targ) || settings.offset;

            $.each(settings.axis.split(''), function(i, axis) {
                var Pos	= axis === 'x' ? 'Left' : 'Top',
                    pos = Pos.toLowerCase(),
                    key = 'scroll' + Pos,
                    prev = $elem[key](),
                    max = $scrollTo.max(elem, axis);

                if (toff) {// jQuery / DOMElement
                    attr[key] = toff[pos] + (win ? 0 : prev - $elem.offset()[pos]);

                    // If it's a dom element, reduce the margin
                    if (settings.margin) {
                        attr[key] -= parseInt(targ.css('margin'+Pos), 10) || 0;
                        attr[key] -= parseInt(targ.css('border'+Pos+'Width'), 10) || 0;
                    }

                    attr[key] += offset[pos] || 0;

                    if (settings.over[pos]) {
                        // Scroll to a fraction of its width/height
                        attr[key] += targ[axis === 'x'?'width':'height']() * settings.over[pos];
                    }
                } else {
                    var val = targ[pos];
                    // Handle percentage values
                    attr[key] = val.slice && val.slice(-1) === '%' ?
                    parseFloat(val) / 100 * max
                        : val;
                }

                // Number or 'number'
                if (settings.limit && /^\d+$/.test(attr[key])) {
                    // Check the limits
                    attr[key] = attr[key] <= 0 ? 0 : Math.min(attr[key], max);
                }

                // Don't waste time animating, if there's no need.
                if (!i && settings.axis.length > 1) {
                    if (prev === attr[key]) {
                        // No animation needed
                        attr = {};
                    } else if (queue) {
                        // Intermediate animation
                        animate(settings.onAfterFirst);
                        // Don't animate this axis again in the next iteration.
                        attr = {};
                    }
                }
            });

            animate(settings.onAfter);

            function animate(callback) {
                var opts = $.extend({}, settings, {
                    // The queue setting conflicts with animate()
                    // Force it to always be true
                    queue: true,
                    duration: duration,
                    complete: callback && function() {
                        callback.call(elem, targ, settings);
                    }
                });
                $elem.animate(attr, opts);
            }
        });
    };

    // Max scrolling position, works on quirks mode
    // It only fails (not too badly) on IE, quirks mode.
    $scrollTo.max = function(elem, axis) {
        var Dim = axis === 'x' ? 'Width' : 'Height',
            scroll = 'scroll'+Dim;

        if (!isWin(elem))
            return elem[scroll] - $(elem)[Dim.toLowerCase()]();

        var size = 'client' + Dim,
            doc = elem.ownerDocument || elem.document,
            html = doc.documentElement,
            body = doc.body;

        return Math.max(html[scroll], body[scroll]) - Math.min(html[size], body[size]);
    };

    function both(val) {
        return $.isFunction(val) || $.isPlainObject(val) ? val : { top:val, left:val };
    }

    // Add special hooks so that window scroll properties can be animated
    $.Tween.propHooks.scrollLeft =
        $.Tween.propHooks.scrollTop = {
            get: function(t) {
                return $(t.elem)[t.prop]();
            },
            set: function(t) {
                var curr = this.get(t);
                // If interrupt is true and user scrolled, stop animating
                if (t.options.interrupt && t._last && t._last !== curr) {
                    return $(t.elem).stop();
                }
                var next = Math.round(t.now);
                // Don't waste CPU
                // Browsers don't render floating point scroll
                if (curr !== next) {
                    $(t.elem)[t.prop](next);
                    t._last = this.get(t);
                }
            }
        };

    // AMD requirement
    return $scrollTo;
});
(function (jQuery) {

	// Some named colors to work with
	// From Interface by Stefan Petre
	// http://interface.eyecon.ro/

	var colors = {
		aqua:          [0, 255, 255],
		azure:         [240, 255, 255],
		beige:         [245, 245, 220],
		black:         [0, 0, 0],
		blue:          [0, 0, 255],
		brown:         [165, 42, 42],
		cyan:          [0, 255, 255],
		darkblue:      [0, 0, 139],
		darkcyan:      [0, 139, 139],
		darkgrey:      [169, 169, 169],
		darkgreen:     [0, 100, 0],
		darkkhaki:     [189, 183, 107],
		darkmagenta:   [139, 0, 139],
		darkolivegreen:[85, 107, 47],
		darkorange:    [255, 140, 0],
		darkorchid:    [153, 50, 204],
		darkred:       [139, 0, 0],
		darksalmon:    [233, 150, 122],
		darkviolet:    [148, 0, 211],
		fuchsia:       [255, 0, 255],
		gold:          [255, 215, 0],
		green:         [0, 128, 0],
		indigo:        [75, 0, 130],
		khaki:         [240, 230, 140],
		lightblue:     [173, 216, 230],
		lightcyan:     [224, 255, 255],
		lightgreen:    [144, 238, 144],
		lightgrey:     [211, 211, 211],
		lightpink:     [255, 182, 193],
		lightyellow:   [255, 255, 224],
		lime:          [0, 255, 0],
		magenta:       [255, 0, 255],
		maroon:        [128, 0, 0],
		navy:          [0, 0, 128],
		olive:         [128, 128, 0],
		orange:        [255, 165, 0],
		pink:          [255, 192, 203],
		purple:        [128, 0, 128],
		violet:        [128, 0, 128],
		red:           [255, 0, 0],
		silver:        [192, 192, 192],
		white:         [255, 255, 255],
		yellow:        [255, 255, 0]
	};

	// Color Conversion functions from highlightFade
	// By Blair Mitchelmore
	// http://jquery.offput.ca/highlightFade/

	// Parse strings looking for color tuples [255,255,255]
	var getRGB = function (color) {
		var result;

		// Check if we're already dealing with an array of colors
		if (color && color.constructor === Array && color.length === 3) {
			return color;
		}

		// Look for rgb(num,num,num)
		if ((result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color))) {
			return [parseInt(result[1], 10), parseInt(result[2], 10), parseInt(result[3], 10)];
		}

		// Look for rgb(num%,num%,num%)
		if ((result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color))) {
			return [parseFloat(result[1]) * 2.55, parseFloat(result[2]) * 2.55, parseFloat(result[3]) * 2.55];
		}

		// Look for #a0b1c2
		if ((result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color))) {
			return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
		}

		// Look for #fff
		if ((result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color))) {
			return [parseInt(result[1] + result[1], 16), parseInt(result[2] + result[2], 16), parseInt(result[3] + result[3], 16)];
		}

		// Otherwise, we're most likely dealing with a named color
		return colors[jQuery.trim(color).toLowerCase()];
	};

	var getColor = function (elem, attr) {
		var color;

		do {
			color = jQuery.curCSS(elem, attr);

			// Keep going until we find an element that has color, or we hit the body
			if (color !== '' && color !== 'transparent' || jQuery.nodeName(elem, "body")) {
				break;
			}

			attr = "backgroundColor";
		} while ((elem = elem.parentNode));

		return getRGB(color);
	};

	// We override the animation for all of these color styles
	jQuery.each(['backgroundColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderTopColor', 'color', 'outlineColor'], function (i, attr) {
		jQuery.fx.step[attr] = function (fx) {
			if (fx.start === undefined) {
				fx.start = getColor(fx.elem, attr);
				fx.end = getRGB(fx.end);
			}

			fx.elem.style[attr] = "rgb(" + [
				Math.max(Math.min(parseInt((fx.pos * (fx.end[0] - fx.start[0])) + fx.start[0], 10), 255), 0),
				Math.max(Math.min(parseInt((fx.pos * (fx.end[1] - fx.start[1])) + fx.start[1], 10), 255), 0),
				Math.max(Math.min(parseInt((fx.pos * (fx.end[2] - fx.start[2])) + fx.start[2], 10), 255), 0)
			].join(",") + ")";
		};
	});

}(jQuery));
/*global window, jQuery, console, alert */
(function($) {
	$.gritter = {};

	$.gritter.options = {
		fade_in_speed: 'fast',
		fade_out_speed: 500,
		time: 1000
	};
	var Gritter = {
		fade_in_speed: '',
		fade_out_speed: '',
		time: '',
		_custom_timer: 0,
		_item_count: 0,
		_is_setup: 0,
		_tpl_control: '<div class = "gritter-control"><div class ="gritter-scroll">Scroll to Comment</div><div class ="gritter-settings"></div><div class="gritter-close"></div></div>',
		_tpl_item: '<div id="gritter-item-[[number]]" class="gritter-item-wrapper gritter-item [[item_class]] [[class_name]] [[comment_container_id]]" style="display:none"><div class="gritter-top"></div><div class="gritter-inner"><div class = "gritter-control"><div class ="gritter-scroll">Scroll to Comment</div><div class ="gritter-settings"></div><div class="gritter-close"></div></div>[[image]]<span class="gritter-title">[[username]]</span><div class="lp-date">[[date]]</div><p>[[text]]</p>[[comments]]<div class="bubble-point"></div></div><div class="gritter-bot"></div></div>',
		_tpl_wrap: '<div id="gritter-notice-wrapper"></div>',
		add: function(params) {
			//if (!params.title || ! params.text) {
				/*throw'You need to fill out the first 2 params: "title" and "text"';*/
			//}
			if (!params.title) {
				params.title = "";
			}
			if (!params.text) {
				params.text = "";
			}
			if (!this._is_setup) {
				this._runSetup();
			}
			var user = params.title,
			commentContainerId = params.commentContainerId,
			text = params.text,
			date = params.date,
			image = params.image,
			comments = params.comments || '',
			sticky = params.sticky || false,
			item_class = params.class_name || '',
			time_alive = params.time || '';
			this._verifyWrapper();
			this._item_count+=1;
			var number = this._item_count,
			tmp = this._tpl_item;
			$(['before_open', 'after_open', 'before_close', 'after_close']).each(function(i, val) {
				Gritter['_' + val + '_' + number] = ($.isFunction(params[val])) ? params[val] : function() {};
			});
			this._custom_timer = 0;
			if (time_alive) {
				this._custom_timer = time_alive;
			}
			if (image === undefined) {
				image = '';
			}
			var image_str = (!image) ? '' : '<img src="' + image + '" class="gritter-image" />',
				class_name = (!image) ? 'gritter-without-image' : 'gritter-with-image';
			tmp = this._str_replace(['[[username]]', '[[text]]', '[[date]]', '[[image]]', '[[number]]', '[[class_name]]', '[[item_class]]', '[[comments]]', '[[comment_container_id]]'], [user, text, date, image_str, this._item_count, class_name, item_class, comments, commentContainerId], tmp);
			this['_before_open_' + number]();
			$('#gritter-notice-wrapper').prepend(tmp);
			var item = $('#gritter-item-' + this._item_count);
			var scrollDiv = $(item.find(".gritter-scroll"));

			/* handle scroll to comment in gritter bubble
  * use passed callback if any. Used on pages where dynamic appearing of
  * comments is turned off. See ui-controller.js comment_update function.
  */
			if (jQuery.isFunction(params.scrollToCallback)) {
				scrollDiv.bind('click', params.scrollToCallback);
				if (params.scrollToText) {
					scrollDiv.text(params.scrollToText);
				}
			} else {
				scrollDiv.bind('click', function(e) {
					var div = jQuery(jQuery(e.target).parents(".gritter-item-wrapper")[0]);
					var classList = div.attr('class').split(/\s+/);

					// looking for class with id of comment it refers to
					jQuery.each(classList, function(index, item) {
						var commentId = item.match(/comment\-/);
						if (commentId !== null) {
							jQuery.scrollTo(jQuery("#" + item), 900);
							return;
						}
					});
				});
			}

			item.fadeIn(this.fade_in_speed, function() {
				Gritter['_after_open_' + number]($(this));
			});
			if (!sticky) {
				this._setFadeTimer(item, number);
			}
			$(item).bind('mouseenter mouseleave', function(event) {
				if (event.type === 'mouseenter') {
					if (!sticky) {
						Gritter._restoreItemIfFading($(this), number);
					}
				}

				else {
					if (!sticky) {
						Gritter._setFadeTimer($(this), number);
					}
				}
				Gritter._hoverState($(this), event.type);
			});
			return number;
		},
		_countRemoveWrapper: function(unique_id, e) {
			e.remove();
			this['_after_close_' + unique_id](e);
			if ($('.gritter-item-wrapper').length === 0) {
				$('#gritter-notice-wrapper').remove();
			}
		},
		_fade: function(e, unique_id, params, unbind_events) {
			params = params || {};
			var fade = (typeof(params.fade) !== 'undefined') ? params.fade: true,
				fade_out_speed = params.speed || this.fade_out_speed;
			this['_before_close_' + unique_id](e);
			if (unbind_events) {
				e.unbind('mouseenter mouseleave');
			}
			if (fade) {
				e.animate({	opacity: 0 }, fade_out_speed, function() {
					e.animate({ height: 0 }, 300, function() {
						Gritter._countRemoveWrapper(unique_id, e);
					});
				});
			}
			else {
				this._countRemoveWrapper(unique_id, e);
			}
		},
		_hoverState: function(e, type) {
			if (type === 'mouseenter') {
				e.addClass('hover');
				var control = e.find('.gritter-control');
				control.show();
				e.find('.gritter-close').click(function() {
					var unique_id = e.attr('id').split('-')[2];
					Gritter.removeSpecific(unique_id, {},
					e, true);
				});
			}
			else {
				e.removeClass('hover');
				e.find('.gritter-control').hide();
			}
		},
		removeSpecific: function(unique_id, params, e, unbind_events) {
			if (!e) {
				e = $('#gritter-item-' + unique_id);
			}
			this._fade(e, unique_id, params || {},
			unbind_events);
		},
		_restoreItemIfFading: function(e, unique_id) {
			clearTimeout(this['_int_id_' + unique_id]);
			e.stop().css({
				opacity: ''
			});
		},
		_runSetup: function() {
			var opt;
			for (opt in $.gritter.options) {
				if ($.gritter.options.hasOwnProperty(opt)) {
					this[opt] = $.gritter.options[opt];
				}
			}
			this._is_setup = 1;
		},
		_setFadeTimer: function(e, unique_id) {
			var timer_str = (this._custom_timer) ? this._custom_timer: this.time;
			this['_int_id_' + unique_id] = setTimeout(function() {
				Gritter._fade(e, unique_id);
			},
			timer_str);
		},
		stop: function(params) {
			var before_close = ($.isFunction(params.before_close)) ? params.before_close: function() {};

			var after_close = ($.isFunction(params.after_close)) ? params.after_close: function() {};

			var wrap = $('#gritter-notice-wrapper');
			before_close(wrap);
			wrap.fadeOut(function() {
				$(this).remove();
				after_close();
			});
		},
		_str_replace: function(search, replace, subject, count) {
			var i = 0,
			j = 0,
			temp = '',
			repl = '',
			sl = 0,
			fl = 0,
			f = [].concat(search),
			r = [].concat(replace),
			s = subject,
			ra = r instanceof Array,
			sa = s instanceof Array;
			s = [].concat(s);
			if (count) {
				this.window[count] = 0;
			}
			for (i = 0, sl = s.length; i < sl; i++) {
				if (s[i] === '') {
					continue;
				}
				for (j = 0, fl = f.length; j < fl; j++) {
					temp = s[i] + '';
					repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0];
					s[i] = (temp).split(f[j]).join(repl);
					if (count && s[i] !== temp) {
						this.window[count] += (temp.length - s[i].length) / f[j].length;
					}
				}
			}
			return sa ? s: s[0];
		},
		_verifyWrapper: function() {
			if ($('#gritter-notice-wrapper').length === 0) {
				$('body').append(this._tpl_wrap);
			}
		}
	};
	$.gritter.add = function(params) {
		try {
			return Gritter.add(params || {});
		} catch(e) {
			var err = 'Gritter Error: ' + e;
			if(typeof(console) !== 'undefined' && console.error) {
				console.error(err, params);
			} else {
			   alert(err);
			}
		}
	};
	$.gritter.remove = function(id, params) {
		Gritter.removeSpecific(id, params || {});
	};
	$.gritter.removeAll = function(params) {
		Gritter.stop(params || {});
	};
} (jQuery));


(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function ($) {
  $.timeago = function(timestamp) {
    if (timestamp instanceof Date) {
      return inWords(timestamp);
    } else if (typeof timestamp === "string") {
      return inWords($.timeago.parse(timestamp));
    } else if (typeof timestamp === "number") {
      return inWords(new Date(timestamp));
    } else {
      return inWords($.timeago.datetime(timestamp));
    }
  };
  var $t = $.timeago;

  $.extend($.timeago, {
    settings: {
      refreshMillis: 60000,
      allowPast: true,
      allowFuture: false,
      localeTitle: false,
      cutoff: 0,
      strings: {
        prefixAgo: null,
        prefixFromNow: null,
        suffixAgo: "ago",
        suffixFromNow: "from now",
        inPast: 'any moment now',
        seconds: "less than a minute",
        minute: "about a minute",
        minutes: "%d minutes",
        hour: "about an hour",
        hours: "about %d hours",
        day: "a day",
        days: "%d days",
        month: "about a month",
        months: "%d months",
        year: "about a year",
        years: "%d years",
        wordSeparator: " ",
        numbers: []
      }
    },

    inWords: function(distanceMillis) {
      if(!this.settings.allowPast && ! this.settings.allowFuture) {
          throw 'timeago allowPast and allowFuture settings can not both be set to false.';
      }

      var $l = this.settings.strings;
      var prefix = $l.prefixAgo;
      var suffix = $l.suffixAgo;
      if (this.settings.allowFuture) {
        if (distanceMillis < 0) {
          prefix = $l.prefixFromNow;
          suffix = $l.suffixFromNow;
        }
      }

      if(!this.settings.allowPast && distanceMillis >= 0) {
        return this.settings.strings.inPast;
      }

      var seconds = Math.abs(distanceMillis) / 1000;
      var minutes = seconds / 60;
      var hours = minutes / 60;
      var days = hours / 24;
      var years = days / 365;

      function substitute(stringOrFunction, number) {
        var string = $.isFunction(stringOrFunction) ? stringOrFunction(number, distanceMillis) : stringOrFunction;
        var value = ($l.numbers && $l.numbers[number]) || number;
        return string.replace(/%d/i, value);
      }

      var words = seconds < 45 && substitute($l.seconds, Math.round(seconds)) ||
        seconds < 90 && substitute($l.minute, 1) ||
        minutes < 45 && substitute($l.minutes, Math.round(minutes)) ||
        minutes < 90 && substitute($l.hour, 1) ||
        hours < 24 && substitute($l.hours, Math.round(hours)) ||
        hours < 42 && substitute($l.day, 1) ||
        days < 30 && substitute($l.days, Math.round(days)) ||
        days < 45 && substitute($l.month, 1) ||
        days < 365 && substitute($l.months, Math.round(days / 30)) ||
        years < 1.5 && substitute($l.year, 1) ||
        substitute($l.years, Math.round(years));

      var separator = $l.wordSeparator || "";
      if ($l.wordSeparator === undefined) { separator = " "; }
      return $.trim([prefix, words, suffix].join(separator));
    },

    parse: function(iso8601) {
      var s = $.trim(iso8601);
      s = s.replace(/\.\d+/,""); // remove milliseconds
      s = s.replace(/-/,"/").replace(/-/,"/");
      s = s.replace(/T/," ").replace(/Z/," UTC");
      s = s.replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2"); // -04:00 -> -0400
      s = s.replace(/([\+\-]\d\d)$/," $100"); // +09 -> +0900
      return new Date(s);
    },
    datetime: function(elem) {
      var iso8601 = $t.isTime(elem) ? $(elem).attr("datetime") : $(elem).attr("title");
      return $t.parse(iso8601);
    },
    isTime: function(elem) {
      // jQuery's `is()` doesn't play well with HTML5 in IE
      return $(elem).get(0).tagName.toLowerCase() === "time"; // $(elem).is("time");
    }
  });

  // functions that can be called via $(el).timeago('action')
  // init is default when no action is given
  // functions are called with context of a single element
  var functions = {
    init: function(){
      var refresh_el = $.proxy(refresh, this);
      refresh_el();
      var $s = $t.settings;
      if ($s.refreshMillis > 0) {
        this._timeagoInterval = setInterval(refresh_el, $s.refreshMillis);
      }
    },
    update: function(time){
      var parsedTime = $t.parse(time);
      $(this).data('timeago', { datetime: parsedTime });
      if($t.settings.localeTitle) $(this).attr("title", parsedTime.toLocaleString());
      refresh.apply(this);
    },
    updateFromDOM: function(){
      $(this).data('timeago', { datetime: $t.parse( $t.isTime(this) ? $(this).attr("datetime") : $(this).attr("title") ) });
      refresh.apply(this);
    },
    dispose: function () {
      if (this._timeagoInterval) {
        window.clearInterval(this._timeagoInterval);
        this._timeagoInterval = null;
      }
    }
  };

  $.fn.timeago = function(action, options) {
    var fn = action ? functions[action] : functions.init;
    if(!fn){
      throw new Error("Unknown function name '"+ action +"' for timeago");
    }
    // each over objects here and call the requested function
    this.each(function(){
      fn.call(this, options);
    });
    return this;
  };

  function refresh() {
    //check if it's still visible
    if(!$.contains(document.documentElement,this)){
      //stop if it has been removed
      $(this).timeago("dispose");
      return this;
    }

    var data = prepareData(this);
    var $s = $t.settings;

    if (!isNaN(data.datetime)) {
      if ( $s.cutoff == 0 || Math.abs(distance(data.datetime)) < $s.cutoff) {
        $(this).text(inWords(data.datetime));
      }
    }
    return this;
  }

  function prepareData(element) {
    element = $(element);
    if (!element.data("timeago")) {
      element.data("timeago", { datetime: $t.datetime(element) });
      var text = $.trim(element.text());
      if ($t.settings.localeTitle) {
        element.attr("title", element.data('timeago').datetime.toLocaleString());
      } else if (text.length > 0 && !($t.isTime(element) && element.attr("title"))) {
        element.attr("title", text);
      }
    }
    return element.data("timeago");
  }

  function inWords(date) {
    return $t.inWords(distance(date));
  }

  function distance(date) {
    return (new Date().getTime() - date.getTime());
  }

  // fix for IE6 suckage
  document.createElement("abbr");
  document.createElement("time");
}));

/*global lp_client_strings, LivepressConfig, Livepress, console */
Livepress.Ui = {};

Livepress.Ui.View = function( disable_comments ) {
	var self = this;

	// LP Bar
	var $livepress = jQuery( '#livepress' );
	var $commentsCount = $livepress.find( '.lp-comments-count' );
	var $updatesCount = $livepress.find( '.lp-updates-count' );
	var $settingsButton = $livepress.find( '.lp-settings-button' );
	var $lpBarBox = $livepress.find( '.lp-bar' );
	var $settingsBox = jQuery( '#lp-settings' );

	this.set_comment_num = function( count ) {
		var oldCount = $commentsCount.html();
		$commentsCount.html( parseInt( count, 10 ) );
		if ( oldCount !== count ) {
			$commentsCount.parent().animate({ color:'#ffff66' }, 200 ).animate({ color:'#ffffff' }, 800 );
		}
	};

	this.set_live_updates_num = function( count ) {
		$updatesCount.html( parseInt( count, 10 ) );
	};

	// Settings Elements
	//$settingsBox.appendTo('body');

	var $exitButton = $settingsBox.find( '.lp-settings-close' );
	var $settingsTabs = $settingsBox.find( '.lp-tab' );
	var $settingsPanes = $settingsBox.find( '.lp-pane' );

	// Settings controls
	var $expandOptionsButton = $settingsBox.find( '.lp-button.lp-expand-options' );
	var $soundCheckbox = $settingsBox.find( 'input[name=lp-setting-sound]' );
	var $updatesCheckbox = $settingsBox.find( 'input[name=lp-setting-updates]' );
	var $commentsCheckbox = $settingsBox.find( 'input[name=lp-setting-comments]' );
	var $scrollCheckbox = $settingsBox.find( 'input[name=lp-setting-scroll]' );
	var $updateSettingsButton = $settingsBox.find( '.lp-button.lp-update-settings' );
	var $optionsExtBox = $settingsBox.find( '.lp-options-ext' );
	var $optionsShortBox = $settingsBox.find( '.lp-settings-short' );

	if ( disable_comments ) {
		$lpBarBox.find( '.lp-sprite.comments' ).hide();
		$commentsCount.parent().hide();
		$commentsCheckbox.parent().hide();
	}

	var window_height = function() {
		var de = document.documentElement;
		return self.innerHeight || ( de && de.clientHeight ) || document.body.clientHeight;
	};

	var window_width = function() {
		var de = document.documentElement;
		return self.innerWidth || ( de && de.clientWidth ) || document.body.clientWidth;
	};

	var control = function( initial, $checkbox, fOn, fOff ) {
		$checkbox.prop( 'checked', initial ).change(function() {
			return $checkbox.is( ':checked' ) ? fOn( 1 ) : fOff( 1 );
		});
		return initial ? fOn() : fOff();
	};

	this.follow_comments_control = function( init, fOn, fOff ) {
		control( init, $commentsCheckbox, fOn, fOff );
	};

	//
	// Connection status
	//
	var $updatesStatus = $settingsBox.find( '.live-updates-status' );
	var $counters = $lpBarBox.find( '.lp-counter' );

	this.connected = function() {
		$updatesStatus.text( 'ON' );
		$counters.removeClass( 'lp-off' ).addClass( 'lp-on' );
		$lpBarBox.find( '.lp-logo' ).attr( 'title', 'Connected' );
	};

	this.disconnected = function() {
		$updatesStatus.text( 'OFF' );
		$counters.removeClass( 'lp-on' ).addClass( 'lp-off' );
		$lpBarBox.find( '.lp-logo' ).attr( 'title', 'Not Connected' );
	};

	//
	// Live notifications
	//
	this.comment_alert = function( options, date ) {

		var container = jQuery( '<div>' );
		var dateEl = jQuery( '<abbr>' ).attr( 'class', 'timeago' ).attr( 'title', date ).text( date.replace( /Z/, ' UTC' ) );
		container.append( dateEl );
		var defaults = {
			class_name:'comment',
			date:      container.html(),
			time:      7000
		};

		jQuery.gritter.add( jQuery.extend({}, defaults, options ) );
		jQuery( '.gritter-comments .add-comment' ).click(function() {
			jQuery().scrollTo( '#respond, #commentform, #submit', 900 );
		});
    jQuery( 'abbr.livepress-timestamp' ).timeago().attr( 'title', '' );
	};
};

Livepress.Ui.UpdateBoxView = function( homepage_mode ) {
	if ( typeof( homepage_mode ) === 'undefined' ) {
		homepage_mode = true;
	}

	var update_box_html = [
		'<div class="update-box-content">',
		'<div class="lp-update-count">',
		'<strong class="lp-update-num">0</strong>',
		'<strong class="lp-update-new-update"> ' + lp_client_strings.new_updates + '. </strong>',
		'<a href="javascript:location.reload();" class="lp-refresher">' + lp_client_strings.refresh + '</a> ' + lp_client_strings.to_see + ' <span class="lp-update-it-them">' + lp_client_strings.them + '</span>.',
		'</div>',
		'<div class="lp-balloon">',
		'<img class="lp-close-button" title="Close" />',
		'<ul class="lp-new-posts"></ul>',
		'<a class="lp-more-link" href="javascript:location.reload();">+ more</a>',
		'<div class="lp-balloon-tail">&nbsp;</div>',
		'</div>',
		'</div>',
		'<div class="clear"></div>'
	].join( '' );

	var update_box_classes = '.livepress lp-update-container';

	var $update_box = jQuery( '#lp-update-box' );
	$update_box.addClass( update_box_classes );
	$update_box.append( update_box_html );

	var $balloon = $update_box.find( '.lp-balloon' );

	var $new_posts_list = $update_box.find( '.lp-new-posts' );
	var $more_link = $update_box.find( '.lp-more-link' );
	var $update_num = $update_box.find( '.lp-update-num' );
	var $new_update_phrase = $update_box.find( '.lp-update-new-update' );
	var $it_them = $update_box.find( '.lp-update-it-them' );
	var $closeButton = $update_box.find( '.lp-close-button' );

	var counter = 0;

	$closeButton.click(function() {
		$balloon.fadeOut();
	});

	$closeButton.attr( 'src', LivepressConfig.lp_plugin_url + '/img/lp-settings-close.png' );

	function add_to_update_list ( li_content ) {
		var item = [
			'<li style="display:none;">',
			li_content,
			'</li>'
		].join( '' );

		counter += 1;

		if ( counter > 1 ) {
			$new_update_phrase.html( ' ' + LivepressConfig.new_updates );
			$it_them.html( 'them' );
		} else {
			$new_update_phrase.html( ' ' + LivepressConfig.new_update );
			$it_them.html( 'it' );
		}

		if ( counter > 7 ) {
			$more_link.slideDown( 300 );
		} else {
			$new_posts_list.append( item );
			var $item = $new_posts_list.find( 'li:last' );
			$item.show();

			// TODO: make li items slideDown and remain with the bullet
//        if (counter == 1) {
//          $item.show();
//        } else {
//          $item.slideDown(300);
//        }
		}
		$update_num.text( counter );

		if ( ! $update_box.is( ':visible' ) ) {
			$update_box.slideDown( 600 );
			$update_box.css( 'display', 'inline-block' );
		}
		jQuery( 'abbr.livepress-timestamp' ).timeago().attr( 'title', '' );
	}

	this.reposition_balloon = function() {
		$balloon.css( 'margin-top', -( $balloon.height() + 60 ) );
	};

	this.new_post = function( title, link, author, date ) {
		if ( date === undefined ) {
			return;
		}
		var container = jQuery( '<div>' );
		var dateEl = jQuery( '<abbr>' ).attr( 'class', 'timeago' ).attr( 'title', date ).text( date.replace( /Z/, ' UTC' ) );
		var linkEl = jQuery( '<a></a>' ).attr( 'href', link ).text( 'Update: ' + title );
		container.append( dateEl ).append( linkEl );
		add_to_update_list( container.html() );
		this.reposition_balloon();
	};

	this.post_update = function( content, date ) {
		var bestLen = 25, maxLen = 28;
		var container = jQuery( '<div>' );
		var dateEl = jQuery( '<abbr>' ).attr( 'class', 'timeago' ).attr( 'title', date ).text( date.replace( /Z/, ' UTC' ) );
		var cutPos = content.indexOf( ' ', bestLen );
		if ( cutPos === -1 ) {
			cutPos = content.length;
		}
		if ( cutPos > maxLen ) {
			cutPos = content.substr( 0, cutPos ).lastIndexOf( ' ' );
		}
		if ( cutPos === -1 || cutPos > maxLen ) {
			cutPos = maxLen;
		}
		var cut = content.substr( 0, cutPos ) + ( cutPos < content.length ? '&hellip;' : '' );
		var update = ' Update: <strong>' + cut + '</strong>';
		container.append( dateEl ).append( update );

		add_to_update_list( container.html() );
	};

	this.clear = function() {
		$more_link.hide();
		$new_posts_list.html( '' );
		counter = 0;
		$update_num.text( '0' );
		if ( $update_box.is( ':visible' ) ) {
			$update_box.slideUp( 600 );
		}
	};
};

Livepress.Ui.UpdateView = function( $element, post_link, disable_comment ) {
	var update = {};
	var $update_ui;
	var is_sticky = $element.hasClass( 'pinned-first-live-update' );

	var getTitle = function() {
		return $element.find( '.livepress-update-header' ).text();
	};

	var excerpt = function( limit ) {
		if ( is_sticky ) {
			return LivepressConfig.post_title;
		} else {
			var i;
			var filtered = $element.clone();
			filtered.find( '.livepress-meta' ).remove();
			filtered.find( '.live-update-authors' ).remove();
			filtered.find( '.live-update-livetags' ).remove();
			var text = filtered.text();
			text = filtered.text().replace( /\n/g, '' );
			text = text.replace( /\s+/, ' ' );

			var spaces = []; // Array of indices to space characters
			spaces.push( 0 );
			for ( i = 1; i < text.length; i += 1 ) {
				if ( text.charAt( i ) === ' ' ) {
					spaces.push( i );
				}
			}

			spaces.push( text.length );

			if ( text.length > limit ) {
				i = 0;
				var rbound = limit;
				// Looking for last space index within length limit
				while ( ( spaces[i] < limit ) && ( i < spaces.length - 1 ) ) {
					rbound = spaces[i];
					i += 1;
				}

				text = text.substring( 0, rbound ) + '\u2026';
			}

			return text.trim();
		}

};

	var share_container = jQuery( '<div>' ).addClass( 'lp-share' );
	if ( $update_ui === undefined ) {
		update.element = $element;
		update.id = $element.attr( 'id' );

		var metainfo = '';
		update.title = getTitle();

		update.shortExcerpt = excerpt( 100 );
		update.longExcerpt = excerpt( 1000 ) + ' ';


		// TODO: Make this customizable
		//if ( 0 < jQuery( '#' + $element.attr('id') + ' .live-update-authors').length ) {
		// var authors = [];
		// jQuery('#' + $element.attr('id') + ' .live-update-authors .live-update-author .live-author-name').each( function(){
		// authors.push( jQuery(this).text() );
		// });
		//	metainfo += lp_client_strings.by + ' ' + authors.join(', ');
		//}

		// TODO: Make this customizable
		// if ( 0 < jQuery( '#' + $element.attr('id') + ' .live-update-livetags').length ) {
		//	var tags = [];
		//	jQuery('#' + $element.attr('id') + ' .live-update-livetags .live-update-livetag').each( function(){
		//		tags.push( '%23' + jQuery(this).text() );
		//	});
		//	metainfo += ' ' + tags.join(' ');
		// }

		update.shortExcerpt += metainfo;
		update.longExcerpt += metainfo;
	}

	update.link = function() {
		if ( is_sticky ) {
			return LivepressConfig.post_url;
		} else {
			return Livepress.getUpdatePermalink( update.id );
		}
	};
	update.shortLink = function() {
		if ( is_sticky ) {
			return LivepressConfig.post_url;
		} else {
			return Livepress.getUpdateShortlink( update.id );
		}
	};

	// Get shortened URL, when done set up the sharing UI
    var types = ['facebook', 'twitter', 'hyperlink'],
        buttons = Livepress.Ui.ReactButtons( update, types );

    share_container.append( buttons );
    if ( 'true' === LivepressConfig.share_top ) {
        update.element.prepend( share_container );
    } else {
        update.element.append( share_container );
    }

    $update_ui = $element.find( '.lp-pre-update-ui' );

    if ( $element.get( 0 ) === jQuery( '.livepress-update' ).get( 0 ) ) {
        $update_ui.addClass( 'lp-first-update' );
    }
    $element.addClass( 'ui-container' );
};

Livepress.Ui.ReactButton = function( type, update ) {
	var pub = {};
	var priv = {};
	priv.btnDiv = jQuery( '<div>' ).addClass( 'lp-pu-ui-feature lp-pu-' + type );

	pub.buttonFor = function( type, update ) {
		var button = {};
		button.link = update.link;
		button.type = type;
		//Button.update_id = update.id;
		priv[type + 'Button']( button );
		return button.div;
	};

	priv.constructButtonMarkup = function() {
		// Sample markup created:
		// <span class="icon-twitter lp-pu-ico"></span>
		var btnIcon = jQuery( '<span>' ).addClass( 'lp-icon-' + type + ' lp-pu-ico' );
		return priv.btnDiv.append( btnIcon );
	};

	priv.twitterButton = function( button ) {
		button.div = priv.constructButtonMarkup();
		button.div.click(function() {

			var left = ( screen.width / 2 ) - 300,
				top = ( screen.height / 2 ) - 175,
				options = 'width=600,height=350,location=yes,,status=yes,top=' + top + ', left=' + left,
                twitterLink = update.shortLink(),
                re = /livepress-update-([0-9]+)/,
                image, imageAltText, update_id = re.exec( update.id )[1];

                var shortExcerpt = ( 3 > update.shortExcerpt.length ) ? '' : encodeURIComponent( update.shortExcerpt ) + ' ',
                    updateTitle = encodeURIComponent( update.title.trim() ),
                    description = ( '' === updateTitle ? shortExcerpt :  updateTitle + ' ' );

                // When no description is present, fall back to image alt tag if there's an image
                if ( ! description ) {
                    image = jQuery( '#livepress-update-' + update_id + ' .livepress-update-inner-wrapper img' );
                    if ( image.length ) {
                        imageAltText = image.attr( 'alt' );
                        if ( imageAltText ) {
                            description = imageAltText + ' ' ;
                            }
                        }
                }

                // Did we get the shortened link or only a promise?
                var fail_url = 'https://twitter.com/intent/tweet?text=' + description + Livepress.getUpdatePermalink( update.id );
                var twitter_popup = window.open( fail_url, '', options );

                if ( 'string' === typeof twitterLink ) {
                    twitter_popup.location = 'https://twitter.com/intent/tweet?text=' + description + twitterLink;
                } else {
                    twitterLink
                    .done( function( data ) {
                        if ( twitter_popup ) {
                            twitter_popup.location = 'https://twitter.com/intent/tweet?text=' + description + ( ( 'undefined' !== typeof data.data ) ? data.data.shortlink : Livepress.getUpdatePermalink( update.id ) );
                            if ( 'undefined' !== typeof data.data ) {
                                Livepress.updateShortlinksCache[update_id] = data.data.shortlink;
                            }
                        }
                    });
				}
                if ( twitter_popup ) {
                    twitter_popup.focus();
                }
			});
	};

	priv.facebookButton = function( button ) {
		button.div = priv.constructButtonMarkup();
		button.div.click(function() {
			// Set the Facebook link to the actual url since the app has to
			// be tied to a specific domain:

      var u = Livepress.getUpdatePermalink( update.id );

      // Lets see if this a pinned update
      var is_pinned = jQuery( this ).closest( '.pinned-first-live-update' ).length;
      if ( 1 === is_pinned ) {
          u = LivepressConfig.post_url;
      }

      var redirect_uri = u.replace( '?', '?lp_close_popup=true&' );
      var height = 436;
      var width = 626;
      var left = ( screen.width - width ) / 2;
      var top = ( screen.height - height ) / 2;
      var windowParams = 'toolbar=0, status=0, width=' + width + ', height=' + height + ', left=' + left + ', top=' + top;

      if ( 'undefined' === typeof LivepressConfig.facebook_app_id ||
           '' === LivepressConfig.facebook_app_id ) {
          window.open(
            'https://www.facebook.com/sharer.php?u=' +
            encodeURIComponent( u ),
            '',
            windowParams
          );
      } else {
          window.open(
            'https://www.facebook.com/dialog/share_open_graph?' +
            'app_id=' + LivepressConfig.facebook_app_id +
            '&display=popup' +
            '&action_type=og.likes' +
            '&action_properties=' + encodeURIComponent( '{"object":"' + u + '" }' ) +
            '&redirect_uri=' + encodeURIComponent( redirect_uri ), '', windowParams
          );
      }

			return false;
		});
	};

	priv.hyperlinkButton = function( button ) {
		button.div = priv.constructButtonMarkup();
		button.div.click(function() {
			if ( 0 === jQuery( '#' + update.id + '-share input.permalink' ).length ) {
				var d = jQuery( '<div/>' ),
						i = jQuery( '<input/>' ),
						u = update.shortLink(),
						message = jQuery( '<span/>' );

				// Did we really get a shortLink? If not, use the full link
				if ( 'string' !== typeof u ) {
					i.hide();
					u
						.done( function( data ) {
							i.show();
							i.attr( 'value', '' + ( 'undefined' !== typeof data.data ) ? data.data.shortlink : Livepress.getUpdatePermalink( update.id ) );
						})
						.fail( function() {
							i.show();
						});
				} else {
					i.attr( 'value', u );
				}

				// Input to copy the permalink url from:

				i.addClass( 'permalink' );
				i.click(function() {
					i.select();
				});

				message.text( lp_client_strings.copy_permalink );

				d.addClass( 'lp-permalink-meta' );
				d.prepend( message );
				d.prepend( i );
				jQuery( '#' + update.id + ' .lp-pre-update-ui' ).append( d );
				i.select();
			} else {
				jQuery( '#' + update.id + '-share' ).find( '.lp-permalink-meta' ).remove();
			}
			return false;
		});
	};

	return pub.buttonFor( type, update );
};

Livepress.Ui.ReactButtons = function( update, types ) {
	var container = jQuery( '<div>' ).addClass( 'lp-pre-update-ui' ).attr( 'id', update.id + '-share' );
	jQuery.each( types, function( i, v ) {
		var button = Livepress.Ui.ReactButton( v, update );
		container.append( button );
	});
	return container;
};

/**
 * Global object that controls scrolling not directly requested by user.
 * If focus is on an element that has the class lp-no-scroll scroll will
 * be disabled.
 */
(function() {
	var Scroller = function() {
		var temporary_disabled = false;

		this.settings_enabled = false;

		jQuery( 'input:text, textarea' )
			.on( 'focusin', function( e ) {
				temporary_disabled = true;
			})
			.on( 'focusout', function( e ) {
				temporary_disabled = false;
			});

		this.shouldScroll = function() {
			return this.settings_enabled && ! temporary_disabled;
		};
	};

	Livepress.Scroll = new Scroller();
}() );

/*jslint plusplus:true, vars:true */

Livepress.DOMManipulator = function( containerId, custom_background_color ) {
	this.custom_background_color = custom_background_color;

	if ( typeof containerId === 'string' ) {
		this.containerJQueryElement = jQuery( containerId );
	} else {
		this.containerJQueryElement = containerId;
	}
	this.containerElement = this.containerJQueryElement[0];
	this.cleaned_ws = false;
};

Livepress.DOMManipulator.prototype = {
	debug: false,

	log: function() {
		if ( this.debug ) {
			console.log.apply( console, arguments );
		}
	},

	/**
	 *
	 * @param operations
	 * @param options     Can have two options - effects_display, custom_scroll_class
	 */
	update: function( operations, options ) {
		options = options || {};

		this.log( 'Livepress.DOMManipulator.update begin.' );
		this.clean_updates();

		this.apply_changes( operations, options );

    // Clean the updates
    var self = this;
    self.clean_updates();

		this.log( 'Livepress.DOMManipulator.update end.' );
	},

	selector: function( partial ) {
		return this.containerJQueryElement.find( partial );
	},

	selectors: function() {
		if ( arguments.length === 0 ) {
			throw 'The method expects arguments.';
		}
		var selector = jQuery.map( arguments, function( partial ) {
			return partial;
		});
		return this.containerJQueryElement.find( selector.join( ',' ) );
	},

	clean_whitespaces: function() {
        return;
		/* If (this.cleaned_ws) {
			return false;
		}
		this.cleaned_ws = true;

		// Clean whitespace textnodes out of DOM
		var content = this.containerElement;
		this.clean_children_ws(content);

		return true; */
	},

	block_elements: function() {
		return { /* Block elements */
			'address':    1,
			'blockquote': 1,
			'center':     1,
			'dir':        1,
			'dl':         1,
			'fieldset':   1,
			'form':       1,
			'h1':         1,
			'h2':         1,
			'h3':         1,
			'h4':         1,
			'h5':         1,
			'h6':         1,
			'hr':         1,
			'isindex':    1,
			'menu':       1,
			'noframes':   1,
			'noscript':   1,
			'ol':         1,
			'p':          1,
			'pre':        1,
			'table':      1,
			'ul':         1,
			'div':        1,
			'math':       1,
			'caption':    1,
			'colgroup':   1,
			'col':        1,

			/* Considered block elements, because they may contain block elements */
			'dd':         1,
			'dt':         1,
			'frameset':   1,
			'li':         1,
			'tbody':      1,
			'td':         1,
			'thead':      1,
			'tfoot':      1,
			'th':         1,
			'tr':         1
		};
	},

	is_block_element: function( tagName ) {
		if ( typeof tagName === 'string' ) {
			return this.block_elements().hasOwnProperty( tagName.toLowerCase() );
		}
		return false;
	},

	remove_whitespace: function( node ) {
		var remove = false,
			parent = node.parentNode,
			prevSibling;

		if ( node === parent.firstChild || node === parent.lastChild ) {
			remove = true;
		} else {
			prevSibling = node.previousSibling;
			if ( prevSibling !== null && prevSibling.nodeType === 1 && this.is_block_element( prevSibling.tagName ) ) {
				remove = true;
			}
		}

		return remove;
	},

	clean_children_ws: function( parent ) {
		var remove, child;
		for ( remove = false, child = parent.firstChild; child !== null; null ) {
			if ( child.nodeType === 3 ) {
				if ( /^\s*$/.test( child.nodeValue ) && this.remove_whitespace( child ) ) {
					remove = true;
				}
			} else {
				this.clean_children_ws( child );
			}

			if ( remove ) {
				var wsChild = child;
				child = child.nextSibling;
				parent.removeChild( wsChild );
				remove = false;
			} else {
				child = child.nextSibling;
			}
		}
	},

	clean_updates: function() {
		this.log( 'DOMManipulator clean_updates.' );
		// Replace the <span>...<ins ...></span> by the content of <ins ...>
		jQuery.each( this.selector( 'span.oortle-diff-text-updated' ), function() {
			var replaceWith;
			if ( this.childNodes.length > 1 ) {
				replaceWith = this.childNodes[1];
			} else {
				replaceWith = this.childNodes[0];
			}
			if ( replaceWith.nodeType !== 8 ) { // Comment node
				replaceWith = replaceWith.childNodes[0];
			}
			this.parentNode.replaceChild( replaceWith, this );
		});

		this.selector( '.oortle-diff-changed' ).removeClass( 'oortle-diff-changed' );
		this.selector( '.oortle-diff-inserted' ).removeClass( 'oortle-diff-inserted' );
		this.selector( '.oortle-diff-inserted-block' ).removeClass( 'oortle-diff-inserted-block' );
		this.selector( '.oortle-diff-removed' ).remove();
		this.selector( '.oortle-diff-removed-block' ).remove();
	},

	process_twitter: function( el, html ) {
		if ( html.match( /<blockquote[^>]*twitter-tweet/i ) ) {
			if ( 'twttr' in window ) {
				try {
					window.twttr.events.bind(
						'loaded',
						function( event ) {
							jQuery( document ).trigger( 'live_post_update' );
						}
					);
					window.twttr.widgets.load( el );
				} catch ( e ) {}
			} else {
				try {
					if ( ! document.getElementById( 'twitter-wjs' ) ) {
						var wg = document.createElement( 'script' );
						wg.src = 'https://platform.twitter.com/widgets.js';
						wg.id = 'twitter-wjs';
						document.getElementsByTagName( 'head' )[0].appendChild( wg );
					}
				} catch ( e ) {}
			}
		}
	},

	apply_changes: function( changes, options ) {
		var $ = jQuery;
		var display_with_effects = options.effects_display || false,
			registers = [],
			i;

		this.clean_whitespaces();

		for ( i = 0; i < changes.length; i++ ) {
			this.log( 'apply changes i=', i, ' changes.length = ', changes.length );
			var change = changes[i];
			this.log( 'change[i] = ', change[i] );
			var parts, node, parent, container, childIndex, el, childRef, parent_path, content, x, inserted;
			switch ( change[0] ) {

				// ['add_class', 'element xpath', 'class name changed']
				case 'add_class':
					try {
						parts = this.get_path_parts( change[1] );
						node = this.node_at_path( parts );
						this.add_class( node, change[2] );

					} catch ( e ) {
						this.log( 'Exception on add_class: ', e );
					}
					break;

				// ['set_attr',  'element xpath', 'attr name', 'attr value']
				case 'set_attr':
					try {
						parts = this.get_path_parts( change[1] );
						node = this.node_at_path( parts );
						this.set_attr( node, change[2], change[3] );
					} catch ( esa ) {
						this.log( 'Exception on set_attr: ', esa );
					}
					break;

				// ['del_attr',  'element xpath', 'attr name']
				case 'del_attr':
					try {
						parts = this.get_path_parts( change[1] );
						node = this.node_at_path( parts );
						this.del_attr( node, change[2] );
					} catch ( eda ) {
						this.log( 'Exception on del_attr: ', eda );
					}
					break;

				// ['set_text',  'element xpath', '<span><del>old</del><ins>new</ins></span>']
				case 'set_text':
					try {
						this.set_text( change[1], change[2] );
					} catch ( est ) {
						this.log( 'Exception on set_text: ', est );
					}
					break;

				// ['del_node',  'element xpath']
				// working fine with path via #elId
				case 'del_node':
					try {
						parts = this.get_path_parts( change[1] );
						node = this.node_at_path( parts );

						if ( node.nodeType === 3 ) { // TextNode
							parent = node.parentNode;
							for ( x = 0; x < parent.childNodes.length; x++ ) {
								if ( parent.childNodes[x] === node ) {
									container = parent.ownerDocument.createElement( 'span' );
									container.appendChild( node );
									container.className = 'oortle-diff-removed';
									break;
								}
							}
							if ( x < parent.childNodes.length ) {
								parent.insertBefore( container, parent.childNodes[x] );
							} else {
								parent.appendChild( container );
							}
						} else if ( node.nodeType === 8 ) { // CommentNode
							node.parentNode.removeChild( node );
						} else {
							this.add_class( node, 'oortle-diff-removed' );
						}
					} catch ( edn ) {
						this.log( 'Exception on del_node: ', edn );
					}

					break;

				// ['push_node', 'element xpath', reg index ]
				case 'push_node':
					try {
						parts = this.get_path_parts( change[1] );
						node = this.node_at_path( parts );

						if ( node !== null ) {
							var parentNode = node.parentNode;

							this.log( 'push_node: parentNode = ', parentNode, ', node = ', node );

							registers[change[2]] = parentNode.removeChild( node );
							$( registers[change[2]] ).addClass( 'oortle-diff-inserted' );
						}
					} catch ( epn ) {
						this.log( 'Exception on push_node: ', epn );
					}

					break;

				// ['pop_node',  'element xpath', reg index ]
				case 'pop_node':
					try {
						parts = this.get_path_parts( change[1] );
						childIndex = this.get_child_index( parts );
						parent = this.node_at_path( this.get_parent_path( parts ) );

						if ( childIndex > -1 && parent !== null ) {
							el = registers[change[2]];
							childRef = parent.childNodes.length <= childIndex ? null : parent.childNodes[childIndex];

							this.log( 'pop_node', el, 'from register', change[2], 'before element', childRef, 'on index ', childIndex, ' on parent ', parent );
							inserted = parent.insertBefore( el, childRef );
							$( inserted ).addClass( 'oortle-diff-inserted' );
						}
					} catch ( epon ) {
						this.log( 'Exception on pop_node: ', epon );
					}

					break;

				// ['ins_node',  'element xpath', content]
				case 'ins_node':
					try {
						parts = this.get_path_parts( change[1] );
						childIndex = this.get_child_index( parts );
						parent_path = this.get_parent_path( parts );
						parent = this.node_at_path( parent_path );
						this.log( 'ins_node: childIndex = ', childIndex, ', parent = ', parent );

						if ( childIndex > -1 && parent !== null ) {
							el = document.createElement( 'span' );
							el.innerHTML = change[2];
							content = el.childNodes[0];
                            // Suppress duplicate insert
							if ( '' === content.id || null === document.getElementById( content.id ) ) {
                                this.process_twitter( content, change[2] );
								childRef = parent.childNodes.length <= childIndex ? null : parent.childNodes[childIndex];
								inserted = parent.insertBefore( content, childRef );
								var $inserted = $( inserted );
								$inserted.addClass( 'oortle-diff-inserted' );
								// If the update contains live tags, add the tag ids to the update data
								var $livetags = $( content ).find( 'div.live-update-livetags' );
								if ( ( 'undefined' !== typeof $livetags )  && 0 !== $livetags.length ) {
									this.addLiveTagsToUpdate( $inserted, $livetags );

								}
								this.filterUpdate( $inserted, $livetags );
							}
						}
					} catch ( ein1 ) {
						this.log( 'Exception on ins_node: ', ein1 );
                    }
					break;

                // ['append_child', 'parent xpath', content]
                // instead of "insertBefore", "appendChild" on found element called
                case 'append_child':
                    try {
                        // Parent is passed path
						parent_path = this.get_path_parts( change[1] );
						parent = this.node_at_path( parent_path );
						if ( parent !== null ) {
							el = document.createElement( 'span' );
							el.innerHTML = change[2];
							content = el.childNodes[0];
                            // Suppress duplicate append
							if ( content.id !== '' && null === document.getElementById( content.id ) ) {
                                this.process_twitter( content, change[2] );
								inserted = parent.appendChild( content );
								$( inserted ).addClass( 'oortle-diff-inserted' );
							}
						}
                    } catch ( ein1 ) {
                        this.log( 'Exception on append_child: ', ein1 );
                    }
                    break;

                // ['replace_node', 'node xpath', new_content]
                case 'replace_node':
                    try {
						parts = this.get_path_parts( change[1] );
						node = this.node_at_path( parts );
                        parent = node.parentNode;

						el = document.createElement( 'span' );

						el.innerHTML = change[2];
						content = el.childNodes[0];

                        // Suppress duplicates
                        var lpg = $( content ).data( 'lpg' );
                        if ( lpg !== '' && lpg !== null && lpg <= $( node ).data( 'lpg' ) ) {
                            // Duplicate detected, skip silently
                        } else {
                            this.process_twitter( content, change[2] );
                            this.add_class( content, 'oortle-diff-changed' );
                            if ( $( node ).hasClass( 'pinned-first-live-update' ) ) {
                              this.add_class( content, 'pinned-first-live-update' );
                              setTimeout( this.scrollToPinnedHeader, 500 );
                            }
                            parent.insertBefore( content, node );

                            // FIXME: call just del_node there
                            if ( node.nodeType === 3 ) { // TextNode
                                for ( x = 0; x < parent.childNodes.length; x++ ) {
                                    if ( parent.childNodes[x] === node ) {
                                        container = parent.ownerDocument.createElement( 'span' );
                                        container.appendChild( node );
                                        container.className = 'oortle-diff-removed';
                                        break;
                                    }
                                }
                                if ( x < parent.childNodes.length ) {
                                    parent.insertBefore( container, parent.childNodes[x] );
                                } else {
                                    parent.appendChild( container );
                                }
                            } else if ( node.nodeType === 8 ) { // CommentNode
                                node.parentNode.removeChild( node );
                            } else {
                                this.add_class( node, 'oortle-diff-removed' );
                            }
                        }
                    } catch ( ein1 ) {
                        this.log( 'Exception on append_child: ', ein1 );
                    }
                    break;

				default:
					this.log( 'Operation not implemented yet.' );
					throw 'Operation not implemented yet.';
			}

			this.log( 'i=', i, ' container: ', this.containerElement.childNodes, ' -- registers: ', registers );
		}

		try {
			this.display( display_with_effects );
		} catch ( ein2 ) {
			this.log( 'Exception on display: ', ein2 );
		}

		try {
			if ( Livepress.Scroll.shouldScroll() ) {
				var scroll_class = ( options.custom_scroll_class === undefined ) ?
					'.oortle-diff-inserted-block, .oortle-diff-changed, .oortle-diff-inserted' :
					options.custom_scroll_class;
				jQuery.scrollTo( scroll_class, 900, { axis: 'y', offset: -30 });
			}
		} catch ( ein ) {
			this.log( 'Exception on scroll ', ein );
		}

		this.log( 'end apply_changes.' );
	},

	scrollToPinnedHeader: function() {
		if ( Livepress.Scroll.shouldScroll() ) {
			jQuery.scrollTo( '.pinned-first-live-update', 900, { axis: 'y', offset: -30 } );
		}
	},

	/**
	 * Filer the update - hide if live tag filtering is active and update not in tag(s)
	 */
	filterUpdate: function( $inserted, $livetags ) {
		// If the livetags are not in the filtered tags, hide the update
		var target,
			theTags,
			$tagcontrol = jQuery( '.live-update-tag-control' ),
			$activelivetags = $tagcontrol.find( '.live-update-tagcontrol.active' );

		if ( 0 !== $activelivetags.length && 0 === $livetags.length ) {
			$inserted.hide().removeClass( 'oortle-diff-inserted' );
			return;
		}

		// Any active tags
		if ( 0 !== $activelivetags.length ) {
			var inFilteredList = false,
				$insertedtags  = $livetags.find( '.live-update-livetag' );


			// Iterate thru the update tags, checking if any match any active tag
			jQuery.each( $insertedtags, function( index, tag ) {
				target = jQuery( tag ).attr( 'class' );
				target = target.replace( /live-update-livetag live-update-livetag-/gi, '' );
				target = 'live-update-livetag-' + target.toLowerCase().replace( / /g, '-' );
				target = '.live-update-tagcontrol.active[data-tagclass="' + target + '"]';
				theTags =  $tagcontrol.find( target );
				if ( 0 !== theTags.length ) {
					inFilteredList = true;
				}
			});
			if ( ! inFilteredList ) {
				$inserted.hide().removeClass( 'oortle-diff-inserted' );
			}
		}
	},

	/**
	 * When the live update contains tags, add these to the tag control bar
	 */
	addLiveTagsToUpdate: function( $inserted, $livetags ) {
		var SELF = this, tagSpan, tagclass, $classincontrol, $livepress = jQuery( '#livepress' ),
			theTags = $livetags.find( '.live-update-livetag' ),
			$lpliveupdates = $livetags.parent().parent(),
			$livetagcontrol = $livepress.find( '.live-update-tag-control' );

		// Add the live tag control bar if missing
		if ( 0 === $livetagcontrol.length ) {
			this.addLiveTagControlBar();
		}

		// Parse the tags in the update, adding to the live tag control bar
		theTags.each( function() {
			var livetag = jQuery( this ).attr( 'class' );

			livetag = livetag.replace( /live-update-livetag live-update-livetag-/gi, '' );

			tagclass = 'live-update-livetag-' + livetag.toLowerCase().replace( / /g, '-' );
			$inserted.addClass( tagclass );
			// Add the control class, if missing
			SELF.addLiveTagToControls( livetag );
		});
	},

	addLiveTagToControls: function( livetag ) {
		var tagSpan, $livepress = jQuery( '#livepress' ),
			$livetagcontrol = $livepress.find( '.live-update-tag-control' ),
			$classincontrol = $livetagcontrol.find( '[data-tagclass="live-update-livetag-' + livetag.toLowerCase().replace( / /g, '-' ) + '"]' );
			if ( 0 === $classincontrol.length ) {
				tagSpan = '<span class="live-update-tagcontrol" data-tagclass="live-update-livetag-' + livetag.toLowerCase().replace( / /g, '-' ) + '">' + livetag + '</span>';
				$livetagcontrol.append( tagSpan );
			}
	},

	addLiveTagControlBar: function() {
		var $livepress = jQuery( '#livepress' ),
			$livetagcontrol = $livepress.find( '.live-update-tag-control' );

			$livepress.append( '<div class="live-update-tag-control"><span class="live-update-tag-title">' + lp_client_strings.filter_by_tag + '</span></div>' );
			$livetagcontrol = $livepress.find( '.live-update-tag-control' );
			// Activate handlers after inserting bar
			this.addLiveTagHandlers( $livetagcontrol );
	},

	addLiveTagHandlers: function( $livetagcontrol ) {
		var self = this,
			$lpcontent = jQuery( '.livepress_content' );

		$livetagcontrol.on( 'click', '.live-update-tagcontrol', function() {
			var $this = jQuery( this );

				$this.toggleClass( 'active' );
				self.filterUpdateListbyLiveTag( $livetagcontrol, $lpcontent );
		} );
	},

	filterUpdateListbyLiveTag: function( $livetagcontrol, $lpcontent ) {
		var activeClass,
			$activeLiveTags = $livetagcontrol.find( '.live-update-tagcontrol.active' );

			// If no tags are selected, show all updates
			if ( 0 === $activeLiveTags.length ) {
				$lpcontent.find( '.livepress-update' ).show();
				return;
			}

			// Hide all updates
			$lpcontent.find( '.livepress-update' ).hide();

			// Show updates matching active live tags
			jQuery.each( $activeLiveTags, function( index, tag ) {
				activeClass = '.' + jQuery( tag ).data( 'tagclass' );
				$lpcontent.find( activeClass ).show();
			});
	},

	colorForOperation: function( element ) {
		if ( element.length === 0 ) {
			return false;
		}
		var colors = {
			'oortle-diff-inserted':       LivepressConfig.oortle_diff_inserted,
			'oortle-diff-changed':        LivepressConfig.oortle_diff_changed,
			'oortle-diff-inserted-block': LivepressConfig.oortle_diff_inserted_block,
			'oortle-diff-removed-block':  LivepressConfig.oortle_diff_removed_block,
			'oortle-diff-removed':        LivepressConfig.oortle_diff_removed
		};

		var color_hex = '#fff';
		jQuery.each( colors, function( klass, hex ) {
			if ( element.hasClass( klass ) ) {
				color_hex = hex;
				return false;
			}
		});

		return color_hex;
	},

	show: function( el ) {
		var $el = jQuery( el );

		// If user is not on the page
		if ( ! LivepressConfig.page_active && LivepressConfig.effects ) {
			$el.getBg();
			$el.data( 'oldbg', $el.css( 'background-color' ) );
			$el.addClass( 'unfocused-lp-update' );
			$el.css( 'background-color', this.colorForOperation( $el ) );
		}
		$el.show();
	},

	/**
	 * This is a fix for the jQuery s(l)ide effects
	 * Without this element sometimes has inline style of height
	 * set to 0 or 1px. Remember not to use this on collection but
	 * on single elements only.
	 *
	 * @param object node to be displayed/hidden
	 * @param object hash with
	 *  slideType:
	 *   "down" - default, causes element to be animated as if using slideDown
	 *    anything else, is recognised as slideUp
	 *  duration: this value will be passed as duration param to slideDown, slideUp
	 */
	sliderFixed: function( el, options ) {
		var $ = jQuery;
		var defaults = { slideType: 'down', duration: 250 };
		options = $.extend({}, defaults, options );
		var bShow = ( options.slideType === 'down' );
		var $el = $( el ), height = $el.data( 'originalHeight' ), visible = $el.is( ':visible' );
		var originalStyle = $el.data( 'originalStyle' );
		// If the bShow isn't present, get the current visibility and reverse it
		if ( arguments.length === 1 ) {
			bShow = ! visible;
		}

		// If the current visiblilty is the same as the requested state, cancel
		if ( bShow === visible ) {
			return false;
		}

		// Get the original height
		if ( ! height || ! originalStyle ) {
			// Get original height
			height = $el.show().height();
			originalStyle = $el.attr( 'style' );
			$el.data( 'originalStyle', originalStyle );
			// Update the height
			$el.data( 'originalHeight', height );
			// If the element was hidden, hide it again
			if ( ! visible ) {
				$el.hide();
			}
		}

		// Expand the knowledge (instead of slideDown/Up, use custom animation which applies fix)
		if ( bShow ) {
			$el.show().animate({
				height: height
			}, {
				duration: options.duration,
				complete: function() {
					$el.css({ height: $el.data( 'originalHeight' ) });
					$el.attr( 'style', $el.data( 'originalStyle' ) );
					$el.show();
				}
			});
		} else {
			$el.animate({
				height: 0
			}, {
				duration: options.duration,
				complete: function() {
					$el.hide();
				}
			});
		}
	},

	show_with_effects: function( $selects, effects ) {
		if ( this.custom_background_color === 'string' ) {
			$selects.css( 'background-color', this.custom_background_color );
		}
		$selects.getBg();
		effects( $selects, $selects.css( 'background-color' ) );
	},

	display: function( display_with_effects ) {
		if ( display_with_effects ) {
			var $els = this.selector( '.oortle-diff-inserted-block' );
			$els.hide().css( 'height', '' );
			var self = this;
			var blockInsertionEffects = function( $el, old_bg ) {
				self.sliderFixed( $el, 'down' );
				$el.animate({ backgroundColor: self.colorForOperation( $el ) }, 200 )
					.animate({ backgroundColor: old_bg }, 800 );

				// Clear background after effects
				setTimeout(function() {
					$el.css( 'background-color', '' );
				}, 0);
			};

			$els.each(function( index, update ) {
				self.show_with_effects( jQuery( update ), blockInsertionEffects );
			});

			this.show_with_effects( this.selectors( '.oortle-diff-inserted', '.oortle-diff-changed' ),
				function( $el, old_bg ) {
					$el.slideDown( 200 );
					try {
						$el.animate({ backgroundColor: self.colorForOperation( $el ) }, 200 )
							.animate({ backgroundColor: old_bg }, 800 );
					} catch ( e ) {
						console.log( 'Error when animating new comment div.' );
					}

					// Clear background after effects
					setTimeout(function() {
						$el.css( 'background-color', '' );
					}, 0);
				}
			);

			this.show_with_effects( this.selectors( '.oortle-diff-removed-block', '.oortle-diff-removed' ),
				function( $el, old_bg ) {
					try {
						$el.animate({ backgroundColor: self.colorForOperation( $el ) }, 200 )
							.animate({ backgroundColor: old_bg }, 800 )
							.slideUp( 200 );
					} catch ( e ) {
						console.log( 'Error when removing comment div.' );
					}
					// Clear background after effects
					setTimeout(function() {
						$el.css( 'background-color', '' );
					}, 0);
				}
			);
		} else {
			this.show( this.selectors( '.oortle-diff-changed', '.oortle-diff-inserted', '.oortle-diff-removed' ) );
			this.show( this.selector( '.oortle-diff-inserted-block' ) );
		}
	},

	set_text: function( nodePath, content ) {
		var parts = this.get_path_parts( nodePath );
		var childIndex = this.get_child_index( parts );
		var parent = this.node_at_path( this.get_parent_path( parts ) );

		if ( childIndex > -1 && parent !== null ) {
			var refNode = parent.childNodes[childIndex];
			var contentArr = jQuery( content );

			for ( var i = 0, len = contentArr.length; i < len; i++ ) {
				parent.insertBefore( contentArr[i], refNode );
			}

			parent.removeChild( refNode );
		}
	},

    // If list of idices passed -- returns array of indexes
    // if #elId passed, return array [Parent, Node]
	get_path_parts: function( nodePath ) {
        if ( nodePath[0] === '#' ) {
            var el = jQuery( nodePath, this.containerElement )[0];
            if ( el ) {
              return [el.parentNode, el];
            } else {
              return [null, null];
            }
        } else {
            var parts = nodePath.split( ':' );
            var indices = [];
            for ( var i = 0, len = parts.length; i < len; i++ ) {
                indices[i] = parseInt( parts[i], 10 );
            }
            return indices;
        }
	},

    // Not working with #elId schema
	get_child_index: function( pathParts ) {
		if ( pathParts.length > 0 ) {
			return parseInt( pathParts[pathParts.length - 1], 10 );
		}
		return -1;
	},

    // Working with #elId schema
	get_parent_path: function( pathParts ) {
		var parts = pathParts.slice(); // "clone" the array
		parts.splice( -1, 1 );
		return parts;
	},

    // In case #elId just return last element
	node_at_path: function( pathParts ) {
        if ( pathParts[0].nodeType === undefined ) {
            return this.get_node_by_path( this.containerElement, pathParts );
        } else {
            return pathParts[pathParts.length - 1];
        }
	},

	get_node_by_path: function( root, pathParts ) {
		var parts = pathParts.slice();
		parts.splice( 0, 1 ); // Take out the first element (the root)
		if ( parts.length === 0 ) {
			return root;
		}
		var i = 0, tmp = root, result = null;
		for ( var len = parts.length; i < len; i++ ) {
			tmp = tmp.childNodes[parts[i]];
			if ( typeof( tmp ) === 'undefined' ) {
				break;
			}
		}
		if ( i === parts.length ) {
			result = tmp;
		}
		return result;
	},

	add_class: function( node, newClass ) {
		if ( node !== null ) {
			node.className += ' ' + newClass;
		}
	},

	set_attr: function( node, attrName, attrValue ) {
		if ( node !== null ) {
			node.setAttribute( attrName, attrValue );
		}
	},

	del_attr: function( node, attrName ) {
		if ( node !== null ) {
			node.removeAttribute( attrName );
		}
	}
};

Livepress.DOMManipulator.clean_updates = function( el ) {
	var temp_manipulator = new Livepress.DOMManipulator( el );
	temp_manipulator.clean_updates();
};

//
// Copyright (c) 2008, 2009 Paul Duncan (paul@pablotron.org)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//

(function () {
	// We are already defined. Hooray!
	if (window.google && google.gears) {
		return;
	}

	// factory
	var F = null;

	// Firefox
	if (typeof GearsFactory != 'undefined') {
		F = new GearsFactory();
	} else {
		// IE
		try {
			if ( 'undefined' !== typeof window.ActiveXObject ){
				F = new ActiveXObject('Gears.Factory');
				// privateSetGlobalObject is only required and supported on WinCE.
				if (F.getBuildInfo().indexOf('ie_mobile') != -1) {
					F.privateSetGlobalObject(this);
				}
			}
		} catch (e) {
			// Safari
			if ((typeof navigator.mimeTypes != 'undefined') && navigator.mimeTypes["application/x-googlegears"]) {
				F = document.createElement("object");
				F.style.display = "none";
				F.width = 0;
				F.height = 0;
				F.type = "application/x-googlegears";
				document.documentElement.appendChild(F);
			}
		}
	}

	// *Do not* define any objects if Gears is not installed. This mimics the
	// behavior of Gears defining the objects in the future.
	if (!F) {
		return;
	}


	// Now set up the objects, being careful not to overwrite anything.
	//
	// Note: In Internet Explorer for Windows Mobile, you can't add properties to
	// the window object. However, global objects are automatically added as
	// properties of the window object in all browsers.
	if (!window.google) {
		google = {};
	}

	if (!google.gears) {
		google.gears = {factory:F};
	}

})();
/**
* storage.js - Simple namespaced browser storage.
*
* Creates a window.Storage function that gives you an easy API to access localStorage,
* with fallback to cookie storage. Each Storage object is namespaced:
*
* var foo = Storage('foo'), bar = Storage('bar');
* foo.set('test', 'A'); bar.set('test', 'B');
* foo.get('test'); // 'A'
* bar.remove('test');
* foo.get('test'); // still 'A'
*
* Requires jQuery.
* Based on https://github.com/jbalogh/zamboni/blob/master/media/js/zamboni/storage.js
* Everything clever written by Chris Van.
*/
var internalStorage = (function() {
	var cookieStorage = {
			expires: 30,
			get: function( key ) {
			return jQuery.cookie( key );
			},

			set: function( key, value ) {
				return jQuery.cookie( key, value, { path: '/', expires: this.expires } );
			},

			remove: function( key ) {
				return jQuery.cookie( key, null );
			}
		};

	var engine = cookieStorage;
	try {
		if ( 'localStorage' in window && window['localStorage'] !== null ) {
			engine = window.localStorage;
		}
	} catch ( e ) {
		}
	return function( namespace ) {
		if ( ! namespace ) {
			namespace = '';
		}

		return {
			get: function( key, def ) {
				return engine.getItem( namespace + '-' + key );
			},

			set: function( key, value ) {
				return engine.setItem( namespace + '-' + key, value );
			},

			remove: function( key ) {
				return engine.remoteItem( namespace + '-' + key );
			}
		};
	};
})();

Livepress.storage = (function() {
	var storage = new internalStorage( 'Livepress' );
	return {
		get: function( key, def ) {
			var val = storage.get( key );
			return ( val === null || typeof val === 'undefined' ) ? def : val;
		},
		set: function( key, value ) {
			return storage.set( key, value );
		}
	};
}() );

/*global lp_client_strings, Livepress, OORTLE, console, FB, _wpmejsSettings, LivepressConfig*/
/**
 *  Connects to Oortle, apply diff messages and handles the view, playing sounds for each task.
 *
 *  Applies the diffs of content (to '#post_content_livepress') and comments (to '#post_comments_livepress')
 *
 * @param   config  Can have the following options
 *                  * comment_count = the actual comment count (will be updated on each comment update)
 *                  * site_url = site url to use in Oortle' topics
 *                  * ajax_url = url to use in ajax requests
 *                  * post_update_msg_id, comment_msg_id, new_post_msg_id = the id of the last message
 *                      sent to the topics post-{config.post_id}, post-{config.post_id}_comment and
 *                      post-new-update (all 3 starts with livepress|{site_url}|)
 *                  * can_edit_comments = boolean, if true will use the topic
 *                      post-{config.post_id}_comment-logged instead of post-{config.post_id}_comment
 *                  * custom_title_css_selector = if set, will change the topic in the selector
 *                      provided instead of "#post-{config.post_id}"
 *                  * custom_background_color = should be set if the text color background is
 *                      provided by an image. If it's form an image, will get it from the CSS.
 *                  * post_id = the current post_id
 *                  * page_type = [home|single|page|admin], used to choose between partial/full view
 *                      and subscribe to the topics that makes sense
 *                  * feed_sub_link = Link to subscribe to post updates from feed
 *                  * feed_title = Title of the post updates feed
 *                  * disable_comments = Disables all comment related UI
 *                  * comment_live_updates_default = Live comment update should be on/off
 *                  * sounds_default = Sounds should be on/off
 *
 * @param   hooks   Can have the following function hooks:
 *                  * post_comment_update = call after apply the diff operation
 */
Livepress.Ui.Controller = function( config, hooks ) {
	var $window = jQuery( window ),
		$livepress = jQuery( document.getElementById( 'livepress' ) );
	var post_dom_manipulator, comments_dom_manipulator;
	var comment_count = config.comment_count;
	var page_type = config.page_type;
	var on_home_page = ( page_type === 'home' );
	var on_single_page = ( page_type === 'single' );
	var posts_on_hold = [];
	var paused = false;
	var update_box;
	var widget;
	var comet = OORTLE.instance;
	var sounds = Livepress.sounds;

	function connected () {
		if ( widget !== undefined ) {
			widget.connected();
		}
	}

	function comet_error_callback ( message ) {
		if ( message.reason === 'cache_empty' ) {
			// Post is new, or we have connected to clean node
			// nothing to be handled there now with incremental updates
			// of course, we can miss some update, if it was published after page was cached
			// but next updates would still correctly displayed live
		} else
		if ( message.reason === 'cache_miss' ) {
			// We have connected to node, that have no message, that we referenced
			// that can be cause by:
			// 1. we have very old cached page version, so there lot of updates,
			//    so "last" we know are outdated;
			// 2. something was wrong, and last id published with page invalid
			// in any case, right now nothing should be done:
			// yes, we can miss some update(s) between cache and current moment
			// but next updates would still correctly displayed live
		} else {
			console.log( 'Comet warn: ', message );
		}
	}

	function call_hook ( name ) {
		if ( typeof( hooks ) === 'object' ) {
			if ( typeof( hooks[name] ) === 'function' ) {
				return hooks[name].apply( this, Array.prototype.slice.call( arguments, 1 ) );
			}
		}
	}

	function trigger_action_on_view  () {
		setTimeout(function() {
			if ( comet.is_connected() ) {
				widget.connected();
			} else {
				widget.disconnected();
			}
		}, 1500 );
	}

	function comment_update ( data, topic, msg_id ) {
		if ( config.comment_msg_id === msg_id ) {
			return;
		}

		call_hook( 'before_live_comment', data );
		// WP only: don't attach comments if we're using page split on comments and we're not on first or last
		// page, depending on what option of comment sorting is set.
		var should_attach = call_hook( 'should_attach_comment', config );
		// Should attach if such hook doesn't exist
		should_attach = ( should_attach === undefined ? true : should_attach );

		if ( should_attach ) {
			var result = call_hook( 'on_comment_update', data, comments_dom_manipulator );
			if ( result === undefined ) {
				comments_dom_manipulator.update( data.diff );
			}
		}
		trigger_action_on_view();

		// The submit form looses the ajax bind after applying the diff operations
		// so provide this hook to let attach the onClick function again
		call_hook( 'post_comment_update' );

		if ( comment_count === 0 ) {
			sounds.play( 'firstComment' );
		} else {
			sounds.play( 'commentAdded' );
		}
		comment_count += 1;

		if ( data.comment_id ) {
			var containerId = call_hook( 'get_comment_container', data.comment_id );
			if ( containerId === undefined ) {
				for ( var i = 0; i < data.diff.length; i += 1 ) {
					if ( data.diff[i][0] === 'ins_node' && data.diff[i][2].indexOf( data.content ) >= 0 ) {
						containerId = jQuery( data.diff[i][2] ).attr( 'id' );
						break;
					}
				}
			}

			var avatar_src;
			// Checking if avatar_url is <img> or just string with url
			if ( jQuery( data.avatar_url ).length === 0 ) {
				avatar_src = data.avatar_url;
			} else {
				avatar_src = jQuery( data.avatar_url ).attr( 'src' );
			}

			// Change the bubble to contain refresh button instead of
			// 'scroll to' if we didn't attach new comment
			var options = {
				title:             data.author,
				text:              data.content,
				commentContainerId:containerId,
				image:             avatar_src
			};

			if ( ! should_attach ) {
				options.scrollToText = lp_client_strings.refresh_page;
				options.scrollToCallback = function() {
					location.reload();
				};
			}
			widget.comment_alert( options, data.comment_gmt );
		}

		widget.set_comment_num( comment_count );
	}

	function update_live_updates () {
		var $live_updates = jQuery( document.querySelectorAll( '#post_content_livepress .livepress-update' ) ).not( '.oortle-diff-removed' );
		widget.set_live_updates_num( $live_updates.length );

		var current_post_link = window.location.href.replace( window.location.hash, '' );

		if ( on_single_page ) {
			$live_updates.addClass( 'lp-hl-on-hover' );
		}

		$live_updates.each(function() {
			var $this = jQuery( this );
			if ( ! $this.is( '.lp-live' ) ) {
				$this.addClass( 'lp-live' );
				if ( LivepressConfig.sharing_ui === 'display' ) {
					return new Livepress.Ui.UpdateView( $this, current_post_link, config.disable_comments );
				}
			}
		});
	}

	// Once we load the content of a post, check if we need to trigger
	// some function to display any of the embeds
	function update_embeds( data ) {

        var id = get_update_id_from_data( data );
        if ( id ) {
            //Workaround for Facebook embeds, see if we need to embed any
            //facebook posts once there's an update:
            if ( 'undefined' !== typeof( FB ) ) {
                FB.XFBML.parse( document.getElementById( id ) );
            }
            if ( 'undefined' !== typeof window.instgrm ) {
                window.instgrm.Embeds.process();
            }
            embed_audio_and_video( id );
        }
	}

	function get_update_id_from_data( data ) {

        if ( data[0][2] ) {
            // Get the update id in the form 'live-press-update-23423423'
            var re = /id\=\"(livepress-update-[0-9]+)/;
            // Data Array: ['ins_node', '0:0', '<div id="livepress-update..."']
            var result = re.exec( data[0][2] );
            if ( result.length > 0 ) {
                return result[1];
            }
        }
        return false;
	}

	// WordPress' Audio and Video embeds
	// Basically use the same function WP uses to embed audio and video
	// from shortcodes:
	function embed_audio_and_video( update_id ) {
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
		var search = ['#', update_id, ' .wp-audio-shortcode, ', '#', update_id, ' .wp-video-shortcode'].join( '' );
		jQuery( search ).not( '.mejs-container' ).mediaelementplayer( settings );
	}

	function handle_page_title_update ( data ) {
		// Notify about new post updates by changing the title count. No deletes and edits.
		// Only if the window is not active
		if ( window.is_active ) {
			return;
		}

		// Only update the post title when we are inserting a new node
		var is_ins_node = false;
		jQuery.each( data, function( k, v ) {
			// It's deletion if only del_node operations are in changes array
			is_ins_node = ( v[0] === 'ins_node' );
		});
		if ( ! is_ins_node ) {
			return;
		}

		var title = jQuery( 'title' );
		var updates = title.data( 'updates' );
		updates += 1;
		title.data( 'updates', updates );
		title.text( '(' + updates + ') ' + title.data( 'text' ) );
		// TODO: change window title too, to match new post title
	}

	function post_title_update ( title ) {
		trigger_action_on_view();

		if ( title.length === 2 ) {
			var old_title = title[0];
			var new_title = title[1];
			var selector;
			if ( typeof( config.custom_title_css_selector ) === 'string' ) {
				selector = config.custom_title_css_selector;
			} else {
				selector = '#post-' + config.post_id;
			}
			var $post_title = jQuery( selector );

			var new_title_value = $post_title.html().replaceAll( old_title, new_title );
			$post_title.html( new_title_value );
			var html_title_value = document.title.replace( old_title, new_title );
			document.title = html_title_value;

			//  // Should highlight the title but it's highlighting the whole post
			//  $post_title.addClass('oortle-diff-changed').show();
			//  setTimeout("$post_title.removeClass('oortle-diff-changed');", 3000);
		} else {
			console.log( 'error -- received data about post = ' + title );
		}
	}

	function post_update ( data ) {
		var date       = new Date(),
			dateString = date.toISOString(),
			abbr       = '<abbr class="livepress-timestamp" title="' + dateString + '"></abbr>';

        if ( 'op' in data && data.op === 'broadcast' ) {
            var broadcast = JSON.parse( data.data );
            if ( 'shortlink' in broadcast ) {
                jQuery.each( broadcast['shortlink'], function( k, v ) {
                    Livepress.updateShortlinksCache[k] = v;
                });
            }
            return;
        }
		if ( 'event' in data && data.event === 'post_title' ) {
			return post_title_update( data.data );
		}
		var paused_data = data.pop();
		handle_page_title_update( data );

		if ( paused ) {
			posts_on_hold.push( data );
			if ( typeof( update_box ) !== 'undefined' ) {
				var updated_at = paused_data.updated_at;
				for ( var i = 0; i < paused_data.post_updates.length; i += 1 ) {
					update_box.post_update( paused_data.post_updates[i], updated_at );
				}
			}
		} else {
			post_dom_manipulator.update( data, { effects_display: false });
			update_live_updates();
		}
		trigger_action_on_view();
		update_embeds( data );

        sounds.play( 'newPost' );

		$livepress.find( '.lp-updated-counter' ).html( abbr );
		$livepress.find( '.lp-updated-counter' ).find( '.livepress-timestamp' ).attr( 'title', dateString );
		$livepress.find( '.lp-bar .lp-status' ).removeClass( 'lp-off' ).addClass( 'lp-on' );

        var update_id = get_update_id_from_data( data );
        if ( update_id ) {
            var timestamp = jQuery( '#' + update_id ).find( 'abbr.livepress-timestamp' );

            if ( 'timeago' === LivepressConfig.timestamp_format ) {
                timestamp.timeago().attr( 'title', '' );
            } else {
                jQuery( '.lp-bar abbr.livepress-timestamp' ).timeago();
                timestamp.data( 'timestamp', timestamp.attr( 'title' ) ).attr( 'title', '' );
            }
            timestamp.wrap( '<a href="' + Livepress.getUpdatePermalink( update_id ) + '" ></a>' );
        }

		jQuery( document ).trigger( 'live_post_update' ); /*Trigger a post-update event so display can adjust*/
	}

	function new_post_update_box ( post, topic, msg_id ) {
		if ( config.new_post_msg_id === msg_id ) {
			return;
		}

		update_box.new_post( post.title, post.link, post.author, post.updated_at_gmt );
		sounds.play( 'postUpdated' );
	}

	var imSubscribing = false;
	function imSubscribeCallback ( userName, imType ) {

		if ( imSubscribing || userName.length === 0 || userName === 'username' ) {
			return;
		}

		imSubscribing = true;
		widget.imFeedbackSpin( true );

		// TODO handle imType on backend
		var postData = { action:'new_im_follower', user_name:userName, im_type:imType, post_id:config.post_id };

		jQuery.post( config.ajax_url, postData, function( response ) {
			widget.handleImFeedback( response, userName );
			imSubscribing = false;
		});
	}

	function bindPageActivity () {
		var animateLateUpdates = function() {
			var updates = jQuery( '.unfocused-lp-update' );
			var old_bg = updates.data( 'oldbg' ) || '#FFF';
			updates.animate({ backgroundColor:old_bg }, 4000, 'swing', function() {
				jQuery( this ).removeClass( 'unfocused-lp-update' ).css( 'background-color', '' );
			});
		};

		var title = jQuery( 'title' );
		title.data( 'text', title.text() );
		title.data( 'updates', 0 );
		$window.focus(function() {
			this.is_active = true;
			title.text( title.data( 'text' ) );
			title.data( 'updates', 0 );
			animateLateUpdates();
		});

		$window.blur(function() {
			this.is_active = false;
		});

		var $livediv = jQuery( '#post_content_livepress' ),
			liveTags = $livediv.data( 'livetags' );
			if ( '' !== liveTags && undefined !== liveTags ) {
                post_dom_manipulator.addLiveTagControlBar();
				var allTags = liveTags.split( ',' );
					allTags.map( function( tag ) {
                        post_dom_manipulator.addLiveTagToControls( tag );
					});
			}
		jQuery( document ).trigger( 'live_post_update' );
	}

	window.is_active = true;
	$window.ready( bindPageActivity );

	if ( null !== document.getElementById( 'lp-update-box' ) ) {
		update_box = new Livepress.Ui.UpdateBoxView( on_home_page );
	}

	if ( null !== document.getElementById( 'livepress' ) ) {
		widget = new Livepress.Ui.View( config.disable_comments );
		widget.set_comment_num( comment_count );
		update_live_updates();
	}

	// Just connect to LivePress if there is any of the views present
	if ( update_box !== undefined || widget !== undefined ) {
		var connection_id = '#livepress-connection';
		jQuery( document.body ).append( '<div id="' + connection_id + '"><!-- --></div>' );

		var new_post_topic = '|livepress|' + config.site_url + '|post-new-update';

		comet.attachEvent( 'connected', connected );
		comet.attachEvent( 'error', comet_error_callback );

		// Subscribe to the post, comments and 'new posts' topics.
		// post_update_msg_id, comment_msg_id and new_post_msg_id have the message hash

		// Handle LivePress update box if present
		if ( update_box !== undefined ) {
			if ( on_home_page ) {
				var opt1 = config.new_post_msg_id ? { last_id:config.new_post_msg_id } : { fetch_all:true };
				comet.subscribe( new_post_topic, new_post_update_box, opt1 );
				comet.connect(); // We always subscribe on main page to get new post notifications
			}
		}

		// Handle LivePress control widget if present
		if ( widget !== undefined ) {
			comet.attachEvent( 'reconnected', widget.connected );
			comet.attachEvent( 'disconnected', widget.disconnected );

			var post_update_topic = '|livepress|' + config.site_url + '|post-' + config.post_id;
			var comment_update_topic = '|livepress|' + config.site_url + '|post-' + config.post_id + '_comment';

			if ( config.can_edit_comments ) {
				comment_update_topic += '-logged';
			}

			// Create dom manipulator of the post and the comments
			post_dom_manipulator = new Livepress.DOMManipulator( '#post_content_livepress', config.custom_background_color );
			comments_dom_manipulator = new Livepress.DOMManipulator( '#post_comments_livepress', config.custom_background_color );

			var opt = config.new_post_msg_id ? { last_id:config.new_post_msg_id } : { fetch_all:true };
			if ( ! config.disable_comments && config.comment_live_updates_default ) {
				opt = config.comment_msg_id ? { last_id:config.comment_msg_id } : { fetch_all:true };
				comet.subscribe( comment_update_topic, function() {
				}, opt ); // Just set options there
			}
            var last_post = ( config.last_post ) ? config.last_post : config.post_update_msg_id;
            opt = last_post ? { last_id:last_post } : { fetch_all:true };
			comet.subscribe( post_update_topic, post_update, opt );

			comet.connect();

      if ( config.autoscroll ) {
        Livepress.Scroll.settings_enabled = true;
      } else {
        Livepress.Scroll.settings_enabled = false;
      }

      if ( ! config.disable_comments ) {
        comet.subscribe( comment_update_topic, comment_update );
      } else {
        comet.unsubscribe( comment_update_topic, comment_update );
      }
		}
	}
};

jQuery(function() {
	Livepress.Comment = (function() {
		var sending = false;

		var set_comment_status = function( status ) {
			var $status = jQuery( '#oortle-comment-status' );
			if ( $status.length === 0 ) {
				jQuery( '#submit' ).after( '<span id=\'oortle-comment-status\'></span>' );
				$status = jQuery( '#oortle-comment-status' );
			}
			$status.text( status );
		};

		var unblock_comment_textarea = function( eraseText ) {
			var comment_textarea = jQuery( '#comment' );
			comment_textarea.attr( 'disabled', false );

			if ( eraseText ) {
				comment_textarea.val( '' );
				jQuery( '#cancel-comment-reply-link' ).click();
			}
		};

		var send = function() {
			try {
				if ( sending ) {
					return false;
				}
				sending = true;

				var $btn = jQuery( '#submit' );
				var btn_text = $btn.attr( 'value' );
				$btn.attr( 'value', lp_client_strings.sending + '...' );
				$btn.attr( 'disabled', true );
				jQuery( 'textarea#comment' ).attr( 'disabled', true );
				set_comment_status( '' );

				var params = {};
				var form = document.getElementById( 'commentform' ) || document.getElementById( 'comment-form' );
				params.comment_post_ID = form.comment_post_ID.value;
				if ( typeof( form.comment_parent ) !== 'undefined' ) {
					params.comment_parent = form.comment_parent.value;
				}
				params.comment = form.comment.value;
				form.comment.value = '';
				// FIXME: this won't work when accepting comments without email and name fields
				// sent author is same as comment then. Ex. author:	test!@ comment:	test!@
                if ( 0 === jQuery('.logged-in-as') ) {
                    params.author = form.author.value || form.elements[0].value;
                    params.email = form.email.value || form.elements[1].value;
                    params.url = form.url.value || form.elements[2].value;
                }


				params._wp_unfiltered_html_comment = ( form._wp_unfiltered_html_comment !== undefined ) ? form._wp_unfiltered_html_comment.value : '';
				params.redirect_to = '';
				params.livepress_update = 'true';
				params.action = 'lp_post_comment';
				params._ajax_nonce = LivepressConfig.ajax_comment_nonce;

				Livepress.sounds.play( 'commented' );

				jQuery.ajax({
					url:     LivepressConfig.site_url + '/wp-admin/admin-ajax.php',
					type:    'post',
					dataType:'json',
					data:    params,
					error:   function( request, textStatus, errorThrown ) {

						console.log( 'comment response: ' + request.status + ' :: ' + request.statusText );
						console.log( 'comment ajax failed: %s', textStatus );
						set_comment_status( lp_client_strings.comment_status + ': ' + request.responseText );
						unblock_comment_textarea( false );
					},
					success: function( data, textStatus ) {
						// TODO: Improve display message that send successed.
						set_comment_status( lp_client_strings.comment_status + ': ' + data.msg );
						unblock_comment_textarea( data.code === '200' );
					},
					complete:function( request, textStatus ) {
						$btn = jQuery( '#submit' );
						sending = false;
						$btn.attr( 'value', btn_text );
						$btn.attr( 'disabled', false );
					}
				});
			} catch ( error ) {
				console.log( 'EXCEPTION: %s', error );
				set_comment_status( lp_client_strings.sending_error );
			}

			return false;
		};

		var attach = function() {
			jQuery( '#submit' ).click( send );
		};

		// WP only: we must hide new comment form before making any modifications to dom tree
		// otherwise wp javascripts which handle cancel link won't work anymore
		// we check if new comment is of same author and if user didn't modify it's contents meanwhile
		var before_live_comment = function( comment_data ) {
			var comment_textarea = jQuery( '#comment' );
			if ( comment_data.ajax_nonce === LivepressConfig.ajax_nonce && comment_textarea.val() === comment_data.content ) {
				unblock_comment_textarea( true );
			}
		};

		var should_attach_comment = function( config ) {
			var page_number = config.comment_page_number;
			if ( config.comment_order === 'asc' ) {
				return ( page_number === 0 || page_number === config.comment_pages_count );
			} else {
				return ( page_number <= 1 );
			}
		};

		var get_comment_container = function( comment_id ) {
			return jQuery( '#comment-' + comment_id ).parent().attr( 'id' );
		};

		var on_comment_update = function( data, manipulator ) {
			var manipulator_options = {
				custom_scroll_class:'#comment-' + data.comment_id
			};
			if ( data.comment_parent === '0' ) {
				manipulator.update( data.diff, manipulator_options );
			} else { // Updating threaded comment
				manipulator.update( data.comments_counter_only_diff, manipulator_options );

				var new_comment = jQuery( data.comment_html );
				// We want new comment to be animated as usual by DOMmanipuator.js
				new_comment.addClass( 'oortle-diff-inserted-block' ).hide();
				var parent = jQuery( '#comment-' + data.comment_parent );
				var children = parent.children( '.children' );
				if ( children.length === 0 ) {
					children = jQuery( '<ul>' ).addClass( 'children' ).appendTo( parent );
				}
				children.append( new_comment );
				manipulator.display( true );
			}

			return true;
		};

		if ( ! LivepressConfig.disable_comments ) {
			attach();
		}

		return {
			send:                 send,
			attach:               attach,
			before_live_comment:  before_live_comment,
			should_attach_comment:should_attach_comment,
			get_comment_container:get_comment_container,
			on_comment_update:    on_comment_update
		};
	}() );
});

if ( 'undefined' !== typeof jQuery ) {
	jQuery.ajax = (function( jQajax ) {
		return function() {
			if ( 'undefined' !== typeof OORTLE && 'undefined' !== typeof OORTLE.instance && OORTLE.instance ) {
				OORTLE.instance.flush();
			}
			return jQajax.apply( this, arguments );
		};
	}( jQuery.ajax ) );
}
/**
 * Underscore throttle
 */
  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  // A (possibly faster) way to get the current timestamp as an integer.
var unow = Date.now || function() {
    return new Date().getTime();
  };

var throttle = function( func, wait, options ) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if ( ! options ) {
 options = {};
 }
    var later = function() {
      previous = options.leading === false ? 0 : unow();
      timeout = null;
      result = func.apply( context, args );
      if ( ! timeout ) {
 context = args = null;
 }
    };
    return function() {
      var now = unow();
      if ( ! previous && options.leading === false ) {
 previous = now;
 }
      var remaining = wait - ( now - previous );
      context = this;
      args = arguments;
      if ( remaining <= 0 || remaining > wait ) {
        clearTimeout( timeout );
        timeout = null;
        previous = now;
        result = func.apply( context, args );
        if ( ! timeout ) {
 context = args = null;
 }
      } else if ( ! timeout && options.trailing !== false ) {
        timeout = setTimeout( later, remaining );
      }
      return result;
    };
  };

Livepress.Ready = function() {

	var $lpcontent, $firstUpdate, $livepressBar, $heightOfFirstUpdate, $firstUpdateContainer, diff,
		hooks = {
			post_comment_update:  Livepress.Comment.attach,
			before_live_comment:  Livepress.Comment.before_live_comment,
			should_attach_comment:Livepress.Comment.should_attach_comment,
			get_comment_container:Livepress.Comment.get_comment_container,
			on_comment_update:    Livepress.Comment.on_comment_update
		};

	// Add update permalink to each timestamp
	jQuery.each(
		jQuery( '.livepress-update' ),
		function() {
			var timestamp = jQuery( this ).find( 'abbr.livepress-timestamp' );
			timestamp.wrap( '<a href="' + Livepress.getUpdatePermalink( jQuery( this ).attr( 'id' ) ) + '" ></a>' );

            if ( 'true' !== LivepressConfig.post_finished ) {
                if ( 'timeago' === LivepressConfig.timestamp_format ) {
                    jQuery( 'abbr.livepress-timestamp' ).timeago().attr( 'title', '' );
                } else {
                    jQuery( '.lp-bar abbr.livepress-timestamp' ).timeago();
                    timestamp.data( 'timestamp', timestamp.attr( 'title' ) ).attr( 'title', '' );
                }
            }
		}
	);

	if ( jQuery( '.lp-status' ).hasClass( 'livepress-pinned-header' ) ) {

        jQuery( '.livepress_content' ).find( '.livepress-update:first' ).addClass( 'pinned-first-live-update' );

		var movePinnedPost = function() {

            //Remove so we don't end up lots of content
            jQuery( '#livepress .pinned-first-live-update' ).remove();
            $lpcontent    = jQuery( '.livepress_content' );
            $firstUpdate  = $lpcontent.find( '.pinned-first-live-update' );
            $livepressBar = jQuery( '#livepress' );
            $firstUpdate.hide();

            // Clone the hidden content
            $firstUpdate.clone( true ).prependTo( $livepressBar ).show();

            //Remove any diff copied
            jQuery( '#livepress .pinned-first-live-update.oortle-diff-removed' ).remove();
        };

        // Recopy whenever the post is updated
        jQuery( document ).on( 'live_post_update', function() {
            setTimeout( movePinnedPost, 50 );
        });
        setTimeout( movePinnedPost, 50 );
	}
    if ( 0 === window.location.hash.indexOf( '#livepress-update' ) ) {
        window.history.replaceState( {}, '?', '?lpup=' + window.location.hash.substr( 18 ) + window.location.hash.substr( 0 ) );
    }

	return new Livepress.Ui.Controller( LivepressConfig, hooks );
};

jQuery.effects || (function($, undefined) {

	$.effects = {};

	// override the animation for color styles
	$.each(['backgroundColor', 'borderBottomColor', 'borderLeftColor',
		'borderRightColor', 'borderTopColor', 'borderColor', 'color', 'outlineColor'],
		function(i, attr) {
			$.fx.step[attr] = function(fx) {
				if (!fx.colorInit) {
					fx.start = getColor(fx.elem, attr);
					fx.end = getRGB(fx.end);
					fx.colorInit = true;
				}

				fx.elem.style[attr] = 'rgb(' +
					Math.max(Math.min(parseInt((fx.pos * (fx.end[0] - fx.start[0])) + fx.start[0], 10), 255), 0) + ',' +
					Math.max(Math.min(parseInt((fx.pos * (fx.end[1] - fx.start[1])) + fx.start[1], 10), 255), 0) + ',' +
					Math.max(Math.min(parseInt((fx.pos * (fx.end[2] - fx.start[2])) + fx.start[2], 10), 255), 0) + ')';
			};
		});

	// Color Conversion functions from highlightFade
	// By Blair Mitchelmore
	// http://jquery.offput.ca/highlightFade/

	// Parse strings looking for color tuples [255,255,255]
	function getRGB(color) {
		var result;

		// Check if we're already dealing with an array of colors
		if ( color && color.constructor == Array && color.length == 3 )
			return color;

		// Look for rgb(num,num,num)
		if (result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color))
			return [parseInt(result[1],10), parseInt(result[2],10), parseInt(result[3],10)];

		// Look for rgb(num%,num%,num%)
		if (result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color))
			return [parseFloat(result[1])*2.55, parseFloat(result[2])*2.55, parseFloat(result[3])*2.55];

		// Look for #a0b1c2
		if (result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color))
			return [parseInt(result[1],16), parseInt(result[2],16), parseInt(result[3],16)];

		// Look for #fff
		if (result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color))
			return [parseInt(result[1]+result[1],16), parseInt(result[2]+result[2],16), parseInt(result[3]+result[3],16)];

		// Look for rgba(0, 0, 0, 0) == transparent in Safari 3
		if (result = /rgba\(0, 0, 0, 0\)/.exec(color))
			return colors['transparent'];

		// Otherwise, we're most likely dealing with a named color
		return colors[$.trim(color).toLowerCase()];
	}

	function getColor(elem, attr) {
		var color;

		do {
			// jQuery <1.4.3 uses curCSS, in 1.4.3 - 1.7.2 curCSS = css, 1.8+ only has css
			color = ($.curCSS || $.css)(elem, attr);

			// Keep going until we find an element that has color, or we hit the body
			if ( color != '' && color != 'transparent' || $.nodeName(elem, "body") )
				break;

			attr = "backgroundColor";
		} while ( elem = elem.parentNode );

		return getRGB(color);
	};

	// Some named colors to work with
	// From Interface by Stefan Petre
	// http://interface.eyecon.ro/

	var colors = {
		aqua:[0,255,255],
		azure:[240,255,255],
		beige:[245,245,220],
		black:[0,0,0],
		blue:[0,0,255],
		brown:[165,42,42],
		cyan:[0,255,255],
		darkblue:[0,0,139],
		darkcyan:[0,139,139],
		darkgrey:[169,169,169],
		darkgreen:[0,100,0],
		darkkhaki:[189,183,107],
		darkmagenta:[139,0,139],
		darkolivegreen:[85,107,47],
		darkorange:[255,140,0],
		darkorchid:[153,50,204],
		darkred:[139,0,0],
		darksalmon:[233,150,122],
		darkviolet:[148,0,211],
		fuchsia:[255,0,255],
		gold:[255,215,0],
		green:[0,128,0],
		indigo:[75,0,130],
		khaki:[240,230,140],
		lightblue:[173,216,230],
		lightcyan:[224,255,255],
		lightgreen:[144,238,144],
		lightgrey:[211,211,211],
		lightpink:[255,182,193],
		lightyellow:[255,255,224],
		lime:[0,255,0],
		magenta:[255,0,255],
		maroon:[128,0,0],
		navy:[0,0,128],
		olive:[128,128,0],
		orange:[255,165,0],
		pink:[255,192,203],
		purple:[128,0,128],
		violet:[128,0,128],
		red:[255,0,0],
		silver:[192,192,192],
		white:[255,255,255],
		yellow:[255,255,0],
		transparent: [255,255,255]
	};

	// Animations

	var classAnimationActions = ['add', 'remove', 'toggle'],
		shorthandStyles = {
			border: 1,
			borderBottom: 1,
			borderColor: 1,
			borderLeft: 1,
			borderRight: 1,
			borderTop: 1,
			borderWidth: 1,
			margin: 1,
			padding: 1
		};

	function getElementStyles() {
		var style = document.defaultView
				? document.defaultView.getComputedStyle(this, null)
				: this.currentStyle,
			newStyle = {},
			key,
			camelCase;

		// webkit enumerates style porperties
		if (style && style.length && style[0] && style[style[0]]) {
			var len = style.length;
			while (len--) {
				key = style[len];
				if (typeof style[key] == 'string') {
					camelCase = key.replace(/\-(\w)/g, function(all, letter){
						return letter.toUpperCase();
					});
					newStyle[camelCase] = style[key];
				}
			}
		} else {
			for (key in style) {
				if (typeof style[key] === 'string') {
					newStyle[key] = style[key];
				}
			}
		}

		return newStyle;
	}

	function filterStyles(styles) {
		var name, value;
		for (name in styles) {
			value = styles[name];
			if (
			// ignore null and undefined values
				value == null ||
					// ignore functions (when does this occur?)
					$.isFunction(value) ||
					// shorthand styles that need to be expanded
					name in shorthandStyles ||
					// ignore scrollbars (break in IE)
					(/scrollbar/).test(name) ||

					// only colors or values that can be converted to numbers
					(!(/color/i).test(name) && isNaN(parseFloat(value)))
				) {
				delete styles[name];
			}
		}

		return styles;
	}

	function styleDifference(oldStyle, newStyle) {
		var diff = { _: 0 }, // http://dev.jquery.com/ticket/5459
			name;

		for (name in newStyle) {
			if (oldStyle[name] != newStyle[name]) {
				diff[name] = newStyle[name];
			}
		}

		return diff;
	}

	$.effects.animateClass = function(value, duration, easing, callback) {
		if ($.isFunction(easing)) {
			callback = easing;
			easing = null;
		}

		return this.queue(function() {
			var that = $(this),
				originalStyleAttr = that.attr('style') || ' ',
				originalStyle = filterStyles(getElementStyles.call(this)),
				newStyle,
				className = that.attr('class') || "";

			$.each(classAnimationActions, function(i, action) {
				if (value[action]) {
					that[action + 'Class'](value[action]);
				}
			});
			newStyle = filterStyles(getElementStyles.call(this));
			that.attr('class', className);

			that.animate(styleDifference(originalStyle, newStyle), {
				queue: false,
				duration: duration,
				easing: easing,
				complete: function() {
					$.each(classAnimationActions, function(i, action) {
						if (value[action]) { that[action + 'Class'](value[action]); }
					});
					// work around bug in IE by clearing the cssText before setting it
					if (typeof that.attr('style') == 'object') {
						that.attr('style').cssText = '';
						that.attr('style').cssText = originalStyleAttr;
					} else {
						that.attr('style', originalStyleAttr);
					}
					if (callback) { callback.apply(this, arguments); }
					$.dequeue( this );
				}
			});
		});
	};

	$.fn.extend({
		_addClass: $.fn.addClass,
		addClass: function(classNames, speed, easing, callback) {
			return speed ? $.effects.animateClass.apply(this, [{ add: classNames },speed,easing,callback]) : this._addClass(classNames);
		},

		_removeClass: $.fn.removeClass,
		removeClass: function(classNames,speed,easing,callback) {
			return speed ? $.effects.animateClass.apply(this, [{ remove: classNames },speed,easing,callback]) : this._removeClass(classNames);
		},

		_toggleClass: $.fn.toggleClass,
		toggleClass: function(classNames, force, speed, easing, callback) {
			if ( typeof force == "boolean" || force === undefined ) {
				if ( !speed ) {
					// without speed parameter;
					return this._toggleClass(classNames, force);
				} else {
					return $.effects.animateClass.apply(this, [(force?{add:classNames}:{remove:classNames}),speed,easing,callback]);
				}
			} else {
				// without switch parameter;
				return $.effects.animateClass.apply(this, [{ toggle: classNames },force,speed,easing]);
			}
		},

		switchClass: function(remove,add,speed,easing,callback) {
			return $.effects.animateClass.apply(this, [{ add: add, remove: remove },speed,easing,callback]);
		}
	});

	// Effects
	$.extend($.effects, {
		version: "1.8.24",

		// Saves a set of properties in a data storage
		save: function(element, set) {
			for(var i=0; i < set.length; i++) {
				if(set[i] !== null) element.data("ec.storage."+set[i], element[0].style[set[i]]);
			}
		},

		// Restores a set of previously saved properties from a data storage
		restore: function(element, set) {
			for(var i=0; i < set.length; i++) {
				if(set[i] !== null) element.css(set[i], element.data("ec.storage."+set[i]));
			}
		},

		setMode: function(el, mode) {
			if (mode == 'toggle') mode = el.is(':hidden') ? 'show' : 'hide'; // Set for toggle
			return mode;
		},

		getBaseline: function(origin, original) { // Translates a [top,left] array into a baseline value
			// this should be a little more flexible in the future to handle a string & hash
			var y, x;
			switch (origin[0]) {
				case 'top': y = 0; break;
				case 'middle': y = 0.5; break;
				case 'bottom': y = 1; break;
				default: y = origin[0] / original.height;
			};
			switch (origin[1]) {
				case 'left': x = 0; break;
				case 'center': x = 0.5; break;
				case 'right': x = 1; break;
				default: x = origin[1] / original.width;
			};
			return {x: x, y: y};
		},

		// Wraps the element around a wrapper that copies position properties
		createWrapper: function(element) {

			// if the element is already wrapped, return it
			if (element.parent().is('.ui-effects-wrapper')) {
				return element.parent();
			}

			// wrap the element
			var props = {
					width: element.outerWidth(true),
					height: element.outerHeight(true),
					'float': element.css('float')
				},
				wrapper = $('<div></div>')
					.addClass('ui-effects-wrapper')
					.css({
						fontSize: '100%',
						background: 'transparent',
						border: 'none',
						margin: 0,
						padding: 0
					}),
				active = document.activeElement;

			// support: Firefox
			// Firefox incorrectly exposes anonymous content
			// https://bugzilla.mozilla.org/show_bug.cgi?id=561664
			try {
				active.id;
			} catch( e ) {
				active = document.body;
			}

			element.wrap( wrapper );

			// Fixes #7595 - Elements lose focus when wrapped.
			if ( element[ 0 ] === active || $.contains( element[ 0 ], active ) ) {
				$( active ).focus();
			}

			wrapper = element.parent(); //Hotfix for jQuery 1.4 since some change in wrap() seems to actually loose the reference to the wrapped element

			// transfer positioning properties to the wrapper
			if (element.css('position') == 'static') {
				wrapper.css({ position: 'relative' });
				element.css({ position: 'relative' });
			} else {
				$.extend(props, {
					position: element.css('position'),
					zIndex: element.css('z-index')
				});
				$.each(['top', 'left', 'bottom', 'right'], function(i, pos) {
					props[pos] = element.css(pos);
					if (isNaN(parseInt(props[pos], 10))) {
						props[pos] = 'auto';
					}
				});
				element.css({position: 'relative', top: 0, left: 0, right: 'auto', bottom: 'auto' });
			}

			return wrapper.css(props).show();
		},

		removeWrapper: function(element) {
			var parent,
				active = document.activeElement;

			if (element.parent().is('.ui-effects-wrapper')) {
				parent = element.parent().replaceWith(element);
				// Fixes #7595 - Elements lose focus when wrapped.
				if ( element[ 0 ] === active || $.contains( element[ 0 ], active ) ) {
					$( active ).focus();
				}
				return parent;
			}

			return element;
		},

		setTransition: function(element, list, factor, value) {
			value = value || {};
			$.each(list, function(i, x){
				var unit = element.cssUnit(x);
				if (unit[0] > 0) value[x] = unit[0] * factor + unit[1];
			});
			return value;
		}
	});

	function _normalizeArguments(effect, options, speed, callback) {
		// shift params for method overloading
		if (typeof effect == 'object') {
			callback = options;
			speed = null;
			options = effect;
			effect = options.effect;
		}
		if ($.isFunction(options)) {
			callback = options;
			speed = null;
			options = {};
		}
		if (typeof options == 'number' || $.fx.speeds[options]) {
			callback = speed;
			speed = options;
			options = {};
		}
		if ($.isFunction(speed)) {
			callback = speed;
			speed = null;
		}

		options = options || {};

		speed = speed || options.duration;
		speed = $.fx.off ? 0 : typeof speed == 'number'
			? speed : speed in $.fx.speeds ? $.fx.speeds[speed] : $.fx.speeds._default;

		callback = callback || options.complete;

		return [effect, options, speed, callback];
	}

	function standardSpeed( speed ) {
		// valid standard speeds
		if ( !speed || typeof speed === "number" || $.fx.speeds[ speed ] ) {
			return true;
		}

		// invalid strings - treat as "normal" speed
		if ( typeof speed === "string" && !$.effects[ speed ] ) {
			return true;
		}

		return false;
	}

	$.fn.extend({
		effect: function(effect, options, speed, callback) {
			var args = _normalizeArguments.apply(this, arguments),
			// TODO: make effects take actual parameters instead of a hash
				args2 = {
					options: args[1],
					duration: args[2],
					callback: args[3]
				},
				mode = args2.options.mode,
				effectMethod = $.effects[effect];

			if ( $.fx.off || !effectMethod ) {
				// delegate to the original method (e.g., .show()) if possible
				if ( mode ) {
					return this[ mode ]( args2.duration, args2.callback );
				} else {
					return this.each(function() {
						if ( args2.callback ) {
							args2.callback.call( this );
						}
					});
				}
			}

			return effectMethod.call(this, args2);
		},

		_show: $.fn.show,
		show: function(speed) {
			if ( standardSpeed( speed ) ) {
				return this._show.apply(this, arguments);
			} else {
				var args = _normalizeArguments.apply(this, arguments);
				args[1].mode = 'show';
				return this.effect.apply(this, args);
			}
		},

		_hide: $.fn.hide,
		hide: function(speed) {
			if ( standardSpeed( speed ) ) {
				return this._hide.apply(this, arguments);
			} else {
				var args = _normalizeArguments.apply(this, arguments);
				args[1].mode = 'hide';
				return this.effect.apply(this, args);
			}
		},

		// jQuery core overloads toggle and creates _toggle
		__toggle: $.fn.toggle,
		toggle: function(speed) {
			if ( standardSpeed( speed ) || typeof speed === "boolean" || $.isFunction( speed ) ) {
				return this.__toggle.apply(this, arguments);
			} else {
				var args = _normalizeArguments.apply(this, arguments);
				args[1].mode = 'toggle';
				return this.effect.apply(this, args);
			}
		},

		// helper functions
		cssUnit: function(key) {
			var style = this.css(key), val = [];
			$.each( ['em','px','%','pt'], function(i, unit){
				if(style.indexOf(unit) > 0)
					val = [parseFloat(style), unit];
			});
			return val;
		}
	});

	var baseEasings = {};

	$.each( [ "Quad", "Cubic", "Quart", "Quint", "Expo" ], function( i, name ) {
		baseEasings[ name ] = function( p ) {
			return Math.pow( p, i + 2 );
		};
	});

	$.extend( baseEasings, {
		Sine: function ( p ) {
			return 1 - Math.cos( p * Math.PI / 2 );
		},
		Circ: function ( p ) {
			return 1 - Math.sqrt( 1 - p * p );
		},
		Elastic: function( p ) {
			return p === 0 || p === 1 ? p :
				-Math.pow( 2, 8 * (p - 1) ) * Math.sin( ( (p - 1) * 80 - 7.5 ) * Math.PI / 15 );
		},
		Back: function( p ) {
			return p * p * ( 3 * p - 2 );
		},
		Bounce: function ( p ) {
			var pow2,
				bounce = 4;

			while ( p < ( ( pow2 = Math.pow( 2, --bounce ) ) - 1 ) / 11 ) {}
			return 1 / Math.pow( 4, 3 - bounce ) - 7.5625 * Math.pow( ( pow2 * 3 - 2 ) / 22 - p, 2 );
		}
	});

	$.each( baseEasings, function( name, easeIn ) {
		$.easing[ "easeIn" + name ] = easeIn;
		$.easing[ "easeOut" + name ] = function( p ) {
			return 1 - easeIn( 1 - p );
		};
		$.easing[ "easeInOut" + name ] = function( p ) {
			return p < .5 ?
				easeIn( p * 2 ) / 2 :
				easeIn( p * -2 + 2 ) / -2 + 1;
		};
	});

	$.effects.blind = function(o) {

		return this.queue(function() {

			// Create element
			var el = $(this), props = ['position','top','bottom','left','right'];

			// Set options
			var mode = $.effects.setMode(el, o.options.mode || 'hide'); // Set Mode
			var direction = o.options.direction || 'vertical'; // Default direction

			// Adjust
			$.effects.save(el, props); el.show(); // Save & Show
			var wrapper = $.effects.createWrapper(el).css({overflow:'hidden'}); // Create Wrapper
			var ref = (direction == 'vertical') ? 'height' : 'width';
			var distance = (direction == 'vertical') ? wrapper.height() : wrapper.width();
			if(mode == 'show') wrapper.css(ref, 0); // Shift

			// Animation
			var animation = {};
			animation[ref] = mode == 'show' ? distance : 0;

			// Animate
			wrapper.animate(animation, o.duration, o.options.easing, function() {
				if(mode == 'hide') el.hide(); // Hide
				$.effects.restore(el, props); $.effects.removeWrapper(el); // Restore
				if(o.callback) o.callback.apply(el[0], arguments); // Callback
				el.dequeue();
			});

		});

	};

})(jQuery);
/*!
* @license SoundJS
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2011-2015 gskinner.com, inc.
*
* Distributed under the terms of the MIT license.
* http://www.opensource.org/licenses/mit-license.html
*
* This notice shall be included in all copies or substantial portions of the Software.
*/

/**!
 * SoundJS FlashAudioPlugin also includes swfobject (http://code.google.com/p/swfobject/)
 */

this.createjs=this.createjs||{},function(){var a=createjs.SoundJS=createjs.SoundJS||{};a.version="0.6.1",a.buildDate="Thu, 21 May 2015 16:17:37 GMT"}(),this.createjs=this.createjs||{},createjs.extend=function(a,b){"use strict";function c(){this.constructor=a}return c.prototype=b.prototype,a.prototype=new c},this.createjs=this.createjs||{},createjs.promote=function(a,b){"use strict";var c=a.prototype,d=Object.getPrototypeOf&&Object.getPrototypeOf(c)||c.__proto__;if(d){c[(b+="_")+"constructor"]=d.constructor;for(var e in d)c.hasOwnProperty(e)&&"function"==typeof d[e]&&(c[b+e]=d[e])}return a},this.createjs=this.createjs||{},createjs.indexOf=function(a,b){"use strict";for(var c=0,d=a.length;d>c;c++)if(b===a[c])return c;return-1},this.createjs=this.createjs||{},function(){"use strict";createjs.proxy=function(a,b){var c=Array.prototype.slice.call(arguments,2);return function(){return a.apply(b,Array.prototype.slice.call(arguments,0).concat(c))}}}(),this.createjs=this.createjs||{},function(){"use strict";function BrowserDetect(){throw"BrowserDetect cannot be instantiated"}var a=BrowserDetect.agent=window.navigator.userAgent;BrowserDetect.isWindowPhone=a.indexOf("IEMobile")>-1||a.indexOf("Windows Phone")>-1,BrowserDetect.isFirefox=a.indexOf("Firefox")>-1,BrowserDetect.isOpera=null!=window.opera,BrowserDetect.isChrome=a.indexOf("Chrome")>-1,BrowserDetect.isIOS=(a.indexOf("iPod")>-1||a.indexOf("iPhone")>-1||a.indexOf("iPad")>-1)&&!BrowserDetect.isWindowPhone,BrowserDetect.isAndroid=a.indexOf("Android")>-1&&!BrowserDetect.isWindowPhone,BrowserDetect.isBlackberry=a.indexOf("Blackberry")>-1,createjs.BrowserDetect=BrowserDetect}(),this.createjs=this.createjs||{},function(){"use strict";function EventDispatcher(){this._listeners=null,this._captureListeners=null}var a=EventDispatcher.prototype;EventDispatcher.initialize=function(b){b.addEventListener=a.addEventListener,b.on=a.on,b.removeEventListener=b.off=a.removeEventListener,b.removeAllEventListeners=a.removeAllEventListeners,b.hasEventListener=a.hasEventListener,b.dispatchEvent=a.dispatchEvent,b._dispatchEvent=a._dispatchEvent,b.willTrigger=a.willTrigger},a.addEventListener=function(a,b,c){var d;d=c?this._captureListeners=this._captureListeners||{}:this._listeners=this._listeners||{};var e=d[a];return e&&this.removeEventListener(a,b,c),e=d[a],e?e.push(b):d[a]=[b],b},a.on=function(a,b,c,d,e,f){return b.handleEvent&&(c=c||b,b=b.handleEvent),c=c||this,this.addEventListener(a,function(a){b.call(c,a,e),d&&a.remove()},f)},a.removeEventListener=function(a,b,c){var d=c?this._captureListeners:this._listeners;if(d){var e=d[a];if(e)for(var f=0,g=e.length;g>f;f++)if(e[f]==b){1==g?delete d[a]:e.splice(f,1);break}}},a.off=a.removeEventListener,a.removeAllEventListeners=function(a){a?(this._listeners&&delete this._listeners[a],this._captureListeners&&delete this._captureListeners[a]):this._listeners=this._captureListeners=null},a.dispatchEvent=function(a){if("string"==typeof a){var b=this._listeners;if(!b||!b[a])return!1;a=new createjs.Event(a)}else a.target&&a.clone&&(a=a.clone());try{a.target=this}catch(c){}if(a.bubbles&&this.parent){for(var d=this,e=[d];d.parent;)e.push(d=d.parent);var f,g=e.length;for(f=g-1;f>=0&&!a.propagationStopped;f--)e[f]._dispatchEvent(a,1+(0==f));for(f=1;g>f&&!a.propagationStopped;f++)e[f]._dispatchEvent(a,3)}else this._dispatchEvent(a,2);return a.defaultPrevented},a.hasEventListener=function(a){var b=this._listeners,c=this._captureListeners;return!!(b&&b[a]||c&&c[a])},a.willTrigger=function(a){for(var b=this;b;){if(b.hasEventListener(a))return!0;b=b.parent}return!1},a.toString=function(){return"[EventDispatcher]"},a._dispatchEvent=function(a,b){var c,d=1==b?this._captureListeners:this._listeners;if(a&&d){var e=d[a.type];if(!e||!(c=e.length))return;try{a.currentTarget=this}catch(f){}try{a.eventPhase=b}catch(f){}a.removed=!1,e=e.slice();for(var g=0;c>g&&!a.immediatePropagationStopped;g++){var h=e[g];h.handleEvent?h.handleEvent(a):h(a),a.removed&&(this.off(a.type,h,1==b),a.removed=!1)}}},createjs.EventDispatcher=EventDispatcher}(),this.createjs=this.createjs||{},function(){"use strict";function Event(a,b,c){this.type=a,this.target=null,this.currentTarget=null,this.eventPhase=0,this.bubbles=!!b,this.cancelable=!!c,this.timeStamp=(new Date).getTime(),this.defaultPrevented=!1,this.propagationStopped=!1,this.immediatePropagationStopped=!1,this.removed=!1}var a=Event.prototype;a.preventDefault=function(){this.defaultPrevented=this.cancelable&&!0},a.stopPropagation=function(){this.propagationStopped=!0},a.stopImmediatePropagation=function(){this.immediatePropagationStopped=this.propagationStopped=!0},a.remove=function(){this.removed=!0},a.clone=function(){return new Event(this.type,this.bubbles,this.cancelable)},a.set=function(a){for(var b in a)this[b]=a[b];return this},a.toString=function(){return"[Event (type="+this.type+")]"},createjs.Event=Event}(),this.createjs=this.createjs||{},function(){"use strict";function ErrorEvent(a,b,c){this.Event_constructor("error"),this.title=a,this.message=b,this.data=c}var a=createjs.extend(ErrorEvent,createjs.Event);a.clone=function(){return new createjs.ErrorEvent(this.title,this.message,this.data)},createjs.ErrorEvent=createjs.promote(ErrorEvent,"Event")}(),this.createjs=this.createjs||{},function(){"use strict";function ProgressEvent(a,b){this.Event_constructor("progress"),this.loaded=a,this.total=null==b?1:b,this.progress=0==b?0:this.loaded/this.total}var a=createjs.extend(ProgressEvent,createjs.Event);a.clone=function(){return new createjs.ProgressEvent(this.loaded,this.total)},createjs.ProgressEvent=createjs.promote(ProgressEvent,"Event")}(window),this.createjs=this.createjs||{},function(){"use strict";function LoadItem(){this.src=null,this.type=null,this.id=null,this.maintainOrder=!1,this.callback=null,this.data=null,this.method=createjs.LoadItem.GET,this.values=null,this.headers=null,this.withCredentials=!1,this.mimeType=null,this.crossOrigin=null,this.loadTimeout=b.LOAD_TIMEOUT_DEFAULT}var a=LoadItem.prototype={},b=LoadItem;b.LOAD_TIMEOUT_DEFAULT=8e3,b.create=function(a){if("string"==typeof a){var c=new LoadItem;return c.src=a,c}if(a instanceof b)return a;if(a instanceof Object&&a.src)return null==a.loadTimeout&&(a.loadTimeout=b.LOAD_TIMEOUT_DEFAULT),a;throw new Error("Type not recognized.")},a.set=function(a){for(var b in a)this[b]=a[b];return this},createjs.LoadItem=b}(),function(){var a={};a.ABSOLUTE_PATT=/^(?:\w+:)?\/{2}/i,a.RELATIVE_PATT=/^[./]*?\//i,a.EXTENSION_PATT=/\/?[^/]+\.(\w{1,5})$/i,a.parseURI=function(b){var c={absolute:!1,relative:!1};if(null==b)return c;var d=b.indexOf("?");d>-1&&(b=b.substr(0,d));var e;return a.ABSOLUTE_PATT.test(b)?c.absolute=!0:a.RELATIVE_PATT.test(b)&&(c.relative=!0),(e=b.match(a.EXTENSION_PATT))&&(c.extension=e[1].toLowerCase()),c},a.formatQueryString=function(a,b){if(null==a)throw new Error("You must specify data.");var c=[];for(var d in a)c.push(d+"="+escape(a[d]));return b&&(c=c.concat(b)),c.join("&")},a.buildPath=function(a,b){if(null==b)return a;var c=[],d=a.indexOf("?");if(-1!=d){var e=a.slice(d+1);c=c.concat(e.split("&"))}return-1!=d?a.slice(0,d)+"?"+this._formatQueryString(b,c):a+"?"+this._formatQueryString(b,c)},a.isCrossDomain=function(a){var b=document.createElement("a");b.href=a.src;var c=document.createElement("a");c.href=location.href;var d=""!=b.hostname&&(b.port!=c.port||b.protocol!=c.protocol||b.hostname!=c.hostname);return d},a.isLocal=function(a){var b=document.createElement("a");return b.href=a.src,""==b.hostname&&"file:"==b.protocol},a.isBinary=function(a){switch(a){case createjs.AbstractLoader.IMAGE:case createjs.AbstractLoader.BINARY:return!0;default:return!1}},a.isImageTag=function(a){return a instanceof HTMLImageElement},a.isAudioTag=function(a){return window.HTMLAudioElement?a instanceof HTMLAudioElement:!1},a.isVideoTag=function(a){return window.HTMLVideoElement?a instanceof HTMLVideoElement:!1},a.isText=function(a){switch(a){case createjs.AbstractLoader.TEXT:case createjs.AbstractLoader.JSON:case createjs.AbstractLoader.MANIFEST:case createjs.AbstractLoader.XML:case createjs.AbstractLoader.CSS:case createjs.AbstractLoader.SVG:case createjs.AbstractLoader.JAVASCRIPT:case createjs.AbstractLoader.SPRITESHEET:return!0;default:return!1}},a.getTypeByExtension=function(a){if(null==a)return createjs.AbstractLoader.TEXT;switch(a.toLowerCase()){case"jpeg":case"jpg":case"gif":case"png":case"webp":case"bmp":return createjs.AbstractLoader.IMAGE;case"ogg":case"mp3":case"webm":return createjs.AbstractLoader.SOUND;case"mp4":case"webm":case"ts":return createjs.AbstractLoader.VIDEO;case"json":return createjs.AbstractLoader.JSON;case"xml":return createjs.AbstractLoader.XML;case"css":return createjs.AbstractLoader.CSS;case"js":return createjs.AbstractLoader.JAVASCRIPT;case"svg":return createjs.AbstractLoader.SVG;default:return createjs.AbstractLoader.TEXT}},createjs.RequestUtils=a}(),this.createjs=this.createjs||{},function(){"use strict";function AbstractLoader(a,b,c){this.EventDispatcher_constructor(),this.loaded=!1,this.canceled=!1,this.progress=0,this.type=c,this.resultFormatter=null,this._item=a?createjs.LoadItem.create(a):null,this._preferXHR=b,this._result=null,this._rawResult=null,this._loadedItems=null,this._tagSrcAttribute=null,this._tag=null}var a=createjs.extend(AbstractLoader,createjs.EventDispatcher),b=AbstractLoader;b.POST="POST",b.GET="GET",b.BINARY="binary",b.CSS="css",b.IMAGE="image",b.JAVASCRIPT="javascript",b.JSON="json",b.JSONP="jsonp",b.MANIFEST="manifest",b.SOUND="sound",b.VIDEO="video",b.SPRITESHEET="spritesheet",b.SVG="svg",b.TEXT="text",b.XML="xml",a.getItem=function(){return this._item},a.getResult=function(a){return a?this._rawResult:this._result},a.getTag=function(){return this._tag},a.setTag=function(a){this._tag=a},a.load=function(){this._createRequest(),this._request.on("complete",this,this),this._request.on("progress",this,this),this._request.on("loadStart",this,this),this._request.on("abort",this,this),this._request.on("timeout",this,this),this._request.on("error",this,this);var a=new createjs.Event("initialize");a.loader=this._request,this.dispatchEvent(a),this._request.load()},a.cancel=function(){this.canceled=!0,this.destroy()},a.destroy=function(){this._request&&(this._request.removeAllEventListeners(),this._request.destroy()),this._request=null,this._item=null,this._rawResult=null,this._result=null,this._loadItems=null,this.removeAllEventListeners()},a.getLoadedItems=function(){return this._loadedItems},a._createRequest=function(){this._request=this._preferXHR?new createjs.XHRRequest(this._item):new createjs.TagRequest(this._item,this._tag||this._createTag(),this._tagSrcAttribute)},a._createTag=function(){return null},a._sendLoadStart=function(){this._isCanceled()||this.dispatchEvent("loadstart")},a._sendProgress=function(a){if(!this._isCanceled()){var b=null;"number"==typeof a?(this.progress=a,b=new createjs.ProgressEvent(this.progress)):(b=a,this.progress=a.loaded/a.total,b.progress=this.progress,(isNaN(this.progress)||1/0==this.progress)&&(this.progress=0)),this.hasEventListener("progress")&&this.dispatchEvent(b)}},a._sendComplete=function(){if(!this._isCanceled()){this.loaded=!0;var a=new createjs.Event("complete");a.rawResult=this._rawResult,null!=this._result&&(a.result=this._result),this.dispatchEvent(a)}},a._sendError=function(a){!this._isCanceled()&&this.hasEventListener("error")&&(null==a&&(a=new createjs.ErrorEvent("PRELOAD_ERROR_EMPTY")),this.dispatchEvent(a))},a._isCanceled=function(){return null==window.createjs||this.canceled?!0:!1},a.resultFormatter=null,a.handleEvent=function(a){switch(a.type){case"complete":this._rawResult=a.target._response;var b=this.resultFormatter&&this.resultFormatter(this),c=this;b instanceof Function?b(function(a){c._result=a,c._sendComplete()}):(this._result=b||this._rawResult,this._sendComplete());break;case"progress":this._sendProgress(a);break;case"error":this._sendError(a);break;case"loadstart":this._sendLoadStart();break;case"abort":case"timeout":this._isCanceled()||this.dispatchEvent(a.type)}},a.buildPath=function(a,b){return createjs.RequestUtils.buildPath(a,b)},a.toString=function(){return"[PreloadJS AbstractLoader]"},createjs.AbstractLoader=createjs.promote(AbstractLoader,"EventDispatcher")}(),this.createjs=this.createjs||{},function(){"use strict";function AbstractMediaLoader(a,b,c){this.AbstractLoader_constructor(a,b,c),this.resultFormatter=this._formatResult,this._tagSrcAttribute="src"}var a=createjs.extend(AbstractMediaLoader,createjs.AbstractLoader);a.load=function(){this._tag||(this._tag=this._createTag(this._item.src)),this._tag.preload="auto",this._tag.load(),this.AbstractLoader_load()},a._createTag=function(){},a._createRequest=function(){this._request=this._preferXHR?new createjs.XHRRequest(this._item):new createjs.MediaTagRequest(this._item,this._tag||this._createTag(),this._tagSrcAttribute)},a._formatResult=function(a){return this._tag.removeEventListener&&this._tag.removeEventListener("canplaythrough",this._loadedHandler),this._tag.onstalled=null,this._preferXHR&&(a.getTag().src=a.getResult(!0)),a.getTag()},createjs.AbstractMediaLoader=createjs.promote(AbstractMediaLoader,"AbstractLoader")}(),this.createjs=this.createjs||{},function(){"use strict";var AbstractRequest=function(a){this._item=a},a=createjs.extend(AbstractRequest,createjs.EventDispatcher);a.load=function(){},a.destroy=function(){},a.cancel=function(){},createjs.AbstractRequest=createjs.promote(AbstractRequest,"EventDispatcher")}(),this.createjs=this.createjs||{},function(){"use strict";function TagRequest(a,b,c){this.AbstractRequest_constructor(a),this._tag=b,this._tagSrcAttribute=c,this._loadedHandler=createjs.proxy(this._handleTagComplete,this),this._addedToDOM=!1,this._startTagVisibility=null}var a=createjs.extend(TagRequest,createjs.AbstractRequest);a.load=function(){this._tag.onload=createjs.proxy(this._handleTagComplete,this),this._tag.onreadystatechange=createjs.proxy(this._handleReadyStateChange,this),this._tag.onerror=createjs.proxy(this._handleError,this);var a=new createjs.Event("initialize");a.loader=this._tag,this.dispatchEvent(a),this._hideTag(),this._loadTimeout=setTimeout(createjs.proxy(this._handleTimeout,this),this._item.loadTimeout),this._tag[this._tagSrcAttribute]=this._item.src,null==this._tag.parentNode&&(window.document.body.appendChild(this._tag),this._addedToDOM=!0)},a.destroy=function(){this._clean(),this._tag=null,this.AbstractRequest_destroy()},a._handleReadyStateChange=function(){clearTimeout(this._loadTimeout);var a=this._tag;("loaded"==a.readyState||"complete"==a.readyState)&&this._handleTagComplete()},a._handleError=function(){this._clean(),this.dispatchEvent("error")},a._handleTagComplete=function(){this._rawResult=this._tag,this._result=this.resultFormatter&&this.resultFormatter(this)||this._rawResult,this._clean(),this._showTag(),this.dispatchEvent("complete")},a._handleTimeout=function(){this._clean(),this.dispatchEvent(new createjs.Event("timeout"))},a._clean=function(){this._tag.onload=null,this._tag.onreadystatechange=null,this._tag.onerror=null,this._addedToDOM&&null!=this._tag.parentNode&&this._tag.parentNode.removeChild(this._tag),clearTimeout(this._loadTimeout)},a._hideTag=function(){this._startTagVisibility=this._tag.style.visibility,this._tag.style.visibility="hidden"},a._showTag=function(){this._tag.style.visibility=this._startTagVisibility},a._handleStalled=function(){},createjs.TagRequest=createjs.promote(TagRequest,"AbstractRequest")}(),this.createjs=this.createjs||{},function(){"use strict";function MediaTagRequest(a,b,c){this.AbstractRequest_constructor(a),this._tag=b,this._tagSrcAttribute=c,this._loadedHandler=createjs.proxy(this._handleTagComplete,this)}var a=createjs.extend(MediaTagRequest,createjs.TagRequest);a.load=function(){var a=createjs.proxy(this._handleStalled,this);this._stalledCallback=a;var b=createjs.proxy(this._handleProgress,this);this._handleProgress=b,this._tag.addEventListener("stalled",a),this._tag.addEventListener("progress",b),this._tag.addEventListener&&this._tag.addEventListener("canplaythrough",this._loadedHandler,!1),this.TagRequest_load()},a._handleReadyStateChange=function(){clearTimeout(this._loadTimeout);var a=this._tag;("loaded"==a.readyState||"complete"==a.readyState)&&this._handleTagComplete()},a._handleStalled=function(){},a._handleProgress=function(a){if(a&&!(a.loaded>0&&0==a.total)){var b=new createjs.ProgressEvent(a.loaded,a.total);this.dispatchEvent(b)}},a._clean=function(){this._tag.removeEventListener&&this._tag.removeEventListener("canplaythrough",this._loadedHandler),this._tag.removeEventListener("stalled",this._stalledCallback),this._tag.removeEventListener("progress",this._progressCallback),this.TagRequest__clean()},createjs.MediaTagRequest=createjs.promote(MediaTagRequest,"TagRequest")}(),this.createjs=this.createjs||{},function(){"use strict";function XHRRequest(a){this.AbstractRequest_constructor(a),this._request=null,this._loadTimeout=null,this._xhrLevel=1,this._response=null,this._rawResponse=null,this._canceled=!1,this._handleLoadStartProxy=createjs.proxy(this._handleLoadStart,this),this._handleProgressProxy=createjs.proxy(this._handleProgress,this),this._handleAbortProxy=createjs.proxy(this._handleAbort,this),this._handleErrorProxy=createjs.proxy(this._handleError,this),this._handleTimeoutProxy=createjs.proxy(this._handleTimeout,this),this._handleLoadProxy=createjs.proxy(this._handleLoad,this),this._handleReadyStateChangeProxy=createjs.proxy(this._handleReadyStateChange,this),!this._createXHR(a)}var a=createjs.extend(XHRRequest,createjs.AbstractRequest);XHRRequest.ACTIVEX_VERSIONS=["Msxml2.XMLHTTP.6.0","Msxml2.XMLHTTP.5.0","Msxml2.XMLHTTP.4.0","MSXML2.XMLHTTP.3.0","MSXML2.XMLHTTP","Microsoft.XMLHTTP"],a.getResult=function(a){return a&&this._rawResponse?this._rawResponse:this._response},a.cancel=function(){this.canceled=!0,this._clean(),this._request.abort()},a.load=function(){if(null==this._request)return void this._handleError();this._request.addEventListener("loadstart",this._handleLoadStartProxy,!1),this._request.addEventListener("progress",this._handleProgressProxy,!1),this._request.addEventListener("abort",this._handleAbortProxy,!1),this._request.addEventListener("error",this._handleErrorProxy,!1),this._request.addEventListener("timeout",this._handleTimeoutProxy,!1),this._request.addEventListener("load",this._handleLoadProxy,!1),this._request.addEventListener("readystatechange",this._handleReadyStateChangeProxy,!1),1==this._xhrLevel&&(this._loadTimeout=setTimeout(createjs.proxy(this._handleTimeout,this),this._item.loadTimeout));try{this._item.values&&this._item.method!=createjs.AbstractLoader.GET?this._item.method==createjs.AbstractLoader.POST&&this._request.send(createjs.RequestUtils.formatQueryString(this._item.values)):this._request.send()}catch(a){this.dispatchEvent(new createjs.ErrorEvent("XHR_SEND",null,a))}},a.setResponseType=function(a){this._request.responseType=a},a.getAllResponseHeaders=function(){return this._request.getAllResponseHeaders instanceof Function?this._request.getAllResponseHeaders():null},a.getResponseHeader=function(a){return this._request.getResponseHeader instanceof Function?this._request.getResponseHeader(a):null},a._handleProgress=function(a){if(a&&!(a.loaded>0&&0==a.total)){var b=new createjs.ProgressEvent(a.loaded,a.total);this.dispatchEvent(b)}},a._handleLoadStart=function(){clearTimeout(this._loadTimeout),this.dispatchEvent("loadstart")},a._handleAbort=function(a){this._clean(),this.dispatchEvent(new createjs.ErrorEvent("XHR_ABORTED",null,a))},a._handleError=function(a){this._clean(),this.dispatchEvent(new createjs.ErrorEvent(a.message))},a._handleReadyStateChange=function(){4==this._request.readyState&&this._handleLoad()},a._handleLoad=function(){if(!this.loaded){this.loaded=!0;var a=this._checkError();if(a)return void this._handleError(a);this._response=this._getResponse(),this._clean(),this.dispatchEvent(new createjs.Event("complete"))}},a._handleTimeout=function(a){this._clean(),this.dispatchEvent(new createjs.ErrorEvent("PRELOAD_TIMEOUT",null,a))},a._checkError=function(){var a=parseInt(this._request.status);switch(a){case 404:case 0:return new Error(a)}return null},a._getResponse=function(){if(null!=this._response)return this._response;if(null!=this._request.response)return this._request.response;try{if(null!=this._request.responseText)return this._request.responseText}catch(a){}try{if(null!=this._request.responseXML)return this._request.responseXML}catch(a){}return null},a._createXHR=function(a){var b=createjs.RequestUtils.isCrossDomain(a),c={},d=null;if(window.XMLHttpRequest)d=new XMLHttpRequest,b&&void 0===d.withCredentials&&window.XDomainRequest&&(d=new XDomainRequest);else{for(var e=0,f=s.ACTIVEX_VERSIONS.length;f>e;e++){{s.ACTIVEX_VERSIONS[e]}try{d=new ActiveXObject(axVersions);break}catch(g){}}if(null==d)return!1}null==a.mimeType&&createjs.RequestUtils.isText(a.type)&&(a.mimeType="text/plain; charset=utf-8"),a.mimeType&&d.overrideMimeType&&d.overrideMimeType(a.mimeType),this._xhrLevel="string"==typeof d.responseType?2:1;var h=null;if(h=a.method==createjs.AbstractLoader.GET?createjs.RequestUtils.buildPath(a.src,a.values):a.src,d.open(a.method||createjs.AbstractLoader.GET,h,!0),b&&d instanceof XMLHttpRequest&&1==this._xhrLevel&&(c.Origin=location.origin),a.values&&a.method==createjs.AbstractLoader.POST&&(c["Content-Type"]="application/x-www-form-urlencoded"),b||c["X-Requested-With"]||(c["X-Requested-With"]="XMLHttpRequest"),a.headers)for(var i in a.headers)c[i]=a.headers[i];for(i in c)d.setRequestHeader(i,c[i]);return d instanceof XMLHttpRequest&&void 0!==a.withCredentials&&(d.withCredentials=a.withCredentials),this._request=d,!0},a._clean=function(){clearTimeout(this._loadTimeout),this._request.removeEventListener("loadstart",this._handleLoadStartProxy),this._request.removeEventListener("progress",this._handleProgressProxy),this._request.removeEventListener("abort",this._handleAbortProxy),this._request.removeEventListener("error",this._handleErrorProxy),this._request.removeEventListener("timeout",this._handleTimeoutProxy),this._request.removeEventListener("load",this._handleLoadProxy),this._request.removeEventListener("readystatechange",this._handleReadyStateChangeProxy)},a.toString=function(){return"[PreloadJS XHRRequest]"},createjs.XHRRequest=createjs.promote(XHRRequest,"AbstractRequest")}(),this.createjs=this.createjs||{},function(){"use strict";function SoundLoader(a,b){this.AbstractMediaLoader_constructor(a,b,createjs.AbstractLoader.SOUND),createjs.RequestUtils.isAudioTag(a)?this._tag=a:createjs.RequestUtils.isAudioTag(a.src)?this._tag=a:createjs.RequestUtils.isAudioTag(a.tag)&&(this._tag=createjs.RequestUtils.isAudioTag(a)?a:a.src),null!=this._tag&&(this._preferXHR=!1)}var a=createjs.extend(SoundLoader,createjs.AbstractMediaLoader),b=SoundLoader;b.canLoadItem=function(a){return a.type==createjs.AbstractLoader.SOUND},a._createTag=function(a){var b=document.createElement("audio");return b.autoplay=!1,b.preload="none",b.src=a,b},createjs.SoundLoader=createjs.promote(SoundLoader,"AbstractMediaLoader")}(),this.createjs=this.createjs||{},function(){"use strict";var PlayPropsConfig=function(){this.interrupt=null,this.delay=null,this.offset=null,this.loop=null,this.volume=null,this.pan=null,this.startTime=null,this.duration=null},a=PlayPropsConfig.prototype={},b=PlayPropsConfig;b.create=function(a){if(a instanceof b||a instanceof Object){var c=new createjs.PlayPropsConfig;return c.set(a),c}throw new Error("Type not recognized.")},a.set=function(a){for(var b in a)this[b]=a[b];return this},a.toString=function(){return"[PlayPropsConfig]"},createjs.PlayPropsConfig=b}(),this.createjs=this.createjs||{},function(){"use strict";function Sound(){throw"Sound cannot be instantiated"}function a(a,b){this.init(a,b)}var b=Sound;b.INTERRUPT_ANY="any",b.INTERRUPT_EARLY="early",b.INTERRUPT_LATE="late",b.INTERRUPT_NONE="none",b.PLAY_INITED="playInited",b.PLAY_SUCCEEDED="playSucceeded",b.PLAY_INTERRUPTED="playInterrupted",b.PLAY_FINISHED="playFinished",b.PLAY_FAILED="playFailed",b.SUPPORTED_EXTENSIONS=["mp3","ogg","opus","mpeg","wav","m4a","mp4","aiff","wma","mid"],b.EXTENSION_MAP={m4a:"mp4"},b.FILE_PATTERN=/^(?:(\w+:)\/{2}(\w+(?:\.\w+)*\/?))?([/.]*?(?:[^?]+)?\/)?((?:[^/?]+)\.(\w+))(?:\?(\S+)?)?$/,b.defaultInterruptBehavior=b.INTERRUPT_NONE,b.alternateExtensions=[],b.activePlugin=null,b._masterVolume=1,Object.defineProperty(b,"volume",{get:function(){return this._masterVolume},set:function(a){if(null==Number(a))return!1;if(a=Math.max(0,Math.min(1,a)),b._masterVolume=a,!this.activePlugin||!this.activePlugin.setVolume||!this.activePlugin.setVolume(a))for(var c=this._instances,d=0,e=c.length;e>d;d++)c[d].setMasterVolume(a)}}),b._masterMute=!1,Object.defineProperty(b,"muted",{get:function(){return this._masterMute},set:function(a){if(null==a)return!1;if(this._masterMute=a,!this.activePlugin||!this.activePlugin.setMute||!this.activePlugin.setMute(a))for(var b=this._instances,c=0,d=b.length;d>c;c++)b[c].setMasterMute(a);return!0}}),Object.defineProperty(b,"capabilities",{get:function(){return null==b.activePlugin?null:b.activePlugin._capabilities},set:function(){return!1}}),b._pluginsRegistered=!1,b._lastID=0,b._instances=[],b._idHash={},b._preloadHash={},b._defaultPlayPropsHash={},b.addEventListener=null,b.removeEventListener=null,b.removeAllEventListeners=null,b.dispatchEvent=null,b.hasEventListener=null,b._listeners=null,createjs.EventDispatcher.initialize(b),b.getPreloadHandlers=function(){return{callback:createjs.proxy(b.initLoad,b),types:["sound"],extensions:b.SUPPORTED_EXTENSIONS}},b._handleLoadComplete=function(a){var c=a.target.getItem().src;if(b._preloadHash[c])for(var d=0,e=b._preloadHash[c].length;e>d;d++){var f=b._preloadHash[c][d];if(b._preloadHash[c][d]=!0,b.hasEventListener("fileload")){var a=new createjs.Event("fileload");a.src=f.src,a.id=f.id,a.data=f.data,a.sprite=f.sprite,b.dispatchEvent(a)}}},b._handleLoadError=function(a){var c=a.target.getItem().src;if(b._preloadHash[c])for(var d=0,e=b._preloadHash[c].length;e>d;d++){var f=b._preloadHash[c][d];if(b._preloadHash[c][d]=!1,b.hasEventListener("fileerror")){var a=new createjs.Event("fileerror");a.src=f.src,a.id=f.id,a.data=f.data,a.sprite=f.sprite,b.dispatchEvent(a)}}},b._registerPlugin=function(a){return a.isSupported()?(b.activePlugin=new a,!0):!1},b.registerPlugins=function(a){b._pluginsRegistered=!0;for(var c=0,d=a.length;d>c;c++)if(b._registerPlugin(a[c]))return!0;return!1},b.initializeDefaultPlugins=function(){return null!=b.activePlugin?!0:b._pluginsRegistered?!1:b.registerPlugins([createjs.WebAudioPlugin,createjs.HTMLAudioPlugin])?!0:!1},b.isReady=function(){return null!=b.activePlugin},b.getCapabilities=function(){return null==b.activePlugin?null:b.activePlugin._capabilities},b.getCapability=function(a){return null==b.activePlugin?null:b.activePlugin._capabilities[a]},b.initLoad=function(a){return b._registerSound(a)},b._registerSound=function(c){if(!b.initializeDefaultPlugins())return!1;var d;if(c.src instanceof Object?(d=b._parseSrc(c.src),d.src=c.path+d.src):d=b._parsePath(c.src),null==d)return!1;c.src=d.src,c.type="sound";var e=c.data,f=null;if(null!=e&&(isNaN(e.channels)?isNaN(e)||(f=parseInt(e)):f=parseInt(e.channels),e.audioSprite))for(var g,h=e.audioSprite.length;h--;)g=e.audioSprite[h],b._idHash[g.id]={src:c.src,startTime:parseInt(g.startTime),duration:parseInt(g.duration)},g.defaultPlayProps&&(b._defaultPlayPropsHash[g.id]=createjs.PlayPropsConfig.create(g.defaultPlayProps));null!=c.id&&(b._idHash[c.id]={src:c.src});var i=b.activePlugin.register(c);return a.create(c.src,f),null!=e&&isNaN(e)?c.data.channels=f||a.maxPerChannel():c.data=f||a.maxPerChannel(),i.type&&(c.type=i.type),c.defaultPlayProps&&(b._defaultPlayPropsHash[c.src]=createjs.PlayPropsConfig.create(c.defaultPlayProps)),i},b.registerSound=function(a,c,d,e,f){var g={src:a,id:c,data:d,defaultPlayProps:f};a instanceof Object&&a.src&&(e=c,g=a),g=createjs.LoadItem.create(g),g.path=e,null==e||g.src instanceof Object||(g.src=e+a);var h=b._registerSound(g);if(!h)return!1;if(b._preloadHash[g.src]||(b._preloadHash[g.src]=[]),b._preloadHash[g.src].push(g),1==b._preloadHash[g.src].length)h.on("complete",createjs.proxy(this._handleLoadComplete,this)),h.on("error",createjs.proxy(this._handleLoadError,this)),b.activePlugin.preload(h);else if(1==b._preloadHash[g.src][0])return!0;return g},b.registerSounds=function(a,b){var c=[];a.path&&(b?b+=a.path:b=a.path,a=a.manifest);for(var d=0,e=a.length;e>d;d++)c[d]=createjs.Sound.registerSound(a[d].src,a[d].id,a[d].data,b,a[d].defaultPlayProps);return c},b.removeSound=function(c,d){if(null==b.activePlugin)return!1;c instanceof Object&&c.src&&(c=c.src);var e;if(c instanceof Object?e=b._parseSrc(c):(c=b._getSrcById(c).src,e=b._parsePath(c)),null==e)return!1;c=e.src,null!=d&&(c=d+c);for(var f in b._idHash)b._idHash[f].src==c&&delete b._idHash[f];return a.removeSrc(c),delete b._preloadHash[c],b.activePlugin.removeSound(c),!0},b.removeSounds=function(a,b){var c=[];a.path&&(b?b+=a.path:b=a.path,a=a.manifest);for(var d=0,e=a.length;e>d;d++)c[d]=createjs.Sound.removeSound(a[d].src,b);return c},b.removeAllSounds=function(){b._idHash={},b._preloadHash={},a.removeAll(),b.activePlugin&&b.activePlugin.removeAllSounds()},b.loadComplete=function(a){if(!b.isReady())return!1;var c=b._parsePath(a);return a=c?b._getSrcById(c.src).src:b._getSrcById(a).src,void 0==b._preloadHash[a]?!1:1==b._preloadHash[a][0]},b._parsePath=function(a){"string"!=typeof a&&(a=a.toString());var c=a.match(b.FILE_PATTERN);if(null==c)return!1;for(var d=c[4],e=c[5],f=b.capabilities,g=0;!f[e];)if(e=b.alternateExtensions[g++],g>b.alternateExtensions.length)return null;a=a.replace("."+c[5],"."+e);var h={name:d,src:a,extension:e};return h},b._parseSrc=function(a){var c={name:void 0,src:void 0,extension:void 0},d=b.capabilities;for(var e in a)if(a.hasOwnProperty(e)&&d[e]){c.src=a[e],c.extension=e;break}if(!c.src)return!1;var f=c.src.lastIndexOf("/");return c.name=-1!=f?c.src.slice(f+1):c.src,c},b.play=function(a,c,d,e,f,g,h,i,j){var k;k=createjs.PlayPropsConfig.create(c instanceof Object||c instanceof createjs.PlayPropsConfig?c:{interrupt:c,delay:d,offset:e,loop:f,volume:g,pan:h,startTime:i,duration:j});var l=b.createInstance(a,k.startTime,k.duration),m=b._playInstance(l,k);return m||l._playFailed(),l},b.createInstance=function(c,d,e){if(!b.initializeDefaultPlugins())return new createjs.DefaultSoundInstance(c,d,e);var f=b._defaultPlayPropsHash[c];c=b._getSrcById(c);var g=b._parsePath(c.src),h=null;return null!=g&&null!=g.src?(a.create(g.src),null==d&&(d=c.startTime),h=b.activePlugin.create(g.src,d,e||c.duration),f=f||b._defaultPlayPropsHash[g.src],f&&h.applyPlayProps(f)):h=new createjs.DefaultSoundInstance(c,d,e),h.uniqueId=b._lastID++,h},b.stop=function(){for(var a=this._instances,b=a.length;b--;)a[b].stop()},b.setVolume=function(a){if(null==Number(a))return!1;if(a=Math.max(0,Math.min(1,a)),b._masterVolume=a,!this.activePlugin||!this.activePlugin.setVolume||!this.activePlugin.setVolume(a))for(var c=this._instances,d=0,e=c.length;e>d;d++)c[d].setMasterVolume(a)},b.getVolume=function(){return this._masterVolume},b.setMute=function(a){if(null==a)return!1;if(this._masterMute=a,!this.activePlugin||!this.activePlugin.setMute||!this.activePlugin.setMute(a))for(var b=this._instances,c=0,d=b.length;d>c;c++)b[c].setMasterMute(a);return!0},b.getMute=function(){return this._masterMute},b.setDefaultPlayProps=function(a,c){a=b._getSrcById(a),b._defaultPlayPropsHash[b._parsePath(a.src).src]=createjs.PlayPropsConfig.create(c)},b.getDefaultPlayProps=function(a){return a=b._getSrcById(a),b._defaultPlayPropsHash[b._parsePath(a.src).src]},b._playInstance=function(a,c){var d=b._defaultPlayPropsHash[a.src]||{};if(null==c.interrupt&&(c.interrupt=d.interrupt||b.defaultInterruptBehavior),null==c.delay&&(c.delay=d.delay||0),null==c.offset&&(c.offset=a.getPosition()),null==c.loop&&(c.loop=a.loop),null==c.volume&&(c.volume=a.volume),null==c.pan&&(c.pan=a.pan),0==c.delay){var e=b._beginPlaying(a,c);
if(!e)return!1}else{var f=setTimeout(function(){b._beginPlaying(a,c)},c.delay);a.delayTimeoutId=f}return this._instances.push(a),!0},b._beginPlaying=function(b,c){if(!a.add(b,c.interrupt))return!1;var d=b._beginPlaying(c);if(!d){var e=createjs.indexOf(this._instances,b);return e>-1&&this._instances.splice(e,1),!1}return!0},b._getSrcById=function(a){return b._idHash[a]||{src:a}},b._playFinished=function(b){a.remove(b);var c=createjs.indexOf(this._instances,b);c>-1&&this._instances.splice(c,1)},createjs.Sound=Sound,a.channels={},a.create=function(b,c){var d=a.get(b);return null==d?(a.channels[b]=new a(b,c),!0):!1},a.removeSrc=function(b){var c=a.get(b);return null==c?!1:(c._removeAll(),delete a.channels[b],!0)},a.removeAll=function(){for(var b in a.channels)a.channels[b]._removeAll();a.channels={}},a.add=function(b,c){var d=a.get(b.src);return null==d?!1:d._add(b,c)},a.remove=function(b){var c=a.get(b.src);return null==c?!1:(c._remove(b),!0)},a.maxPerChannel=function(){return c.maxDefault},a.get=function(b){return a.channels[b]};var c=a.prototype;c.constructor=a,c.src=null,c.max=null,c.maxDefault=100,c.length=0,c.init=function(a,b){this.src=a,this.max=b||this.maxDefault,-1==this.max&&(this.max=this.maxDefault),this._instances=[]},c._get=function(a){return this._instances[a]},c._add=function(a,b){return this._getSlot(b,a)?(this._instances.push(a),this.length++,!0):!1},c._remove=function(a){var b=createjs.indexOf(this._instances,a);return-1==b?!1:(this._instances.splice(b,1),this.length--,!0)},c._removeAll=function(){for(var a=this.length-1;a>=0;a--)this._instances[a].stop()},c._getSlot=function(a){var b,c;if(a!=Sound.INTERRUPT_NONE&&(c=this._get(0),null==c))return!0;for(var d=0,e=this.max;e>d;d++){if(b=this._get(d),null==b)return!0;if(b.playState==Sound.PLAY_FINISHED||b.playState==Sound.PLAY_INTERRUPTED||b.playState==Sound.PLAY_FAILED){c=b;break}a!=Sound.INTERRUPT_NONE&&(a==Sound.INTERRUPT_EARLY&&b.getPosition()<c.getPosition()||a==Sound.INTERRUPT_LATE&&b.getPosition()>c.getPosition())&&(c=b)}return null!=c?(c._interrupt(),this._remove(c),!0):!1},c.toString=function(){return"[Sound SoundChannel]"}}(),this.createjs=this.createjs||{},function(){"use strict";var AbstractSoundInstance=function(a,b,c,d){this.EventDispatcher_constructor(),this.src=a,this.uniqueId=-1,this.playState=null,this.delayTimeoutId=null,this._volume=1,Object.defineProperty(this,"volume",{get:this.getVolume,set:this.setVolume}),this._pan=0,Object.defineProperty(this,"pan",{get:this.getPan,set:this.setPan}),this._startTime=Math.max(0,b||0),Object.defineProperty(this,"startTime",{get:this.getStartTime,set:this.setStartTime}),this._duration=Math.max(0,c||0),Object.defineProperty(this,"duration",{get:this.getDuration,set:this.setDuration}),this._playbackResource=null,Object.defineProperty(this,"playbackResource",{get:this.getPlaybackResource,set:this.setPlaybackResource}),d!==!1&&d!==!0&&this.setPlaybackResource(d),this._position=0,Object.defineProperty(this,"position",{get:this.getPosition,set:this.setPosition}),this._loop=0,Object.defineProperty(this,"loop",{get:this.getLoop,set:this.setLoop}),this._muted=!1,Object.defineProperty(this,"muted",{get:this.getMuted,set:this.setMuted}),this._paused=!1,Object.defineProperty(this,"paused",{get:this.getPaused,set:this.setPaused})},a=createjs.extend(AbstractSoundInstance,createjs.EventDispatcher);a.play=function(a,b,c,d,e,f){var g;return g=createjs.PlayPropsConfig.create(a instanceof Object||a instanceof createjs.PlayPropsConfig?a:{interrupt:a,delay:b,offset:c,loop:d,volume:e,pan:f}),this.playState==createjs.Sound.PLAY_SUCCEEDED?(this.applyPlayProps(g),void(this._paused&&this.setPaused(!1))):(this._cleanUp(),createjs.Sound._playInstance(this,g),this)},a.stop=function(){return this._position=0,this._paused=!1,this._handleStop(),this._cleanUp(),this.playState=createjs.Sound.PLAY_FINISHED,this},a.destroy=function(){this._cleanUp(),this.src=null,this.playbackResource=null,this.removeAllEventListeners()},a.applyPlayProps=function(a){return null!=a.offset&&this.setPosition(a.offset),null!=a.loop&&this.setLoop(a.loop),null!=a.volume&&this.setVolume(a.volume),null!=a.pan&&this.setPan(a.pan),null!=a.startTime&&(this.setStartTime(a.startTime),this.setDuration(a.duration)),this},a.toString=function(){return"[AbstractSoundInstance]"},a.getPaused=function(){return this._paused},a.setPaused=function(a){return a!==!0&&a!==!1||this._paused==a||1==a&&this.playState!=createjs.Sound.PLAY_SUCCEEDED?void 0:(this._paused=a,a?this._pause():this._resume(),clearTimeout(this.delayTimeoutId),this)},a.setVolume=function(a){return a==this._volume?this:(this._volume=Math.max(0,Math.min(1,a)),this._muted||this._updateVolume(),this)},a.getVolume=function(){return this._volume},a.setMuted=function(a){return a===!0||a===!1?(this._muted=a,this._updateVolume(),this):void 0},a.getMuted=function(){return this._muted},a.setPan=function(a){return a==this._pan?this:(this._pan=Math.max(-1,Math.min(1,a)),this._updatePan(),this)},a.getPan=function(){return this._pan},a.getPosition=function(){return this._paused||this.playState!=createjs.Sound.PLAY_SUCCEEDED||(this._position=this._calculateCurrentPosition()),this._position},a.setPosition=function(a){return this._position=Math.max(0,a),this.playState==createjs.Sound.PLAY_SUCCEEDED&&this._updatePosition(),this},a.getStartTime=function(){return this._startTime},a.setStartTime=function(a){return a==this._startTime?this:(this._startTime=Math.max(0,a||0),this._updateStartTime(),this)},a.getDuration=function(){return this._duration},a.setDuration=function(a){return a==this._duration?this:(this._duration=Math.max(0,a||0),this._updateDuration(),this)},a.setPlaybackResource=function(a){return this._playbackResource=a,0==this._duration&&this._setDurationFromSource(),this},a.getPlaybackResource=function(){return this._playbackResource},a.getLoop=function(){return this._loop},a.setLoop=function(a){null!=this._playbackResource&&(0!=this._loop&&0==a?this._removeLooping(a):0==this._loop&&0!=a&&this._addLooping(a)),this._loop=a},a._sendEvent=function(a){var b=new createjs.Event(a);this.dispatchEvent(b)},a._cleanUp=function(){clearTimeout(this.delayTimeoutId),this._handleCleanUp(),this._paused=!1,createjs.Sound._playFinished(this)},a._interrupt=function(){this._cleanUp(),this.playState=createjs.Sound.PLAY_INTERRUPTED,this._sendEvent("interrupted")},a._beginPlaying=function(a){return this.setPosition(a.offset),this.setLoop(a.loop),this.setVolume(a.volume),this.setPan(a.pan),null!=a.startTime&&(this.setStartTime(a.startTime),this.setDuration(a.duration)),null!=this._playbackResource&&this._position<this._duration?(this._paused=!1,this._handleSoundReady(),this.playState=createjs.Sound.PLAY_SUCCEEDED,this._sendEvent("succeeded"),!0):(this._playFailed(),!1)},a._playFailed=function(){this._cleanUp(),this.playState=createjs.Sound.PLAY_FAILED,this._sendEvent("failed")},a._handleSoundComplete=function(){return this._position=0,0!=this._loop?(this._loop--,this._handleLoop(),void this._sendEvent("loop")):(this._cleanUp(),this.playState=createjs.Sound.PLAY_FINISHED,void this._sendEvent("complete"))},a._handleSoundReady=function(){},a._updateVolume=function(){},a._updatePan=function(){},a._updateStartTime=function(){},a._updateDuration=function(){},a._setDurationFromSource=function(){},a._calculateCurrentPosition=function(){},a._updatePosition=function(){},a._removeLooping=function(){},a._addLooping=function(){},a._pause=function(){},a._resume=function(){},a._handleStop=function(){},a._handleCleanUp=function(){},a._handleLoop=function(){},createjs.AbstractSoundInstance=createjs.promote(AbstractSoundInstance,"EventDispatcher"),createjs.DefaultSoundInstance=createjs.AbstractSoundInstance}(),this.createjs=this.createjs||{},function(){"use strict";var AbstractPlugin=function(){this._capabilities=null,this._loaders={},this._audioSources={},this._soundInstances={},this._volume=1,this._loaderClass,this._soundInstanceClass},a=AbstractPlugin.prototype;AbstractPlugin._capabilities=null,AbstractPlugin.isSupported=function(){return!0},a.register=function(a){var b=this._loaders[a.src];return b&&!b.canceled?this._loaders[a.src]:(this._audioSources[a.src]=!0,this._soundInstances[a.src]=[],b=new this._loaderClass(a),b.on("complete",createjs.proxy(this._handlePreloadComplete,this)),this._loaders[a.src]=b,b)},a.preload=function(a){a.on("error",createjs.proxy(this._handlePreloadError,this)),a.load()},a.isPreloadStarted=function(a){return null!=this._audioSources[a]},a.isPreloadComplete=function(a){return!(null==this._audioSources[a]||1==this._audioSources[a])},a.removeSound=function(a){if(this._soundInstances[a]){for(var b=this._soundInstances[a].length;b--;){var c=this._soundInstances[a][b];c.destroy()}delete this._soundInstances[a],delete this._audioSources[a],this._loaders[a]&&this._loaders[a].destroy(),delete this._loaders[a]}},a.removeAllSounds=function(){for(var a in this._audioSources)this.removeSound(a)},a.create=function(a,b,c){this.isPreloadStarted(a)||this.preload(this.register(a));var d=new this._soundInstanceClass(a,b,c,this._audioSources[a]);return this._soundInstances[a].push(d),d},a.setVolume=function(a){return this._volume=a,this._updateVolume(),!0},a.getVolume=function(){return this._volume},a.setMute=function(){return this._updateVolume(),!0},a.toString=function(){return"[AbstractPlugin]"},a._handlePreloadComplete=function(a){var b=a.target.getItem().src;this._audioSources[b]=a.result;for(var c=0,d=this._soundInstances[b].length;d>c;c++){var e=this._soundInstances[b][c];e.setPlaybackResource(this._audioSources[b])}},a._handlePreloadError=function(){},a._updateVolume=function(){},createjs.AbstractPlugin=AbstractPlugin}(),this.createjs=this.createjs||{},function(){"use strict";function a(a){this.AbstractLoader_constructor(a,!0,createjs.AbstractLoader.SOUND)}var b=createjs.extend(a,createjs.AbstractLoader);a.context=null,b.toString=function(){return"[WebAudioLoader]"},b._createRequest=function(){this._request=new createjs.XHRRequest(this._item,!1),this._request.setResponseType("arraybuffer")},b._sendComplete=function(){a.context.decodeAudioData(this._rawResult,createjs.proxy(this._handleAudioDecoded,this),createjs.proxy(this._sendError,this))},b._handleAudioDecoded=function(a){this._result=a,this.AbstractLoader__sendComplete()},createjs.WebAudioLoader=createjs.promote(a,"AbstractLoader")}(),this.createjs=this.createjs||{},function(){"use strict";function WebAudioSoundInstance(a,c,d,e){this.AbstractSoundInstance_constructor(a,c,d,e),this.gainNode=b.context.createGain(),this.panNode=b.context.createPanner(),this.panNode.panningModel=b._panningModel,this.panNode.connect(this.gainNode),this.sourceNode=null,this._soundCompleteTimeout=null,this._sourceNodeNext=null,this._playbackStartTime=0,this._endedHandler=createjs.proxy(this._handleSoundComplete,this)}var a=createjs.extend(WebAudioSoundInstance,createjs.AbstractSoundInstance),b=WebAudioSoundInstance;b.context=null,b.destinationNode=null,b._panningModel="equalpower",a.destroy=function(){this.AbstractSoundInstance_destroy(),this.panNode.disconnect(0),this.panNode=null,this.gainNode.disconnect(0),this.gainNode=null},a.toString=function(){return"[WebAudioSoundInstance]"},a._updatePan=function(){this.panNode.setPosition(this._pan,0,-.5)},a._removeLooping=function(){this._sourceNodeNext=this._cleanUpAudioNode(this._sourceNodeNext)},a._addLooping=function(){this.playState==createjs.Sound.PLAY_SUCCEEDED&&(this._sourceNodeNext=this._createAndPlayAudioNode(this._playbackStartTime,0))},a._setDurationFromSource=function(){this._duration=1e3*this.playbackResource.duration},a._handleCleanUp=function(){this.sourceNode&&this.playState==createjs.Sound.PLAY_SUCCEEDED&&(this.sourceNode=this._cleanUpAudioNode(this.sourceNode),this._sourceNodeNext=this._cleanUpAudioNode(this._sourceNodeNext)),0!=this.gainNode.numberOfOutputs&&this.gainNode.disconnect(0),clearTimeout(this._soundCompleteTimeout),this._playbackStartTime=0},a._cleanUpAudioNode=function(a){return a&&(a.stop(0),a.disconnect(0),a=null),a},a._handleSoundReady=function(){this.gainNode.connect(b.destinationNode);var a=.001*this._duration,c=.001*this._position;c>a&&(c=a),this.sourceNode=this._createAndPlayAudioNode(b.context.currentTime-a,c),this._playbackStartTime=this.sourceNode.startTime-c,this._soundCompleteTimeout=setTimeout(this._endedHandler,1e3*(a-c)),0!=this._loop&&(this._sourceNodeNext=this._createAndPlayAudioNode(this._playbackStartTime,0))},a._createAndPlayAudioNode=function(a,c){var d=b.context.createBufferSource();d.buffer=this.playbackResource,d.connect(this.panNode);var e=.001*this._duration;return d.startTime=a+e,d.start(d.startTime,c+.001*this._startTime,e-c),d},a._pause=function(){this._position=1e3*(b.context.currentTime-this._playbackStartTime),this.sourceNode=this._cleanUpAudioNode(this.sourceNode),this._sourceNodeNext=this._cleanUpAudioNode(this._sourceNodeNext),0!=this.gainNode.numberOfOutputs&&this.gainNode.disconnect(0),clearTimeout(this._soundCompleteTimeout)},a._resume=function(){this._handleSoundReady()},a._updateVolume=function(){var a=this._muted?0:this._volume;a!=this.gainNode.gain.value&&(this.gainNode.gain.value=a)},a._calculateCurrentPosition=function(){return 1e3*(b.context.currentTime-this._playbackStartTime)},a._updatePosition=function(){this.sourceNode=this._cleanUpAudioNode(this.sourceNode),this._sourceNodeNext=this._cleanUpAudioNode(this._sourceNodeNext),clearTimeout(this._soundCompleteTimeout),this._paused||this._handleSoundReady()},a._handleLoop=function(){this._cleanUpAudioNode(this.sourceNode),this.sourceNode=this._sourceNodeNext,this._playbackStartTime=this.sourceNode.startTime,this._sourceNodeNext=this._createAndPlayAudioNode(this._playbackStartTime,0),this._soundCompleteTimeout=setTimeout(this._endedHandler,this._duration)},a._updateDuration=function(){this.playState==createjs.Sound.PLAY_SUCCEEDED&&(this._pause(),this._resume())},createjs.WebAudioSoundInstance=createjs.promote(WebAudioSoundInstance,"AbstractSoundInstance")}(),this.createjs=this.createjs||{},function(){"use strict";function WebAudioPlugin(){this.AbstractPlugin_constructor(),this._panningModel=b._panningModel,this.context=b.context,this.dynamicsCompressorNode=this.context.createDynamicsCompressor(),this.dynamicsCompressorNode.connect(this.context.destination),this.gainNode=this.context.createGain(),this.gainNode.connect(this.dynamicsCompressorNode),createjs.WebAudioSoundInstance.destinationNode=this.gainNode,this._capabilities=b._capabilities,this._loaderClass=createjs.WebAudioLoader,this._soundInstanceClass=createjs.WebAudioSoundInstance,this._addPropsToClasses()}var a=createjs.extend(WebAudioPlugin,createjs.AbstractPlugin),b=WebAudioPlugin;b._capabilities=null,b._panningModel="equalpower",b.context=null,b.isSupported=function(){var a=createjs.BrowserDetect.isIOS||createjs.BrowserDetect.isAndroid||createjs.BrowserDetect.isBlackberry;return"file:"!=location.protocol||a||this._isFileXHRSupported()?(b._generateCapabilities(),null==b.context?!1:!0):!1},b.playEmptySound=function(){if(null!=b.context){var a=b.context.createBufferSource();a.buffer=b.context.createBuffer(1,1,22050),a.connect(b.context.destination),a.start(0,0,0)}},b._isFileXHRSupported=function(){var a=!0,b=new XMLHttpRequest;try{b.open("GET","WebAudioPluginTest.fail",!1)}catch(c){return a=!1}b.onerror=function(){a=!1},b.onload=function(){a=404==this.status||200==this.status||0==this.status&&""!=this.response};try{b.send()}catch(c){a=!1}return a},b._generateCapabilities=function(){if(null==b._capabilities){var a=document.createElement("audio");if(null==a.canPlayType)return null;if(null==b.context)if(window.AudioContext)b.context=new AudioContext;else{if(!window.webkitAudioContext)return null;b.context=new webkitAudioContext}b._compatibilitySetUp(),b.playEmptySound(),b._capabilities={panning:!0,volume:!0,tracks:-1};for(var c=createjs.Sound.SUPPORTED_EXTENSIONS,d=createjs.Sound.EXTENSION_MAP,e=0,f=c.length;f>e;e++){var g=c[e],h=d[g]||g;b._capabilities[g]="no"!=a.canPlayType("audio/"+g)&&""!=a.canPlayType("audio/"+g)||"no"!=a.canPlayType("audio/"+h)&&""!=a.canPlayType("audio/"+h)}b.context.destination.numberOfChannels<2&&(b._capabilities.panning=!1)}},b._compatibilitySetUp=function(){if(b._panningModel="equalpower",!b.context.createGain){b.context.createGain=b.context.createGainNode;var a=b.context.createBufferSource();a.__proto__.start=a.__proto__.noteGrainOn,a.__proto__.stop=a.__proto__.noteOff,b._panningModel=0}},a.toString=function(){return"[WebAudioPlugin]"},a._addPropsToClasses=function(){var a=this._soundInstanceClass;a.context=this.context,a.destinationNode=this.gainNode,a._panningModel=this._panningModel,this._loaderClass.context=this.context},a._updateVolume=function(){var a=createjs.Sound._masterMute?0:this._volume;a!=this.gainNode.gain.value&&(this.gainNode.gain.value=a)},createjs.WebAudioPlugin=createjs.promote(WebAudioPlugin,"AbstractPlugin")}(),this.createjs=this.createjs||{},function(){"use strict";function HTMLAudioTagPool(){throw"HTMLAudioTagPool cannot be instantiated"}function a(){this._tags=[]}var b=HTMLAudioTagPool;b._tags={},b._tagPool=new a,b._tagUsed={},b.get=function(a){var c=b._tags[a];return null==c?(c=b._tags[a]=b._tagPool.get(),c.src=a):b._tagUsed[a]?(c=b._tagPool.get(),c.src=a):b._tagUsed[a]=!0,c},b.set=function(a,c){c==b._tags[a]?b._tagUsed[a]=!1:b._tagPool.set(c)},b.remove=function(a){var c=b._tags[a];return null==c?!1:(b._tagPool.set(c),delete b._tags[a],delete b._tagUsed[a],!0)},b.getDuration=function(a){var c=b._tags[a];return null==c?0:1e3*c.duration},createjs.HTMLAudioTagPool=HTMLAudioTagPool;var c=a.prototype;c.constructor=a,c.get=function(){var a;return a=0==this._tags.length?this._createTag():this._tags.pop(),null==a.parentNode&&document.body.appendChild(a),a},c.set=function(a){var b=createjs.indexOf(this._tags,a);-1==b&&(this._tags.src=null,this._tags.push(a))},c.toString=function(){return"[TagPool]"},c._createTag=function(){var a=document.createElement("audio");return a.autoplay=!1,a.preload="none",a}}(),this.createjs=this.createjs||{},function(){"use strict";function HTMLAudioSoundInstance(a,b,c,d){this.AbstractSoundInstance_constructor(a,b,c,d),this._audioSpriteStopTime=null,this._delayTimeoutId=null,this._endedHandler=createjs.proxy(this._handleSoundComplete,this),this._readyHandler=createjs.proxy(this._handleTagReady,this),this._stalledHandler=createjs.proxy(this._playFailed,this),this._audioSpriteEndHandler=createjs.proxy(this._handleAudioSpriteLoop,this),this._loopHandler=createjs.proxy(this._handleSoundComplete,this),c?this._audioSpriteStopTime=.001*(b+c):this._duration=createjs.HTMLAudioTagPool.getDuration(this.src)}var a=createjs.extend(HTMLAudioSoundInstance,createjs.AbstractSoundInstance);a.setMasterVolume=function(){this._updateVolume()},a.setMasterMute=function(){this._updateVolume()},a.toString=function(){return"[HTMLAudioSoundInstance]"},a._removeLooping=function(){null!=this._playbackResource&&(this._playbackResource.loop=!1,this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1))},a._addLooping=function(){null==this._playbackResource||this._audioSpriteStopTime||(this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1),this._playbackResource.loop=!0)},a._handleCleanUp=function(){var a=this._playbackResource;if(null!=a){a.pause(),a.loop=!1,a.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED,this._endedHandler,!1),a.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_READY,this._readyHandler,!1),a.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_STALLED,this._stalledHandler,!1),a.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1),a.removeEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE,this._audioSpriteEndHandler,!1);try{a.currentTime=this._startTime}catch(b){}createjs.HTMLAudioTagPool.set(this.src,a),this._playbackResource=null}},a._beginPlaying=function(a){return this._playbackResource=createjs.HTMLAudioTagPool.get(this.src),this.AbstractSoundInstance__beginPlaying(a)},a._handleSoundReady=function(){if(4!==this._playbackResource.readyState){var a=this._playbackResource;return a.addEventListener(createjs.HTMLAudioPlugin._AUDIO_READY,this._readyHandler,!1),a.addEventListener(createjs.HTMLAudioPlugin._AUDIO_STALLED,this._stalledHandler,!1),a.preload="auto",void a.load()}this._updateVolume(),this._playbackResource.currentTime=.001*(this._startTime+this._position),this._audioSpriteStopTime?this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE,this._audioSpriteEndHandler,!1):(this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED,this._endedHandler,!1),0!=this._loop&&(this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1),this._playbackResource.loop=!0)),this._playbackResource.play()},a._handleTagReady=function(){this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_READY,this._readyHandler,!1),this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_STALLED,this._stalledHandler,!1),this._handleSoundReady()},a._pause=function(){this._playbackResource.pause()},a._resume=function(){this._playbackResource.play()},a._updateVolume=function(){if(null!=this._playbackResource){var a=this._muted||createjs.Sound._masterMute?0:this._volume*createjs.Sound._masterVolume;a!=this._playbackResource.volume&&(this._playbackResource.volume=a)}},a._calculateCurrentPosition=function(){return 1e3*this._playbackResource.currentTime-this._startTime},a._updatePosition=function(){this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1),this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._handleSetPositionSeek,!1);try{this._playbackResource.currentTime=.001*(this._position+this._startTime)}catch(a){this._handleSetPositionSeek(null)}},a._handleSetPositionSeek=function(){null!=this._playbackResource&&(this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._handleSetPositionSeek,!1),this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1))},a._handleAudioSpriteLoop=function(){this._playbackResource.currentTime<=this._audioSpriteStopTime||(this._playbackResource.pause(),0==this._loop?this._handleSoundComplete(null):(this._position=0,this._loop--,this._playbackResource.currentTime=.001*this._startTime,this._paused||this._playbackResource.play(),this._sendEvent("loop")))},a._handleLoop=function(){0==this._loop&&(this._playbackResource.loop=!1,this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1))},a._updateStartTime=function(){this._audioSpriteStopTime=.001*(this._startTime+this._duration),this.playState==createjs.Sound.PLAY_SUCCEEDED&&(this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED,this._endedHandler,!1),this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE,this._audioSpriteEndHandler,!1))},a._updateDuration=function(){this._audioSpriteStopTime=.001*(this._startTime+this._duration),this.playState==createjs.Sound.PLAY_SUCCEEDED&&(this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED,this._endedHandler,!1),this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE,this._audioSpriteEndHandler,!1))},createjs.HTMLAudioSoundInstance=createjs.promote(HTMLAudioSoundInstance,"AbstractSoundInstance")}(),this.createjs=this.createjs||{},function(){"use strict";function HTMLAudioPlugin(){this.AbstractPlugin_constructor(),this.defaultNumChannels=2,this._capabilities=b._capabilities,this._loaderClass=createjs.SoundLoader,this._soundInstanceClass=createjs.HTMLAudioSoundInstance}var a=createjs.extend(HTMLAudioPlugin,createjs.AbstractPlugin),b=HTMLAudioPlugin;b.MAX_INSTANCES=30,b._AUDIO_READY="canplaythrough",b._AUDIO_ENDED="ended",b._AUDIO_SEEKED="seeked",b._AUDIO_STALLED="stalled",b._TIME_UPDATE="timeupdate",b._capabilities=null,b.isSupported=function(){return b._generateCapabilities(),null!=b._capabilities},b._generateCapabilities=function(){if(null==b._capabilities){var a=document.createElement("audio");if(null==a.canPlayType)return null;b._capabilities={panning:!1,volume:!0,tracks:-1};for(var c=createjs.Sound.SUPPORTED_EXTENSIONS,d=createjs.Sound.EXTENSION_MAP,e=0,f=c.length;f>e;e++){var g=c[e],h=d[g]||g;b._capabilities[g]="no"!=a.canPlayType("audio/"+g)&&""!=a.canPlayType("audio/"+g)||"no"!=a.canPlayType("audio/"+h)&&""!=a.canPlayType("audio/"+h)}}},a.register=function(a){var b=createjs.HTMLAudioTagPool.get(a.src),c=this.AbstractPlugin_register(a);return c.setTag(b),c},a.removeSound=function(a){this.AbstractPlugin_removeSound(a),createjs.HTMLAudioTagPool.remove(a)},a.create=function(a,b,c){var d=this.AbstractPlugin_create(a,b,c);return d.setPlaybackResource(null),d},a.toString=function(){return"[HTMLAudioPlugin]"},a.setVolume=a.getVolume=a.setMute=null,createjs.HTMLAudioPlugin=createjs.promote(HTMLAudioPlugin,"AbstractPlugin")}();
/*global LivepressConfig, Livepress, soundManager, console */
Livepress.sounds = (function() {
	var soundsBasePath = LivepressConfig.noncdn_url + '/sounds/';
	var soundOn         = ( 1 == LivepressConfig.sounds_default );
	var sounds          = {};
    var soundsLoaded    = false;

	// Sound files
	var vibeslr = 'vibes_04-04LR_02-01.mp3';
	var vibesshort = 'vibes-short_09-08.mp3';
	var piano16 = 'piano_w-pad_01-16M_01-01.mp3';
	var piano17 = 'piano_w-pad_01-17M_01.mp3';

    var manager = createjs.Sound;
    var timeoutId = 0;

	manager.alternateExtensions = ['mp3'];

    sounds.loadSounds = function() {
        manager.registerSound( soundsBasePath + vibeslr, 'commentAdded', 1 );
        manager.registerSound( soundsBasePath + vibeslr, 'firstComment', 1 );
        manager.registerSound( soundsBasePath + vibesshort, 'commentReplyToUserReceived', 1 );
        manager.registerSound( soundsBasePath + vibeslr, 'commented', 1 );
        manager.registerSound( soundsBasePath + piano17, 'newPost', 1 );
        manager.registerSound( soundsBasePath + piano16, 'postUpdated', 1 );
        soundsLoaded = true;
    };

    if ( soundOn ) {
        sounds.loadSounds();
    }

	sounds.on = function() {
		soundOn = true;
        if ( false === soundsLoaded ) {
            sounds.loadSounds();
        }
	};

	sounds.off = function() {
		soundOn = false;
	};

	sounds.play = function( sound ) {
    if ( timeoutId !== 0 ) {
      window.clearTimeout( timeoutId );
    }
    timeoutId = window.setTimeout(function() {
      manager.play( sound );
    }, 500 );
	};

	return sounds;
}() );

/*global _, LivepressConfig */
/*
 * LivePress - Hides new updates until the user scrolls up to view them.
 */

(function( window, $ ) {

    var firstRun = true,
        updates,
        oldUpdates = [],
        newUpdates = [],
        newUpdateIDs = [],
        viewNewPostsButtonContainer = document.getElementById( 'view-new-button-container' ),
        viewNewPostsButton = document.getElementById( 'view-new-posts' ),
        livepressPostContent = document.getElementById( 'post_content_livepress' ),
        postTitle = document.querySelector( LivepressConfig.scroll_target_for_post_title ),
        bottomTarget =  document.querySelector( LivepressConfig.scroll_target_for_post_bottom ),
        bottomClick =  LivepressConfig.scroll_target_bottom_click,
        observer,
        updateOrder = ( document.body.classList.contains( 'lp-update-order-bottom' ) ) ? 'bottom' : 'top';

    // Only run on LP pages, and only if the "Hidden Updates" feature is enabled
    if ( ! document.body.classList.contains( 'livepress-live' ) || ! document.body.classList.contains( 'lp-pause-new-updates' ) || ! livepressPostContent ) {

       return;
    }

    // Make sure everything we need is here
    if ( ! ( viewNewPostsButtonContainer && viewNewPostsButton && postTitle ) ) {

       return;
    }

    /**
     * @summary Checks to see if an element is in the viewport.
     *
     * @param object A DOM element.
     *
     * @return bool True if in viewport
     */
    function isInViewport( element ) {
        var rect, html;
        if ( null === element ) {

            return false;
        }
        rect = element.getBoundingClientRect();
        html = document.documentElement;

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= ( window.innerHeight || html.clientHeight ) &&
            rect.right <= ( window.innerWidth || html.clientWidth )
        );
    }

    /**
     * Workout if the last update loaded partly off the bottom of the page
     *
     * @return bool True if just of screen
     */
    function isLastUpdateJustOffScreen() {

        var target =  $( '.livepress-update:last-of-type' ),
            offset = target.offset(),
            html = document.documentElement,
            windowHeight = ( window.innerHeight || html.clientHeight ),
            HeightOfPage = $( window ).scrollTop() + windowHeight,
            bottomOfTarget, split ;

        if ( undefined === offset ) {

            return false;
        }
        bottomOfTarget = offset.top + target.height() + 50;

        split = ( ( offset.top - 20 < HeightOfPage ) && ( bottomOfTarget > HeightOfPage )  );

        return split;
    }

    /**
     * @summary Gets the LP update ID from a post.
     *
     * @param object A DOM element.
     *
     * @return string The ID number
     */
    function getUpdateIDFromUpdate( element ) {

        var updateID;

        // The update's ID attribute will be something like "livepress-update-20893249"
        if ( ! element.id || -1 === element.id.indexOf( 'livepress-update-' ) ) {
            return;
        }

        updateID = element.id.replace( 'livepress-update-', '' );

        return updateID;
    }

    /**
     * @summary Counts the number of unseen updates on the page.
     *
     * Counts the updates with the '-new' class. We can't count the
     * newUpdates or newUpdateIDs array here, because if a post is deleted
     * these arrays may not update.
     *
     * @return int Number of unseen updates.
     */
    function countUnseenUpdates() {
        var newUpdates = _.filter( document.querySelectorAll( '.livepress-update.-new' ), function( update ) {
            return update.classList.contains( 'oortle-diff-removed' ) ? false : true;
        });

        return newUpdates.length;
    }

    /**
     * Removes the '-new' class from posts.
     *
     * Used to reveal any new posts after the reader clicks the "View x new posts" button.
     *
     * @param object event
     *
     * @listens viewNewPostsButton:click
     */
    function showNewUpdates( event ) {
        var h = Math.max( document.documentElement.clientHeight, window.innerHeight || 0 );
        var atBottomOfPage = isInViewport( bottomTarget );

        if ( ! newUpdates || ! viewNewPostsButtonContainer || ! bottomClick ) {

            return;
        }

        // Remove the "-new" class from any posts with it
        _.each( newUpdates, function( update ) {
            update.classList.remove( '-new' );
        });

        // Move all of these into the old posts array now that they're read, and empty the new posts array
        oldUpdates = oldUpdates.concat( newUpdates );
        newUpdates = [];
        newUpdateIDs = [];
        if ( ! isInViewport( postTitle ) && 'top' === updateOrder ) {
            jQuery( 'html, body' ).animate({
                scrollTop: jQuery( postTitle ).offset().top - 50
            }, 400 );

            // Hide button container
            viewNewPostsButtonContainer.classList.remove( '-visible' );
        }

        if ( 'bottom' === updateOrder ) {
            var unloadedImages = jQuery( '.livepress-update:last-of-type' ).find( 'img' ).filter(
                function(index, element) {
                  return !element.complete;
                }
            );
            if (unloadedImages.length > 0) {
                unloadedImages.first().one("load", showNewUpdates);
                return;
            }

            var scrollDueToClick = ( 'true' === bottomClick ) & ! atBottomOfPage;
            var autoScroll = ( 'true' !== bottomClick ) & isLastUpdateJustOffScreen();
            if ( scrollDueToClick || autoScroll ) {
                var topOfLastUpdate = jQuery( '.livepress-update:last-of-type' ).offset().top - 50;
                var topOfBottomTarget = jQuery( bottomTarget ).offset().top;
                var scrollTop = topOfBottomTarget - h + 100;
                scrollTop =  Math.min( scrollTop, topOfLastUpdate );
                jQuery( 'html, body' ).animate({ scrollTop: scrollTop }, 400 );
            }
        }
    }

    /**
     * Moves the "View x new posts" button below the first pinned post.
     *
     * Moves the "View x new posts" below the pinned post, because there was no
     * way to do this with hooking into LivePress.
     *
     * @param object event
     */
    function moveViewNewPosts() {

        if ( ! livepressPostContent || ! viewNewPostsButtonContainer ) {
            return;
        }

        // Don't do anything if it's already at the top
        if ( livepressPostContent.firstChild === viewNewPostsButtonContainer ) {
            return;
        }

        // Remove the "View New Posts" container
        viewNewPostsButtonContainer.parentNode.removeChild( viewNewPostsButtonContainer );

        // Add it back in after the pinned post
        livepressPostContent.insertBefore( viewNewPostsButtonContainer, livepressPostContent.firstChild );
    }


    /**
     * Shows the "View x new posts" button when needed.
     *
     * The "View x new posts" button should appear when the reader scrolls to
     * the top of the page if there are new posts to read.
     *
     * @listens window:scroll
     */
    function maybeShowNewPostsButton() {

        // Check if we're scrolled in range
        var atTopOfPage = isInViewport( postTitle );
        var atBottomOfPage = isInViewport( bottomTarget );
        var count = countUnseenUpdates();
        var float = document.body.classList.contains( 'lp-pause-new-updates-float' );
        var ButtonVisible = viewNewPostsButtonContainer.classList.contains( '-visible' );

        if ( 'top' === updateOrder ) {

            // If user scrolls to top of page then we should just show the updates
            if ( ButtonVisible && atTopOfPage && float && 'true' === LivepressConfig.show_update_on_scroll ) {
                showNewUpdates();
                count = 0;
            }
        } else {

            if ( isLastUpdateJustOffScreen() ) {
                showNewUpdates();
            }
        }

        // If count is zero, make sure it's hidden regardless of viewport spot, so continue past this
        if ( 0 < count && ! ( ! atTopOfPage ||  atBottomOfPage || float ) ) {

            return;
        }

        if ( 0 !== count ) {
            viewNewPostsButtonContainer.classList.add( '-visible' );
        } else {
            viewNewPostsButtonContainer.classList.remove( '-visible' );
        }
    }

    /**
     * Separates any new updates and adds an "unread" class to them.
     *
     * Used with the 'live_post_update' event. This is called on page load and when
     * any updates are pushed, so we'll keep a counter - no posts should be considered 'unread'
     * on page load.
     *
     * @param object mutation
     *
     * @listens document:live_post_update
     */
    function catchNewUpdates( mutations ) {

        // Find the most recent updates, and we'll treat those separately.
        var uncategorizedNewUpdates,
            atTopOfPage = isInViewport( postTitle ),
            unseenUpdateCount;

        updates = document.querySelectorAll( '#post_content_livepress .livepress-update' );

        if ( true === firstRun ) {

            // First time running this callback, consider everything read
            if ( updates ) {
                oldUpdates = Array.prototype.slice.call( updates );
            }

            firstRun = false;
        } else {

            // Bail if everything we need isn't here
            if ( ! ( updates && newUpdates && newUpdateIDs && oldUpdates ) ) {

                return;
            }

            // If they're not already in newUpdates and not in oldUpdates, we'll add them here.
            // Edited posts could get inserted this way too, but have a value other than 0 for
            // the "data-lpg" attribute, so watch for that as well.
            uncategorizedNewUpdates = _.filter( updates, function( update ) {
                var isJustAdded,
                    isEdited,
                    isHidden;

                // Don't hide old posts loaded via the lazy loading
                if ( $( update ).hasClass( 'livepress-old-update' ) ) {

                  return false;
                }

                isJustAdded = ! ( _.contains( newUpdates, update ) || _.contains( oldUpdates, update ) );
                isEdited = ( '0' === update.getAttribute( 'data-lpg' ) ? false : true );

                // We don't want to make edited posts hidden, but if a post was hidden
                // and is now edited, we don't want to make it visible
                isHidden = ( -1 === newUpdateIDs.indexOf( getUpdateIDFromUpdate( update ) ) ? false : true );

                return isJustAdded && ( ! isEdited || ( isEdited && isHidden ) );
            });

            // Add a class to all of the new updates, unless we're at the top of the page and there are no hidden updates
            _.each( uncategorizedNewUpdates, function( update ) {

                var updateID = getUpdateIDFromUpdate( update );

                // Show new posts when we're scrolled to the top,
                // unless this post is only edited or deleted and not really new
                if ( 'top' === updateOrder ) {
                    if ( atTopOfPage && '0' === update.getAttribute( 'data-lpg' ) && 0 === newUpdates.length ) {
                        showNewUpdates();

                        if ( -1 === oldUpdates.indexOf( update ) ) {
                            oldUpdates = oldUpdates.concat( update );
                        }

                        return;
                    }
                } else {
                    if ( isInViewport(  document.querySelector( '.livepress-update:last-of-type' ) ) && '0' === update.getAttribute( 'data-lpg' ) && 0 === newUpdates.length ) {
                        showNewUpdates();

                        if ( -1 === oldUpdates.indexOf( update ) ) {
                            oldUpdates = oldUpdates.concat( update );
                        }

                        return;
                    }
                }

                // Hide them
                update.classList.add( '-new' );

                // Add these back to our array of the other unread updates
                if ( -1 === newUpdates.indexOf( update ) ) {
                    newUpdates = newUpdates.concat( update );
                }

                // Keep track of new update IDs, without duplicates
                if ( -1 === newUpdateIDs.indexOf( updateID ) ) {
                    newUpdateIDs = newUpdateIDs.concat( updateID );
                }

                // Need to recalculate this in case LivePress deleted any posts
               unseenUpdateCount = countUnseenUpdates();
               if ( ! isInViewport( bottomTarget ) ) {
                   if ( 1 === unseenUpdateCount ) {
                       viewNewPostsButton.innerText = LivepressConfig.new_update;
                   } else {
                       viewNewPostsButton.innerText = LivepressConfig.new_updates;
                   }
                   viewNewPostsButtonContainer.classList.add( '-visible' );
               } else {
                   update.classList.remove( '-new' );
               }
            });
        }

        // Need to recalculate this in case LivePress deleted any posts
        unseenUpdateCount = countUnseenUpdates();

        // Update button text, move it above any new updates, and make it visible if we're at the top
        if ( 1 === unseenUpdateCount ) {
            viewNewPostsButton.innerText = LivepressConfig.view_new_update.replace( '##count##', unseenUpdateCount );
        } else {
            viewNewPostsButton.innerText = LivepressConfig.view_new_updates.replace( '##count##', unseenUpdateCount );
        }

        moveViewNewPosts();
        maybeShowNewPostsButton();
    }

    function hideBottomMessage() {
      jQuery( '.-new' ).removeClass( '-new' );
        viewNewPostsButtonContainer.classList.remove( '-visible' );
    }

    // Attach event handlers
    observer = new MutationObserver( catchNewUpdates );
    observer.observe( livepressPostContent, { childList: true, attributes: true });

    document.addEventListener( 'DOMContentLoaded', moveViewNewPosts );
    viewNewPostsButton.addEventListener( 'click', showNewUpdates );
    if ( 'top' === updateOrder ) {
        window.addEventListener( 'scroll', _.throttle( maybeShowNewPostsButton, 250 ) );
    } else {
        window.addEventListener( 'scroll', _.throttle( hideBottomMessage, 250 ) );
    }
    catchNewUpdates();

})( this, jQuery );

/**
 * Handles the lazy loading of updates
 */
(function( window, $ ) {
$( document ).ready(function() {
    var win = $( window );
    var totalPosts = parseInt( $( '#lp-lazy-loading' ).attr( 'data-total_posts' ), 10 );
    var fetching = false;

    // Each time the user scrolls
    window.addEventListener( 'scroll', _.throttle(  function() {
        var $lazyLoading = $( '#lp-lazy-loading' );
        var $lazyLoadingImg = $( '#lp-lazy-loading img' );
        if ( ! fetching && (  totalPosts >  parseInt( $lazyLoading.attr( 'data-offset' ), 10 ) ) ) {

            // End of the document reached?
            if ( isInViewport( document.getElementById( 'lp-lazy-loading' ) ) ) {
                $lazyLoadingImg.show();
                fetching = true;
                $.ajax({
                    type:    'get',
                    dataType:'json',
                    data: {
                        action: 'lp_lazy_load',
                        offset: $lazyLoading.attr( 'data-offset' ),
                        top_update_id: $lazyLoading.attr( 'data-top_update' )
                    },
                    success: function( json ) {

                        $.each( json.data.html, function( key, data ) {
                              if ( 0 === $( '#livepress-update-' + data[0] ).not( '.livepress-placeholder' ).length ) {
                                  $( '#livepress-update-' + data[0] ).replaceWith( data[1] );
                            }
                        });

                        $lazyLoading.attr( 'data-offset', json.data.offset );
                        $lazyLoadingImg.hide();

                        updateLiveUpdates();
                        fetching = false;
                    }
                });
            }
        }
    }), 250 );

    function updateLiveUpdates () {
        var $liveUpdates = jQuery( document.querySelectorAll( '#post_content_livepress .livepress-old-update' ) ).not( '.oortle-diff-removed' );

        var currentPostLink = window.location.href.replace( window.location.hash, '' );

        $liveUpdates.each(function() {
            var $this = jQuery( this );
            var id = $this.attr( 'id' );
            if ( ! $this.is( '.lp-live' ) ) {
                $this.addClass( 'lp-live' );
                new Livepress.Ui.UpdateView( $this, currentPostLink, true );

                var timestamp = $this.find( 'abbr.livepress-timestamp' );

                if ( 'timeago' === LivepressConfig.timestamp_format ) {
                    timestamp.timeago().attr( 'title', '' );
                } else {
                    jQuery( '.lp-bar abbr.livepress-timestamp' ).timeago();
                    timestamp.data( 'timestamp', timestamp.attr( 'title' ) ).attr( 'title', '' );
                }
                timestamp.wrap( '<a href="' + Livepress.getUpdatePermalink( id ) + '" ></a>' );

                if ( 'undefined' !== typeof( FB ) ) {
                   FB.XFBML.parse( document.getElementById( id ) );
                }

                if ( 'undefined' !== typeof window.instgrm ) {
                    window.instgrm.Embeds.process();
                }
                embedAudioAndVideo( id  );
            }
        });
        jQuery( document ).trigger( 'live_post_update' );
    }

    // WordPress' Audio and Video embeds
    // Basically use the same function WP uses to embed audio and video
    // from shortcodes:
    function embedAudioAndVideo( updateId ) {
        var settings = {};
        if ( 'undefined' !== typeof _wpmejsSettings ) {
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
        var search = ['#', updateId, ' .wp-audio-shortcode, ', '#', updateId, ' .wp-video-shortcode'].join( '' );
        jQuery( search ).not( '.mejs-container' ).mediaelementplayer( settings );
    }
    /**
     * @summary Checks to see if an element is in the viewport.
     *
     * @param object A DOM element.
     *
     * @return bool True if in viewport
     */
    function isInViewport( element ) {
        var rect = element.getBoundingClientRect(),
            html = document.documentElement;

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= ( window.innerHeight || html.clientHeight ) &&
            rect.right <= ( window.innerWidth || html.clientWidth )
        );
    }
});

})( this, jQuery );
