angular.module('starter.offeredservices').controller('OfferedServicesCtrl',['$scope','$ionicPopup','$ionicListDelegate','$ionicLoading','$timeout', 'OfferedServicesService','I18nService','$stateParams','_','$location','$filter','$timeout','$q','$rootScope','$cordovaSocialSharing',function($scope, $ionicPopup, $ionicListDelegate, $ionicLoading, $timeout, OfferedServicesService, I18nService, $stateParams, _, $location, $filter, $timeout, $q, $rootScope, $cordovaSocialSharing) {

                var LOADING_TMPLT= '<i class="ion-loading-c"></i> ';
                $scope.fullEvents = false;
                $scope.offeredServiceList = [];
                $scope.waitForRefreshDelay = false;

                var changeEvents = {};

                $scope.pullText = '';

                $scope.$on('$ionicView.enter', function() {
                    //Load the new items

                    //In case we got updated the array of items provided by the service is another one. We must update it
                    if ($scope.offeredServicesViewInitialized && $location.$$url === '/app/offeredservices' && !$scope.waitForRefreshDelay) {
                        $scope.refreshItems();
                    }

                });

                $scope.$on('$stateChangeStart', function() {
                    $scope.$parent.extraButtons = null;
                });

                $scope.initList = function () {
                    var initialized = $q.defer();
                    $scope.initializeBundles().then (function () {
                        $ionicLoading.show({template: LOADING_TMPLT +  $scope.rb.ctrl_offeredService_initializing + "..."});

                        $q.all ([OfferedServicesService.getOfferedServiceItems()]).then(function (results){

                            $scope.offeredServiceList = results[0]; 

                            initialized.resolve();
                            $scope.offeredServicesViewInitialized = true;

                            //In case we got updated the array of items provided by the service is another one. We must update it
                            if ($location.$$url === '/app/offeredservices' && !$scope.waitForRefreshDelay){
                                $scope.refreshItems();
                            }

                        }).catch (function (error){
                            initialized.reject (); //Not necessary to show an specific code
                        }).finally (function (){
                            $ionicLoading.hide();  
                        });
                    });

                    return initialized.promise;
                };

                $scope.trustGmaps = function (url){
                    return $sce.trustAsUrl(url);
                }
    
                $scope.initOfferedService = function () {
                    $q.all([$scope.initializeBundles(),$scope.initList()]).then (function (){
                        $scope.currentOfferedService = _.findWhere($scope.offeredServiceList,{_id: $stateParams.offeredServiceId});
                    });

                };
    
                $scope.existImage = function(offeredService){
                   return offeredService.image !== null && 
                          offeredService.image !== undefined &&
                          offeredService.image.length > 0;
                };
 
                $scope.refreshItems = function () {

                    if ($rootScope.routeToServicesNotAvailable){
                        $scope.$broadcast('scroll.refreshComplete'); 
                    } else {
                        $q.all ([OfferedServicesService.retrieveNewItems()]).then(function (results){
                            $scope.offeredServiceList = results[0]; 

                            $scope.waitForRefreshDelay = true;
                            //Don't allow to automatic refresh until 20 minutes 
                            $timeout (function (){
                                $scope.waitForRefreshDelay = false;   
                            },20 * 60 * 1000);

                        }).catch (function (error){
                            //The error code is the same so just needed one check
                            if (error !== OfferedServicesService.errorCodes.ALREADY_RETRIEVING){
                                //$scope.showRefreshListError();
                                $rootScope.routeToServicesNotAvailable = true;
                            }
                        }).finally(function (){
                            $scope.$broadcast('scroll.refreshComplete'); 
                        });
                    }
                }; 


                $scope.openExternalURL = function(url) {
                    //navigator.app.loadUrl(url, { openExternal: true });
                    window.open(url, '_system');
                };

                $scope.shareExternalURL = function(url) {
                    $cordovaSocialSharing
                        .share($scope.rb.os_share_message + ' ' + url , $scope.rb.os_share_subject, '' , url);
                };

                $scope.initializeBundles = function(){

                    return $q.all ([I18nService.isReady(),I18nService.getResourceBundles('offeredServices')]).then(function (data) {
                        var resourceBundle =  data[1];
                        $scope.rb = resourceBundle;

                        //Initialize this 
                        $scope.pullText = resourceBundle['os_list_pull'];
                    }); 
                };

                $scope.emptyOfferedServices = function (){
                    return ($scope.offeredServiceList === undefined || $scope.offeredServiceList.length === 0);
                };
       

            }]).filter('hrefToJS', function ($sce, $sanitize) {
    return function (text) {
        var regex = /href="([\S]+)"/g;
        var newString = $sanitize(text).replace(regex, "onclick=\"angular.element(this).scope().openExternalURL('$1');return false\" href=");
        return $sce.trustAsHtml(newString);
    }
}).filter ('trustGmapsURL',function($sce,$sanitize){
    return function (url){
        return $sce.trustAsResourceUrl(url);
    }
});

