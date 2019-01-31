/**
 * Product Template Script
 * ------------------------------------------------------------------------------
 * A file that contains scripts highly couple code to the Product template.
 *
 * @namespace product
 */

import $ from 'jquery';
import slick from 'slick-carousel';
import Variants from '@shopify/theme-variants';
import {formatMoney} from '@shopify/theme-currency';
import sections from '@shopify/theme-sections';

const selectors = {
  addToCart: '[data-add-to-cart]',
  addToCartText: '[data-add-to-cart-text]',
  comparePrice: '[data-compare-price]',
  comparePriceText: '[data-compare-text]',
  originalSelectorId: '[data-product-select]',
  priceWrapper: '[data-price-wrapper]',
  productImageWrapper: '[data-product-image-wrapper]',
  productFeaturedImage: '[data-product-featured-image]',
  productJson: '[data-product-json]',
  productPrice: '[data-product-price]',
  productThumbs: '[data-product-single-thumbnail]',
  singleOptionSelector: '[data-single-option-selector]',
};

const cssClasses = {
  activeThumbnail: 'active-thumbnail',
  hide: 'hide',
};

/**
 * Product section constructor. Runs on page load as well as Theme Editor
 * `section:load` events.
 * @param {string} container - selector for the section container DOM element
 */

sections.register('product', {
  onLoad() {
    // Stop parsing if we don't have the product json script tag when loading
    // section in the Theme Editor
    if (!$(selectors.productJson, this.$container).html()) {
      return;
    }

    this.productSingleObject = JSON.parse(
      $(selectors.productJson, this.$container).html(),
    );

    const options = {
      $container: this.$container,
      enableHistoryState: this.$container.data('enable-history-state') || false,
      singleOptionSelector: selectors.singleOptionSelector,
      originalSelectorId: selectors.originalSelectorId,
      product: this.productSingleObject,
    };

    this.settings = {};
    this.variants = new Variants(options);
    this.$featuredImage = $(selectors.productFeaturedImage, this.$container);

    this.$container.on(
      `variantChange${this.namespace}`,
      this.updateAddToCartState.bind(this),
    );

    this.$container.on(
      `variantChange${this.namespace}`,
      this.swapIncrementalPayOption.bind(this),
    );

    this.$container.on(
      `variantChange${this.namespace}`,
      this.swapVariantImageGallery.bind(this),
    );

    this.$container.on(
      `variantPriceChange${this.namespace}`,
      this.updateProductPrices.bind(this),
    );

    if (this.$featuredImage.length > 0) {
      this.$container.on(
        `variantImageChange${this.namespace}`,
        this.updateImages.bind(this),
      );
    }
  },

  setActiveThumbnail(imageId) {
    let newImageId = imageId;

    // If "imageId" is not defined in the function parameter, find it by the current product image
    if (typeof newImageId === 'undefined') {
      newImageId = $(
        `${selectors.productImageWrapper}:not('.${cssClasses.hide}')`,
      ).data('image-id');
    }

    const $thumbnail = $(
      `${selectors.productThumbs}[data-thumbnail-id='${newImageId}']`,
    );

    $(selectors.productThumbs)
      .removeClass(cssClasses.activeThumbnail)
      .removeAttr('aria-current');

    $thumbnail.addClass(cssClasses.activeThumbnail);
    $thumbnail.attr('aria-current', true);
  },

  switchImage(imageId) {
    const $newImage = $(
      `${selectors.productImageWrapper}[data-image-id='${imageId}']`,
      this.$container,
    );
    const $otherImages = $(
      `${selectors.productImageWrapper}:not([data-image-id='${imageId}'])`,
      this.$container,
    );
    $newImage.removeClass(cssClasses.hide);
    $otherImages.addClass(cssClasses.hide);
  },

  /**
   * Updates the DOM state of the add to cart button
   *
   * @param {boolean} enabled - Decides whether cart is enabled or disabled
   * @param {string} text - Updates the text notification content of the cart
   */
  updateAddToCartState(evt) {
    const variant = evt.variant;

    if (variant) {
      $(selectors.priceWrapper, this.$container).removeClass(cssClasses.hide);
    } else {
      $(selectors.addToCart, this.$container).prop('disabled', true);
      $(selectors.addToCartText, this.$container).html(
        theme.strings.unavailable,
      );
      $(selectors.priceWrapper, this.$container).addClass(cssClasses.hide);
      return;
    }

    if (variant.available) {
      $(selectors.addToCart, this.$container).prop('disabled', false);
      $(selectors.addToCartText, this.$container).html(theme.strings.addToCart);
    } else {
      $(selectors.addToCart, this.$container).prop('disabled', true);
      $(selectors.addToCartText, this.$container).html(theme.strings.soldOut);
    }
  },

  swapIncrementalPayOption(evt) {
    const variant = evt.variant;
    const $allPaymentOptionButtons = $('.installment-button__option');

    if ($allPaymentOptionButtons.length > 0) {
      $allPaymentOptionButtons.each(function() {
        $(this).removeClass('--selected');
      });

      $(`[data-variant-id="${variant.id}"]`).addClass('--selected');
    }
  },

  swapVariantImageGallery(evt) {
    const productId = $('.product-single__photos').data('product-id');
    const variant = evt.variant;
    swapVariantGalleries(productId, variant);
  },

  updateImages(evt) {
    const variant = evt.variant;
    const imageId = variant.featured_image.id;
    this.switchImage(imageId);
    this.setActiveThumbnail(imageId);
  },

  /**
   * Updates the DOM with specified prices
   *
   * @param {string} productPrice - The current price of the product
   * @param {string} comparePrice - The original price of the product
   */
  updateProductPrices(evt) {
    const variant = evt.variant;
    const $comparePrice = $(selectors.comparePrice, this.$container);
    const $compareEls = $comparePrice.add(
      selectors.comparePriceText,
      this.$container,
    );

    $(selectors.productPrice, this.$container).html(
      formatMoney(variant.price, theme.moneyFormat),
    );

    if (variant.compare_at_price > variant.price) {
      $comparePrice.html(
        formatMoney(variant.compare_at_price, theme.moneyFormat),
      );
      $compareEls.removeClass(cssClasses.hide);
    } else {
      $comparePrice.html('');
      $compareEls.addClass(cssClasses.hide);
    }
  },

  /**
   * Event callback for Theme Editor `section:unload` event
   */
  onUnload() {
    this.$container.off(this.namespace);
  },
});

