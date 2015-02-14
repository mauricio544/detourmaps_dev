/**
 * Created by mauricio on 18/03/14.
 */
/*var catctr = angular.module('category.', []);
catctr.controller('categoryController', function($scope, $http){
    $http.get('/communities/categories').success(function(data){
        $scope.categories = data;
    });
    $scope.orderProp = 'name';
});*/

var myApp = angular.module('catApp', []);

myApp.controller('bizCtrl', ['$scope', '$http', 'businessScope', function ($scope, $http, businessScope) {
    var options = {
            zoom : 14,
            mapTypeId : 'Styled',
            disableDefaultUI: true,
            mapTypeControlOptions : {
                mapTypeIds : [ 'Styled' ]
            }
        };
    
    var styles = [{
        stylers : [ {
            hue : "#cccccc"
        }, {
            saturation : -100
        }]
    }, {
        featureType : "road",
        elementType : "geometry",
        stylers : [ {
            lightness : 100
        }, {
            visibility : "simplified"
        }]
    }, {
        featureType : "road",
        elementType : "labels",
        stylers : [ {
            visibility : "on"
        }]
    }, {
        featureType: "poi",
        stylers: [ {
            visibility: "off"
        }]
    }];
    $scope.map; // map instance
    $scope.newMarker = null;
    $scope.markers = []; // array de marcadores
    $scope.props = []; // array de diccionarios con información para marcadores
    var infobox = new InfoBox({
        disableAutoPan: false,
        maxWidth: 202,
        pixelOffset: new google.maps.Size(-101, -285),
        zIndex: null,
        boxStyle: {
            background: "url('/static/images/infobox-bg.png') no-repeat",
            opacity: 1,
            width: "202px",
            height: "245px"
        },
        closeBoxMargin: "28px 26px 0px 0px",
        closeBoxURL: "",
        infoBoxClearance: new google.maps.Size(1, 1),
        pane: "floatPane",
        enableEventPropagation: false
    });
    var windowHeight;
    var windowWidth;
    var contentHeight;
    var contentWidth;
    var isDevice = true;
    $scope.selectedCommunity = [];
    $scope.currentPage = 0;
    $scope.pageSize = 6;
    $scope.query = {}
    $scope.queryBy = '$'
    $scope.text = "";
    $scope.getcat = 0;
    $scope.visits = false;
    $scope.refer = false;
    $scope.buys = false;
    $scope.off = false; 
    $scope.business
    $scope.addMarkers;
    $scope.placeholder_nosearch = "Loading Businesses, please wait ...";
    
    // Eliminar los marcadores del mapa y limpiar array de marcadores
    $scope.deleteMarkers = function(map){
        for (var i = 0; i < $scope.markers.length; i++) {
            $scope.markers[i].setMap(map);
        }
        $scope.markers = [];
    }
    
    // Añadir marcadores al mapa
    $scope.addMarkers = function(props, map) {
        $.each(props, function(i,prop) {
            var latlng = new google.maps.LatLng(prop.position.lat,prop.position.lng);
            var marker = new google.maps.Marker({
                position: latlng,
                map: map,
                icon: new google.maps.MarkerImage( 
                    prop.markerIcon,
                    null,
                    null,
                    null,
                    new google.maps.Size(36, 36)
                ),
                draggable: false,
                animation: google.maps.Animation.DROP,
            });
            var infoboxContent = '<div class="infoW">' +
                                    '<div class="propImg">' +
                                        '<img src="' + prop.image + '">' +
                                        '<div class="propBg">' +
                                            '<div class="propPrice">' + prop.price + '</div>' +
                                            '<div class="propType">' + prop.type + '</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="paWrapper">' +
                                        '<div class="propTitle">' + prop.title + '</div>' +
                                        '<div class="propAddress">' + prop.address + '</div>' +
                                    '</div>' +
                                    '<div class="propRating">' +
                                        '<span class="fa fa-star"></span>' +
                                        '<span class="fa fa-star"></span>' +
                                        '<span class="fa fa-star"></span>' +
                                        '<span class="fa fa-star"></span>' +
                                        '<span class="fa fa-star-o"></span>' +
                                    '</div>' +
                                    '<ul class="propFeat">' +
                                        '<li><span class="fa fa-moon-o"></span> ' + prop.bedrooms + '</li>' +
                                        '<li><span class="icon-drop"></span> ' + prop.bathrooms + '</li>' +
                                        '<li><span class="icon-frame"></span> ' + prop.area + '</li>' +
                                    '</ul>' +
                                    '<div class="clearfix"></div>' +
                                    '<div class="infoButtons">' +
                                        '<a class="btn btn-sm btn-round btn-gray btn-o closeInfo">Close</a>' +
                                        '<a href="single.html" class="btn btn-sm btn-round btn-green viewInfo">View</a>' +
                                    '</div>' +
                                 '</div>';

            google.maps.event.addListener(marker, 'click', (function(marker, i) {
                return function() {
                    infobox.setContent(infoboxContent);
                    infobox.open(map, marker);
                }
            })(marker, i));

            $(document).on('click', '.closeInfo', function() {
                infobox.open(null,null);
            });

            $scope.markers.push(marker);
        });
    };
    // Llenar el mapa con la totalidad de los negocios 
    $scope.getItems = function(){
        businessScope.getAllItems().then(function(data){
            $scope.business = data.businesses;
            $scope.communities = data.communities;
            $scope.categories = data.categories;
            $scope.businesstmp = data.businesses;
            $scope.bizrandom = data.business
            $scope.placeholder_nosearch = "Search for pizza, hair salons, mexican food ...";            
    
            angular.forEach($scope.businesstmp, function(bizmarker){
                var marker_icon;
                if (bizmarker.category === "Lodging and Travel"){
                    marker_icon = "/static/images/Auto_location-01.png";
                }else if(bizmarker.category === "Health and Medical"){
                    marker_icon = "/static/images/Health_location-01.png";
                }else if(bizmarker.category === "Beauty and Spas"){
                    marker_icon = "/static/images/Beauty_location-01.png";
                }else if(bizmarker.category === "Restaurants"){
                    marker_icon = "/static/images/Food_location-01.png";
                }else{
                    marker_icon = "/static/images/Services_location-01.png";
                }
                var geo = bizmarker.geo || undefined;
                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                var dict_marker = {
                    title : bizmarker.name,
                    image : '/media/' + bizmarker.image,
                    type : bizmarker.category,
                    price : '$1,550,000',
                    address : bizmarker.address,
                    bedrooms : '3',
                    bathrooms : '2',
                    area : '3430 Sq Ft',
                    position : {
                        lat : parseFloat(r[1]),
                        lng : parseFloat(r[0])
                    },
                    markerIcon : marker_icon
                };
                $scope.props.push(dict_marker);
            });                           
                        
            
            // calculations for elements that changes size on window resize
            var windowResizeHandler = function() {
                windowHeight = window.innerHeight;
                windowWidth = $(window).width();
                contentHeight = windowHeight - $('#header').height();
                contentWidth = $('#content').width();

                $('#leftSide').height(contentHeight);
                $('.closeLeftSide').height(contentHeight);
                $('#wrapper').height(contentHeight);
                $('#mapView').height(contentHeight);
                $('#content').height(contentHeight);
                setTimeout(function() {
                    $('.commentsFormWrapper').width(contentWidth);
                }, 300);

                if ($scope.map) {
                    google.maps.event.trigger($scope.map, 'resize');
                }

                // Add custom scrollbar for left side navigation
                if(windowWidth > 767) {
                    $('.bigNav').slimScroll({
                        height : contentHeight - $('.leftUserWraper').height()
                    });
                } else {
                    $('.bigNav').slimScroll({
                        height : contentHeight
                    });
                }
                if($('.bigNav').parent('.slimScrollDiv').size() > 0) {
                    $('.bigNav').parent().replaceWith($('.bigNav'));
                    if(windowWidth > 767) {
                        $('.bigNav').slimScroll({
                            height : contentHeight - $('.leftUserWraper').height()
                        });
                    } else {
                        $('.bigNav').slimScroll({
                            height : contentHeight
                        });
                    }
                }

                // reposition of prices and area reange sliders tooltip
                var priceSliderRangeLeft = parseInt($('.priceSlider .ui-slider-range').css('left'));
                var priceSliderRangeWidth = $('.priceSlider .ui-slider-range').width();
                var priceSliderLeft = priceSliderRangeLeft + ( priceSliderRangeWidth / 2 ) - ( $('.priceSlider .sliderTooltip').width() / 2     );
                $('.priceSlider .sliderTooltip').css('left', priceSliderLeft);

                var areaSliderRangeLeft = parseInt($('.areaSlider .ui-slider-range').css('left'));
                var areaSliderRangeWidth = $('.areaSlider .ui-slider-range').width();
                var areaSliderLeft = areaSliderRangeLeft + ( areaSliderRangeWidth / 2 ) - ( $('.areaSlider .sliderTooltip').width() / 2 );
                $('.areaSlider .sliderTooltip').css('left', areaSliderLeft);
            }

            var repositionTooltip = function( e, ui ){
                var div = $(ui.handle).data("bs.tooltip").$tip[0];
                var pos = $.extend({}, $(ui.handle).offset(), { 
                                width: $(ui.handle).get(0).offsetWidth,
                                height: $(ui.handle).get(0).offsetHeight
                            });
                var actualWidth = div.offsetWidth;

                var tp = {left: pos.left + pos.width / 2 - actualWidth / 2}
                $(div).offset(tp);

                $(div).find(".tooltip-inner").text( ui.value );
            }

            windowResizeHandler();

            $(window).resize(function() {
                windowResizeHandler();
            });

            setTimeout(function() {
                $('body').removeClass('notransition');

                $scope.map = new google.maps.Map(document.getElementById('mapView'), options);
                var styledMapType = new google.maps.StyledMapType(styles, {
                    name : 'Styled'
                });

                $scope.map.mapTypes.set('Styled', styledMapType);
                $scope.map.setCenter(new google.maps.LatLng(40.6984237,-73.9890044));
                $scope.map.setZoom(14);

                if ($('#address').length > 0) {
                    $scope.newMarker = new google.maps.Marker({
                        position: new google.maps.LatLng(40.6984237,-73.9890044),
                        map: $scope.map,
                        icon: new google.maps.MarkerImage( 
                            'images/marker-new.png',
                            null,
                            null,
                            // new google.maps.Point(0,0),
                            null,
                            new google.maps.Size(36, 36)
                        ),
                        draggable: true,
                        animation: google.maps.Animation.DROP,
                    });

                    google.maps.event.addListener(newMarker, "mouseup", function(event) {
                        var latitude = this.position.lat();
                        var longitude = this.position.lng();
                        $('#latitude').text(this.position.lat());
                        $('#longitude').text(this.position.lng());
                    });
                }

                $scope.addMarkers($scope.props, $scope.map);
                var limits = new google.maps.LatLngBounds();
                $.each($scope.markers, function (index, marker){
                    limits.extend(marker.position);
                });
                $scope.map.fitBounds(limits);
            }, 300);

            if(!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch)) {
                $('body').addClass('no-touch');
                isDevice = false;
            }

            // Header search icon transition
            $('.search input').focus(function() {
                $('.searchIcon').addClass('active');
            });
            $('.search input').blur(function() {
                $('.searchIcon').removeClass('active');
            });

            // Notifications list items pulsate animation
            $('.notifyList a').hover(
                function() {
                    $(this).children('.pulse').addClass('pulsate');
                },
                function() {
                    $(this).children('.pulse').removeClass('pulsate');
                }
            );

            // Exapnd left side navigation
            var navExpanded = false;
            $('.navHandler, .closeLeftSide').click(function() {
                if(!navExpanded) {
                    $('.logo').addClass('expanded');
                    $('#leftSide').addClass('expanded');
                    if(windowWidth < 768) {
                        $('.closeLeftSide').show();
                    }
                    $('.hasSub').addClass('hasSubActive');
                    $('.leftNav').addClass('bigNav');
                    if(windowWidth > 767) {
                        $('.full').addClass('m-full');
                    }
                    windowResizeHandler();
                    navExpanded = true;
                } else {
                    $('.logo').removeClass('expanded');
                    $('#leftSide').removeClass('expanded');
                    $('.closeLeftSide').hide();
                    $('.hasSub').removeClass('hasSubActive');
                    $('.bigNav').slimScroll({ destroy: true });
                    $('.leftNav').removeClass('bigNav');
                    $('.leftNav').css('overflow', 'visible');
                    $('.full').removeClass('m-full');
                    navExpanded = false;
                }
            });

            // functionality for map manipulation icon on mobile devices
            $('.mapHandler').click(function() {
                if ($('#mapView').hasClass('mob-min') || 
                    $('#mapView').hasClass('mob-max') || 
                    $('#content').hasClass('mob-min') || 
                    $('#content').hasClass('mob-max')) {
                        $('#mapView').toggleClass('mob-max');
                        $('#content').toggleClass('mob-min');
                } else {
                    $('#mapView').toggleClass('min');
                    $('#content').toggleClass('max');
                }

                setTimeout(function() {
                    var priceSliderRangeLeft = parseInt($('.priceSlider .ui-slider-range').css('left'));
                    var priceSliderRangeWidth = $('.priceSlider .ui-slider-range').width();
                    var priceSliderLeft = priceSliderRangeLeft + ( priceSliderRangeWidth / 2 ) - ( $('.priceSlider .sliderTooltip').width() / 2 );
                    $('.priceSlider .sliderTooltip').css('left', priceSliderLeft);

                    var areaSliderRangeLeft = parseInt($('.areaSlider .ui-slider-range').css('left'));
                    var areaSliderRangeWidth = $('.areaSlider .ui-slider-range').width();
                    var areaSliderLeft = areaSliderRangeLeft + ( areaSliderRangeWidth / 2 ) - ( $('.areaSlider .sliderTooltip').width() / 2 );
                    $('.areaSlider .sliderTooltip').css('left', areaSliderLeft);

                    if ($scope.map) {
                        google.maps.event.trigger(map, 'resize');
                    }

                    $('.commentsFormWrapper').width($('#content').width());
                }, 300);

            });

            // Expand left side sub navigation menus
            $(document).on("click", '.hasSubActive', function() {
                $(this).toggleClass('active');
                $(this).children('ul').toggleClass('bigList');
                $(this).children('a').children('.arrowRight').toggleClass('fa-angle-down');
            });

            if(isDevice) {
                $('.hasSub').click(function() {
                    $('.leftNav ul li').not(this).removeClass('onTap');
                    $(this).toggleClass('onTap');
                });
            }

            // functionality for custom dropdown select list
            $('.dropdown-select li a').click(function() {
                if (!($(this).parent().hasClass('disabled'))) {
                    $(this).prev().prop("checked", true);
                    $(this).parent().siblings().removeClass('active');
                    $(this).parent().addClass('active');
                    $(this).parent().parent().siblings('.dropdown-toggle').children('.dropdown-label').html($(this).text());
                }
            });

            $('.priceSlider').slider({
                range: true,
                min: 0,
                max: 2000000,
                values: [500000, 1500000],
                step: 10000,
                slide: function(event, ui) {
                    $('.priceSlider .sliderTooltip .stLabel').html(
                        '$' + ui.values[0].toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") + 
                        ' <span class="fa fa-arrows-h"></span> ' +
                        '$' + ui.values[1].toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
                    );
                    var priceSliderRangeLeft = parseInt($('.priceSlider .ui-slider-range').css('left'));
                    var priceSliderRangeWidth = $('.priceSlider .ui-slider-range').width();
                    var priceSliderLeft = priceSliderRangeLeft + ( priceSliderRangeWidth / 2 ) - ( $('.priceSlider .sliderTooltip').width() / 2 );
                    $('.priceSlider .sliderTooltip').css('left', priceSliderLeft);
                }
            });
            $('.priceSlider .sliderTooltip .stLabel').html(
                '$' + $('.priceSlider').slider('values', 0).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") + 
                ' <span class="fa fa-arrows-h"></span> ' +
                '$' + $('.priceSlider').slider('values', 1).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
            );
            var priceSliderRangeLeft = parseInt($('.priceSlider .ui-slider-range').css('left'));
            var priceSliderRangeWidth = $('.priceSlider .ui-slider-range').width();
            var priceSliderLeft = priceSliderRangeLeft + ( priceSliderRangeWidth / 2 ) - ( $('.priceSlider .sliderTooltip').width() / 2 );
            $('.priceSlider .sliderTooltip').css('left', priceSliderLeft);

            $('.areaSlider').slider({
                range: true,
                min: 0,
                max: 20000,
                values: [5000, 10000],
                step: 10,
                slide: function(event, ui) {
                    $('.areaSlider .sliderTooltip .stLabel').html(
                        ui.values[0].toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") + ' Sq Ft' +
                        ' <span class="fa fa-arrows-h"></span> ' +
                        ui.values[1].toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") + ' Sq Ft'
                    );
                    var areaSliderRangeLeft = parseInt($('.areaSlider .ui-slider-range').css('left'));
                    var areaSliderRangeWidth = $('.areaSlider .ui-slider-range').width();
                    var areaSliderLeft = areaSliderRangeLeft + ( areaSliderRangeWidth / 2 ) - ( $('.areaSlider .sliderTooltip').width() / 2 );
                    $('.areaSlider .sliderTooltip').css('left', areaSliderLeft);
                }
            });
            $('.areaSlider .sliderTooltip .stLabel').html(
                $('.areaSlider').slider('values', 0).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") + ' Sq Ft' +
                ' <span class="fa fa-arrows-h"></span> ' +
                $('.areaSlider').slider('values', 1).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") + ' Sq Ft'
            );
            var areaSliderRangeLeft = parseInt($('.areaSlider .ui-slider-range').css('left'));
            var areaSliderRangeWidth = $('.areaSlider .ui-slider-range').width();
            var areaSliderLeft = areaSliderRangeLeft + ( areaSliderRangeWidth / 2 ) - ( $('.areaSlider .sliderTooltip').width() / 2 );
            $('.areaSlider .sliderTooltip').css('left', areaSliderLeft);

            $('.volume .btn-round-right').click(function() {
                var currentVal = parseInt($(this).siblings('input').val());
                if (currentVal < 10) {
                    $(this).siblings('input').val(currentVal + 1);
                }
            });
            $('.volume .btn-round-left').click(function() {
                var currentVal = parseInt($(this).siblings('input').val());
                if (currentVal > 1) {
                    $(this).siblings('input').val(currentVal - 1);
                }
            });

            $('.handleFilter').click(function() {
                $('.filterForm').slideToggle(200);
            });

            //Enable swiping
            $(".carousel-inner").swipe( {
                swipeLeft:function(event, direction, distance, duration, fingerCount) {
                    $(this).parent().carousel('next'); 
                },
                swipeRight: function() {
                    $(this).parent().carousel('prev');
                }
            });

            $(".carousel-inner .card").click(function() {
                window.open($(this).attr('data-linkto'), '_self');
            });

            $('#content').scroll(function() {
                if ($('.comments').length > 0) {
                    var visible = $('.comments').visible(true);
                    if (visible) {
                        $('.commentsFormWrapper').addClass('active');
                    } else {
                        $('.commentsFormWrapper').removeClass('active');
                    }
                }
            });

            $('.btn').click(function() {
                if ($(this).is('[data-toggle-class]')) {
                    $(this).toggleClass('active ' + $(this).attr('data-toggle-class'));
                }
            });

            $('.tabsWidget .tab-scroll').slimScroll({
                height: '235px',
                size: '5px',
                position: 'right',
                color: '#939393',
                alwaysVisible: false,
                distance: '5px',
                railVisible: false,
                railColor: '#222',
                railOpacity: 0.3,
                wheelStep: 10,
                allowPageScroll: true,
                disableFadeOut: false
            });

            $('.progress-bar[data-toggle="tooltip"]').tooltip();
            $('.tooltipsContainer .btn').tooltip();

            $("#slider1").slider({
                range: "min",
                value: 50,
                min: 1,
                max: 100,
                slide: repositionTooltip,
                stop: repositionTooltip
            });
            $("#slider1 .ui-slider-handle:first").tooltip({ title: $("#slider1").slider("value"), trigger: "manual"}).tooltip("show");

            $("#slider2").slider({
                range: "max",
                value: 70,
                min: 1,
                max: 100,
                slide: repositionTooltip,
                stop: repositionTooltip
            });
            $("#slider2 .ui-slider-handle:first").tooltip({ title: $("#slider2").slider("value"), trigger: "manual"}).tooltip("show");

            $("#slider3").slider({
                range: true,
                min: 0,
                max: 500,
                values: [ 190, 350 ],
                slide: repositionTooltip,
                stop: repositionTooltip
            });
            $("#slider3 .ui-slider-handle:first").tooltip({ title: $("#slider3").slider("values", 0), trigger: "manual"}).tooltip("show");
            $("#slider3 .ui-slider-handle:last").tooltip({ title: $("#slider3").slider("values", 1), trigger: "manual"}).tooltip("show");

            $('#autocomplete').autocomplete({
                source: ["ActionScript", "AppleScript", "Asp", "BASIC", "C", "C++", "Clojure", "COBOL", "ColdFusion", "Erlang", "Fortran", "Groovy", "Haskell", "Java", "JavaScript", "Lisp", "Perl", "PHP", "Python", "Ruby", "Scala", "Scheme"],
                focus: function (event, ui) {
                    var label = ui.item.label;
                    var value = ui.item.value;
                    var me = $(this);
                    setTimeout(function() {
                        me.val(value);
                    }, 1);
                }
            });

            $('#tags').tagsInput({
                'height': 'auto',
                'width': '100%',
                'defaultText': 'Add a tag',
            });

            $('#datepicker').datepicker();

            // functionality for autocomplete address field
            if ($('#address').length > 0) {
                var address = document.getElementById('address');
                var addressAuto = new google.maps.places.Autocomplete(address);

                google.maps.event.addListener(addressAuto, 'place_changed', function() {
                    var place = addressAuto.getPlace();

                    if (!place.geometry) {
                        return;
                    }
                    if (place.geometry.viewport) {
                        $scope.map.fitBounds(place.geometry.viewport);
                    } else {
                        $scope.map.setCenter(place.geometry.location);
                    }
                    $scope.newMarker.setPosition(place.geometry.location);
                    $scope.newMarker.setVisible(true);
                    $('#latitude').text($scope.newMarker.getPosition().lat());
                    $('#longitude').text(newMarker.getPosition().lng());

                    return false;
                });
            }

            $('input, textarea').placeholder();
        }, function(errorMessage){
            $scope.error = errorMessage;
        });
    };
    
    $scope.getItems();
    
    
    $scope.numberOfPages=function(){
        return Math.ceil($scope.business.length/$scope.pageSize);
    };
    $scope.orderProp = 'name';
    $scope.alldeals = function(){
        var tmpBiz = [];
        $scope.visits = false;
        $scope.refer = false;
        $scope.buys = false;
        $scope.off = false;
        $scope.currentPage = 0;
        if($scope.selectedCommunity.length > 0){
            if($scope.getcat != 0){
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            if(angular.equals(bizitem.category, $scope.getcat)){
                                tmpBiz.push(bizitem);
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }else{
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            tmpBiz.push(bizitem);
                        }
                    });
                });
                $scope.business = tmpBiz;
            }
        }else{
            if($scope.getcat != 0){
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, $scope.getcat)){
                        tmpBiz.push(bizitem);
                    }
                });
                $scope.business = tmpBiz;
            }else{
                $scope.business = $scope.businesstmp;
            }
        }
        return $scope.business;
    };
    $scope.ten_off = function(){
        var tmpBiz = [];
        $scope.visits = false;
        $scope.refer = false;
        $scope.buys = false;
        $scope.off = true;
        $scope.currentPage = 0;
        if($scope.selectedCommunity.length > 0){
            if($scope.getcat != 0){
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            if(angular.equals(bizitem.category, $scope.getcat)){
                                if(angular.equals(bizitem.ten_off, true)){
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }else{
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            if(angular.equals(bizitem.ten_off, true)){
                                tmpBiz.push(bizitem);
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }
        }else{
            if($scope.getcat != 0){
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, $scope.getcat)){
                        if(angular.equals(bizitem.ten_off, true)){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.business = tmpBiz;
            }else{
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.ten_off, true)){
                        tmpBiz.push(bizitem);
                    }
                });
                $scope.business = tmpBiz;
            }
        }
        return $scope.business;
    };
    $scope.smart_buys = function(){
        var tmpBiz = [];
        $scope.currentPage = 0;
        $scope.visits = false;
        $scope.refer = false;
        $scope.buys = true;
        $scope.off = false;
        if($scope.selectedCommunity.length > 0){
            if($scope.getcat != 0){
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            if(angular.equals(bizitem.category, $scope.getcat)){
                                if(angular.equals(bizitem.smart_buys, true)){
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }else{
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            if(angular.equals(bizitem.smart_buys, true)){
                                tmpBiz.push(bizitem);
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }
        }else{
            if($scope.getcat != 0){
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, $scope.getcat)){
                        if(angular.equals(bizitem.smart_buys, true)){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.business = tmpBiz;
            }else{
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.smart_buys, true)){
                        tmpBiz.push(bizitem);
                    }
                });
                $scope.business = tmpBiz;
            }
        }
        return $scope.business;
    };
    $scope.ten_visits = function(){
        var tmpBiz = [];
        $scope.currentPage = 0;
        $scope.visits = true;
        $scope.refer = false;
        $scope.buys = false;
        $scope.off = false;
        if($scope.selectedCommunity.length > 0){
            if($scope.getcat != 0){
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            if(angular.equals(bizitem.category, $scope.getcat)){
                                if(angular.equals(bizitem.ten_visits, true)){
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }else{
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            if(angular.equals(bizitem.ten_visits, true)){
                                tmpBiz.push(bizitem);
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }
        }else{
            if($scope.getcat != 0){
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, $scope.getcat)){
                        if(angular.equals(bizitem.ten_visits, true)){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.business = tmpBiz;
            }else{
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.ten_visits, true)){
                        tmpBiz.push(bizitem);
                    }
                });
                $scope.business = tmpBiz;
            }
        }
        return $scope.business;
    };
    $scope.refer_friends = function(){
        var tmpBiz = [];
        $scope.currentPage = 0;
        $scope.visits = false;
        $scope.refer = true;
        $scope.buys = false;
        $scope.off = false;
        if($scope.selectedCommunity.length > 0){
            if($scope.getcat != 0){
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            if(angular.equals(bizitem.category, $scope.getcat)){
                                if(angular.equals(bizitem.refer_friends, true)){
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }else{
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            if(angular.equals(bizitem.refer_friends, true)){
                                tmpBiz.push(bizitem);
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }
        }else{
            if($scope.getcat != 0){
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, $scope.getcat)){
                        if(angular.equals(bizitem.refer_friends, true)){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.business = tmpBiz;
            }else{
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.refer_friends, true)){
                        tmpBiz.push(bizitem);
                    }
                });
                $scope.business = tmpBiz;
            }
        }
        return $scope.business;
    };
    $scope.getCat = function(id){
        var tmpBiz = [];
        $scope.currentPage = 0;
        $scope.getcat = parseInt(id);
        if($scope.selectedCommunity.length > 0){
            if($scope.off){
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)) {
                            if (angular.equals(bizitem.category, id)) {
                                if (angular.equals(bizitem.ten_off, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }else if($scope.buys){
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)) {
                            if (angular.equals(bizitem.category, id)) {
                                if (angular.equals(bizitem.smart_buys, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }else if($scope.visits){
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)) {
                            if (angular.equals(bizitem.category, id)) {
                                if (angular.equals(bizitem.ten_visits, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }else if($scope.refer){
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)) {
                            if (angular.equals(bizitem.category, id)) {
                                if (angular.equals(bizitem.refer_friends, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }else{
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            if(angular.equals(bizitem.category, id)){
                                tmpBiz.push(bizitem);
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }
        }else{
            if($scope.off){
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, id)){
                        if(angular.equals(bizitem.ten_off, true)){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.business = tmpBiz;
            }else if($scope.buys){
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, id)){
                        if(angular.equals(bizitem.smart_buys, true)){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.business = tmpBiz;
            }else if($scope.visits){
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, id)){
                        if(angular.equals(bizitem.ten_visits, true)){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.business = tmpBiz;
            }else if($scope.refer){
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, id)){
                        if(angular.equals(bizitem.refer_friends, true)){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.business = tmpBiz;
            }else{
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, id)){
                        tmpBiz.push(bizitem);
                    }
                });
                $scope.business = tmpBiz;
            }
        }
        return $scope.business;
    };
    $scope.getCommunityName = function(idComm){
        var communityName = "";
        angular.forEach($scope.communities, function(comm){
            if(angular.equals(comm.id, idComm)){
                communityName = comm.name;
            }
        });
        return communityName;
    };
    $scope.getCommunity = function(){
        var id = this.community.id;
        $scope.currentPage = 0;
        if(_.contains($scope.selectedCommunity, id)){
            $scope.selectedCommunity = _.without($scope.selectedCommunity, id)
        }else{
            $scope.selectedCommunity.push(id);
        }
        var tmpBiz = [];
        if($scope.getcat != 0){
            if($scope.selectedCommunity.length > 0){
                if($scope.off){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.category, $scope.getcat)) {
                                    if (angular.equals(bizitem.ten_off, true)) {
                                        tmpBiz.push(bizitem);
                                    }
                                }
                            }
                        });
                    });
                    $scope.business = tmpBiz;
                }else if($scope.buys){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.category, $scope.getcat)) {
                                    if (angular.equals(bizitem.smart_buys, true)) {
                                        tmpBiz.push(bizitem);
                                    }
                                }
                            }
                        });
                    });
                    $scope.business = tmpBiz;
                }else if($scope.visits){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.category, $scope.getcat)) {
                                    if (angular.equals(bizitem.ten_visits, true)) {
                                        tmpBiz.push(bizitem);
                                    }
                                }
                            }
                        });
                    });
                    $scope.business = tmpBiz;
                }else if($scope.refer){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.category, $scope.getcat)) {
                                    if (angular.equals(bizitem.refer_friends, true)) {
                                        tmpBiz.push(bizitem);
                                    }
                                }
                            }
                        });
                    });
                    $scope.business = tmpBiz;
                }else{
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)){
                                if(angular.equals(bizitem.category, $scope.getcat)){
                                    tmpBiz.push(bizitem);
                                }
                            }
                        });
                    });
                    $scope.business = tmpBiz;
                }
            }else{
                $scope.business = $scope.businesstmp;
            }
        }else{
            if($scope.selectedCommunity.length > 0){
                if($scope.off){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.ten_off, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        });
                    });
                    $scope.business = tmpBiz;
                }else if($scope.buys){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.smart_buys, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        });
                    });
                    $scope.business = tmpBiz;
                }else if($scope.visits){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.ten_visits, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        });
                    });
                    $scope.business = tmpBiz;
                }else if($scope.refer){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.refer_friends, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        });
                    });
                    $scope.business = tmpBiz;
                }else{
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)){
                                tmpBiz.push(bizitem);
                            }
                        });
                    });
                    $scope.business = tmpBiz;
                }
            }else{
                $scope.business = $scope.businesstmp;
            }
        }
        return $scope.business;
    };
    
    // Función para la búequeda de deals por nombre
    // TODO: Implementar filtro por comunidad o por categoría
    $scope.searchtext = function(val){
        $scope.deleteMarkers(null);
        var tmpBiz = [];
        $scope.props = [];
        angular.forEach($scope.businesstmp, function(bizitem) {
            searchText = val.toLowerCase();
            var marker_icon;
            if (bizitem.category === "Lodging and Travel"){
                marker_icon = "/static/images/Auto_location-01.png";
            }else if(bizitem.category === "Health and Medical"){
                marker_icon = "/static/images/Health_location-01.png";
            }else if(bizitem.category === "Beauty and Spas"){
                marker_icon = "/static/images/Beauty_location-01.png";
            }else if(bizitem.category === "Restaurants"){
                marker_icon = "/static/images/Food_location-01.png";
            }else{
                marker_icon = "/static/images/Services_location-01.png";
            }
            if(bizitem.name.toString().toLowerCase().search(searchText) >= 0){
                tmpBiz.push(bizitem);
                var geo = bizitem.geo || undefined;
                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                var dict_marker = {
                    title : bizitem.name,
                    image : '/media/' + bizitem.image,
                    type : bizitem.category,
                    price : '$1,550,000',
                    address : bizitem.address,
                    bedrooms : '3',
                    bathrooms : '2',
                    area : '3430 Sq Ft',
                    position : {
                        lat : parseFloat(r[1]),
                        lng : parseFloat(r[0])
                    },
                    markerIcon : marker_icon
                };
                $scope.props.push(dict_marker);
            }               
        });        
        $scope.addMarkers($scope.props, $scope.map);
        var limits = new google.maps.LatLngBounds();
        $.each($scope.markers, function (index, marker){
            limits.extend(marker.position);            
        });
        $scope.map.fitBounds(limits);        
        $scope.business = tmpBiz;
        return $scope.business;
    };
    $scope.matchsearch = function(query){
        if($scope.selectedCommunity.length > 0){
            if($scope.getcat != 0){
                var tmpBiz = [];
                var keep =  true;
                angular.forEach($scope.selectedCommunity, function(id){
                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.category, $scope.getcat)){
                            if(angular.equals(bizitem.community, id)){
                                if(bizitem.name.toString().toLowerCase().search(query.toLowerCase()) >= 0){
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }else{
                var tmpBiz = [];
                var keep =  true;
                angular.forEach($scope.selectedCommunity, function(id){

                    angular.forEach($scope.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, id)){
                            if(bizitem.name.toString().toLowerCase().search(query.toLowerCase()) >= 0){
                                tmpBiz.push(bizitem);
                            }
                        }
                    });
                });
                $scope.business = tmpBiz;
            }
        }else{
            if($scope.getcat != 0){
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, $scope.getcat)){
                        if(bizitem.name.toString().toLowerCase().search(query.toLowerCase()) >= 0){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.business = tmpBiz;
            }else{
                var tmpBiz = [];
                var keep = true;
                angular.forEach($scope.businesstmp, function(bizitem){
                    if(bizitem.name.toString().toLowerCase().search(query.toLowerCase()) >= 0){
                        tmpBiz.push(bizitem);
                    }
                });
                $scope.business = tmpBiz;
            }
        }
        return $scope.business;
    }
}]);



