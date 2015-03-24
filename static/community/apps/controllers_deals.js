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
  function($routeProvider, $locationProvider) {
    $routeProvider
      .when(
        "/", {
          templateUrl: '/marius/deals/',
          controller: 'bizCtrl'
        }
      )
      .when(
          "/c/:commUrl", {
          templateUrl: '/marius/community/',
          controller: 'commonectrl'
        }
      )
      .when(
        "/b/:bizName/:bizCode", {
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

myApp.controller('bizCtrl', ['$scope', '$route', '$routeParams', '$http',
  'businessScope', 'search', '$rootScope', 'catmenu', 'login', 'register',
  function($scope, $route, $routeParams, $http, businessScope, search,
    $rootScope, catmenu, login, register) {
    $scope.options = {
      zoom: 14,
      mapTypeId: 'Styled',
      disableDefaultUI: true,
      mapTypeControlOptions: {
        mapTypeIds: ['Styled']
      }
    };
    $scope.catmenu = false;
    $scope.$route = $route;
    $scope.$routeParams = $routeParams;
    $scope.notOverMarker = true;
    $rootScope.business;
    $rootScope.businesstmp;
    $rootScope.user;
    $rootScope.cat = false;
    $rootScope.panel = false;
    $scope.styles = [{
      stylers: [{
        hue: "#cccccc"
      }, {
        saturation: -100
      }]
    }, {
      featureType: "road",
      elementType: "geometry",
      stylers: [{
        lightness: 100
      }, {
        visibility: "simplified"
      }]
    }, {
      featureType: "road",
      elementType: "labels",
      stylers: [{
        visibility: "on"
      }]
    }, {
      featureType: "poi",
      stylers: [{
        visibility: "off"
      }]
    }];
    var styledMapType = new google.maps.StyledMapType($scope.styles, {
      name: 'Styled'
    });
    $scope.map = new google.maps.Map(document.getElementById('mapView'),
      $scope.options);
    $scope.map.mapTypes.set('Styled', styledMapType);
    $scope.map.setZoom(14);
    $scope.newMarker = null;
    $scope.markers = []; // array de marcadores
    $scope.props = []; // array de diccionarios con información para marcadores
    $scope.markerCluster = null; // array para el marker cluster
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
    var infoWindow;
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
    $scope.model = {
      business: "",
      businesstmp: ""
    };
    $scope.addMarkers;
    $scope.GeoMarker;
    $scope.placeholder_nosearch = "Loading Businesses, please wait ...";

    $scope.setWindowTitle = function(title) {
      $scope.windowTitle = title;
    };
    // Eliminar los marcadores del mapa y limpiar array de marcadores
    $scope.deleteMarkers = function(map) {
      for (var i = 0; i < $scope.markers.length; i++) {
        $scope.markers[i].setMap(map);        
      }
      $scope.markers = [];
      if($scope.markerCluster){
        $scope.markerCluster.clearMarkers();      
      }
    }

    // Añadir poligonos al mapa
    $scope.addPolygones = function(community, map){;
        var bounds = new google.maps.LatLngBounds();
        var latlng;
        if (!$.isPlainObject(community.border)) {
            community.border = $.parseJSON(community.border);
        }
        var commCoords = [];
        var coords = community.border.coordinates;
        for (var n = 0; n < coords[0][0].length; n++) {
            latlng = new google.maps.LatLng(coords[0][0][n][1], coords[0][0][n][0]);
            commCoords.push(latlng);
            bounds.extend(latlng);
        };
        map.fitBounds(bounds);
        var infoboxContentPol = '<div>' +
          '<div>' +
          '<div>' + community.label + '</div>' +
          '</div>' +
          '</div>';

        var polygon = new google.maps.Polygon({
            paths: commCoords,
            strokeColor: "#ec5b24",
            strokeOpacity: 1,
            strokeWeight: 3,
            fillColor: "#f48031",
            fillOpacity: 0.1,
            community: {id: community.id, label: community.label}
        });

        google.maps.event.addListener(polygon, 'mouseover', function(event){
            infoWindow.setContent(community.label);
            infoWindow.setPosition(bounds.getCenter());
            infoWindow.open(map);
        });
        google.maps.event.addListener(polygon, 'mouseout', function () {
            this.setOptions({
                fillColor: "#f48031",
                fillOpacity: 0.1
            });
            infoWindow.close();
        });
        google.maps.event.addListener(polygon, 'click', function(){
            window.location.href = "#/c/" + community.url;
            map.setCenter(bounds.getCenter());
            map.setZoom(14);
        })
        polygon.setMap(map);
    };
    // Añadir marcadores al mapa
    $scope.addMarkers = function(props, map, global) {
      $.each(props, function(i, prop) {
        var latlng = new google.maps.LatLng(prop.position.lat, prop.position
          .lng);
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
          animation: google.maps.Animation.DROP
        });
        var infoboxContent = '<div class="infoW">' +
          '<div class="propImg">' +
          '<img src="' + prop.image + '">' +
          '<div class="propBg">' +
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
          '<div class="clearfix"></div>' +
          '<div class="infoButtons">' +
          '<a class="btn btn-sm btn-round btn-gray btn-o closeInfo">Close</a>' +
          '<a href="#/' + prop.url +
          '" class="btn btn-sm btn-round btn-green viewInfo" target="_self">View</a>' +
          '</div>' +
          '</div>';

        google.maps.event.addListener(marker, 'click', (function(
          marker, i) {
          return function() {
            infobox.setContent(infoboxContent);
            infobox.open(map, marker);
          }
        })(marker, i));


        $(document).on('click', '.closeInfo', function() {
          infobox.open(null, null);
        });

        $scope.markers.push(marker);
      });
    };
    // Llenar el mapa con la totalidad de los negocios
    $scope.getItems = function() {
      businessScope.getAllItems().then(function(data) {
        $scope.model.business = data.businesses;
        $scope.communities = data.communities;
        $scope.categories = data.categories;
        $scope.model.businesstmp = data.businesses;
        $scope.bizrandom = data.business;
        $rootScope.user = data.user;
        $scope.placeholder_nosearch =
          "Search for pizza, hair salons, mexican food ...";
        angular.forEach($scope.model.businesstmp, function(bizmarker) {
          var marker_icon;
          if (bizmarker.category === "Lodging and Travel") {
            marker_icon = "/static/images/Auto_location-01.png";
          } else if (bizmarker.category === "Health and Medical") {
            marker_icon = "/static/images/Health_location-01.png";
          } else if (bizmarker.category === "Beauty and Spas") {
            marker_icon = "/static/images/Beauty_location-01.png";
          } else if (bizmarker.category === "Restaurants") {
            marker_icon = "/static/images/Food_location-01.png";
          } else {
            marker_icon =
              "/static/images/Services_location-01.png";
          }
          var geo = bizmarker.geo || undefined;
          var r = geo.slice(7, geo.length - 1).split(' ') || [];
          var dict_marker = {
            id: bizmarker.id,
            title: bizmarker.name,
            url: 'b/' + bizmarker.slug + '/' + bizmarker.code,
            code: bizmarker.code,
            image: '/media/' + bizmarker.image,
            type: bizmarker.category,
            view: bizmarker.url,
            address: bizmarker.address,
            position: {
              lat: parseFloat(r[1]),
              lng: parseFloat(r[0])
            },
            markerIcon: marker_icon
          };
          $scope.props.push(dict_marker);
        });



        //$scope.addMarkers($scope.props, $scope.map, true);
        //$scope.markerCluster = new MarkerClusterer($scope.map, $scope.markers);
        angular.forEach($scope.communities, function(community){
            infoWindow = new google.maps.InfoWindow();
            $scope.addPolygones(community, $scope.map);
        });
        $scope.map.setCenter(new google.maps.LatLng(41.8337329, -
          87.7321555));
        $scope.map.setZoom(12);
        /*var limits = new google.maps.LatLngBounds();
        $.each($scope.markers, function (index, marker){
            limits.extend(marker.position);
        });
        $scope.map.fitBounds(limits);
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            initialLocation = new google.maps.LatLng(position.coords
              .latitude, position.coords.longitude);
            $scope.map.setCenter(initialLocation);
          }, function() {
            $scope.map.setCenter(new google.maps.LatLng(
              41.8337329, -87.7321555));
            $scope.map.setZoom(12);
          });
        } else {
          $scope.map.setCenter(new google.maps.LatLng(41.8337329, -
            87.7321555));
          $scope.map.setZoom(12);
        }*/
        return $scope.model.business;
      }, function(errorMessage) {
        $scope.error = errorMessage;
      });
    };
    $scope.getItems();
    $scope.setSelectedItem = function() {
      var id = this.community.id;
      if (_.contains($scope.selectedCommunity, id)) {
        $scope.selectedCommunity = _.without($scope.selectedCommunity, id);
      } else {
        $scope.selectedCommunity.push(id);
      }
      console.log($scope.selectedCommunity);
      return false;
    };
    $scope.isChecked = function(id) {
      if (_.contains($scope.selectedCommunity, id)) {
        return 'fa fa-check pull-right';
      }
      return false;
    };
    $scope.numberOfPages = function() {
      return Math.ceil($scope.model.business.length / $scope.pageSize);
    };
    $scope.orderProp = 'name';
    $scope.alldeals = function() {
      var tmpBiz = [];
      $scope.visits = false;
      $scope.refer = false;
      $scope.buys = false;
      $scope.off = false;
      $scope.currentPage = 0;
      if ($scope.selectedCommunity.length > 0) {
        if ($scope.getcat != 0) {
          angular.forEach($scope.selectedCommunity, function(cid) {
            angular.forEach($scope.model.businesstmp, function(
              bizitem) {
              if (angular.equals(bizitem.community, cid)) {
                if (angular.equals(bizitem.category, $scope.getcat)) {
                  tmpBiz.push(bizitem);
                }
              }
            });
          });
          $scope.model.business = tmpBiz;
        } else {
          angular.forEach($scope.selectedCommunity, function(cid) {
            angular.forEach($scope.model.businesstmp, function(
              bizitem) {
              if (angular.equals(bizitem.community, cid)) {
                tmpBiz.push(bizitem);
              }
            });
          });
          $scope.model.business = tmpBiz;
        }
      } else {
        if ($scope.getcat != 0) {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            if (angular.equals(bizitem.category, $scope.getcat)) {
              tmpBiz.push(bizitem);
            }
          });
          $scope.model.business = tmpBiz;
        } else {
          $scope.model.business = $scope.model.businesstmp;
        }
      }
      return $scope.model.business;
    };
    $scope.get_deal = function() {
      if (this.deal === "1") {
        $scope.smart_buys();
      } else if (this.deal === "2") {
        $scope.ten_off();
      } else if (this.deal === "3") {
        $scope.ten_visits();
      } else if (this.deal === "4") {
        $scope.refer_friends();
      } else {
        $scope.monthly_promo();
      }
    };
    $scope.ten_off = function() {
      var tmpBiz = [];
      $scope.visits = false;
      $scope.refer = false;
      $scope.buys = false;
      $scope.off = true;
      $scope.currentPage = 0;
      $scope.deleteMarkers(null);
      $scope.props = [];
      if ($scope.selectedCommunity.length > 0) {
        if ($scope.getcat != 0) {
          angular.forEach($scope.selectedCommunity, function(cid){
              angular.forEach($scope.model.businesstmp, function(bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon = "/static/images/Auto_location-01.png";
                } else if (bizitem.category === "Health and Medical") {
                  marker_icon = "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon = "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon = "/static/images/Food_location-01.png";
                } else {
                  marker_icon = "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, cid)) {
                  if (angular.equals(bizitem.category, $scope.getcat)) {
                    if (angular.equals(bizitem.ten_off, true)) {
                      tmpBiz.push(bizitem);
                      var geo = bizitem.geo || undefined;
                      var r = geo.slice(7, geo.length - 1).split(' ') || [];
                      var dict_marker = {
                        id: bizitem.id,
                        title: bizitem.name,
                        url: bizitem.slug + '/' + bizitem.code,
                        code: bizitem.code,
                        image: '/media/' + bizitem.image,
                        type: bizitem.category,
                        price: '$1,550,000',
                        address: bizitem.address,
                        view: bizitem.url,
                        position: {
                          lat: parseFloat(r[1]),
                          lng: parseFloat(r[0])
                        },
                        markerIcon: marker_icon
                      };
                      $scope.props.push(dict_marker);
                    }
                  }
                }
              });
          });
          $scope.model.business = tmpBiz;
        } else {
          angular.forEach($scope.selectedCommunity, function(cid){
              angular.forEach($scope.model.businesstmp, function(bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon = "/static/images/Auto_location-01.png";
                } else if (bizitem.category === "Health and Medical") {
                  marker_icon = "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon = "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon = "/static/images/Food_location-01.png";
                } else {
                  marker_icon = "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, cid)) {
                  if (angular.equals(bizitem.ten_off, true)) {
                    tmpBiz.push(bizitem);
                    var geo = bizitem.geo || undefined;
                    var r = geo.slice(7, geo.length - 1).split(' ') || [];
                    var dict_marker = {
                      id: bizitem.id,
                      title: bizitem.name,
                      url: bizitem.slug + '/' + bizitem.code,
                      code: bizitem.code,
                      image: '/media/' + bizitem.image,
                      type: bizitem.category,
                      price: '$1,550,000',
                      address: bizitem.address,
                      view: bizitem.url,
                      position: {
                        lat: parseFloat(r[1]),
                        lng: parseFloat(r[0])
                      },
                      markerIcon: marker_icon
                    };
                    $scope.props.push(dict_marker);
                  }
                }
              });
          });
          $scope.model.business = tmpBiz;
        }
      } else {
        if ($scope.getcat != 0) {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.category, $scope.getcat)) {
              if (angular.equals(bizitem.ten_off, true)) {
                tmpBiz.push(bizitem);
                var geo = bizitem.geo || undefined;
                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                var dict_markebizitemr = {
                  id: bizitem.id,
                  title: bizitem.name,
                  url: bizitem.slug + '/' + bizitem.code,
                  code: bizitem.code,
                  image: '/media/' + bizitem.image,
                  type: bizitem.category,
                  address: bizitem.address,
                  view: bizitem.url,
                  position: {
                    lat: parseFloat(r[1]),
                    lng: parseFloat(r[0])
                  },
                  markerIcon: marker_icon
                };
                $scope.props.push(dict_marker);
              }
            }
          });
          $scope.model.business = tmpBiz;
        } else {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.ten_off, true)) {
              tmpBiz.push(bizitem);
              var geo = bizitem.geo || undefined;
              var r = geo.slice(7, geo.length - 1).split(' ') || [];
              var dict_marker = {
                id: bizitem.id,
                title: bizitem.name,
                url: bizitem.slug + '/' + bizitem.code,
                code: bizitem.code,
                image: '/media/' + bizitem.image,
                type: bizitem.category,
                address: bizitem.address,
                view: bizitem.url,
                position: {
                  lat: parseFloat(r[1]),
                  lng: parseFloat(r[0])
                },
                markerIcon: marker_icon
              };
              $scope.props.push(dict_marker);
            }
          });
          $scope.model.business = tmpBiz;
        }
      }
      $scope.addMarkers($scope.props, $scope.map, false);
      var limits = new google.maps.LatLngBounds();
      $.each($scope.markers, function(index, marker) {
        limits.extend(marker.position);
      });
      $scope.map.fitBounds(limits);
      if ($scope.model.business.length == 0) {
        swal({
          title: "Oops!",
          text: "There are not business for this filter!",
          type: "warning",
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Ok"
        });
      }
      return $scope.model.business;
    };
    $scope.smart_buys = function() {
      var tmpBiz = [];
      $scope.currentPage = 0;
      $scope.visits = false;
      $scope.refer = false;
      $scope.buys = true;
      $scope.off = false;
      $scope.deleteMarkers(null);
      $scope.props = [];
      if ($scope.selectedCommunity.length > 0) {
        if ($scope.getcat != 0) {
          angular.forEach($scope.selectedCommunity, function(cid){
              angular.forEach($scope.model.businesstmp, function(bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon = "/static/images/Auto_location-01.png";
                } else if (bizitem.category === "Health and Medical") {
                  marker_icon = "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon = "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon = "/static/images/Food_location-01.png";
                } else {
                  marker_icon = "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, cid)) {
                  if (angular.equals(bizitem.category, $scope.getcat)) {
                    if (angular.equals(bizitem.smart_buys, true)) {
                      tmpBiz.push(bizitem);
                      var geo = bizitem.geo || undefined;
                      var r = geo.slice(7, geo.length - 1).split(' ') || [];
                      var dict_marker = {
                        id: bizitem.id,
                        title: bizitem.name,
                        url: bizitem.slug + '/' + bizitem.code,
                        code: bizitem.code,
                        image: '/media/' + bizitem.image,
                        type: bizitem.category,
                        address: bizitem.address,
                        view: bizitem.url,
                        position: {
                          lat: parseFloat(r[1]),
                          lng: parseFloat(r[0])
                        },
                        markerIcon: marker_icon
                      };
                      $scope.props.push(dict_marker);
                    }
                  }
                }
              });
          });
          $scope.model.business = tmpBiz;
        } else {
          angular.forEach($scope.selectedCommunity, function(cid){
              angular.forEach($scope.model.businesstmp, function(bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon = "/static/images/Auto_location-01.png";
                } else if (bizitem.category === "Health and Medical") {
                  marker_icon = "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon = "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon = "/static/images/Food_location-01.png";
                } else {
                  marker_icon = "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, cid)) {
                  if (angular.equals(bizitem.smart_buys, true)) {
                    tmpBiz.push(bizitem);
                    var geo = bizitem.geo || undefined;
                    var r = geo.slice(7, geo.length - 1).split(' ') || [];
                    var dict_marker = {
                      id: bizitem.id,
                      title: bizitem.name,
                      url: bizitem.slug + '/' + bizitem.code,
                      code: bizitem.code,
                      image: '/media/' + bizitem.image,
                      type: bizitem.category,
                      address: bizitem.address,
                      view: bizitem.url,
                      position: {
                        lat: parseFloat(r[1]),
                        lng: parseFloat(r[0])
                      },
                      markerIcon: marker_icon
                    };
                    $scope.props.push(dict_marker);
                  }
                }
              });
          });
          $scope.model.business = tmpBiz;
        }
      } else {
        if ($scope.getcat != 0) {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.category, $scope.getcat)) {
              if (angular.equals(bizitem.smart_buys, true)) {
                tmpBiz.push(bizitem);
                var geo = bizitem.geo || undefined;
                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                var dict_marker = {
                  id: bizitem.id,
                  title: bizitem.name,
                  url: bizitem.slug + '/' + bizitem.code,
                  code: bizitem.code,
                  image: '/media/' + bizitem.image,
                  type: bizitem.category,
                  address: bizitem.address,
                  view: bizitem.url,
                  position: {
                    lat: parseFloat(r[1]),
                    lng: parseFloat(r[0])
                  },
                  markerIcon: marker_icon
                };
                $scope.props.push(dict_marker);
              }
            }
          });
          $scope.model.business = tmpBiz;
        } else {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.smart_buys, true)) {
              tmpBiz.push(bizitem);
              var geo = bizitem.geo || undefined;
              var r = geo.slice(7, geo.length - 1).split(' ') || [];
              var dict_marker = {
                id: bizitem.id,
                title: bizitem.name,
                url: bizitem.slug + '/' + bizitem.code,
                code: bizitem.code,
                image: '/media/' + bizitem.image,
                type: bizitem.category,
                address: bizitem.address,
                view: bizitem.url,
                position: {
                  lat: parseFloat(r[1]),
                  lng: parseFloat(r[0])
                },
                markerIcon: marker_icon
              };
              $scope.props.push(dict_marker);
            }
          });
          $scope.model.business = tmpBiz;
        }
      }
      $scope.addMarkers($scope.props, $scope.map, false);
      var limits = new google.maps.LatLngBounds();
      $.each($scope.markers, function(index, marker) {
        limits.extend(marker.position);
      });
      $scope.map.fitBounds(limits);
      if ($scope.model.business.length == 0) {
        swal({
          title: "Oops!",
          text: "There are not business for this filter!",
          type: "warning",
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Ok"
        });
      }
      return $scope.model.business;
    };
    $scope.ten_visits = function() {
      var tmpBiz = [];
      $scope.currentPage = 0;
      $scope.visits = true;
      $scope.refer = false;
      $scope.buys = false;
      $scope.off = false;
      $scope.deleteMarkers(null);
      $scope.props = [];
      if ($scope.selectedCommunity.length > 0) {
        if ($scope.getcat != 0) {
          angular.forEach($scope.selectedCommunity, function(cid){
              angular.forEach($scope.model.businesstmp, function(bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon = "/static/images/Auto_location-01.png";
                } else if (bizitem.category === "Health and Medical") {
                  marker_icon = "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon = "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon = "/static/images/Food_location-01.png";
                } else {
                  marker_icon = "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, cid)) {
                  if (angular.equals(bizitem.category, $scope.getcat)) {
                    if (angular.equals(bizitem.ten_visits, true)) {
                      tmpBiz.push(bizitem);
                      var geo = bizitem.geo || undefined;
                      var r = geo.slice(7, geo.length - 1).split(' ') || [];
                      var dict_marker = {
                        id: bizitem.id,
                        title: bizitem.name,
                        url: bizitem.slug + '/' + bizitem.code,
                        code: bizitem.code,
                        image: '/media/' + bizitem.image,
                        type: bizitem.category,
                        address: bizitem.address,
                        view: bizitem.url,
                        position: {
                          lat: parseFloat(r[1]),
                          lng: parseFloat(r[0])
                        },
                        markerIcon: marker_icon
                      };
                      $scope.props.push(dict_marker);
                    }
                  }
                }
              });
          });
          $scope.model.business = tmpBiz;
        } else {
          angular.forEach($scope.selectedCommunity, function(cid){
              angular.forEach($scope.model.businesstmp, function(bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon = "/static/images/Auto_location-01.png";
                } else if (bizitem.category === "Health and Medical") {
                  marker_icon = "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon = "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon = "/static/images/Food_location-01.png";
                } else {
                  marker_icon = "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, cid)) {
                  if (angular.equals(bizitem.ten_visits, true)) {
                    tmpBiz.push(bizitem);
                    var geo = bizitem.geo || undefined;
                    var r = geo.slice(7, geo.length - 1).split(' ') || [];
                    var dict_marker = {
                      id: bizitem.id,
                      title: bizitem.name,
                      url: bizitem.slug + '/' + bizitem.code,
                      code: bizitem.code,
                      image: '/media/' + bizitem.image,
                      type: bizitem.category,
                      address: bizitem.address,
                      view: bizitem.url,
                      position: {
                        lat: parseFloat(r[1]),
                        lng: parseFloat(r[0])
                      },
                      markerIcon: marker_icon
                    };
                    $scope.props.push(dict_marker);
                  }
                }
              });
          });
          $scope.model.business = tmpBiz;
        }
      } else {
        if ($scope.getcat != 0) {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.category, $scope.getcat)) {
              if (angular.equals(bizitem.ten_visits, true)) {
                tmpBiz.push(bizitem);
                var geo = bizitem.geo || undefined;
                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                var dict_marker = {
                  id: bizitem.id,
                  title: bizitem.name,
                  url: bizitem.slug + '/' + bizitem.code,
                  code: bizitem.code,
                  image: '/media/' + bizitem.image,
                  type: bizitem.category,
                  address: bizitem.address,
                  view: bizitem.url,
                  position: {
                    lat: parseFloat(r[1]),
                    lng: parseFloat(r[0])
                  },
                  markerIcon: marker_icon
                };
                $scope.props.push(dict_marker);
              }
            }
          });
          $scope.model.business = tmpBiz;
        } else {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.ten_visits, true)) {
              tmpBiz.push(bizitem);
              var geo = bizitem.geo || undefined;
              var r = geo.slice(7, geo.length - 1).split(' ') || [];
              var dict_marker = {
                id: bizitem.id,
                title: bizitem.name,
                url: bizitem.slug + '/' + bizitem.code,
                code: bizitem.code,
                image: '/media/' + bizitem.image,
                type: bizitem.category,
                address: bizitem.address,
                view: bizitem.url,
                position: {
                  lat: parseFloat(r[1]),
                  lng: parseFloat(r[0])
                },
                markerIcon: marker_icon
              };
              $scope.props.push(dict_marker);
            }
          });
          $scope.model.business = tmpBiz;
        }
      }
      $scope.addMarkers($scope.props, $scope.map, false);
      var limits = new google.maps.LatLngBounds();
      $.each($scope.markers, function(index, marker) {
        limits.extend(marker.position);
      });
      $scope.map.fitBounds(limits);
      if ($scope.model.business.length == 0) {
        swal({
          title: "Oops!",
          text: "There are not business for this filter!",
          type: "warning",
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Ok"
        });
      }
      return $scope.model.business;
    };
    $scope.refer_friends = function() {
      var tmpBiz = [];
      $scope.currentPage = 0;
      $scope.visits = false;
      $scope.refer = true;
      $scope.buys = false;
      $scope.off = false;
      $scope.deleteMarkers(null);
      $scope.props = [];
      if ($scope.selectedCommunity.length > 0) {
        if ($scope.getcat != 0) {
          angular.forEach($scope.selectedCommunity, function(cid){
              angular.forEach($scope.model.businesstmp, function(bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon = "/static/images/Auto_location-01.png";
                } else if (bizitem.category === "Health and Medical") {
                  marker_icon = "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon = "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon = "/static/images/Food_location-01.png";
                } else {
                  marker_icon = "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, cid)) {
                  if (angular.equals(bizitem.category, $scope.getcat)) {
                    if (angular.equals(bizitem.refer_friends, true)) {
                      tmpBiz.push(bizitem);
                      var geo = bizitem.geo || undefined;
                      var r = geo.slice(7, geo.length - 1).split(' ') || [];
                      var dict_marker = {
                        id: bizitem.id,
                        title: bizitem.name,
                        url: bizitem.slug + '/' + bizitem.code,
                        code: bizitem.code,
                        image: '/media/' + bizitem.image,
                        type: bizitem.category,
                        address: bizitem.address,
                        view: bizitem.url,
                        position: {
                          lat: parseFloat(r[1]),
                          lng: parseFloat(r[0])
                        },
                        markerIcon: marker_icon
                      };
                      $scope.props.push(dict_marker);
                    }
                  }
                }
              });
          });
          $scope.model.business = tmpBiz;
        } else {
          angular.forEach($scope.selectedCommunity, function(cid){
              angular.forEach($scope.model.businesstmp, function(bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon = "/static/images/Auto_location-01.png";
                } else if (bizitem.category === "Health and Medical") {
                  marker_icon = "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon = "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon = "/static/images/Food_location-01.png";
                } else {
                  marker_icon = "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, cid)) {
                  if (angular.equals(bizitem.refer_friends, true)) {
                    tmpBiz.push(bizitem);
                    var geo = bizitem.geo || undefined;
                    var r = geo.slice(7, geo.length - 1).split(' ') || [];
                    var dict_marker = {
                      id: bizitem.id,
                      title: bizitem.name,
                      url: bizitem.slug + '/' + bizitem.code,
                      code: bizitem.code,
                      image: '/media/' + bizitem.image,
                      type: bizitem.category,
                      address: bizitem.address,
                      view: bizitem.url,
                      position: {
                        lat: parseFloat(r[1]),
                        lng: parseFloat(r[0])
                      },
                      markerIcon: marker_icon
                    };
                    $scope.props.push(dict_marker);
                  }
                }
              });
          });
          $scope.model.business = tmpBiz;
        }
      } else {
        if ($scope.getcat != 0) {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.category, $scope.getcat)) {
              if (angular.equals(bizitem.refer_friends, true)) {
                tmpBiz.push(bizitem);
                var geo = bizitem.geo || undefined;
                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                var dict_marker = {
                  id: bizitem.id,
                  title: bizitem.name,
                  url: bizitem.slug + '/' + bizitem.code,
                  code: bizitem.code,
                  image: '/media/' + bizitem.image,
                  type: bizitem.category,
                  price: '$1,550,000',
                  address: bizitem.address,
                  view: bizitem.url,
                  bedrooms: '3',
                  bathrooms: '2',
                  area: '3430 Sq Ft',
                  position: {
                    lat: parseFloat(r[1]),
                    lng: parseFloat(r[0])
                  },
                  markerIcon: marker_icon
                };
                $scope.props.push(dict_marker);
              }
            }
          });
          $scope.model.business = tmpBiz;
        } else {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.refer_friends, true)) {
              tmpBiz.push(bizitem);
              var geo = bizitem.geo || undefined;
              var r = geo.slice(7, geo.length - 1).split(' ') || [];
              var dict_marker = {
                id: bizitem.id,
                title: bizitem.name,
                url: bizitem.slug + '/' + bizmarker.code,
                code: bizitem.code,
                image: '/media/' + bizitem.image,
                type: bizitem.category,
                price: '$1,550,000',
                address: bizitem.address,
                view: bizitem.url,
                bedrooms: '3',
                bathrooms: '2',
                area: '3430 Sq Ft',
                position: {
                  lat: parseFloat(r[1]),
                  lng: parseFloat(r[0])
                },
                markerIcon: marker_icon
              };
              $scope.props.push(dict_marker);
            }
          });
          $scope.model.business = tmpBiz;
        }
      }
      $scope.addMarkers($scope.props, $scope.map, false);
      var limits = new google.maps.LatLngBounds();
      $.each($scope.markers, function(index, marker) {
        limits.extend(marker.position);
      });
      $scope.map.fitBounds(limits);
      if ($scope.model.business.length == 0) {
        swal({
          title: "Oops!",
          text: "There are not business for this filter!",
          type: "warning",
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Ok"
        });
      }
      return $scope.model.business;
    };
    $scope.monthly_promo = function() {
      var tmpBiz = [];
      $scope.currentPage = 0;
      $scope.visits = false;
      $scope.refer = false;
      $scope.buys = false;
      $scope.off = false;
      $scope.deleteMarkers(null);
      $scope.props = [];
      if ($scope.selectedCommunity !== null) {
        if ($scope.getcat != 0) {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.community, $scope.selectedCommunity)) {
              if (angular.equals(bizitem.category, $scope.getcat)) {
                if (angular.equals(bizitem.monthly_promo, true)) {
                  tmpBiz.push(bizitem);
                  var geo = bizitem.geo || undefined;
                  var r = geo.slice(7, geo.length - 1).split(' ') || [];
                  var dict_marker = {
                    id: bizitem.id,
                    title: bizitem.name,
                    url: bizitem.slug + '/' + bizitem.code,
                    code: bizitem.code,
                    image: '/media/' + bizitem.image,
                    type: bizitem.category,
                    price: '$1,550,000',
                    address: bizitem.address,
                    view: bizitem.url,
                    bedrooms: '3',
                    bathrooms: '2',
                    area: '3430 Sq Ft',
                    position: {
                      lat: parseFloat(r[1]),
                      lng: parseFloat(r[0])
                    },
                    markerIcon: marker_icon
                  };
                  $scope.props.push(dict_marker);
                }
              }
            }
          });
          $scope.model.business = tmpBiz;
        } else {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.community, $scope.selectedCommunity)) {
              if (angular.equals(bizitem.monthly_promo, true)) {
                tmpBiz.push(bizitem);
                var geo = bizitem.geo || undefined;
                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                var dict_marker = {
                  id: bizitem.id,
                  title: bizitem.name,
                  url: bizitem.slug + '/' + bizitem.code,
                  code: bizitem.code,
                  image: '/media/' + bizitem.image,
                  type: bizitem.category,
                  price: '$1,550,000',
                  address: bizitem.address,
                  view: bizitem.url,
                  bedrooms: '3',
                  bathrooms: '2',
                  area: '3430 Sq Ft',
                  position: {
                    lat: parseFloat(r[1]),
                    lng: parseFloat(r[0])
                  },
                  markerIcon: marker_icon
                };
                $scope.props.push(dict_marker);
              }
            }
          });
          $scope.model.business = tmpBiz;
        }
      } else {
        if ($scope.getcat != 0) {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.category, $scope.getcat)) {
              if (angular.equals(bizitem.monthly_promo, true)) {
                tmpBiz.push(bizitem);
                var geo = bizitem.geo || undefined;
                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                var dict_marker = {
                  id: bizitem.id,
                  title: bizitem.name,
                  url: bizitem.slug + '/' + bizitem.code,
                  code: bizitem.code,
                  image: '/media/' + bizitem.image,
                  type: bizitem.category,
                  price: '$1,550,000',
                  address: bizitem.address,
                  view: bizitem.url,
                  bedrooms: '3',
                  bathrooms: '2',
                  area: '3430 Sq Ft',
                  position: {
                    lat: parseFloat(r[1]),
                    lng: parseFloat(r[0])
                  },
                  markerIcon: marker_icon
                };
                $scope.props.push(dict_marker);
              }
            }
          });
          $scope.model.business = tmpBiz;
        } else {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.monthly_promo, true)) {
              tmpBiz.push(bizitem);
              var geo = bizitem.geo || undefined;
              var r = geo.slice(7, geo.length - 1).split(' ') || [];
              var dict_marker = {
                id: bizitem.id,
                title: bizitem.name,
                url: bizitem.slug + '/' + bizitem.code,
                code: bizitem.code,
                image: '/media/' + bizitem.image,
                type: bizitem.category,
                price: '$1,550,000',
                address: bizitem.address,
                view: bizitem.url,
                bedrooms: '3',
                bathrooms: '2',
                area: '3430 Sq Ft',
                position: {
                  lat: parseFloat(r[1]),
                  lng: parseFloat(r[0])
                },
                markerIcon: marker_icon
              };
              $scope.props.push(dict_marker);
            }
          });
          $scope.model.business = tmpBiz;
        }
      }
      $scope.addMarkers($scope.props, $scope.map, false);
      var limits = new google.maps.LatLngBounds();
      $.each($scope.markers, function(index, marker) {
        limits.extend(marker.position);
      });
      $scope.map.fitBounds(limits);
      if ($scope.model.business.length == 0) {
        swal({
          title: "Oops!",
          text: "There are not business for this filter!",
          type: "warning",
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Ok"
        });
      }
      return $scope.model.business;
    };
    $scope.getCat = function(id) {
      $scope.deleteMarkers(null);
      var tmpBiz = [];
      $scope.currentPage = 0;
      $scope.props = [];
      $scope.getcat = parseInt(id);
      if ($scope.selectedCommunity.length > 0) {
        if ($scope.off) {
          angular.forEach($scope.selectedCommunity, function(cid){
              angular.forEach($scope.model.businesstmp, function(bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon = "/static/images/Auto_location-01.png";
                } else if (bizitem.category === "Health and Medical") {
                  marker_icon = "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon = "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon = "/static/images/Food_location-01.png";
                } else {
                  marker_icon = "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, cid)) {
                  if (angular.equals(bizitem.cat_id, id)) {
                    if (angular.equals(bizitem.ten_off, true)) {
                      tmpBiz.push(bizitem);
                      var geo = bizitem.geo || undefined;
                      var r = geo.slice(7, geo.length - 1).split(' ') || [];
                      var dict_marker = {
                        id: bizitem.id,
                        title: bizitem.name,
                        url: bizitem.slug + '/' + bizitem.code,
                        code: bizitem.code,
                        image: '/media/' + bizitem.image,
                        type: bizitem.category,
                        price: '$1,550,000',
                        address: bizitem.address,
                        view: bizitem.url,
                        bedrooms: '3',
                        bathrooms: '2',
                        area: '3430 Sq Ft',
                        position: {
                          lat: parseFloat(r[1]),
                          lng: parseFloat(r[0])
                        },
                        markerIcon: marker_icon
                      };
                      $scope.props.push(dict_marker);
                    }
                  }
                }
              });
          });
          $scope.model.business = tmpBiz;
        } else if ($scope.buys) {
          angular.forEach($scope.selectedCommunity, function(cid){
              angular.forEach($scope.model.businesstmp, function(bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon = "/static/images/Auto_location-01.png";
                } else if (bizitem.category === "Health and Medical") {
                  marker_icon = "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon = "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon = "/static/images/Food_location-01.png";
                } else {
                  marker_icon = "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, cid)) {
                  if (angular.equals(bizitem.cat_id, id)) {
                    if (angular.equals(bizitem.smart_buys, true)) {
                      tmpBiz.push(bizitem);
                      var geo = bizitem.geo || undefined;
                      var r = geo.slice(7, geo.length - 1).split(' ') || [];
                      var dict_marker = {
                        id: bizitem.id,
                        title: bizitem.name,
                        url: bizitem.slug + '/' + bizitem.code,
                        code: bizitem.code,
                        image: '/media/' + bizitem.image,
                        type: bizitem.category,
                        price: '$1,550,000',
                        address: bizitem.address,
                        view: bizitem.url,
                        bedrooms: '3',
                        bathrooms: '2',
                        area: '3430 Sq Ft',
                        position: {
                          lat: parseFloat(r[1]),
                          lng: parseFloat(r[0])
                        },
                        markerIcon: marker_icon
                      };
                      $scope.props.push(dict_marker);
                    }
                  }
                }
              });
          });
          $scope.model.business = tmpBiz;
        } else if ($scope.visits) {
          angular.forEach($scope.selectedCommunity, function(cid){
              angular.forEach($scope.model.businesstmp, function(bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon = "/static/images/Auto_location-01.png";
                } else if (bizitem.category === "Health and Medical") {
                  marker_icon = "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon = "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon = "/static/images/Food_location-01.png";
                } else {
                  marker_icon = "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, cid)) {
                  if (angular.equals(bizitem.cat_id, id)) {
                    if (angular.equals(bizitem.ten_visits, true)) {
                      tmpBiz.push(bizitem);
                      var geo = bizitem.geo || undefined;
                      var r = geo.slice(7, geo.length - 1).split(' ') || [];
                      var dict_marker = {
                        id: bizitem.id,
                        title: bizitem.name,
                        url: bizitem.slug + '/' + bizitem.code,
                        code: bizitem.code,
                        image: '/media/' + bizitem.image,
                        type: bizitem.category,
                        price: '$1,550,000',
                        address: bizitem.address,
                        view: bizitem.url,
                        bedrooms: '3',
                        bathrooms: '2',
                        area: '3430 Sq Ft',
                        position: {
                          lat: parseFloat(r[1]),
                          lng: parseFloat(r[0])
                        },
                        markerIcon: marker_icon
                      };
                      $scope.props.push(dict_marker);
                    }
                  }
                }
              });
          });
          $scope.model.business = tmpBiz;
        } else if ($scope.refer) {
          angular.forEach($scope.selectedCommunity, function(cid){
              angular.forEach($scope.model.businesstmp, function(bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon = "/static/images/Auto_location-01.png";
                } else if (bizitem.category === "Health and Medical") {
                  marker_icon = "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon = "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon = "/static/images/Food_location-01.png";
                } else {
                  marker_icon = "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, cid)) {
                  if (angular.equals(bizitem.cat_id, id)) {
                    if (angular.equals(bizitem.refer_friends, true)) {
                      tmpBiz.push(bizitem);
                      var geo = bizitem.geo || undefined;
                      var r = geo.slice(7, geo.length - 1).split(' ') || [];
                      var dict_marker = {
                        id: bizitem.id,
                        title: bizitem.name,
                        url: bizitem.slug + '/' + bizitem.code,
                        code: bizitem.code,
                        image: '/media/' + bizitem.image,
                        type: bizitem.category,
                        price: '$1,550,000',
                        address: bizitem.address,
                        view: bizitem.url,
                        bedrooms: '3',
                        bathrooms: '2',
                        area: '3430 Sq Ft',
                        position: {
                          lat: parseFloat(r[1]),
                          lng: parseFloat(r[0])
                        },
                        markerIcon: marker_icon
                      };
                      $scope.props.push(dict_marker);
                    }
                  }
                }
              });
          });
          $scope.model.business = tmpBiz;
        } else {
          angular.forEach($scope.selectedCommunity, function(cid){
              angular.forEach($scope.model.businesstmp, function(bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon = "/static/images/Auto_location-01.png";
                } else if (bizitem.category === "Health and Medical") {
                  marker_icon = "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon = "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon = "/static/images/Food_location-01.png";
                } else {
                  marker_icon = "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, cid)) {
                  if (angular.equals(bizitem.cat_id, id)) {
                    tmpBiz.push(bizitem);
                    var geo = bizitem.geo || undefined;
                    var r = geo.slice(7, geo.length - 1).split(' ') || [];
                    var dict_marker = {
                      id: bizitem.id,
                      title: bizitem.name,
                      url: bizitem.slug + '/' + bizitem.code,
                      code: bizitem.code,
                      image: '/media/' + bizitem.image,
                      type: bizitem.category,
                      price: '$1,550,000',
                      address: bizitem.address,
                      view: bizitem.url,
                      bedrooms: '3',
                      bathrooms: '2',
                      area: '3430 Sq Ft',
                      position: {
                        lat: parseFloat(r[1]),
                        lng: parseFloat(r[0])
                      },
                      markerIcon: marker_icon
                    };
                    $scope.props.push(dict_marker);
                  }
                }
              });
          });
          $scope.model.business = tmpBiz;
        }
      } else {
        if ($scope.off) {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.cat_id, id)) {
              if (angular.equals(bizitem.ten_off, true)) {
                tmpBiz.push(bizitem);
                var geo = bizitem.geo || undefined;
                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                var dict_marker = {
                  id: bizitem.id,
                  title: bizitem.name,
                  url: bizitem.slug + '/' + bizitem.code,
                  code: bizitem.code,
                  image: '/media/' + bizitem.image,
                  type: bizitem.category,
                  price: '$1,550,000',
                  address: bizitem.address,
                  view: bizitem.url,
                  bedrooms: '3',
                  bathrooms: '2',
                  area: '3430 Sq Ft',
                  position: {
                    lat: parseFloat(r[1]),
                    lng: parseFloat(r[0])
                  },
                  markerIcon: marker_icon
                };
                $scope.props.push(dict_marker);
              }
            }
          });
          $scope.model.business = tmpBiz;
        } else if ($scope.buys) {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.cat_id, id)) {
              if (angular.equals(bizitem.smart_buys, true)) {
                tmpBiz.push(bizitem);
                var geo = bizitem.geo || undefined;
                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                var dict_marker = {
                  id: bizitem.id,
                  title: bizitem.name,
                  url: bizitem.slug + '/' + bizitem.code,
                  code: bizitem.code,
                  image: '/media/' + bizitem.image,
                  type: bizitem.category,
                  price: '$1,550,000',
                  address: bizitem.address,
                  view: bizitem.url,
                  bedrooms: '3',
                  bathrooms: '2',
                  area: '3430 Sq Ft',
                  position: {
                    lat: parseFloat(r[1]),
                    lng: parseFloat(r[0])
                  },
                  markerIcon: marker_icon
                };
                $scope.props.push(dict_marker);
              }
            }
          });
          $scope.model.business = tmpBiz;
        } else if ($scope.visits) {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.cat_id, id)) {
              if (angular.equals(bizitem.ten_visits, true)) {
                tmpBiz.push(bizitem);
                var geo = bizitem.geo || undefined;
                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                var dict_marker = {
                  id: bizitem.id,
                  title: bizitem.name,
                  url: bizitem.slug + '/' + bizitem.code,
                  code: bizitem.code,
                  image: '/media/' + bizitem.image,
                  type: bizitem.category,
                  price: '$1,550,000',
                  address: bizitem.address,
                  view: bizitem.url,
                  bedrooms: '3',
                  bathrooms: '2',
                  area: '3430 Sq Ft',
                  position: {
                    lat: parseFloat(r[1]),
                    lng: parseFloat(r[0])
                  },
                  markerIcon: marker_icon
                };
                $scope.props.push(dict_marker);
              }
            }
          });
          $scope.model.business = tmpBiz;
        } else if ($scope.refer) {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.cat_id, id)) {
              if (angular.equals(bizitem.refer_friends, true)) {
                tmpBiz.push(bizitem);
                var geo = bizitem.geo || undefined;
                var r = geo.slice(7, geo.length - 1).split(' ') || [];
                var dict_marker = {
                  id: bizitem.id,
                  title: bizitem.name,
                  url: bizitem.slug + '/' + bizitem.code,
                  code: bizitem.code,
                  image: '/media/' + bizitem.image,
                  type: bizitem.category,
                  price: '$1,550,000',
                  address: bizitem.address,
                  view: bizitem.url,
                  bedrooms: '3',
                  bathrooms: '2',
                  area: '3430 Sq Ft',
                  position: {
                    lat: parseFloat(r[1]),
                    lng: parseFloat(r[0])
                  },
                  markerIcon: marker_icon
                };
                $scope.props.push(dict_marker);
              }
            }
          });
          $scope.model.business = tmpBiz;
        } else {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            var marker_icon;
            if (bizitem.category === "Lodging and Travel") {
              marker_icon = "/static/images/Auto_location-01.png";
            } else if (bizitem.category === "Health and Medical") {
              marker_icon = "/static/images/Health_location-01.png";
            } else if (bizitem.category === "Beauty and Spas") {
              marker_icon = "/static/images/Beauty_location-01.png";
            } else if (bizitem.category === "Restaurants") {
              marker_icon = "/static/images/Food_location-01.png";
            } else {
              marker_icon = "/static/images/Services_location-01.png";
            }
            if (angular.equals(bizitem.cat_id, id)) {
              tmpBiz.push(bizitem);
              var geo = bizitem.geo || undefined;
              var r = geo.slice(7, geo.length - 1).split(' ') || [];
              var dict_marker = {
                id: bizitem.id,
                title: bizitem.name,
                url: bizitem.slug + '/' + bizitem.code,
                code: bizitem.code,
                image: '/media/' + bizitem.image,
                type: bizitem.category,
                price: '$1,550,000',
                address: bizitem.address,
                view: bizitem.url,
                bedrooms: '3',
                bathrooms: '2',
                area: '3430 Sq Ft',
                position: {
                  lat: parseFloat(r[1]),
                  lng: parseFloat(r[0])
                },
                markerIcon: marker_icon
              };
              $scope.props.push(dict_marker);
            }
          });
          $scope.model.business = tmpBiz;
        }
      }
      $scope.addMarkers($scope.props, $scope.map, false);
      var limits = new google.maps.LatLngBounds();
      $.each($scope.markers, function(index, marker) {
        limits.extend(marker.position);
      });
      $scope.map.fitBounds(limits);
      return $scope.model.business;
    };
    $scope.getCommunityName = function(idComm) {
      var communityName = "";
      angular.forEach($scope.communities, function(comm) {
        if (angular.equals(comm.id, idComm)) {
          communityName = comm.name;
        }
      });
      return communityName;
    };
    $scope.getCommunityUnique = function() {
      $scope.deleteMarkers(null);
      var id = this.community.id;
      if (_.contains($scope.selectedCommunity, id)) {
        $scope.selectedCommunity = _.without($scope.selectedCommunity, id);
      } else {
        $scope.selectedCommunity.push(id);
      }
      var tmpBiz = [];
      $scope.props = [];
      $scope.currentPage = 0;
      angular.forEach($scope.model.businesstmp, function(bizitem) {
        var marker_icon;
        if (bizitem.category === "Lodging and Travel") {
          marker_icon = "/static/images/Auto_location-01.png";
        } else if (bizitem.category === "Health and Medical") {
          marker_icon = "/static/images/Health_location-01.png";
        } else if (bizitem.category === "Beauty and Spas") {
          marker_icon = "/static/images/Beauty_location-01.png";
        } else if (bizitem.category === "Restaurants") {
          marker_icon = "/static/images/Food_location-01.png";
        } else {
          marker_icon = "/static/images/Services_location-01.png";
        }
        if (angular.equals(bizitem.community, id)) {
          tmpBiz.push(bizitem);
          var geo = bizitem.geo || undefined;
          var r = geo.slice(7, geo.length - 1).split(' ') || [];
          var dict_marker = {
            id: bizitem.id,
            title: bizitem.name,
            url: bizitem.slug + '/' + bizitem.code,
            code: bizitem.code,
            image: '/media/' + bizitem.image,
            type: bizitem.category,
            price: '$1,550,000',
            address: bizitem.address,
            view: bizitem.url,
            bedrooms: '3',
            bathrooms: '2',
            area: '3430 Sq Ft',
            position: {
              lat: parseFloat(r[1]),
              lng: parseFloat(r[0])
            },
            markerIcon: marker_icon
          };
          $scope.props.push(dict_marker);
        }
      });
      $scope.addMarkers($scope.props, $scope.map, false);
      var limits = new google.maps.LatLngBounds();
      $.each($scope.markers, function(index, marker) {
        limits.extend(marker.position);
      });
      $scope.map.fitBounds(limits);
      $scope.model.business = tmpBiz;
      return $scope.model.business;
    };
    $scope.getCommunity = function() {
      $scope.deleteMarkers(null);
      var id = this.community.id;
      if (_.contains($scope.selectedCommunity, id)) {
        $scope.selectedCommunity = _.without($scope.selectedCommunity, id);
      } else {
        $scope.selectedCommunity.push(id);
      }
      var tmpBiz = [];
      $scope.props = [];
      $scope.currentPage = 0;
      if ($scope.getcat != 0) {
        if ($scope.selectedCommunity.length > 0) {
          if ($scope.off) {
            angular.forEach($scope.selectedCommunity, function(id) {
              angular.forEach($scope.model.businesstmp, function(
                bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon =
                    "/static/images/Auto_location-01.png";
                } else if (bizitem.category ===
                  "Health and Medical") {
                  marker_icon =
                    "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon =
                    "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon =
                    "/static/images/Food_location-01.png";
                } else {
                  marker_icon =
                    "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, id)) {
                  if (angular.equals(bizitem.cat_id, $scope.getcat)) {
                    if (angular.equals(bizitem.ten_off, true)) {
                      tmpBiz.push(bizitem);
                      var geo = bizitem.geo || undefined;
                      var r = geo.slice(7, geo.length - 1).split(
                        ' ') || [];
                      var dict_marker = {
                        id: bizitem.id,
                        title: bizitem.name,
                        url: bizitem.slug + '/' + bizitem.code,
                        code: bizitem.code,
                        image: '/media/' + bizitem.image,
                        type: bizitem.category,
                        price: '$1,550,000',
                        address: bizitem.address,
                        view: bizitem.url,
                        bedrooms: '3',
                        bathrooms: '2',
                        area: '3430 Sq Ft',
                        position: {
                          lat: parseFloat(r[1]),
                          lng: parseFloat(r[0])
                        },
                        markerIcon: marker_icon
                      };
                      $scope.props.push(dict_marker);
                    }
                  }
                }
              });
            });
            $scope.model.business = tmpBiz;
          } else if ($scope.buys) {
            angular.forEach($scope.selectedCommunity, function(id) {
              angular.forEach($scope.model.businesstmp, function(
                bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon =
                    "/static/images/Auto_location-01.png";
                } else if (bizitem.category ===
                  "Health and Medical") {
                  marker_icon =
                    "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon =
                    "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon =
                    "/static/images/Food_location-01.png";
                } else {
                  marker_icon =
                    "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, id)) {
                  if (angular.equals(bizitem.cat_id, $scope.getcat)) {
                    if (angular.equals(bizitem.smart_buys, true)) {
                      tmpBiz.push(bizitem);
                      var geo = bizitem.geo || undefined;
                      var r = geo.slice(7, geo.length - 1).split(
                        ' ') || [];
                      var dict_marker = {
                        id: bizitem.id,
                        title: bizitem.name,
                        url: bizitem.slug + '/' + bizitem.code,
                        code: bizitem.code,
                        image: '/media/' + bizitem.image,
                        type: bizitem.category,
                        price: '$1,550,000',
                        address: bizitem.address,
                        view: bizitem.url,
                        bedrooms: '3',
                        bathrooms: '2',
                        area: '3430 Sq Ft',
                        position: {
                          lat: parseFloat(r[1]),
                          lng: parseFloat(r[0])
                        },
                        markerIcon: marker_icon
                      };
                      $scope.props.push(dict_marker);
                    }
                  }
                }
              });
            });
            $scope.model.business = tmpBiz;
          } else if ($scope.visits) {
            angular.forEach($scope.selectedCommunity, function(id) {
              angular.forEach($scope.model.businesstmp, function(
                bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon =
                    "/static/images/Auto_location-01.png";
                } else if (bizitem.category ===
                  "Health and Medical") {
                  marker_icon =
                    "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon =
                    "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon =
                    "/static/images/Food_location-01.png";
                } else {
                  marker_icon =
                    "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, id)) {
                  if (angular.equals(bizitem.cat_id, $scope.getcat)) {
                    if (angular.equals(bizitem.ten_visits, true)) {
                      tmpBiz.push(bizitem);
                      var geo = bizitem.geo || undefined;
                      var r = geo.slice(7, geo.length - 1).split(
                        ' ') || [];
                      var dict_marker = {
                        id: bizitem.id,
                        title: bizitem.name,
                        url: bizitem.slug + '/' + bizitem.code,
                        code: bizitem.code,
                        image: '/media/' + bizitem.image,
                        type: bizitem.category,
                        price: '$1,550,000',
                        address: bizitem.address,
                        view: bizitem.url,
                        bedrooms: '3',
                        bathrooms: '2',
                        area: '3430 Sq Ft',
                        position: {
                          lat: parseFloat(r[1]),
                          lng: parseFloat(r[0])
                        },
                        markerIcon: marker_icon
                      };
                      $scope.props.push(dict_marker);
                    }
                  }
                }
              });
            });
            $scope.model.business = tmpBiz;
          } else if ($scope.refer) {
            angular.forEach($scope.selectedCommunity, function(id) {
              angular.forEach($scope.model.businesstmp, function(
                bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon =
                    "/static/images/Auto_location-01.png";
                } else if (bizitem.category ===
                  "Health and Medical") {
                  marker_icon =
                    "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon =
                    "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon =
                    "/static/images/Food_location-01.png";
                } else {
                  marker_icon =
                    "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, id)) {
                  if (angular.equals(bizitem.cat_id, $scope.getcat)) {
                    if (angular.equals(bizitem.refer_friends,
                        true)) {
                      tmpBiz.push(bizitem);
                      var geo = bizitem.geo || undefined;
                      var r = geo.slice(7, geo.length - 1).split(
                        ' ') || [];
                      var dict_marker = {
                        id: bizitem.id,
                        title: bizitem.name,
                        url: bizitem.slug + '/' + bizitem.code,
                        code: bizitem.code,
                        image: '/media/' + bizitem.image,
                        type: bizitem.category,
                        price: '$1,550,000',
                        address: bizitem.address,
                        view: bizitem.url,
                        bedrooms: '3',
                        bathrooms: '2',
                        area: '3430 Sq Ft',
                        position: {
                          lat: parseFloat(r[1]),
                          lng: parseFloat(r[0])
                        },
                        markerIcon: marker_icon
                      };
                      $scope.props.push(dict_marker);
                    }
                  }
                }
              });
            });
            $scope.model.business = tmpBiz;
          } else {
            angular.forEach($scope.selectedCommunity, function(id) {
              angular.forEach($scope.model.businesstmp, function(
                bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon =
                    "/static/images/Auto_location-01.png";
                } else if (bizitem.category ===
                  "Health and Medical") {
                  marker_icon =
                    "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon =
                    "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon =
                    "/static/images/Food_location-01.png";
                } else {
                  marker_icon =
                    "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, id)) {
                  if (angular.equals(bizitem.cat_id, $scope.getcat)) {
                    tmpBiz.push(bizitem);
                    var geo = bizitem.geo || undefined;
                    var r = geo.slice(7, geo.length - 1).split(
                      ' ') || [];
                    var dict_marker = {
                      id: bizitem.id,
                      title: bizitem.name,
                      url: bizitem.slug + '/' + bizitem.code,
                      code: bizitem.code,
                      image: '/media/' + bizitem.image,
                      type: bizitem.category,
                      price: '$1,550,000',
                      address: bizitem.address,
                      view: bizitem.url,
                      bedrooms: '3',
                      bathrooms: '2',
                      area: '3430 Sq Ft',
                      position: {
                        lat: parseFloat(r[1]),
                        lng: parseFloat(r[0])
                      },
                      markerIcon: marker_icon
                    };
                    $scope.props.push(dict_marker);
                  }
                }
              });
            });
            $scope.model.business = tmpBiz;
          }
        } else {
          $scope.model.business = $scope.model.businesstmp;
        }
      } else {
        if ($scope.selectedCommunity.length > 0) {
          if ($scope.off) {
            angular.forEach($scope.selectedCommunity, function(id) {
              angular.forEach($scope.model.businesstmp, function(
                bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon =
                    "/static/images/Auto_location-01.png";
                } else if (bizitem.category ===
                  "Health and Medical") {
                  marker_icon =
                    "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon =
                    "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon =
                    "/static/images/Food_location-01.png";
                } else {
                  marker_icon =
                    "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, id)) {
                  if (angular.equals(bizitem.ten_off, true)) {
                    tmpBiz.push(bizitem);
                    var geo = bizitem.geo || undefined;
                    var r = geo.slice(7, geo.length - 1).split(
                      ' ') || [];
                    var dict_marker = {
                      id: bizitem.id,
                      title: bizitem.name,
                      url: bizitem.slug + '/' + bizitem.code,
                      code: bizitem.code,
                      image: '/media/' + bizitem.image,
                      type: bizitem.category,
                      price: '$1,550,000',
                      address: bizitem.address,
                      view: bizitem.url,
                      bedrooms: '3',
                      bathrooms: '2',
                      area: '3430 Sq Ft',
                      position: {
                        lat: parseFloat(r[1]),
                        lng: parseFloat(r[0])
                      },
                      markerIcon: marker_icon
                    };
                    $scope.props.push(dict_marker);
                  }
                }
              });
            });
            $scope.model.business = tmpBiz;
          } else if ($scope.buys) {
            angular.forEach($scope.selectedCommunity, function(id) {
              angular.forEach($scope.model.businesstmp, function(
                bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon =
                    "/static/images/Auto_location-01.png";
                } else if (bizitem.category ===
                  "Health and Medical") {
                  marker_icon =
                    "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon =
                    "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon =
                    "/static/images/Food_location-01.png";
                } else {
                  marker_icon =
                    "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, id)) {
                  if (angular.equals(bizitem.smart_buys, true)) {
                    tmpBiz.push(bizitem);
                    var geo = bizitem.geo || undefined;
                    var r = geo.slice(7, geo.length - 1).split(
                      ' ') || [];
                    var dict_marker = {
                      id: bizitem.id,
                      title: bizitem.name,
                      url: bizitem.slug + '/' + bizitem.code,
                      code: bizitem.code,
                      image: '/media/' + bizitem.image,
                      type: bizitem.category,
                      price: '$1,550,000',
                      address: bizitem.address,
                      view: bizitem.url,
                      bedrooms: '3',
                      bathrooms: '2',
                      area: '3430 Sq Ft',
                      position: {
                        lat: parseFloat(r[1]),
                        lng: parseFloat(r[0])
                      },
                      markerIcon: marker_icon
                    };
                    $scope.props.push(dict_marker);
                  }
                }
              });
            });
            $scope.model.business = tmpBiz;
          } else if ($scope.visits) {
            angular.forEach($scope.selectedCommunity, function(id) {
              angular.forEach($scope.model.businesstmp, function(
                bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon =
                    "/static/images/Auto_location-01.png";
                } else if (bizitem.category ===
                  "Health and Medical") {
                  marker_icon =
                    "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon =
                    "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon =
                    "/static/images/Food_location-01.png";
                } else {
                  marker_icon =
                    "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, $scope.selectedCommunity)) {
                  if (angular.equals(bizitem.ten_visits, true)) {
                    tmpBiz.push(bizitem);
                    var geo = bizitem.geo || undefined;
                    var r = geo.slice(7, geo.length - 1).split(
                      ' ') || [];
                    var dict_marker = {
                      id: bizitem.id,
                      title: bizitem.name,
                      url: bizitem.slug + '/' + bizitem.code,
                      code: bizitem.code,
                      image: '/media/' + bizitem.image,
                      type: bizitem.category,
                      price: '$1,550,000',
                      address: bizitem.address,
                      view: bizitem.url,
                      bedrooms: '3',
                      bathrooms: '2',
                      area: '3430 Sq Ft',
                      position: {
                        lat: parseFloat(r[1]),
                        lng: parseFloat(r[0])
                      },
                      markerIcon: marker_icon
                    };
                    $scope.props.push(dict_marker);
                  }
                }
              });
            });
            $scope.model.business = tmpBiz;
          } else if ($scope.refer) {
            angular.forEach($scope.selectedCommunity, function(id) {
              angular.forEach($scope.model.businesstmp, function(
                bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon =
                    "/static/images/Auto_location-01.png";
                } else if (bizitem.category ===
                  "Health and Medical") {
                  marker_icon =
                    "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon =
                    "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon =
                    "/static/images/Food_location-01.png";
                } else {
                  marker_icon =
                    "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, id)) {
                  if (angular.equals(bizitem.refer_friends, true)) {
                    tmpBiz.push(bizitem);
                    var geo = bizitem.geo || undefined;
                    var r = geo.slice(7, geo.length - 1).split(
                      ' ') || [];
                    var dict_marker = {
                      id: bizitem.id,
                      title: bizitem.name,
                      url: bizitem.slug + '/' + bizitem.code,
                      code: bizitem.code,
                      image: '/media/' + bizitem.image,
                      type: bizitem.category,
                      price: '$1,550,000',
                      address: bizitem.address,
                      view: bizitem.url,
                      bedrooms: '3',
                      bathrooms: '2',
                      area: '3430 Sq Ft',
                      position: {
                        lat: parseFloat(r[1]),
                        lng: parseFloat(r[0])
                      },
                      markerIcon: marker_icon
                    };
                    $scope.props.push(dict_marker);
                  }
                }
              });
            });
            $scope.model.business = tmpBiz;
          } else {
            angular.forEach($scope.selectedCommunity, function(id) {
              angular.forEach($scope.model.businesstmp, function(
                bizitem) {
                var marker_icon;
                if (bizitem.category === "Lodging and Travel") {
                  marker_icon =
                    "/static/images/Auto_location-01.png";
                } else if (bizitem.category ===
                  "Health and Medical") {
                  marker_icon =
                    "/static/images/Health_location-01.png";
                } else if (bizitem.category === "Beauty and Spas") {
                  marker_icon =
                    "/static/images/Beauty_location-01.png";
                } else if (bizitem.category === "Restaurants") {
                  marker_icon =
                    "/static/images/Food_location-01.png";
                } else {
                  marker_icon =
                    "/static/images/Services_location-01.png";
                }
                if (angular.equals(bizitem.community, id)) {
                  tmpBiz.push(bizitem);
                  var geo = bizitem.geo || undefined;
                  var r = geo.slice(7, geo.length - 1).split(' ') || [];
                  var dict_marker = {
                    id: bizitem.id,
                    title: bizitem.name,
                    url: bizitem.slug + '/' + bizitem.code,
                    code: bizitem.code,
                    image: '/media/' + bizitem.image,
                    type: bizitem.category,
                    price: '$1,550,000',
                    address: bizitem.address,
                    view: bizitem.url,
                    bedrooms: '3',
                    bathrooms: '2',
                    area: '3430 Sq Ft',
                    position: {
                      lat: parseFloat(r[1]),
                      lng: parseFloat(r[0])
                    },
                    markerIcon: marker_icon
                  };
                  $scope.props.push(dict_marker);
                }
              });
            });
            $scope.model.business = tmpBiz;
          }
        } else {
          $scope.model.business = $scope.model.businesstmp;
        }
      }
      $scope.addMarkers($scope.props, $scope.map, $scope.GeoMarker);
      var limits = new google.maps.LatLngBounds();
      $.each($scope.markers, function(index, marker) {
        limits.extend(marker.position);
      });
      $scope.map.fitBounds(limits);
      return $scope.model.business;
    };

    // Función para la búequeda de deals por nombre
    // TODO: Implementar filtro por comunidad o por categoría
    $scope.searchtext = function(val) {
      $scope.deleteMarkers(null);
      var tmpBiz = [];
      $scope.props = [];
      angular.forEach($scope.model.businesstmp, function(bizitem) {
        searchText = val.toLowerCase();
        var marker_icon;
        if (bizitem.category === "Lodging and Travel") {
          marker_icon = "/static/images/Auto_location-01.png";
        } else if (bizitem.category === "Health and Medical") {
          marker_icon = "/static/images/Health_location-01.png";
        } else if (bizitem.category === "Beauty and Spas") {
          marker_icon = "/static/images/Beauty_location-01.png";
        } else if (bizitem.category === "Restaurants") {
          marker_icon = "/static/images/Food_location-01.png";
        } else {
          marker_icon = "/static/images/Services_location-01.png";
        }
        if (bizitem.name.toString().toLowerCase().search(searchText) >=
          0) {
          tmpBiz.push(bizitem);
          var geo = bizitem.geo || undefined;
          var r = geo.slice(7, geo.length - 1).split(' ') || [];
          var dict_marker = {
            id: bizitem.id,
            title: bizitem.name,
            url: bizitem.slug + '/' + bizitem.code,
            code: bizitem.code,
            image: '/media/' + bizitem.image,
            type: bizitem.category,
            price: '$1,550,000',
            address: bizitem.address,
            view: bizitem.url,
            bedrooms: '3',
            bathrooms: '2',
            area: '3430 Sq Ft',
            position: {
              lat: parseFloat(r[1]),
              lng: parseFloat(r[0])
            },
            markerIcon: marker_icon
          };
          $scope.props.push(dict_marker);
        }
      });
      $scope.addMarkers($scope.props, $scope.map, false);
      var limits = new google.maps.LatLngBounds();
      $.each($scope.markers, function(index, marker) {
        limits.extend(marker.position);
      });
      $scope.map.fitBounds(limits);
      $scope.model.business = tmpBiz;
      return $scope.model.business;
    };
    $scope.matchsearch = function(query) {
      if ($scope.selectedCommunity.length > 0) {
        if ($scope.getcat != 0) {
          var tmpBiz = [];
          var keep = true;
          angular.forEach($scope.selectedCommunity, function(id) {
            angular.forEach($scope.model.businesstmp, function(
              bizitem) {
              if (angular.equals(bizitem.category, $scope.getcat)) {
                if (angular.equals(bizitem.community, id)) {
                  if (bizitem.name.toString().toLowerCase().search(
                      query.toLowerCase()) >= 0) {
                    tmpBiz.push(bizitem);
                  }
                }
              }
            });
          });
          $scope.model.business = tmpBiz;
        } else {
          var tmpBiz = [];
          var keep = true;
          angular.forEach($scope.selectedCommunity, function(id) {

            angular.forEach($scope.model.businesstmp, function(
              bizitem) {
              if (angular.equals(bizitem.community, id)) {
                if (bizitem.name.toString().toLowerCase().search(
                    query.toLowerCase()) >= 0) {
                  tmpBiz.push(bizitem);
                }
              }
            });
          });
          $scope.model.business = tmpBiz;
        }
      } else {
        if ($scope.getcat != 0) {
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            if (angular.equals(bizitem.category, $scope.getcat)) {
              if (bizitem.name.toString().toLowerCase().search(query.toLowerCase()) >=
                0) {
                tmpBiz.push(bizitem);
              }
            }
          });
          $scope.model.business = tmpBiz;
        } else {
          var tmpBiz = [];
          var keep = true;
          angular.forEach($scope.model.businesstmp, function(bizitem) {
            if (bizitem.name.toString().toLowerCase().search(query.toLowerCase()) >=
              0) {
              tmpBiz.push(bizitem);
            }
          });
          $scope.model.business = tmpBiz;
        }
      }
      return $scope.model.business;
    }
  }
]);

