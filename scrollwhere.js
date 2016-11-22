// todo window滚动窗口不支持computedStyle方法，使用替代方法计算高度，然后将window设为默认elem选项
// todo 其它配置 resize x轴滚动
// todo 方法scrolltop scrollbottom scrollposition(pos, fn)滚动到指定位置触发 isScrollElement滚动到指定元素触发

// 事件 滚动到顶部，滚动到底部，滚动到中间，滚动指定距离，滚动到指定元素
// 方法 滚动到顶部 滚动到底部 滚动到中间，滚动指定距离，滚动到指定位置，滚动到指定元素

/**
 * EvEmitter v1.0.3
 * Lil' event emitter
 * MIT License
 */

/* jshint unused: true, undef: true, strict: true */
( function( global, factory ) {
    // universal module definition
    /* jshint strict: false */ /* globals define, module, window */
    if ( typeof define == 'function' && define.amd ) {
        // AMD - RequireJS
        define( factory );
    } else if ( typeof module == 'object' && module.exports ) {
        // CommonJS - Browserify, Webpack
        module.exports = factory();
    } else {
        // Browser globals
        global.EvEmitter = factory();
    }

}( typeof window != 'undefined' ? window : this, function() {

    "use strict";

    function EvEmitter() {}

    var proto = EvEmitter.prototype;

    proto.on = function( eventName, listener ) {
        if ( !eventName || !listener ) {
            return;
        }
        // set events hash
        var events = this._events = this._events || {};
        // set listeners array
        var listeners = events[ eventName ] = events[ eventName ] || [];
        // only add once
        if ( listeners.indexOf( listener ) == -1 ) {
            listeners.push( listener );
        }

        return this;
    };

    proto.once = function( eventName, listener ) {
        if ( !eventName || !listener ) {
            return;
        }
        // add event
        this.on( eventName, listener );
        // set once flag
        // set onceEvents hash
        var onceEvents = this._onceEvents = this._onceEvents || {};
        // set onceListeners object
        var onceListeners = onceEvents[ eventName ] = onceEvents[ eventName ] || {};
        // set flag
        onceListeners[ listener ] = true;

        return this;
    };

    proto.off = function( eventName, listener ) {
        var listeners = this._events && this._events[ eventName ];
        if ( !listeners || !listeners.length ) {
            return;
        }
        var index = listeners.indexOf( listener );
        if ( index != -1 ) {
            listeners.splice( index, 1 );
        }

        return this;
    };

    proto.emitEvent = function( eventName, args ) {
        var listeners = this._events && this._events[ eventName ];
        if ( !listeners || !listeners.length ) {
            return;
        }
        var i = 0;
        var listener = listeners[i];
        args = args || [];
        // once stuff
        var onceListeners = this._onceEvents && this._onceEvents[ eventName ];

        while ( listener ) {
            var isOnce = onceListeners && onceListeners[ listener ];
            if ( isOnce ) {
                // remove listener
                // remove before trigger to prevent recursion
                this.off( eventName, listener );
                // unset once flag
                delete onceListeners[ listener ];
            }
            // trigger listener
            listener.apply( this, args );
            // get next listener
            i += isOnce ? 0 : 1;
            listener = listeners[i];
        }

        return this;
    };

    return EvEmitter;

}));

