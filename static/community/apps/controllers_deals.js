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

var myApp = angular.module('catApp', ['ngRoute']);
var myEvents;
myApp.config(
    function ($routeProvider, $locationProvider) {
        $routeProvider
            .when(
                "/", {
                    templateUrl: '/marius/deals/',
                    controller: 'bizCtrl'
                }
            )
            .when(
                "/:bizName/:bizCode", {
                    templateUrl: '/marius/business/',
                    controller: 'bizonectrl'
                }
            )
            .otherwise({
                redirectTo: "/",
                controller: 'bizCtrl'
            });
    }
);

myApp.controller('bizCtrl', ['$scope', '$route', '$routeParams', '$http', 'businessScope', 'search' , '$rootScope', 'catmenu',function ($scope, $route, $routeParams, $http, businessScope, search, $rootScope, catmenu) {
    $scope.options = {
        zoom : 14,
        mapTypeId : 'Styled',
        disableDefaultUI: true,
        mapTypeControlOptions : {
            mapTypeIds : [ 'Styled' ]
        }
    };
    $scope.catmenu = false;
    $scope.$route = $route;
    $scope.$routeParams = $routeParams;
    $rootScope.business;
    $rootScope.businesstmp;
    $rootScope.cat = false;
    $scope.styles = [{
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
    var styledMapType = new google.maps.StyledMapType($scope.styles, {
        name : 'Styled'
    });
    $scope.map = new google.maps.Map(document.getElementById('mapView'), $scope.options);
    $scope.map.mapTypes.set('Styled', styledMapType);
    $scope.map.setZoom(14);
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
    $scope.selectedCommunity = null;
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
    $scope.model = {
        business: "",
        businesstmp: ""
    };
    $scope.addMarkers;
    $scope.placeholder_nosearch = "Loading Businesses, please wait ...";
    
    $scope.setWindowTitle = function( title ) {
        $scope.windowTitle = title;
    };
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
                                        '<a href="#/' + prop.url + '" class="btn btn-sm btn-round btn-green viewInfo" target="_self">View</a>' +
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
            $scope.model.business = data.businesses;
            $scope.communities = data.communities;
            $scope.categories = data.categories;
            $scope.model.businesstmp = data.businesses;
            $scope.bizrandom = data.business
            $scope.placeholder_nosearch = "Search for pizza, hair salons, mexican food ...";
            angular.forEach($scope.model.businesstmp, function(bizmarker){
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
                    id: bizmarker.id,
                    title : bizmarker.name,
                    url: bizmarker.slug + '/' + bizmarker.code,
                    code: bizmarker.code,
                    image : '/media/' + bizmarker.image,
                    type : bizmarker.category,
                    view: bizmarker.url,
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

            $scope.addMarkers($scope.props, $scope.map);
            var limits = new google.maps.LatLngBounds();
            $.each($scope.markers, function (index, marker){
                limits.extend(marker.position);
            });
            $scope.map.fitBounds(limits);
            return $scope.model.business;
        }, function(errorMessage){
            $scope.error = errorMessage;
        });
    };
    
    $scope.getItems();
    
    
    $scope.numberOfPages=function(){
        return Math.ceil($scope.model.business.length/$scope.pageSize);
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
                    angular.forEach($scope.model.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            if(angular.equals(bizitem.category, $scope.getcat)){
                                tmpBiz.push(bizitem);
                            }
                        }
                    });
                });
                $scope.model.business = tmpBiz;
            }else{
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.model.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            tmpBiz.push(bizitem);
                        }
                    });
                });
                $scope.model.business = tmpBiz;
            }
        }else{
            if($scope.getcat != 0){
                angular.forEach($scope.model.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, $scope.getcat)){
                        tmpBiz.push(bizitem);
                    }
                });
                $scope.model.business = tmpBiz;
            }else{
                $scope.model.business = $scope.model.businesstmp;
            }
        }
        return $scope.model.business;
    };
    $scope.get_deal = function(){
        if(this.deal === "1"){
            $scope.smart_buys();
        }else if(this.deal === "2"){
            $scope.ten_off();
        }else if(this.deal === "3"){
            $scope.ten_visits();
        }else{
            $scope.refer_friends();
        }
    };
    $scope.ten_off = function(){
        var tmpBiz = [];
        $scope.visits = false;
        $scope.refer = false;
        $scope.buys = false;
        $scope.off = true;
        $scope.currentPage = 0;
        $scope.deleteMarkers(null);
        $scope.props = [];
        if($scope.selectedCommunity !== null){
            if($scope.getcat != 0){
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.community, $scope.selectedCommunity)){
                        if(angular.equals(bizitem.category, $scope.getcat)){
                            if(angular.equals(bizitem.ten_off, true)){
                                tmpBiz.push(bizitem);
                                var geo = bizitem.geo || undefined;
                                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                                var dict_marker = {
                                    id: bizitem.id,
                                    title : bizitem.name,
                                    url: bizitem.slug + '/' + bizitem.code,
                                    code: bizitem.code,
                                    image : '/media/' + bizitem.image,
                                    type : bizitem.category,
                                    price : '$1,550,000',
                                    address : bizitem.address,
                                    view: bizitem.url,
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
                        }
                    }
                });
                $scope.model.business = tmpBiz;
            }else{
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.community, $scope.selectedCommunity)){
                        if(angular.equals(bizitem.ten_off, true)){
                            tmpBiz.push(bizitem);
                            var geo = bizitem.geo || undefined;
                            var r = geo.slice(7, geo.length - 1).split(' ') || [];
                            var dict_marker = {
                                id: bizitem.id,
                                title : bizitem.name,
                                url: bizitem.slug + '/' + bizitem.code,
                                code: bizitem.code,
                                image : '/media/' + bizitem.image,
                                type : bizitem.category,
                                price : '$1,550,000',
                                address : bizitem.address,
                                view: bizitem.url,
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
                    }
                });
                $scope.model.business = tmpBiz;
            }
        }else{
            if($scope.getcat != 0){
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.category, $scope.getcat)){
                        if(angular.equals(bizitem.ten_off, true)){
                            tmpBiz.push(bizitem);
                            var geo = bizitem.geo || undefined;
                            var r = geo.slice(7, geo.length - 1).split(' ') || [];
                            var dict_markebizitemr = {
                                id: bizitem.id,
                                title : bizitem.name,
                                url: bizitem.slug + '/' + bizitem.code,
                                code: bizitem.code,
                                image : '/media/' + bizitem.image,
                                type : bizitem.category,
                                price : '$1,550,000',
                                address : bizitem.address,
                                view: bizitem.url,
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
                    }
                });
                $scope.model.business = tmpBiz;
            }else{
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.ten_off, true)){
                        tmpBiz.push(bizitem);
                        var geo = bizitem.geo || undefined;
                        var r = geo.slice(7, geo.length - 1).split(' ') || [];
                        var dict_marker = {
                            id: bizitem.id,
                            title : bizitem.name,
                            url: bizitem.slug + '/' + bizitem.code,
                            code: bizitem.code,
                            image : '/media/' + bizitem.image,
                            type : bizitem.category,
                            price : '$1,550,000',
                            address : bizitem.address,
                            view: bizitem.url,
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
                $scope.model.business = tmpBiz;
            }
        }
        $scope.addMarkers($scope.props, $scope.map);
        var limits = new google.maps.LatLngBounds();
        $.each($scope.markers, function (index, marker){
            limits.extend(marker.position);
        });
        $scope.map.fitBounds(limits);
        return $scope.model.business;
    };
    $scope.smart_buys = function(){
        var tmpBiz = [];
        $scope.currentPage = 0;
        $scope.visits = false;
        $scope.refer = false;
        $scope.buys = true;
        $scope.off = false;
        $scope.deleteMarkers(null);
        $scope.props = [];
        if($scope.selectedCommunity !== null){
            if($scope.getcat != 0){
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.community, $scope.selectedCommunity)){
                        if(angular.equals(bizitem.category, $scope.getcat)){
                            if(angular.equals(bizitem.smart_buys, true)){
                                tmpBiz.push(bizitem);
                                var geo = bizitem.geo || undefined;
                                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                                var dict_marker = {
                                    id: bizitem.id,
                                    title : bizitem.name,
                                    url: bizitem.slug + '/' + bizitem.code,
                                    code: bizitem.code,
                                    image : '/media/' + bizitem.image,
                                    type : bizitem.category,
                                    price : '$1,550,000',
                                    address : bizitem.address,
                                    view: bizitem.url,
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
                        }
                    }
                });
                $scope.model.business = tmpBiz;
            }else{
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.community, $scope.selectedCommunity)){
                        if(angular.equals(bizitem.smart_buys, true)){
                            tmpBiz.push(bizitem);
                            var geo = bizitem.geo || undefined;
                            var r = geo.slice(7, geo.length - 1).split(' ') || [];
                            var dict_marker = {
                                id: bizitem.id,
                                title : bizitem.name,
                                url: bizitem.slug + '/' + bizitem.code,
                                code: bizitem.code,
                                image : '/media/' + bizitem.image,
                                type : bizitem.category,
                                price : '$1,550,000',
                                address : bizitem.address,
                                view: bizitem.url,
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
                    }
                });
                $scope.model.business = tmpBiz;
            }
        }else{
            if($scope.getcat != 0){
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.category, $scope.getcat)){
                        if(angular.equals(bizitem.smart_buys, true)){
                            tmpBiz.push(bizitem);
                            var geo = bizitem.geo || undefined;
                            var r = geo.slice(7, geo.length - 1).split(' ') || [];
                            var dict_marker = {
                                id: bizitem.id,
                                title : bizitem.name,
                                url: bizitem.slug + '/' + bizitem.code,
                                code: bizitem.code,
                                image : '/media/' + bizitem.image,
                                type : bizitem.category,
                                price : '$1,550,000',
                                address : bizitem.address,
                                view: bizitem.url,
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
                    }
                });
                $scope.model.business = tmpBiz;
            }else{
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.smart_buys, true)){
                        tmpBiz.push(bizitem);
                        var geo = bizitem.geo || undefined;
                        var r = geo.slice(7, geo.length - 1).split(' ') || [];
                        var dict_marker = {
                            id: bizitem.id,
                            title : bizitem.name,
                            url: bizitem.slug + '/' + bizitem.code,
                            code: bizitem.code,
                            image : '/media/' + bizitem.image,
                            type : bizitem.category,
                            price : '$1,550,000',
                            address : bizitem.address,
                            view: bizitem.url,
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
                $scope.model.business = tmpBiz;
            }
        }
        $scope.addMarkers($scope.props, $scope.map);
        var limits = new google.maps.LatLngBounds();
        $.each($scope.markers, function (index, marker){
            limits.extend(marker.position);
        });
        $scope.map.fitBounds(limits);
        return $scope.model.business;
    };
    $scope.ten_visits = function(){
        var tmpBiz = [];
        $scope.currentPage = 0;
        $scope.visits = true;
        $scope.refer = false;
        $scope.buys = false;
        $scope.off = false;
        $scope.deleteMarkers(null);
        $scope.props = [];
        if($scope.selectedCommunity !== null){
            if($scope.getcat != 0){
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.community, $scope.selectedCommunity)){
                        if(angular.equals(bizitem.category, $scope.getcat)){
                            if(angular.equals(bizitem.ten_visits, true)){
                                tmpBiz.push(bizitem);
                                var geo = bizitem.geo || undefined;
                                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                                var dict_marker = {
                                    id: bizitem.id,
                                    title : bizitem.name,
                                    url: bizitem.slug + '/' + bizitem.code,
                                    code: bizitem.code,
                                    image : '/media/' + bizitem.image,
                                    type : bizitem.category,
                                    price : '$1,550,000',
                                    address : bizitem.address,
                                    view: bizitem.url,
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
                        }
                    }
                });
                $scope.model.business = tmpBiz;
            }else{
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.community, $scope.selectedCommunity)){
                        if(angular.equals(bizitem.ten_visits, true)){
                            tmpBiz.push(bizitem);
                            var geo = bizitem.geo || undefined;
                            var r = geo.slice(7, geo.length - 1).split(' ') || [];
                            var dict_marker = {
                                id: bizitem.id,
                                title : bizitem.name,
                                url: bizitem.slug + '/' + bizitem.code,
                                code: bizitem.code,
                                image : '/media/' + bizitem.image,
                                type : bizitem.category,
                                price : '$1,550,000',
                                address : bizitem.address,
                                view: bizitem.url,
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
                    }
                });
                $scope.model.business = tmpBiz;
            }
        }else{
            if($scope.getcat != 0){
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.category, $scope.getcat)){
                        if(angular.equals(bizitem.ten_visits, true)){
                            tmpBiz.push(bizitem);
                            var geo = bizitem.geo || undefined;
                            var r = geo.slice(7, geo.length - 1).split(' ') || [];
                            var dict_marker = {
                                id: bizitem.id,
                                title : bizitem.name,
                                url: bizitem.slug + '/' + bizitem.code,
                                code: bizitem.code,
                                image : '/media/' + bizitem.image,
                                type : bizitem.category,
                                price : '$1,550,000',
                                address : bizitem.address,
                                view: bizitem.url,
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
                    }
                });
                $scope.model.business = tmpBiz;
            }else{
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.ten_visits, true)){
                        tmpBiz.push(bizitem);
                        var geo = bizitem.geo || undefined;
                        var r = geo.slice(7, geo.length - 1).split(' ') || [];
                        var dict_marker = {
                            id: bizitem.id,
                            title : bizitem.name,
                            url: bizitem.slug + '/' + bizitem.code,
                            code: bizitem.code,
                            image : '/media/' + bizitem.image,
                            type : bizitem.category,
                            price : '$1,550,000',
                            address : bizitem.address,
                            view: bizitem.url,
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
                $scope.model.business = tmpBiz;
            }
        }
        $scope.addMarkers($scope.props, $scope.map);
        var limits = new google.maps.LatLngBounds();
        $.each($scope.markers, function (index, marker){
            limits.extend(marker.position);
        });
        $scope.map.fitBounds(limits);
        return $scope.model.business;
    };
    $scope.refer_friends = function(){
        var tmpBiz = [];
        $scope.currentPage = 0;
        $scope.visits = false;
        $scope.refer = true;
        $scope.buys = false;
        $scope.off = false;
        $scope.deleteMarkers(null);
        $scope.props = [];
        if($scope.selectedCommunity !== null){
            if($scope.getcat != 0){
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.community, $scope.selectedCommunity)){
                        if(angular.equals(bizitem.category, $scope.getcat)){
                            if(angular.equals(bizitem.refer_friends, true)){
                                tmpBiz.push(bizitem);
                                var geo = bizitem.geo || undefined;
                                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                                var dict_marker = {
                                    id: bizitem.id,
                                    title : bizitem.name,
                                    url: bizitem.slug + '/' + bizitem.code,
                                    code: bizitem.code,
                                    image : '/media/' + bizitem.image,
                                    type : bizitem.category,
                                    price : '$1,550,000',
                                    address : bizitem.address,
                                    view: bizitem.url,
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
                        }
                    }
                });
                $scope.model.business = tmpBiz;
            }else{
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.community, $scope.selectedCommunity)){
                        if(angular.equals(bizitem.refer_friends, true)){
                            tmpBiz.push(bizitem);
                            var geo = bizitem.geo || undefined;
                            var r = geo.slice(7, geo.length - 1).split(' ') || [];
                            var dict_marker = {
                                id: bizitem.id,
                                title : bizitem.name,
                                url: bizitem.slug + '/' + bizitem.code,
                                code: bizitem.code,
                                image : '/media/' + bizitem.image,
                                type : bizitem.category,
                                price : '$1,550,000',
                                address : bizitem.address,
                                view: bizitem.url,
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
                    }
                });
                $scope.model.business = tmpBiz;
            }
        }else{
            if($scope.getcat != 0){
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.category, $scope.getcat)){
                        if(angular.equals(bizitem.refer_friends, true)){
                            tmpBiz.push(bizitem);
                            var geo = bizitem.geo || undefined;
                            var r = geo.slice(7, geo.length - 1).split(' ') || [];
                            var dict_marker = {
                                id: bizitem.id,
                                title : bizitem.name,
                                url: bizitem.slug + '/' + bizitem.code,
                                code: bizitem.code,
                                image : '/media/' + bizitem.image,
                                type : bizitem.category,
                                price : '$1,550,000',
                                address : bizitem.address,
                                view: bizitem.url,
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
                    }
                });
                $scope.model.business = tmpBiz;
            }else{
                angular.forEach($scope.model.businesstmp, function(bizitem){
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
                    if(angular.equals(bizitem.refer_friends, true)){
                        tmpBiz.push(bizitem);
                        var geo = bizitem.geo || undefined;
                        var r = geo.slice(7, geo.length - 1).split(' ') || [];
                        var dict_marker = {
                            id: bizitem.id,
                            title : bizitem.name,
                            url: bizitem.slug + '/' + bizmarker.code,
                            code: bizitem.code,
                            image : '/media/' + bizitem.image,
                            type : bizitem.category,
                            price : '$1,550,000',
                            address : bizitem.address,
                            view: bizitem.url,
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
                $scope.model.business = tmpBiz;
            }
        }
        $scope.addMarkers($scope.props, $scope.map);
        var limits = new google.maps.LatLngBounds();
        $.each($scope.markers, function (index, marker){
            limits.extend(marker.position);
        });
        $scope.map.fitBounds(limits);
        return $scope.model.business;
    };
    $scope.getCat = function(id){
        var tmpBiz = [];
        $scope.currentPage = 0;
        $scope.getcat = parseInt(id);
        if($scope.selectedCommunity.length > 0){
            if($scope.off){
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.model.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)) {
                            if (angular.equals(bizitem.category, id)) {
                                if (angular.equals(bizitem.ten_off, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.model.business = tmpBiz;
            }else if($scope.buys){
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.model.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)) {
                            if (angular.equals(bizitem.category, id)) {
                                if (angular.equals(bizitem.smart_buys, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.model.business = tmpBiz;
            }else if($scope.visits){
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.model.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)) {
                            if (angular.equals(bizitem.category, id)) {
                                if (angular.equals(bizitem.ten_visits, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.model.business = tmpBiz;
            }else if($scope.refer){
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.model.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)) {
                            if (angular.equals(bizitem.category, id)) {
                                if (angular.equals(bizitem.refer_friends, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.model.business = tmpBiz;
            }else{
                angular.forEach($scope.selectedCommunity, function(cid){
                    angular.forEach($scope.model.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, cid)){
                            if(angular.equals(bizitem.category, id)){
                                tmpBiz.push(bizitem);
                            }
                        }
                    });
                });
                $scope.model.business = tmpBiz;
            }
        }else{
            if($scope.off){
                angular.forEach($scope.model.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, id)){
                        if(angular.equals(bizitem.ten_off, true)){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.model.business = tmpBiz;
            }else if($scope.buys){
                angular.forEach($scope.model.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, id)){
                        if(angular.equals(bizitem.smart_buys, true)){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.model.business = tmpBiz;
            }else if($scope.visits){
                angular.forEach($scope.model.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, id)){
                        if(angular.equals(bizitem.ten_visits, true)){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.model.business = tmpBiz;
            }else if($scope.refer){
                angular.forEach($scope.model.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, id)){
                        if(angular.equals(bizitem.refer_friends, true)){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.model.business = tmpBiz;
            }else{
                angular.forEach($scope.model.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, id)){
                        tmpBiz.push(bizitem);
                    }
                });
                $scope.model.business = tmpBiz;
            }
        }
        return $scope.model.business;
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
    $scope.getCommunityUnique = function(){
        $scope.deleteMarkers(null);
        var id = this.community.id;
        $scope.selectedCommunity = id;
        var tmpBiz = [];
        $scope.props = [];
        $scope.currentPage = 0;
        angular.forEach($scope.model.businesstmp, function(bizitem){
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
            if(angular.equals(bizitem.community, id)){
                tmpBiz.push(bizitem);
                var geo = bizitem.geo || undefined;
                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                var dict_marker = {
                    id: bizitem.id,
                    title : bizitem.name,
                    url: bizitem.slug + '/' + bizitem.code,
                    code: bizitem.code,
                    image : '/media/' + bizitem.image,
                    type : bizitem.category,
                    price : '$1,550,000',
                    address : bizitem.address,
                    view: bizitem.url,
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
        $scope.model.business = tmpBiz;
        return $scope.model.business;
    };
    $scope.getCommunity = function(){
        var id = this.community.id;
        $scope.currentPage = 0;
        $scope.selectedCommunity = id;
        var tmpBiz = [];
        if($scope.getcat != 0){
            if($scope.selectedCommunity !== null){
                if($scope.off){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.model.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.category, $scope.getcat)) {
                                    if (angular.equals(bizitem.ten_off, true)) {
                                        tmpBiz.push(bizitem);
                                    }
                                }
                            }
                        });
                    });
                    $scope.model.business = tmpBiz;
                }else if($scope.buys){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.model.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.category, $scope.getcat)) {
                                    if (angular.equals(bizitem.smart_buys, true)) {
                                        tmpBiz.push(bizitem);
                                    }
                                }
                            }
                        });
                    });
                    $scope.model.business = tmpBiz;
                }else if($scope.visits){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.model.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.category, $scope.getcat)) {
                                    if (angular.equals(bizitem.ten_visits, true)) {
                                        tmpBiz.push(bizitem);
                                    }
                                }
                            }
                        });
                    });
                    $scope.model.business = tmpBiz;
                }else if($scope.refer){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.model.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.category, $scope.getcat)) {
                                    if (angular.equals(bizitem.refer_friends, true)) {
                                        tmpBiz.push(bizitem);
                                    }
                                }
                            }
                        });
                    });
                    $scope.model.business = tmpBiz;
                }else{
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.model.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)){
                                if(angular.equals(bizitem.category, $scope.getcat)){
                                    tmpBiz.push(bizitem);
                                }
                            }
                        });
                    });
                    $scope.model.business = tmpBiz;
                }
            }else{
                $scope.model.business = $scope.model.businesstmp;
            }
        }else{
            if($scope.selectedCommunity.length > 0){
                if($scope.off){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.model.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.ten_off, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        });
                    });
                    $scope.model.business = tmpBiz;
                }else if($scope.buys){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.model.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.smart_buys, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        });
                    });
                    $scope.model.business = tmpBiz;
                }else if($scope.visits){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.model.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.ten_visits, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        });
                    });
                    $scope.model.business = tmpBiz;
                }else if($scope.refer){
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.model.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)) {
                                if (angular.equals(bizitem.refer_friends, true)) {
                                    tmpBiz.push(bizitem);
                                }
                            }
                        });
                    });
                    $scope.model.business = tmpBiz;
                }else{
                    angular.forEach($scope.selectedCommunity, function(id){
                        angular.forEach($scope.model.businesstmp, function(bizitem){
                            if(angular.equals(bizitem.community, id)){
                                tmpBiz.push(bizitem);
                            }
                        });
                    });
                    $scope.model.business = tmpBiz;
                }
            }else{
                $scope.model.business = $scope.model.businesstmp;
            }
        }
        return $scope.model.business;
    };
    
    // Función para la búequeda de deals por nombre
    // TODO: Implementar filtro por comunidad o por categoría
    $scope.searchtext = function(val){
        $scope.deleteMarkers(null);
        var tmpBiz = [];
        $scope.props = [];
        angular.forEach($scope.model.businesstmp, function(bizitem) {
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
                    id: bizitem.id,
                    title : bizitem.name,
                    url: bizitem.slug + '/' + bizitem.code,
                    code: bizitem.code,
                    image : '/media/' + bizitem.image,
                    type : bizitem.category,
                    price : '$1,550,000',
                    address : bizitem.address,
                    view: bizitem.url,
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
        $scope.model.business = tmpBiz;
        return $scope.model.business;
    };
    $scope.matchsearch = function(query){
        if($scope.selectedCommunity.length > 0){
            if($scope.getcat != 0){
                var tmpBiz = [];
                var keep =  true;
                angular.forEach($scope.selectedCommunity, function(id){
                    angular.forEach($scope.model.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.category, $scope.getcat)){
                            if(angular.equals(bizitem.community, id)){
                                if(bizitem.name.toString().toLowerCase().search(query.toLowerCase()) >= 0){
                                    tmpBiz.push(bizitem);
                                }
                            }
                        }
                    });
                });
                $scope.model.business = tmpBiz;
            }else{
                var tmpBiz = [];
                var keep =  true;
                angular.forEach($scope.selectedCommunity, function(id){

                    angular.forEach($scope.model.businesstmp, function(bizitem){
                        if(angular.equals(bizitem.community, id)){
                            if(bizitem.name.toString().toLowerCase().search(query.toLowerCase()) >= 0){
                                tmpBiz.push(bizitem);
                            }
                        }
                    });
                });
                $scope.model.business = tmpBiz;
            }
        }else{
            if($scope.getcat != 0){
                angular.forEach($scope.model.businesstmp, function(bizitem){
                    if(angular.equals(bizitem.category, $scope.getcat)){
                        if(bizitem.name.toString().toLowerCase().search(query.toLowerCase()) >= 0){
                            tmpBiz.push(bizitem);
                        }
                    }
                });
                $scope.model.business = tmpBiz;
            }else{
                var tmpBiz = [];
                var keep = true;
                angular.forEach($scope.model.businesstmp, function(bizitem){
                    if(bizitem.name.toString().toLowerCase().search(query.toLowerCase()) >= 0){
                        tmpBiz.push(bizitem);
                    }
                });
                $scope.model.business = tmpBiz;
            }
        }
        return $scope.model.business;
    }
}]);

