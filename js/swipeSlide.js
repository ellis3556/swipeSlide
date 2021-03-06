/**
 * swipeSlide
 * http://ons.me/500.html
 * 西门
 * 3.0(150227)
 */
;(function(win,$){
    'use strict';
    
    // 判断IE
    var browser = {
        ie10 : win.navigator.msPointerEnabled,
        ie11 : win.navigator.pointerEnabled
    };
    // 触摸事件
    var events = ['touchstart','touchmove','touchend'];
    // 检测
    var support = {
        // 触摸
        touch : (win.Modernizr && Modernizr.touch === true) || (function () {
            return !!(('ontouchstart' in win) || win.DocumentTouch && document instanceof DocumentTouch);
        })()
    };

    // 判断浏览器
    if (browser.ie10) events = ['MSPointerDown', 'MSPointerMove', 'MSPointerUp'];
    if (browser.ie11) events = ['pointerdown', 'pointermove', 'pointerup'];

    // 触摸赋值
    var touchEvents = {
        touchStart : events[0],
        touchMove : events[1],
        touchEnd : events[2]
    };

    // 绑定swipeSlide
    $.fn.swipeSlide = function(options){
        new sS(this, options);
    };
    var sS = function(element, options){
        var me = this;
        me.$el = $(element);
        me._index = 0;
        me._distance = 50;
        me.allowSlideClick = true;
        me.init(options);
    };

    // 初始化
    sS.prototype.init = function(options){
        var me = this;
        me.opts = $.extend({}, {
            ul : me.$el.children('ul'),              // 父dom
            li : me.$el.children().children('li'),   // 子dom
            continuousScroll : false,               // 连续滚动
            autoSwipe : true,                       // 自动切换
            speed : 4000,                           // 切换速度
            axisX : true,                           // X轴
            transitionType : 'ease',                // 过渡类型
            lazyLoad : false,                       // 懒加载
            callback : function(){}               // 回调方法
        }, options);
        // 轮播数量
        me._liLength = me.opts.li.length;

        // 如果轮播小于等于1个，跳出
        if(me._liLength <= 1) return false;

        // 懒加载图片
        if(me.opts.lazyLoad){
            fnLazyLoad(me, '0');
            fnLazyLoad(me, '1');
            // 加载最后一屏，为了连续滚动复制dom
            if(me.opts.continuousScroll) fnLazyLoad(me, me._liLength-1);
        }

        // 连续滚动，复制dom
        if(me.opts.continuousScroll) me.opts.ul.prepend(me.opts.li.last().clone()).append(me.opts.li.first().clone());

        // 轮播的宽度
        fnGetSlideDistance();

        if(browser.ie10 || browser.ie11){
            // IE触控
            var action = '';
            if(me.opts.axisX){
                action = 'pan-y';
            }else{
                action = 'none';
            }
            me.$el.css({'-ms-touch-action':action,'touch-action':action});

            // 解决IE滑动触发click
            me.$el.on('click',function(){
                return me.allowSlideClick;
            });
        }

        // 调用轮播
        me.fnAutoSlide();

        // 回调
        me.opts.callback(me._index);

        // 绑定触摸
        me.$el.on(touchEvents.touchStart,function(e){
            fnTouches(e);
            fnTouchstart(e, me);
        });
        me.$el.on(touchEvents.touchMove,function(e){
            fnTouches(e);
            fnTouchmove(e, me);
        });
        me.$el.on(touchEvents.touchEnd,function(){
            fnTouchend(me);
        });

        // 横竖屏、窗口调整
        $(win).on('onorientationchange' in win ? 'orientationchange' : 'resize',function(){
            clearTimeout(me.timer);
            me.timer = setTimeout(fnGetSlideDistance,150);
        });
        
        // 获取轮播宽度
        function fnGetSlideDistance(){
            var $li = me.opts.ul.children();
            me._slideDistance = me.opts.axisX ? me.opts.li.width() : me.opts.li.height();
            // 定位
            fnTransition(me, me.opts.ul, 0);
            fnTranslate(me, me.opts.ul, -me._slideDistance*me._index);
            fnTransition(me, $li, 0);
            var num = me.opts.continuousScroll ? -1 : 0;
            $li.each(function(i){
                fnTranslate(me, $(this), me._slideDistance*(i+num));
            });
        }
    };

    // css过渡
    function fnTransition(me, dom, num){
        dom.css({
            '-webkit-transition':'all '+num+'s '+me.opts.transitionType,
            'transition':'all '+num+'s '+me.opts.transitionType
        });
    }

    // css位移
    function fnTranslate(me, dom, distance){
        var result = me.opts.axisX ? distance+'px,0,0' : '0,'+distance+'px,0';
        dom.css({
            '-webkit-transform':'translate3d('+result+')',
            'transform':'translate3d('+result+')'
        });
    }

    // 懒加载图片
    function fnLazyLoad(me, index){
        var $li = me.opts.ul.children();
        var $thisImg = $li.eq(index).find('[data-src]');
        if($thisImg){
            if($thisImg.is('img')){
                $thisImg.attr('src',$thisImg.data('src'));
                $thisImg.removeAttr('data-src');
            }else{
                $thisImg.css({'background-image':'url('+$thisImg.data('src')+')'});
                $thisImg.removeAttr('data-src');
            }
        }
    }

    // touches
    function fnTouches(e){
        if(support.touch && !e.touches){
            e.touches = e.originalEvent.touches;
        }
    }

    // touchstart
    function fnTouchstart(e, me){
        // 按下时的坐标
        me._startX = support.touch ? e.touches[0].pageX : (e.pageX || e.clientX);
        me._startY = support.touch ? e.touches[0].pageY : (e.pageY || e.clientY);
    }

    // touchmove
    function fnTouchmove(e, me){
        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;
        // 如果自动切换，move的时候清除autoSlide自动轮播方法
        if(me.opts.autoSwipe) clearInterval(me.autoSlide);
        me.allowSlideClick = false;
        // 触摸时的坐标
        me._curX = support.touch ? e.touches[0].pageX : (e.pageX || e.clientX);
        me._curY = support.touch ? e.touches[0].pageY : (e.pageY || e.clientY);
        // 触摸时的距离
        me._moveX = me._moveX_ie = me._curX - me._startX;
        me._moveY = me._moveY_ie = me._curY - me._startY;

        // 触摸时跟手
        fnTransition(me, me.opts.ul, 0);
        // 距离
        me._moveDistance = me._moveDistanceIE = me.opts.axisX ? me._moveX : me._moveY;
        if(!me.opts.continuousScroll){
            // 如果是第一屏，并且往下滚动，就不让滚动 || 如果是最后一屏，并且往上滚动，就不让滚动
            if(me._index == 0 && me._moveDistance > 0 || (me._index + 1) >= me._liLength && me._moveDistance < 0){
                me._moveDistance = 0;
            }
        }
        // 触摸时跟手滚动
        fnTranslate(me, me.opts.ul, -(me._slideDistance * me._index - me._moveDistance));
    }

    // touchend
    function fnTouchend(me){
        if(browser.ie10 || browser.ie11){
            // 解决IE滑动触发click
            if(Math.abs(me._moveDistanceIE) < 5){
                me.allowSlideClick = true;
            }
            setTimeout(function(){
                me.allowSlideClick = true;
            },100);
        }

        // 距离小
        if(Math.abs(me._moveDistance) <= me._distance){
            fnSlide(me, '', '.3');
        // 距离大
        }else{
            // 手指触摸上一屏滚动
            if(me._moveDistance > me._distance){
                fnSlide(me, 'prev', '.3');
            // 手指触摸下一屏滚动
            }else{
                fnSlide(me, 'next', '.3');
            }
        }
        me.fnAutoSlide();
        me._moveDistance = me._moveDistanceIE = 0;
    }

    // 自动轮播
    sS.prototype.fnAutoSlide = function(){
        var me = this;
        if(me.opts.autoSwipe){
            me.autoSlide = setInterval(function(){
                fnSlide(me, 'next', '.3');
            },me.opts.speed);
        }
    };

    // 轮播方法
    function fnSlide(me, direction, num){
        // 判断方向
        if(direction == 'next'){
            me._index++;
            if(me.opts.lazyLoad){
                // 因为连续滚动，复制dom，所以要多加1
                if(me.opts.continuousScroll){
                    fnLazyLoad(me, me._index+2);
                }else{
                    fnLazyLoad(me, me._index+1);
                }
            }
        }else if(direction == 'prev'){
            me._index--;
            // 往上滚动比较特殊，只有连续滚动&&懒加载时才有
            if(me.opts.lazyLoad && me.opts.continuousScroll){
                if(me._index < 0){
                    fnLazyLoad(me, me._liLength-1);
                }else{
                    fnLazyLoad(me, me._index);
                }
            }
        }
        // 如果是连续滚动
        if(me.opts.continuousScroll){
            if(me._index >= me._liLength){
                fnScroll(me, num);
                me._index = 0;
                setTimeout(function(){
                    fnScroll(me, 0);
                },300);
            }else if(me._index < 0){
                fnScroll(me, num);
                me._index = me._liLength-1;
                setTimeout(function(){
                    fnScroll(me, 0);
                },300);
            }else{
                fnScroll(me, num);
            }
        }else{
            if(me._index >= me._liLength){
                me._index = 0;
            }else if(me._index < 0){
                me._index = me._liLength-1;
            }
            fnScroll(me, num);
        }
        me.opts.callback(me._index);
    }

    // 轮播动作
    function fnScroll(me, num){
        fnTransition(me, me.opts.ul, num);
        fnTranslate(me, me.opts.ul, -me._index*me._slideDistance);
    }

})(window, window.Zepto || window.jQuery);