;(function( window, factory )  {
    'use strict';

    if( typeof define == 'function' && define.amd ) {
        // AMD
        define( [ 'ev-emitter/ev-emitter' ], function(){
            return factory( window, EvEmitter );
        });
    } else if ( typeof module == 'object' && module.exports ){
        // CommonJS
        module.exports = factory( window, require('ev-emitter' ));
    } else {
        // browser global
        window.scrollWhere = factory( window, window.EvEmitter );
    }

})( window,

    // --------------------------  factory -------------------------- //
    function factory( window, EvEmitter ){

        var $ = window.jQuery;
        var console = window.console;

        // -------------------------- helpers -------------------------- //

        // extend objects
        function extend(  a, b ) {
            for ( var prop in b ){
                a[ prop ] = b[ prop ];
            }
            return a;
        }

        // turn element or nodeList into an array
        function makeArray( obj ) {
            var ary = [];
            if( Array.isArray( obj ) ) {
                /// use object if already an array
                ary = obj;
            } else if ( typeof obj.length == 'number' ){
                // convert nodeList to array
                for ( var i = 0, len = obj.length; i < len; i++){
                    ary.push( obj[i] );
                }
            } else {
                // array of single index
                ary.push( obj );
            }
            return ary;
        }

        function each( obj, callback ) {
            var length, i = 0;

            if ( typeof obj == "array" ) {
                length = obj.length;
                for ( ; i < length; i++ ) {
                    if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
                        break;
                    }
                }
            } else {
                for ( i in obj ) {
                    if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
                        break;
                    }
                }
            }

            return obj;
        }

        // -------------------------- scrollWhere -------------------------- //

        function ScrollWhere( options ) {
            this.options = extend( {}, this._default );

            if( options ){
                var def = extend( {}, this.options )
                setOpt("distance", def  );
                setOpt("delay", def );
                options.distance = def.distance;
                options.delay = def.delay;

                // use elem as selector string
                if ( typeof options.elem == 'string' ) {
                    options.elem = document.querySelector( options.elem );
                }
            }

            // turn distance and delay options into default formation
            function setOpt( prop, def ){

                if( typeof options[ prop ] == "number" ){

                    each( def[ prop ] , function( key, value ){
                        def[ prop ] [ key ] = options[ prop ] ;
                    } )
                } else if ( options[ prop ]  ) {
                    each( def[ prop ] , function( key, value ){
                        var dis = options[ prop ] ;
                        if( dis[key] ){
                            def[ prop ][ key ] = dis[key];
                        } else if( dis["default"] ){
                            def[ prop ][ key ] = dis["default"];
                        }
                    } )
                }
            }

            // coerce ScrollWhere() without new, to be new ScrollWhere()
            if ( !( this instanceof ScrollWhere ) ) {
                return new ScrollWhere( this.options );
            }

            extend( this.options, options );

            this._bindScroll( this.options.elem );
            this._bindHandler();

        }

        ScrollWhere.prototype = Object.create( EvEmitter.prototype );

        ScrollWhere.prototype.options = {};

        ScrollWhere.prototype._default = {
            elem: document.body,
            distance: {
                reachBottom: 10,
                leaveBottom: 10,
                reachTop: 10,
                leaveTop: 10
            },
            delay: {
                reachBottom: 200,
                leaveBottom: 200,
                reachTop: 200,
                leaveTop: 200
            },
            reachBottom: null,
            leaveBottom: null,
            reachTop: null,
            leaverTop: null
        };

        ScrollWhere.prototype.derection = 0;

        ScrollWhere.prototype._bindScroll = function( elem ){
            var preScrollTop = elem.scrollTop,
                isDelayTime = {},
                distance = this.options.distance,
                delay = this.options.delay,
                that = this,
                css = window.getComputedStyle( elem );

            // let handler can't be trigger again during delay time
            isDelayTime = {
                reachBottom: false,
                leaveBottom: false,
                reachTop: false,
                leaveTop: false
            };

            elem.addEventListener( "scroll", function scrollHandler(){
                var sTop = this.scrollTop,
                    sHeight = this.scrollHeight,

                    // height of scroll element include content height and padding height
                    oHeight = Math.round( parseFloat( css.height ) + parseFloat( css.paddingTop ) +
                        parseFloat( css.paddingBottom ) ),
                    toBottom = sHeight - (sTop + oHeight);

                detectScroll( "reachBottom", sHeight - oHeight - distance[ "reachBottom" ] ,1 );
                detectScroll( "leaveBottom", sHeight - oHeight - distance[ "leaveBottom" ] , -1 );
                detectScroll( "reachTop", distance[ "reachTop" ], -1 );
                detectScroll( "leaveTop", distance[ "leaveTop" ], 1 );

                that.derection = sTop - preScrollTop;
                that.scrollTop = sTop;
                that.scrollBottom = toBottom;
                preScrollTop = sTop;

                // detect if element scroll to target position, dis => , sign => set derection,1 down, 0 up
                function detectScroll( handlerName, threshold, direction ){
                    var situation = direction > 0 ? preScrollTop < threshold && sTop >= threshold :
                    preScrollTop > threshold && sTop <= threshold

                    if( !isDelayTime[ handlerName ] && situation){
                        that.emitEvent( handlerName );

                        if( delay[ handlerName ] > 0 ){

                            isDelayTime[ handlerName ] = true;

                            setTimeout(function(){
                                isDelayTime[ handlerName ] = false;
                            }, delay[ handlerName ] )
                        }
                    }
                }
            })

        }

        ScrollWhere.prototype._bindHandler = function(){
            var handlerNames = ["reachBottom", "leaveBottom", "reachTop", "leaveTop"],
                i, len;

            for( i = 0, len = handlerNames.length; i < len; i++ ){
                var handlerName = handlerNames[i],
                    handler = this.options[ handlerName ];

                if( typeof handler == "function" ){
                    this.on( handlerName, this.options[ handlerNames[i] ] )
                }
            }
        }

        return ScrollWhere;
    }
);






