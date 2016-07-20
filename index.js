/*
    Segment Control
    Author: 赞郁 | zanyu.yx@alipay.com
*/
;(function() {

    (function() {
        var lastTime = 0;
        var vendors = ['webkit', 'moz'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || // method name has changed in Webkit
                window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
                var id = window.setTimeout(function() {
                    callback(currTime + timeToCall);
                }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
        }
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
        }
    }());


    function SegmentControl(options) {

        var defaultOptions = {
            element: document.body || document.getElementsByTagName('body')[0],
            speed: 6,
            list: [],
            initedCallback: function() {},
            beforeCallback: function() {},
            afterCallback: function() {}
        };

        var options = this.options = arguments.callee.extend(defaultOptions, options);

        this.init(options.list);

    }

    SegmentControl.prototype = {
        init: function(_list) {
            var that = this;
            var root = this.root = this.options.element;
            var template = [
                '<div class="segment-control-mod">',
                '<div class="segment-control-box">',
                '<div class="segment-control-in">',
                '<ul class="segment-control-ul"></ul>',
                '<div class="segment-control-cursor"></div>',
                '</div>',
                '</div>',
                '</div>'
            ];
            root.innerHTML = template.join('');

            var box = this.box = root.getElementsByClassName('segment-control-box')[0];

            var inner = this.inner = root.getElementsByClassName('segment-control-in')[0];

            var cursor = this.cursor = root.getElementsByClassName('segment-control-cursor')[0];

            var ul = this.ul = root.getElementsByClassName('segment-control-ul')[0];

            (function() {
                var lisArray = [];
                var i = 0;
                var l = _list.length;
                for (i = 0; i < l; i++) {
                    var li = '<li data-index="' + i + '">' + _list[i] + '</li>';
                    lisArray.push(li);
                }
                ul.innerHTML = lisArray.join('');
            })();

            var list = this.list = inner.getElementsByTagName('li');

            var boxWidth = this.boxWidth = box.offsetWidth; //Container Width

            var innerWidth = this.innerWidth = inner.offsetWidth; //need Scroll Width

            var timer = this.timer = null;

            this.bindEvent();
        },
        tabTo: function(index, beforeCallback, afterCallback) {

            var that = this;
            var box = this.box;
            var list = this.list;
            var i = 0;
            var l = list.length;

            for (i = 0; i < l; i++) {
                list[i].classList.remove('active');
                this.list[index].classList.add('active');
            }

            this.index = index;
            var li = this.current = list[index];

            var boxWidth = this.boxWidth;
            var innerWidth = this.innerWidth;
            var activeOffsetWidth = li.offsetWidth;
            var activeOffsetLeft = li.offsetLeft;

            var needScrollLeft = activeOffsetLeft - parseInt((boxWidth - activeOffsetWidth) / 2);

            if (needScrollLeft < 0) {
                needScrollLeft = 0;
            }
            if (needScrollLeft > (innerWidth - boxWidth)) {
                needScrollLeft = innerWidth - boxWidth;
            }

            beforeCallback && beforeCallback(that);

            //scrollTabMod.scrollLeft = needScrollLeft;

            this.scrollTo(needScrollLeft, afterCallback);

            setTimeout(function() {
                that.animateCursor();
            }, 0);
        },
        scrollTo: function(targetLeft, callback) {
            //requestAnimationFrame Flash bug fixed by css selecter;

            var that = this;
            var box = that.box;

            cancelAnimationFrame(this.timer);

            this.timer = requestAnimationFrame(doScroll);

            function doScroll() {

                var safeSpace = 2;

                if (Math.abs(box.scrollLeft - targetLeft) > safeSpace) {
                    var speed = (targetLeft - box.scrollLeft) / (that.options.speed);
                    if (speed > 0) {
                        speed = Math.ceil(speed);
                    } else {
                        speed = Math.floor(speed);
                    }
                    box.scrollLeft = box.scrollLeft + speed;
                    requestAnimationFrame(doScroll);
                } else {
                    //console.log('clear');
                    box.scrollLeft = targetLeft;
                    cancelAnimationFrame(this.timer);
                    callback && callback(that);
                }
            }


            /*
            //TODO
            var that = this;
            cancelAnimationFrame(this.timer);

            var targetLeft = scrollLeft;

            this.timer = setInterval(function() {

                var currentLeft = dom.scrollLeft;

                var speed = (targetLeft - currentLeft) / 6;

                if (speed > 0) {
                    speed = Math.ceil(speed);
                } else {
                    speed = Math.floor(speed);
                }

                //if (currentLeft == targetLeft);

                if (Math.abs(currentLeft - targetLeft) < 2) {
                    dom.scrollLeft = targetLeft;
                    callback && callback({
                        scrollLeft: scrollLeft
                    });
                    clearInterval(that.timer);
                } else {
                    dom.scrollLeft = currentLeft + speed;
                }

            }, 20);
            */
        },
        bindEvent: function() {
            var box = this.box;
            var list = this.list;
            var boxWidth = this.boxWidth;
            var that = this;

            //var eventName = ("ontouchstart" in document)?'touchstart':'mousedown';

            var touchPoint = 0;

            box.addEventListener('touchstart', function(eventObject) {
                touchPoint = eventObject.changedTouches[0].clientX;
            });

            box.addEventListener('touchend', function(eventObject) {

                if (eventObject.target.tagName === 'LI') {

                    //detect touch point move
                    if (Math.abs(eventObject.changedTouches[0].clientX - touchPoint) > 5) {
                        return;
                    }

                    var li = eventObject.target;
                    if (li.classList.contains('active')) {
                        eventObject.stopPropagation();
                        eventObject.preventDefault();
                        return false;
                    }

                    var index = that.index = that.getIndex(li);
                    that.current = li;

                    var beforeCallback = that.options.beforeCallback;
                    var afterCallback = that.options.afterCallback;

                    that.tabTo(index, beforeCallback, afterCallback);
                }
            });

            box.addEventListener('scroll', function() {
                cancelAnimationFrame(that.timer);
            });

            this.options.initedCallback && this.options.initedCallback(that);
        },
        animateCursor: function() {
            var li = this.current;
            var activeOffsetWidth = li.offsetWidth;
            var activeOffsetLeft = li.offsetLeft;
            this.cursor.style.left = activeOffsetLeft + 'px';
            this.cursor.style.width = activeOffsetWidth + 'px';
        },
        getIndex: function(li) {
            var list = this.list;
            var index = -1;
            var i = 0;
            var l = list.length;
            for (i = 0; i < l; i++) {
                if (list[i] === li) {
                    index = i;
                }
            }
            return index;
        }
    }
    SegmentControl.extend = function(defaultOptions, options) {
        for (var key in options) {
            if (options[key]) {
                defaultOptions[key] = options[key];
            }
        }
        return defaultOptions;
    }

    //Support AMD && CMD
    if (typeof module !== 'undefined' && typeof exports === 'object' && define.cmd) {
        module.exports = SegmentControl;
    } else if (typeof define === 'function' && define.amd) {
        define(function() {
            return SegmentControl; });
    } else {
        this.SegmentControl = SegmentControl;
    }
}).call(function() {
    return this || (typeof window !== 'undefined' ? window : global);

});
