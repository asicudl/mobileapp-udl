angular.module('starter.activities')  
    .controller('ActivitiesCtrl',['$scope','$ionicPopup','$ionicListDelegate','$ionicLoading','$timeout','ActivityService','I18nService','$stateParams','_','$location','$filter','$timeout','$q','$rootScope','$cordovaSocialSharing',function($scope, $ionicPopup,$ionicListDelegate,$ionicLoading, $timeout,ActivityService,I18nService,$stateParams,_,$location,$filter,$timeout,$q,$rootScope,$cordovaSocialSharing) {

        var LOADING_TMPLT= '<i class="ion-loading-c"></i> ';
        $scope.fullEvents = false;
        $scope.activitiesList = [];
        $scope.waitForRefreshDelay = false;
        
        var changeEvents = {};
        
        $scope.pullText = '';

        $scope.$on('$ionicView.enter', function() {
            //Load the new items
            
            //In case we got updated the array of items provided by the service is another one. We must update it
            if ($scope.eventsViewInitialized && $location.$$url === '/app/activities' && !$scope.waitForRefreshDelay){
                $scope.refreshItems();
            }
        });

        $scope.$on('$stateChangeStart', function() {
            $scope.$parent.extraButtons = null;
        })

        $scope.initList = function (){
            var initialized = $q.defer();
            $scope.initializeBundles().then (function () {
                $ionicLoading.show({template: LOADING_TMPLT +  $scope.rb.ctrl_activities_initializing + "..."});
                
                $q.all ([ActivityService.getActivityItems()]).then(function (results){

                    $scope.activitiesList = results[0]; 

                    initialized.resolve();
                    $scope.eventsViewInitialized = true;

                    //In case we got updated the array of items provided by the service is another one. We must update it
                    if ($location.$$url === '/app/activities' && !$scope.waitForRefreshDelay){
                        $scope.refreshItems();
                    }
                    
                }).catch (function (error){
                    //$scope.showAlert (rb.ctrl_while_stor, $scope.commonSolution);
                    initialized.reject (); //Not necessary to show an specific code
                }).finally (function (){
                    $ionicLoading.hide();  
                });
            });
            
            return initialized.promise;
        };


        $scope.initActivityEvent = function (){
            $q.all([$scope.initializeBundles(),$scope.initList()]).then (function (){
                $scope.currentActivity = _.findWhere($scope.activitiesList,{_id: $stateParams.activityEventId});
            });

        };

        $scope.refreshItems = function (){

            if ($rootScope.routeToServicesNotAvailable){
                $scope.$broadcast('scroll.refreshComplete'); 
            }else{
                
                $q.all ([ActivityService.retrieveNewItems()]).then(function (results){
                    $scope.activitiesList = results[0];
                    
                    $scope.waitForRefreshDelay = true;
                    //Don't allow to automatic refresh until 20 minutes 
                    $timeout (function (){
                        $scope.waitForRefreshDelay = false;   
                    },20 * 60 * 1000);
                    
                }).catch (function (error){
                    //The error code is the same so just needed one check
                    if (error !== ActivityService.errorCodes.ALREADY_RETRIEVING){
                        //$scope.showRefreshListError();
                        $rootScope.routeToServicesNotAvailable = true;
                    }
                }).finally(function (){
                    $scope.$broadcast('scroll.refreshComplete'); 
                });
            }
        }; 

        
        $scope.openExternalURL = function(url){
            window.open(url, '_system');
        };
        
        $scope.shareExternalURL = function(title, url){
            $cordovaSocialSharing
                .share(title, $scope.rb.ag_share_subject, '' , url);
        };

        $scope.initializeBundles = function(){

            return $q.all ([I18nService.isReady(),I18nService.getResourceBundles('activities')]).then(function (data) {
                var resourceBundle =  data[1];
                $scope.rb = resourceBundle;

                //Initialize this 
                $scope.pullText = resourceBundle['ag_list_pull'];
            }); 
        };
        
        $scope.emptyActivities = function (){
            return ($scope.activitiesList === undefined || $scope.activitiesList.length === 0);
        };

    }]).filter('hrefToJS', function ($sce, $sanitize) {
    return function (text) {
        var regex = /href="([\S]+)"/g;
        var newString = $sanitize(text).replace(regex, "onclick=\"angular.element(this).scope().openExternalURL('$1');return false\" href=");
        return $sce.trustAsHtml(newString);
    }
});