myApp.controller('bizonectrl', ['$scope', '$rootScope', '$routeParams',
  '$location', '$http', 'businessOneScope', 'search', '$sce', 'catmenu',
  '$anchorScroll', 'login', 'register',
  function($scope, $rootScope, $routeParams, $location, $http,
    businessOneScope, search, $sce, catmenu, $anchorScroll, login, register) {
    $scope.bizName = $routeParams.bizName;
    $scope.bizCode = $routeParams.bizCode;
    $scope.bizInfo;
    $scope.events;
    $scope.catmenu = true;
    $rootScope.cat = true;
    $rootScope.panel = true;
    $rootScope.community_name;
    $rootScope.zip;
    $rootScope.partners;
    $rootScope.discover;
    $scope.actionconfirm = false;
    $scope.there_is_user = false;
    $scope.navigation = {
      info: 'info',
      deals: 'deals',
      share: 'share',
      services: 'services',
      video: 'video',
      allevents: 'events',
      directions: 'directions',
      allqraccess: 'all-qr-access'
    }
    $scope.getItem = function() {
      businessOneScope.getAllItem($scope.bizCode).then(function(data) {
        $scope.bizInfo = data;
        $rootScope.community_name = data.community_name;
        $rootScope.zip = data.zip;
        $rootScope.partners = data.partners;
        $rootScope.discover = data.discover;
        $scope.video = $sce.trustAsResourceUrl(
          'http://www.youtube.com/embed/' + data.video +
          '?wmode=transparent');
        $scope.menu = $sce.trustAsHtml(data.menu);
        //$scope.there_is_user = data.user;
        $rootScope.user = data.user;
        $scope.rendermenu = function(menu) {
          $("#menulistfake").html(menu);
          $(".panelcommunity").show();
          $(".scrollmenu").html(menu);
          $(".scrollmenu").find("h4").hide();
          var listmenu = $("#menulistfake").find("h4");
          var ulmenu = $("#menulistfake").find("h4").next("ul").hide();
          for (var i = 0; i < listmenu.length; i++) {
            var ddmenu = "<a class='col-lg-4 ddmenu'></a>";
            $(listmenu[i]).append(
              "<i class='fa fa-caret-down'></i>").addClass(
              "menucat");
            $(ddmenu).append($(listmenu[i])).append($(ulmenu[i])).appendTo(
              "#menulist");
          };
          $("a.ddmenu").click(function(e) {
            e.preventDefault();
            var showmenu = $(this).find("ul").css("display");
            if (showmenu === "none") {
              $(this).find("ul").addClass("ddown");
            } else {
              $(this).find("ul").removeClass("ddown");
            }
          });
        };
        $scope.rendermenu(data.menu);
        var calendars = {};
        var eventArray = [];
        $scope.events = data.events;
        angular.forEach($scope.events, function(event) {
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
          daysOfTheWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU',
            'FRI', 'SAT'
          ],
          clickEvents: {
            click: function(target) {
              if (target.events.length > 0) {
                var el = target.element.children[0];
                $(el).popover({
                  html: true,
                  placement: 'auto',
                  delay: {
                    "show": 500,
                    "hide": 100
                  },
                  content: function() {
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
            $('.clndr-previous-button').html(
              '<span class="fa fa-angle-left"></span>');
            $('.clndr-next-button').html(
              '<span class="fa fa-angle-right"></span>');
            $('.clndr-table tr .day.event .day-contents').append(
              '<span class="fa fa-circle"></span>');
          }
        });
      }, function(errorMessage) {
        $scope.error = errorMessage;
      });
    };
    $scope.getItem();
    $scope.alert = {};
    $scope.type_deals = {
      smart_buys: 'S',
      ten_off: 'T',
      ten_visits: 'V',
      refer_friends: 'R'
    }
    $scope.requestactions = function() {
      if ($scope.bizInfo.user === true) {
        if ($scope.bizInfo.smart_buys === true) {
          sweetAlert("Oops...", "This Business is already participating in this promo, Thanks!! :).", "error");
        } else {
          $http({
              method: 'POST',
              url: '/communities/save-feedback/angular/',
              data: $.param({
                biz: $scope.bizInfo.code,
                deal: $scope.type_deals.smart_buys
              }),
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            })
            .success(function(data) {
              sweetAlert("Good job!", data.message, "success");
            });
        }
      } else {
        $('#loginusersmart').modal({
          keyboard: true
        });
      }
    };
    $scope.saveactions = function() {
      if ($scope.bizInfo.user === true) {
          if($scope.bizInfo.smart_buys === false){
            sweetAlert("Oops...", "This Business is not participating in this promo, Thanks!! :).", "error");
          }else{
            $http({
                method: 'POST',
                url: '/communities/save-promo/',
                data: $.param({
                  id: $scope.bizInfo.coupon.id
                }),
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              })
              .success(function(data) {
                $scope.promo.image = data.image;
                $scope.promo.voucher = data.voucher;
                $scope.promo.message = data.message;
                $scope.promo.show = true
              });
          }
      } else {
        $('#loginusersmart').modal({
          keyboard: true
        });
      }
    };
    $scope.shareactions = function(){
        sweetAlert("Oops...", "This functionality is not active, Thanks!! :).", "error");
    };
    $scope.redeemactions = function() {
      if ($scope.bizInfo.user === true) {
          if($scope.bizInfo.smart_buys === false){
            sweetAlert("Oops...", "This Business is not participating in this promo, Thanks!! :).", "error");
          }else{
            $http({
                method: 'POST',
                url: '/communities/get-promo/',
                data: $.param({
                  cpid: $scope.bizInfo.coupon.id
                }),
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              })
              .success(function(data) {
                $scope.promo.image = data.image;
                $scope.promo.voucher = data.voucher;
                $scope.promo.message = data.message;
                $scope.promo.show = true
              });
          }
      } else {
        $('#loginusersmart').modal({
          keyboard: true
        });
      }
    };
    $scope.formLogin = {};
    $scope.formsign = {};
    $scope.formforgot = {};
    $scope.formreset = {};
    $scope.promo = {};
    $scope.login = function() {
      $http({
          method: 'POST',
          url: '/user/login/ajax',
          data: $.param($scope.formLogin),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        .success(function(data) {
          if (data.confirm) {
            sweetAlert("Good job!", data.msg, "success");
            $scope.actionconfirm = true;
            $rootScope.user = true;
            setTimeout(function() {
              $scope.actionconfirm = false;
              $('#loginusersmart').modal('hide');
            }, 10000);
            $http({
                method: 'POST',
                url: '/communities/get-promo/',
                data: $.param({
                  cpid: $scope.bizInfo.coupon.id
                }),
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              })
              .success(function(data) {
                $scope.promo.image = data.image;
                $scope.promo.voucher = data.voucher;
                $scope.promo.message = data.message;
                $scope.promo.show = true
              });
          } else {
            sweetAlert("Oops...", data.msg, "error");
          }
        });
    };
    $scope.createaccount = function() {
      $("#loginusersmart").modal("hide");
      $("#signsmart").modal({
        keyboard: true
      });
    };
    $scope.toLeft = function() {
      $('.navbtn').stop().animate({
        'scrollLeft': '400%'
      }, 900, 'swing');
    };
    $scope.toRight = function() {
      $('.navbtn').stop().animate({
        'scrollLeft': '0'
      }, 900, 'swing');
    };
    $scope.goToPanel = function(idElement) {
      $('#content').stop().animate({
        'scrollTop': $(idElement).offset().top
      }, 900, 'swing');
      console.log($(idElement).offset().top);
    };
    $scope.signup = function() {
      $http({
          method: 'POST',
          url: '/communities/fake-login/',
          data: $.param($scope.formsign),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        .success(function(data) {
          if (data.confirm) {
            $scope.message = data.message;
            $scope.actionconfirm = true;
            setTimeout(function() {
              $scope.actionconfirm = false;
              $('#signsmart').modal('hide');
              $('#loginusersmart').modal('show');
              $scope.actionconfirm = true;
            }, 10000);
          } else {
            $scope.message = data.message;
          }
        });
    };
    $scope.forgot = function() {
      $("#loginusersmart").modal("hide");
      $("#forgotsmart").modal({
        keyboard: true
      });
    };
    $scope.newpass = function() {
      $http({
          method: 'POST',
          url: '/communities/reset-password/',
          data: $.param($scope.formforgot),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        .success(function(data) {
          if (data.state) {
            $scope.message = data.message;
            $scope.actionconfirm = true;
            setTimeout(function() {
              $scope.actionconfirm = false;
              $('#forgotsmart').modal('hide');
              $('#passwordsmart').modal('show');
              $scope.actionconfirm = true;
            }, 10000);
          } else {
            $scope.message = data.message;
          }
        });
    };
    $scope.reset = function() {
      $http({
          method: 'POST',
          url: '/communities/register/confirm/ajax/04718802',
          data: $.param($scope.formforgot),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        .success(function(data) {
          if (data.state) {
            $scope.message = data.message;
            $scope.actionconfirm = true;
            setTimeout(function() {
              $scope.actionconfirm = false;
              $('#passwordsmart').modal('hide');
              $scope.actionconfirm = true;
            }, 10000);
            $http({
                method: 'POST',
                url: '/communities/get-promo/',
                data: $.param({
                  cpid: $scope.bizInfo.coupon.id
                }),
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              })
              .success(function(data) {
                $scope.promo.image = data.image;
                $scope.promo.voucher = data.voucher;
                $scope.promo.message = data.message;
                $scope.promo.show = true
              });
          } else {
            $scope.message = data.message;
          }
        });
    }
    $scope.redeem = function() {
      $http({
          method: 'POST',
          url: '/communities/redeem-promo/',
          data: $.param({
            voucher: $scope.promo.voucher
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        .success(function(data) {
          $scope.promo.redeemed = data.image;
          $scope.promo.message = data.message;
          $scope.promo.redeem = true;
          $scope.promo.show = false;
          $scope.promo.today = moment().format('LL');
        });
    };
    $scope.directions = function(newdirection) {
      $scope.options = {
        zoom: 14,
        mapTypeId: 'Styled',
        disableDefaultUI: true,
        mapTypeControlOptions: {
          mapTypeIds: ['Styled']
        }
      };
      $scope.styles = [{
        stylers: [{
          hue: "#cccccc"
        }, {
          saturation: -100
        }]
      }, {
        featureType: "road",
        elementType: "geometry",
        stylers: [{
          lightness: 100
        }, {
          visibility: "simplified"
        }]
      }, {
        featureType: "road",
        elementType: "labels",
        stylers: [{
          visibility: "on"
        }]
      }, {
        featureType: "poi",
        stylers: [{
          visibility: "off"
        }]
      }];
      var styledMapType = new google.maps.StyledMapType($scope.styles, {
        name: 'Styled'
      });
      $scope.map = new google.maps.Map(document.getElementById('mapView'),
        $scope.options);
      $scope.map.mapTypes.set('Styled', styledMapType);
      $scope.map.setZoom(14);
      var geo = $scope.bizInfo.geo || undefined;
      var r = geo.slice(7, geo.length - 1).split(' ') || [];
      var directionsDisplay;
      var directionsService = new google.maps.DirectionsService();
      var latlng = new google.maps.LatLng(parseFloat(r[1]), parseFloat(r[
        0]));

      function initialize(map) {
        directionsDisplay = new google.maps.DirectionsRenderer();
        directionsDisplay.setMap(map);
        directionsDisplay.setPanel(document.getElementById(
          'directionsPanel'));
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
        directionsService.route(request, function(response, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            $('#directionsPanel').empty();
            directionsDisplay.setDirections(response);
            var newHeightFooterH = $(document).height();
          } else {
            // alert an error message when the route could nog be calculated.
            if (status == 'ZERO_RESULTS') {
              console.log(
                'No route could be found between the origin and destination.'
              );
            } else if (status == 'UNKNOWN_ERROR') {
              console.log(
                'A directions request could not be processed due to a server error. The request may succeed if you try again.'
              );
            } else if (status == 'REQUEST_DENIED') {
              console.log(
                'This webpage is not allowed to use the directions service.'
              );
            } else if (status == 'OVER_QUERY_LIMIT') {
              console.log(
                'The webpage has gone over the requests limit in too short a period of time.'
              );
            } else if (status == 'NOT_FOUND') {
              console.log(
                'At least one of the origin, destination, or waypoints could not be geocoded.'
              );
            } else if (status == 'INVALID_REQUEST') {
              console.log('The DirectionsRequest provided was invalid.');
            } else {
              console.log(
                "There was an unknown error in your request. Requeststatus: nn" +
                status);
            }
          }
        });
      };
      initialize($scope.map);
      calcRoute();
    }
  }
]);

myApp.controller('commonectrl', ['$scope', '$rootScope', '$routeParams',
  '$location', '$http', 'communityOneScope', 'search', '$sce', 'catmenu',
  '$anchorScroll', 'login', 'register',
  function($scope, $rootScope, $routeParams, $location, $http,
    communityOneScope, search, $sce, catmenu, $anchorScroll, login, register) {
    $scope.commurl = $routeParams.commUrl;
    $scope.communities;
    $scope.community;
    $scope.model = {};
    $scope.selectedCommunity = [];
    $scope.currentPage = 0;
    $scope.pageSize = 6;
    $scope.options = {
      zoom: 14,
      mapTypeId: 'Styled',
      disableDefaultUI: true,
      mapTypeControlOptions: {
        mapTypeIds: ['Styled']
      }
    };
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
    var infoWindow;
    $scope.styles = [{
      stylers: [{
        hue: "#cccccc"
      }, {
        saturation: -100
      }]
    }, {
      featureType: "road",
      elementType: "geometry",
      stylers: [{
        lightness: 100
      }, {
        visibility: "simplified"
      }]
    }, {
      featureType: "road",
      elementType: "labels",
      stylers: [{
        visibility: "on"
      }]
    }, {
      featureType: "poi",
      stylers: [{
        visibility: "off"
      }]
    }];
    var styledMapType = new google.maps.StyledMapType($scope.styles, {
      name: 'Styled'
    });
    $scope.map = new google.maps.Map(document.getElementById('mapView'),
      $scope.options);
    $scope.map.mapTypes.set('Styled', styledMapType);
    $scope.map.setZoom(14);
    $scope.newMarker = null;
    $scope.selectedCommunity = [];
    $scope.markers = [];
    $scope.props = [];
    $scope.addPolygones = function(community, map){;
        var bounds = new google.maps.LatLngBounds();
        var latlng;
        if (!$.isPlainObject(community.border)) {
            community.border = $.parseJSON(community.border);
        }
        var commCoords = [];
        var coords = community.border.coordinates;
        for (var n = 0; n < coords[0][0].length; n++) {
            latlng = new google.maps.LatLng(coords[0][0][n][1], coords[0][0][n][0]);
            commCoords.push(latlng);
            bounds.extend(latlng);
        };
        map.fitBounds(bounds);
        var infoboxContentPol = '<div>' +
          '<div>' +
          '<div>' + community.label + '</div>' +
          '</div>' +
          '</div>';

        var polygon = new google.maps.Polygon({
            paths: commCoords,
            strokeColor: "#ec5b24",
            strokeOpacity: 1,
            strokeWeight: 3,
            fillColor: "#f48031",
            fillOpacity: 0.1,
            community: {id: community.id, label: community.label}
        });

        google.maps.event.addListener(polygon, 'mouseover', function(event){
            infoWindow.setContent(community.label);
            infoWindow.setPosition(bounds.getCenter());
            infoWindow.open(map);
        });
        google.maps.event.addListener(polygon, 'mouseout', function () {
            this.setOptions({
                fillColor: "#f48031",
                fillOpacity: 0.1
            });
            infoWindow.close();
        });
        google.maps.event.addListener(polygon, 'click', function(){
            window.location.href = "#/c/" + community.url;
            map.setCenter(bounds.getCenter());
            map.setZoom(14);
        })
        polygon.setMap(map);
    };
    // Añadir marcadores al mapa
    $scope.addMarkers = function(props, map, global) {
      $.each(props, function(i, prop) {
        var latlng = new google.maps.LatLng(prop.position.lat, prop.position
          .lng);
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
          animation: google.maps.Animation.DROP
        });
        var infoboxContent = '<div class="infoW">' +
          '<div class="propImg">' +
          '<img src="' + prop.image + '">' +
          '<div class="propBg">' +
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
          '<div class="clearfix"></div>' +
          '<div class="infoButtons">' +
          '<a class="btn btn-sm btn-round btn-gray btn-o closeInfo">Close</a>' +
          '<a href="#/' + prop.url +
          '" class="btn btn-sm btn-round btn-green viewInfo" target="_self">View</a>' +
          '</div>' +
          '</div>';

        google.maps.event.addListener(marker, 'click', (function(
          marker, i) {
          return function() {
            infobox.setContent(infoboxContent);
            infobox.open(map, marker);
          }
        })(marker, i));


        $(document).on('click', '.closeInfo', function() {
          infobox.open(null, null);
        });

        $scope.markers.push(marker);
      });
    };
    communityOneScope.getAllItem($scope.commurl).then(function(data){
        console.log(data);
        $scope.communities = data.communities;
        $scope.community = data.community;
        $scope.model.business = data.businesses;
        $scope.model.businesstmp = data.businesses;
        angular.forEach($scope.model.businesstmp, function(bizmarker) {
          var marker_icon;
          if (bizmarker.category === "Lodging and Travel") {
            marker_icon = "/static/images/Auto_location-01.png";
          } else if (bizmarker.category === "Health and Medical") {
            marker_icon = "/static/images/Health_location-01.png";
          } else if (bizmarker.category === "Beauty and Spas") {
            marker_icon = "/static/images/Beauty_location-01.png";
          } else if (bizmarker.category === "Restaurants") {
            marker_icon = "/static/images/Food_location-01.png";
          } else {
            marker_icon =
              "/static/images/Services_location-01.png";
          }
          var geo = bizmarker.geo || undefined;
          var r = geo.slice(7, geo.length - 1).split(' ') || [];
          var dict_marker = {
            id: bizmarker.id,
            title: bizmarker.name,
            url: 'b/' + bizmarker.slug + '/' + bizmarker.code,
            code: bizmarker.code,
            image: '/media/' + bizmarker.image,
            type: bizmarker.category,
            view: bizmarker.url,
            address: bizmarker.address,
            position: {
              lat: parseFloat(r[1]),
              lng: parseFloat(r[0])
            },
            markerIcon: marker_icon
          };
          $scope.props.push(dict_marker);
        });

        $scope.numberOfPages = function() {
          return Math.ceil($scope.model.business.length / $scope.pageSize);
        };

        $scope.addMarkers($scope.props, $scope.map, true);
        $scope.addPolygones($scope.community, $scope.map);
        //$scope.markerCluster = new MarkerClusterer($scope.map, $scope.markers);
        //angular.forEach($scope.communities, function(community){
        //    infoWindow = new google.maps.InfoWindow();
        //
        //});
        $scope.map.setZoom(14);
    }, function(errorMessage){
       console.log(errorMessage);
    });
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

myApp.filter('searchtext', function() {
  return function(items, letter) {
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

myApp.factory('catmenu', function() {
  return {
    flag: false
  };
});

myApp.factory('search', function() {
  return {
    text: ''
  };
});

myApp.factory('businessOneScope', function($http, $q) {
  return {
    apiPath: '/communities/business-one/',
    getAllItem: function(code) {
      var deferred = $q.defer();
      $http.get(this.apiPath, {
        params: {
          biz_code: code
        }
      }).success(function(data) {
        deferred.resolve(data);
      }).error(function() {
        deferred.reject("An error occured while fetching items");
      });
      return deferred.promise;
    }
  }
});

myApp.factory('communityOneScope', function($http, $q) {
  return {
    apiPath: '/communities/c/businesses/',
    getAllItem: function(url_name) {
      var deferred = $q.defer();
      $http.get(this.apiPath, {
        params: {
          url: url_name
        }
      }).success(function(data) {
        deferred.resolve(data);
      }).error(function() {
        deferred.reject("An error occured while fetching items");
      });
      return deferred.promise;
    }
  }
});

myApp.factory('login', function($http, $q) {
  return {
    apiPath: '/user/login/ajax',
    signIn: function(metadata) {
      var deferred = $q.defer();
      $http.get(this.apiPath, {
        params: metadata
      }).success(function(data) {
        deferred.resolve(data);
      }).error(function() {
        deferred.reject("An error occured!");
      });
      return deferred.promise;
    }
  }
});
myApp.factory('register', function($http, $q) {
  return {
    apiPath: '/communities/fake-login/',
    signUp: function(metadata) {
      var deferred = $q.defer();
      $http.get(this.apiPath, {
        params: metadata
      }).success(function(data) {
        deferred.resolve(data);
      }).error(function() {
        deferred.reject("An error occured!");
      });
      return deferred.promise;
    }
  }
});

myApp.factory('businessScope', function($http, $q) {
  return {
    apiPath: '/communities/businesses/',
    getAllItems: function() {
      //Creating a deferred object
      var deferred = $q.defer();

      //Calling Web API to fetch shopping cart items
      $http.get(this.apiPath).success(function(data) {
        //Passing data to deferred's resolve function on successful completion
        deferred.resolve(data);
      }).error(function() {

        //Sending a friendly error message in case of failure
        deferred.reject("An error occured while fetching items");
      });

      //Returning the promise object
      return deferred.promise;
    }
  }
});

myApp.factory('Biz', function($http) {
  var Biz = function() {
    this.items;
    this.busy = false;
    this.start = 0;
    this.limit = 8;
  };
  Biz.prototype.loadMore = function() {
    if (this.busy) return;
    this.busy = true;
    $http.get('/communities/businesses/' + this.start + '/' + this.limit)
      .success(function(data) {
        this.items = data;
        if (this.start === 0) {
          this.start = 8;
          this.limit = this.start + this.start;
        } else {
          this.start = this.limit;
          this.limit = this.start + this.start;
        }
        this.busy = false;
      }.bind(this));
  };
  return Biz;
});

myApp.directive('selectpicker', function() {
  return {
    restrict: 'E',
    scope: {
      array: '=',
      model: '=',
      class: '='
    },
    template: '<select class="selectpicker" id="app-community" name="app-community" ng-model="model" ng-options="o as o.label for o in array" ng-change="getCommunity()"></select>',
    replace: true,
    link: function(scope, element, attrs) {
      $(element).selectpicker();
    }
  }
});
