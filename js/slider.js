(function(win, doc, $) {
  function CusScrollBar(options) {
    this._init(options);
  }
  $.extend(CusScrollBar.prototype, {
    _init: function(options) {
      // console.log(this);
      var self = this;
      // console.log(self);
      self.options = {
        scrollDir: 'y', // 滚动的方向
        contSelector: '', // 滚动内容区选择器
        barSelector: '', // 滚动条选择器
        sliderSelector: '', // 滚动滑块儿选择器
        tabItemSelector: '.tab-item', // 标签选择器
        tabActiveItem: '.tab-active', // 选中标签类名
        anchorSelector: '.anchor', //锚点选择器
        wheelStep: 10, // 鼠标滚动步长
        correctSelector: '.correct-bot', // 矫正元素
        articleSelector: '.scroll-ol' //文章选择器
      };
      $.extend(true, self.options, options || {});
      self._initDomEvent();
      // console.log(self.options.contSelector);
      return self;
    },
    /**
     * 初始化DOM引用
     * @method _initDomEvent
     * @return {CusScrollBar}
     */
    _initDomEvent: function() {
      var opts = this.options;
      // 滚动内容区对象，必须填
      this.$cont = $(opts.contSelector);
      // 滚动条滑块对象，必须填
      this.$slider = $(opts.sliderSelector);
      // 滚动条对象
      this.$bar = opts.barSelector
        ? $(opts.barSelector)
        : self.$slider.parent();
      // 锚点项
      this.$anchor = $(opts.anchorSelector);
      // 获取文档对象
      this.$doc = $(doc);
      // 标签项
      this.$tabItem = $(opts.tabItemSelector);
      // 正文
      this.$article = $(opts.articleSelector);
      // 矫正元素对象
      this.$correct = $(opts.correctSelector);
      this._initSliderDragEvent()
        ._initTabEvent()
        ._initArticleHeight()
        ._bindContScroll()
        ._bindMousewheel();
    },
    /**
     * 初始化文档高度
     */
    _initArticleHeight: function() {
      var self = this,
        lastArticle = self.$article.last();
      var lastArticleHeight = lastArticle.height(),
        contHeight = self.$cont.height();
      if (lastArticleHeight < contHeight) {
        self.$correct[0].style.height =
          contHeight - lastArticleHeight - self.$anchor.outerHeight() + 'px';
      }
      return self;
    },
    /**
     * 初始化滑块拖动功能
     * @return {[Object]} [this]
     */
    _initSliderDragEvent: function() {
      var slider = this.$slider,
        sliderEl = slider[0],
        self = this;
      if (sliderEl) {
        var doc = this.$doc,
          dragStartPagePosition,
          dragStartScrollPosition,
          dragContBarRate;

        function mousemoveHandler(e) {
          e.preventDefault();
          console.log('mousemove');
          if (dragStartPagePosition == null) return;
          self.scrollTo(
            dragStartScrollPosition +
              (e.pageY - dragStartPagePosition) * dragContBarRate
          );
        }
        slider.on('mousedown', function(e) {
          e.preventDefault();
          console.log('mousedown');
          dragStartPagePosition = e.pageY;
          // console.log(self.$cont)
          dragStartScrollPosition = self.$cont[0].scrollTop;
          dragContBarRate =
            self.getMaxScrollPosition() / self.getMaxSliderPosition();
          doc
            .on('mousemove.scroll', mousemoveHandler)
            .on('mouseup.scroll', function(e) {
              console.log('mouseup');
              doc.off('.scroll');
            });
        });
      }
      return self;
    },
    /*
    * 初始化标签切换功能
    */
    _initTabEvent: function() {
      var self = this;
      // console.log(self)
      self.$tabItem.on('click', function(e) {
        e.preventDefault();
        var index = $(this).index();
        self.changeTabSelect(index);
        // 已经滚出可视区的内容高度
        // + 指定锚点与内容容器的距离
        self.scrollTo(self.$cont[0].scrollTop + self.getAnchorPosition(index));
      });
      return self;
    },
    // 切换标签的选中
    changeTabSelect: function(index) {
      var self = this,
        active = self.options.tabActiveClass;
      return self.$tabItem
        .eq(index)
        .addClass('tab-active')
        .siblings()
        .removeClass('tab-active');
    },
    // 监听鼠标滚轮事件
    _bindMousewheel: function() {
      var self = this;
      self.$cont.on('mousewheel DOMMouseScroll', function(e) {
        e.preventDefault();
        var oEv = e.originalEvent,
          wheelRange = oEv.wheelDelta
            ? -oEv.wheelDelta / 120
            : (oEv.detail || 0) / 3;
        self.scrollTo(
          self.$cont[0].scrollTop + wheelRange * self.options.wheelStep
        );
      });
      return self;
    },
    // 监听内容的滚动，同步滑块的位置
    _bindContScroll: function() {
      var self = this;
      self.$cont.on('scroll', function() {
        var sliderEl = self.$slider && self.$slider[0];
        if (sliderEl) {
          sliderEl.style.top = self.getSliderPosition() + 'px';
        }
      });
      return self;
    },
    // 获取指定锚点到上边界的像素数
    getAnchorPosition: function(index) {
      return this.$anchor.eq(index).position().top;
    },
    // 获取每个锚点位置信息的数组
    getAllAnchorPosition: function() {
      var self = this,
        allPositionArr = [];
      for (var i = 0; i < self.$anchor.length; i++) {
        allPositionArr.push(
          self.$cont[0].scrollTop + self.getAnchorPosition(i)
        );
      }
      return allPositionArr;
    },
    // 计算滑块儿的当前位置
    getSliderPosition: function() {
      var self = this,
        maxSliderPosition = self.getMaxSliderPosition();
      // console.log(maxSliderPosition);
      return Math.min(
        maxSliderPosition,
        maxSliderPosition *
          self.$cont[0].scrollTop /
          self.getMaxScrollPosition()
      );
    },
    // 内容可滚动的高度
    getMaxScrollPosition: function() {
      var self = this;
      return (
        Math.max(self.$cont.height(), self.$cont[0].scrollHeight) -
        self.$cont.height()
      );
    },
    // 滑动可移动的距离
    getMaxSliderPosition: function() {
      var self = this;
      return self.$bar.height() - self.$slider.height();
    },
    scrollTo: function(positionVal) {
      var self = this;
      var posArr = self.getAllAnchorPosition();
      // 滚动条的位置与tab标签的对应
      function getIndex(positionVal) {
        for (var i = posArr.length - 1; i >= 0; i--) {
          if (positionVal >= posArr[i]) {
            return i;
          } else {
            continue;
          }
        }
      }
      // 锚点数与标签数相同
      if (posArr.length == self.$tabItem.length) {
        self.changeTabSelect(getIndex(positionVal));
      }
      self.$cont.scrollTop(positionVal);
    }
  });
  // CusScrollBar.prototype._init = function () {
  //   console.log("test");
  // }
  win.CusScrollBar = CusScrollBar;
})(window, document, jQuery);