myApp.controller('bizonectrl', ['$scope', '$rootScope','$routeParams',  '$http', 'businessOneScope', 'search' , '$sce', 'catmenu',function($scope, $rootScope,$routeParams, $http, businessOneScope, search, $sce, catmenu){
    $scope.bizName = $routeParams.bizName;
    $scope.bizCode = $routeParams.bizCode;
    $scope.bizInfo;
    $scope.events;
    $scope.catmenu = true;
    $rootScope.cat = true;
    $scope.actionconfirm = false;
    $scope.getItem = function(){
        businessOneScope.getAllItem($scope.bizCode).then(function(data){
            $scope.bizInfo = data;
            $scope.video = $sce.trustAsResourceUrl('http://www.youtube.com/embed/' + data.video + '?wmode=transparent');
            $scope.menu = $sce.trustAsHtml(data.menu);
            $scope.rendermenu = function(menu){
                $("#menulistfake").html(menu);
                $(".scrollmenu").html(menu);
                $(".scrollmenu").find("h4").hide();
                var listmenu = $("#menulistfake").find("h4");
                var ulmenu = $("#menulistfake").find("h4").next("ul").hide();
                for(var i=0; i<listmenu.length; i++){
                    var ddmenu = "<a class='col-lg-4 ddmenu'></a>";
                    $(listmenu[i]).append("<i class='fa fa-caret-down'></i>").addClass("menucat");
                    $(ddmenu).append($(listmenu[i])).append($(ulmenu[i])).appendTo("#menulist");
                };
                $("a.ddmenu").click(function(e){
                    e.preventDefault();
                    var showmenu = $(this).find("ul").css("display");
                    if(showmenu==="none"){
                        $(this).find("ul").addClass("ddown");
                    }else{
                        $(this).find("ul").removeClass("ddown");
                    }
                });
            };
            $scope.rendermenu(data.menu);
            var calendars = {};
            var eventArray = [];
            $scope.events = data.events;
            angular.forEach($scope.events, function(event){
                var dict_event = {
                    start: event.date.start,
                    end: event.date.end,
                    title: event.title,
                    pop: 'pop' + event.unique
                };
                eventArray.push(dict_event);
            })
            calendars.clndr1 = $('.cal').clndr({
                events: eventArray,
                weekOffset: 1,
                daysOfTheWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
                clickEvents: {
                    click: function(target) {
                        if(target.events.length > 0) {
                            var el = target.element.children[0];
                            $(el).popover({
                              html : true,
                              placement: 'auto',
                              delay: { "show": 500, "hide": 100 },
                              content: function(){
                                  return $("#" + target.events[0].pop).html();
                              }
                            });
                            //$(el).popover('show');
                        }
                    }
                },
                multiDayEvents: {
                    startDate: 'start',
                    endDate: 'end'
                },
                showAdjacentMonths: true,
                adjacentDaysChangeMonth: false,
                doneRendering: function() {
                    $('.clndr-previous-button').html('<span class="fa fa-angle-left"></span>');
                    $('.clndr-next-button').html('<span class="fa fa-angle-right"></span>');
                    $('.clndr-table tr .day.event .day-contents').append('<span class="fa fa-circle"></span>');
                }
            });
        }, function(errorMessage){
            $scope.error = errorMessage;
        });
    };
    $scope.getItem();
    $scope.smartactions = function(){
        console.log("smart");
        if ($scope.bizInfo.user === true){
            $(this).popover({
              html : true,
              placement: 'auto',
              delay: { "show": 500, "hide": 100 },
              content: function(){
                  return $("#alert").html("<p>Save to your dashboard or redeem this coupon</p>");
              }
            });
        }else{
            $('#loginusersmart').modal(
                {
                    keyboard: true
                }
            );
        }
    };
    $scope.formLogin = {};
    $scope.promo = {};
    $scope.login = function(){
        $http({
            method  : 'POST',
            url     : '/user/login/ajax',
            data    : $.param($scope.formLogin),
            headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        .success(function(data) {
            if (data.confirm) {
                $scope.message = data.msg;
                $scope.actionconfirm = true;
                setTimeout(function(){
                    $scope.actionconfirm = false;
                    $('#loginusersmart').modal('hide');
                }, 10000);
                $http({
                    method  : 'POST',
                    url     : '/communities/get-promo/',
                    data    : $.param({ cpid: $scope.bizInfo.coupon.id}),
                    headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
                })
                .success(function(data) {
                    $scope.promo.image = data.image;
                    $scope.promo.voucher = data.voucher
                    $scope.promo.message = data.message
                });
            } else {
            // if successful, bind success message to message
                $scope.message = data.msg;
            }
        });
    }
    $scope.directions = function(newdirection){
        $scope.options = {
            zoom : 14,
            mapTypeId : 'Styled',
            disableDefaultUI: true,
            mapTypeControlOptions : {
                mapTypeIds : [ 'Styled' ]
            }
        };
        $scope.styles = [{
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
        var styledMapType = new google.maps.StyledMapType($scope.styles, {
            name : 'Styled'
        });
        $scope.map = new google.maps.Map(document.getElementById('mapView'), $scope.options);
        $scope.map.mapTypes.set('Styled', styledMapType);
        $scope.map.setZoom(14);
        var geo = $scope.bizInfo.geo || undefined;
        var r = geo.slice(7, geo.length - 1).split(' ') || [];
        var directionsDisplay;
        var directionsService = new google.maps.DirectionsService();
        var latlng = new google.maps.LatLng(parseFloat(r[1]), parseFloat(r[0]));
        function initialize(map) {
            directionsDisplay = new google.maps.DirectionsRenderer();
            directionsDisplay.setMap(map);
            directionsDisplay.setPanel(document.getElementById('directionsPanel'));
            var marker = new google.maps.Marker({
                position: latlng,
                map: map,
                title: $scope.bizInfo.name
            });
        }

        function calcRoute() {
            var start = newdirection;
            var end = $scope.bizInfo.address;
            var waypoints = [];
            if (end != "") {
                // if waypoints (via) are set, add them to the waypoints array
                waypoints.push({
                    location: end,
                    stopover: true
                });
            }
            var request = {
                origin: start,
                destination: end,
                waypoints: waypoints,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };
            directionsService.route(request, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    $('#directionsPanel').empty();
                    directionsDisplay.setDirections(response);
                    var newHeightFooterH = $(document).height();
                } else {
                    // alert an error message when the route could nog be calculated.
                    if (status == 'ZERO_RESULTS') {
                        alert('No route could be found between the origin and destination.');
                    } else if (status == 'UNKNOWN_ERROR') {
                        alert('A directions request could not be processed due to a server error. The request may succeed if you try again.');
                    } else if (status == 'REQUEST_DENIED') {
                        alert('This webpage is not allowed to use the directions service.');
                    } else if (status == 'OVER_QUERY_LIMIT') {
                        alert('The webpage has gone over the requests limit in too short a period of time.');
                    } else if (status == 'NOT_FOUND') {
                        alert('At least one of the origin, destination, or waypoints could not be geocoded.');
                    } else if (status == 'INVALID_REQUEST') {
                        alert('The DirectionsRequest provided was invalid.');
                    } else {
                        alert("There was an unknown error in your request. Requeststatus: nn" + status);
                    }
                }
            });
        };
        initialize($scope.map);
        calcRoute();
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

myApp.filter('searchtext', function(){
    return function (items, letter){
        var filtered = [];
        var letterMatch = new RegExp(letter, 'i');
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (letterMatch.test(item.name.substring(0, 1))) {
                filtered.push(item);
            }
        }
        return filtered;
    }
});

myApp.factory('catmenu', function(){
    return {flag: false};
});

myApp.factory('search',function(){
  return {text:''};
});

myApp.factory('businessOneScope', function($http, $q){
    return {
        apiPath: '/communities/business-one/',
        getAllItem: function (code) {
            var deferred = $q.defer();
            $http.get(this.apiPath, {
                params: {
                    biz_code: code
                }
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function () {
                deferred.reject("An error occured while fetching items");
            });
            return deferred.promise;
        }
    }
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
