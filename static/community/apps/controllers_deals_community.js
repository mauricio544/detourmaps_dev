/**
 * Created by root on 18/03/14.
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
    $scope.selectedCommunity = [];
    $scope.currentPage = 0;
    $scope.pageSize = 8;
    $scope.query = {}
    $scope.queryBy = '$'
    $scope.text = "";
    $scope.getcat = 0;
    $scope.visits = false;
    $scope.refer = false;
    $scope.buys = false;
    $scope.off = false;
    $scope.getItems = function(){
        businessScope.getAllItems().then(function(data){
            $scope.business = data.businesses;
            $scope.communities = data.communities;
            $scope.categories = data.categories;
            $scope.businesstmp = data.businesses;
            $scope.bizrandom = data.business
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
    $scope.searchtext = function(val){
        var tmpBiz = [];
        angular.forEach($scope.businesstmp, function(bizitem) {
            searchText = val.toLowerCase();
            angular.forEach($scope.businesstmp, function(bizitem) {
                if( bizitem.name.toLowerCase().indexOf(searchText) >= 0 || bizitem.community_name.toLowerCase().indexOf(searchText) >= 0) tmpBiz.push(bizitem);
            });
            var letters = bizitem.name.split('');
            _.each(letters, function(letter) {
                if (letter === searchText) { // matches single letter, e.g. 'E'
                    console.log('pushing');
                    tmpBiz.push(bizitem);
                }
            });
            // code to match letter fragments, e.g. 'lan'
        });
        $scope.business = tmpBiz;
        return $scope.business;
    };
    $scope.matchsearch = function(query){
        var tmpBiz = [];
        angular.forEach($scope.businesstmp, function(bizitem){
            if(bizitem.name.toString().indexOf(query.toLowerCase()) !== -1){
                tmpBiz.push(bizitem);
            }
        });
        $scope.business = tmpBiz;
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
        apiPath: '/communities/alldeals/?name=' + community_name,
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