myApp.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});

myApp.filter('matchName', function() {
  return function(businesses, query) {
    console.log(businesses);
    return businesses.filter(function(biz) {
      return biz.name.indexOf(query) !== -1;
    });
  };
});

myApp.factory('businessScope', function($http, $q){
    return {
        apiPath: '/communities/businesses/',
        getAllItems: function () {
            //Creating a deferred object
            var deferred = $q.defer();

            //Calling Web API to fetch shopping cart items
            $http.get(this.apiPath).success(function (data) {
                //Passing data to deferred's resolve function on successful completion
                deferred.resolve(data);
            }).error(function () {

                //Sending a friendly error message in case of failure
                deferred.reject("An error occured while fetching items");
            });

            //Returning the promise object
            return deferred.promise;
        }
    }
});

myApp.factory('Biz', function($http){
    var Biz = function(){
        this.items;
        this.busy = false;
        this.start = 0;
        this.limit = 8;
    };
    Biz.prototype.loadMore = function(){
        if (this.busy) return;
        this.busy = true;
        $http.get('/communities/businesses/' + this.start + '/' + this.limit).success(function (data) {
            this.items = data;
            if (this.start === 0){
                this.start = 8;
                this.limit = this.start + this.start;
            }else{
                this.start = this.limit;
                this.limit = this.start + this.start;
            }
            this.busy = false;
        }.bind(this));
    };
    return Biz;
});