function swapVariantGalleries(prodId, variant) {
  // Repurposing this function for the new variant image switching.
  swapVariantImages(variant.title);

  // Leaving existing code for BC if its needed - who knows.
  if (window.VIG && window.VIG.switchImages) {
    window.VIG.switchImages(prodId, variant.id, '.product-single__photos');
  }
}

function swapVariantImages(variantId) {
  $(`.photo-main-image[data-variant!='${variantId}']`).removeClass("sdc-active-variant").fadeOut(150, function(){
    var $mainPhotos = $(`.photo-main-image[data-variant='${variantId}']`);
    $mainPhotos.fadeIn(150, function(){
      $mainPhotos.addClass("sdc-active-variant")
      $mainPhotos.find('img.hide').removeClass('hide');
      // Run position update again just in case it was too fast outside
      if ($mainPhotos.hasClass('slick-initialized')){
        $mainPhotos.slick('setPosition');
      }
    });
    if ($mainPhotos.hasClass('slick-initialized')){
      $mainPhotos.slick('slickGoTo', 0, true).slick('setPosition');
    }
  });
  $(`.photo-thumbnails[data-variant!='${variantId}']`).removeClass("sdc-active-variant").fadeOut(150, function(){
    var $thumbPhotos = $(`.photo-thumbnails[data-variant='${variantId}']`);
    $thumbPhotos.fadeIn(150, function(){
      $thumbPhotos.addClass("sdc-active-variant");
      // Run position update again just in case it was too fast outside
      if ($thumbPhotos.hasClass('slick-initialized')){
        $thumbPhotos.slick('setPosition');
      }
    });
    if ($thumbPhotos.hasClass('slick-initialized')){
      $thumbPhotos.slick('slickGoTo', 0, true).slick('setPosition');
    }
  });
}

$(document).ready(() => {
  const $hiddenSelect = $('.hidden-selector select');
  const $variantButtons = $('.product-info-variant-options a');
  const $variantDescriptionSlides = $('.product-info--description-variant-slide');

  $variantButtons.on('click', function(event) {
    event.preventDefault();
    const $this = $(this);
    const variantId = $this.data('value');
    $variantButtons.removeClass('selected');
    $this.addClass('selected');

    swapVariantDescriptions(variantId);
    swapVariantImages(variantId);
    $hiddenSelect.val(variantId);
    $hiddenSelect.change();
  });

  function swapVariantDescriptions(variantId) {
    $variantDescriptionSlides.removeClass('active');
    $(`.product-info--description-variant-slide[data-value=${variantId}]`).addClass('active');
  }



  const productId = $('.product-single__photos').data('product-id');
  const currentVariantId = $('.product-single__photos').data('current-variant-id');
  // GET CURRENT VARIANT OBJ
  // swapVariantGalleries(productId, currentVariantId);


  // swap main image when thumbnails are selected
  const $mainImages = $('.photo-main-image img');
  // console.log($mainImages);
  $('.photo-thumbnails')
    .delegate('.product-single__thumbnail-image', 'click', function() {
      const $this = $(this);
      const selectedThumbnailImageId = $this.data('image-id');
      $mainImages.each(function() {
        const $item = $(this);
        const mainImageId = $item.data('image-id');
        if (selectedThumbnailImageId === mainImageId) {
          $item.removeClass('hide');
        } else {
          $item.addClass('hide');
        }
      });
    });
});


// Slick sldier settings
$(document).ready(() => {
  $('.slickCar').on('init', () => {
    $('.product-info-gallery').addClass('loaded');
  });

  if ($('[data-product-handle="new-gift-of-a-smile"], [data-product-handle="gift-of-a-smile"]').length){
    $('[data-option-name="Delivery Method"]').change(function(evt){
      if ($(this).val() == "Digital"){
        $(".product-info-gallery .photo-thumbnails li:first-child").addClass('hide');
        $(".product-info-gallery .photo-main-image img:first-child").addClass('hide');
      } else {
        $(".product-info-gallery .photo-thumbnails li:first-child").removeClass('hide');
        $(".product-info-gallery .photo-main-image img:first-child").removeClass('hide');
      }
    }).change();
  }

  var slickCarOpts = {
    infinite: true,
    speed: 300,
    cssEase: 'ease-in-out',
    draggable: true,
    waitForAnimate: false,
    fade: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          draggable: true,
          fade: false
        }
      },
      {
        breakpoint: 410,
        settings: {
          infinite: false
        }
      }
    ]
  };
  $(".slickCar").each(function(index, elem){
    var thisOpts = {
      asNavFor: $(elem).attr('data-target-thumbs')
    };
    $.extend(thisOpts, slickCarOpts);
    $(elem).slick(thisOpts);
  });

  // number of images is calculated
  // in the product template
  var slickThumbOpts = {
    focusOnSelect: true,
    draggable: true,
    slidesToShow: window.numberOfImages < 5 ? window.numberOfImages : (window.numberOfImages <= 8 ? window.numberOfImages : 8 ),
    slidesToScroll: 1,
    centerMode: false
  };
  $(".slickThumb").each(function(index, elem){
    var thisOpts = {
      asNavFor: $(elem).attr('data-target-car')
    };
    $.extend(thisOpts, slickThumbOpts);
    $(elem).slick(thisOpts);
  });

  // Thumbnail image hover
  $(".product-single__thumbnail-image").on('mouseover', function(evt){
    var $this = $(evt.target);
    var $slickSlide = $this.closest('.slick-slide')
    if ($slickSlide.length){
      var slideIndex = $slickSlide.attr('data-slick-index');
      $($slickSlide.closest('.slick-slider').attr("data-target-car")).slick('slickGoTo', slideIndex);
    } else {
      var activeClass = 'sdc-active-variant';
      var $mainImg = $(`${selectors.productImageWrapper}[data-image-id='${$this.attr('data-image-id')}']`);
      $(`${selectors.productImageWrapper}:not('.${cssClasses.hide}')`).addClass(cssClasses.hide);
      $mainImg.removeClass(cssClasses.hide);
    }
  });
});
